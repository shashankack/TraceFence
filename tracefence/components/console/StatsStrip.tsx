"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/api/client";
import type { AuditDTO } from "@/components/api/types";
import { useAppState } from "@/components/shell/AppState";
import { forbiddenExecutions } from "./evidence";

/** Tenant-wide aggregate from GET /api/audit, refreshed while the console is in live mode. */
export function useAuditPoll(enabled: boolean, intervalMs = 6000) {
  const [audit, setAudit] = useState<AuditDTO | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const tick = () =>
      api
        .audit()
        .then((a) => {
          if (!alive) return;
          setAudit(a);
          setError(false);
        })
        .catch(() => alive && setError(true));
    tick();
    const t = setInterval(tick, intervalMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [enabled, intervalMs]);
  return { audit, error };
}

/** One narrow line of figures. Decision colours appear only on the numbers they describe. */
export function StatsStrip() {
  const { events, approval, mode } = useAppState();
  const { audit, error } = useAuditPoll(mode === "live");

  const decisions = events.filter((e) => e.reasonCode !== "RETRIEVAL_FILTERED");
  const allowed = decisions.filter((e) => e.decision === "ALLOW").length;
  const blocked = decisions.filter((e) => e.decision === "DENY").length;
  const waiting = approval?.status === "PENDING" ? 1 : 0;
  const fenced = new Set(
    events.flatMap((e) =>
      e.reasonCode === "RETRIEVAL_FILTERED" && Array.isArray(e.argsPreview?.filteredOut) ? (e.argsPreview.filteredOut as string[]) : [],
    ),
  ).size;
  const forbidden = forbiddenExecutions(events);
  const tenantTotal = audit?.sessionDecisions.reduce((n, d) => n + d.count, 0);

  return (
    <section aria-label="Session statistics" className="flex h-10 flex-none items-stretch overflow-x-auto border-b border-line bg-canvas text-[12px]">
      <Figure label="Allowed" tone="text-allow" value={allowed} />
      <Figure label="Blocked" tone={blocked ? "text-deny" : "text-ink"} value={blocked} />
      <Figure label="Needs approval" tone={waiting ? "text-approval" : "text-ink"} value={waiting} />
      <Figure label="Sources fenced" tone="text-ink" value={fenced} />
      <div className="flex items-center gap-2 border-r border-line px-4 whitespace-nowrap">
        <span className={`size-[7px] rounded-full ${forbidden ? "bg-deny" : "bg-allow"}`} />
        <span className="text-muted">Forbidden executions</span>
        <span className={`font-mono text-[13px] font-semibold tabular-nums ${forbidden ? "text-deny" : "text-allow"}`}>{forbidden}</span>
      </div>
      <div className="ml-auto flex items-center gap-2 px-4 whitespace-nowrap text-faint">
        <span>Tenant</span>
        {mode !== "live" ? (
          <span>paused in replay</span>
        ) : error ? (
          <span className="text-deny">audit feed unavailable</span>
        ) : audit ? (
          <span className="font-mono text-[11.5px] text-muted tabular-nums">
            {tenantTotal} decisions · {audit.sessions} sessions
          </span>
        ) : (
          <span>connecting…</span>
        )}
      </div>
    </section>
  );
}

function Figure({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center gap-2 border-r border-line px-4 whitespace-nowrap">
      <span className="text-muted">{label}</span>
      <span className={`font-mono text-[13px] font-semibold tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}
