import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId =
    url.searchParams.get("sessionId") ?? url.searchParams.get("taskId");
  const db = getDb();

  const rows = sessionId
    ? db
        .prepare(
          `SELECT id, task_id as sessionId, user_id as userId, tool_name as toolName,
                  args_json as argsJson, canonical_args_hash as canonicalArgsHash,
                  policy_version as policyVersion, status, expires_at as expiresAt,
                  approved_by as approvedBy, consumed_at as consumedAt, created_at as createdAt
           FROM approvals WHERE task_id = ? ORDER BY created_at DESC`,
        )
        .all(sessionId)
    : db
        .prepare(
          `SELECT id, task_id as sessionId, user_id as userId, tool_name as toolName,
                  args_json as argsJson, canonical_args_hash as canonicalArgsHash,
                  policy_version as policyVersion, status, expires_at as expiresAt,
                  approved_by as approvedBy, consumed_at as consumedAt, created_at as createdAt
           FROM approvals ORDER BY created_at DESC LIMIT 100`,
        )
        .all();

  const approvals = (rows as Array<Record<string, unknown>>).map((r) => ({
    ...r,
    args: JSON.parse(String(r.argsJson)),
    argsJson: undefined,
  }));

  return NextResponse.json({ approvals });
}
