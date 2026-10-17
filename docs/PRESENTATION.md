# TraceFence — Presentation Deck (aligned to Mystara PPT)

Use with NullTrace team deck. Product name on slides: **TraceFence** (replace stray “TraceFence”). Team size: **5**.

**Tagline:** *Know what your AI reads. Control what it does.*

---

## Slide 1 — Title

- TraceFence · NullTrace · Cybersecurity  
- Source-aware security gateway for AI agents  
- QR → inspect → agent proposes → gateway decides  

---

## Slide 2 — Problem

How can an AI agent only do what the user authorized—even when it reads untrusted websites/documents?

1. Untrusted input  
2. Steered actions  
3. Unchecked tool calls ≠ authorization  

Risk: summarize invoices → attempt unauthorized email.

---

## Slide 3 — Existing limits

Scanners / tool engines / traces each miss the **connected** story.  
TraceFence connects: **source → proposed action → decision → outcome**.  
Claim: focused combination + DX — not inventing scanning or tool auth.

---

## Slide 4 — Solution

1. **Inspect** — QR-linked synthetic page (offline Playwright)  
2. **Enforce** — allow / deny / approval on tool actions  
3. **Explain** — source, proposal, decision, outcome on one timeline  

---

## Slide 5 — Innovation

SOURCE (malicious page instruction) → PROPOSAL (`send_email`) → DECISION (DENY allowlist) → OUTCOME (executor not called).  
“We don’t just investigate what the AI reads. We enforce what it is allowed to do next.”

---

## Slide 6 — Architecture

Untrusted page → AI proposes only → deterministic policy engine → ALLOW / DENY / APPROVAL + audit.  
LLM: **local Ollama API** (`qwen3:8b`).

---

## Slide 7 — Live attack demo

QR → synthetic supplier page → agent proposes external email → DENY → invoice reads may continue.  
If live agent ignores attack: labeled forced replay (same gateway).

---

## Slide 8 — Stack & MVP

| In MVP | Not in MVP |
|---|---|
| QR/URL + synthetic offline page inspect (Playwright) | Arbitrary live website scanning |
| Invoice agent + 3 mock tools | Real email |
| Server allow/deny/approval + source-linked timeline | APK analysis |
| Next.js, TS, Zod, SQLite, Ollama local LLM API | |

---

## Slide 9 — Validation

Authorized read · unauthorized email DENY · approval hold · expired/replay reject.  
Claim: in defined cases, forbidden calls never reach the executor.  
Do **not** claim complete prompt-injection protection.

**Close:** “AI agents should work for you—not beyond your permission.”
