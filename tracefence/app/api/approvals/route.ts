import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getDb } from "@/lib/db/client";

export async function GET(req: Request) {
  const gate = requireAuth(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  const db = getDb();

  // Scope approvals to sessions in this tenant
  const rows = sessionId
    ? db
        .prepare(
          `SELECT a.id, a.task_id as sessionId, a.user_id as userId,
                  a.tool_name as toolName, a.args_json as argsJson,
                  a.canonical_args_hash as canonicalArgsHash,
                  a.policy_version as policyVersion, a.status,
                  a.expires_at as expiresAt, a.approved_by as approvedBy,
                  a.consumed_at as consumedAt, a.created_at as createdAt
           FROM approvals a
           JOIN sessions s ON s.id = a.task_id
           WHERE a.task_id = ? AND s.tenant_id = ?
           ORDER BY a.created_at DESC`,
        )
        .all(sessionId, gate.auth.tenantId)
    : db
        .prepare(
          `SELECT a.id, a.task_id as sessionId, a.user_id as userId,
                  a.tool_name as toolName, a.args_json as argsJson,
                  a.canonical_args_hash as canonicalArgsHash,
                  a.policy_version as policyVersion, a.status,
                  a.expires_at as expiresAt, a.approved_by as approvedBy,
                  a.consumed_at as consumedAt, a.created_at as createdAt
           FROM approvals a
           JOIN sessions s ON s.id = a.task_id
           WHERE s.tenant_id = ?
           ORDER BY a.created_at DESC LIMIT 100`,
        )
        .all(gate.auth.tenantId);

  const approvals = (rows as Array<Record<string, unknown>>).map((r) => ({
    ...r,
    args: JSON.parse(String(r.argsJson)),
    argsJson: undefined,
  }));

  return NextResponse.json({ approvals });
}
