import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { listMemberships } from "@/lib/auth/users";

export async function GET(req: Request) {
  const gate = requireAuth(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  return NextResponse.json({
    userId: gate.auth.userId,
    email: gate.auth.email,
    displayName: gate.auth.displayName,
    tenantId: gate.auth.tenantId,
    tenantName: gate.auth.tenantName,
    orgType: gate.auth.orgType,
    role: gate.auth.role,
    memberships: listMemberships(gate.auth.userId),
  });
}
