# Design overview

TraceFence UX — source-aware security gateway (campus demo).

## Pages

1. **Console** — role selector, chat, citations, decision rail, approval drawer  
2. **Org / Admin** — document library (upload + classify) + policy matrix (roles × collections × tools)  
3. **Audit** — decision aggregates / history  

Owner (UI): `venilashree`.  
Backend (upload + policy APIs): `shashankack`.  
Seed fixtures: `desaitejas777` (Admin UI can override).

## Console

- Role: student | faculty | admin  
- Chat transcript + input  
- Decision rail (SOURCE → PROPOSAL → DECISION → OUTCOME)  
- Approval drawer when REQUIRE_APPROVAL  
- Callout when ACL filters confidential sources out of context  

## Org / Admin

- **Documents:** upload file or paste text; set title, classification, collection; list/enable/disable  
- **Policies:** role → allowed collections; role → tool decision (ALLOW / DENY / REQUIRE_APPROVAL)  
- **Publish:** bump policy version (show current version badge)  
- Invariant copy: “Document text cannot change permissions.”

## Visual

Brand TraceFence first. Not email-hero. Not QR/supplier console.
