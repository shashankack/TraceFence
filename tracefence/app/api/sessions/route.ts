import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { loadCampusPolicy } from "@/lib/campus/policy";
import { getDb } from "@/lib/db/client";

/**
 * Create a chat session. Identity comes from Bearer auth — never from the body.
 */
export async function POST(req: Request) {
  const gate = requireAuth(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { auth } = gate;
  const policy = loadCampusPolicy(auth.tenantId);
  const sessionId = `sess_${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  getDb()
    .prepare(
      `INSERT INTO sessions (id, tenant_id, user_id, role, policy_version, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      sessionId,
      auth.tenantId,
      auth.userId,
      auth.role,
      policy.policyVersion,
      now,
    );

  return NextResponse.json({
    sessionId,
    tenantId: auth.tenantId,
    userId: auth.userId,
    role: auth.role,
    policyVersion: policy.policyVersion,
  });
}
