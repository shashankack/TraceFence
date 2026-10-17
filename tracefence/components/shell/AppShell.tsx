"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { ApprovalDrawer } from "@/components/console/ApprovalDrawer";
import { AppHeader } from "./AppHeader";
import { AppStateProvider } from "./AppState";
import { ToastHost } from "./ToastHost";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AppStateProvider>
        <div className="min-h-screen">
          <AppHeader />
          {children}
        </div>
        <ApprovalDrawer />
        <ToastHost />
      </AppStateProvider>
    </MotionConfig>
  );
}
