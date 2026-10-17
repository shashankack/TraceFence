import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { loadCampusPolicy } from "@/lib/campus/policy";
import { getDb } from "@/lib/db/client";

/**
 * List this user's recent chat sessions (for sidebar history).
 * Guests share one principal  clients should prefer browser-local ids for guests.
 */
export async function GET(req: Request) {
  const gate = requireAuth(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  // Guests have no durable history.
  if (gate.auth.role === "guest") {
    return NextResponse.json({ sessions: [] });
  }

  // Only sessions with at least one user message (empty drafts stay out of history).
  const rows = getDb()
    .prepare(
      `SELECT s.id as sessionId, s.tenant_id as tenantId, s.user_id as userId,
              s.role, s.policy_version as policyVersion, s.created_at as createdAt,
              (SELECT content FROM session_messages m
               WHERE m.session_id = s.id AND m.role = 'user'
               ORDER BY m.created_at ASC LIMIT 1) as preview
       FROM sessions s
       WHERE s.user_id = ? AND s.tenant_id = ?
         AND EXISTS (
           SELECT 1 FROM session_messages m
           WHERE m.session_id = s.id AND m.role = 'user'
         )
       ORDER BY s.created_at DESC
       LIMIT 30`,
    )
    .all(gate.auth.userId, gate.auth.tenantId) as Array<{
    sessionId: string;
    tenantId: string;
    userId: string;
    role: string;
    policyVersion: number;
    createdAt: string;
    preview: string | null;
  }>;

  return NextResponse.json({
    sessions: rows.map((r) => ({
      sessionId: r.sessionId,
      tenantId: r.tenantId,
      userId: r.userId,
      role: r.role,
      policyVersion: r.policyVersion,
      createdAt: r.createdAt,
      title: (r.preview ?? "New chat").slice(0, 72),
    })),
  });
}

/**
 * Create a chat session. Identity comes from Bearer auth  never from the body.
 */
export async function POST(req: Request) {
  const gate = requireAuth(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { auth } = gate;
  const policy = loadCampusPolicy(auth.tenantId);
  const sessionId = `sess_${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const db = getDb();

  // Guests are ephemeral: drop any prior sessions for this principal so nothing accumulates.
  if (auth.role === "guest") {
    const prior = db
      .prepare(`SELECT id FROM sessions WHERE user_id = ? AND tenant_id = ?`)
      .all(auth.userId, auth.tenantId) as Array<{ id: string }>;
    const wipe = db.transaction((ids: string[]) => {
      for (const id of ids) {
        db.prepare(`DELETE FROM session_messages WHERE session_id = ?`).run(id);
        db.prepare(`DELETE FROM session_events WHERE session_id = ?`).run(id);
        db.prepare(`DELETE FROM approvals WHERE task_id = ?`).run(id);
        db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
      }
    });
    wipe(prior.map((p) => p.id));
  }

  db.prepare(
    `INSERT INTO sessions (id, tenant_id, user_id, role, policy_version, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    sessionId,
    auth.tenantId,
    auth.userId,
    auth.role,
    policy.policyVersion,
    now,
  );

  return NextResponse.json({
    sessionId,
    tenantId: auth.tenantId,
    userId: auth.userId,
    role: auth.role,
    policyVersion: policy.policyVersion,
  });
}
