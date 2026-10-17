# Architecture overview

See [`docs/SYSTEM_OVERVIEW.md`](../docs/SYSTEM_OVERVIEW.md) for the user/agent picture.

## Runtime

One Node.js / Next.js App Router application (`trustfence/` when scaffolded). Server modules: orchestrator, trusted tool gateway, deterministic policy engine, approval service, mock tool executors, SQLite persistence.

## Components

| Component | Responsibility |
|---|---|
| Frontend | Task setup, trace, approvals, audit UI; HTTP only |
| Orchestrator | LLM loop; feeds proposals to gateway; scripted fallback |
| Tool gateway | Sole execution entry; schema validation |
| Policy engine | Pure authorize(input) → decision + reason |
| Approval service | Pending grants; exact bind; consume once |
| Mock tools | Invoices, mock email outbox, demo delete |
| DB / audit | Tasks, policies, events, approvals |

## Data store

SQLite at `./data/trustfence.sqlite` (path via `DATABASE_PATH`).

## LLM

Local Ollama, model `qwen3:8b`. Not in the trust boundary for authorization decisions.
