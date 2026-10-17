import { authorize } from "./authorize";
import { ReasonCode } from "./reasonCodes";
import type { AuthorizeInput, AuthorizeResult, PolicyRule } from "./types";
import { validateToolArgs } from "./validateToolArgs";

export type ToolExecutor = (
  tool: string,
  args: Record<string, unknown>,
) => Promise<unknown>;

/**
 * Sole execution entry for tools. Model and UI must never call executors directly.
 * Order: schema/recipient checks → role policy → execute.
 */
export async function invoke(
  input: AuthorizeInput,
  rules: PolicyRule[],
  executor: ToolExecutor,
  opts?: { taskActive?: boolean; expiresAt?: string | null },
): Promise<{ authz: AuthorizeResult; result?: unknown }> {
  const schemaDeny = validateToolArgs(input.tool, input.args);
  if (schemaDeny) {
    return { authz: schemaDeny };
  }

  const authz = authorize(input, rules, opts);

  if (authz.decision === "ALLOW") {
    // Re-check destinations after ALLOW  defense in depth for notify_external.
    const again = validateToolArgs(input.tool, input.args);
    if (again) return { authz: again };

    const result = await executor(input.tool, input.args);
    return { authz, result };
  }

  return { authz };
}

export function gatewayNotReady(): AuthorizeResult {
  return {
    decision: "DENY",
    reasonCode: ReasonCode.NOT_IMPLEMENTED,
    message: "Gateway persistence / run loop not fully wired yet",
  };
}
