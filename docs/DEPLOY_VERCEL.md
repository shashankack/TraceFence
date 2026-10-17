# Deploy TraceFence (Vercel + cloudflared → Ollama)

Hackathon-friendly public UI on **Vercel**, local **Ollama** reached via a **Cloudflare quick tunnel**.

## Important limits

| Piece | Behavior on this setup |
|---|---|
| SQLite | Lives under `/tmp` on Vercel (ephemeral). `DEMO_MODE` reseeds on cold start. Not multi-instance durable storage. |
| Ollama | Runs on your machine; tunnel URL must stay up during the demo. |
| Security | Quick tunnels expose Ollama to anyone with the URL   demo only. |

## 1. Local Ollama

```bash
ollama serve          # if not already running
ollama pull qwen3:8b
curl http://127.0.0.1:11434/api/tags
```

## 2. Cloudflare tunnel to Ollama

Ollama rejects requests whose `Host` header is a public tunnel hostname (HTTP 403).  
Run the small Host-rewrite proxy, then tunnel **to the proxy**:

```bash
# Terminal A   keep Ollama running on :11434
node scripts/ollama-tunnel-proxy.mjs
# listens on :11435 → 127.0.0.1:11434

# Terminal B
cloudflared tunnel --url http://127.0.0.1:11435
```

Copy the `https://….trycloudflare.com` URL (no trailing slash). Keep **both** processes running.

Smoke: `curl https://YOUR-TUNNEL.trycloudflare.com/api/tags` should list `qwen3:8b`.

## 3. Deploy app (from `tracefence/`)

```bash
cd tracefence
npx vercel login
npx vercel --prod \
  -e DEMO_MODE=true \
  -e LLM_BASE_URL=https://YOUR-TUNNEL.trycloudflare.com \
  -e LLM_MODEL=qwen3:8b \
  -e LLM_TIMEOUT_MS=55000 \
  -e APP_BASE_URL=https://YOUR-VERCEL-APP.vercel.app \
  -e NOTIFY_ALLOWLIST_SUFFIXES=nulltrace.example,nulltrace.demo,students.nulltrace.example
```

Then set `APP_BASE_URL` to the production URL Vercel printed (Project → Settings → Environment Variables → Redeploy if needed).

Build copies `../fixtures/campus` into the app so policy + docs seed on the server.

## 4. Smoke

- Open the Vercel URL → login `admin@nulltrace.demo` / `demo1234`
- Student curfew question should hit Ollama through the tunnel (or scripted fallback if tunnel is down)

## Refresh tunnel URL

If the quick tunnel restarts, the hostname changes   update `LLM_BASE_URL` on Vercel and redeploy (or use `vercel env add` + redeploy).
