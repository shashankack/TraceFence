"use client";

import { FileText, Lock, ScanSearch, TriangleAlert } from "lucide-react";
import type { Decision } from "@/components/api/types";
import { SEED_DOCUMENTS, docTitle } from "@/components/domain/catalog";
import { externalRecipients, highlightSegments, isInjection, scanForInjection } from "@/components/domain/injection";
import { cn } from "@/components/lib/utils";
import { BentoTile } from "@/components/ui/bento";
import { ClassLabel, DecisionBadge } from "@/components/ui/decision-badge";
import { useWorkspace } from "./WorkspaceProvider";

const CLASS_OF: Record<string, string> = Object.fromEntries(SEED_DOCUMENTS.map((d) => [d.id, d.classification]));

function wrapLines(text: string, width = 60) {
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

/** The latest untrusted input, any instructions embedded in it, and the context fence the ACL built. */
export function SourceTile({ className }: { className?: string }) {
  const { messages, events, turnFrom } = useWorkspace();
  const userTurns = messages.filter((m) => m.from === "user");
  const lastUser = userTurns[userTurns.length - 1];
  const lastAssistant = [...messages].reverse().find((m) => m.from === "assistant");
  const turn = events.slice(turnFrom);

  const flags = lastUser ? scanForInjection(lastUser.text) : [];
  const injected = isInjection(flags);
  const targets = lastUser ? externalRecipients(lastUser.text) : [];
  const filterEv = turn.find((e) => e.reasonCode === "RETRIEVAL_FILTERED");
  const fenced = Array.isArray(filterEv?.argsPreview?.filteredOut) ? (filterEv.argsPreview.filteredOut as string[]) : [];
  const searchEv = turn.find((e) => e.tool === "search_docs" && e.reasonCode !== "RETRIEVAL_FILTERED");
  const entered = lastAssistant?.citations?.length
    ? lastAssistant.citations.map((c) => ({ id: c.docId, classification: String(c.classification) }))
    : (searchEv?.docIds ?? []).map((id) => ({ id, classification: CLASS_OF[id] ?? "public" }));
  const proposal = [...turn].reverse().find((e) => e.tool && e.tool !== "search_docs");
  const srcId = `SRC-${String(userTurns.length).padStart(2, "0")}`;

  return (
    <BentoTile className={className} icon={ScanSearch} kicker={lastUser ? `${srcId} · untrusted input` : "untrusted input"} title="Source inspector">
      {!lastUser ? (
        <p className="m-0 px-5 py-5 text-sm text-muted-foreground">
          Nothing inspected yet. When you send a message, the raw input is shown here with any embedded instructions highlighted.
        </p>
      ) : (
        <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[1.25fr_1fr] md:divide-x">
          <div className="flex min-w-0 flex-col gap-3 p-5">
            <div className="overflow-hidden rounded-lg border bg-muted/40">
              <div className="flex h-8 items-center justify-between border-b bg-white px-3 font-mono text-[10.5px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-deny/50" />
                  <span className="size-2 rounded-full bg-approval/50" />
                  <span className="size-2 rounded-full bg-allow/50" />
                  <span className="ml-2">{srcId}.txt</span>
                </span>
                <span>{lastUser.text.length} chars</span>
              </div>
              <div className="py-2 font-mono text-[12.5px] leading-[1.75]">
                {wrapLines(lastUser.text).map((line, i) => {
                  const segs = highlightSegments(line);
                  const hot = segs.some((s) => s.flagged);
                  return (
                    <div className={cn("grid grid-cols-[34px_1fr]", hot && "bg-inject/25")} key={i}>
                      <span className={cn("pr-3 text-right select-none", hot ? "text-[#9a7400]" : "text-muted-foreground/60")}>{i + 1}</span>
                      <span className="pr-3 break-words">
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

            {flags.length > 0 && (
              <div className={cn("rounded-lg border p-3.5", injected ? "border-deny/25 bg-deny-soft/70" : "border-approval/25 bg-approval-soft/70")}>
                <div className="flex items-center gap-2">
                  <TriangleAlert className={cn("size-4", injected ? "text-deny" : "text-approval")} />
                  <strong className={cn("text-sm font-semibold", injected ? "text-deny" : "text-approval")}>
                    {injected ? "Malicious instruction detected" : "Sensitive request"}
                  </strong>
                  <span className="ml-auto font-mono text-[10.5px] text-muted-foreground">{flags.length} matches</span>
                </div>
                <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-foreground/80">
                  {injected
                    ? "This text tries to override instructions or claim authority. It reaches the model as data only — any tool call it induces is still checked against your real role."
                    : "This touches bulk or external data. The gateway decides whether it runs, not the wording."}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[...new Set(flags.map((f) => f.label))].map((l) => (
                    <span className="rounded-md border bg-white px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground" key={l}>
                      {l.toLowerCase()}
                    </span>
                  ))}
                </div>
                {targets.length > 0 && (
                  <p className="mt-2 mb-0 text-xs text-muted-foreground">
                    Exfiltration target <code className="font-mono font-medium text-deny">{targets.join(", ")}</code>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <span className="kicker">Context fence</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {entered.length} in · {fenced.length} out
              </span>
            </div>
            {entered.length + fenced.length === 0 ? (
              <p className="m-0 px-5 text-sm text-muted-foreground">No documents matched.</p>
            ) : (
              <ul className="m-0 list-none px-3 pb-2">
                {entered.map((d) => (
                  <li className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm" key={`in-${d.id}`}>
                    <FileText className="size-3.5 text-primary" />
                    <span className="min-w-0 flex-1 truncate">{docTitle(d.id)}</span>
                    <ClassLabel value={d.classification} />
                  </li>
                ))}
                {fenced.map((id) => (
                  <li className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm" key={`out-${id}`}>
                    <Lock className="size-3.5 text-violet" />
                    <span className="min-w-0 flex-1 truncate text-muted-foreground line-through decoration-muted-foreground/40">{docTitle(id)}</span>
                    <span className="font-mono text-[11px] text-violet">fenced</span>
                  </li>
                ))}
              </ul>
            )}

            {proposal && (
              <div className="mt-auto border-t px-5 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="kicker">Model proposed</span>
                  <DecisionBadge decision={(proposal.decision ?? "DENY") as Decision} />
                </div>
                <code className="font-mono text-[13px] font-medium">{proposal.tool}</code>
                <pre className="mt-2 mb-0 overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
                  {JSON.stringify(proposal.argsPreview ?? {}, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </BentoTile>
  );
}
