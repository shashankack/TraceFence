"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/components/lib/utils";
import { useSpotlight } from "@/components/ui/motion/spotlight";

/** Spring press + cursor-tracking flash for primary actions (send, sign-in, approve). */
export function Pressable({
  children,
  className,
  disabled,
  onMouseMove,
  onMouseLeave,
  ...props
}: ComponentPropsWithoutRef<typeof motion.button> & { children: ReactNode }) {
  const reduce = useReducedMotion();
  const { spotlightProps } = useSpotlight({ size: 160, disabled: !!disabled });
  return (
    <motion.button
      {...props}
      className={cn(spotlightProps.className, "tf-spotlight-sm", className)}
      disabled={disabled}
      data-spotlight={spotlightProps["data-spotlight"]}
      onMouseMove={(e) => {
        spotlightProps.onMouseMove?.(e);
        onMouseMove?.(e);
      }}
      onMouseLeave={(e) => {
        spotlightProps.onMouseLeave?.(e);
        onMouseLeave?.(e);
      }}
      whileHover={reduce || disabled ? undefined : { scale: 1.03 }}
      whileTap={reduce || disabled ? undefined : { scale: 0.94 }}
      transition={{ type: "spring", stiffness: 520, damping: 28 }}
    >
      {children}
    </motion.button>
  );
}
