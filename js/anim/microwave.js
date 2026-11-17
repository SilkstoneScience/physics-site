/* How does a microwave oven work? Electromagnetic waves (C.2) form standing waves in a metal box (C.4); the oscillating
   electric field twists polar water molecules, raising the internal energy (B.1). No pauses: the motion runs at a
   constant speed and each caption stays up long enough to read.

   Numbers (data booklet: c = 3.00 × 10⁸ m s⁻¹; c of water 4200 J kg⁻¹ K⁻¹ as in the notes; checked by info.check()):
   - f = 2.45 GHz: λ = c/f = 3.00 × 10⁸ ÷ 2.45 × 10⁹ = 0.1224 m ("0.122 m, about 12 cm"); period T = 1/f = 4.08 × 10⁻¹⁰ s.
     On screen one oscillation takes 1.6 s, so the wave is slowed about 1.6 ÷ 4.08 × 10⁻¹⁰ = 3.9 × 10⁹ times ("about 4 × 10⁹").
   - The model box: one direction across a box 5 half-wavelengths wide, 5 × 0.0612 = 0.306 m (30.6 cm), with nodes of the
     electric field at both metal walls. Incident A sin(ωt − kx) and reflected (inverted at the far wall) −A sin(ωt − k(2L − x))
     add to −2A cos ωt sin kx, since 2kL = 10π: nodes every λ/2 = 6.12 cm (x = 0, 6.1, 12.2, 18.4, 24.5, 30.6 cm), antinodes
     half-way between (3.1, 9.2, 15.3, 21.4, 27.6 cm).
   - Heating is proportional to the average of E², i.e. to sin² kx: hot spots at the antinodes, 6.12 cm apart.
   - Chocolate: melted where sin² kx is above 0.75 (each spot is λ/6 = 2.0 cm wide). First to fifth spot: 4 × 6.12 = 24.5 cm,
     spacing 24.5 ÷ 4 = 6.12 cm; c = 2 × 0.0612 × 2.45 × 10⁹ = 3.0 × 10⁸ m s⁻¹.
   - Energy: 800 W × 60 s = 48 000 J into 0.25 kg of water: ΔT = 48 000 ÷ (0.25 × 4200) = 45.7 K ("46 K at most").
   - The view from above: a simplified 3D pattern, heating ∝ sin²(5πx/a) sin²(5πy/a) with a = 30.6 cm, and a plate of food of
     radius 12 cm turning once every 10 s; each part of the food's heating is added up over time (exact for that model).
   - The door: holes about 2 mm across, 4 mm apart, drawn to the same scale as the 12.2 cm wave; visible light has λ about
     4 to 7 × 10⁻⁷ m, under a micrometre.
   Beyond the course (labelled): how the magnetron works; the 3D pattern; why 2.45 GHz reaches a centimetre or two into food. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- physics ----------
  const c = 3.00e8, f = 2.45e9, LAM = c / f, LAMcm = LAM * 100, BOX = 5 * LAMcm / 2;   // cm
  const TD = 1.6, OM = 2 * Math.PI / TD;                      // on-screen period (s) and angular frequency
  const SLOW = TD * f;
  const kcm = 2 * Math.PI / LAMcm;                              // per cm
  const NODES = Array.from({ length: 6 }, (_, m) => m * LAMcm / 2), ANTI = Array.from({ length: 5 }, (_, m) => (m + 0.5) * LAMcm / 2);
  const SPAN = ANTI[4] - ANTI[0], SPACING = SPAN / 4, C_MEAS = 2 * (Math.round(SPACING * 100) / 10000) * f;
  const DT = 800 * 60 / (0.25 * 4200);

  // ---------- captions (timed from their length: never faster than ~14.5 characters a second) ----------
  const nb = (s) => s.replace(/~/g, ' ');
  const SEQ = [
    ['A microwave oven is a metal box. A magnetron makes microwaves, and a metal tube called a waveguide carries them into the box.'],
    ['Microwaves are electromagnetic waves, like light and radio waves. Their wavelengths are roughly 10⁻³ to 10⁻¹~m.'],
    ['An oven uses f~=~2.45~GHz. So λ = c/f = 3.00~×~10⁸ ÷ 2.45~×~10⁹ = 0.122~m: about 12~cm.', 1],
    [`Simplified: one direction across the box, ${BOX.toFixed(1)}~cm wide, drawn to scale. The wave is slowed down about 4~×~10⁹ times.`, 0, 0.6],
    ['The metal wall reflects the wave. The reflected wave superposes with the wave arriving, and together they form a standing wave.'],
    ['At a metal wall the electric field (along the wall) is always zero, like the fixed end of a string: there is a node at each wall.'],
    [`Between the nodes are antinodes, where the field oscillates most strongly. They are half a wavelength apart: 12.2~÷~2 = 6.1~cm.`],
    ['Food heats fastest at the antinodes: the hot spots. At the nodes it hardly heats at all.'],
    ['Predict: take out the turntable and heat a bar of chocolate for 20~seconds. Where will it melt?', 6, 0.4],
    ['It melts in spots at the antinodes, 6.1~cm apart, while the chocolate between them stays solid.'],
    ['So you can measure the speed of light. The spots are half a wavelength apart, so c = fλ = 2 × spacing × f (f is printed on the oven).'],
    [`Across four gaps the spots span ${SPAN.toFixed(1)}~cm, so the spacing is ${SPACING.toFixed(2)}~cm: c = 2 × 0.0612 × 2.45~×~10⁹ = 3.0~×~10⁸~m~s⁻¹.`, 1],
    ['Why does food get hot? A water molecule is polar: its oxygen end is slightly negative and its hydrogen end slightly positive.', 0, 0.6],
    ['The electric field pushes the two ends opposite ways and turns the molecule. The field oscillates 2.45~×~10⁹ times a second, twisting it back and forth.'],
    ['The twisting molecules jostle their neighbours, so the particles\' random motion increases: the internal energy and temperature rise.'],
    ['A common myth: the oven is not tuned to a natural frequency of water. Water absorbs microwaves over a wide range of frequencies.'],
    ['2.45~GHz is a frequency set aside for ovens (and Wi-Fi). It reaches a centimetre or two into food, and the middle heats by conduction.'],
    ['In a real oven the standing waves make a 3D pattern of hot spots (simplified here, seen from above).', 0, 0.6],
    ['Food that stays still heats in patches. A turntable carries most of the food through hot and cool places, so it heats more evenly.'],
    [`Energy check: 800~W for 60~s into 250~g of water. ΔT = Q/mc = 800~×~60 ÷ (0.25~×~4200) = ${Math.round(DT)}~K at most (less in practice).`, 1],
    ['The door is glass with a metal mesh in it. The holes are about 2~mm across: far smaller than the 12~cm wavelength.', 0, 0.6],
    ['So the mesh reflects microwaves like a solid metal wall. Light, with a wavelength under a micrometre, passes through the holes: you can watch your food.'],
  ];
  const CAPS = [];
  let tc = 4.8;
  for (const [txt, extra = 0, gap = 0] of SEQ) {
    const t0 = tc + gap, d = Math.max(4.8, nb(txt).length / 14.5 + 0.6) + extra;
    CAPS.push([t0, t0 + d, nb(txt)]); tc = t0 + d + 0.2;
  }
  const at = (i) => CAPS[i][0], end = (i) => CAPS[i][1];
  const PB = at(3) - 0.5, PC = at(8) - 0.3, PD = at(12) - 0.5, PE = at(17) - 0.5, PF = at(20) - 0.5;
  const END_CARD = end(21) + 0.4, DURATION = END_CARD + 13;
  const XF = 1.0;
  const partA = (t, a, b) => (a <= 0 ? 1 : smooth((t - a + XF / 2) / XF)) * (b == null ? 1 : 1 - smooth((t - b + XF / 2) / XF));
  const TW0 = at(4) - 3.5;                                     // when the wave starts across the box (it reaches the far wall 4 s later)
  const T_BACK = TW0 + 8;                                      // when the reflected wave has come back to the left end
  const MELT0 = at(9) - 1, MELT1 = at(9) + 2.5;                // the chocolate melts between these times (after the Predict question)

  // ---------- helpers ----------
  let seed = 2450;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const label = (s, txt, x, y, fs, a, rgb = C.muted, align = 'center', w = 400) => D.text(s, txt, x, y, fs, a, D.sans(fs, w), rgb, align);
  const METAL = '170,182,205', WAVE = '143,184,255', REFL = '255,170,85', HOT = '255,120,60', CHOC = '96,58,34', CHOC_M = '150,98,60';
  const heatRGB = (u) => {                                     // 0 cold (blue) → 1 hot (red-orange)
    u = clamp(u, 0, 1);
    const r = Math.round(lerp(60, 255, u)), g = Math.round(lerp(110, 110 - 40 * u, u)), b = Math.round(lerp(220, 50, u));
    return `${r},${g},${b}`;
  };

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25));
    const capTop = H - capFs * (phone ? 7.4 : 5.6);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    // the 1D box
    const bx0 = W * (phone ? 0.08 : 0.12), bx1 = W * (phone ? 0.92 : 0.88), by = capTop * (phone ? 0.36 : 0.42);
    const pxcm = (bx1 - bx0) / BOX, amp = Math.min(capTop * 0.14, pxcm * 3.2);
    // part D: molecules
    seed = 7;
    const mols = Array.from({ length: phone ? 18 : 30 }, () => ({ x: rnd(), y: rnd(), a0: rnd() * Math.PI * 2, ph: rnd() * 0.8, j1: rnd() * 9, j2: rnd() * 9 }));
    // part E: the plates' heating, added up over time (fixed grid on each plate)
    L = { W, H, phone, fs, capFs, capTop, bx0, bx1, by, pxcm, amp, mols };
  }

  // ---------- part A: the oven ----------
  function partA1(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { W, capTop, fs, phone } = L;
    const ox0 = W * (phone ? 0.05 : 0.12), ox1 = W * (phone ? 0.95 : 0.88), oy0 = capTop * (phone ? 0.16 : 0.1), oy1 = capTop * (phone ? 0.78 : 0.86);
    const cx1 = lerp(ox0, ox1, 0.66);                                // the cavity is on the left, the electronics on the right
    // casing
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(30,36,56,${0.9 * a})`; g.beginPath(); g.roundRect(ox0, oy0, ox1 - ox0, oy1 - oy0, 12); g.fill();
    g.strokeStyle = `rgba(${METAL},${0.8 * a})`; g.lineWidth = 2; g.stroke();
    // cavity (metal walls) with the door mesh over it
    const m = (ox1 - ox0) * 0.04, cx0 = ox0 + m, cy0 = oy0 + m, cy1 = oy1 - m;
    g.fillStyle = `rgba(10,14,28,${a})`; g.fillRect(cx0, cy0, cx1 - cx0, cy1 - cy0);
    g.strokeStyle = `rgba(${METAL},${0.95 * a})`; g.lineWidth = 3; g.strokeRect(cx0, cy0, cx1 - cx0, cy1 - cy0);
    // turntable and a bowl
    const tx = (cx0 + cx1) / 2, ty = cy1 - (cy1 - cy0) * 0.12, tw = (cx1 - cx0) * 0.38;
    g.fillStyle = `rgba(160,200,230,${0.25 * a})`; g.beginPath(); g.ellipse(tx, ty, tw, tw * 0.16, 0, 0, 7); g.fill();
    g.strokeStyle = `rgba(190,220,240,${0.6 * a})`; g.lineWidth = 1.4; g.stroke();
    g.fillStyle = `rgba(230,230,240,${0.85 * a})`; g.beginPath();
    g.moveTo(tx - tw * 0.45, ty - tw * 0.32); g.lineTo(tx + tw * 0.45, ty - tw * 0.32); g.quadraticCurveTo(tx + tw * 0.4, ty - tw * 0.02, tx, ty - tw * 0.02);
    g.quadraticCurveTo(tx - tw * 0.4, ty - tw * 0.02, tx - tw * 0.45, ty - tw * 0.32); g.fill();
    g.fillStyle = `rgba(220,120,60,${0.9 * a})`; g.beginPath(); g.ellipse(tx, ty - tw * 0.32, tw * 0.43, tw * 0.07, 0, 0, 7); g.fill();
    // the magnetron (box with cooling fins) and the waveguide into the cavity's right wall, near the top
    const mx = lerp(cx1, ox1, 0.5), my = lerp(oy0, oy1, 0.62), mw = (ox1 - cx1) * 0.5, mh = (oy1 - oy0) * 0.2;
    g.fillStyle = `rgba(120,128,150,${0.95 * a})`; g.fillRect(mx - mw / 2, my - mh / 2, mw, mh);
    g.strokeStyle = `rgba(60,66,84,${a})`; g.lineWidth = 1;
    for (let i = 1; i < 6; i++) { const y = my - mh / 2 + mh * i / 6; g.beginPath(); g.moveTo(mx - mw / 2, y); g.lineTo(mx + mw / 2, y); g.stroke(); }
    const wg0 = cy0 + (cy1 - cy0) * 0.12, wg1 = wg0 + (cy1 - cy0) * 0.14;   // waveguide: up from the magnetron, then left into the cavity
    g.fillStyle = `rgba(${METAL},${0.35 * a})`;
    g.fillRect(cx1, wg0, mx + mw * 0.15 - cx1, wg1 - wg0); g.fillRect(mx - mw * 0.15, wg0, mw * 0.3, my - mh / 2 - wg0);
    g.strokeStyle = `rgba(${METAL},${0.9 * a})`; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(cx1, wg0); g.lineTo(mx + mw * 0.15, wg0); g.lineTo(mx + mw * 0.15, my - mh / 2);
    g.moveTo(cx1, wg1); g.lineTo(mx - mw * 0.15, wg1); g.lineTo(mx - mw * 0.15, my - mh / 2); g.stroke();
    // microwaves travelling along the waveguide and into the cavity (a steady stream of wiggles)
    const wl = (wg1 - wg0) * 1.4, sp = wl / TD, path = [];
    for (let i = 0; i <= 120; i++) {
      const u = i / 120, x = lerp(mx, cx0 + (cx1 - cx0) * 0.25, u), y = (wg0 + wg1) / 2;
      const ph = ((mx - x) - sp * t) / wl * 2 * Math.PI;
      path.push([x, y + (wg1 - wg0) * 0.3 * Math.sin(ph) * (x < cx1 ? Math.max(0, 1 - (cx1 - x) / ((cx1 - cx0) * 0.75)) : 1)]);
    }
    D.glowLine(s, path, WAVE, 0.75 * a * smooth((t - 1.5) / 1.5), 1.3);
    // the door mesh (a faint grid of dots over the cavity)
    g.fillStyle = `rgba(${METAL},${0.18 * a})`;
    const st = Math.max(6, (cx1 - cx0) / 40);
    for (let y = cy0 + st / 2; y < cy1; y += st) for (let x = cx0 + st / 2; x < cx1; x += st) g.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
    // labels
    const la = a * smooth((t - 4.8) / 0.8);
    label(s, 'magnetron', mx, my + mh / 2 + fs * 1.1, fs, la, C.text, 'center', 600);
    label(s, 'waveguide', mx + mw * 0.3, wg0 - fs * 0.8, fs, la, C.text, 'center', 600);
    label(s, phone ? 'metal box' : 'metal walls', cx0 + fs * 0.4, cy0 + fs * 1.1, fs, la, METAL, 'left', 600);
    label(s, 'turntable', tx, ty + tw * 0.16 + fs * 0.9, fs, la, '190,220,240', 'center');
    label(s, phone ? 'door: metal mesh' : 'door (looking through it): glass with a metal mesh', (ox0 + ox1) / 2, oy1 + fs * 1.3, fs, la, C.muted);
    if (!phone) label(s, '(how the magnetron works is beyond the course)', mx, my + mh / 2 + fs * 2.3, fs - 2, 0.7 * la, C.muted);
    // λ = c/f readout
    const ra = a * smooth((t - at(2) - 0.4) / 0.8);
    if (ra > 0) label(s, `f = 2.45 GHz   λ = ${(LAM).toFixed(3)} m`, (cx0 + cx1) / 2, lerp(cy0, cy1, 0.45), fs + 1, ra, WAVE, 'center', 600);
  }

  // ---------- part B and C: the standing wave across the box ----------
  const X = (cm) => L.bx0 + cm * L.pxcm;
  function drawBox(s, a, leftA = 1) {
    const { g } = s, { bx0, bx1, by, amp, fs, pxcm, phone } = L;
    const top = by - amp * 1.7, bot = by + amp * 1.7;
    // the walls
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(${METAL},${0.85 * a})`;
    g.fillRect(bx1, top, 6, bot - top);
    g.fillStyle = `rgba(${METAL},${0.85 * a * leftA})`; g.fillRect(bx0 - 6, top, 6, bot - top);
    label(s, leftA > 0.5 ? 'metal wall' : 'from the waveguide', bx0 - 6, top - fs * 0.8, fs, 0.85 * a, leftA > 0.5 ? METAL : WAVE, phone || leftA <= 0.5 ? 'left' : 'center', 600);
    label(s, 'metal wall', bx1 + 6, top - fs * 0.8, fs, 0.85 * a, METAL, phone ? 'right' : 'center', 600);
    D.line(s, bx0, by, bx1, by, C.muted, 0.25 * a, 1, [3, 5]);
    // the ruler, in cm
    const ry = bot + fs * 1.2;
    D.line(s, bx0, ry, bx1, ry, C.muted, 0.7 * a, 1);
    for (let cm = 0; cm <= Math.floor(BOX); cm++) {
      const big = cm % 5 === 0;
      D.line(s, X(cm), ry, X(cm), ry + (big ? 6 : 3), C.muted, 0.7 * a, 1);
      if (big && (cm % 10 === 0 || !phone)) label(s, `${cm}`, X(cm), ry + fs * 1.15, fs - 1, 0.75 * a);
    }
    label(s, 'cm', bx1 + fs * 1.2, ry + fs * 1.15, fs - 1, 0.75 * a, C.muted, 'left');
    return { top, bot, ry };
  }
  const E_inc = (x, tt) => Math.sin(OM * tt - kcm * x);                   // tt: time since the wave set off (s)
  const E_ref = (x, tt) => -Math.sin(OM * tt - kcm * (2 * BOX - x));
  function partB(s, t, a) {
    if (a <= 0) return;
    const { bx0, by, amp, pxcm, fs, phone } = L;
    const box = drawBox(s, a, smooth((t - T_BACK) / 1.0));
    const tt = t - TW0, v = LAMcm / TD;                          // cm per second on screen
    const front = v * tt;                                        // how far the first wave has got (cm along its path)
    const inc = [], ref = [], sum = [];
    for (let i = 0; i <= 300; i++) {
      const x = BOX * i / 300;
      const hi = tt > 0 && x <= front, hr = tt > 0 && front > BOX && x >= 2 * BOX - front;
      const ei = hi ? E_inc(x, tt) : 0, er = hr ? E_ref(x, tt) : 0;
      if (hi) inc.push([X(x), by - amp * ei]);
      if (hr) ref.push([X(x), by - amp * er]);
      if (hi || hr) sum.push([X(x), by - amp * (ei + er)]);
    }
    const thin = 1 - smooth((t - at(6) - 1) / 2);                  // the two travelling waves fade once the standing wave is clear
    D.glowLine(s, inc, WAVE, 0.55 * a * thin, 1);
    D.glowLine(s, ref, REFL, 0.55 * a * thin, 1);
    D.glowLine(s, sum, '235,240,255', 0.95 * a * smooth((front - BOX) / (BOX * 0.3)), 1.6);
    // a legend for the three waves
    const lg = a * fade(t, at(4), at(7), 0.6, 0.6);
    if (lg > 0) {
      label(s, 'arriving', X(BOX * 0.2), by + amp * 1.45, fs, lg * thin, WAVE, 'center', 600);
      label(s, 'reflected', X(BOX * 0.8), by + amp * 1.45, fs, lg * thin * smooth((front - BOX) / 2), REFL, 'center', 600);
      label(s, 'total: a standing wave', X(BOX * 0.5), by - amp * 2.35, fs, lg * smooth((front - 2 * BOX) / 2), '235,240,255', 'center', 600);
    }
    label(s, 'electric field', bx0 + fs * 0.4, by - amp * 1.45, fs, 0.75 * a, C.muted, 'left');
    // nodes and antinodes
    const na = a * smooth((t - at(5)) / 0.8), aa = a * smooth((t - at(6)) / 0.8);
    for (const xn of NODES) { if (na > 0) { D.glowDot(s, X(xn), by, 9, C.neg, na); } }
    if (na > 0) label(s, 'node', X(NODES[2]), by + amp * 1.3, fs, na, C.neg, 'center', 600);
    if (aa > 0) {
      for (const xa of ANTI) D.line(s, X(xa), by - amp * 2.1, X(xa), by + amp * 2.1, C.light, 0.35 * aa, 1, [3, 4]);
      // the envelope ±2A sin kx
      const env = (sg) => Array.from({ length: 151 }, (_, i) => { const x = BOX * i / 150; return [X(x), by - sg * 2 * amp * 0.5 * Math.abs(Math.sin(kcm * x)) * 1.0]; });
      label(s, 'antinode', X(ANTI[0]), by + amp * 1.3, fs, aa, C.light, 'center', 600);
      // the half-wavelength bracket
      const yb = box.top - fs * 0.6;
      D.line(s, X(ANTI[2]), yb, X(ANTI[3]), yb, C.light, 0.9 * aa, 1.4);
      label(s, `λ/2 = ${(LAMcm / 2).toFixed(1)} cm`, (X(ANTI[2]) + X(ANTI[3])) / 2, yb - fs * 0.85, fs, aa, C.light, 'center', 600);
      void env;
    }
    // the heating: proportional to sin² kx, drawn as a glowing strip under the box
    const ha = a * smooth((t - at(7)) / 0.8);
    if (ha > 0) drawHeat(s, box.bot + fs * 3.2, ha, 'heating');
  }
  function drawHeat(s, y, a, name) {
    const { g } = s, { fs } = L, h = fs * 1.2;
    for (let i = 0; i < 160; i++) {
      const x = BOX * (i + 0.5) / 160, p = Math.sin(kcm * x) ** 2;
      g.fillStyle = `rgba(${HOT},${a * (0.08 + 0.85 * p)})`; g.fillRect(X(BOX * i / 160), y, X(BOX / 160) - X(0) + 0.6, h);
    }
    if (L.phone) label(s, name, L.bx0, y - fs * 0.7, fs, a, HOT, 'left', 600);
    else label(s, name, L.bx0 - fs * 0.5, y + h / 2, fs, a, HOT, 'right', 600);
  }
  // part C: the chocolate
  function partC(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { by, amp, fs, phone } = L;
    const box = drawBox(s, a);
    // the standing wave keeps going, faint
    const pts = Array.from({ length: 201 }, (_, i) => { const x = BOX * i / 200; return [X(x), by - amp * 0.6 * (-2 * Math.cos(OM * (t - TW0)) * Math.sin(kcm * x)) * 0.5]; });
    D.glowLine(s, pts, '235,240,255', 0.35 * a, 1.2);
    // the chocolate bar lying across the box
    const cy0 = by + amp * 0.95, ch = amp * 0.55, x0 = 0.6, x1 = BOX - 0.6;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(${CHOC},${a})`; g.fillRect(X(x0), cy0, X(x1) - X(x0), ch);
    for (let cm = x0 + 2.5; cm < x1; cm += 2.5) { g.fillStyle = `rgba(60,34,18,${0.6 * a})`; g.fillRect(X(cm), cy0, 1, ch); }
    // melted where sin² kx > threshold; the threshold falls from 1 to 0.75 as it heats
    const th = 1 - 0.25 * smooth((t - MELT0) / (MELT1 - MELT0));
    if (th < 1) {
      for (let i = 0; i < 300; i++) {
        const x = lerp(x0, x1, (i + 0.5) / 300), p = Math.sin(kcm * x) ** 2;
        if (p > th) { g.fillStyle = `rgba(${CHOC_M},${a})`; g.fillRect(X(lerp(x0, x1, i / 300)), cy0 - ch * 0.08, (X(x1) - X(x0)) / 300 + 0.6, ch * 1.16); }
      }
      // a soft shine on each melted spot
      for (const xa of ANTI) D.glowDot(s, X(xa), cy0 + ch * 0.4, ch * 1.2 * (1 - th) * 4, '255,200,150', 0.35 * a);
    }
    label(s, 'chocolate', X(x0), cy0 - fs * 0.7, fs, 0.85 * a, '210,160,120', 'left', 600);
    const ma = a * smooth((t - at(9)) / 0.8);
    if (ma > 0) for (const xa of ANTI) label(s, phone ? '' : 'melted', X(xa), cy0 + ch + fs * 0.9, fs - 1, 0.9 * ma, '230,180,140');
    // measuring across four gaps
    const sa = a * smooth((t - at(11)) / 0.8);
    if (sa > 0) {
      const yb = box.ry + fs * 2.6;
      D.line(s, X(ANTI[0]), yb, X(ANTI[4]), yb, C.light, 0.95 * sa, 1.6);
      D.line(s, X(ANTI[0]), yb - 5, X(ANTI[0]), yb + 5, C.light, 0.95 * sa, 1.6); D.line(s, X(ANTI[4]), yb - 5, X(ANTI[4]), yb + 5, C.light, 0.95 * sa, 1.6);
      label(s, `4 gaps: ${SPAN.toFixed(1)} cm`, (X(ANTI[0]) + X(ANTI[4])) / 2, yb + fs * 1.05, fs + 1, sa, C.light, 'center', 600);
    }
  }

  // ---------- part D: molecules ----------
  function drawWater(s, x, y, r, ang, a, big = false) {
    // oxygen at (x, y); the two hydrogens 104.5° apart, centred on the direction ang (from O towards the H side)
    const { g } = s, half = 104.5 / 2 * Math.PI / 180, d = r * 1.05;
    const hs = [ang - half, ang + half].map((q) => [x + d * Math.cos(q), y + d * Math.sin(q)]);
    g.globalCompositeOperation = 'source-over';
    for (const [hx, hy] of hs) { g.fillStyle = `rgba(235,240,250,${a})`; g.beginPath(); g.arc(hx, hy, r * 0.55, 0, 7); g.fill(); }
    g.fillStyle = `rgba(230,80,90,${a})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    if (big) {
      const fs = L.fs;
      label(s, 'δ−', x - Math.cos(ang) * r * 2.1, y - Math.sin(ang) * r * 2.1, fs + 2, a, '255,140,150', 'center', 700);
      label(s, 'δ+', x + Math.cos(ang) * r * 2.4, y + Math.sin(ang) * r * 2.4, fs + 2, a, '220,230,255', 'center', 700);
      label(s, 'O', x, y, fs, a, '40,10,10', 'center', 700);
    }
  }
  function partD(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { W, capTop, fs, phone, mols } = L;
    const bx0 = W * (phone ? 0.08 : 0.16), bx1 = W * (phone ? 0.74 : 0.7), by0 = capTop * (phone ? 0.1 : 0.12), by1 = capTop * (phone ? 0.78 : 0.88);
    g.fillStyle = `rgba(30,60,110,${0.25 * a})`; g.globalCompositeOperation = 'source-over';
    g.beginPath(); g.roundRect(bx0, by0, bx1 - bx0, by1 - by0, 12); g.fill();
    label(s, 'water (molecules enlarged, motion slowed)', (bx0 + bx1) / 2, by1 + fs * 1.1, fs, 0.8 * a, C.muted);
    // the oscillating field: arrows down the sides, up or down with the field (on-screen period 1.6 s)
    const tt = t - PD, Ef = Math.sin(OM * tt);
    for (const xx of [bx0 - fs * 1.6, bx1 + fs * 1.6]) {
      const ym = (by0 + by1) / 2, len = (by1 - by0) * 0.32 * Ef;
      D.arrow(s, xx, ym + len, xx, ym - len, C.field, 0.9 * a * Math.min(1, Math.abs(Ef) * 3), '', { width: 2.4, head: 10 });
    }
    label(s, 'E', bx1 + fs * 3, (by0 + by1) / 2, fs + 4, a, C.field, 'left', 600);
    // temperature: rises through this part (schematic)
    const heat = smooth((t - at(13)) / (at(16) - at(13)));
    // molecules: each turned towards the field direction and back, plus a random jostling that grows as it warms
    const r = Math.max(4, Math.min(W, capTop) * (phone ? 0.018 : 0.016));
    mols.forEach((m, i) => {
      if (i === 0) return;
      const jx = (0.3 + 2.6 * heat) * r * (Math.sin(t * (1.7 + m.j1 * 0.3) + m.j2) + 0.5 * Math.sin(t * (2.9 + m.j2 * 0.2) + m.j1));
      const jy = (0.3 + 2.6 * heat) * r * (Math.cos(t * (1.5 + m.j2 * 0.3) + m.j1) + 0.5 * Math.cos(t * (3.1 + m.j1 * 0.2) + m.j2));
      const x = lerp(bx0 + r * 3, bx1 - r * 3, m.x) + jx, y = lerp(by0 + r * 3, by1 - r * 3, m.y) + jy;
      const ang = m.a0 + 0.55 * Math.sin(OM * tt - m.ph) + heat * 0.8 * Math.sin(t * (2.2 + m.j1 * 0.2));
      drawWater(s, x, y, r, ang, 0.85 * a);
    });
    // the featured molecule in the middle: δ+ end turned towards the field direction (up when E points up)
    const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2, R = r * 2.4;
    const ang = -1.0 * Math.sin(OM * tt - 0.35);                       // screen angle of the δ+ side: up (−) when E points up
    g.fillStyle = `rgba(4,6,13,${0.6 * a})`; g.beginPath(); g.arc(cx, cy, R * 3.2, 0, 7); g.fill();
    drawWater(s, cx, cy, R, ang, a, true);
    // a thermometer
    const tx = phone ? W * 0.88 : W * 0.84, ty0 = by0 + (by1 - by0) * 0.12, ty1 = by1 - (by1 - by0) * 0.12, tw = fs * 0.9;
    g.fillStyle = `rgba(230,235,250,${0.15 * a})`; g.beginPath(); g.roundRect(tx - tw / 2, ty0, tw, ty1 - ty0, tw / 2); g.fill();
    g.strokeStyle = `rgba(230,235,250,${0.6 * a})`; g.lineWidth = 1.2; g.stroke();
    const lv = lerp(0.18, 0.85, heat);
    g.fillStyle = `rgba(${HOT},${0.9 * a})`; g.beginPath(); g.roundRect(tx - tw * 0.3, lerp(ty1, ty0, lv), tw * 0.6, ty1 - lerp(ty1, ty0, lv), tw * 0.3); g.fill();
    g.beginPath(); g.arc(tx, ty1 + tw * 0.4, tw * 0.8, 0, 7); g.fill();
    label(s, 'temperature', tx, ty0 - fs * 0.9, fs, 0.85 * a, HOT, 'center', 600);
  }

  // ---------- part E: the turntable, seen from above ----------
  const PLATE = 12, CEN = BOX / 2, TURN = 10;                       // cm, cm, s per turn
  const pattern = (x, y) => (Math.sin(Math.PI * 5 * x / BOX) ** 2) * (Math.sin(Math.PI * 5 * y / BOX) ** 2);
  const NG = 30, GRID = [];
  for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) {
    const u = (i + 0.5) / NG * 2 - 1, v = (j + 0.5) / NG * 2 - 1;
    if (u * u + v * v <= 1) GRID.push([u * PLATE, v * PLATE]);   // positions on the plate (cm from its centre)
  }
  // heating added up for each grid point on a turning plate, sampled every 0.1 s (from the start of part E)
  const E_STEPS = 400, ACC = [];
  {
    const acc = new Float32Array(GRID.length);
    for (let k = 0; k <= E_STEPS; k++) {
      ACC.push(acc.slice());
      const th = 2 * Math.PI * (k * 0.1) / TURN, cs = Math.cos(th), sn = Math.sin(th);
      GRID.forEach(([px, py], n) => { acc[n] += pattern(CEN + px * cs - py * sn, CEN + px * sn + py * cs) * 0.1; });
    }
  }
  const STILL = GRID.map(([px, py]) => pattern(CEN + px, CEN + py));
  function partE(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { W, capTop, fs, phone } = L;
    const R = Math.min(W * (phone ? 0.22 : 0.17), capTop * 0.3), y = capTop * (phone ? 0.42 : 0.47);
    const xs = [W * (phone ? 0.27 : 0.3), W * (phone ? 0.73 : 0.7)];
    const tt = Math.max(0, t - at(18) + 0.5), k = Math.min(E_STEPS, Math.floor(tt / 0.1));
    const accMax = Math.max(0.0001, tt * 0.30);                         // a common colour scale for both plates
    const cell = R / PLATE * (2 * PLATE / NG) + 0.6;
    // the field pattern under each plate (faint), then the food's temperature
    xs.forEach((cx, side) => {
      const th = side === 1 ? 2 * Math.PI * tt / TURN : 0, cs = Math.cos(th), sn = Math.sin(th);
      const sc = R / PLATE;
      // hot spots of the oven (fixed in the oven)
      g.globalCompositeOperation = 'lighter';
      for (let j = 0; j < 22; j++) for (let i = 0; i < 22; i++) {
        const ox = (i + 0.5) / 22 * 2 * (PLATE + 2) - (PLATE + 2), oy = (j + 0.5) / 22 * 2 * (PLATE + 2) - (PLATE + 2);
        const p = pattern(CEN + ox, CEN + oy);
        if (p > 0.05) { g.fillStyle = `rgba(${HOT},${0.12 * a * p * (1 - 0.6 * smooth((t - at(18)) / 1.5))})`; g.fillRect(cx + ox * sc - sc, y + oy * sc - sc, sc * 2.2, sc * 2.2); }
      }
      g.globalCompositeOperation = 'source-over';
      // the plate
      g.fillStyle = `rgba(160,200,230,${0.18 * a})`; g.beginPath(); g.arc(cx, y, R * 1.08, 0, 7); g.fill();
      g.strokeStyle = `rgba(190,220,240,${0.6 * a})`; g.lineWidth = 1.2; g.stroke();
      // the food's temperature (each grid point carried round with the plate)
      const fa = a * smooth((t - at(18) + 0.5) / 0.8);
      if (fa > 0) GRID.forEach(([px, py], n) => {
        const val = side === 1 ? ACC[k][n] : STILL[n] * tt;
        const x = cx + (px * cs - py * sn) * sc, yy = y + (px * sn + py * cs) * sc;
        g.fillStyle = `rgba(${heatRGB(val / accMax)},${0.9 * fa})`; g.fillRect(x - cell / 2, yy - cell / 2, cell, cell);
      });
      // a mark on the turning plate so the rotation shows
      const mk = [cx + PLATE * 1.04 * sc * cs, y + PLATE * 1.04 * sc * sn];
      g.fillStyle = `rgba(230,235,250,${0.8 * a})`; g.beginPath(); g.arc(mk[0], mk[1], 3, 0, 7); g.fill();
      label(s, side === 0 ? (phone ? 'still' : 'food that stays still') : (phone ? 'turntable' : 'on the turntable'), cx, y + R * 1.08 + fs * 1.3, fs, 0.9 * a, C.text, 'center', 600);
    });
    label(s, 'hot spots (simplified pattern)', 14, fs * 1.4, fs, 0.8 * a * fade(t, PE, at(19), 0.6, 0.8), HOT, 'left', 600);
    // colour key
    const ka = a * smooth((t - at(18)) / 0.8);
    if (ka > 0) {
      const kx0 = W / 2 - R * 0.8, kx1 = W / 2 + R * 0.8, ky = y + R * 1.08 + fs * 3.0;
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${heatRGB(i / 39)},${ka})`; g.fillRect(lerp(kx0, kx1, i / 40), ky, (kx1 - kx0) / 40 + 0.5, fs * 0.6); }
      label(s, 'cool', kx0 - 6, ky + fs * 0.3, fs - 1, ka, C.muted, 'right'); label(s, 'hot', kx1 + 6, ky + fs * 0.3, fs - 1, ka, C.muted, 'left');
    }
    // energy check readout
    const ea = a * smooth((t - at(19)) / 0.8);
    if (ea > 0) label(s, `Q = 800 × 60 = 48 000 J   ΔT = ${DT.toFixed(0)} K`, 14, fs * 1.4, fs + 1, ea, C.light, 'left', 600);
  }

  // ---------- part F: the door mesh ----------
  function partF(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { W, capTop, fs, phone } = L;
    const mx = W * 0.6, y0 = capTop * 0.1, y1 = capTop * 0.9;
    const pxcm = (mx - W * 0.04) / (LAMcm * 1.5);                    // 1.5 wavelengths fit to the left of the mesh
    // the mesh: metal, with holes 2 mm across every 4 mm (to scale)
    const hole = 0.2 * pxcm, pitch = 0.4 * pxcm;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(${METAL},${0.9 * a})`;
    for (let y = y0; y < y1; y += pitch) g.fillRect(mx - 2, y, 4, Math.max(0.8, pitch - hole));
    g.fillStyle = `rgba(150,190,230,${0.12 * a})`; g.fillRect(mx + 3, y0, Math.max(6, pxcm * 0.5), y1 - y0);
    label(s, phone ? 'mesh: holes 2 mm' : 'metal mesh: holes about 2 mm across (to scale)', mx, y1 + fs * 1.7, fs, 0.9 * a, METAL, 'center', 600);
    // microwaves inside (left): a standing wave with a node at the mesh, as at a metal wall
    const ym = capTop * 0.42, amp = capTop * 0.12, kk = 2 * Math.PI / (LAMcm * pxcm);
    const sw = Array.from({ length: 201 }, (_, i) => { const x = lerp(W * 0.04, mx, i / 200); return [x, ym - amp * Math.cos(OM * t) * Math.sin(kk * (mx - x))]; });
    D.glowLine(s, sw, WAVE, 0.85 * a, 1.5);
    label(s, phone ? 'microwaves: reflected' : 'microwaves, λ = 12.2 cm: reflected', W * 0.04, ym - amp * 1.5, fs, 0.9 * a, WAVE, 'left', 600);
    D.line(s, mx + 8, ym, W * 0.97, ym, C.muted, 0.3 * a, 1, [3, 5]);
    label(s, 'no microwaves', (mx + W) / 2, ym - fs, fs, 0.75 * a, C.muted);
    // light from the food passing through the holes, to an eye (wavelength far too small to draw)
    const la = a * smooth((t - at(21) + 0.5) / 0.8), ly = capTop * 0.74;
    if (la > 0) {
      const n0 = Math.round((ly - y0) / pitch);
      for (let j = -2; j <= 2; j++) {
        const yy = y0 + (n0 + j) * pitch + pitch - hole / 2, len = W * 0.92, sp = (t * 160) % 40;   // through the middle of a hole
        g.strokeStyle = `rgba(255,214,102,${0.75 * la})`; g.lineWidth = 1.6; g.setLineDash([22, 18]); g.lineDashOffset = -sp;
        g.beginPath(); g.moveTo(W * 0.06, yy); g.lineTo(Math.min(W * 0.06 + len, W * 0.93), yy); g.stroke();
      }
      g.setLineDash([]); g.lineDashOffset = 0;
      label(s, phone ? 'light: passes through' : 'light, λ under a micrometre: passes through the holes', W * 0.06, ly - pitch * 2 - fs * 1.1, fs, la, C.light, 'left', 600);
      // the eye
      const ex = W * 0.95, ey = ly;
      g.strokeStyle = `rgba(230,235,250,${0.9 * la})`; g.lineWidth = 1.6;
      g.beginPath(); g.ellipse(ex, ey, fs * 1.0, fs * 0.6, 0, 0, 7); g.stroke();
      g.fillStyle = `rgba(230,235,250,${0.9 * la})`; g.beginPath(); g.arc(ex - fs * 0.3, ey, fs * 0.3, 0, 7); g.fill();
    }
    label(s, 'inside the oven', W * 0.04, y1 + fs * 0.4, fs, 0.75 * a, C.muted, 'left');
    label(s, 'outside', W * 0.97, y1 + fs * 0.4, fs, 0.75 * a, C.muted, 'right');
  }

  // ---------- end card ----------
  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.88 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 52, 13, 20)), s3 = Math.round(clamp(W / 62, 11, 16));
    g.font = D.sans(s1, 300);
    const l1 = D.wrap(s, 'A microwave oven: standing electromagnetic waves heating water', W - 48);
    let y = H * (phone ? 0.11 : 0.15);
    D.text(s, l1, W / 2, y, s1, a, D.sans(s1, 300)); y += s1 * 1.3 * l1.length + s2 * 0.6;
    const items = [
      ['λ = c/f = 12.2 cm', WAVE, 'The metal walls reflect the waves into a standing wave: nodes at the walls, antinodes λ/2 = 6.1 cm apart.'],
      ['hot spots', HOT, 'Food heats fastest at the antinodes. A turntable carries it through them; melted chocolate spots measure c = 2 × spacing × f.'],
      ['polar molecules', '230,80,90', 'The oscillating field twists water molecules, which jostle their neighbours: the internal energy rises.'],
    ];
    if (phone) {
      for (const [eq, rgb, txt] of items) {
        D.text(s, eq, W / 2, y, s2 + 1, a, D.sans(s2 + 1, 600), rgb); y += s2 * 1.25;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 36); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.8;
      }
    } else {
      const colW = Math.min(W * 0.28, 320);
      g.font = D.sans(s3);
      const wr = items.map(([, , txt]) => D.wrap(s, txt, colW));
      items.forEach(([eq, rgb], i) => {
        const x = W / 2 + (i - 1) * W * 0.31;
        D.text(s, eq, x, y, s2 + 1, a, D.sans(s2 + 1, 600), rgb);
        D.text(s, wr[i], x, y + s2 * 1.4, s3, 0.85 * a, D.sans(s3));
      });
      y += s2 * 1.4 + s3 * 1.3 * Math.max(...wr.map((w) => w.length)) + s3;
    }
    g.font = D.sans(s3 - 1);
    D.text(s, D.wrap(s, 'Simplified: a real oven\'s standing waves form a 3D pattern, and the field is drawn hugely slowed down. How the magnetron makes the microwaves is beyond the course.', Math.min(W - 40, 760)),
      W / 2, Math.max(y + s3, H * (phone ? 0.78 : 0.8)), s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('microwave', {
    duration: DURATION,
    poster: at(9) + 3,
    // score: a warm kitchen hum (D-flat major, a soft triangle pad, a low drone, a little wind)
    music: { chords: [[35, 42, 47, 51], [40, 47, 52, 55], [38, 45, 50, 54], [33, 40, 45, 48]], bar: 9, pad: 'triangle', cutoff: 700, drone: 0.12, wind: 0.15, shimmer: 0.12, tremolo: 0.06, volume: 0.49 },
    resize: layout,
    info: {
      CAPS, DURATION, LAM, BOX, NODES, ANTI, SPAN, SPACING, C_MEAS, DT, SLOW,
      check() {
        const r = (x, d = 3) => +x.toFixed(d);
        // the standing wave: incident + reflected must vanish at both walls at all times, and equal −2A cos ωt sin kx
        let wallMax = 0, formErr = 0;
        for (let k = 0; k < 200; k++) {
          const tt = 10 + k * 0.037;
          wallMax = Math.max(wallMax, Math.abs(E_inc(0, tt) + E_ref(0, tt)), Math.abs(E_inc(BOX, tt) + E_ref(BOX, tt)));
          for (const x of [1.3, 7.7, 19.1]) formErr = Math.max(formErr, Math.abs(E_inc(x, tt) + E_ref(x, tt) + 2 * Math.cos(OM * tt) * Math.sin(kcm * x)));
        }
        return { lambda_m: r(LAM, 4), half_cm: r(LAMcm / 2, 2), box_cm: r(BOX, 1), T: (1 / f).toExponential(3), slow: SLOW.toExponential(2),
          nodes: NODES.map((x) => r(x, 2)), anti: ANTI.map((x) => r(x, 2)), span: r(SPAN, 2), spacing: r(SPACING, 3), c: C_MEAS.toExponential(3),
          dT: r(DT, 1), wallMax: wallMax.toExponential(1), formErr: formErr.toExponential(1),
          maxRate: Math.max(...CAPS.map(([a0, b0, tx]) => tx.length / (b0 - a0 - 0.6))).toFixed(1), DURATION: r(DURATION, 1) };
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.15);
      partA1(s, t, partA(t, 0, PB));
      partB(s, t, partA(t, PB, PC));
      partC(s, t, partA(t, PC, PD));
      partD(s, t, partA(t, PD, PE));
      partE(s, t, partA(t, PE, PF));
      partF(s, t, partA(t, PF, null));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.75 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'How does a microwave oven work?', 'Standing waves, hot spots and twisting water molecules');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
