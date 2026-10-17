"use client";

import { Check, ChevronRight, Clock3, Loader2, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/components/api/client";
import type { ApprovalDTO, EventDTO } from "@/components/api/types";
import { cn } from "@/components/lib/utils";
import { Button } from "@/components/ui/button";
import { DecisionBadge, FencedBadge } from "@/components/ui/decision-badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { argsLine, formatRemaining, formatTime } from "@/components/workspace/format";

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

function describe(a: ApprovalDTO) {
  if (a.toolName === "export_records") return `Export “${String(a.args.dataset)}” as ${String(a.args.format ?? "file").toUpperCase()}`;
  if (a.toolName === "notify_external") return `Email ${String(a.args.to ?? "an external address")}`;
  if (a.toolName === "post_announcement") return "Publish a campus announcement";
  return `Run ${a.toolName}`;
}

/** Compact queue rows. Clicking a row opens the review sheet. */
export function ApprovalsQueue({ approvals, onOpen, limit }: { approvals: ApprovalDTO[]; onOpen: (a: ApprovalDTO) => void; limit?: number }) {
  const now = useNow(approvals.some((a) => a.status === "PENDING"));
  const rows = limit ? approvals.slice(0, limit) : approvals;
  if (rows.length === 0) {
    return <p className="m-0 px-5 py-6 text-sm text-muted-foreground">No requests yet. Faculty exports appear here for a one-time decision.</p>;
  }
  return (
    <ul className="m-0 list-none divide-y p-0">
      {rows.map((a) => {
        const pending = a.status === "PENDING";
        const remaining = new Date(a.expiresAt).getTime() - now;
        return (
          <li key={a.id}>
            <button className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/60" onClick={() => onOpen(a)} type="button">
              <span
                className={cn(
                  "grid size-8 flex-none place-items-center rounded-lg",
                  pending ? "bg-approval-soft text-approval" : a.status === "CONSUMED" ? "bg-allow-soft text-allow" : "bg-muted text-muted-foreground",
                )}
              >
                {pending ? <Clock3 className="size-4" /> : a.status === "CONSUMED" ? <Check className="size-4" /> : <X className="size-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{describe(a)}</span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">
                  {a.userId} · {a.sessionId}
                </span>
              </span>
              <span className={cn("font-mono text-xs tabular-nums", pending ? "text-approval" : "text-muted-foreground")}>
                {pending ? (remaining > 0 ? formatRemaining(remaining) : "expired") : a.status.toLowerCase()}
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ApprovalSheet({ approval, onClose, onDecided }: { approval: ApprovalDTO | null; onClose: () => void; onDecided: () => void }) {
  const [context, setContext] = useState<EventDTO[] | null>(null);
  const [deciding, setDeciding] = useState<"APPROVE" | "REJECT" | null>(null);
  const open = !!approval;
  const now = useNow(open);

  useEffect(() => {
    if (!approval) return;
    let alive = true;
    api
      .sessionEvents(approval.sessionId)
      .then((e) => alive && setContext(e))
      .catch(() => alive && setContext([]));
    return () => {
      alive = false;
      setContext(null);
    };
  }, [approval]);

  const decide = async (decision: "APPROVE" | "REJECT") => {
    if (!approval) return;
    setDeciding(decision);
    try {
      await api.decideApproval(approval.id, decision);
      toast.success(decision === "APPROVE" ? "Approved once — action executed" : "Request rejected", {
        description: decision === "APPROVE" ? "The single-use grant is now consumed." : "Nothing was executed.",
      });
      onDecided();
      onClose();
    } catch (err) {
      toast.error("Decision not recorded", {
        description: err instanceof ApiError ? `${err.reasonCode ? `${err.reasonCode} — ` : ""}${err.message}` : "Unknown error",
      });
    } finally {
      setDeciding(null);
    }
  };

  const pending = approval?.status === "PENDING";
  const remaining = approval ? new Date(approval.expiresAt).getTime() - now : 0;
  const total = approval ? Math.max(1, new Date(approval.expiresAt).getTime() - new Date(approval.createdAt).getTime()) : 1;
  const expired = pending && remaining <= 0;

  return (
    <Sheet onOpenChange={(o) => !o && onClose()} open={open}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]">
        {approval && (
          <>
            <SheetHeader className="border-b px-6 py-5">
              <span className="kicker flex items-center gap-1.5 text-approval">
                <ShieldCheck className="size-3.5" />
                {pending ? "Approval required" : `Request ${approval.status.toLowerCase()}`}
              </span>
              <SheetTitle className="text-lg font-semibold tracking-[-0.01em]">{describe(approval)}</SheetTitle>
              <SheetDescription>
                The gateway paused this call. Approving runs it exactly once with the payload below. Any change requires a new request.
              </SheetDescription>
            </SheetHeader>

            <div className="scroll-thin flex-1 overflow-y-auto">
              {pending && (
                <section className="px-6 py-4">
                  <div className="flex items-baseline justify-between">
                    <span className="kicker">Time remaining</span>
                    <span className={cn("font-mono text-lg font-semibold tabular-nums", expired || remaining < 60_000 ? "text-deny" : "text-foreground")}>
                      {expired ? "expired" : formatRemaining(remaining)}
                    </span>
                  </div>
                  <Progress className="mt-2 h-1.5" value={Math.max(0, (remaining / total) * 100)} />
                </section>
              )}

              <Separator />
              <section className="px-6 py-4">
                <span className="kicker">Request</span>
                <dl className="m-0 mt-2 grid grid-cols-[110px_1fr] gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Tool</dt>
                  <dd className="m-0 font-mono text-[13px]">{approval.toolName}</dd>
                  <dt className="text-muted-foreground">Requested by</dt>
                  <dd className="m-0 font-mono text-[13px]">{approval.userId}</dd>
                  <dt className="text-muted-foreground">Requested at</dt>
                  <dd className="m-0 font-mono text-[13px]">{formatTime(approval.createdAt)}</dd>
                  <dt className="text-muted-foreground">Session</dt>
                  <dd className="m-0 font-mono text-[13px]">{approval.sessionId}</dd>
                </dl>
              </section>

              <Separator />
              <section className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="kicker">Exact payload</span>
                  <span className="font-mono text-[11px] text-muted-foreground">policy v{approval.policyVersion}</span>
                </div>
                <pre className="mt-2 mb-0 overflow-x-auto rounded-lg border bg-muted/60 px-4 py-3 font-mono text-[12.5px] leading-relaxed">
                  {JSON.stringify({ tool: approval.toolName, args: approval.args }, null, 2)}
                </pre>
                <p className="mt-2 mb-0 font-mono text-[11px] break-all text-muted-foreground">hash {approval.canonicalArgsHash}</p>
              </section>

              <Separator />
              <section className="px-6 py-4">
                <span className="kicker">Session context</span>
                {context === null ? (
                  <p className="m-0 mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" /> Loading trace…
                  </p>
                ) : context.length === 0 ? (
                  <p className="m-0 mt-2 text-sm text-muted-foreground">No events recorded for this session.</p>
                ) : (
                  <ol className="m-0 mt-2 list-none space-y-1.5 p-0">
                    {context.map((e, i) => (
                      <li className="flex items-center gap-2 rounded-md border bg-white px-2.5 py-1.5 text-xs" key={e.id}>
                        <span className="font-mono text-[10.5px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                        <code className="font-mono">{e.reasonCode === "RETRIEVAL_FILTERED" ? "acl.filter" : e.tool}</code>
                        <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-muted-foreground">{argsLine(e.argsPreview)}</span>
                        {e.reasonCode === "RETRIEVAL_FILTERED" ? <FencedBadge /> : e.decision && <DecisionBadge decision={e.decision} />}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>

            {pending && (
              <footer className="border-t bg-muted/40 px-6 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button className="h-10 border-deny/40 text-deny hover:bg-deny-soft hover:text-deny" disabled={!!deciding} onClick={() => decide("REJECT")} variant="outline">
                    {deciding === "REJECT" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                    Reject
                  </Button>
                  <Button className="h-10 bg-allow text-white hover:bg-allow/90" disabled={!!deciding || expired} onClick={() => decide("APPROVE")}>
                    {deciding === "APPROVE" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    Approve once
                  </Button>
                </div>
                <p className="mt-3 mb-0 text-center text-xs text-muted-foreground">Your decision is recorded in the audit log.</p>
              </footer>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
