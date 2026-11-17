/* What would happen if the Earth stopped spinning? (A.2 Newton's first law, friction, circular motion)
   A thought experiment: the solid Earth suddenly stops turning, but everything not fixed to it (air, sea, a crate on the
   ground) keeps the velocity it had: inertia. Nothing could really stop the Earth (the forces needed would be enormous).
   Numbers (R = 6.37 × 10⁶ m as in the notes; one turn relative to the stars, the sidereal day, T = 23 h 56 min 4 s
   = 86 164 s; g = 9.8 m s⁻²), all recalculated in info.check():
     ω = 2π ÷ T = 2π ÷ 86 164 = 7.29 × 10⁻⁵ rad s⁻¹
     equator: v = 2πR ÷ T = 2π × 6.37 × 10⁶ ÷ 86 164 = 464.5 m s⁻¹ ≈ 465 m s⁻¹
     latitude λ: the circle has radius R cos λ, so v = 465 cos λ: 30° → 402 m s⁻¹, 51.5° (London) → 289 m s⁻¹,
       60° → 232 m s⁻¹, the poles → 0
     faster than sound in air (about 340 m s⁻¹); far below the orbital speed just above the surface, √(gR) = 7.9 km s⁻¹,
       so gravity keeps everything on the ground
     a crate sliding with μd = 0.50, LEAVING OUT THE AIR (in reality the wind, still moving at ~465 m s⁻¹, would push
       it with a force far bigger than friction; the captions, page and end card say so):
       a = μd g = 4.9 m s⁻², time to stop v ÷ a = 465 ÷ 4.9 = 95 s,
       distance v² ÷ 2a = 464.5² ÷ 9.8 = 2.2 × 10⁴ m = 22 km
     centripetal acceleration at the equator before: ω²R = (7.29 × 10⁻⁵)² × 6.37 × 10⁶ = 0.0339 m s⁻² ≈ 0.034 m s⁻²
       = 0.35% of g. A 60 kg person: scale reading m(g − ω²R) = 60 × 9.766 = 586 N spinning, mg = 588 N stopped.
     afterwards the Earth still orbits the Sun once a year but no longer turns, so each place faces the Sun for half a
       year: a solar day lasts a year. Today the Earth turns the same way as it orbits, so the Sun's direction, which
       turns once a year relative to the stars, now turns the other way relative to the ground: it rises in the west.
   Playback (always shown on screen): one turn every 12 s (7180 times faster than real), slowed to 100 times SLOWER
   than real around the moment the Earth stops, 5 times faster while the crate slides to a halt, then a year every
   24 s. The picture never freezes. Every frame is drawn from the scene time alone. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const NB = ' ';

  // ---------- the physics ----------
  const R = 6.37e6, TSID = 86164, OM = 2 * Math.PI / TSID, VEQ = OM * R, G0 = 9.8, MU = 0.50, YEAR = 3.16e7;
  const A_FR = MU * G0, T_SLIDE = VEQ / A_FR, S_SLIDE = VEQ * VEQ / (2 * A_FR);
  const A_C = OM * OM * R, M_P = 60;
  const LATS = [[0, 'equator'], [30, '30°'], [60, '60°'], [90, 'pole']];
  const vLat = (deg) => VEQ * Math.cos(deg * Math.PI / 180);

  // ---------- timeline (scene seconds) ----------
  const FAST = TSID / 12, SLOWMO = 0.01, MID = 5, ORB = YEAR / 24;
  const R1 = [48.5, 51.2], T_STOP = 52.0, R2 = [72.8, 75.4], R3 = [95.6, 98.6];
  const T_PANEL = 25.8, T_METER = [72.8, 96.0], T_FBD = 116.8;
  const END = 132.2, DURATION = 144.6;
  const lr = (a, b, u) => Math.exp(lerp(Math.log(a), Math.log(b), smooth(u)));
  const rate = (t) => {
    if (t < R2[0]) return lr(FAST, SLOWMO, (t - R1[0]) / (R1[1] - R1[0]));
    if (t < R3[0]) return lr(SLOWMO, MID, (t - R2[0]) / (R2[1] - R2[0]));
    return lr(MID, ORB, (t - R3[0]) / (R3[1] - R3[0]));
  };
  const DT = 0.005, NT = Math.ceil(DURATION / DT) + 2, TAU = new Float64Array(NT);
  for (let i = 1; i < NT; i++) TAU[i] = TAU[i - 1] + 0.5 * (rate((i - 1) * DT) + rate(i * DT)) * DT;
  const tauAt = (t) => { const f = clamp(t / DT, 0, NT - 1.001), k = Math.floor(f); return lerp(TAU[k], TAU[k + 1], f - k); };
  const tOfTau = (tau) => {
    let lo = 0, hi = NT - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (TAU[m] < tau) lo = m; else hi = m; }
    return (lo + (tau - TAU[lo]) / Math.max(1e-12, TAU[hi] - TAU[lo])) * DT;
  };
  const TAU_STOP = tauAt(T_STOP), T_CRATE_STOPS = tOfTau(TAU_STOP + T_SLIDE);
  const spin = (tau) => OM * Math.min(tau, TAU_STOP);                           // the Earth's angle turned
  // the crate after the stop: x along the ground (m), speed (m s⁻¹)
  const crate = (tau) => {
    const s = Math.max(0, tau - TAU_STOP);
    if (s >= T_SLIDE) return { x: S_SLIDE, v: 0, s };
    return { x: VEQ * s - 0.5 * A_FR * s * s, v: VEQ - A_FR * s, s };
  };

  const sci = (v, dp = 2) => { const e = Math.floor(Math.log10(Math.abs(v))), m = v / 10 ** e;
    const sup = String(e).replace('-', '⁻').replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]); return `${m.toFixed(dp)}${NB}×${NB}10${sup}`; };
  const V0 = Math.round(VEQ), V30 = Math.round(vLat(30)), V60 = Math.round(vLat(60));

  const CAPS = [
    [4.8, 11.4, 'Seen from above the North Pole, the Earth turns once every 23 h 56 min, relative to the stars.'],
    [11.6, 18.8, `Everything on it moves in a circle. At the equator v${NB}=${NB}2πR${NB}÷${NB}T = 2π${NB}×${NB}6.37${NB}×${NB}10⁶${NB}÷${NB}86${NB}164 = ${V0}${NB}m${NB}s⁻¹.`],
    [19.0, 25.6, `Nearer the poles the circle is smaller, so the speed is less: ${V30}${NB}m${NB}s⁻¹ at latitude 30°, ${V60}${NB}m${NB}s⁻¹ at 60°.`],
    [25.8, 32.4, 'You don\'t notice this speed, because the ground, the air and you all move together.'],
    [32.6, 39.4, 'A thought experiment: suppose the solid Earth suddenly stopped turning, but nothing loose on it did.'],
    [39.6, 51.6, 'Predict: what would happen to the air, the sea, and a crate resting on the ground at the equator?'],
    [52.0, 58.8, 'The ground stops. Everything loose carries on east at the speed it had: inertia, Newton\'s first law.'],
    [59.0, 65.4, `At the equator that is ${V0}${NB}m${NB}s⁻¹, faster than sound: a wind far stronger than any hurricane.`],
    [65.6, 72.6, `Gravity still holds things down (staying in orbit would need 7.9${NB}km${NB}s⁻¹), so they slide along the surface.`],
    [74.8, 81.4, 'Leave out the air for a moment: in reality the wind would keep pushing the crate along.'],
    [81.6, 88.4, `Then friction alone (μd${NB}=${NB}0.50) slows it at a${NB}=${NB}μd${NB}g${NB}=${NB}4.9${NB}m${NB}s⁻²: it stops after v${NB}÷${NB}a${NB}=${NB}95${NB}s.`],
    [88.6, 95.2, `In that time it slides v²${NB}÷${NB}2a = ${V0}²${NB}÷${NB}9.8 = 22${NB}km before it stops.`],
    [96.0, 102.6, 'Now the Earth no longer turns, but it still goes round the Sun once a year.'],
    [102.8, 109.6, 'So each place faces the Sun for half a year, then away from it for half a year: one day lasts a year.'],
    [109.8, 116.6, 'And the Sun would cross the sky the opposite way from today: rising in the west and setting in the east.'],
    [116.8, 124.4, 'Once everything has settled, scales at the equator would read 0.35% more: no centripetal force (mω²R) is needed.'],
    [124.6, 131.8, 'Nothing could really stop the Earth: the forces needed would be enormous. This is a thought experiment about inertia.'],
  ];

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25)), capTop = H - capFs * (phone ? 6.6 : 5.4);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    let cx, cy, Re, p;
    if (phone) {
      Re = Math.min(W * 0.3, capTop * 0.22); cx = W / 2; cy = 14 + fs * 2.2 + Re;
      p = { x0: 12, x1: W - 12, y0: cy + Re + fs * 2.4, y1: capTop - 6 };
    } else {
      Re = Math.min(W * 0.19, capTop * 0.37); cx = W * 0.26; cy = capTop * 0.53;
      p = { x0: W * 0.52, x1: W - Math.max(16, W * 0.03), y0: Math.max(66, capTop * 0.2), y1: capTop - fs * 0.8 };
    }
    L = { W, H, phone, capFs, capTop, fs, cx, cy, Re, p };
  }

  const fmtRate = (r, t) => {
    if (t < T_STOP && r > 0.98 * FAST) return 'speeded up: one turn every 12 s';
    if (r > 0.98 * ORB) return 'speeded up: a year every 24 s';
    if (r > 0.95 && r < 1.05) return 'real time';
    if (r < 1) return `slowed down ${Number((1 / r).toPrecision(2)).toLocaleString('en-GB').replace(/,/g, ' ')} times`;
    return `speeded up ${Number(r.toPrecision(2)).toLocaleString('en-GB').replace(/,/g, ' ')} times`;
  };

  // ---------- the Earth from above the North Pole ----------
  function drawTop(s, t, tau, a) {
    if (a <= 0) return;
    const { g } = s, { cx, cy, Re, fs, phone } = L, ph = spin(tau), stopped = tau >= TAU_STOP;
    g.save(); g.globalAlpha = a;
    const rg = g.createRadialGradient(cx - Re * 0.3, cy - Re * 0.3, Re * 0.1, cx, cy, Re);
    rg.addColorStop(0, 'rgba(70,130,200,1)'); rg.addColorStop(1, 'rgba(30,70,140,1)');
    g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, Re, 0, 7); g.fill();
    g.restore();
    D.glowLine(s, Array.from({ length: 97 }, (_, i) => [cx + Re * Math.cos(i / 96 * 2 * Math.PI), cy + Re * Math.sin(i / 96 * 2 * Math.PI)]), '110,170,255', 0.7 * a, 1.6);
    // latitude circles (radius R cos λ, seen from above) and meridians that turn with the Earth
    g.setLineDash([3, 4]); g.strokeStyle = `rgba(220,230,255,${0.35 * a})`; g.lineWidth = 1;
    for (const lat of [30, 60]) { g.beginPath(); g.arc(cx, cy, Re * Math.cos(lat * Math.PI / 180), 0, 7); g.stroke(); }
    g.setLineDash([]);
    for (let k = 0; k < 12; k++) {
      const u = ph + k * Math.PI / 6;
      D.line(s, cx, cy, cx + Re * Math.cos(u), cy - Re * Math.sin(u), '220,230,255', 0.22 * a, 1);
    }
    // a little "land" on the equator side of one meridian, so the turning is easy to see
    g.save(); g.globalAlpha = a;
    g.fillStyle = 'rgba(96,150,90,0.95)';
    g.beginPath();
    const blob = [[0.55, 2.4], [0.72, 2.5], [0.92, 2.46], [0.98, 2.62], [0.86, 2.76], [0.66, 2.7], [0.5, 2.56]];
    blob.forEach(([r, u], i) => { const x = cx + Re * r * Math.cos(ph + u), y = cy - Re * r * Math.sin(ph + u); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    g.closePath(); g.fill();
    g.restore();
    D.glowDot(s, cx, cy, 6, '255,255,255', 0.8 * a);
    D.text(s, 'North Pole', cx, cy - fs * 1.1, fs - 1, 0.8 * a * fade(t, 5, 40, 1, 1), D.sans(fs - 1), C.text);
    // the turning arrow, while it turns
    const ta = a * (1 - smooth((t - T_STOP) / 0.6));
    if (ta > 0) {
      const rr = Re + fs * 1.0;
      g.strokeStyle = `rgba(255,214,102,${0.7 * ta})`; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, rr, -0.25, -1.15, true); g.stroke();
      const ex = cx + rr * Math.cos(-1.15), ey = cy + rr * Math.sin(-1.15);
      D.arrow(s, ex + 6, ey + 4, ex, ey, C.light, ta, '', { head: 8, width: 2 });
    }
    // markers at four latitudes, all on one meridian, with their velocities (to scale with each other)
    const show = fade(t, 11.6, END, 0.8, 1) * a;
    LATS.forEach(([lat, name], i) => {
      const r = Re * Math.cos(lat * Math.PI / 180), u = ph + 0.03, mx = cx + r * Math.cos(u), my = cy - r * Math.sin(u);
      g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.arc(mx, my, 3.2, 0, 7); g.fill();
      if (show <= 0) return;
      const v = vLat(lat), len = Re * 0.55 * v / VEQ, tx = -Math.sin(u), ty = -Math.cos(u);
      // before the stop: ground and air together (blue); after: only the air (cyan) keeps moving
      if (len > 3) {
        const rgb = stopped ? C.neg : C.vel;
        D.arrow(s, mx, my, mx + tx * len, my + ty * len, rgb, show, '', { head: 7, width: 2 });
      }
      if (i < 3 && t > 11.6) {
        // equator and 60°: beyond the arrow's tip; 30°: behind the marker, so the labels never overlap
        const lab = `${Math.round(v)} m s⁻¹`, gap = fs * (phone ? 2.6 : 3.0);
        const d = i === 1 ? -gap : len + gap;
        D.text(s, lab, mx + tx * d, my + ty * d, fs - 1, 0.9 * show, D.sans(fs - 1, 600), stopped ? C.neg : C.vel);
      }
    });
    if (t > 52) D.text(s, 'arrows now: the air', cx, cy + Re + fs * (phone ? 1.0 : 1.6), fs - 1, 0.85 * a * fade(t, 52.4, 95.6, 0.8, 0.8), D.sans(fs - 1, 600), C.neg);
  }

  // ---------- the panel: at the equator, seen side-on ----------
  function drawSide(s, t, tau, a) {
    if (a <= 0) return;
    const { g } = s, { p, fs } = L, w = p.x1 - p.x0, h = p.y1 - p.y0;
    g.save(); g.globalAlpha = a;
    g.beginPath(); g.roundRect(p.x0, p.y0, w, h, 10); g.clip();
    const sky = g.createLinearGradient(0, p.y0, 0, p.y1);
    sky.addColorStop(0, 'rgba(60,110,190,1)'); sky.addColorStop(1, 'rgba(150,190,235,1)');
    g.fillStyle = sky; g.fillRect(p.x0, p.y0, w, h);
    const gy = p.y0 + h * 0.74;
    g.fillStyle = 'rgba(86,130,72,1)'; g.fillRect(p.x0, gy, w, h);
    g.fillStyle = 'rgba(70,100,58,1)'; g.fillRect(p.x0, gy + h * 0.06, w, h);
    const span = 120, k = w / span, c = crate(tau), air = Math.max(0, tau - TAU_STOP) * VEQ;
    // wind streaks (the air), moving with the air once the ground has stopped
    g.strokeStyle = 'rgba(235,245,255,0.65)'; g.lineWidth = 1.4;
    for (let i = 0; i < 9; i++) {
      const y = p.y0 + h * (0.14 + 0.06 * i);
      const base = ((i * 37) % 120) - 10 + air;
      const x = p.x0 + ((((base) % (span + 30)) + (span + 30)) % (span + 30) - 15) * k;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 9 * k, y); g.stroke();
    }
    // a cloud, carried by the air
    const cxl = p.x0 + ((((70 + air) % (span + 60)) + (span + 60)) % (span + 60) - 30) * k, cyl = p.y0 + Math.max(h * 0.42, fs * 4.4);
    const ck = Math.min(k, h / 46);                                            // the cloud's size (kept small on phones)
    g.fillStyle = 'rgba(250,252,255,0.9)';
    for (const [dx, dy, r] of [[0, 0, 7], [7, -3, 8], [15, 0, 6.5], [7, 3, 6]]) { g.beginPath(); g.arc(cxl + dx * ck, cyl + dy * ck, r * ck, 0, 7); g.fill(); }
    // a house (fixed to the ground)
    const hx = p.x0 + 14 * k, hw = 12 * k, hh = 8 * k;
    g.fillStyle = 'rgba(230,220,200,1)'; g.fillRect(hx, gy - hh, hw, hh);
    g.fillStyle = 'rgba(170,70,60,1)'; g.beginPath(); g.moveTo(hx - 1.5 * k, gy - hh); g.lineTo(hx + hw / 2, gy - hh - 6 * k); g.lineTo(hx + hw + 1.5 * k, gy - hh); g.fill();
    g.fillStyle = 'rgba(80,60,50,1)'; g.fillRect(hx + hw * 0.4, gy - hh * 0.55, hw * 0.22, hh * 0.55);
    // the crate (drawn bigger than to scale), sliding once the ground stops
    const cs = Math.max(10, 4 * k), crx = p.x0 + (40 + c.x) * k;
    if (crx < p.x1 + cs) {
      g.fillStyle = 'rgba(190,140,80,1)'; g.fillRect(crx, gy - cs, cs, cs);
      g.strokeStyle = 'rgba(110,75,40,1)'; g.lineWidth = 1.5; g.strokeRect(crx, gy - cs, cs, cs);
      g.beginPath(); g.moveTo(crx, gy - cs); g.lineTo(crx + cs, gy); g.moveTo(crx + cs, gy - cs); g.lineTo(crx, gy); g.stroke();
    }
    g.restore();
    g.strokeStyle = `rgba(170,182,220,${0.5 * a})`; g.lineWidth = 1; g.beginPath(); g.roundRect(p.x0, p.y0, w, h, 10); g.stroke();
    // velocities seen from space (not turning): all equal before the stop; afterwards the ground and house have none
    const stopped = tau >= TAU_STOP, al = Math.min(w * 0.22, 90), ya = gy - hh - 6 * k - fs * 0.8;   // above the roof
    const groundA = a * (1 - smooth((t - T_STOP) / 0.4));
    D.arrow(s, hx + hw / 2 - al / 2, ya, hx + hw / 2 + al / 2, ya, C.vel, groundA, '', { head: 8, width: 2.2 });
    if (crx < p.x1 - al * 0.3) D.arrow(s, crx + cs / 2 - al / 2, gy - cs - fs * 1.1, crx + cs / 2 + al / 2, gy - cs - fs * 1.1, stopped ? C.neg : C.vel, a, '', { head: 8, width: 2.2 });
    if (cxl > p.x0 && cxl < p.x1 - al * 0.3) D.arrow(s, cxl + 7 * ck - al / 2, cyl + 12 * ck, cxl + 7 * ck + al / 2, cyl + 12 * ck, stopped ? C.neg : C.vel, a, '', { head: 8, width: 2.2 });
    // labels
    D.text(s, 'at the equator, from the side', p.x0 + 8, p.y0 + fs * 0.95, fs, 0.95 * a, D.sans(fs, 600), '20,30,60', 'left');
    D.text(s, `arrows: velocity seen from space (${V0} m s⁻¹)`, p.x0 + 8, p.y0 + fs * 2.25, fs - 1, 0.9 * a, D.sans(fs - 1), '20,30,60', 'left');
    D.text(s, stopped ? 'ground: stopped' : 'ground, house, crate and air: all together', p.x0 + 8, p.y1 - fs * 0.8, fs - 1, 0.95 * a, D.sans(fs - 1, 600), '235,245,235', 'left');
    if (crx < p.x1 - 20 && crx > p.x0 + fs * 3) D.text(s, 'crate', crx - 4, gy - cs / 2, fs - 1, 0.9 * a, D.sans(fs - 1, 600), '60,40,20', 'right');
    // the scale, on the ground at the right
    const bl = 20 * k, bx = p.x1 - bl - 10, by = gy + (p.y1 - gy) * 0.32;
    D.line(s, bx, by, bx + bl, by, '235,245,235', 0.85 * a, 1.6);
    D.line(s, bx, by - 3, bx, by + 3, '235,245,235', 0.85 * a, 1.6); D.line(s, bx + bl, by - 3, bx + bl, by + 3, '235,245,235', 0.85 * a, 1.6);
    D.text(s, '20 m', bx - 4, by, fs - 2, 0.85 * a, D.sans(fs - 2), '235,245,235', 'right');
  }

  // the slide, measured: a 25 km track with the crate's position, and readouts
  function drawMeter(s, t, tau, a) {
    if (a <= 0) return;
    const { g } = s, { p, fs, phone } = L, w = p.x1 - p.x0, h = p.y1 - p.y0;
    g.save(); g.globalAlpha = a;
    g.fillStyle = 'rgba(14,20,44,0.82)'; g.beginPath(); g.roundRect(p.x0, p.y0, w, h, 10); g.fill();
    g.restore();
    const c = crate(tau);
    D.text(s, 'the crate\'s slide (μd = 0.50, air left out)', p.x0 + 10, p.y0 + fs * 1.0, fs, a, D.sans(fs, 600), C.text, 'left');
    const lh = fs * 1.5, y0 = p.y0 + fs * 2.6;
    D.text(s, `time since the stop: ${c.s.toFixed(c.s < 10 ? 1 : 0)} s`, p.x0 + 10, y0, fs, a, D.sans(fs), C.text, 'left');
    D.text(s, `speed: ${Math.round(c.v)} m s⁻¹`, p.x0 + 10, y0 + lh, fs, a, D.sans(fs), C.neg, 'left');
    D.text(s, `distance slid: ${(c.x / 1000).toFixed(1)} km`, p.x0 + 10, y0 + 2 * lh, fs, a, D.sans(fs), C.light, 'left');
    const tx0 = p.x0 + fs * 1.4, tx1 = p.x1 - fs * 1.4, ty = Math.min(p.y1 - fs * 2.4, y0 + 3 * lh + fs * (phone ? 1.4 : 2.6));
    D.line(s, tx0, ty, tx1, ty, C.muted, 0.7 * a, 2);
    for (let km = 0; km <= 25; km += 5) {
      const x = tx0 + km / 25 * (tx1 - tx0);
      D.line(s, x, ty - 4, x, ty + 4, C.muted, 0.7 * a, 1.2);
      D.text(s, `${km}`, x, ty + fs * 0.95, fs - 2, 0.75 * a, D.sans(fs - 2), C.muted);
    }
    D.text(s, 'km', tx1, ty + fs * 2.0, fs - 2, 0.75 * a, D.sans(fs - 2), C.muted, 'right');
    const xs = tx0 + c.x / 25000 * (tx1 - tx0);
    D.glowLine(s, [[tx0, ty], [xs, ty]], C.light, 0.8 * a, 2);
    g.fillStyle = `rgba(190,140,80,${a})`; g.fillRect(xs - 5, ty - 12, 10, 10);
    if (c.v === 0) D.text(s, 'stopped after 22 km', xs, ty - fs * 1.6, fs - 1, a * smooth((t - T_CRATE_STOPS) / 0.6), D.sans(fs - 1, 600), C.light);
  }

  // ---------- after: the Earth going round the Sun without turning ----------
  function drawOrbit(s, t, tau, a) {
    if (a <= 0) return;
    const { g } = s, { cx, cy, Re, fs } = L;
    const Ro = Re * 0.95, sunR = Math.max(8, Re * 0.13), er = Math.max(9, Re * 0.15);
    D.glowDot(s, cx, cy, sunR * 3.2, '255,190,80', a);
    g.fillStyle = `rgba(255,236,170,${a})`; g.beginPath(); g.arc(cx, cy, sunR * 0.75, 0, 7); g.fill();
    g.setLineDash([3, 5]); g.strokeStyle = `rgba(170,182,220,${0.4 * a})`; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, Ro, 0, 7); g.stroke(); g.setLineDash([]);
    const psi = 2 * Math.PI * (tau - TAU_STOP) / YEAR - 0.3, ex = cx + Ro * Math.cos(psi), ey = cy - Ro * Math.sin(psi);
    // the Earth: lit on the side facing the Sun
    const sx = cx - ex, sy = cy - ey, sl = Math.hypot(sx, sy) || 1;
    g.save(); g.globalAlpha = a;
    g.fillStyle = 'rgba(25,40,80,1)'; g.beginPath(); g.arc(ex, ey, er, 0, 7); g.fill();
    const ang = Math.atan2(sy, sx);
    g.fillStyle = 'rgba(110,170,255,1)'; g.beginPath(); g.arc(ex, ey, er, ang - Math.PI / 2, ang + Math.PI / 2); g.closePath(); g.fill();
    g.restore();
    // a place on the equator that now always points the same way in space (up the screen)
    const mx = ex, my = ey - er, day = (0 * sx + -1 * sy) / sl > 0;
    // (sun direction from the Earth is (sx, sy); the place faces "up" on screen, i.e. (0, −1))
    D.glowDot(s, mx, my, 9, C.light, a);
    D.line(s, ex, ey, mx, my - er * 0.6, '255,214,102', 0.8 * a, 1.4);
    D.text(s, day ? 'day here' : 'night here', mx, my - er * 0.6 - fs * 0.9, fs, a, D.sans(fs, 600), day ? C.light : C.muted);
    D.text(s, 'Sun', cx, cy + sunR * 1.6 + fs * 0.5, fs - 1, 0.8 * a, D.sans(fs - 1), '255,226,160');
    const la = L.phone ? 1 - smooth((t - T_FBD + 0.8) / 0.8) : 1;           // on phones the force panel needs the room
    D.text(s, 'the Earth no longer turns', cx, Math.min(cy + Ro + er + fs * 1.6, L.capTop - fs * 0.6), fs, 0.9 * a * la, D.sans(fs, 600), C.text);
  }

  // forces on a 60 kg person at the equator: before (turning) and after (stopped)
  function drawFBD(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { p, fs, phone } = L, w = p.x1 - p.x0, h = p.y1 - p.y0;
    g.save(); g.globalAlpha = a;
    g.fillStyle = 'rgba(14,20,44,0.82)'; g.beginPath(); g.roundRect(p.x0, p.y0, w, h, 10); g.fill();
    g.restore();
    D.text(s, 'a 60 kg person on scales at the equator', p.x0 + w / 2, p.y0 + fs * 1.0, fs, a, D.sans(fs, 600), C.text);
    const cols = [[p.x0 + w * 0.27, 'turning', Math.round(M_P * (G0 - A_C)), 'resultant 2 N to the centre'], [p.x0 + w * 0.73, 'stopped', Math.round(M_P * G0), 'resultant 0']];
    const cy0 = p.y0 + h * (phone ? 0.55 : 0.52), al = Math.min(h * (phone ? 0.22 : 0.28), 70), yName = p.y0 + fs * 2.5;
    for (const [x, name, n, res] of cols) {
      D.text(s, name, x - fs * 0.6, yName, fs, a, D.sans(fs, 600), C.muted, 'right');
      g.fillStyle = `rgba(220,225,245,${a})`; g.beginPath(); g.arc(x, cy0, 6, 0, 7); g.fill();
      D.arrow(s, x, cy0 + 4, x, cy0 + al, C.force, a, '', { head: 8, width: 2.4 });
      D.arrow(s, x, cy0 - 4, x, cy0 - al, C.vel, a, '', { head: 8, width: 2.4 });
      D.text(s, `N = ${n} N`, x + fs * 0.6, cy0 - al * 0.6, fs - 1, a, D.sans(fs - 1, 600), C.vel, 'left');
      D.text(s, `mg = ${Math.round(M_P * G0)} N`, x + fs * 0.6, cy0 + al * 0.6, fs - 1, a, D.sans(fs - 1, 600), C.force, 'left');
      D.text(s, res, x, cy0 + al + fs * 1.1, fs - (phone ? 2 : 1), 0.85 * a, D.sans(fs - (phone ? 2 : 1)), C.text);
    }
    if (!phone) D.text(s, 'the difference is far too small to draw: 2 N', p.x0 + w / 2, p.y1 - fs * 0.7, fs - 2, 0.7 * a, D.sans(fs - 2), C.muted);
  }

  function drawReadout(s, t, a) {
    if (a <= 0) return;
    const { fs, phone } = L;
    D.text(s, fmtRate(rate(t), t), phone ? 10 : 16, phone ? 14 : 22, fs - 1, 0.8 * a, D.sans(fs - 1), C.muted, 'left');
    if (t > T_STOP - 4 && t < R3[0]) D.text(s, t < T_STOP ? 'the Earth is about to stop' : 'the Earth has stopped turning', phone ? 10 : 16, (phone ? 14 : 22) + fs * 1.4, fs, a * fade(t, T_STOP - 4, R3[0], 0.6, 0.6), D.sans(fs, 600), t < T_STOP ? C.text : C.light, 'left');
  }

  function endCard(s, t) {
    const a = fade(t, END, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 40, 15, 26)), s3 = Math.round(clamp(W / 60, 12, 17));
    g.font = D.sans(s1, 300);
    const head = D.wrap(s, 'If the Earth stopped spinning', W - 48);
    let y = H * (phone ? 0.13 : 0.18);
    D.text(s, head, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * head.length + s2 * 0.6;
    const items = [
      [`v = 2πR ÷ T = ${V0} m s⁻¹`, C.vel, 'Everything at the equator moves east this fast; less at higher latitudes, nothing at the poles.'],
      ['Newton\'s first law', C.neg, 'If the ground stopped, everything loose would carry on at that speed: inertia.'],
      ['one day = one year', C.light, 'A non-turning Earth would face the Sun for half a year at a time.'],
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
    D.text(s, D.wrap(s, 'A thought experiment: nothing could stop the Earth. Speeds are measured from space, relative to the Earth\'s axis; the Earth\'s orbit is taken as a circle; the crate\'s slide leaves out the push of the wind; the crate and the house are drawn bigger than to scale.', Math.min(W - 40, 760)), W / 2, Math.max(y, H * 0.78), s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('earthstop', {
    duration: DURATION,
    poster: 62,
    // score: a held breath (G, E-flat, F, D minor: a warm low triangle pad, a gentle tremolo, some wind)
    music: { chords: [[43, 50, 55, 59], [39, 46, 51, 55], [41, 48, 53, 57], [38, 45, 50, 53]], bar: 10, pad: 'triangle', cutoff: 750, drone: 0.11, wind: 0.35, tremolo: 0.18, volume: 0.48 },
    resize: layout,
    info: {
      CAPS, tauAt, tOfTau, rate, crate, TAU_STOP,
      check() {
        const out = {
          omega: OM, vEquator: VEQ, v30: vLat(30), v51_5: vLat(51.5), v60: vLat(60), vOrbit: Math.sqrt(G0 * R),
          aFriction: A_FR, tSlide: T_SLIDE, sSlide: S_SLIDE, aCentripetal: A_C, percentOfG: 100 * A_C / G0,
          scaleTurning: M_P * (G0 - A_C), scaleStopped: M_P * G0, crateStopsAt: T_CRATE_STOPS,
          fastRate: FAST, orbRate: ORB, realSecondsSlowMo: tauAt(R2[0]) - TAU_STOP,
        };
        out.capRates = CAPS.map(([a, b, txt]) => +(txt.length / (b - a)).toFixed(1));
        // in the slowed-down part, how far the crate gets across the 120 m panel
        out.crateInPanel = [54, 60, 66, 72].map((tt) => [tt, +crate(tauAt(tt)).x.toFixed(1)]);
        return out;
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      const tau = tauAt(t);
      D.background(s, 0.2);
      const { g, W, H } = s;
      for (let i = 0; i < 70; i++) {
        const sx = ((i * 9301 + 49297) % 233280) / 233280 * W, sy = ((i * 4096 + 150889) % 714025) / 714025 * H;
        g.fillStyle = `rgba(220,230,255,${0.25 + 0.2 * Math.sin(s.clock * 0.7 + i)})`; g.fillRect(sx, sy, 1.2, 1.2);
      }
      const orbA = smooth((t - R3[0]) / 2.4);
      drawTop(s, t, tau, (1 - orbA) * smooth((t - 4.0) / 0.8));
      drawOrbit(s, t, tau, orbA * (1 - smooth((t - END) / 0.8)));
      drawSide(s, t, tau, fade(t, T_PANEL, T_METER[0] + 1.0, 0.9, 0.9));
      drawMeter(s, t, tau, fade(t, T_METER[0] + 0.4, T_METER[1], 0.9, 0.9));
      drawFBD(s, t, fade(t, T_FBD, END, 0.9, 0.8));
      drawReadout(s, t, smooth((t - 5.0) / 0.9) * (1 - smooth((t - END) / 0.8)));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.82 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'If the Earth stopped spinning', 'What would happen to everything on it?');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
