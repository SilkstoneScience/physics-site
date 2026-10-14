// Independent check of every Paper 2 answer (docs/PAPER2_SPECIFICATION.md section 6).
// Each question's results are worked out again here, from first principles, WITHOUT using the question's own
// calc(), tools/p2/constants.mjs or tools/p2/generate.mjs (tools/p2/test.mjs checks this file imports nothing).
// Write each entry from the physics, not by copying the question's calculation.
//
// An entry receives the given values exactly as the question states them ({ value, unit }) and returns every
// result in the question's display unit (the unit the result is shown in). The build fails if any result
// differs from the question's by more than 0.01 %.
// Data-booklet values used here are typed from the booklet itself, independently of constants.mjs.

const G = 9.8; // data booklet, acceleration of free fall
const rad = (deg) => deg * Math.PI / 180;

export const INDEPENDENT = {
  // Projectile launched below the horizontal: quadratic ½g t² + u_y t − h = 0, positive root.
  'A1-P01': ({ v, theta, h }) => {
    const uy = v.value * Math.sin(rad(theta.value));
    const ux = v.value * Math.cos(rad(theta.value));
    const a = G / 2, b = uy, c = -h.value;
    const t = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
    return { uy, vx: ux, vyf: uy + G * t, t, x: ux * t };
  },
  // Arrival-time difference: d/vs − d/vp = Δt (km and s throughout); λ = v/f with f = 1/T; 4 amplitudes per cycle.
  'C2-P01': ({ vp, vs, dt, T, A }) => {
    const d = dt.value * vp.value * vs.value / (vp.value - vs.value);
    const f = 1 / T.value;
    return { d, lambda: vs.value / f, path: A.value + A.value + A.value + A.value };
  },
  // Series circuit in ohms and amps, converted to the question's units (kΩ, mA, mW) at the end.
  'B5-P01': ({ emf, R, RT }) => {
    const r1 = R.value * 1000, r2 = RT.value * 1000;
    const amps = emf.value / (r1 + r2);
    const vR = emf.value * r1 / (r1 + r2);
    return { Rtot: (r1 + r2) / 1000, I: amps * 1000, VT: emf.value - vR, P: vR * amps * 1000 };
  },
  // Circular orbits: centripetal force = gravity; energies added term by term (not from E = −GMm/2r).
  'D1-P01': ({ M, RE, m, h1, h2 }) => {
    const Gc = 6.67e-11;
    const ra = RE.value + h1.value * 1e3, rb = RE.value + h2.value * 1e3;
    const speed = (r) => Math.sqrt(Gc * M.value / r);
    const total = (r) => 0.5 * m.value * speed(r) ** 2 - Gc * M.value * m.value / r;
    return { r1: ra, r2: rb, v1: speed(ra) / 1e3, T1: 2 * Math.PI * ra / speed(ra), E1: total(ra), E2: total(rb), dE: total(rb) - total(ra) };
  },
  // Cycle worked with temperatures for a pretend 1 mol of gas (the amount cancels), U = 3/2 nRT.
  'B4-P01': ({ pA, VA, VB }) => {
    const n = 1, R = 8.31;
    const pc = pA.value * Math.exp((5 / 3) * Math.log(VA.value / VB.value));
    const TA = pA.value * VA.value / (n * R), TB = pA.value * VB.value / (n * R), TC = pc * VB.value / (n * R);
    const U = (T) => 1.5 * n * R * T;
    const wAB = pA.value * (VB.value - VA.value);
    const qAB = U(TB) - U(TA) + wAB;
    const wOnCA = U(TA) - U(TC);
    return { pC: pc, W_AB: wAB, dU_AB: U(TB) - U(TA), Q_AB: qAB, W_onCA: wOnCA, Wnet: wAB - wOnCA, eff: (wAB - wOnCA) / qAB };
  },
  // Stopping voltage line V = (h/e)(f − f0): gradient from two points on it; work function = e × (h/e) × f0, in eV.
  'E2-P01': ({ f0, hg }) => {
    const e = 1.60e-19;
    const line = (f) => hg.value * (f - f0.value) / e;
    const f1 = 7e14, f2 = 1.1e15;
    const gradient = (line(f2) - line(f1)) / (f2 - f1);
    return { f0_read: f0.value, grad: gradient, hexp: gradient * e, phi: gradient * f0.value };
  },
};
