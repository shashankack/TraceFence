import type {
  ApprovalDTO,
  AuditDTO,
  Classification,
  EventDTO,
  MessageResponseDTO,
  OrgDocumentDTO,
  OrgPolicyDTO,
  Role,
  SessionDTO,
} from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public reasonCode?: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Gateway unreachable");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? res.statusText, body?.reasonCode);
  }
  return body as T;
}

export const api = {
  createSession: (role: Role) =>
    request<SessionDTO>("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ role }),
    }),

  sendMessage: (sessionId: string, message: string) =>
    request<MessageResponseDTO>(`/api/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  sessionEvents: (sessionId: string) =>
    request<{ events: EventDTO[] }>(`/api/sessions/${sessionId}/events`).then((r) => r.events),

  approvals: (sessionId?: string) =>
    request<{ approvals: ApprovalDTO[] }>(
      sessionId ? `/api/approvals?sessionId=${encodeURIComponent(sessionId)}` : "/api/approvals",
    ).then((r) => r.approvals),

  decideApproval: (id: string, decision: "APPROVE" | "REJECT") =>
    request<{ id: string; status: string }>(`/api/approvals/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    }),

  audit: () => request<AuditDTO>("/api/audit"),

  orgDocuments: () =>
    request<{ documents: OrgDocumentDTO[] }>("/api/org/documents").then((r) => r.documents),

  createOrgDocument: (doc: { title: string; classification: Classification; content: string }) =>
    request<OrgDocumentDTO>("/api/org/documents", {
      method: "POST",
      body: JSON.stringify({ ...doc, collection: doc.classification }),
    }),

  updateOrgDocument: (id: string, patch: Partial<Pick<OrgDocumentDTO, "classification" | "enabled">>) =>
    request<OrgDocumentDTO>(`/api/org/documents/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  orgPolicy: () => request<OrgPolicyDTO>("/api/org/policy"),

  publishOrgPolicy: (policy: OrgPolicyDTO) =>
    request<OrgPolicyDTO>("/api/org/policy", {
      method: "PUT",
      body: JSON.stringify(policy),
    }),
};
