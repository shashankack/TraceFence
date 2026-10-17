import { NextResponse } from "next/server";
import { inspectBodySchema } from "@/lib/api/schemas";
import { inspectPage } from "@/lib/investigate/inspectPage";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = inspectBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await inspectPage(parsed.data.url);
  if (!result.ok) {
    const status =
      result.reasonCode === "DENIED_SOURCE_HOST" ? 403 : 501;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
