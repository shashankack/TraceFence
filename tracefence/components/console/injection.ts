/**
 * Display-only heuristics that flag instruction-like text inside untrusted input so a reviewer
 * can see it. This is NOT the security control: the server gateway authorizes every tool call
 * on identity + policy regardless of what the text says.
 */

export interface InjectionFlag {
  label: string;
  match: string;
}

const PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: "Instruction override", re: /\b(ignore|disregard|forget)\b[^.\n]{0,40}\b(previous|prior|above|earlier|all|system)\b[^.\n]{0,20}\b(instructions?|rules?|prompts?|policy|polic(?:y|ies))\b/gi },
  { label: "System impersonation", re: /\b(system override|system prompt|developer mode|jailbreak)\b/gi },
  { label: "Role escalation", re: /\b(you are now|act as|pretend to be)\b[^.\n]{0,30}\b(admin(?:istrator)?|root|faculty|superuser)\b/gi },
  { label: "Bulk exfiltration", re: /\b(export|send|email|forward|dump|leak)\b[^.\n]{0,40}\b(all|every|entire|complete|full)\b[^.\n]{0,40}\b(students?|records?|emails?|addresses|directory|grades|data)\b/gi },
  { label: "External recipient", re: /[\w.+-]+@(?![\w-]*\.?(nulltrace|company)\.(demo|example)\b)[\w-]+(\.[\w-]+)+/gi },
  { label: "Secrecy request", re: /\b(do not|don't)\s+(tell|log|mention|report)\b/gi },
];

/** Patterns that try to subvert instructions or identity — the ones that make a flag an injection. */
const INJECTION_LABELS = new Set(["Instruction override", "System impersonation", "Role escalation", "Secrecy request"]);

export function isInjection(flags: InjectionFlag[]) {
  return flags.some((f) => INJECTION_LABELS.has(f.label));
}

export function scanForInjection(text: string): InjectionFlag[] {
  const flags: InjectionFlag[] = [];
  for (const { label, re } of PATTERNS) {
    for (const m of text.matchAll(re)) flags.push({ label, match: m[0] });
  }
  return flags;
}

/** External addresses named in untrusted input — shown as the attempted exfiltration target. */
export function externalRecipients(text: string): string[] {
  const re = PATTERNS.find((p) => p.label === "External recipient")!.re;
  return [...new Set([...text.matchAll(re)].map((m) => m[0]))];
}

/** Splits text into plain and flagged segments for highlighting (rendered as text nodes only). */
export function highlightSegments(text: string): Array<{ text: string; flagged: boolean }> {
  const ranges: Array<[number, number]> = [];
  for (const { re } of PATTERNS) {
    for (const m of text.matchAll(re)) ranges.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
  }
  if (!ranges.length) return [{ text, flagged: false }];
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  const out: Array<{ text: string; flagged: boolean }> = [];
  let cursor = 0;
  for (const [a, b] of merged) {
    if (a > cursor) out.push({ text: text.slice(cursor, a), flagged: false });
    out.push({ text: text.slice(a, b), flagged: true });
    cursor = b;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), flagged: false });
  return out;
}
