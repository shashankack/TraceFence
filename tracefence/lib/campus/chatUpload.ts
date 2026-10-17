import { randomUUID } from "crypto";
import { getDb } from "../db/client";
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
}): ChatUploadRow {
  const { sanitized, flags, status } = sanitizeChatUpload(input.rawText);
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

  return getChatUpload(input.sessionId, input.tenantId, input.userId, id)!;
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
      error: "Upload blocked after sanitize — content never enters model context",
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
