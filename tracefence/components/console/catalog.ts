import type { Classification, Decision, OrgDocumentDTO, OrgPolicyDTO, Role } from "@/components/api/types";

/** Display metadata for the seeded NullTrace corpus. Citations only carry docId, so titles come from here. */
export const DOC_TITLES: Record<string, string> = {
  handbook: "Student Handbook",
  "hostel-rules": "Hostel Rules",
  "exam-rules": "Exam Rules",
  "faculty-guide": "Faculty Guidance",
  "student-directory": "Student Directory (synthetic)",
  "grades-notes": "Grades Notes (synthetic)",
};

export function docTitle(docId: string): string {
  return (
    DOC_TITLES[docId] ??
    docId
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

export const ROLE_LABEL: Record<Role, string> = {
  guest: "Guest",
  student: "Student",
  faculty: "Faculty",
  admin: "Admin",
};

export const SEED_DOCUMENTS: OrgDocumentDTO[] = [
  { id: "handbook", title: "Student Handbook", classification: "public", collection: "public", enabled: true },
  { id: "hostel-rules", title: "Hostel Rules", classification: "public", collection: "public", enabled: true },
  { id: "exam-rules", title: "Exam Rules", classification: "public", collection: "public", enabled: true },
  { id: "faculty-guide", title: "Faculty Guidance", classification: "internal", collection: "internal", enabled: true },
  {
    id: "student-directory",
    title: "Student Directory (synthetic)",
    classification: "confidential",
    collection: "confidential",
    enabled: true,
  },
  {
    id: "grades-notes",
    title: "Grades Notes (synthetic)",
    classification: "confidential",
    collection: "confidential",
    enabled: true,
  },
];

const tools = (
  search_docs: Decision,
  read_document: Decision,
  export_records: Decision,
  post_announcement: Decision,
  notify_external: Decision,
) => ({ search_docs, read_document, export_records, post_announcement, notify_external });

export const SEED_POLICY: OrgPolicyDTO = {
  policyVersion: 1,
  roles: {
    student: { collections: ["public"], tools: tools("ALLOW", "ALLOW", "DENY", "DENY", "DENY") },
    faculty: {
      collections: ["public", "internal", "confidential"],
      tools: tools("ALLOW", "ALLOW", "REQUIRE_APPROVAL", "REQUIRE_APPROVAL", "DENY"),
    },
    admin: {
      collections: ["public", "internal", "confidential"],
      tools: tools("ALLOW", "ALLOW", "ALLOW", "ALLOW", "REQUIRE_APPROVAL"),
    },
  },
};

export const CLASSIFICATION_TONE: Record<Classification, string> = {
  public: "text-allow bg-allow-soft border-allow/30",
  internal: "text-internal bg-internal-soft border-internal/30",
  confidential: "text-deny bg-deny-soft border-deny/30",
};
