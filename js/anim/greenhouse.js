/* B.2 The greenhouse effect. A slice of sky above the Earth's surface: sunlight (mostly visible) comes in,
   some is reflected (albedo), the rest warms the surface, which radiates infrared. Without greenhouse gases
   all the infrared escapes and the surface settles at 255 K; with them, infrared is absorbed and re-emitted
   in random directions, some back down, and the surface warms to a new balance at 288 K. Then a little more
   CO2 (the enhanced greenhouse effect). Energy balance from the notes' simple model (themes/b2.html §5).
   Numbers (σ = 5.67 × 10⁻⁸ W m⁻² K⁻⁴ and Wien's constant 2.9 × 10⁻³ m K from the data booklet):
   - Wien: Sun 2.9 × 10⁻³ ÷ 5800 = 5.0 × 10⁻⁷ m = 500 nm; surface 2.9 × 10⁻³ ÷ 288 = 1.007 × 10⁻⁵ m ≈ 10 µm;
     10 µm ÷ 500 nm = 20 (20 times longer).
   - S = 1360 W m⁻²; S/4 = 340; reflected 0.30 × 340 = 102 ("about 100"); absorbed 0.70 × 340 = 238.
   - No greenhouse gases: σT⁴ = 238, T⁴ = 238 ÷ 5.67 × 10⁻⁸ = 4.20 × 10⁹ K⁴, T = 254.5 ≈ 255 K = −18 °C.
   - Observed 288 K (15 °C): σT⁴ = 5.67 × 10⁻⁸ × 288⁴ = 390 W m⁻²; 288 − 255 = 33 K;
     effective emissivity 238 ÷ 390 = 0.61.
   - CO2's bending vibration: about 2 × 10¹³ Hz; c ÷ f = 3.0 × 10⁸ ÷ 2 × 10¹³ = 1.5 × 10⁻⁵ m = 15 µm.
   - Enhanced (this model): e = 0.60 instead of 0.61: T⁴ = 238 ÷ (0.60 × 5.67 × 10⁻⁸) = 7.00 × 10⁹, T = 289.2 ≈ 289 K.
   - CO2 about 280 ppm before the industrial revolution, over 420 ppm now (the notes).
   The photons, molecules and their paths are schematic: wavelengths are not to scale (infrared is drawn
   only 3 times longer than visible light, not 20), and each photon stands for a huge number of them. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const NB = (txt) => txt.replace(/~/g, ' ');

  // ---------- physics ----------
  const SIGMA = 5.67e-8, WIEN = 2.9e-3, S0 = 1360, ALB = 0.30;
  const IN = S0 / 4, REFL = ALB * IN, ABS = (1 - ALB) * IN;            // 340, 102, 238
  const T0 = Math.pow(ABS / SIGMA, 0.25);                              // 254.5 K
  const T_OBS = 288, E1 = ABS / (SIGMA * Math.pow(T_OBS, 4));          // 0.610
  const E2 = 0.60, T2 = Math.pow(ABS / (E2 * SIGMA), 0.25);            // 289.2 K

  // ---------- timeline (scene seconds; no holds: the picture keeps moving) ----------
  const T_SUN = 6, T_IR = 37.5, T_THERMO = 61.2, T_GHG0 = 78.6, T_GHG1 = 87, T_WARM = 84;
  const T_ENH0 = 144.8, T_ENH = 146, T_INSET0 = 94.8, T_INSET1 = 119.6, END_CARD = 171.6, DURATION = 184;
  // surface temperature: 255 K, then (with greenhouse gases) a smooth approach to 288 K, then to 289 K
  const Tsurf = (t) => {
    let T = t < T_WARM ? T0 : T_OBS - (T_OBS - T0) * Math.exp(-(t - T_WARM) / 7);   // in balance (within 0.5 W m⁻²) from about 122 s
    if (t > T_ENH) T += (T2 - T_OBS) * (1 - Math.exp(-(t - T_ENH) / 3));   // new balance from about 152 s
    return T;
  };
  // effective emissivity (fraction of the surface's emission that escapes to space)
  const eff = (t) => (t < 84 ? 1 : t < 90 ? lerp(1, E1, smooth((t - 84) / 6)) : t < T_ENH ? E1 : lerp(E1, E2, smooth((t - T_ENH) / 3)));

  // ---------- the world (coordinates 0–1 across the sky slice; ground at the bottom) ----------
  const SUN = { x: 0.07, y: 0.09 };
  const GROUND = (x) => 0.9 + 0.08 * (x - 0.5) * (x - 0.5);
  const ATM_TOP = 0.3;
  const CLOUD = { x: 0.43, y: 0.5, hw: 0.09, hh: 0.035 };
  const SNOW = [0.8, 0.93];
  const VV = 0.42, VI = 0.34, HOLD = 0.6;                               // photon speeds (world units per s), absorption hold

  let seed = 20261117;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };

  // molecules: nitrogen and oxygen from the start; greenhouse gases appear at T_GHG0; extra CO2 at T_ENH0
  const MOL = [];
  const place = (kind, tIn, ghg) => {
    for (let k = 0; k < 200; k++) {
      const x = 0.06 + 0.88 * rnd(), y = 0.38 + 0.42 * rnd();
      if (Math.abs(x - CLOUD.x) < CLOUD.hw + 0.05 && Math.abs(y - CLOUD.y) < CLOUD.hh + 0.05) continue;
      if (MOL.some((m) => Math.hypot(m.x0 - x, (m.y0 - y) * 1.4) < 0.09)) continue;
      MOL.push({ kind, ghg, tIn, x0: x, y0: y, ph1: rnd() * 6.28, ph2: rnd() * 6.28, ang: rnd() * 6.28, exc: [] });
      return;
    }
  };
  for (let i = 0; i < 5; i++) place('N2', -1, false);
  for (let i = 0; i < 3; i++) place('O2', -1, false);
  ['CO2', 'H2O', 'CO2', 'CH4', 'H2O', 'CO2', 'N2O', 'H2O'].forEach((k, i) => place(k, T_GHG0 + i * 0.9, true));
  for (let i = 0; i < 2; i++) place('CO2', T_ENH0 + i * 1.0, true);   // 3 CO₂ become 5: roughly the rise from 280 to 420 ppm
  const molPos = (m, t) => ({ x: m.x0 + 0.018 * Math.sin(0.31 * t + m.ph1), y: m.y0 + 0.012 * Math.sin(0.23 * t + m.ph2) });
  const molAlpha = (m, t) => (m.tIn < 0 ? 1 : smooth((t - m.tIn) / 1.5));

  // ---------- photons, worked out once (seeded), then drawn from the scene time alone ----------
  const PH = [], FLASH = [];
  const VIS_RGB = ['110,160,255', '120,230,140', '255,225,90'];       // blue, green, yellow: visible light
  const IR_RGB = '255,120,60';
  const addSeg = (p, a, x0, y0, x1, y1, v) => { const b = a + Math.hypot(x1 - x0, y1 - y0) / v; p.segs.push({ a, b, x0, y0, x1, y1 }); return b; };
  // visible light from the Sun: 15% reflected by the cloud, 15% by the snow, the rest absorbed by the ground
  for (let t = T_SUN; t < DURATION - 10; t += 0.4 + rnd() * 0.22) {
    const p = { kind: 'vis', rgb: VIS_RGB[Math.floor(rnd() * 3)], segs: [] }, r = rnd();
    if (r < 0.15) {
      const x = CLOUD.x + (rnd() - 0.5) * 1.5 * CLOUD.hw, y = CLOUD.y - CLOUD.hh * 0.6;
      const b = addSeg(p, t, SUN.x, SUN.y, x, y, VV);
      addSeg(p, b, x, y, x + 0.5, -0.12, VV);
    } else if (r < 0.3) {
      const x = lerp(SNOW[0], SNOW[1], rnd()), y = GROUND(x);
      const b = addSeg(p, t, SUN.x, SUN.y, x, y, VV);
      addSeg(p, b, x, y, x + 0.42, -0.12, VV);
    } else {
      const x = 0.14 + 0.62 * rnd(), y = GROUND(x);
      const b = addSeg(p, t, SUN.x, SUN.y, x, y, VV);
      FLASH.push({ t: b, x, kind: 'vis' });
    }
    PH.push(p);
  }
  // infrared from the ground, at a rate proportional to T⁴; absorbed by greenhouse gases with probability pAbs
  const pAbs = (te) => (te < 84 ? 0 : te < 90 ? 0.72 * smooth((te - 84) / 6) : te < 147 ? 0.72 : 0.82);
  const toEdge = (x, y, dx, dy) => {            // follow a straight line to the edge of the world (or the ground)
    for (let k = 1; k < 400; k++) {
      const xx = x + dx * k * 0.01, yy = y + dy * k * 0.01;
      if (yy >= GROUND(xx)) return { x: xx, y: GROUND(xx), ground: true };
      if (yy < -0.12 || xx < -0.12 || xx > 1.12) return { x: xx, y: yy, ground: false };
    }
    return { x: x + dx * 4, y: y + dy * 4, ground: false };
  };
  const crossesCloud = (x0, y0, x1, y1) => {
    for (let k = 0; k <= 60; k++) {
      const x = lerp(x0, x1, k / 60), y = lerp(y0, y1, k / 60);
      if (Math.abs(x - CLOUD.x) < CLOUD.hw * 1.25 && Math.abs(y - CLOUD.y) < CLOUD.hh * 1.8) return true;
    }
    return false;
  };
  for (let te = T_IR; te < DURATION - 10;) {
    const rate = 2.6 * Math.pow(Tsurf(te) / T0, 4);
    const p = { kind: 'ir', rgb: IR_RGB, segs: [] };
    const ghgs = MOL.filter((m) => m.ghg && m.tIn + 1.2 < te);
    if (ghgs.length && rnd() < pAbs(te)) {
      const m = ghgs[Math.floor(rnd() * ghgs.length)];
      let aim = molPos(m, te + 1.6), x = clamp(aim.x + (rnd() - 0.5) * 0.24, 0.04, 0.96), y = GROUND(x);
      let ta = te + Math.hypot(aim.x - x, aim.y - y) / VI;
      aim = molPos(m, ta); ta = te + Math.hypot(aim.x - x, aim.y - y) / VI; aim = molPos(m, ta);
      addSeg(p, te, x, y, aim.x, aim.y, VI);
      p.segs[0].b = ta;
      m.exc.push([ta, ta + HOLD]);
      const from = molPos(m, ta + HOLD), th = rnd() * Math.PI * 2, dx = Math.cos(th), dy = Math.sin(th);
      p.segs.push({ a: ta, b: ta + HOLD, x0: aim.x, y0: aim.y, x1: from.x, y1: from.y, hidden: true });
      const e = toEdge(from.x, from.y, dx, dy);
      const b = addSeg(p, ta + HOLD, from.x, from.y, e.x, e.y, VI);
      if (e.ground) FLASH.push({ t: b, x: e.x, kind: 'ir' });
    } else {
      // escaping infrared is drawn missing the cloud (real clouds absorb infrared too)
      let x, y, th, e;
      for (let k = 0; k < 30; k++) {
        x = 0.04 + 0.92 * rnd(); y = GROUND(x); th = -Math.PI / 2 + (rnd() - 0.5) * 0.7;
        e = toEdge(x, y - 0.001, Math.cos(th), Math.sin(th));
        if (!crossesCloud(x, y, e.x, e.y)) break;
      }
      addSeg(p, te, x, y, e.x, e.y, VI);
    }
    PH.push(p);
    te += (0.6 + 0.8 * rnd()) / rate;
  }
  const excited = (m, t) => { let a = 0; for (const [p, q] of m.exc) if (t > p - 0.05 && t < q + 0.25) a = Math.max(a, fade(t, p - 0.05, q + 0.25, 0.08, 0.25)); return a; };

  // ---------- captions ----------
  const CAPS = [
    [4.8, 13.4, 'The Sun\'s surface is about 5800 K. Wien\'s law: λmax = 2.9~×~10⁻³ ÷ 5800 = 5.0~×~10⁻⁷~m = 500~nm, so sunlight is mostly visible light.'],
    [13.6, 23.0, 'Above the atmosphere its intensity is the solar constant, S = 1360~W~m⁻². Shared over the whole spinning Earth, the average is S/4 = 340~W~m⁻².'],
    [23.2, 32.6, 'Some is reflected or scattered back to space by clouds, air, ice and the ground. The Earth\'s albedo is about 0.30: 0.30 × 340 = 102, about 100~W~m⁻².'],
    [32.8, 39.0, 'The rest, (1 − 0.30) × 340 = 238~W~m⁻², is absorbed and warms the surface.'],
    [39.2, 49.4, 'The warm surface radiates infrared. For the real surface, about 288~K, Wien\'s law gives a peak at 2.9~×~10⁻³ ÷ 288 = 10~µm: 20 times longer than the Sun\'s 500~nm peak.'],
    [49.6, 61.0, 'Predict: if the air had no greenhouse gases, what would the average surface temperature be?'],
    [61.2, 70.2, 'Treating the surface as a black body (e = 1), in balance σT⁴ = 238, so T⁴ = 4.20~×~10⁹~K⁴ and T = 255~K, about −18~°C.'],
    [70.4, 78.4, 'Here every infrared photon escapes to space. But the real average surface temperature is about 288~K (15~°C): 33~K warmer.'],
    [78.6, 87.0, 'The difference is the greenhouse effect. Add the greenhouse gases: water vapour, carbon dioxide, methane and nitrous oxide.'],
    [87.2, 94.6, 'Nitrogen and oxygen, 99% of dry air, hardly absorb infrared. Visible light passes through all of these gases.'],
    [94.8, 103.0, 'An infrared photon is absorbed when its frequency matches a natural frequency of the molecule\'s vibrations: resonance.'],
    [103.2, 111.6, 'CO₂\'s bending vibration has a natural frequency of about 2~×~10¹³~Hz, matching infrared of 3.0~×~10⁸ ÷ 2~×~10¹³ = 15~µm.'],
    [111.8, 119.6, 'The molecule then re-emits infrared in a random direction, or shares the energy with other molecules in collisions.'],
    [119.8, 128.0, 'Some infrared escapes to space, but much is sent back down. The surface now gains energy from the Sun and from the atmosphere.'],
    [128.2, 137.0, 'So it warms until the balance is restored, at about 288~K. Now it radiates σT⁴ = 390~W~m⁻², but only 238~W~m⁻² escapes to space.'],
    [137.2, 144.6, '238 out = 238 absorbed: in balance again. As an effective emissivity, 238 ÷ 390 = 0.61.'],
    [144.8, 153.4, 'Burning fossil fuels has raised CO₂ from about 280~ppm to over 420~ppm. More infrared is absorbed and sent back down.'],
    [153.6, 162.6, 'In this model, an effective emissivity of 0.60 instead of 0.61 gives a new balance at about 289~K: the enhanced greenhouse effect.'],
    [162.8, 171.4, 'A real greenhouse works mostly by stopping warm air rising. The atmosphere\'s effect is about absorbing and re-emitting radiation.'],
  ].map(([a, b, txt]) => [a, b, NB(txt)]);

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25));
    const capTop = H - capFs * (phone ? 6.6 : 5.4);
    const fs = phone ? 10 : Math.round(clamp(W / 80, 11, 16));
    let world, panel;
    if (phone) {
      world = { x0: 0, y0: 0, x1: W, y1: Math.round(H * 0.47) };
      panel = { x0: 10, y0: world.y1 + 6, x1: W - 10, y1: capTop - 4 };
    } else {
      world = { x0: 0, y0: 0, x1: Math.round(W * 0.63), y1: capTop - 4 };
      panel = { x0: Math.round(W * 0.655), y0: Math.max(52, H * 0.12), x1: W - Math.max(10, W * 0.02), y1: capTop - 6 };
    }
    L = { W, H, phone, fs, capTop, world, panel,
      X: (x) => world.x0 + x * (world.x1 - world.x0), Y: (y) => world.y0 + y * (world.y1 - world.y0) };
  }

  // text in pieces: [text, style]: 'i' italic serif, 'r' upright serif, 's' subscript, 'p' superscript, 'b' bold sans, else sans
  function rich(s, parts, x, y, size, a, rgb = C.text, align = 'center') {
    const { g } = s; if (a <= 0) return 0;
    const font = (st) => (st === 's' || st === 'p') ? D.sans(Math.round(size * 0.7)) : st === 'i' ? D.serif(size) : st === 'r' ? D.serif(size, false)
      : st === 'b' ? D.sans(size, 600) : D.sans(size);
    const ws = parts.map(([tx, st]) => { g.font = font(st); return g.measureText(tx).width; });
    const total = ws.reduce((p, q) => p + q, 0);
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 8; g.fillStyle = `rgba(${rgb},${a})`;
    parts.forEach(([tx, st], i) => { g.font = font(st); g.fillText(tx, px, st === 's' ? y + size * 0.28 : st === 'p' ? y - size * 0.38 : y); px += ws[i]; });
    g.shadowBlur = 0;
    return total;
  }

  // a wave packet centred at (x, y), travelling along (ux, uy), wavelength lam px
  function packet(s, x, y, ux, uy, lam, rgb, a, nWaves) {
    const len = lam * nWaves, amp = lam * 0.32, pts = [], nx = -uy, ny = ux;
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, sx = (u - 0.5) * len, env = Math.sin(Math.PI * u);
      const d = amp * env * Math.sin(2 * Math.PI * sx / lam);
      pts.push([x + ux * sx + nx * d, y + uy * sx + ny * d]);
    }
    D.glowLine(s, pts, rgb, a, Math.max(1.2, lam * 0.16));
  }

  // ---------- drawing the world ----------
  function drawWorld(s, t) {
    const { g } = s, { world: w, X, Y, fs, phone } = L, ww = w.x1 - w.x0, wh = w.y1 - w.y0;
    g.save(); g.beginPath(); g.rect(w.x0, w.y0, ww, wh); g.clip();
    // atmosphere: a faint blue haze thickening towards the ground
    const at = g.createLinearGradient(0, Y(ATM_TOP - 0.08), 0, Y(0.95));
    at.addColorStop(0, 'rgba(60,110,200,0)'); at.addColorStop(0.35, 'rgba(60,110,200,0.08)'); at.addColorStop(1, 'rgba(80,140,230,0.2)');
    g.fillStyle = at; g.fillRect(w.x0, Y(ATM_TOP - 0.08), ww, Y(1) - Y(ATM_TOP - 0.08));
    // the Sun
    const sr = Math.max(10, Math.min(ww, wh) * 0.07);
    D.glowDot(s, X(SUN.x), Y(SUN.y), sr * 3.2, '255,210,110', 0.55);
    D.glowDot(s, X(SUN.x), Y(SUN.y), sr * 1.3, '255,230,150', 1);
    // the cloud
    g.globalCompositeOperation = 'source-over';
    for (const [dx, dy, r] of [[-0.6, 0.2, 0.55], [0, -0.2, 0.7], [0.6, 0.15, 0.55], [0.25, 0.35, 0.5], [-0.25, 0.4, 0.5]]) {
      const cx = X(CLOUD.x + dx * CLOUD.hw), cy = Y(CLOUD.y + dy * CLOUD.hh), rr = r * CLOUD.hw * ww;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
      gr.addColorStop(0, 'rgba(235,240,255,0.55)'); gr.addColorStop(1, 'rgba(235,240,255,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, rr, rr * 0.62, 0, 0, 7); g.fill();
    }
    // the ground: a little warmer-coloured as it warms
    const T = Tsurf(t), warm = clamp((T - 245) / 50, 0, 1);
    g.beginPath(); g.moveTo(w.x0, w.y1 + 2);
    for (let i = 0; i <= 40; i++) { const x = i / 40; g.lineTo(X(x), Y(GROUND(x))); }
    g.lineTo(w.x1, w.y1 + 2); g.closePath();
    const gg = g.createLinearGradient(0, Y(0.9), 0, w.y1);
    gg.addColorStop(0, `rgba(${Math.round(lerp(70, 110, warm))},${Math.round(lerp(100, 120, warm))},${Math.round(lerp(120, 70, warm))},1)`);
    gg.addColorStop(1, 'rgba(25,30,40,1)');
    g.fillStyle = gg; g.fill();
    g.beginPath();
    for (let i = 0; i <= 12; i++) { const x = lerp(SNOW[0], SNOW[1], i / 12); g[i ? 'lineTo' : 'moveTo'](X(x), Y(GROUND(x)) - 1); }
    for (let i = 12; i >= 0; i--) { const x = lerp(SNOW[0], SNOW[1], i / 12); g.lineTo(X(x), Y(GROUND(x)) + Math.max(4, wh * 0.03)); }
    g.closePath(); g.fillStyle = 'rgba(235,242,255,0.9)'; g.fill();
    // a warm glow along the surface, stronger when hotter
    D.glowLine(s, Array.from({ length: 41 }, (_, i) => [X(i / 40), Y(GROUND(i / 40))]), '255,150,80', 0.15 + 0.5 * warm, 1.6);
    // labels
    const la = smooth((t - 5) / 1.5) * (1 - smooth((t - END_CARD) / 0.8));
    D.text(s, 'space', X(phone ? 0.75 : 0.62), Y(0.12), fs, 0.6 * la, D.sans(fs), C.muted);
    D.text(s, 'atmosphere', X(0.97), Y(ATM_TOP + 0.05), fs, 0.6 * la, D.sans(fs), C.muted, 'right');
    D.text(s, 'surface', X(0.03), Y(0.975), fs, 0.75 * la, D.sans(fs), C.muted, 'left');
    D.text(s, 'Sun', X(SUN.x), Y(SUN.y) + sr * 1.9, fs, 0.8 * la, D.sans(fs, 600), '255,220,140');
    if (!phone || t < 26 || t > 36) D.text(s, 'cloud', X(CLOUD.x), Y(CLOUD.y + CLOUD.hh * 1.9), fs - 1, 0.55 * la, D.sans(fs - 1), C.muted);
    D.text(s, 'snow', X((SNOW[0] + SNOW[1]) / 2), Y(GROUND(0.86)) + Math.max(4, wh * 0.03) + fs * 0.9, fs - 1, 0.6 * la, D.sans(fs - 1), C.muted);
    // flashes where photons are absorbed by the ground
    for (const f of FLASH) {
      const dt = t - f.t; if (dt < 0 || dt > 0.6) continue;
      D.glowDot(s, X(f.x), Y(GROUND(f.x)), Math.max(6, ww * 0.018), f.kind === 'vis' ? '255,230,160' : IR_RGB, 0.7 * (1 - dt / 0.6));
    }
    drawMolecules(s, t);
    // photons
    const lamV = Math.max(4, ww * 0.0085), lamI = lamV * 3;
    for (const p of PH) {
      const s0 = p.segs[0], sN = p.segs[p.segs.length - 1];
      if (t < s0.a || t > sN.b) continue;
      const sg = p.segs.find((q) => t >= q.a && t <= q.b); if (!sg || sg.hidden) continue;
      const u = (t - sg.a) / Math.max(1e-6, sg.b - sg.a);
      const x = X(lerp(sg.x0, sg.x1, u)), y = Y(lerp(sg.y0, sg.y1, u));
      let ux = X(sg.x1) - X(sg.x0), uy = Y(sg.y1) - Y(sg.y0); const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
      const a = Math.min(smooth((t - s0.a) / 0.3), smooth((sN.b - t) / 0.3), 1) * (1 - smooth((t - END_CARD) / 0.8));
      if (p.kind === 'vis') packet(s, x - ux * lamV * 1.5, y - uy * lamV * 1.5, ux, uy, lamV, p.rgb, 0.9 * a, 3);
      else packet(s, x - ux * lamI, y - uy * lamI, ux, uy, lamI, p.rgb, 0.85 * a, 2.2);
    }
    // a label on the first infrared photons and the first visible ones
    if (t > 8 && t < 22) D.text(s, 'visible light', X(0.3), Y(0.33), fs, 0.75 * fade(t, 8, 22), D.sans(fs, 600), '160,200,255');
    if (t > 40 && t < 56) D.text(s, 'infrared', X(0.62), Y(0.72), fs, 0.8 * fade(t, 40, 56), D.sans(fs, 600), IR_RGB);
    g.restore();
  }

  // ---------- molecules ----------
  const ATOM = { O: ['230,80,70', 0.95], C: ['95,95,110', 1], H: ['235,235,245', 0.6], N: ['110,140,235', 0.95] };
  function drawMolecules(s, t) {
    const { g } = s, { X, Y, world: w, fs, phone } = L;
    const u = clamp(Math.min(w.x1 - w.x0, w.y1 - w.y0) * 0.014, 3.2, 9);
    const ball = (x, y, el, a) => {
      const [rgb, k] = ATOM[el], r = u * k;
      const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.35, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},${0.85 * a})`);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    };
    const lab = { CO2: 'CO₂', H2O: 'H₂O', CH4: 'CH₄', N2O: 'N₂O', N2: 'N₂', O2: 'O₂' };
    const labA = (m) => (m.ghg ? fade(t, Math.max(m.tIn, T_GHG0), 94.6, 1.2, 0.8) : fade(t, 87.2, 94.6, 0.8, 0.8));
    g.globalCompositeOperation = 'source-over';
    for (const m of MOL) {
      const a = molAlpha(m, t) * (1 - smooth((t - END_CARD) / 0.8)); if (a <= 0) continue;
      const { x, y } = molPos(m, t), cx = X(x), cy = Y(y), ex = excited(m, t);
      const wob = ex * Math.sin(t * 2 * Math.PI * 3.2), ang = m.ang + 0.15 * Math.sin(0.2 * t + m.ph1);
      if (ex > 0) D.glowDot(s, cx, cy, u * 5, IR_RGB, 0.55 * ex);
      const c = Math.cos(ang), sn = Math.sin(ang), at = (dx, dy) => [cx + c * dx - sn * dy, cy + sn * dx + c * dy];
      const d = u * 1.7;
      g.globalAlpha = 1;
      if (m.kind === 'CO2' || m.kind === 'N2O') {
        const bend = wob * u * 0.9;                                      // excited: the O atoms swing one way, C the other
        const p1 = at(-d, bend), p2 = at(0, -bend), p3 = at(d, bend);
        const els = m.kind === 'CO2' ? ['O', 'C', 'O'] : ['N', 'N', 'O'];
        g.strokeStyle = `rgba(200,205,220,${0.6 * a})`; g.lineWidth = Math.max(1, u * 0.35);
        g.beginPath(); g.moveTo(...p1); g.lineTo(...p2); g.lineTo(...p3); g.stroke();
        ball(...p1, els[0], a); ball(...p3, els[2], a); ball(...p2, els[1], a);
      } else if (m.kind === 'H2O') {
        const o = at(0, 0), h1 = at(-d * 0.8 + wob * u * 0.4, d * 0.62), h2 = at(d * 0.8 - wob * u * 0.4, d * 0.62);
        ball(...h1, 'H', a); ball(...h2, 'H', a); ball(...o, 'O', a);
      } else if (m.kind === 'CH4') {
        const cpos = at(0, 0); [[-1, -0.8], [1, -0.8], [-0.9, 0.9], [0.9, 0.9]].forEach(([dx, dy], i) => ball(...at(dx * d * 0.8 * (1 + (i % 2 ? 0.2 : -0.2) * wob), dy * d * 0.8), 'H', a));
        ball(...cpos, 'C', a);
      } else {
        const el = m.kind === 'N2' ? 'N' : 'O';
        ball(...at(-d * 0.55, 0), el, 0.8 * a); ball(...at(d * 0.55, 0), el, 0.8 * a);
      }
      if (lab) { const la = labA(m) * a; if (la > 0) D.text(s, lab[m.kind], cx, cy + u * 3, fs - 1, 0.85 * la, D.sans(fs - 1, 600), m.ghg ? '255,190,140' : C.muted); }
    }
  }

  // ---------- the panel: energy flows, temperature, key ----------
  const fmt = (v) => String(Math.round(v));
  function drawPanel(s, t) {
    const a0 = smooth((t - 4.8) / 0.8) * (1 - smooth((t - END_CARD) / 0.8)); if (a0 <= 0) return;
    const { g } = s, { panel: p, fs, phone } = L;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(14,20,44,${0.72 * a0})`; g.beginPath(); g.roundRect(p.x0 - 6, p.y0 - 6, p.x1 - p.x0 + 12, p.y1 - p.y0 + 12, 10); g.fill();
    const thW = phone ? fs * 4.6 : Math.max(fs * 4.8, (p.x1 - p.x0) * 0.22);
    const rx1 = p.x1 - thW - fs * 0.6, lh = phone ? fs * 1.3 : fs * 1.7;
    let y = p.y0 + fs * 0.7;
    g.font = D.sans(fs, 600);
    const title = !phone && g.measureText('average energy flows, per m² of surface').width < rx1 - p.x0 ? 'average energy flows, per m² of surface' : 'average, per m² of surface (W m⁻²)';
    D.text(s, title, p.x0, y, fs, 0.8 * a0, D.sans(fs, 600), C.muted, 'left');
    y += lh * 1.1;
    const T = Tsurf(t), surf = SIGMA * Math.pow(T, 4), out = eff(t) * surf;
    // each row uses its long label (with units) only where it fits beside the value
    const fits = (label, val) => { g.font = D.sans(fs); const a = g.measureText(label).width; g.font = D.sans(fs, 600); return a + g.measureText(val).width + fs < rx1 - p.x0; };
    const roomy = !phone && fits('infrared escaping to space', '238 W m⁻²');
    const row = (t0, long, short, val, rgb, unit = true) => {
      const a = a0 * smooth((t - t0) / 0.8); if (a > 0) {
        const v = roomy && unit ? `${val} W m⁻²` : val;
        D.text(s, roomy ? long : short, p.x0, y, fs, 0.85 * a, D.sans(fs), C.text, 'left');
        D.text(s, v, rx1, y, fs, a, D.sans(fs, 600), rgb, 'right');
      }
      y += lh;
    };
    row(13.6, 'sunlight arriving, S/4', 'sunlight in, S/4', '340', '255,225,140');
    row(23.2, 'reflected (albedo 0.30)', 'reflected', fmt(REFL), '200,210,240');
    row(32.8, 'absorbed', 'absorbed', fmt(ABS), '255,200,120');
    row(T_THERMO, 'surface radiates, σT⁴', 'surface radiates σT⁴', fmt(surf), IR_RGB);
    row(T_THERMO, 'infrared escaping to space', 'escapes to space', fmt(out), IR_RGB);
    row(T_THERMO, 'effective emissivity', 'effective emissivity', eff(t).toFixed(2), C.text, false);
    // balance or warming
    const sa = a0 * smooth((t - T_THERMO) / 0.8);
    if (sa > 0) {
      const bal = Math.abs(out - ABS) < 0.5;                            // within 0.5 W m⁻²: from about 122 s (and 152 s)
      D.text(s, bal ? 'out = absorbed: in balance' : out < ABS ? 'out < absorbed: warming' : 'out > absorbed: cooling', p.x0, y + lh * 0.1, fs, sa, D.sans(fs, 600), bal ? C.good : C.force, 'left');
      y += lh;
    }
    if (phone && t < T_THERMO) D.text(s, 'waves not to scale', p.x0, p.y1 - fs * 0.6, fs - 1, 0.55 * a0, D.sans(fs - 1), C.muted, 'left');
    drawThermo(s, t, p.x1 - thW * 0.5, p.y0 + (phone ? fs * 0.4 : lh * 1.25), p.y1 - fs * (phone ? 1.6 : 2.2), a0 * smooth((t - T_THERMO) / 0.8));
    if (!phone) {
      // rows end at most at the 7th line; the close-up goes below them if there is room, otherwise over the sky
      const rowsEnd = p.y0 + fs * 0.7 + lh * 8.2;
      L.insetInPanel = p.y1 - rowsEnd >= fs * 8.5;
      const inA = fade(t, T_INSET0, T_INSET1, 0.8, 0.8);
      if (inA > 0 && L.insetInPanel) drawInset(s, t, { x0: p.x0, y0: Math.max(rowsEnd, p.y1 - fs * 11), x1: rx1, y1: p.y1 }, inA * a0);
      const ka = a0 * (L.insetInPanel ? 1 - inA : 1) * smooth((t - 6) / 1);
      if (ka > 0 && p.y1 - rowsEnd > fs * 5.6) drawKey(s, t, p.x0, p.y1 - fs * 5.4, ka);
    }
  }
  function drawKey(s, t, x, y, a) {
    const { fs } = L, lh = fs * 1.45, lam = Math.max(4, fs * 0.45);
    packet(s, x + lam * 1.8, y, 1, 0, lam, VIS_RGB[0], a, 3);
    D.text(s, 'visible light', x + lam * 4.2, y, fs - 1, 0.8 * a, D.sans(fs - 1), C.muted, 'left'); y += lh;
    packet(s, x + lam * 1.8, y, 1, 0, lam * 3, IR_RGB, a, 1.2);   // 3 times the visible wavelength, as in the sky
    D.text(s, 'infrared (longer wavelength)', x + lam * 4.2, y, fs - 1, 0.8 * a, D.sans(fs - 1), C.muted, 'left'); y += lh;
    const ga = a * smooth((t - T_GHG0) / 1.5);
    if (ga > 0) { D.glowDot(s, x + lam * 1.8, y, fs * 0.8, IR_RGB, 0.6 * ga); D.text(s, 'greenhouse gas absorbing infrared', x + lam * 4.2, y, fs - 1, 0.8 * ga, D.sans(fs - 1), C.muted, 'left'); }
    y += lh;
    D.text(s, 'waves, molecules and paths not to scale', x, y, fs - 2, 0.55 * a, D.sans(fs - 2), C.muted, 'left');
  }
  function drawThermo(s, t, cx, top, bot, a) {
    if (a <= 0) return;
    const { g } = s, { fs } = L, T = Tsurf(t);
    const tw = Math.max(5, fs * 0.55), br = tw * 1.15, yb = bot - br, yt = top + fs * 2.4;
    const Yt = (TT) => lerp(yb - br, yt, (TT - 240) / 60);
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = `rgba(200,210,240,${0.6 * a})`; g.lineWidth = 1.3;
    g.beginPath(); g.roundRect(cx - tw / 2, yt - tw / 2, tw, yb - yt + tw / 2, tw / 2); g.stroke();
    g.beginPath(); g.arc(cx, yb, br, 0, 7); g.stroke();
    g.fillStyle = `rgba(255,110,80,${0.9 * a})`;
    g.beginPath(); g.arc(cx, yb, br * 0.75, 0, 7); g.fill();
    g.fillRect(cx - tw * 0.28, Yt(T), tw * 0.56, yb - Yt(T));
    for (const [v, txt] of [[255, '255'], [288, '288']]) {
      D.line(s, cx + tw * 0.6, Yt(v), cx + tw * 1.3, Yt(v), C.muted, 0.7 * a, 1);
      D.text(s, txt, cx + tw * 1.5, Yt(v), fs - 1, 0.8 * a, D.sans(fs - 1), C.muted, 'left');
    }
    const Tr = Math.round(T), Tc = Math.round(T - 273);
    D.text(s, `${Tr} K`, cx, top + fs * 0.5, fs + 1, a, D.sans(fs + 1, 700), '255,160,120');
    D.text(s, `${Tc < 0 ? '−' : ''}${Math.abs(Tc)} °C`, cx, top + fs * 1.65, fs - 1, 0.85 * a, D.sans(fs - 1), C.muted);
  }

  // ---------- the close-up: a CO2 molecule meeting infrared (resonance), then visible light ----------
  function drawInset(s, t, b, a) {
    const { g } = s, { fs } = L;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(6,10,26,${0.85 * a})`; g.strokeStyle = `rgba(150,165,230,${0.45 * a})`; g.lineWidth = 1;
    g.beginPath(); g.roundRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 8); g.fill(); g.stroke();
    D.text(s, 'close-up: one CO₂ molecule (schematic)', b.x0 + 8, b.y0 + fs * 0.8, fs - 1, 0.8 * a, D.sans(fs - 1, 600), C.muted, 'left');
    g.save(); g.beginPath(); g.rect(b.x0 + 1, b.y0 + fs * 1.5, b.x1 - b.x0 - 2, b.y1 - b.y0 - fs * 1.5 - 1); g.clip();
    const bw = b.x1 - b.x0, bh = b.y1 - b.y0, mx = b.x0 + bw * 0.55, my = b.y0 + fs * 1.5 + (bh - fs * 1.5) * 0.48;
    const u = clamp(Math.min(bw, bh) * 0.06, 5, 12), F = 1.1;            // shown slowed down: 1.1 vibrations per second
    // the infrared wave train arrives from the left, at the molecule's natural frequency
    const lam = u * 7, v = lam * F, front0 = 96.0, len = lam * 4;
    const front = b.x0 + (t - front0) * v, tail = front - len;
    if (t < 102.5 && front > b.x0) {
      const xs = Math.max(b.x0, tail), xe = Math.min(front, mx);
      if (xe > xs) {
        const pts = [];
        for (let x = xs; x <= xe; x += 2) pts.push([x, my + u * 1.6 * Math.sin(2 * Math.PI * ((x - mx) / lam - F * t))]);
        D.glowLine(s, pts, IR_RGB, 0.9 * a, 1.8);
      }
      D.text(s, 'infrared', b.x0 + 8, my - u * 3.4, fs - 1, 0.85 * a * fade(t, 96.3, 102.6), D.sans(fs - 1, 600), IR_RGB, 'left');
    }
    // the bend grows while the wave drives it at its natural frequency (resonance), then dies away after re-emitting
    const arrive = (mx - b.x0) / v + front0;
    let amp = smooth((t - arrive) / 3.5);
    if (t > 112.3) amp *= 1 - smooth((t - 112.3) / 3);
    const bend = amp * u * 1.4 * Math.sin(2 * Math.PI * F * t);
    const d = u * 2.6;
    const ball = (x, y, rgb, r) => { const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.35, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},${0.85 * a})`);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    if (amp > 0.05) D.glowDot(s, mx, my, u * 5, IR_RGB, 0.4 * amp * a);
    // springs for the bonds
    const spring = (x1, y1, x2, y2) => { const pts = []; for (let i = 0; i <= 16; i++) { const k = i / 16, ox = -(y2 - y1), oy = x2 - x1, ol = Math.hypot(ox, oy) || 1; const w = (i % 2 ? 1 : -1) * (i && i < 16 ? u * 0.35 : 0);
      pts.push([lerp(x1, x2, k) + ox / ol * w, lerp(y1, y2, k) + oy / ol * w]); } D.glowLine(s, pts, '200,205,220', 0.6 * a, 1); };
    const o1 = [mx - d, my + bend], cc = [mx, my - bend * 0.7], o2 = [mx + d, my + bend];
    spring(...o1, ...cc); spring(...cc, ...o2);
    ball(...o1, ATOM.O[0], u * 0.95); ball(...o2, ATOM.O[0], u * 0.95); ball(...cc, ATOM.C[0], u);
    // re-emission: a new infrared wave leaves in another direction
    if (t > 112.3 && t < 119.6) {
      const r0 = (t - 112.3) * v, pts = [], ang = -0.9, ux = Math.cos(ang), uy = Math.sin(ang);
      for (let sx = Math.max(0, r0 - len); sx <= r0; sx += 2) { const dd = u * 1.4 * Math.sin(2 * Math.PI * (sx / lam - F * t)); pts.push([mx + ux * (sx + u * 2) - uy * dd, my + uy * (sx + u * 2) + ux * dd]); }
      D.glowLine(s, pts, IR_RGB, 0.9 * a, 1.8);
      D.text(s, 're-emitted', mx + bw * 0.12, b.y0 + fs * 2.4, fs - 1, 0.85 * a * fade(t, 112.6, 119.4), D.sans(fs - 1, 600), IR_RGB, 'left');
    }
    // visible light: no vibration matches, so it passes straight through
    if (t > 103.6 && t < 111) {
      const lv = u * 1.3, x = b.x0 + (t - 103.6) * (bw / 6.4), pts = [];
      for (let k = -lv * 3; k <= 0; k += 1) pts.push([x + k, my + u * 0.5 * Math.sin(2 * Math.PI * (k / lv - 3 * t)) * Math.sin(Math.PI * (k / (lv * 3) + 1))]);
      D.glowLine(s, pts, VIS_RGB[0], 0.9 * a, 1.4);
      D.text(s, 'visible: no match, passes through', b.x0 + 8, b.y1 - fs * 0.8, fs - 1, 0.85 * a * fade(t, 104, 111), D.sans(fs - 1, 600), '160,200,255', 'left');
    }
    if (t > 98 && t < 103.4) D.text(s, 'frequencies match: resonance', b.x0 + 8, b.y1 - fs * 0.8, fs - 1, 0.85 * a * fade(t, 98, 103.4), D.sans(fs - 1, 600), IR_RGB, 'left');
    g.restore();
  }

  // phones (and small wide screens): the close-up sits over the top of the sky slice, below the buttons
  function drawSkyInset(s, t) {
    if (!L.phone && L.insetInPanel !== false) return;
    const a = fade(t, T_INSET0, T_INSET1, 0.8, 0.8); if (a <= 0) return;
    const { world: w, fs, phone } = L, y0 = phone ? 6 : 46;
    drawInset(s, t, { x0: w.x1 * (phone ? 0.34 : 0.3), y0, x1: w.x1 - 6, y1: Math.min(w.y1 * (phone ? 0.5 : 0.62), y0 + fs * 10) }, a);
  }

  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 34, 15, 30)), s3 = Math.round(clamp(W / 60, 11, 17));
    let y = H * (phone ? 0.1 : 0.14);
    D.text(s, 'The greenhouse effect', W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.5;
    const items = [
      [[['(1 − ', 'r'], ['α', 'i'], [')', 'r'], ['S', 'i'], ['/4 = ', 'r'], ['eσT', 'i'], ['4', 'p']], '255,225,140', 'In balance: power absorbed = power emitted. Without greenhouse gases T = 255 K.'],
      [[['λ', 'i'], ['max', 's'], ['T', 'i'], [' = 2.9 × 10', 'r'], ['−3', 'p'], [' m K', 'r']], '160,200,255', 'Sunlight (5800 K) is mostly visible; the surface (288 K) radiates infrared.'],
      [[['Greenhouse gases', 'b']], IR_RGB, 'absorb infrared at their natural frequencies (resonance: the photon energy hf matches a gap between vibrational energy levels) and re-emit it in all directions, some back to the surface.'],
      [[['More greenhouse gas', 'b']], C.force, 'less infrared escapes directly, so the surface warms to a new balance: the enhanced greenhouse effect.'],
    ];
    if (phone) {
      for (const [eq, rgb, txt] of items) {
        rich(s, eq, W / 2, y, s2 * 0.85, a, rgb); y += s2 * 1.1;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 36); D.text(s, ls, W / 2, y, s3, 0.8 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.5;
      }
    } else {
      const colW = Math.min(W * 0.4, 440);
      g.font = D.sans(s3);
      const wr = items.map((it) => D.wrap(s, it[2], colW));
      const y1 = y, y2 = y1 + s2 * 1.4 + s3 * 1.3 * Math.max(wr[0].length, wr[1].length) + s2 * 0.9;
      items.forEach(([eq, rgb], i) => {
        const x = W / 2 + (i % 2 ? 1 : -1) * W * 0.23, yy = i < 2 ? y1 : y2;
        rich(s, eq, x, yy, s2 * 0.85, a, rgb);
        D.text(s, wr[i], x, yy + s2 * 1.2, s3, 0.8 * a, D.sans(s3));
      });
    }
  }

  Anim.register('greenhouse', {
    duration: DURATION,
    poster: 125,
    // score: a warm blanket (D-flat major, a triangle pad, a low drone, wind and a faint shimmer)
    music: { chords: [[49, 56, 61, 65], [46, 53, 58, 61], [42, 49, 54, 58], [44, 51, 56, 60]], bar: 10, pad: 'triangle', cutoff: 800, drone: 0.1, wind: 0.4, shimmer: 0.15, volume: 0.42 },
    resize: layout,
    info: { IN, REFL, ABS, T0, E1, T2, Tsurf, eff, CAPS, PH, FLASH, MOL,
      check() {
        const r = (v, d) => +v.toFixed(d);
        return { wienSun: r(WIEN / 5800 * 1e9, 0), wienEarth: r(WIEN / 288 * 1e6, 2), S4: IN, refl: r(REFL, 1), abs: r(ABS, 1),
          T4: r(ABS / SIGMA / 1e9, 3), T0: r(T0, 2), sigma288: r(SIGMA * 288 ** 4, 1), E1: r(E1, 4), T2: r(T2, 2),
          co2lambda: r(3.0e8 / 2e13 * 1e6, 1), photons: PH.length, irAbsorbed: PH.filter((p) => p.segs.length > 1 && p.kind === 'ir').length };
      } },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.15);
      drawWorld(s, t);
      drawPanel(s, t);
      drawSkyInset(s, t);
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'The greenhouse effect', 'Why the Earth is 33 K warmer than it would be without greenhouse gases');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
