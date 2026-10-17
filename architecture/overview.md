# Architecture overview

See `docs/SYSTEM_OVERVIEW.md` and `docs/secure_rag_domain_agnostic_design.md`.

## Split

| Layer | Responsibility |
|---|---|
| Platform core | Session identity, policy engine, filtered retrieval, tool gateway, audit, LLM adapter |
| Campus domain | Roles, classifications, ACLs, fixtures, prompts |
| UI | Chat, role toggle, decision rail |

## Critical path

Identity → Policy → **Filtered retrieval** → LLM → Tool gateway → Response + audit.
