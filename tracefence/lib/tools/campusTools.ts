import { readDocument, searchDocs } from "../campus/retrieval";
import type { CampusRole } from "../security/types";

export async function executeCampusTool(
  role: CampusRole,
  tool: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (tool) {
    case "search_docs": {
      const query = String(args.query ?? "");
      const collection =
        typeof args.collection === "string" ? args.collection : undefined;
      return searchDocs(role, query, collection);
    }
    case "read_document": {
      const docId = String(args.doc_id ?? "");
      const result = readDocument(role, docId);
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
    case "post_announcement":
      return {
        posted: true,
        title: String(args.title ?? ""),
        body: String(args.body ?? ""),
      };
    case "notify_external":
      return {
        queued: true,
        to: String(args.to ?? ""),
        note: "Mock only — no real send",
      };
    default:
      throw new Error(`No executor for tool ${tool}`);
  }
}
