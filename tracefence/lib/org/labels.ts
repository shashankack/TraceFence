import type { CampusRole } from "../security/types";
import type { OrgType } from "./types";

const COLLEGE: Record<CampusRole, string> = {
  guest: "Guest",
  student: "Student",
  faculty: "Faculty",
  admin: "Admin",
};

const BUSINESS: Record<CampusRole, string> = {
  guest: "Guest",
  student: "Member",
  faculty: "Manager",
  admin: "Admin",
};

export function roleLabel(role: CampusRole, orgType: OrgType = "college"): string {
  return (orgType === "small_business" ? BUSINESS : COLLEGE)[role] ?? role;
}

export function orgTypeLabel(orgType: OrgType): string {
  return orgType === "small_business" ? "Small business" : "College / university";
}

export const ORG_TYPE_OPTIONS: Array<{ value: OrgType; label: string }> = [
  { value: "college", label: "College / university" },
  { value: "small_business", label: "Small business" },
];
