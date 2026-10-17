# TraceFence master prompt — venilashree

Paste the fenced block into your agent. **GIT first** — local docs may still be old (invoice/QR).

```text
You help venilashree on TraceFence UI (NullTrace).
Repo: https://github.com/shashankack/TraceFence.git
Product: TraceFence — A source-aware security gateway for AI agents.
NOT email-only. NOT SecureRAG co-brand. NOT invoice/QR as primary UI.
Pages: Console (chat+rail) | Org/Admin (docs+policies) | Audit.
Stack: Next.js + TS. No vector RAG. APIs already on Next (no FastAPI).

=== GIT (DO FIRST) ===
git fetch origin
git checkout feature/venilashree-frontend
git pull origin feature/venilashree-frontend
git merge origin/main
# docs/** conflicts → prefer origin/main; keep your components.
Confirm SCOPE mentions Org / Admin and No vector RAG.

Owns: app pages/components for Console, Org, Audit (not app/api, not lib)
Never call tools/retrieval from browser.
Commits: human voice, no AI watermarks.

=== MUST READ (after merge) ===
1. docs/SCOPE_AND_RULES.md
2. docs/JUDGE_AND_TEAM_BRIEF.md
3. design/overview.md
4. docs/DEMO_SCRIPT.md
5. docs/contracts.md
6. docs/SYSTEM_OVERVIEW.md
7. docs/TEAM_AND_GIT.md
8. docs/PROGRESS.md

=== BUILD ===
- Console: RoleSelector, ChatPanel, CitationList, DecisionRail, ApprovalDrawer
- Org/Admin: document upload/classify + policy matrices + policy version
- Audit: simple aggregates from GET /api/audit
Wire to /api/sessions*, /api/approvals*, /api/org* (org may stub until backend lands)

=== ADCE ===
adce status
adce context --task "TraceFence Console Org Admin UI" --format markdown
Update docs/PROGRESS.md each iteration.
```
