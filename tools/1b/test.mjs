// Tests for the Paper 1B generator and validator. Run: node tools/1b/test.mjs
// (tools/check.mjs runs them too.) Each test either passes silently or adds a failure message.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  makeRng, decimalsOf, roundTo, fmtNum, sigFig, parseNum, sigFigsIn, parseUnit, sameDim, linearFit, gradientBand, cross, toSI, fromSI,
  baseUnitExpr, valuePm,
} from './lib.mjs';
import { normalizeAO, addAO, judgeBatch, aoTable, aoReport } from './ao.mjs';
import { classify, establishedSets, diversityWarnings, acceptBatch, individuallyApproved, SAMPLE_FRACTION } from './batch.mjs';
import { renderGraph, niceScale } from './graph.mjs';
import { buildQuestion, generateRows, evalModel } from './generate.mjs';
import { LAWS } from './laws.mjs';
import { propagate } from './uncertainty.mjs';
import { applySystematic, checkSystematic } from './systematic.mjs';
import { independentAudit } from './independent.mjs';
import { validateDataset, parseGraph, scaleFromTicks, numbersIn } from './validate.mjs';
import { buildAll, loadDatasets, loadTopics } from './build.mjs';
import broken, { D3_ASKS } from './fixtures/broken.mjs';
import { canonicalContent, fingerprintOf } from './fingerprint.mjs';
import { contextRepetition, contextProblems } from './contexts.mjs';
import { regularityFindings, constancy, successiveRatios, multiplesProblems } from './safeguards.mjs';
import { areaUnder, squaresEstimate, setSourcesDir } from './validate.mjs';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { D3_MODEL, E3_AREA, D3_SCALE, P12_BROKEN } from './fixtures/phase12.mjs';

const editPartLocal = (def, label, change) => ({ ...def, parts: (d) => def.parts(d).map((pt) => (pt.label === label ? change(pt, d) : pt)) });

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
  check('SI base units: Pa m = kg s⁻², T = kg s⁻² A⁻¹, m s⁻¹ unchanged',
    baseUnitExpr(parseUnit('Pa m').dim) === 'kg s^-2' && baseUnitExpr(parseUnit('T').dim) === 'kg s^-2 A^-1' && baseUnitExpr(parseUnit('m s^-1').dim) === 'm s^-1');
  check('SI base units of g A⁻¹ (a balance gradient) are kg A⁻¹', parseUnit(baseUnitExpr(parseUnit('g A^-1').dim)).text === 'kg A⁻¹');

  // ----- Value ± uncertainty (uncertainty to 1 s.f., value to the same decimal place; worked by hand) -----
  const pmText = (...a) => { const t = valuePm(...a); return `${t.value} ± ${t.unc}`; };
  check('value ± uncertainty: 0.063728 ± 0.0050982 → 0.064 ± 0.005', pmText(0.063728, 0.0050982) === '0.064 ± 0.005');
  check('value ± uncertainty: 4571 ± 286 → 4600 ± 300', pmText(4571, 286) === '4600 ± 300');
  check('value ± uncertainty: 9.7907 ± 0.0997 → 9.8 ± 0.1 (uncertainty rounds up a place)', pmText(9.7907, 0.0997) === '9.8 ± 0.1');
  check('value ± uncertainty to 2 s.f.: 9.7907 ± 0.0997 → 9.79 ± 0.10', pmText(9.7907, 0.0997, 2) === '9.79 ± 0.10');
  check('value ± uncertainty: 611.089 ± 30.55 → 610 ± 30', pmText(611.089, 30.55) === '610 ± 30');
  let threwPm = false;
  try { valuePm(1, 0); } catch (e) { threwPm = true; }
  check('value ± uncertainty needs a positive uncertainty', threwPm);

  // ----- Assessment-objective tags (ao.mjs) -----
  check('AO tag "AO2" gives all the marks to AO2', JSON.stringify(normalizeAO('AO2', 2)) === JSON.stringify({ AO1: 0, AO2: 2, AO3: 0 }));
  check('AO tag split between AOs', JSON.stringify(normalizeAO({ AO1: 1, AO3: 1 }, 2)) === JSON.stringify({ AO1: 1, AO2: 0, AO3: 1 }));
  for (const [bad, why] of [[undefined, 'missing'], ['AO4', 'unknown AO'], [{ AO2: 1 }, 'marks don\'t add up'], [{ AO2: 1.5, AO3: 0.5 }, 'fractions of a mark'], [{ AO5: 2 }, 'unknown key']]) {
    let t = false;
    try { normalizeAO(bad, 2); } catch (e) { t = true; }
    check(`AO tag rejected: ${why}`, t);
  }
  {
    const tot = addAO([{ AO1: 1, AO2: 3, AO3: 0 }, { AO1: 0, AO2: 1, AO3: 3 }]);
    check('AO totals add up (8 marks, 3 AO3)', tot.marks === 8 && tot.AO3 === 3 && Math.abs(tot.ao3Share - 0.375) < 1e-12);
    check('a batch below 40 marks is too small to judge', judgeBatch(tot).level === 'info');
    check('an AO2-heavy batch is flagged', judgeBatch(addAO([{ AO1: 5, AO2: 30, AO3: 10 }])).level === 'warning');
    check('an AO3-heavy batch is flagged', judgeBatch(addAO([{ AO1: 0, AO2: 10, AO3: 35 }])).level === 'warning');
    check('a batch with 40–60 % AO3 passes', judgeBatch(addAO([{ AO1: 4, AO2: 18, AO3: 22 }])).level === 'ok');
  }

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
    if (def.source === 'secondary') {
      // Published data have no generated scatter: they must not depend on the seed at all.
      check(`${file}: published data don't depend on the seed`, JSON.stringify(generateRows({ ...def, seed: def.seed + 1 }).rows) === JSON.stringify(rows));
    } else {
      check(`${file}: changing the seed changes the data`, JSON.stringify(generateRows({ ...def, seed: def.seed + 1 }).rows) !== JSON.stringify(rows));
    }
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

  // ----- New part types and AO tags on the real datasets -----
  {
    const errs = validateDataset(D3_ASKS, buildQuestion(D3_ASKS).question, { topics }).filter((x) => x.level === 'error');
    check('a dataset with correct "state the unit" and "value ± uncertainty" parts passes', !errs.length, errs.map((x) => `${x.code} ${x.where}: ${x.message}`).join('; '));
    const g = buildQuestion(D3_ASKS).question.parts.find((p) => p.label === 'g');
    check('value ± uncertainty part prints B = (0.064 ± 0.005) T', g && g.markscheme[0].includes('0.064 \\pm 0.005'), g && g.markscheme[0]);
    const published = datasets.flatMap(({ def }) => buildQuestion(def).question.parts);
    check('AO tags and "asks" are not published to students', published.every((p) => !('ao' in p) && !('asks' in p)));
    const d3 = datasets.find((x) => x.def.id === 'D3-B01').def;
    const untagged = { ...d3, parts: (d) => d3.parts(d).map(({ ao: _ao, ...rest }) => rest) };
    check('AO tags are not part of the review fingerprint',
      fingerprintOf(canonicalContent(d3, buildQuestion(d3))) === fingerprintOf(canonicalContent(untagged, buildQuestion(untagged))));
    const rows = aoTable(datasets.map(({ def }) => ({ def, meta: buildQuestion(def).meta })));
    check('every pilot part has a valid AO tag', rows.every((r) => r.parts.every((p) => p.ao)), rows.flatMap((r) => r.parts.filter((p) => !p.ao).map((p) => `${r.id} (${p.label}): ${p.error}`)).join('; '));
    const marks = rows.reduce((s, r) => s + r.total.marks, 0);
    const realMarks = datasets.reduce((s, { def }) => s + buildQuestion(def).question.parts.reduce((t, p) => t + p.marks, 0), 0);
    check('AO report covers every mark in the bank', marks === realMarks, `${marks} vs ${realMarks}`);
    check('AO report lists datasets, batches and the whole bank', /By batch/.test(aoReport(rows)) && /Whole bank/.test(aoReport(rows)) && /pilot/.test(aoReport(rows)));
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
  // ----- Risk classes and batch acceptance (batch.mjs) -----
  {
    const reg0 = JSON.parse(JSON.stringify((await import('./registry.mjs')).loadRegistry()));
    const real = buildAll(datasets, topics, { registry: reg0 });
    const est = establishedSets(real.results, reg0);
    check('the approved pilots establish their archetypes and features',
      ['N2', 'L2', 'V3', 'N5', 'L1'].every((a) => est.archetypes.has(a)) && est.features.has('fit:linear') && est.features.has('claim:verdict'));
    const d3 = datasets.find((x) => x.def.id === 'D3-B01').def;
    const asResult = (def) => ({ id: def.id, def, valid: true, state: { changed: false, status: 'AUTO-VALIDATED' }, built: buildQuestion(def) });
    const opts = { diags: [], established: est, verdictMargin: 0.04 };
    const green = { ...d3, id: 'D3-B07', archetypes: ['L1'], originality: 'test' };
    check('an established archetype with no flags is GREEN', classify(asResult(green), opts).class === 'GREEN', classify(asResult(green), opts).reasons.join('; '));
    const withOffset = { ...green, columns: { ...d3.columns, m: { ...d3.columns.m, systematic: [{ type: 'zero-offset', offset: 0.01, cause: 'test', justification: 'test' }] } } };
    check('the first use of a systematic effect makes a dataset AMBER', classify(asResult(withOffset), opts).reasons.some((x) => x.includes('systematic:zero-offset')));
    // "First example" rules are tested against a fixed set of established archetypes (only L1), not the live
    // review records, which change as archetypes become established.
    const fresh = { ...opts, established: { archetypes: new Set(['L1']), features: est.features } };
    check('the first example of a MEDIUM-risk archetype is AMBER', classify(asResult({ ...green, archetypes: ['N3'] }), fresh).class === 'AMBER');
    const lowNew = classify(asResult({ ...green, archetypes: ['M2'] }), fresh);
    check('the first example of a LOW-risk archetype is GREEN but preferred for the sample', lowNew.class === 'GREEN' && !!lowNew.priority);
    check('an archetype established by an individually inspected approval is no longer "new"',
      !classify(asResult({ ...green, archetypes: ['N3'] }), { ...opts, established: { archetypes: new Set(['N3']), features: est.features } }).reasons.some((x) => x.includes('archetype N3')));
    check('a missing originality note makes a dataset AMBER', classify(asResult({ ...green, originality: undefined }), opts).class === 'AMBER');
    check('a serious originality flag makes a dataset RED', classify(asResult({ ...green, reviewFlags: [{ flag: 'originality-serious', note: 'x' }] }), opts).class === 'RED');
    check('a validation error makes a dataset RED',
      classify(asResult(green), { ...opts, diags: [{ level: 'error', code: 'fit', dataset: 'D3-B07', where: 'graph' }] }).class === 'RED');
    check('a validator warning makes a dataset AMBER',
      classify(asResult(green), { ...opts, diags: [{ level: 'warning', code: 'meta', dataset: 'D3-B07', where: 'marks', message: 'm' }] }).class === 'AMBER');
    check('diversity: the same apparatus twice in a batch is flagged',
      diversityWarnings([{ id: 'X', def: { apparatus: 'spring' } }, { id: 'Y', def: { apparatus: 'spring' } }]).some((w) => w.startsWith('apparatus "spring"')));

    // acceptBatch on a synthetic batch: G1–G7 GREEN, A1 AMBER.
    const row = (id, cls, reviewed = false) => ({ id, class: cls, reasons: cls === 'GREEN' ? [] : ['first example of archetype N3 (MEDIUM risk)'], individuallyReviewed: reviewed });
    const rec = (status) => ({ status, history: [{ status: 'PHYSICS-REVIEWED', by: 'Claude (AI assistant)', date: '2026-10-07', fingerprint: 'f' }] });
    const greens = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'];
    const plan = { batchId: 'batch-t', rows: [...greens.map((g, i) => row(g, 'GREEN', i < 2)), row('A1x', 'AMBER')], sampleSize: Math.max(1, Math.ceil(SAMPLE_FRACTION * 7)), suggestedSample: [], diversity: [] };
    check('GREEN sample size is about 15 % (7 GREEN → 2)', plan.sampleSize === 2);
    const regT = { datasets: Object.fromEntries([...greens.map((g, i) => [g, rec(i < 2 ? 'TEACHER-REVIEWED' : 'PHYSICS-REVIEWED')]), ['A1x', rec('PHYSICS-REVIEWED')]]) };
    const fps = Object.fromEntries([...greens, 'A1x'].map((g) => [g, `fp-${g}`]));
    const base = { by: 'Mr Silkstone (teacher)', date: '2026-10-07', note: 'sample and AMBER reviewed', systemicOk: true, fingerprints: fps };
    check('a batch can\'t be accepted by Claude', acceptBatch(plan, regT, { ...base, by: 'Claude (AI assistant)' }).errors.length > 0);
    check('a batch needs the teacher\'s "no systemic problem" confirmation', acceptBatch(plan, regT, { ...base, systemicOk: false }).errors.some((e) => e.includes('systemic')));
    check('an unreviewed, unwaived AMBER dataset blocks acceptance', acceptBatch(plan, regT, base).errors.some((e) => e.startsWith('A1x is AMBER')));
    check('a RED dataset blocks acceptance and can\'t be waived',
      acceptBatch({ ...plan, rows: [...plan.rows.slice(0, 7), row('A1x', 'RED')] }, regT, { ...base, waive: { A1x: 'x' } }).errors.some((e) => e.includes('RED')));
    const smallSample = { ...plan, rows: plan.rows.map((x) => ({ ...x, individuallyReviewed: false })) };
    check('too small a GREEN sample blocks acceptance', acceptBatch(smallSample, regT, { ...base, waive: { A1x: 'reviewed the data, fine' } }).errors.some((e) => e.includes('sample')));
    check('an AUTO-VALIDATED dataset (no physics review) blocks acceptance',
      acceptBatch(plan, { datasets: { ...regT.datasets, G7: { status: 'AUTO-VALIDATED', history: [] } } }, { ...base, waive: { A1x: 'r' } }).errors.some((e) => e.startsWith('G7 needs')));
    check('an unwaived diversity warning blocks acceptance', acceptBatch({ ...plan, diversity: ['apparatus twice'] }, regT, { ...base, waive: { A1x: 'r' } }).errors.some((e) => e.startsWith('diversity')));
    const ok = acceptBatch(plan, regT, { ...base, waive: { A1x: 'teacher judged the data structure acceptable' } });
    check('a batch meeting every condition is accepted', ok.errors.length === 0, ok.errors.join('; '));
    const g7 = ok.registry.datasets.G7;
    const g1 = ok.registry.datasets.G1;
    const last2 = (r) => r.history.slice(-2).map((h) => h.status).join(' > ');
    check('an uninspected GREEN dataset is recorded BATCH-ACCEPTED (not inspected) then APPROVED on a batch basis',
      g7.status === 'APPROVED' && last2(g7) === 'BATCH-ACCEPTED > APPROVED' && g7.history.at(-2).inspected === false && g7.history.at(-1).basis === 'batch' && g7.history.at(-1).inspected === false && g7.fingerprint === 'fp-G7');
    check('a sampled dataset keeps its individual review and is approved as inspected',
      g1.status === 'APPROVED' && g1.history.at(-1).inspected === true && !g1.history.some((h) => h.status === 'BATCH-ACCEPTED'));
    check('batch acceptance never records TEACHER-REVIEWED for a dataset',
      Object.entries(ok.registry.datasets).every(([id, r]) => r.history.filter((h) => h.status === 'TEACHER-REVIEWED').length === regT.datasets[id].history.filter((h) => h.status === 'TEACHER-REVIEWED').length));
    check('the waived AMBER dataset records the teacher\'s waiver', ok.registry.datasets.A1x.history.at(-2).note.includes('waived'));
    check('the batch decision is recorded once, with the sample and the waiver',
      ok.registry.batches['batch-t'].decision === 'ACCEPTED' && ok.registry.batches['batch-t'].sampled.join() === 'G1,G2' && ok.registry.batches['batch-t'].datasets.find((x) => x.id === 'A1x').waived);
    check('the input registry is not changed by a successful acceptance', !regT.batches && regT.datasets.G7.status === 'PHYSICS-REVIEWED');
    check('a batch can\'t be decided twice', acceptBatch(plan, ok.registry, { ...base, waive: { A1x: 'r' } }).errors.some((e) => e.includes('already been decided')));
    check('a batch approval without inspection does not establish an archetype', !individuallyApproved(g7) && individuallyApproved(g1));
    check('older approvals (no basis recorded) count as individual', individuallyApproved(reg0.datasets['D3-B01']));
    // A batch-approved dataset is published like any APPROVED dataset (production still needs APPROVED + unchanged).
    const d3b = datasets.find((x) => x.def.id === 'D3-B01');
    const fpD3 = fingerprintOf(canonicalContent(d3b.def, buildQuestion(d3b.def)));
    const batchReg = { datasets: { 'D3-B01': { status: 'APPROVED', fingerprint: fpD3, history: [{ status: 'APPROVED', by: 'Mr Silkstone (teacher)', date: '2026-10-07', basis: 'batch', batch: 'b', inspected: false, fingerprint: fpD3 }] } } };
    check('a batch-approved dataset is published', buildAll([d3b], topics, { registry: batchReg }).questions.length === 1);
    check('archetype, apparatus and originality metadata don\'t change a fingerprint',
      fingerprintOf(canonicalContent({ ...d3b.def, archetypes: ['X'], apparatus: 'y', originality: 'z' }, buildQuestion(d3b.def))) === fpD3);
  }
  // ----- Phase 12: context families (T1, contexts.mjs) -----
  {
    const r = (id, def) => ({ id, def });
    const spring1 = r('S1', { apparatus: 'spring with a hanger', contextFamily: 'elastic-stretching', contextObjects: ['spring', 'slotted-masses'] });
    const spring2 = r('S2', { apparatus: 'mass oscillating on a spring', contextFamily: 'oscillation', contextObjects: ['spring', 'stopwatch'] });
    const wire = r('W1', { apparatus: 'loaded copper wire', contextFamily: 'elastic-stretching', contextObjects: ['stretched-wire', 'slotted-masses'] });
    const heater = r('H1', { apparatus: 'block with an electric heater', contextFamily: 'electrical-heating', contextObjects: ['electric-heater', 'thermometer'] });
    const gas = r('G1', { apparatus: 'flask in a water bath with a pressure gauge', contextFamily: 'gas-pressure', contextObjects: ['pressure-gauge', 'water-bath'] });
    const rep = contextRepetition([spring1, wire, spring2, heater]);
    check('T1: the same context family twice in a batch is flagged, naming both datasets and the family',
      rep.some((w) => w.includes('"elastic-stretching"') && w.includes('S1') && w.includes('W1')));
    check('T1: the same main object in two families (a spring) is flagged', rep.some((w) => w.includes('S1') && w.includes('S2') && w.includes('helical spring')));
    check('T1: a shared generic instrument (slotted masses, thermometer) is not repetition', !rep.some((w) => /slotted masses|thermometer/.test(w)));
    check('T1: different families with different objects are not flagged', contextRepetition([heater, gas]).length === 0);
    const bank = [r('B1', { contextFamily: 'electrical-heating', contextObjects: ['electric-heater'] }), r('B2', { contextFamily: 'electrical-heating', contextObjects: ['electric-heater'] })];
    check('T1: a family already used twice in the bank is flagged for a new dataset', contextRepetition([heater], bank).some((w) => w.includes('already used by 2')));
    check('T1: a family used once in the bank is not flagged', contextRepetition([heater], bank.slice(0, 1)).every((w) => !w.includes('context family')));
    check('T1: an object mentioned in the apparatus but not declared is reported',
      contextProblems({ apparatus: 'a spring and a light gate', contextFamily: 'oscillation', contextObjects: ['spring'] }).some((p) => p.includes('light-gate')));
    check('T1: a missing or unknown family is reported', contextProblems({}).length === 1 && contextProblems({ contextFamily: 'springs' })[0].includes('unknown'));
    const all = datasets.map(({ def }) => ({ id: def.id, def }));
    check('T1: every dataset in the bank declares a known family and its objects', all.every((x) => contextProblems(x.def).length === 0),
      all.filter((x) => contextProblems(x.def).length).map((x) => `${x.id}: ${contextProblems(x.def).join('; ')}`).join(' | '));
    const b1 = all.filter((x) => x.def.batch === 'batch-1');
    const found = contextRepetition(b1, all.filter((x) => x.def.batch !== 'batch-1'));
    check('T1: Batch 1\'s repeated springs and heaters (found by reading in the retrospective) are now caught',
      found.some((w) => w.includes('A2-B01') && w.includes('C1-B01') && w.includes('spring')) && found.some((w) => w.includes('"electrical-heating"')));
  }
  // ----- Phase 12: too-regular data (T2, safeguards.mjs) -----
  {
    const base = { resolution: 1, sigmas: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4] };
    const codes = (o) => regularityFindings({ ...base, ...o }).map((f) => f.code);
    check('T2: equal steps in 4 of 5 differences are flagged', codes({ values: [39, 59, 79, 99, 119, 140], texts: ['39', '59', '79', '99', '119', '140'], xs: [0.5, 1, 1.5, 2, 2.5, 3], models: [38.8, 58.8, 78.8, 98.8, 118.8, 138.8] }).includes('equal-steps'));
    check('T2: uneven, honestly scattered data are not flagged', codes({ values: [39, 58, 80, 99, 118, 140], texts: ['39', '58', '80', '99', '118', '140'], xs: [0.5, 1, 1.5, 2, 2.5, 3], models: [38.8, 58.8, 78.8, 98.8, 118.8, 138.8] }).length === 0);
    check('T2: data much cleaner than their declared noise are flagged',
      codes({ resolution: 0.01, sigmas: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2], values: [1.01, 2.03, 2.98, 4.02, 5.01, 6.03], texts: ['1.01', '2.03', '2.98', '4.02', '5.01', '6.03'], xs: [1, 2, 3, 4, 5, 6], models: [1.01, 2.03, 2.98, 4.02, 5.01, 6.03] }).includes('too-little-scatter'));
    check('T2: exactly proportional values are flagged', codes({ resolution: 0.01, sigmas: [0, 0, 0, 0, 0], values: [0.52, 1.04, 1.56, 2.08, 2.6], texts: ['0.52', '1.04', '1.56', '2.08', '2.60'], xs: [1, 2, 3, 4, 5], models: [0.52, 1.04, 1.56, 2.08, 2.6] }).includes('exact-ratios'));
    check('T2: every value ending in the same digit is flagged', codes({ resolution: 0.1, sigmas: [1, 1, 1, 1, 1], values: [1.5, 3.5, 4.5, 6.5, 8.5], texts: ['1.5', '3.5', '4.5', '6.5', '8.5'], xs: [1, 2, 3, 4, 5], models: [1.4, 3.1, 4.7, 6.3, 8.2] }).includes('repeated-digit'));
    check('T2: a resolution of 10 (last digit always 0) is not a repeated-digit finding', !codes({ resolution: 10, sigmas: [30, 30, 30, 30, 30], values: [120, 190, 250, 330, 380], texts: ['120', '190', '250', '330', '380'], xs: [1, 2, 3, 4, 5], models: [110, 180, 260, 320, 390] }).includes('repeated-digit'));
    // C4-B01 declares a scatter of 0.25 Hz with a resolution of 0.1 Hz. Replace its measured column with the rounded
    // noise-free model (as if someone typed "clean" values): far too little scatter, so the validator must warn.
    // (Where the declared scatter is below the resolution, as in D3-B01, rounded model values are honest data.)
    const c4 = datasets.find((x) => x.def.id === 'C4-B01').def;
    const q = JSON.parse(JSON.stringify(buildQuestion(c4).question));
    const ideal = generateRows(c4, { ideal: true }).rows;
    const t = q.data.find((x) => x.kind === 'table');
    t.html = t.html.replace(/<td data-col="f" data-row="(\d+)">([^<]*)<\/td>/g, (_, i) => `<td data-col="f" data-row="${i}">${fmtNum(roundTo(ideal[+i].f, c4.columns.f.resolution), decimalsOf(c4.columns.f.resolution))}</td>`);
    const w = validateDataset(c4, q, { topics }).filter((x) => x.code === 'regular-data');
    check('T2: a table edited to the exact model values is reported as too regular (warning)', w.length > 0 && w.every((x) => x.level === 'warning'), w.map((x) => x.message).join('; ') || 'no warning');
    check('T2: A2-B01\'s accepted regularity is reported to the teacher (AMBER reason), not silently passed',
      classify({ id: 'A2-B01', def: datasets.find((x) => x.def.id === 'A2-B01').def, valid: true, state: { changed: false }, built: null }, { diags: [], established: { archetypes: new Set(['E1', 'L2']), features: new Set() }, verdictMargin: 0.04 })
        .reasons.some((x) => x.startsWith('regular data accepted')));
  }
  // ----- Phase 12: warnings from the graph and giveaway checks -----
  {
    const warns = (def) => validateDataset(def, buildQuestion(def).question, { topics }).filter((x) => x.level === 'warning').map((x) => x.code);
    const a2 = datasets.find((x) => x.def.id === 'A2-B01').def;
    check('P1: error bars hidden under the markers are reported (A2-B01 without errorBars "too-small")',
      warns({ ...a2, graph: { ...a2.graph, errorBars: undefined }, parts: (d) => a2.parts(d) }).includes('graph-errorbar-visibility'));
    check('P1: with errorBars "too-small" the caption states the uncertainty and no bars are drawn',
      (() => { const q2 = buildQuestion(a2).question; const g = q2.data.find((x) => x.figure === 'graph'); return /too small to show as error bars/.test(g.caption) && !/class="ebar"/.test(g.svg) && /±1 mm/.test(g.caption); })());
    const d3 = datasets.find((x) => x.def.id === 'D3-B01').def;
    check('T3: wording that reads from a graph without declared reads is reported',
      warns(editPartLocal(d3, 'b', (pt) => ({ ...pt, question: 'Read from the graph the mass reading when $I = 2.0$ A.' }))).includes('graph-read-undeclared'));
    check('T4: a "whether" part without a declared conclusion is reported',
      warns(editPartLocal(d3, 'd', (pt) => { const { asks: _a, ...rest } = pt; return rest; })).includes('giveaway-undeclared'));
    check('T3: B5-B01\'s emf (read at I = 0) is now on the graph\'s axes',
      !validateDataset(datasets.find((x) => x.def.id === 'B5-B01').def, buildQuestion(datasets.find((x) => x.def.id === 'B5-B01').def).question, { topics }).some((x) => x.code === 'graph-read'));
    check('Graph height is a drawing option: it doesn\'t change a fingerprint',
      (() => { const b5 = datasets.find((x) => x.def.id === 'B5-B01').def; const h = { ...b5, graph: { ...b5.graph, height: 400 } }; return fingerprintOf(canonicalContent(b5, buildQuestion(b5))) === fingerprintOf(canonicalContent(h, buildQuestion(h))); })());
  }
  // ----- Phase 12: new capabilities T5–T8 (fixtures/phase12.mjs) -----
  {
    // T5 arithmetic, worked by hand.
    const k1 = constancy([{ v: 1.00, u: 0.05 }, { v: 1.04, u: 0.05 }, { v: 0.97, u: 0.05 }], 0.04);
    check('T5: overlapping ranges (0.95–1.05, 0.99–1.09, 0.92–1.02) share a value', k1.constant && !k1.clearlyNot);
    const k2 = constancy([{ v: 1.0, u: 0.02 }, { v: 1.2, u: 0.02 }, { v: 1.4, u: 0.02 }], 0.04);
    check('T5: separated ranges are clearly not constant', !k2.constant && k2.clearlyNot);
    const r = successiveRatios([{ v: 200, u: 1 }, { v: 110, u: 1 }]);
    check('T5: a successive ratio and its uncertainty: 110/200 = 0.55 ± 0.55 × (1/200 + 1/110)', near(r[0].v, 0.55) && near(r[0].u, 0.55 * (1 / 200 + 1 / 110)));
    const e = 1.6;
    const drops = [3.21, 4.79, 6.42, 1.58, 8.03].map((q, i) => ({ q, u: 0.12, label: `${i + 1}` }));
    check('T5: charges that are whole multiples of 1.6 (within ±0.12) pass', multiplesProblems(drops, e, 0.04).length === 0, multiplesProblems(drops, e, 0.04).join('; '));
    check('T5: a value between multiples is reported', multiplesProblems([...drops, { q: 5.6, u: 0.12, label: '6' }], e, 0.04).some((m) => m.includes('5.6')));
    check('T5: a multiple that can\'t be identified (uncertainty ≥ a quarter of the factor) is reported', multiplesProblems([{ q: 3.2, u: 0.5, label: '1' }], e, 0.04).some((m) => m.includes('quarter')));
    check('T5: a larger factor that also fits every value is reported (all values even multiples)', multiplesProblems([3.2, 6.4, 9.6, 12.8].map((q, i) => ({ q, u: 0.05, label: `${i}` })), e, 0.04).some((m) => m.includes('larger common factor')));
    const e3 = datasets.find((x) => x.def.id === 'E3-B01').def;
    // E3-B01's first four rates (47.6, 33.9, 25.3, 17.8 s⁻¹) fall by ratios 0.71, 0.75, 0.70 whose ranges overlap. (Over seven
    // rows they don't: 17.8 → 16.8 gives 0.94 ± 0.14, clear of the others; the claim reports that honestly.)
    const ratioOk = { ...e3, claims: [...e3.claims, { type: 'constantRatio', column: 'R', rows: [0, 3], expect: true }] };
    const ratioErrs = validateDataset(ratioOk, buildQuestion(ratioOk).question, { topics }).filter((x) => x.level === 'error' && x.code === 'claim');
    check('T5: E3-B01\'s first four count rates fall by a constant ratio within their uncertainties (true claim passes)', !ratioErrs.length, ratioErrs.map((x) => x.message).join('; '));
    // T6–T8 good fixtures pass.
    for (const [name, def] of [['T6 points-only graph with a model curve and a reference line', D3_MODEL], ['T7 sensor trace with an area and no table', E3_AREA], ['T8 readings on an instrument scale', D3_SCALE]]) {
      const errs = validateDataset(def, buildQuestion(def).question, { topics }).filter((x) => x.level === 'error');
      check(`${name}: passes validation`, !errs.length, errs.map((x) => `${x.code} ${x.where}: ${x.message}`).join('; '));
    }
    const qm = buildQuestion(D3_MODEL).question;
    const stud = qm.data.find((x) => x.figure === 'graph');
    const ms = qm.parts[0].msFigure || null;
    check('T6: the students\' graph shows points and the reference line, but no fit and no model curve',
      /class="f1 pt"/.test(stud.svg) && /data-ref="1"/.test(stud.svg) && !/data-fit=/.test(stud.svg) && !/data-model=/.test(stud.svg) && /dashed line shows/.test(stud.caption));
    check('T6: the examiner\'s graph shows the model curve and the reference line', !!ms && /data-model="curve"/.test(ms.svg) && /data-ref="1"/.test(ms.svg));
    const qa = buildQuestion(E3_AREA).question;
    check('T7: the trace has one vertex per reading and no student table is published',
      !qa.data.some((x) => x.kind === 'table') && (qa.data.find((x) => x.figure === 'graph').svg.match(/data-rows="([^"]*)"/)[1].split(' ').length === E3_AREA.columns.t.values.length));
    check('T7: the trapezium area of a straight line y = 2x from 0 to 3 is 9', near(areaUnder([{ x: 0, y: 0 }, { x: 1, y: 2 }, { x: 3, y: 6 }], 'x', 'y', 0, 3, 0), 9));
    check('T7: the area between y = 5 and a baseline of 2 from 1 to 4 is 9', near(areaUnder([{ x: 0, y: 5 }, { x: 5, y: 5 }], 'x', 'y', 1, 4, 2), 9));
    check('T7: counting squares under y = 2x (0 to 3, 0.5 × 0.5 squares) gives the true 9', near(squaresEstimate([{ x: 0, y: 0 }, { x: 3, y: 6 }], 'x', 'y', 0, 3, 0, 0.5, 0.5), 9));
    for (const fx of P12_BROKEN) {
      let codes;
      try {
        const q = JSON.parse(JSON.stringify(buildQuestion(fx.def).question));
        if (fx.mutate) fx.mutate(q);
        codes = validateDataset(fx.def, q, { topics }).filter((x) => x.level === 'error').map((x) => x.code);
      } catch (e) {
        codes = [e.code || `crash: ${e.message}`];
      }
      check(`broken dataset "${fx.name}" is caught as ${fx.expect}`, codes.includes(fx.expect), `got ${codes.length ? [...new Set(codes)].join(', ') : 'no errors'}`);
    }
    check('Phase 12 fixtures are never real datasets', datasets.every(({ def }) => ![D3_MODEL, E3_AREA, D3_SCALE].includes(def)));
  }
  // ----- Phase 12: published values against a stored copy of the source (T10) -----
  {
    const d1 = datasets.find((x) => x.def.id === 'D1-B01').def;
    // A temporary copy of the source (so the test runs anywhere, including on GitHub without the reference cache).
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p1b-src-'));
    const rows = {};
    d1.provenance.extract.rows.forEach((name, i) => {
      rows[name] = { 'Semi-major axis (10^3 km)': String(d1.columns.a.values[i] / 1000), 'Orbital Period (days)': String(d1.columns.T.values[i]) };
    });
    const text = JSON.stringify({ source: 'test copy', columns: { 'Semi-major axis (10^3 km)': 'a', 'Orbital Period (days)': 'T' }, rows });
    fs.mkdirSync(path.join(dir, 'p1b-sources'));
    fs.writeFileSync(path.join(dir, 'p1b-sources', 'x.json'), text);
    const sha = crypto.createHash('sha256').update(text).digest('hex');
    const withExtract = (extra = {}, fields = d1.provenance.fields) => ({ ...d1, provenance: { ...d1.provenance, fields, extract: { file: 'p1b-sources/x.json', sha256: sha, rows: d1.provenance.extract.rows, ...extra } } });
    const old = setSourcesDir(dir);
    try {
      const diagsOf = (def) => validateDataset(def, buildQuestion(def).question, { topics });
      const good = diagsOf(withExtract());
      check('T10: published values matching the stored source pass, with no source warning', !good.some((x) => /source-extract|provenance/.test(x.code)), good.map((x) => x.code).join(', '));
      const tampered = { ...withExtract(), columns: { ...d1.columns, T: { ...d1.columns.T, values: d1.columns.T.values.map((v, i) => (i === 3 ? v * 1.01 : v)) } } };
      check('T10: a published value that differs from the source is an error', diagsOf(tampered).some((x) => x.code === 'source-extract' && x.level === 'error'));
      check('T10: a stored copy changed since it was recorded is an error', diagsOf(withExtract({ sha256: '0'.repeat(64) })).some((x) => x.code === 'source-extract' && x.message.includes('changed')));
      check('T10: a catalogue column without its source column and definition is an error', diagsOf(withExtract({}, {})).some((x) => x.code === 'provenance' && x.level === 'error'));
      check('T10: a source row name that isn\'t in the copy is an error', diagsOf(withExtract({ rows: ['Metis', 'Amalthea', 'Thebe', 'Io', 'Europa', 'Ganymede', 'Callisto', 'Pluto'] })).some((x) => x.code === 'source-extract'));
      check('T10: no stored copy at all is a warning (AMBER), not silence', diagsOf({ ...d1, provenance: { ...d1.provenance, extract: undefined } }).some((x) => x.code === 'source-extract-missing' && x.level === 'warning'));
      setSourcesDir(path.join(dir, 'nowhere'));
      check('T10: a stored copy that isn\'t on this computer is a warning (e.g. on GitHub)', diagsOf(withExtract()).some((x) => x.code === 'source-extract-unavailable' && x.level === 'warning'));
    } finally {
      setSourcesDir(old);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  // ----- Phase 12: observed published values (compared with a model, not expected to follow it) -----
  {
    const d1 = datasets.find((x) => x.def.id === 'D1-B01').def;
    const { model: _m, agree: _a, agreeReason: _r, ...rest } = d1.columns.T;
    const obs = (extra) => ({ ...d1, columns: { ...d1.columns, T: { ...rest, ...extra } } });
    const meta = (def) => validateDataset(def, buildQuestion(def).question, { topics }).filter((x) => x.code === 'physics-meta').map((x) => x.message);
    check('Observed values with a reason and provenance are accepted without a model', meta(obs({ observed: { reason: 'compared with a model in the question' } })).length === 0, meta(obs({ observed: { reason: 'x' } })).join('; '));
    check('Observed values need a reason', meta(obs({ observed: {} })).some((m) => m.includes('observed: { reason }')));
    check('Observed values can\'t also carry a model', meta(obs({ observed: { reason: 'x' }, model: d1.columns.T.model })).some((m) => m.includes('no model')));
    check('Observed values need provenance fields', meta({ ...obs({ observed: { reason: 'x' } }), provenance: { ...d1.provenance, fields: {} } }).some((m) => m.includes('provenance.fields')));
  }
  // ----- Uncertainty not part of the question: errorBars 'none' and showUncertainty: false (C1-B01, teacher, 8 October 2026) -----
  {
    const c1 = datasets.find((x) => x.def.id === 'C1-B01').def;
    const q = buildQuestion(c1).question;
    const table = q.data.find((x) => x.kind === 'table');
    const figs = [...q.data.filter((x) => x.svg), ...q.parts.flatMap((p) => [p.figure, p.msFigure]).filter((f) => f && f.svg)];
    check('errorBars "none": no error bars, no max/min lines and no mention of uncertainty in any caption or alt text',
      figs.every((f) => !/class="ebar"|data-fit="(max|min)"/.test(f.svg) && !/error bar|uncertaint/i.test(`${f.caption} ${f.alt}`)));
    check('showUncertainty: false: the table heading gives no ± for T', !/±/.test(table.html));
    const mentions = editPartLocal(c1, 'a', (pt) => ({ ...pt, markscheme: ['The points lie on a curve, beyond the uncertainty in each period ✓', ...pt.markscheme.slice(1)] }));
    check('errorBars "none": a mark scheme that uses the uncertainty is an error',
      validateDataset(mentions, buildQuestion(mentions).question, { topics }).some((x) => x.code === 'graph-errorbar-text' && x.level === 'error'));
    check('errorBars "none": the uncertainty still proves the raw data are not linear (claim checked internally)',
      !validateDataset(c1, q, { topics }).some((x) => x.level === 'error'));
  }
  // ----- Rules C1 and C6 (adopted by the teacher, 8 October 2026) -----
  {
    const d3 = datasets.find((x) => x.def.id === 'D3-B01').def;
    const asResult = (def) => ({ id: def.id, def, valid: true, state: { changed: false }, built: buildQuestion(def) });
    const base = { ...d3, id: 'D3-B08', originality: 'test', contextFamily: 'magnetic-force', contextObjects: ['magnet', 'top-pan-balance', 'current-carrying-wire'] };
    const est = (contexts) => ({ archetypes: new Set(['L1', 'V2']), features: new Set(['fit:linear', 'claim:verdict', 'claim:throughOrigin', 'claim:linear', 'claim:trend']), contexts: new Map(Object.entries(contexts).map(([a, f]) => [a, new Set(f)])) });
    const opts = (contexts) => ({ diags: [], established: est(contexts), verdictMargin: 0.04 });
    const v2 = { ...base, archetypes: ['V2'] };
    const one = classify(asResult(v2), opts({ V2: ['elastic-stretching'] }));
    check('C1: a HIGH-risk archetype with one inspected example is AMBER ("second example")', one.class === 'AMBER' && one.reasons.some((x) => x.startsWith('second example of HIGH-risk archetype V2')), one.reasons.join('; '));
    const two = classify(asResult(v2), opts({ V2: ['elastic-stretching', 'light-intensity-distance'] }));
    check('C1: with two inspected examples in different contexts it is no longer flagged', !two.reasons.some((x) => x.includes('HIGH-risk archetype V2')), two.reasons.join('; '));
    const l1 = classify(asResult({ ...base, archetypes: ['L1'] }), opts({ L1: ['magnetic-force'] }));
    check('C1 applies only to HIGH-risk archetypes (L1 with one example is not flagged)', !l1.reasons.some((x) => x.includes('HIGH-risk')));
    check('C6: a "first example" or "second example" of a HIGH-risk archetype can\'t be waived', one.waivable === false && one.notWaivable.length === 1);
    const medium = classify(asResult({ ...base, archetypes: ['L1'], reviewFlags: [{ flag: 'test', note: 'x' }] }), opts({ L1: ['magnetic-force'] }));
    check('C6: a MEDIUM-level AMBER reason (an author flag) can be waived', medium.class === 'AMBER' && medium.waivable === true);
    const plan = { batchId: 'batch-c6', rows: [{ ...one, individuallyReviewed: false }], sampleSize: 0, suggestedSample: [], diversity: [] };
    const reg = { datasets: { 'D3-B08': { status: 'PHYSICS-REVIEWED', history: [] } } };
    const res = acceptBatch(plan, reg, { by: 'Mr Silkstone (teacher)', date: '2026-10-08', note: 'n', systemicOk: true, fingerprints: { 'D3-B08': 'f' }, waive: { 'D3-B08': 'looked fine' } });
    check('C6: accept-batch refuses a waiver of a HIGH-level AMBER reason', res.errors.some((e) => e.includes('can\'t be waived (rule C6)')), res.errors.join('; '));
    // establishedSets counts context families from fixed inputs (not the live review records, which change).
    const appr = { status: 'APPROVED', history: [{ status: 'APPROVED', basis: 'individual', inspected: true }] };
    const batchOnly = { status: 'APPROVED', history: [{ status: 'APPROVED', basis: 'batch', inspected: false }] };
    const res3 = [
      { id: 'X1', valid: true, state: { changed: false }, def: { archetypes: ['V2'], contextFamily: 'elastic-stretching' } },
      { id: 'X2', valid: true, state: { changed: false }, def: { archetypes: ['V2'], contextFamily: 'elastic-stretching' } },
      { id: 'X3', valid: true, state: { changed: false }, def: { archetypes: ['V2'], contextFamily: 'light-intensity-distance' } },
    ];
    const e1 = establishedSets(res3.slice(0, 2), { datasets: { X1: appr, X2: appr } });
    check('C1: two inspected examples in the SAME context family count as one context', e1.contexts.get('V2').size === 1);
    const e2 = establishedSets(res3, { datasets: { X1: appr, X2: appr, X3: batchOnly } });
    check('C1: an example approved in a batch without inspection doesn\'t count', e2.contexts.get('V2').size === 1);
    const e3 = establishedSets(res3, { datasets: { X1: appr, X2: appr, X3: appr } });
    check('C1: inspected examples in two different families establish a HIGH-risk archetype', e3.contexts.get('V2').size === 2);
  }
  return { count, failures };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { count, failures } = await runTests();
  for (const f of failures) console.log('  ✗ ' + f);
  console.log(failures.length ? `\n✗ ${failures.length} of ${count} tests failed.` : `✓ All ${count} Paper 1B tests passed.`);
  process.exit(failures.length ? 1 : 0);
}
