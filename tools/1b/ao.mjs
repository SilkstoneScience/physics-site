// Assessment objectives (AO1, AO2, AO3) of Paper 1B question parts: a reporting tool, not a classifier.
//
// Each part of a dataset says which AO its marks assess, written by the author and checked by a reviewer:
//   ao: 'AO2'                      all of the part's marks are AO2
//   ao: { AO1: 1, AO2: 1 }         a 2-mark part split between AOs (the numbers must add up to the marks)
// AO1 = demonstrate knowledge; AO2 = understand and apply; AO3 = analyse, evaluate and synthesize
// (2025 guide). The tags are design metadata: they are not shown to students, not published in
// questions/1b.json, and not part of the review fingerprint.
//
// The 2025 guide weights Paper 1 as a whole at about 50 % AO1 + AO2 and 50 % AO3. Our design target
// (docs/PAPER1B_SPECIFICATION.md) is 40–60 % AO3 across a batch of reasonable size: single datasets may
// differ, and are not required to hit the target.
//
//   node tools/1b/ao.mjs                 AO marks by dataset, by batch and for the whole bank
//   node tools/1b/ao.mjs --parts         also every part
//   node tools/1b/ao.mjs --batch pilot   only one batch (a dataset's `batch` field)
import { pathToFileURL } from 'node:url';

export const AOS = ['AO1', 'AO2', 'AO3'];
export const AO3_TARGET = [0.4, 0.6];
export const MIN_BATCH_MARKS = 40; // a batch smaller than this is too small to judge (about two papers)

// { AO1, AO2, AO3 } marks for one part, or throws a message saying what is wrong with the tag.
export function normalizeAO(ao, marks) {
  if (ao === undefined || ao === null) throw new Error('has no AO tag (ao: "AO2", or ao: { AO1: 1, AO2: 1 })');
  const out = { AO1: 0, AO2: 0, AO3: 0 };
  if (typeof ao === 'string') {
    if (!AOS.includes(ao)) throw new Error(`AO tag "${ao}" must be AO1, AO2 or AO3`);
    out[ao] = marks;
    return out;
  }
  if (typeof ao !== 'object') throw new Error('AO tag must be "AO1", "AO2", "AO3" or an object such as { AO2: 1, AO3: 1 }');
  for (const [k, v] of Object.entries(ao)) {
    if (!AOS.includes(k)) throw new Error(`AO tag key "${k}" must be AO1, AO2 or AO3`);
    if (!Number.isInteger(v) || v < 0) throw new Error(`AO tag ${k}: ${v} must be a whole number of marks`);
    out[k] = v;
  }
  const sum = out.AO1 + out.AO2 + out.AO3;
  if (sum !== marks) throw new Error(`AO tag gives ${sum} mark(s), but the part has ${marks}`);
  return out;
}

export function addAO(list) {
  const t = { marks: 0, AO1: 0, AO2: 0, AO3: 0 };
  for (const a of list) { for (const k of AOS) t[k] += a[k]; }
  t.marks = t.AO1 + t.AO2 + t.AO3;
  t.ao3Share = t.marks ? t.AO3 / t.marks : 0;
  return t;
}

// A judgement on a group of datasets: 'ok', 'too few marks to judge', or a warning.
export function judgeBatch(total) {
  if (total.marks < MIN_BATCH_MARKS) return { level: 'info', message: `only ${total.marks} marks: too few to judge the AO balance (needs ${MIN_BATCH_MARKS}+)` };
  const [lo, hi] = AO3_TARGET;
  if (total.ao3Share < lo) return { level: 'warning', message: `AO3 is ${pct(total.ao3Share)} of the marks (target ${pct(lo)}–${pct(hi)}): the batch is too AO1/AO2-heavy` };
  if (total.ao3Share > hi) return { level: 'warning', message: `AO3 is ${pct(total.ao3Share)} of the marks (target ${pct(lo)}–${pct(hi)}): too little straightforward processing` };
  return { level: 'ok', message: `AO3 is ${pct(total.ao3Share)} of the marks (target ${pct(lo)}–${pct(hi)})` };
}

const pct = (x) => `${Math.round(x * 100)} %`;

// AO marks of every part of every dataset, from the generator's part metadata (built.meta).
export function aoTable(datasets) {
  return datasets.map(({ def, meta }) => {
    const parts = meta.map((m) => {
      let ao = null;
      let error = null;
      try { ao = normalizeAO(m.ao, m.marks); } catch (e) { error = e.message; }
      return { label: m.label, marks: m.marks, ao, error };
    });
    return { id: def.id, batch: def.batch || '(no batch)', parts, total: addAO(parts.filter((p) => p.ao).map((p) => p.ao)) };
  });
}

export function aoReport(rows, { showParts = false } = {}) {
  const line = (name, t) => `${name.padEnd(14)}${String(t.marks).padStart(5)}${String(t.AO1).padStart(6)}${String(t.AO2).padStart(6)}${String(t.AO3).padStart(6)}   ${pct(t.ao3Share).padStart(5)}`;
  const head = `${''.padEnd(14)}${'marks'.padStart(5)}${'AO1'.padStart(6)}${'AO2'.padStart(6)}${'AO3'.padStart(6)}   AO3 %`;
  const out = ['AO marks by dataset', head];
  for (const r of rows) {
    out.push(line(r.id, r.total));
    if (showParts) for (const p of r.parts) out.push(p.ao ? line(`  (${p.label})`, addAO([p.ao])) : `  (${p.label})  ✗ ${p.error}`);
    for (const p of r.parts) if (!p.ao && !showParts) out.push(`  (${p.label})  ✗ ${p.error}`);
  }
  const batches = [...new Set(rows.map((r) => r.batch))];
  out.push('', 'By batch', head);
  for (const b of batches) {
    const t = addAO(rows.filter((r) => r.batch === b).map((r) => r.total));
    const j = judgeBatch(t);
    out.push(`${line(b, t)}   ${j.level === 'ok' ? '✓' : j.level === 'warning' ? '⚠' : '·'} ${j.message}`);
  }
  const bank = addAO(rows.map((r) => r.total));
  const jb = judgeBatch(bank);
  out.push('', 'Whole bank', head, `${line('all', bank)}   ${jb.level === 'ok' ? '✓' : jb.level === 'warning' ? '⚠' : '·'} ${jb.message}`);
  return out.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const { loadDatasets } = await import('./build.mjs');
  const { buildQuestion } = await import('./generate.mjs');
  const i = args.indexOf('--batch');
  const only = i >= 0 ? args[i + 1] : null;
  const datasets = (await loadDatasets()).filter(({ def }) => !only || def.batch === only)
    .map(({ def }) => ({ def, meta: buildQuestion(def).meta }));
  console.log(aoReport(aoTable(datasets), { showParts: args.includes('--parts') }));
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) main();
