/* C.3/C.4 Superposition and music: pulses passing through each other, two notes adding to give beats,
   and the harmonics of a string adding to give a note's waveform (timbre). No pauses: the picture never freezes.
   Physics (every curve is an exact sum):
   - Part 1: the visible part (x = −1 to +1) of a longer rope (faded at the edges: no fixed ends) carries two identical Gaussian pulses g(z) = A·exp(−z²/2σ²), σ = 0.07,
     moving at v = 0.10 units per scene second towards each other; the rope is y = y₁ + y₂ at every point.
     Run 1: crest + crest (max 2A where they coincide, at t = 16.0 s). Run 2: crest + equal trough: y = 0
     everywhere at t = 40.5 s, but ∂y/∂t = −2v·g′(x) ≠ 0, so the rope is still moving (drawn as small arrows).
   - Part 2 (beats, beyond the IB syllabus): notes of 440 Hz and 444 Hz. Beat frequency = 444 − 440 = 4 Hz.
     Drawn with far fewer waves: 20 and 21 cycles across the window (one beat per window), scrolling slowly.
     The sum y₁ + y₂ = 2 cos(π(N₂ − N₁)u′)·sin(π(N₁ + N₂)u′): its envelope ±2|cos(…)| is dashed.
     Tuning: f₂ slides from 444 Hz to 440 Hz (drawn 21 → 20 cycles), so the beats slow down and stop.
   - Part 3 (timbre, beyond the IB syllabus): a string's first four harmonics, fₙ = n × 220 Hz = 220, 440, 660, 880 Hz,
     with example amplitudes 1, 0.50, 0.33, 0.25 ("instrument A") and then 1, 0.15, 0.45, 0.10 ("instrument B").
     The string shape is Σ aₙ sin(nπx/L) cos(2πnFt) (slowed: F = 0.3 Hz drawn for 220 Hz), and the sound waveform drawn
     is Σ aₙ sin(2πn·220·t) (phases chosen as zero for the drawing): it repeats every 1/220 s = 4.5 ms, so the pitch is 220 Hz.
   The "Hear it" buttons on the page (js/anim/superpose-sounds.js) play these same frequencies and amplitudes. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- numbers ----------
  const F1 = 440, F2 = 444, BEAT = F2 - F1;                               // Hz
  const FH = 220, HARM = [1, 2, 3, 4];
  const AMP_A = [1, 0.5, 0.33, 0.25], AMP_B = [1, 0.15, 0.45, 0.1];
  const PERIOD_MS = 1000 / FH;                                            // 4.5 ms

  // ---------- timeline (scene seconds) ----------
  const T1 = 2.5, T2 = 27.0;                                              // starts of the two pulse runs
  const V = 0.10, X0 = 1.35, SIG = 0.07;
  const P2 = 49.8, P3 = 93.0, TUNE0 = 79.0, TUNE1 = 92.0, MIXB = 129.8, END_CARD = 144.4, DURATION = 156;
  const meet1 = T1 + X0 / V, meet2 = T2 + X0 / V;                          // 16.0 s and 40.5 s

  const CAPS = [
    [5.0, 10.4, 'Two pulses travel along a rope towards each other, one from each side.'],
    [10.6, 13.6, 'Watch where they meet.'],
    [13.8, 17.4, 'Where they overlap, the displacements add at every point.'],
    [17.6, 22.4, 'Crest + crest gave twice the height for a moment: constructive interference.'],
    [22.6, 27.6, 'Then each pulse carries on unchanged, as if the other had never been there.'],
    [27.8, 38.6, 'Predict: what happens when a crest meets an equal trough?'],
    [39.6, 44.4, 'They cancel: for an instant the rope is flat. Destructive interference.'],
    [44.6, 49.6, 'The energy hasn\x27t gone: the rope is still moving, and both pulses reappear.'],
    [50.4, 56.0, 'Now two continuous waves: two notes, 440 Hz and 444 Hz, as a microphone would record them.'],
    [56.2, 61.6, 'They are drawn slowed down and with far fewer waves, so you can see each one.'],
    [61.8, 67.8, 'Add them point by point. Where they are in step the sum is big; out of step, it almost vanishes.'],
    [68.0, 73.6, 'The loudness swells and fades: beats (beyond the IB syllabus). Beat frequency = f₂ − f₁.'],
    [73.8, 78.6, 'Here: 444 − 440 = 4 beats every second.'],
    [78.8, 85.2, 'A musician tuning a string listens for the beats and adjusts it until they slow down…'],
    [85.4, 92.4, '…and stop. Now both play exactly 440 Hz, and the sum is one steady wave.'],
    [93.4, 99.0, 'Why does a guitar sound different from a flute playing the same note? Superposition again.'],
    [99.2, 105.0, 'A plucked string vibrates in its first harmonic and in higher harmonics at the same time.'],
    [105.2, 111.0, 'Here: the first four harmonics, at 220, 440, 660 and 880 Hz, with smaller amplitudes.'],
    [111.2, 117.4, 'The string\'s real shape is their sum at every point. It keeps changing, but repeats 220 times a second.'],
    [117.6, 123.2, 'So the sound wave repeats 220 times a second: we hear the pitch of the first harmonic.'],
    [123.4, 129.6, 'But the waveform isn\'t a simple sine: its shape comes from the harmonics added together.'],
    [129.8, 138.0, 'Another instrument, same note: a different mix gives a different shape and a different sound. This is timbre (beyond the IB syllabus).'],
    [138.2, 144.0, 'Both repeat 220 times a second, so both play the same note.'],
  ];

  // ---------- colours ----------
  const COL1 = C.vel, COL2 = C.force, SUM = C.light;
  const HCOL = ['143,184,255', '111,211,154', '255,170,85', '220,140,255'];

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;                                // the 4:5 stage (buttons below the picture)
    const capFs = Math.round(clamp(W / 44, 15, 25));
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    const top = phone ? 10 : Math.max(52, H * 0.12);                      // wide: the legend sits top-left, buttons top-right
    const capTop = H - capFs * (phone ? 6.4 : 5.0);
    const mx = phone ? 12 : W * 0.06;
    L = { W, H, phone, fs, capFs, top, capTop, x0: mx, x1: W - mx };
  }

  const gauss = (z) => Math.exp(-(z * z) / (2 * SIG * SIG));
  const dgauss = (z) => -z / (SIG * SIG) * gauss(z);

  // ---------- part 1: the rope ----------
  // The rope is part of a longer rope (it fades out at the edges: no fixed ends, so no reflections). Both runs are
  // always on it: run 2's pulses wait out of sight until T2, and run 1's have left the visible part before run 2's arrive.
  const posAt = (t, T) => { const tau = Math.max(0, t - T); return [-X0 + V * tau, X0 - V * tau]; };
  const EDGE = 0.86;                                                      // the rope fades out between |x| = 0.86 and 1
  const edgeA = (x) => 1 - smooth((Math.abs(x) - EDGE) / (1 - EDGE));
  function rope(s, t) {
    const a = fade(t, 4.6, P2 + 0.2, 0.6, 0.8); if (a <= 0) return;
    const { x0, x1, top, capTop, fs, phone } = L;
    const cy = (top + capTop) / 2, A = Math.min((capTop - top) * 0.28, phone ? 70 : 120);
    const [a1, b1] = posAt(t, T1), [a2, b2] = posAt(t, T2);
    const X = (x) => lerp(x0, x1, (x + 1) / 2), Y = (y) => cy - y * A;
    const N = 320, xs = [], p1 = [], p2 = [], ps = [];
    for (let i = 0; i <= N; i++) {
      const x = -1 + 2 * i / N;
      const yL = gauss(x - a1) + gauss(x - a2);                            // pulses from the left: crests
      const yR = gauss(x - b1) - gauss(x - b2);                            // from the right: a crest (run 1), a trough (run 2)
      xs.push(x); p1.push([X(x), Y(yL)]); p2.push([X(x), Y(yR)]); ps.push([X(x), Y(yL + yR)]);
    }
    const fadeAt = (i) => edgeA(xs[Math.min(N, i)]);
    D.line(s, X(-EDGE), cy, X(EDGE), cy, C.muted, 0.25 * a, 1, [4, 5]);
    D.glowLine(s, p1, COL1, 0.45 * a, 1.2, fadeAt);
    D.glowLine(s, p2, COL2, 0.45 * a, 1.2, fadeAt);
    D.glowLine(s, ps, SUM, a, phone ? 2 : 2.6, fadeAt);
    // labels follow the pulses while they are in view and apart
    const lab = (txt, x, y, rgb, al) => { if (al > 0) D.text(s, txt, X(x), y, fs, 0.9 * a * al, D.sans(fs, 600), rgb); };
    const ap1 = smooth((Math.abs(a1 - b1) - 0.28) / 0.12), ap2 = smooth((Math.abs(a2 - b2) - 0.28) / 0.12);
    lab('crest', a1, Y(1) - fs * 1.1, COL1, ap1 * edgeA(a1));
    lab('crest', b1, Y(1) - fs * 1.1, COL2, ap1 * edgeA(b1));
    if (t > T2) {
      lab('crest', a2, Y(1) - fs * 1.1, COL1, ap2 * edgeA(a2));
      lab('trough', b2, Y(-1) + fs * 1.2, COL2, ap2 * edgeA(b2));
    }
    // the moments of meeting
    const m1 = Math.max(0, 1 - Math.abs(t - meet1) / 1.2), m2 = Math.max(0, 1 - Math.abs(t - meet2) / 1.2);
    if (m1 > 0) D.text(s, 'sum = 2 × height', X(0), Y(2) - fs * 1.2, fs + 1, a * smooth(m1 * 1.5), D.sans(fs + 1, 600), SUM);
    if (m2 > 0) D.text(s, 'sum = 0: flat', X(0), cy - A * 1.3, fs + 1, a * smooth(m2 * 1.5), D.sans(fs + 1, 600), SUM);
    // run 2: the rope is still moving where it is flat (∂y/∂t = −2v g′(x) at the meeting)
    const va = fade(t, meet2 - 1.2, meet2 + 4.8, 0.6, 0.8) * a;
    if (va > 0) {
      for (let k = -3; k <= 3; k++) {
        if (!k) continue;
        const x = k * SIG * 0.9;
        const vy = -V * dgauss(x - a2) - V * dgauss(x - b2);              // ∂/∂t of g(x − a2) − g(x − b2): a2 rising, b2 falling at V
        const len = clamp(vy * A * 0.35, -A * 0.6, A * 0.6);
        const yy = Y(gauss(x - a2) - gauss(x - b2));
        D.arrow(s, X(x), yy, X(x), yy - len, COL1, va, '', { width: 2, head: 7, blur: 6 });
      }
      D.text(s, 'still moving', X(0), cy + A * 1.3, fs, 0.85 * va, D.sans(fs), COL1);
    }
  }

  // ---------- part 2: beats ----------
  const N1 = 20;
  const n2At = (t) => t <= TUNE0 ? 21 : t >= TUNE1 ? 20 : 21 - (t - TUNE0) / (TUNE1 - TUNE0);
  const SCROLL = 0.06;                                                    // windows per second
  // phase (in cycles) of each wave at the left edge: ∫ N(t) × SCROLL dt
  const ph1 = (t) => N1 * SCROLL * (t - P2);
  const ph2 = (t) => {
    const r = SCROLL;
    if (t <= TUNE0) return 21 * r * (t - P2);
    const base = 21 * r * (TUNE0 - P2);
    if (t <= TUNE1) { const d = t - TUNE0; return base + r * (21 * d - d * d / (2 * (TUNE1 - TUNE0))); }
    return base + r * (21 * (TUNE1 - TUNE0) - (TUNE1 - TUNE0) / 2) + 20 * r * (t - TUNE1);
  };
  function beats(s, t) {
    const a = fade(t, P2 + 0.2, P3 + 0.4, 0.8, 0.8); if (a <= 0) return;
    const { g } = s, { x0, x1, top, capTop, fs, phone } = L;
    const gx0 = x0, gx1 = x1, lh = fs * 1.5;
    // rows: each wave has its label line above it; the sum needs twice the height; two text lines below
    const A = Math.max(6, (capTop - top - lh * 5.4) / 8.2);
    const rows = [];
    rows[0] = top + lh + A; rows[1] = rows[0] + A + lh + A; rows[2] = rows[1] + A + lh + 2 * A;
    const yNote = rows[2] + 2 * A + fs * 0.9, yRead = yNote + lh;
    const n2 = n2At(t), f2 = F1 + (n2 - N1) * BEAT;
    const N = Math.max(400, Math.round((gx1 - gx0) * 1.2)), w1 = [], w2 = [], ws = [], envT = [], envB = [];
    const p1 = ph1(t), p2 = ph2(t);
    for (let i = 0; i <= N; i++) {
      const u = i / N, x = lerp(gx0, gx1, u);
      const y1 = Math.sin(2 * Math.PI * (N1 * u + p1)), y2 = Math.sin(2 * Math.PI * (n2 * u + p2));
      w1.push([x, rows[0] - y1 * A]); w2.push([x, rows[1] - y2 * A]); ws.push([x, rows[2] - (y1 + y2) * A]);
      const env = 2 * Math.abs(Math.cos(Math.PI * ((n2 - N1) * u + (p2 - p1))));
      envT.push([x, rows[2] - env * A]); envB.push([x, rows[2] + env * A]);
    }
    const sumA = smooth((t - 61.8) / 1.2);
    for (const [i, y] of rows.entries()) D.line(s, gx0, y, gx1, y, C.muted, 0.2 * a * (i < 2 ? 1 : sumA), 1);
    D.glowLine(s, w1, COL1, 0.85 * a, 1.2);
    D.glowLine(s, w2, COL2, 0.85 * a, 1.2);
    D.glowLine(s, ws, SUM, sumA * a, phone ? 1.4 : 1.8);
    const ea = smooth((t - 68.2) / 1.2) * a;
    if (ea > 0) {
      g.setLineDash([5, 5]);
      for (const p of [envT, envB]) { g.beginPath(); p.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = `rgba(${SUM},${0.55 * ea})`; g.lineWidth = 1.2; g.stroke(); }
      g.setLineDash([]);
    }
    // labels
    const lab = (txt, y, amp, rgb, al2 = 1) => D.text(s, txt, gx0, y - amp - lh * 0.55, fs, 0.9 * a * al2, D.sans(fs, 600), rgb, 'left');
    lab(`note 1: ${F1} Hz`, rows[0], A, COL1);
    lab(`note 2: ${f2.toFixed(f2 % 1 ? 1 : 0)} Hz`, rows[1], A, COL2);
    lab('their sum', rows[2], 2 * A, SUM, sumA);
    // readout: beat frequency
    const ra = smooth((t - 73.8) / 1) * a;
    if (ra > 0) {
      const bf = f2 - F1;
      const txt = `beats: ${bf.toFixed(bf % 1 ? 1 : 0)} per second`;
      D.text(s, txt, gx1, yRead, fs + 1, ra, D.sans(fs + 1, 600), SUM, 'right');
    }
    const oa = fade(t, 68.2, 78.8, 0.8, 0.6) * a;
    if (oa > 0) D.text(s, 'one beat = the whole width = 0.25 s', gx0, yRead, fs - 1, 0.8 * oa, D.sans(fs - 1), SUM, 'left');
    D.text(s, 'time →', gx1, yNote, fs - 1, 0.7 * a, D.sans(fs - 1), C.muted, 'right');
    D.text(s, phone ? 'slowed down: far fewer waves drawn' : 'drawn slowed down, with far fewer waves than real', gx0, yNote, fs - 1, 0.7 * a * smooth((t - 56.2) / 1), D.sans(fs - 1), C.muted, 'left');
  }

  // ---------- part 3: harmonics and timbre ----------
  const FD = 0.3;                                                         // drawn frequency of the first harmonic (Hz)
  const ampsAt = (t) => { const k = smooth((t - MIXB) / 2.5); return AMP_A.map((v, i) => lerp(v, AMP_B[i], k)); };
  function harmonics(s, t) {
    const a = fade(t, P3 + 0.2, END_CARD + 0.6, 0.8, 0.8); if (a <= 0) return;
    const { g } = s, { x0, x1, top, capTop, fs, phone, W } = L;
    const amps = ampsAt(t), tt = t - P3;
    const showH = smooth((t - 99.4) / 1.5) * a, showSum = smooth((t - 111.2) / 1.5) * a, showWave = smooth((t - 117.6) / 1.5) * a;
    // regions
    let hx0, hx1, rowsY, rowH, sx0, sx1, sy, sA, wx0, wx1, wy, wA;
    if (phone) {
      hx0 = x0 + fs * 6.6; hx1 = x1; rowH = (capTop - top) * 0.12;
      rowsY = HARM.map((n, i) => top + rowH * (i + 0.6));
      sx0 = x0 + fs * 6.6; sx1 = x1; sy = top + rowH * 4.4 + (capTop - top) * 0.09; sA = (capTop - top) * 0.09;
      wx0 = x0 + 4; wx1 = x1; wy = capTop - (capTop - top) * 0.17; wA = (capTop - top) * 0.1;
    } else {
      hx0 = x0 + fs * 10; hx1 = W * 0.47; rowH = (capTop - top) / 4.3;
      rowsY = HARM.map((n, i) => top + rowH * (i + 0.55));
      sx0 = W * 0.53; sx1 = x1; sy = top + (capTop - top) * 0.22; sA = (capTop - top) * 0.13;
      wx0 = W * 0.53; wx1 = x1; wy = top + (capTop - top) * 0.68; wA = (capTop - top) * 0.13;
    }
    const hA = rowH * (phone ? 0.42 : 0.32);
    // the four harmonics, each a standing wave on its own copy of the string
    if (showH > 0) HARM.forEach((n, i) => {
      const pts = [], an = amps[i], c = Math.cos(2 * Math.PI * n * FD * tt);
      for (let k = 0; k <= 160; k++) { const u = k / 160; pts.push([lerp(hx0, hx1, u), rowsY[i] - an * Math.sin(n * Math.PI * u) * c * hA]); }
      D.line(s, hx0, rowsY[i], hx1, rowsY[i], C.muted, 0.18 * showH, 1);
      g.fillStyle = `rgba(${C.muted},${0.7 * showH})`; g.fillRect(hx0 - 3, rowsY[i] - 6, 3, 12); g.fillRect(hx1, rowsY[i] - 6, 3, 12);
      D.glowLine(s, pts, HCOL[i], showH, 1.4);
      const nm = ['1st', '2nd', '3rd', '4th'][i];
      D.text(s, phone ? `${nm}` : `${nm} harmonic`, x0, rowsY[i] - fs * 0.45, fs, 0.9 * showH, D.sans(fs, 600), HCOL[i], 'left');
      D.text(s, phone ? `${n * FH} Hz, ${an.toFixed(2)}` : `${n * FH} Hz · amplitude ${an.toFixed(2)}`, x0, rowsY[i] + fs * 0.75, fs - 1, 0.75 * showH, D.sans(fs - 1), C.muted, 'left');
    });
    if (showH > 0) D.text(s, 'drawn slowed down', hx1, top - (phone ? 0 : fs * 0.4) + (phone ? rowH * 4.05 : -fs * 0.6), fs - 1, 0.6 * showH, D.sans(fs - 1), C.muted, 'right');
    // the real string: the sum of all four
    if (showSum > 0) {
      const pts = [];
      for (let k = 0; k <= 200; k++) {
        const u = k / 200; let y = 0;
        HARM.forEach((n, i) => { y += amps[i] * Math.sin(n * Math.PI * u) * Math.cos(2 * Math.PI * n * FD * tt); });
        pts.push([lerp(sx0, sx1, u), sy - y * sA * 0.62]);
      }
      D.line(s, sx0, sy, sx1, sy, C.muted, 0.18 * showSum, 1);
      g.fillStyle = `rgba(${C.muted},${0.7 * showSum})`; g.fillRect(sx0 - 3, sy - 7, 3, 14); g.fillRect(sx1, sy - 7, 3, 14);
      D.glowLine(s, pts, SUM, showSum, phone ? 1.8 : 2.2);
      D.text(s, phone ? 'the string: the sum' : 'the real string: the sum of all four', phone ? x0 : sx0, phone ? sy - sA - fs * 0.2 : sy - sA - fs * 0.6, fs, 0.9 * showSum, D.sans(fs, 600), SUM, 'left');
    }
    // the sound waveform: Σ aₙ sin(2πn·u), two and a half repeats, scrolling slowly
    if (showWave > 0) {
      const reps = 2.5, scroll = 0.12 * tt;
      const wave = (am, u) => { let y = 0; HARM.forEach((n, i) => { y += am[i] * Math.sin(2 * Math.PI * n * (u + scroll)); }); return y; };
      const norm = 1.75;
      const showBoth = smooth((t - 138.2) / 1.2);
      const draw = (am, rgb, al) => {
        const pts = [];
        for (let k = 0; k <= 400; k++) { const u = k / 400 * reps; pts.push([lerp(wx0, wx1, k / 400), wy - wave(am, u) / norm * wA]); }
        D.glowLine(s, pts, rgb, al, phone ? 1.4 : 1.8);
      };
      D.line(s, wx0, wy, wx1, wy, C.muted, 0.2 * showWave, 1);
      if (showBoth > 0) draw(AMP_A, C.vel, 0.6 * showBoth * showWave);
      draw(amps, SUM, showWave);
      D.text(s, 'the sound wave it makes (its shape)', wx0, wy - wA - fs * 0.7, fs, 0.9 * showWave, D.sans(fs, 600), SUM, 'left');
      // one repeat marked: 1/220 s
      const per = (wx1 - wx0) / reps, by = wy + wA + fs * 0.7;
      D.line(s, wx0, by, wx0 + per, by, C.text, 0.7 * showWave, 1.2);
      D.line(s, wx0, by - 4, wx0, by + 4, C.text, 0.7 * showWave, 1.2); D.line(s, wx0 + per, by - 4, wx0 + per, by + 4, C.text, 0.7 * showWave, 1.2);
      D.text(s, `one repeat: 1/220 s = ${PERIOD_MS.toFixed(1)} ms`, wx0 + per + fs * 0.6, by, fs - 1, 0.85 * showWave, D.sans(fs - 1), C.text, 'left');
      if (showBoth > 0) {
        D.text(s, 'instrument A', wx1, wy - wA - fs * 0.7, fs - 1, 0.8 * showBoth * showWave, D.sans(fs - 1, 600), C.vel, 'right');
        D.text(s, 'instrument B', wx1, wy - wA - fs * 1.9, fs - 1, 0.8 * showBoth * showWave, D.sans(fs - 1, 600), SUM, 'right');
      } else {
        const mixB = smooth((t - MIXB) / 2.5);
        D.text(s, mixB > 0.5 ? 'instrument B' : 'instrument A', wx1, wy - wA - fs * 0.7, fs - 1, 0.8 * showWave, D.sans(fs - 1, 600), SUM, 'right');
      }
    }
  }

  // ---------- end card ----------
  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 30, 18, 38)), s2 = Math.round(clamp(W / 52, 13, 20)), s3 = Math.round(clamp(W / 64, 11, 17));
    g.font = D.sans(s1, 300);
    const head = D.wrap(s, 'Superposition: where waves overlap, their displacements add', W - 48);
    D.text(s, head, W / 2, H * (phone ? 0.1 : 0.14), s1, a, D.sans(s1, 300));
    const items = [
      ['Pulses', COL1, 'They pass through each other unchanged. Crest + crest adds up; crest + trough cancels for an instant.'],
      ['Beats (beyond the syllabus)', COL2, 'Two close frequencies: the loudness swells and fades f₂ − f₁ times a second.'],
      ['Harmonics and timbre (beyond the syllabus)', SUM, 'A note is the sum of its harmonics. The pitch is set by the first harmonic\'s frequency; the mix sets the sound.'],
    ];
    let y = H * (phone ? 0.1 : 0.14) + s1 * 1.3 * head.length + s2 * 1.4;
    const colW = phone ? W - 40 : Math.min(W * 0.8, 760);
    for (const [h, rgb, txt] of items) {
      D.text(s, h, W / 2, y, s2 + 1, a, D.sans(s2 + 1, 600), rgb); y += s2 * 1.5;
      g.font = D.sans(s3); const ls = D.wrap(s, txt, colW); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 1.1;
    }
  }

  function legendFor(s, t) {
    if (L.phone) return;
    if (t > 4.6 && t < P2) D.legend(s, [['line', COL1, 'pulse from the left'], ['line', COL2, 'pulse from the right'], ['line', SUM, 'the rope: their sum']], fade(t, 4.6, P2, 0.6, 0.6));
  }

  Anim.register('superpose', {
    duration: DURATION,
    poster: 70,
    // score: a quiet concert hall (A major, a triangle pad, a low drone, a soft shimmer, a slow swell)
    music: { chords: [[45, 52, 57, 61], [42, 49, 54, 57], [38, 45, 50, 54], [40, 47, 52, 56]], bar: 9, pad: 'triangle', cutoff: 800, drone: 0.09, shimmer: 0.2, tremolo: 0.2, volume: 0.58 },
    resize: layout,
    info: {
      CAPS, meet1, meet2, BEAT, PERIOD_MS, AMP_A, AMP_B,
      check() {
        const out = {};
        out.beat = F2 - F1;                                               // 4
        out.harmonics = HARM.map((n) => n * FH);                          // 220, 440, 660, 880
        out.periodMs = +(1000 / FH).toFixed(2);                           // 4.55
        out.meet = [meet1, meet2];                                        // 16, 40.5
        out.capRates = CAPS.map(([a, b, txt]) => +(txt.length / (b - a)).toFixed(1));
        out.maxRate = Math.max(...out.capRates);
        return out;
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.22);
      rope(s, t);
      beats(s, t);
      harmonics(s, t);
      legendFor(s, t);
      D.captions(s, t, CAPS);
      D.title(s, t, 0.4, 4.4, 'Superposition and music', 'Adding waves: pulses, beats and harmonics');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
