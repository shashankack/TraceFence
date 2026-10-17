"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/components/api/client";
import type { ApprovalDTO, CitationDTO, EventDTO, SessionDTO } from "@/components/api/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { rememberSession } from "./registry";

export interface ChatMessage {
  id: string;
  from: "user" | "assistant";
  text: string;
  citations?: CitationDTO[];
  blocked?: boolean;
  awaitingApproval?: boolean;
}

interface WorkspaceState {
  session: SessionDTO | null;
  sessionError: string | null;
  messages: ChatMessage[];
  events: EventDTO[];
  /** Index into `events` where the latest user turn starts. */
  turnFrom: number;
  sending: boolean;
  send: (text: string) => Promise<void>;
  reset: () => void;
  /** Approval requests raised in this session (faculty flow). */
  requests: ApprovalDTO[];
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
  const [requests, setRequests] = useState<ApprovalDTO[]>([]);
  const [epoch, setEpoch] = useState(0);
  const eventsRef = useRef<EventDTO[]>([]);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // One gateway session per sign-in (or per explicit reset). Identity comes from the Bearer token.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    api
      .createSession()
      .then((s) => {
        if (!alive) return;
        setSession(s);
        setSessionError(null);
        rememberSession({ sessionId: s.sessionId, role: s.role, userId: s.userId, createdAt: new Date().toISOString() });
      })
      .catch((err) => alive && setSessionError(err instanceof Error ? err.message : "Could not open a session"));
    return () => {
      alive = false;
    };
  }, [user, epoch]);

  // While a request waits on an admin, poll so the faculty view reflects the decision and its outcome.
  const hasPending = requests.some((r) => r.status === "PENDING");
  useEffect(() => {
    if (!session || !hasPending) return;
    const t = setInterval(async () => {
      const [list, timeline] = await Promise.all([
        api.approvals(session.sessionId).catch(() => null),
        api.sessionEvents(session.sessionId).catch(() => null),
      ]);
      if (list) {
        setRequests((prev) => {
          for (const r of list) {
            const before = prev.find((p) => p.id === r.id);
            if (before?.status === "PENDING" && r.status === "CONSUMED") toast.success("Request approved and executed once", { description: r.toolName });
            if (before?.status === "PENDING" && r.status === "REJECTED") toast.error("Request rejected by an admin", { description: r.toolName });
          }
          return list;
        });
      }
      if (timeline) setEvents(timeline);
    }, 4000);
    return () => clearInterval(t);
  }, [session, hasPending]);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || sending || !session) return;
      setMessages((prev) => [...prev, { id: nextId(), from: "user", text: message }]);
      setTurnFrom(eventsRef.current.length);
      setSending(true);
      try {
        const res = await api.sendMessage(session.sessionId, message);
        const timeline = await api.sessionEvents(session.sessionId).catch(() => null);
        setEvents((prev) => timeline ?? [...prev, ...res.events]);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            from: "assistant",
            text: res.assistantMessage,
            citations: res.citations,
            blocked: res.events.some((e) => e.decision === "DENY"),
            awaitingApproval: !!res.pendingApprovalId,
          },
        ]);
        if (res.pendingApprovalId) {
          const list = await api.approvals(session.sessionId).catch(() => []);
          setRequests(list);
          toast("Sent to an admin for approval", { description: "The gateway paused this action until it is reviewed." });
        }
      } catch (err) {
        const reason = err instanceof ApiError ? (err.status === 0 ? "the gateway is unreachable" : err.message) : "unknown error";
        setMessages((prev) => [...prev, { id: nextId(), from: "assistant", text: `The request did not complete: ${reason}.`, blocked: true }]);
      } finally {
        setSending(false);
      }
    },
    [sending, session],
  );

  const reset = useCallback(() => {
    setSession(null);
    setMessages([]);
    setEvents([]);
    setTurnFrom(0);
    setRequests([]);
    setEpoch((e) => e + 1);
  }, []);

  const value = useMemo(
    () => ({ session, sessionError, messages, events, turnFrom, sending, send, reset, requests }),
    [session, sessionError, messages, events, turnFrom, sending, send, reset, requests],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
