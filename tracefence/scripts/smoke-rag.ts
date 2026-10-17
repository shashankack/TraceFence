import { getDb } from "../lib/db/client";
import { searchDocs } from "../lib/campus/retrieval";

getDb();
const hi = searchDocs("nulltrace-institute", "student", "Hi");
const curfew = searchDocs("nulltrace-institute", "student", "hostel curfew");
const grades = searchDocs("nulltrace-institute", "student", "grades gpa marks");

console.log(
  JSON.stringify(
    {
      hiHits: hi.hits.length,
      curfew: curfew.hits.map((h) => ({
        title: h.title,
        len: h.content.length,
        preview: h.content.slice(0, 100),
      })),
      studentGradesHits: grades.hits.map((h) => h.title),
      filteredConfidential: grades.filteredOut.filter((id) =>
        /grade|directory/i.test(id),
      ),
    },
    null,
    2,
  ),
);

if (hi.hits.length !== 0) throw new Error("Hi should not retrieve chunks");
if (!curfew.hits.length) throw new Error("curfew should hit hostel chunks");
if (curfew.hits.some((h) => h.content.length > 2000)) {
  throw new Error("chunk content unexpectedly large");
}
console.log("RAG smoke OK");
