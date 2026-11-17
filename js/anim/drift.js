/* B.5 Inside a wire: how current flows. A cell, a switch and a lamp; a zoom into the copper wire, where
   free electrons move randomly among the vibrating positive ions of the lattice. With no p.d. as many cross a
   line each way as the other (no current); an insulator has no free charge carriers; with the switch closed the
   field makes the electrons drift towards the positive terminal (opposite to the conventional current), and their
   collisions with the ions pass energy to the lattice (resistance, heating). Then why the lamp lights at once.
   Physics (a simple 2D model, simulated once at load with a fixed seed, so every frame is a pure function of t):
   electrons fly in straight lines (curved by the field once it is on: constant acceleration towards +), and
   scatter in a random direction, at a random thermal speed, when they reach an ion. The field-on drift comes out
   at about 0.5 lattice spacings per second, about a sixth of the random speed: drawn far faster than real.
   Numbers (checked): drift v = I/(nAe) = 1 / (8.5e28 × 1.0e-6 × 1.60e-19) = 7.4e-5 m/s ≈ 0.07 mm/s for 1 A in 1 mm²
   of copper; random speeds of the free electrons are more than 1e5 m/s (thermal estimate sqrt(3kT/m) ≈ 1.2e5 m/s at
   300 K; the quantum value is about 1.6e6 m/s), so more than a billion times the drift.
   The counts on the screen are the simulation's own crossings of the dashed line. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const TAU = Math.PI * 2;

  // ---------- colours ----------
  const CU = '214,138,82', ION = C.pos, EL = C.neg, FIELD = C.field, CUR = '240,244,255', HOT = '255,128,72', LAMP = C.light;
  const SYM = '214,222,245', ATOM = '150,160,196';

  // ---------- timeline (scene seconds) ----------
  const T_ZIN = 8.8, T_ZIN2 = 12.4, T_ONE = 23.4, T_ONE2 = 28.8, T_INS = 28.8, T_INS2 = 34.6;
  const T_ON = 35.6, T_TWO = 40.8, T_TWO2 = 57.8, T_HEAT = 63.8, T_ZOUT = 75.4, T_ZOUT2 = 78.2;
  const T_OPEN = 78.6, T_CLOSE = 87.6, DURATION = 109.6, FRONT = 0.32;   // FRONT: the time for the field to spread half-way round the loop (drawn far slower than real)

  // ---------- the simulation (lattice spacing = 1 unit; periodic box LX × LY) ----------
  const LX = 20, LY = 6, VR = 3.0, RC = 0.3, TMAX = 1.4, N = 120, DT = 1 / 200, EVERY = 5, FPS = 1 / (DT * EVERY), TEND = T_ZOUT2;
  const A0 = 4.0, XC = 10;                    // acceleration due to the field (units s^-2); the dashed line at x = 10
  const sim = (() => {
    let seed = 13; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const x = new Float64Array(N), y = new Float64Array(N), vx = new Float64Array(N), vy = new Float64Array(N), since = new Float64Array(N);
    const near = (px, py) => { const yy = ((py % LY) + LY) % LY; return [Math.floor(px) + 0.5, Math.floor(yy) + 0.5, yy]; };
    for (let i = 0; i < N; i++) {
      for (;;) { x[i] = rnd() * LX; y[i] = rnd() * LY; const [cx, cy, yy] = near(x[i], y[i]); if (Math.hypot(x[i] - cx, yy - cy) > RC + 0.08) break; }
      const a = rnd() * TAU, sp = VR * (0.75 + 0.5 * rnd()); vx[i] = sp * Math.cos(a); vy[i] = sp * Math.sin(a); since[i] = rnd();
    }
    const nF = Math.ceil(TEND / DT / EVERY) + 1, FX = new Float32Array(nF * N), FY = new Float32Array(nF * N);
    const hits = [], left = [], right = [];
    const acc = (t) => A0 * smooth((t - T_ON) / 0.4);
    let f = 0;
    for (let k = 0; k * DT <= TEND + 1e-9; k++) {
      const t = k * DT;
      if (k % EVERY === 0 && f < nF) { for (let i = 0; i < N; i++) { FX[f * N + i] = x[i]; FY[f * N + i] = y[i]; } f++; }
      const a = acc(t);
      for (let i = 0; i < N; i++) {
        vx[i] -= a * DT;                       // the field pushes electrons to the left (towards the + terminal)
        const x0 = x[i];
        x[i] += vx[i] * DT; y[i] += vy[i] * DT; since[i] += DT;
        const k0 = Math.floor((x0 - XC) / LX), k1 = Math.floor((x[i] - XC) / LX);
        if (k0 !== k1) (k1 > k0 ? right : left).push(t + DT);
        const [cx, cy, yy] = near(x[i], y[i]), dx = x[i] - cx, dy = yy - cy, d = Math.hypot(dx, dy);
        const r = since[i] > TMAX ? 0.5 : RC;  // (a very long free flight ends at the next ion it passes close to)
        if (d < r && dx * vx[i] + dy * vy[i] < 0) {
          const ke0 = 0.5 * (vx[i] ** 2 + vy[i] ** 2);
          const ang = Math.atan2(dy, dx) + (rnd() - 0.5) * Math.PI * 0.9, sp = VR * (0.75 + 0.5 * rnd());
          vx[i] = sp * Math.cos(ang); vy[i] = sp * Math.sin(ang); since[i] = 0;
          hits.push({ t: t + DT, ion: (((Math.floor(cx) % LX) + LX) % LX) + LX * Math.floor(cy), dE: ke0 - 0.5 * sp * sp });
        }
      }
    }
    return { FX, FY, nF, hits, left, right };
  })();
  const pos = (i, t) => {
    const u = clamp(t * FPS, 0, sim.nF - 1.0001), f = Math.floor(u), e = u - f, a = f * N + i, b = a + N;
    return [lerp(sim.FX[a], sim.FX[b], e), lerp(sim.FY[a], sim.FY[b], e)];
  };
  const upper = (arr, t) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] <= t) lo = m + 1; else hi = m; } return lo; };
  const hitTimes = sim.hits.map((h) => h.t);
  const count = (arr, a, t) => upper(arr, t) - upper(arr, a);
  const wrap = (v, p) => v - p * Math.floor(v / p);
  const XV = XC;                                     // the dashed line is drawn at the centre of the screen

  // the electron to follow: the one most often inside the phone's view while it is highlighted
  const TRACER = (() => {
    let best = 0, bestN = -1;
    for (let i = 0; i < N; i++) {
      let n = 0;
      for (let t = 12.8; t < 62; t += 0.25) {
        const [x, y] = pos(i, t), dx = wrap(x - XV + LX / 2, LX) - LX / 2, dy = wrap(y, LY) - 3;
        if (Math.abs(dx) < 3.4 && Math.abs(dy) < 1.9) n += t < 23 ? 2 : 1;
      }
      if (n > bestN) { bestN = n; best = i; }
    }
    return best;
  })();
  const ION_LABEL = [Math.floor(XV - 2.5) + 0.5, 1.5];   // the ion that gets the "positive ion" label

  // ---------- states ----------
  const switchAt = (t) => t < T_ON ? 0 : t < T_OPEN ? smooth((t - T_ON) / 0.3) : t < T_CLOSE ? 1 - smooth((t - T_OPEN) / 0.3) : smooth((t - T_CLOSE) / 0.3);
  const fieldAt = (t) => smooth((t - T_ON - 0.1) / 0.4);
  const heatAt = (t) => 0.25 * smooth((t - T_ON) / 25) + 0.75 * smooth((t - T_HEAT) / 9);
  const insAt = (t) => smooth((t - T_INS) / 0.6) * (1 - smooth((t - T_INS2) / 0.6));
  const ease = (x) => { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
  const zoomAt = (t) => t < T_ZIN ? 0 : t < T_ZIN2 ? ease((t - T_ZIN) / (T_ZIN2 - T_ZIN)) : t < T_ZOUT ? 1 : 1 - ease((t - T_ZOUT) / (T_ZOUT2 - T_ZOUT));

  // ---------- layout ----------
  let L = null;
  function geo(x, y, w, h) {
    const u = w / 260;
    return { L: x, R: x + w, T: y, B: y + h, w, h, u, xc: x + 0.36 * w, xs: x + 0.72 * w, ym: y + h / 2, rl: 10 * u, ww: 1.7 * u };
  }
  function layout(s) {
    const { W, H } = s, phone = W < 520, top = s.top || 0;
    const fs = Math.round(clamp(W / 56, 12, 26));
    let band;
    if (phone) { const bt = top + fs * 3.4, ppu = Math.min(W / 8.5, (H * 0.69 - bt) / 5); band = { top: bt, bot: bt + 5 * ppu, ppu }; }
    else { const bt = H * 0.24, bb = H * 0.71; band = { top: bt, bot: bb, ppu: (bb - bt) / 5 }; }
    band.mid = (band.top + band.bot) / 2;
    const cw = phone ? W * 0.78 : Math.min(W * 0.46, H * 0.95), ch = cw * (phone ? 0.72 : 0.56);
    const cy = phone ? top + (H * 0.7 - top) * 0.5 : H * 0.44;
    const G = geo(W / 2 - cw / 2, cy - ch / 2, cw, ch);
    const P = [G.L + 0.3 * G.w, G.B];                     // the spot on the bottom wire that the camera zooms into
    const hm = clamp(band.top - 30, 36, 96), mini = phone ? null : geo(16 + 4, 14 + hm * 0.12, hm * 1.55, hm * 0.8);
    L = { phone, fs, band, G, P, mini, Zend: 2.6 * H / G.ww, path: loopPath(G) };
  }

  // ---------- the circuit (data booklet symbols): wires, cell, switch, lamp ----------
  function circuit(s, G, o) {
    const { g } = s, u = G.u, a = o.a; if (a <= 0) return;
    const { L: l, R, T, B, xc, xs, ym, rl, ww } = G;
    g.globalCompositeOperation = 'source-over'; g.lineCap = 'round'; g.lineJoin = 'round';
    const wires = [[[xc - 5 * u, T], [l, T], [l, B], [R, B], [R, ym + rl]], [[R, ym - rl], [R, T], [xs + 12 * u, T]], [[xs - 12 * u, T], [xc + 5 * u, T]]];
    const stroke = (pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); };
    // a faint glow under the copper
    g.strokeStyle = `rgba(${CU},${0.16 * a})`; g.lineWidth = ww * 3.2; wires.forEach(stroke);
    if (o.front != null) {         // the field spreading round the circuit as the switch closes
      g.strokeStyle = `rgba(${FIELD},${0.5 * a * o.frontA})`; g.lineWidth = ww * 4; wires.forEach(stroke);
    }
    g.strokeStyle = `rgba(${CU},${a})`; g.lineWidth = ww; wires.forEach(stroke);
    g.strokeStyle = `rgba(255,214,170,${0.45 * a})`; g.lineWidth = ww * 0.3; wires.forEach(stroke);    // a shine along the wire
    // cell: long thin plate (+) and short thick plate (−)
    g.strokeStyle = `rgba(${SYM},${a})`; g.lineCap = 'butt';
    g.lineWidth = Math.max(1, 1.1 * u); g.beginPath(); g.moveTo(xc - 5 * u, T - 14 * u); g.lineTo(xc - 5 * u, T + 14 * u); g.stroke();
    g.lineWidth = 3.2 * u; g.beginPath(); g.moveTo(xc + 5 * u, T - 7 * u); g.lineTo(xc + 5 * u, T + 7 * u); g.stroke();
    // switch: two contacts and a lever
    const th = (1 - o.sw) * 0.62;
    g.lineCap = 'round'; g.lineWidth = Math.max(1, 1.2 * u); g.strokeStyle = `rgba(${SYM},${a})`;
    g.beginPath(); g.moveTo(xs - 12 * u, T); g.lineTo(xs - 12 * u + 24 * u * Math.cos(th), T - 24 * u * Math.sin(th)); g.stroke();
    for (const cx of [xs - 12 * u, xs + 12 * u]) { g.fillStyle = `rgba(14,18,34,${a})`; g.beginPath(); g.arc(cx, T, 2.2 * u, 0, TAU); g.fill(); g.lineWidth = Math.max(1, 0.9 * u); g.stroke(); }
    // lamp: a circle with a cross; it glows when lit
    if (o.lamp > 0) {
      D.glowDot(s, R, ym, rl * 3.4, LAMP, a * o.lamp);
      g.fillStyle = `rgba(255,226,140,${0.75 * a * o.lamp})`; g.beginPath(); g.arc(R, ym, rl, 0, TAU); g.fill();
    }
    g.fillStyle = `rgba(14,18,34,${a * (1 - 0.7 * o.lamp)})`; g.beginPath(); g.arc(R, ym, rl, 0, TAU); g.fill();
    g.strokeStyle = `rgba(${SYM},${a})`; g.lineWidth = Math.max(1, 1.2 * u); g.stroke();
    const k = rl * 0.707; g.beginPath(); g.moveTo(R - k, ym - k); g.lineTo(R + k, ym + k); g.moveTo(R - k, ym + k); g.lineTo(R + k, ym - k); g.stroke();
  }
  // the wire loop, in the direction the electrons drift (clockwise on the screen), from the − plate round to the + plate
  function loopPath(G) {
    const { L: l, R, T, B, xc, u } = G, pts = [[xc + 5 * u, T], [R, T], [R, B], [l, B], [l, T], [xc - 5 * u, T]];
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const len = cum[cum.length - 1];
    const at = (d) => {
      d = wrap(d, len); let i = 1; while (i < cum.length - 1 && cum[i] < d) i++;
      const e = (d - cum[i - 1]) / (cum[i] - cum[i - 1]), p = pts[i - 1], q = pts[i];
      return [lerp(p[0], q[0], e), lerp(p[1], q[1], e), (q[0] - p[0]) / (cum[i] - cum[i - 1]), (q[1] - p[1]) / (cum[i] - cum[i - 1])];
    };
    return { len, at, lampD: (R - (xc + 5 * u)) + (G.ym - T) };
  }
  function circuitLabels(s, t, a) {
    if (a <= 0) return;
    const { G } = L, fs = L.fs, u = G.u;
    const lab = (txt, x, y, al = 'center', rgb = C.text) => D.text(s, txt, x, y, fs, a, D.sans(fs, 600), rgb, al);
    lab('cell', G.xc, G.T - 14 * u - fs * 0.9);
    D.text(s, '+', G.xc - 12 * u, G.T - 9 * u, fs + 2, a, D.sans(fs + 2, 700), C.text);
    D.text(s, '−', G.xc + 12 * u, G.T - 9 * u, fs + 2, a, D.sans(fs + 2, 700), C.text);
    lab(switchAt(t) > 0.5 ? 'switch (closed)' : 'switch (open)', G.xs, G.T - 14 * u - fs * 0.9);
    if (L.phone) lab('lamp', G.R - G.rl - 6, G.ym, 'right'); else lab('lamp', G.R + G.rl + 10, G.ym, 'left');
    lab('copper wire', G.L + G.w * 0.5, G.B + fs * 1.4, 'center', CU);
  }
  // the zoom: circuit coordinates → screen
  function zoomTf(s, e) {
    const { W, H } = s, Z = L.Zend ** e, P = L.P;
    const Bc = [P[0], P[1] - (L.band.mid - H / 2) / L.Zend], f = (1 - e) / Z;
    const c = [Bc[0] + (W / 2 - Bc[0]) * f, Bc[1] + (H / 2 - Bc[1]) * f];
    return { Z, ox: W / 2 - c[0] * Z, oy: H / 2 - c[1] * Z };
  }

  // ---------- text with italic symbols and subscripts: "*I* = Δ*q*" ----------
  function rich(s, str, x, y, size, a, rgb, align = 'left', weight = 400) {
    if (a <= 0) return 0;
    const { g } = s, parts = str.split(/(\*[^*]+\*|_[^_]+_)/).filter(Boolean);
    const fontOf = (p) => p[0] === '*' ? D.serif(Math.round(size * 1.1)) : p[0] === '_' ? D.serif(Math.round(size * 0.72)) : D.sans(size, weight);
    const textOf = (p) => (p[0] === '*' || p[0] === '_') ? p.slice(1, -1) : p;
    let w = 0; for (const p of parts) { g.font = fontOf(p); w += g.measureText(textOf(p)).width; }
    let cx = clamp(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, 8, s.W - 8 - w);
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`;
    for (const p of parts) {
      g.font = fontOf(p); const tx = textOf(p);
      g.fillText(tx, cx, y + (p[0] === '_' ? size * 0.32 : 0)); cx += g.measureText(tx).width;
    }
    g.shadowBlur = 0; return w;
  }

  // ---------- inside the metal ----------
  const hash = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
  function inside(s, t, a) {
    if (a <= 0) return;
    const { g, W, H } = s, { top, bot, mid, ppu } = L.band, ins = insAt(t), cu = 1 - ins, heat = heatAt(t), clk = s.clock;
    const SX = (dx) => W / 2 + dx * ppu, SY = (y) => mid + (y - 3) * ppu;
    const halfW = W / 2 / ppu + 0.6, yLo = top - 1.1 * ppu, yHi = bot + 1.1 * ppu;
    g.globalCompositeOperation = 'source-over';
    // the metal (warmer as it heats up)
    g.fillStyle = `rgba(${Math.round(lerp(30, 74, heat * cu))},${Math.round(lerp(22, 28, heat * cu))},${Math.round(lerp(26, 24, heat * cu))},${a})`; g.fillRect(0, 0, W, H);
    if (heat * cu > 0.02) {
      const hz = g.createRadialGradient(W / 2, mid, 0, W / 2, mid, Math.max(W, H) * 0.6);
      hz.addColorStop(0, `rgba(${HOT},${0.22 * heat * cu * a})`); hz.addColorStop(1, `rgba(${HOT},0)`);
      g.fillStyle = hz; g.fillRect(0, 0, W, H);
    }
    // the electric field (violet lines between the rows of ions), spreading along the wire almost at once
    const fa = a * cu * fieldAt(t);
    if (fa > 0) {
      const xEnd = W * smooth((t - T_ON - 0.1) / 0.45) * 1.05;
      for (const yy of [1, 3, 5]) {
        const y = SY(yy);
        D.line(s, 0, y, Math.min(W, xEnd), y, FIELD, 0.38 * fa, 1.4);
        for (let x = ((W / 2) % (3 * ppu)) + 1.5 * ppu; x < Math.min(W, xEnd) - 4; x += 3 * ppu) {
          g.fillStyle = `rgba(${FIELD},${0.6 * fa})`; g.beginPath(); g.moveTo(x + 7, y); g.lineTo(x - 4, y - 5); g.lineTo(x - 4, y + 5); g.closePath(); g.fill();
        }
      }
      const ef = Math.round(L.fs * 1.1);
      g.font = D.sans(ef, 600); const ew = g.measureText('field E').width + ef;
      g.fillStyle = `rgba(4,6,13,${0.7 * fa})`; g.beginPath(); g.roundRect(W - 12 - ew, SY(1) - ef * 0.85, ew, ef * 1.7, ef * 0.85); g.fill();
      rich(s, 'field *E*', W - 12 - ew / 2, SY(1), ef, fa, '178,172,255', 'center', 600);
    }
    // the dashed line that electrons are counted across
    const la = a * cu * Math.max(fade(t, T_ONE - 0.4, T_ONE2 + 0.2, 0.5, 0.5), fade(t, T_TWO - 0.4, T_HEAT, 0.5, 0.6));
    if (la > 0) D.line(s, W / 2, top + 2, W / 2, bot, C.white, 0.7 * la, 1.6, [6, 6]);

    let tracerXY = null; const Ri = ppu * 0.2, Re = Math.max(2.2, ppu * 0.075);
    if (cu > 0) {
      // collisions: recent hits make an ion vibrate more and (while the story is about heating) flash
      const kick = new Float32Array(LX * LY), flashes = [];
      const flashA = fade(t, T_HEAT - 0.2, T_ZOUT + 0.4, 0.8, 0.6);
      if (t > T_ON) {
        for (let k = upper(hitTimes, t - 1.6), k1 = upper(hitTimes, t); k < k1; k++) {
          const h = sim.hits[k]; if (h.t < T_ON || h.dE <= 0) continue;
          const age = t - h.t; kick[h.ion] += Math.min(1, h.dE / 4) * Math.exp(-age / 0.5);
          if (flashA > 0 && age < 0.4) flashes.push([h.ion, Math.min(1, h.dE / 3) * Math.exp(-age / 0.13)]);
        }
      }
      // ions
      const amp0 = 0.035 + 0.08 * heat;
      const ionXY = (i, j, m) => {
        const n = i + LX * j, A = amp0 + 0.09 * Math.min(1, kick[n]);
        const jx = A * Math.sin(clk * (7 + 4 * hash(n, 1)) + TAU * hash(n, 2)), jy = A * Math.cos(clk * (6 + 5 * hash(n, 3)) + TAU * hash(n, 4));
        return [i + 0.5 + jx, j + 0.5 + jy + m * LY];
      };
      const ions = [];
      for (let m = -1; m <= 1; m++) for (let j = 0; j < LY; j++) {
        const yy = j + 0.5 + m * LY; if (SY(yy) < yLo || SY(yy) > yHi) continue;
        for (let i = 0; i < LX; i++) {
          const dx0 = wrap(i + 0.5 - XV + LX / 2, LX) - LX / 2;
          for (const sh of [0, -LX, LX]) {
            const dx = dx0 + sh; if (Math.abs(dx) > halfW) continue;
            const [x, y] = ionXY(i, j, m);
            ions.push([SX(dx + x - (i + 0.5)), SY(y), i + LX * j]);
          }
        }
      }
      const fl = new Map(flashes.map(([n, v]) => [n, v]));
      for (const [x, y, n] of ions) {
        const hot = Math.min(1, 0.45 * heat + 0.6 * kick[n]);
        D.glowDot(s, x, y, Ri * 2.6, hot > 0.3 ? HOT : ION, a * cu * (0.28 + 0.4 * hot));
        const sg = g.createRadialGradient(x - Ri * 0.35, y - Ri * 0.35, Ri * 0.1, x, y, Ri);
        sg.addColorStop(0, `rgba(255,236,242,${a * cu})`); sg.addColorStop(0.5, `rgba(${ION},${a * cu})`); sg.addColorStop(1, `rgba(150,30,70,${a * cu})`);
        g.fillStyle = sg; g.beginPath(); g.arc(x, y, Ri, 0, TAU); g.fill();
        if (Ri >= 7) D.text(s, '+', x, y + 0.5, Math.round(Ri * 1.3), a * cu * 0.9, D.sans(Math.round(Ri * 1.3), 700), C.white);
        const f = fl.get(n);
        if (f) D.glowDot(s, x, y, Ri * 3.2, HOT, a * cu * flashA * f);
      }
      // electrons
      const trA = fade(t, 12.8, T_HEAT + 0.6, 0.8, 0.8);
      for (let i = 0; i < N; i++) {
        const [x, y] = pos(i, t), dx0 = wrap(x - XV + LX / 2, LX) - LX / 2, yw = wrap(y, LY);
        for (const sh of [0, -LX, LX]) for (const m of [0, -1, 1]) {
          const dx = dx0 + sh, sy = SY(yw + m * LY); if (Math.abs(dx) > halfW || sy < yLo || sy > yHi) continue;
          const sx = SX(dx), tr = i === TRACER ? trA : 0;
          if (tr > 0 && sh === 0 && m === 0) {
            tracerXY = [sx, sy];
            // its path over the last 3 s
            const pts = [], offx = dx0 - (x - XV), offy = yw - y;
            for (let tt = Math.max(0, t - 3); tt <= t; tt += 1 / FPS) { const [px, py] = pos(i, tt); pts.push([SX(px - XV + offx), SY(py + offy)]); }
            pts.push([sx, sy]);
            D.glowLine(s, pts, C.white, 0.55 * a * tr, 1.3, (k) => k / pts.length);
          }
          D.glowDot(s, sx, sy, Re * 3.2, EL, a * cu * (0.75 + 0.25 * tr));
          g.fillStyle = `rgba(${tr > 0 ? '255,255,255' : '205,245,255'},${a * cu})`; g.beginPath(); g.arc(sx, sy, Re * (1 + 0.35 * tr), 0, TAU); g.fill();
        }
      }
    }
    // the insulator: electrons held by their own atoms (a simple picture)
    if (ins > 0) {
      const Ra = ppu * 0.24;
      for (let m = -1; m <= 1; m++) for (let j = 0; j < LY; j++) for (let i = 0; i < LX; i++) {
        const n = i + LX * j, ax = i + 0.5 + (hash(n, 5) - 0.5) * 0.36, ay = j + 0.5 + (hash(n, 6) - 0.5) * 0.36 + m * LY;
        const dx = wrap(ax - XV + LX / 2, LX) - LX / 2, x = SX(dx), y = SY(ay);
        if (Math.abs(dx) > halfW || y < yLo || y > yHi) continue;
        const sg = g.createRadialGradient(x - Ra * 0.3, y - Ra * 0.3, Ra * 0.1, x, y, Ra);
        sg.addColorStop(0, `rgba(230,234,250,${a * ins})`); sg.addColorStop(1, `rgba(${ATOM},${0.8 * a * ins})`);
        g.fillStyle = sg; g.beginPath(); g.arc(x, y, Ra, 0, TAU); g.fill();
        const ph = t * (2.2 + 1.2 * hash(n, 7)) * (hash(n, 8) > 0.5 ? 1 : -1) + TAU * hash(n, 9), r = ppu * 0.36;
        const ex = x + r * Math.cos(ph), ey = y + r * 0.8 * Math.sin(ph);
        g.strokeStyle = `rgba(${EL},${0.28 * a * ins})`; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, r, r * 0.8, 0, 0, TAU); g.stroke();
        D.glowDot(s, ex, ey, ppu * 0.2, EL, a * ins * 0.8);
        g.fillStyle = `rgba(205,245,255,${a * ins})`; g.beginPath(); g.arc(ex, ey, Math.max(2, ppu * 0.06), 0, TAU); g.fill();
      }
    }
    // dim the metal above and below the window, so the window reads as a slice of the wire
    const dim = (y0, y1, a0, a1) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, `rgba(4,6,13,${a0 * a})`); gr.addColorStop(1, `rgba(4,6,13,${a1 * a})`); g.fillStyle = gr; g.fillRect(0, y0, W, y1 - y0); };
    g.globalCompositeOperation = 'source-over';
    dim(0, top - 0.25 * ppu, 0.86, 0.86); dim(top - 0.25 * ppu, top + 0.35 * ppu, 0.86, 0);
    dim(bot - 0.35 * ppu, bot + 0.25 * ppu, 0, 0.86); dim(bot + 0.25 * ppu, H, 0.86, 0.86);
    // labels for the first look
    const lb = a * cu * fade(t, 13.2, 23.0, 0.7, 0.6);
    if (lb > 0) {
      const fs = L.fs, ly = top - fs * 1.1;
      const ix = SX(ION_LABEL[0] - XV), iy = SY(ION_LABEL[1]);
      D.line(s, ix, ly + fs * 0.6, ix, iy - Ri - 3, C.white, 0.6 * lb, 1.2);
      D.text(s, 'positive ion', ix, ly, fs, lb, D.sans(fs, 600), ION);
      if (tracerXY) {
        const ex = W * (L.phone ? 0.74 : 0.66);
        D.line(s, ex, ly + fs * 0.6, tracerXY[0], tracerXY[1] - Re - 3, C.white, 0.6 * lb, 1.2);
        D.text(s, 'free electron', ex, ly, fs, lb, D.sans(fs, 600), EL);
      }
    }
    // which material
    const fs = L.fs, tagTxt = ins > 0.5 ? 'plastic: an insulator' : 'copper: a conductor';
    const ta = a * fade(t, T_ZIN2, T_ZOUT + 0.3, 0.8, 0.5) * (1 - 0.9 * Math.max(fade(t, T_INS - 0.1, T_INS + 0.7, 0.3, 0.3), fade(t, T_INS2 - 0.1, T_INS2 + 0.7, 0.3, 0.3)));
    if (ta > 0) {
      g.font = D.sans(fs, 600); const w = g.measureText(tagTxt).width + fs * 1.2, x = 12, y = bot - fs * 1.2;
      g.fillStyle = `rgba(4,6,13,${0.7 * ta})`; g.beginPath(); g.roundRect(x, y - fs * 0.8, w, fs * 1.6, fs * 0.8); g.fill();
      D.text(s, tagTxt, x + w / 2, y, fs, ta, D.sans(fs, 600), ins > 0.5 ? ATOM : CU);
    }
  }

  // ---------- counters, arrows and the small circuit ----------
  function counters(s, t, a) {
    if (a <= 0) return;
    const { W } = s, fs = L.fs, top = L.band.top, y1 = top - fs * 2.0, y2 = top - fs * 0.75;
    const two = t >= T_TWO - 0.6, t0 = two ? T_TWO : T_ONE, tt = Math.min(t, two ? T_HEAT : T_ONE2);
    const nl = t > t0 ? count(sim.left, t0, tt) : 0, nr = t > t0 ? count(sim.right, t0, tt) : 0;
    rich(s, `← ${nl}`, W / 2 - 12, y1, fs + 2, a, EL, 'right', 700);
    rich(s, `${nr} →`, W / 2 + 12, y1, fs + 2, a, EL, 'left', 700);
    const net = nl - nr;
    const msg = !two ? `net: ${Math.abs(net)}${net > 0 ? ' to the left' : net < 0 ? ' to the right' : ''}`
      : t > 51.8 ? `charge through the line: |Δ*q*| = ${net}*e*` : `net: ${net} electrons to the left`;
    rich(s, msg, W / 2, y2, fs, a * 0.9, C.muted, 'center');
  }
  function flowArrows(s, t, a) {
    if (a <= 0) return;
    const { W } = s, fs = L.fs, y = L.band.bot + fs * 0.95, y2 = y + fs * 1.15, ph = L.phone;
    const da = a * smooth((t - 41.6) / 0.8), ia = a * smooth((t - 46.8) / 0.8);
    if (da > 0) {
      D.arrow(s, W * (ph ? 0.44 : 0.4), y, W * (ph ? 0.1 : 0.16), y, EL, da, '', { width: 2.4, head: 10 });
      D.text(s, ph ? 'electron drift' : 'electron drift (towards +)', W * (ph ? 0.27 : 0.28), y2, fs, da, D.sans(fs, 600), EL);
    }
    if (ia > 0) {
      D.arrow(s, W * (ph ? 0.56 : 0.6), y, W * (ph ? 0.9 : 0.84), y, CUR, ia, '', { width: 2.4, head: 10 });
      rich(s, ph ? 'current *I*' : 'conventional current *I*', W * (ph ? 0.73 : 0.72), y2, fs, ia, CUR, 'center', 600);
    }
  }
  function miniCircuit(s, t, a) {
    if (a <= 0 || !L.mini) return;
    const G = L.mini, { g } = s, pad = 8;
    g.fillStyle = `rgba(4,6,13,${0.55 * a})`; g.beginPath(); g.roundRect(G.L - pad - 4, G.T - 14 * G.u - pad, G.w + 2 * pad + 4 + G.rl, G.h + 14 * G.u + 2 * pad, 8); g.fill();
    const sw = switchAt(t);
    circuit(s, G, { a, sw, lamp: smooth((t - T_ON - 0.15) / 0.2) * (t < T_OPEN ? 1 : 0), front: null });
    // where we are looking
    const px = G.L + 0.3 * G.w, py = G.B;
    s.g.strokeStyle = `rgba(255,255,255,${0.85 * a})`; s.g.lineWidth = 1.4; s.g.beginPath(); s.g.arc(px, py, G.u * 7, 0, TAU); s.g.stroke();
  }

  // ---------- the whole loop: the wire is full of electrons, which all start moving together ----------
  function loopDots(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { G, path } = L, u = G.u, sp = 4.4 * u, n = Math.floor(path.len / sp), clk = s.clock;
    const arr = (d) => Math.min(d, path.len - d) / path.len * 2 * FRONT, v = 2.8 * u;
    const R = Math.max(1.8, 1.05 * u);
    for (let k = 0; k < n; k++) {
      const d0 = k * path.len / n, moved = v * Math.max(0, t - T_CLOSE - arr(d0)) * (t > T_CLOSE ? 1 : 0);
      const [x, y, tx, ty] = path.at(d0 + moved);
      const j = 0.3 * u * Math.sin(clk * (9 + 5 * hash(k, 1)) + TAU * hash(k, 2)), jp = 0.25 * u * Math.cos(clk * (8 + 6 * hash(k, 3)) + TAU * hash(k, 4));
      const xx = x + tx * j - ty * jp, yy = y + ty * j + tx * jp;
      // no dots inside the open switch gap or inside the cell
      if (Math.abs(yy - G.T) < 2 * u && Math.abs(xx - G.xs) < 12 * u && switchAt(t) < 0.5) continue;
      g.fillStyle = `rgba(${EL},${0.35 * a})`; g.beginPath(); g.arc(xx, yy, R * 1.9, 0, TAU); g.fill();
      g.fillStyle = `rgba(200,246,255,${a})`; g.beginPath(); g.arc(xx, yy, R, 0, TAU); g.fill();
    }
    // the field front, sweeping both ways round from the cell
    const fp = (t - T_CLOSE) / FRONT;
    if (fp > 0 && fp < 1.6) {
      for (const dir of [1, -1]) {
        const d = clamp(fp, 0, 1) * path.len / 2, [x, y] = path.at(dir > 0 ? d : path.len - d);
        D.glowDot(s, x, y, 16 * u, FIELD, a * (1 - smooth((fp - 1) / 0.6)));
      }
    }
  }
  function loopArrows(s, t, a) {
    if (a <= 0) return;
    const { G } = L, fs = L.fs, u = G.u, xm = G.L + G.w * 0.5;
    const ya = G.B + fs * 1.1, yb = G.B - fs * 1.2;
    D.arrow(s, xm - G.w * 0.18, ya, xm + G.w * 0.18, ya, CUR, a, '', { width: 2.2, head: 9 });
    rich(s, 'conventional current *I*', xm, ya + fs * 1.05, fs, a, CUR, 'center', 600);
    D.arrow(s, xm + G.w * 0.14, yb, xm - G.w * 0.14, yb, EL, a, '', { width: 2.2, head: 9 });
    D.text(s, 'electrons drift', xm, yb - fs * 0.95, fs, a, D.sans(fs, 600), EL);
    D.text(s, '(slowly)', xm, yb - fs * 2.05, Math.round(fs * 0.9), a * 0.8, D.sans(Math.round(fs * 0.9)), C.muted);

  }

  // ---------- closing ----------
  function closing(s, t) {
    const ea = fade(t, 99.2, DURATION, 0.9, 0.8); if (ea <= 0) return;
    const { W, H } = s;
    s.g.fillStyle = `rgba(4,6,13,${0.8 * ea})`; s.g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 20, 26, 52)), s2 = Math.round(clamp(W / 50, 13, 21)), y = H * (L.phone ? 0.2 : 0.2) + (s.top || 0);
    rich(s, '*I* = Δ*q* / Δ*t*', W / 2, y, s1, ea, C.text, 'center');
    rich(s, 'current is the rate of flow of charge', W / 2, y + s1 * 0.95, s2, ea * 0.8, C.muted, 'center');
    s.g.font = D.sans(s2);
    const mw = Math.min(W - 40, 700);
    const lines = [
      ...D.wrap(s, 'Outside the cell, conventional current flows from + to −. In a metal, the free electrons drift the other way.', mw), '',
      ...D.wrap(s, 'Collisions between the drifting electrons and the vibrating ions pass energy to the metal: this is the origin of resistance, and it heats the wire.', mw)];
    D.text(s, lines, W / 2, y + s1 * 2.0, s2, ea * 0.92, D.sans(s2), C.text);
  }

  const CAPS = [
    [3.8, 9.0, 'A cell, a switch and a lamp, joined by copper wire. The switch is open, so there is no current. Let\'s look inside the wire.'],
    [12.6, 18.0, 'Inside the copper: a lattice of positive ions, vibrating about fixed positions, and a "sea" of free electrons, one for each ion.'],
    [18.2, 23.2, 'The free electrons are the charge carriers. They dart about at random, very fast: more than 100 km per second.'],
    [23.4, 28.8, 'Count the electrons crossing the dashed line: about as many go each way. The net flow of charge is zero, so there is no current.'],
    [29.0, 35.0, 'Compare an insulator, such as plastic: its electrons are bound to their atoms. With almost no free charge carriers, there is almost no current.'],
    [35.2, 40.6, 'Now close the switch. The p.d. of the cell sets up an electric field E along the wire, almost at once.'],
    [40.8, 46.4, 'The electrons still move at random, but now they also drift slowly towards the positive terminal, opposite to E.'],
    [46.6, 51.8, 'Conventional current I is the direction in which positive charge would flow: opposite to the electrons\' drift.'],
    [52.0, 57.8, 'More electrons now cross one way than the other: there is a net flow of charge. The current is its rate of flow, I = Δq/Δt.'],
    [58.0, 63.6, 'In a real copper wire carrying 1 A through 1 mm², the drift is only about 0.07 mm per second. It is drawn far faster here.'],
    [63.8, 69.2, 'Between collisions the field speeds the electrons up. When an electron hits an ion, it hands on some of this energy.'],
    [69.4, 75.2, 'The ions vibrate more, so the internal energy of the wire rises: it warms up. These collisions are the origin of resistance.'],
    [78.4, 87.4, 'Open the switch again. Predict: if the drift is so slow, why does the lamp light the moment the switch is closed?'],
    [87.8, 93.6, 'The wire is already full of free electrons. The field reaches them all almost at once, so they all start to drift together.'],
    [93.8, 99.0, 'Like a bicycle chain: turn the pedals and every link starts to move at the same moment, all the way round.'],
  ];

  Anim.register('drift', {
    duration: DURATION,
    poster: 50,
    // score: electric flow (B minor, a low buzzing pad with tremolo, a low drone)
    music: { chords: [[47, 54, 59, 62], [43, 50, 55, 59], [50, 57, 62, 66], [45, 52, 57, 61]], bar: 6, pad: 'saw', cutoff: 800, tremolo: 3, drone: 0.09, volume: 0.79 },
    // no pauses (teacher, 17 November 2026): the Predict caption and the end card simply stay longer while the electrons keep moving
    resize: layout,
    frame(s, t) {
      D.background(s, 0.2);
      const e = zoomAt(t), inA = smooth((e - 0.62) / 0.33);
      // the circuit, through the zoom
      if (inA < 1) {
        const z = zoomTf(s, e), { g } = s;
        g.save(); g.translate(z.ox, z.oy); g.scale(z.Z, z.Z);
        const lampCl = t >= T_CLOSE ? smooth((t - T_CLOSE - 2 * FRONT * Math.min(L.path.lampD, L.path.len - L.path.lampD) / L.path.len) / 0.15) : t < T_OPEN ? smooth((t - T_ON - 0.15) / 0.2) : 1 - smooth((t - T_OPEN) / 0.2);
        const frontA = t > T_CLOSE ? fade(t, T_CLOSE, T_CLOSE + 1.4, 0.15, 1.0) : 0;
        circuit(s, L.G, { a: smooth((t - 2.6) / 1.0) * (1 - 0.92 * smooth((t - 99.0) / 1.0)), sw: switchAt(t), lamp: lampCl, front: frontA > 0 ? 1 : null, frontA });
        loopDots(s, t, smooth((t - T_OPEN - 0.3) / 0.8) * (1 - 0.92 * smooth((t - 99.0) / 1.0)));
        g.restore();
        circuitLabels(s, t, Math.max(fade(t, 3.2, T_ZIN + 0.6, 0.8, 0.6), fade(t, T_ZOUT2 + 0.2, 87.8, 0.7, 0.6)));
        // the spot we zoom into
        const ma = fade(t, 6.6, T_ZIN + 0.9, 0.6, 0.6);
        if (ma > 0) { const [x, y] = [z.ox + L.P[0] * z.Z, z.oy + L.P[1] * z.Z]; s.g.strokeStyle = `rgba(255,255,255,${0.8 * ma})`; s.g.lineWidth = 1.6; s.g.beginPath(); s.g.arc(x, y, L.G.u * 9 * z.Z, 0, TAU); s.g.stroke(); }
        loopArrows(s, t, fade(t, 89.0, 99.6, 0.8, 0.6));
      }
      // inside the wire
      if (inA > 0) {
        inside(s, t, inA);
        miniCircuit(s, t, inA * fade(t, T_ZIN2 - 0.4, T_ZOUT + 0.3, 0.6, 0.4));
        const ca = inA * (1 - insAt(t));
        counters(s, t, ca * Math.max(fade(t, T_ONE - 0.2, T_ONE2 + 0.3, 0.5, 0.5), fade(t, T_TWO - 0.2, T_HEAT + 0.2, 0.5, 0.6)));
        flowArrows(s, t, ca * fade(t, 41.0, T_ZOUT + 0.3, 0.6, 0.5));
      }
      D.captions(s, t, CAPS);
      closing(s, t);
      if (t < 3.6) { s.g.fillStyle = `rgba(4,6,13,${0.75 * fade(t, 0, 3.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.3, 3.4, 'Inside a wire', 'How an electric current flows through a metal');
      D.vignette(s, t, DURATION);
    },
  });
})();
