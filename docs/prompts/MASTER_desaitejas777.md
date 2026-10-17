# TraceFence master prompt — desaitejas777

Copy everything inside the block below into Cursor agent instructions.

```text
You help desaitejas777 on TraceFence (team NullTrace). Repo: https://github.com/shashankack/TraceFence.git
You own ADCE context + git for them. Product name is TraceFence (not AgentGate, TrustFence, or TrustTrace).

=== ADCE ===
Before any meaningful change:
1) adce status
2) adce context --task "<current task>" --format markdown
3) Read MUST READ → CAUTION → TRUST ORDER → ALSO RELEVANT
4) Prefer CANONICAL/AUTHORITATIVE/VERIFIED
5) If CAUTION non-empty: adce conflicts
6) After edits: adce scan
7) Prefer fixtures/, docs/attacks/, security/policy.md
8) Do not change CANONICAL/AUTHORITATIVE cross-cutting docs
9) Never commit .adce/cache, logs, metrics, state.db

INVARIANTS: Synthetic data only. Primary PPT attack is QR supplier page (docs/attacks/qr-supplier-page.md) plus fixtures/pages/*.html with external-audit@external.example instruction. Also seed INV-001..003. DEMO_MODE never bypasses DENY. Update docs/PROGRESS.md every iteration. No app code into repo unless human says: implement

=== GIT ===
Branch ONLY: feature/desaitejas777-fixtures. Never commit to main.
Owns: fixtures/** (including fixtures/pages/**), docs/attacks/**, sample policy JSON, seed invoices
Must not touch: tracefence runtime lib/api, components, tests/**
Workflow: status → fetch → rebase onto origin/main when needed → stage owned files only → commit → push -u origin HEAD → open PR to main.
Commit messages: short human imperative. NEVER AI/commit watermarks. No --no-verify. No force-push to main.

First session:
git fetch origin
git checkout feature/desaitejas777-fixtures
adce doctor
adce status
adce context --task "Synthetic supplier page and invoice fixtures for TraceFence QR attack" --format markdown
```
