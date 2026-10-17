import { Building2, FileSearch, GraduationCap, LayoutDashboard, ScrollText, ShieldCheck, SlidersHorizontal, type LucideIcon } from "lucide-react";
import type { AuthMeDTO, BuiltinRole, OrgType, Role, RoleLabels } from "@/components/api/types";
import { workspaceFor } from "@/components/auth/home";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

const STUDENT_NAV: NavItem[] = [
  { href: "/student", label: "Workspace", icon: GraduationCap, description: "Ask the campus assistant" },
];
const GUEST_NAV: NavItem[] = [
  { href: "/student", label: "Workspace", icon: GraduationCap, description: "Public campus questions" },
];
const FACULTY_NAV: NavItem[] = [
  { href: "/faculty", label: "Workspace", icon: FileSearch, description: "Research & requests" },
];
const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, description: "Tenant at a glance" },
  { href: "/admin/approvals", label: "Approvals", icon: ShieldCheck, description: "Human checkpoints" },
  { href: "/admin/organization", label: "Organization", icon: Building2, description: "Org profile & alerts" },
  { href: "/admin/policies", label: "Sources & policies", icon: SlidersHorizontal, description: "Corpus and access rules" },
  { href: "/admin/audit", label: "Audit report", icon: ScrollText, description: "Evidence & verdict" },
];

/** Each builtin role gets its own navigation  there is no shared view to switch between. */
export const NAV: Record<BuiltinRole, NavItem[]> = {
  guest: GUEST_NAV,
  student: STUDENT_NAV,
  faculty: FACULTY_NAV,
  admin: ADMIN_NAV,
};

export function navFor(user: Pick<AuthMeDTO, "role" | "customRoles">): NavItem[] {
  if (user.role === "admin") return ADMIN_NAV;
  if (user.role === "guest") return GUEST_NAV;
  if (user.role === "faculty") return FACULTY_NAV;
  if (user.role === "student") return STUDENT_NAV;
  return workspaceFor(user) === "faculty" ? FACULTY_NAV : STUDENT_NAV;
}

/** Fallback college labels; prefer roleLabelFor(role, orgType, custom). */
export const ROLE_LABEL: Record<BuiltinRole, string> = {
  guest: "Guest",
  student: "Student",
  faculty: "Faculty",
  admin: "Admin",
};

const BUSINESS_LABEL: Record<BuiltinRole, string> = {
  guest: "Guest",
  student: "Member",
  faculty: "Manager",
  admin: "Admin",
};

/**
 * Display name for a gateway role.
 * Custom org labels win; otherwise college vs business presets.
 * Permissions always follow the gateway role id, never this string.
 */
export function roleLabelFor(
  role: Role,
  orgType?: OrgType | null,
  custom?: RoleLabels | null,
): string {
  const named = custom?.[role]?.trim();
  if (named) return named;
  if (orgType === "small_business") {
    return BUSINESS_LABEL[role as BuiltinRole] ?? role;
  }
  return ROLE_LABEL[role as BuiltinRole] ?? role;
}

export function activeItem(role: Role, pathname: string, user?: Pick<AuthMeDTO, "role" | "customRoles">) {
  const items = user ? navFor(user) : NAV[role as BuiltinRole] ?? STUDENT_NAV;
  return [...items].sort((a, b) => b.href.length - a.href.length).find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`)) ?? items[0];
}
