import { ReasonCode } from "./reasonCodes";
import type { AuthorizeInput, AuthorizeResult, PolicyRule } from "./types";

/**
 * Pure policy evaluation stub.
 * Full rule matching lands in the next backend slice; default deny holds.
 */
export function authorize(
  input: AuthorizeInput,
  rules: PolicyRule[] = [],
  opts: { taskActive?: boolean; expiresAt?: string | null } = {},
): AuthorizeResult {
  if (opts.taskActive === false) {
    return {
      decision: "DENY",
      reasonCode: ReasonCode.DENIED_TASK_INACTIVE,
      message: "Task is not active",
    };
  }

  if (opts.expiresAt && new Date(opts.expiresAt).getTime() < input.now.getTime()) {
    return {
      decision: "DENY",
      reasonCode: ReasonCode.DENIED_TASK_EXPIRED,
      message: "Task has expired",
    };
  }

  const known = new Set(["read_invoice", "send_email", "delete_invoice"]);
  if (!known.has(input.tool)) {
    return {
      decision: "DENY",
      reasonCode: ReasonCode.DENIED_TOOL_UNKNOWN,
      message: `Unknown tool: ${input.tool}`,
    };
  }

  const rule = rules.find((r) => r.tool === input.tool);
  if (!rule) {
    return {
      decision: "DENY",
      reasonCode: ReasonCode.DENIED_DEFAULT,
      message: "No matching policy rule (default deny)",
    };
  }

  if (rule.action === "DENY") {
    return {
      decision: "DENY",
      reasonCode: ReasonCode.DENIED_DEFAULT,
      message: `Tool ${input.tool} is denied by policy`,
    };
  }

  if (input.tool === "read_invoice") {
    const id = String(input.args.invoice_id ?? "");
    const allowed = rule.allowedInvoiceIds ?? [];
    if (!allowed.includes(id)) {
      return {
        decision: "DENY",
        reasonCode: ReasonCode.DENIED_SCOPE,
        message: `Invoice ${id} outside task scope`,
      };
    }
  }

  if (input.tool === "send_email") {
    const to = String(input.args.to ?? "");
    const domain = to.includes("@") ? to.split("@").pop()!.toLowerCase() : "";
    const allowedDomains = (rule.allowedRecipientDomains ?? []).map((d) =>
      d.toLowerCase(),
    );
    if (!domain || !allowedDomains.includes(domain)) {
      return {
        decision: "DENY",
        reasonCode: ReasonCode.DENIED_RECIPIENT,
        message: `Recipient domain not eligible: ${domain || "(empty)"}`,
      };
    }
    if (rule.action === "REQUIRE_APPROVAL") {
      return {
        decision: "REQUIRE_APPROVAL",
        reasonCode: ReasonCode.REQUIRES_APPROVAL,
        message: "Email requires exact-action human approval",
      };
    }
  }

  if (rule.action === "REQUIRE_APPROVAL") {
    return {
      decision: "REQUIRE_APPROVAL",
      reasonCode: ReasonCode.REQUIRES_APPROVAL,
      message: "Action requires approval",
    };
  }

  return {
    decision: "ALLOW",
    reasonCode: ReasonCode.ALLOWED,
    message: "Policy allows this call",
  };
}
