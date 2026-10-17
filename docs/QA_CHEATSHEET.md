# TraceFence  Q&A cheatsheet

Short answers for judges. Stay honest.

| Question | Answer |
|---|---|
| Doesn’t this already exist? | Guardrails exist (e.g. Invariant). Our MVP is a concrete end-to-end demo: time-limited task grants, exact-action approval, and a visible timeline  not a claim that we invented tool auth. |
| Why not just prompt “don’t email”? | Prompts affect what the model *proposes*. Authorization must check the *operation* on the server before execution. |
| What if the model ignores the attack? | Good. We still force a forbidden proposal through the gateway in tests so the deny path is proven independently of model mood. |
| Does this protect every agent / MCP server? | No. Only tools that go through our gateway. Production needs real identity, credentials, and isolation too. |
| Is this prompt-injection proof? | No. We control **tool execution**, not every information leak in chat text. Say that clearly. |
| Why local LLM / Ollama? | Offline demo, no cloud key dependency; scripted fallback through the same gateway if the model flakes. |
| Why no RAG? | Demo needs live tool control + page inspect, not a vector index. RAG later = retrieval as another *gated* tool. |
| What is novel? | Source-to-action traceability (QR page → proposal → decision → outcome) plus exact-action approvals  a focused combination, not inventing scanning or tool auth. |
| Do you scan the whole web? | No. Only allowlisted synthetic offline pages for the hackathon. |
| Is it TrustFence / TrustTrace? | No  product is **TraceFence**. Team is **NullTrace**. |
| Can approvals be replayed? | No  bind task, tool, canonical args hash, policy version, expiry; consume once. |
| Is email real? | No  mock outbox, synthetic invoices only. |

## Closing if pressed on security claims

“This is a hackathon prototype that proves unauthorized tool calls can be blocked before execution for the wrappers we built. It is not production security software.”
