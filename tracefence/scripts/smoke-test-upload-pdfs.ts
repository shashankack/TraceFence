import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sanitizeChatUpload } from "../lib/campus/contentGuards";
import { ingestPdfBuffer } from "../lib/campus/pdfText";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, "../../fixtures/campus/uploads");

async function ingestWithRetry(buf: Buffer, tries = 2) {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await ingestPdfBuffer(buf);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

async function main() {
  console.log("dir", dir);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".pdf"))) {
    const buf = fs.readFileSync(path.join(dir, f));
    try {
      const ingested = await ingestWithRetry(buf);
      const r = sanitizeChatUpload(ingested.text, ingested.flags);
      console.log(
        f,
        "->",
        r.status,
        "flags=" + r.flags.length,
        "kept=" + r.sanitized.length,
      );
      if (r.flags.length) {
        console.log(" ", [...new Set(r.flags.map((x) => x.kind))].join(", "));
      }
    } catch (e) {
      console.log(f, "EXTRACT FAIL", (e as Error).message);
    }
  }
}

void main();
