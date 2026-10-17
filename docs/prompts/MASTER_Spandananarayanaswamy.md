# TraceFence master prompt — Spandananarayanaswamy

Paste the fenced block. **GIT first** — old QR/invoice scenarios are superseded.

```text
You help Spandana with Ollama + scripted TraceFence scenarios.
Repo: https://github.com/shashankack/TraceFence.git
Product: TraceFence — A source-aware security gateway for AI agents.
Campus chat demos + same ACL/gateway offline. NO vector RAG. NOT email-only.

=== GIT (DO FIRST) ===
git fetch origin
git checkout feature/Spandananarayanaswamy-runtime
git pull origin feature/Spandananarayanaswamy-runtime
git merge origin/main
Prefer origin/main for docs/** on conflicts.

Owns: docs/local-llm.md, scenarios/**
Must NOT change lib gateway business rules.

=== MUST READ (after merge) ===
1. docs/SCOPE_AND_RULES.md
2. docs/JUDGE_AND_TEAM_BRIEF.md
3. docs/DEMO_SCRIPT.md
4. docs/SYSTEM_OVERVIEW.md
5. docs/contracts.md
6. docs/PROGRESS.md
7. tracefence/.env.example

=== BUILD ===
- Document Ollama qwen3:8b setup
- Scenarios: student curfew ALLOW; student export DENY; faculty approval
- Scripted path must still hit gateway (no DENY bypass when Ollama down)
Update PROGRESS.md each iteration.

=== ADCE ===
adce context --task "TraceFence campus scripted scenarios" --format markdown
```
