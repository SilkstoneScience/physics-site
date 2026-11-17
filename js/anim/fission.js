/* E.4 Fission and the chain reaction. One uranium-235 nucleus absorbs a slow neutron and splits; a chain reaction in a
   lump of uranium-235; a small and a big lump (critical mass); then inside a reactor (moderator, control rods, coolant).
   Numbers (from themes/e4.html, recalculated):
   - U-235: 92 protons, 235 − 92 = 143 neutrons. The nucleus is drawn with 47 balls (18 protons, 29 neutrons, about the
     same ratio: 92/235 = 0.39, 18/47 = 0.38); with the absorbed neutron, 48. It splits into barium (27 balls: 11 p, 16 n),
     krypton (18 balls: 7 p, 11 n) and 3 neutrons: 27 + 18 + 3 = 48; protons 11 + 7 = 18; neutrons 16 + 11 + 3 = 30 = 29 + 1.
   - The equation (as in the notes): n + U-235 → U-236* → Ba-141 + Kr-92 + 3n.
     Nucleon number: 1 + 235 = 236 and 141 + 92 + 3 × 1 = 236. Proton number: 0 + 92 = 92 and 56 + 36 + 3 × 0 = 92.
   - Energy: about 200 MeV per fission (notes: 236 × 0.9 ≈ 200 MeV); for this split, 173 MeV from the masses
     (Δm = 0.186033 u × 931.5 = 173.3 MeV). 200 MeV = 200 × 10⁶ × 1.60 × 10⁻¹⁹ = 3.2 × 10⁻¹¹ J.
   - The fragments fly apart with equal and opposite momentum, so speeds are in the inverse ratio of the masses:
     v(Kr)/v(Ba) = 141/92 = 1.53 (their separation grows as for two charges repelling: v = vmax √(1 − D0/D)).
   - Thermal neutron about 0.025 eV; fission neutrons about 2 MeV (notes). Enriched fuel: 3–5% uranium-235.
   - Reactor: 3.0 GW thermal ÷ 3.2 × 10⁻¹¹ J = 9.375 × 10¹⁹ ≈ 9.4 × 10¹⁹ fissions per second (notes' worked example).
   - The chain reaction: a 2D model, worked out once with a fixed seed (random but the same every time). Nuclei are
     scattered in a disc; each fission sends out 2 or 3 neutrons (equally likely) in random directions; a neutron splits the
     first unsplit nucleus whose capture circle it crosses, or escapes through the surface. Big lump radius 8, small 1.6
     (units of about one nucleus spacing); capture radius 0.22 gives a mean free path 1 ÷ (2 × 0.22 × 0.865) ≈ 2.6 units (174 nuclei in a disc of radius 8).
   - Reactor part: schematic (scripted). Each fission's neutrons: one is slowed by collisions in the moderator and splits
     a nucleus in another fuel rod; one is absorbed by a control rod; sometimes a third escapes through the bottom of the core.
     Each collision with a hydrogen nucleus leaves the neutron with a fraction of its speed. The fission rate graph uses
     dR/dt = (k − 1)R/τ with k − 1 = 0.06 × (how far the control rods are raised), τ = 0.6 s (schematic).
   The pictures are not to scale: a nucleus is about 10⁻¹⁴ m across, and the neutrons are slowed down enormously. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const rngOf = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };

  // ---------- timeline (scene seconds) ----------
  const T_N0 = 5.0, T_ABS = 10.0, T_STRETCH = 13.6, T_SPLIT = 16.0, T_EQ = 21.6, P1_END = 40.2;
  const T2 = 40.4, T2_GO = 43.0, P2_END = 70.2;
  const T3 = 70.4, T3_GO = 73.0, P3_END = 95.2;
  const T4 = 95.4, T4_F0 = 100.0, T_RATE = 112.8, T_COOL = 130.6, END_CARD = 140.4, DURATION = 152;

  // ---------- colours ----------
  const PROT = '255,90,122', PROT_HI = '255,205,215', NEUT = '125,140,178', NEUT_HI = '225,232,248';
  const U_RGB = C.light, BA_RGB = '255,128,160', KR_RGB = '90,215,230', N_RGB = '240,244,255', H_RGB = '120,190,255';
  const WATER = '40,90,170', FUEL = '205,140,70', ROD = '120,128,150', HOT = '255,140,80';

  // ---------- captions ----------
  const NB = ' ';
  const CAPS = [
    [4.8, 9.8, 'A uranium-235 nucleus: 92 protons and 143 neutrons (drawn with far fewer). A slow neutron drifts towards it.'],
    [10.0, 15.6, 'It absorbs the neutron and becomes uranium-236, which is unstable: it wobbles and stretches…'],
    [15.8, 21.4, '…and splits into two smaller nuclei, the fission fragments, and two or three fast neutrons (here, three).'],
    [21.6, 27.6, `Nucleon number and charge are both conserved: 1${NB}+${NB}235 = 141${NB}+${NB}92${NB}+${NB}3 = 236, and 92${NB}=${NB}56${NB}+${NB}36.`],
    [27.8, 33.8, 'About 200 MeV is released (173 MeV for this split), mostly as kinetic energy of the fragments, which repel each other.'],
    [34.0, 39.8, 'Predict: what could the three new neutrons do?'],
    [40.6, 45.8, 'A lump of pure uranium-235, drawn flat, with the nuclei hugely enlarged. One neutron starts it off.'],
    [46.0, 51.6, 'Each fission releases 2 or 3 neutrons, and each of those can split another nucleus.'],
    [51.8, 57.6, 'The bars count the fissions in each generation. On average, each fission causes more than one more.'],
    [57.8, 63.4, 'This is an uncontrolled chain reaction: the number of fissions grows, generation after generation.'],
    [63.6, 69.8, 'Some neutrons escape through the surface without hitting a nucleus. That matters most in a small lump…'],
    [70.6, 75.6, 'Now a small lump and a big lump of the same uranium-235, each started by one neutron.'],
    [75.8, 81.6, 'In the small lump, most neutrons escape through the surface before they hit a nucleus. The chain dies out.'],
    [81.8, 87.4, 'In the big lump, enough neutrons hit nuclei, so the chain keeps itself going.'],
    [87.6, 94.8, 'The critical mass is the minimum mass of fuel needed for a self-sustaining chain reaction.'],
    [95.6, 101.0, 'Inside a reactor: fuel rods of enriched uranium (3–5% uranium-235) stand in water, the moderator.'],
    [101.2, 106.8, `Neutrons from fission are fast, about 2${NB}MeV. Uranium-235 is far more likely to absorb slow ones.`],
    [107.0, 112.6, 'In the moderator they collide with light nuclei (hydrogen in the water), slow down, and then split uranium-235.'],
    [112.8, 118.4, 'Control rods absorb neutrons, so that on average exactly one neutron from each fission causes another.'],
    [118.6, 124.4, 'Raise the control rods and the rate of fission rises. Set them back, and it stays at its new, higher rate.'],
    [124.6, 130.4, 'Lower them and the rate falls; set them back and it holds steady. The rods decide whether the rate grows, falls or stays the same.'],
    [130.6, 135.6, "The fragments' kinetic energy heats the fuel. The coolant (here, the same water) carries the thermal energy away."],
    [135.8, 140.2, `A reactor giving 3.0${NB}GW of heat needs (3.0${NB}×${NB}10⁹)${NB}÷${NB}(3.2${NB}×${NB}10⁻¹¹) = 9.4${NB}×${NB}10¹⁹ fissions every second.`],
  ];
  // No pauses (teacher, 17 November 2026: "extend the animation instead of creating a pause, so that it plays at the
  // same speed"). Every caption still gets enough time to read at 16 characters a second, and the Predict caption 6 s
  // to think, but the extra time is added to the STORY (the times written in this file: captions, fades, which part is
  // shown) while everything that moves runs on the REAL clock and never stops: the neutron approaches, the nucleus
  // stretches, the fragments and neutrons fly apart, the chains spread and the reactor keeps running.
  const EXTRA = CAPS.map(([a, b, txt]) => {
    const need = txt.length / 16 - (b - a - 0.6);
    return need > 0.05 ? [+(b - 0.8).toFixed(2), +need.toFixed(1)] : null;
  }).filter(Boolean);
  EXTRA.push([39.0, 6.0]);
  EXTRA.sort((a, b) => a[0] - b[0]);
  const storyAt = (u) => {                                             // real scene time → story time
    let acc = 0;
    for (const [p, e] of EXTRA) { if (u < p + acc) return u - acc; if (u < p + acc + e) return p; acc += e; }
    return u - acc;
  };
  const realAt = (st) => st + EXTRA.filter((x) => x[0] < st).reduce((n, x) => n + x[1], 0);   // story time → real time
  const DURATION_U = realAt(DURATION);
  // the motion's own times, on the real clock
  const M_N0 = realAt(T_N0), M_ABS = realAt(T_ABS), M_STRETCH = realAt(T_STRETCH), M_SPLIT = realAt(T_SPLIT);
  const M2_GO = realAt(T2_GO), M3_GO = realAt(T3_GO), M4_F0 = realAt(T4_F0), M_RATE = realAt(T_RATE), M_END = realAt(END_CARD);

  // ---------- part 1: the nucleus (units: ball radius) ----------
  const NUC = (() => {
    const rnd = rngOf(235), n = 48, Rc = 1.02 * Math.cbrt(n);
    const P = [];
    for (let i = 0; i < n; i++) {
      const z = rnd() * 2 - 1, ph = rnd() * Math.PI * 2, r = Rc * Math.cbrt(rnd()), s = Math.sqrt(1 - z * z);
      P.push([r * s * Math.cos(ph), r * s * Math.sin(ph), r * z]);
    }
    for (let it = 0; it < 60; it++) {                                  // push the balls apart, keep them in the sphere
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const d = [P[j][0] - P[i][0], P[j][1] - P[i][1], P[j][2] - P[i][2]], L = Math.hypot(...d) || 1e-6;
        if (L < 1.75) { const k = (1.75 - L) / L * 0.25; for (let c = 0; c < 3; c++) { P[i][c] -= d[c] * k; P[j][c] += d[c] * k; } }
      }
      for (const p of P) { const L = Math.hypot(...p); if (L > Rc) for (let c = 0; c < 3; c++) p[c] *= Rc / L; }
    }
    const order = [...Array(n).keys()].sort((a, b) => P[a][0] - P[b][0]);
    const slot = order[0];                                            // the incoming neutron's place (leftmost)
    const group = new Array(n), type = new Array(n).fill(0);          // 0 Ba, 1 emitted neutron, 2 Kr; type 1 = proton
    order.forEach((idx, k) => { group[idx] = k < 27 ? 0 : k < 30 ? 1 : 2; });
    const pick = (ids, m) => { const a = ids.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } a.slice(0, m).forEach((i) => { type[i] = 1; }); };
    pick(order.filter((i) => group[i] === 0 && i !== slot), 11);
    pick(order.filter((i) => group[i] === 2), 7);
    const cen = [0, 2].map((g) => { const ids = order.filter((i) => group[i] === g); return [0, 1, 2].map((c) => ids.reduce((s, i) => s + P[i][c], 0) / ids.length); });
    return { P, n, Rc, slot, group, type, cen };
  })();
  // the fragments' separation after the split: repelling charges, v = VMAX √(1 − D0/D)
  // speeds in the same ratio as real ones: fission neutrons (2 MeV) about 2.0 × 10⁷ m/s, krypton-92 about 1.4 × 10⁷ m/s,
  // barium-141 about 0.9 × 10⁷ m/s; so v(n) = 1.45 v(Kr). The view zooms out to keep them all in sight.
  const VMAX = 1.37, V_N = 1.2, SEP = (() => {
    const D0 = NUC.cen[1][0] - NUC.cen[0][0] + 2.4, out = [];
    let Dd = D0 * 1.03;
    for (let k = 0; k <= 6000; k++) { out.push(Dd - D0); for (let j = 0; j < 10; j++) Dd += VMAX * Math.sqrt(1 - D0 / Dd) * 0.001; }
    return out;                                                        // every 0.01 s
  })();
  const sepAt = (dt) => { const f = clamp(dt / 0.01, 0, SEP.length - 1.001), k = Math.floor(f); return lerp(SEP[k], SEP[k + 1], f - k); };
  const SH_BA = 92 / 233, SH_KR = 141 / 233;                           // centre of mass stays put
  const EMIT = [[Math.cos(0.4), -Math.sin(0.4)], [Math.cos(2.8), -Math.sin(2.8)], [Math.cos(3.55), -Math.sin(3.55)]];

  // ---------- parts 2 and 3: chain reactions in a lump (units: about one nucleus spacing) ----------
  const RC = 0.22, V = 1.2;
  function lump(R, seed) {
    const rnd = rngOf(seed), N = [[0, 0]];
    for (let tries = 0; tries < 6000; tries++) {                       // scattered nuclei, at least 0.85 apart
      const r = R * Math.sqrt(rnd()) * 0.97, a = rnd() * Math.PI * 2, x = r * Math.cos(a), y = r * Math.sin(a);
      if (N.every(([u, v]) => (u - x) ** 2 + (v - y) ** 2 > 0.85 * 0.85)) N.push([x, y]);
    }
    const tf = new Array(N.length).fill(Infinity), gen = new Array(N.length).fill(0), parentOf = new Array(N.length).fill(-1);
    const neut = [], queue = [];
    const launch = (x0, y0, t0, ux, uy, parent) => {
      const cands = [];
      N.forEach(([x, y], j) => {
        if (j === parent) return;
        const dx = x - x0, dy = y - y0, along = dx * ux + dy * uy, perp = Math.abs(dx * uy - dy * ux);
        if (along > 0.05 && perp < RC) cands.push([along, j]);
      });
      cands.sort((a, b) => a[0] - b[0]);
      const id = neut.length;
      neut.push({ x0, y0, t0, ux, uy, t1: Infinity, hit: -1, parent });
      if (cands.length) queue.push({ t: t0 + cands[0][0] / V, id, cands, k: 0 }); else neut[id].t1 = t0 + 40 / V;
    };
    // the first neutron comes in from the left, aimed at the nucleus in the centre
    launch(-R - 1.5, 0, 0, 1, 0, -1);
    let count = 0;
    while (queue.length && count < 600) {
      let m = 0; for (let i = 1; i < queue.length; i++) if (queue[i].t < queue[m].t) m = i;
      const ev = queue.splice(m, 1)[0], j = ev.cands[ev.k][1], n0 = neut[ev.id];
      if (tf[j] === Infinity) {
        tf[j] = ev.t; n0.t1 = ev.t; n0.hit = j; count++;
        gen[j] = n0.parent < 0 ? 1 : gen[n0.parent] + 1; parentOf[j] = n0.parent;
        if (ev.t < 30) {
          const k = rnd() < 0.5 ? 2 : 3;
          for (let q = 0; q < k; q++) { const a = rnd() * Math.PI * 2; launch(N[j][0], N[j][1], ev.t, Math.cos(a), Math.sin(a), j); }
        }
      } else if (ev.k + 1 < ev.cands.length) {
        ev.k++; ev.t = n0.t0 + ev.cands[ev.k][0] / V; queue.push(ev);
      } else n0.t1 = n0.t0 + 40 / V;                                    // flies out of the lump and away
    }
    const frag = N.map((_, j) => rnd() * Math.PI * 2);                  // the direction the two fragments fly apart
    return { R, N, tf, gen, neut, frag, total: count };
  }
  const fissionsBy = (L, t) => { let c = 0; for (const x of L.tf) if (x <= t) c++; return c; };
  const genCounts = (L, t) => { const g = []; L.tf.forEach((x, j) => { if (x <= t) g[L.gen[j] - 1] = (g[L.gen[j] - 1] || 0) + 1; }); return g; };
  // fixed seeds, found by trying in order: a big lump whose chain grows well and a small lump whose chain dies at once
  const BIG = (() => { for (let s = 1; s < 400; s++) { const L = lump(8, 1000 + s), g = genCounts(L, 99); if (fissionsBy(L, 14) >= 50 && g[1] >= 2 && g[2] >= 3 && g[3] >= 5) return L; } return lump(8, 1001); })();
  const SMALL = (() => { for (let s = 1; s < 400; s++) { const L = lump(1.6, 2000 + s), esc = L.neut.filter((n) => n.hit < 0).length; if (L.total >= 2 && L.total <= 3 && esc >= 4 && L.N.length >= 6) return L; } return lump(1.6, 2001); })();

  // ---------- part 4: the reactor (units: core half-width 4.6) ----------
  const RX = [-3, -1, 1, 3], RHW = 0.32, RTOP = 4, CX = [-2, 2], CHW = 0.22, TIP0 = 1.0;
  const tipAt = (t) => {                                               // control-rod tips: raised by 1, set back (the rate holds), lowered by 1, set back
    const ramp = (a, b) => smooth((t - a) / (b - a));
    const R = (a, b) => ramp(realAt(a), realAt(b));                   // the story's moments, on the real clock
    return TIP0 + (R(119.0, 119.8) - R(121.6, 122.4)) - (R(124.5, 125.3) - R(127.1, 127.9));
  };
  const RATE = (() => {                                                // dR/dt = (k − 1) R / τ, k − 1 = 0.06 × (tip − TIP0)
    const out = []; let R = 1;
    for (let t = M_RATE; t <= M_END + 0.05; t += 0.02) { out.push(R); R *= Math.exp(0.06 * (tipAt(t) - TIP0) / 0.6 * 0.02); }
    return out;
  })();
  const rateAt = (t) => { const f = clamp((t - M_RATE) / 0.02, 0, RATE.length - 1.001), k = Math.floor(f); return lerp(RATE[k], RATE[k + 1], f - k); };
  const REACT = (() => {
    const rnd = rngOf(4242), fis = [], paths = [], hits = [];
    const SPEED = [6.0, 4.0, 2.7, 1.8, 1.25].map((v) => v / 1.6);      // fast → slow (shown slowed for clarity)
    let rod = 1, y = -1.0, t = M4_F0, k = 0;
    const gapX = (a, b) => [Math.min(RX[a], RX[b]) + RHW + 0.12, Math.max(RX[a], RX[b]) - RHW - 0.12];
    const segs = (pts, speeds, t0) => { const out = []; let tt = t0; for (let i = 0; i < pts.length - 1; i++) { const L = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]), v = speeds[Math.min(i, speeds.length - 1)]; out.push({ a: pts[i], b: pts[i + 1], t0: tt, t1: tt + L / v, v }); tt += L / v; } return out; };
    while (t < M_END - 0.5 && k < 60) {
      fis.push({ x: RX[rod], y, t, rod });
      // the next rod: a neighbour; crossing a gap with a control rod only below its lowest tip
      const opts = [rod - 1, rod + 1].filter((r) => r >= 0 && r <= 3);
      const next = opts[Math.floor(rnd() * opts.length)], ctrl = Math.abs(RX[rod] + RX[next]) / 2 > 1;
      const ny = ctrl ? -1.4 - rnd() * 2.2 : clamp(y + (rnd() - 0.5) * 3, -3.4, 3.4);
      const [g0, g1] = gapX(rod, next), sx = RX[rod] + (RX[next] > RX[rod] ? 1 : -1) * RHW;
      const pts = [[RX[rod], y], [sx, y + (rnd() - 0.5) * 0.4]];
      const cx = ctrl ? CX[RX[next] + RX[rod] > 0 ? 1 : 0] : 0;
      const dir = RX[next] > RX[rod] ? 1 : -1;
      for (let c = 0; c < 4; c++) {
        let px = lerp(g0, g1, rnd()); let py = clamp(lerp(y, ny, (c + 1) / 5) + (rnd() - 0.5) * 1.2, -3.8, 3.8);
        if (ctrl) {
          // past a control rod only below its lowest tip; the first collision stays on the near side of the rod
          py = Math.min(py, -0.9 - rnd() * 0.4);
          if (c === 0) px = lerp(sx + dir * 0.1, cx - dir * (CHW + 0.12), rnd());
          else if (Math.abs(px - cx) < CHW + 0.1) px = cx + (px < cx ? -1 : 1) * (CHW + 0.12);
        }
        pts.push([px, py]); hits.push({ x: px, y: py, t: null });
      }
      pts.push([RX[next], ny]);
      const sp = segs(pts, [SPEED[0], ...SPEED], t);
      sp.slice(2, 6).forEach((s, i) => { hits[hits.length - 4 + i].t = s.t0; });
      paths.push({ kind: 'go', segs: sp });
      // one neutron absorbed by the control rod beside this fuel rod, high up
      const cxa = CX[RX[rod] < 0 ? 0 : 1], side = RX[rod] < cxa ? -1 : 1, ay = 2.5 + rnd() * 1.3;
      const axs = cxa + side * (CHW + 0.02), mid = (RX[rod] + side * -RHW + axs) / 2;
      const ap = [[RX[rod], y], [RX[rod] - side * RHW, y + 0.2], [mid, lerp(y, ay, 0.45) + (rnd() - 0.5) * 0.5], [mid + side * 0.05, lerp(y, ay, 0.8)], [axs, ay]];
      paths.push({ kind: 'absorb', segs: segs(ap, SPEED, t) });
      // sometimes a third, lost through the bottom of the core
      if (k % 2 === 0) {
        const lx = RX[rod] + (rnd() < 0.5 ? -1 : 1) * (RHW + 0.25);
        paths.push({ kind: 'lost', segs: segs([[RX[rod], y], [lx, y - 0.6], [lx + (rnd() - 0.5) * 0.4, -4.3], [lx + (rnd() - 0.5) * 0.6, -6.5]], SPEED, t) });
      }
      const go = paths.find((p, i) => i === paths.length - (k % 2 === 0 ? 3 : 2));
      t = go.segs[go.segs.length - 1].t1; rod = next; y = ny; k++;
    }
    return { fis, paths, hits };
  })();
  const deco = (() => { const rnd = rngOf(77), U = [], Hn = []; for (const x of RX) for (let i = 0; i < 7; i++) U.push([x + (rnd() - 0.5) * 0.36, -3.7 + i * 1.15 + rnd() * 0.3]);
    for (let i = 0; i < 70; i++) Hn.push([(rnd() - 0.5) * 9, (rnd() - 0.5) * 9]);
    return { U, Hn: Hn.filter(([x]) => RX.every((r) => Math.abs(x - r) > RHW + 0.08) && CX.every((c) => Math.abs(x - c) > CHW + 0.08)) }; })();

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25)), capTop = H - capFs * (phone ? 6.6 : 5.0);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16)), top = phone ? 8 : Math.max(52, H * 0.11);
    const o = { W, H, phone, capFs, capTop, fs, top };
    // part 1
    o.p1 = { cx: W / 2, cy: phone ? top + (capTop - top) * 0.36 : top + (capTop - top) * 0.36, u: Math.min(W, capTop - top) * (phone ? 0.042 : 0.05) };
    o.p1.eqY = phone ? capTop - fs * 7.6 : capTop - fs * 5.8;
    // part 2: lump and chart
    const ah = capTop - top;
    if (phone) {
      const r = Math.min(W * 0.44, ah * 0.29);
      o.p2 = { cx: W / 2, cy: top + r + fs, u: r / 8, chart: { x0: W * 0.12, x1: W * 0.92, y0: top + 2 * r + fs * 6.4, y1: capTop - fs * 2.6 } };
    } else {
      const r = Math.min(W * 0.27, ah * 0.45);
      o.p2 = { cx: W * 0.33, cy: top + ah * 0.48, u: r / 8, chart: { x0: W * 0.63, x1: W * 0.95, y0: top + fs * 4.4, y1: capTop - fs * 3.6 } };
    }
    // part 3: small and big lump, same scale
    if (phone) {
      const u = Math.min(W * 0.42 / 8, (ah - fs * 8.4 - 12) / 20.4);
      const sy = top + fs * 0.6 + 2.2 * u + 4;
      o.p3 = { u, small: [W / 2, sy], big: [W / 2, sy + 1.6 * u + fs * 4.0 + 8.6 * u + 4] };
    } else {
      const u = Math.min(W * 0.26 / 8, (ah - fs * 3.5) * 0.46 / 8);
      o.p3 = { u, small: [W * 0.2, top + ah * 0.46], big: [W * 0.62, top + ah * 0.46] };
    }
    // part 4: core and rate graph
    if (phone) {
      const u = Math.min(W * 0.92 / 11, (ah - fs * 14) / 10.6);
      const cy = top + 5.8 * u + fs * 1.6;
      o.p4 = { u, cx: W / 2, cy, chart: { x0: W * 0.14, x1: W * 0.94, y0: cy + 4.6 * u + fs * 5.6, y1: capTop - fs * 2.4 } };
    } else {
      const u = Math.min(W * 0.52 / 11, ah * 0.9 / 12);
      o.p4 = { u, cx: W * 0.32, cy: top + ah * 0.5 + u * 0.3, chart: { x0: W * 0.66, x1: W * 0.95, y0: top + fs * 4.4, y1: capTop - fs * 4.2 } };
    }
    L = o;
  }

  // ---------- small drawing helpers ----------
  const ball = (g, x, y, r, rgb, hi, a) => {
    if (a <= 0 || !(r > 0)) return;
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    gr.addColorStop(0, `rgba(${hi},${a})`); gr.addColorStop(1, `rgba(${rgb},${a})`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  };
  const label = (s, txt, x, y, a, rgb = C.muted, align = 'center', size = L.fs, w = 400) => D.text(s, txt, x, y, size, a, D.sans(size, w), rgb, align);
  const neutronDot = (s, x, y, vx, vy, a, streak = 1) => {           // a neutron, with a streak behind it when fast
    if (a <= 0) return;
    const sp = Math.hypot(vx, vy);
    if (streak > 0 && sp > 0) D.glowLine(s, [[x - vx * streak, y - vy * streak], [x, y]], N_RGB, 0.55 * a, 1.2);
    D.glowDot(s, x, y, Math.max(5, L.fs * 0.6), N_RGB, a);
  };
  // a nuclide symbol with its nucleon number above and proton number below, to the left; returns its width
  function nuclide(s, x, y, A, Z, sym, size, a, rgb, draw = true) {
    const { g } = s, small = Math.round(size * 0.58);
    g.font = D.sans(small); const wn = Math.max(g.measureText(String(A)).width, g.measureText(String(Z)).width);
    g.font = D.sans(size); const ws = g.measureText(sym).width;
    if (draw && a > 0) {
      g.globalCompositeOperation = 'source-over'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 8;
      g.fillStyle = `rgba(${rgb},${a})`; g.textAlign = 'right'; g.font = D.sans(small);
      g.fillText(String(A), x + wn, y - size * 0.42); g.fillText(String(Z), x + wn, y + size * 0.42);
      g.textAlign = 'left'; g.font = D.sans(size); g.fillText(sym, x + wn + 1, y); g.shadowBlur = 0;
    }
    return wn + 1 + ws;
  }

  // ---------- part 1: one fission ----------
  function part1(s, t, a, u0) {
    if (a <= 0) return;
    const { g } = s, { cx, cy, u } = L.p1, { P, n, slot, group, type, cen } = NUC;
    // the wobble and stretch of uranium-236, then the split
    const wob = u0 > M_ABS && u0 < M_SPLIT ? 0.12 * Math.sin(2 * Math.PI * 1.3 * (u0 - M_ABS)) * smooth((u0 - M_ABS) / 1.2) * (1 - smooth((u0 - M_STRETCH) / 1.5)) : 0;
    const str = smooth((u0 - M_STRETCH) / (M_SPLIT - M_STRETCH)), neck = 2.4 * str;
    const dt = u0 - M_SPLIT, sep = dt > 0 ? sepAt(dt) : 0;
    const list = [];
    for (let i = 0; i < n; i++) {
      if (i === slot && u0 < M_ABS) continue;
      const gr = group[i];
      if (gr === 1 && dt > 0) continue;                                // emitted neutrons are drawn separately
      let [x, y, z] = P[i];
      x *= 1 + wob; y /= Math.sqrt(1 + wob); z /= Math.sqrt(1 + wob);
      if (gr !== 1) {                                                  // stretch into two lobes, then fly apart
        const c = cen[gr === 0 ? 0 : 1], k = 0.9 * str;
        x = c[0] + (x - c[0]) * (1 - 0.18 * k); y = c[1] + (y - c[1]) * (1 - 0.18 * k); z = c[2] + (z - c[2]) * (1 - 0.18 * k);
        x += (gr === 0 ? -1 : 1) * neck / 2 + (dt > 0 ? (gr === 0 ? -SH_BA : SH_KR) * sep : 0);
      }
      list.push([x, y, z, i]);
    }
    list.sort((p, q) => p[2] - q[2]);
    // the view zooms out after the split so the neutrons and fragments stay in sight (they move at constant speed)
    const dn = 1.2 + V_N * Math.max(0, dt);
    let kz = 1;
    if (dt > 0) {                                                      // just enough zoom for each neutron and fragment to fit
      const roomX = L.W / 2 - L.fs * 2.5, roomUp = cy - L.top - L.fs * 3.6, roomDown = L.p1.eqY - L.fs * 2.6 - cy;
      const ids = [...Array(n).keys()].filter((i) => group[i] === 1);
      ids.forEach((i, k) => {
        const x = P[i][0] + EMIT[k][0] * dn, y = P[i][1] - EMIT[k][1] * dn;
        kz = Math.min(kz, roomX / (Math.abs(x) + 1) / u, (y > 0 ? roomUp : roomDown) / (Math.abs(y) + 1) / u);
      });
      kz = Math.min(kz, (roomX - L.fs * 3) / (cen[1][0] + neck / 2 + SH_KR * sep + 3) / u);
    }
    const uz = u * kz;
    const X = (x) => cx + x * uz, Y = (y) => cy - y * uz;
    // a soft glow behind the nucleus (or each fragment)
    const glowAt = (x, y, r, rgb, al) => { const gg = g.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, `rgba(${rgb},${0.22 * al})`); gg.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    const xBa = cen[0][0] - neck / 2 - SH_BA * sep, xKr = cen[1][0] + neck / 2 + SH_KR * sep;
    if (dt <= 0) glowAt(cx, cy, NUC.Rc * u * 2.2, U_RGB, a);
    else { glowAt(X(xBa), cy, 4.5 * uz, BA_RGB, a); glowAt(X(xKr), cy, 4 * uz, KR_RGB, a); }
    for (const [x, y, z, i] of list) {
      const shade = 0.75 + 0.25 * clamp((z + NUC.Rc) / (2 * NUC.Rc), 0, 1);
      const p = type[i] === 1;
      ball(g, X(x), Y(y), uz * 0.98 * shade, p ? PROT : NEUT, p ? PROT_HI : NEUT_HI, a);
    }
    // the incoming slow neutron
    if (u0 >= M_N0 && u0 < M_ABS) {
      const f = (u0 - M_N0) / (M_ABS - M_N0), sx = -(L.W / 2 / u) - 2, ex = P[slot][0], ey = P[slot][1];
      const x = cx + lerp(sx, ex, f) * u, y = cy - ey * u;
      ball(g, x, y, u * 0.98, NEUT, NEUT_HI, a);
      label(s, 'slow neutron', clamp(x, L.fs * 4, L.W - L.fs * 4), y - u * 2.2, a * fade(t, T_N0 + 0.5, T_ABS - 0.3), C.text);
    }
    // the three fast neutrons, the flash, and the energy
    if (dt > 0) {
      const ids = list.length ? [...Array(n).keys()].filter((i) => group[i] === 1) : [];
      ids.forEach((i, k) => {
        const [ux, uy] = EMIT[k], x = X(P[i][0] + ux * dn), y = cy - (P[i][1] - uy * dn) * uz;
        neutronDot(s, x, y, ux * uz * V_N, uy * uz * V_N, a, 1.2); ball(g, x, y, Math.max(3, uz * 0.9), NEUT, NEUT_HI, a);
      });
      const fl = Math.exp(-dt * 3);
      if (fl > 0.02) { g.globalCompositeOperation = 'lighter'; const r = u * (3 + 30 * dt); g.strokeStyle = `rgba(255,240,200,${0.6 * fl * a})`; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); g.globalCompositeOperation = 'source-over'; }
      const ea = a * fade(t, T_SPLIT + 0.6, P1_END - 0.4, 0.6, 0.6);
      label(s, 'about 200 MeV released', cx, L.top + L.fs * 0.8, ea, U_RGB, 'center', L.fs + 2, 600);
      label(s, 'the view zooms out to follow them', cx, L.top + L.fs * 2.2, ea * smooth((1 - kz) / 0.08) * 0.8, C.muted, 'center', L.fs - 1);
      const fa = a * fade(t, T_SPLIT + 1.2, P1_END - 0.4, 0.5, 0.6), ly = cy + 4.2 * uz + L.fs * 1.1;
      // the two labels lean away from each other, so they can't overlap when the view has zoomed out
      label(s, 'barium-141', X(xBa) + Math.max(2 * uz, L.fs * 0.4), ly, fa, BA_RGB, 'right', L.fs, 600);
      label(s, 'krypton-92', X(xKr) - Math.max(2 * uz, L.fs * 0.4), ly, fa, KR_RGB, 'left', L.fs, 600);
      label(s, 'neutron', clamp(X(P[ids[0]][0] + EMIT[0][0] * dn), L.fs * 3, L.W - L.fs * 3),
        Math.max(L.top + L.fs * 3.4, cy - (P[ids[0]][1] - EMIT[0][1] * dn) * uz - L.fs * 1.2), a * fade(t, T_SPLIT + 2, P1_END - 0.4, 0.5, 0.6), N_RGB, 'center', L.fs - 1);
    }
    // labels on the nucleus
    label(s, 'uranium-235', cx, cy + NUC.Rc * u + L.fs * 1.4, a * fade(t, 4.8, T_ABS + 0.3, 0.6, 0.4), U_RGB, 'center', L.fs + 1, 600);
    label(s, 'uranium-236 (unstable)', cx, cy + NUC.Rc * u + L.fs * 1.4, a * fade(t, T_ABS + 0.4, T_SPLIT, 0.4, 0.3), U_RGB, 'center', L.fs + 1, 600);
    // the equation
    const ea = a * smooth((t - T_EQ) / 0.8);
    if (ea > 0) {
      const size0 = L.phone ? 15 : Math.round(clamp(L.W / 46, 16, 26)), parts = [
        ['nuc', 1, 0, 'n'], ['txt', ' + '], ['nuc', 235, 92, 'U'], ['txt', ' → '], ['nuc', 236, 92, 'U*'], ['txt', ' → '],
        ['nuc', 141, 56, 'Ba'], ['txt', ' + '], ['nuc', 92, 36, 'Kr'], ['txt', ' + 3 '], ['nuc', 1, 0, 'n']];
      const width = (sz) => parts.reduce((w, p) => { if (p[0] === 'txt') { g.font = D.sans(sz); return w + g.measureText(p[1]).width; } return w + nuclide(s, 0, 0, p[1], p[2], p[3], sz, 0, C.text, false); }, 0);
      let size = size0; const tw = width(size); if (tw > L.W - 24) size = Math.floor(size * (L.W - 24) / tw);
      let x = L.W / 2 - width(size) / 2; const y = L.p1.eqY;
      g.fillStyle = `rgba(14,20,44,${0.72 * ea})`; g.beginPath(); g.roundRect(x - 14, y - size * 1.2, width(size) + 28, size * 2.4 + L.fs * (L.phone ? 3.4 : 2.2), 10); g.fill();
      for (const p of parts) {
        if (p[0] === 'txt') { g.font = D.sans(size); D.text(s, p[1], x, y, size, ea, D.sans(size), C.text, 'left'); x += g.measureText(p[1]).width; }
        else { const rgb = p[3] === 'Ba' ? BA_RGB : p[3] === 'Kr' ? KR_RGB : p[3] === 'n' ? N_RGB : U_RGB; x += nuclide(s, x, y, p[1], p[2], p[3], size, ea, rgb); }
      }
      const b1 = `nucleon number:  1 + 235 = 141 + 92 + 3 = 236`, b2 = `proton number:  92 = 56 + 36`;
      if (L.phone) { label(s, b1, L.W / 2, y + size * 1.25 + L.fs * 0.4, ea * 0.85); label(s, b2, L.W / 2, y + size * 1.25 + L.fs * 1.8, ea * 0.85); }
      else label(s, `${b1}      ${b2}`, L.W / 2, y + size * 1.3 + L.fs * 0.3, ea * 0.85);
    }
  }

  // ---------- a lump of uranium-235 with its chain reaction ----------
  function drawLump(s, Lm, t, cx, cy, u, a) {
    if (a <= 0) return;
    const { g } = s;
    // the lump's edge
    g.globalCompositeOperation = 'source-over';
    const rg = g.createRadialGradient(cx, cy, 0, cx, cy, (Lm.R + 0.6) * u);
    rg.addColorStop(0, `rgba(80,70,30,${0.18 * a})`); rg.addColorStop(1, `rgba(80,70,30,${0.05 * a})`);
    g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, (Lm.R + 0.6) * u, 0, 7); g.fill();
    g.strokeStyle = `rgba(${U_RGB},${0.35 * a})`; g.lineWidth = 1.2; g.setLineDash([4, 5]); g.beginPath(); g.arc(cx, cy, (Lm.R + 0.6) * u, 0, 7); g.stroke(); g.setLineDash([]);
    const rN = Math.max(2.5, RC * u * 1.1);
    Lm.N.forEach(([x, y], j) => {
      const X = cx + x * u, Y = cy - y * u, tf = Lm.tf[j];
      if (t < tf) { ball(g, X, Y, rN, '200,150,40', '255,235,160', a); return; }
      const d = t - tf, k = smooth(d / 0.9), sp = 0.55 * k * u, ang = Lm.frag[j];
      const fa = a * (1 - 0.55 * smooth((d - 2) / 3));
      ball(g, X + Math.cos(ang) * sp, Y + Math.sin(ang) * sp, rN * 0.75, BA_RGB, '255,220,230', fa);
      ball(g, X - Math.cos(ang) * sp, Y - Math.sin(ang) * sp, rN * 0.65, KR_RGB, '210,250,255', fa);
      if (d < 0.6) D.glowDot(s, X, Y, rN * 5 * (1 - d / 0.6) + rN, '255,235,190', a * (1 - d / 0.6));
    });
    for (const nn of Lm.neut) {
      if (t < nn.t0 || t > nn.t1) continue;
      const d = (t - nn.t0) * V, x = nn.x0 + nn.ux * d, y = nn.y0 + nn.uy * d, r = Math.hypot(x, y);
      const na = a * (nn.hit < 0 ? 1 - smooth((r - Lm.R - 2) / 5) : 1);
      const st = Math.min(d, 0.9);
      neutronDot(s, cx + x * u, cy - y * u, nn.ux * u, -nn.uy * u, na, st);
    }
  }
  function genChart(s, Lm, t, box, a) {
    if (a <= 0) return;
    const { g } = s, { x0, x1, y0, y1 } = box, fs = L.fs;
    g.fillStyle = `rgba(14,20,44,${0.7 * a})`; g.beginPath(); g.roundRect(x0 - 10, y0 - fs * 3.4, x1 - x0 + 20, y1 - y0 + fs * 5.6, 10); g.fill();
    const n = fissionsBy(Lm, t);
    label(s, `fissions so far: ${n}`, x0, y0 - fs * 2.2, a, U_RGB, 'left', fs + 2, 600);
    label(s, 'fissions in each generation', x0, y0 - fs * 0.8, a * 0.85, C.muted, 'left');
    const gc = genCounts(Lm, t), G = 8, bw = (x1 - x0) / G, max = 40;
    // a generation is complete once its last fission has happened; bars still filling are drawn paler
    const last = []; Lm.tf.forEach((x, j) => { if (Number.isFinite(x)) last[Lm.gen[j] - 1] = Math.max(last[Lm.gen[j] - 1] || 0, x); });
    let filling = false;
    for (let k = 0; k < G; k++) {
      const c = gc[k] || 0, h = Math.min(1, c / max) * (y1 - y0), x = x0 + k * bw + bw * 0.15, done = t >= (last[k] || 0);
      if (c && !done) filling = true;
      g.fillStyle = `rgba(${U_RGB},${(done ? 0.85 : 0.4) * a})`; g.fillRect(x, y1 - h, bw * 0.7, h);
      if (c) label(s, c > max ? `${c}↑` : String(c), x + bw * 0.35, y1 - h - fs * 0.7, a * (done ? 1 : 0.6), C.text, 'center', fs - 1);
      label(s, String(k + 1), x + bw * 0.35, y1 + fs * 0.9, a * 0.8, C.muted, 'center', fs - 1);
    }
    D.line(s, x0, y1, x1, y1, C.muted, 0.6 * a, 1);
    label(s, filling ? 'generation (pale bars: still filling)' : 'generation', (x0 + x1) / 2, y1 + fs * 2.1, a * 0.8, C.muted, 'center', fs - 1);
  }

  // ---------- part 4: the reactor ----------
  function part4(s, t, a, ur) {
    if (a <= 0) return;
    const { g } = s, { u, cx, cy } = L.p4, X = (x) => cx + x * u, Y = (y) => cy - y * u;
    const fs = L.fs, tip = tipAt(ur);
    // water (moderator and coolant)
    g.fillStyle = `rgba(${WATER},${0.28 * a})`; g.fillRect(X(-4.6), Y(4.6), 9.2 * u, 9.2 * u);
    g.strokeStyle = `rgba(150,170,230,${0.5 * a})`; g.lineWidth = 1.3; g.strokeRect(X(-4.6), Y(4.6), 9.2 * u, 9.2 * u);
    for (const [x, y] of deco.Hn) D.glowDot(s, X(x), Y(y), Math.max(3, u * 0.12), H_RGB, 0.35 * a);
    // fuel rods, warmer as fissions heat them
    RX.forEach((rx, ri) => {
      let heat = 0; for (const f of REACT.fis) if (f.rod === ri && ur >= f.t) heat += Math.exp(-(ur - f.t) / 3);
      heat = clamp(heat, 0, 1.4) / 1.4 + (t > T_COOL ? 0.25 : 0);
      g.fillStyle = `rgba(${FUEL},${(0.55 + 0.25 * heat) * a})`; g.beginPath(); g.roundRect(X(rx - RHW), Y(RTOP), 2 * RHW * u, 2 * RTOP * u, 4); g.fill();
      if (heat > 0.05) { g.shadowColor = `rgba(${HOT},${0.8 * heat * a})`; g.shadowBlur = 18 * heat; g.strokeStyle = `rgba(${HOT},${0.7 * heat * a})`; g.lineWidth = 1.5; g.stroke(); g.shadowBlur = 0; }
    });
    for (const [x, y] of deco.U) ball(g, X(x), Y(y), Math.max(2.5, u * 0.11), '200,150,40', '255,235,160', 0.8 * a);
    // control rods from above, down to their tips
    for (const c of CX) {
      g.fillStyle = `rgba(${ROD},${0.95 * a})`; g.fillRect(X(c - CHW), Y(5.8), 2 * CHW * u, (5.8 - tip) * u);
      g.strokeStyle = `rgba(210,215,235,${0.6 * a})`; g.lineWidth = 1; g.strokeRect(X(c - CHW), Y(5.8), 2 * CHW * u, (5.8 - tip) * u);
    }
    // coolant flow (from T_COOL): up through the gaps, cool blue at the bottom, warm at the top
    const ca = a * smooth((t - T_COOL) / 1.0);
    if (ca > 0) {
      for (let i = 0; i < 5; i++) for (let k = 0; k < 6; k++) {
        const gx = -4 + i * 2, ph = ((s.clock * 0.25 + k / 6 + i * 0.13) % 1), y = -4.4 + ph * 8.8;
        const rgb = `${Math.round(lerp(110, 255, ph))},${Math.round(lerp(180, 140, ph))},${Math.round(lerp(255, 80, ph))}`;
        D.glowDot(s, X(gx), Y(y), Math.max(4, u * 0.2), rgb, ca * 0.8 * Math.sin(Math.PI * ph));
      }
      D.arrow(s, X(-4.6) - fs * 3.2, Y(-4.0), X(-4.6) - 4, Y(-4.0), '110,180,255', ca, '', { head: 9, width: 2 });
      D.arrow(s, X(4.6) + 4, Y(4.0), X(4.6) + fs * 3.2, Y(4.0), HOT, ca, '', { head: 9, width: 2 });
      label(s, L.phone ? 'cool in' : 'cooler coolant in', X(-4.6) - 4, Y(-4.0) - fs * 1.1, ca, '110,180,255', 'right');
      label(s, L.phone ? 'hot out' : 'hot coolant out', X(4.6) + 4, Y(4.0) - fs * 1.3, ca, HOT, 'left');
    }
    // light nuclei hit by neutrons flash briefly
    for (const h of REACT.hits) if (ur >= h.t && ur < h.t + 0.6) D.glowDot(s, X(h.x), Y(h.y), Math.max(6, u * 0.4), H_RGB, a * (1 - (ur - h.t) / 0.6));
    // fissions: the target nucleus waits, flashes and splits
    REACT.fis.forEach((f) => {
      if (ur > f.t - 2.5 && ur < f.t) ball(g, X(f.x), Y(f.y), Math.max(3.5, u * 0.18), '220,170,50', '255,240,170', a * smooth((ur - f.t + 2.5) / 0.5));
      const d = ur - f.t;
      if (d >= 0 && d < 1.2) {
        D.glowDot(s, X(f.x), Y(f.y), u * (0.6 + 1.6 * (1 - d / 1.2)), '255,235,190', a * (1 - d / 1.2));
        const sp = u * 0.4 * smooth(d / 0.6);
        ball(g, X(f.x), Y(f.y) - sp, Math.max(2.5, u * 0.13), BA_RGB, '255,220,230', a * (1 - d / 1.2));
        ball(g, X(f.x), Y(f.y) + sp, Math.max(2.2, u * 0.11), KR_RGB, '210,250,255', a * (1 - d / 1.2));
      }
    });
    // neutrons along their paths; fast ones with a long streak
    for (const p of REACT.paths) {
      const sg = p.segs.find((q) => ur >= q.t0 && ur < q.t1);
      if (!sg) { const last = p.segs[p.segs.length - 1]; if (p.kind === 'absorb' && ur >= last.t1 && ur < last.t1 + 0.5) D.glowDot(s, X(last.b[0]), Y(last.b[1]), u * 0.5, '200,200,220', a * (1 - (ur - last.t1) / 0.5)); continue; }
      const f = (ur - sg.t0) / (sg.t1 - sg.t0), x = lerp(sg.a[0], sg.b[0], f), y = lerp(sg.a[1], sg.b[1], f);
      const L0 = Math.hypot(sg.b[0] - sg.a[0], sg.b[1] - sg.a[1]) || 1, vx = (sg.b[0] - sg.a[0]) / L0 * sg.v, vy = (sg.b[1] - sg.a[1]) / L0 * sg.v;
      const back = Math.min(0.12, f * (sg.t1 - sg.t0));
      if (y < -4.7 && p.kind === 'lost') { const la = a * (1 - smooth((-y - 4.7) / 1.2)); neutronDot(s, X(x), Y(y), vx * u, -vy * u, la, back); continue; }
      neutronDot(s, X(x), Y(y), vx * u, -vy * u, a, back);
    }
    // labels
    const la = a * fade(t, T4 + 0.8, END_CARD, 0.8, 0.6);
    label(s, 'fuel rods', X(-4.6), Y(-4.6) + fs * 1.3, la, FUEL, 'left', fs, 600);
    label(s, 'control rods', X(CX[1]), Y(5.8) - fs * 0.9, la, '200,205,225', 'center', fs, 600);
    if (L.phone) label(s, 'water (moderator)', X(4.6), Y(-4.6) + fs * 1.3, la, H_RGB, 'right', fs, 600);
    else { label(s, 'water:', X(4.6) + fs * 0.6, Y(0) - fs * 0.7, la, H_RGB, 'left', fs, 600); label(s, 'the moderator', X(4.6) + fs * 0.6, Y(0) + fs * 0.7, la, H_RGB, 'left', fs, 600); }
    // the rate graph
    const ga = a * smooth((t - T_RATE) / 0.8);
    if (ga > 0) {
      const { x0, x1, y0, y1 } = L.p4.chart;
      g.fillStyle = `rgba(14,20,44,${0.7 * ga})`; g.beginPath(); g.roundRect(x0 - 10, y0 - fs * 2.8, x1 - x0 + 20, y1 - y0 + fs * 5, 10); g.fill();
      label(s, 'rate of fission (schematic)', x0, y0 - fs * 1.4, ga, U_RGB, 'left', fs, 600);
      const XR = (tt) => x0 + (tt - M_RATE) / (M_END - M_RATE) * (x1 - x0), YR = (r) => y1 - (r - 0.9) / 0.5 * (y1 - y0);
      D.line(s, x0, y1, x1, y1, C.muted, 0.6 * ga); D.line(s, x0, y1, x0, y0, C.muted, 0.6 * ga);
      D.line(s, x0, YR(1), x1, YR(1), C.muted, 0.35 * ga, 1, [4, 4]);
      label(s, 'time', x1, y1 + fs * 1.0, ga * 0.8, C.muted, 'right', fs - 1);
      const pts = []; for (let tt = M_RATE; tt <= Math.min(ur, M_END); tt += 0.1) pts.push([XR(tt), YR(rateAt(tt))]);
      D.glowLine(s, pts, U_RGB, ga, 2);
      const st = tip > TIP0 + 0.05 ? 'control rods raised' : tip < TIP0 - 0.05 ? 'control rods lowered' : 'control rods set';
      label(s, st, x0, y1 + fs * 1.0, ga * 0.9, '200,205,225', 'left', fs - 1);
    }
  }

  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 30, 18, 36)), s2 = Math.round(clamp(W / 52, 13, 19)), s3 = Math.round(clamp(W / 62, 11, 16));
    g.font = D.sans(s1, 300);
    D.text(s, D.wrap(s, 'Fission and the chain reaction', W - 40), W / 2, H * (phone ? 0.09 : 0.12), s1, a, D.sans(s1, 300));
    const items = [
      ['Fission', U_RGB, 'A heavy nucleus absorbs a neutron and splits into two fragments and 2 or 3 neutrons, releasing about 200 MeV.'],
      ['Chain reaction', N_RGB, 'The neutrons from one fission cause more fissions.'],
      ['Critical mass', BA_RGB, 'The minimum mass of fuel for a self-sustaining chain reaction: in a small lump too many neutrons escape.'],
      ['In a reactor', KR_RGB, 'The moderator slows the neutrons, control rods absorb some of them so the rate stays steady, and the coolant carries the thermal energy away.'],
    ];
    if (phone) {
      let y = H * 0.2;
      for (const [h, rgb, txt] of items) {
        D.text(s, h, W / 2, y, s2, a, D.sans(s2, 600), rgb); y += s2 * 1.3;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 36); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.9;
      }
    } else {
      const colW = Math.min(W * 0.38, 440);
      g.font = D.sans(s3);
      const wr = items.map((it) => D.wrap(s, it[2], colW));
      const y1 = H * 0.3, y2 = Math.max(H * 0.56, y1 + s2 * 1.6 + s3 * 1.3 * Math.max(wr[0].length, wr[1].length) + s2 * 1.4);
      items.forEach(([h, rgb], i) => {
        const x = W / 2 + (i % 2 ? 1 : -1) * W * 0.23, y = i < 2 ? y1 : y2;
        D.text(s, h, x, y, s2, a, D.sans(s2, 600), rgb);
        D.text(s, wr[i], x, y + s2 * 1.5, s3, 0.85 * a, D.sans(s3));
      });
    }
    g.font = D.sans(s3 - 1);
    D.text(s, D.wrap(s, 'Not to scale: a nucleus is about 10⁻¹⁴ m across, and everything is slowed down enormously.', W - 40), W / 2, H * (phone ? 0.92 : 0.86), s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('fission', {
    duration: DURATION_U,
    poster: realAt(18.5),
    // no pauses: see EXTRA near the top (the story waits while everything keeps moving)
    // score: building power (G-sharp minor, a dark saw pad that swells slowly, a low drone, a little wind)
    music: { chords: [[44, 51, 56, 59], [40, 47, 52, 56], [42, 49, 54, 57], [39, 46, 51, 54]], bar: 9, pad: 'saw', cutoff: 650, drone: 0.13, tremolo: 0.6, wind: 0.3, volume: 0.53 },
    resize: layout,
    // for checking the numbers (not used by the player)
    info: {
      CAPS, EXTRA, storyAt, realAt, NUC, BIG, SMALL, REACT, rateAt, tipAt, M_SPLIT, M_ABS, M2_GO, M3_GO, M_END,
      check() {
        const n = NUC.group.filter((x) => x === 1).length, ba = NUC.group.filter((x) => x === 0).length, kr = NUC.group.filter((x) => x === 2).length;
        const pBa = NUC.group.filter((x, i) => x === 0 && NUC.type[i] === 1).length, pKr = NUC.group.filter((x, i) => x === 2 && NUC.type[i] === 1).length;
        return {
          nucleons: [1 + 235, 141 + 92 + 3], protons: [92, 56 + 36], balls: { ba, kr, n, pBa, pKr },
          joules: 200e6 * 1.60e-19, fissionsPerSecond: 3.0e9 / (200e6 * 1.60e-19), massMeV: 0.186033 * 931.5,
          big: { total: BIG.total, by14: fissionsBy(BIG, 14), gens: genCounts(BIG, 99) }, small: { total: SMALL.total, nuclei: SMALL.N.length },
          rateEnd: rateAt(M_END - 0.1), ratePeak: Math.max(...RATE), reactorFissions: REACT.fis.length,
        };
      },
    },
    frame(s, u) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      const t = storyAt(u);
      D.background(s, 0.2);
      const a1 = fade(t, 4.4, P1_END, 0.6, 0.6), a2 = fade(t, T2, P2_END, 0.8, 0.6), a3 = fade(t, T3, P3_END, 0.8, 0.6), a4 = fade(t, T4, END_CARD + 0.6, 0.8, 0.6);
      part1(s, t, a1, u);
      if (a2 > 0) { const { cx, cy, u: k, chart } = L.p2; drawLump(s, BIG, u - M2_GO, cx, cy, k, a2); genChart(s, BIG, u - M2_GO, chart, a2 * smooth((t - 50.8) / 0.8)); }
      if (a3 > 0) {
        const { u: k, small, big } = L.p3, tt = u - M3_GO, fs = L.fs;
        drawLump(s, SMALL, tt, small[0], small[1], k, a3);
        drawLump(s, BIG, tt, big[0], big[1], k, a3);
        const ns = fissionsBy(SMALL, tt), nb = fissionsBy(BIG, tt);
        const lastS = Math.max(...SMALL.tf.filter(Number.isFinite)), recentB = nb - fissionsBy(BIG, tt - 1.5);
        const ys = L.phone ? small[1] + 1.6 * k + fs * 1.5 : small[1] + 8 * k + fs * 1.6, yb = big[1] + 8 * k + fs * 1.6;
        const pill = (x, y, lines) => {                                   // a dark backing, so escaping neutrons can't hide the labels
          const { g } = s; g.font = D.sans(fs, 600);
          const w = Math.max(...lines.map((q) => g.measureText(q).width)) + fs * 1.2;
          g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(4,6,13,${0.8 * a3})`;
          g.beginPath(); g.roundRect(x - w / 2, y - fs * 0.9, w, fs * (1.3 * lines.length + 0.5), 6); g.fill();
        };
        pill(small[0], ys, [`small lump · fissions: ${ns}`, 'the chain died out']);
        pill(big[0], yb, [`big lump · fissions: ${nb}`, 'nearly every nucleus has split']);
        label(s, `small lump · fissions: ${ns}`, small[0], ys, a3, C.text, 'center', fs, 600);
        label(s, `big lump · fissions: ${nb}`, big[0], yb, a3, C.text, 'center', fs, 600);
        label(s, 'the chain died out', small[0], ys + fs * 1.3, a3 * smooth((tt - lastS - 2) / 0.6), BA_RGB, 'center', fs);
        label(s, recentB > 0 ? 'the chain keeps going' : 'nearly every nucleus has split', big[0], yb + fs * 1.3, a3 * smooth((tt - 6) / 0.6), U_RGB, 'center', fs);
      }
      part4(s, t, a4, u);
      const leg = t < P1_END ? [['dot', PROT, 'proton'], ['dot', NEUT_HI, 'neutron']]
        : t < T4 ? [['dot', '230,180,60', 'uranium-235 nucleus'], ['dot', N_RGB, 'neutron'], ['dot', BA_RGB, 'fission fragments']]
          : [['dot', '230,180,60', 'uranium-235 (uranium-238 not drawn)'], ['dot', N_RGB, 'neutron (streak: fast)'], ['dot', H_RGB, 'light nucleus (hydrogen)']];
      D.legend(s, leg, (t < P1_END ? a1 : t < T3 ? a2 : t < T4 ? a3 : a4) * (t > 4.6 ? 1 : 0));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Fission and the chain reaction', 'How splitting uranium nuclei releases energy');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
