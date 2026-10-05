// Builds questions/1b.json from the dataset files in tools/1b/datasets/.
//   node tools/1b/build.mjs            generate, validate, and write questions/1b.json if everything passes
//   node tools/1b/build.mjs --report   also print each dataset's key values
// tools/check.mjs runs the same build in memory and fails if questions/1b.json is out of date,
// so the published file always matches the datasets exactly.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildQuestion } from './generate.mjs';
import { validateDataset, formatDiag } from './validate.mjs';
import { sigFig, parseUnit } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '../..');
export const OUTPUT = 'questions/1b.json';

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

// Builds every dataset twice (to prove it's deterministic) and validates it.
// Only datasets with no errors go into the output.
export function buildAll(datasets, topics) {
  const questions = [];
  const diags = [];
  const reports = [];
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
      fail('crash', `couldn't be generated: ${e.message}`);
      continue;
    }
    const found = validateDataset(def, built.question, { topics });
    diags.push(...found);
    if (!found.some((x) => x.level === 'error') && !diags.some((x) => x.dataset === id && x.level === 'error')) questions.push(built.question);
    reports.push({ id, d: built.d });
  }
  return { questions, diags, reports, json: JSON.stringify(questions, null, 2) + '\n' };
}

async function main() {
  const { questions, diags, reports, json } = buildAll(await loadDatasets(), loadTopics());
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
  if (errors.length) {
    console.log(`✗ ${errors.length} error(s). ${OUTPUT} was NOT changed: fix the datasets above first.`);
    process.exit(1);
  }
  fs.writeFileSync(path.join(ROOT, OUTPUT), json);
  console.log(`✓ ${questions.length} dataset(s) passed validation. Wrote ${OUTPUT}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
