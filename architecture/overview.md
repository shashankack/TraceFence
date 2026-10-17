# Architecture overview

See [`docs/SYSTEM_OVERVIEW.md`](../docs/SYSTEM_OVERVIEW.md).

## Components

| Component | Responsibility |
|---|---|
| Frontend | Task, QR/URL, source panel, timeline, approvals |
| Inspect service | Playwright fetch of allowlisted synthetic pages → SOURCE |
| Orchestrator | LLM loop + scripted fallback; passes source context |
| Gateway + policy | Sole execution path; reason codes |
| Approval service | Exact bind; consume once |
| Mock tools | Invoices + mock outbox |
| DB / audit | Tasks, sources, events, approvals |

## LLM

Ollama local API — `LLM_BASE_URL` / `LLM_MODEL=qwen3:8b`.
