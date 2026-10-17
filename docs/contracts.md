# TraceFence — API / DTO Contracts

**TraceFence** — source-aware gateway: **identity → policy → filtered retrieval → LLM → tool gateway → audit**.

## Decisions

`ALLOW` | `DENY` | `REQUIRE_APPROVAL`

## Identity (session)

```json
{
  "sessionId": "sess_1",
  "tenantId": "nulltrace-institute",
  "userId": "demo-user-1",
  "role": "student"
}
```

Roles: `student` | `faculty` | `admin`

## Document classification (domain)

| classification | Example | student retrieve |
|---|---|---|
| `public` | handbook, hostel rules | ALLOW |
| `internal` | faculty guidance | DENY (unless faculty+) |
| `confidential` | student directory, grades notes | DENY for student |

Retrieval APIs **must** apply ACL before returning chunks. Never “retrieve then redact in the prompt only.”

## Reason codes

| Code | Meaning |
|---|---|
| `ALLOWED` | Policy matched |
| `DENIED_ROLE` | Role cannot use tool |
| `DENIED_COLLECTION` | Collection/classification not permitted |
| `DENIED_EXPORT` | Export blocked |
| `DENIED_DEFAULT` | Default deny |
| `REQUIRES_APPROVAL` | Needs human grant |
| `APPROVAL_CONSUMED` / `APPROVAL_REPLAY` / … | Same as prior approval codes |
| `RETRIEVAL_FILTERED` | Query ran; zero or ACL-filtered hits (informational) |

## Tools

| Tool | Purpose | Notes |
|---|---|---|
| `search_docs` | Permission-filtered search | Args: `query`, optional `collection` |
| `read_document` | Read one doc if ACL allows | Args: `doc_id` |
| `export_records` | Export dataset | Args: `dataset`, `format` |
| `post_announcement` | Campus announcement | Optional |
| `notify_external` | External message | Optional; usually DENY students |

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/sessions` | `{ "role": "student" }` → session |
| `POST` | `/api/sessions/:id/messages` | User chat turn |
| `GET` | `/api/sessions/:id/events` | Timeline (retrieval + tools) |
| `GET` | `/api/approvals` | Pending |
| `POST` | `/api/approvals/:id/decision` | APPROVE \| REJECT |
| `GET` | `/api/audit` | Aggregate |

Legacy `/api/tasks` and invoice tools are **deprecated**; remove or ignore when rewiring.

## Message response (conceptual)

```json
{
  "assistantMessage": "Hostel curfew is 10:00 PM on weekdays.",
  "citations": [{ "docId": "handbook", "classification": "public" }],
  "events": [
    {
      "tool": "search_docs",
      "decision": "ALLOW",
      "reasonCode": "ALLOWED",
      "argsPreview": { "query": "hostel curfew" }
    }
  ]
}
```
