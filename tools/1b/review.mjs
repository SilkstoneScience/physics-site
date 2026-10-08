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
//   node tools/1b/review.mjs batch <batch>
//       the batch plan: each dataset's risk class (RED/AMBER/GREEN) and reasons, what the teacher must
//       review, the GREEN sample size and a suggested sample, diversity warnings (changes nothing)
//   node tools/1b/review.mjs accept-batch <batch> --by "<teacher>" --note "<what was reviewed>" --systemic-ok
//         [--waive <id> "<reason>"] … [--waive diversity "<reason>"] [--recorded-by "<name>"]
//       the teacher's batch decision (see batch.mjs and docs/PAPER1B_SPECIFICATION.md section 16): promotes
//       every dataset of the batch to APPROVED, recording for each whether the teacher inspected it
//
// Rules: a dataset can only be reviewed while it passes every automatic check and builds to its
// current fingerprint. Reviews go in order (no skipping). TEACHER-REVIEWED and APPROVED must name a
// person, not an assistant or an automated process. --recorded-by notes who typed the record if it
// wasn't the reviewer (for example "Claude, from the teacher's message").
import { loadDatasets, loadTopics, buildAll, printStatus } from './build.mjs';
import { loadRegistry, saveRegistry, saveSnapshot, STATUSES, REVIEWED, reviewProblem } from './registry.mjs';
import { batchPlan, acceptBatch } from './batch.mjs';
import { VERDICT_MARGIN } from './validate.mjs';

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

if (cmd === 'batch' || cmd === 'accept-batch') {
  if (!id) die(`say which batch, e.g. review.mjs ${cmd} batch-1`);
  const plan = batchPlan(id, { results, diags, registry, verdictMargin: VERDICT_MARGIN });
  console.log(`Batch ${id}: ${plan.rows.length} dataset(s)`);
  for (const x of plan.rows) {
    console.log(`  ${x.id.padEnd(9)} ${x.class.padEnd(6)} ${x.status.padEnd(17)}${x.individuallyReviewed ? 'reviewed individually' : ''}`);
    for (const why of x.reasons) console.log(`      - ${why}`);
    if (x.priority) console.log(`      * ${x.priority}: preferred for the sample`);
  }
  console.log(`GREEN sample needed: ${plan.sampleSize} (suggested: ${plan.suggestedSample.join(', ') || 'none'})`);
  for (const w of plan.diversity) console.log(`Diversity: ${w}`);
  if (cmd === 'batch') process.exit(0);
  // --waive <id|diversity> "<reason>" (repeatable)
  const waive = {};
  args.forEach((a, i) => { if (a === '--waive') waive[args[i + 1]] = args[i + 2]; });
  const out = acceptBatch(plan, registry, {
    by: opt('by'), date: opt('date') || today(), note: opt('note'), recordedBy: opt('recorded-by'),
    waive, systemicOk: args.includes('--systemic-ok'),
    fingerprints: Object.fromEntries(results.map((x) => [x.id, x.fingerprint])),
  });
  if (out.errors.length) die(`batch ${id} can't be accepted yet:\n  ` + out.errors.join('\n  '));
  for (const a of out.approved) saveSnapshot(a.id, results.find((x) => x.id === a.id).content);
  saveRegistry(out.registry);
  console.log(`✓ Batch ${id} accepted by ${opt('by')}. APPROVED: ${out.approved.map((a) => `${a.id} (${a.inspected ? 'inspected' : 'not individually inspected'})`).join(', ')}`);
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

if (cmd !== 'set') die(`unknown command "${cmd}" (use status, set, reset, batch or accept-batch)`);
if (!STATUSES.includes(wanted) || wanted === 'AUTO-VALIDATED') die(`status must be one of DRAFT, ${REVIEWED.join(', ')}`);
if (wanted === 'DRAFT') {
  rec.history.push({ status: 'DRAFT', ...entry });
  rec.status = 'DRAFT';
  delete rec.fingerprint;
} else {
  if (!r.valid) die(`${id} doesn't pass the automatic checks:\n  ` + diags.filter((x) => x.dataset === id && x.level === 'error').map((x) => x.message).join('\n  '));
  if (r.state.changed) die(`${id} has changed since its last review: reset it first (review.mjs reset ${id} --by … --note …)`);
  const problem = reviewProblem(rec, wanted, by, { valid: r.valid, changed: r.state.changed });
  if (problem) die(`${id}: ${problem}`);
  rec.history.push({ status: wanted, ...entry, ...(wanted === 'APPROVED' ? { basis: 'individual', inspected: true } : {}), fingerprint: r.fingerprint });
  rec.status = wanted;
  rec.fingerprint = r.fingerprint;
  saveSnapshot(id, r.content);
}
registry.datasets[id] = rec;
saveRegistry(registry);
console.log(`✓ ${id} is now ${rec.status} (by ${by}, ${date}).`);
