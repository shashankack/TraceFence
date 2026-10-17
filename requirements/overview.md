# Requirements overview

TrustFence MVP requirements (hackathon). Detail: [`docs/SCOPE_AND_RULES.md`](../docs/SCOPE_AND_RULES.md) and the project blueprint.

## Problem

AI agents propose tool calls. Proposal is not permission. Untrusted content (e.g. invoice notes) can steer the model toward unsafe actions.

## Goal

Enforce task-scoped authorization in server application code for every proposed tool call: `ALLOW`, `DENY`, or `REQUIRE_APPROVAL` (default deny).

## Functional requirements (P0)

- Scoped invoice-summary task for `INV-001`–`INV-003`.
- Tools: `read_invoice`, `send_email`, `delete_invoice` via trusted gateway only.
- Exact-action, single-use, expiring approvals.
- Audit timeline + reason codes.
- Local LLM (Ollama `qwen3:8b`) with scripted proposal fallback.
- Deterministic security tests including unauthorized external email.

## Non-functional

- Synthetic data only; no real email.
- Keys/config server-side; no secrets in browser.
- `DEMO_MODE` must not bypass denies.
- Single Next.js app + SQLite for demo.

## Out of scope

RAG, production IAM, arbitrary MCP, shell/filesystem tools, claims of prompt-injection immunity.
