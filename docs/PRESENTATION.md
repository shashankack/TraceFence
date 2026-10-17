# TraceFence — Presentation

## Slide 1 — Title
**TraceFence** · NullTrace  
*A source-aware security gateway for AI agents*

## Slide 2 — Problem
Agents read untrusted sources and call tools.  
“Please don’t leak / don’t email that” is not a control plane.

## Slide 3 — Idea
**Source-aware:** only allowed sources enter context; source text ≠ authority.  
**Gateway:** multi-tool ALLOW / DENY / REQUIRE_APPROVAL.  
**Trail:** SOURCE → PROPOSAL → DECISION → OUTCOME.

## Slide 4 — Not email-only
Tools include search, read, export, announce, notify.  
Email/notify is one action class — the product is the gateway.

## Slide 5 — Org configures the fence
Upload documents · classify sources · set role ACLs + tool policies.  
Source text cannot change permissions.

## Slide 6 — Live demo
Campus: student curfew ALLOW · student export DENY · faculty approval once.  
Show Admin page then Console.

## Slide 7 — Honesty + next
Not inventing RBAC/RAG; not injection-proof.  
Same gateway → connectors, more domains next.
