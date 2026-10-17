"use client";

import { RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { ApprovalDTO } from "@/components/api/types";
import { ApprovalSheet, ApprovalsQueue } from "@/components/admin/ApprovalReview";
import { useApprovals } from "@/components/admin/hooks";
import { RoleGate } from "@/components/auth/RoleGate";
import { BentoTile } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const all = approvals.data ?? [];
  const list = view === "all" ? all : view === "pending" ? all.filter((a) => a.status === "PENDING") : all.filter((a) => a.status !== "PENDING");

  return (
    <main className="mx-auto w-full max-w-[1040px] p-4 sm:p-6">
      <BentoTile
        action={
          <>
            <Tabs onValueChange={(v) => setView(v as View)} value={view}>
              <TabsList>
                <TabsTrigger value="pending">Pending · {all.filter((a) => a.status === "PENDING").length}</TabsTrigger>
                <TabsTrigger value="decided">Decided</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button aria-label="Refresh" onClick={approvals.reload} size="icon" variant="ghost">
              <RefreshCw className="size-4" />
            </Button>
          </>
        }
        icon={ShieldCheck}
        kicker="human checkpoint · single-use grants"
        title="Approvals"
      >
        {approvals.error && <p className="m-0 px-5 pt-4 text-sm text-deny">Could not load approvals: {approvals.error}</p>}
        {approvals.loading ? <Skeleton className="m-5 h-40" /> : <ApprovalsQueue approvals={list} onOpen={setOpen} />}
      </BentoTile>
      <p className="mt-3 text-xs text-muted-foreground">
        Requests are raised by the gateway when policy says REQUIRE_APPROVAL. Approving executes the exact stored payload once; a replay is rejected.
      </p>
      <ApprovalSheet approval={open} onClose={() => setOpen(null)} onDecided={approvals.reload} />
    </main>
  );
}
