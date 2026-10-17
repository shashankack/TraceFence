"use client";

import { Ban, CircleCheck, Filter, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { forbiddenExecutions } from "@/components/domain/evidence";
import { roleLabelFor } from "@/components/shell/nav";
import { BentoTile, StatTile } from "@/components/ui/bento";
import { useWorkspace } from "./WorkspaceProvider";

const ROLE_BLURB: Record<string, string> = {
  guest: "Browse public campus sources without signing in. Sign in when you need internal, confidential, or privileged tools.",
  student: "You can read public campus sources. Confidential records are fenced out before the model ever sees them.",
  faculty: "You can research internal and confidential sources. Exports pause for a one-time admin approval.",
  admin: "",
};

export function WelcomeTile({ className }: { className?: string }) {
  const { user } = useAuth();
  const { session } = useWorkspace();
  if (!user) return null;
  const first = user.displayName ?? user.email.split("@")[0];
  return (
    <BentoTile className={className} kicker={`${roleLabelFor(user.role, user.orgType, user.roleLabels)} · ${user.tenantName ?? user.tenantId}`} title={`Hello, ${first}`} tone="brand">
      <div className="flex flex-1 flex-col justify-between gap-4 px-5 pb-5">
        <p className="m-0 text-sm leading-relaxed text-white/85">{ROLE_BLURB[user.role]}</p>
        <dl className="m-0 grid grid-cols-2 gap-3 font-mono text-[11px]">
          <div>
            <dt className="text-white/60">Session</dt>
            <dd className="m-0 truncate">{session?.sessionId ?? "opening…"}</dd>
          </div>
          <div>
            <dt className="text-white/60">Policy</dt>
            <dd className="m-0">v{session?.policyVersion ?? "–"}</dd>
          </div>
        </dl>
      </div>
    </BentoTile>
  );
}

/** Session-scoped figures  computed only from events this session's gateway returned. */
export function SessionStats() {
  const { events } = useWorkspace();
  const decisions = events.filter((e) => e.reasonCode !== "RETRIEVAL_FILTERED");
  const fenced = new Set(
    events.flatMap((e) => (e.reasonCode === "RETRIEVAL_FILTERED" && Array.isArray(e.argsPreview?.filteredOut) ? (e.argsPreview.filteredOut as string[]) : [])),
  ).size;
  const forbidden = forbiddenExecutions(events);
  return (
    <>
      <StatTile className="xl:col-span-2" hint="calls the gateway allowed" icon={CircleCheck} label="Allowed" tone="allow" value={decisions.filter((e) => e.decision === "ALLOW").length} />
      <StatTile className="xl:col-span-2" hint="stopped before execution" icon={Ban} label="Blocked" tone={decisions.some((e) => e.decision === "DENY") ? "deny" : "default"} value={decisions.filter((e) => e.decision === "DENY").length} />
      <StatTile className="xl:col-span-2" hint="never entered context" icon={Filter} label="Fenced sources" tone="brand" value={fenced} />
      <StatTile className="xl:col-span-2" hint="denied calls that ran" icon={ShieldCheck} label="Forbidden runs" tone={forbidden ? "deny" : "allow"} value={forbidden} />
    </>
  );
}
