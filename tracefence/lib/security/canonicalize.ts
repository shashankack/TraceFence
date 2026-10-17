import { createHash } from "crypto";

/** Stable JSON → SHA-256 for exact-action approval binding. */
export function canonicalizeArgs(args: Record<string, unknown>): string {
  return JSON.stringify(sortKeys(args));
}

export function hashArgs(args: Record<string, unknown>): string {
  return createHash("sha256").update(canonicalizeArgs(args)).digest("hex");
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      out[key] = sortKeys(obj[key]);
    }
    return out;
  }
  return value;
}
