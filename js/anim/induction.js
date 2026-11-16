/* D.4 Induction (HL): a magnet pushed into and pulled out of a coil, a magnet falling through a coil, and an ac generator.
   The model and every number (checked):
   - The bar magnet (5.0 cm long) is modelled as two point poles, +q (N) and −q (S), at its ends. Its field lines are traced
     step by step from that model. The flux through one circular turn of radius a = 2.0 cm whose plane is a distance h
     along the axis from a pole is (μ0q/2)·sgn(h)·(1 − |h|/√(h² + a²)) (the share of the pole's field passing through the
     turn), plus μ0q when the turn surrounds the magnet (the flux inside the magnet itself), which keeps the flux continuous.
     The coil is 6.0 cm long; 24 sample turns stand for its N turns. So the NΦ–t and ε–t graphs are exact for this model;
     they have no numbers on their axes, because the guide only asks for a qualitative treatment of a magnet and a coil.
   - ε = −d(NΦ)/dt = −(d(NΦ)/dx) × (speed of the magnet). The magnet is pushed in over 16 s and pulled out over 4 s with the
     same smooth motion (x = x0 + Δx(u − sin 2πu / 2π)), so the pull's emf is exactly 16/4 = 4 times bigger and lasts a quarter
     of the time, and the two areas under the ε–t graph (each equal to the change in NΦ) are the same.
   - Falling magnet: released from rest with its centre 10 cm above the coil's centre, g = 9.8 m s⁻², slowed down 40 times; the
     small braking force of the induced current is ignored (the meter's circuit has a high resistance).
     Speed when its centre is 3 cm above the coil's centre: √(2 × 9.8 × 0.07) = 1.17 m s⁻¹; 3 cm below: √(2 × 9.8 × 0.13) = 1.60 m s⁻¹
     (1.36 times faster: √(13/7) = 1.363). It passes the coil's centre after √(2 × 0.10 / 9.8) = 0.143 s (5.7 s on screen) and is 10 cm below after
     √(2 × 0.20 / 9.8) = 0.202 s (8.1 s on screen). NΦ is the same 10 cm above and 10 cm below (the model is symmetric), so the two
     pulses up to that point have equal areas.
   - Generator: N = 100, A = 4.0 × 10⁻³ m², B = 0.20 T: NBA = 100 × 4.0 × 10⁻³ × 0.20 = 0.080 Wb.
     At 50 Hz: T = 1/50 = 0.020 s, a quarter turn takes 0.0050 s, average ε over a quarter turn = 0.080 / 0.0050 = 16 V.
     The graph is drawn from ε = NBAω sin ωt: peak 0.080 × 2π × 50 = 25.1 V at 50 Hz, 50.3 V at 100 Hz (period 0.010 s).
     Slowed down 200 times: one turn takes 4.0 s on screen at 50 Hz, 2.0 s at 100 Hz.
   Signs: NΦ is measured along the direction the magnet's N pole points. A negative ε drives a current whose own field points the
   other way (towards the magnet), so the coil's near end is a N pole (right-hand grip rule). */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- the model of the magnet and the coil (lengths in cm) ----------
  const ML = 5.0, MR = 0.8, CA = 2.0, CL = 6.0, NS = 24;
  const f = (h) => (h === 0 ? 0 : Math.sign(h) * (1 - Math.abs(h) / Math.hypot(h, CA)));
  // flux through one turn at axial position xl; magnet centre xm, its N pole towards +x (units of μ0q/2)
  const phi1 = (xl, xm) => {
    const xn = xm + ML / 2, xs = xm - ML / 2;
    const inside = xl > xs && xl < xn ? 2 : xl === xs || xl === xn ? 1 : 0;
    return f(xl - xn) - f(xl - xs) + inside;
  };
  const lamRaw = (xm) => { let s = 0; for (let i = 0; i < NS; i++) s += phi1(-CL / 2 + CL * (i + 0.5) / NS, xm); return s / NS; };
  const LMAX = lamRaw(0);
  const LAM = (xm) => lamRaw(xm) / LMAX;                                   // flux linkage, 1 = magnet centred in the coil
  const dLAM = (xm) => (LAM(xm + 1e-3) - LAM(xm - 1e-3)) / 2e-3;

  // ---------- timeline ----------
  const X0 = -10, T_REC = 14.8, T_PUSH = 26.0, D_PUSH = 16, T_PULL = 52.6, D_PULL = 4, P1_END = 64.4;
  const S0 = -10, T_DROP = 71.2, SLOW2 = 40, G = 980, P2_G0 = 69.6, P2_G1 = 81.4;
  const T3 = 87.6, T2X = 111.6, NBA = 0.080, WIN3 = 12;
  const END_CARD = 123.0, DURATION = 136;
  const ease = (u) => u - Math.sin(2 * Math.PI * u) / (2 * Math.PI), easeV = (u) => 1 - Math.cos(2 * Math.PI * u);
  // part 1: magnet centre (cm) and velocity (cm per scene second)
  function mag1(t) {
    if (t <= T_PUSH) return [X0, 0];
    if (t < T_PUSH + D_PUSH) { const u = (t - T_PUSH) / D_PUSH; return [X0 * (1 - ease(u)), -X0 / D_PUSH * easeV(u)]; }
    if (t <= T_PULL) return [0, 0];
    if (t < T_PULL + D_PULL) { const u = (t - T_PULL) / D_PULL; return [X0 * ease(u), X0 / D_PULL * easeV(u)]; }
    return [X0, 0];
  }
  // part 2: distance fallen, measured downwards along the coil's axis (cm), and velocity (cm per scene second)
  function mag2(t) {
    if (t <= T_DROP) return [S0, 0];
    const tau = (t - T_DROP) / SLOW2;
    return [S0 + 0.5 * G * tau * tau, G * tau / SLOW2];
  }
  const e1 = (t) => { const [x, v] = mag1(t); return -dLAM(x) * v; };
  const e2 = (t) => { const [x, v] = mag2(t); return -dLAM(x) * v; };
  const l1 = (t) => LAM(mag1(t)[0]), l2 = (t) => LAM(mag2(t)[0]);
  const maxAbs = (fn, a, b) => { let m = 0; for (let i = 0; i <= 2000; i++) m = Math.max(m, Math.abs(fn(a + (b - a) * i / 2000))); return m; };
  const E1MAX = maxAbs(e1, T_PULL, T_PULL + D_PULL), E2MAX = maxAbs(e2, T_DROP, P2_G1);
  const T_STEEP = (() => { let best = T_PUSH, m = 0; for (let i = 0; i <= 2000; i++) { const tt = T_PUSH + D_PUSH * i / 2000, v = Math.abs(e1(tt)); if (v > m) { m = v; best = tt; } } return best; })();
  const T_MID2 = T_DROP + SLOW2 * Math.sqrt(2 * -S0 / G), T_10 = T_DROP + SLOW2 * Math.sqrt(2 * (10 - S0) / G);
  // part 3: the generator
  const theta = (t) => (t <= T2X ? 2 * Math.PI * (t - T3) / 4 : 2 * Math.PI * (T2X - T3) / 4 + 2 * Math.PI * (t - T2X) / 2);
  const omegaReal = (t) => 2 * Math.PI * (t <= T2X ? 50 : 100);
  const l3 = (t) => NBA * Math.cos(theta(t)), e3 = (t) => NBA * omegaReal(t) * Math.sin(theta(t));

  // ---------- captions ----------
  const CAPS = [
    [4.8, 9.6, 'A bar magnet and a coil of many turns, joined to a centre-zero meter. Nothing is moving yet.'],
    [9.8, 14.6, 'The field lines come from a simple model of the magnet. Some of them pass through the coil.'],
    [14.8, 19.0, 'The flux linkage NΦ counts the flux through every turn. The magnet is still, so NΦ is steady and ε = 0.'],
    [19.2, 25.4, 'Predict: the N pole is pushed into the coil. Which end of the coil will the induced current make a N pole?'],
    [26.0, 31.0, 'It is pushed in slowly. The flux linkage increases, so an emf is induced (ε = −N ΔΦ/Δt) and a current flows.'],
    [31.2, 36.2, 'Lenz\'s law: the current makes the near end of the coil a N pole, which repels the approaching magnet.'],
    [36.4, 41.8, 'So you must do work to push the magnet in, and that work becomes electrical energy: Lenz\'s law follows from energy conservation.'],
    [42.2, 47.0, 'Now the magnet is still, inside the coil. The flux linkage is large but steady, so there is no emf.'],
    [47.2, 52.4, 'The emf is minus the gradient of the NΦ–t graph: it was biggest where the flux linkage changed fastest.'],
    [52.6, 57.8, 'Now it is pulled out quickly. The flux linkage falls, so the emf reverses: the near end becomes a S pole, attracting the magnet.'],
    [58.0, 64.0, 'Four times as fast: the emf is four times bigger but lasts a quarter of the time. The shaded areas are equal: the same change in NΦ.'],
    [65.8, 71.0, 'Next, a magnet falls through a vertical coil (slowed down 40 times). The meter\'s high resistance keeps the current, and its braking force, small: it is ignored.'],
    [71.2, 76.0, 'As the N pole falls in, the flux linkage rises: the first pulse.'],
    [76.2, 81.2, 'It leaves faster than it entered, so the second pulse is bigger, shorter and opposite in direction.'],
    [81.4, 86.6, 'The shaded areas are still equal: the flux linkage rises and then falls by the same amount.'],
    [88.0, 93.4, 'An ac generator: a coil turns steadily in a uniform field, so θ = ωt and NΦ = NBA cos ωt (slowed down 200 times).'],
    [93.8, 99.6, 'When the coil faces the field (θ = 0), the flux is greatest but not changing for an instant: ε = 0.'],
    [99.8, 105.0, 'When the plane of the coil is parallel to the field, the flux is zero but changing fastest: ε is greatest.'],
    [105.2, 111.4, 'N = 100, A = 4.0 × 10⁻³ m², B = 0.20 T, so NBA = 0.080 Wb. At 50 Hz a quarter turn takes 0.0050 s: average ε = 0.080 ÷ 0.0050 = 16 V.'],
    [111.8, 117.4, 'Now it turns twice as fast (100 Hz): the flux changes twice as fast, so the peak emf doubles and the period halves.'],
    [117.6, 122.6, 'More turns, a bigger area, a stronger field or faster turning: each gives a bigger emf.'],
  ];
  const PAUSES = [[9.0, 1.4], [14.0, 1.4], [18.4, 2.6], [24.6, 6.0], [30.4, 1.8], [35.0, 1.4], [41.2, 2.6], [46.4, 1.6], [51.8, 1.4],
    [54.6, 2.8], [63.2, 2.4], [70.2, 5.0], [80.6, 1.6], [86.0, 1.0], [92.8, 2.0], [95.6, 2.5], [100.6, 2.0], [110.8, 2.4],
    [116.8, 1.8], [122.0, 0.8]];

  // ---------- colours ----------
  const N_RGB = '235,84,96', S_RGB = '80,130,240', COIL = '214,168,120', CUR = C.good, FLUX = C.field, EMF = C.good;

  // ---------- the magnet's field lines, traced from the two-pole model (in the magnet's own frame, cm) ----------
  const FL = (() => {
    const B = (x, y) => {
      const ax = x - ML / 2, bx = x + ML / 2, r1 = Math.hypot(ax, y) ** 3, r2 = Math.hypot(bx, y) ** 3;
      return [ax / r1 - bx / r2, y / r1 - y / r2];
    };
    const lines = [];
    for (const deg of [9, 22, 38, 56, 78, 106, 140]) for (const sg of [1, -1]) {
      const a0 = deg * Math.PI / 180;
      let x = ML / 2 + 0.3 * Math.cos(a0), y = sg * 0.3 * Math.sin(a0);
      const pts = [[x, y]]; let arrow = -1;
      for (let i = 0; i < 4000; i++) {
        let [u, w] = B(x, y), m = Math.hypot(u, w); const h = 0.07;
        const xh = x + 0.5 * h * u / m, yh = y + 0.5 * h * w / m;
        [u, w] = B(xh, yh); m = Math.hypot(u, w);
        x += h * u / m; y += h * w / m;
        if (i % 3 === 0) pts.push([x, y]);
        if (arrow < 0 && Math.hypot(x - ML / 2, y) > 3.2) arrow = pts.length - 1;
        if (Math.hypot(x + ML / 2, y) < 0.3 || Math.abs(x) > 45 || Math.abs(y) > 30) break;
      }
      lines.push({ pts, arrow });
    }
    return lines;
  })();

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;                          // the 4:5 stage (buttons below the picture)
    const capFs = Math.round(clamp(W / 44, 15, 25));
    const fs = phone ? 10 : Math.round(clamp(W / 80, 11, 16));
    const capTop = H - capFs * (phone ? 6.6 : 5.4);
    let app, gA, gB, app2, g2A, g2B;
    if (!phone) {
      app = { x0: W * 0.03, x1: W * 0.58, y0: H * 0.18, y1: capTop - fs };
      const gx0 = W * 0.61, gx1 = W * 0.975, gy0 = Math.max(58, H * 0.14), gy1 = capTop - fs * 0.5, mid = (gy0 + gy1) / 2;
      gA = { x0: gx0, x1: gx1, y0: gy0, y1: mid - fs * 0.5 };
      gB = { x0: gx0, x1: gx1, y0: mid + fs * 0.5, y1: gy1 };
      app2 = { x0: W * 0.03, x1: W * 0.58, y0: fs * 0.6, y1: capTop - fs * 0.4 }; g2A = gA; g2B = gB;   // the vertical coil gets the full height (no legend in part 2)
    } else {
      app = { x0: 4, x1: W - 4, y0: 6, y1: H * 0.43 };
      const gy0 = H * 0.445, gy1 = capTop - 4, mid = (gy0 + gy1) / 2;
      gA = { x0: 6, x1: W - 6, y0: gy0, y1: mid - 3 };
      gB = { x0: 6, x1: W - 6, y0: mid + 3, y1: gy1 };
      app2 = { x0: 2, x1: W * 0.4, y0: 6, y1: capTop - 4 };
      const m2 = (6 + capTop - 4) / 2;
      g2A = { x0: W * 0.42, x1: W - 6, y0: 6, y1: m2 - 3 };
      g2B = { x0: W * 0.42, x1: W - 6, y0: m2 + 3, y1: capTop - 4 };
    }
    L = { W, H, phone, fs, capFs, capTop, app, gA, gB, app2, g2A, g2B };
  }

  // text made of pieces: [text, style], style 'i' italic serif, 'r' upright serif, 's' italic subscript, 'sans'
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

  // ---------- a graph against time in the rectangle R ----------
  // o: { t0, t1, tn, fn, ymax, rgb, title, pos (zero at the bottom), ticks: [[v, label]], shade: [[ta, tb]], shadeA }
  function graph(s, R, o, a) {
    if (a <= 0) return null;
    const { g } = s, fs = L.fs;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(14,20,44,${0.66 * a})`; g.beginPath(); g.roundRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0, 8); g.fill();
    g.font = D.sans(fs - 1);
    const padL = o.ticks && o.ticks.length ? Math.max(...o.ticks.map(([, lab]) => g.measureText(lab).width)) + 8 : fs * 0.9;
    const px0 = R.x0 + padL + 4, px1 = R.x1 - fs * 1.2, py0 = R.y0 + fs * 1.9, py1 = R.y1 - fs * 0.6;
    const ym = o.pos ? py1 : (py0 + py1) / 2;
    const X = (tt) => px0 + (tt - o.t0) / (o.t1 - o.t0) * (px1 - px0);
    const Y = (v) => ym - v / o.ymax * (o.pos ? py1 - py0 : (py1 - py0) / 2);
    rich(s, o.title, R.x0 + fs * 0.6, R.y0 + fs * 0.95, fs + 1, 0.95 * a, o.rgb, 'left');
    for (const [v, lab] of o.ticks || []) {
      const y = Y(v);
      D.line(s, px0, y, px1, y, C.muted, 0.2 * a, 1, [3, 4]);
      D.text(s, lab, px0 - 4, y, fs - 1, 0.75 * a, D.sans(fs - 1), C.muted, 'right');
    }
    D.line(s, px0, py0 - 2, px0, py1, C.muted, 0.6 * a, 1);
    D.line(s, px0, ym, px1, ym, C.muted, 0.6 * a, 1);
    rich(s, [['t', 'i']], px1 + fs * 0.55, ym - (o.pos ? fs * 0.7 : fs * 0.6), fs, 0.8 * a, C.muted);
    const tEnd = Math.min(o.tn, o.t1);
    if (tEnd <= o.t0) return { X, Y, px0, px1, py0, py1, ym };
    const n = Math.max(60, Math.round((px1 - px0) / 1.5));
    const val = (tt) => clamp(o.fn(tt), -o.ymax * 1.05, o.ymax * 1.05);
    if (o.shade && o.shadeA > 0) {
      for (const [ta, tb] of o.shade) {
        const b = Math.min(tb, tEnd); if (b <= ta) continue;
        g.beginPath(); g.moveTo(X(ta), ym);
        for (let i = 0; i <= 120; i++) { const tt = ta + (b - ta) * i / 120; g.lineTo(X(tt), Y(val(tt))); }
        g.lineTo(X(b), ym); g.closePath();
        g.fillStyle = `rgba(${o.rgb},${0.45 * o.shadeA * a})`; g.fill();
        // "ΔNΦ" beside the pulse, on the side of the axis where the pulse is: each area is the change in flux linkage
        let peak = 0; for (let i = 0; i <= 60; i++) { const v = val(ta + (b - ta) * i / 60); if (Math.abs(v) > Math.abs(peak)) peak = v; }
        rich(s, [['Δ', 'r'], ['N', 'i'], ['Φ', 'i']], X(b) + L.fs * 0.4, Y(peak * 0.45), L.fs + 1, o.shadeA * a, C.text, 'left');
      }
    }
    const pts = [];
    for (let i = 0; i <= n; i++) { const tt = o.t0 + (tEnd - o.t0) * i / n; pts.push([X(tt), Y(val(tt))]); }
    D.glowLine(s, pts, o.rgb, a, L.phone ? 1.5 : 2);
    if (o.tn <= o.t1 + 0.01) D.glowDot(s, pts[n][0], pts[n][1], L.phone ? 7 : 10, o.rgb, a);
    return { X, Y, px0, px1, py0, py1, ym, val };
  }

  // ---------- the magnet, the coil and the meter (parts 1 and 2) ----------
  // vertical: the coil's axis points down the screen (the whole picture turned through 90°).
  function apparatus(s, R, vertical, xm, v, e, eMax, opts, a) {
    if (a <= 0) return;
    const { g } = s, fs = L.fs;
    const sp = vertical ? { s0: -13.4, s1: 13.4, r0: -9.2, r1: 4.2 } : { s0: -19.5, s1: 7, r0: -8, r1: 5.5 };
    const along = sp.s1 - sp.s0, across = sp.r1 - sp.r0;
    const Rw = R.x1 - R.x0, Rh = R.y1 - R.y0;
    const k = vertical ? Math.min(Rw / across, Rh / along) : Math.min(Rw / along, Rh / across);
    // centre (the coil's centre) on the screen
    const cx = vertical ? R.x0 + (Rw - across * k) / 2 - sp.r0 * k : R.x0 + (Rw - along * k) / 2 - sp.s0 * k;
    const cy = vertical ? R.y0 + (Rh - along * k) / 2 - sp.s0 * k : R.y0 + (Rh - across * k) / 2 + sp.r1 * k;
    const Q = (dx, dy) => (vertical ? [-dy, dx] : [dx, dy]);         // screen offsets turned with the picture
    const P = (x, r) => { const [dx, dy] = Q(x * k, -r * k); return [cx + dx, cy + dy]; };
    g.save(); g.beginPath(); g.rect(R.x0, R.y0, Rw, Rh); g.clip();
    // field lines of the magnet (they move with it)
    for (const { pts, arrow } of FL) {
      const sc = pts.map(([x, y]) => P(x + xm, y));
      D.glowLine(s, sc, FLUX, 0.42 * a, L.phone ? 0.8 : 1.1);
      if (arrow > 0 && arrow < sc.length - 1) {
        const [x1, y1] = sc[arrow - 1], [x2, y2] = sc[arrow + 1], ang = Math.atan2(y2 - y1, x2 - x1), [hx, hy] = sc[arrow], hs = Math.max(4, k * 0.3);
        g.fillStyle = `rgba(${FLUX},${0.75 * a})`; g.beginPath();
        g.moveTo(hx + Math.cos(ang) * hs, hy + Math.sin(ang) * hs);
        g.lineTo(hx + Math.cos(ang + 2.5) * hs, hy + Math.sin(ang + 2.5) * hs);
        g.lineTo(hx + Math.cos(ang - 2.5) * hs, hy + Math.sin(ang - 2.5) * hs); g.closePath(); g.fill();
      }
    }
    const rot = vertical ? Math.PI / 2 : 0, TURNS = 12, ex = CA * 0.24 * k, ey = CA * k;
    const turnX = (i) => -CL / 2 + CL * (i + 0.5) / TURNS;
    // back halves of the turns
    g.lineWidth = Math.max(1.4, k * 0.13); g.strokeStyle = `rgba(${COIL},${0.45 * a})`;
    for (let i = 0; i < TURNS; i++) { const [px, py] = P(turnX(i), 0); g.beginPath(); g.ellipse(px, py, ex, ey, rot, Math.PI / 2, 3 * Math.PI / 2); g.stroke(); }
    // wires to the meter and the meter
    const wire = [P(turnX(0), -CA), P(turnX(0), -5.2), P(-1.5, -5.2)], wire2 = [P(turnX(TURNS - 1), -CA), P(turnX(TURNS - 1), -5.2), P(1.5, -5.2)];
    for (const w of [wire, wire2]) { g.strokeStyle = `rgba(${COIL},${0.7 * a})`; g.lineWidth = 1.4; g.beginPath(); g.moveTo(...w[0]); g.lineTo(...w[1]); g.lineTo(...w[2]); g.stroke(); }
    const [mx, my] = P(0, -5.9), mr = Math.max(14, 1.45 * k);
    g.fillStyle = `rgba(20,28,58,${0.95 * a})`; g.strokeStyle = `rgba(190,200,240,${0.8 * a})`; g.lineWidth = 1.4;
    g.beginPath(); g.arc(mx, my, mr, 0, 2 * Math.PI); g.fill(); g.stroke();
    for (let j = -4; j <= 4; j++) {
      const an = -Math.PI / 2 + j * 0.22, r0 = mr * (j === 0 ? 0.62 : 0.72);
      D.line(s, mx + Math.cos(an) * r0, my + Math.sin(an) * r0, mx + Math.cos(an) * mr * 0.86, my + Math.sin(an) * mr * 0.86, '190,200,240', 0.7 * a, 1);
    }
    const defl = clamp(e / eMax, -1, 1) * 0.9, na = -Math.PI / 2 + defl;
    g.strokeStyle = `rgba(${CUR},${a})`; g.lineWidth = 2; g.beginPath(); g.moveTo(mx, my + mr * 0.3); g.lineTo(mx + Math.cos(na) * mr * 0.8, my + Math.sin(na) * mr * 0.8); g.stroke();
    D.text(s, 'meter', mx, my + mr + fs * 0.75, fs - 1, 0.75 * a, D.sans(fs - 1), C.muted);
    // the magnet (N half red, S half blue)
    const quad = (x0, x1, rgb, al) => {
      const c = [P(x0, -MR), P(x1, -MR), P(x1, MR), P(x0, MR)];
      g.fillStyle = `rgba(${rgb},${al})`; g.beginPath(); g.moveTo(...c[0]); for (let i = 1; i < 4; i++) g.lineTo(...c[i]); g.closePath(); g.fill();
    };
    quad(xm - ML / 2, xm, S_RGB, 0.95 * a); quad(xm, xm + ML / 2, N_RGB, 0.95 * a);
    const ms = Math.round(clamp(k * 0.9, 9, 18));
    const [nx, ny] = P(xm + ML / 4, 0), [sx, sy] = P(xm - ML / 4, 0);
    D.text(s, 'N', nx, ny, ms, a, D.sans(ms, 700), '255,255,255'); D.text(s, 'S', sx, sy, ms, a, D.sans(ms, 700), '255,255,255');
    // front halves of the turns (over the magnet)
    g.lineWidth = Math.max(1.6, k * 0.15); g.strokeStyle = `rgba(${COIL},${0.95 * a})`;
    for (let i = 0; i < TURNS; i++) { const [px, py] = P(turnX(i), 0); g.beginPath(); g.ellipse(px, py, ex, ey, rot, -Math.PI / 2, Math.PI / 2); g.stroke(); }
    // the induced current and the poles it makes at the ends of the coil
    const strength = Math.abs(e) / eMax, show = smooth((strength - 0.006) / 0.03);
    if (show > 0) {
      const al = a * show * (0.45 + 0.55 * Math.min(1, strength * 1.6));
      const dirY = e < 0 ? -1 : 1;                                    // front of each turn: up when the induced field points back towards −x
      for (const i of [1, 4, 7, 10]) {
        const [px, py] = P(turnX(i), 0), [ox, oy] = Q(ex, 0), [dx, dy] = Q(0, dirY * ey * 0.55);
        D.arrow(s, px + ox - dx, py + oy - dy, px + ox + dx, py + oy + dy, CUR, al, '', { head: Math.max(6, k * 0.45), width: 2, blur: 6 });
      }
      const ps = Math.round(clamp(k * 0.85, 10, 17));
      const [lx, ly] = P(-CL / 2, CA + 1.1), [rx, ry] = P(CL / 2, CA + 1.1);
      D.text(s, e < 0 ? 'N' : 'S', lx, ly, ps, al, D.sans(ps, 700), CUR);
      D.text(s, e < 0 ? 'S' : 'N', rx, ry, ps, al, D.sans(ps, 700), CUR);
      if (opts.force) {                                               // the force on the magnet opposes its motion
        const len = 0.5 + 2.6 * Math.min(1, strength), sg = v > 0 ? -1 : 1;
        const [fx0, fy0] = P(xm, -MR - 0.9), [fx1, fy1] = P(xm + sg * len, -MR - 0.9);
        D.arrow(s, fx0, fy0, fx1, fy1, C.force, al, '', { head: Math.max(7, k * 0.5), width: 2.4 });
        const [tx, ty] = P(xm + sg * (len + 0.4), -MR - 0.9);
        D.text(s, v > 0 ? 'repelled' : 'attracted', tx, ty + (vertical ? 0 : fs * 0.95), fs, al, D.sans(fs, 600), C.force, vertical ? (sg > 0 ? 'left' : 'right') : 'center');
      }
    }
    // the magnet's velocity
    if (Math.abs(v) > 0.05) {
      const len = 0.6 * v, [ax0, ay0] = P(xm, MR + 0.9), [ax1, ay1] = P(xm + len, MR + 0.9);
      D.arrow(s, ax0, ay0, ax1, ay1, C.vel, a, '', { head: Math.max(7, k * 0.5), width: 2.4 });
      // label behind the arrow's tail, clear of the coil's pole labels (none on the vertical coil, where it would crowd them)
      if (!vertical) { const [vx, vy] = P(xm - Math.sign(v) * 0.8, MR + 0.9); rich(s, [['v', 'i']], vx, vy, fs + 3, a, C.vel); }
    }
    // labels
    const [cl, cly] = P(0, CA + 1.1);
    D.text(s, 'coil', cl, cly, fs, 0.8 * a, D.sans(fs), COIL);
    if (opts.label) { const [lx, ly] = P(xm, -MR - 2.1); D.text(s, opts.label, lx, ly, fs, opts.labelA * a, D.sans(fs, 600), C.muted); }
    g.restore();
  }

  // ---------- the generator (part 3) ----------
  function generator(s, R, th, t, a) {
    if (a <= 0) return;
    const { g } = s, fs = L.fs;
    const Rw = R.x1 - R.x0, Rh = R.y1 - R.y0, k = Math.min(Rw / 20.5, Rh / 15.5);
    const cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2 + k * 0.6;
    const P = (x, y, z) => [cx + k * (x - 0.3 * z), cy - k * (y - 0.22 * z)];
    // pole pieces
    const block = (x0, x1, rgb, lab) => {
      const c = [P(x0, -4.6, 0), P(x1, -4.6, 0), P(x1, 4.6, 0), P(x0, 4.6, 0)];
      g.fillStyle = `rgba(${rgb},${0.85 * a})`; g.beginPath(); g.moveTo(...c[0]); for (let i = 1; i < 4; i++) g.lineTo(...c[i]); g.closePath(); g.fill();
      const [lx, ly] = P((x0 + x1) / 2, 0, 0), ps = Math.round(clamp(k * 1.1, 11, 22));
      D.text(s, lab, lx, ly, ps, a, D.sans(ps, 700), '255,255,255');
    };
    block(-9.6, -6.6, N_RGB, 'N'); block(6.6, 9.6, S_RGB, 'S');
    // the coil: in the plane of the vertical axle and u = (−sin θ, 0, cos θ); its normal n = (cos θ, 0, sin θ)
    const w = 7, h = 6, ux = -Math.sin(th), uz = Math.cos(th);
    const corner = (su, sy) => P(su * ux * w / 2, sy * h / 2, su * uz * w / 2);
    const cA = corner(-1, 1), cB = corner(1, 1), cC = corner(1, -1), cD = corner(-1, -1);
    // flux through the coil: shaded in proportion to |cos θ|
    g.fillStyle = `rgba(${FLUX},${0.16 * Math.abs(Math.cos(th)) * a})`;
    g.beginPath(); g.moveTo(...cA); g.lineTo(...cB); g.lineTo(...cC); g.lineTo(...cD); g.closePath(); g.fill();
    const edge = (p, q, front) => { g.strokeStyle = `rgba(${COIL},${(front ? 0.95 : 0.4) * a})`; g.lineWidth = front ? 3 : 2; g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke(); };
    const zA = -uz * w / 2, zB = uz * w / 2;                          // depth of the two vertical edges
    edge(zA < zB ? cA : cB, zA < zB ? cD : cC, false);
    // the axle and the field lines (between the back and front of the coil)
    const [ax0, ay0] = P(0, -h / 2 - 1.6, 0), [ax1, ay1] = P(0, h / 2 + 1.6, 0);
    D.line(s, ax0, ay0, ax1, ay1, '160,170,200', 0.7 * a, 2);
    for (const y of [-3.6, -1.8, 0, 1.8, 3.6]) {
      const p0 = P(-6.6, y, 0), p1 = P(6.6, y, 0);
      D.glowLine(s, [p0, p1], FLUX, 0.55 * a, 1.1);
      for (const xa of [-4.8, 4.8]) {
        const [hx, hy] = P(xa, y, 0), hs = Math.max(4, k * 0.3);
        g.fillStyle = `rgba(${FLUX},${0.8 * a})`; g.beginPath(); g.moveTo(hx + hs, hy); g.lineTo(hx - hs * 0.6, hy - hs * 0.55); g.lineTo(hx - hs * 0.6, hy + hs * 0.55); g.closePath(); g.fill();
      }
    }
    edge(cA, cB, false); edge(cD, cC, false);
    edge(zA < zB ? cB : cA, zA < zB ? cC : cD, true);
    // the normal
    const [n0x, n0y] = P(0, 0, 0), [n1x, n1y] = P(3.6 * Math.cos(th), 0, 3.6 * Math.sin(th));
    D.arrow(s, n0x, n0y, n1x, n1y, '236,240,255', 0.8 * a, '', { head: Math.max(6, k * 0.45), width: 1.6, blur: 4 });
    const [nlx, nly] = P(4.5 * Math.cos(th), 0.2, 4.5 * Math.sin(th));
    D.text(s, 'normal', nlx, nly, fs - 1, 0.75 * a, D.sans(fs - 1), C.text);
    // labels
    const [bx, by] = P(0, 5.5, 0);
    rich(s, [['B', 'i'], [' = 0.20 T', 'sans']], bx, by, fs + 2, 0.9 * a, FLUX);
    const deg = ((th * 180 / Math.PI) % 360 + 360) % 360;
    const [tx, ty] = P(0, -h / 2 - 2.6, 0);
    rich(s, [['θ', 'i'], [` = ${Math.round(deg)}°`, 'sans'], [`   ${t <= T2X ? 50 : 100} Hz`, 'sans']], tx, ty, fs + 2, 0.9 * a, C.text);
  }

  // ---------- the three parts ----------
  const LEG1 = [['line', FLUX, 'magnetic field line (from a model of the magnet)'], ['arrow', C.vel, 'velocity of the magnet'],
    ['arrow', C.force, 'force on the magnet from the induced current'], ['arrow', CUR, 'induced current']];
  const LEG3 = [['line', FLUX, 'uniform magnetic field'], ['line', COIL, 'coil of N turns, turning steadily']];
  const titleL = [['flux linkage ', 'sans'], ['N', 'i'], ['Φ', 'i']], titleE = [['induced emf ', 'sans'], ['ε', 'i']];

  function part1(s, t, a) {
    const [xm, v] = mag1(t), e = e1(t);
    D.legend(s, LEG1, a);
    apparatus(s, L.app, false, xm, v, e, E1MAX, { force: true }, a);
    const ga = a * smooth((t - T_REC + 0.2) / 0.8);
    const shadeA = smooth((t - 58.0) / 0.8);
    const gl = graph(s, L.gA, { t0: T_REC, t1: P1_END, tn: t, fn: l1, ymax: 1.15, rgb: FLUX, title: titleL, pos: true }, ga);
    const ge = graph(s, L.gB, { t0: T_REC, t1: P1_END, tn: t, fn: e1, ymax: E1MAX * 1.12, rgb: EMF, title: titleE,
      shade: [[T_PUSH, T_PUSH + D_PUSH], [T_PULL, T_PULL + D_PULL]], shadeA }, ga);
    // the gradient of the flux graph where it is steepest
    const ta = fade(t, 47.2, 52.4, 0.6, 0.6) * ga;
    if (ta > 0 && gl && ge) {
      const { g } = s, fs = L.fs, x = gl.X(T_STEEP), y = gl.Y(l1(T_STEEP)), d = 0.05;
      const slope = (gl.Y(l1(T_STEEP + d)) - gl.Y(l1(T_STEEP - d))) / (gl.X(T_STEEP + d) - gl.X(T_STEEP - d));
      const hw = (gl.px1 - gl.px0) * 0.1;
      g.save(); g.beginPath(); g.rect(gl.px0, gl.py0 - 4, gl.px1 - gl.px0, gl.py1 - gl.py0 + 4); g.clip();
      D.line(s, x - hw, y - slope * hw, x + hw, y + slope * hw, C.light, 0.95 * ta, 2);
      g.restore();
      D.text(s, 'steepest', x + hw * 0.4, y + fs * 1.1, fs, ta, D.sans(fs, 600), C.light, 'left');
      const ex = ge.X(T_STEEP), ey = ge.Y(e1(T_STEEP));
      D.glowDot(s, ex, ey, L.phone ? 9 : 12, C.light, ta);
      D.text(s, 'biggest emf', ex + fs * 0.8, ey - fs * 0.2, fs, ta, D.sans(fs, 600), C.light, 'left');
    }
  }

  function part2(s, t, a) {
    const [sm, v] = mag2(t), e = e2(t);
    // (no legend here: the colours were introduced in part 1, and the vertical coil needs the full height)
    const rel = fade(t, T_DROP - 0.6, T_DROP + 1.6, 0.3, 0.6);
    apparatus(s, L.app2, true, sm, v, e, E2MAX, { force: false, label: 'released', labelA: rel }, a);
    const ga = a * smooth((t - 66.2) / 0.8), shadeA = smooth((t - 81.4) / 0.8);
    graph(s, L.g2A, { t0: P2_G0, t1: P2_G1, tn: t, fn: l2, ymax: 1.15, rgb: FLUX, title: titleL, pos: true }, ga);
    graph(s, L.g2B, { t0: P2_G0, t1: P2_G1, tn: t, fn: e2, ymax: E2MAX * 1.12, rgb: EMF, title: titleE,
      shade: [[T_DROP, T_MID2], [T_MID2, T_10]], shadeA }, ga);
  }

  function part3(s, t, a) {
    const th = theta(t);
    D.legend(s, LEG3, a);
    generator(s, L.app, th, t, a);
    const t0 = Math.max(T3, t - WIN3);
    const ga = a * smooth((t - 88.0) / 0.8);
    graph(s, L.gA, { t0, t1: t0 + WIN3, tn: t, fn: l3, ymax: 0.1, rgb: FLUX, title: [...titleL, [' / Wb', 'sans']],
      ticks: [[0.08, '0.080'], [-0.08, '−0.080']] }, ga);
    const ge = graph(s, L.gB, { t0, t1: t0 + WIN3, tn: t, fn: e3, ymax: 60, rgb: EMF, title: [...titleE, [' / V', 'sans']],
      ticks: L.phone ? [[50, '50'], [-50, '−50']] : [[50, '50'], [25, '25'], [-25, '−25'], [-50, '−50']] }, ga);
    // the average emf over a quarter turn at 50 Hz
    const qa = fade(t, 105.2, 111.4, 0.6, 0.6) * ga;
    if (qa > 0 && ge) {
      const y = ge.Y(16), fs = L.fs;
      D.line(s, ge.px0, y, ge.px1, y, C.light, 0.9 * qa, 1.6, [6, 4]);
      D.text(s, 'average over a quarter turn: 16 V', ge.px1, y - fs * 0.85, fs, qa, D.sans(fs, 600), C.light, 'right');
    }
  }

  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 30, 18, 38)), s2 = Math.round(clamp(W / 46, 13, 24)), s3 = Math.round(clamp(W / 64, 11, 17));
    D.text(s, 'Induction (HL)', W / 2, H * (phone ? 0.09 : 0.12), s1, a, D.sans(s1, 300));
    const items = [
      [[['Φ', 'i'], [' = ', 'r'], ['BA', 'i'], [' cos ', 'r'], ['θ', 'i']], FLUX, 'Magnetic flux; NΦ is the flux linkage of a coil of N turns.'],
      [[['ε', 'i'], [' = −', 'r'], ['N', 'i'], [' ΔΦ', 'r'], [' / ', 'r'], ['Δ', 'r'], ['t', 'i']], EMF, 'An emf is induced only while the flux linkage changes. The faster the change, the bigger the emf.'],
      [[['Lenz\'s law', 'sans']], C.force, 'The induced current opposes the change that caused it: a consequence of energy conservation.'],
      [[['ac generator', 'sans']], COIL, 'NΦ = NBA cos ωt. Turning twice as fast doubles the peak emf and halves the period.'],
    ];
    if (phone) {
      let y = H * 0.19;
      for (const [eq, rgb, txt] of items) {
        rich(s, eq, W / 2, y, s2, a, rgb); y += s2 * 1.2;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 36); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.9;
      }
    } else {
      const colW = Math.min(W * 0.36, 420);
      g.font = D.sans(s3);
      const wrapped = items.map(([, , txt]) => D.wrap(s, txt, colW));
      const y1 = H * 0.3, y2 = Math.max(H * 0.58, y1 + s2 * 1.4 + s3 * 1.3 * Math.max(wrapped[0].length, wrapped[1].length) + s2 * 1.3);
      items.forEach(([eq, rgb], i) => {
        const x = W / 2 + (i % 2 ? 1 : -1) * W * 0.22, y = i < 2 ? y1 : y2;
        rich(s, eq, x, y, s2, a, rgb);
        D.text(s, wrapped[i], x, y + s2 * 1.4, s3, 0.85 * a, D.sans(s3));
      });
    }
  }

  Anim.register('induction', {
    duration: DURATION,
    poster: 33,
    pauses: PAUSES,
    // score: a humming generator (A major, a saw pad with a slow wobble, a low drone, a steady pulse, soft bells)
    music: { chords: [[57, 61, 64, 69], [54, 61, 64, 66], [50, 57, 62, 66], [52, 59, 64, 68]], bar: 6, pad: 'saw', cutoff: 750,
      tremolo: 2, drone: 0.13, bells: 0.2, bellType: 'sine', bellOct: 2, pulse: 1.0, arp: 0, echo: 0.4, volume: 0.56 },
    resize: layout,
    // for checking the numbers (not used by the player)
    info: { LAM, dLAM, LMAX, mag1, mag2, e1, e2, l1, l2, E1MAX, E2MAX, T_STEEP, T_MID2, T_10, theta, l3, e3, CAPS, PAUSES, FL },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.22);
      const a1 = fade(t, 4.4, 65.0, 0.8, 0.6), a2 = fade(t, 65.4, 87.2, 0.6, 0.6), a3 = fade(t, 87.4, END_CARD + 0.8, 0.6, 0.8);
      if (a1 > 0) part1(s, t, a1);
      if (a2 > 0) part2(s, t, a2);
      if (a3 > 0) part3(s, t, a3);
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Induction', 'A magnet, a coil and a generator (HL)');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
