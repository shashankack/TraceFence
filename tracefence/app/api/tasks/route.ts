import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createTaskBodySchema } from "@/lib/api/schemas";
import { getDb } from "@/lib/db/client";

const DEMO_USER = "demo-user-1";

function defaultRules(allowedInvoiceIds: string[]) {
  return [
    {
      tool: "read_invoice",
      action: "ALLOW" as const,
      allowedInvoiceIds,
    },
    {
      tool: "send_email",
      action: "REQUIRE_APPROVAL" as const,
      allowedRecipientDomains: ["company.example"],
    },
    {
      tool: "delete_invoice",
      action: "DENY" as const,
    },
  ];
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = createTaskBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const rules = body.rules ?? defaultRules(body.allowedInvoiceIds);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + body.expiresInMinutes * 60_000,
  ).toISOString();
  const taskId = `task_${randomUUID()}`;
  const policyVersion = 1;

  const db = getDb();
  db.prepare(
    `INSERT INTO tasks (
      id, user_id, instruction, status, policy_version, policy_json,
      source_id, expires_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    taskId,
    DEMO_USER,
    body.instruction,
    "CREATED",
    policyVersion,
    JSON.stringify({ version: policyVersion, rules, defaultAction: "DENY" }),
    body.sourceId ?? null,
    expiresAt,
    now.toISOString(),
    now.toISOString(),
  );

  return NextResponse.json({
    taskId,
    userId: DEMO_USER,
    status: "CREATED",
    policyVersion,
    sourceId: body.sourceId ?? null,
    expiresAt,
    rules,
  });
}
