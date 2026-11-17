/* E.1 Rutherford scattering: the Geiger–Marsden–Rutherford experiment, what it showed, why a tiny nucleus
   explains it, and (HL) the distance of closest approach and deviations at high energy.
   Physics (checked by info.check()):
   - Only the electric force acts; the gold nucleus (Z = 79, A = 197) does not recoil (197 ÷ 4 = 49 times the alpha's mass).
   - k(2e)(79e) = 8.99 × 10⁹ × (2 × 1.60 × 10⁻¹⁹) × (79 × 1.60 × 10⁻¹⁹) = 3.64 × 10⁻²⁶ J m.
   - Eₖ = 5.0 MeV = 5.0 × 10⁶ × 1.60 × 10⁻¹⁹ = 8.0 × 10⁻¹³ J.
   - Head-on closest approach d = 3.64 × 10⁻²⁶ ÷ 8.0 × 10⁻¹³ = 4.55 × 10⁻¹⁴ m (4.5 × 10⁻¹⁴ m), i.e. 45.5 fm.
   - R = R₀ ∛A = 1.20 × 10⁻¹⁵ × ∛197 = 1.20 × 10⁻¹⁵ × 5.82 = 6.98 × 10⁻¹⁵ m (7.0 × 10⁻¹⁵ m); d ÷ R = 6.5.
   - Energy to reach the surface: 3.64 × 10⁻²⁶ ÷ 6.98 × 10⁻¹⁵ = 5.21 × 10⁻¹² J = 32.5 MeV ("about 33 MeV").
   - Paths past one nucleus (part 3): integrated step by step (RK4) from the inverse-square repulsion, with the speed far
     away fixed by 5.0 MeV; acceleration = (d/2)v∞²/r² (from kQq/m = d v∞²/2). Each deflection agrees with the exact
     result tan(θ/2) = d/(2b) (b = how far off-centre it was aimed), which info.check() confirms:
     b = 105, 52, 26, 12, 5, 1.5 fm → θ = 24°, 47°, 82°, 124°, 155°, 172°.
   - The atom is mostly empty: a gold atom is about 3 × 10⁻¹⁰ m across, its nucleus 1.4 × 10⁻¹⁴ m (about 20 000 times
     smaller), so the captions say "tens of thousands of times".
   - "About 1 in 8000 bounced back" is the figure in the notes (themes/e1.html section 1). */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- physics ----------
  const K = 8.99e9, QE = 1.60e-19, MEV = 1.60e-13, Z = 79, A = 197, R0 = 1.20e-15;
  const EK0 = 5.0 * MEV;                                   // 8.0 × 10⁻¹³ J
  const KQQ = K * (2 * QE) * (Z * QE);                     // 3.64 × 10⁻²⁶ J m
  const D0 = KQQ / EK0;                                    // 4.55 × 10⁻¹⁴ m
  const RN = R0 * Math.cbrt(A);                            // 6.98 × 10⁻¹⁵ m
  const E_TOUCH = KQQ / RN / MEV;                          // 32.5 MeV
  const D0F = D0 * 1e15, RNF = RN * 1e15;                  // in fm: 45.5 and 6.98
  const thetaOf = (bF) => bF === 0 ? Math.PI : 2 * Math.atan(D0F / (2 * Math.abs(bF)));
  const deg = (r) => r * 180 / Math.PI;
  const NB = ' ';                                    // non-breaking space, so expressions don't wrap

  // One alpha particle past a fixed nucleus at the origin (lengths in fm, time in scene seconds).
  // It starts at x0 with the speed it has there for 5.0 MeV far away, aimed along +x, b above the axis.
  function traj(bF, v0, x0 = -430, rOut = 1500, dtS = 0.02) {
    const kA = 0.5 * D0F * v0 * v0;                       // a = kA / r²
    // start ON the exact orbit, |x0| away: the orbit equation 1/r = sin ψ / b + (a/b²)(cos ψ − 1), a = d/2, with ψ the
    // angle from the −x axis; speed from energy conservation; angular momentum v∞b (b = how far off-centre it was aimed)
    const ab = Math.abs(bF), aa = D0F / 2, r0 = Math.abs(x0);
    let psi = 0;
    if (ab > 0) {
      psi = Math.atan2(ab, r0);
      for (let k = 0; k < 40; k++) {
        const f = Math.sin(psi) / ab + aa / (ab * ab) * (Math.cos(psi) - 1) - 1 / r0;
        const df = Math.cos(psi) / ab - aa / (ab * ab) * Math.sin(psi);
        psi -= f / df;
      }
    }
    const sp = v0 * Math.sqrt(1 - D0F / r0), vt = v0 * ab / r0, vr = -Math.sqrt(Math.max(0, sp * sp - vt * vt));
    const sg = bF < 0 ? -1 : 1;
    let x = -r0 * Math.cos(psi), y = sg * r0 * Math.sin(psi);
    let vx = -vr * Math.cos(psi) + vt * Math.sin(psi), vy = sg * (vr * Math.sin(psi) + vt * Math.cos(psi));
    const s0 = Math.hypot(vx, vy);
    const acc = (px, py) => { const r = Math.hypot(px, py), f = kA / (r * r * r); return [f * px, f * py]; };
    const T = [0], X = [x], Y = [y];
    let t = 0, rMin = Infinity, tTurn = 0, out = false;
    for (let n = 0; n < 20000 && !out; n++) {
      const r = Math.hypot(x, y), v = Math.hypot(vx, vy);
      const sub = Math.max(1, Math.ceil(dtS / (0.004 * r / v)));
      const h = dtS / sub;
      for (let k = 0; k < sub; k++) {                       // RK4
        const [a1x, a1y] = acc(x, y);
        const [a2x, a2y] = acc(x + vx * h / 2, y + vy * h / 2);
        const [a3x, a3y] = acc(x + (vx + a1x * h / 2) * h / 2, y + (vy + a1y * h / 2) * h / 2);
        const [a4x, a4y] = acc(x + (vx + a2x * h / 2) * h, y + (vy + a2y * h / 2) * h);
        const nx = x + h * (vx + h * (a1x + a2x + a3x) / 6), ny = y + h * (vy + h * (a1y + a2y + a3y) / 6);
        vx += h * (a1x + 2 * a2x + 2 * a3x + a4x) / 6; vy += h * (a1y + 2 * a2y + 2 * a3y + a4y) / 6;
        x = nx; y = ny; t += h;
        const rr = Math.hypot(x, y); if (rr < rMin) { rMin = rr; tTurn = t; }
      }
      T.push(t); X.push(x); Y.push(y);
      if (vx * x + vy * y > 0 && Math.hypot(x, y) > rOut) out = true;
    }
    const vx0 = T.length > 1 ? (X[1] - X[0]) / dtS : s0, vy0 = T.length > 1 ? (Y[1] - Y[0]) / dtS : 0;
    const at = (tt) => {
      if (tt <= 0) return [X[0] + vx0 * tt, Y[0] + vy0 * tt];   // still on its way in (nearly straight, far away)
      const f = clamp(tt / dtS, 0, T.length - 1.0001), k = Math.floor(f), u = f - k;
      if (tt > T[T.length - 1]) { const n = T.length - 1, dt = tt - T[n]; return [X[n] + vx * dt, Y[n] + vy * dt]; }
      return [lerp(X[k], X[k + 1], u), lerp(Y[k], Y[k + 1], u)];
    };
    const theta = Math.atan2(vy, vx);                     // direction it leaves in
    return { bF, T, X, Y, at, rMin, tTurn, tEnd: T[T.length - 1], theta, dtS };
  }

  // ---------- timeline (scene seconds) ----------
  const P1 = [4.4, 49.4], P2 = [49.0, 67.6], P3 = [67.0, 145.4], END = 145.0, STORY = 158;          // story time (the physics and captions run on it)
  const V3 = 62, V4 = 46;                                   // fm per scene second, far from the nucleus
  const BS = [-105, 52, -26, 12, -5, 1.5];
  const L3 = BS.map((_, i) => 68.2 + 2.0 * i);             // launch times (at x = −430 fm)
  const PATHS = BS.map((b) => traj(b, V3));
  // the deflection: exact, tan(θ/2) = d/(2b); the drawn paths agree to within a fraction of a degree (info.check)
  const DEF = BS.map((b) => Math.round(deg(thetaOf(b))));
  const HEAD = traj(0, V4, -140);                          // starts just outside the view (its energy is still 5.0 MeV in all)
  const T_TURNS = [106.6, 112.6, 124.4], T_TURN1 = T_TURNS[0];
  const T_RAMP = [133.4, 138.4];
  const eAt = (t) => lerp(5.0, E_TOUCH, smooth((t - T_RAMP[0]) / (T_RAMP[1] - T_RAMP[0])));

  // ---------- captions ----------
  const sci = (v, dp = 1) => { const e = Math.floor(Math.log10(Math.abs(v))), m = v / 10 ** e;
    const sup = String(e).replace('-', '⁻').replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]); return `${m.toFixed(dp)}${NB}×${NB}10${sup}`; };
  const CAPS = [
    [4.8, 10.6, 'Alpha particles (helium nuclei, charge +2e) from a radioactive source are fired at a very thin sheet of gold foil, in a vacuum.'],
    [10.8, 16.4, 'A zinc sulfide screen flashes where each alpha particle hits. The flashes were counted through a microscope, angle by angle.'],
    [16.6, 21.4, 'Predict: in the plum pudding model, an atom\'s positive charge is spread through all of it. What should the alpha particles do?'],
    [21.6, 27.4, 'A spread-out charge could only nudge them: they should all pass through, turned by tiny angles.'],
    [27.6, 32.6, 'What they saw: most alpha particles went straight through, or were turned by only small angles.'],
    [32.8, 37.4, 'But a few were deflected through large angles.'],
    [37.6, 43.4, 'About 1 in 8000 bounced back, turned through more than 90°. (Rare paths are shown far more often here than they really happen.)'],
    [43.6, 48.8, 'A spread-out charge could never turn an alpha particle round. Only a tiny, concentrated charge could.'],
    [49.6, 55.2, 'Zoom in: the foil is a sheet of gold atoms. Each atom is mostly empty space, with a tiny nucleus at its centre.'],
    [55.4, 61.4, 'Not to scale: an atom is tens of thousands of times wider than its nucleus, so most alpha particles pass far from every nucleus.'],
    [61.6, 66.6, 'Only one that happens to pass very close to a nucleus is turned through a large angle.'],
    [67.6, 73.2, `One gold nucleus, charge +79e, and alpha particles with 5.0${NB}MeV of kinetic energy. The electric force pushes each one away.`],
    [73.4, 78.8, 'The force grows as an alpha particle gets closer, so each path is a smooth curve, not a sharp bounce.'],
    [79.0, 85.4, `The closer it is aimed to the nucleus, the more it is turned: ${DEF[0]}°, ${DEF[1]}°, ${DEF[2]}°, ${DEF[3]}°…`],
    [85.6, 91.0, `Only those aimed very close to the nucleus (within about 2${NB}×${NB}10⁻¹⁴${NB}m of its centre) are turned through more than 90°. Few are aimed that close, so very few bounce back.`],
    [91.2, 96.6, 'Conclusions: most of the atom is empty space, and its positive charge is concentrated in a tiny nucleus.'],
    [96.8, 101.8, 'Bouncing back also shows that the nucleus holds almost all of the atom\'s mass.'],
    [103.6, 109.2, '(HL) Fired straight at the nucleus, an alpha particle slows down, stops for an instant at a distance d, then comes back.'],
    [109.4, 115.0, `(HL) At the turning point all its kinetic energy has become electric potential energy: Eₖ${NB}=${NB}k(2e)(79e)${NB}÷${NB}d.`],
    [115.2, 121.4, `(HL) So d${NB}=${NB}k(2e)(79e)${NB}÷${NB}Eₖ = ${sci(KQQ, 2)}${NB}÷${NB}(${sci(EK0)}) = ${sci(D0)}${NB}m.`],
    [121.6, 127.6, `(HL) The gold nucleus has R${NB}=${NB}R₀∛A = 1.20${NB}×${NB}10⁻¹⁵${NB}×${NB}∛197 = ${sci(RN)}${NB}m. The alpha particle stops ${(D0 / RN).toFixed(1)} times as far from the centre as the surface is.`],
    [127.8, 132.8, '(HL) So the distance of closest approach is only an upper limit for the radius of the nucleus.'],
    [133.0, 138.6, `(HL) Faster alpha particles get closer. At about ${Math.round(E_TOUCH)}${NB}MeV they would just reach the surface of the gold nucleus.`],
    [138.8, 144.8, '(HL) Then the short-range strong nuclear force acts too, and fewer are scattered at large angles than Rutherford\'s formula predicts.'],
  ];
  // No pauses (teacher's decisions, 16 and 17 November 2026): while each caption is up the story clock runs more slowly,
  // just enough for the caption to be read at no more than 16 characters a second (the fades count as unreadable), and
  // the prediction gets at least 6 s more. Everything that MOVES (every alpha particle, the plum-pudding inset) runs on
  // the real clock, so the motion always plays at the same speed; only the captions, fades and camera moves use the
  // story clock. Each moving thing's start is converted with realOf, so it still arrives when its caption says.
  // rate = story seconds per real second.
  const SEGS = CAPS.map(([a, b, txt]) => {
    let r = Math.min(1, (b - a - 0.6) / (txt.length / 16));
    if (txt.startsWith('Predict')) r = Math.min(r, (b - a) / (b - a + 6));
    return [a, b, r];
  });
  const realOf = (tau) => SEGS.reduce((n, [a, b, r]) => n + Math.max(0, Math.min(tau, b) - a) * (1 / r - 1), tau);
  const tauOf = (tr) => {
    let shift = 0;                                           // extra real time used by the slowed captions before this one
    for (const [a, b, r] of SEGS) {
      const ra = a + shift, rb = ra + (b - a) / r;
      if (tr < ra) return tr - shift;
      if (tr < rb) return a + (tr - ra) * r;
      shift += (b - a) * (1 / r - 1);
    }
    return Math.min(tr - shift, STORY);
  };
  const DURATION = realOf(STORY);

  // ---------- colours ----------
  const ALPHA = C.pos, GOLD = '255,196,80', FOIL = '240,190,90', SCREEN = C.good, EL = C.neg, WALL = '150,165,230';

  // ---------- the part-1 alpha stream (fixed list; positions are worked out from t alone) ----------
  let seed = 1911;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const RARE = [[33.2, 28], [34.0, -46], [34.9, 63], [35.8, -24], [36.6, 79], [38.3, 132], [40.1, -157], [41.9, 114]];
  const T_SRC = 0.62, T_RING = 0.5;                       // seconds from source to foil, and from foil to the screen
  // te = when each one leaves the source, in REAL seconds: a steady stream, one every 0.13 s; the rare ones reach the foil
  // at the story moments listed in RARE
  const STREAM = [];
  for (let te = realOf(6.0); te < realOf(46.5); te += 0.13) STREAM.push({ te, th: ((rnd() - 0.5) * 6 + (rnd() - 0.5) * 3) * Math.PI / 180, dy: rnd() - 0.5 });
  for (const [te, d] of RARE) STREAM.push({ te: realOf(te) - T_SRC, th: d * Math.PI / 180, dy: rnd() - 0.5, rare: true });

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25));
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    const capTop = H - capFs * (phone ? 6.4 : 5.2);
    const o = { W, H, phone, fs, capFs, capTop };
    // part 1: the chamber
    if (phone) { o.cR = Math.min(W * 0.44, (capTop - 20) * 0.42); o.cx = W / 2; o.cy = 14 + o.cR + fs; }
    else { o.cR = Math.min(W * 0.27, (capTop - 58) * 0.5); o.cx = W * 0.36; o.cy = 52 + o.cR; }
    o.ringR = o.cR * 0.66;
    o.inset = phone ? { x0: W * 0.08, x1: W * 0.92, y0: o.cy - o.cR * 0.55, y1: o.cy + o.cR * 0.55 }
      : { x0: W * 0.69, x1: W * 0.96, y0: Math.max(70, H * 0.2), y1: Math.min(capTop - 10, H * 0.2 + W * 0.2) };
    // part 2: atoms
    o.ra = clamp(Math.min(W, H) * 0.07, 16, 46);
    // part 3/4: one nucleus
    o.nx3 = W / 2; o.ny3 = phone ? capTop * 0.47 : capTop * 0.5;
    o.hw3 = phone ? 160 : 250;                               // half-width of the view in fm
    o.nx4 = phone ? W / 2 : W * 0.38; o.ny4 = phone ? capTop * 0.33 : capTop * 0.52;
    o.hw4 = phone ? 85 : 92;
    o.panel = phone ? { x0: 12, x1: W - 12, y0: capTop * 0.66, y1: capTop - 8 }
      : { x0: W * 0.66, x1: W * 0.95, y0: Math.max(64, H * 0.2), y1: Math.min(capTop - 12, H * 0.2 + W * 0.15) };
    L = o;
  }

  // ---------- small helpers ----------
  const dot = (s, x, y, r, rgb, a, glow = 2.6) => {
    if (a <= 0) return;
    D.glowDot(s, x, y, r * glow, rgb, 0.8 * a);
    const { g } = s; g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(${rgb},${a})`; g.beginPath(); g.arc(x, y, Math.max(0.5, r), 0, 7); g.fill();
  };
  const label = (s, txt, x, y, a, rgb = C.muted, align = 'center', size = L.fs, weight = 400) =>
    D.text(s, txt, x, y, size, a, D.sans(size, weight), rgb, align);
  const pill = (s, txt, x, y, a, rgb) => {
    if (a <= 0) return;
    const { g } = s, fs = L.fs; g.font = D.sans(fs, 700);
    const w = g.measureText(txt).width + fs;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(${rgb},${0.9 * a})`;
    g.beginPath(); g.roundRect(x, y - fs * 0.75, w, fs * 1.5, fs * 0.75); g.fill();
    D.text(s, txt, x + w / 2, y, fs, a, D.sans(fs, 700), '20,20,30');
  };

  // ---------- part 1: the apparatus ----------
  function drawPart1(s, t, tr, a) {
    if (a <= 0) return;
    const { g } = s, { cx, cy, cR, ringR, fs, phone } = L;
    // the vacuum chamber
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(16,22,48,${0.55 * a})`; g.beginPath(); g.arc(cx, cy, cR, 0, 7); g.fill();
    D.glowLine(s, Array.from({ length: 121 }, (_, i) => [cx + cR * Math.cos(i * Math.PI / 60), cy + cR * Math.sin(i * Math.PI / 60)]), WALL, 0.55 * a, 1.4);
    label(s, 'vacuum', cx - cR * 0.5, cy + cR * 0.8, 0.75 * a);
    // the screen: drawn as a ring all round (really one small screen moved round with the microscope)
    const gap = 0.16;
    const ring = []; for (let i = 0; i <= 140; i++) { const ph = Math.PI + gap + (2 * Math.PI - 2 * gap) * i / 140; ring.push([cx + ringR * Math.cos(ph), cy + ringR * Math.sin(ph)]); }
    D.glowLine(s, ring, SCREEN, 0.35 * a, 1.2);
    // the source: a lead block with a narrow slot
    const sx = cx - cR * 0.88, bw = cR * 0.16, bh = cR * 0.22;
    g.fillStyle = `rgba(95,100,120,${0.95 * a})`; g.fillRect(sx - bw * 0.2, cy - bh / 2, bw, bh);
    g.fillStyle = `rgba(16,22,48,${a})`; g.fillRect(sx + bw * 0.2, cy - bh * 0.06, bw * 0.62, bh * 0.12);
    dot(s, sx + bw * 0.12, cy, Math.max(2, cR * 0.018), '255,120,140', a, 2);
    label(s, phone ? 'source' : 'alpha source', sx + bw * 0.3, cy + bh * 0.5 + fs * 0.9, 0.85 * a);
    label(s, 'lead', sx + bw * 0.3, cy - bh * 0.5 - fs * 0.7, 0.6 * a);
    // the gold foil
    const fh = cR * 0.42;
    g.fillStyle = `rgba(${FOIL},${0.95 * a})`; g.fillRect(cx - 1.5, cy - fh / 2, 3, fh);
    D.glowDot(s, cx, cy, fh * 0.35, FOIL, 0.25 * a);
    label(s, 'gold foil', cx, cy + fh / 2 + fs * 0.9, 0.85 * a, FOIL);
    label(s, 'zinc sulfide screen', cx + ringR * 0.72, cy + ringR * 0.82 + fs * 0.4, 0.75 * a * (1 - smooth((t - 26.6) / 0.8)), SCREEN);
    // the microscope, moved round to count the flashes at each angle
    const phm = (35 + 115 * smooth((t - 11) / 34)) * Math.PI / 180;
    const ux = Math.cos(phm), uy = -Math.sin(phm);
    const r1 = ringR * 1.05, r2 = cR * 0.97;
    g.lineCap = 'round';
    g.strokeStyle = `rgba(185,195,220,${0.9 * a})`; g.lineWidth = Math.max(4, cR * 0.05);
    g.beginPath(); g.moveTo(cx + ux * r1, cy + uy * r1); g.lineTo(cx + ux * r2, cy + uy * r2); g.stroke();
    g.lineWidth = Math.max(6, cR * 0.075); g.beginPath(); g.moveTo(cx + ux * r2, cy + uy * r2); g.lineTo(cx + ux * (r2 + cR * 0.08), cy + uy * (r2 + cR * 0.08)); g.stroke();
    if (t < 30) label(s, 'microscope', cx + ux * (r2 + cR * 0.2), cy + uy * (r2 + cR * 0.2) - fs * 0.2, 0.8 * a * fade(t, 9, 30, 1, 1), '200,210,235');
    // the alpha particles
    const ex = sx + bw * 0.82;
    for (const p of STREAM) {
      const tt = tr - p.te; if (tt < 0 || tt > T_SRC + T_RING + 1.6) continue;
      if (p.rare && t < 32.8 - 0.62) continue;
      const fy = cy + p.dy * fh * 0.25;
      let x, y, hx, hy;
      if (tt < T_SRC) { const u = tt / T_SRC; x = lerp(ex, cx, u); y = lerp(cy, fy, u); hx = x - cR * 0.1; hy = y; }
      else {
        const u = Math.min(1, (tt - T_SRC) / T_RING), rr = ringR * u;
        x = cx + rr * Math.cos(p.th); y = fy - rr * Math.sin(p.th);
        const back = Math.max(0, rr - cR * 0.1);
        hx = cx + back * Math.cos(p.th); hy = fy - back * Math.sin(p.th);
        if (rr < cR * 0.1) { hx = cx - (cR * 0.1 - rr); hy = fy; }
      }
      if (tt < T_SRC + T_RING) {
        D.glowLine(s, [[hx, hy], [x, y]], ALPHA, (p.rare ? 0.95 : 0.6) * a, p.rare ? 1.6 : 1.1);
        dot(s, x, y, p.rare ? 2.6 : 1.8, ALPHA, a, 2.2);
      } else {                                                // the flash, then a faint mark where it hit
        const k = tt - T_SRC - T_RING;
        const hxR = cx + ringR * Math.cos(p.th), hyR = fy - ringR * Math.sin(p.th);
        D.glowDot(s, hxR, hyR, Math.max(6, cR * 0.06), SCREEN, a * Math.max(0, 1 - k / 0.8) * (p.rare ? 1 : 0.7));
        if (p.rare) D.glowLine(s, [[cx, fy], [hxR, hyR]], ALPHA, 0.35 * a * Math.max(0, 1 - k / 1.6), 1);
      }
    }
    // marks left on the screen (the record of where the alpha particles landed)
    g.globalCompositeOperation = 'lighter';
    for (const p of STREAM) {
      if (tr < p.te + T_SRC + T_RING || (p.rare && t < 32.8)) continue;
      const fy = cy + p.dy * fh * 0.25;
      g.fillStyle = `rgba(${SCREEN},${(p.rare ? 0.9 : 0.25) * a})`;
      g.beginPath(); g.arc(cx + ringR * Math.cos(p.th), fy - ringR * Math.sin(p.th), p.rare ? 2.6 : 1.6, 0, 7); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    // the angle scale on the screen
    if (t > 27) {
      const aa = a * smooth((t - 27.4) / 1);
      for (const d of [0, 45, 90, 135]) for (const sg of d ? [1, -1] : [1]) {
        const ph = sg * d * Math.PI / 180, rr = ringR + fs * 1.3;
        label(s, `${d}°`, cx + rr * Math.cos(ph), cy - rr * Math.sin(ph), 0.6 * aa, C.muted, 'center', fs - 1);
      }
    }
  }

  // the plum pudding prediction, in an inset
  const PUD0 = realOf(16.6);
  function drawPudding(s, t, tr, a) {
    if (a <= 0) return;
    const { g } = s, { inset: b, fs } = L;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(10,14,32,${0.92 * a})`; g.beginPath(); g.roundRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 10); g.fill();
    g.strokeStyle = `rgba(${WALL},${0.4 * a})`; g.lineWidth = 1; g.stroke();
    label(s, 'plum pudding model (prediction)', (b.x0 + b.x1) / 2, b.y0 + fs * 1.1, 0.85 * a, '255,170,190', 'center', fs, 600);
    const cxp = (b.x0 + b.x1) / 2, cyp = (b.y0 + b.y1) / 2 + fs * 0.6, rp = Math.min(b.x1 - b.x0, b.y1 - b.y0 - fs * 2.4) * 0.36;
    const gr = g.createRadialGradient(cxp, cyp, 0, cxp, cyp, rp);
    gr.addColorStop(0, `rgba(255,120,150,${0.38 * a})`); gr.addColorStop(1, `rgba(255,120,150,${0.18 * a})`);
    g.fillStyle = gr; g.beginPath(); g.arc(cxp, cyp, rp, 0, 7); g.fill();
    label(s, '+', cxp - rp * 0.45, cyp - rp * 0.35, 0.55 * a, '255,190,205', 'center', fs + 2, 700);
    label(s, '+', cxp + rp * 0.4, cyp + rp * 0.4, 0.55 * a, '255,190,205', 'center', fs + 2, 700);
    for (let i = 0; i < 9; i++) {
      const ang = i * 2.39996, rr = rp * Math.sqrt((i + 0.5) / 9) * 0.82;
      dot(s, cxp + rr * Math.cos(ang), cyp + rr * Math.sin(ang), 2.2, EL, 0.9 * a, 2);
    }
    // alpha particles crossing it, turned by angles far too small to see
    const span = b.x1 - b.x0 - 16;
    for (let i = 0; i < 7; i++) {
      const u = (((tr - PUD0) * 0.45 + i / 7) % 1 + 1) % 1, x = b.x0 + 8 + span * u, y = cyp + (i - 3) * rp * 0.27;
      D.glowLine(s, [[Math.max(b.x0 + 8, x - span * 0.12), y], [x, y]], ALPHA, 0.7 * a, 1.2);
      dot(s, x, y, 2, ALPHA, a, 2);
    }
    if (t > 21.6) label(s, 'all through, almost straight', cxp, b.y1 - fs * 0.9, 0.8 * a * smooth((t - 21.6) / 0.8), ALPHA);
  }

  // ---------- part 2: inside the foil ----------
  const P2A = (() => {                                     // alpha particles crossing the atoms: [start time (real s), row offset]
    const out = []; let sd = 7;
    for (let te = realOf(49.4); te < realOf(49.4 + 17 * 0.9) + 0.01; te += 0.9) { sd = (sd * 16807) % 2147483647; out.push([te, (sd / 2147483647)]); }
    return out;
  })();
  const DEFL = traj(-12, 1, -430, 440, 0.5);
  const TILT = 12 * Math.PI / 180;                                // the one close pass in part 2 (shape only; scaled)
  const TC2 = realOf(62.6);                                // when the close one is closest (real s)
  function drawPart2(s, t, tr, a) {
    if (a <= 0) return;
    const { g } = s, { W, capTop, ra, fs } = L;
    const zoom = lerp(0.55, 1, smooth((t - 49.0) / 1.6));
    const R = ra * zoom, dx = R * 2.15, dy = dx * 0.866;
    const cx0 = W / 2, cy0 = capTop * 0.48;
    const atoms = [];
    for (let j = -6; j <= 6; j++) for (let i = -10; i <= 10; i++) {
      const x = cx0 + i * dx + (j % 2 ? dx / 2 : 0), y = cy0 + j * dy;
      if (x < -R || x > W + R || y < -R || y > capTop + R * 0.4) continue;
      atoms.push([x, y, i * 31 + j * 17]);
    }
    g.globalCompositeOperation = 'source-over';
    for (const [x, y, k] of atoms) {
      const gr = g.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, `rgba(63,150,255,${0.10 * a})`); gr.addColorStop(0.8, `rgba(63,150,255,${0.06 * a})`); gr.addColorStop(1, 'rgba(63,150,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill();
      for (let e = 0; e < 4; e++) {                          // a few electrons, somewhere in the cloud
        const ph = k * 1.7 + e * 2.1;
        const ex = x + R * 0.78 * Math.sin(s.clock * (0.9 + 0.13 * e) + ph), ey = y + R * 0.78 * Math.cos(s.clock * (0.7 + 0.11 * e) + ph * 1.3);
        g.fillStyle = `rgba(${EL},${0.55 * a})`; g.beginPath(); g.arc(ex, ey, 1.2, 0, 7); g.fill();
      }
      dot(s, x, y, Math.max(1.6, R * 0.06), GOLD, a, 3);
    }
    // the alpha particles: straight lines, rows chosen to miss the nuclei (as nearly all do)
    const speed = W * 0.32;
    for (const [ts, u] of P2A) {
      const tt = tr - ts; if (tt < 0) continue;
      const row = Math.floor(u * 5) - 2, y = cy0 + row * dy + (u * 5 % 1 > 0.5 ? 0.5 : -0.5) * dy * 0.9 * (0.4 + 0.6 * (u * 37 % 1));
      const x = -20 + speed * tt; if (x > W + 60) continue;
      D.glowLine(s, [[Math.max(-20, x - speed * 0.35), y], [x, y]], ALPHA, 0.6 * a, 1.2);
      dot(s, x, y, 2.4, ALPHA, a, 2.2);
    }
    // the one that passes very close to the central nucleus (shape from the exact path, scaled: not to scale with the
    // atom). It comes in tilted 12° and is turned 124° downwards, so on its way in and out it misses every other
    // nucleus by at least 0.19 atom radii (as a real alpha particle would, it goes straight past them).
    const nxA = cx0, nyA = cy0;
    const sc = (R * 0.3) / D0F, TS = speed / sc;             // pixels per fm, and fm per scene second
    const ca = Math.cos(TILT), sa = Math.sin(TILT);
    const toScr = ([px, py]) => [nxA + (px * ca - py * sa) * sc, nyA - (px * sa + py * ca) * sc];
    if (tr > TC2 - 3.4 && tr < TC2 + 4.5) {
      const tt = (tr - TC2) * TS + DEFL.tTurn, t0 = tt - 0.9 * TS;  // a tail, like the others, up to the head only
      const pts = [];
      for (let k = 0; k <= 60; k++) pts.push(toScr(DEFL.at(lerp(t0, tt, k / 60))));
      D.glowLine(s, pts, ALPHA, 0.8 * a, 1.4);
      const [hx, hy] = pts[pts.length - 1]; dot(s, hx, hy, 2.6, ALPHA, a, 2.4);
    }
    label(s, 'nuclei drawn far too big', W * 0.5, Math.min(capTop - fs, cy0 + dy * 2.6), 0.0 + 0.8 * a * fade(t, 55.4, 66.6, 0.6, 0.6), C.muted, 'center', fs);
  }

  // ---------- parts 3 and 4: one nucleus ----------
  const view = (t) => {
    const u = smooth((t - 102.4) / 2.0);
    return { nx: lerp(L.nx3, L.nx4, u), ny: lerp(L.ny3, L.ny4, u), sc: lerp(Math.min(L.W * 0.5 / L.hw3, (L.ny3 - 26) / 128), Math.min(L.W * (L.phone ? 0.5 : 0.36) / L.hw4, (L.ny4 - (L.phone ? 6 : 52)) / D0F), u) };
  };
  function drawNucleus(s, t, a, v) {
    const rpx = RNF * v.sc;
    D.glowDot(s, v.nx, v.ny, rpx * 2.6 + 6, GOLD, 0.5 * a);
    const { g } = s;
    const gr = g.createRadialGradient(v.nx - rpx * 0.35, v.ny - rpx * 0.35, rpx * 0.1, v.nx, v.ny, Math.max(1, rpx));
    gr.addColorStop(0, `rgba(255,240,190,${a})`); gr.addColorStop(1, `rgba(${GOLD},${a})`);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = gr; g.beginPath(); g.arc(v.nx, v.ny, Math.max(1, rpx), 0, 7); g.fill();
  }
  const L3R = L3.map(realOf);                              // launch times in real seconds
  function drawPart3(s, t, tr, a) {
    if (a <= 0) return;
    const { g } = s, { W, capTop, fs, phone } = L, v = view(t);
    const X = (x) => v.nx + x * v.sc, Y = (y) => v.ny - y * v.sc;
    const pa = a * (1 - smooth((t - 101.6) / 1.4));          // the six paths fade before part 4
    if (pa > 0) {
      PATHS.forEach((p, i) => {
        const tt = tr - L3R[i]; if (tt < 0) return;
        // where it was aimed (dashed)
        D.line(s, X(-500), Y(p.bF), X(500), Y(p.bF), C.muted, 0.16 * pa, 1, [4, 6]);
        const n = Math.min(p.T.length - 1, Math.floor(tt / p.dtS));
        const pts = [];
        for (let k = 0; k <= n; k += 2) pts.push([X(p.X[k]), Y(p.Y[k])]);
        const [hx, hy] = p.at(tt); pts.push([X(hx), Y(hy)]);
        D.glowLine(s, pts, ALPHA, 0.75 * pa, 1.4);
        if (tt < p.tEnd + 2) dot(s, X(hx), Y(hy), 3, ALPHA, pa, 2.4);
        // the force on it: away from the nucleus, ∝ 1/r² (shown while it is near)
        const r = Math.hypot(hx, hy);
        if (t > 73.0 && t < 88.6 && r < 170) {
          const len = Math.min(80, 40 * (60 / r) ** 2);
          D.arrow(s, X(hx), Y(hy), X(hx) + hx / r * len, Y(hy) - hy / r * len, C.force, 0.9 * pa * smooth((t - 73.0) / 0.6), '', { width: 2, head: 8 });
        }
        // the angle it was turned through, once it has gone: written beside its outgoing path
        const after = tt - p.tTurn;
        if (after > 2.5) {
          const dLab = (DEF[i] > 165 ? 0.78 : DEF[i] > 90 ? 0.36 : 0.62) * Math.min(L.hw3 * 0.95, (capTop * 0.45) / v.sc);   // back-scattered: nearer the nucleus, where the trails are apart
          let k = Math.min(p.T.length - 1, Math.ceil(p.tTurn / p.dtS));
          const yMax = L.H - L.capFs * (phone ? 8.2 : 6.8);     // stay well above a three-line caption
          const yMin = phone ? 16 + fs * 5.6 : 30;               // and below the scale bar (phones) or the top edge, allowing for the offset
          while (k < p.T.length - 2 && Math.hypot(p.X[k], p.Y[k]) < dLab && Y(p.Y[k + 1]) < yMax && Y(p.Y[k + 1]) > yMin) k++;
          const k2 = Math.min(p.T.length - 1, k + 1), k1 = k2 - 1;
          const tx = p.X[k2] - p.X[k1], ty = p.Y[k2] - p.Y[k1], tl = Math.hypot(tx, ty) || 1;
          let nx = -ty / tl, ny = tx / tl;                     // across the path, on the side away from the axis
          if (ny * p.Y[k] < 0) { nx = -nx; ny = -ny; }
          const off = fs * 1.4 / v.sc, px = p.X[k], py = p.Y[k];
          label(s, `${DEF[i]}°`, X(px + nx * off), Y(py + ny * off), pa * smooth((after - 2.5) / 0.8), '255,190,205', 'center', fs + 1, 600);
        }
      });
    }
    drawNucleus(s, t, a, v);
    if (t < 102) {
      label(s, 'gold nucleus, +79e', v.nx, v.ny + RNF * v.sc + fs * 1.6, 0.85 * a * (1 - smooth((t - 73.4) / 0.8)), GOLD);
      // scale bar: 50 fm = 5.0 × 10⁻¹⁴ m
      const bx = phone ? 14 : W * 0.05, by = phone ? 12 + fs * 1.7 : capTop - fs * 1.6, bl = 50 * v.sc;   // phones: top left (no legend there)
      g.font = D.sans(fs - 1);                                 // a dark backing, so paths crossing it don't hide it
      const bw = Math.max(bl, g.measureText('nucleus and paths drawn to the same scale').width) + 12;
      g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(4,6,13,${0.82 * a})`;
      g.beginPath(); g.roundRect(bx - 6, by - fs * 1.7, bw, fs * 3.4, 6); g.fill();
      D.line(s, bx, by, bx + bl, by, '220,225,245', 0.8 * a, 2);
      D.line(s, bx, by - 4, bx, by + 4, '220,225,245', 0.8 * a, 2); D.line(s, bx + bl, by - 4, bx + bl, by + 4, '220,225,245', 0.8 * a, 2);
      label(s, `5.0${NB}×${NB}10⁻¹⁴ m`, bx, by - fs * 0.9, 0.8 * a, '220,225,245', 'left', fs - 1);
      label(s, 'nucleus and paths drawn to the same scale', bx, by + fs * 1.1, 0.6 * a, C.muted, 'left', fs - 1);
      if (!phone && t > 88) label(s, 'the electrons are far outside this picture', W * 0.95, capTop - fs * 1.6, 0.6 * a * smooth((t - 88) / 1), C.muted, 'right', fs - 1);
    }
  }

  const L4R = T_TURNS.map((tt) => realOf(tt) - HEAD.tTurn); // launch times in real seconds: each turns at its caption's moment
  function drawPart4(s, t, tr, a) {
    if (a <= 0) return;
    const { g } = s, { fs, phone, W } = L, v = view(t);
    const X = (x) => v.nx + x * v.sc, Y = (y) => v.ny - y * v.sc;
    pill(s, 'HL', phone ? 10 : 14, 22, a, '242,140,40');
    // the axis it travels along
    D.line(s, X(-200), Y(0), X(-1.2 * RNF), Y(0), C.muted, 0.2 * a, 1, [3, 5]);
    // the head-on alpha particle (three runs)
    let cur = null;
    const xEdge = -v.nx / v.sc;                              // the left edge of the picture, in fm
    for (const L0 of L4R) {
      const tt = tr - L0; if (tt < 0 || tt > HEAD.tEnd + 1) continue;
      const [hx] = HEAD.at(tt);
      const pts = [];
      const n = Math.min(HEAD.T.length - 1, Math.floor(tt / HEAD.dtS));
      for (let k = Math.max(0, n - 40); k <= n; k++) pts.push([X(HEAD.X[k]), Y(HEAD.Y[k]) + (HEAD.T[k] > HEAD.tTurn ? 3 : 0)]);
      pts.push([X(hx), Y(0) + (tt > HEAD.tTurn ? 3 : 0)]);
      D.glowLine(s, pts, ALPHA, 0.8 * a, 1.5);
      dot(s, X(hx), Y(0), 3.4, ALPHA, a, 2.4);
      if (hx > xEdge && (!cur || Math.abs(hx) < Math.abs(cur.x))) cur = { x: hx };   // the panel follows an alpha particle in view
    }
    // the turning point d (after the first run gets there), then shrinking as the energy rises
    const showD = t > T_TURN1 - 0.2;
    const Ek = eAt(t), dNow = KQQ / (Ek * MEV) * 1e15;
    if (showD) {
      const ad = a * smooth((t - T_TURN1 + 0.2) / 0.6);
      const ring = []; for (let i = 0; i <= 90; i++) { const ph = i / 90 * Math.PI * 2; ring.push([X(dNow * Math.cos(ph)), Y(dNow * Math.sin(ph))]); }
      g.setLineDash([4, 5]); D.glowLine(s, ring, '255,214,102', 0.45 * ad, 1); g.setLineDash([]);
      // bracket from the centre to the turning point
      const yb = Y(0) + fs * 1.9;
      D.line(s, X(-dNow), yb, X(0), yb, C.light, 0.85 * ad, 1.4);
      D.line(s, X(-dNow), yb - 4, X(-dNow), yb + 4, C.light, 0.85 * ad, 1.4); D.line(s, X(0), yb - 4, X(0), yb + 4, C.light, 0.85 * ad, 1.4);
      label(s, `d = ${sci(dNow * 1e-15)} m`, X(-dNow / 2), yb + fs * 1.1, ad, C.light, 'center', fs, 600);
    }
    // the radius, once it's compared
    if (t > 121.6) {
      const ar = a * smooth((t - 121.6) / 0.8);
      const yb = Y(0) - RNF * v.sc - fs * 1.2;
      label(s, `R = ${sci(RN)} m`, X(0), yb, ar, GOLD, 'center', fs, 600);
    }
    // the strong force, once the alpha particles reach the surface
    if (t > T_RAMP[1] - 0.2) {
      const as = a * smooth((t - T_RAMP[1] + 0.2) / 1.8);   // the strong force has a very short range: just beyond the surface
      D.glowDot(s, X(0), Y(0), RNF * v.sc * 1.3, '255,120,80', 0.5 * as);
      label(s, 'strong nuclear force acts', X(0), Y(0) + RNF * v.sc + fs * 3.6, as, '255,150,110', 'center', fs, 600);
    }
    // readout of the energy during the ramp (where the energy panel was)
    if (t > T_RAMP[0] - 0.4) {
      const ae = a * smooth((t - T_RAMP[0] + 0.4) / 0.6), p = L.panel;
      label(s, t >= T_RAMP[1] ? `alpha particle: Eₖ ≈ ${Math.round(E_TOUCH)} MeV` : `alpha particle: Eₖ = ${Ek.toFixed(1)} MeV`, phone ? W / 2 : p.x0, p.y0 + fs, ae, C.vel, phone ? 'center' : 'left', fs + 1, 600);
    }
    // the energy panel (during the head-on runs)
    const ap = a * fade(t, 104.4, 132.6, 0.8, 0.8);
    if (ap > 0) {
      const p = L.panel, { x0, x1, y0, y1 } = p;
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = `rgba(14,20,44,${0.75 * ap})`; g.beginPath(); g.roundRect(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12, 10); g.fill();
      g.font = D.sans(fs);
      const head = g.measureText('energy of the alpha particle / MeV').width <= x1 - x0 + 4 ? 'energy of the alpha particle / MeV' : 'energy / MeV';
      label(s, head, x0, y0 + fs * 0.6, 0.85 * ap, C.muted, 'left', fs);
      // only while an alpha particle is in the picture (otherwise the bars are empty)
      const ep = cur ? 5.0 * D0F / Math.max(Math.abs(cur.x), D0F) : null, ek = cur ? 5.0 - ep : null;
      const rows = [['Eₖ', ek, C.vel], ['Eₚ', ep, C.field], ['total', cur ? 5.0 : null, '230,235,250']];
      const rowH = Math.min((y1 - y0 - fs * 1.8) / 3, fs * 2.6), bx0 = x0 + fs * 3.4, bx1 = x1 - fs * 2.8;
      rows.forEach(([nm, val, rgb], i) => {
        const yy = y0 + fs * 1.8 + rowH * (i + 0.5);
        label(s, nm, x0, yy, 0.9 * ap, rgb, 'left', fs + 1, 600);
        g.fillStyle = `rgba(255,255,255,${0.06 * ap})`; g.fillRect(bx0, yy - rowH * 0.22, bx1 - bx0, rowH * 0.44);
        if (val !== null) { g.fillStyle = `rgba(${rgb},${0.9 * ap})`; g.fillRect(bx0, yy - rowH * 0.22, (bx1 - bx0) * clamp(val / 5, 0, 1), rowH * 0.44); }
        label(s, val === null ? '–' : val.toFixed(1), bx1 + 4, yy, 0.9 * ap, rgb, 'left', fs);
      });
    }
  }

  // ---------- end card ----------
  function endCard(s, t) {
    const a = fade(t, END, STORY - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(4,6,13,${0.92 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 17, 36)), s2 = Math.round(clamp(W / 62, 11, 17));
    let y = H * (phone ? 0.1 : 0.13);
    g.font = D.sans(s1, 300);
    const t1 = D.wrap(s, 'What the alpha particles showed', W - 40);
    D.text(s, t1, W / 2, y, s1, a, D.sans(s1, 300)); y += s1 * 1.3 * t1.length + s2 * 0.6;
    const rows = [
      ['Most went straight through', 'most of the atom is empty space'],
      ['A few were deflected through large angles', 'the positive charge is concentrated in a tiny nucleus'],
      ['Very few bounced back', 'the nucleus holds almost all of the mass'],
    ];
    const colW = phone ? W - 36 : Math.min(W * 0.4, 460);
    for (const [o, c] of rows) {
      g.font = D.sans(s2, 600);
      const lo = D.wrap(s, o, colW), lc = (g.font = D.sans(s2), D.wrap(s, '→ ' + c, colW));
      if (phone) {
        D.text(s, lo, W / 2, y, s2, a, D.sans(s2, 600), ALPHA); y += s2 * 1.3 * lo.length;
        D.text(s, lc, W / 2, y, s2, 0.85 * a, D.sans(s2)); y += s2 * 1.3 * lc.length + s2 * 0.5;
      } else {
        D.text(s, lo, W / 2 - 12, y, s2, a, D.sans(s2, 600), ALPHA, 'right');
        D.text(s, lc, W / 2 + 12, y, s2, 0.85 * a, D.sans(s2), C.text, 'left');
        y += s2 * 1.3 * Math.max(lo.length, lc.length) + s2 * 0.55;
      }
    }
    y += s2 * 0.4;
    D.text(s, 'HL', W / 2, y, s2, a, D.sans(s2, 700), '242,140,40'); y += s2 * 1.4;
    g.font = D.sans(s2);
    const hl = D.wrap(s, `Closest approach (head-on): Eₖ${NB}=${NB}k(2e)(Ze)${NB}÷${NB}d, an upper limit for the radius R${NB}=${NB}R₀∛A. At high energy the strong nuclear force acts too.`, phone ? W - 36 : Math.min(W - 60, 760));
    D.text(s, hl, W / 2, y, s2, 0.85 * a, D.sans(s2));
  }

  Anim.register('rutherford', {
    duration: DURATION,
    poster: realOf(84),
    // score: a discovery (C-sharp minor, a triangle pad, a low drone, a little wind)
    music: { chords: [[49, 56, 61, 64], [45, 52, 57, 61], [47, 54, 59, 63], [44, 51, 56, 60]], bar: 8, pad: 'triangle', cutoff: 900, drone: 0.09, wind: 0.3, volume: 0.45 },
    resize: layout,
    info: {
      KQQ, D0, RN, E_TOUCH, EK0, PATHS, HEAD, CAPS, SEGS, realOf, tauOf, DEF, thetaOf, traj, DURATION,
      check() {
        const out = { KQQ, EK0, D0, RN, ratio: D0 / RN, E_TOUCH };
        out.paths = PATHS.map((p) => ({ b: p.bF, sim: +deg(Math.acos(Math.cos(p.theta))).toFixed(3), exact: +deg(thetaOf(p.bF)).toFixed(3),
          rMin: +p.rMin.toFixed(3), rMinExact: +(D0F / 2 + Math.hypot(D0F / 2, p.bF)).toFixed(3) }));
        out.head = { rMin: HEAD.rMin, d0fm: D0F };
        // characters per real second while the caption is fully shown (its fades not counted)
        out.reading = SEGS.map(([a, b, r], i) => +(CAPS[i][2].length / ((b - a - 0.6) / r)).toFixed(1));
        return out;
      },
    },
    frame(s, tr) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      const t = tauOf(tr);                                   // story time
      D.background(s, 0.2);
      drawPart1(s, t, tr, fade(t, P1[0], P1[1], 0.6, 0.8));
      drawPudding(s, t, tr, fade(t, 16.6, 27.6, 0.6, 0.6));
      drawPart2(s, t, tr, fade(t, P2[0], P2[1], 0.8, 0.8));
      drawPart3(s, t, tr, fade(t, P3[0], P3[1], 0.8, 0.6));
      drawPart4(s, t, tr, fade(t, 102.8, P3[1], 0.8, 0.6));
      if (t > P2[0] && t < P3[1]) {
        D.legend(s, t > 102.6 ? [] : [['dot', ALPHA, 'alpha particle (+2e)'], ['dot', GOLD, 'gold nucleus (+79e)'], ...(t < 67.6 ? [['dot', EL, 'electron']] : []), ...(t > 73 && t < 88.6 ? [['arrow', C.force, 'electric force on it']] : [])],
          fade(t, P2[0] + 0.4, 102.6, 0.6, 0.6));
      }
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Rutherford scattering', 'How alpha particles revealed the nucleus');
      endCard(s, t);
      D.vignette(s, tr, DURATION);
    },
  });
})();
