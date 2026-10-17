"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { BentoGrid } from "@/components/ui/bento";
import { AssistantTile } from "@/components/workspace/AssistantTile";
import { RequestsTile } from "@/components/workspace/RequestsTile";
import { SourceTile } from "@/components/workspace/SourceTile";
import { SessionStats, WelcomeTile } from "@/components/workspace/SummaryTiles";
import { TraceTile } from "@/components/workspace/TraceTile";
import { WorkspaceProvider } from "@/components/workspace/WorkspaceProvider";

export default function FacultyPage() {
  return (
    <RoleGate allow={["faculty"]}>
      <WorkspaceProvider>
        <main className="p-4 sm:p-6">
          <BentoGrid>
            <WelcomeTile className="md:col-span-6 xl:col-span-4" />
            <div className="grid grid-cols-2 gap-4 md:col-span-6 xl:col-span-8 xl:grid-cols-8">
              <SessionStats />
            </div>
            <AssistantTile className="min-h-[620px] md:col-span-6 xl:col-span-5 xl:row-span-2" role="faculty" />
            <RequestsTile className="md:col-span-6 xl:col-span-7" />
            <TraceTile className="md:col-span-6 xl:col-span-7" roleLabel="Faculty" />
            <SourceTile className="md:col-span-6 xl:col-span-12" />
          </BentoGrid>
        </main>
      </WorkspaceProvider>
    </RoleGate>
  );
}
