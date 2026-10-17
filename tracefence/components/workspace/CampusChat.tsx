"use client";

import {
  ArrowUp,
  Bot,
  FileText,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Menu,
  MessageSquarePlus,
  Paperclip,
  PanelLeftClose,
  PanelLeft,
  ShieldAlert,
  Trash2,
  User,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/components/api/client";
import { LoginGate } from "@/components/auth/LoginGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { docTitle } from "@/components/domain/catalog";
import { cn } from "@/components/lib/utils";
import { roleLabelFor } from "@/components/shell/nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ClassLabel } from "@/components/ui/decision-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Logo } from "@/components/ui/logo";
import { AnimatedItem } from "@/components/ui/motion/animated-item";
import { BlurFade } from "@/components/ui/motion/blur-fade";
import { Pressable } from "@/components/ui/motion/pressable";
import {
  LOADING_CHAT_PHRASES,
  StatusCycle,
  THINKING_PHRASES,
} from "@/components/ui/motion/status-cycle";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace, type ChatMessage } from "./WorkspaceProvider";

type PendingUpload = {
  id: string;
  filename: string;
  status: "ready" | "flagged" | "blocked";
  flags: number;
};

type ChatRole = "guest" | "student" | "faculty";

function initials(name?: string | null, email?: string) {
  const src = name || email || "?";
  return src
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const STARTERS: Record<ChatRole, string[]> = {
  guest: [
    "What time is hostel curfew on weekdays?",
    "What are the exam rules for missed tests?",
    "When is the library open?",
  ],
  student: [
    "What time is hostel curfew on weekdays?",
    "What are the exam rules for missed tests?",
    "When is the library open?",
  ],
  faculty: [
    "What does faculty guidance say about sharing advisee records?",
    "What happens if a student misses a written exam?",
    "Summarize the public hostel curfew rules.",
  ],
};

/**
 * Shared student/faculty experience: sidebar + main chat (ChatGPT-style).
 * Gateway details stay out of the way  citations appear under answers when relevant.
 */
export function CampusChat({ role }: { role: ChatRole }) {
  const { user, logout } = useAuth();
  const {
    messages,
    sending,
    switching,
    send,
    reset,
    session,
    sessionError,
    requests,
    history,
    openHistory,
    deleteHistory,
    loginGateOpen,
    loginGateReason,
    openLoginGate,
    closeLoginGate,
    afterLoginContinue,
  } = useWorkspace();
  const busy = sending || switching;
  const router = useRouter();
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<{
    sessionId: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pending = requests.filter((r) => r.status === "PENDING").length;
  const chatRole: ChatRole =
    role === "faculty"
      ? "faculty"
      : user?.role === "guest"
        ? "guest"
        : "student";
  const canUpload = chatRole !== "guest";

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, sending]);

  useEffect(() => {
    setUploads([]);
  }, [session?.sessionId]);

  const onPickFile = async (file: File | null) => {
    if (!file || !session || !canUpload) return;
    if (uploads.length >= 5) {
      toast.error("At most 5 files per message");
      return;
    }
    setUploading(true);
    try {
      const lower = file.name.toLowerCase();
      const isPdf = lower.endsWith(".pdf");
      let body: { filename: string; content?: string; pdfBase64?: string };
      if (isPdf) {
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++)
          binary += String.fromCharCode(bytes[i]!);
        body = { filename: file.name, pdfBase64: btoa(binary) };
      } else {
        body = { filename: file.name, content: await file.text() };
      }
      const res = await api.uploadSessionAttachment(session.sessionId, body);
      setUploads((prev) => [
        ...prev,
        {
          id: res.upload.id,
          filename: res.upload.filename,
          status: res.upload.status,
          flags: res.upload.flags.length,
        },
      ]);
      if (res.upload.status === "blocked") {
        toast.error("Upload blocked", { description: res.notice });
      } else if (res.upload.status === "flagged") {
        toast.warning("Upload sanitized (flagged)", {
          description: res.notice,
        });
      } else {
        toast.success("Upload sanitized", { description: res.notice });
      }
    } catch (err) {
      toast.error("Upload failed", {
        description:
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Unknown error",
      });
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    const usable = uploads.filter((u) => u.status !== "blocked");
    if ((!input.trim() && usable.length === 0) || busy || !session) return;
    send(input, {
      attachmentIds: usable.map((u) => u.id),
      attachments: usable.map((u) => ({
        id: u.id,
        filename: u.filename,
        status: u.status,
      })),
    });
    setInput("");
    setUploads([]);
  };

  const signOut = async () => {
    await logout();
    router.replace("/login");
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteHistory(pendingDelete.sessionId);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-[#f7f7f8]">
      <div className="border-b border-black/5 px-3 py-3">
        <Logo className="max-w-full" />
        <p className="mt-1.5 mb-0 truncate text-[11px] text-muted-foreground">
          {roleLabelFor(user?.role ?? role, user?.orgType, user?.roleLabels)}{" "}
          chat
        </p>
      </div>

      <div className="p-3">
        <Button
          className="w-full justify-start gap-2 rounded-xl border bg-white shadow-sm"
          disabled={busy}
          onClick={reset}
          variant="outline"
        >
          <MessageSquarePlus className="size-4" />
          New chat
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {chatRole === "guest" ? (
          <p className="px-2 py-1 text-[12px] leading-snug text-muted-foreground">
            Guest chats are not saved. Sign in to keep a history across visits.
          </p>
        ) : (
          <>
            <p className="mb-1.5 px-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Chats
            </p>
            {history.length === 0 ? (
              <p className="px-2 py-1 text-[12px] text-muted-foreground">
                No past chats yet.
              </p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {history.map((h) => {
                  const active = session?.sessionId === h.sessionId;
                  return (
                    <div
                      className={cn(
                        "group flex items-start gap-0.5 rounded-lg transition-colors",
                        active ? "bg-white shadow-sm" : "hover:bg-black/5",
                      )}
                      key={h.sessionId}
                    >
                      <button
                        className={cn(
                          "min-w-0 flex-1 px-2.5 py-2 text-left text-[13px] leading-snug",
                          active ? "font-medium" : "text-foreground/80",
                        )}
                        disabled={busy}
                        onClick={() => void openHistory(h.sessionId)}
                        type="button"
                      >
                        <span className="line-clamp-2">{h.title}</span>
                      </button>
                      <button
                        aria-label={`Delete chat: ${h.title}`}
                        className="mt-1 mr-1 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-deny-soft hover:text-deny group-hover:opacity-100 focus:opacity-100 disabled:opacity-40"
                        disabled={busy || deleting}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete({
                            sessionId: h.sessionId,
                            title: h.title,
                          });
                        }}
                        type="button"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {messages.length === 0 && (
          <div className="mt-4 px-1">
            <p className="mb-1.5 px-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Try asking
            </p>
            <div className="flex flex-col gap-0.5">
              {STARTERS[chatRole].map((q) => (
                <button
                  className="rounded-lg px-2.5 py-2 text-left text-[13px] leading-snug text-foreground/80 transition-colors hover:bg-black/5 disabled:opacity-40"
                  disabled={busy || !session}
                  key={q}
                  onClick={() => send(q)}
                  type="button"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {role === "faculty" && pending > 0 && (
        <div className="mx-3 mb-2 rounded-xl border border-approval/30 bg-approval-soft/80 px-3 py-2.5 text-xs text-approval">
          {pending} export request{pending === 1 ? "" : "s"} waiting on an
          admin.
        </div>
      )}

      {user?.role === "guest" && (
        <div className="mx-3 mb-2 rounded-xl border border-dashed bg-white px-3 py-2.5 text-xs text-muted-foreground">
          Public campus PDFs only. Sign in when a question needs more access.
        </div>
      )}

      <div className="border-t border-black/5 p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {user?.role === "guest"
                ? "G"
                : initials(user?.displayName, user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-sm font-medium">
              {user?.role === "guest" ? "Guest" : (user?.displayName ?? "User")}
            </p>
            <p className="m-0 truncate text-[11px] text-muted-foreground">
              {user?.role === "guest"
                ? "Public access · not signed in"
                : user?.email}
            </p>
          </div>
          {user?.role === "guest" ? (
            <Button
              aria-label="Sign in"
              className="shrink-0 gap-1.5"
              onClick={() => openLoginGate()}
              size="sm"
              variant="outline"
            >
              <LogIn className="size-3.5" />
              Sign in
            </Button>
          ) : (
            <Button
              aria-label="Sign out"
              onClick={() => void signOut()}
              size="icon"
              variant="ghost"
            >
              <LogOut className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-svh min-h-0 w-full bg-white">
      <LoginGate
        open={loginGateOpen}
        reason={loginGateReason}
        onClose={closeLoginGate}
        onSignedIn={() => afterLoginContinue()}
      />

      <Dialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={!deleting}>
          <DialogHeader>
            <DialogTitle>Delete this chat?</DialogTitle>
            <DialogDescription>
              {pendingDelete ? (
                <>
                  <span className="font-medium text-foreground">
                    &ldquo;{pendingDelete.title}&rdquo;
                  </span>{" "}
                  will be removed permanently. This cannot be undone.
                </>
              ) : (
                "This chat will be removed permanently."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={deleting}
              onClick={() => setPendingDelete(null)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={deleting}
              onClick={() => void confirmDelete()}
              type="button"
              variant="destructive"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete chat"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden h-full flex-none flex-col border-r border-black/5 transition-[width] md:flex",
          sidebarOpen ? "w-[260px]" : "w-0 overflow-hidden border-0",
        )}
      >
        {sidebarOpen && sidebar}
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 flex-none items-center gap-2 border-b border-black/5 px-3 sm:px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                aria-label="Open menu"
                className="md:hidden"
                size="icon"
                variant="ghost"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[280px] p-0" side="left">
              <SheetTitle className="sr-only">Chat menu</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>

          <Button
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            className="hidden md:inline-flex"
            onClick={() => setSidebarOpen((v) => !v)}
            size="icon"
            variant="ghost"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-5" />
            ) : (
              <PanelLeft className="size-5" />
            )}
          </Button>

          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-sm font-medium">Campus assistant</p>
          </div>

          <Button
            className="hidden gap-1.5 sm:inline-flex"
            disabled={busy}
            onClick={reset}
            size="sm"
            variant="ghost"
          >
            <MessageSquarePlus className="size-4" />
            New chat
          </Button>
        </header>

        <div
          className="scroll-thin min-h-0 flex-1 overflow-y-auto"
          ref={scrollRef}
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
            {sessionError ? (
              <p className="m-0 rounded-xl border border-deny/25 bg-deny-soft/50 px-4 py-3 text-sm text-deny">
                Could not start chat: {sessionError}
              </p>
            ) : switching && messages.length === 0 ? (
              <div className="flex min-h-[40vh] items-center justify-center gap-2.5">
                <span className="relative flex size-4 items-center justify-center">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/25" />
                  <Loader2 className="relative size-4 animate-spin text-primary" />
                </span>
                <StatusCycle phrases={LOADING_CHAT_PHRASES} />
              </div>
            ) : messages.length === 0 && !sending ? (
              <EmptyState
                onPick={(q) => send(q)}
                ready={!!session && !switching}
                role={chatRole}
                sending={busy}
              />
            ) : (
              <>
                {messages.map((m) => (
                  <AnimatedItem key={m.id}>
                    <Bubble message={m} />
                  </AnimatedItem>
                ))}
                {switching && (
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex size-4 items-center justify-center">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/25" />
                      <Loader2 className="relative size-4 animate-spin text-primary" />
                    </span>
                    <StatusCycle phrases={LOADING_CHAT_PHRASES} />
                  </div>
                )}
                {sending && !switching && (
                  <AnimatedItem>
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex size-4 items-center justify-center">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/30" />
                        <Loader2 className="relative size-4 animate-spin text-primary" />
                      </span>
                      <StatusCycle phrases={THINKING_PHRASES} />
                    </div>
                  </AnimatedItem>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex-none border-t border-black/5 bg-white px-3 py-3 sm:px-4">
          <div className="mx-auto w-full max-w-3xl">
            {uploads.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {uploads.map((u) => (
                  <span
                    key={u.id}
                    className={cn(
                      "inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px]",
                      u.status === "blocked"
                        ? "border-deny/30 bg-deny-soft text-deny"
                        : u.status === "flagged"
                          ? "border-approval/30 bg-approval-soft text-approval"
                          : "border-black/10 bg-[#f7f7f8] text-muted-foreground",
                    )}
                  >
                    <FileText className="size-3 shrink-0" />
                    <span className="truncate font-medium">{u.filename}</span>
                    <span className="font-mono uppercase opacity-80">
                      {u.status}
                    </span>
                    {u.flags > 0 ? (
                      <span className="font-mono opacity-70">{u.flags}f</span>
                    ) : null}
                    <button
                      aria-label={`Remove ${u.filename}`}
                      className="rounded p-0.5 hover:bg-black/5"
                      onClick={() =>
                        setUploads((prev) => prev.filter((x) => x.id !== u.id))
                      }
                      type="button"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative rounded-2xl border border-black/10 bg-[#f7f7f8] shadow-sm transition-[box-shadow,border-color] focus-within:border-primary/35 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/15 focus-within:shadow-[0_0_0_4px_rgba(54,81,245,0.08)]">
              <Textarea
                aria-label="Message"
                className="min-h-[56px] max-h-[200px] resize-none border-0 bg-transparent px-4 py-3.5 pr-24 text-[15px] shadow-none focus-visible:ring-0"
                disabled={!session}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={
                  canUpload
                    ? "Ask about campus policies or attach a file to sanitize first…"
                    : "Ask about campus policies, hostel rules, exams…"
                }
                value={input}
              />
              <input
                accept=".txt,.md,.csv,.pdf,text/plain,text/markdown,text/csv,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  void onPickFile(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
                ref={fileRef}
                type="file"
              />
              {canUpload ? (
                <Pressable
                  aria-label="Attach file"
                  className="absolute right-12 bottom-2.5 inline-flex size-9 items-center justify-center rounded-xl border border-black/10 bg-white text-muted-foreground disabled:pointer-events-none disabled:opacity-50"
                  disabled={busy || !session || uploading}
                  onClick={() => fileRef.current?.click()}
                  type="button"
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Paperclip className="size-4" />
                  )}
                </Pressable>
              ) : null}
              <Pressable
                aria-label="Send"
                className="absolute right-2.5 bottom-2.5 inline-flex size-9 items-center justify-center rounded-xl brand-gradient text-white disabled:pointer-events-none disabled:opacity-50"
                disabled={
                  (!input.trim() &&
                    uploads.filter((u) => u.status !== "blocked").length ===
                      0) ||
                  busy ||
                  !session
                }
                onClick={submit}
                type="button"
              >
                <ArrowUp className="size-4" />
              </Pressable>
            </div>
            <p className="mt-2 mb-0 text-center text-[11px] text-muted-foreground">
              {canUpload
                ? "Files are sanitized on the server before the agent may use them. Enter to send."
                : "Answers come from campus PDF sources you are allowed to see. Sign in to attach files."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  role,
  onPick,
  ready,
  sending,
}: {
  role: ChatRole;
  onPick: (q: string) => void;
  ready: boolean;
  sending: boolean;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-8 text-center">
      <BlurFade>
        <Logo className="justify-center" />
        <h2 className="mt-6 mb-2 text-2xl font-semibold tracking-tight">
          How can I help?
        </h2>
        <p className="m-0 max-w-md text-sm text-muted-foreground">
          Ask in plain language. I&apos;ll answer from campus PDF documents your
          account is allowed to read.
        </p>
      </BlurFade>
      <div className="grid w-full max-w-xl gap-2 sm:grid-cols-1">
        {STARTERS[role].map((q, i) => (
          <BlurFade delay={0.08 + i * 0.06} key={q}>
            <Pressable
              className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:border-primary/30 hover:bg-accent/40 disabled:opacity-40"
              disabled={!ready || sending}
              onClick={() => onPick(q)}
              type="button"
            >
              <span className="flex items-start gap-2">
                <FileText className="mt-0.5 size-4 flex-none text-primary/70" />
                {q}
              </span>
            </Pressable>
          </BlurFade>
        ))}
      </div>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const assistant = message.from === "assistant";
  const reduce = useReducedMotion();
  const files = message.attachments ?? [];
  // Citations can repeat the same doc across chunks   one chip per docId.
  const inContext = (() => {
    const seen = new Set<string>();
    return (message.citations ?? []).filter((c) => {
      if (seen.has(c.docId)) return false;
      seen.add(c.docId);
      return true;
    });
  })();
  const fenced = [...new Set(message.fenced ?? [])];
  const hasFenceUi = assistant && (inContext.length > 0 || fenced.length > 0);
  const showText =
    message.text.trim().length > 0 &&
    !(
      files.length > 0 &&
      message.text.trim() === "Please review the attached file."
    );

  return (
    <div className={cn("flex gap-3", !assistant && "flex-row-reverse")}>
      <span
        className={cn(
          "mt-0.5 grid size-8 flex-none place-items-center rounded-full",
          assistant
            ? message.blocked
              ? "bg-deny-soft text-deny"
              : "bg-accent text-primary"
            : "bg-primary text-primary-foreground",
        )}
      >
        {assistant ? (
          message.blocked ? (
            <ShieldAlert className="size-4" />
          ) : (
            <Bot className="size-4" />
          )
        ) : (
          <User className="size-4" />
        )}
      </span>
      <div
        className={cn(
          "max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
          assistant
            ? message.blocked
              ? "rounded-tl-md border border-deny/20 bg-deny-soft/50 shadow-[0_0_0_1px_rgba(224,56,79,0.08)]"
              : message.awaitingApproval
                ? "rounded-tl-md border border-approval/25 bg-approval-soft/60"
                : "rounded-tl-md bg-[#f7f7f8]"
            : "rounded-tr-md bg-primary text-primary-foreground",
        )}
      >
        {files.length > 0 && (
          <div
            className={cn(
              "flex flex-wrap gap-1.5",
              showText || hasFenceUi ? "mb-2.5" : "",
            )}
          >
            {files.map((f) => (
                <span
                  className={cn(
                    "inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium",
                    assistant
                      ? "border-black/10 bg-white text-muted-foreground"
                      : "border-white/25 bg-white/15 text-primary-foreground",
                  )}
                  key={f.id}
                  title={f.status ? `${f.filename} · ${f.status}` : f.filename}
                >
                  <Paperclip className="size-3 shrink-0 opacity-80" />
                  <FileText className="size-3.5 shrink-0 opacity-90" />
                  <span className="truncate">{f.filename}</span>
                  {f.status && f.status !== "ready" ? (
                    <span className="font-mono uppercase opacity-75">
                      {f.status}
                    </span>
                  ) : null}
                </span>
            ))}
          </div>
        )}
        {showText ? (
          <p className="m-0 whitespace-pre-wrap">
            <InlineMarkdown text={message.text} />
          </p>
        ) : null}
        {hasFenceUi && (
          <div className="mt-3 space-y-2 border-t border-black/5 pt-2">
            {inContext.length > 0 && (
              <div>
                <p className="mb-1.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                  In context
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {inContext.map((c, i) => (
                    <motion.span
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-2 py-0.5 text-[11px] text-muted-foreground shadow-sm"
                      initial={reduce ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      key={c.docId}
                    >
                      <FileText className="size-3 text-primary" />
                      {docTitle(c.docId)}
                      <ClassLabel value={String(c.classification)} />
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
            {fenced.length > 0 && (
              <div>
                <p className="mb-1.5 font-mono text-[10px] tracking-wide text-violet uppercase">
                  Fenced out
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {fenced.map((id, i) => (
                    <motion.span
                      className="inline-flex items-center gap-1.5 rounded-full border border-violet/25 bg-violet/5 px-2 py-0.5 text-[11px] text-violet line-through decoration-violet/40"
                      initial={reduce ? false : { opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.08 + i * 0.05,
                        type: "spring",
                        stiffness: 380,
                        damping: 22,
                      }}
                      key={`out-${id}`}
                    >
                      <Lock className="size-3" />
                      {docTitle(id)}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InlineMarkdown({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong className="font-semibold" key={i}>
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

export type CampusChatRole = ChatRole;
