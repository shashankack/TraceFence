import type { Role } from "@/components/api/types";

/**
 * Sessions opened in this browser (guest sidebar / active restore for signed-in users).
 * Admin audit evidence is tenant-wide via GET /api/audit/evidence  not this list.
 * Only ids are stored  never events or content.
 */
export interface KnownSession {
  sessionId: string;
  role: Role;
  userId: string;
  createdAt: string;
  title?: string;
}

const KEY = "tracefence.sessions";
const activeKey = (userId: string) => `tracefence.activeSession.${userId}`;

/** Last open chat for this user  survive reloads without spawning a new session. */
export function getActiveSessionId(userId: string): string | null {
  try {
    return window.localStorage.getItem(activeKey(userId));
  } catch {
    return null;
  }
}

export function setActiveSessionId(userId: string, sessionId: string | null) {
  try {
    if (sessionId) window.localStorage.setItem(activeKey(userId), sessionId);
    else window.localStorage.removeItem(activeKey(userId));
  } catch {
    /* ignore */
  }
}

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
    const prev = readSessions().find((x) => x.sessionId === s.sessionId);
    const merged: KnownSession = {
      ...prev,
      ...s,
      title: s.title ?? prev?.title,
    };
    const next = [merged, ...readSessions().filter((x) => x.sessionId !== s.sessionId)].slice(
      0,
      40,
    );
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable  audit falls back to the tenant aggregate only */
  }
}

export function forgetSessions(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(readSessions().filter((s) => !ids.includes(s.sessionId))));
  } catch {
    /* ignore */
  }
}

/** Wipe browser-local chat index (guest sidebar + active session pointers). */
export function clearAllKnownSessions() {
  try {
    window.localStorage.removeItem(KEY);
    const prefix = "tracefence.activeSession.";
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(prefix)) window.localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

/** Drop any browser-local chat pointers for one principal (used for guests). */
export function forgetUserSessions(userId: string) {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify(readSessions().filter((s) => s.userId !== userId)),
    );
    setActiveSessionId(userId, null);
  } catch {
    /* ignore */
  }
}
