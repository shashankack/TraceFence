/**
 * One-shot SQL RPC (stdin JSON → stdout JSON) for the shared SQLite HTTP server.
 * Used via execFileSync from the Next.js server when DATABASE_HTTP_URL is set.
 */
import { readFileSync } from "fs";

const raw = process.stdin.isTTY ? "{}" : readFileSync(0, "utf8");
const payload = JSON.parse(raw || "{}");
const base = process.env.DATABASE_HTTP_URL;
if (!base) {
  console.error("DATABASE_HTTP_URL is not set");
  process.exit(1);
}
const secret = process.env.DATABASE_HTTP_SECRET ?? "tracefence-demo-db-secret";
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
process.stdout.write(text);
if (!res.ok) process.exit(1);
try {
  if (JSON.parse(text).ok === false) process.exit(1);
} catch {
  process.exit(1);
}
