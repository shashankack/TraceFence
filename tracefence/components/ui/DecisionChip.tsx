"use client";

import { motion } from "motion/react";
import type { Decision } from "@/components/api/types";

export const decisionTone: Record<
  Decision,
  { text: string; bg: string; border: string; glow: string; label: string; short: string; glyph: string }
> = {
  ALLOW: {
    text: "text-allow",
    bg: "bg-allow-soft",
    border: "border-allow/35",
    glow: "glow-allow",
    label: "ALLOWED",
    short: "ALLOW",
    glyph: "✓",
  },
  DENY: {
    text: "text-deny",
    bg: "bg-deny-soft",
    border: "border-deny/40",
    glow: "glow-deny",
    label: "BLOCKED",
    short: "DENY",
    glyph: "✕",
  },
  REQUIRE_APPROVAL: {
    text: "text-approval",
    bg: "bg-approval-soft",
    border: "border-approval/40",
    glow: "glow-approval",
    label: "NEEDS APPROVAL",
    short: "APPROVAL",
    glyph: "!",
  },
};

export function DecisionChip({
  decision,
  pulse = false,
  glow = false,
  compact = false,
}: {
  decision: Decision;
  pulse?: boolean;
  glow?: boolean;
  compact?: boolean;
}) {
  const tone = decisionTone[decision];
  return (
    <motion.span
      animate={pulse ? { opacity: [1, 0.65, 1] } : { scale: 1, opacity: 1 }}
      className={`inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-md border px-2 py-[3px] font-mono text-[10px] font-bold tracking-wide ${tone.text} ${tone.bg} ${tone.border} ${glow ? tone.glow : ""}`}
      initial={{ scale: 0.8, opacity: 0 }}
      title={decision}
      transition={pulse ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { type: "spring", stiffness: 500, damping: 25 }}
    >
      <b className="font-sans text-[11px] leading-none">{tone.glyph}</b>
      {compact ? tone.short : tone.label}
    </motion.span>
  );
}
