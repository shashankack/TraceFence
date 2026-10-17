import { getDb } from "../db/client";

export function readInvoice(invoiceId: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, customer, amount_cents, currency, status, note
       FROM invoices WHERE id = ?`,
    )
    .get(invoiceId);

  if (!row) {
    return { ok: false as const, error: `Invoice not found: ${invoiceId}` };
  }

  return { ok: true as const, invoice: row };
}
