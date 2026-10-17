# Campus domain pack (TraceFence)

Owner: **desaitejas777**

Seed corpus and access matrix for the NullTrace Institute demo tenant (`nulltrace-institute`). Synthetic data only — every
name, email and grade is fictional, and all email domains use the reserved `.example` TLD.

## Layout

```text
fixtures/campus/
  docs/
    handbook.md               # public
    hostel-rules.md           # public   — weekday curfew answer (student ALLOW path)
    exam-rules.md             # public
    it-maintenance-notice.md  # public   — contains a deliberate prompt-injection payload (attack demo)
    faculty-guide.md          # internal
    student-directory.md      # confidential (fake names, emails, phones)
    grades-notes.md           # confidential (fake grades and advisor notes)
    pes-anti-ragging.md         # public
    pes-internal-committee.md   # public
    pes-grievance-redressal.md  # public
    pes-academic-rules.md       # public   — PES attendance rule is 80%
    pes-scholarships.md         # public
    pes-loyalty-programme.md    # public
    pes-fee-payment.md          # public
    pes-application-terms.md    # public
    pes-admission-documents.md  # public
    pes-hostel-admission.md     # public
    pes-campus-facilities.md    # public
    pes-research-policy.md      # internal — hidden from students and guests
    pes-university-act.md       # public   — The PES University Act, 2012 (gazetted English text)
  pdf/
    pes-*.pdf                 # PDF of each pes-*.md (same id); the 7 NullTrace demo docs have no PDF yet
  policies/
    roles.json                # role → collections + tools matrix, and the document registry
  scripts/
    register_docs.cjs         # adds docs/*.md missing from roles.json (reads "# " title + "Classification:" line);
                              #   with a folder argument it also converts raw PDFs (needs pdf-parse in tracefence/)
    md_to_pdf.py              # renders docs/*.md to classification-bannered PDFs (needs reportlab; on Windows run with `py`)
```

The `pes-*` documents are paraphrased summaries of PES University's public website, with the source URLs in each file's header. They contain no personal names, phone numbers or emails.

## How the gateway uses these files

- With `DEMO_MODE=true`, the server copies every document listed under `documents` in `roles.json` into SQLite
  `org_documents` for `nulltrace-institute`, then chunks it for keyword retrieval.
- **Classification comes from `roles.json`, not from the markdown.** Each file repeats it in a `Classification:` header
  so humans can read it; keep the two in sync.
- A document that is not listed in `roles.json` is never seeded. Add the `.md` file **and** its `documents` entry.
- Seeding is insert-only. Edits to an existing document do not reach a database that was already seeded; delete
  `tracefence/data/tracefence.sqlite*` to reseed. New documents are picked up on the next start.
- Keep NullTrace demo documents under ~1,000 characters so each fits in one retrieval chunk (window is 1,200 including
  the title). Longer documents such as the `pes-*` set are split into several chunks, which is fine for retrieval.
- Only `hostel-rules.md` may mention curfew, so the student curfew answer stays 10:00 PM.
- Riverview College (`riverview-college`) is seeded separately with a minimal public handbook. Never copy NullTrace
  confidential documents into it.
- Org Admins can change classification or disable documents at runtime; these fixtures must still demo cleanly on first boot.

## Seed policy (`policies/roles.json`, policyVersion 1)

| Role | Collections | search / read | export_records | post_announcement | notify_external |
|---|---|---|---|---|---|
| guest | public | ALLOW | DENY | DENY | DENY |
| student | public | ALLOW | DENY | DENY | DENY |
| faculty | public, internal, confidential | ALLOW | REQUIRE_APPROVAL | REQUIRE_APPROVAL | DENY |
| admin | public, internal, confidential | ALLOW | ALLOW | ALLOW | REQUIRE_APPROVAL |

Retrieval applies the collection ACL **before** any chunk reaches the model.

## Demo coverage

| Demo | Fixture that drives it |
|---|---|
| Student asks weekday curfew → ALLOW, public citation | `hostel-rules.md` |
| Student asks for peer grades / directory → confidential fenced out | `grades-notes.md`, `student-directory.md` |
| Student asks to export emails → `export_records` DENY | `roles.json` student tools |
| Faculty export → REQUIRE_APPROVAL → admin approves once | `roles.json` faculty tools, `faculty-guide.md` |
| Poisoned public source → still DENY | `it-maintenance-notice.md` — see `docs/attacks/poisoned-source-notice.md` |
