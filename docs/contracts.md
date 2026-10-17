# TrustFence — API / DTO Contracts (sketch)

Living contract between backend (`shashankack`) and frontend (`venilashree`). Formalize into `openapi.yaml` as endpoints land. No implementation code in this file.

## Decisions

`ALLOW` | `DENY` | `REQUIRE_APPROVAL`

## Reason codes (initial set)

| Code | Meaning |
|---|---|
| `ALLOWED` | Policy matched; execute |
| `DENIED_DEFAULT` | No matching allow rule |
| `DENIED_TOOL_UNKNOWN` | Tool not registered |
| `DENIED_SCHEMA` | Args failed schema |
| `DENIED_SCOPE` | Resource outside task scope |
| `DENIED_RECIPIENT` | Email recipient not eligible |
| `DENIED_TASK_EXPIRED` | Task past expiry |
| `DENIED_TASK_INACTIVE` | Task not running |
| `REQUIRES_APPROVAL` | Eligible but needs human grant |
| `APPROVAL_CONSUMED` | Executed after one-time approval |
| `APPROVAL_REJECTED` | Reviewer rejected |
| `APPROVAL_EXPIRED` | Grant past deadline |
| `APPROVAL_MISMATCH` | Args/task/policy binding failed |
| `APPROVAL_REPLAY` | Second use of same grant |

## Endpoints (MVP)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/tasks` | Create task + policy |
| `GET` | `/api/tasks/:id` | Task detail + status |
| `POST` | `/api/tasks/:id/run` | Start orchestrator |
| `POST` | `/api/tasks/:id/stop` | Stop task |
| `GET` | `/api/tasks/:id/events` | Timeline events |
| `GET` | `/api/approvals` | Pending approvals (filter by task) |
| `POST` | `/api/approvals/:id/decision` | `{ "decision": "APPROVE" \| "REJECT" }` |
| `GET` | `/api/audit` | Audit / report aggregate |

## Create task body (conceptual)

```json
{
  "instruction": "Summarize outstanding amounts in INV-001 to INV-003",
  "allowedInvoiceIds": ["INV-001", "INV-002", "INV-003"],
  "rules": [
    { "tool": "read_invoice", "action": "ALLOW", "allowedInvoiceIds": ["INV-001", "INV-002", "INV-003"] },
    { "tool": "send_email", "action": "REQUIRE_APPROVAL", "allowedRecipientDomains": ["company.example"] },
    { "tool": "delete_invoice", "action": "DENY" }
  ],
  "expiresInMinutes": 30
}
```

Server assigns `taskId`, `userId`, `policyVersion`. Client must not supply trusted identity fields as authority.

## Timeline event (conceptual)

```json
{
  "id": "evt_1",
  "taskId": "task-1001",
  "ts": "2026-10-17T06:00:00Z",
  "tool": "send_email",
  "argsPreview": { "to": "external-audit@attacker.example" },
  "decision": "DENY",
  "reasonCode": "DENIED_RECIPIENT",
  "outcome": "not_executed"
}
```

## Tools (names fixed for MVP)

- `read_invoice` — `{ "invoice_id": "INV-001" }`
- `send_email` — `{ "to": string, "subject": string, "body": string }`
- `delete_invoice` — `{ "invoice_id": string }`

## Integration rules

- Frontend never calls mock executors.
- Orchestrator always calls `gateway.invoke`.
- Approvals: server stores pending args; computes `canonical_args_hash`; client never supplies the hash as proof.
