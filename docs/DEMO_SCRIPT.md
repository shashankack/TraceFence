# TraceFence — 3-minute demo

**Open line:** “TraceFence — a source-aware security gateway for AI agents.”

### 0:00–0:25 Problem
“Agents read sources and call tools. Unsafe pattern: retrieve first, trust the model not to leak or act.”

### 0:25–0:45 Setup
Role = **Student**. “We filter what enters context before the LLM.”

### 0:45–1:25 Allowed retrieval
Ask hostel curfew. Show only **public** docs retrieved → ALLOW → correct answer.  
Point: confidential directory was **not** in context.

### 1:25–2:10 Denied action / retrieval
Ask to export all student emails or show peer grades.  
Show DENY on `export_records` and/or empty confidential retrieval. Audit row.

### 2:10–2:40 Faculty approval
Switch to **Faculty**. Export → REQUIRE_APPROVAL → Approve once.

### 2:40–3:00 Close
“Source-aware reads + tool gateway outside the model. LLM is not the security boundary.”
