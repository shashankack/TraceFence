import type { CampusRole } from "../security/types";
import type { OrgType, RoleLabels } from "./types";

const COLLEGE: Record<string, string> = {
  guest: "Guest",
  student: "Student",
  faculty: "Faculty",
  admin: "Admin",
};

const BUSINESS: Record<string, string> = {
  guest: "Guest",
  student: "Member",
  faculty: "Manager",
  admin: "Admin",
};

export function roleLabel(
  role: CampusRole,
  orgType: OrgType = "college",
  custom?: RoleLabels | null,
): string {
  const named = custom?.[role]?.trim();
  if (named) return named;
  return (orgType === "small_business" ? BUSINESS : COLLEGE)[role] ?? role;
}

export function orgTypeLabel(orgType: OrgType): string {
  return orgType === "small_business" ? "Small business" : "College / university";
}

export const ORG_TYPE_OPTIONS: Array<{ value: OrgType; label: string }> = [
  { value: "college", label: "College / university" },
  { value: "small_business", label: "Small business" },
];

export const EDITABLE_ROLES = ["guest", "student", "faculty", "admin"] as const;
