"use client";

import { Database, FileUp, Loader2, Lock, Plus, SlidersHorizontal, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/components/api/client";
import { CLASSIFICATIONS, ROLES, TOOLS, type Classification, type Decision, type OrgDocumentDTO, type OrgPolicyDTO, type Role } from "@/components/api/types";
import { useDocuments, usePolicy } from "@/components/admin/hooks";
import { RoleGate } from "@/components/auth/RoleGate";
import { cn } from "@/components/lib/utils";
import { ROLE_LABEL } from "@/components/shell/nav";
import { BentoGrid, BentoTile } from "@/components/ui/bento";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClassLabel } from "@/components/ui/decision-badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

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
      <BentoGrid>
        <AddSource className="md:col-span-6 xl:col-span-4" onAdded={(d) => setDocs((prev) => (prev ? [d, ...prev] : [d]))} />

        <BentoTile className="md:col-span-6 xl:col-span-8" icon={Database} kicker={docs ? `${docs.length} sources` : "sources"} title="Corpus">
          {!docs ? (
            <Skeleton className="m-5 h-48" />
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
                {docs.map((d) => (
                  <TableRow className={cn(!d.enabled && "opacity-55")} key={d.id}>
                    <TableCell className="pl-5">
                      <span className="block font-medium">{d.title}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{d.id}</span>
                    </TableCell>
                    <TableCell>
                      <Select onValueChange={(v) => updateDoc(d.id, { classification: v as Classification })} value={d.classification}>
                        <SelectTrigger aria-label={`Classification for ${d.title}`} className="h-8 w-[150px]" size="sm">
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
                      <Switch aria-label={`Enable ${d.title}`} checked={d.enabled} onCheckedChange={(on) => updateDoc(d.id, { enabled: on })} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </BentoTile>

        <BentoTile
          action={
            <>
              {dirty && (
                <Badge className="border-approval/25 bg-approval-soft text-approval" variant="outline">
                  unpublished changes
                </Badge>
              )}
              <Button disabled={!dirty || publishing} onClick={() => setDraft(null)} size="sm" variant="ghost">
                Discard
              </Button>
              <Button className="brand-gradient text-white hover:opacity-95" disabled={!dirty || publishing} onClick={publish} size="sm">
                {publishing && <Loader2 className="size-3.5 animate-spin" />}
                Publish v{(policyQ.data?.policyVersion ?? 0) + 1}
              </Button>
            </>
          }
          className="md:col-span-6 xl:col-span-12"
          icon={SlidersHorizontal}
          kicker={policyQ.data ? `live policy v${policyQ.data.policyVersion}` : "policy"}
          title="Access policy"
        >
          {!draft ? (
            <Skeleton className="m-5 h-48" />
          ) : (
            <div className="grid gap-0 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:divide-x">
              <Matrix
                caption="Retrieval ACL — which collections each role may read. Applied before the model sees anything."
                columns={CLASSIFICATIONS}
                value={(r, c) => (draft.roles[r].collections.includes(c) ? "ALLOW" : "DENY")}
                onCycle={(r, c) => {
                  const cur = draft.roles[r].collections;
                  const collections = cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c];
                  setDraft({ ...draft, roles: { ...draft.roles, [r]: { ...draft.roles[r], collections } } });
                }}
              />
              <Matrix
                caption="Tool gateway — what happens when the model proposes each tool. Click a cell to cycle."
                columns={TOOLS}
                value={(r, t) => (draft.roles[r].tools[t] ?? "DENY") as Decision}
                onCycle={(r, t) => {
                  const v = (draft.roles[r].tools[t] ?? "DENY") as Decision;
                  setDraft({ ...draft, roles: { ...draft.roles, [r]: { ...draft.roles[r], tools: { ...draft.roles[r].tools, [t]: NEXT[v] } } } });
                }}
              />
            </div>
          )}
        </BentoTile>
      </BentoGrid>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3.5" />
        Uploaded content is untrusted. Document text can never change its own classification or the tool policy.
      </p>
    </main>
  );
}

function Matrix({
  columns,
  caption,
  value,
  onCycle,
}: {
  columns: readonly string[];
  caption: string;
  value: (r: (typeof ROLES)[number], c: string) => Decision;
  onCycle: (r: (typeof ROLES)[number], c: string) => void;
}) {
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
            {ROLES.map((r) => (
              <tr key={r}>
                <td className="pr-2 font-medium">{ROLE_LABEL[r]}</td>
                {columns.map((c) => {
                  const d = value(r, c);
                  return (
                    <td key={c}>
                      <button
                        aria-label={`${ROLE_LABEL[r]} ${c}: ${d}`}
                        className={cn("h-8 w-full min-w-[78px] rounded-md border font-mono text-[10.5px] transition-transform hover:-translate-y-px", CELL[d])}
                        onClick={() => onCycle(r, c)}
                        type="button"
                      >
                        {d === "REQUIRE_APPROVAL" ? "APPROVAL" : d}
                      </button>
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

function AddSource({ className, onAdded }: { className?: string; onAdded: (d: OrgDocumentDTO) => void }) {
  const [title, setTitle] = useState("");
  const [classification, setClassification] = useState<Classification>("public");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const readFile = async (file: File) => {
    setContent(await file.text());
    setFileName(file.name);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
  };

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const doc = await api.createOrgDocument({ title: title.trim(), classification, content });
      onAdded(doc);
      toast.success("Source added", { description: `${doc.title} stored as ${doc.classification}.` });
      setTitle("");
      setContent("");
      setFileName(null);
    } catch (err) {
      toast.error("Upload rejected", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BentoTile className={className} icon={FileUp} kicker="classify before save" title="Add a source">
      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        <button
          className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/40 px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) readFile(f);
          }}
          type="button"
        >
          <Upload className="size-4 text-primary" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{fileName ?? "Drop a .md or .txt file"}</span>
            <span className="block text-xs text-muted-foreground">{fileName ? `${content.length.toLocaleString()} characters` : "or paste text below"}</span>
          </span>
        </button>
        <input accept=".md,.txt,text/plain,text/markdown" className="hidden" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} ref={fileRef} type="file" />
        <Input onChange={(e) => setTitle(e.target.value)} placeholder="Title" value={title} />
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
          <Textarea className="min-h-[88px] resize-y text-sm" onChange={(e) => setContent(e.target.value)} placeholder="Paste document text. It is stored as data, never as instructions." value={content} />
        )}
        <Button className="mt-auto" disabled={!title.trim() || saving} onClick={submit}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add source
        </Button>
      </div>
    </BentoTile>
  );
}
