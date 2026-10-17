import { getDb } from "../db/client";
import { ragConfig } from "../env";
import { chunkText } from "./chunking";

export interface ChunkRow {
  tenantId: string;
  docId: string;
  chunkIndex: number;
  content: string;
  page: number | null;
}

/** Drop and rebuild chunks for one document. */
export function reindexDocument(
  tenantId: string,
  docId: string,
  title: string,
  content: string,
): number {
  const db = getDb();
  db.prepare(
    `DELETE FROM doc_chunks WHERE tenant_id = ? AND doc_id = ?`,
  ).run(tenantId, docId);

  const chunks = chunkText(`${title}\n\n${content}`);
  const insert = db.prepare(
    `INSERT INTO doc_chunks
     (tenant_id, doc_id, chunk_index, content, page, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    for (const c of chunks) {
      insert.run(tenantId, docId, c.index, c.content, c.page, now);
    }
  });
  tx();
  return chunks.length;
}

export function deleteDocumentChunks(tenantId: string, docId: string) {
  getDb()
    .prepare(`DELETE FROM doc_chunks WHERE tenant_id = ? AND doc_id = ?`)
    .run(tenantId, docId);
}

/** Ensure every org_documents row has chunks (lazy repair after migrate). */
export function ensureChunksForTenant(tenantId: string) {
  const db = getDb();
  const docs = db
    .prepare(
      `SELECT id, title, content, enabled FROM org_documents WHERE tenant_id = ?`,
    )
    .all(tenantId) as Array<{
    id: string;
    title: string;
    content: string;
    enabled: number;
  }>;

  for (const doc of docs) {
    if (doc.enabled !== 1 || !doc.content) {
      deleteDocumentChunks(tenantId, doc.id);
      continue;
    }
    const count = db
      .prepare(
        `SELECT COUNT(*) as n FROM doc_chunks
         WHERE tenant_id = ? AND doc_id = ?`,
      )
      .get(tenantId, doc.id) as { n: number };
    if (count.n === 0) {
      reindexDocument(tenantId, doc.id, doc.title, doc.content);
    }
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreChunk(query: string, content: string, titleBoost: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const terms = q.split(/\s+/).filter((t) => t.length >= 3);
  if (!terms.length) return 0;
  const hay = `${titleBoost}\n${content}`.toLowerCase();
  let score = 0;
  for (const t of terms) {
    const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(t)}(?:[^a-z0-9]|$)`, "g");
    const matches = hay.match(re);
    if (matches) score += matches.length;
  }
  return score;
}

/**
 * ACL-aware chunk search. Caller must pass only allowed docIds.
 * Returns top-k chunks (not full documents).
 */
export function searchChunks(input: {
  tenantId: string;
  allowedDocIds: string[];
  query: string;
  titlesByDocId: Record<string, string>;
}): Array<ChunkRow & { score: number }> {
  const { topK } = ragConfig();
  if (!input.allowedDocIds.length) return [];

  ensureChunksForTenant(input.tenantId);

  const db = getDb();
  const placeholders = input.allowedDocIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT tenant_id as tenantId, doc_id as docId, chunk_index as chunkIndex,
              content, page
       FROM doc_chunks
       WHERE tenant_id = ? AND doc_id IN (${placeholders})`,
    )
    .all(input.tenantId, ...input.allowedDocIds) as Array<{
    tenantId: string;
    docId: string;
    chunkIndex: number;
    content: string;
    page: number | null;
  }>;

  const scored = rows
    .map((row) => ({
      ...row,
      score: scoreChunk(
        input.query,
        row.content,
        input.titlesByDocId[row.docId] ?? "",
      ),
    }))
    .filter((r) => r.score > 0);

  scored.sort((a, b) => b.score - a.score || a.chunkIndex - b.chunkIndex);

  // Diversify: at most 2 chunks per doc unless topK is small
  const perDoc = new Map<string, number>();
  const picked: Array<ChunkRow & { score: number }> = [];
  for (const row of scored) {
    const n = perDoc.get(row.docId) ?? 0;
    if (n >= 2) continue;
    perDoc.set(row.docId, n + 1);
    picked.push(row);
    if (picked.length >= topK) break;
  }
  return picked;
}
