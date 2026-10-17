# Security / policy

## Principles

1. Default deny.
2. Least privilege per task.
3. Separation of data and authority (invoice text ≠ permissions).
4. Deterministic enforcement (LLM does not grant auth).
5. Exact-action approvals (tool + canonical args + task + caller + expiry).
6. Short-lived grants.
7. Single execution path through the trusted gateway.
8. Auditability.

## Decision ordering

1. Reject invalid session, ownership, inactive/expired task.
2. Reject unknown tools / schema failures.
3. Resolve immutable policy version.
4. Match tool + resource scope.
5. Apply deny and recipient allowlists (external email → DENY, not approval).
6. Return ALLOW / DENY / REQUIRE_APPROVAL.
7. Re-check immediately before execution; consume approval atomically.
8. Audit final result.

## DEMO_MODE

Seeds fixtures and labels reproducible tests. **Never** bypasses DENY.

## Threat demo

INV-003 untrusted note tries to force email to `external-audit@attacker.example`. Gateway must deny; mock outbox stays empty.
