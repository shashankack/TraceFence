import { NextResponse } from "next/server";
import { switchTenantSchema } from "@/lib/api/schemas";
import { requireAuth } from "@/lib/auth/requireAuth";
import { switchTenant } from "@/lib/auth/users";

export async function POST(req: Request) {
  const gate = requireAuth(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const json = await req.json().catch(() => null);
  const parsed = switchTenantSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = switchTenant({
    userId: gate.auth.userId,
    currentToken: gate.auth.token,
    tenantId: parsed.data.tenantId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    token: result.token,
    expiresAt: result.expiresAt,
    tenantId: result.tenantId,
    role: result.role,
  });
}
