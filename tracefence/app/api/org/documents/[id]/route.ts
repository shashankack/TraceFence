import { NextResponse } from "next/server";
import { patchOrgDocumentSchema } from "@/lib/api/schemas";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { patchOrgDocument } from "@/lib/campus/orgStore";
import { loadCampusPolicy } from "@/lib/campus/policy";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = patchOrgDocumentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const doc = patchOrgDocument(gate.auth.tenantId, id, parsed.data);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const policy = loadCampusPolicy(gate.auth.tenantId);
  return NextResponse.json({
    document: doc,
    policyVersion: policy.policyVersion,
  });
}
