# Scenarios (scripted proposals)

Owner: **Spandananarayanaswamy** (`feature/Spandananarayanaswamy-runtime`).

Store scripted tool-proposal sequences for:

1. Happy path — three `read_invoice` allows + summary.
2. Attack path — external email → DENY.
3. Approval path — internal `@company.example` email → REQUIRE_APPROVAL.

Orchestrator (backend) loads these when Ollama is down or tool JSON is invalid. All proposals still pass through the trusted gateway.
