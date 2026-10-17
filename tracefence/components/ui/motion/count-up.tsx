"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

/** Animates a KPI number into place when the admin panel loads / updates. */
export function CountUp({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const spring = useSpring(mv, { stiffness: 90, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    mv.set(value);
  }, [mv, value]);

  if (reduce) {
    return <span className={className}>{value.toLocaleString()}</span>;
  }
  return <motion.span className={className}>{display}</motion.span>;
}
