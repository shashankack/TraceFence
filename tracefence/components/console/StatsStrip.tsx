"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { api } from "@/components/api/client";
import type { AuditDTO } from "@/components/api/types";
import { useAppState } from "@/components/shell/AppState";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Icon, type IconName } from "@/components/ui/Icon";

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

export function StatsStrip() {
  const { events, approval, mode, sending } = useAppState();
  const { audit, error } = useAuditPoll(mode === "live");

  const decisions = events.filter((e) => e.reasonCode !== "RETRIEVAL_FILTERED");
  const allowed = decisions.filter((e) => e.decision === "ALLOW").length;
  const blocked = decisions.filter((e) => e.decision === "DENY").length;
  const waiting = approval?.status === "PENDING" ? 1 : 0;
  const fenced = new Set(
    events.flatMap((e) =>
      e.reasonCode === "RETRIEVAL_FILTERED" && Array.isArray(e.argsPreview?.filteredOut)
        ? (e.argsPreview.filteredOut as string[])
        : [],
    ),
  ).size;
  const tenantTotal = audit?.sessionDecisions.reduce((n, d) => n + d.count, 0) ?? 0;
  const tenantBlocked = audit?.sessionDecisions.find((d) => d.decision === "DENY")?.count ?? 0;

  const tenantSub =
    mode !== "live"
      ? "replay — tenant stats paused"
      : error
        ? "audit feed unavailable"
        : audit
          ? `${audit.sessions} sessions · ${tenantBlocked} blocked`
          : "connecting…";

  return (
    <motion.section
      animate="show"
      className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5"
      initial="hidden"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
    >
      <Stat accent="allow" icon="check" label="Allowed" sub="this session" value={allowed} />
      <Stat accent="deny" hot={blocked > 0} icon="lock" label="Blocked" sub="stopped at gateway" value={blocked} />
      <Stat accent="approval" hot={waiting > 0} icon="clock" label="Needs approval" sub="human checkpoint" value={waiting} />
      <Stat accent="neon" icon="filter" label="Sources fenced out" sub="never entered context" value={fenced} />
      <Stat
        accent="neon"
        className="col-span-2 md:col-span-1"
        icon="activity"
        label="Tenant decisions"
        live={mode === "live" && !error && !!audit}
        pulse={sending}
        sub={tenantSub}
        value={tenantTotal}
      />
    </motion.section>
  );
}

const ACCENT = {
  allow: { text: "text-allow", bg: "bg-allow-soft", bar: "from-allow/70", glow: "glow-allow" },
  deny: { text: "text-deny", bg: "bg-deny-soft", bar: "from-deny/70", glow: "glow-deny" },
  approval: { text: "text-approval", bg: "bg-approval-soft", bar: "from-approval/70", glow: "glow-approval" },
  neon: { text: "text-neon", bg: "bg-neon-soft", bar: "from-neon/70", glow: "glow-neon" },
};

function Stat({
  label,
  sub,
  value,
  icon,
  accent,
  hot,
  live,
  pulse,
  className = "",
}: {
  label: string;
  sub: string;
  value: number;
  icon: IconName;
  accent: keyof typeof ACCENT;
  hot?: boolean;
  live?: boolean;
  pulse?: boolean;
  className?: string;
}) {
  const a = ACCENT[accent];
  return (
    <motion.div
      className={`glass relative overflow-hidden rounded-xl px-3.5 py-3 transition-shadow ${hot ? a.glow : ""} ${className}`}
      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
    >
      <span className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${a.bar} to-transparent`} />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-muted uppercase">{label}</span>
        <span className={`grid size-6 place-items-center rounded-md ${a.bg} ${a.text}`}>
          <Icon name={icon} size={13} />
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <AnimatedNumber className={`font-display text-[1.75rem] leading-none font-semibold ${a.text}`} value={value} />
        {live && (
          <motion.span
            animate={pulse ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.7 }}
            className="font-mono text-[9px] tracking-wider text-allow uppercase"
            transition={{ duration: 1, repeat: pulse ? Infinity : 0 }}
          >
            ● live
          </motion.span>
        )}
      </div>
      <p className="mt-1 mb-0 truncate text-[11px] text-faint">{sub}</p>
    </motion.div>
  );
}
