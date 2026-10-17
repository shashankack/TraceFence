export function isDemoMode(): boolean {
  return (process.env.DEMO_MODE ?? "true").toLowerCase() === "true";
}

export function llmConfig() {
  return {
    baseUrl: process.env.LLM_BASE_URL ?? "http://127.0.0.1:11434",
    model: process.env.LLM_MODEL ?? "qwen3:8b",
  };
}

/** ACL-filtered chunk RAG knobs — keep context tiny for local LLMs. */
export function ragConfig() {
  return {
    topK: Math.max(1, Number(process.env.RAG_TOP_K ?? "4") || 4),
    maxContextChars: Math.max(
      500,
      Number(process.env.RAG_MAX_CONTEXT_CHARS ?? "3500") || 3500,
    ),
  };
}
