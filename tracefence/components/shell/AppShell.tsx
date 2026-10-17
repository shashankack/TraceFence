"use client";

import { ChevronsUpDown, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/components/api/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/components/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LiveDot } from "@/components/ui/decision-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/ui/logo";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV, ROLE_LABEL, activeItem } from "./nav";

function initials(name?: string | null, email?: string) {
  const src = name || email || "?";
  return src
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Gateway reachability, checked against the audit endpoint every 15s. */
function useGatewayStatus() {
  const [up, setUp] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    const tick = () =>
      api
        .audit()
        .then(() => alive && setUp(true))
        .catch(() => alive && setUp(false));
    tick();
    const t = setInterval(tick, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  return up;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const gateway = useGatewayStatus();
  if (!user) return <>{children}</>;
  const current = activeItem(user.role, pathname);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r bg-sidebar lg:flex">
        <SidebarBody pathname={pathname} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white/85 px-4 backdrop-blur sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button aria-label="Open navigation" className="lg:hidden" size="icon" variant="ghost">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[272px] p-0" side="left">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody pathname={pathname} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <p className="kicker m-0 hidden sm:block">
              {user.tenantName ?? user.tenantId} · {ROLE_LABEL[user.role]}
            </p>
            <h1 className="m-0 truncate text-[15px] leading-5 font-semibold tracking-[-0.01em]">{current.label}</h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Badge className="hidden h-7 gap-2 rounded-full px-3 font-mono text-[11px] font-normal sm:inline-flex" variant="outline">
              <LiveDot pulse={gateway === true} tone={gateway === false ? "deny" : gateway ? "allow" : "primary"} />
              {gateway === false ? "gateway unreachable" : gateway ? "gateway enforcing" : "connecting"}
            </Badge>
            <Badge className="hidden h-7 rounded-full border-violet/20 bg-violet-soft px-3 text-[11px] font-medium text-violet md:inline-flex" variant="outline">
              {ROLE_LABEL[user.role]} view
            </Badge>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function SidebarBody({ pathname }: { pathname: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  if (!user) return null;
  const items = NAV[user.role];

  const signOut = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="flex h-full flex-col">
      <Link className="flex h-14 items-center border-b px-5" href={items[0].href}>
        <Logo />
      </Link>

      <nav aria-label="Primary" className="flex flex-col gap-1 p-3">
        <p className="kicker m-0 px-2 pt-1 pb-2">{ROLE_LABEL[user.role]} workspace</p>
        {items.map((item) => {
          const active = activeItem(user.role, pathname).href === item.href;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              href={item.href}
              key={item.href}
            >
              <item.icon className={cn("size-4", active ? "text-primary" : "")} strokeWidth={1.8} />
              <span className="flex min-w-0 flex-col">
                <span className="font-medium">{item.label}</span>
                <span className="truncate text-[11.5px] text-muted-foreground">{item.description}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mt-2 rounded-lg border border-dashed p-3 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Model proposes, gateway decides.</span> Every source and tool call is authorized
        server-side against your role.
      </div>

      <div className="mt-auto border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted" type="button">
              <Avatar className="size-8">
                <AvatarFallback className="brand-gradient text-xs font-semibold text-white">{initials(user.displayName, user.email)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{user.displayName ?? user.email}</span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">{user.email}</span>
              </span>
              <ChevronsUpDown className="size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" side="top">
            <DropdownMenuLabel className="font-normal">
              <span className="block text-sm font-medium">{user.displayName ?? user.email}</span>
              <span className="block font-mono text-[11px] text-muted-foreground">
                {ROLE_LABEL[user.role]} · {user.tenantId}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOut}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
