# TraceFence — Codebase map

Deep guide for teammates who need to navigate the repo, wire demos, or debug.  
Product rules: [`SCOPE_AND_RULES.md`](./SCOPE_AND_RULES.md). Presentation prep: [`TEAMMATE_PRESENTATION_BRIEF.md`](./TEAMMATE_PRESENTATION_BRIEF.md).

**App root:** `tracefence/` · **DB default:** `tracefence/data/tracefence.sqlite` · **Fixtures:** `fixtures/campus/`

---

## 1. Mental model

```
UI (components + app pages)
  → HTTP /api/* (Bearer token)
    → Auth resolves trusted { userId, role, tenantId }
    → Campus chat / org / approvals handlers
      → Retrieval (ACL) + contentGuards
      → security/gateway.invoke → authorize + validateToolArgs
        → tools/* executors (only on ALLOW)
      → SQLite: sessions, events, messages, approvals, org_* 
      → Optional Ollama for grounded answers
```

**Never:** trust role/tenant from browser JSON or from document text.  
**Always:** default deny; `DEMO_MODE` seeds data but does not soften DENY.

---

## 2. Top-level layout

| Path | Purpose |
|---|---|
| `tracefence/` | Next.js App Router + TypeScript product |
| `fixtures/campus/` | Seed corpus (`docs/`, `policies/roles.json`, `uploads/`, PDFs) |
| `docs/` | Scope, pitch, attacks, team, this map |
| `docs/attacks/` | Judge-facing attack / misuse narratives |
| `docs/prompts/` | Per-teammate agent prompts |
| `.cursor/rules/` | Agent rules (TraceFence + ADCE) |
| `requirements/`, `design/`, … | ADCE software-eng stubs (fill when asked) |

---

## 3. Next.js app (`tracefence/app`)

### Pages (UI routes)

| Route | Who | What |
|---|---|---|
| `/` | All | Landing → login / home |
| `/login` | All | Demo accounts, signup, guest |
| `/student` | guest / student | Campus chat |
| `/faculty` | faculty | Campus chat + request cues |
| `/admin` | admin | Overview KPIs + policy snapshot |
| `/admin/approvals` | admin | Exact-action approve / reject |
| `/admin/policies` | admin | Corpus upload, classify, ACL + tool matrix |
| `/admin/organization` | admin | Org profile, members, custom roles |
| `/admin/audit` | admin | Evidence / verdict report |

Layouts: `(auth)/`, `(workspace)/` + `AppShell` nav by role.

### API routes (`tracefence/app/api`)

| Area | Paths | Notes |
|---|---|---|
| Auth | `auth/login`, `signup`, `logout`, `me`, `guest`, `switch-tenant` | Session token; membership on server |
| Sessions / chat | `sessions`, `sessions/[id]/messages`, `events`, `attachments` | Chat turns + sanitized uploads |
| Approvals | `approvals`, `approvals/[id]/decision` | Single-use bind |
| Org | `org/documents`, `org/policy`, `org/profile`, `org/members`, `org/roles`, `org/notifications` | Admin corpus + policy |
| Audit | `audit`, `audit/evidence` | Aggregates + session evidence |
| Sources | `sources/inspect`, `sources/[id]` | Allowlisted page inspect (demo) |
| Tasks | `tasks/*` | Legacy invoice path — not campus hero |

Handlers call `lib/**` only; they do not re-implement policy in the route file.

---

## 4. Libraries (`tracefence/lib`)

### Security (the product core)

| File | Role |
|---|---|
| `security/gateway.ts` | **Sole** tool execution entry: schema → authorize → execute |
| `security/authorize.ts` | Role × tool matrix; default deny; known tools set |
| `security/validateToolArgs.ts` | Zod + export dataset allowlist + notify recipient allowlist |
| `security/approvalService.ts` | Create / consume / mismatch / replay guards |
| `security/canonicalize.ts` | Canonical args hash for approvals |
| `security/reasonCodes.ts` | Machine reason codes for rail + audit |
| `security/types.ts` | Decision, CampusRole, AuthorizeInput, … |

### Campus domain

| File | Role |
|---|---|
| `campus/chat.ts` | Full chat turn: injection/scope gates → retrieval → tools → LLM / scripted |
| `campus/retrieval.ts` | ACL-filtered search / read |
| `campus/chunkIndex.ts` / `chunking.ts` | Lexical chunk RAG (no vectors) |
| `campus/policy.ts` | Load fixture / org policy; `toolDecisionForRole` |
| `campus/contentGuards.ts` | Scan / strip / **sanitizeChatUpload** |
| `campus/chatUpload.ts` | Persist session attachments; return sanitized only |
| `campus/authGate.ts` | Guest gates, injection heuristics, export intent |
| `campus/orgStore.ts` | Org documents CRUD + reindex |
| `campus/tenantBootstrap.ts` | Seed policy + fixture docs per tenant |
| `campus/pdfText.ts` | PDF → text for ingest / chat upload |

### Auth & org

| File | Role |
|---|---|
| `auth/session.ts` | Resolve Bearer → AuthContext (+ custom roles) |
| `auth/users.ts` | Login / signup / memberships |
| `auth/requireAuth.ts` | Route guards (`requireAdmin`, …) |
| `auth/guest.ts` | Ephemeral guest principal |
| `org/customRoles.ts` | Custom role ids + policy stubs |
| `org/tenantProfile.ts` | College vs small_business labels, profile JSON |
| `notify/approvalNotify.ts` | Mock inbox (+ optional SMTP) on REQUIRE_APPROVAL |

### Tools & agent

| File | Role |
|---|---|
| `tools/registry.ts` | `getCampusExecutor(tenant, role, { sessionId, userId })` |
| `tools/campusTools.ts` | Executors for campus tools |
| `agent/toolSchemas.ts` | Zod + LLM tool definitions |
| `agent/orchestrator.ts` | Legacy / secondary orchestration helpers |

### Data & demo

| File | Role |
|---|---|
| `db/client.ts` | better-sqlite3; schema exec; DEMO seed hook |
| `db/schema.ts` | SQL DDL (sessions, events, org_*, attachments, …) |
| `demo/seed.ts` | Tenants, users, policies, docs when `DEMO_MODE` |
| `env.ts` | Typed readers for LLM / RAG / demo flags |
| `api/schemas.ts` | Zod request bodies |

### Investigate (optional)

| File | Role |
|---|---|
| `investigate/inspectPage.ts` | Playwright-ish inspect limited by `SOURCE_ALLOWLIST_PREFIXES` |

Legacy invoice tools under `tools/readInvoice.ts`, `sendMockEmail.ts`, etc. remain for older task APIs — **not** the campus pitch.

---

## 5. UI (`tracefence/components`)

| Area | Role |
|---|---|
| `api/client.ts` + `types.ts` | Browser HTTP client + DTOs (never calls tools) |
| `auth/*` | AuthProvider, RoleGate, LoginGate, home paths |
| `workspace/*` | CampusChat, WorkspaceProvider, TraceTile, citations |
| `admin/*` | Approvals review, audit hooks |
| `shell/*` | AppShell, role nav |
| `ui/*` | shadcn-style primitives + motion (mesh-bg, cursor-grid, …) |
| `domain/*` | Catalog titles, evidence helpers, injection highlight |

---

## 6. Fixtures & scripts

| Path | Role |
|---|---|
| `fixtures/campus/policies/roles.json` | Seed policy version + role tools/collections + document registry |
| `fixtures/campus/docs/*.md` | Corpus text (classification in JSON wins) |
| `fixtures/campus/uploads/` | Sample poisoned chat file for demos |
| `tracefence/scripts/smoke-demos.ts` | Killer demos A–D |
| `smoke-auth-guest.ts` / `smoke-org.ts` / `smoke-rag.ts` | Extra smokes |
| `scripts/reseed-corpus.ts` | Re-apply fixture docs without full wipe |

Seeding is mostly upsert for fixtures; if the DB is stale, delete `data/tracefence.sqlite*` and restart.

---

## 7. Request path examples

### Student chat turn

1. `POST /api/sessions/:id/messages` `{ message }`  
2. `handleChatTurn` → injection / scope / guest checks  
3. `invoke(search_docs)` → ACL hits → scan retrieved text (log only for corpus)  
4. Optional `export_records` if message looks like export  
5. Build Allowed context → Ollama or scripted answer  
6. Persist messages + `session_events` for the rail  

### Chat file upload

1. `POST /api/sessions/:id/attachments` (role must ALLOW `use_chat_upload`)  
2. Extract text → `sanitizeChatUpload` → store status `ready` \| `flagged` \| `blocked`  
3. On send with `attachmentIds`, `invoke(use_chat_upload)` — only sanitized text enters context  

### Faculty export approval

1. Chat proposes `export_records` → REQUIRE_APPROVAL → row in `approvals`  
2. Admin `POST /api/approvals/:id/decision` `{ decision: "APPROVE" }`  
3. Consume once → executor runs → `APPROVAL_CONSUMED`  

---

## 8. Environment variables

Copy from `tracefence/.env.example` → `tracefence/.env` (never commit `.env`).

### Core runtime

| Variable | Default | What it does |
|---|---|---|
| `DEMO_MODE` | `true` | When true, auto-seeds NullTrace (+ Riverview) tenants, demo users, policies, and fixtures on DB open. **Never bypasses DENY.** Set `false` only if you intentionally want an empty/non-seeded DB. |
| `DATABASE_PATH` | `./data/tracefence.sqlite` | SQLite file path. Relative paths resolve under `tracefence/data/` (basename only). Delete this file (+ `-wal`/`-shm`) to fully refresh. |
| `APP_BASE_URL` | `http://localhost:3000` | Public app origin used in approval notification links / copy. Trailing slash stripped. |

### Local LLM (Ollama)

| Variable | Default | What it does |
|---|---|---|
| `LLM_BASE_URL` | `http://127.0.0.1:11434` | Ollama HTTP API base. Chat falls back to scripted answers if unreachable. |
| `LLM_MODEL` | `qwen3:8b` | Model name passed to Ollama (`/api/chat`). Must be pulled locally. |
| `LLM_NUM_PREDICT` | `180` | Max tokens to generate — keeps campus answers short and latency down. |
| `LLM_NUM_CTX` | `2048` | Context window size for the local 8B model (KV memory). |
| `LLM_TEMPERATURE` | `0.2` | Sampling temperature (low = more deterministic demos). |
| `LLM_TIMEOUT_MS` | `25000` | Abort Ollama request after this many ms; then scripted/fallback path. |

### Chat history sent to the model

| Variable | Default | What it does |
|---|---|---|
| `CHAT_HISTORY_MESSAGES` | `4` | How many prior turns to include in the Ollama prompt (small for speed). |
| `CHAT_HISTORY_MSG_CHARS` | `600` (example) / `900` in code fallback | Per-message character cap when packing history. |

### Retrieval (chunk RAG)

| Variable | Default | What it does |
|---|---|---|
| `RAG_TOP_K` | `3` | Max chunks retrieved into Allowed context. |
| `RAG_MAX_CONTEXT_CHARS` | `2200` | Hard cap on concatenated context length (uploads + chunks) before the prompt. |

### Allowlists (demo safety)

| Variable | Default | What it does |
|---|---|---|
| `NOTIFY_ALLOWLIST_SUFFIXES` | `nulltrace.example,nulltrace.demo,students.nulltrace.example` | Comma-separated email domain suffixes allowed for `notify_external`. Others → `DENIED_RECIPIENT`. |
| `SOURCE_ALLOWLIST_PREFIXES` | `http://127.0.0.1:3000/fixtures/pages/,http://localhost:3000/fixtures/pages/` | Comma-separated URL prefixes Playwright/inspect may open. Blocks arbitrary live web scanning. |

### Optional SMTP (approvals)

| Variable | Default | What it does |
|---|---|---|
| `SMTP_HOST` | *(unset)* | If set, code may attempt real SMTP; **mock outbox is always written** regardless. Demo should not depend on deliverability. |
| `SMTP_URL` | *(unset)* | Alternate SMTP URL style config (same spirit as `SMTP_HOST`). Placeholder wiring — do not claim production mail. |

### Variables you should **not** invent for MVP

Anything that “turns off” the gateway, trusts browser-supplied `role`, or disables ACL for demos violates product invariants.

---

## 9. Demo accounts (when `DEMO_MODE=true`)

Password: **`demo1234`**

| Email | Role |
|---|---|
| `student@nulltrace.demo` | student |
| `faculty@nulltrace.demo` | faculty |
| `admin@nulltrace.demo` | admin |
| `alex@…` / `jordan@…` / `sam@…` | student / faculty / admin (extra) |

Guest: no password — public corpus only via guest session.

---

## 10. How to verify the build

```bash
cd tracefence
npm run dev
npx tsx scripts/smoke-demos.ts      # A–D killer demos
npx tsx scripts/smoke-auth-guest.ts
npx tsx scripts/smoke-org.ts
npx tsx scripts/smoke-rag.ts
```

Reason codes and HTTP contracts: [`contracts.md`](./contracts.md). System narrative: [`SYSTEM_OVERVIEW.md`](./SYSTEM_OVERVIEW.md).

---

## 11. What is intentionally out of scope (for readers)

- Vector / embedding RAG  
- Production ABAC / SSO  
- Claiming injection immunity  
- Dual branding as SecureRAG  
- Email-only product story  
- Arbitrary live web crawling outside allowlist  

---

*Last aligned with backend tip including chat `use_chat_upload`, custom org roles, and NullTrace-only fixtures (PES corpus removed).*
