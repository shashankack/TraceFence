# Design reference — policy-driven RAG ideas (not a product)

**Hackathon product name: TraceFence only.**  
**Locked tagline:** *A source-aware security gateway for AI agents*

[`secure_rag_domain_agnostic_design.md`](./secure_rag_domain_agnostic_design.md) is an **internal design reference** for policy-outside-the-LLM patterns. It is **not** a second product, not a co-brand, and not what we pitch on slides.

## Shared invariants (never dilute)

1. **The LLM is never the security boundary.**
2. **Unauthorized content must never enter the LLM context** — filter retrieval *before* generation (not “retrieve all, then ask the model to hide secrets”).
3. Retrieved documents are **untrusted data** (indirect prompt injection); they cannot change policy.
4. **Tool / action authorization** is enforced in application code (gateway), same as retrieval filters.
5. **Audit** every identity-relevant retrieval and tool decision.

## Mapping (reference → TraceFence MVP)

| Design-reference concept | TraceFence MVP |
|---|---|
| Platform core | Gateway, role policy engine, session APIs, audit, LLM adapter (Ollama) |
| Domain configuration | Campus: roles, collections, tool matrix, fixtures under `fixtures/campus/` |
| Identity | Demo role selector → server session (`student` \| `faculty` \| `admin`); not full OAuth |
| Permission-filtered retrieval | `search_docs` / `read_document` only return docs allowed for role/collection |
| Input / retrieved-content guardrails | Minimal: strip/ignore “ignore previous instructions” patterns in retrieved text if time; else treat as untrusted context only |
| Output DLP | P1: block answers that echo sensitive fields student cannot access |
| Tool authorization | `export_records`, `post_announcement`, `notify_external` via ALLOW/DENY/REQUIRE_APPROVAL |
| Tenant isolation | Single demo tenant `nulltrace-institute` |
| Multi-domain packs | Roadmap — prove campus first |

## Positioning (judges)

> **TraceFence** — a source-aware security gateway for AI agents. Campus chat shows filtered sources and a tool gateway. Security stays outside the LLM.

Do **not** claim: we are shipping SecureRAG as a product, complete prompt-injection immunity, full ABAC, multi-tenant production isolation, or that we invented RAG security.
