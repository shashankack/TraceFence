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

/**
 * Last-resort text pull for synthetic / broken-xref demos when pdf-parse fails
 * (common "bad XRef entry"). Reads PDF literal strings inside content streams only.
 */
function extractPdfStringsFallback(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const streams: string[] = [];
  const streamRe = /stream\r?\n([\s\S]*?)endstream/g;
  let sm: RegExpExecArray | null;
  while ((sm = streamRe.exec(raw))) {
    streams.push(sm[1]!);
  }
  const haystacks = streams.length > 0 ? streams : [raw];
  const parts: string[] = [];
  const re = /\(((?:\\.|[^\\)])*)\)/g;
  for (const chunk of haystacks) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(chunk))) {
      const decoded = m[1]!
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\")
        .replace(/\\(\d{1,3})/g, (_, oct: string) =>
          String.fromCharCode(parseInt(oct, 8) & 0xff),
        );
      const trimmed = decoded.trim();
      if (trimmed.length >= 4 && /[A-Za-z]{2,}/.test(trimmed)) {
        parts.push(trimmed);
      }
    }
  }
  const out: string[] = [];
  for (const p of parts) {
    if (out[out.length - 1] !== p) out.push(p);
  }
  return out.join("\n").trim();
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = await loadPdfParse();
    const result = await pdfParse(buffer);
    const text = (result.text ?? "").replace(/\r\n/g, "\n").trim();
    if (text) return text;
  } catch (err) {
    const fallback = extractPdfStringsFallback(buffer);
    if (fallback) return fallback;
    const detail = err instanceof Error ? err.message : "parse failed";
    throw new Error(`PDF text extraction failed (${detail})`);
  }
  const fallback = extractPdfStringsFallback(buffer);
  if (fallback) return fallback;
  throw new Error("PDF contained no extractable text");
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
