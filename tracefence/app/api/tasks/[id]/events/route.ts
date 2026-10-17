import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const db = getDb();
  const task = db.prepare(`SELECT id FROM tasks WHERE id = ?`).get(id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const rows = db
    .prepare(
      `SELECT id, task_id as taskId, ts, phase, source_id as sourceId,
              source_url as sourceUrl, source_excerpt as sourceExcerpt,
              tool, args_preview_json as argsPreviewJson, decision,
              reason_code as reasonCode, outcome
       FROM events WHERE task_id = ? ORDER BY ts ASC`,
    )
    .all(id) as Array<Record<string, unknown>>;

  const events = rows.map((r) => ({
    ...r,
    argsPreview: r.argsPreviewJson
      ? JSON.parse(String(r.argsPreviewJson))
      : null,
    argsPreviewJson: undefined,
  }));

  return NextResponse.json({ taskId: id, events });
}
