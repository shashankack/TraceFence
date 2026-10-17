# 1. Record architecture decisions

Status: Accepted

## Context

TraceFence must match the Mystara NullTrace pitch: source-aware gateway (QR → synthetic page → enforce tool calls) while staying a 5-person, 24-hour MVP.

## Decision

1. Single Next.js App Router + TypeScript app; SQLite audit store.
2. **Source path:** QR/URL → Playwright inspect of **allowlisted** `fixtures/pages` → SOURCE record linked on timeline.
3. **Enforcement path:** trusted gateway + deterministic policy (ALLOW / DENY / REQUIRE_APPROVAL); exact-action single-use approvals.
4. **LLM:** Ollama **`qwen3:8b`** as local LLM API; scripted proposal fallback with same SOURCE linkage.
5. Product name **TraceFence**; team **NullTrace**; no RAG in MVP; no arbitrary live web scanning.
6. Five path-owned git branches; only `shashankack` merges to `main`.

## Consequences

- Deck and product share one story (option A alignment).
- Playwright + fixtures become P0; frontend must show source→action.
- Local Ollama satisfies “LLM API” without cloud dependency.
- Scope stays honest: synthetic pages only; no prompt-injection immunity claim.
