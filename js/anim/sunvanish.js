/* What would happen if the Sun vanished? (A.2 circular motion, Newton's first law; D.1 orbits)
   A thought experiment: the Sun can't really vanish (its mass and energy can't simply disappear). The planets move in
   circular orbits; the Sun's pull provides the centripetal force. When the Sun vanishes, the news (its last light and the
   change in its gravity) spreads out at the speed of light c. Until the news arrives, each planet carries on exactly as
   before; then, with no force on it, it moves off in a straight line along the tangent at its orbital speed.
   That changes in gravity travel at c is beyond the course: general relativity predicts it, and the 2017 neutron-star
   merger (gravitational waves and light arriving together after about 130 million years) confirmed it.
   Numbers (data booklet: G = 6.67 × 10⁻¹¹ N m² kg⁻², 1 au = 1.50 × 10¹¹ m, c = 3.00 × 10⁸ m s⁻¹; the solar mass
   M☉ = 1.99 × 10³⁰ kg is the standard value, not given in the 2025 booklet; one year = 3.16 × 10⁷ s), all recalculated
   in info.check():
     Earth: v = 2πr ÷ T = 2π × 1.50 × 10¹¹ ÷ (3.16 × 10⁷) = 2.98 × 10⁴ m s⁻¹ (about 30 km s⁻¹)
            √(GM/r) = √(6.67 × 10⁻¹¹ × 1.99 × 10³⁰ ÷ 1.50 × 10¹¹) = 2.97 × 10⁴ m s⁻¹ (the same, to rounding)
            the Sun's field at the Earth GM/r² = 5.90 × 10⁻³ N kg⁻¹ = v²/r (5.9 × 10⁻³ m s⁻²)
     light time to the Earth r ÷ c = 1.50 × 10¹¹ ÷ (3.00 × 10⁸) = 500 s = 8 min 20 s
     other planets (orbit radius in au × 500 s): Mercury 0.387 au → 194 s (3.2 min); Venus 0.723 → 362 s (6.0 min);
       Mars 1.52 → 760 s (12.7 min); Jupiter 5.20 → 2600 s (43 min); Saturn 9.58 → 4790 s (80 min);
       Uranus 19.2 → 9600 s (2.7 h); Neptune 30.1 → 15 050 s (4 h 11 min)
     periods from Kepler's third law for circular orbits, T = a^1.5 years (a in au); speeds 2πa ÷ T.
   Moon: period 27.3 days; its distance from the Earth (3.84 × 10⁸ m, 0.0026 au) is drawn far bigger than to scale.
   Playback: a year every 30 s (1.05 × 10⁶ times faster than real) while the orbits are explained, slowing to 20 times
   faster when the Sun vanishes (the news then takes 25 s to reach the Earth), about 650 times faster while it crosses
   the outer Solar System, then a year every 30 s again. The speed is always shown on screen; the motion never stops.
   Every frame is drawn from the scene time alone. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const NB = ' ';

  // ---------- the physics ----------
  const AU = 1.50e11, CL = 3.00e8, YEAR = 3.16e7, G = 6.67e-11, MSUN = 1.99e30, GM = G * MSUN;
  const LIGHT_AU = AU / CL;                                                  // 500 s
  const MOON_T = 27.3 * 86400;
  // name, orbit radius / au, colour, size (not to scale), angle at the moment the Sun vanishes (degrees)
  const PL = [
    ['Mercury', 0.387, '190,190,205', 0.55, 40],
    ['Venus', 0.723, '240,222,170', 0.8, 145],
    ['Earth', 1.00, '110,170,255', 0.9, 235],
    ['Mars', 1.52, '235,125,95', 0.65, 315],
    ['Jupiter', 5.20, '225,190,150', 1.45, 70],
    ['Saturn', 9.58, '232,212,152', 1.25, 165],
    ['Uranus', 19.2, '160,226,236', 1.05, 285],
    ['Neptune', 30.1, '115,145,255', 1.05, 25],
  ].map(([name, a, rgb, size, ph]) => {
    const T = Math.pow(a, 1.5) * YEAR;
    return { name, a, rgb, size, ph: ph * Math.PI / 180, T, v: 2 * Math.PI * a * AU / T, rel: a * LIGHT_AU };
  });
  const EARTH = PL[2];

  // ---------- timeline (scene seconds) ----------
  const FAST = YEAR / 30, SLOW = 20, MID = 650;
  const R1 = [40.0, 42.4], T_V = 43.0, R2 = [76.0, 79.0], R3 = [104.5, 107.5];
  const Z1 = [76.5, 81.5], Z2 = [104.5, 108.5];                            // zoom out, then back in
  const VIEW0 = 1.75, VIEW1 = 33, VIEW2 = 10;                                // view radius in au
  const END = 132.4, DURATION = 144.8;
  const lr = (a, b, u) => Math.exp(lerp(Math.log(a), Math.log(b), smooth(u)));
  const rate = (t) => {
    if (t < R2[0]) return lr(FAST, SLOW, (t - R1[0]) / (R1[1] - R1[0]));
    if (t < R3[0]) return lr(SLOW, MID, (t - R2[0]) / (R2[1] - R2[0]));
    return lr(MID, FAST, (t - R3[0]) / (R3[1] - R3[0]));
  };
  const viewAt = (t) => t < Z2[0] ? lr(VIEW0, VIEW1, (t - Z1[0]) / (Z1[1] - Z1[0])) : lr(VIEW1, VIEW2, (t - Z2[0]) / (Z2[1] - Z2[0]));
  // real seconds since the start, integrated once (trapezium rule) and looked up by t
  const DT = 0.005, NT = Math.ceil(DURATION / DT) + 2, TAU = new Float64Array(NT);
  for (let i = 1; i < NT; i++) TAU[i] = TAU[i - 1] + 0.5 * (rate((i - 1) * DT) + rate(i * DT)) * DT;
  const tauAt = (t) => { const f = clamp(t / DT, 0, NT - 1.001), k = Math.floor(f); return lerp(TAU[k], TAU[k + 1], f - k); };
  const tOfTau = (tau) => {                                                  // scene time when τ is reached
    let lo = 0, hi = NT - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (TAU[m] < tau) lo = m; else hi = m; }
    return (lo + (tau - TAU[lo]) / Math.max(1e-12, TAU[hi] - TAU[lo])) * DT;
  };
  const TAU_V = tauAt(T_V);
  PL.forEach((p) => { p.tRel = tOfTau(TAU_V + p.rel); });                    // scene time when the news reaches it

  // position (au) and velocity direction of a planet at real time tau
  const theta = (p, tau) => p.ph + 2 * Math.PI * (tau - TAU_V) / p.T;
  function planetAt(p, tau) {
    const tr = TAU_V + p.rel;
    if (tau < tr) { const th = theta(p, tau); return { x: p.a * Math.cos(th), y: p.a * Math.sin(th), ux: -Math.sin(th), uy: Math.cos(th), free: false }; }
    const th = theta(p, tr), ux = -Math.sin(th), uy = Math.cos(th), d = p.v * (tau - tr) / AU;
    return { x: p.a * Math.cos(th) + ux * d, y: p.a * Math.sin(th) + uy * d, ux, uy, free: true, x0: p.a * Math.cos(th), y0: p.a * Math.sin(th) };
  }

  const sci = (v, dp = 2) => { const e = Math.floor(Math.log10(Math.abs(v))), m = v / 10 ** e;
    const sup = String(e).replace('-', '⁻').replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]); return `${m.toFixed(dp)}${NB}×${NB}10${sup}`; };

  const CAPS = [
    [4.8, 11.2, 'The Earth goes round the Sun once a year, in an orbit that is very nearly a circle.'],
    [11.4, 18.8, `Its radius is r${NB}=${NB}1.50${NB}×${NB}10¹¹${NB}m, so its speed is v${NB}=${NB}2πr${NB}÷${NB}T = ${sci(EARTH.v)}${NB}m${NB}s⁻¹: about 30${NB}km every second.`],
    [19.0, 25.4, 'The Sun\'s gravitational pull provides the centripetal force that keeps the Earth on its circle.'],
    [25.6, 32.0, 'Now suppose the Sun suddenly vanished. (It can\'t: its mass and energy can\'t simply disappear.)'],
    [32.2, 42.8, 'Predict: what would happen to the Earth, and how soon would we notice?'],
    [43.2, 49.6, 'The Sun is gone, but nothing changes yet: we still see it, and its pull still acts on the Earth.'],
    [49.8, 56.2, 'The news that the Sun has gone spreads outwards at the speed of light, c: the yellow ring.'],
    [56.4, 63.0, 'Changes in gravity travel at c too. (General relativity predicts this: beyond the syllabus.)'],
    [63.2, 69.8, `It reaches the Earth after r${NB}÷${NB}c = 1.50${NB}×${NB}10¹¹${NB}÷${NB}(3.00${NB}×${NB}10⁸) = 500${NB}s: 8 minutes 20 seconds.`],
    [70.0, 75.8, 'Only then does the Sun vanish from our sky, and at the same moment its pull is gone.'],
    [76.0, 82.6, 'The planets further out keep orbiting for longer: the news hasn\'t reached them yet.'],
    [82.8, 89.4, 'Jupiter, 5.2 times as far away, keeps the Sun for 43 minutes. Mars lost it after 13 minutes.'],
    [89.6, 96.2, 'Each planet keeps orbiting until the news arrives, then moves off in a straight line.'],
    [96.4, 103.6, 'Neptune, 30 times as far from the Sun as the Earth, keeps orbiting for about 4 hours.'],
    [103.8, 110.6, 'Speeded up to a year every 30 s again: each planet now moves at a constant speed in a straight line.'],
    [110.8, 117.4, 'No resultant force means no acceleration: Newton\'s first law. The Moon still orbits the Earth as they go.'],
    [117.6, 124.2, 'Each sets off along the tangent to its old orbit, in the direction it was moving when the pull vanished.'],
    [124.4, 132.0, 'In 2017, gamma rays (light) and gravitational waves from colliding neutron stars arrived together (beyond the syllabus).'],
  ];

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25)), capTop = H - capFs * (phone ? 6.6 : 5.4);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    let cx, cy, Rv, inset;
    if (phone) {
      const w = W * 0.36, h = w * 0.62;
      inset = { x0: W - w - 10, y0: 10, w, h };
      const top = 10 + h + 10;
      Rv = Math.min(W * 0.46, (capTop - top - 6) / 2); cx = W / 2; cy = top + Rv;
    } else {
      Rv = Math.min(W * 0.3, capTop * 0.45); cx = W * 0.42; cy = capTop * 0.5 + 6;
      const w = Math.min(W * 0.19, 230), h = w * 0.62;
      inset = { x0: W - w - Math.max(16, W * 0.03), y0: Math.max(64, capTop * 0.36), w, h };
    }
    L = { W, H, phone, capFs, capTop, fs, cx, cy, Rv, inset };
  }

  const fmtRate = (r) => {
    if (r > 0.98 * FAST) return 'speeded up: a year every 30 s';
    const n = Number(r.toPrecision(2));
    return `speeded up ${n >= 1e4 ? n.toLocaleString('en-GB').replace(/,/g, ' ') : n} times`;
  };
  const fmtT = (sec) => {
    if (sec < 3600) { const m = Math.floor(sec / 60), ss = Math.floor(sec - 60 * m); return `${m} min ${String(ss).padStart(2, '0')} s`; }
    if (sec < 48 * 3600) { const h = Math.floor(sec / 3600), m = Math.floor((sec - 3600 * h) / 60); return `${h} h ${String(m).padStart(2, '0')} min`; }
    return `${Math.floor(sec / 86400)} days`;
  };

  // ---------- drawing ----------
  function drawSystem(s, t, tau) {
    const { g } = s, { cx, cy, Rv, fs, phone } = L;
    const view = viewAt(t), k = Rv / view;
    const X = (x) => cx + x * k, Y = (y) => cy - y * k;
    const since = tau - TAU_V, ringAU = since > 0 ? since * CL / AU : 0, ringPx = ringAU * k;

    // sunlight: before the Sun vanishes a glow around it; afterwards only outside the ring (its last light, moving out)
    const glowW = Rv * 0.9;
    if (ringPx < Math.hypot(L.W, L.H) * 1.5) {
      const rg = g.createRadialGradient(cx, cy, ringPx, cx, cy, ringPx + glowW);
      rg.addColorStop(0, `rgba(255,214,102,${since > 0 ? 0.13 : 0.16})`); rg.addColorStop(1, 'rgba(255,214,102,0)');
      g.globalCompositeOperation = 'lighter'; g.fillStyle = rg;
      g.beginPath(); g.arc(cx, cy, ringPx + glowW, 0, 2 * Math.PI);
      if (ringPx > 0.5) { g.moveTo(cx + ringPx, cy); g.arc(cx, cy, ringPx, 0, 2 * Math.PI); }
      g.fill('evenodd');
      g.globalCompositeOperation = 'source-over';
    }

    // the orbits (dashed); faint once a planet has left its orbit
    g.setLineDash([2, 5]);
    for (const p of PL) {
      const r = p.a * k; if (r < 3 || r > Math.hypot(L.W, L.H)) continue;
      const free = tau >= TAU_V + p.rel;
      g.strokeStyle = `rgba(${p.rgb},${free ? 0.14 : 0.32})`; g.lineWidth = 1;
      g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
    }
    g.setLineDash([]);

    // the ring: the news that the Sun has gone, spreading at c
    if (since > 0 && ringPx < Math.hypot(L.W, L.H)) {
      const ring = []; for (let i = 0; i <= 120; i++) { const u = i / 120 * 2 * Math.PI; ring.push([cx + ringPx * Math.cos(u), cy + ringPx * Math.sin(u)]); }
      D.glowLine(s, ring, C.light, 0.85, 1.6);
      const la = fade(t, T_V + 1.0, R2[1] + 2, 0.8, 1.0);
      if (ringPx > fs * 4 && ringPx < Rv * 1.05) D.text(s, 'news travelling at c', cx, cy - ringPx - fs * 0.9, fs, 0.9 * la, D.sans(fs, 600), C.light);
    }

    // the Sun, then the place where it was
    const sunR = Math.max(7, Rv * 0.06), sa = 1 - smooth((t - T_V) / 0.25);
    if (sa > 0) {
      D.glowDot(s, cx, cy, sunR * 3.4, '255,190,80', sa);
      g.fillStyle = `rgba(255,236,170,${sa})`; g.beginPath(); g.arc(cx, cy, sunR * 0.75, 0, 7); g.fill();
      if (view < 3) D.text(s, 'Sun', cx, cy + sunR * 1.6 + fs * 0.4, fs, 0.85 * sa, D.sans(fs, 600), '255,226,160');
    }
    if (t > T_V) {
      const wa = smooth((t - T_V) / 0.6);
      g.setLineDash([3, 4]); g.strokeStyle = `rgba(200,205,225,${0.45 * wa})`; g.lineWidth = 1;
      g.beginPath(); g.arc(cx, cy, sunR * 0.75, 0, 7); g.stroke(); g.setLineDash([]);
      if (view < 3) D.text(s, 'where the Sun was', cx, cy + sunR + fs * 1.0, fs - 1, 0.7 * wa * (1 - smooth((t - 76) / 1)), D.sans(fs - 1), C.muted);
    }

    // the planets: their straight paths once free, the planet, its name
    const pr = Math.max(2.4, Rv * 0.02);
    for (const p of PL) {
      const q = planetAt(p, tau), px = X(q.x), py = Y(q.y);
      if (q.free) D.glowLine(s, [[X(q.x0), Y(q.y0)], [px, py]], p.rgb, 0.55, 1.2);
      if (px < -40 || px > L.W + 40 || py < -40 || py > L.H + 40) continue;
      const rr = pr * p.size * (view > 12 ? 0.85 : 1);
      // a brief flash as the news reaches it (they hardly move at these playback speeds)
      const hu = (t - p.tRel) / 1.8;
      if (hu > 0 && hu < 1) {
        g.strokeStyle = `rgba(${C.light},${0.9 * (1 - hu)})`; g.lineWidth = 2;
        g.beginPath(); g.arc(px, py, rr * 2.5 + hu * fs * 2.2, 0, 2 * Math.PI); g.stroke();
      }
      D.glowDot(s, px, py, rr * 3.2, p.rgb, 0.8);
      g.fillStyle = `rgba(${p.rgb},1)`; g.beginPath(); g.arc(px, py, rr, 0, 7); g.fill();
      const dist = Math.hypot(px - cx, py - cy);
      if (dist > fs * 2.6 && (view < 3 ? p.a < 2 : true) && !(phone && view > 20 && p.a < 4)) {
        const ox = (px - cx) / dist, oy = (py - cy) / dist;
        D.text(s, p.name, px + ox * (rr + fs * 1.2), py + oy * (rr + fs * 0.9), fs, 0.8, D.sans(fs, p === EARTH ? 600 : 400), p.rgb);
      }
    }

    // the Moon with the Earth (its distance far bigger than to scale)
    const e = planetAt(EARTH, tau), ex = X(e.x), ey = Y(e.y);
    if (view < 14) {
      const mr = Math.max(9, Rv * 0.055), mth = 2 * Math.PI * tau / MOON_T + 1.0;
      g.strokeStyle = 'rgba(200,205,225,0.18)'; g.lineWidth = 1; g.beginPath(); g.arc(ex, ey, mr, 0, 7); g.stroke();
      const mx = ex + mr * Math.cos(mth), my = ey - mr * Math.sin(mth);
      g.fillStyle = 'rgba(215,215,225,0.95)'; g.beginPath(); g.arc(mx, my, Math.max(1.5, pr * 0.5), 0, 7); g.fill();
      const ma = fade(t, 6, 30, 1, 1) + fade(t, 110.8, END, 1, 1);
      if (ma > 0) D.text(s, 'Moon (not to scale)', ex, ey + mr + fs * 1.0, fs - 1, 0.7 * ma, D.sans(fs - 1), C.muted);
    }

    // the Earth's velocity (blue) and the Sun's pull on it (orange), while the view is close
    const aa = 1 - smooth((t - Z1[0]) / 1.5);
    if (aa > 0) {
      const la = Rv * 0.24;
      D.arrow(s, ex, ey, ex + e.ux * la, ey - e.uy * la, C.vel, aa, 'v', { head: 9, width: 2.2, labelOff: 12 });
      const pull = 1 - smooth((t - EARTH.tRel) / 0.5);
      if (pull > 0) {
        const d = Math.hypot(e.x, e.y) || 1;
        D.arrow(s, ex, ey, ex - e.x / d * la * 0.8, ey + e.y / d * la * 0.8, C.force, aa * pull, 'F', { head: 9, width: 2.2, labelOff: 12 });
      }
    }

    // a scale bar
    const bar = view < 3 ? 1 : view < 15 ? 5 : 10, bl = bar * k;
    const bx = phone ? 12 : 16, by = phone ? L.capTop - fs * 0.6 : L.capTop - fs * 1.4;
    D.line(s, bx, by, bx + bl, by, '220,225,245', 0.7, 1.6);
    D.line(s, bx, by - 4, bx, by + 4, '220,225,245', 0.7, 1.6); D.line(s, bx + bl, by - 4, bx + bl, by + 4, '220,225,245', 0.7, 1.6);
    D.text(s, bar === 1 ? `1 au = 1.50${NB}×${NB}10¹¹ m` : `${bar} au`, bx, by - fs * 0.95, fs - 1, 0.75, D.sans(fs - 1), '220,225,245', 'left');
    if (!phone) D.text(s, 'planets and Sun far bigger than to scale', bx, by + fs * 1.1, fs - 1, 0.55, D.sans(fs - 1), C.muted, 'left');
  }

  // the sky seen from the Earth: the Sun is still there until its last light arrives
  function drawSky(s, t, tau, a) {
    if (a <= 0) return;
    const { g } = s, { inset: b, fs, phone } = L;
    const lit = tau < TAU_V + EARTH.rel, dark = smooth((t - EARTH.tRel) / 0.5);
    g.save(); g.globalAlpha = a;
    g.beginPath(); g.roundRect(b.x0, b.y0, b.w, b.h, 8); g.clip();
    const sky = g.createLinearGradient(0, b.y0, 0, b.y0 + b.h);
    sky.addColorStop(0, `rgba(${Math.round(lerp(70, 6, dark))},${Math.round(lerp(140, 8, dark))},${Math.round(lerp(225, 20, dark))},1)`);
    sky.addColorStop(1, `rgba(${Math.round(lerp(160, 10, dark))},${Math.round(lerp(200, 12, dark))},${Math.round(lerp(240, 26, dark))},1)`);
    g.fillStyle = sky; g.fillRect(b.x0, b.y0, b.w, b.h);
    for (let i = 0; i < 22; i++) {                                         // stars, once the sky is dark
      const sx = b.x0 + ((i * 7919) % 97) / 97 * b.w, sy = b.y0 + ((i * 6151) % 61) / 61 * b.h * 0.7;
      g.fillStyle = `rgba(230,235,255,${0.8 * dark})`; g.fillRect(sx, sy, 1.3, 1.3);
    }
    if (dark < 1) {
      const sx = b.x0 + b.w * 0.68, sy = b.y0 + b.h * 0.34, sr = Math.max(5, b.h * 0.11);
      g.globalCompositeOperation = 'lighter';
      const rg = g.createRadialGradient(sx, sy, 0, sx, sy, sr * 3.5);
      rg.addColorStop(0, `rgba(255,250,220,${1 - dark})`); rg.addColorStop(0.3, `rgba(255,220,120,${0.6 * (1 - dark)})`); rg.addColorStop(1, 'rgba(255,220,120,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(sx, sy, sr * 3.5, 0, 7); g.fill();
      g.globalCompositeOperation = 'source-over';
    }
    // the ground
    g.fillStyle = `rgba(${Math.round(lerp(60, 14, dark))},${Math.round(lerp(110, 22, dark))},${Math.round(lerp(70, 18, dark))},1)`;
    g.beginPath(); g.moveTo(b.x0, b.y0 + b.h * 0.8);
    g.quadraticCurveTo(b.x0 + b.w * 0.5, b.y0 + b.h * 0.7, b.x0 + b.w, b.y0 + b.h * 0.82); g.lineTo(b.x0 + b.w, b.y0 + b.h); g.lineTo(b.x0, b.y0 + b.h); g.fill();
    g.restore();
    g.strokeStyle = `rgba(170,182,220,${0.5 * a})`; g.lineWidth = 1; g.beginPath(); g.roundRect(b.x0, b.y0, b.w, b.h, 8); g.stroke();
    const f2 = phone ? fs - 1 : fs;
    D.text(s, 'the sky from Earth', b.x0 + 6, b.y0 + f2 * 0.95, f2, 0.9 * a, D.sans(f2, 600), C.text, 'left');
    const msg = t < T_V ? 'the Sun' : lit ? 'Sun still in our sky' : 'Sun gone from our sky';
    D.text(s, msg, b.x0 + b.w / 2, b.y0 + b.h + f2 * 1.0, f2, 0.85 * a, D.sans(f2), lit ? C.light : C.muted);
    if (t > T_V) D.text(s, lit ? 'its pull: still acting' : 'its pull: gone', b.x0 + b.w / 2, b.y0 + b.h + f2 * 2.3, f2, 0.85 * a, D.sans(f2), lit ? C.force : C.muted);
  }

  function drawReadout(s, t, tau, a) {
    if (a <= 0) return;
    const { fs, phone } = L, x = phone ? 10 : 16, y = phone ? 16 : 22, lh = fs * 1.45;
    const since = tau - TAU_V;
    const l1 = t < T_V ? '' : `time since the Sun vanished: ${fmtT(since)}`;
    if (l1) D.text(s, phone ? `since it vanished: ${fmtT(since)}` : l1, x, y, fs, a, D.sans(fs, 600), C.text, 'left');
    D.text(s, fmtRate(rate(t)), x, l1 ? y + lh : y, fs - 1, 0.75 * a, D.sans(fs - 1), C.muted, 'left');
  }

  function endCard(s, t) {
    const a = fade(t, END, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 40, 15, 26)), s3 = Math.round(clamp(W / 60, 12, 17));
    g.font = D.sans(s1, 300);
    const head = D.wrap(s, 'If the Sun vanished', W - 48);
    let y = H * (phone ? 0.13 : 0.18);
    D.text(s, head, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * head.length + s2 * 0.6;
    const items = [
      ['v = 2πr ÷ T', C.vel, 'The Earth moves at about 30 km s⁻¹; the Sun\'s pull provides the centripetal force.'],
      ['r ÷ c = 500 s', C.light, 'Light, and changes in gravity, take 8 minutes 20 seconds to reach us from the Sun.'],
      ['F = 0, so a = 0', C.force, 'With no force, each planet moves off in a straight line at constant speed: Newton\'s first law.'],
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
    D.text(s, D.wrap(s, 'A thought experiment: the Sun can\'t really vanish. Circular orbits; the planets\' pulls on each other are left out. Sizes, and the Moon\'s distance, are far bigger than to scale. That changes in gravity travel at c is beyond the syllabus.', Math.min(W - 40, 760)), W / 2, Math.max(y, H * 0.76), s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('sunvanish', {
    duration: DURATION,
    poster: 66,
    // score: a quiet emptiness (D minor, very low sine pad, a deep drone, a lot of wind)
    music: { chords: [[38, 45, 50, 53], [34, 41, 46, 50], [36, 43, 48, 51], [33, 40, 45, 48]], bar: 12, pad: 'sine', cutoff: 600, drone: 0.13, wind: 0.55, shimmer: 0.15, tremolo: 0.07, volume: 0.37 },
    resize: layout,
    info: {
      CAPS, PL, TAU_V, tauAt, tOfTau, rate, planetAt,
      check() {
        const out = {
          vEarth: EARTH.v, vFromGM: Math.sqrt(GM / AU), gSunAtEarth: GM / AU ** 2, v2r: EARTH.v ** 2 / AU,
          lightTime: LIGHT_AU, fastRate: FAST, onScreenYear: YEAR / FAST,
        };
        out.planets = PL.map((p) => ({ name: p.name, a: p.a, Tyears: +(p.T / YEAR).toFixed(3), vkms: +(p.v / 1000).toFixed(1),
          newsSeconds: Math.round(p.rel), newsMinutes: +(p.rel / 60).toFixed(1), sceneTime: +p.tRel.toFixed(2) }));
        out.capRates = CAPS.map(([a, b, txt]) => +(txt.length / (b - a)).toFixed(1));
        out.rates = [30, 41, 50, 77, 80, 90, 106, 110].map((tt) => [tt, Math.round(rate(tt))]);
        // the Earth's path after release is straight: three points on a line, at constant speed
        const tr = TAU_V + EARTH.rel, p1 = planetAt(EARTH, tr + 1e6), p2 = planetAt(EARTH, tr + 2e6), p0 = planetAt(EARTH, tr);
        out.straight = { cross: (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x), speed: Math.hypot(p2.x - p1.x, p2.y - p1.y) * AU / 1e6 };
        return out;
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      const tau = tauAt(t);
      D.background(s, 0.12);
      const { g, W, H } = s;
      for (let i = 0; i < 90; i++) {
        const sx = ((i * 9301 + 49297) % 233280) / 233280 * W, sy = ((i * 4096 + 150889) % 714025) / 714025 * H;
        g.fillStyle = `rgba(220,230,255,${0.22 + 0.15 * Math.sin(s.clock * 0.6 + i)})`; g.fillRect(sx, sy, 1.2, 1.2);
      }
      drawSystem(s, t, tau);
      drawSky(s, t, tau, fade(t, 5.5, 80.5, 1, 1));
      drawReadout(s, t, tau, smooth((t - 5.0) / 0.9) * (1 - smooth((t - END) / 0.8)));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.82 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'If the Sun vanished', 'What would happen to the Earth, and when?');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
