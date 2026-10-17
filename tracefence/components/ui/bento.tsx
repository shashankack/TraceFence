import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/components/lib/utils";

/** Bento grid: 12 columns on desktop, single column on phones. Tiles choose their own span. */
export function BentoGrid({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12", className)}>{children}</div>;
}

/** One bento tile: quiet header (icon, kicker, title, optional action) above free-form content. */
export function BentoTile({
  icon: Icon,
  kicker,
  title,
  action,
  className,
  bodyClassName,
  children,
  tone = "default",
}: {
  icon?: LucideIcon;
  kicker?: string;
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  tone?: "default" | "brand";
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(14,18,37,0.04)]",
        tone === "brand" && "border-transparent text-white brand-gradient",
        className,
      )}
    >
      {(title || kicker) && (
        <header className={cn("flex items-start gap-3 px-5 pt-4 pb-3", tone === "default" && "border-b border-border/70")}>
          {Icon && (
            <span
              className={cn(
                "mt-0.5 grid size-7 flex-none place-items-center rounded-md",
                tone === "brand" ? "bg-white/15 text-white" : "bg-accent text-primary",
              )}
            >
              <Icon className="size-[15px]" strokeWidth={1.8} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {kicker && <p className={cn("kicker m-0", tone === "brand" && "text-white/70")}>{kicker}</p>}
            {title && <h2 className="m-0 truncate text-[15px] leading-6 font-semibold tracking-[-0.01em]">{title}</h2>}
          </div>
          {action && <div className="flex flex-none items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={cn("flex min-h-0 flex-1 flex-col", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Small numeric tile used in KPI rows. */
export function StatTile({
  label,
  value,
  hint,
  tone = "default",
  icon: Icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "allow" | "deny" | "approval" | "brand";
  icon?: LucideIcon;
  className?: string;
}) {
  const color = {
    default: "text-foreground",
    allow: "text-allow",
    deny: "text-deny",
    approval: "text-approval",
    brand: "brand-text",
  }[tone];
  return (
    <div className={cn("flex min-w-0 flex-col justify-between rounded-xl border bg-card px-5 py-4 shadow-[0_1px_2px_rgba(14,18,37,0.04)]", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="kicker">{label}</span>
        {Icon && <Icon className="size-4 text-muted-foreground" strokeWidth={1.8} />}
      </div>
      <div className={cn("mt-3 font-mono text-[28px] leading-none font-semibold tabular-nums", color)}>{value}</div>
      {hint && <p className="mt-2 mb-0 truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
