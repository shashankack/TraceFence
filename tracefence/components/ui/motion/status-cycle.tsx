"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/components/lib/utils";

/** Claude-style rotating status lines while the gateway / model works. */
export const THINKING_PHRASES = [
  "Thinking",
  "Checking your access",
  "Reading allowed sources",
  "Applying gateway policy",
  "Drafting a careful reply",
] as const;

export const LOADING_CHAT_PHRASES = [
  "Opening chat",
  "Restoring messages",
  "Almost ready",
] as const;

export const LOADING_TRACE_PHRASES = [
  "Loading trace",
  "Pulling audit events",
  "Linking the timeline",
] as const;

export const SUGGESTING_TITLE_PHRASES = [
  "Reading the document",
  "Skimming for a title",
  "Naming this source",
] as const;

export function StatusCycle({
  phrases,
  intervalMs = 2200,
  className,
  shimmer = true,
}: {
  phrases: readonly string[];
  intervalMs?: number;
  className?: string;
  shimmer?: boolean;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || phrases.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, phrases.length, reduce]);

  const text = phrases[Math.min(index, phrases.length - 1)] ?? phrases[0];

  if (reduce) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        {text}…
      </span>
    );
  }

  return (
    <span
      aria-live="polite"
      className={cn(
        "relative inline-flex min-h-[1.25rem] items-center overflow-hidden text-sm",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={text}
          className={cn(
            "inline-block text-muted-foreground",
            shimmer && "status-shimmer",
          )}
          initial={{ opacity: 0, y: 8, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {text}
          <motion.span
            aria-hidden
            className="inline-block w-[1.1em] text-left"
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            …
          </motion.span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
