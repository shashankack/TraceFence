"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/ui/Icon";
import { useAppState, type Mode } from "./AppState";

const NAV = [
  { href: "/", label: "Console" },
  { href: "/org", label: "Org" },
  { href: "/audit", label: "Audit" },
];

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "live", label: "Live model" },
  { id: "replay", label: "Scripted replay" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { mode, setMode, pendingCount, openApprovals } = useAppState();

  return (
    <header className="sticky top-0 z-40 flex h-[72px] items-center gap-6 border-b border-line bg-white/90 px-6 backdrop-blur-md">
      <Link className="flex items-center gap-3 lg:w-[380px]" href="/">
        <motion.span
          className="grid size-10 place-items-center rounded-[11px] bg-navy text-[#d4fff6] shadow-[inset_0_0_0_1px_rgba(255,255,255,.13),0_3px_10px_rgba(19,47,53,.16)]"
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          whileHover={{ rotate: -6, scale: 1.05 }}
        >
          <Icon name="shield" size={24} />
        </motion.span>
        <div>
          <div className="flex items-baseline gap-2">
            <strong className="font-display text-xl font-extrabold tracking-tight">TraceFence</strong>
            <span className="text-[10px] font-bold uppercase tracking-[.8px] text-teal">by NullTrace</span>
          </div>
          <p className="m-0 hidden text-xs text-muted sm:block">A source-aware security gateway for AI agents</p>
        </div>
      </Link>

      <nav aria-label="Primary" className="flex h-full gap-7">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center px-0.5 text-sm font-bold transition-colors ${active ? "text-ink" : "text-muted hover:text-ink"}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
              {active && (
                <motion.span
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-t bg-teal"
                  layoutId="nav-underline"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2.5">
        <div aria-label="Model mode" className="flex gap-0.5 rounded-[9px] border border-line bg-[#f2f5f4] p-[3px]" role="group">
          {MODES.map((m) => (
            <button
              aria-pressed={mode === m.id}
              className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold ${mode === m.id ? "text-ink" : "text-muted"}`}
              key={m.id}
              onClick={() => setMode(m.id)}
              type="button"
            >
              {mode === m.id && (
                <motion.span
                  className="absolute inset-0 rounded-md bg-white shadow-[0_1px_4px_rgba(24,53,57,.1)]"
                  layoutId="mode-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {m.id === "live" && <StatusDot tone={mode === "live" ? "green" : "grey"} />}
                {m.label}
              </span>
            </button>
          ))}
        </div>

        <motion.button
          className="flex h-[34px] items-center gap-1.5 rounded-lg border border-line-strong bg-white px-2.5 text-xs font-bold text-[#354448] hover:border-[#d4a25f]"
          onClick={openApprovals}
          type="button"
          whileTap={{ scale: 0.96 }}
        >
          <Icon name="clock" size={15} />
          Approvals
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              animate={{ scale: 1, opacity: 1 }}
              className={`grid h-[18px] min-w-[18px] place-items-center rounded-full px-1.5 font-mono text-[10px] font-semibold ${pendingCount ? "bg-approval-soft text-approval" : "bg-[#eef2f1] text-faint"}`}
              exit={{ scale: 0.4, opacity: 0 }}
              initial={{ scale: 1.6, opacity: 0 }}
              key={pendingCount}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
            >
              {pendingCount}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </header>
  );
}

export function StatusDot({ tone = "green" }: { tone?: "green" | "grey" | "amber" }) {
  const color = tone === "green" ? "bg-[#20a562]" : tone === "amber" ? "bg-[#d5831c]" : "bg-faint";
  const ring = tone === "green" ? "bg-[#20a562]/40" : tone === "amber" ? "bg-[#d5831c]/40" : "bg-transparent";
  return (
    <span className="relative inline-flex size-1.5">
      {tone !== "grey" && (
        <motion.span
          animate={{ scale: [1, 2.6], opacity: [0.7, 0] }}
          className={`absolute inset-0 rounded-full ${ring}`}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <span className={`relative inline-block size-1.5 rounded-full ${color}`} />
    </span>
  );
}
