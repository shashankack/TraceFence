# Testing strategy (TraceFence campus demo)

Owner: `Varun-op`  
Branch: `feature/Varun-op-tests`

Product under test: **TraceFence**  source-aware security gateway (not email-only, no vector RAG).  
Primary APIs: `/api/sessions`, `/api/sessions/:id/messages`, `/api/sessions/:id/events`, `/api/approvals`, `/api/org/*` (when shipped).

## Acceptance matrix

| Case | Expected |
|---|---|
| Student ask hostel curfew | `search_docs` ALLOW; citations/public only; confidential docs absent |
| Student ask grades / directory / emails | Confidential not in context; optional RETRIEVAL_FILTERED |
| Student `export_records` | DENY; no successful export outcome |
| Faculty `export_records` | REQUIRE_APPROVAL + pending approval row |
| Faculty approve once then replay | Second execute fails (consumed / mismatch) |
| `DEMO_MODE=true` student export | Still DENY |
| Scripted fallback (no Ollama) | Same ACL + gateway decisions |
| Org policy (when API exists) | Bump version; student still blocked on confidential |

## How to run (MVP)

1. `cd tracefence && npm run dev`  
2. API smoke via curl/http against sessions (see DEMO_SCRIPT)  
3. Automate under `tests/` (node/vitest or similar  choose one and document here)

## Non-goals

- Weakening DENY to green the suite  
- Testing legacy `/api/tasks` as primary  
- Claiming prompt-injection proof  
