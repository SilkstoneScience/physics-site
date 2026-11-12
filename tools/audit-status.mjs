// Accuracy-audit record: which pages have been audited, and which have changed since.
// The record is tools/audit/audited.json. How the audits work: docs/ACCURACY_AUDIT.md.
//
//   node tools/audit-status.mjs                      list every audited page: unchanged, or changed since its audit
//   node tools/audit-status.mjs --diff themes/a1.html   show what changed in one page since its audit
//   node tools/audit-status.mjs --record <audit-name> <file> [<file> ...]
//                                                    record that these files were audited as they are now
//                                                    (use "topics" for all 24 topic pages)
//
// "Changed" compares a fingerprint of the file's text (line endings ignored) with the one saved at the audit.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RECORD = path.join(ROOT, 'tools', 'audit', 'audited.json');

const fingerprint = (file) =>
  crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 16);

const load = () => (fs.existsSync(RECORD) ? JSON.parse(fs.readFileSync(RECORD, 'utf8')) : { files: {} });
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const topicPages = () => fs.readdirSync(path.join(ROOT, 'themes')).filter((f) => /^[a-e]\d\.html$/.test(f)).sort().map((f) => `themes/${f}`);

const args = process.argv.slice(2);

if (args[0] === '--record') {
  const audit = args[1];
  let files = args.slice(2);
  if (!audit || !files.length) { console.log('Usage: node tools/audit-status.mjs --record <audit-name> <file> [<file> ...]   (or "topics")'); process.exit(1); }
  if (files.length === 1 && files[0] === 'topics') files = topicPages();
  const record = load();
  let commit = '';
  try { commit = git('rev-parse', 'HEAD'); } catch { /* not a git checkout: the fingerprint is enough */ }
  const date = new Date().toISOString().slice(0, 10);
  for (const f of files) {
    const file = f.replace(/\\/g, '/');
    if (!fs.existsSync(path.join(ROOT, file))) { console.log(`✗ ${file}: no such file`); process.exit(1); }
    record.files[file] = { audit, date, fingerprint: fingerprint(file), commit };
    console.log(`✓ ${file}: recorded as audited (${audit})`);
  }
  record.files = Object.fromEntries(Object.entries(record.files).sort(([a], [b]) => a.localeCompare(b)));
  fs.mkdirSync(path.dirname(RECORD), { recursive: true });
  fs.writeFileSync(RECORD, JSON.stringify(record, null, 2) + '\n');
  process.exit(0);
}

const record = load();

if (args[0] === '--diff') {
  const file = (args[1] || '').replace(/\\/g, '/');
  const entry = record.files[file];
  if (!entry) { console.log(`${file} has no audit record.`); process.exit(1); }
  if (!entry.commit) { console.log('No commit was saved with this record, so the changes cannot be shown.'); process.exit(1); }
  try { console.log(git('diff', '--stat', '--patch', entry.commit, '--', file) || 'No changes since the audit.'); }
  catch { console.log(`The audit's commit (${entry.commit.slice(0, 7)}) is not in this copy of the repository. Try: git log -p --since=${entry.date} -- ${file}`); }
  process.exit(0);
}

const changed = [], same = [], missing = [];
for (const [file, entry] of Object.entries(record.files)) {
  if (!fs.existsSync(path.join(ROOT, file))) missing.push(file);
  else (fingerprint(file) === entry.fingerprint ? same : changed).push(file);
}
const unrecorded = topicPages().filter((f) => !record.files[f]);

console.log(`Audited and unchanged (${same.length}): skip these unless asked.`);
for (const f of same) console.log(`  ✓ ${f}  (${record.files[f].audit}, ${record.files[f].date})`);
console.log(`\nChanged since their audit (${changed.length}): check only what changed.`);
for (const f of changed) console.log(`  ! ${f}  (${record.files[f].audit}, ${record.files[f].date})   node tools/audit-status.mjs --diff ${f}`);
if (missing.length) { console.log(`\nRecorded but no longer in the site (${missing.length}):`); for (const f of missing) console.log(`  ? ${f}`); }
if (unrecorded.length) { console.log(`\nTopic pages never audited (${unrecorded.length}):`); for (const f of unrecorded) console.log(`  - ${f}`); }
