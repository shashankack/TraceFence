import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id as sourceId, url, title, excerpt, flagged_instruction as flaggedInstruction, inspected_at as inspectedAt
       FROM sources WHERE id = ?`,
    )
    .get(id);

  if (!row) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  return NextResponse.json(row);
}
