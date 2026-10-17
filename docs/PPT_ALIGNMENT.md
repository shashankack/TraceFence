# PPT vs project alignment

Source PPT: `TraceFence_Mystara_Pitch-1.pptx`  
**Decision locked: A — project follows PPT** (2026-10-17).

## Status after option A

| Gap | Resolution in living docs |
|---|---|
| Naming | Product = **TraceFence** (repo + slides); drop TrustFence / TrustTrace |
| QR + Playwright synthetic page | P0 in `SCOPE_AND_RULES` + `SYSTEM_OVERVIEW` |
| Source → proposal → decision → outcome | Contracts + timeline DTO; UI ownership for venilashree |
| LLM API | Ollama as **local LLM API** (`docs/local-llm.md`) |
| 6 vs 5 devs | Slides must say **5**; `TEAM_AND_GIT` |
| Arbitrary live scanning | Still **out of scope**; only allowlisted `fixtures/pages` |

## PPT edits still needed (human on deck file)

1. Ensure product name on every slide is **TraceFence** (not TrustFence / TrustTrace).  
2. Change **6 devs** → **5**.  
3. Stack: “One LLM API” → **“Local LLM API (Ollama qwen3:8b)”**.  
4. Keep QR / Playwright / source-trace story — project will build it.

## Do not reopen without lead OK

- Dropping QR/Playwright (that would be option B).  
- Claiming live unrestricted web scanning or prompt-injection immunity.
