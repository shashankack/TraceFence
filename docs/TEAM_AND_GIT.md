# TraceFence  Team and Git

**TraceFence**  *A source-aware security gateway for AI agents* · **NullTrace** team.

Only **`shashankack`** merges to `main`.

## People and branches

| Person | GitHub | Owns | Branch |
|---|---|---|---|
| Platform + integration | `shashankack` | Policy engine, filtered retrieval, gateway, session APIs, DB, Ollama wiring | `feature/shashankack-backend` |
| Frontend | `venilashree` | Chat UI, role picker, decision rail, approvals | `feature/venilashree-frontend` |
| Domain fixtures | `desaitejas777` | `fixtures/campus/**` docs + ACL/policy JSON | `feature/desaitejas777-fixtures` |
| Tests | `Varun-op` | Retrieval ACL + export DENY/APPROVAL tests | `feature/Varun-op-tests` |
| Runtime / scenarios | `Spandananarayanaswamy` | Ollama + scripted campus gateway scenarios | `feature/Spandananarayanaswamy-runtime` |

## Path ownership

| Owner | Owns exclusively | Must not touch |
|---|---|---|
| `shashankack` | `tracefence/lib/**`, `tracefence/app/api/**`, `.env.example` | `components/**`, `tests/**`, `fixtures/**`, `scenarios/**` |
| `venilashree` | Chat pages/components (not `app/api`) | `lib/**`, `app/api/**`, `tests/**` |
| `desaitejas777` | `fixtures/campus/**`, campus attack docs | runtime lib/api |
| `Varun-op` | `tests/**`, `docs/testing/` | production UI/API impl |
| `Spandananarayanaswamy` | `docs/local-llm.md`, `scenarios/**` | `lib/**` business logic, `components/**` |

## Agent prompts

[`docs/prompts/`](./prompts/)  per-person agent prompts.
