import type { Decision } from "@/components/api/types";

export const decisionTone: Record<Decision, { text: string; bg: string; border: string; dot: string; label: string; short: string }> = {
  ALLOW: { text: "text-allow", bg: "bg-allow-soft", border: "border-allow/30", dot: "bg-allow", label: "Allowed", short: "ALLOW" },
  DENY: { text: "text-deny", bg: "bg-deny-soft", border: "border-deny/35", dot: "bg-deny", label: "Blocked", short: "DENY" },
  REQUIRE_APPROVAL: {
    text: "text-approval",
    bg: "bg-approval-soft",
    border: "border-approval/35",
    dot: "bg-approval",
    label: "Needs approval",
    short: "APPROVAL",
  },
};

/** Decision tag. Colour is the only thing that varies — shape and size stay constant across the app. */
export function DecisionChip({ decision, compact = false }: { decision: Decision; compact?: boolean; pulse?: boolean; glow?: boolean }) {
  const tone = decisionTone[decision];
  return (
    <span
      className={`inline-flex h-[20px] w-fit items-center gap-1.5 rounded-[3px] border px-1.5 text-[11px] font-medium whitespace-nowrap ${tone.text} ${tone.bg} ${tone.border}`}
      title={decision}
    >
      <span className={`size-1.5 rounded-[1px] ${tone.dot}`} />
      {compact ? tone.short : tone.label}
    </span>
  );
}
