// Register fixtures/campus/docs/*.md in policies/roles.json, and turn PDFs without a .md into .md.
// Usage (repo root): node fixtures/campus/scripts/register_docs.cjs [incoming_pdf_dir]
// Each .md needs "# Title" and "Classification: public|internal|confidential" near the top.
// PDFs from incoming_pdf_dir are copied into fixtures/campus/pdf and their text into docs/<name>.md.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const docsDir = path.join(root, "docs");
const pdfDir = path.join(root, "pdf");
const rolesPath = path.join(root, "policies", "roles.json");
const CLASSES = ["public", "internal", "confidential"];

function slug(name) {
  return name.toLowerCase().replace(/\.pdf$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function importPdfs(dir) {
  // pdf-parse is already a tracefence dependency; lib path avoids its debug-mode index.js.
  const pdfParse = require(path.join(root, "..", "..", "tracefence", "node_modules", "pdf-parse", "lib", "pdf-parse.js"));
  fs.mkdirSync(pdfDir, { recursive: true });
  for (const f of fs.readdirSync(dir).filter((n) => n.toLowerCase().endsWith(".pdf"))) {
    const id = slug(f);
    const mdPath = path.join(docsDir, `${id}.md`);
    fs.copyFileSync(path.join(dir, f), path.join(pdfDir, `${id}.pdf`));
    if (fs.existsSync(mdPath)) continue;
    const text = (await pdfParse(fs.readFileSync(path.join(dir, f)))).text.replace(/\r\n/g, "\n").trim();
    const m = text.match(/classification:\s*(public|internal|confidential)/i);
    const cls = m ? m[1].toLowerCase() : "public";
    const title = text.split("\n").map((l) => l.trim()).find((l) => l.length > 3 && !/classification|^page \d|synthetic demo data|public summary/i.test(l)) || id;
    const body = text.replace(/^.*classification:.*$/gim, "").trim();
    fs.writeFileSync(mdPath, `# ${title}\n\nClassification: ${cls}\n${m ? "" : "Classification was missing in the PDF; defaulted to public. Check it.\n"}\n${body}\n`);
    console.log(`converted ${f} -> docs/${id}.md (${cls}${m ? "" : ", DEFAULTED"})`);
  }
}

function register() {
  const roles = JSON.parse(fs.readFileSync(rolesPath, "utf8"));
  let added = 0;
  const problems = [];
  for (const f of fs.readdirSync(docsDir).filter((n) => n.endsWith(".md")).sort()) {
    const id = f.replace(/\.md$/, "");
    const text = fs.readFileSync(path.join(docsDir, f), "utf8");
    const title = (text.match(/^#\s+(.+)$/m) || [])[1];
    const cls = ((text.match(/^Classification:\s*(\w+)/im) || [])[1] || "").toLowerCase();
    if (!title || !CLASSES.includes(cls)) { problems.push(`${f}: missing title or classification`); continue; }
    const existing = roles.documents[id];
    if (existing && existing.classification !== cls) problems.push(`${f}: header says ${cls}, roles.json says ${existing.classification}`);
    if (!existing) { roles.documents[id] = { classification: cls, collection: cls, title }; added++; }
  }
  for (const id of Object.keys(roles.documents)) {
    if (!fs.existsSync(path.join(docsDir, `${id}.md`))) problems.push(`${id}: in roles.json but docs/${id}.md is missing`);
  }
  fs.writeFileSync(rolesPath, JSON.stringify(roles, null, 2) + "\n");
  const counts = {};
  for (const d of Object.values(roles.documents)) counts[d.classification] = (counts[d.classification] || 0) + 1;
  console.log(`added ${added}; total ${Object.keys(roles.documents).length}`, counts);
  if (problems.length) { console.log("PROBLEMS:\n- " + problems.join("\n- ")); process.exitCode = 1; }
}

(async () => {
  if (process.argv[2]) await importPdfs(path.resolve(process.argv[2]));
  register();
})();
