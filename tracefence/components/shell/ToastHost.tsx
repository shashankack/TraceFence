"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAppState } from "./AppState";

const TONE = {
  allow: { border: "border-[#b8ddc6]", icon: "text-allow bg-allow-soft", glyph: "check" as const },
  deny: { border: "border-[#e6bebe]", icon: "text-deny bg-deny-soft", glyph: "x" as const },
  info: { border: "border-line-strong", icon: "text-teal bg-teal-soft", glyph: "shield" as const },
};

export function ToastHost() {
  const { toast, dismissToast } = useAppState();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 4200);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed right-5 bottom-5 z-[60]">
      <AnimatePresence>
        {toast && (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`pointer-events-auto flex min-w-[320px] items-center gap-2.5 rounded-[10px] border bg-white px-3.5 py-3 shadow-[0_10px_35px_rgba(20,45,48,.14)] ${TONE[toast.tone].border}`}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            key={toast.id}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          >
            <span className={`grid size-7 place-items-center rounded-lg ${TONE[toast.tone].icon}`}>
              <Icon name={TONE[toast.tone].glyph} size={15} />
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <strong className="text-sm">{toast.title}</strong>
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
