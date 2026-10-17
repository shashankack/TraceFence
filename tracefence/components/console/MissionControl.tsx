"use client";

import { useEffect, useRef, useState } from "react";
import type { CitationDTO } from "@/components/api/types";
import { useAppState, type ChatMessage } from "@/components/shell/AppState";
import { ClassBadge } from "@/components/ui/ClassBadge";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ROLE_LABEL, docTitle } from "./catalog";
import { Column } from "./Column";
import { DEMO_PROMPTS, RoleTabs } from "./RoleSelector";

const SCENARIOS: Array<{ id: keyof typeof DEMO_PROMPTS; label: string; expect: string; icon: IconName; tone: string }> = [
  { id: "curfew", label: "Benign question", expect: "ALLOW", icon: "book", tone: "text-allow" },
  { id: "export", label: "Directory export", expect: "DENY · APPROVAL", icon: "export", tone: "text-muted" },
  { id: "injection", label: "Prompt injection", expect: "DENY", icon: "alert", tone: "text-deny" },
];

export function MissionControl() {
  const { messages, sending, send, role, setRole, session, clear } = useAppState();
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
    <Column
      index="01"
      meta={<span className="font-mono text-[11px] text-faint">{session ? `policy v${session.policyVersion ?? "–"}` : "opening…"}</span>}
      title="Mission control"
    >
      <div className="flex-none border-b border-line px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="label">Act as</span>
          <code className="truncate font-mono text-[11px] text-faint">{session?.sessionId ?? "—"}</code>
        </div>
        <RoleTabs layoutGroup="console" onChange={setRole} value={role} />
      </div>

      <div className="flex-none border-b border-line">
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
          <span className="label">Scenarios</span>
          <button className="text-[11.5px] text-faint hover:text-ink disabled:opacity-40" disabled={sending || messages.length === 0} onClick={clear} type="button">
            Reset session
          </button>
        </div>
        <ul className="m-0 list-none p-0 pb-1.5">
          {SCENARIOS.map((s, i) => (
            <li key={s.id}>
              <button
                className="group flex h-8 w-full items-center gap-3 px-4 text-left text-[12.5px] text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-40"
                disabled={sending}
                onClick={() => send(DEMO_PROMPTS[s.id])}
                title={DEMO_PROMPTS[s.id]}
                type="button"
              >
                <span className="w-4 font-mono text-[10.5px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                <Icon className="text-faint group-hover:text-muted" name={s.icon} size={13} />
                <span className="flex-1 truncate">{s.label}</span>
                <span className={`font-mono text-[10.5px] ${s.tone}`}>{s.expect}</span>
                <Icon className="text-faint opacity-0 transition-opacity group-hover:opacity-100" name="chevron" size={12} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="scroll-thin min-h-[180px] flex-1 overflow-y-auto px-4 py-3" ref={scrollRef}>
        {messages.length === 0 && !sending ? (
          <p className="m-0 max-w-[300px] pt-1 text-[12.5px] leading-relaxed text-faint">
            No turns yet. Run a scenario or write an instruction below — the source and every gateway decision appear to the right.
          </p>
        ) : (
          <ol className="m-0 list-none space-y-4 p-0">
            {messages.map((m) => (
              <Message key={m.id} message={m} onRetry={send} />
            ))}
            {sending && (
              <li className="flex items-center gap-2 font-mono text-[11px] text-accent">
                <span className="size-[7px] rounded-full bg-accent" style={{ animation: "tf-pulse 1s ease-in-out infinite" }} />
                gateway evaluating…
              </li>
            )}
          </ol>
        )}
      </div>

      <div className="flex-none border-t border-line p-3">
        <div className="flex items-end gap-2 rounded-[4px] border border-line bg-canvas p-1.5 transition-colors focus-within:border-accent">
          <textarea
            aria-label="Instruction"
            className="min-h-[36px] flex-1 resize-none border-0 bg-transparent px-1.5 py-1 text-[13px] leading-relaxed text-ink outline-none placeholder:text-faint"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={`Instruct the agent as ${ROLE_LABEL[role].toLowerCase()}`}
            rows={2}
            value={input}
          />
          <button aria-label="Send instruction" className="btn btn-primary h-8 px-2.5" disabled={!input.trim() || sending} onClick={submit} type="button">
            <Icon name="send" size={14} />
          </button>
        </div>
        <p className="mt-1.5 mb-0 flex items-center justify-between text-[11px] text-faint">
          <span>Input is untrusted. Tools are authorized server-side.</span>
          <span className="kbd">↵</span>
        </p>
      </div>
    </Column>
  );
}

function Message({ message, onRetry }: { message: ChatMessage; onRetry: (text: string) => void }) {
  const assistant = message.from === "assistant";
  const state = message.blocked ? "deny" : message.awaitingApproval ? "approval" : null;
  return (
    <li className={`relative pl-3 ${state === "deny" ? "border-l-2 border-deny" : state === "approval" ? "border-l-2 border-approval" : "border-l-2 border-line"}`}>
      <div className="mb-1 flex items-center gap-2 text-[11.5px]">
        <span className={assistant ? "text-ink" : "text-muted"}>{assistant ? "Agent" : "Operator"}</span>
        {state === "deny" && <span className="text-deny">· blocked by gateway</span>}
        {state === "approval" && <span className="text-approval">· held for approval</span>}
      </div>
      <p className={`m-0 text-[13px] leading-relaxed whitespace-pre-line ${assistant ? "text-ink" : "text-muted"}`}>
        <InlineMarkdown text={message.text} />
      </p>
      {message.citations && message.citations.length > 0 && <CitationList citations={message.citations} />}
      {message.retryable && (
        <button className="btn mt-2 h-7" onClick={() => onRetry(message.retryable!)} type="button">
          <Icon name="refresh" size={12} />
          Retry with approval
        </button>
      )}
    </li>
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
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-faint">
      <span>Cited</span>
      {citations.map((c) => (
        <span className="flex items-center gap-1.5" key={c.docId}>
          <span className="text-muted">{docTitle(c.docId)}</span>
          <ClassBadge value={c.classification} />
        </span>
      ))}
    </div>
  );
}
