# TraceFence — Presentation

## Slide 1 — Title
**TraceFence** · NullTrace  
*A source-aware security gateway for AI agents*

## Slide 2 — Problem
AI agents read untrusted sources and call tools.  
Unsafe pattern: retrieve everything → hope the model won’t leak or act.

## Slide 3 — Idea
**Source-aware:** only allowed documents enter context.  
**Gateway:** ALLOW / DENY / REQUIRE_APPROVAL for tools.  
LLM is not the security boundary.

## Slide 4 — Demo world
Campus chat: student / faculty / admin.  
Public handbook vs confidential directory.  
Exports denied or approved — not “email-only.”

## Slide 5 — Live demo
Student curfew ALLOW · Student export DENY · Faculty approval once

## Slide 6 — Honesty + next
Not inventing RBAC/RAG; not injection-proof.  
Next: richer sources and domains on the same gateway.
