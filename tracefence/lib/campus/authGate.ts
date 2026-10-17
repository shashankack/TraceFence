/**
 * Guest may ask public campus questions without signing in.
 * Anything that needs a real membership (internal/confidential/tools) gates to login.
 */

export function wantsExport(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("export") ||
    (m.includes("email") &&
      (m.includes("all") || m.includes("list") || m.includes("dump"))) ||
    m.includes("directory dump") ||
    m.includes("download student")
  );
}

/** True when an anonymous guest must sign in before the gateway may proceed. */
export function guestQueryRequiresLogin(message: string): boolean {
  if (wantsExport(message)) return true;
  const m = message.toLowerCase();
  return (
    /\b(grade|grades|gpa|marks|transcript|scorecard)\b/.test(m) ||
    /\b(directory|peer email|student email|roster|advisee)\b/.test(m) ||
    /\b(confidential|internal faculty|faculty guide|faculty guidance)\b/.test(
      m,
    ) ||
    /\b(announce|announcement|notify external|bulk email)\b/.test(m)
  );
}
