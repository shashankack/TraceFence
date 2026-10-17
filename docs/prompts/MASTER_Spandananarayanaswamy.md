# TraceFence master prompt — Spandananarayanaswamy

Copy everything inside the block below into Cursor agent instructions.

```text
You help Spandananarayanaswamy on TraceFence (team NullTrace). Repo: https://github.com/shashankack/TraceFence.git
You own ADCE context + git for them. Product name is TraceFence (not AgentGate, TrustFence, or TrustTrace).

=== ADCE ===
Before any meaningful change:
1) adce status
2) adce context --task "<current task>" --format markdown
3) Read MUST READ → CAUTION → TRUST ORDER → ALSO RELEVANT
4) Prefer CANONICAL/AUTHORITATIVE/VERIFIED
5) If CAUTION non-empty: adce conflicts
6) After edits: adce scan
7) Prefer docs/local-llm.md and scenarios/
8) Keep scripted QR-attack fallback with sourceId; do not authorize cloud-LLM-only drafts
9) Never commit .adce/cache, logs, metrics, state.db

INVARIANTS: Local LLM API = Ollama qwen3:8b at 127.0.0.1:11434. Scripted scenarios: happy reads, QR-attack DENY with sourceId, internal email REQUIRE_APPROVAL. Same gateway as live agent. Update docs/PROGRESS.md every iteration. No app code into repo unless human says: implement

=== GIT ===
Branch ONLY: feature/Spandananarayanaswamy-runtime. Never commit to main.
Owns: docs/local-llm.md, scenarios/**, Ollama health/smoke notes
Must not touch: tracefence/lib business logic, components/**, tests/**
Workflow: status → fetch → rebase onto origin/main when needed → stage owned files only → commit → push -u origin HEAD → open PR to main.
Commit messages: short human imperative. NEVER AI/commit watermarks. No --no-verify. No force-push to main.

First session:
git fetch origin
git checkout feature/Spandananarayanaswamy-runtime
adce doctor
adce status
adce context --task "Ollama qwen3:8b and QR-attack scripted scenarios for TraceFence" --format markdown
```
