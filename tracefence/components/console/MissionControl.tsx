"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { CitationDTO } from "@/components/api/types";
import { useAppState, type ChatMessage } from "@/components/shell/AppState";
import { ClassBadge } from "@/components/ui/ClassBadge";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StatusDot } from "@/components/ui/StatusDot";
import { ROLE_LABEL, docTitle } from "./catalog";
import { DEMO_PROMPTS } from "./RoleSelector";

const PATHS: Array<{ id: keyof typeof DEMO_PROMPTS; label: string; hint: string; icon: IconName; tone: "allow" | "deny" | "inject" }> = [
  { id: "curfew", label: "Benign question", hint: "Public handbook · expect ALLOW", icon: "book", tone: "allow" },
  { id: "export", label: "Directory export", hint: "Role-aware · DENY or APPROVAL", icon: "export", tone: "deny" },
  { id: "injection", label: "Prompt injection", hint: "Exfiltrate to external email", icon: "alert", tone: "inject" },
];

const PATH_TONE = {
  allow: "hover:border-allow/45 hover:text-allow",
  deny: "hover:border-deny/45 hover:text-deny",
  inject: "hover:border-inject/50 hover:text-inject",
};

export function MissionControl() {
  const {
    messages,
    sending,
    send,
    role,
    session,
    mode,
    clear,
    authUser,
    openLogin,
    signOut,
  } = useAppState();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending]);

  const submit = () => {
    if (!input.trim() || sending) return;
    send(input);
    setInput("");
  };

  return (
    <section className="glass flex min-h-[560px] flex-col overflow-hidden rounded-2xl xl:min-h-0">
      <PanelHeader
        eyebrow="01 · Mission control"
        right={
          <span className="flex items-center gap-1.5 rounded-md border border-allow/30 bg-allow-soft px-2 py-1 font-mono text-[10px] font-semibold text-allow">
            <StatusDot tone={mode === "live" ? "green" : "amber"} />
            {mode === "live" ? "GATEWAY ACTIVE" : "REPLAY"}
          </span>
        }
        title="Campus agent"
      />

      <div className="space-y-3 border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] tracking-[.12em] text-faint uppercase">Identity</span>
          <AnimatePresence mode="wait">
            <motion.code
              animate={{ opacity: 1, x: 0 }}
              className="truncate font-mono text-[10px] text-faint"
              exit={{ opacity: 0, x: 6 }}
              initial={{ opacity: 0, x: -6 }}
              key={session?.sessionId ?? "pending"}
            >
              {session ? `${session.sessionId} · policy v${session.policyVersion ?? "–"}` : "opening session…"}
            </motion.code>
          </AnimatePresence>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-line bg-black/25 px-2.5 py-1.5 text-xs font-semibold text-ink">
            {ROLE_LABEL[role]}
            {authUser && role !== "guest" ? (
              <span className="ml-2 font-mono text-[10px] font-normal text-faint">{authUser.email}</span>
            ) : (
              <span className="ml-2 font-mono text-[10px] font-normal text-faint">public · no login</span>
            )}
          </span>
          {role === "guest" ? (
            <button
              className="rounded-md border border-neon/35 bg-neon-soft px-2.5 py-1.5 text-xs font-semibold text-neon"
              onClick={() =>
                openLogin("Sign in for faculty/admin sources, exports, and approvals.")
              }
              type="button"
            >
              Sign in
            </button>
          ) : (
            <button
              className="rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-ink"
              onClick={() => void signOut()}
              type="button"
            >
              Sign out
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[.12em] text-faint uppercase">Demo paths</span>
          <button
            className="font-mono text-[10px] tracking-wider text-faint uppercase hover:text-ink disabled:opacity-40"
            disabled={sending || messages.length === 0}
            onClick={clear}
            type="button"
          >
            New session
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {PATHS.map((p) => (
            <motion.button
              className={`flex flex-col items-start gap-1 rounded-lg border border-line bg-black/20 p-2 text-left text-muted transition-colors disabled:opacity-40 ${PATH_TONE[p.tone]}`}
              disabled={sending}
              key={p.id}
              onClick={() => send(DEMO_PROMPTS[p.id])}
              title={DEMO_PROMPTS[p.id]}
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <Icon name={p.icon} size={14} />
              <span className="text-[11px] leading-tight font-semibold text-ink">{p.label}</span>
              <span className="hidden text-[10px] leading-tight text-faint 2xl:block">{p.hint}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-2" ref={scrollRef}>
        {messages.length === 0 && !sending ? (
          <EmptyState />
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <Message key={m.id} message={m} onRetry={send} />
            ))}
            {sending && <TypingIndicator key="typing" />}
          </AnimatePresence>
        )}
      </div>

      <div className="border-t border-line bg-black/20 px-3 pt-2.5 pb-2">
        <div className="flex items-end gap-2 rounded-xl border border-line-strong bg-black/30 p-2 transition-shadow focus-within:border-neon/50 focus-within:shadow-[0_0_0_3px_rgba(76,194,255,.12)]">
          <textarea
            aria-label="Message"
            className="min-h-[40px] flex-1 resize-none border-0 bg-transparent px-1.5 py-1 text-sm leading-relaxed text-ink outline-none placeholder:text-faint"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={`Instruct the agent as ${ROLE_LABEL[role].toLowerCase()}…`}
            rows={2}
            value={input}
          />
          <motion.button
            aria-label="Send message"
            className="grid size-9 place-items-center rounded-lg bg-neon text-[#04101f] shadow-[0_0_18px_rgba(76,194,255,.45)] hover:bg-neon-strong disabled:opacity-30 disabled:shadow-none"
            disabled={!input.trim() || sending}
            onClick={submit}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92, rotate: -8 }}
          >
            <Icon name="send" size={17} />
          </motion.button>
        </div>
        <p className="mx-1 mt-1.5 flex items-center justify-center gap-1.5 text-[10.5px] text-faint">
          <Icon name="shield" size={11} />
          Input is untrusted. Every tool call is authorized server-side.
        </p>
      </div>
    </section>
  );
}

export function PanelHeader({ eyebrow, title, right }: { eyebrow: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex min-h-[60px] items-center justify-between gap-3 border-b border-line px-4 py-3">
      <div className="min-w-0">
        <span className="eyebrow block">{eyebrow}</span>
        <h2 className="mt-0.5 truncate font-display text-[1.05rem] font-semibold tracking-tight text-ink">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function Message({ message, onRetry }: { message: ChatMessage; onRetry: (text: string) => void }) {
  const assistant = message.from === "assistant";
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`my-2.5 flex ${assistant ? "justify-start" : "justify-end"}`}
      initial={{ opacity: 0, y: 10 }}
      layout="position"
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
    >
      <div
        className={`max-w-[92%] rounded-xl border px-3 py-2.5 ${
          assistant
            ? message.blocked
              ? "border-deny/35 bg-deny-soft"
              : message.awaitingApproval
                ? "border-approval/35 bg-approval-soft"
                : "border-line bg-surface-soft/80"
            : "border-neon/25 bg-neon-soft"
        }`}
      >
        <div className="mb-1 flex items-center gap-2">
          <motion.span
            animate={message.blocked ? { x: [0, -3, 3, -2, 2, 0] } : undefined}
            className={`grid size-5 place-items-center rounded-md ${message.blocked ? "text-deny" : assistant ? "text-neon" : "text-muted"}`}
            transition={{ duration: 0.45, delay: 0.15 }}
          >
            <Icon name={assistant ? (message.blocked ? "lock" : "shield") : "user"} size={13} />
          </motion.span>
          <strong className="font-mono text-[10px] tracking-wider text-muted uppercase">
            {assistant ? "Agent via TraceFence" : "Operator"}
          </strong>
          {message.blocked && (
            <span className="ml-auto rounded border border-deny/40 px-1.5 py-[1px] font-mono text-[9px] font-bold text-deny">GATEWAY ENFORCED</span>
          )}
          {message.awaitingApproval && (
            <span className="ml-auto rounded border border-approval/40 px-1.5 py-[1px] font-mono text-[9px] font-bold text-approval">HELD</span>
          )}
        </div>
        <p className="m-0 text-[13px] leading-relaxed whitespace-pre-line text-ink/90">
          <InlineMarkdown text={message.text} />
        </p>
        {message.citations && message.citations.length > 0 && <CitationList citations={message.citations} />}
        {message.retryable && (
          <motion.button
            className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-lg border border-neon/40 px-3 text-xs font-semibold text-neon hover:bg-neon-soft"
            onClick={() => onRetry(message.retryable!)}
            type="button"
            whileTap={{ scale: 0.96 }}
          >
            <Icon name="refresh" size={13} />
            Retry with approval
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/** Model and fixture text uses **bold**; render it as text nodes only (never as HTML). */
function InlineMarkdown({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong className="font-semibold text-ink" key={i}>
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

export function CitationList({ citations }: { citations: CitationDTO[] }) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {citations.map((c, i) => (
        <motion.span
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 rounded-md border border-line bg-black/25 py-1 pr-1.5 pl-2 text-[11px] text-muted"
          initial={{ opacity: 0, y: 6 }}
          key={c.docId}
          transition={{ delay: 0.1 + i * 0.06 }}
        >
          <Icon className="text-neon" name="file" size={11} />
          {docTitle(c.docId)}
          <ClassBadge value={c.classification} />
        </motion.span>
      ))}
    </div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="my-2.5 flex items-center gap-2 font-mono text-[11px] text-faint"
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      initial={{ opacity: 0, y: 8 }}
    >
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            className="size-1.5 rounded-full bg-neon"
            key={i}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </span>
      Gateway authorizing sources and tool calls…
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full min-h-[200px] flex-col items-center justify-center p-4 text-center"
      initial={{ opacity: 0, y: 12 }}
    >
      <motion.span
        animate={{ boxShadow: ["0 0 0 0 rgba(76,194,255,.0)", "0 0 0 10px rgba(76,194,255,.08)", "0 0 0 0 rgba(76,194,255,.0)"] }}
        className="grid size-12 place-items-center rounded-2xl border border-neon/35 bg-neon-soft text-neon"
        transition={{ duration: 2.6, repeat: Infinity }}
      >
        <Icon name="terminal" size={22} />
      </motion.span>
      <h3 className="mt-3 mb-1 font-display text-base font-semibold text-ink">Awaiting instruction</h3>
      <p className="m-0 max-w-[300px] text-xs leading-relaxed text-muted">
        Run a demo path above or type a request. Watch the source and every decision stream into the trace.
      </p>
    </motion.div>
  );
}
