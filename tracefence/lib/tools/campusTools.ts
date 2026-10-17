import { readSanitizedChatUpload } from "../campus/chatUpload";
import { readDocument, searchDocs } from "../campus/retrieval";
import type { CampusRole } from "../security/types";
import type { CampusExecutorContext } from "./registry";

export async function executeCampusTool(
  tenantId: string,
  role: CampusRole,
  tool: string,
  args: Record<string, unknown>,
  ctx: CampusExecutorContext = {},
): Promise<unknown> {
  switch (tool) {
    case "search_docs": {
      const query = String(args.query ?? "");
      const collection =
        typeof args.collection === "string" ? args.collection : undefined;
      return searchDocs(tenantId, role, query, collection);
    }
    case "read_document": {
      const docId = String(args.doc_id ?? "");
      const result = readDocument(tenantId, role, docId);
      if (!result.ok) {
        return { error: result.reasonCode, docId };
      }
      return {
        docId: result.doc.docId,
        title: result.doc.title,
        classification: result.doc.classification,
        content: result.doc.content,
      };
    }
    case "export_records": {
      const dataset = String(args.dataset ?? "");
      const format = String(args.format ?? "csv");
      return {
        exported: true,
        dataset,
        format,
        tenantId,
        rows: dataset.includes("email") || dataset.includes("directory")
          ? [
              {
                name: "Alex Rivera",
                email: "alex.rivera@students.nulltrace.example",
              },
            ]
          : [{ note: `Synthetic export of ${dataset}` }],
        warning: "Synthetic demo export only",
      };
    }
    case "use_chat_upload": {
      const uploadId = String(args.upload_id ?? "");
      if (!ctx.sessionId || !ctx.userId) {
        return {
          ok: false,
          error: "Session context required for use_chat_upload",
        };
      }
      const result = readSanitizedChatUpload({
        sessionId: ctx.sessionId,
        tenantId,
        userId: ctx.userId,
        uploadId,
      });
      if (!result.ok) {
        return {
          ok: false,
          error: result.error,
          status: result.status,
          flags: result.flags,
          uploadId,
        };
      }
      return {
        ok: true,
        uploadId: result.uploadId,
        filename: result.filename,
        status: result.status,
        flags: result.flags,
        content: result.content,
        note: "Sanitized upload only   raw file never enters model context",
      };
    }
    case "post_announcement":
      return {
        posted: true,
        title: String(args.title ?? ""),
        body: String(args.body ?? ""),
        tenantId,
      };
    case "notify_external":
      return {
        queued: true,
        to: String(args.to ?? ""),
        note: "Mock only  no real send",
        tenantId,
      };
    default:
      throw new Error(`No executor for tool ${tool}`);
  }
}
