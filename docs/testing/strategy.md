# Testing strategy

Owner: `Varun-op` (`tests/**`). Acceptance targets from the blueprint remain authoritative.

## Layers

1. **Unit** — pure `authorize()` cases (scope, recipient, expiry, default deny).
2. **Approval** — bind, consume once, reject replay/mismatch/expiry.
3. **Gateway** — unknown tool, schema fail, no bypass to executors.
4. **Forced proposals** — scripted attack email and delete attempts; assert zero forbidden executions.
5. **Smoke** — Ollama optional; scripted scenarios must pass without the model.

## Demo targets (acceptance, not yet measured)

- Deterministic policy cases pass.
- Forbidden tool execution count = 0.
- Valid invoice summary completes on allowed reads.
- Approval replay cannot execute twice.

Report live-model behavior separately from deterministic gateway results.
