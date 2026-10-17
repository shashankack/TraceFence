import { NextResponse } from "next/server";
import { createOrgDocumentSchema } from "@/lib/api/schemas";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { createOrgDocument, listOrgDocuments } from "@/lib/campus/orgStore";
import { loadCampusPolicy } from "@/lib/campus/policy";

export async function GET(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const policy = loadCampusPolicy(gate.auth.tenantId);
  const documents = listOrgDocuments(gate.auth.tenantId).map(
    ({ content, ...meta }) => ({
      ...meta,
      hasContent: Boolean(content),
    }),
  );

  return NextResponse.json({
    tenantId: policy.tenantId,
    policyVersion: policy.policyVersion,
    documents,
  });
}

export async function POST(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const json = await req.json().catch(() => null);
  const parsed = createOrgDocumentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const doc = createOrgDocument(gate.auth.tenantId, parsed.data);
    const policy = loadCampusPolicy(gate.auth.tenantId);
    return NextResponse.json(
      { document: doc, policyVersion: policy.policyVersion },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    if (message.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "Document id already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
