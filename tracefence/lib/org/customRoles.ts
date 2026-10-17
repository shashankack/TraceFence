import { getDb } from "../db/client";
import {
  invalidateCampusPolicyCache,
  loadCampusPolicy,
  loadFixturePolicy,
} from "../campus/policy";
import type { Decision } from "../security/types";
import { isBuiltinRole } from "../security/types";
import {
  getTenantProfile,
  updateTenantProfile,
} from "./tenantProfile";
import type { CustomOrgRole } from "./types";
import { slugRoleId } from "./types";

function defaultToolsFromStudent(): Record<string, Decision> {
  const student = loadFixturePolicy().roles.student;
  return { ...(student?.tools ?? {}) };
}

function defaultCollectionsFromStudent(): string[] {
  return [...(loadFixturePolicy().roles.student?.collections ?? ["public"])];
}

/** Ensure org_policy has an entry for this role id. */
export function ensurePolicyRole(tenantId: string, roleId: string) {
  const policy = loadCampusPolicy(tenantId);
  if (policy.roles[roleId]) return;
  const roles = {
    ...policy.roles,
    [roleId]: {
      collections: defaultCollectionsFromStudent(),
      tools: defaultToolsFromStudent(),
    },
  };
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
    .run(tenantId, nextVersion, JSON.stringify(roles), now);
  invalidateCampusPolicyCache(tenantId);
}

export function dropPolicyRole(tenantId: string, roleId: string) {
  if (isBuiltinRole(roleId)) return;
  const policy = loadCampusPolicy(tenantId);
  if (!policy.roles[roleId]) return;
  const roles = { ...policy.roles };
  delete roles[roleId];
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
    .run(tenantId, nextVersion, JSON.stringify(roles), now);
  invalidateCampusPolicyCache(tenantId);
}

export function addCustomRole(
  tenantId: string,
  input: { label: string; workspace?: "student" | "faculty"; id?: string },
):
  | { ok: true; role: CustomOrgRole }
  | { ok: false; error: string } {
  const label = input.label.trim().slice(0, 40);
  if (!label) return { ok: false, error: "Label required" };

  const baseId = slugRoleId(input.id || label);
  if (!baseId) return { ok: false, error: "Invalid role id" };
  if (isBuiltinRole(baseId)) {
    return { ok: false, error: "Cannot reuse a built-in role id" };
  }

  const profile = getTenantProfile(tenantId);
  if (!profile) return { ok: false, error: "Tenant not found" };

  const existing = profile.profile.customRoles ?? [];
  let id = baseId;
  let n = 2;
  while (existing.some((r) => r.id === id) || isBuiltinRole(id)) {
    id = `${baseId}-${n}`.slice(0, 40);
    n += 1;
  }

  const role: CustomOrgRole = {
    id,
    label,
    workspace: input.workspace === "faculty" ? "faculty" : "student",
  };

  updateTenantProfile(tenantId, {
    profile: {
      ...profile.profile,
      customRoles: [...existing, role],
      roleLabels: { ...profile.profile.roleLabels, [id]: label },
    },
  });
  ensurePolicyRole(tenantId, id);
  return { ok: true, role };
}

export function removeCustomRole(
  tenantId: string,
  roleId: string,
): { ok: true } | { ok: false; error: string } {
  if (isBuiltinRole(roleId)) {
    return { ok: false, error: "Built-in roles cannot be deleted" };
  }

  const members = getDb()
    .prepare(
      `SELECT COUNT(*) as n FROM memberships WHERE tenant_id = ? AND role = ?`,
    )
    .get(tenantId, roleId) as { n: number };
  if (members.n > 0) {
    return {
      ok: false,
      error: `Reassign ${members.n} member(s) before deleting this role`,
    };
  }

  const profile = getTenantProfile(tenantId);
  if (!profile) return { ok: false, error: "Tenant not found" };

  const nextCustom = (profile.profile.customRoles ?? []).filter((r) => r.id !== roleId);
  const nextLabels = { ...profile.profile.roleLabels };
  delete nextLabels[roleId];

  updateTenantProfile(tenantId, {
    profile: {
      ...profile.profile,
      customRoles: nextCustom,
      roleLabels: nextLabels,
    },
  });
  dropPolicyRole(tenantId, roleId);
  return { ok: true };
}

export function listTenantMembers(tenantId: string) {
  return getDb()
    .prepare(
      `SELECT u.id as userId, u.email, u.display_name as displayName, m.role
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.tenant_id = ?
       ORDER BY u.email`,
    )
    .all(tenantId) as Array<{
    userId: string;
    email: string;
    displayName: string | null;
    role: string;
  }>;
}

export function setMemberRole(
  tenantId: string,
  userId: string,
  role: string,
): { ok: true } | { ok: false; error: string } {
  const policy = loadCampusPolicy(tenantId);
  if (!policy.roles[role] && role !== "guest") {
    return { ok: false, error: "Unknown role for this organization" };
  }
  if (role === "guest") {
    return { ok: false, error: "Guest is not a membership role" };
  }

  const row = getDb()
    .prepare(
      `SELECT role FROM memberships WHERE tenant_id = ? AND user_id = ?`,
    )
    .get(tenantId, userId) as { role: string } | undefined;
  if (!row) return { ok: false, error: "Member not found" };

  // Keep at least one admin.
  if (row.role === "admin" && role !== "admin") {
    const admins = getDb()
      .prepare(
        `SELECT COUNT(*) as n FROM memberships WHERE tenant_id = ? AND role = 'admin'`,
      )
      .get(tenantId) as { n: number };
    if (admins.n <= 1) {
      return { ok: false, error: "Cannot demote the last admin" };
    }
  }

  getDb()
    .prepare(
      `UPDATE memberships SET role = ? WHERE tenant_id = ? AND user_id = ?`,
    )
    .run(role, tenantId, userId);
  return { ok: true };
}

export function assignableRoleIds(tenantId: string): string[] {
  const policy = loadCampusPolicy(tenantId);
  return Object.keys(policy.roles).filter((r) => r !== "guest");
}
