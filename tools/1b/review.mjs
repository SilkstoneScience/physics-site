// Records review decisions for Paper 1B datasets in tools/1b/reviews.json.
//
//   node tools/1b/review.mjs status
//       every dataset's status, fingerprint and last review
//   node tools/1b/review.mjs set <id> <STATUS> --by "<name>" [--note "<text>"] [--date YYYY-MM-DD] [--recorded-by "<name>"]
//       records a review: PHYSICS-REVIEWED, TEACHER-REVIEWED or APPROVED (in that order), or DRAFT
//   node tools/1b/review.mjs reset <id> --by "<name>" --note "<why it changed>"
//       after an intentional change to a reviewed dataset: clears its reviews (the history is kept),
//       so it must be reviewed and approved again
//
// Rules: a dataset can only be reviewed while it passes every automatic check and builds to its
// current fingerprint. Reviews go in order (no skipping). TEACHER-REVIEWED and APPROVED must name a
// person, not an assistant or an automated process. --recorded-by notes who typed the record if it
// wasn't the reviewer (for example "Claude, from the teacher's message").
import { loadDatasets, loadTopics, buildAll, printStatus } from './build.mjs';
import { loadRegistry, saveRegistry, saveSnapshot, STATUSES, REVIEWED } from './registry.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const today = () => new Date().toISOString().slice(0, 10);
const die = (msg) => { console.log(`✗ ${msg}`); process.exit(1); };

const [cmd = 'status', id, wanted] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const registry = loadRegistry();
const { results, diags } = buildAll(await loadDatasets(), loadTopics(), { registry });

if (cmd === 'status') {
  printStatus(results);
  process.exit(0);
}

const r = results.find((x) => x.id === id);
if (!r) die(`no dataset called ${id}`);
const by = opt('by');
if (!by) die('say who is reviewing, with --by "<name>"');
const date = opt('date') || today();
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) die('--date must look like 2026-10-06');
const entry = { by, date, ...(opt('note') ? { note: opt('note') } : {}), ...(opt('recorded-by') ? { recordedBy: opt('recorded-by') } : {}) };
const rec = registry.datasets[id] || { status: 'AUTO-VALIDATED', history: [] };

if (cmd === 'reset') {
  if (!opt('note')) die('say why the dataset changed, with --note "<text>"');
  rec.history.push({ status: 'RESET', ...entry, previousStatus: rec.status, previousFingerprint: rec.fingerprint, newFingerprint: r.fingerprint });
  rec.status = 'AUTO-VALIDATED';
  delete rec.fingerprint;
  registry.datasets[id] = rec;
  saveRegistry(registry);
  console.log(`✓ ${id} reset to AUTO-VALIDATED. Its reviews must now be recorded again.`);
  process.exit(0);
}

if (cmd !== 'set') die(`unknown command "${cmd}" (use status, set or reset)`);
if (!STATUSES.includes(wanted) || wanted === 'AUTO-VALIDATED') die(`status must be one of DRAFT, ${REVIEWED.join(', ')}`);
if (wanted === 'DRAFT') {
  rec.history.push({ status: 'DRAFT', ...entry });
  rec.status = 'DRAFT';
  delete rec.fingerprint;
} else {
  if (!r.valid) die(`${id} doesn't pass the automatic checks:\n  ` + diags.filter((x) => x.dataset === id && x.level === 'error').map((x) => x.message).join('\n  '));
  if (r.state.changed) die(`${id} has changed since its last review: reset it first (review.mjs reset ${id} --by … --note …)`);
  const current = REVIEWED.includes(rec.status) ? rec.status : 'AUTO-VALIDATED';
  const order = ['AUTO-VALIDATED', ...REVIEWED];
  if (order.indexOf(wanted) !== order.indexOf(current) + 1) {
    die(`${id} is ${current}: the next review is ${order[order.indexOf(current) + 1] || '(none: already APPROVED)'}, not ${wanted}`);
  }
  if ((wanted === 'TEACHER-REVIEWED' || wanted === 'APPROVED') && /\b(claude|assistant|ai|automated|bot|script)\b/i.test(by)) {
    die(`${wanted} must be recorded for a person (the teacher), not "${by}"`);
  }
  rec.history.push({ status: wanted, ...entry, fingerprint: r.fingerprint });
  rec.status = wanted;
  rec.fingerprint = r.fingerprint;
  saveSnapshot(id, r.content);
}
registry.datasets[id] = rec;
saveRegistry(registry);
console.log(`✓ ${id} is now ${rec.status} (by ${by}, ${date}).`);
