/* B.4 (HL) The first law and heat engines on a p–V diagram. A gas in a cylinder with a frictionless piston beside a
   live p–V diagram: an isobaric expansion, then isovolumetric, isothermal and adiabatic changes from the same state A,
   then a Carnot cycle between 500 K and 300 K. Sign convention as in the notes (Clausius): Q = ΔU + W, with Q the
   thermal energy supplied to the gas and W the work done BY the gas.
   Units inside the scene: P in 10⁵ Pa, V in 10⁻³ m³, so PV is in units of 100 J.
   The gas: n = 200 ÷ (8.31 × 300) = 0.0802 mol ("0.080 mol") of an ideal monatomic gas, so nR = 2/3 J K⁻¹ exactly.
   Numbers (all recalculated; R = 8.31 J K⁻¹ mol⁻¹ from the data booklet):
   - State A: P = 1.0 × 10⁵ Pa, V = 2.0 × 10⁻³ m³: PV = 200 J, T = PV ÷ nR = 200 ÷ (2/3) = 300 K.
   - Isobaric A → B (V to 5.0 × 10⁻³ m³): W = PΔV = 1.0 × 10⁵ × 3.0 × 10⁻³ = 300 J; ΔU = 3/2 Δ(PV) = 1.5 × (500 − 200)
     = 450 J; Q = ΔU + W = 750 J; T_B = 500 ÷ (2/3) = 750 K.
   - Isovolumetric from A (P to 2.0 × 10⁵ Pa): W = 0; Q = ΔU = 1.5 × (400 − 200) = 300 J; T = 600 K (doubles).
   - Isothermal from A (V to 4.0 × 10⁻³ m³ at 300 K): P halves to 0.50 × 10⁵ Pa; ΔU = 0; Q = W = area = 200 ln 2 = 138.6 J
     ("139 J"; the formula nRT ln(V₂/V₁) is not needed, the notes give the area idea).
   - Adiabatic from A (V to 4.0 × 10⁻³ m³): P = 1.0 × 0.5^(5/3) = 0.315 × 10⁵ Pa; PV = 126.0 J; T = 126.0 ÷ (2/3) = 189 K
     ("about 190 K"); ΔU = 1.5 × (126.0 − 200) = −111.0 J; W = −ΔU = 111 J; Q = 0.
   - Carnot, T_h = 500 K, T_c = 300 K: state 1 V = 2.0, P = (2/3) × 500 ÷ 2.0 × 10⁻³ = 1.67 × 10⁵ Pa; state 2 V = 4.0,
     P = 0.833; state 3 V = 4.0 × (5/3)^1.5 = 8.61, P = 0.232; state 4 V = 2.0 × (5/3)^1.5 = 4.30, P = 0.465
     (adiabats: T V^(2/3) constant, so V grows by (T_h/T_c)^(3/2)).
     Q_h = (2/3) × 500 × ln 2 = 231.0 J; adiabatic stages: |W| = |ΔU| = 1.5 × (2/3) × 200 = 200 J;
     Q_c = (2/3) × 300 × ln 2 = 138.6 J ("139 J"); net W = 231.0 − 138.6 = 92.4 J ("92 J" = 231 − 139);
     efficiency = 92.4 ÷ 231.0 = 0.400; Carnot: 1 − 300 ÷ 500 = 0.40 (the same, as it must be).
   Each stage's first law balances: isobaric 750 = 450 + 300; isovolumetric 300 = 300 + 0; isothermal 139 = 0 + 139;
   adiabatic 0 = −111 + 111; Carnot 1→2 231 = 0 + 231; 2→3 0 = −200 + 200; 3→4 −139 = 0 − 139; 4→1 0 = 200 − 200.
   The particles (40, seeded) are drawn hugely enlarged; their speeds are proportional to √T, as for a real gas. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const NB = ' ';
  const nb = (s) => s.replace(/~/g, NB);

  // ---------- the gas ----------
  const nR = 2 / 3;                                   // J K⁻¹  (n = 0.0802 mol)
  const TofPV = (P, V) => (100 * P * V) / nR;         // P in 10⁵ Pa, V in 10⁻³ m³
  const K = Math.pow(5 / 3, 1.5);                     // (T_h/T_c)^(3/2)
  const Ph = (nR * 500) / 2e-3 / 1e5;                // 1.667
  const ST = { 1: { V: 2.0, P: Ph }, 2: { V: 4.0, P: Ph / 2 }, 3: { V: 4.0 * K, P: (nR * 300) / (4.0 * K * 1e-3) / 1e5 }, 4: { V: 2.0 * K, P: (nR * 300) / (2.0 * K * 1e-3) / 1e5 } };
  const A = { P: 1.0, V: 2.0 };

  // ---------- timeline ----------
  // acts: the gas jumps back to its starting state at the start of each act (with a quick dip to dark)
  const ACTS = [0, 45.5, 58.2, 71.9, 91.5];
  const SEG = [
    { t0: 23.0, t1: 29.0, type: 'isobaric', P0: 1.0, V0: 2.0, V1: 5.0, heat: 'heater', name: 'isobaric' },
    { t0: 47.0, t1: 52.0, type: 'isochoric', P0: 1.0, V0: 2.0, P1: 2.0, heat: 'heater', lock: true, name: 'isovolumetric' },
    { t0: 59.8, t1: 65.0, type: 'isothermal', P0: 1.0, V0: 2.0, V1: 4.0, heat: 'bath', name: 'isothermal' },
    { t0: 73.4, t1: 78.6, type: 'adiabatic', P0: 1.0, V0: 2.0, V1: 4.0, heat: 'insulated', name: 'adiabatic' },
    { t0: 97.8, t1: 103.2, type: 'isothermal', P0: ST[1].P, V0: ST[1].V, V1: ST[2].V, heat: 'hot', name: '1 → 2', cyc: 1 },
    { t0: 103.4, t1: 108.6, type: 'adiabatic', P0: ST[2].P, V0: ST[2].V, V1: ST[3].V, heat: 'insulated', name: '2 → 3', cyc: 2 },
    { t0: 108.8, t1: 114.4, type: 'isothermal', P0: ST[3].P, V0: ST[3].V, V1: ST[4].V, heat: 'cold', name: '3 → 4', cyc: 3 },
    { t0: 114.6, t1: 119.6, type: 'adiabatic', P0: ST[4].P, V0: ST[4].V, V1: ST[1].V, heat: 'insulated', name: '4 → 1', cyc: 4 },
  ];
  const LOOP0 = 125.8, LOOP_A = SEG[4].t0, LOOP_P = SEG[7].t1 - SEG[4].t0 + 0.2;   // the cycle repeats from 125.8 s
  const END_CARD = 155.6, STORY_END = 170;            // story seconds (see story() below)
  const cycleTime = (t) => (t >= LOOP0 ? LOOP_A + ((t - LOOP0) % LOOP_P) : t);

  function along(sg, s) {                             // state at fraction s of a segment
    if (sg.type === 'isochoric') return { V: sg.V0, P: lerp(sg.P0, sg.P1, s) };
    const V = lerp(sg.V0, sg.V1, s);
    if (sg.type === 'isobaric') return { V, P: sg.P0 };
    if (sg.type === 'isothermal') return { V, P: (sg.P0 * sg.V0) / V };
    return { V, P: sg.P0 * Math.pow(sg.V0 / V, 5 / 3) };
  }
  // energy for a segment so far (joules): Q = ΔU + W, W done BY the gas
  function energy(sg, st) {
    const pv0 = 100 * sg.P0 * sg.V0, pv = 100 * st.P * st.V;
    const dU = 1.5 * (pv - pv0);
    let W = 0;
    if (sg.type === 'isobaric') W = 100 * sg.P0 * (st.V - sg.V0);
    else if (sg.type === 'isothermal') W = pv0 * Math.log(st.V / sg.V0);
    else if (sg.type === 'adiabatic') W = -dU;
    return { Q: dU + W, dU, W };
  }
  const actOf = (t) => { let a = 0; for (let i = 0; i < ACTS.length; i++) if (t >= ACTS[i]) a = i; return a; };
  const SEGS_OF_ACT = [[0], [1], [2], [3], [4, 5, 6, 7]];
  const START_OF_ACT = [A, A, A, A, ST[1]];
  // the state at scene time t, with the segment that is (or was last) running in this act
  function stateAt(t) {
    const act = actOf(t), tc = act === 4 ? cycleTime(t) : t;
    let st = START_OF_ACT[act], sg = null, s = 0, running = false;
    for (const i of SEGS_OF_ACT[act]) {
      const g = SEG[i];
      if (tc < g.t0) break;
      sg = g; s = smooth((tc - g.t0) / (g.t1 - g.t0)); st = along(g, s); running = tc < g.t1;
    }
    return { act, P: st.P, V: st.V, T: TofPV(st.P, st.V), sg, s, running, tc };
  }

  // ---------- particles: speeds ∝ √T, from two precomputed "clocks" (so every frame depends on t alone) ----------
  // The particles run on screen seconds (they never slow down); the gas's state comes from story seconds.
  const DT = 0.02, NP = 40;
  let seed = 4142;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const PART = Array.from({ length: NP }, () => ({ ax: rnd(), ay: rnd(), vx: 0.25 + 0.5 * rnd(), vy: 0.25 + 0.5 * rnd(), sx: rnd() < 0.5 ? -1 : 1, sy: rnd() < 0.5 ? -1 : 1 }));
  let CLK = null, NS = 0;
  const clocks = () => {
    if (CLK) return CLK;
    NS = Math.ceil(DURATION / DT) + 2;
    const tx = new Float64Array(NS), ty = new Float64Array(NS);
    for (let k = 1; k < NS; k++) {
      const st = stateAt(story((k - 0.5) * DT)), sp = Math.sqrt(st.T / 300);
      tx[k] = tx[k - 1] + sp * DT * 2.0 / st.V;        // crossing the box takes longer when the box is wider
      ty[k] = ty[k - 1] + sp * DT;
    }
    return (CLK = { tx, ty });
  };
  const tri =(u) => { const w = ((u % 2) + 2) % 2; return w < 1 ? w : 2 - w; };

  // ---------- captions (holds worked out from their length: no faster than about 16 characters a second) ----------
  const CAPS = [
    [4.8, 10.6, 'A gas (0.080 mol, ideal and monatomic) is trapped in a cylinder by a frictionless piston. Its state is a point on the p–V diagram.'],
    [10.8, 16.2, 'State A: P = 1.0~×~10⁵~Pa and V = 2.0~×~10⁻³~m³, so T = PV~÷~nR = 300~K.'],
    [16.4, 22.6, 'The first law: Q = ΔU + W. Q is the energy supplied to the gas by heating, and W is the work done by the gas.'],
    [22.8, 28.0, 'Heat it gently at constant pressure (isobaric). The gas expands and pushes the piston out: it does work.'],
    [28.2, 33.6, 'Work done by the gas = the area under the graph: W = PΔV = 1.0~×~10⁵~×~3.0~×~10⁻³ = 300~J.'],
    [33.8, 39.4, 'It is hotter too (750~K), so its internal energy rose: ΔU = 3/2~Δ(PV) = 1.5~×~(500~−~200) = 450~J.'],
    [39.6, 44.6, 'So the energy supplied by heating was Q = ΔU + W = 450 + 300 = 750~J.'],
    [46.4, 51.8, 'Back at A. Lock the piston and heat the gas (isovolumetric). The volume can\'t change, so W = 0.'],
    [52.0, 57.4, 'All the heat becomes internal energy: Q = ΔU = 1.5~×~(400~−~200) = 300~J. The pressure and the temperature double.'],
    [59.2, 64.8, 'Back at A. Let it expand slowly in a water bath at 300~K (isothermal): its temperature stays the same.'],
    [65.0, 70.8, 'So ΔU = 0 and Q = W: all the heat taken in becomes work. The area under the curve is 139~J.'],
    [72.8, 78.4, 'Back at A. Insulate the cylinder and let it expand slowly (adiabatic): no heat flows in or out, so Q = 0.'],
    [78.6, 84.4, 'It does work using its own internal energy, so it cools, to about 190~K: ΔU = −W = −111~J.'],
    [84.6, 90.6, 'The adiabat is steeper than the isotherm through A: as the gas expands it also cools, so its pressure falls faster.'],
    [92.2, 97.4, 'A heat engine repeats a cycle. This is a Carnot cycle, between a hot reservoir at 500~K and a cold one at 300~K.'],
    [97.6, 103.2, '1~→~2: isothermal expansion at 500~K. The gas takes in 231~J from the hot reservoir and does 231~J of work.'],
    [103.4, 108.6, '2~→~3: insulated, it goes on expanding (adiabatic), doing 200~J of work and cooling to 300~K.'],
    [108.8, 114.4, '3~→~4: isothermal compression at 300~K. Work is done on the gas, and it gives out 139~J to the cold reservoir.'],
    [114.6, 119.6, '4~→~1: adiabatic compression. The 200~J of work done on the gas warms it back to 500~K.'],
    [119.8, 125.6, 'Predict: over one whole cycle, what is the change in the internal energy of the gas?'],
    [125.8, 131.4, 'Zero: it is back at 500~K. So the net work done equals the net heat taken in: W = 231~−~139 = 92~J.'],
    [131.6, 137.0, 'That net work is the area enclosed by the loop. Going round clockwise, the gas does more work than is done on it.'],
    [137.2, 142.8, 'Efficiency = useful work ÷ energy taken in = 92~÷~231 = 0.40, or 40%.'],
    [143.0, 149.0, 'This Carnot engine is the best possible: η = 1~−~300~÷~500 = 0.40. No engine between these two temperatures can do better.'],
    [149.2, 155.2, 'Real engines do less well, because of friction, turbulence and heat leaks. Why there is a limit at all: entropy.'],
  ].map(([a, b, s]) => [a, b, nb(s)]);

  // No pauses (teacher, 17 November 2026): one second on screen is one second of the animation, with no hold. Each step
  // (from one caption to the next) gets enough extra time to read its caption at no more than 16 characters a second
  // (and 6 s more to think after "Predict"), and its process on the p–V diagram simply runs that much longer: a slow,
  // quasi-static change has no natural speed. The particles keep moving at their own speed all the time.
  const READ = CAPS.map(([a, b, s]) => {
    const need = Math.max(0, s.length / 16 + 0.6 - (b - a));
    return [b - 0.8, +(s.startsWith('Predict') ? 6 + need : need).toFixed(1)];
  }).filter((h) => h[1] > 0.05);
  const onScreen = (u) => u + READ.filter((h) => h[0] < u).reduce((n, h) => n + h[1], 0);
  const KNOTS = [[0, 0], ...CAPS.map((c) => [onScreen(c[0]), c[0]]), [onScreen(STORY_END), STORY_END]];
  function story(t) {                                 // screen seconds → story seconds
    if (t <= 0) return t;
    for (let i = 1; i < KNOTS.length; i++) {
      const [t0, u0] = KNOTS[i - 1], [t1, u1] = KNOTS[i];
      if (t <= t1) return u0 + (u1 - u0) * (t - t0) / (t1 - t0);
    }
    return STORY_END;
  }
  const CAPS_SCREEN = CAPS.map(([a, b, s]) => [onScreen(a), onScreen(b), s]);
  const DURATION = onScreen(STORY_END);
  const clock = (arr, t) => { const f = clamp(t / DT, 0, NS - 1.001), k = Math.floor(f); return lerp(arr[k], arr[k + 1], f - k); };

  // ---------- colours ----------
  const HEAT = '255,140,80', COLD = C.neg, DU = C.field, WK = C.good, PATH = '200,215,255', ISO_T = '90,215,200', ADIA = '190,150,255';
  const GAS = '143,184,255';

  // text made of pieces: [text, style], 'i' italic, 's' subscript, 'p' superscript (italic), 'r' upright serif, 'sans'
  function rich(s, parts, x, y, size, a, rgb = C.text, align = 'center') {
    const { g } = s; if (a <= 0) return 0;
    const font = (st) => st === 'u' ? D.serif(Math.round(size * 0.7), false) : st === 's' || st === 'p' ? D.serif(Math.round(size * 0.7)) : st === 'i' ? D.serif(size) : st === 'r' ? D.serif(size, false) : D.sans(Math.round(size * 0.9));
    const ws = parts.map(([tx, st]) => { g.font = font(st); return g.measureText(tx).width; });
    const total = ws.reduce((p, q) => p + q, 0);
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 8; g.fillStyle = `rgba(${rgb},${a})`;
    parts.forEach(([tx, st], i) => { g.font = font(st); g.fillText(tx, px, st === 's' || st === 'u' ? y + size * 0.28 : st === 'p' ? y - size * 0.38 : y); px += ws[i]; });
    g.shadowBlur = 0;
    return total;
  }

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25));
    const capTop = H - capFs * (phone ? 6.6 : 5.4);
    const fs = phone ? 10 : Math.round(clamp(W / 80, 11, 16));
    let o;
    if (!phone) {
      const lx0 = W * 0.04, lx1 = W * 0.48, ry = Math.max(fs * 1.4, H * 0.07), ry2 = ry + fs * 1.3, wy = ry2 + fs * 1.4;
      const cy0 = wy + fs * 1.0, ch = clamp(H * 0.15, 34, 130), cy1 = cy0 + ch;
      const gx0 = W * 0.585, gx1 = W * 0.965, gy0 = Math.max(66, H * 0.15), gy1 = capTop - fs * 3.0;
      o = { lx0, lx1, ry, ry2, wy, cy0, cy1, ch, hz0: cy1 + fs * 0.4, hz1: cy1 + fs * 2.4, ep0: cy1 + fs * 3.6, ep1: capTop - fs * 0.6, gx0, gx1, gy0, gy1 };
    } else {
      const lx0 = 8, lx1 = W - 8, ry = fs * 1.2, ry2 = ry + fs * 1.25, wy = ry2 + fs * 1.3;
      const cy0 = wy + fs * 0.9, ch = clamp(H * 0.09, 26, 60), cy1 = cy0 + ch;
      const gy0 = cy1 + fs * 4.2, gy1 = gy0 + (capTop - gy0) * 0.52;
      o = { lx0, lx1, ry, ry2, wy, cy0, cy1, ch, hz0: cy1 + fs * 0.3, hz1: cy1 + fs * 1.8, gx0: W * 0.16, gx1: W - 14, gy0, gy1, ep0: gy1 + fs * 3.0, ep1: capTop - 2 };
    }
    // the cylinder: inside left wall at wx, 9.4 units of volume fit before the right edge (piston and rod)
    o.wx = o.lx0 + fs * 0.8; o.kx = (o.lx1 - o.wx - fs * 1.6) / 9.2;
    L = { W, H, phone, fs, capFs, capTop, ...o,
      X: (V) => o.gx0 + (V / 9.4) * (o.gx1 - o.gx0),
      Y: (P) => o.gy1 - (P / 2.25) * (o.gy1 - o.gy0) };
  }

  // a dip to dark at each act change (the gas is put back in its starting state)
  const dipAt = (t) => { let d = 0; for (let i = 1; i < ACTS.length; i++) d = Math.max(d, 1 - smooth(Math.abs(t - ACTS[i]) / 0.6)); return d; };

  // ---------- the cylinder ----------
  function drawCylinder(s, t, st) {
    const { g } = s, { fs, cy0, cy1, ch, wx, kx, phone } = L;
    const px = wx + st.V * kx, sg = st.sg, act = st.act;
    const heat = sg ? sg.heat : (act === 4 ? 'hot' : null), active = st.running;
    // surroundings: water bath, insulation or a reservoir block
    if (heat === 'bath') {
      g.fillStyle = 'rgba(60,120,200,0.22)'; g.fillRect(wx - fs * 0.7, cy0 - fs * 0.5, px - wx + fs * 1.0, ch + fs * 1.0);
      D.text(s, 'water bath at 300 K', wx + 9.2 * kx, L.hz0 + fs * 0.9, fs - 1, 0.85, D.sans(fs - 1), '150,190,255', 'right');
    }
    if (heat === 'insulated') {
      g.save(); g.strokeStyle = 'rgba(200,205,220,0.45)'; g.lineWidth = 1;
      for (let x = wx - fs * 0.6; x < wx + 9.2 * kx; x += fs * 0.55) {
        g.beginPath(); g.moveTo(x, cy1 + fs * 0.55); g.lineTo(x + fs * 0.45, cy1 + fs * 0.1); g.stroke();
        g.beginPath(); g.moveTo(x, cy0 - fs * 0.1); g.lineTo(x + fs * 0.45, cy0 - fs * 0.55); g.stroke();
      }
      g.restore();
      D.text(s, 'insulated: no heat flows', wx + 9.2 * kx, L.hz0 + fs * 1.2, fs - 1, 0.85, D.sans(fs - 1), C.muted, 'right');
    }
    if (heat === 'hot' || heat === 'cold') {
      const hot = heat === 'hot', rgb = hot ? '255,110,80' : '90,170,255';
      const bx1 = wx + 9.2 * kx;
      g.fillStyle = `rgba(${rgb},0.28)`; g.fillRect(wx - fs * 0.3, L.hz0, bx1 - wx + fs * 0.3, L.hz1 - L.hz0);
      D.text(s, hot ? 'hot reservoir, 500 K' : 'cold reservoir, 300 K', bx1 - 4, (L.hz0 + L.hz1) / 2, fs - 1, 0.95, D.sans(fs - 1, 600), hot ? '255,190,160' : '180,215,255', 'right');
    }
    if (heat === 'heater' && active) {
      const pts = []; const x1 = wx + st.V * kx;
      for (let i = 0; i <= 80; i++) { const xx = lerp(wx, x1, i / 80); pts.push([xx, L.hz0 + fs * 0.5 + Math.sin(i * 1.3) * fs * 0.25]); }
      D.glowLine(s, pts, HEAT, 0.9, 1.4);
      D.text(s, 'heater on', wx + 9.2 * kx, L.hz0 + fs * 1.0, fs - 1, 0.85, D.sans(fs - 1), HEAT, 'right');
    }
    // the cylinder walls (left end closed)
    const cx1 = wx + 9.2 * kx + fs * 0.3;
    g.fillStyle = 'rgba(30,40,80,0.55)'; g.fillRect(wx, cy0, px - wx, ch);
    D.line(s, wx, cy0, cx1, cy0, '170,182,230', 0.8, 2);
    D.line(s, wx, cy1, cx1, cy1, '170,182,230', 0.8, 2);
    D.line(s, wx, cy0, wx, cy1, '170,182,230', 0.8, 3);
    // particles
    const K = clocks(), tx = clock(K.tx, t), ty = clock(K.ty, t), r = Math.max(2, ch * 0.035);   // t: screen seconds
    for (const p of PART) {
      const x = wx + r + (px - wx - 2 * r) * tri(p.ax * 2 + p.sx * p.vx * tx);
      const y = cy0 + r + (ch - 2 * r) * tri(p.ay * 2 + p.sy * p.vy * ty * 1.6);
      D.glowDot(s, x, y, r * 3, GAS, 0.8);
    }
    // the piston and its rod
    const pw = Math.max(5, kx * 0.22);
    g.fillStyle = 'rgba(150,160,200,0.95)'; g.fillRect(px, cy0 + 1, pw, ch - 2);
    D.line(s, px + pw, cy0 + ch / 2, Math.min(px + pw + kx * 0.9, cx1 + fs), cy0 + ch / 2, '150,160,200', 0.95, Math.max(3, ch * 0.08));
    if (sg && sg.lock && act === 1) {
      D.line(s, px + pw / 2, cy0 - fs * 0.5, px + pw / 2, cy0 + fs * 0.3, '255,214,102', 0.95, 3);
      D.text(s, 'piston locked', px + pw + fs * 0.5, cy0 - fs * 0.4, fs - 1, 0.9, D.sans(fs - 1), C.light, 'left');
    }
    // energy arrows while a process runs: heat in (up) or out (down), work by the gas (right) or on it (left)
    if (active && sg) {
      const midx = (wx + px) / 2;
      if (sg.heat !== 'insulated') {
        const dQ = sg.type === 'isothermal' ? Math.sign(sg.V1 - sg.V0) : 1;
        const len = fs * 1.6;
        if (dQ > 0) D.arrow(s, midx, cy1 + len + fs * 0.2, midx, cy1 - fs * 0.2, HEAT, 0.95, '', { head: 8, width: 2.6 });
        else D.arrow(s, midx, cy1 - fs * 0.2, midx, cy1 + len + fs * 0.2, COLD, 0.95, '', { head: 8, width: 2.6 });
        const qs = sg.cyc === 1 ? [['Q', 'i'], ['h', 's']] : sg.cyc === 3 ? [['Q', 'i'], ['c', 's']] : [['Q', 'i']];
        rich(s, qs, midx + fs * 0.9, cy1 + fs * 1.0, fs + 2, 0.95, dQ > 0 ? HEAT : COLD, 'left');
      }
      if (sg.type !== 'isochoric') {
        const dir = Math.sign(sg.V1 - sg.V0), ay = L.wy, len = fs * 2.2;
        D.arrow(s, px + (dir > 0 ? 0 : len), ay, px + (dir > 0 ? len : 0), ay, WK, 0.95, '', { head: 8, width: 2.6 });
        const wl = dir > 0 ? 'work done by the gas' : 'work done on the gas';
        g.font = D.sans(fs - 1);
        const fitsRight = px + len + fs * 0.4 + g.measureText(wl).width <= L.lx1;
        D.text(s, wl, fitsRight ? px + len + fs * 0.4 : px - fs * 0.4, ay, fs - 1, 0.9, D.sans(fs - 1), WK, fitsRight ? 'left' : 'right');
      }
    }
    // readout: temperature, pressure, volume
    const l1 = [['T', 'i'], [` = ${Math.round(st.T)} K      `, 'sans'], ['P', 'i'], [` = ${(st.P).toFixed(2)} × 10`, 'sans'], ['5', 'p'], [' Pa', 'sans']];
    const l2 = [['V', 'i'], [` = ${(st.V).toFixed(2)} × 10`, 'sans'], ['−3', 'p'], [' m', 'sans'], ['3', 'p']];
    rich(s, l1, L.lx0, L.ry, fs + 1, 0.95, C.text, 'left');
    rich(s, l2, L.lx0, L.ry2, fs + 1, 0.95, C.text, 'left');
  }

  // ---------- the p–V diagram ----------
  function curve(sg, s0, s1, n = 60) { const pts = []; for (let i = 0; i <= n; i++) { const st = along(sg, lerp(s0, s1, i / n)); pts.push([L.X(st.V), L.Y(st.P)]); } return pts; }
  function shade(pts, rgb, a) {
    if (a <= 0 || pts.length < 2) return;
    const { g } = s0; g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(${rgb},${0.22 * a})`; g.beginPath();
    g.moveTo(pts[0][0], L.Y(0)); for (const [x, y] of pts) g.lineTo(x, y); g.lineTo(pts[pts.length - 1][0], L.Y(0)); g.closePath(); g.fill();
  }
  let s0 = null;
  function drawGraph(s, t, st) {
    const { g } = s, { fs, gx0, gx1, gy0, gy1, X, Y, phone } = L;
    s0 = s;
    g.fillStyle = 'rgba(14,20,44,0.6)'; g.beginPath(); g.roundRect(gx0 - fs * 3.2, gy0 - fs * 1.8, gx1 - gx0 + fs * 3.8, gy1 - gy0 + fs * 4.2, 10); g.fill();
    // axes
    for (let P = 0.5; P <= 2.0; P += 0.5) { D.line(s, gx0, Y(P), gx1, Y(P), C.muted, 0.1, 1, [3, 4]); D.text(s, P.toFixed(1), gx0 - 5, Y(P), fs - 1, 0.75, D.sans(fs - 1), C.muted, 'right'); }
    for (let V = 1; V <= 9; V++) { D.line(s, X(V), gy1, X(V), gy1 + 4, C.muted, 0.6, 1); if (!phone || V % 2 === 1) D.text(s, String(V), X(V), gy1 + fs * 0.95, fs - 1, 0.75, D.sans(fs - 1), C.muted); }
    D.text(s, '0', gx0 - 5, gy1 + fs * 0.6, fs - 1, 0.6, D.sans(fs - 1), C.muted, 'right');
    D.line(s, gx0, gy1, gx0, gy0 - fs * 0.5, C.muted, 0.7, 1.3); D.line(s, gx0, gy1, gx1, gy1, C.muted, 0.7, 1.3);
    rich(s, [['P', 'i'], [' / 10', 'sans'], ['5', 'p'], [' Pa', 'sans']], gx0 - fs * 1.5, gy0 - fs * 1.0, fs, 0.85, C.muted, 'left');
    rich(s, [['V', 'i'], [' / 10', 'sans'], ['−3', 'p'], [' m', 'sans'], ['3', 'p']], (gx0 + gx1) / 2, gy1 + fs * 2.1, fs, 0.85, C.muted);
    const act = st.act;
    if (act < 4) {
      // the processes from A drawn so far (earlier ones faint), each with its shaded work area while it is discussed
      const label = (txt, x, y, rgb, al, align = 'left') => D.text(s, txt, x, y, fs, al, D.sans(fs, 600), rgb, align);
      for (let i = 0; i <= Math.min(act, 3); i++) {
        const sg = SEG[i]; if (t < sg.t0) continue;
        const sNow = i === act ? smooth((t - sg.t0) / (sg.t1 - sg.t0)) : 1, a = i === act ? 1 : 0.35;
        const rgb = sg.type === 'isothermal' ? ISO_T : sg.type === 'adiabatic' ? ADIA : PATH;
        const pts = curve(sg, 0, sNow);
        if (i === act) {
          const sa = i === 0 ? fade(t, 28.0, 45.2, 0.8, 0.5) : i === 2 ? fade(t, 65.0, 71.6, 0.8, 0.5) : i === 3 ? fade(t, 78.6, 91.3, 0.8, 0.5) : 0;
          shade(pts, WK, sa);
        }
        D.glowLine(s, pts, rgb, a, phone ? 1.6 : 2.0);
        const end = along(sg, 1);
        if (i === act && sNow > 0.9 && !(act === 3 && t > 84.4)) {
          const nm = sg.name, ex = X(end.V), ey = Y(end.P);
          if (sg.type === 'isochoric') label(nm, ex + fs * 0.6, (ey + Y(1)) / 2, rgb, a);
          else if (sg.type === 'isobaric') label(nm, (X(2) + ex) / 2, Y(1) - fs * 0.9, rgb, a, 'center');
          else label(nm, ex + fs * 0.5, ey - (sg.type === 'adiabatic' ? -fs * 0.8 : fs * 0.6), rgb, a);
        }
        if (i === 0 && sNow > 0.98) label('B', X(5) + fs * 0.4, Y(1) - fs * 0.7, C.text, 0.9);
      }
      // comparison: the whole isotherm and adiabat through A
      const ca = fade(t, 84.6, 91.2, 0.8, 0.5);
      if (ca > 0) {
        const iso = [], ad = [];
        for (let i = 0; i <= 60; i++) { const V = lerp(1.15, 9.0, i / 60); iso.push([X(V), Y(2 / V)]); ad.push([X(V), Y(Math.pow(2 / V, 5 / 3))]); }
        D.glowLine(s, iso.filter((p) => p[1] >= gy0 - 2), ISO_T, 0.8 * ca, 1.3);
        D.glowLine(s, ad.filter((p) => p[1] >= gy0 - 2), ADIA, 0.8 * ca, 1.3);
        rich(s, [['isotherm: ', 'sans'], ['PV', 'i'], [' = constant', 'sans']], X(7.0), Y(0.78), fs, ca, ISO_T);   // a small key in the empty top right, in each curve's colour
        rich(s, [['adiabat: ', 'sans'], ['PV', 'i'], ['5/3', 'p'], [' = constant', 'sans']], X(7.0), Y(0.78) + fs * 1.5, fs, ca, ADIA);
      }
      D.text(s, 'A', X(2) - fs * 0.6, Y(1) + fs * 0.7, fs, 0.9, D.sans(fs, 600), C.text, 'right');
    } else {
      // the Carnot cycle: faint full isotherms at 500 K and 300 K, the loop drawn as it is traced, then shaded
      const iso = (T) => { const pts = []; for (let i = 0; i <= 60; i++) { const V = lerp(1.4, 9.2, i / 60), P = (nR * T) / (V * 1e-3) / 1e5; if (P <= 2.2) pts.push([X(V), Y(P)]); } return pts; };
      D.glowLine(s, iso(500), '255,120,90', 0.25, 1);
      D.glowLine(s, iso(300), '90,170,255', 0.25, 1);
      D.text(s, '500 K', X(7.0), Y((nR * 500) / 7.0e-3 / 1e5) - fs * 0.7, fs - 1, 0.7, D.sans(fs - 1), '255,150,120', 'center');
      D.text(s, '300 K', X(7.0), Y((nR * 300) / 7.0e-3 / 1e5) + fs * 0.9, fs - 1, 0.7, D.sans(fs - 1), '130,190,255', 'center');
      const tc = st.tc, looped = t >= LOOP0;
      const loopPts = [];
      for (let i = 4; i <= 7; i++) loopPts.push(...curve(SEG[i], 0, 1, 40));
      const la = fade(t, 131.6, END_CARD + 0.4, 0.8, 0.6);
      if (la > 0) {
        g.fillStyle = `rgba(${WK},${0.25 * la})`; g.beginPath(); loopPts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
        D.line(s, X(6.2) - fs * 2, Y(1.35) + fs * 0.6, X(4.73), Y(0.53), WK, 0.6 * la, 1);   // into the loop (inside: 0.42 < P < 0.63 at V = 4.73)
        D.text(s, `net work = enclosed area = 92 J`, X(6.2), Y(1.35), fs, la, D.sans(fs, 600), WK);
      }
      for (let i = 4; i <= 7; i++) {
        const sg = SEG[i];
        if (!looped && tc < sg.t0) continue;
        const sNow = looped ? 1 : smooth((tc - sg.t0) / (sg.t1 - sg.t0));
        const rgb = sg.type === 'isothermal' ? (i === 4 ? '255,140,110' : '120,185,255') : ADIA;
        D.glowLine(s, curve(sg, 0, sNow), rgb, 1, phone ? 1.6 : 2.0);
      }
      const pl = (k, dx, dy) => D.text(s, String(k), X(ST[k].V) + dx * fs, Y(ST[k].P) + dy * fs, fs, 0.95, D.sans(fs, 600), C.text);
      pl(1, -0.7, -0.5); pl(2, 0.5, -0.7); pl(3, 0.4, 0.9); pl(4, -0.6, 0.9);
    }
    // the gas's state
    D.glowDot(s, X(st.V), Y(st.P), phone ? 12 : 16, C.light, 1);
  }

  // ---------- this process's energy: Q = ΔU + W, to scale ----------
  function drawEnergy(s, t, st) {
    const { g } = s, { fs, lx0, lx1, ep0, ep1, phone } = L, sg = st.sg;
    if (t >= LOOP0 - 0.2) { drawSankey(s, t); return; }
    if (!sg || st.act === 4 && t < SEG[4].t0) return;
    const e = energy(sg, st);
    g.fillStyle = 'rgba(14,20,44,0.6)'; g.beginPath(); g.roundRect(lx0 - 4, ep0 - 4, lx1 - lx0 + 8, ep1 - ep0 + 8, 10); g.fill();
    const head = phone ? `${sg.name}:` : `this process (${sg.name}):`;
    D.text(s, head, lx0 + 4, ep0 + fs * 0.6, fs - 1, 0.8, D.sans(fs - 1), C.muted, 'left');
    const r0 = (n) => (Math.abs(n) < 0.5 ? '0' : (n < 0 ? '−' : '') + Math.round(Math.abs(n)));
    const br = (n) => (n <= -0.5 ? `(${r0(n)} J)` : `${r0(n)} J`);
    rich(s, [['Q', 'i'], [' = ', 'r'], ['ΔU', 'i'], [' + ', 'r'], ['W', 'i'], [`:  ${r0(e.Q)} J = ${r0(e.dU)} J + ${br(e.W)}`, 'sans']], phone ? lx1 - 4 : lx0 + 4, phone ? ep0 + fs * 0.6 : ep0 + fs * 1.8, fs, 0.95, C.text, phone ? 'right' : 'left');
    const top = ep0 + fs * (phone ? 1.6 : 3.0), rowH = Math.min((ep1 - top) / 3, fs * 2.2), bh = Math.min(rowH * 0.55, 16);
    const labW = fs * 2.6, bx0 = lx0 + labW, bx1 = lx1 - fs * 3.4, zero = bx0 + (bx1 - bx0) * 0.3, k = (bx1 - zero) / 800;
    D.line(s, zero, top - 2, zero, top + rowH * 3 - (rowH - bh), C.muted, 0.5, 1);
    [['Q', e.Q, HEAT], ['ΔU', e.dU, DU], ['W', e.W, WK]].forEach(([lab, v, rgb], i) => {
      const y = top + i * rowH;
      rich(s, [[lab, 'i']], lx0 + 4, y + bh / 2, fs + 1, 0.95, rgb, 'left');
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(bx0, y, bx1 - bx0, bh);
      const w = v * k;
      if (Math.abs(w) > 0.5) { g.fillStyle = `rgba(${rgb},0.9)`; g.fillRect(Math.min(zero, zero + w), y, Math.abs(w), bh); }
      D.text(s, `${r0(v)} J`, zero + Math.max(w, 0) + 5, y + bh / 2, fs - 1, 0.9, D.sans(fs - 1), rgb, 'left');
    });
  }
  // the whole cycle's energy flow, widths to scale: 231 J in, 92 J of work, 139 J out
  function drawSankey(s, t) {
    const a = fade(t, LOOP0 - 0.2, END_CARD + 0.4, 0.8, 0.6); if (a <= 0) return;
    const { g } = s, { fs, lx0, lx1, ep0, ep1 } = L;
    g.fillStyle = `rgba(14,20,44,${0.6 * a})`; g.beginPath(); g.roundRect(lx0 - 4, ep0 - 4, lx1 - lx0 + 8, ep1 - ep0 + 8, 10); g.fill();
    D.text(s, 'one cycle, to scale', lx0 + 4, ep0 + fs * 0.6, fs - 1, 0.8 * a, D.sans(fs - 1), C.muted, 'left');
    const top = ep0 + fs * 1.6, hgt = ep1 - top - fs * 0.4, k = Math.min(hgt * 0.62, fs * 5) / 231;
    const hin = 231 * k, hw = 92 * k, hc = 139 * k;
    const x0 = lx0 + fs * 0.4, xe = lx0 + (lx1 - lx0) * 0.42, x1 = lx1 - fs * 0.3;
    const yIn = top + fs * 0.6;
    g.globalAlpha = a;
    g.fillStyle = `rgba(${HEAT},0.85)`; g.fillRect(x0, yIn, xe - x0, hin);
    g.fillStyle = `rgba(${WK},0.85)`; g.fillRect(xe, yIn, x1 - xe, hw);
    // the cold part bends down
    g.fillStyle = `rgba(${COLD},0.75)`; g.beginPath();
    g.moveTo(xe, yIn + hw); g.lineTo(xe + (x1 - xe) * 0.12, yIn + hw); g.lineTo(xe + (x1 - xe) * 0.3, yIn + hw + hc * 0.9); g.lineTo(x1, yIn + hw + hc * 0.9);
    g.lineTo(x1, yIn + hw + hc * 1.9); g.lineTo(xe + (x1 - xe) * 0.25, yIn + hw + hc * 1.9); g.lineTo(xe + (x1 - xe) * 0.06, yIn + hin); g.lineTo(xe, yIn + hin); g.closePath(); g.fill();
    g.globalAlpha = 1;
    rich(s, [['in from hot: ', 'sans'], ['Q', 'i'], ['h', 's'], [' = 231 J', 'sans']], x0 + 4, yIn + hin / 2, fs, a, '40,20,10', 'left');
    D.text(s, 'work: 92 J', x1 - 4, yIn + hw / 2, fs - 1, a, D.sans(fs - 1, 600), '10,40,20', 'right');
    rich(s, [['out to cold: ', 'sans'], ['Q', 'i'], ['c', 's'], [' = 139 J', 'sans']], x1 - 4, yIn + hw + hc * 1.4, fs, a, '5,25,45', 'right');
  }

  function endCard(s, t) {
    const a = fade(t, END_CARD, STORY_END - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 34)), s2 = Math.round(clamp(W / 36, 15, 28)), s3 = Math.round(clamp(W / 60, 11, 16));
    D.text(s, 'The first law and heat engines (HL)', W / 2, H * (phone ? 0.09 : 0.12), s1, a, D.sans(s1, 300));
    const items = [
      [[['Q', 'i'], [' = ', 'r'], ['ΔU', 'i'], [' + ', 'r'], ['W', 'i']], HEAT, 'Q supplied to the gas, W done by the gas.'],
      [[['W', 'i'], [' = ', 'r'], ['P', 'i'], ['ΔV', 'i']], WK, 'At constant pressure. In general: the area under the p–V graph.'],
      [[['ΔU', 'i'], [' = ', 'r'], ['3', 'r'], ['/', 'r'], ['2', 'r'], [' ', 'r'], ['nR', 'i'], ['Δ', 'r'], ['T', 'i']], DU, 'For an ideal monatomic gas.'],
      [[['η', 'i'], [' = ', 'r'], ['W', 'i'], [' / ', 'r'], ['Q', 'i'], ['h', 's']], C.text, 'Net work in a cycle = the area enclosed by the loop.'],
      [[['η', 'i'], ['Carnot', 'u'], [' = 1 − ', 'r'], ['T', 'i'], ['c', 's'], [' / ', 'r'], ['T', 'i'], ['h', 's']], C.light, 'The most efficient possible, between the two temperatures.'],
    ];
    let y = H * (phone ? 0.19 : 0.25);
    if (phone) {
      for (const [eq, rgb, txt] of items) {
        rich(s, eq, W / 2, y, s2, a, rgb); y += s2 * 1.0;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 40); D.text(s, ls, W / 2, y, s3, 0.75 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.45;
      }
    } else {
      const colW = W * 0.28;
      items.forEach(([eq, rgb, txt], i) => {
        const row = i < 3 ? 0 : 1, col = i < 3 ? i : i - 3;
        const x = row === 0 ? W / 2 + (col - 1) * W * 0.31 : W / 2 + (col - 0.5) * W * 0.36;
        const yy = y + row * (s2 * 1.2 + s3 * 4.2);
        rich(s, eq, x, yy, s2, a, rgb);
        g.font = D.sans(s3); D.text(s, D.wrap(s, txt, colW), x, yy + s2 * 1.05, s3, 0.75 * a, D.sans(s3));
      });
      y += 2 * (s2 * 1.2 + s3 * 4.2);
    }
    g.font = D.sans(s3 - 1);
    D.text(s, D.wrap(s, 'Isovolumetric: W = 0.  Isothermal: ΔU = 0.  Adiabatic: Q = 0.  Why no engine can reach 100%: entropy and the second law.', Math.min(W - 40, 760)), W / 2, Math.max(y, H * 0.8), s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('engine', {
    duration: DURATION,
    poster: onScreen(133),
    // score: a steady machine (E-flat minor, a triangle pad that swells slowly, like an engine turning over, a low drone, a breath of wind)
    music: { chords: [[51, 58, 63, 66], [47, 54, 59, 63], [44, 51, 56, 59], [46, 53, 58, 61]], bar: 9, pad: 'triangle', cutoff: 750, drone: 0.12, tremolo: 0.5, wind: 0.15, volume: 0.49 },
    resize: layout,
    // for checking the numbers (not used by the player)
    info: { SEG, ST, nR, energy, along, stateAt, CAPS: CAPS_SCREEN, story, onScreen, TofPV,
      check() {
        const out = {};
        const last = (i) => energy(SEG[i], along(SEG[i], 1));
        SEG.forEach((sg, i) => { const e = last(i), st = along(sg, 1); out[sg.name] = { Q: +e.Q.toFixed(2), dU: +e.dU.toFixed(2), W: +e.W.toFixed(2), T: +TofPV(st.P, st.V).toFixed(1), P: +st.P.toFixed(4), V: +st.V.toFixed(4) }; });
        const Qh = last(4).Q, Qc = -last(6).Q, Wnet = [4, 5, 6, 7].reduce((n, i) => n + last(i).W, 0);
        out.cycle = { Qh: +Qh.toFixed(2), Qc: +Qc.toFixed(2), Wnet: +Wnet.toFixed(2), eta: +(Wnet / Qh).toFixed(4), carnot: 1 - 300 / 500, dU: +[4, 5, 6, 7].reduce((n, i) => n + last(i).dU, 0).toFixed(6) };
        return out;
      } },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      const u = story(t), st = stateAt(u);               // u: story seconds, for the processes and the diagrams
      D.background(s, 0.2);
      const show = smooth((u - 4.4) / 0.8) * (1 - smooth((u - END_CARD) / 0.8));
      if (show > 0) {
        s.g.globalAlpha = 1;
        drawCylinder(s, t, st);                          // its particles move in screen seconds
        drawGraph(s, u, st);
        drawEnergy(s, u, st);
        const dip = dipAt(u);
        if (dip > 0) { s.g.fillStyle = `rgba(4,6,13,${0.85 * dip})`; s.g.fillRect(0, 0, s.W, L.capTop); }
      }
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.captions(s, t, CAPS_SCREEN);
      D.title(s, t, 0.4, 4.4, 'The first law and heat engines (HL)', 'A gas, a piston and the p–V diagram');
      endCard(s, u);
      D.vignette(s, t, DURATION);
    },
  });
})();
