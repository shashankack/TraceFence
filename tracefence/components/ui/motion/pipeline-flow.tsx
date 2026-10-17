"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/components/lib/utils";

const STEPS = ["Source", "Proposal", "Decision", "Outcome"] as const;

/**
 * Login hero pipeline with traveling particles.
 * Briefly pauses / tints on Decision (DENY beat) then resumes  product story in motion.
 */
export function PipelineFlow({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduce) return;
    let alive = true;
    const loop = () => {
      // Run freely, then hold a DENY beat on Decision every cycle.
      const t1 = window.setTimeout(() => alive && setPaused(true), 3200);
      const t2 = window.setTimeout(() => alive && setPaused(false), 4200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    };
    let clear = loop();
    const id = window.setInterval(() => {
      clear();
      clear = loop();
    }, 5600);
    return () => {
      alive = false;
      clear();
      window.clearInterval(id);
    };
  }, [reduce]);

  return (
    <ol className={cn("mt-8 flex list-none items-center gap-0 p-0", className)}>
      {STEPS.map((step, i) => {
        const isDecision = i === 2;
        const denyBeat = paused && isDecision;
        return (
          <li className="flex flex-1 items-center" key={step}>
            <motion.span
              className={cn(
                "flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 font-mono text-[11px] shadow-[0_1px_2px_rgba(14,18,37,.05)]",
                denyBeat && "border-deny/35 bg-deny-soft text-deny",
              )}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: denyBeat ? 1.04 : 1,
              }}
              transition={{ delay: 0.15 + i * 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.span
                className={cn(
                  "size-1.5 rounded-full",
                  denyBeat ? "bg-deny" : i === 2 ? "bg-violet" : "bg-primary",
                )}
                animate={
                  reduce
                    ? undefined
                    : denyBeat
                      ? { scale: [1, 1.5, 1] }
                      : { scale: [1, 1.35, 1], opacity: [1, 0.7, 1] }
                }
                transition={{
                  duration: denyBeat ? 0.6 : 2.2,
                  repeat: Infinity,
                  delay: i * 0.35,
                  ease: "easeInOut",
                }}
              />
              {step}
              {denyBeat && (
                <span className="font-mono text-[9px] tracking-wide uppercase">deny</span>
              )}
            </motion.span>
            {i < STEPS.length - 1 && (
              <span className="relative mx-1.5 h-px flex-1 overflow-hidden bg-border">
                <motion.span
                  className={cn(
                    "absolute inset-y-0 left-0 w-1/3",
                    paused && i >= 2
                      ? "bg-deny/50"
                      : "bg-gradient-to-r from-primary/60 to-violet/40",
                  )}
                  animate={
                    reduce || (paused && i >= 1)
                      ? { x: paused && i >= 1 ? "40%" : 0 }
                      : { x: ["-100%", "220%"] }
                  }
                  transition={
                    paused && i >= 1
                      ? { duration: 0.35 }
                      : { duration: 2.2, repeat: Infinity, ease: "linear", delay: i * 0.25 }
                  }
                />
                {!reduce && !paused && (
                  <motion.span
                    className="absolute top-1/2 size-1 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_5px_var(--primary)]"
                    animate={{ left: ["0%", "100%"] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "linear",
                      delay: i * 0.4,
                    }}
                  />
                )}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
