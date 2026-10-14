// Builds questions/p2.json from the question files in tools/p2/questions/ (docs/PAPER2_SPECIFICATION.md).
//   node tools/p2/build.mjs            build, check, and write questions/p2.json if everything passes
//   node tools/p2/build.mjs --audit    also print each question's values, results, syllabus and checks
// Only APPROVED questions (unchanged since approval) go into questions/p2.json; every other question that
// passes the checks goes into questions/p2-preview.json, which is never committed or published (the question
// bank shows it only on localhost). tools/check.mjs runs the same build and fails if p2.json is out of date.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildQuestion, dimensionCheck, shownValue } from './generate.mjs';
import { validateQuestion } from './validate.mjs';
import { checkOriginality } from './originality.mjs';
import { INDEPENDENT } from './independent.mjs';
import { SYLLABUS_IDS } from './syllabus.mjs';
import { loadRegistry, stateFor, freezeDiagnostic } from './registry.mjs';
import { stableStringify } from '../1b/fingerprint.mjs';
import { loadTopics } from '../1b/build.mjs';
import { fmtSig } from './units.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '../..');
export const OUTPUT = 'questions/p2.json';
export const PREVIEW = 'questions/p2-preview.json'; // local only: never committed or published
export { loadTopics };

export async function loadQuestions(dir = path.join(HERE, 'questions')) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mjs')).sort();
  const out = [];
  for (const file of files) out.push({ file, def: (await import(pathToFileURL(path.join(dir, file)).href)).default });
  return out;
}

// Everything that must stay the same once a question has been reviewed: the published question (wording,
// numbers, mark scheme, typed answers), the given values, every result, the syllabus tags, the examiner notes,
// and the diagram files (line endings normalised).
export function canonicalContent(def, built, root = ROOT) {
  const files = [def.diagram && def.diagram.file, ...JSON.stringify(built.question).matchAll(/src=\\"([^"\\]+)\\"/g)].map((m) => (Array.isArray(m) ? m[1] : m)).filter(Boolean);
  const diagrams = Object.fromEntries(files.map((f) => {
    const full = path.join(root, f);
    return [f, fs.existsSync(full) ? crypto.createHash('sha256').update(fs.readFileSync(full, 'utf8').replace(/\r\n?/g, '\n')).digest('hex') : null];
  }));
  return {
    question: built.question,
    type: def.type, topics: def.topics,
    given: def.given,
    results: Object.fromEntries(Object.entries(built.results).map(([k, r]) => [k, { value: shownValue(r), unit: r.unit, sf: r.sf }])),
    parts: (def.parts || []).map((pt) => ({ label: pt.label, command: pt.command, syllabus: pt.syllabus, examinerNote: pt.examinerNote, dependsOn: pt.dependsOn })),
    diagrams,
  };
}
export const fingerprintOf = (content) => crypto.createHash('sha256').update(stableStringify(content)).digest('hex');

// Builds every question twice (it must come out the same), checks it, works out its review status and checks
// the freeze. Returns { questions, preview, diags, results, json, previewJson }.
export function buildAll(list, topics, { registry = loadRegistry(), independent = INDEPENDENT, root = ROOT, originality = true } = {}) {
  const questions = [];
  const preview = [];
  const diags = [];
  const results = [];
  const ids = new Set();
  for (const { file, def } of list) {
    const id = (def && def.id) || file;
    const add = (x) => diags.push({ ...x, question: id, where: file });
    if (file && file !== `${id}.mjs`) add({ level: 'error', code: 'meta', message: `the file should be called ${id}.mjs` });
    if (ids.has(id)) { add({ level: 'error', code: 'duplicate-id', message: `id ${id} is used twice` }); continue; }
    ids.add(id);
    let built;
    try {
      built = buildQuestion(def);
      if (stableStringify(buildQuestion(def).question) !== stableStringify(built.question)) add({ level: 'error', code: 'determinism', message: 'building twice gave different results' });
      built.dimensionProblems = dimensionCheck(def, built.results);
    } catch (e) {
      add({ level: 'error', code: e.code || 'crash', message: `couldn't be built: ${e.message}` });
      results.push({ id, def, valid: false, state: stateFor(id, false, null, registry) });
      continue;
    }
    const orig = originality ? checkOriginality(def, built.question, root) : { ran: false, problems: [], note: 'originality check not requested' };
    for (const x of validateQuestion(def, built, { root, topics, originality: orig, independent })) add(x);
    const valid = !diags.some((x) => x.question === id && x.level === 'error');
    const content = canonicalContent(def, built, root);
    const fingerprint = fingerprintOf(content);
    const state = stateFor(id, valid, fingerprint, registry);
    if (state.changed) add(freezeDiagnostic(id, state.rec, content, fingerprint));
    const out = { ...built.question, review: { status: state.status } };
    if (valid && !state.changed) (state.status === 'APPROVED' ? questions : preview).push(out);
    results.push({ id, def, built, valid, content, fingerprint, state, originality: orig });
  }
  for (const id of Object.keys(registry.questions)) {
    if (!ids.has(id)) diags.push({ level: 'error', code: 'registry', question: id, where: 'tools/p2/reviews.json', message: 'has a review record, but there is no question file with this id' });
  }
  return {
    questions, preview, diags, results,
    json: JSON.stringify(questions, null, 2) + '\n',
    previewJson: JSON.stringify(preview, null, 2) + '\n',
  };
}

export const formatDiag = (x) => `${x.level === 'error' ? '✗' : '!'} ${x.question} [${x.code}] ${x.message}`;

export function printStatus(results) {
  console.log('Question  Status             Fingerprint       Last review');
  for (const r of results) {
    const rec = r.state.rec;
    const last = rec && rec.history && rec.history[rec.history.length - 1];
    const flag = r.state.changed ? '  ✗ CHANGED SINCE REVIEW' : '';
    console.log(`${r.id.padEnd(10)}${r.state.status.padEnd(19)}${(r.fingerprint || '-').slice(0, 16).padEnd(18)}${last ? `${last.status} by ${last.by}, ${last.date}` : '(none: automatic checks only)'}${flag}`);
  }
  console.log('Only APPROVED questions are published. Change a status with: node tools/p2/review.mjs set <id> <STATUS> --by "<name>"\n');
}

// --audit: what a reviewer needs beside the question itself.
function printAudit(results, diags) {
  for (const r of results) {
    const { def } = r;
    console.log(`\n================ ${r.id}: ${def.title || ''} (${def.type}, ${def.level}, ${(def.topics || []).join(' + ')}) ================`);
    console.log(`Status: ${r.state.status}${r.state.changed ? ' (CHANGED SINCE REVIEW)' : ''}`);
    console.log(`Originality: ${def.originality ? def.originality.note : '-'}${def.originality && def.originality.inspiredBy ? `\n  inspired by ${def.originality.inspiredBy}` : ''}`);
    if (r.originality) console.log(`  check: ${r.originality.ran ? `ran against ${r.originality.note}; ${r.originality.problems.length} problem(s)` : `NOT RUN (${r.originality.note})`}`);
    console.log('Given values:');
    for (const [k, g] of Object.entries(def.given || {})) console.log(`  ${k} = ${g.value} ${g.unit || ''}  (${g.what}; plausible ${(g.range || []).join(' to ')})`);
    if (r.built) {
      console.log('Results (independently checked; dimension-checked unless marked):');
      for (const [k, x] of Object.entries(r.built.results)) console.log(`  ${k} = ${fmtSig(shownValue(x), 5).replace(/\$|\\times/g, (s) => (s === '$' ? '' : '×'))} ${x.unit}${x.inUnit || x.noDimensionCheck ? '  (not dimension-checked)' : ''}`);
    }
    console.log('Parts:');
    for (const pt of def.parts || []) {
      console.log(`  (${pt.label}) ${pt.command}, ${pt.marks} mark(s); ${(pt.syllabus || []).map((s) => `${s} ${SYLLABUS_IDS.get(s) ? `[${SYLLABUS_IDS.get(s).hl ? 'AHL' : 'SL'}: ${SYLLABUS_IDS.get(s).label}]` : '[unknown]'}`).join('; ')}`);
      console.log(`      note: ${pt.examinerNote || '-'}`);
    }
    const mine = diags.filter((x) => x.question === r.id);
    if (mine.length) { console.log('Checks:'); for (const x of mine) console.log('  ' + formatDiag(x)); }
  }
  console.log('');
}

async function main() {
  const list = await loadQuestions();
  const { questions, preview, diags, results, json, previewJson } = buildAll(list, loadTopics());
  if (process.argv.includes('--audit')) printAudit(results, diags);
  else for (const x of diags) console.log(formatDiag(x));
  const errors = diags.filter((x) => x.level === 'error');
  console.log('');
  printStatus(results);
  if (errors.length) {
    console.log(`✗ ${errors.length} error(s). ${OUTPUT} was NOT changed: fix the questions above first.`);
    process.exit(1);
  }
  fs.writeFileSync(path.join(ROOT, OUTPUT), json);
  fs.writeFileSync(path.join(ROOT, PREVIEW), previewJson);
  console.log(`✓ Production (${OUTPUT}): ${questions.length} APPROVED question(s). Local preview (${PREVIEW}, never published): ${preview.length} question(s).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
