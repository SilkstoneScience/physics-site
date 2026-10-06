// Paper 1B validator: checks one generated question against its dataset definition.
// It works from what students actually see: it reads the published table and the SVG graphs back,
// recalculates every fit, result and answer from them, and checks them against the physics model,
// the units, the stated uncertainties, the question's claims and the mark scheme.
// A dataset with any error is not written to questions/1b.json (see build.mjs).
import {
  parseNum, dpOf, sigFigsIn, onGrid, roundTo, fmtNum, sigFig, parseUnit, sameDim, addDim,
  linearFit, stripTags, cross, decimalsOf, toSI, baseUnitExpr, valuePm, gradientBand, sciParts,
} from './lib.mjs';
import { normalizeAO } from './ao.mjs';
import { generateRows, makeContext, uncertaintyOf, columnDp, paramValues, modelValue, evalModel, perRowUncertainty, buildQuestion } from './generate.mjs';
import { LAWS } from './laws.mjs';
import { createRequire } from 'node:module';
import { applySystematic, checkSystematic } from './systematic.mjs';

const generateRowsSafe = (def) => { try { return generateRows(def, { ideal: true }).rows; } catch (e) { return []; } };

const { checkNumeric } = createRequire(import.meta.url)('../../js/numeric.js');

const CONTEXTS = ['experimental', 'observational', 'unfamiliar'];
// A verdict students must reach from the max/min lines ("is the claimed value inside the range?") must
// survive reasonable by-eye line drawing: the claimed value must be at least this fraction of the
// result's value clear of the range's edge (inside or outside). Drawn steepest and shallowest lines
// typically differ from the computed extremes by a few per cent of the gradient.
export const VERDICT_MARGIN = 0.04;
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-300);

export function validateDataset(def, q, { topics, traced, meta } = {}) {
  const diags = [];
  const fail = (code, where, message, extra = {}) => diags.push({ level: 'error', code, dataset: def.id, where, message, ...extra });
  const warn = (code, where, message, extra = {}) => diags.push({ level: 'warning', code, dataset: def.id, where, message, ...extra });
  let d = null;
  try {
    d = run(def, q, topics, fail, warn);
  } catch (e) {
    fail('crash', 'dataset', `the validator stopped: ${e.message}`);
  }
  // Part metadata (AO tags, what a part asks for): not published, so taken from the generator.
  try {
    checkPartMeta(def, q, meta || buildQuestion(def).meta, d, fail);
  } catch (e) {
    fail('crash', 'part metadata', `couldn't check the parts' AO tags and asks: ${e.message}`);
  }
  // Numbers in the text: the generator records what its helpers printed (rebuilt here if not passed in).
  try {
    checkTextNumbers(def, q, traced || buildQuestion(def).traced, fail);
  } catch (e) {
    fail('crash', 'text numbers', `couldn't trace the numbers in the text: ${e.message}`);
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
  const table = (q.data || []).find((x) => x.kind === 'table' && x.figure !== 'trials');
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

  // Repeated readings shown in the trials table (one row of one column), read back like the main table.
  const tt = def.trialsTable;
  let trialReadings = null;
  if (tt) {
    const t = (q.data || []).find((x) => x.figure === 'trials');
    const tc = def.columns[tt.column];
    if (!t || !tc || !tc.trials) fail('trials', 'trials table', 'trialsTable needs a column with repeated readings, shown as a table');
    else {
      const where = `trials table (row ${tt.row + 1})`;
      if (!t.html.includes(`data-col="${tt.column}" data-row="${tt.row}"`)) fail('trials', where, 'the trials table is for a different row or column than the dataset says');
      const label = `$${tc.symbol}$${parseUnit(tc.unit || '').text ? ' / ' + parseUnit(tc.unit || '').text : ''}`;
      if (!t.html.includes(label)) fail('trials', where, `the heading should show "${label}"`);
      const texts = [...t.html.matchAll(/<td data-trial="\d+">(.*?)<\/td>/g)].map((m) => m[1]);
      if (texts.length !== tc.trials) fail('trials', where, `shows ${texts.length} readings, but the dataset takes ${tc.trials}`);
      texts.forEach((x, j) => {
        if (dpOf(x) !== columnDp(tc)) fail('table-dp', `${where}, reading ${j + 1}`, `"${x}" has ${dpOf(x)} decimal places, but readings use ${columnDp(tc)}`);
        if (!onGrid(parseNum(x), tc.resolution)) fail('table-dp', `${where}, reading ${j + 1}`, `"${x}" isn't a reading the instrument can show (resolution ${tc.resolution})`);
      });
      trialReadings = texts.map(parseNum);
    }
  }
  const tolFor = (c, model) => {
    const noise = c.noise || {};
    if (noise.type === 'gauss') return 5 * noise.sd + c.resolution;
    if (noise.type === 'gauss-relative') return 5 * noise.sd * Math.abs(model) + c.resolution;
    if (noise.type === 'poisson') return 5 * Math.sqrt(model) + 1;
    return c.resolution;
  };

  const setCol = cols.find(([, c]) => c.kind === 'set');
  const n = setCol[1].values.length;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const row = {};
    for (const [k, c] of cols) {
      const where = `table row ${i + 1}, ${c.symbolText || c.symbol}`;
      // Repeated readings: the published ones for the trials-table row, otherwise the generated ones.
      const isTrialRow = tt && tt.column === k && tt.row === i && trialReadings;
      if (c.trials) {
        const readings = isTrialRow ? trialReadings : gen.rows[i][k + '__trials'];
        row[k + '__trials'] = readings;
        const model = applySystematic(c.systematic, modelValue(def, c, { params: p, row, singles: gen.singles }, `column ${k}`), row);
        readings.forEach((x, j) => {
          if (Math.abs(x - model) > tolFor(c, model)) fail('model', `${where}, reading ${j + 1}`, 'reading is too far from the physics model to be measurement scatter', { expected: fmtNum(model, columnDp(c) + 1), got: fmtNum(x, columnDp(c)) });
        });
      }
      if (c.show === false) { row[k] = gen.rows[i][k]; continue; }
      const cell = cells.get(`${k}|${i}|`);
      const hidden = (c.hide || []).includes(i);
      const meanOf = (a) => roundTo(a.reduce((x, y) => x + y, 0) / a.length, c.resolution);
      if (!cell) { fail('table-value', where, 'cell missing'); row[k] = gen.rows[i][k]; continue; }
      if (cell.blank || hidden) {
        if (!hidden) fail('table-value', where, 'cell is blank but not listed in "hide"');
        if (!cell.blank) fail('table-value', where, 'cell should be blank (listed in "hide")');
        const calculable = c.kind === 'derived' || (c.trials && isTrialRow);
        if (!calculable) fail('table-value', where, 'only values students can calculate (a derived column, or the mean of the readings in the trials table) can be left blank');
        row[k] = c.kind === 'derived' ? roundTo(c.value(row, p, gen.singles), 10 ** -c.dp) : c.trials ? meanOf(row[k + '__trials']) : gen.rows[i][k];
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
        const model = applySystematic(c.systematic, modelValue(def, c, { params: p, row, singles: gen.singles }, `column ${k}`), row);
        const isAnomaly = c.anomaly && c.anomaly.row === i;
        if (c.trials && fmtNum(meanOf(row[k + '__trials']), dp) !== cell.text) {
          fail('trials', where, 'the mean doesn\'t match the repeated readings', { expected: fmtNum(meanOf(row[k + '__trials']), dp), got: cell.text });
        }
        if (!isAnomaly && Math.abs(v - model) > tolFor(c, model)) {
          fail('model', where, 'value is too far from the physics model to be measurement scatter (typing error, or wrong model?)',
            { expected: fmtNum(model, dp + 1), got: cell.text });
        }
      }
      if (c.kind === 'catalogue') {
        // Published (secondary) data: the table must show the source's value, and the source must agree
        // with the physics model to within the declared tolerance (e.g. 1 %), or the model is wrong for these data.
        const src = fmtNum(roundTo(c.values[i], c.resolution), dp);
        if (src !== cell.text) fail('catalogue', where, 'value differs from the published source', { expected: src, got: cell.text });
        const model = modelValue(def, c, { params: p, row, singles: gen.singles }, `column ${k}`);
        if (Math.abs(v - model) > c.agree * Math.abs(model)) fail('catalogue', where, `the published value differs from the physics model by more than ${c.agree * 100} %`, { expected: fmtNum(model, dp + 1), got: cell.text });
      }
      if (c.kind === 'derived') {
        const want = fmtNum(roundTo(c.value(row, p, gen.singles), 10 ** -c.dp), c.dp);
        if (want !== cell.text) fail('derived', where, 'calculated value doesn\'t match the values it is calculated from', { expected: want, got: cell.text });
      }
      row[k] = v;
    }
    // Uncertainty columns (one value per row)
    for (const [k, c] of cols) {
      if (!perRowUncertainty(c) || c.show === false) continue;
      const where = `table row ${i + 1}, Δ${c.symbolText || c.symbol}`;
      const cell = cells.get(`${k}|${i}|u`);
      if (!cell) { fail('uncertainty', where, 'uncertainty cell missing'); continue; }
      if (cell.blank) continue;
      const want = fmtNum(uncertaintyOf(c, row, p, gen.singles, k, def), columnDp(c));
      if (cell.text !== want) fail('uncertainty', where, 'uncertainty doesn\'t follow the dataset\'s rule', { expected: want, got: cell.text });
      if (c.propagation) checkPropagation(def, c, k, i, row, p, { ...gen.singles }, cell.text, fail);
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
    if (own.r2 > 0.999999 && def.source !== 'secondary') warn('realism', 'graph', 'the points lie almost exactly on a line, so the data look invented: add realistic scatter');
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
    // A prediction must be at a value that wasn't measured (else students just read the table).
    if (res.predictAt) {
      const col = def.columns[res.predictAt.column];
      if (!col) fail('prediction', where, `predictAt names an unknown column ${res.predictAt.column}`);
      else if (rows.some((rw) => Math.abs(rw[res.predictAt.column] - res.predictAt.value) <= (col.resolution || 0) + 1e-12)) {
        fail('prediction', where, `the prediction at ${res.predictAt.value} is at a measured row, so it can be read from the table`);
      }
    }
    // A range said to come from the max/min lines must be exactly that for a gradient or an intercept.
    if (res.basis === 'lines') {
      const band = { gradient: d.band && [d.band.mMin, d.band.mMax], intercept: d.band && [d.band.cMin, d.band.cMax] }[res.check];
      if (!r.range) fail('claim-verdict', where, 'basis "lines" needs a range');
      else if (res.check in { gradient: 1, intercept: 1 } && (!band || r.range.some((v, i) => rel(v, band[i]) > 1e-9))) {
        fail('claim-verdict', where, `the range isn't the ${res.check} range from the max/min lines`);
      }
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
      // A check that the data recover a model value. A disagreement that students must judge is a verdict
      // (below), because it needs a margin and a range from the max/min lines, not the answer tolerance.
      const r = d.r[cl.result];
      if (cl.expect === false) { fail('claim-verdict', where, 'a disagreement students must judge must be a verdict claim ({ type: "verdict", expect: "outside" }), with a margin and a max/min-line range'); continue; }
      if (!r || !r.range) { fail('claim', where, 'needs a result with an accepted range'); continue; }
      const ok = r.range[0] <= cl.value && cl.value <= r.range[1];
      if (ok !== cl.expect) {
        fail('claim', where, cl.expect ? `the question expects agreement with ${cl.value}, but the data's range excludes it`
          : `the question expects disagreement with ${cl.value}, but the data's range includes it`,
        { expected: cl.value, got: `${sigFig(r.range[0], 3)} to ${sigFig(r.range[1], 3)}` });
      }
    } else if (cl.type === 'verdict') {
      // { type: 'verdict', result, value, expect: 'inside' | 'outside', margin } : a conclusion students reach
      // by comparing a stated value with the range from the max/min lines. The value must be clearly inside
      // or outside, by at least margin × the result's value, so that students' own lines give the same verdict.
      const r = d.r[cl.result];
      const res = (def.results || {})[cl.result];
      if (!r || !r.range || !res || !['lines', 'uncertainty'].includes(res.basis)) {
        fail('claim-verdict', where, 'needs a result whose range comes from the max/min lines (basis: "lines") or its propagated uncertainty (basis: "uncertainty"), not an answer tolerance'); continue;
      }
      if (!['inside', 'outside'].includes(cl.expect)) { fail('claim-verdict', where, 'expect must be "inside" or "outside"'); continue; }
      const margin = cl.margin ?? VERDICT_MARGIN;
      if (margin < VERDICT_MARGIN) fail('claim-verdict', where, `margin ${margin} is smaller than the minimum ${VERDICT_MARGIN}`);
      const pad = Math.max(margin, VERDICT_MARGIN) * Math.abs(r.value);
      const [lo, hi] = r.range;
      const ok = cl.expect === 'outside' ? (cl.value < lo - pad || cl.value > hi + pad) : (lo + pad <= cl.value && cl.value <= hi - pad);
      if (!ok) {
        fail('claim-verdict', where, `${cl.value} is not clearly ${cl.expect} the max/min-line range: students' own lines could give the other conclusion`,
          { expected: cl.expect === 'outside' ? `below ${sigFig(lo - pad, 3)} or above ${sigFig(hi + pad, 3)}` : `${sigFig(lo + pad, 3)} to ${sigFig(hi - pad, 3)}`, got: cl.value });
      }
    } else if (cl.type === 'notLinear') {
      // The question says no straight line fits: true only if no line passes through every error bar.
      const spec = cl.graph === 'raw' ? def.rawGraph : g;
      if (!spec) { fail('claim', where, 'needs the graph it refers to'); continue; }
      const pts = rows.map((rw, i) => ({ x: rw[spec.x], y: rw[spec.y], ex: (spec.xErrorBars && d.unc(spec.x, i)) || 0, ey: d.unc(spec.y, i) || 0 }));
      if (gradientBand(pts)) fail('claim', where, 'the question says the data are not linear, but a straight line passes through every error bar');
    } else if (cl.type === 'outlier') {
      // Repeated readings with one outlying value: it must stand well clear of the others (at least 3 times
      // their whole spread from their mean), so students can identify it from the table alone.
      const c = def.columns[cl.column];
      if (!c || !c.anomaly || c.anomaly.row !== cl.row) { fail('claim', where, "an outlier claim needs the column's anomaly to be in that row"); continue; }
      const others = rows.map((rw) => rw[cl.column]).filter((_, i) => i !== cl.row);
      const spread = Math.max(Math.max(...others) - Math.min(...others), c.resolution);
      const dev = Math.abs(rows[cl.row][cl.column] - others.reduce((a, b) => a + b, 0) / others.length);
      if (dev < 3 * spread) fail('claim', where, `the outlying reading is only ${(dev / spread).toFixed(1)} times the spread of the other readings from their mean (needs 3)`);
    } else if (cl.type === 'validRange') {
      // { type: 'validRange', lastLinearRow: i }: a straight line fits rows 0..i within the error bars; rows from
      // i + 2 on lie outside every such line by more than their error bars (row i + 1 may be borderline).
      const i0 = cl.lastLinearRow;
      if (!g || g.fit !== 'linear') { fail('claim', where, 'needs a linear graph'); continue; }
      const excl = rows.map((_, i) => i).filter((i) => i > i0);
      if (excl.some((i) => !(g.exclude || []).includes(i))) fail('claim', where, 'every row beyond the linear region must be listed in graph.exclude, so the fit uses only the linear region');
      const pt = (i) => ({ x: rows[i][g.x], y: rows[i][g.y], ex: (g.xErrorBars && d.unc(g.x, i)) || 0, ey: d.unc(g.y, i) || 0 });
      const lin = gradientBand(rows.slice(0, i0 + 1).map((_, i) => pt(i)));
      if (!lin) { fail('claim', where, `no straight line fits rows 1 to ${i0 + 1} within their error bars`); continue; }
      if (i0 + 3 <= rows.length && gradientBand(rows.slice(0, i0 + 3).map((_, i) => pt(i)))) fail('claim', where, `a straight line still fits rows 1 to ${i0 + 3}, so the data don't show where the model fails`);
      for (let j = i0 + 2; j < rows.length; j++) {
        const P = pt(j);
        const ys = [lin.steep, lin.shallow].map((L) => L.m * P.x + L.c);
        if (!(P.y - P.ey > Math.max(...ys) || P.y + P.ey < Math.min(...ys))) fail('claim', where, `row ${j + 1} is still within reach of a straight line through the linear region, so the departure isn't clear`);
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
    const sci = (k) => { const s = sciParts(r.value, k); return `${s.mant} \\times 10^{${s.exp}}`; };
    if (![2, 3].some((k) => ms.includes(sigFig(r.value, k)) || ms.includes(sci(k)))) {
      fail('markscheme-value', where, 'the mark scheme doesn\'t state the answer', { expected: `${sigFig(r.value, 2)} or ${sigFig(r.value, 3)}` });
    }
  }

  // ---------- 6. Graphs must show exactly the data ----------
  const figures = [...(q.data || []).filter((x) => x.kind === 'figure'), ...(q.parts || []).flatMap((pt) => [pt.figure, pt.msFigure].filter((f) => f && typeof f === 'object'))];
  if (def.rawGraph && !figures.some((f) => f.figure === 'graph-raw')) fail('graph-point', 'raw graph', "the dataset has a raw-data graph, but the question doesn't show it");
  if (g) {
    const student = figures.find((f) => f.figure === 'graph');
    if (!student) fail('graph-point', 'graph', 'the dataset has a graph, but the question doesn\'t show it');
    for (const fig of figures.filter((f) => /data-graph=/.test(f.svg))) checkGraph(fig, def, d, rows, fail);
  }

  // ---------- 7. Diagrams and all SVG ----------
  for (const fig of figures) checkSvg(fig, def, fail);
  for (const chk of def.diagramChecks || []) {
    const fig = figures.find((f) => f.figure === chk.figure);
    if (!fig) { fail('diagram', `figure ${chk.figure}`, 'diagram check names a figure that the question doesn\'t show'); continue; }
    if (chk.harmonic) checkStandingWave(fig, chk.harmonic, fail);
  }
  if (def.circuit) checkCircuit(def, figures.find((f) => f.figure === (def.circuit.figure || 'diagram')), fail);
  return d;
}

// ---------- Part metadata: AO tags and what a part asks for ----------
//   ao: 'AO2' or { AO2: 1, AO3: 1 }   required on every part (see ao.mjs)
//   asks: { unit: 'gradient' }        "state the unit": the mark scheme must give that result's unit (as
//                                     given or in SI base units), and the question must not give it away
//   asks: { valuePm: ['B', 'dB'], sf: 1 }   "value ± uncertainty": the mark scheme must give the value with
//                                     the uncertainty to sf s.f. and the value to the same decimal place,
//                                     worked out here from the results recalculated from the published table
function checkPartMeta(def, q, meta, d, fail) {
  const byLabel = new Map((q.parts || []).map((pt) => [pt.label, pt]));
  for (const m of meta) {
    const where = `part (${m.label})`;
    try { normalizeAO(m.ao, m.marks); } catch (e) { fail('ao', where, e.message); }
    const asks = m.asks;
    if (!asks) continue;
    const pt = byLabel.get(m.label);
    if (!pt) { fail('asks', where, 'the part isn\'t in the question'); continue; }
    const ms = (pt.markscheme || []).join(' ');
    if (asks.unit !== undefined) {
      const res = (def.results || {})[asks.unit];
      if (!res || !res.unit) { fail('asks-unit', where, `asks for the unit of "${asks.unit}", which isn't a result with a unit`); continue; }
      const u = parseUnit(res.unit);
      const forms = [u.tex, parseUnit(baseUnitExpr(u.dim)).tex];
      if (!forms.some((t) => ms.includes(t))) fail('asks-unit', where, 'the mark scheme doesn\'t give the unit asked for', { expected: forms.join(' or ') });
      if (forms.some((t) => String(pt.question).includes(t))) fail('asks-unit', where, 'the question gives away the unit it asks for');
    }
    if (asks.valuePm !== undefined) {
      const [vName, uName] = asks.valuePm;
      const sf = asks.sf || 1;
      if (![1, 2].includes(sf)) { fail('asks-pm', where, 'an uncertainty is quoted to 1 or 2 significant figures'); continue; }
      if (!d || !d.r[vName] || !d.r[uName]) { fail('asks-pm', where, `needs results "${vName}" and "${uName}"`); continue; }
      let t;
      try { t = valuePm(d.r[vName].value, d.r[uName].value, sf); } catch (e) { fail('asks-pm', where, e.message); continue; }
      const want = `${t.value} \\pm ${t.unc}`;
      if (!ms.includes(want)) fail('asks-pm', where, 'the mark scheme doesn\'t give the value and uncertainty correctly rounded', { expected: want });
    }
  }
}

// ---------- Numbers in the text must be traceable ----------
// Every number in the question text, mark scheme, captions and alt text must be one of:
//   • printed by a template helper (d.sf, d.dp, d.text, d.int, d.stated), so it comes from the data, a
//     parameter, a result or a declared stated constant;
//   • a value shown in the data tables (including the ± uncertainties in the headings);
//   • a small whitelisted integer: 0–12 (counting, part numbers, small coefficients such as the 2 in 2u²/g,
//     harmonic numbers, powers of ten) or 100 (percentages).
// Exponents (^{−1}), subscripts (f_3) and \tfrac12 are not numbers in this sense and are ignored.
export const TEXT_NUMBER_WHITELIST = 'integers 0 to 12, and 100';
const whitelisted = (tok) => /^\d+$/.test(tok) && (Number(tok) <= 12 || tok === '100');

export function numbersIn(text) {
  const t = stripTags(String(text))
    .replace(/\^\{[^}]*\}/g, ' ').replace(/\^[−-]?\d+(\.\d+)?/g, ' ')
    .replace(/_\{[^}]*\}/g, ' ').replace(/_\d+/g, ' ')
    .replace(/\\[dt]?frac(\d)(\d)/g, ' ')
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻₀₁₂₃₄₅₆₇₈₉]+/g, ' ');
  return [...t.matchAll(/(?<![A-Za-z\d.])[−-]?\d+(?:\.\d+)?/g)].map((m) => ({ tok: m[0].replace('−', '-').replace(/^-/, ''), at: m.index, text: t }));
}

function checkTextNumbers(def, q, traced, fail) {
  const allowed = new Set([...traced].map((s) => s.replace('−', '')));
  for (const item of q.data || []) {
    if (item.kind === 'table') for (const m of item.html.matchAll(/>([−\d.]+)<|± ([−\d.]+)/g)) allowed.add((m[1] || m[2]).replace('−', ''));
  }
  for (const [name, st] of Object.entries(def.stated || {})) {
    if (typeof st.source !== 'string' || !st.source.trim()) fail('text-number', `stated constant ${name}`, 'needs a source (where the number comes from)');
    if (st.from && Math.abs(st.from(paramValues(def)) - st.value) > 1e-9 * Math.max(1, Math.abs(st.value))) {
      fail('text-number', `stated constant ${name}`, 'doesn\'t match the parameter it is said to come from', { expected: st.from(paramValues(def)), got: st.value });
    }
  }
  const texts = [['the question text', q.stem]];
  for (const item of q.data || []) {
    if (item.caption) texts.push([`caption of ${item.figure || 'the table'}`, item.caption]);
    if (item.alt) texts.push([`description (alt) of ${item.figure}`, item.alt]);
  }
  for (const pt of q.parts || []) {
    texts.push([`part (${pt.label}) question`, pt.question]);
    (pt.markscheme || []).forEach((m, j) => texts.push([`part (${pt.label}) mark scheme point ${j + 1}`, m]));
    if (pt.msFigure && typeof pt.msFigure === 'object') {
      if (pt.msFigure.caption) texts.push([`caption of ${pt.msFigure.figure}`, pt.msFigure.caption]);
      if (pt.msFigure.alt) texts.push([`description (alt) of ${pt.msFigure.figure}`, pt.msFigure.alt]);
    }
  }
  for (const [where, text] of texts) {
    // A control character (tab, form feed, backspace…) in the text almost always means a LaTeX command lost its
    // backslash in a template string (`\text` becomes a tab + "ext"), so the formula would display wrongly.
    if (/[\u0000-\u0009\u000b-\u001f]/.test(String(text))) fail('text-control', where, 'contains a control character: probably a LaTeX command written with a single backslash in a template string (use \\\\text, \\\\dfrac, …)');
    for (const n of numbersIn(text)) {
      if (allowed.has(n.tok) || whitelisted(n.tok)) continue;
      fail('text-number', where, `the number ${n.tok} isn't traceable to the data, a parameter, a result or a stated constant (print it with d.sf, d.dp, d.text, d.int or d.stated)`,
        { got: `…${n.text.slice(Math.max(0, n.at - 30), n.at + n.tok.length + 20).trim()}…` });
    }
  }
}

// ---------- Uncertainty propagation, recomputed independently ----------
// Instead of trusting the declared rule, differentiate the column's own formula numerically with respect
// to every column and single reading, and combine |∂y/∂x|·Δx as a worst-case sum (the IB convention).
// This catches a declaration that doesn't match the formula (e.g. a power of 1 declared for R²), a formula
// that depends on something the declaration ignores, and a "neglected" term that isn't actually small.
function checkPropagation(def, c, k, i, row, p, singles, shown, fail) {
  const spec = c.propagation;
  const where = `table row ${i + 1}, Δ${c.symbolText || c.symbol}`;
  const y0 = c.value(row, p, singles);
  const declared = new Map(spec.terms.map((t) => [t.of !== undefined ? `col:${t.of}` : `single:${t.single}`, t]));
  const neglected = new Map((spec.neglect || []).map((t) => [t.of !== undefined ? `col:${t.of}` : `single:${t.single}`, t]));
  const inputs = [
    ...Object.keys(def.columns).filter((x) => x !== k && Number.isFinite(row[x])).map((x) => ({ key: `col:${x}`, name: x, get: () => row[x], set: (v) => { row[x] = v; } })),
    ...Object.keys(singles).map((x) => ({ key: `single:${x}`, name: x, get: () => singles[x], set: (v) => { singles[x] = v; } })),
  ];
  const uncOf = (inp, t) => {
    if (t && t.unc === 'poisson') return Math.sqrt(inp.get());
    if (t && typeof t.unc === 'number') return t.unc;
    if (inp.key.startsWith('col:')) return uncertaintyOf(def.columns[inp.name], row, p, singles, inp.name, def);
    return (def.singles[inp.name] || {}).uncertainty;
  };
  let total = 0;
  const small = [];
  for (const inp of inputs) {
    const x = inp.get();
    const h = 1e-6 * Math.max(Math.abs(x), 1e-6);
    inp.set(x + h); const yp = c.value(row, p, singles);
    inp.set(x - h); const ym = c.value(row, p, singles);
    inp.set(x);
    const deriv = (yp - ym) / (2 * h);
    const depends = Math.abs(deriv) * Math.max(Math.abs(x), 1e-6) > 1e-9 * Math.max(Math.abs(y0), 1e-12);
    const t = declared.get(inp.key);
    if (depends && !t && !neglected.has(inp.key)) {
      fail('propagation', where, `the formula depends on ${inp.name}, but the declared propagation leaves it out (add it, or list it in neglect with a reason)`);
    }
    if (!depends && t) fail('propagation', where, `the propagation includes ${inp.name}, but the formula doesn't depend on it`);
    if (depends && t) {
      const u = uncOf(inp, t);
      if (!(u >= 0)) { fail('propagation', where, `no uncertainty for ${inp.name}`); continue; }
      total += Math.abs(deriv) * u;
    }
    if (depends && neglected.has(inp.key)) {
      const nt = neglected.get(inp.key);
      if (!nt.reason) fail('propagation', where, `neglecting ${inp.name} needs a reason`);
      const u = uncOf(inp, nt);
      if (u >= 0) small.push({ name: inp.name, size: Math.abs(deriv) * u });
    }
  }
  for (const s of small) {
    if (s.size > total / 3) fail('propagation', where, `the neglected uncertainty in ${s.name} is not small (${sigFig(s.size, 2)} against ${sigFig(total, 2)} from the rest)`);
  }
  const step = 10 ** -columnDp(c);
  if (Math.abs(parseNum(shown) - total) > step / 2 + 1e-9) {
    fail('propagation', where, 'the uncertainty shown doesn\'t match an independent first-order propagation of the column\'s own formula (does the declared propagation match the formula?)',
      { expected: fmtNum(roundTo(total, step), columnDp(c)), got: shown });
  }
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
    if (c.systematic) for (const msg of checkSystematic(c.systematic, generateRowsSafe(def))) bad('physics-meta', `${where}.systematic`, msg);
  }
  // Published (secondary) data: provenance, a model to test them against, and a stated agreement tolerance.
  const catalogue = Object.entries(def.columns).filter(([, c]) => c.kind === 'catalogue');
  if (catalogue.length || def.source === 'secondary') {
    const pv = def.provenance || {};
    if (def.source !== 'secondary') bad('physics-meta', 'source', 'a dataset with published (catalogue) data must say source: "secondary"');
    for (const k2 of ['source', 'url', 'retrieved', 'taken', 'transformations']) if (!isText(pv[k2])) bad('physics-meta', `provenance.${k2}`, 'secondary data need their provenance: source, url, retrieved (date), taken (which values) and transformations');
  }
  for (const [k2, c] of catalogue) {
    const where = `column ${k2}`;
    if (!c.model || !c.model.law) bad('physics-meta', `${where}.model`, 'published data must be compared with a model built from a vetted law');
    if (!Array.isArray(c.expect) || c.expect.length !== 2) bad('physics-meta', `${where}.expect`, 'give the expected range of values');
    if (!(c.agree > 0 && c.agree <= 0.05)) bad('physics-meta', `${where}.agree`, 'state how closely the published values should follow the model (0 < agree <= 0.05)');
    if (!isText(c.agreeReason)) bad('physics-meta', `${where}.agreeReason`, 'explain why the published values may differ from the simple model');
    const setCol = Object.values(def.columns).find((x) => x.kind === 'set');
    if (!Array.isArray(c.values) || !setCol || c.values.length !== setCol.values.length) bad('physics-meta', `${where}.values`, 'needs one published value per row');
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
  for (const [where, c] of [...measured, ...catalogue.map(([k2, c]) => [`column ${k2}`, c])]) {
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
      // Compare in SI units (a result may be in g m⁻¹ while the parameter is in kg m⁻¹), with the same dimensions.
      const [ru, pu] = [parseUnit(res.unit || ''), parseUnit(def.physics.params[res.estimates].unit || '')];
      if (!sameDim(ru.dim, pu.dim)) { fail('physics-units', `result ${name}`, `is in ${ru.text || 'no unit'}, which can't be compared with ${res.estimates} in ${pu.text || 'no unit'}`); continue; }
      // Tolerance scale: the size of the value in SI, or in its own unit when that is larger (absolute zero is
      // 0 K but −273.15 °C, so a relative tolerance in kelvin alone would be zero).
      const scale = Math.max(Math.abs(toSI(truth, pu)), Math.abs(truth * pu.scale));
      if (Math.abs(toSI(d.r[name].value, ru) - toSI(truth, pu)) > tol * scale) {
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
  const raw = fig.figure === 'graph-raw';
  const g = raw ? def.rawGraph : def.graph;
  const kind = fig.figure === 'graph' || raw ? 'student' : 'examiner';
  const where = raw ? 'raw-data graph' : kind === 'student' ? 'graph' : 'mark-scheme graph';
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

  const want = rows.map((_, i) => i).filter((i) => kind === 'examiner' || raw || !(g.omit || []).includes(i));
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

// ---------- Standing waves: a string fixed at both ends in its nth harmonic ----------
// Reads the drawn string (<line class="string" …/>) and the wave envelope (<polyline class="… wave" …/>).
// The envelope must start and end on the string (nodes at the fixed ends) and cross it exactly n − 1 times
// in between, so the drawing shows n loops: the physics of the nth harmonic, not just a label.
function checkStandingWave(fig, n, fail) {
  const where = `figure ${fig.figure}`;
  const s = fig.svg.match(/<line class="[^"]*\bstring\b[^"]*" x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/);
  const waves = [...fig.svg.matchAll(/<polyline class="[^"]*\bwave\b[^"]*" points="([^"]+)"/g)];
  if (!s || !waves.length) { fail('diagram', where, 'no string or standing-wave envelope found'); return; }
  const [x1, y0, x2] = [+s[1], +s[2], +s[3]];
  for (const w of waves) {
    const pts = w[1].trim().split(/\s+/).map((pq) => pq.split(',').map(Number));
    const [first, last] = [pts[0], pts[pts.length - 1]];
    if (Math.abs(first[0] - x1) > 0.6 || Math.abs(last[0] - x2) > 0.6 || Math.abs(first[1] - y0) > 0.6 || Math.abs(last[1] - y0) > 0.6) {
      fail('diagram', where, 'the wave must have nodes at both fixed ends of the string');
    }
    let crossings = 0;
    let prev = 0;
    for (const [, y] of pts.slice(1, -1)) {
      const side = Math.abs(y - y0) < 0.3 ? 0 : Math.sign(y - y0);
      if (side && prev && side !== prev) crossings++;
      if (side) prev = side;
    }
    if (crossings + 1 !== n) fail('diagram', where, `the drawing shows ${crossings + 1} loop(s), but harmonic ${n} has ${n}`, { expected: `${n} loops`, got: `${crossings + 1}` });
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
