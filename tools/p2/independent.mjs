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
  // Helium expanding adiabatically: the pressure through logarithms; the temperature from T V^(2/3) = constant (a
  // different route from the question's pV/T); the work from the amount of gas, W = 3/2 nR(T_X − T_Y); and the end of
  // the constant-temperature expansion from Boyle's law.
  'B4-P02': ({ p1, T1, V1, V2 }) => {
    const R = 8.31;
    const squeeze = V1.value / V2.value;
    const pY = p1.value * Math.exp((5 / 3) * Math.log(squeeze));
    const TY = T1.value * Math.exp((2 / 3) * Math.log(squeeze));
    const n = p1.value * V1.value / (R * T1.value);
    return { p2: pY, T2: TY, W: 1.5 * n * R * (T1.value - TY), p2iso: p1.value * V1.value / V2.value };
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
    const shown = Number((4 * L.value).toPrecision(2)); // the wavelength as part (a) states it, to 2 significant figures
    return { lam1: 4 * L.value, f1: closed(1), f1r: v.value / shown, f3: closed(3), f5: closed(5), fOpen: v.value / (2 * L.value) };
  },
  // Kepler: M from GM = ω²r³ with ω = 2π/T; Rhea's period from GM via T = 2π√(r³/GM).
  'D1-P02': ({ rT, TT, rR }) => {
    const day = 24 * 3600, Gc = 6.67e-11;
    const omega = 2 * Math.PI / (TT.value * day);
    const GM = omega * omega * rT.value ** 3;
    return { TTs: TT.value * day, M: GM / Gc, TR: 2 * Math.PI * Math.sqrt(rR.value ** 3 / GM) / day };
  },
  // Jump leads: B = 2 × 10⁻⁷ I / r (μ0/2π) for a long straight wire; F = BIL on the other lead; midway between the
  // leads each is half the separation away and, with opposite currents, the two fields point the same way and add.
  'D3-P02': ({ I, d, L }) => {
    const r = d.value / 100; // cm to m
    const field = (dist) => 2e-7 * I.value / dist;
    return { B: field(r), F: field(r) * I.value * L.value, Bmid: field(r / 2) + field(r / 2) };
  },
  // Bobbing float: ω from the period; v_max = ωx₀; kinetic energy as the difference between the total energy
  // ½mω²x₀² and the potential energy ½mω²x² at the displacement (cm → m, g → kg by hand).
  'C1-P01': ({ x0, T, m, x1 }) => {
    const om = 2 * Math.PI / T.value;
    const a = x0.value / 100, x = x1.value / 100, kg = m.value / 1000;
    const total = 0.5 * kg * om * om * a * a;
    const pot = 0.5 * kg * om * om * x * x;
    return { omega: om, vmax: om * a, v1: Math.sqrt(2 * (total - pot) / kg), Ek: total - pot, ET: total, th: T.value / 2, tq: T.value / 4 };
  },
  // Optical fibre: Snell's law n₁ sin θ₁ = n₂ sin θ₂ at each boundary; the critical angle is the incidence angle
  // in the core for which the refracted ray grazes the boundary (90°); the ray meets the side of the core at
  // 90° minus its angle to the axis.
  'C3-P01': ({ n1, n2, theta }) => {
    const deg = (x) => x * 180 / Math.PI;
    const crit = deg(Math.asin(n2.value * Math.sin(rad(90)) / n1.value));
    const refr = deg(Math.asin(1 * Math.sin(rad(theta.value)) / n1.value)); // air has n = 1
    return { c: crit, r: refr, phi: 90 - refr };
  },
  // Two loudspeakers: λ = v/f; the path difference is the difference of the two distances; its ratio to λ decides
  // the interference.
  'C3-P02': ({ f, v, d1, d2 }) => {
    const lam = v.value / f.value;
    const diff = d1.value - d2.value;
    return { lambda: lam, delta: diff, ratio: diff / lam, halfLambda: v.value / (2 * f.value) };
  },
  // Spectroscopic binary: the Doppler shift for v ≪ c, Δλ/λ = v/c; the extreme observed wavelengths are
  // λ₀ ± Δλ; the period is read straight from the graph.
  'C5-P01': ({ lam0, dlam, P }) => {
    const c = 3.00e8;
    const metres = (nm) => nm * 1e-9;
    return { Pd: P.value, lamMax: lam0.value + dlam.value, lamMin: lam0.value - dlam.value, ratio: metres(dlam.value) / metres(lam0.value), v: c * metres(dlam.value) / metres(lam0.value) };
  },
  // Triple alpha: mass defect × 931.5 MeV; reactions per second = L / (energy in J).
  'E5-P01': ({ mHe, mC, L }) => {
    const defect = mHe.value * 3 - mC.value;
    const mev = defect * 931.5;
    return { dm: defect, E: mev, N: L.value / (mev * 1.60e-13) };
  },
  // Window: Fourier's law as power = conductivity × area × temperature gradient, with the gradient worked out in
  // K per metre from the two surface temperatures (°C differences equal K differences) and the thickness in mm;
  // energy over t days with 24 × 60 × 60 seconds in a day, in MJ.
  'B1-P01': ({ A, d, Ti, To, k, t, kair }) => {
    const gradient = (Ti.value - To.value) / (d.value / 1000); // K per metre
    const watts = k.value * A.value * gradient;
    const seconds = t.value * 24 * 60 * 60;
    return { dT: Ti.value - To.value, P: watts, tsec: seconds, E: watts * seconds / 1e6, kratio: k.value / kair.value };
  },
  // Venus: the sunlight intercepted by the disc πR² and spread over the sphere 4πR², the reflected fraction removed;
  // the fourth root taken by two square roots; the T⁴ ratio multiplied out; warmings as plain differences.
  'B2-P01': ({ Iv, alpha, Tv, TEeq, TE }) => {
    const sigma = 5.67e-8;
    const R = 1; // any radius: it cancels
    const absorbed = Iv.value * (1 - alpha.value) * Math.PI * R * R / (4 * Math.PI * R * R);
    const Teq = Math.sqrt(Math.sqrt(absorbed / sigma));
    const Teq2 = Number(Teq.toPrecision(2));
    const quart = (x) => x * x * x * x;
    return { Iabs: absorbed, Teq, ratio: quart(Tv.value) / quart(Teq), ratio2: quart(Tv.value) / quart(Teq2), dTv: Tv.value - Teq, dTE: TE.value - TEeq.value };
  },
  // Drill pack: a least-squares straight line through all five (I, V) readings gives the intercept (emf) and the
  // gradient (−r); power to the drill from the fourth reading; internal dissipation I²r; short-circuit current ε/r.
  'B5-P02': ({ I1, I2, I3, I4, I5, V1, V2, V3, V4, V5 }) => {
    const xs = [I1, I2, I3, I4, I5].map((g) => g.value), ys = [V1, V2, V3, V4, V5].map((g) => g.value);
    const n = xs.length;
    const mx = xs.reduce((s, x) => s + x, 0) / n, my = ys.reduce((s, y) => s + y, 0) / n;
    let sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
    const gradient = sxy / sxx;
    const intercept = my - gradient * mx;
    const r = -gradient;
    return { eps: intercept, r, grad: gradient, P: V4.value * I4.value, Pint: I4.value * I4.value * r, Imax: intercept / r };
  },
  // Precipitator: kV to V, then E = V/d; the field does work qV on a charge crossing the whole gap (J, and eV by
  // dividing by the electron charge); electric force qE against the weight; speed if all the work became KE.
  'D2-P01': ({ V, d, q, m }) => {
    const volts = V.value * 1000;
    const field = volts / d.value;
    const work = q.value * volts;
    return { E: field, W: work, WeV: work / 1.60e-19, F: q.value * field, weight: m.value * G, vArr: Math.sqrt(2 * work / m.value) };
  },
  // Magnet through a coil: flux per turn BA (cm² to m²), flux linkage N × that, one grid square in volt seconds,
  // squares under the first pulse, B back from the linkage; free-fall time and speed to the coil's centre.
  'D4-P01': ({ N, A, h, B0, gridT, gridV }) => {
    const area = A.value / 1e4, tesla = B0.value / 1e3, drop = h.value / 100;
    const perTurn = tesla * area;
    const linkage = N.value * perTurn;
    const square = (gridT.value / 1e3) * gridV.value;
    return { Phi0: perTurn, NPhi: linkage, sqArea: square * 1e3, squares: linkage / square, Bavg: linkage / (N.value * area), t0: Math.sqrt(2 * drop / G) * 1e3, v0: Math.sqrt(2 * G * drop) };
  },
  // Sodium levels: photon energy = difference between levels (eV, then J); f = E/h; λ = c/f in nm; the largest
  // gap gives the shortest wavelength; the number of pairs of n levels is n(n − 1)/2.
  'E1-P01': ({ E0, E1, E2, E3, nLev }) => {
    const planck = 6.63e-34, light = 3.00e8, joulesPerEV = 1.60e-19;
    const gap = E1.value - E0.value, biggest = E3.value - E0.value;
    const freq = gap * joulesPerEV / planck;
    const n = nLev.value;
    return { dE: gap, dEJ: gap * joulesPerEV, f: freq, lam: (light / freq) * 1e9, dEmax: biggest, lamShort: (light / (biggest * joulesPerEV / planck)) * 1e9, dE21: E2.value - E1.value, nTrans: n * (n - 1) / 2 };
  },
  // Reactor: nucleon and proton numbers balance on both sides; thermal power = electrical / efficiency; fissions
  // per second = power / energy per fission (MeV to J); mass per day = fissions per day × mass of one nucleus.
  'E4-P01': ({ Pe, eff, Ef, AU, ZU, AX, ZX }) => {
    const thermalW = Pe.value * 1e6 / (eff.value / 100);
    const perFission = Ef.value * 1e6 * 1.60e-19;
    const perSecond = thermalW / perFission;
    const nucleus = AU.value * 1.661e-27;
    return { Amiss: AU.value + 1 - AX.value - 2 * 1, Zmiss: ZU.value - ZX.value, Pth: thermalW / 1e6, EfJ: perFission, rate: perSecond, mU: nucleus, mDay: perSecond * 24 * 3600 * nucleus };
  },
  // Fire hose: the jet is at its highest when the vertical velocity is zero (time uy/g, height from s = ut + ½at²
  // over that time, not from v² = u² + 2as); it lands when the vertical displacement returns to zero, at twice
  // that time; the horizontal velocity is unchanged throughout.
  'A1-P03': ({ u, theta }) => {
    const up = u.value * Math.sin(rad(theta.value)), along = u.value * Math.cos(rad(theta.value));
    const tTop = up / G;
    const top = up * tTop - 0.5 * G * tTop * tTop;
    return { uy: up, ux: along, H: top, t: 2 * tTop, R: along * 2 * tTop };
  },
  // Crate: Hooke's law with extensions in metres; constant velocity means friction balances the pull and the
  // normal force balances the weight; μd is their ratio. Two crates: twice the normal force, twice the extension.
  'A2-P01': ({ m, k, xs, xd }) => {
    const pullStart = k.value * (xs.value / 100), pullSlide = k.value * (xd.value / 100);
    const weight = m.value * G;
    return { Fs: pullStart, Fd: pullSlide, N: weight, mud: pullSlide / weight, x2: xd.value + xd.value };
  },
  // Airbag: the impulse is the area under F = Fmax sin(πt/T), found by Simpson's rule over the contact time (ms → s),
  // not from the closed form; the head is brought to rest so m v = J; the average force is J / T.
  'A2-P02': ({ Fmax, T, m }) => {
    const Ts = T.value / 1000;
    const force = (t) => Fmax.value * Math.sin(Math.PI * t / Ts);
    const n = 2000, dt = Ts / n;
    let s = force(0) + force(Ts);
    for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * force(i * dt);
    const impulse = s * dt / 3;
    return { J: impulse, v: impulse / m.value, Favg: impulse / Ts };
  },
  // Reservoir: weight of the water × height; the power in MW from joules per second; energies in and out from
  // power × time with hours as 60 × 60 s; the overall efficiency as a percentage.
  'A3-P01': ({ V, rho, h, Pp, tp, Pg, tg }) => {
    const hour = 60 * 60;
    const water = rho.value * V.value;
    const stored = water * G * h.value;
    const used = Pp.value * 1e6 * tp.value * hour, returned = Pg.value * 1e6 * tg.value * hour;
    return {
      mass: water, E: stored, Pgpe: stored / (tg.value * hour) / 1e6,
      Ein: used, Eout: returned, eff: 100 * returned / used, perkg: G * h.value,
    };
  },
};
