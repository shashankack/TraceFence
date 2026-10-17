"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Role } from "@/components/api/types";
import { Skeleton } from "@/components/ui/skeleton";
import { HOME, useAuth } from "./AuthProvider";

/**
 * Client-side routing guard. It only decides which workspace to show; every API call is still
 * authorized by the server on the Bearer token, so hiding a view is never the security control.
 */
export function RoleGate({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const permitted = status === "authenticated" && !!user && allow.includes(user.role);

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
    else if (status === "authenticated" && user && !allow.includes(user.role)) router.replace(HOME[user.role]);
  }, [status, user, allow, router]);

  if (!permitted) {
    return (
      <div className="grid gap-4 p-6 md:grid-cols-3">
        <Skeleton className="h-40 md:col-span-2" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64 md:col-span-3" />
      </div>
    );
  }
  return <>{children}</>;
}
