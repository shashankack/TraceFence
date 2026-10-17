import type {
  ApprovalDTO,
  AuditDTO,
  AuthMeDTO,
  AuthTokenDTO,
  Classification,
  CitationDTO,
  EventDTO,
  MessageResponseDTO,
  NotificationDTO,
  OrgDocumentDTO,
  OrgPolicyDTO,
  OrgProfileDTO,
  OrgType,
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
    this.name = "ApiError";
  }
}

/** Seeded DEMO_MODE accounts (password demo1234). */
export const DEMO_LOGIN_HINTS: Array<{
  email: string;
  password: string;
  role: Exclude<Role, "guest">;
  label: string;
}> = [
  { email: "student@nulltrace.demo", password: "demo1234", role: "student", label: "Student" },
  { email: "faculty@nulltrace.demo", password: "demo1234", role: "faculty", label: "Faculty" },
  { email: "admin@nulltrace.demo", password: "demo1234", role: "admin", label: "Admin" },
  { email: "alex@nulltrace.demo", password: "demo1234", role: "student", label: "Alex (student)" },
  { email: "jordan@nulltrace.demo", password: "demo1234", role: "faculty", label: "Jordan (faculty)" },
  { email: "sam@nulltrace.demo", password: "demo1234", role: "admin", label: "Sam (admin)" },
];

/**
 * Bearer token for the signed-in user (including guest). Kept in sessionStorage so a reload
 * keeps this tab signed in; the server remains the authority on identity and role.
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
    /* storage unavailable  token stays in memory only */
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

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });

export const api = {
  login: (email: string, password: string) =>
    post<AuthTokenDTO>("/api/auth/login", { email, password }),
  signup: (input: {
    email: string;
    password: string;
    displayName?: string;
    tenantName?: string;
    orgType?: OrgType;
    notifyEmail?: string;
  }) => post<AuthTokenDTO>("/api/auth/signup", input),
  /** Anonymous public principal  no password; public corpus only. */
  guest: () => post<AuthTokenDTO>("/api/auth/guest"),
  me: () => request<AuthMeDTO>("/api/auth/me"),
  logout: () => post<{ ok: true }>("/api/auth/logout"),
  switchTenant: (tenantId: string) =>
    post<AuthTokenDTO>("/api/auth/switch-tenant", { tenantId }),

  createSession: () => post<SessionDTO>("/api/sessions"),
  deleteSession: (sessionId: string) =>
    request<{ ok: true; sessionId: string }>(
      `/api/sessions/${encodeURIComponent(sessionId)}`,
      { method: "DELETE" },
    ),
  listSessions: () =>
    request<{
      sessions: Array<{
        sessionId: string;
        tenantId: string;
        userId: string;
        role: string;
        policyVersion: number;
        createdAt: string;
        title: string;
      }>;
    }>("/api/sessions").then((r) => r.sessions),
  sendMessage: (
    sessionId: string,
    message: string,
    opts?: { attachmentIds?: string[] },
  ) =>
    post<MessageResponseDTO>(`/api/sessions/${sessionId}/messages`, {
      message,
      ...(opts?.attachmentIds?.length
        ? { attachmentIds: opts.attachmentIds }
        : {}),
    }),
  uploadSessionAttachment: (
    sessionId: string,
    input: { filename: string; content?: string; pdfBase64?: string },
  ) =>
    post<{
      upload: {
        id: string;
        filename: string;
        status: "ready" | "flagged" | "blocked";
        flags: Array<{ kind: string; excerpt: string }>;
        preview: string;
        createdAt: string;
      };
      event?: EventDTO | null;
      notice: string;
    }>(`/api/sessions/${sessionId}/attachments`, input),
  sessionMessages: (sessionId: string) =>
    request<{
      session: SessionDTO;
      messages: Array<{
        id: string;
        role: string;
        content: string;
        citations?: CitationDTO[];
        attachments?: Array<{
          id: string;
          filename: string;
          status: string;
        }>;
        createdAt: string;
      }>;
    }>(`/api/sessions/${sessionId}/messages`),
  sessionEvents: (sessionId: string) =>
    request<{ events: EventDTO[] }>(`/api/sessions/${sessionId}/events`).then(
      (r) => r.events,
    ),

  approvals: (sessionId?: string) =>
    request<{ approvals: ApprovalDTO[] }>(
      sessionId
        ? `/api/approvals?sessionId=${encodeURIComponent(sessionId)}`
        : "/api/approvals",
    ).then((r) => r.approvals),
  decideApproval: (id: string, decision: "APPROVE" | "REJECT") =>
    post<{ id: string; status: string; executed?: boolean }>(
      `/api/approvals/${id}/decision`,
      { decision },
    ),

  audit: () => request<AuditDTO>("/api/audit"),
  /** Tenant-wide session evidence for admin audit (paginated by session). */
  auditEvidence: (opts?: { page?: number; pageSize?: number }) => {
    const page = opts?.page ?? 1;
    const pageSize = opts?.pageSize ?? 10;
    const q = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return request<{
      tenantId: string;
      page: number;
      pageSize: number;
      totalSessions: number;
      totalPages: number;
      sessions: Array<{
        sessionId: string;
        role: Role;
        userId: string;
        events: EventDTO[];
      }>;
    }>(`/api/audit/evidence?${q}`);
  },

  orgDocuments: () =>
    request<{ documents: OrgDocumentDTO[]; policyVersion?: number }>(
      "/api/org/documents",
    ).then((r) => r.documents),
  createOrgDocument: (doc: {
    title: string;
    classification: Classification;
    content?: string;
    pdfBase64?: string;
  }) =>
    post<{ document: OrgDocumentDTO }>("/api/org/documents", {
      ...doc,
      collection: doc.classification,
    }).then((r) => r.document),
  suggestOrgDocumentTitle: (input: {
    content?: string;
    pdfBase64?: string;
    fileName?: string;
  }) =>
    post<{ title: string; preview: string }>(
      "/api/org/documents/suggest-title",
      input,
    ),
  updateOrgDocument: (
    id: string,
    patch: Partial<Pick<OrgDocumentDTO, "classification" | "enabled">>,
  ) =>
    request<{ document: OrgDocumentDTO }>(
      `/api/org/documents/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      },
    ).then((r) => r.document),
  orgPolicy: () => request<OrgPolicyDTO>("/api/org/policy"),
  publishOrgPolicy: (policy: OrgPolicyDTO) =>
    request<OrgPolicyDTO>("/api/org/policy", {
      method: "PUT",
      body: JSON.stringify({ roles: policy.roles }),
    }),
  orgProfile: () => request<OrgProfileDTO>("/api/org/profile"),
  updateOrgProfile: (patch: {
    name?: string;
    notifyEmail?: string | null;
    orgType?: OrgType;
    profile?: OrgProfileDTO["profile"];
  }) =>
    request<OrgProfileDTO>("/api/org/profile", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  createOrgRole: (input: {
    label: string;
    workspace?: "student" | "faculty";
    id?: string;
  }) =>
    request<{ role: import("./types").CustomOrgRole }>("/api/org/roles", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  deleteOrgRole: (id: string) =>
    request<{ ok: true }>(`/api/org/roles?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  orgMembers: () =>
    request<{
      members: import("./types").OrgMemberDTO[];
      assignableRoles: string[];
    }>("/api/org/members"),
  setOrgMemberRole: (userId: string, role: string) =>
    request<{ ok: true }>("/api/org/members", {
      method: "PATCH",
      body: JSON.stringify({ userId, role }),
    }),
  orgNotifications: (limit = 30) =>
    request<{
      tenantId: string;
      notifications: NotificationDTO[];
    }>(`/api/org/notifications?limit=${limit}`),
};
