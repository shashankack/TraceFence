import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dynamic SQLite + API routes  disable Cache Components for MVP.
  serverExternalPackages: ["better-sqlite3", "pdf-parse"],
  // Bundle campus fixtures + native module + SQL RPC CLI into serverless traces.
  outputFileTracingIncludes: {
    "/**": [
      "./fixtures/campus/**/*",
      "./node_modules/better-sqlite3/**/*",
      "./lib/db/sqlHttpWorker.mjs",
      "./lib/db/httpBridge.mjs",
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
