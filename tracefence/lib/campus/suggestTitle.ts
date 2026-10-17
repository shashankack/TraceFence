/**
 * Best-effort document title from extracted text (PDF/txt).
 * Prefers headings and short title-like lines over filenames.
 */

const JUNK =
  /^(page\s*\d+|confidential|draft|internal use only|table of contents|contents|untitled|https?:\/\/)/i;

function cleanTitle(raw: string): string {
  return raw
    .replace(/^#+\s*/, "")
    .replace(/^[\d.]+\s+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function looksLikeTitle(line: string): boolean {
  if (line.length < 6 || line.length > 90) return false;
  if (JUNK.test(line)) return false;
  if (/[.!?;:]$/.test(line) && line.length > 40) return false;
  // Avoid dense body paragraphs.
  if ((line.match(/,/g) ?? []).length >= 3) return false;
  if ((line.match(/\s/g) ?? []).length > 14) return false;
  return true;
}

/**
 * Derive a human title from document body text.
 * `fallback` is typically a cleaned file name.
 */
export function suggestTitleFromText(text: string, fallback?: string): string {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return (fallback?.trim() || "Untitled source").slice(0, 80);
  }

  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 60);

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.+)$/);
    if (heading?.[1] && looksLikeTitle(heading[1])) {
      return cleanTitle(heading[1]);
    }
  }

  for (const line of lines) {
    if (looksLikeTitle(line)) return cleanTitle(line);
  }

  // First sentence of the opening paragraph.
  const para = lines[0] ?? "";
  const sentence = para.split(/(?<=[.!?])\s+/)[0] ?? para;
  if (sentence.length >= 6) {
    return cleanTitle(sentence.length > 80 ? `${sentence.slice(0, 77)}…` : sentence);
  }

  return (fallback?.trim() || "Untitled source").slice(0, 80);
}

export function titleFromFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
