/* A.5 (HL) Space–time diagrams: world lines, light at 45°, the tilted axes of a frame S′ moving at
   0.60c, relativity of simultaneity, and time dilation shown with curves of equal space–time interval.
   Numbers: β = 0.60, γ = 1.25, θ = arctan 0.60 = 31.0°. Events A (−1.2 m, 2.0 m) and B (1.2 m, 2.0 m):
   ct′ = γ(ct − βx) gives A: 3.4 m, B: 1.6 m, so B happens first in S′. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, fade, lerp } = Anim;
  const BETA = 0.6, GAMMA = 1 / Math.sqrt(1 - BETA * BETA), THETA = Math.atan(BETA);
  const S_COL = '200,210,240', P_COL = C.force, EV = C.white, BLUE = C.vel;
  const XMAX = 4.8, CTMAX = 5.2, CTMIN = -0.35, EVX = 1.2, EVC = 2.0;

  let unit = 50, ox = 0, oy = 0;
  const X = (x) => ox + x * unit, Y = (ct) => oy - ct * unit;
  function resize(s) {
    const capH = clamp(s.W / 44, 15, 25) * (s.W < 520 ? 7 : 3.6), top = 36;
    unit = Math.min(s.W / (2 * XMAX + 1.2), (s.H - capH - top) / (CTMAX - CTMIN + 0.4));
    const spare = s.H - capH - top - (CTMAX - CTMIN + 0.4) * unit;
    ox = s.W / 2; oy = s.H - capH - spare / 2 - (-CTMIN + 0.15) * unit;
  }
  // Clip drawing to the diagram's area.
  const clip = (s, f) => {
    const { g } = s; g.save(); g.beginPath();
    g.rect(X(-XMAX), Y(CTMAX), 2 * XMAX * unit, (CTMAX - CTMIN) * unit); g.clip(); f(); g.restore();
  };
  // A line through (x0, ct0) with direction (dx, dct), clipped by the diagram.
  const longLine = (x0, c0, dx, dc, L = 20) => [[X(x0 - dx * L), Y(c0 - dc * L)], [X(x0 + dx * L), Y(c0 + dc * L)]];

  function axesS(s, a) {
    if (a <= 0) return;
    const fs = Math.round(clamp(s.W / 60, 12, 18));
    clip(s, () => {
      for (let x = -4; x <= 4; x++) if (x) D.line(s, X(x), Y(CTMIN), X(x), Y(CTMAX), S_COL, 0.06 * a);
      for (let c = 1; c <= 5; c++) D.line(s, X(-XMAX), Y(c), X(XMAX), Y(c), S_COL, 0.06 * a);
    });
    D.arrow(s, X(-XMAX), Y(0), X(XMAX), Y(0), S_COL, 0.8 * a, '', { width: 1.6, head: 9, blur: 0 });
    D.arrow(s, X(0), Y(CTMIN), X(0), Y(CTMAX), S_COL, 0.8 * a, '', { width: 1.6, head: 9, blur: 0 });
    D.text(s, 'x', X(XMAX) - 4, Y(0) + fs * 1.1, fs, a, D.serif(fs), S_COL);
    D.text(s, 'ct', X(0) - fs * 1.2, Y(CTMAX) + fs * 0.4, fs, a, D.serif(fs), S_COL);
  }
  function axesP(s, beta, a, grid) {
    if (a <= 0) return;
    const fs = Math.round(clamp(s.W / 60, 12, 18)), g = 1 / Math.sqrt(1 - beta * beta);
    clip(s, () => {
      if (grid > 0) for (let n = -9; n <= 9; n++) {
        if (!n) continue;
        // lines of constant x′ (x − βct = n/γ) and of constant ct′ (ct − βx = n/γ)
        const p1 = longLine(n / g, 0, beta, 1), p2 = longLine(0, n / g, 1, beta);
        D.line(s, p1[0][0], p1[0][1], p1[1][0], p1[1][1], P_COL, 0.09 * grid);
        D.line(s, p2[0][0], p2[0][1], p2[1][0], p2[1][1], P_COL, 0.09 * grid);
      }
      const ctA = longLine(0, 0, beta, 1), xA = longLine(0, 0, 1, beta);
      D.glowLine(s, ctA, P_COL, a, 1.5);
      D.glowLine(s, xA, P_COL, a, 1.5);
    });
    const tc = CTMAX - 0.25, tx = XMAX - 0.35;
    D.text(s, 'ct′', X(beta * tc) + fs * 1.0, Y(tc) + fs * 0.3, fs, a, D.serif(fs), P_COL);
    D.text(s, 'x′', X(tx) - fs * 0.2, Y(beta * tx) - fs * 1.0, fs, a, D.serif(fs), P_COL);
  }
  function light(s, t, a) {
    if (a <= 0) return;
    const grow = clamp((t - 9.3) / 2.2, 0, 1) * CTMAX;
    clip(s, () => {
      D.glowLine(s, [[X(0), Y(0)], [X(grow), Y(grow)]], C.light, a, 1.6);
      D.glowLine(s, [[X(0), Y(0)], [X(-grow), Y(grow)]], C.light, a, 1.6);
    });
    const fs = Math.round(clamp(s.W / 70, 11, 16));
    if (grow > 4) D.text(s, 'light', X(4.2) + fs * 1.6, Y(4.2), fs, a, D.sans(fs, 600), C.light);
  }
  function arc(s, from, to, r, rgb, a, label) {
    const { g } = s; if (a <= 0) return;
    g.strokeStyle = `rgba(${rgb},${a})`; g.lineWidth = 1.6;
    g.beginPath(); g.arc(X(0), Y(0), r, from, to, to < from); g.stroke();
    const m = (from + to) / 2, fs = Math.round(clamp(s.W / 60, 12, 18));
    D.text(s, label, X(0) + Math.cos(m) * (r + fs * 0.9), Y(0) + Math.sin(m) * (r + fs * 0.9), fs, a, D.serif(fs), rgb);
  }
  function event(s, x, c, label, a, below = false) {
    if (a <= 0) return;
    const fs = Math.round(clamp(s.W / 60, 12, 18));
    D.glowDot(s, X(x), Y(c), 16, EV, a);
    D.text(s, label, X(x) + (x < 0 ? -fs : fs), Y(c) + (below ? fs : -fs * 0.9), fs, a, D.sans(fs, 700), EV);
  }

  const CAPS = [
    [4.4, 9.0, 'Position x goes across and ct goes up. ct (c times t) is a distance, so both axes are in metres. An object at rest has a vertical world line.'],
    [9.2, 13.6, 'Light travels at 45°: one metre across for every metre of ct.'],
    [13.8, 19.0, 'A rocket at 0.60c has a world line tilted by θ from the ct axis: tan θ = v/c = 0.60, so θ = 31°.'],
    [19.2, 24.6, 'The rocket\'s own axes, ct′ and x′, tilt towards the light line by the same angle. The light line is still halfway between them, so light has speed c for the rocket too.'],
    [24.8, 28.8, 'Events A and B happen at the same time for the ground: the line joining them is parallel to the x axis.'],
    [29.0, 33.4, 'For the rocket, lines of equal time are parallel to x′. B is lower on the ct′ axis, so B happens first.'],
    [33.6, 38.0, 'These curves join events with the same space–time interval. They mark 1 m, 2 m, 3 m… of ct in every frame.'],
    [38.2, 42.8, 'At this event the rocket\'s clock reads ct′ = 2 m, but the ground\'s clocks read ct = 2.5 m. Measured from the ground, the moving clock runs slow: time dilation.'],
  ];
  const DURATION = 48;

  Anim.register('spacetime', {
    duration: DURATION,
    poster: 40,
    // hold the picture still near the end of each step so the caption can be read (teacher's request)
    pauses: [[8.1, 2.5], [12.7, 2.5], [18.1, 3], [23.9, 3], [27.9, 2.5], [32.5, 3], [37.1, 3], [41.9, 3], [46.4, 3]],
    // score: calm and precise (pure tones, a soft clock ticking once a second)
    music: { chords: [[53, 57, 60, 64, 67], [50, 57, 60, 64, 65], [46, 53, 57, 62, 64], [48, 55, 57, 62, 64]], bar: 8, pad: 'sine', cutoff: 1400, drone: 0.07, bells: 0.15, bellOct: 2, tick: 1, echo: 0.5, volume: 0.33 },
    resize,
    frame(s, t) {
      D.background(s, 0.28);
      const on = smooth((t - 3.6) / 1) * (1 - smooth((t - 47.2) / 0.7));
      axesS(s, on);
      // an object at rest at x = −3 m
      const rest = fade(t, 4.6, 24.6, 0.4, 0.8) * on, rc = clamp((t - 4.8) / 3.5, 0, 1) * CTMAX;
      if (rest > 0) {
        clip(s, () => D.glowLine(s, [[X(-3), Y(0)], [X(-3), Y(rc)]], C.good, rest, 1.5));
        if (rc < CTMAX) D.glowDot(s, X(-3), Y(rc), 12, C.good, rest);
        const fs = Math.round(clamp(s.W / 70, 11, 16));
        D.text(s, 'at rest', X(-3) - fs * 0.4, Y(0.5), fs, rest, D.sans(fs, 600), C.good, 'right');
      }
      light(s, t, fade(t, 9.3, 47.2, 0.4, 0.7) * on);
      // the rocket's world line, then its axes swinging from S's axes to S′'s
      const swing = smooth((t - 19.4) / 3.2), beta = BETA;
      const wl = fade(t, 13.9, 19.6, 0.4, 0.4) * on, rcRocket = clamp((t - 14.0) / 3.2, 0, 1) * (CTMAX - 0.3);
      if (wl > 0) {
        clip(s, () => D.glowLine(s, [[X(0), Y(0)], [X(beta * rcRocket), Y(rcRocket)]], P_COL, wl, 1.6));
        D.glowDot(s, X(beta * rcRocket), Y(rcRocket), 14, P_COL, wl);
        const fs = Math.round(clamp(s.W / 70, 11, 16));
        if (rcRocket > 3) D.text(s, 'rocket, 0.60c', X(beta * 3.4) + fs * 0.6, Y(3.4), fs, wl, D.sans(fs, 600), P_COL, 'left');
      }
      arc(s, -Math.PI / 2, -Math.PI / 2 + THETA, unit * 1.3, P_COL, fade(t, 15.5, 33.4, 0.6, 0.6) * on, 'θ');
      if (t >= 19.4) {
        const b = lerp(0.001, beta, swing);
        axesP(s, b, on * (t < 19.9 ? smooth((t - 19.4) / 0.5) : 1), smooth((t - 22.6) / 1.5) * on);
        arc(s, 0, -Math.atan(b), unit * 1.6, P_COL, fade(t, 21.0, 33.4, 0.6, 0.6) * on, 'θ');
      }
      // simultaneity
      const sim = fade(t, 24.9, 33.6, 0.5, 0.6) * on;
      if (sim > 0) {
        D.line(s, X(-XMAX), Y(EVC), X(XMAX), Y(EVC), BLUE, 0.8 * sim * (1 - smooth((t - 29) / 0.8) * 0.6), 1.6, [6, 5]);
        const p = smooth((t - 29.1) / 1.6) * sim;
        if (p > 0) for (const xe of [-EVX, EVX]) {
          const cMeet = (EVC - BETA * xe) / (1 - BETA * BETA);            // where the line ∥ x′ meets ct′
          const xm = BETA * cMeet;
          D.line(s, X(xe), Y(EVC), X(lerp(xe, xm, p)), Y(lerp(EVC, cMeet, p)), P_COL, 0.95 * p, 1.6, [6, 5]);
          if (p > 0.95) D.glowDot(s, X(xm), Y(cMeet), 12, P_COL, sim);
        }
        event(s, -EVX, EVC, "A", sim, true); event(s, EVX, EVC, "B", sim, true);
      }
      // curves of equal interval and time dilation
      const hy = fade(t, 33.7, 47.2, 0.8, 0.7) * on;
      if (hy > 0) {
        clip(s, () => {
          for (let k = 1; k <= 4; k++) {
            const pts = [];
            for (let u = -2.4; u <= 2.4; u += 0.04) pts.push([X(k * Math.sinh(u)), Y(k * Math.cosh(u))]);
            D.glowLine(s, pts, C.field, hy * 0.75, 1.1);
            D.glowDot(s, X(0), Y(k), 9, S_COL, hy);
            D.glowDot(s, X(BETA * GAMMA * k), Y(GAMMA * k), 9, P_COL, hy);
          }
        });
        const td = fade(t, 38.3, 47.2, 0.6, 0.7) * on, fs = Math.round(clamp(s.W / 70, 11, 16));
        if (td > 0) {
          const xm = BETA * GAMMA * 2, cm = GAMMA * 2;
          D.line(s, X(0), Y(cm), X(xm), Y(cm), C.white, 0.8 * td, 1.4, [5, 4]);
          D.text(s, 'ct = 2.5 m', X(0) - fs * 0.5, Y(cm), fs, td, D.sans(fs, 600), S_COL, 'right');
          D.text(s, 'ct′ = 2 m', X(xm) + fs * 0.9, Y(cm) + fs * 0.2, fs, td, D.sans(fs, 600), P_COL, 'left');
        }
      }
      D.captions(s, t, CAPS);
      const ea = fade(t, 43.0, 47.6, 0.9, 0.8);
      if (ea > 0) {
        s.g.fillStyle = `rgba(4,6,13,${0.7 * ea})`; s.g.fillRect(0, 0, s.W, s.H);
        const s1 = Math.round(clamp(s.W / 22, 24, 54)), s2 = Math.round(clamp(s.W / 48, 14, 22));
        D.text(s, 'γ = 1 / √(1 − v²/c²)', s.W / 2, s.H * 0.36, s1, ea, D.serif(s1));
        D.text(s, 'At 0.60c, γ = 1 / √0.64 = 1.25', s.W / 2, s.H * 0.36 + s1 * 1.2, s2, ea * 0.85, D.sans(s2));
        D.text(s, '(ct)² − x² = (ct′)² − (x′)²', s.W / 2, s.H * 0.36 + s1 * 2.4, Math.round(s1 * 0.7), ea * 0.9, D.serif(Math.round(s1 * 0.7)));
        s.g.font = D.sans(s2); D.text(s, D.wrap(s, 'The space–time interval is the same in every frame', s.W - 40), s.W / 2, s.H * 0.36 + s1 * 3.3, s2, ea * 0.85, D.sans(s2));
      }
      D.title(s, t, 0.4, 3.8, 'Space–time diagrams', 'How two observers see the same events (HL)');
      D.vignette(s, t, DURATION);
    },
  });
})();
