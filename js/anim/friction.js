/* A.2 What exactly is friction? A block is pushed until it slides, then a continuous zoom to the
   bumps (asperities) on the two surfaces and on to the atoms at one contact spot.
   Numbers (checked): m = 2.0 kg, F_N = mg = 2.0 × 9.8 = 19.6 N; μs = 0.50 → maximum static friction 9.8 N;
   μd = 0.40 → dynamic friction 0.40 × 19.6 = 7.84 N ≈ 7.8 N. Just past 9.8 N the net force is 9.8 − 7.84 = 1.96 N,
   so a = 0.98 m s^-2; after 0.25 s, v = 0.245 m s^-1 (it moves 0.031 m). A 7.84 N push then keeps v constant for 2.0 s
   (0.49 m). With no push it stops: a = −μd g = −3.92 m s^-2, in 0.0625 s and 0.0077 m.
   Doubling F_N to 39.2 N: dynamic friction 0.40 × 39.2 = 15.68 ≈ 15.7 N.
   Block 0.30 m × 0.10 m × 0.10 m (wood, about 670 kg m^-3 → 2.0 kg). Narrow face 0.10 × 0.10 m: a third of the
   big face's area, so 3 times the pressure. Bumps a few micrometres high and tens of micrometres apart
   (drawn to scale: heights and widths use the same scale); atoms 0.25–0.27 nm apart. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const TAU = Math.PI * 2;

  // ---------- colours ----------
  const PUSH = C.force, FRIC = '255,104,112', NW = '205,214,245', BOND = C.light, HOT = '255,120,80';
  const WOOD_EDGE = '240,190,140', TABLE_EDGE = '185,176,240';
  const A_BLOCK = '120,215,200', A_TABLE = '178,162,255';

  // ---------- the motion of the block (macro), from F = ma ----------
  const M = 2.0, G = 9.8, FN = M * G, MUS = 0.5, MUD = 0.4, FMAX = MUS * FN, FDYN = MUD * FN;   // 19.6, 9.8, 7.84 N
  const T_P1 = 7.8, T_P2 = 8.6, T_P3 = 12.0, T_P4 = 13.6, T_SLIP = 16.1, T_ACC = 16.35, T_REL = 18.35;
  const ACC = (FMAX - FDYN) / M, V1 = ACC * (T_ACC - T_SLIP), DEC = MUD * G, T_STOP = T_REL + V1 / DEC;
  const X0 = -0.30, BL = 0.30, BH = 0.10, SLAB = 0.035;
  const d1 = 0.5 * ACC * (T_ACC - T_SLIP) ** 2, d2 = V1 * (T_REL - T_ACC), d3 = V1 * V1 / (2 * DEC);
  const XSTOP = X0 + d1 + d2 + d3;                                 // 0.228 m
  const push = (t) => t < T_P1 ? 0 : t < T_P2 ? 5 * smooth((t - T_P1) / (T_P2 - T_P1)) : t < T_P3 ? 5
    : t < T_P4 ? 5 + (FMAX - 5) * smooth((t - T_P3) / (T_P4 - T_P3)) : t < T_ACC ? FMAX : t < T_REL ? FDYN : 0;
  const fric = (t) => t < T_SLIP ? push(t) : t < T_STOP ? FDYN : 0;
  const blockX = (t) => {
    if (t <= T_SLIP) return X0;
    if (t <= T_ACC) return X0 + 0.5 * ACC * (t - T_SLIP) ** 2;
    if (t <= T_REL) return X0 + d1 + V1 * (t - T_ACC);
    const u = Math.min(t, T_STOP) - T_REL; return X0 + d1 + d2 + V1 * u - 0.5 * DEC * u * u;
  };
  const blockV = (t) => t <= T_SLIP ? 0 : t <= T_ACC ? ACC * (t - T_SLIP) : t <= T_REL ? V1 : Math.max(0, V1 - DEC * (t - T_REL));

  // ---------- the two rough surfaces (micrometres; same scale across and up) ----------
  const hT = (x) => 2.4 * Math.sin(TAU * x / 41 + 0.4) + 1.2 * Math.sin(TAU * x / 17.3 + 2.1) + 0.55 * Math.sin(TAU * x / 7.1 + 0.9) + 0.25 * Math.sin(TAU * x / 3.1 + 1.7);
  const hB = (u) => 2.1 * Math.sin(TAU * u / 37 + 1.9) + 1.3 * Math.sin(TAU * u / 14.9 + 0.3) + 0.6 * Math.sin(TAU * u / 6.3 + 2.6) + 0.25 * Math.sin(TAU * u / 2.7 + 0.5);
  // The block settles until its bumps carry the load: for each shift S, the gap Gap (block's mean surface above the
  // table's) is chosen so that the total length in contact over ±50 µm equals a target (more load → more contact).
  const DX = 0.1, NX = 1001, SMAX = 100;
  const tabT = Float64Array.from({ length: NX }, (_, i) => hT(-50 + i * DX));
  const tabB = Float64Array.from({ length: NX + SMAX / DX + 1 }, (_, i) => hB(-50 - SMAX + i * DX));
  const contactLen = (gap, S) => {
    const off = Math.round((SMAX - S) / DX); let n = 0;
    for (let i = 0; i < NX; i++) if (tabT[i] + tabB[i + off] > gap) n++;
    return n * DX;
  };
  const gapFor = (target, S) => { let lo = 0, hi = 12; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (contactLen(m, S) > target) lo = m; else hi = m; } return (lo + hi) / 2; };
  const L1 = 6, GS = 0.5;
  const mkTable = (target) => Float64Array.from({ length: SMAX / GS + 1 }, (_, i) => gapFor(target, i * GS));
  const GAP1 = mkTable(L1), GAP_CREEP = mkTable(L1 * 1.45), GAP2 = mkTable(L1 * 2);
  const look = (tb, S) => { const f = clamp(S / GS, 0, tb.length - 1.001), i = Math.floor(f); return lerp(tb[i], tb[i + 1], f - i); };

  // micro timeline
  const S1 = 44, S2 = 74;
  const shiftAt = (t) => S1 * smooth((t - 30.0) / 4.2) + (S2 - S1) * smooth((t - 62.6) / 4.6);
  const creepAt = (t) => smooth((t - 58.0) / 3.6) * (1 - smooth((t - 62.6) / 0.5));
  const loadAt = (t) => smooth((t - 68.6) / 1.8);
  const gapAt = (t) => {
    const S = shiftAt(t), g1 = look(GAP1, S);
    return lerp(lerp(g1, look(GAP_CREEP, S), creepAt(t)), look(GAP2, S), loadAt(t));
  };
  // surfaces at position xi (µm from the micro view centre); returns [table top, block bottom, in contact?] in µm
  const surf = (xi, u, gap) => {
    const top = hT(xi), bot = gap - hB(u);
    if (top > bot) { const m = (top + bot) / 2; return [m, m, true]; }
    return [top, bot, false];
  };
  // the contact spot used for the atom view: after shift S1, the contact nearest the centre, at its flattest point
  const J = (() => {
    const gap = look(GAP1, S1); let best = null;
    for (let xi = -20; xi <= 20; xi += 0.01) {
      const [m, , c] = surf(xi, xi - S1, gap); if (!c) continue;
      const slope = Math.abs(surf(xi + 0.01, xi + 0.01 - S1, gap)[0] - m) / 0.01;
      const score = Math.abs(xi) * 0.05 + slope;
      if (!best || score < best.score) best = { xi, y: m, score };
    }
    return best;
  })();

  // ---------- atoms at the junction (nm, relative to J) ----------
  const DT = 0.25, DB = 0.27, GAPA = 0.13;              // table and block spacings; each surface row 0.13 nm from the join
  const hash = (i, k, n) => { const v = Math.sin(i * 127.1 + k * 311.7 + n * 74.7) * 43758.5453; return v - Math.floor(v); };
  const atomShift = (t) => 0.16 * clamp(t - 43.6, 0, 10.4);   // nm; slowed right down
  const heatAt = (t) => 0.9 * smooth((t - 44.5) / 9.5) * (1 - smooth((t - 56) / 1.5));
  const SNAP = 0.55, FORM = -0.2;                          // a bond forms at u = -0.2 spacing, snaps at +0.55

  // ---------- camera: a continuous zoom (pixels per metre on a log scale) ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = W < 520;
    const Yc = H * (phone ? 0.47 : 0.46);
    const ppmM = phone ? W / 1.7 : Math.min(W / 1.8, H / 1.0);
    const tableY = H * (phone ? 0.52 : 0.55);
    const ppmU = W / (phone ? 55e-6 : 100e-6), ppmA = Math.min(W, H) / (phone ? 3.2e-9 : 3.6e-9);
    const k = H / 95;                                   // pixels per newton for the force arrows
    const VM = { ppm: ppmM, cx: phone ? -0.02 : 0.06, cy: (tableY - Yc) / ppmM };
    const VU = { ppm: ppmU, cx: XSTOP, cy: 1.6e-6 };
    const VA = { ppm: ppmA, cx: XSTOP + J.xi * 1e-6, cy: J.y * 1e-6 - 0.25e-9 };   // the join sits a little above the centre, leaving room for the captions
    L = { phone, Yc, k, VM, VU, VA, fs: Math.round(clamp(W / 56, 12, 28)) };
  }
  const zoom = (A, B, e) => {               // e = 0 at A, 1 at B (B is the closer view); the point at B's centre stays put
    const lp = lerp(Math.log10(A.ppm), Math.log10(B.ppm), e), ppm = 10 ** lp, f = (A.ppm / ppm) * (1 - e);
    return { ppm, cx: B.cx + (A.cx - B.cx) * f, cy: B.cy + (A.cy - B.cy) * f };
  };
  const ease = (x) => { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
  const cam = (t) => {
    if (t < 19.4) return L.VM;
    if (t < 23.8) return zoom(L.VM, L.VU, ease((t - 19.4) / 4.4));
    if (t < 34.6) return L.VU;
    if (t < 38.6) return zoom(L.VU, L.VA, ease((t - 34.6) / 4.0));
    if (t < 54.0) return L.VA;
    if (t < 57.4) return zoom(L.VU, L.VA, 1 - ease((t - 54.0) / 3.4));
    if (t < 73.4) return L.VU;
    return zoom(L.VM, L.VU, 1 - ease((t - 73.4) / 3.4));
  };

  // ---------- text with italic symbols and subscripts: "*F*_f_ = 5.0 N" ----------
  function rich(s, str, x, y, size, a, rgb, align = 'left', weight = 400) {
    if (a <= 0) return 0;
    const { g } = s, parts = str.split(/(\*[^*]+\*|_[^_]+_)/).filter(Boolean);
    const fontOf = (p) => p[0] === '*' ? D.serif(Math.round(size * 1.1)) : p[0] === '_' ? D.serif(Math.round(size * 0.72)) : D.sans(size, weight);
    const textOf = (p) => (p[0] === '*' || p[0] === '_') ? p.slice(1, -1) : p;
    let w = 0; for (const p of parts) { g.font = fontOf(p); w += g.measureText(textOf(p)).width; }
    let cx = clamp(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, 8, s.W - 8 - w);   // never off the edge
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`;
    for (const p of parts) {
      g.font = fontOf(p); const tx = textOf(p);
      g.fillText(tx, cx, y + (p[0] === '_' ? size * 0.32 : 0)); cx += g.measureText(tx).width;
    }
    g.shadowBlur = 0; return w;
  }
  const n1 = (v) => v.toFixed(1);

  // ---------- the world (block and table) drawn through the camera ----------
  function world(s, t, c) {
    const { g, W, H } = s, Yc = L.Yc, ppm = c.ppm;
    const X = (x) => W / 2 + (x - c.cx) * ppm, Y = (y) => Yc - (y - c.cy) * ppm;
    const wx = (px) => c.cx + (px - W / 2) / ppm;
    const lp = Math.log10(ppm), lpM = Math.log10(L.VM.ppm);
    const macroA = 1 - smooth((lp - lpM - 0.5) / 1.2);          // outlines and wood grain
    const microA = smooth((lp - 5.7) / 0.7);                     // the rough surfaces
    const atomA = smooth((lp - 10.25) / 0.55);
    const xb = blockX(t), S = shiftAt(t), gap = gapAt(t), aS = atomShift(t);
    const uOff = S + (xb - XSTOP) * 1e6 + aS * 1e-3;            // the block's own position along its surface, in µm
    const stack = smooth((t - 70.5) / 1.0);                     // a second block on top (twice the load)
    const clampY = (y) => clamp(y, -60, H + 60), clampX = (x) => clamp(x, -60, W + 60);
    const bl = clampX(X(xb - BL / 2)), br = clampX(X(xb + BL / 2));
    const step = 2, pts = [];
    for (let px = Math.floor(Math.min(0, bl)) - 4; px <= W + 4; px += step) {
      const xi = (wx(px) - XSTOP) * 1e6, sf = surf(xi, xi - uOff, gap);
      pts.push([px, clampY(Y(sf[0] * 1e-6)), clampY(Y(sf[1] * 1e-6)), sf[2]]);
    }
    // table
    const tb = clampY(Y(-SLAB));
    g.globalCompositeOperation = 'source-over';
    g.beginPath(); g.moveTo(pts[0][0], tb);
    for (const p of pts) g.lineTo(p[0], p[1]);
    g.lineTo(pts[pts.length - 1][0], tb); g.closePath();
    const y0c = clampY(Y(0)), tg = g.createLinearGradient(0, y0c, 0, Math.max(tb, y0c + 2));
    tg.addColorStop(0, `rgba(70,64,110,${1 - 0.8 * atomA})`); tg.addColorStop(1, `rgba(30,28,52,${1 - 0.8 * atomA})`);
    g.fillStyle = tg; g.fill();
    // block (and the second block when the load is doubled)
    const bp = pts.filter((p) => p[0] >= bl - step && p[0] <= br + step);
    const top = clampY(Y(BH * (1 + stack))), botTop = clampY(Y(BH));
    if (bp.length > 1) {
      g.beginPath(); g.moveTo(bl, top);
      for (const p of bp) g.lineTo(clamp(p[0], bl, br), p[2]);
      g.lineTo(br, top); g.closePath();
      const wg = g.createLinearGradient(0, botTop, 0, clampY(Y(0)));
      wg.addColorStop(0, `rgba(176,122,70,${1 - 0.8 * atomA})`); wg.addColorStop(1, `rgba(110,70,38,${1 - 0.8 * atomA})`);
      g.fillStyle = macroA > 0.02 ? wg : `rgba(92,62,38,${1 - 0.8 * atomA})`; g.fill();
      if (microA > 0 && macroA < 1) { g.fillStyle = `rgba(92,62,38,${(1 - macroA) * (1 - 0.8 * atomA)})`; g.fill(); }
      if (macroA > 0) {
        // wood grain
        g.save(); g.beginPath(); g.rect(bl, botTop, br - bl, clampY(Y(0)) - botTop); g.clip();
        for (const [yy, ph] of [[0.018, 0.3], [0.04, 1.7], [0.062, 2.9], [0.083, 4.1]]) {
          g.beginPath();
          for (let k = 0; k <= 40; k++) { const x = xb - BL / 2 + BL * k / 40; const y = yy + 0.004 * Math.sin(k * 0.5 + ph); k ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }
          g.strokeStyle = `rgba(70,40,18,${0.5 * macroA})`; g.lineWidth = 1.2; g.stroke();
        }
        g.restore();
        g.strokeStyle = `rgba(${WOOD_EDGE},${0.65 * macroA})`; g.lineWidth = 1.3; g.strokeRect(bl, botTop, br - bl, clampY(Y(0)) - botTop);
        if (stack > 0) {
          g.fillStyle = `rgba(150,102,58,${stack})`; g.fillRect(bl, top, br - bl, botTop - top);
          g.strokeStyle = `rgba(${WOOD_EDGE},${0.65 * macroA * stack})`; g.strokeRect(bl, top, br - bl, botTop - top);
        }
      }
    }
    // glowing surface lines; contact spots glow gold
    const edgeA = (0.45 + 0.5 * microA) * (1 - atomA);
    if (edgeA > 0) {
      D.glowLine(s, pts.map((p) => [p[0], p[1]]), TABLE_EDGE, edgeA * 0.8, 1.3);
      if (bp.length > 1) D.glowLine(s, bp.map((p) => [clamp(p[0], bl, br), p[2]]), WOOD_EDGE, edgeA * 0.8, 1.3);
    }
    const runs = []; let run = null;
    for (const p of bp) { if (p[3]) { (run || (run = [])).push([p[0], p[1]]); } else if (run) { runs.push(run); run = null; } }
    if (run) runs.push(run);
    const glow = microA * (1 - atomA) * fade(t, 24.6, 76.0, 0.8, 1) * (1 + 0.8 * creepAt(t));
    for (const r of runs) if (r.length > 1) D.glowLine(s, r, BOND, Math.min(1, glow), 2.2 + 1.5 * creepAt(t));
    return { X, Y, xb, runs, microA, atomA, macroA, ppm, lp };
  }

  // ---------- atoms ----------
  function atoms(s, t, c, a) {
    if (a <= 0) return;
    const { g, W, H } = s, ppm = c.ppm * 1e-9, Yc = L.Yc;     // pixels per nm
    const ox = W / 2 + (L.VA.cx - c.cx) * c.ppm, oy = Yc - (L.VA.cy - c.cy) * c.ppm;
    const PX = (x) => ox + x * ppm, PY = (y) => oy - y * ppm;
    const sh = atomShift(t), heat = heatAt(t), clk = s.clock;
    const halfW = (W / 2 + 60) / ppm, xc = (c.cx - L.VA.cx) * 1e9;
    const rows = 6, depth = [1, 1, 0.9, 0.55, 0.28, 0.1];   // rows further from the join fade out, leaving room for labels
    const v = 0.16;
    // time since the last snap, for block atom i (on its row next to the join) and for table atom j
    const sinceTop = (i) => { const x = i * DB + sh, u = (x / DT) - Math.floor(x / DT + 0.2); return (((u - SNAP) % 1) + 1) % 1 * DT / v; };
    const sinceBot = (j) => { const x = j * DT, ii = Math.ceil((x + SNAP * DT - sh) / DB), dx = ii * DB + sh - x - SNAP * DT; return dx / v; };
    const kick = (since) => (atomShift(t) > 0 && t > 43.7 ? Math.exp(-since / 0.9) : 0);
    const jig = (i, k, n, amp) => [amp * Math.sin(clk * (9 + 4 * hash(i, k, n)) + 6 * hash(i, k, n + 1)), amp * Math.cos(clk * (8 + 5 * hash(i, k, n + 2)) + 6 * hash(i, k, n + 3))];
    const pos = [];
    // heat haze along the join
    if (heat > 0) {
      const hz = g.createLinearGradient(0, PY(0.9), 0, PY(-0.9));
      hz.addColorStop(0, `rgba(${HOT},0)`); hz.addColorStop(0.5, `rgba(${HOT},${0.22 * heat * a})`); hz.addColorStop(1, `rgba(${HOT},0)`);
      g.fillStyle = hz; g.fillRect(0, PY(0.9), W, PY(-0.9) - PY(0.9));
    }
    for (const side of [-1, 1]) {
      const d = side < 0 ? DT : DB, x0 = side < 0 ? 0 : sh;
      const i0 = Math.floor((xc - halfW - x0) / d) - 1, i1 = Math.ceil((xc + halfW - x0) / d) + 1;
      for (let k = 0; k < rows; k++) for (let i = i0; i <= i1; i++) {
        const n = side < 0 ? 1 : 7;
        const bx = x0 + i * d + (hash(i, k, n) - 0.5) * 0.05 * (k > 0), by = side * (GAPA + k * d) + (hash(i, k, n + 9) - 0.5) * 0.04 * (k > 0);
        let local = 0;
        if (k === 0) local = kick(side > 0 ? sinceTop(i) : sinceBot(i));
        const amp = 0.012 * (1 + 1.6 * heat) + 0.03 * local * (k === 0 ? 1 : 0);
        const [jx, jy] = jig(i, k, n, amp);
        pos.push({ x: PX(bx + jx), y: PY(by + jy), side, k, i, dk: depth[k], hot: Math.min(1, heat * 0.6 * Math.exp(-k * 0.5) + local) });
      }
    }
    // bonds across the join (drawn first, so the atoms sit on top)
    const bondA = a * fade(t, 39.4, 56.0, 0.8, 0.8);
    if (bondA > 0) {
      const rowB = pos.filter((p) => p.side > 0 && p.k === 0), rowT = new Map(pos.filter((p) => p.side < 0 && p.k === 0).map((p) => [p.i, p]));
      g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      for (const p of rowB) {
        const x = p.i * DB + sh, j = Math.floor(x / DT + 0.2), u = x / DT - j, q = rowT.get(j);
        if (!q) continue;
        if (u < SNAP) {
          const str = clamp((u - FORM) / (SNAP - FORM), 0, 1), on = smooth((u - FORM) / 0.08);
          const rgb = str < 0.6 ? BOND : '255,150,80';
          g.strokeStyle = `rgba(${rgb},${0.25 * bondA * on})`; g.lineWidth = ppm * 0.09 * (1.2 - 0.5 * str); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
          g.strokeStyle = `rgba(${rgb},${0.9 * bondA * on})`; g.lineWidth = ppm * 0.03 * (1.2 - 0.6 * str); g.stroke();
        } else {
          const fl = Math.exp(-(u - SNAP) / 0.05);       // the snap: a quick flash
          if (fl > 0.05) D.glowDot(s, (p.x + q.x) / 2, (p.y + q.y) / 2, ppm * 0.16 * (1 + (1 - fl)), C.white, bondA * fl);
        }
      }
      g.globalCompositeOperation = 'source-over';
    }
    for (const p of pos) {
      if (p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40) continue;
      const rgb = p.side > 0 ? A_BLOCK : A_TABLE, R = ppm * 0.085;
      const aa = a * p.dk;
      D.glowDot(s, p.x, p.y, ppm * 0.17, p.hot > 0.05 ? HOT : rgb, aa * (0.35 + 0.5 * p.hot));
      const sg = g.createRadialGradient(p.x - R * 0.35, p.y - R * 0.35, R * 0.1, p.x, p.y, R);
      sg.addColorStop(0, `rgba(255,255,255,${aa})`); sg.addColorStop(0.45, `rgba(${rgb},${aa})`); sg.addColorStop(1, `rgba(${rgb},${0.55 * aa})`);
      g.fillStyle = sg; g.beginPath(); g.arc(p.x, p.y, R, 0, TAU); g.fill();
    }
    return { PX, PY, ppm };
  }

  // ---------- macro overlays: arrows, readouts, graph ----------
  function forces(s, t, w, a) {
    if (a <= 0) return;
    const k = L.k, fs = L.fs, cx = w.X(w.xb), y0 = w.Y(0), yc = w.Y(BH / 2), lf = w.X(w.xb - BL / 2);
    D.arrow(s, cx + 4, y0, cx + 4, y0 - FN * k, NW, a, '', { width: 2.2, blur: 6 });
    if (L.phone) rich(s, '*F*_N_ = 19.6 N', cx + 12, y0 - FN * k + fs * 0.3, fs, a, NW);
    else rich(s, '*F*_N_ = 19.6 N', cx - 2, y0 - FN * k - fs * 0.9, fs, a, NW, 'right');
    D.arrow(s, cx - 4, yc, cx - 4, yc + FN * k, NW, a, '', { width: 2.2, blur: 6 });
    rich(s, '*mg* = 19.6 N', cx + 8, yc + FN * k - fs * 0.6, fs, a, NW);
    const P = push(t), F = fric(t), pa = a * fade(t, T_P1, T_STOP + 0.4, 0.2, 0.2);
    if (P > 0.05) {
      D.arrow(s, lf - 4 - P * k, yc, lf - 4, yc, PUSH, pa, '', { width: 2.8 });
      rich(s, `push *F* = ${n1(P)} N`, lf - 4 - P * k, yc - fs * 1.3, fs, pa, PUSH, P * k > 70 ? 'left' : 'right');
    }
    if (F > 0.05) {
      const fy = y0 + 7;
      D.arrow(s, cx, fy, cx - F * k, fy, FRIC, pa, '', { width: 2.8 });
      rich(s, `*F*_f_ = ${n1(F)} N`, cx - F * k - 4, fy + fs * 1.4, fs, pa, FRIC, 'right');
    }
    const v = blockV(t);
    if (v > 0.02) D.arrow(s, cx, w.Y(BH) - fs * 1.2, cx + v * 260 * (L.phone ? 0.6 : 1), w.Y(BH) - fs * 1.2, C.vel, a, 'v', { width: 2.2, labelOff: 12 });
  }
  function readouts(s, t, a) {
    if (a <= 0) return;
    const fs = Math.round(L.fs * (L.phone ? 0.95 : 1)), x = 16, y0 = (s.top || 40) + 16, lh = fs * 1.6;
    const P = push(t), F = fric(t);
    rich(s, `push: *F* = ${n1(P)} N`, x, y0, fs, a, PUSH);
    rich(s, `friction: *F*_f_ = ${n1(F)} N`, x, y0 + lh, fs, a, FRIC);
    const third = t >= T_SLIP ? ['dynamic: *μ*_d_*F*_N_ = 0.40 × 19.6 = 7.8 N', fade(t, T_SLIP, 99, 0.3)]
      : ['max static: *μ*_s_*F*_N_ = 0.50 × 19.6 = 9.8 N', fade(t, T_P3 + 0.3, T_SLIP, 0.5, 0.1)];
    rich(s, third[0], x, y0 + 2 * lh, fs, a * third[1], C.text);
    if (L.phone) {          // phones have no graph: one line saying what the block is doing
      const st = t < T_P1 ? 'at rest' : t < T_P4 ? 'at rest: friction = push' : t < T_SLIP ? 'on the point of slipping'
        : t < T_ACC ? 'it slips!' : t < T_REL ? 'sliding at constant velocity' : t < T_STOP ? 'slowing down' : 'at rest';
      rich(s, st, x, y0 + 3 * lh, fs, a * 0.8, C.muted, 'left');
    }
  }
  function graph(s, t, a) {
    if (a <= 0 || L.phone) return;
    const { W, H } = s, fs = Math.round(clamp(W / 80, 10, 22));
    const l = W * 0.69, r = W * 0.965, top = Math.max(64, H * 0.15), bot = H * 0.4, t0 = G0, t1 = G1;   // real seconds
    const X = (tt) => l + (tt - t0) / (t1 - t0) * (r - l), Y = (F) => bot - F / 12 * (bot - top);
    s.g.fillStyle = `rgba(20,26,52,${0.45 * a})`; s.g.fillRect(l - fs * 2.6, top - fs * 2.2, r - l + fs * 3.2, bot - top + fs * 3.6);
    D.line(s, l, bot, r, bot, C.muted, 0.6 * a, 1.2); D.line(s, l, top, l, bot, C.muted, 0.6 * a, 1.2);
    for (const [F, lab] of [[FMAX, '9.8'], [FDYN, '7.8'], [5, '5.0']]) {
      D.line(s, l, Y(F), r, Y(F), C.muted, 0.22 * a, 1, [3, 4]);
      D.text(s, lab, l - 5, Y(F), fs, 0.75 * a, D.sans(fs), C.muted, 'right');
    }
    rich(s, 'friction *F*_f_ / N', l - fs * 2.2, top - fs * 1.2, fs, a, FRIC, 'left', 600);
    D.text(s, 'time', r, bot + fs * 0.9, fs, 0.7 * a, D.sans(fs), C.muted, 'right');
    const te = Math.min(t, t1), pts = [];
    const RS = realOf(T_SLIP);
    for (let tt = t0; tt <= te; tt += 0.02) { if (tt > RS - 0.01 && tt < RS + 0.02) pts.push([X(RS), Y(FMAX)]); pts.push([X(tt), Y(fric(tauOf(tt)))]); }
    if (pts.length > 1) D.glowLine(s, pts, FRIC, a, 1.6);
    if (t > t0 && t < t1) D.glowDot(s, X(te), Y(fric(tauOf(te))), 9, FRIC, a);
  }

  // ---------- labels in the zoomed views ----------
  function scaleBar(s, ppm, a) {
    if (a <= 0) return;
    const target = s.W * (L.phone ? 0.28 : 0.16) / ppm, p = Math.floor(Math.log10(target)), m = target / 10 ** p;
    const nice = (m >= 5 ? 5 : m >= 2 ? 2 : 1) * 10 ** p, px = nice * ppm, fs = L.fs;
    const unit = nice >= 1 ? [1, 'm'] : nice >= 0.01 ? [0.01, 'cm'] : nice >= 1e-3 ? [1e-3, 'mm'] : nice >= 1e-6 ? [1e-6, 'µm'] : [1e-9, 'nm'];
    const val = +(nice / unit[0]).toPrecision(2), x = 16, y = (s.top || 40) + 20;
    D.line(s, x, y, x + px, y, C.white, 0.85 * a, 2.2);
    D.line(s, x, y - 5, x, y + 5, C.white, 0.85 * a, 2); D.line(s, x + px, y - 5, x + px, y + 5, C.white, 0.85 * a, 2);
    D.text(s, `${val} ${unit[1]}`, x, y + fs * 1.1, fs, 0.85 * a, D.sans(fs, 600), C.white, 'left');
  }
  function tag(s, text, a) {
    if (a <= 0) return;
    const fs = L.fs, y = (s.top || 40) + 22;
    s.g.font = D.sans(fs, 600); const w = s.g.measureText(text).width + fs * 1.4;
    s.g.fillStyle = `rgba(143,184,255,${0.16 * a})`; s.g.strokeStyle = `rgba(143,184,255,${0.6 * a})`; s.g.lineWidth = 1;
    s.g.beginPath(); s.g.roundRect(s.W - 16 - w, y - fs * 0.85, w, fs * 1.7, fs * 0.85); s.g.fill(); s.g.stroke();
    D.text(s, text, s.W - 16 - w / 2, y, fs, a, D.sans(fs, 600), C.vel);
  }
  function microLabels(s, t, w) {
    const a = w.microA * (1 - w.atomA) * fade(t, 23.4, 76.2, 0.8, 0.8); if (a <= 0) return;
    const fs = L.fs, { W, H } = s;
    D.text(s, 'block (wood)', W * 0.28, H * (L.phone ? 0.27 : 0.22), fs + 2, 0.85 * a, D.sans(fs + 2, 600), WOOD_EDGE);
    D.text(s, 'table', W * 0.28, H * (L.phone ? 0.66 : 0.68), fs + 2, 0.85 * a, D.sans(fs + 2, 600), TABLE_EDGE);
    // label the contact nearest the centre
    const ca = a * fade(t, 25.0, 34.0, 0.8, 0.6);
    if (ca > 0 && w.runs.length) {
      const r = w.runs.map((q) => q[q.length >> 1]).sort((p, q) => Math.abs(p[0] - W / 2) - Math.abs(q[0] - W / 2))[0];
      D.line(s, r[0], r[1] - 8, r[0], r[1] - fs * 3, C.light, 0.8 * ca, 1.2);
      D.text(s, 'real contact', r[0], r[1] - fs * 3.7, fs, ca, D.sans(fs, 600), C.light);
    }
    // the readout for twice the load
    const la = a * fade(t, 68.4, 76.2, 0.6, 0.6);
    if (la > 0) {
      const x = W - 16, y = (s.top || 40) + (L.phone ? 18 : 62), lh = fs * 1.55, e = loadAt(t);
      rich(s, `*F*_N_ = ${e > 0.5 ? '39.2' : '19.6'} N`, x, y, fs, la, NW, 'right', 600);
      rich(s, `real contact area ×${e > 0.5 ? 2 : 1}`, x, y + lh, fs, la, C.light, 'right');
      rich(s, `sliding friction ${e > 0.5 ? '15.7' : '7.8'} N`, x, y + 2 * lh, fs, la, FRIC, 'right');
      // a press from above
      const pa = la * (0.4 + 0.6 * e);
      D.arrow(s, W / 2, H * 0.06 + (s.top || 0), W / 2, H * 0.06 + (s.top || 0) + 30 + 30 * e, NW, pa, '', { width: 2.4 + 2 * e });
    }
    // at rest, the spots grow
    const ra = a * fade(t, 58.0, 62.6, 0.6, 0.4);
    if (ra > 0) tag(s, 'at rest: time passes…', ra);
  }
  function atomLabels(s, t, w, at) {
    const a = w.atomA * fade(t, 38.4, 54.6, 0.8, 0.6); if (a <= 0 || !at) return;
    const fs = L.fs, { W } = s;
    for (const [txt, y] of [['atoms of the block', (s.top || 40) + 20 + fs * 2.8], ['atoms of the table', at.PY(-GAPA - DT * 3.6)]]) {
      s.g.font = D.sans(fs + 1, 600); const w = s.g.measureText(txt).width;
      s.g.fillStyle = `rgba(4,6,13,${0.75 * a})`; s.g.beginPath(); s.g.roundRect(10, y - fs * 0.9, w + 12, fs * 1.8, 6); s.g.fill();
    }
    D.text(s, 'atoms of the block', 16, (s.top || 40) + 20 + fs * 2.8, fs + 1, a, D.sans(fs + 1, 600), A_BLOCK, 'left');
    D.text(s, 'atoms of the table', 16, at.PY(-GAPA - DT * 3.6), fs + 1, a, D.sans(fs + 1, 600), A_TABLE, 'left');
    const ba = a * fade(t, 39.6, 46.0, 0.6, 0.6);
    if (ba > 0) {
      const x = W * (L.phone ? 0.72 : 0.78);
      D.text(s, 'bonds', x, at.PY(GAPA + DB * 1.55), fs, ba, D.sans(fs, 600), C.light);
      D.line(s, x, at.PY(GAPA + DB * 1.3), x, at.PY(0.06), C.light, 0.7 * ba, 1.2);
    }
  }

  // ---------- area comparison (a separate picture) ----------
  let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const spots = (n, minD) => { const out = []; let tries = 0; while (out.length < n && tries++ < 5000) { const p = [0.06 + 0.88 * rnd(), 0.1 + 0.8 * rnd()]; if (out.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > minD)) out.push(p); } return out; };
  const SP_BIG = spots(24, 0.07), SP_SMALL = spots(12, 0.2);
  function compare(s, t, a) {
    if (a <= 0) return;
    const { g, W, H } = s, phone = L.phone, fs = L.fs;
    const ppm = phone ? W * 0.3 / BL : Math.min(W * 0.3 / BL, H * 0.27 / BL);
    const tableY = H * (phone ? 0.42 : 0.43), cxs = [W * 0.28, W * 0.74];
    const k = Math.min(L.k, (cxs[0] - BL / 2 * ppm - 10) / FDYN);
    // table
    g.fillStyle = `rgba(52,48,84,${a})`; g.fillRect(0, tableY, W, SLAB * ppm);
    D.line(s, 0, tableY, W, tableY, TABLE_EDGE, 0.7 * a, 1.4);
    const dims = [[BL, BH], [BH, BL]];
    dims.forEach(([w, h], n) => {
      const x = cxs[n], bw = w * ppm, bh = h * ppm;
      g.fillStyle = `rgba(160,108,60,${a})`; g.fillRect(x - bw / 2, tableY - bh, bw, bh);
      g.strokeStyle = `rgba(${WOOD_EDGE},${0.7 * a})`; g.lineWidth = 1.3; g.strokeRect(x - bw / 2, tableY - bh, bw, bh);
      // push, friction and velocity
      D.arrow(s, x - bw / 2 - 4 - FDYN * k, tableY - bh / 2, x - bw / 2 - 4, tableY - bh / 2, PUSH, a, '', { width: 2.4 });
      D.arrow(s, x, tableY + 6, x - FDYN * k, tableY + 6, FRIC, a, '', { width: 2.6 });
      rich(s, '*F*_f_ = 7.8 N', x - FDYN * k, tableY + SLAB * ppm + fs * 0.9, fs, a, FRIC, 'left', 600);
      D.arrow(s, x + bw / 2 + 6, tableY - bh * 0.5, x + bw / 2 + 6 + (phone ? 22 : 40), tableY - bh * 0.5, C.vel, a, 'v', { width: 2, head: 9, labelOff: 10 });
      D.text(s, n ? 'narrow face down' : 'big face down', x, tableY - bh - fs * 1.1, fs, a * 0.9, D.sans(fs, 600), C.text);
    });
    // footprints seen from below
    const fa = a * smooth((t - 78.6) / 0.8);
    if (fa <= 0) return;
    const fy = tableY + SLAB * ppm + fs * 2.6, shrink = phone ? 1 : 0.9;
    D.text(s, 'contact spots, seen from below (spots enlarged)', W / 2, fy, fs, 0.8 * fa, D.sans(fs), C.muted);
    const fp = [[BL, BH, SP_BIG], [BH, BH, SP_SMALL]];
    const rB = Math.sqrt(0.08 * (BL * BH * ppm * ppm * shrink * shrink) / (24 * Math.PI)), rads = [rB, rB * Math.SQRT2];
    fp.forEach(([w, h, sp], n) => {
      const bw = w * ppm * shrink, bh = h * ppm * shrink, x = cxs[n] - bw / 2, y = fy + fs * 1.1;
      g.fillStyle = `rgba(60,42,28,${fa})`; g.fillRect(x, y, bw, bh);
      g.strokeStyle = `rgba(${WOOD_EDGE},${0.6 * fa})`; g.lineWidth = 1; g.strokeRect(x, y, bw, bh);
      for (const [u, v] of sp) {
        D.glowDot(s, x + u * bw, y + v * bh, rads[n] * 2.4, C.light, fa * 0.6);
        g.fillStyle = `rgba(255,230,160,${fa})`; g.beginPath(); g.arc(x + u * bw, y + v * bh, rads[n], 0, TAU); g.fill();
      }
      const pa = a * fade(t, 82.4, 99, 0.6);
      if (pa > 0) D.text(s, n ? (phone ? 'pressure × 3' : 'pressure × 3, spots bigger and closer') : 'pressure × 1', cxs[n], y + bh + fs * 1.1, Math.round(fs * (phone ? 0.85 : 1)), pa, D.sans(Math.round(fs * (phone ? 0.85 : 1))), C.text);
    });
    const ta = a * fade(t, 83.4, 99, 0.6);
    if (ta > 0 && !phone) D.text(s, 'same total real contact area → same friction', W / 2, fy + fs * 2.4 + BH * ppm * shrink + fs * 2.6, fs + 1, ta, D.sans(fs + 1, 700), C.light);
  }

  // ---------- closing ----------
  function closing(s, t) {
    const ea = fade(t, 88.4, DURATION, 0.9, 0.8); if (ea <= 0) return;
    const { W, H } = s;
    s.g.fillStyle = `rgba(4,6,13,${0.78 * ea})`; s.g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 22, 22, 46)), s2 = Math.round(clamp(W / 50, 13, 20)), y = H * (L.phone ? 0.2 : 0.2) + (s.top || 0);
    rich(s, '*F*_f_ ≤ *μ*_s_*F*_N_', W / 2, y, s1, ea, C.text, 'center');
    rich(s, 'static: friction matches the push, up to a maximum', W / 2, y + s1 * 0.95, s2, ea * 0.8, C.muted, 'center');
    rich(s, '*F*_f_ = *μ*_d_*F*_N_', W / 2, y + s1 * 2.1, s1, ea, C.text, 'center');
    rich(s, 'dynamic: once sliding (usually *μ*_d_ < *μ*_s_)', W / 2, y + s1 * 3.05, s2, ea * 0.8, C.muted, 'center');
    s.g.font = D.sans(s2);
    const lines = [...D.wrap(s, 'Friction opposes the relative motion of the surfaces, or their tendency to move.', Math.min(W - 40, 720)),
      ...D.wrap(s, 'The work done against friction becomes thermal energy.', Math.min(W - 40, 720))];
    D.text(s, lines, W / 2, y + s1 * 4.3, s2, ea * 0.9, D.sans(s2), C.text);
  }

  const CAPS = [
    [3.6, 7.6, 'A 2.0 kg block rests on a table. Its weight, 19.6 N, is balanced by the normal force from the table.'],
    [7.8, 11.8, 'Push gently with 5.0 N: static friction pushes back with 5.0 N, so the block stays still.'],
    [12.0, 16.0, 'Static friction matches the push, but only up to a maximum: 0.50 × 19.6 N = 9.8 N.'],
    [16.1, 18.3, 'Push past 9.8 N and it slips.'],
    [18.45, 18.7, 'Dynamic friction is smaller, 0.40 × 19.6 N = 7.8 N, so a 7.8 N push kept it sliding at constant velocity (the flat part of the graph).'],
    [18.8, 22.8, 'So what is friction? Zoom in to where the block touches the table.'],
    [24.0, 29.6, 'Even a surface that feels smooth is rough at this scale. The two touch only at the tips of a few bumps: the real area of contact is tiny.'],
    [29.8, 34.4, 'As the block slides (slowed right down), the bumps deform, contacts break and new ones form.'],
    [34.6, 38.4, 'Now zoom in on one contact spot, down to the size of atoms.'],
    [38.8, 43.2, 'Here the atoms are so close that they attract each other (adhesion), like weak bonds across the join.'],
    [43.4, 48.0, 'To slide, these bonds must be stretched and broken. New ones form, then break again.'],
    [48.2, 54.0, 'Each snapped bond leaves the atoms vibrating more: the work done against friction becomes thermal energy, and the surfaces warm up.'],
    [57.6, 62.2, 'Left at rest, the contact spots slowly creep and grow, and the bonds between them get stronger.'],
    [62.4, 67.6, 'Once sliding, each contact lasts only a moment. This is one reason starting to slide takes more force than keeping it sliding.'],
    [67.8, 73.2, 'Press twice as hard: the bumps squash, so the real contact area roughly doubles, and so does the friction.'],
    [77.0, 82.0, 'Does a bigger face give more friction? Stand the block on its narrow face: the friction is still 7.8 N.'],
    [82.2, 88.0, 'The narrow face has a third of the area, so 3 times the pressure: its bumps squash more. The total real contact area is the same.'],
  ];
  const DURATION = 96.6;

  // ---------- no pauses (teacher, 17 November 2026) ----------
  // Real time t → story time τ. 'rest' adds seconds at a moment when nothing in the story moves (the block at rest,
  // a still diagram); the atoms keep vibrating and the force–time graph keeps drawing in real time. 'longer' lets a
  // slow process with no natural speed (the contacts creeping, the bumps squashing) take a little longer.
  const WARP = [
    ['rest', 7.0, 1.9], ['rest', 11.2, 1.2], ['rest', 15.4, 1.5],
    ['rest', 18.6, 7.6],                                    // after the block has stopped: the dynamic-friction caption
    ['rest', 29.0, 2.5], ['rest', 34.4, 0.8],               // the bumps before and after the slow-motion slide
    ['rest', 42.6, 1.6], ['rest', 43.5, 0.5], ['rest', 53.9, 1.9],   // atoms at the join, still vibrating
    ['longer', 58.0, 61.6, 1.2], ['rest', 67.4, 2.2], ['longer', 68.6, 70.4, 1.5],
    ['rest', 81.4, 1.2], ['rest', 87.4, 1.8], ['rest', 94.6, 3.0],
  ];
  const extra = WARP.reduce((n, w) => n + w[w.length - 1], 0), DUR_R = DURATION + extra;
  // real time of story time τ (late: at a 'rest' point, the end of the added seconds)
  const realOf = (tau, late = false) => {
    let r = tau;
    for (const w of WARP) {
      if (w[0] === 'rest') { if (tau > w[1] || (late && tau === w[1])) r += w[2]; }
      else { const [, a, b, d] = w; if (tau > a) r += d * clamp((tau - a) / (b - a), 0, 1); }
    }
    return r;
  };
  const tauOf = (t) => {                                  // inverse of realOf
    let lo = 0, hi = DURATION;
    if (t >= realOf(DURATION)) return DURATION;
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (realOf(m) <= t) lo = m; else hi = m; }
    return lo;
  };
  const CAPS_R = CAPS.map(([a, b, txt]) => [realOf(a), realOf(b, true), txt]);
  const G0 = 7.0, G1 = realOf(19.4);                      // the force–time graph's time axis, in real seconds

  Anim.register('friction', {
    duration: DUR_R,
    poster: realOf(45),
    // score: curious and microscopic (A dorian, a soft sine pad that slowly swells, a little wind)
    music: { chords: [[57, 60, 64, 66], [55, 59, 62, 66], [53, 57, 62, 64], [52, 55, 59, 62]], bar: 7, pad: 'sine', cutoff: 900, drone: 0.09, wind: 0.25, tremolo: 0.2, volume: 0.35 },
    resize: layout,
    info: { CAPS: CAPS_R, realOf, tauOf, DUR_R },
    frame(s, tr) {
      const t = tauOf(tr);                                 // story time
      D.background(s, 0.22);
      const c = cam(t), cmp = smooth((t - 76.6) / 0.8);
      const wa = 1 - cmp;
      let w = null;
      if (wa > 0) {
        s.g.save(); s.g.globalAlpha = 1;
        w = world(s, t, c);
        const at = atoms(s, t, c, w.atomA);
        s.g.restore();
        const on = smooth((t - 3.0) / 0.8);
        forces(s, t, w, on * w.macroA * (1 - smooth((t - 19.0) / 0.6)) * wa);
        readouts(s, t, on * (1 - smooth((t - 18.9) / 0.6)));
        graph(s, tr, on * smooth((t - 7.4) / 0.6) * (1 - smooth((t - 18.9) / 0.6)));
        microLabels(s, t, w);
        atomLabels(s, t, w, at);
        scaleBar(s, c.ppm, fade(t, 19.8, 76.4, 0.6, 0.6));
        const sl = fade(t, 30.0, 34.3, 0.3, 0.3) + fade(t, 43.6, 54.0, 0.3, 0.3) + fade(t, 62.6, 67.3, 0.3, 0.3);
        tag(s, 'slow motion', Math.min(1, sl));
        if (wa < 1) { s.g.fillStyle = `rgba(4,6,13,${cmp})`; s.g.fillRect(0, 0, s.W, s.H); }
      }
      compare(s, t, cmp * (1 - smooth((t - 88.6) / 0.6) * 0.9));
      D.captions(s, tr, CAPS_R);
      closing(s, t);
      if (t < 3.6) { s.g.fillStyle = `rgba(4,6,13,${0.75 * fade(t, 0, 3.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.3, 3.4, 'What exactly is friction?', 'From a sliding block down to its atoms');
      D.vignette(s, tr, DUR_R);
    },
  });
})();
