import { z } from "zod";

/** @deprecated Role/userId come from Bearer auth membership. */
export const createSessionSchema = z.object({}).optional();

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).optional(),
  tenantName: z.string().min(1).optional(),
  orgType: z.enum(["college", "small_business"]).optional(),
  notifyEmail: z.string().email().optional(),
});

const roleLabelsSchema = z.record(z.string().max(40), z.string().max(40)).optional();

export const orgProfilePatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  notifyEmail: z.string().email().nullable().optional(),
  orgType: z.enum(["college", "small_business"]).optional(),
  profile: z
    .object({
      website: z.string().max(200).optional(),
      city: z.string().max(120).optional(),
      sizeBand: z.string().max(80).optional(),
      roleLabels: roleLabelsSchema,
    })
    .optional(),
});

export const createCustomRoleSchema = z.object({
  label: z.string().min(1).max(40),
  workspace: z.enum(["student", "faculty"]).optional(),
  id: z.string().max(40).optional(),
});

export const setMemberRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.string().min(1).max(40),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantId: z.string().min(1).optional(),
});

export const switchTenantSchema = z.object({
  tenantId: z.string().min(1),
});

export const sessionMessageSchema = z
  .object({
    message: z.string().max(8000).default(""),
    attachmentIds: z.array(z.string().min(1).max(80)).max(5).optional(),
  })
  .refine((v) => v.message.trim().length > 0 || (v.attachmentIds?.length ?? 0) > 0, {
    message: "message or attachmentIds required",
  });

export const sessionAttachmentSchema = z
  .object({
    filename: z.string().min(1).max(200),
    content: z.string().min(1).max(200_000).optional(),
    pdfBase64: z.string().min(1).optional(),
  })
  .refine((v) => Boolean(v.content || v.pdfBase64), {
    message: "content or pdfBase64 required",
  });

export const approvalDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
});

export const createOrgDocumentSchema = z
  .object({
    id: z.string().min(1).optional(),
    title: z.string().min(1),
    classification: z.enum(["public", "internal", "confidential"]),
    collection: z.string().min(1),
    /** Plain text (md/extracted). Optional if pdfBase64 is set. */
    content: z.string().min(1).optional(),
    /** Raw or data-URL base64 PDF  server extracts text then chunks. */
    pdfBase64: z.string().min(1).optional(),
  })
  .refine((v) => Boolean(v.content || v.pdfBase64), {
    message: "content or pdfBase64 required",
  });

export const patchOrgDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  classification: z.enum(["public", "internal", "confidential"]).optional(),
  collection: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  content: z.string().min(1).optional(),
});

export const putOrgPolicySchema = z.object({
  roles: z.record(z.string(), z.unknown()),
});

/** @deprecated Legacy task create  campus uses sessions. */
export const createTaskSchema = z.object({
  instruction: z.string().min(1),
  sourceUrl: z.string().url().optional(),
});
