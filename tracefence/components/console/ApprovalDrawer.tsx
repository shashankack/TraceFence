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
  return `${algo}:${digest.slice(0, 4)}…${digest.slice(-4)}`;
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

  return (
    <AnimatePresence>
      {open && approval && (
        <>
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="Close checkpoint"
            className="fixed inset-x-0 top-[72px] bottom-0 z-[49] border-0 bg-[rgba(16,35,39,.14)]"
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
            className="fixed top-[72px] right-0 bottom-0 z-50 flex w-[460px] max-w-full flex-col border-l border-line-strong bg-white shadow-[-16px_0_35px_rgba(15,40,44,.13)]"
            exit={{ x: "100%" }}
            initial={{ x: "100%" }}
            key="drawer"
            role="dialog"
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <div className="flex min-h-[68px] items-center justify-between border-b border-line px-5 py-3">
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-[.75px] text-teal">Human checkpoint</span>
                <h2 className="mt-0.5 font-display text-lg font-bold tracking-tight">Approve exact action</h2>
              </div>
              <button
                aria-label="Close"
                className="grid size-8 place-items-center rounded-lg border border-line bg-white text-muted hover:text-ink"
                onClick={closeApprovals}
                type="button"
              >
                <Icon name="x" size={17} />
              </button>
            </div>

            <div className="scroll-thin flex-1 overflow-y-auto pb-4">
              <Stagger>
                <div className="mx-4 mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[10px] border border-[#ead1a9] bg-[#fffaf1] p-3">
                  <CountdownRing expired={expired} fraction={fraction} />
                  <div className="flex flex-col gap-0.5">
                    <strong className="text-sm">{expired ? "Approval window expired" : "Gateway paused execution"}</strong>
                    <p className="m-0 text-xs text-[#806a4d]">Review the exact tool and arguments below.</p>
                  </div>
                  <time className={`font-mono text-sm font-semibold ${expired ? "text-deny" : "text-approval"}`}>
                    {formatRemaining(remaining)}
                  </time>
                </div>

                <div className="mx-4 mt-3 overflow-hidden rounded-[10px] border border-line">
                  <div className="flex items-center gap-3 border-b border-line bg-[#fbfcfc] p-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-approval-soft text-approval">
                      <Icon name={toolIcon(approval.toolName)} size={18} />
                    </span>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <small className="text-[11px] text-faint">Proposed tool</small>
                      <code className="font-mono text-sm font-semibold">{approval.toolName}</code>
                    </div>
                    <DecisionChip decision="REQUIRE_APPROVAL" />
                  </div>
                  <SectionLabel>Exact arguments</SectionLabel>
                  {Object.entries(approval.args).map(([k, v]) => (
                    <Row key={k} label={k}>
                      <code className="font-mono text-xs text-[#334346]">{typeof v === "string" ? v : JSON.stringify(v)}</code>
                    </Row>
                  ))}
                </div>

                <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-teal-soft px-3 py-2.5 text-xs text-teal">
                  <Icon name="user" size={14} />
                  <span>
                    Requested by <strong>{session ? ROLE_LABEL[session.role] : approval.userId}</strong> · {approval.userId}
                  </span>
                </div>

                <div className="mx-4 mt-3 overflow-hidden rounded-[10px] border border-line">
                  <SectionLabel>Cryptographically bound to</SectionLabel>
                  <Row label="Session">
                    <code className="font-mono text-xs text-[#334346]">{approval.sessionId}</code>
                  </Row>
                  <Row label="Args hash">
                    <code className="font-mono text-xs text-[#334346]" title={approval.canonicalArgsHash}>
                      {shortHash(approval.canonicalArgsHash)}
                    </code>
                  </Row>
                  <Row label="Policy">
                    <code className="font-mono text-xs text-[#334346]">v{approval.policyVersion}</code>
                  </Row>
                  <Row label="Grant">
                    <strong className="flex items-center gap-1 text-xs">
                      <Icon name="lock" size={12} />
                      Single use
                    </strong>
                  </Row>
                </div>

                <p className="mx-4 mt-3 flex items-center gap-1.5 text-xs text-muted">
                  <Icon name="lock" size={13} />
                  Any payload change requires a new approval.
                </p>
              </Stagger>
            </div>

            <div className="grid grid-cols-[1.25fr_.75fr] gap-2 border-t border-line bg-white p-4">
              <motion.button
                className="flex h-11 items-center justify-center gap-1.5 rounded-lg border border-allow bg-allow text-sm font-bold text-white hover:bg-[#126f3f] disabled:opacity-50"
                disabled={deciding || expired}
                onClick={() => decide("APPROVE")}
                type="button"
                whileTap={{ scale: 0.97 }}
              >
                <Icon name="check" size={16} />
                {deciding ? "Recording…" : "Approve once"}
              </motion.button>
              <motion.button
                className="flex h-11 items-center justify-center gap-1.5 rounded-lg border border-[#e5b9b9] bg-white text-sm font-bold text-deny hover:bg-deny-soft disabled:opacity-50"
                disabled={deciding}
                onClick={() => decide("REJECT")}
                type="button"
                whileTap={{ scale: 0.97 }}
              >
                <Icon name="x" size={15} />
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
      initial="hidden"
      variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } } }}
    >
      {(Array.isArray(children) ? children : [children]).map((child, i) => (
        <motion.div
          key={i}
          variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block border-b border-line bg-[#f6f8f8] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.65px] text-faint">
      {children}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] items-center gap-2 border-b border-[#edf1f0] px-3 py-2.5 text-xs last:border-b-0">
      <span className="text-muted">{label}</span>
      {children}
    </div>
  );
}

function CountdownRing({ fraction, expired }: { fraction: number; expired: boolean }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative grid size-9 place-items-center rounded-lg bg-approval-soft text-approval">
      <svg className="absolute inset-0 -rotate-90" height="36" viewBox="0 0 36 36" width="36">
        <circle cx="18" cy="18" fill="none" r={r} stroke="rgba(170,98,8,.15)" strokeWidth="2.5" />
        <motion.circle
          animate={{ strokeDashoffset: c * (1 - fraction) }}
          cx="18"
          cy="18"
          fill="none"
          r={r}
          stroke={expired ? "var(--color-deny)" : "var(--color-approval)"}
          strokeDasharray={c}
          strokeLinecap="round"
          strokeWidth="2.5"
          transition={{ duration: 0.9, ease: "linear" }}
        />
      </svg>
      <Icon name="clock" size={15} />
    </span>
  );
}
