/* D.2 Millikan's oil-drop experiment: a charged oil drop between two horizontal plates is held still by
   adjusting the p.d., so qE = mg; many simulated drops show that charge comes in whole-number steps of e.
   Numbers (checked in info.check()):
   - Plates d = 6.0 mm = 6.0 × 10⁻³ m apart. Drop mass m = 3.2 × 10⁻¹⁵ kg, g = 9.8 m s⁻² (as on the site).
   - Balanced at V = 294 V: E = V/d = 294 ÷ 0.0060 = 4.9 × 10⁴ V m⁻¹.
   - q = mg/E = (3.2 × 10⁻¹⁵ × 9.8) ÷ (4.9 × 10⁴) = 3.136 × 10⁻¹⁴ ÷ 4.9 × 10⁴ = 6.4 × 10⁻¹⁹ C.
   - n = 6.4 × 10⁻¹⁹ ÷ 1.60 × 10⁻¹⁹ = 4 extra electrons (the notes' worked example has 3, with other numbers).
   - Page only: with oil of density 900 kg m⁻³ the drop's volume is 3.2 × 10⁻¹⁵ ÷ 900 = 3.56 × 10⁻¹⁸ m³, radius
     (3V/4π)^(1/3) = 9.5 × 10⁻⁷ m, so it is about 1.9 µm across. Its terminal speed in air, from Stokes' law
     F_d = 6πηrv (A.2) with η = 1.8 × 10⁻⁵ Pa s, is mg ÷ 6πηr = 3.136 × 10⁻¹⁴ ÷ 3.21 × 10⁻¹⁰ = 9.8 × 10⁻⁵ m s⁻¹ = 0.098 mm s⁻¹.
   - Too big a p.d.: at 500 V the drop rises at 0.098 × (500/294 − 1) = 0.069 mm s⁻¹.
   Motion: drops this small always move at their terminal speed, which is proportional to the resultant of weight and
   electric force: v = v₀(1 − V/V_b), where V_b is the p.d. that balances that drop. So y(t) = y₀ − v₀[(t − t₀) − ∫V dt / V_b].
   The microscope view is 2.6 mm high and shows the drops at about real speed.
   The 40 charges in the dot plot are simulated: q = n × 1.60 × 10⁻¹⁹ C with a 2.5% measurement scatter (seeded). */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- physics ----------
  const E_CH = 1.60e-19, G = 9.8, D_M = 6.0e-3, M = 3.2e-15, V_B = 294, V0 = 0.098;   // V0 in mm per second
  const E_FIELD = V_B / D_M, Q = M * G / E_FIELD, N_E = Q / E_CH;
  const DURATION = 132;
  // the p.d. (volts) against scene time: off, turned up past balance (the drop rises), then back to the balance value
  // (it passes the balancing 294 V at about 46.0 s, just as the "too big a p.d." caption starts)
  const V_TOP = 500;
  const Vat = (t) => t < 41.6 ? 0 : t < 49.4 ? V_TOP * smooth((t - 41.6) / 7.8) : t < 50.4 ? V_TOP : t < 53.4 ? lerp(V_TOP, V_B, smooth((t - 50.4) / 3)) : V_B;
  // ∫V dt, tabulated once (so every frame depends on t alone)
  const DT = 0.01, NI = Math.ceil(DURATION / DT) + 2, IV = new Float64Array(NI);
  for (let i = 1; i < NI; i++) IV[i] = IV[i - 1] + 0.5 * (Vat((i - 1) * DT) + Vat(i * DT)) * DT;
  const Iat = (t) => { const f = clamp(t / DT, 0, NI - 1.001), k = Math.floor(f); return lerp(IV[k], IV[k + 1], f - k); };
  // the watched drop: it comes to rest at y = −0.35 mm (centre of the view is 0; the view spans ±1.3 mm)
  const VIEW = 1.3, T0 = 28, T_STILL = 54, Y_REST = -0.35;
  const disp = (v0, vb, ta, tb) => v0 * ((tb - ta) - (Iat(tb) - Iat(ta)) / vb);   // distance fallen from ta to tb
  const Y0 = Y_REST + disp(V0, V_B, T0, T_STILL);
  const yDrop = (t) => Y0 - disp(V0, V_B, T0, t);
  const vDrop = (t) => V0 * (1 - Vat(t) / V_B);
  // other drops in the view: different sizes (terminal speeds) and charges (balancing p.d.)
  const OTHERS = [[-0.62, 0.064, 190, 26.0, 0.95], [-0.36, 0.095, 520, 25.0, 0.35], [0.30, 0.052, 140, 27.5, 0.80],
    [0.55, 0.11, 700, 24.0, 0.10], [0.66, 0.072, 260, 30.0, 1.05], [-0.18, 0.058, 380, 33.0, 1.05]];
  const yOther = (o, t) => o[4] - disp(o[1], o[2], o[3], t);

  // ---------- the simulated measurements ----------
  let seed = 4021;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  const COUNTS = [5, 9, 10, 8, 5, 3];                                  // how many drops carry 1e … 6e
  const DOTS = (() => {
    const ns = []; COUNTS.forEach((c, i) => { for (let k = 0; k < c; k++) ns.push(i + 1); });
    ns.splice(ns.indexOf(4), 1);                                       // the first dot is our drop (4e)
    for (let i = ns.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ns[i], ns[j]] = [ns[j], ns[i]]; }
    const out = [{ n: 4, q: N_E * 1.6 }];
    for (const n of ns) out.push({ n, q: n * 1.6 * (1 + 0.025 * clamp(gauss(), -2.5, 2.5)) });
    const rank = {}; out.forEach((d) => { d.rank = rank[d.n] = (rank[d.n] ?? -1) + 1; });
    return out;
  })();
  const T_DOTS = 85, DOT_STEP = 0.4;

  // ---------- captions (no pauses: each caption stays up long enough to read) ----------
  const NB = ' ';
  const CAPS = [
    [4.8, 11.0, 'Millikan\'s experiment: two horizontal metal plates, 6.0 mm apart, with an oil spray above them.'],
    [11.2, 17.6, 'As the drops leave the nozzle, friction charges them. Many gain a few extra electrons; others lose some.'],
    [17.8, 23.0, 'Some drops fall through a small hole in the top plate, into the gap between the plates.'],
    [23.2, 28.6, 'A light shines across the gap, and one drop is watched through a microscope.'],
    [28.8, 35.2, 'With no p.d. across the plates, the drop falls slowly at a steady speed: its terminal speed.'],
    [35.4, 41.6, `Air resistance balances its weight. Using Stokes' law, this speed gives its mass: m${NB}=${NB}3.2${NB}×${NB}10⁻¹⁵${NB}kg.`],
    [41.8, 46.0, 'Now the top plate is made positive, pulling the negative drop upwards.'],
    [46.1, 54.0, `Too big a p.d. and the drop rises. Adjust it until the drop hangs still: qE${NB}=${NB}mg.`],
    [54.2, 60.6, `Here the p.d. is 294${NB}V, so E${NB}=${NB}V/d${NB}=${NB}294${NB}÷${NB}0.0060${NB}=${NB}4.9${NB}×${NB}10⁴${NB}V${NB}m⁻¹.`],
    [60.8, 67.6, `So q${NB}=${NB}mg/E${NB}=${NB}(3.2${NB}×${NB}10⁻¹⁵${NB}×${NB}9.8) ÷ (4.9${NB}×${NB}10⁴) = 6.4${NB}×${NB}10⁻¹⁹${NB}C.`],
    [67.8, 73.8, `6.4${NB}×${NB}10⁻¹⁹ ÷ 1.60${NB}×${NB}10⁻¹⁹ = 4, so this drop has gained 4 extra electrons.`],
    [74.0, 84.0, 'Predict: Millikan measured many drops. Could a drop carry any amount of charge at all?'],
    [84.2, 90.6, 'These are 40 simulated measurements, one dot for each drop. The first is our drop.'],
    [90.8, 97.6, `They bunch at 1.6, 3.2, 4.8, 6.4 … ×${NB}10⁻¹⁹${NB}C: whole-number multiples of one value.`],
    [97.8, 104.4, `No drop has 2.4${NB}×${NB}10⁻¹⁹${NB}C, half-way between 1.6 and 3.2. Charge comes in steps.`],
    [104.6, 111.4, `Charge is quantised: q${NB}=${NB}ne, where e${NB}=${NB}1.60${NB}×${NB}10⁻¹⁹${NB}C is the elementary charge.`],
    [111.6, 118.6, 'An electron has charge −e and a proton +e. Every free charge ever measured is a whole number of e.'],
  ];
  const END_CARD = 119;

  // ---------- colours ----------
  const DROP = C.light, OIL = '232,206,150', PLATE = '170,182,220', BEAM = '255,230,160', DRAG = '150,172,215';

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25)), capTop = H - capFs * (phone ? 6.6 : 5.4);
    const fs = phone ? 10 : Math.round(clamp(W / 80, 11, 16));
    let box, mic, hist;
    if (phone) {
      box = { x0: 8, y0: 8, x1: W - 8, y1: Math.round(H * 0.34) };
      const top = box.y1 + fs * 2.4, R = Math.max(30, Math.min(W * 0.3, (capTop - top - fs * 3.2) / 2));
      mic = { cx: W / 2, cy: top + R, R };
      hist = { x0: 14, x1: W - 14, y0: box.y1 + fs * 1.4, y1: capTop - fs * 3.4 };
    } else {
      box = { x0: Math.round(W * 0.03), y0: Math.max(14, Math.round(H * 0.05)), x1: Math.round(W * 0.52), y1: Math.round(capTop - fs * 0.6) };
      const px0 = W * 0.56, px1 = W * 0.97, top = Math.max(56, H * 0.13) + fs * 1.6, bot = capTop - fs * 2.6;
      const R = Math.max(30, Math.min((px1 - px0) / 2 - fs * 2.4, (bot - top) / 2));      // room for the scale on the right
      mic = { cx: (px0 + px1) / 2 - fs * 1.2, cy: (top + bot) / 2, R };
      hist = { x0: px0 + fs * 1.2, x1: px1 - fs * 0.4, y0: Math.max(58, H * 0.14), y1: capTop - fs * 3.4 };
    }
    L = { W, H, phone, fs, capFs, capTop, box, mic, hist };
  }

  // text made of pieces: [text, style]: 'i' italic serif, 'r' upright serif, 'sup' raised and smaller (upright), 'sans'
  function rich(s, parts, x, y, size, a, rgb = C.text, align = 'center') {
    const { g } = s; if (a <= 0) return 0;
    const font = (st) => st === 'sup' ? D.serif(Math.round(size * 0.68), false) : st === 'i' ? D.serif(size) : st === 'r' ? D.serif(size, false) : D.sans(Math.round(size * 0.9));
    const ws = parts.map(([tx, st]) => { g.font = font(st); return g.measureText(tx).width; });
    const total = ws.reduce((p, q) => p + q, 0);
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`;
    parts.forEach(([tx, st], i) => { g.font = font(st); g.fillText(tx, px, st === 'sup' ? y - size * 0.36 : y); px += ws[i]; });
    g.shadowBlur = 0;
    return total;
  }

  // ---------- the apparatus (side view, not to scale) ----------
  function drawApparatus(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { box: b, fs } = L, cw = b.x1 - b.x0, ch = b.y1 - b.y0;
    const px0 = b.x0 + 0.2 * cw, px1 = b.x0 + 0.8 * cw, yT = b.y0 + 0.44 * ch, yB = b.y0 + 0.76 * ch, mid = (yT + yB) / 2;
    const hole = 0.045 * cw, hx = (px0 + px1) / 2, pt = Math.max(3, ch * 0.022);
    const V = Vat(t), on = V > 1, fOn = clamp(V / 300, 0, 1);
    g.globalAlpha = a;
    // the spray chamber above the plates
    const chY0 = b.y0 + 0.05 * ch;
    D.line(s, px0 - 0.04 * cw, chY0, px1 + 0.04 * cw, chY0, PLATE, 0.25, 1, [4, 4]);
    D.line(s, px0 - 0.04 * cw, chY0, px0 - 0.04 * cw, yT, PLATE, 0.25, 1, [4, 4]);
    D.line(s, px1 + 0.04 * cw, chY0, px1 + 0.04 * cw, yT, PLATE, 0.25, 1, [4, 4]);
    // the atomizer: a rubber bulb and a nozzle pointing into the chamber
    const nzY = b.y0 + 0.17 * ch, nzX = px0 + 0.06 * cw, bR = Math.min(0.06 * cw, 0.09 * ch);
    const squeeze = t > 6 && t < END_CARD ? 1 - 0.12 * Math.max(0, Math.sin(t * 4.2)) : 1;
    g.fillStyle = 'rgba(150,60,70,0.9)'; g.beginPath(); g.ellipse(b.x0 + 0.06 * cw + bR, nzY, bR * squeeze, bR * 0.8, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(190,200,230,0.85)'; g.fillRect(b.x0 + 0.06 * cw + bR * 1.8, nzY - bR * 0.18, nzX - (b.x0 + 0.06 * cw + bR * 1.8), bR * 0.36);
    D.text(s, 'atomizer', b.x0 + 0.06 * cw + bR, nzY + bR + fs * 0.9, fs, 0.75 * a, D.sans(fs), C.muted);
    // oil drops from the nozzle: each drifts out, slows and settles slowly (drawn enlarged, speeds not to scale)
    if (t > 6) for (let k = Math.max(0, Math.floor((t - 19) / 0.12)); k < 950; k++) {    // only the drops alive now
      const born = 6 + k * 0.12, age = t - born; if (age < 0 || age > 13 || born > END_CARD) continue;
      const r1 = ((k * 7919) % 101) / 101, r2 = ((k * 104729) % 97) / 97, toHole = k % 6 === 0;
      const reach = toHole ? hx - nzX : (0.15 + 0.6 * r1) * (px1 - nzX);
      const x = nzX + reach * (1 - Math.exp(-age / 0.7)) + Math.sin(age * 0.9 + k) * 2;
      const sink = (toHole ? 0.06 : 0.025 + 0.02 * r2) * ch;
      let y = nzY + (r2 - 0.5) * ch * 0.08 + sink * age;
      let al = smooth(age / 0.3) * (1 - smooth((age - 11) / 2)) * 0.8;
      if (!toHole && y > yT - pt * 1.5) { y = yT - pt * 1.5; al *= 0.5; }               // settles on the top plate
      if (toHole && y > yT + pt) al *= 1 - smooth((y - yT) / (0.08 * ch));              // through the hole, then out of sight
      if (y > yB) continue;
      g.fillStyle = `rgba(${OIL},${al})`; g.beginPath(); g.arc(x, y, Math.max(1.2, cw * 0.004), 0, 7); g.fill();
      if (k % 3 === 0 && t > 11 && t < 23) D.text(s, '−', x + 4, y - 4, Math.max(8, fs - 2), al * 0.9 * fade(t, 11, 23, 0.6, 0.6), D.sans(Math.max(8, fs - 2), 700), C.neg);
    }
    // the light and its beam across the gap
    const lx = b.x0 + 0.02 * cw, lw = 0.07 * cw, beamA = fade(t, 23, END_CARD + 1, 0.8, 0.8);
    g.fillStyle = 'rgba(90,96,120,0.95)'; g.fillRect(lx, mid - 0.05 * ch, lw, 0.1 * ch);
    if (beamA > 0) {
      const gr = g.createLinearGradient(lx + lw, 0, px1, 0);
      gr.addColorStop(0, `rgba(${BEAM},${0.22 * beamA})`); gr.addColorStop(1, `rgba(${BEAM},0)`);
      g.fillStyle = gr; g.beginPath(); g.moveTo(lx + lw, mid - 0.03 * ch); g.lineTo(px1, mid - 0.07 * ch); g.lineTo(px1, mid + 0.07 * ch); g.lineTo(lx + lw, mid + 0.03 * ch); g.fill();
    }
    D.text(s, 'light', lx + lw / 2, mid - 0.05 * ch - fs * 0.8, fs, 0.75 * a, D.sans(fs), C.muted);
    // the microscope, looking into the gap from the right
    const mx0 = px1 + 0.03 * cw, mx1 = b.x1 - 0.005 * cw;
    g.fillStyle = 'rgba(120,128,160,0.95)'; g.fillRect(mx0, mid - 0.035 * ch, mx1 - mx0, 0.07 * ch);
    g.fillRect(mx0, mid - 0.05 * ch, 0.02 * cw, 0.1 * ch);
    D.text(s, 'microscope', (mx0 + mx1) / 2, mid + 0.05 * ch + fs * 0.9, fs, 0.75 * a, D.sans(fs), C.muted);
    // where the "d = 6.0 mm" label starts (field lines stop short of it)
    const dx = px1 - 0.05 * cw, dLabel = `d${NB}=${NB}6.0${NB}mm`;
    g.font = D.sans(fs); const dLabelX0 = dx - 6 - g.measureText(dLabel).width;
    // field lines between the plates (downwards, from + to −) once the p.d. is on
    if (fOn > 0) for (let i = 1; i < 9; i++) {
      const x = lerp(px0, px1, i / 9); if (Math.abs(x - hx) < hole) continue;              // keep clear of the hole
      D.arrow(s, x, yT + pt * 1.5, x, yB - pt * 1.5, C.field, 0.35 * fOn, '', { head: 6, width: 1.2, blur: 4 });
    }
    // the plates (+ top, − bottom when on)
    const plate = (y, sign, rgb) => {
      g.fillStyle = `rgba(${on ? rgb : PLATE},0.9)`;
      if (sign === '+') { g.fillRect(px0, y - pt, hx - hole / 2 - px0, pt * 2); g.fillRect(hx + hole / 2, y - pt, px1 - hx - hole / 2, pt * 2); }
      else g.fillRect(px0, y - pt, px1 - px0, pt * 2);
      if (on) D.text(s, sign, px0 - fs * 0.7, y, fs + 3, fOn, D.sans(fs + 3, 700), rgb);
    };
    plate(yT, '+', C.pos); plate(yB, '−', C.neg);
    D.text(s, 'hole', hx, yT - pt - fs * 0.7, fs - 1, 0.6 * fade(t, 17, 30, 0.5, 0.8), D.sans(fs - 1), C.muted);
    // d bracket inside the right end of the gap
    D.line(s, dx, yT + pt, dx, yB - pt, C.muted, 0.6, 1); D.line(s, dx - 4, yT + pt, dx + 4, yT + pt, C.muted, 0.6, 1); D.line(s, dx - 4, yB - pt, dx + 4, yB - pt, C.muted, 0.6, 1);
    const dY = mid + (L.phone ? 0 : fs * 1.2);                     // a dark backing so field lines don't run through the label
    g.fillStyle = 'rgba(6,9,20,0.85)'; g.beginPath(); g.roundRect(dLabelX0 - 3, dY - fs * 0.75, dx - 6 - dLabelX0 + 6, fs * 1.5, 4); g.fill();
    D.text(s, dLabel, dx - 6, mid + (L.phone ? 0 : fs * 1.2), fs, 0.8, D.sans(fs), C.muted, 'right');
    // the part of the gap the microscope sees, and the watched drop in it
    const fovH = (yB - yT) * (2 * VIEW / 6.0), fovX = hx - 0.06 * cw, fa = fade(t, 23.2, END_CARD + 1, 0.8, 0.8);
    if (fa > 0) {
      g.strokeStyle = `rgba(${DROP},${0.5 * fa})`; g.lineWidth = 1; g.setLineDash([3, 3]);
      g.strokeRect(fovX - 0.04 * cw, mid - fovH / 2, 0.08 * cw, fovH); g.setLineDash([]);
      const y = yDrop(t);
      if (Math.abs(y) < VIEW) D.glowDot(s, fovX, mid - (y / VIEW) * (fovH / 2), Math.max(5, cw * 0.012), DROP, fa);
    }
    // the variable supply and its wires
    const sy = b.y1 - 0.06 * ch, sw = Math.max(70, 0.26 * cw), sx = hx - sw / 2;
    g.strokeStyle = `rgba(${PLATE},0.55)`; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(px0, yT); g.lineTo(px0 - 0.05 * cw, yT); g.lineTo(px0 - 0.05 * cw, sy); g.lineTo(sx, sy); g.stroke();
    g.beginPath(); g.moveTo(px1 - 0.12 * cw, yB); g.lineTo(px1 - 0.12 * cw, sy); g.lineTo(sx + sw, sy); g.stroke();
    g.fillStyle = 'rgba(20,26,52,0.95)'; g.strokeStyle = `rgba(${PLATE},0.7)`;
    g.beginPath(); g.roundRect(sx, sy - fs * 1.05, sw, fs * 2.1, 6); g.fill(); g.stroke();
    D.text(s, `p.d.${NB}=${NB}${Math.round(V)}${NB}V`, hx, sy, fs + 1, 0.95, D.sans(fs + 1, 600), on ? C.light : C.text);
    g.globalAlpha = 1;
  }

  // ---------- the view through the microscope (at about real speed) ----------
  function drawMicroscope(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { cx, cy, R } = L.mic, fs = L.fs, k = 0.92 * R / VIEW;   // pixels per mm
    const Y = (y) => cy - y * k;
    g.globalAlpha = a;
    const gr = g.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
    gr.addColorStop(0, 'rgba(26,30,48,1)'); gr.addColorStop(1, 'rgba(8,10,20,1)');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip();
    // scale lines every 0.5 mm
    for (let y = -1; y <= 1.001; y += 0.5) D.line(s, cx - R, Y(y), cx + R, Y(y), C.muted, 0.18, 1);
    // other drops
    for (const o of OTHERS) {
      const y = yOther(o, t); if (Math.abs(y) > VIEW + 0.1) continue;
      D.glowDot(s, cx + o[0] * R, Y(y), Math.max(4, R * 0.05), OIL, 0.45);
    }
    // the watched drop (its forces are drawn after the clip, so their labels aren't cut off)
    const y = yDrop(t), x = cx, py = Y(y), V = Vat(t), v = vDrop(t);
    if (Math.abs(y) < VIEW + 0.15) D.glowDot(s, x, py, Math.max(7, R * 0.09), DROP, 1);
    g.restore();
    if (Math.abs(y) < VIEW) {
      const fa = fade(t, 29.4, END_CARD, 0.8, 0.8), Lg = 0.28 * R, off = Math.max(7, R * 0.07), aw = Math.max(1.6, R * 0.014);
      if (fa > 0) {
        D.arrow(s, x, py + 3, x, py + Lg, C.force, fa, '', { head: 9, width: aw });
        D.text(s, 'mg', x, py + Lg + fs * 1.0, fs + 2, fa, D.serif(fs + 2), C.force);
        const lq = Lg * V / V_B;
        if (lq > 5) {
          D.arrow(s, x + off, py - 3, x + off, py - lq, C.force, fa, '', { head: 9, width: aw });
          D.text(s, 'qE', x + off + fs * 0.3, py - lq - fs * 0.8, fs + 2, fa, D.serif(fs + 2), C.force, 'left');
        }
        const ld = Lg * (1 - V / V_B), da = fa * (1 - smooth((t - 54) / 1.5));      // air resistance opposes the motion
        if (Math.abs(ld) > 5 && da > 0) {
          D.arrow(s, x - off, py - Math.sign(ld) * 3, x - off, py - ld, DRAG, da, '', { head: 8, width: aw * 0.8 });
          D.text(s, L.phone ? 'air res.' : 'air resistance', x - off - fs * 0.5, py + fs * 0.2, fs, da * 0.9, D.sans(fs), DRAG, 'right');
        }
      }
    }
    // rim, labels and readouts
    g.strokeStyle = 'rgba(170,182,220,0.5)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
    D.text(s, `microscope view  ·  ${Vat(t) > 1 ? 'top plate (+) above' : 'top plate above'}`, cx, cy - R - fs * 0.8, fs, 0.8, D.sans(fs), Vat(t) > 1 ? C.pos : C.muted);
    const sp = Math.abs(v) < 0.0015 ? 'still' : `${Math.abs(v).toFixed(3)}${NB}mm${NB}s⁻¹ ${v > 0 ? 'down' : 'up'}`;
    D.text(s, `watched drop: ${sp}`, cx, cy + R + fs * 1.0, fs, 0.85, D.sans(fs), C.text);
    // 0.5 mm scale bracket, just outside the circle on the right
    const bx = cx + R + 6;
    D.line(s, bx, Y(0), bx, Y(0.5), C.muted, 0.7, 1); D.line(s, bx - 3, Y(0), bx + 3, Y(0), C.muted, 0.7, 1); D.line(s, bx - 3, Y(0.5), bx + 3, Y(0.5), C.muted, 0.7, 1);
    D.text(s, '0.5 mm', bx + 5, Y(0.25), fs - 1, 0.7, D.sans(fs - 1), C.muted, 'left');
    g.globalAlpha = 1;
  }

  // ---------- the dot plot of many drops ----------
  function drawDots(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { hist: h, fs, phone } = L;
    g.globalAlpha = a;
    g.fillStyle = 'rgba(14,20,44,0.78)'; g.beginPath(); g.roundRect(h.x0 - fs * 0.6, h.y0 - fs * 0.6, h.x1 - h.x0 + fs * 1.2, h.y1 - h.y0 + fs * 3.4, 10); g.fill();
    const QMAX = 11, X = (q) => h.x0 + fs * 0.6 + (q / QMAX) * (h.x1 - h.x0 - fs * 1.2), base = h.y1 - fs * 0.6;
    const shown = clamp(Math.floor((t - T_DOTS) / DOT_STEP) + 1, 0, DOTS.length);
    D.text(s, `drops measured: ${shown}`, h.x0, h.y0 + fs * 0.4, fs, 0.85, D.sans(fs, 600), C.text, 'left');
    // multiples of e
    const la = fade(t, 90.8, END_CARD + 1, 0.8, 0.6);
    for (let n = 1; n <= 6; n++) {
      const x = X(n * 1.6);
      D.line(s, x, base, x, h.y0 + fs * 2.0, C.good, 0.35 * la, 1, [3, 4]);
      D.text(s, `${n}e`, x, h.y0 + fs * 1.4, fs, 0.9 * la, D.sans(fs, 600), C.good);
    }
    // the empty value 2.4
    const ea = fade(t, 97.8, 104.6, 0.6, 0.6);
    if (ea > 0) { const x = X(2.4); D.line(s, x, base, x, h.y0 + fs * 3.0, C.pos, 0.7 * ea, 1.4); D.text(s, phone ? '2.4: none' : '2.4: none here', x, h.y0 + fs * 2.6, fs, ea, D.sans(fs, 600), C.pos); }
    // the axis
    D.line(s, X(0), base, X(QMAX), base, C.muted, 0.7, 1.2);
    for (let q = 0; q <= 10; q += 2) { D.line(s, X(q), base, X(q), base + 4, C.muted, 0.7, 1); D.text(s, String(q), X(q), base + fs * 1.0, fs - 1, 0.75, D.sans(fs - 1), C.muted); }
    D.text(s, `size of the charge on a drop / 10⁻¹⁹${NB}C`, (X(0) + X(QMAX)) / 2, base + fs * 2.2, fs, 0.8, D.sans(fs), C.muted);
    // the dots, stacked within each whole-number group
    const rd = Math.max(2.2, Math.min((base - h.y0 - fs * 3.4) / 24, (h.x1 - h.x0) / 90));
    for (let i = 0; i < shown; i++) {
      const d = DOTS[i], x = X(d.q), y = base - rd * (1.3 + 2.25 * d.rank), pop = smooth((t - T_DOTS - i * DOT_STEP) / 0.3);
      D.glowDot(s, x, y, rd * (2.6 + 2 * (1 - pop)), i === 0 ? DROP : C.vel, pop);
    }
    const oa = fade(t, T_DOTS, 92, 0.4, 0.6);
    if (oa > 0) { const d = DOTS[0], y = base - rd * (1.3 + 2.25 * d.rank); D.text(s, 'our drop', X(d.q) + rd * 2.4, y - rd * 2.6, fs, oa, D.sans(fs, 600), DROP, 'left'); }
    g.globalAlpha = 1;
  }

  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 38)), s2 = Math.round(clamp(W / 32, 17, 34)), s3 = Math.round(clamp(W / 58, 11, 18));
    g.font = D.sans(s1, 300);
    const l1 = D.wrap(s, 'Millikan: electric charge comes in whole-number steps of e', W - 48);
    let y = H * (phone ? 0.16 : 0.2);
    D.text(s, l1, W / 2, y, s1, a, D.sans(s1, 300)); y += s1 * 1.3 * l1.length + s2 * 0.6;
    const items = [
      [[['q', 'i'], ['E', 'i'], [' = ', 'r'], ['mg', 'i'], ['   so   ', 'r'], ['q', 'i'], [' = ', 'r'], ['mgd', 'i'], [' / ', 'r'], ['V', 'i']], C.force, 'A drop held still: the electric force balances its weight, with E = V/d.'],
      [[['q', 'i'], [' = ', 'r'], ['ne', 'i']], C.good, 'Every charge is a whole number of elementary charges.'],
      [[['e', 'i'], [' = 1.60 × 10', 'r'], ['−19', 'sup'], [' C', 'r']], C.light, 'The elementary charge: the charge of a proton; an electron has −e.'],
    ];
    for (const [eq, rgb, txt] of items) {
      rich(s, eq, W / 2, y, s2, a, rgb); y += s2 * 1.05;
      g.font = D.sans(s3); const ls = D.wrap(s, txt, Math.min(W - 40, 640)); D.text(s, ls, W / 2, y, s3, 0.8 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.6;
    }
    g.font = D.sans(s3 - 1);
    D.text(s, D.wrap(s, 'The 40 measurements are simulated. Real drops are about 2 µm across: drawn hugely enlarged.', Math.min(W - 40, 720)), W / 2, Math.max(y, H * 0.8), s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('millikan', {
    duration: DURATION,
    poster: 62,
    // score: patient measurement (B-flat major, a soft sine pad, a low drone, a slow swell, a breath of wind)
    music: { chords: [[46, 53, 57, 62], [48, 55, 60, 64], [43, 50, 55, 58], [41, 48, 53, 57]], bar: 9, pad: 'sine', cutoff: 800, drone: 0.1, tremolo: 0.12, wind: 0.2, volume: 0.35 },
    resize: layout,
    // for checking the numbers (not used by the player)
    info: {
      E_FIELD, Q, N_E, Y0, yDrop, vDrop, Vat, DOTS, CAPS,
      check() {
        return { E: E_FIELD, q: Q, n: N_E, y0: Y0, yAt28: yDrop(28), yAt41_8: yDrop(41.8), yMin: Math.min(...Array.from({ length: 300 }, (_, i) => yDrop(28 + i * 0.1))),
          yAt53: yDrop(53), yAt80: yDrop(80), vAt35: vDrop(35), qs: DOTS.map((d) => +d.q.toFixed(2)),
          gapNear24: DOTS.filter((d) => Math.abs(d.q - 2.4) < 0.5).length };
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.2);
      const main = smooth((t - 4.6) / 0.9) * (1 - smooth((t - END_CARD) / 0.8));
      drawApparatus(s, t, main * (1 - 0.6 * smooth((t - 84) / 1.2)) * (L.phone ? 1 - smooth((t - 84) / 1.0) : 1));
      drawMicroscope(s, t, main * fade(t, 23.2, 84.6, 1.0, 0.8));
      drawDots(s, t, main * smooth((t - 84.2) / 0.8));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Millikan\'s oil-drop experiment', 'Measuring the charge on one electron');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
