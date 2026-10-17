# 1. Record architecture decisions

Status: Accepted

## Context

TrustFence needs a fast hackathon MVP that proves tool authorization outside the model, with a team of five and local-only LLM constraints.

## Decision

1. Single Next.js App Router + TypeScript app with server-side gateway and SQLite.
2. Local LLM via Ollama model **`qwen3:8b`**, with mandatory scripted proposal fallback.
3. No RAG in MVP; invoices via authorized `read_invoice` only.
4. Five path-owned git branches; only `shashankack` merges to `main`.
5. Product name TrustFence; default-deny policy with exact-action approvals.

## Consequences

- Demo works offline without cloud API keys.
- Local model flakiness is mitigated by scenarios + same gateway.
- Clear file ownership reduces merge conflicts for git-novice teammates.
- Post-hackathon novelty can add gated retrieval (authorized RAG) without redesigning the gateway.
