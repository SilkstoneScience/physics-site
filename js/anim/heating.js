/* B.1 Heating ice to steam: what the particles do. A box of water molecules beside a heating curve that
   draws itself (to scale in energy supplied), with a bar for the gain in internal energy, split into random
   kinetic energy and intermolecular potential energy.
   Numbers (typical values for 1.0 kg, checked): ice −20 → 0 °C: Q = 1.0 × 2100 × 20 = 42 kJ (21 s at 2.0 kW);
   melting: Q = mL = 1.0 × 3.34 × 10⁵ = 334 kJ (167 s); water 0 → 100 °C: 1.0 × 4200 × 100 = 420 kJ (210 s);
   boiling: 1.0 × 2.26 × 10⁶ = 2260 kJ (1130 s); steam 100 → 120 °C: 1.0 × 2000 × 20 = 40 kJ (20 s).
   Total 3096 kJ, 1548 s = 25 min 48 s. Kinetic part 42 + 420 + 40 = 502 kJ; potential part 334 + 2260 = 2594 kJ.
   The molecules: a small 2D simulation (soft repulsion, attraction between molecules in the solid and liquid,
   none in the gas), run once when the page loads. A thermostat keeps each group's average kinetic energy
   proportional to the kelvin temperature, so the speeds are proportional to √T (from 253 K to 393 K only ×1.25).
   The number of molecules melted or boiled is proportional to the energy supplied in that phase change. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- the physics of the heating curve (energies in kJ) ----------
  const M = 1.0, P = 2.0;                                           // kg, kW
  const C_ICE = 2100, C_WAT = 4200, C_STM = 2000, LF = 3.34e5, LV = 2.26e6;
  const Q1 = M * C_ICE * 20 / 1000, Q2 = M * LF / 1000, Q3 = M * C_WAT * 100 / 1000, Q4 = M * LV / 1000, Q5 = M * C_STM * 20 / 1000;
  const B1 = Q1, B2 = B1 + Q2, B3 = B2 + Q3, B4 = B3 + Q4, B5 = B4 + Q5;   // 42, 376, 796, 3056, 3096
  const theta = (Q) => Q < B1 ? -20 + Q / (M * C_ICE / 1000) : Q < B2 ? 0 : Q < B3 ? (Q - B2) / (M * C_WAT / 1000)
    : Q < B4 ? 100 : 100 + (Q - B4) / (M * C_STM / 1000);
  const kinetic = (Q) => clamp(Q, 0, B1) + clamp(Q - B2, 0, Q3) + clamp(Q - B4, 0, Q5);
  const potential = (Q) => clamp(Q - B1, 0, Q2) + clamp(Q - B3, 0, Q4);
  const meltFrac = (Q) => clamp((Q - B1) / Q2, 0, 1), boilFrac = (Q) => clamp((Q - B3) / Q4, 0, 1);

  // ---------- timeline (scene seconds) → energy supplied; flat parts: the heater is off while you predict ----------
  const T_ON = 15.0, T_ICE = 24.0, T_P1 = 30.0, T_MELT = 45.0, T_WAT = 57.6, T_P2 = 63.0, T_BOIL = 89.0, T_STM = 95.0;
  const KEYS = [[0, 0], [T_ON, 0], [T_ICE, B1], [T_P1, B1], [T_MELT, B2], [T_WAT, B3], [T_P2, B3], [T_BOIL, B4], [T_STM, B5]];
  const END_CARD = 95.4, DURATION = 108;
  const Qat = (t) => {
    if (t <= KEYS[0][0]) return 0;
    for (let i = 1; i < KEYS.length; i++) {
      const [ta, qa] = KEYS[i - 1], [tb, qb] = KEYS[i];
      if (t <= tb) return qa + (qb - qa) * (t - ta) / (tb - ta);
    }
    return B5;
  };
  const tOfQ = (Q, ta, tb, qa, qb) => ta + (tb - ta) * (Q - qa) / (qb - qa);
  const heaterOn = (t) => (t > T_ON && t < T_ICE) || (t > T_P1 && t < T_WAT) || (t > T_P2 && t < T_STM);

  // ---------- the molecules (lengths in molecule diameters σ, time in scene seconds) ----------
  const COLS = 9, ROWS = 4, N = COLS * ROWS, A_LAT = 1.06;
  const WB = 0.55 * 2 + (COLS - 0.5) * A_LAT;                          // inside width of the box: 10.11
  const LID0 = 0.55 + (ROWS - 1) * A_LAT * 0.866 + 0.5 + 0.45;         // the lid rests just above the ice: 4.25
  const KT0 = 9, kT = (TK) => KT0 * TK / 273;                         // ½(vx² + vy²) per molecule, in (σ/s)², ∝ T
  const KR = 4000, KW = 4000, K_TETHER = 600, K_ROT = 200, A_ATT = 40, GRAV = 12, INERTIA = 0.25;
  const A_LIQ = 0.93, A_GAS = 4.3;                                    // area per molecule (σ²): liquid, gas at 373 K
  const DT = 0.002, SAMPLE = 0.02, PER = Math.round(SAMPLE / DT);
  let seed = 20261116;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

  const SIM = (() => {
    const x = new Float64Array(N), y = new Float64Array(N), vx = new Float64Array(N), vy = new Float64Array(N);
    const ph = new Float64Array(N), om = new Float64Array(N), ax = new Float64Array(N), ay = new Float64Array(N);
    const sx = new Float64Array(N), sy = new Float64Array(N), sph = new Float64Array(N), dia = new Float64Array(N);
    const st = new Int8Array(N);                                        // 0 solid, 1 liquid, 2 gas
    const tMelt = new Float64Array(N).fill(Infinity), tBoil = new Float64Array(N).fill(Infinity);
    const nb = [];                                                      // lattice neighbours (for drawing the bonds)
    for (let r = 0, i = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++, i++) {
      sx[i] = 0.55 + c * A_LAT + (r % 2 ? A_LAT / 2 : 0); sy[i] = 0.55 + r * A_LAT * 0.866;
      sph[i] = (r % 2 ? Math.PI / 2 : -Math.PI / 2) + (c % 2 ? 0.18 : -0.18);
      x[i] = sx[i]; y[i] = sy[i]; ph[i] = sph[i]; dia[i] = 1 + 0.08 * (rnd() - 0.5);
      const s0 = Math.sqrt(kT(253)); vx[i] = s0 * gauss(); vy[i] = s0 * gauss();
    }
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (Math.hypot(sx[i] - sx[j], sy[i] - sy[j]) < A_LAT * 1.05) nb.push([i, j]);
    // melting order: from the outside of the block inwards, a little irregular
    const cxB = WB / 2, cyB = sy[N - 1] / 2;
    const order = [...Array(N).keys()].map((i) => [i, -Math.max(Math.abs(sx[i] - cxB) / (WB / 2), Math.abs(sy[i] - cyB) / (cyB + 0.6)) - 0.25 * rnd()])
      .sort((a, b) => a[1] - b[1]).map((p) => p[0]);
    const meltTimes = order.map((_, k) => tOfQ(B1 + Q2 * (k + 0.5) / N, T_P1, T_MELT, B1, B2));
    const boilTimes = Array.from({ length: N }, (_, k) => tOfQ(B3 + Q4 * (k + 0.5) / N, T_P2, T_BOIL, B3, B4));
    let nMelt = 0, nBoil = 0, lid = LID0;

    const forces = (lidNow) => {
      ax.fill(0); ay.fill(0);
      for (let i = 0; i < N; i++) {
        if (st[i] === 0) { ax[i] += -K_TETHER * (x[i] - sx[i]); ay[i] += -K_TETHER * (y[i] - sy[i]); }
        else if (st[i] === 1) ay[i] -= GRAV;
        if (x[i] < 0.5) ax[i] += KW * (0.5 - x[i]); else if (x[i] > WB - 0.5) ax[i] -= KW * (x[i] - WB + 0.5);
        if (y[i] < 0.5) ay[i] += KW * (0.5 - y[i]); else if (y[i] > lidNow - 0.5) ay[i] -= KW * (y[i] - lidNow + 0.5);
        for (let j = i + 1; j < N; j++) {
          const dx = x[j] - x[i], dy = y[j] - y[i], r2 = dx * dx + dy * dy, d = (dia[i] + dia[j]) / 2;
          if (r2 > (d + 0.5) * (d + 0.5)) continue;
          const r = Math.sqrt(r2) || 1e-9;
          let f = 0;                                                    // f > 0 pushes the pair apart
          if (r < d) f = KR * (d - r);
          else if (st[i] !== 2 && st[j] !== 2 && !(st[i] === 0 && st[j] === 0)) f = -A_ATT * Math.sin(Math.PI * (r - d) / 0.5);
          if (!f) continue;
          const fx = f * dx / r, fy = f * dy / r;
          ax[i] -= fx; ay[i] -= fy; ax[j] += fx; ay[j] += fy;
        }
      }
    };
    const nS = Math.round(DURATION / SAMPLE) + 1;
    const PX = new Float32Array(nS * N), PY = new Float32Array(nS * N), PH = new Float32Array(nS * N), LID = new Float32Array(nS);
    const save = (k) => { for (let i = 0; i < N; i++) { PX[k * N + i] = x[i]; PY[k * N + i] = y[i]; PH[k * N + i] = ph[i]; } LID[k] = lid; };
    save(0);
    forces(lid);
    const steps = (nS - 1) * PER;
    for (let n = 1; n <= steps; n++) {
      const t = n * DT, TK = theta(Qat(t)) + 273, kt = kT(TK);
      // phase changes, in proportion to the energy supplied
      while (nMelt < N && t >= meltTimes[nMelt]) { const i = order[nMelt++]; st[i] = 1; tMelt[i] = t; }
      while (nBoil < N && t >= boilTimes[nBoil]) {
        let top = -1; for (let i = 0; i < N; i++) if (st[i] === 1 && (top < 0 || y[i] > y[top])) top = i;
        if (top < 0) break;
        st[top] = 2; tBoil[top] = t; nBoil++;
        const sp = Math.sqrt(2 * kt); vx[top] = sp * (rnd() - 0.5) * 0.8; vy[top] = sp;
      }
      // the lid: resting just above the ice until boiling starts, then pushed up by the steam (area ∝ T for the gas)
      let nl = 0, ng = 0; for (let i = 0; i < N; i++) { if (st[i] === 1) nl++; else if (st[i] === 2) ng++; }
      const want = ng ? Math.max(LID0, (nl * A_LIQ + ng * A_GAS * TK / 373) / WB + 0.6) : LID0;
      lid += (want - lid) * DT / 0.4;
      // velocity Verlet
      for (let i = 0; i < N; i++) { vx[i] += 0.5 * ax[i] * DT; vy[i] += 0.5 * ay[i] * DT; x[i] += vx[i] * DT; y[i] += vy[i] * DT; }
      forces(lid);
      for (let i = 0; i < N; i++) { vx[i] += 0.5 * ax[i] * DT; vy[i] += 0.5 * ay[i] * DT; }
      // thermostat for each group: average ½(vx² + vy²) = kT, so speeds ∝ √T
      for (let g = 0; g < 3; g++) {
        let ke = 0, n0 = 0;
        for (let i = 0; i < N; i++) if (st[i] === g) { ke += 0.5 * (vx[i] * vx[i] + vy[i] * vy[i]); n0++; }
        if (!n0 || ke <= 0) continue;
        const lam = clamp(Math.sqrt(1 + (DT / 0.08) * (n0 * kt / ke - 1)), 0.95, 1.05);
        for (let i = 0; i < N; i++) if (st[i] === g) { vx[i] *= lam; vy[i] *= lam; }
      }
      // turning (Langevin): rms angular speed ∝ √T; the solid only rocks about its regular direction
      for (let i = 0; i < N; i++) {
        const gam = st[i] === 2 ? 0.6 : 3, torque = st[i] === 0 ? -K_ROT * (ph[i] - sph[i]) : 0;
        om[i] += (-gam * om[i] + torque / INERTIA) * DT + Math.sqrt(2 * gam * kt / INERTIA * DT) * gauss();
        ph[i] += om[i] * DT;
      }
      if (n % PER === 0) save(n / PER);
    }
    return { PX, PY, PH, LID, nS, tMelt, tBoil, nb, order };
  })();
  const at = (t) => {
    const f = clamp(t / SAMPLE, 0, SIM.nS - 1.001), k = Math.floor(f), u = f - k;
    return { k, u, lid: lerp(SIM.LID[k], SIM.LID[k + 1], u) };
  };
  const pos = (k, u, i) => [lerp(SIM.PX[k * N + i], SIM.PX[(k + 1) * N + i], u), lerp(SIM.PY[k * N + i], SIM.PY[(k + 1) * N + i], u)];
  const angle = (k, u, i) => lerp(SIM.PH[k * N + i], SIM.PH[(k + 1) * N + i], u);
  const stateOf = (i, t) => (t >= SIM.tBoil[i] ? 2 : t >= SIM.tMelt[i] ? 1 : 0);
  const LIDMAX = Math.max(...SIM.LID);

  // ---------- captions ----------
  const CAPS = [
    [4.8, 9.8, '1.0 kg of ice at −20 °C (253 K), with a 2.0 kW heater below. No energy is lost to the surroundings.'],
    [10.0, 14.8, 'In ice, each molecule vibrates about a fixed place in a regular pattern, held by attractions to its neighbours.'],
    [15.0, 19.6, 'The heater is on. The molecules vibrate faster: their random kinetic energy rises, and so does the temperature.'],
    [19.8, 24.2, 'Q = mcΔT = 1.0 × 2100 × 20 = 42 kJ to warm the ice to 0 °C (21 s at 2.0 kW).'],
    [24.4, 29.8, 'Predict: what happens to the temperature while the ice melts?'],
    [30.0, 35.0, 'It stays at 0 °C. The energy breaks up the regular pattern instead of making the molecules move faster.'],
    [35.2, 40.0, 'Potential energy rises; kinetic energy doesn\'t. Q = mL = 1.0 × 3.34 × 10⁵ = 334 kJ (167 s).'],
    [40.2, 45.0, 'In the liquid, the molecules slide past each other but stay close together.'],
    [45.2, 50.6, 'Now the water warms up: the molecules move faster, so the temperature rises again.'],
    [50.8, 57.4, 'Q = mcΔT = 1.0 × 4200 × 100 = 420 kJ. The slope is half as steep as for ice: c is twice as big.'],
    [57.8, 62.9, 'Predict: will boiling need more energy than melting, or less?'],
    [63.1, 68.6, 'Far more. Q = mL = 1.0 × 2.26 × 10⁶ = 2260 kJ: almost 7 times the energy needed to melt the ice.'],
    [68.8, 74.0, 'The molecules are pulled right apart, against their attractions. The temperature stays at 100 °C.'],
    [74.2, 79.4, 'Steam molecules move no faster than those in the boiling water (same temperature): they are just far apart.'],
    [79.6, 84.6, 'The steam pushes the lid up. Really, it takes up about 1600 times the volume of the boiling water.'],
    [84.8, 89.6, 'Boiling takes 1130 s (almost 19 minutes) at 2.0 kW. Melting took 167 s.'],
    [89.8, 95.2, 'Steam warms quickly: Q = mcΔT = 1.0 × 2000 × 20 = 40 kJ, to 120 °C (393 K).'],
  ];

  // ---------- colours ----------
  const KE = C.vel, PE = C.field, HEAT = '255,140,80', O_RGB = '110,180,255', H_RGB = '236,242,255', WALL = '150,165,230';

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = W < 520;
    const capFs = clamp(W / 44, 15, 25), capTop = H - capFs * (phone ? 6.6 : 5.4);
    const fs = phone ? 10 : Math.round(clamp(W / 80, 11, 16));
    const floorY = capTop - fs * 3.4;
    const bx0 = phone ? 8 : W * 0.035, bx1 = phone ? W * 0.44 : W * 0.43, by0 = phone ? s.top + 4 : Math.max(44, H * 0.1);
    const px0 = phone ? W * 0.47 : W * 0.47, px1 = W - (phone ? 6 : W * 0.03), py0 = phone ? s.top + 4 : Math.max(52, H * 0.12);
    const plot = phone
      ? { x0: px0 + fs * 2.3, x1: px1 - fs * 2.2, y0: py0 + fs * 7.6, y1: capTop - fs * 6.9 }
      : { x0: px0 + fs * 3.0, x1: px1 - fs * 3.0, y0: py0 + fs * 5.2, y1: capTop - fs * 7.1 };
    L = { W, H, phone, fs, capTop, floorY, bx0, bx1, by0, px0, px1, py0, plot,
      X: (Q) => plot.x0 + (Q / 3200) * (plot.x1 - plot.x0),
      Y: (th) => plot.y1 - ((th + 30) / 160) * (plot.y1 - plot.y0) };
  }
  // pixels per σ: the whole box (up to the lid) always fits its area
  const scaleAt = (lid) => Math.min((L.bx1 - L.bx0) / (WB + 0.7), (L.floorY - L.by0) / (lid + 0.9));

  // text made of pieces: [text, style], style 'i' italic serif, 'r' upright serif, 's' italic subscript, 'o' italic with a bar over it, 'sans'
  function rich(s, parts, x, y, size, a, rgb = C.text, align = 'center') {
    const { g } = s; if (a <= 0) return 0;
    const font = (st) => st === 's' ? D.serif(Math.round(size * 0.7)) : st === 'i' || st === 'o' ? D.serif(size) : st === 'r' ? D.serif(size, false) : D.sans(Math.round(size * 0.9));
    const ws = parts.map(([tx, st]) => { g.font = font(st); return g.measureText(tx).width; });
    const total = ws.reduce((p, q) => p + q, 0);
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`;
    parts.forEach(([tx, st], i) => {
      g.font = font(st); g.fillText(tx, px, st === 's' ? y + size * 0.28 : y);
      if (st === 'o') { g.fillRect(px + ws[i] * 0.2, y - size * 0.62, ws[i] * 0.75, Math.max(1, size * 0.07)); }
      px += ws[i];
    });
    g.shadowBlur = 0;
    return total;
  }
  const fmtTime = (sec) => { const m = Math.floor(sec / 60), q = Math.floor(sec - 60 * m); return `${m}:${String(q).padStart(2, '0')}`; };
  const num = (v, dp) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(dp);

  // ---------- the box of molecules ----------
  function drawBox(s, t, Q) {
    const { g } = s, { k, u, lid } = at(t), sc = scaleAt(lid);
    const left = (L.bx0 + L.bx1) / 2 - (WB * sc) / 2, floor = L.floorY;
    const X = (xx) => left + xx * sc, Y = (yy) => floor - yy * sc;
    const on = heaterOn(t), TK = theta(Q) + 273;
    // the heater under the floor, glowing when on
    const hy = floor + Math.max(5, L.fs * 0.55), glow = on ? 1 : 0.18;
    const coil = [];
    for (let i = 0; i <= 120; i++) { const xx = lerp(-0.1, WB + 0.1, i / 120); coil.push([X(xx), hy + Math.sin(i / 120 * Math.PI * 26) * Math.max(2, L.fs * 0.22)]); }
    D.glowLine(s, coil, HEAT, 0.25 + 0.7 * glow, 1.4);
    if (on) for (let i = 0; i < 7; i++) {                              // energy flowing up into the box
      const ph0 = ((s.clock * 0.9 + i / 7) % 1), xx = X((i + 0.5) / 7 * WB), yy = floor - ph0 * Math.min(sc * 1.6, 40);
      D.glowDot(s, xx + Math.sin(ph0 * 9 + i) * 2, yy + 4, Math.max(5, sc * 0.22), HEAT, 0.5 * Math.sin(Math.PI * ph0));
    }
    // a faint warm glow along the floor while heating
    if (on) { const gr = g.createLinearGradient(0, floor, 0, floor - sc * 1.4); gr.addColorStop(0, `rgba(${HEAT},0.12)`); gr.addColorStop(1, `rgba(${HEAT},0)`); g.fillStyle = gr; g.fillRect(X(0), floor - sc * 1.4, WB * sc, sc * 1.4); }
    // walls and floor
    const wallTop = Y(Math.max(LIDMAX, lid) + 0.6);
    D.glowLine(s, [[X(0), wallTop], [X(0), floor], [X(WB), floor], [X(WB), wallTop]], WALL, 0.55, 1.3);
    // bonds (attractions): regular links in the solid, fleeting ones in the liquid
    g.lineCap = 'round';
    const P = []; for (let i = 0; i < N; i++) P.push(pos(k, u, i));
    const S = []; for (let i = 0; i < N; i++) S.push(stateOf(i, t));
    for (const [i, j] of SIM.nb) if (S[i] === 0 && S[j] === 0) D.line(s, X(P[i][0]), Y(P[i][1]), X(P[j][0]), Y(P[j][1]), PE, 0.55, Math.max(1.2, sc * 0.09));
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      if (S[i] === 2 || S[j] === 2 || (S[i] === 0 && S[j] === 0)) continue;
      const r = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]);
      if (r < 1.16) D.line(s, X(P[i][0]), Y(P[i][1]), X(P[j][0]), Y(P[j][1]), PE, 0.3 * smooth((1.16 - r) / 0.1), Math.max(1, sc * 0.07));
    }
    // short trails: how far each molecule moved in the last 0.12 s
    for (let i = 0; i < N; i++) {
      const pts = [];
      for (let b = 6; b >= 0; b--) { const kk = Math.max(0, k - b); pts.push([X(SIM.PX[kk * N + i]), Y(SIM.PY[kk * N + i])]); }
      pts[pts.length - 1] = [X(P[i][0]), Y(P[i][1])];
      D.glowLine(s, pts, KE, 0.2, Math.max(0.8, sc * 0.07));
    }
    // molecules: oxygen with two hydrogens (H–O–H angle 104.5°)
    for (let i = 0; i < N; i++) {
      const cx = X(P[i][0]), cy = Y(P[i][1]), a = angle(k, u, i), rO = sc * 0.42, rH = sc * 0.2;
      const gl = g.createRadialGradient(cx, cy, 0, cx, cy, sc * 0.9);
      gl.addColorStop(0, `rgba(${O_RGB},0.25)`); gl.addColorStop(1, `rgba(${O_RGB},0)`);
      g.fillStyle = gl; g.beginPath(); g.arc(cx, cy, sc * 0.9, 0, 7); g.fill();
      const ball = (bx, by, r, rgb, hi) => {
        const gr = g.createRadialGradient(bx - r * 0.35, by - r * 0.35, r * 0.1, bx, by, r);
        gr.addColorStop(0, `rgba(${hi},1)`); gr.addColorStop(1, `rgba(${rgb},1)`);
        g.fillStyle = gr; g.beginPath(); g.arc(bx, by, r, 0, 7); g.fill();
      };
      ball(cx, cy, rO, '40,95,190', '170,215,255');
      for (const sgn of [-1, 1]) {
        const b = a + sgn * 0.912;
        ball(cx + Math.cos(b) * sc * 0.4, cy - Math.sin(b) * sc * 0.4, rH, '150,160,190', H_RGB);
      }
    }
    // the lid (free to move up and down)
    const ly = Y(lid), lt = Math.max(4, sc * 0.28);
    g.fillStyle = 'rgba(60,72,130,0.95)'; g.fillRect(X(0) + 1, ly - lt, WB * sc - 2, lt);
    D.line(s, X(0) + 1, ly - lt, X(WB) - 1, ly - lt, '200,210,255', 0.7, 1.2);
    D.line(s, X(0) + 1, ly, X(WB) - 1, ly, WALL, 0.5, 1);
    const kw = Math.max(10, sc * 1.2), kh = Math.max(4, sc * 0.3);
    g.fillStyle = 'rgba(80,94,160,0.95)'; g.fillRect(X(WB / 2) - kw / 2, ly - lt - kh, kw, kh);
    return { X, Y, sc, ly: ly - lt - kh, TK };
  }

  // ---------- the graph and the internal-energy bar ----------
  function drawGraph(s, t, Q, a) {
    if (a <= 0) return;
    const { g } = s, { plot: p, fs, phone, X, Y, px0, px1, py0 } = L;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(14,20,44,${0.72 * a})`;
    g.beginPath(); g.roundRect(px0 - 6, py0 - 6, px1 - px0 + 12, L.capTop - py0 - fs * 0.2, 10); g.fill();
    // live readouts
    const th = theta(Q), TK = th + 273, lh = fs * 1.45;
    const thTxt = ` = ${num(th, 1)} °C`, tkTxt = ` = ${TK.toFixed(1)} K`, qTxt = ` = ${Q < 9.95 ? Q.toFixed(1) : Math.round(Q)} kJ`, tmTxt = `time at 2.0 kW: ${fmtTime(Q / P)}`;
    if (phone) {
      rich(s, [['θ', 'i'], [thTxt, 'sans']], px0, py0 + fs * 0.8, fs + 2, a, C.light, 'left');
      rich(s, [['T', 'i'], [tkTxt, 'sans']], px0, py0 + fs * 0.8 + lh, fs + 2, a, C.light, 'left');
      rich(s, [['Q', 'i'], [qTxt, 'sans']], px0, py0 + fs * 0.8 + 2 * lh, fs + 2, a, HEAT, 'left');
      D.text(s, `time: ${fmtTime(Q / P)}`, px0, py0 + fs * 0.8 + 3 * lh, fs, 0.8 * a, D.sans(fs), C.muted, 'left');
    } else {
      const w1 = rich(s, [['θ', 'i'], [thTxt, 'sans']], px0, py0 + fs * 0.8, fs + 3, a, C.light, 'left');
      rich(s, [['T', 'i'], [tkTxt, 'sans']], px0 + Math.max(w1 + fs * 2, (px1 - px0) * 0.32), py0 + fs * 0.8, fs + 3, a, C.light, 'left');
      const w2 = rich(s, [['Q', 'i'], [qTxt, 'sans']], px0, py0 + fs * 0.8 + lh * 1.1, fs + 3, a, HEAT, 'left');
      D.text(s, tmTxt, px0 + Math.max(w2 + fs * 2, (px1 - px0) * 0.32), py0 + fs * 0.8 + lh * 1.1, fs, 0.8 * a, D.sans(fs), C.muted, 'left');
      D.text(s, heaterOn(t) ? 'heater on' : t < T_ON ? 'heater off' : 'heater off: predict!', px1, py0 + fs * 0.8, fs, (heaterOn(t) ? 0.8 : 0.6) * a, D.sans(fs, 600), heaterOn(t) ? HEAT : C.muted, 'right');
    }
    // axes: °C on the left, K on the right (T / K = θ / °C + 273)
    const ticks = phone ? [-20, 0, 50, 100, 120] : [-20, 0, 20, 40, 60, 80, 100, 120];
    for (const v of ticks) {
      const y = Y(v), main = v === 0 || v === 100;
      D.line(s, p.x0, y, p.x1, y, C.muted, (main ? 0.32 : 0.1) * a, 1, main ? null : [3, 4]);
      D.text(s, num(v, 0), p.x0 - 4, y, fs - 1, 0.75 * a, D.sans(fs - 1), C.muted, 'right');
      D.text(s, String(v + 273), p.x1 + 4, y, fs - 1, 0.75 * a, D.sans(fs - 1), C.muted, 'left');
    }
    D.line(s, p.x0, p.y1, p.x0, p.y0 - fs * 0.4, C.muted, 0.6 * a, 1.2);
    D.line(s, p.x1, p.y1, p.x1, p.y0 - fs * 0.4, C.muted, 0.6 * a, 1.2);
    D.line(s, p.x0, p.y1, p.x1, p.y1, C.muted, 0.6 * a, 1.2);
    rich(s, [['θ', 'i'], [' / °C', 'sans']], p.x0, p.y0 - fs * 1.2, fs + 1, 0.85 * a, C.muted, phone ? 'left' : 'center');
    rich(s, [['T', 'i'], [' / K', 'sans']], p.x1, p.y0 - fs * 1.2, fs + 1, 0.85 * a, C.muted, phone ? 'right' : 'center');
    for (let e = 0; e <= 3000; e += 1000) {
      const x = X(e);
      D.line(s, x, p.y1, x, p.y1 + 4, C.muted, 0.6 * a, 1);
      D.text(s, String(e), x, p.y1 + fs * 1.0, fs - 1, 0.75 * a, D.sans(fs - 1), C.muted);
    }
    rich(s, phone ? [['Q', 'i'], [' / kJ', 'sans']] : [['energy supplied, ', 'sans'], ['Q', 'i'], [' / kJ  (to scale)', 'sans']], (p.x0 + p.x1) / 2, p.y1 + fs * 2.15, fs, 0.8 * a, C.muted);
    // the curve, drawn up to Q: slopes blue (kinetic energy rising), flat parts violet (potential energy rising)
    const segs = [[0, B1, KE], [B1, B2, PE], [B2, B3, KE], [B3, B4, PE], [B4, B5, KE]];
    for (const [q0, q1, rgb] of segs) {
      if (Q <= q0) break;
      const qe = Math.min(Q, q1);
      D.glowLine(s, [[X(q0), Y(theta(q0 + 1e-9))], [X(qe), Y(theta(qe - 1e-9))]], rgb, a, phone ? 1.8 : 2.2);
    }
    // labels on the curve ("melting" sits just after its short flat part, below the water slope)
    const lab = (txt, x, y, al, rgb, align = 'center') => D.text(s, txt, x, y, fs, al * a, D.sans(fs, 600), rgb, align);
    const sub = (txt, x, y, al, rgb, align = 'center') => D.text(s, txt, x, y, fs - 1, 0.8 * al * a, D.sans(fs - 1), rgb, align);
    lab('ice', X(B1) + fs * 0.5, Y(-13), smooth((Q - 5) / 8), KE, 'left');
    lab('melting', X(B2) + fs * 0.8, Y(0) + fs * 0.1, smooth((Q - B1 - 30) / 40), PE, 'left');
    lab('water', X(B2 + 210) + fs * 0.6, Y(50) + fs * 0.4, smooth((Q - B2 - 120) / 60), KE, 'left');
    lab('boiling', (X(B3) + X(B4)) / 2, Y(100) - fs * 1.0, smooth((Q - B3 - 150) / 120), PE);
    lab('steam', X(B5) - fs * 0.5, Y(100) - fs * 2.2, smooth((Q - B4 - 10) / 15), KE, 'right');
    if (!phone) sub(`${Q2} kJ`, X(B2) + fs * 0.8, Y(0) + fs * 1.25, smooth((Q - B2 + 5) / 10), PE, 'left');
    sub(`${Q4} kJ`, (X(B3) + X(B4)) / 2, Y(100) + fs * 1.0, smooth((Q - B4 + 5) / 20), PE);
    if (!phone) sub(`${Q3} kJ`, X(B2 + 210) + fs * 0.6, Y(50) + fs * 1.55, smooth((Q - B3 + 5) / 10), KE, 'left');
    // the pen
    const pr = phone ? 9 : 13, pulse = heaterOn(t) ? 1 : 0.75 + 0.25 * Math.sin(s.clock * 5);
    if (t > 4.5) D.glowDot(s, X(Q), Y(theta(Q)), pr * pulse * 1.4, C.light, a);
    // the gain in internal energy: kinetic + potential, on the same kJ scale as the graph
    const ke = kinetic(Q), pe = potential(Q), yb = p.y1 + fs * 4.15, bh = Math.max(6, fs * 0.75);
    D.text(s, phone ? 'gain in internal energy / kJ' : 'gain in internal energy / kJ (same scale)', p.x0, yb - fs * 0.6, fs - 1, 0.8 * a, D.sans(fs - 1), C.muted, 'left');
    g.fillStyle = `rgba(255,255,255,${0.06 * a})`; g.fillRect(X(0), yb, X(3200) - X(0), bh);
    const seg = (x0, x1, rgb) => { if (x1 - x0 <= 0.2) return; g.fillStyle = `rgba(${rgb},${0.9 * a})`; g.shadowColor = `rgba(${rgb},${0.7 * a})`; g.shadowBlur = 8; g.fillRect(x0, yb, x1 - x0, bh); g.shadowBlur = 0; };
    seg(X(0), X(ke), KE); seg(X(ke), X(ke + pe), PE);
    const ly = yb + bh + fs * 0.95, sq = fs * 0.7;
    const t1 = `${phone ? 'kinetic' : 'random kinetic'} ${Math.round(ke)}`, t2 = `${phone ? 'potential' : 'intermolecular potential'} ${Math.round(pe)}`;
    g.font = D.sans(fs - 1);
    g.fillStyle = `rgba(${KE},${a})`; g.fillRect(p.x0, ly - sq / 2, sq, sq);
    D.text(s, t1, p.x0 + sq + 4, ly, fs - 1, 0.9 * a, D.sans(fs - 1), KE, 'left');
    const x2 = p.x0 + sq + 4 + g.measureText(t1).width + fs * 1.2;
    g.fillStyle = `rgba(${PE},${a})`; g.fillRect(x2, ly - sq / 2, sq, sq);
    D.text(s, t2, x2 + sq + 4, ly, fs - 1, 0.9 * a, D.sans(fs - 1), PE, 'left');
  }

  // a key above the box: one molecule, labelled
  function drawKey(s, t, box) {
    const a = fade(t, 5.4, T_P2 + 2, 0.8, 1.2); if (a <= 0) return;
    const { g } = s, { fs } = L;
    const sc = Math.min(box.sc * 1.1, L.phone ? 30 : 56), cx = (L.bx0 + L.bx1) / 2, cy = L.by0 + sc * 0.9 + fs * 0.4;
    if (cy + sc * 1.2 + fs * 1.6 > box.ly) return;                    // no room above the lid
    g.globalAlpha = a;
    const ball = (bx, by, r, rgb, hi) => {
      const gr = g.createRadialGradient(bx - r * 0.35, by - r * 0.35, r * 0.1, bx, by, r);
      gr.addColorStop(0, `rgba(${hi},1)`); gr.addColorStop(1, `rgba(${rgb},1)`);
      g.fillStyle = gr; g.beginPath(); g.arc(bx, by, r, 0, 7); g.fill();
    };
    const ang = Math.PI / 2 + 0.25 * Math.sin(s.clock * 0.8);
    ball(cx, cy, sc * 0.42, '40,95,190', '170,215,255');
    const hs = [-1, 1].map((sgn) => { const b = -ang + sgn * 0.912; return [cx + Math.cos(b) * sc * 0.4, cy - Math.sin(b) * sc * 0.4]; });
    hs.forEach(([hx, hy]) => ball(hx, hy, sc * 0.2, '150,160,190', H_RGB));
    g.globalAlpha = 1;
    D.text(s, 'O', cx, cy, Math.round(sc * 0.36), a, D.sans(Math.round(sc * 0.36), 600), '10,30,70');
    hs.forEach(([hx, hy]) => D.text(s, 'H', hx, hy + 0.5, Math.round(sc * 0.2), a, D.sans(Math.round(sc * 0.2), 700), '40,50,80'));
    D.text(s, 'a water molecule, H₂O', cx, cy + sc * 0.95 + fs * 0.4, fs, 0.8 * a, D.sans(fs), C.muted);
  }

  function boxLabels(s, t, Q, box) {
    const a = smooth((t - 4.8) / 0.8) * (1 - smooth((t - END_CARD) / 0.8)); if (a <= 0) return;
    const { fs, phone, floorY } = L, cx = (L.bx0 + L.bx1) / 2, y = floorY + fs * 2.1;
    const mf = meltFrac(Q), bf = boilFrac(Q);
    const txt = Q < B1 ? 'ice (solid)' : mf < 1 && t < T_P1 + 0.01 ? 'ice (solid) at 0 °C'
      : mf < 1 ? `melting: ${mf.toFixed(2)} kg of water` : Q < B3 ? 'water (liquid)'
        : bf === 0 ? 'water at 100 °C' : bf < 1 ? `boiling: ${bf.toFixed(2)} kg of steam` : 'steam (gas)';
    D.text(s, txt, cx, y, fs + (phone ? 0 : 1), a, D.sans(fs + (phone ? 0 : 1), 600), Q >= B1 && (mf < 1 && t > T_P1 || (bf > 0 && bf < 1)) ? PE : C.text);
  }

  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 38)), s2 = Math.round(clamp(W / 30, 18, 38)), s3 = Math.round(clamp(W / 58, 12, 18));
    g.font = D.sans(s1, 300);
    const l1 = D.wrap(s, 'Internal energy = random kinetic energy + intermolecular potential energy', W - 48);
    let y = H * (phone ? 0.2 : 0.22);
    D.text(s, l1, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * l1.length + s2 * 0.5;
    const items = [
      [[['Q', 'i'], [' = ', 'r'], ['mc', 'i'], ['Δ', 'r'], ['T', 'i']], KE, 'Temperature changes: the kinetic energy changes.'],
      [[['Q', 'i'], [' = ', 'r'], ['mL', 'i']], PE, 'Phase change: the potential energy changes; the temperature stays constant.'],
      [[['E', 'o'], ['k', 's'], [' = ', 'r'], ['3', 'r'], ['/', 'r'], ['2', 'r'], [' ', 'r'], ['k', 'i'], ['B', 's'], [' ', 'r'], ['T', 'i']], C.text, 'The kelvin temperature measures the average kinetic energy of the particles.'],
    ];
    if (phone) {
      g.font = D.sans(s3);
      for (const [eq, rgb, txt] of items) {
        rich(s, eq, W / 2, y, s2, a, rgb); y += s2 * 1.05;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 40); D.text(s, ls, W / 2, y, s3, 0.8 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.55;
      }
    } else {
      const colW = Math.min(W * 0.3, 330);
      g.font = D.sans(s3);
      items.forEach(([eq, rgb, txt], i) => {
        const x = W / 2 + (i - 1) * W * 0.31;
        rich(s, eq, x, y, s2, a, rgb);
        g.font = D.sans(s3); D.text(s, D.wrap(s, txt, colW), x, y + s2 * 1.15, s3, 0.8 * a, D.sans(s3));
      });
      y += s2 * 1.15 + s3 * 1.3 * 3 + s3;
    }
    g.font = D.sans(s3 - 1);
    D.text(s, D.wrap(s, 'The formula for the average kinetic energy is exact for an ideal monatomic gas (B.1).', Math.min(W - 40, 760)), W / 2, Math.max(y, H * 0.8), s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('heating', {
    duration: DURATION,
    poster: 66,
    // score: warm and rising (F major, a triangle pad, a soft shimmer)
    music: { chords: [[53, 57, 60, 64], [50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64]], bar: 8, pad: 'triangle', cutoff: 900, drone: 0.09, shimmer: 0.3, volume: 0.41 },
    resize: layout,
    // for checking the numbers (not used by the player)
    info: { Q1, Q2, Q3, Q4, Q5, B5, theta, kinetic, potential, Qat, SIM, CAPS, LIDMAX, WB, LID0, kT, pos, at, stateOf },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      const Q = Qat(t);
      D.background(s, 0.22);
      const box = drawBox(s, t, Q);
      drawKey(s, t, box);
      boxLabels(s, t, Q, box);
      drawGraph(s, t, Q, smooth((t - 4.6) / 0.9) * (1 - smooth((t - END_CARD) / 0.8)));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Heating ice to steam', 'What do the particles do?');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
