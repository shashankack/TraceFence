"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/components/api/client";
import type {
  ApprovalDTO,
  AuditDTO,
  EventDTO,
  OrgDocumentDTO,
  OrgPolicyDTO,
  Role,
} from "@/components/api/types";
import {
  countsFromSessions,
  mergeEvidencePages,
  readLocalEvidence,
} from "@/components/workspace/localEvidence";

type Load<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
};

function usePolled<T>(
  fetcher: () => Promise<T>,
  intervalMs: number | null,
  deps: unknown[] = [],
  /** Keep last non-empty payload when a poll returns empty (Vercel instance hop). */
  holdNonEmpty?: (prev: T | null, next: T) => T,
): Load<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const holdRef = useRef(holdNonEmpty);
  holdRef.current = holdNonEmpty;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const run = () =>
      fetcher()
        .then((d) => {
          if (!alive) return;
          setData((prev) => (holdRef.current ? holdRef.current(prev, d) : d));
          setError(null);
        })
        .catch((e) => {
          if (!alive) return;
          // 403 while RoleGate redirects (e.g. non-admin) — don't spam the console UX.
          if (e instanceof ApiError && e.status === 403) {
            setError(null);
            setData(null);
            return;
          }
          setError(e instanceof ApiError ? e.message : "Request failed");
        })
        .finally(() => alive && setLoading(false));
    run();
    const t = intervalMs ? setInterval(run, intervalMs) : null;
    return () => {
      alive = false;
      if (t) clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, intervalMs, ...deps]);

  return { data, error, loading, reload };
}

export interface SessionEvidence {
  sessionId: string;
  role: Role;
  userId: string;
  events: EventDTO[];
}

export interface EvidencePage {
  sessions: SessionEvidence[];
  page: number;
  pageSize: number;
  totalSessions: number;
  totalPages: number;
}

function holdEvidence(prev: EvidencePage | null, next: EvidencePage): EvidencePage {
  if (
    prev &&
    prev.sessions.length > 0 &&
    next.sessions.length === 0 &&
    readLocalEvidence().length === 0
  ) {
    // Empty server hop with nothing local — keep last good snapshot.
    return prev;
  }
  return next;
}

/**
 * Tenant-wide gateway evidence for the admin audit console (server-paginated).
 * Merges same-browser local mirror by unique event id.
 */
export function useEvidence(
  opts: { page?: number; pageSize?: number; pollMs?: number | null } = {},
) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 10;
  const pollMs = opts.pollMs === undefined ? 8000 : opts.pollMs;

  return usePolled<EvidencePage>(
    () =>
      api.auditEvidence({ page, pageSize }).then((r) =>
        mergeEvidencePages(
          {
            sessions: r.sessions,
            page: r.page,
            pageSize: r.pageSize,
            totalSessions: r.totalSessions,
            totalPages: r.totalPages,
          },
          readLocalEvidence(),
        ),
      ),
    pollMs,
    [page, pageSize],
    holdEvidence,
  );
}

/**
 * Audit aggregates derived from the same evidence merge as the report —
 * ALLOW + DENY + REQUIRE_APPROVAL + sessions always match visible cases.
 */
export function useAudit() {
  return usePolled<AuditDTO>(
    async () => {
      const [server, evidence] = await Promise.all([
        api.audit(),
        api.auditEvidence({ page: 1, pageSize: 50 }),
      ]);
      const merged = mergeEvidencePages(
        {
          sessions: evidence.sessions,
          page: evidence.page,
          pageSize: evidence.pageSize,
          totalSessions: evidence.totalSessions,
          totalPages: evidence.totalPages,
        },
        readLocalEvidence(),
      );
      const derived = countsFromSessions(merged.sessions);
      return {
        sessions: derived.sessions,
        sessionDecisions: derived.sessionDecisions,
        pendingApprovals: server.pendingApprovals,
        note: server.note,
      };
    },
    8000,
    [],
    (prev, next) => {
      const prevDecisions =
        prev?.sessionDecisions?.reduce((n, r) => n + r.count, 0) ?? 0;
      const nextDecisions =
        next.sessionDecisions?.reduce((n, r) => n + r.count, 0) ?? 0;
      if (
        prev &&
        (prev.sessions > 0 || prevDecisions > 0) &&
        next.sessions === 0 &&
        nextDecisions === 0 &&
        readLocalEvidence().length === 0
      ) {
        return prev;
      }
      return next;
    },
  );
}

export const useApprovals = () =>
  usePolled<ApprovalDTO[]>(
    () => api.approvals(),
    5000,
    [],
    (prev, next) => {
      if (prev && prev.length > 0 && next.length === 0) return prev;
      return next;
    },
  );
export const usePolicy = () => usePolled<OrgPolicyDTO>(api.orgPolicy, null);
export const useDocuments = () =>
  usePolled<OrgDocumentDTO[]>(api.orgDocuments, null);
