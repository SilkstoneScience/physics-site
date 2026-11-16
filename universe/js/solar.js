// Universe Engine: the real Solar System, in the same form the generator produces. Plain ES module (Node tests it).
//
// Sources (both United States government works, in the public domain):
//   NASA NSSDCA Planetary Fact Sheets (D. R. Williams), nssdc.gsfc.nasa.gov/planetary/factsheet/ : masses, radii,
//     rotation periods, the Sun, the Moon, the Galilean moons, Titan and Triton. Read 16 November 2026.
//   NASA JPL Solar System Dynamics, "Approximate Positions of the Planets" (E. M. Standish), Table 1: the planets'
//     orbital elements at the epoch J2000 (1 January 2000, 12:00). ssd.jpl.nasa.gov/planets/approx_pos.html
//   Spin-axis directions: IAU Working Group on Cartographic Coordinates and Rotational Elements (right ascension
//     and declination of each north pole).
//
// What is real: masses, sizes, orbits, tilts, spin rates, and where each planet is on a given date (to a small
// fraction of a degree for some decades either side of 2000; the slow drift of the orbits is left out).
// What is not: the surfaces are drawn by the same procedural shaders as invented planets (Earth's continents here
// are made up); only seven large moons are included, and they start at arbitrary points of their real orbits.
import { G, prepareOrbit, density, orbitalPeriod, blackbodyRGB } from './physics.js';

export const AU_EXACT = 1.495978707e11;                  // m (the booklet's 1.50e11 is this, rounded)
export const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);  // the moment t = 0
const DEG = Math.PI / 180, OBLIQUITY = 23.4393 * DEG;
export const isSol = (seed) => /^(sol|solar[- ]?system|the solar system)$/i.test(String(seed).trim());

// name, type for the label, shader to draw it with, mass /10^24 kg, mean radius /km, rotation /h (negative: backwards),
// then JPL: a /au, e, I /deg, mean longitude L, longitude of perihelion, longitude of ascending node /deg,
// then the north pole's right ascension and declination /deg, and six numbers that pick its colours.
const PLANETS = [
  ['Mercury', 'rocky', 'rocky', 0.330, 2439.7, 1407.6, 0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593, 281.01, 61.41, [0.5, 0.2, 0.5, 0, 0, 0]],
  ['Venus', 'rocky', 'icegiant', 4.87, 6051.8, -5832.5, 0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255, 272.76, 67.16, [0, 0.2, 0, 0.5, 0, 0]],
  ['Earth', 'ocean', 'ocean', 5.97, 6371.0, 23.9345, 1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0, 0.0, 90.0, [0.45, 0.4, 0.55, 0.55, 0.75, 0.45]],
  ['Mars', 'desert', 'desert', 0.642, 3389.5, 24.6229, 1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891, 317.68, 52.89, [0.15, 0.2, 0, 0.35, 0.25, 0]],
  ['Jupiter', 'gas', 'gas', 1898, 69911, 9.925, 5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909, 268.06, 64.50, [0.1, 0.85, 0.6, 0.55, 0.75, 0]],
  ['Saturn', 'gas', 'gas', 568, 58232, 10.656, 9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448, 40.59, 83.54, [0.5, 0.6, 0.2, 0.2, 0.35, 0]],
  ['Uranus', 'icegiant', 'icegiant', 86.8, 25362, -17.24, 19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.95427630, 74.01692503, 257.31, -15.18, [0.1, 0.1, 0, 0.5, 0, 0]],
  ['Neptune', 'icegiant', 'icegiant', 102, 24622, 16.11, 30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574, 299.36, 43.46, [1, 0.6, 0, 0.3, 0, 0]],
];
// parent, name, type, mass /10^20 kg, radius /km, a /10^3 km, e, inclination /deg (to the planet's equator; the Moon's is to the ecliptic)
const MOONS = [
  ['Earth', 'Moon', 'moonrock', 734.6, 1737.4, 384.4, 0.0549, 5.145],
  ['Jupiter', 'Io', 'moonrock', 893.2, 1821.5, 421.8, 0.004, 0.04],
  ['Jupiter', 'Europa', 'moonice', 480.0, 1560.8, 671.1, 0.009, 0.47],
  ['Jupiter', 'Ganymede', 'moonice', 1481.9, 2631.2, 1070.4, 0.001, 0.18],
  ['Jupiter', 'Callisto', 'moonice', 1075.9, 2410.3, 1882.7, 0.007, 0.19],
  ['Saturn', 'Titan', 'moonice', 1345.5, 2575, 1221.87, 0.0292, 0.33],
  ['Neptune', 'Triton', 'moonice', 214, 1353.4, 354.76, 0.000016, 157.345],
];
const unit = (v) => { const n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// A direction given by right ascension and declination, in the engine's axes (x, y in the plane of Earth's orbit).
function poleToEcliptic(ra, dec) {
  const x = Math.cos(dec * DEG) * Math.cos(ra * DEG), y = Math.cos(dec * DEG) * Math.sin(ra * DEG), z = Math.sin(dec * DEG);
  return unit([x, y * Math.cos(OBLIQUITY) + z * Math.sin(OBLIQUITY), -y * Math.sin(OBLIQUITY) + z * Math.cos(OBLIQUITY)]);
}
const wrap = (x) => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

export function solarSystem() {
  const star = {
    kind: 'star', name: 'Sun', mass: 1.9884e30, radius: 6.957e8, luminosity: 3.828e26, temp: 5772,
    color: blackbodyRGB(5772, [0, 0, 0]), rotPeriod: 609.12 * 3600, vis: [0.31, 0.62, 0.17, 0.5],
  };
  const planets = PLANETS.map(([name, type, shade, m, r, rot, a, e, inc, L, peri, node, ra, dec, vis]) => {
    const p = {
      kind: 'planet', type, shade, name, mass: m * 1e24, radius: r * 1e3,
      el: { a: a * AU_EXACT, e, i: Math.abs(inc) * DEG, O: wrap(node * DEG), w: wrap((peri - node) * DEG), M0: wrap((L - peri) * DEG), t0: 0 },
      rotPeriod: rot * 3600, vis, rings: null, moons: [],
      atmosphere: type === 'rocky' && name !== 'Venus' ? 0 : 1,
    };
    p.density = density(p.mass, p.radius);
    const axis = poleToEcliptic(ra, dec);
    const ex = unit(cross(Math.abs(axis[2]) > 0.99 ? [1, 0, 0] : [0, 0, 1], axis)), ey = cross(axis, ex);
    p.axis = axis; p.basis = [...ex, ...ey, ...axis];
    p.obliquity = Math.acos(Math.max(-1, Math.min(1, axis[2])));
    return p;
  });
  const by = Object.fromEntries(planets.map((p) => [p.name, p]));
  by.Venus.label = 'Rocky planet under thick cloud';
  by.Venus.look = { A: [0.86, 0.78, 0.55], B: [0.93, 0.88, 0.7], C: [0.98, 0.95, 0.85], D: [0.8, 0.7, 0.45], atm: [0.95, 0.85, 0.6], atmK: 0.9 };
  // Saturn's main rings: from the inner edge of the C ring to the outer edge of the A ring
  by.Saturn.rings = { inner: 7.4658e7, outer: 1.36775e8, seed: 0.37, tint: 0.55 };
  MOONS.forEach(([parent, name, type, m, r, a, e, inc], k) => {
    const p = by[parent];
    const moon = {
      kind: 'moon', type, name, mass: m * 1e20, radius: r * 1e3,
      el: { a: a * 1e6, e, i: inc * DEG, O: wrap(1.7 * (k + 1)), w: wrap(2.9 * (k + 1)), M0: wrap(4.1 * (k + 1)), t0: 0 },
      vis: [0.3 + 0.1 * k, 0.2 + 0.1 * (k % 4), 0.5, 0.6, 0.4, 0.3], atmosphere: 0, rings: null, moons: [], axis: p.axis, basis: p.basis,
    };
    if (name === 'Moon') moon.orbitBasis = [1, 0, 0, 0, 1, 0, 0, 0, 1];      // the Moon's orbit is tilted to Earth's orbit, not its equator
    moon.density = density(moon.mass, moon.radius);
    moon.rotPeriod = orbitalPeriod(moon.el.a, G * p.mass);                  // all seven keep one face to their planet
    p.moons.push(moon);
  });
  const sys = { seed: 'sol', version: 1, real: true, star, planets, belt: { inner: 2.1 * AU_EXACT, outer: 3.3 * AU_EXACT, seed: 0.5 }, zone: AU_EXACT };
  for (const p of planets) { prepareOrbit(p.el); p.parent = star; for (const m of p.moons) { prepareOrbit(m.el, m.orbitBasis || p.basis); m.parent = p; } }
  return sys;
}

// The calendar date (UTC) a time t in seconds after J2000 falls on, e.g. "14 March 2031, 09 h".
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function dateText(t) {
  const d = new Date(J2000_MS + t * 1000);
  if (isNaN(d)) return 'far from the year 2000';
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${String(d.getUTCHours()).padStart(2, '0')} h`;
}
