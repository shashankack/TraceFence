# Local LLM setup (Ollama + qwen3:8b)

**Team default model:** `qwen3:8b`  
**Runtime:** [Ollama](https://ollama.com) on `http://127.0.0.1:11434`  
**Owner:** `Spandananarayanaswamy` (docs + scenarios); orchestrator wiring owned by `shashankack`.

**PPT wording:** this is our **“local LLM API”**  same role as “one LLM API” on the deck, without requiring a cloud key.

## Why this model

- Native tool / function calling through Ollama’s tools API.
- ~5 GB at typical Q4 quant; fits most 8–16 GB machines.
- Strong enough for a 3-tool invoice agent without a cloud key.

MVP does **not** use RAG. The agent calls tools after SOURCE inspect; TraceFence authorizes those calls.

## Steps (Windows)

1. Install Ollama from https://ollama.com (Windows installer).
2. Open a terminal and pull the model:

```bash
ollama pull qwen3:8b
```

3. Smoke-run once:

```bash
ollama run qwen3:8b
```

Type a short greeting, confirm a reply, then `/bye`.

4. Confirm the API is up: open or curl `http://127.0.0.1:11434` (Ollama responds when running).

5. Environment variables (document in `.env.example` when the app exists):

```dotenv
LLM_BASE_URL=http://127.0.0.1:11434
LLM_MODEL=qwen3:8b
DEMO_MODE=true
DATABASE_PATH=./data/tracefence.sqlite
```

6. Land a smoke scenario under `scenarios/` that expects at least one `read_invoice`-shaped proposal. If the live model fails, the orchestrator must use **scripted proposals** through the same gateway.

## Low-VRAM fallbacks (document only; team still defaults to qwen3:8b)

| Situation | Model |
|---|---|
| Very tight VRAM (~4–6 GB) | `qwen3:4b` |
| Tool-routing specialist | `llama3-groq-tool-use:8b` |

```bash
ollama pull qwen3:4b
# or
ollama pull llama3-groq-tool-use:8b
```

Set `LLM_MODEL` accordingly. Re-run smoke scenarios after switching.

## Health checklist (Spandana)

- [ ] Ollama service running
- [ ] `qwen3:8b` pulled
- [ ] `LLM_BASE_URL` reachable from the app host
- [ ] One successful tool-call shaped response **or** scripted fallback verified
- [ ] Notes filed under `scenarios/` README if behavior is flaky

## Demo rule

Local model flakiness must never break the security story. Forced/scripted proposals prove DENY and APPROVAL even when the model does not propose the unsafe call.
