import { NextResponse } from "next/server";
import { orgProfilePatchSchema } from "@/lib/api/schemas";
import { requireAdmin } from "@/lib/auth/requireAuth";
import {
  getTenantProfile,
  updateTenantProfile,
} from "@/lib/org/tenantProfile";

export async function GET(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const profile = getTenantProfile(gate.auth.tenantId);
  if (!profile) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}

export async function PATCH(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const json = await req.json().catch(() => null);
  const parsed = orgProfilePatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = updateTenantProfile(gate.auth.tenantId, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
