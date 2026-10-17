# TraceFence master prompt — shashankack

Copy everything inside the block below into Cursor agent instructions.

```text
You help shashankack on TraceFence (team NullTrace). Repo: https://github.com/shashankack/TraceFence.git
You own ADCE context + git for them. Product name is TraceFence (not AgentGate, TrustFence, or TrustTrace).

=== ADCE ===
Before any meaningful change:
1) adce status
2) adce context --task "<current task>" --format markdown
3) Read MUST READ → CAUTION → TRUST ORDER → ALSO RELEVANT
4) Prefer CANONICAL/AUTHORITATIVE/VERIFIED. Never trust CAUTION over those.
5) If CAUTION non-empty: adce conflicts (and adce analyze --skip-ml if useful)
6) After edits: adce scan (or adce scan --full)
7) adce artifact verify only after human review
8) You may set AUTHORITATIVE on contracts you own; only you set CANONICAL / re-verify docs/TraceFence_Project_Blueprint.md; after merges to main run adce scan --full
9) Never commit .adce/cache, logs, metrics, state.db

TRUST ORDER: CANONICAL docs/TraceFence_Project_Blueprint.md; AUTHORITATIVE docs/SCOPE_AND_RULES.md, TEAM_AND_GIT.md, SYSTEM_OVERVIEW.md, contracts.md, decisions/0001-record-architecture-decisions.md

INVARIANTS: Source-aware MVP (QR/URL → Playwright allowlisted fixtures/pages → SOURCE on timeline → gateway). Model proposes; gateway executes. ALLOW/DENY/REQUIRE_APPROVAL; default deny; exact-action single-use approvals. DEMO_MODE never bypasses DENY. No real email/PII/RAG/arbitrary live scanning. Local LLM = Ollama qwen3:8b + scripted fallback with sourceId. Update docs/PROGRESS.md every iteration. No app code into repo unless human says: implement

=== GIT ===
Branch ONLY: feature/shashankack-backend. Never commit to main except when merging reviewed PRs as integration lead.
Owns: tracefence/lib/**, tracefence/app/api/**, DB, orchestrator, gateway, policy, Playwright inspect, source linkage, .env.example, integration
Must not touch: tracefence/components/**, tests/**, fixtures/**, scenarios/**
Workflow: status → fetch → rebase onto origin/main when needed → stage owned files only → commit → push -u origin HEAD. Merge teammate PRs to main after path-ownership check. Keep contracts.md + openapi.yaml aligned.
Commit messages: short human imperative. NEVER Co-authored-by Cursor/Agent, Made-with, or "Committed by Agent" watermarks. No --no-verify. No force-push to main.

First session:
git fetch origin
git checkout feature/shashankack-backend
adce doctor
adce status
adce context --task "Backend and integration for TraceFence source-aware gateway" --format markdown
```
