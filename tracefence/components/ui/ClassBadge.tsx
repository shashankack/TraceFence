import type { Classification } from "@/components/api/types";

const TONE: Record<Classification, string> = {
  public: "text-muted",
  internal: "text-internal",
  confidential: "text-deny",
};

/** Classification is metadata, so it reads as a quiet monospace label rather than a pill. */
export function ClassBadge({ value }: { value: string }) {
  const tone = TONE[value as Classification] ?? "text-faint";
  return <span className={`font-mono text-[10.5px] whitespace-nowrap ${tone}`}>{value}</span>;
}
