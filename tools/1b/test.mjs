// Tests for the Paper 1B generator and validator. Run: node tools/1b/test.mjs
// (tools/check.mjs runs them too.) Each test either passes silently or adds a failure message.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  makeRng, decimalsOf, roundTo, fmtNum, sigFig, parseNum, sigFigsIn, parseUnit, sameDim, linearFit, gradientBand, cross, toSI, fromSI,
} from './lib.mjs';
import { renderGraph, niceScale } from './graph.mjs';
import { buildQuestion, generateRows, evalModel } from './generate.mjs';
import { LAWS } from './laws.mjs';
import { propagate } from './uncertainty.mjs';
import { applySystematic, checkSystematic } from './systematic.mjs';
import { independentAudit } from './independent.mjs';
import { validateDataset, parseGraph, scaleFromTicks, numbersIn } from './validate.mjs';
import { buildAll, loadDatasets, loadTopics } from './build.mjs';
import broken from './fixtures/broken.mjs';
import { canonicalContent, fingerprintOf } from './fingerprint.mjs';

export async function runTests() {
  const failures = [];
  let count = 0;
  const check = (name, ok, detail = '') => { count++; if (!ok) failures.push(`${name}${detail ? ': ' + detail : ''}`); };
  const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

  // ----- Random numbers: repeatable, and the right shape -----
  const seq = (seed) => { const r = makeRng(seed); return Array.from({ length: 5 }, r.uniform); };
  check('same seed gives the same numbers', JSON.stringify(seq(42)) === JSON.stringify(seq(42)));
  check('different seeds give different numbers', JSON.stringify(seq(42)) !== JSON.stringify(seq(43)));
  {
    const r = makeRng(1);
    const g = Array.from({ length: 20000 }, r.gauss);
    const m = g.reduce((s, x) => s + x, 0) / g.length;
    const sd = Math.sqrt(g.reduce((s, x) => s + (x - m) ** 2, 0) / g.length);
    check('normal noise has mean 0 and sd 1', Math.abs(m) < 0.03 && Math.abs(sd - 1) < 0.03, `mean ${m}, sd ${sd}`);
    const p = Array.from({ length: 20000 }, () => r.poisson(30));
    const pm = p.reduce((s, x) => s + x, 0) / p.length;
    const pv = p.reduce((s, x) => s + (x - pm) ** 2, 0) / p.length;
    check('Poisson counts have mean ≈ variance', Math.abs(pm - 30) < 0.3 && Math.abs(pv - 30) < 1.5, `mean ${pm}, variance ${pv}`);
  }

  // ----- Rounding and significant figures -----
  check('decimalsOf', decimalsOf(0.01) === 2 && decimalsOf(0.5) === 1 && decimalsOf(10) === 0 && decimalsOf(1e-4) === 4);
  check('roundTo resolution', roundTo(1.23456, 0.01) === 1.23 && roundTo(7.4, 0.5) === 7.5 && roundTo(149, 10) === 150);
  check('fmtNum never shows −0', fmtNum(-0.001, 2) === '0.00' && fmtNum(-1.5, 1) === '−1.5');
  check('sigFig', sigFig(0.06372, 2) === '0.064' && sigFig(1234, 2) === '1200' && sigFig(9.96, 2) === '10' && sigFig(77.38, 3) === '77.4');
  check('parseNum reads the minus sign', parseNum('−1.25') === -1.25 && Number.isNaN(parseNum('1.2.3')));
  check('sigFigsIn', sigFigsIn('0.010') === 2 && sigFigsIn('0.4') === 1 && sigFigsIn('2.2') === 2 && sigFigsIn('300') === 1);

  // ----- Units -----
  check('V/A has the dimensions of Ω', sameDim(parseUnit('V A^-1').dim, parseUnit('Ω').dim));
  check('g A^-1 × m s^-2 m^-1 = T', sameDim(parseUnit('g A^-1 m s^-2 m^-1').dim, parseUnit('T').dim));
  check('mN is 10⁻³ N', near(parseUnit('mN').scale, 1e-3));
  check('unit text and MathJax', parseUnit('g A^-1').text === 'g A⁻¹' && parseUnit('s^-1').tex === '$\\text{s}^{-1}$');
  let threw = false;
  try { parseUnit('furlong'); } catch (e) { threw = true; }
  check('unknown units are rejected', threw);

  // ----- Fits -----
  {
    const f = linearFit([1, 2, 3, 4], [2.1, 3.9, 6.2, 7.8]);
    check('least-squares fit (worked by hand: m = 1.94, c = 0.15)', near(f.m, 1.94) && near(f.c, 0.15), `m ${f.m}, c ${f.c}`);
    const exact = linearFit([0, 1, 2], [1, 3, 5]);
    check('exact line gives r² = 1', near(exact.m, 2) && near(exact.c, 1) && near(exact.r2, 1));
    const b = gradientBand([{ x: 0, y: 0, ey: 0.1 }, { x: 1, y: 1, ey: 0.1 }, { x: 2, y: 2, ey: 0.1 }]);
    check('max/min gradient lines (1.1 and 0.9 by hand)', b && near(b.mMax, 1.1) && near(b.mMin, 0.9), JSON.stringify(b));
    check('intercept range (±0.1 by hand)', b && near(b.cMax, 0.1) && near(b.cMin, -0.1));
    check('no line through impossible error bars', gradientBand([{ x: 0, y: 0, ey: 0.01 }, { x: 1, y: 1, ey: 0.01 }, { x: 2, y: 0, ey: 0.01 }]) === null);
    check('cross product: z × x = y', JSON.stringify(cross([0, 0, 1], [1, 0, 0])) === JSON.stringify([0, 1, 0]));
  }

  // ----- Vetted physics laws: reference values, limiting cases, dimensional consistency -----
  for (const [name, law] of Object.entries(LAWS)) {
    const f = (inputs) => law.f({ ...(law.defaults || {}), ...inputs });
    for (const ref of law.reference) {
      check(`law ${name}: reference value (${ref.note})`, near(f(ref.inputs), ref.output, 1e-9), `got ${f(ref.inputs)}`);
    }
    for (const lim of law.limits) {
      const ok = lim.check ? lim.check(f) : Math.abs(f(lim.inputs) - lim.output) <= 1e-9 * Math.max(1, Math.abs(lim.output));
      check(`law ${name}: limiting case "${lim.name}"`, ok);
    }
    // Dimensional consistency: changing the size of each base unit (m, kg, s, A, K) by a factor k
    // multiplies every input by k^(its power of that unit); the output must scale by k^(its own power).
    const base = law.reference[0].inputs;
    const outDim = parseUnit(law.output).dim;
    for (let i = 0; i < 5; i++) {
      const k = 3;
      const scaled = Object.fromEntries(Object.entries({ ...(law.defaults || {}), ...base }).map(([key, v]) => [key, v * k ** parseUnit(law.inputs[key]).dim[i]]));
      const want = f(base) * k ** outDim[i];
      check(`law ${name}: dimensionally consistent in ${['length', 'mass', 'time', 'current', 'temperature'][i]}`, near(f(scaled), want, 1e-9), `got ${f(scaled)}, expected ${want}`);
    }
  }
  {
    // The unit-checked model evaluator: units convert automatically, and wrong units are refused.
    const def = { physics: { params: { B: { value: 64, unit: 'mT' }, L: { value: 5, unit: 'cm' }, I: { value: 2, unit: 'A' } } }, columns: {}, singles: {} };
    const env = { def, params: { B: 64, L: 5, I: 2 }, row: {}, singles: {} };
    const F = evalModel({ law: 'force-on-wire', inputs: { B: 'p.B', I: 'p.I', L: 'p.L' } }, env, 'test');
    check('model evaluator converts mT and cm to SI', near(F.si, 0.064 * 2 * 0.05), `got ${F.si}`);
    let code = null;
    try { evalModel({ law: 'force-on-wire', inputs: { B: 'p.I', I: 'p.B', L: 'p.L' } }, env, 'test'); } catch (e) { code = e.code; }
    check('model evaluator refuses a current where a field is needed', code === 'physics-units', `got ${code}`);
    code = null;
    try { evalModel({ law: 'made-up-law', inputs: {} }, env, 'test'); } catch (e) { code = e.code; }
    check('model evaluator refuses a law that is not in laws.mjs', code === 'physics-meta', `got ${code}`);
  }

  // ----- Uncertainty propagation (IB worst-case sums), checked against hand-worked values -----
  {
    const P = (spec, y, vals) => propagate(spec, y, (t) => vals[t.of], {});
    check('difference: (5 ± 0.1) − (3 ± 0.2) has uncertainty 0.3', near(P({ form: 'sum', terms: [{ of: 'a', coef: 1 }, { of: 'b', coef: -1 }] }, 2, { a: { value: 5, unc: 0.1 }, b: { value: 3, unc: 0.2 } }), 0.3));
    check('product: (2 ± 5 %) × (4 ± 5 %) = 8 ± 0.8', near(P({ form: 'product', terms: [{ of: 'a', n: 1 }, { of: 'b', n: 1 }] }, 8, { a: { value: 2, unc: 0.1 }, b: { value: 4, unc: 0.2 } }), 0.8));
    check('quotient: (2 ± 5 %) ÷ (4 ± 5 %) = 0.5 ± 0.05', near(P({ form: 'product', terms: [{ of: 'a', n: 1 }, { of: 'b', n: -1 }] }, 0.5, { a: { value: 2, unc: 0.1 }, b: { value: 4, unc: 0.2 } }), 0.05));
    check('power: (3 ± 0.1)² = 9 ± 0.6', near(P({ form: 'product', terms: [{ of: 'x', n: 2 }] }, 9, { x: { value: 3, unc: 0.1 } }), 0.6));
    check('reciprocal: 1/(0.5 ± 0.002) = 2 ± 0.008', near(P({ form: 'product', terms: [{ of: 'x', n: -1 }] }, 2, { x: { value: 0.5, unc: 0.002 } }), 0.008));
    check('square root: √(4 ± 0.4) = 2 ± 0.1', near(P({ form: 'product', terms: [{ of: 'x', n: 0.5 }] }, 2, { x: { value: 4, unc: 0.4 } }), 0.1));
    check('a sum with a coefficient: (N ± √N)/10 for N = 100 gives ± 1', near(P({ form: 'sum', terms: [{ of: 'N', coef: 0.1 }] }, 10, { N: { value: 100, unc: 10 } }), 1));
  }

  // ----- Finding the numbers in text -----
  {
    const toks = (s) => numbersIn(s).map((n) => n.tok).join(' ');
    check('numbers are found in prose and MathJax', toks('The mean is $0.919\\ \\text{m}$ at h = 0.700 m.') === '0.919 0.700');
    check('exponents, subscripts and ½ are not numbers', toks('$\\text{m s}^{-1}$, $f_3$, $\\tfrac12$, s⁻¹, 10^{-3}') === '10', toks('$\\text{m s}^{-1}$, $f_3$, $\\tfrac12$, s⁻¹, 10^{-3}'));
    check('labels like D3-B01 are not numbers', toks('Dataset D3-B01, part (b)') === '');
    check('a minus sign is read as part of the number', toks('a change of −0.25 V') === '0.25');
  }

  // ----- Systematic effects (deterministic, physically justified) -----
  {
    const row = { t: 60 };
    const off = { type: 'zero-offset', offset: 0.03, cause: 'c', justification: 'j' };
    const cal = { type: 'calibration', factor: 1.02, cause: 'c', justification: 'j' };
    const dri = { type: 'drift', rate: 0.001, driver: 'row.t', cause: 'c', justification: 'j' };
    const loss = { type: 'heat-loss', k: 0.002, driver: 'row.t', cause: 'c', justification: 'j' };
    check('zero offset adds a constant', near(applySystematic([off], 1, row), 1.03));
    check('calibration multiplies by a factor', near(applySystematic([cal], 1, row), 1.02));
    check('drift grows with its driver', near(applySystematic([dri], 1, row), 1.06));
    check('heat loss removes a growing fraction', near(applySystematic([loss], 10, row), 10 * (1 - 0.12)));
    check('no effects, no change', applySystematic(undefined, 1.234, row) === 1.234);
    check('an effect without a cause is refused', checkSystematic([{ type: 'zero-offset', offset: 0.1, justification: 'j' }], [row]).length > 0);
    check('an unknown effect type is refused', checkSystematic([{ type: 'gremlins', cause: 'c', justification: 'j' }], [row]).length > 0);
    check('a heat loss of half the energy or more is refused', checkSystematic([{ ...loss, k: 0.01 }], [row]).length > 0);
    check('a calibration factor of 1.5 is refused as implausible', checkSystematic([{ ...cal, factor: 1.5 }], [row]).length > 0);
    // In a real dataset: D3 with an un-zeroed balance (+0.05 g) shifts every reading by 0.05 g (same random scatter),
    // keeps the physics checks happy, and makes the "line through the origin" claim fail, as it should.
    const d3 = (await loadDatasets()).find((x) => x.def.id === 'D3-B01').def;
    const offsetDef = { ...d3, columns: { ...d3.columns, m: { ...d3.columns.m, systematic: [{ type: 'zero-offset', offset: 0.05, cause: 'the balance was zeroed before the magnet was placed on it… (test)', justification: 'test' }] } } };
    const a = generateRows(d3).rows.map((r) => r.m);
    const b = generateRows(offsetDef).rows.map((r) => r.m);
    check('a zero offset shifts every reading by the offset (deterministically)', a.every((v, i) => Math.abs(b[i] - v - 0.05) <= 0.0100001), `${a} vs ${b}`);
    check('systematic effects are deterministic', JSON.stringify(generateRows(offsetDef).rows) === JSON.stringify(generateRows(offsetDef).rows));
    const codes = validateDataset(offsetDef, buildQuestion(offsetDef).question, { topics: loadTopics() }).filter((x) => x.level === 'error').map((x) => x.code);
    check('the validator expects the offset (no "model" error) and the origin claim now fails', !codes.includes('model') && codes.includes('claim'), codes.join(', '));
  }

  // ----- Temperatures (°C, K, differences) and angles (°, rad) -----
  {
    const C = parseUnit('°C');
    check('20 °C is 293.15 K', near(toSI(20, C), 293.15));
    check('373.15 K is 100 °C', near(fromSI(373.15, C), 100));
    check('a temperature difference of 5 °C is 5 K (no offset)', near(toSI(5, parseUnit('Δ°C')), 5) && parseUnit('Δ°C').text === '°C');
    let refused = false;
    try { parseUnit('J kg^-1 °C^-1'); } catch (e) { refused = true; }
    check('°C inside a compound unit is refused (use Δ°C)', refused);
    check('J kg⁻¹ Δ°C⁻¹ has the same dimensions as J kg⁻¹ ΔK⁻¹', sameDim(parseUnit('J kg^-1 Δ°C^-1').dim, parseUnit('J kg^-1 ΔK^-1').dim));
    check('30° is π/6 rad', near(toSI(30, parseUnit('°')), Math.PI / 6));
    const env = { def: { physics: { params: {} }, columns: {}, singles: {} }, params: {}, row: {}, singles: {} };
    const ev = (expr) => { try { return { v: evalModel(expr, env, 'test').si }; } catch (e) { return { code: e.code }; } };
    const gas = (T) => ({ law: 'pressure-law', inputs: { p0: { value: 1e5, unit: 'Pa' }, T0: { value: 300, unit: 'K' }, T } });
    check('a temperature in °C is converted to kelvin for the pressure law', near(ev(gas({ value: 150, unit: '°C' })).v, (1e5 * 423.15) / 300));
    check('a temperature DIFFERENCE is refused where a temperature is needed', ev(gas({ value: 150, unit: 'Δ°C' })).code === 'physics-units');
    const heat = (dT) => ({ law: 'thermal-energy', inputs: { m: { value: 0.5, unit: 'kg' }, c: { value: 4200, unit: 'J kg^-1 ΔK^-1' }, dT } });
    check('a temperature difference in Δ°C works in Q = mcΔT', near(ev(heat({ value: 10, unit: 'Δ°C' })).v, 21000));
    check('a temperature (not a difference) is refused in Q = mcΔT', ev(heat({ value: 10, unit: '°C' })).code === 'physics-units');
    const comp = (theta) => ({ law: 'force-component', inputs: { F: { value: 10, unit: 'N' }, theta } });
    check('an angle in degrees is converted to radians', near(ev(comp({ value: 60, unit: '°' })).v, 5));
    check('an angle in radians is used as it is', near(ev(comp({ value: Math.PI / 3, unit: 'rad' })).v, 5));
    check('a plain number is never taken as an angle', ev(comp({ value: 60, unit: '' })).code === 'physics-units');
    check('an angle is refused where a plain number is needed', ev({ law: 'force-on-wire', inputs: { B: { value: 0.1, unit: 'T' }, I: { value: 2, unit: 'A' }, L: { value: 0.05, unit: 'm' }, theta: { value: 90, unit: '°' } } }).code === 'physics-units');
  }

  // ----- Graph: the drawing reads back as the data -----
  {
    const s = niceScale(0, 0.93, true);
    check('axis scale 0 to 1.0 in steps of 0.2', s.min === 0 && s.max === 1 && s.step === 0.2, JSON.stringify(s));
    const pts = [{ x: 0.5, y: 0.17, ey: 0.02, row: 0 }, { x: 1.5, y: 0.49, ey: 0.02, row: 1 }, { x: 3, y: 0.98, ey: 0.02, row: 2 }];
    const svg = renderGraph({ x: { symbol: 'I', unit: 'A', includeZero: true }, y: { symbol: 'Δm', unit: 'g', includeZero: true }, points: pts, alt: 'test', kind: 'student' });
    const G = parseGraph(svg);
    const X = scaleFromTicks(G.xTicks);
    const Y = scaleFromTicks(G.yTicks);
    check('graph ticks are evenly spaced', X && Y && X.even && Y.even);
    check('graph points read back as the data', G.points.length === 3 && G.points.every((p) => Math.abs(X.toValue(p.px) - pts[p.row].x) < X.perPx && Math.abs(Y.toValue(p.py) - pts[p.row].y) < Y.perPx));
    check('graph axis labels', G.xTitle === 'I / A' && G.yTitle === 'Δm / g', `${G.xTitle} | ${G.yTitle}`);
    check('graph error bars read back', G.ebars.length === 3 && G.ebars.every((e) => Math.abs(Y.toValue(e.b) - (pts[e.row].y + 0.02)) < Y.perPx));
  }

  // ----- The real datasets: deterministic, and valid -----
  const datasets = await loadDatasets();
  const topics = loadTopics();
  for (const { file, def } of datasets) {
    const a = JSON.stringify(buildQuestion(def).question);
    const b = JSON.stringify(buildQuestion(def).question);
    check(`${file}: building twice gives identical output`, a === b);
    const rows = generateRows(def).rows;
    check(`${file}: changing the seed changes the data`, JSON.stringify(generateRows({ ...def, seed: def.seed + 1 }).rows) !== JSON.stringify(rows));
    const errs = validateDataset(def, buildQuestion(def).question, { topics }).filter((x) => x.level === 'error');
    check(`${file}: passes validation`, !errs.length, errs.map((x) => `${x.where}: ${x.message}`).join('; '));
  }

  // ----- Broken datasets must be caught -----
  for (const fx of broken) {
    let codes;
    try {
      const q = JSON.parse(JSON.stringify(buildQuestion(fx.def).question));
      if (fx.mutate) fx.mutate(q);
      codes = [...validateDataset(fx.def, q, { topics }), ...independentAudit(fx.def, q)].filter((x) => x.level === 'error').map((x) => x.code);
    } catch (e) {
      codes = [e.code || `crash: ${e.message}`];
    }
    check(`broken dataset "${fx.name}" is caught as ${fx.expect}`, codes.includes(fx.expect), `got ${codes.length ? [...new Set(codes)].join(', ') : 'no errors'}`);
  }

  // ----- Ids must be unique, and invalid datasets never reach the output -----
  {
    const d3 = datasets.find((x) => x.def.id === 'D3-B01');
    const dup = buildAll([d3, { ...d3 }], topics);
    check('duplicate ids are rejected', dup.diags.some((x) => x.code === 'duplicate-id') && dup.questions.length + dup.preview.length === 1);
    const bad = buildAll([{ file: 'D3-B01.mjs', def: broken.find((f) => f.expect === 'claim').def }], topics);
    check('a failing dataset is left out of questions/1b.json and the preview', bad.questions.length === 0 && bad.preview.length === 0);
  }
  // ----- Freeze (fingerprints) and the review gate -----
  {
    const d3 = datasets.find((x) => x.def.id === 'D3-B01');
    const base = buildQuestion(d3.def);
    const fp = fingerprintOf(canonicalContent(d3.def, base));
    const reg = (status) => ({ datasets: { 'D3-B01': { status, fingerprint: fp, history: [{ status, by: 'test reviewer', date: '2026-10-06', fingerprint: fp }] } } });
    // Drawings are presentation: changing an SVG must not change the fingerprint.
    const redrawn = JSON.parse(JSON.stringify(base.question));
    for (const f of redrawn.data) if (f.svg) f.svg = f.svg.replace('r="3.2"', 'r="2.9"');
    check('changing only a drawing keeps the fingerprint', fingerprintOf(canonicalContent(d3.def, { ...base, question: redrawn })) === fp);
    // Wording, data and physics are frozen once reviewed.
    const reworded = { ...d3.def, intro: (dd) => d3.def.intro(dd).replace('A student investigates', 'A student studies') };
    const r1 = buildAll([{ file: 'D3-B01.mjs', def: reworded }], topics, { registry: reg('TEACHER-REVIEWED') });
    const f1 = r1.diags.find((x) => x.code === 'frozen-changed');
    check('a reworded reviewed dataset fails the freeze, naming the field and both fingerprints',
      f1 && f1.changes.some((c) => c.path === 'text.stem') && f1.expected.includes(fp.slice(0, 16)) && !f1.got.includes(fp.slice(0, 16)), f1 ? f1.message : 'no freeze error');
    const shifted = { ...d3.def, physics: { ...d3.def.physics, params: { ...d3.def.physics.params, B: { ...d3.def.physics.params.B, value: 0.07 } } } };
    const f2 = buildAll([{ file: 'D3-B01.mjs', def: shifted }], topics, { registry: reg('APPROVED') }).diags.find((x) => x.code === 'frozen-changed');
    check('a physics change to an approved dataset fails the freeze (data and answers listed)',
      f2 && f2.changes.some((c) => c.path.startsWith('data.rows')) && f2.changes.some((c) => c.path.includes('numeric.answer')));
    const coarser = { ...d3.def, columns: { ...d3.def.columns, m: { ...d3.def.columns.m, resolution: 0.1, uncertainty: 0.1 } } };
    check('a rounding change to a reviewed dataset fails the freeze',
      buildAll([{ file: 'D3-B01.mjs', def: coarser }], topics, { registry: reg('PHYSICS-REVIEWED') }).diags.some((x) => x.code === 'frozen-changed'));
    // A change to SHARED code (here, a vetted law made 1 % stronger) must also break the freeze.
    const original = LAWS['force-on-wire'].f;
    LAWS['force-on-wire'].f = ({ B, I, L, theta }) => 1.01 * B * I * L * Math.sin(theta);
    let f3;
    try { f3 = buildAll([d3], topics, { registry: reg('APPROVED') }).diags.find((x) => x.code === 'frozen-changed'); } finally { LAWS['force-on-wire'].f = original; }
    check('a change to shared physics code breaks the freeze of an approved dataset (law and data listed)',
      f3 && f3.changes.some((c) => c.path.startsWith('laws.force-on-wire')) && f3.changes.some((c) => c.path.startsWith('data.rows')));
    // Only APPROVED (and unchanged) datasets are published; everything else is preview only.
    const approved = buildAll([d3], topics, { registry: reg('APPROVED') });
    check('an APPROVED dataset is published', approved.questions.length === 1 && approved.preview.length === 0);
    const reviewed = buildAll([d3], topics, { registry: reg('TEACHER-REVIEWED') });
    check('a TEACHER-REVIEWED dataset is preview only', reviewed.questions.length === 0 && reviewed.preview.length === 1 && reviewed.preview[0].review.status === 'TEACHER-REVIEWED');
    const unreviewed = buildAll([d3], topics, { registry: { datasets: {} } });
    check('an unreviewed dataset is AUTO-VALIDATED and preview only', unreviewed.questions.length === 0 && unreviewed.results[0].state.status === 'AUTO-VALIDATED');
    const changedApproved = buildAll([{ file: 'D3-B01.mjs', def: reworded }], topics, { registry: reg('APPROVED') });
    check('an APPROVED dataset that changed is not published', changedApproved.questions.length === 0);
    const broken = buildAll([{ file: 'D3-B01.mjs', def: { ...d3.def, claims: [{ type: 'throughOrigin', expect: false }] } }], topics, { registry: reg('APPROVED') });
    check('an APPROVED dataset that fails validation is not published (status DRAFT)', broken.questions.length === 0 && broken.results[0].state.status === 'DRAFT');
  }
  return { count, failures };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { count, failures } = await runTests();
  for (const f of failures) console.log('  ✗ ' + f);
  console.log(failures.length ? `\n✗ ${failures.length} of ${count} tests failed.` : `✓ All ${count} Paper 1B tests passed.`);
  process.exit(failures.length ? 1 : 0);
}
