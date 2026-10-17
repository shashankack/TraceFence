# TraceFence — Progress Log

Living iteration log. **Update this file on every planning or delivery iteration without fail.**

Newest entries first.

---

## 2026-10-17 — Multi-tenant SQLite + real auth

### Done
- Tables: `tenants`, `users`, `memberships`, `auth_sessions`; `org_documents` / `org_policy` keyed by `tenant_id`.
- Auth APIs: signup / login / logout / me (scrypt passwords, Bearer tokens).
- Chat + Org + approvals require Bearer; identity never taken from request body.
- DEMO_MODE seeds `nulltrace-institute` + `riverview-college` and demo users (`demo1234`).

### Next
- Frontend login + tenant switcher; tester acceptance for cross-tenant isolation.

---

## 2026-10-17 — Org Admin APIs + approval execute

### Done
- `GET/POST /api/org/documents`, `PATCH /api/org/documents/:id`, `GET/PUT /api/org/policy` (admin session via `x-session-id`).
- SQLite `org_documents` + `org_policy`; edits bump `policyVersion`; retrieval reads upload overrides.
- Approval `APPROVE` executes the bound tool once and marks `CONSUMED` (OUTCOME event).

### Next
- Smoke the three killer demos; frontend wires Org page to these routes.

---

## 2026-10-17 — Refresh teammate prompts + push

### Done
- Regenerated all `docs/prompts/MASTER_*.md` with mandatory `git merge origin/main` and product lock (no RAG, not email-only, Org Admin, Next.js APIs).
- Tester prompt (`MASTER_Varun-op.md`) + `docs/testing/strategy.md` updated for `/api/sessions` acceptance matrix.

### Next
- Teammates pull/merge main before coding; Varun starts API acceptance tests.

---

## 2026-10-17 — Org Admin surface (docs + policies)

### Decision
- Product needs an **Org / Admin** page: upload documents, classify sources, define role→collection ACLs and tool ALLOW/DENY/REQUIRE_APPROVAL, bump policy version.
- Console remains chat + rail; Admin is how orgs “bring their corpus.”
- MVP: UI + APIs over SQLite (seed from fixtures OK); no vector RAG.

### Next
- Figma: add Org Admin page; frontend ships Admin + Console; backend upload/policy routes.

---

## 2026-10-17 — No vector RAG for MVP

### Decision
- Ship **ACL/keyword filtered sources + Ollama** (scripted fallback).
- **No** embeddings / vector RAG in the hackathon build.
- Security story stays “filter before context + tool gateway,” not “we have RAG.”

---

## 2026-10-17 — Reaffirm original TraceFence (not email-only)

### Decision
- Product = **original TraceFence**: source-aware security gateway for AI agents.
- Campus remains the **demo domain**, not a rename of the product.
- Explicitly **not** an email-only pitch; email/notify is one tool among search, read, export, etc.
- Keep SOURCE → PROPOSAL → DECISION → OUTCOME + exact-action approvals from the blueprint.

### Done
- Updated SCOPE, JUDGE brief, PRESENTATION, PPT_ALIGNMENT, DEMO_SCRIPT, SYSTEM opener.

### Next
- Frontend decision rail; optional synthetic “email attacker” source → DENY; polish Ollama/scenarios.

---

## 2026-10-17 — Campus gateway MVP (sessions + ACL)

### Done
- `POST /api/sessions`, `POST /api/sessions/:id/messages`, `GET /api/sessions/:id/events`
- Role ACL retrieval (`fixtures/campus`); confidential docs never enter student context
- Gateway: student `export_records` DENY; faculty REQUIRE_APPROVAL + pending approvals
- Scripted answers + optional Ollama; legacy `/api/tasks` returns 410
- Smoke: curfew ALLOW, student export DENY, faculty approval PENDING

### Next
- Frontend chat UI (venilashree); fixture polish (desaitejas); tests (Varun); scenarios (Spandana)
- Consume approved export on retry; richer chat UX

---

## 2026-10-17 — Lock product name + tagline

### Decision
- Hackathon ships **one** product: **TraceFence**.
- Locked tagline: *A source-aware security gateway for AI agents*.
- SecureRAG design doc = **internal reference only** — not a co-product or slide brand.

### Done
- Rewrote JUDGE brief, SCOPE, SECURERAG_ALIGNMENT, PRESENTATION, PPT_ALIGNMENT, SYSTEM, DEMO, TEAM, README, cursor rule around that lock.
- Regenerated all `docs/prompts/MASTER_*.md` with GIT-first steps + MUST READ doc lists.
- Commit + push to `main` so teammates can pull.

### Next
- Teammates: `git pull` their feature branch; paste their MASTER prompt.

---

## 2026-10-17 — Align TraceFence docs with SecureRAG

### Done
- Added [`SECURERAG_ALIGNMENT.md`](./SECURERAG_ALIGNMENT.md).
- Rewrote SCOPE, SYSTEM, JUDGE brief, contracts, PRESENTATION, DEMO, TEAM, PPT_ALIGNMENT, README, cursor rule, ADR, requirements/architecture/security/design/testing, campus fixtures README, all `docs/prompts/MASTER_*.md`, ADCE master trust order.
- Framing: SecureRAG = architecture; TraceFence = campus domain product; filtered retrieval + tool gateway.

### Next
- Commit/push doc set; regenerate PPT; `implement` sessions + ACL retrieval.
- `adce authority set` on SecureRAG design + alignment docs.

---

## 2026-10-17 — REVAMP: Campus Policy Firewall (A + campus)

### Decision
- Drop invoice/email-as-hero and QR-primary story.
- **Chat-first** TraceFence for **NullTrace Institute** (synthetic campus).
- Roles: student / faculty / admin.
- Tools: `search_docs`, `read_document`, `export_records`, (+ optional notify/announce) via gateway.
- Killer demo: student curfew ALLOW; student export DENY; faculty export approval.

### Done
- Rewrote SCOPE, SYSTEM, JUDGE brief, contracts, PRESENTATION, DEMO, TEAM, PPT_ALIGNMENT, README, cursor rule, campus fixtures READMEs.

### Next
- Regenerate `docs/prompts/MASTER_*.md` for campus ownership.
- Rewire `tracefence/` APIs from tasks/invoices → sessions/chat (say `implement`).
- Update Mystara PPT file to campus slides.
- Team sign-off on JUDGE_AND_TEAM_BRIEF.

---

## 2026-10-17 — Judge & team brief for agreement

### Done
- Added [`docs/JUDGE_AND_TEAM_BRIEF.md`](./JUDGE_AND_TEAM_BRIEF.md): 60s pitch, Q&A, build checklist, sign-off table.

### Next
- Team reads brief; if all agree, continue wiring demo path (inspect → gateway DENY → timeline).

---

## 2026-10-17 — Implement: Next.js scaffold + API stubs

### Done
- Scaffolded `tracefence/` (Next 16, TS, Tailwind, Zod, better-sqlite3).
- Lib: db schema/client + invoice seed, authorize/gateway/approvals/canonicalize, tools, investigate allowlist stub, orchestrator stub.
- API routes per contracts: sources, tasks, approvals, audit.
- Public synthetic page: `/fixtures/pages/supplier-attack.html`.
- `npm run build` succeeds.

### Still stubbed (next slices)
- Playwright fetch + SOURCE persist
- Ollama orchestrator loop + scenarios fallback
- Full approval consume → execute path

### Next
- Push `feature/shashankack-backend`; Playwright inspect + run loop.

---

## 2026-10-17 — Individual master prompts + push

### Done
- Regenerated ADCE + git master prompts for **TraceFence**.
- Added per-person paste files under [`docs/prompts/`](./prompts/) (all five teammates).
- Commit and push to `origin/main`; sync feature branches.

### Next
- Teammates pull `main`, checkout their branch, paste their `MASTER_*.md`.

---

## 2026-10-17 — Product name locked: TraceFence

### Done
- Renamed product branding from TrustFence/TrustTrace → **TraceFence** across living docs, cursor rule, OpenAPI, blueprint filename `docs/TraceFence_Project_Blueprint.md`.
- App path / DB: `tracefence/`, `./data/tracefence.sqlite`.
- Team remains **NullTrace**. GitHub: `shashankack/TraceFence`.

### Next
- On PPT: ensure title uses **TraceFence** (not TrustFence/TrustTrace).
- Commit/push when ready; `adce scan` after rename.

---

## 2026-10-17 — Option A locked: project follows Mystara PPT

### Done
- Decision **A** applied across living docs: QR/URL + Playwright synthetic pages + SOURCE→PROPOSAL→DECISION→OUTCOME.
- Updated SCOPE, SYSTEM, contracts, TEAM, PRESENTATION, DEMO, ADR, requirements/architecture/design/security/testing, agent prompts, cursor rule, openapi, fixtures/pages + attacks narrative.
- Brand: product **TraceFence**, team **NullTrace**, 5 people; Ollama = local LLM API.

### PPT file still needs (human)
- TraceFence → TraceFence; 6 → 5; “LLM API” → local Ollama wording.

### Next
- Commit/push docs; Tejas: `supplier-attack.html`; Spandana: QR-attack scenario; lead: `implement` app when ready.

---

## 2026-10-17 — PPT alignment review (Mystara pitch)

### Done
- Compared PPT to docs; gaps documented in [`PPT_ALIGNMENT.md`](./PPT_ALIGNMENT.md).

### Decision
- **A chosen** (see entry above).

---

## 2026-10-17 — Presentation / demo pack

### Done
- Added [`PRESENTATION.md`](./PRESENTATION.md) (5 slides + speaker lines).
- Added [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) (3-minute timed demo + elevator).
- Added [`QA_CHEATSHEET.md`](./QA_CHEATSHEET.md) for judges.
- Linked from README.

### Next
- Assign narrator + operator; rehearse once with scripted fallback.
- Build slides in PowerPoint/Google Slides from PRESENTATION.md (or present from markdown).
- Push to GitHub when ready.

---

## 2026-10-17 — ADCE master prompt for teammate agents

### Done
- Added [`docs/AGENT_ADCE_MASTER_PROMPT.md`](./AGENT_ADCE_MASTER_PROMPT.md): shared ADCE workflow + per-role add-ons.
- Cross-linked from git master prompt, `TEAM_AND_GIT.md`, and README. Paste order: ADCE → Git.

### Next
- Push this doc to `origin/main` when ready; teammates re-pull and paste both prompts.

---

## 2026-10-17 — Link GitHub remote TraceFence

### Done
- Remote: `https://github.com/shashankack/TraceFence.git` as `origin`.
- Push `main` and all five feature branches (after committing pending `.gitignore` + PROGRESS if needed).

### Next
- Teammates clone and check out their `feature/<github-username-role>` branch.
- Paste agent prompts from `docs/AGENT_GIT_MASTER_PROMPT.md`.

---

## 2026-10-17 — Expand `.gitignore`

### Done
- Broadened [`.gitignore`](../.gitignore): deps (yarn/pnpm), secrets patterns, Next/Vercel/Turbo, test reports, SQLite WAL/SHM, OS/editor junk, ADCE runtime, Cursor plans, Python venvs, GGUF/model weights, `tracefence/` local build/data.

### Still tracked (intentional)
- `.cursor/rules/`, `.adce/config.yaml`, `.adce/artifacts/README.md`, all docs and ownership paths.

### Next
- Push remote when ready; no need to recommit unless `.gitignore` change should land on `main`.

---

## 2026-10-17 — Scope, team, local LLM, and git finalized

### Done
- Locked MVP scope: task-scoped tool firewall; synthetic invoice demo; no RAG.
- Chose local LLM: Ollama + `qwen3:8b` with scripted proposal fallback.
- Assigned 5-person path-owned roles and feature branches (see `TEAM_AND_GIT.md`).
- Wrote living docs: `SCOPE_AND_RULES.md`, `SYSTEM_OVERVIEW.md`, `TEAM_AND_GIT.md`, `local-llm.md`, `contracts.md`, `AGENT_GIT_MASTER_PROMPT.md`.
- Replaced ADCE stubs for requirements, architecture, security, design, testing, ADR.
- Pointed blueprint §17 at the 5-person allocation.
- Initialized git repo, `.gitignore`, initial docs commit, five feature branches.

### Decisions locked
- Product name: **TraceFence** (not AgentGate).
- Decisions: `ALLOW` | `DENY` | `REQUIRE_APPROVAL`; default deny.
- LLM: local Ollama `qwen3:8b`; no cloud key required for MVP.
- Coding agents propose; humans type until someone says `implement`.
- Only `shashankack` merges to `main`.

### Next
- Scaffold Next.js app under `tracefence/` when lead says `implement`.
- Teammates clone, check out their branch, paste agent master prompt.
- Spandana: pull `qwen3:8b` and land first smoke scenario under `scenarios/`.

### Blockers
- None for docs/git. App code not started.

### ADCE / git follow-up (same day)
- `adce scan --full`: 22 artifacts; git detected.
- Authority: blueprint CANONICAL; SCOPE/TEAM/SYSTEM/contracts/ADR AUTHORITATIVE + VERIFIED; local-llm, agent prompts, PROGRESS, requirements/architecture/security SUPPORTING.
- Git: `main` at initial docs commit; branches created — `feature/shashankack-backend`, `feature/venilashree-frontend`, `feature/desaitejas777-fixtures`, `feature/Varun-op-tests`, `feature/Spandananarayanaswamy-runtime`.
- Remote not pushed yet — `shashankack` should create GitHub repo and `git push -u origin main` then push all feature branches.
