/* How does GPS work? (A.1 speed = distance ÷ time, C.2 electromagnetic waves, D.1 orbits; (HL) A.5 time dilation;
   the gravitational effect on clocks is beyond the course, as in Think deeper BQ-18.)
   The data booklet's constants: c = 3.00 × 10⁸ m s⁻¹, G = 6.67 × 10⁻¹¹ N m² kg⁻², M = 5.97 × 10²⁴ kg, R = 6.37 × 10⁶ m.
   A flat picture (one plane through the Earth's centre, the receiver and three satellites), all lengths in km:
     orbit radius r = 6370 + 20 200 = 26 570 km; receiver P on the surface; satellites at 42° to the left (1),
     overhead (2) and 38° to the right (3), measured at the Earth's centre.
     distances |S − P| = √(r² + R² − 2rR cos θ): 2 → 20 200 km (67.33 ms); 1 → 22 248 km (74.16 ms); 3 → 21 904 km (73.01 ms)
     (travel time = distance ÷ c, with c = 3.00 × 10⁵ km s⁻¹); the furthest, at the horizon, √(r² − R²) = 25 795 km, 86.0 ms.
   The circles are exact: each is drawn round its satellite with radius c × (measured travel time); their crossings are
   computed (circle–circle intersection). Two circles cross at P and at a second point 43 700 km from the Earth's centre,
   far out in space (off the picture). With the receiver's clock 10 ms fast, every measured time is 10 ms too long, so every
   radius is 10 × 10⁻³ × 3.00 × 10⁵ = 3000 km too big and the three circles no longer meet at one point; reducing the clock
   correction to 0 shrinks all three together until they meet at P. 1 μs of clock error = 1 × 10⁻⁶ × 3.00 × 10⁸ = 300 m.
   Relativity (per day, 86 400 s), recalculated in info.check():
     orbital speed v = √(GM/r) = √(3.982 × 10¹⁴ ÷ 2.657 × 10⁷) = 3871 m s⁻¹ (3.87 km s⁻¹); period 2πr/v = 43 130 s ≈ 12 h
     (HL) time dilation: γ − 1 = 8.33 × 10⁻¹¹ (≈ v²/2c²), so the satellite clock loses 86 400 × 8.33 × 10⁻¹¹ = 7.19 μs a day
     (beyond the course) higher in the field: GM(1/R − 1/r)/c² = 3.982 × 10¹⁴ × 1.1935 × 10⁻⁷ ÷ 9.00 × 10¹⁶ = 5.281 × 10⁻¹⁰,
       × 86 400 = 45.6 μs a day gained
     overall 45.6 − 7.2 = 38.4 μs a day gained, worth 38.4 × 10⁻⁶ × 3.00 × 10⁸ = 11.5 km of distance a day;
     as a fraction 38.4 × 10⁻⁶ ÷ 86 400 = 4.4 × 10⁻¹⁰; the real setting (from the more precise 38.5 μs) is 4.465 × 10⁻¹⁰,
     "about 4.5 parts in 10¹⁰" in the caption.
   The wrong position with a 10 ms clock error (circles 1 and 2) is about 2650 km below the surface (info.check: wrongDepthKm).
   Signals are shown slowed down 100 times (67.33 ms takes 6.7 s). Every frame is drawn from the scene time alone. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const NB = ' ';

  // ---------- the physics ----------
  const CKM = 3.00e5, RE = 6370, ALT = 20200, RO = RE + ALT;                 // km s⁻¹, km
  const G = 6.67e-11, ME = 5.97e24, CM = 3.00e8, GM = G * ME, RM = RE * 1e3, ROM = RO * 1e3;
  const VORB = Math.sqrt(GM / ROM), TORB = 2 * Math.PI * ROM / VORB;
  const GAMMA1 = 1 / Math.sqrt(1 - (VORB / CM) ** 2) - 1;
  const DAY = 86400, LOSE = GAMMA1 * DAY * 1e6, GAIN = GM * (1 / RM - 1 / ROM) / (CM * CM) * DAY * 1e6, NET = GAIN - LOSE;
  const NET_KM = NET * 1e-6 * CM / 1000, FRAC = NET * 1e-6 / DAY;
  const SLOW = 100;                                                           // signals shown 100 times slower
  const P = [0, RE];
  const SATS = [
    { n: '1', deg: -42, rgb: '111,211,154' },
    { n: '2', deg: 0, rgb: '143,184,255' },
    { n: '3', deg: 38, rgb: '255,140,190' },
  ].map((o) => {
    const a = o.deg * Math.PI / 180, S = [RO * Math.sin(a), RO * Math.cos(a)];
    const d = Math.hypot(S[0] - P[0], S[1] - P[1]);
    return { ...o, S, d, tt: d / CKM };
  });
  const [S1, S2, S3] = SATS;
  // circle–circle intersection (centres a, b; radii ra, rb): both points, or null
  const cross = (a, ra, b, rb) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
    const x = (ra * ra - rb * rb + d * d) / (2 * d), h2 = ra * ra - x * x;
    if (h2 < 0) return null;
    const h = Math.sqrt(h2), mx = a[0] + x * dx / d, my = a[1] + x * dy / d;
    return [[mx - h * dy / d, my + h * dx / d], [mx + h * dy / d, my - h * dx / d]];
  };
  const nearer = (pts, q) => pts && pts.reduce((m, p) => (Math.hypot(p[0] - q[0], p[1] - q[1]) < Math.hypot(m[0] - q[0], m[1] - q[1]) ? p : m));
  const FAR = nearer(cross(S1.S, S1.d, S2.S, S2.d), [0, 1e9]);               // the other crossing of circles 1 and 2: far out in space

  // ---------- captions (at most 15 characters a second while fully shown) ----------
  const ms = (x) => (x * 1000).toFixed(1);
  const TXT = [
    `About 30 GPS satellites orbit the Earth, 20${NB}200${NB}km up. Each one carries an extremely accurate atomic clock.`,
    'Each satellite keeps sending out radio signals: "I am satellite 2, this is where I am, and this is the time I sent this."',
    `Radio waves are electromagnetic waves, so they travel at the speed of light, c${NB}=${NB}3.00${NB}×${NB}10⁸${NB}m${NB}s⁻¹ (C.2).`,
    `From the satellite overhead, a signal takes 2.02${NB}×${NB}10⁷${NB}m ÷ 3.00${NB}×${NB}10⁸${NB}m${NB}s⁻¹ = 0.0673${NB}s, or 67.3${NB}ms. Here signals are slowed down 100 times.`,
    `Your phone notes when each signal arrives. Distance = speed × time, so you are 20${NB}200${NB}km from satellite 2.`,
    'So you are somewhere on a circle round satellite 2 (in 3D, on a sphere).',
    `The signal from satellite 1 takes ${ms(S1.tt)}${NB}ms, so you are 22${NB}200${NB}km from it. The two circles cross at two points.`,
    'One crossing point is far out in space, so you must be at the other. In 3D, it takes three spheres to do this.',
    'Predict: your phone has a cheap quartz clock, not an atomic clock. What happens if it is slightly wrong?',
    `Suppose it is 10${NB}ms fast. Every signal seems to take 10${NB}ms longer, so every distance comes out 3000${NB}km too big.`,
    `The circles still cross, but in the wrong place: underground! Each microsecond of error is 1${NB}×${NB}10⁻⁶${NB}s × 3.00${NB}×${NB}10⁸${NB}m${NB}s⁻¹ = 300${NB}m.`,
    'A third satellite gives the error away: its circle does not pass through the same point.',
    'So the receiver adjusts its own clock, shrinking all the circles together, until all three meet at one point.',
    'That point is where you are, and the receiver now knows the exact time too. In 3D this needs at least four satellites.',
    `One more correction: relativity. Gravity provides the centripetal force (D.1): v${NB}=${NB}√(GM/r) = 3.87${NB}km${NB}s⁻¹, once round about every 12 hours.`,
    `(HL) Moving clocks run slow (time dilation, A.5), so the satellite clocks lose about ${LOSE.toFixed(1)}${NB}μs a day.`,
    `(Beyond the course) Clocks higher up in the Earth's gravitational field run faster: they gain about ${GAIN.toFixed(1)}${NB}μs a day.`,
    `Overall a satellite clock gains ${NET.toFixed(1)}${NB}μs a day. Left alone, the satellites would drift out of step with ground time by that much every day: light travels ${NET_KM.toFixed(1)}${NB}km in that time.`,
    `So the satellite clocks are set to tick slow, by about 4.5 parts in 10¹⁰, before launch. Then GPS can find you to within a few metres.`,
  ];
  const T0 = 4.8, GAP = 0.2, RATE = 15;
  const CAPS = []; {
    let t = T0;
    for (const txt of TXT) {
      let d = Math.max(4.6, txt.length / RATE + 1.2);
      if (txt.startsWith('Predict')) d += 6;
      CAPS.push([+t.toFixed(2), +(t + d).toFixed(2), txt]); t += d + GAP;
    }
  }
  const CA = (i) => CAPS[i][0];
  const T_SIG = CA(1), T_C2 = CA(5), T_C1 = CA(6), T_FAR = CA(7), T_ERR = CA(9), T_C3 = CA(11), T_FIX = CA(12), T_FOUND = CA(13);
  const T_REL = CA(14), T_LOSE = CA(15), T_GAIN = CA(16), T_NET = CA(17), T_CORR = CA(18);
  const END = CAPS[CAPS.length - 1][1] + 0.4, DURATION = END + 12;
  const ERR = 0.010;                                                          // the receiver's clock error, s
  const errAt = (t) => ERR * (smooth((t - T_ERR - 0.8) / 1.6) - smooth((t - T_FIX - 0.6) / 6.0));
  const DAY_S = 8;                                                            // one day every 8 s in the relativity part

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25)), capTop = H - capFs * (phone ? 6.6 : 5.4);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    const cx = phone ? W / 2 : W * 0.4;
    const yP = capTop - fs * (phone ? 4.2 : 4.6);
    const topY = phone ? fs * 10.6 : Math.max(60, H * 0.13);                  // phones: readouts above the satellites
    const halfW = phone ? W / 2 - fs * 2.2 : Math.min(cx - fs * 2, W * 0.68 - cx - fs * 2);
    const k = Math.min((yP - topY) / ALT, halfW / (RO * Math.sin(42 * Math.PI / 180)));
    const yE = yP + RE * k;
    const py0 = phone ? 8 : Math.max(60, H * 0.14);                           // a box just tall enough for its rows
    const panel = phone ? { x0: 10, x1: W - 10, y0: py0, y1: py0 + fs * (0.3 + 5 * 1.35) } : { x0: W * 0.7, x1: W - Math.max(12, W * 0.025), y0: py0, y1: py0 + fs * (0.3 + 6 * 1.55) };
    L = { W, H, phone, capFs, capTop, fs, cx, yP, yE, k, panel };
  }
  const X = (x) => L.cx + x * L.k, Y = (y) => L.yE - y * L.k;

  function satellite(s, x, y, rgb, a, size) {
    if (a <= 0) return;
    const { g } = s;
    g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(70,90,150,1)'; g.strokeStyle = 'rgba(170,190,240,1)'; g.lineWidth = 1;
    g.fillRect(x - size * 2.2, y - size * 0.35, size * 1.4, size * 0.7); g.strokeRect(x - size * 2.2, y - size * 0.35, size * 1.4, size * 0.7);
    g.fillRect(x + size * 0.8, y - size * 0.35, size * 1.4, size * 0.7); g.strokeRect(x + size * 0.8, y - size * 0.35, size * 1.4, size * 0.7);
    g.fillStyle = `rgba(${rgb},1)`; g.fillRect(x - size * 0.6, y - size * 0.6, size * 1.2, size * 1.2);
    g.restore();
  }
  function receiver(s, x, y, a, size) {
    const { g } = s; if (a <= 0) return;
    g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(30,34,50,1)'; g.strokeStyle = 'rgba(236,240,255,1)'; g.lineWidth = 1.4;
    g.beginPath(); g.roundRect(x - size * 0.45, y - size * 1.6, size * 0.9, size * 1.6, size * 0.15); g.fill(); g.stroke();
    g.fillStyle = 'rgba(111,211,154,0.9)'; g.fillRect(x - size * 0.32, y - size * 1.42, size * 0.64, size * 1.1);
    g.restore();
  }

  // ---------- the picture: Earth, orbit, satellites, signals, circles ----------
  function drawScene(s, t, A) {
    if (A <= 0) return;
    const { g } = s, { k, fs, phone, yE, cx, W } = L;
    // the orbit and the Earth
    g.setLineDash([3, 6]); g.strokeStyle = `rgba(170,182,220,${0.3 * A})`; g.lineWidth = 1;
    g.beginPath(); g.arc(cx, yE, RO * k, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    const rg = g.createRadialGradient(cx, yE - RE * k * 0.4, RE * k * 0.1, cx, yE, RE * k);
    rg.addColorStop(0, `rgba(60,120,200,${A})`); rg.addColorStop(1, `rgba(24,52,110,${A})`);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = rg; g.beginPath(); g.arc(cx, yE, RE * k, 0, Math.PI * 2); g.fill();
    D.glowLine(s, Array.from({ length: 97 }, (_, i) => [cx + RE * k * Math.cos(i / 96 * 2 * Math.PI), yE + RE * k * Math.sin(i / 96 * 2 * Math.PI)]), '110,170,255', 0.6 * A, 1.4);
    D.text(s, phone ? 'GPS orbit' : `GPS orbit, 20${NB}200${NB}km up`, X(RO * Math.sin(-24 * Math.PI / 180)), Y(RO * Math.cos(-24 * Math.PI / 180)) - fs * 0.9, fs - 1, 0.7 * A * fade(t, 4.6, T_C2, 1, 1), D.sans(fs - 1), C.muted);
    D.text(s, 'Earth', cx - RE * k * 0.3, yE - RE * k * 0.55, fs, 0.6 * A, D.sans(fs), '200,220,255', 'right');

    // the circles: radius = c × measured time = true distance + c × clock error
    const e = errAt(t), extra = e * CKM;
    const circ = [[S2, T_C2], [S1, T_C1], [S3, T_C3]];
    for (const [sat, from] of circ) {
      const ca = A * smooth((t - from) / 1.0);
      if (ca <= 0) continue;
      const rr = (sat.d + extra) * k;
      g.globalCompositeOperation = 'lighter'; g.lineWidth = 2;
      g.strokeStyle = `rgba(${sat.rgb},${0.75 * ca})`; g.beginPath(); g.arc(X(sat.S[0]), Y(sat.S[1]), rr, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = `rgba(${sat.rgb},${0.15 * ca})`; g.lineWidth = 7; g.stroke();
      g.globalCompositeOperation = 'source-over';
    }
    // where circles 1 and 2 cross (the calculated position), and circle 3's crossings with them
    const c12 = t > T_C1 + 0.6 ? nearer(cross(S1.S, S1.d + extra, S2.S, S2.d + extra), P) : null;
    if (c12) {
      const ok = extra < 30;
      const ma = A * smooth((t - T_C1 - 0.6) / 0.8);
      const px = X(c12[0]), py = Y(c12[1]);
      g.strokeStyle = `rgba(${ok ? C.good : '255,120,120'},${ma})`; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(px - 6, py - 6); g.lineTo(px + 6, py + 6); g.moveTo(px + 6, py - 6); g.lineTo(px - 6, py + 6); g.stroke();
      if (!ok) D.text(s, 'calculated position', px + fs * 0.8, py + fs * 0.3, fs, ma, D.sans(fs, 600), '255,140,140', 'left');
    }
    if (t > T_C3 + 0.6 && extra > 30) {
      const ma = A * smooth((t - T_C3 - 0.6) / 0.8);
      for (const other of [S1, S2]) {
        const q = nearer(cross(S3.S, S3.d + extra, other.S, other.d + extra), P);
        if (q) D.glowDot(s, X(q[0]), Y(q[1]), 8, '255,140,190', ma);
      }
    }
    // the other crossing of circles 1 and 2: far out in space, off the top of the picture
    const fa = A * fade(t, T_FAR, T_ERR, 0.8, 0.8);
    if (fa > 0) {
      // an arrow near the top of the picture, on the line from you towards that point
      const top = phone ? L.panel.y1 + fs * 1.6 : 34;
      const px = X(P[0]), py = Y(P[1]), dx = X(FAR[0]) - px, dy = Y(FAR[1]) - py, dl = Math.hypot(dx, dy), ux = dx / dl, uy = dy / dl;
      const l1 = (top + 30 - py) / uy, l2 = (top - py) / uy;
      D.arrow(s, px + l1 * ux, top + 30, px + l2 * ux, top, C.light, fa, '', { head: 8, width: 2 });
      D.text(s, phone ? 'other crossing: far out in space' : 'the other crossing point: far out in space, off the picture', px + l2 * ux + fs * 0.9, top + fs * 0.3, fs - 1, fa, D.sans(fs - 1), C.light, 'left');
    }

    // the satellites and their signals (dots travelling at c, slowed down 100 times)
    const size = Math.max(4, fs * 0.45);
    for (const [i, sat] of SATS.entries()) {
      const sx = X(sat.S[0]), sy = Y(sat.S[1]);
      if (t > T_SIG) {
        const trip = sat.tt * SLOW, first = T_SIG + i * 0.8;
        for (let n = Math.max(0, Math.floor((t - first - trip) / 2.5)); ; n++) {
          const te = first + n * 2.5; if (te > t) break;
          const f = (t - te) / trip;
          if (f > 1) { const fl = 1 - (f - 1) * trip / 0.6; if (fl > 0) D.glowDot(s, X(P[0]), Y(P[1]) - fs * 0.9, 14, sat.rgb, 0.7 * A * fl); continue; }
          const x = lerp(sx, X(P[0]), f), y = lerp(sy, Y(P[1]) - fs * 0.9, f), x0 = lerp(sx, X(P[0]), Math.max(0, f - 0.06)), y0 = lerp(sy, Y(P[1]) - fs * 0.9, Math.max(0, f - 0.06));
          D.glowLine(s, [[x0, y0], [x, y]], sat.rgb, 0.8 * A, 1.6);
          D.glowDot(s, x, y, 7, sat.rgb, A);
        }
      }
      satellite(s, sx, sy, sat.rgb, A, size);
      D.text(s, sat.n, sx, sy - size * 1.9, fs + 1, A, D.sans(fs + 1, 700), sat.rgb);
    }
    receiver(s, X(P[0]), Y(P[1]), A, Math.max(8, fs * 0.8));
    D.text(s, 'you', X(P[0]) + fs * 1.1, Y(P[1]) - fs * 0.7, fs, A, D.sans(fs, 600), C.text, 'left');
    if (t > T_FOUND && t < T_REL + 1) D.text(s, 'found!', X(P[0]) - fs * 1.1, Y(P[1]) - fs * 0.7, fs, A * fade(t, T_FOUND, T_REL, 0.6, 0.8), D.sans(fs, 600), C.good, 'right');
  }

  // ---------- the readouts (right on wide screens, at the top on phones) ----------
  function drawReadouts(s, t, A) {
    if (A <= 0) return;
    const { g } = s, { panel: p, fs, phone } = L;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(14,20,44,${0.78 * A})`; g.beginPath(); g.roundRect(p.x0 - 6, p.y0 - 4, p.x1 - p.x0 + 12, p.y1 - p.y0 + 8, 10); g.fill();
    const e = errAt(t), lh = fs * (phone ? 1.35 : 1.55);
    let y = p.y0 + fs * 0.8;
    const row = (txt, rgb, a, w = 400) => { if (a > 0) D.text(s, txt, p.x0, y, fs, a * A, D.sans(fs, w), rgb, 'left'); y += lh; };
    row(phone ? 'signals slowed down 100×' : 'signals shown 100 times slower', C.muted, smooth((t - CA(3)) / 0.8));
    const order = [[S2, CA(3)], [S1, T_C1], [S3, T_C3]];
    for (const [sat, from] of order) {
      const tm = sat.tt + e, dkm = tm * CKM;
      const txt = `from ${sat.n}: ${(tm * 1000).toFixed(1)}${NB}ms → ${(Math.round(dkm / 100) * 100).toLocaleString('en-GB').replace(/,/g, NB)}${NB}km`;
      row(txt, sat.rgb, smooth((t - from) / 0.8), 600);
    }
    const ea = smooth((t - T_ERR) / 0.8);
    row(`your clock: ${e * 1000 >= 0.05 ? '+' : ''}${(e * 1000).toFixed(1)}${NB}ms out`, e * 1000 >= 0.05 ? '255,140,140' : C.good, ea, 600);
    if (!phone) row(`each 1${NB}μs out = 300${NB}m`, C.muted, smooth((t - CA(10)) / 0.8));
  }

  // ---------- relativity ----------
  function drawRelativity(s, t, A) {
    if (A <= 0) return;
    const { g } = s, { W, capTop, fs, phone } = L;
    const days = Math.max(0, t - T_REL - 1) / DAY_S, f2 = fs + (phone ? 0 : 1), bh = fs * 1.1, rowH = bh * 3.1;
    const bw = Math.min(W - 24, phone ? W - 20 : 560), x0 = (W - bw) / 2, y0 = phone ? 16 : Math.max(58, capTop * 0.15);
    const y1 = y0 + f2 * 4.4 + 3 * rowH + f2 * 3.6;                                // just tall enough for its contents
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(14,20,44,${0.9 * A})`; g.beginPath(); g.roundRect(x0, y0, bw, y1 - y0, 12); g.fill();
    let y = y0 + f2 * 1.3;
    D.text(s, 'a satellite clock compared with a clock on the ground', W / 2, y, f2, A, D.sans(f2, 600), C.text); y += f2 * 1.5;
    D.text(s, `time passing: ${days.toFixed(1)} days (speeded up: one day every ${DAY_S}${NB}s)`, W / 2, y, fs, 0.8 * A, D.sans(fs), C.muted); y += f2 * 1.6;
    // bars: μs gained per day, from a zero line; each label on its own line above its bar
    const zx = x0 + bw * (phone ? 0.3 : 0.42), sc = bw * (phone ? 0.34 : 0.32) / 50, lx = x0 + Math.max(12, bw * 0.04);
    const bars = [
      [-LOSE, '255,170,85', phone ? '(HL) its speed: time dilation' : '(HL) its speed: time dilation (A.5)', T_LOSE],
      [GAIN, '111,211,154', 'higher in the gravitational field (beyond the course)', T_GAIN],
      [NET, '255,214,102', 'overall', T_NET],
    ];
    const za = A * smooth((t - T_LOSE) / 0.8);
    D.text(s, '0', zx, y + 2 * rowH + bh * 1.5 + bh * 0.85 + fs * 0.55, fs - 1, 0.7 * za, D.sans(fs - 1), C.muted);   // under the last bar
    for (const [v, rgb, lab, from] of bars) {
      const a = A * smooth((t - from) / 0.8), len = v * sc * smooth((t - from) / 1.4), yb = y + bh * 1.5;
      D.line(s, zx, yb - bh * 0.85, zx, yb + bh * 0.85, C.muted, 0.6 * za, 1);
      if (a > 0) {
        D.text(s, lab, lx, y + bh * 0.2, fs - 1, 0.85 * a, D.sans(fs - 1), C.muted, 'left');
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = `rgba(${rgb},${0.85 * a})`; g.fillRect(Math.min(zx, zx + len), yb - bh / 2, Math.abs(len), bh);
        const val = `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}${NB}μs a day`;
        D.text(s, val, v > 0 ? zx + len + 6 : zx + len - 6, yb, fs, a, D.sans(fs, 600), rgb, v > 0 ? 'left' : 'right');
      }
      y += rowH;
    }
    // the build-up of error, uncorrected, then corrected before launch
    const na = A * smooth((t - T_NET - 1.5) / 0.8);
    if (na > 0) {
      const us = NET * days, km = us * 1e-6 * CM / 1000;
      const ca = smooth((t - T_CORR - 0.8) / 0.8);
      y += f2 * 1.0;
      D.text(s, `uncorrected: ${us.toFixed(0)}${NB}μs ahead, worth ${km.toFixed(0)}${NB}km`, W / 2, y, f2, na * (1 - 0.6 * ca), D.sans(f2, 600), '255,140,140');
      y += f2 * 1.5;
      D.text(s, 'set to tick slow before launch: 0 μs, 0 km', W / 2, y, f2, A * ca, D.sans(f2, 600), C.good);
    }
  }

  function endCard(s, t) {
    const a = fade(t, END, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 40, 15, 26)), s3 = Math.round(clamp(W / 60, 12, 17));
    g.font = D.sans(s1, 300);
    const head = D.wrap(s, 'How GPS finds you', W - 48);
    let y = H * (phone ? 0.13 : 0.18);
    D.text(s, head, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * head.length + s2 * 0.6;
    const items = [
      ['distance = c × t', '143,184,255', 'Each signal\'s travel time gives your distance from that satellite.'],
      ['four satellites', '111,211,154', 'Three for your position in 3D, one more for your receiver\'s clock error.'],
      ['+38 μs a day', '255,214,102', 'Relativity: the satellite clocks are set to tick slow to make up for it.'],
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
    D.text(s, D.wrap(s, 'A flat picture of a 3D system: the Earth and the orbit are to scale, the satellites and the phone are not. Signals are shown 100 times slower than real.', Math.min(W - 40, 760)), W / 2, Math.max(y, H * 0.78), s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('gps', {
    duration: DURATION,
    poster: CA(11) + 2,
    // score: signals from orbit (C-sharp minor, low: a soft sine pad, a deep drone, wind and a faint shimmer)
    music: { chords: [[37, 44, 49, 53], [42, 49, 54, 58], [39, 46, 51, 54], [44, 51, 56, 60]], bar: 10, pad: 'sine', cutoff: 650, drone: 0.12, wind: 0.35, shimmer: 0.2, tremolo: 0.1, volume: 0.37 },
    resize: layout,
    info: {
      CAPS, SATS, FAR, errAt, cross,
      check() {
        const out = {
          r: RO, dists: SATS.map((x) => ({ n: x.n, km: +x.d.toFixed(1), ms: +(x.tt * 1000).toFixed(2) })),
          horizonMs: +(Math.sqrt(RO * RO - RE * RE) / CKM * 1000).toFixed(1), farFromCentreKm: +Math.hypot(FAR[0], FAR[1]).toFixed(0),
          vOrbit: VORB, periodH: TORB / 3600, gamma1: GAMMA1, loseUs: LOSE, gainUs: GAIN, netUs: NET, netKm: NET_KM, frac: FRAC,
          usToM: 1e-6 * CM, errKm: ERR * CKM, realFrac: 38.5e-6 / DAY,
        };
        out.crossNoErr = cross(S1.S, S1.d, S2.S, S2.d).map((q) => q.map((v) => +v.toFixed(2)));
        out.wrongPos = nearer(cross(S1.S, S1.d + ERR * CKM, S2.S, S2.d + ERR * CKM), P).map((v) => +v.toFixed(0));
        out.wrongDepthKm = +(RE - Math.hypot(...out.wrongPos)).toFixed(0);
        out.capRates = CAPS.map(([a, b, txt]) => +(txt.length / (b - a - 1.2)).toFixed(1));
        return out;
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.2);
      const { g, W, H } = s;
      for (let i = 0; i < 80; i++) {
        const sx = ((i * 9301 + 49297) % 233280) / 233280 * W, sy = ((i * 4096 + 150889) % 714025) / 714025 * H;
        g.fillStyle = `rgba(220,230,255,${0.2 + 0.18 * Math.sin(s.clock * 0.7 + i)})`; g.fillRect(sx, sy, 1.2, 1.2);
      }
      const relA = smooth((t - T_REL) / 1.2);
      drawScene(s, t, smooth((t - 4.4) / 0.9) * (1 - 0.7 * relA) * (1 - smooth((t - END) / 0.8)));
      drawReadouts(s, t, smooth((t - CA(3)) / 0.9) * (1 - relA));
      drawRelativity(s, t, relA * (1 - smooth((t - END) / 0.8)));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'How does GPS work?', 'Finding where you are from how long radio signals take to arrive');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
