"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAppState } from "@/components/shell/AppState";
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
  return `${algo}:${digest.slice(0, 8)}…${digest.slice(-6)}`;
}

/** Plain-language summary of what approving would do, so the reviewer reads intent before payload. */
function describe(tool: string, args: Record<string, unknown>) {
  if (tool === "export_records") return `Export the "${args.dataset}" dataset as ${String(args.format ?? "a file").toUpperCase()}.`;
  if (tool === "notify_external") return `Send an email to ${String(args.to ?? "an external address")}.`;
  if (tool === "post_announcement") return "Publish a campus-wide announcement.";
  return `Run ${tool} with the arguments below.`;
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
  const recipient = approval && typeof approval.args.to === "string" ? (approval.args.to as string) : null;

  return (
    <AnimatePresence>
      {open && approval && (
        <>
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="Close approval panel"
            className="fixed inset-0 z-[49] border-0 bg-[rgba(31,35,41,.28)]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="scrim"
            onClick={closeApprovals}
            transition={{ duration: 0.15 }}
            type="button"
          />
          <motion.aside
            animate={{ x: 0 }}
            aria-label="Approval required"
            aria-modal="true"
            className="fixed top-0 right-0 bottom-0 z-50 flex w-[440px] max-w-full flex-col border-l border-line bg-surface shadow-[-12px_0_32px_rgba(31,35,41,.12)]"
            exit={{ x: "100%" }}
            initial={{ x: "100%" }}
            key="drawer"
            role="dialog"
            transition={{ type: "tween", duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <header className="border-b border-line px-5 pt-4 pb-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[12px] font-medium text-approval">
                  <span className="size-[7px] rounded-full bg-approval" />
                  Approval required
                </span>
                <button aria-label="Close" className="grid size-7 place-items-center rounded-[4px] text-faint hover:bg-canvas hover:text-ink" onClick={closeApprovals} type="button">
                  <Icon name="x" size={15} />
                </button>
              </div>
              <h2 className="mt-1.5 mb-0 text-[16px] font-semibold text-ink">{describe(approval.toolName, approval.args)}</h2>
              <p className="mt-1 mb-0 text-[12.5px] text-muted">
                The gateway paused this call. It runs once, with exactly this payload, only if you approve.
              </p>
            </header>

            <div className="scroll-thin flex-1 overflow-y-auto">
              <section className="border-b border-line px-5 py-3.5">
                <div className="flex items-baseline justify-between">
                  <span className="label">Time remaining</span>
                  <span className={`font-mono text-[15px] font-semibold tabular-nums ${expired ? "text-deny" : remaining < 60_000 ? "text-deny" : "text-ink"}`}>
                    {expired ? "expired" : formatRemaining(remaining)}
                  </span>
                </div>
                <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-line-soft">
                  <div className={`h-full transition-[width] duration-1000 ease-linear ${expired ? "bg-deny" : "bg-approval"}`} style={{ width: `${fraction * 100}%` }} />
                </div>
              </section>

              <section className="border-b border-line px-5 py-3.5">
                <span className="label">Request</span>
                <dl className="m-0 mt-2 grid grid-cols-[96px_1fr] gap-y-1.5 text-[12.5px]">
                  <dt className="text-faint">Tool</dt>
                  <dd className="m-0 flex items-center gap-1.5 font-mono text-[12px] text-ink">
                    <Icon className="text-faint" name={toolIcon(approval.toolName)} size={13} />
                    {approval.toolName}
                  </dd>
                  {recipient && (
                    <>
                      <dt className="text-faint">Recipient</dt>
                      <dd className="m-0 font-mono text-[12px] text-ink">{recipient}</dd>
                    </>
                  )}
                  <dt className="text-faint">Requested by</dt>
                  <dd className="m-0 text-ink">
                    {session ? ROLE_LABEL[session.role] : "—"} <span className="font-mono text-[11.5px] text-faint">{approval.userId}</span>
                  </dd>
                  <dt className="text-faint">Requested at</dt>
                  <dd className="m-0 font-mono text-[12px] text-muted">{new Date(approval.createdAt).toLocaleTimeString("en-GB", { hour12: false })}</dd>
                </dl>
              </section>

              <section className="border-b border-line px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="label">Exact payload</span>
                  <span className="mono-label">{Object.keys(approval.args).length} fields · canonical</span>
                </div>
                <pre className="mt-2 mb-0 overflow-x-auto rounded-[4px] border border-line bg-canvas px-3 py-2.5 font-mono text-[12px] leading-relaxed text-ink">
                  {JSON.stringify({ tool: approval.toolName, args: approval.args }, null, 2)}
                </pre>
              </section>

              <section className="px-5 py-3.5">
                <span className="label">Grant binding</span>
                <dl className="m-0 mt-2 grid grid-cols-[96px_1fr] gap-y-1.5 text-[12px]">
                  <dt className="text-faint">Session</dt>
                  <dd className="m-0 font-mono text-[11.5px] text-muted">{approval.sessionId}</dd>
                  <dt className="text-faint">Args hash</dt>
                  <dd className="m-0 font-mono text-[11.5px] text-muted" title={approval.canonicalArgsHash}>
                    {shortHash(approval.canonicalArgsHash)}
                  </dd>
                  <dt className="text-faint">Policy</dt>
                  <dd className="m-0 font-mono text-[11.5px] text-muted">v{approval.policyVersion}</dd>
                  <dt className="text-faint">Use</dt>
                  <dd className="m-0 text-muted">Single use. Replays and payload changes are rejected.</dd>
                </dl>
              </section>
            </div>

            <footer className="border-t border-line bg-canvas px-5 py-4">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  className="flex h-10 items-center justify-center gap-2 rounded-[4px] border border-deny/50 bg-surface text-[13px] font-semibold text-deny transition-colors hover:bg-deny-soft disabled:opacity-45"
                  disabled={deciding}
                  onClick={() => decide("REJECT")}
                  type="button"
                >
                  <Icon name="x" size={14} />
                  Reject
                </button>
                <button
                  className="flex h-10 items-center justify-center gap-2 rounded-[4px] border border-allow bg-allow text-[13px] font-semibold text-white transition-colors hover:bg-[#186d46] disabled:opacity-45"
                  disabled={deciding || expired}
                  onClick={() => decide("APPROVE")}
                  type="button"
                >
                  <Icon name="check" size={14} />
                  {deciding ? "Recording…" : "Approve once"}
                </button>
              </div>
              <p className="mt-2.5 mb-0 text-center text-[11.5px] text-faint">
                Your decision is written to the audit log. <span className="kbd">Esc</span> to close without deciding.
              </p>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
