import fs from "fs";
import path from "path";
import { getDb } from "../db/client";
import { invalidateCampusPolicyCache, loadFixturePolicy, resolveCampusRoot } from "./policy";
import { ensureChunksForTenant, reindexDocument } from "./chunkIndex";

/** Create org_policy row from fixture template for a tenant. */
export function seedPolicyForTenant(tenantId: string) {
  const fixture = loadFixturePolicy();
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
    .run(tenantId, fixture.policyVersion, JSON.stringify(fixture.roles), now);
  invalidateCampusPolicyCache(tenantId);
}

/**
 * Copy fixture markdown docs into org_documents for a tenant.
 * Upserts fixture rows (title/class/collection/content) and reindexes chunks
 * so corpus updates from fixtures/campus land without deleting the DB.
 * Leaves non-fixture (admin-uploaded) rows alone.
 */
export function seedFixtureDocumentsForTenant(tenantId: string) {
  const fixture = loadFixturePolicy();
  const root = resolveCampusRoot();
  const db = getDb();
  const now = new Date().toISOString();
  const upsert = db.prepare(
    `INSERT INTO org_documents
     (tenant_id, id, title, classification, collection, enabled, content, source, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, 'fixture', ?)
     ON CONFLICT(tenant_id, id) DO UPDATE SET
       title = excluded.title,
       classification = excluded.classification,
       collection = excluded.collection,
       content = excluded.content,
       source = 'fixture',
       updated_at = excluded.updated_at
     WHERE org_documents.source = 'fixture' OR org_documents.source IS NULL`,
  );

  for (const [docId, meta] of Object.entries(fixture.documents)) {
    const file = path.join(root, "docs", `${docId}.md`);
    const content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    upsert.run(
      tenantId,
      docId,
      meta.title,
      meta.classification,
      meta.collection,
      content,
      now,
    );
    if (content) {
      reindexDocument(tenantId, docId, meta.title, content);
    }
  }
  ensureChunksForTenant(tenantId);
  invalidateCampusPolicyCache(tenantId);
}
