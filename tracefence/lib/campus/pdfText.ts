/**
 * Extract plain text from a PDF buffer for org ingest / chunking.
 * Synthetic demo PDFs only  not a production-grade parser.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  // pdf-parse is CJS; dynamic import keeps Next edge bundles calm.
  const pdfParse = (await import("pdf-parse")).default as (
    data: Buffer,
  ) => Promise<{ text: string; numpages?: number }>;
  const result = await pdfParse(buffer);
  const text = (result.text ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) {
    throw new Error("PDF contained no extractable text");
  }
  // Insert page breaks roughly by form-feed if library didn't; keep length honest.
  return text;
}

export function looksLikePdfBase64(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("data:application/pdf;base64,")) return true;
  // Raw base64 of "%PDF"
  return trimmed.startsWith("JVBERi0");
}

export async function contentFromPdfBase64(base64: string): Promise<string> {
  const raw = base64.includes(",")
    ? base64.slice(base64.indexOf(",") + 1)
    : base64;
  const buffer = Buffer.from(raw, "base64");
  if (buffer.subarray(0, 4).toString("utf8") !== "%PDF") {
    throw new Error("Not a PDF");
  }
  return extractPdfText(buffer);
}
