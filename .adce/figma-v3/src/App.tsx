import { useMemo, useState } from "react";

type Role = "Student" | "Faculty" | "Admin";
type Decision = "ALLOW" | "DENY" | "REQUIRE_APPROVAL";
type Scenario = "curfew" | "export" | "empty";
type IconName =
  | "shield"
  | "spark"
  | "send"
  | "book"
  | "filter"
  | "search"
  | "file"
  | "export"
  | "check"
  | "x"
  | "clock"
  | "lock"
  | "chevron"
  | "download"
  | "user"
  | "upload"
  | "sliders";

type PageId = "console" | "org" | "audit";
type Classification = "public" | "internal" | "confidential";
type ToolDecision = Decision;

type OrgDoc = {
  id: string;
  title: string;
  classification: Classification;
  collection: string;
  enabled: boolean;
  updated: string;
};

type Citation = {
  docId: string;
  title: string;
  classification: "public" | "internal" | "confidential";
};

type Message = {
  from: "user" | "assistant";
  text: string;
  citations?: Citation[];
  blocked?: boolean;
};

type Event = {
  id: string;
  phase: "SOURCE" | "PROPOSAL" | "DECISION" | "OUTCOME";
  tool: string;
  decision: Decision;
  reason: string;
  args: string;
  note: string;
  time: string;
};

const sessions: Record<Role, string> = {
  Student: "sess_stu_7K2M",
  Faculty: "sess_fac_4P9A",
  Admin: "sess_adm_2W8C",
};

const curfewMessages: Message[] = [
  {
    from: "user",
    text: "What time is hostel curfew on weekdays, and are there exceptions during exams?",
  },
  {
    from: "assistant",
    text: "Weekday hostel curfew is 10:30 PM. During the published exam period, residents with a valid late-library pass may enter until midnight. The pass must be requested before 8 PM that day.",
    citations: [
      { docId: "NTI-HST-014", title: "Hostel Resident Handbook", classification: "public" },
      { docId: "NTI-EXM-008", title: "Exam Period Access Rules", classification: "public" },
    ],
  },
];

const curfewEvents: Event[] = [
  {
    id: "ev_1201",
    phase: "SOURCE",
    tool: "search_docs",
    decision: "ALLOW",
    reason: "PUBLIC_SCOPE",
    args: 'query: "hostel curfew exam exceptions"',
    note: "2 public sources selected",
    time: "10:42:18.104",
  },
  {
    id: "ev_1202",
    phase: "PROPOSAL",
    tool: "read_document",
    decision: "ALLOW",
    reason: "CLASSIFICATION_ALLOWED",
    args: "docIds: [NTI-HST-014, NTI-EXM-008]",
    note: "Read proposed by model",
    time: "10:42:18.229",
  },
  {
    id: "ev_1203",
    phase: "DECISION",
    tool: "read_document",
    decision: "ALLOW",
    reason: "ROLE_ACL_MATCH",
    args: "role: student · classification: public",
    note: "Gateway authorized exact args",
    time: "10:42:18.235",
  },
  {
    id: "ev_1204",
    phase: "OUTCOME",
    tool: "read_document",
    decision: "ALLOW",
    reason: "EXECUTED",
    args: "2 documents · 1,284 tokens",
    note: "Answer grounded with citations",
    time: "10:42:18.412",
  },
];

const denyMessages: Message[] = [
  {
    from: "user",
    text: "Export every student email address from the directory as a CSV.",
  },
  {
    from: "assistant",
    text: "I can’t export the student directory. Your Student role does not have access to confidential directory records, and export_records is not permitted for this session.",
    blocked: true,
  },
];

const denyEvents: Event[] = [
  {
    id: "ev_1311",
    phase: "SOURCE",
    tool: "search_docs",
    decision: "DENY",
    reason: "SOURCE_ACL_EXCLUDED",
    args: 'query: "all student email addresses"',
    note: "3 confidential sources filtered",
    time: "10:43:02.041",
  },
  {
    id: "ev_1312",
    phase: "PROPOSAL",
    tool: "export_records",
    decision: "DENY",
    reason: "ROLE_TOOL_FORBIDDEN",
    args: "dataset: student_directory · format: csv",
    note: "Model proposed restricted export",
    time: "10:43:02.184",
  },
  {
    id: "ev_1313",
    phase: "DECISION",
    tool: "export_records",
    decision: "DENY",
    reason: "CONFIDENTIAL_EXPORT_DENIED",
    args: "rows: all · fields: [name, email]",
    note: "Gateway blocked before execution",
    time: "10:43:02.190",
  },
  {
    id: "ev_1314",
    phase: "OUTCOME",
    tool: "export_records",
    decision: "DENY",
    reason: "NOT_EXECUTED",
    args: "records returned: 0 · files created: 0",
    note: "No confidential data entered context",
    time: "10:43:02.194",
  },
];

const approvalEvents: Event[] = [
  {
    id: "ev_1441",
    phase: "SOURCE",
    tool: "search_docs",
    decision: "ALLOW",
    reason: "FACULTY_SCOPE",
    args: 'query: "student advisee directory"',
    note: "Directory metadata available",
    time: "10:44:27.014",
  },
  {
    id: "ev_1442",
    phase: "PROPOSAL",
    tool: "export_records",
    decision: "REQUIRE_APPROVAL",
    reason: "BULK_EXPORT_SENSITIVE",
    args: "dataset: faculty_advisees · format: csv",
    note: "Exact action held by gateway",
    time: "10:44:27.208",
  },
  {
    id: "ev_1443",
    phase: "DECISION",
    tool: "export_records",
    decision: "REQUIRE_APPROVAL",
    reason: "HUMAN_CHECKPOINT",
    args: "rows: 42 · fields: [student_id, name, email]",
    note: "Waiting for authorized reviewer",
    time: "10:44:27.214",
  },
];

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    shield: (
      <>
        <path d="M12 2.8 4.8 6v5.2c0 4.7 2.9 8.3 7.2 10.2 4.3-1.9 7.2-5.5 7.2-10.2V6L12 2.8Z" />
        <path d="m8.7 12 2.1 2.1 4.7-4.7" />
      </>
    ),
    spark: <path d="m12 3 1.3 4.3L17 9l-3.7 1.7L12 15l-1.3-4.3L7 9l3.7-1.7L12 3Zm6 11 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />,
    send: <><path d="m3.5 11.5 17-8-6.8 17-2.2-7-8-2Z" /><path d="m11.5 13.5 4-4" /></>,
    book: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5Z" /><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z" /></>,
    filter: <path d="M4 5h16M7 12h10m-7 7h4" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4.5 4.5" /></>,
    file: <><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v5h5M9 13h6m-6 4h6" /></>,
    export: <><path d="M12 3v12m-4-4 4 4 4-4" /><path d="M5 14v7h14v-7" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    x: <path d="m7 7 10 10M17 7 7 17" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    chevron: <path d="m9 6 6 6-6 6" />,
    download: <><path d="M12 3v12m-4-4 4 4 4-4M5 20h14" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
    upload: <><path d="M12 21V9m-4 4 4-4 4 4M5 4h14" /></>,
    sliders: <><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" /></>,
  };
  return (
    <svg aria-hidden="true" className="icon" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      {paths[name]}
    </svg>
  );
}

function DecisionChip({ decision, pulse = false }: { decision: Decision; pulse?: boolean }) {
  const icon = decision === "ALLOW" ? "✓" : decision === "DENY" ? "✕" : "!";
  return (
    <span className={`decision-chip ${decision.toLowerCase().replace("_", "-")} ${pulse ? "pulse" : ""}`}>
      <b>{icon}</b>{decision}
    </span>
  );
}

function AppHeader({
  page,
  setPage,
  approvals,
  openApprovals,
  live,
  setLive,
}: {
  page: PageId;
  setPage: (page: PageId) => void;
  approvals: number;
  openApprovals: () => void;
  live: boolean;
  setLive: (live: boolean) => void;
}) {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <span className="logo-mark"><Icon name="shield" size={24} /></span>
        <div className="brand-copy">
          <div><strong>TraceFence</strong><span>by NullTrace</span></div>
          <p>A source-aware security gateway for AI agents</p>
        </div>
      </div>
      <nav aria-label="Primary">
        <button className={page === "console" ? "active" : ""} onClick={() => setPage("console")}>Console</button>
        <button className={page === "org" ? "active" : ""} onClick={() => setPage("org")}>Org</button>
        <button className={page === "audit" ? "active" : ""} onClick={() => setPage("audit")}>Audit</button>
      </nav>
      <div className="header-controls">
        <div className="mode-switch" aria-label="Model mode">
          <button className={live ? "selected" : ""} onClick={() => setLive(true)}><span className="status-dot" />Live model</button>
          <button className={!live ? "selected" : ""} onClick={() => setLive(false)}>Scripted replay</button>
        </div>
        <button className="approval-entry" onClick={openApprovals}>
          <Icon name="clock" size={15} />Approvals
          <span>{approvals}</span>
        </button>
      </div>
    </header>
  );
}

function RoleSelector({
  role,
  setRole,
  scenario,
  runScenario,
}: {
  role: Role;
  setRole: (role: Role) => void;
  scenario: Scenario;
  runScenario: (scenario: Scenario) => void;
}) {
  return (
    <section className="session-bar">
      <div className="role-group">
        <span className="session-label">Demo role</span>
        <div className="role-selector">
          {(["Student", "Faculty", "Admin"] as Role[]).map((item) => (
            <button className={role === item ? "active" : ""} key={item} onClick={() => setRole(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="session-meta"><span className="role-avatar"><Icon name="user" size={12} /></span><b>{role}</b><code>{sessions[role]}</code></div>
      </div>
      <div className="demo-paths">
        <span className="session-label">Demo path</span>
        <button className={scenario === "curfew" ? "active" : ""} onClick={() => runScenario("curfew")}><Icon name="book" size={13} />Curfew answer</button>
        <button className={scenario === "export" ? "active danger" : ""} onClick={() => runScenario("export")}><Icon name="export" size={13} />Directory export</button>
        <button className={scenario === "empty" ? "active" : ""} onClick={() => runScenario("empty")}>Clear</button>
      </div>
    </section>
  );
}

function CitationList({ citations }: { citations: Citation[] }) {
  return (
    <div className="citations">
      <span className="citation-heading"><Icon name="file" size={12} />Sources cited</span>
      {citations.map((citation) => (
        <button className="citation" key={citation.docId}>
          <span className="citation-icon"><Icon name="file" size={13} /></span>
          <span><strong>{citation.title}</strong><code>{citation.docId}</code></span>
          <em className={`class-${citation.classification}`}>{citation.classification}</em>
        </button>
      ))}
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  return (
    <div className={`chat-message ${message.from} ${message.blocked ? "blocked" : ""}`}>
      <span className="message-avatar">
        {message.from === "assistant" ? <Icon name="shield" size={15} /> : <Icon name="user" size={15} />}
      </span>
      <div className="message-content">
        <div className="message-author">
          <strong>{message.from === "assistant" ? "TraceFence assistant" : "You"}</strong>
          {message.blocked && <span><Icon name="lock" size={11} />Gateway enforced</span>}
        </div>
        <p>{message.text}</p>
        {message.blocked && <small>Enforced by TraceFence gateway  not by the model.</small>}
        {message.citations && <CitationList citations={message.citations} />}
      </div>
    </div>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (scenario: Scenario) => void }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon name="shield" size={28} /></span>
      <h2>Ask NullTrace Institute</h2>
      <p>Every source and tool call is checked by the gateway before it reaches the model or executes.</p>
      <div className="starter-prompts">
        <button onClick={() => onPrompt("curfew")}><Icon name="book" size={14} /><span>What time is hostel curfew?<small>Public handbook · allowed</small></span><Icon name="chevron" size={14} /></button>
        <button onClick={() => onPrompt("export")}><Icon name="export" size={14} /><span>Export the student directory<small>Role-aware gateway decision</small></span><Icon name="chevron" size={14} /></button>
      </div>
    </div>
  );
}

function ChatPanel({
  messages,
  scenario,
  role,
  submitMessage,
  runScenario,
}: {
  messages: Message[];
  scenario: Scenario;
  role: Role;
  submitMessage: (value: string) => void;
  runScenario: (scenario: Scenario) => void;
}) {
  const [input, setInput] = useState("");
  const submit = () => {
    if (!input.trim()) return;
    submitMessage(input);
    setInput("");
  };
  return (
    <section className="chat-panel">
      <div className="workspace-heading">
        <div><span className="kicker">Campus assistant</span><h1>NullTrace Institute</h1></div>
        <span className="gateway-status"><span className="status-dot" />Gateway active</span>
      </div>
      <div className="chat-scroll">
        {scenario === "empty" ? <EmptyState onPrompt={runScenario} /> : messages.map((message, index) => <ChatMessage key={`${message.from}-${index}`} message={message} />)}
      </div>
      <div className="composer-wrap">
        <div className="composer">
          <textarea
            aria-label="Message"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder={`Ask as ${role.toLowerCase()}…`}
            rows={2}
            value={input}
          />
          <button aria-label="Send message" onClick={submit}><Icon name="send" size={17} /></button>
        </div>
        <p><Icon name="shield" size={11} />The model proposes. TraceFence verifies sources and executes tools server-side.</p>
      </div>
    </section>
  );
}

function SourceFilterCallout({ scenario, role }: { scenario: Scenario; role: Role }) {
  if (scenario === "empty") return null;
  const denied = scenario === "export" && role === "Student";
  const approval = scenario === "export" && role !== "Student";
  return (
    <section className={`source-strip ${denied ? "filtered" : ""}`}>
      <div className="source-strip-title">
        <span className="filter-icon"><Icon name="filter" size={15} /></span>
        <div><strong>Source-aware context</strong><small>Built before model inference</small></div>
      </div>
      <div className="context-flow">
        <div className="context-stat allowed-source">
          <span>{denied ? "0" : approval ? "1" : "2"}</span>
          <p>entered context<small>{approval ? "internal metadata" : denied ? "no directory data" : "public documents"}</small></p>
        </div>
        <span className="flow-line" />
        <div className="context-stat filtered-source">
          <span>{denied ? "3" : approval ? "2" : "3"}</span>
          <p>sources filtered out<small>{denied ? "confidential directory" : "outside role scope"}</small></p>
        </div>
      </div>
      <div className="filter-proof"><Icon name="lock" size={13} />Unauthorized sources never entered model context.</div>
    </section>
  );
}

function DecisionEvent({ event, last }: { event: Event; last: boolean }) {
  const toolIcon = event.tool === "search_docs" ? "search" : event.tool === "export_records" ? "export" : "file";
  return (
    <div className={`decision-event decision-${event.decision.toLowerCase().replace("_", "-")}`}>
      <div className="timeline-col">
        <span className="timeline-node"><Icon name={toolIcon} size={13} /></span>
        {!last && <span className="timeline-line" />}
      </div>
      <div className="event-body">
        <div className="event-top"><span className="phase">{event.phase}</span><time>{event.time}</time></div>
        <div className="event-tool"><code>{event.tool}</code><DecisionChip decision={event.decision} pulse={event.decision === "DENY" && event.phase === "DECISION"} /></div>
        <code className="args-preview">{event.args}</code>
        <div className="event-reason"><code>{event.reason}</code><span>{event.note}</span></div>
      </div>
    </div>
  );
}

function DecisionRail({ events, scenario }: { events: Event[]; scenario: Scenario }) {
  return (
    <aside className="decision-rail">
      <div className="rail-header">
        <div><span className="kicker">Server gateway</span><h2>Decision rail</h2></div>
        <span className="streaming"><span className="status-dot" />Live events</span>
      </div>
      <div className="rail-guide"><span>SOURCE</span><Icon name="chevron" size={10} /><span>PROPOSAL</span><Icon name="chevron" size={10} /><span>DECISION</span><Icon name="chevron" size={10} /><span>OUTCOME</span></div>
      <div className="rail-events">
        {scenario === "empty" ? (
          <div className="rail-empty"><span><Icon name="spark" size={20} /></span><strong>No decisions yet</strong><p>Tool proposals and source decisions will appear here in real time.</p></div>
        ) : events.map((event, index) => <DecisionEvent event={event} key={event.id} last={index === events.length - 1} />)}
      </div>
      <div className="rail-footer">
        <Icon name="shield" size={13} />
        <span>Policy executes outside the LLM</span>
        <code>gateway v2.4</code>
      </div>
    </aside>
  );
}

function KpiStrip({ scenario, role, approved }: { scenario: Scenario; role: Role; approved: boolean }) {
  const allow = scenario === "curfew" ? 3 : scenario === "export" && role !== "Student" && approved ? 2 : scenario === "export" && role !== "Student" ? 1 : 0;
  const blocked = scenario === "export" && role === "Student" ? 1 : 0;
  const waiting = scenario === "export" && role !== "Student" && !approved ? 1 : 0;
  return (
    <section className="kpi-strip">
      <div><span className="kpi-dot green" /><p>Allowed<strong>{allow}</strong></p></div>
      <div><span className="kpi-dot red" /><p>Blocked<strong>{blocked}</strong></p></div>
      <div><span className="kpi-dot amber" /><p>Waiting approval<strong>{waiting}</strong></p></div>
      <div className="forbidden"><span className="kpi-dot green" /><p>Forbidden executions<strong>0</strong></p><em>must stay 0</em></div>
    </section>
  );
}

function ApprovalDrawer({
  role,
  onApprove,
  onReject,
  close,
}: {
  role: Role;
  onApprove: () => void;
  onReject: () => void;
  close: () => void;
}) {
  return (
    <>
      <button aria-label="Close checkpoint" className="drawer-scrim" onClick={close} />
      <aside className="approval-drawer">
        <div className="drawer-header">
          <div><span className="kicker">Human checkpoint</span><h2>Approve exact action</h2></div>
          <button aria-label="Close" onClick={close}><Icon name="x" size={17} /></button>
        </div>
        <div className="approval-state">
          <span><Icon name="clock" size={18} /></span>
          <div><strong>Gateway paused execution</strong><p>Review the exact tool and arguments below.</p></div>
          <time>01:59</time>
        </div>
        <div className="tool-card">
          <div className="tool-name"><span><Icon name="export" size={18} /></span><div><small>Proposed tool</small><code>export_records</code></div><DecisionChip decision="REQUIRE_APPROVAL" /></div>
          <div className="exact-args">
            <span className="section-label">Exact arguments</span>
            <div><span>dataset</span><code>faculty_advisees</code></div>
            <div><span>format</span><code>csv</code></div>
            <div><span>fields</span><code>student_id, name, email</code></div>
            <div><span>row_limit</span><code>42</code></div>
          </div>
        </div>
        <div className="scope-note"><Icon name="user" size={14} /><span>Requested by <strong>{role}</strong> for current advisees only.</span></div>
        <div className="bound-card">
          <span className="section-label">Cryptographically bound to</span>
          <div><span>Session</span><code>{sessions[role]}</code></div>
          <div><span>Args hash</span><code>sha256:4d8a…91c2</code></div>
          <div><span>Expires</span><strong>in 1 minute 59 seconds</strong></div>
          <div><span>Grant</span><strong><Icon name="lock" size={12} />Single use</strong></div>
        </div>
        <p className="payload-warning"><Icon name="lock" size={13} />Any payload change requires a new approval.</p>
        <div className="drawer-actions">
          <button className="approve-action" onClick={onApprove}><Icon name="check" size={16} />Approve once</button>
          <button className="reject-action" onClick={onReject}><Icon name="x" size={15} />Reject</button>
        </div>
      </aside>
    </>
  );
}

function ErrorBanner({ setLive }: { setLive: (value: boolean) => void }) {
  return (
    <div className="error-banner">
      <span><Icon name="spark" size={14} /></span>
      <p><strong>Local model unavailable.</strong> Showing a deterministic scripted replay with the same gateway events.</p>
      <button onClick={() => setLive(true)}>Retry Ollama</button>
    </div>
  );
}

const seedDocs: OrgDoc[] = [
  { id: "NTI-HST-014", title: "Hostel Resident Handbook", classification: "public", collection: "public", enabled: true, updated: "Today" },
  { id: "NTI-EXM-008", title: "Exam Period Access Rules", classification: "public", collection: "public", enabled: true, updated: "Today" },
  { id: "NTI-FAC-003", title: "Faculty Guidance Notes", classification: "internal", collection: "internal", enabled: true, updated: "Yesterday" },
  { id: "NTI-DIR-001", title: "Student Directory (synthetic)", classification: "confidential", collection: "confidential", enabled: true, updated: "Yesterday" },
  { id: "NTI-GRD-002", title: "Grades Notes (synthetic)", classification: "confidential", collection: "confidential", enabled: true, updated: "Yesterday" },
];

const collections = ["public", "internal", "confidential"] as const;
const tools = ["search_docs", "read_document", "export_records", "notify_external", "post_announcement"] as const;
const rolesList: Role[] = ["Student", "Faculty", "Admin"];

const defaultRetrieval: Record<Role, Record<string, boolean>> = {
  Student: { public: true, internal: false, confidential: false },
  Faculty: { public: true, internal: true, confidential: true },
  Admin: { public: true, internal: true, confidential: true },
};

const defaultTools: Record<Role, Record<string, ToolDecision>> = {
  Student: {
    search_docs: "ALLOW",
    read_document: "ALLOW",
    export_records: "DENY",
    notify_external: "DENY",
    post_announcement: "DENY",
  },
  Faculty: {
    search_docs: "ALLOW",
    read_document: "ALLOW",
    export_records: "REQUIRE_APPROVAL",
    notify_external: "DENY",
    post_announcement: "REQUIRE_APPROVAL",
  },
  Admin: {
    search_docs: "ALLOW",
    read_document: "ALLOW",
    export_records: "ALLOW",
    notify_external: "REQUIRE_APPROVAL",
    post_announcement: "ALLOW",
  },
};

function OrgPage() {
  const [docs, setDocs] = useState<OrgDoc[]>(seedDocs);
  const [retrieval, setRetrieval] = useState(defaultRetrieval);
  const [toolPolicy, setToolPolicy] = useState(defaultTools);
  const [policyVersion, setPolicyVersion] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftClass, setDraftClass] = useState<Classification>("public");
  const [toast, setToast] = useState<string | null>(null);

  const toggleDoc = (id: string) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, enabled: !d.enabled } : d)));
    setDirty(true);
  };

  const setDocClass = (id: string, classification: Classification) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, classification, collection: classification } : d,
      ),
    );
    setDirty(true);
  };

  const addDoc = () => {
    if (!draftTitle.trim()) return;
    const id = `NTI-UPL-${String(docs.length + 1).padStart(3, "0")}`;
    setDocs((prev) => [
      {
        id,
        title: draftTitle.trim(),
        classification: draftClass,
        collection: draftClass,
        enabled: true,
        updated: "Just now",
      },
      ...prev,
    ]);
    setDraftTitle("");
    setDirty(true);
    setToast("Document added  publish policy to bump version");
  };

  const publish = () => {
    setPolicyVersion((v) => v + 1);
    setDirty(false);
    setToast(`Published policy v${policyVersion + 1}`);
  };

  return (
    <main className="org-page">
      <div className="org-title">
        <div>
          <span className="kicker">Organization fence</span>
          <h1>NullTrace Institute</h1>
          <p>Upload sources and define who may read them and which tools are ALLOW / DENY / REQUIRE_APPROVAL.</p>
        </div>
        <div className="org-title-actions">
          <span className="policy-badge">Policy v{policyVersion}{dirty ? " · unpublished changes" : ""}</span>
          <button className="publish-btn" disabled={!dirty} onClick={publish}>
            <Icon name="check" size={15} />Publish policy
          </button>
        </div>
      </div>

      <section className="org-panel">
        <div className="org-panel-head">
          <div><h2>Documents</h2><p>Classify before save. Content cannot self-elevate permissions.</p></div>
        </div>
        <div className="upload-row">
          <div className="upload-drop">
            <Icon name="upload" size={18} />
            <div>
              <strong>Upload or paste a source</strong>
              <small>md / txt / pdf-text · synthetic demo only</small>
            </div>
          </div>
          <input
            aria-label="Document title"
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Document title"
            value={draftTitle}
          />
          <select
            aria-label="Classification"
            onChange={(e) => setDraftClass(e.target.value as Classification)}
            value={draftClass}
          >
            <option value="public">public</option>
            <option value="internal">internal</option>
            <option value="confidential">confidential</option>
          </select>
          <button onClick={addDoc}><Icon name="file" size={14} />Add</button>
        </div>
        <div className="doc-table">
          <div className="doc-row doc-head">
            <span>Title</span><span>Classification</span><span>Collection</span><span>Updated</span><span>Enabled</span>
          </div>
          {docs.map((doc) => (
            <div className="doc-row" key={doc.id}>
              <span><strong>{doc.title}</strong><code>{doc.id}</code></span>
              <select
                onChange={(e) => setDocClass(doc.id, e.target.value as Classification)}
                value={doc.classification}
              >
                <option value="public">public</option>
                <option value="internal">internal</option>
                <option value="confidential">confidential</option>
              </select>
              <code>{doc.collection}</code>
              <span>{doc.updated}</span>
              <button className={doc.enabled ? "toggle on" : "toggle"} onClick={() => toggleDoc(doc.id)}>
                {doc.enabled ? "On" : "Off"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="org-matrices">
        <section className="org-panel">
          <div className="org-panel-head">
            <div><h2>Retrieval ACL</h2><p>Roles × collections</p></div>
            <Icon name="sliders" size={16} />
          </div>
          <div className="matrix">
            <div className="matrix-row matrix-head">
              <span>Role</span>
              {collections.map((c) => <span key={c}>{c}</span>)}
            </div>
            {rolesList.map((role) => (
              <div className="matrix-row" key={role}>
                <span>{role}</span>
                {collections.map((c) => (
                  <button
                    className={retrieval[role][c] ? "cell allow" : "cell deny"}
                    key={c}
                    onClick={() => {
                      setRetrieval((prev) => ({
                        ...prev,
                        [role]: { ...prev[role], [c]: !prev[role][c] },
                      }));
                      setDirty(true);
                    }}
                  >
                    {retrieval[role][c] ? "ALLOW" : "DENY"}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="org-panel">
          <div className="org-panel-head">
            <div><h2>Tool gateway</h2><p>Roles × tools</p></div>
            <Icon name="lock" size={16} />
          </div>
          <div className="matrix tool-matrix">
            <div className="matrix-row matrix-head">
              <span>Role</span>
              {tools.map((t) => <span key={t}>{t}</span>)}
            </div>
            {rolesList.map((role) => (
              <div className="matrix-row" key={role}>
                <span>{role}</span>
                {tools.map((t) => {
                  const value = toolPolicy[role][t];
                  const next: ToolDecision =
                    value === "ALLOW" ? "DENY" : value === "DENY" ? "REQUIRE_APPROVAL" : "ALLOW";
                  return (
                    <button
                      className={`cell ${value.toLowerCase().replace("_", "-")}`}
                      key={t}
                      onClick={() => {
                        setToolPolicy((prev) => ({
                          ...prev,
                          [role]: { ...prev[role], [t]: next },
                        }));
                        setDirty(true);
                      }}
                    >
                      {value === "REQUIRE_APPROVAL" ? "APPROVAL" : value}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="org-invariant">
        <Icon name="lock" size={13} />
        Uploaded content is untrusted. It cannot elevate its own classification or change tool policy.
      </p>
      {toast && (
        <div className="result-toast approved">
          <span><Icon name="check" size={15} /></span>
          <div><strong>Org update</strong><p>{toast}</p></div>
        </div>
      )}
    </main>
  );
}

function AuditPage() {
  const rows = [
    ["10:44:27", "Faculty", "export_records", "REQUIRE_APPROVAL", "BULK_EXPORT_SENSITIVE", "Pending"],
    ["10:43:02", "Student", "export_records", "DENY", "CONFIDENTIAL_EXPORT_DENIED", "Not executed"],
    ["10:42:18", "Student", "read_document", "ALLOW", "ROLE_ACL_MATCH", "Executed"],
    ["10:38:41", "Admin", "read_document", "ALLOW", "ADMIN_SCOPE", "Executed"],
    ["10:36:09", "Student", "read_document", "DENY", "SOURCE_ACL_EXCLUDED", "Not executed"],
  ];
  return (
    <main className="audit-page">
      <div className="audit-title">
        <div><span className="kicker">Gateway evidence</span><h1>Audit report</h1><p>Recent source and tool decisions across NullTrace Institute sessions.</p></div>
        <button><Icon name="download" size={15} />Export JSON</button>
      </div>
      <div className="audit-summary">
        <div><span className="kpi-dot green" /><p>Allowed<strong>28</strong></p></div>
        <div><span className="kpi-dot red" /><p>Denied<strong>4</strong></p></div>
        <div><span className="kpi-dot amber" /><p>Pending approvals<strong>1</strong></p></div>
        <div><span className="kpi-dot green" /><p>Forbidden executions<strong>0</strong></p><em>verified</em></div>
      </div>
      <section className="audit-table-wrap">
        <div className="table-heading"><div><h2>Recent decisions</h2><p>Source → proposal → decision → outcome</p></div><span>Last 24 hours</span></div>
        <div className="audit-table">
          <div className="audit-row audit-head"><span>Time</span><span>Role</span><span>Tool</span><span>Decision</span><span>Reason code</span><span>Outcome</span></div>
          {rows.map((row) => (
            <div className="audit-row" key={`${row[0]}-${row[2]}`}>
              <code>{row[0]}</code><span>{row[1]}</span><code>{row[2]}</code>
              <DecisionChip decision={row[3] as Decision} />
              <code className="audit-reason">{row[4]}</code>
              <span className={row[5] === "Not executed" ? "not-executed" : ""}>{row[5]}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState<PageId>("console");
  const [role, setRoleState] = useState<Role>("Student");
  const [scenario, setScenario] = useState<Scenario>("curfew");
  const [live, setLive] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [customMessage, setCustomMessage] = useState<Message[] | null>(null);

  const awaitingApproval = scenario === "export" && role !== "Student" && !approved && !rejected;
  const messages = useMemo(() => {
    if (customMessage) return customMessage;
    if (scenario === "curfew") return curfewMessages;
    if (scenario === "export" && role === "Student") return denyMessages;
    if (scenario === "export") {
      const result: Message[] = [
        { from: "user", text: "Export my advisee directory with student IDs, names, and emails as CSV." },
        { from: "assistant", text: approved ? "The approved export completed once. The CSV contains 42 advisees and the approval grant is now consumed." : rejected ? "The export was rejected. No file was created and no records were returned." : "I prepared the faculty advisee export. Because it contains internal directory records, the gateway requires a human checkpoint before execution." },
      ];
      return result;
    }
    return [];
  }, [scenario, role, approved, rejected, customMessage]);

  const events = useMemo(() => {
    if (scenario === "curfew") return curfewEvents;
    if (scenario === "export" && role === "Student") return denyEvents;
    if (scenario === "export") {
      if (approved) return [...approvalEvents, { id: "ev_1444", phase: "OUTCOME" as const, tool: "export_records", decision: "ALLOW" as const, reason: "APPROVAL_CONSUMED", args: "artifact: advisees_2025-03.csv · rows: 42", note: "Executed once; grant invalidated", time: "10:44:34.802" }];
      if (rejected) return [...approvalEvents, { id: "ev_1444", phase: "OUTCOME" as const, tool: "export_records", decision: "DENY" as const, reason: "HUMAN_REJECTED", args: "records returned: 0 · files created: 0", note: "No action executed", time: "10:44:34.802" }];
      return approvalEvents;
    }
    return [];
  }, [scenario, role, approved, rejected]);

  const setRole = (nextRole: Role) => {
    setRoleState(nextRole);
    setApproved(false);
    setRejected(false);
    setDrawerOpen(false);
    setCustomMessage(null);
    if (nextRole === "Admin") setPage("org");
    if (scenario === "export" && nextRole !== "Student") setDrawerOpen(true);
  };

  const runScenario = (next: Scenario) => {
    setScenario(next);
    setApproved(false);
    setRejected(false);
    setCustomMessage(null);
    setDrawerOpen(next === "export" && role !== "Student");
  };

  const submitMessage = (value: string) => {
    const exportIntent = /export|directory|email/i.test(value);
    const nextScenario: Scenario = exportIntent ? "export" : "curfew";
    setScenario(nextScenario);
    setApproved(false);
    setRejected(false);
    setCustomMessage(null);
    setDrawerOpen(nextScenario === "export" && role !== "Student");
  };

  const approve = () => {
    setApproved(true);
    setRejected(false);
    setDrawerOpen(false);
  };

  const reject = () => {
    setRejected(true);
    setApproved(false);
    setDrawerOpen(false);
  };

  return (
    <div className="app-shell">
      <AppHeader
        approvals={awaitingApproval ? 1 : 0}
        live={live}
        openApprovals={() => awaitingApproval && setDrawerOpen(true)}
        page={page}
        setLive={setLive}
        setPage={setPage}
      />
      {page === "audit" ? (
        <AuditPage />
      ) : page === "org" ? (
        <OrgPage />
      ) : (
        <>
          <RoleSelector role={role} runScenario={runScenario} scenario={scenario} setRole={setRole} />
          {!live && <ErrorBanner setLive={setLive} />}
          <KpiStrip approved={approved} role={role} scenario={scenario} />
          <main className="console-layout">
            <div className="chat-column">
              <ChatPanel messages={messages} role={role} runScenario={runScenario} scenario={scenario} submitMessage={submitMessage} />
              <SourceFilterCallout role={role} scenario={scenario} />
            </div>
            <DecisionRail events={events} scenario={scenario} />
          </main>
          {drawerOpen && awaitingApproval && <ApprovalDrawer close={() => setDrawerOpen(false)} onApprove={approve} onReject={reject} role={role} />}
          {(approved || rejected) && (
            <div className={`result-toast ${approved ? "approved" : "rejected"}`}>
              <span><Icon name={approved ? "check" : "x"} size={15} /></span>
              <div><strong>{approved ? "Approved once" : "Action rejected"}</strong><p>{approved ? "Export executed; single-use grant consumed." : "No records returned. No file created."}</p></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
