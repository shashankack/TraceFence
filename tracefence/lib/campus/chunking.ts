/** Lexical chunking for ACL-filtered RAG. Keeps LLM context small. */

export interface TextChunk {
  index: number;
  content: string;
  /** 1-based page hint when form-feed or "Page N" markers exist */
  page: number | null;
}

const DEFAULT_SIZE = 1200;
const DEFAULT_OVERLAP = 150;

/**
 * Split document text into overlapping windows.
 * Prefer paragraph/sentence boundaries so curfew-style lines stay intact.
 */
export function chunkText(
  text: string,
  opts?: { size?: number; overlap?: number },
): TextChunk[] {
  const size = opts?.size ?? DEFAULT_SIZE;
  const overlap = opts?.overlap ?? DEFAULT_OVERLAP;
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const pages = normalized.includes("\f")
    ? normalized.split("\f")
    : [normalized];

  const chunks: TextChunk[] = [];
  let globalIndex = 0;

  pages.forEach((pageText, pageIdx) => {
    const page = pages.length > 1 ? pageIdx + 1 : detectPageMarker(pageText);
    const parts = splitWindow(pageText.trim(), size, overlap);
    for (const part of parts) {
      if (!part.trim()) continue;
      chunks.push({
        index: globalIndex++,
        content: part.trim(),
        page,
      });
    }
  });

  return chunks;
}

function detectPageMarker(text: string): number | null {
  const m = text.match(/\bpage\s+(\d+)\b/i);
  return m ? Number(m[1]) : null;
}

function splitWindow(text: string, size: number, overlap: number): string[] {
  if (text.length <= size) return [text];

  const out: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + size, text.length);
    if (end < text.length) {
      const slice = text.slice(start, end);
      const breakAt = Math.max(
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf("\n"),
        slice.lastIndexOf(". "),
      );
      if (breakAt > size * 0.4) {
        end = start + breakAt + 1;
      }
    }
    out.push(text.slice(start, end));
    if (end >= text.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return out;
}
