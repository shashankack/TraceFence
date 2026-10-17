import { getDb } from "../db/client";
import { createAuthSession } from "./session";
import { hashPassword } from "./password";

const GUEST_USER_ID = "usr_guest_public";
const GUEST_EMAIL = "guest@nulltrace.demo";
const DEFAULT_TENANT = "nulltrace-institute";

/** Idempotent guest principal — public corpus only, no password login. */
export function ensureGuestUser(): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, display_name, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO NOTHING`,
  ).run(
    GUEST_USER_ID,
    GUEST_EMAIL,
    hashPassword(`guest-no-login-${GUEST_USER_ID}`),
    "Public Guest",
    now,
  );
  // Email unique — if id conflict skipped but email exists under other id, ignore.
  db.prepare(
    `INSERT INTO memberships (user_id, tenant_id, role, created_at)
     VALUES (?, ?, 'guest', ?)
     ON CONFLICT(user_id, tenant_id) DO UPDATE SET role = 'guest'`,
  ).run(GUEST_USER_ID, DEFAULT_TENANT, now);
}

export function issueGuestToken(): {
  token: string;
  expiresAt: string;
  userId: string;
  tenantId: string;
  role: "guest";
  displayName: string;
  email: string;
} {
  ensureGuestUser();
  const session = createAuthSession({
    userId: GUEST_USER_ID,
    tenantId: DEFAULT_TENANT,
    role: "guest",
  });
  return {
    token: session.token,
    expiresAt: session.expiresAt,
    userId: GUEST_USER_ID,
    tenantId: DEFAULT_TENANT,
    role: "guest",
    displayName: "Public Guest",
    email: GUEST_EMAIL,
  };
}
