"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import type { Decision } from "@/components/api/types";
import { cn } from "@/components/lib/utils";

const RING: Record<Decision, string> = {
  ALLOW: "shadow-[0_0_0_0_rgba(15,159,110,0.45)]",
  DENY: "shadow-[0_0_0_0_rgba(224,56,79,0.45)]",
  REQUIRE_APPROVAL: "shadow-[0_0_0_0_rgba(196,122,10,0.45)]",
};

/** Brief pop when a gateway decision appears (ALLOW / DENY / approval). */
export function DecisionPop({
  decision,
  children,
  className,
}: {
  decision: Decision;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{children}</span>;
  return (
    <motion.span
      className={cn("inline-flex", RING[decision], className)}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        boxShadow: [
          "0 0 0 0 rgba(0,0,0,0)",
          decision === "DENY"
            ? "0 0 0 8px rgba(224,56,79,0)"
            : decision === "ALLOW"
              ? "0 0 0 8px rgba(15,159,110,0)"
              : "0 0 0 8px rgba(196,122,10,0)",
        ],
      }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
    >
      {children}
    </motion.span>
  );
}
