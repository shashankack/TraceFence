import { randomUUID } from "crypto";
import { getDb } from "../db/client";
import type { CampusRole } from "../security/types";
import { seedBusinessDocumentsForTenant } from "../campus/businessSeed";
import {
  seedFixtureDocumentsForTenant,
  seedPolicyForTenant,
} from "../campus/tenantBootstrap";
import type { OrgType } from "../org/types";
import { isOrgType } from "../org/types";
import { hashPassword, verifyPassword } from "./password";
import { createAuthSession, revokeAuthSession } from "./session";

const DEFAULT_TENANT = "nulltrace-institute";

function slugifyTenant(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || `org_${randomUUID().slice(0, 8)}`;
}

export function signup(input: {
  email: string;
  password: string;
  displayName?: string;
  tenantName?: string;
  orgType?: OrgType;
  notifyEmail?: string;
}):
  | {
      ok: true;
      userId: string;
      tenantId: string;
      role: CampusRole;
      token: string;
      expiresAt: string;
    }
  | { ok: false; status: number; error: string } {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@") || input.password.length < 8) {
    return {
      ok: false,
      status: 400,
      error: "Valid email and password (min 8 chars) required",
    };
  }

  const db = getDb();
  const existing = db
    .prepare(`SELECT id FROM users WHERE email = ?`)
    .get(email);
  if (existing) {
    return { ok: false, status: 409, error: "Email already registered" };
  }

  const userId = `usr_${randomUUID().slice(0, 12)}`;
  const displayName = input.displayName?.trim() || email.split("@")[0];
  const now = new Date().toISOString();
  const passwordHash = hashPassword(input.password);
  const orgType: OrgType = isOrgType(input.orgType) ? input.orgType : "college";
  const notifyEmail =
    input.notifyEmail?.trim().toLowerCase() || email;

  let tenantId = DEFAULT_TENANT;
  let role: CampusRole = "student";

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO users (id, email, password_hash, display_name, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(userId, email, passwordHash, displayName, now);

    if (input.tenantName?.trim()) {
      tenantId = slugifyTenant(input.tenantName);
      const clash = db
        .prepare(`SELECT id FROM tenants WHERE id = ?`)
        .get(tenantId);
      if (clash) {
        tenantId = `${tenantId}-${randomUUID().slice(0, 6)}`;
      }
      db.prepare(
        `INSERT INTO tenants (id, name, org_type, notify_email, profile_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        tenantId,
        input.tenantName.trim(),
        orgType,
        notifyEmail,
        JSON.stringify({}),
        now,
      );
      role = "admin";
      seedPolicyForTenant(tenantId);
      if (orgType === "small_business") {
        seedBusinessDocumentsForTenant(tenantId);
      } else {
        seedFixtureDocumentsForTenant(tenantId);
      }
    } else {
      const tenant = db
        .prepare(`SELECT id FROM tenants WHERE id = ?`)
        .get(DEFAULT_TENANT);
      if (!tenant) {
        throw new Error("Default tenant missing  run seed first");
      }
      role = "student";
    }

    db.prepare(
      `INSERT INTO memberships (user_id, tenant_id, role, created_at)
       VALUES (?, ?, ?, ?)`,
    ).run(userId, tenantId, role, now);
  });

  try {
    tx();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signup failed";
    return { ok: false, status: 500, error: message };
  }

  const session = createAuthSession({ userId, tenantId, role });
  return {
    ok: true,
    userId,
    tenantId,
    role,
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

export function login(input: {
  email: string;
  password: string;
  tenantId?: string;
}):
  | {
      ok: true;
      userId: string;
      tenantId: string;
      role: CampusRole;
      token: string;
      expiresAt: string;
      memberships: Array<{ tenantId: string; tenantName: string; role: CampusRole }>;
    }
  | { ok: false; status: number; error: string } {
  const email = input.email.trim().toLowerCase();
  const db = getDb();
  const user = db
    .prepare(
      `SELECT id, password_hash as passwordHash FROM users WHERE email = ?`,
    )
    .get(email) as { id: string; passwordHash: string } | undefined;

  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    return { ok: false, status: 401, error: "Invalid email or password" };
  }

  const memberships = db
    .prepare(
      `SELECT m.tenant_id as tenantId, t.name as tenantName, m.role
       FROM memberships m
       JOIN tenants t ON t.id = m.tenant_id
       WHERE m.user_id = ?
       ORDER BY t.name`,
    )
    .all(user.id) as Array<{
    tenantId: string;
    tenantName: string;
    role: CampusRole;
  }>;

  if (!memberships.length) {
    return { ok: false, status: 403, error: "No tenant memberships" };
  }

  const chosen =
    (input.tenantId
      ? memberships.find((m) => m.tenantId === input.tenantId)
      : undefined) ?? memberships[0];

  if (input.tenantId && !memberships.some((m) => m.tenantId === input.tenantId)) {
    return { ok: false, status: 403, error: "Not a member of that tenant" };
  }

  const session = createAuthSession({
    userId: user.id,
    tenantId: chosen.tenantId,
    role: chosen.role,
  });

  return {
    ok: true,
    userId: user.id,
    tenantId: chosen.tenantId,
    role: chosen.role,
    token: session.token,
    expiresAt: session.expiresAt,
    memberships,
  };
}

export function listMemberships(userId: string) {
  return getDb()
    .prepare(
      `SELECT m.tenant_id as tenantId, t.name as tenantName, m.role
       FROM memberships m
       JOIN tenants t ON t.id = m.tenant_id
       WHERE m.user_id = ?
       ORDER BY t.name`,
    )
    .all(userId) as Array<{
    tenantId: string;
    tenantName: string;
    role: CampusRole;
  }>;
}

/** Switch active tenant/role for an authenticated user; revokes old token. */
export function switchTenant(input: {
  userId: string;
  currentToken: string;
  tenantId: string;
}):
  | {
      ok: true;
      tenantId: string;
      role: CampusRole;
      token: string;
      expiresAt: string;
    }
  | { ok: false; status: number; error: string } {
  const memberships = listMemberships(input.userId);
  const chosen = memberships.find((m) => m.tenantId === input.tenantId);
  if (!chosen) {
    return { ok: false, status: 403, error: "Not a member of that tenant" };
  }

  revokeAuthSession(input.currentToken);

  const session = createAuthSession({
    userId: input.userId,
    tenantId: chosen.tenantId,
    role: chosen.role,
  });

  return {
    ok: true,
    tenantId: chosen.tenantId,
    role: chosen.role,
    token: session.token,
    expiresAt: session.expiresAt,
  };
}
