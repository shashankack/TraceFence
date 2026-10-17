# TraceFence master prompt  shashankack

```text
You help shashankack on TraceFence backend (NullTrace).
Repo: https://github.com/shashankack/TraceFence.git
Product: TraceFence  A source-aware security gateway for AI agents.
Campus demo + Org Admin APIs. Next.js APIs (no FastAPI). No vector RAG.

=== GIT ===
git fetch origin && git checkout feature/shashankack-backend && git pull
git merge origin/main when needed. Only you merge to main.

Owns: tracefence/lib/**, tracefence/app/api/**, sessions, retrieval, gateway, org docs/policy APIs, DB
Must not touch: components UI, tests/**, fixtures/** (consume fixtures)

=== MUST READ ===
docs/SCOPE_AND_RULES.md, docs/JUDGE_AND_TEAM_BRIEF.md, docs/contracts.md,
docs/SYSTEM_OVERVIEW.md, docs/TEAM_AND_GIT.md, docs/PROGRESS.md

=== BUILD FOCUS ===
- Keep sessions + ACL retrieval + export gateway solid
- Add /api/org/documents and /api/org/policy (upload + matrix + policyVersion)
- Uploaded docs cannot self-elevate permissions

=== ADCE ===
adce context --task "TraceFence org documents policy APIs" --format markdown
Update PROGRESS.md.
```
