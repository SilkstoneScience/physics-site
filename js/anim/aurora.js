/* How do the Northern Lights work? Charged particles from the Sun, steered by the Earth's magnetic field (D.3),
   light up oxygen and nitrogen in the upper air (E.1 energy levels and photons).
   No pauses (teacher's preference): each caption simply stays up long enough to read.

   Numbers (data-booklet constants: h = 6.63 × 10⁻³⁴ J s, c = 3.00 × 10⁸ m s⁻¹, e = 1.60 × 10⁻¹⁹ C,
   mₑ = 9.11 × 10⁻³¹ kg, mₚ = 1.67 × 10⁻²⁷ kg; checked by info.check()):
   - Solar wind at about 400 km s⁻¹ over 1.5 × 10¹¹ m: 1.5 × 10¹¹ ÷ 4.0 × 10⁵ = 3.75 × 10⁵ s = 4.3 days ("about 4 days").
   - A 1 keV electron: E = 1000 × 1.60 × 10⁻¹⁹ = 1.60 × 10⁻¹⁶ J; v = √(2E/m) = √(3.2 × 10⁻¹⁶ ÷ 9.11 × 10⁻³¹)
     = √(3.51 × 10¹⁴) = 1.87 × 10⁷ m s⁻¹ (6% of c, so the non-relativistic formula is fine).
   - In B = 5 × 10⁻⁵ T (near the pole, 100–300 km up): r = mv/qB = (9.11 × 10⁻³¹ × 1.87 × 10⁷) ÷ (1.60 × 10⁻¹⁹ × 5 × 10⁻⁵)
     = 1.704 × 10⁻²³ ÷ 8.0 × 10⁻²⁴ = 2.13 m ("2.1 m").
   - A 1 keV proton: v = √(3.2 × 10⁻¹⁶ ÷ 1.67 × 10⁻²⁷) = 4.38 × 10⁵ m s⁻¹; r = (1.67 × 10⁻²⁷ × 4.38 × 10⁵) ÷ 8.0 × 10⁻²⁴ = 91.4 m ("91 m").
   - Direction (north, B points down into the Earth): seen from above, a proton circles anticlockwise, an electron clockwise.
   - Photon energies, E = hc/λ with hc = 1.989 × 10⁻²⁵ J m:
     oxygen green 557.7 nm: 3.567 × 10⁻¹⁹ J = 2.23 eV; oxygen red 630.0 nm: 3.157 × 10⁻¹⁹ J = 1.97 eV;
     ionised nitrogen (N₂⁺) violet 427.8 nm: 4.649 × 10⁻¹⁹ J = 2.91 eV.
     Oxygen's levels above its ground state (with these constants): 1.97 eV and 1.97 + 2.23 = 4.20 eV (green is 4.20 → 1.97,
     red is 1.97 → 0).
   - 1000 eV ÷ 2.23 eV = 448: one 1 keV electron carries "hundreds of times" a green photon's energy.
   Drawings: the field lines are a dipole (r = L R sin²θ); the flow of the solar wind round the field is a schematic
   (a uniform stream round a "half-body", exact for that model, not for the real magnetosphere); the helix is exact;
   the collisions and photons in the air are a seeded random picture; the curtain is decorative. */
(() => {
  'use strict';
  const { V, D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- physics ----------
  const h = 6.63e-34, c = 3.00e8, e = 1.60e-19, me = 9.11e-31, mp = 1.67e-27, B = 5e-5;
  const E1 = 1000 * e, ve = Math.sqrt(2 * E1 / me), vp = Math.sqrt(2 * E1 / mp);
  const re = me * ve / (e * B), rp = mp * vp / (e * B);
  const eV = (nm) => h * c / (nm * 1e-9) / e;
  const EG = eV(557.7), ER = eV(630.0), EVI = eV(427.8);
  const LEV = [0, ER, ER + EG];               // oxygen: ground, 1.97, 4.20 eV above the ground state
  const DAYS = 1.5e11 / 4.0e5 / 86400;

  // ---------- captions (timed from their length: never faster than ~14.5 characters a second) ----------
  const nb = (s) => s.replace(/~/g, ' ');
  const SEQ = [
    ['The Sun blows out a thin, fast stream of charged particles, mostly protons and electrons: the solar wind.'],
    ['At about 400~km~s⁻¹ they take about 4~days to cross the 1.5~×~10¹¹~m to the Earth (distances here are not to scale).'],
    ['The Earth\'s magnetic field reaches far out into space. Its field lines are drawn here like those of a bar magnet.'],
    ['A magnetic field pushes on moving charges: F~=~qvB~sin~θ, always at right angles to their velocity. So it never changes their speed: the magnetic force does no work.'],
    ['So most of the solar wind is steered round the Earth\'s magnetic field (the real flow is complicated: this one is schematic).'],
    ['Predict: where could some of the charged particles get down into the atmosphere?', 6],
    ['Near the magnetic poles, where the field lines dip steeply down into the atmosphere.'],
    ['Zoom in near the north pole, where B is about 5~×~10⁻⁵~T, pointing down into the Earth. Auroral electrons have about 1~keV of energy (most are first sped up in the Earth\'s magnetic tail: beyond the course).', 0, 0.6],
    ['An electron moving along the field lines feels no force (θ~=~0). One moving across them is pushed round in a circle.'],
    ['Moving at an angle, it does both: it spirals in a helix. In a uniform field like this, the part of its velocity along the field never changes.'],
    ['A 1~keV electron moves at 1.87~×~10⁷~m~s⁻¹. Straight across the field, r = mv/qB = (9.11~×~10⁻³¹~×~1.87~×~10⁷) ÷ (1.60~×~10⁻¹⁹~×~5~×~10⁻⁵) = 2.1~m.', 1.5],
    ['A proton with the same energy is slower but far heavier: r~=~91~m. It also circles the opposite way.'],
    ['A few metres, or even 91~m, is tiny next to the Earth (radius 6.4~×~10⁶~m), so the particles follow the field lines down to the poles.'],
    ['About 100 to 300~km up, they crash into atoms and molecules of oxygen and nitrogen in the thin air.', 0, 0.6],
    ['Each collision gives an electron in the atom energy: it jumps up to a higher energy level, an excited state.'],
    ['When it drops back, the atom emits a photon carrying exactly the energy difference: E~=~hf~=~hc/λ.'],
    ['Oxygen\'s green light is 557.7~nm: E = hc/λ = (6.63~×~10⁻³⁴~×~3.00~×~10⁸) ÷ (5.577~×~10⁻⁷) = 3.57~×~10⁻¹⁹~J = 2.23~eV.', 1.5],
    ['Its red light, 630.0~nm, comes from a drop of 1.97~eV. Ionised nitrogen adds violet light: 427.8~nm, 2.91~eV.'],
    ['Red glows highest (above about 200~km), green lower down, violet along the bottom edge (about 100~km). Lower down, collisions stop the slow red drop.'],
    ['One 1~keV electron carries hundreds of times a photon\'s energy, so it can light up many atoms before it stops.'],
    ['Seen from space, the light forms a ring around each magnetic pole: the auroral oval (drawn schematically).', 0, 0.6],
    ['From the ground: glowing curtains of light that ripple as the solar wind gusts and the Earth\'s field shifts.', 0, 0.6],
  ];
  const CAPS = [];
  let tc = 4.8;
  for (const [txt, extra = 0, gap = 0] of SEQ) {
    const t0 = tc + gap, d = Math.max(4.8, nb(txt).length / 14.5 + 0.6) + extra;
    CAPS.push([t0, t0 + d, nb(txt)]); tc = t0 + d + 0.2;
  }
  const at = (i) => CAPS[i][0], end = (i) => CAPS[i][1];
  // part boundaries
  const P2 = at(7) - 0.5, P3 = at(13) - 0.5, P4 = at(20) - 0.5, P5 = at(21) - 0.5;
  const END_CARD = end(21) + 0.4, DURATION = END_CARD + 13;
  const XF = 1.0;                                                  // cross-fade time between parts
  const partA = (t, a, b) => (a <= 0 ? 1 : smooth((t - a + XF / 2) / XF)) * (b == null ? 1 : 1 - smooth((t - b + XF / 2) / XF));

  // ---------- helpers ----------
  let seed = 31416;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  // wavelength (nm) → "r,g,b" (a standard approximation of the visible colours)
  const nmRGB = (nm) => {
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else { r = 1; }
    const k = nm < 420 ? 0.4 + 0.6 * (nm - 380) / 40 : 1;
    return [r, g, b].map((x) => Math.round(255 * Math.pow(clamp(x * k, 0, 1), 0.8))).join(',');
  };
  const GREEN = nmRGB(557.7), RED = nmRGB(630.0), VIOLET = '170,110,255';
  const F_RGB = C.field;
  // A small piece of rich text: [text, 'i' italic serif | 'r' upright serif | 'sup' raised | 'sans'].
  function rich(s, parts, x, y, size, a, rgb = C.text, align = 'center') {
    const { g } = s; if (a <= 0) return 0;
    const font = (st) => st === 'sup' ? D.sans(Math.round(size * 0.7)) : st === 'i' ? D.serif(size) : st === 'r' ? D.serif(size, false) : D.sans(size);
    const ws = parts.map(([tx, st]) => { g.font = font(st); return g.measureText(tx).width; });
    const total = ws.reduce((p, q) => p + q, 0);
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`;
    parts.forEach(([tx, st], i) => { g.font = font(st); g.fillText(tx, px, st === 'sup' ? y - size * 0.35 : y); px += ws[i]; });
    g.shadowBlur = 0; return total;
  }
  const label = (s, txt, x, y, fs, a, rgb = C.muted, align = 'center', w = 400) => D.text(s, txt, x, y, fs, a, D.sans(fs, w), rgb, align);

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25));
    const capTop = H - capFs * (phone ? 7.4 : 5.6);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    // part 1: the Sun, the Earth and its field
    const ey = capTop * (phone ? 0.47 : 0.5), ex = W * (phone ? 0.66 : 0.68);
    const RE = Math.max(6, Math.min(W * (phone ? 0.032 : 0.026), capTop * 0.032));
    const b = 10 * RE;                                              // stand-off of the schematic boundary: 10 Earth radii
    const U = W * (phone ? 0.16 : 0.12);                            // screen speed of the solar wind far away (px/s)
    // pre-integrate the solar-wind paths in the flow round a half-body (source at the Earth, uniform stream to the right)
    const paths = [];
    seed = 2718;
    const NP = phone ? 70 : 110, x0 = -W * 0.02, ymax = capTop * 0.5, ymin = Math.min(0.6 * b, ymax * 0.8);
    for (let i = 0; i < NP; i++) {
      const yy = (rnd() < 0.5 ? -1 : 1) * lerp(ymin, ymax, rnd());
      let x = x0 - ex, y = -yy;                                     // maths coordinates about the Earth, y up
      const pts = [], dt = 1 / 60;
      for (let k = 0; k < 60 * 30; k++) {
        if (k % 2 === 0) pts.push([ex + x, ey - y]);
        const r2 = x * x + y * y, u = U * (1 + b * x / r2), v = U * b * y / r2;
        x += u * dt; y += v * dt;
        if (ex + x > W * 1.05) break;
      }
      paths.push({ pts, ph: rnd(), size: 0.8 + rnd() * 0.6, pos: rnd() < 0.5 });
    }
    // part 3: the atmosphere
    const atm = phone
      ? { x0: W * 0.17, x1: W - 8, y0: fs * 2.2, y1: capTop * 0.56 }
      : { x0: W * 0.09, x1: W * 0.58, y0: Math.max(30, H * 0.07), y1: capTop - fs * 1.2 };
    const panel = phone
      ? { x0: 10, x1: W - 10, y0: capTop * 0.56 + fs * 2.6, y1: capTop - fs * 0.4 }
      : { x0: W * 0.62, x1: W - W * 0.03, y0: Math.max(56, H * 0.13), y1: capTop - fs * 0.6 };
    L = { W, H, phone, fs, capFs, capTop, ex, ey, RE, b, U, paths, atm, panel };
  }

  // ---------- part 1: the Sun, the solar wind and the Earth's field ----------
  const LS = [1.6, 2.3, 3.2, 4.4, 6.0, 8.0];
  const fieldLine = (Lv, side) => {
    const { ex, ey, RE } = L, pts = [], th0 = Math.asin(Math.sqrt(1 / Lv));
    for (let i = 0; i <= 80; i++) {
      const th = lerp(th0, Math.PI - th0, i / 80), r = Lv * RE * Math.sin(th) ** 2;
      pts.push([ex + side * r * Math.sin(th), ey - r * Math.cos(th)]);
    }
    return pts;
  };
  function drawSun(s, a) {
    const { g, W } = s, { ey, capTop } = L, x = -W * 0.06, R = capTop * 0.3;
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(x, ey, 0, x, ey, R * 2.2);
    gr.addColorStop(0, `rgba(255,236,190,${0.95 * a})`); gr.addColorStop(0.35, `rgba(255,190,90,${0.5 * a})`);
    gr.addColorStop(0.5, `rgba(255,150,60,${0.14 * a})`); gr.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, ey, R * 2.2, 0, 7); g.fill();
    g.globalCompositeOperation = 'source-over';
    label(s, 'Sun', Math.max(L.fs * 2, W * 0.035), ey + R * 0.95, L.fs + 1, 0.8 * a, '255,214,150', 'left', 600);
  }
  function drawEarth(s, x, y, R, a, tilt = 0) {
    const { g } = s; if (a <= 0) return;
    const gr = g.createRadialGradient(x - R * 0.35, y - R * 0.35, R * 0.1, x, y, R);
    gr.addColorStop(0, `rgba(120,190,255,${a})`); gr.addColorStop(0.7, `rgba(30,90,180,${a})`); gr.addColorStop(1, `rgba(10,30,80,${a})`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill();
    // night side
    const sh = g.createLinearGradient(x - R, y, x + R, y);
    sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, `rgba(0,0,10,${0.55 * a})`);
    g.fillStyle = sh; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill();
    D.glowDot(s, x, y, R * 1.6, '120,170,255', 0.25 * a);
  }
  function part1(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { W, ex, ey, RE, b, paths, fs, phone, capTop } = L;
    drawSun(s, a);
    // field lines (dipole), with an arrow at each equator crossing pointing north
    const fa = a * smooth((t - at(2) - 0.3) / 1.6) * 0.85 + a * 0.15;
    for (const Lv of LS) for (const side of [-1, 1]) {
      const pts = fieldLine(Lv, side);
      D.glowLine(s, pts, F_RGB, 0.5 * fa, 1.1);
      const m = pts[40];
      D.arrow(s, m[0], m[1] + 5, m[0], m[1] - 5, F_RGB, 0.75 * fa, '', { head: 6, width: 1.4, blur: 4 });
    }
    // the boundary of the schematic flow (a half-body round the Earth)
    const ba = a * smooth((t - at(4)) / 1.2);
    if (ba > 0) {
      const top = [], bot = [];
      for (let i = 1; i <= 90; i++) {
        const th = Math.PI - i / 90 * (Math.PI - 0.32), r = b * (Math.PI - th) / Math.sin(th);
        top.push([ex + r * Math.cos(th), ey - r * Math.sin(th)]); bot.push([ex + r * Math.cos(th), ey + r * Math.sin(th)]);
      }
      const all = top.slice().reverse().concat(bot);
      g.setLineDash([5, 6]); D.glowLine(s, all, '150,170,230', 0.35 * ba, 1); g.setLineDash([]);
      if (!phone) label(s, 'edge of the region the field controls (schematic)', ex - b * 0.2, ey - b * 2.25, fs - 1, 0.7 * ba, C.muted, 'center');
    }
    drawEarth(s, ex, ey, RE, a);
    label(s, 'Earth', ex, ey + RE + fs * 1.1, fs, 0.85 * a, '170,200,255', 'center', 600);
    const labY = ey - 8 * RE * 0.62 - fs * 1.6;
    if (t > at(2) - 0.5) {
      const la = a * fade(t, at(2), at(6) + 0.3, 0.8, 0.6);
      label(s, phone ? 'magnetic field lines' : 'Earth\'s magnetic field lines (bar-magnet shape)', ex, labY, fs, 0.8 * la, F_RGB, 'center');
    }
    // the solar wind
    const wa = a * smooth((t - 4.6) / 1.5);
    const PER = 9;                                                   // each path is replayed every 9 s
    g.globalCompositeOperation = 'lighter';
    for (const p of paths) {
      const tt = ((t / PER + p.ph) % 1) * PER, k = Math.floor(tt * 30);
      if (k >= p.pts.length - 1) continue;
      const [x, y] = p.pts[k];
      const rgb = p.pos ? C.pos : C.neg;
      const tail = p.pts[Math.max(0, k - 8)];
      g.strokeStyle = `rgba(${rgb},${0.25 * wa})`; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(tail[0], tail[1]); g.lineTo(x, y); g.stroke();
      g.fillStyle = `rgba(${rgb},${0.85 * wa})`; g.beginPath(); g.arc(x, y, 1.5 * p.size, 0, 7); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    // particles guided down near the poles (from "Near the magnetic poles…")
    const pa = a * smooth((t - at(6)) / 1.2);
    if (pa > 0) {
      for (let i = 0; i < 14; i++) {
        const Lv = 6.5 + (i % 4) * 0.5, side = i % 2 ? 1 : -1, north = i % 3 !== 0;
        const u = ((t - at(6)) * 0.35 + i / 14) % 1;                 // 0 at the equator → 1 at the top of the atmosphere
        const th0 = Math.asin(Math.sqrt(1.05 / Lv)), th = lerp(Math.PI / 2, north ? th0 : Math.PI - th0, smooth(u));
        const r = Lv * RE * Math.sin(th) ** 2, x = ex + side * r * Math.sin(th), y = ey - r * Math.cos(th);
        D.glowDot(s, x, y, 7, i % 2 ? C.neg : C.pos, pa * (1 - smooth((u - 0.85) / 0.15)));
      }
      // glows where the L = 6.5–8 lines meet the Earth (about 67° latitude): a ring round each pole, seen edge-on
      const thF = Math.asin(Math.sqrt(1 / 7));
      for (const sg of [-1, 1]) for (const side of [-1, 1])
        D.glowDot(s, ex + side * RE * Math.sin(thF), ey + sg * RE * Math.cos(thF), RE * 1.1, GREEN, pa * (0.45 + 0.15 * Math.sin(t * 2 + side)));
      label(s, 'guided down near the poles (schematic)', ex, labY, fs, 0.85 * pa * fade(t, at(6) + 0.4, P2 + 0.5, 0.6, 0.6), GREEN, 'center');
    }
    // "F ⟂ v" reminder while the force caption is up
    const fA = a * fade(t, at(3), end(3), 0.6, 0.6);
    if (fA > 0) rich(s, [['F', 'i'], [' = ', 'sans'], ['qvB', 'i'], [' sin ', 'sans'], ['θ', 'i'], ['   (at right angles to ', 'sans'], ['v', 'i'], [')', 'sans']],
      W * 0.45, capTop - fs * 1.4, fs + 3, fA, C.force, 'center');
    if (t < P2 + 1) D.legend(s, [['dot', C.pos, 'proton (+)'], ['dot', C.neg, 'electron (−)'], ['line', F_RGB, 'magnetic field line']], a);
    void capTop;
  }

  // ---------- part 2: one electron near the pole (3D, metres) ----------
  const OMEGA = 2 * Math.PI / 2.6;                                   // one turn every 2.6 s on screen (really 7.2 × 10⁻⁷ s)
  const ALPHA = 70 * Math.PI / 180;                                  // pitch angle of the helix: v⊥ = v sin 70°
  const RH = re * Math.sin(ALPHA), PITCH = 2 * Math.PI * RH / Math.tan(ALPHA);   // 2.0 m and 4.6 m
  const VZ = PITCH / 2.6;                                            // m per second on screen
  const H0 = () => at(9) - 0.4;                                     // the helix starts here
  const yHelix = (t) => 6 - VZ * Math.max(0, t - H0());
  const followY = (t) => Math.min(0, yHelix(t));                    // the camera follows the electron down
  const pullK = (t) => smooth((t - at(12)) / 4);                    // pull back for "a few metres is tiny"
  const cam2 = (t) => {
    const k = pullK(t);
    return Anim.camera(0.55 + 0.25 * smooth((t - P2) / 30), 0.32 + 0.1 * k, 24 + 46 * k, [0, followY(t) - 6 * k, 0]);
  };
  function part2(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { W, H, phone, fs, capTop } = L;
    const cm = cam2(t), unit = Math.min(W, capTop) / 17, cx = W * (phone ? 0.5 : 0.42), cy = capTop * 0.5;
    const P = (p) => Anim.project(cm, p, cx, cy, unit);
    // field lines: straight down (the field barely changes over a few metres)
    const lines = [];
    for (const x of [-6, -2, 2, 6]) for (const z of [-6, -2, 2, 6]) lines.push([x, z]);
    const ty = followY(t), kp = pullK(t);
    for (const [x, z] of lines) {
      const A = P([x, ty + 9, z]), Bp = P([x, ty - 9 - 34 * kp, z]);
      D.glowLine(s, [[A[0], A[1]], [Bp[0], Bp[1]]], F_RGB, 0.32 * a, 1);
      for (let yy = Math.ceil((ty - 8) / 4) * 4; yy <= ty + 8; yy += 4) {
        const m1 = P([x, yy + 0.75, z]), m2 = P([x, yy - 0.75, z]);
        D.arrow(s, m1[0], m1[1], m2[0], m2[1], F_RGB, 0.6 * a, '', { head: 6, width: 1.3, blur: 3 });
      }
    }
    {
      const bx = phone ? W / 2 : W * 0.78, by = phone ? fs * 2 : capTop * 0.16, bw = (fs + 1) * 15;
      g.fillStyle = `rgba(4,6,13,${0.8 * a})`; g.beginPath(); g.roundRect(bx - bw / 2, by - fs, bw, fs * 2, 6); g.fill();
      rich(s, [['B', 'i'], [' ≈ 5 × 10', 'sans'], ['−5', 'sup'], [' T, down into the Earth', 'sans']], bx, by, fs + 1, a * 0.9, F_RGB, 'center');
    }
    const tl = t - at(8);
    // demo 1 (left): moving along the field: a straight line, no force
    const d1 = a * fade(t, at(8), at(9) + 1.6, 0.8, 1.2);
    if (d1 > 0) {
      const y = 6 - ((tl * 3) % 14), p = P([-4.5, y, 0]), q = P([-4.5, y - 2.2, 0]);
      D.glowDot(s, p[0], p[1], 9, C.neg, d1);
      D.arrow(s, p[0], p[1], q[0], q[1], C.vel, 0.9 * d1, '', { head: 8, width: 2 });
      const lp = P([-4.5, -6.5, 0]);
      label(s, 'along B: θ = 0, F = 0', lp[0], lp[1], fs, d1, C.text, 'center');
    }
    // demo 2 (right): moving across the field: a circle, F towards the centre
    const d2 = a * fade(t, at(8) + 3, at(9) + 1.6, 0.8, 1.2);
    if (d2 > 0) {
      const ph = -OMEGA * tl, cc = [4.5, 3, 0];
      const pts = []; for (let i = 0; i <= 60; i++) { const q = i / 60 * 2 * Math.PI; const pp = P([cc[0] + re * Math.cos(q), cc[1], cc[2] - re * Math.sin(q)]); pts.push([pp[0], pp[1]]); }
      D.glowLine(s, pts, C.neg, 0.35 * d2, 1.2);
      const pos = [cc[0] + re * Math.cos(ph), cc[1], cc[2] - re * Math.sin(ph)];
      const vel = [re * Math.sin(ph), 0, re * Math.cos(ph)];          // d/dφ with φ decreasing: clockwise from above
      const p = P(pos), pv = P(V.add(pos, V.mul(vel, 0.7))), pf = P(V.add(pos, V.mul(V.sub(cc, pos), 0.6)));
      D.glowDot(s, p[0], p[1], 9, C.neg, d2);
      D.arrow(s, p[0], p[1], pv[0], pv[1], C.vel, 0.9 * d2, '', { head: 8, width: 2 });
      D.arrow(s, p[0], p[1], pf[0], pf[1], C.force, 0.9 * d2, '', { head: 8, width: 2 });
      label(s, 'across B: a circle', P([cc[0], 0.4, 0])[0], P([cc[0], 0.4, 0])[1], fs, d2, C.text, 'center');
    }
    // the helix (from "Moving at an angle…"), electron: clockwise seen from above, drifting down the field
    const hA = a * smooth((t - at(9) - 0.4) / 1.2);
    if (hA > 0) {
      const t0 = H0(), th = t - t0;
      const posAt = (tt) => [RH * Math.cos(-OMEGA * tt), 6 - VZ * tt, -RH * Math.sin(-OMEGA * tt)];
      const trail = []; for (let k = 0; k <= 200; k++) { const tt = th - k * 0.03; if (tt < 0) break; const p = P(posAt(tt)); trail.push([p[0], p[1]]); }
      D.glowLine(s, trail, C.neg, 0.55 * hA, 1.3, (i) => 1 - i / trail.length);
      // the axis (a field line) and the electron
      const pos = posAt(th), p = P(pos);
      D.glowDot(s, p[0], p[1], 10, C.neg, hA);
      const ph = -OMEGA * th;
      const vt = [-RH * Math.sin(ph) * -OMEGA, 0, -RH * Math.cos(ph) * -OMEGA];    // d(pos)/dt, across the field
      const sc = 0.55;
      const pa = P(V.add(pos, V.mul(vt, sc))), pd = P(V.add(pos, [0, -VZ * sc, 0]));
      const comp = hA * fade(t, at(9) + 1.5, at(10) + 0.4, 0.8, 0.8);
      if (comp > 0) {
        D.arrow(s, p[0], p[1], pa[0], pa[1], C.vel, comp, '', { head: 8, width: 2 });
        D.arrow(s, p[0], p[1], pd[0], pd[1], '120,220,255', comp, '', { head: 8, width: 2 });
        label(s, 'across: goes round', pa[0] + fs * 0.6, pa[1] - fs * 0.6, fs - 1, comp, C.vel, 'left');
        label(s, phone ? 'along B: unchanged' : 'along B: unchanged (uniform field)', pd[0] + fs * 0.6, pd[1] + fs * 0.6, fs - 1, comp, '120,220,255', 'left');
      }
      // r bracket while the radius caption is up
      const rA = hA * fade(t, at(10), end(10), 0.6, 0.6);
      if (rA > 0) {
        const cyc = P([0, pos[1], 0]);
        D.line(s, cyc[0], cyc[1], p[0], p[1], C.light, 0.9 * rA, 1.5, [4, 3]);
        label(s, 'r ≈ 2 m', (cyc[0] + p[0]) / 2, (cyc[1] + p[1]) / 2 - fs, fs + 1, rA, C.light, 'center', 600);
      }
    }
    // to-scale comparison of the electron and proton circles, seen from above
    const cA = a * fade(t, at(11), end(11) + 0.3, 0.7, 0.7);
    if (cA > 0) {
      const R = Math.min(W, capTop) * (phone ? 0.2 : 0.17), ox = phone ? W * 0.5 : W * 0.8, oy = phone ? capTop * 0.62 : capTop * 0.55;
      g.fillStyle = `rgba(10,14,32,${0.85 * cA})`; g.beginPath(); g.roundRect(ox - R * 1.45, oy - R * 1.5, R * 2.9, R * 3.0, 10); g.fill();
      label(s, 'seen from above, to scale', ox, oy - R * 1.27, fs - 1, 0.85 * cA, C.muted, 'center');
      const pts = []; for (let i = 0; i <= 80; i++) { const q = i / 80 * 2 * Math.PI; pts.push([ox + R * Math.cos(q), oy + R * Math.sin(q)]); }
      D.glowLine(s, pts, C.pos, 0.6 * cA, 1.2);
      const qp = (t - at(11)) * 0.8;                                  // proton: anticlockwise seen from above
      const pxp = ox + R * Math.cos(qp), pyp = oy - R * Math.sin(qp);
      D.glowDot(s, pxp, pyp, 9, C.pos, cA);
      D.arrow(s, pxp, pyp, pxp - Math.sin(qp) * R * 0.45, pyp - Math.cos(qp) * R * 0.45, C.pos, cA, '', { head: 7, width: 1.6 });
      const rE = Math.max(1.2, R * re / rp);
      g.strokeStyle = `rgba(${C.neg},${cA})`; g.lineWidth = 1; g.beginPath(); g.arc(ox, oy, rE, 0, 7); g.stroke();
      D.glowDot(s, ox, oy, 6, C.neg, 0.8 * cA);
      label(s, 'proton: r = 91 m, anticlockwise', ox, oy + R * 1.18, fs - 1, cA, C.pos, 'center');
      label(s, 'electron: r = 2.1 m, clockwise (the dot)', ox, oy + R * 1.18 + fs * 1.25, fs - 1, cA, C.neg, 'center');
      D.line(s, ox - R, oy - R * 1.05, ox - R + R * 50 / rp, oy - R * 1.05, C.muted, 0.8 * cA, 1.2);
      label(s, '50 m', ox - R + R * 25 / rp, oy - R * 1.05 + fs * 0.75, fs - 2, 0.8 * cA, C.muted, 'center');
    }
    // pull back: "to the atmosphere"
    const bA = a * smooth((t - at(12) - 1) / 2);
    if (bA > 0) {
      const gp = P([0, followY(t) - 9 - 34 * pullK(t), 0]);
      const gr = g.createLinearGradient(0, gp[1] - unit * 3, 0, gp[1] + unit * 2);
      gr.addColorStop(0, 'rgba(60,200,140,0)'); gr.addColorStop(1, `rgba(60,200,140,${0.35 * bA})`);
      g.fillStyle = gr; g.fillRect(0, gp[1] - unit * 3, W, unit * 5);
      label(s, 'on down the field lines into the atmosphere', W / 2, Math.min(gp[1], capTop - fs * 1.5), fs, bA, GREEN, 'center');
    }
    if (t < P3 + 1) D.legend(s, [['dot', C.neg, 'electron (−)'], ['line', F_RGB, 'magnetic field'], ['arrow', C.vel, 'velocity'], ['arrow', C.force, 'force']], a);
    void H;
  }

  // ---------- part 3: collisions and photons in the upper air ----------
  const HMIN = 80, HMAX = 320;
  const EV = (() => {
    seed = 1618;
    const tr = [], ev = [];
    const t0 = 0;                                                    // relative to P3
    for (let i = 0; i < 64; i++) {
      const x = rnd(), ts = t0 + i * 0.95 + rnd() * 0.6, speed = 140 + rnd() * 60;   // km per second on screen
      // 2–4 collisions, mostly lower down where the air is denser
      const n = 2 + Math.floor(rnd() * 3), hs = [];
      for (let k = 0; k < n; k++) hs.push(95 + 215 * Math.pow(rnd(), 1.6));
      hs.sort((p, q) => q - p);
      const stop = hs[hs.length - 1];
      tr.push({ x, ts, speed, stop, pos: rnd() < 0.25 });
      for (const hh of hs) {
        const tc = ts + (HMAX + 10 - hh) / speed;
        let kind = hh > 200 ? 'red' : hh < 125 && rnd() < 0.55 ? 'violet' : 'green';
        if (kind === 'green' && rnd() < 0.15) kind = 'red';
        if (kind === 'red' && hh < 200) kind = 'green';
        const dir = rnd() * Math.PI * 2;
        ev.push({ x: x + (rnd() - 0.5) * 0.02, h: hh, tc, delay: kind === 'red' ? 0.9 + rnd() * 0.6 : 0.25 + rnd() * 0.3, kind, dir });
      }
    }
    return { tr, ev };
  })();
  const KIND = { green: { nm: 557.7, rgb: GREEN }, red: { nm: 630.0, rgb: RED }, violet: { nm: 427.8, rgb: VIOLET } };
  function part3(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { W, phone, fs, atm, panel } = L, tt = t - P3;
    const X = (u) => lerp(atm.x0 + fs * 1.5, atm.x1, u), Y = (hh) => lerp(atm.y1, atm.y0, (hh - HMIN) / (HMAX - HMIN));
    // the air: denser (brighter) lower down
    const gr = g.createLinearGradient(0, atm.y0, 0, atm.y1);
    gr.addColorStop(0, `rgba(20,28,60,${0.15 * a})`); gr.addColorStop(1, `rgba(40,60,120,${0.5 * a})`);
    g.fillStyle = gr; g.fillRect(atm.x0 + fs * 1.2, atm.y0, atm.x1 - atm.x0 - fs * 1.2, atm.y1 - atm.y0);
    // altitude axis
    D.line(s, atm.x0 + fs * 1.2, atm.y0, atm.x0 + fs * 1.2, atm.y1, C.muted, 0.6 * a, 1.2);
    for (const hh of [100, 150, 200, 250, 300]) {
      const y = Y(hh);
      D.line(s, atm.x0 + fs * 1.2, y, atm.x1, y, C.muted, 0.1 * a, 1, [3, 5]);
      label(s, `${hh}`, atm.x0 + fs * 0.9, y, fs - 1, 0.75 * a, C.muted, 'right');
    }
    label(s, phone ? 'km' : 'height / km', atm.x0 + fs * 1.2, atm.y0 - fs * 0.9, fs - 1, 0.8 * a, C.muted, phone ? 'right' : 'left');
    // incoming particles (their spirals are far too small to see here)
    g.globalCompositeOperation = 'lighter';
    for (const p of EV.tr) {
      const hNow = HMAX + 10 - (tt - p.ts) * p.speed; if (tt < p.ts || hNow < p.stop) continue;
      const x = X(p.x), y = Y(hNow), y0 = Y(Math.min(HMAX + 10, hNow + 40));
      g.strokeStyle = `rgba(${p.pos ? C.pos : C.neg},${0.35 * a})`; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y); g.stroke();
      g.fillStyle = `rgba(${p.pos ? C.pos : C.neg},${0.9 * a})`; g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    // the atoms and molecules hit, and their photons (kept inside the picture of the air)
    g.save(); g.beginPath(); g.rect(atm.x0 + fs * 1.2, atm.y0 - fs, atm.x1 - atm.x0 - fs * 1.2, atm.y1 - atm.y0 + fs * 1.5); g.clip();
    for (const ev of EV.ev) {
      const dt = tt - ev.tc; if (dt < -1.5 || dt > ev.delay + 3) continue;
      const x = X(ev.x), y = Y(ev.h), k = KIND[ev.kind], mol = ev.kind === 'violet';
      const vis = smooth((dt + 1.5) / 0.6) * (1 - smooth((dt - ev.delay - 2) / 1));
      // the atom (O) or molecule (N₂): grey until hit, glowing while excited
      const exc = dt >= 0 && dt < ev.delay ? 1 : 0;
      const col = exc ? k.rgb : '170,180,210';
      if (mol) { D.glowDot(s, x - 3, y, 6 + 4 * exc, col, 0.7 * vis * a); D.glowDot(s, x + 3, y, 6 + 4 * exc, col, 0.7 * vis * a); }
      else D.glowDot(s, x, y, 7 + 5 * exc, col, 0.75 * vis * a);
      if (dt >= 0 && dt < 0.25) D.glowDot(s, x, y, 22, '255,255,255', (1 - dt / 0.25) * 0.6 * a);
      // the photon: a short wave packet flying out in a random direction
      const pt = dt - ev.delay;
      if (pt > 0 && pt < 2.2) {
        const L0 = 26 + 70 * pt, ux = Math.cos(ev.dir), uy = Math.sin(ev.dir), lam = k.nm / 557.7 * 7;
        const pts = [];
        for (let i = 0; i <= 18; i++) {
          const sgo = L0 - 18 + i, env = Math.sin(Math.PI * i / 18), w = Math.sin(sgo / lam * 2 * Math.PI) * 3 * env;
          pts.push([x + ux * sgo - uy * w, y + uy * sgo + ux * w]);
        }
        D.glowLine(s, pts, k.rgb, a * (1 - smooth((pt - 1.4) / 0.8)), 1.3);
      }
    }
    g.restore();
    // a soft glow where each colour builds up (green middle, red top, violet bottom)
    const gA = a * smooth((tt - 4) / 6) * 0.5;
    if (gA > 0) {
      const band = (h0, h1, rgb, k2) => { const gg = g.createLinearGradient(0, Y(h1), 0, Y(h0));
        gg.addColorStop(0, `rgba(${rgb},0)`); gg.addColorStop(0.5, `rgba(${rgb},${k2 * gA})`); gg.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = gg; g.fillRect(atm.x0 + fs * 1.2, Y(h1), atm.x1 - atm.x0 - fs * 1.2, Y(h0) - Y(h1)); };
      g.globalCompositeOperation = 'lighter';
      band(200, 310, RED, 0.18); band(105, 200, GREEN, 0.22); band(92, 125, VIOLET, 0.14);
      g.globalCompositeOperation = 'source-over';
    }
    // layer labels (from "Red glows highest…")
    const lA = a * smooth((t - at(18)) / 1);
    if (lA > 0) {
      const tag = (txt, hh, rgb) => {
        g.font = D.sans(fs, 600); const w = g.measureText(txt).width, x = atm.x1 - fs * 0.4, y = Y(hh);
        g.fillStyle = `rgba(4,6,13,${0.8 * lA})`; g.beginPath(); g.roundRect(x - w - 6, y - fs * 0.75, w + 12, fs * 1.5, 5); g.fill();
        label(s, txt, x, y, fs, lA, rgb, 'right', 600);
      };
      tag('red (oxygen, O)', 262, RED); tag('green (oxygen, O)', 160, GREEN); tag('violet (N₂⁺)', 112, VIOLET);
    }
    // the energy-level panel (oxygen), from "Each collision gives…"
    const pA = a * smooth((t - at(14) + 0.3) / 1);
    if (pA > 0) {
      const { x0, x1, y0, y1 } = panel;
      g.fillStyle = `rgba(14,20,44,${0.75 * pA})`; g.beginPath(); g.roundRect(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12, 10); g.fill();
      label(s, 'an oxygen atom', x0 + 4, y0 + fs * 0.6, fs, 0.9 * pA, C.text, 'left', 600);
      label(s, 'energy above its ground state / eV', x0 + 4, y0 + fs * 1.85, fs - 1, 0.8 * pA, C.muted, 'left');
      const ey0 = y1 - fs * (phone ? 1.4 : 2.2), ey1 = y0 + fs * 3.6, EY = (E) => lerp(ey0, ey1, E / 4.5);
      const lx0 = x0 + (x1 - x0) * (phone ? 0.2 : 0.14), lx1 = x0 + (x1 - x0) * (phone ? 0.62 : 0.6);
      const names = ['ground state', 'excited', 'excited'];
      LEV.forEach((E, i) => {
        D.line(s, lx0, EY(E), lx1, EY(E), C.text, 0.85 * pA, 2);
        label(s, E.toFixed(2), lx0 - 6, EY(E), fs - 1, 0.85 * pA, C.text, 'right');
        if (!phone) label(s, names[i], lx1 + 6, EY(E), fs - 2, 0.7 * pA, C.muted, 'left');
      });
      // up: a collision; down: two photons
      const up = pA * fade(t, at(14) + 0.5, end(18), 0.6, 0.6);
      const ax = lx0 + (lx1 - lx0) * 0.18;
      if (up > 0) { D.arrow(s, ax, EY(0) - 2, ax, EY(LEV[2]) + 4, '255,255,255', 0.85 * up, '', { head: 8, width: 2 });
        label(s, 'hit', ax + 6, EY(LEV[2] * 0.72), fs - 1, 0.8 * up, '255,255,255', 'left'); }
      const dn = pA * smooth((t - at(15) - 0.3) / 0.8);
      if (dn > 0) {
        const gx = lx0 + (lx1 - lx0) * 0.5, rx = lx0 + (lx1 - lx0) * 0.78;
        D.arrow(s, gx, EY(LEV[2]) + 2, gx, EY(LEV[1]) - 4, GREEN, dn, '', { head: 8, width: 2.4 });
        D.arrow(s, rx, EY(LEV[1]) + 2, rx, EY(0) - 4, RED, dn, '', { head: 8, width: 2.4 });
        const tA = pA * smooth((t - at(16)) / 0.8);
        if (phone) label(s, '2.23 eV, 557.7 nm', gx + 5, (EY(LEV[2]) + EY(LEV[1])) / 2, fs - 1, tA, GREEN, 'left', 600);
        else label(s, '2.23 eV', gx + 5, (EY(LEV[2]) + EY(LEV[1])) / 2 - fs * 0.55, fs - 1, tA, GREEN, 'left', 600);
        if (!phone) label(s, '557.7 nm', gx + 5, (EY(LEV[2]) + EY(LEV[1])) / 2 + fs * 0.55, fs - 1, tA, GREEN, 'left');
        const tR = pA * smooth((t - at(17)) / 0.8);
        if (phone) label(s, '1.97 eV, 630.0 nm', rx + 5, (EY(LEV[1]) + EY(0)) / 2, fs - 1, tR, RED, 'left', 600);
        else label(s, '1.97 eV', rx + 5, (EY(LEV[1]) + EY(0)) / 2 - fs * 0.55, fs - 1, tR, RED, 'left', 600);
        if (!phone) label(s, '630.0 nm', rx + 5, (EY(LEV[1]) + EY(0)) / 2 + fs * 0.55, fs - 1, tR, RED, 'left');
        label(s, 'ionised nitrogen (N₂⁺): 2.91 eV → 427.8 nm', x0 + 4, y1 - fs * 0.3, fs - 2, 0.85 * tR, VIOLET, 'left');
      }
    }
    // key (no legend in this part: the axis is on the left)
    const kA = a * fade(t, P3 + 0.6, at(18), 0.8, 0.8);
    if (kA > 0) {
      const ky = atm.y1 + fs * (phone ? 1.0 : 0.9);
      if (ky < L.capTop - fs * 0.5 || phone) {
        D.glowDot(s, X(0.02), ky, 6, '170,180,210', kA); label(s, 'O atom', X(0.02) + 8, ky, fs - 1, kA, C.muted, 'left');
        D.glowDot(s, X(0.3) - 3, ky, 5, '170,180,210', kA); D.glowDot(s, X(0.3) + 3, ky, 5, '170,180,210', kA);
        label(s, 'N₂ molecule', X(0.3) + 10, ky, fs - 1, kA, C.muted, 'left');
        g.fillStyle = `rgba(${C.neg},${kA})`; g.beginPath(); g.arc(X(0.66), ky, 2.4, 0, 7); g.fill();
        label(s, 'incoming electron', X(0.66) + 7, ky, fs - 1, kA, C.muted, 'left');
      }
    }
    void W;
  }

  // ---------- part 4: the auroral oval, seen from space ----------
  function part4(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { W, fs, capTop } = L;
    const R = Math.min(W, capTop) * 0.36, x = W / 2, y = capTop * 0.5;
    drawEarth(s, x, y, R, a);
    // the oval: a ring centred a little towards the night side
    const ox = x + R * 0.08, rr = R * 0.36;
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 90; i++) {
      const q = i / 90 * 2 * Math.PI, br = 0.55 + 0.45 * Math.sin(q * 3 + t * 0.7) * Math.sin(q * 5 - t * 0.4);
      const night = 0.55 + 0.45 * Math.cos(q);                         // brighter on the night side (right)
      const px = ox + rr * (1 + 0.1 * Math.cos(q)) * Math.cos(q), py = y + rr * 0.95 * Math.sin(q);
      D.glowDot(s, px, py, R * 0.09, GREEN, a * 0.5 * br * night);
    }
    g.globalCompositeOperation = 'source-over';
    D.glowDot(s, x, y, 5, '255,255,255', a);
    label(s, 'magnetic north pole (centre)', x, y + rr + fs * 2.2, fs - 1, 0.85 * a, C.text, 'center');
    if (L.phone) label(s, 'auroral oval (schematic)', x, y - R - fs * 0.9, fs, 0.9 * a, GREEN, 'center', 600);
    else label(s, 'auroral oval (schematic)', ox + rr * 1.15, y - rr - fs * 0.6, fs, 0.9 * a, GREEN, 'left', 600);
    label(s, L.phone ? '← sunlight' : '← sunlight comes from this side', x - R - fs * 0.6, y, fs - 1, 0.75 * a, '255,214,150', 'right');
  }

  // ---------- part 5: the curtain, from the ground ----------
  const STARS = (() => { seed = 4242; return Array.from({ length: 160 }, () => [rnd(), rnd() * 0.75, 0.3 + rnd() * 0.7, rnd() * 6]); })();
  const HILLS = (() => { seed = 777; const p = []; let hh = 0.5; for (let i = 0; i <= 40; i++) { hh = clamp(hh + (rnd() - 0.5) * 0.35, 0.1, 1); p.push(hh); } return p; })();
  function part5(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { W, capTop } = L, hor = capTop * 0.86;
    for (const [sx, sy, b, ph] of STARS) g.fillStyle = `rgba(220,230,255,${a * b * (0.6 + 0.4 * Math.sin(t * 1.5 + ph))})`, g.fillRect(sx * W, sy * capTop, 1.5, 1.5);
    // the curtain: vertical rays, violet edge at the bottom, green body, red top
    const NR = 120, tt = t - P5;
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < NR; i++) {
      const u = i / (NR - 1);
      const x = lerp(-W * 0.05, W * 1.05, u) + W * 0.06 * Math.sin(2 * Math.PI * (u * 1.3 + 0.025 * tt));
      const br = clamp(0.35 + 0.65 * (0.5 + 0.5 * Math.sin(u * 19 + tt * 0.9)) * (0.5 + 0.5 * Math.sin(u * 6.3 - tt * 0.35)), 0, 1);
      const yb = hor - capTop * (0.2 + 0.07 * Math.sin(u * 5.1 + tt * 0.3)), top = capTop * (0.08 + 0.06 * Math.sin(u * 3.7 - tt * 0.2));
      const gr = g.createLinearGradient(0, yb, 0, top);
      gr.addColorStop(0, `rgba(${VIOLET},0)`); gr.addColorStop(0.03, `rgba(${VIOLET},${0.35 * br * a})`);
      gr.addColorStop(0.1, `rgba(${GREEN},${0.55 * br * a})`); gr.addColorStop(0.45, `rgba(${GREEN},${0.22 * br * a})`);
      gr.addColorStop(0.7, `rgba(${RED},${0.16 * br * a})`); gr.addColorStop(1, `rgba(${RED},0)`);
      g.strokeStyle = gr; g.lineWidth = W / NR * 1.8;
      g.beginPath(); g.moveTo(x, yb); g.lineTo(x + W * 0.01, top); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    // hills and trees in silhouette
    g.fillStyle = `rgba(3,5,10,${a})`; g.beginPath(); g.moveTo(0, capTop + 2);
    HILLS.forEach((hh, i) => g.lineTo(i / (HILLS.length - 1) * W, hor - hh * capTop * 0.07));
    g.lineTo(W, capTop + 2); g.closePath(); g.fill();
    g.fillRect(0, hor, W, s.H - hor);
  }

  // ---------- end card ----------
  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.88 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 52, 13, 20)), s3 = Math.round(clamp(W / 62, 11, 16));
    g.font = D.sans(s1, 300);
    const l1 = D.wrap(s, 'The Northern Lights: guided by a magnetic field, lit by energy levels', W - 48);
    let y = H * (phone ? 0.11 : 0.15);
    D.text(s, l1, W / 2, y, s1, a, D.sans(s1, 300)); y += s1 * 1.3 * l1.length + s2 * 0.6;
    const items = [
      [[['F', 'i'], [' = ', 'sans'], ['qvB', 'i'], [' sin ', 'sans'], ['θ', 'i'], ['   r', 'i'], [' = ', 'sans'], ['mv', 'i'], ['/', 'r'], ['qB', 'i']], C.force,
        'At right angles to v: no force along the field, circles across it, a helix in between.'],
      [[['guided to the poles', 'sans']], F_RGB, 'The Earth\'s field steers the charged particles down near the magnetic poles.'],
      [[['E', 'i'], [' = ', 'sans'], ['hf', 'i'], [' = ', 'sans'], ['hc', 'i'], ['/', 'r'], ['λ', 'i']], GREEN,
        'Collisions excite oxygen and nitrogen; each drop between energy levels gives one photon of one colour.'],
    ];
    if (phone) {
      for (const [eq, rgb, txt] of items) {
        rich(s, eq, W / 2, y, s2 + 1, a, rgb); y += s2 * 1.25;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 36); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.8;
      }
    } else {
      const colW = Math.min(W * 0.28, 320);
      g.font = D.sans(s3);
      const wr = items.map(([, , txt]) => D.wrap(s, txt, colW));
      items.forEach(([eq, rgb], i) => {
        const x = W / 2 + (i - 1) * W * 0.31;
        rich(s, eq, x, y, s2 + 1, a, rgb);
        D.text(s, wr[i], x, y + s2 * 1.4, s3, 0.85 * a, D.sans(s3));
      });
      y += s2 * 1.4 + s3 * 1.3 * Math.max(...wr.map((w) => w.length)) + s3;
    }
    g.font = D.sans(s3 - 1);
    D.text(s, D.wrap(s, 'Simplified and not to scale: in reality most of the electrons that light the aurora are first sped up in the Earth\'s magnetic tail, on the night side (beyond the course).', Math.min(W - 40, 760)),
      W / 2, Math.max(y + s3, H * (phone ? 0.78 : 0.8)), s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('aurora', {
    duration: DURATION,
    poster: P5 + 4,
    // score: polar night (F-sharp minor, a soft sine pad, a low drone, polar wind, a faint shimmer, a very slow swell)
    music: { chords: [[42, 49, 54, 57], [38, 45, 50, 57], [40, 47, 52, 56], [37, 44, 49, 56]], bar: 12, pad: 'sine', cutoff: 800, drone: 0.1, wind: 0.45, shimmer: 0.3, tremolo: 0.08, volume: 0.4 },
    resize: layout,
    info: {
      CAPS, P2, P3, P4, P5, END_CARD, DURATION, re, rp, ve, vp, EG, ER, EVI, LEV, DAYS, RH, PITCH,
      check() {
        const r = (x, d) => +x.toFixed(d);
        return { days: r(DAYS, 2), ve: ve.toExponential(3), re: r(re, 3), vp: vp.toExponential(3), rp: r(rp, 1),
          EG: r(EG, 3), ER: r(ER, 3), EV: r(EVI, 3), Etop: r(LEV[2], 3), ratio: r(1000 / EG, 0), RH: r(RH, 2), pitch: r(PITCH, 2),
          maxRate: Math.max(...CAPS.map(([a0, b0, tx]) => tx.length / (b0 - a0 - 0.6))).toFixed(1), DURATION: r(DURATION, 1) };
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.16);
      part1(s, t, partA(t, 0, P2));
      part2(s, t, partA(t, P2, P3));
      part3(s, t, partA(t, P3, P4));
      part4(s, t, partA(t, P4, P5));
      part5(s, t, partA(t, P5, null));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'How do the Northern Lights work?', 'Charged particles from the Sun, steered by the Earth\'s magnetic field');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
