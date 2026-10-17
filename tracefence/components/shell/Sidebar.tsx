"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROLE_LABEL } from "@/components/console/catalog";
import { Icon } from "@/components/ui/Icon";
import { StatusDot } from "@/components/ui/StatusDot";
import { useAppState } from "./AppState";
import { NAV, isActive } from "./nav";

export function Sidebar() {
  const pathname = usePathname();
  const { mode, session, role, pendingCount, openApprovals } = useAppState();

  return (
    <aside className="sticky top-0 hidden h-screen w-[212px] flex-none flex-col border-r border-line bg-surface-soft lg:flex">
      <Link className="flex h-12 items-center gap-2.5 border-b border-line px-4" href="/">
        <span className="grid size-6 place-items-center rounded-[4px] bg-accent text-white">
          <Icon name="shield" size={14} />
        </span>
        <span className="text-[14px] font-semibold tracking-[-0.01em] text-ink">TraceFence</span>
        <span className="ml-auto font-mono text-[10px] text-faint">0.1</span>
      </Link>

      <nav aria-label="Primary" className="flex flex-col gap-px px-2 pt-3">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`relative flex h-8 items-center gap-2.5 rounded-[4px] px-2.5 text-[13px] transition-colors ${active ? "bg-surface-raised font-medium text-ink" : "text-muted hover:bg-surface hover:text-ink"}`}
              href={item.href}
              key={item.href}
            >
              {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-[2px] rounded-full bg-accent" />}
              <Icon className={active ? "text-accent" : "text-faint"} name={item.icon} size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-4">
        <div className="label mb-2">Gateway</div>
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-[7px] text-[12px]">
          <dt className="text-faint">Status</dt>
          <dd className="m-0 flex items-center justify-end gap-1.5 text-ink">
            <StatusDot live={mode === "live"} tone={mode === "live" ? "green" : "amber"} />
            {mode === "live" ? "Enforcing" : "Replay"}
          </dd>
          <dt className="text-faint">Policy</dt>
          <dd className="m-0 text-right font-mono text-[11.5px] text-muted">v{session?.policyVersion ?? "–"}</dd>
          <dt className="text-faint">Tenant</dt>
          <dd className="m-0 truncate text-right font-mono text-[11.5px] text-muted" title={session?.tenantId}>
            {session?.tenantId ?? "nulltrace-institute"}
          </dd>
          <dt className="text-faint">Identity</dt>
          <dd className="m-0 text-right text-muted">{ROLE_LABEL[session?.role ?? role]}</dd>
          <dt className="text-faint">Session</dt>
          <dd className="m-0 truncate text-right font-mono text-[11.5px] text-muted">{session?.sessionId ?? "opening…"}</dd>
        </dl>
        <button
          className={`mt-4 flex h-8 w-full items-center justify-between rounded-[4px] border px-2.5 text-[12px] transition-colors ${pendingCount ? "border-approval/40 text-approval hover:bg-approval-soft" : "border-line text-muted hover:border-line-strong hover:text-ink"}`}
          onClick={openApprovals}
          type="button"
        >
          <span className="flex items-center gap-2">
            <Icon name="clock" size={13} />
            Pending approvals
          </span>
          <span className="font-mono">{pendingCount}</span>
        </button>
      </div>

      <div className="mt-auto border-t border-line px-4 py-3 text-[11.5px] leading-relaxed text-faint">
        The model proposes. The gateway decides and executes. Source text never changes policy.
      </div>
    </aside>
  );
}
