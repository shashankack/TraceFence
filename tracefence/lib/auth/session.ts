import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getDb } from "../db/client";
import { isDemoMode } from "../env";
import { sanitizeCustomRoles, sanitizeRoleLabels } from "../org/types";
import type { CampusRole } from "../security/types";
import type { AuthContext } from "./types";

const AUTH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TOKEN_PREFIX = "tf1";

type SignedPayload = {
  u: string; // userId
  t: string; // tenantId
  r: CampusRole;
  e: number; // expiresAt epoch ms
  n: string; // nonce
};

/**
 * Shared HMAC secret across all serverless instances.
 * Without this, DB-backed auth_sessions die on Vercel (/tmp is per-instance).
 */
function authSecret(): string {
  const fromEnv = process.env.AUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;
  // Stable demo fallback so instances agree even if AUTH_SECRET wasn't set.
  if (process.env.VERCEL || isDemoMode()) {
    return "tracefence-hackathon-demo-auth-v1";
  }
  return "tracefence-local-dev-auth";
}

function b64url(data: string | Buffer): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function signPayload(payload: SignedPayload): string {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(
    createHmac("sha256", authSecret()).update(body).digest(),
  );
  return `${TOKEN_PREFIX}.${body}.${sig}`;
}

function verifySignedToken(token: string): SignedPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) return null;
  const [, body, sig] = parts;
  const expect = b64url(
    createHmac("sha256", authSecret()).update(body).digest(),
  );
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expect);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(fromB64url(body).toString("utf8")) as SignedPayload;
    if (
      !payload?.u ||
      !payload?.t ||
      !payload?.r ||
      typeof payload.e !== "number"
    ) {
      return null;
    }
    if (payload.e < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function loadAuthContext(
  token: string,
  userId: string,
  tenantId: string,
  role: CampusRole,
): AuthContext | null {
  const row = getDb()
    .prepare(
      `SELECT u.email, u.display_name as displayName,
              t.name as tenantName, t.org_type as orgType,
              t.profile_json as profileJson
       FROM users u
       JOIN tenants t ON t.id = ?
       WHERE u.id = ?`,
    )
    .get(tenantId, userId) as
    | {
        email: string;
        displayName: string;
        tenantName: string;
        orgType: string | null;
        profileJson: string | null;
      }
    | undefined;

  if (!row) return null;

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
    token,
    userId,
    email: row.email,
    displayName: row.displayName,
    tenantId,
    tenantName: row.tenantName,
    orgType: row.orgType === "small_business" ? "small_business" : "college",
    ...(roleLabels ? { roleLabels } : {}),
    ...(customRoles ? { customRoles } : {}),
    role,
  };
}

export function createAuthSession(input: {
  userId: string;
  tenantId: string;
  role: CampusRole;
}): { token: string; expiresAt: string } {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + AUTH_TTL_MS);
  const token = signPayload({
    u: input.userId,
    t: input.tenantId,
    r: input.role,
    e: expiresAt.getTime(),
    n: randomBytes(8).toString("hex"),
  });

  // Best-effort local row (helps same-instance logout). Not required for verify.
  try {
    getDb()
      .prepare(
        `INSERT OR REPLACE INTO auth_sessions
         (token, user_id, tenant_id, role, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        token,
        input.userId,
        input.tenantId,
        input.role,
        expiresAt.toISOString(),
        now.toISOString(),
      );
  } catch {
    /* ephemeral /tmp races are fine — signature is the source of truth */
  }

  return { token, expiresAt: expiresAt.toISOString() };
}

export function revokeAuthSession(token: string) {
  try {
    getDb().prepare(`DELETE FROM auth_sessions WHERE token = ?`).run(token);
  } catch {
    /* ignore */
  }
}

export function resolveAuthToken(token: string): AuthContext | null {
  const signed = verifySignedToken(token);
  if (signed) {
    return loadAuthContext(token, signed.u, signed.t, signed.r);
  }

  // Legacy random hex tokens (pre-signed) — only work while /tmp still has the row.
  const row = getDb()
    .prepare(
      `SELECT a.user_id as userId, a.tenant_id as tenantId, a.role,
              a.expires_at as expiresAt
       FROM auth_sessions a
       WHERE a.token = ?`,
    )
    .get(token) as
    | {
        userId: string;
        tenantId: string;
        role: CampusRole;
        expiresAt: string;
      }
    | undefined;

  if (!row) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    revokeAuthSession(token);
    return null;
  }
  return loadAuthContext(token, row.userId, row.tenantId, row.role);
}

export function bearerTokenFromRequest(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim() || null;
  }
  return req.headers.get("x-auth-token");
}
