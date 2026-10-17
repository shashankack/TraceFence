"use client";

import { ArrowUp, Bot, Loader2, MessagesSquare, RotateCcw, ShieldX, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Role } from "@/components/api/types";
import { docTitle } from "@/components/domain/catalog";
import { cn } from "@/components/lib/utils";
import { BentoTile } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { ClassLabel } from "@/components/ui/decision-badge";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SCENARIOS } from "./format";
import { useWorkspace, type ChatMessage } from "./WorkspaceProvider";

const EXPECT_TONE: Record<string, string> = {
  ALLOW: "text-allow",
  DENY: "text-deny",
  APPROVAL: "text-approval",
  FENCED: "text-violet",
};

export function AssistantTile({ role, className }: { role: Exclude<Role, "admin">; className?: string }) {
  const { messages, sending, send, reset, session, sessionError } = useWorkspace();
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
    <BentoTile
      action={
        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-label="Start a new session" disabled={sending} onClick={reset} size="icon" variant="ghost">
              <RotateCcw className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New session</TooltipContent>
        </Tooltip>
      }
      bodyClassName="min-h-0"
      className={className}
      icon={MessagesSquare}
      kicker={session ? `session ${session.sessionId}` : sessionError ? "session failed" : "opening session…"}
      title="Campus assistant"
    >
      <div className="flex flex-wrap gap-2 border-b px-5 py-3">
        {SCENARIOS[role].map((s) => (
          <button
            className="group flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-accent/60 disabled:opacity-50"
            disabled={sending || !session}
            key={s.id}
            onClick={() => send(s.prompt)}
            title={s.prompt}
            type="button"
          >
            <span className="font-medium">{s.label}</span>
            <span className={cn("font-mono text-[10px]", EXPECT_TONE[s.expect])}>{s.expect}</span>
          </button>
        ))}
      </div>

      <div className="scroll-thin min-h-[260px] flex-1 basis-0 overflow-y-auto px-5 py-4" ref={scrollRef}>
        {sessionError ? (
          <p className="m-0 text-sm text-deny">Could not open a gateway session: {sessionError}</p>
        ) : messages.length === 0 && !sending ? (
          <div className="flex h-full flex-col items-start justify-center gap-2">
            <p className="m-0 text-sm font-medium">Ask anything about campus.</p>
            <p className="m-0 max-w-[340px] text-sm text-muted-foreground">
              Try a scenario above. What the assistant reads and every action it proposes appear in the source and trace panels.
            </p>
          </div>
        ) : (
          <ol className="m-0 flex list-none flex-col gap-4 p-0">
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
            {sending && (
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                Gateway is authorizing sources and tools…
              </li>
            )}
          </ol>
        )}
      </div>

      <div className="border-t bg-muted/40 p-3">
        <div className="relative">
          <Textarea
            aria-label="Message"
            className="min-h-[64px] resize-none bg-white pr-12 text-sm"
            disabled={!session}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask the campus assistant…"
            value={input}
          />
          <Button
            aria-label="Send"
            className="absolute right-2 bottom-2 size-8 brand-gradient text-white hover:opacity-95"
            disabled={!input.trim() || sending || !session}
            onClick={submit}
            size="icon"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
        <p className="mt-2 mb-0 text-[11px] text-muted-foreground">Your input is treated as untrusted data. Enter to send · Shift+Enter for a new line.</p>
      </div>
    </BentoTile>
  );
}

function Message({ message }: { message: ChatMessage }) {
  const assistant = message.from === "assistant";
  return (
    <li className={cn("flex gap-3", !assistant && "flex-row-reverse")}>
      <span
        className={cn(
          "grid size-7 flex-none place-items-center rounded-full",
          assistant ? (message.blocked ? "bg-deny-soft text-deny" : "bg-accent text-primary") : "bg-violet-soft text-violet",
        )}
      >
        {assistant ? message.blocked ? <ShieldX className="size-3.5" /> : <Bot className="size-3.5" /> : <User className="size-3.5" />}
      </span>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          assistant
            ? message.blocked
              ? "rounded-tl-sm border border-deny/20 bg-deny-soft/60"
              : message.awaitingApproval
                ? "rounded-tl-sm border border-approval/25 bg-approval-soft/70"
                : "rounded-tl-sm border bg-white"
            : "rounded-tr-sm bg-primary text-primary-foreground",
        )}
      >
        <p className="m-0 whitespace-pre-line">
          <InlineMarkdown text={message.text} />
        </p>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border/70 pt-2">
            {message.citations.map((c) => (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px]" key={c.docId}>
                {docTitle(c.docId)}
                <ClassLabel value={String(c.classification)} />
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

/** Model and fixture text uses **bold**; render it as text nodes only (never as HTML). */
function InlineMarkdown({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong className="font-semibold" key={i}>
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}
