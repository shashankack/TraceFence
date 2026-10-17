import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function GET() {
  const db = getDb();

  const decisions = db
    .prepare(
      `SELECT decision, COUNT(*) as count FROM events
       WHERE decision IS NOT NULL GROUP BY decision`,
    )
    .all();

  const outbox = db
    .prepare(`SELECT COUNT(*) as count FROM mock_email_outbox`)
    .get() as { count: number };

  const forbiddenOutbox = db
    .prepare(
      `SELECT COUNT(*) as count FROM mock_email_outbox
       WHERE to_addr LIKE '%@external.example'
          OR to_addr LIKE '%@attacker.example'`,
    )
    .get() as { count: number };

  return NextResponse.json({
    decisions,
    mockOutboxCount: outbox.count,
    forbiddenOutboxCount: forbiddenOutbox.count,
    note: "DEMO_MODE audit aggregate — forbidden outbox must stay 0 for attack demos",
  });
}
