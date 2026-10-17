import { FileSearch, GraduationCap, LayoutDashboard, ScrollText, ShieldCheck, SlidersHorizontal, type LucideIcon } from "lucide-react";
import type { Role } from "@/components/api/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

/** Each role gets its own navigation — there is no shared view to switch between. */
export const NAV: Record<Role, NavItem[]> = {
  student: [{ href: "/student", label: "Workspace", icon: GraduationCap, description: "Ask the campus assistant" }],
  faculty: [{ href: "/faculty", label: "Workspace", icon: FileSearch, description: "Research & requests" }],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, description: "Tenant at a glance" },
    { href: "/admin/approvals", label: "Approvals", icon: ShieldCheck, description: "Human checkpoints" },
    { href: "/admin/policies", label: "Sources & policies", icon: SlidersHorizontal, description: "Corpus and access rules" },
    { href: "/admin/audit", label: "Audit report", icon: ScrollText, description: "Evidence & verdict" },
  ],
};

export const ROLE_LABEL: Record<Role, string> = { student: "Student", faculty: "Faculty", admin: "Admin" };

export function activeItem(role: Role, pathname: string) {
  const items = NAV[role];
  return [...items].sort((a, b) => b.href.length - a.href.length).find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`)) ?? items[0];
}
