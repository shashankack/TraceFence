import type { CampusRole } from "../security/types";
import { isBuiltinRole } from "../security/types";

export type OrgType = "college" | "small_business";

/** Display names for any gateway role id (builtin or custom). */
export type RoleLabels = Partial<Record<string, string>>;

/** Org-defined role (beyond guest/student/faculty/admin). */
export type CustomOrgRole = {
  /** Stable id used in memberships + org_policy.roles */
  id: string;
  label: string;
  /** Which console workspace this role opens */
  workspace: "student" | "faculty";
};

export type OrgProfile = {
  website?: string;
  city?: string;
  sizeBand?: string;
  roleLabels?: RoleLabels;
  customRoles?: CustomOrgRole[];
};

export function isOrgType(v: unknown): v is OrgType {
  return v === "college" || v === "small_business";
}

export function sanitizeRoleLabels(raw: unknown): RoleLabels | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const src = raw as Record<string, unknown>;
  const out: RoleLabels = {};
  for (const [key, v] of Object.entries(src)) {
    if (typeof v !== "string") continue;
    const id = key.trim().slice(0, 40);
    const t = v.trim().slice(0, 40);
    if (id && t) out[id] = t;
  }
  return Object.keys(out).length ? out : undefined;
}

export function sanitizeCustomRoles(raw: unknown): CustomOrgRole[] {
  if (!Array.isArray(raw)) return [];
  const out: CustomOrgRole[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? slugRoleId(row.id) : "";
    const label = typeof row.label === "string" ? row.label.trim().slice(0, 40) : "";
    const workspace = row.workspace === "faculty" ? "faculty" : "student";
    if (!id || !label || isBuiltinRole(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label, workspace });
  }
  return out;
}

export function slugRoleId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function workspaceForRole(
  role: CampusRole,
  customRoles?: CustomOrgRole[] | null,
): "student" | "faculty" | "admin" {
  if (role === "admin") return "admin";
  if (role === "faculty") return "faculty";
  if (role === "guest" || role === "student") return "student";
  const custom = customRoles?.find((c) => c.id === role);
  return custom?.workspace === "faculty" ? "faculty" : "student";
}
