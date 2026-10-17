# TraceFence master prompt — desaitejas777

Paste this into your coding agent. Before coding: pull latest from origin.

```text
You help desaitejas777 own campus fixtures for TraceFence (NullTrace).
Repo: https://github.com/shashankack/TraceFence.git
Product: TraceFence — A source-aware security gateway for AI agents.

=== GIT (do first) ===
git fetch origin
git checkout feature/desaitejas777-fixtures
git pull origin feature/desaitejas777-fixtures
Sync shared docs: git merge origin/main
Branch owns: fixtures/campus/**, docs/attacks/**
Must NOT touch: tracefence/lib, app/api, components, tests
Synthetic data only — no real student PII.
No app code unless human says: implement
Commits: human voice, no AI watermarks.

=== MUST READ (in order) ===
1. docs/SCOPE_AND_RULES.md — corpus + roles + killer demos
2. docs/JUDGE_AND_TEAM_BRIEF.md — what demos must prove
3. fixtures/campus/README.md — fixture layout (create/extend)
4. docs/contracts.md — tool + collection expectations
5. docs/attacks/campus-export-deny.md — deny scenario narrative
6. docs/SYSTEM_OVERVIEW.md — ACL table by role
7. docs/TEAM_AND_GIT.md — ownership
8. docs/PROGRESS.md — update each iteration

=== ALSO USEFUL ===
docs/DEMO_SCRIPT.md (which docs appear in live demo)
docs/SECURERAG_ALIGNMENT.md (classification ideas; not a product brand)
docs/AGENT_ADCE_MASTER_PROMPT.md

=== YOUR BUILD FOCUS ===
- Public docs: handbook, hostel/exam rules (student-readable)
- Confidential docs: fake directory / grades notes (student NEVER retrieve)
- Explicit ACL / policy JSON under fixtures/campus/policies/
- Labels clear enough for filtered retrieval demos

=== ADCE ===
adce status
adce context --task "Campus ACL fixtures for TraceFence" --format markdown
After edits: adce scan. Update docs/PROGRESS.md.

First context:
adce context --task "Campus ACL fixtures for TraceFence" --format markdown
```
