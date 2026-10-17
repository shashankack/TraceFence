import type { Metadata } from "next";
import { OrgView } from "@/components/org/OrgView";

export const metadata: Metadata = { title: "Org · TraceFence" };

export default function OrgPage() {
  return <OrgView />;
}
