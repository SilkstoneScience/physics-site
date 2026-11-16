// Tests for the Universe Engine's physics and generator.
//   node tools/universe/test.mjs               the quick tests (a few seconds)
//   node tools/universe/test.mjs --stability   also runs 100 systems for 10,000 simulated years (minutes)
//   node tools/universe/test.mjs --find        lists candidate showcase seeds
import * as P from '../../universe/js/physics.js';
import { generate, hashSystem, validate, SHOWCASE_SEED, GEN_VERSION } from '../../universe/js/generator.js';

let failed = 0, passed = 0;
const ok = (cond, name, detail = '') => { if (cond) passed++; else { failed++; console.log(`  ✗ ${name} ${detail}`); } };
const near = (x, want, rel, name) => ok(Math.abs(x - want) <= rel * Math.abs(want), name, `got ${x}, expected ${want} (within ${rel})`);
const section = (s) => console.log(`\n${s}`);
const { G, M_SUN, M_EARTH, R_EARTH, DAY, YEAR, TWO_PI } = P;

// ---------- 1. Determinism ----------
section('1. Generator: same seed, same system');
{
  let same = true, valid = 0;
  const problems = [];
  for (let s = 1; s <= 200; s++) {
    const a = generate(String(s)), b = generate(String(s));
    if (hashSystem(a) !== hashSystem(b)) same = false;
    const bad = validate(a);
    if (bad.length) problems.push(`seed ${s}: ${bad[0]}`); else valid++;
  }
  ok(same, 'seeds 1-200 generated twice give identical hashes');
  ok(valid === 200, 'seeds 1-200 all pass the plausibility rules', problems.slice(0, 5).join(' | '));
  ok(new Set(Array.from({ length: 200 }, (_, i) => hashSystem(generate(String(i + 1))))).size === 200, 'different seeds give different systems');
  const show = generate(SHOWCASE_SEED);
  const SNAPSHOT = '1d2fb847c172d85a';
  ok(hashSystem(show) === SNAPSHOT, `snapshot of the showcase seed "${SHOWCASE_SEED}" (v${GEN_VERSION})`, `hash is now ${hashSystem(show)}: if the generator was changed on purpose, this needs a new version number, not a new snapshot`);
  const belts = Array.from({ length: 200 }, (_, i) => generate(String(i + 1))).filter((s) => s.belt).length;
  console.log(`  (${belts} of 200 systems have an asteroid belt)`);
  ok(belts >= 150, 'most systems have an asteroid belt', `${belts}`);
}

// ---------- 2. Kepler orbits ----------
section('2. Kepler solver');
{
  let worst = 0, worstBack = 0, worstEq = 0;
  const out = new Float64Array(12);
  for (const e of [0, 0.01, 0.1, 0.25, 0.5, 0.8, 0.95]) {
    for (const M0 of [0, 0.3, 2, 3.14, 5.5]) {
      const a = 2.3e11, mu = G * 1.3 * M_SUN;
      const el = P.prepareOrbit({ a, e, i: 0.2, O: 1, w: 2, M0, t0: 0 });
      const T = P.orbitalPeriod(a, mu);
      // Time from one upward crossing of the orbit's own x axis to the next, found by bisection.
      const y = (t) => { P.keplerState(el, mu, t, out, 0); return out[0] * el.Q[0] + out[1] * el.Q[1] + out[2] * el.Q[2]; };
      const tPeri = (TWO_PI - M0) / TWO_PI * T;                       // first periapsis passage
      const cross = (guess) => { let lo = guess - T / 50, hi = guess + T / 50; for (let k = 0; k < 200; k++) { const mid = (lo + hi) / 2; if (y(mid) < 0) lo = mid; else hi = mid; } return (lo + hi) / 2; };
      const measured = cross(tPeri + T) - cross(tPeri);
      worst = Math.max(worst, Math.abs(measured / T - 1));
      P.keplerState(el, mu, 0, out, 0); P.keplerState(el, mu, T, out, 6);
      worstBack = Math.max(worstBack, Math.hypot(out[6] - out[0], out[7] - out[1], out[8] - out[2]) / a);
      for (let k = 0; k < 40; k++) { const M = -7 + k * 0.37, E = P.solveKepler(M, e); worstEq = Math.max(worstEq, Math.abs(Math.sin(E - e * Math.sin(E) - M))); }
    }
  }
  ok(worst < 1e-9, 'measured period matches 2π√(a³/GM) to 1e-9', `worst ${worst.toExponential(2)}`);
  ok(worstBack < 1e-9, 'the body returns to its starting position after one period', `worst ${worstBack.toExponential(2)} of a`);
  ok(worstEq < 1e-13, "Kepler's equation is satisfied", `worst ${worstEq.toExponential(2)}`);

  // Speed and energy along an eccentric orbit: vis-viva, and constant energy and angular momentum.
  const mu = G * M_SUN, el = P.prepareOrbit({ a: 3e11, e: 0.4, i: 0.1, O: 0.5, w: 1.2, M0: 0, t0: 0 }), T = P.orbitalPeriod(el.a, mu);
  let dv = 0, dh = 0, h0 = 0;
  for (let k = 0; k < 50; k++) {
    P.keplerState(el, mu, k * T / 50, out, 0);
    const r = Math.hypot(out[0], out[1], out[2]), v = Math.hypot(out[3], out[4], out[5]);
    dv = Math.max(dv, Math.abs(v / P.visViva(mu, r, el.a) - 1));
    const h = Math.hypot(out[1] * out[5] - out[2] * out[4], out[2] * out[3] - out[0] * out[5], out[0] * out[4] - out[1] * out[3]);
    if (!k) h0 = h; dh = Math.max(dh, Math.abs(h / h0 - 1));
  }
  ok(dv < 1e-12, 'speed on an ellipse matches vis-viva', dv.toExponential(2));
  ok(dh < 1e-12, "equal areas in equal times (Kepler's second law)", dh.toExponential(2));

  // Elements -> state -> elements round trip, including a hyperbolic escape path.
  for (const e of [0.05, 0.6, 1.7]) {
    const a = e < 1 ? 2e11 : -2e11, el1 = P.prepareOrbit({ a, e, i: 0.4, O: 2.2, w: 0.7, M0: 0.9, t0: 0 });
    P.keplerState(el1, mu, 1e6, out, 0);
    const el2 = P.stateToElements(out[0], out[1], out[2], out[3], out[4], out[5], mu, 1e6, {});
    near(el2.a, a, 1e-10, `round trip a (e = ${e})`); near(el2.e, e, 1e-10, `round trip e (e = ${e})`);
    near(el2.i, 0.4, 1e-9, `round trip i (e = ${e})`); near(el2.O, 2.2, 1e-9, `round trip node (e = ${e})`); near(el2.w, 0.7, 1e-9, `round trip periapsis (e = ${e})`);
    P.keplerState(el1, mu, 5e6, out, 0); P.keplerState(el2, mu, 5e6, out, 6);
    ok(Math.hypot(out[6] - out[0], out[7] - out[1], out[8] - out[2]) < 1e-6 * Math.abs(a), `round trip predicts the same later position (e = ${e})`);
  }
}

// ---------- 3. Known case: Earth and Sun ----------
section('3. Earth and the Sun');
{
  const a = 1.496e11, mu = G * M_SUN, T = P.orbitalPeriod(a, mu);
  near(T / DAY, 365.25, 2e-3, 'T ≈ 365.25 days');
  near(P.circularSpeed(M_SUN, a) / 1000, 29.8, 2e-3, 'v ≈ 29.8 km/s');
  near(P.fieldStrength(M_EARTH, R_EARTH), 9.81, 5e-3, "g at Earth's surface ≈ 9.8 N/kg");
  near(P.escapeSpeed(M_EARTH, R_EARTH) / 1000, 11.2, 5e-3, 'escape speed from Earth ≈ 11.2 km/s');
  console.log(`  (T = ${(T / DAY).toFixed(2)} days, v = ${(P.circularSpeed(M_SUN, a) / 1000).toFixed(2)} km/s, with G = 6.67e-11 and M = 1.99e30 kg)`);
  const sun = P.starFromMass(1), c = P.blackbodyRGB(6504, [0, 0, 0]);
  near(sun.temp, 5772, 5e-3, "the Sun's surface temperature from L = σAT⁴");
  ok(Math.min(...c) > 0.93, 'a 6504 K black body is close to white', c.map((x) => x.toFixed(3)).join(', '));
  const cool = P.blackbodyRGB(3500, [0, 0, 0]), hot = P.blackbodyRGB(12000, [0, 0, 0]);
  ok(cool[0] === 1 && cool[2] < 0.5 && hot[2] === 1 && hot[0] < 0.8, 'cool stars are orange-red, hot stars blue-white');
}

// ---------- 4. Full gravity ----------
section('4. Full gravity (N-body)');
{
  const run = (step, stepsPerOrbit, orbits) => {
    const s = P.createSystem(2), a = 1.496e11;
    s.m[0] = M_SUN; s.m[1] = M_EARTH;
    s.x[3] = a; s.v[4] = Math.sqrt(G * (M_SUN + M_EARTH) / a);
    P.toBarycentre(s); P.accelerations(s);
    const T = P.orbitalPeriod(a, G * (M_SUN + M_EARTH)), dt = T / stepsPerOrbit;
    const E0 = P.totalEnergy(s), L0 = P.angularMomentum(s, [0, 0, 0])[2];
    let dE = 0, dR = 0, dL = 0;
    for (let k = 0; k < orbits * stepsPerOrbit; k++) {
      step(s, dt);
      if (k % 37 === 0) {
        dE = Math.max(dE, Math.abs(P.totalEnergy(s) / E0 - 1));
        dR = Math.max(dR, Math.abs(Math.hypot(s.x[3] - s.x[0], s.x[4] - s.x[1], s.x[5] - s.x[2]) / a - 1));
        dL = Math.max(dL, Math.abs(P.angularMomentum(s, [0, 0, 0])[2] / L0 - 1));
      }
    }
    // phase: where the planet is after a whole number of orbits (should be back on the +x axis)
    const phase = Math.atan2(s.x[4] - s.x[1], s.x[3] - s.x[0]);
    return { dE, dR, dL, phase };
  };
  const y = run(P.stepYoshida, 200, 1000);
  ok(y.dE < 1e-6, 'Yoshida, 1000 circular orbits: relative energy drift below 1e-6', y.dE.toExponential(2));
  ok(y.dR < 1e-3, 'Yoshida, 1000 circular orbits: radius within 0.1 %', y.dR.toExponential(2));
  ok(y.dL < 1e-9, 'Yoshida, 1000 circular orbits: angular momentum conserved', y.dL.toExponential(2));
  console.log(`  (Yoshida, 200 steps per orbit: energy ${y.dE.toExponential(1)}, radius ${y.dR.toExponential(1)}, angular momentum ${y.dL.toExponential(1)}, phase error after 1000 orbits ${y.phase.toExponential(1)} rad)`);
  const l = run(P.stepLeapfrog, 200, 1000);
  ok(l.dE < 1e-6 && l.dR < 1e-3 && l.dL < 1e-9, 'leapfrog passes the same three tests', `${l.dE.toExponential(2)} ${l.dR.toExponential(2)} ${l.dL.toExponential(2)}`);
  console.log(`  (leapfrog, 200 steps per orbit: energy ${l.dE.toExponential(1)}, radius ${l.dR.toExponential(1)}, phase error ${l.phase.toExponential(1)} rad)`);

  // An eccentric orbit is a harder test: energy error stays bounded (no drift) with a symplectic method.
  const s = P.createSystem(2), el = P.prepareOrbit({ a: 1.5e11, e: 0.4, i: 0, O: 0, w: 0, M0: 0, t0: 0 }), out = new Float64Array(6);
  s.m[0] = M_SUN; s.m[1] = M_EARTH; P.keplerState(el, G * (M_SUN + M_EARTH), 0, out, 0);
  for (let c = 0; c < 3; c++) { s.x[3 + c] = out[c]; s.v[3 + c] = out[3 + c]; }
  P.toBarycentre(s); P.accelerations(s);
  const T = P.orbitalPeriod(el.a, G * (M_SUN + M_EARTH)), E0 = P.totalEnergy(s);
  let first = 0, last = 0;
  for (let k = 0; k < 300 * 400; k++) { P.stepYoshida(s, T / 400); const d = Math.abs(P.totalEnergy(s) / E0 - 1); if (k < 4000) first = Math.max(first, d); if (k > 296 * 400) last = Math.max(last, d); }
  ok(last < 1e-6 && last < 3 * first + 1e-12, 'eccentric orbit (e = 0.4): energy error stays bounded over 300 orbits', `first 10 orbits ${first.toExponential(2)}, last 4 ${last.toExponential(2)}`);

  // Merging conserves momentum.
  const c = P.createSystem(3); c.m.set([5, 3, 1]); c.x.set([0, 0, 0, 1, 0, 0, 9, 9, 9]); c.v.set([1, 0, 0, -2, 4, 0, 0, 0, 0]);
  ok(P.findCollision(c, [0.6, 0.6, 0.1]) === 0 * 3 + 1, 'collision found');
  P.merge(c, 0, 1);
  ok(c.m[0] === 8 && c.dead[1] === 1 && Math.abs(c.v[0] - (5 - 6) / 8) < 1e-15 && Math.abs(c.v[1] - 12 / 8) < 1e-15, 'merging conserves momentum');
}

// ---------- 5. Escape ----------
section('5. Test mass and escape speed');
{
  const GM = G * M_EARTH, R = R_EARTH, vEsc = P.escapeSpeed(M_EARTH, R), tau = Math.sqrt(R ** 3 / GM);
  const launch = (f, rStop) => {
    const st = [R, f * vEsc]; let rMax = R, steps = 0;
    while (st[0] >= R && st[0] < rStop && steps < 5e7) { P.radialStep(st, GM, tau / 400); rMax = Math.max(rMax, st[0]); steps++; }
    return { r: st[0], v: st[1], rMax, energy: st[1] ** 2 / 2 - GM / st[0] };
  };
  const back = launch(0.99, 1e4 * R);
  ok(back.r < R && back.v < 0, 'launched at 0.99 v_esc, the mass comes back');
  near(back.rMax, P.maxRadius(R, 0.99), 1e-3, 'its greatest distance matches R/(1 - f²)');
  near(-back.v, 0.99 * vEsc, 1e-3, 'it lands at its launch speed');
  const gone = launch(1.01, 1e4 * R);
  ok(gone.r >= 1e4 * R && gone.v > 0 && gone.energy > 0, 'launched at 1.01 v_esc, it escapes (still moving away at 10,000 R, total energy positive)');
  near(Math.sqrt(2 * gone.energy), vEsc * Math.sqrt(1.01 ** 2 - 1), 1e-3, 'speed far away matches v² = v₀² − v_esc²');
  const half = launch(0.5, 1e4 * R);
  near(half.rMax, R / 0.75, 1e-4, 'launched at 0.5 v_esc, it reaches 4R/3');
  ok(P.maxRadius(R, 1) === Infinity, 'at exactly the escape speed there is no greatest distance');
}

// ---------- 6. Generated systems ----------
section('6. Generated systems');
{
  const count = {}, stats = { n: 0, e: 0, highE: 0, rings: 0, moons: 0 };
  for (let s = 1; s <= 200; s++) {
    const sys = generate('check-' + s);
    for (const p of sys.planets) { count[p.type] = (count[p.type] || 0) + 1; stats.n++; stats.e += p.el.e; if (p.el.e > 0.25) stats.highE++; if (p.rings) stats.rings++; stats.moons += p.moons.length; }
    const bad = validate(sys);
    ok(!bad.length, `seed check-${s} is plausible`, bad[0]);
  }
  console.log(`  planets in 200 systems: ${JSON.stringify(count)}; mean e ${(stats.e / stats.n).toFixed(3)}; ${(100 * stats.highE / stats.n).toFixed(0)} % above 0.25; ${stats.rings} ring systems; ${stats.moons} moons`);
  ok(Object.keys(count).length === 6, 'all six planet types appear');
  ok(stats.highE / stats.n < 0.2 && stats.highE > 0, 'mostly low eccentricities, with occasional higher ones');
}

// ---------- 7. Long-term stability in full gravity (slow) ----------
function survives(sys, years) {
  const n = sys.planets.length + 1, s = P.createSystem(n), out = new Float64Array(6), mu = G * sys.star.mass;
  s.m[0] = sys.star.mass;
  let tMin = Infinity;
  sys.planets.forEach((p, k) => {
    s.m[k + 1] = p.mass; P.keplerState(p.el, mu, 0, out, 0);
    for (let c = 0; c < 3; c++) { s.x[3 * (k + 1) + c] = out[c]; s.v[3 * (k + 1) + c] = out[3 + c]; }
    tMin = Math.min(tMin, P.orbitalPeriod(p.el.a * (1 - p.el.e), mu));
  });
  P.toBarycentre(s); P.accelerations(s);
  const dt = tMin / 60, steps = Math.ceil(years * YEAR / dt), el = {};
  for (let k = 0; k < steps; k++) {
    P.stepLeapfrog(s, dt);
    if (k % 20000 === 0 || k === steps - 1) {
      for (let j = 1; j < n; j++) {
        const p = sys.planets[j - 1], q = 3 * j;
        P.stateToElements(s.x[q] - s.x[0], s.x[q + 1] - s.x[1], s.x[q + 2] - s.x[2], s.v[q] - s.v[0], s.v[q + 1] - s.v[1], s.v[q + 2] - s.v[2], G * (s.m[0] + s.m[j]), 0, el);
        if (!(el.e < 0.9) || Math.abs(el.a / p.el.a - 1) > 0.1) return { ok: false, why: `${p.name}: a changed by ${((el.a / p.el.a - 1) * 100).toFixed(1)} %, e = ${el.e.toFixed(2)}`, years: k * dt / YEAR };
      }
    }
  }
  return { ok: true };
}
if (process.argv.includes('--stability')) {
  section('7. Stability: 100 systems for 10,000 simulated years in full gravity (leapfrog, 60 steps per shortest orbit)');
  let good = 0; const t0 = Date.now();
  for (let s = 1; s <= 100; s++) {
    const r = survives(generate('stability-' + s), 10000);
    if (r.ok) good++; else console.log(`  seed stability-${s} did not survive: ${r.why} after ${r.years.toFixed(0)} years`);
  }
  console.log(`  ${good} of 100 systems survived (every planet's semi-major axis within 10 % of its start and e < 0.9). Took ${((Date.now() - t0) / 1000).toFixed(0)} s.`);
  ok(good >= 95, 'at least 95 of 100 systems survive', `${good}`);
}

// ---------- Showcase seed finder ----------
if (process.argv.includes('--find')) {
  const extra = process.argv.slice(process.argv.indexOf('--find') + 1);
  const words = extra.length ? extra : ['first-light', 'aurora', 'quiet-harbour', 'long-night', 'ember', 'lantern', 'deep-field', 'tidewater', 'far-shore', 'new-dawn', 'wayfarer', 'solstice', 'halcyon', 'meridian', 'zenith', 'equinox', 'horizon', 'cascade', 'drift', 'beacon', 'voyage', 'origin', 'threshold', 'silent-sea', 'open-sky', 'north-star', 'evening-star', 'landfall', 'outbound', 'perihelion'];
  for (const w of words) {
    const s = generate(w), t = s.planets.map((p) => (p.type === 'icegiant' ? 'N' : p.type[0]) + (p.rings ? '°' : '') + p.moons.length + '@' + (p.el.a / 1.5e11).toFixed(1)).join(' ');
    const ringed = s.planets.filter((p) => p.rings && p.moons.length >= 2 && p.type === 'gas').length;
    console.log(`${w.padEnd(14)} M=${(s.star.mass / M_SUN).toFixed(2)} T=${s.star.temp.toFixed(0)} n=${s.planets.length} belt=${s.belt ? 'y' : 'n'} ringedGas=${ringed} ocean=${s.planets.some((p) => p.type === 'ocean') ? 'y' : 'n'} | ${t} | ${validate(s).length ? 'INVALID' : ''}`);
  }
}

console.log(`\n${failed ? '✗' : '✓'} ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
