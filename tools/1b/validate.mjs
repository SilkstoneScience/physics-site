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
import { generateRows, makeContext, uncertaintyOf, columnDp, paramValues, modelValue, evalModel, perRowUncertainty, buildQuestion, tableHtml } from './generate.mjs';
import { LAWS } from './laws.mjs';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { applySystematic, checkSystematic } from './systematic.mjs';
import {
  regularityFindings, VISIBLE_BAR, X_ERROR_BARS_ALLOWED, READ_PHRASES, axisRanges, visibleSequence, valueTokens, hasToken,
  constancy, successiveRatios, multiplesProblems,
} from './safeguards.mjs';
import { MARKER_R } from './graph.mjs';

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
  // Published values against a stored copy of the source (T10).
  try {
    checkProvenance(def, fail, warn);
  } catch (e) {
    fail('crash', 'provenance', `couldn't check the source values: ${e.message}`);
  }
  // Graph reads (T3) and giveaways (T4): from the question students see and the parts' metadata.
  try {
    const m = meta || buildQuestion(def).meta;
    checkGraphReads(def, q, m, fail, warn);
    checkGiveaways(def, q, m, d, fail, warn);
  } catch (e) {
    fail('crash', 'safeguards', `couldn't run the graph-read and giveaway checks: ${e.message}`);
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
  let table = (q.data || []).find((x) => x.kind === 'table' && x.figure !== 'trials');
  if (def.tableless) {
    // T7/T8 (Phase 12): data students see only as a graph or an instrument image. Everything below is checked against
    // the generator's complete table (internal: never published), and the figure read-back checks compare what students
    // see with those values. checkTableless makes sure every shown column can be read from a declared figure.
    if (table) fail('table-header', 'table', 'the dataset says it has no student table (tableless), but the question shows one');
    checkTableless(def, q, fail);
    table = { kind: 'table', html: tableHtml(def, makeContext(def, gen.rows, gen.singles)) };
  }
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
    if (typeof c.uncertainty === 'number' && c.showUncertainty !== false) {
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
        // An observed column (c.observed) is published data the question COMPARES with a model (e.g. Venus is far hotter
        // than the no-atmosphere model): no agreement is expected, so only the source check (T10) applies.
        const model = c.observed ? v : modelValue(def, c, { params: p, row, singles: gen.singles }, `column ${k}`);
        if (!c.observed && Math.abs(v - model) > c.agree * Math.abs(model)) fail('catalogue', where, `the published value differs from the physics model by more than ${c.agree * 100} %`, { expected: fmtNum(model, dp + 1), got: cell.text });
      }
      if (c.kind === 'derived') {
        const want = fmtNum(roundTo(c.value(row, p, gen.singles), 10 ** -c.dp), c.dp);
        if (want !== cell.text) fail('derived', where, 'calculated value doesn\'t match the values it is calculated from', { expected: want, got: cell.text });
      }
      row[k] = v;
    }
    // Uncertainty columns (one value per row)
    for (const [k, c] of cols) {
      if (!perRowUncertainty(c) || c.show === false || c.showUncertainty === false) continue;
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
  checkRegularity(def, rows, cells, p, gen.singles, fail, warn);
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
      let want = { 'y/x': addDim(dimY, dimX, -1), y: dimY, x: dimX, xy: addDim(dimY, dimX, 1) }[res.dims.of];
      if (!want) { fail('unit-dims', where, `unknown dims.of "${res.dims.of}"`); continue; }
      if (res.dims.times) want = addDim(want, parseUnit(res.dims.times).dim);
      if (!sameDim(want, u.dim)) fail('unit-dims', where, `unit "${u.text}" has the wrong dimensions for ${res.dims.of}${res.dims.times ? ' × ' + res.dims.times : ''}`);
    }
    if (!Number.isFinite(r.value)) { fail('fit', where, 'value is not a finite number'); continue; }
    const show = (v) => `${sigFig(v, 4)} ${u.text}`.trim();
    if (res.check === 'area') checkAreaResult(def, d, rows, res, r, where, q, fail);
    if (res.check && !own && res.check !== 'area') fail('fit', where, `check "${res.check}" needs a fitted graph (fit: "linear" or "exponential")`);
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
    } else if (cl.type === 'constantRatio' || cl.type === 'constantValue') {
      // T5 (Phase 12). Students judge, from the table and the uncertainties, whether a quantity stays the same:
      //   constantValue { column, rows?: [first, last], expect }  the values of one column (often a derived product
      //                 or ratio such as I·d² or p/T), each with its uncertainty;
      //   constantRatio { column, rows?, expect }  the ratio of each value to the one before (a geometric decay such
      //                 as successive bounce heights), with its worst-case uncertainty (fractional uncertainties add).
      // expect true: one value lies within every interval (the intervals share a common value).
      // expect false: the intervals are clearly apart: the largest lower end exceeds the smallest upper end by at least
      // VERDICT_MARGIN of the mean, so students' own rounding can't reverse the conclusion.
      const c = def.columns[cl.column];
      if (!c) { fail('claim', where, `names an unknown column ${cl.column}`); continue; }
      const [i0, i1] = cl.rows || [0, rows.length - 1];
      const vals = [];
      for (let i = i0; i <= i1; i++) vals.push({ v: rows[i][cl.column], u: d.unc(cl.column, i) });
      if (vals.some((x) => !(x.u > 0))) { fail('claim', where, 'every row needs an uncertainty, so "constant within the uncertainties" can be judged'); continue; }
      const items = cl.type === 'constantRatio' ? successiveRatios(vals) : vals;
      if (items.length < 3) { fail('claim', where, 'needs at least three values to judge'); continue; }
      const k = constancy(items, VERDICT_MARGIN);
      const what = cl.type === 'constantRatio' ? 'ratio' : 'value';
      if (typeof cl.expect !== 'boolean') fail('claim', where, 'expect must be true or false');
      else if (cl.expect && !k.constant) {
        fail('claim', where, `the question says the ${what} is constant, but no single value lies within every uncertainty range`, { expected: 'overlapping ranges', got: `largest lower end ${sigFig(k.lo, 3)} > smallest upper end ${sigFig(k.hi, 3)}` });
      } else if (!cl.expect && !k.clearlyNot) {
        fail('claim', where, `the question says the ${what} is not constant, but the uncertainty ranges are not clearly apart (needs a gap of ${VERDICT_MARGIN * 100} % of the mean)`, { expected: `gap ≥ ${sigFig(VERDICT_MARGIN * Math.abs(k.mean), 2)}`, got: sigFig(k.lo - k.hi, 2) });
      }
    } else if (cl.type === 'integerMultiples') {
      // T5 (Phase 12). { column, factor: result name or number, expect: true }: every value is a whole-number multiple
      // (at least 1) of the factor within its uncertainty; each multiple is unambiguous (uncertainty under a quarter of
      // the factor); and no LARGER common factor also fits (otherwise the data don't show this factor as the unit).
      // A smaller factor (half, a third…) always fits multiples of the true one, so it can't be excluded by data alone:
      // the question must not claim to exclude it.
      const c = def.columns[cl.column];
      const e = typeof cl.factor === 'string' ? (d.r[cl.factor] || {}).value : cl.factor;
      if (!c || !(e > 0)) { fail('claim', where, 'needs a column and a positive factor (a number or a result name)'); continue; }
      if (cl.expect !== true) { fail('claim', where, 'only expect: true is supported (the data are multiples of the factor)'); continue; }
      for (const msg of multiplesProblems(rows.map((rw, i) => ({ q: rw[cl.column], u: d.unc(cl.column, i), label: `in row ${i + 1}` })), e, VERDICT_MARGIN)) fail('claim', where, msg);
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
  // Each figure once (a mark-scheme graph shown with several parts is checked once).
  const figures = [...new Map([...(q.data || []).filter((x) => x.kind === 'figure'), ...(q.parts || []).flatMap((pt) => [pt.figure, pt.msFigure].filter((f) => f && typeof f === 'object'))].map((f) => [f.figure, f])).values()];
  if (def.rawGraph && !figures.some((f) => f.figure === 'graph-raw')) fail('graph-point', 'raw graph', "the dataset has a raw-data graph, but the question doesn't show it");
  if (g) {
    const student = figures.find((f) => f.figure === 'graph');
    if (!student) fail('graph-point', 'graph', 'the dataset has a graph, but the question doesn\'t show it');
    for (const fig of figures.filter((f) => /data-graph=/.test(f.svg))) checkGraph(fig, def, d, rows, fail, warn);
  }

  // ---------- 7. Diagrams and all SVG ----------
  for (const fig of figures) checkSvg(fig, def, fail);
  for (const chk of def.diagramChecks || []) {
    const fig = figures.find((f) => f.figure === chk.figure);
    if (!fig) { fail('diagram', `figure ${chk.figure}`, 'diagram check names a figure that the question doesn\'t show'); continue; }
    if (chk.harmonic) checkStandingWave(fig, chk.harmonic, fail);
    if (chk.scale) checkScale(fig, chk.scale, def, d, rows, fail, warn);
  }
  if (def.circuit) checkCircuit(def, figures.find((f) => f.figure === (def.circuit.figure || 'diagram')), fail);
  return d;
}

//// ---------- T10: published values against a stored copy of the source ----------
// Secondary (published) data need, besides provenance.source/url/retrieved/taken/transformations:
//   provenance.fields: { <column>: { sourceColumn, definition, scale? } }   for every catalogue column (and any other
//       column taken from the source): the source's own column heading and what it means (D1-B01's lesson: JPL's "P"
//       column is not the sidereal period). scale converts the source's unit to the column's (10³ km → km: 1000).
//   provenance.extract: { file, sha256, rows: [source row name for each table row] }: a stored copy of the values as
//       printed, kept OUTSIDE the repository in the reference cache (P1B_SOURCES, default ../reference-cache next to
//       physics-site). Each value must equal the source's value (× scale) to within half the column's resolution, and the
//       file must still have the recorded SHA-256 (so nobody edits the copy to match the data).
// No extract: warning (the values can't be checked). Extract recorded but the file isn't on this computer (e.g. on
// GitHub): warning. A changed file or a value that differs from the source: error.
let SOURCES_DIR = process.env.P1B_SOURCES || fileURLToPath(new URL('../../../reference-cache/', import.meta.url));
export const sourcesDir = () => SOURCES_DIR;
// For tests only: point the check at another folder (returns the previous one).
export function setSourcesDir(dir) { const old = SOURCES_DIR; SOURCES_DIR = dir; return old; }
function checkProvenance(def, fail, warn) {
  const catalogue = Object.entries(def.columns || {}).filter(([, c]) => c.kind === 'catalogue');
  if (!catalogue.length && def.source !== 'secondary') return;
  const pv = def.provenance || {};
  const fields = pv.fields || {};
  for (const [k] of catalogue) {
    const f = fields[k];
    if (!f || typeof f.sourceColumn !== 'string' || !f.sourceColumn.trim() || typeof f.definition !== 'string' || !f.definition.trim()) {
      fail('provenance', `provenance.fields.${k}`, 'say which column of the source this is (sourceColumn, as headed there) and what it means (definition)');
    }
  }
  const ex = pv.extract;
  if (!ex) { warn('source-extract-missing', 'provenance.extract', 'no stored copy of the source values, so the published values can\'t be checked against the source'); return; }
  const file = path.resolve(SOURCES_DIR, ex.file || '');
  if (!ex.file || !fs.existsSync(file)) { warn('source-extract-unavailable', 'provenance.extract', `the stored copy of the source (${ex.file}) isn't on this computer, so the values weren't checked here`); return; }
  const bytes = fs.readFileSync(file);
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  if (hash !== ex.sha256) { fail('source-extract', 'provenance.extract', 'the stored copy of the source has changed since it was recorded', { expected: ex.sha256, got: hash }); return; }
  let src;
  try { src = JSON.parse(bytes.toString('utf8')); } catch (e) { fail('source-extract', 'provenance.extract', `the stored copy isn't valid JSON: ${e.message}`); return; }
  const setCol = Object.values(def.columns).find((c) => c.kind === 'set');
  const n = setCol ? setCol.values.length : 0;
  if (!Array.isArray(ex.rows) || ex.rows.length !== n) { fail('source-extract', 'provenance.extract.rows', `name the source row for each of the ${n} table rows`); return; }
  for (const [k, f] of Object.entries(fields)) {
    const c = def.columns[k];
    if (!c) { fail('provenance', `provenance.fields.${k}`, 'not a column of this dataset'); continue; }
    if (!(f.sourceColumn in (src.columns || {}))) { fail('source-extract', `provenance.fields.${k}`, `the stored copy has no column "${f.sourceColumn}"`); continue; }
    ex.rows.forEach((name, i) => {
      const raw = ((src.rows || {})[name] || {})[f.sourceColumn];
      const v = Number(raw) * (f.scale || 1);
      if (raw === undefined || !Number.isFinite(v)) { fail('source-extract', `column ${k}, row ${i + 1}`, `the stored copy has no value for ${name}`); return; }
      if (Math.abs(v - c.values[i]) > (c.resolution || 0) / 2 + 1e-9 * Math.abs(v)) {
        fail('source-extract', `column ${k}, row ${i + 1} (${name})`, 'the value differs from the published source', { expected: `${raw} × ${f.scale || 1}`, got: c.values[i] });
      }
    });
  }
}

// ---------- T7/T8: data without a student table ----------
// tableless: { reason, readFrom: [{ figure, columns: [...] }] }. Every shown column must be readable from a declared
// figure: a graph that plots it (checked point by point, or reading by reading for a trace), or an instrument image with
// a scale read-back check (diagramChecks: [{ figure, scale: { column } }]).
function checkTableless(def, q, fail) {
  const t = def.tableless;
  if (typeof t.reason !== 'string' || !t.reason.trim()) fail('table-header', 'tableless', 'say why students get no table (tableless.reason)');
  const figs = graphFigs(q);
  const covered = new Set();
  for (const r of t.readFrom || []) {
    const f = figs.find((x) => x.figure === r.figure);
    if (!f) { fail('table-header', 'tableless', `reads data from ${r.figure}, which the question doesn't show`); continue; }
    const isGraph = /data-graph=/.test(f.svg || '');
    for (const c of r.columns || []) {
      if (!def.columns[c]) { fail('table-header', 'tableless', `unknown column ${c}`); continue; }
      if (isGraph) {
        const g = r.figure === 'graph-raw' ? def.rawGraph : def.graph;
        if (!g || ![g.x, g.y].includes(c)) fail('table-header', 'tableless', `${c} isn't plotted on ${r.figure}`);
      } else if (!(def.diagramChecks || []).some((k) => k.figure === r.figure && k.scale && k.scale.column === c)) {
        fail('table-header', 'tableless', `${c} is read from ${r.figure}, which needs a scale read-back check (diagramChecks: [{ figure: '${r.figure}', scale: { column: '${c}' } }])`);
      }
      covered.add(c);
    }
  }
  for (const [k, c] of Object.entries(def.columns)) {
    if (c.show !== false && !covered.has(k)) fail('table-header', `column ${k}`, 'students can\'t see this column: there is no table, and no figure in tableless.readFrom shows it (or set show: false)');
  }
}

// ---------- T8: reading an instrument scale ----------
// The scale's labels must be evenly spaced; its smallest division at least SCALE_MIN_DIVISION units wide (about 4 px on a
// 375 px phone); every row of the column has a mark that reads back to its value within half a division; marks less than
// one division apart are reported (students can't tell them apart); and the column's uncertainty can't be smaller than
// half a division (nobody reads a scale better than that).
export const SCALE_MIN_DIVISION = 6;
function checkScale(fig, spec, def, d, rows, fail, warn) {
  const where = `figure ${fig.figure}`;
  const c = def.columns[spec.column];
  if (!c) { fail('scale-read', where, `the scale check names an unknown column ${spec.column}`); return; }
  const labels = [...fig.svg.matchAll(/<text class="sx" x="([-\d.]+)"[^>]*>([^<]+)<\/text>/g)].map((m) => ({ px: +m[1], v: parseNum(m[2]) }));
  const S = scaleFromTicks(labels);
  if (!S) { fail('scale-read', where, 'the scale has no readable labels'); return; }
  if (!S.even) fail('scale-read', where, 'the scale labels are not evenly spaced');
  const minors = [...new Set([...fig.svg.matchAll(/<line class="[^"]*\bscale-minor" x1="([-\d.]+)"/g)].map((m) => +m[1]))].sort((a, b) => a - b);
  if (minors.length < 2) { fail('scale-read', where, 'the scale has no smallest divisions'); return; }
  const divPx = Math.min(...minors.slice(1).map((x, i) => x - minors[i]));
  const div = divPx * S.perPx;
  if (divPx < SCALE_MIN_DIVISION - 1e-9) fail('scale-read', where, `the smallest division is ${divPx.toFixed(1)} units wide, too small to read on a phone (needs ${SCALE_MIN_DIVISION})`);
  const marks = [...fig.svg.matchAll(/<line class="[^"]*\bscale-mark" data-mark="(\d+)" x1="([-\d.]+)"/g)].map((m) => ({ row: +m[1], px: +m[2] }));
  const want = spec.rows || rows.map((_, i) => i);
  for (const i of want) {
    const m = marks.find((x) => x.row === i);
    if (!m) { fail('scale-read', where, `no mark for row ${i + 1}`); continue; }
    const v = S.toValue(m.px);
    if (Math.abs(v - rows[i][spec.column]) > div / 2 + 0.6 * S.perPx) fail('scale-read', `${where}, mark ${i + 1}`, 'the mark doesn\'t read as the value in the data (to half a division)', { expected: sigFig(rows[i][spec.column], 4), got: sigFig(v, 4) });
    const u = d.unc(spec.column, i);
    if (!(u >= div / 2 - 1e-9)) fail('uncertainty', `${where}, mark ${i + 1}`, `the uncertainty (${u}) is smaller than half a division (${sigFig(div / 2, 2)}): nobody reads this scale that precisely`);
  }
  const xs = marks.map((m) => m.px).sort((a, b) => a - b);
  if (xs.some((x, i) => i && x - xs[i - 1] < divPx)) warn('scale-read', where, 'two marks are less than one division apart: students may not be able to tell them apart');
}

// ---------- T7: area under a graph ----------
// A result with check: 'area' and area: { from, to, baseline } is the area between the data and the baseline (a number,
// or a function of d), from x = from to x = to: ∫ (y − baseline) dx, worked out here by the trapezium rule on the
// published data. Accepted-range policy (adopted by the teacher on 8 October 2026, specification decision 12): the range must contain
//   • the value ± AREA_POLICY.minTol (5 %): students' estimates by counting squares or by shapes vary at least this much;
//   • the "count the squares" estimate on the students' own graph (whole small squares + half of the part squares);
// and must be no wider than ± AREA_POLICY.maxTol (20 %) of the value, so it still discriminates.
export const AREA_POLICY = { minTol: 0.05, maxTol: 0.2 };
function interpolator(rows, gx, gy) {
  const s = [...rows].sort((a, b) => a[gx] - b[gx]);
  return (xv) => {
    const j = s.findIndex((rw) => rw[gx] >= xv);
    if (j < 0) return s[s.length - 1][gy];
    if (j === 0) return s[0][gy];
    const [a, b] = [s[j - 1], s[j]];
    return a[gy] + ((b[gy] - a[gy]) * (xv - a[gx])) / (b[gx] - a[gx]);
  };
}
export function areaUnder(rows, gx, gy, from, to, base) {
  const f = interpolator(rows, gx, gy);
  const xs = [from, ...rows.map((rw) => rw[gx]).filter((x) => x > from && x < to).sort((a, b) => a - b), to];
  let A = 0;
  for (let i = 1; i < xs.length; i++) A += ((f(xs[i - 1]) - base + f(xs[i]) - base) / 2) * (xs[i] - xs[i - 1]);
  return A;
}
export function squaresEstimate(rows, gx, gy, from, to, base, dx, dy) {
  const f = interpolator(rows, gx, gy);
  let est = 0;
  for (let x0 = from; x0 < to - 1e-12; x0 += dx) {
    const x1 = Math.min(x0 + dx, to);
    const vals = Array.from({ length: 21 }, (_, k) => f(x0 + ((x1 - x0) * k) / 20) - base);
    const [mn, mx] = [Math.min(...vals), Math.max(...vals)];
    const w = (x1 - x0) / dx;
    if (mn >= 0) { const full = Math.floor(mn / dy); est += w * (full + (Math.ceil(mx / dy) - full) / 2); }
    else if (mx <= 0) { const full = Math.floor(-mx / dy); est -= w * (full + (Math.ceil(-mn / dy) - full) / 2); }
    else est += (w * (Math.ceil(mx / dy) - Math.ceil(-mn / dy))) / 2;
  }
  return est * dx * dy;
}
function checkAreaResult(def, d, rows, res, r, where, q, fail) {
  const g = def.graph;
  const a = res.area || {};
  if (!g || !Number.isFinite(a.from) || !Number.isFinite(a.to) || !(a.to > a.from)) { fail('fit', where, 'an area result needs a graph and area: { from, to, baseline } with to > from'); return; }
  const xsAll = rows.map((rw) => rw[g.x]);
  if (a.from < Math.min(...xsAll) || a.to > Math.max(...xsAll)) { fail('fit', where, 'the area runs beyond the data'); return; }
  const base = typeof a.baseline === 'function' ? a.baseline(d) : a.baseline || 0;
  const A = areaUnder(rows, g.x, g.y, a.from, a.to, base);
  if (Math.abs(r.value - A) > 1e-6 * Math.max(Math.abs(A), 1e-12)) fail('fit', where, 'the area doesn\'t match the area under the published data (trapezium rule)', { expected: sigFig(A, 4), got: sigFig(r.value, 4) });
  const student = (q.data || []).find((x) => x.figure === 'graph');
  const info = student && axisInfo(student.svg);
  const S = info && info.xMinor && info.yMinor ? squaresEstimate(rows, g.x, g.y, a.from, a.to, base, info.xMinor, info.yMinor) : null;
  if (!r.range) { fail('answer-range', where, 'an area read from a graph needs an accepted range'); return; }
  const [lo, hi] = r.range;
  const need = [A - AREA_POLICY.minTol * Math.abs(A), A + AREA_POLICY.minTol * Math.abs(A)];
  if (lo > need[0] + 1e-12 || hi < need[1] - 1e-12) fail('answer-range', where, `the accepted range must include ±${AREA_POLICY.minTol * 100} % of the area (students' estimates vary at least that much)`, { expected: `${sigFig(need[0], 3)} to ${sigFig(need[1], 3)}`, got: `${sigFig(lo, 3)} to ${sigFig(hi, 3)}` });
  if (S !== null && (S < lo || S > hi)) fail('answer-range', where, 'the accepted range excludes the count-the-squares estimate on the students\' graph', { expected: `includes ${sigFig(S, 3)}`, got: `${sigFig(lo, 3)} to ${sigFig(hi, 3)}` });
  if (lo < A - AREA_POLICY.maxTol * Math.abs(A) || hi > A + AREA_POLICY.maxTol * Math.abs(A)) fail('answer-range', where, `the accepted range is wider than ±${AREA_POLICY.maxTol * 100} % of the area, so it doesn't discriminate`);
}

// ---------- T2: too-regular data (safeguards.mjs) ----------
function checkRegularity(def, rows, cells, p, singles, fail, warn) {
  const setKey = Object.keys(def.columns).find((k) => def.columns[k].kind === 'set');
  for (const [k, c] of Object.entries(def.columns)) {
    if (c.kind !== 'measured' || c.show === false) continue;
    const where = `column ${c.symbolText || c.symbol}`;
    const acc = c.regularity;
    if (acc && (!Array.isArray(acc.accept) || !acc.accept.length || typeof acc.reason !== 'string' || !acc.reason.trim())) {
      fail('regular-data', where, 'regularity needs accept: [the finding codes] and a reason (why the instrument genuinely reads this way)');
      continue;
    }
    const idx = rows.map((_, i) => i).filter((i) => !(c.anomaly && c.anomaly.row === i));
    const models = idx.map((i) => applySystematic(c.systematic, modelValue(def, c, { params: p, row: rows[i], singles }, `column ${k}`), rows[i]));
    const sigmas = models.map((m) => {
      const nz = c.noise || {};
      const s = nz.type === 'gauss' ? nz.sd : nz.type === 'gauss-relative' ? nz.sd * Math.abs(m) : nz.type === 'poisson' ? Math.sqrt(Math.max(m, 0)) : 0;
      return c.trials ? s / Math.sqrt(c.trials) : s;
    });
    const findings = regularityFindings({
      values: idx.map((i) => rows[i][k]),
      texts: idx.map((i) => (cells.get(`${k}|${i}|`) || {}).text || fmtNum(rows[i][k], columnDp(c))),
      xs: idx.map((i) => rows[i][setKey]),
      models, sigmas, resolution: c.resolution,
    });
    for (const f of findings) {
      if (acc && acc.accept.includes(f.code)) continue;
      warn('regular-data', where, `${f.message}. If the instrument genuinely reads this way, declare columns.${k}.regularity = { accept: ['${f.code}'], reason: '…' } (the dataset is then AMBER, so a person agrees)`);
    }
  }
}

// ---------- T3: values read from a graph (safeguards.mjs) ----------
const graphFigs = (q) => [...(q.data || []).filter((x) => x.kind === 'figure'), ...(q.parts || []).flatMap((pt) => [pt.figure, pt.msFigure].filter((f) => f && typeof f === 'object'))];
function axisInfo(svg) {
  const G = parseGraph(svg);
  const X = scaleFromTicks(G.xTicks);
  const Y = scaleFromTicks(G.yTicks);
  const minor = (pos, S) => {
    const u = [...new Set(pos)].sort((a, b) => a - b);
    return u.length > 1 && S ? (u[1] - u[0]) * S.perPx : null;
  };
  return { ...axisRanges(G), xMinor: minor(G.minorX, X), yMinor: minor(G.minorY, Y) };
}
function checkGraphReads(def, q, meta, fail, warn) {
  const figs = graphFigs(q);
  const graphNamed = (n) => figs.find((f) => f.figure === n && /data-graph=/.test(f.svg || ''));
  for (const m of meta) {
    const pt = (q.parts || []).find((x) => x.label === m.label);
    if (!pt) continue;
    const where = `part (${m.label})`;
    const text = stripTags(`${pt.question} ${(pt.markscheme || []).join(' ')}`);
    if (!m.reads) {
      if ((def.graph || def.rawGraph) && READ_PHRASES.test(text)) {
        warn('graph-read-undeclared', where, `the wording ("${text.match(READ_PHRASES)[0]}") says students read a value from a graph, but the part declares no reads: [{ figure, x | y }], so the value can't be checked against the axes`);
      }
      continue;
    }
    for (const r of m.reads) {
      const name = r.figure || 'graph';
      const f = graphNamed(name);
      if (!f) { fail('graph-read', where, `reads from a graph called "${name}", which the question doesn't show`); continue; }
      const A = axisInfo(f.svg);
      for (const ax of ['x', 'y']) {
        if (r[ax] === undefined) continue;
        const range = A[ax];
        if (!range) { fail('graph-read', where, `${name} has no readable ${ax} axis`); continue; }
        const pad = 1e-9 * Math.max(1, Math.abs(range[1] - range[0]));
        if (!(r[ax] >= range[0] - pad && r[ax] <= range[1] + pad)) {
          fail('graph-read', where, `students must read ${ax} = ${sigFig(r[ax], 3)} from ${name}, but its ${ax} axis only runs from ${range[0]} to ${range[1]}: the value can't be read from the graph`);
        }
        const minor = A[`${ax}Minor`];
        if (r.tol !== undefined && minor && r.tol < minor / 2 - 1e-12) {
          warn('graph-read', where, `accepts readings of ${ax} within ±${sigFig(r.tol, 2)}, less than half a small grid square (${sigFig(minor / 2, 2)}) on ${name}: students can't read it that precisely`);
        }
      }
    }
  }
  // P1: with errorBars 'too-small' no bars are drawn, so no question or mark scheme may refer to them.
  // errorBars 'none': the uncertainty is not part of this question, so no question or mark scheme may use it.
  if ([def.graph, def.rawGraph].some((g) => g && g.errorBars === 'none')) {
    const texts = [['the question text', q.stem], ...(q.parts || []).flatMap((pt) => [[`part (${pt.label}) question`, pt.question], [`part (${pt.label}) mark scheme`, (pt.markscheme || []).join(' ')]])];
    for (const [where, t] of texts) {
      if (/error[- ]bars?|uncertaint|±|\pm/i.test(stripTags(t))) fail('graph-errorbar-text', where, 'mentions an uncertainty or error bars, but the graph declares errorBars: "none" (no part uses the uncertainty): use "too-small" or draw the bars instead');
    }
  }
  if ([def.graph, def.rawGraph].some((g) => g && g.errorBars === 'too-small')) {
    const texts = [['the question text', q.stem], ...(q.parts || []).flatMap((pt) => [[`part (${pt.label}) question`, pt.question], [`part (${pt.label}) mark scheme`, (pt.markscheme || []).join(' ')]])];
    for (const [where, t] of texts) {
      if (/error[- ]bars?/i.test(stripTags(t))) fail('graph-errorbar-text', where, 'refers to error bars, but the graph draws none (errorBars: "too-small"): refer to the uncertainty instead');
    }
  }
}

// ---------- T4: giveaways (safeguards.mjs) ----------
function checkGiveaways(def, q, meta, d, fail, warn) {
  const figText = (svg) => [...String(svg).matchAll(/<text (?![^>]*class="t[xy]")[^>]*>(.*?)<\/text>/g)].map((m) => stripTags(m[1])).join(' ');
  const seq = visibleSequence(q, figText);
  const tableNums = new Set((q.data || []).filter((x) => x.kind === 'table').flatMap((t) => numbersIn(t.html.replace(/<[^>]+>/g, ' ')).map((n) => n.tok)));
  const qIndex = (label) => seq.findIndex((s) => s.part === label && s.kind === 'question');
  // Numbers: the value of every result, before the part whose mark scheme first establishes it.
  if (d) {
    for (const [name, r] of Object.entries(d.r)) {
      for (const tok of valueTokens(r.value, numbersIn)) {
        if (tableNums.has(tok)) continue;
        const a = seq.findIndex((s, i) => s.kind === 'ms' && hasToken(s.text, tok, numbersIn) && !hasToken(seq[i - 1].text, tok, numbersIn));
        if (a < 0) continue;
        const early = seq.slice(0, a - 1).find((s) => hasToken(s.text, tok, numbersIn));
        if (early) fail('giveaway', early.where, `shows ${tok}, the value of ${name} that part (${seq[a].part}) asks students to find: it is visible before that part`);
      }
    }
  }
  for (const m of meta) {
    const i = qIndex(m.label);
    if (i < 0) continue;
    const where = `part (${m.label})`;
    const asks = m.asks || {};
    const before = seq.slice(0, i);
    const res = asks.unit !== undefined && (def.results || {})[asks.unit];
    if (res && res.unit) {
      const u = parseUnit(res.unit);
      const forms = [u.tex, parseUnit(baseUnitExpr(u.dim)).tex].filter(Boolean);
      for (const s of before) if (forms.some((t) => s.text.includes(t))) fail('giveaway', s.where, `gives the unit that ${where} asks for (${forms.join(' or ')})`);
    }
    for (const t of asks.answerText || []) {
      for (const s of [...before, seq[i]]) if (stripTags(s.text).includes(t)) fail('giveaway', s.where, `shows "${t}", which ${where} asks students to work out`);
    }
    for (const t of asks.conclusion || []) {
      for (const s of before) if (stripTags(s.text).toLowerCase().includes(t.toLowerCase())) fail('giveaway', s.where, `states the conclusion "${t}" that ${where} asks students to reach`);
    }
    const pt = (q.parts || []).find((x) => x.label === m.label);
    if (pt && /\bwhether\b/i.test(stripTags(pt.question)) && !asks.conclusion) {
      warn('giveaway-undeclared', where, 'asks "whether …" but declares no asks.conclusion: [phrases], so an earlier statement of the conclusion can\'t be checked');
    }
  }
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
    if (!Array.isArray(c.expect) || c.expect.length !== 2) bad('physics-meta', `${where}.expect`, 'give the expected range of values');
    if (c.observed !== undefined) {
      // Phase 12: observed published values that the question compares with a model, without expecting agreement.
      // They need a reason, no model of their own, and their source checked against a stored copy (provenance, T10).
      if (!c.observed || !isText(c.observed.reason)) bad('physics-meta', `${where}.observed`, 'say why these published values are not expected to follow a model (observed: { reason })');
      if (c.model || c.agree !== undefined) bad('physics-meta', `${where}.observed`, 'an observed column has no model or agreement tolerance: the question compares it with a model elsewhere');
      if (!(def.provenance && def.provenance.fields && def.provenance.fields[k2])) bad('physics-meta', `${where}.observed`, 'observed published values need provenance.fields (and a stored source copy), because no model checks them');
    } else {
      if (!c.model || !c.model.law) bad('physics-meta', `${where}.model`, 'published data must be compared with a model built from a vetted law (or declared observed: { reason })');
      if (!(c.agree > 0 && c.agree <= 0.05)) bad('physics-meta', `${where}.agree`, 'state how closely the published values should follow the model (0 < agree <= 0.05)');
      if (!isText(c.agreeReason)) bad('physics-meta', `${where}.agreeReason`, 'explain why the published values may differ from the simple model');
    }
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
    model: ((svg.match(/data-model="curve" points="([^"]*)"/) || [])[1] || '').split(' ').filter(Boolean).map((s) => s.split(',').map(Number)),
    trace: ((m) => (m ? { pts: m[1].split(' ').filter(Boolean).map((s) => s.split(',').map(Number)), rows: m[2].split(' ').map(Number) } : null))(
      svg.match(/<polyline class="[^"]*\btrace" data-trace="1" points="([^"]*)" data-rows="([^"]*)"\/>/)),
    area: ((m) => (m ? m[1].split(' ').filter(Boolean).map((s) => s.split(',').map(Number)) : null))(svg.match(/<polygon class="area" data-area="1" points="([^"]*)"\/>/)),
    refs: [...svg.matchAll(/<line class="[^"]*\bref" data-ref="1" x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"\/>/g)]
      .map((m) => ({ x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4] })),
    xTitle: title('ax-x'), yTitle: title('ax-y'),
    minorX: [...svg.matchAll(/<line class="grid-minor" x1="([-\d.]+)" y1="[-\d.]+" x2="\1"/g)].map((m) => +m[1]),
    minorY: [...svg.matchAll(/<line class="grid-minor" x1="[-\d.]+" y1="([-\d.]+)" x2="[-\d.]+" y2="\1"/g)].map((m) => +m[1]),
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

function checkGraph(fig, def, d, rows, fail, warn) {
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
  const fmt = (v, c) => `${sigFig(v, 4)} ${parseUnit(c.unit || '').text}`.trim();
  // T7: sensor data drawn as a trace: every reading is a vertex of one line, in order of x, and nothing else is drawn.
  if (g.style === 'trace') {
    if (G.points.length) fail('graph-point', where, 'a trace shows its readings as a line, not as points');
    if ((g.omit || []).length) fail('graph-point', where, 'a trace can\'t leave readings for students to plot');
    if (g.errorBars !== 'too-small' && rows.some((_, i) => d.unc(g.y, i))) fail('graph-errorbar', where, 'a trace draws no error bars: declare errorBars "too-small" (the caption states the uncertainty) or give the column no uncertainty');
    if (!G.trace) fail('graph-point', where, 'the sensor trace is missing');
    else {
      if (G.trace.rows.length !== rows.length || new Set(G.trace.rows).size !== rows.length) fail('graph-point', where, `the trace has ${G.trace.rows.length} readings, but the data have ${rows.length}`);
      G.trace.pts.forEach(([px, py], j) => {
        const row = rows[G.trace.rows[j]];
        if (!row) return;
        if (Math.abs(X.toValue(px) - row[g.x]) > 0.6 * X.perPx || Math.abs(Y.toValue(py) - row[g.y]) > 0.6 * Y.perPx) {
          fail('graph-point', `${where}, reading ${G.trace.rows[j] + 1}`, 'the trace is not where the data say', { expected: `(${fmt(row[g.x], cx)}, ${fmt(row[g.y], cy)})`, got: `(${fmt(X.toValue(px), cx)}, ${fmt(Y.toValue(py), cy)})` });
        }
        if (!inBox(px, py)) fail('graph-scale', `${where}, reading ${G.trace.rows[j] + 1}`, 'the trace runs outside the axes');
      });
      const xs = G.trace.pts.map((p) => p[0]);
      if (xs.some((x, j) => j && x < xs[j - 1])) fail('graph-point', where, 'the trace must run in order of increasing x');
    }
  }
  // T7: a shaded area on the examiner's graph covers exactly the declared x range.
  if (kind === 'examiner' && !raw && g.shade) {
    if (!G.area) fail('graph-fit', where, 'the shaded area is missing');
    else {
      const ax = G.area.map((p) => X.toValue(p[0]));
      if (Math.abs(Math.min(...ax) - g.shade.from) > X.perPx || Math.abs(Math.max(...ax) - g.shade.to) > X.perPx) fail('graph-fit', where, `the shaded area should run from ${g.shade.from} to ${g.shade.to}`);
      if (!g.shade.label) fail('graph-fit', where, 'a shaded area needs a label (what it represents, for the caption)');
    }
  } else if (G.area && !(kind === 'examiner' && g.shade)) fail('graph-fit', where, kind === 'student' ? 'the students\' graph shouldn\'t show the shaded area (it is the answer)' : 'shows a shaded area the dataset doesn\'t declare');
  const got = G.points.map((pt) => pt.row);
  if (g.style !== 'trace') {
    for (const i of want) if (!got.includes(i)) fail('graph-point', where, `the point for table row ${i + 1} is missing`);
    for (const i of got) if (!want.includes(i)) fail('graph-point', where, `the graph shows table row ${i + 1}, which should be left for students to plot`);
  }
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
  // Points left for students to plot must fit on the students' axes (T3).
  if (kind === 'student' && !raw) {
    for (const i of g.omit || []) {
      const [vx, vy] = [rows[i][g.x], rows[i][g.y]];
      const [x0, x1] = [X.toValue(G.box.l), X.toValue(G.box.r)].sort((a, b) => a - b);
      const [y0, y1] = [Y.toValue(G.box.b), Y.toValue(G.box.t)].sort((a, b) => a - b);
      if (vx < x0 || vx > x1 || vy < y0 || vy > y1) fail('graph-read', `${where}, row ${i + 1}`, 'students must plot this point, but it lies outside the axes');
    }
  }
  // P1: y error bars only; bars that can't be seen; errorBars 'too-small' (safeguards.mjs).
  const hidden = g.errorBars === 'too-small' || g.errorBars === 'none';
  if (g.errorBars !== undefined && !hidden) fail('graph-errorbar', where, `errorBars must be 'too-small', 'none' or left out, not ${JSON.stringify(g.errorBars)}`);
  // y error bars only are DRAWN. xErrorBars may still put the x uncertainty into the max/min lines when no bars are drawn.
  if (g.xErrorBars && !hidden && !X_ERROR_BARS_ALLOWED.has(def.id)) fail('graph-x-errorbars', where, 'this bank draws y error bars only: leave out xErrorBars (state the uncertainty in x in the table heading), or use it only with errorBars: "too-small" so the x uncertainty counts in the max/min lines without being drawn');
  if (kind === 'student') {
    const halves = want.map((i) => (d.unc(g.y, i) || 0) / Y.perPx).filter((h) => h > 0);
    const longest = halves.length ? Math.max(...halves) : 0;
    if (g.errorBars === 'too-small' && longest >= VISIBLE_BAR) fail('graph-errorbar-hidden', where, `errorBars is 'too-small', but the bars would be up to ${longest.toFixed(1)} units long, long enough to see: draw them`);
    if (!hidden && halves.length && longest < VISIBLE_BAR) {
      warn('graph-errorbar-visibility', where, `every y error bar is at most ${longest.toFixed(1)} units each side of its point, hidden under the ${MARKER_R}-unit marker (needs ${VISIBLE_BAR}): students can't see or use them. Declare ${raw ? 'rawGraph' : 'graph'}.errorBars: 'too-small' (the caption then states the uncertainty) and don't refer to error bars in the parts`);
    }
  }
  // Error bars: one per point where there is an uncertainty (unless too small to draw), each the right length.
  for (const i of want) {
    for (const axis of ['y', 'x']) {
      const u = hidden ? 0 : axis === 'y' ? d.unc(g.y, i) || 0 : (g.xErrorBars && d.unc(g.x, i)) || 0;
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
    const showBand = d.band && g.errorBars !== 'none';
    const lines = { best: d.fit, max: showBand && d.band.steep, min: showBand && d.band.shallow };
    if (!showBand && G.fits.some((f) => f.fit !== 'best')) fail('graph-fit', where, 'shows steepest and shallowest lines, but no part uses the uncertainty (errorBars: "none")');
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
  // T6: a model curve (examiner's graph only) and a declared reference line (both graphs).
  if (kind === 'student' && G.model.length) fail('graph-fit', where, 'the students\' graph shouldn\'t show the model curve');
  if (kind === 'examiner' && !raw && g.modelCurve) {
    if (!g.modelCurveLabel) fail('graph-fit', where, 'a model curve needs modelCurveLabel (what it shows, for the caption)');
    if (!G.model.length) fail('graph-fit', where, 'the model curve is missing');
    const f = g.modelCurve(d);
    for (const [px, py] of G.model) {
      if (Math.abs(Y.toValue(py) - f(X.toValue(px))) > 1.0 * Y.perPx) { fail('graph-fit', where, 'the drawn model curve isn\'t the declared model'); break; }
    }
  }
  const ref = g.referenceLine ? (typeof g.referenceLine === 'function' ? g.referenceLine(d) : g.referenceLine) : null;
  if (!ref && G.refs.length) fail('graph-fit', where, 'shows a reference line the dataset doesn\'t declare');
  if (ref) {
    if (!ref.label || !Number.isFinite(ref.m) || !Number.isFinite(ref.c)) fail('graph-fit', where, 'referenceLine needs m, c and a label');
    else if (G.refs.length !== 1) fail('graph-fit', where, `should show the reference line (${ref.label}) once, but shows ${G.refs.length}`);
    else {
      const L = G.refs[0];
      for (const [px, py] of [[L.x1, L.y1], [L.x2, L.y2]]) {
        if (Math.abs(Y.toValue(py) - (ref.m * X.toValue(px) + ref.c)) > 1.0 * Y.perPx) { fail('graph-fit', where, 'the drawn reference line isn\'t the declared line'); break; }
      }
      // A reference line must not be (close to) the line of best fit: that would draw the answer on the students' graph.
      const ySpan = Math.abs(Y.toValue(G.box.t) - Y.toValue(G.box.b));
      if (kind === 'student' && d.fit && g.fit === 'linear' && rel(ref.m, d.fit.m) < 0.05 && Math.abs(ref.c - d.fit.c) < 0.05 * ySpan) {
        fail('graph-fit', where, 'the reference line is almost the line of best fit, so it gives the answer away');
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
