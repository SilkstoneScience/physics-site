// Tests for the graph maker's maths (js/graph-maker-core.js). Run on its own (node tools/check-graph-maker.mjs)
// or from tools/check.mjs, which reports any failure as an error.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const G = createRequire(import.meta.url)('../js/graph-maker-core.js');

export function runTests() {
  const failures = [];
  const near = (a, b, rel = 1e-6) => Math.abs(a - b) <= rel * Math.max(1, Math.abs(b));
  const eq = (what, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) failures.push(`${what}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`); };
  const close = (what, got, want, rel) => { if (!(isFinite(got) && near(got, want, rel))) failures.push(`${what}: got ${got}, expected ${want}`); };

  // Headings
  const h = (t) => { const r = G.parseHeading(t); return [r.name, r.sym, r.unit, r.hasUnit]; };
  eq('heading "length L / m"', h('length L / m'), ['length', 'L', 'm', true]);
  eq('heading "time for 10 swings t / s"', h('time for 10 swings t / s'), ['time for 10 swings', 't', 's', true]);
  eq('heading "speed v / m s^-1"', h('speed v / m s^-1'), ['speed', 'v', 'm s^-1', true]);
  eq('heading "Length (m)"', h('Length (m)'), ['Length', '', 'm', true]);
  eq('heading "ln(V / V)"', h('ln(V / V)'), ['ln(V / V)', '', '', false]);
  eq('heading "count N"', h('count N'), ['count', 'N', '', false]);
  eq('suggestSym("T²")', G.suggestSym('T²'), 'T2');
  eq('suggestSym("1/T")', G.suggestSym('1/T'), '');

  // Numbers
  const n = (t) => { const r = G.readNumber(t); return r && [r.v, r.dp, r.sf]; };
  eq('readNumber("0.400")', n('0.400'), [0.4, 3, 3]);
  eq('readNumber("0,400")', n('0,400'), [0.4, 3, 3]);
  eq('readNumber("−3.2")', n('−3.2'), [-3.2, 1, 2]);
  eq('readNumber("1200")', n('1200'), [1200, 0, 2]);
  eq('readNumber("3.1e-4")', n('3.1e-4'), [0.00031, 5, 2]);
  eq('readNumber("3.1 × 10^-4")', n('3.1 × 10^-4'), [0.00031, 5, 2]);
  eq('readNumber("3.1x10⁻⁴")', n('3.1x10⁻⁴'), [0.00031, 5, 2]);
  for (const bad of ['', 'abc', '4.7m', '1.2.3', '5/2', '1,2,3']) eq(`readNumber("${bad}")`, G.readNumber(bad), null);

  // Uncertainties
  eq('readUnc("0.001")', G.readUnc('0.001'), { abs: 0.001, dp: 3 });
  eq('readUnc("±0.5")', G.readUnc('±0.5'), { abs: 0.5, dp: 1 });
  eq('readUnc("2%")', G.readUnc('2%'), { pct: 2 });
  eq('readUnc("")', G.readUnc(''), null);
  eq('readUnc("x")', G.readUnc('x'), { bad: true });
  close('uncOf 2% of 50', G.uncOf({ pct: 2 }, 50), 1);

  // Repeated trials: half the range, or the reading uncertainty if larger
  const m1 = G.meanOf(['12.71', '12.66', '12.74'], { abs: 0.01 });
  close('mean of 12.71, 12.66, 12.74', m1.v, 12.703333333);
  close('half range of 12.71, 12.66, 12.74', m1.u, 0.04);
  const m2 = G.meanOf(['2.00', '2.00', '2.01'], { abs: 0.01 });
  close('reading uncertainty wins when larger', m2.u, 0.01);
  eq('reading uncertainty used', m2.used, 'reading');
  eq('mean of blanks', G.meanOf(['', ' '], null), null);

  // Rounding (Skills page, section 6)
  eq('roundPair(1.6129, 0.026)', G.roundPair(1.6129, 0.026), { v: '1.61', u: '0.03', dp: 2, exp: 0 });
  eq('roundPair(9.748, 0.278)', G.roundPair(9.748, 0.278), { v: '9.7', u: '0.3', dp: 1, exp: 0 });
  eq('roundPair(14.234, 0.118, 2 s.f.)', G.roundPair(14.234, 0.118, 2), { v: '14.23', u: '0.12', dp: 2, exp: 0 });
  eq('roundPair(9.75, 0.096): 0.096 -> 0.1', G.roundPair(9.75, 0.096), { v: '9.8', u: '0.1', dp: 1, exp: 0 });
  eq('roundPair(1234, 34)', G.roundPair(1234, 34), { v: '1230', u: '30', dp: -1, exp: 0 });
  eq('roundPair(6.1e-7, 3e-8)', G.roundPair(6.12e-7, 3.1e-8), { v: '6.1', u: '0.3', dp: 1, exp: -7 });
  eq('pairText', G.pairText(1.6129, 0.026, 's²'), '(1.61 ± 0.03) s²');
  eq('half range 0.055 rounds up to 0.06', G.roundPair(12.693333, (12.74 - 12.63) / 2), { v: '12.69', u: '0.06', dp: 2, exp: 0 });
  eq('0.25 rounds up to 0.3', G.roundPair(3.125, 0.25), { v: '3.1', u: '0.3', dp: 1, exp: 0 });
  eq('sig(4.0412, 3)', G.sig(4.0412, 3), '4.04');
  eq('sig(0.000123456, 3)', G.sig(0.000123456, 3), '0.000123');
  eq('sig(-2, 3)', G.sig(-2, 3), '−2.00');
  eq('sig(1.5e7, 3)', G.sig(1.5e7, 3), '1.50 × 10⁷');

  // Units of a gradient
  eq('divideUnits(s^2, m)', G.divideUnits('s^2', 'm'), 's² m⁻¹');
  eq('divideUnits(V, A)', G.divideUnits('V', 'A'), 'V A⁻¹');
  eq('divideUnits(m, m)', G.divideUnits('m', 'm'), '');
  eq('divideUnits(N, m s^-1)', G.divideUnits('N', 'm s^-1'), 'N s m⁻¹');
  eq('divideUnits(m, s, 2)', G.divideUnits('m', 's', 2), 'm s⁻²');
  eq('divideUnits(J, , 1)', G.divideUnits('J', ''), 'J');
  eq('divideUnits(, s)', G.divideUnits('', 's'), 's⁻¹');

  // Formulas: values
  const syms = ['L', 't', 'T', 'T2', 'V', 'θ', 'tm'];
  const vals = { L: 0.4, t: 12.7, T: 1.27, T2: 1.6129, V: 2.5, θ: 30, tm: 12.7 };
  const ev = (src, opt) => { const f = G.compile(src, syms, opt); return f.ok ? f.eval(vals, { t: 0.04, T: 0.005, L: 0.001 }) : f.error; };
  close('1/T^2', ev('1/T^2'), 1 / 1.27 ** 2);
  close('ln(V)', ev('ln(V)'), Math.log(2.5));
  close('log(V)', ev('log(V)'), Math.log10(2.5));
  close('4pi^2L (implicit multiplication)', ev('4pi^2L'), 4 * Math.PI ** 2 * 0.4);
  close('(t/10)^2', ev('(t/10)^2'), 1.6129);
  close('T²  (superscript)', ev('T²'), 1.6129);
  close('T⁻¹  (superscript)', ev('T⁻¹'), 1 / 1.27);
  close('-T^2 is -(T^2)', ev('-T^2'), -1.6129);
  close('2^3^2 is 2^(3^2)', ev('2^3^2'), 512);
  close('sin(θ) in degrees', ev('sin(θ)'), 0.5);
  close('sin(θ) in radians', ev('sin(θ)', { radians: true }), Math.sin(30));
  close('asin(0.5) in degrees', ev('asin(0.5)'), 30);
  close('sqrt(L)', ev('sqrt(L)'), Math.sqrt(0.4));
  close('√(L)', ev('√(L)'), Math.sqrt(0.4));
  close('T2 is one symbol, not T×2', ev('T2'), 1.6129);
  close('2*(Δt/t)*T2', ev('2*(Δt/t)*T2'), 2 * 0.04 / 12.7 * 1.6129);
  close('dt means Δt', ev('2*(dt/t)*T2'), 2 * 0.04 / 12.7 * 1.6129);
  close('3 × 2 ÷ 4', ev('3 × 2 ÷ 4'), 1.5);
  close('e^2 (constant e)', ev('e^2'), Math.E ** 2);
  // Formulas: errors (never run as code)
  for (const bad of ['', 'L +', '(L', 'L)', 'x', 'alert(1)', 'sin L', '2 3', 'Δ', 'L ** 2']) {
    const f = G.compile(bad, syms);
    if (f.ok) failures.push(`formula "${bad}" should give an error`);
  }
  eq('uses of 2*(Δt/t)*T2', G.compile('2*(Δt/t)*T2', syms).uses, { v: ['t', 'T2'], u: ['t'] });
  // Writing a formula with numbers substituted (worked example)
  const f1 = G.compile('2*(Δt/t)*T2', syms);
  eq('text with symbols', f1.text({ v: (s) => s, u: (s) => 'Δ' + s }), '2 × (Δt / t) × T2');
  eq('text with numbers', f1.text({ v: (s) => String(vals[s]), u: () => '0.04', numbers: true }), '2 × (0.04 / 12.7) × 1.6129');
  eq('latex', G.compile('1/T^2', syms).latex({ v: (s) => s, u: (s) => '\\Delta ' + s }), '\\dfrac{1}{{T}^{2}}');

  // Max–min method agrees with the rules for a power and for a product
  const sq = G.compile('T^2', syms);
  const mm = G.maxMin(sq, { T: 1.27 }, { T: 0.01 });
  close('max–min for T^2', mm.u, ((1.28 ** 2) - (1.26 ** 2)) / 2);
  close('max–min ≈ rule for T^2', mm.u, 2 * 0.01 / 1.27 * 1.27 ** 2, 1e-3);
  const g = G.compile('4pi^2L/T^2', syms);
  const mg = G.maxMin(g, { L: 0.8, T: 1.8 }, { L: 0.005, T: 0.02 });
  close('max–min for g (Skills page example, about 0.3)', mg.u, 0.27, 0.06);

  // Fits recover known curves
  const xs = [1, 2, 3, 4, 5, 6];
  const pts = (f) => xs.map((x) => ({ x, y: f(x) }));
  const L1 = G.fit('linear', pts((x) => 2.5 * x - 1));
  close('linear gradient', L1.params.m, 2.5); close('linear intercept', L1.params.c, -1);
  const Q = G.fit('quadratic', pts((x) => 0.3 * x * x - 2 * x + 7));
  close('quadratic a', Q.params.a, 0.3); close('quadratic b', Q.params.b, -2); close('quadratic c', Q.params.c, 7);
  const Qbig = G.fit('quadratic', [1000, 1001, 1002, 1003].map((x) => ({ x, y: 2 * x * x + 3 })));
  close('quadratic with large x', Qbig.f(1001.5), 2 * 1001.5 ** 2 + 3, 1e-9);
  const P = G.fit('power', pts((x) => 3 * Math.pow(x, -1.5)));
  close('power a', P.params.a, 3, 1e-6); close('power n', P.params.n, -1.5, 1e-6);
  const E = G.fit('exponential', pts((x) => 50 * Math.exp(-0.4 * x)));
  close('exponential a', E.params.a, 50, 1e-6); close('exponential b', E.params.b, -0.4, 1e-6);
  // A noisy power law: the fit is least squares in y, so it beats the log-graph start
  const noisy = xs.map((x, i) => ({ x, y: 2 * x * x + [0.3, -0.4, 0.5, -0.2, 0.6, -0.5][i] }));
  const Pn = G.fit('power', noisy);
  const sse = (f) => noisy.reduce((s, p) => s + (p.y - f(p.x)) ** 2, 0);
  const logStart = G.fit('linear', noisy.map((p) => ({ x: Math.log(p.x), y: Math.log(p.y) }))).params;
  if (!(sse(Pn.f) <= sse((x) => Math.exp(logStart.c) * Math.pow(x, logStart.m)) + 1e-12)) failures.push('power fit is not least squares');
  eq('power fit refuses x = 0', G.fit('power', [{ x: 0, y: 1 }, { x: 1, y: 2 }]).ok, false);
  eq('exponential fit refuses mixed signs', G.fit('exponential', [{ x: 0, y: -1 }, { x: 1, y: 2 }]).ok, false);
  eq('linear fit refuses equal x', G.fit('linear', [{ x: 1, y: 1 }, { x: 1, y: 2 }]).ok, false);
  eq('quadratic needs 3 points', G.fit('quadratic', [{ x: 1, y: 1 }, { x: 2, y: 2 }]).ok, false);

  // Lines through uncertainty bars, and the extreme lines
  const bars = [{ x: 1, y: 2, dx: 0, dy: 0.2 }, { x: 2, y: 4, dx: 0, dy: 0.2 }, { x: 3, y: 6, dx: 0, dy: 0.2 }];
  eq('line y = 2x passes every bar', bars.every((p) => G.throughBar(2, 0, p)), true);
  eq('line y = 2.5x misses a bar', bars.every((p) => G.throughBar(2.5, 0, p)), false);
  const ex = G.extremes(bars);
  close('steepest gradient', ex.hi.m, 2.2); close('shallowest gradient', ex.lo.m, 1.8);

  // Ticks
  eq('ticks 0–1', G.ticks(0, 1, 5).list, [0, 0.2, 0.4, 0.6, 0.8, 1]);
  eq('ticks 0.35–0.85', G.ticks(0.35, 0.85, 5).list, [0.4, 0.5, 0.6, 0.7, 0.8]);

  return { failures, count: 0 };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { failures } = runTests();
  if (failures.length) { failures.forEach((f) => console.log('✗ ' + f)); process.exit(1); }
  console.log('✓ graph maker maths: all tests pass');
}
