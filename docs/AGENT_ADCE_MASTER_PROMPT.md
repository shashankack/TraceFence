# Agent ADCE Master Prompt

Paste **with** git prompts. Order: **ADCE → Git shared → Git personal**.  
Ready-to-paste per person: [`docs/prompts/`](./prompts/).

ADCE ranks trusted docs so agents do not invent scope.

---

## Shared ADCE block (everyone)

```text
This repository uses ADCE (Artifact-Driven Context Engine). You MUST use it before repository-level modifications.

SETUP:
- Prefer `adce` on PATH. If missing, tell the human to install ADCE; do not skip context.
- Repo: https://github.com/shashankack/TraceFence.git (root contains .adce/ and AGENTS.md).
- Product: TraceFence. Team: NullTrace.

BEFORE ANY MEANINGFUL CHANGE (docs you own, fixtures, scenarios, tests, or app code after the human says implement):
1. Run: adce status
2. Run: adce context --task "<one sentence describing the current task>" --format markdown
3. Read the brief in this order only: MUST READ → CAUTION → TRUST ORDER → ALSO RELEVANT
4. Prefer CANONICAL / AUTHORITATIVE / VERIFIED sources. Do NOT trust CAUTION over TRUST ORDER or VERIFIED docs.
5. If CAUTION is non-empty: run adce conflicts (and adce analyze --skip-ml if useful). Resolve or escalate before editing conflicting topics.
6. After adding or substantially editing files: run adce scan (or adce scan --full if many files changed).
7. Verify artifacts only after human review: adce artifact verify <id-or-prefix>
8. Authority (only if human asks; only shashankack sets CANONICAL):
   adce authority set <id> -l CANONICAL|AUTHORITATIVE|SUPPORTING
9. Before large structural work: adce structure (software-eng). Do not recreate stubs that already have real content.
10. Never commit .adce/cache, .adce/logs, .adce/metrics, or .adce/state.db.

TRUST ORDER (even if a brief is stale):
- CANONICAL: docs/TraceFence_Project_Blueprint.md
- AUTHORITATIVE: docs/SCOPE_AND_RULES.md, docs/TEAM_AND_GIT.md, docs/SYSTEM_OVERVIEW.md, docs/contracts.md, decisions/0001-record-architecture-decisions.md
- Supporting: docs/local-llm.md, docs/AGENT_*_MASTER_PROMPT.md, docs/PROGRESS.md, docs/PPT_ALIGNMENT.md, requirements/, architecture/, security/

PRODUCT INVARIANTS:
- Name is TraceFence (not AgentGate, TrustFence, or TrustTrace). Team NullTrace. Five people on slides.
- Source-aware MVP: QR/URL → Playwright inspect of allowlisted fixtures/pages → SOURCE on timeline → gateway enforces tools.
- Model proposes; only server gateway executes. Default deny. Exact-action single-use approvals.
- DEMO_MODE never bypasses DENY. No real email/PII. No RAG. No arbitrary live web scanning.
- Local LLM API = Ollama qwen3:8b + scripted fallback with same SOURCE linkage.
- Path ownership from docs/TEAM_AND_GIT.md always wins. Update docs/PROGRESS.md every meaningful iteration.
- Do not write application code into the repo unless the human says: implement

IF ADCE FAILS: retry from repo root once; then read SCOPE_AND_RULES, TEAM_AND_GIT, SYSTEM_OVERVIEW, contracts, blueprint from disk and tell the human ADCE is broken — still obey those docs.
```

---

## Role add-ons

**shashankack** — `ADCE role: Verify/set AUTHORITATIVE on contracts you own. Only you set CANONICAL / re-verify blueprint. After merges to main, adce scan --full.`

**venilashree** — `ADCE role: Prefer design/overview.md, SYSTEM_OVERVIEW, contracts. Do not rewrite requirements/architecture/security outside UI needs. Scan after UI doc updates.`

**desaitejas777** — `ADCE role: Prefer fixtures/, docs/attacks/, security/policy.md. After page/invoice fixtures, adce scan. Do not change CANONICAL/AUTHORITATIVE cross-cutting docs.`

**Varun-op** — `ADCE role: Prefer docs/testing/strategy.md, contracts, SCOPE_AND_RULES. Scan after test-plan changes. Never weaken DENY to green tests.`

**Spandananarayanaswamy** — `ADCE role: Prefer docs/local-llm.md and scenarios/. Scan after scenario changes. Keep scripted QR-attack fallback; do not authorize cloud-LLM-only drafts.`
