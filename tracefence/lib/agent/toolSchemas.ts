import { z } from "zod";

export const readInvoiceArgsSchema = z.object({
  invoice_id: z.string().min(1),
});

export const sendEmailArgsSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
});

export const deleteInvoiceArgsSchema = z.object({
  invoice_id: z.string().min(1),
});

export const toolArgSchemas = {
  read_invoice: readInvoiceArgsSchema,
  send_email: sendEmailArgsSchema,
  delete_invoice: deleteInvoiceArgsSchema,
} as const;

export type ToolName = keyof typeof toolArgSchemas;

/** Ollama / OpenAI-style tool definitions for the orchestrator. */
export const LLM_TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "read_invoice",
      description: "Read a synthetic invoice by id",
      parameters: {
        type: "object",
        properties: { invoice_id: { type: "string" } },
        required: ["invoice_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "send_email",
      description: "Send an email via mock outbox (never real SMTP)",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string" },
          subject: { type: "string" },
          body: { type: "string" },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_invoice",
      description: "Delete a synthetic invoice record",
      parameters: {
        type: "object",
        properties: { invoice_id: { type: "string" } },
        required: ["invoice_id"],
      },
    },
  },
];
