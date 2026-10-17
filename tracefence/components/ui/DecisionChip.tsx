"use client";

import { motion } from "motion/react";
import type { Decision } from "@/components/api/types";

export const decisionTone: Record<Decision, { text: string; bg: string; border: string; label: string; glyph: string }> = {
  ALLOW: { text: "text-allow", bg: "bg-allow-soft", border: "border-allow/25", label: "ALLOW", glyph: "✓" },
  DENY: { text: "text-deny", bg: "bg-deny-soft", border: "border-deny/25", label: "DENY", glyph: "✕" },
  REQUIRE_APPROVAL: {
    text: "text-approval",
    bg: "bg-approval-soft",
    border: "border-approval/25",
    label: "REQUIRE_APPROVAL",
    glyph: "!",
  },
};

export function DecisionChip({ decision, pulse = false }: { decision: Decision; pulse?: boolean }) {
  const tone = decisionTone[decision];
  return (
    <motion.span
      animate={
        pulse
          ? { boxShadow: ["0 0 0 0 rgba(200,52,52,0)", "0 0 0 5px rgba(200,52,52,0.12)", "0 0 0 0 rgba(200,52,52,0)"] }
          : undefined
      }
      className={`inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 font-mono text-[10px] font-bold ${tone.text} ${tone.bg}`}
      initial={{ scale: 0.8, opacity: 0 }}
      transition={pulse ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { type: "spring", stiffness: 500, damping: 25 }}
      whileInView={{ scale: 1, opacity: 1 }}
    >
      <b className="font-sans text-[11px]">{tone.glyph}</b>
      {tone.label}
    </motion.span>
  );
}
