"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/components/lib/utils";
import { CursorGrid } from "./cursor-grid";

/**
 * Login hero atmosphere: tech grid + cursor-reactive cells + soft orbs.
 */
export function MeshBg({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="tech-grid absolute inset-0 z-0 opacity-70" />

      {!reduce && (
        <>
          <motion.div
            className="absolute -top-24 -left-16 z-[1] size-[28rem] rounded-full bg-primary/12 blur-3xl"
            animate={{ x: [0, 48, 0], y: [0, 28, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/3 -right-20 z-[1] size-[24rem] rounded-full bg-violet/14 blur-3xl"
            animate={{ x: [0, -36, 0], y: [0, 48, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 left-1/4 z-[1] size-[20rem] rounded-full bg-allow/10 blur-3xl"
            animate={{ x: [0, 24, 0], y: [0, -22, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          {PARTICLES.map((p) => (
            <motion.span
              key={p.id}
              className="absolute z-[1] size-1 rounded-full bg-primary/40"
              style={{ left: p.left, top: p.top }}
              animate={{
                y: [0, p.dy, 0],
                x: [0, p.dx, 0],
                opacity: [0.15, 0.55, 0.15],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: p.delay,
              }}
            />
          ))}
        </>
      )}

      {!reduce && <CursorGrid cellSize={30} className="z-[2]" radius={100} />}
    </div>
  );
}

const PARTICLES = [
  { id: 1, left: "12%", top: "22%", dx: 12, dy: -28, duration: 9, delay: 0 },
  { id: 2, left: "28%", top: "48%", dx: -10, dy: -18, duration: 11, delay: 1.2 },
  { id: 3, left: "55%", top: "30%", dx: 16, dy: 22, duration: 10, delay: 0.4 },
  { id: 4, left: "72%", top: "58%", dx: -14, dy: -24, duration: 12, delay: 2 },
  { id: 5, left: "40%", top: "72%", dx: 8, dy: -16, duration: 8.5, delay: 0.8 },
  { id: 6, left: "85%", top: "24%", dx: -8, dy: 20, duration: 13, delay: 1.6 },
  { id: 7, left: "18%", top: "68%", dx: 14, dy: 12, duration: 9.5, delay: 2.4 },
  { id: 8, left: "62%", top: "78%", dx: -12, dy: -14, duration: 11.5, delay: 0.2 },
];
