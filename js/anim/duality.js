/* E.2 (HL) Wave–particle duality: light, then single photons, then single electrons through two slits.
   Numbers (data booklet: h = 6.63 × 10⁻³⁴ J s, mₑ = 9.11 × 10⁻³¹ kg, e = 1.60 × 10⁻¹⁹ C):
   - Light: λ = 532 nm (green), d = 0.40 mm, D = 1.5 m: s = λD/d = 532e-9 × 1.5 ÷ 0.40e-3 = 1.995e-3 m ≈ 2.0 mm.
   - Electrons accelerated from rest through 600 V: Eₖ = eV = 1.60e-19 × 600 = 9.60 × 10⁻¹⁷ J;
     2mEₖ = 2 × 9.11e-31 × 9.60e-17 = 1.749e-46, p = √(1.749e-46) = 1.32 × 10⁻²³ kg m s⁻¹;
     λ = h/p = 6.63e-34 ÷ 1.32e-23 = 5.02 × 10⁻¹¹ m ≈ 5.0 × 10⁻¹¹ m; v = p/m = 1.45 × 10⁷ m s⁻¹ (5% of c, so the
     non-relativistic Eₖ = p²/2m is fine).
   - Slits d = 0.25 µm apart (each 0.0625 µm wide, a quarter of d), detector D = 0.50 m away:
     s = λD/d = 5.0e-11 × 0.50 ÷ 0.25e-6 = 1.0 × 10⁻⁴ m = 0.10 mm.
   - 1000 electrons a second: on average 1.45e7 × 1.0e-3 = 1.45 × 10⁴ m ≈ 15 km apart.
   The landing positions are sampled once (fixed seed) from the exact two-slit pattern, in units of the fringe spacing
   u = y/s: P(u) ∝ cos²(πu) × sinc²(πu/4) (slit width = d/4, so the envelope's first zeros are at u = ±4 and the 4th
   bright fringes are missing). With one slit closed: P(u) ∝ sinc²(πu/4). The light's continuous pattern is the same
   P(u). The pictures are not to scale; the dots are simulated. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const NB = ' ';
  const nb = (s) => s.replace(/~/g, NB);

  // ---------- physics ----------
  const H_PL = 6.63e-34, M_E = 9.11e-31, E_CH = 1.60e-19, VACC = 600;
  const EK = E_CH * VACC, P_E = Math.sqrt(2 * M_E * EK), LAM_E = H_PL / P_E, V_E = P_E / M_E;
  const D_SLIT = 0.25e-6, D_SCR = 0.50, S_E = LAM_E * D_SCR / D_SLIT;
  const LAM_L = 532e-9, D_L = 1.5, d_L = 0.40e-3, S_L = LAM_L * D_L / d_L;
  const UMAX = 4.6;                                                     // the screen shows −4.6 s … +4.6 s
  const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x);
  const P2 = (u) => Math.cos(Math.PI * u) ** 2 * sinc(Math.PI * u / 4) ** 2;   // two slits
  const P1 = (u) => sinc(Math.PI * u / 4) ** 2;                                  // one slit

  // ---------- captions, laid out one after another so each has time to be read ----------
  const RAW = [
    ['Light from a green laser, λ~=~532~nm, passes through two narrow slits 0.40~mm apart.', 0, 0.6],
    ['On a screen 1.5~m away it makes bright and dark fringes: waves from the two slits interfere.', 0, 0],
    ['Fringe spacing s~=~λD/d~=~532~×~10⁻⁹~×~1.5~÷~(0.40~×~10⁻³) = 2.0~×~10⁻³~m~=~2.0~mm (C.3).', 0, 0],
    ['Bright and dark fringes are evidence of waves: here light behaves as a wave.', 0, 0],
    ['Now make the light extremely dim. Each photon still has energy hf: only the number per second falls, until they arrive one at a time.', 0.5, 0],
    ['Each photon arrives at the detector (a very sensitive camera) as a single dot, at one place: a particle.', 0, 0],
    ['Where each one lands looks random. But as the dots build up, the same fringes appear.', 0, 0.5],
    ['So light does both: it arrives as particles, but where they arrive follows the wave pattern.', 0, 0],
    ['Now electrons. An electron gun accelerates them from rest through a p.d. of 600~V.', 0.5, 0],
    ['Each gains Eₖ~=~eV~=~1.60~×~10⁻¹⁹~×~600~=~9.6~×~10⁻¹⁷~J.', 0, 0],
    ['Momentum p~=~√(2mEₖ)~=~√(2~×~9.11~×~10⁻³¹~×~9.6~×~10⁻¹⁷) = 1.32~×~10⁻²³~kg~m~s⁻¹.', 0, 0.6],
    ['De Broglie wavelength λ~=~h/p~=~6.63~×~10⁻³⁴~÷~(1.32~×~10⁻²³) = 5.0~×~10⁻¹¹~m.', 0, 0.6],
    ['The slits are 0.25~µm apart, cut in a thin membrane, and the detector is 0.50~m away.', 0, 0],
    ['Only about 1000 electrons are sent each second: on average 15~km apart, so only one is in the apparatus at a time.', 0, 0],
    ['Predict: if electrons were just tiny particles, would they make two stripes behind the slits, or fringes?', 0, 6],
    ['Each electron lands as a single dot. At first the dots look scattered at random…', 0, 0.4],
    ['…but as hundreds arrive, bright and dark fringes appear: an interference pattern.', 0, 1.2],
    ['They arrive one at a time, so the fringes cannot come from electrons interfering with each other.', 0, 0],
    ['Fringe spacing s~=~λD/d~=~5.0~×~10⁻¹¹~×~0.50~÷~(0.25~×~10⁻⁶) = 1.0~×~10⁻⁴~m~=~0.10~mm.', 0, 0.6],
    ['That spacing fits λ~=~h/p: the pattern is predicted by a wave passing through both slits.', 0, 0.4],
    ['Run it again with one slit closed: the fringes disappear, and only the broad spread from a single slit is left.', 0.5, 0.8],
    ['Each electron arrives as a particle, at one point. Where it is likely to land follows a wave.', 0.4, 0.4],
    ['Waves describe how light and matter travel; particles describe how they interact: wave–particle duality.', 0, 0.6],
  ];
  const CAPS = [], ST = [], EN = [];
  {
    let t = 4.8;
    for (const [txt, gap, extra] of RAW) {
      t += gap;
      const s = nb(txt), dur = Math.max(5.0, s.length / 15 + 1.0) + extra;
      CAPS.push([t, t + dur, s]); ST.push(t); EN.push(t + dur); t += dur + 0.2;
    }
  }
  const END_CARD = EN[EN.length - 1] + 0.3, DURATION = END_CARD + 13;

  // ---------- key moments ----------
  const T_LASER = 5.0, T_PAT = 8.5;                                     // waves set off; they reach the screen at 8.5 s
  const T_DIM = ST[4];                                                  // the light is dimmed
  const T_ELEC = ST[8];                                                 // switch to electrons
  const T_SINGLE = ST[20], T_REOPEN = ST[21];

  // ---------- seeded sampling ----------
  let seed = 20261117;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  function sampler(P) {
    const n = 4001, us = new Float64Array(n), cdf = new Float64Array(n);
    let acc = 0;
    for (let i = 0; i < n; i++) { us[i] = -UMAX + 2 * UMAX * i / (n - 1); if (i) acc += (P(us[i]) + P(us[i - 1])) / 2; cdf[i] = acc; }
    return () => {
      const r = rnd() * acc; let lo = 0, hi = n - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cdf[m] < r) lo = m; else hi = m; }
      const f = cdf[hi] > cdf[lo] ? (r - cdf[lo]) / (cdf[hi] - cdf[lo]) : 0;
      return lerp(us[lo], us[hi], f);
    };
  }
  // arrival times: slow at first (the first few can be followed one by one), then faster and faster
  function stream(P, N, t0, span, pw) {
    const draw = sampler(P), T = new Float64Array(N), U = new Float64Array(N), X = new Float64Array(N);
    for (let k = 0; k < N; k++) { T[k] = t0 + span * Math.pow((k + 1) / N, pw); U[k] = draw(); X[k] = rnd() * 2 - 1; }
    return { T, U, X, N };
  }
  const PHOT = stream(P2, 700, ST[5] - 1.0, EN[7] - 1.0 - (ST[5] - 1.0), 0.5);
  const ELEC = stream(P2, 2500, ST[15] - 0.8, EN[19] - 0.5 - (ST[15] - 0.8), 0.45);
  const SING = stream(P1, 1500, T_SINGLE + 0.9, EN[20] - 0.6 - (T_SINGLE + 0.9), 0.6);
  const countAt = (S, t) => { let lo = 0, hi = S.N; while (lo < hi) { const m = (lo + hi) >> 1; if (S.T[m] <= t) lo = m + 1; else hi = m; } return lo; };

  // ---------- colours ----------
  const GREEN = '120,235,140', ELC = C.neg, WAVE = '150,170,255', SLIT = '170,182,220';

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = s.H > s.W;
    const capFs = Math.round(clamp(W / 44, 15, 25)), capTop = H - capFs * (phone ? 6.6 : 5.0);
    const fs = phone ? 10 : Math.round(clamp(W / 80, 11, 15));
    let side, face;
    if (phone) {
      side = { x0: 10, x1: W - 10, y0: H * 0.05, y1: H * 0.33 };
      face = { x0: 18, x1: W - 18, y0: H * 0.39, y1: Math.min(capTop - fs * 1.2, H * 0.72) };
    } else {
      side = { x0: W * 0.03, x1: W * 0.56, y0: Math.max(46, H * 0.13), y1: capTop - fs * 1.5 };
      face = { x0: W * 0.61, x1: W * 0.97, y0: Math.max(56, H * 0.16), y1: capTop - fs * 1.5 };
    }
    const cy = (side.y0 + side.y1) / 2, hh = (side.y1 - side.y0) / 2;
    const xsrc = side.x0 + (side.x1 - side.x0) * 0.17, xb = side.x0 + (side.x1 - side.x0) * 0.42, xs = side.x1 - (side.x1 - side.x0) * 0.04;
    // the face panel: dots on the left part, a histogram on the right
    const fw = face.x1 - face.x0, histW = fw * (phone ? 0.28 : 0.3);
    const dots = { x0: face.x0 + fs * 0.6, x1: face.x1 - histW - fs * 0.6, y0: face.y0 + fs * 2.2, y1: face.y1 - fs * 1.6 };
    const hist = { x0: dots.x1 + fs * 0.8, x1: face.x1 - fs * 0.4, y0: dots.y0, y1: dots.y1 };
    L = { W, H, phone, fs, capTop, side, face, cy, hh, xsrc, xb, xs, dots, hist,
      gap: Math.max(10, hh * 0.22),                                     // slit separation as drawn (not to scale)
      ySide: (u) => cy + (u / UMAX) * hh * 0.92,
      yFace: (u) => (dots.y0 + dots.y1) / 2 + (u / UMAX) * (dots.y1 - dots.y0) / 2 };
  }

  // ---------- helpers ----------
  function label(s, txt, x, y, size, a, rgb = C.muted, align = 'center', w = 400) {
    D.text(s, txt, x, y, size, a, D.sans(size, w), rgb, align);
  }
  function rich(s, parts, x, y, size, a, rgb = C.text, align = 'center') {
    const { g } = s; if (a <= 0) return 0;
    const font = (st) => st === 's' ? D.serif(Math.round(size * 0.7)) : st === 'i' ? D.serif(size) : st === 'r' ? D.serif(size, false) : D.sans(Math.round(size * 0.9));
    const ws = parts.map(([tx, st]) => { g.font = font(st); return g.measureText(tx).width; });
    const total = ws.reduce((p, q) => p + q, 0);
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`;
    parts.forEach(([tx, st], i) => { g.font = font(st); g.fillText(tx, px, st === 's' ? y + size * 0.28 : y); px += ws[i]; });
    g.shadowBlur = 0; return total;
  }
  // which source is showing: 0 laser, 1 electron gun
  const elecMix = (t) => smooth((t - T_ELEC) / 1.5);
  // the second (lower) slit is closed between T_SINGLE and T_REOPEN
  const shutter = (t) => smooth((t - T_SINGLE) / 0.6) * (1 - smooth((t - T_REOPEN) / 0.6));
  // how bright the continuous light pattern is
  const lightPat = (t) => smooth((t - T_PAT) / 1.5) * (1 - smooth((t - T_DIM) / 3));
  // wave picture: bright with the laser, faint again when the electrons' wave is described
  const waveA = (t) => Math.max(smooth((t - T_LASER) / 0.8) * (1 - smooth((t - T_DIM) / 3)) * 0.9,
    0.55 * fade(t, ST[19], EN[22], 1.0, 1.2) * (1 - 0.7 * shutter(t)));

  // ---------- the side view ----------
  function drawSide(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { fs, cy, hh, xsrc, xb, xs, gap, phone } = L;
    const em = elecMix(t), sh = shutter(t);
    const y1 = cy - gap / 2, y2 = cy + gap / 2, slitH = Math.max(3, gap * 0.22);
    // source
    if (em < 1) {                                                       // the laser
      const la = (1 - em) * a, bw = Math.min(xsrc - L.side.x0 - 2, Math.max(26, (xb - xsrc) * 0.42)), bh = Math.max(12, hh * 0.22);
      g.globalAlpha = la; g.fillStyle = 'rgba(40,52,70,1)'; g.fillRect(xsrc - bw, cy - bh / 2, bw, bh);
      g.strokeStyle = 'rgba(160,175,210,0.7)'; g.lineWidth = 1; g.strokeRect(xsrc - bw, cy - bh / 2, bw, bh); g.globalAlpha = 1;
      const on = smooth((t - T_LASER) / 0.5) * (1 - 0.85 * smooth((t - T_DIM) / 3));
      D.glowDot(s, xsrc, cy, Math.max(5, bh * 0.45), GREEN, on * la);
      label(s, 'laser', xsrc - bw, cy - bh / 2 - fs * 0.9, fs, 0.8 * la, C.muted, 'left');
    }
    if (em > 0) {                                                       // the electron gun
      const ga = em * a, bw = Math.min(xsrc - L.side.x0 - 2, Math.max(26, (xb - xsrc) * 0.42)), bh = Math.max(12, hh * 0.26);
      g.globalAlpha = ga; g.fillStyle = 'rgba(50,58,80,1)'; g.fillRect(xsrc - bw, cy - bh / 2, bw, bh);
      g.strokeStyle = 'rgba(160,175,210,0.7)'; g.lineWidth = 1; g.strokeRect(xsrc - bw, cy - bh / 2, bw, bh);
      g.fillStyle = 'rgba(255,170,90,0.9)'; g.fillRect(xsrc - bw + bw * 0.12, cy - bh * 0.18, bw * 0.08, bh * 0.36);   // the hot filament
      g.globalAlpha = 1;
      D.glowDot(s, xsrc, cy, Math.max(4, bh * 0.3), ELC, 0.5 * ga);
      label(s, 'electron gun', xsrc - bw, cy - bh / 2 - fs * 0.9, fs, 0.8 * ga, C.muted, 'left');
      label(s, '600 V', xsrc - bw, cy + bh / 2 + fs * 0.9, fs, 0.8 * ga, C.light, 'left');
    }
    // the barrier with two slits
    g.globalAlpha = a; g.fillStyle = 'rgba(120,130,160,0.85)';
    const bwid = Math.max(3, fs * 0.35), top = cy - hh, bot = cy + hh;
    g.fillRect(xb - bwid / 2, top, bwid, y1 - slitH / 2 - top);
    g.fillRect(xb - bwid / 2, y1 + slitH / 2, bwid, y2 - slitH / 2 - (y1 + slitH / 2));
    g.fillRect(xb - bwid / 2, y2 + slitH / 2, bwid, bot - (y2 + slitH / 2));
    if (sh > 0) { g.fillStyle = `rgba(220,120,90,${0.95 * sh})`; g.fillRect(xb - bwid * 1.6, y2 - slitH * 0.9, bwid * 1.2, slitH * 1.8); }
    g.globalAlpha = 1;
    label(s, sh > 0.5 ? 'one slit closed' : 'two slits', xb, top - fs * 0.8, fs, 0.8 * a, sh > 0.5 ? '235,150,120' : SLIT);
    // the screen
    D.line(s, xs, top, xs, bot, '200,210,235', 0.6 * a, Math.max(2, fs * 0.2));
    label(s, t >= T_DIM ? 'detector' : 'screen', xs, top - fs * 0.8, fs, 0.8 * a, '200,210,235', 'right');
    if (!phone) label(s, 'side view, not to scale (wavefronts schematic)', (L.side.x0 + L.side.x1) / 2, bot + fs * 1.0, fs - 1, 0.55 * a);
    // waves
    const wa = waveA(t) * a;
    if (wa > 0.01) {
      const span = xs - xsrc, vw = span / 3.5, Lw = Math.max(12, (xb - xsrc) / 4.2);
      const front = (t - T_LASER) * vw;                                 // how far the first wavefront has travelled
      const ph = ((t * vw) % Lw + Lw) % Lw;
      const col = em > 0.5 ? ELC : GREEN;
      g.save(); g.beginPath(); g.rect(xsrc, top, xs - xsrc, bot - top); g.clip();
      for (let x = xsrc + ph; x < xb; x += Lw) {
        if (x - xsrc > front && em < 0.5) continue;
        D.line(s, x, cy - hh * 0.35, x, cy + hh * 0.35, col, 0.35 * wa, 1.2);
      }
      for (let n = 0; n < 60; n++) {
        const r = xsrc + ph + n * Lw - xb; if (r <= 0) continue;
        if (r > xs - xb + hh) break;
        if (r + (xb - xsrc) > front && em < 0.5) continue;
        const fa = 0.4 * wa * (1 - 0.6 * r / (xs - xb + hh));
        for (const [yc, open] of [[y1, 1], [y2, 1 - sh]]) {
          if (open <= 0.02) continue;
          g.strokeStyle = `rgba(${col},${fa * open})`; g.lineWidth = 1.1;
          g.beginPath(); g.arc(xb, yc, r, -Math.PI / 2, Math.PI / 2); g.stroke();
        }
      }
      g.restore();
      if (em > 0.5 && t > ST[19]) label(s, phone ? 'wave: likely landing' : 'wave: predicts where electrons land', (xb + xs) / 2, bot + fs * (phone ? 0.9 : 2.2), fs - 1, 0.75 * wa / 0.55, ELC);
    }
    // the continuous light pattern on the screen
    const lp = lightPat(t) * a;
    if (lp > 0) for (let i = 0; i <= 80; i++) {
      const u = -UMAX + 2 * UMAX * i / 80, I = P2(u);
      if (I < 0.03) continue;
      D.glowDot(s, xs, L.ySide(u), Math.max(3, hh * 0.05), GREEN, lp * I * 0.6);
    }
    // particles: travelling dots for the first few, then a flash where each lands
    const parts = [[PHOT, GREEN, 1 - smooth((t - T_ELEC) / 1.5)], [ELEC, ELC, 1 - shutter(t)], [SING, ELC, shutter(t)]];
    for (const [S, rgb, vis] of parts) {
      if (vis <= 0) continue;
      const n = countAt(S, t + 1.0);
      for (let k = 0; k < Math.min(n, 30); k++) {                       // the first 30 can be followed to the slits
        const tk = S.T[k], f = (t - (tk - 0.95)) / 0.55;
        if (f >= 0 && f <= 1) D.glowDot(s, lerp(xsrc, xb, 0.7 * f), cy, Math.max(4, fs * 0.45), rgb, a * vis * (f < 0.45 ? 1 : Math.max(0, (1 - f) / 0.55)));
      }
      const nNow = countAt(S, t);
      for (let k = Math.max(0, nNow - 40); k < nNow; k++) {
        const age = t - S.T[k]; if (age > 0.45) continue;
        D.glowDot(s, xs, L.ySide(S.U[k]), Math.max(4, fs * 0.5), rgb, a * vis * (1 - age / 0.45));
      }
    }
  }

  // ---------- the screen face-on, and the histogram ----------
  function drawFace(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { fs, face, dots: dp, hist: hp, phone } = L;
    const em = elecMix(t), sh = shutter(t);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(14,20,44,${0.75 * a})`; g.beginPath(); g.roundRect(face.x0, face.y0, face.x1 - face.x0, face.y1 - face.y0, 10); g.fill();
    label(s, t >= T_DIM ? (phone ? 'the detector, face-on' : 'the detector, seen face-on') : (phone ? 'the screen, face-on' : 'the screen, seen face-on'), dp.x0, face.y0 + fs * 0.95, fs, 0.85 * a, C.muted, 'left', 600);
    // counters
    const nP = countAt(PHOT, t), nE = countAt(ELEC, t), nS = countAt(SING, t);
    const which = t < T_ELEC ? (t >= PHOT.T[0] ? `photons: ${nP}` : '') : t < T_SINGLE ? (nE ? `electrons: ${nE}` : '') : t < T_REOPEN ? `new run, electrons: ${nS}` : `electrons: ${nE}`;
    if (which) label(s, which, dp.x0, dp.y1 + fs * 0.95, fs, 0.85 * a, t < T_ELEC ? GREEN : ELC, 'left', 600);
    D.line(s, dp.x0, dp.y0, dp.x1, dp.y0, C.muted, 0.15 * a); D.line(s, dp.x0, dp.y1, dp.x1, dp.y1, C.muted, 0.15 * a);
    // continuous light pattern: horizontal bands
    const lp = lightPat(t) * a;
    if (lp > 0) {
      const rows = 140, hgt = (dp.y1 - dp.y0) / rows;
      for (let i = 0; i < rows; i++) {
        const u = -UMAX + 2 * UMAX * (i + 0.5) / rows, I = P2(u);
        if (I < 0.01) continue;
        g.fillStyle = `rgba(${GREEN},${lp * I})`; g.fillRect(dp.x0, dp.y0 + i * hgt, dp.x1 - dp.x0, hgt + 0.6);
      }
    }
    // dots
    const dsz = Math.max(1.4, (dp.x1 - dp.x0) / (phone ? 110 : 170));
    const drawDots = (S, n, rgb, vis) => {
      if (vis <= 0 || n <= 0) return;
      g.fillStyle = `rgba(${rgb},${0.85 * vis * a})`;
      const xm = (dp.x0 + dp.x1) / 2, xw = (dp.x1 - dp.x0) / 2 - dsz;
      for (let k = 0; k < n; k++) g.fillRect(xm + S.X[k] * xw - dsz / 2, L.yFace(S.U[k]) - dsz / 2, dsz, dsz);
      for (let k = Math.max(0, n - 40); k < n; k++) {                    // a brief flash for each new arrival
        const age = t - S.T[k]; if (age > 0.5) continue;
        D.glowDot(s, xm + S.X[k] * xw, L.yFace(S.U[k]), Math.max(5, dsz * 4), rgb, vis * a * (1 - age / 0.5));
      }
    };
    const photVis = 1 - smooth((t - T_ELEC) / 1.5), elecVis = 1 - shutter(t);
    drawDots(PHOT, nP, GREEN, photVis);
    drawDots(ELEC, nE, ELC, elecVis);
    drawDots(SING, nS, ELC, shutter(t));
    // histogram of where the dots landed, with the wave's prediction drawn over it
    const NB_ = 92, counts = new Float64Array(NB_);
    let S = null, n = 0, P = P2, vis = 0, rgb = GREEN;
    if (t < T_ELEC) { S = PHOT; n = nP; vis = photVis; }
    else if (sh > 0.5) { S = SING; n = nS; P = P1; vis = shutter(t); rgb = ELC; }
    else { S = ELEC; n = nE; vis = elecVis; rgb = ELC; }
    D.line(s, hp.x0, dp.y0, hp.x0, dp.y1, C.muted, 0.35 * a);
    label(s, phone ? 'count' : 'how many landed', (hp.x0 + hp.x1) / 2, dp.y1 + fs * 0.95, fs - 1, 0.7 * a);
    if (S && n > 0 && vis > 0) {
      for (let k = 0; k < n; k++) { const b = Math.floor((S.U[k] + UMAX) / (2 * UMAX) * NB_); if (b >= 0 && b < NB_) counts[b]++; }
      // expected counts per bin, for the scale: n × (probability in each bin)
      let tot = 0; const ex = new Float64Array(NB_);
      for (let b = 0; b < NB_; b++) { const u = -UMAX + (b + 0.5) * 2 * UMAX / NB_; ex[b] = P(u); tot += ex[b]; }
      let exMax = 0; for (let b = 0; b < NB_; b++) { ex[b] *= n / tot; exMax = Math.max(exMax, ex[b]); }
      const scale = (hp.x1 - hp.x0) * 0.8 / Math.max(exMax, 1), bh = (dp.y1 - dp.y0) / NB_;
      g.fillStyle = `rgba(${rgb},${0.75 * vis * a})`;
      for (let b = 0; b < NB_; b++) if (counts[b]) g.fillRect(hp.x0 + 1, dp.y0 + b * bh, Math.min(hp.x1 - hp.x0, counts[b] * scale), Math.max(1, bh - 0.4));
      // the wave's prediction
      const showPred = t < T_ELEC ? smooth((t - ST[7]) / 1.0) : sh > 0.5 ? smooth((t - T_SINGLE - 2.5) / 1.0) : smooth((t - ST[18]) / 1.0);
      if (showPred > 0) {
        const pts = [];
        for (let b = 0; b <= 200; b++) { const u = -UMAX + 2 * UMAX * b / 200; pts.push([hp.x0 + P(u) * (n / tot) * (NB_ / (2 * UMAX)) * (2 * UMAX / NB_) * scale, L.yFace(u)]); }
        D.glowLine(s, pts, '255,214,102', 0.8 * showPred * vis * a, 1.3);
        label(s, phone ? 'wave' : 'wave prediction', hp.x1, dp.y0 - fs * 0.6, fs - 1, 0.85 * showPred * vis * a, C.light, 'right');
      }
    }
    // fringe spacing bracket
    const br = (u0, u1, txt, rgbB, al) => {
      if (al <= 0) return;
      const x = dp.x0 + fs * 0.3, ya = L.yFace(u0), yb = L.yFace(u1);
      D.line(s, x, ya, x, yb, rgbB, al, 1.5); D.line(s, x, ya, x + fs * 0.6, ya, rgbB, al, 1.5); D.line(s, x, yb, x + fs * 0.6, yb, rgbB, al, 1.5);
      g.fillStyle = `rgba(4,6,13,${0.75 * al})`; g.font = D.sans(fs, 600);
      const w = g.measureText(txt).width; g.fillRect(x + fs * 0.8, (ya + yb) / 2 - fs * 0.7, w + fs * 0.6, fs * 1.4);
      label(s, txt, x + fs * 1.1, (ya + yb) / 2, fs, al, rgbB, 'left', 600);
    };
    br(0, -1, 's = 2.0 mm', C.light, a * fade(t, ST[2], EN[3], 0.6, 0.6));
    br(0, -1, 's = 0.10 mm', C.light, a * fade(t, ST[18], EN[19], 0.6, 0.6));
  }

  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 32, 17, 34)), s3 = Math.round(clamp(W / 60, 12, 17));
    g.font = D.sans(s1, 300);
    D.text(s, D.wrap(s, 'Wave–particle duality (HL)', W - 48), W / 2, H * (phone ? 0.13 : 0.16), s1, a, D.sans(s1, 300));
    const items = [
      [[['λ', 'i'], [' = ', 'r'], ['h', 'i'], [' / ', 'r'], ['p', 'i']], ELC, 'Every moving particle has a de Broglie wavelength.'],
      [[['s', 'i'], [' = ', 'r'], ['λ', 'i'], ['D', 'i'], [' / ', 'r'], ['d', 'i']], C.light, 'The fringe spacing (C.3) gives the wavelength, for light or for electrons.'],
      [[['particle', 'sans']], C.pos, 'Each photon or electron arrives whole, at one point.'],
      [[['wave', 'sans']], WAVE, 'Where it is likely to arrive follows the interference pattern of a wave.'],
    ];
    if (phone) {
      let y = H * 0.24;
      for (const [eq, rgb, txt] of items) {
        rich(s, eq, W / 2, y, s2, a, rgb); y += s2 * 1.0;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 40); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.6;
      }
    } else {
      const colW = Math.min(W * 0.36, 400);
      items.forEach(([eq, rgb, txt], i) => {
        const x = W / 2 + (i % 2 ? 1 : -1) * W * 0.22, y = H * (i < 2 ? 0.33 : 0.6);
        rich(s, eq, x, y, s2, a, rgb);
        g.font = D.sans(s3); D.text(s, D.wrap(s, txt, colW), x, y + s2 * 1.05, s3, 0.85 * a, D.sans(s3));
      });
    }
    g.font = D.sans(s3 - 1);
    D.text(s, D.wrap(s, 'Pictures not to scale; the dots are simulated from the two-slit pattern.', W - 40), W / 2, H * 0.86, s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('duality', {
    duration: DURATION,
    poster: Math.round(ST[18] + 2),
    // score: mystery (C-sharp minor, a soft sine pad, long bars, a low drone, a soft shimmer, a very slow swell)
    music: { chords: [[49, 56, 61, 64, 68], [52, 59, 64, 68], [45, 52, 57, 64], [47, 54, 59, 66]], bar: 11, pad: 'sine', cutoff: 800, drone: 0.11, shimmer: 0.25, tremolo: 0.1, volume: 0.4 },
    resize: layout,
    info: { EK, P_E, LAM_E, V_E, S_E, S_L, CAPS, ST, EN, DURATION, PHOT, ELEC, SING, P2, P1,
      check() {
        const cps = CAPS.map(([a, b, x]) => x.length / (b - a - 0.6));
        return { Ek: EK, p: P_E, lam: LAM_E, v: V_E, sE: S_E, sL: S_L, apart: V_E * 1e-3, maxCps: Math.max(...cps), duration: DURATION };
      } },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.2);
      const a = smooth((t - 4.4) / 0.8) * (1 - smooth((t - END_CARD) / 0.8));
      drawSide(s, t, a);
      drawFace(s, t, a);
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Wave–particle duality (HL)', 'Light and electrons through two slits, one at a time');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
