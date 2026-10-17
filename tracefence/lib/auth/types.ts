import type { CampusRole } from "../security/types";

export interface AuthContext {
  token: string;
  userId: string;
  email: string;
  displayName: string;
  tenantId: string;
  tenantName: string;
  role: CampusRole;
}
