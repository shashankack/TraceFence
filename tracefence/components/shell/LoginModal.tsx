"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DEMO_LOGIN_HINTS } from "@/components/api/client";
import { Icon } from "@/components/ui/Icon";

export function LoginModal({
  open,
  reason,
  onClose,
  onSubmit,
}: {
  open: boolean;
  reason?: string | null;
  onClose: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("student@nulltrace.demo");
  const [password, setPassword] = useState("demo1234");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(email.trim(), password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="glass w-full max-w-md rounded-2xl border border-line p-5 shadow-2xl"
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            onClick={(ev) => ev.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="m-0 font-mono text-[10px] tracking-[.14em] text-faint uppercase">
                  TraceFence identity
                </p>
                <h2 className="mt-1 mb-0 font-display text-xl font-semibold text-ink" id="login-title">
                  Sign in
                </h2>
                <p className="mt-1 mb-0 text-sm text-muted">
                  {reason ??
                    "Public campus questions work as Guest. Sign in for internal, confidential, or privileged tools."}
                </p>
              </div>
              <button
                className="rounded-lg border border-line p-1.5 text-faint hover:text-ink"
                onClick={onClose}
                type="button"
                aria-label="Close"
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            <form className="space-y-3" onSubmit={submit}>
              <label className="block">
                <span className="font-mono text-[10px] tracking-wider text-faint uppercase">Email</span>
                <input
                  autoComplete="username"
                  className="mt-1 w-full rounded-lg border border-line bg-black/30 px-3 py-2 text-sm text-ink outline-none focus:border-neon/50"
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  value={email}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] tracking-wider text-faint uppercase">Password</span>
                <input
                  autoComplete="current-password"
                  className="mt-1 w-full rounded-lg border border-line bg-black/30 px-3 py-2 text-sm text-ink outline-none focus:border-neon/50"
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  value={password}
                />
              </label>
              {error && (
                <p className="m-0 rounded-lg border border-deny/40 bg-deny-soft px-3 py-2 text-xs text-deny">
                  {error}
                </p>
              )}
              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-neon/40 bg-neon-soft py-2.5 text-sm font-semibold text-neon disabled:opacity-50"
                disabled={busy}
                type="submit"
              >
                <Icon name="fingerprint" size={15} />
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div className="mt-4">
              <p className="mb-2 font-mono text-[10px] tracking-[.12em] text-faint uppercase">
                Demo accounts · password demo1234
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_LOGIN_HINTS.slice(0, 6).map((h) => (
                  <button
                    className="rounded-md border border-line bg-black/20 px-2 py-1 text-[11px] text-muted hover:border-neon/35 hover:text-ink"
                    key={h.email}
                    onClick={() => {
                      setEmail(h.email);
                      setPassword(h.password);
                    }}
                    type="button"
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
