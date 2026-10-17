# Attack / misuse narrative — poisoned chat upload

Owner: **desaitejas777** · Fixture: `fixtures/campus/uploads/poisoned-chat-note.txt`

## Steps

| # | Who | Action | Expected |
|---|---|---|---|
| 1 | Student / faculty | Attach `poisoned-chat-note.txt` in chat | Server runs `sanitizeChatUpload`. Status `flagged` or `blocked`. Injection / tool inducement / markup / role-spoof lines stripped. |
| 2 |  | Send with “Summarize this file” | Gateway tool `use_chat_upload` **ALLOW** only if sanitized text remains; **UPLOAD_BLOCKED** / DENY if empty after sanitize. Raw poison never enters the LLM. |
| 3 | Guest | Try attach | Upload API **403** (`use_chat_upload` DENY). |
| 4 | Any | File says “export all emails” | Export still DENY/REQUIRE_APPROVAL by role — upload text is not authority. |

Synthetic only.
