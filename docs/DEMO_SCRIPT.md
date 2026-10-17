# TraceFence  3-minute demo

**Open line:** “TraceFence  a source-aware security gateway for AI agents. Not an email-only tool.”

### 0:00–0:25 Problem
“Agents read sources and call tools. Trusting the model isn’t a boundary.”

### 0:25–0:45 Setup
Role = **Student**. “We filter sources before the LLM and authorize every tool.”

### 0:45–1:25 Allowed read
Ask hostel curfew. Show **public** sources only → ALLOW → answer.  
Point: confidential directory never entered context.

### 1:25–2:10 Denied action (export  not “email story”)
Ask to export student records / dump directory.  
Show DENY on `export_records` (and empty confidential retrieval). Audit row.

### 2:10–2:40 Faculty approval
Switch to **Faculty**. Export → REQUIRE_APPROVAL → Approve once.  
Optional aside: notify/email would use the same gateway path.

### 2:40–3:00 Close
“Source-aware reads + multi-tool gateway. SOURCE → PROPOSAL → DECISION → OUTCOME. LLM is not the security boundary.”
