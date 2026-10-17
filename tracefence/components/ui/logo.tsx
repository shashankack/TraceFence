import { cn } from "@/components/lib/utils";

const LOGO_SRC = "/trace_fence_logo.png";

/** Compact wordmark (full logo, never cropped). */
export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt="TraceFence"
      className={cn("h-12 w-auto shrink-0 object-contain object-left", className)}
      height={48}
      src={LOGO_SRC}
      width={144}
    />
  );
}

/** Full TraceFence wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="TraceFence"
        className="h-12 w-auto max-w-full object-contain object-left sm:h-14"
        height={56}
        src={LOGO_SRC}
        width={168}
      />
    </span>
  );
}
