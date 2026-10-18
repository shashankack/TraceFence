import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { SCHEMA_SQL } from "./schema";
// Plain .mjs avoids tsx/turbopack rewriting worker_threads paths.
import { getHttpBridge } from "./httpBridge.mjs";

type SqlValue = string | number | bigint | Buffer | null;
type RunResult = { changes: number; lastInsertRowid: number | bigint };
type Statement = {
  run: (...params: SqlValue[]) => RunResult;
  get: (...params: SqlValue[]) => Record<string, unknown> | undefined;
  all: (...params: SqlValue[]) => Array<Record<string, unknown>>;
};
export type TfDatabase = {
  prepare: (sql: string) => Statement;
  exec: (sql: string) => unknown;
  pragma: (source: string) => unknown;
  transaction: <T extends unknown[]>(
    fn: (...args: T) => unknown,
  ) => (...args: T) => unknown;
};

declare global {
  // eslint-disable-next-line no-var
  var __tracefenceDb: TfDatabase | undefined;
  // eslint-disable-next-line no-var
  var __tracefenceSeeded: boolean | undefined;
}

const require = createRequire(import.meta.url);

function useHttpDb(): boolean {
  return Boolean(process.env.DATABASE_HTTP_URL?.trim());
}

function sqlRpc(payload: {
  op: string;
  sql?: string;
  params?: SqlValue[];
}): { ok?: boolean; value?: unknown; error?: string } {
  return getHttpBridge().rpc(payload);
}

function createHttpDatabase(): TfDatabase {
  const prepare = (sql: string): Statement => ({
    run: (...params) => {
      const res = sqlRpc({ op: "run", sql, params });
      return (res.value as RunResult) ?? { changes: 0, lastInsertRowid: 0 };
    },
    get: (...params) => {
      const res = sqlRpc({ op: "get", sql, params });
      return (res.value as Record<string, unknown> | null) ?? undefined;
    },
    all: (...params) => {
      const res = sqlRpc({ op: "all", sql, params });
      return (res.value as Array<Record<string, unknown>>) ?? [];
    },
  });

  return {
    prepare,
    exec: (sql: string) => {
      sqlRpc({ op: "exec", sql });
    },
    pragma: (source: string) => {
      const res = sqlRpc({ op: "pragma", sql: source });
      return res.value;
    },
    transaction:
      <T extends unknown[]>(fn: (...args: T) => unknown) =>
      (...args: T) => {
        sqlRpc({ op: "begin" });
        try {
          const out = fn(...args);
          sqlRpc({ op: "commit" });
          return out;
        } catch (e) {
          try {
            sqlRpc({ op: "rollback" });
          } catch {
            /* ignore */
          }
          throw e;
        }
      },
  };
}

function resolveLocalDbPath(): string {
  if (process.env.VERCEL || process.env.TRACEFENCE_DB_TMP === "1") {
    return process.env.DATABASE_PATH && path.isAbsolute(process.env.DATABASE_PATH)
      ? process.env.DATABASE_PATH
      : "/tmp/tracefence.sqlite";
  }
  const configured = process.env.DATABASE_PATH ?? "./data/tracefence.sqlite";
  return path.isAbsolute(configured)
    ? configured
    : path.join(
        /*turbopackIgnore: true*/ process.cwd(),
        "data",
        path.basename(configured),
      );
}

function createLocalDatabase(): TfDatabase {
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
  const dbPath = resolveLocalDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma(
    process.env.VERCEL || process.env.TRACEFENCE_DB_TMP === "1"
      ? "journal_mode = DELETE"
      : "journal_mode = WAL",
  );
  db.pragma("foreign_keys = ON");
  return db as unknown as TfDatabase;
}

export function getDb(): TfDatabase {
  if (global.__tracefenceDb) {
    migrateTenantProfiles(global.__tracefenceDb);
    migrateMockEmailOutbox(global.__tracefenceDb);
    migrateSessionMessageAttachments(global.__tracefenceDb);
    return global.__tracefenceDb;
  }

  const http = useHttpDb();
  const db = http ? createHttpDatabase() : createLocalDatabase();

  if (http) {
    try {
      sqlRpc({ op: "ping" });
    } catch (e) {
      throw new Error(
        `Shared DATABASE_HTTP_URL unreachable (${process.env.DATABASE_HTTP_URL}). ` +
          `Start scripts/sqlite-http-server.mjs + cloudflared, then retry. ` +
          `(${e instanceof Error ? e.message : e})`,
      );
    }
  }

  db.exec(SCHEMA_SQL);
  migrateApprovalsForSessions(db);
  migrateOrgTablesToMultiTenant(db);
  migrateTenantProfiles(db);
  migrateMockEmailOutbox(db);
  migrateSessionMessageAttachments(db);

  global.__tracefenceDb = db;

  if (!global.__tracefenceSeeded) {
    const { seedDemoDataIfNeeded } = require("../demo/seed") as typeof import("../demo/seed");
    seedDemoDataIfNeeded();
    global.__tracefenceSeeded = true;
  }

  return db;
}

function migrateApprovalsForSessions(db: TfDatabase) {
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

function migrateOrgTablesToMultiTenant(db: TfDatabase) {
  const policySql = (
    db
      .prepare(
        `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'org_policy'`,
      )
      .get() as { sql: string } | undefined
  )?.sql;

  if (policySql && policySql.includes("id INTEGER")) {
    db.exec(`
      ALTER TABLE org_policy RENAME TO org_policy_legacy;
      CREATE TABLE org_policy (
        tenant_id TEXT PRIMARY KEY,
        policy_version INTEGER NOT NULL,
        roles_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT INTO org_policy (tenant_id, policy_version, roles_json, updated_at)
      SELECT 'nulltrace-institute', policy_version, roles_json, updated_at
      FROM org_policy_legacy;
      DROP TABLE org_policy_legacy;
    `);
  }

  const docsSql = (
    db
      .prepare(
        `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'org_documents'`,
      )
      .get() as { sql: string } | undefined
  )?.sql;

  if (docsSql && !docsSql.includes("tenant_id")) {
    db.exec(`
      ALTER TABLE org_documents RENAME TO org_documents_legacy;
      CREATE TABLE org_documents (
        tenant_id TEXT NOT NULL,
        id TEXT NOT NULL,
        title TEXT NOT NULL,
        classification TEXT NOT NULL,
        collection TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        content TEXT NOT NULL,
        source TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (tenant_id, id)
      );
      INSERT INTO org_documents
        (tenant_id, id, title, classification, collection, enabled, content, source, updated_at)
      SELECT 'nulltrace-institute', id, title, classification, collection, enabled, content, source, updated_at
      FROM org_documents_legacy;
      DROP TABLE org_documents_legacy;
    `);
  }
}

function tableColumns(db: TfDatabase, table: string): Set<string> {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  return new Set(rows.map((r) => r.name));
}

function migrateTenantProfiles(db: TfDatabase) {
  const cols = tableColumns(db, "tenants");
  if (!cols.has("org_type")) {
    db.exec(
      `ALTER TABLE tenants ADD COLUMN org_type TEXT NOT NULL DEFAULT 'college'`,
    );
  }
  if (!cols.has("notify_email")) {
    db.exec(`ALTER TABLE tenants ADD COLUMN notify_email TEXT`);
  }
  if (!cols.has("profile_json")) {
    db.exec(`ALTER TABLE tenants ADD COLUMN profile_json TEXT`);
  }
}

function migrateMockEmailOutbox(db: TfDatabase) {
  const cols = tableColumns(db, "mock_email_outbox");
  if (!cols.has("tenant_id")) {
    db.exec(`ALTER TABLE mock_email_outbox ADD COLUMN tenant_id TEXT`);
  }
  if (!cols.has("kind")) {
    db.exec(`ALTER TABLE mock_email_outbox ADD COLUMN kind TEXT`);
  }
}

function migrateSessionMessageAttachments(db: TfDatabase) {
  const cols = tableColumns(db, "session_messages");
  if (!cols.has("attachments_json")) {
    db.exec(`ALTER TABLE session_messages ADD COLUMN attachments_json TEXT`);
  }
}
