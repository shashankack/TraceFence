import fs from "fs";
import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";

const DATA_BYTES = 2 * 1024 * 1024;

function resolveWorkerPath() {
  const candidates = [
    path.join(path.dirname(fileURLToPath(import.meta.url)), "sqlHttpWorker.mjs"),
    path.join(process.cwd(), "lib", "db", "sqlHttpWorker.mjs"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(`sqlHttpWorker.mjs not found. Tried: ${candidates.join(" | ")}`);
}

/** Block without starving forever; used only for a short worker boot delay. */
function sleepSync(ms) {
  const buf = new SharedArrayBuffer(4);
  Atomics.wait(new Int32Array(buf), 0, 0, ms);
}

export function getHttpBridge() {
  if (globalThis.__tracefenceHttpBridge) return globalThis.__tracefenceHttpBridge;

  const sab = new SharedArrayBuffer(16 + DATA_BYTES);
  const meta = new Int32Array(sab, 0, 4);
  const data = Buffer.from(sab, 16);
  const workerPath = resolveWorkerPath();

  let workerError = null;
  const worker = new Worker(workerPath, {
    workerData: { sab },
    execArgv: [],
  });
  worker.on("error", (err) => {
    workerError = err;
    console.error("[tracefence db worker]", err);
  });
  worker.on("exit", (code) => {
    if (code !== 0) {
      workerError = new Error(`DB worker exited (code ${code})`);
    }
  });

  // Do NOT Atomics.wait for a "ready" message — that blocks the event loop so
  // the message never arrives. Brief sleep is enough for the worker to boot.
  sleepSync(75);
  if (workerError) throw workerError;

  const rpc = (payload) => {
    if (workerError) throw workerError;
    const raw = Buffer.from(JSON.stringify(payload), "utf8");
    if (raw.length > DATA_BYTES) throw new Error("DB request too large");
    while (Atomics.load(meta, 0) !== 0) {
      Atomics.wait(meta, 0, Atomics.load(meta, 0), 100);
    }
    raw.copy(data);
    Atomics.store(meta, 1, raw.length);
    Atomics.store(meta, 0, 1);
    Atomics.notify(meta, 0);
    const wait = Atomics.wait(meta, 0, 1, 20000);
    if (wait === "timed-out" && Atomics.load(meta, 0) === 1) {
      throw new Error("DB HTTP RPC timed out");
    }
    const state = Atomics.load(meta, 0);
    const len = Atomics.load(meta, 1);
    const text = data.subarray(0, len).toString("utf8");
    Atomics.store(meta, 0, 0);
    const parsed = JSON.parse(text);
    if (state === 3 || parsed.ok === false) {
      throw new Error(parsed.error || "DB HTTP error");
    }
    return parsed;
  };

  // Warm ping
  rpc({ op: "ping" });

  globalThis.__tracefenceHttpBridge = { rpc };
  return globalThis.__tracefenceHttpBridge;
}
