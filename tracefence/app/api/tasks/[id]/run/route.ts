import { NextResponse } from "next/server";
import { runTask } from "@/lib/agent/orchestrator";
import { getDb } from "@/lib/db/client";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const db = getDb();
  const task = db.prepare(`SELECT id FROM tasks WHERE id = ?`).get(id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const result = await runTask(id);
  return NextResponse.json(result, {
    status: result.status === "NOT_IMPLEMENTED" ? 501 : 200,
  });
}
