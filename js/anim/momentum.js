/* A.2 Conservation of momentum: an elastic collision, a sticky (inelastic) collision and an explosion on an
   air track, then a rocket in deep space (thrust F = Δp/Δt) and, beyond the syllabus, the rocket equation.
   Physics, all calculated (scene.numbers holds the results, for checking):
   - The collisions are simulated in small steps (2 × 10⁻⁵ s) with equal and opposite contact forces (a bumper
     spring, damped sticky pads, a released spring), so the total momentum is conserved at every step and the
     results come out of the simulation: elastic 2.0 kg at 3.0 m s⁻¹ on 1.0 kg at rest → 1.0 and 4.0 m s⁻¹
     (p = 6.0 kg m s⁻¹; Ek 9.0 J → 9.0 J); sticky → 2.0 m s⁻¹ together (Ek 9.0 J → 6.0 J); explosion from rest,
     spring energy ½kx² = 6.75 J → −1.5 and +3.0 m s⁻¹ (Ek 0 → 6.75 J).
   - Rocket: 50 000 kg; puffs of 25 kg every 0.1 s (250 kg s⁻¹) leave at 3000 m s⁻¹ relative to the rocket.
     In the rocket's frame just before a puff, the puff gets −75 000 kg m s⁻¹ and the rocket +75 000 kg m s⁻¹,
     so the thrust is 75 000 / 0.1 = 7.5 × 10⁵ N. After 1200 puffs (120 s): m = 20 000 kg, v = 2750 m s⁻¹
     (rocket equation: 3000 ln 2.5 = 2749 m s⁻¹). Acceleration F/m: 15.0 → 37.5 m s⁻².
   - Orbit: m0/mf = e^(9.4/3.0) = 22.95, so the propellant is 1 − 1/22.95 = 95.6 % of the launch mass. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  const COL_A = C.good, COL_B = C.light, HEAT = '255,120,60', GAS = '255,196,110', ROCK = C.good, THRUST = C.force;
  const MINUS = '−';
  const fmt1 = (x) => (Math.abs(x) < 0.05 ? '0' : (x < 0 ? MINUS : '') + Math.abs(x).toFixed(1));
  const group = (n) => (n >= 10000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(n));
  const fmtBig = (x, step = 1000) => { const r = Math.round(x / step) * step; return r === 0 ? '0' : (r < 0 ? MINUS : '') + group(Math.abs(r)); };

  // ---------- the air-track collisions, simulated ----------
  const BUMP = 0.25, K_BUMP = 267;              // spring bumper on the 2.0 kg glider (world units, N per unit)
  const PAD = 0.07, PAD_RATE = 40;              // sticky pads: putty-like, they squash and stay squashed (a damping force only, so they never bounce apart)
  const SPR_L0 = 0.6, SPR_X0 = 0.35, E_SPR = 6.75, K_SPR = 2 * E_SPR / (SPR_X0 * SPR_X0);   // ½kx² = 6.75 J
  const REC = 1e-3, SIM_T = 0.9;
  function simulate(P) {
    const dt = 2e-5, per = Math.round(REC / dt), n = Math.round(SIM_T / REC);
    const mu = P.mA * P.mB / (P.mA + P.mB), cPad = PAD_RATE * mu;
    let xA = 0, xB = P.wA / 2 + P.gap0 + P.wB / 2, vA = P.vA, vB = P.vB, glow = 0, heat = 0, stuck = false, touched = false, done = null;
    const r = { xA: [], xB: [], vA: [], vB: [], glow: [] };
    for (let i = 0; i <= n; i++) {
      r.xA.push(xA); r.xB.push(xB); r.vA.push(vA); r.vB.push(vB); r.glow.push(glow);
      let F = 0;
      for (let j = 0; j < per; j++) {
        const gap = xB - P.wB / 2 - (xA + P.wA / 2), rel = vB - vA;
        let P_heat = 0; F = 0;
        if (P.mode === 'bumper') { if (gap < BUMP) F = K_BUMP * (BUMP - gap); }
        else if (P.mode === 'sticky') {
          if (gap < 2 * PAD) stuck = true;
          if (stuck) { F = -cPad * rel; P_heat = cPad * rel * rel; }
        } else if (gap < SPR_L0) F = K_SPR * (SPR_L0 - gap);
        if (F !== 0) touched = true;
        vA -= F / P.mA * dt; vB += F / P.mB * dt;      // equal and opposite impulses: momentum is conserved exactly
        xA += vA * dt; xB += vB * dt;
        heat += P_heat * dt; glow += (P_heat / 3 - glow / 0.9) * dt;
      }
      if (done === null && touched && i > 5) {
        if (P.mode === 'sticky' ? Math.abs(vB - vA) < 0.02 : F === 0) done = i * REC;
      }
    }
    r.done = done; r.heat = heat; r.n = n;
    const e = n;
    r.ekAfter = 0.5 * P.mA * r.vA[e] ** 2 + 0.5 * P.mB * r.vB[e] ** 2;
    r.ekBefore = 0.5 * P.mA * P.vA ** 2 + 0.5 * P.mB * P.vB ** 2;
    r.pBefore = P.mA * P.vA + P.mB * P.vB; r.pAfter = P.mA * r.vA[e] + P.mB * r.vB[e];
    return r;
  }
  const PARTS = [
    { key: 'el', mode: 'bumper', mA: 2, mB: 1, wA: 1.3, wB: 1.0, vA: 3, vB: 0, gap0: BUMP,
      t0: 3.6, tc: 12.6, th: 15.6, fin: 3.4, fout: 23.8, title: '1 · Elastic collision', predict: [9.4, 12.6], ekd: 1 },
    { key: 'in', mode: 'sticky', mA: 2, mB: 1, wA: 1.3, wB: 1.0, vA: 3, vB: 0, gap0: 2 * PAD,
      t0: 23.8, tc: 30.0, th: 33.0, fin: 23.9, fout: 41.2, title: '2 · Inelastic collision', ekd: 1 },
    { key: 'ex', mode: 'spring', mA: 2, mB: 1, wA: 1.3, wB: 1.0, vA: 0, vB: 0, gap0: SPR_L0 - SPR_X0,
      t0: 41.2, tc: 49.8, th: 52.8, fin: 41.3, fout: 61.0, title: '3 · Explosion', predict: [46.8, 49.8], ekd: 2 },
  ];
  for (const P of PARTS) P.sim = simulate(P);
  function stateAt(P, tau) {
    const r = P.sim;
    if (tau <= 0) return { xA: r.xA[0] + P.vA * tau, xB: r.xB[0] + P.vB * tau, vA: P.vA, vB: P.vB, glow: 0 };
    const f = Math.min(tau / REC, r.n - 1e-6), i = Math.floor(f), u = f - i, at = (k) => lerp(r[k][i], r[k][i + 1], u);
    return { xA: at('xA'), xB: at('xB'), vA: at('vA'), vB: at('vB'), glow: at('glow') };
  }
  const gapOf = (P, st) => st.xB - P.wB / 2 - (st.xA + P.wA / 2);

  // ---------- the rocket, puff by puff ----------
  const M0 = 50000, DM = 25, VE = 3000, DT_PUFF = 0.1, NPUFF = 1200, THRUST_N = DM * VE / DT_PUFF;   // 7.5e5 N
  const RV = [0], RM = [M0], GAS_P = [0];
  for (let k = 1; k <= NPUFF; k++) {
    RM[k] = M0 - DM * k;
    RV[k] = RV[k - 1] + DM * VE / RM[k];                  // rocket frame before the puff: 0 = RM[k]·Δv − DM·VE
    GAS_P[k] = GAS_P[k - 1] + DM * (RV[k - 1] - VE);      // the puff's momentum in the ground frame
  }
  const R1_T0 = 64.0, R1_GAP = 2.2, R2_T0 = 77.0, R2_T1 = 86.6;
  const burnTau = (t) => (t < R1_T0 ? -1 : t < R2_T0 ? Math.min(0.35, (t - R1_T0) / (R1_GAP / DT_PUFF))
    : Math.min(120, 0.35 + (t - R2_T0) * (120 - 0.35) / (R2_T1 - R2_T0)));
  const puffsAt = (tau) => (tau < 0 ? 0 : Math.min(NPUFF, Math.floor(tau / DT_PUFF + 1e-6) + 1));
  // star drift on screen (px per second at 960 px wide): not to scale, just faster as the rocket speeds up
  const drift = (v) => 150 * Math.log10(1 + v / 3);
  const OFF = [], OFF_T0 = 60, OFF_DT = 0.02;
  { let o = 0; for (let t = OFF_T0; t <= 112; t += OFF_DT) { OFF.push(o); if (t < 88.5) o += drift(RV[puffsAt(burnTau(t))]) * OFF_DT; } }
  const offAt = (t) => { const f = clamp((t - OFF_T0) / OFF_DT, 0, OFF.length - 1.001), i = Math.floor(f); return lerp(OFF[i], OFF[i + 1], f - i); };

  // ---------- beyond the syllabus: the rocket equation ----------
  const DV_ORBIT = 9.4, VE_KM = 3.0, RATIO = Math.exp(DV_ORBIT / VE_KM), MF = 1 / RATIO;   // 22.95, 0.0436
  const G_T0 = 93.4, G_T1 = 97.6;

  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({ length: 170 }, () => ({ x: rnd(), y: rnd(), z: 0.25 + 0.75 * rnd(), b: rnd(), ph: rnd() * 6.28 }));
  const puffBits = Array.from({ length: 16 }, () => ({ sp: 0.75 + 0.5 * rnd(), an: (rnd() - 0.5) * 0.5, r: 1.6 + 2.6 * rnd() }));
  const hash = (k) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = W < 520;
    const pad = clamp(W * 0.035, 12, 34), fs = Math.round(clamp(W / 60, 12, 20));
    const SLOW = phone ? 7.5 : 4.5;                       // shown in slow motion: SLOW seconds on screen per real second
    let span = 0;
    for (const P of PARTS) {
      P.tmin = (P.t0 - P.tc) / SLOW; P.tmax = (P.th - P.tc) / SLOW;
      // the moving glider may start off the screen (the track carries on): frame it from 3 s after it starts
      const KV = phone ? 0.32 : 0.42, a = stateAt(P, Math.max(P.tmin, (P.t0 + (phone ? 4 : 3) - P.tc) / SLOW)), b = stateAt(P, P.tmax);
      const left = Math.min(a.xA, b.xA) - P.wA / 2, right = Math.max(a.xB + P.wB / 2, b.xB + Math.max(P.wB / 2, KV * b.vB + 0.15));
      P.centre = (left + right) / 2; span = Math.max(span, right - left);
    }
    const unit = Math.min((W - 2 * pad - 16) / span, H * 0.17);
    const trackY = phone ? H * 0.34 : H * 0.38, beam = clamp(unit * 0.16, 6, 14);
    const pw = Math.min(W - 2 * pad, 900), px0 = (W - pw) / 2;
    const panY = phone ? trackY + beam + fs * 2.4 : H * 0.49, rowH = phone ? fs * 1.85 : clamp(H * 0.06, 20, 44);
    const rk = phone ? { cx: W * 0.58, cy: H * 0.3, Lr: W * 0.44 } : { cx: W * 0.6, cy: H * 0.3, Lr: Math.min(W * 0.3, H * 0.6) };
    rk.bottom = rk.cy + (0.085 + 0.11) * rk.Lr;          // lowest point of the fins
    L = { W, H, phone, pad, fs, SLOW, KV: phone ? 0.32 : 0.42, unit, trackY, beam, gh: 0.5 * unit, air: 0.05 * unit, px0, px1: px0 + pw, panY, rowH,
      secY: Math.max((s.top || 0) + 14, Math.min(58, H * 0.12)), rk };
  }

  // ---------- drawing helpers ----------
  function rr(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h);
    g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }
  // Text with subscripts _{..}, superscripts ^{..} and upright parts !{..} (font(size, upright) gives the font).
  function rich(s, str, x, y, size, a, font, rgb = C.text, align = 'center') {
    if (a <= 0) return 0;
    const { g } = s, parts = [], re = /([_^!])\{([^}]*)\}/g; let last = 0, m;
    while ((m = re.exec(str))) { if (m.index > last) parts.push({ t: str.slice(last, m.index), k: '' }); parts.push({ t: m[2], k: m[1] }); last = re.lastIndex; }
    if (last < str.length) parts.push({ t: str.slice(last), k: '' });
    const sz = (p) => (p.k === '_' || p.k === '^' ? size * 0.66 : size), fnt = (p) => font(sz(p), p.k === '!');
    let w = 0; for (const p of parts) { g.font = fnt(p); p.w = g.measureText(p.t).width; w += p.w; }
    let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`;
    for (const p of parts) { g.font = fnt(p); g.fillText(p.t, cx, y + (p.k === '_' ? size * 0.3 : p.k === '^' ? -size * 0.36 : 0)); cx += p.w; }
    g.shadowBlur = 0; return w;
  }
  const serifF = (z, up) => D.serif(z, !up);
  const sansF = (z) => D.sans(z);
  function coil(s, x0, x1, y, amp, turns, a, rgb = '215,225,245') {
    const { g } = s; if (a <= 0 || x1 - x0 < 1) return;
    g.globalCompositeOperation = 'source-over'; g.strokeStyle = `rgba(${rgb},${a})`; g.lineWidth = Math.max(1.2, amp * 0.28); g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x0, y);
    const n = turns * 2;
    for (let i = 1; i < n; i++) g.lineTo(x0 + (x1 - x0) * i / n, y + (i % 2 ? -amp : amp));
    g.lineTo(x1, y); g.stroke();
    g.fillStyle = `rgba(${rgb},${a})`; g.fillRect(x1 - 1.5, y - amp * 1.3, 3, amp * 2.6);     // end plate
  }
  function sectionTitle(s, text, a, rgb = C.muted) {
    if (a <= 0) return;
    const fs = Math.round(clamp(s.W / 58, 12, 19));
    const w = rich(s, text, L.pad, L.secY, fs, 0.95 * a, (z) => D.sans(z, 600), rgb, 'left');
    D.line(s, L.pad, L.secY + fs * 0.9, L.pad + w, L.secY + fs * 0.9, rgb, 0.35 * a, 1);
  }

  // ---------- the air track ----------
  function drawTrack(s, a) {
    if (a <= 0) return;
    const { g } = s, y = L.trackY, x0 = 0, x1 = s.W, th = L.beam;     // the track runs on past both edges
    g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'source-over';
    const fl = g.createLinearGradient(0, y + th, 0, y + th + L.unit * 1.2);           // soft reflection on the bench
    fl.addColorStop(0, 'rgba(120,140,220,0.12)'); fl.addColorStop(1, 'rgba(120,140,220,0)');
    g.fillStyle = fl; g.fillRect(x0, y + th, x1 - x0, L.unit * 1.2);
    const bg = g.createLinearGradient(0, y, 0, y + th);
    bg.addColorStop(0, '#c9d2e6'); bg.addColorStop(0.3, '#7c879f'); bg.addColorStop(1, '#1c2232');
    g.fillStyle = bg; g.fillRect(x0, y, x1 - x0, th);
    g.fillStyle = 'rgba(12,16,28,0.75)';
    const step = Math.max(9, L.unit * 0.22);
    for (let x = x0 + step / 2; x < x1; x += step) { g.beginPath(); g.arc(x, y + th * 0.38, Math.max(0.8, th * 0.09), 0, 7); g.fill(); }
    g.restore();
  }
  function drawGlider(s, x, w, rgb, label, a) {
    if (a <= 0) return;
    const { g } = s, h = L.gh, y1 = L.trackY - L.air, y0 = y1 - h, r = h * 0.28;
    g.save(); g.globalAlpha = a;
    // the air cushion: a faint shimmer under the glider
    g.globalCompositeOperation = 'lighter';
    const ag = g.createLinearGradient(0, y1, 0, L.trackY);
    ag.addColorStop(0, `rgba(${rgb},0.35)`); ag.addColorStop(1, `rgba(${rgb},0.05)`);
    g.fillStyle = ag; g.fillRect(x - w / 2 + 3, y1, w - 6, L.air);
    g.globalCompositeOperation = 'source-over';
    rr(g, x - w / 2, y0, w, h, r);
    const body = g.createLinearGradient(0, y0, 0, y1);
    body.addColorStop(0, '#eef2fa'); body.addColorStop(0.35, '#a4aec4'); body.addColorStop(0.75, '#4a5468'); body.addColorStop(1, '#232938');
    g.fillStyle = body; g.shadowColor = `rgba(${rgb},0.75)`; g.shadowBlur = Math.max(8, h * 0.45); g.fill(); g.shadowBlur = 0;
    g.strokeStyle = `rgba(${rgb},0.95)`; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = `rgba(${rgb},0.9)`; g.fillRect(x - w / 2 + 3, y0 + h * 0.62, w - 6, h * 0.13);
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x - w / 2 + r, y0 + 1.5); g.lineTo(x + w / 2 - r, y0 + 1.5); g.stroke();
    g.restore();
    const fz = Math.round(clamp(h * 0.36, 10, 17));
    D.text(s, label, x, y0 + h * 0.34, fz, a, D.sans(fz, 700), '18,24,40');
  }

  // A panel of momentum arrows: rows = [{ label, rgb, val, txt }], drawn from a zero line.
  function panel(s, a, header, rows, min, max, valW, y0 = L.panY) {
    if (a <= 0) return y0;
    const fs = L.fs, x0 = L.px0, x1 = L.px1, labW = fs * 4.6;
    const bx0 = x0 + labW, bx1 = x1 - valW, k = (bx1 - bx0) / (max - min), zx = bx0 - min * k;
    D.text(s, header, x0, y0, fs, 0.75 * a, D.sans(fs), C.muted, 'left');
    const yTop = y0 + L.rowH * 0.5, yBot = y0 + L.rowH * (rows.length + 0.5);
    D.line(s, zx, yTop, zx, yBot, C.muted, 0.45 * a, 1, [3, 4]);
    rows.forEach((r, i) => {
      const y = y0 + L.rowH * (i + 1);
      if (r.total) D.line(s, x0, y - L.rowH * 0.5, x1, y - L.rowH * 0.5, C.muted, 0.18 * a);
      D.text(s, r.label, x0, y, fs, 0.9 * a, D.sans(fs, 600), r.rgb, 'left');
      const ex = zx + r.val * k;
      if (Math.abs(ex - zx) > 3) D.arrow(s, zx, y, ex, y, r.rgb, a, '', { width: r.total ? 5 : 4, head: Math.max(9, fs * 0.8), blur: 12 });
      else D.glowDot(s, zx, y, 9, r.rgb, 0.7 * a);
      D.text(s, r.txt, x1, y, fs, a, D.sans(fs, 600), r.rgb, 'right');
    });
    return yBot;
  }

  // ---------- one air-track scene ----------
  function drawPart(s, t, P, a) {
    if (a <= 0) return;
    const tau = clamp((t - P.tc) / L.SLOW, P.tmin, P.tmax), st = stateAt(P, tau), u = L.unit;
    const X = (x) => s.W / 2 + (x - P.centre) * u;
    const xa = X(st.xA), xb = X(st.xB), wa = P.wA * u, wb = P.wB * u, faceA = xa + wa / 2, faceB = xb - wb / 2;
    const gap = gapOf(P, st), ymid = L.trackY - L.air - L.gh * 0.5, amp = L.gh * 0.16;
    // what sits between the gliders
    if (P.mode === 'bumper') coil(s, faceA, faceA + Math.min(BUMP, gap) * u, ymid, amp, 4, a);
    if (P.mode === 'sticky') {
      const sq = Math.max(0, 2 * PAD - gap), th = (PAD - sq / 2) * u, ph = L.gh * 0.7, py = ymid - ph / 2;
      s.g.save(); s.g.globalAlpha = a; s.g.fillStyle = '#b98aa8';
      s.g.fillRect(faceA, py, th, ph); s.g.fillRect(faceB - th, py, th, ph);
      s.g.fillStyle = 'rgba(60,30,50,0.6)';
      for (let k = 0; k < 6; k++) { s.g.fillRect(faceA + th * 0.45, py + ph * (k + 0.3) / 6, th * 0.5, 1); s.g.fillRect(faceB - th * 0.95, py + ph * (k + 0.5) / 6, th * 0.5, 1); }
      s.g.restore();
    }
    if (P.mode === 'spring') {
      coil(s, faceA, faceA + Math.min(SPR_L0, gap) * u, ymid, amp * 1.2, 6, a);
      if (t < P.tc) D.line(s, xa, L.trackY - L.air - L.gh - 3, xb, L.trackY - L.air - L.gh - 3, '235,235,255', 0.75 * a, 1.2);  // the thread
      const sp = fade(t, P.tc - 0.05, P.tc + 0.7, 0.05, 0.6);
      D.glowDot(s, (xa + xb) / 2, L.trackY - L.air - L.gh - 3, L.gh * 0.9, C.light, sp * a);
    }
    drawGlider(s, xa, wa, COL_A, '2.0 kg', a);
    drawGlider(s, xb, wb, COL_B, '1.0 kg', a);
    // heat and sound where the sticky pads meet
    if (P.mode === 'sticky' && tau > 0) {
      const jx = (faceA + faceB) / 2, flick = 0.85 + 0.15 * Math.sin(s.clock * 9);
      D.glowDot(s, jx, ymid, L.gh * (0.9 + 1.4 * st.glow), HEAT, Math.min(1, st.glow * 1.3) * flick * a);
      for (let k = 0; k < 3; k++) {
        const age = tau - k * 0.05; if (age <= 0 || age > 0.45) continue;
        s.g.strokeStyle = `rgba(230,235,255,${0.5 * (1 - age / 0.45) * a})`; s.g.lineWidth = 1.4;
        s.g.beginPath(); s.g.arc(jx, ymid, age * u * 3 + 6, -Math.PI * 0.82, -Math.PI * 0.18); s.g.stroke();
      }
    }
    // velocity arrows and values above the gliders (the 1.0 kg glider's label lifts when they would overlap)
    const fs = L.fs, kv = u * L.KV, yA = L.trackY - L.air - L.gh - fs * 0.95;
    const labW = fs * 5.2, need = clamp(((xa + labW / 2) - (xb - labW / 2) + 4) / (fs * 1.5), 0, 1), yB = yA - need * fs * 2.4;
    for (const [x, v, y, rgb] of [[xa, st.vA, yA, COL_A], [xb, st.vB, yB, COL_B]]) {
      if (Math.abs(v) > 0.02) D.arrow(s, x, y, x + v * kv, y, C.vel, a, '', { width: 2.4, head: 9, blur: 8 });
      D.text(s, Math.abs(v) > 0.02 ? `${fmt1(v)} m s⁻¹` : 'at rest', x + (Math.abs(v) > 0.02 ? v * kv / 2 : 0), y - fs * 1.05, fs, 0.95 * a, D.sans(fs), C.vel);
    }
    // the momentum panel
    const pA = P.mA * st.vA, pB = P.mB * st.vB, tot = pA + pB;
    const yEnd = panel(s, a, 'momentum, p = mv / kg m s⁻¹', [
      { label: '2.0 kg', rgb: COL_A, val: pA, txt: fmt1(pA) },
      { label: '1.0 kg', rgb: COL_B, val: pB, txt: fmt1(pB) },
      { label: 'total', rgb: C.white, val: tot, txt: fmt1(tot), total: true },
    ], -3.6, 6.6, L.fs * 3.4);
    // kinetic energy, or the prediction prompt
    const yE = yEnd + fs * 1.3, r = P.sim;
    if (P.predict && t >= P.predict[0] - 0.3 && t < P.tc) {
      const pa = fade(t, P.predict[0], P.tc, 0.5, 0.4) * (0.75 + 0.25 * Math.sin(s.clock * 4));
      D.text(s, 'Total momentum afterwards = ?', L.px0, yE, fs, pa * a, D.sans(fs, 600), C.light, 'left');
    } else if (t >= P.tc - 0.2 || !P.predict) {
      const done = tau >= r.done, ea = fade(t, P.t0 + 0.6, P.fout, 0.6, 0.7);
      const fE = (x) => (Math.abs(x) < 0.005 ? '0' : x.toFixed(P.ekd));
      const txt = `Kinetic energy: ${fE(r.ekBefore)} J before` + (done ? `  →  ${fE(r.ekAfter)} J after` : '');
      s.g.font = D.sans(fs);
      const lines = s.g.measureText(txt).width > L.px1 - L.px0 && done ? [`Kinetic energy: ${fE(r.ekBefore)} J before`, `→ ${fE(r.ekAfter)} J after`] : [txt];
      D.text(s, lines, L.px0, yE, fs, 0.85 * ea * a, D.sans(fs), C.text, 'left');
      if (P.mode === 'sticky' && done) {
        D.text(s, `${(r.ekBefore - r.ekAfter).toFixed(1)} J → thermal energy and sound`, L.px0, yE + fs * 1.3 * lines.length, fs, 0.9 * a * smooth((tau - r.done) / 0.1), D.sans(fs, 600), HEAT, 'left');
      }
    }
  }

  // ---------- the rocket ----------
  // Pointing along +x in its own frame; length Lr; ang rotates it; opt: flame (0–1), fuel (0–1 for a cut-away tank).
  function drawRocket(s, cx, cy, Lr, ang, a, opt = {}) {
    if (a <= 0) return;
    const { g } = s, R = 0.085 * Lr, X = (u) => u * Lr;
    g.save(); g.translate(cx, cy); g.rotate(ang); g.globalAlpha = a; g.globalCompositeOperation = 'source-over';
    // flame behind the nozzle
    if (opt.flame > 0) {
      g.globalCompositeOperation = 'lighter';
      const fl = X(0.3 + 0.05 * Math.sin(s.clock * 31) + 0.03 * Math.sin(s.clock * 17)) * opt.flame;
      const fg = g.createLinearGradient(X(-0.5), 0, X(-0.5) - fl, 0);
      fg.addColorStop(0, 'rgba(255,255,240,0.95)'); fg.addColorStop(0.25, 'rgba(255,210,120,0.75)'); fg.addColorStop(1, 'rgba(255,120,40,0)');
      g.fillStyle = fg; g.beginPath(); g.moveTo(X(-0.5), -R * 0.78);
      g.quadraticCurveTo(X(-0.5) - fl * 0.5, -R * 0.9, X(-0.5) - fl, 0); g.quadraticCurveTo(X(-0.5) - fl * 0.5, R * 0.9, X(-0.5), R * 0.78); g.fill();
      g.globalCompositeOperation = 'source-over';
    }
    // fins
    const fin = g.createLinearGradient(0, -R * 2.3, 0, R * 2.3);
    fin.addColorStop(0, '#3d4660'); fin.addColorStop(0.5, '#8a93ab'); fin.addColorStop(1, '#2b3246');
    g.fillStyle = fin; g.strokeStyle = 'rgba(143,184,255,0.7)'; g.lineWidth = 1.2;
    for (const k of [-1, 1]) {
      g.beginPath(); g.moveTo(X(-0.2), k * R); g.lineTo(X(-0.39), k * (R + X(0.11))); g.lineTo(X(-0.46), k * (R + X(0.11)));
      g.lineTo(X(-0.43), k * R); g.closePath(); g.fill(); g.stroke();
    }
    // nozzle bell
    const nz = g.createLinearGradient(0, -R, 0, R);
    nz.addColorStop(0, '#6a7288'); nz.addColorStop(0.5, '#2a3042'); nz.addColorStop(1, '#151925');
    g.fillStyle = nz; g.beginPath(); g.moveTo(X(-0.43), -R * 0.55); g.lineTo(X(-0.5), -R * 0.82); g.lineTo(X(-0.5), R * 0.82); g.lineTo(X(-0.43), R * 0.55); g.closePath(); g.fill();
    // body and nose cone
    g.beginPath(); g.moveTo(X(-0.44), -R); g.lineTo(X(0.18), -R);
    g.bezierCurveTo(X(0.34), -R, X(0.46), -R * 0.42, X(0.5), 0); g.bezierCurveTo(X(0.46), R * 0.42, X(0.34), R, X(0.18), R);
    g.lineTo(X(-0.44), R); g.closePath();
    const body = g.createLinearGradient(0, -R, 0, R);
    body.addColorStop(0, '#c8d0e0'); body.addColorStop(0.28, '#ffffff'); body.addColorStop(0.62, '#8c96ab'); body.addColorStop(1, '#353c4e');
    g.fillStyle = body; g.shadowColor = 'rgba(160,190,255,0.55)'; g.shadowBlur = Math.max(8, R * 0.9); g.fill(); g.shadowBlur = 0;
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1; g.stroke();
    // cut-away fuel tank
    if (opt.fuel !== undefined) {
      const t0 = X(-0.4), t1 = X(0.14), ih = R * 0.66;
      g.fillStyle = 'rgba(6,8,18,0.88)'; g.fillRect(t0, -ih, t1 - t0, 2 * ih);
      const lvl = t0 + (t1 - t0) * clamp(opt.fuel, 0, 1);
      const fg = g.createLinearGradient(t0, 0, t1, 0);
      fg.addColorStop(0, 'rgba(255,170,70,0.95)'); fg.addColorStop(1, 'rgba(255,220,120,0.95)');
      g.fillStyle = fg; g.fillRect(t0, -ih, lvl - t0, 2 * ih);
      g.strokeStyle = 'rgba(255,214,102,0.8)'; g.lineWidth = 1.2; g.strokeRect(t0, -ih, t1 - t0, 2 * ih);
      g.fillStyle = 'rgba(240,244,255,0.95)'; g.fillRect(X(0.19), -R * 0.5, X(0.1), R);        // payload
    } else {
      // window and stripes
      g.fillStyle = 'rgba(143,184,255,0.9)'; g.fillRect(X(-0.32), -R, X(0.025), 2 * R); g.fillRect(X(0.12), -R, X(0.018), 2 * R);
      const wr = R * 0.42, wg = g.createRadialGradient(X(0.03) - wr * 0.3, -wr * 0.3, 0, X(0.03), 0, wr);
      wg.addColorStop(0, '#d6e6ff'); wg.addColorStop(1, '#1d3358');
      g.fillStyle = wg; g.beginPath(); g.arc(X(0.03), 0, wr, 0, 7); g.fill();
      g.strokeStyle = '#4a556d'; g.lineWidth = Math.max(1.2, R * 0.12); g.stroke();
    }
    g.restore();
  }
  function drawStars(s, t, a) {
    if (a <= 0) return;
    const { g, W, H } = s, off = offAt(t) * (W / 960), sp = drift(RV[puffsAt(burnTau(t))]) * (W / 960);
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (const st of stars) {
      const x = (((st.x * (W + 60) - off * st.z) % (W + 60)) + (W + 60)) % (W + 60) - 30, y = st.y * H;
      const al = (0.2 + 0.45 * st.b) * (0.75 + 0.25 * Math.sin(s.clock * 1.4 + st.ph)) * a * st.z, len = sp * st.z * 0.035 * (1 - smooth((t - 87.6) / 1));
      g.strokeStyle = `rgba(200,212,255,${al})`; g.lineWidth = 0.8 + st.z;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + len + 0.1, y); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
  }
  function drawRocketPart(s, t, a) {
    if (a <= 0) return;
    const { cx, cy, Lr } = L.rk, R = 0.085 * Lr, nx = cx - Lr / 2, fs = L.fs;
    const tau = burnTau(t), n = puffsAt(tau);
    // slow-motion puffs, one at a time
    const ug = s.W * 0.085;
    for (let k = 0; k < 4; k++) {
      const tk = R1_T0 + k * R1_GAP, age = t - tk; if (age < 0) continue;
      const al = clamp(1 - age / 9, 0, 1) * a * (1 - smooth((t - R2_T0) / 1.5));
      if (al <= 0) continue;
      D.glowDot(s, nx, cy, R * 3.2, C.light, Math.exp(-age * 4) * a);
      for (const b of puffBits) {
        const d = age * ug * b.sp, ang = Math.PI + b.an;
        D.glowDot(s, nx + Math.cos(ang) * d, cy + Math.sin(ang) * d * 0.6, b.r * (3 + age * 0.6), GAS, al * 0.7);
      }
      // equal and opposite momentum arrows for this puff (one puff = 75 000 kg m s⁻¹), just below the rocket
      const aa = fade(t, tk + 0.15, tk + 2.0, 0.25, 0.4) * a, len = Math.min(Lr * 0.34, s.W * 0.14), pcx = nx - age * ug;
      const ay = cy + R + fs * 0.9;
      if (aa > 0) {
        D.arrow(s, pcx, ay, pcx - len, ay, GAS, aa, '', { width: 3.2, head: 10 });
        D.text(s, `${MINUS}75 000`, pcx - len / 2, ay + fs * 1.1, fs, aa, D.sans(fs, 600), GAS);
        D.arrow(s, cx - Lr * 0.12, ay, cx - Lr * 0.12 + len, ay, ROCK, aa, '', { width: 3.2, head: 10 });
        D.text(s, '+75 000', cx - Lr * 0.12 + len / 2, ay + fs * 1.1, fs, aa, D.sans(fs, 600), ROCK);
      }
    }
    // continuous exhaust (time-lapse)
    const flame = fade(t, R2_T0 - 0.1, R2_T1 + 0.1, 0.3, 0.25) * a;
    if (flame > 0) {
      const pc = s.clock, ug2 = s.W * 0.55, life = 0.9, EM = 0.008;
      for (let e = Math.floor((pc - life) / EM); e <= Math.floor(pc / EM); e++) {
        const age = pc - e * EM; if (age < 0 || age > life) continue;
        const r1 = hash(e), r2 = hash(e + 0.5), d = age * ug2 * (0.8 + 0.4 * r1);
        D.glowDot(s, nx - d, cy + (r2 - 0.5) * (R * 1.2 + d * 0.22), 3 + 5 * age, GAS, (1 - age / life) ** 2 * 0.55 * flame);
      }
    }
    drawRocket(s, cx, cy, Lr, 0, a, { flame });
    // thrust arrow ahead of the nose
    const ta = fade(t, R2_T0 + 0.3, 88.0, 0.5, 0.6) * (t < R2_T1 + 0.2 ? 1 : 1 - smooth((t - R2_T1 - 0.2) / 0.4)) * a;
    if (ta > 0) {
      const x0 = cx + Lr / 2 + 6, x1 = x0 + Math.min(Lr * 0.32, s.W - L.pad - x0 - fs * 1.2);
      D.arrow(s, x0, cy, x1, cy, THRUST, ta, 'F', { width: 3.4, head: 12 });
      D.text(s, 'thrust', (x0 + x1) / 2, cy - fs * 1.2, fs, ta, D.sans(fs, 600), THRUST);
    }
    // puff by puff: momentum of the gas, the rocket and the total
    const pa = fade(t, R1_T0 - 0.4, R2_T0 + 0.4, 0.6, 0.6) * a;
    if (pa > 0) {
      const pr = RM[n] * RV[n], pg = GAS_P[n], U = DM * VE;
      const yEnd = panel(s, pa, 'momentum / kg m s⁻¹', [
        { label: 'gas', rgb: GAS, val: pg / U, txt: fmtBig(pg) },
        { label: 'rocket', rgb: ROCK, val: pr / U, txt: fmtBig(pr) },
        { label: 'total', rgb: C.white, val: (pr + pg) / U, txt: fmtBig(pr + pg), total: true },
      ], -4.6, 4.6, fs * 5.6, L.rk.bottom + fs * 2.6);
      D.text(s, `puffs of gas so far: ${n}`, L.px0, yEnd + fs * 1.3, fs, 0.75 * pa, D.sans(fs), C.muted, 'left');
    }
    // the thrust equation, then readouts during the burn
    const ea = fade(t, 77.3, 88.0, 0.7, 0.6) * a, z = Math.round(clamp(s.W / 34, 17, 34));
    let y = L.rk.bottom + z * 0.9;
    if (L.phone) {
      rich(s, 'F = Δp / Δt = v_{e} (Δm / Δt)', s.W / 2, y, z, ea, serifF);
      y += z * 1.3;
      rich(s, '!{= 3000 × 250 = 7.5 × 10}^{5}!{ N}', s.W / 2, y, z, ea, serifF);
    } else rich(s, 'F = Δp / Δt = v_{e} (Δm / Δt) !{= 3000 × 250 = 7.5 × 10}^{5}!{ N}', s.W / 2, y, z, ea, serifF);
    const ra = fade(t, R2_T0 + 0.2, 88.0, 0.6, 0.6) * a;
    if (ra > 0) {
      const m = RM[n], v = RV[n], acc = THRUST_N / m, tot = m * v + GAS_P[n];
      const cells = [['burn time (speeded up)', `${Math.round(Math.max(0, tau))} s`], ['mass, m', `${group(Math.round(m / 100) * 100)} kg`],
        ['speed, v', `${group(Math.round(v / 10) * 10)} m s⁻¹`], ['acceleration, a = F/m', `${acc.toFixed(1)} m s⁻²`]];
      const colW = (L.px1 - L.px0) / 2, y0 = y + z * 1.25;
      cells.forEach(([lab, val], i) => {
        const x = L.px0 + (i % 2) * colW, yy = y0 + Math.floor(i / 2) * fs * 2.9;
        D.text(s, lab, x, yy, fs * 0.9, 0.7 * ra, D.sans(Math.round(fs * 0.9)), C.muted, 'left');
        D.text(s, val, x, yy + fs * 1.25, Math.round(fs * 1.2), ra, D.sans(Math.round(fs * 1.2), 600), i === 3 ? THRUST : C.text, 'left');
      });
      D.text(s, `total momentum of rocket + gas = ${fmtBig(tot)}`, L.px0, y0 + fs * 6.2, fs, 0.85 * ra, D.sans(fs, 600), C.white, 'left');
    }
  }

  // ---------- going further: the rocket equation ----------
  function drawFurther(s, t, a) {
    if (a <= 0) return;
    const { W, H } = s, ph = L.phone, fs = L.fs;
    const f = smooth((t - G_T0) / (G_T1 - G_T0)), dv = DV_ORBIT * f, mm = Math.exp(-dv / VE_KM), fuel = (mm - MF) / (1 - MF);
    const upright = (z2) => D.serif(z2, false), bold = (z2) => D.sans(z2, 600);
    // the card (right-hand side; across the top on phones)
    const cx = ph ? W / 2 : W * 0.7, z = Math.round(clamp(W / 30, 20, 40));
    let y = ph ? L.secY + fs * 2.4 : Math.max(L.secY + fs * 0.4, H * 0.16);
    const ba = fade(t, 88.0, 104, 0.6, 0.6) * a;
    { // badge
      const g = s.g, bt = 'BEYOND THE IB SYLLABUS', bz = Math.round(fs * 0.85);
      g.font = D.sans(bz, 700); const bw = g.measureText(bt).width + bz * 1.6;
      g.globalAlpha = ba; rr(g, cx - bw / 2, y - bz, bw, bz * 2, bz); g.strokeStyle = `rgba(${C.light},0.9)`; g.lineWidth = 1.4; g.stroke(); g.globalAlpha = 1;
      D.text(s, bt, cx, y, bz, ba, D.sans(bz, 700), C.light);
    }
    y += z * 1.5;
    rich(s, 'Δv = v_{e} !{ln}(m_{0} / m_{f})', cx, y, z, ba, serifF);
    y += z * 1.05;
    if (!ph) { rich(s, 'v_{e} = exhaust speed,  m_{0} = starting mass,  m_{f} = final mass', cx, y, fs * 0.9, 0.7 * ba, sansF, C.muted); y += fs * 2; }
    else y += fs * 0.3;
    const ca = fade(t, 88.6, 104, 0.6, 0.6) * a;
    rich(s, 'Check: 3000 × ln(50 000 ÷ 20 000) = 2750 m s⁻¹', cx, y, Math.round(fs * 1.1), ca, upright);
    y += fs * 1.4;
    rich(s, 'the same as the step-by-step simulation', cx, y, fs * 0.9, 0.75 * ca, sansF, C.good);
    y += ph ? fs * 2.0 : fs * 2.6;
    const oa = fade(t, 93.2, 104, 0.6, 0.6) * a;
    rich(s, 'm_{0} / m_{f} = !{e}^{9.4 / 3.0}!{ ≈ 23}', cx, y, Math.round(z * 0.8), oa, serifF, C.light);
    // the rocket with a cut-away tank, and its mass as a bar
    const Lv = ph ? 120 : H * 0.56, rx = ph ? W * 0.12 : W * 0.09;
    const bottom = ph ? H - fs * 9 : H * 0.78, rcy = bottom - Lv / 2, va = fade(t, 88.2, 104, 0.8, 0.6) * a;
    drawRocket(s, rx, rcy, Lv, -Math.PI / 2, va, { fuel, flame: (f > 0 && f < 1 ? 0.6 : 0) });
    const bx = ph ? W * 0.24 : W * 0.17, bw = ph ? 16 : clamp(W * 0.03, 14, 34), top = bottom - Lv, hNow = Lv * mm, g = s.g;
    g.globalAlpha = va;
    g.setLineDash([4, 4]); g.strokeStyle = 'rgba(255,214,102,0.5)'; g.lineWidth = 1.2; g.strokeRect(bx, top, bw, Lv); g.setLineDash([]);
    const dryH = Lv * MF;
    g.fillStyle = 'rgba(255,196,90,0.9)'; g.fillRect(bx, bottom - hNow, bw, hNow - dryH);
    g.fillStyle = 'rgba(240,244,255,0.95)'; g.fillRect(bx, bottom - dryH, bw, dryH);
    g.globalAlpha = 1;
    if (!ph) D.text(s, 'mass', bx + bw / 2, top - fs * 1.0, fs * 0.9, 0.75 * va, D.sans(Math.round(fs * 0.9)), C.muted);
    // counters: under the card (beside the bar on phones)
    const ka = fade(t, G_T0 - 0.2, 104, 0.5, 0.6) * a, lx = bx + bw + fs * 0.9;
    const kx = ph ? lx : cx, ky = ph ? top + fs * 0.6 : y + fs * 3, kal = ph ? 'left' : 'center';
    rich(s, `Δv = ${dv.toFixed(1)} km s⁻¹`, kx, ky, Math.round(fs * 1.25), ka, bold, C.text, kal);
    rich(s, `mass left: ${Math.round(mm * 100)} % of the launch mass`, kx, ky + fs * 1.6, fs * 0.9, 0.8 * ka, sansF, C.muted, kal);
    // the answer: about 96 % propellant
    const la = fade(t, 98.4, 104, 0.6, 0.6) * a;
    rich(s, `propellant ≈ ${Math.round((1 - MF) * 100)} %`, lx, top + Lv * 0.55, Math.round(fs * 1.1), la, bold, C.light, 'left');
    rich(s, `rocket + payload ≈ ${Math.round(MF * 100)} %`, lx, bottom - fs * 0.5, fs, la, sansF, C.text, 'left');
  }

  // ---------- closing card ----------
  function frac(s, x, y, num, den, z, a) {   // a fraction centred at x; returns its width
    const { g } = s; g.font = D.serif(z); const w = Math.max(g.measureText(num).width, g.measureText(den).width) + z * 0.3;
    D.text(s, num, x, y - z * 0.62, z, a, D.serif(z)); D.text(s, den, x, y + z * 0.62, z, a, D.serif(z));
    D.line(s, x - w / 2, y, x + w / 2, y, C.text, a, Math.max(1.5, z * 0.06)); return w;
  }
  function drawEnd(s, t) {
    const ea = fade(t, 103.6, 110.4, 0.9, 0.8); if (ea <= 0) return;
    const { W, H, g } = s;
    g.fillStyle = `rgba(4,6,13,${0.55 * ea})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 24, 24, 52)), s2 = Math.round(clamp(W / 50, 14, 22)), s3 = Math.round(clamp(W / 20, 28, 60));
    g.font = D.sans(s1, 300); const l1 = D.wrap(s, 'Total momentum is conserved', W - 48);
    const y1 = H * (L.phone ? 0.28 : 0.3);
    D.text(s, l1, W / 2, y1, s1, ea, D.sans(s1, 300));
    g.font = D.sans(s2); const l2 = D.wrap(s, 'when no resultant external force acts on the system', Math.min(W - 48, 700));
    D.text(s, l2, W / 2, y1 + s1 * (0.5 + l1.length * 1.05), s2, 0.8 * ea, D.sans(s2));
    const ye = H * (L.phone ? 0.6 : 0.62);
    D.text(s, 'p = mv', W * (L.phone ? 0.27 : 0.36), ye, s3, ea, D.serif(s3));
    g.font = D.serif(s3); const fw = g.measureText('F = ').width, fx = W * (L.phone ? 0.64 : 0.6);
    D.text(s, 'F =', fx - fw * 0.15, ye, s3, ea, D.serif(s3), C.text, 'right');
    frac(s, fx + s3 * 0.85, ye, 'Δp', 'Δt', s3 * 0.85, ea);
  }

  const CAPS = [
    [4.2, 9.2, 'Two gliders on a frictionless air track. Momentum p = mv, and to the right is positive.'],
    [9.4, 12.6, 'Predict: after they collide, what will the total momentum be?'],
    [12.9, 17.9, 'Still 6.0 kg m s⁻¹. In the collision, one glider loses exactly the momentum the other gains.'],
    [18.1, 23.1, 'Kinetic energy is 9.0 J before and 9.0 J after. None is lost, so the collision is elastic.'],
    [24.2, 29.2, 'Now the gliders have sticky pads, so they join together when they collide.'],
    [30.3, 35.3, 'Momentum is still 6.0 kg m s⁻¹, so the joined 3.0 kg moves at 6.0 ÷ 3.0 = 2.0 m s⁻¹.'],
    [35.5, 40.5, 'Kinetic energy falls from 9.0 J to 6.0 J: 3.0 J becomes thermal energy and sound. The collision is inelastic.'],
    [41.6, 46.6, 'An explosion: both gliders start at rest, held together against a squashed spring.'],
    [46.8, 49.8, 'Predict: the total momentum is zero now. What will it be after they fly apart?'],
    [50.2, 55.2, 'Still zero: 2.0 × (−1.5) + 1.0 × 3.0 = 0. The two momenta are equal and opposite.'],
    [55.4, 60.4, 'Kinetic energy rises from 0 to 6.75 J. It comes from the elastic energy stored in the spring.'],
    [61.5, 66.5, 'A rocket doesn’t need anything to push against: it pushes gas backwards, and the gas pushes it forwards.'],
    [66.7, 71.7, 'Each 25 kg puff of gas leaves at 3000 m s⁻¹ relative to the rocket, carrying 25 × 3000 = 75 000 kg m s⁻¹ backwards.'],
    [71.9, 76.9, 'For each of these puffs, the rocket gains the same momentum forwards, so the total momentum stays zero.'],
    [77.3, 82.3, 'Firing 250 kg of gas per second at 3000 m s⁻¹ gives a thrust F = Δp/Δt = 3000 × 250 = 7.5 × 10⁵ N.'],
    [82.5, 87.3, 'The rocket gets lighter, so the same thrust gives a larger acceleration: a = F/m rises from 15 to 37.5 m s⁻².'],
    [88.0, 93.0, 'Going further (beyond the IB syllabus): adding up all the small steps gives the rocket equation.'],
    [93.2, 98.2, 'Reaching orbit needs Δv ≈ 9.4 km s⁻¹. With an exhaust speed of 3.0 km s⁻¹, the launch mass must be about 23 times the final mass.'],
    [98.4, 103.4, 'So about 96 % of a single-stage rocket’s launch mass is propellant. Only about 4 % reaches orbit.'],
  ];
  const DURATION = 110.8;

  Anim.register('momentum', {
    duration: DURATION,
    poster: 32,
    // score: bright and open (G mixolydian, a triangle pad that gently swells, a little wind)
    music: { chords: [[55, 59, 62, 65], [53, 57, 60, 64], [48, 55, 60, 64], [50, 55, 59, 62]], bar: 6, pad: 'triangle', cutoff: 900, drone: 0.09, wind: 0.2, tremolo: 0.4, volume: 0.5 },
    // hold the picture so each caption can be read (predictions get the longest holds)
    pauses: [[12.0, 3.0], [22.5, 0.8], [34.7, 0.8], [39.9, 1.0], [49.2, 3.0], [54.6, 0.8], [81.7, 1.2], [86.7, 1.2],
      [92.4, 1.5], [97.6, 1.2], [102.8, 1.0], [107.0, 1.5]],
    numbers: { parts: PARTS.map((P) => ({ key: P.key, pBefore: P.sim.pBefore, pAfter: P.sim.pAfter, vA: P.sim.vA[P.sim.n], vB: P.sim.vB[P.sim.n],
      ekBefore: P.sim.ekBefore, ekAfter: P.sim.ekAfter, heat: P.sim.heat, done: P.sim.done })),
    rocket: { thrust: THRUST_N, mEnd: RM[NPUFF], vEnd: RV[NPUFF], rocketEq: VE * Math.log(M0 / RM[NPUFF]), totalEnd: RM[NPUFF] * RV[NPUFF] + GAS_P[NPUFF],
      p1: RM[1] * RV[1], aStart: THRUST_N / RM[4], aEnd: THRUST_N / RM[NPUFF] }, orbit: { ratio: RATIO, propellant: 1 - MF } },
    resize: layout,
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, t < 61 ? 0.3 : 0.18);
      drawStars(s, t, fade(t, 60.6, 110.8, 1.2, 0.6) * (1 - 0.5 * smooth((t - 87.6) / 1)));
      drawTrack(s, fade(t, 3.0, 61.0, 1.0, 0.8));
      for (const P of PARTS) {
        const a = fade(t, P.fin, P.fout, 0.7, 0.7);
        drawPart(s, t, P, a);
        sectionTitle(s, P.title, a);
      }
      const ra = fade(t, 60.8, 88.0, 0.9, 0.8);
      drawRocketPart(s, t, ra);
      sectionTitle(s, '4 · How a rocket works', ra);
      const ga = fade(t, 87.6, 104.0, 0.8, 0.7);
      drawFurther(s, t, ga);
      sectionTitle(s, 'Going further', ga, C.light);
      D.captions(s, t, CAPS);
      if (t < 3.8) { s.g.fillStyle = `rgba(4,6,13,${0.75 * fade(t, 0, 3.6, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.3, 3.8, 'Conservation of momentum', 'Collisions, explosions and rockets');
      drawEnd(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
