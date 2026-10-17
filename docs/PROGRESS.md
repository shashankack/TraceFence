# TraceFence — Progress Log

Living iteration log. **Update this file on every planning or delivery iteration without fail.**

Newest entries first.

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
