import { NextResponse } from "next/server";
import { setMemberRoleSchema } from "@/lib/api/schemas";
import { requireAdmin } from "@/lib/auth/requireAuth";
import {
  assignableRoleIds,
  listTenantMembers,
  setMemberRole,
} from "@/lib/org/customRoles";

export async function GET(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  return NextResponse.json({
    members: listTenantMembers(gate.auth.tenantId),
    assignableRoles: assignableRoleIds(gate.auth.tenantId),
  });
}

export async function PATCH(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const json = await req.json().catch(() => null);
  const parsed = setMemberRoleSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = setMemberRole(
    gate.auth.tenantId,
    parsed.data.userId,
    parsed.data.role,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
