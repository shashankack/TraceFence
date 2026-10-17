import type { ReasonCode } from "./reasonCodes";

export type Decision = "ALLOW" | "DENY" | "REQUIRE_APPROVAL";

export type TaskStatus =
  | "CREATED"
  | "RUNNING"
  | "AWAITING_APPROVAL"
  | "COMPLETED"
  | "STOPPED"
  | "FAILED";

export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "CONSUMED";

export type TimelinePhase = "SOURCE" | "PROPOSAL" | "DECISION" | "OUTCOME";

export type PolicyAction = Decision;

export interface PolicyRule {
  tool: string;
  action: PolicyAction;
  allowedInvoiceIds?: string[];
  allowedRecipientDomains?: string[];
}

export interface AuthorizeInput {
  userId: string;
  taskId: string;
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
