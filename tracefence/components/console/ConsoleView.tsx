"use client";

import { AnimatePresence, motion } from "motion/react";
import { useAppState } from "@/components/shell/AppState";
import { Icon } from "@/components/ui/Icon";
import { ChatPanel } from "./ChatPanel";
import { DecisionRail } from "./DecisionRail";
import { KpiStrip } from "./KpiStrip";
import { RoleSelector } from "./RoleSelector";
import { SourceFilterCallout } from "./SourceFilterCallout";

export function ConsoleView() {
  return (
    <>
      <RoleSelector />
      <FallbackBanner />
      <KpiStrip />
      <main className="mx-auto mt-3 grid h-[calc(100vh-215px)] min-h-[580px] max-w-[1410px] grid-cols-1 gap-3 px-[22px] pb-[22px] lg:grid-cols-[minmax(560px,1.45fr)_minmax(400px,.9fr)]">
        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-2.5">
          <ChatPanel />
          <SourceFilterCallout />
        </div>
        <DecisionRail />
      </main>
    </>
  );
}

function FallbackBanner() {
  const { fallbackReason, setMode } = useAppState();
  return (
    <AnimatePresence>
      {fallbackReason && (
        <motion.div
          animate={{ opacity: 1, height: "auto" }}
          className="mx-auto max-w-[1366px] overflow-hidden px-[22px] min-[1410px]:px-0"
          exit={{ opacity: 0, height: 0 }}
          initial={{ opacity: 0, height: 0 }}
        >
          <div className="mt-2 flex min-h-[40px] items-center gap-2 rounded-lg border border-[#e8d1a8] bg-[#fff9ee] px-3 py-2 text-approval">
            <span className="grid size-6 place-items-center rounded-md bg-approval-soft">
              <Icon name="spark" size={14} />
            </span>
            <p className="m-0 flex-1 text-xs text-[#735b3c]">
              <strong>Live gateway unavailable.</strong> {fallbackReason}
            </p>
            <button className="text-xs font-bold text-approval hover:underline" onClick={() => setMode("live")} type="button">
              Retry live
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
