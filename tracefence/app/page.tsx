"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { homeFor } from "@/components/auth/home";
import { LogoMark } from "@/components/ui/logo";

/** Entry point: send signed-in users to their role's workspace, everyone else to sign-in. */
export default function Index() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
    if (status === "authenticated" && user) router.replace(homeFor(user));
  }, [status, user, router]);

  return (
    <main className="grid min-h-screen place-items-center">
      <LogoMark className="animate-pulse" />
    </main>
  );
}
