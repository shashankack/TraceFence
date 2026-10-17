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
    this.name = "ApiError";
  }
}

/** Demo logins seeded by DEMO_MODE — maps Console role picker → Bearer user. */
const DEMO_USERS: Record<Role, { email: string; password: string }> = {
  student: { email: "student@nulltrace.demo", password: "demo1234" },
  faculty: { email: "faculty@nulltrace.demo", password: "demo1234" },
  admin: { email: "admin@nulltrace.demo", password: "demo1234" },
};

let authToken: string | null = null;

export function getAuthToken() {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  try {
    res = await fetch(path, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Gateway unreachable");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error ?? res.statusText,
      body?.reasonCode,
    );
  }
  return body as T;
}

async function ensureAuth(role: Role): Promise<void> {
  const creds = DEMO_USERS[role];
  const login = await request<{
    token: string;
    role: Role;
    tenantId: string;
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(creds),
  });
  authToken = login.token;
}

export const api = {
  /** Login as demo user for role, then open a chat session (identity from Bearer). */
  createSession: async (role: Role) => {
    await ensureAuth(role);
    return request<SessionDTO>("/api/sessions", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  sendMessage: (sessionId: string, message: string) =>
    request<MessageResponseDTO>(`/api/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  sessionEvents: (sessionId: string) =>
    request<{ events: EventDTO[] }>(
      `/api/sessions/${sessionId}/events`,
    ).then((r) => r.events),

  approvals: (sessionId?: string) =>
    request<{ approvals: ApprovalDTO[] }>(
      sessionId
        ? `/api/approvals?sessionId=${encodeURIComponent(sessionId)}`
        : "/api/approvals",
    ).then((r) => r.approvals),

  decideApproval: (id: string, decision: "APPROVE" | "REJECT") =>
    request<{ id: string; status: string; executed?: boolean }>(
      `/api/approvals/${id}/decision`,
      {
        method: "POST",
        body: JSON.stringify({ decision }),
      },
    ),

  audit: () => request<AuditDTO>("/api/audit"),

  orgDocuments: async () => {
    await ensureAuth("admin");
    const r = await request<{
      documents: OrgDocumentDTO[];
      policyVersion?: number;
    }>("/api/org/documents");
    return r.documents;
  },

  createOrgDocument: async (doc: {
    title: string;
    classification: Classification;
    content: string;
  }) => {
    await ensureAuth("admin");
    const r = await request<{ document: OrgDocumentDTO }>(
      "/api/org/documents",
      {
        method: "POST",
        body: JSON.stringify({
          ...doc,
          collection: doc.classification,
        }),
      },
    );
    return r.document;
  },

  updateOrgDocument: async (
    id: string,
    patch: Partial<Pick<OrgDocumentDTO, "classification" | "enabled">>,
  ) => {
    await ensureAuth("admin");
    const r = await request<{ document: OrgDocumentDTO }>(
      `/api/org/documents/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      },
    );
    return r.document;
  },

  orgPolicy: async () => {
    await ensureAuth("admin");
    return request<OrgPolicyDTO>("/api/org/policy");
  },

  publishOrgPolicy: async (policy: OrgPolicyDTO) => {
    await ensureAuth("admin");
    return request<OrgPolicyDTO>("/api/org/policy", {
      method: "PUT",
      body: JSON.stringify({ roles: policy.roles }),
    });
  },
};
