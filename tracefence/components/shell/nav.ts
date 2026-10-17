import { Building2, FileSearch, GraduationCap, LayoutDashboard, ScrollText, ShieldCheck, SlidersHorizontal, type LucideIcon } from "lucide-react";
import type { OrgType, Role } from "@/components/api/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

/** Each role gets its own navigation  there is no shared view to switch between. */
export const NAV: Record<Role, NavItem[]> = {
  guest: [{ href: "/student", label: "Workspace", icon: GraduationCap, description: "Public campus questions" }],
  student: [{ href: "/student", label: "Workspace", icon: GraduationCap, description: "Ask the campus assistant" }],
  faculty: [{ href: "/faculty", label: "Workspace", icon: FileSearch, description: "Research & requests" }],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, description: "Tenant at a glance" },
    { href: "/admin/approvals", label: "Approvals", icon: ShieldCheck, description: "Human checkpoints" },
    { href: "/admin/organization", label: "Organization", icon: Building2, description: "Org profile & alerts" },
    { href: "/admin/policies", label: "Sources & policies", icon: SlidersHorizontal, description: "Corpus and access rules" },
    { href: "/admin/audit", label: "Audit report", icon: ScrollText, description: "Evidence & verdict" },
  ],
};

/** Fallback college labels; prefer roleLabelFor(role, orgType). */
export const ROLE_LABEL: Record<Role, string> = {
  guest: "Guest",
  student: "Student",
  faculty: "Faculty",
  admin: "Admin",
};

const BUSINESS_LABEL: Record<Role, string> = {
  guest: "Guest",
  student: "Member",
  faculty: "Manager",
  admin: "Admin",
};

export function roleLabelFor(role: Role, orgType?: OrgType | null): string {
  if (orgType === "small_business") return BUSINESS_LABEL[role];
  return ROLE_LABEL[role];
}

export function activeItem(role: Role, pathname: string) {
  const items = NAV[role];
  return [...items].sort((a, b) => b.href.length - a.href.length).find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`)) ?? items[0];
}
