"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/components/api/client";
import type { ApprovalDTO, AuditDTO, EventDTO, OrgDocumentDTO, OrgPolicyDTO, Role } from "@/components/api/types";
import { forgetSessions, readSessions } from "@/components/workspace/registry";

type Load<T> = { data: T | null; error: string | null; loading: boolean; reload: () => void };

function usePolled<T>(fetcher: () => Promise<T>, intervalMs: number | null): Load<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    const run = () =>
      fetcher()
        .then((d) => {
          if (!alive) return;
          setData(d);
          setError(null);
        })
        .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Request failed"))
        .finally(() => alive && setLoading(false));
    run();
    const t = intervalMs ? setInterval(run, intervalMs) : null;
    return () => {
      alive = false;
      if (t) clearInterval(t);
    };
    // fetcher identity is stable per call site; tick forces a manual refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, intervalMs]);

  return { data, error, loading, reload };
}

export const useAudit = () => usePolled<AuditDTO>(api.audit, 8000);
export const useApprovals = () => usePolled<ApprovalDTO[]>(() => api.approvals(), 5000);
export const usePolicy = () => usePolled<OrgPolicyDTO>(api.orgPolicy, null);
export const useDocuments = () => usePolled<OrgDocumentDTO[]>(api.orgDocuments, null);

export interface SessionEvidence {
  sessionId: string;
  role: Role;
  userId: string;
  events: EventDTO[];
}

/**
 * Re-fetches, from the server, the events of every session opened in this browser.
 * The admin is in the same tenant, so GET /api/sessions/:id/events authorizes the read.
 */
export function useEvidence(intervalMs = 8000) {
  return usePolled<SessionEvidence[]>(async () => {
    const known = readSessions();
    const results = await Promise.all(
      known.map(async (s) => {
        try {
          return { ...s, events: await api.sessionEvents(s.sessionId) };
        } catch (e) {
          if (e instanceof ApiError && (e.status === 404 || e.status === 403)) return { ...s, events: null };
          throw e;
        }
      }),
    );
    const gone = results.filter((r) => r.events === null).map((r) => r.sessionId);
    if (gone.length) forgetSessions(gone);
    return results.filter((r): r is SessionEvidence & { createdAt: string } => r.events !== null && r.events.length > 0);
  }, intervalMs);
}
