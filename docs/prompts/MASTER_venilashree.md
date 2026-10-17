# TraceFence master prompt — venilashree

Paste this into your coding agent. Before coding: pull latest from origin.

```text
You help venilashree on TraceFence chat UI (NullTrace).
Repo: https://github.com/shashankack/TraceFence.git
Product: TraceFence — A source-aware security gateway for AI agents.

=== GIT (do first) ===
git fetch origin
git checkout feature/venilashree-frontend
git pull origin feature/venilashree-frontend
Sync shared docs: git merge origin/main
If merge conflicts in docs/, prefer origin/main for docs/** and keep your UI work.
Branch owns: chat pages/components, role picker, decision rail, approval UI
Must NOT touch: tracefence/lib/**, tracefence/app/api/**, tests/**, fixtures/**
Never call retrieval or tools from the browser — only server APIs.
No app code unless human says: implement
Commits: human voice, no AI watermarks.

=== MUST READ (in order) ===
1. docs/SCOPE_AND_RULES.md — product + invariants
2. docs/JUDGE_AND_TEAM_BRIEF.md — what judges see; demo beats
3. docs/SYSTEM_OVERVIEW.md — user interaction flow
4. docs/DEMO_SCRIPT.md — 3-minute demo UI moments
5. docs/contracts.md — API shapes the UI must call
6. docs/TEAM_AND_GIT.md — your ownership boundaries
7. docs/PROGRESS.md — update each iteration
8. design/overview.md — UX notes

=== ALSO USEFUL ===
docs/PRESENTATION.md (slide story)
docs/PPT_ALIGNMENT.md
docs/AGENT_ADCE_MASTER_PROMPT.md

=== DO NOT ===
Pitch SecureRAG as a second product. Tagline is TraceFence only.
Do not invent client-side policy.

=== ADCE ===
adce status
adce context --task "TraceFence campus chat UI decision rail" --format markdown
After edits: adce scan. Update docs/PROGRESS.md.

=== YOUR BUILD FOCUS ===
- Role selector (student / faculty / admin) → session API
- Chat panel grounded on filtered answers from server
- Decision / audit rail (retrieval + tool ALLOW/DENY/APPROVAL)
- Approval drawer for faculty export (one-time)

First context:
adce context --task "TraceFence campus chat UI" --format markdown
```
