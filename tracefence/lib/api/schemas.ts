import { z } from "zod";

/** @deprecated Role/userId come from Bearer auth membership. */
export const createSessionSchema = z.object({}).optional();

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).optional(),
  tenantName: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantId: z.string().min(1).optional(),
});

export const sessionMessageSchema = z.object({
  message: z.string().min(1),
});

export const approvalDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
});

export const createOrgDocumentSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1),
  classification: z.enum(["public", "internal", "confidential"]),
  collection: z.string().min(1),
  content: z.string().min(1),
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

/** @deprecated Legacy task create — campus uses sessions. */
export const createTaskSchema = z.object({
  instruction: z.string().min(1),
  sourceUrl: z.string().url().optional(),
});
