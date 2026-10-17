# Agent ADCE Master Prompt

Paste **with** git prompts. Prefer per-person files in [`docs/prompts/`](./prompts/).

```text
This repository uses ADCE. Run before meaningful changes:
1) adce status
2) adce context --task "<task>" --format markdown
3) Read MUST READ → CAUTION → TRUST ORDER → ALSO RELEVANT
4) Prefer CANONICAL/AUTHORITATIVE/VERIFIED; never trust CAUTION over those
5) If CAUTION: adce conflicts
6) After edits: adce scan
7) Never commit .adce/cache, logs, metrics, state.db

TRUST ORDER:
- AUTHORITATIVE: docs/SCOPE_AND_RULES.md, docs/JUDGE_AND_TEAM_BRIEF.md, docs/SYSTEM_OVERVIEW.md, docs/contracts.md, docs/TEAM_AND_GIT.md, docs/SECURERAG_ALIGNMENT.md, decisions/0001-record-architecture-decisions.md
- Design reference (not a product): docs/secure_rag_domain_agnostic_design.md
- CANONICAL historical: docs/TraceFence_Project_Blueprint.md (living SCOPE supersedes invoice/QR sections)
- Supporting: docs/PROGRESS.md, docs/PPT_ALIGNMENT.md, docs/PRESENTATION.md

INVARIANTS:
- Product: TraceFence only. Tagline: A source-aware security gateway for AI agents.
- LLM is never the security boundary.
- Unauthorized docs must never enter LLM context (permission-filtered retrieval).
- Tools via gateway: ALLOW / DENY / REQUIRE_APPROVAL. Roles: student|faculty|admin.
- DEMO_MODE never bypasses DENY. Synthetic only.
- Do not pitch SecureRAG as a second product.
- No app code unless human says: implement. Update docs/PROGRESS.md each iteration.
```
