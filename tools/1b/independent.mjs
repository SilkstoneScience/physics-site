// Independent physics audit for Paper 1B datasets.
//
// This file deliberately does NOT use the generator's physics or maths: it imports nothing from
// laws.mjs, lib.mjs, the generator's units, fits or rounding. Each dataset's physics is written again
// here from first principles, with its own unit table, dimension algebra, straight-line fits and
// max/min lines, and its own reading of the published table. It then checks the dataset against it:
//   1. dimensions   every term of the independent formula has the output's dimensions (and arguments of
//                   exponentials are dimensionless); the formula matches its declared structure numerically
//   2. limits       limiting cases of the independent formula
//   3. model        the generator's noise-free values equal the independent physics (1 part in 10⁹)
//   4. magnitude    the independent physics gives values in a realistic range
//   5. data         the PUBLISHED values scatter fairly about the independent physics (no bias), given the
//                   declared noise and any declared systematic effect
//   6. recovery     the true parameters are recovered from the published table within the max/min range,
//                   and the published answers are recalculated independently
// It reads the dataset's declared parameter values, units and noise (the inputs to be audited) and the
// generator's OUTPUT, never its equations. Every dataset must have an audit here to pass validation.
import { generateRows } from './generate.mjs'; // used only to obtain the generator's output to audit

// ---------- Own units: SI scale and dimensions [m, kg, s, A, K] ----------
const U = {
  '': [1, [0, 0, 0, 0, 0]], m: [1, [1, 0, 0, 0, 0]], cm: [0.01, [1, 0, 0, 0, 0]], kg: [1, [0, 1, 0, 0, 0]], g: [0.001, [0, 1, 0, 0, 0]],
  s: [1, [0, 0, 1, 0, 0]], A: [1, [0, 0, 0, 1, 0]], N: [1, [1, 1, -2, 0, 0]], T: [1, [0, 1, -2, -1, 0]],
  V: [1, [2, 1, -3, -1, 0]], 'Ω': [1, [2, 1, -3, -2, 0]], Hz: [1, [0, 0, -1, 0, 0]], J: [1, [2, 1, -2, 0, 0]],
  W: [1, [2, 1, -3, 0, 0]], Pa: [1, [-1, 1, -2, 0, 0]], kPa: [1000, [-1, 1, -2, 0, 0]], mm: [0.001, [1, 0, 0, 0, 0]],
  km: [1000, [1, 0, 0, 0, 0]], day: [86400, [0, 0, 1, 0, 0]], K: [1, [0, 0, 0, 0, 1]], 'ΔK': [1, [0, 0, 0, 0, 1]],
  'Δ°C': [1, [0, 0, 0, 0, 1]], '°C': [1, [0, 0, 0, 0, 1]],
  // Batch 2: own values (CODATA / SI definitions), not the generator's table.
  'µm': [1e-6, [1, 0, 0, 0, 0]], nm: [1e-9, [1, 0, 0, 0, 0]], C: [1, [0, 0, 1, 1, 0]], h: [3600, [0, 0, 1, 0, 0]],
  eV: [1.602176634e-19, [2, 1, -2, 0, 0]], GWh: [3.6e12, [2, 1, -2, 0, 0]], MW: [1e6, [2, 1, -3, 0, 0]],
  lm: [1, [2, 1, -3, 0, 0]], lx: [1, [0, 1, -3, 0, 0]], '%': [0.01, [0, 0, 0, 0, 0]],
};
// A lone °C is a temperature on the Celsius scale: to kelvin by adding 273.15 (its own constant, not the generator's).
function unit(expr) {
  let scale = 1;
  const dim = [0, 0, 0, 0, 0];
  const toks = String(expr || '').trim().split(/\s+/).filter(Boolean);
  for (const tok of toks) {
    const [name, pow = '1'] = tok.split('^');
    if (!U[name]) throw new Error(`independent audit: unit "${name}" isn't in its own table`);
    scale *= U[name][0] ** Number(pow);
    U[name][1].forEach((x, i) => { dim[i] += x * Number(pow); });
  }
  return { scale, dim, offset: toks.length === 1 && toks[0] === '°C' ? 273.15 : 0 };
}
const toSIa = (value, expr) => { const u = unit(expr); return value * u.scale + u.offset; };
const dimOf = (powers, dims) => Object.entries(powers).reduce((acc, [k, pw]) => acc.map((x, i) => x + dims[k][i] * pw), [0, 0, 0, 0, 0]);
const sameDims = (a, b) => a.every((x, i) => Math.abs(x - b[i]) < 1e-9);

// ---------- Own fits ----------
function fitLine(x, y) {
  const n = x.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; sxx += x[i] * x[i]; sxy += x[i] * y[i]; }
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { m, c: (sy - m * sx) / n };
}
// Steepest/shallowest lines: try every line through two corners of the error boxes; keep those that pass every box.
function maxMin(x, y, ex, ey) {
  const pts = [];
  x.forEach((xi, i) => { for (const dx of [-ex[i], ex[i]]) for (const dy of [-ey[i], ey[i]]) pts.push([xi + dx, y[i] + dy]); });
  let best = null;
  for (const a of pts) {
    for (const b of pts) {
      if (a[0] === b[0]) continue;
      const m = (b[1] - a[1]) / (b[0] - a[0]);
      const c = a[1] - m * a[0];
      const ok = x.every((xi, i) => {
        const lo = m * (xi - ex[i]) + c;
        const hi = m * (xi + ex[i]) + c;
        return Math.max(lo, hi) >= y[i] - ey[i] - 1e-12 && Math.min(lo, hi) <= y[i] + ey[i] + 1e-12;
      });
      if (ok) {
        best = best || { mMin: m, mMax: m, cMin: c, cMax: c };
        best.mMin = Math.min(best.mMin, m); best.mMax = Math.max(best.mMax, m);
        best.cMin = Math.min(best.cMin, c); best.cMax = Math.max(best.cMax, c);
      }
    }
  }
  return best;
}

// ---------- Own reading of the published question ----------
// Data without a student table (a sensor trace, an instrument scale): read back from the drawings themselves, with this file's
// own parsing. Each axis (or scale) is mapped from its two outermost labels; values are read from the drawn positions.
function ownScale(labels) {
  const s = [...labels].sort((a, b) => a.px - b.px);
  const [a, b] = [s[0], s[s.length - 1]];
  return (px) => a.v + ((px - a.px) * (b.v - a.v)) / (b.px - a.px);
}
function readFigures(q, def, rows) {
  const num = (s) => Number(String(s).replace('−', '-'));
  const figs = [...q.data.filter((x) => x.kind === 'figure'), ...q.parts.flatMap((p) => [p.figure, p.msFigure]).filter((f) => f && f.svg)];
  for (const r of (def.tableless && def.tableless.readFrom) || []) {
    const f = figs.find((x) => x.figure === r.figure);
    if (!f) continue;
    if (/data-graph=/.test(f.svg)) {
      const X = ownScale([...f.svg.matchAll(/<text class="tx" x="([-\d.]+)"[^>]*>([^<]+)<\/text>/g)].map((m) => ({ px: +m[1], v: num(m[2]) })));
      const Y = ownScale([...f.svg.matchAll(/<text class="ty" x="[-\d.]+" y="([-\d.]+)"[^>]*>([^<]+)<\/text>/g)].map((m) => ({ px: +m[1], v: num(m[2]) })));
      const tr = f.svg.match(/data-trace="1" points="([^"]*)" data-rows="([^"]*)"/);
      if (tr) {
        const pts = tr[1].split(' ').map((s) => s.split(',').map(Number));
        tr[2].split(' ').map(Number).forEach((row, j) => {
          rows[row] = rows[row] || {};
          rows[row][def.graph.x] = X(pts[j][0]);
          rows[row][def.graph.y] = Y(pts[j][1]);
        });
      }
      for (const m of f.svg.matchAll(/<circle class="f1 pt" cx="([-\d.]+)" cy="([-\d.]+)" r="[\d.]+" data-row="(\d+)"\/>/g)) {
        rows[+m[3]] = rows[+m[3]] || {};
        rows[+m[3]][def.graph.x] = X(+m[1]);
        rows[+m[3]][def.graph.y] = Y(+m[2]);
      }
    } else {
      // An instrument scale: labels <text class="sx" x=…>, marks <line … data-mark="row" x1=…>.
      const S = ownScale([...f.svg.matchAll(/<text class="sx" x="([-\d.]+)"[^>]*>([^<]+)<\/text>/g)].map((m) => ({ px: +m[1], v: num(m[2]) })));
      for (const m of f.svg.matchAll(/data-mark="(\d+)" x1="([-\d.]+)"/g)) {
        rows[+m[1]] = rows[+m[1]] || {};
        for (const c of r.columns) rows[+m[1]][c] = S(+m[2]);
      }
    }
  }
  return rows;
}

function readPublished(q, def) {
  const num = (s) => Number(String(s).replace('−', '-'));
  const rows = [];
  const unc = [];
  const main = q.data.find((x) => x.kind === 'table' && x.figure !== 'trials');
  if (!main) {
    const answers = Object.fromEntries(q.parts.filter((pt) => pt.numeric).map((pt) => [pt.label, pt.numeric.answer]));
    return { rows: readFigures(q, def, rows), unc, trials: null, answers, stem: q.stem, fromFigures: true };
  }
  for (const m of main.html.matchAll(/<td data-col="(\w+)" data-row="(\d+)"( data-unc="1")?[^>]*>([^<]*)<\/td>/g)) {
    const store = m[3] ? unc : rows;
    store[+m[2]] = store[+m[2]] || {};
    store[+m[2]][m[1]] = m[4] === '?' ? null : num(m[4]);
  }
  const t = q.data.find((x) => x.figure === 'trials');
  const trials = t ? [...t.html.matchAll(/data-trial="\d+">([^<]*)</g)].map((m) => num(m[1])) : null;
  const answers = Object.fromEntries(q.parts.filter((pt) => pt.numeric).map((pt) => [pt.label, pt.numeric.answer]));
  const labels = [...main.html.matchAll(/<th scope="row">([^<]*)<\/th>/g)].map((m) => m[1]); // row names (a planet, a year)
  return { rows, unc, trials, answers, stem: q.stem, labels };
}

// Declared systematic effects, applied independently (in SI units of the column).
function ownSystematic(effects, v, rowSI, colScale) {
  for (const e of effects || []) {
    if (e.type === 'zero-offset') v += e.offset * colScale;
    else if (e.type === 'calibration') v *= e.factor;
    else if (e.type === 'drift') v += e.rate * colScale * rowSI[e.driver.split('.')[1]];
    else if (e.type === 'heat-loss') v *= 1 - e.k * rowSI[e.driver.split('.')[1]];
  }
  return v;
}

// ---------- The independent physics of each dataset (all in SI units) ----------
// columns: { col: { model(v) → SI value, terms: [powers of each term], dimensionless: [powers inside exp/sin…],
//            exact: true if model(v) is exactly the sum of its terms (coef × product of powers) } }
// v holds every parameter and the row's columns, in SI.
const ln2 = Math.log(2);
export const AUDITS = {
  'D3-B01': {
    derivation: 'Wire ⊥ field: F = BIL; Newton\'s third law pushes the magnet down by F; the balance shows F/g. So Δm = BIL/g.',
    columns: { m: { model: (v) => (v.B * v.I * v.L) / v.g, terms: [{ coef: 1, powers: { B: 1, I: 1, L: 1, g: -1 } }], exact: true } },
    limits: [
      { name: 'no current, no change in reading', check: (f, v) => f({ ...v, I: 0 }) === 0 },
      { name: 'reversing the current reverses the change', check: (f, v) => Math.abs(f({ ...v, I: -v.I }) + f(v)) < 1e-15 },
      { name: 'Δm ∝ I', check: (f, v) => Math.abs(f({ ...v, I: 2 * v.I }) - 2 * f(v)) < 1e-12 * Math.abs(f(v)) },
    ],
    magnitude: { m: [5e-5, 5e-3] }, // kg: 0.05 g to 5 g
    recover(pub, P) {
      const x = pub.rows.map((r) => r.I);
      const y = pub.rows.map((r) => r.m * 1e-3);
      const k = fitLine(x, y).m;
      const b = maxMin(x, y, x.map(() => 0), x.map(() => 0.02e-3));
      const toB = (kk) => (kk * P.g) / P.L;
      return {
        params: [{ name: 'B', estimate: toB(k), range: [toB(b.mMin), toB(b.mMax)], truth: P.B }],
        answers: [{ part: 'b', value: k * 1e3 }, { part: 'c', value: toB(k) }],
      };
    },
  },

  'B5-B01': {
    derivation: 'Energy per coulomb around the loop: ε = IR + Ir, and the terminal p.d. is V = IR, so V = ε − Ir.',
    columns: { V: { model: (v) => v.emf - v.I * v.r, terms: [{ coef: 1, powers: { emf: 1 } }, { coef: -1, powers: { I: 1, r: 1 } }], exact: true } },
    limits: [
      { name: 'open circuit: V = ε', check: (f, v) => f({ ...v, I: 0 }) === v.emf },
      { name: 'short circuit (I = ε/r): V = 0', check: (f, v) => Math.abs(f({ ...v, I: v.emf / v.r })) < 1e-12 },
    ],
    magnitude: { V: [0.5, 1.7] },
    recover(pub, P, def) {
      const keep = pub.rows.map((_, i) => i).filter((i) => !(def.graph.exclude || []).includes(i));
      const x = keep.map((i) => pub.rows[i].I);
      const y = keep.map((i) => pub.rows[i].V);
      const fit = fitLine(x, y);
      const b = maxMin(x, y, x.map(() => 0), x.map(() => 0.01));
      return {
        params: [
          { name: 'emf', estimate: fit.c, range: [b.cMin, b.cMax], truth: P.emf },
          { name: 'r', estimate: -fit.m, range: [-b.mMax, -b.mMin], truth: P.r },
        ],
        answers: [{ part: 'b', value: fit.c }, { part: 'c', value: -fit.m }, { part: 'd', value: (0.01 / pub.rows[7].V) * 100 }],
      };
    },
  },

  'C4-B01': {
    derivation: 'Nodes at both ends, so the first harmonic has λ = 2L; v = √(T/μ) with T = Mg; f = v/λ = (1/2L)√(Mg/μ).',
    columns: { f: { model: (v) => Math.sqrt((v.M * v.g) / v.mu) / (2 * v.L), terms: [{ coef: 0.5, powers: { L: -1, M: 0.5, g: 0.5, mu: -0.5 } }], exact: true } },
    limits: [
      { name: 'doubling L halves f', check: (f, v) => Math.abs(f({ ...v, L: 2 * v.L }) - f(v) / 2) < 1e-12 * f(v) },
      { name: 'four times the hanging mass doubles f', check: (f, v) => Math.abs(f({ ...v, M: 4 * v.M }) - 2 * f(v)) < 1e-12 * f(v) },
      { name: 'a heavier string (4μ) halves f', check: (f, v) => Math.abs(f({ ...v, mu: 4 * v.mu }) - f(v) / 2) < 1e-12 * f(v) },
    ],
    magnitude: { f: [10, 60] },
    recover(pub, P) {
      const x = pub.rows.map((r) => 1 / r.L);
      const y = pub.rows.map((r) => r.f);
      const fit = fitLine(x, y);
      const b = maxMin(x, y, pub.rows.map((r) => 0.002 / r.L ** 2), x.map(() => 0.5));
      const toMu = (k) => (P.M * P.g) / (4 * k * k);
      return {
        params: [{ name: 'mu', estimate: toMu(fit.m), range: [toMu(b.mMax), toMu(b.mMin)], truth: P.mu }],
        answers: [{ part: 'c', value: fit.m }, { part: 'd', value: toMu(fit.m) }, { part: 'f', value: 3 * (fit.m / 0.8 + fit.c) }, { part: 'e', value: (0.002 / 0.5) * 100 }],
      };
    },
  },

  'A1-B01': {
    derivation: 'Vertical: h = ½gt², so t = √(2h/g); horizontal: R = ut; so R = u√(2h/g) and R² = (2u²/g)h.',
    columns: { R: { model: (v) => v.u * Math.sqrt((2 * v.h) / v.g), terms: [{ coef: Math.SQRT2, powers: { u: 1, h: 0.5, g: -0.5 } }], exact: true } },
    limits: [
      { name: 'launched from the floor (h = 0): R = 0', check: (f, v) => f({ ...v, h: 0 }) === 0 },
      { name: 'four times the height doubles the range', check: (f, v) => Math.abs(f({ ...v, h: 4 * v.h }) - 2 * f(v)) < 1e-12 * f(v) },
      { name: 'dropped (u = 0): R = 0', check: (f, v) => f({ ...v, u: 0 }) === 0 },
    ],
    magnitude: { R: [0.3, 2] },
    recover(pub, P) {
      const row = 2;
      const mean = pub.trials.reduce((a, b) => a + b, 0) / pub.trials.length;
      const half = (Math.max(...pub.trials) - Math.min(...pub.trials)) / 2;
      const R = pub.rows.map((r, i) => (i === row ? Number(mean.toFixed(3)) : r.R));
      const dR = pub.unc.map((r, i) => (i === row ? Number(half.toFixed(3)) : r.R));
      const x = pub.rows.map((r) => r.h);
      const y = R.map((r) => r * r);
      const fit = fitLine(x, y);
      const b = maxMin(x, y, x.map(() => 0.005), R.map((r, i) => 2 * r * dR[i]));
      const toU = (k) => Math.sqrt((P.g * k) / 2);
      return {
        params: [{ name: 'u', estimate: toU(fit.m), range: [toU(b.mMin), toU(b.mMax)], truth: P.u }],
        answers: [{ part: 'b', value: mean }, { part: 'c', value: half }, { part: 'e', value: fit.m }, { part: 'f', value: toU(fit.m) }],
      };
    },
  },

  'E3-B01': {
    derivation: 'Activity falls as e^(−λt), λ = ln 2 / T½; counts in [t, t + Δt] are the rate integrated over the interval: '
      + 'N = (R₀/λ) e^(−λt) (1 − e^(−λΔt)) + bΔt. The background count is b × t_b.',
    columns: {
      N: {
        // (1 − e^(−λΔt)) written as −expm1(−λΔt) so it stays accurate when Δt ≪ T½
        model: (v) => { const lam = ln2 / v.T; return (v.R0 / lam) * Math.exp(-lam * v.t) * -Math.expm1(-lam * v.dt) + v.bg * v.dt; },
        terms: [{ coef: 1, powers: { R0: 1, T: 1 } }, { coef: 1, powers: { bg: 1, dt: 1 } }],
        dimensionless: [{ t: 1, T: -1 }, { dt: 1, T: -1 }],
      },
    },
    singles: { Nb: { model: (v) => v.bg * v.tb, terms: [{ coef: 1, powers: { bg: 1, tb: 1 } }], exact: true } },
    limits: [
      { name: 'a very long half-life gives (R₀ + b)Δt', check: (f, v) => Math.abs(f({ ...v, T: 1e12 }) - (v.R0 + v.bg) * v.dt) < 1e-6 },
      { name: 'one half-life later, half the source counts', check: (f, v) => Math.abs((f({ ...v, t: v.t + v.T }) - v.bg * v.dt) - (f(v) - v.bg * v.dt) / 2) < 1e-9 },
      { name: 'a very short interval gives rate × Δt', check: (f, v) => Math.abs(f({ ...v, t: 0, dt: 1e-6, bg: 0 }) / 1e-6 - v.R0) < 1e-3 },
    ],
    magnitude: { N: [10, 1000], Nb: [30, 300] },
    recover(pub, P) {
      const Nb = Number((pub.stem.match(/recorded (\d+) counts/) || [])[1]);
      const R = pub.rows.map((r) => (r.N - (Nb * P.dt) / P.tb) / P.dt);
      const ok = R.map((v, i) => i).filter((i) => R[i] > 0);
      const fit = fitLine(ok.map((i) => pub.rows[i].t), ok.map((i) => Math.log(R[i])));
      const half = ln2 / -fit.m;
      return {
        params: [{ name: 'T', estimate: half, range: [half * 0.88, half * 1.12], truth: P.T }],
        answers: [{ part: 'b', value: R[7] }, { part: 'c', value: half }],
      };
    },
  },
  // ===================== Batch 1 =====================
  'B1-B01': {
    derivation: 'All the electrical energy VIt stays in the block: VIt = mc(θ − θ₀), so θ = θ₀ + VIt/(mc).',
    columns: {
      theta: {
        model: (v) => v.theta0 + (v.V * v.I * v.t) / (v.m * v.c),
        terms: [{ coef: 1, powers: { theta0: 1 } }, { coef: 1, powers: { V: 1, I: 1, t: 1, m: -1, c: -1 } }], exact: true,
      },
    },
    limits: [
      { name: 'no heating time: the starting temperature', check: (f, v) => f({ ...v, t: 0 }) === v.theta0 },
      { name: 'twice the mass halves the temperature rise', check: (f, v) => Math.abs((f({ ...v, t: 600, m: 2 * v.m }) - v.theta0) - (f({ ...v, t: 600 }) - v.theta0) / 2) < 1e-9 },
    ],
    magnitude: { theta: [285, 340] },
    recover(pub, P) {
      const r = pub.rows;
      const dT = r[5].theta - r[0].theta;
      const c = (P.V * P.I * r[5].t) / (P.m * dT);
      const frac = 0.1 / 12 + 0.05 / 4.2 + 1 / r[5].t + 0.001 / 1 + 1.0 / dT;
      return {
        params: [{ name: 'c', estimate: c, range: [c * (1 - frac), c * (1 + frac)], truth: P.c }],
        answers: [{ part: 'a', value: dT }, { part: 'b', value: 1.0 }, { part: 'c', value: c }],
        checks: [{ name: 'largest uncertainty', ok: 1.0 / dT > Math.max(0.1 / 12, 0.05 / 4.2, 1 / 600, 0.001), detail: 'ΔT should be the largest percentage uncertainty' }],
      };
    },
  },

  'A1-B02': {
    derivation: 'The card moves its own length L while the beam is blocked: t = L/v.',
    columns: { t: { model: (v) => v.L / v.v, terms: [{ coef: 1, powers: { L: 1, v: -1 } }], exact: true } },
    limits: [{ name: 'twice the speed halves the time', check: (f, v) => Math.abs(f({ ...v, v: 2 * v.v }) - f(v) / 2) < 1e-12 * f(v) }],
    magnitude: { t: [0.1, 0.4] },
    recover(pub, P, def) {
      const row = def.columns.t.anomaly.row;
      const all = pub.rows.map((r) => r.t);
      const kept = all.filter((_, i) => i !== row);
      const mean = kept.reduce((a, b) => a + b, 0) / kept.length;
      const spread = Math.max(...kept) - Math.min(...kept);
      const speed = P.L / mean;
      const frac = 0.001 / 0.1 + spread / 2 / mean;
      const meanAll = all.reduce((a, b) => a + b, 0) / all.length;
      return {
        params: [{ name: 'v', estimate: speed, range: [speed * (1 - frac), speed * (1 + frac)], truth: P.v }],
        answers: [{ part: 'c', value: mean }, { part: 'd', value: spread / 2 }, { part: 'e', value: speed }],
        checks: [
          { name: 'outlier', ok: Math.abs(all[row] - mean) > 3 * spread, detail: 'the outlying trial is not clearly separated from the others' },
          { name: 'effect of including the outlier', ok: P.L / meanAll > speed, detail: 'including the short time should raise the speed' },
        ],
      };
    },
  },

  'A2-B01': {
    derivation: 'True load = F + m_h g; Hooke\'s law x = (F + m_h g)/k = F/k + m_h g/k.',
    columns: {
      x: {
        model: (v) => (v.F + v.mh * v.g) / v.k,
        terms: [{ coef: 1, powers: { F: 1, k: -1 } }, { coef: 1, powers: { mh: 1, g: 1, k: -1 } }], exact: true,
      },
    },
    limits: [
      { name: 'each extra newton adds 1/k', check: (f, v) => Math.abs(f({ ...v, F: v.F + 1 }) - f(v) - 1 / v.k) < 1e-12 },
      { name: 'no hanger: proportional', check: (f, v) => Math.abs(f({ ...v, mh: 0, F: 2 * v.F }) - 2 * f({ ...v, mh: 0 })) < 1e-12 },
    ],
    magnitude: { x: [0.03, 0.15] },
    recover(pub, P) {
      const x = pub.rows.map((r) => r.F);
      const y = pub.rows.map((r) => r.x * 1e-3);
      const fit = fitLine(x, y);
      const b = maxMin(x, y, x.map(() => 0), x.map(() => 1e-3));
      const k = 1 / fit.m;
      const mh = (fit.c * k) / P.g;
      const mhs = [b.cMin / b.mMax, b.cMin / b.mMin, b.cMax / b.mMax, b.cMax / b.mMin].map((c) => c / P.g);
      const last = pub.rows[pub.rows.length - 1];
      return {
        params: [
          { name: 'k', estimate: k, range: [1 / b.mMax, 1 / b.mMin], truth: P.k },
          { name: 'mh', estimate: mh, range: [Math.min(...mhs), Math.max(...mhs)], truth: P.mh },
        ],
        answers: [{ part: 'b', value: k }, { part: 'd', value: mh }],
        checks: [
          { name: 'offset visible', ok: b.cMin > 0, detail: 'every line through the error bars should miss the origin' },
          { name: 'single reading underestimates k', ok: last.F / (last.x * 1e-3) < k, detail: 'F/x from one row should be smaller than k from the gradient' },
        ],
      };
    },
  },

  'B3-B01': {
    derivation: 'Constant volume: p/T constant, T in kelvin. p = p₀T/T₀ with T = θ + 273.15 (this audit\'s own Celsius offset).',
    columns: { p: { model: (v) => (v.p0 * v.theta) / v.T0, terms: [{ coef: 1, powers: { p0: 1, theta: 1, T0: -1 } }], exact: true } },
    limits: [
      { name: 'zero pressure at 0 K', check: (f, v) => f({ ...v, theta: 0 }) === 0 },
      { name: 'doubling T doubles p', check: (f, v) => Math.abs(f({ ...v, theta: 2 * v.theta }) - 2 * f(v)) < 1e-9 * f(v) },
    ],
    magnitude: { p: [9e4, 1.3e5] },
    recover(pub, P) {
      const x = pub.rows.map((r) => r.theta);
      const y = pub.rows.map((r) => r.p);
      const fit = fitLine(x, y);
      const b = maxMin(x, y, x.map(() => 0.5), x.map(() => 0.5));
      const abs = -fit.c / fit.m;
      const lo = -b.cMax / b.mMin;
      const hi = -b.cMin / b.mMax;
      const n = pub.rows.length - 1;
      return {
        // in kelvin, so the truth (absolute zero) is 0 K
        params: [{ name: 'absolute zero', estimate: abs + 273.15, range: [lo + 273.15, hi + 273.15], truth: P.thetaAbs }],
        answers: [{ part: 'c', value: abs }, { part: 'f', value: fit.m * 100 + fit.c }],
        checks: [
          { name: 'not proportional to θ in °C', ok: Math.abs(y[0] / x[0] - y[n] / x[n]) > 0.1 * (y[n] / x[n]), detail: 'p/θ should differ clearly between the first and last rows' },
          { name: 'accepted value inside the extrapolated range', ok: lo < -273 && hi > -273, detail: '−273 °C should lie between the extreme extrapolations' },
        ],
      };
    },
  },

  'C1-B01': {
    derivation: 'Mass on a spring with an effective spring mass mₑ: T = 2π√((m + mₑ)/k), so T² = (4π²/k)(m + mₑ).',
    columns: { T: { model: (v) => 2 * Math.PI * Math.sqrt((v.m + v.me) / v.k), terms: [{ coef: 1, powers: { m: 0.5, k: -0.5 } }], exact: false } },
    limits: [
      { name: 'massless spring: four times the mass doubles T', check: (f, v) => Math.abs(f({ ...v, me: 0, m: 4 * v.m }) - 2 * f({ ...v, me: 0 })) < 1e-12 },
      { name: 'stiffer spring (4k) halves T', check: (f, v) => Math.abs(f({ ...v, k: 4 * v.k }) - f(v) / 2) < 1e-12 },
    ],
    magnitude: { T: [0.5, 1.6] },
    recover(pub, P) {
      const m = pub.rows.map((r) => r.m);
      const T = pub.rows.map((r) => r.T);
      const y = T.map((t) => t * t);
      const fit = fitLine(m, y);
      const b = maxMin(m, y, m.map(() => 0), T.map((t) => 2 * t * 0.01));
      const k = (4 * Math.PI ** 2) / fit.m;
      return {
        params: [
          { name: 'k', estimate: k, range: [(4 * Math.PI ** 2) / b.mMax, (4 * Math.PI ** 2) / b.mMin], truth: P.k },
          { name: 'me', estimate: fit.c / fit.m, range: [b.cMin / b.mMax, b.cMax / b.mMin], truth: P.me },
        ],
        answers: [{ part: 'd', value: k }],
        checks: [
          { name: 'raw data not linear', ok: maxMin(m, T, m.map(() => 0), m.map(() => 0.01)) === null, detail: 'a straight line should not fit T against m' },
          { name: 'T² line misses the origin', ok: b.cMin > 0, detail: 'the spring\'s own mass should show as a positive T² intercept' },
        ],
      };
    },
  },

  'B1-B02': {
    derivation: 'mc dθ/dt = VI − h(θ − θ_r), θ(0) = θ_r: θ = θ_r + (VI/h)(1 − e^(−ht/(mc))).',
    columns: {
      theta: {
        model: (v) => v.thetaR + ((v.V * v.I) / v.h) * (1 - Math.exp((-v.h * v.t) / (v.m * v.c))),
        terms: [{ coef: 1, powers: { thetaR: 1 } }, { coef: 1, powers: { V: 1, I: 1, h: -1 } }], exact: false,
        dimensionless: [{ h: 1, t: 1, m: -1, c: -1 }],
      },
    },
    limits: [
      { name: 'tiny loss: the no-loss result', check: (f, v) => Math.abs(f({ ...v, h: 1e-9, t: 900 }) - (v.thetaR + (v.V * v.I * 900) / (v.m * v.c))) < 1e-4 },
      { name: 'losses make the water cooler than with no loss', check: (f, v) => f({ ...v, t: 900 }) < v.thetaR + (v.V * v.I * 900) / (v.m * v.c) },
    ],
    magnitude: { theta: [285, 330] },
    recover(pub, P) {
      const r = pub.rows;
      const cOf = (i) => (P.V * P.I * r[i].t) / (P.m * (r[i].theta - r[0].theta));
      const fOf = (i) => 0.1 / 12 + 0.05 / 3.5 + 1 / r[i].t + 0.001 / 0.4 + 0.2 / (r[i].theta - r[0].theta);
      const cW = cOf(6);
      const cF = cOf(1);
      return {
        params: [{ name: 'c (from the first 150 s)', estimate: cF, range: [cF * (1 - fOf(1)), cF * (1 + fOf(1))], truth: P.c }],
        answers: [{ part: 'b', value: cW }, { part: 'd', value: cF }],
        checks: [
          { name: 'heat loss makes c too large', ok: cW > P.c && cF > P.c && cW > cF, detail: 'losses should make both values too large, the whole-run value most' },
          { name: 'whole-run value excludes the accepted value', ok: cW * (1 - fOf(6)) > 4180, detail: 'the whole-run range should not reach 4180' },
          { name: 'rate of rise falls', ok: r[1].theta - r[0].theta > r[6].theta - r[5].theta, detail: 'the first interval should show the larger rise' },
        ],
      };
    },
  },

  'D1-B01': {
    derivation: 'Gravity provides the centripetal force: GMm/a² = m(2π/T)²a, so T = 2π a^{3/2}/√(GM).',
    columns: { T: { model: (v) => 2 * Math.PI * Math.sqrt(v.a ** 3 / (v.G * v.M)), terms: [{ coef: 2 * Math.PI, powers: { a: 1.5, G: -0.5, M: -0.5 } }], exact: true } },
    limits: [
      { name: 'four times the radius: eight times the period', check: (f, v) => Math.abs(f({ ...v, a: 4 * v.a }) - 8 * f(v)) < 1e-9 * f(v) },
      { name: 'four times the central mass halves the period', check: (f, v) => Math.abs(f({ ...v, M: 4 * v.M }) - f(v) / 2) < 1e-9 * f(v) },
    ],
    magnitude: { T: [2e4, 3e7] },
    recover(pub, P) {
      const x = pub.rows.map((r) => Math.log10(r.a));
      const y = pub.rows.map((r) => Math.log10(r.T));
      const fit = fitLine(x, y);
      const Ts = 10 ** (fit.m * 6 + fit.c) * 86400;
      const M = (4 * Math.PI ** 2 * (1e6 * 1000) ** 3) / (P.G * Ts * Ts);
      return {
        params: [{ name: 'M', estimate: M, range: [M * 0.92, M * 1.08], truth: P.M }],
        answers: [{ part: 'c', value: fit.m }, { part: 'e', value: M }],
        checks: [{ name: 'Kepler exponent', ok: Math.abs(fit.m - 1.5) < 0.01, detail: 'the log–log gradient should be 1.5 within 0.01' }],
      };
    },
  },

  'A2-B02': {
    derivation: 'Hooke\'s law x = F/k up to F_p; beyond it, the declared empirical yield term β(F − F_p)² is added.',
    columns: {
      x: {
        model: (v) => v.F / v.k + (v.F > v.Fp ? v.beta * (v.F - v.Fp) ** 2 : 0),
        terms: [{ coef: 1, powers: { F: 1, k: -1 } }, { coef: 1, powers: { beta: 1, F: 2 } }], exact: false,
      },
    },
    limits: [
      { name: 'below the limit: proportional', check: (f, v) => Math.abs(f({ ...v, F: 20 }) - 2 * f({ ...v, F: 10 })) < 1e-12 },
      { name: 'beyond the limit: more than Hooke\'s law', check: (f, v) => f({ ...v, F: v.Fp + 20 }) > (v.Fp + 20) / v.k },
    ],
    magnitude: { x: [5e-4, 1.2e-2] },
    recover(pub, P) {
      const lin = pub.rows.slice(0, 5);
      const x = lin.map((r) => r.F);
      const y = lin.map((r) => r.x * 1e-3);
      const fit = fitLine(x, y);
      const b = maxMin(x, y, x.map(() => 0), x.map(() => 0.05e-3));
      const k = 1 / fit.m;
      const beyond = pub.rows.slice(6);
      return {
        params: [{ name: 'k', estimate: k, range: [1 / b.mMax, 1 / b.mMin], truth: P.k }],
        answers: [{ part: 'b', value: k }],
        checks: [{
          name: 'Hooke\'s law fails beyond the limit',
          ok: beyond.every((r) => r.x * 1e-3 - 0.05e-3 > b.mMax * r.F + b.cMax),
          detail: 'every point beyond the limit should lie above the steepest line through the linear region by more than its error bar',
        }],
      };
    },
  },

  // ===================== Batch 2 (Phase 14) =====================
  'A3-B01': {
    derivation: 'At each peak the energy is all gravitational, mgh. If every impact keeps the same fraction r of it, mghₙ₊₁ = r·mghₙ, '
      + 'so hₙ₊₁ = rhₙ and hₙ = h₀rⁿ (m and g cancel).',
    columns: { h: { model: (v) => v.h0 * v.r ** v.n, terms: [{ coef: 1, powers: { h0: 1 } }], exact: false } },
    limits: [
      { name: 'n = 0 gives the release height', check: (f, v) => f({ ...v, n: 0 }) === v.h0 },
      { name: 'a perfectly elastic ball keeps its height', check: (f, v) => Math.abs(f({ ...v, r: 1, n: 6 }) - v.h0) < 1e-12 },
      { name: 'each bounce multiplies the height by r', check: (f, v) => Math.abs(f({ ...v, n: 3 }) / f({ ...v, n: 2 }) - v.r) < 1e-12 },
    ],
    magnitude: { h: [0.02, 2.5] },
    recover(pub, P) {
      const h = pub.rows.map((r) => r.h); // cm, as published
      const dh = 1.0; // the table heading's ±1.0 cm
      const rat = h.slice(1).map((x, i) => ({ v: x / h[i], u: (x / h[i]) * (dh / h[i] + dh / x) }));
      const mean = rat.reduce((s, x) => s + x.v, 0) / rat.length;
      const lo = Math.max(...rat.map((x) => x.v - x.u));
      const hi = Math.min(...rat.map((x) => x.v + x.u));
      const best = rat[0]; // the most precise ratio (largest heights)
      return {
        params: [{ name: 'r', estimate: best.v, range: [best.v - best.u, best.v + best.u], truth: P.r }],
        answers: [{ part: 'e', value: h[6] * ((lo + hi) / 2) }],
        checks: [
          { name: 'ratio constant within uncertainties', ok: lo <= hi, detail: 'some value should lie inside every ratio\'s uncertainty range' },
          { name: 'later ratios less certain', ok: rat[5].u > 5 * rat[0].u, detail: 'the last ratio should be far less precise than the first' },
          { name: 'energy dissipated at every bounce', ok: h.every((x, i) => i === 0 || x < h[i - 1]), detail: 'every peak should be lower than the one before' },
        ],
      };
    },
  },

  'D2-B01': {
    derivation: 'Stationary drop: electric force up = weight down, q(V/d) = mg with m = ρ(4/3)πr³ and q = ne, so the true p.d. is '
      + 'V = 4πr³ρgd/(3ne). The meter shows 1.03 times this (declared calibration effect).',
    columns: {
      V: { model: (v) => (4 * Math.PI * v.r ** 3 * v.rho * v.g * v.d) / (3 * v.n * v.e), terms: [{ coef: (4 * Math.PI) / 3, powers: { r: 3, rho: 1, g: 1, d: 1, n: -1, e: -1 } }], exact: true },
    },
    limits: [
      { name: 'twice the charge: half the p.d.', check: (f, v) => Math.abs(f({ ...v, n: 2 * v.n }) - f(v) / 2) < 1e-12 * f(v) },
      { name: 'twice the radius: eight times the p.d.', check: (f, v) => Math.abs(f({ ...v, r: 2 * v.r }) - 8 * f(v)) < 1e-9 * f(v) },
    ],
    magnitude: { V: [50, 400] },
    recover(pub, P) {
      const rows = pub.rows;
      const q = rows.map((x) => (4 * Math.PI * (x.r * 1e-6) ** 3 * P.rho * P.g * P.d) / (3 * x.V)); // C, from the readings
      const fr = rows.map((x) => (3 * 0.005) / x.r + 1 / x.V); // fractional uncertainty: 3Δr/r + ΔV/V
      const qMin = Math.min(...q);
      const n = q.map((x) => Math.round(x / qMin));
      const eRead = q.reduce((s, x) => s + x, 0) / n.reduce((s, x) => s + x, 0);
      const eTrue = eRead * 1.03; // the meter reads 3 % high, so every true charge is 3 % larger
      const fMean = fr.reduce((s, x) => s + x, 0) / fr.length;
      return {
        params: [{ name: 'e (after correcting the meter)', estimate: eTrue, range: [eTrue * (1 - fMean), eTrue * (1 + fMean)], truth: P.e }],
        answers: [{ part: 'c', value: (3 * 0.005 * 100) / rows[0].r }],
        checks: [
          { name: 'whole-number multiples', ok: q.every((x, i) => Math.abs(x - n[i] * eRead) <= fr[i] * x), detail: 'every charge should be within its uncertainty of a whole-number multiple of the best value' },
          { name: 'reading high makes e too small', ok: eRead < P.e && eTrue > eRead, detail: 'charges from a meter that reads high should be too small' },
          { name: 'more than one multiple present', ok: new Set(n).size >= 3, detail: 'the drops should carry at least three different numbers of charges' },
        ],
      };
    },
  },

  'C2-B01': {
    derivation: 'Pieces dx of a tube of length L emit P dx/L each. A piece at x from the middle is ρ = √(d² + x²) from the sensor, and its light '
      + 'arrives at angle θ with cos θ = d/ρ, so it gives (P dx/L) cos θ/(4πρ²). Integrating d dx/(d² + x²)^{3/2} from −L/2 to L/2 gives '
      + 'L/(d√(d² + L²/4)), so I = P/(4πd√(d² + L²/4)); background light adds.',
    columns: {
      Ion: {
        // Evaluated here by its own numerical integration (Simpson's rule over the tube), not the closed form.
        model: (v) => {
          const N = 2000;
          const h = v.L / N;
          let s = 0;
          for (let k = 0; k <= N; k++) {
            const x = -v.L / 2 + k * h;
            const w = k === 0 || k === N ? 1 : k % 2 ? 4 : 2;
            s += w * (v.d / (v.d * v.d + x * x) ** 1.5);
          }
          return v.L === 0 ? v.P / (4 * Math.PI * v.d * v.d) + v.Ib : ((v.P / v.L) * (s * h) / 3) / (4 * Math.PI) + v.Ib;
        },
        terms: [{ coef: 1 / (4 * Math.PI), powers: { P: 1, d: -2 } }, { coef: 1, powers: { Ib: 1 } }], exact: false,
      },
    },
    singles: { Ibg: { model: (v) => v.Ib, terms: [{ coef: 1, powers: { Ib: 1 } }], exact: true } },
    limits: [
      { name: 'far away: within 0.1 % of the point-source law', check: (f, v) => Math.abs((f({ ...v, d: 40 * v.L, Ib: 0 }) * (40 * v.L) ** 2 * 4 * Math.PI) / v.P - 1) < 1e-3 },
      { name: 'a longer tube gives less light at the same distance', check: (f, v) => f({ ...v, L: 2 * v.L, Ib: 0 }) < f({ ...v, Ib: 0 }) },
      { name: 'background adds', check: (f, v) => Math.abs(f(v) - f({ ...v, Ib: 0 }) - v.Ib) < 1e-9 },
    ],
    magnitude: { Ion: [10, 1500], Ibg: [0, 30] },
    recover(pub, P) {
      const E0 = Number((pub.stem.match(/E_0 = (\d+)\\/) || [])[1]);
      const rows = pub.rows.map((r) => ({ d: r.d, I: r.Ion - E0 }));
      const Id2 = rows.map((r) => r.I * r.d * r.d);
      const far = [6, 7, 8];
      // The tube's output from each far reading, inverting the exact line-source result (not the point-source law).
      const Ps = far.map((i) => rows[i].I * 4 * Math.PI * rows[i].d * Math.sqrt(rows[i].d ** 2 + P.L ** 2 / 4));
      const Pm = Ps.reduce((a, b) => a + b, 0) / Ps.length;
      const frac = far.reduce((s, i) => s + (Math.max(1, Math.round(0.03 * pub.rows[i].Ion)) + 1) / rows[i].I + (2 * 0.005) / rows[i].d, 0) / far.length;
      const plateau = far.reduce((s, i) => s + Id2[i], 0) / far.length;
      return {
        params: [{ name: 'P', estimate: Pm, range: [Pm * (1 - frac), Pm * (1 + frac)], truth: P.P }],
        answers: [{ part: 'f', value: plateau / 16 }],
        checks: [
          { name: 'point-source model fails near the tube', ok: Id2[0] < 0.5 * plateau, detail: 'at 0.20 m, I·d² should be far below its value at large distances' },
          { name: 'I·d² rises towards a constant', ok: Id2.slice(0, 6).every((x, i) => i === 0 || x > Id2[i - 1]), detail: 'I·d² should rise over the near distances' },
          { name: 'tube about 9 % below the point-source value at d = L', ok: (() => { const d = P.L; const r = d / Math.sqrt(d * d + P.L ** 2 / 4); return r < 0.92 && r > 0.85; })(), detail: 'at d = L the line source should give about 0.89 of the point-source intensity' },
        ],
      };
    },
  },

  'A2-B03': (() => {
    // The declared empirical push and landing shapes, with the flight found here by integrating the push numerically
    // (impulse of the net force = change of momentum) and applying kinematics: not the law's closed form.
    const push = (v, t) => { const s = (t - v.t0) / v.tau; return v.m * v.g * (1 - s ** v.p) + v.A * Math.sin(Math.PI * s); };
    const takeoffSpeed = (v) => {
      const N = 4000;
      let J = 0;
      for (let k = 0; k <= N; k++) { const t = v.t0 + (v.tau * k) / N; J += (k === 0 || k === N ? 1 : k % 2 ? 4 : 2) * (push(v, t) - v.m * v.g); }
      return (J * (v.tau / N)) / 3 / v.m;
    };
    const model = (v) => {
      if (v.t < v.t0) return v.m * v.g;
      if (v.t <= v.t0 + v.tau) return push(v, v.t);
      const land = v.t0 + v.tau + (2 * takeoffSpeed(v)) / v.g + v.dL;
      if (v.t < land) return 0;
      if (v.t <= land + v.tauL) { const s = (v.t - land) / v.tauL; return v.m * v.g * s + v.B * Math.sin(Math.PI * s); }
      return v.m * v.g;
    };
    return {
      derivation: 'Standing: F = mg. Push: the declared pulse. Impulse of the net force F − mg over the push (Simpson\'s rule here) = mv; '
        + 'in the air for 2v/g + δ; then the declared landing pulse.',
      columns: { F: { model, terms: [{ coef: 1, powers: { m: 1, g: 1 } }], exact: false } },
      limits: [
        { name: 'standing still: the weight', check: (f, v) => Math.abs(f({ ...v, t: v.t0 / 2 }) - v.m * v.g) < 1e-9 },
        { name: 'in the air: zero', check: (f, v) => f({ ...v, t: v.t0 + v.tau + 0.1 }) === 0 },
        { name: 'a bigger push gives a longer flight', check: (f, v) => takeoffSpeed({ ...v, A: v.A * 1.2 }) > takeoffSpeed(v) },
      ],
      magnitude: { F: [0, 2500] },
      recover(pub, P) {
        const rows = pub.rows.filter(Boolean).sort((a, b) => a.t - b.t);
        const W = rows.filter((r) => r.t < P.t0 - 0.0025).reduce((s, r, _, a) => s + r.F / a.length, 0);
        const m = W / P.g;
        // Simpson's rule on the readings from the start of the push to take-off (equally spaced, an even number of intervals).
        const i0 = rows.findIndex((r) => Math.abs(r.t - P.t0) < 0.001);
        const i1 = rows.findIndex((r) => Math.abs(r.t - (P.t0 + P.tau)) < 0.001);
        const h = (rows[i1].t - rows[i0].t) / (i1 - i0);
        let J = 0;
        for (let k = i0; k <= i1; k++) J += (k === i0 || k === i1 ? 1 : (k - i0) % 2 ? 4 : 2) * (rows[k].F - W);
        J *= h / 3;
        const off = rows.findIndex((r) => r.t > P.t0 && Math.abs(r.F) < 0.5);
        const land = rows.findIndex((r, k) => k > off && r.F > 0.5);
        const tf = rows[land].t - rows[off].t;
        const vTrue = takeoffSpeed(P);
        return {
          params: [
            { name: 'm', estimate: m, range: [m * 0.97, m * 1.03], truth: P.m },
            { name: 'take-off speed', estimate: J / m, range: [(J / m) * 0.94, (J / m) * 1.06], truth: vTrue },
          ],
          answers: [{ part: 'd', value: J / m }],
          checks: [
            { name: 'the flight-time speed is larger', ok: (P.g * tf) / 2 > J / m, detail: 'landing with bent knees should make the flight-time speed larger' },
            { name: 'flight time matches the kinematics plus δ', ok: Math.abs(tf - ((2 * vTrue) / P.g + P.dL)) < 0.006, detail: 'the time in the air should be 2v/g + δ to within one reading interval' },
            { name: 'realistic jump', ok: vTrue > 1.5 && vTrue < 3.5, detail: 'a squat jump take-off speed should be about 2 to 3 m s⁻¹' },
          ],
        };
      },
    };
  })(),

  'C5-B01': (() => {
    // Own residual of the best sinusoid of a given period: solve the 3×3 normal equations by Gaussian elimination.
    const sineAt = (t, y, P) => {
      const w = (2 * Math.PI) / P;
      const A = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
      t.forEach((x, k) => {
        const b = [1, Math.cos(w * x), Math.sin(w * x)];
        for (let i = 0; i < 3; i++) { for (let j = 0; j < 3; j++) A[i][j] += b[i] * b[j]; A[i][3] += b[i] * y[k]; }
      });
      for (let i = 0; i < 3; i++) for (let r = i + 1; r < 3; r++) { const m = A[r][i] / A[i][i]; for (let c = i; c < 4; c++) A[r][c] -= m * A[i][c]; }
      const s = [0, 0, 0];
      for (let i = 2; i >= 0; i--) s[i] = (A[i][3] - A[i].slice(i + 1, 3).reduce((acc, a, j) => acc + a * s[i + 1 + j], 0)) / A[i][i];
      const res = t.reduce((acc, x, k) => acc + (y[k] - (s[0] + s[1] * Math.cos(w * x) + s[2] * Math.sin(w * x))) ** 2, 0);
      return { res, C: s[0], amp: Math.hypot(s[1], s[2]), at: (x) => s[0] + s[1] * Math.cos(w * x) + s[2] * Math.sin(w * x) };
    };
    // Period by "string length": fold the observations on a trial period and add the jumps between neighbours in phase.
    const stringLength = (t, y, P) => {
      const o = t.map((x, k) => [(x / P) % 1, y[k]]).sort((a, b) => a[0] - b[0]);
      return o.reduce((s, p, k) => (k ? s + Math.abs(p[1] - o[k - 1][1]) : s), 0);
    };
    return {
      derivation: 'Line-of-sight velocity of a star in a circular orbit seen edge-on: v = K sin(2π(t − t₀)/P). Doppler for light with v ≪ c: '
        + 'λ = λ₀(1 + v/c).',
      columns: {
        lam: {
          model: (v) => v.lambda0 * (1 + (v.K / v.c) * Math.sin((2 * Math.PI * (v.t - v.t0)) / v.P)),
          terms: [{ coef: 1, powers: { lambda0: 1 } }], exact: false, dimensionless: [{ t: 1, P: -1 }, { K: 1, c: -1 }],
        },
      },
      limits: [
        { name: 'no orbital motion: the laboratory wavelength', check: (f, v) => f({ ...v, K: 0 }) === v.lambda0 },
        { name: 'one period later: the same wavelength', check: (f, v) => Math.abs(f({ ...v, t: v.t + v.P }) - f(v)) < 1e-9 * v.lambda0 },
        { name: 'v/c is tiny, so the approximation holds', check: (f, v) => v.K / v.c < 1e-3 },
      ],
      magnitude: { lam: [6.56e-7, 6.565e-7] },
      recover(pub, P) {
        const rows = pub.rows.filter(Boolean);
        const t = rows.map((r) => r.t); // days, read from the graph
        const y = rows.map((r) => r.lam); // nm
        let best = null;
        for (let Pd = 5; Pd <= 25; Pd += 0.01) { const L = stringLength(t, y, Pd); if (!best || L < best.L) best = { Pd, L }; }
        // Refine to the least-squares period by a golden-section search near the string-length minimum.
        let [a, b] = [best.Pd - 0.5, best.Pd + 0.5];
        const g = (Math.sqrt(5) - 1) / 2;
        for (let k = 0; k < 60; k++) {
          const [x1, x2] = [b - g * (b - a), a + g * (b - a)];
          if (sineAt(t, y, x1).res < sineAt(t, y, x2).res) b = x2; else a = x1;
        }
        const Pfit = (a + b) / 2;
        const fit = sineAt(t, y, Pfit);
        const lam0 = P.lambda0 * 1e9;
        const K = (P.c * fit.amp) / lam0; // m s⁻¹
        const f = 0.008 / fit.amp + 0.03;
        return {
          params: [
            { name: 'P', estimate: Pfit * 86400, range: [Pfit * 0.9 * 86400, Pfit * 1.1 * 86400], truth: P.P },
            { name: 'K', estimate: K, range: [K * (1 - f), K * (1 + f)], truth: P.K },
          ],
          answers: [{ part: 'b', value: K / 1000 }],
          checks: [
            { name: 'shift clearly larger than the scatter', ok: fit.amp > 8 * 0.008, detail: 'the largest shift should be many times the uncertainty of one wavelength' },
            { name: 'at least two full cycles observed', ok: (Math.max(...t) - Math.min(...t)) / Pfit >= 2, detail: 'the record should cover two or more periods' },
            { name: 'prediction day is near a minimum', ok: fit.at(34) < fit.C - 0.9 * fit.amp, detail: 'day 34 should be close to the shortest wavelength' },
          ],
        };
      },
    };
  })(),

  'B2-B01': {
    derivation: 'Sunlight intercepted by the disc πR²: absorbed (1 − α)SπR². Emitted from the whole sphere 4πR² as a black body: σT⁴·4πR². '
      + 'Equal at balance: T = ((1 − α)S/(4σ))^(1/4).',
    columns: {
      Tmod: { model: (v) => Math.pow(((1 - v.alpha) * v.S) / (4 * v.sigma), 0.25), terms: [{ coef: 1, powers: { S: 0.25, sigma: -0.25 } }], exact: false },
    },
    limits: [
      { name: 'Earth with albedo 0.3 and 1361 W m⁻²: about 255 K', check: (f, v) => Math.abs(f({ ...v, alpha: 0.3, S: 1361 }) - 254.6) < 0.6 },
      { name: 'a black body four times nearer the Sun (16S) is twice as hot', check: (f, v) => Math.abs(f({ ...v, S: 16 * v.S }) / f(v) - 2) < 1e-12 },
    ],
    magnitude: { Tmod: [150, 500] },
    recover(pub, P) {
      const rows = pub.rows;
      const own = rows.map((r) => Math.pow(((1 - r.alpha) * r.S) / (4 * P.sigma), 0.25));
      const gap = rows.map((r, i) => r.Tobs - own[i]);
      const [MERCURY, VENUS, EARTH, MOON, MARS] = [0, 1, 2, 3, 4];
      return {
        params: [],
        answers: [{ part: 'a', value: own[MARS] }],
        checks: [
          { name: 'Venus furthest from the model, far above it', ok: gap[VENUS] > 300 && gap.every((g, i) => i === VENUS || Math.abs(g) < gap[VENUS] / 5), detail: 'Venus should be hundreds of kelvin hotter than the model, far more than any other body' },
          { name: 'Earth above the model by 20–50 K', ok: gap[EARTH] > 20 && gap[EARTH] < 50, detail: 'Earth\'s greenhouse warming should be about 33 K' },
          { name: 'the Moon below the model', ok: gap[MOON] < -5, detail: 'the Moon\'s mean temperature should lie below the uniform-temperature model' },
          { name: 'Mercury and Mars close to the model', ok: Math.abs(gap[MERCURY]) < 3 && Math.abs(gap[MARS]) < 6, detail: 'Mercury and Mars should lie close to the line' },
        ],
      };
    },
  },

  'E4-B01': (() => {
    const hours = (y) => ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365) * 24;
    return {
      derivation: 'Load factor = energy supplied ÷ (rated power × the year\'s hours). Energy per fission from the mass difference (own precise '
        + 'masses, 1 u = 931.494 MeV); fissions = (electrical energy ÷ efficiency) ÷ energy per fission; mass = fissions × mass of a U-235 atom.',
      // The load factor as a fraction (the column is in %, which this audit's own unit table converts). The term records the dimensions
      // only: energy ÷ (power × time) is a pure number.
      columns: { LF: { model: (v) => v.E / (v.Pref * hours(v.year) * 3600), terms: [{ coef: 1, powers: { E: 1, Pref: -1, ton: -1 } }], exact: false } },
      limits: [
        { name: 'full power all year: load factor 1', check: (f, v) => Math.abs(f({ ...v, E: v.Pref * hours(v.year) * 3600 }) - 1) < 1e-12 },
        { name: 'a leap year has more hours', check: () => hours(2020) === 8784 && hours(2018) === 8760 },
      ],
      magnitude: { LF: [0.6, 1.02] },
      recover(pub, P) {
        const rows = pub.rows.map((r, i) => ({ ...r, year: Number(pub.labels[i]) }));
        const dmU = 235.0439301 + 1.00866491606 - 140.9144033 - 91.9261731 - 3 * 1.00866491606;
        const EfJ = dmU * 931.494 * 1.602176634e-13;
        const eta = P.Pref / P.Pth;
        const lf = rows.map((r) => (r.E * 3.6e12) / (P.Pref * hours(r.year) * 3600));
        const i20 = rows.findIndex((r) => r.year === 2020);
        const N = (rows[i20].E * 3.6e12) / eta / EfJ;
        const mass = N * 235.0439301 * 1.66053906892e-27;
        const gwyr = (rows[i20].E * 3.6e12) / (1e9 * 365.25 * 86400);
        const refuel = rows.map((r, i) => i).filter((i) => lf[i] < 0.95);
        const full = rows.map((r, i) => i).filter((i) => lf[i] >= 0.95);
        return {
          params: [],
          answers: [{ part: 'b', value: lf[rows.findIndex((r) => r.year === 2018)] * 100 }],
          checks: [
            { name: 'energy per fission about 170 MeV', ok: Math.abs(EfJ / 1.602176634e-13 - 173.3) < 0.5, detail: 'the mass difference should give about 173 MeV' },
            { name: 'mass fissioned in 2020 under a tonne', ok: mass > 700 && mass < 1100, detail: 'the estimate should be roughly 0.9 t' },
            { name: 'about a tonne per gigawatt-year', ok: mass / gwyr > 800 && mass / gwyr < 1600, detail: 'the rule of thumb should hold to within its own roughness' },
            { name: 'two full-power years', ok: full.map((i) => rows[i].year).join() === '2017,2020' && Math.min(...full.map((i) => lf[i])) - Math.max(...refuel.map((i) => lf[i])) > 0.05, detail: '2017 and 2020 should stand out clearly with load factors near 100 %' },
          ],
        };
      },
    };
  })(),

  'E1-B01': (() => {
    const eV = 1.602176634e-19;
    // Mercury levels shown to students (NIST, typed here independently), in eV.
    const LEVELS = [0, 4.6673829, 4.8864946, 5.4606248, 6.7036623, 7.7304551];
    return {
      derivation: 'The photon carries the energy difference between the levels: hf = E_u − E_l, and c = fλ, so λ = hc/(E_u − E_l).',
      columns: { lam: { model: (v) => (v.h * v.c) / (v.Eu - v.El), terms: [{ coef: 1, powers: { h: 1, c: 1, Eu: -1 } }], exact: false } },
      limits: [
        { name: 'a larger gap gives a shorter wavelength', check: (f, v) => f({ ...v, El: v.El - 0.5 * eV }) < f(v) },
        { name: 'visible light: 380–700 nm', check: (f, v) => f(v) > 380e-9 && f(v) < 700e-9 },
      ],
      magnitude: { lam: [380e-9, 700e-9] },
      recover(pub, P) {
        const lam = pub.rows.map((r) => r.lam); // nm, read from the scale image
        const Eph = lam.map((x) => (P.h * P.c) / (x * 1e-9) / eV); // eV, exact constants
        const dE = lam.map((x) => (P.h * P.c) / ((x - 2.5) * 1e-9) / eV - (P.h * P.c) / (x * 1e-9) / eV); // reading uncertainty in eV
        const pairs = [];
        for (const u of LEVELS) for (const l of LEVELS) if (u > l) pairs.push({ u, l, gap: u - l });
        const matches = Eph.map((E) => [...pairs].sort((a, b) => Math.abs(a.gap - E) - Math.abs(b.gap - E)));
        const upper = matches.map((m) => m[0].u);
        const EuEst = Eph.reduce((s, E, i) => s + E + matches[i][0].l, 0) / Eph.length;
        // The question's typed answer uses data-booklet constants (h = 6.63 × 10⁻³⁴ J s, c = 3.00 × 10⁸ m s⁻¹, e = 1.60 × 10⁻¹⁹ C).
        const booklet = (x) => (6.63e-34 * 3.0e8) / (x * 1e-9) / 1.6e-19;
        return {
          params: [{ name: 'upper level', estimate: EuEst * eV, range: [(EuEst - 3 * dE[0]) * eV, (EuEst + 3 * dE[0]) * eV], truth: P.Eu }],
          answers: [{ part: 'c', value: booklet(lam[2]) }],
          checks: [
            { name: 'one shared upper level', ok: upper.every((u) => u === upper[0]) && Math.abs(upper[0] - 7.7304551) < 1e-9, detail: 'all three lines should come from the 7.73 eV level' },
            { name: 'each match unambiguous', ok: matches.every((m, i) => Math.abs(m[0].gap - Eph[i]) < dE[i] && Math.abs(m[1].gap - Eph[i]) > 2 * dE[i]), detail: 'each photon energy should match one level difference within the reading uncertainty and no other' },
            { name: 'the yellow pair is closer than the reading uncertainty', ok: 579.067 - 576.961 < 2.5, detail: 'the two yellow lines should be closer together than ±2.5 nm' },
          ],
        };
      },
    };
  })(),
};

// ---------- Running the audit ----------
export function independentAudit(def, q) {
  const diags = [];
  const fail = (code, where, message, extra = {}) => diags.push({ level: 'error', code, dataset: def.id, where, message, ...extra });
  const spec = AUDITS[def.id];
  if (!spec) { fail('independent-missing', 'independent audit', 'no independent physics audit for this dataset (add one to tools/1b/independent.mjs)'); return diags; }
  try {
    const params = def.physics.params;
    const P = Object.fromEntries(Object.entries(params).map(([k, p]) => [k, toSIa(p.value, p.unit)]));
    const dims = Object.fromEntries(Object.entries(params).map(([k, p]) => [k, unit(p.unit).dim]));
    for (const [k, c] of Object.entries(def.columns)) dims[k] = unit(c.unit).dim;
    const ideal = generateRows(def, { ideal: true });
    const entries = [
      ...Object.entries(spec.columns).map(([k, s]) => ({ k, s, colUnit: def.columns[k].unit, single: false })),
      ...Object.entries(spec.singles || {}).map(([k, s]) => ({ k, s, colUnit: def.singles[k].unit, single: true })),
    ];
    const rowSI = (row) => Object.fromEntries(Object.entries(def.columns).filter(([k]) => Number.isFinite(row[k])).map(([k, c]) => [k, toSIa(row[k], c.unit)]));
    for (const { k, s, colUnit, single } of entries) {
      const where = `independent audit, ${single ? 'single reading' : 'column'} ${k}`;
      const out = unit(colUnit);
      // 1. dimensions, and the formula's structure
      for (const term of s.terms) {
        if (!sameDims(dimOf(term.powers, dims), out.dim)) fail('independent-dims', where, `a term (${Object.entries(term.powers).map(([a, b]) => `${a}^${b}`).join(' ')}) doesn't have the dimensions of ${colUnit || 'a pure number'}`);
      }
      for (const arg of s.dimensionless || []) {
        if (!sameDims(dimOf(arg, dims), [0, 0, 0, 0, 0])) fail('independent-dims', where, 'an exponent or function argument isn\'t dimensionless');
      }
      const sample = { ...P, ...rowSI(single ? {} : ideal.rows[0]) };
      if (s.exact) {
        const sum = s.terms.reduce((acc, t) => acc + t.coef * Object.entries(t.powers).reduce((pr, [a, b]) => pr * sample[a] ** b, 1), 0);
        if (Math.abs(sum - s.model(sample)) > 1e-9 * Math.abs(sum)) fail('independent-dims', where, 'the formula doesn\'t match its declared terms');
      }
      // 2. limiting cases (columns only)
      if (!single) for (const lim of spec.limits || []) if (!lim.check(s.model, sample)) fail('independent-limit', where, `limiting case fails: ${lim.name}`);
      // 3. the generator's noise-free values must equal the independent physics; 4. magnitude
      const values = single ? [[ideal.singles[k], {}]] : ideal.rows.map((r) => [r[k], r]);
      const [lo, hi] = (spec.magnitude || {})[k] || [-Infinity, Infinity];
      values.forEach(([genVal, row], i) => {
        const own = s.model({ ...P, ...rowSI(row) });
        const gen = genVal * out.scale + out.offset;
        if (Math.abs(own - gen) > 1e-9 * Math.max(Math.abs(own), 1e-30)) {
          fail('independent-model', `${where}, row ${i + 1}`, 'the generator\'s noise-free value disagrees with the independent physics: the generator\'s model is wrong, or this audit is',
            { expected: `${own.toPrecision(6)} (independent, SI)`, got: `${gen.toPrecision(6)} (generator, SI)` });
        }
        if (own < lo || own > hi) fail('independent-magnitude', `${where}, row ${i + 1}`, `value ${own.toPrecision(3)} (SI) is outside the expected range ${lo} to ${hi}`);
      });
    }
    // 5. published data scatter fairly about the independent physics (+ any declared systematic effect)
    const pub = readPublished(q, def);
    for (const { k, s, colUnit, single } of entries) {
      if (single) continue;
      const c = def.columns[k];
      const sc = unit(colUnit).scale;
      const z = [];
      if (c.kind === 'catalogue') {
        // Published data aren't scattered by our noise: each value must follow the independent physics to within
        // the declared tolerance (this audit's own model, not the generator's).
        pub.rows.forEach((r, i) => {
          if (r[k] == null) return;
          const own = s.model({ ...P, ...rowSI(ideal.rows[i]) });
          const got = toSIa(r[k], colUnit);
          if (Math.abs(got - own) > c.agree * Math.abs(own)) fail('independent-data', `independent audit, column ${k}, row ${i + 1}`, `the published value differs from the independent physics by more than ${c.agree * 100} %`, { expected: own.toPrecision(5), got: got.toPrecision(5) });
        });
        continue;
      }
      pub.rows.forEach((r, i) => {
        if (r[k] == null || (c.anomaly && c.anomaly.row === i)) return;
        const setRow = rowSI(ideal.rows[i]);
        const model = ownSystematic(c.systematic, s.model({ ...P, ...setRow }), setRow, sc);
        const nz = c.noise || {};
        let sd = nz.type === 'gauss' ? nz.sd * sc : nz.type === 'gauss-relative' ? nz.sd * Math.abs(model) : nz.type === 'poisson' ? Math.sqrt(model / sc) * sc : 0;
        if (c.trials) sd /= Math.sqrt(c.trials);
        sd = Math.sqrt(sd * sd + ((c.resolution || 0) * sc) ** 2 / 12);
        if (sd > 0) z.push((toSIa(r[k], colUnit) - model) / sd);
      });
      if (z.length) {
        const mean = z.reduce((a, b) => a + b, 0) / z.length;
        if (Math.abs(mean) > 3 / Math.sqrt(z.length)) fail('independent-data', `independent audit, column ${k}`, `the published values are biased against the independent physics (mean deviation ${mean.toFixed(2)} standard deviations)`);
        const worst = Math.max(...z.map(Math.abs));
        if (worst > 4.5) fail('independent-data', `independent audit, column ${k}`, `a published value is ${worst.toFixed(1)} standard deviations from the independent physics`);
      }
    }
    // 6. parameter recovery and answers, from the published table
    const rec = spec.recover(pub, P, def);
    for (const prm of rec.params) {
      const [a, b] = [Math.min(...prm.range), Math.max(...prm.range)];
      if (!(prm.truth >= a && prm.truth <= b)) {
        fail('independent-recovery', `independent audit, parameter ${prm.name}`, 'the true value is outside the range recovered from the published data',
          { expected: `${prm.truth}`, got: `${prm.estimate.toPrecision(4)} (range ${a.toPrecision(4)} to ${b.toPrecision(4)})` });
      }
    }
    // 7. intended conclusions (e.g. the direction of a systematic error, where a model stops holding)
    for (const chk of rec.checks || []) {
      if (!chk.ok) fail('independent-conclusion', `independent audit, ${chk.name}`, chk.detail || 'the conclusion the question expects is not supported by the independent physics');
    }
    for (const ans of rec.answers) {
      const published = pub.answers[ans.part];
      if (published === undefined) { fail('independent-answer', `independent audit, part (${ans.part})`, 'no typed answer to compare'); continue; }
      if (Math.abs(published - ans.value) > 2e-3 * Math.abs(ans.value)) {
        fail('independent-answer', `independent audit, part (${ans.part})`, 'the published answer disagrees with the independent recalculation', { expected: ans.value.toPrecision(5), got: published.toPrecision(5) });
      }
    }
  } catch (e) {
    fail('independent-crash', 'independent audit', `the audit couldn't run: ${e.message}`);
  }
  return diags;
}
