import { NextResponse } from "next/server";
import { createCustomRoleSchema } from "@/lib/api/schemas";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { addCustomRole, removeCustomRole } from "@/lib/org/customRoles";
import { getTenantProfile } from "@/lib/org/tenantProfile";

export async function GET(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const profile = getTenantProfile(gate.auth.tenantId);
  return NextResponse.json({
    customRoles: profile?.profile.customRoles ?? [],
  });
}

export async function POST(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const json = await req.json().catch(() => null);
  const parsed = createCustomRoleSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = addCustomRole(gate.auth.tenantId, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ role: result.role }, { status: 201 });
}

export async function DELETE(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id query required" }, { status: 400 });
  }

  const result = removeCustomRole(gate.auth.tenantId, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
