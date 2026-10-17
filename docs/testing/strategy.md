# Testing strategy (TraceFence campus demo)

Owner: `Varun-op`

| Case | Expected |
|---|---|
| Student search curfew | Only public hits; ALLOW; answer grounded |
| Student search “student emails” / grades | Confidential docs not retrieved |
| Student `export_records` | DENY; no file |
| Faculty `export_records` | REQUIRE_APPROVAL → one success → replay fail |
| Scripted fallback | Same ACL + gateway without live LLM |

Assert: confidential chunk IDs never appear in student LLM context logs (when logging is added).
