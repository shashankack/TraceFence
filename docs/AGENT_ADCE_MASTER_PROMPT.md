# Agent ADCE Master Prompt

Paste **with** per-person git prompts. Prefer [`docs/prompts/`](./prompts/).

```text
This repository uses ADCE. Run before meaningful changes:
1) adce status
2) adce context --task "<task>" --format markdown
3) Read MUST READ → CAUTION → TRUST ORDER → ALSO RELEVANT
4) Prefer CANONICAL/AUTHORITATIVE/VERIFIED; never trust CAUTION over those
5) If CAUTION: adce conflicts
6) After edits: adce scan
7) Never commit .adce/cache, logs, metrics, state.db

Before any work: git fetch && merge origin/main into your feature branch.
Stale invoice/QR/SecureRAG dual-brand chat memory is invalid  re-read SCOPE from disk.

TRUST ORDER:
- AUTHORITATIVE: docs/SCOPE_AND_RULES.md, docs/JUDGE_AND_TEAM_BRIEF.md, docs/SYSTEM_OVERVIEW.md, docs/contracts.md, docs/TEAM_AND_GIT.md, design/overview.md
- Design reference only (not a product): docs/SECURERAG_ALIGNMENT.md, docs/secure_rag_domain_agnostic_design.md
- Historical: docs/TraceFence_Project_Blueprint.md (invoice/QR sections superseded)
- Supporting: docs/PROGRESS.md, docs/PRESENTATION.md, docs/PPT_ALIGNMENT.md

INVARIANTS:
- Product: TraceFence only. Tagline: A source-aware security gateway for AI agents.
- Surfaces: Console + Org/Admin (docs+policies) + Audit.
- LLM is never the security boundary. Unauthorized docs never enter context.
- Tools via gateway: ALLOW / DENY / REQUIRE_APPROVAL. Roles: student|faculty|admin.
- No vector RAG in MVP. Not email-only. Next.js APIs (no FastAPI rewrite).
- DEMO_MODE never bypasses DENY. Synthetic only.
- Update docs/PROGRESS.md each iteration.
```
