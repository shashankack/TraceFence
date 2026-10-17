import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function GET() {
  const db = getDb();

  const sessionDecisions = db
    .prepare(
      `SELECT decision, COUNT(*) as count FROM session_events
       WHERE decision IS NOT NULL GROUP BY decision`,
    )
    .all();

  const legacyDecisions = db
    .prepare(
      `SELECT decision, COUNT(*) as count FROM events
       WHERE decision IS NOT NULL GROUP BY decision`,
    )
    .all();

  const sessions = db
    .prepare(`SELECT COUNT(*) as count FROM sessions`)
    .get() as { count: number };

  const pendingApprovals = db
    .prepare(`SELECT COUNT(*) as count FROM approvals WHERE status = 'PENDING'`)
    .get() as { count: number };

  return NextResponse.json({
    sessions: sessions.count,
    sessionDecisions,
    legacyDecisions,
    pendingApprovals: pendingApprovals.count,
    note: "TraceFence campus audit — DEMO_MODE never bypasses DENY",
  });
}
