import { executeCampusTool } from "./campusTools";
import type { CampusRole } from "../security/types";

export type CampusExecutorContext = {
  sessionId?: string;
  userId?: string;
};

/** Campus tool registry. Legacy invoice tools removed from active path. */
export function getCampusExecutor(
  tenantId: string,
  role: CampusRole,
  ctx: CampusExecutorContext = {},
) {
  return async (tool: string, args: Record<string, unknown>) =>
    executeCampusTool(tenantId, role, tool, args, ctx);
}
