/* C.5 The Doppler effect: wavefronts from a moving source and a moving observer, then light from a galaxy.
   Every wavefront is a circle centred where the source was when it sent that wavefront out, with
   radius v × (time since then), worked out from the scene time alone (so seeking works).
   Numbers (checked):
   - v = 340 m/s, f = 500 Hz: λ = v/f = 340/500 = 0.68 m; period 1/500 s = 2.0 ms. In the animation one
     wavefront leaves every 0.75 s, so time is slowed down 0.75/0.002 = 375 times. One world unit = 0.68 m.
   - Moving source: u_s = 85 m/s = v/4 (85 × 3.6 = 306 km/h).
     Ahead: λ′ = (v − u_s)/f = 255/500 = 0.51 m, f′ = v/λ′ = 340/0.51 = 666.7 ≈ 667 Hz = f v/(v − u_s) = 500 × 340/255.
     Behind: λ′ = (v + u_s)/f = 425/500 = 0.85 m, f′ = 340/0.85 = 400 Hz = 500 × 340/425.
   - Moving observer, u_o = 85 m/s towards a still 500 Hz siren: λ = 0.68 m unchanged; the waves pass the
     driver at 340 + 85 = 425 m/s, so f′ = 425/0.68 = 625 Hz = f (v + u_o)/v = 500 × 425/340.
     (A moving source at the same speed gives 667 Hz: the two cases differ for sound.)
   - Light: a galaxy receding at 6000 km/s = 6.0 × 10⁶ m/s; v/c = 6.0e6/3.00e8 = 0.020 (2%).
     Hα 656.3 nm: Δλ ≈ 0.020 × 656.3 = 13.1 nm → 669.4 nm. Hβ 486.1 → 495.8, Hγ 434.0 → 442.7, Hδ 410.2 → 418.4
     (shifts 9.7, 8.7, 8.2 nm: the same fraction, so smaller for the blue lines). Blueshift at the same speed:
     656.3 × 0.980 = 643.2 nm. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- the physics (lengths in wavelengths of the still source, λ = 0.68 m; time in scene seconds) ----------
  const P = 0.75, V = 1 / P, U = V / 4;          // one wavefront every 0.75 s; the wave moves 1 λ per period; source or observer at v/4
  const F = 500, VS = 340, US = 85;              // Hz, m/s, m/s
  const F_AHEAD = F * VS / (VS - US), F_BEHIND = F * VS / (VS + US), F_OBS = F * (VS + US) / VS;   // 666.7, 400, 625
  const XA = 7.3, XB = -7.6;                     // observers A (right) and B (left)
  const XS_C = -5.0, XP_C = -7.6;                // part C: the siren and the pedestrian
  const BALMER = [410.2, 434.0, 486.1, 656.3], Z_GAL = 6.0e6 / 3.00e8;

  // the picture can be "frozen" inside the story (to measure wavelengths): tau = the wave time
  const clock = (freezes) => (t) => { let tau = t; for (const [a, b] of freezes) { if (t >= b) tau -= b - a; else if (t > a) tau -= t - a; } return tau; };
  const tauA = clock([[11.0, 15.0]]), tauB = clock([[47.6, 58.0]]), tauC = clock([[76.6, 80.6]]);
  const frozen = (t) => (t > 11.0 && t < 15.0) || (t > 47.6 && t < 58.0) || (t > 76.6 && t < 80.6);

  // part B: the car passes A at t = 69.2 (wave time 58.8)
  const T_PASS_TAU = 58.8;
  const xsB = (tau) => XA + U * (tau - T_PASS_TAU);
  // part C: the driver starts just off the right edge
  const C_X0 = 8.6, C_T0 = 75.0;
  const xcC = (tau) => C_X0 - U * (tau - C_T0);

  // timeline of the four parts
  const A_IN = 4.4, A_OUT = 20.8, B_IN = 21.0, B_OUT = 74.8, C_IN = 75.0, C_OUT = 104.0, D_IN = 104.2, END_CARD = 140.8, DURATION = 154;

  // ---------- captions ----------
  const CAPS = [
    [5.0, 10.0, 'A racing car\'s engine gives out a steady note of 500 Hz. Each circle is a wavefront: a new one leaves the car every period.'],
    [10.2, 15.2, 'Sound travels through the still air at v = 340 m s⁻¹, so the wavefronts are λ = v ÷ f = 340 ÷ 500 = 0.68 m apart. (Time is slowed down 375 times.)'],
    [15.4, 20.4, 'Observers A and B each meet one wavefront every period, so both hear the car\'s true note: 500 Hz.'],
    [21.6, 26.6, 'Now the car drives to the right at 85 m s⁻¹ (306 km/h), a quarter of the speed of sound.'],
    [26.8, 31.8, 'Each wavefront is a circle centred where the car was when it sent that wavefront out (the orange dots).'],
    [32.0, 37.0, 'Predict: who hears the higher note, A (ahead of the car) or B (behind it)?'],
    [37.2, 42.2, 'Ahead of the car the wavefronts are squashed together. They still travel at 340 m s⁻¹, so more of them reach A each second.'],
    [42.4, 47.4, 'So A hears a higher note than 500 Hz. Behind the car the wavefronts are spread out, so B hears a lower note.'],
    [47.6, 52.6, '(HL) Ahead: λ′ = (340 − 85) ÷ 500 = 0.51 m, so A hears f′ = v ÷ λ′ = 340 ÷ 0.51 = 667 Hz.'],
    [52.8, 57.8, '(HL) Behind: λ′ = (340 + 85) ÷ 500 = 0.85 m, so B hears f′ = 340 ÷ 0.85 = 400 Hz.'],
    [58.0, 63.0, '(HL) The moving-source equation gives the same answers in one step: − when the source approaches, + when it moves away.'],
    [63.2, 68.2, 'While the car approaches at a steady speed, A hears a steady 667 Hz: the note doesn\'t keep rising. Predict: what will A hear as it goes past?'],
    [68.4, 74.4, 'It drops suddenly, from 667 Hz to 400 Hz, as A ends up behind the car (it is this sudden only right on the car\'s path). The car\'s own note never changes.'],
    [75.8, 80.8, 'Now the source stays still: a siren sounding 500 Hz. Its wavefronts are evenly spaced, 0.68 m apart in every direction.'],
    [81.0, 86.0, 'The racing driver is now the observer, driving towards the siren at 85 m s⁻¹. A pedestrian stands still on the other side.'],
    [86.2, 91.2, 'Predict: who meets the wavefronts more often, the driver or the pedestrian?'],
    [91.4, 97.4, 'The driver. The wavelength is still 0.68 m, but the waves pass the driver faster, so more of them reach the driver each second: a higher note.'],
    [97.6, 103.6, '(HL) Relative to the driver the waves move at 340 + 85 = 425 m s⁻¹, so f′ = 425 ÷ 0.68 = 625 Hz. A source moving at 85 m s⁻¹ gave 667 Hz: for sound, it matters which one moves through the air.'],
    [104.4, 109.4, 'Light shows the Doppler effect too. This galaxy is moving away from us at 6000 km s⁻¹, 2% of the speed of light.'],
    [109.6, 114.6, 'Hydrogen gives out and absorbs light only at exact wavelengths. Measured in the laboratory, its red line is at 656.3 nm.'],
    [114.8, 119.8, 'In the galaxy\'s light the whole pattern of lines is shifted towards the red end of the spectrum: a redshift.'],
    [120.0, 125.0, 'Δλ/λ ≈ v/c (because v is much less than c) = (6.0 × 10⁶) ÷ (3.00 × 10⁸) = 0.020, so the red line moves 13.1 nm, to 669.4 nm.'],
    [125.2, 130.2, 'Every line moves by the same fraction of its wavelength. The light still travels at c: only its wavelength and frequency change.'],
    [130.4, 135.4, 'A galaxy moving towards us, such as the nearby Andromeda galaxy, gives a blueshift instead: its lines move to shorter wavelengths. (Shown here at the same speed, to compare.)'],
    [135.6, 140.6, 'Almost every distant galaxy is redshifted, and the more distant the galaxy, the bigger the redshift: evidence that the universe is expanding.'],
  ];

  // ---------- colours ----------
  const WAVE = C.vel, SRC = C.force, OBS = C.good, HLC = '255,150,70';

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    // phone layout when the stage is taller than wide: that is exactly when the CSS puts the buttons below the picture
    const W = s.W, H = s.H, phone = H > W;
    const capFs = clamp(W / 44, 15, 25), capTop = H - capFs * (phone ? 6.2 : 5.0);
    const fs = phone ? 10 : Math.round(clamp(W / 80, 11, 16));
    const top = phone ? 6 : Math.max(46, H * 0.07);
    const sc = W / 16.6;                                              // pixels per wavelength (0.68 m)
    const axisY = top + (capTop - top) * 0.58;
    const carL = Math.max(1.8 * sc, 52), pH = Math.max(0.3 * carL, 22);
    const road = axisY + 0.155 * carL;
    L = { W, H, phone, capFs, capTop, fs, top, sc, axisY, carL, pH, road,
      readY: road - pH - fs * (phone ? 4.6 : 3.0) };                    // the observers' readouts, above their heads
  }
  const X = (x) => L.W / 2 + x * L.sc;

  // ---------- text with equations: tokens [text, style] or ['frac', top, bottom]; styles 'i' italic, 'r' upright, 's' subscript, 'sans' ----------
  const tokFont = (st, size) => st === 's' ? D.serif(Math.round(size * 0.68)) : st === 'i' ? D.serif(size) : st === 'r' ? D.serif(size, false)
    : st === 'b' ? D.sans(Math.round(size * 0.86), 600) : D.sans(Math.round(size * 0.86));
  function tokW(g, toks, size) {
    let w = 0;
    for (const tk of toks) {
      if (tk[0] === 'frac') w += Math.max(tokW(g, tk[1], size * 0.82), tokW(g, tk[2], size * 0.82)) + size * 0.3;
      else { g.font = tokFont(tk[1], size); w += g.measureText(tk[0]).width; }
    }
    return w;
  }
  function eq(s, toks, x, y, size, a, rgb = C.text, align = 'center') {
    const { g } = s; if (a <= 0) return 0;
    const total = tokW(g, toks, size);
    const x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 8; g.fillStyle = `rgba(${rgb},${a})`;
    const run = (list, sz, yy, q) => {
      for (const tk of list) {
        if (tk[0] === 'frac') {
          const f2 = sz * 0.82, wn = tokW(g, tk[1], f2), wd = tokW(g, tk[2], f2), w = Math.max(wn, wd) + sz * 0.3;
          run(tk[1], f2, yy - sz * 0.56, q + (w - wn) / 2);
          run(tk[2], f2, yy + sz * 0.6, q + (w - wd) / 2);
          g.fillRect(q + sz * 0.08, yy - Math.max(0.5, sz * 0.035), w - sz * 0.16, Math.max(1, sz * 0.07));
          q += w;
        } else {
          g.font = tokFont(tk[1], sz); g.fillText(tk[0], q, tk[1] === 's' ? yy + sz * 0.28 : yy); q += g.measureText(tk[0]).width;
        }
      }
    };
    run(toks, size, y, x0);
    g.shadowBlur = 0;
    return total;
  }
  const EQ_SRC = [['f′', 'i'], [' = ', 'r'], ['f', 'i'], [' ', 'r'], ['frac', [['v', 'i']], [['v', 'i'], [' ± ', 'r'], ['u', 'i'], ['s', 's']]]];
  const EQ_OBS = [['f′', 'i'], [' = ', 'r'], ['f', 'i'], [' ', 'r'], ['frac', [['v', 'i'], [' ± ', 'r'], ['u', 'i'], ['o', 's']], [['v', 'i']]]];
  const EQ_LIGHT = [['frac', [['Δ', 'r'], ['f', 'i']], [['f', 'i']]], [' = ', 'r'], ['frac', [['Δ', 'r'], ['λ', 'i']], [['λ', 'i']]], [' ≈ ', 'r'], ['frac', [['v', 'i']], [['c', 'i']]]];

  // ---------- wavefronts ----------
  // list of [centre x, radius, age] in world units; drawn as glowing circles, fainter as they spread
  function drawFronts(s, fronts) {
    const { g } = s, { sc, axisY, phone } = L;
    g.globalCompositeOperation = 'lighter';
    for (const [cx, r, age] of fronts) {
      if (r <= 0) continue;
      const a = Math.min(1, age / 0.12) * clamp(1.25 / (1 + r / 5), 0.18, 1);
      g.beginPath(); g.arc(X(cx), axisY, r * sc, 0, Math.PI * 2);
      g.strokeStyle = `rgba(${WAVE},${0.12 * a})`; g.lineWidth = phone ? 4 : 7; g.stroke();
      g.strokeStyle = `rgba(${WAVE},${0.85 * a})`; g.lineWidth = phone ? 1.2 : 1.7; g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
  }
  // farthest distance (world units) from a centre on the axis to a corner of the picture
  const farR = (cx) => Math.hypot(Math.max(Math.abs(X(cx)), Math.abs(L.W - X(cx))), Math.max(L.axisY, L.H - L.axisY)) / L.sc;
  // fronts from a source with position xs(te), sending fronts at te = t0 + kP (k ≥ kMin)
  function frontsOf(tau, xs, t0 = 0, kMin = -Infinity) {
    const out = [], kMax = Math.floor((tau - t0) / P + 1e-9);
    for (let k = kMax; k >= Math.max(kMin, kMax - 90); k--) {
      const te = t0 + k * P, r = V * (tau - te), c = xs(te);
      if (r > farR(c)) break;
      out.push([c, r, tau - te, te]);
    }
    return out;
  }

  // ---------- drawings: a racing car, a person, a siren ----------
  function car(s, x, y, Lp, dir, rgb, a, wheelAng) {
    if (a <= 0) return;
    const { g } = s;
    const Pt = (u, v) => [x + dir * (u + 0.1) * Lp, y - (v - 0.07) * Lp];   // (x, y) = the engine, where the sound comes from
    const poly = (pts, fill, stroke) => {
      g.beginPath(); pts.forEach(([u, v], i) => { const [px, py] = Pt(u, v); if (i) g.lineTo(px, py); else g.moveTo(px, py); }); g.closePath();
      if (fill) { g.fillStyle = fill; g.fill(); }
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = Math.max(1, Lp * 0.008); g.stroke(); }
    };
    g.globalCompositeOperation = 'source-over';
    g.shadowColor = `rgba(${rgb},${0.6 * a})`; g.shadowBlur = 14;
    const [gx0, gy0] = Pt(0, 0.19), [, gy1] = Pt(0, 0.0);
    const gr = g.createLinearGradient(gx0, gy0, gx0, gy1);
    gr.addColorStop(0, `rgba(255,240,215,${a})`); gr.addColorStop(0.35, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(120,60,20,${a})`);
    // rear wing and its stalk, body, front wing
    poly([[-0.53, 0.165], [-0.42, 0.165], [-0.42, 0.225], [-0.53, 0.225]], gr, `rgba(255,255,255,${0.3 * a})`);
    poly([[-0.48, 0.11], [-0.45, 0.11], [-0.45, 0.17], [-0.48, 0.17]], `rgba(60,64,80,${a})`);
    poly([[-0.47, 0.03], [-0.47, 0.115], [-0.30, 0.125], [-0.13, 0.14], [-0.04, 0.195], [0.05, 0.155], [0.14, 0.115], [0.42, 0.065],
      [0.5, 0.04], [0.5, 0.022], [0.42, 0.015], [-0.2, 0.02]], gr, `rgba(255,255,255,${0.35 * a})`);
    poly([[0.37, -0.005], [0.53, -0.005], [0.53, 0.022], [0.40, 0.022]], gr, `rgba(255,255,255,${0.3 * a})`);
    g.shadowBlur = 0;
    // the driver's helmet
    const [hx, hy] = Pt(0.035, 0.165);
    g.fillStyle = `rgba(250,250,255,${a})`; g.beginPath(); g.arc(hx, hy, Lp * 0.036, 0, 7); g.fill();
    g.fillStyle = `rgba(30,40,70,${a})`; g.beginPath(); g.arc(hx + dir * Lp * 0.012, hy - Lp * 0.004, Lp * 0.02, -0.9, 0.9); g.fill();
    // wheels (they turn as the car moves)
    for (const [u, r] of [[-0.3, 0.085], [0.28, 0.075]]) {
      const [wx, wy] = Pt(u, 0.0), R = r * Lp;
      g.fillStyle = `rgba(18,20,28,${a})`; g.beginPath(); g.arc(wx, wy, R, 0, 7); g.fill();
      g.strokeStyle = `rgba(150,158,180,${a})`; g.lineWidth = Math.max(1, R * 0.16); g.beginPath(); g.arc(wx, wy, R * 0.55, 0, 7); g.stroke();
      g.lineWidth = Math.max(0.8, R * 0.1);
      for (let k = 0; k < 3; k++) {
        const an = wheelAng * (0.08 / r) + k * 2.094;
        g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + Math.cos(an) * R * 0.55, wy + Math.sin(an) * R * 0.55); g.stroke();
      }
    }
  }
  function person(s, xpx, road, h, rgb, a) {
    if (a <= 0) return 0;
    const { g } = s, hr = h * 0.13, lw = Math.max(1.5, h * 0.075);
    const hy = road - h + hr, sh = hy + hr + h * 0.1, hip = road - h * 0.4;
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = g.fillStyle = `rgba(${rgb},${a})`; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
    g.shadowColor = `rgba(${rgb},${0.7 * a})`; g.shadowBlur = 8;
    g.beginPath(); g.arc(xpx, hy, hr, 0, 7); g.fill();
    g.beginPath();
    g.moveTo(xpx, hy + hr + lw * 0.5); g.lineTo(xpx, hip);
    g.moveTo(xpx - h * 0.13, road); g.lineTo(xpx, hip); g.lineTo(xpx + h * 0.13, road);
    g.moveTo(xpx - h * 0.15, sh + h * 0.2); g.lineTo(xpx, sh); g.lineTo(xpx + h * 0.15, sh + h * 0.2);
    g.stroke(); g.shadowBlur = 0;
    return hy;
  }
  function siren(s, xpx, y, size, a) {
    if (a <= 0) return;
    const { g } = s;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(120,128,150,${a})`; g.fillRect(xpx - size * 0.05, y + size * 0.2, size * 0.1, L.road - y - size * 0.2);
    g.shadowColor = `rgba(${SRC},${0.7 * a})`; g.shadowBlur = 12;
    g.fillStyle = `rgba(${SRC},${a})`;
    g.beginPath(); g.roundRect(xpx - size * 0.32, y - size * 0.22, size * 0.36, size * 0.44, size * 0.06); g.fill();
    g.beginPath(); g.moveTo(xpx + size * 0.02, y - size * 0.13); g.lineTo(xpx + size * 0.34, y - size * 0.32);
    g.lineTo(xpx + size * 0.34, y + size * 0.32); g.lineTo(xpx + size * 0.02, y + size * 0.13); g.closePath(); g.fill();
    g.shadowBlur = 0;
    g.fillStyle = `rgba(60,30,10,${0.6 * a})`; g.beginPath(); g.ellipse(xpx + size * 0.34, y, size * 0.05, size * 0.3, 0, 0, 7); g.fill();
  }
  function road(s, a) {
    const { g } = s, { road: ry, W } = L;
    D.line(s, 0, ry, W, ry, '120,130,170', 0.5 * a, 1.5);
    for (let x = 12; x < W; x += 34) D.line(s, x, ry + 5, x + 14, ry + 5, '120,130,170', 0.18 * a, 1);
  }
  // two lines of text above an observer, kept inside the picture
  function readout(s, xpx, y, l1, l2, rgb, a) {
    if (a <= 0) return;
    const { g } = s, { fs, W } = L, f2 = fs + 2;
    g.font = D.sans(fs); const w1 = g.measureText(l1).width; g.font = D.sans(f2, 600); const w2 = g.measureText(l2).width;
    const w = Math.max(w1, w2), x = clamp(xpx, 6 + w / 2, W - 6 - w / 2);
    D.text(s, l1, x, y, fs, 0.8 * a, D.sans(fs), C.muted);
    D.text(s, l2, x, y + fs * 1.4, f2, a, D.sans(f2, 600), rgb);
  }
  const flash = (s, x, y, age, a) => {
    if (age < 0 || age > 0.45 || a <= 0) return;
    const { g } = s, r = L.pH * 0.2 + age * L.sc * 0.9, al = a * (1 - age / 0.45);
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = `rgba(${OBS},${0.8 * al})`; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
    g.globalCompositeOperation = 'source-over';
    D.glowDot(s, x, y, L.pH * 0.45, OBS, 0.5 * al);
  };
  // a double-headed measuring arrow along the axis between two wavefronts
  function bracket(s, xa, xb, label, a) {
    if (a <= 0) return;
    const { g } = s, y = L.axisY, h = Math.max(4, L.fs * 0.45), x1 = X(Math.min(xa, xb)), x2 = X(Math.max(xa, xb));
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = g.fillStyle = `rgba(${C.light},${a})`; g.lineWidth = 1.8; g.shadowColor = `rgba(${C.light},${0.7 * a})`; g.shadowBlur = 8;
    g.beginPath(); g.moveTo(x1 + h, y); g.lineTo(x2 - h, y); g.stroke();
    for (const [px, d] of [[x1, 1], [x2, -1]]) {
      g.beginPath(); g.moveTo(px, y); g.lineTo(px + d * h * 1.4, y - h * 0.8); g.lineTo(px + d * h * 1.4, y + h * 0.8); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(px, y - h * 1.6); g.lineTo(px, y + h * 1.6); g.stroke();
    }
    g.shadowBlur = 0;
    D.text(s, label, (x1 + x2) / 2, y - L.fs * 1.5, L.fs + 1, a, D.sans(L.fs + 1, 600), C.light);
  }
  // the pair of neighbouring wavefronts on one side of the axis whose middle is closest to a target point
  function pairNear(fronts, side, target, minX, maxX) {
    const pos = fronts.map((f) => [f[3], f[0] + side * f[1]]).filter(([, x]) => x > minX && x < maxX).sort((p, q) => p[0] - q[0]);
    let best = null;
    for (let i = 0; i + 1 < pos.length; i++) {
      if (Math.abs(pos[i + 1][0] - pos[i][0] - P) > 1e-6) continue;
      const m = (pos[i][1] + pos[i + 1][1]) / 2;
      if (!best || Math.abs(m - target) < Math.abs(best[2] - target)) best = [pos[i][1], pos[i + 1][1], m];
    }
    return best;
  }
  function velArrow(s, xpx, dir, label, a) {
    if (a <= 0) return;
    const y = L.axisY - L.carL * 0.32 - L.fs * 0.4, len = Math.max(L.carL * 0.55, 36);
    D.arrow(s, xpx - dir * len * 0.3, y, xpx + dir * len * 0.7, y, C.white, 0.85 * a, '', { width: 2, head: 9, blur: 6 });
    D.text(s, label, xpx + dir * len * 0.2, y - L.fs * 1.1, L.fs, 0.85 * a, D.sans(L.fs), C.white);
  }
  function frozenTag(s, t, a) {
    if (!frozen(t) || a <= 0) return;
    D.text(s, 'picture frozen for measuring',L.W / 2, L.top + L.fs * 0.6, L.fs, 0.75 * a, D.sans(L.fs, 600), C.light);
  }
  // an equation panel (HL) at the top centre
  function panel(s, title, rows, a) {
    if (a <= 0) return;
    const { g } = s, { W, phone, top } = L, size = phone ? 12 : Math.round(clamp(W / 54, 13, 22));
    const lh = size * 2.45, pad = size * 0.8;
    const ws = rows.map((r) => tokW(g, r, size));
    g.font = D.sans(Math.round(size * 0.8), 600); const tw = g.measureText(title).width + size * 2.6;
    const w = Math.min(W - 12, Math.max(tw, ...ws) + pad * 2), h = size * 1.6 + rows.length * lh + pad * 0.4;
    const x0 = W / 2 - w / 2, y0 = top + (phone ? 0 : size * 0.2);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(12,16,36,${0.9 * a})`; g.strokeStyle = `rgba(${HLC},${0.7 * a})`; g.lineWidth = 1.2;
    g.beginPath(); g.roundRect(x0, y0, w, h, 10); g.fill(); g.stroke();
    const ty = y0 + size * 0.95, tagW = size * 1.9;
    g.fillStyle = `rgba(${HLC},${a})`; g.beginPath(); g.roundRect(x0 + pad, ty - size * 0.55, tagW, size * 1.1, size * 0.3); g.fill();
    D.text(s, 'HL', x0 + pad + tagW / 2, ty, size * 0.78, a, D.sans(Math.round(size * 0.78), 700), '30,15,5');
    D.text(s, title, x0 + pad + tagW + size * 0.5, ty, size * 0.8, 0.9 * a, D.sans(Math.round(size * 0.8), 600), HLC, 'left');
    rows.forEach((r, i) => eq(s, r, x0 + pad, y0 + size * 1.6 + lh * (i + 0.5) + pad * 0.2, size, a, C.text, 'left'));
  }
  // the colour key, only where it can't reach the buttons over the top of the picture (the labels explain the colours anyway)
  const legend = (s, items, a) => { if (L.W >= 700) D.legend(s, items, a); };
  // a small label, kept inside the picture
  const label = (s, txt, x, y, a, rgb = C.muted, w = 400) => {
    if (a <= 0) return;
    s.g.font = D.sans(L.fs, w); const hw = s.g.measureText(txt).width / 2;
    D.text(s, txt, clamp(x, 6 + hw, L.W - 6 - hw), y, L.fs, a, D.sans(L.fs, w), rgb);
  };
  const fmtHz = (f) => `${Math.round(f)} Hz`;

  // ---------- part A: the car stands still ----------
  function partA(s, t, a) {
    const tau = tauA(t), { axisY, carL, pH, road: ry, fs } = L;
    const fronts = frontsOf(tau, () => 0, 5.0, 0);
    drawFronts(s, fronts);
    road(s, a);
    // a glow at the engine as each wavefront leaves
    if (fronts.length) D.glowDot(s, X(0), axisY, L.sc * 0.55, SRC, 0.55 * clamp(1 - fronts[0][2] / 0.3, 0, 1));
    car(s, X(0), axisY, carL, 1, SRC, a, 0);
    label(s, 'source', X(0), ry + fs * 1.2, 0.8 * a * smooth((t - 5) / 0.8), SRC, 600);
    const hear = smooth((t - 15.4) / 0.6);
    for (const [xo, nm] of [[XA, 'A'], [XB, 'B']]) {
      const hy = person(s, X(xo), ry, pH, OBS, a);
      label(s, nm, X(xo), ry + fs * 1.2, a, OBS, 700);
      // the newest wavefront that has already reached this observer
      const last = fronts.filter((f) => f[1] >= Math.abs(xo)).sort((p, q) => p[1] - q[1])[0];
      if (last) flash(s, X(xo), hy, (last[1] - Math.abs(xo)) / V, a);
      readout(s, X(xo), L.readY, `${nm} hears`, fmtHz(F), OBS, a * hear);
    }
    const br = fade(t, 10.6, 15.2, 0.6, 0.5);                      // only while the picture is frozen
    if (br > 0) { const p = pairNear(fronts, 1, 3.6, 1.2, XA - 0.4); if (p) bracket(s, p[0], p[1], 'λ = 0.68 m', a * br); }
    frozenTag(s, t, a);
    legend(s, [['line', WAVE, 'wavefront'], ['dot', SRC, 'source (the car)'], ['dot', OBS, 'observer']], a);
  }

  // ---------- part B: the car moves to the right ----------
  // the latest wavefront to reach a still observer at xo: [time since it arrived, was the source approaching?]
  function lastArrivalB(tau, xo) {
    const kMax = Math.floor(tau / P);
    for (let k = kMax; k > kMax - 200; k--) {
      const te = k * P, xs = xsB(te), ta = te + Math.abs(xo - xs) / V;
      if (ta <= tau) return [tau - ta, xs < xo];       // the car moves to the right, so it was approaching if it was to the left
    }
    return [99, false];
  }
  function partB(s, t, a) {
    const tau = tauB(t), { axisY, carL, pH, road: ry, fs, sc } = L, xs = xsB(tau);
    const fronts = frontsOf(tau, xsB);
    drawFronts(s, fronts);
    road(s, a);
    // where the car was when it sent out each recent wavefront
    const dotsA = a * smooth((t - 26.8) / 0.8);
    if (dotsA > 0) for (const [cx, , age] of fronts) if (age < 7) D.glowDot(s, X(cx), axisY, Math.max(5, sc * 0.13), SRC, dotsA * (1 - age / 7) * 0.9);
    if (fronts.length) D.glowDot(s, X(xs), axisY, sc * 0.55, SRC, 0.5 * clamp(1 - fronts[0][2] / 0.3, 0, 1));
    car(s, X(xs), axisY, carL, 1, SRC, a, X(xs) / (0.08 * carL));
    const nearA = smooth((Math.abs(xs - XA) - 1.8) / 1.0);
    velArrow(s, X(xs), 1, '85 m s⁻¹', a * fade(t, 21.6, 74.4) * nearA * (1 - fade(t, 58.0, 63.2, 0.6, 0.6)));   // hidden under the HL panel
    label(s, 'source', X(xs), ry + fs * 1.2, 0.8 * a * fade(t, 21.0, 32.0) , SRC, 600);
    // the observers
    for (const [xo, nm] of [[XA, 'A'], [XB, 'B']]) {
      const hy = person(s, X(xo), ry, pH, OBS, a);
      label(s, nm, X(xo), ry + fs * 1.2, a, OBS, 700);
      const [age, approaching] = lastArrivalB(tau, xo);
      flash(s, X(xo), hy, age, a);
      let txt = '?';
      if (nm === 'A') txt = t < 42.4 ? '?' : t < 47.6 ? 'higher than 500 Hz' : fmtHz(approaching ? F_AHEAD : F_BEHIND);
      else txt = t < 42.4 ? '?' : t < 52.8 ? 'lower than 500 Hz' : fmtHz(F_BEHIND);
      readout(s, X(xo), L.readY, `${nm} hears`, txt, OBS, a * smooth((t - 32.0) / 0.6));
    }
    // measuring the wavelengths while the picture is frozen
    const half = carL / sc / 2;
    const bA = fade(t, 47.8, 58.0, 0.6, 0.5), bB = fade(t, 53.0, 58.0, 0.6, 0.5);
    if (bA > 0) { const p = pairNear(fronts, 1, (xs + half + XA) / 2, xs + half + 0.2, XA - 0.3); if (p) bracket(s, p[0], p[1], '0.51 m', a * bA); }
    if (bB > 0) { const p = pairNear(fronts, -1, (xs - half + XB) / 2, XB + 0.3, xs - half - 0.2); if (p) bracket(s, p[0], p[1], '0.85 m', a * bB); }
    frozenTag(s, t, a);
    legend(s, [['line', WAVE, 'wavefront'], ['dot', SRC, 'source, and where it was when it sent each wavefront'], ['dot', OBS, 'observer']], a);
    const pa = fade(t, 58.0, 63.2, 0.6, 0.6);
    panel(s, 'moving source', [
      EQ_SRC,
      [['A, ahead (−):  ', 'sans'], ['f′', 'i'], [' = 500 × ', 'r'], ['frac', [['340', 'r']], [['340 − 85', 'r']]], [' = 667 Hz', 'r']],
      [['B, behind (+):  ', 'sans'], ['f′', 'i'], [' = 500 × ', 'r'], ['frac', [['340', 'r']], [['340 + 85', 'r']]], [' = 400 Hz', 'r']],
    ], a * pa);
  }

  // ---------- part C: the source is still and the driver moves ----------
  function partC(s, t, a) {
    const tau = tauC(t), { axisY, carL, pH, road: ry, fs } = L, xc = xcC(tau);
    const fronts = frontsOf(tau, () => XS_C);
    drawFronts(s, fronts);
    road(s, a);
    if (fronts.length) D.glowDot(s, X(XS_C), axisY, L.sc * 0.5, SRC, 0.5 * clamp(1 - fronts[0][2] / 0.3, 0, 1));
    siren(s, X(XS_C), axisY, Math.max(L.sc * 0.9, 24), a);
    label(s, L.phone ? 'siren' : 'source (siren)', X(XS_C), ry + fs * 1.2, 0.85 * a, SRC, 600);
    // the pedestrian, standing still
    const hy = person(s, X(XP_C), ry, pH, OBS, a);
    const who = L.phone ? 'person' : 'pedestrian';                  // short on phones, so it doesn't touch the siren's label
    label(s, who, X(XP_C), ry + fs * 1.2, 0.85 * a * smooth((t - 81.0) / 0.6), OBS, 600);
    const kP = Math.floor((tau - Math.abs(XP_C - XS_C) / V) / P), taP = kP * P + Math.abs(XP_C - XS_C) / V;
    flash(s, X(XP_C), hy, tau - taP, a);
    readout(s, X(XP_C), L.readY, `${who} hears`, fmtHz(F), OBS, a * smooth((t - 81.0) / 0.6));
    // the driver, moving left towards the siren: meets the wavefront sent at te when xc(t) − xs = v (t − te)
    car(s, X(xc), axisY, carL, -1, OBS, a, X(xc) / (0.08 * carL));
    label(s, 'driver (observer)', X(xc), ry + fs * 1.2, 0.85 * a * smooth((t - 81.0) / 0.6), OBS, 600);
    const kEst = Math.floor(((V + U) * tau - (C_X0 + U * C_T0 - XS_C)) / (V * P)) + 2;
    let ageD = 99;
    for (let k = kEst; k > kEst - 8; k--) {
      const tm = (C_X0 + U * C_T0 - XS_C + V * k * P) / (V + U);
      if (tm <= tau) { ageD = tau - tm; break; }
    }
    flash(s, X(xc), axisY - carL * 0.1, ageD, a);
    velArrow(s, X(xc), -1, '85 m s⁻¹', a * fade(t, 81.0, 103.8) * (1 - fade(t, 97.6, 103.8, 0.6, 0.6)));
    // the driver's readout goes under the car, clear of the HL panel at the top
    readout(s, X(xc), ry + fs * 2.6, 'driver hears', t < 91.4 ? '?' : fmtHz(F_OBS), OBS, a * smooth((t - 86.2) / 0.6));
    const br = fade(t, 76.2, 80.8, 0.6, 0.5);
    if (br > 0) { const p = pairNear(fronts, 1, 0.5, XS_C + 1.0, xc - carL / L.sc / 2 - 0.3); if (p) bracket(s, p[0], p[1], 'λ = 0.68 m', a * br); }
    frozenTag(s, t, a);
    legend(s, [['line', WAVE, 'wavefront'], ['dot', SRC, 'source (a still siren)'], ['dot', OBS, 'observers']], a);
    panel(s, 'moving observer', [
      EQ_OBS,
      [['driver, towards (+):  ', 'sans'], ['f′', 'i'], [' = 500 × ', 'r'], ['frac', [['340 + 85', 'r']], [['340', 'r']]], [' = 625 Hz', 'r']],
      [['(a source moving towards you at 85 m s⁻¹ gave 667 Hz)', 'sans']],
    ], a * fade(t, 97.6, 103.8, 0.6, 0.6));
  }

  // ---------- part D: light from a galaxy ----------
  const STARS = (() => {
    let seed = 52026; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const out = [];
    for (let i = 0; i < 760; i++) {
      const arm = i % 2, r = Math.pow(rnd(), 0.75), th = arm * Math.PI + r * 3.4 * Math.PI + (rnd() - 0.5) * 0.7 * (1 - r * 0.4);
      const sp = (rnd() - 0.5) * 0.08;
      out.push([(r + sp) * Math.cos(th), (r + sp) * Math.sin(th), 0.35 + 0.65 * rnd(), r]);
    }
    return out;
  })();
  const zAt = (t) => Z_GAL * (smooth((t - 115.2) / 2) - 2 * smooth((t - 130.8) / 2) + 2 * smooth((t - 136.0) / 2));
  function wlRGB(w) {
    let r = 0, g = 0, b = 0;
    if (w < 440) { r = (440 - w) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; } else if (w < 510) { g = 1; b = (510 - w) / 20; }
    else if (w < 580) { r = (w - 510) / 70; g = 1; } else if (w < 645) { r = 1; g = (645 - w) / 65; } else r = 1;
    const k = w < 420 ? 0.35 + 0.65 * (w - 380) / 40 : w > 680 ? 0.35 + 0.65 * (720 - w) / 40 : 1;
    return [Math.round(255 * r * k), Math.round(255 * g * k), Math.round(255 * b * k)];
  }
  function partD(s, t, a) {
    const { g } = s, { W, phone, fs, top, capTop } = L, z = zAt(t), outer = g.globalAlpha;
    const barH = clamp(L.H * 0.06, 16, 40);
    // phones: room for captions of up to five lines below the spectra
    const specH = fs * 9.6 + 2 * barH, specTop = (phone ? L.H - L.capFs * 7.6 : capTop) - specH - fs * 0.4;
    // the galaxy and us
    const gy = (top + specTop) / 2 + fs * 0.3, gx = W * (phone ? 0.6 : 0.66), gR = Math.min(W * 0.14, (specTop - top) * 0.36);
    const ex = W * (phone ? 0.09 : 0.12);
    g.globalAlpha = outer * a;
    D.line(s, gx - gR * 1.05, gy, ex + 16, gy, '255,214,102', 0.45, 1.2, [5, 6]);
    D.arrow(s, ex + 60, gy, ex + 18, gy, C.light, 0.6, '', { width: 1.4, head: 8, blur: 4 });
    label(s, 'light', (ex + gx - gR) / 2, gy - fs * 0.9, 0.8 * a, C.light);
    D.glowDot(s, ex, gy, Math.max(14, fs * 1.6), '90,150,255', a);
    label(s, 'us', ex, gy + fs * 1.6, 0.9 * a, C.text, 600);
    // two different galaxies: the one moving away, and (for the blueshift) another one moving towards us
    const w2 = smooth((t - 130.8) / 1.2) * (1 - smooth((t - 136.0) / 1.2));
    g.globalCompositeOperation = 'lighter';
    for (const [tilt, sense, wt, big, flat] of [[0.45, 1, 1 - w2, 1, 0.42], [-0.75, -1, w2, 1.12, 0.55]]) {
      if (wt <= 0) continue;
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      for (const [x, y0, br, r] of STARS) {
        const y = sense * y0, px = gx + (x * ct - y * flat * st) * gR * big, py = gy + (x * st + y * flat * ct) * gR * 0.9 * big;
        const warm = 1 - r;
        g.fillStyle = `rgba(${Math.round(190 + 65 * warm)},${Math.round(205 + 20 * warm)},${Math.round(255 - 85 * warm)},${0.55 * br * a * wt})`;
        const sz = phone ? 1.2 : 1.6; g.fillRect(px - sz / 2, py - sz / 2, sz, sz);
      }
    }
    g.globalCompositeOperation = 'source-over';
    D.glowDot(s, gx, gy, gR * 0.5, '255,225,180', 0.9 * a);
    label(s, 'galaxy', gx, gy + gR * 0.62 + fs * 0.8, 0.8 * a * (1 - w2));
    label(s, 'another galaxy', gx, gy + gR * 0.62 + fs * 0.8, 0.8 * a * w2);
    // the arrow fades and turns round while the shift changes from red to blue and back
    const dir = z >= 0 ? 1 : -1, al = a * smooth((t - 104.6) / 0.6) * (t < 125 ? 1 : smooth(Math.abs(z) / 0.006)), ay = gy - gR * 0.62 - fs * 1.2, len = clamp(W * 0.1, 30, 120);
    D.arrow(s, gx - dir * len / 2, ay, gx + dir * len / 2, ay, C.white, 0.85 * al, '', { width: 2, head: 9, blur: 6 });
    D.text(s, dir > 0 ? 'moving away: 6000 km s⁻¹' : 'moving towards us', gx, ay - fs * 1.1, fs, 0.85 * al, D.sans(fs), C.white);    g.globalAlpha = outer;
    // the two spectra
    const bx0 = W * (phone ? 0.06 : 0.12), bx1 = W * (phone ? 0.94 : 0.88), XL = (w) => bx0 + (w - 380) / 320 * (bx1 - bx0);
    const yLab = specTop + fs * 1.8, yGal = yLab + barH + fs * 3.2;
    const grd = g.createLinearGradient(bx0, 0, bx1, 0);
    for (let w = 380; w <= 700; w += 10) { const [r, gg, b] = wlRGB(w); grd.addColorStop((w - 380) / 320, `rgb(${r},${gg},${b})`); }
    const specA = a * smooth((t - 109.6) / 0.8);
    if (specA > 0) {
      g.globalAlpha = outer * specA;
      for (const [y, name, zz] of [[yLab, 'laboratory hydrogen', 0], [yGal, 'light from the galaxy', z]]) {
        g.fillStyle = grd; g.fillRect(bx0, y, bx1 - bx0, barH);
        g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1; g.strokeRect(bx0, y, bx1 - bx0, barH);
        g.fillStyle = 'rgba(4,6,13,0.92)';
        for (const w of BALMER) { const x = XL(w * (1 + zz)); g.fillRect(x - Math.max(1.5, barH * 0.07), y, Math.max(3, barH * 0.14), barH); }
        D.text(s, name, bx0, y - fs * 0.75, fs, 0.85, D.sans(fs, 600), C.muted, 'left');
      }
      // the red line: where it is, and how far it moved
      const x0 = XL(656.3), x1 = XL(656.3 * (1 + z));
      D.text(s, '656.3 nm', x0, yLab - fs * 0.75, fs, 0.95, D.sans(fs, 600), '255,140,120');
      const shiftA = smooth((t - 114.8) / 0.6);
      if (shiftA > 0) {
        D.text(s, `${(656.3 * (1 + z)).toFixed(1)} nm`, x1, yGal + barH + fs * 0.9, fs, shiftA, D.sans(fs, 600), '255,140,120');
        if (Math.abs(x1 - x0) > 6) D.arrow(s, x0, yLab + barH + fs * 1.6, x1, yLab + barH + fs * 1.6, C.force, shiftA, '', { width: 2, head: 8, blur: 6 });
      }
      for (const w of [400, 500, 600, 700]) {
        const x = XL(w); D.line(s, x, yGal + barH, x, yGal + barH + 4, C.muted, 0.6, 1);
        D.text(s, String(w), x, yGal + barH + fs * 2.3, fs - 1, 0.75, D.sans(fs - 1), C.muted);
      }
      D.text(s, 'wavelength / nm', (bx0 + bx1) / 2, yGal + barH + fs * 3.7, fs - 1, 0.75, D.sans(fs - 1), C.muted);
      g.globalAlpha = outer;
    }
  }

  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g, W, H } = s, phone = H > W;
    g.fillStyle = `rgba(4,6,13,${0.92 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 34, 17, 34)), s2 = Math.round(clamp(W / 44, 14, 28)), s3 = Math.round(clamp(W / 62, 11.5, 18));
    g.font = D.sans(s1, 300);
    const l1 = D.wrap(s, 'The source\'s frequency never changes: only what the observer receives.', W - 48);
    let y = H * (phone ? 0.09 : 0.15);
    D.text(s, l1, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * l1.length + s2 * (phone ? 0.6 : 1.0);
    const items = [
      [[['Moving source', 'b']], SRC, 'Wavefronts bunch up ahead: shorter wavelength, higher frequency. Behind: longer wavelength, lower frequency.'],
      [[['Moving observer', 'b']], OBS, 'The wavelength is unchanged. Moving towards the source, you meet the wavefronts more often: a higher frequency.'],
      [EQ_LIGHT, C.light, 'Light, with v much less than c. Moving apart: redshift. Moving together: blueshift.'],
      [[['HL  ', 'b'], ...EQ_SRC, ['     ', 'r'], ...EQ_OBS], HLC, 'For sound: a moving source, and a moving observer. Choose the sign so that approaching raises the frequency.'],
    ];
    if (phone) {
      for (const [toks, rgb, txt] of items) {
        const tall = toks.some((tk) => tk[0] === 'frac');
        if (tall) y += s2 * 0.35;
        eq(s, toks, W / 2, y, s2, a, rgb); y += s2 * (tall ? 1.55 : 1.15);
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 36); D.text(s, ls, W / 2, y, s3, 0.8 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.5;
      }
    } else {
      const colW = W * 0.38, rowH = (H * 0.86 - y) / 2;
      items.forEach(([toks, rgb, txt], i) => {
        const x = W * (i % 2 ? 0.72 : 0.28), yy = y + Math.floor(i / 2) * rowH + s2 * 0.4;
        eq(s, toks, x, yy, s2, a, rgb);
        const tall = toks.some((tk) => tk[0] === 'frac');
        g.font = D.sans(s3); D.text(s, D.wrap(s, txt, colW), x, yy + s2 * (tall ? 2.0 : 1.6), s3, 0.8 * a, D.sans(s3));
      });
    }
  }

  Anim.register('doppler', {
    duration: DURATION,
    poster: 50,
    // holds just before each caption fades, so that every caption can be read at about 17 characters a second
    pauses: [[9.2, 2.5], [14.4, 4.0], [19.6, 1.0], [25.8, 1.0], [31.0, 1.2], [36.2, 2.5], [41.4, 2.5], [46.6, 1.5], [51.8, 1.5],
      [57.0, 1.5], [62.2, 2.0], [67.4, 3.5], [73.6, 3.0], [80.0, 2.0], [85.2, 2.5], [90.4, 2.0], [96.6, 2.5], [102.8, 5.5],
      [108.6, 2.0], [113.8, 2.0], [119.0, 1.5], [124.2, 2.5], [129.4, 2.5], [134.6, 5.5], [139.8, 3.5]],
    // score: passing by (E major, a saw pad, a quick upward plucked pattern, a light pulse, a touch of shimmer)
    music: { chords: [[52, 59, 64, 68], [49, 56, 61, 64], [45, 52, 57, 61], [47, 54, 59, 63]], bar: 6, pad: 'saw', cutoff: 1000, drone: 0.08, bells: 0, arp: 0.25, arpMode: 'up', pulse: 1.2, shimmer: 0.2, echo: 0.375, volume: 0.67 },
    resize: layout,
    // for checking the numbers (not used by the player)
    info: { P, V, U, F_AHEAD, F_BEHIND, F_OBS, XA, XB, xsB, xcC, tauA, tauB, tauC, zAt, CAPS, frontsOf, lastArrivalB },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.22);
      const { g } = s;
      const aA = fade(t, A_IN, A_OUT, 0.6, 0.5), aB = fade(t, B_IN, B_OUT, 0.6, 0.5), aC = fade(t, C_IN, C_OUT, 0.6, 0.5);
      const aD = fade(t, D_IN, END_CARD + 0.8, 0.6, 0.8);
      for (const [al, fn] of [[aA, partA], [aB, partB], [aC, partC], [aD, partD]]) {
        if (al <= 0) continue;
        g.globalAlpha = al; fn(s, t, 1); g.globalAlpha = 1;
      }
      D.captions(s, t, CAPS);
      if (t < 4.6) { g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'The Doppler effect', 'Why does a passing car\'s note drop?');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
