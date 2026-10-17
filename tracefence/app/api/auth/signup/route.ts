import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/api/schemas";
import { signup } from "@/lib/auth/users";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = signup(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      token: result.token,
      expiresAt: result.expiresAt,
      userId: result.userId,
      tenantId: result.tenantId,
      role: result.role,
    },
    { status: 201 },
  );
}
