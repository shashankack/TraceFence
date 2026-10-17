# TraceFence — Team and Git

Five people (**slides must say 5, not 6**). Path ownership avoids merge conflicts. Only **`shashankack`** merges to `main`.

Team name on deck: **NullTrace**. Product: **TraceFence**.

## People and branches

| Person | GitHub | Role | Branch |
|---|---|---|---|
| Lead (integration + full backend) | `shashankack` | Gateway, policy, orchestrator, API, DB, **Playwright inspect service**, source linkage | `feature/shashankack-backend` |
| Frontend | `venilashree` | Dashboard, **QR/URL input**, source panel, source→action timeline UI | `feature/venilashree-frontend` |
| Fixtures & attacks | `desaitejas777` | Invoices, **synthetic HTML pages**, attack docs, sample policies | `feature/desaitejas777-fixtures` |
| Tests / QA | `Varun-op` | Vitest + PPT security matrix (incl. source-linked DENY) | `feature/Varun-op-tests` |
| Local runtime & scenarios | `Spandananarayanaswamy` | Ollama, scripted scenarios (incl. QR-attack path), smoke notes | `feature/Spandananarayanaswamy-runtime` |

## Path ownership (do not cross)

| Owner | Owns exclusively | Must not touch |
|---|---|---|
| `shashankack` | `tracefence/lib/**`, `tracefence/app/api/**`, DB, `.env.example`, Playwright inspect under `lib/` | `components/**`, `tests/**`, `fixtures/**`, `scenarios/**` |
| `venilashree` | App pages/layouts (not `app/api`), `tracefence/components/**`, Tailwind/UI | `lib/**`, `app/api/**`, `tests/**` |
| `desaitejas777` | `fixtures/**` (incl. `fixtures/pages/**`), `docs/attacks/**`, sample policy JSON | Runtime `lib` / `app/api` |
| `Varun-op` | `tests/**`, `docs/testing/` notes | Production UI/API implementation |
| `Spandananarayanaswamy` | `docs/local-llm.md`, `scenarios/**`, Ollama health notes | `lib/**` business logic, `components/**`, `tests/**` |

Shared contracts first in [`contracts.md`](./contracts.md). Do not edit the same TypeScript file on two branches.

## Git workflow

1. Clone `https://github.com/shashankack/TraceFence.git`
2. `git checkout feature/<your-branch>`
3. Own paths only → commit → `git push -u origin HEAD` → PR to `main`
4. After merge: rebase onto `origin/main`

Never commit to `main` directly. No force-push to `main`. No secrets. No agent commit watermarks.

## Agent help

**Easiest:** paste one file from [`docs/prompts/`](./prompts/) (per person).

Or compose manually:

1. [`AGENT_ADCE_MASTER_PROMPT.md`](./AGENT_ADCE_MASTER_PROMPT.md)  
2. [`AGENT_GIT_MASTER_PROMPT.md`](./AGENT_GIT_MASTER_PROMPT.md)  
