"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/components/lib/utils";

/** Single list/chat row with a short slide-in (AnimatePresence-friendly). */
export function AnimatedItem({
  children,
  className,
  layout = false,
}: {
  children: ReactNode;
  className?: string;
  layout?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={cn(className)}
      layout={layout}
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}
