"use client";

import { ArrowRight, BookOpen, FileSearch, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, DEMO_LOGIN_HINTS } from "@/components/api/client";
import type { Role } from "@/components/api/types";
import { HOME, useAuth } from "@/components/auth/AuthProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ICONS = {
  student: BookOpen,
  faculty: FileSearch,
  admin: ShieldCheck,
} as const;

function errMessage(err: unknown) {
  if (err instanceof ApiError) {
    return err.status === 0 ? "The gateway is unreachable. Is the server running?" : err.message;
  }
  return "Something went wrong. Try again.";
}

/**
 * Full login dialog shown when a guest hits AUTH_REQUIRED  not a toast.
 */
export function LoginGate({
  open,
  reason,
  onClose,
  onSignedIn,
}: {
  open: boolean;
  reason?: string | null;
  onClose: () => void;
  /** Called after identity is adopted; parent can retry the gated message. */
  onSignedIn: (role: Role) => void | Promise<void>;
}) {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("student@nulltrace.demo");
  const [password, setPassword] = useState("demo1234");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finish = async (me: { role: Role }) => {
    // Parent closes the dialog and keeps the pending retry for the new session.
    await onSignedIn(me.role);
    if (me.role !== "guest" && me.role !== "student") {
      router.replace(HOME[me.role]);
    }
  };

  const signIn = async (e: string, p: string, key: string) => {
    setBusy(key);
    setError(null);
    try {
      const me = await login(e, p);
      await finish(me);
    } catch (err) {
      setError(errMessage(err));
      setBusy(null);
    }
  };

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    void signIn(email, password, "form");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="gap-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to continue</DialogTitle>
          <DialogDescription>
            {reason ??
              "That question needs a campus account. Public handbook topics still work as a guest."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="mt-4 border-deny/30 bg-deny-soft text-deny" variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertDescription className="text-deny">{error}</AlertDescription>
          </Alert>
        )}

        <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
          <div className="grid gap-1.5">
            <Label htmlFor="gate-email">Email</Label>
            <Input
              autoComplete="email"
              id="gate-email"
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="gate-password">Password</Label>
            <Input
              autoComplete="current-password"
              id="gate-password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          <Button className="brand-gradient text-white hover:opacity-95" disabled={!!busy} type="submit">
            {busy === "form" ? <Loader2 className="size-4 animate-spin" /> : null}
            Sign in
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <p className="mt-5 mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Demo accounts · demo1234
        </p>
        <div className="grid gap-1.5">
          {DEMO_LOGIN_HINTS.slice(0, 3).map((h) => {
            const Icon = ICONS[h.role];
            return (
              <button
                className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent/50 disabled:opacity-50"
                disabled={!!busy}
                key={h.email}
                onClick={() => void signIn(h.email, h.password, h.role)}
                type="button"
              >
                <span className="grid size-8 place-items-center rounded-md bg-accent text-primary">
                  {busy === h.role ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Icon className="size-4" strokeWidth={1.8} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{h.label}</span>
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {h.email}
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
