"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { api } from "@/components/api/client";
import type { Classification, OrgDocumentDTO, OrgPolicyDTO } from "@/components/api/types";
import { SEED_DOCUMENTS, SEED_POLICY } from "@/components/console/catalog";
import { RoleTabs } from "@/components/console/RoleSelector";
import { useAppState } from "@/components/shell/AppState";
import { Icon } from "@/components/ui/Icon";
import { DocumentsPanel } from "./DocumentsPanel";
import { PolicyMatrices } from "./PolicyMatrices";

type Backend = "loading" | "live" | "local";

export function OrgView() {
  const { role, setRole, showToast } = useAppState();
  const [backend, setBackend] = useState<Backend>("loading");
  const [docs, setDocs] = useState<OrgDocumentDTO[]>([]);
  const [policy, setPolicy] = useState<OrgPolicyDTO>(SEED_POLICY);
  const [dirty, setDirty] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const canEdit = role === "admin";

  useEffect(() => {
    let alive = true;
    Promise.all([api.orgDocuments(), api.orgPolicy()])
      .then(([d, p]) => {
        if (!alive) return;
        setDocs(d);
        setPolicy(p);
        setBackend("live");
      })
      .catch(() => {
        if (!alive) return;
        setDocs(SEED_DOCUMENTS);
        setPolicy(structuredClone(SEED_POLICY));
        setBackend("local");
      });
    return () => {
      alive = false;
    };
  }, []);

  const updateDoc = async (id: string, patch: Partial<Pick<OrgDocumentDTO, "classification" | "enabled">>) => {
    const apply = (d: OrgDocumentDTO) =>
      d.id === id ? { ...d, ...patch, collection: patch.classification ?? d.collection, updatedAt: new Date().toISOString() } : d;
    setDocs((prev) => prev.map(apply));
    if (backend !== "live") return;
    try {
      const saved = await api.updateOrgDocument(id, patch);
      setDocs((prev) => prev.map((d) => (d.id === id ? saved : d)));
    } catch (err) {
      showToast({ tone: "deny", title: "Update rejected", body: err instanceof Error ? err.message : "Unknown error" });
      api.orgDocuments().then(setDocs).catch(() => {});
    }
  };

  const addDoc = async (draft: { title: string; classification: Classification; content: string }) => {
    if (backend === "live") {
      try {
        const saved = await api.createOrgDocument(draft);
        setDocs((prev) => [saved, ...prev]);
        showToast({ tone: "allow", title: "Document added", body: `${saved.title} stored as ${saved.classification}.` });
      } catch (err) {
        showToast({ tone: "deny", title: "Upload rejected", body: err instanceof Error ? err.message : "Unknown error" });
      }
      return;
    }
    const slug = draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "doc";
    setDocs((prev) => [
      {
        id: `${slug}-${prev.length + 1}`,
        title: draft.title,
        classification: draft.classification,
        collection: draft.classification,
        enabled: true,
        updatedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    showToast({ tone: "info", title: "Added to local draft", body: "Org API is not live yet; nothing was persisted." });
  };

  const changePolicy = (next: OrgPolicyDTO) => {
    setPolicy(next);
    setDirty(true);
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const next =
        backend === "live"
          ? await api.publishOrgPolicy(policy)
          : { ...policy, policyVersion: policy.policyVersion + 1 };
      setPolicy(next);
      setDirty(false);
      showToast({
        tone: "allow",
        title: `Published policy v${next.policyVersion}`,
        body: backend === "live" ? "New sessions bind to this version." : "Local draft only — Org API not live yet.",
      });
    } catch (err) {
      showToast({ tone: "deny", title: "Publish rejected", body: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1366px] px-6 pt-7 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="block text-[10px] font-extrabold uppercase tracking-[.85px] text-teal">
            Organization fence
          </span>
          <h1 className="mt-0.5 font-display text-[28px] font-bold tracking-tight text-ink">
            NullTrace Institute
          </h1>
          <p className="mt-1 max-w-[600px] text-sm leading-normal text-muted">
            Upload sources and define who may read them and which tools are ALLOW / DENY / REQUIRE_APPROVAL.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <BackendBadge backend={backend} />
          <motion.span
            className="rounded-full border border-line bg-white px-3 py-1.5 font-mono text-xs font-bold text-muted"
            layout
          >
            Policy{" "}
            <AnimatePresence mode="popLayout">
              <motion.span
                animate={{ y: 0, opacity: 1 }}
                className="inline-block text-ink"
                exit={{ y: -10, opacity: 0 }}
                initial={{ y: 10, opacity: 0 }}
                key={policy.policyVersion}
              >
                v{policy.policyVersion}
              </motion.span>
            </AnimatePresence>
            {dirty && <span className="text-approval"> · unpublished changes</span>}
          </motion.span>
          <motion.button
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal px-3.5 text-sm font-bold text-white hover:bg-teal-strong disabled:opacity-45"
            disabled={!dirty || !canEdit || publishing}
            onClick={publish}
            type="button"
            whileTap={{ scale: 0.96 }}
          >
            <Icon name="check" size={15} />
            {publishing ? "Publishing…" : "Publish policy"}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {!canEdit && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
          >
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[10px] border border-[#e8d1a8] bg-[#fff9ee] px-3.5 py-2.5 text-sm text-[#735b3c]">
              <Icon className="text-approval" name="lock" size={15} />
              <span className="flex-1">
                Org routes are gated to the <strong>admin</strong> role. You are viewing as{" "}
                <strong>{role}</strong> — read only.
              </span>
              <RoleTabs layoutGroup="org" onChange={setRole} value={role} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {backend === "loading" ? (
        <div className="mt-4 grid gap-3">
          {[0, 1].map((i) => (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              className="h-48 rounded-xl border border-line bg-white"
              key={i}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          ))}
        </div>
      ) : (
        <motion.div animate="show" initial="hidden" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
          <DocumentsPanel canEdit={canEdit} docs={docs} onAdd={addDoc} onUpdate={updateDoc} />
          <PolicyMatrices canEdit={canEdit} onChange={changePolicy} policy={policy} />
          <motion.p
            className="mx-0.5 mt-4 flex items-center gap-1.5 text-xs text-muted"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
          >
            <Icon className="text-teal" name="lock" size={13} />
            Uploaded content is untrusted. Document text cannot elevate its own classification or change tool policy.
          </motion.p>
        </motion.div>
      )}
    </main>
  );
}

function BackendBadge({ backend }: { backend: Backend }) {
  if (backend === "loading") return null;
  return backend === "live" ? (
    <span className="rounded-full bg-allow-soft px-2.5 py-1.5 text-[11px] font-bold text-allow">Org API live</span>
  ) : (
    <span
      className="rounded-full bg-approval-soft px-2.5 py-1.5 text-[11px] font-bold text-approval"
      title="GET /api/org/documents and /api/org/policy are not deployed yet; edits stay in this browser tab."
    >
      Local draft · Org API pending
    </span>
  );
}
