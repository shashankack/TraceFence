# TrustFence — Scope and Dev Rules

Source of truth for hackathon scope. Blueprint details remain in [`TrustFence_Project_Blueprint.md`](./TrustFence_Project_Blueprint.md). Team/git: [`TEAM_AND_GIT.md`](./TEAM_AND_GIT.md).

## Pitch (one line)

Task-scoped authorization between an AI agent and its tools. Every proposed tool call is checked in application code, not by the model.

## P0 (must ship)

1. Create an invoice-summary task with instruction and resource scope (`INV-001`–`INV-003`).
2. Configure read / email / delete policy rules for that task.
3. Run a local LLM-driven agent (Ollama `qwen3:8b`) with structured tool calls.
4. Validate every proposed tool call against policy before execution (trusted gateway).
5. Support `ALLOW`, `DENY`, `REQUIRE_APPROVAL`.
6. Pending-approval state; approve/reject workflow.
7. Bind approval to exact canonical arguments, task, caller, and deadline; single-use.
8. Live or refreshable timeline of proposed and executed actions.
9. Persist audit records and mock tool outcomes (SQLite).
10. Predefined security scenarios, including unauthorized external email.
11. **Scripted proposal fallback** when Ollama is down or tool JSON is invalid (same gateway).
12. Reason codes visible in UI and audit.

## P1 (only after P0)

- React Flow / richer permission diagrams.
- Policy templates.
- Audit export JSON/CSV.
- Side-by-side protected vs unprotected *simulated* replay.
- Lightweight MCP adapter for one controlled tool.

## Explicitly out of scope (24h)

- Real customer data or real outbound email.
- Production OAuth / SSO / multi-tenant RBAC.
- Arbitrary MCP servers or SaaS tools.
- Network transparent gateway for third-party agents.
- Formal verification or claim of prompt-injection immunity.
- Custom prompt-injection classifier training.
- Shell or filesystem tools.
- **RAG / vector search in MVP** (post-hackathon: retrieval as a gated tool).

## Invariants

- The model may propose a tool call. Only the server gateway may execute it.
- Invoice text and other untrusted content cannot change permissions.
- `userId`, `taskId`, and policy version come from the server, not the browser or model JSON.
- `DEMO_MODE` seeds fixtures and labels tests. It must **not** bypass a deny.
- Do not claim production security, prompt-injection immunity, or that TrustFence invented tool authorization.

## Novelty

| Now | Later |
|---|---|
| Exact-action, single-use, argument-bound approvals + audit | Gated retrieval/`search_docs` (authorized RAG) |
| Default-deny + malicious invoice demo | Policy-version diffs; protected vs unprotected replay |
| Local agent + forced-call tests through same gateway | MCP adapter; stronger identity |

## Coding and agent rules

1. **No app code into the repo until the lead says `implement`.** Until then, agents may propose snippets for humans to review and type.
2. Work **only** on your feature branch and **only** in your owned paths (see `TEAM_AND_GIT.md`).
3. Never commit secrets (`.env`, API keys). Use `.env.example` only.
4. Commit messages: short, human voice. **No** Co-authored-by Cursor/agent, “Made with”, or “Committed by Agent” trailers.
5. Update [`PROGRESS.md`](./PROGRESS.md) on every iteration.
6. Default deny; no direct model → mock-tool path; no UI → mock-tool path.
7. Prefer ADCE: `adce status` / `adce context` before large repo changes; trust CANONICAL blueprint over stubs until stubs are verified.

## Demo fixtures (synthetic only)

| Invoice | Customer | Amount | Status |
|---|---|---:|---|
| INV-001 | Acme Demo Pvt Ltd | ₹12,500 | Pending |
| INV-002 | Northwind Sample Co | ₹8,250 | Paid |
| INV-003 | Example Traders | ₹6,900 | Pending |

INV-003 includes an untrusted “SYSTEM OVERRIDE” note for security demos.
