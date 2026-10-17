# TraceFence  Judge & team brief

**Product:** TraceFence · **Team:** NullTrace  
**Tagline:** *A source-aware security gateway for AI agents*

**Demo:** Campus sources + multi-tool gateway + **org admin** (upload docs / define policies)  **not** an email-only product.

---

## 60-second judge pitch

> AI agents read untrusted sources and call tools. Hoping the model “behaves” is not a security boundary.  
>  
> **TraceFence** is a source-aware security gateway: the org uploads documents and defines who may read what and which tools are ALLOW / DENY / REQUIRE_APPROVAL. We filter what may enter context, and every consequential tool hits policy in application code. Timeline: **SOURCE → PROPOSAL → DECISION → OUTCOME**.  
>  
> Live demo: show Org admin corpus + policy matrix, then campus chat  a student gets hostel curfew from public sources only; cannot pull confidential directory into context; cannot export records  **DENY**. Faculty export needs one exact approval. Document text cannot rewrite permissions.  
>  
> We are not claiming perfect prompt-injection immunity. We are showing inspectable, enforceable agent permissions.

---

## Org admin (product must-show)

- Upload / manage documents + classification  
- Role → collection ACL + tool policy matrix  
- Policy version visible on sessions / audit

---

## Q&A

| Q | A |
|---|---|
| What is TraceFence? | A source-aware security gateway for AI agents. |
| Is this just blocking email? | No  email/notify is one tool. We also filter reads and gate exports and other actions. |
| Why campus? | Clear public vs confidential sources so judges see the gateway in 3 minutes. |
| What if the model ignores policy? | Bad sources never enter context; tools still denied by the gateway. |

---

## Build checklist

1. [x] Session + role identity  
2. [x] ACL-filtered `search_docs` / `read_document`  
3. [x] Chat uses only filtered context  
4. [x] `export_records` DENY student / APPROVAL faculty  
5. [ ] Console UI (chat + decision rail + approvals)  
6. [ ] **Org / Admin UI** (documents + policies)  
7. [ ] Upload + policy APIs (or Admin over seeded fixtures first)  
8. [ ] Ollama path polished + scripted scenarios  

**Out:** Vector RAG, email-only pitch, SecureRAG as second product, production ABAC claims.

---

## Sign-off

| Name | Agree (Y/N) | Date |
|---|---|---|
| shashankack | | |
| venilashree | | |
| desaitejas777 | | |
| Varun-op | | |
| Spandananarayanaswamy | | |
