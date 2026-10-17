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

export interface AuthUser {
  token: string;
  userId: string;
  email: string;
  displayName: string;
  tenantId: string;
  role: Role;
}

let auth: AuthUser | null = null;

export function getAuth(): AuthUser | null {
  return auth;
}

export function clearAuthToken() {
  auth = null;
}

async function request<T>(path: string, init?: RequestInit, token?: string | null): Promise<T> {
  let res: Response;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  const bearer = token === undefined ? auth?.token : token;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

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

async function asAdmin<T>(path: string, init?: RequestInit): Promise<T> {
  if (auth?.role === "admin" && auth.token) {
    try {
      return await request<T>(path, init);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) throw err;
    }
  }
  // Org console needs an admin membership — login demo admin without wiping guest chat identity until caller replaces auth.
  const adminLogin = await request<{
    token: string;
    userId: string;
    tenantId: string;
    role: Role;
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "admin@nulltrace.demo",
      password: "demo1234",
    }),
  }, null);
  return request<T>(path, init, adminLogin.token);
}

export const api = {
  /** Anonymous public session (no password). */
  startGuest: async () => {
    const guest = await request<{
      token: string;
      userId: string;
      tenantId: string;
      role: Role;
      displayName: string;
      email: string;
    }>("/api/auth/guest", { method: "POST" }, null);
    auth = {
      token: guest.token,
      userId: guest.userId,
      email: guest.email,
      displayName: guest.displayName,
      tenantId: guest.tenantId,
      role: guest.role,
    };
    return request<SessionDTO>("/api/sessions", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  login: async (email: string, password: string) => {
    const result = await request<{
      token: string;
      userId: string;
      tenantId: string;
      role: Role;
      memberships?: Array<{ tenantId: string; role: Role; tenantName?: string }>;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, null);

    // Prefer display from /me when available
    auth = {
      token: result.token,
      userId: result.userId,
      email: email.trim().toLowerCase(),
      displayName: email.split("@")[0],
      tenantId: result.tenantId,
      role: result.role,
    };
    try {
      const me = await request<{
        email: string;
        displayName: string;
        role: Role;
        tenantId: string;
        userId: string;
      }>("/api/auth/me");
      auth = {
        token: result.token,
        userId: me.userId,
        email: me.email,
        displayName: me.displayName,
        tenantId: me.tenantId,
        role: me.role,
      };
    } catch {
      /* keep login payload */
    }

    return request<SessionDTO>("/api/sessions", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  logout: async () => {
    if (auth?.token) {
      try {
        await request("/api/auth/logout", { method: "POST" });
      } catch {
        /* ignore */
      }
    }
    auth = null;
  },

  /** @deprecated Prefer startGuest / login */
  createSession: async (role: Role) => {
    if (role === "guest") return api.startGuest();
    const hint = DEMO_LOGIN_HINTS.find((h) => h.role === role);
    if (!hint) throw new ApiError(400, "Unknown role");
    return api.login(hint.email, hint.password);
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
