/* What is a chemical reaction? A physics view. Hydrogen burning in oxygen: 2H₂ + O₂ → 2H₂O.
   Bonds are electric: a molecule sits at the bottom of a potential-energy well; breaking bonds takes energy and
   making bonds releases it; the difference becomes random kinetic energy (the temperature rises); and the mass
   change is real but about 10⁻¹⁰ of the mass. Activation energy and the bond-energy curve go beyond the syllabus.
   Numbers (typical textbook bond energies; data-booklet constants N_A = 6.02 × 10²³, e = 1.60 × 10⁻¹⁹, k_B = 1.38 × 10⁻²³, c = 3.00 × 10⁸):
   - H–H 436 kJ mol⁻¹: 436 000 ÷ 6.02 × 10²³ = 7.24 × 10⁻¹⁹ J = 4.53 eV (shown 4.5 eV, 7.2 × 10⁻¹⁹ J).
   - O=O 498 kJ mol⁻¹: 8.27 × 10⁻¹⁹ J = 5.17 eV (5.2). O–H 463 kJ mol⁻¹: 7.69 × 10⁻¹⁹ J = 4.81 eV (4.8).
   - Break 2 H–H + 1 O=O: 2 × 4.53 + 5.17 = 14.23 eV (2 × 4.5 + 5.2 = 14.2). Make 4 O–H: 4 × 4.81 = 19.24 eV (4 × 4.8 = 19.2).
     Released: 19.24 − 14.23 = 5.01 eV per two water molecules (19.2 − 14.2 = 5.0); per mole of reaction 482 kJ
     (the measured value for water vapour is 241.8 kJ mol⁻¹, 483.6 kJ per 2 mol: average bond energies agree well).
   - Room temperature: ³⁄₂ k_B T = 1.5 × 1.38 × 10⁻²³ × 293 = 6.07 × 10⁻²¹ J = 0.038 eV ≈ 0.04 eV.
   - Mass: 2H₂ + O₂ is 2 × 2.016 + 32.00 = 36.03 g per 482 kJ, so 482 000 ÷ 0.03603 = 1.34 × 10⁷ J per kg of mixture;
     Δm = 1.34 × 10⁷ ÷ (3.0 × 10⁸)² = 1.49 × 10⁻¹⁰ kg per kg (shown 1.5 × 10⁻¹⁰).
   - Fission (E.4): 200 MeV ÷ (236 × 931.5 MeV) = 9.1 × 10⁻⁴ of the mass, about 10⁻³: about 6 million times the
     chemical fraction. Binding energy per nucleon about 8 MeV vs about 4.5 eV per bond: about 2 million times.
   - Bond curve: a standard (Morse) model, E = D(1 − e^(−a(r − r₀)))² − D, D = 4.53 eV, r₀ = 74 pm, a = 0.0194 pm⁻¹.
   - Water: O–H 96 pm, H–O–H angle 104.5°. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  const DURATION = 193;
  const T1 = 4.6, T2 = 19.5, T3 = 60.7, T4 = 111.7, T5 = 141.5, TEND = 178.3;
  const CAPS = [
    [4.8, 11.9, 'A mixture of hydrogen and oxygen gas at room temperature. Its molecules, H₂ and O₂, move about at random.'],
    [12.1, 19.3, 'Each molecule is two atoms joined by a chemical bond. But what is a bond, and what happens when bonds change?'],
    [21.6, 27.0, 'Zoom in on one hydrogen molecule: two protons (the nuclei) share two electrons.'],
    [27.2, 35.5, 'The electrons attract both nuclei, and the nuclei repel each other. These electric forces balance at the bond length, 74 pm.'],
    [35.7, 44.0, 'The graph shows the potential energy of the molecule against the separation of the nuclei. The bond sits at the bottom of a well.'],
    [44.2, 52.8, 'The atoms vibrate about the bottom. Push them closer and the repulsion wins; pull them apart and the attraction pulls them back.'],
    [53.0, 60.5, 'Pulling the atoms right apart takes about 4.5 eV: 436 000 J per mole ÷ (6.02 × 10²³) = 7.2 × 10⁻¹⁹ J per molecule.'],
    [60.9, 68.9, 'At room temperature a molecule’s average kinetic energy is only about 0.04 eV (³⁄₂kT at 293 K): far too little to break bonds.'],
    [69.1, 77.0, 'A spark gives nearby molecules much more energy (activation energy, beyond the IB syllabus), so they collide hard enough to react.'],
    [77.2, 84.0, 'Each reaction releases energy that speeds up its neighbours, so the reaction spreads out from the spark: a flame.'],
    [84.2, 90.7, 'Bookkeeping: breaking two H–H bonds and one O=O bond takes 2 × 4.5 + 5.2 = 14.2 eV.'],
    [90.9, 95.9, 'Forming four O–H bonds releases 4 × 4.8 = 19.2 eV.'],
    [96.1, 103.6, 'So 19.2 − 14.2 = 5.0 eV is released for every two water molecules made: the products sit lower, in deeper wells.'],
    [103.8, 111.5, '(Really, bonds break and form at the same time, so colliding molecules only need to get over a small hump, not 14.2 eV.)'],
    [111.9, 118.4, 'The overall reaction (really several steps): two H₂ and one O₂ rearrange into two water molecules, H₂O.'],
    [118.6, 125.1, 'The 5.0 eV of potential energy released becomes kinetic energy: the new molecules fly apart fast.'],
    [125.3, 133.4, 'Faster molecules mean a higher temperature: internal energy has changed from potential to kinetic. This is an exothermic reaction.'],
    [133.5, 141.5, 'In an endothermic reaction (not shown) it’s the other way round: the products have more potential energy, so it cools.'],
    [141.7, 154.3, 'Predict: does the water made have less mass than the hydrogen and oxygen it came from?'],
    [154.5, 161.5, 'Yes, but only just. Energy has mass (E = mc²), and 1.34 × 10⁷ J leaves for every kilogram of the gas mixture burned.'],
    [161.7, 169.2, 'Δm = E ÷ c² = 1.34 × 10⁷ ÷ (3.0 × 10⁸)² = 1.5 × 10⁻¹⁰ kg for each kilogram: too little to detect by weighing.'],
    [169.4, 178.1, 'In fission, about 10⁻³ of the mass is released: nuclear binding energies (MeV) are millions of times bigger than bond energies (eV).'],
  ];

  // ---------- physics ----------
  const DM = 4.53, R0 = 74, AM = 0.0194;                       // Morse model of the H–H bond (eV, pm, pm⁻¹)
  const morse = (r) => DM * Math.pow(1 - Math.exp(-AM * (r - R0)), 2) - DM;
  const EV = { HH: 4.53, OO: 5.17, OH: 4.81 };
  const BREAK = 2 * EV.HH + EV.OO, MAKE = 4 * EV.OH, RELEASE = MAKE - BREAK;   // 14.23, 19.24, 5.01
  const KT = 1.5 * 1.38e-23 * 293 / 1.60e-19;                               // 0.038 eV
  const PER_KG = 482e3 / 0.03603, DMFRAC = PER_KG / 9e16, FISSION = 200 / (236 * 931.5);

  // ---------- colours ----------
  const H_RGB = '228,236,255', O_RGB = '255,96,96', E_RGB = C.neg, PE = C.field, KE = C.vel, HEAT = '255,150,80';

  // ---------- seeded gas (straight lines, bouncing off the walls; molecules drawn passing each other) ----------
  let seed = 4111;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const GAS = [];
  for (let i = 0; i < 15; i++) {
    // 10 H₂ and 5 O₂: exactly enough for 10 H₂O. Same temperature, same average kinetic energy: H₂ (2 u) moves
    // √(32 ÷ 2) = 4 times as fast as O₂ (32 u) on average
    const a = rnd() * Math.PI * 2, sp = (0.05 + 0.04 * rnd()) * (i < 10 ? 2.0 : 0.5);
    GAS.push({ type: i < 10 ? 'H2' : 'O2', x0: rnd() * 2, y0: rnd() * 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, th0: rnd() * 6.28, om: (rnd() - 0.5) * 1.6 });
  }
  const tri = (p) => { const m = ((p % 2) + 2) % 2; return m < 1 ? m : 2 - m; };   // bounces between 0 and 1

  // ---------- the flame (part 3): the reaction spreads out from the spark ----------
  // Each O₂ reacts with the two nearest free H₂ (2H₂ + O₂ → 2H₂O), in order of distance from the spark, one group every
  // 2.2 s from T_IGN. Before reacting, the molecules near the flame speed up sharply (up to 4 times: energy from the
  // reactions nearby), then the three meet, flash, and two fast water molecules fly outwards, bouncing off the walls.
  const T_IGN = 70.0, MEET = 1.0, RAMP = 1.4, BOOST = 3, V_PROD = 0.3;
  let SPARK = [0.5, 1.0];                                            // set below: where the first group meets
  const basePos = (m, tau) => [tri(m.x0 + m.vx * tau), tri(m.y0 + m.vy * tau)];
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  // extra "time" a molecule gains from speeding up in the RAMP + MEET seconds before it reacts
  const extra = (m, t) => {
    if (!(m.tr < Infinity)) return 0;
    const a = m.tr - MEET - RAMP, x = (Math.min(t, m.tr) - a) / RAMP;
    if (x <= 0) return 0;
    return BOOST * (x <= 1 ? RAMP * (x * x * x - x * x * x * x / 2) : RAMP * 0.5 + (Math.min(t, m.tr) - a - RAMP));
  };
  const accPos = (m, t) => basePos(m, t + extra(m, t));
  const GROUPS = (() => {
    // the spark goes off right beside the O₂ nearest the bottom middle of the box; the others react in order of distance from it
    const tr0 = T_IGN + 0.4, bottom = [0.5, 1.0];
    const o2 = GAS.filter((m) => m.type === 'O2').sort((p, q) => dist(basePos(p, tr0 - MEET), bottom) - dist(basePos(q, tr0 - MEET), bottom));
    SPARK = basePos(o2[0], tr0 - MEET);
    const rest = o2.slice(1).sort((p, q) => dist(basePos(p, T_IGN), SPARK) - dist(basePos(q, T_IGN), SPARK));
    o2.splice(1, o2.length - 1, ...rest);
    const free = GAS.filter((m) => m.type === 'H2'), out = [];
    o2.forEach((o, k) => {
      // the meeting point is where this O₂ is when the meeting starts; its partners are the two free H₂ closest to it then
      const tr = T_IGN + 0.4 + 2.2 * k; o.tr = tr;
      const M = accPos(o, tr - MEET);
      const gap = (h) => { h.tr = tr; const d = dist(accPos(h, tr - MEET), M); h.tr = undefined; return d; };
      free.sort((p, q) => gap(p) - gap(q));
      const hs = free.splice(0, 2);
      for (const m of hs) m.tr = tr;
      // each molecule gets long enough to reach the meeting point at no more than 0.35 box-widths a second (hot, but not a dash)
      o.meet = MEET;
      for (const m of hs) m.meet = clamp(dist(accPos(m, tr - MEET), M) / 0.35, MEET, 3.0);
      const ang = Math.atan2(M[1] - SPARK[1], M[0] - SPARK[0]);
      out.push({ tr, M, members: [o, ...hs], d: dist(M, SPARK), prod: [ang - 0.55, ang + 0.55].map((f, j) => ({ f, th0: 1.3 * j + k, om: (j ? 1 : -1) * (2.4 + 0.3 * k) })) });
    });
    return out;
  })();
  // where a gas molecule is at time t (before it reacts): free flight, sped up near the flame, then meeting its partners
  const gasPos = (m, t) => {
    const p = accPos(m, t);
    if (!(m.tr < Infinity) || t < m.tr - m.meet) return p;
    const g = GROUPS.find((q) => q.members.includes(m)), k = smooth((t - (m.tr - m.meet)) / m.meet);
    return [lerp(p[0], g.M[0], k), lerp(p[1], g.M[1], k)];
  };
  const prodPos = (g, j, t) => {
    const f = g.prod[j].f, dt = t - g.tr;
    return [tri(g.M[0] + V_PROD * Math.cos(f) * dt), tri(g.M[1] + V_PROD * Math.sin(f) * dt)];
  };

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25)), fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    const capTop = H - capFs * (phone ? 7.2 : 5.6);
    const top = phone ? 10 : Math.max(52, H * 0.09);
    const view = phone ? { x0: 10, x1: W - 10, y0: top, y1: top + (capTop - top) * 0.48 }
      : { x0: W * 0.04, x1: W * 0.52, y0: top, y1: capTop - fs };
    const panel = phone ? { x0: 10, x1: W - 10, y0: view.y1 + fs * 0.8, y1: capTop - fs * 0.3 }
      : { x0: W * 0.56, x1: W * 0.965, y0: top, y1: capTop - fs };
    L = { W, H, phone, fs, capFs, capTop, view, panel };
  }

  // ---------- drawing helpers ----------
  function atom(s, x, y, r, rgb, a, label) {
    const { g } = s; if (a <= 0 || !(r > 0)) return;
    const cl = g.createRadialGradient(x, y, 0, x, y, r * 2.1);                  // electron cloud
    cl.addColorStop(0, `rgba(${E_RGB},${0.22 * a})`); cl.addColorStop(1, `rgba(${E_RGB},0)`);
    g.globalCompositeOperation = 'lighter'; g.fillStyle = cl; g.beginPath(); g.arc(x, y, r * 2.1, 0, 7); g.fill();
    g.globalCompositeOperation = 'source-over';
    const b = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    b.addColorStop(0, `rgba(255,255,255,${a})`); b.addColorStop(1, `rgba(${rgb},${a})`);
    g.fillStyle = b; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    if (label) D.text(s, label, x, y + 0.5, Math.max(9, Math.round(r * 0.95)), a, D.sans(Math.max(9, Math.round(r * 0.95)), 700), '30,30,50');
  }
  function bondCloud(s, x1, y1, x2, y2, w, a) {
    if (a <= 0) return;
    const { g } = s, mx = (x1 + x2) / 2, my = (y1 + y2) / 2, d = Math.hypot(x2 - x1, y2 - y1);
    g.save(); g.translate(mx, my); g.rotate(Math.atan2(y2 - y1, x2 - x1));
    g.scale(1, w / Math.max(1, d * 0.5 + w));
    const r = d * 0.5 + w, gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
    gr.addColorStop(0, `rgba(${E_RGB},${0.32 * a})`); gr.addColorStop(1, `rgba(${E_RGB},0)`);
    g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    g.restore(); g.globalCompositeOperation = 'source-over';
  }
  // a molecule: H2, O2 or H2O at (x, y), u pixels per 100 pm, turned through th
  function molecule(s, type, x, y, u, th, a) {
    const c = Math.cos(th), sn = Math.sin(th), P = (px, py) => [x + px * c - py * sn, y + px * sn + py * c];
    if (type === 'H2' || type === 'O2') {
      const half = (type === 'H2' ? 0.74 : 1.21) / 2 * u, r = (type === 'H2' ? 0.32 : 0.5) * u;
      const [ax, ay] = P(-half, 0), [bx, by] = P(half, 0);
      bondCloud(s, ax, ay, bx, by, r * 0.9, a);
      const rgb = type === 'H2' ? H_RGB : O_RGB;
      atom(s, ax, ay, r, rgb, a); atom(s, bx, by, r, rgb, a);
    } else {
      const h = 0.96 * u, ang = 104.5 * Math.PI / 360;
      const [h1x, h1y] = P(-Math.sin(ang) * h, Math.cos(ang) * h), [h2x, h2y] = P(Math.sin(ang) * h, Math.cos(ang) * h);
      bondCloud(s, x, y, h1x, h1y, 0.3 * u, a); bondCloud(s, x, y, h2x, h2y, 0.3 * u, a);
      atom(s, h1x, h1y, 0.32 * u, H_RGB, a); atom(s, h2x, h2y, 0.32 * u, H_RGB, a); atom(s, x, y, 0.5 * u, O_RGB, a);
    }
  }
  const panelBox = (s, p, a) => {
    if (a <= 0) return; const { g } = s;
    g.fillStyle = `rgba(14,20,44,${0.72 * a})`; g.beginPath(); g.roundRect(p.x0 - 6, p.y0 - 6, p.x1 - p.x0 + 12, p.y1 - p.y0 + 12, 10); g.fill();
  };
  const head = (s, txt, x, y, a, rgb = C.muted) => D.text(s, txt, x, y, L.fs, 0.85 * a, D.sans(L.fs, 600), rgb, 'left');
  const fmt = (v, dp = 1) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(dp);

  // ---------- part 1 and 3: the gas ----------
  function drawGas(s, t, a, spark) {
    if (a <= 0) return;
    const { view: v, fs } = L, u = Math.min(v.x1 - v.x0, v.y1 - v.y0) * 0.075;
    D.line(s, v.x0, v.y0, v.x1, v.y0, '150,165,230', 0.45 * a, 1.2); D.line(s, v.x0, v.y1, v.x1, v.y1, '150,165,230', 0.45 * a, 1.2);
    D.line(s, v.x0, v.y0, v.x0, v.y1, '150,165,230', 0.45 * a, 1.2); D.line(s, v.x1, v.y0, v.x1, v.y1, '150,165,230', 0.45 * a, 1.2);
    const pad = u * 1.1, PX = (q) => [lerp(v.x0 + pad, v.x1 - pad, q[0]), lerp(v.y0 + pad, v.y1 - pad, q[1])];
    const { g } = s;
    // the flame: a warm haze spreading out from the spark as the groups react
    const fa = a * fade(t, T_IGN - 0.5, 92, 0.8, 5);
    if (fa > 0) {
      let rf = 0; for (const q of GROUPS) rf = Math.max(rf, (q.d + 0.12) * smooth((t - q.tr + 0.9) / 0.9));
      if (rf > 0.01) {
        const [sx, sy] = PX(SPARK), R = rf * Math.max(v.x1 - v.x0, v.y1 - v.y0);
        const hz = g.createRadialGradient(sx, sy, 0, sx, sy, R);
        hz.addColorStop(0, `rgba(${HEAT},${0.16 * fa})`); hz.addColorStop(0.75, `rgba(${HEAT},${0.08 * fa})`); hz.addColorStop(1, `rgba(${HEAT},0)`);
        g.save(); g.beginPath(); g.rect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); g.clip();
        g.globalCompositeOperation = 'lighter'; g.fillStyle = hz; g.beginPath(); g.arc(sx, sy, R, 0, 7); g.fill(); g.restore();
        g.globalCompositeOperation = 'source-over';
      }
    }
    const streak = (p0, p1, al) => {                                 // a short trail behind a fast molecule
      const [x0, y0] = PX(p0), [x1, y1] = PX(p1), d = Math.hypot(x1 - x0, y1 - y0);
      if (d < 2 || d > u * 6) return;                                 // too slow to show, or a bounce in between
      D.line(s, x0, y0, x1, y1, HEAT, 0.45 * al, Math.max(1.5, u * 0.18));
    };
    // the reactants (until each group reacts)
    for (const m of GAS) {
      if (t >= m.tr) continue;
      const p = gasPos(m, t), [x, y] = PX(p), hot = m.tr < Infinity ? smooth((t - (m.tr - Math.max(m.meet, MEET) - RAMP)) / RAMP) : 0;
      if (hot > 0.05) streak(gasPos(m, t - 0.18), p, a * hot);
      molecule(s, m.type, x, y, u, m.th0 + m.om * (t + extra(m, t)), a);
    }
    // each reaction: a flash where the three meet, then two fast water molecules
    for (const q of GROUPS) {
      const [mx, my] = PX(q.M), fl = t > q.tr - 0.25 ? Math.exp(-Math.max(0, t - q.tr) / 0.35) * smooth((t - q.tr + 0.25) / 0.25) : 0;
      if (fl > 0.02) D.glowDot(s, mx, my, u * 3.2, HEAT, a * fl);
      if (t < q.tr) continue;
      q.prod.forEach((pr, j) => {
        const p = prodPos(q, j, t), [x, y] = PX(p);
        streak(prodPos(q, j, Math.max(q.tr, t - 0.18)), p, a);
        molecule(s, 'H2O', x, y, u, pr.th0 + pr.om * (t - q.tr), a);
      });
    }
    if (spark > 0) {                                                // a spark at the bottom of the box
      const [sx, sy0] = PX(SPARK), sy = sy0 + pad * 0.2, flick = 0.6 + 0.4 * Math.sin(s.clock * 37) * Math.sin(s.clock * 23);
      D.glowDot(s, sx, sy, u * 2.4 * flick, HEAT, spark);
      D.text(s, 'spark', sx, sy - u * 1.8, fs, 0.9 * spark, D.sans(fs, 600), HEAT);
    }
    if (t > T_IGN + 6 && t < T4) {                                 // after the flame has passed: label the products
      D.text(s, 'water molecules, moving fast (hot)', (v.x0 + v.x1) / 2, v.y0 + fs * 0.9, fs, a * fade(t, T_IGN + 10.5, T4, 1, 1), D.sans(fs, 600), HEAT);
    }
  }

  // ---------- part 2: one hydrogen molecule and its energy curve ----------
  const vib = (t) => R0 + 9 * Math.sin((t - T2) * 2.4);              // pm: a gentle vibration (hugely slowed)
  function drawH2Zoom(s, t, a) {
    if (a <= 0) return;
    const { view: v, fs } = L, cx = (v.x0 + v.x1) / 2, cy = (v.y0 + v.y1) / 2;
    const ppm = Math.min(v.x1 - v.x0, (v.y1 - v.y0) * 1.6) / 300, r = vib(t);   // pixels per pm
    const x1 = cx - r / 2 * ppm, x2 = cx + r / 2 * ppm;
    // the shared electron cloud
    const { g } = s, cr = Math.max(8, (r / 2 + 55) * ppm);
    g.save(); g.translate(cx, cy); g.scale(1, 0.72);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, cr);
    gr.addColorStop(0, `rgba(${E_RGB},${0.30 * a})`); gr.addColorStop(0.7, `rgba(${E_RGB},${0.12 * a})`); gr.addColorStop(1, `rgba(${E_RGB},0)`);
    g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.beginPath(); g.arc(0, 0, cr, 0, 7); g.fill(); g.restore();
    g.globalCompositeOperation = 'source-over';
    // two electrons (their positions are spread out in reality: drawn as a cloud, with two dots wandering in it)
    for (let k = 0; k < 2; k++) {
      const ph = s.clock * (1.3 + k * 0.4) + k * 2.1;
      D.glowDot(s, cx + Math.cos(ph) * cr * 0.55, cy + Math.sin(ph * 1.3) * cr * 0.4, Math.max(5, ppm * 9), E_RGB, 0.9 * a);
    }
    D.glowDot(s, x1, cy, Math.max(8, ppm * 16), '255,110,140', a); D.glowDot(s, x2, cy, Math.max(8, ppm * 16), '255,110,140', a);
    D.text(s, '+', x1, cy, fs + 2, a, D.sans(fs + 2, 700), '60,10,20'); D.text(s, '+', x2, cy, fs + 2, a, D.sans(fs + 2, 700), '60,10,20');
    // forces on each nucleus (from 27.2 s), horizontal and opposite: the repulsion of the other nucleus (outwards) and the
    // attraction of the electrons (inwards). They are equal at the bond length; closer in the repulsion is bigger, further
    // out the attraction is (schematic lengths, following the sign of the force from the curve)
    const fa = a * fade(t, 27.2, T3 - 0.2, 0.8, 0.8);
    if (fa > 0) {
      const L0 = Math.max(16, ppm * 26), q = clamp((R0 - r) / 9, -1, 1), rep = L0 * (1 + 0.45 * q), att = L0 * (1 - 0.45 * q);
      const dy = Math.max(6, ppm * 9);
      D.arrow(s, x1, cy - dy, x1 - rep, cy - dy, C.force, fa * 0.95, '', { head: 7, width: 2 });
      D.arrow(s, x2, cy - dy, x2 + rep, cy - dy, C.force, fa * 0.95, '', { head: 7, width: 2 });
      D.arrow(s, x1, cy + dy, x1 + att, cy + dy, KE, fa * 0.95, '', { head: 7, width: 2 });
      D.arrow(s, x2, cy + dy, x2 - att, cy + dy, KE, fa * 0.95, '', { head: 7, width: 2 });
      D.text(s, 'repelled by the other nucleus', cx, cy - cr * 0.62 - fs * 0.9, fs, 0.85 * fa, D.sans(fs), C.force);
      D.text(s, 'attracted by the electrons', cx, cy + cr * 0.62 + fs * 0.9, fs, 0.85 * fa, D.sans(fs), KE);
    }
    D.text(s, 'proton', x1, cy - Math.max(14, ppm * 24) - fs * 0.3, fs - 1, 0.6 * a * (1 - fa), D.sans(fs - 1), C.muted);
    D.text(s, `separation ${Math.round(r)} pm`, v.x0 + fs * 0.3, v.y0 + fs * 0.6, fs, 0.8 * a, D.sans(fs), C.muted, 'left');
  }
  function drawCurve(s, t, a) {
    if (a <= 0) return;
    const { panel: p, fs, phone } = L;
    panelBox(s, p, a);
    head(s, phone ? 'potential energy of the bond' : 'potential energy of the H–H bond', p.x0, p.y0 + fs * 0.4, a);
    const g0 = { x0: p.x0 + fs * 3.2, x1: p.x1 - fs * 0.8, y0: p.y0 + fs * 3, y1: p.y1 - fs * 2.6 };
    const X = (r) => g0.x0 + (r - 30) / 270 * (g0.x1 - g0.x0), Y = (e) => g0.y0 + (4 - e) / 10 * (g0.y1 - g0.y0);
    D.line(s, g0.x0, g0.y0, g0.x0, g0.y1, C.muted, 0.6 * a, 1.2);
    D.line(s, g0.x0, Y(0), g0.x1, Y(0), C.muted, 0.45 * a, 1, [4, 4]);
    for (const e of [4, 2, 0, -2, -4, -6]) D.text(s, fmt(e, 0), g0.x0 - 5, Y(e), fs - 1, 0.7 * a, D.sans(fs - 1), C.muted, 'right');
    D.text(s, 'E / eV', g0.x0 - fs * 0.4, g0.y0 - fs * 1.1, fs - 1, 0.8 * a, D.serif(fs), C.muted, 'left');
    for (const r of [100, 200, 300]) D.text(s, String(r), X(r), g0.y1 + fs * 0.8, fs - 1, 0.7 * a, D.sans(fs - 1), C.muted);
    D.text(s, 'separation of the nuclei / pm', (g0.x0 + g0.x1) / 2, g0.y1 + fs * 1.9, fs - 1, 0.75 * a, D.sans(fs - 1), C.muted);
    const pts = []; for (let r = 31; r <= 300; r += 1) pts.push([X(r), Y(clamp(morse(r), -6, 4))]);
    D.glowLine(s, pts, PE, a, 2);
    // the well: depth and bond length (labels below the bottom of the well, clear of the curve)
    const wa = a * smooth((t - 36.5) / 1);
    D.line(s, X(R0), Y(-DM), X(R0), g0.y1, PE, 0.5 * wa, 1, [3, 3]);
    D.text(s, 'bond length 74 pm', X(R0) + fs * 0.5, Y(-5.3), fs - 1, 0.85 * wa, D.sans(fs - 1), PE, 'left');
    const da = a * smooth((t - 53.5) / 1);
    if (da > 0) {
      D.arrow(s, X(260), Y(-DM), X(260), Y(0) + 2, C.light, da, '', { head: 8, width: 2 });
      D.line(s, X(R0), Y(-DM), X(260), Y(-DM), C.light, 0.4 * da, 1, [3, 3]);
      D.text(s, '4.5 eV to separate', X(260) - fs * 0.5, Y(-DM) - fs * 0.75, fs, da, D.sans(fs, 600), C.light, 'right');
    }
    // the molecule's state: a dot on the curve at the current separation
    const r = vib(t); D.glowDot(s, X(r), Y(morse(r)), fs * 1.1, C.white, a);
  }

  // ---------- part 3: energy bookkeeping ----------
  function drawLevels(s, t, a) {
    if (a <= 0) return;
    const { panel: p, fs, phone } = L;
    panelBox(s, p, a);
    head(s, phone ? 'energy per 2H₂ + O₂ / eV' : 'energy of 2H₂ + O₂ → 2H₂O / eV', p.x0, p.y0 + fs * 0.4, a);
    const y0 = p.y0 + fs * 2.4, y1 = p.y1 - fs * 1.2, Y = (e) => y0 + (15.5 - e) / 22 * (y1 - y0);
    const lx0 = p.x0 + fs * 0.6, lx1 = p.x0 + (p.x1 - p.x0) * (phone ? 0.42 : 0.34);
    const rx0 = p.x0 + (p.x1 - p.x0) * (phone ? 0.58 : 0.66), rx1 = p.x1 - fs * 0.6, mx = (lx1 + rx0) / 2;
    const lvl = (x0, x1, e, rgb, txt, al, below) => {
      if (al <= 0) return;
      D.line(s, x0, Y(e), x1, Y(e), rgb, al, 2.4);
      D.text(s, txt, (x0 + x1) / 2, Y(e) + (below ? fs * 0.9 : -fs * 0.75), fs, al, D.sans(fs, 600), rgb);
    };
    // room-temperature kinetic energy: a sliver (to scale)
    const ka = a * fade(t, 61.4, 69.4, 0.8, 0.8);
    lvl(lx0, lx1, 0, H_RGB, '2H₂ + O₂', a);
    if (ka > 0) {
      const { g } = s; g.fillStyle = `rgba(${KE},${0.9 * ka})`;
      g.fillRect(lx1 + fs * 0.3, Y(KT), fs * 0.9, Math.max(1.5, Y(0) - Y(KT)));
      D.text(s, 'average kinetic energy 0.04 eV', lx1 + fs * 1.6, Y(0) - fs * 1.6, fs - 1, ka, D.sans(fs - 1), KE, 'left');
    }
    // the hump (schematic; beyond the syllabus)
    const ha = a * smooth((t - 70) / 1.2);
    if (ha > 0) {
      const pts = []; for (let k = 0; k <= 40; k++) { const q = k / 40, e = lerp(0, -RELEASE, smooth(q)) + 2.2 * Math.sin(Math.PI * q); pts.push([lerp(lx1, rx0, q), Y(e)]); }
      D.glowLine(s, pts, HEAT, 0.8 * ha, 1.6);
      // its label only until the bookkeeping arrows arrive (they need the space)
      D.text(s, 'activation energy', mx, Y(2.4) - fs * 0.8, fs - 1, 0.9 * ha * (1 - smooth((t - 83.8) / 0.6)), D.sans(fs - 1), HEAT);
      D.text(s, '(schematic)', mx, Y(2.4) + fs * 0.4, fs - 2, 0.7 * ha, D.sans(fs - 2), C.muted);   // stays while the hump does
    }
    // bookkeeping: all bonds broken, then made
    const ba = a * smooth((t - 84.4) / 1), ma = a * smooth((t - 91.1) / 1), ra = a * smooth((t - 96.3) / 1);
    lvl(mx - (rx0 - lx1) * 0.3, mx + (rx0 - lx1) * 0.3, BREAK, C.muted, phone ? 'separate atoms' : 'separate atoms: 4H + 2O', ba);
    if (ba > 0) {
      D.arrow(s, lx1 - fs * 1.2, Y(0) - 2, lx1 - fs * 1.2, Y(BREAK) + 2, C.force, ba, '', { head: 8, width: 2 });
      D.text(s, `+${BREAK.toFixed(1)}`, lx1 - fs * 1.6, Y(BREAK / 2), fs, ba, D.sans(fs, 600), C.force, 'right');
    }
    lvl(rx0, rx1, -RELEASE, '140,200,255', phone ? '2H₂O' : '2H₂O (water vapour)', ma, true);
    if (ma > 0) {
      D.arrow(s, rx0 + fs * 1.2, Y(BREAK) + 2, rx0 + fs * 1.2, Y(-RELEASE) - 2, C.good, ma, '', { head: 8, width: 2 });
      D.text(s, `−${MAKE.toFixed(1)}`, rx0 + fs * 1.7, Y(BREAK / 2 - 2), fs, ma, D.sans(fs, 600), C.good, 'left');
    }
    if (ra > 0) {
      D.line(s, lx1, Y(0), rx1, Y(0), C.muted, 0.35 * ra, 1, [4, 4]);
      D.arrow(s, rx1 - fs * 0.8, Y(0), rx1 - fs * 0.8, Y(-RELEASE) - 2, C.light, ra, '', { head: 8, width: 2 });
      D.text(s, `${RELEASE.toFixed(1)} eV released`, rx1 - fs * 1.4, Y(-RELEASE / 2), fs, ra, D.sans(fs, 600), C.light, 'right');
    }
  }

  // ---------- part 4: one reaction ----------
  // local time τ from T4: approach 0–4 s, react at 4.4 s, products fly apart after 5 s
  // the products move fast and bounce off the edges of the view (half-width bx, half-height by, in units of u)
  const bounce = (p, b) => -b + 2 * b * tri((p + b) / (2 * b));
  function reactionAtoms(tau, bx = 4, by = 2) {
    const k = smooth((tau - 0.5) / 3.5), fly = Math.max(0, tau - 5.2);
    if (tau < 4.4) {
      return [
        { type: 'H2', x: lerp(-4.2, -1.1, k), y: lerp(-1.9, -0.55, k), th: 0.4 + tau * 0.3 },
        { type: 'H2', x: lerp(-4.2, -1.1, k), y: lerp(1.9, 0.55, k), th: -0.5 - tau * 0.25 },
        { type: 'O2', x: lerp(4.2, 0.9, k), y: 0, th: tau * 0.2 },
      ];
    }
    return [
      { type: 'H2O', x: bounce(-0.95 - 1.1 * fly, bx), y: bounce(-0.25 - 0.45 * fly, by), th: -0.4 - fly * 1.3 },
      { type: 'H2O', x: bounce(0.95 + 1.1 * fly, bx), y: bounce(0.25 + 0.45 * fly, by), th: 2.7 + fly * 1.1 },
    ];
  }
  function drawReaction(s, t, a) {
    if (a <= 0) return;
    const { view: v, fs } = L, tau = t - T4, cx = (v.x0 + v.x1) / 2, cy = (v.y0 + v.y1) / 2;
    const u = Math.min(v.x1 - v.x0, (v.y1 - v.y0) * 1.5) / 9.5;
    const bx = Math.max(1.5, (v.x1 - v.x0) / (2 * u) - 1.3), by = Math.max(0.8, (v.y1 - v.y0) / (2 * u) - 1.6);
    const now = reactionAtoms(tau, bx, by);
    for (const m of now) molecule(s, m.type, cx + m.x * u, cy + m.y * u, u, m.th, a);
    const fl = Math.exp(-Math.pow((tau - 4.5) / 0.45, 2));
    if (fl > 0.01) D.glowDot(s, cx, cy, u * 3.2, HEAT, a * fl);
    if (tau > 5.3) {                                                 // speed streaks behind the products
      const sa = a * fade(tau, 5.3, 29.5, 0.5, 1), back = reactionAtoms(tau - 0.25, bx, by);
      now.forEach((m, i) => {
        const dx = m.x - back[i].x, dy = m.y - back[i].y, d = Math.hypot(dx, dy); if (d < 1e-6 || d > 1) return;
        const x = cx + m.x * u, y = cy + m.y * u, ux = dx / d, uy = dy / d;
        D.line(s, x - ux * u * 0.9, y - uy * u * 0.9, x - ux * u * 2.2, y - uy * u * 2.2, HEAT, 0.35 * sa, 2);
      });
    }
    const lab = a * fade(tau, 0.2, 4.2, 0.6, 0.4);
    D.text(s, '2H₂ + O₂', cx, v.y1 - fs * 0.8, fs + 1, lab, D.sans(fs + 1, 600), C.text);
    D.text(s, '→ 2H₂O', cx, v.y1 - fs * 0.8, fs + 1, a * smooth((tau - 4.6) / 0.6), D.sans(fs + 1, 600), '140,200,255');
  }
  function drawEnergyBars(s, t, a) {
    if (a <= 0) return;
    const { panel: p, fs, phone } = L, tau = t - T4, done = smooth((tau - 4.4) / 0.5);
    panelBox(s, p, a);
    head(s, 'change in the energy of these molecules', p.x0, p.y0 + fs * 0.4, a);
    const bx0 = p.x0 + (phone ? fs * 7 : fs * 9.5), bx1 = p.x1 - fs * 3.2, X = (e) => bx0 + (e + 6) / 12 * (bx1 - bx0);
    const rows = [['potential', PE, -RELEASE * done], ['kinetic', KE, RELEASE * done]];
    rows.forEach(([nm, rgb, e], i) => {
      const y = p.y0 + fs * (3.2 + i * 2.6), h = fs * 1.1;
      D.text(s, phone ? nm : nm + ' energy', p.x0 + fs * 0.4, y, fs, 0.9 * a, D.sans(fs), rgb, 'left');
      D.line(s, X(0), y - h, X(0), y + h, C.muted, 0.5 * a, 1);
      const { g } = s; g.fillStyle = `rgba(${rgb},${0.85 * a})`;
      g.fillRect(Math.min(X(0), X(e)), y - h * 0.5, Math.abs(X(e) - X(0)), h);
      const rr = Math.round(e * 10) / 10;                               // round first, so 0 never shows a sign
      D.text(s, rr === 0 ? '0.0 eV' : `${rr > 0 ? '+' : '−'}${Math.abs(rr).toFixed(1)} eV`, Math.max(X(0), X(e)) + fs * 0.4, y, fs - 1, 0.85 * a, D.sans(fs - 1), rgb, 'left');
    });
    D.text(s, '(kinetic: moving, spinning and vibrating)', p.x0 + fs * 0.4, p.y0 + fs * 7.2, fs - 2, 0.7 * a, D.sans(fs - 2), KE, 'left');
    D.text(s, 'total: unchanged', p.x0 + fs * 0.4, p.y0 + fs * 8.6, fs, 0.8 * a, D.sans(fs, 600), C.text, 'left');
    // a thermometer: rises with the kinetic energy (qualitative); upright where there is room, lying flat on phones
    const lev = 0.25 + 0.55 * done, { g } = s;
    const tx = p.x1 - fs * 1.4, ty0 = p.y0 + fs * 9.8, ty1 = p.y1 - fs * 1.2;
    g.strokeStyle = `rgba(200,210,255,${0.6 * a})`; g.lineWidth = 1.5;
    if (ty1 - ty0 > fs * 3) {
      g.beginPath(); g.roundRect(tx - fs * 0.35, ty0, fs * 0.7, ty1 - ty0, fs * 0.35); g.stroke();
      g.fillStyle = `rgba(${HEAT},${0.9 * a})`; const fh = (ty1 - ty0) * lev; g.fillRect(tx - fs * 0.2, ty1 - fh, fs * 0.4, fh);
      D.text(s, 'temperature', tx - fs * 0.8, ty0 + fs * 0.4, fs - 1, 0.85 * a, D.sans(fs - 1), HEAT, 'right');
    } else {
      const y = Math.min(p.y1 - fs * 0.6, p.y0 + fs * 10.2), hx0 = p.x0 + fs * 7, hx1 = p.x1 - fs * 0.6;
      g.beginPath(); g.roundRect(hx0, y - fs * 0.35, hx1 - hx0, fs * 0.7, fs * 0.35); g.stroke();
      g.fillStyle = `rgba(${HEAT},${0.9 * a})`; g.fillRect(hx0 + 2, y - fs * 0.2, (hx1 - hx0 - 4) * lev, fs * 0.4);
      D.text(s, 'temperature', p.x0 + fs * 0.4, y, fs - 1, 0.85 * a, D.sans(fs - 1), HEAT, 'left');
    }
  }

  // ---------- part 5: the mass ----------
  function drawMass(s, t, a) {
    if (a <= 0) return;
    const { view: v, panel: p, fs, phone } = L, tau = t - T5;
    // left: before and after, gently drifting
    const cx = (v.x0 + v.x1) / 2, u = Math.min(v.x1 - v.x0, (v.y1 - v.y0) * 1.4) / 11, cy = (v.y0 + v.y1) / 2;
    const bxL = lerp(v.x0, v.x1, 0.25), bxR = lerp(v.x0, v.x1, 0.75), sw = Math.sin(s.clock * 0.6) * u * 0.15;
    molecule(s, 'H2', bxL - u * 1.1, cy - u * 1.2 + sw, u * 0.85, 0.4 + s.clock * 0.2, a);
    molecule(s, 'H2', bxL + u * 1.1, cy - u * 1.2 - sw, u * 0.85, -0.3 - s.clock * 0.15, a);
    molecule(s, 'O2', bxL, cy + u * 0.6 + sw, u * 0.85, s.clock * 0.1, a);
    molecule(s, 'H2O', bxR - u * 1.0, cy - u * 0.6 - sw, u * 0.85, 0.3 + s.clock * 0.1, a);
    molecule(s, 'H2O', bxR + u * 1.0, cy + u * 0.6 + sw, u * 0.85, 2.6 - s.clock * 0.12, a);
    D.text(s, 'before', bxL, v.y0 + fs, fs, 0.85 * a, D.sans(fs, 600), C.muted);
    D.text(s, 'after', bxR, v.y0 + fs, fs, 0.85 * a, D.sans(fs, 600), C.muted);
    D.text(s, '→', cx, cy, fs * 2, 0.7 * a, D.sans(fs * 2), C.muted);
    const ans = a * smooth((tau - 13) / 1);
    D.text(s, 'mass: 1 kg', bxL, v.y1 - fs * 0.8, fs, 0.85 * ans, D.sans(fs), C.text);
    D.text(s, phone ? '1 kg − 1.5 × 10⁻¹⁰ kg' : 'mass: 1 kg − 0.00000000015 kg', bxR, v.y1 - fs * 0.8, fs, 0.85 * ans, D.sans(fs), C.text);
    // right: log chart of the fraction of mass released
    const ca = a * smooth((tau - 13) / 1.2);
    if (ca <= 0) return;
    panelBox(s, p, ca);
    head(s, phone ? 'fraction of the mass released' : 'fraction of the mass released as energy', p.x0, p.y0 + fs * 0.4, ca);
    const g0 = { x0: p.x0 + fs * 3.4, x1: p.x1 - fs * 0.8, y0: p.y0 + fs * 2.4, y1: p.y1 - fs * 2.6 };
    const Y = (lg) => g0.y1 - (lg + 12) / 12 * (g0.y1 - g0.y0);
    D.line(s, g0.x0, g0.y0, g0.x0, g0.y1, C.muted, 0.6 * ca, 1.2); D.line(s, g0.x0, g0.y1, g0.x1, g0.y1, C.muted, 0.6 * ca, 1.2);
    for (const lg of [0, -3, -6, -9, -12]) D.text(s, lg === 0 ? '1' : '10' + String(lg).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]),
      g0.x0 - 5, Y(lg), fs - 1, 0.7 * ca, D.sans(fs - 1), C.muted, 'right');
    const bars = [['burning hydrogen', Math.log10(DMFRAC), '1.5 × 10⁻¹⁰', KE, 0], ['fission of U-235', Math.log10(FISSION), '9 × 10⁻⁴', HEAT, 15]];
    bars.forEach(([nm, lg, txt, rgb, start], i) => {
      const ba = ca * smooth((tau - 13 - start) / 1.5); if (ba <= 0) return;
      const bw = (g0.x1 - g0.x0) * 0.26, x = g0.x0 + (g0.x1 - g0.x0) * (0.22 + i * 0.44) - bw / 2;
      const { g } = s; g.fillStyle = `rgba(${rgb},${0.85 * ba})`; g.fillRect(x, Y(lg), bw, g0.y1 - Y(lg));
      D.text(s, txt, x + bw / 2, Y(lg) - fs * 0.8, fs, ba, D.sans(fs, 600), rgb);
      D.text(s, nm, x + bw / 2, g0.y1 + fs * 0.9, fs - 1, 0.85 * ba, D.sans(fs - 1), C.muted);
    });
    D.text(s, 'log scale', g0.x1, g0.y0 - fs * 0.2, fs - 2, 0.6 * ca, D.sans(fs - 2), C.muted, 'right');
  }

  function endCard(s, t) {
    const a = fade(t, TEND, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 30, 18, 36)), s2 = Math.round(clamp(W / 52, 12, 18)), s3 = Math.round(clamp(W / 62, 11, 16));
    g.font = D.sans(s1, 300);
    const l1 = D.wrap(s, 'A chemical reaction rearranges atoms: potential energy changes into kinetic energy, or back', W - 48);
    let y = H * (phone ? 0.14 : 0.18);
    D.text(s, l1, W / 2, y, s1, a, D.sans(s1, 300)); y += s1 * 1.3 * l1.length + s2 * 0.6;
    const items = [
      ['Bonds are electric', PE, 'Atoms sit in a potential-energy well. Breaking a bond takes energy; making one releases it.'],
      ['Exothermic', HEAT, 'Products in deeper wells: the energy released becomes random kinetic energy, so the temperature rises.'],
      ['Mass', KE, 'E = mc² still applies, but chemical energies (eV) change the mass by only about 10⁻¹⁰.'],
    ];
    const colW = phone ? W - 40 : Math.min(W * 0.29, 320);
    items.forEach(([h, rgb, txt], i) => {
      const x = phone ? W / 2 : W / 2 + (i - 1) * W * 0.31;
      D.text(s, h, x, y, s2 + 1, a, D.sans(s2 + 1, 600), rgb);
      g.font = D.sans(s3); const ls = D.wrap(s, txt, colW);
      D.text(s, ls, x, y + s2 * 1.3, s3, 0.85 * a, D.sans(s3));
      if (phone) y += s2 * 1.3 + s3 * 1.3 * ls.length + s2 * 0.8;
    });
    g.font = D.sans(s3 - 1);
    D.text(s, D.wrap(s, 'Activation energy and the shape of the bond-energy curve go beyond the IB syllabus. Atoms and molecules are drawn hugely enlarged and slowed down.', Math.min(W - 40, 760)),
      W / 2, phone ? Math.max(y + s3, H * 0.84) : H * 0.8, s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('reaction', {
    duration: DURATION,
    poster: 99.6,
    // score: curious chemistry (G major, a soft sine pad, a low drone, a soft shimmer, a slow swell)
    music: { chords: [[55, 59, 62, 67], [52, 55, 59, 64], [48, 55, 60, 64], [50, 57, 62, 66]], bar: 9, pad: 'sine', cutoff: 800, drone: 0.09, shimmer: 0.2, tremolo: 0.25, volume: 0.35 },
    resize: layout,
    info: { morse, BREAK, MAKE, RELEASE, KT, PER_KG, DMFRAC, FISSION, CAPS, GROUPS, GAS, gasPos,
      check() {
        const eV = (kj) => kj * 1e3 / 6.02e23 / 1.60e-19;
        return { HH: eV(436), OO: eV(498), OH: eV(463), J_HH: 436e3 / 6.02e23, BREAK, MAKE, RELEASE, KT, PER_KG, DMFRAC, FISSION,
          ratio: FISSION / DMFRAC, rateMax: Math.max(...CAPS.map(([a, b, txt]) => txt.length / (b - a))) };
      } },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.22);
      const p1 = fade(t, T1, T2 + 0.6, 0.8, 0.9), p2 = fade(t, T2 + 0.4, T3 + 0.2, 1.0, 0.8);
      const p3 = fade(t, T3, T4 + 0.2, 0.8, 0.8), p4 = fade(t, T4, T5 + 0.2, 0.8, 0.8), p5 = fade(t, T5, TEND + 0.4, 0.8, 0.8);
      drawGas(s, t, Math.max(p1, p3), p3 * fade(t, 69, 73.5, 0.6, 1.2));
      if (p1 > 0) {                                                  // a key in the panel
        const { panel: p, fs } = L; panelBox(s, p, p1 * 0.8);
        head(s, 'key', p.x0, p.y0 + fs * 0.4, p1);
        const u = Math.min(30, (p.x1 - p.x0) / 7);
        molecule(s, 'H2', p.x0 + u * 1.4, p.y0 + fs * 2.6 + u * 0.4, u, 0, p1);
        D.text(s, 'hydrogen molecule, H₂', p.x0 + u * 3, p.y0 + fs * 2.6 + u * 0.4, fs, p1, D.sans(fs), C.text, 'left');
        molecule(s, 'O2', p.x0 + u * 1.4, p.y0 + fs * 4.4 + u * 1.6, u, 0, p1);
        D.text(s, 'oxygen molecule, O₂', p.x0 + u * 3, p.y0 + fs * 4.4 + u * 1.6, fs, p1, D.sans(fs), C.text, 'left');
        D.text(s, 'faint blue glow: electrons', p.x0 + fs * 0.3, p.y0 + fs * 6 + u * 3, fs - 1, 0.8 * p1, D.sans(fs - 1), E_RGB, 'left');
      }
      drawH2Zoom(s, t, p2); drawCurve(s, t, p2);
      drawLevels(s, t, p3);
      drawReaction(s, t, p4); drawEnergyBars(s, t, p4);
      drawMass(s, t, p5);
      D.captions(s, t, CAPS);
      D.title(s, t, 0.4, 4.4, 'What is a chemical reaction?', 'A physics view');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
