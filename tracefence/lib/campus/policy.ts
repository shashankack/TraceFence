import fs from "fs";
import path from "path";
import { getDb } from "../db/client";
import type { CampusRole, Decision } from "../security/types";

export type Classification = "public" | "internal" | "confidential";

export interface DocMeta {
  classification: Classification;
  collection: string;
  title: string;
}

export interface CampusPolicy {
  tenantId: string;
  policyVersion: number;
  roles: Record<
    CampusRole,
    {
      collections: string[];
      tools: Record<string, Decision>;
    }
  >;
  documents: Record<string, DocMeta>;
}

const cachedByTenant = new Map<string, CampusPolicy>();
let fixtureCached: CampusPolicy | null = null;

export function resolveCampusRoot(): string {
  const candidates = [
    path.join(process.cwd(), "..", "fixtures", "campus"),
    path.join(process.cwd(), "fixtures", "campus"),
    path.join(process.cwd(), "..", "..", "fixtures", "campus"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "policies", "roles.json"))) return c;
  }
  throw new Error("fixtures/campus not found — run from repo with campus pack");
}

/** Immutable seed from fixtures/campus (no DB overlays). */
export function loadFixturePolicy(): CampusPolicy {
  if (fixtureCached) return fixtureCached;
  const root = resolveCampusRoot();
  const raw = fs.readFileSync(
    path.join(root, "policies", "roles.json"),
    "utf8",
  );
  fixtureCached = JSON.parse(raw) as CampusPolicy;
  return fixtureCached;
}

export function invalidateCampusPolicyCache(tenantId?: string) {
  if (tenantId) cachedByTenant.delete(tenantId);
  else cachedByTenant.clear();
}

function applyOrgOverlays(tenantId: string, base: CampusPolicy): CampusPolicy {
  const db = getDb();
  base.tenantId = tenantId;

  const policyRow = db
    .prepare(
      `SELECT policy_version as policyVersion, roles_json as rolesJson
       FROM org_policy WHERE tenant_id = ?`,
    )
    .get(tenantId) as { policyVersion: number; rolesJson: string } | undefined;

  if (policyRow) {
    base.policyVersion = policyRow.policyVersion;
    base.roles = JSON.parse(policyRow.rolesJson) as CampusPolicy["roles"];
  }
  // Guest is a system role (public-only); always restore from fixture if org JSON omits it.
  if (!base.roles.guest) {
    base.roles.guest = loadFixturePolicy().roles.guest;
  }

  const docRows = db
    .prepare(
      `SELECT id, title, classification, collection, enabled
       FROM org_documents WHERE tenant_id = ?`,
    )
    .all(tenantId) as Array<{
    id: string;
    title: string;
    classification: Classification;
    collection: string;
    enabled: number;
  }>;

  // When tenant has seeded DB docs, build document map from DB only
  // (do not merge fixture ids that belong to another org).
  if (docRows.length > 0) {
    base.documents = {};
    for (const row of docRows) {
      if (row.enabled !== 1) continue;
      base.documents[row.id] = {
        title: row.title,
        classification: row.classification,
        collection: row.collection,
      };
    }
  }

  return base;
}

/**
 * Effective policy for a tenant: fixture role template + tenant SQLite overlays.
 */
export function loadCampusPolicy(tenantId: string): CampusPolicy {
  const hit = cachedByTenant.get(tenantId);
  if (hit) return hit;
  const base = structuredClone(loadFixturePolicy());
  const effective = applyOrgOverlays(tenantId, base);
  cachedByTenant.set(tenantId, effective);
  return effective;
}

export function roleAllowsCollection(
  tenantId: string,
  role: CampusRole,
  collection: string,
): boolean {
  const policy = loadCampusPolicy(tenantId);
  return policy.roles[role]?.collections.includes(collection) ?? false;
}

export function toolDecisionForRole(
  tenantId: string,
  role: CampusRole,
  tool: string,
): Decision | null {
  const policy = loadCampusPolicy(tenantId);
  return policy.roles[role]?.tools[tool] ?? null;
}
