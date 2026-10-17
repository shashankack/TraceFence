import { listTenantAdminEmails, getTenantProfile } from "../org/tenantProfile";
import { sendMockEmail } from "../tools/sendMockEmail";

const APP_BASE = () =>
  (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Email tenant admins when the gateway raises REQUIRE_APPROVAL. */
export function notifyTenantAdminsOfApproval(input: {
  tenantId: string;
  approvalId: string;
  sessionId: string;
  requesterUserId: string;
  toolName: string;
  argsPreview?: Record<string, unknown>;
  expiresAt: string;
}): { sent: number } {
  const profile = getTenantProfile(input.tenantId);
  const recipients = listTenantAdminEmails(input.tenantId);
  if (recipients.length === 0) return { sent: 0 };

  const orgName = profile?.name ?? input.tenantId;
  const link = `${APP_BASE()}/admin/approvals`;
  const argsLine = input.argsPreview
    ? JSON.stringify(input.argsPreview)
    : "(none)";
  const subject = `[TraceFence] Approval needed · ${input.toolName} · ${orgName}`;
  const body = [
    `TraceFence paused a tool call that needs a one-time human approval.`,
    ``,
    `Organization: ${orgName}`,
    `Tool: ${input.toolName}`,
    `Requested by: ${input.requesterUserId}`,
    `Session: ${input.sessionId}`,
    `Approval id: ${input.approvalId}`,
    `Expires: ${input.expiresAt}`,
    `Args: ${argsLine}`,
    ``,
    `Review and approve once: ${link}`,
    ``,
    `This message is also stored in the tenant Notifications inbox (demo outbox).`,
  ].join("\n");

  let sent = 0;
  for (const to of recipients) {
    sendMockEmail({
      to,
      subject,
      body,
      taskId: input.approvalId,
      tenantId: input.tenantId,
      kind: "approval_request",
    });
    sent += 1;
  }
  return { sent };
}
