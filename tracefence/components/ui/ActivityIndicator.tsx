"use client";

import { motion } from "motion/react";

/** Five-bar signal meter: idles gently, animates hard while the gateway is evaluating a turn. */
export function ActivityIndicator({ busy, tone = "neon" }: { busy: boolean; tone?: "neon" | "amber" }) {
  const color = tone === "amber" ? "bg-approval" : "bg-neon";
  return (
    <span aria-hidden="true" className="flex h-4 items-end gap-[2px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          animate={busy ? { height: ["20%", "100%", "35%", "80%", "20%"] } : { height: ["30%", "55%", "30%"] }}
          className={`w-[3px] rounded-full ${color} ${busy ? "opacity-100" : "opacity-50"}`}
          key={i}
          transition={{
            duration: busy ? 0.9 : 2.4,
            repeat: Infinity,
            delay: i * (busy ? 0.09 : 0.25),
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}
