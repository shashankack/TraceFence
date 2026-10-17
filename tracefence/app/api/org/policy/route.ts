import { NextResponse } from "next/server";
import { putOrgPolicySchema } from "@/lib/api/schemas";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { assertValidRoles, replaceOrgPolicy } from "@/lib/campus/orgStore";
import { loadCampusPolicy } from "@/lib/campus/policy";

export async function GET(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const policy = loadCampusPolicy(gate.auth.tenantId);
  return NextResponse.json({
    tenantId: policy.tenantId,
    policyVersion: policy.policyVersion,
    roles: policy.roles,
    documents: policy.documents,
  });
}

export async function PUT(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const json = await req.json().catch(() => null);
  const parsed = putOrgPolicySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!assertValidRoles(parsed.data.roles)) {
    return NextResponse.json(
      {
        error:
          "roles must include student, faculty, admin with collections[] and tools map",
      },
      { status: 400 },
    );
  }

  const policy = replaceOrgPolicy(gate.auth.tenantId, parsed.data.roles);
  return NextResponse.json({
    tenantId: policy.tenantId,
    policyVersion: policy.policyVersion,
    roles: policy.roles,
  });
}
