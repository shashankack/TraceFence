import type { ReasonCode } from "./reasonCodes";

export type Decision = "ALLOW" | "DENY" | "REQUIRE_APPROVAL";

/**
 * Gateway role id. Builtins: guest | student | faculty | admin.
 * Orgs may add custom ids (stored in tenant profile + org_policy.roles).
 */
export type CampusRole = string;

export const BUILTIN_ROLES = ["guest", "student", "faculty", "admin"] as const;
export type BuiltinRole = (typeof BUILTIN_ROLES)[number];

export function isBuiltinRole(role: string): role is BuiltinRole {
  return (BUILTIN_ROLES as readonly string[]).includes(role);
}

export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "CONSUMED";

export type TimelinePhase = "SOURCE" | "PROPOSAL" | "DECISION" | "OUTCOME";

export type PolicyAction = Decision;

/** @deprecated Legacy invoice task rules  prefer role tool matrix. */
export interface PolicyRule {
  tool: string;
  action: PolicyAction;
  allowedInvoiceIds?: string[];
  allowedRecipientDomains?: string[];
}

export interface AuthorizeInput {
  userId: string;
  /** Session id for campus (legacy field name taskId kept for approvals binding). */
  taskId: string;
  tenantId: string;
  role?: CampusRole;
  policyVersion: number;
  tool: string;
  args: Record<string, unknown>;
  now: Date;
}

export interface AuthorizeResult {
  decision: Decision;
  reasonCode: ReasonCode;
  message: string;
}

export interface TimelineEvent {
  id: string;
  taskId: string;
  ts: string;
  phase?: TimelinePhase;
  sourceId?: string | null;
  sourceUrl?: string | null;
  sourceExcerpt?: string | null;
  tool?: string | null;
  argsPreview?: Record<string, unknown> | null;
  decision?: Decision | null;
  reasonCode?: ReasonCode | null;
  outcome?: string | null;
}
