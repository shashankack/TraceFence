import { getDb } from "../db/client";
import type { OrgProfile, OrgType } from "./types";
import { isOrgType, sanitizeCustomRoles, sanitizeRoleLabels } from "./types";

export type TenantProfileRow = {
  id: string;
  name: string;
  orgType: OrgType;
  notifyEmail: string | null;
  profile: OrgProfile;
  createdAt: string;
};

function parseProfile(json: string | null): OrgProfile {
  if (!json) return {};
  try {
    const v = JSON.parse(json) as OrgProfile;
    if (!v || typeof v !== "object") return {};
    const roleLabels = sanitizeRoleLabels(v.roleLabels);
    const customRoles = sanitizeCustomRoles(v.customRoles);
    return {
      website: typeof v.website === "string" ? v.website : undefined,
      city: typeof v.city === "string" ? v.city : undefined,
      sizeBand: typeof v.sizeBand === "string" ? v.sizeBand : undefined,
      ...(roleLabels ? { roleLabels } : {}),
      ...(customRoles.length ? { customRoles } : {}),
    };
  } catch {
    return {};
  }
}

export function getTenantProfile(tenantId: string): TenantProfileRow | null {
  const row = getDb()
    .prepare(
      `SELECT id, name, org_type as orgType, notify_email as notifyEmail,
              profile_json as profileJson, created_at as createdAt
       FROM tenants WHERE id = ?`,
    )
    .get(tenantId) as
    | {
        id: string;
        name: string;
        orgType: string;
        notifyEmail: string | null;
        profileJson: string | null;
        createdAt: string;
      }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    orgType: isOrgType(row.orgType) ? row.orgType : "college",
    notifyEmail: row.notifyEmail,
    profile: parseProfile(row.profileJson),
    createdAt: row.createdAt,
  };
}

export function updateTenantProfile(
  tenantId: string,
  patch: {
    name?: string;
    notifyEmail?: string | null;
    orgType?: OrgType;
    profile?: OrgProfile;
  },
): TenantProfileRow | null {
  const existing = getTenantProfile(tenantId);
  if (!existing) return null;

  const name = patch.name?.trim() || existing.name;
  const notifyEmail =
    patch.notifyEmail === undefined
      ? existing.notifyEmail
      : patch.notifyEmail?.trim() || null;
  const orgType = patch.orgType ?? existing.orgType;
  const merged = { ...existing.profile, ...(patch.profile ?? {}) };
  const roleLabels = sanitizeRoleLabels(merged.roleLabels);
  const customRoles = sanitizeCustomRoles(
    patch.profile && "customRoles" in patch.profile
      ? patch.profile.customRoles
      : merged.customRoles,
  );
  const profile: OrgProfile = {
    website: merged.website,
    city: merged.city,
    sizeBand: merged.sizeBand,
    ...(roleLabels ? { roleLabels } : {}),
    ...(customRoles.length ? { customRoles } : {}),
  };

  getDb()
    .prepare(
      `UPDATE tenants
       SET name = ?, org_type = ?, notify_email = ?, profile_json = ?
       WHERE id = ?`,
    )
    .run(name, orgType, notifyEmail, JSON.stringify(profile), tenantId);

  return getTenantProfile(tenantId);
}

/** Admin emails for a tenant (membership role=admin) plus notify_email. */
export function listTenantAdminEmails(tenantId: string): string[] {
  const profile = getTenantProfile(tenantId);
  const rows = getDb()
    .prepare(
      `SELECT u.email
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.tenant_id = ? AND m.role = 'admin'`,
    )
    .all(tenantId) as Array<{ email: string }>;

  const set = new Set<string>();
  for (const r of rows) set.add(r.email.toLowerCase());
  if (profile?.notifyEmail) set.add(profile.notifyEmail.toLowerCase());
  return [...set];
}
