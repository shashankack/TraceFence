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

/**
 * One Bearer token per demo role. Console calls use the role that opened the chat session;
 * Org calls use the admin token without hijacking the Console identity (a shared token made
 * student sessions 403 after visiting Org).
 */
const tokens: Partial<Record<Role, string>> = {};
let consoleRole: Role = "student";

export function getAuthToken(role: Role = consoleRole) {
  return tokens[role] ?? null;
}

export function clearAuthToken() {
  for (const r of Object.keys(tokens) as Role[]) delete tokens[r];
}

async function request<T>(path: string, init?: RequestInit, as: Role = consoleRole): Promise<T> {
  let res: Response;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  const token = tokens[as];
  if (token) headers.Authorization = `Bearer ${token}`;

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

async function ensureAuth(role: Role, fresh = false): Promise<void> {
  if (tokens[role] && !fresh) return;
  const creds = DEMO_USERS[role];
  const login = await request<{
    token: string;
    role: Role;
    tenantId: string;
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(creds),
  });
  tokens[role] = login.token;
}

/** Admin-scoped call; retries once with a fresh login if the cached token was rejected. */
async function asAdmin<T>(path: string, init?: RequestInit): Promise<T> {
  await ensureAuth("admin");
  try {
    return await request<T>(path, init, "admin");
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 401)) throw err;
    await ensureAuth("admin", true);
    return request<T>(path, init, "admin");
  }
}

export const api = {
  /** Login as demo user for role, then open a chat session (identity from Bearer). */
  createSession: async (role: Role) => {
    consoleRole = role;
    await ensureAuth(role, true);
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

  orgDocuments: async () =>
    (
      await asAdmin<{ documents: OrgDocumentDTO[]; policyVersion?: number }>(
        "/api/org/documents",
      )
    ).documents,

  createOrgDocument: async (doc: {
    title: string;
    classification: Classification;
    content: string;
  }) => {
    const r = await asAdmin<{ document: OrgDocumentDTO }>("/api/org/documents", {
      method: "POST",
      body: JSON.stringify({
        ...doc,
        collection: doc.classification,
      }),
    });
    return r.document;
  },

  updateOrgDocument: async (
    id: string,
    patch: Partial<Pick<OrgDocumentDTO, "classification" | "enabled">>,
  ) => {
    const r = await asAdmin<{ document: OrgDocumentDTO }>(
      `/api/org/documents/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      },
    );
    return r.document;
  },

  orgPolicy: () => asAdmin<OrgPolicyDTO>("/api/org/policy"),

  publishOrgPolicy: (policy: OrgPolicyDTO) =>
    asAdmin<OrgPolicyDTO>("/api/org/policy", {
      method: "PUT",
      body: JSON.stringify({ roles: policy.roles }),
    }),
};
