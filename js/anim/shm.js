/* C.1 Simple harmonic motion: a glider on a frictionless air track between two springs, with its x–t, v–t and
   a–t graphs drawing themselves, the energy changing between kinetic and elastic potential, and (HL) the
   reference circle whose shadow moves exactly like the glider.
   Numbers (checked): m = 0.50 kg; the two springs together act like one spring with k = 4.9 N m⁻¹.
   ω² = k/m = 4.9 / 0.50 = 9.8 s⁻², ω = √9.8 = 3.1305 rad s⁻¹ (3.1, or 3.13 to 3 s.f.).
   T = 2π/ω = 2π√(m/k) = 2π√(0.50/4.9) = 2.0071 s (2.0 s); f = 1/T = 0.498 Hz (0.50 Hz).
   Amplitude x₀ = 0.10 m. At x = ±x₀: a = −ω²x = ∓9.8 × 0.10 = ∓0.98 m s⁻².
   (HL) v_max = ωx₀ = 3.1305 × 0.10 = 0.313 m s⁻¹ (0.31). At x = 0.050 m: v = ±ω√(x₀² − x²) = ±3.1305 × √(0.0100 − 0.0025)
   = ±3.1305 × 0.08660 = ±0.271 m s⁻¹ (0.27). Total energy ½mω²x₀² = ½ × 0.50 × 9.8 × 0.10² = 0.0245 J (= ½kx₀²).
   At x = 0.050 m: Eₚ = ½mω²x² = ½ × 0.50 × 9.8 × 0.050² = 0.006125 J (0.0061 J, a quarter of 0.0245 J); Eₖ = 0.0184 J.
   Released from rest at +x₀ at scene time T_REL, so x = x₀ cos ω(t − T_REL) = x₀ sin(ω(t − T_REL) + π/2): φ = π/2.
   The held moments are chosen from the motion: x = +x₀ at T_REL + nT, x = 0 at T_REL + (n + ¼)T and (n + ¾)T,
   x = −x₀ at T_REL + (n + ½)T, x = x₀ cos 60° = 0.050 m at T_REL + (n + ⅙)T. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- the physics ----------
  const M = 0.50, K = 4.9, X0 = 0.10;
  const OM = Math.sqrt(K / M), T = 2 * Math.PI / OM, VMAX = OM * X0, AMAX = OM * OM * X0, ET = 0.5 * K * X0 * X0;
  // No pauses (teacher, 17 November 2026: "extend the animation instead of creating a pause, so that it plays at the
  // same speed"). Two clocks: the STORY clock (captions, fades, which part is shown: the times written in this file)
  // and the MOTION clock, which is the real scene time u and never stops. Where the story used to hold still, it now
  // waits while the glider keeps oscillating at its real speed; after the release every such wait is a whole number
  // of periods, so the glider is back at exactly the same point of its motion when the story carries on, and a faint
  // marker stays at the moment the caption describes. Before the release the extra time makes the pull slower.
  const TS_REL = 12.0;                                                 // the release, on the story clock
  // [story time, extra seconds]: the glider keeps moving through each extra stretch
  const phaseTime = (near, frac) => TS_REL + (Math.round((near - TS_REL) / T - frac) + frac) * T;   // story time at a fraction of a cycle
  const P_X0 = phaseTime(42.1, 0), P_ZERO = phaseTime(54.7, 0.25), P_MX0 = phaseTime(60.6, 0.5);
  const P_ZERO2 = phaseTime(119.8, 0.75), P_HALF1 = phaseTime(124.9, 1 / 6), P_HALF2 = phaseTime(136.9, 1 / 6);
  // (extra periods also go inside captions that would otherwise be read faster than about 17 characters a second)
  const PRE1 = 1.9, PRE2 = 2.2;
  const EXTRA = [[8.4, PRE1], [11.5, PRE2], [18.4, T], [24.0, T], [29.2, T], [34.5, 2 * T], [40.0, T], [P_X0, T], [52.0, 3 * T], [P_ZERO, T], [P_MX0, T],
    [68.0, 3 * T], [73.2, T], [84.0, T], [89.2, T], [95.0, T], [99.4, T], [106.0, T], [111.2, T], [116.6, T], [P_ZERO2, T], [P_HALF1, T],
    [P_HALF2, T]].sort((a, b) => a[0] - b[0]);
  const storyAt = (u) => {                                             // real scene time → story time
    let acc = 0;
    for (const [p, e] of EXTRA) { if (u < p + acc) return u - acc; if (u < p + acc + e) return p; acc += e; }
    return u - acc;
  };
  const realAt = (st) => st + EXTRA.filter((x) => x[0] < st).reduce((n, x) => n + x[1], 0);   // story time → real time
  const PRE = PRE1 + PRE2;                                             // extra time before the release
  // the motion, on the real clock: at rest, a slow pull to +x₀, held for 1 s, then released
  const T_REL = TS_REL + PRE, T_PULL0 = 8.6 + PRE1, T_PULL1 = T_REL - 1.0;
  const xAt = (u) => u < T_PULL0 ? 0 : u < T_PULL1 ? X0 * smooth((u - T_PULL0) / (T_PULL1 - T_PULL0)) : u < T_REL ? X0 : X0 * Math.cos(OM * (u - T_REL));
  const vAt = (u) => u < T_REL ? 0 : -OM * X0 * Math.sin(OM * (u - T_REL));
  const aAt = (u) => u < T_REL ? 0 : -OM * OM * xAt(u);
  const P_CYCLE = realAt(phaseTime(20, 0));                            // the oscillation that is timed (real clock)
  // the moments the captions describe, with a faint marker left there while the glider moves on
  const MOMENTS = [[P_X0, 'x = +0.10 m', 'a = −0.98'], [P_ZERO, 'x = 0', 'a = 0'], [P_MX0, 'x = −0.10 m', 'a = +0.98'],
    [P_ZERO2, '', ''], [P_HALF1, '', ''], [P_HALF2, '', '']].map(([p, lx, la]) => ({ p, u: realAt(p), e: T, lx, la }));
  const DURATION_U = 152 + EXTRA.reduce((n, x) => n + x[1], 0);

  const T_HL = 100.6, END = 140.0, DURATION = 152;
  const CAPS = [
    [4.6, 9.4, 'A 0.50 kg glider on a frictionless air track, between two springs. At rest, it sits at the equilibrium position.'],
    [9.6, 13.8, 'Pull it 0.10 m to the right and let go. There is no friction, and air resistance is negligible (no damping).'],
    [14.0, 19.0, 'It oscillates about the equilibrium position. Its amplitude, x₀ = 0.10 m, is the maximum displacement.'],
    [19.2, 24.6, 'One complete oscillation, there and back, takes one time period: T = 2.0 s, so f = 1/T = 0.50 Hz.'],
    [24.8, 29.8, 'The springs pull it back towards equilibrium: a restoring force, proportional to the displacement.'],
    [30.0, 35.0, 'So its acceleration is proportional to x too: a = −ω²x. The minus sign: a always points opposite to x, back towards equilibrium.'],
    [35.2, 40.6, 'The two springs act like one spring with k = 4.9 N m⁻¹, so ω² = k/m = 4.9 ÷ 0.50 = 9.8 s⁻², and ω = 3.1 rad s⁻¹.'],
    [40.8, 45.6, 'At x = +0.10 m: a = −ω²x = −9.8 × 0.10 = −0.98 m s⁻². The acceleration is greatest here, pointing left.'],
    [45.8, 52.8, 'Predict: where is the glider moving fastest? And where is its acceleration greatest?'],
    [53.0, 58.0, 'Fastest as it passes through equilibrium. There x = 0, so a = 0: no resultant force.'],
    [58.2, 63.4, 'At each end it stops for an instant, and its acceleration is greatest (at x = −0.10 m, a = +0.98 m s⁻²).'],
    [63.6, 68.4, 'The graphs: x, v and a vary sinusoidally with the same period. Each is a quarter of a cycle out of step with the next, so a and x are half a cycle apart.'],
    [68.6, 73.8, 'v is the gradient of the x–t graph, and a is the gradient of the v–t graph, just as in A.1.'],
    [74.0, 79.0, 'The a–t graph is the x–t graph turned upside down: the minus sign in a = −ω²x again.'],
    [79.2, 84.6, 'T = 2π√(m/k) = 2π√(0.50/4.9) = 2.0 s. With half the amplitude (dashed), the period would be the same.'],
    [84.8, 89.8, 'Energy is transferred back and forth between kinetic energy and elastic potential energy in the springs.'],
    [90.0, 95.4, 'Kinetic energy is greatest at equilibrium, potential energy at the ends. With no friction, the total stays constant.'],
    [95.6, 100.8, 'Each reaches its maximum twice in every oscillation: the energies change at twice the frequency of the motion.'],
    [101.0, 106.4, '(HL) A point moves round a circle of radius x₀ at a constant angular velocity ω. Its shadow moves exactly like the glider.'],
    [106.6, 111.8, '(HL) Timing from the release, the radius turns through an angle ωt, so the displacement is x = x₀ cos ωt.'],
    [112.0, 117.0, '(HL) The data booklet writes x = x₀ sin(ωt + φ). Here the phase angle φ = π/2, since sin(ωt + π/2) = cos ωt.'],
    [117.2, 122.6, '(HL) The point\'s speed round the circle, ωx₀ = 3.13 × 0.10 = 0.31 m s⁻¹, is the glider\'s top speed, at x = 0.'],
    [122.8, 128.4, '(HL) At x = 0.050 m: v = ±ω√(x₀² − x²) = ±3.13 × √(0.10² − 0.050²) = ±0.27 m s⁻¹.'],
    [128.6, 134.0, '(HL) The total energy is ½mω²x₀² = ½ × 0.50 × 9.8 × 0.10² = 0.0245 J.'],
    [134.2, 139.6, '(HL) At x = 0.050 m the potential energy is ½mω²x² = 0.0061 J: only a quarter of the total, because it is proportional to x².'],
  ];

  // ---------- colours ----------
  const XC = C.good, VC = C.vel, AC = C.force, EK = C.vel, EP = C.field, STEEL = '170,182,220', HLC = '255,170,85';

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W * 0.9;
    const capFs = clamp(W / 44, 15, 25), capTop = H - capFs * (phone ? 6.6 : 5.4);
    const fs = phone ? 10 : Math.round(clamp(W / 80, 11, 16));
    let o;
    if (!phone) {
      const R = Math.min(0.105 * W, 0.16 * H), gwid = Math.min(0.09 * W, 0.15 * H), gh = gwid * 0.55;
      const lx0 = W * 0.03, lx1 = W * 0.58, trackY = H * 0.045 + 2 * R + gh + fs * 3.2;
      o = { R, gwid, gh, lx0, lx1, cx: (lx0 + lx1) / 2, trackSL: trackY, trackHL: trackY,
        gx0: W * 0.64 + fs * 2.8, gx1: W * 0.965, gy0: Math.max(H * 0.05, 50), gy1: capTop - fs * 2.3 };   // gy0: room for the buttons
    } else {
      const R = 0.2 * W, gwid = 0.17 * W, gh = gwid * 0.55;
      o = { R, gwid, gh, lx0: 4, lx1: W - 4, cx: W / 2, trackSL: fs * 4.8 + gh, trackHL: 8 + 2 * R + gh + fs * 3.2,
        gx0: fs * 3.4, gx1: W - 6, gy1: capTop - fs * 2.2 };
      o.gy0 = o.trackSL + fs * 3.6;
    }
    L = { W, H, phone, fs, capTop, ...o, ppm: o.R / X0, beam: Math.max(6, o.gh * 0.3) };
  }
  const hlMix = (t) => smooth((t - 99.6) / 1.8);
  const trackY = (t) => lerp(L.trackSL, L.trackHL, hlMix(t));
  const sceneA = (t) => smooth((t - 4.4) / 0.8) * (1 - smooth((t - END) / 0.8));

  // text made of pieces: [text, style], style 'i' italic serif, 'r' upright serif, 's' subscript, 'sans'
  function rich(s, parts, x, y, size, a, rgb = C.text, align = 'center') {
    const { g } = s; if (a <= 0) return 0;
    const font = (st) => st === 's' ? D.serif(Math.round(size * 0.7)) : st === 'i' ? D.serif(size) : st === 'r' ? D.serif(size, false) : D.sans(Math.round(size * 0.9));
    const ws = parts.map(([tx, st]) => { g.font = font(st); return g.measureText(tx).width; });
    const total = ws.reduce((p, q) => p + q, 0);
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`;
    parts.forEach(([tx, st], i) => { g.font = font(st); g.fillText(tx, px, st === 's' ? y + size * 0.28 : y); px += ws[i]; });
    g.shadowBlur = 0;
    return total;
  }
  const sgn = (v, dp) => (v < -0.5 * Math.pow(10, -dp) ? '−' : '+') + Math.abs(v).toFixed(dp);

  // ---------- the air track, springs and glider ----------
  function drawTrack(s, t, A, u) {
    if (A <= 0) return;
    const { g } = s, { lx0, lx1, cx, gwid, gh, beam, fs, R, ppm } = L, ty = trackY(t), x = xAt(u), gxc = cx + x * ppm;
    const top = ty - gh;
    g.globalAlpha = A;
    // the beam, with its rows of air holes
    const bg = g.createLinearGradient(0, ty, 0, ty + beam);
    bg.addColorStop(0, 'rgba(120,132,180,1)'); bg.addColorStop(1, 'rgba(46,54,96,1)');
    g.fillStyle = bg; g.fillRect(lx0, ty, lx1 - lx0, beam);
    D.line(s, lx0, ty, lx1, ty, '215,225,255', 0.7 * A, 1);
    g.fillStyle = 'rgba(10,14,30,0.85)';
    for (let hx = lx0 + fs * 1.6; hx < lx1 - fs * 1.2; hx += Math.max(8, fs * 1.1)) { g.beginPath(); g.arc(hx, ty + beam * 0.5, Math.max(1, beam * 0.13), 0, 7); g.fill(); }
    // end stands
    const ww = Math.max(6, gwid * 0.12), wy0 = ty - gh * 1.15;
    for (const wx of [lx0, lx1 - ww]) {
      const wg = g.createLinearGradient(wx, 0, wx + ww, 0);
      wg.addColorStop(0, 'rgba(70,82,140,1)'); wg.addColorStop(1, 'rgba(40,48,90,1)');
      g.fillStyle = wg; g.fillRect(wx, wy0, ww, ty + beam - wy0);
    }
    g.globalAlpha = 1;
    // marks: equilibrium and ±x₀ (dashed), drawn behind the glider
    const yb = ty + beam;
    const eqA = A * smooth((t - 4.6) / 0.8);
    D.line(s, cx, top - fs * 3.0, cx, yb + fs * 1.0, C.muted, 0.55 * eqA, 1.2, [5, 5]);
    D.text(s, 'equilibrium', cx, top - fs * 3.6, fs, 0.8 * eqA * (1 - smooth((t - 99.5) / 0.8)), D.sans(fs), C.muted);
    const ampA = A * smooth((t - 14.0) / 0.8);
    for (const sg of [-1, 1]) D.line(s, cx + sg * R, top - fs * 0.3, cx + sg * R, yb + fs * 1.0, XC, 0.45 * ampA, 1, [3, 5]);
    rich(s, [['+', 'r'], ['x', 'i'], ['0', 's']], cx + R, yb + fs * 1.75, fs + 1, 0.9 * ampA, XC);
    rich(s, [['−', 'r'], ['x', 'i'], ['0', 's']], cx - R, yb + fs * 1.75, fs + 1, 0.9 * ampA, XC);
    rich(s, [['0', 'r']], cx, yb + fs * 1.75, fs + 1, 0.8 * eqA, C.muted);
    // displacement arrow under the beam
    if (ampA > 0 && Math.abs(x) * ppm > 6) {
      D.arrow(s, cx, yb + fs * 0.62, gxc, yb + fs * 0.62, XC, ampA, '', { width: 2.2, head: Math.min(9, fs * 0.7), blur: 6 });
      if (Math.abs(x) * ppm > fs * 2.2) rich(s, [['x', 'i']], (cx + gxc) / 2, yb + fs * 1.75, fs + 2, ampA, XC);
    }
    // springs: helices from the stands to the glider
    const ys = ty - gh * 0.42, rr = gh * 0.27;
    const spring = (xa, xb) => {
      const pts = [], n = 260, N = 13, lead = Math.min(10, (xb - xa) * 0.08);
      pts.push([xa, ys]);
      // a helix seen from the side: the coil starts and ends on the axis (sin), leaning slightly as it turns
      for (let i = 0; i <= n; i++) { const u = i / n, ph = 2 * Math.PI * N * u; pts.push([xa + lead + u * (xb - xa - 2 * lead) + rr * 0.32 * (1 - Math.cos(ph)), ys - rr * Math.sin(ph)]); }
      pts.push([xb, ys]);
      D.glowLine(s, pts, STEEL, 0.75 * A, Math.max(1, gh * 0.03));
    };
    spring(lx0 + ww, gxc - gwid / 2);
    spring(gxc + gwid / 2, lx1 - ww);
    // the glider: an inverted-U body riding on a cushion of air, with a card on top
    g.globalAlpha = A;
    const b0 = ty - 2, b1 = ty - gh * 0.72, hw = gwid / 2, tw = gwid * 0.39;
    const body = g.createLinearGradient(0, b1, 0, b0);
    body.addColorStop(0, 'rgba(150,170,235,1)'); body.addColorStop(0.5, 'rgba(84,100,170,1)'); body.addColorStop(1, 'rgba(44,52,104,1)');
    g.fillStyle = body; g.beginPath();
    g.moveTo(gxc - hw, b0); g.lineTo(gxc - tw, b1); g.lineTo(gxc + tw, b1); g.lineTo(gxc + hw, b0); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(210,222,255,0.85)'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = 'rgba(235,240,255,0.95)'; g.fillRect(gxc - gwid * 0.04, top, gwid * 0.08, gh * 0.28);  // the card
    g.fillStyle = 'rgba(40,48,90,1)'; g.fillRect(gxc - hw * 0.25, b1 + gh * 0.16, hw * 0.5, Math.max(2, gh * 0.08));
    g.globalAlpha = 1;
    // a faint air cushion under the glider
    D.line(s, gxc - hw + 2, ty - 1, gxc + hw - 2, ty - 1, '180,210,255', 0.35 * A, 1);
    // arrows above the glider: velocity (blue) and the restoring force / acceleration (orange)
    const vA = A * smooth((t - 14.0) / 0.8), aA = A * smooth((t - 24.8) / 0.8);
    const yv = top - fs * 1.05, ya = top - fs * 2.35, v = vAt(u), ac = aAt(u);
    const arrowLab = (x1, y, len, rgb, al, parts) => {
      if (Math.abs(len) < 5 || al <= 0) return;
      D.arrow(s, x1, y, x1 + len, y, rgb, al, '', { width: 2.4, head: Math.min(11, fs * 0.8), blur: 8 });
      if (Math.abs(len) > fs * 0.9) rich(s, parts, x1 + len + Math.sign(len) * fs * 0.85, y, fs + 3, al, rgb);
    };
    arrowLab(gxc, yv, v / VMAX * R * 0.95, VC, vA, [['v', 'i']]);
    const la = ac / AMAX * R * 0.95, fa = smooth((t - 30.0) / 0.8);
    arrowLab(gxc, ya, la, AC, aA * (1 - fa), [['F', 'i']]);
    arrowLab(gxc, ya, la, AC, aA * fa, [['a', 'i']]);
    return { gxc, top };
  }

  // a faint glider left at the moment a caption describes, while the real one carries on oscillating
  const momentA = (m, u) => fade(u, m.u - 0.15, m.u + m.e + 0.6, 0.3, 0.6);
  function drawGhosts(s, t, A, u) {
    if (A <= 0) return;
    const { g } = s, { cx, gwid, gh, ppm } = L, ty = trackY(t);
    for (const m of MOMENTS) {
      const a = A * momentA(m, u); if (a <= 0) continue;
      const gx = cx + xAt(m.u) * ppm, b0 = ty - 2, b1 = ty - gh * 0.72, hw = gwid / 2, tw = gwid * 0.39;
      g.globalCompositeOperation = 'source-over';
      g.setLineDash([4, 4]); g.strokeStyle = `rgba(${C.light},${0.75 * a})`; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(gx - hw, b0); g.lineTo(gx - tw, b1); g.lineTo(gx + tw, b1); g.lineTo(gx + hw, b0); g.closePath(); g.stroke();
      g.setLineDash([]);
      g.fillStyle = `rgba(${C.light},${0.12 * a})`; g.fill();
    }
  }

  // the timed oscillation: a stopwatch at the top of the track area
  function drawTimer(s, t, A, u) {
    const a = A * fade(t, 19.2, 24.6, 0.6, 0.6); if (a <= 0) return;
    const { fs, lx1, gh } = L, el = clamp(u - P_CYCLE, 0, T);
    const done = u >= P_CYCLE + T;
    // tenths while it runs, then the period to 2 s.f., as in the caption
    D.text(s, done ? 'one oscillation: T = 2.0 s' : `one oscillation: ${el.toFixed(1)} s`, lx1 - fs * 0.6, trackY(t) - gh - fs * 3.6, fs + 1, a, D.sans(fs + 1, done ? 600 : 400), done ? C.light : C.text, 'right');
  }

  // ---------- the graphs ----------
  const GR = [
    { f: xAt, max: X0, rgb: XC, sym: 'x', unit: ' / m', dp: 3, tick: '0.10', from: T_PULL0 },
    { f: vAt, max: VMAX, rgb: VC, sym: 'v', unit: ' / m s⁻¹', dp: 2, tick: '0.31', from: T_REL },
    { f: aAt, max: AMAX, rgb: AC, sym: 'a', unit: ' / m s⁻²', dp: 2, tick: '0.98', from: T_REL },
  ];
  const WIN = 5.0;                                                     // seconds of trace left of the pen
  function drawGraphs(s, t, A, u) {
    if (A <= 0) return;
    const { g } = s, { gx0, gx1, gy0, gy1, fs, phone } = L;
    const hh = (gy1 - gy0) / 3, penX = gx0 + 0.86 * (gx1 - gx0), kt = (penX - gx0) / WIN;
    const X = (tt) => penX - (u - tt) * kt;
    const boxes = [];
    GR.forEach((gr, i) => {
      const y0 = gy0 + i * hh, py0 = y0 + fs * 1.5, py1 = y0 + hh - fs * 0.5, mid = (py0 + py1) / 2, ky = (py1 - py0) / 2 / (gr.max * 1.18);
      const Y = (v) => mid - v * ky;
      boxes.push({ y0, py0, py1, Y, ky });
      // header: the quantity and its live value
      rich(s, [[gr.sym, 'i'], [gr.unit, 'sans']], gx0, y0 + fs * 0.65, fs + 1, 0.9 * A, gr.rgb, 'left');
      const val = gr.f(u);
      rich(s, [[gr.sym, 'i'], [` = ${sgn(val, gr.dp)}`, 'sans']], gx1, y0 + fs * 0.65, fs + 1, 0.9 * A, gr.rgb, 'right');
      // axes
      D.line(s, gx0, py0, gx0, py1, C.muted, 0.55 * A, 1.1);
      D.line(s, gx0, mid, gx1, mid, C.muted, 0.45 * A, 1);
      for (const sg of [1, -1]) {
        D.line(s, gx0 - 3, Y(sg * gr.max), gx1, Y(sg * gr.max), C.muted, 0.12 * A, 1, [3, 5]);
        D.text(s, (sg > 0 ? '' : '−') + gr.tick, gx0 - 4, Y(sg * gr.max), fs - (phone ? 0 : 1), 0.7 * A, D.sans(fs - (phone ? 0 : 1)), C.muted, 'right');
      }
      // time ticks: seconds since the release
      for (let k = Math.max(0, Math.ceil(u - WIN - T_REL)); T_REL + k <= u + (gx1 - penX) / kt; k++) {
        const xx = X(T_REL + k); if (xx < gx0 + 1 || xx > gx1) continue;
        D.line(s, xx, mid - 3, xx, mid + 3, C.muted, 0.5 * A, 1);
        if (i === 2 && xx < gx1 - fs * 3.6) D.text(s, String(k), xx, py1 + fs * 0.75, fs - (phone ? 0 : 1), 0.65 * A, D.sans(fs - (phone ? 0 : 1)), C.muted);
      }
      // the trace up to the pen
      const t0 = Math.max(gr.from, u - WIN);
      if (u > t0) {
        const pts = [], n = 220;
        for (let j = 0; j <= n; j++) { const tt = lerp(t0, u, j / n); pts.push([X(tt), Y(gr.f(tt))]); }
        D.glowLine(s, pts, gr.rgb, A, phone ? 1.5 : 1.9);
        D.glowDot(s, penX, Y(val), phone ? 9 : 12, gr.rgb, A);
      }
    });
    if (A > 0) {
      D.text(s, 't / s', gx1, boxes[2].py1 + fs * 0.75, fs - (phone ? 0 : 1), 0.7 * A, D.sans(fs - (phone ? 0 : 1)), C.muted, 'right');
      D.line(s, penX, boxes[0].py0, penX, boxes[2].py1, C.white, 0.18 * A, 1, [2, 4]);
    }
    // the moment a caption describes: a ring on each trace, which scrolls away with the trace
    for (const m of MOMENTS) {
      const a = A * momentA(m, u), xx = X(m.u); if (a <= 0 || xx < gx0 + 2) continue;
      GR.forEach((gr, i) => {
        const yy = boxes[i].Y(gr.f(m.u));
        g.strokeStyle = `rgba(${C.light},${0.9 * a})`; g.lineWidth = 1.6; g.beginPath(); g.arc(xx, yy, phone ? 5 : 7, 0, 7); g.stroke();
        const lab = i === 0 ? m.lx : i === 2 ? m.la : '';
        if (lab) D.text(s, lab, xx - (phone ? 7 : 10), yy + (gr.f(m.u) >= 0 ? fs * 0.9 : -fs * 0.9), fs - (phone ? 1 : 0), a, D.sans(fs - (phone ? 1 : 0), 600), C.light, 'right');
      });
    }
    // tangents: gradient of x–t is v, gradient of v–t is a
    const tg = A * fade(t, 68.6, 73.8, 0.6, 0.6);
    if (tg > 0) {
      [[0, vAt(u), VC, 'gradient = v'], [1, aAt(u), AC, 'gradient = a']].forEach(([i, slope, rgb, lab]) => {
        const b = boxes[i], dx = kt, dy = -slope * b.ky, len = Math.hypot(dx, dy), half = (gx1 - gx0) * 0.1;
        const ux = dx / len * half, uy = dy / len * half, y = b.Y(GR[i].f(u));
        // kept inside its own graph (clipped), with its label in the middle of the graph's header line,
        // between the quantity on the left and the live value on the right
        g.save(); g.beginPath(); g.rect(gx0, b.py0, gx1 - gx0, b.py1 - b.py0); g.clip();
        D.line(s, penX - ux, y - uy, penX + ux, y + uy, rgb, 0.95 * tg, 2);
        g.restore();
        D.text(s, lab, (gx0 + gx1) / 2, b.y0 + fs * 0.65, fs, tg, D.sans(fs, 600), rgb);
      });
    }
    // half the amplitude: the same period
    const ha = A * fade(t, 79.2, 84.6, 0.6, 0.6);
    if (ha > 0) {
      const b = boxes[0], t0 = Math.max(T_REL, u - WIN);
      g.save(); g.setLineDash([5, 5]); g.strokeStyle = `rgba(${XC},${0.85 * ha})`; g.lineWidth = 1.6; g.beginPath();
      for (let j = 0; j <= 160; j++) { const tt = lerp(t0, u, j / 160), xx = X(tt), yy = b.Y(0.5 * X0 * Math.cos(OM * (tt - T_REL))); j ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
      g.stroke(); g.restore();
    }
  }

  // ---------- energy bars ----------
  function drawEnergy(s, t, A, u) {
    if (A <= 0) return;
    const { g } = s, { fs, phone, lx0, lx1, beam, capTop } = L;
    const ey0 = trackY(t) + beam + fs * 2.6 + (phone ? fs * 0.6 : 0), ey1 = capTop - fs * 0.4;
    const rowH = (ey1 - ey0) / 3, bh = Math.max(5, Math.min(rowH * 0.55, fs * 1.15));
    const numA = A * smooth((t - 128.6) / 0.8), compact = phone || rowH < fs * 1.6;   // short rows: short labels
    const lw = compact ? fs * 3.6 : fs * 6.2, nw = fs * 5.4, bx = lx0 + fs * 0.4 + lw, bw = lx1 - fs * 0.4 - nw - bx;
    const v = vAt(u), x = xAt(u), ek = 0.5 * M * v * v, ep = 0.5 * K * x * x;
    const rows = [
      [[['E', 'i'], ['k', 's'], compact ? ['', 'sans'] : ['  kinetic', 'sans']], [[ek, EK]], ek],
      [[['E', 'i'], ['p', 's'], compact ? ['', 'sans'] : ['  potential', 'sans']], [[ep, EP]], ep],
      [[['total', 'sans']], [[ek, EK], [ep, EP]], ek + ep],
    ];
    rows.forEach(([lab, parts, tot], i) => {
      const y = ey0 + rowH * (i + 0.5);
      rich(s, lab, lx0 + fs * 0.4, y, compact && !phone ? fs : fs + 2, 0.9 * A, i === 2 ? C.text : parts[0][1], 'left');
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = `rgba(255,255,255,${0.06 * A})`; g.fillRect(bx, y - bh / 2, bw, bh);
      let xx = bx;
      for (const [e, rgb] of parts) {
        const w = bw * clamp(e / ET, 0, 1); if (w < 0.3) continue;
        g.fillStyle = `rgba(${rgb},${0.9 * A})`; g.shadowColor = `rgba(${rgb},${0.7 * A})`; g.shadowBlur = 8;
        g.fillRect(xx, y - bh / 2, w, bh); g.shadowBlur = 0; xx += w;
      }
      if (i === 2) { g.strokeStyle = `rgba(255,255,255,${0.6 * A})`; g.lineWidth = 1.2; g.strokeRect(bx, y - bh / 2, bw, bh); }
      if (numA > 0) D.text(s, `${tot.toFixed(4)} J`, bx + bw + fs * 0.6, y, fs, numA, D.sans(fs), i === 2 ? C.text : parts[0][1], 'left');
    });
  }

  // ---------- (HL) the reference circle ----------
  function drawCircle(s, t, A, top, u) {
    if (A <= 0) return;
    const { g } = s, { cx, R, fs, ppm } = L, cy = top - fs * 3.2 - R, th = OM * Math.max(0, u - T_REL);
    const ring = []; for (let i = 0; i <= 120; i++) { const u = i / 120 * Math.PI * 2; ring.push([cx + R * Math.cos(u), cy - R * Math.sin(u)]); }
    D.glowLine(s, ring, '190,200,255', 0.5 * A, 1.2);
    D.line(s, cx - R - fs * 0.6, cy, cx + R + fs * 0.6, cy, C.muted, 0.35 * A, 1, [4, 5]);
    const px = cx + R * Math.cos(th), py = cy - R * Math.sin(th);
    D.line(s, cx, cy, px, py, '220,228,255', 0.75 * A, 1.4);
    // the angle from the horizontal
    const am = ((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), ar = R * 0.3;
    g.strokeStyle = `rgba(${C.light},${0.8 * A})`; g.lineWidth = 1.4; g.beginPath(); g.arc(cx, cy, ar, 0, -am, true); g.stroke();
    if (am > 0.5) rich(s, [['ωt', 'i']], cx + ar * 1.6 * Math.cos(am / 2), cy - ar * 1.6 * Math.sin(am / 2), fs + 2, A * smooth((am - 0.5) / 0.3), C.light);
    // the shadow: straight down to the glider
    D.line(s, px, py, px, top, C.light, 0.55 * A, 1.2, [3, 4]);
    D.glowDot(s, px, py, fs * 1.5, C.light, A);
    D.glowDot(s, px, top, fs * 0.9, C.light, 0.8 * A);
    rich(s, [['x', 'i'], ['0', 's']], cx + R * 0.5, cy + fs * 0.85, fs + 1, 0.8 * A, C.muted);
    // the HL label
    const tx = cx + R + fs * 1.4, ty = cy - R + fs * 0.6;
    g.font = D.sans(fs, 700); const w = g.measureText('HL').width + fs;
    g.fillStyle = `rgba(${HLC},${0.85 * A})`; g.beginPath(); g.roundRect(tx - w / 2, ty - fs * 0.75, w, fs * 1.5, fs * 0.4); g.fill();
    D.text(s, 'HL', tx, ty, fs, A, D.sans(fs, 700), '30,18,6');
    // the point's velocity, and its horizontal part (the glider's velocity)
    // The full velocity (tangent, length ωx₀ on the glider's scale) shows only around the hold at x = 0, while the point
    // is in the lower half of the circle, so it never runs off the top of the picture; the horizontal part stays on.
    const va = A * fade(t, 117.2, 128.4, 0.6, 0.6), ta = A * fade(t, P_ZERO2 - 0.5, P_ZERO2 + 0.5, 0.4, 0.4) * smooth((-Math.sin(th) - 0.7) / 0.25);   // near the bottom only, where it stays in the picture
    if (va > 0) {
      const len = R * 0.95, ux = -Math.sin(th), uy = -Math.cos(th);
      if (ta > 0) {
        D.arrow(s, px, py, px + ux * len, py + uy * len, '190,210,255', 0.55 * ta, '', { width: 1.8, head: 9, blur: 4 });
        D.line(s, px + ux * len, py, px + ux * len, py + uy * len, '190,210,255', 0.4 * ta, 1, [2, 3]);
        rich(s, [['ωx', 'i'], ['0', 's']], px + ux * len * 1.12, py + uy * len * 1.12 + (uy > -0.2 ? fs * 0.7 : -fs * 0.5), fs + 1, 0.8 * ta, '190,210,255');
      }
      if (Math.abs(ux * len) > 6) D.arrow(s, px, py, px + ux * len, py, VC, va, '', { width: 2.4, head: 10, blur: 8 });
      if (Math.abs(ux * len) > fs * 1.2) rich(s, [['v', 'i']], px + ux * len + Math.sign(ux) * fs * 0.8, py - (ta > 0.5 ? fs * 0.9 : 0), fs + 2, va, VC);
    }
    return ppm;
  }

  // (HL) the point on the circle left at the moment a caption describes, while the real point carries on round
  function drawCircleGhosts(s, t, A, top, u) {
    if (A <= 0) return;
    const { cx, R, fs } = L, cy = top - fs * 3.2 - R;
    for (const m of MOMENTS) {
      const a = A * momentA(m, u); if (a <= 0 || m.p < T_HL) continue;
      const th = OM * (m.u - T_REL), px = cx + R * Math.cos(th), py = cy - R * Math.sin(th);
      D.line(s, cx, cy, px, py, C.light, 0.45 * a, 1.2, [3, 4]);
      s.g.strokeStyle = `rgba(${C.light},${0.85 * a})`; s.g.lineWidth = 1.6; s.g.beginPath(); s.g.arc(px, py, fs * 0.75, 0, 7); s.g.stroke();
    }
  }

  // ---------- end card ----------
  function endCard(s, t) {
    const a = fade(t, END, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 34, 17, 34)), s2 = Math.round(clamp(W / 34, 16, 34)), s3 = Math.round(clamp(W / 60, 11, 17));
    g.font = D.sans(s1, 300);
    const l1 = D.wrap(s, 'SHM: the acceleration is proportional to the displacement, and always towards equilibrium', W - 48);
    let y = H * (phone ? 0.11 : 0.15);
    D.text(s, l1, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * l1.length + s2 * 0.4;
    const SL = [
      [['a', 'i'], [' = −', 'r'], ['ω', 'i'], ['²', 'r'], ['x', 'i']],
      [['T', 'i'], [' = 1/', 'r'], ['f', 'i'], [' = 2π/', 'r'], ['ω', 'i']],
      [['T', 'i'], [' = 2π√(', 'r'], ['m', 'i'], ['/', 'r'], ['k', 'i'], [')', 'r']],
      [['T', 'i'], [' = 2π√(', 'r'], ['l', 'i'], ['/', 'r'], ['g', 'i'], [')', 'r']],
    ];
    const HLs = [
      [['x', 'i'], [' = ', 'r'], ['x', 'i'], ['0', 's'], [' sin(', 'r'], ['ωt', 'i'], [' + ', 'r'], ['φ', 'i'], [')', 'r']],
      [['v', 'i'], [' = ±', 'r'], ['ω', 'i'], ['√(', 'r'], ['x', 'i'], ['0', 's'], ['² − ', 'r'], ['x', 'i'], ['²)', 'r']],
      [['E', 'i'], ['T', 's'], [' = ½', 'r'], ['mω', 'i'], ['²', 'r'], ['x', 'i'], ['0', 's'], ['²', 'r']],
    ];
    const notes = ['defining equation', 'period', 'mass–spring', 'pendulum (small swings)'];
    if (phone) {
      for (let i = 0; i < SL.length; i++) { rich(s, SL[i], W / 2, y, s2, a); D.text(s, notes[i], W / 2, y + s2 * 0.85, s3, 0.6 * a, D.sans(s3), C.muted); y += s2 * 2.05; }
      y += s2 * 0.1;
      D.text(s, 'HL', W / 2, y, s3, a, D.sans(s3, 700), HLC); y += s2 * 0.9;
      for (const e of HLs) { rich(s, e, W / 2, y, Math.round(s2 * 0.9), a, C.text); y += s2 * 1.2; }
    } else {
      SL.forEach((e, i) => {
        const x = W * (0.5 + (i - 1.5) * 0.235);
        rich(s, e, x, y, s2, a); D.text(s, notes[i], x, y + s2 * 0.95, s3, 0.6 * a, D.sans(s3), C.muted);
      });
      y += s2 * 2.7;
      D.text(s, 'HL', W / 2, y, s3 + 1, a, D.sans(s3 + 1, 700), HLC); y += s2 * 1.2;
      HLs.forEach((e, i) => rich(s, e, W * (0.5 + (i - 1) * 0.3), y, s2, a, C.text));
      y += s2 * 1.6;
    }
    g.font = D.sans(s3);
    D.text(s, D.wrap(s, 'With no damping, each form of energy reaches its maximum twice per cycle, and the total stays constant.', Math.min(W - 40, 760)), W / 2, Math.max(y + s3, H * (phone ? 0.86 : 0.82)), s3, 0.7 * a, D.sans(s3), C.muted);
  }

  Anim.register('shm', {
    duration: DURATION_U,
    poster: realAt(70),
    // no pauses: see EXTRA near the top (the story waits while the glider keeps moving)
    // score: steady and swaying (D-flat lydian, a soft sine pad that swells once per period of the glider, a low drone)
    music: { chords: [[49, 56, 60, 63, 67], [51, 58, 61, 65], [53, 60, 63, 68], [46, 53, 56, 61]], bar: 8, pad: 'sine', cutoff: 900, tremolo: 1 / T, drone: 0.1, volume: 0.38 },
    resize: layout,
    // for checking the numbers (not used by the player)
    info: { M, K, X0, OM, T, VMAX, AMAX, ET, xAt, vAt, aAt, CAPS, EXTRA, storyAt, realAt, MOMENTS, T_REL, TS_REL, DURATION_U, P_X0, P_ZERO, P_MX0, P_ZERO2, P_HALF1, P_HALF2, P_CYCLE },
    frame(s, u) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      const t = storyAt(u);
      const A = sceneA(t);
      D.background(s, 0.22);
      const hlA = A * smooth((t - T_HL) / 1.4);
      const gA = A * smooth((t - 11.6) / 0.9) * (L.phone ? 1 - smooth((t - 84.0) / 1.2) : 1);
      const eA = A * smooth((t - 84.8) / 1.0);
      drawGraphs(s, t, gA, u);
      drawEnergy(s, t, eA, u);
      drawGhosts(s, t, A, u);
      const gl = drawTrack(s, t, A, u);
      if (gl) { drawCircle(s, t, hlA, gl.top, u); drawCircleGhosts(s, t, hlA, gl.top, u); }
      drawTimer(s, t, A, u);
      const leg = [['arrow', VC, 'velocity v'], ['arrow', AC, 'restoring force F, acceleration a'], ['line', XC, 'displacement x']];
      D.legend(s, t < 24.8 ? leg.filter((_, i) => i !== 1) : leg, A * fade(t, 14.0, 99.8, 0.8, 0.8));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Simple harmonic motion', 'Why does it oscillate, and why the minus sign in a = −ω²x?');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
