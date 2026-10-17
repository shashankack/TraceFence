/**
 * Copy repo fixtures into the Next app so Vercel (rootDirectory=tracefence)
 * can resolve fixtures/campus at runtime.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(__dirname, "..");
const src = path.resolve(appRoot, "..", "fixtures", "campus");
const dest = path.join(appRoot, "fixtures", "campus");

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, entry.name);
    const b = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

const srcOk = fs.existsSync(path.join(src, "policies", "roles.json"));
const destOk = fs.existsSync(path.join(dest, "policies", "roles.json"));

if (!srcOk) {
  // Vercel CLI uploads only the app directory — keep a prebundled copy in-tree.
  if (destOk) {
    console.log("Using prebundled fixtures at", dest);
    process.exit(0);
  }
  console.error("Missing fixtures at", src, "(and no prebundled copy at", dest + ")");
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
copyDir(src, dest);
console.log("Copied campus fixtures →", dest);
