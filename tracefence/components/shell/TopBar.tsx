"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ROLE_LABEL } from "@/components/console/catalog";
import { ActivityIndicator } from "@/components/ui/ActivityIndicator";
import { Icon } from "@/components/ui/Icon";
import { StatusDot } from "@/components/ui/StatusDot";
import { useAppState, type Mode } from "./AppState";
import { NAV, isActive } from "./nav";

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "live", label: "Live gateway" },
  { id: "replay", label: "Scripted replay" },
];

export function TopBar() {
  const pathname = usePathname();
  const { mode, setMode, pendingCount, openApprovals, sending, deciding, role, session } = useAppState();
  const current = NAV.find((n) => isActive(pathname, n.href)) ?? NAV[0];
  const busy = sending || deciding;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[rgba(5,9,19,.7)] backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
        <Link className="grid size-9 place-items-center rounded-lg border border-neon/40 bg-neon-soft text-neon lg:hidden" href="/">
          <Icon name="shield" size={18} />
        </Link>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-[.12em] text-faint uppercase">
            <span className="hidden sm:inline">NullTrace Institute</span>
            <Icon className="hidden sm:inline" name="chevron" size={10} />
            <span className="text-neon">{current.label}</span>
          </div>
          <h1 className="m-0 truncate font-display text-lg font-semibold tracking-tight text-ink">
            {pathname === "/" ? "Security command center" : current.caption}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div
            aria-label={busy ? "Gateway evaluating" : "Gateway idle"}
            className="hidden items-center gap-2 rounded-lg border border-line bg-surface/60 px-2.5 py-1.5 md:flex"
            role="status"
          >
            <ActivityIndicator busy={busy} tone={mode === "live" ? "neon" : "amber"} />
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-[10px] font-semibold tracking-wider text-muted uppercase"
                exit={{ opacity: 0, y: -4 }}
                initial={{ opacity: 0, y: 4 }}
                key={busy ? "busy" : "idle"}
              >
                {busy ? "Evaluating" : "Monitoring"}
              </motion.span>
            </AnimatePresence>
          </div>

          <div aria-label="Gateway mode" className="flex gap-0.5 rounded-lg border border-line bg-surface/60 p-[3px]" role="group">
            {MODES.map((m) => (
              <button
                aria-pressed={mode === m.id}
                className={`relative rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${mode === m.id ? "text-ink" : "text-faint hover:text-muted"}`}
                key={m.id}
                onClick={() => setMode(m.id)}
                type="button"
              >
                {mode === m.id && (
                  <motion.span
                    className="absolute inset-0 rounded-md border border-line-strong bg-surface-raised"
                    layoutId="mode-pill"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  {m.id === "live" && <StatusDot tone={mode === "live" ? "green" : "grey"} />}
                  <span className="hidden sm:inline">{m.label}</span>
                  <span className="sm:hidden">{m.id === "live" ? "Live" : "Replay"}</span>
                </span>
              </button>
            ))}
          </div>

          <motion.button
            className={`flex h-[34px] items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${pendingCount ? "border-approval/45 bg-approval-soft text-approval glow-approval" : "border-line bg-surface/60 text-muted hover:text-ink"}`}
            onClick={openApprovals}
            type="button"
            whileTap={{ scale: 0.96 }}
          >
            <Icon name="clock" size={15} />
            <span className="hidden sm:inline">Approvals</span>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                animate={{ scale: 1, opacity: 1 }}
                className="grid h-[18px] min-w-[18px] place-items-center rounded-md bg-black/30 px-1.5 font-mono text-[10px] font-semibold"
                exit={{ scale: 0.4, opacity: 0 }}
                initial={{ scale: 1.6, opacity: 0 }}
                key={pendingCount}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
              >
                {pendingCount}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <div className="hidden items-center gap-2 rounded-lg border border-line bg-surface/60 py-1 pr-2.5 pl-1 xl:flex">
            <span className="grid size-7 place-items-center rounded-md bg-neon-soft text-neon">
              <Icon name="fingerprint" size={15} />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-xs font-semibold text-ink">{ROLE_LABEL[session?.role ?? role]}</span>
              <span className="font-mono text-[10px] text-faint">{session?.userId ?? "authenticating…"}</span>
            </span>
          </div>
        </div>
      </div>

      <nav aria-label="Primary" className="flex gap-1 overflow-x-auto border-t border-line px-3 py-1.5 lg:hidden">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${active ? "bg-neon-soft text-neon" : "text-muted"}`}
              href={item.href}
              key={item.href}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
