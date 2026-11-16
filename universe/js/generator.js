// Universe Engine: the system generator. Plain ES module (no Three.js), so Node can test it.
// The same seed text always gives the same system. Never uses Math.random or the clock.
// GEN_VERSION goes into shared links (?seed=...&v=1): if the recipe below ever changes, add a new version
// and keep this one, so old links still open the same system.
import { G, AU, M_SUN, R_SUN, M_EARTH, R_EARTH, DAY, starFromMass, blackbodyRGB, hillRadius, rocheLimit, density, prepareOrbit, orbitalPeriod } from './physics.js';

export const GEN_VERSION = 1;
export const SHOWCASE_SEED = 'starfall';
export const SPACING_K = 9;          // neighbouring planets stay at least this many mutual Hill radii apart
export const RING_ICE_DENSITY = 900; // kg m^-3, the ring particles (water ice)

// ---------- Seeded random numbers ----------
// cyrb128 turns the seed text into four 32-bit numbers; sfc32 is a small, well-tested generator.
function cyrb128(str) {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067); h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213); h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067); h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213); h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4; h2 ^= h1; h3 ^= h1; h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}
export function makeRng(text) {
  let [a, b, c, d] = cyrb128(text);
  const next = () => {
    a |= 0; b |= 0; c |= 0; d |= 0;
    const t = (a + b | 0) + d | 0;
    d = d + 1 | 0; a = b ^ b >>> 9; b = c + (c << 3) | 0; c = c << 21 | c >>> 11; c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 12; i++) next();
  const r = {
    f: next,
    range: (lo, hi) => lo + (hi - lo) * next(),
    log: (lo, hi) => lo * Math.pow(hi / lo, next()),
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p) => next() < p,
    pick: (list) => list[Math.floor(next() * list.length)],
    weighted: (pairs) => { let u = next() * pairs.reduce((s, p) => s + p[1], 0); for (const p of pairs) { u -= p[1]; if (u < 0) return p[0]; } return pairs[pairs.length - 1][0]; },
  };
  return r;
}
// Round to 7 significant figures. Browsers may differ in the last binary digit of pow, sin and so on; rounding
// every generated value removes those differences, so the same seed gives the same system on every device.
const sig = (x) => (x === 0 || !isFinite(x) ? x : Number(x.toPrecision(7)));

// ---------- Names (invented; the same seed gives the same names) ----------
const ONSET = ['v', 't', 'k', 's', 'm', 'n', 'l', 'r', 'd', 'z', 'th', 'br', 'c', 'h', 'p', 'tr', 'gl', 'f', 'g', ''];
const VOWEL = ['a', 'e', 'i', 'o', 'u', 'a', 'e', 'o', 'i', 'ia', 'ae'];
const CODA = ['', '', '', 'n', 'r', 's', 'l', 'th', 'x', 'm', 'nd', 'rn'];
const BLOCK = ['ass', 'fuk', 'fuc', 'fuq', 'shi', 'sex', 'cum', 'tit', 'dic', 'dik', 'coc', 'cok', 'pis', 'nig', 'fag', 'anu', 'poo', 'pee', 'wan', 'bum', 'kun', 'cun', 'twa', 'ars', 'naz', 'rap', 'slu', 'hor', 'die', 'dea', 'kil', 'sux', 'suc', 'vag', 'pen', 'tes', 'hel', 'dam', 'cra', 'jiz', 'jis', 'ana', 'but', 'tur', 'las', 'les', 'gay', 'jew', 'pak', 'chin', 'spa', 'ret', 'mor', 'lol', 'yes', 'sat', 'isis', 'hit', 'kkk', 'nob', 'kno', 'bal', 'bol', 'min', 'her', 'his', 'she', 'man', 'men', 'sin', 'lus'];
function makeName(r, used, syllables) {
  for (let tries = 0; tries < 200; tries++) {
    let s = '';
    const n = syllables || r.int(2, 3);
    for (let i = 0; i < n; i++) s += r.pick(ONSET) + r.pick(VOWEL) + (i === n - 1 ? r.pick(CODA) : '');
    if (s.length < 4 || s.length > 9 || /(.)\1\1/.test(s) || /[aeiouy]{3}/.test(s) || !/^[^aeiouy]{0,2}[aeiouy]/.test(s)) continue;
    if (BLOCK.some((b) => s.includes(b)) || used.has(s)) continue;
    used.add(s);
    return s[0].toUpperCase() + s.slice(1);
  }
  const s = 'Body' + (used.size + 1); used.add(s); return s;
}

// ---------- Planet types ----------
// Mass ranges in Earth masses. Radii follow from mass with a rule that keeps each type's density realistic.
export const TYPES = {
  rocky: { label: 'Rocky planet', mass: [0.05, 3], rho: [2700, 8700] },
  desert: { label: 'Desert planet', mass: [0.08, 2.5], rho: [2700, 8700] },
  ocean: { label: 'Ocean planet', mass: [0.4, 5], rho: [2700, 8700] },
  ice: { label: 'Ice world', mass: [0.005, 1.5], rho: [1300, 2800] },
  gas: { label: 'Gas giant', mass: [60, 600], rho: [300, 3200] },
  icegiant: { label: 'Ice giant', mass: [8, 30], rho: [1000, 2200] },
};
function planetRadius(type, mE, r) {
  if (type === 'ice') return Math.cbrt(mE * M_EARTH / (4 / 3 * Math.PI * r.range(1500, 2600)));
  if (type === 'gas') return 11.2 * R_EARTH * Math.pow(mE / 318, mE < 318 ? 0.1 : -0.04) * r.range(0.97, 1.03);
  if (type === 'icegiant') return 3.95 * R_EARTH * Math.pow(mE / 16, 0.3) * r.range(0.97, 1.03);
  return R_EARTH * Math.pow(mE, 0.27) * r.range(0.96, 1.04);   // rock and iron: Earth-like, slightly compressed when heavy
}
function pickType(x, r) {
  // x = distance in units where the habitable zone is near 1 and the frost line near 2.7
  if (x < 0.6) return r.weighted([['rocky', 6], ['desert', 4]]);
  if (x < 0.85) return r.weighted([['desert', 5], ['rocky', 5]]);
  if (x < 1.5) return r.weighted([['ocean', 6], ['desert', 2], ['rocky', 2]]);
  if (x < 2.7) return r.weighted([['rocky', 4], ['desert', 3], ['ice', 3]]);
  if (x < 13) return r.weighted([['gas', 5], ['icegiant', 3], ['ice', 2]]);
  return r.weighted([['icegiant', 4], ['ice', 4.5], ['gas', 1.5]]);
}
const mutualHill = (a1, m1, a2, m2, M) => Math.cbrt((m1 + m2) / (3 * M)) * (a1 + a2) / 2;
// How many mutual Hill radii separate the outer edge of the inner orbit from the inner edge of the outer one.
export const separation = (p1, p2, M) => (p2.el.a * (1 - p2.el.e) - p1.el.a * (1 + p1.el.e)) / mutualHill(p1.el.a, p1.mass, p2.el.a, p2.mass, M);

function unit(v) { const n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

// ---------- The generator ----------
export function generate(seedText, version = GEN_VERSION) {
  if (version !== 1) throw new Error('Unknown generator version ' + version);
  const seed = String(seedText);
  const used = new Set();
  const rs = makeRng('v1/star/' + seed);

  // Star: 0.5 to 2 solar masses, with more small stars than large ones.
  const mSolar = sig(0.5 * Math.pow(4, Math.pow(rs.f(), 1.3)));
  const st = starFromMass(mSolar);
  const star = {
    kind: 'star', name: makeName(rs, used), mass: sig(st.mass), radius: sig(st.radius), luminosity: sig(st.luminosity), temp: sig(st.temp),
    color: blackbodyRGB(st.temp, [0, 0, 0]).map(sig), rotPeriod: sig(rs.range(18, 40) * DAY), vis: [rs.f(), rs.f(), rs.f(), rs.f()].map(sig),
  };
  const M = star.mass;
  const zone = Math.sqrt(star.luminosity / 3.83e26) * AU;   // distance receiving the same light as 1 AU from the Sun

  // Planets, from the inside out.
  const n = rs.int(4, 9);
  const planets = [];
  let a = rs.range(0.25, 0.5) * zone;
  let beltAfter = -1, belt = null;
  for (let k = 0; k < n; k++) {
    const r = makeRng('v1/planet' + k + '/' + seed);
    const prev = planets[k - 1];
    if (prev) a = prev.el.a * r.range(1.45, n <= 5 ? 2.4 : 2.0);
    // The belt goes in front of the first planet beyond the frost line (or after the middle planet if there is none).
    const wantBelt = beltAfter < 0 && prev && k >= 2 && (a / zone > 2.7 || k === Math.max(2, Math.ceil(n / 2)));
    if (wantBelt) a *= r.range(1.35, 1.7);
    const type = pickType(a / zone, r);
    const mE = r.log(TYPES[type].mass[0], TYPES[type].mass[1]);
    const p = {
      kind: 'planet', type, name: makeName(r, used), mass: sig(mE * M_EARTH), radius: sig(planetRadius(type, mE, r)),
      el: { a: 0, e: sig(r.chance(0.12) && planets.filter((q) => q.el.e > 0.25).length < Math.floor(n / 3) ? r.range(0.25, 0.42) : 0.22 * Math.pow(r.f(), 1.8)), i: sig(r.range(0, 0.06) * r.f()), O: sig(r.range(0, 2 * Math.PI)), w: sig(r.range(0, 2 * Math.PI)), M0: sig(r.range(0, 2 * Math.PI)), t0: 0 },
      obliquity: sig(type === 'gas' || type === 'icegiant' ? 0.12 + r.range(0, 0.4) : r.range(0, 0.55) * r.f()), tiltDir: sig(r.range(0, 2 * Math.PI)),
      rotPeriod: sig((type === 'gas' || type === 'icegiant' ? r.range(9, 18) : r.range(12, 70)) * 3600),
      vis: [r.f(), r.f(), r.f(), r.f(), r.f(), r.f()].map(sig), rings: null, moons: [],
    };
    p.el.a = a;
    // Push the planet outwards until it is far enough from its inner neighbour.
    if (prev) while (separation(prev, p, M) < SPACING_K * 1.05) p.el.a *= 1.03;
    if (wantBelt) {
      // Widen the gap until a belt fits with clear margins on both sides.
      for (let tries = 0; tries < 80; tries++) {
        const inner = prev.el.a * (1 + prev.el.e) + 5 * hillRadius(prev.el.a, 0, prev.mass, M) + 0.08 * (p.el.a - prev.el.a);
        const outer = p.el.a * (1 - p.el.e) - 4.5 * hillRadius(p.el.a, 0, p.mass, M) - 0.08 * (p.el.a - prev.el.a);
        if (outer - inner > 0.22 * prev.el.a) { belt = { inner: sig(inner), outer: sig(outer), seed: sig(r.f()) }; beltAfter = k - 1; break; }
        p.el.a *= 1.04;
      }
    }
    p.el.a = a = sig(p.el.a);
    p.density = sig(density(p.mass, p.radius));
    p.atmosphere = type === 'gas' || type === 'icegiant' || type === 'ocean' || type === 'desert' ? 1 : (type === 'rocky' && mE > 0.35 ? 1 : 0);
    planets.push(p);
  }

  // Tilt, rings and moons.
  planets.forEach((p, k) => {
    const r = makeRng('v1/moons' + k + '/' + seed);
    // Spin axis: tilted from the system's z axis by the obliquity.
    const axis = unit([Math.sin(p.obliquity) * Math.cos(p.tiltDir), Math.sin(p.obliquity) * Math.sin(p.tiltDir), Math.cos(p.obliquity)]);
    const ex = unit(cross(Math.abs(axis[2]) > 0.99 ? [1, 0, 0] : [0, 0, 1], axis)), ey = cross(axis, ex);
    p.axis = axis.map(sig);
    p.basis = [...ex, ...ey, ...axis].map(sig);          // the planet's equator frame
    const giant = p.type === 'gas' || p.type === 'icegiant';
    const roche = rocheLimit(p.radius, p.density, RING_ICE_DENSITY);
    if (giant && r.chance(p.type === 'gas' ? 0.6 : 0.4)) {
      const inner = r.range(1.25, 1.55) * p.radius, outer = Math.min(r.range(2.0, 2.7) * p.radius, 0.95 * roche);
      if (outer > inner + 0.35 * p.radius) p.rings = { inner: sig(inner), outer: sig(outer), seed: sig(r.f()), tint: sig(r.f()) };
    }
    const hill = hillRadius(p.el.a, p.el.e, p.mass, M);
    const count = giant ? r.int(p.type === 'gas' ? 2 : 1, p.type === 'gas' ? 5 : 4) : (p.type === 'ice' ? (r.chance(0.3) ? 1 : 0) : r.weighted([[0, 4], [1, 4.5], [2, 1.5]]));
    const rhoMoon = () => r.range(1600, 3400);
    let last = 0;
    for (let j = 0; j < count; j++) {
      const rho = rhoMoon();
      const aMin = Math.max(1.2 * rocheLimit(p.radius, p.density, rho), p.rings ? 1.3 * p.rings.outer : 0, 3 * p.radius, last * 1.45);
      const aMax = Math.min(0.33 * hill, r.range(25, 60) * p.radius);
      if (aMax < aMin * 1.15) break;
      const am = aMin * Math.pow(aMax / aMin, (j + r.range(0.15, 0.6)) / count);
      last = am;
      const mm = p.mass * (giant ? r.log(2e-6, 2.5e-4) : r.log(1e-4, 1.2e-2));
      const moon = {
        kind: 'moon', type: a / zone > 2.7 && r.chance(0.7) ? 'moonice' : 'moonrock', name: makeName(r, used, 2), mass: sig(mm), radius: sig(Math.cbrt(mm / (4 / 3 * Math.PI * rho))),
        el: { a: sig(am), e: sig(0.03 * r.f() * r.f()), i: sig(0.035 * r.f()), O: sig(r.range(0, 2 * Math.PI)), w: sig(r.range(0, 2 * Math.PI)), M0: sig(r.range(0, 2 * Math.PI)), t0: 0 },
        vis: [r.f(), r.f(), r.f(), r.f(), r.f(), r.f()].map(sig), atmosphere: 0, rings: null, moons: [],
      };
      moon.density = sig(density(moon.mass, moon.radius));
      moon.rotPeriod = sig(orbitalPeriod(moon.el.a, G * p.mass));   // tidally locked: one spin per orbit
      moon.axis = p.axis; moon.basis = p.basis;
      p.moons.push(moon);
    }
  });

  const sys = { seed, version, star, planets, belt, zone: sig(zone) };
  finish(sys);
  return sys;
}

// Set up the vectors each orbit needs (not part of the hashed data).
export function finish(sys) {
  for (const p of sys.planets) {
    prepareOrbit(p.el); p.parent = sys.star;
    for (const m of p.moons) { prepareOrbit(m.el, p.basis); m.parent = p; }
  }
  return sys;
}

// ---------- Checking and hashing (used by the tests) ----------
// A short fingerprint of everything generated. Two systems with the same hash are identical.
export function hashSystem(sys) {
  const text = JSON.stringify(sys, (key, v) => (key === 'parent' || key === 'P' || key === 'Q' ? undefined : v));
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 + c, 2654435761) ^ (h2 >>> 13);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

// Returns a list of everything about the system that breaks the rules of plausibility (empty when all is well).
export function validate(sys) {
  const bad = [], M = sys.star.mass, ms = M / M_SUN;
  if (ms < 0.5 || ms > 2) bad.push(`star mass ${ms} solar masses`);
  if (sys.planets.length < 4 || sys.planets.length > 9) bad.push(`${sys.planets.length} planets`);
  sys.planets.forEach((p, k) => {
    const T = TYPES[p.type], mE = p.mass / M_EARTH;
    if (mE < T.mass[0] * 0.999 || mE > T.mass[1] * 1.001) bad.push(`${p.name}: mass ${mE} outside ${p.type} range`);
    if (p.density < T.rho[0] || p.density > T.rho[1]) bad.push(`${p.name}: density ${p.density} outside ${p.type} range`);
    if (Math.abs(p.density - density(p.mass, p.radius)) > 1e-5 * p.density) bad.push(`${p.name}: density does not match mass and radius`);
    if (p.el.e < 0 || p.el.e > 0.45) bad.push(`${p.name}: eccentricity ${p.el.e}`);
    if (k && separation(sys.planets[k - 1], p, M) < SPACING_K) bad.push(`${p.name}: only ${separation(sys.planets[k - 1], p, M).toFixed(1)} mutual Hill radii from its inner neighbour`);
    const hill = hillRadius(p.el.a, p.el.e, p.mass, M);
    if (p.rings) {
      if (p.rings.outer > rocheLimit(p.radius, p.density, RING_ICE_DENSITY)) bad.push(`${p.name}: rings reach beyond the Roche limit`);
      if (p.rings.inner < 1.1 * p.radius || p.rings.outer <= p.rings.inner) bad.push(`${p.name}: ring radii`);
    }
    p.moons.forEach((m, j) => {
      if (m.el.a * (1 + m.el.e) > 0.4 * hill) bad.push(`${m.name}: outside 0.4 of ${p.name}'s Hill radius`);
      if (m.el.a * (1 - m.el.e) < rocheLimit(p.radius, p.density, m.density)) bad.push(`${m.name}: inside the Roche limit`);
      if (m.density < 1500 || m.density > 3500) bad.push(`${m.name}: density ${m.density}`);
      if (j && m.el.a < p.moons[j - 1].el.a * 1.3) bad.push(`${m.name}: too close to the next moon in`);
      if (p.rings && m.el.a < p.rings.outer * 1.2) bad.push(`${m.name}: inside the rings`);
    });
  });
  const lowE = sys.planets.filter((p) => p.el.e <= 0.25).length;
  if (lowE < sys.planets.length / 2) bad.push('most planets should have low eccentricity');
  if (sys.belt) {
    const b = sys.belt, k = sys.planets.findIndex((p) => p.el.a > b.outer);
    const inP = sys.planets[k - 1], outP = sys.planets[k];
    if (!inP || !outP) bad.push('belt is not between two planets');
    else {
      if (b.inner < inP.el.a * (1 + inP.el.e) + 4 * hillRadius(inP.el.a, 0, inP.mass, M)) bad.push('belt too close to the planet inside it');
      if (b.outer > outP.el.a * (1 - outP.el.e) - 4 * hillRadius(outP.el.a, 0, outP.mass, M)) bad.push('belt too close to the planet outside it');
      if (b.outer <= b.inner) bad.push('belt has no width');
    }
  }
  return bad;
}

// Small helper for the tests and the page: every body in one flat list (star first).
export function allBodies(sys) {
  const list = [sys.star];
  for (const p of sys.planets) { list.push(p); for (const m of p.moons) list.push(m); }
  return list;
}
export { R_SUN };
