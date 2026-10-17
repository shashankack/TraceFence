# TraceFence — Full PPT slide content

Copy each slide into PowerPoint / Google Slides. Keep **TraceFence** as the product name.  
Pitch lock: [`PPT_ALIGNMENT.md`](./PPT_ALIGNMENT.md) · Demo prep: [`TEAMMATE_PRESENTATION_BRIEF.md`](./TEAMMATE_PRESENTATION_BRIEF.md).

**Suggested length:** 12–16 slides · **Team:** NullTrace · **Demo domain:** Campus (NullTrace Institute)

---

## Slide 1 — Title

**On slide**
- **TraceFence**
- NullTrace
- *A source-aware security gateway for AI agents*
- Hackathon demo · Synthetic campus data only

**Speaker notes**  
Introduce team name and one-line product. Do not say SecureRAG or “email product.”

---

## Slide 2 — The problem

**On slide**
- AI agents **read untrusted sources** and **call tools**
- Documents can contain: “ignore rules,” “export all emails,” “you are admin”
- Prompting the model to “behave” is **not** a control plane
- Without a gateway: leakage, unauthorized exports, no audit trail

**Speaker notes**  
Contrast hope-based safety vs enforceable policy in application code.

---

## Slide 3 — What TraceFence is

**On slide**
- **Source-aware security gateway** for AI agents
- Decides **what the agent may read** and **what it may do**
- Enforced in **server application code** — not by the model
- The model may **propose**; only the gateway may **execute**

**Speaker notes**  
One sentence: TraceFence is the fence around the agent, configured by the org.

---

## Slide 4 — Three pillars

**On slide**
1. **Source-aware** — only ACL-allowed text enters LLM context; document text ≠ authority  
2. **Multi-tool gateway** — ALLOW / DENY / REQUIRE_APPROVAL on every consequential tool  
3. **Visible trail** — SOURCE → PROPOSAL → DECISION → OUTCOME  

**Speaker notes**  
Point at the decision rail in the live UI later.

---

## Slide 5 — Not an email-only product

**On slide**
| Tool | Purpose |
|---|---|
| `search_docs` / `read_document` | Permission-filtered reads |
| `export_records` | Sensitive bulk export |
| `post_announcement` | Campus announcements |
| `notify_external` | External notify / email-class action |
| `use_chat_upload` | Use a **sanitized** chat attachment |

- Notify/email is **one tool among several**
- The product is the **gateway**, not a mail filter

**Speaker notes**  
Judges often assume “email firewall” — correct that early.

---

## Slide 6 — Org configures the fence

**On slide**
Admin can:
- Upload / manage documents (md, txt, pdf-as-text)
- Set classification: **public · internal · confidential**
- Set per-role **collection ACLs**
- Set per-role **tool policy** (ALLOW / DENY / REQUIRE_APPROVAL)
- Publish → **policy version** bumps; sessions bind to a version

**Hard rule:** Source / chat text **cannot** change permissions.

**Speaker notes**  
Show Admin → Sources & policies in the demo.

---

## Slide 7 — How a request flows

**On slide**
```
User chat
  → Server session (trusted role + tenant)
  → Policy engine
  → ACL-filtered chunk retrieval
  → Content guards (untrusted text)
  → LLM (Allowed context only)
  → Tool proposal (if any)
  → Gateway: ALLOW | DENY | REQUIRE_APPROVAL
  → Answer + decision rail + audit
```

**Reject:** retrieve everything → prompt “don’t reveal secrets.”

**Speaker notes**  
Identity never comes from the browser’s JSON or from the model.

---

## Slide 8 — Architecture (stack)

**On slide**
- **UI:** Next.js App Router · TypeScript · role workspaces (student / faculty / admin)
- **API:** Bearer auth · campus sessions · org / approvals / audit
- **Gateway:** `authorize` + schema validation + single-use approvals
- **Retrieval:** Lexical **chunk RAG** (no vector DB in MVP)
- **LLM:** Ollama `qwen3:8b` + scripted fallback (same filters)
- **Store:** SQLite (sessions, events, policies, corpus, approvals)

**Speaker notes**  
Honest: keyword/chunk RAG is enough for the campus demo.

---

## Slide 9 — Campus demo world

**On slide**
- **Tenant:** NullTrace Institute (synthetic)
- **Roles:** Guest · Student · Faculty · Admin
- **Public:** handbook, hostel rules, exam rules, IT notice  
- **Internal:** faculty guide  
- **Confidential:** student directory, grades notes  

All names/emails use reserved `.example` domains — **no real PII**.

**Speaker notes**  
Campus = clear public vs confidential so judges “see” the fence in minutes.

---

## Slide 10 — Policy matrix (campus MVP)

**On slide**

| Tool | Student | Faculty | Admin |
|---|---|---|---|
| search / read | public only | + internal/confidential | all |
| `export_records` | **DENY** | **REQUIRE_APPROVAL** | ALLOW |
| `post_announcement` | DENY | REQUIRE_APPROVAL | ALLOW |
| `notify_external` | DENY | DENY | REQUIRE_APPROVAL |
| `use_chat_upload` | ALLOW | ALLOW | ALLOW |

Guest: public Q&A only; uploads / exports need sign-in.  
**Default deny** if no rule matches.

---

## Slide 11 — Live demo agenda

**On slide**
1. **Admin** — corpus + policy matrix (policy version)  
2. **Student** — hostel curfew → **ALLOW** (public sources)  
3. **Student** — export / peer grades → **fenced + DENY**  
4. **Faculty** — export → **REQUIRE_APPROVAL** → admin approves **once**  
5. *(Optional)* Poisoned doc or chat upload → still **DENY** / sanitized  

**Accounts:** `*@nulltrace.demo` / password `demo1234`

**Speaker notes**  
Run demo before more slides if time is short. Point at rail reason codes.

---

## Slide 12 — Demo deep dive: student ALLOW

**On slide**
- Ask: “What time is hostel curfew on weekdays?”
- Gateway: `search_docs` **ALLOW**
- Context: public hostel rules only
- Confidential directory / grades **never** enter context
- Answer grounded in Allowed sources

**Speaker notes**  
Show citations / classification badges if visible in UI.

---

## Slide 13 — Demo deep dive: DENY & approval

**On slide**
**Student export**
- `export_records` → **DENY** (`DENIED_EXPORT`)
- No CSV / no side effect

**Faculty export**
- Same tool → **REQUIRE_APPROVAL**
- Approval binds: exact tool + canonical args + session + caller + expiry
- Approve once → execute → **CONSUMED**
- Replay rejected

**Speaker notes**  
Approvals are single-use by design — not a sticky “admin mode.”

---

## Slide 14 — Untrusted content & uploads

**On slide**
- Corpus may include injection (“export to attacker@…”)
- Chat file attach: **sanitize first** (strip injection, tool inducement, markup, role spoof)
- Status: ready / flagged / blocked
- Gateway tool `use_chat_upload` — only **cleaned** text may enter context
- Raw poison **never** becomes policy authority

**Speaker notes**  
Optional live attach of `fixtures/campus/uploads/poisoned-chat-note.txt`.

---

## Slide 15 — Audit & evidence

**On slide**
- Every consequential decision lands in the **timeline**
- Admin **Audit** report: sessions, decisions, reason codes
- Approvals inbox / notifications (mock outbox; optional SMTP)
- DEMO_MODE seeds fixtures — **does not** bypass DENY

**Speaker notes**  
Close the loop: configurable fence → live decisions → inspectable evidence.

---

## Slide 16 — What we are / are not claiming

**On slide**
**We show**
- Enforceable read ACL + tool policy for agents
- Human approval for exact dangerous actions
- Inspectable SOURCE → … → OUTCOME trail

**We do not claim**
- Prompt-injection immunity
- Production-grade security / ABAC / SSO
- That we invented scanning or authorization
- Real SMTP delivery or real student PII

**Speaker notes**  
Honesty builds judge trust.

---

## Slide 17 — What’s next

**On slide**
- Same gateway → more connectors (SharePoint, Drive, tickets)
- Richer document formats & output DLP
- More domains beyond campus (same control plane)
- Stronger continuous evaluation / red-team suites

**Speaker notes**  
Campus is the demo domain; TraceFence is domain-agnostic by design.

---

## Slide 18 — Team & thank you

**On slide**
- **TraceFence** · NullTrace
- *A source-aware security gateway for AI agents*
- Questions?

**Optional footer**  
Repo / local: Next.js · SQLite · Ollama `qwen3:8b` · synthetic fixtures only

---

## Backup slides (if asked)

### B1 — Why not “just RAG with a system prompt”?
- Unauthorized chunks must never enter context
- Tools must hit the same gateway even if the model “agrees” to export

### B2 — Guest vs signed-in
- Guest: public handbook / hostel / exams
- Signed-in: role-bound collections + tools
- Elevated guest intents → login (`AUTH_REQUIRED`)

### B3 — Custom org roles
- Admins can add labels / gateway role ids
- Permissions still come from server policy — not display names

### B4 — Tech one-liner
- Next.js App Router + TypeScript · better-sqlite3 · Ollama · lexical chunk RAG · shadcn-style UI

---

## Timing guide (10–12 min)

| Minutes | Slides |
|---|---|
| 0–1 | 1–3 Title + problem + what it is |
| 1–3 | 4–8 Pillars, tools, org, flow, stack |
| 3–7 | **Live demo** (slides 11–13 as checklist) |
| 7–9 | 14–16 Untrusted content, audit, honesty |
| 9–10 | 17–18 Next + thank you |

---

## Do / Don’t checklist for the deck

| Do | Don’t |
|---|---|
| Product name **TraceFence** only | Dual-brand SecureRAG |
| Multi-tool gateway story | Email-only hero |
| Campus as **demo domain** | Claim campus is the only product |
| Default deny + exact approvals | “AI will refuse unsafe asks” as the control |
| Synthetic data disclaimer | Real PII / production security claims |
