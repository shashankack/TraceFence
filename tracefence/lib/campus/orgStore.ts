import { randomUUID } from "crypto";
import { getDb } from "../db/client";
import {
  invalidateCampusPolicyCache,
  loadCampusPolicy,
  type CampusPolicy,
  type Classification,
} from "./policy";
import { deleteDocumentChunks, reindexDocument } from "./chunkIndex";
import { stripContentPolicyClaims } from "./contentGuards";
import type { CampusRole, Decision } from "../security/types";

export interface OrgDocumentRow {
  id: string;
  title: string;
  classification: Classification;
  collection: string;
  enabled: boolean;
  content: string;
  source: "fixture" | "upload";
  updatedAt: string;
}

type RolesJson = CampusPolicy["roles"];

function bumpPolicyVersion(tenantId: string) {
  const policy = loadCampusPolicy(tenantId);
  const nextVersion = policy.policyVersion + 1;
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO org_policy (tenant_id, policy_version, roles_json, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(tenant_id) DO UPDATE SET
         policy_version = excluded.policy_version,
         roles_json = excluded.roles_json,
         updated_at = excluded.updated_at`,
    )
    .run(tenantId, nextVersion, JSON.stringify(policy.roles), now);
  invalidateCampusPolicyCache(tenantId);
}

export function listOrgDocuments(tenantId: string): OrgDocumentRow[] {
  const rows = getDb()
    .prepare(
      `SELECT id, title, classification, collection, enabled, content, source,
              updated_at as updatedAt
       FROM org_documents WHERE tenant_id = ?
       ORDER BY id`,
    )
    .all(tenantId) as Array<{
    id: string;
    title: string;
    classification: Classification;
    collection: string;
    enabled: number;
    content: string;
    source: string;
    updatedAt: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    classification: row.classification,
    collection: row.collection,
    enabled: row.enabled === 1,
    content: row.content,
    source: row.source === "upload" ? "upload" : "fixture",
    updatedAt: row.updatedAt,
  }));
}

export function getDocumentContentOverride(
  tenantId: string,
  docId: string,
): string | null {
  const row = getDb()
    .prepare(
      `SELECT content, enabled FROM org_documents
       WHERE tenant_id = ? AND id = ?`,
    )
    .get(tenantId, docId) as { content: string; enabled: number } | undefined;
  if (!row) return null;
  if (row.enabled !== 1) return null;
  if (!row.content) return null;
  return row.content;
}

export function createOrgDocument(
  tenantId: string,
  input: {
    id?: string;
    title: string;
    classification: Classification;
    collection: string;
    content: string;
  },
): OrgDocumentRow {
  const id =
    input.id?.trim() ||
    `doc_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
  const now = new Date().toISOString();
  // Content cannot self-elevate classification or rewrite policy  admin args win.
  const { content: safeContent } = stripContentPolicyClaims(input.content);
  getDb()
    .prepare(
      `INSERT INTO org_documents
       (tenant_id, id, title, classification, collection, enabled, content, source, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, 'upload', ?)`,
    )
    .run(
      tenantId,
      id,
      input.title,
      input.classification,
      input.collection,
      safeContent,
      now,
    );

  invalidateCampusPolicyCache(tenantId);
  bumpPolicyVersion(tenantId);
  reindexDocument(tenantId, id, input.title, safeContent);

  return {
    id,
    title: input.title,
    classification: input.classification,
    collection: input.collection,
    enabled: true,
    content: safeContent,
    source: "upload",
    updatedAt: now,
  };
}

export function patchOrgDocument(
  tenantId: string,
  id: string,
  patch: {
    title?: string;
    classification?: Classification;
    collection?: string;
    enabled?: boolean;
    content?: string;
  },
): OrgDocumentRow | null {
  const existing = listOrgDocuments(tenantId).find((d) => d.id === id);
  if (!existing) return null;

  const title = patch.title ?? existing.title;
  const classification = patch.classification ?? existing.classification;
  const collection = patch.collection ?? existing.collection;
  const enabled = patch.enabled ?? existing.enabled;
  const priorContent =
    getDocumentContentOverride(tenantId, id) ?? existing.content ?? "";
  const rawContent = patch.content ?? priorContent;
  const content = patch.content
    ? stripContentPolicyClaims(rawContent).content
    : rawContent;
  const now = new Date().toISOString();
  const source = existing.source === "upload" ? "upload" : "fixture";

  getDb()
    .prepare(
      `INSERT INTO org_documents
       (tenant_id, id, title, classification, collection, enabled, content, source, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(tenant_id, id) DO UPDATE SET
         title = excluded.title,
         classification = excluded.classification,
         collection = excluded.collection,
         enabled = excluded.enabled,
         content = excluded.content,
         source = excluded.source,
         updated_at = excluded.updated_at`,
    )
    .run(
      tenantId,
      id,
      title,
      classification,
      collection,
      enabled ? 1 : 0,
      content,
      source,
      now,
    );

  invalidateCampusPolicyCache(tenantId);
  bumpPolicyVersion(tenantId);
  if (!enabled) {
    deleteDocumentChunks(tenantId, id);
  } else {
    reindexDocument(tenantId, id, title, content);
  }

  return {
    id,
    title,
    classification,
    collection,
    enabled,
    content,
    source,
    updatedAt: now,
  };
}

export function replaceOrgPolicy(
  tenantId: string,
  roles: RolesJson,
): CampusPolicy {
  const current = loadCampusPolicy(tenantId);
  const nextVersion = current.policyVersion + 1;
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO org_policy (tenant_id, policy_version, roles_json, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(tenant_id) DO UPDATE SET
         policy_version = excluded.policy_version,
         roles_json = excluded.roles_json,
         updated_at = excluded.updated_at`,
    )
    .run(tenantId, nextVersion, JSON.stringify(roles), now);
  invalidateCampusPolicyCache(tenantId);
  return loadCampusPolicy(tenantId);
}

export function assertValidRoles(roles: unknown): roles is RolesJson {
  if (!roles || typeof roles !== "object") return false;
  const required: CampusRole[] = ["student", "faculty", "admin"];
  for (const role of required) {
    const entry = (roles as Record<string, unknown>)[role];
    if (!entry || typeof entry !== "object") return false;
    const e = entry as { collections?: unknown; tools?: unknown };
    if (!Array.isArray(e.collections)) return false;
    if (!e.tools || typeof e.tools !== "object") return false;
    for (const decision of Object.values(e.tools as Record<string, unknown>)) {
      if (
        decision !== "ALLOW" &&
        decision !== "DENY" &&
        decision !== "REQUIRE_APPROVAL"
      ) {
        return false;
      }
    }
  }
  return true;
}

export type { Decision };
