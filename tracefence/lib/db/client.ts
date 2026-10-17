import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { SCHEMA_SQL } from "./schema";
import { seedInvoicesIfEmpty } from "../demo/fixtures";

declare global {
  // eslint-disable-next-line no-var
  var __tracefenceDb: Database.Database | undefined;
}

function resolveDbPath(): string {
  const configured = process.env.DATABASE_PATH ?? "./data/tracefence.sqlite";
  return path.isAbsolute(configured)
    ? configured
    : path.join(/*turbopackIgnore: true*/ process.cwd(), "data", path.basename(configured));
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
  seedInvoicesIfEmpty(db);

  global.__tracefenceDb = db;
  return db;
}
