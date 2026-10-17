import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { SCHEMA_SQL } from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __tracefenceDb: Database.Database | undefined;
  // eslint-disable-next-line no-var
  var __tracefenceSeeded: boolean | undefined;
}

function resolveDbPath(): string {
  // Vercel / serverless: only /tmp is writable (ephemeral; DEMO_MODE reseeds).
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

export function getDb(): Database.Database {
  if (global.__tracefenceDb) {
    // Hot-reload can keep an open handle opened before new migrations landed.
    migrateTenantProfiles(global.__tracefenceDb);
    migrateMockEmailOutbox(global.__tracefenceDb);
    return global.__tracefenceDb;
  }

  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  // WAL is awkward on ephemeral /tmp serverless disks.
  db.pragma(
    process.env.VERCEL || process.env.TRACEFENCE_DB_TMP === "1"
      ? "journal_mode = DELETE"
      : "journal_mode = WAL",
  );
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  migrateApprovalsForSessions(db);
  migrateOrgTablesToMultiTenant(db);
  migrateTenantProfiles(db);
  migrateMockEmailOutbox(db);

  global.__tracefenceDb = db;

  if (!global.__tracefenceSeeded) {
    // Lazy require avoids circular init with seed → getDb.
    const { seedDemoDataIfNeeded } = require("../demo/seed") as typeof import("../demo/seed");
    seedDemoDataIfNeeded();
    global.__tracefenceSeeded = true;
  }

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

/** Rebuild legacy single-tenant org_* tables into tenant-scoped shape. */
function migrateOrgTablesToMultiTenant(db: Database.Database) {
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

function tableColumns(db: Database.Database, table: string): Set<string> {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  return new Set(rows.map((r) => r.name));
}

/** Org type + notify profile columns on tenants. */
function migrateTenantProfiles(db: Database.Database) {
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

/** Tenant-scoped notification outbox for approval alerts. */
function migrateMockEmailOutbox(db: Database.Database) {
  const cols = tableColumns(db, "mock_email_outbox");
  if (!cols.has("tenant_id")) {
    db.exec(`ALTER TABLE mock_email_outbox ADD COLUMN tenant_id TEXT`);
  }
  if (!cols.has("kind")) {
    db.exec(`ALTER TABLE mock_email_outbox ADD COLUMN kind TEXT`);
  }
}
