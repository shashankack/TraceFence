"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { bentoGridHoverClass } from "@/components/ui/bento";
import { cn } from "@/components/lib/utils";

/** Stagger children on mount  wrap admin bento grids / queues. */
export function Stagger({
  children,
  className,
  delay = 0,
  stagger = 0.06,
  /** Dim sibling `.bento-tile`s while one is hovered (default on). */
  dimSiblings = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  dimSiblings?: boolean;
}) {
  const reduce = useReducedMotion();
  const gridClass = cn(className, dimSiblings && bentoGridHoverClass);
  if (reduce) return <div className={gridClass}>{children}</div>;
  return (
    <motion.div
      className={gridClass}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
