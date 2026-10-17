import { z } from "zod";

export const inspectBodySchema = z.object({
  url: z.string().url(),
});

export const createTaskBodySchema = z.object({
  instruction: z.string().min(1),
  sourceId: z.string().optional(),
  allowedInvoiceIds: z.array(z.string()).default(["INV-001", "INV-002", "INV-003"]),
  rules: z
    .array(
      z.object({
        tool: z.string(),
        action: z.enum(["ALLOW", "DENY", "REQUIRE_APPROVAL"]),
        allowedInvoiceIds: z.array(z.string()).optional(),
        allowedRecipientDomains: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  expiresInMinutes: z.number().int().positive().default(30),
});

export const approvalDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
});
