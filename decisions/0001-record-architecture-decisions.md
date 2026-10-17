# 1. Align TraceFence with SecureRAG (campus domain)

Status: Accepted

## Context

We need a clear security story for a hackathon AI product without claiming a full multi-domain platform. The SecureRAG design defines policy-outside-the-LLM and permission-filtered retrieval.

## Decision

1. Adopt **SecureRAG** as the architectural north star (`docs/secure_rag_domain_agnostic_design.md`).
2. Ship **TraceFence** as the **campus/education domain pack** + chat UX + tool gateway.
3. MVP enforces: session role identity, retrieval ACLs before LLM context, tool ALLOW/DENY/REQUIRE_APPROVAL, audit.
4. Defer full ABAC, multi-tenant crypto isolation, multi-domain packs, and production DLP to post-hackathon.
5. Supersede invoice/QR/email-hero as the primary demo.

## Consequences

- Pitch and docs speak SecureRAG language (“LLM is not the security boundary”).
- Implementation priority is filtered retrieval + export deny, not SMTP demos.
- Existing invoice API scaffold is legacy until rewired to sessions/chat.
