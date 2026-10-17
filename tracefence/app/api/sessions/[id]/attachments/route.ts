import { NextResponse } from "next/server";
import { sessionAttachmentSchema } from "@/lib/api/schemas";
import { requireAuth } from "@/lib/auth/requireAuth";
import {
  createChatUpload,
  isAllowedUploadFilename,
} from "@/lib/campus/chatUpload";
import { contentFromPdfBase64 } from "@/lib/campus/pdfText";
import { getDb } from "@/lib/db/client";
import { loadCampusPolicy, toolDecisionForRole } from "@/lib/campus/policy";

function loadOwnedSession(id: string, auth: { tenantId: string; userId: string }) {
  const session = getDb()
    .prepare(
      `SELECT id, tenant_id as tenantId, user_id as userId, role
       FROM sessions WHERE id = ?`,
    )
    .get(id) as
    | { id: string; tenantId: string; userId: string; role: string }
    | undefined;
  if (!session) return { error: "Session not found" as const, status: 404 as const };
  if (session.tenantId !== auth.tenantId || session.userId !== auth.userId) {
    return { error: "Forbidden" as const, status: 403 as const };
  }
  return { session };
}

/**
 * Upload a file for this chat session. Server sanitizes before the agent may use it.
 * Guests are denied (policy use_chat_upload = DENY).
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = requireAuth(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id } = await ctx.params;
  const owned = loadOwnedSession(id, gate.auth);
  if (!("session" in owned) || !owned.session) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }
  const session = owned.session;

  const decision = toolDecisionForRole(
    session.tenantId,
    session.role,
    "use_chat_upload",
  );
  if (decision !== "ALLOW") {
    return NextResponse.json(
      {
        error: "Chat uploads denied for your role",
        reasonCode: "DENIED_ROLE",
        decision: decision ?? "DENY",
      },
      { status: 403 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = sessionAttachmentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!isAllowedUploadFilename(parsed.data.filename)) {
    return NextResponse.json(
      { error: "Only .txt, .md, .csv, or .pdf uploads are allowed" },
      { status: 400 },
    );
  }

  try {
    let rawText = parsed.data.content ?? "";
    if (parsed.data.pdfBase64) {
      rawText = await contentFromPdfBase64(parsed.data.pdfBase64);
    }

    const upload = createChatUpload({
      sessionId: session.id,
      tenantId: session.tenantId,
      userId: session.userId,
      filename: parsed.data.filename,
      rawText,
    });

    const policy = loadCampusPolicy(session.tenantId);
    return NextResponse.json(
      {
        upload: {
          id: upload.id,
          filename: upload.filename,
          status: upload.status,
          flags: upload.flags,
          preview: upload.sanitized.slice(0, 280),
          createdAt: upload.createdAt,
        },
        notice:
          upload.status === "blocked"
            ? "Upload blocked after sanitize. Poison was stripped or residual malice remains — nothing enters the model."
            : upload.status === "flagged"
              ? "Upload sanitized; attack patterns flagged. Only cleaned text may enter the model via use_chat_upload."
              : "Upload sanitized and ready for the agent.",
        policyVersion: policy.policyVersion,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
