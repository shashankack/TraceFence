"use client";

import { ArrowRight, BookOpen, FileSearch, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/components/api/client";
import type { Role } from "@/components/api/types";
import { HOME, useAuth } from "@/components/auth/AuthProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { BlurFade } from "@/components/ui/motion/blur-fade";
import { MeshBg } from "@/components/ui/motion/mesh-bg";
import { PipelineFlow } from "@/components/ui/motion/pipeline-flow";
import { Pressable } from "@/components/ui/motion/pressable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEMO: Array<{ role: Role; email: string; label: string; detail: string; icon: typeof BookOpen }> = [
  { role: "student", email: "student@nulltrace.demo", label: "Student", detail: "Public sources only", icon: BookOpen },
  { role: "faculty", email: "faculty@nulltrace.demo", label: "Faculty", detail: "Exports need approval", icon: FileSearch },
  { role: "admin", email: "admin@nulltrace.demo", label: "Admin", detail: "Policies, approvals, audit", icon: ShieldCheck },
];
const DEMO_PASSWORD = "demo1234";

function message(err: unknown) {
  if (err instanceof ApiError) return err.status === 0 ? "The gateway is unreachable. Is the server running?" : err.message;
  return "Something went wrong. Try again.";
}

export default function LoginPage() {
  const { status, user, login, signup, continueAsGuest } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && user) router.replace(HOME[user.role]);
  }, [status, user, router]);

  const signIn = async (e: string, p: string, key: string) => {
    setBusy(key);
    setError(null);
    try {
      const me = await login(e, p);
      router.replace(HOME[me.role]);
    } catch (err) {
      setError(message(err));
      setBusy(null);
    }
  };

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    signIn(email, password, "form");
  };

  const onSignup = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    setBusy("signup");
    setError(null);
    try {
      const orgTypeRaw = String(f.get("orgType") || "college");
      const me = await signup({
        email: String(f.get("email")),
        password: String(f.get("password")),
        displayName: String(f.get("name") || "") || undefined,
        tenantName: String(f.get("org") || "") || undefined,
        orgType: orgTypeRaw === "small_business" ? "small_business" : "college",
        notifyEmail: String(f.get("notifyEmail") || "") || undefined,
      });
      router.replace(HOME[me.role]);
    } catch (err) {
      setError(message(err));
      setBusy(null);
    }
  };

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden border-r bg-background lg:flex lg:flex-col">
        <MeshBg />
        <div className="relative flex flex-1 flex-col px-12 py-10">
          <BlurFade>
            <Logo />
          </BlurFade>

          <div className="mt-auto max-w-[520px]">
            <BlurFade delay={0.08}>
              <p className="kicker m-0">Source-aware security gateway</p>
            </BlurFade>
            <BlurFade delay={0.16}>
              <h1 className="mt-3 mb-0 text-[40px] leading-[1.08] font-semibold tracking-[-0.03em]">
                Every agent action, <span className="brand-text">fenced and traced.</span>
              </h1>
            </BlurFade>
            <BlurFade delay={0.24}>
              <p className="mt-4 mb-0 max-w-[440px] text-[15px] leading-relaxed text-muted-foreground">
                The model proposes. TraceFence decides what it may read and do  in application code, per role, with an audit trail for every
                call.
              </p>
            </BlurFade>

            <PipelineFlow />
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {DEMO.map((d, i) => (
              <BlurFade delay={0.35 + i * 0.08} key={d.role}>
                <div className="rounded-xl border bg-white/80 p-4 backdrop-blur transition-transform hover:-translate-y-0.5 hover:shadow-sm">
                  <d.icon className="size-4 text-primary" strokeWidth={1.8} />
                  <p className="mt-3 mb-0 text-sm font-medium">{d.label}</p>
                  <p className="mt-0.5 mb-0 text-xs text-muted-foreground">{d.detail}</p>
                </div>
              </BlurFade>
            ))}
          </div>
          <p className="kicker mt-8 mb-0">NullTrace · synthetic campus data only</p>
        </div>
      </section>

      {/* Sign-in */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <BlurFade className="w-full max-w-[400px]" delay={0.1} y={16}>
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <Card className="gap-0 border-0 py-0 shadow-none">
            <CardHeader className="px-0">
              <CardTitle className="text-2xl font-semibold tracking-[-0.02em]">Welcome back</CardTitle>
              <CardDescription>Sign in to your TraceFence workspace.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6">
              <Tabs defaultValue="signin">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create organization</TabsTrigger>
                </TabsList>

                {error && (
                  <Alert className="mt-4 border-deny/30 bg-deny-soft text-deny" variant="destructive">
                    <TriangleAlert className="size-4" />
                    <AlertDescription className="text-deny">{error}</AlertDescription>
                  </Alert>
                )}

                <TabsContent className="mt-5" value="signin">
                  <form className="grid gap-4" onSubmit={onSubmit}>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input autoComplete="email" id="email" onChange={(e) => setEmail(e.target.value)} placeholder="you@institute.edu" required type="email" value={email} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input autoComplete="current-password" id="password" onChange={(e) => setPassword(e.target.value)} required type="password" value={password} />
                    </div>
                    <Pressable
                      className="mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md brand-gradient text-sm font-medium text-white hover:opacity-95 disabled:pointer-events-none disabled:opacity-50"
                      disabled={!!busy}
                      type="submit"
                    >
                      {busy === "form" ? <Loader2 className="size-4 animate-spin" /> : null}
                      Sign in
                      <ArrowRight className="size-4" />
                    </Pressable>
                  </form>

                  <Pressable
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/35 bg-accent/40 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-accent disabled:opacity-50"
                    disabled={!!busy}
                    onClick={async () => {
                      setBusy("guest");
                      setError(null);
                      try {
                        const me = await continueAsGuest();
                        router.replace(HOME[me.role]);
                      } catch (err) {
                        setError(message(err));
                        setBusy(null);
                      }
                    }}
                    type="button"
                  >
                    {busy === "guest" ? <Loader2 className="size-4 animate-spin" /> : <BookOpen className="size-4" />}
                    Continue as guest · public campus info only
                  </Pressable>

                  <div className="my-6 flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="kicker">Demo accounts</span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="grid gap-2">
                    {DEMO.map((d) => (
                      <Pressable
                        className="group flex w-full items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/50 disabled:opacity-50"
                        disabled={!!busy}
                        key={d.role}
                        onClick={() => void signIn(d.email, DEMO_PASSWORD, d.role)}
                        type="button"
                      >
                        <span className="grid size-8 place-items-center rounded-md bg-accent text-primary">
                          {busy === d.role ? <Loader2 className="size-4 animate-spin" /> : <d.icon className="size-4" strokeWidth={1.8} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">Continue as {d.label.toLowerCase()}</span>
                          <span className="block truncate font-mono text-[11px] text-muted-foreground">{d.email}</span>
                        </span>
                        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </Pressable>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent className="mt-5" value="signup">
                  <form className="grid gap-4" onSubmit={onSignup}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Your name</Label>
                        <Input id="name" name="name" placeholder="Ada Lovelace" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="org">Organization</Label>
                        <Input id="org" name="org" placeholder="Riverside College" required />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="orgType">Organization type</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                        defaultValue="college"
                        id="orgType"
                        name="orgType"
                        required
                      >
                        <option value="college">College / university</option>
                        <option value="small_business">Small business</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="su-email">Work email</Label>
                      <Input autoComplete="email" id="su-email" name="email" required type="email" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="notify">Approval notify email (optional)</Label>
                      <Input
                        id="notify"
                        name="notifyEmail"
                        placeholder="Defaults to work email"
                        type="email"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="su-password">Password</Label>
                      <Input autoComplete="new-password" id="su-password" minLength={8} name="password" required type="password" />
                      <p className="m-0 text-xs text-muted-foreground">At least 8 characters. You become the organization&apos;s admin.</p>
                    </div>
                    <Button className="mt-1 h-10 brand-gradient text-white hover:opacity-95" disabled={!!busy} type="submit">
                      {busy === "signup" ? <Loader2 className="size-4 animate-spin" /> : null}
                      Create organization
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Identity and role come from the server session. The interface never decides what you may access.
          </p>
        </BlurFade>
      </section>
    </main>
  );
}
