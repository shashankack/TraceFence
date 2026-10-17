/**
 * Guards over untrusted document / model text.
 * Content never changes permissions  we only detect, log, and refuse unsafe output.
 */

import { looksLikePromptInjection } from "./authGate";

export type ContentScanHit = {
  kind: "instruction_override" | "tool_inducement" | "classification_claim";
  excerpt: string;
};

/**
 * Strip benign corpus metadata before scanning.
 * Seed/admin files often start with `Classification: public`  that mirrors the
 * org ACL label and must not be treated as a self-elevate attempt.
 */
function stripBenignClassificationMeta(text: string): string {
  return text.replace(
    /^\s{0,3}(?:#+\s*)?classification\s*[:=]\s*(public|internal|confidential)\s*$/gim,
    "",
  );
}

/** Indirect prompt injection or tool inducement inside retrieved / uploaded text. */
export function scanUntrustedContent(text: string): ContentScanHit[] {
  const hits: ContentScanHit[] = [];
  const body = stripBenignClassificationMeta(text);
  const t = body.toLowerCase();

  if (looksLikePromptInjection(body)) {
    hits.push({
      kind: "instruction_override",
      excerpt: clip(body),
    });
  }

  if (
    /\b(export|email|send|notify|dump)\b.{0,60}\b(all|every|entire)\b.{0,40}\b(email|student|grades?|directory|roster)\b/.test(
      t,
    ) ||
    /\b(email|send|forward|notify).{0,40}(to|at)\s+[\w.+-]+@[\w.-]+/.test(t) ||
    /\battacker@/.test(t) ||
    /\b(call|invoke|run|use)\s+(the\s+)?(tool|function)\s+(export_records|notify_external)/.test(
      t,
    )
  ) {
    hits.push({
      kind: "tool_inducement",
      excerpt: clip(body),
    });
  }

  // Only flag attempts to override / self-elevate  not a static ACL label line.
  if (
    /\b(set|mark|treat|change|override)\s+(this|me|my|the)?\s*(document|file|source|classification|clearance)?\s*(as|to|=|:)?\s*(confidential|internal|public|admin)\b/.test(
      t,
    ) ||
    /\bignore\s+(the\s+)?(admin|org|gateway)\s+(classification|policy|acl)\b/.test(t) ||
    /\b(classification|clearance|acl)\s*[:=]\s*admin\b/.test(t)
  ) {
    hits.push({
      kind: "classification_claim",
      excerpt: clip(body),
    });
  }

  return hits;
}

/**
 * Strip lines that try to self-declare classification.
 * Tool-inducement text stays in the corpus as untrusted data (gateway still DENYs).
 * Admin-chosen classification in the API remains authoritative.
 */
export function stripContentPolicyClaims(content: string): {
  content: string;
  stripped: boolean;
} {
  const lines = content.split(/\r?\n/);
  let stripped = false;
  const kept = lines.filter((line) => {
    const l = line.toLowerCase();
    if (
      /^\s*classification\s*[:=]/i.test(l) ||
      /^\s*#+\s*classification\b/i.test(l) ||
      /\bset (this|my) (document|file) (to|as) (confidential|internal|public)\b/i.test(
        l,
      ) ||
      /\bignore\s+(the\s+)?(admin|org)\s+(classification|policy)\b/i.test(l)
    ) {
      stripped = true;
      return false;
    }
    return true;
  });
  return { content: kept.join("\n"), stripped };
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_RE = /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g;

/**
 * True when the model invents contact identifiers not present in Allowed context.
 * Greetings / refusals / short follow-ups without PII-like tokens are fine.
 */
export function answerLooksUngrounded(
  reply: string,
  allowedContext: string,
): boolean {
  const r = reply.trim();
  if (!r) return false;
  if (
    /lack permitted|cannot|can't|only answer|campus assistant|no allowed|not find|refused|out of scope/i.test(
      r,
    )
  ) {
    return false;
  }

  const ctx = allowedContext.toLowerCase();
  const emails = r.match(EMAIL_RE) ?? [];
  for (const e of emails) {
    if (!ctx.includes(e.toLowerCase())) return true;
  }

  const phones = r.match(PHONE_RE) ?? [];
  for (const p of phones) {
    const compact = p.replace(/\D/g, "");
    if (compact.length >= 10 && !ctx.replace(/\D/g, "").includes(compact)) {
      return true;
    }
  }

  // Fabricated “Access Granted”-style compliance already handled elsewhere.
  return false;
}

function clip(text: string, n = 120): string {
  const one = text.replace(/\s+/g, " ").trim();
  return one.length > n ? `${one.slice(0, n)}…` : one;
}
