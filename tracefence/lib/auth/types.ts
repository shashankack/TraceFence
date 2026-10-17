import type { CustomOrgRole, OrgType, RoleLabels } from "../org/types";
import type { CampusRole } from "../security/types";

export interface AuthContext {
  token: string;
  userId: string;
  email: string;
  displayName: string;
  tenantId: string;
  tenantName: string;
  orgType: OrgType;
  roleLabels?: RoleLabels;
  customRoles?: CustomOrgRole[];
  role: CampusRole;
}
