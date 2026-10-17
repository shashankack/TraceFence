/**
 * HTTP DTOs as described in docs/contracts.md.
 * The browser only ever talks to these endpoints; it never invokes tools or retrieval.
 */

export type Decision = "ALLOW" | "DENY" | "REQUIRE_APPROVAL";
/** Builtin or org-defined gateway role id. */
export type Role = string;
export type BuiltinRole = "guest" | "student" | "faculty" | "admin";
export type OrgType = "college" | "small_business";
export type Classification = "public" | "internal" | "confidential";
export type Phase = "SOURCE" | "PROPOSAL" | "DECISION" | "OUTCOME";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CONSUMED";

export type CustomOrgRole = {
  id: string;
  label: string;
  workspace: "student" | "faculty";
};

/** Default builtin roles shown in policy matrix (guest is system-only). */
export const ROLES: BuiltinRole[] = ["student", "faculty", "admin"];
export const CLASSIFICATIONS: Classification[] = ["public", "internal", "confidential"];
export const TOOLS = [
  "search_docs",
  "read_document",
  "export_records",
  "post_announcement",
  "notify_external",
  "use_chat_upload",
] as const;
export type ToolName = (typeof TOOLS)[number];

export interface AuthTokenDTO {
  token: string;
  expiresAt?: string;
  userId: string;
  tenantId: string;
  role: Role;
}

export type RoleLabels = Partial<Record<string, string>>;

export interface AuthMeDTO {
  userId: string;
  email: string;
  displayName?: string | null;
  tenantId: string;
  tenantName?: string | null;
  orgType?: OrgType;
  /** Admin-defined display names for gateway roles. */
  roleLabels?: RoleLabels;
  /** Org-defined roles beyond the four builtins. */
  customRoles?: CustomOrgRole[];
  role: Role;
  memberships: Array<{ tenantId: string; tenantName: string; role: Role }>;
}

export interface OrgProfileDTO {
  id: string;
  name: string;
  orgType: OrgType;
  notifyEmail: string | null;
  profile: {
    website?: string;
    city?: string;
    sizeBand?: string;
    roleLabels?: RoleLabels;
    customRoles?: CustomOrgRole[];
  };
  createdAt: string;
}

export interface OrgMemberDTO {
  userId: string;
  email: string;
  displayName: string | null;
  role: Role;
}

export interface NotificationDTO {
  id: string;
  to: string;
  subject: string;
  body: string;
  kind: string | null;
  taskId: string | null;
  createdAt: string;
}

export interface SessionDTO {
  sessionId: string;
  tenantId: string;
  userId: string;
  role: Role;
  policyVersion?: number;
}

export interface CitationDTO {
  docId: string;
  classification: Classification | string;
}

export interface EventDTO {
  id: string;
  sessionId?: string;
  ts?: string;
  phase?: Phase | string | null;
  tool?: string | null;
  argsPreview?: Record<string, unknown> | null;
  decision?: Decision | null;
  reasonCode?: string | null;
  outcome?: string | null;
  docIds?: string[] | null;
}

export interface MessageResponseDTO {
  assistantMessage: string;
  citations: CitationDTO[];
  events: EventDTO[];
  pendingApprovalId?: string;
  /** Guest asked for non-public / privileged action  open login. */
  authRequired?: boolean;
}

export interface ApprovalDTO {
  id: string;
  sessionId: string;
  userId: string;
  toolName: string;
  args: Record<string, unknown>;
  canonicalArgsHash: string;
  policyVersion: number;
  status: ApprovalStatus;
  expiresAt: string;
  approvedBy?: string | null;
  consumedAt?: string | null;
  createdAt: string;
}

export interface AuditDTO {
  sessions: number;
  sessionDecisions: Array<{ decision: Decision; count: number }>;
  pendingApprovals: number;
  note?: string;
}

export interface OrgDocumentDTO {
  id: string;
  title: string;
  classification: Classification;
  collection: string;
  enabled: boolean;
  updatedAt?: string;
}

export interface OrgPolicyDTO {
  policyVersion: number;
  roles: Record<string, { collections: string[]; tools: Record<string, Decision> }>;
}
