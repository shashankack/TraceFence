"use client";

import { ChevronLeft, ChevronRight, Database, FileUp, Loader2, Lock, Plus, Search, SlidersHorizontal, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/components/api/client";
import { CLASSIFICATIONS, ROLES, TOOLS, type Classification, type Decision, type OrgDocumentDTO, type OrgPolicyDTO, type Role } from "@/components/api/types";
import { useDocuments, usePolicy } from "@/components/admin/hooks";
import { RoleGate } from "@/components/auth/RoleGate";
import { cn } from "@/components/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { roleLabelFor } from "@/components/shell/nav";
import { BentoTile } from "@/components/ui/bento";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClassLabel } from "@/components/ui/decision-badge";
import { Input } from "@/components/ui/input";
import { BlurFade } from "@/components/ui/motion/blur-fade";
import { Stagger, StaggerItem } from "@/components/ui/motion/stagger";
import { StatusCycle, SUGGESTING_TITLE_PHRASES } from "@/components/ui/motion/status-cycle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const CORPUS_PAGE_SIZE = 8;

const CELL: Record<Decision, string> = {
  ALLOW: "bg-allow-soft text-allow border-allow/20",
  DENY: "bg-deny-soft text-deny border-deny/20",
  REQUIRE_APPROVAL: "bg-approval-soft text-approval border-approval/25",
};
const NEXT: Record<Decision, Decision> = { ALLOW: "DENY", DENY: "REQUIRE_APPROVAL", REQUIRE_APPROVAL: "ALLOW" };

export default function PoliciesPage() {
  return (
    <RoleGate allow={["admin"]}>
      <Policies />
    </RoleGate>
  );
}

function Policies() {
  const docsQ = useDocuments();
  const policyQ = usePolicy();
  // Local edits layer over the fetched data; null means "show what the server returned".
  const [localDocs, setLocalDocs] = useState<OrgDocumentDTO[] | null>(null);
  const [localDraft, setLocalDraft] = useState<OrgPolicyDTO | null>(null);
  const [publishing, setPublishing] = useState(false);
  const docs = localDocs ?? docsQ.data;
  const draft = localDraft ?? policyQ.data;
  const setDocs = (fn: (prev: OrgDocumentDTO[] | null) => OrgDocumentDTO[] | null) => setLocalDocs((prev) => fn(prev ?? docsQ.data));
  const setDraft = (next: OrgPolicyDTO | null) => setLocalDraft(next);

  const dirty = !!draft && !!policyQ.data && JSON.stringify(draft.roles) !== JSON.stringify(policyQ.data.roles);

  const updateDoc = async (id: string, patch: Partial<Pick<OrgDocumentDTO, "classification" | "enabled">>) => {
    setDocs((prev) => prev?.map((d) => (d.id === id ? { ...d, ...patch } : d)) ?? prev);
    try {
      const saved = await api.updateOrgDocument(id, patch);
      setDocs((prev) => prev?.map((d) => (d.id === id ? saved : d)) ?? prev);
      toast.success("Source updated", { description: `${saved.title} · ${saved.classification}${saved.enabled ? "" : " · disabled"}` });
    } catch (err) {
      toast.error("Update rejected", { description: err instanceof Error ? err.message : "Unknown error" });
      setLocalDocs(null);
      docsQ.reload();
    }
  };

  const publish = async () => {
    if (!draft) return;
    setPublishing(true);
    try {
      const next = await api.publishOrgPolicy(draft);
      setDraft(null);
      policyQ.reload();
      toast.success(`Published policy v${next.policyVersion}`, { description: "New sessions bind to this version." });
    } catch (err) {
      toast.error("Publish rejected", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <main className="p-4 sm:p-6">
      <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12" delay={0.04}>
        <StaggerItem className="md:col-span-6 xl:col-span-4">
          <AddSource
            className="h-full"
            onAdded={(d) => setDocs((prev) => (prev ? [d, ...prev] : [d]))}
          />
        </StaggerItem>

        <StaggerItem className="md:col-span-6 xl:col-span-8">
          <CorpusPanel docs={docs} onUpdate={updateDoc} />
        </StaggerItem>

        <StaggerItem className="md:col-span-6 xl:col-span-12">
          <BentoTile
            action={
              <>
                {dirty && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 24 }}
                  >
                    <Badge className="border-approval/25 bg-approval-soft text-approval" variant="outline">
                      unpublished changes
                    </Badge>
                  </motion.span>
                )}
                <Button disabled={!dirty || publishing} onClick={() => setDraft(null)} size="sm" variant="ghost">
                  Discard
                </Button>
                <Button
                  className="brand-gradient text-white hover:opacity-95"
                  disabled={!dirty || publishing}
                  onClick={publish}
                  size="sm"
                >
                  {publishing && <Loader2 className="size-3.5 animate-spin" />}
                  Publish v{(policyQ.data?.policyVersion ?? 0) + 1}
                </Button>
              </>
            }
            icon={SlidersHorizontal}
            kicker={policyQ.data ? `live policy v${policyQ.data.policyVersion}` : "policy"}
            title="Access policy"
          >
            {!draft ? (
              <Skeleton className="m-5 h-48" />
            ) : (
              (() => {
                const matrixRoles = Object.keys(draft.roles).filter((r) => r !== "guest");
                return (
              <div className="grid gap-0 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:divide-x">
                <Matrix
                  caption="Retrieval ACL  which collections each role may read. Applied before the model sees anything."
                  columns={CLASSIFICATIONS}
                  roles={matrixRoles}
                  value={(r, c) => (draft.roles[r]?.collections.includes(c) ? "ALLOW" : "DENY")}
                  onCycle={(r, c) => {
                    const cur = draft.roles[r].collections;
                    const collections = cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c];
                    setDraft({
                      ...draft,
                      roles: { ...draft.roles, [r]: { ...draft.roles[r], collections } },
                    });
                  }}
                />
                <Matrix
                  caption="Tool gateway  what happens when the model proposes each tool. Click a cell to cycle."
                  columns={TOOLS}
                  roles={matrixRoles}
                  value={(r, t) => (draft.roles[r]?.tools[t] ?? "DENY") as Decision}
                  onCycle={(r, t) => {
                    const v = (draft.roles[r].tools[t] ?? "DENY") as Decision;
                    setDraft({
                      ...draft,
                      roles: {
                        ...draft.roles,
                        [r]: {
                          ...draft.roles[r],
                          tools: { ...draft.roles[r].tools, [t]: NEXT[v] },
                        },
                      },
                    });
                  }}
                />
              </div>
                );
              })()
            )}
          </BentoTile>
        </StaggerItem>
      </Stagger>
      <BlurFade delay={0.18}>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" />
          Classification and tool access are set here  wording inside a PDF cannot override them.
        </p>
      </BlurFade>
    </main>
  );
}

function Matrix({
  roles,
  columns,
  caption,
  value,
  onCycle,
}: {
  roles: string[];
  columns: readonly string[];
  caption: string;
  value: (r: string, c: string) => Decision;
  onCycle: (r: string, c: string) => void;
}) {
  const { user } = useAuth();
  const label = (r: string) => roleLabelFor(r, user?.orgType, user?.roleLabels);
  return (
    <div className="min-w-0 px-5 py-4">
      <p className="m-0 mb-3 text-xs text-muted-foreground">{caption}</p>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1.5 text-sm">
          <thead>
            <tr>
              <th className="w-20" />
              {columns.map((c) => (
                <th className="px-1 text-left font-mono text-[10.5px] font-normal whitespace-nowrap text-muted-foreground" key={c}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r}>
                <td className="pr-2 font-medium">
                  {label(r)}
                  {!ROLES.includes(r as (typeof ROLES)[number]) && (
                    <span className="mt-0.5 block font-mono text-[10px] font-normal text-muted-foreground">{r}</span>
                  )}
                </td>
                {columns.map((c) => {
                  const d = value(r, c);
                  return (
                    <td key={c}>
                      <motion.button
                        aria-label={`${label(r)} ${c}: ${d}`}
                        className={cn(
                          "h-8 w-full min-w-[78px] rounded-md border font-mono text-[10.5px]",
                          CELL[d],
                        )}
                        onClick={() => onCycle(r, c)}
                        type="button"
                        whileHover={{ y: -2, scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 500, damping: 24 }}
                      >
                        {d === "REQUIRE_APPROVAL" ? "APPROVAL" : d}
                      </motion.button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CorpusPanel({
  docs,
  onUpdate,
}: {
  docs: OrgDocumentDTO[] | null | undefined;
  onUpdate: (id: string, patch: Partial<Pick<OrgDocumentDTO, "classification" | "enabled">>) => void;
}) {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<Classification | "all">("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!docs) return [];
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      if (classFilter !== "all" && d.classification !== classFilter) return false;
      if (!q) return true;
      const hay = `${d.title} ${d.id} ${d.classification} ${(d as OrgDocumentDTO & { source?: string }).source ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [docs, query, classFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / CORPUS_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageDocs = filtered.slice(safePage * CORPUS_PAGE_SIZE, safePage * CORPUS_PAGE_SIZE + CORPUS_PAGE_SIZE);

  const setQueryAndReset = (v: string) => {
    setQuery(v);
    setPage(0);
  };
  const setClassAndReset = (v: Classification | "all") => {
    setClassFilter(v);
    setPage(0);
  };

  return (
    <BentoTile
      className="h-full"
      icon={Database}
      kicker={docs ? `${docs.length} sources` : "sources"}
      title="Corpus"
    >
      {!docs ? (
        <Skeleton className="m-5 h-48" />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search corpus"
                className="h-9 pl-8"
                onChange={(e) => setQueryAndReset(e.target.value)}
                placeholder="Search title, id, classification…"
                value={query}
              />
            </div>
            <Select onValueChange={(v) => setClassAndReset(v as Classification | "all")} value={classFilter}>
              <SelectTrigger aria-label="Filter by classification" className="h-9 w-full sm:w-[150px]" size="sm">
                <SelectValue placeholder="Classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {CLASSIFICATIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    <ClassLabel value={c} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {pageDocs.length === 0 ? (
            <p className="m-0 px-5 py-8 text-sm text-muted-foreground">
              No sources match{query ? ` “${query.trim()}”` : ""}.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Source</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead className="hidden sm:table-cell">Origin</TableHead>
                  <TableHead className="pr-5 text-right">Enabled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageDocs.map((d, i) => (
                  <motion.tr
                    className={cn(!d.enabled && "opacity-55")}
                    key={d.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 + i * 0.03, duration: 0.3 }}
                  >
                    <TableCell className="pl-5">
                      <span className="block font-medium">{d.title}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{d.id}</span>
                    </TableCell>
                    <TableCell>
                      <Select
                        onValueChange={(v) => onUpdate(d.id, { classification: v as Classification })}
                        value={d.classification}
                      >
                        <SelectTrigger
                          aria-label={`Classification for ${d.title}`}
                          className="h-8 w-[150px]"
                          size="sm"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASSIFICATIONS.map((c) => (
                            <SelectItem key={c} value={c}>
                              <ClassLabel value={c} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className="font-mono text-[10.5px] font-normal" variant="outline">
                        {(d as OrgDocumentDTO & { source?: string }).source ?? "fixture"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Switch
                        aria-label={`Enable ${d.title}`}
                        checked={d.enabled}
                        onCheckedChange={(on) => onUpdate(d.id, { enabled: on })}
                      />
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 border-t px-4 py-2.5">
            <span className="font-mono text-[11px] text-muted-foreground">
              {filtered.length === 0
                ? "0 shown"
                : `${safePage * CORPUS_PAGE_SIZE + 1}–${Math.min((safePage + 1) * CORPUS_PAGE_SIZE, filtered.length)} of ${filtered.length}`}
              {filtered.length !== docs.length ? ` · filtered from ${docs.length}` : ""}
            </span>
            <div className="flex items-center gap-1">
              <Button
                aria-label="Previous page"
                disabled={safePage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                size="icon-sm"
                variant="ghost"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-[4.5rem] text-center font-mono text-[11px] text-muted-foreground">
                {safePage + 1} / {pageCount}
              </span>
              <Button
                aria-label="Next page"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                size="icon-sm"
                variant="ghost"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </BentoTile>
  );
}

function AddSource({ className, onAdded }: { className?: string; onAdded: (d: OrgDocumentDTO) => void }) {
  const [title, setTitle] = useState("");
  const [classification, setClassification] = useState<Classification>("public");
  const [content, setContent] = useState("");
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const suggestGen = useRef(0);
  const titleTouchedRef = useRef(false);

  const applySuggestedTitle = async (input: {
    content?: string;
    pdfBase64?: string;
    fileName?: string;
  }) => {
    if (titleTouchedRef.current) return;
    const gen = ++suggestGen.current;
    setSuggesting(true);
    try {
      const res = await api.suggestOrgDocumentTitle(input);
      if (gen !== suggestGen.current || titleTouchedRef.current) return;
      setTitle(res.title);
    } catch {
      // Keep filename-derived title if suggestion fails.
    } finally {
      if (gen === suggestGen.current) setSuggesting(false);
    }
  };

  const readFile = async (file: File) => {
    setFileName(file.name);
    const fromName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
    if (!titleTouchedRef.current) setTitle(fromName);
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
      const b64 = btoa(binary);
      setPdfBase64(b64);
      setContent("");
      void applySuggestedTitle({ pdfBase64: b64, fileName: file.name });
      return;
    }
    setPdfBase64(null);
    const text = await file.text();
    setContent(text);
    void applySuggestedTitle({ content: text, fileName: file.name });
  };

  const submit = async () => {
    if (!title.trim()) return;
    if (!pdfBase64 && !content.trim()) {
      toast.error("Add a PDF or paste text first");
      return;
    }
    setSaving(true);
    try {
      const doc = await api.createOrgDocument({
        title: title.trim(),
        classification,
        ...(pdfBase64 ? { pdfBase64 } : { content }),
      });
      onAdded(doc);
      toast.success("Source added", {
        description: `${doc.title} stored as ${doc.classification} (chunked for search).`,
      });
      setTitle("");
      titleTouchedRef.current = false;
      setContent("");
      setPdfBase64(null);
      setFileName(null);
    } catch (err) {
      toast.error("Upload rejected", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BentoTile className={className} icon={FileUp} kicker="PDF preferred · classify before save" title="Add a source">
      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        <button
          className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/40 px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) void readFile(f);
          }}
          type="button"
        >
          <Upload className="size-4 text-primary" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">
              {fileName ?? "Drop a PDF (or .txt)"}
            </span>
            <span className="block text-xs text-muted-foreground">
              {fileName ? (
                suggesting ? (
                  <StatusCycle className="text-xs" phrases={SUGGESTING_TITLE_PHRASES} />
                ) : pdfBase64 ? (
                  "PDF ready to extract & index"
                ) : (
                  `${content.length.toLocaleString()} characters`
                )
              ) : (
                "Campus policies as PDF  text is extracted and chunked"
              )}
            </span>
          </span>
        </button>
        <input
          accept=".pdf,application/pdf,.txt,text/plain"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && void readFile(e.target.files[0])}
          ref={fileRef}
          type="file"
        />
        <div className="space-y-1">
          <Input
            onChange={(e) => {
              titleTouchedRef.current = true;
              setTitle(e.target.value);
            }}
            placeholder={suggesting ? "Suggesting title…" : "Title"}
            value={title}
          />
          {suggesting && (
            <p className="m-0 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              <StatusCycle className="text-[11px]" phrases={SUGGESTING_TITLE_PHRASES} />
            </p>
          )}
        </div>
        <Select onValueChange={(v) => setClassification(v as Classification)} value={classification}>
          <SelectTrigger aria-label="Classification" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLASSIFICATIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!fileName && (
          <Textarea
            className="min-h-[88px] resize-y text-sm"
            onBlur={() => {
              if (!titleTouchedRef.current && content.trim().length >= 20) {
                void applySuggestedTitle({ content });
              }
            }}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Or paste text if you don't have a PDF yet. Stored as data, never as instructions."
            value={content}
          />
        )}
        <Button
          className="mt-auto"
          disabled={!title.trim() || saving || (!pdfBase64 && !content.trim())}
          onClick={() => void submit()}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add source
        </Button>
      </div>
    </BentoTile>
  );
}
