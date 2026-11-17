/* What would happen if you jumped into a tunnel through the Earth? (C.1 SHM, D.1 gravitation)
   A thought experiment: a straight tunnel through the centre of a uniform, non-spinning Earth, with no air,
   no friction and no heat. Inside a uniform sphere only the mass closer to the centre pulls you overall
   (the outer shell's pulls cancel: beyond the syllabus), and that mass is proportional to r³, so with
   g = GM/r² the field inside is g = g₀r/R. Along the tunnel a = −(g₀/R)x: exactly SHM with ω² = g₀/R.
   Numbers (g₀ = 9.8 m s⁻², R = 6.37 × 10⁶ m, as in the notes), all recalculated in info.check():
     ω² = 9.8 ÷ (6.37 × 10⁶) = 1.538 × 10⁻⁶ s⁻²  →  ω = 1.240 × 10⁻³ rad s⁻¹
     T = 2π ÷ ω = 5066 s = 84.4 min ≈ 84 min; to the far side T/2 = 2533 s = 42.2 min ≈ 42 min; to the centre T/4 ≈ 21 min
     top speed (HL: v = ωx₀) = 1.240 × 10⁻³ × 6.37 × 10⁶ = 7.90 × 10³ m s⁻¹ ≈ 7.9 km s⁻¹
     halfway down (x = R/2): g = 4.9 m s⁻², v = 7.90 × √0.75 = 6.84 km s⁻¹
     a satellite skimming the surface (D.1): v² = GM/R = g₀R, v = √(9.8 × 6.37 × 10⁶) = 7.90 × 10³ m s⁻¹,
       T = 2πR ÷ v = 5066 s: the same 84 min, and its shadow on the tunnel moves exactly like you
     a tunnel 0.60R from the centre (beyond the syllabus): half-length √(1 − 0.36)R = 0.80R; the field along it is
       g₀s/R (s from its middle), so the same ω and the same 42 min; top speed 0.80 × 7.90 = 6.3 km s⁻¹
   The motion runs 100 times faster than real for the first trip (50.7 s per oscillation on screen), eases to 12 times
   while the force is explained, then runs 200 times faster (25.3 s per oscillation), so the picture never stops.
   Every frame is drawn from the scene time alone. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- the physics ----------
  const G0 = 9.8, R = 6.37e6;
  const W2 = G0 / R, OM = Math.sqrt(W2), PER = 2 * Math.PI / OM, VMAX = OM * R;
  const CHORD_D = 0.6, CHORD_L = Math.sqrt(1 - CHORD_D * CHORD_D);          // in units of R
  const xAt = (tau) => -R * Math.cos(OM * tau);                                // m from the centre (− = left)
  const vAt = (tau) => VMAX * Math.sin(OM * tau);                              // m s⁻¹ (+ = to the right)

  // ---------- timeline (scene seconds) ----------
  // 100 times faster for the first trip (so each caption has time while its stage happens), easing to 12 times
  // while the force is explained, then 200 times for the rest. The picture never stops.
  const T_JUMP = 29.0, FAST1 = 100, SLOW = 12, FAST2 = 200;
  const S1A = 60.6, S1B = 63.6, S2A = 83.4, S2B = 86.4;                         // ease down, ease back up
  const T_SHADE_A = 62.2, T_SHADE_B = 83.2;                                     // the "which mass pulls" picture
  const T_GR_A = 62.0, T_GR_B = 83.4;                                           // the panel shows g against r
  const T_SAT = 103.4, T_CHORD = 125.0, END = 139.8, DURATION = 152.6;
  const rate = (t) => {
    if (t < T_JUMP) return 0;
    if (t < S2A) return FAST1 + (SLOW - FAST1) * smooth((t - S1A) / (S1B - S1A));
    return SLOW + (FAST2 - SLOW) * smooth((t - S2A) / (S2B - S2A));
  };
  // real seconds since jumping, integrated once (trapezium rule, 0.005 s steps) and looked up by t
  const DT = 0.005, NT = Math.ceil(DURATION / DT) + 2, TAU = new Float64Array(NT);
  for (let i = 1; i < NT; i++) TAU[i] = TAU[i - 1] + 0.5 * (rate((i - 1) * DT) + rate(i * DT)) * DT;
  const tauAt = (t) => { const f = clamp(t / DT, 0, NT - 1.001), k = Math.floor(f); return lerp(TAU[k], TAU[k + 1], f - k); };

  const CAPS = [
    [4.8, 11.0, 'Imagine a straight tunnel through the Earth, passing through its centre to the other side.'],
    [11.2, 17.6, 'A thought experiment: no air, no friction, no heat. The Earth is a ball of uniform density and doesn\'t spin.'],
    [17.8, 29.0, 'Predict: you jump in at one end. What happens next?'],
    [29.2, 35.4, 'You fall towards the centre, speeding up all the way.'],
    [35.6, 43.8, 'You pass the centre at top speed. There the field is zero: the Earth pulls equally in every direction around you.'],
    [44.0, 54.6, 'Past the centre, gravity pulls you back. You slow down and just reach the far side, 42 minutes after jumping.'],
    [54.8, 61.8, 'Then you fall back again. With nothing to stop you, you would go to and fro for ever: an oscillation.'],
    [62.0, 69.0, 'Why? Inside a uniform Earth only the mass closer to the centre than you pulls you overall (beyond the syllabus).'],
    [69.2, 76.2, 'That mass is proportional to r³, and g = GM/r², so g is proportional to r: g = g₀r/R, zero at the centre.'],
    [76.4, 83.2, 'So along the tunnel a = −(g₀/R)x: proportional to the displacement and towards the centre. That is SHM.'],
    [83.4, 90.2, 'Compare a = −ω²x: ω² = g₀/R = 9.8 ÷ (6.37 × 10⁶) = 1.54 × 10⁻⁶ s⁻², so ω = 1.24 × 10⁻³ rad s⁻¹.'],
    [90.4, 97.0, 'T = 2π ÷ ω = 5.07 × 10³ s, about 84 minutes, so the trip to the far side takes about 42 minutes.'],
    [97.2, 103.2, '(HL) Top speed, at the centre: v = ωx₀ = 1.24 × 10⁻³ × 6.37 × 10⁶ = 7.9 × 10³ m s⁻¹.'],
    [103.4, 110.2, 'Now add a satellite in a circular orbit just above the surface, going round in step with you (D.1).'],
    [110.4, 117.2, 'Its orbital speed is v = √(g₀R) = 7.9 km s⁻¹, and its period 2πR ÷ v is also 84 minutes.'],
    [117.4, 124.8, 'Its shadow on the tunnel moves exactly with you: SHM is uniform circular motion seen side-on (C.1, HL).'],
    [125.0, 132.2, '(Beyond the syllabus) A straight tunnel that misses the centre takes the same 42 minutes, with a lower top speed.'],
    [132.4, 139.6, 'The real Earth has a dense core, so a real trip would be a little shorter. The idea is the same.'],
  ];

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;                                       // the 4:5 stage (buttons below)
    const capFs = Math.round(clamp(W / 44, 15, 25)), capTop = H - capFs * (phone ? 6.6 : 5.4);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    let cx, cy, Re, p;
    if (phone) {
      Re = Math.min(W * 0.33, H * 0.19); cx = W / 2; cy = Re + Math.max(14, H * 0.03);
      p = { x0: 12, x1: W - 12, y0: cy + Re + fs * 2.0, y1: capTop - fs * 0.4 };
    } else {
      Re = Math.min(W * 0.2, H * 0.29); cx = W * 0.3; cy = H * 0.45;
      p = { x0: W * 0.58, x1: W - Math.max(12, W * 0.03), y0: Math.max(54, H * 0.16), y1: capTop - fs * 0.6 };
    }
    L = { W, H, phone, capFs, capTop, fs, cx, cy, Re, p, th: Math.max(6, Re * 0.075) };
  }

  const kmTxt = (m) => `${m < 0 ? '−' : ''}${Math.round(Math.abs(m) / 1000).toLocaleString('en-GB').replace(/,/g, ' ')}`;
  const num = (v, dp) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(dp);

  // a small capsule with a window, pointing along the tunnel, drawn far bigger than to scale
  function capsule(s, x, y, size, a) {
    const { g } = s; if (a <= 0) return;
    g.save(); g.globalAlpha = a;
    const w = size * 1.7, h = size * 0.95;
    const body = g.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    body.addColorStop(0, '#e9eefc'); body.addColorStop(1, '#8c97b8');
    g.fillStyle = body; g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, h / 2); g.fill();
    g.fillStyle = '#1a2a55'; g.beginPath(); g.arc(x + w * 0.12, y, h * 0.27, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,214,102,0.9)'; g.beginPath(); g.arc(x + w * 0.12, y - h * 0.04, h * 0.12, 0, 7); g.fill();
    g.restore();
  }

  // ---------- the Earth, the tunnel, the jumper ----------
  function drawEarth(s, t, tau) {
    const { g } = s, { cx, cy, Re, th, fs, phone } = L;
    // a uniform ball: one colour all through (the model), with gentle shading
    const rg = g.createRadialGradient(cx - Re * 0.3, cy - Re * 0.35, Re * 0.1, cx, cy, Re);
    rg.addColorStop(0, 'rgba(176,112,72,1)'); rg.addColorStop(1, 'rgba(118,68,48,1)');
    g.globalCompositeOperation = 'source-over'; g.fillStyle = rg;
    g.beginPath(); g.arc(cx, cy, Re, 0, 7); g.fill();
    D.glowLine(s, Array.from({ length: 97 }, (_, i) => [cx + Re * Math.cos(i / 96 * 2 * Math.PI), cy + Re * Math.sin(i / 96 * 2 * Math.PI)]), '110,170,255', 0.7, 1.6);
    D.text(s, 'uniform Earth (model)', cx, cy - Re * 0.52, fs, 0.75 * fade(t, 5.0, END, 1, 1) * (1 - fade(t, T_SHADE_A, T_SHADE_B, 0.8, 0.8)), D.sans(fs), '255,226,200');

    // which mass pulls you: the ball inside your radius (shaded), the shell outside (its pulls cancel)
    const sh = fade(t, T_SHADE_A, T_SHADE_B, 1.2, 1.0);
    const x = xAt(tau), rr = Math.abs(x) / R * Re;
    if (sh > 0) {
      g.fillStyle = `rgba(255,214,102,${0.2 * sh})`; g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.fill();
      D.glowLine(s, Array.from({ length: 73 }, (_, i) => [cx + rr * Math.cos(i / 72 * 2 * Math.PI), cy + rr * Math.sin(i / 72 * 2 * Math.PI)]), C.light, 0.8 * sh, 1.4);
      if (rr > fs * 3) D.text(s, 'pulls you overall', cx, cy + Math.max(rr * 0.55, th * 1.6 + fs * 1.2), fs, sh, D.sans(fs, 600), C.light);
      if (Re - rr > fs * 1.8) D.text(s, phone || Re < fs * 14 ? 'shell: pulls cancel' : 'outer shell: its pulls cancel', cx, cy + (rr + Re) / 2, fs, 0.9 * sh, D.sans(fs, 600), '255,226,200');
    }

    // the tunnel
    g.fillStyle = 'rgba(8,10,22,0.96)'; g.fillRect(cx - Re - 2, cy - th / 2, 2 * Re + 4, th);
    D.line(s, cx - Re, cy - th / 2, cx + Re, cy - th / 2, '200,190,180', 0.5, 1);
    D.line(s, cx - Re, cy + th / 2, cx + Re, cy + th / 2, '200,190,180', 0.5, 1);
    D.line(s, cx, cy - th * 1.1, cx, cy + th * 1.1, '255,255,255', 0.45, 1, [2, 3]);
    D.text(s, 'centre', cx, cy + th * 1.1 + fs * 0.75, fs - 1, 0.7 * fade(t, 5.0, T_JUMP + 0.6, 1, 0.6), D.sans(fs - 1), C.muted);

    // a second tunnel that misses the centre (beyond the syllabus)
    const ca = fade(t, T_CHORD, END + 0.2, 1, 0.8);
    if (ca > 0) {
      const yc = cy + CHORD_D * Re, hl = CHORD_L * Re;
      g.fillStyle = `rgba(8,10,22,${0.96 * ca})`; g.fillRect(cx - hl, yc - th / 2, 2 * hl, th);
      D.line(s, cx - hl, yc - th / 2, cx + hl, yc - th / 2, '200,190,180', 0.5 * ca, 1);
      D.line(s, cx - hl, yc + th / 2, cx + hl, yc + th / 2, '200,190,180', 0.5 * ca, 1);
      capsule(s, cx + CHORD_L * Re * (-Math.cos(OM * tau)), yc, Math.max(9, Re * 0.075), ca);
    }

    // the satellite just above the surface, in step, and its shadow on the tunnel
    const sa = fade(t, T_SAT, END + 0.2, 1.2, 0.8);
    if (sa > 0) {
      const ro = Re + Math.max(4, Re * 0.05), ph = OM * tau;
      g.setLineDash([3, 5]); g.strokeStyle = `rgba(255,214,102,${0.35 * sa})`; g.lineWidth = 1;
      g.beginPath(); g.arc(cx, cy, ro, 0, 7); g.stroke(); g.setLineDash([]);
      // x is the exact projection (so the shadow lands on you); y puts it on the drawn circle just above the surface
      const sx = cx - Re * Math.cos(ph), sy = cy - Math.sign(Math.sin(ph) || 1) * Math.sqrt(Math.max(0, ro * ro - (sx - cx) * (sx - cx)));
      D.line(s, sx, sy, sx, cy, C.light, 0.6 * sa, 1, [3, 4]);
      D.glowDot(s, sx, sy, Math.max(9, Re * 0.09), C.light, sa);
      const rd = Math.hypot(sx - cx, sy - cy) || 1, lr = ro + fs * 1.6;           // label just outside the orbit, away from the rim
      D.text(s, 'satellite', cx + (sx - cx) / rd * lr, cy + (sy - cy) / rd * lr, fs, 0.85 * sa * fade(t, T_SAT, T_SAT + 14, 1, 1), D.sans(fs, 600), C.light);
    }

    // you, with velocity (blue) and acceleration (orange) arrows along the tunnel, to scale
    const px = cx + x / R * Re, size = Math.max(10, Re * 0.085);
    if (t > T_JUMP + 0.2) {
      const v = vAt(tau), a = -W2 * x, la = Re * 0.5 * Math.abs(x) / R, lv = Re * 0.5 * Math.abs(v) / VMAX;
      if (lv > 4) { D.arrow(s, px, cy - th * 1.6, px + Math.sign(v) * lv, cy - th * 1.6, C.vel, 1, 'v', { head: 8, width: 2.2, labelOff: 10 }); }
      if (la > 4) { D.arrow(s, px, cy + th * 1.6, px + Math.sign(a) * la, cy + th * 1.6, C.force, 1, 'a', { head: 8, width: 2.2, labelOff: 10 }); }
    }
    const bob = t < T_JUMP ? Math.sin(s.clock * 2.2) * 1.2 : 0;
    capsule(s, t < T_JUMP ? cx - Re : px, cy + bob, size, 1);                    // waiting at the mouth, so the jump starts smoothly
    D.text(s, 'you (not to scale)', cx - Re + fs * 0.8, cy - th / 2 - size * 1.3, fs, 0.85 * fade(t, 5.0, 31.5, 1, 1), D.sans(fs, 600), C.text, 'left');
  }

  // ---------- the panel: readouts and a graph ----------
  function drawPanel(s, t, tau, a) {
    if (a <= 0) return;
    const { g } = s, { p, fs, phone } = L;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(14,20,44,${0.72 * a})`; g.beginPath(); g.roundRect(p.x0 - 6, p.y0 - 6, p.x1 - p.x0 + 12, p.y1 - p.y0 + 12, 10); g.fill();
    const x = t < T_JUMP ? -R : xAt(tau), v = t < T_JUMP ? 0 : Math.abs(vAt(tau)), gg = G0 * Math.abs(x) / R;
    const rt = rate(t), sp = t < T_JUMP ? 'clock starts when you jump' : `speeded up ${Math.round(rt)} times`;
    const lh = fs * 1.45;
    let y = p.y0 + fs * 0.7;
    if (phone) {
      const l2 = `speed ${num(v / 1000, 2)} km s⁻¹   g = ${num(gg, 2)} m s⁻²`;
      D.text(s, `time since jumping ${num(tau / 60, 1)} min   x = ${kmTxt(x)} km`, p.x0, y, fs, a, D.sans(fs), C.text, 'left');
      D.text(s, l2, p.x0, y + lh, fs, a, D.sans(fs), C.text, 'left');
      g.font = D.sans(fs); const w2 = g.measureText(l2).width; g.font = D.sans(fs - 1);
      if (w2 + g.measureText(sp).width + fs * 1.5 < p.x1 - p.x0) D.text(s, sp, p.x1, y + lh, fs - 1, 0.7 * a, D.sans(fs - 1), C.muted, 'right');
      y += lh * 1.8;
    } else {
      // two columns where they fit, otherwise one item per line
      const items = [[`time since jumping: ${num(tau / 60, 1)} min`, C.text], [`from the centre: ${kmTxt(Math.abs(x))} km`, C.text],
        [`speed: ${num(v / 1000, 2)} km s⁻¹`, C.vel], [`g here: ${num(gg, 2)} m s⁻²`, C.force]];
      g.font = D.sans(fs);
      const w = (k) => g.measureText(items[k][0].replace(/[0-9.]+/g, (m) => '8'.repeat(m.length))).width;   // width of the widest value
      const c2 = Math.max(w(0), w(2)) + fs * 1.6;
      if (c2 + Math.max(w(1), w(3)) <= p.x1 - p.x0) {
        items.forEach(([txt, rgb], i) => D.text(s, txt, p.x0 + (i % 2) * c2, y + Math.floor(i / 2) * lh, fs, a, D.sans(fs), rgb, 'left'));
        y += lh * 2;
      } else {
        items.forEach(([txt, rgb], i) => D.text(s, txt, p.x0, y + i * lh, fs, a, D.sans(fs), rgb, 'left'));
        y += lh * 4;
      }
      D.text(s, sp, p.x0, y, fs - 1, 0.7 * a, D.sans(fs - 1), C.muted, 'left');
      y += lh * 0.9;
    }
    const gb = { x0: p.x0 + fs * 3.2, x1: p.x1 - fs * 0.8, y0: y + fs * 0.6, y1: p.y1 - fs * 2.2 };
    if (gb.y1 - gb.y0 < 30) return;
    const grA = fade(t, T_GR_A, T_GR_B, 0.8, 0.8), xtA = t >= T_JUMP ? 1 - grA : 0;
    if (xtA > 0.01) graphXT(s, t, tau, gb, xtA * a);
    if (grA > 0.01) graphGR(s, t, tau, gb, grA * a);
  }

  // displacement against time: a window of 170 minutes that scrolls once it is full
  function graphXT(s, t, tau, b, a) {
    const { fs } = L, tm = tau / 60, w0 = Math.max(0, tm - 170), w1 = w0 + 170;
    const X = (m) => b.x0 + (m - w0) / (w1 - w0) * (b.x1 - b.x0), Y = (xm) => (b.y0 + b.y1) / 2 - xm / R * (b.y1 - b.y0) / 2;
    D.line(s, b.x0, (b.y0 + b.y1) / 2, b.x1, (b.y0 + b.y1) / 2, C.muted, 0.45 * a, 1);
    D.line(s, b.x0, b.y0 - 4, b.x0, b.y1 + 4, C.muted, 0.6 * a, 1.2);
    D.text(s, 'x / km', b.x0, b.y0 - fs * 0.9, fs - 1, 0.8 * a, D.serif(fs - 1), C.muted, 'left');
    D.text(s, '+6370', b.x0 - 4, b.y0, fs - 2, 0.7 * a, D.sans(fs - 2), C.muted, 'right');
    D.text(s, '0', b.x0 - 4, (b.y0 + b.y1) / 2, fs - 2, 0.7 * a, D.sans(fs - 2), C.muted, 'right');
    D.text(s, '−6370', b.x0 - 4, b.y1, fs - 2, 0.7 * a, D.sans(fs - 2), C.muted, 'right');
    for (let m = Math.ceil(w0 / 50) * 50; m <= w1; m += 50) {
      D.line(s, X(m), b.y1, X(m), b.y1 + 4, C.muted, 0.6 * a, 1);
      D.text(s, String(m), X(m), b.y1 + fs * 0.9, fs - 2, 0.7 * a, D.sans(fs - 2), C.muted);
    }
    D.text(s, 't / min', b.x1, b.y1 + fs * 1.9, fs - 1, 0.8 * a, D.serif(fs - 1), C.muted, 'right');
    const pts = [];
    for (let i = 0; i <= 240; i++) { const m = w0 + (Math.min(tm, w1) - w0) * i / 240; if (m < 0) continue; pts.push([X(m), Y(xAt(m * 60))]); }
    if (tm > w0) D.glowLine(s, pts, '120,220,170', a, 1.8);
    if (t > T_JUMP) D.glowDot(s, X(tm), Y(xAt(tau)), 10, '120,220,170', a);
    // the period, marked from 90.4 s (between two neighbouring times when x = −R)
    const pa = fade(t, 90.4, 103.2, 0.8, 0.8) * a;
    if (pa > 0) {
      const k = Math.ceil(w0 * 60 / PER), m1 = k * PER / 60, m2 = (k + 1) * PER / 60;
      if (m2 <= Math.min(tm, w1)) {
        const yy = b.y1 + 2;
        D.line(s, X(m1), yy - 6, X(m2), yy - 6, C.light, pa, 1.4);
        D.line(s, X(m1), yy - 10, X(m1), yy - 2, C.light, pa, 1.4); D.line(s, X(m2), yy - 10, X(m2), yy - 2, C.light, pa, 1.4);
        D.text(s, 'T ≈ 84 min', (X(m1) + X(m2)) / 2, yy - 6 - fs * 0.8, fs - 1, pa, D.sans(fs - 1, 600), C.light);
      }
    }
  }

  // field strength against distance from the centre: g₀r/R inside, g₀R²/r² outside
  function graphGR(s, t, tau, b, a) {
    const { fs } = L, X = (r) => b.x0 + r / 3 * (b.x1 - b.x0), Y = (gv) => b.y1 - gv / 10 * (b.y1 - b.y0);
    D.line(s, b.x0, b.y1, b.x1, b.y1, C.muted, 0.6 * a, 1.2);
    D.line(s, b.x0, b.y1, b.x0, b.y0 - 4, C.muted, 0.6 * a, 1.2);
    D.text(s, 'g / m s⁻²', b.x0, b.y0 - fs * 0.9, fs - 1, 0.8 * a, D.sans(fs - 1), C.muted, 'left');
    for (const gv of [0, 4.9, 9.8]) D.text(s, gv.toFixed(1), b.x0 - 4, Y(gv), fs - 2, 0.7 * a, D.sans(fs - 2), C.muted, 'right');
    for (const r of [0, 1, 2, 3]) {
      D.line(s, X(r), b.y1, X(r), b.y1 + 4, C.muted, 0.6 * a, 1);
      D.text(s, r === 0 ? '0' : `${r}R`, X(r), b.y1 + fs * 0.9, fs - 2, 0.7 * a, D.sans(fs - 2), C.muted);
    }
    D.text(s, 'distance from the centre', b.x1, b.y1 + fs * 1.9, fs - 1, 0.8 * a, D.sans(fs - 1), C.muted, 'right');
    D.line(s, X(1), b.y0, X(1), b.y1, '110,170,255', 0.5 * a, 1, [3, 4]);
    D.text(s, 'surface', X(1) + 4, b.y0 + fs * 0.4, fs - 2, 0.75 * a, D.sans(fs - 2), '110,170,255', 'left');
    const inside = [[X(0), Y(0)], [X(1), Y(G0)]];
    const outside = Array.from({ length: 61 }, (_, i) => { const r = 1 + 2 * i / 60; return [X(r), Y(G0 / (r * r))]; });
    D.glowLine(s, inside, C.force, a, 2);
    D.glowLine(s, outside, C.force, 0.55 * a, 1.6);
    D.text(s, 'inside: g ∝ r', X(0.6), Y(G0 * 0.18), fs - 1, a, D.sans(fs - 1, 600), C.force, 'left');
    D.text(s, 'outside: g ∝ 1/r²', X(1.9), Y(G0 / 3.61) - fs * 0.9, fs - 1, 0.8 * a, D.sans(fs - 1), C.force, 'left');
    const r = Math.abs(xAt(tau)) / R;
    D.glowDot(s, X(r), Y(G0 * r), 10, C.light, a);
    D.text(s, 'you', X(r), Y(G0 * r) - fs * 1.0, fs - 1, 0.9 * a, D.sans(fs - 1, 600), C.light);
  }

  function endCard(s, t) {
    const a = fade(t, END, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 40, 15, 26)), s3 = Math.round(clamp(W / 60, 12, 17));
    g.font = D.sans(s1, 300);
    const head = D.wrap(s, 'A tunnel through a uniform Earth: simple harmonic motion', W - 48);
    let y = H * (phone ? 0.13 : 0.18);
    D.text(s, head, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * head.length + s2 * 0.6;
    const items = [
      ['g = g₀r/R', C.force, 'Inside, the field is proportional to the distance from the centre (beyond the syllabus).'],
      ['a = −ω²x', '120,220,170', 'Acceleration proportional to displacement and towards the centre, with ω² = g₀/R.'],
      ['T ≈ 84 min', C.light, 'The same period as a satellite skimming the surface: 42 minutes to the far side.'],
    ];
    if (phone) {
      for (const [eq, rgb, txt] of items) {
        D.text(s, eq, W / 2, y, s2, a, D.serif(s2), rgb); y += s2 * 1.1;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 40); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.6;
      }
    } else {
      const colW = Math.min(W * 0.28, 320);
      g.font = D.sans(s3);
      const wr = items.map((it) => D.wrap(s, it[2], colW));
      items.forEach(([eq, rgb], i) => {
        const x = W / 2 + (i - 1) * W * 0.31;
        D.text(s, eq, x, y, s2, a, D.serif(s2), rgb);
        D.text(s, wr[i], x, y + s2 * 1.2, s3, 0.85 * a, D.sans(s3));
      });
      y += s2 * 1.2 + s3 * 1.3 * Math.max(...wr.map((l) => l.length)) + s3;
    }
    g.font = D.sans(s3 - 1);
    D.text(s, D.wrap(s, 'A thought experiment: a uniform Earth with no spin, air, friction or heat. You and the satellite are drawn far bigger than to scale.', Math.min(W - 40, 760)), W / 2, Math.max(y, H * 0.78), s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('tunnel', {
    duration: DURATION,
    poster: 108,
    // score: falling through (E minor, a deep soft sine pad, a strong low drone, wind, a slow swell)
    music: { chords: [[40, 47, 52, 59], [36, 43, 48, 55], [38, 45, 50, 57], [35, 42, 47, 54]], bar: 10, pad: 'sine', cutoff: 700, drone: 0.14, wind: 0.5, tremolo: 0.12, volume: 0.35 },
    resize: layout,
    info: {
      CAPS, PER, OM, VMAX, tauAt, xAt, vAt, rate,
      check() {
        const out = {
          w2: W2, omega: OM, T: PER, Tmin: PER / 60, halfMin: PER / 120, quarterMin: PER / 240, vmax: VMAX,
          vHalf: VMAX * Math.sqrt(0.75), gHalf: G0 / 2, vOrbit: Math.sqrt(G0 * R), Torbit: 2 * Math.PI * R / Math.sqrt(G0 * R),
          chordHalf: CHORD_L, chordVmax: CHORD_L * VMAX, onScreenPeriod1: PER / FAST1, onScreenPeriod2: PER / FAST2,
        };
        // scene times when you pass the centre or reach an end (τ = k T/4), to check them against the captions
        out.events = [];
        for (let k = 1, i = 1; i < NT && k < 40; i++) {
          if (TAU[i] >= k * PER / 4 && TAU[i - 1] < k * PER / 4) { out.events.push([k % 2 ? 'centre' : 'end', +(i * DT).toFixed(2)]); k++; }
        }
        out.xDuringSlow = [62, 66, 70, 74, 78, 83.2].map((tt) => +(xAt(tauAt(tt)) / R).toFixed(3));
        out.capRates = CAPS.map(([a, b, txt]) => +(txt.length / (b - a)).toFixed(1));
        return out;
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      const tau = tauAt(t);
      D.background(s, 0.2);
      // a few stars
      const { g, W, H } = s;
      for (let i = 0; i < 70; i++) {
        const sx = ((i * 9301 + 49297) % 233280) / 233280 * W, sy = ((i * 4096 + 150889) % 714025) / 714025 * H;
        g.fillStyle = `rgba(220,230,255,${0.25 + 0.2 * Math.sin(s.clock * 0.7 + i)})`; g.fillRect(sx, sy, 1.2, 1.2);
      }
      drawEarth(s, t, tau);
      drawPanel(s, t, tau, smooth((t - 5.0) / 0.9) * (1 - smooth((t - END) / 0.8)));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.82 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'A tunnel through the Earth', 'What would happen if you jumped in?');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
