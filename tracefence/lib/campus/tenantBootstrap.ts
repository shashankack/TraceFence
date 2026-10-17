import fs from "fs";
import path from "path";
import { getDb } from "../db/client";
import { invalidateCampusPolicyCache, loadFixturePolicy, resolveCampusRoot } from "./policy";
import { ensureChunksForTenant } from "./chunkIndex";

/** Create org_policy row from fixture template for a tenant. */
export function seedPolicyForTenant(tenantId: string) {
  const fixture = loadFixturePolicy();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO org_policy (tenant_id, policy_version, roles_json, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(tenant_id) DO NOTHING`,
    )
    .run(tenantId, fixture.policyVersion, JSON.stringify(fixture.roles), now);
  invalidateCampusPolicyCache(tenantId);
}

/** Copy fixture markdown docs into org_documents for a tenant (idempotent). */
export function seedFixtureDocumentsForTenant(tenantId: string) {
  const fixture = loadFixturePolicy();
  const root = resolveCampusRoot();
  const db = getDb();
  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO org_documents
     (tenant_id, id, title, classification, collection, enabled, content, source, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, 'fixture', ?)
     ON CONFLICT(tenant_id, id) DO NOTHING`,
  );

  for (const [docId, meta] of Object.entries(fixture.documents)) {
    const file = path.join(root, "docs", `${docId}.md`);
    const content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    insert.run(
      tenantId,
      docId,
      meta.title,
      meta.classification,
      meta.collection,
      content,
      now,
    );
  }
  ensureChunksForTenant(tenantId);
  invalidateCampusPolicyCache(tenantId);
}
