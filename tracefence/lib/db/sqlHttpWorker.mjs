/**
 * Persistent worker: async fetch to shared SQLite HTTP, sync wake via SharedArrayBuffer.
 */
import { workerData, parentPort } from "worker_threads";

const sab = workerData.sab;
const meta = new Int32Array(sab, 0, 4);
// meta[0] = state: 0 idle, 1 request-ready, 2 response-ready, 3 error
// meta[1] = byte length of payload in the data region
const data = Buffer.from(sab, 16);

async function handle(payload) {
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
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`DB HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!res.ok || parsed.ok === false) {
    throw new Error(parsed.error || `DB HTTP ${res.status}`);
  }
  return parsed;
}

parentPort.postMessage({ ready: true });

async function loop() {
  for (;;) {
    Atomics.wait(meta, 0, 0);
    if (Atomics.load(meta, 0) !== 1) continue;
    const len = Atomics.load(meta, 1);
    const raw = data.subarray(0, len).toString("utf8");
    try {
      const payload = JSON.parse(raw);
      const result = await handle(payload);
      const out = Buffer.from(JSON.stringify(result), "utf8");
      if (out.length > data.length) {
        throw new Error(`DB response too large (${out.length} bytes)`);
      }
      out.copy(data);
      Atomics.store(meta, 1, out.length);
      Atomics.store(meta, 0, 2);
      Atomics.notify(meta, 0);
    } catch (e) {
      const out = Buffer.from(
        JSON.stringify({
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        }),
        "utf8",
      );
      out.copy(data);
      Atomics.store(meta, 1, out.length);
      Atomics.store(meta, 0, 3);
      Atomics.notify(meta, 0);
    }
  }
}

void loop();
