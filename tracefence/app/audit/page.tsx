import type { Metadata } from "next";
import { AuditView } from "@/components/audit/AuditView";

export const metadata: Metadata = { title: "Audit · TraceFence" };

export default function AuditPage() {
  return <AuditView />;
}
