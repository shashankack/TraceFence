# TrustFence — Team and Git

Five people. Path ownership is the conflict-avoidance strategy. Only **`shashankack`** merges to `main`.

## People and branches

| Person | GitHub | Role | Branch |
|---|---|---|---|
| Lead (integration + full backend) | `shashankack` | Gateway, policy engine, orchestrator, API, DB | `feature/shashankack-backend` |
| Frontend | `venilashree` | Dashboard UI | `feature/venilashree-frontend` |
| Fixtures & attacks | `desaitejas777` | Seeds, malicious invoice, sample policies | `feature/desaitejas777-fixtures` |
| Tests / QA | `Varun-op` | Vitest / acceptance matrix | `feature/Varun-op-tests` |
| Local runtime & scenarios | `Spandananarayanaswamy` | Ollama docs, scripted scenarios, smoke | `feature/Spandananarayanaswamy-runtime` |

## Path ownership (do not cross)

| Owner | Owns exclusively | Must not touch |
|---|---|---|
| `shashankack` | `trustfence/lib/**`, `trustfence/app/api/**`, DB schema/client, `.env.example`, integration wiring | `trustfence/components/**`, `tests/**`, `fixtures/**`, `scenarios/**` |
| `venilashree` | `trustfence/app/**/page.tsx` (and layout/UI routes), `trustfence/components/**`, Tailwind/UI assets | `trustfence/lib/**`, `trustfence/app/api/**`, `tests/**` |
| `desaitejas777` | `fixtures/**`, `docs/attacks/**`, sample policy JSON | Runtime app code under `trustfence/lib` or `app/api` |
| `Varun-op` | `tests/**`, notes under `docs/testing/` | Production UI/API implementation |
| `Spandananarayanaswamy` | `docs/local-llm.md`, `scenarios/**`, Ollama health/smoke notes | `lib/**` business logic, `components/**`, `tests/**` |

Shared contracts are **documented first** in [`contracts.md`](./contracts.md) and `openapi.yaml`. Backend implements; frontend consumes. Do not edit the same TypeScript file in two branches.

## Git workflow (humans who do not know git)

1. Clone the repo (owner pushes `main` after init).
2. `git fetch` then `git checkout feature/<your-branch>` (exact name above).
3. Work only in your paths. Commit on your branch only.
4. Push your branch: `git push -u origin HEAD`.
5. Open a PR into `main`. Wait for `shashankack` to merge.
6. After merge, update your branch: `git fetch origin` then `git rebase origin/main` (or merge `main` if rebase fails — ask lead).

Never commit to `main` directly. Never push `--force` to `main`. Never edit another teammate’s owned paths “just this once.”

## Commit hygiene

- Author identity: use your own GitHub name/email (configured locally by you).
- Message: short imperative (“Add INV-003 attack note fixture”).
- **Forbidden in commits:** `Co-authored-by: Cursor`, `Co-authored-by: *Agent*`, `Made-with: Cursor`, “Committed by Agent”, or similar watermarks.
- No secrets in git.

## Agent help

Paste the prompt from [`AGENT_GIT_MASTER_PROMPT.md`](./AGENT_GIT_MASTER_PROMPT.md) into each teammate’s Cursor agent so git is handled for them.
