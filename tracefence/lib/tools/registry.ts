import { executeCampusTool } from "./campusTools";
import type { CampusRole } from "../security/types";

/** Campus tool registry. Legacy invoice tools removed from active path. */
export function getCampusExecutor(tenantId: string, role: CampusRole) {
  return async (tool: string, args: Record<string, unknown>) =>
    executeCampusTool(tenantId, role, tool, args);
}
