import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { approvalDecisionSchema } from "@/lib/api/schemas";
import { requireAuth } from "@/lib/auth/requireAuth";
import { loadCampusPolicy } from "@/lib/campus/policy";
import { getDb } from "@/lib/db/client";
import {
  assertExecutableApproval,
  type PendingApproval,
} from "@/lib/security/approvalService";
import { ReasonCode } from "@/lib/security/reasonCodes";
import type { CampusRole } from "@/lib/security/types";
import { getCampusExecutor } from "@/lib/tools/registry";

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
  const parsed = approvalDecisionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, task_id as taskId, user_id as userId, tool_name as toolName,
              args_json as argsJson, canonical_args_hash as canonicalArgsHash,
              policy_version as policyVersion, status, expires_at as expiresAt
       FROM approvals WHERE id = ?`,
    )
    .get(id) as
    | {
        id: string;
        taskId: string;
        userId: string;
        toolName: string;
        argsJson: string;
        canonicalArgsHash: string;
        policyVersion: number;
        status: string;
        expiresAt: string;
      }
    | undefined;

  if (!row) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  const sessionCheck = db
    .prepare(`SELECT tenant_id as tenantId FROM sessions WHERE id = ?`)
    .get(row.taskId) as { tenantId: string } | undefined;
  if (!sessionCheck || sessionCheck.tenantId !== gate.auth.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  if (parsed.data.decision === "REJECT") {
    db.prepare(
      `UPDATE approvals SET status = 'REJECTED', approved_by = ? WHERE id = ?`,
    ).run("demo-user-1", id);

    db.prepare(
      `INSERT INTO session_events
       (id, session_id, ts, phase, tool, args_preview_json, decision, reason_code, outcome, doc_ids_json)
       VALUES (?, ?, ?, 'DECISION', ?, ?, 'DENY', ?, ?, NULL)`,
    ).run(
      randomUUID(),
      row.taskId,
      new Date().toISOString(),
      row.toolName,
      row.argsJson,
      ReasonCode.APPROVAL_REJECTED,
      "Human rejected this exact action",
    );

    return NextResponse.json({
      id,
      status: "REJECTED",
      decision: "REJECT",
    });
  }

  db.prepare(
    `UPDATE approvals SET status = 'APPROVED', approved_by = ? WHERE id = ?`,
  ).run("demo-user-1", id);

  const pending: PendingApproval = {
    id: row.id,
    taskId: row.taskId,
    userId: row.userId,
    toolName: row.toolName,
    args: JSON.parse(row.argsJson) as Record<string, unknown>,
    canonicalArgsHash: row.canonicalArgsHash,
    policyVersion: row.policyVersion,
    status: "APPROVED",
    expiresAt: row.expiresAt,
  };

  const check = assertExecutableApproval(pending, {
    taskId: row.taskId,
    userId: row.userId,
    toolName: row.toolName,
    args: pending.args,
    policyVersion: row.policyVersion,
    now: new Date(),
  });

  if (!check.ok) {
    return NextResponse.json(
      { error: check.message, reasonCode: check.reasonCode },
      { status: 409 },
    );
  }

  const session = db
    .prepare(`SELECT role, tenant_id as tenantId FROM sessions WHERE id = ?`)
    .get(row.taskId) as
    | { role: CampusRole; tenantId: string }
    | undefined;

  const role = session?.role ?? "faculty";
  const tenantId = session?.tenantId ?? "nulltrace-institute";
  const executor = getCampusExecutor(tenantId, role);
  const result = await executor(row.toolName, pending.args);

  db.prepare(
    `UPDATE approvals SET status = 'CONSUMED', consumed_at = ? WHERE id = ?`,
  ).run(new Date().toISOString(), id);

  db.prepare(
    `INSERT INTO session_events
     (id, session_id, ts, phase, tool, args_preview_json, decision, reason_code, outcome, doc_ids_json)
     VALUES (?, ?, ?, 'OUTCOME', ?, ?, 'ALLOW', ?, ?, NULL)`,
  ).run(
    randomUUID(),
    row.taskId,
    new Date().toISOString(),
    row.toolName,
    row.argsJson,
    ReasonCode.APPROVAL_CONSUMED,
    JSON.stringify(result),
  );

  const policy = loadCampusPolicy(tenantId);
  return NextResponse.json({
    id,
    status: "CONSUMED",
    decision: "APPROVE",
    executed: true,
    result,
    policyVersion: policy.policyVersion,
  });
}
