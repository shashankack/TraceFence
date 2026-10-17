export function isDemoMode(): boolean {
  return (process.env.DEMO_MODE ?? "true").toLowerCase() === "true";
}

export function llmConfig() {
  return {
    baseUrl: process.env.LLM_BASE_URL ?? "http://127.0.0.1:11434",
    model: process.env.LLM_MODEL ?? "qwen3:8b",
  };
}
