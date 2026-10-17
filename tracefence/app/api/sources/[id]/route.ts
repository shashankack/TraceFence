import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Deprecated — use search_docs / read_document via chat" },
    { status: 410 },
  );
}
