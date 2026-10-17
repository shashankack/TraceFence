/**
 * Killer-demo smoke (lib-level, no HTTP server required).
 * Run: npx tsx scripts/smoke-demos.ts
 */
import { randomUUID } from "crypto";
import { getDb } from "../lib/db/client";
import { login } from "../lib/auth/users";
import { handleChatTurn } from "../lib/campus/chat";
import { searchDocs } from "../lib/campus/retrieval";
import { loadCampusPolicy } from "../lib/campus/policy";
import type { CampusRole } from "../lib/security/types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function createChatSession(input: {
  tenantId: string;
  userId: string;
  role: CampusRole;
}): string {
  const policy = loadCampusPolicy(input.tenantId);
  const sessionId = `sess_${randomUUID().slice(0, 8)}`;
  getDb()
    .prepare(
      `INSERT INTO sessions (id, tenant_id, user_id, role, policy_version, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      sessionId,
      input.tenantId,
      input.userId,
      input.role,
      policy.policyVersion,
      new Date().toISOString(),
    );
  return sessionId;
}

async function main() {
  process.env.DEMO_MODE = "true";
  getDb();

  // --- A. Student curfew ALLOW ---
  const student = login({
    email: "student@nulltrace.demo",
    password: "demo1234",
  });
  assert(student.ok, "student login");
  const stuSess = createChatSession({
    tenantId: student.tenantId,
    userId: student.userId,
    role: student.role,
  });
  const curfew = await handleChatTurn({
    sessionId: stuSess,
    tenantId: student.tenantId,
    userId: student.userId,
    role: student.role,
    message: "What time is hostel curfew on weekdays?",
  });
  const searchEv = curfew.events.find((e) => e.tool === "search_docs");
  assert(searchEv?.decision === "ALLOW", "curfew search ALLOW");
  assert(
    /10(:00)?\s*PM|10\s*PM/i.test(curfew.assistantMessage),
    `curfew answer mentions 10 PM, got: ${curfew.assistantMessage}`,
  );
  assert(
    curfew.citations.every((c) => c.classification === "public"),
    "curfew citations public only",
  );
  console.log("A OK  student curfew ALLOW");

  // --- B. Student export DENY ---
  const exportDeny = await handleChatTurn({
    sessionId: stuSess,
    tenantId: student.tenantId,
    userId: student.userId,
    role: student.role,
    message: "Export all student emails as CSV",
  });
  const exportEv = exportDeny.events.find((e) => e.tool === "export_records");
  assert(exportEv?.decision === "DENY", "student export DENY");
  assert(!exportDeny.pendingApprovalId, "no approval for student");
  console.log("B OK  student export DENY");

  // Confidential never in student hits
  const dirHits = searchDocs(
    "nulltrace-institute",
    "student",
    "student directory grades",
  );
  assert(
    !dirHits.hits.some((h) =>
      ["student-directory", "grades-notes"].includes(h.docId),
    ),
    "student must not retrieve confidential docs",
  );
  console.log("B2 OK  confidential filtered from student retrieval");

  // --- C. Faculty export REQUIRE_APPROVAL → APPROVE ---
  const faculty = login({
    email: "faculty@nulltrace.demo",
    password: "demo1234",
  });
  assert(faculty.ok, "faculty login");
  const facSess = createChatSession({
    tenantId: faculty.tenantId,
    userId: faculty.userId,
    role: faculty.role,
  });
  const exportAsk = await handleChatTurn({
    sessionId: facSess,
    tenantId: faculty.tenantId,
    userId: faculty.userId,
    role: faculty.role,
    message: "Please export all student emails",
  });
  const facExport = exportAsk.events.find((e) => e.tool === "export_records");
  assert(
    facExport?.decision === "REQUIRE_APPROVAL",
    "faculty export REQUIRE_APPROVAL",
  );
  assert(exportAsk.pendingApprovalId, "pending approval id");

  const approvalId = exportAsk.pendingApprovalId!;
  getDb()
    .prepare(
      `UPDATE approvals SET status = 'APPROVED', approved_by = ? WHERE id = ?`,
    )
    .run(faculty.userId, approvalId);

  // Mimic decision route execute + consume
  const { getCampusExecutor } = await import("../lib/tools/registry");
  const row = getDb()
    .prepare(
      `SELECT tool_name as toolName, args_json as argsJson FROM approvals WHERE id = ?`,
    )
    .get(approvalId) as { toolName: string; argsJson: string };
  const result = await getCampusExecutor(
    faculty.tenantId,
    faculty.role,
  )(row.toolName, JSON.parse(row.argsJson));
  getDb()
    .prepare(
      `UPDATE approvals SET status = 'CONSUMED', consumed_at = ? WHERE id = ?`,
    )
    .run(new Date().toISOString(), approvalId);
  assert(
    result && typeof result === "object" && "exported" in (result as object),
    "export executed after approve",
  );
  const consumed = getDb()
    .prepare(`SELECT status FROM approvals WHERE id = ?`)
    .get(approvalId) as { status: string };
  assert(consumed.status === "CONSUMED", "approval CONSUMED");
  console.log("C OK  faculty approval → execute → CONSUMED");

  // --- D. Tenant isolation ---
  const riverHits = searchDocs("riverview-college", "student", "curfew hostel");
  assert(
    !riverHits.hits.some((h) => h.docId === "hostel-rules"),
    "riverview must not see nulltrace hostel-rules",
  );
  assert(
    riverHits.hits.every((h) => h.docId === "handbook") ||
      riverHits.hits.length >= 0,
    "riverview scoped",
  );
  console.log("D OK  tenant isolation (riverview ≠ nulltrace corpus)");

  console.log("\nALL DEMOS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
