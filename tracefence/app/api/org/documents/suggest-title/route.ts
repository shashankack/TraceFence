import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { contentFromPdfBase64 } from "@/lib/campus/pdfText";
import { suggestTitleFromText, titleFromFileName } from "@/lib/campus/suggestTitle";

const bodySchema = z
  .object({
    content: z.string().optional(),
    pdfBase64: z.string().min(1).optional(),
    fileName: z.string().optional(),
  })
  .refine((v) => Boolean(v.content || v.pdfBase64), {
    message: "content or pdfBase64 required",
  });

/** Suggest a document title from PDF/text body for the admin Add Source form. */
export async function POST(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    let content = parsed.data.content ?? "";
    if (parsed.data.pdfBase64) {
      content = await contentFromPdfBase64(parsed.data.pdfBase64);
    }
    const fallback = parsed.data.fileName
      ? titleFromFileName(parsed.data.fileName)
      : undefined;
    const title = suggestTitleFromText(content, fallback);
    return NextResponse.json({
      title,
      preview: content.slice(0, 240),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Suggest failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
