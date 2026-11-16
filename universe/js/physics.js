// Universe Engine: physics. Plain ES module, SI units throughout, no imports, so Node can test it.
// Symbols follow the IB data booklet where it has them (G, sigma, AU).

// ---------- Constants ----------
export const G = 6.67e-11;          // N m^2 kg^-2 (data booklet)
export const SIGMA = 5.67e-8;       // W m^-2 K^-4 (data booklet, Stefan-Boltzmann constant)
export const AU = 1.50e11;          // m (data booklet)
// Not in the booklet: IAU nominal solar values and standard Earth values, to 3-4 significant figures.
export const M_SUN = 1.99e30;       // kg
export const R_SUN = 6.96e8;        // m
export const L_SUN = 3.83e26;       // W
export const T_SUN = 5772;          // K
export const M_EARTH = 5.97e24;     // kg
export const R_EARTH = 6.37e6;      // m
export const DAY = 86400;           // s
export const YEAR = 365.25 * DAY;   // s
export const TWO_PI = 2 * Math.PI;

// ---------- Simple relationships (data-booklet forms) ----------
export const fieldStrength = (M, r) => G * M / (r * r);                 // g = GM/r^2
export const gravForce = (M, m, r) => G * M * m / (r * r);              // F = GMm/r^2
export const circularSpeed = (M, r) => Math.sqrt(G * M / r);            // v = sqrt(GM/r), circular orbits only
export const escapeSpeed = (M, r) => Math.sqrt(2 * G * M / r);          // v_esc = sqrt(2GM/r)
export const potential = (M, r) => -G * M / r;                          // V_g = -GM/r
export const potentialEnergy = (M, m, r) => -G * M * m / r;             // E_p = -GMm/r
export const orbitalPeriod = (a, mu) => TWO_PI * Math.sqrt(a * a * a / mu); // T = 2 pi sqrt(a^3/GM)
// Speed anywhere on an ellipse (the vis-viva equation, beyond the IB course): v^2 = GM(2/r - 1/a)
export const visViva = (mu, r, a) => Math.sqrt(mu * (2 / r - 1 / a));
// Hill radius: roughly how far a planet's gravity dominates the star's.
export const hillRadius = (a, e, m, M) => a * (1 - e) * Math.cbrt(m / (3 * M));
// Roche limit for a fluid satellite of density rhoS around a planet of radius R and density rhoP.
export const rocheLimit = (R, rhoP, rhoS) => 2.44 * R * Math.cbrt(rhoP / rhoS);
export const density = (m, R) => m / (4 / 3 * Math.PI * R * R * R);

// ---------- Kepler's equation ----------
// Elliptical: M = E - e sin E. Newton-Raphson; converges for 0 <= e < 1.
export function solveKepler(M, e) {
  M -= TWO_PI * Math.round(M / TWO_PI);                // into [-pi, pi]
  let E = e < 0.8 ? M + e * Math.sin(M) : (M >= 0 ? Math.PI : -Math.PI);
  for (let i = 0; i < 50; i++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-15) break;
  }
  return E;
}
// Hyperbolic: M = e sinh H - H (for e > 1, an escape path).
export function solveKeplerHyp(M, e) {
  let H = Math.asinh(M / e);
  for (let i = 0; i < 80; i++) {
    const d = (e * Math.sinh(H) - H - M) / (e * Math.cosh(H) - 1);
    H -= d;
    if (Math.abs(d) < 1e-14 * (1 + Math.abs(H))) break;
  }
  return H;
}

// ---------- Orbits from elements ----------
// An orbit is { a, e, i, O, w, M0, t0, P:[3], Q:[3] }: semi-major axis (negative for a hyperbola), eccentricity,
// inclination, longitude of the ascending node, argument of periapsis, mean anomaly at time t0, and the two unit
// vectors of the orbit's own plane (P towards periapsis, Q 90 degrees ahead).
// basis (optional, 9 numbers: columns ex, ey, ez) turns the orbit's reference plane, e.g. to a planet's equator.
export function prepareOrbit(el, basis) {
  const cO = Math.cos(el.O), sO = Math.sin(el.O), cw = Math.cos(el.w), sw = Math.sin(el.w);
  const ci = Math.cos(el.i), si = Math.sin(el.i);
  const P = el.P || (el.P = [0, 0, 0]), Q = el.Q || (el.Q = [0, 0, 0]);
  const px = cO * cw - sO * sw * ci, py = sO * cw + cO * sw * ci, pz = sw * si;
  const qx = -cO * sw - sO * cw * ci, qy = -sO * sw + cO * cw * ci, qz = cw * si;
  if (basis) {
    P[0] = basis[0] * px + basis[3] * py + basis[6] * pz; P[1] = basis[1] * px + basis[4] * py + basis[7] * pz; P[2] = basis[2] * px + basis[5] * py + basis[8] * pz;
    Q[0] = basis[0] * qx + basis[3] * qy + basis[6] * qz; Q[1] = basis[1] * qx + basis[4] * qy + basis[7] * qz; Q[2] = basis[2] * qx + basis[5] * qy + basis[8] * qz;
  } else { P[0] = px; P[1] = py; P[2] = pz; Q[0] = qx; Q[1] = qy; Q[2] = qz; }
  if (el.t0 === undefined) el.t0 = 0;
  return el;
}

// Position and velocity relative to the parent at time t, written into out[o..o+5]. Returns the eccentric
// (or hyperbolic) anomaly. mu = G x (mass of the parent). No memory is allocated.
export function keplerState(el, mu, t, out, o) {
  const a = el.a, e = el.e, P = el.P, Q = el.Q;
  let x, y, vx, vy, anom;
  if (e < 1) {
    const n = Math.sqrt(mu / (a * a * a));
    const E = anom = solveKepler(el.M0 + n * (t - el.t0), e);
    const c = Math.cos(E), s = Math.sin(E), b = Math.sqrt(1 - e * e), k = a * n / (1 - e * c);
    x = a * (c - e); y = a * b * s; vx = -k * s; vy = k * b * c;
  } else {
    const A = -a, n = Math.sqrt(mu / (A * A * A));
    const H = anom = solveKeplerHyp(el.M0 + n * (t - el.t0), e);
    const c = Math.cosh(H), s = Math.sinh(H), b = Math.sqrt(e * e - 1), k = A * n / (e * c - 1);
    x = A * (e - c); y = A * b * s; vx = -k * s; vy = k * b * c;
  }
  out[o] = x * P[0] + y * Q[0]; out[o + 1] = x * P[1] + y * Q[1]; out[o + 2] = x * P[2] + y * Q[2];
  out[o + 3] = vx * P[0] + vy * Q[0]; out[o + 4] = vx * P[1] + vy * Q[1]; out[o + 5] = vx * P[2] + vy * Q[2];
  return anom;
}

// The reverse: the orbit that a body with this position and velocity (relative to its parent) is on right now.
// Fills el (including P and Q) and returns it. Used after a kick, and to draw the orbit in full-gravity mode.
export function stateToElements(rx, ry, rz, vx, vy, vz, mu, t, el) {
  const r = Math.hypot(rx, ry, rz), v2 = vx * vx + vy * vy + vz * vz;
  const hx = ry * vz - rz * vy, hy = rz * vx - rx * vz, hz = rx * vy - ry * vx, h = Math.hypot(hx, hy, hz);
  const rv = rx * vx + ry * vy + rz * vz;
  // eccentricity vector, pointing to periapsis
  let ex = ((v2 - mu / r) * rx - rv * vx) / mu, ey = ((v2 - mu / r) * ry - rv * vy) / mu, ez = ((v2 - mu / r) * rz - rv * vz) / mu;
  let e = Math.hypot(ex, ey, ez);
  const energy = v2 / 2 - mu / r;
  if (Math.abs(e - 1) < 1e-9) e = energy < 0 ? 1 - 1e-9 : 1 + 1e-9;   // a parabola is treated as its nearest neighbour
  const a = -mu / (2 * energy);
  const P = el.P || (el.P = [0, 0, 0]), Q = el.Q || (el.Q = [0, 0, 0]);
  const wx = hx / h, wy = hy / h, wz = hz / h;                          // orbit normal
  if (e > 1e-10) { P[0] = ex / e; P[1] = ey / e; P[2] = ez / e; } else { P[0] = rx / r; P[1] = ry / r; P[2] = rz / r; }
  Q[0] = wy * P[2] - wz * P[1]; Q[1] = wz * P[0] - wx * P[2]; Q[2] = wx * P[1] - wy * P[0];
  const x = rx * P[0] + ry * P[1] + rz * P[2], y = rx * Q[0] + ry * Q[1] + rz * Q[2];
  const nu = Math.atan2(y, x);                                          // true anomaly
  let M;
  if (e < 1) {
    const E = Math.atan2(Math.sqrt(1 - e * e) * Math.sin(nu), e + Math.cos(nu));
    M = E - e * Math.sin(E); el.anom = E;
  } else {
    const H = 2 * Math.atanh(Math.sqrt((e - 1) / (e + 1)) * Math.tan(nu / 2));
    M = e * Math.sinh(H) - H; el.anom = H;
  }
  el.a = a; el.e = e; el.M0 = M; el.t0 = t;
  el.i = Math.acos(Math.max(-1, Math.min(1, wz)));
  const nx = -wy, ny = wx, nn = Math.hypot(nx, ny);                     // ascending node direction
  if (nn > 1e-12) {
    el.O = Math.atan2(ny, nx);
    const cx = nx / nn, cy = ny / nn;                                   // node unit vector; m = w x node
    const mx = -wz * cy, my = wz * cx, mz = wx * cy - wy * cx;
    el.w = Math.atan2(P[0] * mx + P[1] * my + P[2] * mz, P[0] * cx + P[1] * cy);
  } else { el.O = 0; el.w = Math.atan2(P[1], P[0]) * (wz >= 0 ? 1 : -1); }
  return el;
}

// ---------- Full gravity (N-body) ----------
// Every body pulls on every other with F = G m1 m2 / r^2. No softening is used: bodies that touch are merged by
// the caller instead (see findCollision and merge).
export function createSystem(n) {
  return { n, m: new Float64Array(n), x: new Float64Array(3 * n), v: new Float64Array(3 * n), a: new Float64Array(3 * n), dead: new Uint8Array(n) };
}
export function accelerations(s) {
  const { n, m, x, a, dead } = s;
  a.fill(0);
  for (let i = 0; i < n; i++) {
    if (dead[i]) continue;
    const i3 = 3 * i;
    for (let j = i + 1; j < n; j++) {
      if (dead[j]) continue;
      const j3 = 3 * j;
      const dx = x[j3] - x[i3], dy = x[j3 + 1] - x[i3 + 1], dz = x[j3 + 2] - x[i3 + 2];
      const r2 = dx * dx + dy * dy + dz * dz, k = G / (r2 * Math.sqrt(r2));
      const ki = k * m[j], kj = k * m[i];
      a[i3] += ki * dx; a[i3 + 1] += ki * dy; a[i3 + 2] += ki * dz;
      a[j3] -= kj * dx; a[j3 + 1] -= kj * dy; a[j3 + 2] -= kj * dz;
    }
  }
}
// Leapfrog (kick-drift-kick, the same thing as velocity Verlet): 2nd order, symplectic.
// Call accelerations(s) once before the first step.
export function stepLeapfrog(s, dt) {
  const { x, v, a } = s, n3 = 3 * s.n, h = dt / 2;
  for (let i = 0; i < n3; i++) { v[i] += a[i] * h; x[i] += v[i] * dt; }
  accelerations(s);
  for (let i = 0; i < n3; i++) v[i] += a[i] * h;
}
// Yoshida's 4th-order symplectic method: three leapfrog-like sub-steps with special weights.
const Y1 = 1 / (2 - Math.cbrt(2)), Y0 = -Math.cbrt(2) * Y1;
const YC1 = Y1 / 2, YC2 = (Y0 + Y1) / 2;
export function stepYoshida(s, dt) {
  const { x, v, a } = s, n3 = 3 * s.n;
  let c = YC1 * dt, d = Y1 * dt;
  for (let i = 0; i < n3; i++) x[i] += v[i] * c;
  accelerations(s);
  c = YC2 * dt;
  for (let i = 0; i < n3; i++) { v[i] += a[i] * d; x[i] += v[i] * c; }
  accelerations(s);
  d = Y0 * dt;
  for (let i = 0; i < n3; i++) { v[i] += a[i] * d; x[i] += v[i] * c; }
  accelerations(s);
  d = Y1 * dt; c = YC1 * dt;
  for (let i = 0; i < n3; i++) { v[i] += a[i] * d; x[i] += v[i] * c; }
}
export function kineticEnergy(s) {
  let k = 0;
  for (let i = 0; i < s.n; i++) if (!s.dead[i]) k += 0.5 * s.m[i] * (s.v[3 * i] ** 2 + s.v[3 * i + 1] ** 2 + s.v[3 * i + 2] ** 2);
  return k;
}
export function potentialEnergySystem(s) {
  let u = 0;
  for (let i = 0; i < s.n; i++) {
    if (s.dead[i]) continue;
    for (let j = i + 1; j < s.n; j++) {
      if (s.dead[j]) continue;
      u -= G * s.m[i] * s.m[j] / Math.hypot(s.x[3 * j] - s.x[3 * i], s.x[3 * j + 1] - s.x[3 * i + 1], s.x[3 * j + 2] - s.x[3 * i + 2]);
    }
  }
  return u;
}
export const totalEnergy = (s) => kineticEnergy(s) + potentialEnergySystem(s);
export function angularMomentum(s, out) {
  let lx = 0, ly = 0, lz = 0;
  for (let i = 0; i < s.n; i++) {
    if (s.dead[i]) continue;
    const k = 3 * i, m = s.m[i];
    lx += m * (s.x[k + 1] * s.v[k + 2] - s.x[k + 2] * s.v[k + 1]);
    ly += m * (s.x[k + 2] * s.v[k] - s.x[k] * s.v[k + 2]);
    lz += m * (s.x[k] * s.v[k + 1] - s.x[k + 1] * s.v[k]);
  }
  out[0] = lx; out[1] = ly; out[2] = lz;
  return out;
}
// Move to the frame where the centre of mass is at rest at the origin.
export function toBarycentre(s) {
  let M = 0, cx = 0, cy = 0, cz = 0, px = 0, py = 0, pz = 0;
  for (let i = 0; i < s.n; i++) {
    if (s.dead[i]) continue;
    const k = 3 * i, m = s.m[i];
    M += m; cx += m * s.x[k]; cy += m * s.x[k + 1]; cz += m * s.x[k + 2]; px += m * s.v[k]; py += m * s.v[k + 1]; pz += m * s.v[k + 2];
  }
  for (let i = 0; i < s.n; i++) {
    const k = 3 * i;
    s.x[k] -= cx / M; s.x[k + 1] -= cy / M; s.x[k + 2] -= cz / M; s.v[k] -= px / M; s.v[k + 1] -= py / M; s.v[k + 2] -= pz / M;
  }
}
// First pair of live bodies whose surfaces touch: returns i * n + j (i < j), or -1.
export function findCollision(s, radii) {
  for (let i = 0; i < s.n; i++) {
    if (s.dead[i]) continue;
    for (let j = i + 1; j < s.n; j++) {
      if (s.dead[j]) continue;
      const d = Math.hypot(s.x[3 * j] - s.x[3 * i], s.x[3 * j + 1] - s.x[3 * i + 1], s.x[3 * j + 2] - s.x[3 * i + 2]);
      if (d < radii[i] + radii[j]) return i * s.n + j;
    }
  }
  return -1;
}
// Perfectly inelastic collision: the lighter body joins the heavier one. Momentum is conserved; kinetic energy is not.
export function merge(s, i, j) {
  const keep = s.m[i] >= s.m[j] ? i : j, lose = keep === i ? j : i, M = s.m[i] + s.m[j];
  for (let c = 0; c < 3; c++) {
    s.x[3 * keep + c] = (s.m[keep] * s.x[3 * keep + c] + s.m[lose] * s.x[3 * lose + c]) / M;
    s.v[3 * keep + c] = (s.m[keep] * s.v[3 * keep + c] + s.m[lose] * s.v[3 * lose + c]) / M;
  }
  s.m[keep] = M; s.m[lose] = 0; s.dead[lose] = 1;
  return keep;
}

// ---------- A test mass launched straight up ----------
// st = [r, v]: distance from the planet's centre and radial velocity. Only the planet's gravity acts
// (no air, no rotation, no star). Velocity Verlet.
export function radialStep(st, GM, dt) {
  let r = st[0], v = st[1];
  v -= GM / (r * r) * dt / 2;
  r += v * dt;
  v -= GM / (r * r) * dt / 2;
  st[0] = r; st[1] = v;
}
// Greatest distance from the centre reached by a mass launched from radius R at a fraction f of escape speed
// (from energy conservation). Infinity when f >= 1.
export const maxRadius = (R, f) => (f >= 1 ? Infinity : R / (1 - f * f));

// ---------- Stars ----------
// Main-sequence approximations, with M in solar masses (good to a few tens of per cent for 0.5-2 solar masses):
//   luminosity L = M^4;  radius R = M^0.8 (M < 1) or M^0.57 (M >= 1);
//   surface temperature from the Stefan-Boltzmann law, L = sigma A T^4 with A = 4 pi R^2.
export function starFromMass(mSolar) {
  const L = Math.pow(mSolar, 4) * L_SUN;
  const R = Math.pow(mSolar, mSolar < 1 ? 0.8 : 0.57) * R_SUN;
  const T = Math.pow(L / (4 * Math.PI * R * R * SIGMA), 0.25);
  return { mass: mSolar * M_SUN, luminosity: L, radius: R, temp: T };
}
// Colour of a black body at temperature T (1667-25000 K) as linear sRGB with the largest channel = 1.
// Uses the Kim et al. cubic fit to the Planckian locus in CIE xy, then the standard xyY -> sRGB matrix.
export function blackbodyRGB(T, out) {
  T = Math.max(1667, Math.min(25000, T));
  const u = 1000 / T;
  const x = T < 4000 ? -0.2661239 * u * u * u - 0.2343589 * u * u + 0.8776956 * u + 0.17991
    : -3.0258469 * u * u * u + 2.1070379 * u * u + 0.2226347 * u + 0.24039;
  const y = T < 2222 ? -1.1063814 * x * x * x - 1.3481102 * x * x + 2.18555832 * x - 0.20219683
    : T < 4000 ? -0.9549476 * x * x * x - 1.37418593 * x * x + 2.09137015 * x - 0.16748867
      : 3.081758 * x * x * x - 5.8733867 * x * x + 3.75112997 * x - 0.37001483;
  const X = x / y, Z = (1 - x - y) / y;
  let r = 3.2406 * X - 1.5372 - 0.4986 * Z, g = -0.9689 * X + 1.8758 + 0.0415 * Z, b = 0.0557 * X - 0.204 + 1.057 * Z;
  r = Math.max(0, r); g = Math.max(0, g); b = Math.max(0, b);
  const m = Math.max(r, g, b);
  out[0] = r / m; out[1] = g / m; out[2] = b / m;
  return out;
}
