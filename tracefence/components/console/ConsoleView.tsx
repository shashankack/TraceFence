"use client";

import { AnimatePresence, motion } from "motion/react";
import { useAppState } from "@/components/shell/AppState";
import { Icon } from "@/components/ui/Icon";
import { DecisionRail } from "./DecisionRail";
import { MissionControl } from "./MissionControl";
import { StatsStrip } from "./StatsStrip";
import { UntrustedSource } from "./UntrustedSource";

export function ConsoleView() {
  return (
    <main className="flex flex-1 flex-col gap-3 p-3 sm:p-5 xl:h-[calc(100vh-64px)]">
      <FallbackBanner />
      <StatsStrip />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(0,1.05fr)]">
        <MissionControl />
        <UntrustedSource />
        <div className="md:col-span-2 xl:col-span-1 xl:min-h-0 [&>aside]:h-full">
          <DecisionRail />
        </div>
      </div>
    </main>
  );
}

function FallbackBanner() {
  const { fallbackReason, setMode } = useAppState();
  return (
    <AnimatePresence>
      {fallbackReason && (
        <motion.div
          animate={{ opacity: 1, height: "auto" }}
          className="overflow-hidden"
          exit={{ opacity: 0, height: 0 }}
          initial={{ opacity: 0, height: 0 }}
        >
          <div className="flex min-h-[40px] items-center gap-2 rounded-xl border border-approval/40 bg-approval-soft px-3 py-2 text-approval">
            <Icon name="alert" size={15} />
            <p className="m-0 flex-1 text-xs text-ink/80">
              <strong className="text-approval">Live gateway unavailable.</strong> {fallbackReason}
            </p>
            <button className="text-xs font-semibold text-approval hover:underline" onClick={() => setMode("live")} type="button">
              Retry live
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
