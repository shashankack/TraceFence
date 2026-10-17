"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import type { Decision } from "@/components/api/types";
import { useAudit, useEvidence } from "@/components/admin/hooks";
import { RoleGate } from "@/components/auth/RoleGate";
import { buildCases, type EvidenceCase } from "@/components/domain/cases";
import { docTitle } from "@/components/domain/catalog";
import {
  externalSends,
  forbiddenExecutions,
  hasExecutionResult,
} from "@/components/domain/evidence";
import { cn } from "@/components/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { roleLabelFor } from "@/components/shell/nav";
import { BentoTile } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { DecisionBadge } from "@/components/ui/decision-badge";
import { BlurFade } from "@/components/ui/motion/blur-fade";
import { CountUp } from "@/components/ui/motion/count-up";
import { Stagger, StaggerItem } from "@/components/ui/motion/stagger";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { argsLine, formatTime } from "@/components/workspace/format";

type Filter = "all" | Decision;

const SESSION_PAGE_SIZE = 10;
const CASE_PAGE_SIZE = 5;

export default function AuditPage() {
  return (
    <RoleGate allow={["admin"]}>
      <Audit />
    </RoleGate>
  );
}

function Audit() {
  const audit = useAudit();
  const [sessionPage, setSessionPage] = useState(1);
  const [casePage, setCasePage] = useState(1);
  const evidence = useEvidence({ page: sessionPage, pageSize: SESSION_PAGE_SIZE });
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);

  const sessions = useMemo(() => evidence.data?.sessions ?? [], [evidence.data]);
  const rows = useMemo(
    () => sessions.flatMap((s) => s.events.map((e) => ({ ...e, role: s.role }))),
    [sessions],
  );
  const cases = useMemo(() => buildCases(sessions), [sessions]);

  const forbidden = forbiddenExecutions(rows);
  const external = externalSends(rows);
  const safe = forbidden === 0 && external === 0;
  const count = (d: Decision) =>
    audit.data?.sessionDecisions.find((x) => x.decision === d)?.count ?? 0;
  const total = Math.max(
    1,
    count("ALLOW") + count("DENY") + count("REQUIRE_APPROVAL"),
  );
  const consumed = rows.filter((e) => e.reasonCode === "APPROVAL_CONSUMED").length;

  const filtered = useMemo(
    () =>
      [...cases]
        .reverse()
        .filter((c) => filter === "all" || c.event.decision === filter),
    [cases, filter],
  );

  const caseTotalPages = Math.max(1, Math.ceil(filtered.length / CASE_PAGE_SIZE));
  const safeCasePage = Math.min(casePage, caseTotalPages);
  const visible = filtered.slice(
    (safeCasePage - 1) * CASE_PAGE_SIZE,
    safeCasePage * CASE_PAGE_SIZE,
  );

  const serverTotalPages = evidence.data?.totalPages ?? 1;
  const serverTotalSessions = evidence.data?.totalSessions ?? 0;

  useEffect(() => {
    setCasePage(1);
  }, [filter, sessionPage]);

  useEffect(() => {
    if (casePage > caseTotalPages) setCasePage(caseTotalPages);
  }, [casePage, caseTotalPages]);

  const reportRef = `TF-AUD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;

  const exportJson = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            report: reportRef,
            exportedAt: new Date().toISOString(),
            aggregate: audit.data,
            page: sessionPage,
            cases,
          },
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
    <main className="p-4 sm:p-6">
      <BlurFade>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="kicker m-0">{reportRef} · NullTrace Institute</p>
            <h2 className="mt-1 mb-0 text-xl font-semibold tracking-[-0.01em]">
              Gateway investigation report
            </h2>
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
      </BlurFade>

      <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12" delay={0.06}>
        <StaggerItem className="md:col-span-6 xl:col-span-7">
        <div
          className={cn(
            "flex h-full flex-col gap-4 rounded-xl border p-6",
            safe
              ? "border-allow/25 bg-gradient-to-br from-allow-soft via-white to-white"
              : "border-deny/30 bg-deny-soft",
          )}
        >
          <div className="flex items-center gap-3">
            <motion.span
              className={cn(
                "grid size-10 place-items-center rounded-xl text-white",
                safe ? "bg-allow" : "bg-deny",
              )}
              animate={safe ? { scale: [1, 1.05, 1] } : { rotate: [0, -3, 3, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <ShieldCheck className="size-5" />
            </motion.span>
            <div>
              <p className="kicker m-0">Verdict</p>
              <p
                className={cn(
                  "m-0 text-lg font-semibold",
                  safe ? "text-allow" : "text-deny",
                )}
              >
                {safe
                  ? "Safe  no forbidden action was executed"
                  : "Review required  a forbidden run or external send was recorded"}
              </p>
            </div>
          </div>
          <p className="m-0 max-w-[560px] text-sm leading-relaxed text-muted-foreground">
            {count("DENY")} denied calls across the tenant were stopped before execution.
            Of {rows.length} events on this session page, none show a denied call with an
            execution result
            {external === 0 ? ", and no email left the institution" : ""}.
          </p>
          <dl className="m-0 mt-auto grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
            {[
              {
                k: "Forbidden runs",
                v: forbidden,
                tone: forbidden ? "text-deny" : "text-allow",
              },
              {
                k: "External emails",
                v: external,
                tone: external ? "text-deny" : "text-allow",
              },
              { k: "Calls blocked", v: count("DENY"), tone: "text-foreground" },
              { k: "Approvals used", v: consumed, tone: "text-foreground" },
            ].map((m) => (
              <div className="bg-white px-4 py-3" key={m.k}>
                <dd
                  className={cn(
                    "m-0 font-mono text-2xl font-semibold tabular-nums",
                    m.tone,
                  )}
                >
                  <CountUp value={m.v} />
                </dd>
                <dt className="kicker mt-1">{m.k}</dt>
              </div>
            ))}
          </dl>
        </div>
        </StaggerItem>

        <StaggerItem className="md:col-span-6 xl:col-span-5">
        <BentoTile
          className="h-full"
          icon={ScrollText}
          kicker={`${audit.data?.sessions ?? "–"} sessions · tenant aggregate`}
          title="Decision summary"
        >
          <div className="grid gap-3 px-5 py-4">
            {(
              [
                ["ALLOW", "Allowed", "bg-allow"],
                ["DENY", "Blocked", "bg-deny"],
                ["REQUIRE_APPROVAL", "Held for approval", "bg-approval"],
              ] as const
            ).map(([d, label, bar], i) => (
              <div
                className="grid grid-cols-[140px_1fr_90px] items-center gap-3 text-sm"
                key={d}
              >
                <span className="text-muted-foreground">{label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={cn("h-full origin-left rounded-full", bar)}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: 0.7,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.15 + i * 0.08,
                    }}
                    style={{ width: `${(count(d) / total) * 100}%` }}
                  />
                </div>
                <span className="text-right font-mono tabular-nums">
                  <CountUp value={count(d)} />{" "}
                  <span className="text-muted-foreground">
                    · {Math.round((count(d) / total) * 100)}%
                  </span>
                </span>
              </div>
            ))}
            <p className="m-0 text-xs text-muted-foreground">{audit.data?.note}</p>
          </div>
        </BentoTile>
        </StaggerItem>

        <StaggerItem className="md:col-span-6 xl:col-span-12">
        <BentoTile
          action={
            <Tabs
              onValueChange={(v) => setFilter(v as Filter)}
              value={filter}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="DENY">Blocked</TabsTrigger>
                <TabsTrigger value="REQUIRE_APPROVAL">Approval</TabsTrigger>
                <TabsTrigger value="ALLOW">Allowed</TabsTrigger>
              </TabsList>
            </Tabs>
          }
          icon={ScrollText}
          kicker={`${filtered.length} cases on this batch · ${serverTotalSessions} sessions total`}
          title="Evidence"
        >
          {evidence.loading && sessions.length === 0 ? (
            <p className="m-0 px-5 py-8 text-center text-sm text-muted-foreground">
              Loading evidence…
            </p>
          ) : visible.length === 0 ? (
            <p className="m-0 px-5 py-8 text-center text-sm text-muted-foreground">
              {cases.length === 0
                ? "No evidence yet. Run student/faculty scenarios anywhere in this tenant, then refresh."
                : "No cases match this filter on this session page."}
            </p>
          ) : (
            <ul className="m-0 list-none divide-y p-0">
              {visible.map((c, i) => (
                <CaseRow
                  key={c.event.id}
                  c={c}
                  index={i}
                  onToggle={() =>
                    setOpen(open === c.event.id ? null : c.event.id)
                  }
                  open={open === c.event.id}
                />
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Pager
              label="Sessions"
              onNext={() =>
                setSessionPage((p) => Math.min(serverTotalPages, p + 1))
              }
              onPrev={() => setSessionPage((p) => Math.max(1, p - 1))}
              page={sessionPage}
              totalPages={serverTotalPages}
            />
            <Pager
              label="Cases"
              onNext={() =>
                setCasePage((p) => Math.min(caseTotalPages, p + 1))
              }
              onPrev={() => setCasePage((p) => Math.max(1, p - 1))}
              page={safeCasePage}
              totalPages={caseTotalPages}
            />
          </div>
        </BentoTile>
        </StaggerItem>
      </Stagger>
    </main>
  );
}

function Pager({
  label,
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  label: string;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Button
        aria-label={`Previous ${label.toLowerCase()} page`}
        disabled={page <= 1}
        onClick={onPrev}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[4.5rem] text-center font-mono text-xs tabular-nums">
        {page} / {totalPages}
      </span>
      <Button
        aria-label={`Next ${label.toLowerCase()} page`}
        disabled={page >= totalPages}
        onClick={onNext}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

function CaseRow({
  c,
  open,
  onToggle,
  index = 0,
}: {
  c: EvidenceCase;
  open: boolean;
  onToggle: () => void;
  index?: number;
}) {
  const { user } = useAuth();
  const e = c.event;
  const d = (e.decision ?? "ALLOW") as Decision;
  const blocked = d === "DENY";
  const outcome = blocked
    ? "Not executed"
    : d === "REQUIRE_APPROVAL"
      ? "Paused for approval"
      : e.tool === "search_docs" ||
          hasExecutionResult(e) ||
          e.reasonCode === "APPROVAL_CONSUMED"
        ? "Executed"
        : "Recorded";
  const stages = [
    {
      label: "Source",
      main: (
        <>
          {c.inContext.length} in context
          {c.fenced.length > 0 && (
            <span className="text-violet"> · {c.fenced.length} fenced</span>
          )}
        </>
      ),
      sub: c.inContext.length
        ? c.inContext.map(docTitle).join(", ")
        : "operator input only",
    },
    {
      label: "Proposal",
      main: <code className="font-mono">{e.tool}</code>,
      sub: argsLine(e.argsPreview),
    },
    {
      label: "Decision",
      main: <DecisionBadge decision={d} />,
      sub: e.reasonCode ?? "",
    },
    {
      label: "Outcome",
      main: (
        <span
          className={cn(
            blocked
              ? "font-medium text-deny"
              : d === "REQUIRE_APPROVAL"
                ? "text-approval"
                : "",
          )}
        >
          {outcome}
        </span>
      ),
      sub: e.outcome ?? "—",
    },
  ];

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 30,
        delay: Math.min(index, 6) * 0.04,
      }}
    >
      <button
        aria-expanded={open}
        className="block w-full px-5 py-4 text-left transition-colors hover:bg-muted/40"
        onClick={onToggle}
        type="button"
      >
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 font-mono font-semibold",
              blocked
                ? "bg-deny-soft text-deny"
                : "bg-accent text-accent-foreground",
            )}
          >
            {c.ref}
          </span>
          <span className="font-mono text-muted-foreground">
            {formatTime(e.ts)}
          </span>
          <span>{roleLabelFor(c.role, user?.orgType)}</span>
          <span className="font-mono text-muted-foreground">{c.sessionId}</span>
          <ChevronDown
            className={cn(
              "ml-auto size-4 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-start sm:gap-2">
          {stages.map((s, i) => (
            <Fragment key={s.label}>
              <div className="min-w-0 rounded-lg border bg-white px-3 py-2.5">
                <p className="kicker m-0">{s.label}</p>
                <div className="mt-1 text-sm">{s.main}</div>
                <p
                  className="mt-0.5 mb-0 truncate font-mono text-[11px] text-muted-foreground"
                  title={s.sub}
                >
                  {s.sub}
                </p>
              </div>
              {i < stages.length - 1 && (
                <span className="hidden h-px w-4 self-center bg-gradient-to-r from-primary/40 to-violet/40 sm:block" />
              )}
            </Fragment>
          ))}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.pre
            className="mx-5 mt-0 mb-4 overflow-x-auto rounded-lg border bg-muted/50 px-4 py-3 font-mono text-[11.5px] leading-relaxed text-muted-foreground"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {JSON.stringify(e, null, 2)}
          </motion.pre>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
