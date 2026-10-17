# TraceFence — API / DTO Contracts

**TraceFence** — source-aware gateway: **identity → policy → filtered retrieval → LLM → tool gateway → audit**.

## Decisions

`ALLOW` | `DENY` | `REQUIRE_APPROVAL`

## Auth (multi-tenant)

Trusted identity comes from a **Bearer auth session**, never from the client body.

```http
Authorization: Bearer <token>
```

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/signup` | `{ email, password, displayName?, tenantName? }` |
| `POST` | `/api/auth/login` | `{ email, password, tenantId? }` → token + memberships |
| `POST` | `/api/auth/switch-tenant` | `{ tenantId }` → new token (membership required) |
| `POST` | `/api/auth/logout` | Revoke token |
| `GET` | `/api/auth/me` | Current user + tenant + role |

Signup with `tenantName` creates a new tenant and makes the user **admin**.  
Without `tenantName`, new users join `nulltrace-institute` as **student**.

### Demo users (`DEMO_MODE=true`, password `demo1234`)

| Email | Tenant | Role |
|---|---|---|
| `student@nulltrace.demo` | `nulltrace-institute` | student |
| `faculty@nulltrace.demo` | `nulltrace-institute` | faculty |
| `admin@nulltrace.demo` | `nulltrace-institute` | admin |
| `student@riverview.demo` | `riverview-college` | student |
| `admin@riverview.demo` | `riverview-college` | admin |

## Identity (chat session)

```json
{
  "sessionId": "sess_1",
  "tenantId": "nulltrace-institute",
  "userId": "usr_…",
  "role": "student",
  "policyVersion": 1
}
```

Roles: `student` | `faculty` | `admin`  
`tenantId`, `userId`, `role` are copied from the auth membership when creating a chat session.

## Document classification (domain)

| classification | Example | student retrieve |
|---|---|---|
| `public` | handbook, hostel rules | ALLOW |
| `internal` | faculty guidance | DENY (unless faculty+) |
| `confidential` | student directory, grades notes | DENY for student |

Retrieval APIs **must** apply ACL **and tenant scope** before returning chunks. Never “retrieve then redact in the prompt only.”

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

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/sessions` | Bearer | Create chat session from membership |
| `POST` | `/api/sessions/:id/messages` | Bearer | User chat turn |
| `GET` | `/api/sessions/:id/events` | Bearer | Timeline (retrieval + tools) |
| `GET` | `/api/approvals` | Bearer | Pending (tenant-scoped) |
| `POST` | `/api/approvals/:id/decision` | Bearer | APPROVE \| REJECT (executes once) |
| `GET` | `/api/audit` | — | Aggregate |
| `GET` | `/api/org/documents` | Bearer admin | List corpus |
| `POST` | `/api/org/documents` | Bearer admin | Upload / create doc |
| `PATCH` | `/api/org/documents/:id` | Bearer admin | Update classification / enabled |
| `GET` | `/api/org/policy` | Bearer admin | Role×collection×tool matrix + version |
| `PUT` | `/api/org/policy` | Bearer admin | Replace matrix; bump `policyVersion` |

Org docs and policy are **per `tenant_id`**. Legacy `/api/tasks` and invoice tools are **deprecated**.

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
