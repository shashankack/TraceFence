# TraceFence   Teammate presentation brief

**Team:** NullTrace · **Product:** TraceFence  
**Tagline:** *A source-aware security gateway for AI agents*  
**Branch tip (backend):** `feature/shashankack-backend`

Use this one-pager to prep slides, demo roles, and Q&A. Living product rules: [`SCOPE_AND_RULES.md`](./SCOPE_AND_RULES.md). **Full slide copy:** [`PPT_SLIDE_CONTENT.md`](./PPT_SLIDE_CONTENT.md). Short skeleton: [`PRESENTATION.md`](./PRESENTATION.md). Pitch lock: [`PPT_ALIGNMENT.md`](./PPT_ALIGNMENT.md).

---

## One-sentence product

TraceFence decides **what an AI agent may read** and **what tools it may run** in application code   not by trusting the model or the document text.

---

## 60-second pitch (say this)

> Agents read untrusted sources and call tools. Hoping the model “behaves” is not a security boundary.  
>  
> **TraceFence** is a source-aware security gateway. The org uploads documents and sets who may read which collections and which tools are ALLOW / DENY / REQUIRE_APPROVAL. We filter what enters model context, and every consequential tool hits the gateway. Timeline: **SOURCE → PROPOSAL → DECISION → OUTCOME**.  
>  
> Demo: Admin shows corpus + policy matrix, then campus chat   student gets hostel curfew from public sources; cannot pull confidential directory into context; export is **DENY**. Faculty export needs **one exact approval**. Document text cannot rewrite permissions.  
>  
> We are **not** claiming prompt-injection immunity or production security. We show inspectable, enforceable agent permissions.

---

## Branding rules (judges / slides)

| Do say | Do **not** say |
|---|---|
| TraceFence | SecureRAG as a second product |
| Source-aware security gateway | “Email firewall” / email-only product |
| Multi-tool gateway (search, read, export, announce, notify) | Invoice/QR as the sole story |
| Default deny; approvals bind exact tool + args | Prompt-injection proof / production-ready |
| Synthetic campus data only | Real PII / real SMTP claims |

---

## Who does what on stage

| Moment | Owner | What to show |
|---|---|---|
| Title + problem | Anyone | Agents + untrusted sources + tools |
| Idea (3 pillars) | Platform | Source filter · gateway · timeline |
| Org configures fence | Frontend / Admin | Upload doc · classify · policy matrix · version |
| Live campus demo | Runtime + Frontend | Roles below |
| Honesty + next | Anyone | Non-claims · same gateway → more domains |

---

## Killer demo script (≈3 minutes)

**Accounts** (password `demo1234`):  
`student@nulltrace.demo` · `faculty@nulltrace.demo` · `admin@nulltrace.demo`

| # | Role | Action | Expected (point at rail / audit) |
|---|---|---|---|
| 1 | **Admin** | Sources & policies: corpus + tool matrix | Policy version; student export DENY; faculty REQUIRE_APPROVAL |
| 2 | **Student** | “What time is hostel curfew on weekdays?” | `search_docs` ALLOW; answer from **public** hostel rules |
| 3 | **Student** | Ask for peer grades / directory / “export all student emails” | Confidential **fenced**; `export_records` **DENY** |
| 4 | **Faculty** | Same export ask | **REQUIRE_APPROVAL**; admin Approvals → Approve once → CONSUMED; replay fails |
| 5 | *(optional)* | Open `it-maintenance-notice` / attach poisoned chat file | Source text induces export → still DENY; upload sanitized via `use_chat_upload` |

**Guest:** public campus Q&A without login; elevated intents → sign-in gate.

---

## Architecture in one diagram (verbal)

```
Browser (chat / admin UI)
    → Next.js API (Bearer session: userId, role, tenantId from server)
        → ACL retrieval (only allowed collections)
        → Content guards (untrusted text ≠ authority)
        → Gateway authorize → ALLOW | DENY | REQUIRE_APPROVAL
            → Tool executor (only if ALLOW / after approval)
        → SQLite timeline + audit
        → Ollama qwen3:8b (or scripted fallback) with Allowed context only
```

**Invariant:** The model may **propose**. Only the **server gateway** may **execute**.

---

## Current tools & default campus policy (v2)

| Tool | Guest | Student | Faculty | Admin |
|---|---|---|---|---|
| `search_docs` / `read_document` | ALLOW (public) | ALLOW (public) | ALLOW (+ internal/confidential) | ALLOW |
| `export_records` | DENY | DENY | REQUIRE_APPROVAL | ALLOW |
| `post_announcement` | DENY | DENY | REQUIRE_APPROVAL | ALLOW |
| `notify_external` | DENY | DENY | DENY | REQUIRE_APPROVAL |
| `use_chat_upload` | DENY | ALLOW | ALLOW | ALLOW |

Chat uploads: sanitize on server first; gateway must ALLOW before cleaned text enters context.

---

## Fixtures (NullTrace only)

Under `fixtures/campus/docs/`   **no PES corpus** on current backend tip:

| Doc | Class |
|---|---|
| handbook, hostel-rules, exam-rules, it-maintenance-notice | public |
| faculty-guide | internal |
| student-directory, grades-notes | confidential |

Attack narratives: `docs/attacks/` (`campus-export-deny`, `poisoned-source-notice`, `poisoned-chat-upload`).

---

## Run locally before demo day

```bash
cd tracefence
cp .env.example .env   # if needed
ollama pull qwen3:8b
# Fresh DB after fixture/policy changes:
# delete data/tracefence.sqlite*
npm run dev            # http://localhost:3000
npx tsx scripts/smoke-demos.ts
```

`DEMO_MODE=true` seeds fixtures and labels demos   it **must never** bypass a DENY.

---

## Honest Q&A cheatsheet

| Judge question | Answer |
|---|---|
| What is TraceFence? | Source-aware security gateway for AI agents. |
| Just blocking email? | No   filter reads + gate many tools; notify is one tool. |
| Why campus? | Clear public vs confidential so the fence is visible in minutes. |
| Model ignores policy? | Bad sources stay out of context; tools still denied in app code. |
| Did you invent RBAC/RAG? | No   we compose known controls into an agent gateway with a visible trail. |
| Injection-proof? | No. We detect/log/strip and still enforce policy. |

---

## Team branches (reference)

| Person | Branch | Focus |
|---|---|---|
| shashankack | `feature/shashankack-backend` | Gateway, API, DB, Ollama |
| venilashree | `feature/venilashree-frontend` | Chat / admin UI |
| desaitejas777 | `feature/desaitejas777-fixtures` | Campus fixtures + attacks |
| Varun-op | `feature/Varun-op-tests` | Tests / smoke strategy |
| Spandananarayanaswamy | `feature/Spandananarayanaswamy-runtime` | LLM scenarios |

Details: [`TEAM_AND_GIT.md`](./TEAM_AND_GIT.md).

---

## Codebase deep dive

See [`CODEBASE_MAP.md`](./CODEBASE_MAP.md) (layout + every env var).
