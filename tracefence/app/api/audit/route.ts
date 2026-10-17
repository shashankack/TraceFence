import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { getDb } from "@/lib/db/client";

/** Tenant-scoped decision aggregates for the admin audit console. */
export async function GET(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const db = getDb();
  const tenantId = gate.auth.tenantId;

  const sessionDecisions = db
    .prepare(
      `SELECT e.decision as decision, COUNT(*) as count
       FROM session_events e
       JOIN sessions s ON s.id = e.session_id
       WHERE e.decision IS NOT NULL AND s.tenant_id = ?
       GROUP BY e.decision`,
    )
    .all(tenantId);

  const legacyDecisions = db
    .prepare(
      `SELECT decision, COUNT(*) as count FROM events
       WHERE decision IS NOT NULL GROUP BY decision`,
    )
    .all();

  const sessions = db
    .prepare(`SELECT COUNT(*) as count FROM sessions WHERE tenant_id = ?`)
    .get(tenantId) as { count: number };

  const pendingApprovals = db
    .prepare(
      `SELECT COUNT(*) as count
       FROM approvals a
       JOIN sessions s ON s.id = a.task_id
       WHERE a.status = 'PENDING' AND s.tenant_id = ?`,
    )
    .get(tenantId) as { count: number };

  return NextResponse.json({
    sessions: sessions.count,
    sessionDecisions,
    legacyDecisions,
    pendingApprovals: pendingApprovals.count,
    note: "TraceFence campus audit  DEMO_MODE never bypasses DENY",
  });
}
