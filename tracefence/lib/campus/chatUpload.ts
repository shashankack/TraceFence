import { randomUUID } from "crypto";
import { getDb } from "../db/client";
import { ReasonCode } from "../security/reasonCodes";
import {
  sanitizeChatUpload,
  type ContentScanHit,
} from "./contentGuards";

export type ChatUploadStatus = "ready" | "flagged" | "blocked";

export type ChatUploadRow = {
  id: string;
  sessionId: string;
  tenantId: string;
  userId: string;
  filename: string;
  status: ChatUploadStatus;
  flags: ContentScanHit[];
  sanitized: string;
  rawExcerpt: string;
  createdAt: string;
};

const ALLOWED_EXT = new Set([".txt", ".md", ".csv", ".pdf"]);

/** Gateway timeline row for upload sanitize (chat panel ↔ admin audit). */
export type UploadSanitizeEvent = {
  id: string;
  sessionId: string;
  ts: string;
  phase: "SOURCE";
  tool: "policy_guard" | "use_chat_upload";
  argsPreview: Record<string, unknown>;
  decision: "ALLOW" | "DENY";
  reasonCode: string;
  outcome: string;
};

export function isAllowedUploadFilename(filename: string): boolean {
  const lower = filename.toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot < 0) return false;
  return ALLOWED_EXT.has(lower.slice(dot));
}

export function createChatUpload(input: {
  sessionId: string;
  tenantId: string;
  userId: string;
  filename: string;
  rawText: string;
  /** Extra flags from PDF byte scans (invisible watermarks, etc.). */
  extraFlags?: ContentScanHit[];
}): { upload: ChatUploadRow; event: UploadSanitizeEvent | null } {
  const { sanitized, flags, status } = sanitizeChatUpload(
    input.rawText,
    input.extraFlags ?? [],
  );
  const id = `upl_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const now = new Date().toISOString();
  const excerpt = input.rawText.replace(/\s+/g, " ").trim().slice(0, 240);

  getDb()
    .prepare(
      `INSERT INTO session_attachments
       (id, session_id, tenant_id, user_id, filename, status, flags_json,
        sanitized_text, raw_excerpt, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.sessionId,
      input.tenantId,
      input.userId,
      input.filename.slice(0, 200),
      status,
      JSON.stringify(flags),
      sanitized,
      excerpt,
      now,
    );

  const upload = getChatUpload(input.sessionId, input.tenantId, input.userId, id)!;
  // Audit immediately on ingest so admin evidence reflects flags before a chat turn.
  const event = recordUploadSanitizeEvent(upload);
  return { upload, event };
}

export function recordUploadSanitizeEvent(
  upload: ChatUploadRow,
): UploadSanitizeEvent | null {
  if (upload.status === "ready" && upload.flags.length === 0) return null;

  const decision = upload.status === "blocked" ? "DENY" : "ALLOW";
  const reasonCode =
    upload.status === "blocked"
      ? ReasonCode.UPLOAD_BLOCKED
      : ReasonCode.INJECTION_IGNORED;
  const event: UploadSanitizeEvent = {
    id: randomUUID(),
    sessionId: upload.sessionId,
    ts: new Date().toISOString(),
    phase: "SOURCE",
    tool: upload.status === "blocked" ? "use_chat_upload" : "policy_guard",
    argsPreview: {
      kind: "chat_upload_sanitize",
      upload_id: upload.id,
      filename: upload.filename,
      status: upload.status,
      flags: upload.flags.map((f) => f.kind),
      excerpt: upload.flags[0]?.excerpt ?? upload.rawExcerpt.slice(0, 120),
    },
    decision,
    reasonCode,
    outcome:
      upload.status === "blocked"
        ? `Upload blocked after sanitize (${upload.filename}); content never enters model context.`
        : `Upload sanitized and flagged (${upload.filename}); attack patterns stripped before any tool use.`,
  };

  getDb()
    .prepare(
      `INSERT INTO session_events
       (id, session_id, ts, phase, tool, args_preview_json, decision, reason_code, outcome, doc_ids_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      event.id,
      event.sessionId,
      event.ts,
      event.phase,
      event.tool,
      JSON.stringify(event.argsPreview),
      event.decision,
      event.reasonCode,
      event.outcome,
      null,
    );

  return event;
}

export function getChatUpload(
  sessionId: string,
  tenantId: string,
  userId: string,
  id: string,
): ChatUploadRow | null {
  const row = getDb()
    .prepare(
      `SELECT id, session_id as sessionId, tenant_id as tenantId, user_id as userId,
              filename, status, flags_json as flagsJson, sanitized_text as sanitized,
              raw_excerpt as rawExcerpt, created_at as createdAt
       FROM session_attachments
       WHERE id = ? AND session_id = ? AND tenant_id = ? AND user_id = ?`,
    )
    .get(id, sessionId, tenantId, userId) as
    | {
        id: string;
        sessionId: string;
        tenantId: string;
        userId: string;
        filename: string;
        status: string;
        flagsJson: string;
        sanitized: string;
        rawExcerpt: string;
        createdAt: string;
      }
    | undefined;

  if (!row) return null;
  return {
    id: row.id,
    sessionId: row.sessionId,
    tenantId: row.tenantId,
    userId: row.userId,
    filename: row.filename,
    status: row.status as ChatUploadStatus,
    flags: JSON.parse(row.flagsJson) as ContentScanHit[],
    sanitized: row.sanitized,
    rawExcerpt: row.rawExcerpt,
    createdAt: row.createdAt,
  };
}

/** Gateway executor: only sanitized text; blocked uploads never leave this boundary. */
export function readSanitizedChatUpload(input: {
  sessionId: string;
  tenantId: string;
  userId: string;
  uploadId: string;
}):
  | {
      ok: true;
      uploadId: string;
      filename: string;
      status: ChatUploadStatus;
      flags: ContentScanHit[];
      content: string;
    }
  | { ok: false; error: string; status?: ChatUploadStatus; flags?: ContentScanHit[] } {
  const upload = getChatUpload(
    input.sessionId,
    input.tenantId,
    input.userId,
    input.uploadId,
  );
  if (!upload) return { ok: false, error: "Upload not found for this session" };
  if (upload.status === "blocked" || !upload.sanitized.trim()) {
    return {
      ok: false,
      error: "Upload blocked after sanitize   content never enters model context",
      status: upload.status,
      flags: upload.flags,
    };
  }
  return {
    ok: true,
    uploadId: upload.id,
    filename: upload.filename,
    status: upload.status,
    flags: upload.flags,
    content: upload.sanitized,
  };
}
