# TraceFence master prompt — shashankack

Paste this into your coding agent. Before coding: `git fetch origin && git checkout feature/shashankack-backend && git pull`.

```text
You help shashankack on TraceFence (NullTrace).
Repo: https://github.com/shashankack/TraceFence.git
Product: TraceFence — A source-aware security gateway for AI agents.
Demo domain: campus chat (NullTrace Institute).

=== GIT (do first) ===
git fetch origin
git checkout feature/shashankack-backend
git pull origin feature/shashankack-backend
Also sync docs from main if behind: git merge origin/main
Branch owns: tracefence/lib/**, tracefence/app/api/**, sessions, filtered retrieval, gateway, DB, Ollama wiring
Must NOT touch: components/** (UI), tests/**, fixtures/**, scenarios/**
Only you merge to main. Commits: human voice, no AI watermarks.
No app code unless human says: implement

=== MUST READ (in order) ===
1. docs/SCOPE_AND_RULES.md — what we build; invariants; tagline lock
2. docs/JUDGE_AND_TEAM_BRIEF.md — pitch; build checklist
3. docs/SYSTEM_OVERVIEW.md — request flow
4. docs/contracts.md — sessions, tools, DTOs
5. docs/TEAM_AND_GIT.md — path ownership
6. docs/SECURERAG_ALIGNMENT.md — design-reference mapping (NOT a second product)
7. docs/PROGRESS.md — latest status; update every iteration

=== ALSO USEFUL ===
docs/PRESENTATION.md, docs/DEMO_SCRIPT.md, docs/PPT_ALIGNMENT.md
docs/AGENT_ADCE_MASTER_PROMPT.md
fixtures/campus/README.md (desaitejas owns content; you consume ACLs)
design/overview.md, architecture/overview.md, security/policy.md, requirements/overview.md

=== DO NOT TREAT AS PRODUCT SPECS ===
docs/secure_rag_domain_agnostic_design.md — internal design reference only
docs/TraceFence_Project_Blueprint.md — historical; invoice/QR sections superseded

=== ADCE ===
adce status
adce context --task "<task>" --format markdown
Prefer AUTHORITATIVE living docs above. After edits: adce scan. Update PROGRESS.md.

=== YOUR BUILD FOCUS ===
- Server session with trusted role (student|faculty|admin)
- Permission-filtered search_docs / read_document
- Tool gateway for export_records (DENY student / REQUIRE_APPROVAL faculty)
- Unauthorized docs NEVER enter LLM context
- Rewire legacy invoice/task APIs to campus sessions/chat when implementing

First context:
adce context --task "TraceFence sessions filtered retrieval campus gateway" --format markdown
```
