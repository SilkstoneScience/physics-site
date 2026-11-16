/* D.3 Charges in electric and crossed fields: an electron deflected between parallel plates, a velocity
   selector (crossed E and B), then ions sorted by charge-to-mass ratio in a magnetic field alone.
   Every path is the exact solution of F = qE + qv × B (uniform fields, vacuum, gravity negligible, no edge effects).

   Numbers (recalculated by info.check(); e = 1.60 × 10⁻¹⁹ C, mₑ = 9.110 × 10⁻³¹ kg, u = 1.661 × 10⁻²⁷ kg, data booklet):
   Part 1, an electron between plates 2.5 cm apart with 300 V, 6.0 cm long, entering at u = 2.0 × 10⁷ m s⁻¹:
     E = V/d = 300 ÷ 0.025 = 1.2 × 10⁴ V m⁻¹;  a = eE/m = 1.60e-19 × 1.2e4 ÷ 9.110e-31 = 2.108 × 10¹⁵ m s⁻² (2.1 × 10¹⁵)
     t = 0.060 ÷ 2.0e7 = 3.0 × 10⁻⁹ s;  y = ½at² = 0.5 × 2.108e15 × 9.0e-18 = 9.49 × 10⁻³ m (9.5 mm)
     weight / electric force = 9.110e-31 × 9.8 ÷ (1.60e-19 × 1.2e4) = 4.6 × 10⁻¹⁵ (negligible)
     twice as fast (4.0 × 10⁷): t = 1.5 ns, y = 9.49 ÷ 4 = 2.37 mm (2.4 mm)
     slowed down 10⁹ times (1 ns of real time takes 1 s).
   Part 2, a velocity selector: plates 2.0 cm apart with 800 V, 12 cm long, B = 0.25 T into the page:
     E = 800 ÷ 0.020 = 4.0 × 10⁴ V m⁻¹;  v = E/B = 4.0e4 ÷ 0.25 = 1.6 × 10⁵ m s⁻¹
     neon-20 ion (20 u = 3.322 × 10⁻²⁶ kg, charge +e): ω = qB/m = 1.204 × 10⁶ rad s⁻¹
     with speed v ≠ E/B the path is x = (E/B)τ + ((v − E/B)/ω) sin ωτ, y = ((v − E/B)/ω)(1 − cos ωτ)
     1.5 × E/B: hits the top plate (y = +1.0 cm) at x = 10.9 cm;  0.5 × E/B: hits the bottom plate at x = 3.9 cm
     only ions within about −1.9% to +2.0% of E/B leave through the 2 mm slit (|y| < 1 mm at x = 12 cm)
     slowed down 4.0 × 10⁶ times (crossing the selector, 0.75 μs, takes 3.0 s).
   Part 3, a magnetic field alone, B = 0.50 T into the page:
     neon-20: r = mv/qB = 3.322e-26 × 1.6e5 ÷ (1.60e-19 × 0.50) = 0.0664 m (6.6 cm), lands 2r = 13.3 cm from the slit
     neon-22 (22 u = 3.654 × 10⁻²⁶ kg): r = 0.0731 m (7.3 cm), lands 14.6 cm from the slit; 22/20 = 1.10, 10% bigger
     natural neon: 90.5% neon-20, 9.3% neon-22, 0.3% neon-21 (so about 9 in 10 atoms are neon-20). */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- constants (SI) ----------
  const QE = 1.60e-19, ME = 9.110e-31, U = 1.661e-27;
  // part 1
  const V1 = 300, D1 = 0.025, L1 = 0.060, E1 = V1 / D1, A1 = QE * E1 / ME, GUN = -0.025, SCREEN = 0.10;
  const U1 = 2.0e7, U2 = 4.0e7, K1 = 1e9;                       // K1: scene seconds per real second
  // parts 2 and 3
  const V2 = 800, D2 = 0.020, LS = 0.120, E2 = V2 / D2, B2 = 0.25, VD = E2 / B2, B3 = 0.50, SLIT = 0.001, XS = -0.015;
  const M20 = 20 * U, M22 = 22 * U, K2 = 4.0e6;

  // ---------- part 1: the electron's path (x along the plates from their start, y up, metres) ----------
  const e1Y = (x, u) => (x <= 0 ? 0 : x <= L1 ? A1 * x * x / (2 * u * u) : A1 * L1 * L1 / (2 * u * u) + (A1 * L1 / (u * u)) * (x - L1));
  const e1Slope = (x, u) => (x <= 0 ? 0 : x <= L1 ? A1 * x / (u * u) : A1 * L1 / (u * u));
  // x at real time τ after leaving the gun (the speed along the plates never changes)
  const e1X = (tau, u) => Math.min(GUN + u * tau, SCREEN);

  // ---------- parts 2 and 3: an ion's path ----------
  // Leaves the source slit at XS moving along +x at speed v; field-free to x = 0; crossed fields to x = LS
  // (cycloid, exact); then either hits a plate or the slit plate, or (in the chamber, part 3) a semicircle in B3.
  function ion(v, m, chamber) {
    const w = QE * B2 / m, R = (v - VD) / w, t0 = -XS / v;
    const sx = (tau) => VD * tau + R * Math.sin(w * tau), sy = (tau) => R * (1 - Math.cos(w * tau));
    // time to reach x = LS (x increases steadily because 0 < v < 2E/B)
    let lo = 0, hi = 4 * LS / VD;
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (sx(mid) < LS) lo = mid; else hi = mid; }
    let tEnd = hi, end = 'slit';
    // does it hit a plate first?
    const half = D2 / 2, N = 2000;
    for (let i = 1; i <= N; i++) {
      const tau = tEnd * i / N;
      if (Math.abs(sy(tau)) >= half) {
        let a = tEnd * (i - 1) / N, b = tau;
        for (let k = 0; k < 50; k++) { const mid = (a + b) / 2; if (Math.abs(sy(mid)) < half) a = mid; else b = mid; }
        tEnd = b; end = 'plate'; break;
      }
    }
    if (end === 'slit' && Math.abs(sy(tEnd)) > SLIT) end = 'blocked';
    const o = { v, m, w, R, t0, tEnd, end, sx, sy, chamber, pass: end === 'slit' };
    if (o.pass && chamber) {
      const vx = VD + (v - VD) * Math.cos(w * tEnd), vy = (v - VD) * Math.sin(w * tEnd), sp = Math.hypot(vx, vy);
      const r = m * sp / (QE * B3), w3 = QE * B3 / m, p0 = [LS, sy(tEnd)];
      const c = [p0[0] - r * vy / sp, p0[1] + r * vx / sp];                   // the centre: to the left of the velocity
      const f0 = Math.atan2(p0[1] - c[1], p0[0] - c[0]);
      const f1 = -f0 > f0 + 1e-9 ? -f0 : 2 * Math.PI - f0;                    // back on the line x = LS
      Object.assign(o, { r, w3, c, f0, f1, tArc: (f1 - f0) / w3, land: c[1] + r * Math.sin(f1) });
    }
    return o;
  }
  // position (m) and velocity at real time tau after leaving the source; state: 'free' | 'sel' | 'out' | 'arc' | 'hit' | 'land'
  function ionAt(o, tau) {
    if (tau < o.t0) return { x: XS + o.v * tau, y: 0, vx: o.v, vy: 0, st: 'free' };
    const ts = tau - o.t0;
    if (ts < o.tEnd) {
      return { x: o.sx(ts), y: o.sy(ts), vx: VD + (o.v - VD) * Math.cos(o.w * ts), vy: (o.v - VD) * Math.sin(o.w * ts), st: 'sel' };
    }
    const xe = o.sx(o.tEnd), ye = o.sy(o.tEnd);
    if (!o.pass) return { x: xe, y: ye, vx: 0, vy: 0, st: 'hit', since: ts - o.tEnd };
    if (!o.chamber) {                                                        // part 2: carries on a little, then fades
      const vx = VD + (o.v - VD) * Math.cos(o.w * o.tEnd), vy = (o.v - VD) * Math.sin(o.w * o.tEnd), d = ts - o.tEnd;
      return { x: xe + vx * d, y: ye + vy * d, vx, vy, st: 'out', since: d };
    }
    const ta = ts - o.tEnd;
    if (ta < o.tArc) {
      const f = o.f0 + o.w3 * ta, sp = o.r * o.w3;
      return { x: o.c[0] + o.r * Math.cos(f), y: o.c[1] + o.r * Math.sin(f), vx: -sp * Math.sin(f), vy: sp * Math.cos(f), st: 'arc', f };
    }
    return { x: LS, y: o.land, vx: 0, vy: 0, st: 'land', since: ta - o.tArc };
  }
  const ionDone = (o) => o.t0 + o.tEnd + (o.pass && o.chamber ? o.tArc : 0);   // real time of arrival (or of hitting)

  // ---------- timeline (scene seconds) ----------
  const T_E1 = 15.6, T_E2 = 59.6, P1_END = 67.6;
  const P2_ON = 68.6, B_ON = 70.4, P3_CAM = 116.6, END = 160.0, DURATION = 172;
  const PART2 = [
    { t: 79.0, o: ion(VD, M20, false), hl: true, name: 'A' },
    { t: 86.0, o: ion(VD, M20, false), hl: true, name: 'A2' },
    { t: 97.4, o: ion(1.5 * VD, M20, false), hl: true, name: 'B' },
    { t: 103.4, o: ion(0.5 * VD, M20, false), hl: true, name: 'C' },
    { t: 109.0, o: ion(VD, M22, false), hl: true, name: 'D', heavy: true },
  ];
  const H20 = { t: 121.0, o: ion(VD, M20, true), hl: true }, H22 = { t: 130.0, o: ion(VD, M22, true), hl: true, heavy: true };
  // the stream in part 3: a spread of speeds (about 1 in 3 blocked), neon-22 about one in ten (as in natural neon)
  let seed = 31; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const STREAM = [];
  for (let i = 0, t = 138.2; t < 150.9; i++, t += 0.3) {
    const heavy = i % 10 === 6;                                           // 1 in 10
    const passes = i % 3 !== 1;                                           // most of these make it (chosen to show the spots)
    const f = passes ? 1 + (rnd() - 0.5) * 0.016 : (rnd() < 0.5 ? 0.55 + 0.35 * rnd() : 1.07 + 0.45 * rnd());
    STREAM.push({ t, o: ion(f * VD, heavy ? M22 : M20, true), heavy });
  }
  const sceneTau = (it, t) => (t - it.t) / K2;

  // ---------- captions ----------
  const CAPS = [
    [4.8, 11.6, 'Two parallel plates 2.5 cm apart, with 300 V between them. The field is uniform: E = V/d = 300 ÷ 0.025 = 1.2 × 10⁴ V m⁻¹.'],
    [11.8, 17.0, 'An electron enters at right angles to the field, at 2.0 × 10⁷ m s⁻¹. (In a vacuum; its weight is negligible.)'],
    [17.2, 23.2, 'The force on it, F = eE, is constant. It points towards the positive plate, opposite to E, because the electron is negative.'],
    [23.4, 29.0, 'Along the plates there is no force, so that part of the velocity stays the same: the dots, one every 0.5 ns, are evenly spaced along the plates.'],
    [29.2, 34.2, 'Across the plates the acceleration is constant. Like a ball thrown horizontally, the path is a parabola.'],
    [34.4, 40.8, 'a = eE ÷ m = (1.60 × 10⁻¹⁹ × 1.2 × 10⁴) ÷ (9.11 × 10⁻³¹) = 2.1 × 10¹⁵ m s⁻²'],
    [41.0, 48.0, 'Time between the 6.0 cm plates: t = 0.060 ÷ (2.0 × 10⁷) = 3.0 ns. Deflection: y = ½at² = 9.5 mm.'],
    [48.2, 53.4, 'Beyond the plates there is no force, so it carries on in a straight line to the screen.'],
    [53.6, 59.4, 'Predict: a second electron enters twice as fast, at 4.0 × 10⁷ m s⁻¹. How far is it deflected?'],
    [59.6, 67.0, 'It spends half the time between the plates, so it is deflected a quarter as much: y = ½at² = 2.4 mm.'],
    [69.0, 75.0, 'A velocity selector: 800 V across plates 2.0 cm apart (E = 4.0 × 10⁴ V m⁻¹, down) and B = 0.25 T into the page (×).'],
    [75.2, 80.6, 'The fields are crossed: E, B and the ion\'s velocity are all at right angles to each other.'],
    [80.8, 86.0, 'On a positive neon ion, the electric force qE points down. The magnetic force qvB points up (left-hand rule).'],
    [86.2, 92.0, 'At one speed the forces are equal: qE = qvB, so v = E/B = 4.0 × 10⁴ ÷ 0.25 = 1.6 × 10⁵ m s⁻¹. It goes straight through the slit.'],
    [92.2, 97.2, 'Predict: what happens to an ion that is faster than this? And to one that is slower?'],
    [97.6, 103.2, 'Faster: qvB is now bigger than qE, so the ion bends up, towards the magnetic force, and hits the top plate.'],
    [103.4, 109.0, 'Slower: qvB is smaller than qE, so the electric force wins and the ion bends down.'],
    [109.2, 116.0, 'A heavier ion, neon-22, at the same speed goes straight through too: v = E/B doesn\'t depend on the charge or the mass.'],
    [116.6, 122.4, 'Beyond the slit there is only a magnetic field, B = 0.50 T into the page, and no electric field.'],
    [122.6, 128.6, 'The magnetic force is always at right angles to the velocity, so each ion moves at a steady speed round a semicircle.'],
    [128.8, 135.6, 'Neon-20 (20 u): r = mv/qB = (3.32 × 10⁻²⁶ × 1.6 × 10⁵) ÷ (1.60 × 10⁻¹⁹ × 0.50) = 6.64 cm. It lands 2r = 13.3 cm from the slit.'],
    [135.8, 141.4, 'Neon-22 is 10% heavier, so its radius is 10% bigger: r = 7.3 cm. It lands 14.6 cm from the slit.'],
    [141.6, 147.6, 'Same speed and charge, so r is proportional to m: the ions are sorted by charge-to-mass ratio, q/m = v/(Br).'],
    [147.8, 153.8, 'Ions with other speeds are stopped by the selector, so only ions very close to one speed (within about 2%) reach the magnetic field.'],
    [154.0, 159.6, 'This is the idea of a mass spectrometer. The neon-20 spot is brighter because about 9 in 10 neon atoms are neon-20.'],
  ];

  // ---------- colours ----------
  const EF = '190,170,255', BF = C.field, PLATE = '170,182,220', ION20 = C.pos, ION22 = '255,176,140', SCR = '111,211,154';

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = s.H > s.W;
    const capFs = Math.round(clamp(W / 44, 15, 25)), capTop = H - capFs * (phone ? 7.4 : 5.6);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    const area = phone ? { x0: 8, x1: W - 8, y0: 10, y1: capTop - fs * 0.6 }
      : { x0: W * 0.04, x1: W * 0.96, y0: Math.max(54, H * 0.1), y1: capTop - fs * 0.6 };
    L = { W, H, phone, fs, capTop, area };
  }
  // views (centimetres): part 1, part 2, part 3
  const VIEWS = {
    p1: { x0: -3.2, x1: 11.2, y0: -3.0, y1: 3.4 },
    p2: { x0: -2.6, x1: 14.0, y0: -3.0, y1: 3.6 },
    p3: { x0: -2.6, x1: 22.4, y0: -2.4, y1: 17.2 },
  };
  const P2PHONE = { x0: -2.6, x1: 15.4, y0: -4.0, y1: 3.8 };
  function view(t) {
    if (t < (P1_END + P2_ON) / 2) return VIEWS.p1;
    const a = L.phone ? P2PHONE : VIEWS.p2, b = VIEWS.p3, k = smooth((t - P3_CAM) / 3.4);
    return { x0: lerp(a.x0, b.x0, k), x1: lerp(a.x1, b.x1, k), y0: lerp(a.y0, b.y0, k), y1: lerp(a.y1, b.y1, k) };
  }
  // world (cm, y up) → screen
  function cam(t) {
    const v = view(t), A = L.area;
    const sc = Math.min((A.x1 - A.x0) / (v.x1 - v.x0), (A.y1 - A.y0) / (v.y1 - v.y0));
    const cx = (A.x0 + A.x1) / 2 - sc * (v.x0 + v.x1) / 2, cy = (A.y0 + A.y1) / 2 + sc * (v.y0 + v.y1) / 2;
    return { sc, X: (x) => cx + x * sc, Y: (y) => cy - y * sc };
  }

  // ---------- drawing helpers ----------
  function rich(s, parts, x, y, size, a, rgb = C.text, align = 'center') {
    const { g } = s; if (a <= 0) return 0;
    const font = (st) => st === 's' ? D.serif(Math.round(size * 0.7)) : st === 'i' ? D.serif(size) : st === 'r' ? D.serif(size, false) : D.sans(Math.round(size * 0.9));
    const ws = parts.map(([tx, st]) => { g.font = font(st); return g.measureText(tx).width; });
    const total = ws.reduce((p, q) => p + q, 0);
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`;
    parts.forEach(([tx, st], i) => { g.font = font(st); g.fillText(tx, px, st === 's' ? y + size * 0.28 : y); px += ws[i]; });
    g.shadowBlur = 0;
    return total;
  }
  function particle(s, x, y, rgb, neg, a, R) {
    if (a <= 0) return;
    const { g } = s;
    D.glowDot(s, x, y, R * 3.4, rgb, a);
    g.fillStyle = `rgba(${rgb},${a})`; g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill();
    g.strokeStyle = `rgba(20,6,20,${a})`; g.lineWidth = Math.max(1.4, R * 0.3); g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - R * 0.55, y); g.lineTo(x + R * 0.55, y);
    if (!neg) { g.moveTo(x, y - R * 0.55); g.lineTo(x, y + R * 0.55); }
    g.stroke();
  }
  // a plate from x0 to x1 (cm) at height y (cm); sign +1 or −1 drawn on its outer side
  function plate(s, c, x0, x1, y, sign, a, label) {
    if (a <= 0) return;
    const { g } = s, th = Math.max(4, c.sc * 0.14), top = sign > 0;
    const yy = c.Y(y), y0 = top ? yy - th : yy;
    const gr = g.createLinearGradient(0, y0, 0, y0 + th);
    gr.addColorStop(0, `rgba(205,214,240,${a})`); gr.addColorStop(1, `rgba(90,100,140,${a})`);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = gr; g.fillRect(c.X(x0), y0, c.X(x1) - c.X(x0), th);
    const n = Math.max(3, Math.round((x1 - x0) / 1.5)), fsz = Math.round(clamp(c.sc * 0.42, 11, 18));
    for (let i = 0; i < n; i++) {
      const x = c.X(x0 + (x1 - x0) * (i + 0.5) / n), ys = top ? y0 - fsz * 0.55 : y0 + th + fsz * 0.6;
      D.text(s, top ? '+' : '−', x, ys, fsz, 0.85 * a, D.sans(fsz, 600), top ? C.pos : C.neg);
    }
    if (label) D.text(s, label, c.X(x0) - 6, yy + (top ? -th / 2 : th / 2), L.fs, 0.8 * a, D.sans(L.fs), C.muted, 'right');
  }
  // E field: arrows pointing down between the plates
  function eField(s, c, x0, x1, half, step, a) {
    if (a <= 0) return;
    const { g } = s, n = Math.floor((x1 - x0) / step);
    g.globalCompositeOperation = 'source-over'; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = c.X(x0 + step * (i + 0.5)), ya = c.Y(half) + 6, yb = c.Y(-half) - 6, h = Math.min(7, (yb - ya) * 0.25);
      g.strokeStyle = `rgba(${EF},${0.32 * a})`; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(x, ya); g.lineTo(x, yb - h * 0.6); g.stroke();
      g.fillStyle = `rgba(${EF},${0.45 * a})`;
      g.beginPath(); g.moveTo(x, yb); g.lineTo(x - h * 0.55, yb - h); g.lineTo(x + h * 0.55, yb - h); g.closePath(); g.fill();
    }
  }
  // B into the page: a grid of crosses
  function bField(s, c, xs, ys, a, size) {
    if (a <= 0) return;
    const { g } = s, r = size;
    g.globalCompositeOperation = 'source-over'; g.strokeStyle = `rgba(${BF},${0.5 * a})`; g.lineWidth = 1.2;
    for (const x of xs) for (const y of ys) {
      const px = c.X(x), py = c.Y(y), q = r * 0.62;
      g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(px - q, py - q); g.lineTo(px + q, py + q); g.moveTo(px + q, py - q); g.lineTo(px - q, py + q); g.stroke();
    }
  }
  const range = (a, b, step) => { const out = []; for (let x = a; x <= b + 1e-9; x += step) out.push(x); return out; };

  // ---------- part 1: an electron between parallel plates ----------
  function part1(s, t, A) {
    if (A <= 0) return;
    const c = cam(t), { fs, phone } = L, half = D1 * 50;            // half the separation, in cm
    // the electron gun and the screen
    const gx = c.X(GUN * 100), gy = c.Y(0), gw = Math.max(18, c.sc * 0.9), gh = Math.max(10, c.sc * 0.5);
    const { g } = s;
    g.globalAlpha = A;
    const gg = g.createLinearGradient(0, gy - gh / 2, 0, gy + gh / 2);
    gg.addColorStop(0, 'rgba(120,132,180,1)'); gg.addColorStop(1, 'rgba(46,54,96,1)');
    g.fillStyle = gg; g.fillRect(gx - gw, gy - gh / 2, gw, gh);
    g.globalAlpha = 1;
    D.text(s, 'electron gun', Math.max(gx - gw, L.area.x0), gy + gh / 2 + fs * 0.9, fs, 0.75 * A, D.sans(fs), C.muted, 'left');
    const sx = c.X(SCREEN * 100);
    D.glowLine(s, [[sx, c.Y(-half - 0.4)], [sx, c.Y(3.1)]], SCR, 0.55 * A, 1.6);
    D.text(s, 'screen', sx, c.Y(-half - 0.4) + fs * 0.9, fs, 0.75 * A, D.sans(fs), SCR);
    // plates and field
    plate(s, c, 0, L1 * 100, half, +1, A, phone ? '' : '300 V');
    plate(s, c, 0, L1 * 100, -half, -1, A);
    eField(s, c, 0, L1 * 100, half, 1.0, A);
    D.text(s, 'E', c.X(L1 * 100) + fs * 0.9, c.Y(-0.75), fs + 3, 0.85 * A, D.serif(fs + 3), EF, 'left');
    // the two electrons
    for (const [te, u, main] of [[T_E1, U1, true], [T_E2, U2, false]]) {
      if (t < te) continue;
      const tau = (t - te) / K1, x = e1X(tau, u), y = e1Y(x, u), dimA = main ? (t > T_E2 ? 0.55 : 1) : 1;
      // trail
      const pts = [];
      for (let k = 0; k <= 80; k++) { const xx = GUN + (x - GUN) * k / 80; pts.push([c.X(xx * 100), c.Y(e1Y(xx, u) * 100)]); }
      D.glowLine(s, pts, C.neg, 0.75 * A * dimA, phone ? 1.4 : 1.8);
      // dots every 0.5 ns between the plates (first electron)
      if (main) {
        const da = A * smooth((t - T_E1 - 2.0) / 1.0) * dimA;
        for (let k = 0; k <= 6; k++) {
          const xk = (k * 0.5e-9) * u; if (GUN + u * tau < xk) break;
          const px = c.X(xk * 100), py = c.Y(e1Y(xk, u) * 100);
          D.glowDot(s, px, py, phone ? 6 : 9, C.neg, 0.9 * da);
          D.line(s, px, c.Y(-half) + 3, px, c.Y(-half) + 3 + Math.max(4, c.sc * 0.18), C.neg, 0.6 * da, 1.2);   // equal steps along
        }
      }
      // the electron with its velocity and force
      if (x < SCREEN) {
        const px = c.X(x * 100), py = c.Y(y * 100);
        particle(s, px, py, C.neg, true, A, phone ? 4 : Math.max(4.5, c.sc * 0.16));
        const inField = x > 0 && x < L1, la = A * (main ? 1 : 0.9);
        if (inField) D.arrow(s, px, py - 6, px, py - Math.max(26, c.sc * 1.1), C.force, la, 'F', { width: 2.2, head: 9, labelOff: 12 });
        const sl = e1Slope(x, u), len = Math.max(24, c.sc * 1.05), ang = Math.atan(sl);
        D.arrow(s, px + 6, py, px + len * Math.cos(ang), py - len * Math.sin(ang), C.vel, la, 'v', { width: 2.2, head: 9, labelOff: 12 });
      } else {
        D.glowDot(s, c.X(SCREEN * 100), c.Y(y * 100), phone ? 10 : 14, SCR, A * (main ? (t > T_E2 ? 0.6 : 1) : 1));
      }
    }
    // live readout: time in the field and deflection so far (first electron, then the second)
    const cur = t >= T_E2 ? [T_E2, U2] : [T_E1, U1];
    if (t >= cur[0]) {
      const tau = (t - cur[0]) / K1, x = e1X(tau, cur[1]), tin = clamp(x, 0, L1) / cur[1], yin = e1Y(clamp(x, 0, L1), cur[1]);
      const ra = A * smooth((t - cur[0] - 0.6) / 0.5), t1 = `time between the plates: ${(tin * 1e9).toFixed(2)} ns`, t2 = `deflection so far: ${(yin * 1000).toFixed(1)} mm`;
      if (phone) {                                                   // above the plates
        const rx = L.area.x0 + 4, ry = c.Y(3.4) - fs * 2.4;
        D.text(s, t1, rx, ry, fs + 1, ra, D.sans(fs + 1), C.text, 'left');
        D.text(s, t2, rx, ry + fs * 1.5, fs + 1, ra, D.sans(fs + 1), C.neg, 'left');
      } else {                                                       // under the plates, one line
        const mx = c.X(L1 * 50), ry = c.Y(-half) + fs * 3.2;
        D.text(s, t1, mx - fs, ry, fs + 1, ra, D.sans(fs + 1), C.text, 'right');
        D.text(s, t2, mx + fs, ry, fs + 1, ra, D.sans(fs + 1), C.neg, 'left');
        D.text(s, 'slowed down 10⁹ times', mx, ry + fs * 1.5, fs - 1, 0.6 * ra, D.sans(fs - 1), C.muted);
      }
    }
    // the spots on the screen, labelled
    // the deflection y at the end of the plates: measured from the undeflected line (dashed), shown with a bracket
    if (t > 41.0) {
      const la = A * smooth((t - 41.0) / 0.6), bx = c.X(L1 * 100) + 5, y0 = c.Y(0), y1 = c.Y(e1Y(L1, U1) * 100);
      D.line(s, c.X(0), y0, bx + 4, y0, C.muted, 0.45 * la, 1, [4, 4]);
      D.line(s, bx, y0, bx, y1, C.neg, 0.8 * la, 1.3);
      D.line(s, bx - 3, y1, bx + 3, y1, C.neg, 0.8 * la, 1.3); D.line(s, bx - 3, y0, bx + 3, y0, C.neg, 0.8 * la, 1.3);
      D.text(s, 'y = 9.5 mm', c.X(L1 * 100) + fs * 0.5, y1 - fs * 1.1, fs, 0.8 * la, D.sans(fs), C.neg, 'left');
    }
    if (t > T_E2 + 3.2) {
      const la = A * smooth((t - T_E2 - 3.2) / 0.6);
      D.text(s, 'y = 2.4 mm', c.X(L1 * 100) + fs * 0.5, c.Y(e1Y(L1, U2) * 100) + fs * 1.1, fs, 0.8 * la, D.sans(fs), C.neg, 'left');
    }
  }

  // ---------- parts 2 and 3: the selector, the chamber, the ions ----------
  function apparatus(s, t, c, A) {
    const { fs, phone } = L, half = D2 * 50, ls = LS * 100;
    const k3 = smooth((t - P3_CAM) / 3.4);
    // ion source
    const { g } = s, sx = c.X(XS * 100), sy = c.Y(0), bw = Math.max(16, c.sc * 0.9), bh = Math.max(14, c.sc * 1.2);
    g.globalAlpha = A; g.fillStyle = 'rgba(70,82,130,1)'; g.fillRect(sx - bw, sy - bh / 2, bw, bh); g.globalAlpha = 1;
    D.line(s, sx, sy - bh / 2, sx, sy - 2, PLATE, A, 2); D.line(s, sx, sy + 2, sx, sy + bh / 2, PLATE, A, 2);
    D.text(s, 'ion source', Math.max(sx - bw, L.area.x0), sy + bh / 2 + fs * 0.9, fs, 0.75 * A * (1 - k3), D.sans(fs), C.muted, 'left');
    // plates and E
    plate(s, c, 0, ls, half, +1, A, phone || k3 > 0.5 ? '' : '800 V');
    plate(s, c, 0, ls, -half, -1, A);
    eField(s, c, 0, ls, half, phone ? 1.6 : 1.2, A);
    // B in the selector (rows inside the gap)
    const bA = A * smooth((t - B_ON) / 1.0), cr = Math.max(4, Math.min(8, c.sc * 0.2));
    bField(s, c, range(0.6 + (phone ? 0.2 : 0), ls - 0.6, phone ? 1.6 : 1.2), [0.5, -0.5], bA, cr);
    // the slit plate (and, in part 3, the detector above it)
    const slitTop = lerp(half + 0.6, 16.4, k3), py0 = c.Y(-half - 0.6), pw = Math.max(3, c.sc * 0.12);
    g.fillStyle = `rgba(150,160,200,${A})`;
    g.fillRect(c.X(ls), c.Y(-SLIT * 100), pw, py0 - c.Y(-SLIT * 100));
    g.fillRect(c.X(ls), c.Y(slitTop), pw, c.Y(SLIT * 100) - c.Y(slitTop));
    // labels
    const la = A * (1 - k3);
    if (la > 0) {
      rich(s, [['E', 'i'], [' = 4.0 × 10⁴ V m⁻¹', 'sans']], c.X(phone ? 4.6 : 5.4), c.Y(-half) + fs * 2.6, fs + 1, la, EF, 'left');
      rich(s, [['B', 'i'], [' = 0.25 T into the page', 'sans']], c.X(phone ? 4.6 : 5.4), c.Y(-half) + fs * 4.2, fs + 1, la * smooth((t - B_ON) / 1.0), BF, 'left');
      D.text(s, 'slowed down 4.0 × 10⁶ times', c.X(phone ? 4.6 : 5.4), c.Y(-half) + fs * 5.7, fs - 1, 0.6 * la, D.sans(fs - 1), C.muted, 'left');
      D.text(s, 'slit', c.X(ls) + pw / 2, py0 + fs * 0.9, fs, 0.75 * la, D.sans(fs), C.muted);
    }
    // part 3: the magnetic field alone, and the detector
    if (k3 > 0) {
      const xs = range(ls + 0.9, 21.6, phone ? 2.4 : 1.8), ys = range(-0.9, 16.4, phone ? 2.4 : 1.8);
      bField(s, c, xs, ys, A * k3 * 0.8, cr);
      const det = A * smooth((t - P3_CAM - 2.0) / 1.0);
      D.glowLine(s, [[c.X(ls) + pw / 2, c.Y(1.4)], [c.X(ls) + pw / 2, c.Y(16.2)]], SCR, 0.5 * det, 1.6);
      D.text(s, 'detector', c.X(ls) + pw / 2, c.Y(16.2) - fs * 1.0, fs, 0.8 * det, D.sans(fs), SCR);
      rich(s, [['B', 'i'], [' = 0.50 T', 'sans']], phone ? c.X(16.8) : c.X(22.0), phone ? c.Y(17.0) - fs * 0.6 : c.Y(2.6), fs + 1, det, BF, phone ? 'center' : 'left');
      if (!phone) D.text(s, ['into the page;', 'no electric field', '(slowed down 4.0 × 10⁶ times)'], c.X(22.0), c.Y(2.6) + fs * 1.4, fs - 1, 0.7 * det, D.sans(fs - 1), C.muted, 'left');
      D.text(s, 'velocity selector', c.X(ls / 2), c.Y(-half) + fs * 2.0, fs, det * 0.85, D.sans(fs), C.muted);
    }
  }
  // one ion: trail, body, arrows
  function drawIon(s, t, c, it, A, opts = {}) {
    if (t < it.t || A <= 0) return null;
    const o = it.o, tau = sceneTau(it, t), p = ionAt(o, tau), rgb = it.heavy ? ION22 : ION20, { phone } = L;
    const R = phone ? 3.5 : Math.max(4, Math.min(7, c.sc * 0.16));
    let a = A;
    if (p.st === 'out') a *= 1 - smooth(p.since * K2 / 0.6);
    if (p.st === 'hit') a *= 1 - smooth((p.since * K2 - 0.3) / 0.8);
    if (a <= 0.01 && !opts.trail) return p;
    // the trail (sampled from the exact path)
    if (opts.trail !== false) {
      const pts = [], n = 90, tEnd = Math.min(tau, ionDone(o) + (p.st === 'out' ? p.since : 0));
      for (let k = 0; k <= n; k++) { const q = ionAt(o, tEnd * k / n); pts.push([c.X(q.x * 100), c.Y(q.y * 100)]); }
      D.glowLine(s, pts, rgb, (opts.trailA ?? 0.7) * A * (p.st === 'out' ? 1 - smooth(p.since * K2 / 0.6) : 1), phone ? 1.2 : 1.6);
    }
    const px = c.X(p.x * 100), py = c.Y(p.y * 100);
    if (p.st === 'hit') { D.glowDot(s, px, py, (phone ? 12 : 18) * (1 - smooth(p.since * K2 / 1.2)), C.light, A * (1 - smooth(p.since * K2 / 1.2))); return p; }
    if (p.st === 'land') return p;
    particle(s, px, py, rgb, false, a, R);
    if (opts.arrows && (p.st === 'sel' || p.st === 'arc')) {
      let base = phone ? 22 : Math.max(26, Math.min(48, c.sc * 1.0));
      const sp = Math.hypot(p.vx, p.vy), ux = p.vx / sp, uy = p.vy / sp;
      const ao = { width: 2.2, head: 9, labelOff: 13, font: `italic ${L.fs + 3}px "Cambria Math", Cambria, Georgia, serif` };
      if (p.st === 'sel') {
        // inside the selector the arrows stay short (the gap is narrow); labels sit beside them
        base = L.phone ? Math.max(12, Math.min(base, 0.45 * c.sc)) : Math.max(18, Math.min(base, 0.6 * c.sc));
        const ls = { ...ao, labelOff: 0 }, lf = D.serif(L.fs + 2);
        D.arrow(s, px, py + R + 2, px, py + R + 2 + base, C.force, a, '', ls);                         // electric force: down
        D.text(s, 'qE', px - 7, py + R + 2 + base * 0.55, L.fs + 2, a, lf, C.force, 'right');
        const lb = base * sp / VD;                                                                      // magnetic force ∝ speed, ⟂ to v
        const bx = px - uy * (R + 2 + lb), by = py - ux * (R + 2 + lb);
        D.arrow(s, px - uy * (R + 2), py - ux * (R + 2), bx, by, C.force, a, '', ls);
        D.text(s, 'qvB', (px + bx) / 2 - 7, (py + by) / 2 - (R + 2) / 2, L.fs + 2, a, lf, C.force, 'right');
      } else {
        // in part 3 only the magnetic force, towards the centre
        D.arrow(s, px - uy * (R + 2), py - ux * (R + 2), px - uy * (R + 2 + base), py - ux * (R + 2 + base), C.force, a, 'F', ao);
      }
      const lv = base * 0.9;
      D.arrow(s, px + ux * (R + 2), py - uy * (R + 2), px + ux * (R + 2 + lv), py - uy * (R + 2 + lv), C.vel, a, 'v', ao);
    }
    return p;
  }

  function parts23(s, t, A) {
    if (A <= 0) return;
    const c = cam(t), { fs, phone } = L, k3 = smooth((t - P3_CAM) / 3.4);
    apparatus(s, t, c, A);
    // part 2 ions (trails of the deflected ones stay faintly, to compare)
    const p2A = A * (1 - k3);
    for (const it of PART2) {
      const keep = it.name === 'B' || it.name === 'C' ? (t < it.t + 1 ? 1 : 0.5) : 1;
      drawIon(s, t, c, it, p2A * (1 - smooth((t - it.t - 13.4) / 0.6)), { arrows: true, trailA: 0.75 * keep });
    }
    // labels for the deflected ions
    const lab = (txt, x, y, at, rgb, align, until = 1e9) => D.text(s, txt, x, y, fs, 0.85 * A * (1 - k3) * smooth((t - at) / 0.6) * (1 - smooth((t - until) / 0.6)), D.sans(fs, 600), rgb, align);
    if (t < P3_CAM + 3.4) {
      const hb = PART2[2].o, hc = PART2[3].o;
      lab('faster', c.X(hb.sx(hb.tEnd) * 100), c.Y(D2 * 50) - fs * 2.7, 99.6, ION20, 'center', PART2[2].t + 13.4);
      lab('slower', c.X(hc.sx(hc.tEnd) * 100) - 4, c.Y(-D2 * 50) + fs * 2.6, 106.1, ION20, 'right', PART2[3].t + 13.4);
      lab('v = E/B', c.X(LS * 100) + fs * 0.9, c.Y(0) + fs * 1.3, 83.0, ION20, 'left');
    }
    // part 3: the two highlighted ions, then the stream
    if (k3 > 0) {
      for (const it of [H20, H22]) {
        const p = drawIon(s, t, c, it, A, { arrows: true, trailA: 0.85 });
        if (!p) continue;
        const o = it.o, rgb = it.heavy ? ION22 : ION20;
        // the radius while it goes round, then the landing distance
        if (p.st === 'arc') {
          D.line(s, c.X(o.c[0] * 100), c.Y(o.c[1] * 100), c.X(p.x * 100), c.Y(p.y * 100), rgb, 0.45 * A, 1.2, [4, 4]);
          // the label rides beside the middle of the dashed radius
          const mx = (c.X(o.c[0] * 100) + c.X(p.x * 100)) / 2, my = (c.Y(o.c[1] * 100) + c.Y(p.y * 100)) / 2;
          rich(s, [['r', 'i'], [` = ${(o.r * 100).toFixed(2)} cm`, 'sans']], mx - Math.sin(p.f) * fs * 1.1, my - Math.cos(p.f) * fs * 1.1, fs + 1, A, rgb);
        }
        const landA = A * smooth((t - (it.t + ionDone(o) * K2)) / 0.6);
        if (landA > 0) {
          const bx = c.X(LS * 100 - (it.heavy ? 2.6 : 1.2)), y0 = c.Y(0), y1 = c.Y(o.land * 100);
          D.line(s, bx, y0, bx, y1, rgb, 0.7 * landA, 1.3);
          D.line(s, bx - 4, y1, bx + 4, y1, rgb, 0.7 * landA, 1.3); D.line(s, bx - 4, y0, bx + 4, y0, rgb, 0.7 * landA, 1.3);
          D.text(s, `${(o.land * 100).toFixed(1)} cm`, bx - 6, (y0 + y1) / 2 + (it.heavy ? -fs * 1.5 : fs * 1.5), fs, 0.9 * landA, D.sans(fs, 600), rgb, 'right');
          D.text(s, it.heavy ? 'neon-22' : 'neon-20', c.X(LS * 100) - 6, y1 + (it.heavy ? -fs * 0.8 : fs * 0.8), fs, 0.9 * landA, D.sans(fs), rgb, 'right');
        }
      }
      for (const it of STREAM) drawIon(s, t, c, it, A * 0.85, { trailA: 0.22 });
      // the detector: every ion that has landed leaves a mark
      const marks = [H20, H22, ...STREAM].filter((it) => it.o.pass && t > it.t + ionDone(it.o) * K2);
      for (const it of marks) {
        const y = c.Y(it.o.land * 100), x = c.X(LS * 100) + Math.max(2, c.sc * 0.06);
        D.glowDot(s, x, y, phone ? 7 : 10, it.heavy ? ION22 : ION20, 0.35 * A);
      }
    }
  }

  // ---------- legend and end card ----------
  const LEG1 = [['dot', C.neg, 'electron (negative)'], ['arrow', C.vel, 'velocity, v'], ['arrow', C.force, 'force'], ['line', EF, 'electric field, E (down)']];
  const LEG2 = [['dot', ION20, 'positive neon-20 ion'], ['dot', ION22, 'positive neon-22 ion'],
    ['line', EF, 'electric field, E (down)'], ['line', BF, 'magnetic field, B (× into the page)']];
  function endCard(s, t) {
    const a = fade(t, END, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 30, 18, 38)), s2 = Math.round(clamp(W / 46, 14, 24)), s3 = Math.round(clamp(W / 66, 11, 16));
    D.text(s, 'Charges in uniform fields', W / 2, H * (phone ? 0.1 : 0.13), s1, a, D.sans(s1, 300));
    const items = [
      [[['F', 'i'], [' = ', 'r'], ['qE', 'i']], EF, 'Electric field: a constant force. Entering at right angles, the path is a parabola.'],
      [[['r', 'i'], [' = ', 'r'], ['mv', 'i'], [' / ', 'r'], ['qB', 'i']], BF, 'Magnetic field: F = qvB at right angles to v. No work is done: a circle.'],
      [[['v', 'i'], [' = ', 'r'], ['E', 'i'], [' / ', 'r'], ['B', 'i']], C.vel, 'Crossed fields: straight through only when qE = qvB.'],
    ];
    if (phone) {
      let y = H * 0.24;
      for (const [eq, rgb, txt] of items) {
        rich(s, eq, W / 2, y, s2, a, rgb); y += s2 * 1.2;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 36); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.9;
      }
    } else {
      const colW = Math.min(W * 0.28, 320), y = H * 0.36;
      g.font = D.sans(s3);
      items.forEach(([eq, rgb, txt], i) => {
        const x = W / 2 + (i - 1) * W * 0.31;
        rich(s, eq, x, y, s2, a, rgb);
        D.text(s, D.wrap(s, txt, colW), x, y + s2 * 1.4, s3, 0.85 * a, D.sans(s3));
      });
    }
    g.font = D.sans(s3);
    D.text(s, D.wrap(s, 'With v fixed by the selector, measuring r in a known field gives q/m = v/(Br).', Math.min(W - 40, 720)), W / 2, H * (phone ? 0.8 : 0.72), s3, 0.7 * a, D.sans(s3), C.muted);
  }

  // ---------- checks (not used by the player) ----------
  function check() {
    const out = {};
    out.E1 = E1; out.a = A1; out.t = L1 / U1; out.y = 0.5 * A1 * (L1 / U1) ** 2; out.y2 = 0.5 * A1 * (L1 / U2) ** 2;
    out.weightRatio = ME * 9.8 / (QE * E1);
    out.E2 = E2; out.vd = VD; out.w20 = QE * B2 / M20;
    out.fastHit = [PART2[2].o.end, PART2[2].o.sx(PART2[2].o.tEnd) * 100];
    out.slowHit = [PART2[3].o.end, PART2[3].o.sx(PART2[3].o.tEnd) * 100];
    out.straight = [PART2[0].o.end, PART2[1].o.end, PART2[4].o.end];
    out.r20 = M20 * VD / (QE * B3); out.r22 = M22 * VD / (QE * B3);
    out.land20 = H20.o.land; out.land22 = H22.o.land;
    out.arcTime20 = H20.o.tArc * K2; out.arcTime22 = H22.o.tArc * K2; out.selTime = LS / VD * K2;
    out.stream = { n: STREAM.length, pass: STREAM.filter((x) => x.o.pass).length, heavyPass: STREAM.filter((x) => x.o.pass && x.heavy).length,
      lastLand: Math.max(...STREAM.filter((x) => x.o.pass).map((x) => x.t + ionDone(x.o) * K2)), lastDone: Math.max(...STREAM.map((x) => x.t + ionDone(x.o) * K2)) };
    // fraction of speeds that pass, found by scanning
    let lo = 1, hi = 1; for (let f = 1; f > 0.9; f -= 0.0005) if (ion(f * VD, M20, false).pass) lo = f;
    for (let f = 1; f < 1.1; f += 0.0005) if (ion(f * VD, M20, false).pass) hi = f;
    out.passBand = [lo, hi];
    return out;
  }

  Anim.register('selector', {
    duration: DURATION,
    poster: 134,
    pauses: [[11.0, 1.5], [16.2, 1.5], [18.3, 3.0], [28.2, 3.0], [33.4, 1.4], [47.2, 1.0], [58.8, 6.0], [66.2, 0.6],
      [74.2, 2.2], [81.2, 3.0], [88.0, 1.5], [91.2, 1.2], [96.6, 6.0], [102.4, 1.0], [115.2, 1.2], [121.6, 1.0], [127.8, 1.0],
      [134.8, 1.4], [140.6, 0.8], [146.8, 1.0], [150.0, 1.5], [153.0, 0.8], [158.8, 1.6]],
    // score: precise machinery (D dorian, a triangle pad, a soft tick twice a second, a light pulse, glassy bells)
    music: { chords: [[50, 57, 60, 65], [55, 59, 62, 67], [45, 52, 57, 60], [48, 55, 60, 64]], bar: 6, pad: 'triangle', cutoff: 1300,
      drone: 0.07, bells: 0.3, bellType: 'glass', bellOct: 2, tick: 0.5, pulse: 2, echo: 0.25, volume: 0.43 },
    resize: layout,
    info: { check, ion, ionAt, ionDone, CAPS, PART2, H20, H22, STREAM, e1Y },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.22);
      const a1 = smooth((t - 4.4) / 0.8) * (1 - smooth((t - P1_END) / 0.8));
      const a2 = smooth((t - P2_ON) / 0.9) * (1 - smooth((t - END) / 0.8));
      part1(s, t, a1);
      parts23(s, t, a2);
      if (!L.phone) {
        D.legend(s, LEG1, a1);
        D.legend(s, LEG2, a2);
      }
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Charges in electric and crossed fields', 'A beam bent by a field, a velocity selector, and ions sorted by charge-to-mass ratio');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
