import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { revokeAuthSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  const gate = requireAuth(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  revokeAuthSession(gate.auth.token);
  return NextResponse.json({ ok: true });
}
