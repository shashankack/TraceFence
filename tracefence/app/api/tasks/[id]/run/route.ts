import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Deprecated — use POST /api/sessions/:id/messages" },
    { status: 410 },
  );
}
