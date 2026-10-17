import type { OrgDocumentDTO } from "@/components/api/types";

/** Display metadata for the seeded NullTrace corpus. Citations only carry docId, so titles come from here. */
const DOC_TITLES: Record<string, string> = {
  handbook: "Student Handbook",
  "hostel-rules": "Hostel Rules",
  "exam-rules": "Exam Rules",
  "it-maintenance-notice": "IT Maintenance Notice",
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

/** Seed classifications, used only to label fenced document ids (the fence event carries ids, not classes). */
export const SEED_DOCUMENTS: Pick<OrgDocumentDTO, "id" | "classification">[] = [
  { id: "handbook", classification: "public" },
  { id: "hostel-rules", classification: "public" },
  { id: "exam-rules", classification: "public" },
  { id: "it-maintenance-notice", classification: "public" },
  { id: "faculty-guide", classification: "internal" },
  { id: "student-directory", classification: "confidential" },
  { id: "grades-notes", classification: "confidential" },
];
