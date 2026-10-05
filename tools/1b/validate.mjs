// Paper 1B validator: checks one generated question against its dataset definition.
// It works from what students actually see: it reads the published table and the SVG graphs back,
// recalculates every fit, result and answer from them, and checks them against the physics model,
// the units, the stated uncertainties, the question's claims and the mark scheme.
// A dataset with any error is not written to questions/1b.json (see build.mjs).
import {
  parseNum, dpOf, sigFigsIn, onGrid, roundTo, fmtNum, sigFig, parseUnit, sameDim, addDim,
  linearFit, stripTags, cross, decimalsOf,
} from './lib.mjs';
import { generateRows, makeContext, uncertaintyOf, columnDp, paramValues, modelValue, evalModel } from './generate.mjs';
import { LAWS } from './laws.mjs';
import { createRequire } from 'node:module';

const { checkNumeric } = createRequire(import.meta.url)('../../js/numeric.js');

const CONTEXTS = ['experimental', 'observational', 'unfamiliar'];
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-300);

export function validateDataset(def, q, { topics } = {}) {
  const diags = [];
  const fail = (code, where, message, extra = {}) => diags.push({ level: 'error', code, dataset: def.id, where, message, ...extra });
  const warn = (code, where, message, extra = {}) => diags.push({ level: 'warning', code, dataset: def.id, where, message, ...extra });
  try {
    run(def, q, topics, fail, warn);
  } catch (e) {
    fail('crash', 'dataset', `the validator stopped: ${e.message}`);
  }
  return diags;
}

function run(def, q, topics, fail, warn) {
  // ---------- 1. Identity and level ----------
  if (!/^[A-E]\d-B\d{2}$/.test(def.id)) fail('meta', 'id', `id "${def.id}" should look like D3-B01 (topic, then B and a number)`);
  if (def.id.slice(0, 2) !== String(def.topic).replace('.', '')) fail('meta', 'id', `id ${def.id} doesn't start with its topic ${def.topic}`);
  if (q.id !== def.id) fail('meta', 'id', `the question's id ${q.id} doesn't match the dataset ${def.id}`);
  if (q.paper !== '1B' || q.level !== 'SL_HL') fail('meta', 'level', 'Paper 1B questions must have paper "1B" and level "SL_HL"');
  const topic = topics && topics.get(def.topic);
  if (topics && !topic) fail('meta', 'topic', `unknown topic ${def.topic}`);
  if (topic && topic.hl) fail('level-topic', 'topic', `${def.topic} is HL only, but Paper 1B is common to SL and HL, so it can only use SL material`);
  if (![1, 2, 3].includes(def.difficulty)) fail('meta', 'difficulty', 'difficulty must be 1, 2 or 3');
  if (!Array.isArray(def.skills) || !def.skills.length) fail('meta', 'skills', 'list the data skills the dataset practises');
  if (!CONTEXTS.includes(def.context)) fail('meta', 'context', `context must be one of ${CONTEXTS.join(', ')}`);
  const marks = (q.parts || []).reduce((s, pt) => s + (pt.marks || 0), 0);
  if (marks < 4 || marks > 12) warn('meta', 'marks', `${marks} marks in total; IB Paper 1B questions are usually 6–10`);

  // ---------- 1b. The physics model (stops here if it is unusable) ----------
  if (!checkPhysics(def, fail)) return;

  // ---------- 2. The table, read back cell by cell ----------
  const p = paramValues(def);
  const gen = generateRows(def);
  const table = (q.data || []).find((x) => x.kind === 'table');
  if (!table) { fail('table-header', 'table', 'no data table'); return; }
  const heads = [...table.html.matchAll(/<th scope="col" data-col="(\w+)"( data-unc="1")?>(.*?)<\/th>/g)]
    .map((m) => ({ col: m[1], unc: !!m[2], html: m[3] }));
  const cells = new Map();
  for (const m of table.html.matchAll(/<td data-col="(\w+)" data-row="(\d+)"( data-unc="1")?( class="blank")?>(.*?)<\/td>/g)) {
    cells.set(`${m[1]}|${m[2]}|${m[3] ? 'u' : ''}`, { text: m[5], blank: !!m[4] });
  }
  const cols = Object.entries(def.columns);
  for (const h of heads) if (!def.columns[h.col]) fail('table-header', `table column ${h.col}`, 'column not in the dataset definition');
  const unitOf = (c) => { try { return parseUnit(c.unit || ''); } catch (e) { fail('unit', 'units', e.message); return parseUnit(''); } };

  for (const [k, c] of cols) {
    if (c.show === false) continue;
    const where = `table column ${c.symbolText || c.symbol}`;
    const h = heads.find((x) => x.col === k && !x.unc);
    if (!h) { fail('table-header', where, 'missing from the table'); continue; }
    const u = unitOf(c);
    const label = `$${c.symbol}$${u.text ? ' / ' + u.text : ''}`;
    if (!h.html.includes(label)) fail('table-header', where, `the heading should show "${label}"`, { got: stripTags(h.html) });
    const pm = h.html.match(/± ([−\d.]+)$/);
    if (typeof c.uncertainty === 'number') {
      if (!pm) fail('table-header', where, 'the heading should give the uncertainty (± …)');
      else {
        if (parseNum(pm[1]) !== c.uncertainty) fail('uncertainty', where, 'the uncertainty in the heading is wrong', { expected: c.uncertainty, got: pm[1] });
        if (dpOf(pm[1]) !== columnDp(c)) fail('table-dp', where, `the uncertainty ±${pm[1]} and the values have different numbers of decimal places`);
        if (sigFigsIn(pm[1]) > 2) fail('uncertainty', where, `uncertainty ±${pm[1]} has more than 2 significant figures`);
      }
      if (c.resolution && c.uncertainty < c.resolution / 2 - 1e-12) {
        fail('uncertainty', where, `uncertainty ±${c.uncertainty} is smaller than half the instrument's resolution (${c.resolution})`);
      }
    } else if (pm) fail('table-header', where, 'the heading gives an uncertainty, but the dataset defines none');
  }

  const setCol = cols.find(([, c]) => c.kind === 'set');
  const n = setCol[1].values.length;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const row = {};
    for (const [k, c] of cols) {
      const where = `table row ${i + 1}, ${c.symbolText || c.symbol}`;
      if (c.show === false) { row[k] = gen.rows[i][k]; continue; }
      const cell = cells.get(`${k}|${i}|`);
      const hidden = (c.hide || []).includes(i);
      if (!cell) { fail('table-value', where, 'cell missing'); row[k] = gen.rows[i][k]; continue; }
      if (cell.blank || hidden) {
        if (!hidden) fail('table-value', where, 'cell is blank but not listed in "hide"');
        if (!cell.blank) fail('table-value', where, 'cell should be blank (listed in "hide")');
        if (c.kind !== 'derived') fail('table-value', where, 'only calculated (derived) columns can be left for students to fill in');
        row[k] = c.kind === 'derived' ? roundTo(c.value(row, p, gen.singles), 10 ** -c.dp) : gen.rows[i][k];
        continue;
      }
      const v = parseNum(cell.text);
      if (Number.isNaN(v)) { fail('table-value', where, `"${cell.text}" isn't a number`); row[k] = gen.rows[i][k]; continue; }
      const dp = columnDp(c);
      if (dpOf(cell.text) !== dp) fail('table-dp', where, `"${cell.text}" has ${dpOf(cell.text)} decimal places, but the column uses ${dp}`);
      if (c.kind === 'set' && Math.abs(v - c.values[i]) > c.resolution / 2 + 1e-12) {
        fail('table-value', where, 'value differs from the planned value', { expected: c.values[i], got: cell.text });
      }
      if (c.kind === 'measured') {
        if (!onGrid(v, c.resolution)) fail('table-dp', where, `"${cell.text}" isn't a reading the instrument can show (resolution ${c.resolution})`);
        const model = modelValue(def, c, { params: p, row, singles: gen.singles }, `column ${k}`);
        const noise = c.noise || {};
        const tol = noise.type === 'gauss' ? 5 * noise.sd + c.resolution : noise.type === 'poisson' ? 5 * Math.sqrt(model) + 1 : c.resolution;
        const isAnomaly = c.anomaly && c.anomaly.row === i;
        if (!isAnomaly && Math.abs(v - model) > tol) {
          fail('model', where, 'value is too far from the physics model to be measurement scatter (typing error, or wrong model?)',
            { expected: fmtNum(model, dp + 1), got: cell.text });
        }
      }
      if (c.kind === 'derived') {
        const want = fmtNum(roundTo(c.value(row, p, gen.singles), 10 ** -c.dp), c.dp);
        if (want !== cell.text) fail('derived', where, 'calculated value doesn\'t match the values it is calculated from', { expected: want, got: cell.text });
      }
      row[k] = v;
    }
    // Uncertainty columns (one value per row)
    for (const [k, c] of cols) {
      if (typeof c.uncertainty !== 'function' || c.show === false) continue;
      const where = `table row ${i + 1}, Δ${c.symbolText || c.symbol}`;
      const cell = cells.get(`${k}|${i}|u`);
      if (!cell) { fail('uncertainty', where, 'uncertainty cell missing'); continue; }
      if (cell.blank) continue;
      const want = fmtNum(uncertaintyOf(c, row, p, gen.singles), columnDp(c));
      if (cell.text !== want) fail('uncertainty', where, 'uncertainty doesn\'t follow the dataset\'s rule', { expected: want, got: cell.text });
      if (!(parseNum(cell.text) > 0)) fail('uncertainty', where, 'uncertainty must be greater than zero (at this number of decimal places)');
      else if (sigFigsIn(cell.text) > 2) fail('uncertainty', where, `uncertainty ${cell.text} has more than 2 significant figures`);
    }
    rows.push(row);
  }
  for (const [k, s] of Object.entries(def.singles || {})) {
    const text = fmtNum(gen.singles[k], decimalsOf(s.resolution));
    if (!stripTags(q.stem).includes(text)) fail('stem-value', `single reading ${k}`, `the question text should give the reading ${text}`);
  }

  // ---------- 3. Recalculate everything from the published table ----------
  const d = makeContext(def, rows, gen.singles);
  const g = def.graph;
  const [cx, cy] = g ? [def.columns[g.x], def.columns[g.y]] : [];
  const dimX = g ? unitOf(cx).dim : null;
  const dimY = g ? unitOf(cy).dim : null;
  let own = null; // the validator's own fit, done independently of the dataset's results
  if (g && g.fit === 'linear') own = linearFit(d.fitRows.map((i) => rows[i][g.x]), d.fitRows.map((i) => rows[i][g.y]));
  if (g && g.fit === 'exponential') {
    const ok = d.fitRows.filter((i) => rows[i][g.y] > 0);
    const lf = linearFit(ok.map((i) => rows[i][g.x]), ok.map((i) => Math.log(rows[i][g.y])));
    own = { k: -lf.m, A: Math.exp(lf.c), halfLife: Math.LN2 / -lf.m, r2: lf.r2 };
  }
  if (g && g.fit === 'linear') {
    if (g.band && !d.band) fail('fit', 'graph', 'no straight line passes through every error bar: reduce the noise, increase the uncertainty, or mark the odd point as an anomaly');
    if (own.r2 > 0.999999) warn('realism', 'graph', 'the points lie almost exactly on a line, so the data look invented: add realistic scatter');
  }

  for (const [name, res] of Object.entries(def.results || {})) {
    const where = `result ${name}`;
    const r = d.r[name];
    let u;
    try { u = parseUnit(res.unit || ''); } catch (e) { fail('unit', where, e.message); continue; }
    if (res.dims && g) {
      let want = { 'y/x': addDim(dimY, dimX, -1), y: dimY, x: dimX }[res.dims.of];
      if (!want) { fail('unit-dims', where, `unknown dims.of "${res.dims.of}"`); continue; }
      if (res.dims.times) want = addDim(want, parseUnit(res.dims.times).dim);
      if (!sameDim(want, u.dim)) fail('unit-dims', where, `unit "${u.text}" has the wrong dimensions for ${res.dims.of}${res.dims.times ? ' × ' + res.dims.times : ''}`);
    }
    if (!Number.isFinite(r.value)) { fail('fit', where, 'value is not a finite number'); continue; }
    const show = (v) => `${sigFig(v, 4)} ${u.text}`.trim();
    if (res.check && own) {
      const target = { gradient: own.m, minusGradient: -own.m, intercept: own.c, halfLife: own.halfLife }[res.check];
      const yRange = g ? Math.max(...rows.map((rw) => rw[g.y])) - Math.min(...rows.map((rw) => rw[g.y])) : 1;
      const bad = res.check === 'intercept' ? Math.abs(r.value - target) > 1e-6 * yRange : rel(r.value, target) > 1e-6;
      if (target === undefined) fail('fit', where, `unknown check "${res.check}"`);
      else if (bad) fail('fit', where, `${res.check} doesn't match the line fitted to the table`, { expected: show(target), got: show(r.value) });
    }
    if (r.range && !(r.range[0] <= r.value && r.value <= r.range[1])) {
      fail('answer-range', where, 'the accepted range doesn\'t contain the value', { expected: show(r.value), got: `${show(r.range[0])} to ${show(r.range[1])}` });
    }
  }

  // ---------- 4. Claims made by the questions must be true for these data ----------
  for (const cl of def.claims || []) {
    const where = `claim ${cl.type}${cl.result ? ' ' + cl.result : ''}`;
    if (cl.type === 'linear') {
      if (!own || g.fit !== 'linear') fail('claim', where, 'needs a linear graph');
      else if (own.r2 < cl.minR2) fail('claim', where, `the question treats the data as linear, but r² = ${own.r2.toFixed(4)} (below ${cl.minR2})`);
    } else if (cl.type === 'throughOrigin') {
      const through = !!d.band && d.band.cMin <= 0 && d.band.cMax >= 0;
      if (!d.band) fail('claim', where, 'needs the max/min lines (graph.band: true) to judge the intercept');
      else if (through !== cl.expect) {
        fail('claim', where, cl.expect ? 'the question says the line passes through the origin, but no line through all the error bars does'
          : 'the question says the line misses the origin, but a line through all the error bars can pass through it',
        { expected: 'intercept range ' + (cl.expect ? 'including 0' : 'excluding 0'), got: `${sigFig(d.band.cMin, 3)} to ${sigFig(d.band.cMax, 3)}` });
      }
    } else if (cl.type === 'agrees') {
      const r = d.r[cl.result];
      if (!r || !r.range) { fail('claim', where, 'needs a result with an accepted range'); continue; }
      const ok = r.range[0] <= cl.value && cl.value <= r.range[1];
      if (ok !== cl.expect) {
        fail('claim', where, cl.expect ? `the question expects agreement with ${cl.value}, but the data's range excludes it`
          : `the question expects disagreement with ${cl.value}, but the data's range includes it`,
        { expected: cl.value, got: `${sigFig(r.range[0], 3)} to ${sigFig(r.range[1], 3)}` });
      }
    } else if (cl.type === 'anomaly') {
      if (!own || g.fit !== 'linear') { fail('claim-anomaly', where, 'anomaly checks need a linear graph'); continue; }
      if (!(g.exclude || []).includes(cl.row)) fail('claim-anomaly', where, `row ${cl.row + 1} should be listed in graph.exclude so the fit leaves it out`);
      const resid = (i) => rows[i][g.y] - (own.m * rows[i][g.x] + own.c);
      const others = d.fitRows.map(resid);
      const spread = Math.max(Math.sqrt(others.reduce((s, x) => s + x * x, 0) / others.length), d.unc(g.y, cl.row) || 0);
      const size = Math.abs(resid(cl.row)) / spread;
      if (size < 4) fail('claim-anomaly', where, `row ${cl.row + 1} is only ${size.toFixed(1)}× the normal scatter from the line, so students can't reliably spot it (needs 4×)`);
      d.fitRows.forEach((i) => {
        if (Math.abs(resid(i)) / spread > 2.5) fail('claim-anomaly', where, `row ${i + 1} also looks anomalous, so the question's "one anomaly" is ambiguous`);
      });
    } else if (cl.type === 'trend') {
      const slope = g.fit === 'exponential' ? -own.k : own.m;
      if ((cl.direction === 'increasing') !== (slope > 0)) fail('claim', where, `the data aren't ${cl.direction}`);
    } else fail('claim', where, `unknown claim type "${cl.type}"`);
  }

  // ---------- 5. Answers must come from the data ----------
  for (const pt of q.parts || []) {
    const where = `part (${pt.label})`;
    const nm = pt.numeric;
    if (!nm) continue;
    if (!nm.source) { fail('answer-source', where, 'typed answer isn\'t linked to a calculated result (use d.num("name"))', { got: nm.answer }); continue; }
    const r = d.r[nm.source];
    if (!r) { fail('answer-source', where, `no result called "${nm.source}"`); continue; }
    const u = parseUnit(r.unit);
    const show = (v) => `${sigFig(v, 4)} ${u.text}`.trim();
    if (rel(nm.answer, r.value) > 1e-9) fail('answer', where, `answer doesn't match ${nm.source} recalculated from the table`, { expected: show(r.value), got: show(nm.answer) });
    if (r.range) {
      if (!nm.range || rel(nm.range[0], r.range[0]) > 1e-9 || rel(nm.range[1], r.range[1]) > 1e-9) {
        fail('answer-range', where, 'accepted range doesn\'t match the range from the data', { expected: `${show(r.range[0])} to ${show(r.range[1])}`, got: nm.range ? `${show(nm.range[0])} to ${show(nm.range[1])}` : 'none' });
      }
    }
    if ((nm.unit || '') !== u.tex) fail('answer-unit', where, 'answer unit doesn\'t match the result\'s unit', { expected: u.tex, got: nm.unit || '(none)' });
    // The site's own marker must accept the answer and reject every listed mistake.
    if (checkNumeric(nm, String(nm.answer)).status !== 'right') fail('answer-range', where, 'the marker doesn\'t accept the answer itself');
    for (const m of nm.mistakes || []) {
      if (checkNumeric(nm, String(m.value)).status === 'right') {
        fail('answer-mistake', where, 'a listed wrong answer would be marked correct: the question can\'t tell the mistake from the right method', { expected: `wrong: ${sigFig(m.value, 3)}`, got: `accepted (answer ${sigFig(r.value, 3)})` });
      }
    }
    const ms = stripTags((pt.markscheme || []).join(' '));
    if (![2, 3].some((k) => ms.includes(sigFig(r.value, k)))) {
      fail('markscheme-value', where, 'the mark scheme doesn\'t state the answer', { expected: `${sigFig(r.value, 2)} or ${sigFig(r.value, 3)}` });
    }
  }

  // ---------- 6. Graphs must show exactly the data ----------
  const figures = [...(q.data || []).filter((x) => x.kind === 'figure'), ...(q.parts || []).filter((pt) => pt.msFigure).map((pt) => pt.msFigure)];
  if (g) {
    const student = figures.find((f) => f.figure === 'graph');
    if (!student) fail('graph-point', 'graph', 'the dataset has a graph, but the question doesn\'t show it');
    for (const fig of figures.filter((f) => /data-graph=/.test(f.svg))) checkGraph(fig, def, d, rows, fail);
  }

  // ---------- 7. Diagrams and all SVG ----------
  for (const fig of figures) checkSvg(fig, def, fail);
  if (def.circuit) checkCircuit(def, figures.find((f) => f.figure === (def.circuit.figure || 'diagram')), fail);
}

// ---------- The physics model ----------
// The model must be stated explicitly (scenario, principles, assumptions, derivation, relationship),
// built only from vetted laws with units checked at every step, use plausible parameter values,
// give the expected magnitudes, and each result that estimates a parameter must recover that
// parameter exactly from noise-free data (so the analysis really is the inverse of the physics).
const isText = (s) => typeof s === 'string' && s.trim().length > 0;
const isList = (a) => Array.isArray(a) && a.length > 0 && a.every(isText);

function checkPhysics(def, fail) {
  const ph = def.physics;
  let ok = true;
  const bad = (code, where, message, extra) => { ok = false; fail(code, where, message, extra); };
  if (!ph) { bad('physics-meta', 'physics', 'the dataset needs a "physics" block (see tools/1b/README.md)'); return false; }
  if (!isText(ph.scenario)) bad('physics-meta', 'physics.scenario', 'describe the physical situation');
  for (const k of ['principles', 'assumptions', 'derivation']) if (!isList(ph[k])) bad('physics-meta', `physics.${k}`, `list the ${k} (at least one, as text)`);
  if (!isText(ph.relationship)) bad('physics-meta', 'physics.relationship', 'state the relationship the data should follow');
  for (const [k, prm] of Object.entries(ph.params || {})) {
    const where = `physics.params.${k}`;
    if (!prm || !Number.isFinite(prm.value)) { bad('physics-meta', where, 'needs a numerical value'); continue; }
    try { parseUnit(prm.unit || ''); } catch (e) { bad('physics-units', where, e.message); }
    if (!Array.isArray(prm.range) || prm.range.length !== 2) bad('physics-meta', where, 'needs a plausible range [min, max] for a real experiment');
    else if (prm.value < prm.range[0] || prm.value > prm.range[1]) fail('physics-range', where, `value ${prm.value} ${prm.unit} is outside the plausible range`, { expected: `${prm.range[0]} to ${prm.range[1]} ${prm.unit}`, got: prm.value });
  }
  const measured = [
    ...Object.entries(def.columns).filter(([, c]) => c.kind === 'measured').map(([k, c]) => [`column ${k}`, c]),
    ...Object.entries(def.singles || {}).map(([k, s]) => [`single ${k}`, s]),
  ];
  for (const [where, c] of measured) {
    const m = c.measurement || {};
    if (!isText(m.instrument) || !isText(m.reading) || !isText(m.noise)) {
      bad('physics-meta', `${where}.measurement`, 'say which instrument is used, how the reading is formed, and what physically causes its scatter (instrument, reading, noise)');
    }
    if (c.noise && c.noise.type && !isText(m.noise)) bad('physics-meta', `${where}.measurement.noise`, 'random scatter must have a stated physical cause');
    if (!Array.isArray(c.expect) || c.expect.length !== 2) bad('physics-meta', `${where}.expect`, 'give the expected range of values [min, max] (expected magnitude), in the column\'s unit');
    if (!c.model || !c.model.law) bad('physics-meta', `${where}.model`, 'the model must be built from a vetted law in laws.mjs ({ law, inputs })');
  }
  if (!ok) return false;

  // Evaluate the model on noise-free data: units, magnitude, and the analysis recovering the parameters.
  // (Only an unusable model stops validation; a wrong magnitude, range or inversion is reported and the other checks still run.)
  let ideal;
  try {
    ideal = generateRows(def, { ideal: true });
  } catch (e) {
    fail(e.code || 'physics-units', 'physics model', e.message);
    return false;
  }
  for (const [where, c] of measured) {
    const key = where.split(' ')[1];
    const vals = where.startsWith('single') ? [ideal.singles[key]] : ideal.rows.map((r) => r[key]);
    const [lo, hi] = c.expect;
    const out = vals.filter((v) => v < lo || v > hi);
    if (out.length) fail('physics-magnitude', where, 'the model gives values outside the expected magnitude: check the parameters and units', { expected: `${lo} to ${hi} ${c.unit || ''}`.trim(), got: out.map((v) => sigFig(v, 3)).join(', ') });
  }
  try {
    const d = makeContext(def, ideal.rows, ideal.singles);
    const p = paramValues(def);
    for (const [name, res] of Object.entries(def.results || {})) {
      if (!res.estimates) continue;
      const truth = p[res.estimates];
      const tol = res.tolerance || 0.005;
      if (truth === undefined) { bad('physics-meta', `result ${name}`, `estimates "${res.estimates}", which isn't a parameter`); continue; }
      if (Math.abs(d.r[name].value - truth) > tol * Math.abs(truth)) {
        fail('physics-inversion', `result ${name}`, `with noise-free data, the analysis should recover ${res.estimates} exactly, so the analysis formula isn't the inverse of the physics model`,
          { expected: `${sigFig(truth, 4)} ${parseUnit(def.physics.params[res.estimates].unit).text}`.trim(), got: `${sigFig(d.r[name].value, 4)} ${parseUnit(res.unit || '').text}`.trim() });
      }
    }
  } catch (e) {
    fail('physics-inversion', 'results', `the analysis couldn't be run on noise-free data: ${e.message}`);
  }
  return ok;
}

// ---------- Graph reading ----------
export function parseGraph(svg) {
  const ticks = (cls, attr) => [...svg.matchAll(new RegExp(`<text class="${cls}"[^>]*? ${attr}="([-\\d.]+)"[^>]*>([^<]+)</text>`, 'g'))]
    .map((m) => ({ px: Number(m[1]), v: parseNum(m[2]) }));
  const axis = svg.match(/<path class="axis" d="M([-\d.]+) ([-\d.]+)V([-\d.]+)H([-\d.]+)"/);
  const title = (cls) => stripTags((svg.match(new RegExp(`<text class="${cls}"[^>]*>(.*?)</text>`)) || [])[1] || '');
  return {
    xTicks: ticks('tx', 'x'), yTicks: ticks('ty', 'y'),
    box: axis ? { l: +axis[1], t: +axis[2], b: +axis[3], r: +axis[4] } : null,
    points: [...svg.matchAll(/<circle class="f1 pt" cx="([-\d.]+)" cy="([-\d.]+)" r="[\d.]+" data-row="(\d+)"\/>/g)]
      .map((m) => ({ px: +m[1], py: +m[2], row: +m[3] })),
    ebars: [...svg.matchAll(/<path class="ebar" data-row="(\d+)" data-axis="(x|y)" d="M([-\d.]+) ([-\d.]+)[VH]([-\d.]+)/g)]
      .map((m) => ({ row: +m[1], axis: m[2], a: +m[3], b: +m[4], end: +m[5] })),
    fits: [...svg.matchAll(/<line class="[^"]*\bfit" data-fit="(\w+)" x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"\/>/g)]
      .map((m) => ({ fit: m[1], x1: +m[2], y1: +m[3], x2: +m[4], y2: +m[5] })),
    curve: ((svg.match(/data-fit="curve" points="([^"]*)"/) || [])[1] || '').split(' ').filter(Boolean).map((s) => s.split(',').map(Number)),
    xTitle: title('ax-x'), yTitle: title('ax-y'),
  };
}
// Turns tick labels into a pixel ↔ value scale, and checks the ticks are evenly spaced.
export function scaleFromTicks(ticks) {
  if (ticks.length < 2 || ticks.some((t) => Number.isNaN(t.v))) return null;
  const f = linearFit(ticks.map((t) => t.v), ticks.map((t) => t.px));
  const even = ticks.every((t, i) => Math.abs(f.m * t.v + f.c - t.px) < 0.2
    && (i < 2 || Math.abs((t.v - ticks[i - 1].v) - (ticks[1].v - ticks[0].v)) < 1e-9 * Math.max(1, Math.abs(t.v))));
  return { toValue: (px) => (px - f.c) / f.m, perPx: Math.abs(1 / f.m), even };
}

function checkGraph(fig, def, d, rows, fail) {
  const g = def.graph;
  const kind = fig.figure === 'graph' ? 'student' : 'examiner';
  const where = kind === 'student' ? 'graph' : 'mark-scheme graph';
  const G = parseGraph(fig.svg);
  const [cx, cy] = [def.columns[g.x], def.columns[g.y]];
  const titleOf = (c) => `${c.symbolText || c.symbol}${parseUnit(c.unit || '').text ? ' / ' + parseUnit(c.unit || '').text : ''}`;
  if (G.xTitle !== titleOf(cx)) fail('graph-axis', where, 'x-axis label is wrong', { expected: titleOf(cx), got: G.xTitle });
  if (G.yTitle !== titleOf(cy)) fail('graph-axis', where, 'y-axis label is wrong', { expected: titleOf(cy), got: G.yTitle });
  const X = scaleFromTicks(G.xTicks);
  const Y = scaleFromTicks(G.yTicks);
  if (!X || !Y || !G.box) { fail('graph-scale', where, 'axes or tick labels missing'); return; }
  if (!X.even || !Y.even) fail('graph-scale', where, 'tick labels are not evenly spaced');
  const inBox = (px, py) => px >= G.box.l - 0.5 && px <= G.box.r + 0.5 && py >= G.box.t - 0.5 && py <= G.box.b + 0.5;

  const want = rows.map((_, i) => i).filter((i) => kind === 'examiner' || !(g.omit || []).includes(i));
  const got = G.points.map((pt) => pt.row);
  for (const i of want) if (!got.includes(i)) fail('graph-point', where, `the point for table row ${i + 1} is missing`);
  for (const i of got) if (!want.includes(i)) fail('graph-point', where, `the graph shows table row ${i + 1}, which should be left for students to plot`);
  const fmt = (v, c) => `${sigFig(v, 4)} ${parseUnit(c.unit || '').text}`.trim();
  for (const pt of G.points) {
    const row = rows[pt.row];
    if (!row) continue;
    const [vx, vy] = [X.toValue(pt.px), Y.toValue(pt.py)];
    if (Math.abs(vx - row[g.x]) > 0.6 * X.perPx || Math.abs(vy - row[g.y]) > 0.6 * Y.perPx) {
      fail('graph-point', `${where}, point for row ${pt.row + 1}`, 'point is not where the table says',
        { expected: `(${fmt(row[g.x], cx)}, ${fmt(row[g.y], cy)})`, got: `(${fmt(vx, cx)}, ${fmt(vy, cy)})` });
    }
    if (!inBox(pt.px, pt.py)) fail('graph-scale', `${where}, point for row ${pt.row + 1}`, 'point is outside the axes');
  }
  // Error bars: one per point where there is an uncertainty, each the right length.
  for (const i of want) {
    for (const axis of ['y', 'x']) {
      const u = axis === 'y' ? d.unc(g.y, i) || 0 : (g.xErrorBars && d.unc(g.x, i)) || 0;
      const bar = G.ebars.find((e) => e.row === i && e.axis === axis);
      if (!u && bar) fail('graph-errorbar', `${where}, row ${i + 1}`, `${axis} error bar drawn, but there is no uncertainty`);
      if (u && !bar) fail('graph-errorbar', `${where}, row ${i + 1}`, `${axis} error bar missing`);
      if (u && bar) {
        const [lo, hi] = axis === 'y' ? [Y.toValue(bar.end), Y.toValue(bar.b)] : [X.toValue(bar.a), X.toValue(bar.end)];
        const tol = 0.6 * (axis === 'y' ? Y.perPx : X.perPx);
        const v = rows[i][axis === 'y' ? g.y : g.x];
        if (Math.abs(lo - (v - u)) > tol || Math.abs(hi - (v + u)) > tol) {
          fail('graph-errorbar', `${where}, row ${i + 1}`, `${axis} error bar has the wrong length`, { expected: `±${sigFig(u, 2)}`, got: `${sigFig(v - lo, 2)} below, ${sigFig(hi - v, 2)} above` });
        }
        if (axis === 'y' && !(inBox(bar.a, bar.b) && inBox(bar.a, bar.end))) fail('graph-scale', `${where}, row ${i + 1}`, 'error bar runs outside the axes');
      }
    }
  }
  // Fit lines appear only on the mark-scheme graph, and must be the fitted lines.
  if (kind === 'student' && (G.fits.length || G.curve.length)) fail('graph-fit', where, 'the students\' graph shouldn\'t show a fitted line');
  if (kind === 'examiner' && g.fit === 'linear') {
    const lines = { best: d.fit, max: d.band && d.band.steep, min: d.band && d.band.shallow };
    for (const [name, line] of Object.entries(lines)) {
      if (!line) continue;
      const drawn = G.fits.find((f) => f.fit === name);
      if (!drawn) { fail('graph-fit', where, `the ${name} line is missing`); continue; }
      for (const [px, py] of [[drawn.x1, drawn.y1], [drawn.x2, drawn.y2]]) {
        const xv = X.toValue(px);
        if (Math.abs(Y.toValue(py) - (line.m * xv + line.c)) > 1.0 * Y.perPx) {
          fail('graph-fit', where, `the ${name} line isn't the fitted line`, { expected: `gradient ${sigFig(line.m, 4)}, intercept ${sigFig(line.c, 4)}` });
          break;
        }
      }
    }
  }
  if (kind === 'examiner' && g.fit === 'exponential') {
    if (!G.curve.length) fail('graph-fit', where, 'the curve of best fit is missing');
    for (const [px, py] of G.curve) {
      if (Math.abs(Y.toValue(py) - d.fit.A * Math.exp(-d.fit.k * X.toValue(px))) > 1.0 * Y.perPx) { fail('graph-fit', where, 'the curve isn\'t the fitted curve'); break; }
    }
  }
}

// ---------- SVG: accessibility, colours, labels and vector directions ----------
function checkSvg(fig, def, fail) {
  const where = `figure ${fig.figure}`;
  if (!fig.alt || !fig.svg.includes('aria-label=')) fail('alt', where, 'needs a text description (alt) for screen readers');
  if (/\s(fill|stroke)="(?!none")[^"]*"/.test(fig.svg) || /\sstyle="/.test(fig.svg)) {
    fail('svg-colour', where, 'colours are written into the SVG: use the site\'s classes so dark mode works');
  }
  const [x0, y0, W, H] = (fig.svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/) || []).slice(1).map(Number);
  for (const m of fig.svg.matchAll(/<text (?![^>]*transform)[^>]*?x="([-\d.]+)" y="([-\d.]+)"[^>]*?text-anchor="(\w+)"[^>]*>(.*?)<\/text>/g)) {
    const [x, y, anchor] = [+m[1], +m[2], m[3]];
    const w = 0.58 * 19 * stripTags(m[4]).length; // phones show diagram text at 19 units
    const [lo, hi] = anchor === 'start' ? [x, x + w] : anchor === 'end' ? [x - w, x] : [x - w / 2, x + w / 2];
    if (lo < x0 - 1 || hi > x0 + W + 1 || y < y0 + 12 || y > y0 + H + 1) fail('svg-text', where, `label "${stripTags(m[4])}" runs outside the picture on phones`);
  }
  if (!def.vectors) return;
  const expected = (name) => {
    const v = def.vectors[name];
    if (!v) return null;
    if (v[0] === 'cross') { const [a, b] = [expected(v[1]), expected(v[2])]; return a && b ? cross(a, b) : null; }
    return v;
  };
  const describe = (x, y) => `${Math.round((Math.atan2(y, x) * 180) / Math.PI)}° from the +x direction`;
  for (const m of fig.svg.matchAll(/<g class="vec" data-vec="(\w+)"><line [^>]*?x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/g)) {
    const v = expected(m[1]);
    const [dx, dy] = [+m[4] - +m[2], -(+m[5] - +m[3])]; // SVG y points down; physics y points up
    if (!v) { fail('vector', `${where}, arrow ${m[1]}`, 'the dataset doesn\'t define this vector'); continue; }
    if (Math.hypot(v[0], v[1]) < 1e-9) { fail('vector', `${where}, arrow ${m[1]}`, 'this vector points into or out of the page: draw a dot or a cross, not an arrow'); continue; }
    const cos = (v[0] * dx + v[1] * dy) / (Math.hypot(v[0], v[1]) * Math.hypot(dx, dy));
    if (cos < Math.cos((2 * Math.PI) / 180)) fail('vector', `${where}, arrow ${m[1]}`, 'arrow points the wrong way', { expected: describe(v[0], v[1]), got: describe(dx, dy) });
  }
  for (const m of fig.svg.matchAll(/<g class="vec-z" data-vec="(\w+)">(.*?)<\/g>/g)) {
    const v = expected(m[1]);
    if (!v) { fail('vector', `${where}, ${m[1]}`, 'the dataset doesn\'t define this vector'); continue; }
    const out = m[2].includes('<circle class="f3"');
    if (Math.hypot(v[0], v[1]) > 1e-9 || v[2] === 0) fail('vector', `${where}, ${m[1]}`, 'drawn into/out of the page, but the vector lies in the page');
    else if (out !== v[2] > 0) fail('vector', `${where}, ${m[1]}`, 'wrong way through the page', { expected: v[2] > 0 ? 'out of the page (dot)' : 'into the page (cross)', got: out ? 'dot' : 'cross' });
  }
}

// ---------- Circuits: the netlist must make sense, and the drawing must match it ----------
function checkCircuit(def, fig, fail) {
  const comps = Object.entries(def.circuit.components);
  const where = 'circuit';
  const linked = (edges, a, b) => {
    const seen = new Set([a]);
    const todo = [a];
    while (todo.length) {
      const nd = todo.pop();
      for (const [x, y] of edges) {
        for (const [from, to] of [[x, y], [y, x]]) if (from === nd && !seen.has(to)) { seen.add(to); todo.push(to); }
      }
    }
    return seen.has(b);
  };
  const count = {};
  for (const [id, c] of comps) {
    if (!Array.isArray(c.nodes) || c.nodes.length !== 2 || c.nodes[0] === c.nodes[1]) fail('circuit', `${where}: ${id}`, 'needs two different connection points (nodes)');
    else c.nodes.forEach((nd) => { count[nd] = (count[nd] || 0) + 1; });
  }
  for (const [nd, k] of Object.entries(count)) if (k < 2) fail('circuit', `${where}: node ${nd}`, 'only one component connects here: a loose wire');
  const main = comps.filter(([, c]) => c.type !== 'voltmeter');
  for (const [id, c] of comps) {
    // In series, the ammeter's two ends are joined only the long way round, through the cell.
    // If they are also joined by a path without a cell, the ammeter is across (in parallel with) that path.
    const passive = main.filter(([o, oc]) => o !== id && oc.type !== 'cell').map(([, o]) => o.nodes);
    if (c.type === 'ammeter' && linked(passive, ...c.nodes)) fail('circuit', `${where}: ammeter ${id}`, 'is connected in parallel: an ammeter must be in series');
    if (c.type === 'voltmeter') {
      if (!linked(main.map(([, o]) => o.nodes), ...c.nodes)) fail('circuit', `${where}: voltmeter ${id}`, 'is in series: a voltmeter must be connected across a component');
      if (c.measures) {
        const seen = {};
        c.measures.forEach((m) => def.circuit.components[m].nodes.forEach((nd) => { seen[nd] = (seen[nd] || 0) + 1; }));
        const ends = Object.keys(seen).filter((nd) => seen[nd] % 2).sort();
        if (ends.join() !== [...c.nodes].sort().join()) fail('circuit', `${where}: voltmeter ${id}`, `is not connected across ${c.measures.join(' and ')}`);
      }
    }
  }
  if (!fig) { fail('circuit-drawing', where, 'no circuit diagram found'); return; }
  // Rebuild the drawn connections: wires join where their ends meet or where an end lies on another wire.
  const wires = [...fig.svg.matchAll(/<line class="wire" x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"\/>/g)].map((m) => m.slice(1, 5).map(Number));
  const drawn = Object.fromEntries([...fig.svg.matchAll(/<g class="comp" data-id="(\w+)" data-t1="([-\d.]+) ([-\d.]+)" data-t2="([-\d.]+) ([-\d.]+)">/g)]
    .map((m) => [m[1], [[+m[2], +m[3]], [+m[4], +m[5]]]]));
  const parent = {};
  const key = ([x, y]) => `${x},${y}`;
  const find = (k) => { while (parent[k] !== k) k = parent[k] = parent[parent[k]]; return k; };
  const add = (pt) => { const k = key(pt); if (!(k in parent)) parent[k] = k; return k; };
  const join = (a, b) => { parent[find(add(a))] = find(add(b)); };
  const onWire = ([x, y], [x1, y1, x2, y2]) => Math.abs((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)) < 0.5
    && x >= Math.min(x1, x2) - 0.2 && x <= Math.max(x1, x2) + 0.2 && y >= Math.min(y1, y2) - 0.2 && y <= Math.max(y1, y2) + 0.2;
  wires.forEach(([x1, y1, x2, y2]) => join([x1, y1], [x2, y2]));
  const terminals = Object.values(drawn).flat();
  const pts = [...wires.flatMap(([x1, y1, x2, y2]) => [[x1, y1], [x2, y2]]), ...terminals];
  for (const pt of pts) for (const w of wires) if (onWire(pt, w)) join(pt, [w[0], w[1]]);
  for (const [id, ts] of Object.entries(drawn)) {
    ts.forEach((t, i) => { if (!wires.some((w) => onWire(t, w))) fail('circuit-drawing', `${where}: ${id}`, `terminal ${i + 1} isn't connected to any wire`); });
    if (!def.circuit.components[id]) fail('circuit-drawing', `${where}: ${id}`, 'is drawn but isn\'t in the netlist');
  }
  for (const [id] of comps) if (!drawn[id]) fail('circuit-drawing', `${where}: ${id}`, 'is in the netlist but isn\'t drawn');
  // Find a one-to-one match between netlist nodes and drawn wire groups (trying both ways round for each component).
  const list = comps.filter(([id]) => drawn[id]);
  const groups = (id) => drawn[id].map((t) => find(add(t)));
  function match(i, map, used) {
    if (i === list.length) return true;
    const [id, c] = list[i];
    for (const [g1, g2] of [groups(id), groups(id).reverse()]) {
      const m = new Map(map);
      const u = new Map(used);
      let ok = true;
      for (const [nd, gr] of [[c.nodes[0], g1], [c.nodes[1], g2]]) {
        if (m.has(nd) && m.get(nd) !== gr) ok = false;
        if (u.has(gr) && u.get(gr) !== nd) ok = false;
        m.set(nd, gr); u.set(gr, nd);
      }
      if (ok && match(i + 1, m, u)) return true;
    }
    return false;
  }
  if (!match(0, new Map(), new Map())) fail('circuit-drawing', where, 'the drawn wiring doesn\'t match the netlist (a component is joined to the wrong wire)');
}

// ---------- Report format ----------
export function formatDiag(x) {
  const lines = [`${x.level === 'error' ? '✗' : '!'} Dataset ${x.dataset} · ${x.where} · ${x.code}`, `    ${x.message}`];
  if (x.expected !== undefined) lines.push(`    Expected: ${x.expected}`);
  if (x.got !== undefined) lines.push(`    Got:      ${x.got}`);
  lines.push(`    Status: ${x.level === 'error' ? 'FAIL' : 'WARNING'}`);
  return lines.join('\n');
}
