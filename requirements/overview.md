# Requirements overview

Authoritative detail: [`docs/SCOPE_AND_RULES.md`](../docs/SCOPE_AND_RULES.md) (PPT option A).

## Goal

Source-aware authorization for AI tool use: inspect what the agent reads (synthetic QR page), enforce what it may execute, explain source → proposal → decision → outcome.

## P0 highlights

- Invoice task + three mock tools behind gateway.
- QR/URL + Playwright offline inspect + SOURCE on timeline.
- ALLOW / DENY / REQUIRE_APPROVAL; exact-action approvals.
- Local Ollama agent + scripted fallback.
- Unauthorized external email never reaches executor.

## Out of scope

Arbitrary live scanning, real email, APK analysis, RAG, production IAM.
