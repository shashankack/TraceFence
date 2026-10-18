# Deploy TraceFence (Vercel + cloudflared → Ollama + shared SQLite)

Hackathon-friendly public UI on **Vercel**, local **Ollama** and a **shared SQLite** process reached via **Cloudflare quick tunnels**.

## Important limits

| Piece | Behavior on this setup |
|---|---|
| SQLite | **Shared** over HTTP (`DATABASE_HTTP_URL`) so every Vercel instance reads/writes the same file on your machine. Keep `sqlite-http-server` + its tunnel up during the demo. Without it, the app falls back to ephemeral `/tmp` (inconsistent). |
| Auth | Bearer tokens are **HMAC-signed** so login works across serverless instances. Set `AUTH_SECRET` in production. |
| Sessions | Missing session rows are **rehydrated** on the receiving instance as a safety net. |
| Ollama | Runs on your machine; tunnel URL must stay up during the demo. |
| Security | Quick tunnels expose Ollama + DB to anyone with the URL — demo only. Set `DATABASE_HTTP_SECRET`. |

## 1. Local Ollama

```bash
ollama serve          # if not already running
ollama pull qwen3:8b
curl http://127.0.0.1:11434/api/tags
```

## 2. Shared SQLite HTTP (required for consistent admin/chat on Vercel)

```bash
# Terminal A — from tracefence/
set DATABASE_HTTP_SECRET=pick-a-long-random-string
node scripts/sqlite-http-server.mjs
# listens on :8788 → ./data/tracefence.shared.sqlite

# Terminal B
cloudflared tunnel --url http://127.0.0.1:8788
```

Copy the `https://….trycloudflare.com` URL. Smoke:

```bash
curl -s -X POST https://YOUR-DB-TUNNEL.trycloudflare.com/sql ^
  -H "content-type: application/json" ^
  -H "x-tf-db-key: pick-a-long-random-string" ^
  -d "{\"op\":\"ping\"}"
```

## 3. Cloudflare tunnel to Ollama

Ollama rejects requests whose `Host` header is a public tunnel hostname (HTTP 403).  
Run the small Host-rewrite proxy, then tunnel **to the proxy**:

```bash
# Terminal C
node scripts/ollama-tunnel-proxy.mjs
# listens on :11435 → 127.0.0.1:11434

# Terminal D
cloudflared tunnel --url http://127.0.0.1:11435
```

Copy the Ollama `https://….trycloudflare.com` URL. Keep **all four** processes running for a full demo.

## 4. Deploy app (from `tracefence/`)

```bash
cd tracefence
npx vercel login
npx vercel env add DEMO_MODE production --value "true" --yes --force
npx vercel env add LLM_BASE_URL production --value "https://YOUR-OLLAMA-TUNNEL.trycloudflare.com" --yes --force
npx vercel env add LLM_MODEL production --value "qwen3:8b" --yes --force
npx vercel env add LLM_TIMEOUT_MS production --value "55000" --yes --force
npx vercel env add APP_BASE_URL production --value "https://tracefence.vercel.app" --yes --force
npx vercel env add AUTH_SECRET production --value "pick-a-long-random-string" --yes --force
npx vercel env add DATABASE_HTTP_URL production --value "https://YOUR-DB-TUNNEL.trycloudflare.com" --yes --force
npx vercel env add DATABASE_HTTP_SECRET production --value "pick-a-long-random-string" --yes --force
npx vercel env add NOTIFY_ALLOWLIST_SUFFIXES production --value "nulltrace.example,nulltrace.demo,students.nulltrace.example" --yes --force
npx vercel --prod --yes
```

## 5. Smoke

- Open the Vercel URL → login `admin@nulltrace.demo` / `demo1234`
- Student curfew chat → admin audit should show the same decisions within ~2–3s
- Upload a poisoned PDF → flag appears in admin evidence without a refresh lottery

## Refresh tunnel URLs

If a quick tunnel restarts, the hostname changes — update `LLM_BASE_URL` and/or `DATABASE_HTTP_URL` on Vercel and redeploy.
