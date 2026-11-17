/* How does a rainbow work? Sunlight refracted, reflected and refracted again by spherical raindrops (C.3 refraction,
   Snell's law, critical angle). No pauses: the motion runs at a constant speed and each caption stays up long enough to read.

   Physics (checked by info.check()):
   - Every ray is traced exactly through a sphere with Snell's law in vector form (refraction in, one or two partial
     internal reflections, refraction out). Nothing about the angles is drawn by eye.
   - Refractive index of water (dispersion, beyond the course): about 1.331 for red light (700 nm) and 1.343 for violet
     (405 nm); colours in between from Cauchy's formula n = A + B/λ² through those two values (A = 1.3250, B = 2959 nm²).
   - The example ray meets the drop at i = 59.5°: sin r = sin 59.5° ÷ 1.331 = 0.86163 ÷ 1.331 = 0.6474, r = 40.3°.
     Critical angle of water (red): sin c = 1 ÷ 1.331 = 0.7513, c = 48.7°. Inside, the ray meets the back of the drop at
     40.3° to the normal (the triangle inside is isosceles), less than 48.7°, so this is NOT total internal reflection:
     only about 6% reflects (Fresnel's equations, beyond the course: 11.1% of one polarisation and 0.4% of the other at the
     rainbow ray, average 5.7%).
   - The ray leaves turned back through 180° + 2i − 4r = 137.6°, i.e. at θ = 4r − 2i = 42.4° to the direction straight
     back towards the Sun. Over all the rays, θ has a maximum where cos²i = (n² − 1)/3:
     red n = 1.331: i = 59.53°, r = 40.36°, θ = 42.37° (42.4°); violet n = 1.343: i = 58.83°, r = 39.58°, θ = 40.65° (40.6°).
     The rays bunch up near this maximum (dθ/dh = 0 there), which is why the bow is bright.
   - Two reflections: θ = 180° + 2i − 6r, a minimum where cos²i = (n² − 1)/8: red 50.37° (50.4°), violet 53.48° (53.5°).
     No once-reflected light reaches the eye from more than 42.4° and no twice-reflected light from less than 50.4°,
     so the sky between the bows is darker (Alexander's band).
   - The sky picture: the Sun is 15° above the horizon behind the observer, so the antisolar point is 15° below the
     horizon and the top of the main bow is 42.4° − 15° = 27.4° up. Each bow is drawn as the exact cone of directions at
     its angle round the antisolar point, plotted with azimuth across and elevation up (equal scales).
   - The histograms count rays equally spaced across one slice of the drop, per quarter-degree of θ; the brightness of the
     light (6% reflected) is not included in the counts. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const DEG = Math.PI / 180;

  // ---------- optics ----------
  const N_RED = 1.331, N_VIO = 1.343, L_RED = 700, L_VIO = 405;
  const CB = (N_VIO - N_RED) / (1 / L_VIO ** 2 - 1 / L_RED ** 2), CA = N_RED - CB / L_RED ** 2;
  const nOf = (nm) => CA + CB / (nm * nm);
  // refraction of unit d at a surface with unit normal nr (pointing to the side d comes from); eta = n1/n2
  const refract = (d, nr, eta) => {
    const ci = -(d[0] * nr[0] + d[1] * nr[1]), k = 1 - eta * eta * (1 - ci * ci);
    if (k < 0) return null;
    const f = eta * ci - Math.sqrt(k);
    return [eta * d[0] + f * nr[0], eta * d[1] + f * nr[1]];
  };
  const reflect = (d, nr) => { const k = 2 * (d[0] * nr[0] + d[1] * nr[1]); return [d[0] - k * nr[0], d[1] - k * nr[1]]; };
  // one ray through a drop of radius 1 at the origin: sunlight travels in +x, at height h (−1..1)
  // returns the points (entry, internal hits, exit), the direction out, θ (angle to straight back, −x) and the
  // part that passes out through the back at the first internal hit.
  function trace(h, n, refl = 1) {
    const x0 = -Math.sqrt(1 - h * h), P = [[x0, h]];
    let d = refract([1, 0], [x0, h], 1 / n);
    let p = P[0];
    let through = null;
    for (let k = 0; k <= refl; k++) {
      const s = -2 * (p[0] * d[0] + p[1] * d[1]);
      p = [p[0] + s * d[0], p[1] + s * d[1]]; P.push(p);
      if (k === 0) through = refract(d, [-p[0], -p[1]], n);
      if (k < refl) d = reflect(d, p);
    }
    const out = refract(d, [-p[0], -p[1]], n);
    const theta = Math.acos(clamp(-out[0], -1, 1)) / DEG;
    return { P, out, theta, through, inc: Math.asin(Math.abs(h)) / DEG };
  }
  const rainbowI1 = (n) => Math.acos(Math.sqrt((n * n - 1) / 3));
  const rainbowI2 = (n) => Math.acos(Math.sqrt((n * n - 1) / 8));
  const theta1 = (n) => { const i = rainbowI1(n), r = Math.asin(Math.sin(i) / n); return (4 * r - 2 * i) / DEG; };
  const theta2 = (n) => { const i = rainbowI2(n), r = Math.asin(Math.sin(i) / n); return 180 + (2 * i - 6 * r) / DEG; };
  const TH1R = theta1(N_RED), TH1V = theta1(N_VIO), TH2R = theta2(N_RED), TH2V = theta2(N_VIO);
  const CRIT = Math.asin(1 / N_RED) / DEG;
  const I_EX = 59.5, R_EX = Math.asin(Math.sin(I_EX * DEG) / N_RED) / DEG;
  const EX = trace(Math.sin(I_EX * DEG), N_RED);
  const fresnel = (n, rDeg) => {
    const ci = Math.cos(rDeg * DEG), st = n * Math.sin(rDeg * DEG), ct = Math.sqrt(1 - st * st);
    const rs = ((n * ci - ct) / (n * ci + ct)) ** 2, rp = ((n * ct - ci) / (n * ct + ci)) ** 2;
    return { rs, rp, avg: (rs + rp) / 2 };
  };
  const FR = fresnel(N_RED, Math.asin(Math.sin(rainbowI1(N_RED)) / N_RED) / DEG);

  // histograms: equally spaced rays over the upper half of the drop, counted per quarter-degree of θ (0–60°)
  const NH = 3000, BIN = 0.25, NB = 240;
  const histOf = (n, refl) => {
    const order = [];                                       // the bin of each ray in turn (−1: beyond 60°, not shown)
    for (let k = 0; k < NH; k++) { const h = (k + 0.5) / NH, th = trace(h, n, refl).theta; order.push(th < NB * BIN ? Math.floor(th / BIN) : -1); }
    return order;
  };
  const SPEC = [700, 650, 600, 570, 540, 500, 470, 440, 405];          // wavelengths drawn as separate colours
  const H1 = { red: histOf(N_RED, 1) }, H1C = SPEC.map((nm) => histOf(nOf(nm), 1)), H2C = SPEC.map((nm) => histOf(nOf(nm), 2));
  const countBins = (order, upto) => { const b = new Float32Array(NB); for (let k = 0; k < upto; k++) if (order[k] >= 0) b[order[k]]++; return b; };
  const PEAK1 = Math.max(...countBins(H1.red, NH));

  // ---------- colours ----------
  const nmRGB = (nm) => {
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else { r = 1; }
    const k = nm < 420 ? 0.45 + 0.55 * (nm - 380) / 40 : 1;
    return [r, g, b].map((x) => Math.round(255 * Math.pow(clamp(x * k, 0, 1), 0.8))).join(',');
  };
  const RED = nmRGB(L_RED), VIO = nmRGB(L_VIO), VIO_T = '200,160,255', SUN = '255,244,214', WATER = '120,180,255';

  // ---------- captions (timed from their length: never faster than ~14.5 characters a second) ----------
  const nb = (s) => s.replace(/~/g, ' ');
  const f1 = (x) => x.toFixed(1);
  const SEQ = [
    ['A rainbow appears when the Sun is behind you, fairly low in the sky (lower than 42°), and rain is falling in front of you.'],
    ['Each raindrop is a tiny sphere of water. To see what a drop does to sunlight, zoom in on one.'],
    ['Sunlight refracts as it enters the drop, bending towards the normal (Snell\'s law; for water, n is about 1.33).', 0, 0.6],
    [`This ray meets the drop at i~=~${I_EX}°. Inside, sin~r = sin~${I_EX}°~÷~1.331 = ${Math.sin(R_EX * DEG).toFixed(3)}, so r~=~${f1(R_EX)}°.`, 1],
    ['At the back of the drop most of the light refracts out through the back, but a little (about 6%) is reflected.'],
    [`This is not total internal reflection: the ray meets the back at ${f1(R_EX)}°, less than the critical angle of water, ${f1(CRIT)}°.`],
    ['The reflected light refracts again as it leaves, heading back towards the side the sunlight came from.'],
    [`It comes out turned back through ${f1(180 - EX.theta)}°: ${f1(EX.theta)}° away from heading straight back towards the Sun.`],
    ['Predict: sunlight falls on the whole drop. Do all the rays come back out at 42°?', 6, 0.4],
    ['No: each ray comes out at a different angle, depending on where it hits the drop.'],
    [`For red light (n~=~1.331), none comes out at more than ${f1(TH1R)}°, and near that angle many rays come out almost together. So the light is brightest there.`],
    ['Rays that hit the lower half do the same, mirrored. So each drop sends a bright cone of light back at about 42°.'],
    ['The refractive index of water depends slightly on the colour of the light: this is dispersion (beyond the course).', 0, 0.6],
    [`Red light: n~=~1.331, brightest at ${f1(TH1R)}°. Violet light: n~=~1.343, bent a little more, brightest at ${f1(TH1V)}°.`],
    ['Now the view from the side. Sunlight arrives in parallel rays from behind you.', 0, 0.6],
    ['The point directly opposite the Sun, where the shadow of your head falls, is the antisolar point.'],
    [`Drops ${f1(TH1R)}° from that direction send red light to your eye; drops ${f1(TH1V)}° from it send violet. Their other colours miss your eye.`],
    ['So red is on the outside of the bow and violet on the inside. Each drop sends you one bright colour; millions of drops make the bow.'],
    ['All the drops at about 42° round the antisolar point form a circle. The ground hides the lower part: from an aeroplane you can see a full circle.', 0, 0.6],
    [`Some light is reflected twice inside a drop before it leaves. Those rays bunch at ${f1(TH2R)}° (red) to ${f1(TH2V)}° (violet).`, 0, 0.6],
    ['They make a fainter secondary bow outside the main one, with its colours reversed: red inside, violet outside.', 0, 0.6],
    ['Inside the main bow the sky is brighter: drops there send you once-reflected light at smaller angles.'],
    [`Between the bows the sky is darker (Alexander's band): no once-reflected light comes from more than ${f1(TH1R)}°, and no twice-reflected light from less than ${f1(TH2R)}°.`],
  ];
  const CAPS = [];
  let tc = 4.8;
  for (const [txt, extra = 0, gap = 0] of SEQ) {
    const t0 = tc + gap, d = Math.max(4.8, nb(txt).length / 14.5 + 0.6) + extra;
    CAPS.push([t0, t0 + d, nb(txt)]); tc = t0 + d + 0.2;
  }
  const at = (i) => CAPS[i][0], end = (i) => CAPS[i][1];
  const PB = at(2) - 0.5, PC = at(8) - 0.3, PD = at(12) - 0.5, PE = at(14) - 0.5, PE2 = at(18) - 0.5, PF = at(19) - 0.5, PF2 = at(20) - 0.5;
  const END_CARD = end(22) + 0.4, DURATION = END_CARD + 13;
  const XF = 1.0;
  const partA = (t, a, b) => (a <= 0 ? 1 : smooth((t - a + XF / 2) / XF)) * (b == null ? 1 : 1 - smooth((t - b + XF / 2) / XF));

  // ---------- helpers ----------
  let seed = 4242;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const label = (s, txt, x, y, fs, a, rgb = C.muted, align = 'center', w = 400) => D.text(s, txt, x, y, fs, a, D.sans(fs, w), rgb, align);
  // the first part of a polyline, up to length len (pixels)
  const partial = (pts, len) => {
    const out = [pts[0]]; let left = len;
    for (let i = 1; i < pts.length && left > 0; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dl = Math.hypot(bx - ax, by - ay);
      if (dl <= left) { out.push(pts[i]); left -= dl; } else { const u = left / dl; out.push([ax + (bx - ax) * u, ay + (by - ay) * u]); left = 0; }
    }
    return out;
  };
  const arcLine = (s, x, y, r, a0, a1, rgb, a, w = 1.4) => {
    const { g } = s; if (a <= 0) return;
    g.globalCompositeOperation = 'source-over'; g.strokeStyle = `rgba(${rgb},${a})`; g.lineWidth = w;
    g.beginPath(); g.arc(x, y, r, a0, a1, a1 < a0); g.stroke();
  };

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25));
    const capTop = H - capFs * (phone ? 7.0 : 5.4);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    // the drop and the histogram
    const R = phone ? Math.min(W * 0.27, capTop * 0.2) : Math.min(capTop * 0.3, W * 0.16);
    const dx = phone ? W * 0.58 : W * 0.47, dy = phone ? capTop * 0.3 : capTop * 0.47;
    const hist = phone ? { x0: 34, x1: W - 16, y0: capTop * 0.66, y1: capTop - fs * 2.6 }
      : { x0: W * 0.7, x1: W * 0.96, y0: Math.max(70, capTop * 0.2), y1: capTop * 0.66 };
    // the sky view
    const hor = capTop * 0.64;
    const k = Math.min(W * 0.94 / 112, (hor - Math.max(18, capTop * 0.05)) / 41, (capTop - hor - fs * 1.6) / 15);   // pixels per degree: room for the secondary bow above, the antisolar point below
    const cxSky = W / 2;
    // rain streaks (fixed list)
    seed = 99;
    const rain = Array.from({ length: phone ? 70 : 140 }, () => [rnd(), rnd(), 0.5 + rnd() * 0.5]);
    const hills = Array.from({ length: 24 }, (_, i) => 0.4 + 0.6 * Math.abs(Math.sin(i * 1.7 + 0.5)) * (0.5 + 0.5 * Math.sin(i * 0.43)));
    L = { W, H, phone, fs, capFs, capTop, R, dx, dy, hist, hor, k, cxSky, rain, hills };
    RINGS = {};                                             // the sky rings depend on the size
  }

  // ---------- the sky view ----------
  const SUN_EL = 15;
  // the direction at angle psi (degrees) from the antisolar point, at position phi round the circle → [azimuth, elevation]
  const AS = [Math.cos(-SUN_EL * DEG), 0, Math.sin(-SUN_EL * DEG)];   // antisolar direction: x forward, y left, z up
  const U1 = [0, 1, 0], U2 = [-Math.sin(-SUN_EL * DEG), 0, Math.cos(-SUN_EL * DEG)];
  const coneDir = (psi, phi) => {
    const c = Math.cos(psi * DEG), sn = Math.sin(psi * DEG), cp = Math.cos(phi), sp = Math.sin(phi);
    const v = [0, 1, 2].map((j) => c * AS[j] + sn * (cp * U1[j] + sp * U2[j]));
    return [Math.atan2(v[1], v[0]) / DEG, Math.asin(clamp(v[2], -1, 1)) / DEG];
  };
  const skyXY = (az, el) => [L.cxSky - az * L.k, L.hor - el * L.k];
  const ring = (psi) => { const pts = []; for (let i = 0; i <= 160; i++) { const [az, el] = coneDir(psi, i / 160 * 2 * Math.PI); if (el > -3) pts.push(skyXY(az, el)); else pts.push(null); } return pts; };
  const strokePts = (s, pts, rgb, a, w) => {
    const { g } = s; g.strokeStyle = `rgba(${rgb},${a})`; g.lineWidth = w; g.beginPath();
    let pen = false;
    for (const p of pts) { if (!p) { pen = false; continue; } if (pen) g.lineTo(p[0], p[1]); else { g.moveTo(p[0], p[1]); pen = true; } }
    g.stroke();
  };
  let RINGS = {};
  const SKYNM = Array.from({ length: 25 }, (_, i) => 405 + (700 - 405) * i / 24);   // the sky bows: many thin rings, one per colour
  const ringOf = (psi) => (RINGS[psi.toFixed(2)] ||= ring(psi));

  function drawSky(s, t, a, opt = {}) {
    if (a <= 0) return;
    const { g } = s, { W, hor, k, capTop, fs, phone } = L;
    // sky
    const gr = g.createLinearGradient(0, 0, 0, hor);
    gr.addColorStop(0, `rgba(40,52,92,${a})`); gr.addColorStop(1, `rgba(96,104,132,${a})`);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = gr; g.fillRect(0, 0, W, hor);
    const bowA = a * (opt.bow ?? 1), secA = a * (opt.second ?? 0), band = a * (opt.band ?? 0);
    g.globalCompositeOperation = 'lighter';
    // brighter sky inside the main bow (once-reflected light at smaller angles), a little outside the secondary
    if (band > 0) {
      // thin, heavily overlapping rings every ¼°, so the brightness changes smoothly
      for (let psi = 0.5; psi <= 72; psi += 0.25) {
        const br = psi < TH1V ? 0.05 + 0.10 * psi / TH1V : psi > TH2V ? 0.05 * Math.exp(-(psi - TH2V) / 12) : 0;
        if (br > 0) strokePts(s, ringOf(psi), '220,226,255', 0.2 * br * band, k * 1.0);
      }
    }
    // the bows: one ring per colour at its own angle
    // each ring is as wide as the gap to the next colour, so the colours stay separate even on a phone
    const w1 = Math.max(1, k * (TH1R - TH1V) / 24 * 1.6), w2 = Math.max(1, k * (TH2V - TH2R) / 24 * 1.6);
    if (bowA > 0) for (const nm of SKYNM) strokePts(s, ringOf(theta1(nOf(nm))), nmRGB(nm), 0.3 * bowA, w1);
    if (secA > 0) for (const nm of SKYNM) strokePts(s, ringOf(theta2(nOf(nm))), nmRGB(nm), 0.14 * secA, w2);
    // rain, falling at a steady speed
    g.globalCompositeOperation = 'source-over';
    for (const [rx, ry, b] of L.rain) {
      const y = ((ry + t * 0.35 * b) % 1) * hor, x = rx * W;
      g.strokeStyle = `rgba(190,205,240,${0.18 * a * b})`; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 9); g.stroke();
    }
    // ground and hills (hide the lower part of the circle)
    g.fillStyle = `rgba(22,30,24,${a})`; g.beginPath(); g.moveTo(0, hor + 1);
    L.hills.forEach((hh, i) => g.lineTo(i / (L.hills.length - 1) * W, hor - hh * k * 2.2));
    g.lineTo(W, capTop + 60); g.lineTo(0, capTop + 60); g.closePath(); g.fill();
    g.fillRect(0, hor, W, s.H - hor);
    // the antisolar point, below the horizon (where the shadow of your head points)
    const [ax, ay] = skyXY(0, -SUN_EL), am = a * (opt.anti ?? 0);
    if (am > 0 && ay < capTop - fs) {
      D.line(s, ax - 7, ay, ax + 7, ay, C.light, 0.9 * am, 2); D.line(s, ax, ay - 7, ax, ay + 7, C.light, 0.9 * am, 2);
      label(s, 'antisolar point', ax + 12, ay, fs, 0.9 * am, C.light, 'left', 600);
    }
    // angle labels on the bows
    const la = a * (opt.labels ?? 0);
    if (la > 0) {
      const [x1, y1] = skyXY(0, TH1R - SUN_EL), [x2, y2] = skyXY(0, TH2R - SUN_EL);
      label(s, phone ? 'main bow' : `main bow, ${f1(TH1V)}°–${f1(TH1R)}°`, x1, y1 + Math.max(k * 4.5, fs * 1.6), fs, 0.9 * la, C.text, 'center', 600);
      if (secA > 0.05) label(s, phone ? 'secondary' : `secondary, ${f1(TH2R)}°–${f1(TH2V)}°`, x2, y2 - Math.max(k * 2.6, fs * 1.1), fs, 0.9 * la * Math.min(1, secA / a), C.text, 'center', 600);
      if (band > 0.05) {
        const [xb, yb] = skyXY(0, (TH1R + TH2R) / 2 - SUN_EL);
        label(s, phone ? 'darker band' : 'Alexander\'s dark band', xb, yb, fs, 0.85 * la * Math.min(1, band / a), C.muted, 'center', 600);
      }
    }
    // the aeroplane's view: a full circle
    const pa = a * (opt.plane ?? 0);
    if (pa > 0) {
      const r = Math.min(W * 0.1, capTop * 0.13), x = phone ? W - r - 14 : W - r - 30, y = phone ? r + 14 : r + 30;
      g.fillStyle = `rgba(30,38,70,${0.92 * pa})`; g.beginPath(); g.roundRect(x - r * 1.35, y - r * 1.35, r * 2.7, r * 2.7 + fs * 1.6, 10); g.fill();
      g.globalCompositeOperation = 'lighter';
      for (const nm of SKYNM) { const u = (theta1(nOf(nm)) - TH1V) / (TH1R - TH1V); g.strokeStyle = `rgba(${nmRGB(nm)},${0.5 * pa})`; g.lineWidth = r * 0.02; g.beginPath(); g.arc(x, y, r * (0.78 + 0.22 * u), 0, 7); g.stroke(); }
      g.globalCompositeOperation = 'source-over';
      // the plane's shadow at the centre (the antisolar point)
      g.fillStyle = `rgba(10,12,20,${0.9 * pa})`; g.beginPath(); g.moveTo(x - r * 0.18, y); g.lineTo(x + r * 0.18, y); g.lineTo(x, y - r * 0.06); g.closePath(); g.fill();
      g.fillRect(x - r * 0.03, y - r * 0.12, r * 0.06, r * 0.24);
      label(s, 'from an aeroplane', x, y + r * 1.35 + fs * 0.7, fs, 0.9 * pa, C.text);
    }
  }

  // ---------- the drop ----------
  const toScr = ([x, y]) => [L.dx + x * L.R, L.dy - y * L.R];
  function drawDrop(s, a) {
    const { g } = s, { dx, dy, R } = L;
    const gr = g.createRadialGradient(dx - R * 0.3, dy - R * 0.3, R * 0.1, dx, dy, R);
    gr.addColorStop(0, `rgba(${WATER},${0.22 * a})`); gr.addColorStop(1, `rgba(${WATER},${0.1 * a})`);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = gr; g.beginPath(); g.arc(dx, dy, R, 0, 7); g.fill();
    g.strokeStyle = `rgba(${WATER},${0.7 * a})`; g.lineWidth = 1.6; g.stroke();
  }
  // the full path of a ray in screen coordinates: from the left edge, through the drop, and a length out
  const rayPts = (tr, outLen) => {
    const pts = tr.P.map(toScr), e = tr.P[tr.P.length - 1];
    const start = [-0.05 * L.W, pts[0][1]];
    const ex = toScr(e), o = tr.out;
    return [start, ...pts, [ex[0] + o[0] * outLen, ex[1] - o[1] * outLen]];
  };
  const RAYV = 260;                                          // speed of light on the screen (pixels per scene second, hugely slowed)

  function drawHist(s, t, a, sets, maxCount, marks, lo = 0, hi = 60) {
    if (a <= 0) return;
    const { g } = s, { hist: b, fs } = L;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(14,20,44,${0.8 * a})`; g.beginPath(); g.roundRect(b.x0 - 26, b.y0 - fs * 2.6, b.x1 - b.x0 + 36, b.y1 - b.y0 + fs * 5.2, 10); g.fill();
    label(s, 'rays coming out, per ¼°', b.x0 - 18, b.y0 - fs * 1.4, fs, 0.85 * a, C.muted, 'left', 600);
    D.line(s, b.x0, b.y1, b.x1, b.y1, C.muted, 0.7 * a, 1.2);
    const X = (th) => b.x0 + (b.x1 - b.x0) * (th - lo) / (hi - lo);
    for (const th of (hi - lo > 30 ? [0, 20, 40, 60] : [lo, (lo + hi) / 2, hi])) { D.line(s, X(th), b.y1, X(th), b.y1 + 4, C.muted, 0.7 * a); label(s, `${th}°`, X(th), b.y1 + fs * 0.95, fs - 1, 0.8 * a); }
    label(s, 'θ: angle from straight back', (b.x0 + b.x1) / 2, b.y1 + fs * 2.1, fs - 1, 0.7 * a);
    g.globalCompositeOperation = 'lighter';
    for (const [bins, rgb, al] of sets) {
      const pts = [];
      for (let i = 0; i < NB; i++) { const th = (i + 0.5) * BIN; if (th >= lo && th <= hi) pts.push([X(th), b.y1 - (b.y1 - b.y0) * Math.min(1, bins[i] / maxCount)]); }
      D.glowLine(s, pts, rgb, al * a, 1.2);
    }
    g.globalCompositeOperation = 'source-over';
    for (const [th, txt, rgb, ma, al = 'center'] of marks) {
      if (ma <= 0) continue;
      D.line(s, X(th), b.y0, X(th), b.y1, rgb, 0.5 * a * ma, 1, [3, 4]);
      label(s, txt, X(th) + (al === 'left' ? 4 : al === 'right' ? -4 : 0), b.y0 - fs * 0.2, fs, a * ma, rgb, al, 600);
    }
  }

  // part B: one ray, step by step
  function partB(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { R, dx, dy, fs } = L;
    drawDrop(s, a);
    const tt = t - PB, pts = rayPts(EX, R * 2.2);
    // the ray (white sunlight) moves on step by step with the captions: in to the back of the drop, then (from the
    // reflection caption) back across the drop, then (from the "leaves" caption) out; always at the same speed
    const seg = (i) => Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    const c2 = seg(0) + seg(1), c3 = c2 + seg(2);
    let len = Math.min(RAYV * Math.max(0, tt), c2);
    if (t >= at(4)) len = Math.min(c2 + RAYV * (t - at(4)), c3);
    if (t >= at(6)) len = c3 + RAYV * (t - at(6));
    D.glowLine(s, partial(pts, len), SUN, 0.9 * a, 1.6);
    const P2 = toScr(EX.P[1]);
    const tThrough = at(4) - PB;                                     // when the "passes out of the back" caption starts
    if (tt > tThrough) {
      const o = EX.through;
      D.glowLine(s, partial([P2, [P2[0] + o[0] * R * 1.6, P2[1] - o[1] * R * 1.6]], RAYV * (tt - tThrough)), SUN, 0.35 * a, 1.2);
    }
    // the normal and the angles at the entry point
    const P1 = toScr(EX.P[0]), na = a * fade(t, at(2) + 0.6, at(8), 0.6, 0.8);
    if (na > 0) {
      const ux = (P1[0] - dx) / R, uy = (P1[1] - dy) / R;
      D.line(s, P1[0] + ux * R * 0.55, P1[1] + uy * R * 0.55, P1[0] - ux * R * 0.75, P1[1] - uy * R * 0.75, C.muted, 0.7 * na, 1, [4, 4]);
      const ang0 = Math.atan2(uy, ux);                                  // outward normal (screen angle)
      const ai = a * fade(t, at(3), at(8), 0.6, 0.8);
      // i: between the incoming ray (pointing back to the left, angle π) and the outward normal
      const back = ang0 < 0 ? -Math.PI : Math.PI;                       // the direction the ray came from (left)
      arcLine(s, P1[0], P1[1], R * 0.32, ang0, back, C.light, 0.85 * ai);
      label(s, 'i', P1[0] + R * 0.44 * Math.cos((ang0 + back) / 2), P1[1] + R * 0.44 * Math.sin((ang0 + back) / 2), fs + 3, ai, C.light, 'center', 600);
      const t1 = [EX.P[1][0] - EX.P[0][0], -(EX.P[1][1] - EX.P[0][1])], angT = Math.atan2(t1[1], t1[0]), angIn = ang0 + Math.PI;
      arcLine(s, P1[0], P1[1], R * 0.32, angIn, angT, C.light, 0.85 * ai);
      label(s, 'r', P1[0] + R * 0.44 * Math.cos((angIn + angT) / 2), P1[1] + R * 0.44 * Math.sin((angIn + angT) / 2), fs + 3, ai, C.light, 'center', 600);
    }
    // labels for the three events
    const la = (i, j) => a * fade(t, at(i), at(j), 0.6, 0.8);
    label(s, 'refraction', P1[0] + fs * 0.6, P1[1] - fs * 1.5, fs, la(2, 8), C.text, 'left', 600);
    label(s, 'partial reflection', P2[0] + (L.phone ? -fs * 0.6 : fs * 0.4), P2[1] + fs * 1.6, fs, la(4, 8), C.text, L.phone ? 'right' : 'left', 600);
    const P3 = toScr(EX.P[2]);
    label(s, 'refraction', P3[0] - fs * 0.6, P3[1] + fs * 1.5, fs, la(6, 8), C.text, 'right', 600);
    // the angle out: θ between the outgoing ray and straight back (−x)
    const ta = a * fade(t, at(7), at(8) + 0.4, 0.6, 0.6);
    if (ta > 0) {
      const o = EX.out, L2 = R * 1.6;
      D.line(s, P3[0], P3[1], P3[0] - L2, P3[1], C.muted, 0.7 * ta, 1, [4, 4]);
      const angO = Math.atan2(-o[1], o[0]);
      arcLine(s, P3[0], P3[1], R * 0.9, Math.PI, angO, C.light, 0.9 * ta, 1.6);
      const mid = (Math.PI + angO) / 2;
      label(s, `${f1(EX.theta)}°`, P3[0] + R * 1.12 * Math.cos(mid), P3[1] + R * 1.12 * Math.sin(mid), fs + 1, ta, C.light, 'center', 600);
      label(s, 'straight back', P3[0] - L2 - fs * 0.4, P3[1], fs - 1, 0.8 * ta, C.muted, 'right');
    }
    label(s, 'sunlight', Math.max(fs * 3.4, dx - R * 2.4), P1[1] - fs * 1.2, fs, a * fade(t, PB, at(4), 0.6, 0.6), SUN, 'center', 600);
    label(s, L.phone ? 'drop, enlarged' : 'one raindrop (enlarged)', dx + R * 0.75, dy + R + fs * 1.2, fs, 0.8 * a, WATER, 'left');
  }

  // part C: many rays, and the histogram building up
  const NRAYS = 26, C_LAUNCH = 0.32;
  const CRAYS = Array.from({ length: NRAYS }, (_, j) => trace((j + 0.5) / NRAYS, N_RED));
  function partC(s, t, a) {
    if (a <= 0) return;
    const { R } = L, tt = t - (at(9) - 1.5);                    // the rays set off just before the answer caption (not during the Predict question)
    drawDrop(s, a);
    CRAYS.forEach((tr, j) => {
      const tj = tt - j * C_LAUNCH; if (tj <= 0) return;
      const near = Math.abs(tr.theta - TH1R) < 3;
      D.glowLine(s, partial(rayPts(tr, R * 2.0), RAYV * tj), near ? SUN : '200,205,225', (near ? 0.8 : 0.45) * a, near ? 1.3 : 1);
    });
    // mirrored rays (the lower half), once that caption starts
    const tm = t - at(11);
    if (tm > 0) CRAYS.forEach((tr, j) => {
      const tj = tm - j * 0.08; if (tj <= 0) return;
      const mir = { ...tr, P: tr.P.map(([x, y]) => [x, -y]), out: [tr.out[0], -tr.out[1]] };
      D.glowLine(s, partial(rayPts(mir, R * 2.0), RAYV * tj), '200,205,225', 0.4 * a, 1);
    });
    // histogram: rays sweep from the middle of the drop to its edge
    const frac = clamp((tt + 0.2) / (NRAYS * C_LAUNCH + 2.5), 0, 1);
    const bins = countBins(H1.red, Math.floor(frac * NH));
    drawHist(s, t, a, [[bins, '230,232,245', 0.95]], PEAK1 * 1.05, [[TH1R, `${f1(TH1R)}°`, C.light, smooth((t - at(10)) / 0.8)]]);
  }

  // part D: colours
  const D_H = Math.sin(59.2 * DEG);
  let D_RAYS = null;
  function partD(s, t, a) {
    if (a <= 0) return;
    D_RAYS ||= [trace(D_H, N_RED), ...SKYNM.map((nm) => trace(D_H, nOf(nm)))];
    const { R } = L, tt = t - PD;
    drawDrop(s, a);
    // one white ray (i = 59.2°, between the red and violet rainbow rays) splits into colours inside the drop
    const lenIn = RAYV * Math.max(0, tt - 0.6), first = rayPts(D_RAYS[0], 0), toEntry = Math.hypot(first[1][0] - first[0][0], first[1][1] - first[0][1]);
    D.glowLine(s, partial(first.slice(0, 2), lenIn), SUN, 0.9 * a, 1.6);
    if (lenIn > toEntry) SKYNM.forEach((nm, j) => {
      const pts = rayPts(D_RAYS[j + 1], L.W * 0.9).slice(1);
      D.glowLine(s, partial(pts, lenIn - toEntry), nmRGB(nm), 0.5 * a, 1);
    });
    const sets = H1C.map((ord, j) => [countBins(ord, NH), nmRGB(SPEC[j]), 0.75]);
    drawHist(s, t, a * smooth((tt - 0.4) / 0.8), sets, PEAK1 * 1.05,
      [[TH1R, `red ${f1(TH1R)}°`, RED, smooth((t - at(13)) / 0.6), 'left'], [TH1V, `violet ${f1(TH1V)}°`, VIO_T, smooth((t - at(13) - 0.8) / 0.6), 'right']], 30, 50);
  }

  // part E: the side view (observer, sunlight, drops)
  function partE(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { W, capTop, fs, phone } = L;
    const gY = capTop * (phone ? 0.72 : 0.84), ex = W * (phone ? 0.16 : 0.2), eyeY = gY - capTop * 0.1;
    // ground
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(22,30,24,${a})`; g.fillRect(0, gY, W, s.H - gY);
    D.line(s, 0, gY, W, gY, '120,150,120', 0.6 * a, 1.2);
    // the observer: a simple figure, eye at eyeY
    const hu = capTop * 0.1;
    g.strokeStyle = `rgba(230,235,250,${0.9 * a})`; g.lineWidth = 2; g.lineCap = 'round';
    g.beginPath(); g.arc(ex - hu * 0.05, eyeY, hu * 0.12, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(ex - hu * 0.05, eyeY + hu * 0.12); g.lineTo(ex - hu * 0.05, gY - hu * 0.45);
    g.moveTo(ex - hu * 0.05, gY - hu * 0.45); g.lineTo(ex - hu * 0.25, gY); g.moveTo(ex - hu * 0.05, gY - hu * 0.45); g.lineTo(ex + hu * 0.15, gY);
    g.moveTo(ex - hu * 0.05, eyeY + hu * 0.3); g.lineTo(ex + hu * 0.12, eyeY + hu * 0.6); g.stroke();
    // sunlight: parallel rays from behind, 15° below the horizontal, moving at a steady speed
    const sd = [Math.cos(SUN_EL * DEG), Math.sin(SUN_EL * DEG)];   // screen: right and down
    const spacing = capTop * 0.11, tt = t - PE;
    for (let j = -2; j < 9; j++) {
      const ox = -W * 0.1 + j * spacing * 1.2, oy = -capTop * 0.1;
      const len = W * 1.4, ph = (tt * 60) % 40;
      g.strokeStyle = `rgba(${SUN},${0.16 * a})`; g.lineWidth = 1.2; g.setLineDash([24, 16]); g.lineDashOffset = -ph;
      g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + sd[0] * len, oy + sd[1] * len); g.stroke();
    }
    g.setLineDash([]); g.lineDashOffset = 0;
    label(s, 'sunlight from behind you', ex + W * 0.06, capTop * 0.06 + fs, fs, 0.85 * a * fade(t, PE, PE2, 0.6, 0.6), SUN, 'left', 600);
    // the antisolar line from the eye
    const la = a * smooth((t - at(15)) / 0.8), Lr = W * (phone ? 0.78 : 0.7);
    if (la > 0) {
      const x2 = ex + sd[0] * Lr * 0.55, y2 = eyeY + sd[1] * Lr * 0.55;
      D.line(s, ex, eyeY, x2, y2, C.light, 0.8 * la, 1.4, [6, 5]);
      label(s, 'towards the antisolar point', x2 - fs * 0.2, y2 + fs * 1.1, fs, la, C.light, 'right', 600);
      // the shadow of the head on the ground, along the same line
      const sx = ex + (gY - eyeY) / Math.tan(SUN_EL * DEG);
      if (sx < W - 10) { g.fillStyle = `rgba(0,0,0,${0.6 * la})`; g.beginPath(); g.ellipse(sx, gY + 2, hu * 0.25, 3, 0, 0, 7); g.fill(); }
    }
    // drops at 42.4° (red) and 40.6° (violet) above the antisolar direction
    const da = a * smooth((t - at(16)) / 0.8);
    if (da > 0) {
      const Dd = Math.min(Lr, (eyeY - fs * 2.2) / Math.sin((TH1R - SUN_EL) * DEG), (W - ex - fs * 14) / Math.cos((TH1R - SUN_EL) * DEG));
      const drop = (thDeg) => { const el = (thDeg - SUN_EL) * DEG; return [ex + Dd * Math.cos(el), eyeY - Dd * Math.sin(el)]; };
      for (const [th, rgb, name, other, orgb] of [[TH1R, RED, 'red', TH1V, VIO], [TH1V, VIO, 'violet', TH1R, RED]]) {
        const [px, py] = drop(th);
        // the drop
        g.fillStyle = `rgba(${WATER},${0.5 * da})`; g.beginPath(); g.arc(px, py, 5, 0, 7); g.fill();
        // the coloured ray to the eye
        D.glowLine(s, partial([[px, py], [ex, eyeY]], RAYV * 1.6 * Math.max(0, t - at(16) - 0.4)), rgb, 0.9 * da, 1.4);
        // its other colour: leaves at the other angle, so it passes above or below the eye
        const el2 = (other - SUN_EL) * DEG, dir = [-Math.cos(el2), Math.sin(el2)];
        const lenO = Dd * 0.95;
        D.glowLine(s, partial([[px, py], [px + dir[0] * lenO, py + dir[1] * lenO]], RAYV * 1.6 * Math.max(0, t - at(16) - 1.2)), orgb, 0.35 * da, 1);
        label(s, name === 'red' ? `${f1(th)}°: red reaches you` : `${f1(th)}°: violet reaches you`, px + 10, py + (name === 'red' ? -fs : fs), fs, da, name === 'red' ? RED : VIO_T, 'left', 600);
      }
      // the angle arc at the eye
      const a0 = SUN_EL * DEG, a1 = -(TH1R - SUN_EL) * DEG;
      arcLine(s, ex, eyeY, W * 0.12, a0, a1, C.light, 0.8 * da, 1.4);
      label(s, '42°', ex + W * 0.14 * Math.cos((a0 + a1) / 2), eyeY + W * 0.14 * Math.sin((a0 + a1) / 2), fs + 1, da, C.light, 'center', 600);
    }
    // the lower half of the cone goes into the ground
    const ga = a * smooth((t - at(17) - 1) / 0.8);
    if (ga > 0) {
      const el = (-TH1R - SUN_EL) * DEG, gx = ex + (gY - eyeY) / Math.tan(-el);
      D.line(s, ex, eyeY, gx, gY, RED, 0.5 * ga, 1.2, [4, 4]);
      label(s, 'the lower half: hidden by the ground', gx + 6, gY + fs * 1.2, fs, 0.8 * ga, C.muted, 'left');
    }
  }

  // part F: two reflections in the drop, and their histogram
  const SEC_RAY = trace(Math.sin(rainbowI2(N_RED)), N_RED, 2);
  const PEAK2 = Math.max(...countBins(H2C[0], NH));
  function partF(s, t, a) {
    if (a <= 0) return;
    const { R } = L, tt = t - PF;
    drawDrop(s, a);
    D.glowLine(s, partial(rayPts(SEC_RAY, R * 2.2), RAYV * Math.max(0, tt - 0.5)), RED, 0.9 * a, 1.4);
    const sets = H2C.map((ord, j) => [countBins(ord, NH), nmRGB(SPEC[j]), 0.75]);
    drawHist(s, t, a * smooth((tt - 0.4) / 0.8), sets, PEAK2 * 1.1, [[TH2R, `${f1(TH2R)}°`, RED, 1, 'right'], [TH2V, `${f1(TH2V)}°`, VIO_T, 1, 'left']], 40, 60);
  }

  // ---------- end card ----------
  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.88 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 52, 13, 20)), s3 = Math.round(clamp(W / 62, 11, 16));
    g.font = D.sans(s1, 300);
    const l1 = D.wrap(s, 'A rainbow: refraction, reflection and dispersion in millions of drops', W - 48);
    let y = H * (phone ? 0.11 : 0.15);
    D.text(s, l1, W / 2, y, s1, a, D.sans(s1, 300)); y += s1 * 1.3 * l1.length + s2 * 0.6;
    const items = [
      ['n₁ sin θ₁ = n₂ sin θ₂', SUN, 'Light refracts into the drop, is partly reflected at the back (not total internal reflection) and refracts out.'],
      [`about 42°`, C.light, 'The rays bunch up at the largest angle they can come out at, so each drop sends a bright cone back at about 42°.'],
      ['red outside, violet inside', RED, 'Each colour has its own angle; the secondary bow (two reflections, about 50–54°) reverses the colours.'],
    ];
    if (phone) {
      for (const [eq, rgb, txt] of items) {
        D.text(s, eq, W / 2, y, s2 + 1, a, D.serif(s2 + 1, false), rgb); y += s2 * 1.25;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 36); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.8;
      }
    } else {
      const colW = Math.min(W * 0.28, 320);
      g.font = D.sans(s3);
      const wr = items.map(([, , txt]) => D.wrap(s, txt, colW));
      items.forEach(([eq, rgb], i) => {
        const x = W / 2 + (i - 1) * W * 0.31;
        D.text(s, eq, x, y, s2 + 1, a, D.serif(s2 + 1, false), rgb);
        D.text(s, wr[i], x, y + s2 * 1.4, s3, 0.85 * a, D.sans(s3));
      });
      y += s2 * 1.4 + s3 * 1.3 * Math.max(...wr.map((w) => w.length)) + s3;
    }
    g.font = D.sans(s3 - 1);
    D.text(s, D.wrap(s, 'Beyond the course: dispersion (n depends on the colour) and how much light is reflected at the back of the drop. The drop is drawn hugely enlarged and the light hugely slowed down.', Math.min(W - 40, 760)),
      W / 2, Math.max(y + s3, H * (phone ? 0.78 : 0.8)), s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('rainbow', {
    duration: DURATION,
    poster: PF2 + 3,
    // score: after the rain (E major with an added sixth, a soft sine pad, a light shimmer, a breath of wind)
    music: { chords: [[40, 47, 54, 56], [45, 52, 57, 61], [37, 44, 52, 56], [42, 49, 54, 61]], bar: 10, pad: 'sine', cutoff: 850, drone: 0.08, wind: 0.25, shimmer: 0.3, tremolo: 0.05, volume: 0.36 },
    resize: layout,
    info: {
      CAPS, DURATION, TH1R, TH1V, TH2R, TH2V, CRIT, R_EX, EX, FR, trace, nOf,
      check() {
        const r = (x, d = 2) => +x.toFixed(d);
        // the largest θ over many rays should equal the formula's rainbow angle
        let m1 = 0, m2 = 180;
        for (let k = 1; k < 20000; k++) { const h = k / 20000; m1 = Math.max(m1, trace(h, N_RED).theta); m2 = Math.min(m2, trace(h, N_RED, 2).theta); }
        return { A: r(CA, 4), B: r(CB, 0), n700: r(nOf(700), 4), n405: r(nOf(405), 4), r_ex: r(R_EX), sinR: r(Math.sin(R_EX * DEG), 4),
          crit: r(CRIT), exTheta: r(EX.theta), turned: r(180 - EX.theta), th1R: r(TH1R), th1V: r(TH1V), th2R: r(TH2R), th2V: r(TH2V),
          scanMax1: r(m1), scanMin2: r(m2), fresnel: { rs: r(FR.rs * 100, 1), rp: r(FR.rp * 100, 1), avg: r(FR.avg * 100, 1) },
          maxRate: Math.max(...CAPS.map(([a0, b0, tx]) => tx.length / (b0 - a0 - 0.6))).toFixed(1), DURATION: r(DURATION, 1) };
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.14);
      // part A: the sky with a rainbow
      drawSky(s, t, partA(t, 0, PB), { bow: smooth((t - 3) / 2), labels: 0 });
      partB(s, t, partA(t, PB, PC));
      partC(s, t, partA(t, PC, PD));
      partD(s, t, partA(t, PD, PE));
      partE(s, t, partA(t, PE, PE2));
      drawSky(s, t, partA(t, PE2, PF), { bow: 1, anti: 1, labels: 0.9, plane: smooth((t - at(18) - 2) / 0.8) });
      partF(s, t, partA(t, PF, PF2));
      drawSky(s, t, partA(t, PF2, null), { bow: 1, second: smooth((t - PF2) / 1.5), band: smooth((t - at(21)) / 1.2), anti: 0.8, labels: 1 });
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.75 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'How does a rainbow work?', 'Sunlight, raindrops, refraction and reflection');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
