# TraceFence master prompt  Varun-op (tester)

Paste **everything inside the fence** into your coding agent.  
Your local clone may still have **old invoice/QR/email or SecureRAG dual-brand context**  the GIT block below is mandatory before any work.

```text
You help Varun-op TEST TraceFence (NullTrace team).
Repo: https://github.com/shashankack/TraceFence.git

=== PRODUCT LOCK (replace any old context) ===
- Product name: TraceFence ONLY. Tagline: A source-aware security gateway for AI agents.
- NOT an email-only product. NOT a second product named SecureRAG.
- NOT the old invoice / QR / supplier-page demo as primary.
- Demo domain: campus chat (NullTrace Institute) + Org Admin (docs + policies).
- Stack: Next.js App Router + TypeScript + Zod + SQLite + Ollama qwen3:8b.
- Retrieval: ACL/keyword over fixtures/uploads. NO vector RAG / embeddings.
- Backend stays Next.js API routes (no FastAPI rewrite).
- Tools under test: search_docs, read_document, export_records (+ optional notify/announce).
- Decisions: ALLOW | DENY | REQUIRE_APPROVAL. Timeline: SOURCE → PROPOSAL → DECISION → OUTCOME.
- DEMO_MODE never bypasses DENY.

=== GIT (DO THIS FIRST  discard stale local docs) ===
cd into the TraceFence repo root.
git fetch origin
git checkout feature/Varun-op-tests
git pull origin feature/Varun-op-tests
# Force shared product docs onto this branch:
git merge origin/main
# If docs/** conflict: take origin/main versions for docs/, keep only your tests/** work.
# Confirm you see Org Admin + no-RAG lock:
#   grep -n "Org / Admin" docs/SCOPE_AND_RULES.md
#   grep -n "No vector RAG" docs/SCOPE_AND_RULES.md
#   grep -n "export_records" docs/contracts.md
After merge, re-read MUST READ files from disk (do not trust prior chat memory about invoice/QR).

Branch owns: tests/**, docs/testing/
Must NOT weaken DENY in production code to make tests pass.
Must NOT rewrite product scope. Commits: human voice, no AI watermarks.
Say implement only when the human asks for test code; until then you may draft test plans/files under tests/ and docs/testing/.

=== MUST READ (in order, after git merge) ===
1. docs/SCOPE_AND_RULES.md
2. docs/JUDGE_AND_TEAM_BRIEF.md
3. docs/testing/strategy.md
4. docs/contracts.md
5. docs/SYSTEM_OVERVIEW.md
6. docs/DEMO_SCRIPT.md
7. docs/TEAM_AND_GIT.md
8. docs/PROGRESS.md (newest entries first)
9. design/overview.md (Console + Org + Audit pages)

=== IGNORE / SUPERSEDED ===
- Invoice/QR/supplier-page as the main product story
- “SecureRAG × Campus” dual branding
- Vector RAG requirements
- Legacy /api/tasks as the path under test (use /api/sessions + /api/org when present)

=== ASSERT ALWAYS (acceptance) ===
1. Student search/curfew: only public docs; confidential IDs never in student context/citations
2. Student export_records → DENY (reason DENIED_EXPORT or DENIED_ROLE); no export payload executed
3. Faculty export_records → REQUIRE_APPROVAL; pending approval created; single-use after approve
4. ACL filter event or equivalent proves confidential sources excluded for student
5. DEMO_MODE=true still DENYs student export
6. (When Org APIs exist) policy/document changes bump policyVersion; student still cannot read confidential
7. Scripted/Ollama-down path uses SAME gateway (no bypass)

=== YOUR WORK ===
- Add/extend automated tests under tests/** against running or test-harness APIs
- Prefer API-level tests: POST /api/sessions, POST .../messages, GET .../events, approvals
- Update docs/testing/strategy.md with cases + how to run
- Update docs/PROGRESS.md each iteration
- File bugs; do not “fix” by relaxing authorize.ts

=== ADCE ===
adce status
adce context --task "TraceFence campus ACL and export gateway tests" --format markdown
After edits: adce scan

First commands after paste:
git fetch origin && git checkout feature/Varun-op-tests && git pull && git merge origin/main
adce context --task "TraceFence campus ACL and export gateway tests" --format markdown
```
