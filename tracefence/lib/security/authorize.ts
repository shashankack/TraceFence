import { toolDecisionForRole } from "../campus/policy";
import { ReasonCode } from "./reasonCodes";
import type {
  AuthorizeInput,
  AuthorizeResult,
  CampusRole,
  PolicyRule,
} from "./types";

const CAMPUS_TOOLS = new Set([
  "search_docs",
  "read_document",
  "export_records",
  "post_announcement",
  "notify_external",
]);

/**
 * Role-aware policy evaluation. Default deny. DEMO_MODE must never bypass DENY.
 */
export function authorize(
  input: AuthorizeInput,
  _rules: PolicyRule[] = [],
  opts: { taskActive?: boolean; expiresAt?: string | null } = {},
): AuthorizeResult {
  if (opts.taskActive === false) {
    return {
      decision: "DENY",
      reasonCode: ReasonCode.DENIED_TASK_INACTIVE,
      message: "Session is not active",
    };
  }

  if (opts.expiresAt && new Date(opts.expiresAt).getTime() < input.now.getTime()) {
    return {
      decision: "DENY",
      reasonCode: ReasonCode.DENIED_TASK_EXPIRED,
      message: "Session has expired",
    };
  }

  if (!CAMPUS_TOOLS.has(input.tool)) {
    return {
      decision: "DENY",
      reasonCode: ReasonCode.DENIED_TOOL_UNKNOWN,
      message: `Unknown tool: ${input.tool}`,
    };
  }

  const role = input.role as CampusRole | undefined;
  if (!role) {
    return {
      decision: "DENY",
      reasonCode: ReasonCode.DENIED_ROLE,
      message: "Missing trusted role on authorize input",
    };
  }

  const action = toolDecisionForRole(role, input.tool);
  if (!action) {
    return {
      decision: "DENY",
      reasonCode: ReasonCode.DENIED_DEFAULT,
      message: "No matching policy rule (default deny)",
    };
  }

  if (action === "DENY") {
    return {
      decision: "DENY",
      reasonCode:
        input.tool === "export_records"
          ? ReasonCode.DENIED_EXPORT
          : ReasonCode.DENIED_ROLE,
      message: `Tool ${input.tool} denied for role ${role}`,
    };
  }

  if (action === "REQUIRE_APPROVAL") {
    return {
      decision: "REQUIRE_APPROVAL",
      reasonCode: ReasonCode.REQUIRES_APPROVAL,
      message: `Tool ${input.tool} requires exact-action approval`,
    };
  }

  return {
    decision: "ALLOW",
    reasonCode: ReasonCode.ALLOWED,
    message: "Policy allows this call",
  };
}
