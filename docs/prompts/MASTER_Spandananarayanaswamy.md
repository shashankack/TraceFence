# TraceFence master prompt  Spandananarayanaswamy

Paste the fenced block. **GIT first**  invoice/QR scenarios are obsolete; use campus + auth.

```text
You help Spandana with Ollama + scripted TraceFence campus scenarios.
Repo: https://github.com/shashankack/TraceFence.git
Product: TraceFence  A source-aware security gateway for AI agents.
Campus chat demos + same ACL/gateway offline. NO vector RAG. NOT email-only.

=== GIT (DO FIRST) ===
git fetch origin
git checkout feature/Spandananarayanaswamy-runtime
git pull origin feature/Spandananarayanaswamy-runtime
git merge origin/main
# Also pull backend so scenarios match live APIs:
git merge origin/feature/shashankack-backend
Prefer origin/main for docs/** on conflicts.
Never rewrite lib/** or app/api/** business logic  report gaps to shashankack.

Owns: docs/local-llm.md, scenarios/**
Must NOT change: tracefence/lib/**, tracefence/app/api/**, components/**

=== MUST READ (after merge) ===
1. docs/SCOPE_AND_RULES.md
2. docs/JUDGE_AND_TEAM_BRIEF.md
3. docs/DEMO_SCRIPT.md
4. docs/SYSTEM_OVERVIEW.md
5. docs/contracts.md   ← auth + sessions + org contracts
6. docs/PROGRESS.md
7. tracefence/.env.example

=== AUTH (required for all API calls) ===
DEMO_MODE seeds users (password demo1234):
  student@nulltrace.demo  → nulltrace-institute / student
  faculty@nulltrace.demo  → nulltrace-institute / faculty
  admin@nulltrace.demo    → nulltrace-institute / admin
  student@riverview.demo  → riverview-college / student
  admin@riverview.demo    → riverview-college / admin

Flow:
  POST /api/auth/login  { "email", "password", "tenantId?" }
  → token
  Authorization: Bearer <token> on every sessions / messages / events / approvals call
  POST /api/sessions   (no role in body  role comes from membership)
  POST /api/sessions/:id/messages  { "message" }

=== BUILD ===
1. docs/local-llm.md  install Ollama, pull qwen3:8b, LLM_BASE_URL / LLM_MODEL, what happens when Ollama is down.
2. scenarios/**  runnable scripts or markdown+curl that prove:
   A. Student curfew → ALLOW search_docs → answer from public docs only
   B. Student export / directory dump → DENY export_records (gateway, not model)
   C. Faculty export → REQUIRE_APPROVAL → POST /api/approvals/:id/decision APPROVE → CONSUMED + OUTCOME
   D. (Bonus) Riverview student cannot see NullTrace confidential docs (tenant isolation)
3. Scripted path (Ollama down) MUST still hit the same gateway  DEMO_MODE never bypasses DENY.
4. Do not invent FastAPI or vector RAG.

Update docs/PROGRESS.md each iteration with what you verified.

=== ADCE ===
adce status
adce context --task "TraceFence campus scripted scenarios Ollama" --format markdown
```
