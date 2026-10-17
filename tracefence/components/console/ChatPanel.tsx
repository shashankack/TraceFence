"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { CitationDTO, Classification } from "@/components/api/types";
import { useAppState, type ChatMessage } from "@/components/shell/AppState";
import { StatusDot } from "@/components/shell/AppHeader";
import { Icon } from "@/components/ui/Icon";
import { CLASSIFICATION_TONE, ROLE_LABEL, docTitle } from "./catalog";
import { DEMO_PROMPTS } from "./RoleSelector";

export function ChatPanel() {
  const { messages, sending, send, role, mode } = useAppState();
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
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-white/95 shadow-[0_7px_24px_rgba(26,58,61,.05)]">
      <div className="flex min-h-[64px] items-center justify-between border-b border-line px-4 py-3">
        <div>
          <span className="block text-[10px] font-extrabold uppercase tracking-[.75px] text-teal">Campus assistant</span>
          <h1 className="mt-0.5 font-display text-xl font-bold tracking-tight">NullTrace Institute</h1>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-allow-soft px-2.5 py-1.5 text-[11px] font-bold text-allow">
          <StatusDot />
          {mode === "live" ? "Gateway active" : "Replay gateway"}
        </span>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-5 pt-2 pb-3" ref={scrollRef}>
        {messages.length === 0 && !sending ? (
          <EmptyState onPrompt={send} />
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <Message key={m.id} message={m} onRetry={send} />
            ))}
            {sending && <TypingIndicator key="typing" />}
          </AnimatePresence>
        )}
      </div>

      <div className="border-t border-line bg-[#fbfcfc] px-3.5 pt-2.5 pb-2">
        <div className="flex min-h-[58px] items-end gap-2 rounded-[10px] border border-line-strong bg-white p-2 shadow-[0_2px_7px_rgba(24,52,54,.05)] transition-shadow focus-within:border-[#70aaa2] focus-within:shadow-[0_0_0_3px_var(--color-teal-soft)]">
          <textarea
            aria-label="Message"
            className="min-h-[40px] flex-1 resize-none border-0 bg-transparent px-1.5 py-1 text-sm leading-relaxed text-ink outline-none placeholder:text-[#9ca8aa]"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={`Ask as ${ROLE_LABEL[role].toLowerCase()}…`}
            rows={2}
            value={input}
          />
          <motion.button
            aria-label="Send message"
            className="grid size-9 place-items-center rounded-lg bg-teal text-white hover:bg-teal-strong disabled:opacity-40"
            disabled={!input.trim() || sending}
            onClick={submit}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92, rotate: -8 }}
          >
            <Icon name="send" size={17} />
          </motion.button>
        </div>
        <p className="mx-1 mt-1.5 flex items-center justify-center gap-1.5 text-[11px] text-faint">
          <Icon name="shield" size={11} />
          The model proposes. TraceFence verifies sources and executes tools server-side.
        </p>
      </div>
    </section>
  );
}

function Message({ message, onRetry }: { message: ChatMessage; onRetry: (text: string) => void }) {
  const assistant = message.from === "assistant";
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-[30px_1fr] gap-2.5 border-b border-[#edf1f0] px-0.5 py-4 last:border-b-0"
      initial={{ opacity: 0, y: 10 }}
      layout="position"
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
    >
      <motion.span
        animate={message.blocked ? { x: [0, -3, 3, -2, 2, 0] } : undefined}
        className={`grid size-[30px] place-items-center rounded-lg ${
          message.blocked
            ? "bg-deny-soft text-deny"
            : assistant
              ? "bg-navy text-[#d9fff7]"
              : "bg-[#edf2f1] text-muted"
        }`}
        transition={{ duration: 0.45, delay: 0.15 }}
      >
        <Icon name={assistant ? (message.blocked ? "lock" : "shield") : "user"} size={15} />
      </motion.span>
      <div className="min-w-0">
        <div className="flex min-h-5 items-center gap-2">
          <strong className="font-display text-sm font-bold">{assistant ? "TraceFence assistant" : "You"}</strong>
          {message.blocked && (
            <motion.span
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1 rounded px-1.5 py-[3px] text-[10px] font-bold uppercase tracking-[.3px] text-deny bg-deny-soft"
              initial={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.2 }}
            >
              <Icon name="lock" size={11} />
              Gateway enforced
            </motion.span>
          )}
          {message.awaitingApproval && (
            <span className="inline-flex items-center gap-1 rounded px-1.5 py-[3px] text-[10px] font-bold uppercase tracking-[.3px] text-approval bg-approval-soft">
              <Icon name="clock" size={11} />
              Held for approval
            </span>
          )}
        </div>
        <p className="mt-1 max-w-[700px] text-sm leading-relaxed whitespace-pre-line text-[#3c4b4e]">
          <InlineMarkdown text={message.text} />
        </p>
        {message.blocked && (
          <small className="mt-2 block text-xs font-bold text-deny">Enforced by TraceFence gateway — not by the model.</small>
        )}
        {message.citations && message.citations.length > 0 && <CitationList citations={message.citations} />}
        {message.retryable && (
          <motion.button
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#a8d2cb] bg-white px-3 text-xs font-bold text-teal hover:bg-teal-soft"
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
    <div className="mt-3 flex flex-wrap gap-1.5">
      <span className="flex w-full items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.45px] text-faint">
        <Icon name="file" size={12} />
        Sources cited
      </span>
      {citations.map((c, i) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex min-w-[230px] items-center gap-2 rounded-lg border border-line bg-surface-soft px-2.5 py-2 text-left hover:border-[#a6cbc5]"
          initial={{ opacity: 0, y: 6 }}
          key={c.docId}
          transition={{ delay: 0.15 + i * 0.07 }}
          whileHover={{ y: -2 }}
        >
          <span className="grid size-7 place-items-center rounded-md bg-teal-soft text-teal">
            <Icon name="file" size={13} />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <strong className="text-xs">{docTitle(c.docId)}</strong>
            <code className="font-mono text-[10px] text-faint">{c.docId}</code>
          </span>
          <ClassBadge value={c.classification} />
        </motion.div>
      ))}
    </div>
  );
}

export function ClassBadge({ value }: { value: string }) {
  const tone = CLASSIFICATION_TONE[value as Classification] ?? "text-muted bg-[#eef2f1]";
  return <em className={`rounded-full px-2 py-[3px] text-[10px] font-bold not-italic ${tone}`}>{value}</em>;
}

function TypingIndicator() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-[30px_1fr] gap-2.5 px-0.5 py-4"
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      initial={{ opacity: 0, y: 8 }}
    >
      <span className="grid size-[30px] place-items-center rounded-lg bg-navy text-[#d9fff7]">
        <Icon name="shield" size={15} />
      </span>
      <div className="flex items-center gap-2 text-xs text-faint">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
              className="size-1.5 rounded-full bg-teal"
              key={i}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </span>
        Gateway checking sources and tools…
      </div>
    </motion.div>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (text: string) => void }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full min-h-[320px] flex-col items-center justify-center p-6 text-center"
      initial={{ opacity: 0, y: 12 }}
    >
      <motion.span
        animate={{ y: [0, -4, 0] }}
        className="grid size-14 place-items-center rounded-2xl border border-[#c3e1db] bg-teal-soft text-teal"
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon name="shield" size={28} />
      </motion.span>
      <h2 className="mt-3.5 mb-1 font-display text-xl font-bold">Ask NullTrace Institute</h2>
      <p className="m-0 max-w-[420px] text-sm leading-relaxed text-muted">
        Every source and tool call is checked by the gateway before it reaches the model or executes.
      </p>
      <div className="mt-5 grid w-full max-w-[520px] grid-cols-2 gap-2">
        <StarterPrompt hint="Public handbook · allowed" icon="book" label="What time is hostel curfew?" onClick={() => onPrompt(DEMO_PROMPTS.curfew)} />
        <StarterPrompt hint="Role-aware gateway decision" icon="export" label="Export the student directory" onClick={() => onPrompt(DEMO_PROMPTS.export)} />
      </div>
    </motion.div>
  );
}

function StarterPrompt({ icon, label, hint, onClick }: { icon: "book" | "export"; label: string; hint: string; onClick: () => void }) {
  return (
    <motion.button
      className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-line bg-white p-3 text-left text-teal hover:border-[#a8d2cb]"
      onClick={onClick}
      type="button"
      whileHover={{ y: -2, boxShadow: "0 6px 18px rgba(26,58,61,.08)" }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon name={icon} size={15} />
      <span className="flex flex-col gap-0.5 text-xs font-bold text-ink">
        {label}
        <small className="text-[11px] font-medium text-faint">{hint}</small>
      </span>
      <Icon name="chevron" size={14} />
    </motion.button>
  );
}
