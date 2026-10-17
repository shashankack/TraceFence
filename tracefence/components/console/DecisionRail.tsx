"use client";

import { useEffect, useRef } from "react";
import type { Decision, EventDTO } from "@/components/api/types";
import { useAppState } from "@/components/shell/AppState";
import { DecisionChip } from "@/components/ui/DecisionChip";
import { Icon, toolIcon } from "@/components/ui/Icon";
import { StatusDot } from "@/components/ui/StatusDot";
import { ROLE_LABEL } from "./catalog";
import { Column } from "./Column";
import { externalRecipients } from "./injection";

const PHASES = ["SOURCE", "PROPOSAL", "DECISION", "OUTCOME"] as const;

const NODE: Record<Decision, string> = {
  ALLOW: "border-allow bg-canvas",
  DENY: "border-deny bg-deny",
  REQUIRE_APPROVAL: "border-approval bg-canvas",
};

export function formatTime(ts?: string) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return `${d.toLocaleTimeString("en-GB", { hour12: false })}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

export function argsLine(args?: Record<string, unknown> | null) {
  if (!args) return "—";
  return Object.entries(args)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(", ")}]` : typeof v === "string" ? `"${v}"` : JSON.stringify(v)}`)
    .join("  ");
}

/** Sensitive tools whose DENY is rendered as a full blocked-action record. */
const EXFIL_TOOLS = new Set(["export_records", "notify_external", "post_announcement"]);

export function DecisionRail({ className = "" }: { className?: string }) {
  const { events, mode, messages, turnFrom, sending, session, role } = useAppState();
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastUser = [...messages].reverse().find((m) => m.from === "user");
  const turnTargets = lastUser ? externalRecipients(lastUser.text) : [];
  const reached = new Set<string>(events.map((e) => e.phase ?? "DECISION"));
  if (events.some((e) => e.tool)) reached.add("PROPOSAL");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [events.length]);

  return (
    <Column
      className={className}
      footer={
        <>
          <Icon name="shield" size={12} />
          Decisions are made by policy outside the model.
          <span className="ml-auto font-mono text-[10.5px]">{mode === "live" ? "/api/sessions/:id/events" : "replay"}</span>
        </>
      }
      index="03"
      meta={
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-faint">
          <StatusDot live={mode === "live"} tone={mode === "live" ? "green" : "amber"} />
          {events.length} events
        </span>
      }
      title="Live trace"
    >
      <ol className="m-0 flex h-9 flex-none list-none items-center gap-0 border-b border-line px-4 font-mono text-[10.5px]">
        {PHASES.map((p, i) => (
          <li className="flex flex-1 items-center gap-2" key={p}>
            <span className={reached.has(p) ? "text-ink" : "text-faint"}>{p}</span>
            {i < PHASES.length - 1 && <span className={`mr-2 h-px flex-1 ${reached.has(PHASES[i + 1]) ? "bg-line-strong" : "bg-line-soft"}`} />}
          </li>
        ))}
      </ol>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto py-2" ref={scrollRef}>
        {events.length === 0 ? (
          <p className="m-0 max-w-[340px] px-4 py-2 text-[12.5px] leading-relaxed text-faint">
            Waiting for the first decision. Each source filter and tool proposal is recorded here in order, with its reason code and
            outcome.
          </p>
        ) : (
          <ol className="m-0 list-none p-0">
            {events.map((e, i) => (
              <TraceEvent
                actor={ROLE_LABEL[session?.role ?? role]}
                event={e}
                key={e.id}
                last={i === events.length - 1}
                n={i + 1}
                targets={i >= turnFrom && EXFIL_TOOLS.has(e.tool ?? "") ? turnTargets : []}
              />
            ))}
          </ol>
        )}
        {sending && (
          <div className="flex items-center gap-2 px-4 pt-2 font-mono text-[11px] text-accent">
            <span className="size-[7px] rounded-full bg-accent" style={{ animation: "tf-pulse 1s ease-in-out infinite" }} />
            awaiting decision…
          </div>
        )}
      </div>
    </Column>
  );
}

function TraceEvent({ event, n, last, targets, actor }: { event: EventDTO; n: number; last: boolean; targets: string[]; actor: string }) {
  const filtered = event.reasonCode === "RETRIEVAL_FILTERED";
  const decision = (event.decision ?? "ALLOW") as Decision;
  const blocked = decision === "DENY" && !filtered && EXFIL_TOOLS.has(event.tool ?? "");
  const recipients = typeof event.argsPreview?.to === "string" ? [event.argsPreview.to as string] : targets;
  const nodeTone = filtered ? "border-accent bg-canvas" : NODE[decision];

  return (
    <li className="grid grid-cols-[44px_1fr] pr-4">
      <div className="relative flex justify-center">
        {!last && <span className="absolute top-[18px] bottom-0 w-px bg-line" />}
        {n > 1 && <span className="absolute top-0 h-[10px] w-px bg-line" />}
        <span className={`relative mt-[10px] size-[9px] rounded-full border-2 ${nodeTone}`} />
      </div>

      <div className="min-w-0 pt-[5px] pb-3">
        <div className="flex items-center gap-2 font-mono text-[10.5px] text-faint">
          <span className="text-muted">#{String(n).padStart(2, "0")}</span>
          <span>{formatTime(event.ts)}</span>
          <span>{event.phase ?? "DECISION"}</span>
        </div>

        {blocked ? (
          <div className="mt-1.5 overflow-hidden rounded-[4px] border border-deny/45 border-l-[3px] border-l-deny bg-deny-soft">
            <div className="flex items-center gap-2 px-3 pt-2.5">
              <Icon className="text-deny" name={recipients.length ? "mail" : toolIcon(event.tool)} size={14} />
              <strong className="text-[13px] font-semibold text-deny">
                {recipients.length ? "External email blocked" : "Export blocked"}
              </strong>
              <span className="ml-auto">
                <DecisionChip decision="DENY" />
              </span>
            </div>
            <p className="mx-3 mt-1.5 mb-2 text-[12.5px] leading-relaxed text-ink/85">
              {recipients.length ? (
                <>
                  The model proposed sending student records to{" "}
                  <code className="font-mono text-[12px] text-deny">{recipients.join(", ")}</code>, an address outside the tenant. Policy does
                  not let a {actor.toLowerCase()} run <code className="font-mono text-[12px]">{event.tool}</code>, so nothing was sent.
                </>
              ) : (
                <>
                  Policy does not let a {actor.toLowerCase()} run <code className="font-mono text-[12px]">{event.tool}</code>. The call was
                  stopped before execution.
                </>
              )}
            </p>
            <dl className="m-0 grid grid-cols-[72px_1fr] gap-y-1 border-t border-deny/25 px-3 py-2 text-[11.5px]">
              <dt className="text-faint">Tool</dt>
              <dd className="m-0 font-mono text-ink">{event.tool}</dd>
              <dt className="text-faint">Arguments</dt>
              <dd className="m-0 font-mono break-words text-muted">{argsLine(event.argsPreview)}</dd>
              <dt className="text-faint">Reason</dt>
              <dd className="m-0 font-mono font-semibold text-deny">{event.reasonCode}</dd>
              <dt className="text-faint">Outcome</dt>
              <dd className="m-0 text-ink">Not executed</dd>
            </dl>
          </div>
        ) : (
          <>
            <div className="mt-1 flex items-center gap-2">
              <Icon className="text-faint" name={filtered ? "filter" : toolIcon(event.tool)} size={13} />
              <code className="font-mono text-[12.5px] text-ink">{filtered ? "acl.filter" : (event.tool ?? "gateway")}</code>
              <span className="ml-auto">
                {filtered ? (
                  <span className="inline-flex h-[20px] items-center rounded-[3px] border border-line px-1.5 text-[11px] text-muted">Fenced</span>
                ) : (
                  event.decision && <DecisionChip decision={event.decision} />
                )}
              </span>
            </div>
            <div className="mt-1 font-mono text-[11.5px] break-words text-muted">{argsLine(event.argsPreview)}</div>
            <div className="mt-1 flex items-baseline gap-2 text-[11.5px]">
              <code
                className={`font-mono text-[10.5px] ${filtered ? "text-accent" : decision === "REQUIRE_APPROVAL" ? "text-approval" : decision === "DENY" ? "text-deny" : "text-faint"}`}
              >
                {event.reasonCode}
              </code>
              {event.outcome && (
                <span className="min-w-0 truncate text-faint" title={event.outcome}>
                  {event.outcome}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </li>
  );
}
