import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id as taskId, user_id as userId, instruction, status,
              policy_version as policyVersion, policy_json as policyJson,
              source_id as sourceId, expires_at as expiresAt,
              created_at as createdAt, updated_at as updatedAt
       FROM tasks WHERE id = ?`,
    )
    .get(id) as Record<string, unknown> | undefined;

  if (!row) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...row,
    policy: JSON.parse(String(row.policyJson)),
    policyJson: undefined,
  });
}
