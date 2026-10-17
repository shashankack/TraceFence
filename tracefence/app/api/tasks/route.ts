import { NextResponse } from "next/server";

/** @deprecated Use POST /api/sessions */
export async function GET() {
  return NextResponse.json(
    {
      error: "Deprecated",
      use: "POST /api/sessions and POST /api/sessions/:id/messages",
    },
    { status: 410 },
  );
}

export async function POST() {
  return GET();
}
