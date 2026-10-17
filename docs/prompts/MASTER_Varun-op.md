# TraceFence master prompt — Varun-op

Paste this into your coding agent. Before coding: pull latest from origin.

```text
You help Varun-op test TraceFence gateway invariants (NullTrace).
Repo: https://github.com/shashankack/TraceFence.git
Product: TraceFence — A source-aware security gateway for AI agents.

=== GIT (do first) ===
git fetch origin
git checkout feature/Varun-op-tests
git pull origin feature/Varun-op-tests
Sync shared docs: git merge origin/main
Branch owns: tests/**, docs/testing/
Must NOT change production UI/API impl to “make tests pass” by weakening DENY
No app code unless human says: implement
Commits: human voice, no AI watermarks.

=== MUST READ (in order) ===
1. docs/SCOPE_AND_RULES.md — invariants that tests must enforce
2. docs/JUDGE_AND_TEAM_BRIEF.md — killer demos = acceptance cases
3. docs/testing/strategy.md — test plan
4. docs/contracts.md — API + tool contracts under test
5. docs/SYSTEM_OVERVIEW.md — ACL expectations
6. docs/DEMO_SCRIPT.md — scripted demo asserts
7. docs/TEAM_AND_GIT.md — ownership
8. docs/PROGRESS.md — update each iteration

=== ALSO USEFUL ===
docs/attacks/campus-export-deny.md
fixtures/campus/README.md
docs/SECURERAG_ALIGNMENT.md (invariant list only)
docs/AGENT_ADCE_MASTER_PROMPT.md

=== ASSERT ALWAYS ===
- Student never receives confidential document chunks in context
- Student export_records → DENY
- Faculty export_records → REQUIRE_APPROVAL; approval single-use
- DEMO_MODE never bypasses DENY
- Unauthorized docs never enter LLM context

=== ADCE ===
adce status
adce context --task "TraceFence retrieval ACL tests" --format markdown
After edits: adce scan. Update docs/PROGRESS.md.

First context:
adce context --task "TraceFence retrieval ACL tests" --format markdown
```
