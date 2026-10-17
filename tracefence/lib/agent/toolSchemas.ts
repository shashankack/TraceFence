import { z } from "zod";

export const searchDocsArgsSchema = z.object({
  query: z.string(),
  collection: z.string().optional(),
});

export const readDocumentArgsSchema = z.object({
  doc_id: z.string().min(1),
});

export const exportRecordsArgsSchema = z.object({
  dataset: z.string().min(1),
  format: z.enum(["csv", "json"]).default("csv"),
});

export const postAnnouncementArgsSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

export const notifyExternalArgsSchema = z.object({
  to: z.string().min(1),
  subject: z.string(),
  body: z.string(),
});

export const toolArgSchemas = {
  search_docs: searchDocsArgsSchema,
  read_document: readDocumentArgsSchema,
  export_records: exportRecordsArgsSchema,
  post_announcement: postAnnouncementArgsSchema,
  notify_external: notifyExternalArgsSchema,
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
];
