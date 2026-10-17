import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { listTenantNotifications } from "@/lib/tools/sendMockEmail";

export async function GET(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const url = new URL(req.url);
  const limit = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get("limit") ?? "30") || 30),
  );

  return NextResponse.json({
    tenantId: gate.auth.tenantId,
    notifications: listTenantNotifications(gate.auth.tenantId, limit),
  });
}
