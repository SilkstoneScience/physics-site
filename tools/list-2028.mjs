// The register of everything on the site that mentions the 2028 syllabus change.
// After the May 2027 exams every student is on the 2028 syllabus, so all of these notes come off:
// the plan is at the top of docs/2028_REGISTER.md, and this tool keeps the list under it up to date.
//
//   node tools/list-2028.mjs            print the list
//   node tools/list-2028.mjs --write    rewrite the list in docs/2028_REGISTER.md
//
// The checker (tools/check.mjs) warns when the list in the document is out of date.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = path.join(ROOT, 'docs', '2028_REGISTER.md');
const START = '<!-- LIST:START (written by tools/list-2028.mjs --write; do not edit by hand) -->';
const END = '<!-- LIST:END -->';

// Folders and files that are not part of the published site, or are generated from other files.
const SKIP_DIRS = new Set(['.git', '.claude', '.github', 'node_modules', 'docs', 'tools', 'news', 'images']);
const SKIP_FILES = new Set(['search-index.json', 'sitemap.xml', 'CLAUDE.md', 'CLAUDE.local.md', 'PROGRESS.md', 'README.md', 'LICENSE']);
const EXT = new Set(['.html', '.json', '.js', '.css', '.svg']);

// What counts as a 2028 marker on a line.
const MARK = /2028|2027|new2028|y2028/;
// Lines that mention 2027 only as a copyright or calendar year are not syllabus notes.
const NOT_SYLLABUS = /©|copyright|first assessment 2027|"date"|datetime=|20\d\d-\d\d-\d\d/i;

const GROUPS = [
  ['Topic pages', (f) => /^themes\//.test(f)],
  ['Question bank (hand-written)', (f) => /^questions\/[a-e]\.json$/.test(f)],
  ['Question bank (generated: change the recipe in tools/, then rebuild and re-approve)', (f) => /^questions\/(p2|1b)(\.json|\/)/.test(f)],
  ['Equations panel, menu and shared code', (f) => /^(js|css)\//.test(f)],
  ['Revision sheet summaries', (f) => /^teachers\/[a-e]\d\.json$/.test(f)],
  ['Lesson slide data', (f) => /^teachers\/slides\//.test(f)],
  ['Other pages and data', () => true],
];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    const st = fs.statSync(full);
    if (st.isDirectory()) { if (!SKIP_DIRS.has(name)) walk(full, out); continue; }
    if (SKIP_FILES.has(name) || !EXT.has(path.extname(name))) continue;
    out.push(rel);
  }
  return out;
}

const clean = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export function build2028List() {
  const byGroup = GROUPS.map(([title]) => ({ title, files: [] }));
  let total = 0;
  for (const file of walk(ROOT)) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    if (!MARK.test(text)) continue;
    const hits = [];
    let qid = '';
    text.split(/\r?\n/).forEach((line, i) => {
      const id = line.match(/"id":\s*"([A-Z0-9-]+)"/);
      if (id) qid = id[1];
      if (!MARK.test(line)) return;
      if (!/2028|new2028/.test(line) && NOT_SYLLABUS.test(line)) return; // a bare 2027 that is only a date
      let what;
      if (/"y2028":\s*true/.test(line)) what = `question ${qid}: "New for 2028" tag`;
      else {
        const t = clean(line) || 'the box drawn round a "New for 2028" block (class new2028)';
        const at = Math.max(0, t.search(/2028|2027/) - 70);
        what = (at > 0 ? '…' : '') + t.slice(at, at + 170) + (t.length > at + 170 ? '…' : '');
        if (file.endsWith('.json') && qid && /^questions\//.test(file)) what = `question ${qid}: ${what}`;
      }
      hits.push(`  - line ${i + 1}: ${what.replace(/`/g, "'")}`);
    });
    if (!hits.length) continue;
    total += hits.length;
    byGroup[GROUPS.findIndex(([, test]) => test(file))].files.push({ file, hits });
  }
  let out = `${total} places in ${byGroup.reduce((n, g) => n + g.files.length, 0)} files.\n`;
  for (const g of byGroup) {
    if (!g.files.length) continue;
    out += `\n### ${g.title}\n\n`;
    for (const { file, hits } of g.files) out += `- \`${file}\` (${hits.length})\n${hits.join('\n')}\n`;
  }
  return out;
}

export function readSaved2028List() {
  if (!fs.existsSync(DOC)) return null;
  const t = fs.readFileSync(DOC, 'utf8').replace(/\r\n/g, '\n');
  const a = t.indexOf(START), b = t.indexOf(END);
  return a < 0 || b < 0 ? null : t.slice(a + START.length, b).trim();
}

export function check2028Register({ warn }) {
  const saved = readSaved2028List();
  if (saved === null) return warn('docs/2028_REGISTER.md: the list of 2028 notes is missing: run node tools/list-2028.mjs --write');
  if (saved !== build2028List().trim()) warn('docs/2028_REGISTER.md: a 2028 note was added, changed or removed, so the list is out of date: run node tools/list-2028.mjs --write');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const list = build2028List();
  if (process.argv.includes('--write')) {
    if (!fs.existsSync(DOC)) { console.log('docs/2028_REGISTER.md is missing.'); process.exit(1); }
    const t = fs.readFileSync(DOC, 'utf8');
    const eol = t.includes('\r\n') ? '\r\n' : '\n';
    const a = t.indexOf(START), b = t.indexOf(END);
    if (a < 0 || b < 0) { console.log('The list markers are missing from docs/2028_REGISTER.md.'); process.exit(1); }
    fs.writeFileSync(DOC, t.slice(0, a + START.length) + eol + list.trim().replace(/\n/g, eol) + eol + t.slice(b));
    console.log('Wrote the list to docs/2028_REGISTER.md: ' + list.split('\n')[0]);
  } else console.log(list);
}
