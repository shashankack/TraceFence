import { NextResponse } from "next/server";
import { sessionMessageSchema } from "@/lib/api/schemas";
import { requireAuth } from "@/lib/auth/requireAuth";
import { handleChatTurn } from "@/lib/campus/chat";
import { loadOwnedSession } from "@/lib/campus/sessionAccess";
import { getDb } from "@/lib/db/client";

/** Ollama via tunnel can be slow — allow long serverless execution on Vercel. */
export const maxDuration = 60;
export const runtime = "nodejs";

/** Load persisted chat turns for the history sidebar. */
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
      `SELECT id, role, content, citations_json as citationsJson,
              attachments_json as attachmentsJson, created_at as createdAt
       FROM session_messages WHERE session_id = ?
       ORDER BY created_at ASC`,
    )
    .all(id) as Array<{
    id: string;
    role: string;
    content: string;
    citationsJson: string | null;
    attachmentsJson: string | null;
    createdAt: string;
  }>;

  return NextResponse.json({
    session: {
      sessionId: owned.session.id,
      tenantId: owned.session.tenantId,
      userId: owned.session.userId,
      role: owned.session.role,
      policyVersion: owned.session.policyVersion,
    },
    messages: rows.map((r) => ({
      id: r.id,
      role: r.role,
      content: r.content,
      citations: r.citationsJson ? JSON.parse(r.citationsJson) : undefined,
      attachments: r.attachmentsJson
        ? (JSON.parse(r.attachmentsJson) as Array<{
            id: string;
            filename: string;
            status: string;
          }>)
        : undefined,
      createdAt: r.createdAt,
    })),
  });
}

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

  const owned = loadOwnedSession(id, gate.auth);
  if ("error" in owned) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }
  const session = owned.session;

  const result = await handleChatTurn({
    sessionId: session.id,
    tenantId: session.tenantId,
    userId: session.userId,
    role: session.role,
    message: parsed.data.message.trim() || "Please review the attached file.",
    attachmentIds: parsed.data.attachmentIds,
  });

  return NextResponse.json(result);
}
