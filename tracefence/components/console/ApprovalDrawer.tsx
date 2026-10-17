"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAppState } from "@/components/shell/AppState";
import { DecisionChip } from "@/components/ui/DecisionChip";
import { Icon, toolIcon } from "@/components/ui/Icon";
import { ROLE_LABEL } from "./catalog";

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

function formatRemaining(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function shortHash(hash: string) {
  const [algo, digest = hash] = hash.includes(":") ? hash.split(":") : ["sha256", hash];
  return `${algo}:${digest.slice(0, 6)}…${digest.slice(-6)}`;
}

export function ApprovalDrawer() {
  const { approval, drawerOpen, closeApprovals, decide, deciding, session } = useAppState();
  const open = drawerOpen && approval?.status === "PENDING";
  const now = useNow(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeApprovals();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeApprovals]);

  const expiresAt = approval ? new Date(approval.expiresAt).getTime() : 0;
  const createdAt = approval ? new Date(approval.createdAt).getTime() : 0;
  const remaining = expiresAt - now;
  const total = Math.max(1, expiresAt - createdAt);
  const fraction = Math.min(1, Math.max(0, remaining / total));
  const expired = remaining <= 0;
  const urgent = !expired && remaining < 60_000;

  return (
    <AnimatePresence>
      {open && approval && (
        <>
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="Close checkpoint"
            className="fixed inset-0 z-[49] border-0 bg-[rgba(2,5,12,.6)] backdrop-blur-[2px]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="scrim"
            onClick={closeApprovals}
            type="button"
          />
          <motion.aside
            animate={{ x: 0 }}
            aria-label="Approve exact action"
            aria-modal="true"
            className="fixed top-0 right-0 bottom-0 z-50 flex w-[480px] max-w-full flex-col border-l border-approval/35 bg-[rgba(8,13,26,.96)] shadow-[-30px_0_80px_rgba(0,0,0,.55)] backdrop-blur-xl"
            exit={{ x: "100%" }}
            initial={{ x: "100%" }}
            key="drawer"
            role="dialog"
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <span className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-approval/0 via-approval to-approval/0" />
            <div className="flex min-h-[68px] items-center justify-between border-b border-line px-5 py-3">
              <div>
                <span className="eyebrow block text-approval!">Human checkpoint · REQUIRE_APPROVAL</span>
                <h2 className="mt-0.5 font-display text-xl font-semibold tracking-tight text-ink">Approve exact action</h2>
              </div>
              <button
                aria-label="Close"
                className="grid size-8 place-items-center rounded-lg border border-line text-muted hover:text-ink"
                onClick={closeApprovals}
                type="button"
              >
                <Icon name="x" size={17} />
              </button>
            </div>

            <div className="scroll-thin flex-1 overflow-y-auto px-5 pt-4 pb-5">
              <Stagger>
                <div
                  className={`flex items-center gap-4 rounded-xl border p-4 ${expired ? "border-deny/45 bg-deny-soft" : "glow-approval border-approval/45 bg-approval-soft"}`}
                >
                  <CountdownRing expired={expired} fraction={fraction} />
                  <div className="min-w-0 flex-1">
                    <strong className="block text-sm text-ink">{expired ? "Approval window expired" : "Execution paused by gateway"}</strong>
                    <p className="m-0 text-xs text-muted">
                      {expired ? "Ask the requester to retry for a new grant." : "Grant expires when the timer reaches zero."}
                    </p>
                  </div>
                  <motion.time
                    animate={urgent ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
                    className={`font-mono text-2xl font-semibold tabular-nums ${expired ? "text-deny" : "text-approval"}`}
                    transition={{ duration: 1, repeat: urgent ? Infinity : 0 }}
                  >
                    {formatRemaining(remaining)}
                  </motion.time>
                </div>

                <div className="overflow-hidden rounded-xl border border-line bg-black/25">
                  <div className="flex items-center gap-3 border-b border-line p-3">
                    <span className="grid size-10 place-items-center rounded-lg border border-approval/35 bg-approval-soft text-approval">
                      <Icon name={toolIcon(approval.toolName)} size={19} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <small className="text-[11px] text-faint">Proposed by the model</small>
                      <code className="font-mono text-[15px] font-semibold text-ink">{approval.toolName}</code>
                    </div>
                    <DecisionChip decision="REQUIRE_APPROVAL" glow />
                  </div>
                  <div className="flex items-center justify-between px-3 pt-2.5">
                    <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-faint uppercase">Exact payload</span>
                    <span className="font-mono text-[10px] text-faint">{Object.keys(approval.args).length} fields</span>
                  </div>
                  <pre className="m-3 mt-2 overflow-x-auto rounded-lg border border-approval/20 bg-black/45 p-3 font-mono text-[12px] leading-relaxed text-ink">
                    {JSON.stringify({ tool: approval.toolName, args: approval.args }, null, 2)}
                  </pre>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-neon/25 bg-neon-soft px-3 py-2.5 text-xs text-ink/85">
                  <Icon className="text-neon" name="user" size={14} />
                  <span>
                    Requested by <strong className="text-ink">{session ? ROLE_LABEL[session.role] : "requester"}</strong>
                    <code className="ml-1.5 font-mono text-[11px] text-faint">{approval.userId}</code>
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-line bg-black/25">
                  <span className="block border-b border-line px-3 py-2 font-mono text-[10px] font-semibold tracking-[.12em] text-faint uppercase">
                    Grant is bound to
                  </span>
                  <Row label="Session">{approval.sessionId}</Row>
                  <Row label="Args hash" title={approval.canonicalArgsHash}>
                    {shortHash(approval.canonicalArgsHash)}
                  </Row>
                  <Row label="Policy">v{approval.policyVersion}</Row>
                  <Row label="Expires">{new Date(approval.expiresAt).toLocaleTimeString("en-GB", { hour12: false })}</Row>
                  <Row label="Use">
                    <span className="flex items-center gap-1 text-approval">
                      <Icon name="lock" size={12} />
                      Single use — replay is rejected
                    </span>
                  </Row>
                </div>

                <p className="m-0 flex items-center gap-1.5 text-xs text-muted">
                  <Icon name="shield" size={13} />
                  Any change to the payload requires a new approval.
                </p>
              </Stagger>
            </div>

            <div className="grid grid-cols-[1.4fr_1fr] gap-2.5 border-t border-line bg-black/30 p-4">
              <motion.button
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-allow text-sm font-bold text-[#03140c] shadow-[0_0_24px_rgba(46,229,157,.4)] hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
                disabled={deciding || expired}
                onClick={() => decide("APPROVE")}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon name="check" size={17} />
                {deciding ? "Recording…" : "Approve once"}
              </motion.button>
              <motion.button
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-deny/55 bg-deny-soft text-sm font-bold text-deny hover:bg-deny/20 disabled:opacity-40"
                disabled={deciding}
                onClick={() => decide("REJECT")}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon name="x" size={16} />
                Reject
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Stagger({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      animate="show"
      className="space-y-3"
      initial="hidden"
      variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } } }}
    >
      {(Array.isArray(children) ? children : [children]).map((child, i) => (
        <motion.div key={i} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

function Row({ label, children, title }: { label: string; children: React.ReactNode; title?: string }) {
  return (
    <div className="grid grid-cols-[90px_1fr] items-center gap-2 border-b border-line px-3 py-2.5 text-xs last:border-b-0">
      <span className="text-faint">{label}</span>
      <code className="truncate font-mono text-[11.5px] text-ink/90" title={title}>
        {children}
      </code>
    </div>
  );
}

function CountdownRing({ fraction, expired }: { fraction: number; expired: boolean }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const color = expired ? "var(--color-deny)" : "var(--color-approval)";
  return (
    <span className="relative grid size-14 flex-none place-items-center">
      <svg className="absolute inset-0 -rotate-90" height="56" viewBox="0 0 56 56" width="56">
        <circle cx="28" cy="28" fill="none" r={r} stroke="rgba(255,255,255,.08)" strokeWidth="3.5" />
        <motion.circle
          animate={{ strokeDashoffset: c * (1 - fraction) }}
          cx="28"
          cy="28"
          fill="none"
          r={r}
          stroke={color}
          strokeDasharray={c}
          strokeLinecap="round"
          strokeWidth="3.5"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          transition={{ duration: 0.9, ease: "linear" }}
        />
      </svg>
      <Icon className={expired ? "text-deny" : "text-approval"} name="clock" size={20} />
    </span>
  );
}
