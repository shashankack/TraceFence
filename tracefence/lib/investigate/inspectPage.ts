import { ReasonCode } from "../security/reasonCodes";

export type InspectResult =
  | {
      ok: true;
      sourceId: string;
      url: string;
      title: string;
      excerpt: string;
      flaggedInstruction: string | null;
      inspectedAt: string;
      reasonCode: typeof ReasonCode.SOURCE_INSPECTED;
    }
  | {
      ok: false;
      reasonCode: typeof ReasonCode.DENIED_SOURCE_HOST | typeof ReasonCode.NOT_IMPLEMENTED;
      message: string;
    };

function allowlistPrefixes(): string[] {
  const raw =
    process.env.SOURCE_ALLOWLIST_PREFIXES ??
    "http://127.0.0.1:3000/fixtures/pages/,http://localhost:3000/fixtures/pages/";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAllowlistedSourceUrl(url: string): boolean {
  return allowlistPrefixes().some((prefix) => url.startsWith(prefix));
}

/**
 * Playwright-backed inspect lands next.
 * For now: allowlist check only; returns NOT_IMPLEMENTED so routes stay honest.
 */
export async function inspectPage(url: string): Promise<InspectResult> {
  if (!isAllowlistedSourceUrl(url)) {
    return {
      ok: false,
      reasonCode: ReasonCode.DENIED_SOURCE_HOST,
      message: "URL not on synthetic page allowlist",
    };
  }

  return {
    ok: false,
    reasonCode: ReasonCode.NOT_IMPLEMENTED,
    message:
      "Inspect allowlisted; Playwright fetch + SOURCE persist not wired yet",
  };
}
