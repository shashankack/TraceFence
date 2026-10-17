"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { CampusChat } from "@/components/workspace/CampusChat";
import { WorkspaceProvider } from "@/components/workspace/WorkspaceProvider";

export default function FacultyPage() {
  return (
    <RoleGate allow={["faculty"]}>
      <WorkspaceProvider>
        <CampusChat role="faculty" />
      </WorkspaceProvider>
    </RoleGate>
  );
}
