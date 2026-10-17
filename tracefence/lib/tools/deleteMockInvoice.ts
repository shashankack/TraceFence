import { getDb } from "../db/client";

/** Demo-only delete of seeded invoice rows. Must still pass gateway. */
export function deleteMockInvoice(invoiceId: string) {
  const db = getDb();
  const info = db.prepare(`DELETE FROM invoices WHERE id = ?`).run(invoiceId);
  return {
    ok: info.changes > 0,
    deleted: info.changes > 0,
    invoiceId,
  };
}
