/* E.5 The life of a star: birth in a nebula, then three stars followed to their ends.
   The teacher chose the three (17 November 2026): the Sun (white dwarf), 15 solar masses (neutron star) and
   25 solar masses (black hole), matching the three end points in the notes (themes/e5.html#evolution).

   Numbers (rounded; the stellar values are approximate results of computer models of stars, not calculated here):
     Sun's surface temperature 5800 K (the notes' value). R/R☉ = √(L/L☉) × (5800 ÷ T)², from L = 4πR²σT⁴.
     Hydrogen fusion starts at a core temperature of about 10⁷ K (the notes); helium fusion at about 10⁸ K.
     Sun: age about 4.6 billion years; about 10 billion years on the main sequence (the notes).
       Hydrogen fused per second: 4 ¹H (4 × 1.007825 u = 4.0313 u) → ⁴He (4.002603 u) loses 0.0287 u, 0.712% of the mass,
       so each kilogram fused releases 0.00712 × (3.00 × 10⁸)² = 6.41 × 10¹⁴ J; 3.83 × 10²⁶ W ÷ 6.41 × 10¹⁴ J kg⁻¹
       = 5.98 × 10¹¹ kg s⁻¹ ≈ 600 million tonnes per second.
       Red giant: about 3100 K and 2500 L☉, R = √2500 × (5800 ÷ 3100)² = 50 × 3.50 = 175 ≈ 180 R☉ (as in hr-diagram).
       Earth's orbit: 1.496 × 10¹¹ m ÷ 6.96 × 10⁸ m = 215 R☉, so 180 R☉ is 0.84 of the way: "almost as far as".
       Helium burning: about 4700 K and 50 L☉, R = 7.07 × 1.52 = 11 R☉. Second swelling: about 3000 K and 5000 L☉,
       R = 70.7 × 3.74 = 264 ≈ 260 R☉.
       White dwarf: about 0.55 M☉ ("about half the Sun's mass") and 0.013 R☉ = 9050 km, 1.4 × the Earth's radius
       (6370 km): "about the size of the Earth". Density = 0.55 × 1.99 × 10³⁰ ÷ (4/3 π (9.05 × 10⁶)³) = 3.5 × 10⁸ kg m⁻³;
       a 5 cm³ teaspoon: 3.5 × 10⁸ × 5 × 10⁻⁶ = 1.8 × 10³ kg, "nearly 2 tonnes".
     15 M☉: main sequence about 31 000 K and 2 × 10⁴ L☉, R = 141 × 0.0350 = 4.95 ≈ 5 R☉; about 12 million years
       (models give about 11–13 million). Red supergiant about 3700 K and 1 × 10⁵ L☉, R = 316 × 2.46 = 777 ≈ 800 R☉.
       Mars's orbit: 1.524 × 215 = 328 R☉, so 800 R☉ is "wider than the orbit of Mars" (Jupiter's is 1118 R☉).
       Neutron star: about 1.5 M☉ (typically 1.2–2; the collapsing iron core is above the Chandrasekhar limit, and some of its
       mass leaves as neutrino energy) and radius about 12 km ("about 25 km across").
       Density (taking 1.4 M☉, the low end) = 1.4 × 1.99 × 10³⁰ ÷ (4/3 π (1.2 × 10⁴)³) = 3.8 × 10¹⁷ kg m⁻³, about that of a nucleus (2.3 × 10¹⁷);
       a teaspoon: 3.8 × 10¹⁷ × 5 × 10⁻⁶ = 1.9 × 10¹² kg, "about 2 billion tonnes".
     25 M☉ (as in hr-diagram): about 37 000 K and 8 × 10⁴ L☉, R = 283 × 0.0246 = 6.95 ≈ 7 R☉; about 7 million years
       (the notes); red supergiant about 3600 K and 1.5 × 10⁵ L☉, R = 387 × 2.60 = 1005 ≈ 1000 R☉.
     Lifetimes: 10 × 10⁹ ÷ 12 × 10⁶ ≈ 830 and 10 × 10⁹ ÷ 7 × 10⁶ ≈ 1400 times shorter than the Sun's.
   Sizes are drawn to scale (a scale bar shows it) except the nebula, the onion-layer core (enlarged) and the black hole.
   The bending of starlight round the black hole uses the point-lens formula θ = (β ± √(β² + 4θE²)) / 2, with an
   Einstein radius chosen to show the effect (not to scale; beyond the syllabus, so no numbers are given).
   2028: the Chandrasekhar (about 1.4 M☉) and Oppenheimer–Volkoff (about 2–3 M☉) limits, on the end card only. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const lg = Math.log10;
  const RSUN_KM = 6.96e5, AU = 215, MARS = 328;
  const TSUN = 5800;
  const radius = (Lum, T) => Math.sqrt(Lum) * (TSUN / T) ** 2;

  // ---------- star colour from temperature (an approximation to a black body's colour, as in stars.js) ----------
  function tempRGB(T) {
    const t = T / 100;
    let r, g, b;
    if (t <= 66) { r = 255; g = 99.47 * Math.log(t) - 161.12; b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04; }
    else { r = 329.70 * Math.pow(t - 60, -0.1332); g = 288.12 * Math.pow(t - 60, -0.0755); b = 255; }
    const c = (v) => Math.round(clamp(v, 0, 255) * 0.85 + 255 * 0.15);
    return `${c(r)},${c(g)},${c(b)}`;
  }
  const mix = (rgb, f, to = 255) => rgb.split(',').map((v) => Math.round(lerp(+v, to, f))).join(',');

  // ---------- seeded random numbers (the same picture every time) ----------
  let seed = 17112026;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

  const SKY = []; for (let i = 0; i < 170; i++) SKY.push({ x: rnd(), y: rnd(), r: 0.5 + rnd() * 1.3, a: 0.25 + rnd() * 0.6, ph: rnd() * 6.28 });
  const NEB = []; for (let i = 0; i < 420; i++) {
    const dust = rnd() < 0.35;
    NEB.push({ r: Math.min(1.25, Math.abs(gauss()) * 0.45 + 0.08), a: rnd() * 6.283, flat: 0.55 + 0.35 * rnd(), size: dust ? 1.4 + rnd() * 1.6 : 0.8 + rnd() * 1.4,
      rgb: dust ? '190,120,80' : (rnd() < 0.5 ? '120,140,255' : '255,110,150'), al: dust ? 0.5 : 0.65 });
  }
  const PUFFS = []; for (let i = 0; i < 26; i++) PUFFS.push({ r: Math.abs(gauss()) * 0.4 + 0.1, a: rnd() * 6.283, size: 0.25 + rnd() * 0.35,
    rgb: ['90,110,230', '200,80,140', '150,90,200'][i % 3] });
  const CELLS = []; for (let i = 0; i < 46; i++) CELLS.push({ d: Math.sqrt(rnd()) * 0.85, a: rnd() * 6.283, size: 0.6 + rnd() * 0.8, dark: rnd() < 0.5, ph: rnd() * 6.28 });
  const SPARK = []; for (let i = 0; i < 26; i++) SPARK.push({ d: Math.sqrt(rnd()) * 0.9, a: rnd() * 6.283, ph: rnd() * 6.28, w: 2 + rnd() * 3 });
  const ELEM = ['255,214,102', '255,170,85', '200,200,215', '255,79,123', '63,211,255', '111,211,154', '205,150,120'];
  const DEBRIS = []; for (let i = 0; i < 300; i++) DEBRIS.push({ a: rnd() * 6.283, v: 0.45 + 0.6 * rnd() ** 0.6, rgb: ELEM[Math.floor(rnd() * ELEM.length)], size: 1 + rnd() * 2 });
  const WISPS = []; for (let i = 0; i < 48; i++) WISPS.push({ a: rnd() * 6.283, d: 0.85 + 0.3 * rnd(), size: 0.12 + 0.2 * rnd(), red: rnd() < 0.5 });
  const BACK = []; for (let i = 0; i < 160; i++) BACK.push({ x: rnd() * 2 - 1, y: rnd() * 2 - 1, a: 0.35 + 0.6 * rnd(), rgb: tempRGB(3500 + rnd() * 12000) });

  // spin-up of the collapsing cloud: θ = θ0 + ∫ k / (f² + 0.15) dt, tabulated so every frame depends only on the time
  const SPIN = []; { let acc = 0; for (let i = 0; i <= 800; i++) { const t = i * 0.05; SPIN.push(acc); acc += 0.05 * (0.06 + 0.35 / (cloud(t) ** 2 + 0.15)); } }
  function cloud(t) { const p = clamp((t - 11.2) / 12.0, 0, 1); return 1 - 0.97 * smooth(p) ** 1.15; }
  const spin = (t) => { const i = clamp(t / 0.05, 0, 799), k = Math.floor(i); return lerp(SPIN[k], SPIN[k + 1], i - k); };

  // ---------- keyframes: [time, value], eased between keys; log = interpolate the logarithm ----------
  function key(K, t, log = true) {
    if (t <= K[0][0]) return K[0][1];
    for (let i = 1; i < K.length; i++) if (t <= K[i][0]) {
      const [t0, v0] = K[i - 1], [t1, v1] = K[i], u = t1 > t0 ? smooth((t - t0) / (t1 - t0)) : 1;
      return log ? 10 ** lerp(lg(v0), lg(v1), u) : lerp(v0, v1, u);
    }
    return K[K.length - 1][1];
  }

  // ---------- the story (scene times in seconds; no pauses: every step is long enough to read) ----------
  const CAPS = [
    [4.8, 11.0, 'Every star begins in a nebula: a vast, cold cloud of gas (mostly hydrogen) and dust.'],
    [11.2, 17.6, 'Gravity pulls the cloud together. As it collapses, gravitational potential energy becomes thermal energy, so it heats up.'],
    [17.8, 23.6, 'The hot, shrinking ball is a protostar. It glows from the energy of its contraction, but it is not yet hot enough for hydrogen fusion.'],
    [23.8, 29.8, 'When the core reaches about 10⁷ K, hydrogen nuclei fuse into helium. A star is born.'],
    [30.0, 36.4, 'On the main sequence, gravity pulling inwards is balanced by gas and radiation pressure pushing outwards.'],
    [36.6, 42.6, 'What happens next depends on the star\'s mass. We follow three: the Sun, and stars of 15 and 25 solar masses.'],
    [42.8, 49.0, 'The Sun is about 4.6 billion years old: roughly halfway through its 10 billion years on the main sequence.'],
    [49.2, 55.4, 'Every second, about 600 million tonnes of hydrogen in its core fuse into helium.'],
    [55.6, 61.8, 'When the core\'s hydrogen runs out, the core contracts and heats up, and hydrogen fuses in a shell around it.'],
    [62.0, 68.6, 'The outer layers swell and cool. The Sun becomes a red giant about 180 times its present radius: almost as far as the Earth\'s orbit.'],
    [68.8, 75.0, 'Its core, now about 10⁸ K, fuses helium into carbon and oxygen, and for a while the star shrinks.'],
    [75.2, 81.6, 'When that helium runs out, the star swells again, even larger (about 260 times its present radius), and its outer layers drift away as a glowing planetary nebula.'],
    [81.8, 88.2, 'The carbon–oxygen core is left: a white dwarf, with about half the Sun\'s mass in a ball about the size of the Earth.'],
    [88.4, 94.6, 'No fusion happens in it. Electron degeneracy pressure holds it up while it slowly cools and fades over billions of years.'],
    [94.8, 100.6, 'It is so dense that a teaspoonful would have a mass of nearly 2 tonnes.'],
    [101.6, 107.8, 'Now a star of 15 solar masses: about 31 000 K, 5 times the Sun\'s radius and 20 000 times as luminous.'],
    [108.0, 114.2, 'Its core is hotter, so it fuses far faster. It leaves the main sequence after only about 12 million years.'],
    [114.4, 120.6, 'It swells into a red supergiant about 800 times the Sun\'s radius: wider than the orbit of Mars.'],
    [120.8, 127.4, 'Its core fuses heavier and heavier elements in layers, like an onion: helium, carbon, neon, oxygen and silicon, until silicon fusion leaves a core of iron.'],
    [127.6, 133.8, 'Fusing iron releases no energy. When the iron core grows too massive for electron degeneracy pressure to hold it up, it collapses in less than a second.'],
    [134.0, 140.4, 'The outer layers rebound in a supernova, which can briefly shine as brightly as a whole galaxy. Some elements heavier than iron are made, and everything is scattered into space.'],
    [140.6, 146.8, 'The core is left as a neutron star: about 1.5 times the Sun\'s mass in a ball about 25 km across.'],
    [147.0, 153.2, 'Neutron degeneracy pressure holds it up, at about the density of an atomic nucleus: a teaspoonful would have a mass of about 2 billion tonnes.'],
    [154.0, 160.2, 'Finally, 25 solar masses: about 37 000 K, 7 times the Sun\'s radius and 80 000 times as luminous.'],
    [160.4, 166.6, 'Its life is even shorter: about 7 million years on the main sequence, against 10 billion for the Sun.'],
    [166.8, 173.0, 'It becomes a red supergiant about 1000 times the Sun\'s radius. Its iron core collapses, and the star explodes.'],
    [173.2, 179.6, 'For a star this massive, the core left is likely to be too massive for neutron degeneracy pressure. Then nothing can stop the collapse: it becomes a black hole.'],
    [179.8, 186.2, 'Not even light can escape from it, but its gravity bends the light of the stars behind it.'],
    [187.0, 193.2, 'Three masses, three endings.'],
    [193.4, 199.8, 'The more massive the star, the shorter its life, and the denser the remnant it leaves.'],
    [200.0, 206.4, 'Apart from hydrogen, almost every atom in your body was made inside stars like these.'],
  ];
  const END_CARD = 206.8, DURATION = 221;
  const SN1 = 134.2, SN2 = 171.2;

  // chapter headings, the stage the star is in, and dips to black between the chapters
  const CHAPTERS = [[4.8, 42.6, 'The birth of a star'], [42.8, 100.6, '1 solar mass: the Sun'], [101.6, 153.2, '15 solar masses'],
    [154.0, 186.2, '25 solar masses'], [187.0, END_CARD, 'Three endings']];
  const PHASES = [[4.8, 17.6, 'nebula'], [17.8, 23.6, 'protostar'], [23.8, 36.4, 'main-sequence star'], [36.6, 42.6, 'three main-sequence stars, to scale'],
    [42.8, 55.4, 'main sequence: hydrogen → helium in the core'], [55.6, 61.8, 'hydrogen fusing in a shell'], [62.0, 68.6, 'red giant'],
    [68.8, 75.0, 'helium → carbon and oxygen in the core'], [75.2, 78.6, 'red giant again'], [78.6, 81.6, 'planetary nebula'], [81.8, 100.6, 'white dwarf (no fusion)'],
    [101.6, 114.2, 'main sequence: hydrogen → helium'], [114.4, 120.6, 'red supergiant'], [120.8, 127.4, 'red supergiant: fusion in layers'],
    [127.6, 134.0, 'core collapse'], [134.0, 140.4, 'supernova'], [140.6, 153.2, 'neutron star'],
    [154.0, 166.6, 'main sequence: hydrogen → helium'], [166.8, SN2, 'red supergiant'], [SN2, 173.0, 'supernova'], [173.2, 186.2, 'black hole']];
  const DIPS = [[100.6, 101.6], [153.2, 154.0], [186.2, 187.0]];

  // ---------- the stars' paths (approximate model values; see the top comment) ----------
  const VIEW_BIRTH = (t) => 4;                                    // R☉ from the centre to the edge of the "half" circle
  const SUN_R = [[42.8, 1], [55.6, 1], [61.8, 2], [62.0, 2], [67.4, 180], [68.8, 180], [72.6, 11], [75.2, 11], [78.2, 260]];
  const SUN_T = [[42.8, 5800], [55.6, 5800], [61.8, 5000], [62.0, 5000], [67.4, 3100], [68.8, 3100], [72.6, 4700], [75.2, 4700], [78.2, 3000]];
  const SUN_V = [[44.6, 3], [55.6, 3], [61.8, 4], [62.0, 4], [67.4, 320], [68.8, 320], [72.6, 40], [75.2, 40], [78.2, 480], [81.8, 480], [85.8, 0.035]];
  const PN0 = 78.4;                                               // the envelope starts to drift away
  const WD_R = 0.013, WD_T = [[PN0, 100000], [85.8, 90000], [100.6, 25000]], WD_X = -0.016, EARTH_R = 0.0092, EARTH_X = 0.024;
  const M15_R = [[101, 5], [114.4, 5], [119.2, 800]], M15_T = [[101, 31000], [114.4, 31000], [119.2, 3700]];
  const M15_V = [[101, 9], [114.4, 9], [119.2, 1400], [140.6, 1400], [144.4, 1.0e-4]];
  const NS_R = 12 / RSUN_KM;                                      // 12 km in solar radii
  const M25_R = [[154, 7], [166.8, 7], [169.6, 1000]], M25_T = [[154, 37000], [166.8, 37000], [169.6, 3600]];
  const M25_V = [[154, 12], [166.8, 12], [169.6, 1750], [173.2, 1750], [176.8, 0.02]];
  const AGES = { sun: [42.8, 55.0, 10, 'billion', 4.6], m15: [108.0, 113.8, 12, 'million'], m25: [160.4, 166.2, 7, 'million'] };

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25));
    const fs = phone ? 10 : Math.round(clamp(W / 80, 11, 15));
    const picB = H - capFs * (phone ? 7.9 : 5.6);
    const topBlock = phone ? fs * 6.6 : 0;
    const cy = (topBlock + picB) / 2, half = 0.42 * Math.min(W, picB - topBlock);
    const view3 = 21 * half / (W / 2);                              // the line-up of three stars fits across the stage
    L = { W, H, phone, fs, capFs, picB, cx: W / 2, cy, half, view3, pad: phone ? 10 : 16 };
  }

  // ---------- drawing helpers ----------
  function sky(s, a, clock) {
    if (a <= 0) return;
    const { g } = s; g.globalCompositeOperation = 'lighter';
    for (const st of SKY) {
      const al = a * st.a * (0.75 + 0.25 * Math.sin(clock * 1.1 + st.ph));
      g.fillStyle = `rgba(220,228,255,${al})`; g.beginPath(); g.arc(st.x * L.W, st.y * L.H, st.r, 0, 7); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
  }

  // a star: halo, limb-darkened disc, optional convection cells (cells: 0 none, 1 small like the Sun's, 2 a giant's few large ones)
  function star(s, x, y, r, T, a, u, cells = 0, halo = 2.2) {
    if (a <= 0) return;
    const { g } = s, rgb = tempRGB(T);
    D.glowDot(s, x, y, r * halo + 10, rgb, 0.5 * a);
    if (r < 2) { D.glowDot(s, x, y, 7, rgb, a); return; }
    g.globalCompositeOperation = 'source-over';
    const gr = g.createRadialGradient(x - r * 0.12, y - r * 0.12, 0, x, y, r);
    gr.addColorStop(0, `rgba(${mix(rgb, 0.55)},${a})`); gr.addColorStop(0.65, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${mix(rgb, 0.45, 40)},${a})`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    if (cells && r > 14) {
      g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
      const n = cells === 1 ? 46 : 12, sz = cells === 1 ? 0.11 : 0.34;
      for (let i = 0; i < n; i++) {
        const c = CELLS[i], ang = c.a + u * 0.015, px = x + Math.cos(ang) * c.d * r, py = y + Math.sin(ang) * c.d * r;
        const rr = r * sz * c.size * (0.85 + 0.15 * Math.sin(u * 0.4 + c.ph));
        const cg = g.createRadialGradient(px, py, 0, px, py, rr);
        const col = c.dark ? '0,0,0' : '255,240,210', al = (c.dark ? 0.22 : 0.16) * a * (cells === 1 ? 0.8 : 1);
        cg.addColorStop(0, `rgba(${col},${al})`); cg.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = cg; g.beginPath(); g.arc(px, py, rr, 0, 7); g.fill();
      }
      g.restore();
    }
  }

  // fusion in a core: small flickering sparks inside radius rc
  function sparks(s, x, y, rc, a, u, rgb = '255,255,240') {
    if (a <= 0 || rc < 3) return;
    for (const p of SPARK) {
      const f = Math.max(0, Math.sin(u * p.w + p.ph)); if (f < 0.3) continue;
      D.glowDot(s, x + Math.cos(p.a) * p.d * rc, y + Math.sin(p.a) * p.d * rc, Math.max(2.5, rc * 0.16), rgb, a * f);
    }
  }

  // an orbit (dashed), with its planet; the label sits outside the circle at angle labAng
  function orbit(s, x, y, rPx, name, a, u, phase, labAng = -0.8) {
    if (a <= 0 || rPx < 4) return;
    const { g } = s, { fs } = L;
    g.globalCompositeOperation = 'source-over'; g.setLineDash([6, 6]);
    g.lineWidth = 4; g.strokeStyle = `rgba(8,14,40,${0.55 * a})`; g.beginPath(); g.arc(x, y, rPx, 0, 7); g.stroke();   // dark edging: visible on a bright star
    g.lineWidth = 1.8; g.strokeStyle = `rgba(160,210,255,${0.95 * a})`; g.beginPath(); g.arc(x, y, rPx, 0, 7); g.stroke(); g.setLineDash([]);
    const ang = phase + u * 0.25, px = x + Math.cos(ang) * rPx, py = y + Math.sin(ang) * rPx;
    g.fillStyle = `rgba(8,14,40,${0.7 * a})`; g.beginPath(); g.arc(px, py, 6, 0, 7); g.fill();
    D.glowDot(s, px, py, 7, '120,190,255', a);
    const lx = x + Math.cos(labAng) * (rPx + fs * 0.6), ly = y + Math.sin(labAng) * (rPx + fs * 0.6);
    D.text(s, name, lx, ly, fs, a, D.sans(fs, 700), '190,225,255', Math.cos(labAng) >= 0 ? 'left' : 'right');
  }

  const niceKm = (km) => {
    if (km >= 1e9) return `${+(km / 1e9).toPrecision(2)} billion km`;
    if (km >= 1e6) return `${+(km / 1e6).toPrecision(2)} million km`;
    return `${String(Math.round(km)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} km`;
  };
  // a scale bar at the bottom left of the picture: ppr = pixels per solar radius
  function scaleBar(s, ppr, a) {
    if (a <= 0 || !(ppr > 0)) return;
    const { fs, pad, picB, W } = L, kmpp = RSUN_KM / ppr, target = W * 0.15 * kmpp;
    const p = 10 ** Math.floor(lg(target)), m = target / p, nice = (m >= 5 ? 5 : m >= 2 ? 2 : 1) * p, px = nice / kmpp;
    const y = picB - fs * 0.6, x = pad;
    D.line(s, x, y, x + px, y, C.text, 0.85 * a, 2); D.line(s, x, y - 4, x, y + 4, C.text, 0.85 * a, 2); D.line(s, x + px, y - 4, x + px, y + 4, C.text, 0.85 * a, 2);
    D.text(s, `${niceKm(nice)} (to scale)`, x, y - fs * 1.0, fs, 0.85 * a, D.sans(fs), C.text, 'left');
  }
  function note(s, txt, a) {                                     // used instead of the scale bar
    if (a > 0) D.text(s, txt, L.pad, L.picB - fs1() * 1.0, fs1(), 0.75 * a, D.sans(fs1()), C.muted, 'left');
  }
  const fs1 = () => L.fs;

  // headings at the top left: chapter, stage, live readout, and the main-sequence age bar
  function heading(s, t, u, readout, age) {
    const { fs, pad } = L;
    let y = pad + fs * 0.8;
    for (const [a0, a1, txt] of CHAPTERS) { const a = fade(t, a0, a1, 0.6, 0.6); if (a > 0) D.text(s, txt, pad, y, fs + 3, a, D.sans(fs + 3, 600), C.text, 'left'); }
    y += fs * 1.7;
    for (const [a0, a1, txt] of PHASES) { const a = fade(t, a0, a1, 0.5, 0.5); if (a > 0) D.text(s, txt, pad, y, fs, 0.95 * a, D.sans(fs, 600), C.light, 'left'); }
    y += fs * 1.45;
    if (readout) D.text(s, readout[0], pad, y, fs, 0.85 * readout[1], D.sans(fs), C.muted, 'left');
    y += fs * 2.7;
    if (age) {
      const [a0, a1, full, unit, today] = age, a = fade(t, a0 - 0.4, a1 + 2.2, 0.5, 0.6); if (a <= 0) return;
      const w = Math.min(L.W * (L.phone ? 0.55 : 0.3), 300), v = full * clamp((u - a0) / (a1 - a0), 0, 1);
      const { g } = s; g.globalCompositeOperation = 'source-over';
      g.fillStyle = `rgba(255,255,255,${0.12 * a})`; g.fillRect(pad, y, w, 6);
      g.fillStyle = `rgba(${C.light},${0.9 * a})`; g.fillRect(pad, y, w * v / full, 6);
      if (today) {                                                // the Sun today, pinned on the bar
        const x = pad + w * today / full, on = v >= today ? 1 : 0.45;
        D.line(s, x, y - 4, x, y + 10, C.text, a * on, 1.5);
        D.text(s, `today (${today} billion years)`, x, y + fs * 1.5, fs - 1, a * on, D.sans(fs - 1), C.text, x > pad + w * 0.5 ? 'right' : 'center');
      }
      const shown = full >= 10 ? v.toFixed(v < 9.95 ? 1 : 0) : v.toFixed(1);
      D.text(s, `time on the main sequence: ${shown} ${unit} years`, pad, y - fs * 0.9, fs - 1, 0.9 * a, D.sans(fs - 1), C.text, 'left');
    }
  }
  const fmtR = (R) => R >= 10 ? String(Math.round(R / (R >= 100 ? 10 : 1)) * (R >= 100 ? 10 : 1)) : R >= 1 ? R.toFixed(1) : String(+R.toPrecision(2));
  const fmtT = (T) => { const v = +T.toPrecision(2); return v >= 10000 ? String(v).replace(/(\d{3})$/, ' $1') : String(v); };

  // ---------- the supernova: a flash, then debris flying out (in solar radii, so a later zoom carries it off the screen) ----------
  function supernova(s, t, SN, x, y, ppr, a) {
    const dt = t - SN; if (dt < -0.3 || a <= 0) return;
    const fl = Math.exp(-Math.max(0, dt) / 1.5) * smooth((dt + 0.3) / 0.3);
    if (fl > 0.01) {
      D.glowDot(s, x, y, L.half * (0.9 + 0.9 * smooth(dt / 2)), '255,240,220', fl * a);
      D.glowDot(s, x, y, L.half * 0.35, '255,255,255', fl * a);
      s.g.fillStyle = `rgba(255,250,240,${0.45 * fl * a})`; s.g.fillRect(0, 0, L.W, L.H);
    }
    if (dt > 0.1) {
      const fadeA = a * smooth((dt - 0.1) / 0.6) * (1 - smooth((dt - 9) / 6));
      for (const p of DEBRIS) {
        const rw = 260 * p.v * dt, rp = rw * ppr; if (rp > L.W * 1.5) continue;
        D.glowDot(s, x + Math.cos(p.a) * rp, y + Math.sin(p.a) * rp, 2.5 + p.size * 2, p.rgb, 0.8 * fadeA);
      }
      const rr = 260 * 0.9 * dt * ppr;
      if (rr < L.W * 1.5) {
        const { g } = s; g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,190,150,${0.35 * fadeA})`; g.lineWidth = 3;
        g.beginPath(); g.arc(x, y, rr, 0, 7); g.stroke(); g.globalCompositeOperation = 'source-over';
      }
    }
  }

  // ---------- chapter 1: birth ----------
  function birth(s, t, u) {
    if (t > 44.8) return;
    const { cx, cy, half, fs } = L;
    const f = cloud(t), sp = spin(t);
    // the nebula: soft puffs and particles, collapsing and spinning up
    const neb = fade(t, 4.4, 26.5, 1.4, 1.6);
    if (neb > 0) {
      const big = half * 2.0;
      for (const p of PUFFS) {
        const r = p.r * f * big, ang = p.a + sp * 0.6;
        D.glowDot(s, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * 0.7, Math.max(8, p.size * big * (0.25 + 0.75 * f)), p.rgb, 0.22 * neb * smooth((f - 0.02) / 0.2));
      }
      const { g } = s; g.globalCompositeOperation = 'lighter';
      for (const p of NEB) {
        const r = p.r * f * big, ang = p.a + sp;
        const al = neb * p.al * smooth((f - 0.025) / 0.12) * (0.4 + 0.6 * smooth((r / big) * 3));
        if (al <= 0.01) continue;
        g.fillStyle = `rgba(${p.rgb},${al})`; g.beginPath(); g.arc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * p.flat, p.size, 0, 7); g.fill();
      }
      g.globalCompositeOperation = 'source-over';
      const nt = fade(t, 4.8, 17.4, 0.6, 0.6);
      if (nt > 0) note(s, 'not to scale: a nebula can be many light-years across', nt);
    }
    // the protostar: glows red, then orange, as it contracts and heats
    const pa = fade(t, 13.0, 24.6, 2.5, 0.6);
    if (pa > 0) {
      const T = 10 ** lerp(lg(1800), lg(4000), smooth((t - 14) / 9.6));
      const r = half * lerp(0.42, 0.3, smooth((t - 16) / 8)) * smooth((t - 13) / 5);
      star(s, cx, cy, r, T, pa, u, 0, 2.6);
      const lab = fade(t, 17.8, 23.6, 0.6, 0.6);
      if (lab > 0) D.text(s, 'protostar', cx + r + fs, cy - r * 0.6, fs + 1, lab, D.sans(fs + 1, 600), '255,190,140', 'left');
    }
    // ignition: a flash in the core, then a main-sequence star
    const IG = 24.2;
    if (t > IG - 0.2) {
      const fl = Math.exp(-Math.max(0, t - IG) / 0.9) * smooth((t - IG + 0.2) / 0.2);
      const ppr = half / VIEW_BIRTH(t);
      const ma = smooth((t - IG) / 0.8);
      const T = 10 ** lerp(lg(4000), lg(5800), smooth((t - IG) / 1.4));
      return { ppr, T, ma, fl };
    }
    return null;
  }

  // ---------- frame ----------
  function frame(s, t) {
    if (!L || L.W !== s.W || L.H !== s.H) layout(s);
    const u = t, { g } = s, { cx, cy, half, fs, phone } = L;
    D.background(s, 0.16);
    const skyA = (1 - 0.8 * fade(t, 4.4, 26, 1.5, 2)) * (1 - smooth((t - END_CARD) / 0.8)) * (1 - fade(t, 175.0, 186.4, 1.0, 0.4));
    sky(s, skyA * 0.9, s.clock);
    let readout = null, age = null, scaleA = 0, ppr = 0;

    // ----- birth and the line-up (to 44.6) -----
    const b = t < 44.6 ? birth(s, t, u) : null;
    if (b) {
      // the view zooms out for the line-up of three stars, then into the Sun
      const view = key([[36.6, 4], [38.6, L.view3], [42.8, L.view3], [44.6, 3]], t);
      const camX = key([[36.6, 0], [38.6, 16], [42.8, 16], [44.6, 0]], t, false);
      ppr = half / view;
      const X = (xw) => cx + (xw - camX) * ppr;
      const sunA = b.ma;
      star(s, X(0), cy, ppr * 1, b.T, sunA, u, 1);
      if (b.fl > 0.01) { D.glowDot(s, cx, cy, half * 0.5, '255,250,230', b.fl); }
      // the balance of forces
      const ea = fade(t, 30.0, 36.4, 0.8, 0.6);
      if (ea > 0) {
        const r = ppr, n = 8;
        for (let k = 0; k < n; k++) {
          const c = Math.cos(k * Math.PI * 2 / n + 0.2), sn = Math.sin(k * Math.PI * 2 / n + 0.2), w = 1 + 0.04 * Math.sin(u * 2.4);
          D.arrow(s, cx + c * r * 1.85, cy + sn * r * 1.85, cx + c * r * 1.15 * w, cy + sn * r * 1.15 * w, C.vel, ea, '', { head: 9, width: 2.2 });
          D.arrow(s, cx + c * r * 0.3, cy + sn * r * 0.3, cx + c * r * 0.88 * w, cy + sn * r * 0.88 * w, C.force, ea, '', { head: 9, width: 2.6 });
        }
        D.text(s, 'gravity (inwards)', cx + r * 1.5, cy - r * 1.75, fs + 1, ea, D.sans(fs + 1, 600), C.vel, 'left');
        D.text(s, phone ? 'gas + radiation' : 'gas and radiation pressure (outwards)', cx - r * 1.5, cy + r * 1.8, fs + 1, ea, D.sans(fs + 1, 600), C.force, 'right');
        if (phone) D.text(s, 'pressure (outwards)', cx - r * 1.5, cy + r * 1.8 + fs * 1.3, fs + 1, ea, D.sans(fs + 1, 600), C.force, 'right');
      }
      // the line-up, to scale
      const la = fade(t, 37.0, 44.0, 0.9, 0.9);
      if (la > 0) {
        star(s, X(11), cy, ppr * 5, 31000, la * smooth((t - 37.0) / 0.9), u, 0);
        star(s, X(26), cy, ppr * 7, 37000, la * smooth((t - 37.8) / 0.9), u, 0);
        const ly = cy + ppr * 7 + fs * 2.2;
        D.text(s, phone ? 'the Sun' : 'the Sun, 1 M☉', X(0), ly, fs, la, D.sans(fs, 600), C.light);
        D.text(s, '15 M☉', X(11), ly, fs, la, D.sans(fs, 600), '170,200,255');
        D.text(s, '25 M☉', X(26), ly, fs, la, D.sans(fs, 600), '170,200,255');
      }
      if (t > 24.6) { scaleA = fade(t, 24.8, 44.6, 0.8, 0.01); readout = t < 36.6 ? [`radius 1 R☉ · surface ${fmtT(b.T)} K`, fade(t, 25, 36.4, 0.6, 0.5)] : null; }
    }

    // ----- the Sun (42.8 to 100.6) -----
    if (t >= 44.6 && t < 101.0) {
      const view = key(SUN_V, t); ppr = half / view;
      const R = key(SUN_R, t), T = key(SUN_T, t);
      const envA = 1 - smooth((t - PN0) / 1.8);
      const giant = R > 20 ? 2 : 1;
      star(s, cx, cy, R * ppr, T, envA, u, giant);
      // the core, fusing hydrogen, then a contracting core in a hydrogen-fusing shell, then helium fusion
      const r = R * ppr;
      const msA = fade(t, 49.2, 55.6, 0.8, 0.6);
      if (msA > 0) {
        sparks(s, cx, cy, r * 0.25, msA, u);
        D.text(s, 'core: hydrogen → helium', cx + r * 0.75, cy + r * 1.25, fs, msA, D.sans(fs, 600), C.text, 'left');
      }
      const shA = fade(t, 55.6, 68.4, 0.8, 0.8);
      if (shA > 0) {
        const rc = r * lerp(0.25, 0.12, smooth((t - 55.6) / 4)) * (R > 2.2 ? 2 / R : 1) ** 0.6;   // the core shrinks (and is a smaller and smaller part of the star)
        D.glowDot(s, cx, cy, Math.max(4, rc * 1.6), '255,250,235', shA);
        const { g: gg } = s; gg.globalCompositeOperation = 'lighter'; gg.lineWidth = Math.max(2, rc * 0.25);
        gg.strokeStyle = `rgba(255,170,85,${0.8 * shA})`; gg.beginPath(); gg.arc(cx, cy, Math.max(5, rc * 1.9), 0, 7); gg.stroke(); gg.globalCompositeOperation = 'source-over';
        const la = fade(t, 56.2, 61.8, 0.6, 0.6);
        if (la > 0) D.text(s, 'hydrogen-fusing shell', cx + Math.max(5, rc * 1.9) + fs * 0.8, cy - fs * 1.2, fs, la, D.sans(fs, 600), C.force, 'left');
      }
      const heA = fade(t, 69.6, 76.0, 0.8, 0.8);
      if (heA > 0) {
        sparks(s, cx, cy, r * 0.2, heA, u, '200,230,255');
        D.text(s, 'core: helium → carbon, oxygen', cx + r * 0.7 + fs * 0.6, cy + r * 1.1 + fs * 0.6, fs, heA, D.sans(fs, 600), C.text, 'left');
      }
      // the Earth's orbit, while the red giant reaches towards it
      orbit(s, cx, cy, AU * ppr, 'Earth\'s orbit', fade(t, 64.2, 68.6, 1.0, 0.6), u, -0.6);
      // the planetary nebula
      if (t > PN0) {
        const dt = t - PN0, rn = (260 + 330 * dt) * ppr, na = smooth(dt / 1.2) * (1 - smooth((t - 96) / 4.6));
        if (na > 0 && rn < L.W * 3) {
          D.glowDot(s, cx, cy, rn * 1.05, '90,230,210', 0.22 * na);
          const { g: gg } = s; gg.globalCompositeOperation = 'lighter';
          for (const [f2, rgb, al, wdt] of [[0.75, '90,230,210', 0.14, 0.5], [1.0, '255,90,120', 0.22, 0.18]]) {
            gg.strokeStyle = `rgba(${rgb},${al * na})`; gg.lineWidth = Math.max(3, rn * wdt);
            gg.beginPath(); gg.arc(cx, cy, rn * f2, 0, 7); gg.stroke();
          }
          gg.globalCompositeOperation = 'source-over';
          for (const w of WISPS) D.glowDot(s, cx + Math.cos(w.a) * rn * w.d, cy + Math.sin(w.a) * rn * w.d, Math.max(4, rn * w.size), w.red ? '255,100,130' : '100,230,215', 0.3 * na);
          const la = fade(t, 78.8, 83.0, 0.6, 0.6);
          if (la > 0) D.text(s, 'planetary nebula', cx, cy - Math.min(rn, half * 1.1) - fs * 0.2, fs + 1, la, D.sans(fs + 1, 600), '150,240,225');
        }
        // the white dwarf left behind, cooling; the Earth beside it, to scale
        const wa = smooth(dt / 1.0) * (1 - smooth((t - 100.0) / 0.6));
        const Tw = key(WD_T, t), xw = cx + WD_X * ppr;
        star(s, xw, cy, Math.max(1.5, WD_R * ppr), Tw, wa * (0.55 + 0.45 * clamp((Tw - 25000) / 60000, 0, 1)), u, 0, 1.6);
        const ea = fade(t, 84.6, 100.4, 0.9, 0.5);
        if (ea > 0) {
          const xe = cx + EARTH_X * ppr, re = EARTH_R * ppr;
          const eg = g.createRadialGradient(xe - re * 0.3, cy - re * 0.3, 0, xe, cy, re);
          eg.addColorStop(0, `rgba(120,190,255,${ea})`); eg.addColorStop(0.7, `rgba(40,110,200,${ea})`); eg.addColorStop(1, `rgba(20,50,110,${ea})`);
          g.fillStyle = eg; g.beginPath(); g.arc(xe, cy, re, 0, 7); g.fill();
          D.text(s, 'the Earth', xe, cy + re + fs * 1.3, fs, ea, D.sans(fs, 600), '150,200,255');
          D.text(s, 'white dwarf', xw, cy + WD_R * ppr + fs * 1.3, fs, ea, D.sans(fs, 600), C.text);
        }
        if (t > 81.8) readout = [`radius ${WD_R} R☉ (about 9000 km) · surface ${fmtT(Tw)} K`, fade(t, 82.4, 100.6, 0.6, 0.5)];
      }
      if (t < PN0) readout = [`radius ${fmtR(R)} R☉ · surface ${fmtT(T)} K`, fade(t, 43.2, PN0, 0.6, 0.4)];
      age = AGES.sun;
      scaleA = fade(t, 44.0, 100.6, 0.01, 0.5);
    }

    // ----- 15 solar masses (101.6 to 153.2) -----
    if (t >= 101.0 && t < 154.0) {
      const view = key(M15_V, t); ppr = half / view;
      const camX = key([[101, 2.5], [107.8, 2.5], [110, 0]], t, false);
      const X = (xw) => cx + (xw - camX) * ppr;
      const R = key(M15_R, t), T = key(M15_T, t), r = R * ppr;
      const insetA = fade(t, 120.8, 134.0, 0.9, 0.3);
      const starA = t < SN1 ? 1 - 0.55 * insetA : 0;
      star(s, X(0), cy, r, T, starA, u, R > 50 ? 2 : 0);
      // the Sun beside it, to scale
      const sa = fade(t, 101.4, 108.6, 0.6, 0.8);
      if (sa > 0) { star(s, X(10), cy, ppr, 5800, sa, u, 0); D.text(s, 'the Sun', X(10), cy + ppr + fs * 1.6, fs, sa, D.sans(fs, 600), C.light); }
      const msA = fade(t, 108.0, 114.6, 0.8, 0.6);
      if (msA > 0) sparks(s, X(0), cy, r * 0.3, msA, u);
      // the orbits of the Earth and Mars, inside the supergiant
      const oa = fade(t, 116.6, 121.2, 1.0, 0.6);
      orbit(s, X(0), cy, AU * ppr, 'Earth', oa, u, 0.6, -0.5);
      orbit(s, X(0), cy, MARS * ppr, 'Mars', oa, u * 0.53, 2.4, 2.6);
      // the core in layers, like an onion (enlarged)
      if (insetA > 0) onion(s, t, u, X(0), cy, insetA);
      supernova(s, t, SN1, X(0), cy, ppr, 1 - smooth((t - 152.6) / 0.6));
      // the neutron star
      const na = fade(t, 141.6, 153.4, 1.2, 0.5);
      if (na > 0) neutronStar(s, X(0), cy, NS_R * ppr, na, u);
      if (t < SN1 - 0.2) readout = [`radius ${fmtR(R)} R☉ · surface ${fmtT(T)} K`, fade(t, 101.8, SN1, 0.6, 0.4)];
      else if (t > 141.6) readout = ['radius about 12 km · mass about 1.5 M☉', fade(t, 142.2, 153.2, 0.6, 0.5)];
      age = AGES.m15;
      scaleA = fade(t, 101.6, 153.2, 0.5, 0.5) * (1 - fade(t, 120.8, 134.0, 0.6, 0.6));
    }

    // ----- 25 solar masses (154.0 to 186.2) -----
    if (t >= 153.6 && t < 187.0) {
      const view = key(M25_V, t); ppr = half / view;
      const camX = key([[154, 2], [160.2, 2], [162.4, 0]], t, false);
      const X = (xw) => cx + (xw - camX) * ppr;
      const R = key(M25_R, t), T = key(M25_T, t), r = R * ppr;
      star(s, X(0), cy, r, T, t < SN2 ? 1 : 0, u, R > 50 ? 2 : 0);
      const sa = fade(t, 154.2, 161.0, 0.6, 0.8);
      if (sa > 0) { star(s, X(11), cy, ppr, 5800, sa, u, 0); D.text(s, 'the Sun', X(11), cy + ppr + fs * 1.6, fs, sa, D.sans(fs, 600), C.light); }
      const msA = fade(t, 160.4, 167.0, 0.8, 0.6);
      if (msA > 0) sparks(s, X(0), cy, r * 0.3, msA, u);
      // the iron core collapses (a quick glimpse of the core glowing), then the supernova
      const cg = fade(t, 169.8, SN2 + 0.1, 0.4, 0.2);
      if (cg > 0) D.glowDot(s, X(0), cy, r * 0.25 * (1 - 0.7 * smooth((t - 170.6) / 0.5)), '255,250,235', cg);
      supernova(s, t, SN2, X(0), cy, ppr, 1 - smooth((t - 185.6) / 0.6));
      blackHole(s, t, u);
      if (t < SN2 - 0.2) readout = [`radius ${fmtR(R)} R☉ · surface ${fmtT(T)} K`, fade(t, 154.2, SN2, 0.6, 0.4)];
      age = AGES.m25;
      scaleA = fade(t, 154.0, 173.6, 0.5, 0.5);
      note(s, 'not to scale', fade(t, 175.0, 186.2, 0.8, 0.5));
    }

    summary(s, t, u);
    scaleBar(s, ppr, scaleA * (1 - smooth((t - 186) / 0.5)));
    heading(s, t, u, readout, age);
    D.captions(s, t, CAPS);
    for (const [a0, a1] of DIPS) { const d = fade(t, a0, a1, (a1 - a0) / 2, (a1 - a0) / 2); if (d > 0) { g.fillStyle = `rgba(4,6,13,${d})`; g.fillRect(0, 0, L.W, L.H); } }
    if (t < 4.6) { g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; g.fillRect(0, 0, L.W, L.H); }
    D.title(s, t, 0.4, 4.4, 'The life of a star', 'Three stars, three endings: the Sun, and stars of 15 and 25 solar masses');
    endCard(s, t);
    D.vignette(s, t, DURATION);
  }

  // the core of the 15-solar-mass supergiant, enlarged: layers appear from the outside in, then the iron core collapses
  const LAYERS = [['hydrogen', ELEM[0], 1], ['helium', ELEM[1], 0.84], ['carbon', ELEM[2], 0.69], ['neon', ELEM[3], 0.55],
    ['oxygen', ELEM[4], 0.42], ['silicon', ELEM[5], 0.3], ['iron (no fusion)', ELEM[6], 0.17]];
  function onion(s, t, u, x, y, a) {
    const { g } = s, { half, fs, phone } = L, Ri = half * (phone ? 0.62 : 0.7);
    const fall = 1 - 0.25 * smooth((t - 130.8) / 0.9);             // the layers fall in after the core collapses
    const ironK = 1 - smooth((t - 130.2) / 0.6);                    // "in less than a second"
    LAYERS.forEach(([name, rgb, f], k) => {
      const la = a * smooth((t - (121.0 + 0.8 * k)) / 0.6); if (la <= 0) return;
      const rr = Ri * f * (k === 6 ? ironK : fall); if (rr < 0.5) return;
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = `rgba(${mix(rgb, 0.55, 10)},${0.92 * la})`; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill();
      g.strokeStyle = `rgba(${rgb},${0.9 * la})`; g.lineWidth = 1.6; g.stroke();
      // labels in a column to the right, joined to their layers
      const ly = y - Ri * 0.85 + k * (Ri * 1.7 / 6), lx = x + Ri + fs * (phone ? 0.8 : 2.4);
      const ax = x + rr * 0.92, ay = y - rr * 0.38;
      D.line(s, ax, ay, lx - fs * 0.4, ly, rgb, 0.6 * la, 1);
      D.text(s, name, lx, ly, fs, la, D.sans(fs, 600), rgb, 'left');
    });
    const ta = a * smooth((t - 121.0) / 0.6);
    D.text(s, 'the core, enlarged (not to scale)', x, y - Ri - fs * 1.0, fs, ta * 0.9, D.sans(fs), C.muted);
    // the rebound: energy from the collapsed core heading outwards
    const bo = fade(t, 130.8, SN1 + 0.2, 0.6, 0.2);
    if (bo > 0) D.glowDot(s, x, y, Ri * (0.2 + 0.9 * smooth((t - 130.8) / 3.4)), '255,250,235', bo * 0.9);
  }

  function neutronStar(s, x, y, r, a, u) {
    const { g } = s, { fs, half } = L, ang = u * 2.6;
    // beams from the magnetic poles sweep round as it spins (many neutron stars are seen as pulsars)
    g.globalCompositeOperation = 'lighter';
    for (const sgn of [1, -1]) {
      const dx = Math.cos(ang) * sgn, dy = Math.sin(ang) * sgn, len = half * 1.6, w = 0.12;
      const gr = g.createLinearGradient(x, y, x + dx * len, y + dy * len);
      gr.addColorStop(0, `rgba(170,200,255,${0.5 * a})`); gr.addColorStop(1, 'rgba(170,200,255,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x, y);
      g.lineTo(x + (dx * Math.cos(w) - dy * Math.sin(w)) * len, y + (dy * Math.cos(w) + dx * Math.sin(w)) * len);
      g.lineTo(x + (dx * Math.cos(-w) - dy * Math.sin(-w)) * len, y + (dy * Math.cos(-w) + dx * Math.sin(-w)) * len); g.closePath(); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    star(s, x, y, Math.max(2, r), 600000, a, u, 0, 1.8);
    D.text(s, 'neutron star', x, y + Math.max(r, 6) + fs * 1.6, fs + 1, a, D.sans(fs + 1, 600), '190,210,255');
  }

  function blackHole(s, t, u) {
    const a = fade(t, 175.2, 186.4, 1.2, 0.4); if (a <= 0) return;
    const { g } = s, { cx, cy, half, fs, W, picB } = L, rb = half * 0.2, thE = rb * 1.6;
    // what is left of the supernova, glowing faintly around it
    D.glowDot(s, cx, cy, half * 1.6, '200,90,110', 0.25 * a);
    // the stars behind it, drifting slowly, with their light bent by its gravity (point-lens images)
    const la = a * smooth((t - 176.0) / 1.2);
    const pts = BACK.map((p) => [((p.x * W - (t - 175) * 9) % (2 * W) + 3 * W) % (2 * W) - W, p.y * picB * 0.6, p.a, p.rgb, false]);
    pts.push([(182.6 - t) * 16, thE * 0.18, 1, '255,226,160', true]);                  // one star passes almost straight behind it
    g.globalCompositeOperation = 'lighter';
    for (const [bx, by, al, rgb, special] of pts) {
      const b = Math.hypot(bx, by); if (b < 0.5) continue;
      const ux = bx / b, uy = by / b, q = Math.sqrt(b * b + 4 * thE * thE);
      const uu = b / thE, base = (uu * uu + 2) / (2 * uu * Math.sqrt(uu * uu + 4));
      for (const [th, mu] of [[(b + q) / 2, base + 0.5], [(b - q) / 2, base - 0.5]]) {
        const rr = Math.abs(th); if (rr < rb * 1.08) continue;      // hidden behind the black hole
        const px = cx + ux * th, py = cy + uy * th, m = Math.min(6, Math.abs(mu));
        if (px < -10 || px > W + 10 || py < -10 || py > picB + 10) continue;
        const aa = la * Math.min(1, al * (0.6 + 0.4 * m));
        if (m > 1.6) {                                              // strongly lensed: stretched into a short arc
          const phi = Math.atan2(py - cy, px - cx), w = Math.min(0.9, 0.045 * m * (special ? 2.2 : 1));
          g.strokeStyle = `rgba(${rgb},${aa})`; g.lineWidth = special ? 3.2 : 2;
          g.beginPath(); g.arc(cx, cy, rr, phi - w, phi + w); g.stroke();
          g.strokeStyle = `rgba(${rgb},${0.25 * aa})`; g.lineWidth = special ? 9 : 5; g.stroke();
        } else { g.fillStyle = `rgba(${rgb},${aa})`; g.beginPath(); g.arc(px, py, special ? 3 : 1.9, 0, 7); g.fill(); }
      }
    }
    g.globalCompositeOperation = 'source-over';
    // the black hole itself: nothing comes out, so it is black, with a thin glow of bent light round its edge
    g.fillStyle = `rgba(0,0,0,${a})`; g.beginPath(); g.arc(cx, cy, rb, 0, 7); g.fill();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,200,150,${0.35 * a})`; g.lineWidth = 2;
    g.beginPath(); g.arc(cx, cy, rb * 1.06, 0, 7); g.stroke(); g.globalCompositeOperation = 'source-over';
    D.text(s, 'black hole', cx - thE * 1.25, cy + thE * 1.05, fs + 1, a, D.sans(fs + 1, 600), C.text, 'right');
    const lb = fade(t, 180.4, 186.2, 0.8, 0.5);
    if (lb > 0) D.text(s, 'starlight bent round it', cx + thE * 1.15, cy - thE * 1.05, fs, lb, D.sans(fs, 600), '255,226,160', 'left');
  }

  // ---------- the summary: a flow chart that builds row by row ----------
  function summary(s, t, u) {
    const a = fade(t, 187.0, END_CARD + 0.4, 0.8, 0.8); if (a <= 0) return;
    const { g } = s, { W, fs, phone, picB } = L;
    const top = phone ? fs * 1.6 : 58, cols = phone ? [W * 0.18, W * 0.5, W * 0.82] : [W * 0.2, W * 0.5, W * 0.8];
    const rowH = (picB - top - fs * 1.5) / 5.3, ic = Math.min(rowH * 0.19, W * 0.03);
    const rowY = (k) => top + fs * 0.6 + k * rowH + (k > 0 ? rowH * 0.35 : 0);
    const ra = (k) => a * smooth((t - (187.3 + k * 1.0)) / 0.6);
    const hi = fade(t, 193.4, 200.0, 0.6, 0.6), el = fade(t, 200.0, END_CARD + 0.4, 0.6, 0.6);
    // row 0: the nebula, branching to three columns
    const a0 = ra(0);
    if (a0 > 0) {
      const y = rowY(0);
      D.glowDot(s, W / 2, y, ic * 2.2, '150,110,220', 0.6 * a0); D.glowDot(s, W / 2 - ic, y + 2, ic * 1.4, '200,90,140', 0.4 * a0);
      D.text(s, 'nebula → protostar', W / 2 + ic * 2.2 + fs * 0.4, y, fs, a0, D.sans(fs, 600), C.text, 'left');
      const ya = y + ic * 1.6, yb = rowY(1) - fs * 2.2;
      cols.forEach((x) => D.line(s, W / 2, ya, x, yb, C.muted, 0.5 * ra(1), 1.2));
    }
    const HEAD = ['1 M☉ (the Sun)', '15 M☉', '25 M☉'];
    const ROWS = [
      [['main sequence', '10 billion years'], ['main sequence', '12 million years'], ['main sequence', '7 million years']],
      [['red giant', ''], ['red supergiant', ''], ['red supergiant', '']],
      [['planetary nebula', ''], ['supernova', ''], ['supernova', '']],
      [['white dwarf', 'about Earth-sized'], ['neutron star', 'about 25 km across'], ['black hole', 'light can\'t escape']],
    ];
    const ELTAG = [[null, null, null], ['C', 'O … Fe', 'O … Fe'], [null, 'some beyond Fe', 'some beyond Fe'], [null, null, null]];
    cols.forEach((x, c) => {
      const ah = ra(1); if (ah > 0) D.text(s, HEAD[c], x, rowY(1) - fs * 1.6, fs + 1, ah, D.sans(fs + 1, 700), c === 0 ? C.light : '170,200,255');
      ROWS.forEach((row, k) => {
        const ak = ra(k + 1); if (ak <= 0) return;
        const y = rowY(k + 1) + ic * 0.4, [name, sub] = row[c];
        icon(s, k, c, x, y, ic, ak, u);
        D.text(s, name, x, y + ic * 1.6 + fs * 0.5, fs, ak, D.sans(fs, 600), C.text);
        if (sub) {
          const strong = (k === 0 || k === 3) ? hi : 0;
          D.text(s, sub, x, y + ic * 1.6 + fs * 1.7, fs - 1, ak * (0.75 + 0.25 * strong), D.sans(fs - 1, strong > 0.5 ? 700 : 400), strong > 0.5 ? C.light : C.muted);
        }
        const tag = ELTAG[k][c];
        if (tag && el > 0) D.text(s, tag, x + ic * 2.0 + fs * 0.2, y, fs - 1, el * ak, D.sans(fs - 1, 700), C.good, 'left');
        if (k < 3) {                                                // an arrow down to the next row
          const y1 = y + ic * 1.6 + fs * (sub ? 2.4 : 1.3), y2 = rowY(k + 2) + ic * 0.4 - ic * 1.5;
          if (y2 - y1 > 8) D.arrow(s, x, y1, x, y2, C.muted, 0.6 * ra(k + 2), '', { head: 6, width: 1.4, blur: 0 });
        }
      });
    });
  }
  function icon(s, k, c, x, y, ic, a, u) {
    const { g } = s;
    if (k === 0) { const T = [5800, 31000, 37000][c], R = [0.55, 0.85, 1][c]; star(s, x, y, ic * R, T, a, u, 0, 1.6); }
    else if (k === 1) star(s, x, y, ic * [1.2, 1.45, 1.55][c], [3100, 3700, 3600][c], a, u, 0, 1.4);
    else if (k === 2) {
      if (c === 0) { g.globalCompositeOperation = 'lighter'; g.lineWidth = ic * 0.35; g.strokeStyle = `rgba(100,230,215,${0.5 * a})`; g.beginPath(); g.arc(x, y, ic * 1.1, 0, 7); g.stroke();
        g.lineWidth = ic * 0.18; g.strokeStyle = `rgba(255,100,130,${0.6 * a})`; g.beginPath(); g.arc(x, y, ic * 1.4, 0, 7); g.stroke(); g.globalCompositeOperation = 'source-over'; D.glowDot(s, x, y, ic * 0.4, '230,240,255', a); }
      else { D.glowDot(s, x, y, ic * 2.2, '255,230,200', 0.8 * a); for (let i = 0; i < 12; i++) { const an = i * 0.5236 + c; D.glowDot(s, x + Math.cos(an) * ic * 1.4, y + Math.sin(an) * ic * 1.4, ic * 0.4, ELEM[i % 7], 0.8 * a); } }
    } else {
      if (c === 0) star(s, x, y, ic * 0.35, 30000, a, u, 0, 2.2);
      else if (c === 1) { star(s, x, y, ic * 0.22, 600000, a, u, 0, 2.6); D.line(s, x - ic * 1.4, y + ic * 0.8, x + ic * 1.4, y - ic * 0.8, '170,200,255', 0.5 * a, 1.5); }
      else { g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,200,150,${0.5 * a})`; g.lineWidth = 2; g.beginPath(); g.arc(x, y, ic * 0.95, 0, 7); g.stroke();
        g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(0,0,0,${a})`; g.beginPath(); g.arc(x, y, ic * 0.85, 0, 7); g.fill(); }
    }
  }

  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 30, 18, 36)), s2 = Math.round(clamp(W / 52, 13, 19)), s3 = Math.round(clamp(W / 64, 11, 16));
    g.font = D.sans(s1, 300);
    const t1 = D.wrap(s, 'A star\'s mass decides its life and its end', W - 48);
    let y = H * (phone ? 0.1 : 0.13);
    D.text(s, t1, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * t1.length + s2 * 0.6;
    const items = [
      ['The Sun, 1 M☉', C.light, 'About 10 billion years on the main sequence → red giant → planetary nebula → white dwarf.'],
      ['15 M☉', '170,200,255', 'About 12 million years → red supergiant → supernova → neutron star.'],
      ['25 M☉', '255,170,120', 'About 7 million years → red supergiant → supernova → black hole.'],
      ['Why mass matters', '120,220,190', 'More mass: a hotter core, faster fusion, a shorter life and a denser remnant.'],
    ];
    if (phone) {
      for (const [h, rgb, txt] of items) {
        D.text(s, h, W / 2, y, s2, a, D.sans(s2, 600), rgb); y += s2 * 1.35;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 36); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.6;
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
    const n1 = D.wrap(s, '(Exams from 2028) A remnant core below about 1.4 M☉ (the Chandrasekhar limit) is a white dwarf; up to about 2–3 M☉ (the Oppenheimer–Volkoff limit), a neutron star; above that, a black hole.', Math.min(W - 40, 760));
    const yn = Math.max(y + s3, H * (phone ? 0.72 : 0.7));
    D.text(s, n1, W / 2, yn, s3, 0.75 * a, D.sans(s3), '200,170,255');
    g.font = D.sans(s3 - 1);
    const n2 = D.wrap(s, 'Ages, sizes and temperatures are approximate results of computer models of stars.', Math.min(W - 40, 760));
    D.text(s, n2, W / 2, yn + s3 * 1.35 * n1.length + s3 * 0.3, s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('star-life', {
    duration: DURATION,
    poster: 66,
    // score: slow and spacious (D minor, a soft triangle pad, long bars, space wind and a little shimmer)
    music: { chords: [[38, 45, 50, 53, 57], [34, 41, 46, 50, 53], [36, 43, 48, 52, 55], [33, 40, 45, 49, 52]], bar: 12, pad: 'triangle', cutoff: 700,
      drone: 0.11, wind: 0.5, shimmer: 0.15, tremolo: 0.08, volume: 0.58 },
    resize: layout,
    // for checking the numbers (not used by the player)
    info: { CAPS, radius, key, SUN_R, SUN_T, M15_R, M15_T, M25_R, M25_T,
      check() {
        const Rsun = 6.96e8, Msun = 1.99e30, rho = (M, r) => M * Msun / (4 / 3 * Math.PI * r ** 3);
        const dm = 4 * 1.007825 - 4.002603, perKg = dm / (4 * 1.007825) * (3.0e8) ** 2;
        return {
          hPerSecond_kg: +(3.83e26 / perKg).toPrecision(3), redGiant: +radius(2500, 3100).toFixed(0), heBurning: +radius(50, 4700).toFixed(1),
          agb: +radius(5000, 3000).toFixed(0), earthOrbit_Rsun: +(1.496e11 / Rsun).toFixed(0), wd_km: WD_R * Rsun / 1e3,
          wd_vs_earth: +(WD_R * Rsun / 6.37e6).toFixed(2), wdTeaspoon_kg: +(rho(0.55, WD_R * Rsun) * 5e-6).toPrecision(2),
          m15: +radius(2e4, 31000).toFixed(2), rsg15: +radius(1e5, 3700).toFixed(0), mars_Rsun: +(1.524 * 1.496e11 / Rsun).toFixed(0),
          nsRho: rho(1.4, 1.2e4).toExponential(2), nsTeaspoon_kg: (rho(1.4, 1.2e4) * 5e-6).toExponential(2),
          m25: +radius(8e4, 37000).toFixed(2), rsg25: +radius(1.5e5, 3600).toFixed(0), life15: Math.round(10e9 / 12e6), life25: Math.round(10e9 / 7e6),
        };
      } },
    frame,
  });
})();
