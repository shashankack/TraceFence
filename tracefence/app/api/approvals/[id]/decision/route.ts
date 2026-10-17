import { NextResponse } from "next/server";
import { approvalDecisionSchema } from "@/lib/api/schemas";
import { getDb } from "@/lib/db/client";
import { ReasonCode } from "@/lib/security/reasonCodes";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = approvalDecisionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  const row = db
    .prepare(`SELECT id, status, expires_at as expiresAt FROM approvals WHERE id = ?`)
    .get(id) as { id: string; status: string; expiresAt: string } | undefined;

  if (!row) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  if (row.status !== "PENDING") {
    return NextResponse.json(
      {
        error: "Approval not pending",
        reasonCode: ReasonCode.APPROVAL_MISMATCH,
        status: row.status,
      },
      { status: 409 },
    );
  }

  if (new Date(row.expiresAt).getTime() < Date.now()) {
    db.prepare(`UPDATE approvals SET status = 'EXPIRED' WHERE id = ?`).run(id);
    return NextResponse.json(
      {
        error: "Approval expired",
        reasonCode: ReasonCode.APPROVAL_EXPIRED,
      },
      { status: 410 },
    );
  }

  const nextStatus =
    parsed.data.decision === "APPROVE" ? "APPROVED" : "REJECTED";
  db.prepare(
    `UPDATE approvals SET status = ?, approved_by = ? WHERE id = ?`,
  ).run(nextStatus, "demo-user-1", id);

  return NextResponse.json({
    id,
    status: nextStatus,
    decision: parsed.data.decision,
  });
}
