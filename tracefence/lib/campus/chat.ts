import { randomUUID } from "crypto";
import { getDb } from "../db/client";
import { loadCampusPolicy } from "./policy";
import { invoke } from "../security/gateway";
import { createPendingApproval } from "../security/approvalService";
import { getCampusExecutor } from "../tools/registry";
import type { CampusRole, Decision } from "../security/types";
import { llmConfig } from "../env";
import type { RetrievalResult } from "./retrieval";

export interface ChatEvent {
  id: string;
  tool?: string;
  decision?: Decision;
  reasonCode?: string;
  argsPreview?: Record<string, unknown>;
  outcome?: string;
  phase?: string;
}

export interface ChatTurnResult {
  assistantMessage: string;
  citations: Array<{ docId: string; classification: string }>;
  events: ChatEvent[];
  pendingApprovalId?: string;
}

function wantsExport(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("export") ||
    (m.includes("email") && (m.includes("all") || m.includes("list") || m.includes("dump"))) ||
    m.includes("directory dump") ||
    m.includes("download student")
  );
}

function scriptedAnswer(
  message: string,
  retrieval: RetrievalResult | undefined,
): string {
  const m = message.toLowerCase();
  if (retrieval?.hits.length) {
    const top = retrieval.hits[0];
    if (m.includes("curfew") || m.includes("hostel")) {
      const line = top.content
        .split("\n")
        .map((l) => l.trim())
        .find((l) => /curfew|weekday|weekend/i.test(l) && !l.startsWith("#"));
      if (line) {
        return `${line} (Source: ${top.title})`;
      }
    }
    const firstUseful = top.content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && !l.toLowerCase().startsWith("classification"))
      .slice(0, 3)
      .join(" ");
    if (firstUseful) {
      return `${firstUseful} (Source: ${top.title})`;
    }
  }

  if (m.includes("grade") || m.includes("directory") || m.includes("peer")) {
    return "I cannot provide confidential student records for your role. Unauthorized sources were not loaded into context.";
  }

  return "I could not find an allowed campus document for that question. Try asking about hostel curfew, library hours, or exam rules.";
}

async function tryOllama(
  message: string,
  context: string,
): Promise<string | null> {
  const { baseUrl, model } = llmConfig();
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          {
            role: "system",
            content:
              "You are TraceFence campus assistant. Answer ONLY from the allowed context. If context is empty, say you lack permitted sources. Never invent confidential data.",
          },
          {
            role: "user",
            content: `Allowed context:\n${context || "(none)"}\n\nQuestion: ${message}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      message?: { content?: string };
    };
    return data.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

function insertEvent(
  sessionId: string,
  event: ChatEvent & { phase?: string; docIds?: string[] },
) {
  const db = getDb();
  db.prepare(
    `INSERT INTO session_events
     (id, session_id, ts, phase, tool, args_preview_json, decision, reason_code, outcome, doc_ids_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    event.id,
    sessionId,
    new Date().toISOString(),
    event.phase ?? "DECISION",
    event.tool ?? null,
    event.argsPreview ? JSON.stringify(event.argsPreview) : null,
    event.decision ?? null,
    event.reasonCode ?? null,
    event.outcome ?? null,
    event.docIds ? JSON.stringify(event.docIds) : null,
  );
}

export async function handleChatTurn(input: {
  sessionId: string;
  userId: string;
  role: CampusRole;
  message: string;
}): Promise<ChatTurnResult> {
  const policy = loadCampusPolicy();
  const events: ChatEvent[] = [];
  const citations: Array<{ docId: string; classification: string }> = [];
  let pendingApprovalId: string | undefined;
  let retrieval: RetrievalResult | undefined;

  const executor = getCampusExecutor(input.role);
  const baseAuth = {
    userId: input.userId,
    taskId: input.sessionId,
    role: input.role,
    policyVersion: policy.policyVersion,
    now: new Date(),
  };

  // Always attempt filtered search for grounding (unless pure export ask).
  if (!wantsExport(input.message) || input.message.length > 20) {
    const searchArgs = { query: input.message };
    const { authz, result } = await invoke(
      { ...baseAuth, tool: "search_docs", args: searchArgs },
      [],
      executor,
    );
    const ev: ChatEvent = {
      id: randomUUID(),
      tool: "search_docs",
      decision: authz.decision,
      reasonCode: authz.reasonCode,
      argsPreview: searchArgs,
      outcome: authz.message,
      phase: "DECISION",
    };
    events.push(ev);
    insertEvent(input.sessionId, {
      ...ev,
      docIds:
        result && typeof result === "object" && "hits" in result
          ? (result as RetrievalResult).hits.map((h) => h.docId)
          : undefined,
    });

    if (authz.decision === "ALLOW" && result) {
      retrieval = result as RetrievalResult;
      for (const h of retrieval.hits) {
        citations.push({
          docId: h.docId,
          classification: h.classification,
        });
      }
      if (retrieval.filteredOut.length) {
        const filterEv: ChatEvent = {
          id: randomUUID(),
          tool: "search_docs",
          decision: "ALLOW",
          reasonCode: "RETRIEVAL_FILTERED",
          argsPreview: { filteredOut: retrieval.filteredOut },
          outcome: `ACL excluded ${retrieval.filteredOut.length} document(s) from context`,
          phase: "SOURCE",
        };
        events.push(filterEv);
        insertEvent(input.sessionId, filterEv);
      }
    }
  }

  if (wantsExport(input.message)) {
    const exportArgs = {
      dataset: "student_emails",
      format: "csv" as const,
    };
    const { authz, result } = await invoke(
      { ...baseAuth, tool: "export_records", args: exportArgs },
      [],
      executor,
    );

    if (authz.decision === "REQUIRE_APPROVAL") {
      const approvalId = randomUUID();
      const pending = createPendingApproval({
        id: approvalId,
        taskId: input.sessionId,
        userId: input.userId,
        toolName: "export_records",
        args: exportArgs,
        policyVersion: policy.policyVersion,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
      getDb()
        .prepare(
          `INSERT INTO approvals
           (id, task_id, user_id, tool_name, args_json, canonical_args_hash,
            policy_version, status, expires_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          pending.id,
          pending.taskId,
          pending.userId,
          pending.toolName,
          JSON.stringify(pending.args),
          pending.canonicalArgsHash,
          pending.policyVersion,
          pending.status,
          pending.expiresAt,
          new Date().toISOString(),
        );
      pendingApprovalId = approvalId;
    }

    const ev: ChatEvent = {
      id: randomUUID(),
      tool: "export_records",
      decision: authz.decision,
      reasonCode: authz.reasonCode,
      argsPreview: exportArgs,
      outcome:
        authz.decision === "ALLOW"
          ? JSON.stringify(result)
          : authz.message,
      phase: "DECISION",
    };
    events.push(ev);
    insertEvent(input.sessionId, ev);

    if (authz.decision === "DENY") {
      const assistantMessage =
        "Export denied for your role. This decision was enforced by the TraceFence gateway, not by the model.";
      persistMessages(input.sessionId, input.message, assistantMessage, citations);
      return { assistantMessage, citations, events, pendingApprovalId };
    }
    if (authz.decision === "REQUIRE_APPROVAL") {
      const assistantMessage =
        "Export requires a one-time human approval for this exact action. Approve it in the approvals panel, then retry.";
      persistMessages(input.sessionId, input.message, assistantMessage, citations);
      return { assistantMessage, citations, events, pendingApprovalId };
    }
    if (authz.decision === "ALLOW") {
      const assistantMessage =
        "Export completed (synthetic demo data only). See the decision rail for details.";
      persistMessages(input.sessionId, input.message, assistantMessage, citations);
      return { assistantMessage, citations, events, pendingApprovalId };
    }
  }

  const context = (retrieval?.hits ?? [])
    .map((h) => `### ${h.title} (${h.classification})\n${h.content}`)
    .join("\n\n");

  const llmAnswer = await tryOllama(input.message, context);
  const assistantMessage = llmAnswer ?? scriptedAnswer(input.message, retrieval);

  persistMessages(input.sessionId, input.message, assistantMessage, citations);
  return { assistantMessage, citations, events, pendingApprovalId };
}

function persistMessages(
  sessionId: string,
  userMessage: string,
  assistantMessage: string,
  citations: Array<{ docId: string; classification: string }>,
) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO session_messages (id, session_id, role, content, citations_json, created_at)
     VALUES (?, ?, 'user', ?, NULL, ?)`,
  ).run(randomUUID(), sessionId, userMessage, now);
  db.prepare(
    `INSERT INTO session_messages (id, session_id, role, content, citations_json, created_at)
     VALUES (?, ?, 'assistant', ?, ?, ?)`,
  ).run(randomUUID(), sessionId, assistantMessage, JSON.stringify(citations), now);
}
