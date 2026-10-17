# TraceFence  Progress Log

Living iteration log. **Update this file on every planning or delivery iteration without fail.**

Newest entries first.

---

## 2026-10-18  Backend polish + merge Tejas fixtures (shashankack)

### Done
- Org multi-tenant polish, policy/content guards, campus chat live fence UI, TraceFence logo.
- Merged `origin/feature/desaitejas777-fixtures` (PES policies, PDFs, poisoned-source demo).

### Notes
- Reseed demo DB after fixture merge: delete `tracefence/data/tracefence.sqlite*` so new docs register.

---

## 2026-10-17  Teammates' policy docs (desaitejas777 fixtures)

### Done
- Added teammates' `pes-university-act` (.md + .pdf, public): The PES University Act, 2012  gazetted English text, signatories named by office only.
- `incoming-pdfs/` did not exist, so `node fixtures/campus/scripts/register_docs.cjs` ran without an argument → `added 1; total 20 { public: 16, internal: 2, confidential: 2 }`; no PROBLEMS, nothing converted or DEFAULTED. `guest` role and `policyVersion: 1` unchanged.
- Checks: every `.md` Classification matches `roles.json`; only `hostel-rules.md` mentions curfew.
- Reset the demo DB and ran `npx tsx scripts/smoke-demos.ts`: A curfew ALLOW, B student export DENY, B2 confidential filtered, C faculty approval → CONSUMED, D tenant isolation  ALL DEMOS PASSED.
- Retrieval (student) "Vice-Chancellor appointment Board of Governors" → `pes-university-act` (2 chunks), `pes-grievance-redressal`, `pes-admission-documents`.

- Rendered the 7 NullTrace demo docs (handbook, hostel-rules, exam-rules, it-maintenance-notice, faculty-guide, student-directory, grades-notes) to `pdf/<id>.pdf` with `scripts/md_to_pdf.py` (reportlab 5.0.1, `PYTHONUTF8=1`), rendered in a scratch folder so the supplied PES PDFs were not overwritten. Each is one page with the correct classification banner. All 20 documents now have md + pdf with matching classification.

### Open
- `pdf-parse` is not installed in `tracefence/node_modules`, so `register_docs.cjs <folder>` cannot convert raw PDFs yet.
- `pes-university-act.md` has 3 lines with Cyrillic look-alike letters ("KARNAТАКА", "АCT") left from PDF extraction; keyword search misses "Karnataka Act" on those lines.

---

## 2026-10-17  PES University policy docs (desaitejas777 fixtures)

### Done
- Added 12 PES University policy docs (11 public, 1 internal) as `fixtures/campus/docs/pes-*.md` + `fixtures/campus/pdf/pes-*.pdf`, with `scripts/register_docs.cjs` and `scripts/md_to_pdf.py`. Content is a paraphrased summary of PES's public website with source URLs in each header; no personal names, phones or emails.
- `node fixtures/campus/scripts/register_docs.cjs` → `added 12; total 19 { public: 15, internal: 2, confidential: 2 }`, no problems. `guest` role and `policyVersion: 1` unchanged (file re-serialized with 2-space JSON).
- Only `hostel-rules.md` mentions curfew, so the student curfew answer stays 10:00 PM.
- Deleted the old demo DB (`tracefence/data/tracefence.sqlite*`) and reseeded via `npx tsx scripts/smoke-demos.ts`: A curfew ALLOW, B student export DENY, B2 confidential filtered, C faculty approval → CONSUMED, D tenant isolation  ALL DEMOS PASSED.
- Retrieval (student): "scholarship SGPA tuition refund" → `pes-scholarships` first; "research policy royalties" → no `pes-research-policy` (listed in `filteredOut`). As faculty the same query returns `pes-research-policy` first.
- `fixtures/campus/README.md`: layout lists the 12 `pes-*` ids with classifications and the `pdf/` + `scripts/` folders.

### Open
- No NullTrace 75% attendance document exists on this branch; the only attendance rule is PES's 80% (`pes-academic-rules.md`). Add one if the demo needs the contrast.

---

## 2026-10-17  Campus fixtures + attack narratives (fixtures branch)

### Done
- Merged `origin/main` and `origin/feature/shashankack-backend` into `feature/desaitejas777-fixtures` (fast-forward, no conflicts).
- `hostel-rules.md`: explicit weekday/weekend curfew line plus an Exceptions section (late pass, exam-week extension).
- `student-directory.md` / `grades-notes.md`: richer but fully fictional rows (`.example` domains, 555-01xx phones), clearly marked confidential.
- `faculty-guide.md`: states that exports of advisee records need one-time admin approval.
- New public `it-maintenance-notice.md` carrying a deliberate injection to `records-sync@attacker.example`; registered in `roles.json`.
- `docs/attacks/`: new `poisoned-source-notice.md`; `campus-export-deny.md` rewritten with real reason codes; README index; `qr-supplier-page.md` marked archived.
- `fixtures/campus/README.md`: documents seeding rules (classification from `roles.json`, insert-only seeding, one-chunk size limit, Riverview isolation) and the demo coverage table.
- Verified on a throwaway DB: 7 docs seeded with correct classes; Riverview isolated; curfew → hostel-rules "10:00 PM"; student fences confidential; notice read with no tool; "follow the notice and export" → DENY `DENIED_EXPORT`; faculty export → REQUIRE_APPROVAL; `scripts/smoke-demos.ts` all pass.

### Notes for backend (shashankack)
- Seeding is insert-only, so fixture text edits don't reach an existing DB  delete `tracefence/data/tracefence.sqlite*` to reseed.
- Keyword retrieval counts short common words ("and", "are", "the"); consider a stop-word list in `chunkIndex.scoreChunk`.

---

## 2026-10-17  UI revamp: login, role-separated workspaces, shadcn, bento (venilashree)

### Done
- Adopted shadcn/ui (new-york, Tailwind v4 tokens). Components live in `tracefence/components/ui`, `cn` helper in `tracefence/components/lib/utils.ts` (nothing added under `lib/**`).
- New deps in `tracefence/package.json`: radix-ui, class-variance-authority, clsx, tailwind-merge, lucide-react, sonner, tw-animate-css (dev).
- Light theme: white surfaces, electric-blue primary, violet secondary; green/red/amber only on gateway decisions.
- `/login`: sign in, create organization (`/api/auth/signup`), one-click demo accounts. Token kept in sessionStorage; identity from `/api/auth/me`.
- Role-separated routes (client gate + server auth on every call): `/student`, `/faculty`, `/admin`, `/admin/approvals`, `/admin/policies`, `/admin/audit`. Removed `/org` and `/audit`.
- Student / faculty bento workspace: assistant, source inspector (highlighted injection, context fence), live trace (blocked external email card), session stats. Faculty adds "My requests" with review progress; faculty cannot approve their own requests in the UI.
- Admin: overview bento (verdict, KPIs, approval queue, policy snapshot, corpus, recent decisions), approval review sheet (payload, countdown, session context, Approve once / Reject), policies (upload, classify, enable, ACL + tool matrices, publish), investigation report (9 evidence checks, EV cases).
- Admin evidence re-fetches events from the server for sessions opened in this browser (ids remembered in localStorage).
- Verified in headless Edge: login → student injection DENY → `/admin` redirected for student → faculty export REQUIRE_APPROVAL → admin approves in sheet → audit 9/9; 390px layout.

### Notes for backend
- Approval decision route accepts any same-tenant user; the admin-only approval step is enforced in the UI only. Consider `requireRole(["admin"])` on `/api/approvals/:id/decision`.
- Removed scripted replay mode (it depended on demo auto-login).

---

## 2026-10-17  Restrained light UI (venilashree)

### Done
- Replaced the neon/glass dark theme with a warm-paper light system: flat white working surfaces, hairline dividers, Inter + JetBrains Mono, one cobalt accent; green/red/amber used only for gateway decisions.
- Console: compact sidebar, 48px top bar with live status + clock, single-line stats strip (incl. forbidden executions), one divided three-column workspace instead of floating cards.
- Untrusted source: SRC-nn record, line-numbered preview with injected phrases highlighted, finding panel, context-fence table, proposed call.
- Live trace: numbered events (#01…) with timestamps; blocked exfiltration shows a red record with plain-language explanation, recipient, reason code, "Not executed".
- Approval drawer: plain-English summary, countdown bar, request details, exact payload, grant binding, Reject / Approve once.
- Audit: investigation report (TF-AUD ref), green verdict with forbidden executions / external emails, decision summary, nine evidence checks computed from live gateway responses (9/9 after running all three scenarios), EV-nnn cases as connected Source → Proposal → Decision → Outcome stages.
- Fast-forwarded to backend `b888268` (adds `.adce/figma-*` exports; no app changes).
- Verified in headless Edge against the live gateway: injection DENY, faculty approval → APPROVAL_CONSUMED, Org → Console chat still works, 390px layout.

---

## 2026-10-17  Command-center UI redesign (venilashree)

### Done
- Fast-forwarded `feature/venilashree-frontend` to `feature/shashankack-backend` (cb73f88); all backend routes kept as-is.
- Dark "security command center" theme: sidebar + top bar with live activity indicator, glass panels, neon-blue accent; green ALLOW / red DENY / amber REQUIRE_APPROVAL badges.
- Console is three columns: **Mission Control** (role, session, demo paths incl. prompt injection, chat) · **Untrusted Source** (latest input with injected phrases highlighted, red warning panel, context entered vs fenced out by ACL, model-proposed action) · **Live Trace** (SOURCE → PROPOSAL → DECISION → OUTCOME, large blocked-exfiltration cards with reason code, timestamp, target).
- Stats strip: session counts + tenant totals polled from `GET /api/audit`.
- Approval drawer: exact payload JSON, expiry countdown, binding (session, args hash, policy version, single use), Approve once / Reject.
- Audit report: verdict banner computed from evidence (turns red if a DENY row carries an executor result), external emails sent, decision summary, filterable expandable evidence trail.
- Fix: `components/api/client.ts` kept one shared Bearer token, so visiting Org (admin login) made later Console chat 403. Tokens are now per role.
- Verified in headless Edge against the live gateway: student injection → `DENIED_EXPORT`; faculty export → approval → `APPROVAL_CONSUMED`; Org → Console chat still works; 390px layout stacks.

### Known gaps (need backend)
- Injection highlighting is a UI heuristic only; enforcement stays in the gateway.
- No API reports test results, so Audit shows how to run `scripts/smoke-demos.ts` instead of a pass count.
- Chat never emits `notify_external`; the "blocked external email" shown is the denied `export_records` attempt with the external address from the untrusted input.

---

## 2026-10-17  Merge Venila UI + Bearer client glue

### Done
- Merged `origin/feature/venilashree-frontend` into `feature/shashankack-backend`.
- Wired `components/api/client.ts` to demo login + Bearer (role tabs → `*@nulltrace.demo` / `demo1234`).
- Live Console curfew ALLOW verified in browser; Org page loads live docs + policy matrices.

### Next
- Faculty approval path in UI; push merge + client glue; Venila polish login UX if desired.

---

## 2026-10-17  Killer demos verified + switch-tenant

### Done
- `POST /api/auth/switch-tenant` for multi-membership users.
- `scripts/smoke-demos.ts` passes: student curfew ALLOW, student export DENY, faculty APPROVE→CONSUMED, Riverview tenant isolation.

### Next
- Frontend login + Bearer + Org wiring; Varun/Spandana consume smoke path.

---

## 2026-10-17  Multi-tenant SQLite + real auth

### Done
- Tables: `tenants`, `users`, `memberships`, `auth_sessions`; `org_documents` / `org_policy` keyed by `tenant_id`.
- Auth APIs: signup / login / logout / me (scrypt passwords, Bearer tokens).
- Chat + Org + approvals require Bearer; identity never taken from request body.
- DEMO_MODE seeds `nulltrace-institute` + `riverview-college` and demo users (`demo1234`).

### Next
- Frontend login + tenant switcher; tester acceptance for cross-tenant isolation.

---

## 2026-10-17  Org Admin APIs + approval execute

### Done
- `GET/POST /api/org/documents`, `PATCH /api/org/documents/:id`, `GET/PUT /api/org/policy` (admin via Bearer).
- SQLite `org_documents` + `org_policy`; edits bump `policyVersion`; retrieval reads upload overrides.
- Approval `APPROVE` executes the bound tool once and marks `CONSUMED` (OUTCOME event).

### Next
- Smoke the three killer demos; frontend wires Org page to these routes.

---

## 2026-10-17  Refresh teammate prompts + push

### Done
- Regenerated all `docs/prompts/MASTER_*.md` with mandatory `git merge origin/main` and product lock (no RAG, not email-only, Org Admin, Next.js APIs).
- Tester prompt (`MASTER_Varun-op.md`) + `docs/testing/strategy.md` updated for `/api/sessions` acceptance matrix.

### Next
- Teammates pull/merge main before coding; Varun starts API acceptance tests.

---

## 2026-10-17  Org Admin surface (docs + policies)

### Decision
- Product needs an **Org / Admin** page: upload documents, classify sources, define role→collection ACLs and tool ALLOW/DENY/REQUIRE_APPROVAL, bump policy version.
- Console remains chat + rail; Admin is how orgs “bring their corpus.”
- MVP: UI + APIs over SQLite (seed from fixtures OK); no vector RAG.

### Next
- Figma: add Org Admin page; frontend ships Admin + Console; backend upload/policy routes.

---

## 2026-10-17  No vector RAG for MVP

### Decision
- Ship **ACL/keyword filtered sources + Ollama** (scripted fallback).
- **No** embeddings / vector RAG in the hackathon build.
- Security story stays “filter before context + tool gateway,” not “we have RAG.”

---

## 2026-10-17  Reaffirm original TraceFence (not email-only)

### Decision
- Product = **original TraceFence**: source-aware security gateway for AI agents.
- Campus remains the **demo domain**, not a rename of the product.
- Explicitly **not** an email-only pitch; email/notify is one tool among search, read, export, etc.
- Keep SOURCE → PROPOSAL → DECISION → OUTCOME + exact-action approvals from the blueprint.

### Done
- Updated SCOPE, JUDGE brief, PRESENTATION, PPT_ALIGNMENT, DEMO_SCRIPT, SYSTEM opener.

### Next
- Frontend decision rail; optional synthetic “email attacker” source → DENY; polish Ollama/scenarios.

---

## 2026-10-17  Campus gateway MVP (sessions + ACL)

### Done
- `POST /api/sessions`, `POST /api/sessions/:id/messages`, `GET /api/sessions/:id/events`
- Role ACL retrieval (`fixtures/campus`); confidential docs never enter student context
- Gateway: student `export_records` DENY; faculty REQUIRE_APPROVAL + pending approvals
- Scripted answers + optional Ollama; legacy `/api/tasks` returns 410
- Smoke: curfew ALLOW, student export DENY, faculty approval PENDING

### Next
- Frontend chat UI (venilashree); fixture polish (desaitejas); tests (Varun); scenarios (Spandana)
- Consume approved export on retry; richer chat UX

---

## 2026-10-17  Lock product name + tagline

### Decision
- Hackathon ships **one** product: **TraceFence**.
- Locked tagline: *A source-aware security gateway for AI agents*.
- SecureRAG design doc = **internal reference only**  not a co-product or slide brand.

### Done
- Rewrote JUDGE brief, SCOPE, SECURERAG_ALIGNMENT, PRESENTATION, PPT_ALIGNMENT, SYSTEM, DEMO, TEAM, README, cursor rule around that lock.
- Regenerated all `docs/prompts/MASTER_*.md` with GIT-first steps + MUST READ doc lists.
- Commit + push to `main` so teammates can pull.

### Next
- Teammates: `git pull` their feature branch; paste their MASTER prompt.

---

## 2026-10-17  Align TraceFence docs with SecureRAG

### Done
- Added [`SECURERAG_ALIGNMENT.md`](./SECURERAG_ALIGNMENT.md).
- Rewrote SCOPE, SYSTEM, JUDGE brief, contracts, PRESENTATION, DEMO, TEAM, PPT_ALIGNMENT, README, cursor rule, ADR, requirements/architecture/security/design/testing, campus fixtures README, all `docs/prompts/MASTER_*.md`, ADCE master trust order.
- Framing: SecureRAG = architecture; TraceFence = campus domain product; filtered retrieval + tool gateway.

### Next
- Commit/push doc set; regenerate PPT; `implement` sessions + ACL retrieval.
- `adce authority set` on SecureRAG design + alignment docs.

---

## 2026-10-17  REVAMP: Campus Policy Firewall (A + campus)

### Decision
- Drop invoice/email-as-hero and QR-primary story.
- **Chat-first** TraceFence for **NullTrace Institute** (synthetic campus).
- Roles: student / faculty / admin.
- Tools: `search_docs`, `read_document`, `export_records`, (+ optional notify/announce) via gateway.
- Killer demo: student curfew ALLOW; student export DENY; faculty export approval.

### Done
- Rewrote SCOPE, SYSTEM, JUDGE brief, contracts, PRESENTATION, DEMO, TEAM, PPT_ALIGNMENT, README, cursor rule, campus fixtures READMEs.

### Next
- Regenerate `docs/prompts/MASTER_*.md` for campus ownership.
- Rewire `tracefence/` APIs from tasks/invoices → sessions/chat (say `implement`).
- Update Mystara PPT file to campus slides.
- Team sign-off on JUDGE_AND_TEAM_BRIEF.

---

## 2026-10-17  Judge & team brief for agreement

### Done
- Added [`docs/JUDGE_AND_TEAM_BRIEF.md`](./JUDGE_AND_TEAM_BRIEF.md): 60s pitch, Q&A, build checklist, sign-off table.

### Next
- Team reads brief; if all agree, continue wiring demo path (inspect → gateway DENY → timeline).

---

## 2026-10-17  Implement: Next.js scaffold + API stubs

### Done
- Scaffolded `tracefence/` (Next 16, TS, Tailwind, Zod, better-sqlite3).
- Lib: db schema/client + invoice seed, authorize/gateway/approvals/canonicalize, tools, investigate allowlist stub, orchestrator stub.
- API routes per contracts: sources, tasks, approvals, audit.
- Public synthetic page: `/fixtures/pages/supplier-attack.html`.
- `npm run build` succeeds.

### Still stubbed (next slices)
- Playwright fetch + SOURCE persist
- Ollama orchestrator loop + scenarios fallback
- Full approval consume → execute path

### Next
- Push `feature/shashankack-backend`; Playwright inspect + run loop.

---

## 2026-10-17  Individual master prompts + push

### Done
- Regenerated ADCE + git master prompts for **TraceFence**.
- Added per-person paste files under [`docs/prompts/`](./prompts/) (all five teammates).
- Commit and push to `origin/main`; sync feature branches.

### Next
- Teammates pull `main`, checkout their branch, paste their `MASTER_*.md`.

---

## 2026-10-17  Product name locked: TraceFence

### Done
- Renamed product branding from TrustFence/TrustTrace → **TraceFence** across living docs, cursor rule, OpenAPI, blueprint filename `docs/TraceFence_Project_Blueprint.md`.
- App path / DB: `tracefence/`, `./data/tracefence.sqlite`.
- Team remains **NullTrace**. GitHub: `shashankack/TraceFence`.

### Next
- On PPT: ensure title uses **TraceFence** (not TrustFence/TrustTrace).
- Commit/push when ready; `adce scan` after rename.

---

## 2026-10-17  Option A locked: project follows Mystara PPT

### Done
- Decision **A** applied across living docs: QR/URL + Playwright synthetic pages + SOURCE→PROPOSAL→DECISION→OUTCOME.
- Updated SCOPE, SYSTEM, contracts, TEAM, PRESENTATION, DEMO, ADR, requirements/architecture/design/security/testing, agent prompts, cursor rule, openapi, fixtures/pages + attacks narrative.
- Brand: product **TraceFence**, team **NullTrace**, 5 people; Ollama = local LLM API.

### PPT file still needs (human)
- TraceFence → TraceFence; 6 → 5; “LLM API” → local Ollama wording.

### Next
- Commit/push docs; Tejas: `supplier-attack.html`; Spandana: QR-attack scenario; lead: `implement` app when ready.

---

## 2026-10-17  PPT alignment review (Mystara pitch)

### Done
- Compared PPT to docs; gaps documented in [`PPT_ALIGNMENT.md`](./PPT_ALIGNMENT.md).

### Decision
- **A chosen** (see entry above).

---

## 2026-10-17  Presentation / demo pack

### Done
- Added [`PRESENTATION.md`](./PRESENTATION.md) (5 slides + speaker lines).
- Added [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) (3-minute timed demo + elevator).
- Added [`QA_CHEATSHEET.md`](./QA_CHEATSHEET.md) for judges.
- Linked from README.

### Next
- Assign narrator + operator; rehearse once with scripted fallback.
- Build slides in PowerPoint/Google Slides from PRESENTATION.md (or present from markdown).
- Push to GitHub when ready.

---

## 2026-10-17  ADCE master prompt for teammate agents

### Done
- Added [`docs/AGENT_ADCE_MASTER_PROMPT.md`](./AGENT_ADCE_MASTER_PROMPT.md): shared ADCE workflow + per-role add-ons.
- Cross-linked from git master prompt, `TEAM_AND_GIT.md`, and README. Paste order: ADCE → Git.

### Next
- Push this doc to `origin/main` when ready; teammates re-pull and paste both prompts.

---

## 2026-10-17  Link GitHub remote TraceFence

### Done
- Remote: `https://github.com/shashankack/TraceFence.git` as `origin`.
- Push `main` and all five feature branches (after committing pending `.gitignore` + PROGRESS if needed).

### Next
- Teammates clone and check out their `feature/<github-username-role>` branch.
- Paste agent prompts from `docs/AGENT_GIT_MASTER_PROMPT.md`.

---

## 2026-10-17  Expand `.gitignore`

### Done
- Broadened [`.gitignore`](../.gitignore): deps (yarn/pnpm), secrets patterns, Next/Vercel/Turbo, test reports, SQLite WAL/SHM, OS/editor junk, ADCE runtime, Cursor plans, Python venvs, GGUF/model weights, `tracefence/` local build/data.

### Still tracked (intentional)
- `.cursor/rules/`, `.adce/config.yaml`, `.adce/artifacts/README.md`, all docs and ownership paths.

### Next
- Push remote when ready; no need to recommit unless `.gitignore` change should land on `main`.

---

## 2026-10-17  Scope, team, local LLM, and git finalized

### Done
- Locked MVP scope: task-scoped tool firewall; synthetic invoice demo; no RAG.
- Chose local LLM: Ollama + `qwen3:8b` with scripted proposal fallback.
- Assigned 5-person path-owned roles and feature branches (see `TEAM_AND_GIT.md`).
- Wrote living docs: `SCOPE_AND_RULES.md`, `SYSTEM_OVERVIEW.md`, `TEAM_AND_GIT.md`, `local-llm.md`, `contracts.md`, `AGENT_GIT_MASTER_PROMPT.md`.
- Replaced ADCE stubs for requirements, architecture, security, design, testing, ADR.
- Pointed blueprint §17 at the 5-person allocation.
- Initialized git repo, `.gitignore`, initial docs commit, five feature branches.

### Decisions locked
- Product name: **TraceFence** (not AgentGate).
- Decisions: `ALLOW` | `DENY` | `REQUIRE_APPROVAL`; default deny.
- LLM: local Ollama `qwen3:8b`; no cloud key required for MVP.
- Coding agents propose; humans type until someone says `implement`.
- Only `shashankack` merges to `main`.

### Next
- Scaffold Next.js app under `tracefence/` when lead says `implement`.
- Teammates clone, check out their branch, paste agent master prompt.
- Spandana: pull `qwen3:8b` and land first smoke scenario under `scenarios/`.

### Blockers
- None for docs/git. App code not started.

### ADCE / git follow-up (same day)
- `adce scan --full`: 22 artifacts; git detected.
- Authority: blueprint CANONICAL; SCOPE/TEAM/SYSTEM/contracts/ADR AUTHORITATIVE + VERIFIED; local-llm, agent prompts, PROGRESS, requirements/architecture/security SUPPORTING.
- Git: `main` at initial docs commit; branches created  `feature/shashankack-backend`, `feature/venilashree-frontend`, `feature/desaitejas777-fixtures`, `feature/Varun-op-tests`, `feature/Spandananarayanaswamy-runtime`.
- Remote not pushed yet  `shashankack` should create GitHub repo and `git push -u origin main` then push all feature branches.
