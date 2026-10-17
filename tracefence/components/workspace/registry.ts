import type { Role } from "@/components/api/types";

/**
 * Sessions opened in this browser, so the admin audit can re-fetch their events from the server
 * (GET /api/sessions/:id/events is tenant-scoped). Only ids are stored — never events or content.
 */
export interface KnownSession {
  sessionId: string;
  role: Role;
  userId: string;
  createdAt: string;
}

const KEY = "tracefence.sessions";

export function readSessions(): KnownSession[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as KnownSession[]) : [];
  } catch {
    return [];
  }
}

export function rememberSession(s: KnownSession) {
  try {
    const next = [s, ...readSessions().filter((x) => x.sessionId !== s.sessionId)].slice(0, 40);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — audit falls back to the tenant aggregate only */
  }
}

export function forgetSessions(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(readSessions().filter((s) => !ids.includes(s.sessionId))));
  } catch {
    /* ignore */
  }
}
