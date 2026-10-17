# TraceFence — Scope and Dev Rules

**Product:** TraceFence · **Team:** NullTrace  
**Tagline:** *A source-aware security gateway for AI agents*

**Demo slice:** Campus chat (education) — NullTrace Institute.  
**Design reference (not a second product):** [`SECURERAG_ALIGNMENT.md`](./SECURERAG_ALIGNMENT.md), [`secure_rag_domain_agnostic_design.md`](./secure_rag_domain_agnostic_design.md).

## Pitch (one line)

TraceFence: **source-aware** control of what the agent may **read** (permission-filtered retrieval) and **do** (tool gateway ALLOW / DENY / REQUIRE_APPROVAL) — enforced in application code, not by the model.

## Demo world

**Tenant:** `nulltrace-institute` (synthetic).  
**Roles:** `student` | `faculty` | `admin`  
**Corpus:** handbook, hostel/exam rules (public); fake student-directory / grades notes (confidential).  
No real signup/uploads in MVP.

## P0 (must ship)

### Gateway pillars (required)

1. **Identity** — server session with trusted `role` (UI may pick role; server stores it).
2. **Source-aware retrieval** — search/read only returns documents/collections allowed for that role. Confidential docs never enter student LLM context.
3. **Untrusted retrieved content** — retrieved text cannot change policy or escalate role.
4. **Tool authorization** — every consequential tool goes through the gateway.

### Product surface

5. Chat panel + role selector + decision / audit rail.
6. Tools: `search_docs`, `read_document`, `export_records` (+ optional `post_announcement` / `notify_external`).
7. Killer demos:
   - Student: hostel curfew → retrieve public handbook only → ALLOW → answer.
   - Student: ask for peer grades / directory dump → no confidential retrieval +/or `export_records` **DENY**.
   - Faculty: `export_records` → REQUIRE_APPROVAL → one-time approve.
8. Local LLM (Ollama `qwen3:8b`) + scripted fallback through **same** filters + gateway.
9. SQLite audit with reason codes.
10. Honest limits stated in pitch.

## P1 (after P0)

- Vector embeddings / real RAG index
- Output DLP / redaction pass
- Stronger retrieved-content injection heuristics
- Self-serve doc upload; second demo domain later
- Full OAuth / multi-tenant

## Out of scope (24h)

- Real student PII, real email
- Production ABAC, crypto integrity, full tenant isolation
- Claiming prompt-injection immunity
- Invoice/QR/email-hero as primary story
- Shipping a second product named SecureRAG
- Building every module in the design-reference doc

## Invariants

- Product name for judges/slides/repo pitch: **TraceFence** only.
- Tagline: **A source-aware security gateway for AI agents.**
- LLM is not the security boundary.
- Unauthorized docs never enter model context.
- Model proposes tools; only gateway executes.
- `userId`, `role`, `tenantId`, policy version from server.
- `DEMO_MODE` never bypasses DENY.

## Novelty (honest)

Source-aware read filters + tool decisions outside the model, shown as a **working campus demo** — not inventing RAG or RBAC.

## Coding rules

Path ownership: `TEAM_AND_GIT.md`. No app code until lead says `implement`. Update `PROGRESS.md` each iteration. ADCE before large changes; prefer SCOPE over stale blueprint invoice sections.
