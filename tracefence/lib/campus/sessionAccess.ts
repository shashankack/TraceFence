import { getDb } from "../db/client";
import type { CampusRole } from "../security/types";
import { loadCampusPolicy } from "./policy";

export type OwnedSession = {
  id: string;
  tenantId: string;
  userId: string;
  role: CampusRole;
  policyVersion: number;
};

const SESSION_ID_RE = /^sess_[a-zA-Z0-9_-]{6,40}$/;

function isServerlessEphemeralDb(): boolean {
  return Boolean(process.env.VERCEL || process.env.TRACEFENCE_DB_TMP === "1");
}

/**
 * Load a chat session owned by the caller.
 * On Vercel, sessions live in per-instance /tmp SQLite — rehydrate a missing
 * row for the same id so the next message/upload does not 404 after a hop.
 */
export function loadOwnedSession(
  id: string,
  auth: { tenantId: string; userId: string; role: CampusRole },
  opts?: { rehydrate?: boolean },
):
  | { session: OwnedSession }
  | { error: string; status: 403 | 404 } {
  if (!SESSION_ID_RE.test(id)) {
    return { error: "Session not found", status: 404 };
  }

  const db = getDb();
  const read = () =>
    db
      .prepare(
        `SELECT id, tenant_id as tenantId, user_id as userId, role, policy_version as policyVersion
         FROM sessions WHERE id = ?`,
      )
      .get(id) as OwnedSession | undefined;

  let session = read();

  if (
    !session &&
    (opts?.rehydrate ?? true) &&
    isServerlessEphemeralDb()
  ) {
    const policy = loadCampusPolicy(auth.tenantId);
    const now = new Date().toISOString();
    try {
      db.prepare(
        `INSERT OR IGNORE INTO sessions
         (id, tenant_id, user_id, role, policy_version, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        auth.tenantId,
        auth.userId,
        auth.role,
        policy.policyVersion,
        now,
      );
    } catch {
      /* race with another invoke */
    }
    session = read();
  }

  if (!session) return { error: "Session not found", status: 404 };
  if (session.tenantId !== auth.tenantId || session.userId !== auth.userId) {
    return { error: "Forbidden", status: 403 };
  }
  return { session };
}
