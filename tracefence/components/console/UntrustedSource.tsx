"use client";

import type { Decision, EventDTO } from "@/components/api/types";
import { useAppState } from "@/components/shell/AppState";
import { ClassBadge } from "@/components/ui/ClassBadge";
import { DecisionChip } from "@/components/ui/DecisionChip";
import { Icon, toolIcon } from "@/components/ui/Icon";
import { ROLE_LABEL, SEED_DOCUMENTS, docTitle } from "./catalog";
import { Column } from "./Column";
import { externalRecipients, highlightSegments, isInjection, scanForInjection } from "./injection";

const CLASS_OF: Record<string, string> = Object.fromEntries(SEED_DOCUMENTS.map((d) => [d.id, d.classification]));

/** Wraps text into ~46-char display lines so the preview can carry a line-number gutter. */
function wrapLines(text: string, width = 46) {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      if ((line + " " + word).trim().length > width && line) {
        out.push(line);
        line = word;
      } else line = line ? `${line} ${word}` : word;
    }
    out.push(line);
  }
  return out;
}

/**
 * What the agent was exposed to on the latest turn: the untrusted instruction, which sources
 * the ACL let into context, which it fenced out, and the call the model then proposed.
 */
export function UntrustedSource() {
  const { messages, events, turnFrom, session, role } = useAppState();
  const userTurns = messages.filter((m) => m.from === "user");
  const lastUser = userTurns[userTurns.length - 1];
  const lastAssistant = [...messages].reverse().find((m) => m.from === "assistant");
  const turn = events.slice(turnFrom);
  const srcId = `SRC-${String(userTurns.length).padStart(2, "0")}`;

  const flags = lastUser ? scanForInjection(lastUser.text) : [];
  const injected = isInjection(flags);
  const targets = lastUser ? externalRecipients(lastUser.text) : [];
  const filterEv = turn.find((e) => e.reasonCode === "RETRIEVAL_FILTERED");
  const fencedOut = Array.isArray(filterEv?.argsPreview?.filteredOut) ? (filterEv.argsPreview.filteredOut as string[]) : [];
  const searchEv = turn.find((e) => e.tool === "search_docs" && e.reasonCode !== "RETRIEVAL_FILTERED");
  const entered = lastAssistant?.citations?.length
    ? lastAssistant.citations.map((c) => ({ id: c.docId, classification: String(c.classification) }))
    : (searchEv?.docIds ?? []).map((id) => ({ id, classification: CLASS_OF[id] ?? "public" }));
  const proposal = [...turn].reverse().find((e) => e.tool && e.tool !== "search_docs");
  const lines = lastUser ? wrapLines(lastUser.text) : [];

  return (
    <Column
      footer={
        <>
          <Icon name="lock" size={12} />
          Source text cannot change role, classification or tool policy.
        </>
      }
      index="02"
      meta={<span className="font-mono text-[11px] text-faint">{lastUser ? srcId : "no source"}</span>}
      title="Untrusted source"
    >
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {!lastUser ? (
          <p className="m-0 max-w-[340px] px-4 py-4 text-[12.5px] leading-relaxed text-faint">
            The latest untrusted input appears here with any embedded instructions marked, alongside the sources the access policy let
            into the model&apos;s context.
          </p>
        ) : (
          <>
            {/* Source record */}
            <div className="border-b border-line px-4 py-3">
              <dl className="m-0 mb-2.5 grid grid-cols-[auto_1fr_auto_1fr] gap-x-3 gap-y-1 text-[11.5px]">
                <dt className="text-faint">Origin</dt>
                <dd className="m-0 text-muted">Operator input</dd>
                <dt className="text-faint">Identity</dt>
                <dd className="m-0 text-muted">{ROLE_LABEL[session?.role ?? role]}</dd>
                <dt className="text-faint">Trust</dt>
                <dd className="m-0 text-muted">Untrusted · data only</dd>
                <dt className="text-faint">Session</dt>
                <dd className="m-0 truncate font-mono text-[11px] text-muted">{session?.sessionId ?? "—"}</dd>
              </dl>

              <div className="overflow-hidden rounded-[4px] border border-line bg-canvas">
                <div className="flex h-7 items-center justify-between border-b border-line px-3 font-mono text-[10.5px] text-faint">
                  <span>{srcId}.txt</span>
                  <span>{lastUser.text.length} chars</span>
                </div>
                <div className="py-2 font-mono text-[12px] leading-[1.7]">
                  {lines.map((line, i) => {
                    const segs = highlightSegments(line);
                    const hot = segs.some((s) => s.flagged);
                    return (
                      <div className={`grid grid-cols-[36px_1fr] ${hot ? "bg-inject-soft/40" : ""}`} key={i}>
                        <span className={`pr-3 text-right select-none ${hot ? "text-inject" : "text-faint/70"}`}>{i + 1}</span>
                        <span className="pr-3 break-words text-ink/90">
                          {segs.map((seg, j) =>
                            seg.flagged ? (
                              <mark className="mark-inject" key={j}>
                                {seg.text}
                              </mark>
                            ) : (
                              <span key={j}>{seg.text}</span>
                            ),
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {flags.length > 0 && (
              <div className={`border-b border-line border-l-[3px] px-4 py-3 ${injected ? "border-l-deny bg-deny-soft" : "border-l-approval bg-approval-soft"}`}>
                <div className="flex items-center gap-2">
                  <Icon className={injected ? "text-deny" : "text-approval"} name="alert" size={14} />
                  <strong className={`text-[13px] font-semibold ${injected ? "text-deny" : "text-approval"}`}>
                    {injected ? "Malicious instruction in source" : "Sensitive request"}
                  </strong>
                  <span className="ml-auto font-mono text-[10.5px] text-faint">
                    {flags.length} match{flags.length === 1 ? "" : "es"}
                  </span>
                </div>
                <p className="mt-1.5 mb-2 text-[12.5px] leading-relaxed text-ink/85">
                  {injected
                    ? "The text tries to override instructions or claim authority it does not have. It is passed to the model as data; any tool call it induces is still authorized against the session’s real role."
                    : "The request touches bulk or external data. The gateway decides whether it runs — not the wording of the request."}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px]">
                  {[...new Set(flags.map((f) => f.label))].map((label) => (
                    <span className="text-muted" key={label}>
                      <span className={injected ? "text-deny" : "text-approval"}>▸</span> {label.toLowerCase()}
                    </span>
                  ))}
                </div>
                {targets.length > 0 && (
                  <p className="mt-2 mb-0 text-[12px] text-muted">
                    Exfiltration target <code className="font-mono text-[12px] text-deny">{targets.join(", ")}</code>
                  </p>
                )}
              </div>
            )}

            {/* Context fence */}
            <div className="border-b border-line">
              <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                <span className="label">Context fence</span>
                <span className="font-mono text-[10.5px] text-faint">
                  {entered.length} in · {fencedOut.length} out
                </span>
              </div>
              {entered.length + fencedOut.length === 0 ? (
                <p className="m-0 px-4 pb-3 text-[12px] text-faint">No documents matched this request.</p>
              ) : (
                <table className="w-full border-collapse text-[12px]">
                  <tbody>
                    {entered.map((d) => (
                      <FenceRow classification={d.classification} id={d.id} inContext key={`in-${d.id}`} />
                    ))}
                    {fencedOut.map((id) => (
                      <FenceRow classification={CLASS_OF[id] ?? "confidential"} id={id} inContext={false} key={`out-${id}`} />
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {proposal && <Proposal event={proposal} />}
          </>
        )}
      </div>
    </Column>
  );
}

function FenceRow({ id, classification, inContext }: { id: string; classification: string; inContext: boolean }) {
  return (
    <tr className="border-t border-line-soft">
      <td className="w-9 py-1.5 pr-2 pl-4">
        <Icon className={inContext ? "text-faint" : "text-deny"} name={inContext ? "file" : "lock"} size={12} />
      </td>
      <td className={`py-1.5 pr-2 ${inContext ? "text-ink" : "text-faint line-through decoration-faint/60"}`}>{docTitle(id)}</td>
      <td className="py-1.5 pr-3">
        <ClassBadge value={classification} />
      </td>
      <td className={`py-1.5 pr-4 text-right font-mono text-[10.5px] ${inContext ? "text-muted" : "text-deny"}`}>{inContext ? "in context" : "fenced"}</td>
    </tr>
  );
}

function Proposal({ event }: { event: EventDTO }) {
  const decision = (event.decision ?? "DENY") as Decision;
  return (
    <div className="px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="label">Proposed by the model</span>
        <DecisionChip decision={decision} />
      </div>
      <div className="flex items-center gap-2 text-[13px]">
        <Icon className="text-faint" name={toolIcon(event.tool)} size={14} />
        <code className="font-mono text-[12.5px] text-ink">{event.tool}</code>
        <span className="font-mono text-[11px] text-faint">({Object.keys(event.argsPreview ?? {}).length} args)</span>
      </div>
      <pre className="mt-2 mb-0 overflow-x-auto rounded-[4px] border border-line bg-canvas px-3 py-2 font-mono text-[11.5px] leading-relaxed text-muted">
        {JSON.stringify(event.argsPreview ?? {}, null, 2)}
      </pre>
    </div>
  );
}
