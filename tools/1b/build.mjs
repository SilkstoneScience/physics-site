// Builds questions/1b.json from the dataset files in tools/1b/datasets/.
//   node tools/1b/build.mjs            generate, validate, and write questions/1b.json if everything passes
//   node tools/1b/build.mjs --report   also print each dataset's key values
//   node tools/1b/build.mjs --audit    also print each dataset's physics (for a teacher to check)
// tools/check.mjs runs the same build in memory and fails if questions/1b.json is out of date,
// so the published file always matches the datasets exactly.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildQuestion, generateRows, makeContext, paramValues } from './generate.mjs';
import { LAWS } from './laws.mjs';
import { validateDataset, formatDiag } from './validate.mjs';
import { sigFig, parseUnit } from './lib.mjs';
import { canonicalContent, fingerprintOf } from './fingerprint.mjs';
import { loadRegistry, stateFor, freezeDiagnostic } from './registry.mjs';
import { SYSTEMATIC_TYPES } from './systematic.mjs';
import { independentAudit } from './independent.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '../..');
export const OUTPUT = 'questions/1b.json';
export const PREVIEW = 'questions/1b-preview.json'; // local only: never committed or published

export async function loadDatasets(dir = path.join(HERE, 'datasets')) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mjs')).sort();
  const out = [];
  for (const file of files) out.push({ file, def: (await import(pathToFileURL(path.join(dir, file)).href)).default });
  return out;
}

// The syllabus list from js/site.js (to know which topics are HL only), read the same way as tools/check.mjs.
export function loadTopics() {
  const noop = () => {};
  const el = () => null;
  const document = {
    body: { dataset: {}, classList: { add: noop }, append: noop },
    getElementById: el, querySelector: el, querySelectorAll: () => [],
    addEventListener: noop, createElement: () => ({ setAttribute: noop, addEventListener: noop, classList: { add: noop } }),
    readyState: 'complete', referrer: '',
  };
  const sandbox = { document, location: { origin: '', pathname: '/' }, history: {}, localStorage: { getItem: el, setItem: noop }, console };
  sandbox.window = sandbox;
  sandbox.addEventListener = noop;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/site.js'), 'utf8'), sandbox);
  return new Map(sandbox.SYLLABUS.flatMap((t) => t.topics.map((s) => [s.id, { ...s, theme: t.id }])));
}

// Builds every dataset twice (to prove it's deterministic), validates it, works out its review status
// and checks the freeze. Only APPROVED datasets (unchanged since approval) go into questions/1b.json;
// every other dataset that passes validation goes into the local-only preview file.
export function buildAll(datasets, topics, { registry = loadRegistry() } = {}) {
  const questions = [];
  const preview = [];
  const diags = [];
  const reports = [];
  const results = [];
  const ids = new Set();
  for (const { file, def } of datasets) {
    const id = (def && def.id) || file;
    const fail = (code, message) => diags.push({ level: 'error', code, dataset: id, where: file, message });
    if (file && file !== `${id}.mjs`) fail('meta', `the file should be called ${id}.mjs`);
    if (ids.has(id)) { fail('duplicate-id', `id ${id} is used by more than one dataset`); continue; }
    ids.add(id);
    let built;
    try {
      built = buildQuestion(def);
      if (JSON.stringify(buildQuestion(def).question) !== JSON.stringify(built.question)) fail('determinism', 'building twice gave different results');
    } catch (e) {
      fail(e.code || 'crash', `couldn't be generated: ${e.message}`);
      results.push({ id, def, valid: false, state: stateFor(id, false, null, registry) });
      continue;
    }
    const found = validateDataset(def, built.question, { topics, traced: built.traced, meta: built.meta });
    diags.push(...found);
    // The independent physics audit (tools/1b/independent.mjs): its own physics, units and fits.
    diags.push(...independentAudit(def, built.question));
    const valid = !diags.some((x) => x.dataset === id && x.level === 'error');
    const content = canonicalContent(def, built);
    const fingerprint = fingerprintOf(content);
    const state = stateFor(id, valid, fingerprint, registry);
    if (state.changed) diags.push(freezeDiagnostic(id, state.rec, content, fingerprint));
    const out = { ...built.question, review: { status: state.status } };
    if (valid && !state.changed) (state.status === 'APPROVED' ? questions : preview).push(out);
    reports.push({ id, d: built.d });
    results.push({ id, def, built, valid, content, fingerprint, state });
  }
  for (const id of Object.keys(registry.datasets)) {
    if (!ids.has(id)) diags.push({ level: 'error', code: 'registry', dataset: id, where: 'tools/1b/reviews.json', message: 'has a review record, but there is no dataset file with this id' });
  }
  return {
    questions, preview, diags, reports, results,
    json: JSON.stringify(questions, null, 2) + '\n',
    previewJson: JSON.stringify(preview, null, 2) + '\n',
  };
}

// --audit: each dataset's physics written out for a teacher to check: scenario, principles,
// assumptions, derivation, the vetted laws used, parameters, measurement models, expected
// magnitudes against the noise-free model, and whether the analysis recovers the parameters.
function lawsIn(expr, out = new Set()) {
  if (expr && typeof expr === 'object' && expr.law) {
    out.add(expr.law);
    Object.values(expr.inputs || {}).forEach((x) => lawsIn(x, out));
  }
  return out;
}
function printAudit(datasets) {
  for (const { def } of datasets) {
    const ph = def.physics;
    console.log(`\n================ ${def.id} (${def.topic}) ================`);
    const rec = loadRegistry().datasets[def.id];
    const last = rec && rec.history.length ? rec.history[rec.history.length - 1] : null;
    console.log(`REVIEW STATUS: ${rec ? rec.status : 'no review recorded (AUTO-VALIDATED if it passes the checks)'}${last ? ` (last: ${last.status} by ${last.by}, ${last.date})` : ''}`);
    if (!ph) { console.log('  NO PHYSICS BLOCK'); continue; }
    console.log(`Scenario: ${ph.scenario}`);
    for (const [title, list] of [['Principles', ph.principles], ['Assumptions', ph.assumptions], ['Derivation', ph.derivation]]) {
      console.log(`${title}:`);
      (list || []).forEach((x, i) => console.log(`  ${i + 1}. ${x}`));
    }
    console.log(`Relationship: ${ph.relationship}`);
    console.log('Parameters:');
    for (const [k, prm] of Object.entries(ph.params || {})) console.log(`  ${k} = ${prm.value} ${prm.unit}  (plausible ${prm.range.join(' to ')} ${prm.unit}; ${prm.note || ''})`);
    const measured = [...Object.entries(def.columns).filter(([, c]) => c.kind === 'measured'), ...Object.entries(def.singles || {})];
    const used = new Set();
    let ideal = null;
    try { ideal = generateRows(def, { ideal: true }); } catch (e) { console.log(`  MODEL ERROR: ${e.message}`); }
    console.log('Measurements:');
    for (const [k, c] of measured) {
      lawsIn(c.model, used);
      const m = c.measurement || {};
      const vals = ideal ? (def.columns[k] ? ideal.rows.map((r) => r[k]) : [ideal.singles[k]]) : [];
      console.log(`  ${k} [${parseUnit(c.unit || '').text || 'no unit'}]: ${m.instrument}; ${m.reading}`);
      console.log(`     scatter: ${m.noise}`);
      for (const eff of c.systematic || []) {
        const params = Object.entries(eff).filter(([key]) => !['type', 'cause', 'justification'].includes(key)).map(([key, val]) => `${key} = ${val}`).join(', ');
        console.log(`     SYSTEMATIC ${eff.type} (${SYSTEMATIC_TYPES[eff.type] ? SYSTEMATIC_TYPES[eff.type].effect : '?'}): ${params}`);
        console.log(`        cause: ${eff.cause}`);
        console.log(`        justification: ${eff.justification}`);
      }
      if (vals.length) console.log(`     noise-free model: ${sigFig(Math.min(...vals), 3)} to ${sigFig(Math.max(...vals), 3)}  (expected ${c.expect.join(' to ')})`);
    }
    console.log('Vetted laws used (each tested for reference values, limiting cases and units):');
    for (const name of used) {
      const law = LAWS[name];
      console.log(`  ${name} (${law.syllabus}): ${law.statement}`);
      console.log(`     limiting cases: ${law.limits.map((l) => l.name).join('; ')}`);
    }
    if (ideal) {
      const d = makeContext(def, ideal.rows, ideal.singles);
      const p = paramValues(def);
      console.log('Analysis on noise-free data (must recover the parameters):');
      for (const [name, res] of Object.entries(def.results || {})) {
        if (res.estimates) console.log(`  ${name} = ${sigFig(d.r[name].value, 5)} ${parseUnit(res.unit || '').text}; model ${res.estimates} = ${p[res.estimates]}`);
      }
    }
  }
  console.log('');
}

async function main() {
  const datasets = await loadDatasets();
  if (process.argv.includes('--audit')) printAudit(datasets);
  const { questions, preview, diags, reports, results, json, previewJson } = buildAll(datasets, loadTopics());
  const errors = diags.filter((x) => x.level === 'error');
  if (process.argv.includes('--report')) {
    for (const { id, d } of reports) {
      console.log(`\n${id}`);
      if (d.fit) console.log('  fit: ' + Object.entries(d.fit).map(([k, v]) => `${k} = ${typeof v === 'number' ? sigFig(v, 4) : v}`).join(', '));
      for (const [k, r] of Object.entries(d.r)) {
        const u = parseUnit(r.unit).text;
        console.log(`  ${k} = ${sigFig(r.value, 4)} ${u}${r.range ? `  (accept ${sigFig(r.range[0], 3)} to ${sigFig(r.range[1], 3)})` : ''}`);
      }
    }
    console.log('');
  }
  for (const x of diags) console.log(formatDiag(x) + '\n');
  printStatus(results);
  if (errors.length) {
    console.log(`✗ ${errors.length} error(s). ${OUTPUT} was NOT changed: fix the datasets above first.`);
    process.exit(1);
  }
  writeOutputs({ questions, preview });
  console.log(`✓ Production (${OUTPUT}): ${questions.length} APPROVED dataset(s). Local preview (${PREVIEW}, never published): ${preview.length} dataset(s).`);
}

// Publishing layout (smaller downloads): the question bank loads only light "cards" (wording, parts,
// answers) for every question; each dataset's tables, graphs and diagrams are in a file of their own
// (questions/1b/<id>.json), loaded only when that question is shown. Each figure is stored once, by
// name, and referred to from the data list and from mark schemes (no duplicated SVG).
export function splitForPublish(questions, dir) {
  const files = {};
  const cards = questions.map((q) => {
    const figures = {};
    const keep = (f) => { if (f && !figures[f.figure]) figures[f.figure] = { svg: f.svg, alt: f.alt, caption: f.caption }; return f.figure; };
    const data = q.data.map((item) => (item.kind === 'figure' ? { kind: 'figure', ref: keep(item) } : item));
    const parts = q.parts.map((pt) => ({ ...pt, ...(pt.figure ? { figure: keep(pt.figure) } : {}), ...(pt.msFigure ? { msFigure: keep(pt.msFigure) } : {}) }));
    files[`${dir}/${q.id}.json`] = JSON.stringify({ id: q.id, figures, data }) + '\n';
    const { data: _d, ...card } = q;
    return { ...card, parts, dataFile: `${dir}/${q.id}.json` };
  });
  return { cards: JSON.stringify(cards, null, 2) + '\n', files };
}
export const DATA_DIR = 'questions/1b';
export const PREVIEW_DIR = 'questions/1b-preview';

export function writeOutputs({ questions, preview }) {
  for (const [list, file, dir] of [[questions, OUTPUT, DATA_DIR], [preview, PREVIEW, PREVIEW_DIR]]) {
    const out = splitForPublish(list, dir);
    fs.writeFileSync(path.join(ROOT, file), out.cards);
    fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true }); // no stale files left behind
    if (Object.keys(out.files).length) fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
    for (const [f, text] of Object.entries(out.files)) fs.writeFileSync(path.join(ROOT, f), text);
  }
}

// The review status of every dataset, so it is always obvious what students can and can't see.
export function printStatus(results) {
  console.log('Dataset   Status             Fingerprint       Last review');
  for (const r of results) {
    const rec = r.state.rec;
    const last = rec && rec.history && rec.history[rec.history.length - 1];
    const flag = r.state.changed ? '  ✗ CHANGED SINCE REVIEW' : '';
    const how = last && last.status === 'APPROVED' && last.basis === 'batch'
      ? ` (batch ${last.batch}; ${last.inspected ? 'inspected individually' : 'not individually inspected'})` : '';
    console.log(`${r.id.padEnd(10)}${r.state.status.padEnd(19)}${(r.fingerprint || '-').slice(0, 16).padEnd(18)}${last ? `${last.status} by ${last.by}, ${last.date}${how}` : '(none: automatic checks only)'}${flag}`);
  }
  console.log('Only APPROVED datasets are published. Change a status with: node tools/1b/review.mjs set <id> <STATUS> --by "<name>"\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
