// Accuracy-audit record: what has been audited, and what has changed or been added since.
// The record is tools/audit/audited.json. How the audits work: docs/ACCURACY_AUDIT.md.
//
//   node tools/audit-status.mjs                 what needs auditing: changed files, new or edited questions and
//                                               game items (by id), files never audited, and the layout check
//   node tools/audit-status.mjs --all           the same, and also lists everything that is unchanged
//   node tools/audit-status.mjs --diff <file>   what changed in one file since its audit
//   node tools/audit-status.mjs --record <audit-name> <file> [<file> ...]
//                                               record that these files were audited as they are now
//                                               ("topics" = the 24 topic pages; "layout" = the phone-width and
//                                               dark-mode check of every page)
//   node tools/audit-status.mjs --ignore <file-or-folder/> "<reason>"
//                                               never list this as "never audited" (generated pages, lists of links…)
//
// A file is "changed" when a fingerprint of its text (line endings ignored) differs from the one saved at its audit.
// A data file that is a list of items with ids (the question bank, the Explanation builder, the word games…) is
// compared item by item, so the report names the new and edited items and ignores the rest of the file.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RECORD = path.join(ROOT, 'tools', 'audit', 'audited.json');

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');
const fingerprint = (file) => sha(read(file));
const exists = (file) => fs.existsSync(path.join(ROOT, file));
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const norm = (f) => f.replace(/\\/g, '/');

// The items of a data file that is a list of things with ids: { id: fingerprint }, or null for any other file.
function itemsOf(file) {
  if (!file.endsWith('.json')) return null;
  let data;
  try { data = JSON.parse(read(file)); } catch { return null; }
  if (!Array.isArray(data) || !data.length || typeof data[0] !== 'object') return null;
  const key = ['id', 'term'].find((k) => data.every((x) => x && typeof x[k] === 'string'));
  if (!key) return null;
  const out = {};
  for (const x of data) out[x[key]] = sha(JSON.stringify(x));
  return out;
}

function walk(dir, test, out = []) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return out;
  for (const name of fs.readdirSync(full).sort()) {
    const rel = norm(path.join(dir, name));
    if (fs.statSync(path.join(ROOT, rel)).isDirectory()) walk(rel, test, out);
    else if (test(rel)) out.push(rel);
  }
  return out;
}

// Everything on the published site that an accuracy audit could cover: pages, data files and diagrams.
const SKIP_DIRS = /^(\.git|\.claude|\.github|node_modules|docs|tools|images|news|css|js)\//;
const SKIP_FILES = /(^|\/)(search-index\.json|sitemap\.xml|index\.json|package(-lock)?\.json)$|-preview(\.json|\/)|^questions\/1b\/|^experimental\/data\//;
const auditable = () => walk('', (f) => /\.(html|json|svg)$/.test(f) && !SKIP_DIRS.test(f + (f.includes('/') ? '' : '/')) && !SKIP_DIRS.test(f) && !SKIP_FILES.test(f));
const topicPages = () => walk('themes', (f) => /^themes\/[a-e]\d\.html$/.test(f));
const layoutFiles = () => walk('css', (f) => f.endsWith('.css'));
const layoutPrint = () => sha(layoutFiles().map((f) => f + '\n' + read(f)).join('\n'));
const pageList = () => walk('', (f) => f.endsWith('.html') && !SKIP_DIRS.test(f));

const load = () => {
  const r = fs.existsSync(RECORD) ? JSON.parse(fs.readFileSync(RECORD, 'utf8')) : {};
  return { files: {}, ignore: {}, ...r };
};
const save = (record) => {
  record.files = Object.fromEntries(Object.entries(record.files).sort(([a], [b]) => a.localeCompare(b)));
  record.ignore = Object.fromEntries(Object.entries(record.ignore).sort(([a], [b]) => a.localeCompare(b)));
  fs.mkdirSync(path.dirname(RECORD), { recursive: true });
  fs.writeFileSync(RECORD, JSON.stringify(record, null, 2) + '\n');
};
const today = () => new Date().toISOString().slice(0, 10);
const head = () => { try { return git('rev-parse', 'HEAD'); } catch { return ''; } };

const args = process.argv.slice(2);

if (args[0] === '--record') {
  const audit = args[1];
  let files = args.slice(2).map(norm);
  if (!audit || !files.length) { console.log('Usage: node tools/audit-status.mjs --record <audit-name> <file> [<file> ...]   (or "topics", or "layout")'); process.exit(1); }
  const record = load();
  const commit = head(), date = today();
  if (files.includes('topics')) files = [...files.filter((f) => f !== 'topics'), ...topicPages()];
  for (const file of files) {
    if (file === 'layout') {
      record.layout = { audit, date, commit, fingerprint: layoutPrint(), pages: pageList() };
      console.log(`✓ layout: recorded as checked on ${record.layout.pages.length} pages (${audit})`);
      continue;
    }
    if (!exists(file)) { console.log(`✗ ${file}: no such file`); process.exit(1); }
    const items = itemsOf(file);
    record.files[file] = { audit, date, fingerprint: fingerprint(file), commit, ...(items ? { items } : {}) };
    console.log(`✓ ${file}: recorded as audited (${audit})${items ? `, ${Object.keys(items).length} items` : ''}`);
  }
  save(record);
  process.exit(0);
}

if (args[0] === '--ignore') {
  const what = norm(args[1] || ''), reason = args[2];
  if (!what || !reason) { console.log('Usage: node tools/audit-status.mjs --ignore <file-or-folder/> "<reason>"'); process.exit(1); }
  const record = load();
  record.ignore[what] = reason;
  save(record);
  console.log(`✓ ${what} will not be listed as "never audited": ${reason}`);
  process.exit(0);
}

const record = load();

// Compare one recorded file with its present state.
function compare(file) {
  const entry = record.files[file];
  if (!exists(file)) return { state: 'missing' };
  if (entry.items) {
    const now = itemsOf(file) || {};
    const added = Object.keys(now).filter((id) => !(id in entry.items));
    const edited = Object.keys(now).filter((id) => id in entry.items && now[id] !== entry.items[id]);
    const removed = Object.keys(entry.items).filter((id) => !(id in now));
    return { state: added.length || edited.length || removed.length ? 'changed' : 'same', added, edited, removed, total: Object.keys(now).length };
  }
  return { state: fingerprint(file) === entry.fingerprint ? 'same' : 'changed' };
}

if (args[0] === '--diff') {
  const file = norm(args[1] || '');
  const entry = record.files[file];
  if (!entry) { console.log(`${file} has no audit record.`); process.exit(1); }
  const c = compare(file);
  if (c.added) console.log(`New items: ${c.added.join(', ') || 'none'}\nEdited items: ${c.edited.join(', ') || 'none'}\nRemoved items: ${c.removed.join(', ') || 'none'}\n`);
  if (!entry.commit) { console.log('No commit was saved with this record, so the changed lines cannot be shown.'); process.exit(0); }
  try { console.log(git('diff', '--stat', '--patch', entry.commit, '--', file) || 'No changed lines since the audit.'); }
  catch { console.log(`The audit's commit (${entry.commit.slice(0, 7)}) is not in this copy of the repository. Try: git log -p --since=${entry.date} -- ${file}`); }
  process.exit(0);
}

const same = [], changed = [], missing = [];
for (const file of Object.keys(record.files)) {
  const c = compare(file);
  (c.state === 'same' ? same : c.state === 'missing' ? missing : changed).push([file, c]);
}
const ignored = (f) => Object.keys(record.ignore).some((g) => (g.endsWith('/') ? f.startsWith(g) : f === g));
const never = auditable().filter((f) => !record.files[f] && !ignored(f));

console.log(`AUDITED AND UNCHANGED: ${same.length} files. Skip these unless asked.`);
if (args.includes('--all')) for (const [f] of same) console.log(`  ✓ ${f}  (${record.files[f].audit})`);

console.log(`\nCHANGED SINCE THEIR AUDIT: ${changed.length} files. Check only what changed.`);
for (const [f, c] of changed) {
  if (c.added) {
    console.log(`  ! ${f}  (${record.files[f].audit})`);
    if (c.added.length) console.log(`      new, never audited (${c.added.length}): ${c.added.join(', ')}`);
    if (c.edited.length) console.log(`      edited since their audit (${c.edited.length}): ${c.edited.join(', ')}`);
    if (c.removed.length) console.log(`      removed (${c.removed.length}): ${c.removed.join(', ')}`);
  } else console.log(`  ! ${f}  (${record.files[f].audit})   see: node tools/audit-status.mjs --diff ${f}`);
}

if (missing.length) { console.log(`\nRECORDED BUT NO LONGER ON THE SITE: ${missing.length}`); for (const [f] of missing) console.log(`  ? ${f}`); }

console.log(`\nNEVER AUDITED: ${never.length} files.`);
const byDir = {};
for (const f of never) (byDir[f.includes('/') ? f.slice(0, f.lastIndexOf('/') + 1) : '(top level)'] ||= []).push(f.slice(f.lastIndexOf('/') + 1));
for (const [dir, names] of Object.entries(byDir)) console.log(`  - ${dir}  (${names.length}): ${names.join(', ')}`);

console.log('\nLAYOUT (every page at phone width and in dark mode):');
if (!record.layout) console.log('  - never recorded');
else {
  const cssSame = layoutPrint() === record.layout.fingerprint;
  const newPages = pageList().filter((p) => !record.layout.pages.includes(p));
  console.log(`  ${cssSame ? '✓' : '!'} checked ${record.layout.date} (${record.layout.audit}) on ${record.layout.pages.length} pages; the stylesheets have ${cssSame ? 'not changed' : 'CHANGED since, so the check is out of date'}.`);
  if (newPages.length) console.log(`  ! pages added since, not yet checked (${newPages.length}): ${newPages.join(', ')}`);
}
