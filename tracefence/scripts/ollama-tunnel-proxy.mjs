/**
 * Tiny reverse proxy so cloudflared can reach Ollama.
 * Ollama often 403s when Host is a public tunnel hostname; we rewrite to localhost.
 *
 *   node scripts/ollama-tunnel-proxy.mjs
 *   cloudflared tunnel --url http://127.0.0.1:11435
 */
import http from "http";

const LISTEN = Number(process.env.OLLAMA_PROXY_PORT ?? "11435");
const UPSTREAM = process.env.OLLAMA_UPSTREAM ?? "http://127.0.0.1:11434";
const upstream = new URL(UPSTREAM);

const server = http.createServer((req, res) => {
  const headers = { ...req.headers, host: `${upstream.hostname}:${upstream.port || 80}` };
  delete headers["connection"];

  const proxy = http.request(
    {
      protocol: upstream.protocol,
      hostname: upstream.hostname,
      port: upstream.port || 80,
      path: req.url,
      method: req.method,
      headers,
    },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    },
  );
  proxy.on("error", (err) => {
    res.writeHead(502, { "content-type": "text/plain" });
    res.end(`proxy error: ${err.message}`);
  });
  req.pipe(proxy);
});

server.listen(LISTEN, "127.0.0.1", () => {
  console.log(`Ollama tunnel proxy :${LISTEN} → ${UPSTREAM}`);
});
