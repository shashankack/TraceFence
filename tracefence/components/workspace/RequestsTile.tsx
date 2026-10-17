"use client";

import { Check, ClipboardList, Clock3, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ApprovalDTO } from "@/components/api/types";
import { cn } from "@/components/lib/utils";
import { BentoTile } from "@/components/ui/bento";
import { Progress } from "@/components/ui/progress";
import { formatRemaining } from "./format";
import { useWorkspace } from "./WorkspaceProvider";

const STEPS = ["Requested", "Admin review", "Executed once"];

function stepIndex(status: ApprovalDTO["status"]) {
  if (status === "PENDING") return 1;
  if (status === "CONSUMED" || status === "APPROVED") return 2;
  return -1;
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

/** Faculty view of their own approval requests. Faculty cannot approve their own requests here — admins decide. */
export function RequestsTile({ className }: { className?: string }) {
  const { requests } = useWorkspace();
  const now = useNow(requests.some((r) => r.status === "PENDING"));

  return (
    <BentoTile
      action={<span className="font-mono text-[11px] text-muted-foreground">{requests.length} total</span>}
      className={className}
      icon={ClipboardList}
      kicker="separation of duties"
      title="My requests"
    >
      {requests.length === 0 ? (
        <p className="m-0 px-5 py-5 text-sm text-muted-foreground">
          Sensitive actions such as exports are paused for an admin. Run <span className="font-medium text-foreground">Export directory</span> to raise one.
        </p>
      ) : (
        <ul className="m-0 list-none divide-y p-0">
          {requests.map((r) => {
            const idx = stepIndex(r.status);
            const remaining = new Date(r.expiresAt).getTime() - now;
            const total = Math.max(1, new Date(r.expiresAt).getTime() - new Date(r.createdAt).getTime());
            const rejected = r.status === "REJECTED" || r.status === "EXPIRED";
            return (
              <li className="px-5 py-4" key={r.id}>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-[13px] font-medium">{r.toolName}</code>
                  <span className="font-mono text-[11px] text-muted-foreground">{Object.values(r.args).map(String).join(" · ")}</span>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium",
                      r.status === "PENDING" && "bg-approval-soft text-approval",
                      (r.status === "CONSUMED" || r.status === "APPROVED") && "bg-allow-soft text-allow",
                      rejected && "bg-deny-soft text-deny",
                    )}
                  >
                    {r.status === "PENDING" ? "Awaiting admin" : r.status === "CONSUMED" ? "Executed" : r.status.toLowerCase()}
                  </span>
                </div>

                <ol className="mt-3 flex list-none items-center gap-0 p-0">
                  {STEPS.map((s, i) => {
                    const done = !rejected && idx >= i && !(i === 1 && idx === 1);
                    const current = !rejected && idx === i && i === 1;
                    return (
                      <li className="flex flex-1 items-center gap-2" key={s}>
                        <span
                          className={cn(
                            "grid size-5 flex-none place-items-center rounded-full border text-[10px]",
                            done && "border-primary bg-primary text-white",
                            current && "border-approval bg-approval-soft text-approval",
                            rejected && i > 0 && "border-deny/40 bg-deny-soft text-deny",
                          )}
                        >
                          {done ? <Check className="size-3" /> : current ? <Clock3 className="size-3" /> : rejected && i > 0 ? <X className="size-3" /> : i + 1}
                        </span>
                        <span className={cn("text-xs whitespace-nowrap", done || current ? "text-foreground" : "text-muted-foreground")}>{s}</span>
                        {i < STEPS.length - 1 && <span className={cn("mx-1 h-px flex-1", done ? "bg-primary/40" : "bg-border")} />}
                      </li>
                    );
                  })}
                </ol>

                {r.status === "PENDING" && (
                  <div className="mt-3 flex items-center gap-3">
                    <Progress className="h-1.5 flex-1" value={Math.max(0, (remaining / total) * 100)} />
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{formatRemaining(remaining)}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </BentoTile>
  );
}
