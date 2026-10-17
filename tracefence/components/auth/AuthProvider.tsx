"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError, getToken, setToken } from "@/components/api/client";
import type { AuthMeDTO, Role } from "@/components/api/types";

type Status = "loading" | "anonymous" | "authenticated";

interface AuthState {
  status: Status;
  user: AuthMeDTO | null;
  login: (email: string, password: string) => Promise<AuthMeDTO>;
  signup: (input: { email: string; password: string; displayName?: string; tenantName?: string }) => Promise<AuthMeDTO>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Where each role lands after sign-in. Roles never share a workspace. */
export const HOME: Record<Role, string> = {
  student: "/student",
  faculty: "/faculty",
  admin: "/admin",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<AuthMeDTO | null>(null);

  // Restore a session from this tab's stored token; identity always comes from /api/auth/me.
  useEffect(() => {
    let alive = true;
    if (!getToken()) {
      Promise.resolve().then(() => alive && setStatus("anonymous"));
      return;
    }
    api
      .me()
      .then((me) => {
        if (!alive) return;
        setUser(me);
        setStatus("authenticated");
      })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 401) setToken(null);
        setStatus("anonymous");
      });
    return () => {
      alive = false;
    };
  }, []);

  const adopt = useCallback(async (tokenValue: string) => {
    setToken(tokenValue);
    const me = await api.me();
    setUser(me);
    setStatus("authenticated");
    return me;
  }, []);

  const login = useCallback(async (email: string, password: string) => adopt((await api.login(email, password)).token), [adopt]);

  const signup = useCallback(
    async (input: { email: string; password: string; displayName?: string; tenantName?: string }) => adopt((await api.signup(input)).token),
    [adopt],
  );

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(() => ({ status, user, login, signup, logout }), [status, user, login, signup, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
