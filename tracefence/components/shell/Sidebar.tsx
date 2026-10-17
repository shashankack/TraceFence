"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ROLE_LABEL } from "@/components/console/catalog";
import { Icon } from "@/components/ui/Icon";
import { StatusDot } from "@/components/ui/StatusDot";
import { useAppState } from "./AppState";
import { NAV, isActive } from "./nav";

export function Sidebar() {
  const pathname = usePathname();
  const { mode, session, role, pendingCount, openApprovals } = useAppState();

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-line bg-[rgba(5,9,19,.75)] backdrop-blur-xl lg:flex">
      <Link className="flex items-center gap-3 px-5 pt-5 pb-6" href="/">
        <motion.span
          className="relative grid size-10 place-items-center rounded-xl border border-neon/40 bg-neon-soft text-neon glow-neon"
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          whileHover={{ rotate: -6, scale: 1.05 }}
        >
          <Icon name="shield" size={21} />
        </motion.span>
        <div className="leading-tight">
          <strong className="block font-display text-[1.2rem] font-bold tracking-tight text-ink">TraceFence</strong>
          <span className="font-mono text-[9.5px] tracking-[.18em] text-faint uppercase">by NullTrace</span>
        </div>
      </Link>

      <span className="eyebrow px-5 pb-2 text-faint!">Workspace</span>
      <nav aria-label="Primary" className="flex flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${active ? "text-ink" : "text-muted hover:bg-white/[.03] hover:text-ink"}`}
              href={item.href}
              key={item.href}
            >
              {active && (
                <motion.span
                  className="absolute inset-0 rounded-lg border border-neon/25 bg-neon-soft"
                  layoutId="sidebar-active"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              {active && (
                <motion.span
                  className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r bg-neon shadow-[0_0_12px_var(--color-neon)]"
                  layoutId="sidebar-bar"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <Icon className={`relative ${active ? "text-neon" : ""}`} name={item.icon} size={17} />
              <span className="relative flex flex-col">
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="text-[11px] text-faint">{item.caption}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-3">
        <span className="eyebrow block px-2 pb-2 text-faint!">Gateway</span>
        <div className="glass-soft rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-ink">
              <StatusDot tone={mode === "live" ? "green" : "amber"} />
              {mode === "live" ? "Enforcing · live" : "Scripted replay"}
            </span>
            <code className="font-mono text-[10px] text-faint">v{session?.policyVersion ?? "–"}</code>
          </div>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[11px]">
            <dt className="text-faint">Tenant</dt>
            <dd className="truncate text-right font-mono text-muted">{session?.tenantId ?? "nulltrace-institute"}</dd>
            <dt className="text-faint">Identity</dt>
            <dd className="text-right font-mono text-muted">{ROLE_LABEL[session?.role ?? role]}</dd>
            <dt className="text-faint">Session</dt>
            <dd className="truncate text-right font-mono text-muted">{session?.sessionId ?? "starting…"}</dd>
          </dl>
          <button
            className={`mt-3 flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors ${pendingCount ? "border-approval/40 bg-approval-soft text-approval" : "border-line text-muted hover:text-ink"}`}
            onClick={openApprovals}
            type="button"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="clock" size={13} />
              Pending approvals
            </span>
            <span className="font-mono">{pendingCount}</span>
          </button>
        </div>
      </div>

      <div className="mt-auto px-5 pb-5">
        <div className="rounded-xl border border-line bg-gradient-to-br from-neon-soft to-transparent p-3">
          <p className="m-0 flex items-center gap-1.5 text-[11px] font-semibold text-ink">
            <Icon className="text-neon" name="lock" size={12} />
            Model proposes. Gateway executes.
          </p>
          <p className="mt-1 mb-0 text-[11px] leading-snug text-faint">
            Sources are untrusted data. DEMO_MODE never bypasses DENY.
          </p>
        </div>
      </div>
    </aside>
  );
}
