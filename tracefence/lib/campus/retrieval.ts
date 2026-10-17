import fs from "fs";
import path from "path";
import {
  loadCampusPolicy,
  resolveCampusRoot,
  roleAllowsCollection,
  type DocMeta,
} from "./policy";
import { getDocumentContentOverride } from "./orgStore";
import type { CampusRole } from "../security/types";
import { ReasonCode } from "../security/reasonCodes";

export interface RetrievedDoc {
  docId: string;
  title: string;
  classification: string;
  collection: string;
  excerpt: string;
  content: string;
}

export interface RetrievalResult {
  hits: RetrievedDoc[];
  filteredOut: string[];
  reasonCode: typeof ReasonCode.ALLOWED | typeof ReasonCode.RETRIEVAL_FILTERED;
}

function readDocContent(tenantId: string, docId: string): string | null {
  const override = getDocumentContentOverride(tenantId, docId);
  if (override !== null) return override;
  // Fallback for tenants that still reference fixture filenames
  const root = resolveCampusRoot();
  const file = path.join(root, "docs", `${docId}.md`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}

function scoreDoc(query: string, content: string, meta: DocMeta): number {
  const q = query.toLowerCase();
  const hay = `${meta.title}\n${content}`.toLowerCase();
  if (!q.trim()) return 0;
  const terms = q.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const t of terms) {
    if (hay.includes(t)) score += 1;
  }
  return score;
}

/**
 * Permission-filtered search. Unauthorized docs never appear in hits.
 * Scoped to a single tenant — no cross-tenant leakage.
 */
export function searchDocs(
  tenantId: string,
  role: CampusRole,
  query: string,
  collection?: string,
): RetrievalResult {
  const policy = loadCampusPolicy(tenantId);
  const filteredOut: string[] = [];
  const scored: Array<{
    docId: string;
    meta: DocMeta;
    content: string;
    score: number;
  }> = [];

  for (const [docId, meta] of Object.entries(policy.documents)) {
    if (collection && meta.collection !== collection) continue;
    if (!roleAllowsCollection(tenantId, role, meta.collection)) {
      filteredOut.push(docId);
      continue;
    }
    const content = readDocContent(tenantId, docId);
    if (!content) continue;
    const score = scoreDoc(query, content, meta);
    if (score > 0 || !query.trim()) {
      scored.push({ docId, meta, content, score: score || 0.1 });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const hits = scored.slice(0, 5).map(({ docId, meta, content }) => ({
    docId,
    title: meta.title,
    classification: meta.classification,
    collection: meta.collection,
    excerpt: content.slice(0, 280),
    content,
  }));

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
  return {
    ok: true,
    doc: {
      docId,
      title: meta.title,
      classification: meta.classification,
      collection: meta.collection,
      excerpt: content.slice(0, 280),
      content,
    },
  };
}
