"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/components/api/client";
import type { AuditDTO } from "@/components/api/types";
import { ROLE_LABEL } from "@/components/console/catalog";
import { argsLine, formatTime } from "@/components/console/DecisionRail";
import { useAppState } from "@/components/shell/AppState";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { DecisionChip } from "@/components/ui/DecisionChip";
import { Icon } from "@/components/ui/Icon";

export function AuditView() {
  const { mode, events, session, archive } = useAppState();
  const [audit, setAudit] = useState<AuditDTO | null>(null);
  const [status, setStatus] = useState<"loading" | "live" | "offline">("loading");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setRefreshing(true);
    api
      .audit()
      .then((a) => {
        setAudit(a);
        setStatus("live");
      })
      .catch(() => setStatus("offline"))
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    if (mode !== "live") return;
    let alive = true;
    api
      .audit()
      .then((a) => {
        if (!alive) return;
        setAudit(a);
        setStatus("live");
      })
      .catch(() => alive && setStatus("offline"));
    return () => {
      alive = false;
    };
  }, [mode]);

  const useLocal = mode !== "live" || status === "offline";
  const rows = [...(session ? [{ session, events }] : []), ...archive]
    .flatMap(({ session: s, events: evs }) => evs.map((e) => ({ ...e, role: s.role })))
    .sort((a, b) => (b.ts ?? "").localeCompare(a.ts ?? ""));
  const sessionCount = archive.length + (session ? 1 : 0);
  const decisions = rows.filter((e) => e.reasonCode !== "RETRIEVAL_FILTERED");
  const count = (d: string) =>
    useLocal
      ? decisions.filter((e) => e.decision === d).length
      : (audit?.sessionDecisions.find((x) => x.decision === d)?.count ?? 0);

  const kpis = [
    { label: "Allowed", value: count("ALLOW"), dot: "bg-allow" },
    { label: "Denied", value: count("DENY"), dot: "bg-deny" },
    {
      label: "Pending approvals",
      value: useLocal ? decisions.filter((e) => e.decision === "REQUIRE_APPROVAL").length : (audit?.pendingApprovals ?? 0),
      dot: "bg-[#d5831c]",
    },
    { label: "Sessions", value: useLocal ? sessionCount : (audit?.sessions ?? 0), dot: "bg-teal" },
  ];

  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), source: useLocal ? "replay" : "live", audit, decisions: rows }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tracefence-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-[1366px] px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="block text-[10px] font-extrabold uppercase tracking-[.75px] text-teal">Gateway evidence</span>
          <h1 className="mt-0.5 font-display text-[28px] font-bold tracking-tight">Audit report</h1>
          <p className="mt-1 text-sm text-muted">Source and tool decisions across NullTrace Institute sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold ${useLocal ? "bg-approval-soft text-approval" : "bg-allow-soft text-allow"}`}
          >
            {useLocal ? "Replay session data" : "Live aggregate"}
          </span>
          {!useLocal && (
            <motion.button
              aria-label="Refresh"
              animate={{ rotate: refreshing ? 360 : 0 }}
              className="grid size-9 place-items-center rounded-lg border border-line-strong bg-white text-muted hover:text-ink"
              onClick={load}
              transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0 }}
              type="button"
            >
              <Icon name="refresh" size={15} />
            </motion.button>
          )}
          <motion.button
            className="flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-sm font-bold text-[#354448] hover:border-teal"
            onClick={exportJson}
            type="button"
            whileTap={{ scale: 0.96 }}
          >
            <Icon name="download" size={15} />
            Export JSON
          </motion.button>
        </div>
      </div>

      <motion.div
        animate="show"
        className="mt-5 grid h-[70px] grid-cols-4 rounded-[10px] border border-line bg-white"
        initial="hidden"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      >
        {kpis.map((k) => (
          <motion.div
            className="flex items-center gap-2 border-r border-line px-4 last:border-r-0"
            key={k.label}
            variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
          >
            <span className={`size-2 rounded-full ${k.dot}`} />
            <p className="m-0 flex flex-1 items-baseline gap-2 text-xs font-semibold text-muted">
              {k.label}
              <AnimatedNumber className="font-display text-2xl font-bold text-ink" value={k.value} />
            </p>
          </motion.div>
        ))}
      </motion.div>

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 overflow-hidden rounded-[11px] border border-line bg-white"
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex min-h-[66px] items-center justify-between border-b border-line px-4 py-3">
          <div>
            <h2 className="m-0 font-display text-base font-bold">Recent decisions</h2>
            <p className="mt-0.5 text-xs text-muted">Source → proposal → decision → outcome</p>
          </div>
          <span className="rounded-md border border-line px-2 py-1 font-mono text-[11px] text-muted">
            {sessionCount} session{sessionCount === 1 ? "" : "s"} from this console
          </span>
        </div>
        <div className="grid min-h-[36px] grid-cols-[.8fr_.6fr_.7fr_1fr_1.1fr_1.3fr_1.6fr] items-center gap-2.5 bg-[#f7f9f8] px-3.5 text-[10px] font-extrabold uppercase tracking-[.45px] text-faint">
          <span>Time</span>
          <span>Role</span>
          <span>Phase</span>
          <span>Tool</span>
          <span>Decision</span>
          <span>Reason code</span>
          <span>Args / outcome</span>
        </div>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-12 text-center text-sm text-faint">
            <Icon className="text-teal" name="spark" size={20} />
            No decisions in this session yet — run a demo path from the Console.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {rows.map((e, i) => (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="grid min-h-[56px] grid-cols-[.8fr_.6fr_.7fr_1fr_1.1fr_1.3fr_1.6fr] items-center gap-2.5 border-b border-[#eaf0ee] px-3.5 text-sm last:border-b-0"
                initial={{ opacity: 0, x: -8 }}
                key={e.id}
                transition={{ delay: Math.min(i, 10) * 0.03 }}
              >
                <code className="font-mono text-[11px]">{formatTime(e.ts)}</code>
                <span className="text-xs font-semibold">{ROLE_LABEL[e.role]}</span>
                <span className="font-mono text-[11px] text-faint">{e.phase}</span>
                <code className="font-mono text-xs">{e.tool ?? "—"}</code>
                <span>
                  {e.reasonCode === "RETRIEVAL_FILTERED" ? (
                    <span className="rounded-full bg-deny-soft px-2 py-1 font-mono text-[10px] font-bold text-deny">FILTERED</span>
                  ) : (
                    e.decision && <DecisionChip decision={e.decision} />
                  )}
                </span>
                <code className="font-mono text-[11px] text-muted">{e.reasonCode}</code>
                <span className="min-w-0">
                  <code className="block truncate font-mono text-[11px] text-[#586568]" title={argsLine(e.argsPreview)}>
                    {argsLine(e.argsPreview)}
                  </code>
                  {e.outcome && (
                    <span className={`block truncate text-[11px] ${e.decision === "DENY" ? "font-bold text-deny" : "text-faint"}`}>
                      {e.outcome}
                    </span>
                  )}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.section>

      {audit?.note && !useLocal && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
          <Icon className="text-teal" name="shield" size={13} />
          {audit.note}
        </p>
      )}
    </main>
  );
}
