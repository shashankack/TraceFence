import { cn } from "@/components/lib/utils";

/** TraceFence mark: a fence of three posts with a trace line running through it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-8 place-items-center rounded-lg brand-gradient text-white shadow-[0_4px_14px_rgba(54,81,245,0.35)]", className)}>
      <svg aria-hidden="true" fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="18">
        <path d="M6 5v14M12 3v18M18 5v14" />
        <path d="M3 13.5h4l2-3 3 5 3-5 2 3h4" strokeWidth="1.6" />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-[-0.01em]">TraceFence</span>
        <span className="kicker block text-[9.5px]">by NullTrace</span>
      </span>
    </span>
  );
}
