/**
 * Refresh NullTrace fixture docs + chunks from fixtures/campus.
 * Run: npx tsx scripts/reseed-corpus.ts
 */
import { getDb } from "../lib/db/client";
import {
  seedFixtureDocumentsForTenant,
  seedPolicyForTenant,
} from "../lib/campus/tenantBootstrap";
import { loadCampusPolicy, loadFixturePolicy } from "../lib/campus/policy";

function main() {
  process.env.DEMO_MODE = process.env.DEMO_MODE ?? "true";
  getDb(); // ensure schema + demo users

  seedPolicyForTenant("nulltrace-institute");
  seedFixtureDocumentsForTenant("nulltrace-institute");

  const fixture = loadFixturePolicy();
  const policy = loadCampusPolicy("nulltrace-institute");
  const ids = Object.keys(policy.documents).sort();
  const byClass = { public: 0, internal: 0, confidential: 0 };
  for (const meta of Object.values(policy.documents)) {
    const c = meta.classification as keyof typeof byClass;
    if (c in byClass) byClass[c] += 1;
  }

  const missing = Object.keys(fixture.documents).filter((id) => !policy.documents[id]);
  console.log(
    JSON.stringify(
      {
        fixtureDocs: Object.keys(fixture.documents).length,
        tenantDocs: ids.length,
        byClass,
        missing,
        sample: ids.slice(0, 8),
      },
      null,
      2,
    ),
  );
  if (missing.length) {
    console.error("FAIL: fixture docs missing from tenant policy", missing);
    process.exit(1);
  }
  console.log("OK: campus corpus reseeded");
}

main();
