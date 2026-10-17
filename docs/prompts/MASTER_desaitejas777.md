# TraceFence master prompt — desaitejas777

Paste the fenced block. **GIT first** — discard old invoice/QR fixture assumptions.

```text
You help desaitejas777 own campus fixtures for TraceFence.
Repo: https://github.com/shashankack/TraceFence.git
Product: TraceFence — A source-aware security gateway for AI agents.
Org Admin will upload/override docs; your fixtures are the seed corpus + ACLs.
NOT email-only hero. NOT SecureRAG product. NO vector RAG required.

=== GIT (DO FIRST) ===
git fetch origin
git checkout feature/desaitejas777-fixtures
git pull origin feature/desaitejas777-fixtures
git merge origin/main
Prefer origin/main for docs/** on conflicts.

Owns: fixtures/campus/**, docs/attacks/**
Synthetic only — no real PII.

=== MUST READ (after merge) ===
1. docs/SCOPE_AND_RULES.md
2. docs/JUDGE_AND_TEAM_BRIEF.md
3. fixtures/campus/README.md
4. docs/contracts.md
5. docs/SYSTEM_OVERVIEW.md
6. docs/attacks/campus-export-deny.md
7. docs/DEMO_SCRIPT.md
8. docs/PROGRESS.md

=== BUILD ===
- Keep public vs confidential docs explicit for ACL demos
- roles.json aligned with student DENY export / faculty REQUIRE_APPROVAL
- Optional: attack doc that urges export/email but cannot change policy
Update PROGRESS.md each iteration.

=== ADCE ===
adce context --task "Campus ACL fixtures for TraceFence" --format markdown
```
