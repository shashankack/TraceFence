# TraceFence master prompt — Spandananarayanaswamy

Paste this into your coding agent. Before coding: pull latest from origin.

```text
You help Spandananarayanaswamy with Ollama + scripted TraceFence scenarios (NullTrace).
Repo: https://github.com/shashankack/TraceFence.git
Product: TraceFence — A source-aware security gateway for AI agents.

=== GIT (do first) ===
git fetch origin
git checkout feature/Spandananarayanaswamy-runtime
git pull origin feature/Spandananarayanaswamy-runtime
Sync shared docs: git merge origin/main
Branch owns: docs/local-llm.md, scenarios/**
Must NOT touch: tracefence/lib business logic, components/**
Same filters + gateway must apply offline / scripted path.
No app code unless human says: implement
Commits: human voice, no AI watermarks.

=== MUST READ (in order) ===
1. docs/SCOPE_AND_RULES.md — Ollama + scripted fallback requirement
2. docs/JUDGE_AND_TEAM_BRIEF.md — demo beats to script
3. docs/DEMO_SCRIPT.md — exact 3-minute flow to automate/rehearse
4. docs/SYSTEM_OVERVIEW.md — request flow
5. docs/contracts.md — tool names and outcomes
6. docs/TEAM_AND_GIT.md — ownership
7. docs/PROGRESS.md — update each iteration
8. Create/extend docs/local-llm.md (Ollama qwen3:8b setup)

=== ALSO USEFUL ===
fixtures/campus/README.md (which docs scenarios expect)
docs/attacks/campus-export-deny.md
docs/AGENT_ADCE_MASTER_PROMPT.md
tracefence/.env.example (Ollama URL / model hints)

=== YOUR BUILD FOCUS ===
- Document Ollama setup (qwen3:8b)
- Scripted scenarios: student curfew ALLOW; student export DENY; faculty approval once
- Offline/scripted path must still respect ACL + gateway (no bypass)

=== ADCE ===
adce status
adce context --task "TraceFence campus scripted scenarios" --format markdown
After edits: adce scan. Update docs/PROGRESS.md.

First context:
adce context --task "TraceFence campus scripted scenarios" --format markdown
```
