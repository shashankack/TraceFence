/**
 * Seed the shared SQLite file locally (no HTTP). Invoked by sqlite-http-server.
 */
delete process.env.DATABASE_HTTP_URL;
delete process.env.VERCEL;
delete process.env.TRACEFENCE_DB_TMP;
process.env.DEMO_MODE = "true";

const { getDb } = await import("../lib/db/client.ts");
getDb();
console.log("shared DB schema+seed ready");
