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
};
function unit(expr) {
  let scale = 1;
  const dim = [0, 0, 0, 0, 0];
  for (const tok of String(expr || '').trim().split(/\s+/).filter(Boolean)) {
    const [name, pow = '1'] = tok.split('^');
    if (!U[name]) throw new Error(`independent audit: unit "${name}" isn't in its own table`);
    scale *= U[name][0] ** Number(pow);
    U[name][1].forEach((x, i) => { dim[i] += x * Number(pow); });
  }
  return { scale, dim };
}
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
function readPublished(q) {
  const num = (s) => Number(String(s).replace('−', '-'));
  const rows = [];
  const unc = [];
  const main = q.data.find((x) => x.kind === 'table' && x.figure !== 'trials');
  for (const m of main.html.matchAll(/<td data-col="(\w+)" data-row="(\d+)"( data-unc="1")?[^>]*>([^<]*)<\/td>/g)) {
    const store = m[3] ? unc : rows;
    store[+m[2]] = store[+m[2]] || {};
    store[+m[2]][m[1]] = m[4] === '?' ? null : num(m[4]);
  }
  const t = q.data.find((x) => x.figure === 'trials');
  const trials = t ? [...t.html.matchAll(/data-trial="\d+">([^<]*)</g)].map((m) => num(m[1])) : null;
  const answers = Object.fromEntries(q.parts.filter((pt) => pt.numeric).map((pt) => [pt.label, pt.numeric.answer]));
  return { rows, unc, trials, answers, stem: q.stem };
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
};

// ---------- Running the audit ----------
export function independentAudit(def, q) {
  const diags = [];
  const fail = (code, where, message, extra = {}) => diags.push({ level: 'error', code, dataset: def.id, where, message, ...extra });
  const spec = AUDITS[def.id];
  if (!spec) { fail('independent-missing', 'independent audit', 'no independent physics audit for this dataset (add one to tools/1b/independent.mjs)'); return diags; }
  try {
    const params = def.physics.params;
    const P = Object.fromEntries(Object.entries(params).map(([k, p]) => [k, p.value * unit(p.unit).scale]));
    const dims = Object.fromEntries(Object.entries(params).map(([k, p]) => [k, unit(p.unit).dim]));
    for (const [k, c] of Object.entries(def.columns)) dims[k] = unit(c.unit).dim;
    const ideal = generateRows(def, { ideal: true });
    const entries = [
      ...Object.entries(spec.columns).map(([k, s]) => ({ k, s, colUnit: def.columns[k].unit, single: false })),
      ...Object.entries(spec.singles || {}).map(([k, s]) => ({ k, s, colUnit: def.singles[k].unit, single: true })),
    ];
    const rowSI = (row) => Object.fromEntries(Object.entries(def.columns).filter(([k]) => Number.isFinite(row[k])).map(([k, c]) => [k, row[k] * unit(c.unit).scale]));
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
        const gen = genVal * out.scale;
        if (Math.abs(own - gen) > 1e-9 * Math.max(Math.abs(own), 1e-30)) {
          fail('independent-model', `${where}, row ${i + 1}`, 'the generator\'s noise-free value disagrees with the independent physics: the generator\'s model is wrong, or this audit is',
            { expected: `${own.toPrecision(6)} (independent, SI)`, got: `${gen.toPrecision(6)} (generator, SI)` });
        }
        if (own < lo || own > hi) fail('independent-magnitude', `${where}, row ${i + 1}`, `value ${own.toPrecision(3)} (SI) is outside the expected range ${lo} to ${hi}`);
      });
    }
    // 5. published data scatter fairly about the independent physics (+ any declared systematic effect)
    const pub = readPublished(q);
    for (const { k, s, colUnit, single } of entries) {
      if (single) continue;
      const c = def.columns[k];
      const sc = unit(colUnit).scale;
      const z = [];
      pub.rows.forEach((r, i) => {
        if (r[k] == null || (c.anomaly && c.anomaly.row === i)) return;
        const setRow = rowSI(ideal.rows[i]);
        const model = ownSystematic(c.systematic, s.model({ ...P, ...setRow }), setRow, sc);
        const nz = c.noise || {};
        let sd = nz.type === 'gauss' ? nz.sd * sc : nz.type === 'gauss-relative' ? nz.sd * Math.abs(model) : nz.type === 'poisson' ? Math.sqrt(model / sc) * sc : 0;
        if (c.trials) sd /= Math.sqrt(c.trials);
        sd = Math.sqrt(sd * sd + ((c.resolution || 0) * sc) ** 2 / 12);
        if (sd > 0) z.push((r[k] * sc - model) / sd);
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
