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
    const track = { x0: pad + 10, x1: W - pad - 10, y: wide ? H * 0.23 : H * 0.16 };
    const top = wide ? H * 0.35 : H * 0.25, bottom = H - capH;
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

  function drawCar(s, x, y, size, sDist, a) {
    const { g } = s; if (a <= 0) return;
    const w = size * 2.2, h = size * 0.75, r = size * 0.32;
    g.globalCompositeOperation = 'source-over';
    g.shadowColor = `rgba(${S_COL},${0.7 * a})`; g.shadowBlur = 16;
    g.fillStyle = `rgba(16,24,44,${a})`; g.strokeStyle = `rgba(${S_COL},${a})`; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x - w / 2, y - r); g.lineTo(x - w / 2, y - r - h * 0.75);
    g.quadraticCurveTo(x - w / 2, y - r - h, x - w / 2 + h * 0.3, y - r - h);
    g.lineTo(x - w * 0.18, y - r - h); g.lineTo(x + w * 0.05, y - r - h * 1.75);
    g.lineTo(x + w * 0.32, y - r - h * 1.75); g.lineTo(x + w / 2, y - r - h * 0.9);
    g.lineTo(x + w / 2, y - r); g.closePath(); g.fill(); g.stroke();
    g.shadowBlur = 0;
    for (const wx of [x - w * 0.28, x + w * 0.3]) {
      g.fillStyle = `rgba(30,36,60,${a})`; g.strokeStyle = `rgba(220,228,255,${a})`; g.lineWidth = 1.6;
      g.beginPath(); g.arc(wx, y - r, r, 0, Math.PI * 2); g.fill(); g.stroke();
      const ang = sDist / 0.35;                       // wheels turn as the car moves
      g.beginPath();
      for (let k = 0; k < 3; k++) { const q = ang + k * Math.PI / 1.5; g.moveTo(wx, y - r); g.lineTo(wx + Math.cos(q) * r * 0.85, y - r + Math.sin(q) * r * 0.85); }
      g.stroke();
    }
  }

  function drawTrack(s, tau, a) {
    const { track: T } = L, X = (m) => T.x0 + (m / 50) * (T.x1 - T.x0), fs = Math.round(clamp(s.W / 95, 10, 13));
    D.line(s, T.x0, T.y, T.x1, T.y, C.muted, 0.6 * a, 1.5);
    for (let m = 0; m <= 50; m += 5) {
      D.line(s, X(m), T.y, X(m), T.y + (m % 10 ? 4 : 8), C.muted, 0.5 * a);
      if (m % 10 === 0) D.text(s, `${m} m`, X(m), T.y + fs * 1.3, fs, 0.6 * a, D.sans(fs), C.muted);
    }
    D.arrow(s, T.x1 - 70, T.y + fs * 2.7, T.x1, T.y + fs * 2.7, C.muted, 0.6 * a, '', { width: 1.4, head: 7, blur: 0 });
    D.text(s, 'positive direction', T.x1 - 76, T.y + fs * 2.7, fs, 0.6 * a, D.sans(fs), C.muted, 'right');
    // strobe marks: where the car was at each whole second
    for (let k = 1; k <= Math.floor(tau); k++) D.glowDot(s, X(state(k).s), T.y, 5, S_COL, 0.55 * a);
    const st = state(tau), x = X(st.s), size = clamp(s.W / 70, 9, 18);
    drawCar(s, x, T.y, size, st.s, a);
    // velocity arrow above, acceleration arrow below (lengths to scale)
    const k = (T.x1 - T.x0) / 50 * 1.0;
    const ay = T.y - size * 3.4;
    if (Math.abs(st.v) > 0.05) D.arrow(s, x, ay, x + st.v * k, ay, V_COL, a, 'v', { labelOff: 12 });
    const accY = L.wide ? T.y + fs * 4.4 : ay - size * 1.6;          // phones: above the velocity arrow
    if (st.a !== 0 && tau < T_END) D.arrow(s, x, accY, x + st.a * k * 2.2, accY, A_COL, a, 'a', { labelOff: 12 });
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
