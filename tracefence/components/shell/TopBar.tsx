"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ROLE_LABEL } from "@/components/console/catalog";
import { Icon } from "@/components/ui/Icon";
import { StatusDot } from "@/components/ui/StatusDot";
import { useAppState, type Mode } from "./AppState";
import { NAV, isActive } from "./nav";

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "live", label: "Live" },
  { id: "replay", label: "Replay" },
];

function useClock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function TopBar() {
  const pathname = usePathname();
  const { mode, setMode, pendingCount, openApprovals, sending, deciding, role, session } = useAppState();
  const current = NAV.find((n) => isActive(pathname, n.href)) ?? NAV[0];
  const busy = sending || deciding;
  const clock = useClock();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="flex h-12 items-center gap-3 px-4">
        <Link aria-label="TraceFence home" className="grid size-6 place-items-center rounded-[4px] bg-accent text-white lg:hidden" href="/">
          <Icon name="shield" size={14} />
        </Link>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
          <span className="hidden text-faint sm:inline">NullTrace Institute</span>
          <span className="hidden text-line-strong sm:inline">/</span>
          <span className="truncate font-medium text-ink">{current.title}</span>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 pr-1 font-mono text-[11px] text-faint md:flex" role="status">
            <StatusDot live={!busy && mode === "live"} tone={busy ? "blue" : mode === "live" ? "green" : "amber"} />
            <span className={busy ? "text-accent" : "text-muted"}>{busy ? "evaluating" : mode === "live" ? "gateway live" : "replay"}</span>
            <span className="text-line-strong">·</span>
            <span className="tabular-nums">{clock}</span>
          </div>

          <div aria-label="Gateway mode" className="flex h-7 rounded-[4px] border border-line p-[2px]" role="group">
            {MODES.map((m) => (
              <button
                aria-pressed={mode === m.id}
                className={`rounded-[3px] px-2.5 text-[12px] transition-colors ${mode === m.id ? "bg-surface-raised text-ink" : "text-faint hover:text-muted"}`}
                key={m.id}
                onClick={() => setMode(m.id)}
                type="button"
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            className={`flex h-7 items-center gap-1.5 rounded-[4px] border px-2 text-[12px] transition-colors ${pendingCount ? "border-approval/45 text-approval hover:bg-approval-soft" : "border-line text-muted hover:border-line-strong hover:text-ink"}`}
            onClick={openApprovals}
            type="button"
          >
            <Icon name="clock" size={13} />
            <span className="hidden sm:inline">Approvals</span>
            <span className="font-mono text-[11px]">{pendingCount}</span>
          </button>

          <div className="hidden h-7 items-center gap-2 border-l border-line pl-3 xl:flex">
            <span className="text-[12px] text-ink">{ROLE_LABEL[session?.role ?? role]}</span>
            <span className="font-mono text-[11px] text-faint">{session?.userId ?? "…"}</span>
          </div>
        </div>
      </div>

      <nav aria-label="Primary" className="flex gap-1 overflow-x-auto border-t border-line px-2 py-1 lg:hidden">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex h-7 items-center gap-1.5 rounded-[4px] px-2.5 text-[12px] whitespace-nowrap ${active ? "bg-surface-raised text-ink" : "text-muted"}`}
              href={item.href}
              key={item.href}
            >
              <Icon className={active ? "text-accent" : ""} name={item.icon} size={13} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
