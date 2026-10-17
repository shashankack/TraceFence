# TrustFence — Progress Log

Living iteration log. **Update this file on every planning or delivery iteration without fail.**

Newest entries first.

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
- Product name: **TrustFence** (not AgentGate).
- Decisions: `ALLOW` | `DENY` | `REQUIRE_APPROVAL`; default deny.
- LLM: local Ollama `qwen3:8b`; no cloud key required for MVP.
- Coding agents propose; humans type until someone says `implement`.
- Only `shashankack` merges to `main`.

### Next
- Scaffold Next.js app under `trustfence/` when lead says `implement`.
- Teammates clone, check out their branch, paste agent master prompt.
- Spandana: pull `qwen3:8b` and land first smoke scenario under `scenarios/`.

### Blockers
- None for docs/git. App code not started.
