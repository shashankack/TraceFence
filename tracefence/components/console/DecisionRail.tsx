"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Decision, EventDTO } from "@/components/api/types";
import { useAppState } from "@/components/shell/AppState";
import { DecisionChip } from "@/components/ui/DecisionChip";
import { Icon, toolIcon } from "@/components/ui/Icon";
import { StatusDot } from "@/components/ui/StatusDot";
import { externalRecipients } from "./injection";
import { PanelHeader } from "./MissionControl";

const PHASES = ["SOURCE", "PROPOSAL", "DECISION", "OUTCOME"] as const;

const NODE_TONE: Record<Decision, string> = {
  ALLOW: "text-allow bg-allow-soft border-allow/40",
  DENY: "text-deny bg-deny-soft border-deny/45",
  REQUIRE_APPROVAL: "text-approval bg-approval-soft border-approval/45",
};

const REASON_TONE: Record<Decision, string> = {
  ALLOW: "text-allow",
  DENY: "text-deny",
  REQUIRE_APPROVAL: "text-approval",
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
    .join(" · ");
}

/** Sensitive tools whose DENY is shown as a full blocked-action card. */
const EXFIL_TOOLS = new Set(["export_records", "notify_external", "post_announcement"]);

export function DecisionRail() {
  const { events, mode, messages, turnFrom, sending } = useAppState();
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenPhases = new Set(events.map((e) => e.phase));
  const lastUser = [...messages].reverse().find((m) => m.from === "user");
  const turnTargets = lastUser ? externalRecipients(lastUser.text) : [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [events.length]);

  return (
    <aside className="glass flex min-h-[560px] flex-col overflow-hidden rounded-2xl xl:min-h-0">
      <PanelHeader
        eyebrow="03 · Live trace"
        right={
          <span className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 font-mono text-[10px] font-semibold text-muted">
            <StatusDot tone={mode === "live" ? "green" : "amber"} />
            {events.length} EVENTS
          </span>
        }
        title="Source → action timeline"
      />

      <div className="grid grid-cols-4 border-b border-line bg-black/20 px-3 py-2">
        {PHASES.map((p, i) => {
          const on = seenPhases.has(p) || (p === "PROPOSAL" && events.some((e) => e.tool));
          return (
            <div className="flex items-center gap-1" key={p}>
              <motion.span
                animate={{ backgroundColor: on ? "var(--color-neon)" : "rgba(126,162,222,.2)", boxShadow: on ? "0 0 10px var(--color-neon)" : "0 0 0 transparent" }}
                className="size-1.5 rounded-full"
                transition={{ duration: 0.4 }}
              />
              <motion.span
                animate={{ color: on ? "var(--color-ink)" : "var(--color-faint)" }}
                className="font-mono text-[9.5px] font-semibold tracking-[.08em]"
              >
                {p}
              </motion.span>
              {i < PHASES.length - 1 && <span className="mx-1 h-px flex-1 bg-line-strong" />}
            </div>
          );
        })}
      </div>

      <div className="scroll-rail min-h-0 flex-1 overflow-y-auto px-3 pt-2 pb-3" ref={scrollRef}>
        {events.length === 0 ? (
          <motion.div animate={{ opacity: 1 }} className="flex h-full min-h-[260px] flex-col items-center justify-center text-center" initial={{ opacity: 0 }}>
            <motion.span
              animate={{ rotate: [0, 8, -6, 0] }}
              className="grid size-12 place-items-center rounded-2xl border border-line bg-white/[.03] text-neon"
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon name="activity" size={22} />
            </motion.span>
            <strong className="mt-3 font-display text-base font-semibold text-ink">Trace is quiet</strong>
            <p className="max-w-[260px] text-xs leading-relaxed text-muted">Every source decision and tool proposal will stream here with its reason code.</p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((e, i) => (
              <RailEvent
                event={e}
                index={i}
                key={e.id}
                last={i === events.length - 1}
                target={i >= turnFrom && EXFIL_TOOLS.has(e.tool ?? "") ? turnTargets : []}
              />
            ))}
          </AnimatePresence>
        )}
        {sending && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            className="mt-2 flex items-center gap-2 pl-9 font-mono text-[10px] tracking-wider text-neon uppercase"
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <Icon name="activity" size={12} />
            awaiting gateway decision…
          </motion.div>
        )}
      </div>

      <div className="flex min-h-[36px] items-center gap-1.5 border-t border-line bg-black/20 px-4 text-[11px] text-faint">
        <Icon className="text-neon" name="shield" size={12} />
        Policy executes outside the LLM
      </div>
    </aside>
  );
}

function RailEvent({ event, last, index, target }: { event: EventDTO; last: boolean; index: number; target: string[] }) {
  const decision = (event.decision ?? "ALLOW") as Decision;
  const filtered = event.reasonCode === "RETRIEVAL_FILTERED";
  const tone: Decision = filtered ? "DENY" : decision;
  const blocked = decision === "DENY" && !filtered && EXFIL_TOOLS.has(event.tool ?? "");
  const recipient = typeof event.argsPreview?.to === "string" ? [event.argsPreview.to as string] : target;

  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="grid grid-cols-[28px_1fr]"
      initial={{ opacity: 0, x: 16 }}
      layout="position"
      transition={{ type: "spring", stiffness: 340, damping: 30, delay: (index % 4) * 0.05 }}
    >
      <div className="flex flex-col items-center">
        <motion.span
          animate={{ scale: 1 }}
          className={`z-[1] mt-2.5 grid size-6 place-items-center rounded-[7px] border ${NODE_TONE[tone]} ${blocked ? "glow-deny" : ""}`}
          initial={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.08 }}
        >
          <Icon name={filtered ? "filter" : toolIcon(event.tool)} size={13} />
        </motion.span>
        {!last && (
          <motion.span
            animate={{ scaleY: 1 }}
            className="w-px flex-1 origin-top bg-gradient-to-b from-line-strong to-line"
            initial={{ scaleY: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          />
        )}
      </div>

      {blocked ? (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="glow-deny my-1.5 ml-2 overflow-hidden rounded-xl border border-deny/50 bg-[linear-gradient(135deg,rgba(255,84,104,.18),rgba(255,84,104,.05))]"
          initial={{ opacity: 0, scale: 0.96 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between border-b border-deny/25 px-3 py-2">
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[.12em] text-deny uppercase">
              <Icon name="lock" size={12} />
              Blocked {event.tool === "notify_external" ? "external email" : "exfiltration"}
            </span>
            <time className="font-mono text-[10px] text-ink/70">{formatTime(event.ts)}</time>
          </div>
          <div className="space-y-2 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <code className="font-mono text-[13px] font-semibold text-ink">{event.tool}</code>
              <DecisionChip decision="DENY" pulse={last} />
            </div>
            {recipient.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-deny/30 bg-black/30 px-2.5 py-1.5">
                <Icon className="text-deny" name="mail" size={13} />
                <span className="text-[10px] tracking-wider text-faint uppercase">to</span>
                <code className="truncate font-mono text-[12px] font-semibold text-deny line-through decoration-deny/60">{recipient.join(", ")}</code>
              </div>
            )}
            <code className="block rounded-md border border-line bg-black/30 px-2 py-1.5 font-mono text-[11px] break-words text-muted">
              {argsLine(event.argsPreview)}
            </code>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <code className="rounded bg-deny/15 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-deny">{event.reasonCode}</code>
              <span className="text-[11px] text-ink/70">Not executed · {event.outcome ?? "gateway denied"}</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className={`min-w-0 py-2 pl-2 ${last ? "" : "border-b border-line"}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[9.5px] font-semibold tracking-[.1em] text-faint">{event.phase ?? "DECISION"}</span>
            <time className="font-mono text-[10px] text-faint">{formatTime(event.ts)}</time>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <code className="font-mono text-[13px] font-semibold text-ink">{event.tool ?? "gateway"}</code>
            {filtered ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-neon/35 bg-neon-soft px-2 py-[3px] font-mono text-[10px] font-bold text-neon">
                <Icon name="filter" size={10} />
                FENCED
              </span>
            ) : (
              event.decision && <DecisionChip decision={event.decision} glow={event.decision === "REQUIRE_APPROVAL"} pulse={event.decision === "REQUIRE_APPROVAL" && last} />
            )}
          </div>
          <code className="mt-1.5 block rounded-md border border-line bg-black/25 px-2 py-1.5 font-mono text-[11px] leading-snug break-words text-muted">
            {argsLine(event.argsPreview)}
          </code>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <code className={`font-mono text-[10px] font-semibold ${filtered ? "text-neon" : REASON_TONE[tone]}`}>{event.reasonCode}</code>
            {event.outcome && (
              <span className="truncate text-right text-[11px] text-faint" title={event.outcome}>
                {event.outcome}
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
