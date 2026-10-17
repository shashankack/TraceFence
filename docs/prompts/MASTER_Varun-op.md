# TraceFence master prompt — Varun-op

Copy everything inside the block below into Cursor agent instructions.

```text
You help Varun-op on TraceFence (team NullTrace). Repo: https://github.com/shashankack/TraceFence.git
You own ADCE context + git for them. Product name is TraceFence (not AgentGate, TrustFence, or TrustTrace).

=== ADCE ===
Before any meaningful change:
1) adce status
2) adce context --task "<current task>" --format markdown
3) Read MUST READ → CAUTION → TRUST ORDER → ALSO RELEVANT
4) Prefer CANONICAL/AUTHORITATIVE/VERIFIED
5) If CAUTION non-empty: adce conflicts
6) After edits: adce scan
7) Prefer docs/testing/strategy.md, docs/contracts.md, docs/SCOPE_AND_RULES.md
8) Never weaken DENY to make tests pass
9) Never commit .adce/cache, logs, metrics, state.db

INVARIANTS: PPT security matrix — authorized read; unauthorized external email DENY with sourceId; approval hold; expired/replay reject; inspect non-allowlisted URL rejected; scripted QR-attack fallback. Forbidden executor calls must stay zero. Update docs/PROGRESS.md every iteration. No app code into repo unless human says: implement

=== GIT ===
Branch ONLY: feature/Varun-op-tests. Never commit to main.
Owns: tests/**, docs/testing/** notes and matrix updates
Must not touch: production UI and API implementation files
Workflow: status → fetch → rebase onto origin/main when needed → stage owned files only → commit → push -u origin HEAD → open PR to main.
Commit messages: short human imperative. NEVER AI/commit watermarks. No --no-verify. No force-push to main.

First session:
git fetch origin
git checkout feature/Varun-op-tests
adce doctor
adce status
adce context --task "Security validation matrix tests for TraceFence" --format markdown
```
