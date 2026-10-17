import { randomUUID } from "crypto";
import { getDb } from "../db/client";

/** Mock outbox only — never real SMTP. */
export function sendMockEmail(input: {
  to: string;
  subject: string;
  body: string;
  taskId?: string;
}) {
  const db = getDb();
  const id = `mail_${randomUUID()}`;
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO mock_email_outbox (id, task_id, to_addr, subject, body, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.taskId ?? null,
    input.to,
    input.subject,
    input.body,
    createdAt,
  );
  return { ok: true as const, outboxId: id, createdAt };
}
