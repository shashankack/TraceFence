"use client";

import { ArrowRight, Ban, CircleCheck, Clock3, Database, History, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CLASSIFICATIONS, ROLES, TOOLS, type ApprovalDTO, type Decision } from "@/components/api/types";
import { ApprovalSheet, ApprovalsQueue } from "@/components/admin/ApprovalReview";
import { useApprovals, useAudit, useDocuments, useEvidence, usePolicy } from "@/components/admin/hooks";
import { RoleGate } from "@/components/auth/RoleGate";
import { buildCases } from "@/components/domain/cases";
import { externalSends, forbiddenExecutions } from "@/components/domain/evidence";
import { cn } from "@/components/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { roleLabelFor } from "@/components/shell/nav";
import { BentoTile, StatTile } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { DecisionBadge } from "@/components/ui/decision-badge";
import { CountUp } from "@/components/ui/motion/count-up";
import { Stagger, StaggerItem } from "@/components/ui/motion/stagger";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/components/workspace/format";

const CELL: Record<Decision, string> = {
  ALLOW: "bg-allow-soft text-allow",
  DENY: "bg-deny-soft text-deny",
  REQUIRE_APPROVAL: "bg-approval-soft text-approval",
};
const SHORT: Record<Decision, string> = { ALLOW: "allow", DENY: "deny", REQUIRE_APPROVAL: "approve" };

export default function AdminOverview() {
  return (
    <RoleGate allow={["admin"]}>
      <Overview />
    </RoleGate>
  );
}

function Overview() {
  const { user } = useAuth();
  const audit = useAudit();
  const approvals = useApprovals();
  const policy = usePolicy();
  const docs = useDocuments();
  const evidence = useEvidence({ page: 1, pageSize: 20 });
  const [open, setOpen] = useState<ApprovalDTO | null>(null);
  const label = (r: (typeof ROLES)[number]) => roleLabelFor(r, user?.orgType);

  const sessions = useMemo(() => evidence.data?.sessions ?? [], [evidence.data]);
  const rows = useMemo(() => sessions.flatMap((s) => s.events.map((e) => ({ ...e, role: s.role }))), [sessions]);
  const cases = useMemo(() => buildCases(sessions), [sessions]);
  const forbidden = forbiddenExecutions(rows);
  const external = externalSends(rows);
  const safe = forbidden === 0 && external === 0;

  const count = (d: Decision) => audit.data?.sessionDecisions.find((x) => x.decision === d)?.count ?? 0;
  const pending = (approvals.data ?? []).filter((a) => a.status === "PENDING");

  return (
    <main className="p-4 sm:p-6">
      <Stagger
        className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12"
        delay={0.04}
      >
        {/* Verdict */}
        <StaggerItem className="md:col-span-6 xl:col-span-5">
        <motion.section
          className={cn(
            "flex h-full flex-col justify-between rounded-xl border p-5",
            safe ? "border-allow/25 bg-gradient-to-br from-allow-soft to-white" : "border-deny/30 bg-deny-soft",
          )}
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <div className="flex items-center gap-2">
            <motion.span
              className={cn("grid size-8 place-items-center rounded-lg", safe ? "bg-allow text-white" : "bg-deny text-white")}
              animate={safe ? { scale: [1, 1.06, 1] } : { rotate: [0, -4, 4, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <ShieldCheck className="size-4" />
            </motion.span>
            <span className="kicker">Tenant verdict</span>
          </div>
          <div className="mt-4">
            <p className={cn("m-0 text-xl font-semibold tracking-[-0.01em]", safe ? "text-allow" : "text-deny")}>
              {safe ? "No forbidden action executed" : "Review required"}
            </p>
            <p className="mt-1 mb-0 text-sm text-muted-foreground">
              {count("DENY")} denied calls stopped at the gateway. {external} external emails sent.
            </p>
          </div>
          <div className="mt-5 flex items-end justify-between">
            <div className="flex gap-6 font-mono">
              <div>
                <p className={cn("m-0 text-3xl font-semibold tabular-nums", forbidden ? "text-deny" : "text-allow")}>
                  <CountUp value={forbidden} />
                </p>
                <p className="kicker m-0 mt-1">forbidden runs</p>
              </div>
              <div>
                <p className="m-0 text-3xl font-semibold tabular-nums">
                  <CountUp value={cases.length} />
                </p>
                <p className="kicker m-0 mt-1">audit cases</p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/audit">
                Open report <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </motion.section>
        </StaggerItem>

        <StaggerItem className="grid grid-cols-2 gap-4 md:col-span-6 xl:col-span-7">
          <StatTile
            hint="across the tenant"
            icon={CircleCheck}
            label="Allowed"
            tone="allow"
            value={audit.data ? <CountUp value={count("ALLOW")} /> : "–"}
          />
          <StatTile
            hint="stopped before execution"
            icon={Ban}
            label="Blocked"
            tone="deny"
            value={audit.data ? <CountUp value={count("DENY")} /> : "–"}
          />
          <StatTile
            hint="waiting on you"
            icon={Clock3}
            label="Pending approvals"
            tone={pending.length ? "approval" : "default"}
            value={approvals.data ? <CountUp value={pending.length} /> : "–"}
          />
          <StatTile
            hint="gateway sessions opened"
            icon={Users}
            label="Sessions"
            tone="brand"
            value={audit.data ? <CountUp value={audit.data.sessions} /> : "–"}
          />
        </StaggerItem>

        {/* Approvals */}
        <StaggerItem className="md:col-span-6 xl:col-span-7">
        <BentoTile
          action={
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/approvals">
                View all <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          }
          className="h-full"
          icon={ShieldCheck}
          kicker={`${pending.length} pending`}
          title="Approval queue"
        >
          {approvals.loading ? <Skeleton className="m-5 h-24" /> : <ApprovalsQueue approvals={approvals.data ?? []} limit={5} onOpen={setOpen} />}
        </BentoTile>
        </StaggerItem>

        {/* Policy snapshot */}
        <StaggerItem className="md:col-span-6 xl:col-span-5">
        <BentoTile
          action={
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/policies">
                Edit <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          }
          className="h-full"
          icon={SlidersHorizontal}
          kicker={policy.data ? `policy v${policy.data.policyVersion}` : "policy"}
          title="Tool gateway"
        >
          {!policy.data ? (
            <Skeleton className="m-5 h-28" />
          ) : (
            <div className="overflow-x-auto px-5 py-4">
              <table className="w-full border-separate border-spacing-1 text-xs">
                <thead>
                  <tr>
                    <th className="text-left font-normal text-muted-foreground" />
                    {TOOLS.map((t) => (
                      <th className="px-1 text-left font-mono text-[10px] font-normal text-muted-foreground" key={t} title={t}>
                        {t.split("_")[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map((r) => (
                    <tr key={r}>
                      <td className="pr-2 text-sm font-medium">{label(r)}</td>
                      {TOOLS.map((t) => {
                        const d = (policy.data!.roles[r].tools[t] ?? "DENY") as Decision;
                        return (
                          <td key={t}>
                            <motion.span
                              className={cn("block rounded-md px-1.5 py-1 text-center font-mono text-[10px]", CELL[d])}
                              whileHover={{ scale: 1.08 }}
                              transition={{ type: "spring", stiffness: 500, damping: 24 }}
                            >
                              {SHORT[d]}
                            </motion.span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BentoTile>
        </StaggerItem>

        {/* Corpus */}
        <StaggerItem className="md:col-span-6 xl:col-span-4">
        <BentoTile
          className="h-full"
          icon={Database}
          kicker={docs.data ? `${docs.data.length} sources` : "sources"}
          title="Corpus"
        >
          {!docs.data ? (
            <Skeleton className="m-5 h-24" />
          ) : (
            <div className="flex flex-1 flex-col gap-3 px-5 py-4">
              <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                {CLASSIFICATIONS.map((c) => {
                  const n = docs.data!.filter((d) => d.classification === c).length;
                  return (
                    <motion.span
                      className={cn("h-full origin-left", c === "public" ? "bg-primary/40" : c === "internal" ? "bg-primary" : "bg-violet")}
                      key={c}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                      style={{ width: `${(n / Math.max(1, docs.data!.length)) * 100}%` }}
                    />
                  );
                })}
              </div>
              <ul className="m-0 grid list-none gap-1.5 p-0 text-sm">
                {CLASSIFICATIONS.map((c) => (
                  <li className="flex items-center gap-2" key={c}>
                    <span className={cn("size-2 rounded-full", c === "public" ? "bg-primary/40" : c === "internal" ? "bg-primary" : "bg-violet")} />
                    <span className="capitalize">{c}</span>
                    <span className="ml-auto font-mono text-muted-foreground">
                      <CountUp value={docs.data!.filter((d) => d.classification === c).length} />
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-auto mb-0 text-xs text-muted-foreground">{docs.data.filter((d) => !d.enabled).length} disabled · content cannot change its own classification</p>
            </div>
          )}
        </BentoTile>
        </StaggerItem>

        {/* Recent evidence */}
        <StaggerItem className="md:col-span-6 xl:col-span-8">
        <BentoTile
          action={
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/audit">
                Full evidence <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          }
          className="h-full"
          icon={History}
          kicker={`${cases.length} cases · tenant-wide`}
          title="Recent decisions"
        >
          {evidence.loading ? (
            <Skeleton className="m-5 h-24" />
          ) : cases.length === 0 ? (
            <p className="m-0 px-5 py-6 text-sm text-muted-foreground">
              Decisions appear here once students or faculty use the assistant in this tenant.
            </p>
          ) : (
            <ul className="m-0 list-none divide-y p-0">
              {[...cases]
                .reverse()
                .slice(0, 6)
                .map((c, i) => (
                  <motion.li
                    key={c.event.id}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm transition-colors hover:bg-muted/40"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      delay: 0.15 + i * 0.045,
                    }}
                    whileHover={{ backgroundColor: "color-mix(in oklab, var(--muted) 40%, transparent)" }}
                  >
                    <span className="w-14 font-mono text-[11px] text-muted-foreground">{c.ref}</span>
                    <span className="w-16 text-xs text-muted-foreground">
                      {roleLabelFor(c.role, user?.orgType)}
                    </span>
                    <code className="min-w-0 flex-1 truncate font-mono text-[13px]">{c.event.tool}</code>
                    <span className="hidden font-mono text-[10.5px] text-muted-foreground sm:inline">
                      {c.event.reasonCode}
                    </span>
                    {c.event.decision && <DecisionBadge decision={c.event.decision} />}
                    <span className="hidden w-[84px] text-right font-mono text-[11px] text-muted-foreground md:inline">
                      {formatTime(c.event.ts).slice(0, 8)}
                    </span>
                  </motion.li>
                ))}
            </ul>
          )}
        </BentoTile>
        </StaggerItem>
      </Stagger>

      <ApprovalSheet
        approval={open}
        onClose={() => setOpen(null)}
        onDecided={() => {
          approvals.reload();
          audit.reload();
          evidence.reload();
        }}
      />
    </main>
  );
}
