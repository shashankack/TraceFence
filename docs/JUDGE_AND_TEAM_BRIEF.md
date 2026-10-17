# TraceFence — Judge & team brief

**Product:** TraceFence · **Team:** NullTrace  
**Tagline:** *A source-aware security gateway for AI agents*

**Demo domain:** Campus chat (NullTrace Institute) — filtered retrieval + tool gateway.

---

## 60-second judge pitch

> **TraceFence** is a source-aware security gateway for AI agents. Agents propose tools and need context from documents — we decide what they may **read** and what they may **do**, in application code, not by trusting the model.  
>  
> Demo world: campus chat. A student learns hostel curfew from the public handbook (allowed sources only). The same student cannot pull the confidential directory into context and cannot export student emails — **DENY** with an audit trail. Faculty can request an export with one exact approval.  
>  
> Source-aware means unauthorized content never enters the model; every consequential tool hits ALLOW / DENY / REQUIRE_APPROVAL. We are not claiming perfect prompt-injection immunity.

---

## Q&A

| Q | A |
|---|---|
| What is TraceFence? | A source-aware security gateway for AI agents (demo: campus chat). |
| Is this “SecureRAG”? | No second product. We use policy-outside-the-LLM / filtered-retrieval ideas; the **product name is TraceFence**. |
| Why campus? | Concrete sources + roles to show read filters and tool decisions in 3 minutes. |
| What if the model ignores policy? | Confidential docs never retrieved; tools still denied by gateway. |

---

## Build checklist

1. [ ] Session + role identity  
2. [ ] ACL-filtered `search_docs` / `read_document`  
3. [ ] Chat uses only filtered context  
4. [ ] `export_records` DENY student / APPROVAL faculty  
5. [ ] Decision rail + audit  
6. [ ] Ollama + scripted fallback  

**Out:** Full multi-domain platform, production ABAC/crypto, inventing RAG/RBAC, dual branding as SecureRAG.

---

## Sign-off

| Name | Agree (Y/N) | Date |
|---|---|---|
| shashankack | | |
| venilashree | | |
| desaitejas777 | | |
| Varun-op | | |
| Spandananarayanaswamy | | |
