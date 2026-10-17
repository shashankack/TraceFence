import type {
  ApprovalDTO,
  AuditDTO,
  AuthMeDTO,
  AuthTokenDTO,
  Classification,
  EventDTO,
  MessageResponseDTO,
  OrgDocumentDTO,
  OrgPolicyDTO,
  SessionDTO,
} from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public reasonCode?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Bearer token for the signed-in user. Kept in sessionStorage so a reload keeps the user signed in
 * for this tab only; the server remains the authority on identity and role.
 */
const TOKEN_KEY = "tracefence.token";
let token: string | null = null;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function getToken() {
  if (token) return token;
  token = storage()?.getItem(TOKEN_KEY) ?? null;
  return token;
}

export function setToken(next: string | null) {
  token = next;
  try {
    if (next) storage()?.setItem(TOKEN_KEY, next);
    else storage()?.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable — token stays in memory only */
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;

  let res: Response;
  try {
    res = await fetch(path, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError(0, "Gateway unreachable");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.error ?? res.statusText, body?.reasonCode);
  return body as T;
}

const post = <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });

export const api = {
  login: (email: string, password: string) => post<AuthTokenDTO>("/api/auth/login", { email, password }),
  signup: (input: { email: string; password: string; displayName?: string; tenantName?: string }) =>
    post<AuthTokenDTO>("/api/auth/signup", input),
  me: () => request<AuthMeDTO>("/api/auth/me"),
  logout: () => post<{ ok: true }>("/api/auth/logout"),

  createSession: () => post<SessionDTO>("/api/sessions"),
  sendMessage: (sessionId: string, message: string) => post<MessageResponseDTO>(`/api/sessions/${sessionId}/messages`, { message }),
  sessionEvents: (sessionId: string) => request<{ events: EventDTO[] }>(`/api/sessions/${sessionId}/events`).then((r) => r.events),

  approvals: (sessionId?: string) =>
    request<{ approvals: ApprovalDTO[] }>(sessionId ? `/api/approvals?sessionId=${encodeURIComponent(sessionId)}` : "/api/approvals").then(
      (r) => r.approvals,
    ),
  decideApproval: (id: string, decision: "APPROVE" | "REJECT") =>
    post<{ id: string; status: string; executed?: boolean }>(`/api/approvals/${id}/decision`, { decision }),

  audit: () => request<AuditDTO>("/api/audit"),

  orgDocuments: () => request<{ documents: OrgDocumentDTO[]; policyVersion?: number }>("/api/org/documents").then((r) => r.documents),
  createOrgDocument: (doc: { title: string; classification: Classification; content: string }) =>
    post<{ document: OrgDocumentDTO }>("/api/org/documents", { ...doc, collection: doc.classification }).then((r) => r.document),
  updateOrgDocument: (id: string, patch: Partial<Pick<OrgDocumentDTO, "classification" | "enabled">>) =>
    request<{ document: OrgDocumentDTO }>(`/api/org/documents/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }).then((r) => r.document),
  orgPolicy: () => request<OrgPolicyDTO>("/api/org/policy"),
  publishOrgPolicy: (policy: OrgPolicyDTO) =>
    request<OrgPolicyDTO>("/api/org/policy", { method: "PUT", body: JSON.stringify({ roles: policy.roles }) }),
};
