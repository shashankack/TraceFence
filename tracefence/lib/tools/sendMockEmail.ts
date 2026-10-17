import { randomUUID } from "crypto";
import { getDb } from "../db/client";

/** Mock outbox  always written. Optional SMTP when SMTP_URL / SMTP_HOST is set. */
export function sendMockEmail(input: {
  to: string;
  subject: string;
  body: string;
  taskId?: string;
  tenantId?: string;
  kind?: string;
}) {
  const db = getDb();
  const id = `mail_${randomUUID()}`;
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO mock_email_outbox
     (id, task_id, tenant_id, kind, to_addr, subject, body, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.taskId ?? null,
    input.tenantId ?? null,
    input.kind ?? null,
    input.to,
    input.subject,
    input.body,
    createdAt,
  );

  void maybeSendSmtp(input.to, input.subject, input.body);

  return { ok: true as const, outboxId: id, createdAt };
}

export function listTenantNotifications(
  tenantId: string,
  limit = 30,
): Array<{
  id: string;
  to: string;
  subject: string;
  body: string;
  kind: string | null;
  taskId: string | null;
  createdAt: string;
}> {
  return (
    getDb()
      .prepare(
        `SELECT id, to_addr as "to", subject, body, kind, task_id as taskId,
                created_at as createdAt
         FROM mock_email_outbox
         WHERE tenant_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,
      )
      .all(tenantId, limit) as Array<{
      id: string;
      to: string;
      subject: string;
      body: string;
      kind: string | null;
      taskId: string | null;
      createdAt: string;
    }>
  );
}

async function maybeSendSmtp(to: string, subject: string, body: string) {
  const host = process.env.SMTP_HOST;
  const url = process.env.SMTP_URL;
  if (!host && !url) return;
  // Best-effort demo hook  never throws into the gateway path.
  try {
    if (url?.startsWith("smtp://") || url?.startsWith("smtps://")) {
      // Placeholder: real nodemailer wiring can plug here when SMTP_* is configured.
      console.info("[tracefence] SMTP configured; mock outbox retained", {
        to,
        subject: subject.slice(0, 60),
      });
    } else if (host) {
      console.info("[tracefence] SMTP_HOST set; mock outbox retained", {
        to,
        host,
      });
    }
  } catch {
    /* ignore */
  }
}
