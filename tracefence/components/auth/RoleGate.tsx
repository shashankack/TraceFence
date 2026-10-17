"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Role } from "@/components/api/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "./AuthProvider";
import { homeFor, workspaceFor } from "./home";

/**
 * Client-side routing guard. It only decides which workspace to show; every API call is still
 * authorized by the server on the Bearer token, so hiding a view is never the security control.
 *
 * `allow` matches exact role ids. `workspace` also admits org-defined roles mapped to that console.
 */
export function RoleGate({
  allow,
  workspace,
  children,
}: {
  allow?: Role[];
  workspace?: "student" | "faculty" | "admin";
  children: ReactNode;
}) {
  const { status, user } = useAuth();
  const router = useRouter();
  const allowedExact = !!user && !!allow?.includes(user.role);
  const allowedWorkspace =
    !!user && !!workspace && workspaceFor(user) === workspace;
  const permitted =
    status === "authenticated" && !!user && (allowedExact || allowedWorkspace);

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
    else if (status === "authenticated" && user && !permitted) {
      router.replace(homeFor(user));
    }
  }, [status, user, permitted, router]);

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
