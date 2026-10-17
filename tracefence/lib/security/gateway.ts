import { authorize } from "./authorize";
import { ReasonCode } from "./reasonCodes";
import type { AuthorizeInput, AuthorizeResult, PolicyRule } from "./types";

export type ToolExecutor = (
  tool: string,
  args: Record<string, unknown>,
) => Promise<unknown>;

/**
 * Sole execution entry for tools. Model and UI must never call executors directly.
 */
export async function invoke(
  input: AuthorizeInput,
  rules: PolicyRule[],
  executor: ToolExecutor,
  opts?: { taskActive?: boolean; expiresAt?: string | null },
): Promise<{ authz: AuthorizeResult; result?: unknown }> {
  const authz = authorize(input, rules, opts);

  if (authz.decision === "ALLOW") {
    const result = await executor(input.tool, input.args);
    return { authz, result };
  }

  return { authz };
}

/** Placeholder until approval + DB wiring is complete. */
export function gatewayNotReady(): AuthorizeResult {
  return {
    decision: "DENY",
    reasonCode: ReasonCode.NOT_IMPLEMENTED,
    message: "Gateway persistence / run loop not fully wired yet",
  };
}
