/* E.5 The Hertzsprung–Russell diagram and how stars evolve.
   Axes as in the notes: luminosity in solar units (log scale) against surface temperature (log scale,
   increasing to the left), 50 000 K to 2500 K and 10⁻⁴ to 10⁶ L☉.
   Real stars at approximate measured values (rounded; published values vary a little between sources):
     Sun 5800 K, 1 L☉ (the notes' value) · Sirius A 9900 K, 25 L☉ · Spica 25 000 K, 2.0 × 10⁴ L☉ ·
     Rigel 12 000 K, 1.2 × 10⁵ L☉ · Betelgeuse 3600 K, 1.0 × 10⁵ L☉ · Aldebaran 3900 K, 440 L☉ ·
     Proxima Centauri 3000 K, 0.0017 L☉ · Sirius B 25 000 K, 0.025 L☉.
   Radii from L = 4πR²σT⁴: in solar units σ and 4π cancel, so R/R☉ = √(L/L☉) × (T☉/T)² with T☉ = 5800 K.
     Betelgeuse: √(1.0 × 10⁵) × (5800 ÷ 3600)² = 316.2 × 2.596 = 821 ≈ 820 R☉.
     Sirius B: √0.025 × (5800 ÷ 25 000)² = 0.1581 × 0.05382 = 0.00851 ≈ 0.0085 R☉.
       (The Earth: 6.37 × 10⁶ ÷ 6.96 × 10⁸ = 0.0092 R☉, so "about the size of the Earth".)
     Aldebaran 21.0 × 2.212 = 46 R☉; Rigel 346 × 0.2336 = 81 R☉; Proxima 0.0412 × 3.738 = 0.15 R☉.
   Lines of constant radius: L/L☉ = (R/R☉)² (T/5800)⁴, straight lines of slope 4 on the log–log axes.
   Approximate evolutionary paths (positions from standard stellar models, rounded; not calculated here):
     Sun-like star: main sequence (5800 K, 1) → subgiant → red-giant tip about (3100 K, 2500 L☉),
       R = 50 × 3.50 = 175 ≈ 180 R☉ → helium burning about (4700 K, 50) → up again to about (3000 K, 5000),
       R = 70.7 × 3.74 = 264 R☉ → planetary nebula: the exposed core heads off the chart to the left (over
       100 000 K) → white dwarf of about 0.013 R☉ cooling along that radius line:
       L = 0.013² × (T/5800)⁴ = 0.93 L☉ at 50 000 K and 6.1 × 10⁻⁴ L☉ at 8000 K.
     25-solar-mass star: main sequence about (37 000 K, 8 × 10⁴) → red supergiant about (3600 K, 1.5 × 10⁵),
       R = 387 × 2.596 = 1005 ≈ 1000 R☉ → supernova → neutron star or black hole (off this chart).
   Main-sequence lifetimes from the notes: about 10 billion years for the Sun, about 7 million years for
   25 solar masses (10 × 10⁹ ÷ 7 × 10⁶ ≈ 1400 times shorter).
   2028: the Chandrasekhar (about 1.4 M☉) and Oppenheimer–Volkoff (about 2–3 M☉) limits, as on themes/e5.html. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  const TSUN = 5800, TMAX = 50000, TMIN = 2500, LGMIN = -4, LGMAX = 6;
  const radius = (Lum, T) => Math.sqrt(Lum) * (TSUN / T) ** 2;
  const lumOf = (R, T) => R * R * (T / TSUN) ** 4;
  const lg = Math.log10;

  // ---------- star colour from temperature (an approximation to the colour of a black body) ----------
  function tempRGB(T) {
    const t = T / 100;
    let r, g, b;
    if (t <= 66) { r = 255; g = 99.47 * Math.log(t) - 161.12; b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04; }
    else { r = 329.70 * Math.pow(t - 60, -0.1332); g = 288.12 * Math.pow(t - 60, -0.0755); b = 255; }
    const c = (v) => Math.round(clamp(v, 0, 255) * 0.85 + 255 * 0.15);   // a little lighter, to glow on the dark stage
    return `${c(r)},${c(g)},${c(b)}`;
  }

  // ---------- the main sequence (approximate), for the band and the background stars ----------
  const MS = [[2700, 3e-4], [3000, 2e-3], [3500, 0.02], [4000, 0.08], [5000, 0.4], [5800, 1], [7500, 5], [10000, 40],
    [15000, 400], [20000, 2.5e3], [30000, 4e4], [38000, 1.0e5]];
  const msL = (T) => {
    for (let i = 1; i < MS.length; i++) if (T <= MS[i][0]) {
      const [t0, l0] = MS[i - 1], [t1, l1] = MS[i], u = (lg(T) - lg(t0)) / (lg(t1) - lg(t0));
      return 10 ** lerp(lg(l0), lg(l1), u);
    }
    return MS[MS.length - 1][1];
  };

  // ---------- real stars (approximate values; see the top comment) ----------
  const STARS = [
    { name: 'Sun', T: 5800, L: 1, at: 17.4, lab: [1.0, 0.9, 'left'] },
    { name: 'Sirius A', T: 9900, L: 25, at: 23.0, lab: [-1.0, -0.2, 'right'] },
    { name: 'Spica', T: 25000, L: 2.0e4, at: 23.4, lab: [1.0, 0.6, 'left'] },
    { name: 'Rigel', T: 12000, L: 1.2e5, at: 23.8, lab: [1.0, 0.4, 'left'] },
    { name: 'Betelgeuse', T: 3600, L: 1.0e5, at: 24.2, lab: [-1.2, 0.0, 'right'] },
    { name: 'Aldebaran', T: 3900, L: 440, at: 24.6, lab: [-1.0, -0.2, 'right'] },
    { name: 'Proxima Centauri', short: 'Proxima', T: 3000, L: 0.0017, at: 25.0, lab: [-1.0, -0.2, 'right'] },
    { name: 'Sirius B', T: 25000, L: 0.025, at: 25.4, lab: [1.0, 0.0, 'left'] },
  ];
  STARS.forEach((s) => { s.R = radius(s.L, s.T); s.rgb = tempRGB(s.T); });

  // ---------- background stars (a seeded random sample, drawn faintly) ----------
  let seed = 51120261;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  const lrand = (a, b) => 10 ** lerp(lg(a), lg(b), rnd());
  const FIELD = [];
  for (let i = 0; i < 90; i++) { const T = lrand(2800, 36000); FIELD.push({ T, L: msL(T) * 10 ** (0.18 * gauss()) }); }
  for (let i = 0; i < 18; i++) FIELD.push({ T: lrand(3500, 5200), L: 10 ** lerp(1.4, 3.1, rnd()) });
  for (let i = 0; i < 10; i++) FIELD.push({ T: lrand(3300, 28000), L: 10 ** lerp(4.3, 5.5, rnd()) });
  for (let i = 0; i < 14; i++) { const T = lrand(6500, 30000), R = lerp(0.008, 0.015, rnd()); FIELD.push({ T, L: Math.max(1.2e-4, lumOf(R, T)) }); }
  FIELD.forEach((f, i) => { f.rgb = tempRGB(f.T); f.at = 26.0 + 2.6 * ((i * 0.618) % 1); f.tw = rnd() * 6.28; });

  // ---------- approximate evolutionary paths: [scene time, T, L] ----------
  const SUNP = [[83.8, 5800, 1], [85.4, 5600, 1.6], [87.0, 5000, 2.6], [89.2, 4500, 20], [92.4, 3900, 300], [95.6, 3100, 2500],
    [97.2, 4700, 50], [99.0, 4400, 120], [100.6, 3500, 1500], [101.8, 3000, 5000], [103.4, 8000, 5000], [105.0, 50000, 5000],
    [105.6, 100000, 4600]];
  const WD_R = 0.013, WD0 = 108.0, WD1 = 114.4;                   // white dwarf cooling along R = 0.013 R☉: 50 000 K → 8000 K
  const BIGP = [[114.8, 37000, 8e4], [119.0, 35000, 1.0e5], [126.6, 30000, 1.3e5], [128.6, 15000, 1.5e5], [130.4, 6000, 1.5e5],
    [131.8, 3600, 1.5e5]];
  const SN = 133.6;                                               // the supernova

  // position along a path (Catmull–Rom in log T, log L, timed by its keys)
  function pathAt(P, t) {
    if (t <= P[0][0]) return [P[0][1], P[0][2]];
    if (t >= P[P.length - 1][0]) return [P[P.length - 1][1], P[P.length - 1][2]];
    let i = 0; while (t > P[i + 1][0]) i++;
    const p = (k) => { const q = P[clamp(k, 0, P.length - 1)]; return [lg(q[1]), lg(q[2])]; };
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2), u = smooth((t - P[i][0]) / (P[i + 1][0] - P[i][0])) * 0.3 + 0.7 * ((t - P[i][0]) / (P[i + 1][0] - P[i][0]));
    const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
    // kept between the two keys in each coordinate, so the curve never overshoots a turning point
    const within = (v, a, b) => clamp(v, Math.min(a, b), Math.max(a, b));
    return [10 ** within(cr(p0[0], p1[0], p2[0], p3[0]), p1[0], p2[0]), 10 ** within(cr(p0[1], p1[1], p2[1], p3[1]), p1[1], p2[1])];
  }
  const wdAt = (t) => { const T = 10 ** lerp(lg(50000), lg(8000), smooth((t - WD0) / (WD1 - WD0))); return [T, lumOf(WD_R, T)]; };

  // ---------- captions ----------
  const CAPS = [
    [4.8, 11.0, 'An HR diagram: luminosity up the side (compared with the Sun), surface temperature along the bottom.'],
    [11.2, 16.8, 'Both scales are logarithmic, and temperature increases to the left: hot stars are on the left.'],
    [17.0, 22.4, 'The Sun: surface temperature 5800 K and luminosity 1 L☉ (by definition).'],
    [22.6, 29.0, 'Each bright dot is a real star, placed at its measured luminosity and temperature (approximate values).'],
    [29.2, 35.4, 'About 90% of stars lie on the main sequence. They fuse hydrogen into helium in their cores.'],
    [35.6, 41.6, 'In these stars, gravity pulling inwards is balanced by radiation and gas pressure pushing outwards.'],
    [41.8, 47.4, 'Cool but luminous: red giants. Extremely luminous, hot or cool: supergiants. Hot but very dim: white dwarfs.'],
    [47.6, 52.4, 'In the instability strip, stars pulsate, so their brightness varies.'],
    [52.6, 58.6, 'Why so different? From L = 4πR²σT⁴, stars of the same radius lie on a straight line.'],
    [58.8, 64.4, 'The further up and to the right, the bigger the star.'],
    [64.6, 71.4, 'Betelgeuse: L = 1.0 × 10⁵ L☉ and T = 3600 K, so R = √(1.0 × 10⁵) × (5800 ÷ 3600)² R☉ ≈ 820 R☉.'],
    [71.6, 78.4, 'Sirius B: L = 0.025 L☉ and T = 25 000 K, so R = √0.025 × (5800 ÷ 25 000)² R☉ ≈ 0.0085 R☉: about the size of the Earth.'],
    [78.6, 83.6, 'Predict: when the Sun runs out of hydrogen in its core, which way will it move on the diagram?'],
    [83.8, 90.4, 'The core contracts and heats up, hydrogen fuses in a shell around it, and the outer layers swell and cool.'],
    [90.6, 96.2, 'Up and to the right: the Sun becomes a red giant, over 100 times its present radius.'],
    [96.4, 101.6, 'Its core then fuses helium into carbon and oxygen: the star shrinks and heats up for a while. When that helium runs out, it swells again.'],
    [101.8, 107.8, 'The outer layers drift away as a planetary nebula. The exposed core is briefly far hotter than this chart shows.'],
    [108.0, 114.6, 'Off the chart, the hot core fades. What is left is a white dwarf. With no fusion it slowly cools over billions of years, along a line of constant radius.'],
    [114.8, 120.6, 'Now a star of 25 solar masses. It starts at the top left: hot, large and enormously luminous.'],
    [120.8, 127.2, 'It uses its fuel far faster: about 7 million years on the main sequence, against about 10 billion for the Sun.'],
    [127.4, 133.2, 'It swells into a red supergiant, about 1000 times the Sun\'s radius, fusing heavier elements up to iron.'],
    [133.4, 139.0, 'The iron core collapses, and the outer layers are blasted away in a supernova, which can briefly outshine a whole galaxy.'],
    [139.2, 145.0, 'The core left becomes a neutron star or a black hole. Neither can be shown on this chart.'],
    [145.2, 151.4, '(Exams from 2028) A core below about 1.4 solar masses becomes a white dwarf; up to about 2–3 solar masses, a neutron star; above that, a black hole.'],
  ];
  const END_CARD = 151.6, DURATION = 166;

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;                          // the 4:5 stage: buttons below the picture
    const capFs = Math.round(clamp(W / 44, 15, 25));
    const fs = phone ? 10 : Math.round(clamp(W / 80, 11, 15));
    const capH = capFs * (phone ? 7.9 : 5.6);
    const x0 = phone ? fs * 3.4 : Math.max(fs * 4.4, W * 0.07);
    const x1 = W - (phone ? fs * 1.0 : W * 0.03);
    const y0 = phone ? fs * 2.6 : Math.max(58, H * 0.12);         // wide screens: below the buttons
    const y1 = H - capH - fs * 3.1;
    L = { W, H, phone, fs, capFs, x0, x1, y0, y1 };
  }
  const X = (T) => L.x0 + (lg(TMAX) - lg(T)) / (lg(TMAX) - lg(TMIN)) * (L.x1 - L.x0);
  const Y = (Lum) => L.y1 - (lg(Lum) - LGMIN) / (LGMAX - LGMIN) * (L.y1 - L.y0);
  const inChart = (x, y) => x >= L.x0 - 1 && x <= L.x1 + 1 && y >= L.y0 - 1 && y <= L.y1 + 1;
  const clip = (s) => { const { g } = s; g.save(); g.beginPath(); g.rect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0); g.clip(); };

  const SUP = ['⁻⁴', '⁻²', '', '²', '⁴', '⁶'];
  const fmtR = (R) => R >= 10 ? String(Number(R.toPrecision(2))) : R >= 1 ? R.toFixed(1) : String(Number(R.toPrecision(2)));

  // ---------- drawing ----------
  function axes(s, a) {
    if (a <= 0) return;
    const { g } = s, { fs, x0, x1, y0, y1, phone } = L;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(14,20,44,${0.55 * a})`; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let k = 0; k < 6; k++) {                                      // luminosity: 10⁻⁴ … 10⁶
      const y = Y(10 ** (LGMIN + 2 * k));
      D.line(s, x0, y, x1, y, C.muted, 0.1 * a, 1, [3, 5]);
      D.text(s, k === 2 ? '1' : '10' + SUP[k], x0 - 5, y, fs, 0.8 * a, D.sans(fs), C.muted, 'right');
    }
    for (const T of [40000, 20000, 10000, 5000, 2500]) {
      const x = X(T);
      D.line(s, x, y1, x, y1 + 4, C.muted, 0.6 * a, 1);
      D.line(s, x, y0, x, y1, C.muted, 0.08 * a, 1, [3, 5]);
      D.text(s, T >= 10000 ? `${T / 1000} 000` : String(T), x, y1 + fs * 1.0, fs, 0.8 * a, D.sans(fs), C.muted);
    }
    D.line(s, x0, y1, x1, y1, C.muted, 0.7 * a, 1.2); D.line(s, x0, y0, x0, y1, C.muted, 0.7 * a, 1.2);
    D.text(s, 'luminosity / L☉', x0, y0 - fs * 1.1, fs, 0.9 * a, D.sans(fs, 600), C.muted, phone ? 'left' : 'left');
    D.text(s, '← hotter        surface temperature / K        cooler →', (x0 + x1) / 2, y1 + fs * 2.2, fs, 0.9 * a, D.sans(fs, 600), C.muted);
  }

  function bands(s, t, dim) {
    const { g } = s, { fs, phone } = L;
    // the main-sequence band
    const aMS = fade(t, 29.4, END_CARD + 0.4, 1.2, 0.8) * dim;
    if (aMS > 0) {
      const pts = []; for (let T = 2700; T <= 38000; T *= 1.04) pts.push([X(T), Y(msL(T))]);
      clip(s);
      g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = `rgba(140,170,255,${0.07 * aMS})`; g.lineWidth = Math.max(14, (L.y1 - L.y0) * 0.09);
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      g.globalCompositeOperation = 'source-over'; g.restore();
      D.text(s, 'main sequence', X(phone ? 17000 : 21000), Y(phone ? 30 : 60), fs + 1, 0.9 * aMS, D.sans(fs + 1, 600), '170,195,255', 'right');
    }
    // the instability strip (approximate)
    const aIS = fade(t, 47.6, END_CARD + 0.4, 1.0, 0.8) * dim;
    if (aIS > 0) {
      const strip = [[7800, 5], [6600, 3e4], [5300, 3e4], [6800, 5]];
      clip(s);
      g.fillStyle = `rgba(255,214,102,${0.12 * aIS})`;
      g.beginPath(); strip.forEach(([T, Lm], i) => (i ? g.lineTo(X(T), Y(Lm)) : g.moveTo(X(T), Y(Lm)))); g.closePath(); g.fill();
      g.restore();
      D.text(s, phone ? 'instability' : 'instability strip', X(7300) - fs * 0.6, Y(phone ? 2000 : 1500), fs, 0.9 * aIS, D.sans(fs), C.light, 'right');
      if (phone) D.text(s, 'strip', X(7300) - fs * 0.6, Y(2000) + fs * 1.15, fs, 0.9 * aIS, D.sans(fs), C.light, 'right');
    }
    // region labels
    const aR = fade(t, 41.8, END_CARD + 0.4, 1.0, 0.8) * dim;
    if (aR > 0) {
      D.text(s, 'red giants', X(4400), Y(phone ? 12 : 15), fs + 1, 0.95 * aR, D.sans(fs + 1, 600), '255,170,120');
      D.text(s, 'supergiants', X(phone ? 9000 : 9000), Y(phone ? 6e5 : 5e5), fs + 1, 0.95 * aR, D.sans(fs + 1, 600), '255,214,170');
      D.text(s, 'white dwarfs', X(phone ? 17000 : 15000), Y(phone ? 3.5e-4 : 2.5e-4), fs + 1, 0.95 * aR, D.sans(fs + 1, 600), '200,220,255');
    }
  }

  function radiusLines(s, t) {
    const a = fade(t, 52.8, END_CARD + 0.4, 1.4, 0.8); if (a <= 0) return;
    const { fs, phone } = L;
    clip(s);
    const lines = [0.01, 0.1, 1, 10, 100, 1000];
    lines.forEach((R, i) => {
      const grow = smooth((t - 52.8 - i * 0.35) / 1.2);
      const pts = []; for (let T = TMAX; T >= TMIN * 0.999; T /= 1.03) pts.push([X(T), Y(lumOf(R, T))]);
      const n = Math.max(2, Math.round(pts.length * grow));
      D.glowLine(s, pts.slice(0, n), '120,220,190', 0.5 * a, 1.0);
    });
    s.g.restore();
    // labels just inside the right-hand edge (or the bottom, for the smallest)
    lines.forEach((R, i) => {
      // dimmed while the Sun's path climbs past them, so its radius readout stays clear
      const al = a * smooth((t - 53.6 - i * 0.35) / 0.8) * (1 - 0.65 * fade(t, 83.8, 115, 0.6, 0.8)); if (al <= 0) return;
      const txt = `${R} R☉`;
      let x = L.x1 - fs * 0.3, y = Y(lumOf(R, TMIN)) - fs * 0.8, align = 'right';
      if (y > L.y1 - fs * 0.5) {                               // the line leaves through the bottom: label it there
        const T = TSUN * (1e-4 / (R * R)) ** 0.25; x = X(T) + fs * 0.4; y = L.y1 - fs * 0.8; align = 'left';
        if (x > L.x1 - fs * 4) return;
      }
      if (phone && R === 0.1) return;                          // too close to Proxima on a phone
      const { g } = s; g.font = D.sans(fs - 1); const w = g.measureText(txt).width;   // a dark backing keeps it readable over stars
      g.fillStyle = `rgba(8,11,26,${0.75 * al})`; g.fillRect(align === 'right' ? x - w - 2 : x - 2, y - fs * 0.6, w + 4, fs * 1.2);
      D.text(s, txt, x, y, fs - 1, 0.9 * al, D.sans(fs - 1), '120,220,190', align);
    });
  }

  function field(s, t, dim) {
    const { g, clock } = s;
    for (const f of FIELD) {
      const a = smooth((t - f.at) / 1.2) * (1 - smooth((t - END_CARD) / 0.8)) * dim; if (a <= 0) continue;
      const x = X(f.T), y = Y(f.L); if (!inChart(x, y)) continue;
      const r = (L.phone ? 5 : 7) * (1 + 0.12 * clamp(lg(radius(f.L, f.T)), -2, 3));
      D.glowDot(s, x, y, Math.max(2, r), f.rgb, 0.42 * a * (0.85 + 0.15 * Math.sin(clock * 1.3 + f.tw)));
    }
    g.globalCompositeOperation = 'source-over';
  }

  function realStars(s, t, dim) {
    const { fs, phone } = L;
    for (const st of STARS) {
      const a = smooth((t - st.at) / 0.8) * (1 - smooth((t - END_CARD) / 0.8)); if (a <= 0) continue;
      const x = X(st.T), y = Y(st.L);
      const base = phone ? 9 : 13, r = base * (1 + 0.14 * clamp(lg(st.R), -2.5, 3));
      const focus = st.name === 'Betelgeuse' ? fade(t, 64.6, 71.4, 0.5, 0.5) : st.name === 'Sirius B' ? fade(t, 71.6, 78.4, 0.5, 0.5) : 0;
      const da = st.name === 'Sun' ? Math.max(dim, 0.6) : dim;
      D.glowDot(s, x, y, Math.max(4, r * (1 + 0.5 * focus)), st.rgb, a * (0.6 + 0.4 * da));
      if (focus > 0) {
        s.g.globalCompositeOperation = 'source-over';
        s.g.strokeStyle = `rgba(120,220,190,${0.8 * focus})`; s.g.lineWidth = 1.5;
        s.g.beginPath(); s.g.arc(x, y, r * 1.6 + 6, 0, 7); s.g.stroke();
      }
      const [dx, dy, al] = st.lab;
      const isSun = st.name === 'Sun', later = t > 83.4;
      const name = isSun && later ? 'Sun today' : phone && st.short ? st.short : st.name;
      // once the stars start to move, only the Sun keeps its name (the other labels would crowd the paths)
      const labA = a * (0.55 + 0.45 * Math.max(da, focus)) * (isSun ? 1 : 1 - smooth((t - 82.6) / 0.8));
      D.text(s, name, x + dx * fs, y + dy * fs, fs, 0.95 * labA, D.sans(fs, isSun ? 700 : 400), '230,236,255', al);
      if (focus > 0) D.text(s, `R ≈ ${fmtR(st.R)} R☉`, x + dx * fs, y + dy * fs + fs * 1.2, fs, focus, D.sans(fs, 600), '120,220,190', al);
    }
  }

  // a moving star along an approximate path, with its trail and a radius readout
  function mover(s, t, P, t0, t1, name, trailA) {
    const { fs } = L;
    if (t < t0) return null;
    const pts = [];
    for (let tt = P[0][0]; tt <= Math.min(t, P[P.length - 1][0]) + 1e-6; tt += 0.06) { const [T, Lm] = pathAt(P, tt); pts.push([X(T), Y(Lm)]); }
    const [T, Lm] = pathAt(P, Math.min(t, P[P.length - 1][0])); pts.push([X(T), Y(Lm)]);
    clip(s);
    D.glowLine(s, pts, C.light, 0.75 * trailA, 1.6);
    s.g.restore();
    return { T, Lm, x: X(T), y: Y(Lm) };
  }

  function evolution(s, t) {
    const { fs, phone } = L, endA = 1 - smooth((t - END_CARD) / 0.8);
    if (endA <= 0) return;
    // a reminder that the paths are not calculated
    const ap = smooth((t - SUNP[0][0]) / 0.8) * endA;
    // above the chart: centred on wide screens (clear of the buttons in the corner), at the right on phones
    if (ap > 0) D.text(s, 'gold lines: approximate paths', phone ? L.x1 : (L.x0 + L.x1) / 2, L.y0 - fs * 1.1, fs, 0.85 * ap, D.sans(fs), C.light, phone ? 'right' : 'center');
    // ----- the Sun -----
    const sunOn = t >= SUNP[0][0];
    if (sunOn) {
      const later = 1 - 0.6 * smooth((t - (BIGP[0][0] - 0.5)) / 1.5);
      const m = mover(s, t, SUNP, 0, 0, 'Sun', later * endA);
      if (t < SUNP[SUNP.length - 1][0] + 0.01 && m && inChart(m.x, m.y)) {
        D.glowDot(s, m.x, m.y, (phone ? 12 : 17) * (1 + 0.15 * clamp(lg(radius(m.Lm, m.T)), -2, 3)), tempRGB(m.T), endA);
        // its radius, worked out from L and T (shown until the outer layers start to drift away)
        const ra = (1 - smooth((t - SUNP[9][0]) / 0.6)) * endA * later;
        const right = m.x > L.x0 + 0.6 * (L.x1 - L.x0);
        if (ra > 0) D.text(s, `Sun · R ≈ ${fmtR(radius(m.Lm, m.T))} R☉`, m.x + (right ? -1.2 : 1.2) * fs, m.y + fs * 1.4, fs, 0.95 * ra, D.sans(fs, 600), C.light, right ? 'right' : 'left');
      }
      // stage labels on the path
      const lab = (txt, T, Lm, a0, a1, align = 'left', dx = 1.0, dy = 0) => {
        const a = fade(t, a0, a1, 0.6, 0.8) * endA * later; if (a > 0) D.text(s, txt, X(T) + dx * fs, Y(Lm) + dy * fs, fs, a, D.sans(fs, 600), C.light, align);
      };
      lab('red giant', 3100, 2500, SUNP[5][0] - 0.5, WD1 + 1, 'right', -1.2, -0.9);
      lab('planetary nebula', 20000, 5000, SUNP[10][0] - 0.3, WD0 + 3, 'center', 0, -1.4);
      // off the chart to the left
      const oa = fade(t, SUNP[11][0] - 0.2, WD0 + 0.6, 0.4, 0.5) * endA;
      if (oa > 0) {
        D.arrow(s, L.x0 + fs * 3.2, Y(5000) + fs * 1.6, L.x0 + fs * 0.6, Y(5000) + fs * 1.6, C.light, oa, '', { head: 7, width: 1.6, blur: 6 });
        D.text(s, phone ? 'off the chart' : 'off the chart: over 100 000 K', L.x0 + fs * 0.6, Y(5000) + fs * 2.9, fs, oa, D.sans(fs), C.light, 'left');
      }
      // the white dwarf, cooling along R = 0.013 R☉
      if (t >= WD0) {
        const pts = []; for (let tt = WD0; tt <= Math.min(t, WD1) + 1e-6; tt += 0.06) { const [T, Lm] = wdAt(tt); pts.push([X(T), Y(Lm)]); }
        const [T, Lm] = wdAt(Math.min(t, WD1)); pts.push([X(T), Y(Lm)]);
        clip(s); D.glowLine(s, pts, C.light, 0.75 * later * endA, 1.6); s.g.restore();
        const x = X(T), y = Y(Lm);
        if (inChart(x, y)) {
          D.glowDot(s, x, y, phone ? 7 : 10, tempRGB(T), endA * Math.max(later, 0.5));
          const leftHalf = x < (L.x0 + L.x1) / 2;
          D.text(s, `white dwarf · R ≈ ${WD_R} R☉`, x + (leftHalf ? 0.9 : -0.9) * fs, y - fs * 1.1, fs, 0.95 * endA * (1 - smooth((t - WD1 - 1) / 0.8)), D.sans(fs, 600), C.light, leftHalf ? 'left' : 'right');
        }
      }
    }
    // ----- the 25-solar-mass star -----
    if (t >= BIGP[0][0]) {
      const before = t < SN - 0.4;
      const m = mover(s, t, BIGP, 0, 0, '', endA * (before ? 1 : 1 - 0.5 * smooth((t - SN) / 3)));
      if (before && m) {
        D.glowDot(s, m.x, m.y, (phone ? 13 : 19) * (1 + 0.15 * clamp(lg(radius(m.Lm, m.T)), -2, 3)), tempRGB(m.T), endA);
        const left = m.x > (L.x0 + L.x1) / 2;
        D.text(s, `25 M☉ star · R ≈ ${fmtR(radius(m.Lm, m.T))} R☉`, m.x + (left ? -1 : 1) * fs * 1.4, m.y + fs * 1.6, fs, 0.95 * endA, D.sans(fs, 600), C.light, left ? 'right' : 'left');
      }
      if (t > BIGP[BIGP.length - 1][0] - 0.3 && t < SN + 6) {
        const a = fade(t, BIGP[BIGP.length - 1][0] - 0.3, SN + 0.2, 0.5, 0.4) * endA;
        if (a > 0) D.text(s, 'red supergiant', X(3600) - fs * 1.6, Y(1.5e5) - fs * 1.4, fs, a, D.sans(fs, 600), C.light, 'right');
      }
      // the supernova: a flash at the supergiant's place (really far above the top of this chart)
      const fl = t >= SN - 0.5 ? Math.exp(-Math.max(0, t - SN) / 1.6) * smooth((t - SN + 0.5) / 0.5) : 0;
      if (fl > 0.01) {
        const x = X(3600), y = Y(1.5e5), R0 = (L.y1 - L.y0) * (0.12 + 0.35 * smooth((t - SN + 0.5) / 2.5));
        D.glowDot(s, x, y, R0, '255,240,220', fl * endA);
        D.glowDot(s, x, y, R0 * 0.4, '255,255,255', fl * endA);
      }
      const sa = fade(t, SN - 0.3, SN + 9, 0.4, 0.8) * endA;
      if (sa > 0) D.text(s, phone ? 'supernova' : 'supernova (far above the top of this chart)', X(3600) - fs * 1.6, Y(1.5e5) + fs * 1.6, fs, sa, D.sans(fs, 600), '255,230,200', 'right');
    }
  }

  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 30, 18, 36)), s2 = Math.round(clamp(W / 52, 13, 19)), s3 = Math.round(clamp(W / 64, 11, 16));
    g.font = D.sans(s1, 300);
    const t1 = D.wrap(s, 'The HR diagram sorts stars, and shows how they change', W - 48);
    let y = H * (phone ? 0.1 : 0.13);
    D.text(s, t1, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * t1.length + s2 * 0.6;
    const items = [
      ['Main sequence', '170,195,255', 'Hydrogen fusion; gravity is balanced by radiation and gas pressure.'],
      ['L = 4πR²σT⁴', '120,220,190', 'Up and to the right: bigger stars. Down and to the left: smaller.'],
      ['Like the Sun', C.light, 'Red giant → planetary nebula → white dwarf.'],
      ['Massive stars', '255,170,120', 'Red supergiant → supernova → neutron star or black hole.'],
    ];
    if (phone) {
      for (const [h, rgb, txt] of items) {
        D.text(s, h, W / 2, y, s2, a, D.sans(s2, 600), rgb); y += s2 * 1.35;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 36); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.7;
      }
    } else {
      const colW = Math.min(W * 0.38, 420);
      g.font = D.sans(s3);
      const wr = items.map(([, , txt]) => D.wrap(s, txt, colW));
      const y2 = y + s2 * 1.5 + s3 * 1.3 * Math.max(wr[0].length, wr[1].length) + s2 * 1.1;
      items.forEach(([h, rgb], i) => {
        const x = W / 2 + (i % 2 ? 1 : -1) * W * 0.23, yy = i < 2 ? y : y2;
        D.text(s, h, x, yy, s2, a, D.sans(s2, 600), rgb);
        D.text(s, wr[i], x, yy + s2 * 1.4, s3, 0.85 * a, D.sans(s3));
      });
      y = y2 + s2 * 1.4 + s3 * 1.3 * Math.max(wr[2].length, wr[3].length) + s2 * 0.4;
    }
    g.font = D.sans(s3);
    const n1 = D.wrap(s, '(Exams from 2028) Chandrasekhar limit ≈ 1.4 M☉; Oppenheimer–Volkoff limit ≈ 2–3 M☉.', Math.min(W - 40, 760));
    D.text(s, n1, W / 2, Math.max(y + s3, H * 0.74), s3, 0.75 * a, D.sans(s3), '200,170,255');
    D.text(s, 'Star positions and evolutionary paths are approximate.', W / 2, Math.max(y + s3, H * 0.74) + s3 * 1.4 * n1.length + s3 * 0.3, s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('stars', {
    duration: DURATION,
    poster: 104,
    pauses: [[10.0, 1.0], [15.8, 0.8], [46.2, 1.4], [57.6, 1.0], [70.2, 2.0], [77.2, 2.0], [82.8, 6.0], [89.4, 1.4], [97.6, 2.5],
      [101.0, 2.3], [106.6, 1.6], [113.4, 3.0], [126.0, 1.2], [132.0, 1.2], [137.6, 1.6], [150.0, 3.4]],
    // score: vast and slow (A-flat major, a dark saw pad, long bars, space wind)
    music: { chords: [[44, 51, 56, 60], [49, 56, 60, 65], [41, 48, 53, 56], [46, 53, 58, 63]], bar: 12, pad: 'saw', cutoff: 600,
      drone: 0.1, wind: 0.6, volume: 0.77 },
    resize: layout,
    // for checking the numbers (not used by the player)
    info: { STARS, CAPS, radius, lumOf, msL, pathAt, SUNP, BIGP, wdAt, WD_R,
      check() {
        const out = {};
        for (const st of STARS) out[st.name] = +st.R.toPrecision(3);
        out.rgbTip = +radius(2500, 3100).toFixed(0); out.agbTip = +radius(5000, 3000).toFixed(0);
        out.rsg = +radius(1.5e5, 3600).toFixed(0); out.wd50k = +lumOf(WD_R, 50000).toFixed(3); out.wd8k = lumOf(WD_R, 8000).toExponential(2);
        out.earth = +(6.37e6 / 6.96e8).toFixed(4); out.lifeRatio = Math.round(10e9 / 7e6);
        return out;
      } },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.2);
      const chartA = smooth((t - 4.4) / 1.0) * (1 - smooth((t - END_CARD) / 0.8));
      const dim = 1 - 0.55 * smooth((t - (SUNP[0][0] - 1)) / 1.5);
      axes(s, chartA);
      bands(s, t, dim);
      radiusLines(s, t);
      field(s, t, dim);
      realStars(s, t, dim);
      evolution(s, t);
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'The Hertzsprung–Russell diagram', 'How stars are sorted, and how they change');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
