/**
 * Extract plain text from a PDF buffer for org ingest / chunking.
 * Synthetic demo PDFs only — not a production-grade parser.
 */

import type { ContentScanHit } from "./contentGuards";
import { scanPdfBufferForInvisibleWatermark } from "./pdfWatermark";

export type PdfIngestResult = {
  text: string;
  flags: ContentScanHit[];
};

async function loadPdfParse(): Promise<
  (data: Buffer) => Promise<{ text: string; numpages?: number }>
> {
  // Load the lib entry, not package index.js. That index runs a debug harness
  // when module.parent is unset (common under Next) and ENOENTs on
  // ./test/data/05-versions-space.pdf relative to cwd.
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  return require("pdf-parse/lib/pdf-parse.js") as (
    data: Buffer,
  ) => Promise<{ text: string; numpages?: number }>;
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = await loadPdfParse();
  const result = await pdfParse(buffer);
  const text = (result.text ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) {
    throw new Error("PDF contained no extractable text");
  }
  return text;
}

/** Extract text and scan raw bytes for invisible watermark heuristics. */
export async function ingestPdfBuffer(buffer: Buffer): Promise<PdfIngestResult> {
  if (buffer.subarray(0, 4).toString("utf8") !== "%PDF") {
    throw new Error("Not a PDF");
  }
  const flags = scanPdfBufferForInvisibleWatermark(buffer);
  const text = await extractPdfText(buffer);
  return { text, flags };
}

export function looksLikePdfBase64(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("data:application/pdf;base64,")) return true;
  // Raw base64 of "%PDF"
  return trimmed.startsWith("JVBERi0");
}

export async function contentFromPdfBase64(base64: string): Promise<string> {
  const { text } = await ingestPdfBase64(base64);
  return text;
}

export async function ingestPdfBase64(base64: string): Promise<PdfIngestResult> {
  const raw = base64.includes(",")
    ? base64.slice(base64.indexOf(",") + 1)
    : base64;
  const buffer = Buffer.from(raw, "base64");
  return ingestPdfBuffer(buffer);
}
