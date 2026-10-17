import { getDb } from "../db/client";
import { hashPassword } from "../auth/password";
import { ensureGuestUser } from "../auth/guest";
import {
  seedFixtureDocumentsForTenant,
  seedPolicyForTenant,
} from "../campus/tenantBootstrap";
import { ensureChunksForTenant, reindexDocument } from "../campus/chunkIndex";
import { isDemoMode } from "../env";

export const DEMO_PASSWORD = "demo1234";

const TENANTS = [
  { id: "nulltrace-institute", name: "NullTrace Institute" },
  { id: "riverview-college", name: "Riverview College" },
] as const;

/** Seeded accounts for demos — password is always DEMO_PASSWORD. */
export const DEMO_USERS: Array<{
  id: string;
  email: string;
  displayName: string;
  memberships: Array<{ tenantId: string; role: string }>;
}> = [
  {
    id: "usr_demo_student",
    email: "student@nulltrace.demo",
    displayName: "Demo Student",
    memberships: [{ tenantId: "nulltrace-institute", role: "student" }],
  },
  {
    id: "usr_demo_faculty",
    email: "faculty@nulltrace.demo",
    displayName: "Demo Faculty",
    memberships: [{ tenantId: "nulltrace-institute", role: "faculty" }],
  },
  {
    id: "usr_demo_admin",
    email: "admin@nulltrace.demo",
    displayName: "Demo Admin",
    memberships: [{ tenantId: "nulltrace-institute", role: "admin" }],
  },
  {
    id: "usr_alex_student",
    email: "alex@nulltrace.demo",
    displayName: "Alex Rivera",
    memberships: [{ tenantId: "nulltrace-institute", role: "student" }],
  },
  {
    id: "usr_jordan_faculty",
    email: "jordan@nulltrace.demo",
    displayName: "Jordan Lee",
    memberships: [{ tenantId: "nulltrace-institute", role: "faculty" }],
  },
  {
    id: "usr_sam_admin",
    email: "sam@nulltrace.demo",
    displayName: "Sam Okonkwo",
    memberships: [{ tenantId: "nulltrace-institute", role: "admin" }],
  },
  {
    id: "usr_demo_river_admin",
    email: "admin@riverview.demo",
    displayName: "Riverview Admin",
    memberships: [{ tenantId: "riverview-college", role: "admin" }],
  },
  {
    id: "usr_demo_river_stu",
    email: "student@riverview.demo",
    displayName: "Riverview Student",
    memberships: [{ tenantId: "riverview-college", role: "student" }],
  },
];

function upsertDemoUsers() {
  const db = getDb();
  const now = new Date().toISOString();
  const passwordHash = hashPassword(DEMO_PASSWORD);
  const insertTenant = db.prepare(
    `INSERT INTO tenants (id, name, created_at) VALUES (?, ?, ?)
     ON CONFLICT(id) DO NOTHING`,
  );
  const insertUser = db.prepare(
    `INSERT INTO users (id, email, password_hash, display_name, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO NOTHING`,
  );
  const insertMembership = db.prepare(
    `INSERT INTO memberships (user_id, tenant_id, role, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, tenant_id) DO NOTHING`,
  );

  const tx = db.transaction(() => {
    for (const t of TENANTS) {
      insertTenant.run(t.id, t.name, now);
    }
    for (const u of DEMO_USERS) {
      insertUser.run(u.id, u.email, passwordHash, u.displayName, now);
      for (const m of u.memberships) {
        insertMembership.run(u.id, m.tenantId, m.role, now);
      }
    }
  });
  tx();
  ensureGuestUser();
}

/**
 * Idempotent DEMO_MODE seed: tenants, users, memberships, policies, docs.
 */
export function seedDemoDataIfNeeded() {
  if (!isDemoMode()) return;

  const db = getDb();
  upsertDemoUsers();

  seedPolicyForTenant("nulltrace-institute");
  seedFixtureDocumentsForTenant("nulltrace-institute");
  seedPolicyForTenant("riverview-college");
  ensureChunksForTenant("nulltrace-institute");
  ensureChunksForTenant("riverview-college");

  const now = new Date().toISOString();
  const riverDoc = db
    .prepare(
      `SELECT id FROM org_documents WHERE tenant_id = ? AND id = 'handbook'`,
    )
    .get("riverview-college");
  if (!riverDoc) {
    db.prepare(
      `INSERT INTO org_documents
       (tenant_id, id, title, classification, collection, enabled, content, source, updated_at)
       VALUES (?, 'handbook', 'Riverview Student Handbook', 'public', 'public', 1, ?, 'fixture', ?)`,
    ).run(
      "riverview-college",
      "# Riverview Student Handbook\n\nCampus closes at 9:00 PM on weekdays.\nClassification: public\n",
      now,
    );
    reindexDocument(
      "riverview-college",
      "handbook",
      "Riverview Student Handbook",
      "# Riverview Student Handbook\n\nCampus closes at 9:00 PM on weekdays.\nClassification: public\n",
    );
  }
}

export { seedPolicyForTenant, seedFixtureDocumentsForTenant };
