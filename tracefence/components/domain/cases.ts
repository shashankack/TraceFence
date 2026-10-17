import type { EventDTO, Role } from "@/components/api/types";

export interface EvidenceCase {
  ref: string;
  event: EventDTO;
  role: Role;
  sessionId: string;
  inContext: string[];
  fenced: string[];
}

/** Walks each session in order and pairs every gateway decision with the ACL context for that turn. */
export function buildCases(sessions: Array<{ sessionId: string; role: Role; events: EventDTO[] }>): EvidenceCase[] {
  const raw: Omit<EvidenceCase, "ref">[] = [];
  for (const s of sessions) {
    let inContext: string[] = [];
    let fenced: string[] = [];
    for (const e of [...s.events].sort((a, b) => (a.ts ?? "").localeCompare(b.ts ?? ""))) {
      if (e.reasonCode === "RETRIEVAL_FILTERED") {
        fenced = Array.isArray(e.argsPreview?.filteredOut)
          ? (e.argsPreview.filteredOut as string[])
          : [];
        continue;
      }
      if (e.tool === "search_docs") {
        inContext = e.docIds ?? [];
        fenced = [];
      }
      // Include tool calls and decision-only rows (e.g. INJECTION_IGNORED has no tool).
      if (e.tool || e.decision) {
        raw.push({
          event: e.tool
            ? e
            : {
                ...e,
                tool:
                  e.reasonCode === "INJECTION_IGNORED" ||
                  e.reasonCode === "SCOPE_REFUSED" ||
                  e.reasonCode === "DENIED_SCOPE"
                    ? "policy_guard"
                    : "gateway",
              },
          role: s.role,
          sessionId: s.sessionId,
          inContext,
          fenced,
        });
      }
    }
  }
  raw.sort((a, b) => (a.event.ts ?? "").localeCompare(b.event.ts ?? ""));
  return raw.map((c, i) => ({ ...c, ref: `EV-${String(i + 1).padStart(3, "0")}` }));
}
