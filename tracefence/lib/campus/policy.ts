import fs from "fs";
import path from "path";
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

let cached: CampusPolicy | null = null;

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

export function loadCampusPolicy(): CampusPolicy {
  if (cached) return cached;
  const root = resolveCampusRoot();
  const raw = fs.readFileSync(
    path.join(root, "policies", "roles.json"),
    "utf8",
  );
  cached = JSON.parse(raw) as CampusPolicy;
  return cached;
}

export function roleAllowsCollection(
  role: CampusRole,
  collection: string,
): boolean {
  const policy = loadCampusPolicy();
  return policy.roles[role]?.collections.includes(collection) ?? false;
}

export function toolDecisionForRole(
  role: CampusRole,
  tool: string,
): Decision | null {
  const policy = loadCampusPolicy();
  return policy.roles[role]?.tools[tool] ?? null;
}
