"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { CampusChat } from "@/components/workspace/CampusChat";
import { WorkspaceProvider } from "@/components/workspace/WorkspaceProvider";

export default function StudentPage() {
  return (
    <RoleGate allow={["guest", "student"]}>
      <WorkspaceProvider>
        <CampusChat role="student" />
      </WorkspaceProvider>
    </RoleGate>
  );
}
