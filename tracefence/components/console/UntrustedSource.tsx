"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Decision, EventDTO } from "@/components/api/types";
import { useAppState } from "@/components/shell/AppState";
import { ClassBadge } from "@/components/ui/ClassBadge";
import { DecisionChip } from "@/components/ui/DecisionChip";
import { Icon, toolIcon } from "@/components/ui/Icon";
import { ROLE_LABEL, SEED_DOCUMENTS, docTitle } from "./catalog";
import { externalRecipients, highlightSegments, isInjection, scanForInjection } from "./injection";
import { PanelHeader } from "./MissionControl";

const CLASS_OF: Record<string, string> = Object.fromEntries(SEED_DOCUMENTS.map((d) => [d.id, d.classification]));

/**
 * What the agent was exposed to on the latest turn: the untrusted instruction itself, which
 * sources the ACL let into context, which it fenced out, and the action the model proposed.
 */
export function UntrustedSource() {
  const { messages, events, turnFrom, session, role } = useAppState();
  const lastUser = [...messages].reverse().find((m) => m.from === "user");
  const lastAssistant = [...messages].reverse().find((m) => m.from === "assistant");
  const turn = events.slice(turnFrom);

  const flags = lastUser ? scanForInjection(lastUser.text) : [];
  const targets = lastUser ? externalRecipients(lastUser.text) : [];
  const injected = isInjection(flags);
  const filterEv = turn.find((e) => e.reasonCode === "RETRIEVAL_FILTERED");
  const fencedOut = Array.isArray(filterEv?.argsPreview?.filteredOut) ? (filterEv.argsPreview.filteredOut as string[]) : [];
  const searchEv = turn.find((e) => e.tool === "search_docs" && e.reasonCode !== "RETRIEVAL_FILTERED");
  const entered = lastAssistant?.citations?.length
    ? lastAssistant.citations
    : (searchEv?.docIds ?? []).map((docId) => ({ docId, classification: CLASS_OF[docId] ?? "public" }));
  const proposal = [...turn].reverse().find((e) => e.tool && e.tool !== "search_docs");

  return (
    <section className="glass flex min-h-[560px] flex-col overflow-hidden rounded-2xl xl:min-h-0">
      <PanelHeader
        eyebrow="02 · Untrusted source"
        right={
          <span className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 font-mono text-[10px] font-semibold text-muted">
            <Icon name="eye" size={12} />
            TREATED AS DATA
          </span>
        }
        title="What the agent read"
      />

      <div className="scroll-thin min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {!lastUser ? (
          <Empty />
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-3" initial={{ opacity: 0, y: 10 }} key={lastUser.id}>
              {/* Inbound content preview */}
              <div className="overflow-hidden rounded-xl border border-line bg-black/30">
                <div className="flex items-center gap-2 border-b border-line bg-white/[.02] px-3 py-2">
                  <span className="flex gap-1">
                    <i className="size-2 rounded-full bg-deny/60" />
                    <i className="size-2 rounded-full bg-approval/60" />
                    <i className="size-2 rounded-full bg-allow/60" />
                  </span>
                  <code className="flex-1 truncate rounded-md bg-black/40 px-2 py-0.5 font-mono text-[10px] text-faint">
                    tracefence://{session?.tenantId ?? "tenant"}/{session?.sessionId ?? "session"}/input
                  </code>
                  <span className="font-mono text-[9px] tracking-wider text-faint uppercase">{ROLE_LABEL[session?.role ?? role]}</span>
                </div>
                <p className="m-0 px-3.5 py-3 font-mono text-[12.5px] leading-relaxed break-words text-ink/90">
                  {highlightSegments(lastUser.text).map((seg, i) =>
                    seg.flagged ? (
                      <motion.mark
                        animate={{ backgroundColor: ["rgba(255,216,77,.45)", "rgba(255,216,77,.2)"] }}
                        className="mark-inject"
                        key={i}
                        transition={{ duration: 1.2, delay: 0.2 + i * 0.05 }}
                      >
                        {seg.text}
                      </motion.mark>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    ),
                  )}
                </p>
              </div>

              {flags.length > 0 && (
                <motion.div
                  animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-xl border p-3 ${injected ? "glow-deny border-deny/45 bg-deny-soft" : "border-approval/40 bg-approval-soft"}`}
                  initial={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="flex items-center gap-2">
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      className={`grid size-7 place-items-center rounded-lg ${injected ? "bg-deny/20 text-deny" : "bg-approval/20 text-approval"}`}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    >
                      <Icon name="alert" size={15} />
                    </motion.span>
                    <div>
                      <strong className={`block text-[13px] ${injected ? "text-deny" : "text-approval"}`}>
                        {injected ? "Prompt injection detected" : "Sensitive request flagged"}
                      </strong>
                      <span className="text-[11px] text-ink/70">
                        {flags.length} suspicious pattern{flags.length === 1 ? "" : "s"} · {injected ? "this text carries no authority" : "the gateway decides, not the text"}
                      </span>
                    </div>
                  </div>
                  <ul className="mt-2.5 mb-0 flex flex-wrap gap-1.5 p-0">
                    {[...new Set(flags.map((f) => f.label))].map((label) => (
                      <li className="list-none rounded-md border border-deny/30 bg-black/25 px-2 py-0.5 font-mono text-[10px] text-deny" key={label}>
                        {label}
                      </li>
                    ))}
                  </ul>
                  {targets.length > 0 && (
                    <p className="mt-2.5 mb-0 flex items-center gap-1.5 text-[11px] text-ink/80">
                      <Icon className="text-deny" name="mail" size={12} />
                      Exfiltration target:
                      <code className="font-mono text-[11px] font-semibold text-deny">{targets.join(", ")}</code>
                    </p>
                  )}
                  <p className="mt-2 mb-0 text-[10.5px] leading-snug text-faint">
                    Flagged by console heuristics for review. Enforcement happens in the server gateway on identity + policy.
                  </p>
                </motion.div>
              )}

              {/* Context fence */}
              <div className="grid grid-cols-1 gap-2">
                <SourceColumn
                  docs={entered.map((c) => ({ id: c.docId, classification: String(c.classification) }))}
                  empty="No document matched"
                  label="Entered context"
                  tone="allow"
                />
                <SourceColumn
                  docs={fencedOut.map((id) => ({ id, classification: CLASS_OF[id] ?? "confidential" }))}
                  empty="Role sees all matches"
                  label="Fenced out by ACL"
                  tone="deny"
                />
              </div>

              {proposal && <ProposalCard event={proposal} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <div className="flex min-h-[36px] items-center gap-1.5 border-t border-line bg-black/20 px-4 text-[11px] text-faint">
        <Icon className="text-neon" name="lock" size={12} />
        Source text cannot elevate role, classification or tool policy.
      </div>
    </section>
  );
}

function SourceColumn({
  label,
  docs,
  tone,
  empty,
}: {
  label: string;
  docs: Array<{ id: string; classification: string }>;
  tone: "allow" | "deny";
  empty: string;
}) {
  return (
    <div className={`rounded-xl border p-2.5 ${tone === "allow" ? "border-allow/20 bg-allow-soft/40" : "border-deny/20 bg-deny-soft/40"}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`font-mono text-[9.5px] font-semibold tracking-[.1em] uppercase ${tone === "allow" ? "text-allow" : "text-deny"}`}>
          {label}
        </span>
        <span className={`font-mono text-sm font-semibold ${tone === "allow" ? "text-allow" : "text-deny"}`}>{docs.length}</span>
      </div>
      {docs.length === 0 ? (
        <p className="m-0 text-[11px] text-faint">{empty}</p>
      ) : (
        <ul className="m-0 space-y-1.5 p-0">
          {docs.map((d, i) => (
            <motion.li
              animate={{ opacity: 1, x: 0 }}
              className="flex list-none items-center gap-1.5 rounded-md border border-line bg-black/25 px-2 py-1.5"
              initial={{ opacity: 0, x: tone === "allow" ? -6 : 6 }}
              key={d.id}
              transition={{ delay: 0.2 + i * 0.06 }}
            >
              <Icon className={tone === "allow" ? "text-allow" : "text-deny"} name={tone === "allow" ? "file" : "lock"} size={12} />
              <span className={`min-w-0 flex-1 truncate text-[11px] ${tone === "deny" ? "text-muted line-through decoration-deny/50" : "text-ink"}`}>
                {docTitle(d.id)}
              </span>
              <ClassBadge value={d.classification} />
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProposalCard({ event }: { event: EventDTO }) {
  const decision = (event.decision ?? "DENY") as Decision;
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-line bg-black/25 p-3"
      initial={{ opacity: 0, y: 8 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9.5px] font-semibold tracking-[.1em] text-faint uppercase">Model-proposed action</span>
        <DecisionChip decision={decision} glow={decision !== "ALLOW"} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-white/5 text-ink">
          <Icon name={toolIcon(event.tool)} size={14} />
        </span>
        <code className="font-mono text-[13px] font-semibold text-ink">{event.tool}</code>
      </div>
      <pre className="mt-2 mb-0 overflow-x-auto rounded-lg border border-line bg-black/40 p-2 font-mono text-[11px] leading-relaxed text-muted">
        {JSON.stringify(event.argsPreview ?? {}, null, 2)}
      </pre>
    </motion.div>
  );
}

function Empty() {
  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
      <span className="grid size-12 place-items-center rounded-2xl border border-line bg-white/[.03] text-faint">
        <Icon name="globe" size={22} />
      </span>
      <h3 className="mt-3 mb-1 font-display text-base font-semibold text-ink">No source yet</h3>
      <p className="m-0 max-w-[280px] text-xs leading-relaxed text-muted">
        The instruction, retrieved sources and any injected text appear here — inspected, never obeyed.
      </p>
    </div>
  );
}
