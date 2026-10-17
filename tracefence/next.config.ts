import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dynamic SQLite + API routes  disable Cache Components for MVP.
  serverExternalPackages: ["better-sqlite3", "pdf-parse"],
  // Bundle campus fixtures + native module into serverless traces (Vercel).
  outputFileTracingIncludes: {
    "/**": [
      "./fixtures/campus/**/*",
      "./node_modules/better-sqlite3/**/*",
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
