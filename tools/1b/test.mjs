// Tests for the Paper 1B generator and validator. Run: node tools/1b/test.mjs
// (tools/check.mjs runs them too.) Each test either passes silently or adds a failure message.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  makeRng, decimalsOf, roundTo, fmtNum, sigFig, parseNum, sigFigsIn, parseUnit, sameDim, linearFit, gradientBand, cross,
} from './lib.mjs';
import { renderGraph, niceScale } from './graph.mjs';
import { buildQuestion, generateRows, evalModel } from './generate.mjs';
import { LAWS } from './laws.mjs';
import { validateDataset, parseGraph, scaleFromTicks } from './validate.mjs';
import { buildAll, loadDatasets, loadTopics } from './build.mjs';
import broken from './fixtures/broken.mjs';

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
      codes = validateDataset(fx.def, q, { topics }).filter((x) => x.level === 'error').map((x) => x.code);
    } catch (e) {
      codes = [e.code || `crash: ${e.message}`];
    }
    check(`broken dataset "${fx.name}" is caught as ${fx.expect}`, codes.includes(fx.expect), `got ${codes.length ? [...new Set(codes)].join(', ') : 'no errors'}`);
  }

  // ----- Ids must be unique, and invalid datasets never reach the output -----
  {
    const d3 = datasets.find((x) => x.def.id === 'D3-B01');
    const dup = buildAll([d3, { ...d3 }], topics);
    check('duplicate ids are rejected', dup.diags.some((x) => x.code === 'duplicate-id') && dup.questions.length === 1);
    const bad = buildAll([{ file: 'D3-B01.mjs', def: broken.find((f) => f.expect === 'claim').def }], topics);
    check('a failing dataset is left out of questions/1b.json', bad.questions.length === 0);
  }
  return { count, failures };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { count, failures } = await runTests();
  for (const f of failures) console.log('  ✗ ' + f);
  console.log(failures.length ? `\n✗ ${failures.length} of ${count} tests failed.` : `✓ All ${count} Paper 1B tests passed.`);
  process.exit(failures.length ? 1 : 0);
}
