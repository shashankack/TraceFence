"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/components/api/client";
import type { AuditDTO, Decision, EventDTO, Role } from "@/components/api/types";
import { ROLE_LABEL, docTitle } from "@/components/console/catalog";
import { argsLine, formatTime } from "@/components/console/DecisionRail";
import { evidenceChecks, externalSends, forbiddenExecutions, hasExecutionResult, type EvidenceRow } from "@/components/console/evidence";
import { useAppState } from "@/components/shell/AppState";
import { DecisionChip } from "@/components/ui/DecisionChip";
import { Icon, toolIcon } from "@/components/ui/Icon";

type Filter = "all" | Decision;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "DENY", label: "Blocked" },
  { id: "REQUIRE_APPROVAL", label: "Approval" },
  { id: "ALLOW", label: "Allowed" },
];

interface Case {
  ref: string;
  event: EventDTO;
  role: Role;
  sessionId: string;
  inContext: string[];
  fenced: string[];
}

/** Walks each session in order and pairs every tool decision with the context the ACL built for it. */
function buildCases(sessions: Array<{ sessionId: string; role: Role; events: EventDTO[] }>) {
  const raw: Omit<Case, "ref">[] = [];
  for (const s of sessions) {
    let inContext: string[] = [];
    let fenced: string[] = [];
    for (const e of [...s.events].sort((a, b) => (a.ts ?? "").localeCompare(b.ts ?? ""))) {
      if (e.reasonCode === "RETRIEVAL_FILTERED") {
        fenced = Array.isArray(e.argsPreview?.filteredOut) ? (e.argsPreview.filteredOut as string[]) : [];
        continue;
      }
      if (e.tool === "search_docs") {
        inContext = e.docIds ?? [];
        fenced = [];
      }
      if (e.tool) raw.push({ event: e, role: s.role, sessionId: s.sessionId, inContext, fenced });
    }
  }
  raw.sort((a, b) => (a.event.ts ?? "").localeCompare(b.event.ts ?? ""));
  return raw.map((c, i) => ({ ...c, ref: `EV-${String(i + 1).padStart(3, "0")}` }));
}

export function AuditView() {
  const { mode, events, session, archive } = useAppState();
  const [audit, setAudit] = useState<AuditDTO | null>(null);
  const [status, setStatus] = useState<"loading" | "live" | "offline">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const load = useCallback(() => {
    setRefreshing(true);
    api
      .audit()
      .then((a) => {
        setAudit(a);
        setStatus("live");
        setGeneratedAt(new Date());
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
          setGeneratedAt(new Date());
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
  const sessions = useMemo(
    () => [...(session ? [{ session, events }] : []), ...archive].map(({ session: s, events: evs }) => ({ sessionId: s.sessionId, role: s.role, events: evs })),
    [session, events, archive],
  );
  const rows: EvidenceRow[] = useMemo(() => sessions.flatMap((s) => s.events.map((e) => ({ ...e, role: s.role }))), [sessions]);
  const cases = useMemo(() => buildCases(sessions), [sessions]);
  const refOf = useMemo(() => new Map(cases.map((c) => [c.event.id, c.ref])), [cases]);
  const checks = useMemo(() => evidenceChecks(rows, (e) => refOf.get(e.id) ?? "trace"), [rows, refOf]);

  const decisions = rows.filter((e) => e.reasonCode !== "RETRIEVAL_FILTERED");
  const count = (d: Decision) =>
    useLocal ? decisions.filter((e) => e.decision === d).length : (audit?.sessionDecisions.find((x) => x.decision === d)?.count ?? 0);
  const allowed = count("ALLOW");
  const denied = count("DENY");
  const approvals = count("REQUIRE_APPROVAL");
  const forbidden = forbiddenExecutions(rows);
  const external = externalSends(rows);
  const consumed = rows.filter((e) => e.reasonCode === "APPROVAL_CONSUMED").length;
  const passed = checks.filter((c) => c.status === "pass").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const safe = forbidden === 0 && external === 0 && failed === 0;

  const visible = [...cases].reverse().filter((c) => filter === "all" || c.event.decision === filter);
  const reportRef = generatedAt ? `TF-AUD-${generatedAt.toISOString().slice(0, 16).replace(/[-:T]/g, "")}` : "TF-AUD-…";

  const exportJson = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          { report: reportRef, exportedAt: new Date().toISOString(), source: useLocal ? "console" : "live", audit, checks, cases },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportRef.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-8">
      {/* Report header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="mono-label m-0">{reportRef}</p>
          <h1 className="mt-1 mb-0 text-[20px] font-semibold tracking-[-0.01em] text-ink">Gateway investigation report</h1>
          <p className="mt-1 mb-0 text-[13px] text-muted">
            NullTrace Institute · {useLocal ? "evidence captured in this console" : "live tenant aggregate + console evidence"}
            {generatedAt && <> · generated {generatedAt.toLocaleTimeString("en-GB", { hour12: false })}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!useLocal && (
            <button className="btn" disabled={refreshing} onClick={load} type="button">
              <Icon name="refresh" size={13} />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          )}
          <button className="btn" onClick={exportJson} type="button">
            <Icon name="download" size={13} />
            Export JSON
          </button>
        </div>
      </header>

      {/* Verdict */}
      <section className={`mt-5 grid gap-5 rounded-[6px] border bg-surface md:grid-cols-[1fr_auto] ${safe ? "border-allow/40" : "border-deny/45"}`}>
        <div className={`border-l-4 py-4 pr-2 pl-5 ${safe ? "border-l-allow" : "border-l-deny"}`}>
          <p className="label m-0">Verdict</p>
          <p className={`mt-1 mb-0 flex items-center gap-2 text-[17px] font-semibold ${safe ? "text-allow" : "text-deny"}`}>
            <Icon name={safe ? "shield" : "alert"} size={18} />
            {safe ? "Safe — no forbidden action was executed" : "Review required — a check failed"}
          </p>
          <p className="mt-1.5 mb-0 max-w-[560px] text-[13px] leading-relaxed text-muted">
            {denied} denied call{denied === 1 ? "" : "s"} {useLocal ? "were" : "across the tenant were"} stopped before execution. No denied
            row in {rows.length} captured event{rows.length === 1 ? "" : "s"} carries an execution result, and no email left the tenant.
          </p>
        </div>
        <dl className="m-0 grid grid-cols-2 border-t border-line md:grid-cols-4 md:border-t-0 md:border-l">
          <Figure label="Forbidden executions" strong tone={forbidden ? "text-deny" : "text-allow"} value={forbidden} />
          <Figure label="External emails sent" tone={external ? "text-deny" : "text-allow"} value={external} />
          <Figure label="Calls blocked" tone="text-ink" value={denied} />
          <Figure label="Approvals used" tone="text-ink" value={consumed} />
        </dl>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* Decision summary */}
        <section>
          <h2 className="m-0 border-b border-line pb-2 text-[13px] font-semibold text-ink">Decision summary</h2>
          <table className="mt-1 w-full border-collapse text-[12.5px]">
            <tbody>
              <SummaryRow bar="bg-allow" label="Allowed" total={allowed + denied + approvals} value={allowed} />
              <SummaryRow bar="bg-deny" label="Blocked" total={allowed + denied + approvals} value={denied} />
              <SummaryRow bar="bg-approval" label="Held for approval" total={allowed + denied + approvals} value={approvals} />
              <tr className="border-t border-line">
                <td className="py-2 text-muted">Sessions</td>
                <td className="py-2 text-right font-mono tabular-nums" colSpan={2}>
                  {useLocal ? sessions.length : (audit?.sessions ?? 0)}
                </td>
              </tr>
              <tr className="border-t border-line-soft">
                <td className="py-2 text-muted">Pending approvals</td>
                <td className="py-2 text-right font-mono tabular-nums" colSpan={2}>
                  {useLocal ? 0 : (audit?.pendingApprovals ?? 0)}
                </td>
              </tr>
            </tbody>
          </table>
          {audit?.note && !useLocal && <p className="mt-3 mb-0 text-[11.5px] text-faint">{audit.note}</p>}
        </section>

        {/* Evidence checks */}
        <section>
          <div className="flex items-baseline justify-between border-b border-line pb-2">
            <h2 className="m-0 text-[13px] font-semibold text-ink">Evidence checks</h2>
            <span className={`font-mono text-[12px] font-semibold ${failed ? "text-deny" : passed === checks.length ? "text-allow" : "text-muted"}`}>
              {passed}/{checks.length} passed
            </span>
          </div>
          <ol className="m-0 list-none p-0">
            {checks.map((c) => (
              <li className="grid grid-cols-[22px_34px_1fr_auto] items-baseline gap-x-2 border-b border-line-soft py-[7px] text-[12.5px]" key={c.id}>
                <span className={c.status === "pass" ? "text-allow" : c.status === "fail" ? "text-deny" : "text-faint"}>
                  <Icon name={c.status === "pass" ? "check" : c.status === "fail" ? "x" : "clock"} size={13} />
                </span>
                <span className="font-mono text-[10.5px] text-faint">{c.id}</span>
                <span className="min-w-0">
                  <span className={c.status === "pending" ? "text-muted" : "text-ink"}>{c.title}</span>
                  <span className="ml-2 text-[11.5px] text-faint">{c.status === "pending" ? "not yet exercised" : c.detail}</span>
                </span>
                <span className="font-mono text-[10.5px] text-faint">{c.refs.join(" ")}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 mb-0 text-[11.5px] text-faint">
            Evaluated on gateway responses captured in this console. Run each Console scenario to exercise all nine. Lib-level suite:{" "}
            <code className="font-mono">npx tsx scripts/smoke-demos.ts</code>
          </p>
        </section>
      </div>

      {/* Evidence */}
      <section className="mt-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
          <h2 className="m-0 text-[13px] font-semibold text-ink">
            Evidence <span className="ml-1 font-mono text-[11.5px] font-normal text-faint">{cases.length} cases</span>
          </h2>
          <div className="flex h-7 rounded-[4px] border border-line bg-surface p-[2px]" role="tablist">
            {FILTERS.map((f) => (
              <button
                aria-selected={filter === f.id}
                className={`rounded-[3px] px-2.5 text-[12px] ${filter === f.id ? "bg-surface-raised text-ink" : "text-faint hover:text-muted"}`}
                key={f.id}
                onClick={() => setFilter(f.id)}
                role="tab"
                type="button"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="m-0 py-8 text-center text-[13px] text-faint">
            {cases.length === 0 ? "No evidence yet. Run a scenario from the Console." : "No cases match this filter."}
          </p>
        ) : (
          <ol className="m-0 list-none p-0">
            {visible.map((c) => (
              <CaseRow c={c} key={c.event.id} onToggle={() => setOpen(open === c.event.id ? null : c.event.id)} open={open === c.event.id} />
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

function Figure({ label, value, tone, strong }: { label: string; value: number; tone: string; strong?: boolean }) {
  return (
    <div className={`flex flex-col justify-center border-line px-5 py-3 [&:not(:first-child)]:border-l ${strong ? "bg-allow-soft/60" : ""}`}>
      <dd className={`m-0 font-mono text-[22px] leading-none font-semibold tabular-nums ${tone}`}>{value}</dd>
      <dt className="mt-1.5 text-[11.5px] whitespace-nowrap text-muted">{label}</dt>
    </div>
  );
}

function SummaryRow({ label, value, total, bar }: { label: string; value: number; total: number; bar: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <tr className="border-b border-line-soft">
      <td className="w-[140px] py-2 text-muted">{label}</td>
      <td className="py-2">
        <div className="h-[6px] rounded-[1px] bg-line-soft">
          <div className={`h-full rounded-[1px] ${bar}`} style={{ width: `${pct}%` }} />
        </div>
      </td>
      <td className="w-[86px] py-2 text-right font-mono tabular-nums">
        {value} <span className="text-faint">· {pct}%</span>
      </td>
    </tr>
  );
}

function CaseRow({ c, open, onToggle }: { c: Case; open: boolean; onToggle: () => void }) {
  const e = c.event;
  const decision = (e.decision ?? "ALLOW") as Decision;
  const ran = decision === "ALLOW" && (e.tool === "search_docs" || hasExecutionResult(e) || e.reasonCode === "APPROVAL_CONSUMED");
  const blocked = decision === "DENY";
  return (
    <li className="border-b border-line">
      <button aria-expanded={open} className="block w-full py-3 text-left hover:bg-surface/70" onClick={onToggle} type="button">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11.5px]">
          <span className={`font-mono font-semibold ${blocked ? "text-deny" : "text-ink"}`}>{c.ref}</span>
          <span className="font-mono text-faint">{formatTime(e.ts)}</span>
          <span className="text-muted">{ROLE_LABEL[c.role]}</span>
          <span className="font-mono text-faint">{c.sessionId}</span>
          <Icon className={`ml-auto text-faint transition-transform ${open ? "rotate-90" : ""}`} name="chevron" size={13} />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-0">
          <Stage first label="Source">
            <span className="text-ink">{c.inContext.length} in context</span>
            {c.fenced.length > 0 && <span className="text-deny"> · {c.fenced.length} fenced</span>}
            <span className="mt-0.5 block truncate text-faint">
              {c.inContext.length ? c.inContext.map(docTitle).join(", ") : "operator input only"}
            </span>
          </Stage>
          <Stage label="Proposal">
            <span className="flex items-center gap-1.5 font-mono text-ink">
              <Icon className="text-faint" name={toolIcon(e.tool)} size={12} />
              {e.tool}
            </span>
            <span className="mt-0.5 block truncate font-mono text-[11px] text-faint" title={argsLine(e.argsPreview)}>
              {argsLine(e.argsPreview)}
            </span>
          </Stage>
          <Stage label="Decision">
            <DecisionChip decision={decision} />
            <span className={`mt-1 block font-mono text-[10.5px] ${blocked ? "text-deny" : "text-faint"}`}>{e.reasonCode}</span>
          </Stage>
          <Stage label="Outcome" last>
            <span className={blocked ? "font-medium text-deny" : decision === "REQUIRE_APPROVAL" ? "text-approval" : "text-ink"}>
              {blocked ? "Not executed" : decision === "REQUIRE_APPROVAL" ? "Paused for approval" : ran ? "Executed" : "Recorded"}
            </span>
            <span className="mt-0.5 block truncate text-faint" title={e.outcome ?? ""}>
              {e.outcome ?? "—"}
            </span>
          </Stage>
        </div>
      </button>
      {open && (
        <pre className="mx-1 mt-0 mb-3 overflow-x-auto rounded-[4px] border border-line bg-surface px-3 py-2 font-mono text-[11.5px] leading-relaxed text-muted">
          {JSON.stringify(e, null, 2)}
        </pre>
      )}
    </li>
  );
}

function Stage({ label, children, first, last }: { label: string; children: React.ReactNode; first?: boolean; last?: boolean }) {
  return (
    <div className={`relative min-w-0 border-line px-3 text-[12px] sm:border-l ${first ? "sm:border-l-0 sm:pl-1" : ""}`}>
      {!last && <span className="absolute top-[7px] -right-[5px] z-[1] hidden size-[9px] rotate-45 border-t border-r border-line-strong bg-canvas sm:block" />}
      <span className="mono-label block">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}
