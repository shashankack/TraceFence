"use client";

import { useAppState } from "@/components/shell/AppState";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export function KpiStrip() {
  const { events, approval } = useAppState();
  const decisions = events.filter((e) => e.reasonCode !== "RETRIEVAL_FILTERED");
  const allowed = decisions.filter((e) => e.decision === "ALLOW").length;
  const blocked = decisions.filter((e) => e.decision === "DENY").length;
  const waiting = approval?.status === "PENDING" ? 1 : 0;
  const filtered = new Set(
    events.flatMap((e) =>
      e.reasonCode === "RETRIEVAL_FILTERED" && Array.isArray(e.argsPreview?.filteredOut)
        ? (e.argsPreview.filteredOut as string[])
        : [],
    ),
  ).size;

  return (
    <section className="mx-auto mt-3 grid h-[54px] max-w-[1366px] grid-cols-[.75fr_.75fr_1fr_1.4fr] rounded-[10px] border border-line bg-white/80 shadow-[0_3px_14px_rgba(26,58,61,.035)] max-[1410px]:mx-[22px]">
      <Kpi dot="bg-allow" label="Allowed" value={allowed} />
      <Kpi dot="bg-deny" label="Blocked" value={blocked} />
      <Kpi dot="bg-[#d5831c]" label="Waiting approval" value={waiting} />
      <Kpi
        badge="never in context"
        dot="bg-teal"
        label="Sources fenced out"
        value={filtered}
      />
    </section>
  );
}

function Kpi({ dot, label, value, badge }: { dot: string; label: string; value: number; badge?: string }) {
  return (
    <div className="flex items-center gap-2 border-r border-line px-4 last:border-r-0">
      <span className={`size-2 rounded-full ${dot}`} />
      <p className="m-0 flex flex-1 items-baseline gap-2 text-xs font-semibold text-muted">
        {label}
        <AnimatedNumber className="font-display text-lg font-bold text-ink" value={value} />
      </p>
      {badge && (
        <em className="rounded-full bg-teal-soft px-2 py-1 text-[10px] font-bold not-italic text-teal">{badge}</em>
      )}
    </div>
  );
}
