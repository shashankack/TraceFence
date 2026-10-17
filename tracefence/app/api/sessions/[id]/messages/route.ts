import { NextResponse } from "next/server";
import { sessionMessageSchema } from "@/lib/api/schemas";
import { requireAuth } from "@/lib/auth/requireAuth";
import { handleChatTurn } from "@/lib/campus/chat";
import { getDb } from "@/lib/db/client";
import type { CampusRole } from "@/lib/security/types";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = requireAuth(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = sessionMessageSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const session = getDb()
    .prepare(
      `SELECT id, tenant_id as tenantId, user_id as userId, role
       FROM sessions WHERE id = ?`,
    )
    .get(id) as
    | { id: string; tenantId: string; userId: string; role: CampusRole }
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

  const result = await handleChatTurn({
    sessionId: session.id,
    tenantId: session.tenantId,
    userId: session.userId,
    role: session.role,
    message: parsed.data.message,
  });

  return NextResponse.json(result);
}
