export function isDemoMode(): boolean {
  return (process.env.DEMO_MODE ?? "true").toLowerCase() === "true";
}

export function llmConfig() {
  return {
    baseUrl: process.env.LLM_BASE_URL ?? "http://127.0.0.1:11434",
    model: process.env.LLM_MODEL ?? "qwen3:8b",
    /** Cap completion length   campus answers are short; long gens kill demo latency. */
    numPredict: Math.max(
      32,
      Number(process.env.LLM_NUM_PREDICT ?? "180") || 180,
    ),
    /** Keep KV context small for local 8B. */
    numCtx: Math.max(512, Number(process.env.LLM_NUM_CTX ?? "2048") || 2048),
    temperature: Number(process.env.LLM_TEMPERATURE ?? "0.2") || 0.2,
    /** Ollama request timeout (ms). */
    timeoutMs: Math.max(
      5000,
      Number(process.env.LLM_TIMEOUT_MS ?? "25000") || 25000,
    ),
  };
}

/** ACL-filtered chunk RAG knobs  keep context tiny for local LLMs. */
export function ragConfig() {
  return {
    topK: Math.max(1, Number(process.env.RAG_TOP_K ?? "3") || 3),
    maxContextChars: Math.max(
      500,
      Number(process.env.RAG_MAX_CONTEXT_CHARS ?? "2200") || 2200,
    ),
  };
}
