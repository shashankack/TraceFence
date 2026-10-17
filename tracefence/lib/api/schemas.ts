import { z } from "zod";

export const createSessionSchema = z.object({
  role: z.enum(["student", "faculty", "admin"]),
  userId: z.string().optional(),
});

export const sessionMessageSchema = z.object({
  message: z.string().min(1),
});

export const approvalDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
});

/** @deprecated Legacy task create — campus uses sessions. */
export const createTaskSchema = z.object({
  instruction: z.string().min(1),
  sourceUrl: z.string().url().optional(),
});
