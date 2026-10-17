"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/components/api/client";
import type {
  ApprovalDTO,
  AuditDTO,
  EventDTO,
  OrgDocumentDTO,
  OrgPolicyDTO,
  Role,
} from "@/components/api/types";

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
): Load<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const run = () =>
      fetcher()
        .then((d) => {
          if (!alive) return;
          setData(d);
          setError(null);
        })
        .catch(
          (e) =>
            alive &&
            setError(e instanceof ApiError ? e.message : "Request failed"),
        )
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

export const useAudit = () => usePolled<AuditDTO>(api.audit, 8000);
export const useApprovals = () =>
  usePolled<ApprovalDTO[]>(() => api.approvals(), 5000);
export const usePolicy = () => usePolled<OrgPolicyDTO>(api.orgPolicy, null);
export const useDocuments = () =>
  usePolled<OrgDocumentDTO[]>(api.orgDocuments, null);

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

/**
 * Tenant-wide gateway evidence for the admin audit console (server-paginated).
 */
export function useEvidence(
  opts: { page?: number; pageSize?: number; pollMs?: number | null } = {},
) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 10;
  const pollMs = opts.pollMs === undefined ? 8000 : opts.pollMs;

  return usePolled<EvidencePage>(
    () =>
      api.auditEvidence({ page, pageSize }).then((r) => ({
        sessions: r.sessions,
        page: r.page,
        pageSize: r.pageSize,
        totalSessions: r.totalSessions,
        totalPages: r.totalPages,
      })),
    pollMs,
    [page, pageSize],
  );
}
