/* E.3 Random decay and half-life. 1000 nuclei of a made-up nuclide X (half-life T½ = 10 s), each given a random
   decay moment once, with a fixed seed: τ = −ln(1 − u) / λ with λ = ln 2 / T½ = 0.0693 s⁻¹ (exponential waiting
   times, which is what "random, with the same chance per second" means). So the run is random but the same every
   time, and every frame is worked out from the scene time alone. The clock runs at real speed between the holds.
   Also: a separate sample of 20 nuclei (its own seed); a detector that catches about a quarter of the radiation
   (each decay's direction is random), plus background counts at about 0.5 per second (random arrival times).
   Numbers (recalculated; the run's own counts are worked out when the file loads and shown in the captions):
   - λ = ln 2 ÷ 10 = 0.0693 s⁻¹; at the start A = λN = 0.0693 × 1000 = 69.3 ≈ 69 Bq.
   - Expected N after 10, 20, 30 s: 500, 250, 125. After 25 s: N = 1000 e^(−0.0693 × 25) = 1000 e^(−1.733) = 177.
   - Expected decays in the first 5 s: 1000 × (1 − e^(−0.3466)) = 293, about 59 per second; expected 5-second averages
     58.6, 41.4, 29.3, 20.7, 14.6, 10.4 per second.
   - This seed gives N10 = 493, N20 = 246, N30 = 117, N25 = 162, 285 decays in the first 5 s (57 per second), bins
     57, 44.4, 32.6, 16.8, 16.8, 9.0 …; the sample of 20 (seed 102): 15 left at 10 s, 8 at 20 s; the highlighted nucleus
     decays at 6.17 s; background 13 counts in the 31 s before the clock starts (0.42 per second). */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- the run ----------
  const N0 = 1000, TH = 10, LAM = Math.LN2 / TH, NS = 20, DET = 0.25, BG_RATE = 0.5;
  const mulberry = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const r1 = mulberry(20261116), r2 = mulberry(102), r3 = mulberry(777);
  const tau = new Float64Array(N0), det = new Uint8Array(N0), ang = new Float64Array(N0);
  for (let i = 0; i < N0; i++) { tau[i] = -Math.log(1 - r1()) / LAM; det[i] = r1() < DET ? 1 : 0; ang[i] = r1() * Math.PI * 2; }
  const sorted = Array.from(tau).sort((a, b) => a - b);
  const tauS = Array.from({ length: NS }, () => -Math.log(1 - r2()) / LAM);
  const sortedS = tauS.slice().sort((a, b) => a - b);
  const countBelow = (arr, x) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] <= x) lo = m + 1; else hi = m; } return lo; };
  const Nat = (r) => N0 - countBelow(sorted, r), Sat = (r) => NS - countBelow(sortedS, r);

  // ---------- timeline (scene seconds) ----------
  // No pauses (teacher, 17 November 2026): the picture never freezes and the run's clock r runs at real speed from T0
  // to the end, with no waits. The readings at exactly 10, 20 and 30 s stay pinned on the graph as markers, so each
  // "After … s" caption refers to a marker that is still visible while the decays carry on.
  const T0 = 46.6, RMAX = 100;                                       // the clock starts after the last caption before it
  const rOf = (t) => clamp(t - T0, 0, RMAX);
  const tOfR = (r) => T0 + r;

  // the highlighted nucleus: one near the middle of the grid that decays a few seconds after the clock starts
  const GC = 40, GR = 25;
  let HI = -1, best = 1e9;
  for (let i = 0; i < N0; i++) {
    const c = i % GC, r = Math.floor(i / GC), d = Math.hypot(c - GC * 0.42, r - GR * 0.45);
    if (tau[i] > 4.5 && tau[i] < 8.5 && d < best) { best = d; HI = i; }
  }
  const tauHi = tau[HI];

  const RUN = { N10: Nat(10), N20: Nat(20), N30: Nat(30), N25: Nat(25), D5: N0 - Nat(5), S10: Sat(10), S20: Sat(20), tauHi,
    BG: 0, BINS: Array.from({ length: RMAX / 5 }, (_, k) => (Nat(5 * k) - Nat(5 * k + 5)) / 5) };
  const fmt = (v, dp) => v.toFixed(dp);

  // ---------- captions ----------
  // Laid out one after another from their lengths (at most CPS characters per second on screen, a Predict caption
  // 6 s more), each starting no earlier than the moment it describes. Nothing ever waits: the run carries on.
  const CPS = 15;
  const SPEC = [
    // [text, earliest start (scene s), id]
    ['1000 unstable nuclei of a made-up nuclide, X. Each will decay, giving out radiation, and become a daughter nucleus.', 4.8],
    ['Before the clock starts, the detector already counts now and then: background radiation from rocks, radon gas and cosmic rays.', 0, 'bg'],
    ['Predict: when will this nucleus decay?', 0, 'predict'],
    ['No one can say. Decay is random: every nucleus of X has the same chance of decaying in each second.', 0],
    ['It is also spontaneous: heating, squeezing or chemical reactions make no difference.', 0],
    ['The clock starts. Each nucleus decays at a random moment: it flashes and becomes a daughter nucleus.', T0 + 0.2],
    ['The graph shows the number of undecayed nuclei, N. Each decay is a tiny step down.', 0, 'graph'],
    [`After 10 s, ${RUN.N10} were left (the marker at 10 s): about half. The half-life of X is T½ = 10 s.`, T0 + 10.2],
    ['The activity (decays per second) falls too: fewer nuclei are left to decay.', 0, 'act'],
    [`After 20 s, ${RUN.N20} were left: about a quarter. Each half-life halves what is left, not the starting number.`, T0 + 20.2],
    [`After 30 s, ${RUN.N30} were left: about an eighth of 1000 (125).`, T0 + 30.2],
    ['Radiation goes off in all directions and only some reaches the detector, so the count rate is less than the activity.', 0, 'rate'],
    ['The smooth curve (the expected number) halves every 10 s. With 1000 nuclei, the random run follows it closely.', 0, 'curve'],
    [`The sample of 20 decays just as randomly. After 10 s, ${RUN.S10} were left, not 10: a small sample is much less predictable.`, 0, 'sample'],
    ['To measure the source alone, subtract the background count rate from every reading.', 0, 'bgsub'],
    ['(HL) The decay constant: λ = ln 2 ÷ T½ = 0.693 ÷ 10 = 0.0693 s⁻¹.', 0, 'hl'],
    [`(HL) Activity A = λN = 0.0693 × 1000 = 69 Bq at the start. As it falls, about 59 per second is expected over the first 5 s; this run had ${Math.round(RUN.D5 / 5)}.`, 0],
    [`(HL) The decay law (in the panel) at 25 s: λt = 0.0693 × 25 = 1.73, so N = 1000 × 0.177 = 177 expected. This run had ${RUN.N25}.`, 0, 'law'],
  ];
  const CAPS = [], AT = {};
  {
    let end = 4.4;
    for (const [txt, earliest, id] of SPEC) {
      const st = Math.max(end + 0.3, earliest);
      const dur = Math.max(3.6, txt.length / CPS + 0.6) + (txt.startsWith('Predict') ? 6 : 0);
      CAPS.push([+st.toFixed(2), +(st + dur).toFixed(2), txt]);
      if (id) AT[id] = [st, st + dur];
      end = st + dur;
    }
  }
  const END_CARD = CAPS[CAPS.length - 1][1] + 0.6, DURATION = END_CARD + 13.2;
  const T_SAMPLE = AT.sample[0], T_BGSUB = AT.bgsub[0], HL_FROM = AT.hl[0] - 0.2;
  // background counts: random arrival times, at about 0.5 per second, from the start to the end
  const bg = []; for (let t = r3() * 2; t < DURATION; t += -Math.log(1 - r3()) / BG_RATE) bg.push([t, r3() * Math.PI * 2]);
  const BG_N = bg.filter(([tb]) => tb < T0).length, BG_MEASURED = BG_N / T0;   // counted before the clock started
  RUN.BG = BG_MEASURED; RUN.BG_N = BG_N;

  // ---------- colours ----------
  const PAR = '255,150,110', DAU = '86,104,150', SMALL = C.light, ACT = C.field, CNT = C.good, BGC = '200,205,230';

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const fs = phone ? 10 : Math.round(clamp(W / 80, 11, 16)), capFs = Math.round(clamp(W / 44, 15, 25));
    const bottom = H - capFs * (phone ? 6.4 : 5.2);
    const o = { W, H, phone, fs, capFs, bottom };
    if (!phone) {
      const x0 = W * 0.04, top = Math.max(44, H * 0.11), x1 = W * 0.44;
      const rowH = Math.max(18, fs * 2.4);
      const cell = Math.min((x1 - x0) / GC, (bottom - top - rowH - fs * 2.2) / GR);
      o.cols = GC; o.rows = GR; o.cell = cell; o.gx = x0; o.gy = top;
      o.sy = top + cell * GR + fs * 1.9; o.scell = Math.min(cell * 1.9, (x1 - x0) / (NS + 2)); o.sx = x0;
      o.dx = x0 + cell * GC + W * 0.035; o.dy = top + cell * GR * 0.5;
      const px0 = W * 0.53, px1 = W * 0.95, py0 = Math.max(60, H * 0.13);
      const mid = py0 + (bottom - py0) * 0.6;
      o.gN = { x0: px0 + fs * 3.2, x1: px1 - fs * 2.4, y0: py0 + fs * 1.6, y1: mid - fs * 1.8 };
      o.gA = { x0: px0 + fs * 3.2, x1: px1 - fs * 2.4, y0: mid + fs * 1.4, y1: bottom - fs * 1.8 };
    } else {
      const cols = 50, rows = 20, x0 = 8, top = fs * 2.4;
      const cell = (W - 16 - 30) / cols;
      o.cols = cols; o.rows = rows; o.cell = cell; o.gx = x0; o.gy = top;
      o.sy = top + cell * rows + fs * 1.8; o.scell = Math.min(11, (W - 16 - 40) / NS); o.sx = x0;
      o.dx = x0 + cell * cols + 15; o.dy = top + cell * rows * 0.5;
      // the two graphs share what is left: 60% for N, 40% for the activity, after room for their labels
      const g0 = o.sy + o.scell + fs * 2.6, gap = fs * 3.0, avail = bottom - g0 - fs * 1.3 - gap;
      const hN = avail * 0.6;
      o.gN = { x0: x0 + fs * 3.0, x1: W - 10 - fs * 2.4, y0: g0, y1: g0 + hN };
      o.gA = { x0: x0 + fs * 3.0, x1: W - 10 - fs * 2.4, y0: g0 + hN + gap, y1: bottom - fs * 1.3 };
    }
    L = o;
  }
  const cellXY = (i) => { const c = i % L.cols, r = Math.floor(i / L.cols); return [L.gx + (c + 0.5) * L.cell, L.gy + (r + 0.5) * L.cell]; };

  // ---------- drawing ----------
  function drawGrid(s, t) {
    const { g } = s, r = rOf(t), a = smooth((t - 4.4) / 0.8);
    if (a <= 0) return;
    const rad = Math.max(1.2, L.cell * 0.36);
    g.globalCompositeOperation = 'source-over';
    // daughters first (dim), then parents (bright)
    g.fillStyle = `rgba(${DAU},${0.9 * a})`; g.beginPath();
    for (let i = 0; i < N0; i++) if (tau[i] <= r) { const [x, y] = cellXY(i); g.moveTo(x + rad * 0.8, y); g.arc(x, y, rad * 0.8, 0, 7); }
    g.fill();
    g.fillStyle = `rgba(${PAR},${0.95 * a})`; g.beginPath();
    for (let i = 0; i < N0; i++) if (tau[i] > r) { const [x, y] = cellXY(i); g.moveTo(x + rad, y); g.arc(x, y, rad, 0, 7); }
    g.fill();
    // flashes and the radiation from recent decays (shown for 0.6 s of clock time)
    if (t > T0 && t < END_CARD) for (let i = 0; i < N0; i++) {
      const age = r - tau[i]; if (age < 0 || age > 0.6) continue;
      const [x, y] = cellXY(i), k = age / 0.6;
      D.glowDot(s, x, y, L.cell * 2.2 * (1 - k * 0.5), '255,230,170', (1 - k) * 0.9);
      if (det[i]) {                                                       // a detected one flies to the detector
        const u = smooth(age / 0.35), px = lerp(x, L.dx - 6, u), py = lerp(y, L.dy, u);
        if (age < 0.35) D.glowDot(s, px, py, Math.max(3, L.cell * 0.7), CNT, 0.9);
      } else {
        const len = L.cell * 3.5 * k, px = x + Math.cos(ang[i]) * len, py = y + Math.sin(ang[i]) * len;
        D.line(s, x + Math.cos(ang[i]) * len * 0.4, y + Math.sin(ang[i]) * len * 0.4, px, py, '255,230,170', 0.5 * (1 - k), 1);
      }
    }
    // the highlighted nucleus
    const ha = fade(t, AT.predict[0], T0 + 24, 0.6, 1.0);
    if (ha > 0) {
      const [x, y] = cellXY(HI), decayed = r >= tauHi;
      g.strokeStyle = `rgba(${C.light},${ha})`; g.lineWidth = 2; g.beginPath(); g.arc(x, y, Math.max(6, L.cell * 1.2), 0, 7); g.stroke();
      const txt = decayed ? `decayed after ${fmt(tauHi, 1)} s` : (t < T0 ? 'this one?' : 'this one: still waiting');
      const fsz = L.fs; g.font = D.sans(fsz, 600);
      const tw = g.measureText(txt).width, lx = clamp(x + L.cell * 1.6, 4, L.gx + L.cell * L.cols - tw - 4);
      g.fillStyle = `rgba(4,6,13,${0.75 * ha})`; g.fillRect(lx - 4, y - L.cell * 1.6 - fsz * 0.75, tw + 8, fsz * 1.5);
      D.text(s, txt, lx, y - L.cell * 1.6, fsz, ha, D.sans(fsz, 600), C.light, 'left');
    }
    // key above the grid
    const ky = L.gy - L.fs * 1.1;
    g.fillStyle = `rgba(${PAR},${a})`; g.beginPath(); g.arc(L.gx + 5, ky, 4, 0, 7); g.fill();
    D.text(s, 'undecayed nucleus of X', L.gx + 13, ky, L.fs, 0.85 * a, D.sans(L.fs), C.muted, 'left');
    g.font = D.sans(L.fs); const kx = L.gx + 13 + g.measureText('undecayed nucleus of X').width + L.fs * 1.4;
    g.fillStyle = `rgba(${DAU},${a})`; g.beginPath(); g.arc(kx, ky, 3.4, 0, 7); g.fill();
    D.text(s, 'daughter', kx + 8, ky, L.fs, 0.85 * a, D.sans(L.fs), C.muted, 'left');
  }

  function drawSmall(s, t) {
    const a = smooth((t - 4.8) / 0.8); if (a <= 0) return;
    const { g } = s, r = rOf(t), emph = 0.55 + 0.45 * fade(t, T_SAMPLE - 0.4, AT.sample[1], 0.5, 0.6);
    const y = L.sy + L.scell / 2, rad = L.scell * 0.34;
    for (let i = 0; i < NS; i++) {
      const x = L.sx + (i + 0.5) * L.scell, done = tauS[i] <= r;
      g.fillStyle = `rgba(${done ? DAU : PAR},${a * (done ? 0.9 : emph)})`; g.beginPath(); g.arc(x, y, done ? rad * 0.8 : rad, 0, 7); g.fill();
      const age = r - tauS[i]; if (age >= 0 && age < 0.6 && t > T0) D.glowDot(s, x, y, L.scell * 1.3, '255,230,170', (1 - age / 0.6) * 0.8);
    }
    const n = Sat(r);
    D.text(s, `a sample of 20: N = ${n}`, L.sx, L.sy - L.fs * 0.75, L.fs, 0.85 * a * emph, D.sans(L.fs, 600), SMALL, 'left');
  }

  function drawDetector(s, t) {
    const a = smooth((t - 4.8) / 0.8); if (a <= 0) return;
    const { g } = s, x = L.dx, y = L.dy, w = L.phone ? 14 : Math.max(16, L.cell * 2.2), h = L.phone ? 30 : Math.max(40, L.cell * 5.5);
    g.fillStyle = `rgba(40,52,80,${0.95 * a})`; g.beginPath(); g.roundRect(x - 4, y - h / 2, w, h, 4); g.fill();
    g.strokeStyle = `rgba(${CNT},${0.6 * a})`; g.lineWidth = 1.2; g.stroke();
    // a click: a flash on each count (detected decays arrive 0.35 s after decaying; background from outside)
    let flash = 0; const r = rOf(t);
    if (t > T0 && t < END_CARD) for (let i = 0; i < N0; i++) if (det[i]) { const dt = r - tau[i] - 0.35; if (dt >= 0 && dt < 0.25) flash = Math.max(flash, 1 - dt / 0.25); }
    for (const [tb, an] of bg) {
      const dt = t - tb; if (dt < -0.35 || dt > 0.25) continue;
      if (dt < 0) { const u = (dt + 0.35) / 0.35, rr = (1 - u) * (L.phone ? 40 : 70); D.glowDot(s, x + w / 2 + Math.cos(an) * rr, y + Math.sin(an) * rr, 3, BGC, 0.8 * a); }
      else flash = Math.max(flash, 1 - dt / 0.25);
    }
    if (flash > 0) D.glowDot(s, x + w / 2 - 4, y, w * 1.6, CNT, flash * a);
    D.text(s, 'detector', x + w / 2 - 4, y + h / 2 + L.fs * 0.9, L.fs - 1, 0.8 * a, D.sans(L.fs - 1), CNT);
  }
  // counts in the last 4 s of scene time (source counts arrive 0.35 s after the decay)
  function countRate(t) {
    let n = 0; const lo = t - 4;
    if (t > T0) for (let i = 0; i < N0; i++) if (det[i] && tau[i] <= RMAX) { const tc = tOfR(tau[i] + 0.35); if (tc <= t && tc > lo) n++; }
    for (const [tb] of bg) if (tb <= t && tb > lo) n++;
    return n / 4;
  }

  function axes(s, p, a, ylab, xlab, yt, ymax) {
    const fs = L.fs;
    D.line(s, p.x0, p.y1, p.x1, p.y1, C.muted, 0.6 * a, 1.2); D.line(s, p.x0, p.y1, p.x0, p.y0 - fs * 0.3, C.muted, 0.6 * a, 1.2);
    for (const [v, lab] of yt) { const y = p.y1 - (v / ymax) * (p.y1 - p.y0); D.line(s, p.x0, y, p.x1, y, C.muted, 0.12 * a, 1, [3, 4]); D.text(s, lab, p.x0 - 4, y, fs - 1, 0.75 * a, D.sans(fs - 1), C.muted, 'right'); }
    for (let x = 0; x <= RMAX; x += (L.phone ? 30 : 10)) { const X = p.x0 + (x / RMAX) * (p.x1 - p.x0); D.line(s, X, p.y1, X, p.y1 + 4, C.muted, 0.6 * a, 1); D.text(s, String(x), X, p.y1 + fs * 0.9, fs - 1, 0.75 * a, D.sans(fs - 1), C.muted); }
    D.text(s, ylab, p.x0, p.y0 - fs * 0.95, fs, 0.85 * a, D.sans(fs, 600), C.muted, 'left');
    if (xlab) D.text(s, xlab, p.x1 + 5, p.y1, fs - 1, 0.75 * a, D.sans(fs - 1), C.muted, 'left');   // beyond the end of the axis, off the curve
  }
  function drawGraphs(s, t) {
    const a = smooth((t - (AT.graph[0] - 0.4)) / 0.8) * (1 - smooth((t - END_CARD) / 0.8)); if (a <= 0) return;
    const { g } = s, r = rOf(t), p = L.gN, fs = L.fs;
    g.fillStyle = `rgba(14,20,44,${0.6 * a})`; g.beginPath(); g.roundRect(p.x0 - fs * 3.2, p.y0 - fs * 1.7, p.x1 - p.x0 + fs * 3.6, L.gA.y1 - p.y0 + fs * 3.4, 10); g.fill();
    const X = (x) => p.x0 + (x / RMAX) * (p.x1 - p.x0), Y = (n) => p.y1 - (n / N0) * (p.y1 - p.y0);
    axes(s, p, a, 'N, undecayed nuclei', 't / s', L.phone ? [[1000, '1000'], [500, '500'], [250, '250']] : [[1000, '1000'], [500, '500'], [250, '250'], [125, '125']], N0);
    // the smooth curve N0 (1/2)^(t / T½)
    const ca = smooth((t - (AT.curve[0] - 0.4)) / 1.0) * a;
    if (ca > 0) { const pts = []; for (let k = 0; k <= 120; k++) { const x = RMAX * k / 120; pts.push([X(x), Y(N0 * Math.pow(0.5, x / TH))]); } D.glowLine(s, pts, C.white, 0.55 * ca, 1.2); }
    // the run so far: one step per decay
    const pts = [[X(0), Y(N0)]]; let n = N0;
    for (let k = 0; k < sorted.length && sorted[k] <= r; k++) { pts.push([X(sorted[k]), Y(n)]); n--; pts.push([X(sorted[k]), Y(n)]); }
    pts.push([X(r), Y(n)]);
    D.glowLine(s, pts, PAR, a, L.phone ? 1.4 : 1.8);
    // the sample of 20, as N × 50 (same fraction scale): appears with its caption, then stays, dimmer, and labelled
    const emS = fade(t, T_SAMPLE, AT.sample[1] + 2.0, 0.5, 0.6), sa = a * smooth((t - T_SAMPLE) / 0.6) * (0.45 + 0.55 * emS);
    if (sa > 0) {
      const q = [[X(0), Y(N0)]]; let m = NS;
      for (let k = 0; k < sortedS.length && sortedS[k] <= r; k++) { q.push([X(sortedS[k]), Y(m * 50)]); m--; q.push([X(sortedS[k]), Y(m * 50)]); }
      q.push([X(r), Y(m * 50)]);
      D.glowLine(s, q, SMALL, 0.8 * sa, 1.1);
      // its label sits above its own line near 14 s, where it is well above the main curve
      D.text(s, '20 nuclei (× 50)', X(14) + 4, Y(Sat(14) * 50) - fs * 0.9, fs - 1, sa, D.sans(fs - 1), SMALL, 'left');
      // during its caption: what it had after 10 s and 20 s
      const ka = emS * a;
      if (ka > 0) for (const [x, v] of [[10, RUN.S10], [20, RUN.S20]]) {
        g.fillStyle = `rgba(${SMALL},${ka})`; g.beginPath(); g.arc(X(x), Y(v * 50), 3.5, 0, 7); g.fill();
        D.text(s, String(v), X(x) - 5, Y(v * 50) - fs * 0.7, fs - 1, ka, D.sans(fs - 1, 700), SMALL, 'right');
      }
    }
    // half-life markers with the run's counts
    [[10, RUN.N10, 500], [20, RUN.N20, 250], [30, RUN.N30, 125]].forEach(([x, nv], j) => {
      const ma = smooth((r - x) / 0.3) * a * (1 - 0.85 * fade(t, AT.law[0], AT.law[1], 0.5, 0.6));   // dimmed while the 25 s markers show if (ma <= 0) return;
      D.line(s, X(x), Y(nv), X(x), p.y1, C.light, 0.5 * ma, 1, [3, 3]);
      g.fillStyle = `rgba(${C.light},${ma})`; g.beginPath(); g.arc(X(x), Y(nv), 3.5, 0, 7); g.fill();
      D.text(s, String(nv), X(x) + 5, Y(nv) - fs * 0.8, fs - 1, ma, D.sans(fs - 1, 600), C.light, 'left');
    });
    // (HL) the point at 25 s
    const h3 = fade(t, AT.law[0], AT.law[1], 0.5, 0.6) * a;
    if (h3 > 0) {
      D.line(s, X(25), Y(177), X(25), p.y1, C.force, 0.7 * h3, 1, [2, 3]);
      D.glowDot(s, X(25), Y(177), 10, C.force, h3); D.glowDot(s, X(25), Y(RUN.N25), 8, PAR, h3);
      D.text(s, '177 expected', X(25) + 8, Y(177) - fs * 0.9, fs - 1, h3, D.sans(fs - 1, 700), C.force, 'left');
      D.text(s, `${RUN.N25} this run`, X(25) - 8, Y(RUN.N25) + fs * 0.9, fs - 1, h3, D.sans(fs - 1, 700), PAR, 'right');
    }
    // readouts
    const ry = p.y0 - fs * 0.95;
    D.text(s, `t = ${fmt(r, 1)} s   N = ${n}`, p.x1 + fs * 2.4, ry, fs, a, D.sans(fs, 600), PAR, 'right');

    // activity: decays per second, averaged over each 5-second interval, as each interval is completed
    const q = L.gA, ya = (v) => q.y1 - (v / 80) * (q.y1 - q.y0), aa = smooth((t - (AT.act[0] - 0.2)) / 0.8) * a;
    if (aa > 0) {
      axes(s, q, aa, 'activity / Bq', 't / s', L.phone ? [[80, '80'], [40, '40']] : [[80, '80'], [40, '40'], [20, '20']], 80);
      const bw = (q.x1 - q.x0) * 5 / RMAX;
      for (let k = 0; 5 * k + 5 <= r + 1e-9 && k < RUN.BINS.length; k++) {
        const v = RUN.BINS[k], x = q.x0 + (5 * k / RMAX) * (q.x1 - q.x0);
        g.fillStyle = `rgba(${ACT},${0.8 * aa})`; g.fillRect(x + 0.5, ya(v), bw - 1, q.y1 - ya(v));
      }
      // the count rate the detector shows (counts in the last 4 s ÷ 4), shown while the clock runs
      const cr = countRate(t), cra = smooth((t - AT.rate[0]) / 0.8) * (1 - smooth((t - END_CARD) / 0.6)) * aa;
      D.text(s, `count rate ≈ ${cr.toFixed(1)} s⁻¹`, q.x1 + fs * 2.4, q.y0 - fs * 0.95, fs - 1, cra, D.sans(fs - 1, 600), CNT, 'right');
      // subtracting the background (measured before the clock started)
      const ba = smooth((t - T_BGSUB) / 0.6) * (1 - smooth((t - END_CARD) / 0.6)) * aa;
      if (ba > 0) {
        const corr = Math.max(0, cr - RUN.BG);
        D.text(s, `background ≈ ${RUN.BG.toFixed(1)} s⁻¹ → corrected ≈ ${corr.toFixed(1)} s⁻¹`, q.x1 + fs * 2.4, q.y0 + fs * 0.7, fs - 1, ba, D.sans(fs - 1, 600), CNT, 'right');
      }
    }
  }

  // Text with raised exponents: parts = [[text, raised]], a raised part drawn smaller and higher (e.g. e to the −λt).
  // Returns the width; draw = false only measures.
  function sup(s, parts, x, y, size, a, rgb, align = 'left', weight = 600, draw = true) {
    const { g } = s, small = Math.round(size * 0.72);
    const ws = parts.map(([tx, up]) => { g.font = D.sans(up ? small : size, weight); return g.measureText(tx).width; });
    const total = ws.reduce((p, q) => p + q, 0);
    if (!draw || a <= 0) return total;
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    parts.forEach(([tx, up], i) => { D.text(s, tx, px, up ? y - size * 0.38 : y, up ? small : size, a, D.sans(up ? small : size, weight), rgb, 'left'); px += ws[i]; });
    return total;
  }
  const LAW = [['N = N₀e', false], ['−λt', true]];

  // the HL equations panel
  function drawHL(s, t) {
    const a = fade(t, HL_FROM, END_CARD + 0.4, 0.8, 0.6); if (a <= 0) return;
    const { g } = s, fs = L.fs + 1;
    const lines = ['λ = ln 2 ÷ T½ = 0.0693 s⁻¹', 'A = λN', LAW];
    g.font = D.sans(fs, 600);
    const wOf = (l) => (typeof l === 'string' ? (g.font = D.sans(fs, 600), g.measureText(l).width) : sup(s, l, 0, 0, fs, 1, C.text, 'left', 600, false));
    const w = Math.max(...lines.map(wOf)) + fs * 2, h = fs * 1.6 * lines.length + fs * 2.4;
    const x = L.phone ? L.W - w - 8 : L.gx + 6, y = L.phone ? L.gy - fs * 0.5 : L.gy + 6;
    g.fillStyle = `rgba(14,20,44,${0.92 * a})`; g.beginPath(); g.roundRect(x, y, w, h, 8); g.fill();
    g.strokeStyle = `rgba(${C.force},${0.5 * a})`; g.lineWidth = 1; g.stroke();
    g.fillStyle = `rgba(${C.force},${a})`; g.beginPath(); g.roundRect(x + fs * 0.6, y + fs * 0.5, fs * 2.2, fs * 1.2, 4); g.fill();
    D.text(s, 'HL', x + fs * 1.7, y + fs * 1.1, fs - 2, a, D.sans(fs - 2, 700), '20,20,30');
    lines.forEach((l, k) => {
      const ly = y + fs * 2.9 + k * fs * 1.6;
      if (typeof l === 'string') D.text(s, l, x + fs, ly, fs, a, D.sans(fs, 600), C.text, 'left');
      else sup(s, l, x + fs, ly, fs, a, C.text, 'left', 600);
    });
  }

  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 30, 18, 36)), s3 = Math.round(clamp(W / 60, 11, 17));
    let y = H * (phone ? 0.12 : 0.17);
    g.font = D.sans(s1, 300); const t1 = D.wrap(s, 'One nucleus is unpredictable. A thousand are not.', W - 40);
    D.text(s, t1, W / 2, y, s1, a, D.sans(s1, 300)); y += s1 * 1.3 * t1.length + s3;
    const items = [
      ['Random and spontaneous', PAR, 'You can\'t predict when a nucleus will decay, and outside conditions make no difference.'],
      ['Half-life T½', C.light, 'The time for N, or the activity, to halve. After n half-lives, (½)ⁿ is left.'],
      ['Count rate', CNT, 'Less than the activity. Subtract the background count rate.'],
      ['HL', C.force, [...LAW, [',  A = λN,  T½ = ln 2 ÷ λ', false]]],
    ];
    const colW = phone ? W - 36 : Math.min(W * 0.4, 440);
    items.forEach(([h, rgb, txt], i) => {
      const x = phone ? W / 2 : W / 2 + (i % 2 ? 1 : -1) * W * 0.22, yy = phone ? y : y + Math.floor(i / 2) * s3 * 6.2;
      D.text(s, h, x, yy, s3 + 2, a, D.sans(s3 + 2, 600), rgb);
      let nl = 1;
      if (typeof txt === 'string') { g.font = D.sans(s3); const ls = D.wrap(s, txt, colW); nl = ls.length; D.text(s, ls, x, yy + s3 * 1.6, s3, 0.85 * a, D.sans(s3)); }
      else sup(s, txt, x, yy + s3 * 1.6, s3, 0.85 * a, C.text, 'center', 400);
      if (phone) y += s3 * 1.6 + s3 * 1.3 * nl + s3 * 1.4;
    });
  }

  Anim.register('decay', {
    duration: DURATION,
    poster: T0 + 22,
    // no pauses (teacher, 17 November 2026): the run never stops while a caption is read
    // score: slow fading (B-flat minor, a triangle pad with a very slow swell, a low drone, a faint shimmer)
    music: { chords: [[46, 53, 58, 61], [42, 49, 54, 58], [44, 51, 56, 60], [41, 48, 53, 56]], bar: 11, pad: 'triangle', cutoff: 800, drone: 0.11, shimmer: 0.15, tremolo: 0.15, volume: 0.51 },
    resize: layout,
    info: { RUN, tau, tauS, sorted, Nat, Sat, CAPS, LAM, countRate },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.2);
      drawGrid(s, t);
      drawSmall(s, t);
      drawDetector(s, t);
      drawGraphs(s, t);
      drawHL(s, t);
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Random decay and half-life', 'One nucleus is unpredictable. A thousand are not.');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
