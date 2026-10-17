"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Decision, EventDTO } from "@/components/api/types";
import { useAppState } from "@/components/shell/AppState";
import { StatusDot } from "@/components/shell/AppHeader";
import { DecisionChip } from "@/components/ui/DecisionChip";
import { Icon, toolIcon } from "@/components/ui/Icon";

const PHASES = ["SOURCE", "PROPOSAL", "DECISION", "OUTCOME"] as const;

const NODE_TONE: Record<Decision, string> = {
  ALLOW: "text-teal bg-teal-soft border-[#bee0da]",
  DENY: "text-deny bg-deny-soft border-[#efc2c2]",
  REQUIRE_APPROVAL: "text-approval bg-approval-soft border-[#edd1a5]",
};

const REASON_TONE: Record<Decision, string> = {
  ALLOW: "text-teal",
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

export function DecisionRail() {
  const { events, mode } = useAppState();
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenPhases = new Set(events.map((e) => e.phase));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [events.length]);

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-white/95 shadow-[0_7px_24px_rgba(26,58,61,.05)]">
      <div className="flex min-h-[64px] items-center justify-between border-b border-line px-4 py-3">
        <div>
          <span className="block text-[10px] font-extrabold uppercase tracking-[.75px] text-teal">Server gateway</span>
          <h2 className="mt-0.5 font-display text-lg font-bold tracking-tight">Decision rail</h2>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-allow-soft px-2.5 py-1.5 text-[11px] font-bold text-allow">
          <StatusDot tone={mode === "live" ? "green" : "amber"} />
          {mode === "live" ? "Live events" : "Replay events"}
        </span>
      </div>

      <div className="flex min-h-[32px] items-center gap-1.5 border-b border-line bg-[#f7f9f9] px-3.5 font-mono text-[10px] font-semibold tracking-[.35px]">
        {PHASES.map((p, i) => (
          <span className="flex items-center gap-1.5" key={p}>
            <motion.span
              animate={{ color: seenPhases.has(p) ? "var(--color-teal)" : "var(--color-faint)" }}
              transition={{ duration: 0.4 }}
            >
              {p}
            </motion.span>
            {i < PHASES.length - 1 && <Icon className="text-[#b2bcbe]" name="chevron" size={10} />}
          </span>
        ))}
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-3 pt-1.5 pb-2" ref={scrollRef}>
        {events.length === 0 ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="flex h-full min-h-[340px] flex-col items-center justify-center text-center"
            initial={{ opacity: 0 }}
          >
            <motion.span
              animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.06, 1] }}
              className="grid size-11 place-items-center rounded-xl bg-teal-soft text-teal"
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon name="spark" size={20} />
            </motion.span>
            <strong className="mt-2.5 font-display text-sm font-bold">No decisions yet</strong>
            <p className="max-w-[260px] text-xs leading-normal text-faint">
              Tool proposals and source decisions will appear here in real time.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((e, i) => (
              <RailEvent event={e} index={i} key={e.id} last={i === events.length - 1} />
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="flex min-h-[36px] items-center gap-1.5 border-t border-line bg-[#f7f9f9] px-3.5 text-[11px] text-muted">
        <Icon className="text-teal" name="shield" size={13} />
        <span>Policy executes outside the LLM</span>
        <code className="ml-auto font-mono text-[10px] text-faint">{events.length} events</code>
      </div>
    </aside>
  );
}

function RailEvent({ event, last, index }: { event: EventDTO; last: boolean; index: number }) {
  const decision = (event.decision ?? "ALLOW") as Decision;
  const filtered = event.reasonCode === "RETRIEVAL_FILTERED";
  const tone: Decision = filtered ? "DENY" : decision;

  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="grid grid-cols-[28px_1fr]"
      initial={{ opacity: 0, x: 16 }}
      layout="position"
      transition={{ type: "spring", stiffness: 340, damping: 30, delay: (index % 4) * 0.06 }}
    >
      <div className="flex flex-col items-center">
        <motion.span
          animate={{ scale: 1 }}
          className={`z-[1] mt-2.5 grid size-6 place-items-center rounded-[7px] border ${NODE_TONE[tone]}`}
          initial={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.08 }}
        >
          <Icon name={filtered ? "filter" : toolIcon(event.tool)} size={13} />
        </motion.span>
        {!last && (
          <motion.span
            animate={{ scaleY: 1 }}
            className="min-h-[72px] w-px flex-1 origin-top bg-line"
            initial={{ scaleY: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          />
        )}
      </div>
      <div className={`min-w-0 py-2 pl-2 ${last ? "" : "border-b border-[#eaf0ee]"}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-semibold tracking-[.7px] text-faint">{event.phase ?? "DECISION"}</span>
          <time className="font-mono text-[10px] text-[#a2adaf]">{formatTime(event.ts)}</time>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <code className="font-mono text-[13px] font-semibold text-ink">{event.tool ?? "gateway"}</code>
          {filtered ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-deny-soft px-2 py-1 font-mono text-[10px] font-bold text-deny">
              <Icon name="filter" size={10} />
              FILTERED
            </span>
          ) : (
            event.decision && (
              <DecisionChip decision={event.decision} pulse={event.decision === "DENY" && last} />
            )
          )}
        </div>
        <code className="mt-1.5 block rounded-[5px] bg-[#f4f7f6] px-2 py-1.5 font-mono text-[11px] leading-snug break-words text-[#586568]">
          {argsLine(event.argsPreview)}
        </code>
        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          <code className={`font-mono text-[10px] font-semibold ${REASON_TONE[tone]}`}>{event.reasonCode}</code>
          {event.outcome && <span className="truncate text-right text-[11px] text-faint" title={event.outcome}>{event.outcome}</span>}
        </div>
      </div>
    </motion.div>
  );
}
