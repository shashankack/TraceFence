import { NextResponse } from "next/server";
import { sessionMessageSchema } from "@/lib/api/schemas";
import { handleChatTurn } from "@/lib/campus/chat";
import { getDb } from "@/lib/db/client";
import type { CampusRole } from "@/lib/security/types";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
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
      `SELECT id, user_id as userId, role FROM sessions WHERE id = ?`,
    )
    .get(id) as { id: string; userId: string; role: CampusRole } | undefined;

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const result = await handleChatTurn({
    sessionId: session.id,
    userId: session.userId,
    role: session.role,
    message: parsed.data.message,
  });

  return NextResponse.json(result);
}
