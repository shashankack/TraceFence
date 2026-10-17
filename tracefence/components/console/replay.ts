/**
 * Scripted replay: a deterministic stand-in for the gateway, used when the live API
 * is unreachable or the presenter picks "Scripted replay". It emits the same DTOs as
 * POST /api/sessions/:id/messages so the UI has a single rendering path.
 */
import type { ApprovalDTO, CitationDTO, EventDTO, MessageResponseDTO, Role } from "@/components/api/types";
import { SEED_DOCUMENTS, SEED_POLICY } from "./catalog";

const SNIPPETS: Record<string, string> = {
  "hostel-rules":
    "Weekday hostel curfew is 10:00 PM. Weekend curfew is 11:30 PM. Late entry requires warden approval.",
  handbook:
    "The main library is open 8:00 AM – 10:00 PM on weekdays and 10:00 AM – 6:00 PM on weekends.",
  "exam-rules":
    "No electronic devices during written exams unless explicitly allowed by the invigilator. Missed exams need a medical certificate within 48 hours.",
  "faculty-guide": "Faculty guidance: advisee records may only be shared through approved exports.",
};

const KEYWORDS: Record<string, string[]> = {
  "hostel-rules": ["hostel", "curfew", "guest", "late"],
  handbook: ["library", "hours", "id card", "handbook"],
  "exam-rules": ["exam", "device", "invigilator", "missed"],
  "faculty-guide": ["faculty", "advisee", "guidance"],
  "student-directory": ["directory", "email", "student"],
  "grades-notes": ["grade", "marks", "gpa"],
};

let seq = 0;
const id = () => `rp_${Date.now().toString(36)}_${(seq++).toString(36)}`;
const now = () => new Date().toISOString();

export function wantsExport(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("export") ||
    (m.includes("email") && /all|list|dump|every/.test(m)) ||
    m.includes("directory dump") ||
    m.includes("download student")
  );
}

export function replaySessionId(role: Role) {
  return `sess_replay_${role.slice(0, 3)}`;
}

export function replayTurn(
  role: Role,
  sessionId: string,
  message: string,
): { response: MessageResponseDTO; approval?: ApprovalDTO } {
  const m = message.toLowerCase();
  const allowed = SEED_POLICY.roles[role].collections;
  const events: EventDTO[] = [];
  const citations: CitationDTO[] = [];

  const filteredOut = SEED_DOCUMENTS.filter((d) => !allowed.includes(d.collection)).map((d) => d.id);
  const hits = SEED_DOCUMENTS.filter(
    (d) => allowed.includes(d.collection) && KEYWORDS[d.id]?.some((k) => m.includes(k)),
  );

  events.push({
    id: id(),
    sessionId,
    ts: now(),
    phase: "DECISION",
    tool: "search_docs",
    decision: "ALLOW",
    reasonCode: "ALLOWED",
    argsPreview: { query: message },
    outcome: `${hits.length} permitted document(s) matched`,
    docIds: hits.map((h) => h.id),
  });
  if (filteredOut.length) {
    events.push({
      id: id(),
      sessionId,
      ts: now(),
      phase: "SOURCE",
      tool: "search_docs",
      decision: "ALLOW",
      reasonCode: "RETRIEVAL_FILTERED",
      argsPreview: { filteredOut },
      outcome: `ACL excluded ${filteredOut.length} document(s) from context`,
    });
  }
  for (const h of hits) {
    if (h.classification !== "confidential" || role !== "student") {
      citations.push({ docId: h.id, classification: h.classification });
    }
  }

  if (wantsExport(message)) {
    const args = { dataset: "student_emails", format: "csv" };
    const decision = SEED_POLICY.roles[role].tools.export_records;
    const reasonCode =
      decision === "ALLOW" ? "ALLOWED" : decision === "DENY" ? "DENIED_EXPORT" : "REQUIRES_APPROVAL";
    events.push({
      id: id(),
      sessionId,
      ts: now(),
      phase: "DECISION",
      tool: "export_records",
      decision,
      reasonCode,
      argsPreview: args,
      outcome:
        decision === "DENY"
          ? "Export blocked before execution"
          : decision === "REQUIRE_APPROVAL"
            ? "Exact action held for a human checkpoint"
            : "Executed (synthetic data)",
    });

    if (decision === "DENY") {
      return {
        response: {
          assistantMessage:
            "Export denied for your role. This decision was enforced by the TraceFence gateway, not by the model.",
          citations: [],
          events,
        },
      };
    }
    if (decision === "REQUIRE_APPROVAL") {
      const approvalId = id();
      return {
        response: {
          assistantMessage:
            "Export requires a one-time human approval for this exact action. Approve it in the approvals panel, then retry.",
          citations,
          events,
          pendingApprovalId: approvalId,
        },
        approval: {
          id: approvalId,
          sessionId,
          userId: "demo-user-1",
          toolName: "export_records",
          args,
          canonicalArgsHash: "sha256:4d8a1f0c7be2e93a5d6c41f8b02e9a7c3f15d8e64b0a2c97e1d3f5a8b6c491c2",
          policyVersion: SEED_POLICY.policyVersion,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
          createdAt: now(),
        },
      };
    }
    return {
      response: {
        assistantMessage: "Export completed (synthetic demo data only). See the decision rail for details.",
        citations,
        events,
      },
    };
  }

  const top = hits.find((h) => SNIPPETS[h.id]);
  let assistantMessage: string;
  if (top) {
    assistantMessage = `${SNIPPETS[top.id]} (Source: ${top.title})`;
  } else if (/grade|directory|peer/.test(m)) {
    assistantMessage =
      "I cannot provide confidential student records for your role. Unauthorized sources were not loaded into context.";
  } else {
    assistantMessage =
      "I could not find an allowed campus document for that question. Try asking about hostel curfew, library hours, or exam rules.";
  }
  return { response: { assistantMessage, citations, events } };
}

export function replayApprovalOutcome(approval: ApprovalDTO, decision: "APPROVE" | "REJECT"): EventDTO {
  return decision === "APPROVE"
    ? {
        id: id(),
        sessionId: approval.sessionId,
        ts: now(),
        phase: "OUTCOME",
        tool: approval.toolName,
        decision: "ALLOW",
        reasonCode: "APPROVAL_CONSUMED",
        argsPreview: approval.args,
        outcome: "Executed once; single-use grant invalidated",
      }
    : {
        id: id(),
        sessionId: approval.sessionId,
        ts: now(),
        phase: "OUTCOME",
        tool: approval.toolName,
        decision: "DENY",
        reasonCode: "APPROVAL_REJECTED",
        argsPreview: approval.args,
        outcome: "No records returned. No file created.",
      };
}
