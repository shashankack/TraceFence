"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/components/api/client";
import type { ApprovalDTO, CitationDTO, EventDTO, SessionDTO } from "@/components/api/types";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  forgetSessions,
  forgetUserSessions,
  getActiveSessionId,
  rememberSession,
  setActiveSessionId,
} from "./registry";

export type ChatAttachment = {
  id: string;
  filename: string;
  status?: string;
};

export interface ChatMessage {
  id: string;
  from: "user" | "assistant";
  text: string;
  /** Files sent with this user turn (sanitized on the server). */
  attachments?: ChatAttachment[];
  citations?: CitationDTO[];
  /** Doc ids ACL fenced out of the LLM context for this turn. */
  fenced?: string[];
  blocked?: boolean;
  awaitingApproval?: boolean;
}

function fencedIdsFromEvents(events: EventDTO[]): string[] {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.reasonCode === "RETRIEVAL_FILTERED" && Array.isArray(e.argsPreview?.filteredOut)) {
      return e.argsPreview.filteredOut as string[];
    }
  }
  return [];
}

function isInformationalEvent(e: EventDTO): boolean {
  if (e.reasonCode === "RETRIEVAL_FILTERED") return true;
  if (e.reasonCode === "INJECTION_IGNORED") {
    const kind =
      e.argsPreview && typeof e.argsPreview === "object"
        ? (e.argsPreview as { kind?: string }).kind
        : undefined;
    // Indirect scans are notes; user-prompt / model-compliance ignores still block.
    return kind === "indirect_source";
  }
  return false;
}

/** True when the last real gateway decision for the turn was DENY. */
function turnWasBlocked(events: EventDTO[]): boolean {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (!e.decision || isInformationalEvent(e)) continue;
    return e.decision === "DENY";
  }
  return false;
}

export interface HistoryItem {
  sessionId: string;
  title: string;
  createdAt: string;
}

interface WorkspaceState {
  session: SessionDTO | null;
  sessionError: string | null;
  messages: ChatMessage[];
  events: EventDTO[];
  turnFrom: number;
  sending: boolean;
  /** True while restoring, opening history, or creating after delete  not "Thinking…". */
  switching: boolean;
  send: (
    text: string,
    opts?: { attachmentIds?: string[]; attachments?: ChatAttachment[] },
  ) => Promise<void>;
  reset: () => void;
  requests: ApprovalDTO[];
  history: HistoryItem[];
  refreshHistory: () => Promise<void>;
  openHistory: (sessionId: string) => Promise<void>;
  deleteHistory: (sessionId: string) => Promise<void>;
  loginGateOpen: boolean;
  loginGateReason: string | null;
  openLoginGate: (reason?: string) => void;
  closeLoginGate: () => void;
  /** Call from LoginGate after successful sign-in. */
  afterLoginContinue: () => void;
}

const Ctx = createContext<WorkspaceState | null>(null);

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}

let seq = 0;
const nextId = () => `m_${++seq}`;

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [session, setSession] = useState<SessionDTO | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [turnFrom, setTurnFrom] = useState(0);
  const [sending, setSending] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [requests, setRequests] = useState<ApprovalDTO[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loginGateOpen, setLoginGateOpen] = useState(false);
  const [loginGateReason, setLoginGateReason] = useState<string | null>(null);

  const eventsRef = useRef<EventDTO[]>([]);
  const sessionRef = useRef<SessionDTO | null>(null);
  const userIdRef = useRef<string | null>(null);
  /** Bumped to invalidate in-flight boot / open / delete-create work. */
  const opGenRef = useRef(0);
  const runTurnRef = useRef<
    (s: SessionDTO, message: string, appendUser: boolean) => Promise<void>
  >(async () => {});
  const bootedForUserRef = useRef<string | null>(null);

  userIdRef.current = user?.userId ?? null;
  sessionRef.current = session;

  const stashRetry = (msg: string | null) => {
    try {
      if (msg) sessionStorage.setItem("tracefence.pendingRetry", msg);
      else sessionStorage.removeItem("tracefence.pendingRetry");
    } catch {
      /* ignore */
    }
  };
  const takeRetry = () => {
    try {
      const msg = sessionStorage.getItem("tracefence.pendingRetry");
      sessionStorage.removeItem("tracefence.pendingRetry");
      return msg;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const refreshHistory = useCallback(async () => {
    if (!user || user.role === "guest") {
      // Guests have no durable chat history.
      setHistory([]);
      return;
    }
    try {
      const list = await api.listSessions();
      setHistory(
        list.map((s) => ({
          sessionId: s.sessionId,
          title: s.title?.trim() || "Chat",
          createdAt: s.createdAt,
        })),
      );
    } catch {
      /* keep prior */
    }
  }, [user]);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  const runTurn = useCallback(
    async (
      s: SessionDTO,
      message: string,
      appendUser: boolean,
      opts?: { attachmentIds?: string[]; attachments?: ChatAttachment[] },
    ) => {
      if (appendUser) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            from: "user",
            text: message,
            attachments: opts?.attachments?.length
              ? opts.attachments
              : undefined,
          },
        ]);
      }
      setTurnFrom(eventsRef.current.length);
      setSending(true);
      if (s.role !== "guest") {
        rememberSession({
          sessionId: s.sessionId,
          role: s.role,
          userId: s.userId,
          createdAt: new Date().toISOString(),
          title: message.slice(0, 72),
        });
        void refreshHistory();
      }
      try {
        const res = await api.sendMessage(s.sessionId, message, {
          attachmentIds: opts?.attachmentIds,
        });
        // Ignore late replies if the user switched chats mid-request.
        if (sessionRef.current?.sessionId !== s.sessionId) return;
        const timeline = await api.sessionEvents(s.sessionId).catch(() => null);
        if (sessionRef.current?.sessionId !== s.sessionId) return;
        // This turn's events come from the response. Do not slice the full
        // session timeline by a stale client length  after restore, events
        // are empty while the DB still has history, which leaked old fences.
        const turnEvents = res.events;
        if (timeline) {
          setTurnFrom(Math.max(0, timeline.length - turnEvents.length));
          setEvents(timeline);
        } else {
          setEvents((prev) => [...prev, ...turnEvents]);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            from: "assistant",
            text: res.assistantMessage,
            citations: res.citations,
            fenced: fencedIdsFromEvents(turnEvents),
            blocked: turnWasBlocked(turnEvents),
            awaitingApproval: !!res.pendingApprovalId,
          },
        ]);
        if (res.authRequired) {
          stashRetry(message);
          setLoginGateReason(
            "That question needs a signed-in campus account. Sign in below to continue.",
          );
          setLoginGateOpen(true);
        }
        if (res.pendingApprovalId) {
          const list = await api.approvals(s.sessionId).catch(() => []);
          if (sessionRef.current?.sessionId === s.sessionId) setRequests(list);
          toast("Sent to an admin for approval", {
            description: "The gateway paused this action until it is reviewed.",
          });
        }
      } catch (err) {
        if (sessionRef.current?.sessionId !== s.sessionId) return;
        const reason =
          err instanceof ApiError
            ? err.status === 0
              ? "the gateway is unreachable"
              : err.message
            : "unknown error";
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            from: "assistant",
            text: `The request did not complete: ${reason}.`,
            blocked: true,
          },
        ]);
      } finally {
        if (sessionRef.current?.sessionId === s.sessionId) setSending(false);
        if (s.role !== "guest") void refreshHistory();
      }
    },
    [refreshHistory],
  );

  runTurnRef.current = runTurn;

  const applyLoadedSession = useCallback(
    (data: {
      session: SessionDTO;
      messages: Array<{
        id: string;
        role: string;
        content: string;
        citations?: CitationDTO[];
        attachments?: ChatAttachment[];
      }>;
    }) => {
      setSession(data.session);
      sessionRef.current = data.session;
      setSessionError(null);
      setMessages(
        data.messages.map((m) => ({
          id: m.id,
          from: m.role === "user" ? ("user" as const) : ("assistant" as const),
          text: m.content,
          citations: m.citations,
          attachments: m.attachments,
        })),
      );
      setEvents([]);
      setTurnFrom(0);
      setRequests([]);
      setSending(false);
      if (data.session.role !== "guest") {
        setActiveSessionId(data.session.userId, data.session.sessionId);
        const title = data.messages.find((m) => m.role === "user")?.content.slice(0, 72);
        if (title) {
          rememberSession({
            sessionId: data.session.sessionId,
            role: data.session.role,
            userId: data.session.userId,
            createdAt: new Date().toISOString(),
            title,
          });
        }
      }
    },
    [],
  );

  const clearThread = useCallback(() => {
    setMessages([]);
    setEvents([]);
    setRequests([]);
    setTurnFrom(0);
    setSending(false);
    setSession(null);
    sessionRef.current = null;
  }, []);

  const createBlankSession = useCallback(
    async (gen: number, retry: string | null) => {
      clearThread();
      setSessionError(null);
      setSwitching(true);
      try {
        const s = await api.createSession();
        if (opGenRef.current !== gen) return;
        if (s.role !== "guest") setActiveSessionId(s.userId, s.sessionId);
        setSession(s);
        sessionRef.current = s;
        setSessionError(null);
        if (retry) {
          setSwitching(false);
          await runTurnRef.current(s, retry, true);
          return;
        }
      } catch (err) {
        if (opGenRef.current === gen) {
          setSessionError(err instanceof Error ? err.message : "Could not open a session");
        }
      } finally {
        if (opGenRef.current === gen) setSwitching(false);
      }
    },
    [clearThread],
  );

  // Boot once per identity: restore last chat, or create blank.
  useEffect(() => {
    if (!user) {
      bootedForUserRef.current = null;
      return;
    }
    if (bootedForUserRef.current === user.userId) return;
    bootedForUserRef.current = user.userId;

    const gen = ++opGenRef.current;
    const pendingRetry = takeRetry();
    const uid = user.userId;

    const boot = async () => {
      setSwitching(true);
      setSessionError(null);

      // Guests never restore  wipe any leftover browser pointers and start fresh.
      if (user.role === "guest") {
        forgetUserSessions(uid);
        if (opGenRef.current !== gen) return;
        await createBlankSession(gen, pendingRetry);
        return;
      }

      if (!pendingRetry) {
        const activeId = getActiveSessionId(uid);
        if (activeId) {
          try {
            const data = await api.sessionMessages(activeId);
            if (opGenRef.current !== gen) return;
            applyLoadedSession(data);
            setSwitching(false);
            void refreshHistory();
            return;
          } catch {
            setActiveSessionId(uid, null);
            forgetSessions([activeId]);
          }
        }
      }

      if (opGenRef.current !== gen) return;
      await createBlankSession(gen, pendingRetry);
      void refreshHistory();
    };

    void boot();
  }, [user, applyLoadedSession, createBlankSession, refreshHistory]);

  const hasPending = requests.some((r) => r.status === "PENDING");
  useEffect(() => {
    if (!session || !hasPending) return;
    const sid = session.sessionId;
    const t = setInterval(async () => {
      if (sessionRef.current?.sessionId !== sid) return;
      const [list, timeline] = await Promise.all([
        api.approvals(sid).catch(() => null),
        api.sessionEvents(sid).catch(() => null),
      ]);
      if (sessionRef.current?.sessionId !== sid) return;
      if (list) {
        setRequests((prev) => {
          for (const r of list) {
            const before = prev.find((p) => p.id === r.id);
            if (before?.status === "PENDING" && r.status === "CONSUMED") {
              toast.success("Request approved and executed once", { description: r.toolName });
            }
            if (before?.status === "PENDING" && r.status === "REJECTED") {
              toast.error("Request rejected by an admin", { description: r.toolName });
            }
          }
          return list;
        });
      }
      if (timeline) setEvents(timeline);
    }, 4000);
    return () => clearInterval(t);
  }, [session, hasPending]);

  const send = useCallback(
    async (
      text: string,
      opts?: { attachmentIds?: string[]; attachments?: ChatAttachment[] },
    ) => {
      const message = text.trim();
      const hasAttachments = (opts?.attachmentIds?.length ?? 0) > 0;
      if ((!message && !hasAttachments) || sending || switching || !session) return;
      await runTurn(
        session,
        message || "Please review the attached file.",
        true,
        opts,
      );
    },
    [sending, switching, session, runTurn],
  );

  const reset = useCallback(() => {
    if (!user || switching || sending) return;
    const gen = ++opGenRef.current;
    if (user.role !== "guest") setActiveSessionId(user.userId, null);
    void createBlankSession(gen, null);
  }, [user, switching, sending, createBlankSession]);

  const openHistory = useCallback(
    async (sessionId: string) => {
      if (!user || user.role === "guest") return;
      if (switching || sending) return;
      if (sessionRef.current?.sessionId === sessionId) return;

      const gen = ++opGenRef.current;
      setSwitching(true);
      setSessionError(null);
      setSending(false);
      // Clear immediately so the previous thread doesn't flash under "Loading…".
      setMessages([]);
      setEvents([]);
      setRequests([]);
      setTurnFrom(0);
      try {
        const data = await api.sessionMessages(sessionId);
        if (opGenRef.current !== gen) return;
        applyLoadedSession(data);
        void refreshHistory();
      } catch (err) {
        if (opGenRef.current !== gen) return;
        forgetSessions([sessionId]);
        void refreshHistory();
        setSessionError(err instanceof Error ? err.message : "Could not open chat");
        toast.error("Could not open that chat", {
          description: "It may have been deleted. Removed it from the list.",
        });
      } finally {
        if (opGenRef.current === gen) setSwitching(false);
      }
    },
    [user, switching, sending, applyLoadedSession, refreshHistory],
  );

  const deleteHistory = useCallback(
    async (sessionId: string) => {
      if (!user || user.role === "guest") return;
      if (switching || sending) return;

      const wasCurrent = sessionRef.current?.sessionId === sessionId;
      const gen = ++opGenRef.current;

      // Optimistic sidebar update
      forgetSessions([sessionId]);
      setHistory((prev) => prev.filter((h) => h.sessionId !== sessionId));
      if (user && getActiveSessionId(user.userId) === sessionId) {
        setActiveSessionId(user.userId, null);
      }

      try {
        await api.deleteSession(sessionId);
      } catch (err) {
        if (!(err instanceof ApiError && (err.status === 403 || err.status === 404))) {
          toast.error("Could not delete chat", {
            description: err instanceof Error ? err.message : "Unknown error",
          });
          void refreshHistory();
          return;
        }
      }

      if (wasCurrent) {
        if (opGenRef.current !== gen) {
          // A newer open/reset already took over  don't create another blank chat.
          return;
        }
        await createBlankSession(gen, null);
      } else {
        void refreshHistory();
      }
    },
    [switching, sending, user, refreshHistory, createBlankSession],
  );

  const openLoginGate = useCallback((reason?: string) => {
    setLoginGateReason(
      reason ?? "Sign in with a campus account for chat history and elevated sources.",
    );
    setLoginGateOpen(true);
  }, []);

  const closeLoginGate = useCallback(() => {
    setLoginGateOpen(false);
    setLoginGateReason(null);
    stashRetry(null);
  }, []);

  const afterLoginContinue = useCallback(() => {
    setLoginGateOpen(false);
    setLoginGateReason(null);
    // Keep sessionStorage retry  identity change re-boots and takeRetry() runs.
    bootedForUserRef.current = null;
  }, []);

  const value = useMemo(
    () => ({
      session,
      sessionError,
      messages,
      events,
      turnFrom,
      sending,
      switching,
      send,
      reset,
      requests,
      history,
      refreshHistory,
      openHistory,
      deleteHistory,
      loginGateOpen,
      loginGateReason,
      openLoginGate,
      closeLoginGate,
      afterLoginContinue,
    }),
    [
      session,
      sessionError,
      messages,
      events,
      turnFrom,
      sending,
      switching,
      send,
      reset,
      requests,
      history,
      refreshHistory,
      openHistory,
      deleteHistory,
      loginGateOpen,
      loginGateReason,
      openLoginGate,
      closeLoginGate,
      afterLoginContinue,
    ],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
