import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/api/schemas";
import { login } from "@/lib/auth/users";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = login(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    token: result.token,
    expiresAt: result.expiresAt,
    userId: result.userId,
    tenantId: result.tenantId,
    role: result.role,
    memberships: result.memberships,
  });
}
