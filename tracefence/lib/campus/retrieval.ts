import fs from "fs";
import path from "path";
import {
  loadCampusPolicy,
  resolveCampusRoot,
  roleAllowsCollection,
  type DocMeta,
} from "./policy";
import { getDocumentContentOverride } from "./orgStore";
import { searchChunks } from "./chunkIndex";
import type { CampusRole } from "../security/types";
import { ReasonCode } from "../security/reasonCodes";

export interface RetrievedDoc {
  docId: string;
  title: string;
  classification: string;
  collection: string;
  excerpt: string;
  /** Chunk text for LLM context — not the full document. */
  content: string;
  chunkIndex?: number;
  page?: number | null;
}

export interface RetrievalResult {
  hits: RetrievedDoc[];
  filteredOut: string[];
  reasonCode: typeof ReasonCode.ALLOWED | typeof ReasonCode.RETRIEVAL_FILTERED;
}

function readDocContent(tenantId: string, docId: string): string | null {
  const override = getDocumentContentOverride(tenantId, docId);
  if (override !== null) return override;
  const root = resolveCampusRoot();
  const file = path.join(root, "docs", `${docId}.md`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}

/**
 * Permission-filtered chunk RAG. Unauthorized docs never appear in hits.
 * Returns top chunks only — full PDFs/policies never enter the LLM prompt.
 */
export function searchDocs(
  tenantId: string,
  role: CampusRole,
  query: string,
  collection?: string,
): RetrievalResult {
  const policy = loadCampusPolicy(tenantId);
  const filteredOut: string[] = [];
  const allowedDocIds: string[] = [];
  const titlesByDocId: Record<string, string> = {};
  const metaByDocId: Record<string, DocMeta> = {};

  for (const [docId, meta] of Object.entries(policy.documents)) {
    if (collection && meta.collection !== collection) continue;
    if (!roleAllowsCollection(tenantId, role, meta.collection)) {
      filteredOut.push(docId);
      continue;
    }
    allowedDocIds.push(docId);
    titlesByDocId[docId] = meta.title;
    metaByDocId[docId] = meta;
  }

  const chunks = searchChunks({
    tenantId,
    allowedDocIds,
    query,
    titlesByDocId,
  });

  const hits: RetrievedDoc[] = chunks.map((c) => {
    const meta = metaByDocId[c.docId];
    const loc = c.page != null ? ` · p.${c.page}` : ` · §${c.chunkIndex}`;
    return {
      docId: c.docId,
      title: `${meta?.title ?? c.docId}${loc}`,
      classification: meta?.classification ?? "public",
      collection: meta?.collection ?? "public",
      excerpt: c.content.slice(0, 280),
      content: c.content,
      chunkIndex: c.chunkIndex,
      page: c.page,
    };
  });

  return {
    hits,
    filteredOut,
    reasonCode: hits.length
      ? ReasonCode.ALLOWED
      : ReasonCode.RETRIEVAL_FILTERED,
  };
}

export function readDocument(
  tenantId: string,
  role: CampusRole,
  docId: string,
):
  | { ok: true; doc: RetrievedDoc }
  | {
      ok: false;
      reasonCode:
        | typeof ReasonCode.DENIED_COLLECTION
        | typeof ReasonCode.DENIED_SCOPE;
    } {
  const policy = loadCampusPolicy(tenantId);
  const meta = policy.documents[docId];
  if (!meta) {
    return { ok: false, reasonCode: ReasonCode.DENIED_SCOPE };
  }
  if (!roleAllowsCollection(tenantId, role, meta.collection)) {
    return { ok: false, reasonCode: ReasonCode.DENIED_COLLECTION };
  }
  const content = readDocContent(tenantId, docId);
  if (!content) {
    return { ok: false, reasonCode: ReasonCode.DENIED_SCOPE };
  }
  // Cap tool reads so a 40-page PDF cannot flood a single tool result.
  const capped =
    content.length > 12_000
      ? `${content.slice(0, 12_000)}\n\n[…truncated for gateway safety]`
      : content;
  return {
    ok: true,
    doc: {
      docId,
      title: meta.title,
      classification: meta.classification,
      collection: meta.collection,
      excerpt: capped.slice(0, 280),
      content: capped,
    },
  };
}
