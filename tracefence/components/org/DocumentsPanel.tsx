"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { CLASSIFICATIONS, type Classification, type OrgDocumentDTO } from "@/components/api/types";
import { ClassBadge } from "@/components/console/ChatPanel";
import { Icon } from "@/components/ui/Icon";
import { panelVariants } from "./motion";

function relative(ts?: string) {
  if (!ts) return "Seed";
  const mins = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  return new Date(ts).toLocaleDateString();
}

const inputCls =
  "h-9 rounded-lg border border-line-strong bg-white px-2.5 text-sm text-ink outline-none focus:border-[#70aaa2] focus:shadow-[0_0_0_3px_var(--color-teal-soft)] disabled:bg-[#f6f8f8] disabled:text-faint";

export function DocumentsPanel({
  docs,
  canEdit,
  onAdd,
  onUpdate,
}: {
  docs: OrgDocumentDTO[];
  canEdit: boolean;
  onAdd: (draft: { title: string; classification: Classification; content: string }) => Promise<void>;
  onUpdate: (id: string, patch: Partial<Pick<OrgDocumentDTO, "classification" | "enabled">>) => void;
}) {
  const [title, setTitle] = useState("");
  const [classification, setClassification] = useState<Classification>("public");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [adding, setAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const readFile = async (file: File) => {
    setContent(await file.text());
    setFileName(file.name);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
  };

  const submit = async () => {
    if (!title.trim() || !canEdit) return;
    setAdding(true);
    await onAdd({ title: title.trim(), classification, content });
    setAdding(false);
    setTitle("");
    setContent("");
    setFileName(null);
  };

  return (
    <motion.section
      className="mt-4 overflow-hidden rounded-xl border border-line bg-white shadow-[0_6px_20px_rgba(26,58,61,.04)]"
      variants={panelVariants}
    >
      <div className="flex min-h-[60px] items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h2 className="m-0 font-display text-base font-bold">Documents</h2>
          <p className="mt-0.5 text-xs text-muted">Classify before save. Content cannot self-elevate permissions.</p>
        </div>
        <span className="font-mono text-xs text-faint">{docs.length} sources</span>
      </div>

      <div className="grid items-center gap-2 border-b border-line bg-[#fbfcfc] px-3.5 py-3 lg:grid-cols-[1.4fr_1fr_auto_auto]">
        <motion.button
          animate={{ scale: dragging ? 1.02 : 1, borderColor: dragging ? "#0d7b72" : "#b7d4cf" }}
          className="flex items-center gap-2.5 rounded-[10px] border border-dashed bg-teal-soft px-3 py-2.5 text-left text-teal disabled:opacity-60"
          disabled={!canEdit}
          onClick={() => fileRef.current?.click()}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f && canEdit) readFile(f);
          }}
          type="button"
        >
          <Icon name="upload" size={18} />
          <div className="min-w-0">
            <strong className="block truncate text-xs text-ink">{fileName ?? "Upload or drop a source"}</strong>
            <small className="text-[11px] text-muted">
              {fileName ? `${content.length.toLocaleString()} characters read` : "md / txt · synthetic demo only"}
            </small>
          </div>
        </motion.button>
        <input
          accept=".md,.txt,text/plain,text/markdown"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
          ref={fileRef}
          type="file"
        />
        <input
          aria-label="Document title"
          className={inputCls}
          disabled={!canEdit}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Document title"
          value={title}
        />
        <select
          aria-label="Classification"
          className={inputCls}
          disabled={!canEdit}
          onChange={(e) => setClassification(e.target.value as Classification)}
          value={classification}
        >
          {CLASSIFICATIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <motion.button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-navy px-3.5 text-sm font-bold text-white disabled:opacity-45"
          disabled={!canEdit || !title.trim() || adding}
          onClick={submit}
          type="button"
          whileTap={{ scale: 0.96 }}
        >
          <Icon name="file" size={14} />
          {adding ? "Adding…" : "Add"}
        </motion.button>
        <AnimatePresence>
          {canEdit && !fileName && (
            <motion.textarea
              animate={{ opacity: 1, height: "auto" }}
              aria-label="Paste document text"
              className={`${inputCls} col-span-full h-auto min-h-[56px] resize-y py-2`}
              exit={{ opacity: 0, height: 0 }}
              initial={{ opacity: 0, height: 0 }}
              onChange={(e) => setContent(e.target.value)}
              placeholder="…or paste document text. It is stored as data and never interpreted as instructions."
              rows={2}
              value={content}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="pt-1 pb-2">
        <div className="grid min-h-[36px] grid-cols-[2fr_1fr_.9fr_.7fr_.55fr] items-center gap-2.5 bg-[#f7f9f8] px-3.5 text-[10px] font-extrabold uppercase tracking-[.4px] text-faint">
          <span>Title</span>
          <span>Classification</span>
          <span>Collection</span>
          <span>Updated</span>
          <span>Enabled</span>
        </div>
        <AnimatePresence initial={false}>
          {docs.map((doc) => (
            <motion.div
              animate={{ opacity: 1, height: "auto", backgroundColor: "rgba(227,243,240,0)" }}
              className="grid min-h-[54px] grid-cols-[2fr_1fr_.9fr_.7fr_.55fr] items-center gap-2.5 border-b border-[#eaf0ee] px-3.5 text-sm last:border-b-0"
              initial={{ opacity: 0, height: 0, backgroundColor: "rgba(227,243,240,1)" }}
              key={doc.id}
              layout
              transition={{ duration: 0.35, backgroundColor: { duration: 1.6 } }}
            >
              <span className={doc.enabled ? "" : "opacity-50"}>
                <strong className="block text-sm">{doc.title}</strong>
                <code className="font-mono text-[11px] text-faint">{doc.id}</code>
              </span>
              <select
                aria-label={`Classification for ${doc.title}`}
                className={`${inputCls} w-full max-w-[160px]`}
                disabled={!canEdit}
                onChange={(e) => onUpdate(doc.id, { classification: e.target.value as Classification })}
                value={doc.classification}
              >
                {CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span>
                <ClassBadge value={doc.collection} />
              </span>
              <span className="text-xs text-muted">{relative(doc.updatedAt)}</span>
              <Toggle
                disabled={!canEdit}
                label={`Enable ${doc.title}`}
                on={doc.enabled}
                onChange={() => onUpdate(doc.id, { enabled: !doc.enabled })}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function Toggle({ on, onChange, disabled, label }: { on: boolean; onChange: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      aria-checked={on}
      aria-label={label}
      className={`flex h-6 w-11 items-center rounded-full border p-0.5 transition-colors disabled:opacity-50 ${on ? "justify-end border-[#b9dbc6] bg-allow" : "justify-start border-line bg-[#e3e9e7]"}`}
      disabled={disabled}
      onClick={onChange}
      role="switch"
      type="button"
    >
      <motion.span
        className="size-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)]"
        layout
        transition={{ type: "spring", stiffness: 600, damping: 32 }}
      />
    </button>
  );
}
