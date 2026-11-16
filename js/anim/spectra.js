/* E.1 Energy levels, photons and spectra. Hydrogen's emission line spectrum, built up photon by photon from
   jumps between energy levels drawn to scale; then an absorption spectrum; then each element's own pattern.
   Constants (data booklet): h = 6.63 × 10⁻³⁴ J s, c = 3.00 × 10⁸ m s⁻¹, 1 eV = 1.60 × 10⁻¹⁹ J, so hc = 1.989 × 10⁻²⁵ J m.
   Levels: −13.6, −3.40, −1.51, −0.85 and −0.54 eV for n = 1 to 5, as in the notes (themes/e1.html section 6), and
   −0.38 eV for n = 6 (from E = −13.6/n² eV, the HL Bohr model: −13.6/36 = −0.378 → −0.38).
   Photon energies and wavelengths, λ = hc/ΔE (with those rounded values, as a student would work them):
   - 3 → 2: ΔE = −1.51 − (−3.40) = 1.89 eV = 3.024 × 10⁻¹⁹ J, λ = 1.989e-25 / 3.024e-19 = 6.577 × 10⁻⁷ m = 658 nm (measured 656.3 nm)
   - 2 → 1: ΔE = 13.6 − 3.40 = 10.2 eV = 1.632 × 10⁻¹⁸ J, λ = 1.219 × 10⁻⁷ m = 122 nm, ultraviolet (measured 121.6 nm)
   - 4 → 2: ΔE = 3.40 − 0.85 = 2.55 eV = 4.08 × 10⁻¹⁹ J, λ = 4.875 × 10⁻⁷ m = 488 nm (measured 486.1 nm; the notes' worked example)
   - 5 → 2: ΔE = 3.40 − 0.54 = 2.86 eV = 4.576 × 10⁻¹⁹ J, λ = 4.347 × 10⁻⁷ m = 435 nm (measured 434.0 nm)
   - 6 → 2: ΔE = 3.40 − 0.38 = 3.02 eV = 4.832 × 10⁻¹⁹ J, λ = 4.116 × 10⁻⁷ m = 412 nm (measured 410.2 nm)
   - 4 → 3: ΔE = 1.51 − 0.85 = 0.66 eV = 1.056 × 10⁻¹⁹ J, λ = 1.884 × 10⁻⁶ m = 1880 nm, infrared (measured 1875 nm)
   - 3 → 1: ΔE = 13.6 − 1.51 = 12.09 eV = 1.934 × 10⁻¹⁸ J, λ = 1.028 × 10⁻⁷ m = 103 nm, ultraviolet (measured 102.6 nm)
   The small differences from the measured values come from the rounded constants and level values (as the notes say).
   The lines on the spectrum are drawn at the measured wavelengths. Other elements' strongest visible lines (nm):
   helium 447.1, 471.3, 492.2, 501.6, 587.6, 667.8; sodium 568.8, 589.0, 589.6, 615.4. The Sun's spectrum is simplified:
   only its hydrogen and sodium dark lines are drawn.
   The grating: the light comes straight down into it, and the strip is to its lower right, so the straight-through
   direction is nearest the violet end and red is turned furthest, as for a real grating (sin θ = nλ/d; the angles are
   exaggerated so the lines spread across the picture). In the middle part, photons go straight to their place on the strip. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const NB = (txt) => txt.replace(/~/g, ' ');                    // ~ = a space that never breaks a line

  // ---------- physics ----------
  const H_P = 6.63e-34, C_L = 3.00e8, EV = 1.60e-19;
  const LEVEL = { 1: -13.6, 2: -3.40, 3: -1.51, 4: -0.85, 5: -0.54, 6: -0.38 };
  const lamNm = (from, to) => H_P * C_L / ((LEVEL[from] - LEVEL[to]) * EV) * 1e9;   // nm, from the rounded values
  const BALMER = [656.3, 486.1, 434.0, 410.2], BAL_I = [1, 0.8, 0.6, 0.45];
  const HELIUM = [[447.1, 0.6], [471.3, 0.3], [492.2, 0.35], [501.6, 0.5], [587.6, 1], [667.8, 0.5]];
  const SODIUM = [[568.8, 0.3], [589.0, 1], [589.6, 0.9], [615.4, 0.25]];

  // ---------- timeline ----------
  const T_B = 23.4, Z_IN = [60.4, 62.4], Z_OUT = [91.0, 92.6], T_C = 102.0, Z_C = [102.0, 103.5], T_D = 139.6, END_CARD = 152.8, DURATION = 164;
  const TRAVEL = 2.6;
  // the electron's jumps: 'col' = lifted by a collision, 'emit' = drops and gives out a photon,
  // 'abs' = lifted by absorbing a photon, 'reemit' = drops and gives the photon out again (any direction)
  const EVENTS = [
    { t: 36.6, from: 1, to: 3, kind: 'col', xf: 0.30 },
    { t: 42.0, from: 3, to: 2, kind: 'emit', xf: 0.30, lam: 656.3 },
    { t: 55.0, from: 2, to: 1, kind: 'emit', xf: 0.16, lam: 121.6 },
    { t: 63.8, from: 1, to: 4, kind: 'col', xf: 0.45 },
    { t: 67.0, from: 4, to: 2, kind: 'emit', xf: 0.45, lam: 486.1 },
    { t: 72.8, from: 2, to: 5, kind: 'col', xf: 0.60 },
    { t: 73.8, from: 5, to: 2, kind: 'emit', xf: 0.60, lam: 434.0 },
    { t: 75.2, from: 2, to: 6, kind: 'col', xf: 0.75 },
    { t: 76.2, from: 6, to: 2, kind: 'emit', xf: 0.75, lam: 410.2 },
    { t: 86.0, from: 2, to: 4, kind: 'col', xf: 0.90 },
    { t: 86.8, from: 4, to: 3, kind: 'emit', xf: 0.90, lam: 1875 },
    { t: 93.2, from: 3, to: 1, kind: 'emit', xf: 0.08, lam: 102.6 },
    { t: 116.2, from: 2, to: 4, kind: 'abs', xf: 0.45, lam: 486.1 },
    { t: 121.4, from: 4, to: 2, kind: 'reemit', xf: 0.45, lam: 486.1 },
  ];
  const ELEC_ON = [[30.0, 97.0], [107.6, 126.4]];                    // when the electron's dot is shown
  const START_N = (t) => (t < T_C ? 1 : 2);

  // ---------- captions (~ keeps an expression on one line) ----------
  const CAPS = [
    [4.8, 10.6, 'Hydrogen gas at low pressure glows when a high voltage is put across the tube.'],
    [10.8, 16.8, 'A diffraction grating spreads the light out by wavelength: a few bright lines, not a rainbow.'],
    [17.0, 23.2, 'This is an emission line spectrum. Why does hydrogen give out only these wavelengths?'],
    [23.6, 29.6, 'The electron in a hydrogen atom can only have certain energies: the energy levels, drawn here to scale.'],
    [29.8, 35.8, 'They are negative: zero is the energy of an electron that has just escaped. The lowest level, n~=~1, is the ground state.'],
    [36.0, 41.6, 'In the tube, a collision with a fast-moving electron gives the atom\'s electron energy: it jumps up to the excited level n~=~3.'],
    [41.8, 47.8, 'It soon drops back. Dropping from n~=~3 to n~=~2, it gives out one photon, carrying the difference in energy.'],
    [48.0, 54.4, 'ΔE~=~−1.51~−~(−3.40)~=~1.89~eV =~3.024~×~10⁻¹⁹~J, so λ~=~hc/ΔE~=~658~nm: the red line (measured: 656~nm).'],
    [54.6, 60.2, 'From n~=~2 to n~=~1 is a much bigger drop, 10.2~eV. The photon is ultraviolet (122~nm): not visible.'],
    [60.4, 66.4, 'Zooming in on the levels above n~=~2, still to scale. Another collision lifts the electron to n~=~4.'],
    [66.6, 72.6, 'Dropping from n~=~4 to n~=~2: ΔE~=~2.55~eV, so λ~=~488~nm, the blue-green line (measured: 486~nm).'],
    [72.8, 79.4, 'From n~=~5: 2.86~eV and 435~nm (blue). From n~=~6: 3.02~eV and 412~nm (violet).'],
    [79.6, 85.2, 'A bigger drop gives a photon with more energy: a higher frequency and a shorter wavelength.'],
    [85.4, 91.0, 'Drops that end on n~=~3, such as 4~→~3 (0.66~eV, 1880~nm), give infrared photons: not visible.'],
    [91.2, 96.8, 'Zooming out: drops that end on n~=~1, such as 3~→~1 (12.09~eV, 103~nm), give ultraviolet photons.'],
    [97.0, 101.8, 'Each line comes from one size of drop. Only drops that end on n~=~2 can give visible light.'],
    [102.2, 108.0, 'Now white light, containing every wavelength, shines through cooler hydrogen gas.'],
    [108.2, 114.0, 'Predict: what will the gas do to the spectrum of the white light?'],
    [114.2, 120.4, 'Only photons with exactly the right energy are absorbed. A blue-green photon lifts an electron from n~=~2 to n~=~4.'],
    [120.6, 126.6, 'Other photons pass straight through. The absorbed energy is soon given out again, but in any direction.'],
    [126.8, 132.8, 'So fewer of those photons go on: dark lines, at exactly the wavelengths of the bright emission lines.'],
    [133.0, 139.4, 'Visible dark lines need some atoms already in n~=~2, so the gas, though cooler than the source, must still be hot, like a star\'s outer layers.'],
    [139.6, 145.6, 'Every element has its own pattern of lines, like a fingerprint.'],
    [145.8, 152.4, 'Dark lines in the Sun\'s spectrum match the lines of hydrogen and sodium: both are in its outer layers.'],
  ].map(([a, b, txt]) => [a, b, NB(txt)]);
  // holds: every caption gets enough time to read at 16 characters a second (the picture holds still just before
  // it fades); the calculation of the red line gets 1.2 s more, and the Predict caption 6 s more to think
  const EXTRA = { 48.0: 1.2 };
  const PAUSES = CAPS.map(([a, b, txt]) => {
    const need = txt.length / 16 - (b - a - 0.6) + (EXTRA[a] || 0);
    return need > 0.05 ? [+(b - 0.8).toFixed(2), +need.toFixed(1)] : null;
  }).filter(Boolean);
  PAUSES.push([113.2, 6.0]);

  // ---------- colours ----------
  const LEVEL_RGB = '170,182,220', UV_RGB = '196,170,255', IR_RGB = '255,110,80', ELEC = C.neg, COLL = '150,230,255';
  const nmRGB = (l) => {                                               // the colour of light of wavelength l (nm)
    if (l < 380) return UV_RGB;
    if (l > 780) return IR_RGB;
    let r = 0, g = 0, b = 0;
    if (l < 440) { r = (440 - l) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = (510 - l) / 20; }
    else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = (645 - l) / 65; } else r = 1;
    const f = l < 420 ? 0.3 + 0.7 * (l - 380) / 40 : l > 700 ? 0.3 + 0.7 * (780 - l) / 80 : 1;
    const c = (v) => Math.round(255 * Math.pow(Math.max(0, v * f), 0.8));
    return `${Math.max(c(r), 30)},${c(g)},${Math.max(c(b), 0)}`;
  };

  // ---------- layout ----------
  // left: the spectroscope column (light comes straight down into the grating, which sits above and to the left of
  // the strip's violet end); middle: the energy-level diagram; bottom: the spectrum strip
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;                            // the 4:5 stage: buttons below the picture
    const capFs = Math.round(clamp(W / 44, 15, 25)), fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    const capTop = H - capFs * (phone ? 6.6 : 5.0);
    const sh = Math.max(14, fs * 1.7), sy1 = capTop - fs * 2.4, sy0 = sy1 - sh;
    const uy0 = phone ? 12 : Math.max(30, H * 0.07), uy1 = sy0 - fs * 2.6;
    const cx = phone ? W * 0.15 : W * 0.12, hg = phone ? fs * 3.2 : fs * 3.6, gy = sy0 - hg;
    const sx0 = cx + 2.2 * hg, sx1 = phone ? W * 0.94 : W * 0.90;
    const dx0 = phone ? W * 0.55 : W * 0.40, dx1 = phone ? W * 0.80 : W * 0.66;
    const dy0 = uy0 + fs * 2.2, dy1 = uy1 - fs * 0.6;
    const srcY = dy0 + fs * 1.0, gasY = (dy0 + fs * 1.0 + gy) / 2;
    L = { W, H, phone, fs, capFs, capTop, sx0, sx1, sh, sy0, sy1, uy0, uy1, dx0, dx1, dy0, dy1, cx, gy, hg, srcY, gasY,
      tubeX: phone ? W * 0.30 : W * 0.20, tubeLen: phone ? W * 0.42 : W * 0.26,
      X: (l) => sx0 + (l - 400) / 300 * (sx1 - sx0) };
  }

  // ---------- the energy axis, zooming in and out ----------
  const zoomAt = (t) => t < Z_OUT[0] ? smooth((t - Z_IN[0]) / (Z_IN[1] - Z_IN[0]))
    : t < T_C ? 1 - smooth((t - Z_OUT[0]) / (Z_OUT[1] - Z_OUT[0])) : smooth((t - Z_C[0]) / (Z_C[1] - Z_C[0]));
  const E_TOP = 0.4;
  const yOf = (E, z) => { const eb = lerp(-14.2, -3.75, z); return L.dy0 + (E_TOP - E) / (E_TOP - eb) * (L.dy1 - L.dy0); };
  const xOf = (xf) => L.dx0 + xf * (L.dx1 - L.dx0);

  // ---------- helpers ----------
  const along = (pts, f) => {
    const seg = []; let tot = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) || 1e-6; seg.push(d); tot += d; }
    let r = clamp(f, 0, 1) * tot;
    for (let i = 0; i < seg.length; i++) {
      const dx = (pts[i + 1][0] - pts[i][0]) / seg[i], dy = (pts[i + 1][1] - pts[i][1]) / seg[i];
      if (r <= seg[i] || i === seg.length - 1) { const u = Math.min(r, seg[i]); return { x: pts[i][0] + dx * u, y: pts[i][1] + dy * u, ux: dx, uy: dy }; }
      r -= seg[i];
    }
    return { x: pts[0][0], y: pts[0][1], ux: 1, uy: 0 };
  };
  // a photon: a short glowing wave packet, with its wavelength drawn roughly in proportion to the real one
  function packet(s, x, y, ux, uy, lam, rgb, a) {
    if (a <= 0) return;
    const fs = L.fs, lamPx = clamp(lam / 656 * fs * 1.2, 2.6, 60), len = Math.max(fs * 3.4, lamPx * 2.3), amp = Math.max(3, fs * 0.42);
    const nx = -uy, ny = ux, pts = [];
    for (let i = 0; i <= 48; i++) {
      const u = (i / 48 - 0.5) * len, env = Math.exp(-Math.pow(2 * u / len, 2) * 2.4), w = amp * env * Math.sin(2 * Math.PI * u / lamPx);
      pts.push([x + ux * u + nx * w, y + uy * u + ny * w]);
    }
    D.glowDot(s, x, y, len * 0.42, rgb, 0.28 * a);
    D.glowLine(s, pts, rgb, a, 1.6);
  }
  // text made of pieces: [text, style]: 'i' italic serif, 'r' upright serif, 's' subscript, 'p' superscript, 'sans'
  function rich(s, parts, x, y, size, a, rgb = C.text, align = 'center') {
    const { g } = s; if (a <= 0) return 0;
    const font = (st) => st === 's' || st === 'p' ? D.serif(Math.round(size * 0.7)) : st === 'i' ? D.serif(size) : st === 'r' ? D.serif(size, false) : D.sans(Math.round(size * 0.9));
    const ws = parts.map(([tx, st]) => { g.font = font(st); return g.measureText(tx).width; });
    const total = ws.reduce((p, q) => p + q, 0);
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`;
    parts.forEach(([tx, st], i) => { g.font = font(st); g.fillText(tx, px, st === 's' ? y + size * 0.28 : st === 'p' ? y - size * 0.35 : y); px += ws[i]; });
    g.shadowBlur = 0;
    return total;
  }
  const label = (s, txt, x, y, a, rgb = C.muted, align = 'center', size = L.fs, weight = 400) => D.text(s, txt, x, y, size, a, D.sans(size, weight), rgb, align);

  // ---------- the electron's level at time t ----------
  function electron(t) {
    const on = ELEC_ON.find(([a, b]) => t > a - 0.6 && t < b + 0.6);
    if (!on) return null;
    const alpha = fade(t, on[0], on[1], 0.6, 0.6);
    const evs = EVENTS.filter((e) => e.t >= on[0] - 0.01 && e.t <= on[1]);
    let n = START_N(t), from = n, k = 1, x = evs.length ? evs[0].xf : 0.3;
    for (let i = 0; i < evs.length; i++) {
      const e = evs[i];
      if (t >= e.t) { from = e.from; n = e.to; k = smooth((t - e.t) / 0.35); x = e.xf; }
      const nxt = evs[i + 1];
      if (t >= e.t && nxt) x = lerp(e.xf, nxt.xf, smooth((t - (nxt.t - 0.7)) / 0.5));   // slides sideways before its next jump
    }
    return { from, n, k, xf: x, a: alpha };
  }

  // ---------- part A: the discharge tube above the grating ----------
  function drawTube(s, t) {
    const a = fade(t, 4.4, T_B + 0.8, 0.8, 1.0); if (a <= 0) return;
    const { g } = s, { fs, phone, cx, gy, tubeX: tx, tubeLen: len, srcY } = L;
    const r = fs * 0.85, x0 = tx - len / 2, x1 = tx + len / 2, cy = srcY + fs * 1.4;
    const on = smooth((t - 5.6) / 0.8), flick = 0.92 + 0.08 * Math.sin(s.clock * 23) * Math.sin(s.clock * 7.3);
    // the glass and the glowing gas
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(30,34,60,${0.6 * a})`; g.beginPath(); g.roundRect(x0, cy - r, len, 2 * r, r); g.fill();
    g.strokeStyle = `rgba(190,200,240,${0.55 * a})`; g.lineWidth = 1.2; g.stroke();
    if (on > 0) {
      g.globalCompositeOperation = 'lighter';
      const gr = g.createLinearGradient(0, cy - r, 0, cy + r);
      gr.addColorStop(0, 'rgba(255,120,200,0)'); gr.addColorStop(0.5, `rgba(255,140,210,${0.75 * on * a * flick})`); gr.addColorStop(1, 'rgba(255,120,200,0)');
      g.fillStyle = gr; g.fillRect(x0 + r * 0.6, cy - r, len - r * 1.2, 2 * r);
      D.glowDot(s, tx, cy, len * 0.55, '255,120,200', 0.25 * on * a);
      g.globalCompositeOperation = 'source-over';
    }
    // electrodes and leads to the supply
    for (const ex of [x0 + r * 0.5, x1 - r * 0.5]) D.line(s, ex, cy, ex, cy - r * 2.6, LEVEL_RGB, 0.7 * a, 1.4);
    D.line(s, x0 + r * 0.5, cy - r * 2.6, tx - fs * 2.6, cy - r * 2.6, LEVEL_RGB, 0.7 * a, 1.4);
    D.line(s, x1 - r * 0.5, cy - r * 2.6, tx + fs * 2.6, cy - r * 2.6, LEVEL_RGB, 0.7 * a, 1.4);
    label(s, 'high voltage', tx, cy - r * 2.6, a, C.text, 'center', fs, 600);
    label(s, phone ? 'hydrogen tube' : 'hydrogen discharge tube', tx + (phone ? fs * 1.2 : fs * 2), cy + r + fs * 1.2, 0.9 * a);
    // light from the tube goes straight down into the grating, which sends each wavelength to its own place
    if (on > 0) {
      const b = smooth((t - 7.0) / 1.0) * a;
      D.glowLine(s, [[cx, cy + r], [cx, gy]], '255,170,220', 0.45 * b, 1.4);
      BALMER.forEach((l, i) => {
        const ri = smooth((t - 11.4 - i * 0.5) / 0.6) * a * (1 - smooth((t - T_B) / 0.8));
        D.line(s, cx, gy, L.X(l), L.sy0, nmRGB(l), 0.4 * ri, 1.2);
      });
    }
  }
  // the grating lies flat (the light comes down onto it); its label sits to its left, clear of the lines
  function drawGrating(s, a) {
    if (a <= 0) return;
    const { cx, gy, fs } = L, w = fs * 2.4;
    D.line(s, cx - w / 2, gy, cx + w / 2, gy, '210,220,250', 0.85 * a, 2.2);
    for (let i = 0; i <= 8; i++) { const x = cx - w / 2 + i * w / 8; D.line(s, x, gy - 3, x, gy + 3, '210,220,250', 0.5 * a, 1); }
    label(s, 'grating', cx - w / 2 - fs * 0.4, gy, 0.85 * a, C.muted, 'right');
  }

  // ---------- the energy-level diagram ----------
  function drawDiagram(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { fs, dx0, dx1, dy0, dy1, phone } = L, z = zoomAt(t);
    // clip to the diagram so levels below the zoomed view vanish
    g.save(); g.beginPath(); g.rect(0, dy0 - fs * 1.4, L.W, dy1 - dy0 + fs * 2.0); g.clip();
    // faint higher levels, crowding towards zero
    for (let n = 7; n <= 14; n++) { const y = yOf(-13.6 / (n * n), z); D.line(s, dx0, y, dx1, y, LEVEL_RGB, 0.18 * a, 1); }
    // zero: the energy of an electron that has just escaped
    const y0 = yOf(0, z);
    D.line(s, dx0, y0, dx1, y0, LEVEL_RGB, 0.6 * a, 1.2, [5, 4]);
    for (let n = 1; n <= 6; n++) { const y = yOf(LEVEL[n], z); D.line(s, dx0, y, dx1, y, LEVEL_RGB, 0.85 * a, 1.6); }
    g.restore();
    // labels: n on the right, the energy on the left; n = 4, 5, 6 only when there is room (zoomed in)
    const zl = smooth((z - 0.55) / 0.35);
    // (zoomed out, n = 4, 5, 6 are too close to label one by one, so they share one label); labels that would
    // touch are pushed apart, with a short leader to their level
    const rows = [{ E: 0, n: 'n = ∞', e: '0', al: 1 }, { E: -0.6, n: phone ? '4, 5, 6 …' : 'n = 4, 5, 6 …', e: '', al: 1 - zl, grp: true }];
    for (let n = 6; n >= 1; n--) rows.push({ E: LEVEL[n], n: `n = ${n}`, e: (LEVEL[n] < 0 ? '−' : '') + Math.abs(LEVEL[n]).toFixed(2).replace(/^13\.60$/, '13.6'), al: n >= 4 ? zl : 1 });
    const minSp = fs * 1.2; let prev = -1e9;
    for (const r of rows) {
      r.y0 = yOf(r.E, z);
      if (r.al < 0.02) { r.y = r.y0; continue; }
      r.y = Math.max(r.y0, prev + minSp); prev = r.y;
    }
    for (const r of rows) {
      if (r.al <= 0.02 || r.y0 < dy0 - fs * 1.5 || r.y0 > dy1 + fs * 0.6) continue;
      const al = r.al * a, moved = Math.abs(r.y - r.y0) > 2;
      label(s, r.n, dx1 + fs * 0.6 + (moved ? fs * 0.7 : 0), r.y, (r.grp ? 0.8 : 1) * al, r.grp ? C.muted : C.text, 'left');
      if (r.e) label(s, r.e, dx0 - fs * 0.5 - (moved ? fs * 0.7 : 0), r.y, 0.85 * al, C.muted, 'right');
      if (moved) {                                                      // a short leader to its level
        D.line(s, dx1, r.y0, dx1 + fs * 1.1, r.y, LEVEL_RGB, 0.5 * al, 1);
        if (r.e) D.line(s, dx0, r.y0, dx0 - fs * 1.1, r.y, LEVEL_RGB, 0.5 * al, 1);
      }
    }
    // zoomed in (in the middle part only), n = 1 is far below
    // (it makes way for the infrared photon's label, which arrives on the same row)
    if (z > 0.05 && t < T_C) label(s, '↓ n = 1 is far below, at −13.6 eV', (dx0 + dx1) / 2, dy1 + fs * 1.0, 0.75 * a * smooth((z - 0.6) / 0.3) * (1 - smooth((t - 88.6) / 0.5)), C.muted);
    rich(s, [['E', 'i'], [' / eV', 'sans']], dx0 - fs * 0.5, dy0 - fs * 1.6, fs + 1, 0.85 * a, C.muted, 'right');
    // the jumps: arrows for drops (in the photon's colour) and for collisions (pale)
    g.save(); g.beginPath(); g.rect(0, dy0 - fs * 1.4, L.W, dy1 - dy0 + fs * 2.0); g.clip();
    const group = fade(t, 79.6, 85.2, 0.5, 0.5);                       // all four visible drops together
    for (const e of EVENTS) {
      const x = xOf(e.xf), ya = yOf(LEVEL[e.from], z), yb = yOf(LEVEL[e.to], z);
      const rgb = e.kind === 'col' ? '200,210,240' : nmRGB(e.lam);
      let al = e.kind === 'col' ? fade(t, e.t - 0.1, e.t + 2.2, 0.2, 0.6)
        : fade(t, e.t - 0.05, e.t === 42.0 ? 54.4 : e.t + 5.5, 0.2, 0.9);   // the first drop stays while its numbers are worked out
      if (e.kind === 'emit' && e.to === 2 && e.t < 80) al = Math.max(al, group);
      if ((e.t > T_C) !== (t > T_C)) al = 0;
      if (al <= 0) continue;
      const grow = e.kind === 'col' || e.kind === 'abs' ? smooth((t - e.t) / 0.35) : 1;
      D.arrow(s, x, ya, x, lerp(ya, yb, grow), rgb, al * a, '', { head: Math.max(7, fs * 0.75), width: e.kind === 'col' ? 1.3 : 2.4, blur: e.kind === 'col' ? 0 : 8 });
    }
    g.restore();
    // the energy gap for the first drop
    const gapA = fade(t, 43.0, 54.4, 0.5, 0.6) * a;
    if (gapA > 0) {
      const x = xOf(0.30) + fs * 0.8, ya = yOf(LEVEL[3], z), yb = yOf(LEVEL[2], z);
      label(s, 'ΔE = 1.89 eV', x, (ya + yb) / 2, gapA, nmRGB(656.3), 'left', fs, 600);
    }
    // the electron
    const el = electron(t);
    if (el) {
      const x = xOf(el.xf), y = lerp(yOf(LEVEL[el.from], z), yOf(LEVEL[el.n], z), el.k), ea = el.a * a;
      g.save(); g.beginPath(); g.rect(0, dy0 - fs * 1.4, L.W, dy1 - dy0 + fs * 2.0); g.clip();
      D.glowDot(s, x, y, fs * 1.5, ELEC, ea);
      g.restore();
      const la = fade(t, 30.4, 36.2, 0.6, 0.5) * ea;
      if (la > 0) label(s, phone ? 'electron' : 'electron (the dot shows its energy)', x + fs * 1.1, y - fs * 1.1, la, ELEC, 'left');
      // in the gas, some atoms are already in n = 2
      const ka = fade(t, T_C + 5.8, T_C + 13.8, 0.6, 0.6) * ea;
      if (ka > 0) label(s, phone ? 'already in n = 2' : 'some atoms are already in n = 2', x + fs * 1.1, y - fs * 1.1, ka, ELEC, 'left');
    }
    // collisions: a fast-moving electron in the tube strikes the atom
    for (const e of EVENTS) {
      if (e.kind !== 'col' || t < e.t - 0.5 || t > e.t + 0.3) continue;
      const x = xOf(e.xf), y = yOf(LEVEL[e.from], z), u = smooth((t - (e.t - 0.5)) / 0.5);
      if (y > dy1 + fs) continue;
      const px = lerp(x - fs * 5, x, u), py = lerp(y + fs * 1.6, y, u);
      D.glowDot(s, px, py, fs * 0.8, COLL, 0.9 * a * (1 - smooth((t - e.t) / 0.3)));
      if (e.t < 40) label(s, 'collision', x - fs * 5, y + fs * 2.6, 0.8 * a, COLL, 'center');
    }
    // in part C, the diagram is one atom of the gas
    const oneA = fade(t, T_C + 1.8, T_D, 0.6, 0.6) * a;
    if (oneA > 0) label(s, 'one atom of the gas', phone ? dx0 + fs * 0.6 : (dx0 + dx1) / 2, dy0 - fs * 1.6, oneA, C.text, phone ? 'left' : 'center', fs, 600);
  }

  // ---------- part B: photons going to their place in the spectrum ----------
  function photonPaths(s, t) {
    const { fs, sx0, sx1, sy0, sh } = L;
    for (const e of EVENTS) {
      if (e.kind !== 'emit' || t < e.t || t > e.t + TRAVEL + 4.5) continue;
      const z = zoomAt(e.t), x = xOf(e.xf), y = (yOf(LEVEL[e.from], z) + yOf(LEVEL[e.to], z)) / 2;
      const uv = e.lam < 380, ir = e.lam > 780;
      const end = uv ? [sx0 - fs * 1.4, sy0 + sh / 2] : ir ? [sx1 + fs * 1.4, sy0 + sh / 2] : [L.X(e.lam), sy0 - 2];
      const f = (t - e.t) / TRAVEL, rgb = nmRGB(e.lam);
      if (f <= 1) { const p = along([[x, y], end], f); packet(s, p.x, p.y, p.ux, p.uy, e.lam, rgb, fade(t, e.t, e.t + TRAVEL + 0.2, 0.15, 0.3)); }
      if (uv || ir) {
        const la = fade(t, e.t + TRAVEL - 0.2, e.t + TRAVEL + 4.5, 0.4, 0.8);
        label(s, uv ? (L.phone ? 'ultraviolet' : 'ultraviolet: not visible') : (L.phone ? 'infrared' : 'infrared: not visible'), uv ? sx0 : sx1, sy0 - fs * 2.1, la, rgb, uv ? 'left' : 'right', fs, 600);
      }
    }
  }

  // ---------- part C: white light through cooler gas, then down into the grating ----------
  const STREAM = (() => { let sd = 7; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647; return Array.from({ length: 22 }, (_, k) => ({ lam: 405 + 290 * r(), ph: k / 22 + 0.03 * r() })); })();
  function drawAbsorption(s, t) {
    const a = fade(t, T_C + 0.4, T_D + 0.6, 1.0, 1.0); if (a <= 0) return;
    const { fs, cx, gy, srcY, gasY, phone, W, H } = L;
    const src = [cx, srcY], gas = [cx, gasY], grat = [cx, gy];
    // the white beam down the column, and the fan of colours from the grating
    D.glowLine(s, [src, grat], '235,240,255', 0.35 * a, 1.6);
    for (let l = 410; l <= 690; l += 20) D.line(s, cx, gy, L.X(l), L.sy0, nmRGB(l), 0.12 * a, 1);
    // the hot source and the gas
    D.glowDot(s, src[0], src[1], fs * 2.4, '255,250,235', a);
    label(s, phone ? 'hot source' : 'hot, dense source', cx + fs * 2.4, srcY, 0.85 * a, C.muted, 'left');
    const { g } = s, rx = fs * (phone ? 1.5 : 2.0), ry = fs * (phone ? 2.2 : 3.0);
    const gr = g.createRadialGradient(gas[0], gas[1], 0, gas[0], gas[1], ry);
    gr.addColorStop(0, `rgba(150,170,255,${0.32 * a})`); gr.addColorStop(1, 'rgba(150,170,255,0)');
    g.globalCompositeOperation = 'source-over'; g.fillStyle = gr; g.beginPath(); g.ellipse(gas[0], gas[1], rx, ry, 0, 0, 7); g.fill();
    for (let i = 0; i < 9; i++) { const an = i * 2.4 + s.clock * 0.3, rr = (0.25 + 0.6 * ((i * 37) % 10) / 10); D.glowDot(s, gas[0] + Math.cos(an) * rx * rr, gas[1] + Math.sin(an * 1.3) * ry * rr, fs * 0.5, '170,190,255', 0.5 * a); }
    const lx = cx + rx + fs * 0.6;
    label(s, phone ? 'cooler gas' : 'cooler hydrogen gas', lx, gasY + fs * 0.7, 0.85 * a, C.muted, 'left');
    // a stream of photons of all wavelengths (dimmed once the dark lines are there, so the spectrum is clear)
    const sa = fade(t, T_C + 1.4, T_D, 1.0, 0.6) * a * (1 - 0.7 * smooth((t - (T_C + 24.6)) / 1.0));
    if (sa > 0) for (const p of STREAM) {
      const f = ((t - T_C) * 0.32 + p.ph) % 1;
      const q = along([src, gas, grat, [L.X(p.lam), L.sy0 - 2]], f);
      packet(s, q.x, q.y, q.ux, q.uy, p.lam, nmRGB(p.lam), 0.55 * sa * Math.sin(Math.PI * f));
    }
    // the absorbed blue-green photon, and the one given out again later
    const ab = EVENTS.find((e) => e.kind === 'abs'), re = EVENTS.find((e) => e.kind === 'reemit');
    const evY = gasY - fs * 0.9;
    if (t > ab.t - 1.6 && t < ab.t) {
      const q = along([src, gas], (t - (ab.t - 1.6)) / 1.6);
      packet(s, q.x, q.y, q.ux, q.uy, ab.lam, nmRGB(ab.lam), a);
      label(s, '486 nm', q.x + fs * 1.6, q.y, a, nmRGB(ab.lam), 'left', fs, 600);
    }
    if (t >= ab.t && t < ab.t + 1.2) D.glowDot(s, gas[0], gas[1], fs * 3.4, nmRGB(ab.lam), a * (1 - (t - ab.t) / 1.2));
    if (t >= ab.t && t < ab.t + 3.2) label(s, 'absorbed', lx, evY, fade(t, ab.t, ab.t + 3.2, 0.2, 0.6) * a, nmRGB(ab.lam), 'left', fs, 600);
    if (t >= re.t && t < re.t + 2.4) {
      const q = along([gas, [gas[0] - W * 0.3, gas[1] - H * 0.12]], (t - re.t) / 2.4);
      packet(s, q.x, q.y, q.ux, q.uy, re.lam, nmRGB(re.lam), a * (1 - smooth((t - re.t - 1.6) / 0.8)));
      label(s, phone ? 'given out' : 'given out again', lx, evY, fade(t, re.t, re.t + 2.6, 0.2, 0.6) * a, nmRGB(re.lam), 'left', fs, 600);
    }
  }

  // ---------- the spectrum strip ----------
  function continuous(s, x0, x1, y, h, a) {
    const { g } = s, gr = g.createLinearGradient(x0, 0, x1, 0);
    for (let l = 400; l <= 700; l += 10) gr.addColorStop((l - 400) / 300, `rgba(${nmRGB(l)},${a})`);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = gr; g.fillRect(x0, y, x1 - x0, h);
  }
  function lineAt(s, x, y, h, rgb, a, w) {
    if (a <= 0) return;
    const { g } = s; g.globalCompositeOperation = 'lighter';
    g.shadowColor = `rgba(${rgb},${a})`; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`; g.fillRect(x - w / 2, y, w, h); g.shadowBlur = 0;
    g.globalCompositeOperation = 'source-over';
  }
  function darkAt(s, x, y, h, a, w) { if (a <= 0) return; const { g } = s; g.fillStyle = `rgba(6,8,16,${a})`; g.fillRect(x - w / 2, y, w, h); }
  function axis(s, x0, x1, y, a) {
    const { fs } = L;
    for (const l of [400, 500, 600, 700]) {
      const x = x0 + (l - 400) / 300 * (x1 - x0);
      D.line(s, x, y, x, y + 4, C.muted, 0.6 * a, 1);
      label(s, l === 700 ? '700 nm' : String(l), l === 700 ? x + fs * 0.9 : x, y + fs * 0.95, 0.75 * a, C.muted, l === 700 ? 'right' : 'center', fs - 1);
    }
  }
  function drawStrip(s, t) {
    const a = smooth((t - 4.6) / 0.8) * (1 - smooth((t - T_D) / 0.8));
    if (a <= 0) return;
    const { g } = s, { sx0, sx1, sy0, sh, fs } = L, w = Math.max(2, (sx1 - sx0) * 0.006);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(8,10,20,${0.95 * a})`; g.fillRect(sx0, sy0, sx1 - sx0, sh);
    const cont = smooth((t - (T_C + 0.4)) / 2.0);
    if (cont > 0) continuous(s, sx0, sx1, sy0, sh, cont * a);
    g.strokeStyle = `rgba(${LEVEL_RGB},${0.45 * a})`; g.lineWidth = 1; g.strokeRect(sx0, sy0, sx1 - sx0, sh);
    axis(s, sx0, sx1, sy0 + sh, a);
    // bright lines: all four at once in part A; one by one as the photons arrive in part B
    BALMER.forEach((l, i) => {
      const x = L.X(l), ev = EVENTS.find((e) => e.kind === 'emit' && e.lam === l);
      const pa = smooth((t - 11.4 - i * 0.5) / 0.6) * (1 - smooth((t - T_B) / 0.8));
      const tArr = ev.t + TRAVEL, pb = t < T_C ? smooth((t - tArr) / 0.3) : 0;
      const flash = t > tArr && t < tArr + 1.2 ? Math.exp(-(t - tArr) * 3) : 0;
      const on = Math.max(pa, pb) * (1 - smooth((t - T_C) / 1.2));
      lineAt(s, x, sy0, sh, nmRGB(l), Math.min(1, (BAL_I[i] + 0.2) * on + flash) * a, w * (1 + flash));
      const la = (t < T_B ? pa : pb * (t < T_C ? 1 : 0)) * a;
      // on phones 410 and 434 are close: their labels lean away from each other
      const lx = L.phone && i === 3 ? x + 3 : L.phone && i === 2 ? x - 3 : x, al = L.phone && i === 3 ? 'right' : L.phone && i === 2 ? 'left' : 'center';
      if (la > 0) label(s, String(Math.round(l)), lx, sy0 - fs * 0.85, 0.85 * la, nmRGB(l), al, L.phone ? fs - 1 : fs);
      // dark lines in part C
      const tD = l === 486.1 ? T_C + 14.6 : T_C + 18.6 + i * 0.7;
      const dk = 0.88 * smooth((t - tD) / 2.5) * (t > T_C ? 1 : 0);
      darkAt(s, x, sy0, sh, dk * a, w * 1.1);
      const dl = fade(t, T_C + 24.8, T_D + 0.4, 0.6, 0.6) * a;
      if (dl > 0) label(s, String(Math.round(l)), lx, sy0 - fs * 0.85, 0.85 * dl, C.muted, al, L.phone ? fs - 1 : fs);
    });
    if (t < T_B) label(s, 'emission line spectrum of hydrogen', (sx0 + sx1) / 2, sy0 - fs * 2.2, fade(t, 12.4, T_B, 0.6, 0.6) * a, C.text, 'center', fs, 600);
    if (t > T_C + 25.4) label(s, 'absorption line spectrum', (sx0 + sx1) / 2, sy0 - fs * 2.2, fade(t, T_C + 25.4, T_D, 0.6, 0.6) * a, C.text, 'center', fs, 600);
  }

  // ---------- part D: each element's own pattern ----------
  function drawElements(s, t) {
    const a = fade(t, T_D + 0.4, END_CARD + 0.4, 1.0, 0.8); if (a <= 0) return;
    const { fs, phone, W, sy1 } = L;
    const x0 = phone ? W * 0.08 : W * 0.22, x1 = phone ? W * 0.94 : W * 0.90, top = phone ? L.uy0 + fs * 1.4 : Math.max(L.uy0, 60);
    const rowH = (sy1 - top) / 4, h = Math.min(fs * 2.0, rowH * (phone ? 0.42 : 0.55)), w = Math.max(2, (x1 - x0) * 0.005);
    const X = (l) => x0 + (l - 400) / 300 * (x1 - x0);
    const rows = [['hydrogen', BALMER.map((l, i) => [l, BAL_I[i]])], ['helium', HELIUM], ['sodium', SODIUM], ['the Sun (simplified)', null]];
    const { g } = s;
    rows.forEach(([name, lines], r) => {
      const ra = smooth((t - (T_D + 0.6 + r * 0.6)) / 0.8) * a; if (ra <= 0) return;
      const y = top + r * rowH + (phone ? fs * 0.9 : 0);
      g.fillStyle = `rgba(8,10,20,${0.95 * ra})`; g.fillRect(x0, y, x1 - x0, h);
      if (lines) lines.forEach(([l, k]) => lineAt(s, X(l), y, h, nmRGB(l), Math.min(1, k + 0.15) * ra, w));
      else {
        continuous(s, x0, x1, y, h, ra);
        for (const l of BALMER) darkAt(s, X(l), y, h, 0.88 * ra, w * 1.2);
        for (const [l] of SODIUM.slice(1, 3)) darkAt(s, X(l), y, h, 0.88 * ra, w);
      }
      g.strokeStyle = `rgba(${LEVEL_RGB},${0.45 * ra})`; g.lineWidth = 1; g.strokeRect(x0, y, x1 - x0, h);
      if (phone) label(s, name, x0, y - fs * 0.7, ra, C.text, 'left', fs, 600);
      else label(s, name, x0 - fs * 0.8, y + h / 2, ra, C.text, 'right', fs, 600);
      if (r === 3) axis(s, x0, x1, y + h, ra);
    });
    // matching lines: hydrogen's and sodium's lines line up with the Sun's dark lines
    const ma = fade(t, T_D + 6.4, END_CARD + 0.4, 0.8, 0.6) * a;
    if (ma > 0) {
      const ySun = top + 3 * rowH + (phone ? fs * 0.9 : 0);
      for (const l of BALMER) D.line(s, X(l), top + (phone ? fs * 0.9 : 0) + h, X(l), ySun, nmRGB(l), 0.55 * ma, 1, [3, 3]);
      D.line(s, X(589.3), top + 2 * rowH + (phone ? fs * 0.9 : 0) + h, X(589.3), ySun, nmRGB(589.3), 0.65 * ma, 1, [3, 3]);
    }
  }

  // ---------- end card ----------
  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 30, 18, 38)), s2 = Math.round(clamp(W / 34, 16, 32)), s3 = Math.round(clamp(W / 58, 12, 18));
    g.font = D.sans(s1, 300);
    const l1 = D.wrap(s, 'Each spectral line is one jump between energy levels', W - 48);
    let y = H * (phone ? 0.13 : 0.16);
    D.text(s, l1, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * l1.length + s2 * 0.6;
    rich(s, [['E', 'i'], [' = ', 'r'], ['hf', 'i'], [' = ', 'r'], ['hc', 'i'], [' / ', 'r'], ['λ', 'i']], W / 2, y, s2, a, C.light);
    y += s2 * 1.0;
    g.font = D.sans(s3);
    let ls = D.wrap(s, 'The photon\'s energy equals the difference between the two levels.', Math.min(W - 40, 620));
    D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s3 * 1.1;
    const items = [
      ['Emission', '255,214,140', 'An electron drops to a lower level and gives out one photon: bright lines.'],
      ['Absorption', '160,200,255', 'A photon with exactly the right energy lifts an electron: dark lines at the same wavelengths.'],
      ['A fingerprint', C.good, 'Each element has its own lines, so spectra show what stars are made of.'],
    ];
    if (phone) {
      for (const [h, rgb, txt] of items) {
        D.text(s, h, W / 2, y, s3 + 1, a, D.sans(s3 + 1, 600), rgb); y += s3 * 1.35;
        g.font = D.sans(s3); ls = D.wrap(s, txt, W - 36); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s3 * 0.8;
      }
    } else {
      const colW = Math.min(W * 0.28, 320);
      g.font = D.sans(s3);
      const wr = items.map(([, , txt]) => D.wrap(s, txt, colW));
      items.forEach(([h, rgb], i) => {
        const x = W / 2 + (i - 1) * W * 0.31;
        D.text(s, h, x, y, s3 + 2, a, D.sans(s3 + 2, 600), rgb);
        D.text(s, wr[i], x, y + s3 * 1.5, s3, 0.85 * a, D.sans(s3));
      });
      y += s3 * 1.5 + s3 * 1.3 * Math.max(...wr.map((w) => w.length)) + s3 * 1.2;
    }
    // the HL formula for hydrogen's levels
    const yh = Math.max(y, H * (phone ? 0.84 : 0.8));
    D.text(s, 'HL', W / 2, yh, s3, 0.9 * a, D.sans(s3, 700), C.force);
    rich(s, [['Hydrogen (Bohr model): ', 'sans'], ['E', 'i'], [' = −13.6 / ', 'r'], ['n', 'i'], ['2', 'p'], [' eV', 'r']], W / 2, yh + s3 * 1.5, s3 + 2, 0.85 * a, C.text);
  }

  Anim.register('spectra', {
    duration: DURATION,
    poster: 80.5,
    pauses: PAUSES,
    // score: luminous (E lydian, soft sine pad, frequent high glassy bells, shimmer)
    music: { chords: [[52, 59, 63, 68], [57, 61, 64, 68, 71], [49, 56, 61, 64], [54, 58, 61, 66]], bar: 8, pad: 'sine', cutoff: 1500, drone: 0.06,
      bells: 0.8, bellType: 'glass', bellOct: 3, shimmer: 0.6, echo: 0.4, volume: 0.32 },
    resize: layout,
    // for checking the numbers (not used by the player)
    info: {
      CAPS, PAUSES, EVENTS, LEVEL, lamNm,
      check() {
        const out = {};
        for (const [f, t] of [[3, 2], [2, 1], [4, 2], [5, 2], [6, 2], [4, 3], [3, 1]]) out[`${f}->${t}`] = { dE: +(LEVEL[f] - LEVEL[t]).toFixed(2), J: (LEVEL[f] - LEVEL[t]) * EV, nm: +lamNm(f, t).toFixed(1) };
        const rates = CAPS.map(([a, b, txt]) => { const hold = PAUSES.filter((p) => p[0] > a && p[0] < b).reduce((n, p) => n + p[1], 0); return +(txt.length / (b - a - 0.6 + hold)).toFixed(1); });
        // the grating: deviation from the straight-down beam, for each line (must grow with wavelength)
        const dev = L ? BALMER.map((l) => [l, +(Math.atan2(L.X(l) - L.cx, L.hg) * 180 / Math.PI).toFixed(1)]) : null;
        return { out, maxRate: Math.max(...rates), rates, total: DURATION + PAUSES.reduce((n, p) => n + p[1], 0), dev };
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.2);
      drawTube(s, t);
      drawDiagram(s, t, fade(t, T_B, T_D + 0.6, 1.0, 0.8));
      drawGrating(s, Math.max(fade(t, 6.0, T_B + 0.8, 0.8, 0.8), fade(t, T_C + 0.4, T_D + 0.6, 1.0, 0.8)));
      drawAbsorption(s, t);
      photonPaths(s, t);
      drawStrip(s, t);
      drawElements(s, t);
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Energy levels and spectra', 'Where the lines in a spectrum come from');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
