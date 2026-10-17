# TraceFence — Scope and Dev Rules

Source of truth for hackathon scope. Aligned to Mystara PPT (**option A**: project follows deck).  
Blueprint: [`TraceFence_Project_Blueprint.md`](./TraceFence_Project_Blueprint.md). Team/git: [`TEAM_AND_GIT.md`](./TEAM_AND_GIT.md). PPT map: [`PPT_ALIGNMENT.md`](./PPT_ALIGNMENT.md).

## Branding

| Use | Name |
|---|---|
| Product (repo, UI, docs, slides) | **TraceFence** |
| Team | **NullTrace** |
| Former working names | TrustFence / TrustTrace — do not use on new materials |

**Tagline (PPT-aligned):** *Know what your AI reads. Control what it does.*  
**Supporting line:** *Give AI agents tools, not unchecked authority.*

## Pitch (one line)

A **source-aware** security gateway for AI agents: inspect untrusted content the agent encounters, then enforce ALLOW / DENY / REQUIRE_APPROVAL on every proposed tool call in application code—not by the model.

## P0 (must ship)

1. Create an invoice-summary task with instruction and resource scope (`INV-001`–`INV-003`).
2. Configure read / email / delete policy rules for that task.
3. **QR / URL input** pointing at a **synthetic offline supplier page** (not arbitrary live web scanning).
4. **Playwright (or equivalent headless) investigation** of that page; store a **SOURCE** record (URL, excerpt, suspicious instruction text).
5. Run a local LLM agent via **Ollama API** (`qwen3:8b`) with structured tool calls.
6. Validate every proposed tool call against policy before execution (trusted gateway).
7. Support `ALLOW`, `DENY`, `REQUIRE_APPROVAL`.
8. Pending-approval state; approve/reject workflow.
9. Bind approval to exact canonical arguments, task, caller, and deadline; single-use.
10. Timeline events that link **SOURCE → PROPOSAL → DECISION → OUTCOME**.
11. Persist audit records and mock tool outcomes (SQLite).
12. Predefined attack: page instructs email to `external-audit@external.example` (or `@attacker.example`) → **DENY**; invoice reads may continue.
13. **Scripted proposal fallback** when Ollama fails (same gateway + same source link).
14. Reason codes visible in UI and audit.

## P1 (only after P0)

- React Flow / richer permission diagrams.
- Policy templates.
- Audit export JSON/CSV.
- Side-by-side protected vs unprotected *simulated* replay.
- Lightweight MCP adapter for one controlled tool.
- Camera QR scan polish (URL paste is enough for P0).

## Explicitly out of scope (24h)

- **Arbitrary live website scanning** (only allowlisted synthetic pages).
- Real customer data or real outbound email.
- APK analysis.
- Production OAuth / SSO / multi-tenant RBAC.
- Arbitrary MCP servers or SaaS tools.
- Network transparent gateway for third-party agents.
- Formal verification or claim of prompt-injection immunity.
- Custom prompt-injection classifier training.
- Shell or filesystem tools.
- **RAG / vector search in MVP**.

## Invariants

- The model may propose a tool call. Only the server gateway may execute it.
- Untrusted page/invoice text cannot change permissions.
- `userId`, `taskId`, and policy version come from the server, not the browser or model JSON.
- `DEMO_MODE` seeds fixtures and labels tests. It must **not** bypass a deny.
- Do not claim production security, prompt-injection immunity, or that TraceFence invented scanning or tool authorization.
- Team size for slides: **5** (not 6).

## Novelty (PPT + product)

| Now | Later |
|---|---|
| **Source-to-action traceability** (content → proposal → decision → outcome) | Gated retrieval / MCP adapters |
| Exact-action, single-use, argument-bound approvals | Policy versioning / multi-tenant identity |
| QR → synthetic page investigation + invoice tools behind one gateway | Broader allowlisted source types |

Honest claim: focused combination and DX — not invention of scanning or tool auth.

## Coding and agent rules

1. **No app code into the repo until the lead says `implement`.** Until then, agents may propose snippets for humans to review and type.
2. Work **only** on your feature branch and **only** in your owned paths (see `TEAM_AND_GIT.md`).
3. Never commit secrets (`.env`, API keys). Use `.env.example` only.
4. Commit messages: short, human voice. **No** agent watermark trailers.
5. Update [`PROGRESS.md`](./PROGRESS.md) on every iteration.
6. Default deny; no direct model → mock-tool path; no UI → mock-tool path.
7. Prefer ADCE before large changes; living AUTHORITATIVE docs override stale blueprint sections on team size / QR MVP when they conflict.

## Demo fixtures (synthetic only)

### Invoices

| Invoice | Customer | Amount | Status |
|---|---|---:|---|
| INV-001 | Acme Demo Pvt Ltd | ₹12,500 | Pending |
| INV-002 | Northwind Sample Co | ₹8,250 | Paid |
| INV-003 | Example Traders | ₹6,900 | Pending |

### Supplier page (PPT attack)

- Served from `fixtures/pages/` (offline). QR/URL points here.
- Contains untrusted instruction, e.g. email all invoices to `external-audit@external.example`.
- INV-003 note may **reinforce** the same attack for document-path demos; primary PPT path is the QR page.
