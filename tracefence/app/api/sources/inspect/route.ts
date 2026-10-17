import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated — campus retrieval uses fixtures/campus ACL filters",
    },
    { status: 410 },
  );
}
