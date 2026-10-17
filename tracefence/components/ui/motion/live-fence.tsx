"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { Decision, EventDTO, Phase } from "@/components/api/types";
import { cn } from "@/components/lib/utils";
import { DecisionBadge } from "@/components/ui/decision-badge";

const PHASES: Phase[] = ["SOURCE", "PROPOSAL", "DECISION", "OUTCOME"];

function isInformational(e: EventDTO): boolean {
  if (e.reasonCode === "RETRIEVAL_FILTERED") return true;
  if (e.reasonCode === "INJECTION_IGNORED") {
    const kind =
      e.argsPreview && typeof e.argsPreview === "object"
        ? (e.argsPreview as { kind?: string }).kind
        : undefined;
    return kind === "indirect_source";
  }
  return false;
}

/**
 * Map gateway events onto the demo pipeline.
 * A finished turn with a real decision lights the full SOURCE→OUTCOME chain.
 */
function phasesReached(events: EventDTO[]): Set<Phase> {
  const reached = new Set<Phase>();
  if (events.length === 0) return reached;

  reached.add("SOURCE");

  for (const e of events) {
    const p = (e.phase as Phase | undefined) ?? undefined;
    if (p && PHASES.includes(p)) reached.add(p);

    if (e.tool && e.tool !== "policy_guard") {
      reached.add("PROPOSAL");
      reached.add("DECISION");
    }
    if (e.tool === "policy_guard" && e.decision && !isInformational(e)) {
      reached.add("DECISION");
    }
    if (e.decision || e.outcome) reached.add("OUTCOME");
  }

  const headline = latestDecision(events);
  if (headline) {
    // Completed enforcement beat  show the whole chain for judges.
    for (const p of PHASES) reached.add(p);
  }

  return reached;
}

function latestDecision(events: EventDTO[]): Decision | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (!e.decision || isInformational(e)) continue;
    return e.decision as Decision;
  }
  return null;
}

/**
 * Cinematic SOURCE → PROPOSAL → DECISION → OUTCOME rail.
 * Stages light up as gateway events arrive; connectors draw in sequence.
 */
export function LiveFenceRail({
  events,
  sending,
  className,
  compact = false,
}: {
  events: EventDTO[];
  sending?: boolean;
  className?: string;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const reached = useMemo(() => phasesReached(events), [events]);
  const decision = useMemo(() => latestDecision(events), [events]);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    setPulseKey((k) => k + 1);
  }, [events.length, sending]);

  const activeIndex = sending
    ? Math.min(
        (() => {
          const idx = PHASES.findIndex((p) => !reached.has(p));
          return idx === -1 ? PHASES.length - 1 : idx;
        })(),
        PHASES.length - 1,
      )
    : PHASES.reduce((acc, p, i) => (reached.has(p) ? i : acc), -1);

  return (
    <div
      className={cn(
        "rounded-xl border bg-white/90 px-3 py-2.5 shadow-[0_1px_2px_rgba(14,18,37,0.04)] backdrop-blur",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="kicker m-0">Live fence</span>
        <AnimatePresence mode="wait">
          {decision ? (
            <motion.span
              key={`${decision}-${pulseKey}`}
              initial={reduce ? false : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
            >
              <DecisionBadge decision={decision} />
            </motion.span>
          ) : sending ? (
            <motion.span
              key="scanning"
              className="font-mono text-[10px] text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              enforcing…
            </motion.span>
          ) : (
            <span className="font-mono text-[10px] text-muted-foreground">idle</span>
          )}
        </AnimatePresence>
      </div>

      <ol className="m-0 flex list-none items-center gap-0 p-0">
        {PHASES.map((phase, i) => {
          const lit = reached.has(phase) || (sending && i <= Math.max(activeIndex, 0));
          const current = sending && i === activeIndex;
          const isDeny = decision === "DENY" && phase === "DECISION" && lit;
          const nextLit = reached.has(PHASES[i + 1]) || (sending && i < activeIndex);
          return (
            <li className="flex min-w-0 flex-1 items-center" key={phase}>
              <motion.span
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[10px] transition-colors",
                  compact && "px-1.5 text-[9px] sm:text-[10px]",
                  lit
                    ? isDeny
                      ? "border-deny/40 bg-deny-soft text-deny"
                      : decision === "REQUIRE_APPROVAL" && phase === "DECISION"
                        ? "border-approval/40 bg-approval-soft text-approval"
                        : "border-primary/30 bg-accent text-accent-foreground"
                    : "border-transparent text-muted-foreground/55",
                )}
                animate={
                  reduce
                    ? undefined
                    : current
                      ? { scale: [1, 1.06, 1] }
                      : { scale: 1 }
                }
                transition={
                  current
                    ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
                    : { type: "spring", stiffness: 380, damping: 24 }
                }
              >
                <motion.span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    isDeny ? "bg-deny" : lit ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                  animate={
                    reduce || !lit
                      ? undefined
                      : isDeny
                        ? { scale: [1, 1.4, 1] }
                        : current
                          ? { opacity: [1, 0.45, 1] }
                          : undefined
                  }
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span>{phase}</span>
              </motion.span>
              {i < PHASES.length - 1 && (
                <span className="relative mx-1 h-px min-w-[8px] flex-1 overflow-hidden bg-border">
                  <motion.span
                    className={cn(
                      "absolute inset-y-0 left-0 h-full",
                      decision === "DENY" && i >= 2
                        ? "bg-deny/70"
                        : "bg-gradient-to-r from-primary to-primary/40",
                    )}
                    initial={false}
                    animate={{
                      width: lit && nextLit ? "100%" : sending && i === activeIndex ? "55%" : lit ? "40%" : "0%",
                    }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  />
                  {sending && i === activeIndex && !reduce && (
                    <motion.span
                      className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]"
                      animate={{ left: ["0%", "100%"] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
