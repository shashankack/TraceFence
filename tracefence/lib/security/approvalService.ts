import { hashArgs } from "./canonicalize";
import { ReasonCode } from "./reasonCodes";
import type { ApprovalStatus } from "./types";

export interface PendingApproval {
  id: string;
  taskId: string;
  userId: string;
  toolName: string;
  args: Record<string, unknown>;
  canonicalArgsHash: string;
  policyVersion: number;
  status: ApprovalStatus;
  expiresAt: string;
}

/** Build a pending approval record (DB persist comes next). */
export function createPendingApproval(input: {
  id: string;
  taskId: string;
  userId: string;
  toolName: string;
  args: Record<string, unknown>;
  policyVersion: number;
  expiresAt: string;
}): PendingApproval {
  return {
    ...input,
    canonicalArgsHash: hashArgs(input.args),
    status: "PENDING",
  };
}

export function assertExecutableApproval(
  pending: PendingApproval,
  attempt: {
    taskId: string;
    userId: string;
    toolName: string;
    args: Record<string, unknown>;
    policyVersion: number;
    now: Date;
  },
): { ok: true } | { ok: false; reasonCode: ReasonCode; message: string } {
  if (pending.status === "CONSUMED") {
    return {
      ok: false,
      reasonCode: ReasonCode.APPROVAL_REPLAY,
      message: "Approval already consumed",
    };
  }
  if (pending.status === "REJECTED") {
    return {
      ok: false,
      reasonCode: ReasonCode.APPROVAL_REJECTED,
      message: "Approval was rejected",
    };
  }
  if (
    pending.status !== "APPROVED" &&
    pending.status !== "PENDING"
  ) {
    return {
      ok: false,
      reasonCode: ReasonCode.APPROVAL_MISMATCH,
      message: `Invalid approval status: ${pending.status}`,
    };
  }
  if (new Date(pending.expiresAt).getTime() < attempt.now.getTime()) {
    return {
      ok: false,
      reasonCode: ReasonCode.APPROVAL_EXPIRED,
      message: "Approval expired",
    };
  }
  if (
    pending.taskId !== attempt.taskId ||
    pending.userId !== attempt.userId ||
    pending.toolName !== attempt.toolName ||
    pending.policyVersion !== attempt.policyVersion ||
    pending.canonicalArgsHash !== hashArgs(attempt.args)
  ) {
    return {
      ok: false,
      reasonCode: ReasonCode.APPROVAL_MISMATCH,
      message: "Approval binding mismatch",
    };
  }
  return { ok: true };
}
