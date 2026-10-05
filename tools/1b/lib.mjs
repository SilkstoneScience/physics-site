// Paper 1B datasets: shared maths for the generator, the validator and the tests.
// Seeded random numbers, rounding and significant figures, units, and straight-line fits.
// Plain Node, no packages.

// ---------- Seeded random numbers ----------
// The same seed always gives the same sequence, so a dataset only changes when its seed
// or its model is changed. (mulberry32: a small, widely used generator.)
export function makeRng(seed) {
  let a = seed >>> 0;
  function uniform() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  // Normal ("bell curve") random number with mean 0 and standard deviation 1 (Box–Muller).
  function gauss() {
    let u = 0;
    while (u === 0) u = uniform();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * uniform());
  }
  // Random count with the given mean, as in radioactive decay (Poisson distribution).
  function poisson(mean) {
    if (mean > 400) return Math.max(0, Math.round(mean + Math.sqrt(mean) * gauss()));
    const limit = Math.exp(-mean);
    let k = 0;
    let p = uniform();
    while (p > limit) { k++; p *= uniform(); }
    return k;
  }
  return { uniform, gauss, poisson };
}

// ---------- Rounding, decimal places and significant figures ----------
// Decimal places of a step such as 0.01 (2), 0.5 (1) or 10 (0).
export function decimalsOf(step) {
  const [mant, exp] = String(step).toLowerCase().split('e');
  return Math.max(0, (mant.split('.')[1] || '').length - Number(exp || 0));
}
// Rounds to the nearest multiple of `step` (an instrument's resolution).
export function roundTo(x, step) {
  return Number((Math.round(x / step) * step).toFixed(decimalsOf(step)));
}
export function onGrid(x, step) {
  const k = x / step;
  return Math.abs(k - Math.round(k)) < 1e-6;
}
// Fixed decimal places, with a proper minus sign and never "−0.00".
export function fmtNum(x, dp) {
  let s = x.toFixed(dp);
  if (/^-0\.?0*$/.test(s)) s = s.slice(1);
  return s.replace('-', '−');
}
// Rounds to n significant figures, e.g. sigFig(0.06372, 2) = "0.064", sigFig(1234, 2) = "1200".
export function sigFig(x, n) {
  if (x === 0) return '0';
  const r = Number(x.toPrecision(n));
  const p = Math.floor(Math.log10(Math.abs(r)));
  return fmtNum(r, Math.max(0, n - 1 - p));
}
// Reads a number written by fmtNum or sigFig (accepts "−" as a minus sign).
export function parseNum(text) {
  const t = String(text).trim().replace(/−/g, '-');
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}
export const dpOf = (text) => ((String(text).match(/\.(\d+)$/) || [])[1] || '').length;
// Significant figures written in a number such as "0.010" (2) or "0.4" (1).
export function sigFigsIn(text) {
  const t = String(text).replace(/^[−-]/, '');
  const digits = t.replace('.', '').replace(/^0+/, '');
  return t.includes('.') ? digits.length : digits.replace(/0+$/, '').length;
}

// ---------- Units ----------
// Each unit: [size in SI units, powers of the SI base units m, kg, s, A, K].
const BASE_UNITS = {
  m: [1, [1, 0, 0, 0, 0]], cm: [1e-2, [1, 0, 0, 0, 0]], mm: [1e-3, [1, 0, 0, 0, 0]],
  kg: [1, [0, 1, 0, 0, 0]], g: [1e-3, [0, 1, 0, 0, 0]],
  s: [1, [0, 0, 1, 0, 0]], ms: [1e-3, [0, 0, 1, 0, 0]], min: [60, [0, 0, 1, 0, 0]],
  A: [1, [0, 0, 0, 1, 0]], mA: [1e-3, [0, 0, 0, 1, 0]],
  K: [1, [0, 0, 0, 0, 1]],
  N: [1, [1, 1, -2, 0, 0]], mN: [1e-3, [1, 1, -2, 0, 0]],
  J: [1, [2, 1, -2, 0, 0]], W: [1, [2, 1, -3, 0, 0]],
  V: [1, [2, 1, -3, -1, 0]], mV: [1e-3, [2, 1, -3, -1, 0]],
  'Ω': [1, [2, 1, -3, -2, 0]],
  T: [1, [0, 1, -2, -1, 0]], mT: [1e-3, [0, 1, -2, -1, 0]],
  Hz: [1, [0, 0, -1, 0, 0]], Pa: [1, [-1, 1, -2, 0, 0]], kPa: [1e3, [-1, 1, -2, 0, 0]],
  '%': [0.01, [0, 0, 0, 0, 0]],
};
const SUPERSCRIPT = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

// Reads a unit written like "g A^-1" or "m s^-2" ("" = no unit). Returns its size in SI units,
// its dimensions, a plain-text version ("g A⁻¹") and a MathJax version ("$\text{g}\,\text{A}^{-1}$").
export function parseUnit(expr = '') {
  const factors = expr.trim() ? expr.trim().split(/\s+/).map((tok) => {
    const m = tok.match(/^([^^]+)(?:\^(-?\d+))?$/);
    if (!m || !(m[1] in BASE_UNITS)) throw new Error(`unknown unit "${tok}" in "${expr}"`);
    return [m[1], m[2] ? Number(m[2]) : 1];
  }) : [];
  let scale = 1;
  const dim = [0, 0, 0, 0, 0];
  for (const [u, p] of factors) {
    const [s, d] = BASE_UNITS[u];
    scale *= s ** p;
    d.forEach((x, i) => { dim[i] += x * p; });
  }
  const text = factors.map(([u, p]) => u + (p === 1 ? '' : [...String(p)].map((c) => SUPERSCRIPT[c]).join(''))).join(' ');
  const tex = factors.length
    ? '$' + factors.map(([u, p]) => (u === '%' ? '\\%' : `\\text{${u}}`) + (p === 1 ? '' : `^{${p}}`)).join('\\,') + '$'
    : '';
  return { expr, scale, dim, text, tex };
}
export const sameDim = (a, b) => a.every((x, i) => Math.abs(x - b[i]) < 1e-9);
export const addDim = (a, b, k = 1) => a.map((x, i) => x + k * b[i]);

// ---------- Straight-line fits ----------
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;

// Least-squares line of best fit y = m x + c, with r² (1 = perfectly straight).
export function linearFit(xs, ys) {
  if (xs.length < 2) throw new Error('a fit needs at least two points');
  const mx = mean(xs);
  const my = mean(ys);
  let sxx = 0, sxy = 0, syy = 0;
  xs.forEach((x, i) => {
    sxx += (x - mx) ** 2;
    sxy += (x - mx) * (ys[i] - my);
    syy += (ys[i] - my) ** 2;
  });
  const m = sxy / sxx;
  return { m, c: my - m * mx, r2: syy === 0 ? 1 : (sxy * sxy) / (sxx * syy), n: xs.length };
}

// Steepest and shallowest straight lines that pass through every error bar (the IB "max/min
// gradient" lines), and the range of intercepts allowed. points: [{ x, y, ex, ey }].
// Every allowed line meets the conditions  y − ey ≤ (line at x) ≤ y + ey  (error boxes when ex > 0),
// so the allowed (m, c) pairs form a polygon; its corners are where two conditions meet.
// Returns null if no straight line passes through every error bar.
export function gradientBand(points) {
  const s = Math.sign(linearFit(points.map((p) => p.x), points.map((p) => p.y)).m) || 1;
  // Each condition: c ≤ a − m·b (upper) or c ≥ a − m·b (lower).
  const cons = points.flatMap((p) => [
    { a: p.y + p.ey, b: p.x - s * (p.ex || 0), upper: true },
    { a: p.y - p.ey, b: p.x + s * (p.ex || 0), upper: false },
  ]);
  const allowed = (m, c) => cons.every((k) => {
    const v = k.a - m * k.b;
    const tol = 1e-9 * (Math.abs(v) + Math.abs(c) + 1);
    return k.upper ? c <= v + tol : c >= v - tol;
  });
  const corners = [];
  for (let i = 0; i < cons.length; i++) {
    for (let j = i + 1; j < cons.length; j++) {
      if (Math.abs(cons[i].b - cons[j].b) < 1e-12) continue;
      const m = (cons[i].a - cons[j].a) / (cons[i].b - cons[j].b);
      const c = cons[i].a - m * cons[i].b;
      if (allowed(m, c)) corners.push({ m, c });
    }
  }
  if (!corners.length) return null;
  const by = (f, pick) => corners.reduce((best, k) => (pick(f(k), f(best)) ? k : best));
  const steep = by((k) => k.m, (a, b) => a > b);
  const shallow = by((k) => k.m, (a, b) => a < b);
  return {
    mMax: steep.m, mMin: shallow.m, steep, shallow,
    cMax: by((k) => k.c, (a, b) => a > b).c, cMin: by((k) => k.c, (a, b) => a < b).c,
  };
}

export function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
export const stripTags = (s) => String(s).replace(/<[^>]*>/g, '');
export const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
