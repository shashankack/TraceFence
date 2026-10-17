import type { Classification } from "@/components/api/types";
import { CLASSIFICATION_TONE } from "@/components/console/catalog";

export function ClassBadge({ value }: { value: string }) {
  const tone = CLASSIFICATION_TONE[value as Classification] ?? "text-muted bg-white/5 border-line";
  return (
    <em className={`rounded-full border px-2 py-[2px] font-mono text-[10px] font-semibold tracking-wide not-italic uppercase ${tone}`}>
      {value}
    </em>
  );
}
