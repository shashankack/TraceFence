"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAppState } from "./AppState";

const TONE = {
  allow: { border: "border-allow/40", icon: "text-allow bg-allow-soft", glyph: "check" as const, glow: "glow-allow" },
  deny: { border: "border-deny/40", icon: "text-deny bg-deny-soft", glyph: "x" as const, glow: "glow-deny" },
  info: { border: "border-neon/30", icon: "text-neon bg-neon-soft", glyph: "shield" as const, glow: "" },
};

export function ToastHost() {
  const { toast, dismissToast } = useAppState();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 4200);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 left-4 z-[60] flex justify-end sm:left-auto">
      <AnimatePresence>
        {toast && (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`glass pointer-events-auto flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 sm:w-[360px] ${TONE[toast.tone].border} ${TONE[toast.tone].glow}`}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            key={toast.id}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          >
            <span className={`grid size-8 place-items-center rounded-lg ${TONE[toast.tone].icon}`}>
              <Icon name={TONE[toast.tone].glyph} size={16} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <strong className="text-sm text-ink">{toast.title}</strong>
              <p className="m-0 text-xs text-muted">{toast.body}</p>
            </div>
            <button aria-label="Dismiss" className="text-faint hover:text-ink" onClick={dismissToast} type="button">
              <Icon name="x" size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
