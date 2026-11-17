/* What is temperature? (B.1 temperature and thermal equilibrium, B.3 kinetic model)
   A simplified two-dimensional gas, calculated once when the page loads (fixed seed, fixed steps), so every frame
   is a pure function of the scene time:
   - 90 hard discs (mass 1, radius 0.016) in a box 1.6 × 1.0. Steps of 1/120 s, stored at 30 frames a second.
     Particle–particle and ordinary wall collisions are elastic (equal masses swap their velocity components along
     the line of centres), so between heating and cooling the gas's total kinetic energy stays exactly the same.
   - Temperature is read from the average kinetic energy: in the model, average Eₖ ∝ T, scaled so the starting
     average is 300 K. The screen picture is two-dimensional (its own average would be k_B T); the numbers shown are
     those for an ideal monatomic gas at that
     temperature, from the data booklet's Eₖ = (3/2)k_B T with k_B = 1.38 × 10⁻²³ J K⁻¹:
       300 K: (3/2) × 1.38 × 10⁻²³ × 300 = 6.21 × 10⁻²¹ J ≈ 6.2 × 10⁻²¹ J
       600 K: (3/2) × 1.38 × 10⁻²³ × 600 = 1.242 × 10⁻²⁰ J ≈ 1.2 × 10⁻²⁰ J (twice as much: Eₖ ∝ T)
   - The hot plate is a "thermal wall" at 700 K: a particle that hits it leaves with a speed drawn from the gas
     distribution at the plate's temperature (in 2D: normal component Rayleigh, sideways component normal), so on
     average it leaves faster. It is switched off once the gas and the thermometer together hold the energy of
     600 K (the surplus from the last few hits, about 2%, is trimmed), so they settle at 600 K.
   - The thermometer probe: its temperature T_th follows dT_th/dt = (T_gas − T_th) ÷ 6 s (it warms as gas particles
     hit it), and the energy it gains, C × ΔT_th with C equal to 10 particles' worth, is taken from the gas (all speeds
     scaled down a little). So energy is conserved, and both end at the same temperature: thermal equilibrium.
   - Cooling: all four walls become thermal walls whose temperature falls from 600 K to 12 K.
   - The spark and the bath (Q = mcΔT, c from the B.1 table, treated as constant):
       spark: 1.0 mg of iron, 1500 °C → 20 °C: 1.0 × 10⁻⁶ × 450 × 1480 = 0.666 J ≈ 0.7 J
       bath: 150 kg of water, 40 °C → 20 °C: 150 × 4200 × 20 = 1.26 × 10⁷ J ≈ 1.3 × 10⁷ J; ratio 1.9 × 10⁷
     (Iron's real specific heat capacity rises at high temperature, so a real spark gives out roughly 1 J; the page says so.)
     Average Eₖ: 1773 ÷ 313 = 5.66, "almost 6 times"; speed ∝ √(T/m): √(5.66 × 18 ÷ 56) = 1.35 times as fast.
   - Kelvin and Celsius: T/K = θ/°C + 273; 0 K = −273 °C. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const NB = ' ';
  const KB = 1.38e-23;
  const ekOf = (T) => 1.5 * KB * T;

  // ---------- captions: each held long enough to read (at most about 15 characters a second) ----------
  const SPEC = [
    ['A gas is made of particles moving in random directions, at many different speeds.'],
    ['They collide with each other and with the walls, so each particle\'s speed keeps changing.'],
    ['The colours show each particle\'s kinetic energy, ½mv²: blue for slow, orange for fast.'],
    ['The bar chart counts how many particles have each kinetic energy. The line marks the average.'],
    ['Temperature is a measure of the average random kinetic energy of the particles: the kelvin temperature is proportional to it.'],
    [`At 300${NB}K (27${NB}°C), the average kinetic energy of a particle is (3/2)${NB}×${NB}1.38${NB}×${NB}10⁻²³${NB}×${NB}300 = 6.2${NB}×${NB}10⁻²¹${NB}J.`],
    ['The thermometer probe is at the same temperature as the gas, so it reads 300 K.'],
    ['Predict: the gas is heated quickly. Will the thermometer show the new temperature straight away?', 6],
    ['The hot plate heats the gas: particles that hit it bounce off faster, so the average kinetic energy rises.'],
    ['The thermometer lags behind. Gas particles hit it and give energy to its particles, so it warms and the gas cools a little.'],
    ['Energy flows from the hotter gas to the colder thermometer until both are at the same temperature.'],
    ['Then there is no more net energy flow: thermal equilibrium. Only then does the thermometer read the temperature of the gas.'],
    [`The gas is now at 600${NB}K. Double the kelvin temperature and the average kinetic energy doubles: 1.2${NB}×${NB}10⁻²⁰${NB}J.`],
    ['Temperature is not the same as energy. Compare a spark from a sparkler with a warm bath.'],
    [`The spark (1.0${NB}mg of iron at 1500${NB}°C) is much hotter than the bath water at 40${NB}°C: the average kinetic energy of its particles is almost 6 times as large.`],
    [`But the bath has vastly more particles. Cooling to 20${NB}°C, the spark gives out about 0.7${NB}J (Q${NB}=${NB}mcΔT), the bath 1.3${NB}×${NB}10⁷${NB}J.`],
    ['Internal energy is the total random kinetic energy and intermolecular potential energy of all the particles, so it depends on how many there are.'],
    ['Now cool the walls. The gas particles hit them and bounce off slower, so the temperature falls.'],
    ['Absolute zero, 0 K, is the lowest temperature there can be. The particles would have the least energy possible.'],
    [`The kelvin scale starts there: T/K${NB}=${NB}θ/°C${NB}+${NB}273, so 0${NB}K${NB}=${NB}−273${NB}°C. A change of 1${NB}K is the same as a change of 1${NB}°C.`],
  ];
  const CAPS = []; {
    let tc = 4.8;
    for (const [txt, extra = 0] of SPEC) {
      const d = Math.max(4.8, txt.length / 15 + 1.0) + extra;
      CAPS.push([+tc.toFixed(1), +(tc + d).toFixed(1), txt]); tc += d + 0.2;
    }
  }
  const at = (i) => CAPS[i][0], until = (i) => CAPS[i][1];
  const K_HIST = 3, K_TEMP = 4, K_300 = 5, K_TH = 6, K_PRED = 7, K_HEAT = 8, K_EQ = 11, K_600 = 12;
  const K_SPARK = 13, K_SPARK2 = 14, K_SPARK3 = 15, K_U = 16, K_COOL = 17, K_ZERO = 18, K_SCALE = 19;
  const T_HEAT = at(K_HEAT) + 0.3;
  const T_BOXOFF = at(K_SPARK) + 0.2, T_BOXON = at(K_COOL) - 1.2;       // the spark and the bath replace the gas
  const T_COOL = at(K_COOL) + 0.4;
  const END = until(K_SCALE) + 0.2, DURATION = END + 12.5;

  // ---------- the simulation ----------
  const N = 90, BW = 1.6, BH = 1.0, RP = 0.016, DT = 1 / 120, SUB = 4, FPS = 30;
  const E300 = 0.0648;                                   // average ½v² at 300 K, in model units
  const epsOf = (T) => E300 * T / 300, TofE = (e) => 300 * e / E300;
  const BX = 1.30, BY = 0.64, RB = 0.085, RL = 0.014;   // probe: bulb centre and radius; its lead runs up to the top wall
  const CTH = 10, TAU_TH = 6, PLATE_T = 700, COOL_TO = 12;
  const SIM_END = END + 1;
  const NF = Math.ceil(SIM_END * FPS) + 2;
  const PX = new Float32Array(NF * N), PY = new Float32Array(NF * N), EK = new Float32Array(NF * N);
  const TGAS = new Float32Array(NF), TTH = new Float32Array(NF), PLATE = new Uint8Array(NF);
  const HITS = [];                                       // gas particles hitting the probe: [time, angle]
  let tPlateOff = null, maxGas = 0;
  {
    let seed = 1848;                                     // Kelvin's absolute scale, 1848
    const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
    const x = new Float64Array(N), y = new Float64Array(N), vx = new Float64Array(N), vy = new Float64Array(N);
    const clearOf = (px, py) => {
      if (Math.hypot(px - BX, py - BY) < RB + 2.5 * RP) return false;
      if (Math.abs(px - BX) < RL + 2.5 * RP && py < BY) return false;
      for (let j = 0; j < N; j++) if (x[j] && Math.hypot(px - x[j], py - y[j]) < 2.6 * RP) return false;
      return true;
    };
    for (let i = 0; i < N; i++) {
      let px, py; do { px = RP + rnd() * (BW - 2 * RP); py = RP + rnd() * (BH - 2 * RP); } while (!clearOf(px, py));
      x[i] = px; y[i] = py;
      const sg = Math.sqrt(E300); vx[i] = sg * gauss(); vy[i] = sg * gauss();
    }
    const energy = () => { let e = 0; for (let i = 0; i < N; i++) e += 0.5 * (vx[i] * vx[i] + vy[i] * vy[i]); return e; };
    { const k = Math.sqrt(N * E300 / energy()); for (let i = 0; i < N; i++) { vx[i] *= k; vy[i] *= k; } }   // exactly 300 K
    let eth = E300;                                       // the thermometer's temperature, as an energy per particle
    // a thermal wall at temperature T: returns [normal speed (into the box), sideways speed]
    const emit = (T) => { const sg = Math.sqrt(epsOf(T)); return [sg * Math.sqrt(-2 * Math.log(1 - rnd())), sg * gauss()]; };
    let plateOn = false;
    const steps = Math.ceil(SIM_END / DT);
    for (let n = 0; n <= steps; n++) {
      const t = n * DT;
      if (n % SUB === 0) {
        const f = n / SUB; if (f < NF) {
          let e = 0;
          for (let i = 0; i < N; i++) { const ke = 0.5 * (vx[i] * vx[i] + vy[i] * vy[i]); PX[f * N + i] = x[i]; PY[f * N + i] = y[i]; EK[f * N + i] = ke; e += ke; }
          TGAS[f] = TofE(e / N); TTH[f] = TofE(eth); PLATE[f] = plateOn ? 1 : 0;
          if (t > T_HEAT && t < T_BOXOFF) maxGas = Math.max(maxGas, TGAS[f]);
        }
      }
      if (!plateOn && tPlateOff === null && t >= T_HEAT) plateOn = true;
      const cooling = t >= T_COOL, Tw = lerp(600, COOL_TO, smooth((t - T_COOL) / 6));
      // move
      for (let i = 0; i < N; i++) { x[i] += vx[i] * DT; y[i] += vy[i] * DT; }
      // walls
      for (let i = 0; i < N; i++) {
        if (x[i] < RP) { x[i] = 2 * RP - x[i]; if (cooling) { const [a, b] = emit(Tw); vx[i] = a; vy[i] = b; } else vx[i] = Math.abs(vx[i]); }
        if (x[i] > BW - RP) { x[i] = 2 * (BW - RP) - x[i]; if (cooling) { const [a, b] = emit(Tw); vx[i] = -a; vy[i] = b; } else vx[i] = -Math.abs(vx[i]); }
        if (y[i] < RP) { y[i] = 2 * RP - y[i]; if (cooling) { const [a, b] = emit(Tw); vy[i] = a; vx[i] = b; } else vy[i] = Math.abs(vy[i]); }
        if (y[i] > BH - RP) {                              // the bottom: the hot plate when it is on
          y[i] = 2 * (BH - RP) - y[i];
          if (plateOn) { const [a, b] = emit(PLATE_T); vy[i] = -a; vx[i] = b; }
          else if (cooling) { const [a, b] = emit(Tw); vy[i] = -a; vx[i] = b; }
          else vy[i] = -Math.abs(vy[i]);
        }
        // the probe's bulb (elastic bounce; its energy exchange is handled below) and its lead
        const dx = x[i] - BX, dy = y[i] - BY, d = Math.hypot(dx, dy);
        if (d < RB + RP) {
          const nx = dx / d, ny = dy / d, vn = vx[i] * nx + vy[i] * ny;
          x[i] = BX + nx * (RB + RP); y[i] = BY + ny * (RB + RP);
          if (vn < 0) { vx[i] -= 2 * vn * nx; vy[i] -= 2 * vn * ny; if (t > 4 && t < SIM_END) HITS.push([t, Math.atan2(ny, nx)]); }
        } else if (y[i] < BY - RB && Math.abs(x[i] - BX) < RL + RP) {
          const sgn = x[i] < BX ? -1 : 1; x[i] = BX + sgn * (RL + RP);
          if (vx[i] * sgn < 0) vx[i] = -vx[i];
        }
      }
      // particle–particle collisions (elastic, equal masses)
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const dx = x[j] - x[i], dy = y[j] - y[i], d2 = dx * dx + dy * dy;
        if (d2 >= 4 * RP * RP || d2 === 0) continue;
        const dvx = vx[j] - vx[i], dvy = vy[j] - vy[i], dot = dvx * dx + dvy * dy;
        if (dot >= 0) continue;
        const k = dot / d2; vx[i] += k * dx; vy[i] += k * dy; vx[j] -= k * dx; vy[j] -= k * dy;
      }
      // the thermometer: Newton's law of cooling, with its energy taken from (or given to) the gas
      const egas = energy(), eg = egas / N;
      const deth = (eg - eth) * DT / TAU_TH, dE = CTH * deth;
      eth += deth;
      if (dE !== 0) { const k = Math.sqrt(Math.max(0, 1 - dE / egas)); for (let i = 0; i < N; i++) { vx[i] *= k; vy[i] *= k; } }
      // switch the plate off once gas and thermometer together hold the energy of 600 K
      if (plateOn && energy() + CTH * eth >= (N + CTH) * epsOf(600)) {
        plateOn = false; tPlateOff = t;
        // trim the last few hits' surplus (about 2%), so gas and thermometer together hold exactly the energy of 600 K
        const k = Math.sqrt(((N + CTH) * epsOf(600) - CTH * eth) / energy());
        for (let i = 0; i < N; i++) { vx[i] *= k; vy[i] *= k; }
      }
    }
  }
  const fIdx = (t) => clamp(t * FPS, 0, NF - 1.001);
  const series = (arr, t) => { const f = fIdx(t), k = Math.floor(f); return lerp(arr[k], arr[k + 1], f - k); };
  const tGas = (t) => series(TGAS, t), tTh = (t) => series(TTH, t);
  const plateA = (t) => (tPlateOff === null ? 0 : fade(t, T_HEAT, tPlateOff, 0.4, 0.6));

  // ---------- colours ----------
  const SLOW = [110, 170, 255], MID = [235, 240, 255], FAST = [255, 150, 70];
  const keColour = (e) => {
    const u = clamp(e / (3.2 * E300), 0, 1);
    const [a, b, k] = u < 0.35 ? [SLOW, MID, u / 0.35] : [MID, FAST, (u - 0.35) / 0.65];
    return `${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))}`;
  };
  const tempColour = (T) => keColour(epsOf(T));

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25)), capTop = H - capFs * (phone ? 6.6 : 5.4);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    let box, panel;
    if (phone) {
      const bw = W * 0.74, bh = bw / 1.6;
      box = { x0: (W - bw) / 2, y0: 26, w: bw, h: bh };
      panel = { x0: 12, x1: W - 12, y0: box.y0 + bh + fs * 3.0, y1: capTop - 2 };
    } else {
      const bw = Math.min(W * 0.55, (capTop - 96) * 1.6), bh = bw / 1.6;
      box = { x0: W * 0.04, y0: Math.max(46, (capTop - bh) / 2 - 6), w: bw, h: bh };
      panel = { x0: box.x0 + bw + W * 0.05, x1: W - W * 0.03, y0: box.y0, y1: box.y0 + bh + fs * 2 };
    }
    box.sc = box.w / BW;
    L = { W, H, phone, capFs, capTop, fs, box, panel };
  }
  const X = (x) => L.box.x0 + x * L.box.sc, Y = (y) => L.box.y0 + y * L.box.sc;

  const sci2 = (v) => { const e = Math.floor(Math.log10(v)), m = v / 10 ** e;
    let mm = m.toFixed(1); let ee = e; if (+mm >= 10) { mm = (m / 10).toFixed(1); ee += 1; }
    return `${mm}${NB}×${NB}10${String(ee).replace('-', '⁻').replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c])}`; };
  const r10 = (T) => Math.round(T / 10) * 10;
  const minus = (v) => String(v).replace('-', '−');

  // text made of pieces: [text, style]: 'i' italic serif, 'r' upright serif, 's' italic subscript, 'sans'
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
  const label = (s, txt, x, y, a, rgb = C.muted, align = 'center', size = L.fs, weight = 400) => D.text(s, txt, x, y, size, a, D.sans(size, weight), rgb, align);

  // ---------- the box of gas ----------
  function drawBox(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { box, fs, phone } = L;
    const f = fIdx(t), k = Math.floor(f), u = f - k;
    // walls: blue glow while they are cooled
    const ca = fade(t, T_COOL, END + 1, 0.8, 0.8);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(12,18,40,${0.7 * a})`; g.fillRect(box.x0, box.y0, box.w, box.h);
    g.strokeStyle = `rgba(${ca > 0 ? '120,190,255' : '170,182,220'},${(0.55 + 0.4 * ca) * a})`; g.lineWidth = 1.6 + 1.4 * ca;
    g.strokeRect(box.x0, box.y0, box.w, box.h);
    if (ca > 0) label(s, 'walls cooled', box.x0 + box.w / 2, box.y0 - fs * 0.9, 0.9 * ca * a, '140,200,255', 'center', fs, 600);
    // the hot plate under the box
    const pa = plateA(t);
    const py = box.y0 + box.h + 3;
    g.fillStyle = `rgba(90,96,120,${0.9 * a})`; g.fillRect(box.x0 - 4, py, box.w + 8, Math.max(5, fs * 0.5));
    if (pa > 0) {
      const gr = g.createLinearGradient(0, py - 6, 0, py + fs * 0.5);
      gr.addColorStop(0, `rgba(255,120,40,0)`); gr.addColorStop(0.5, `rgba(255,140,50,${0.9 * pa * a})`); gr.addColorStop(1, `rgba(255,200,90,${pa * a})`);
      g.fillStyle = gr; g.fillRect(box.x0 - 4, py - 6, box.w + 8, fs * 0.5 + 6);
    }
    const plA = a * Math.max(fade(t, T_HEAT - 2.6, T_BOXOFF, 0.6, 0.6) * 0.6, pa);
    label(s, pa > 0.05 ? 'hot plate: on' : 'hot plate', box.x0 + box.w, py + fs * 1.3, plA, pa > 0.05 ? '255,170,85' : C.muted, 'right', fs, pa > 0.05 ? 600 : 400);
    // the particles
    g.save(); g.beginPath(); g.rect(box.x0, box.y0, box.w, box.h); g.clip();
    const rpx = Math.max(2.2, RP * box.sc);
    for (let i = 0; i < N; i++) {
      const x0 = PX[k * N + i], x1 = PX[(k + 1) * N + i], y0 = PY[k * N + i], y1 = PY[(k + 1) * N + i];
      const jump = Math.abs(x1 - x0) + Math.abs(y1 - y0) > 0.2;
      const px = X(jump ? x0 : lerp(x0, x1, u)), pyy = Y(jump ? y0 : lerp(y0, y1, u));
      const rgb = keColour(EK[k * N + i]);
      D.glowDot(s, px, pyy, rpx * 2.6, rgb, 0.45 * a);
      g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(${rgb},${a})`;
      g.beginPath(); g.arc(px, pyy, rpx, 0, 7); g.fill();
    }
    g.restore();
    drawProbe(s, t, a);
    label(s, phone ? 'drawn bigger and slower than real' : 'particles drawn far bigger and slower than real', box.x0, box.y0 + box.h + 3 + fs * 1.3, 0.6 * a, C.muted, 'left', fs - 1);
  }

  // the thermometer probe: a bulb whose particles vibrate more as it warms
  function drawProbe(s, t, a) {
    const { g } = s, { box, fs } = L;
    const Tt = tTh(t), bx = X(BX), by = Y(BY), rb = RB * box.sc;
    // its lead, up through the top wall
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(150,158,185,${0.95 * a})`; g.fillRect(bx - RL * box.sc, box.y0 - fs * 0.8, 2 * RL * box.sc, by - rb - box.y0 + fs * 0.8 + 1);
    // the bulb
    g.fillStyle = `rgba(40,44,62,${a})`; g.beginPath(); g.arc(bx, by, rb, 0, 7); g.fill();
    g.strokeStyle = `rgba(${tempColour(Tt)},${0.9 * a})`; g.lineWidth = 2; g.stroke();
    // its particles (a small lattice), vibrating with an amplitude ∝ √T (speed ∝ √(average Eₖ))
    const amp = rb * 0.085 * Math.sqrt(Math.max(Tt, 1) / 300);
    for (let j = 0; j < 7; j++) {
      const ang = j * Math.PI / 3, rr = j === 6 ? 0 : rb * 0.5;
      const ox = amp * Math.sin(9.1 * t + j * 1.7), oy = amp * Math.cos(7.3 * t + j * 2.3);
      g.fillStyle = `rgba(${tempColour(Tt)},${0.95 * a})`;
      g.beginPath(); g.arc(bx + rr * Math.cos(ang) + ox, by + rr * Math.sin(ang) + oy, Math.max(1.6, rb * 0.13), 0, 7); g.fill();
    }
    // a flash where a gas particle has just hit it
    for (let h = HITS.length - 1; h >= 0; h--) {
      const [th, ang] = HITS[h]; if (th > t) continue; if (t - th > 0.45) break;
      D.glowDot(s, bx + rb * Math.cos(ang), by + rb * Math.sin(ang), fs * 0.9, '255,214,102', 0.8 * a * (1 - (t - th) / 0.45));
    }
    label(s, 'thermometer probe', bx, box.y0 - fs * (L.phone ? 1.6 : 1.7), 0.8 * a * fade(t, 4.8, at(K_HIST), 1, 1) + 0.8 * a * fade(t, at(K_TH), until(K_EQ), 0.8, 0.8), C.muted, 'center', fs);
  }

  // ---------- the panel: readings, the bar chart, the formula, the two scales ----------
  function drawPanel(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { panel: p, fs, phone } = L;
    const Tt = tTh(t), Tg = tGas(t), lh = fs * 1.55;
    let y = p.y0 + fs * 0.6;
    // the thermometer's reading
    const thA = a * fade(t, 4.8, DURATION, 1, 1);
    const kR = r10(Tt);
    if (phone) {
      rich(s, [['thermometer: ', 'sans'], [`${kR}${NB}K`, 'sans'], [`  (${minus(kR - 273)}${NB}°C)`, 'sans']], p.x0, y, fs + 2, thA, tempColour(Tt), 'left');
      const fA = a * fade(t, at(K_TEMP), DURATION, 0.8, 1);
      rich(s, [['E', 'i'], ['k', 's'], [' = ', 'r'], ['3/2', 'r'], [' k', 'i'], ['B', 's'], ['T', 'i']], p.x1, y, fs + 4, fA, C.light, 'right');
    } else {
      label(s, 'thermometer reads', p.x0, y, 0.85 * thA, C.muted, 'left', fs);
      y += lh;
      label(s, `${kR}${NB}K   (${minus(kR - 273)}${NB}°C)`, p.x0, y, thA, tempColour(Tt), 'left', fs + 6, 600);
    }
    y += lh * 1.2;
    // the gas's average kinetic energy (from the model), and the temperature it means
    const gA = a * fade(t, at(K_TEMP), DURATION, 0.8, 1);
    if (gA > 0) {
      if (phone) {
        rich(s, [['gas: average ', 'sans'], ['E', 'i'], ['k', 's'], [` = ${sci2(ekOf(Tg))}${NB}J, ${r10(Tg)}${NB}K`, 'sans']], p.x0, y, fs + 1, gA, tempColour(Tg), 'left');
        y += lh;
      } else {
        rich(s, [['gas: average ', 'sans'], ['E', 'i'], ['k', 's'], [` = ${sci2(ekOf(Tg))}${NB}J`, 'sans']], p.x0, y, fs + 1, gA, tempColour(Tg), 'left');
        y += lh;
        label(s, `so the gas is at ${r10(Tg)}${NB}K`, p.x0, y, 0.85 * gA, tempColour(Tg), 'left', fs);
        y += lh;
      }
      // the data-booklet equation (on phones it is on the thermometer's line)
      if (!phone) {
      const w = rich(s, [['E', 'i'], ['k', 's'], [' = ', 'r'], ['3', 'r'], ['/', 'r'], ['2', 'r'], [' k', 'i'], ['B', 's'], ['T', 'i']], p.x0 + (phone ? 0 : 6), y + fs * 0.2, fs + 5, gA, C.light, 'left');
      label(s, '(kelvin temperature T)', p.x0 + w + fs * 1.4, y + fs * 0.2, 0.7 * gA, C.muted, 'left', fs - 1);
      y += lh * 1.25;
      }
    }
    // the bar chart of kinetic energies, or (at the end) the two temperature scales
    const hb = phone ? { x0: p.x0 + 4, x1: p.x1, y0: p.y0 + lh * 2 + fs * 2.4, y1: p.y1 - fs * 1.5 } : { x0: p.x0 + 8, x1: p.x1, y0: y + fs * 2.3, y1: p.y1 - fs * 1.4 };
    const hA = a * fade(t, at(K_HIST), at(K_ZERO) + 0.4, 0.8, 0.8);
    const sA = a * fade(t, at(K_ZERO) + 0.4, DURATION, 0.8, 1);
    if (hb.y1 - hb.y0 > 24) {
      if (hA > 0) histogram(s, t, hb, hA);
      if (sA > 0) { if (phone) scalesH(s, t, { x0: p.x0 + fs * 1.2, x1: p.x1 - fs * 1.2, y: (hb.y0 + hb.y1) / 2 }, sA, Tt); else scales(s, t, hb, sA, Tt); }
    }
  }

  function histogram(s, t, b, a) {
    const { fs } = L, NBIN = 22, BINW = 0.36 * E300, f0 = Math.floor(fIdx(t));
    // counts averaged over half a second of frames, so the chart doesn't flicker
    const cnt = new Float64Array(NBIN); let nfr = 0, emean = 0;
    for (let f = Math.max(0, f0 - 7); f <= Math.min(NF - 1, f0 + 7); f++) {
      nfr++;
      for (let i = 0; i < N; i++) { const e = EK[f * N + i]; emean += e; cnt[Math.min(NBIN - 1, Math.floor(e / BINW))]++; }
    }
    emean /= nfr * N;
    const top = N * 0.34, bw = (b.x1 - b.x0) / NBIN;
    D.line(s, b.x0, b.y1, b.x1, b.y1, C.muted, 0.6 * a, 1.2);
    D.line(s, b.x0, b.y1, b.x0, b.y0, C.muted, 0.6 * a, 1.2);
    for (let k = 0; k < NBIN; k++) {
      const h = Math.min(1, cnt[k] / nfr / top) * (b.y1 - b.y0);
      s.g.fillStyle = `rgba(${keColour((k + 0.5) * BINW)},${0.75 * a})`;
      s.g.fillRect(b.x0 + k * bw + 1, b.y1 - h, bw - 2, h);
    }
    label(s, 'number of particles', b.x0, b.y0 - fs * 1.7, 0.75 * a, C.muted, 'left', fs - 1);
    label(s, 'kinetic energy of a particle →', b.x1, b.y1 + fs * 0.95, 0.75 * a, C.muted, 'right', fs - 1);
    const xm = b.x0 + emean / BINW * bw;
    if (xm < b.x1) {
      D.line(s, xm, b.y0 + fs * 0.4, xm, b.y1, C.light, 0.95 * a, 2);
      label(s, 'average', xm, b.y0, a, C.light, 'center', fs - 1, 600);
    }
  }

  // Kelvin and Celsius side by side, with absolute zero marked and a pointer at the thermometer's reading
  function scales(s, t, b, a, Tt) {
    const { fs, phone } = L;
    const Ymap = (T) => b.y1 - T / 700 * (b.y1 - b.y0);
    const xc = phone ? (b.x0 + b.x1) / 2 : b.x0 + (b.x1 - b.x0) * 0.42;
    s.g.fillStyle = `rgba(30,36,60,${0.9 * a})`; s.g.fillRect(xc - 5, b.y0, 10, b.y1 - b.y0);
    const gr = s.g.createLinearGradient(0, b.y1, 0, Ymap(Tt));
    gr.addColorStop(0, `rgba(${tempColour(0)},${a})`); gr.addColorStop(1, `rgba(${tempColour(Tt)},${a})`);
    s.g.fillStyle = gr; s.g.fillRect(xc - 4, Ymap(Tt), 8, b.y1 - Ymap(Tt));
    for (let T = 0; T <= 700; T += 100) {
      D.line(s, xc - 12, Ymap(T), xc - 5, Ymap(T), C.muted, 0.8 * a, 1);
      label(s, `${T}${NB}K`, xc - 16, Ymap(T), 0.85 * a, C.text, 'right', fs - 1);
    }
    for (const c of [-273, -200, -100, 0, 100, 200, 300, 400]) {
      const T = c + 273; D.line(s, xc + 5, Ymap(T), xc + 12, Ymap(T), C.muted, 0.8 * a, 1);
      label(s, `${minus(c)}${NB}°C`, xc + 16, Ymap(T), 0.85 * a, C.text, 'left', fs - 1);
    }
    const za = a * fade(t, at(K_ZERO) + 0.6, DURATION, 0.8, 1);
    D.line(s, xc - 12, b.y1, xc + 12, b.y1, C.light, za, 2.2);
    label(s, 'absolute zero', phone ? xc + 16 + fs * 4.4 : xc + 16 + fs * 5, b.y1, za, C.light, 'left', fs - 1, 600);
    D.arrow(s, xc - fs * 3.6 - 30, Ymap(Tt), xc - 16 - fs * 2.6, Ymap(Tt), tempColour(Tt), a, '', { head: 7, width: 2 });
  }

  // phones: the two scales side by side along one line (K above, °C below)
  function scalesH(s, t, b, a, Tt) {
    const { fs } = L, Xm = (T) => b.x0 + T / 700 * (b.x1 - b.x0), y = b.y;
    s.g.fillStyle = `rgba(30,36,60,${0.9 * a})`; s.g.fillRect(b.x0, y - 4, b.x1 - b.x0, 8);
    s.g.fillStyle = `rgba(${tempColour(Tt)},${a})`; s.g.fillRect(b.x0, y - 3, Xm(Tt) - b.x0, 6);
    for (const T of [0, 100, 200, 300, 400, 500, 600, 700]) {
      D.line(s, Xm(T), y - 10, Xm(T), y - 4, C.muted, 0.8 * a, 1);
      if (T % 200 === 0 || T === 700) label(s, `${T}${NB}K`, Xm(T), y - fs * 1.4, 0.85 * a, C.text, 'center', fs - 1);
    }
    for (const c of [-273, 0, 200, 400]) {
      D.line(s, Xm(c + 273), y + 4, Xm(c + 273), y + 10, C.muted, 0.8 * a, 1);
      label(s, `${minus(c)}${NB}°C`, Xm(c + 273), y + fs * 1.4, 0.85 * a, C.text, 'center', fs - 1);
    }
    D.arrow(s, Xm(Tt), y + fs * 2.9, Xm(Tt), y + 6, tempColour(Tt), a, '', { head: 6, width: 1.8 });
    const za = a * fade(t, at(K_ZERO) + 0.6, DURATION, 0.8, 1);
    label(s, 'absolute zero', b.x0, y - fs * 2.7, za, C.light, 'left', fs - 1, 600);
  }

  // ---------- the spark and the bath ----------
  function drawSparkBath(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { W, capTop, fs, phone } = L;
    const fr = phone
      ? [{ x0: 12, x1: W - 12, y0: 12, y1: capTop * 0.47 }, { x0: 12, x1: W - 12, y0: capTop * 0.51, y1: capTop - 6 }]
      : [{ x0: W * 0.04, x1: W * 0.48, y0: 40, y1: capTop - 10 }, { x0: W * 0.52, x1: W * 0.96, y0: 40, y1: capTop - 10 }];
    const tA = a * fade(t, at(K_SPARK2), DURATION, 0.8, 1), eA = a * fade(t, at(K_SPARK3), DURATION, 0.8, 1);
    const items = [
      { name: 'spark: 1.0 mg of iron', T: 1500, m: 56, txt: `1500${NB}°C`, Q: `about 0.7${NB}J`, solid: true },
      { name: 'bath: 150 kg of water', T: 40, m: 18, txt: `40${NB}°C`, Q: `1.3${NB}×${NB}10⁷${NB}J`, solid: false },
    ];
    items.forEach((it, k) => {
      const b = fr[k], cx = (b.x0 + b.x1) / 2, h = b.y1 - b.y0;
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = `rgba(14,20,44,${0.7 * a})`; g.beginPath(); g.roundRect(b.x0, b.y0, b.x1 - b.x0, h, 10); g.fill();
      label(s, it.name, cx, b.y0 + fs * 1.1, a, C.text, 'center', fs + 1, 600);
      // the object (left) and a zoomed-in view of its particles (right)
      const oy = b.y0 + h * (phone ? 0.5 : 0.42), ox = b.x0 + (b.x1 - b.x0) * 0.27, zr = Math.min(h * (phone ? 0.3 : 0.24), (b.x1 - b.x0) * 0.2);
      const zx = b.x0 + (b.x1 - b.x0) * 0.7;
      if (it.solid) {
        D.glowDot(s, ox, oy, zr * 0.9, '255,190,110', a);
        D.glowDot(s, ox, oy, zr * 0.35, '255,240,200', a);
        for (let j = 0; j < 6; j++) { const an = j * 1.05 + 0.3; D.glowLine(s, [[ox + Math.cos(an) * zr * 0.25, oy + Math.sin(an) * zr * 0.25], [ox + Math.cos(an) * zr * 0.75, oy + Math.sin(an) * zr * 0.75]], '255,200,120', 0.45 * a, 1); }
      } else {
        g.fillStyle = `rgba(70,130,220,${0.55 * a})`; g.beginPath(); g.roundRect(ox - zr * 1.0, oy - zr * 0.25, zr * 2.0, zr * 0.85, zr * 0.3); g.fill();
        g.strokeStyle = `rgba(220,226,245,${0.8 * a})`; g.lineWidth = 2;
        g.beginPath(); g.moveTo(ox - zr * 1.15, oy - zr * 0.45); g.lineTo(ox - zr * 1.0, oy + zr * 0.55); g.quadraticCurveTo(ox, oy + zr * 0.8, ox + zr * 1.0, oy + zr * 0.55); g.lineTo(ox + zr * 1.15, oy - zr * 0.45); g.stroke();
      }
      D.line(s, ox + zr * 0.6, oy, zx - zr * 1.02, oy, C.muted, 0.4 * a, 1, [3, 4]);
      g.fillStyle = `rgba(6,8,18,${0.9 * a})`; g.beginPath(); g.arc(zx, oy, zr, 0, 7); g.fill();
      g.strokeStyle = `rgba(170,182,220,${0.6 * a})`; g.lineWidth = 1.2; g.stroke();
      // particles: average Eₖ ∝ T (1773 ÷ 313 = 5.7 times), but speed ∝ √(T/m): iron (56 u) vs water (18 u) gives
      // √(5.66 × 18 ÷ 56) = 1.35 times as fast, so the spark's atoms are drawn only 1.35 times as fast
      const sp = Math.sqrt(((it.T + 273) / 313) * (18 / it.m)), rgb = tempColour(it.T + 273);
      g.save(); g.beginPath(); g.arc(zx, oy, zr - 1, 0, 7); g.clip();
      if (it.solid) {
        const d = zr * 0.42;
        for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
          const q = i * 7 + j * 3, amp = d * 0.13 * sp;
          const px = zx + i * d + amp * Math.sin(5.2 * sp * t + q), pyy = oy + j * d + amp * Math.cos(4.4 * sp * t + q * 1.3);
          g.fillStyle = `rgba(${rgb},${a})`; g.beginPath(); g.arc(px, pyy, Math.max(2, d * 0.2), 0, 7); g.fill();
        }
      } else {
        for (let i = 0; i < 26; i++) {
          const ph = i * 2.39996, r0 = zr * 0.8 * Math.sqrt((i + 0.5) / 26);
          const px = zx + r0 * Math.cos(ph) + zr * 0.12 * Math.sin(0.9 * sp * t + i), pyy = oy + r0 * Math.sin(ph) + zr * 0.12 * Math.cos(0.7 * sp * t + i * 1.7);
          g.fillStyle = `rgba(${rgb},${a})`; g.beginPath(); g.arc(px, pyy, Math.max(2, zr * 0.07), 0, 7); g.fill();
        }
      }
      g.restore();
      if (!phone) label(s, 'its particles', zx, oy - zr - fs * 0.8, 0.7 * a, C.muted, 'center', fs - 1);
      const ry = b.y1 - fs * (phone ? 2.4 : 3.2);
      rich(s, [['temperature: ', 'sans'], [it.txt, 'sans']], cx, ry, fs + 2, tA, it.solid ? '255,170,85' : '140,190,255');
      rich(s, [['energy given out cooling to 20', 'sans'], [`${NB}°C: `, 'sans'], [it.Q, 'sans']], cx, ry + fs * 1.6, fs + (phone ? 0 : 1), eA, C.light);
    });
    if (!phone) label(s, 'particles not to scale', W / 2, capTop - fs * 0.2, 0.5 * a, C.muted, 'center', fs - 1);
  }

  function endCard(s, t) {
    const a = fade(t, END, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 40, 15, 26)), s3 = Math.round(clamp(W / 60, 12, 17));
    g.font = D.sans(s1, 300);
    const head = D.wrap(s, 'What is temperature?', W - 48);
    let y = H * (phone ? 0.12 : 0.18);
    D.text(s, head, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * head.length + s2 * 0.6;
    const items = [
      [[['E', 'i'], ['k', 's'], [' = ', 'r'], ['3/2', 'r'], [' k', 'i'], ['B', 's'], ['T', 'i']], C.light, 'Kelvin temperature is a measure of the average random kinetic energy of the particles.'],
      [[['thermal equilibrium', 'sans']], '255,170,85', 'Energy flows from hotter to colder until the temperatures are equal. A thermometer reads its own temperature.'],
      [[['T', 'i'], ['/K = ', 'r'], ['θ', 'i'], ['/°C + 273', 'r']], '140,190,255', 'Absolute zero, 0 K = −273 °C, is the lowest temperature. Temperature is not internal energy.'],
    ];
    if (phone) {
      for (const [eq, rgb, txt] of items) {
        rich(s, eq, W / 2, y, s2, a, rgb); y += s2 * 1.1;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 40); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.6;
      }
    } else {
      const colW = Math.min(W * 0.28, 320);
      g.font = D.sans(s3);
      const wr = items.map((it) => D.wrap(s, it[2], colW));
      items.forEach(([eq, rgb], i) => {
        const x = W / 2 + (i - 1) * W * 0.31;
        rich(s, eq, x, y, s2, a, rgb);
        D.text(s, wr[i], x, y + s2 * 1.2, s3, 0.85 * a, D.sans(s3));
      });
    }
    g.font = D.sans(s3 - 1);
    D.text(s, D.wrap(s, 'A two-dimensional model gas, drawn far bigger and slower than real. The numbers shown are for an ideal monatomic gas at that temperature; a 2D gas\'s own average Eₖ would be two-thirds as much.', Math.min(W - 40, 760)), W / 2, H * 0.84, s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('temperature', {
    duration: DURATION,
    poster: at(K_TEMP) + 2,
    // score: warmth (E-flat, a soft triangle pad, a low drone, a little wind and shimmer)
    music: { chords: [[39, 46, 51, 55], [44, 51, 55, 58], [41, 48, 51, 56], [46, 53, 56, 60]], bar: 10, pad: 'triangle', cutoff: 850, drone: 0.1, wind: 0.35, shimmer: 0.2, tremolo: 0.15, volume: 0.52 },
    resize: layout,
    info: {
      CAPS, tGas, tTh, get tPlateOff() { return tPlateOff; }, DURATION,
      check() {
        const out = {
          ek300: ekOf(300), ek600: ekOf(600), ratio: ekOf(600) / ekOf(300),
          spark: 1.0e-6 * 450 * (1500 - 20), bath: 150 * 4200 * (40 - 20), bathOverSpark: (150 * 4200 * 20) / (1.0e-6 * 450 * 1480),
          zeroC: 0 - 273, t300C: 300 - 273, t600C: 600 - 273,
          heatOn: T_HEAT, plateOff: tPlateOff, maxGasDuringHeat: maxGas,
          at300: { gas: tGas(at(K_TH)), th: tTh(at(K_TH)) },
          atEq: { gas: tGas(at(K_EQ) + 3), th: tTh(at(K_EQ) + 3) },
          at600: { gas: tGas(at(K_600)), th: tTh(at(K_600)) },
          endCool: { gas: tGas(END), th: tTh(END) },
          hits: HITS.length,
        };
        out.reading = CAPS.map(([a, b, txt]) => +(txt.length / (b - a - 0.6)).toFixed(1));
        return out;
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.2);
      const boxA = 1 - fade(t, T_BOXOFF, T_BOXON, 0.8, 0.8);
      drawBox(s, t, boxA * fade(t, 0, END + 0.6, 0.1, 0.8));
      drawPanel(s, t, boxA * fade(t, 4.6, END + 0.6, 0.8, 0.8));
      drawSparkBath(s, t, fade(t, T_BOXOFF + 0.4, T_BOXON, 0.8, 0.8));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'What is temperature?', 'Particles, energy and the Kelvin scale');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
