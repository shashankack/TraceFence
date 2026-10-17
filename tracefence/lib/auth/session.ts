import { randomBytes } from "crypto";
import { getDb } from "../db/client";
import { sanitizeCustomRoles, sanitizeRoleLabels } from "../org/types";
import type { CampusRole } from "../security/types";
import type { AuthContext } from "./types";

const AUTH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function createAuthSession(input: {
  userId: string;
  tenantId: string;
  role: CampusRole;
}): { token: string; expiresAt: string } {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + AUTH_TTL_MS).toISOString();
  getDb()
    .prepare(
      `INSERT INTO auth_sessions (token, user_id, tenant_id, role, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      token,
      input.userId,
      input.tenantId,
      input.role,
      expiresAt,
      now.toISOString(),
    );
  return { token, expiresAt };
}

export function revokeAuthSession(token: string) {
  getDb().prepare(`DELETE FROM auth_sessions WHERE token = ?`).run(token);
}

export function resolveAuthToken(token: string): AuthContext | null {
  const row = getDb()
    .prepare(
      `SELECT a.token, a.user_id as userId, a.tenant_id as tenantId, a.role,
              a.expires_at as expiresAt,
              u.email, u.display_name as displayName,
              t.name as tenantName, t.org_type as orgType,
              t.profile_json as profileJson
       FROM auth_sessions a
       JOIN users u ON u.id = a.user_id
       JOIN tenants t ON t.id = a.tenant_id
       WHERE a.token = ?`,
    )
    .get(token) as
    | {
        token: string;
        userId: string;
        tenantId: string;
        role: CampusRole;
        expiresAt: string;
        email: string;
        displayName: string;
        tenantName: string;
        orgType: string | null;
        profileJson: string | null;
      }
    | undefined;

  if (!row) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    revokeAuthSession(token);
    return null;
  }

  let roleLabels: AuthContext["roleLabels"];
  let customRoles: AuthContext["customRoles"];
  if (row.profileJson) {
    try {
      const profile = JSON.parse(row.profileJson) as {
        roleLabels?: unknown;
        customRoles?: unknown;
      };
      roleLabels = sanitizeRoleLabels(profile.roleLabels);
      const custom = sanitizeCustomRoles(profile.customRoles);
      if (custom.length) customRoles = custom;
    } catch {
      roleLabels = undefined;
      customRoles = undefined;
    }
  }

  return {
    token: row.token,
    userId: row.userId,
    email: row.email,
    displayName: row.displayName,
    tenantId: row.tenantId,
    tenantName: row.tenantName,
    orgType: row.orgType === "small_business" ? "small_business" : "college",
    ...(roleLabels ? { roleLabels } : {}),
    ...(customRoles ? { customRoles } : {}),
    role: row.role,
  };
}

export function bearerTokenFromRequest(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim() || null;
  }
  return req.headers.get("x-auth-token");
}
