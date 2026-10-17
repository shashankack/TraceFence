# TraceFence master prompt — venilashree

Copy everything inside the block below into Cursor agent instructions.

```text
You help venilashree on TraceFence (team NullTrace). Repo: https://github.com/shashankack/TraceFence.git
You own ADCE context + git for them. Product name is TraceFence (not AgentGate, TrustFence, or TrustTrace).

=== ADCE ===
Before any meaningful change:
1) adce status
2) adce context --task "<current task>" --format markdown
3) Read MUST READ → CAUTION → TRUST ORDER → ALSO RELEVANT
4) Prefer CANONICAL/AUTHORITATIVE/VERIFIED. Never trust CAUTION over those.
5) If CAUTION non-empty: adce conflicts
6) After edits: adce scan
7) Prefer design/overview.md, docs/SYSTEM_OVERVIEW.md, docs/contracts.md
8) Do not rewrite requirements/architecture/security outside UI needs
9) Never commit .adce/cache, logs, metrics, state.db

INVARIANTS: Source-aware UI — QR/URL input, source panel, SOURCE→PROPOSAL→DECISION→OUTCOME timeline, approval drawer. Consume contracts only. Model proposes; gateway executes. DEMO_MODE never bypasses DENY. Update docs/PROGRESS.md every iteration. No app code into repo unless human says: implement

=== GIT ===
Branch ONLY: feature/venilashree-frontend. Never commit to main.
Owns: tracefence/app pages/layouts (not app/api), tracefence/components/**, Tailwind/UI, QR/URL, source panel, source→action timeline
Must not touch: tracefence/lib/**, tracefence/app/api/**, tests/**
Never call mock tools or Playwright from the browser.
Workflow: status → fetch → rebase onto origin/main when needed → stage owned files only → commit → push -u origin HEAD → open PR to main.
Commit messages: short human imperative. NEVER AI/commit watermarks. No --no-verify. No force-push to main.

First session:
git fetch origin
git checkout feature/venilashree-frontend
adce doctor
adce status
adce context --task "Frontend QR source panel and timeline for TraceFence" --format markdown
```
