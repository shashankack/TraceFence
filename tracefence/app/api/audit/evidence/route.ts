import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { getDb } from "@/lib/db/client";
import type { CampusRole } from "@/lib/security/types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/**
 * Tenant-wide gateway evidence for the admin audit console.
 * Paginated by session (newest first).
 */
export async function GET(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const url = new URL(req.url);
  const page = Math.max(
    1,
    Number.parseInt(url.searchParams.get("page") ?? String(DEFAULT_PAGE), 10) ||
      DEFAULT_PAGE,
  );
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      1,
      Number.parseInt(
        url.searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE),
        10,
      ) || DEFAULT_PAGE_SIZE,
    ),
  );
  const offset = (page - 1) * pageSize;

  const tenantId = gate.auth.tenantId;
  const db = getDb();

  const totalRow = db
    .prepare(
      `SELECT COUNT(*) as count
       FROM sessions s
       WHERE s.tenant_id = ?
         AND EXISTS (SELECT 1 FROM session_events e WHERE e.session_id = s.id)`,
    )
    .get(tenantId) as { count: number };
  const totalSessions = totalRow.count;
  const totalPages = Math.max(1, Math.ceil(totalSessions / pageSize));

  const sessions = db
    .prepare(
      `SELECT s.id as sessionId, s.role, s.user_id as userId, s.created_at as createdAt
       FROM sessions s
       WHERE s.tenant_id = ?
         AND EXISTS (SELECT 1 FROM session_events e WHERE e.session_id = s.id)
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(tenantId, pageSize, offset) as Array<{
    sessionId: string;
    role: CampusRole;
    userId: string;
    createdAt: string;
  }>;

  if (sessions.length === 0) {
    return NextResponse.json({
      tenantId,
      sessions: [],
      page,
      pageSize,
      totalSessions,
      totalPages,
    });
  }

  const ids = sessions.map((s) => s.sessionId);
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT id, session_id as sessionId, ts, phase, tool,
              args_preview_json as argsPreviewJson, decision,
              reason_code as reasonCode, outcome, doc_ids_json as docIdsJson
       FROM session_events
       WHERE session_id IN (${placeholders})
       ORDER BY ts ASC`,
    )
    .all(...ids) as Array<Record<string, unknown>>;

  const bySession = new Map<string, Array<Record<string, unknown>>>();
  for (const r of rows) {
    const sid = String(r.sessionId);
    const list = bySession.get(sid) ?? [];
    list.push(r);
    bySession.set(sid, list);
  }

  const mapEvent = (r: Record<string, unknown>) => ({
    id: r.id,
    sessionId: r.sessionId,
    ts: r.ts,
    phase: r.phase,
    tool: r.tool,
    argsPreview: r.argsPreviewJson
      ? JSON.parse(String(r.argsPreviewJson))
      : null,
    decision: r.decision,
    reasonCode: r.reasonCode,
    outcome: r.outcome,
    docIds: r.docIdsJson ? JSON.parse(String(r.docIdsJson)) : null,
  });

  return NextResponse.json({
    tenantId,
    page,
    pageSize,
    totalSessions,
    totalPages,
    sessions: sessions
      .map((s) => ({
        sessionId: s.sessionId,
        role: s.role,
        userId: s.userId,
        events: (bySession.get(s.sessionId) ?? []).map(mapEvent),
      }))
      .filter((s) => s.events.length > 0),
  });
}
