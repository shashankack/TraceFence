export default function Home() {
  return (
    <main
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        maxWidth: 720,
        margin: "4rem auto",
        padding: "0 1.5rem",
        lineHeight: 1.5,
      }}
    >
      <p style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12 }}>
        NullTrace
      </p>
      <h1 style={{ fontSize: "2.4rem", margin: "0.4rem 0" }}>TraceFence</h1>
      <p style={{ fontSize: "1.15rem", opacity: 0.85 }}>
        A source-aware security gateway for AI agents.
      </p>
      <p>
        Campus demo APIs are live under <code>/api/sessions</code>. Chat UI lands
        on the frontend branch.
      </p>
      <ol>
        <li>
          <code>POST /api/sessions</code> with {"{"}&quot;role&quot;:&quot;student&quot;{"}"}
        </li>
        <li>
          <code>POST /api/sessions/:id/messages</code> with a campus question
        </li>
        <li>
          <code>GET /api/sessions/:id/events</code> for the decision rail
        </li>
      </ol>
    </main>
  );
}
