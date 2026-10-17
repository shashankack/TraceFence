"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/components/api/client";
import type { AuditDTO, Decision, EventDTO, Role } from "@/components/api/types";
import { ROLE_LABEL } from "@/components/console/catalog";
import { argsLine, formatTime } from "@/components/console/DecisionRail";
import { useAppState } from "@/components/shell/AppState";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { DecisionChip } from "@/components/ui/DecisionChip";
import { Icon, toolIcon, type IconName } from "@/components/ui/Icon";

type Row = EventDTO & { role: Role };
type Filter = "all" | "DENY" | "REQUIRE_APPROVAL" | "ALLOW";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "DENY", label: "Blocked" },
  { id: "REQUIRE_APPROVAL", label: "Approval" },
  { id: "ALLOW", label: "Allowed" },
];

/** An executor result is stored as JSON in `outcome`; a DENY row carrying one would mean a forbidden action ran. */
const executed = (e: EventDTO) => typeof e.outcome === "string" && e.outcome.trim().startsWith("{");

export function AuditView() {
  const { mode, events, session, archive } = useAppState();
  const [audit, setAudit] = useState<AuditDTO | null>(null);
  const [status, setStatus] = useState<"loading" | "live" | "offline">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);

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
    const tick = () =>
      api
        .audit()
        .then((a) => {
          if (!alive) return;
          setAudit(a);
          setStatus("live");
        })
        .catch(() => alive && setStatus("offline"));
    tick();
    const t = setInterval(tick, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [mode]);

  const useLocal = mode !== "live" || status === "offline";
  const rows: Row[] = useMemo(
    () =>
      [...(session ? [{ session, events }] : []), ...archive]
        .flatMap(({ session: s, events: evs }) => evs.map((e) => ({ ...e, role: s.role })))
        .sort((a, b) => (b.ts ?? "").localeCompare(a.ts ?? "")),
    [session, events, archive],
  );
  const sessionCount = archive.length + (session ? 1 : 0);
  const decisions = rows.filter((e) => e.reasonCode !== "RETRIEVAL_FILTERED");
  const count = (d: Decision) =>
    useLocal ? decisions.filter((e) => e.decision === d).length : (audit?.sessionDecisions.find((x) => x.decision === d)?.count ?? 0);

  const allowed = count("ALLOW");
  const denied = count("DENY");
  const approvals = count("REQUIRE_APPROVAL");
  const pending = useLocal ? decisions.filter((e) => e.decision === "REQUIRE_APPROVAL").length : (audit?.pendingApprovals ?? 0);
  const forbiddenRan = decisions.filter((e) => e.decision === "DENY" && executed(e)).length;
  const externalSent = decisions.filter((e) => e.tool === "notify_external" && e.decision === "ALLOW").length;
  const exfilBlocked = decisions.filter(
    (e) => e.decision === "DENY" && ["export_records", "notify_external"].includes(e.tool ?? ""),
  ).length;
  const fenced = rows.filter((e) => e.reasonCode === "RETRIEVAL_FILTERED").length;
  const clean = forbiddenRan === 0;

  const visible = filter === "all" ? rows : rows.filter((e) => e.decision === filter && e.reasonCode !== "RETRIEVAL_FILTERED");

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
    <main className="mx-auto w-full max-w-[1440px] space-y-4 p-3 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow block">Gateway evidence · NullTrace Institute</span>
          <h2 className="mt-1 font-display text-[1.75rem] font-semibold tracking-tight text-ink">Audit report</h2>
          <p className="mt-1 mb-0 text-sm text-muted">Every source and tool decision, with reason codes and outcomes.</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider uppercase ${useLocal ? "border-approval/40 bg-approval-soft text-approval" : "border-allow/40 bg-allow-soft text-allow"}`}
          >
            {status === "loading" && !useLocal ? "Connecting…" : useLocal ? "Console evidence" : "● Live aggregate"}
          </span>
          {!useLocal && (
            <motion.button
              animate={{ rotate: refreshing ? 360 : 0 }}
              aria-label="Refresh"
              className="grid size-9 place-items-center rounded-lg border border-line text-muted hover:text-ink"
              onClick={load}
              transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0 }}
              type="button"
            >
              <Icon name="refresh" size={15} />
            </motion.button>
          )}
          <motion.button
            className="flex h-9 items-center gap-1.5 rounded-lg border border-neon/40 bg-neon-soft px-3 text-sm font-semibold text-neon hover:bg-neon/20"
            onClick={exportJson}
            type="button"
            whileTap={{ scale: 0.96 }}
          >
            <Icon name="download" size={15} />
            Export JSON
          </motion.button>
        </div>
      </div>

      {/* Verdict banner */}
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl border p-5 ${clean ? "glow-allow border-allow/45 bg-[linear-gradient(120deg,rgba(46,229,157,.16),rgba(46,229,157,.03)_60%)]" : "glow-deny border-deny/50 bg-deny-soft"}`}
        initial={{ opacity: 0, y: 10 }}
      >
        <motion.span
          animate={{ x: ["-30%", "130%"] }}
          className={`pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent ${clean ? "via-allow/10" : "via-deny/10"} to-transparent`}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className={`grid size-12 place-items-center rounded-2xl border ${clean ? "border-allow/50 bg-allow/15 text-allow" : "border-deny/50 bg-deny/15 text-deny"}`}>
            <Icon name={clean ? "shield" : "alert"} size={26} />
          </span>
          <div className="min-w-0 flex-1">
            <strong className={`block font-display text-xl font-semibold tracking-tight ${clean ? "text-allow" : "text-deny"}`}>
              {clean ? "No forbidden action executed" : `${forbiddenRan} denied action(s) show an execution result`}
            </strong>
            <p className="mt-0.5 mb-0 text-sm text-ink/75">
              {denied} DENY decision{denied === 1 ? "" : "s"} {useLocal ? "in captured evidence" : "across the tenant"} stopped at the gateway ·{" "}
              {forbiddenRan} executed in {rows.length} captured event{rows.length === 1 ? "" : "s"}.
            </p>
          </div>
          <div className="flex gap-6">
            <BannerStat label="External emails sent" tone={externalSent ? "deny" : "allow"} value={externalSent} />
            <BannerStat label="Exfiltration blocked" tone="deny" value={exfilBlocked} />
          </div>
        </div>
      </motion.section>

      {/* KPIs */}
      <motion.div
        animate="show"
        className="grid grid-cols-2 gap-2.5 md:grid-cols-4"
        initial="hidden"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      >
        <Kpi icon="check" label="Allowed" tone="allow" value={allowed} />
        <Kpi icon="lock" label="Blocked" tone="deny" value={denied} />
        <Kpi icon="clock" label="Pending approvals" tone="approval" value={pending} />
        <Kpi icon="activity" label="Sessions" tone="neon" value={useLocal ? sessionCount : (audit?.sessions ?? 0)} />
      </motion.div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <DecisionSummary allow={allowed} approval={approvals} deny={denied} fenced={fenced} />
        <VerificationCard />
      </div>

      {/* Evidence trail */}
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="glass overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <span className="eyebrow block">Evidence trail</span>
            <h3 className="mt-0.5 mb-0 font-display text-base font-semibold text-ink">Source → proposal → decision → outcome</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 rounded-lg border border-line bg-black/20 p-[3px]" role="tablist">
              {FILTERS.map((f) => (
                <button
                  aria-selected={filter === f.id}
                  className={`relative rounded-md px-2.5 py-1 text-xs font-semibold ${filter === f.id ? "text-ink" : "text-faint hover:text-muted"}`}
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  role="tab"
                  type="button"
                >
                  {filter === f.id && (
                    <motion.span className="absolute inset-0 rounded-md border border-line-strong bg-surface-raised" layoutId="audit-filter" />
                  )}
                  <span className="relative">{f.label}</span>
                </button>
              ))}
            </div>
            <span className="hidden font-mono text-[10px] text-faint sm:inline">
              {sessionCount} session{sessionCount === 1 ? "" : "s"} · this console
            </span>
          </div>
        </div>

        <div className="hidden grid-cols-[.8fr_.55fr_.6fr_1fr_1fr_1.2fr_1.6fr_24px] items-center gap-3 bg-black/20 px-4 py-2 font-mono text-[9.5px] font-semibold tracking-[.1em] text-faint uppercase md:grid">
          <span>Time</span>
          <span>Role</span>
          <span>Phase</span>
          <span>Tool</span>
          <span>Decision</span>
          <span>Reason code</span>
          <span>Args / outcome</span>
          <span />
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center text-sm text-faint">
            <Icon className="text-neon" name="activity" size={22} />
            {rows.length === 0 ? "No decisions captured yet — run a demo path from the Console." : "No events match this filter."}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visible.map((e, i) => (
              <EvidenceRow event={e} index={i} key={e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} open={open === e.id} />
            ))}
          </AnimatePresence>
        )}
      </motion.section>

      {audit?.note && !useLocal && (
        <p className="m-0 flex items-center gap-1.5 text-xs text-faint">
          <Icon className="text-neon" name="shield" size={13} />
          {audit.note}
        </p>
      )}
    </main>
  );
}

function BannerStat({ label, value, tone }: { label: string; value: number; tone: "allow" | "deny" }) {
  return (
    <div className="text-right">
      <AnimatedNumber className={`font-display text-3xl font-semibold ${tone === "allow" ? "text-allow" : "text-deny"}`} value={value} />
      <span className="block font-mono text-[9.5px] tracking-[.1em] text-muted uppercase">{label}</span>
    </div>
  );
}

const TONE = {
  allow: "text-allow bg-allow-soft",
  deny: "text-deny bg-deny-soft",
  approval: "text-approval bg-approval-soft",
  neon: "text-neon bg-neon-soft",
};

function Kpi({ label, value, tone, icon }: { label: string; value: number; tone: keyof typeof TONE; icon: IconName }) {
  return (
    <motion.div className="glass rounded-xl px-4 py-3.5" variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-muted uppercase">{label}</span>
        <span className={`grid size-7 place-items-center rounded-lg ${TONE[tone]}`}>
          <Icon name={icon} size={14} />
        </span>
      </div>
      <AnimatedNumber className={`mt-1 block font-display text-[2rem] leading-none font-semibold ${TONE[tone].split(" ")[0]}`} value={value} />
    </motion.div>
  );
}

function DecisionSummary({ allow, deny, approval, fenced }: { allow: number; deny: number; approval: number; fenced: number }) {
  const total = Math.max(1, allow + deny + approval);
  const parts = [
    { label: "Allowed", value: allow, bar: "bg-allow", text: "text-allow" },
    { label: "Blocked", value: deny, bar: "bg-deny", text: "text-deny" },
    { label: "Needs approval", value: approval, bar: "bg-approval", text: "text-approval" },
  ];
  return (
    <section className="glass rounded-2xl p-4">
      <span className="eyebrow block">Decision summary</span>
      <h3 className="mt-0.5 mb-3 font-display text-base font-semibold text-ink">How the gateway ruled</h3>
      <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
        {parts.map((p) => (
          <motion.span
            animate={{ width: `${(p.value / total) * 100}%` }}
            className={`${p.bar} h-full`}
            initial={{ width: 0 }}
            key={p.label}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
      <ul className="mt-3 mb-0 grid grid-cols-2 gap-2 p-0 sm:grid-cols-4">
        {parts.map((p) => (
          <li className="list-none rounded-lg border border-line bg-black/20 px-3 py-2" key={p.label}>
            <span className={`block font-display text-lg font-semibold ${p.text}`}>{Math.round((p.value / total) * 100)}%</span>
            <span className="text-[11px] text-muted">
              {p.label} · {p.value}
            </span>
          </li>
        ))}
        <li className="list-none rounded-lg border border-line bg-black/20 px-3 py-2">
          <span className="block font-display text-lg font-semibold text-neon">{fenced}</span>
          <span className="text-[11px] text-muted">ACL fence events</span>
        </li>
      </ul>
    </section>
  );
}

/**
 * The gateway API does not report test results yet, so this card shows how to produce them
 * instead of displaying a number it cannot verify.
 */
function VerificationCard() {
  return (
    <section className="glass flex flex-col rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow block">Verification suite</span>
          <h3 className="mt-0.5 mb-0 font-display text-base font-semibold text-ink">Killer-demo smoke tests</h3>
        </div>
        <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] tracking-wider text-faint uppercase">Not reported by API</span>
      </div>
      <p className="mt-3 mb-2 text-xs leading-relaxed text-muted">
        Curfew ALLOW, student export DENY, faculty REQUIRE_APPROVAL → approve once → CONSUMED, replay rejected. Run against the same gateway:
      </p>
      <code className="mt-auto block rounded-lg border border-line bg-black/40 px-3 py-2 font-mono text-[11.5px] text-neon">npx tsx scripts/smoke-demos.ts</code>
    </section>
  );
}

function EvidenceRow({ event: e, index, open, onToggle }: { event: Row; index: number; open: boolean; onToggle: () => void }) {
  const filtered = e.reasonCode === "RETRIEVAL_FILTERED";
  const blocked = e.decision === "DENY" && !filtered;
  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className={`border-b border-line last:border-b-0 ${blocked ? "bg-deny-soft/40" : ""}`}
      initial={{ opacity: 0, x: -8 }}
      layout="position"
      transition={{ delay: Math.min(index, 10) * 0.025 }}
    >
      <button
        aria-expanded={open}
        className="grid w-full grid-cols-2 items-center gap-x-3 gap-y-1.5 px-4 py-3 text-left text-sm hover:bg-white/[.02] md:grid-cols-[.8fr_.55fr_.6fr_1fr_1fr_1.2fr_1.6fr_24px]"
        onClick={onToggle}
        type="button"
      >
        <code className="font-mono text-[11px] text-muted">{formatTime(e.ts)}</code>
        <span className="text-right text-xs font-semibold text-ink md:text-left">{ROLE_LABEL[e.role]}</span>
        <span className="font-mono text-[10px] tracking-wider text-faint">{e.phase}</span>
        <code className="flex items-center gap-1.5 font-mono text-xs text-ink">
          <Icon className="text-faint" name={toolIcon(e.tool)} size={12} />
          {e.tool ?? "—"}
        </code>
        <span>
          {filtered ? (
            <span className="rounded-md border border-neon/35 bg-neon-soft px-2 py-[3px] font-mono text-[10px] font-bold text-neon">FENCED</span>
          ) : (
            e.decision && <DecisionChip decision={e.decision} glow={blocked} />
          )}
        </span>
        <code className={`font-mono text-[11px] ${blocked ? "font-semibold text-deny" : "text-muted"}`}>{e.reasonCode}</code>
        <span className="col-span-2 min-w-0 md:col-span-1">
          <code className="block truncate font-mono text-[11px] text-muted" title={argsLine(e.argsPreview)}>
            {argsLine(e.argsPreview)}
          </code>
          {e.outcome && <span className={`block truncate text-[11px] ${blocked ? "text-deny/90" : "text-faint"}`}>{e.outcome}</span>}
        </span>
        <motion.span animate={{ rotate: open ? 90 : 0 }} className="hidden text-faint md:block">
          <Icon name="chevron" size={14} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div animate={{ height: "auto", opacity: 1 }} className="overflow-hidden" exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }}>
            <pre className="mx-4 mb-3 overflow-x-auto rounded-lg border border-line bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-muted">
              {JSON.stringify(e, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
