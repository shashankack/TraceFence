import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = getDb()
    .prepare(`SELECT id FROM sessions WHERE id = ?`)
    .get(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const rows = getDb()
    .prepare(
      `SELECT id, session_id as sessionId, ts, phase, tool,
              args_preview_json as argsPreviewJson, decision,
              reason_code as reasonCode, outcome, doc_ids_json as docIdsJson
       FROM session_events WHERE session_id = ? ORDER BY ts ASC`,
    )
    .all(id) as Array<Record<string, unknown>>;

  const events = rows.map((r) => ({
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
  }));

  return NextResponse.json({ events });
}
