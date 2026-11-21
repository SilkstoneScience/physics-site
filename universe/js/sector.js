// Universe Engine: the neighbourhood of stars around a system. Plain ES module (Node tests it).
// A "sector" is built from one seed. Star 0 is the home system (the seed itself, exactly as before);
// stars 1..N are its neighbours, each a full system with its own seed "<seed>~<number>".
// The same seed always gives the same stars in the same places, so a trip there and back is consistent.
import { generate, makeRng } from './generator.js';

export const LIGHT_YEAR = 9.46e15;      // m (data booklet)
export const C_LIGHT = 3.00e8;          // m s^-1 (data booklet)
export const SECTOR_RADIUS = 12;        // light years
// About one star per 290 cubic light years, close to the density near the Sun: 20 to 28 neighbours within 12 light years.
const round = (x) => Number(x.toPrecision(7));

export const systemSeed = (sectorSeed, index) => (index ? `${sectorSeed}~${index}` : String(sectorSeed));

export function buildSector(seed) {
  const r = makeRng('v1/sector/' + seed), n = r.int(20, 28), stars = [];
  const add = (index, pos) => {
    const sys = generate(systemSeed(seed, index));
    stars.push({ index, seed: sys.seed, pos, name: sys.star.name, mass: sys.star.mass, radius: sys.star.radius, luminosity: sys.star.luminosity, temp: sys.star.temp, color: sys.star.color, planets: sys.planets.length });
  };
  add(0, [0, 0, 0]);
  for (let i = 1; i <= n; i++) {
    for (let tries = 0; tries < 400; tries++) {
      // a random point inside the sphere, not closer than 1.3 light years to any star already placed
      const u = r.range(-1, 1), a = r.range(0, 2 * Math.PI), s = Math.sqrt(1 - u * u), d = SECTOR_RADIUS * Math.cbrt(r.f());
      const p = [d * s * Math.cos(a), d * s * Math.sin(a), d * u].map((x) => round(x * LIGHT_YEAR));
      if (stars.every((q) => Math.hypot(q.pos[0] - p[0], q.pos[1] - p[1], q.pos[2] - p[2]) > 1.3 * LIGHT_YEAR)) { add(i, p); break; }
    }
  }
  return { seed: String(seed), stars };
}
// Distance between two stars of a sector, in metres.
export const starDistance = (a, b) => Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1], a.pos[2] - b.pos[2]);
// Apparent brightness (W m^-2) of a star of luminosity L seen from a distance d: b = L / (4 pi d^2).
export const apparentBrightness = (L, d) => L / (4 * Math.PI * d * d);
