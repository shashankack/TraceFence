"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/components/lib/utils";

/** Spring press for primary actions (send, sign-in, approve). */
export function Pressable({
  children,
  className,
  disabled,
  ...props
}: ComponentPropsWithoutRef<typeof motion.button> & { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      {...props}
      className={cn(className)}
      disabled={disabled}
      whileHover={reduce || disabled ? undefined : { scale: 1.03 }}
      whileTap={reduce || disabled ? undefined : { scale: 0.94 }}
      transition={{ type: "spring", stiffness: 520, damping: 28 }}
    >
      {children}
    </motion.button>
  );
}
