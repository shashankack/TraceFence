"use client";

import { ChevronDown, CircleCheck, CircleDashed, CircleX, Download, ListChecks, RefreshCw, ScrollText, ShieldCheck } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import type { Decision } from "@/components/api/types";
import { useAudit, useEvidence } from "@/components/admin/hooks";
import { RoleGate } from "@/components/auth/RoleGate";
import { buildCases, type EvidenceCase } from "@/components/domain/cases";
import { docTitle } from "@/components/domain/catalog";
import { evidenceChecks, externalSends, forbiddenExecutions, hasExecutionResult } from "@/components/domain/evidence";
import { cn } from "@/components/lib/utils";
import { ROLE_LABEL } from "@/components/shell/nav";
import { BentoGrid, BentoTile } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { DecisionBadge } from "@/components/ui/decision-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { argsLine, formatTime } from "@/components/workspace/format";

type Filter = "all" | Decision;

export default function AuditPage() {
  return (
    <RoleGate allow={["admin"]}>
      <Audit />
    </RoleGate>
  );
}

function Audit() {
  const audit = useAudit();
  const evidence = useEvidence();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);

  const sessions = useMemo(() => evidence.data ?? [], [evidence.data]);
  const rows = useMemo(() => sessions.flatMap((s) => s.events.map((e) => ({ ...e, role: s.role }))), [sessions]);
  const cases = useMemo(() => buildCases(sessions), [sessions]);
  const refOf = useMemo(() => new Map(cases.map((c) => [c.event.id, c.ref])), [cases]);
  const checks = useMemo(() => evidenceChecks(rows, (e) => refOf.get(e.id) ?? "trace"), [rows, refOf]);

  const forbidden = forbiddenExecutions(rows);
  const external = externalSends(rows);
  const passed = checks.filter((c) => c.status === "pass").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const safe = forbidden === 0 && external === 0 && failed === 0;
  const count = (d: Decision) => audit.data?.sessionDecisions.find((x) => x.decision === d)?.count ?? 0;
  const total = Math.max(1, count("ALLOW") + count("DENY") + count("REQUIRE_APPROVAL"));
  const consumed = rows.filter((e) => e.reasonCode === "APPROVAL_CONSUMED").length;
  const visible = [...cases].reverse().filter((c) => filter === "all" || c.event.decision === filter);
  const reportRef = `TF-AUD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ report: reportRef, exportedAt: new Date().toISOString(), aggregate: audit.data, checks, cases }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportRef.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker m-0">{reportRef} · NullTrace Institute</p>
          <h2 className="mt-1 mb-0 text-xl font-semibold tracking-[-0.01em]">Gateway investigation report</h2>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              audit.reload();
              evidence.reload();
            }}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
          <Button onClick={exportJson} size="sm" variant="outline">
            <Download className="size-3.5" /> Export JSON
          </Button>
        </div>
      </div>

      <BentoGrid>
        {/* Verdict */}
        <section
          className={cn(
            "flex flex-col gap-4 rounded-xl border p-6 md:col-span-6 xl:col-span-7",
            safe ? "border-allow/25 bg-gradient-to-br from-allow-soft via-white to-white" : "border-deny/30 bg-deny-soft",
          )}
        >
          <div className="flex items-center gap-3">
            <span className={cn("grid size-10 place-items-center rounded-xl text-white", safe ? "bg-allow" : "bg-deny")}>
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="kicker m-0">Verdict</p>
              <p className={cn("m-0 text-lg font-semibold", safe ? "text-allow" : "text-deny")}>
                {safe ? "Safe — no forbidden action was executed" : "Review required — a check failed"}
              </p>
            </div>
          </div>
          <p className="m-0 max-w-[560px] text-sm leading-relaxed text-muted-foreground">
            {count("DENY")} denied calls across the tenant were stopped before execution. None of the {rows.length} events captured from this
            browser&apos;s sessions shows a denied call with an execution result, and no email left the institution.
          </p>
          <dl className="m-0 mt-auto grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
            {[
              { k: "Forbidden runs", v: forbidden, tone: forbidden ? "text-deny" : "text-allow" },
              { k: "External emails", v: external, tone: external ? "text-deny" : "text-allow" },
              { k: "Calls blocked", v: count("DENY"), tone: "text-foreground" },
              { k: "Approvals used", v: consumed, tone: "text-foreground" },
            ].map((m) => (
              <div className="bg-white px-4 py-3" key={m.k}>
                <dd className={cn("m-0 font-mono text-2xl font-semibold tabular-nums", m.tone)}>{m.v}</dd>
                <dt className="kicker mt-1">{m.k}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* Checks */}
        <BentoTile
          action={
            <span className={cn("rounded-full px-2.5 py-1 font-mono text-xs font-semibold", failed ? "bg-deny-soft text-deny" : passed === checks.length ? "bg-allow-soft text-allow" : "bg-muted text-muted-foreground")}>
              {passed}/{checks.length} passed
            </span>
          }
          className="md:col-span-6 xl:col-span-5 xl:row-span-2"
          icon={ListChecks}
          kicker="computed from live gateway responses"
          title="Evidence checks"
        >
          {evidence.loading ? (
            <Skeleton className="m-5 h-64" />
          ) : (
            <ol className="m-0 list-none divide-y p-0">
              {checks.map((c) => (
                <li className="flex items-start gap-3 px-5 py-2.5" key={c.id}>
                  {c.status === "pass" ? (
                    <CircleCheck className="mt-0.5 size-4 flex-none text-allow" />
                  ) : c.status === "fail" ? (
                    <CircleX className="mt-0.5 size-4 flex-none text-deny" />
                  ) : (
                    <CircleDashed className="mt-0.5 size-4 flex-none text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={cn("m-0 text-sm", c.status === "pending" ? "text-muted-foreground" : "font-medium")}>{c.title}</p>
                    <p className="m-0 text-xs text-muted-foreground">{c.status === "pending" ? "Not yet exercised — run the matching scenario" : c.detail}</p>
                  </div>
                  <span className="font-mono text-[10.5px] text-muted-foreground">{c.refs.join(" ") || c.id}</span>
                </li>
              ))}
            </ol>
          )}
        </BentoTile>

        {/* Decision summary */}
        <BentoTile className="md:col-span-6 xl:col-span-7" icon={ScrollText} kicker={`${audit.data?.sessions ?? "–"} sessions · tenant aggregate`} title="Decision summary">
          <div className="grid gap-3 px-5 py-4">
            {(
              [
                ["ALLOW", "Allowed", "bg-allow"],
                ["DENY", "Blocked", "bg-deny"],
                ["REQUIRE_APPROVAL", "Held for approval", "bg-approval"],
              ] as const
            ).map(([d, label, bar]) => (
              <div className="grid grid-cols-[140px_1fr_90px] items-center gap-3 text-sm" key={d}>
                <span className="text-muted-foreground">{label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", bar)} style={{ width: `${(count(d) / total) * 100}%` }} />
                </div>
                <span className="text-right font-mono tabular-nums">
                  {count(d)} <span className="text-muted-foreground">· {Math.round((count(d) / total) * 100)}%</span>
                </span>
              </div>
            ))}
            <p className="m-0 text-xs text-muted-foreground">{audit.data?.note}</p>
          </div>
        </BentoTile>

        {/* Evidence */}
        <BentoTile
          action={
            <Tabs onValueChange={(v) => setFilter(v as Filter)} value={filter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="DENY">Blocked</TabsTrigger>
                <TabsTrigger value="REQUIRE_APPROVAL">Approval</TabsTrigger>
                <TabsTrigger value="ALLOW">Allowed</TabsTrigger>
              </TabsList>
            </Tabs>
          }
          className="md:col-span-6 xl:col-span-12"
          icon={ScrollText}
          kicker={`${cases.length} cases`}
          title="Evidence"
        >
          {visible.length === 0 ? (
            <p className="m-0 px-5 py-8 text-center text-sm text-muted-foreground">
              {cases.length === 0 ? "No evidence yet. Sign in as a student or faculty member and run a scenario." : "No cases match this filter."}
            </p>
          ) : (
            <ul className="m-0 list-none divide-y p-0">
              {visible.map((c) => (
                <CaseRow c={c} key={c.event.id} onToggle={() => setOpen(open === c.event.id ? null : c.event.id)} open={open === c.event.id} />
              ))}
            </ul>
          )}
        </BentoTile>
      </BentoGrid>
    </main>
  );
}

function CaseRow({ c, open, onToggle }: { c: EvidenceCase; open: boolean; onToggle: () => void }) {
  const e = c.event;
  const d = (e.decision ?? "ALLOW") as Decision;
  const blocked = d === "DENY";
  const outcome = blocked
    ? "Not executed"
    : d === "REQUIRE_APPROVAL"
      ? "Paused for approval"
      : e.tool === "search_docs" || hasExecutionResult(e) || e.reasonCode === "APPROVAL_CONSUMED"
        ? "Executed"
        : "Recorded";
  const stages = [
    {
      label: "Source",
      main: (
        <>
          {c.inContext.length} in context{c.fenced.length > 0 && <span className="text-violet"> · {c.fenced.length} fenced</span>}
        </>
      ),
      sub: c.inContext.length ? c.inContext.map(docTitle).join(", ") : "operator input only",
    },
    { label: "Proposal", main: <code className="font-mono">{e.tool}</code>, sub: argsLine(e.argsPreview) },
    { label: "Decision", main: <DecisionBadge decision={d} />, sub: e.reasonCode ?? "" },
    {
      label: "Outcome",
      main: <span className={cn(blocked ? "font-medium text-deny" : d === "REQUIRE_APPROVAL" ? "text-approval" : "")}>{outcome}</span>,
      sub: e.outcome ?? "—",
    },
  ];

  return (
    <li>
      <button aria-expanded={open} className="block w-full px-5 py-4 text-left transition-colors hover:bg-muted/40" onClick={onToggle} type="button">
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className={cn("rounded-md px-1.5 py-0.5 font-mono font-semibold", blocked ? "bg-deny-soft text-deny" : "bg-accent text-accent-foreground")}>{c.ref}</span>
          <span className="font-mono text-muted-foreground">{formatTime(e.ts)}</span>
          <span>{ROLE_LABEL[c.role]}</span>
          <span className="font-mono text-muted-foreground">{c.sessionId}</span>
          <ChevronDown className={cn("ml-auto size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-start sm:gap-2">
          {stages.map((s, i) => (
            <Fragment key={s.label}>
              <div className="min-w-0 rounded-lg border bg-white px-3 py-2.5">
                <p className="kicker m-0">{s.label}</p>
                <div className="mt-1 text-sm">{s.main}</div>
                <p className="mt-0.5 mb-0 truncate font-mono text-[11px] text-muted-foreground" title={s.sub}>
                  {s.sub}
                </p>
              </div>
              {i < stages.length - 1 && <span className="hidden h-px w-4 self-center bg-gradient-to-r from-primary/40 to-violet/40 sm:block" />}
            </Fragment>
          ))}
        </div>
      </button>
      {open && (
        <pre className="mx-5 mt-0 mb-4 overflow-x-auto rounded-lg border bg-muted/50 px-4 py-3 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
          {JSON.stringify(e, null, 2)}
        </pre>
      )}
    </li>
  );
}
