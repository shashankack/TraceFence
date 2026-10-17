import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Deprecated — use GET /api/sessions/:id/events" },
    { status: 410 },
  );
}
