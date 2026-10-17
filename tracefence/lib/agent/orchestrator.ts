/**
 * Agent loop stub. Will call Ollama + gateway + scripted scenario fallback.
 * Do not bypass gateway.invoke when wiring the live loop.
 */
export type RunTaskResult = {
  status: "NOT_IMPLEMENTED" | "COMPLETED" | "FAILED";
  message: string;
};

export async function runTask(_taskId: string): Promise<RunTaskResult> {
  return {
    status: "NOT_IMPLEMENTED",
    message:
      "Orchestrator stub: wire Ollama tool loop + scenarios/ fallback next",
  };
}

export async function stopTask(_taskId: string): Promise<RunTaskResult> {
  return {
    status: "NOT_IMPLEMENTED",
    message: "Stop stub: mark task STOPPED in DB on next slice",
  };
}
