import { z } from "zod";

export const searchDocsArgsSchema = z.object({
  query: z.string(),
  collection: z.string().optional(),
});

export const readDocumentArgsSchema = z.object({
  doc_id: z.string().min(1),
});

export const exportRecordsArgsSchema = z.object({
  dataset: z
    .string()
    .min(1)
    .transform((s) => s.trim().toLowerCase()),
  format: z.enum(["csv", "json"]).default("csv"),
});

export const postAnnouncementArgsSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
});

export const notifyExternalArgsSchema = z.object({
  to: z.string().email().max(200),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
});

export const useChatUploadArgsSchema = z.object({
  upload_id: z.string().min(1),
});

export const toolArgSchemas = {
  search_docs: searchDocsArgsSchema,
  read_document: readDocumentArgsSchema,
  export_records: exportRecordsArgsSchema,
  post_announcement: postAnnouncementArgsSchema,
  notify_external: notifyExternalArgsSchema,
  use_chat_upload: useChatUploadArgsSchema,
} as const;

export type ToolName = keyof typeof toolArgSchemas;

export const LLM_TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "search_docs",
      description: "Permission-filtered search over campus documents",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          collection: { type: "string" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "read_document",
      description: "Read one campus document if ACL allows",
      parameters: {
        type: "object",
        properties: { doc_id: { type: "string" } },
        required: ["doc_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "export_records",
      description: "Export a campus dataset (emails, grades, etc.)",
      parameters: {
        type: "object",
        properties: {
          dataset: { type: "string" },
          format: { type: "string", enum: ["csv", "json"] },
        },
        required: ["dataset"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "use_chat_upload",
      description:
        "Read a session chat upload after server sanitize (never raw poison)",
      parameters: {
        type: "object",
        properties: {
          upload_id: { type: "string" },
        },
        required: ["upload_id"],
      },
    },
  },
];
