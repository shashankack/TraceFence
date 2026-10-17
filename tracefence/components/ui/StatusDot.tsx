"use client";

import { motion } from "motion/react";

const TONE = {
  green: { dot: "bg-allow", ring: "bg-allow/40" },
  amber: { dot: "bg-approval", ring: "bg-approval/40" },
  red: { dot: "bg-deny", ring: "bg-deny/40" },
  blue: { dot: "bg-neon", ring: "bg-neon/40" },
  grey: { dot: "bg-faint", ring: "" },
};

export type DotTone = keyof typeof TONE;

export function StatusDot({ tone = "green" }: { tone?: DotTone }) {
  const t = TONE[tone];
  return (
    <span className="relative inline-flex size-1.5">
      {tone !== "grey" && (
        <motion.span
          animate={{ scale: [1, 2.8], opacity: [0.7, 0] }}
          className={`absolute inset-0 rounded-full ${t.ring}`}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <span className={`relative inline-block size-1.5 rounded-full ${t.dot}`} />
    </span>
  );
}
