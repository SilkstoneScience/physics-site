/* What would happen if you jumped on other planets? (A.1 equations of motion, A.3 energy, D.1 g = GM/r²; (HL) escape speed)
   The same jump everywhere: you leave the ground at u = 3.0 m s⁻¹ straight up (same legs). Once your feet leave the
   ground the only force is gravity (no air resistance; each world's spin ignored), so a = −g, constant over a jump
   of a few metres. Motion from suvat: height of your feet y = ut − ½gt², back down at t = 2u/g.
   g = GM/r² with G = 6.67 × 10⁻¹¹ N m² kg⁻² (all recalculated in info.check()):
     Moon     M = 7.35 × 10²² kg, r = 1.74 × 10⁶ m:  g = 4.902 × 10¹² ÷ 3.028 × 10¹² = 1.619 → 1.62 m s⁻²
     Mars     M = 6.42 × 10²³ kg, r = 3.39 × 10⁶ m:  g = 4.282 × 10¹³ ÷ 1.149 × 10¹³ = 3.726 → 3.73 m s⁻²
     Earth    M = 5.97 × 10²⁴ kg, r = 6.37 × 10⁶ m:  GM/r² = 9.81; the data booklet's g = 9.8 m s⁻² is used
     Jupiter  M = 1.90 × 10²⁷ kg, r = 7.15 × 10⁷ m (equator, at the cloud tops: it has no solid surface): g = 24.79 → 24.8 m s⁻²
   Height s = u²/2g (from v² = u² + 2as with v = 0, a = −g; or ½mu² = mgh):
     Moon 9 ÷ 3.238 = 2.78 m (2.8); Mars 9 ÷ 7.452 = 1.21 m (1.2); Earth 9 ÷ 19.6 = 0.459 m (0.46); Jupiter 9 ÷ 49.58 = 0.182 m (0.18)
   Time in the air t = 2u/g (from v = u + at with v = −u): Moon 3.71 s; Mars 1.61 s; Earth 0.612 s (0.61); Jupiter 0.242 s (0.24)
   Moon ÷ Earth: 9.8 ÷ 1.619 = 6.05, "six times higher, six times longer".
   (HL) Asteroid Bennu, treated as a sphere: M = 7.33 × 10¹⁰ kg, mean radius r = 245 m (about 490 m across), spin ignored.
     g = 6.67 × 10⁻¹¹ × 7.33 × 10¹⁰ ÷ 245² = 4.889 ÷ 60 025 = 8.15 × 10⁻⁵ m s⁻²
     v_esc = √(2GM/r) = √(2 × 4.889 ÷ 245) = √0.03991 = 0.200 m s⁻¹; 3.0 ÷ 0.200 = 15.0 times faster
     Its spin (period 4.3 h, ω = 4.06 × 10⁻⁴ rad s⁻¹) gives ω²r = 4.0 × 10⁻⁵ m s⁻² at the equator, about half of g: ignored
     (picture yourself at a pole; said on the page). g falls as you rise, so suvat no longer applies; by energy, ½v² = ½u² − GM(1/r − 1/(r + h)), so far away
     v = √(u² − v_esc²) = √(9 − 0.0399) = 2.993 m s⁻¹ (2.99). The height against time is integrated step by step.
   Every frame is drawn from the scene time alone; the jumps repeat every 5.0 s, so the picture never stops. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const NB = ' ';

  // ---------- the physics ----------
  const G = 6.67e-11, U = 3.0, PERSON = 1.75;
  const gOf = (M, r) => G * M / (r * r);
  const WORLDS = [
    { name: 'Moon', M: 7.35e22, r: 1.74e6, ground: '165,168,178', sky: '20,22,30', show: '1.62' },
    { name: 'Mars', M: 6.42e23, r: 3.39e6, ground: '186,98,62', sky: '52,30,26', show: '3.73' },
    { name: 'Earth', M: 5.97e24, r: 6.37e6, ground: '86,156,92', sky: '24,44,86', show: '9.8', g: 9.8 },
    { name: 'Jupiter', M: 1.90e27, r: 7.15e7, ground: '214,176,128', sky: '56,40,28', show: '24.8' },
  ];
  for (const w of WORLDS) {
    w.gCalc = gOf(w.M, w.r);
    if (!w.g) w.g = w.gCalc;
    w.h = U * U / (2 * w.g); w.tAir = 2 * U / w.g;
  }
  const BENNU = { M: 7.33e10, r: 245 };
  BENNU.g = gOf(BENNU.M, BENNU.r);
  BENNU.vesc = Math.sqrt(2 * G * BENNU.M / BENNU.r);
  BENNU.vFar = Math.sqrt(U * U - BENNU.vesc * BENNU.vesc);
  // height above Bennu's surface against time after jumping (RK4, 0.01 s steps, 70 s)
  const BDT = 0.01, BN = 7000, BH = new Float64Array(BN + 1), BV = new Float64Array(BN + 1);
  {
    let h = 0, v = U; const GM = G * BENNU.M, acc = (hh) => -GM / ((BENNU.r + hh) ** 2);
    BH[0] = 0; BV[0] = U;
    for (let i = 1; i <= BN; i++) {
      const k1h = v, k1v = acc(h), k2h = v + k1v * BDT / 2, k2v = acc(h + k1h * BDT / 2);
      const k3h = v + k2v * BDT / 2, k3v = acc(h + k2h * BDT / 2), k4h = v + k3v * BDT, k4v = acc(h + k3h * BDT);
      h += BDT * (k1h + 2 * k2h + 2 * k3h + k4h) / 6; v += BDT * (k1v + 2 * k2v + 2 * k3v + k4v) / 6;
      BH[i] = h; BV[i] = v;
    }
  }
  const bAt = (tt, arr) => { if (tt <= 0) return arr === BV ? U : 0; const f = Math.min(tt / BDT, BN - 1.001), k = Math.floor(f); return lerp(arr[k], arr[k + 1], f - k); };

  // ---------- captions (timed from their length: at most 15 characters a second while fully shown) ----------
  const TXT = [
    'Imagine jumping on four different worlds: the Moon, Mars, the Earth and Jupiter.',
    `Same legs, same jump: each time you leave the ground at 3.0${NB}m${NB}s⁻¹ straight up.`,
    'Predict: on which world do you jump highest? How many times higher than on the Earth?',
    'Off you go! Once your feet leave the ground, the only force on you is gravity (no air resistance).',
    'So you slow down at a constant rate g, stop for an instant at the top, then speed up on the way down.',
    `Each world has its own g${NB}=${NB}GM/r² (D.1): 1.62${NB}m${NB}s⁻² on the Moon, 3.73 on Mars, 9.8 on the Earth and 24.8 on Jupiter.`,
    `At the top v${NB}=${NB}0. Then v²${NB}=${NB}u²${NB}+${NB}2as with a${NB}=${NB}−g gives the height: s${NB}=${NB}u²${NB}÷${NB}2g (A.1).`,
    `On the Earth: s = 3.0² ÷ (2 × 9.8) = 0.46${NB}m. On the Moon: 3.0² ÷ (2 × 1.62) = 2.8${NB}m, six times higher.`,
    `On Mars, 1.2${NB}m. On Jupiter, at its cloud tops (it has no solid surface), only 0.18${NB}m.`,
    `Energy gives the same answer: ½mu²${NB}=${NB}mgh, so h${NB}=${NB}u²${NB}÷${NB}2g (A.3). Your mass cancels.`,
    `Time in the air: you land at 3.0${NB}m${NB}s⁻¹ downwards, so v${NB}=${NB}u${NB}+${NB}at gives t${NB}=${NB}2u${NB}÷${NB}g.`,
    `That is 0.61${NB}s on the Earth but 3.7${NB}s on the Moon. Height and time in the air are both inversely proportional to g.`,
    `(HL) Now a tiny world: the asteroid Bennu, about 490${NB}m across (treated as a sphere), where g is only 8.1${NB}×${NB}10⁻⁵${NB}m${NB}s⁻².`,
    `(HL) Its escape speed is v${NB}=${NB}√(2GM/r) = 0.20${NB}m${NB}s⁻¹, with M${NB}=${NB}7.33${NB}×${NB}10¹⁰${NB}kg and r${NB}=${NB}245${NB}m.`,
    `(HL) Your 3.0${NB}m${NB}s⁻¹ jump is 15 times faster than that, so you would never come back down.`,
    `(HL) Here g gets weaker as you rise, so s${NB}=${NB}u²${NB}÷${NB}2g doesn't apply. Far away you would still be moving at 2.99${NB}m${NB}s⁻¹.`,
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
  const T_JUMP0 = CA(3) + 0.4, CYCLE = 5.0;            // the four worlds jump together every 5.0 s
  const T_G = CA(5), T_H = CA(7), T_H2 = CA(8), T_T = CA(10), T_BEN = CA(12);
  const T_BJUMP = T_BEN + 3.0;                          // the jump on Bennu
  const END = CAPS[CAPS.length - 1][1] + 0.4, DURATION = END + 12;

  // feet height and whether in the air, for world w at scene time t
  const jumpState = (w, t) => {
    if (t < T_JUMP0) return { y: 0, air: false, tau: -1, k: -1 };
    const k = Math.floor((t - T_JUMP0) / CYCLE), tau = t - T_JUMP0 - k * CYCLE;
    if (tau < w.tAir) return { y: U * tau - 0.5 * w.g * tau * tau, air: true, tau, k };
    return { y: 0, air: false, tau, k };
  };

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25)), capTop = H - capFs * (phone ? 6.6 : 5.4);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    const colL = fs * 3.4 + 8, colR = W - (phone ? 6 : Math.max(10, W * 0.02)), colW = (colR - colL) / 4;
    const yHead = phone ? fs * 1.4 + 6 : Math.max(58, H * 0.14);
    const yTop = yHead + fs * (phone ? 3.4 : 2.6);
    const yG = capTop - fs * (phone ? 3.4 : 2.4);
    const k = (yG - yTop) / (2.78 + PERSON + 0.35);                     // pixels per metre
    L = { W, H, phone, capFs, capTop, fs, colL, colR, colW, yHead, yTop, yG, k };
  }

  // a simple figure, feet at (x, yf), to scale (k pixels per metre); arms up in the air
  function person(s, x, yf, k, a, air, crouch = 0, rgb = '232,236,250') {
    if (a <= 0) return;
    const { g } = s, lw = Math.max(1.6, 0.09 * k);
    const hip = yf - (0.86 - 0.18 * crouch) * k, neck = hip - 0.56 * k, head = neck - 0.15 * k;
    g.save(); g.globalCompositeOperation = 'source-over'; g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = `rgba(${rgb},${a})`; g.fillStyle = `rgba(${rgb},${a})`; g.lineWidth = lw;
    const knee = 0.1 * k * (0.3 + crouch);
    g.beginPath(); g.moveTo(x - 0.12 * k, yf); g.lineTo(x - 0.06 * k - knee, (yf + hip) / 2); g.lineTo(x, hip);
    g.lineTo(x + 0.06 * k + knee, (yf + hip) / 2); g.lineTo(x + 0.12 * k, yf); g.stroke();
    g.beginPath(); g.moveTo(x, hip); g.lineTo(x, neck); g.stroke();
    const sh = neck + 0.06 * k, arm = 0.5 * k;
    if (air) { g.beginPath(); g.moveTo(x - 0.28 * k, sh - arm * 0.8); g.lineTo(x, sh); g.lineTo(x + 0.28 * k, sh - arm * 0.8); g.stroke(); }
    else { g.beginPath(); g.moveTo(x - 0.16 * k, sh + arm * 0.85); g.lineTo(x, sh); g.lineTo(x + 0.16 * k, sh + arm * 0.85); g.stroke(); }
    g.beginPath(); g.arc(x, head, Math.max(2.5, 0.13 * k), 0, 7); g.fill();
    g.restore();
  }

  // ---------- the four worlds ----------
  function drawWorlds(s, t, A) {
    if (A <= 0) return;
    const { g } = s, { colL, colW, yHead, yTop, yG, k, fs, phone } = L;
    // the height scale, beside the first column
    const ax = colL - 5;
    D.line(s, ax, yG, ax, yG - 3 * k, C.muted, 0.6 * A, 1.2);
    for (let m = 0; m <= 3; m++) {
      D.line(s, ax - 4, yG - m * k, ax, yG - m * k, C.muted, 0.6 * A, 1);
      D.text(s, `${m}${NB}m`, ax - 6, yG - m * k, fs - 1, 0.75 * A, D.sans(fs - 1), C.muted, 'right');
    }
    D.text(s, phone ? 'feet' : 'height of feet', ax - 4, yG - 3 * k - fs * 1.1, fs - 1, 0.7 * A, D.sans(fs - 1), C.muted, 'left');
    WORLDS.forEach((w, i) => {
      const x0 = colL + i * colW, xc = x0 + colW / 2, pad = Math.max(3, colW * 0.04);
      const xp = phone ? x0 + colW * 0.34 : xc;                         // phones: the figure left of centre, clear of the height label
      // the column: a tinted sky and the ground
      g.globalCompositeOperation = 'source-over';
      const sky = g.createLinearGradient(0, yTop, 0, yG);
      sky.addColorStop(0, `rgba(${w.sky},0)`); sky.addColorStop(1, `rgba(${w.sky},${0.85 * A})`);
      g.fillStyle = sky; g.fillRect(x0 + pad, yTop - fs, colW - 2 * pad, yG - yTop + fs);
      g.fillStyle = `rgba(${w.ground},${0.85 * A})`;
      if (w.name === 'Jupiter') {                                       // cloud tops, not a surface
        g.beginPath(); g.moveTo(x0 + pad, yG + 7);
        for (let xx = 0; xx <= colW - 2 * pad; xx += 2) g.lineTo(x0 + pad + xx, yG + 1.5 * Math.sin(xx / 6 + s.clock * 0.6));
        g.lineTo(x0 + colW - pad, yG + 7); g.closePath(); g.fill();
      } else g.fillRect(x0 + pad, yG, colW - 2 * pad, 6);
      // name and g
      D.text(s, w.name, xc, yHead, fs + 2, A, D.sans(fs + 2, 600), w.ground);
      const ga = A * smooth((t - T_G) / 0.8);
      if (phone) {
        D.text(s, `g${NB}=${NB}${w.show}`, xc, yHead + fs * 1.4, fs, ga, D.sans(fs), C.force);
        D.text(s, 'm s⁻²', xc, yHead + fs * 2.5, fs - 1, 0.8 * ga, D.sans(fs - 1), C.force);
      } else D.text(s, `g = ${w.show}${NB}m${NB}s⁻²`, xc, yHead + fs * 1.4, fs, ga, D.sans(fs), C.force);
      // the peak height, marked once its caption has said it
      const showH = i === 0 || i === 2 ? T_H : T_H2, ha = A * smooth((t - showH) / 0.8);
      if (ha > 0) {
        const yp = yG - w.h * k;
        D.line(s, x0 + pad, yp, x0 + colW - pad, yp, C.light, 0.6 * ha, 1, [4, 4]);
        D.text(s, `${w.h < 1 ? w.h.toFixed(2) : w.h.toFixed(1)}${NB}m`, x0 + colW - pad - 2, yp - fs * 0.75, fs, ha, D.sans(fs, 600), C.light, 'right');
      }
      // the jumper
      const st = jumpState(w, t);
      // a small crouch just before each take-off and just after landing (drawing only: the physics starts at take-off)
      let crouch = 0;
      if (!st.air) {
        const toJump = st.tau < 0 ? T_JUMP0 - t : CYCLE - st.tau;
        crouch = smooth(1 - toJump / 0.35);
        if (st.tau >= 0) crouch = Math.max(crouch, 0.6 * (1 - smooth((st.tau - w.tAir) / 0.3)));
      }
      person(s, xp, yG - st.y * k, k, A, st.air, crouch);
      // velocity arrow while in the air (0.3 m on the height scale per m s⁻¹)
      if (st.air) {
        const v = U - w.g * st.tau, len = v * 0.3 * k, yf = yG - st.y * k;
        if (Math.abs(len) > 5) D.arrow(s, xp + colW * 0.28, yf - 0.9 * k, xp + colW * 0.28, yf - 0.9 * k - len, C.vel, A * smooth((t - CA(3)) / 0.8), '', { head: 7, width: 2 });
      }
      // time in the air: counts while airborne, then holds until the next jump
      const ta = A * smooth((t - T_T) / 0.8);
      if (ta > 0 && st.tau >= 0) {
        const shown = Math.min(st.tau, w.tAir);
        const tx = `${shown.toFixed(2)}${NB}s`;
        if (phone) {
          D.text(s, 'in the air', xc, yG + fs * 1.4, fs - 1, 0.75 * ta, D.sans(fs - 1), C.muted);
          D.text(s, tx, xc, yG + fs * 2.5, fs, ta, D.sans(fs, 600), C.text);
        } else D.text(s, `in the air: ${tx}`, xc, yG + fs * 1.5, fs, ta, D.sans(fs), C.text);
      }
    });
  }

  // ---------- (HL) Bennu ----------
  let bseed = 4101;                                         // boulders scattered over the face (seeded, so always the same)
  const brnd = () => { bseed = (bseed * 16807) % 2147483647; return bseed / 2147483647; };
  const BUMPS = Array.from({ length: 26 }, () => ({ th: brnd() * Math.PI * 2, rr: 0.88 * Math.sqrt(brnd()), sz: 0.03 + 0.045 * brnd() }));
  const radiusAt = (th) => 1 + 0.035 * Math.sin(3 * th + 1) + 0.025 * Math.sin(7 * th + 2) + 0.05 * Math.cos(2 * th);   // a slightly lumpy outline (the physics treats Bennu as a sphere)
  function drawBennu(s, t, A) {
    if (A <= 0) return;
    const { g } = s, { W, capTop, fs, phone } = L;
    const RB = Math.min(W * (phone ? 0.3 : 0.17), capTop * 0.3), cx = phone ? W * 0.62 : W * 0.36, cy = capTop - RB * 1.15;
    const kb = RB / BENNU.r;                                              // pixels per metre, to scale
    g.globalCompositeOperation = 'source-over';
    const rg = g.createRadialGradient(cx - RB * 0.3, cy - RB * 0.35, RB * 0.1, cx, cy, RB);
    rg.addColorStop(0, `rgba(120,116,112,${A})`); rg.addColorStop(1, `rgba(58,56,56,${A})`);
    g.fillStyle = rg; g.beginPath();
    for (let i = 0; i <= 96; i++) { const th = i / 96 * Math.PI * 2, r = RB * radiusAt(th); i ? g.lineTo(cx + r * Math.cos(th), cy - r * Math.sin(th)) : g.moveTo(cx + r * Math.cos(th), cy - r * Math.sin(th)); }
    g.fill();
    for (const b of BUMPS) { g.fillStyle = `rgba(150,146,140,${0.55 * A})`; g.beginPath(); g.arc(cx + RB * b.rr * Math.cos(b.th), cy - RB * b.rr * Math.sin(b.th), RB * b.sz, 0, 7); g.fill(); }
    D.text(s, 'Bennu (to scale)', cx, cy + RB * 1.05 + fs * 0.4, fs, 0.8 * A, D.sans(fs), C.muted);
    // you: drawn far bigger than to scale, standing on the top
    const top = cy - RB * radiusAt(Math.PI / 2), tt = t - T_BJUMP;
    const h = bAt(tt, BH), v = bAt(tt, BV), yf = top - h * kb;
    if (tt > 0) D.line(s, cx, top, cx, yf, C.light, 0.5 * A, 1, [2, 4]);
    const crouch = tt < 0 && tt > -0.35 ? smooth((tt + 0.35) / 0.25) : 0;
    person(s, cx, yf, Math.max(18, RB * 0.2), A, tt > 0, crouch);
    if (tt > 0) D.arrow(s, cx + RB * 0.14, yf - RB * 0.14, cx + RB * 0.14, yf - RB * 0.14 - Math.max(10, RB * 0.22), C.vel, A, '', { head: 7, width: 2 });
    D.text(s, phone || W < 900 ? 'you (not to scale)' : 'you (drawn far bigger than to scale)', cx + RB * 0.24, yf - RB * 0.12, fs - 1, 0.75 * A * fade(t, T_BEN, T_BEN + 14, 1, 1), D.sans(fs - 1), C.muted, 'left');
    // readouts
    const py = phone ? 18 + fs : Math.max(64, capTop * 0.2), lh = fs * 1.6;
    const rows = [
      [`g at the surface: 8.1${NB}×${NB}10⁻⁵${NB}m${NB}s⁻²`, C.force, T_BEN],
      [`escape speed: ${BENNU.vesc.toFixed(2)}${NB}m${NB}s⁻¹`, C.light, CA(13)],
      [`height: ${h < 10 ? h.toFixed(1) : Math.round(h)}${NB}m`, C.text, T_BJUMP],
      [`speed: ${v.toFixed(3)}${NB}m${NB}s⁻¹`, C.vel, T_BJUMP],
      [`time since jumping: ${Math.max(0, tt).toFixed(1)}${NB}s`, C.muted, T_BJUMP],
    ];
    g.font = D.sans(fs + 1, 600);
    const widest = Math.max(...rows.map((r) => g.measureText(r[0]).width));
    const px = phone ? 12 : Math.min(W * 0.6, W - widest - 14);
    rows.forEach(([txt, rgb, from], i) => D.text(s, txt, px, py + i * lh, fs + 1, A * smooth((t - from) / 0.8), D.sans(fs + 1, i < 2 ? 600 : 400), rgb, 'left'));
    g.globalCompositeOperation = 'source-over';
    // the HL pill
    g.font = D.sans(fs, 700); const w = g.measureText('HL').width + fs;
    g.fillStyle = `rgba(242,140,40,${0.9 * A})`; g.beginPath(); g.roundRect(phone ? W - w - 10 : 14, 22 - fs * 0.75, w, fs * 1.5, fs * 0.75); g.fill();     // phones: top right (the buttons are below)
    D.text(s, 'HL', (phone ? W - w - 10 : 14) + w / 2, 22, fs, A, D.sans(fs, 700), '20,20,30');
  }

  function endCard(s, t) {
    const a = fade(t, END, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 40, 15, 26)), s3 = Math.round(clamp(W / 60, 12, 17));
    g.font = D.sans(s1, 300);
    const head = D.wrap(s, 'The same jump on other worlds', W - 48);
    let y = H * (phone ? 0.13 : 0.18);
    D.text(s, head, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * head.length + s2 * 0.6;
    const items = [
      ['s = u²/2g', C.light, 'Same take-off speed: the height is inversely proportional to g.'],
      ['t = 2u/g', C.text, 'The time in the air is inversely proportional to g too.'],
      ['√(2GM/r)', '242,140,40', '(HL) Jump faster than the escape speed and you never come back.'],
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
    D.text(s, D.wrap(s, 'Take-off speed 3.0 m s⁻¹ everywhere; no air resistance; each world\'s spin ignored. Jupiter has no solid surface: its g is at the cloud tops.', Math.min(W - 40, 760)), W / 2, Math.max(y, H * 0.78), s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('jumps', {
    duration: DURATION,
    poster: CA(8) + 1.5,
    // score: light gravity (E-flat major, low and soft: a triangle pad, a gentle drone, a little wind and shimmer)
    music: { chords: [[36, 43, 48, 51], [41, 48, 53, 56], [34, 41, 46, 50], [39, 46, 51, 55]], bar: 9, pad: 'triangle', cutoff: 800, drone: 0.1, wind: 0.25, shimmer: 0.15, tremolo: 0.15, volume: 0.54 },
    resize: layout,
    info: {
      CAPS, WORLDS, BENNU, jumpState, T_JUMP0, CYCLE, T_BJUMP, DURATION,
      check() {
        const out = { worlds: WORLDS.map((w) => ({ name: w.name, gCalc: +w.gCalc.toFixed(3), gUsed: +w.g.toFixed(3), h: +w.h.toFixed(3), tAir: +w.tAir.toFixed(3) })) };
        out.moonOverEarth = +(9.8 / WORLDS[0].g).toFixed(2);
        out.bennu = { g: BENNU.g, vesc: BENNU.vesc, ratio: U / BENNU.vesc, vFar: BENNU.vFar, h30: bAt(30, BH), v30: bAt(30, BV), v70: BV[BN] };
        out.capRates = CAPS.map(([a, b, txt]) => +(txt.length / (b - a - 1.2)).toFixed(1));
        out.jumpsBeforeBennu = Math.floor((T_BEN - T_JUMP0) / CYCLE);
        return out;
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.18);
      const { g, W, H } = s;
      for (let i = 0; i < 60; i++) {
        const sx = ((i * 9301 + 49297) % 233280) / 233280 * W, sy = ((i * 4096 + 150889) % 714025) / 714025 * H * 0.6;
        g.fillStyle = `rgba(220,230,255,${0.2 + 0.15 * Math.sin(s.clock * 0.6 + i)})`; g.fillRect(sx, sy, 1.2, 1.2);
      }
      drawWorlds(s, t, fade(t, 4.4, T_BEN + 0.6, 0.9, 1.0));
      drawBennu(s, t, fade(t, T_BEN + 0.2, END + 0.2, 1.0, 0.8));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Jumping on other worlds', 'What would happen if you jumped on the Moon, Mars or Jupiter?');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
