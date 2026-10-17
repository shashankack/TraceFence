import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getDb } from "@/lib/db/client";

/** Delete a chat session the caller owns (messages + events cascade in app code). */
export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = requireAuth(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id } = await ctx.params;
  const session = getDb()
    .prepare(
      `SELECT id, tenant_id as tenantId, user_id as userId FROM sessions WHERE id = ?`,
    )
    .get(id) as
    | { id: string; tenantId: string; userId: string }
    | undefined;

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (
    session.tenantId !== gate.auth.tenantId ||
    session.userId !== gate.auth.userId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM session_messages WHERE session_id = ?`).run(id);
    db.prepare(`DELETE FROM session_events WHERE session_id = ?`).run(id);
    db.prepare(`DELETE FROM approvals WHERE task_id = ?`).run(id);
    db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
  });
  tx();

  return NextResponse.json({ ok: true, sessionId: id });
}
