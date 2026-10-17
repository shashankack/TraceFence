"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { ApprovalDrawer } from "@/components/console/ApprovalDrawer";
import { AppStateProvider } from "./AppState";
import { Sidebar } from "./Sidebar";
import { ToastHost } from "./ToastHost";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AppStateProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            {children}
          </div>
        </div>
        <ApprovalDrawer />
        <ToastHost />
      </AppStateProvider>
    </MotionConfig>
  );
}
