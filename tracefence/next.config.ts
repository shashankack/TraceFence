import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dynamic SQLite + API routes — disable Cache Components for MVP.
  serverExternalPackages: ["better-sqlite3", "pdf-parse"],
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
