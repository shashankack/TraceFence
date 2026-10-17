import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { SCHEMA_SQL } from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __tracefenceDb: Database.Database | undefined;
}

function resolveDbPath(): string {
  const configured = process.env.DATABASE_PATH ?? "./data/tracefence.sqlite";
  return path.isAbsolute(configured)
    ? configured
    : path.join(
        /*turbopackIgnore: true*/ process.cwd(),
        "data",
        path.basename(configured),
      );
}

export function getDb(): Database.Database {
  if (global.__tracefenceDb) {
    return global.__tracefenceDb;
  }

  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  migrateApprovalsForSessions(db);

  global.__tracefenceDb = db;
  return db;
}

/** Legacy approvals FK'd to tasks; campus binds task_id to session ids. */
function migrateApprovalsForSessions(db: Database.Database) {
  const row = db
    .prepare(
      `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'approvals'`,
    )
    .get() as { sql: string } | undefined;
  if (!row?.sql?.includes("REFERENCES tasks")) return;

  db.exec(`
    ALTER TABLE approvals RENAME TO approvals_legacy_tasks;
    CREATE TABLE approvals (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      args_json TEXT NOT NULL,
      canonical_args_hash TEXT NOT NULL,
      policy_version INTEGER NOT NULL,
      status TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      approved_by TEXT,
      consumed_at TEXT,
      created_at TEXT NOT NULL
    );
    INSERT INTO approvals SELECT * FROM approvals_legacy_tasks;
    DROP TABLE approvals_legacy_tasks;
  `);
}
