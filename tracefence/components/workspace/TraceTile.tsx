"use client";

import { Activity, MailX, ShieldX } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Decision, EventDTO } from "@/components/api/types";
import { externalRecipients } from "@/components/domain/injection";
import { cn } from "@/components/lib/utils";
import { BentoTile } from "@/components/ui/bento";
import { DecisionBadge, FencedBadge, LiveDot } from "@/components/ui/decision-badge";
import { argsLine, formatTime } from "./format";
import { useWorkspace } from "./WorkspaceProvider";

const EXFIL = new Set(["export_records", "notify_external", "post_announcement"]);

export function TraceTile({ className, roleLabel }: { className?: string; roleLabel: string }) {
  const { events, messages, turnFrom, sending } = useWorkspace();
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastUser = [...messages].reverse().find((m) => m.from === "user");
  const targets = lastUser ? externalRecipients(lastUser.text) : [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [events.length]);

  return (
    <BentoTile
      action={
        <span className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <LiveDot pulse={sending} tone={sending ? "primary" : "allow"} />
          {events.length} events
        </span>
      }
      bodyClassName="min-h-0"
      className={className}
      icon={Activity}
      kicker="source → proposal → decision → outcome"
      title="Live trace"
    >
      <div className="scroll-thin max-h-[560px] min-h-[160px] flex-1 overflow-y-auto px-5 py-3" ref={scrollRef}>
        {events.length === 0 ? (
          <p className="m-0 text-sm text-muted-foreground">No decisions yet. Each source filter and tool proposal lands here in order.</p>
        ) : (
          <ol className="relative m-0 list-none p-0">
            <span className="absolute top-2 bottom-2 left-[13px] w-px bg-border" />
            {events.map((e, i) => (
              <TraceEvent event={e} key={e.id} n={i + 1} roleLabel={roleLabel} targets={i >= turnFrom && EXFIL.has(e.tool ?? "") ? targets : []} />
            ))}
          </ol>
        )}
      </div>
    </BentoTile>
  );
}

function TraceEvent({ event, n, targets, roleLabel }: { event: EventDTO; n: number; targets: string[]; roleLabel: string }) {
  const filtered = event.reasonCode === "RETRIEVAL_FILTERED";
  const decision = (event.decision ?? "ALLOW") as Decision;
  const blocked = decision === "DENY" && !filtered && EXFIL.has(event.tool ?? "");
  const recipients = typeof event.argsPreview?.to === "string" ? [event.argsPreview.to as string] : targets;
  const dot = filtered ? "border-violet" : decision === "DENY" ? "border-deny bg-deny" : decision === "REQUIRE_APPROVAL" ? "border-approval" : "border-allow";

  return (
    <li className="relative grid grid-cols-[28px_1fr] gap-2 pb-4">
      <span className="relative z-[1] mt-1 grid size-7 place-items-center rounded-full border bg-white font-mono text-[10px] text-muted-foreground">
        {String(n).padStart(2, "0")}
        <span className={cn("absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 bg-white", dot)} />
      </span>

      <div className="min-w-0">
        <div className="flex items-center gap-2 font-mono text-[10.5px] text-muted-foreground">
          <span>{formatTime(event.ts)}</span>
          <span>·</span>
          <span>{event.phase ?? "DECISION"}</span>
        </div>

        {blocked ? (
          <div className="mt-1.5 overflow-hidden rounded-lg border border-deny/30 bg-deny-soft">
            <div className="flex items-center gap-2 border-b border-deny/15 px-3 py-2">
              {recipients.length ? <MailX className="size-4 text-deny" /> : <ShieldX className="size-4 text-deny" />}
              <strong className="text-sm font-semibold text-deny">{recipients.length ? "External email blocked" : "Export blocked"}</strong>
              <span className="ml-auto">
                <DecisionBadge decision="DENY" />
              </span>
            </div>
            <p className="m-0 px-3 pt-2 text-[13px] leading-relaxed">
              {recipients.length ? (
                <>
                  The model tried to send student records to <code className="font-mono font-medium text-deny">{recipients.join(", ")}</code>,
                  outside the institution. A {roleLabel.toLowerCase()} may not run <code className="font-mono">{event.tool}</code>, so nothing
                  was sent.
                </>
              ) : (
                <>
                  A {roleLabel.toLowerCase()} may not run <code className="font-mono">{event.tool}</code>. The call was stopped before execution.
                </>
              )}
            </p>
            <dl className="m-0 grid grid-cols-[72px_1fr] gap-y-1 px-3 py-2.5 text-xs">
              <dt className="text-muted-foreground">Reason</dt>
              <dd className="m-0 font-mono font-semibold text-deny">{event.reasonCode}</dd>
              <dt className="text-muted-foreground">Arguments</dt>
              <dd className="m-0 font-mono break-words text-muted-foreground">{argsLine(event.argsPreview)}</dd>
              <dt className="text-muted-foreground">Outcome</dt>
              <dd className="m-0 font-medium">Not executed</dd>
            </dl>
          </div>
        ) : (
          <div className="mt-1 rounded-lg border bg-white px-3 py-2">
            <div className="flex items-center gap-2">
              <code className="font-mono text-[13px] font-medium">{filtered ? "acl.filter" : (event.tool ?? "gateway")}</code>
              <span className="ml-auto">{filtered ? <FencedBadge /> : event.decision && <DecisionBadge decision={event.decision} />}</span>
            </div>
            <p className="mt-1 mb-0 font-mono text-[11.5px] break-words text-muted-foreground">{argsLine(event.argsPreview)}</p>
            <div className="mt-1 flex items-baseline gap-2 text-xs">
              <code
                className={cn(
                  "font-mono text-[10.5px]",
                  filtered ? "text-violet" : decision === "REQUIRE_APPROVAL" ? "text-approval" : decision === "DENY" ? "text-deny" : "text-muted-foreground",
                )}
              >
                {event.reasonCode}
              </code>
              {event.outcome && (
                <span className="min-w-0 truncate text-muted-foreground" title={event.outcome}>
                  {event.outcome}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
