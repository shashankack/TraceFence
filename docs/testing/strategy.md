# Testing strategy

Owner: `Varun-op`. Matrix must match PPT “Security Validation” slide.

| Case | Expected |
|---|---|
| Authorized invoice read | Succeeds; task can complete |
| Unauthorized external email (from SOURCE attack) | DENY; executor never called; sourceId present |
| Permitted sensitive email | Held until approve; one execution |
| Expired or reused approval | Rejected |
| Inspect non-allowlisted URL | DENY / reject inspect |
| Scripted QR-attack fallback | Same DENY + source link without live LLM |

Report live-model behavior separately from deterministic gateway results.  
Do not claim complete prompt-injection protection.
