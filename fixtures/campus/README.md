# Campus domain pack (TraceFence)

Owner: **desaitejas777**

TraceFence demo fixtures for NullTrace Institute. Synthetic data only.

## Layout

```text
fixtures/campus/
  docs/
    handbook.md              # classification: public
    hostel-rules.md          # public
    exam-rules.md            # public
    faculty-guide.md         # internal
    student-directory.md     # confidential (fake emails)
    grades-notes.md          # confidential
  policies/
    roles.json               # role → collections + tools matrix
```

## Policy rules (must encode)

- `student` → collections `[public]` only; `export_records` DENY  
- `faculty` → `[public, internal, confidential]`; `export_records` REQUIRE_APPROVAL  
- `admin` → broad allow / approval per matrix  

Retrieval code must read these ACLs **before** returning chunks to the orchestrator.
