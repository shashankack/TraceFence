export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 px-8 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
        NullTrace
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight">TraceFence</h1>
      <p className="mt-4 max-w-xl text-lg text-zinc-400">
        Know what your AI reads. Control what it does. Source-aware gateway
        scaffold is live — Mission Control UI lands on the frontend branch.
      </p>
      <ul className="mt-10 space-y-2 text-sm text-zinc-300 font-mono">
        <li>POST /api/sources/inspect</li>
        <li>POST /api/tasks</li>
        <li>GET /api/tasks/:id</li>
        <li>POST /api/tasks/:id/run</li>
        <li>GET /api/audit</li>
      </ul>
    </main>
  );
}
