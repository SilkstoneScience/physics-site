/* C.2 Transverse and longitudinal waves. A rope of beads carries a transverse wave, then a row of particles
   carries a longitudinal wave; the longitudinal snapshot is turned into a displacement–distance graph, one
   particle's displacement–time graph is drawn beside it, and finally both waves show v = fλ.
   Physics (every particle, exactly): a wave travelling to the right (+x) from a source at x = 0 that starts at
   rest at clock time τ = 0: y(x, τ) = A sin(ωτ − kx) for x ≤ vτ (the front), and 0 beyond it.
   Transverse: y is up. Longitudinal: the displacement s is along the line, to the right positive.
   Numbers (checked): λ = 1.6 m, T = 2.0 s, so f = 1/T = 0.50 Hz and v = λ/T = 1.6 ÷ 2.0 = 0.80 m/s = fλ = 0.50 × 1.6.
   k = 2π/λ = 3.93 rad/m, ω = 2π/T = 3.14 rad/s. Amplitudes: rope 0.25 m; longitudinal 0.14 m, so
   kA = 3.93 × 0.14 = 0.55 < 1 (neighbouring particles never pass each other).
   Compressions: the spacing is stretched by 1 + ds/dx = 1 − kA cos(ωτ − kx), smallest where ωτ − kx = 0 (mod 2π).
   There s = 0, with s > 0 just to the left and s < 0 just to the right: particles on both sides are displaced
   towards it, and the displacement–distance graph crosses zero going down. Rarefactions: ωτ − kx = π, the graph
   crosses zero going up. Density there: 1/(1 − 0.55) = 2.2 and 1/(1 + 0.55) = 0.65 times the average.
   Sound: v = 340 m/s, f = 170 Hz → λ = 340 ÷ 170 = 2.0 m.
   The front reaches the end of the 4.0 m rope after 4.0 ÷ 0.80 = 5.0 s (3.2 m on phones: 4.0 s). */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- physics ----------
  const LAM = 1.6, TP = 2.0, F = 1 / TP, V = LAM / TP, K = 2 * Math.PI / LAM, OM = 2 * Math.PI / TP;
  const AT = 0.25, AL = 0.14;                                          // amplitudes (m)
  const DXT = 0.1, DXL = 0.08;                                         // bead spacing; particle spacing (m)
  const IG = 18, XG = IG * DXL, XGT = 14 * DXT;                       // the gold particle (1.44 m) and the gold bead (1.4 m)
  const yRope = (x, tau) => (x > V * tau ? 0 : AT * Math.sin(OM * tau - K * x));
  const yRopeE = (x, tau) => AT * Math.sin(OM * tau - K * x);          // the end: a steady wave, the same shape as the graph
  const sL = (x, tau) => (x > V * tau ? 0 : AL * Math.sin(OM * tau - K * x));
  const densL = (x, tau) => (x > V * tau ? 1 : 1 / (1 - K * AL * Math.cos(OM * tau - K * x)));

  // ---------- timeline (scene seconds) ----------
  const T0 = 6.0, T1 = 37.0;                                          // the transverse and longitudinal sources start
  const FZ0 = 62.5, FZ1 = 87.8, RAMP = 0.6;                            // the longitudinal snapshot (frozen) between these
  const tD0 = 88.6, TG = 8;                                           // the displacement–time graph starts; its time axis (s)
  const END_CARD = 116.4, DURATION = 130;
  const tauT = (t) => Math.max(0, t - T0);
  // the longitudinal clock: rate 1, slowing smoothly to 0 for the snapshot and back again (worked out once, then looked up)
  const STEP = 0.01, NT = Math.ceil(DURATION / STEP) + 2, TAU = new Float64Array(NT);
  const rate = (t) => (t < T1 ? 0 : t < FZ0 ? 1 : t < FZ1 ? 1 - smooth((t - FZ0) / RAMP) : smooth((t - FZ1) / RAMP));
  for (let i = 1; i < NT; i++) TAU[i] = TAU[i - 1] + STEP * 0.5 * (rate((i - 1) * STEP) + rate(i * STEP));
  const tauL = (t) => { const f = clamp(t / STEP, 0, NT - 1.001), i = Math.floor(f); return lerp(TAU[i], TAU[i + 1], f - i); };
  const tauD0 = tauL(tD0);
  // the period timed at the end starts when a compression is at x = 0.80 m (between 100.8 s and 102.8 s)
  const XS = 0.80, tE = 100.8;
  const nE = Math.ceil((tauL(tE) * V - XS) / LAM), tauE1 = (XS + nE * LAM) / V, tE1 = tE + (tauE1 - tauL(tE));
  // the gold particle's crests on its displacement–time graph (ωτ − kx = π/2 mod 2π), in graph time τ − τD0
  const crest0 = (() => { let tc = (Math.PI / 2 + K * XG) / OM; while (tc < tauD0 + 0.2) tc += TP; return tc - tauD0; })();

  // ---------- captions ----------
  const CAPS = [
    [4.8, 9.6, 'A rope, drawn as a row of beads. Its left end is moved up and down in simple harmonic motion.'],
    [9.8, 14.6, 'Each bead copies the motion of the bead before it, a little later. A wave travels along the rope.'],
    [14.8, 19.6, 'Predict: does the gold bead travel along the rope with the wave?'],
    [19.8, 24.8, 'No. It only moves up and down about its equilibrium position. The wave moves along; the rope doesn\'t.'],
    [25.0, 30.0, 'This is a transverse wave: the particles oscillate perpendicular to the direction the wave travels.'],
    [30.2, 35.2, 'The wave transfers energy along the rope, with no overall transfer of matter. Every bead stays in its place.'],
    [36.6, 41.6, 'Now the end moves back and forth, along the line of particles. This makes a longitudinal wave.'],
    [41.8, 46.8, 'The particles bunch up in compressions (C) and spread out in rarefactions (R). These travel along.'],
    [47.0, 51.8, 'Predict: does the gold particle travel along with the compressions?'],
    [52.0, 57.0, 'No. It oscillates back and forth about its equilibrium position, parallel to the direction of travel.'],
    [57.2, 62.2, 'Sound is a longitudinal wave. Compressions are regions of higher pressure; rarefactions, of lower pressure.'],
    [62.4, 67.4, 'A snapshot. Each arrow shows a particle\'s displacement from its equilibrium position (to the right is positive).'],
    [67.6, 72.6, 'Turn each arrow through 90° and plot it: a displacement–distance graph, the same shape as for a transverse wave.'],
    [72.8, 77.8, 'A compression is where particles on both sides are displaced towards it: where the graph crosses zero going down.'],
    [78.0, 82.8, 'A rarefaction is where particles on both sides are displaced away from it: the graph crosses zero going up.'],
    [83.0, 88.2, 'The wavelength λ = 1.6 m: compression to compression, or crest to crest on the graph. The amplitude is 0.14 m.'],
    [88.6, 93.6, 'The other kind of wave graph: displacement against time, for the gold particle only.'],
    [93.8, 99.2, 'Read the axis first! On a displacement–time graph the repeat is the period, T = 2.0 s, not the wavelength.'],
    [99.6, 104.8, 'In one period, T = 2.0 s, every particle makes one full oscillation and the wave moves on exactly one wavelength.'],
    [105.0, 110.4, 'So v = λ/T = 1.6 ÷ 2.0 = 0.80 m s⁻¹. With f = 1/T = 0.50 Hz, that is v = fλ = 0.50 × 1.6 = 0.80 m s⁻¹.'],
    [110.6, 116.0, 'The source sets the frequency; the medium sets the speed. Sound in air (340 m s⁻¹): a 170 Hz note has λ = 2.0 m.'],
  ];

  // ---------- colours ----------
  const ROPE = '205,214,245', DOT = '205,214,245', GOLD = C.light, DISP = C.vel, COMP = C.field, RARE = C.muted, MARK = C.good;
  const ENERGY = '255,150,90';

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, tall = H > W * 0.8, small = W < 520;
    const capFs = clamp(W / 44, 15, 25), capTop = H - capFs * (small ? 6.6 : 5.4);
    const fs = small ? 10 : Math.round(clamp(W / 80, 11, 16));
    const XM = tall ? 3.2 : 4.0;
    const x0 = tall ? Math.max(24, W * 0.075) : W * 0.065, xR = W - (tall ? Math.max(12, W * 0.035) : W * 0.04);
    const sc = (xR - x0) / XM;
    const yA = tall ? Math.max(AT * sc + fs * 3.2, H * 0.15) : H * 0.25;
    const band = tall ? Math.max(13, sc * 0.13) : sc * 0.12;            // half the height of the band of particles
    // gy0: below the rope (for the end, rope above the row); gG: below the row of particles (for the graphs)
    const gy0 = yA + AT * sc + fs * 3.6, gy1 = capTop - fs * 0.6, gG = yA + band + fs * 2.8;
    const full = { x0, x1: xR, y0: gG + fs * 1.6, y1: gy1 };
    const gap = tall ? fs * 2.4 : fs * 4.5;
    let slotA, slotB;
    if (tall) {
      const mid = (gG + gy1) / 2;
      slotA = { x0, x1: xR, y0: gG + fs * 1.6, y1: mid - gap / 2 };
      slotB = { x0, x1: xR, y0: mid + gap / 2 + fs * 1.6, y1: gy1 };
    } else {
      const wA = (xR - x0 - gap) / 2;
      slotA = { x0, x1: x0 + wA, y0: full.y0, y1: gy1 };
      slotB = { x0: x0 + wA + gap, x1: xR, y0: full.y0, y1: gy1 };
    }
    const rows = 5, rowGap = (2 * band) / (rows - 1 + 0.6);
    const nT = Math.round(XM / DXT) + 1, nL = Math.round(XM / DXL) + 1;
    // fixed small vertical offsets so the particles look like a gas, not a lattice
    let seed = 1116; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const jit = Array.from({ length: rows }, () => Array.from({ length: nL }, () => (rnd() - 0.5) * 0.5));
    L = { W, H, tall, small, fs, capTop, XM, x0, xR, sc, yA, band, gy0, gy1, full, slotA, slotB, rows, rowGap, nT, nL, jit,
      yMid: (gy0 + gy1) / 2 + fs * 0.4, yC: capTop / 2 + fs, iG: IG,
      X: (x) => x0 + x * sc };
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
  const ball = (s, x, y, r, rgb, a) => {
    const { g } = s; if (a <= 0 || !(r > 0)) return;
    g.globalCompositeOperation = 'source-over';
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, `rgba(${rgb},${a})`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  };
  // a double-headed arrow
  const dbl = (s, ax, ay, bx, by, rgb, a, w = 2) => {
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    D.arrow(s, mx, my, ax, ay, rgb, a, '', { width: w, head: 8, blur: 6 });
    D.arrow(s, mx, my, bx, by, rgb, a, '', { width: w, head: 8, blur: 6 });
  };
  // a small triangle pointing down at (x, y)
  const tri = (s, x, y, size, rgb, a) => {
    const { g } = s; if (a <= 0) return;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(${rgb},${a})`;
    g.shadowColor = `rgba(${rgb},${0.8 * a})`; g.shadowBlur = 8;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - size * 0.6, y - size); g.lineTo(x + size * 0.6, y - size); g.closePath(); g.fill();
    g.shadowBlur = 0;
  };
  // a bracket between x1 and x2 at height y, with a label above
  function bracket(s, x1, x2, y, rgb, a, parts, right = false) {
    if (a <= 0 || x2 - x1 < 2) return;
    const h = Math.max(4, L.fs * 0.45);
    D.line(s, x1, y - h, x1, y + h, rgb, a, 1.6); D.line(s, x2, y - h, x2, y + h, rgb, a, 1.6);
    D.line(s, x1, y, x2, y, rgb, a, 1.6);
    if (parts) rich(s, parts, right ? x2 + L.fs * 0.7 : (x1 + x2) / 2, right ? y : y - L.fs * 1.0, L.fs + 2, a, rgb, right ? 'left' : 'center');
  }

  // ---------- the rope (transverse) ----------
  function drawRope(s, t, tau, yc, a, steady) {
    if (a <= 0) return;
    const { X, sc, XM, nT, fs } = L, yOf = steady ? yRopeE : yRope;
    const Y = (x) => yc - yOf(x, tau) * sc;
    // the equilibrium line and the gold bead's dashed line (A4 onwards)
    const aEq = a * fade(t, 19.8, 35.2, 0.8, 0.8);
    if (aEq > 0) {
      D.line(s, X(0), yc, X(XM), yc, C.muted, 0.35 * aEq, 1, [5, 6]);
      D.text(s, 'equilibrium position', X(XM), yc + AT * sc + fs * 1.4, fs, 0.7 * aEq, D.sans(fs), C.muted, 'right');
    }
    // the source: a handle at the left end, moved up and down
    const hy = Y(0), hw = Math.max(6, fs * 0.7), hh = Math.max(14, fs * 1.8);
    s.g.globalCompositeOperation = 'source-over';
    s.g.fillStyle = `rgba(120,135,190,${0.9 * a})`;
    s.g.beginPath(); s.g.roundRect(X(0) - hw - 3, hy - hh / 2, hw, hh, 3); s.g.fill();
    // the rope itself
    const pts = []; for (let i = 0; i <= 240; i++) { const x = XM * i / 240; pts.push([X(x), Y(x)]); }
    D.glowLine(s, pts, ROPE, 0.55 * a, L.small ? 1.4 : 2);
    // energy: brightest where the beads move fastest (and the rope is steepest), travelling with the wave
    const aE = a * fade(t, 30.2, 35.2, 0.8, 0.8);
    const r = L.small ? 2.6 : clamp(sc * 0.026, 3, 6);
    for (let i = 0; i < nT; i++) {
      const x = i * DXT, gold = !steady && Math.abs(x - XGT) < 1e-6 && t > 14.8;
      if (aE > 0 && x <= V * tau) { const c = Math.cos(OM * tau - K * x); D.glowDot(s, X(x), Y(x), r * 5, ENERGY, aE * c * c * 0.9); }
      if (gold) continue;
      ball(s, X(x), Y(x), r, '120,130,170', a);
    }
    if (!steady && t > 14.8) {
      const ag = a * smooth((t - 14.8) / 0.6);
      D.glowDot(s, X(XGT), Y(XGT), r * 4.5, GOLD, ag * 0.9);
      ball(s, X(XGT), Y(XGT), r * 1.25, '200,150,40', ag);
    }
    return Y;
  }
  function ropeExtras(s, t, tau, yA) {
    const { X, sc, XM, fs } = L, Y = (x) => yA - yRope(x, tau) * sc;
    // the gold bead's straight-up-and-down path (A4)
    const a4 = fade(t, 19.8, 35.2, 0.8, 0.8);
    if (a4 > 0) D.line(s, X(XGT), yA - AT * sc - fs * 0.8, X(XG), yA + AT * sc + fs * 0.8, GOLD, 0.45 * a4, 1.2, [4, 5]);
    // one crest, followed along the rope (A4): the crests are where ωτ − kx = π/2 (mod 2π)
    const aC = fade(t, 20.2, 25.2, 0.8, 0.8);
    if (aC > 0) {
      // the right-most crest on the rope: it rides along to the end, then the next one takes over
      const base = V * tau - LAM / 4, n = Math.ceil((base - XM) / LAM), xx = base - n * LAM;
      if (xx > 0) {
        const al = aC * (1 - smooth((xx - (XM - 0.4)) / 0.35)) * smooth((xx - (XM - LAM)) / 0.3);
        tri(s, X(xx), Y(xx) - fs * 0.7, fs * 0.9, MARK, al);
        D.text(s, 'crest', X(xx), Y(xx) - fs * 2.4, fs, al, D.sans(fs, 600), MARK);
      }
    }
    // A5: perpendicular: the bead oscillates up and down, the wave travels along
    const a5 = fade(t, 25.0, 30.0, 0.7, 0.7);
    if (a5 > 0) {
      const xg = X(XGT) - fs * 1.4;
      dbl(s, xg, yA - AT * sc, xg, yA + AT * sc, DISP, a5);
      D.text(s, L.small ? 'oscillates' : 'the bead oscillates', xg - fs * 0.6, yA + AT * sc + fs * 1.3, fs, 0.9 * a5, D.sans(fs, 600), DISP, 'right');
    }
    const aTr = Math.max(a5, fade(t, 30.2, 35.2, 0.7, 0.7));
    if (aTr > 0) {
      const y = yA - AT * sc - fs * 2.6, xa = X(XM * 0.55), xb = X(XM * 0.85);
      D.arrow(s, xa, y, xb, y, C.white, 0.85 * aTr, '', { width: 2.2, head: 10, blur: 6 });
      const aw = fade(t, 30.2, 35.2, 0.7, 0.7);
      D.text(s, 'the wave travels', xa - fs * 0.6, y, fs, 0.85 * a5, D.sans(fs, 600), C.white, 'right');
      D.text(s, 'energy travels', xa - fs * 0.6, y, fs, 0.85 * aw, D.sans(fs, 600), ENERGY, 'right');
    }
  }

  // ---------- the row of particles (longitudinal) ----------
  function drawRow(s, t, tau, yc, a) {
    if (a <= 0) return;
    const { g } = s, { X, sc, XM, nL, rows, rowGap, band, fs, jit, iG } = L;
    // pressure: a violet tint where the particles are bunched (from B5)
    const aP = a * smooth((t - 57.2) / 1.0) * (1 - 0.4 * smooth((t - 62.4) / 1)) ;
    if (aP > 0) {
      const gr = g.createLinearGradient(X(0), 0, X(XM), 0);
      for (let j = 0; j <= 96; j++) {
        const x = XM * j / 96, d = densL(x, tau), al = clamp((d - 0.65) / (2.22 - 0.65), 0, 1);
        gr.addColorStop(j / 96, `rgba(${COMP},${(0.04 + 0.32 * al) * aP})`);
      }
      g.globalCompositeOperation = 'source-over'; g.fillStyle = gr;
      g.beginPath(); g.roundRect(X(0) - 4, yc - band - 6, XM * sc + 8, 2 * band + 12, 6); g.fill();
    }
    // the source: a paddle at the left end, pushed back and forth
    const px = X(sL(0, tau)), r = L.small ? 2.1 : clamp(sc * 0.02, 2.4, 4.6);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(120,135,190,${0.9 * a})`;
    g.beginPath(); g.roundRect(px - r - Math.max(5, fs * 0.6), yc - band - 4, Math.max(4, fs * 0.45), 2 * band + 8, 2); g.fill();
    // the particles
    const showGold = t > 47.0;
    for (let rr = 0; rr < rows; rr++) {
      const y0 = yc + (rr - (rows - 1) / 2) * rowGap;
      for (let i = 0; i < nL; i++) {
        const xe = i * DXL, x = xe + sL(xe, tau), y = y0 + jit[rr][i] * rowGap;
        if (showGold && rr === (rows - 1) / 2 && i === iG) continue;
        ball(s, X(x), y, r, '120,130,170', a);
      }
    }
    if (showGold) {
      const ag = a * smooth((t - 47.0) / 0.6), x = X(iG * DXL + sL(iG * DXL, tau));
      D.glowDot(s, x, yc, r * 5, GOLD, ag * 0.9);
      ball(s, x, yc, r * 1.35, '200,150,40', ag);
    }
  }
  // positions of the compressions (phase 0) and rarefactions (phase π) behind the front, inside the row
  function marks(tau, phase) {
    const out = [], xf = V * tau;
    for (let n = Math.max(0, Math.floor((xf - phase / K - L.XM) / LAM)); ; n++) {
      const x = xf - phase / K - n * LAM;
      if (x < -0.01) break;
      if (x <= L.XM + 0.01 && xf - x > LAM / 4) out.push(x);
    }
    return out;
  }
  function rowLabels(s, t, tau, yc, a) {
    const { X, fs, band, XM, sc } = L;
    const aCR = a * smooth((t - 41.8) / 0.8);
    if (aCR > 0) {
      const y = yc - band - fs * 1.1;
      for (const x of marks(tau, 0)) D.text(s, 'C', X(x), y, fs + 2, aCR * edge(x), D.sans(fs + 2, 700), COMP);
      for (const x of marks(tau, Math.PI)) D.text(s, 'R', X(x), y, fs + 2, aCR * edge(x) * 0.9, D.sans(fs + 2, 700), RARE);
    }
    // B4: the gold particle's back-and-forth range about its equilibrium position
    const a4 = fade(t, 52.0, 62.2, 0.8, 0.8);
    if (a4 > 0) {
      const xg = X(XG), y = yc + band + fs * 1.0;
      D.line(s, xg, yc - band - 2, xg, yc + band + 2, GOLD, 0.5 * a4, 1.2, [3, 4]);
      dbl(s, X(XG - AL) - 2, y, X(XG + AL) + 2, y, DISP, a4 * fade(t, 52.0, 57.0, 0.7, 0.7));
      D.text(s, 'oscillates', X(XG + AL) + fs * 0.8, y, fs, 0.9 * a4 * fade(t, 52.0, 57.0, 0.7, 0.7), D.sans(fs, 600), DISP, 'left');
      const yA2 = yc - band - fs * 2.8, xa = X(XM * 0.55), xb = X(XM * 0.85), at = a4 * fade(t, 52.0, 57.0, 0.7, 0.7);
      D.arrow(s, xa, yA2, xb, yA2, C.white, 0.85 * at, '', { width: 2.2, head: 10, blur: 6 });
      D.text(s, 'the wave travels', xa - fs * 0.6, yA2, fs, 0.85 * at, D.sans(fs, 600), C.white, 'right');
    }
    // the snapshot badge while frozen
    const aS = a * fade(t, FZ0, FZ1 + 0.5, 0.6, 0.6);
    if (aS > 0) D.text(s, L.small ? 'snapshot: frozen' : 'snapshot: the wave frozen at one instant', X(XM), yc - band - fs * 2.8, fs, 0.8 * aS, D.sans(fs, 600), C.light, 'right');
    void sc;
  }
  const edge = (x) => smooth((x + 0.02) / 0.08) * smooth((L.XM + 0.02 - x) / 0.08);

  // ---------- graphs ----------
  const lerpRect = (p, q, u) => ({ x0: lerp(p.x0, q.x0, u), x1: lerp(p.x1, q.x1, u), y0: lerp(p.y0, q.y0, u), y1: lerp(p.y1, q.y1, u) });
  const gScale = (r) => ((r.y1 - r.y0) / 2 - L.fs * 0.2) / (AL * 1.4);
  function axes(s, r, a, xLabel, yLabel) {
    if (a <= 0) return;
    const { fs } = L, ym = (r.y0 + r.y1) / 2;
    s.g.globalCompositeOperation = 'source-over';
    s.g.fillStyle = `rgba(14,20,44,${0.55 * a})`;
    s.g.beginPath(); s.g.roundRect(r.x0 - fs * 0.6, r.y0 - fs * 1.7, r.x1 - r.x0 + fs * 1.2, r.y1 - r.y0 + fs * 2.1, 8); s.g.fill();
    D.arrow(s, r.x0, r.y1, r.x0, r.y0 - fs * 0.5, C.muted, 0.75 * a, '', { width: 1.4, head: 7, blur: 0 });
    D.arrow(s, r.x0, ym, r.x1 + fs * 0.3, ym, C.muted, 0.75 * a, '', { width: 1.4, head: 7, blur: 0 });
    D.text(s, yLabel, r.x0 + fs * 0.6, r.y0 - fs * 0.75, fs, 0.85 * a, D.sans(fs), C.muted, 'left');
    D.text(s, xLabel, r.x1, r.y1 - fs * 0.3, fs, 0.75 * a, D.sans(fs), C.muted, 'right');
  }

  function drawDistGraph(s, t, tau, a) {
    const aArr = fade(t, 62.4, 89.0, 0.8, 0.8);
    if (a <= 0 && aArr <= 0) return;
    const { X, fs, XM, iG } = L;
    const u = smooth((t - 88.2) / 1.2), r = lerpRect(L.full, L.slotA, u), gs = gScale(r), ym = (r.y0 + r.y1) / 2;
    const GX = (x) => r.x0 + (x / XM) * (r.x1 - r.x0), GY = (sv) => ym - sv * gs;
    axes(s, r, a, L.small ? 'distance' : 'distance along the wave', L.small ? 'displacement' : 'displacement (to the right is +)');
    // amplitude lines
    const aAmp = a * smooth((t - 83.0) / 0.8);
    if (aAmp > 0) {
      D.line(s, r.x0, GY(AL), r.x1, GY(AL), MARK, 0.35 * aAmp, 1, [4, 5]);
      D.line(s, r.x0, GY(-AL), r.x1, GY(-AL), MARK, 0.35 * aAmp, 1, [4, 5]);
    }
    // the arrows: from each particle's equilibrium position (in the row) turning through 90° into the graph
    const rowY = L.yA + L.band + fs * 1.0;
    const step = L.small ? 2 : 2;
    if (aArr > 0) {
      for (let i = 0; i < L.nL; i += step) {
        const xe = i * DXL, sv = sL(xe, tau);
        // in the row (horizontal), drawn faint once a copy has moved down
        const p = clamp((t - 68.0 - 1.6 * xe / XM) / 1.3, 0, 1), e = smooth(p);
        const inRow = aArr * (p > 0 ? 0.35 : 1);
        if (Math.abs(sv * L.sc) > 2) D.arrow(s, X(xe), rowY, X(xe + sv), rowY, DISP, inRow, '', { width: 1.6, head: 6, blur: 4 });
        D.line(s, X(xe), rowY - 3, X(xe), rowY + 3, C.muted, 0.6 * aArr, 1);
        if (p <= 0) continue;
        const bx = lerp(X(xe), GX(xe), e), by = lerp(rowY, ym, e), ang = -e * Math.PI / 2, len = sv * lerp(L.sc, gs, e);
        if (Math.abs(len) > 2) D.arrow(s, bx, by, bx + Math.cos(ang) * len, by + Math.sin(ang) * len, DISP, aArr * (1 - 0.5 * smooth((t - 72.0) / 1)), '', { width: 1.6, head: 6, blur: 4 });
      }
    }
    // the curve through the arrow tips, drawn left to right once they have arrived
    const draw = smooth((t - 71.0) / 1.0);
    if (draw > 0) {
      const pts = [], n = 240;
      for (let j = 0; j <= n * draw; j++) { const x = XM * j / n; pts.push([GX(x), GY(sL(x, tau))]); }
      D.glowLine(s, pts, DISP, a, L.small ? 1.6 : 2.2);
    }
    // the gold particle on the graph
    if (draw >= 1) { const xg = iG * DXL; D.glowDot(s, GX(xg), GY(sL(xg, tau)), fs * 1.4, GOLD, a); }
    // compressions (C3) and rarefactions (C4): linked to the row by dashed lines while the graph is under the row
    const link = (1 - u) * (1 - smooth((t - 83.0) / 0.6));
    const aC = a * smooth((t - 72.8) / 0.8), aR = a * smooth((t - 78.0) / 0.8);
    for (const [list, al, rgb, lab] of [[marks(tau, 0), aC, COMP, 'C'], [marks(tau, Math.PI), aR, RARE, 'R']]) {
      if (al <= 0) continue;
      for (const x of list) {
        const e2 = al * edge(x);
        if (link > 0) D.line(s, X(x), L.yA + L.band + 4, GX(x), ym, rgb, 0.5 * e2 * link, 1.2, [4, 4]);
        D.glowDot(s, GX(x), ym, fs * 1.2, rgb, e2);
        D.text(s, lab, GX(x) + fs * 0.7, lab === 'C' ? ym - fs * 1.0 : ym + fs * 1.0, fs, e2, D.sans(fs, 700), rgb, 'left');
      }
    }
    // λ (crest to crest) and the amplitude (C5)
    const aL = a * smooth((t - 83.0) / 0.8) * (1 - u);              // only for the snapshot
    if (aL > 0) {
      const base = V * tau - LAM / 4, n = Math.floor((base - 0.05) / LAM), xc = base - n * LAM;   // a crest near the left
      const x2 = xc + LAM <= XM ? xc + LAM : xc - LAM;
      const xa = Math.min(xc, x2), xb = Math.max(xc, x2);
      if (xa >= -0.01) {
        D.line(s, GX(xa), GY(AL), GX(xa), r.y0 - fs * 0.2, MARK, 0.5 * aL, 1, [3, 3]);
        D.line(s, GX(xb), GY(AL), GX(xb), r.y0 - fs * 0.2, MARK, 0.5 * aL, 1, [3, 3]);
        bracket(s, GX(xa), GX(xb), r.y0 + fs * 0.1, MARK, aL, [['λ', 'i'], [' = 1.6 m', 'sans']]);
        const xm = GX(xb) + fs * 0.9;
        if (xm < r.x1 - fs * 1.5) {
          dbl(s, xm, ym, xm, GY(AL), MARK, aL * (1 - u), 1.6);
          const xt = xb + LAM / 2 <= XM - 0.1 ? xb + LAM / 2 : xa - LAM / 2;
          s.g.font = D.sans(fs, 600);
          const hw = s.g.measureText('amplitude 0.14\u00a0m').width / 2 + fs * 0.4;
          D.text(s, 'amplitude 0.14\u00a0m', clamp(GX(xt), r.x0 + hw, r.x1 - hw), GY(AL) - fs * 0.75, fs, aL, D.sans(fs, 600), MARK);
        }
      }
    }
  }

  function drawTimeGraph(s, t, tau, a) {
    if (a <= 0) return;
    const { fs, iG } = L, r = L.slotB, gs = gScale(L.slotA), ym = (r.y0 + r.y1) / 2, xg = iG * DXL;
    const GX = (tg) => r.x0 + (tg / TG) * (r.x1 - r.x0), GY = (sv) => ym - sv * gs;
    axes(s, r, a, 'time', L.small ? 'displacement of the gold particle' : 'displacement of the gold particle');
    D.line(s, r.x0, GY(AL), r.x1, GY(AL), MARK, 0.25 * a, 1, [4, 5]);
    D.line(s, r.x0, GY(-AL), r.x1, GY(-AL), MARK, 0.25 * a, 1, [4, 5]);
    const tNow = clamp(tau - tauD0, 0, TG), pts = [], n = Math.ceil(tNow / 0.02);
    for (let j = 0; j <= n; j++) { const tg = Math.min(tNow, j * 0.02); pts.push([GX(tg), GY(sL(xg, tauD0 + tg))]); }
    if (pts.length > 1) D.glowLine(s, pts, GOLD, a, L.small ? 1.6 : 2.2);
    if (tNow < TG) D.glowDot(s, GX(tNow), GY(sL(xg, tauD0 + tNow)), fs * 1.4, GOLD, a);
    // the period, crest to crest
    const c1 = crest0, c2 = crest0 + TP, aT = a * smooth((tNow - c2 - 0.2) / 0.6);
    if (aT > 0 && c2 < TG) {
      const yb = r.y1 - fs * 0.15;
      D.line(s, GX(c1), GY(AL), GX(c1), yb, MARK, 0.5 * aT, 1, [3, 3]);
      D.line(s, GX(c2), GY(AL), GX(c2), yb, MARK, 0.5 * aT, 1, [3, 3]);
      bracket(s, GX(c1), GX(c2), yb, MARK, aT, [['T', 'i'], [' = 2.0 s', 'sans']], true);
    }
  }

  // ---------- v = fλ: one period timed on both waves ----------
  function drawPeriod(s, t, tau, yRow) {
    const a = fade(t, tE1 - 1.2, 110.4, 0.6, 0.8); if (a <= 0) return;
    const { X, fs, sc, yA, band } = L;
    const el = clamp(tau - tauE1, 0, TP), xm = XS + V * (tau - tauE1);
    const yTop = yA - AT * sc - fs * 0.6, yBr = (yA + AT * sc + yRow - band) / 2 + fs * 0.3;
    // the start line (and the end line once it is reached)
    D.line(s, X(XS), yTop - fs * 0.6, X(XS), yRow + band + 4, MARK, 0.55 * a, 1.2, [4, 4]);
    if (el >= TP) D.line(s, X(XS + LAM), yTop - fs * 0.6, X(XS + LAM), yRow + band + 4, MARK, 0.55 * a, 1.2, [4, 4]);
    // the markers: a crest on the rope, a compression in the row (they ride along with the wave)
    const am = a * (1 - smooth((tau - tauE1 - TP) / 0.3));       // the markers stop at the end line
    if (xm < L.XM - 0.05 && am > 0) {
      tri(s, X(xm), yA - AT * sc - fs * 0.35, fs * 0.9, MARK, am);
      D.glowDot(s, X(xm), yA - yRopeE(xm, tau) * sc, fs * 1.4, MARK, am);
      D.text(s, 'C', X(xm), yRow - band - fs * 1.1, fs + 2, am, D.sans(fs + 2, 700), COMP);
    }
    // the distance gone so far, growing to one wavelength
    if (tau > tauE1) {
      const x2 = XS + V * el;
      bracket(s, X(XS), X(x2), yBr, MARK, a, el >= TP ? [['λ', 'i'], [' = 1.6 m', 'sans']] : null);
    }
    // the stopwatch
    const txt = el >= TP ? [['one period: ', 'sans'], ['T', 'i'], [' = 2.0 s', 'sans']] : [['time: ', 'sans'], [`${el.toFixed(2)} s`, 'sans']];
    rich(s, txt, X(L.XM), yTop - fs * 1.6, fs + 3, a, el >= TP ? MARK : C.text, 'right');
  }

  // ---------- end card ----------
  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, tall } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 30, 18, 38)), s2 = Math.round(clamp(W / 46, 14, 24)), s3 = Math.round(clamp(W / 58, 12, 18));
    let y = H * (tall ? 0.12 : 0.17);
    g.font = D.sans(s1, 300);
    const l1 = D.wrap(s, 'Waves transfer energy, not matter', W - 48);
    D.text(s, l1, W / 2, y, s1, a, D.sans(s1, 300)); y += s1 * 1.3 * l1.length + s2 * 0.6;
    const items = [
      ['Transverse', DISP, 'The oscillations (of particles, or of the electric and magnetic fields in EM waves) are perpendicular to the direction of travel. Strings; all EM waves.'],
      ['Longitudinal', COMP, 'The particles oscillate parallel to the direction of travel. Compressions and rarefactions. Sound.'],
    ];
    const colW = tall ? W - 48 : Math.min(W * 0.4, 440);
    items.forEach(([h, rgb, txt], i) => {
      const x = tall ? W / 2 : W / 2 + (i - 0.5) * W * 0.44;
      const yy = tall ? y : y;
      D.text(s, h, x, yy, s2, a, D.sans(s2, 600), rgb);
      g.font = D.sans(s3); const ls = D.wrap(s, txt, colW);
      D.text(s, ls, x, yy + s2 * 1.2, s3, 0.85 * a, D.sans(s3));
      if (tall) y += s2 * 1.2 + s3 * 1.3 * ls.length + s2 * 0.7;
      else if (i === 1) y += s2 * 1.2 + s3 * 1.3 * 3 + s2 * 0.4;
    });
    const s4 = Math.round(clamp(W / 26, 20, 44));
    rich(s, [['v', 'i'], [' = ', 'r'], ['f', 'i'], ['\u2009', 'r'], ['λ', 'i'], [' = ', 'r'], ['λ', 'i'], [' / ', 'r'], ['T', 'i']], W / 2, y + s4 * 0.5, s4, a, C.light);
    y += s4 * 1.5;
    g.font = D.sans(s3);
    D.text(s, D.wrap(s, 'Read the axis: a displacement–distance graph shows the wavelength; a displacement–time graph shows the period.', Math.min(W - 40, 720)), W / 2, y + s3 * 0.4, s3, 0.7 * a, D.sans(s3), C.muted);
  }

  Anim.register('waves', {
    duration: DURATION,
    poster: 76,
    // hold the picture still where a caption needs reading (or a prediction needs thinking about)
    pauses: [[9.0, 1.0], [14.0, 1.2], [19.0, 2.5], [24.2, 1.2], [29.4, 1.0], [34.6, 1.4], [41.0, 0.8], [46.2, 1.2], [51.2, 2.5], [56.4, 1.2],
      [61.6, 1.4], [66.8, 1.6], [72.0, 1.5], [77.2, 1.5], [82.2, 1.5], [87.4, 1.8], [98.6, 1.5], [104.2, 1.6], [109.8, 2.0], [115.4, 1.5]],
    // score: rolling sea (A-flat major, a soft sawtooth pad, a gentle up-and-down plucked pattern, a little wind)
    music: { chords: [[56, 60, 63, 67], [49, 56, 60, 65], [53, 60, 63, 68], [51, 58, 63, 67]], bar: 8, pad: 'saw', cutoff: 700, drone: 0.09, bells: 0.12, arp: 0.333, arpMode: 'updown', echo: 0.333, wind: 0.3, volume: 0.73 },
    resize: layout,
    // for checking the numbers (not used by the player)
    info: { LAM, TP, F, V, K, OM, AT, AL, XG, yRope, sL, densL, tauL, tauT, tauD0, tE1, tauE1, crest0, CAPS },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      const tT = tauT(t), tL = tauL(t);
      D.background(s, 0.22);
      // A: the rope
      const aA = fade(t, 4.6, 36.2, 0.9, 0.9);
      if (aA > 0) { drawRope(s, t, tT, L.yC, aA, false); ropeExtras(s, t, tT, L.yC); }
      // E: the rope again (a steady wave), above the row
      const aE = fade(t, 99.8, END_CARD + 0.8, 1.2, 0.8);
      if (aE > 0) drawRope(s, t, tL, L.yA, aE, true);
      // B–E: the row of particles (moved down to make room for the rope at the end)
      const aR = smooth((t - 35.8) / 0.9) * (1 - smooth((t - END_CARD) / 0.8));
      const yRow = t < 80 ? lerp(L.yC, L.yA, smooth((t - 61.4) / 1.0)) : lerp(L.yA, L.yMid, smooth((t - 99.4) / 1.2));
      if (aR > 0) { drawRow(s, t, tL, yRow, aR); rowLabels(s, t, tL, yRow, aR * (1 - smooth((t - 99.0) / 0.6))); }
      // C–D: the graphs
      drawDistGraph(s, t, tL, fade(t, 67.4, 99.6, 0.6, 0.7));
      drawTimeGraph(s, t, tL, fade(t, 88.4, 99.6, 0.7, 0.7));
      drawPeriod(s, t, tL, yRow);
      // legend (wide screens only)
      const leg = t < 36 ? [['dot', GOLD, 'the bead to follow']] : [['dot', GOLD, 'the particle to follow']];
      if (t > 62.4 && t < 89.8) leg.push(['arrow', DISP, 'displacement']);
      D.legend(s, leg, t < 36 ? fade(t, 15.0, 35.4, 0.6, 0.6) : fade(t, 47.0, END_CARD, 0.6, 0.6));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Transverse and longitudinal waves', 'What travels along, and what stays put?');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
