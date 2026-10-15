// Records review decisions for Paper 2 questions in tools/p2/reviews.json (the same rules as Paper 1B).
//
//   node tools/p2/review.mjs status
//   node tools/p2/review.mjs set <id> <STATUS> --by "<name>" [--note "<text>"] [--date YYYY-MM-DD] [--recorded-by "<name>"]
//       PHYSICS-REVIEWED, TEACHER-REVIEWED or APPROVED (in that order), or DRAFT
//   node tools/p2/review.mjs reset <id> --by "<name>" --note "<why it changed>"
//   node tools/p2/review.mjs batch <batch>
//       each question's risk class (RED / AMBER / GREEN) and reasons, and the GREEN sample needed
//   node tools/p2/review.mjs accept-batch <batch> --by "<teacher>" --note "<what was reviewed>" [--waive <id> "<reason>"] … [--recorded-by "<name>"]
//
// A review can only be recorded while the question passes every check, is unchanged since its last review,
// and its originality check has run (on a computer with the reference cache). TEACHER-REVIEWED and APPROVED
// must name a person. Never record them without the teacher's explicit decision.
import { loadQuestions, loadTopics, buildAll, printStatus } from './build.mjs';
import { loadRegistry, saveRegistry, saveSnapshot, STATUSES, REVIEWED, reviewProblem, NOT_A_PERSON, classify, SAMPLE_FRACTION } from './registry.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const today = () => new Date().toISOString().slice(0, 10);
const die = (msg) => { console.log(`✗ ${msg}`); process.exit(1); };
const [cmd = 'status', id, wanted] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')) && !(i > 1 && args[i - 2] === '--waive'));

const registry = loadRegistry();
const { results, diags } = buildAll(await loadQuestions(), loadTopics(), { registry });

if (cmd === 'status') { printStatus(results); process.exit(0); }

if (cmd === 'batch' || cmd === 'accept-batch') {
  if (!id) die(`say which batch, e.g. review.mjs ${cmd} batch-1`);
  const members = results.filter((r) => r.def.batch === id);
  if (!members.length) die(`no questions in ${id}`);
  const rows = members.map((r) => {
    const rec = registry.questions[r.id];
    return { id: r.id, ...classify(r, diags), status: r.state.status, inspected: !!rec && ['TEACHER-REVIEWED', 'APPROVED'].includes(rec.status) };
  });
  const greens = rows.filter((x) => x.class === 'GREEN');
  const sampleSize = greens.length ? Math.max(1, Math.ceil(SAMPLE_FRACTION * greens.length)) : 0;
  console.log(`Batch ${id}: ${rows.length} question(s)`);
  for (const x of rows) {
    console.log(`  ${x.id.padEnd(8)} ${x.class.padEnd(6)} ${x.status.padEnd(17)}${x.inspected ? 'inspected by the teacher' : ''}`);
    for (const why of x.reasons) console.log(`      - ${why}`);
  }
  console.log(`GREEN sample needed: ${sampleSize}`);
  if (cmd === 'batch') process.exit(0);

  const waive = {};
  args.forEach((a, i) => { if (a === '--waive') waive[args[i + 1]] = args[i + 2]; });
  const by = opt('by');
  const note = opt('note');
  const errors = [];
  if (!by) errors.push('say who accepts the batch, with --by "<name>"');
  else if (NOT_A_PERSON.test(by)) errors.push(`a batch can only be accepted by a person (the teacher), not "${by}"`);
  if (!note) errors.push('give a note describing what was reviewed, with --note "<text>"');
  if (registry.batches && registry.batches[id]) errors.push(`batch ${id} has already been decided`);
  for (const x of rows) {
    const r = results.find((y) => y.id === x.id);
    if (x.class === 'RED') errors.push(`${x.id} is RED (${x.reasons.join('; ')}): fix it first`);
    if (r.state.changed) errors.push(`${x.id} has changed since its last review`);
    if (!r.originality || !r.originality.ran) errors.push(`${x.id}: the originality check hasn't run on this computer`);
    if (!['PHYSICS-REVIEWED', 'TEACHER-REVIEWED', 'APPROVED'].includes(x.status)) errors.push(`${x.id} needs at least PHYSICS-REVIEWED`);
    if (x.class === 'AMBER' && !x.inspected && !waive[x.id]) errors.push(`${x.id} is AMBER (${x.reasons.join('; ')}): the teacher reviews it individually, or waives it with --waive ${x.id} "<reason>"`);
  }
  if (rows.filter((x) => x.class === 'GREEN' && x.inspected).length < sampleSize) errors.push(`the GREEN sample needs ${sampleSize} TEACHER-REVIEWED question(s)`);
  if (errors.length) die(`batch ${id} can't be accepted yet:\n  ` + errors.join('\n  '));
  const who = { by, date: opt('date') || today(), ...(opt('recorded-by') ? { recordedBy: opt('recorded-by') } : {}) };
  for (const x of rows) {
    const r = results.find((y) => y.id === x.id);
    const rec = registry.questions[x.id];
    if (rec.status === 'APPROVED') continue;
    const inspected = rec.status === 'TEACHER-REVIEWED';
    if (!inspected) rec.history.push({ status: 'BATCH-ACCEPTED', ...who, batch: id, risk: x.class, inspected: false, fingerprint: r.fingerprint, note: x.class === 'AMBER' ? `AMBER waived by the teacher: ${waive[x.id]}` : 'GREEN: accepted as part of the batch; not individually inspected' });
    rec.history.push({ status: 'APPROVED', ...who, basis: 'batch', batch: id, inspected, risk: x.class, fingerprint: r.fingerprint });
    rec.status = 'APPROVED';
    rec.fingerprint = r.fingerprint;
    saveSnapshot(x.id, r.content);
  }
  registry.batches = registry.batches || {};
  registry.batches[id] = { decision: 'ACCEPTED', ...who, note, questions: rows.map((x) => ({ id: x.id, risk: x.class, reasons: x.reasons, inspected: x.inspected, ...(waive[x.id] ? { waived: waive[x.id] } : {}) })), sampleSize };
  saveRegistry(registry);
  console.log(`✓ Batch ${id} accepted by ${by}. Now run node tools/p2/build.mjs to publish the approved questions.`);
  process.exit(0);
}

const r = results.find((x) => x.id === id);
if (!r) die(`no question called ${id}`);
const by = opt('by');
if (!by) die('say who is reviewing, with --by "<name>"');
const date = opt('date') || today();
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) die('--date must look like 2026-10-14');
const entry = { by, date, ...(opt('note') ? { note: opt('note') } : {}), ...(opt('recorded-by') ? { recordedBy: opt('recorded-by') } : {}) };
const rec = registry.questions[id] || { status: 'AUTO-VALIDATED', history: [] };

if (cmd === 'reset') {
  if (!opt('note')) die('say why the question changed, with --note "<text>"');
  rec.history.push({ status: 'RESET', ...entry, previousStatus: rec.status, previousFingerprint: rec.fingerprint, newFingerprint: r.fingerprint });
  rec.status = 'AUTO-VALIDATED';
  delete rec.fingerprint;
  registry.questions[id] = rec;
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
  if (!r.valid) die(`${id} doesn't pass the checks:\n  ` + diags.filter((x) => x.question === id && x.level === 'error').map((x) => x.message).join('\n  '));
  if (!r.originality || !r.originality.ran) die(`${id}: the originality check hasn't run (no reference cache on this computer), so it can't be reviewed here`);
  const problem = reviewProblem(rec, wanted, by, { valid: r.valid, changed: r.state.changed });
  if (problem) die(`${id}: ${problem.replace(/dataset/g, 'question')}`);
  rec.history.push({ status: wanted, ...entry, ...(wanted === 'APPROVED' ? { basis: 'individual', inspected: true } : {}), fingerprint: r.fingerprint });
  rec.status = wanted;
  rec.fingerprint = r.fingerprint;
  saveSnapshot(id, r.content);
}
registry.questions[id] = rec;
saveRegistry(registry);
console.log(`✓ ${id} is now ${rec.status} (by ${by}, ${date}).`);
