"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { CLASSIFICATIONS, type Classification, type OrgDocumentDTO } from "@/components/api/types";
import { ClassBadge } from "@/components/ui/ClassBadge";
import { Icon } from "@/components/ui/Icon";
import { panelVariants } from "./motion";

function relative(ts?: string) {
  if (!ts) return "Seed";
  const mins = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  return new Date(ts).toLocaleDateString();
}

const inputCls = "field";

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
      className="panel mt-5 overflow-hidden"
      variants={panelVariants}
    >
      <div className="flex h-11 items-center justify-between border-b border-line px-4">
        <div>
          <h2 className="m-0 inline text-[13px] font-semibold">Documents</h2>
          <p className="m-0 ml-3 inline text-[12px] text-faint">Classify before save. Content cannot self-elevate permissions.</p>
        </div>
        <span className="font-mono text-xs text-faint">{docs.length} sources</span>
      </div>

      <div className="grid items-center gap-2 border-b border-line bg-canvas px-4 py-3 lg:grid-cols-[1.4fr_1fr_auto_auto]">
        <motion.button
          animate={{ borderColor: dragging ? "#3461d1" : "#cbc5b9" }}
          className="flex items-center gap-2.5 rounded-[4px] border border-dashed bg-surface px-3 py-2 text-left text-muted hover:text-ink disabled:opacity-60"
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
          className="btn"
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
        <div className="grid min-h-[36px] grid-cols-[2fr_1fr_.9fr_.7fr_.55fr] items-center gap-2.5 border-b border-line px-4 text-[11px] font-medium text-faint">
          <span>Title</span>
          <span>Classification</span>
          <span>Collection</span>
          <span>Updated</span>
          <span>Enabled</span>
        </div>
        <AnimatePresence initial={false}>
          {docs.map((doc) => (
            <motion.div
              animate={{ opacity: 1, height: "auto", backgroundColor: "rgba(76,194,255,0)" }}
              className="grid min-h-[46px] grid-cols-[2fr_1fr_.9fr_.7fr_.55fr] items-center gap-2.5 border-b border-line-soft px-4 text-[13px] last:border-b-0"
              initial={{ opacity: 0, height: 0, backgroundColor: "rgba(76,194,255,.16)" }}
              key={doc.id}
              layout
              transition={{ duration: 0.35, backgroundColor: { duration: 1.6 } }}
            >
              <span className={doc.enabled ? "" : "opacity-50"}>
                <strong className="block text-[13px] font-medium">{doc.title}</strong>
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
      className={`flex h-5 w-9 items-center rounded-full border p-[1px] transition-colors disabled:opacity-50 ${on ? "justify-end border-allow bg-allow" : "justify-start border-line-strong bg-surface-raised"}`}
      disabled={disabled}
      onClick={onChange}
      role="switch"
      type="button"
    >
      <motion.span
        className="size-[16px] rounded-full bg-white shadow-[0_1px_2px_rgba(31,35,41,.25)]"
        layout
        transition={{ type: "spring", stiffness: 600, damping: 32 }}
      />
    </button>
  );
}
