# Campus domain pack (SecureRAG)

Owner: **desaitejas777**

## Required layout

```text
fixtures/campus/
  docs/
    handbook.md              # classification: public
    hostel-rules.md          # public
    exam-rules.md            # public
    student-directory.md     # confidential (fake emails)
  policies/
    roles.json               # role → collections + tools matrix
```

## Policy rules (must encode)

- `student` → collections `[public]` only; `export_records` DENY  
- `faculty` → `[public, internal, confidential]` per agreement; `export_records` REQUIRE_APPROVAL  
- `admin` → broad allow / approval per matrix  

Retrieval code must read these ACLs **before** returning chunks to the orchestrator.
