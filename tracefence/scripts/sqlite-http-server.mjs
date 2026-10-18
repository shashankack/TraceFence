/**
 * Shared SQLite over HTTP for Vercel (all serverless instances hit one DB).
 *
 *   node scripts/sqlite-http-server.mjs
 *   cloudflared tunnel --url http://127.0.0.1:8788
 *
 * Then set on Vercel:
 *   DATABASE_HTTP_URL=https://….trycloudflare.com
 *   DATABASE_HTTP_SECRET=long-random-string
 *
 * Keep this process running during the demo (same idea as the Ollama tunnel).
 */
import http from "http";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LISTEN = Number(process.env.DATABASE_HTTP_PORT ?? "8788");
const SECRET = process.env.DATABASE_HTTP_SECRET ?? "tracefence-demo-db-secret";
const DB_PATH =
  process.env.DATABASE_PATH ??
  path.join(__dirname, "..", "data", "tracefence.shared.sqlite");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/** Simple queue so BEGIN…COMMIT stays exclusive across HTTP requests. */
let chain = Promise.resolve();
function exclusive(fn) {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function authorize(req) {
  const key = req.headers["x-tf-db-key"];
  return typeof key === "string" && key === SECRET;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function applyOp(body) {
  const op = body.op;
  const sql = body.sql ?? "";
  const params = Array.isArray(body.params) ? body.params : [];

  if (op === "ping") return { ok: true, path: DB_PATH };
  if (op === "begin") {
    db.exec("BEGIN IMMEDIATE");
    return { ok: true };
  }
  if (op === "commit") {
    db.exec("COMMIT");
    return { ok: true };
  }
  if (op === "rollback") {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* no active transaction */
    }
    return { ok: true };
  }
  if (op === "exec") {
    db.exec(sql);
    return { ok: true };
  }
  if (op === "pragma") {
    // body.sql is the pragma string, e.g. "foreign_keys = ON"
    const value = db.pragma(sql);
    return { ok: true, value };
  }
  if (op === "run") {
    const info = db.prepare(sql).run(...params);
    return {
      ok: true,
      value: {
        changes: info.changes,
        lastInsertRowid: Number(info.lastInsertRowid),
      },
    };
  }
  if (op === "get") {
    return { ok: true, value: db.prepare(sql).get(...params) ?? null };
  }
  if (op === "all") {
    return { ok: true, value: db.prepare(sql).all(...params) };
  }
  throw new Error(`Unknown op: ${op}`);
}

const server = http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, path: DB_PATH }));
    return;
  }
  if (req.method !== "POST" || req.url !== "/sql") {
    res.writeHead(404);
    res.end(JSON.stringify({ ok: false, error: "Not found" }));
    return;
  }
  if (!authorize(req)) {
    res.writeHead(401);
    res.end(JSON.stringify({ ok: false, error: "Unauthorized" }));
    return;
  }

  exclusive(async () => {
    try {
      const body = await readBody(req);
      const result = applyOp(body);
      res.writeHead(200);
      res.end(JSON.stringify(result));
    } catch (e) {
      try {
        db.exec("ROLLBACK");
      } catch {
        /* ignore */
      }
      res.writeHead(500);
      res.end(
        JSON.stringify({
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        }),
      );
    }
  });
});

server.listen(LISTEN, "127.0.0.1", () => {
  console.log(`TraceFence shared SQLite HTTP :${LISTEN}`);
  console.log(`  db file: ${DB_PATH}`);
  console.log(`  secret : x-tf-db-key header (DATABASE_HTTP_SECRET)`);
  console.log(`Tunnel: cloudflared tunnel --url http://127.0.0.1:${LISTEN}`);
});
