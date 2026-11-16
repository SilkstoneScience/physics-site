/* B.3 Where gas pressure comes from: molecules changing momentum at the walls.
   A simplified two-dimensional simulation, calculated once when the page loads (fixed seed, fixed steps),
   so every frame is a pure function of the scene time:
   - 120 hard discs (mass 1, diameter 0.012) in a box 0.9 high; the piston starts 1.6 from the left wall.
     Steps of 1/240 s; collisions with the walls and with each other are elastic (equal masses swap their
     velocity components along the line of centres), and a moving piston reflects a molecule at 2u_piston − v_x.
   - Pressure is measured from the momentum delivered to all four walls: Σ(impulse) ÷ (wall length × time).
     (2D ideal gas: P = KE_total ÷ area, checked in scene.numbers.)
   - Halving the volume: the piston steps in slowly (V = 0.8, 2/3, 4/7, 1/2 of V0). While it moves, the speeds are
     scaled back to the starting kinetic energy, so the temperature stays the same ("kept at constant temperature").
   - Heating at constant volume: the speeds are scaled up step by step until the kinetic energy (and so the kelvin
     temperature) has doubled, 300 K → 600 K; every speed becomes √2 times as large.
   The readouts are measured from the simulation (scene.numbers holds them, for checking). */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- the simulation ----------
  const N = 120, HB = 0.9, L0 = 1.6, SIG = 0.012, VR0 = 0.7, T0K = 300;
  const DT = 1 / 240, PER = 4, FPS = 60, SIM_END = 86;
  const MOVES = [[41.6, 42.8, L0, 0.8 * L0], [44.8, 46.0, 0.8 * L0, L0 / 1.5], [48.0, 49.2, L0 / 1.5, L0 / 1.75], [51.2, 52.4, L0 / 1.75, L0 / 2]];
  const HEATS = [[68.4, 69.1, 300, 375], [70.7, 71.4, 375, 450], [73.0, 73.7, 450, 525], [75.3, 76.0, 525, 600]];
  const steps = (list, t, v0) => {
    let v = v0;
    for (const [a, b, x0, x1] of list) {
      if (t < a) return v;
      if (t < b) return lerp(x0, x1, smooth((t - a) / (b - a)));
      v = x1;
    }
    return v;
  };
  const Lp = (t) => steps(MOVES, t, L0);          // piston position
  const Tk = (t) => steps(HEATS, t, T0K);         // kelvin temperature the gas is held at

  const NF = Math.round(SIM_END * FPS) + 2;
  const PX = new Float32Array(NF * N), PY = new Float32Array(NF * N), SP = new Float32Array(NF * N);
  const binI = new Float64Array(NF), binH = new Float64Array(NF), binP = new Float64Array(NF), binN = new Float64Array(NF), binW = new Float64Array(NF);
  const HT = [], HW = [], HS = [], HJ = [];          // every wall hit: time, wall (0 left, 1 piston, 2 bottom, 3 top), place along the wall, impulse
  let pairHits = 0;
  {
    let seed = 20261116; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const x = new Float64Array(N), y = new Float64Array(N), vx = new Float64Array(N), vy = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      for (let tries = 0; tries < 999; tries++) {
        x[i] = 0.02 + rnd() * (L0 - 0.04); y[i] = 0.02 + rnd() * (HB - 0.04);
        let ok = true; for (let j = 0; j < i; j++) if ((x[i] - x[j]) * (x[i] - x[j]) + (y[i] - y[j]) * (y[i] - y[j]) < 16 * SIG * SIG) { ok = false; break; }
        if (ok) break;
      }
      // near-Gaussian velocity components from sums of 12 uniform numbers. Only + − × ÷ and √ are used anywhere in the
      // simulation, so every browser calculates exactly the same motion (the collisions soon give a Maxwell spread anyway).
      const gauss = () => { let q = -6; for (let k = 0; k < 12; k++) q += rnd(); return q; };
      vx[i] = gauss(); vy[i] = gauss();
    }
    let mx = 0, my = 0; for (let i = 0; i < N; i++) { mx += vx[i] / N; my += vy[i] / N; }
    const ke = () => { let e = 0; for (let i = 0; i < N; i++) e += 0.5 * (vx[i] * vx[i] + vy[i] * vy[i]); return e; };
    for (let i = 0; i < N; i++) { vx[i] -= mx; vy[i] -= my; }
    const KE0 = N * 0.5 * VR0 * VR0;
    { const f = Math.sqrt(KE0 / ke()); for (let i = 0; i < N; i++) { vx[i] *= f; vy[i] *= f; } }
    const order = Array.from({ length: N }, (_, i) => i);
    const nSteps = Math.round(SIM_END * FPS) * PER;
    const hit = (tt, w, sPos, J, L) => {
      const k = Math.min(NF - 1, Math.floor(tt * FPS)), per = 2 * (L + HB);
      binI[k] += J / per; binH[k] += 1 / per; binN[k] += 1; binW[k] += J;
      if (w === 1) binP[k] += J;
      HT.push(tt); HW.push(w); HS.push(sPos); HJ.push(J);
    };
    let Lc = Lp(0);
    for (let st = 0; st <= nSteps; st++) {
      const t = st * DT;
      if (st % PER === 0) {
        const k = st / PER;
        for (let i = 0; i < N; i++) { PX[k * N + i] = x[i]; PY[k * N + i] = y[i]; SP[k * N + i] = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]); }
      }
      const tn = t + DT, Ln = Lp(tn), up = (Ln - Lc) / DT;
      for (let i = 0; i < N; i++) {
        x[i] += vx[i] * DT; y[i] += vy[i] * DT;
        if (x[i] < 0) { x[i] = -x[i]; hit(tn, 0, y[i], -2 * vx[i], Ln); vx[i] = -vx[i]; }
        if (x[i] > Ln) { x[i] = 2 * Ln - x[i]; const nv = 2 * up - vx[i]; hit(tn, 1, y[i], vx[i] - nv, Ln); vx[i] = nv; }
        if (y[i] < 0) { y[i] = -y[i]; hit(tn, 2, x[i], -2 * vy[i], Ln); vy[i] = -vy[i]; }
        if (y[i] > HB) { y[i] = 2 * HB - y[i]; hit(tn, 3, x[i], 2 * vy[i], Ln); vy[i] = -vy[i]; }
      }
      // molecule–molecule collisions (sweep along x)
      for (let i = 1; i < N; i++) { const o = order[i]; let j = i - 1; while (j >= 0 && x[order[j]] > x[o]) { order[j + 1] = order[j]; j--; } order[j + 1] = o; }
      for (let a = 0; a < N; a++) {
        const i = order[a];
        for (let b = a + 1; b < N; b++) {
          const j = order[b], dx = x[j] - x[i]; if (dx >= SIG) break;
          const dy = y[j] - y[i], d2 = dx * dx + dy * dy; if (d2 >= SIG * SIG || d2 === 0) continue;
          const dvx = vx[j] - vx[i], dvy = vy[j] - vy[i], dot = dvx * dx + dvy * dy; if (dot >= 0) continue;
          const f = dot / d2;                     // equal masses: exchange the velocity components along the line of centres
          vx[i] += f * dx; vy[i] += f * dy; vx[j] -= f * dx; vy[j] -= f * dy; pairHits++;
        }
      }
      // constant temperature while the piston moves; the heater raises it step by step
      if (Ln !== Lc || Tk(tn) !== Tk(t)) {
        const f = Math.sqrt(KE0 * Tk(tn) / T0K / ke()); for (let i = 0; i < N; i++) { vx[i] *= f; vy[i] *= f; }
      }
      Lc = Ln;
    }
  }
  const cum = (b) => { const c = new Float64Array(b.length + 1); for (let i = 0; i < b.length; i++) c[i + 1] = c[i] + b[i]; return c; };
  const CI = cum(binI), CH = cum(binH), CP = cum(binP), CN = cum(binN), CW = cum(binW);
  const fr = (t) => clamp(Math.round(t * FPS), 0, NF);
  // measured over a window [a, b] of scene time
  const measure = (a, b) => {
    const ka = fr(a), kb = fr(b), dt = (kb - ka) / FPS;
    return { P: (CI[kb] - CI[ka]) / dt, rate: (CH[kb] - CH[ka]) / dt, perHit: (CW[kb] - CW[ka]) / (CN[kb] - CN[ka]) };
  };
  const forceOnPiston = (t, w = 0.3) => { const kb = fr(t), ka = Math.max(0, kb - Math.round(w * FPS)); return (CP[kb] - CP[ka]) / Math.max(1 / FPS, (kb - ka) / FPS); };

  // measuring windows: each step's point uses the time the gas is held at that step; half the volume (300 K) and 600 K
  // use the whole time the gas is held in that state (15.4 s and 8.6 s), for steadier averages
  const W_V0 = [1.0, 41.4];
  const W_V = [[43.2, 44.8], [46.4, 48.0], [49.6, 51.2], [52.8, 68.2]];
  const W_T300 = [52.8, 68.2];
  const W_T = [[69.5, 70.7], [71.8, 73.0], [74.1, 75.3], [76.4, 85.0]];
  const M0 = measure(...W_V0), MV = W_V.map((w) => measure(...w)), M300 = measure(...W_T300), MT = W_T.map((w) => measure(...w));
  const PV_PTS = [[1, 1, W_V0[1]], ...MOVES.map((m, i) => [m[3] / L0, MV[i].P / M0.P, Math.min(W_V[i][1], 57.6)])];
  const PT_PTS = [[300, M300.P / M0.P, 63.4], ...HEATS.map((h, i) => [h[3], MT[i].P / M0.P, Math.min(W_T[i][1], 79.4)])];
  const MVH = MV[3], MTH = MT[3];
  const BOYLE = { P: MVH.P / M0.P, rate: MVH.rate / M0.rate, perHit: MVH.perHit / M0.perHit };
  const HEAT = { P: MTH.P / M300.P, rate: MTH.rate / M300.rate, perHit: MTH.perHit / M300.perHit, speed: Math.sqrt(600 / 300) };
  const F0 = M0.P * HB;                                         // average force on the piston at the start

  // positions at scene time t (looked up, so frames can be drawn in any order)
  const LOOP = (t) => (t > SIM_END - 0.2 ? 6 + ((t - 95) % 10 + 10) % 10 : t);     // the closing card replays a calm stretch
  function molecules(t, fn) {
    const f = clamp(LOOP(t) * FPS, 0, NF - 2.001), k = Math.floor(f), u = f - k, Lnow = Lp(LOOP(t));
    for (let i = 0; i < N; i++) {
      const a = k * N + i, b = a + N;
      fn(clamp(lerp(PX[a], PX[b], u), 0, Lnow), clamp(lerp(PY[a], PY[b], u), 0, HB), lerp(SP[a], SP[b], u));
    }
  }
  const lowerBound = (arr, v) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] < v) lo = m + 1; else hi = m; } return lo; };

  // ---------- timeline ----------
  const DURATION = 103;
  const A0 = 3.6, B0 = 14.6, C0 = 36.4, D0 = 63.0, E0 = 85.2, F0T = 96.2;
  const ZOOM_HITS = [17.4, 22.6, 27.8, 32.8];
  const CAPS = [
    [3.9, 9.1, 'A sealed cylinder of gas. Each dot is a molecule, moving at random with a range of speeds.'],
    [9.3, 14.5, 'The molecules bounce off the walls and off each other. Every collision is elastic: no kinetic energy is lost.'],
    [14.7, 19.9, 'Zoom in on one molecule hitting the piston. The part of its velocity perpendicular to the wall, u, reverses.'],
    [20.1, 25.3, 'Its momentum changes by 2mu. So it gives the wall an equal and opposite impulse of 2mu.'],
    [25.5, 30.7, 'Each hit is a tiny push, so the force on the piston flickers. Averaged over time, it is steady.'],
    [30.9, 36.1, 'In a real gas, vast numbers of hits every second add up to a steady force F on each wall. Pressure P = F/A.'],
    [36.4, 41.6, 'Predict: push the piston in to halve the volume, keeping the temperature the same. What happens to the pressure?'],
    [41.8, 47.0, 'The piston moves in slowly. The temperature is kept the same, so the molecules keep the same range of speeds.'],
    [47.2, 52.4, 'Each point on the graph is the pressure measured from the molecules’ hits on the walls.'],
    [52.6, 57.6, 'Half the volume: the same molecules in half the space.'],
    [57.8, 63.0, 'Each part of the wall is hit twice as often, but each hit is just as hard. The pressure doubles: PV = constant (Boyle’s law).'],
    [63.2, 68.4, 'Now lock the piston, so the volume stays the same. Predict: if the kelvin temperature doubles, what happens to the pressure?'],
    [68.6, 73.8, 'Heat the gas: the molecules speed up. At double the kelvin temperature they move √2 ≈ 1.41 times as fast.'],
    [74.0, 79.2, 'Faster molecules hit the walls more often, and harder each time.'],
    [79.6, 84.8, 'About 1.41 times as often × 1.41 times as hard = 2: the pressure doubles. P ∝ T, with T in kelvin.'],
    [85.4, 90.6, 'This is the kinetic model of an ideal gas. At low pressure, real gases behave almost like this.'],
    [90.8, 96.0, 'Worked through in three dimensions, the same idea gives these results.'],
  ];

  // ---------- colours ----------
  const WALL = '196,206,230', HEATC = '255,120,60', PCOL = C.good;
  const speedCol = (r) => {         // r = speed ÷ rms speed at 300 K: slow blue → white → fast gold
    const a = [95, 150, 255], b = [215, 228, 255], c = [255, 206, 100];
    const m = r < 1 ? a.map((v, i) => lerp(v, b[i], clamp(r, 0, 1))) : b.map((v, i) => lerp(v, c[i], clamp((r - 1) / 1.1, 0, 1)));
    return m.map(Math.round).join(',');
  };
  const MINUS = '−';
  const x1f = (v) => `×${v.toFixed(1)}`;

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W, top = s.top || 0;
    const pad = clamp(W * 0.035, 12, 34), fs = Math.round(clamp(W / 60, 12, 20)), cap = Math.round(clamp(W / 44, 15, 25));
    const secY = Math.max(top + 14, Math.min(58, H * 0.12));
    let u, bx, by;
    const o = { W, H, phone, pad, fs, cap, secY };
    if (!phone) {
      u = Math.min((W * 0.58 - pad) / 2.05, H * 0.45 / HB);
      bx = pad + fs * 0.6; by = secY + fs * 1.7;
      const bb = by + HB * u;
      o.trace = { x0: bx, x1: bx + L0 * u, y0: bb + H * 0.06, y1: bb + H * 0.155 };
      o.panel = { x0: bx + 2.05 * u + W * 0.03, x1: W - pad, y0: by, y1: o.trace.y1 };
      o.thermo = { x0: bx + fs * 0.8, x1: bx + L0 * u, y: (o.trace.y0 + o.trace.y1) / 2 + fs * 0.2 };
    } else {
      u = Math.min((W - 2 * pad) / 2.0, H * 0.27 / HB);
      bx = (W - 1.95 * u) / 2; by = secY + fs * 1.4;
      const bb = by + HB * u;
      o.thermo = { x0: bx + fs * 0.8, x1: bx + L0 * u, y: bb + fs * 1.15 };
      o.panel = { x0: pad, x1: W - pad, y0: bb + fs * 2.4, y1: H - cap * 5.7 };
      o.trace = { x0: pad + fs * 0.4, x1: W - pad - fs * 3.6, y0: o.panel.y0 + fs * 1.6, y1: o.panel.y1 - fs * 0.6 };
    }
    Object.assign(o, { u, bx, by, bb: by + HB * u });
    L = o;
  }
  const WX = (x) => L.bx + x * L.u, WY = (y) => L.bb - y * L.u;

  // ---------- small drawing helpers ----------
  function rr(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h);
    g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }
  // Text with _{sub}, ^{sup}, !{upright}, ~{sup|sub} (stacked) and #{num/den} (a small fraction).
  function rich(s, str, x, y, size, a, font, rgb = C.text, align = 'center', measureOnly = false) {
    const { g } = s, parts = [], re = /([_^!~#])\{([^}]*)\}/g; let last = 0, m;
    while ((m = re.exec(str))) { if (m.index > last) parts.push({ t: str.slice(last, m.index), k: '' }); parts.push({ t: m[2], k: m[1] }); last = re.lastIndex; }
    if (last < str.length) parts.push({ t: str.slice(last), k: '' });
    const small = size * 0.66;
    let w = 0;
    for (const p of parts) {
      if (p.k === '~') { const [a1, b1] = p.t.split('|'); g.font = font(small, false); p.w = Math.max(g.measureText(a1).width, g.measureText(b1).width) + size * 0.05; p.a = a1; p.b = b1; }
      else if (p.k === '#') { const [a1, b1] = p.t.split('/'); g.font = font(small, true); p.w = Math.max(g.measureText(a1).width, g.measureText(b1).width) + size * 0.3; p.a = a1; p.b = b1; }
      else { g.font = font(p.k === '_' || p.k === '^' ? small : size, p.k === '!'); p.w = g.measureText(p.t).width; }
      w += p.w;
    }
    if (measureOnly || a <= 0) return w;
    let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`;
    for (const p of parts) {
      if (p.k === '~') { g.font = font(small, false); g.fillText(p.a, cx, y - size * 0.36); g.fillText(p.b, cx, y + size * 0.3); }
      else if (p.k === '#') {
        g.font = font(small, true); g.textAlign = 'center';
        g.fillText(p.a, cx + p.w / 2, y - size * 0.36); g.fillText(p.b, cx + p.w / 2, y + size * 0.4);
        g.fillRect(cx + size * 0.1, y - 0.6, p.w - size * 0.2, 1.3); g.textAlign = 'left';
      } else {
        g.font = font(p.k === '_' || p.k === '^' ? small : size, p.k === '!');
        g.fillText(p.t, cx, y + (p.k === '_' ? size * 0.3 : p.k === '^' ? -size * 0.36 : 0));
      }
      cx += p.w;
    }
    g.shadowBlur = 0; return w;
  }
  const serifF = (z, up) => D.serif(z, !up);
  const sansF = (z) => D.sans(z);
  const boldF = (z) => D.sans(z, 600);
  function sectionTitle(s, text, a) {
    if (a <= 0) return;
    const fs = Math.round(clamp(s.W / 58, 12, 19));
    const w = rich(s, text, L.pad, L.secY, fs, 0.95 * a, (z) => D.sans(z, 600), C.muted, 'left');
    D.line(s, L.pad, L.secY + fs * 0.9, L.pad + w, L.secY + fs * 0.9, C.muted, 0.35 * a, 1);
  }

  // ---------- the cylinder ----------
  function drawCylinder(s, t, a, opt = {}) {
    if (a <= 0) return;
    const { g } = s, u = L.u, Lnow = Lp(LOOP(t)), th = Math.max(4, u * 0.035);
    const x0 = WX(0), x1 = WX(Lnow), yT = WY(HB), yB = WY(0), tubeEnd = WX(L0 + 0.14);
    g.save(); g.globalAlpha = a;
    // the gas
    const gg = g.createLinearGradient(0, yT, 0, yB);
    gg.addColorStop(0, 'rgba(60,80,170,0.10)'); gg.addColorStop(1, 'rgba(60,80,170,0.18)');
    g.fillStyle = gg; g.fillRect(x0, yT, x1 - x0, yB - yT);
    // heater under the cylinder
    if (opt.heat > 0) {
      g.globalCompositeOperation = 'lighter';
      const hg = g.createLinearGradient(0, yB, 0, yB + th * 3.2);
      hg.addColorStop(0, `rgba(${HEATC},${0.85 * opt.heat})`); hg.addColorStop(1, `rgba(${HEATC},0)`);
      g.fillStyle = hg; g.fillRect(x0 - th, yB + th, tubeEnd - x0 - u * 0.12, th * 3.2);
      g.globalCompositeOperation = 'source-over';
    }
    // walls: top, bottom and the closed end
    const metal = (y, h) => {
      const mg = g.createLinearGradient(0, y, 0, y + h);
      mg.addColorStop(0, '#dfe5f2'); mg.addColorStop(0.45, '#8a94ab'); mg.addColorStop(1, '#3a4257');
      g.fillStyle = mg; g.fillRect(x0 - th, y, tubeEnd - x0 + th, h);
    };
    metal(yT - th, th); metal(yB, th);
    const eg = g.createLinearGradient(x0 - th, 0, x0, 0);
    eg.addColorStop(0, '#3a4257'); eg.addColorStop(1, '#a8b1c6');
    g.fillStyle = eg; g.fillRect(x0 - th, yT - th, th, yB - yT + 2 * th);
    // piston and rod
    const pw = Math.max(5, u * 0.045), rod = Math.max(3, u * 0.03), rodEnd = x1 + pw + u * 0.3;
    const rg = g.createLinearGradient(0, WY(HB / 2) - rod, 0, WY(HB / 2) + rod);
    rg.addColorStop(0, '#c3cad8'); rg.addColorStop(1, '#4a5266');
    g.fillStyle = rg; g.fillRect(x1 + pw, WY(HB / 2) - rod / 2, rodEnd - x1 - pw, rod);
    g.fillStyle = '#9aa3b8'; rr(g, rodEnd - 1, WY(HB / 2) - u * 0.07, u * 0.035, u * 0.14, 3); g.fill();
    const pg = g.createLinearGradient(x1, 0, x1 + pw, 0);
    pg.addColorStop(0, '#f2f5fb'); pg.addColorStop(0.5, '#a9b2c6'); pg.addColorStop(1, '#505870');
    g.fillStyle = pg; g.shadowColor = `rgba(${PCOL},${opt.glowPiston || 0})`; g.shadowBlur = 14 * (opt.glowPiston || 0);
    g.fillRect(x1, yT, pw, yB - yT); g.shadowBlur = 0;
    // lock (a clamp on the rod)
    if (opt.lock > 0) {
      g.globalAlpha = a * opt.lock;
      const cx = x1 + pw + u * 0.14, cy = WY(HB / 2);
      g.fillStyle = '#e8b04a'; rr(g, cx - u * 0.03, cy - u * 0.06, u * 0.06, u * 0.12, 2); g.fill();
      g.globalAlpha = a;
    }
    g.restore();
    if (opt.lock > 0) D.text(s, 'locked', x1 + pw + u * 0.14, WY(HB / 2) - u * 0.06 - L.fs * 0.8, Math.round(L.fs * 0.85), a * opt.lock, D.sans(Math.round(L.fs * 0.85), 600), '232,176,74');
    if (opt.label > 0) D.text(s, 'piston', x1 + pw + u * 0.17, WY(HB / 2) + u * 0.1 + L.fs * 0.7, Math.round(L.fs * 0.85), a * opt.label, D.sans(Math.round(L.fs * 0.85)), C.muted);
  }
  function drawMolecules(s, t, a) {
    if (a <= 0) return;
    const R = Math.max(5, L.u * 0.028);
    molecules(t, (x, y, sp) => D.glowDot(s, WX(x), WY(y), R, speedCol(sp / VR0), a));
  }
  // flashes where molecules hit the walls (brighter on the piston when highlighted)
  function drawHits(s, t, a, pistonBoost) {
    if (a <= 0 || t > SIM_END - 0.3) return;
    const life = 0.22, i0 = lowerBound(HT, t - life), i1 = lowerBound(HT, t);
    for (let i = i0; i < i1; i++) {
      const age = t - HT[i], w = HW[i], k = (1 - age / life);
      let x, y;
      if (w === 0) { x = WX(0); y = WY(HS[i]); } else if (w === 1) { x = WX(Lp(HT[i])); y = WY(HS[i]); }
      else if (w === 2) { x = WX(HS[i]); y = WY(0); } else { x = WX(HS[i]); y = WY(HB); }
      const boost = w === 1 ? pistonBoost : 0, str = clamp(HJ[i] / (2 * VR0), 0.4, 2);
      D.glowDot(s, x, y, L.u * (0.035 + 0.03 * boost) * Math.sqrt(str), boost > 0.5 ? PCOL : '200,215,255', a * k * (0.35 + 0.6 * boost));
    }
  }

  // ---------- the zoomed-in hit ----------
  function zoomRect() {
    if (!L.phone) { const p = L.panel; return { x0: p.x0, x1: p.x1, y0: p.y0, y1: p.y0 + (p.y1 - p.y0) * 0.66 }; }
    return { ...L.panel };
  }
  function drawZoom(s, t, a) {
    if (a <= 0) return;
    const { g } = s, R = zoomRect(), w = R.x1 - R.x0, h = R.y1 - R.y0, fs = L.fs;
    // a ring on the piston and lines to the close-up
    const px = WX(Lp(t)), py = WY(HB * 0.55), rr0 = L.u * 0.12;
    const ra = a * fade(t, B0, 26.0, 0.6, 0.8);
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = `rgba(${C.muted},${0.7 * ra})`; g.lineWidth = 1.2; g.setLineDash([4, 4]);
    g.beginPath(); g.arc(px, py, rr0, 0, 7); g.stroke();
    g.beginPath();
    if (!L.phone) { g.moveTo(px + rr0 * 0.7, py - rr0 * 0.7); g.lineTo(R.x0, R.y0 + 4); g.moveTo(px + rr0 * 0.7, py + rr0 * 0.7); g.lineTo(R.x0, R.y1 - 4); }
    else { g.moveTo(px - rr0 * 0.7, py + rr0 * 0.7); g.lineTo(R.x0 + w * 0.3, R.y0); g.moveTo(px + rr0 * 0.7, py + rr0 * 0.7); g.lineTo(R.x1 - w * 0.05, R.y0); }
    g.stroke(); g.setLineDash([]);
    // the frame
    g.save(); g.globalAlpha = a;
    rr(g, R.x0, R.y0, w, h, 10); g.fillStyle = 'rgba(8,12,28,0.88)'; g.fill();
    g.strokeStyle = `rgba(${C.muted},0.45)`; g.lineWidth = 1.2; g.stroke();
    g.save(); rr(g, R.x0, R.y0, w, h, 10); g.clip();
    const wallX = R.x1 - w * 0.13;
    const pg = g.createLinearGradient(wallX, 0, R.x1, 0);
    pg.addColorStop(0, '#f2f5fb'); pg.addColorStop(0.25, '#a9b2c6'); pg.addColorStop(1, '#3a4257');
    g.fillStyle = pg; g.fillRect(wallX, R.y0, R.x1 - wallX, h);
    g.restore(); g.restore();
    D.text(s, 'close-up of the piston', R.x0 + fs * 0.7, R.y0 + fs * 1.0, Math.round(fs * 0.85), 0.7 * a, D.sans(Math.round(fs * 0.85)), C.muted, 'left');
    // one molecule: in towards the wall, bounce, out again
    const r = Math.max(6, h * 0.06), hx = wallX - r, hy = R.y0 + h * 0.56;
    const Tm = 1.9, vx = (w * 0.4) / Tm, vy = (h * 0.26) / Tm;
    const scale = (w * 0.17) / Math.hypot(vx, vy);            // arrow length per unit velocity
    let firstHit = Infinity;
    for (const th of ZOOM_HITS) {
      if (th < firstHit) firstHit = th;
      const dt = t - th; if (dt < -Tm || dt > Tm + 0.2) continue;
      const ea = a * Math.min(smooth((dt + Tm) / 0.4), 1 - smooth((dt - Tm + 0.2) / 0.4));
      const before = dt < 0, mx = hx - Math.abs(dt) * vx, my = hy + dt * vy;
      // trail
      const pts = []; for (let q = -Tm; q <= Math.min(dt, Tm); q += 0.05) pts.push([hx - Math.abs(q) * vx, hy + q * vy]);
      pts.push([mx, my]);
      D.glowLine(s, pts, '200,215,255', 0.25 * ea, 1.2);
      D.glowDot(s, mx, my, r * 2.6, speedCol(1.3), ea);
      // velocity and its two components
      const ux = (before ? 1 : -1) * vx * scale, uy = vy * scale;
      D.arrow(s, mx, my, mx + ux, my + uy, C.vel, 0.45 * ea, '', { width: 2, head: 9, blur: 4 });
      D.arrow(s, mx, my, mx + ux, my, C.vel, ea, '', { width: 3, head: 11 });
      D.line(s, mx + ux, my, mx + ux, my + uy, C.vel, 0.55 * ea, 1.4, [4, 4]);
      rich(s, before ? 'u' : `${MINUS}u`, mx + ux / 2, my - fs * 1.05, Math.round(fs * 1.15), ea, serifF, C.vel);
      // the impulse on the wall
      const ia = a * fade(t, th - 0.02, th + 2.4, 0.08, 0.6);
      if (ia > 0) {
        D.glowDot(s, wallX, hy, r * 3 * (1 - smooth((t - th) / 0.6)) + r, C.force, ia * Math.exp(-(t - th) * 1.5));
        D.arrow(s, wallX + 2, hy, wallX + w * 0.1, hy, C.force, ia, '', { width: 3.2, head: 10 });
        rich(s, '+2mu', wallX - fs * 0.4, hy + fs * 1.5, Math.round(fs * 1.05), ia, serifF, C.force, 'right');
      }
    }
    // the momentum bookkeeping (left of the close-up)
    const tx = R.x0 + fs * 0.7, z = Math.round(fs * 1.05), y0 = R.y1 - fs * (L.phone ? 3.6 : 4.4);
    const l1 = a * smooth((t - (firstHit - 1.6)) / 0.5), l2 = a * smooth((t - firstHit - 0.1) / 0.5), l3 = a * smooth((t - 20.1) / 0.6);
    const lh = fs * (L.phone ? 1.25 : 1.45);
    rich(s, 'before:  +mu', tx, y0, z, 0.9 * l1, serifF, C.text, 'left');
    rich(s, `after:  ${MINUS}mu`, tx, y0 + lh, z, 0.9 * l2, serifF, C.text, 'left');
    rich(s, `change:  ${MINUS}2mu`, tx, y0 + 2 * lh, z, l3, serifF, C.light, 'left');
  }

  // ---------- the force trace ----------
  function drawTrace(s, t, a) {
    if (a <= 0) return;
    const T = L.trace, w = T.x1 - T.x0, h = T.y1 - T.y0, fs = L.fs, span = 6, Fmax = 3.2 * F0;
    const yv = (F) => T.y1 - clamp(F / Fmax, 0, 1) * h;
    D.line(s, T.x0, T.y1, T.x1, T.y1, C.muted, 0.5 * a);
    D.line(s, T.x0, T.y0, T.x0, T.y1, C.muted, 0.5 * a);
    D.text(s, 'force on the piston', T.x0 + 6, T.y0 - fs * 0.6, Math.round(fs * 0.85), 0.8 * a, D.sans(Math.round(fs * 0.85)), PCOL, 'left');
    D.text(s, 'time →', T.x1, T.y1 + fs * 0.8, Math.round(fs * 0.8), 0.6 * a, D.sans(Math.round(fs * 0.8)), C.muted, 'right');
    const pts = [], n = Math.round(span * FPS);
    for (let i = 0; i <= n; i++) {
      const tt = t - span + i / FPS; if (tt < 0.4) continue;
      pts.push([T.x0 + (i / n) * w, yv(forceOnPiston(tt))]);
    }
    s.g.save(); s.g.beginPath(); s.g.rect(T.x0, T.y0 - 4, w + 4, h + 6); s.g.clip();
    D.glowLine(s, pts, PCOL, 0.85 * a, 1.3);
    s.g.restore();
    const avA = a * smooth((t - 26.5) / 0.8);
    if (avA > 0) {
      const av = forceOnPiston(t, 5), y = yv(av);
      D.line(s, T.x0, y, T.x1, y, C.white, 0.75 * avA, 1.6, [7, 5]);
      D.text(s, 'average', T.x1 + 4, y, Math.round(fs * 0.8), 0.85 * avA, D.sans(Math.round(fs * 0.8), 600), C.white, 'left');
    }
  }
  // speed colour key (before the trace appears)
  function drawKey(s, a) {
    if (a <= 0) return;
    const fs = Math.round(L.fs * 0.85), T = L.phone ? { x0: L.panel.x0 + 6, y: L.panel.y0 + fs } : { x0: L.trace.x0, y: L.trace.y0 + fs };
    const x0 = T.x0, wBar = Math.min(L.u * 0.9, 160);
    D.text(s, 'molecule colour:', x0, T.y, fs, 0.75 * a, D.sans(fs), C.muted, 'left');
    s.g.font = D.sans(fs); const lw = s.g.measureText('molecule colour:  slower ').width;
    D.text(s, 'slower', x0 + s.g.measureText('molecule colour:  ').width, T.y, fs, 0.8 * a, D.sans(fs), speedCol(0.2), 'left');
    for (let i = 0; i <= 12; i++) D.glowDot(s, x0 + lw + 4 + (i / 12) * wBar, T.y, 7, speedCol(i / 12 * 2.2), 0.8 * a);
    D.text(s, 'faster', x0 + lw + wBar + 16, T.y, fs, 0.8 * a, D.sans(fs), speedCol(2.2), 'left');
  }

  // ---------- graphs ----------
  function graphRect() {
    const p = L.panel;
    if (!L.phone) return { x0: p.x0 + L.fs * 2.6, x1: p.x1 - L.fs * 1.0, y0: p.y0 + L.fs * 0.8, y1: p.y0 + (p.y1 - p.y0) * 0.5 };
    return { x0: p.x0 + L.fs * 2.4, x1: p.x0 + (p.x1 - p.x0) * 0.54, y0: p.y0 + L.fs * 0.6, y1: p.y1 - L.fs * 1.5 };
  }
  function axes(s, G, a, xl, yl, xt, yt) {
    const fs = Math.round(L.fs * 0.85);
    D.arrow(s, G.x0, G.y1, G.x1 + 6, G.y1, C.muted, 0.8 * a, '', { width: 1.4, head: 7, blur: 0 });
    D.arrow(s, G.x0, G.y1, G.x0, G.y0 - 6, C.muted, 0.8 * a, '', { width: 1.4, head: 7, blur: 0 });
    rich(s, xl, G.x1 + 4, G.y1 - fs * 0.9, Math.round(fs * 1.1), a, serifF, C.text, 'right');
    rich(s, yl, G.x0 - fs * 0.5, G.y0 + 2, Math.round(fs * 1.1), a, serifF, C.text, 'right');
    for (const [px, lab] of xt) { D.line(s, px, G.y1, px, G.y1 + 4, C.muted, 0.8 * a); rich(s, lab, px, G.y1 + fs * 1.0, fs, 0.85 * a, serifF, C.muted); }
    for (const [py, lab] of yt) { D.line(s, G.x0 - 4, py, G.x0, py, C.muted, 0.8 * a); D.line(s, G.x0, py, G.x1, py, C.muted, 0.12 * a); rich(s, lab, G.x0 - 6, py, fs, 0.85 * a, serifF, C.muted, 'right'); }
  }
  const popA = (t, t0) => smooth((t - t0) / 0.35);
  function drawPV(s, t, a) {
    if (a <= 0) return;
    const G = graphRect(), X = (v) => lerp(G.x0, G.x1, v / 1.15), Y = (p) => lerp(G.y1, G.y0, p / 2.5);
    axes(s, G, a, 'V', 'P', [[X(0.5), '½V_{0}'], [X(1), 'V_{0}']], [[Y(1), 'P_{0}'], [Y(2), '2P_{0}']]);
    // the curve PV = constant, after the result
    const ca = a * smooth((t - 58.4) / 1.2);
    if (ca > 0) {
      const pts = []; for (let v = 0.44; v <= 1.13; v += 0.01) pts.push([X(v), Y(1 / v)]);
      D.glowLine(s, pts, C.vel, 0.6 * ca, 1.2);
      rich(s, 'PV = constant', L.phone ? X(0.5) : X(0.78), L.phone ? Y(0.55) : Y(1 / 0.78) - L.fs * 1.4, Math.round(L.fs * 0.95), ca, serifF, C.vel, 'left');
    }
    // the current volume
    const vnow = Lp(t) / L0, va = a * fade(t, 41.4, 63.0, 0.4, 0.6);
    D.line(s, X(vnow), G.y1, X(vnow), G.y0, PCOL, 0.35 * va, 1.2, [3, 4]);
    // predict
    const qa = a * fade(t, 36.6, 52.6, 0.5, 0.6) * (0.7 + 0.3 * Math.sin(s.clock * 4));
    if (qa > 0 && t < 52.4) { D.line(s, X(0.5), G.y1, X(0.5), Y(2.3), C.light, 0.5 * qa, 1.2, [4, 4]); rich(s, '?', X(0.5), Y(1.5), Math.round(L.fs * 1.6), qa, D.sans ? (z) => D.sans(z, 700) : sansF, C.light); }
    for (const [v, p, ts] of PV_PTS) {
      const pa = a * popA(t, ts); if (pa <= 0) continue;
      D.glowDot(s, X(v), Y(p), L.fs * 1.0, C.light, pa * (1 + 0.6 * Math.exp(-(t - ts) * 3)));
    }
  }
  function drawPT(s, t, a) {
    if (a <= 0) return;
    const G = graphRect(), X = (T) => lerp(G.x0, G.x1, T / 760), Y = (p) => lerp(G.y1, G.y0, p / 4.8);
    axes(s, G, a, 'T / K', 'P', [[X(0), '0'], [X(300), '300'], [X(600), '600']], [[Y(2), '2P_{0}'], [Y(4), '4P_{0}']]);
    const la = a * smooth((t - 79.8) / 1.2);
    if (la > 0) {
      const k = PT_PTS[PT_PTS.length - 1][1] / 600;          // a straight line through the origin and the last point
      D.glowLine(s, [[X(0), Y(0)], [X(680), Y(680 * k)]], C.force, 0.6 * la, 1.2);
      D.text(s, 'P ∝ T', X(340), Y(340 * k) + L.fs * 1.3, Math.round(L.fs * 0.95), la, D.serif(Math.round(L.fs * 0.95)), C.force, 'left');
    }
    const qa = a * fade(t, 63.6, 76.4, 0.5, 0.6) * (0.7 + 0.3 * Math.sin(s.clock * 4));
    if (qa > 0 && t < 76.2) { D.line(s, X(600), G.y1, X(600), Y(4.6), C.light, 0.5 * qa, 1.2, [4, 4]); rich(s, '?', X(600), Y(3.0), Math.round(L.fs * 1.6), qa, (z) => D.sans(z, 700), C.light); }
    const Tnow = Tk(t), ta = a * fade(t, 68.0, 85.0, 0.4, 0.6);
    D.line(s, X(Tnow), G.y1, X(Tnow), G.y0, HEATC, 0.4 * ta, 1.2, [3, 4]);
    for (const [T, p, ts] of PT_PTS) {
      const pa = a * popA(t, ts); if (pa <= 0) continue;
      D.glowDot(s, X(T), Y(p), L.fs * 1.0, C.light, pa * (1 + 0.6 * Math.exp(-(t - ts) * 3)));
    }
  }
  // measured readouts under the graph (to the right of it on phones)
  function readouts(s, rows, a) {
    if (a <= 0) return;
    const p = L.panel, fs = L.fs, G = graphRect();
    const x0 = L.phone ? G.x1 + fs * 1.4 : p.x0, x1 = p.x1;
    let y = L.phone ? p.y0 + fs * 1.0 : G.y1 + fs * 2.4;
    const lh = L.phone ? fs * 1.55 : fs * 1.4;
    D.text(s, 'measured in the simulation', x0, y, Math.round(fs * 0.8), 0.6 * a, D.sans(Math.round(fs * 0.8)), C.muted, 'left');
    y += lh;
    for (const [label, val, ra, rgb] of rows) {
      if (ra <= 0) { y += lh; continue; }
      D.text(s, label, x0, y, Math.round(fs * 0.9), 0.85 * a * ra, D.sans(Math.round(fs * 0.9)), C.text, 'left');
      D.text(s, val, x1, y, fs, a * ra, D.sans(fs, 700), rgb || C.text, 'right');
      y += lh;
    }
  }

  // ---------- thermometer ----------
  function drawThermo(s, t, a) {
    if (a <= 0) return;
    const T = L.thermo, fs = Math.round(L.fs * 0.85), Tn = Tk(t);
    const tube = Math.max(5, L.fs * 0.42), bx = T.x0, x0 = bx + tube * 1.2, x1 = T.x1 - L.fs * 6.2, X = (k) => lerp(x0, x1, k / 700);
    const { g } = s;
    g.save(); g.globalAlpha = a;
    rr(g, x0 - tube, T.y - tube / 2, x1 - x0 + tube * 1.5, tube, tube / 2); g.fillStyle = 'rgba(20,26,44,0.9)'; g.fill();
    g.strokeStyle = `rgba(${C.muted},0.6)`; g.lineWidth = 1; g.stroke();
    g.fillStyle = `rgba(${HEATC},0.95)`; rr(g, x0 - tube * 0.5, T.y - tube * 0.28, X(Tn) - x0 + tube * 0.5, tube * 0.56, tube * 0.28); g.fill();
    g.beginPath(); g.arc(bx, T.y, tube * 1.05, 0, 7); g.fill();
    g.restore();
    if (!L.phone) for (const k of [0, 300, 600]) { D.line(s, X(k), T.y + tube * 0.7, X(k), T.y + tube * 1.2, C.muted, 0.8 * a); D.text(s, String(k), X(k), T.y + tube + fs * 0.9, fs, 0.75 * a, D.sans(fs), C.muted); }
    D.text(s, `T = ${Math.round(Tn)} K`, T.x1, T.y, L.fs, a, D.sans(L.fs, 700), HEATC, 'right');
  }

  // ---------- the model and the results ----------
  function icon(s, kind, cx, cy, z, a) {
    const { g } = s;
    g.save(); g.globalAlpha = a;
    rr(g, cx - z, cy - z, 2 * z, 2 * z, z * 0.25); g.strokeStyle = `rgba(${C.muted},0.35)`; g.lineWidth = 1; g.stroke();
    g.restore();
    const dot = (x, y, r = z * 0.32) => D.glowDot(s, cx + x * z, cy + y * z, r, speedCol(1), a);
    const arr = (x, y, dx, dy) => D.arrow(s, cx + x * z, cy + y * z, cx + (x + dx) * z, cy + (y + dy) * z, C.vel, a, '', { width: 1.6, head: 5, blur: 2 });
    if (kind === 0) { dot(-0.6, -0.5); dot(0.55, -0.35); dot(-0.1, 0.55); }
    if (kind === 1) {
      D.line(s, cx - 0.8 * z, cy - 0.45 * z, cx + 0.8 * z, cy - 0.45 * z, C.muted, 0.4 * a, 1, [3, 3]); D.line(s, cx - 0.8 * z, cy + 0.45 * z, cx + 0.8 * z, cy + 0.45 * z, C.muted, 0.4 * a, 1, [3, 3]);
      dot(-0.35, -0.45); arr(-0.2, -0.45, 0.8, 0); dot(0.35, 0.45); arr(0.2, 0.45, -0.8, 0);
    }
    if (kind === 2) {
      D.line(s, cx + 0.7 * z, cy - 0.85 * z, cx + 0.7 * z, cy + 0.85 * z, WALL, 0.9 * a, 3);
      D.arrow(s, cx - 0.75 * z, cy - 0.6 * z, cx + 0.55 * z, cy, C.vel, a, '', { width: 1.6, head: 5, blur: 2 });
      D.arrow(s, cx + 0.55 * z, cy, cx - 0.75 * z, cy + 0.6 * z, C.vel, a, '', { width: 1.6, head: 5, blur: 2 });
    }
    if (kind === 3) {
      const ds = [[-0.55, -0.5, 0.4, 0.2], [0.45, -0.55, -0.15, 0.45], [-0.5, 0.45, 0.25, -0.15], [0.5, 0.4, 0.35, 0.3], [0, 0, -0.45, 0.4]];
      for (const [x, y, dx, dy] of ds) { dot(x, y, z * 0.24); arr(x, y, dx, dy); }
    }
  }
  const BULLETS = ['Molecules are tiny compared with the gaps between them', 'No forces between molecules, except during collisions',
    'All collisions are elastic', 'Random motion, with a range of speeds'];
  function drawModel(s, t, a) {
    if (a <= 0) return;
    const { W, H, g } = s, ph = L.phone, fs = L.fs;
    const z = Math.round(clamp(W / 34, 16, 30)), iz = ph ? 14 : clamp(fs * 1.2, 15, 24), bz = ph ? 14 : Math.round(fs * 1.1);
    const x0 = ph ? L.pad + iz : W * 0.07 + iz, colW = ph ? W - 2 * L.pad - iz * 3 : W * 0.4;
    let y = ph ? L.secY + fs * 3.2 : H * 0.24;
    BULLETS.forEach((b, i) => {
      const ba = a * smooth((t - (E0 + 0.6 + i * 0.9)) / 0.5); if (ba <= 0) { y += ph ? iz * 2.6 : iz * 2.9; return; }
      icon(s, i, x0, y, iz, ba);
      g.font = D.sans(bz); const lines = D.wrap(s, b, colW);
      D.text(s, lines, x0 + iz * 1.8, y - (lines.length - 1) * bz * 0.65, bz, ba, D.sans(bz), C.text, 'left');
      y += ph ? iz * 2.6 : iz * 2.9;
    });
    // results (three dimensions)
    const ra = a * smooth((t - 90.8) / 0.7), ex = ph ? W / 2 : W * 0.75;
    let ey = ph ? y + z * 0.6 : H * 0.28;
    const gap = ph ? z * 1.55 : z * 1.9;
    rich(s, 'P = #{1/3}ρv~{2|rms}', ex, ey, z, ra, serifF); ey += gap;
    rich(s, 'PV = Nk_{B}T = nRT', ex, ey, z, a * smooth((t - 91.6) / 0.7), serifF); ey += gap;
    const ka = a * smooth((t - 92.4) / 0.7);
    rich(s, '!{average }E_{k}!{ = }#{3/2}k_{B}T', ex, ey, Math.round(z * 0.9), ka, serifF);
    if (!ph) D.text(s, 'for each molecule', ex, ey + z * 1.05, Math.round(fs * 0.85), 0.7 * ka, D.sans(Math.round(fs * 0.85)), C.muted);
  }
  function drawEnd(s, t) {
    const ea = fade(t, F0T, DURATION, 0.9, 0.8); if (ea <= 0) return;
    const { W, H, g } = s;
    g.fillStyle = `rgba(4,6,13,${0.62 * ea})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 26, 22, 48)), s3 = Math.round(clamp(W / 18, 30, 64));
    g.font = D.sans(s1, 300); const l1 = D.wrap(s, 'Gas pressure comes from molecules changing momentum at the walls', Math.min(W - 48, 820));
    const y1 = H * (L.phone ? 0.3 : 0.32) - (l1.length - 1) * s1 * 0.65;
    D.text(s, l1, W / 2, y1, s1, ea, D.sans(s1, 300));
    const ye = H * (L.phone ? 0.64 : 0.66);
    g.font = D.serif(s3); const w1 = g.measureText('P = ').width;
    D.text(s, 'P =', W / 2 - s3 * 0.15, ye, s3, ea, D.serif(s3), C.text, 'right');
    const fx = W / 2 + s3 * 0.55, fz = s3 * 0.85;
    D.text(s, 'F', fx, ye - fz * 0.62, fz, ea, D.serif(fz)); D.text(s, 'A', fx, ye + fz * 0.62, fz, ea, D.serif(fz));
    D.line(s, fx - fz * 0.55, ye, fx + fz * 0.55, ye, C.text, ea, Math.max(1.5, fz * 0.06));
    void w1;
  }

  Anim.register('gas-pressure', {
    duration: DURATION,
    poster: 58.5,
    // score: light and airy (E flat, soft sine pad, quick high pings like molecules hitting the walls)
    music: { chords: [[51, 58, 62, 67], [48, 55, 62, 63], [56, 60, 63, 67], [53, 58, 62, 65]], bar: 7, pad: 'sine', cutoff: 1500, drone: 0.06, bells: 1.4, bellOct: 2, echo: 0.21, wind: 0.2, volume: 0.3 },
    pauses: [[89.6, 1.2], [95.4, 1.6], [101.8, 1.5]],
    numbers: {
      P0: M0.P, P0theory: (N * 0.5 * VR0 * VR0) / (L0 * HB), pairHits,
      pv: PV_PTS.map(([v, p]) => [+v.toFixed(3), +p.toFixed(3)]), pt: PT_PTS.map(([T, p]) => [T, +p.toFixed(3)]),
      boyle: BOYLE, heat: HEAT, hitsPerSecond0: M0.rate * 2 * (L0 + HB),
    },
    resize: layout,
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.26);
      const boxA = fade(t, 0, 85.0, 0.5, 0.8);
      const lockA = fade(t, 63.4, 86, 0.6, 0.6), heatA = Math.max(...HEATS.map(([a1, b1]) => fade(t, a1 - 0.1, b1 + 0.6, 0.2, 0.6)));
      drawCylinder(s, t, boxA, { lock: lockA, heat: heatA, label: fade(t, 3.6, 14.4, 0.6, 0.6), glowPiston: 0.6 * fade(t, 25.3, 36.4, 0.6, 0.6) });
      drawHits(s, t, boxA, fade(t, 25.3, 36.4, 0.6, 0.6));
      drawMolecules(s, t, boxA);
      // the closing card replays a calm stretch of the gas behind its text
      if (t > F0T) { const ga = fade(t, F0T + 0.2, DURATION, 1.2, 0.8); drawCylinder(s, t, 0.35 * ga); drawMolecules(s, t, 0.45 * ga); }
      // labels above the box
      const fs = L.fs, ly = L.by - fs * 0.95, lx = WX(L0 + 0.14);
      const va = fade(t, C0, 63.0, 0.6, 0.6);
      if (va > 0) rich(s, `V = ${(Lp(t) / L0).toFixed(2)} V_{0}`, lx, ly, fs, va, serifF, PCOL, 'right');
      // part 1
      drawKey(s, fade(t, A0 + 1, L.phone ? B0 : 25.4, 0.8, 0.6));
      // part 2
      drawZoom(s, t, fade(t, B0, L.phone ? 25.6 : C0, 0.7, 0.6));
      drawTrace(s, t, fade(t, 25.3, L.phone ? C0 : D0 + 0.4, 0.8, 0.6));
      const pfa = fade(t, 30.9, C0, 0.7, 0.6);
      if (pfa > 0) {
        const z = Math.round(clamp(s.W / 36, 16, 30));
        if (!L.phone) {
          const R = zoomRect(), y = R.y1 + (L.panel.y1 - R.y1) * 0.5;
          rich(s, 'P = F / A', (L.panel.x0 + L.panel.x1) / 2, y - fs * 0.3, z, pfa, serifF);
          D.text(s, 'F = force perpendicular to the wall, A = area', (L.panel.x0 + L.panel.x1) / 2, y + z * 0.95, Math.round(fs * 0.8), 0.7 * pfa, D.sans(Math.round(fs * 0.8)), C.muted);
        } else rich(s, 'P = F / A', L.panel.x1 - fs * 0.4, L.panel.y0 + fs * 0.8, z, pfa, serifF, C.text, 'right');
      }
      // part 3: halve the volume
      const ca = fade(t, C0, D0, 0.6, 0.6);
      drawPV(s, t, ca);
      readouts(s, [
        [L.phone ? 'hits on each bit of wall' : 'hits per second on each part of the wall', x1f(BOYLE.rate), smooth((t - 57.8) / 0.5), C.vel],
        [L.phone ? 'Δp per hit' : 'momentum change per hit', x1f(BOYLE.perHit), smooth((t - 58.4) / 0.5), C.vel],
        ['pressure', x1f(BOYLE.P), smooth((t - 59.0) / 0.5), C.light],
      ], ca * smooth((t - 57.6) / 0.4));
      // part 4: heat at constant volume
      const da = fade(t, D0, E0 - 0.2, 0.6, 0.7);
      drawPT(s, t, da);
      drawThermo(s, t, da);
      const spd = Math.sqrt(Tk(t) / T0K);
      readouts(s, [
        [L.phone ? 'speeds (all scaled)' : 'molecule speeds (all scaled)', `×${spd.toFixed(2)}`, smooth((t - 68.6) / 0.5), C.light],
        [L.phone ? 'hits on each bit of wall' : 'hits per second on each part of the wall', x1f(HEAT.rate), smooth((t - 79.6) / 0.5), C.vel],
        [L.phone ? 'Δp per hit' : 'momentum change per hit', x1f(HEAT.perHit), smooth((t - 80.2) / 0.5), C.vel],
        ['pressure', x1f(HEAT.P), smooth((t - 80.8) / 0.5), C.light],
      ], da * smooth((t - 68.4) / 0.4));
      // part 5: the model
      const ma = fade(t, E0, F0T + 0.2, 0.8, 0.7);
      drawModel(s, t, ma);
      sectionTitle(s, '1 · Molecules in a gas', fade(t, A0, B0, 0.6, 0.6));
      sectionTitle(s, '2 · One hit, then many', fade(t, B0, C0, 0.6, 0.6));
      sectionTitle(s, '3 · Halving the volume', ca);
      sectionTitle(s, '4 · Heating at constant volume', da);
      sectionTitle(s, '5 · The kinetic model of an ideal gas', ma);
      D.captions(s, t, CAPS);
      if (t < 3.8) { s.g.fillStyle = `rgba(4,6,13,${0.72 * fade(t, 0, 3.6, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.3, 3.8, 'Where does gas pressure come from?', 'Molecules, momentum and the gas laws');
      drawEnd(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
