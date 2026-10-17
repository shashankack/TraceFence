# Security / policy (SecureRAG)

## Principles

1. LLM is not the security boundary.
2. Unauthorized content never enters model context.
3. Retrieved content is untrusted (no policy mutation).
4. Tools: default deny; role matrix; exact-action approvals where used.
5. Audit every retrieval and tool decision.
6. DEMO_MODE never bypasses DENY.

## Campus RBAC (summary)

- Students: public collections only; no export.
- Faculty: broader read; export requires approval.
- Admin: broadest access per fixtures policy JSON.

## Threats we demo

- Student attempting directory/export access.
- Model proposing unauthorized tools (gateway still denies).

## Threats we do not claim to fully solve

Prompt injection, inference attacks, poisoned corpus, cross-tenant attacks (single tenant MVP).
