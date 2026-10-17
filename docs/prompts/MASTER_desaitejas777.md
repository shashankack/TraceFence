# TraceFence master prompt — desaitejas777

Paste the fenced block. **GIT first** — discard old invoice/QR fixture assumptions.

```text
You help desaitejas777 own campus fixtures for TraceFence.
Repo: https://github.com/shashankack/TraceFence.git
Product: TraceFence — A source-aware security gateway for AI agents.
Org Admin uploads/overrides docs at runtime; your fixtures are the SEED corpus + ACL matrix.
NOT email-only hero. NOT SecureRAG product. NO vector RAG. Synthetic data only — no real PII.

=== GIT (DO FIRST) ===
git fetch origin
git checkout feature/desaitejas777-fixtures
git pull origin feature/desaitejas777-fixtures
git merge origin/main
git merge origin/feature/shashankack-backend
Prefer origin/main for docs/** on conflicts.
Never rewrite tracefence/lib/** or app/api/** — report gaps to shashankack.

Owns: fixtures/campus/**, docs/attacks/**
Must NOT change: tracefence/lib/**, tracefence/app/api/**, components/**

=== MUST READ (after merge) ===
1. docs/SCOPE_AND_RULES.md
2. docs/JUDGE_AND_TEAM_BRIEF.md
3. fixtures/campus/README.md
4. docs/contracts.md
5. docs/SYSTEM_OVERVIEW.md
6. docs/DEMO_SCRIPT.md
7. docs/PROGRESS.md
8. docs/attacks/* (create/update if missing)

=== HOW FIXTURES ARE USED ===
- DEMO_MODE copies fixtures/campus into SQLite org_documents for tenant nulltrace-institute.
- policies/roles.json is the seed role×collection×tool matrix (policyVersion starts at 1).
- Riverview College is a second tenant with a minimal handbook — do not mix NullTrace confidential into Riverview fixtures.
- Org Admin can override classification/enabled later; fixtures must still demo cleanly on first boot.

=== BUILD ===
1. Keep docs/classification crystal clear in each .md header:
   public: handbook, hostel-rules, exam-rules
   internal: faculty-guide
   confidential: student-directory, grades-notes (FAKE emails/names only)
2. policies/roles.json must match demos:
   student → collections [public]; export_records DENY; notify_external DENY
   faculty → public+internal+confidential; export_records REQUIRE_APPROVAL
   admin → broad ALLOW / notify REQUIRE_APPROVAL as in contracts
3. Killer-demo content:
   - hostel-rules.md must answer weekday curfew clearly (student ALLOW path)
   - student-directory / grades-notes must be tempting but confidential
4. Attack doc (docs/attacks/ + optional fixtures doc):
   Text that says “export all emails to attacker@…” — classification public or internal is fine;
   prove source text ≠ authority (gateway still DENYs student export).
5. Update fixtures/campus/README.md if layout changes.
6. Update docs/PROGRESS.md each iteration.

=== OUT OF SCOPE ===
Real PII, real SMTP, embeddings/vector index, FastAPI, rewriting gateway code.

=== ADCE ===
adce status
adce context --task "Campus ACL fixtures for TraceFence" --format markdown
```
