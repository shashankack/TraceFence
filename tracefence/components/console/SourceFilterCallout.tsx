"use client";

import { AnimatePresence, motion } from "motion/react";
import { useAppState } from "@/components/shell/AppState";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Icon } from "@/components/ui/Icon";
import { docTitle } from "./catalog";

/** Shows that ACL filtering happened before inference: what entered context vs. what never did. */
export function SourceFilterCallout() {
  const { events, messages } = useAppState();

  const lastSearch = [...events].reverse().find((e) => e.tool === "search_docs" && e.reasonCode !== "RETRIEVAL_FILTERED");
  const lastFilter = [...events].reverse().find((e) => e.reasonCode === "RETRIEVAL_FILTERED");
  const lastAssistant = [...messages].reverse().find((m) => m.from === "assistant");
  if (!lastSearch) return null;

  const entered = lastSearch.docIds?.length ?? lastAssistant?.citations?.length ?? 0;
  const filteredOut = Array.isArray(lastFilter?.argsPreview?.filteredOut)
    ? (lastFilter.argsPreview.filteredOut as string[])
    : [];
  const hot = filteredOut.length > 0 && !!lastAssistant?.blocked;

  return (
    <AnimatePresence>
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className={`flex min-h-[78px] items-center gap-4 rounded-[10px] border px-3.5 py-2.5 transition-colors ${hot ? "border-[#ecc7c7] bg-[#fffafa]" : "border-[#cce2dd] bg-[rgba(247,252,251,.96)]"}`}
        initial={{ opacity: 0, y: 10 }}
        layout
      >
        <div className="flex min-w-[180px] items-center gap-2">
          <span className={`grid size-[30px] place-items-center rounded-lg ${hot ? "bg-deny-soft text-deny" : "bg-teal-soft text-teal"}`}>
            <Icon name="filter" size={15} />
          </span>
          <div className="flex flex-col gap-0.5">
            <strong className="font-display text-xs font-bold">Source-aware context</strong>
            <small className="text-[11px] text-faint">Built before model inference</small>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Stat label="entered context" sub={entered ? "permitted documents" : "nothing matched"} tone="text-allow" value={entered} />
          <motion.span
            animate={{ scaleX: 1 }}
            className="h-px w-6 origin-left bg-line-strong"
            initial={{ scaleX: 0 }}
            transition={{ delay: 0.2 }}
          />
          <Stat
            label="sources fenced out"
            sub={filteredOut.length ? filteredOut.map(docTitle).slice(0, 2).join(", ") + (filteredOut.length > 2 ? "…" : "") : "role sees all"}
            tone="text-deny"
            value={filteredOut.length}
          />
        </div>

        {filteredOut.length > 0 && (
          <motion.div
            animate={{ opacity: 1 }}
            className="ml-auto flex max-w-[220px] items-center gap-1.5 text-[11px] font-bold text-deny"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Icon name="lock" size={13} />
            Unauthorized sources never entered model context.
          </motion.div>
        )}
      </motion.section>
    </AnimatePresence>
  );
}

function Stat({ value, label, sub, tone }: { value: number; label: string; sub: string; tone: string }) {
  return (
    <div className="flex items-center gap-2">
      <AnimatedNumber className={`font-display text-2xl font-bold ${tone}`} value={value} />
      <p className="m-0 flex flex-col text-[11px] font-bold text-[#465558]">
        {label}
        <small className="max-w-[180px] truncate text-[10px] font-medium text-faint">{sub}</small>
      </p>
    </div>
  );
}
