import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createSessionSchema } from "@/lib/api/schemas";
import { loadCampusPolicy } from "@/lib/campus/policy";
import { getDb } from "@/lib/db/client";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = createSessionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const policy = loadCampusPolicy();
  const sessionId = `sess_${randomUUID().slice(0, 8)}`;
  const userId = parsed.data.userId ?? "demo-user-1";
  const now = new Date().toISOString();

  getDb()
    .prepare(
      `INSERT INTO sessions (id, tenant_id, user_id, role, policy_version, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      sessionId,
      policy.tenantId,
      userId,
      parsed.data.role,
      policy.policyVersion,
      now,
    );

  return NextResponse.json({
    sessionId,
    tenantId: policy.tenantId,
    userId,
    role: parsed.data.role,
    policyVersion: policy.policyVersion,
  });
}
