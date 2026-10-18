/**
 * synckit worker: sync-looking SQL RPC over HTTP to the shared SQLite server.
 */
const { runAsWorker } = require("synckit");

runAsWorker(async (payload) => {
  const base = process.env.DATABASE_HTTP_URL;
  if (!base) throw new Error("DATABASE_HTTP_URL is not set");
  const secret =
    process.env.DATABASE_HTTP_SECRET ?? "tracefence-demo-db-secret";
  const target = new URL("/sql", base.replace(/\/$/, "")).toString();

  const res = await fetch(target, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tf-db-key": secret,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(
      Number(process.env.DATABASE_HTTP_TIMEOUT_MS ?? "20000"),
    ),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`DB HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `DB HTTP ${res.status}`);
  }
  return data;
});
