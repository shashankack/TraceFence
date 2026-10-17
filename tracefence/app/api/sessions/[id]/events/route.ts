import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { loadOwnedSession } from "@/lib/campus/sessionAccess";
import { getDb } from "@/lib/db/client";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = requireAuth(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id } = await ctx.params;
  const owned = loadOwnedSession(id, gate.auth);
  if ("error" in owned) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
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
