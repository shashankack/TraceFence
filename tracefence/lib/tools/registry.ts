import { deleteMockInvoice } from "./deleteMockInvoice";
import { readInvoice } from "./readInvoice";
import { sendMockEmail } from "./sendMockEmail";

export async function executeTool(
  tool: string,
  args: Record<string, unknown>,
  ctx?: { taskId?: string },
): Promise<unknown> {
  switch (tool) {
    case "read_invoice":
      return readInvoice(String(args.invoice_id ?? ""));
    case "send_email":
      return sendMockEmail({
        to: String(args.to ?? ""),
        subject: String(args.subject ?? ""),
        body: String(args.body ?? ""),
        taskId: ctx?.taskId,
      });
    case "delete_invoice":
      return deleteMockInvoice(String(args.invoice_id ?? ""));
    default:
      throw new Error(`No executor for tool: ${tool}`);
  }
}
