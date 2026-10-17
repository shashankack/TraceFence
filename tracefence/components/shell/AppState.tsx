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
import { ApiError, api, getAuth, type AuthUser } from "@/components/api/client";
import type { ApprovalDTO, CitationDTO, EventDTO, Role, SessionDTO } from "@/components/api/types";
import { replayApprovalOutcome, replaySessionId, replayTurn } from "@/components/console/replay";
import { LoginModal } from "./LoginModal";

export type Mode = "live" | "replay";

export interface ChatMessage {
  id: string;
  from: "user" | "assistant";
  text: string;
  citations?: CitationDTO[];
  blocked?: boolean;
  awaitingApproval?: boolean;
  retryable?: string;
  authRequired?: boolean;
}

export interface ArchivedSession {
  session: SessionDTO;
  events: EventDTO[];
}

export interface Toast {
  id: number;
  tone: "allow" | "deny" | "info";
  title: string;
  body: string;
}

interface AppState {
  role: Role;
  setRole: (role: Role) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  fallbackReason: string | null;
  session: SessionDTO | null;
  authUser: AuthUser | null;
  messages: ChatMessage[];
  events: EventDTO[];
  turnFrom: number;
  archive: ArchivedSession[];
  sending: boolean;
  send: (text: string) => Promise<void>;
  clear: () => void;
  approval: ApprovalDTO | null;
  drawerOpen: boolean;
  openApprovals: () => void;
  closeApprovals: () => void;
  decide: (decision: "APPROVE" | "REJECT") => Promise<void>;
  deciding: boolean;
  pendingCount: number;
  toast: Toast | null;
  showToast: (t: Omit<Toast, "id">) => void;
  dismissToast: () => void;
  loginOpen: boolean;
  openLogin: (reason?: string) => void;
  closeLogin: () => void;
  loginReason: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside <AppStateProvider>");
  return ctx;
}

let msgSeq = 0;
const msgId = () => `m_${++msgSeq}`;

function isGatewayDown(err: unknown) {
  return err instanceof ApiError && (err.status === 0 || err.status >= 500);
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("guest");
  const [mode, setModeState] = useState<Mode>("live");
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [session, setSession] = useState<SessionDTO | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [turnFrom, setTurnFrom] = useState(0);
  const eventsRef = useRef<EventDTO[]>([]);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);
  const [sending, setSending] = useState(false);
  const [approval, setApproval] = useState<ApprovalDTO | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [livePending, setLivePending] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [archive, setArchive] = useState<ArchivedSession[]>([]);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginReason, setLoginReason] = useState<string | null>(null);
  const [pendingRetry, setPendingRetry] = useState<string | null>(null);
  const sessionRef = useRef<Promise<SessionDTO> | null>(null);

  const showToast = useCallback((t: Omit<Toast, "id">) => setToast({ ...t, id: Date.now() }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  const resetConversation = useCallback(() => {
    setMessages([]);
    setEvents([]);
    setTurnFrom(0);
    setApproval(null);
    setDrawerOpen(false);
  }, []);

  const startReplaySession = useCallback((nextRole: Role) => {
    const s: SessionDTO = {
      sessionId: replaySessionId(nextRole),
      tenantId: "nulltrace-institute",
      userId: nextRole === "guest" ? "usr_guest_public" : "demo-user-1",
      role: nextRole,
      policyVersion: 1,
    };
    sessionRef.current = Promise.resolve(s);
    setSession(s);
    return sessionRef.current;
  }, []);

  const fallBack = useCallback(
    (reason: string, forRole: Role) => {
      setModeState("replay");
      setFallbackReason(reason);
      startReplaySession(forRole);
    },
    [startReplaySession],
  );

  const startGuestLive = useCallback(() => {
    const p = api.startGuest();
    sessionRef.current = p;
    p.then(
      (s) => {
        if (sessionRef.current !== p) return;
        setSession(s);
        setRoleState(s.role);
        setAuthUser(getAuth());
      },
      (err) => {
        if (sessionRef.current !== p) return;
        sessionRef.current = null;
        if (isGatewayDown(err)) {
          fallBack("Gateway unreachable — showing a deterministic scripted replay.", "guest");
        }
      },
    );
    return p;
  }, [fallBack]);

  const startSession = useCallback(
    (nextRole: Role, nextMode: Mode) => {
      if (nextMode === "replay") return startReplaySession(nextRole);
      if (nextRole === "guest") return startGuestLive();
      const p = api.createSession(nextRole);
      sessionRef.current = p;
      p.then(
        (s) => {
          if (sessionRef.current !== p) return;
          setSession(s);
          setRoleState(s.role);
          setAuthUser(getAuth());
        },
        (err) => {
          if (sessionRef.current !== p) return;
          sessionRef.current = null;
          if (isGatewayDown(err)) {
            fallBack("Gateway unreachable — showing a deterministic scripted replay.", nextRole);
          }
        },
      );
      return p;
    },
    [fallBack, startReplaySession, startGuestLive],
  );

  useEffect(() => {
    if (!sessionRef.current) startGuestLive();
  }, [startGuestLive]);

  const archiveCurrent = useCallback(() => {
    if (session && events.length) setArchive((prev) => [{ session, events }, ...prev].slice(0, 20));
  }, [session, events]);

  const switchContext = useCallback(
    (nextRole: Role, nextMode: Mode) => {
      archiveCurrent();
      setSession(null);
      resetConversation();
      startSession(nextRole, nextMode);
    },
    [archiveCurrent, resetConversation, startSession],
  );

  const setRole = useCallback(
    (r: Role) => {
      if (r === role) return;
      setRoleState(r);
      switchContext(r, mode);
    },
    [role, mode, switchContext],
  );

  const setMode = useCallback(
    (m: Mode) => {
      setFallbackReason(null);
      if (m === mode) return;
      setModeState(m);
      switchContext(role, m);
    },
    [role, mode, switchContext],
  );

  const openLogin = useCallback((reason?: string) => {
    setLoginReason(reason ?? null);
    setLoginOpen(true);
  }, []);
  const closeLogin = useCallback(() => {
    setLoginOpen(false);
    setLoginReason(null);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      archiveCurrent();
      resetConversation();
      const s = await api.login(email, password);
      sessionRef.current = Promise.resolve(s);
      setSession(s);
      setRoleState(s.role);
      setAuthUser(getAuth());
      showToast({
        tone: "allow",
        title: "Signed in",
        body: `${getAuth()?.displayName ?? email} · ${s.role}`,
      });
      const retry = pendingRetry;
      setPendingRetry(null);
      if (retry) {
        // Retry the gated message under the new identity.
        setMessages((prev) => [...prev, { id: msgId(), from: "user", text: retry }]);
        setSending(true);
        try {
          const res = await api.sendMessage(s.sessionId, retry);
          const timeline = await api.sessionEvents(s.sessionId).catch(() => null);
          setEvents((prev) => timeline ?? [...prev, ...res.events]);
          setMessages((prev) => [
            ...prev,
            {
              id: msgId(),
              from: "assistant",
              text: res.assistantMessage,
              citations: res.citations,
              blocked: res.events.some((e) => e.decision === "DENY"),
              awaitingApproval: !!res.pendingApprovalId,
            },
          ]);
        } finally {
          setSending(false);
        }
      }
    },
    [archiveCurrent, resetConversation, showToast, pendingRetry],
  );

  const signOut = useCallback(async () => {
    archiveCurrent();
    await api.logout();
    setAuthUser(null);
    resetConversation();
    setRoleState("guest");
    startGuestLive();
    showToast({ tone: "info", title: "Signed out", body: "Back to public guest mode." });
  }, [archiveCurrent, resetConversation, startGuestLive, showToast]);

  useEffect(() => {
    if (mode !== "live" || role === "guest") return;
    let alive = true;
    const tick = () =>
      api
        .approvals()
        .then((list) => alive && setLivePending(list.filter((a) => a.status === "PENDING").length))
        .catch(() => {});
    tick();
    const t = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [mode, approval, role]);

  const appendAssistant = useCallback((msg: Omit<ChatMessage, "id" | "from">) => {
    setMessages((prev) => [...prev, { id: msgId(), from: "assistant", ...msg }]);
  }, []);

  const runReplay = useCallback(
    (text: string, r: Role) => {
      const sid = replaySessionId(r);
      const { response, approval: pending } = replayTurn(r === "guest" ? "student" : r, sid, text);
      setEvents((prev) => [...prev, ...response.events]);
      appendAssistant({
        text: response.assistantMessage,
        citations: response.citations,
        blocked: response.events.some((e) => e.decision === "DENY"),
        awaitingApproval: !!pending,
      });
      if (pending) {
        setApproval(pending);
        setDrawerOpen(true);
      }
    },
    [appendAssistant],
  );

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || sending) return;
      setMessages((prev) => [...prev, { id: msgId(), from: "user", text: message }]);
      setTurnFrom(eventsRef.current.length);
      setSending(true);
      try {
        if (mode === "replay") {
          await new Promise((r) => setTimeout(r, 650));
          runReplay(message, role);
          return;
        }
        const s = await (sessionRef.current ?? startGuestLive());
        const res = await api.sendMessage(s.sessionId, message);
        const timeline = await api.sessionEvents(s.sessionId).catch(() => null);
        setEvents((prev) => timeline ?? [...prev, ...res.events]);
        appendAssistant({
          text: res.assistantMessage,
          citations: res.citations,
          blocked: res.events.some((e) => e.decision === "DENY"),
          awaitingApproval: !!res.pendingApprovalId,
          authRequired: !!res.authRequired,
        });
        if (res.authRequired) {
          setPendingRetry(message);
          openLogin(
            "That question needs a campus login. Public handbook topics work without signing in.",
          );
        }
        if (res.pendingApprovalId) {
          const list = await api.approvals(s.sessionId).catch(() => []);
          const found = list.find((a) => a.id === res.pendingApprovalId);
          if (found) {
            setApproval(found);
            setDrawerOpen(true);
          }
        }
      } catch (err) {
        if (isGatewayDown(err)) {
          fallBack("Gateway unreachable — replaying this turn from the deterministic script.", role);
          runReplay(message, role);
        } else {
          appendAssistant({
            text: `The gateway rejected the request: ${err instanceof Error ? err.message : "unknown error"}.`,
            blocked: true,
          });
        }
      } finally {
        setSending(false);
      }
    },
    [sending, mode, role, runReplay, startGuestLive, appendAssistant, fallBack, openLogin],
  );

  const clear = useCallback(() => {
    archiveCurrent();
    resetConversation();
    if (role === "guest") startGuestLive();
    else startSession(role, mode);
  }, [archiveCurrent, resetConversation, startGuestLive, startSession, role, mode]);

  const decide = useCallback(
    async (decision: "APPROVE" | "REJECT") => {
      if (!approval) return;
      setDeciding(true);
      try {
        let nextStatus: ApprovalDTO["status"] =
          decision === "APPROVE" ? "CONSUMED" : "REJECTED";
        if (mode === "replay") {
          await new Promise((r) => setTimeout(r, 400));
          nextStatus = decision === "APPROVE" ? "APPROVED" : "REJECTED";
          setEvents((prev) => [...prev, replayApprovalOutcome(approval, decision)]);
          appendAssistant({
            text:
              decision === "APPROVE"
                ? "The approved export ran exactly once with the reviewed arguments. The single-use grant is now consumed."
                : "The export was rejected. No file was created and no records were returned.",
            blocked: decision === "REJECT",
          });
        } else {
          const decided = await api.decideApproval(approval.id, decision);
          nextStatus =
            (decided.status as ApprovalDTO["status"]) ||
            (decision === "APPROVE" ? "CONSUMED" : "REJECTED");
          const timeline = await api.sessionEvents(approval.sessionId).catch(() => null);
          if (timeline) setEvents(timeline);
          appendAssistant(
            decision === "APPROVE"
              ? {
                  text: "The approved export ran exactly once with the reviewed arguments. The single-use grant is now consumed.",
                }
              : {
                  text: "The export was rejected. No file was created and no records were returned.",
                  blocked: true,
                },
          );
        }
        setApproval({ ...approval, status: nextStatus });
        setDrawerOpen(false);
        showToast(
          decision === "APPROVE"
            ? { tone: "allow", title: "Approved once", body: "Single-use grant bound to the exact arguments." }
            : { tone: "deny", title: "Action rejected", body: "No records returned. No file created." },
        );
      } catch (err) {
        showToast({
          tone: "deny",
          title: "Approval failed",
          body:
            err instanceof ApiError && err.reasonCode
              ? `${err.reasonCode} — ${err.message}`
              : err instanceof Error
                ? err.message
                : "Unknown error",
        });
      } finally {
        setDeciding(false);
      }
    },
    [approval, mode, appendAssistant, showToast],
  );

  const openApprovals = useCallback(() => {
    if (approval?.status === "PENDING") setDrawerOpen(true);
    else showToast({ tone: "info", title: "No pending approvals", body: "Nothing is waiting on a human checkpoint in this session." });
  }, [approval, showToast]);
  const closeApprovals = useCallback(() => setDrawerOpen(false), []);

  const pendingCount = mode === "live" ? livePending : approval?.status === "PENDING" ? 1 : 0;

  const value = useMemo<AppState>(
    () => ({
      role,
      setRole,
      mode,
      setMode,
      fallbackReason,
      session,
      authUser,
      messages,
      events,
      turnFrom,
      archive,
      sending,
      send,
      clear,
      approval,
      drawerOpen,
      openApprovals,
      closeApprovals,
      decide,
      deciding,
      pendingCount,
      toast,
      showToast,
      dismissToast,
      loginOpen,
      openLogin,
      closeLogin,
      loginReason,
      signIn,
      signOut,
    }),
    [
      role,
      setRole,
      mode,
      setMode,
      fallbackReason,
      session,
      authUser,
      messages,
      events,
      turnFrom,
      archive,
      sending,
      send,
      clear,
      approval,
      drawerOpen,
      openApprovals,
      closeApprovals,
      decide,
      deciding,
      pendingCount,
      toast,
      showToast,
      dismissToast,
      loginOpen,
      openLogin,
      closeLogin,
      loginReason,
      signIn,
      signOut,
    ],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <LoginModal
        open={loginOpen}
        reason={loginReason}
        onClose={closeLogin}
        onSubmit={signIn}
      />
    </Ctx.Provider>
  );
}
