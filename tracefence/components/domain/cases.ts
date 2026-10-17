import type { EventDTO, Role } from "@/components/api/types";

export interface EvidenceCase {
  ref: string;
  event: EventDTO;
  role: Role;
  sessionId: string;
  inContext: string[];
  fenced: string[];
}

/** Walks each session in order and pairs every tool decision with the context the ACL built for it. */
export function buildCases(sessions: Array<{ sessionId: string; role: Role; events: EventDTO[] }>): EvidenceCase[] {
  const raw: Omit<EvidenceCase, "ref">[] = [];
  for (const s of sessions) {
    let inContext: string[] = [];
    let fenced: string[] = [];
    for (const e of [...s.events].sort((a, b) => (a.ts ?? "").localeCompare(b.ts ?? ""))) {
      if (e.reasonCode === "RETRIEVAL_FILTERED") {
        fenced = Array.isArray(e.argsPreview?.filteredOut) ? (e.argsPreview.filteredOut as string[]) : [];
        continue;
      }
      if (e.tool === "search_docs") {
        inContext = e.docIds ?? [];
        fenced = [];
      }
      if (e.tool) raw.push({ event: e, role: s.role, sessionId: s.sessionId, inContext, fenced });
    }
  }
  raw.sort((a, b) => (a.event.ts ?? "").localeCompare(b.event.ts ?? ""));
  return raw.map((c, i) => ({ ...c, ref: `EV-${String(i + 1).padStart(3, "0")}` }));
}
