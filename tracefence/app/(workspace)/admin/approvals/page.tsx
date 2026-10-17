"use client";

import { Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ApprovalDTO, NotificationDTO } from "@/components/api/types";
import { api } from "@/components/api/client";
import { ApprovalSheet, ApprovalsQueue } from "@/components/admin/ApprovalReview";
import { useApprovals } from "@/components/admin/hooks";
import { RoleGate } from "@/components/auth/RoleGate";
import { BentoTile } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/motion/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTime } from "@/components/workspace/format";

type View = "pending" | "decided" | "all";

export default function ApprovalsPage() {
  return (
    <RoleGate allow={["admin"]}>
      <Approvals />
    </RoleGate>
  );
}

function Approvals() {
  const approvals = useApprovals();
  const [view, setView] = useState<View>("pending");
  const [open, setOpen] = useState<ApprovalDTO | null>(null);
  const [notes, setNotes] = useState<NotificationDTO[] | null>(null);
  const all = approvals.data ?? [];
  const pendingCount = all.filter((a) => a.status === "PENDING").length;
  const list =
    view === "all"
      ? all
      : view === "pending"
        ? all.filter((a) => a.status === "PENDING")
        : all.filter((a) => a.status !== "PENDING");

  const reloadNotes = useCallback(() => {
    api
      .orgNotifications(20)
      .then((r) => setNotes(r.notifications))
      .catch(() => setNotes([]));
  }, []);

  useEffect(() => {
    reloadNotes();
  }, [reloadNotes]);

  return (
    <main className="mx-auto w-full max-w-[1040px] space-y-4 p-4 sm:p-6">
      {pendingCount > 0 && (
        <BlurFade>
          <p className="m-0 rounded-xl border border-approval/25 bg-approval-soft px-4 py-3 text-sm text-approval">
            {pendingCount} pending approval{pendingCount === 1 ? "" : "s"}  
            organization admins were emailed (see Notifications below).
          </p>
        </BlurFade>
      )}

      <BlurFade>
        <BentoTile
          action={
            <>
              <Tabs onValueChange={(v) => setView(v as View)} value={view}>
                <TabsList>
                  <TabsTrigger value="pending">Pending · {pendingCount}</TabsTrigger>
                  <TabsTrigger value="decided">Decided</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                aria-label="Refresh"
                onClick={() => {
                  approvals.reload();
                  reloadNotes();
                }}
                size="icon"
                variant="ghost"
              >
                <RefreshCw className="size-4" />
              </Button>
            </>
          }
          icon={ShieldCheck}
          kicker="human checkpoint · single-use grants"
          title="Approvals"
        >
          {approvals.error && (
            <p className="m-0 px-5 pt-4 text-sm text-deny">
              Could not load approvals: {approvals.error}
            </p>
          )}
          {approvals.loading ? (
            <Skeleton className="m-5 h-40" />
          ) : (
            <ApprovalsQueue approvals={list} onOpen={setOpen} />
          )}
        </BentoTile>
      </BlurFade>

      <BlurFade delay={0.08}>
        <BentoTile
          icon={Mail}
          kicker="demo outbox · always recorded"
          title="Notifications"
        >
          {notes === null ? (
            <Skeleton className="m-5 h-24" />
          ) : notes.length === 0 ? (
            <p className="m-0 px-5 py-6 text-sm text-muted-foreground">
              No approval emails yet. When a Manager/Faculty export needs
              approval, alerts land here so admins know without watching the
              queue.
            </p>
          ) : (
            <ul className="m-0 list-none divide-y p-0">
              {notes.map((n) => (
                <li className="px-5 py-3" key={n.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{n.subject}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {formatTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 mb-0 font-mono text-[11px] text-muted-foreground">
                    to {n.to}
                    {n.kind ? ` · ${n.kind}` : ""}
                  </p>
                  <pre className="mt-2 mb-0 max-h-24 overflow-auto rounded-md bg-muted/50 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {n.body}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </BentoTile>
      </BlurFade>

      <p className="text-xs text-muted-foreground">
        Requests are raised by the gateway when policy says REQUIRE_APPROVAL.
        Approving executes the exact stored payload once; a replay is rejected.
      </p>
      <ApprovalSheet
        approval={open}
        onClose={() => setOpen(null)}
        onDecided={() => {
          approvals.reload();
          reloadNotes();
        }}
      />
    </main>
  );
}
