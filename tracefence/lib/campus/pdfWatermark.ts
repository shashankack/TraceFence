/**
 * Heuristic scan of raw PDF bytes for common invisible-text / watermark tricks.
 * Demo-grade — not a full PDF steganography detector. Content still never
 * changes permissions; we only flag for the sanitize timeline.
 */

import type { ContentScanHit } from "./contentGuards";

/**
 * Inspect PDF structure (not just extracted text) for invisible watermark signals:
 * - Text render mode 3 (neither fill nor stroke = invisible)
 * - Graphics state fill/stroke alpha 0
 * - Sub-1pt font sizes often used for hidden payloads
 * - Near-white fill immediately before a text show operator (heuristic)
 */
export function scanPdfBufferForInvisibleWatermark(
  buffer: Buffer,
): ContentScanHit[] {
  const hits: ContentScanHit[] = [];
  // Latin1 keeps byte values stable for ASCII PDF operators.
  const raw = buffer.toString("latin1");

  if (/\b3\s+Tr\b/.test(raw)) {
    hits.push({
      kind: "invisible_watermark",
      excerpt:
        "PDF uses text render mode 3 (invisible text) — common watermark / stego channel",
    });
  }

  if (/\/(?:ca|CA)\s+0(?:\.0+)?\b/.test(raw)) {
    hits.push({
      kind: "invisible_watermark",
      excerpt: "PDF ExtGState sets fill/stroke alpha to 0 (transparent text/graphics)",
    });
  }

  // Font size under 1pt: "0.5 Tf" / "0.01 Tf" (not "10 Tf" / "11 Tf").
  if (/(?:^|[^0-9.])0\.\d{1,4}\s+Tf\b/.test(raw)) {
    hits.push({
      kind: "invisible_watermark",
      excerpt: "PDF draws text at sub-1pt font size (often an invisible payload)",
    });
  }

  // Near-white RGB/gray fill shortly before a text-showing operator.
  if (
    /(?:1(?:\.0+)?\s+){2}1(?:\.0+)?\s+rg[\s\S]{0,120}(?:Tj|TJ|'|")/.test(raw) ||
    /1(?:\.0+)?\s+g[\s\S]{0,80}(?:Tj|TJ|'|")/.test(raw)
  ) {
    hits.push({
      kind: "invisible_watermark",
      excerpt: "Near-white fill used before text show (white-on-white watermark pattern)",
    });
  }

  // Optional-content / hidden layer hooks (soft signal — only if paired with text ops nearby).
  if (
    /\/OCProperties\b/.test(raw) &&
    /\/OFF\s*\[/.test(raw) &&
    /\b(?:Tj|TJ)\b/.test(raw)
  ) {
    hits.push({
      kind: "invisible_watermark",
      excerpt: "PDF Optional Content has default-OFF layers with text (hidden OCG watermark)",
    });
  }

  // De-dupe by excerpt.
  const seen = new Set<string>();
  return hits.filter((h) => {
    const key = `${h.kind}:${h.excerpt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
