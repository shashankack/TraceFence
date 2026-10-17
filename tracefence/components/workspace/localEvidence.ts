import type { Decision, EventDTO, Role } from "@/components/api/types";

/**
 * Browser-local mirror of gateway evidence.
 * On Vercel, SQLite is per-instance — student chat and admin audit often hit
 * different functions. This keeps flagged upload / chat events visible when
 * switching roles in the same browser for the demo.
 */
export interface LocalEvidenceSession {
  sessionId: string;
  role: Role;
  userId: string;
  events: EventDTO[];
}

const KEY = "tracefence.localEvidence";
const MAX_SESSIONS = 40;
const MAX_EVENTS = 80;

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
    window.localStorage.setItem(KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
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
    const id = e.id ?? `${input.sessionId}:${e.ts ?? ""}:${e.tool ?? ""}:${e.reasonCode ?? ""}`;
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

export function localDecisionCounts(): Array<{ decision: Decision; count: number }> {
  const counts = new Map<Decision, number>();
  for (const s of readRaw()) {
    for (const e of s.events) {
      if (!e.decision) continue;
      const d = e.decision as Decision;
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
  }
  return [...counts.entries()].map(([decision, count]) => ({ decision, count }));
}

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
  for (const s of server.sessions) byId.set(s.sessionId, { ...s, events: [...s.events] });
  for (const s of local) {
    const cur = byId.get(s.sessionId);
    if (!cur) {
      byId.set(s.sessionId, { ...s, events: [...s.events] });
      continue;
    }
    const seen = new Set(cur.events.map((e) => e.id).filter(Boolean));
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
  const totalSessions = Math.max(server.totalSessions, sessions.length);
  return {
    ...server,
    sessions,
    totalSessions,
    totalPages: Math.max(server.totalPages, Math.ceil(totalSessions / server.pageSize) || 1),
  };
}

export function mergeAuditCounts(
  server: Array<{ decision: Decision; count: number }> | undefined,
  local: Array<{ decision: Decision; count: number }>,
): Array<{ decision: Decision; count: number }> {
  const map = new Map<Decision, number>();
  for (const row of server ?? []) map.set(row.decision, row.count);
  for (const row of local) {
    // Prefer the larger of server vs local for each decision (avoid double-count
    // when the same instance served both) by taking max.
    map.set(row.decision, Math.max(map.get(row.decision) ?? 0, row.count));
  }
  return [...map.entries()].map(([decision, count]) => ({ decision, count }));
}
