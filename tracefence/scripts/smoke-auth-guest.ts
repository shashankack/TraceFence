import { randomUUID } from "crypto";
import { getDb } from "../lib/db/client";
import { issueGuestToken } from "../lib/auth/guest";
import { login } from "../lib/auth/users";
import { handleChatTurn } from "../lib/campus/chat";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main() {
  getDb();

  const guest = issueGuestToken();
  const guestSid = `sess_${randomUUID().slice(0, 8)}`;
  getDb()
    .prepare(
      `INSERT INTO sessions (id, tenant_id, user_id, role, policy_version, created_at)
       VALUES (?, ?, ?, ?, 1, ?)`,
    )
    .run(guestSid, guest.tenantId, guest.userId, "guest", new Date().toISOString());

  const publicQ = await handleChatTurn({
    sessionId: guestSid,
    tenantId: guest.tenantId,
    userId: guest.userId,
    role: "guest",
    message: "What time is hostel curfew on weekdays?",
  });
  assert(!publicQ.authRequired, "public curfew should not require auth");
  assert(/10(:00)?\s*PM|10\s*PM/i.test(publicQ.assistantMessage), publicQ.assistantMessage);

  const gated = await handleChatTurn({
    sessionId: guestSid,
    tenantId: guest.tenantId,
    userId: guest.userId,
    role: "guest",
    message: "Export every student email from the directory",
  });
  assert(gated.authRequired === true, "export as guest must authRequired");
  assert(
    gated.events.some((e) => e.reasonCode === "AUTH_REQUIRED"),
    "AUTH_REQUIRED event",
  );

  const student = login({
    email: "student@nulltrace.demo",
    password: "demo1234",
  });
  assert(student.ok, "student login");
  const alex = login({ email: "alex@nulltrace.demo", password: "demo1234" });
  assert(alex.ok && alex.role === "student", "alex student");
  const jordan = login({ email: "jordan@nulltrace.demo", password: "demo1234" });
  assert(jordan.ok && jordan.role === "faculty", "jordan faculty");

  console.log("A OK — guest public curfew");
  console.log("B OK — guest export AUTH_REQUIRED");
  console.log("C OK — seeded logins (student/alex/jordan)");
  console.log("AUTH GUEST SMOKE PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
