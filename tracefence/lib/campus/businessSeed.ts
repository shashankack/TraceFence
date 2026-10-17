import { getDb } from "../db/client";
import { invalidateCampusPolicyCache } from "./policy";
import { ensureChunksForTenant, reindexDocument } from "./chunkIndex";

const BUSINESS_HANDBOOK = `# Acme Business Handbook (synthetic)

Classification: public

## Office hours
Weekday desk coverage is 9:00 AM – 6:00 PM local time. Remote staff sync at 10:00 AM.

## Expense policy
Managers may approve expenses under $500. Larger exports of customer or payroll data require admin approval through TraceFence.

## Data handling
Customer emails and invoices are internal. Confidential payroll notes must never enter Member context.

## Announcements
Company-wide announcements go through the post_announcement tool and are logged.
`;

const BUSINESS_INTERNAL = `# Manager Guide (synthetic)

Classification: internal

## Customer directory
Managers may search the customer directory. Members see public handbook only.

## Exports
export_records for customer_emails / student_emails-shaped datasets requires REQUIRE_APPROVAL for Managers and is DENY for Members.
`;

/** Seed a short small-business corpus for a new tenant. */
export function seedBusinessDocumentsForTenant(tenantId: string) {
  const db = getDb();
  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO org_documents
     (tenant_id, id, title, classification, collection, enabled, content, source, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, 'fixture', ?)
     ON CONFLICT(tenant_id, id) DO NOTHING`,
  );

  insert.run(
    tenantId,
    "business-handbook",
    "Business Handbook",
    "public",
    "public",
    BUSINESS_HANDBOOK,
    now,
  );
  insert.run(
    tenantId,
    "manager-guide",
    "Manager Guide",
    "internal",
    "internal",
    BUSINESS_INTERNAL,
    now,
  );

  reindexDocument(tenantId, "business-handbook", "Business Handbook", BUSINESS_HANDBOOK);
  reindexDocument(tenantId, "manager-guide", "Manager Guide", BUSINESS_INTERNAL);
  ensureChunksForTenant(tenantId);
  invalidateCampusPolicyCache(tenantId);
}
