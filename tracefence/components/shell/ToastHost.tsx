"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAppState } from "./AppState";

const TONE = {
  allow: { bar: "bg-allow", icon: "text-allow", glyph: "check" as const },
  deny: { bar: "bg-deny", icon: "text-deny", glyph: "x" as const },
  info: { bar: "bg-accent", icon: "text-accent", glyph: "shield" as const },
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
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-[6px] border border-line bg-surface py-3 pr-3 pl-4 shadow-[0_6px_20px_rgba(31,35,41,.1)] sm:w-[340px]"
            exit={{ opacity: 0, y: 6 }}
            initial={{ opacity: 0, y: 8 }}
            key={toast.id}
            transition={{ duration: 0.16 }}
          >
            <span className={`absolute inset-y-0 left-0 w-[3px] ${TONE[toast.tone].bar}`} />
            <Icon className={`mt-px ${TONE[toast.tone].icon}`} name={TONE[toast.tone].glyph} size={15} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <strong className="text-[13px] font-medium text-ink">{toast.title}</strong>
              <p className="m-0 text-[12px] text-muted">{toast.body}</p>
            </div>
            <button aria-label="Dismiss" className="text-faint hover:text-ink" onClick={dismissToast} type="button">
              <Icon name="x" size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
