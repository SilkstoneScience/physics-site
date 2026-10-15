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
  // Weather balloon: forces from Newton's second law; amount of helium from pV = nRT, then the new volume;
  // radio wavelength and travel time with c; power from the loss of potential energy per second.
  'LQ-S01': ({ V1, m, rho, p1, T1, p2, T2, f, alt, dx, mp, vt }) => {
    const c = 3.00e8, R = 8.31;
    const up = rho.value * V1.value * G, down = m.value * G;
    const tk1 = T1.value + 273, tk2 = T2.value + 273;
    const moles = p1.value * V1.value / (R * tk1);
    const path = Math.sqrt((alt.value * 1e3) ** 2 + (dx.value * 1e3) ** 2);
    return {
      Fb: up, W: down, T1_K: tk1, T2_K: tk2, a: (up - down) / m.value,
      V2: moles * R * tk2 / p2.value,
      lambda: c / (f.value * 1e6),
      dist: path / 1e3, time: path / c,
      P: mp.value * G * vt.value,
    };
  },
  // Radioisotope source: power = activity × energy per decay; halving per half-life by repeated halving;
  // Stefan–Boltzmann; P = IV; g = GM/r².
  'LQ-S02': ({ A0, Ea, Thalf, t3, mc, c, Prad, Af, Pe, Ve, Rc, Ms, rs }) => {
    const MeV = 1.60e-13, sigma = 5.67e-8, Gc = 6.67e-11;
    const watts = A0.value * Ea.value * MeV;
    let later = watts;
    const n = Math.round(t3.value / Thalf.value);
    for (let i = 0; i < n; i++) later /= 2;
    const amps = Pe.value / Ve.value;
    return {
      P0: watts / 1e3, halves: t3.value / Thalf.value, P3: later,
      rate: watts / (mc.value * c.value),
      Tf: Math.sqrt(Math.sqrt(Prad.value * 1e3 / (sigma * Af.value))),
      I: amps, eff: 100 * Pe.value / watts, Pc: amps * amps * Rc.value,
      g: Gc * Ms.value / (rs.value * rs.value),
    };
  },
  // Cyclotron: r = mv/(qB); period 2πr/v; energy ½mv²; γ from v/c; decay via half-lives elapsed (2^(−t/T½),
  // equivalent to e^(−λt)); beam power = protons per second × energy; water flow from Q = mcΔT per second.
  'LQ-H01': ({ B, r, Th, A0, tt, Ib, dTw, cw }) => {
    const q = 1.60e-19, mp = 1.673e-27, c = 3.00e8;
    const speed = q * B.value * r.value / mp;
    const ekJ = 0.5 * mp * speed * speed;
    const thS = Th.value * 60;
    const lam = Math.LN2 / thS;
    const act = A0.value * Math.pow(0.5, (tt.value * 60) / thS);
    const watts = (Ib.value * 1e-6 / q) * ekJ;
    return {
      speed, T: 2 * Math.PI * r.value / speed, Ek_J: ekJ, Ek: ekJ / (q * 1e6), beta: speed / c,
      gamma: 1 / Math.sqrt(1 - (speed / c) ** 2), lam, A: act, N: act / lam, P: watts, flow: watts / (cw.value * dTw.value),
    };
  },
  // Flywheel: run-down from the angular impulse τt = Iω and the work done by friction τΔθ = E; efficiency from
  // energies; average emf from Faraday's law over a quarter turn; temperature rise from Q = mcΔT.
  'LQ-H02': ({ M, R, w1, tau, mt, vt, w2, N, A, B, mb, cs }) => {
    const inertia = M.value * R.value * R.value / 2;
    const om1 = w1.value * 2 * Math.PI / 60, om2 = w2.value * 2 * Math.PI / 60;
    const ke = (om) => inertia * om * om / 2;
    const t = inertia * om1 / tau.value;
    const theta = ke(om1) / tau.value;
    const revPerSec = w1.value / 60;
    return {
      I: inertia, w1SI: om1, E1: ke(om1), alpha: tau.value / inertia, tstop: t, revs: theta / (2 * Math.PI),
      dE: ke(om1) - ke(om2), Etram: mt.value * vt.value ** 2 / 2, eff: (mt.value * vt.value ** 2 / 2) / (ke(om1) - ke(om2)),
      f: revPerSec, emf: N.value * B.value * A.value / (1 / (4 * revPerSec)), dT: ke(om1) / (mb.value * cs.value),
    };
  },
  // Scooter, v = vmax(1 − e^(−t/τ)): the distance by numerical integration (Simpson's rule), not the closed form.
  'A1-P02': ({ vmax, tau, t8 }) => {
    const vel = (t) => vmax.value * (1 - Math.exp(-t / tau.value));
    const n = 1000, h = t8.value / n;
    let s = vel(0) + vel(t8.value);
    for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * vel(i * h);
    return { v8: vel(t8.value), dist: s * h / 3, aAvg: vel(t8.value) / t8.value, a0: vmax.value / tau.value };
  },
  // Helium: T from ½m v² = (3/2)kT; P = ⅓ρv².
  'B3-P01': ({ m, vr, rho }) => {
    const vSI = vr.value * 1000;
    return { T: (0.5 * m.value * vSI * vSI) / (1.5 * 1.38e-23), P: rho.value * vSI * vSI / 3 };
  },
  // Closed pipe: allowed wavelengths 4L/n for odd n; open pipe 2L/n.
  'C4-P01': ({ L, v }) => {
    const closed = (n) => v.value / (4 * L.value / n);
    return { lam1: 4 * L.value, f1: closed(1), f3: closed(3), f5: closed(5), fOpen: v.value / (2 * L.value) };
  },
  // Kepler: M from GM = ω²r³ with ω = 2π/T; Rhea's period from GM via T = 2π√(r³/GM).
  'D1-P02': ({ rT, TT, rR }) => {
    const day = 24 * 3600, Gc = 6.67e-11;
    const omega = 2 * Math.PI / (TT.value * day);
    const GM = omega * omega * rT.value ** 3;
    return { TTs: TT.value * day, M: GM / Gc, TR: 2 * Math.PI * Math.sqrt(rR.value ** 3 / GM) / day };
  },
  // Parallel wires: B = 2 × 10⁻⁷ I / r (μ0/2π); zero field where I_P/x = I_Q/(d − x), found by bisection.
  'D3-P01': ({ IP, IQ, d }) => {
    const r = d.value / 100;
    const field = 2e-7 * IP.value / r;
    let lo = 0.0001, hi = d.value - 0.0001;
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (IP.value / mid - IQ.value / (d.value - mid) > 0) lo = mid; else hi = mid; }
    return { B: field, FL: field * IQ.value, x0: (lo + hi) / 2 };
  },
  // Triple alpha: mass defect × 931.5 MeV; reactions per second = L / (energy in J).
  'E5-P01': ({ mHe, mC, L }) => {
    const defect = mHe.value * 3 - mC.value;
    const mev = defect * 931.5;
    return { dm: defect, E: mev, N: L.value / (mev * 1.60e-13) };
  },
};
