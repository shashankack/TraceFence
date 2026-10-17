import { toolArgSchemas, type ToolName } from "../agent/toolSchemas";
import { ReasonCode } from "./reasonCodes";
import type { AuthorizeResult } from "./types";

/** Datasets the campus export tool may name (synthetic demo only). */
export const EXPORT_DATASETS = new Set([
  "student_emails",
  "student_directory",
  "grades_summary",
  "announcements",
]);

/**
 * External notify destinations  demo allowlist only.
 * Override with NOTIFY_ALLOWLIST_SUFFIXES=nulltrace.example,.edu
 */
export function notifyAllowlistSuffixes(): string[] {
  const raw =
    process.env.NOTIFY_ALLOWLIST_SUFFIXES ??
    "nulltrace.example,nulltrace.demo,students.nulltrace.example";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function recipientAllowed(to: string): boolean {
  const email = to.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  const domain = email.split("@")[1] ?? "";
  return notifyAllowlistSuffixes().some(
    (suffix) => domain === suffix || domain.endsWith(`.${suffix}`) || email.endsWith(`@${suffix}`),
  );
}

/**
 * Schema + destination checks before policy ALLOW can execute.
 * Returns null when args are acceptable.
 */
export function validateToolArgs(
  tool: string,
  args: Record<string, unknown>,
): AuthorizeResult | null {
  if (!(tool in toolArgSchemas)) {
    return {
      decision: "DENY",
      reasonCode: ReasonCode.DENIED_TOOL_UNKNOWN,
      message: `Unknown tool: ${tool}`,
    };
  }

  const schema = toolArgSchemas[tool as ToolName];
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return {
      decision: "DENY",
      reasonCode: ReasonCode.DENIED_SCHEMA,
      message: `Invalid args for ${tool}: ${parsed.error.issues[0]?.message ?? "schema mismatch"}`,
    };
  }

  if (tool === "export_records") {
    const dataset = String(
      (parsed.data as { dataset?: string }).dataset ?? "",
    ).toLowerCase();
    if (!EXPORT_DATASETS.has(dataset)) {
      return {
        decision: "DENY",
        reasonCode: ReasonCode.DENIED_SCHEMA,
        message: `Dataset "${dataset}" is not an allowed export target`,
      };
    }
  }

  if (tool === "notify_external") {
    const to = String((parsed.data as { to?: string }).to ?? "").trim();
    if (!recipientAllowed(to)) {
      return {
        decision: "DENY",
        reasonCode: ReasonCode.DENIED_RECIPIENT,
        message: `Recipient "${to}" is outside the notify allowlist`,
      };
    }
  }

  return null;
}
