/* A.1 Motion graphs: a car moves along a track while its displacement–time, velocity–time and
   acceleration–time graphs draw themselves. Motion from the suvat equations, segment by segment. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, fade } = Anim;

  // [duration in s, acceleration in m s^-2]; starts at rest at s = 0.
  const SEGS = [[4, 1.5], [4, 0], [3, -2], [2, 0], [3, -1], [3, 0], [1.5, 2]];
  const segs = []; let t0 = 0, v0 = 0, s0 = 0;
  for (const [d, a] of SEGS) { segs.push({ t0, t1: t0 + d, a, v0, s0 }); s0 += v0 * d + 0.5 * a * d * d; v0 += a * d; t0 += d; }
  const T_END = t0;            // 20.5 s; ends at rest at s = 29.25 m (checked: 12 + 24 + 9 - 4.5 - 9 - 2.25)
  const state = (tau) => {
    tau = clamp(tau, 0, T_END);
    const sg = segs.find((q) => tau <= q.t1) || segs[segs.length - 1], u = tau - sg.t0;
    return { s: sg.s0 + sg.v0 * u + 0.5 * sg.a * u * u, v: sg.v0 + sg.a * u, a: sg.a, sg };
  };

  const START = 3.5, SLOW = 1.2;                  // motion begins at 3.5 s, shown 1.2× slower than real time
  const tauAt = (t) => clamp((t - START) / SLOW, 0, T_END);
  const realAt = (tau) => START + tau * SLOW;
  const S_COL = C.good, V_COL = C.vel, A_COL = C.force;

  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, wide = W / H > 1.1, capH = clamp(W / 44, 15, 25) * (W < 520 ? 6.4 : 3.6);
    const pad = clamp(W * 0.03, 10, 28);
    const track = { x0: pad + W * 0.06, x1: W - pad - W * 0.06, y: wide ? H * 0.3 : H * 0.17 };
    const top = wide ? H * 0.42 : H * 0.265, bottom = H - capH;
    const panels = [];
    const defs = [
      { key: 's', min: 0, max: 50, step: 10, lab: 'displacement, s / m', col: S_COL },
      { key: 'v', min: -4, max: 8, step: 2, lab: 'velocity, v / m s⁻¹', col: V_COL },
      { key: 'a', min: -3, max: 3, step: 1, lab: 'acceleration, a / m s⁻²', col: A_COL },
    ];
    defs.forEach((d, i) => {
      let x, y, w, h;
      if (wide) { const gap = W * 0.025; w = (W - 2 * pad - 2 * gap) / 3; x = pad + i * (w + gap); y = top; h = bottom - top; }
      else { const gap = H * 0.02; h = (bottom - top - 2 * gap) / 3; x = pad; w = W - 2 * pad; y = top + i * (h + gap); }
      const fs = Math.round(clamp(W / 95, 10, 13));
      const inner = { l: x + fs * 2.6, r: x + w - 6, t: y + fs * 1.9, b: y + h - fs * 1.8 };
      panels.push({ ...d, x, y, w, h, fs, ...inner,
        X: (tau) => inner.l + (tau / 21) * (inner.r - inner.l),
        Y: (val) => inner.b - ((val - d.min) / (d.max - d.min)) * (inner.b - inner.t) });
    });
    L = { wide, track, panels, pad };
  }

  function drawPanel(s, P, tau, a) {
    const { g } = s;
    if (a <= 0) return;
    // frame and grid
    g.fillStyle = `rgba(20,26,52,${0.35 * a})`; g.fillRect(P.x, P.y, P.w, P.h);
    for (let v = P.min; v <= P.max + 1e-9; v += P.step) {
      const y = P.Y(v);
      D.line(s, P.l, y, P.r, y, C.muted, (v === 0 ? 0.55 : 0.12) * a, v === 0 ? 1.2 : 1);
      if (L.wide || v === P.min || v === 0 || v === P.max) D.text(s, String(v), P.l - 5, y, P.fs, 0.7 * a, D.sans(P.fs), C.muted, 'right');
    }
    for (let k = 0; k <= 20; k += 5) {
      const x = P.X(k);
      D.line(s, x, P.t, x, P.b, C.muted, 0.08 * a);
      D.text(s, String(k), x, P.b + P.fs * 0.9, P.fs, 0.6 * a, D.sans(P.fs), C.muted);
    }
    D.line(s, P.l, P.t, P.l, P.b, C.muted, 0.55 * a, 1.2);
    D.text(s, P.lab, P.l, P.y + P.fs * 0.9, P.fs, 0.9 * a, D.sans(P.fs, 600), P.col, 'left');
    D.text(s, 't / s', P.r, P.b - P.fs * 0.7, P.fs, 0.6 * a, D.sans(P.fs), C.muted, 'right');
    // the curve so far
    if (tau <= 0) return;
    if (P.key === 'a') {
      for (const sg of segs) {
        if (tau <= sg.t0) break;
        const e = Math.min(tau, sg.t1);
        D.glowLine(s, [[P.X(sg.t0), P.Y(sg.a)], [P.X(e), P.Y(sg.a)]], P.col, a, 1.8);
      }
    } else {
      const pts = [];
      for (let u = 0; u < tau; u += 0.05) pts.push([P.X(u), P.Y(state(u)[P.key])]);
      pts.push([P.X(tau), P.Y(state(tau)[P.key])]);
      D.glowLine(s, pts, P.col, a, 1.8);
    }
    const st = state(tau);
    D.glowDot(s, P.X(tau), P.Y(st[P.key]), 12, P.col, a);
  }

  // A side-on car, front to the right (drawn about 8 m long on the road's scale: larger than life, to be seen clearly).
  // gx = centre of the car, gy = road surface, Lc = length in px; st = { s, v, a } for the lights and wheels.
  const WHEEL_R = 0.76;                                   // wheel radius in road metres (0.095 × 8 m), so the wheels roll without slipping
  function bodyPath(g, gx, gy, Lc, r) {
    const X = (u) => gx + u * Lc, Y = (v) => gy - v * Lc, ar = r * 1.28, wf = 0.31, sill = r * 0.85 / Lc;
    g.beginPath();
    g.moveTo(X(-0.5), Y(sill));
    g.lineTo(X(-0.5), Y(0.15));
    g.quadraticCurveTo(X(-0.5), Y(0.19), X(-0.46), Y(0.195));            // rear bumper and boot
    g.lineTo(X(-0.36), Y(0.205));
    g.bezierCurveTo(X(-0.29), Y(0.215), X(-0.21), Y(0.305), X(-0.1), Y(0.31));   // rear window to roof
    g.lineTo(X(0.06), Y(0.31));
    g.bezierCurveTo(X(0.14), Y(0.305), X(0.2), Y(0.235), X(0.26), Y(0.205));    // windscreen
    g.bezierCurveTo(X(0.36), Y(0.195), X(0.45), Y(0.185), X(0.48), Y(0.16));    // bonnet
    g.quadraticCurveTo(X(0.505), Y(0.13), X(0.5), Y(sill));                      // nose
    g.lineTo(X(wf) + ar, Y(sill));
    g.arc(X(wf), gy - r, ar, 0, Math.PI, true);                                   // front wheel arch
    g.lineTo(X(-wf) + ar, Y(sill));
    g.arc(X(-wf), gy - r, ar, 0, Math.PI, true);                                  // rear wheel arch
    g.closePath();
  }
  function drawCar(s, gx, gy, Lc, st, a) {
    const { g } = s; if (a <= 0) return;
    const X = (u) => gx + u * Lc, Y = (v) => gy - v * Lc, r = 0.095 * Lc;
    g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'source-over';
    // shadow on the road
    const sh = g.createRadialGradient(gx, gy, 0, gx, gy, Lc * 0.6);
    sh.addColorStop(0, 'rgba(0,0,0,0.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh; g.beginPath(); g.ellipse(gx, gy + 1, Lc * 0.6, Lc * 0.06, 0, 0, Math.PI * 2); g.fill();
    // speed streaks behind the car (opposite to the velocity)
    const sp = Math.abs(st.v);
    if (sp > 1.5) {
      const dir = Math.sign(st.v), len = Lc * 0.12 * sp;
      for (const [hy, k] of [[0.08, 1], [0.15, 0.7], [0.23, 0.5]]) {
        const x0 = X(-0.52 * dir), y0 = Y(hy);
        const lg = g.createLinearGradient(x0, y0, x0 - dir * len * k, y0);
        lg.addColorStop(0, `rgba(${S_COL},0.35)`); lg.addColorStop(1, `rgba(${S_COL},0)`);
        g.strokeStyle = lg; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 - dir * len * k, y0); g.stroke();
      }
    }
    // body: metallic paint with a glowing rim
    bodyPath(g, gx, gy, Lc, r);
    const paint = g.createLinearGradient(0, Y(0.31), 0, Y(0.05));
    paint.addColorStop(0, '#9ff0d0'); paint.addColorStop(0.35, '#3cc79a'); paint.addColorStop(0.7, '#1b7a5e'); paint.addColorStop(1, '#0f4a3a');
    g.fillStyle = paint;
    g.shadowColor = `rgba(${S_COL},0.6)`; g.shadowBlur = Math.max(6, Lc * 0.12);
    g.fill(); g.shadowBlur = 0;
    g.strokeStyle = 'rgba(200,255,235,0.55)'; g.lineWidth = Math.max(1, Lc * 0.012); g.stroke();
    // windows
    g.beginPath();
    g.moveTo(X(-0.31), Y(0.205));
    g.bezierCurveTo(X(-0.25), Y(0.215), X(-0.19), Y(0.285), X(-0.1), Y(0.29));
    g.lineTo(X(0.05), Y(0.29));
    g.bezierCurveTo(X(0.12), Y(0.285), X(0.17), Y(0.24), X(0.22), Y(0.205));
    g.closePath();
    const glass = g.createLinearGradient(0, Y(0.29), 0, Y(0.205));
    glass.addColorStop(0, '#7fa6d8'); glass.addColorStop(1, '#142238');
    g.fillStyle = glass; g.fill();
    g.strokeStyle = '#0f4a3a'; g.lineWidth = Math.max(1.2, Lc * 0.018);
    g.beginPath(); g.moveTo(X(-0.04), Y(0.29)); g.lineTo(X(-0.03), Y(0.205)); g.stroke();       // door pillar
    // shoulder highlight and door line
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = Math.max(1, Lc * 0.01);
    g.beginPath(); g.moveTo(X(-0.45), Y(0.17)); g.quadraticCurveTo(X(0), Y(0.185), X(0.45), Y(0.165)); g.stroke();
    g.strokeStyle = 'rgba(10,40,30,0.6)';
    g.beginPath(); g.moveTo(X(-0.03), Y(0.2)); g.lineTo(X(-0.04), Y(0.07)); g.stroke();
    // wheels: tyre, rim and five spokes that turn as the car rolls (angle = distance / radius)
    const ang = st.s / WHEEL_R;
    for (const wx of [X(-0.31), X(0.31)]) {
      const wy = gy - r;
      g.fillStyle = '#0b0e16'; g.beginPath(); g.arc(wx, wy, r, 0, Math.PI * 2); g.fill();
      const rim = g.createRadialGradient(wx - r * 0.2, wy - r * 0.2, 0, wx, wy, r * 0.66);
      rim.addColorStop(0, '#e8eef8'); rim.addColorStop(1, '#7d8798');
      g.fillStyle = rim; g.beginPath(); g.arc(wx, wy, r * 0.64, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#2a303d'; g.lineWidth = Math.max(1, r * 0.13); g.beginPath();
      for (let k = 0; k < 5; k++) { const q = ang + k * Math.PI * 2 / 5; g.moveTo(wx + Math.cos(q) * r * 0.16, wy + Math.sin(q) * r * 0.16); g.lineTo(wx + Math.cos(q) * r * 0.6, wy + Math.sin(q) * r * 0.6); }
      g.stroke();
      g.fillStyle = '#2a303d'; g.beginPath(); g.arc(wx, wy, r * 0.14, 0, Math.PI * 2); g.fill();
    }
    g.restore();
    // lights: headlight always; brake lights when slowing down (a opposite to v); white reversing lights when v < 0
    const braking = Math.abs(st.v) > 0.05 && st.v * st.a < 0, reversing = st.v < -0.05;
    D.glowDot(s, X(0.485), Y(0.145), Math.max(6, Lc * 0.09), '255,240,200', a * 0.9);
    D.glowDot(s, X(-0.49), Y(0.165), Math.max(5, Lc * (braking ? 0.14 : 0.06)), '255,50,60', a * (braking ? 1 : 0.45));
    if (reversing) D.glowDot(s, X(-0.495), Y(0.12), Math.max(5, Lc * 0.08), '235,240,255', a);
  }

  function drawTrack(s, tau, a) {
    const { track: T } = L, pxm = (T.x1 - T.x0) / 50, X = (m) => T.x0 + m * pxm, fs = Math.round(clamp(s.W / 95, 10, 13));
    const band = clamp(fs * 1.25, 10, 18), gy = T.y;
    // the road: asphalt, an edge line and lane dashes that belong to the ground (they don't move)
    if (a > 0) {
      const { g } = s;
      g.globalCompositeOperation = 'source-over';
      const road = g.createLinearGradient(0, gy, 0, gy + band);
      road.addColorStop(0, `rgba(48,54,78,${a})`); road.addColorStop(1, `rgba(22,26,42,${a})`);
      g.fillStyle = road; g.fillRect(T.x0 - pxm * 3, gy, T.x1 - T.x0 + pxm * 6, band);
      D.line(s, T.x0 - pxm * 3, gy, T.x1 + pxm * 3, gy, '200,210,240', 0.55 * a, 1.2);
      for (let m = -2; m < 52; m += 2.5) D.line(s, X(m), gy + band / 2, X(m + 1.2), gy + band / 2, '230,235,255', 0.35 * a, 1.5);
    }
    for (let m = 0; m <= 50; m += 5) {
      D.line(s, X(m), gy + band, X(m), gy + band + (m % 10 ? 4 : 7), C.muted, 0.5 * a);
      if (m % 10 === 0) D.text(s, `${m} m`, X(m), gy + band + fs * 1.3, fs, 0.6 * a, D.sans(fs), C.muted);
    }
    D.arrow(s, T.x1 - 70, gy + band + fs * 2.7, T.x1, gy + band + fs * 2.7, C.muted, 0.6 * a, '', { width: 1.4, head: 7, blur: 0 });
    D.text(s, 'positive direction', T.x1 - 76, gy + band + fs * 2.7, fs, 0.6 * a, D.sans(fs), C.muted, 'right');
    // strobe marks on the road: where the car was at each whole second
    for (let k = 1; k <= Math.floor(tau); k++) D.glowDot(s, X(state(k).s), gy + band / 2, 6, S_COL, 0.6 * a);
    const st = state(tau), x = X(st.s), Lc = Math.max(8 * pxm, 56);   // drawn larger than the road's scale, so it can be seen
    drawCar(s, x, gy, Lc, st, a);
    // velocity and acceleration arrows above the car (lengths to scale: 1 m s^-1 → 1 m of road; 1 m s^-2 → 2.2 m)
    const roof = gy - 0.31 * Lc, ay = roof - fs * 1.2, accY = ay - fs * 1.7;
    if (Math.abs(st.v) > 0.05) D.arrow(s, x, ay, x + st.v * pxm, ay, V_COL, a, 'v', { labelOff: 12 });
    if (L.wide && st.a !== 0 && tau < T_END) D.arrow(s, x, accY, x + st.a * pxm * 2.2, accY, A_COL, a, 'a', { labelOff: 12 });
  }

  const CAPS = [
    [realAt(0) + 0.1, realAt(4), 'Speeding up from rest: the s–t graph curves upwards and the v–t graph is a sloping straight line.'],
    [realAt(4) + 0.1, realAt(8), 'Constant velocity: the s–t graph is a straight line and the acceleration is zero.'],
    [realAt(8) + 0.1, realAt(11), 'Slowing down: the v–t graph slopes downwards, so the acceleration is negative.'],
    [realAt(11) + 0.1, realAt(13), 'At rest: the displacement stays the same and the velocity is zero.'],
    [realAt(13) + 0.1, realAt(16), 'Moving back: the velocity is negative, so the displacement decreases.'],
    [realAt(16) + 0.1, realAt(19), 'Constant velocity backwards: the s–t graph is a straight line sloping down.'],
    [realAt(19) + 0.1, 30.2, 'Slowing down while moving backwards: the acceleration is positive.'],
    [30.4, 34.8, 'The area under the v–t graph is the displacement: 45 m forwards, then 15.75 m back.'],
    [35.0, 39.4, 'So the final displacement is 45 − 15.75 = 29.25 m, where the s–t graph ends.'],
    [39.6, 44.6, 'The gradient of the s–t graph is the velocity. The gradient of the v–t graph is the acceleration.'],
  ];
  const DURATION = 45.5;

  function areas(s, t) {
    const P = L.panels[1], sweep = clamp((t - 30.4) / 3.2, 0, 1) * T_END, a = fade(t, 30.4, 39.6, 0.4, 0.8);
    if (a <= 0 || sweep <= 0) return;
    const { g } = s;
    for (const [sign, col] of [[1, V_COL], [-1, A_COL]]) {
      g.beginPath(); g.moveTo(P.X(0), P.Y(0));
      for (let u = 0; u <= sweep; u += 0.05) { const v = state(u).v; g.lineTo(P.X(u), P.Y(sign * v > 0 ? v : 0)); }
      g.lineTo(P.X(sweep), P.Y(0)); g.closePath();
      g.fillStyle = `rgba(${col},${0.28 * a})`; g.fill();
    }
    const fs = Math.round(clamp(s.W / 70, 12, 18));
    if (sweep > 9) D.text(s, '+45 m', P.X(5.5), P.Y(2.6), fs, a, D.sans(fs, 600), C.white);
    if (sweep > 19) D.text(s, '−15.75 m', P.X(17), P.Y(-1.7), fs, a, D.sans(fs, 600), C.white);
    // the end point of the s–t graph
    const Ps = L.panels[0], e = fade(t, 35.0, 39.6, 0.5, 0.8);
    if (e > 0) {
      D.glowDot(s, Ps.X(T_END), Ps.Y(29.25), 22, C.white, e);
      D.text(s, 's = 29.25 m', Ps.X(T_END) - 14, Ps.Y(29.25) + fs * 1.5, fs, e, D.sans(fs, 600), C.white, 'right');
    }
  }
  function gradients(s, t) {
    const a = fade(t, 39.6, 44.8, 0.6, 0.6); if (a <= 0) return;
    const fs = Math.round(clamp(s.W / 75, 11, 16));
    // tangent to s–t at t = 9.5 s, where v = 6 - 2(1.5) = 3 m s^-1
    const Ps = L.panels[0], t1 = 9.5, st = state(t1), dt = 2.5;
    D.glowLine(s, [[Ps.X(t1 - dt), Ps.Y(st.s - st.v * dt)], [Ps.X(t1 + dt), Ps.Y(st.s + st.v * dt)]], C.white, a, 1.4);
    D.glowDot(s, Ps.X(t1), Ps.Y(st.s), 10, C.white, a);
    D.text(s, 'gradient = 3 m s⁻¹ = v', Ps.X(t1) + 8, Ps.Y(st.s) + fs * 1.6, fs, a, D.sans(fs, 600), C.white, 'left');
    // gradient of v–t during the first 4 s: 6 / 4 = 1.5 m s^-2
    const Pv = L.panels[1];
    D.glowLine(s, [[Pv.X(0), Pv.Y(0)], [Pv.X(4), Pv.Y(0)], [Pv.X(4), Pv.Y(6)]], C.white, a * 0.8, 1.2);
    D.text(s, 'gradient = 6 ÷ 4 = 1.5 m s⁻² = a', Pv.X(4.4), Pv.Y(3.2), fs, a, D.sans(fs, 600), C.white, 'left');
  }

  Anim.register('motion-graphs', {
    duration: DURATION,
    poster: 36,
    // score: bright and moving (C major, a triangle pad, a soft shimmer)
    music: { chords: [[48, 55, 60, 64], [47, 55, 59, 62], [45, 52, 57, 60], [41, 48, 57, 60]], bar: 4, pad: 'triangle', cutoff: 900, drone: 0.09, shimmer: 0.2, volume: 0.43 },
    resize: layout,
    frame(s, t) {
      D.background(s, 0.25);
      const tau = tauAt(t), on = smooth((t - 2.6) / 1) * (1 - smooth((t - 44.9) / 0.6));
      drawTrack(s, tau, on);
      for (const P of L.panels) drawPanel(s, P, tau, on);
      // time cursor across the three graphs
      if (t > START && t < realAt(T_END) + 0.8) for (const P of L.panels) D.line(s, P.X(tau), P.t, P.X(tau), P.b, C.white, 0.25 * on, 1, [3, 4]);
      areas(s, t);
      gradients(s, t);
      D.captions(s, t, CAPS);
      if (t < 3.8) { s.g.fillStyle = `rgba(4,6,13,${0.75 * fade(t, 0, 3.6, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 3.6, 'Motion graphs', 'Watch the three graphs draw themselves as the car moves');
      D.vignette(s, t, DURATION);
    },
  });
})();
