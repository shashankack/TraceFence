const TONE = {
  green: "bg-allow",
  amber: "bg-approval",
  red: "bg-deny",
  blue: "bg-accent",
  grey: "bg-faint",
};

export type DotTone = keyof typeof TONE;

/** Small status light. "live" adds a slow 2s fade — enough to read as alive, not enough to distract. */
export function StatusDot({ tone = "green", live = false }: { tone?: DotTone; live?: boolean }) {
  return (
    <span
      className={`inline-block size-[7px] flex-none rounded-full ${TONE[tone]}`}
      style={live ? { animation: "tf-pulse 2s ease-in-out infinite" } : undefined}
    />
  );
}
