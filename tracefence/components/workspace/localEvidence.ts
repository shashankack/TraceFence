import type { Decision, EventDTO, Role } from "@/components/api/types";

/**
 * Browser-local mirror of gateway evidence for same-browser demos on Vercel
 * (per-instance /tmp SQLite). Counts must come from unique event ids — never
 * Math.max of unrelated server vs local aggregates.
 */
export interface LocalEvidenceSession {
  sessionId: string;
  role: Role;
  userId: string;
  events: EventDTO[];
}

const KEY = "tracefence.localEvidence";
const MAX_SESSIONS = 40;
const MAX_EVENTS = 120;

function readRaw(): LocalEvidenceSession[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalEvidenceSession[]) : [];
  } catch {
    return [];
  }
}

function writeRaw(sessions: LocalEvidenceSession[]) {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify(sessions.slice(0, MAX_SESSIONS)),
    );
  } catch {
    /* storage full / private mode */
  }
}

export function readLocalEvidence(): LocalEvidenceSession[] {
  return readRaw();
}

export function rememberLocalEvents(input: {
  sessionId: string;
  role: Role;
  userId: string;
  events: EventDTO[];
}) {
  if (typeof window === "undefined" || input.events.length === 0) return;
  const prev = readRaw();
  const existing = prev.find((s) => s.sessionId === input.sessionId);
  const byId = new Map<string, EventDTO>();
  for (const e of existing?.events ?? []) {
    if (e.id) byId.set(e.id, e);
  }
  for (const e of input.events) {
    const id =
      e.id ??
      `${input.sessionId}:${e.ts ?? ""}:${e.tool ?? ""}:${e.reasonCode ?? ""}`;
    byId.set(id, { ...e, id, sessionId: e.sessionId ?? input.sessionId });
  }
  const events = [...byId.values()]
    .sort((a, b) => (a.ts ?? "").localeCompare(b.ts ?? ""))
    .slice(-MAX_EVENTS);
  const next: LocalEvidenceSession = {
    sessionId: input.sessionId,
    role: input.role,
    userId: input.userId,
    events,
  };
  writeRaw([next, ...prev.filter((s) => s.sessionId !== input.sessionId)]);
}

/** Decision tallies from one coherent event list (unique by id). */
export function countsFromEvents(events: EventDTO[]): {
  sessionDecisions: Array<{ decision: Decision; count: number }>;
  withDecision: number;
} {
  const seen = new Set<string>();
  const map = new Map<Decision, number>();
  for (const e of events) {
    if (!e.decision) continue;
    const id = e.id ?? `${e.ts}:${e.tool}:${e.reasonCode}:${e.decision}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const d = e.decision as Decision;
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  return {
    sessionDecisions: [...map.entries()].map(([decision, count]) => ({
      decision,
      count,
    })),
    withDecision: seen.size,
  };
}

export function countsFromSessions(sessions: LocalEvidenceSession[]) {
  const events = sessions.flatMap((s) => s.events);
  return {
    sessions: sessions.length,
    ...countsFromEvents(events),
  };
}

/**
 * Merge server page + local mirror by session/event id.
 * Totals reflect the merged set — not a max of unrelated aggregates.
 */
export function mergeEvidencePages(
  server: {
    sessions: LocalEvidenceSession[];
    page: number;
    pageSize: number;
    totalSessions: number;
    totalPages: number;
  },
  local: LocalEvidenceSession[],
) {
  const byId = new Map<string, LocalEvidenceSession>();

  for (const s of server.sessions) {
    byId.set(s.sessionId, { ...s, events: [...s.events] });
  }
  for (const s of local) {
    const cur = byId.get(s.sessionId);
    if (!cur) {
      byId.set(s.sessionId, { ...s, events: [...s.events] });
      continue;
    }
    const seen = new Set(
      cur.events.map((e) => e.id).filter((id): id is string => Boolean(id)),
    );
    for (const e of s.events) {
      if (e.id && seen.has(e.id)) continue;
      cur.events.push(e);
      if (e.id) seen.add(e.id);
    }
    cur.events.sort((a, b) => (a.ts ?? "").localeCompare(b.ts ?? ""));
  }

  const sessions = [...byId.values()].sort((a, b) => {
    const at = a.events[a.events.length - 1]?.ts ?? "";
    const bt = b.events[b.events.length - 1]?.ts ?? "";
    return bt.localeCompare(at);
  });

  // When local mirror is active, totals = what the UI can actually show.
  // Pure server mode keeps server pagination totals.
  const totalSessions =
    local.length > 0 ? sessions.length : server.totalSessions;

  return {
    page: server.page,
    pageSize: server.pageSize,
    sessions,
    totalSessions,
    totalPages: Math.max(1, Math.ceil(totalSessions / server.pageSize) || 1),
  };
}
