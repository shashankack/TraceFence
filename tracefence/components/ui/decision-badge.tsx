import { Check, Clock3, Filter, X } from "lucide-react";
import type { Decision } from "@/components/api/types";
import { cn } from "@/components/lib/utils";

const TONE: Record<Decision, { label: string; className: string; Icon: typeof Check }> = {
  ALLOW: { label: "Allowed", className: "bg-allow-soft text-allow border-allow/20", Icon: Check },
  DENY: { label: "Blocked", className: "bg-deny-soft text-deny border-deny/25", Icon: X },
  REQUIRE_APPROVAL: { label: "Needs approval", className: "bg-approval-soft text-approval border-approval/25", Icon: Clock3 },
};

export function DecisionBadge({ decision, className }: { decision: Decision; className?: string }) {
  const t = TONE[decision];
  return (
    <span
      className={cn("inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11.5px] font-medium whitespace-nowrap", t.className, className)}
      title={decision}
    >
      <t.Icon className="size-3" strokeWidth={2.4} />
      {t.label}
    </span>
  );
}

export function FencedBadge() {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full border border-violet/25 bg-violet-soft px-2 text-[11.5px] font-medium text-violet">
      <Filter className="size-3" strokeWidth={2.2} />
      Fenced
    </span>
  );
}

const CLASS_TONE: Record<string, string> = {
  public: "text-muted-foreground",
  internal: "text-primary",
  confidential: "text-violet",
};

export function ClassLabel({ value }: { value: string }) {
  return <span className={cn("font-mono text-[11px] whitespace-nowrap", CLASS_TONE[value] ?? "text-muted-foreground")}>{value}</span>;
}

export function LiveDot({ tone = "allow", pulse = true }: { tone?: "allow" | "primary" | "approval" | "deny"; pulse?: boolean }) {
  const bg = { allow: "bg-allow", primary: "bg-primary", approval: "bg-approval", deny: "bg-deny" }[tone];
  return (
    <span className="relative inline-flex size-2">
      {pulse && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-40", bg)} />}
      <span className={cn("relative inline-block size-2 rounded-full", bg)} />
    </span>
  );
}
