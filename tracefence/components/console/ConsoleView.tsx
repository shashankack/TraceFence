"use client";

import { useAppState } from "@/components/shell/AppState";
import { Icon } from "@/components/ui/Icon";
import { DecisionRail } from "./DecisionRail";
import { MissionControl } from "./MissionControl";
import { StatsStrip } from "./StatsStrip";
import { UntrustedSource } from "./UntrustedSource";

export function ConsoleView() {
  return (
    <main className="flex flex-1 flex-col xl:h-[calc(100vh-48px)] xl:min-h-0">
      <StatsStrip />
      <FallbackBanner />
      <div className="grid min-h-0 flex-1 grid-cols-1 bg-surface divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.05fr)_minmax(0,1.15fr)]">
        <MissionControl />
        <UntrustedSource />
        <DecisionRail className="border-t border-line md:col-span-2 xl:col-span-1 xl:border-t-0" />
      </div>
    </main>
  );
}

function FallbackBanner() {
  const { fallbackReason, setMode } = useAppState();
  if (!fallbackReason) return null;
  return (
    <div className="flex h-9 flex-none items-center gap-2 border-b border-approval/30 bg-approval-soft px-4 text-[12px]">
      <Icon className="text-approval" name="alert" size={14} />
      <p className="m-0 flex-1 text-ink/85">
        <span className="font-medium text-approval">Live gateway unavailable.</span> {fallbackReason}
      </p>
      <button className="text-[12px] font-medium text-approval hover:underline" onClick={() => setMode("live")} type="button">
        Retry live
      </button>
    </div>
  );
}
