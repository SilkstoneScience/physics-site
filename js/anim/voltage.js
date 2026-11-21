/* What is voltage? (B.5 current, potential difference, emf, series circuits, power)
   A series circuit: an ideal cell (emf ε = 6.0 V, internal resistance negligible), a lamp and a resistor, a switch and
   two ammeters. Numbers (checked in info.check()):
     lamp 8.0 Ω and resistor 4.0 Ω in series: R = 12.0 Ω, I = ε ÷ R = 6.0 ÷ 12.0 = 0.50 A, the same everywhere in the loop
     p.d.s: lamp 0.50 × 8.0 = 4.0 V, resistor 0.50 × 4.0 = 2.0 V; 4.0 + 2.0 = 6.0 V = ε (energy conservation)
     V = W ÷ q: each coulomb transfers 4.0 J in the lamp, 2.0 J in the resistor; the cell does 6.0 J of work on it
     power: lamp P = IV = 0.50 × 4.0 = 2.0 W, resistor 1.0 W, cell εI = 3.0 W = 2.0 + 1.0
     drift speed (page only, beyond the syllabus): copper, n = 8.5 × 10²⁸ m⁻³, wire 0.50 mm² across:
       v = I ÷ (nAq) = 0.50 ÷ (8.5 × 10²⁸ × 0.50 × 10⁻⁶ × 1.60 × 10⁻¹⁹) = 7.4 × 10⁻⁵ m s⁻¹ ≈ 0.07 mm s⁻¹
   The charges drawn are positive (the conventional current); every charge moves at the same speed round the loop,
   speeded up enormously (one lap in 24 s). The graph is the potential against position round the circuit. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const NB = ' ';
  const EMF = 6.0, R_LAMP = 8.0, R_RES = 4.0;
  const I = EMF / (R_LAMP + R_RES), V_LAMP = I * R_LAMP, V_RES = I * R_RES;

  // ---------- captions: each held long enough to read (at most about 15 characters a second) ----------
  const SPEC = [
    ['A cell, a lamp and a resistor in series, with a switch. The switch is open, so there is no current.'],
    ['Close the switch. Charges all round the circuit start moving at once, and the lamp lights straight away.'],
    ['We follow positive charge: the conventional current. In metal wires, electrons actually drift the other way.'],
    [`The two ammeters read the same: 0.50${NB}A. Each second, 0.50${NB}C of charge passes every point in the loop.`],
    ['Predict: is any of the charge used up in the lamp?', 6],
    ['No. Every coulomb that goes into the lamp comes out again and carries on round. What the lamp takes is energy.'],
    [`Voltage, or potential difference (p.d.), is the energy transferred per unit charge between two points: V${NB}=${NB}W${NB}÷${NB}q.`],
    ['So 1 volt is 1 joule per coulomb. A voltmeter is connected in parallel: across a component, to the points either side of it.'],
    [`Across the lamp the voltmeter reads 4.0${NB}V: each coulomb passing through transfers 4.0${NB}J to it, as light and thermal energy.`],
    [`Across the resistor it reads 2.0${NB}V: each coulomb passing through transfers 2.0${NB}J, heating it.`],
    [`Across this ideal cell, 6.0${NB}V: its emf. The cell does 6.0${NB}J of work on each coulomb, from chemical energy.`],
    [`The graph shows the potential round the circuit: up 6.0${NB}V in the cell, down 4.0${NB}V in the lamp and 2.0${NB}V in the resistor.`],
    [`It is a graph, not a real hill, but it shows energy being conserved: 6.0${NB}J = 4.0${NB}J + 2.0${NB}J for every coulomb.`],
    ['So in a series circuit the p.d.s add up to the emf. Along the connecting wires the potential hardly changes.'],
    [`Each second 0.50${NB}C passes through the lamp, so it transfers 0.50${NB}×${NB}4.0 = 2.0${NB}J every second: P${NB}=${NB}IV${NB}=${NB}2.0${NB}W.`],
    ['Each charge drifts slowly: much less than a millimetre a second. Here its motion is speeded up enormously.'],
    ['Yet the lamp lights at once: energy reaches it through the electromagnetic field, set up all round the circuit almost instantly (beyond the syllabus).'],
    ['Remember: current flows through a component. Potential difference is across it, between two points.'],
  ];
  const CAPS = []; {
    let tc = 4.8;
    for (const [txt, extra = 0] of SPEC) {
      const d = Math.max(4.8, txt.length / 15 + 1.0) + extra;
      CAPS.push([+tc.toFixed(1), +(tc + d).toFixed(1), txt]); tc += d + 0.2;
    }
  }
  const at = (i) => CAPS[i][0], until = (i) => CAPS[i][1];
  const K_CLOSE = 1, K_AMM = 3, K_NO = 5, K_VLAMP = 8, K_VRES = 9, K_VCELL = 10, K_GRAPH = 11, K_POWER = 14, K_DRIFT = 15, K_FIELD = 16;
  const T_CLOSE = at(K_CLOSE) + 1.0;
  const END = until(CAPS.length - 1) + 0.2, DURATION = END + 12.5;
  const LAP = 24;                                        // seconds for one lap on screen

  // ---------- layout: the loop, its components and the graph ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25)), capTop = H - capFs * (phone ? 6.6 : 5.4);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    // phones: the circuit above the graph; wider screens: the circuit on the left, the graph on the right
    const x0 = W * (phone ? 0.2 : 0.17), x1 = W * (phone ? 0.8 : 0.47);
    const y0 = phone ? 46 : Math.max(92, fs * 6.4), y1 = phone ? capTop * 0.47 : capTop - fs * 3.4;
    const ym = (y0 + y1) / 2, xm = (x0 + x1) / 2, gap = Math.max(8, (y1 - y0) * 0.09);
    const lampR = Math.max(10, Math.min(18, (x1 - x0) * 0.05)), resL = (y1 - y0) * 0.34, resW = Math.max(10, resL * 0.32);
    const swL = Math.max(26, (x1 - x0) * 0.1), ammR = Math.max(9, lampR * 0.75);
    // the path, in the direction of the conventional current (up through the cell, clockwise on screen)
    const pts = [[x0, ym + gap / 2], [x0, ym - gap / 2], [x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, ym + gap / 2]];
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const P = cum[cum.length - 1];
    // where each part is, as distance along the path
    const sAt = (x, y) => {                             // a point on the loop → its distance along the path
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i], l = Math.hypot(bx - ax, by - ay);
        const u = ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / (l * l);
        if (u >= -1e-6 && u <= 1 + 1e-6 && Math.abs((x - ax) * (by - ay) - (y - ay) * (bx - ax)) / l < 0.5) return cum[i - 1] + u * l;
      }
      return 0;
    };
    const parts = {
      cell: [0, cum[1]],
      lamp: [sAt(xm - lampR, y0), sAt(xm + lampR, y0)],
      res: [sAt(x1, ym - resL / 2), sAt(x1, ym + resL / 2)],
    };
    const amm = [[x0 + (x1 - x0) * 0.2, y0], [x0 + (x1 - x0) * 0.8, y1]];
    const graph = phone ? { x0: 34, x1: W - 14, y0: y1 + fs * 5.6, y1: capTop - fs * 2.6 }
      : { x0: W * 0.62, x1: W * 0.96, y0: y0 + fs * 1.2, y1: capTop - fs * 3.6 };
    L = { W, H, phone, capFs, capTop, fs, x0, x1, y0, y1, ym, xm, gap, lampR, resL, resW, swL, ammR, pts, cum, P, parts, amm, graph };
  }
  const posAt = (s0) => {                               // distance along the path → screen point
    const { pts, cum, P } = L; const sv = ((s0 % P) + P) % P;
    for (let i = 1; i < pts.length; i++) if (sv <= cum[i]) {
      const u = (sv - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)];
    }
    return pts[0];
  };
  // the potential (V) at a distance along the path, taking the cell's negative terminal as 0 V
  const vAt = (s0) => {
    const { P, parts } = L; const sv = ((s0 % P) + P) % P;
    if (sv <= parts.cell[1]) return EMF * sv / parts.cell[1];
    if (sv < parts.lamp[0]) return EMF;
    if (sv <= parts.lamp[1]) return EMF - V_LAMP * (sv - parts.lamp[0]) / (parts.lamp[1] - parts.lamp[0]);
    if (sv < parts.res[0]) return EMF - V_LAMP;
    if (sv <= parts.res[1]) return EMF - V_LAMP - V_RES * (sv - parts.res[0]) / (parts.res[1] - parts.res[0]);
    return 0;
  };
  const NQ = 40;
  const travel = (t) => Math.max(0, t - T_CLOSE) * L.P / LAP;      // every charge moves the same distance
  const chargeS = (i, t) => i * L.P / NQ + travel(t);

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
  // a label on a dark backing, so a meter lead crossing behind it doesn't hide it
  const tag = (s, lines, x, y, a, rgb, size, weight = 400, align = 'center') => {
    if (a <= 0) return;
    if (typeof lines === 'string') lines = [lines];
    const { g } = s; g.font = D.sans(size, weight);
    const w = Math.max(...lines.map((l) => g.measureText(l).width)) + size * 0.7, h = size * 1.3 * lines.length + size * 0.25;
    const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w + size * 0.35 : x - size * 0.35;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(6,8,18,${0.88 * a})`;
    g.beginPath(); g.roundRect(x0, y - size * 0.75, w, h, 4); g.fill();
    D.text(s, lines, x, y, size, a, D.sans(size, weight), rgb, align);
  };

  const WIRE = '200,208,232', LAMPC = '255,214,102', HEAT = '255,140,90', VM = '150,140,255', AM = '111,211,154';

  // ---------- the circuit ----------
  function drawCircuit(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { x0, x1, y0, y1, ym, xm, gap, lampR, resL, resW, swL, ammR, fs, phone, amm } = L;
    const on = smooth((t - T_CLOSE) / 0.3);
    const wl = (ax, ay, bx, by) => D.line(s, ax, ay, bx, by, WIRE, 0.85 * a, 2.2);
    // wires, leaving gaps for the components
    wl(x0, ym - gap / 2, x0, y0); wl(x0, y0, xm - lampR, y0); wl(xm + lampR, y0, x1, y0);
    wl(x1, y0, x1, ym - resL / 2); wl(x1, ym + resL / 2, x1, y1);
    wl(x1, y1, xm + swL / 2, y1); wl(xm - swL / 2, y1, x0, y1); wl(x0, y1, x0, ym + gap / 2);
    // the cell (data-booklet symbol): long thin plate = +, short thick plate = −
    g.globalCompositeOperation = 'source-over'; g.strokeStyle = `rgba(${WIRE},${a})`;
    g.lineWidth = 2; g.beginPath(); g.moveTo(x0 - fs * 1.5, ym - gap / 2); g.lineTo(x0 + fs * 1.5, ym - gap / 2); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.moveTo(x0 - fs * 0.8, ym + gap / 2); g.lineTo(x0 + fs * 0.8, ym + gap / 2); g.stroke();
    label(s, '+', x0 + fs * 2.2, ym - gap / 2 - fs * 0.5, 0.8 * a, C.text, 'center', fs + 1, 600);
    label(s, '−', x0 + fs * 1.6, ym + gap / 2 + fs * 0.6, 0.8 * a, C.text, 'center', fs + 1, 600);
    label(s, 'ideal cell', x0 + fs * 2.4, ym + fs * 0.1, 0.8 * a, C.muted, 'left', fs);
    // the lamp: a circle with a cross, glowing once current flows (2.0 W)
    if (on > 0) {
      D.glowDot(s, xm, y0, lampR * 4.2, LAMPC, 0.7 * on * a);
      for (let k = 0; k < 8; k++) {
        const an = k * Math.PI / 4 + 0.39, r1 = lampR * 1.45, r2 = lampR * (1.9 + 0.15 * Math.sin(t * 3 + k));
        if (Math.sin(an) > 0.3) continue;                // rays upward and sideways only (the wire runs below)
        D.line(s, xm + r1 * Math.cos(an), y0 + r1 * Math.sin(an), xm + r2 * Math.cos(an), y0 + r2 * Math.sin(an), LAMPC, 0.7 * on * a, 1.6);
      }
    }
    g.fillStyle = `rgba(8,10,22,${a})`; g.beginPath(); g.arc(xm, y0, lampR, 0, 7); g.fill();
    g.strokeStyle = `rgba(${WIRE},${a})`; g.lineWidth = 2; g.stroke();
    const d = lampR * 0.7;
    g.beginPath(); g.moveTo(xm - d, y0 - d); g.lineTo(xm + d, y0 + d); g.moveTo(xm + d, y0 - d); g.lineTo(xm - d, y0 + d); g.stroke();
    label(s, 'lamp', xm, y0 + lampR + fs * 1.0, 0.8 * a, C.muted, 'center', fs);
    // the resistor: a rectangle, faintly warm once current flows (1.0 W)
    if (on > 0) D.glowDot(s, x1, ym, resL * 0.75, HEAT, 0.35 * on * a);
    g.fillStyle = `rgba(8,10,22,${a})`; g.fillRect(x1 - resW / 2, ym - resL / 2, resW, resL);
    g.strokeStyle = `rgba(${WIRE},${a})`; g.lineWidth = 2; g.strokeRect(x1 - resW / 2, ym - resL / 2, resW, resL);
    label(s, 'resistor', x1 - resW / 2 - fs * 0.5, ym, 0.8 * a, C.muted, 'right', fs);
    // the switch: open, then closed
    const ang = lerp(-0.55, 0, on);
    g.lineWidth = 2.2; g.strokeStyle = `rgba(${WIRE},${a})`;
    g.beginPath(); g.moveTo(xm - swL / 2, y1); g.lineTo(xm - swL / 2 + swL * Math.cos(ang), y1 + swL * Math.sin(ang)); g.stroke();
    g.fillStyle = `rgba(${WIRE},${a})`;
    g.beginPath(); g.arc(xm - swL / 2, y1, 2.6, 0, 7); g.fill(); g.beginPath(); g.arc(xm + swL / 2, y1, 2.6, 0, 7); g.fill();
    label(s, on > 0.5 ? 'switch (closed)' : 'switch (open)', xm, y1 + fs * 1.2, 0.8 * a, C.muted, 'center', fs);
    // the charges: positive, every one moving the same distance (the same current everywhere)
    const tr = travel(t);
    for (let i = 0; i < NQ; i++) {
      const [px, py] = posAt(i * L.P / NQ + tr);
      const me = i === 0, la = me ? a * fade(t, at(K_GRAPH) - 0.4, END, 0.6, 0.8) : 0;
      D.glowDot(s, px, py, fs * (me ? 1.5 : 0.75), me && la > 0 ? C.light : C.pos, (me ? Math.max(0.8, la) : 0.8) * a);
      if (la > 0) { D.glowDot(s, px, py, fs * 2.2, C.light, 0.6 * la); }
    }
    // the ammeters (in series), reading the same
    const aA = a * fade(t, at(K_AMM), END, 0.8, 0.8);
    if (aA > 0) {
      for (const [ax, ay] of amm) {
        g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(8,10,22,${aA})`;
        g.beginPath(); g.arc(ax, ay, ammR, 0, 7); g.fill(); g.strokeStyle = `rgba(${AM},${aA})`; g.lineWidth = 2; g.stroke();
        label(s, 'A', ax, ay + 0.5, aA, AM, 'center', fs, 700);
        label(s, `${I.toFixed(2)}${NB}A`, ax, ay + (ay < ym ? -1 : 1) * (ammR + fs * 0.9), aA, AM, 'center', fs + 1, 600);
      }
    }
    // the voltmeters (across each component), with their readings
    const vm = (ax, ay, bx, by, cx, cy, read, a2, side) => {
      if (a2 <= 0) return;
      D.line(s, ax, ay, side === 'up' ? ax : cx, side === 'up' ? cy : ay, VM, 0.75 * a2, 1.4);
      D.line(s, bx, by, side === 'up' ? bx : cx, side === 'up' ? cy : by, VM, 0.75 * a2, 1.4);
      if (side === 'up') { D.line(s, ax, cy, cx - ammR, cy, VM, 0.75 * a2, 1.4); D.line(s, bx, cy, cx + ammR, cy, VM, 0.75 * a2, 1.4); }
      else { D.line(s, cx, ay, cx, cy - ammR, VM, 0.75 * a2, 1.4); D.line(s, cx, by, cx, cy + ammR, VM, 0.75 * a2, 1.4); }
      g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(8,10,22,${a2})`;
      g.beginPath(); g.arc(cx, cy, ammR, 0, 7); g.fill(); g.strokeStyle = `rgba(${VM},${a2})`; g.lineWidth = 2; g.stroke();
      label(s, 'V', cx, cy + 0.5, a2, VM, 'center', fs, 700);
      g.fillStyle = `rgba(${VM},${a2})`;
      for (const [px, py] of [[ax, ay], [bx, by]]) { g.beginPath(); g.arc(px, py, 2.8, 0, 7); g.fill(); }
      // the reading: beside the lamp's voltmeter; above (phones) or below (wider screens) the side ones
      if (side === 'up') tag(s, read, cx + ammR + fs * 0.6, cy, a2, VM, fs + 2, 700, 'left');
      else tag(s, read, cx, cy + (phone ? -1 : 1) * (ammR + fs * 1.0), a2, VM, fs + (phone ? 1 : 2), 700);
    };
    const vA = (k) => a * fade(t, at(k), END, 0.8, 0.8);
    const off = phone ? Math.min(x0 - 14, fs * 3.6) : Math.min(x0 * 0.62, fs * 5.5);
    vm(xm - lampR * 2.2, y0, xm + lampR * 2.2, y0, xm, y0 - (phone ? 30 : fs * 3.3), `${V_LAMP.toFixed(1)}${NB}V`, vA(K_VLAMP), 'up');
    vm(x1, ym - resL * 0.8, x1, ym + resL * 0.8, x1 + off, ym, `${V_RES.toFixed(1)}${NB}V`, vA(K_VRES), 'right');
    vm(x0, ym - gap * 2.4, x0, ym + gap * 2.4, x0 - off, ym, `${EMF.toFixed(1)}${NB}V`, vA(K_VCELL), 'left');
    // the energy, per coulomb, next to each component as its voltmeter appears
    const eL = vA(K_VLAMP) * (1 - fade(t, at(K_GRAPH), END, 0.6, 0.6) * 0.4);
    if (!phone) {
      label(s, `4.0${NB}J per coulomb → light and thermal energy`, xm, y0 - fs * 5.0, 0.85 * eL, LAMPC, 'center', fs - 1);
      tag(s, [`2.0${NB}J per C`, '→ thermal energy'], x1 + off, ym + ammR + fs * 2.5, 0.9 * vA(K_VRES), HEAT, fs - 1);
      tag(s, ['chemical energy →', `6.0${NB}J per C`], x0 - off, ym + ammR + fs * 2.5, 0.9 * vA(K_VCELL), '140,220,180', fs - 1);
    }
    // "no charge used up": a count of the charges going in and coming out of the lamp, per second
    const nA = a * fade(t, at(K_NO), at(K_NO + 2), 0.6, 0.6);
    if (nA > 0) {
      if (phone) D.text(s, [`in: 0.50${NB}C each second`, `out: 0.50${NB}C each second`], xm, y0 + fs * 3.1, fs, nA, D.sans(fs, 600), C.pos);
      else {
        label(s, `in: 0.50${NB}C each second`, xm - lampR - fs * 0.6, y0 + fs * 2.4, nA, C.pos, 'right', fs, 600);
        label(s, `out: 0.50${NB}C each second`, xm + lampR + fs * 0.6, y0 + fs * 2.4, nA, C.pos, 'left', fs, 600);
      }
    }
    const sp = a * fade(t, T_CLOSE + 0.5, at(K_GRAPH), 1, 1) + a * fade(t, at(K_DRIFT), until(K_DRIFT), 0.6, 0.6);
    label(s, 'charge motion speeded up', phone ? L.W / 2 : xm, y1 + fs * 2.5, 0.55 * Math.min(1, sp), C.muted, 'center', fs - 1);
  }

  // ---------- the graph of potential round the circuit ----------
  function drawGraph(s, t, a) {
    if (a <= 0) return;
    const { g } = s, { graph: b, fs, P, parts, phone } = L;
    const X = (sv) => b.x0 + sv / P * (b.x1 - b.x0), Y = (v) => b.y1 - v / 7 * (b.y1 - b.y0);
    g.globalCompositeOperation = 'source-over';
    // shaded bands for the components
    for (const [k, nm, rgb] of [['cell', 'cell', '140,220,180'], ['lamp', 'lamp', LAMPC], ['res', phone ? 'resistor' : 'resistor', HEAT]]) {
      const [s0, s1] = parts[k]; g.fillStyle = `rgba(${rgb},${0.12 * a})`; g.fillRect(X(s0), b.y0, Math.max(2, X(s1) - X(s0)), b.y1 - b.y0);
      label(s, nm, (X(s0) + X(s1)) / 2, b.y1 + fs * 0.95, 0.8 * a, rgb, 'center', fs - 1, 600);
    }
    D.line(s, b.x0, b.y1, b.x1, b.y1, C.muted, 0.6 * a, 1.2);
    D.line(s, b.x0, b.y1, b.x0, b.y0, C.muted, 0.6 * a, 1.2);
    for (const v of [0, 2, 4, 6]) { D.line(s, b.x0 - 4, Y(v), b.x0, Y(v), C.muted, 0.7 * a, 1); label(s, String(v), b.x0 - 7, Y(v), 0.75 * a, C.muted, 'right', fs - 1); }
    label(s, 'potential / V', b.x0, b.y0 - fs * 0.9, 0.8 * a, C.muted, 'left', fs - 1);
    label(s, 'position round the circuit →', b.x1, b.y1 + fs * 2.1, 0.7 * a, C.muted, 'right', fs - 1);
    const pts = []; for (let i = 0; i <= 400; i++) { const sv = P * i / 400; pts.push([X(sv), Y(vAt(sv))]); }
    D.glowLine(s, pts, VM, a, 2);
    label(s, 'a graph, not a real hill', b.x1, b.y0 + fs * 0.2, 0.6 * a * fade(t, at(K_GRAPH + 1), END, 0.8, 0.8), C.muted, 'right', fs - 1);
    // the step sizes
    const stA = a * fade(t, at(K_GRAPH) + 1.5, END, 0.8, 0.8);
    if (stA > 0) {
      label(s, '+6.0 V', X(parts.cell[1]) + fs * 0.4, Y(3), stA, '140,220,180', 'left', fs, 600);
      label(s, '−4.0 V', X(parts.lamp[1]) + fs * 0.4, Y(4.2), stA, LAMPC, 'left', fs, 600);
      label(s, '−2.0 V', X(parts.res[1]) + fs * 0.4, Y(1.2), stA, HEAT, 'left', fs, 600);
    }
    // the highlighted charge's place on the graph
    const sv = ((chargeS(0, t) % P) + P) % P, v = vAt(sv);
    D.glowDot(s, X(sv), Y(v), fs * 1.5, C.light, a);
    label(s, `${v.toFixed(1)}${NB}V`, X(sv), Y(v) - fs * 1.2, 0.9 * a, C.light, 'center', fs, 600);
  }

  // the power in the lamp, as a small readout
  function drawPower(s, t, a) {
    if (a <= 0) return;
    const { fs, y0, phone, W, graph } = L;
    rich(s, [['P', 'i'], [' = ', 'r'], ['IV', 'i'], [` = 0.50${NB}×${NB}4.0 = 2.0${NB}W`, 'sans']], phone ? W * 0.62 : W * 0.86, phone ? graph.y0 - fs * 1.9 : y0 - fs * 2.2, fs + 2, a, LAMPC, 'center');
  }

  function endCard(s, t) {
    const a = fade(t, END, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 40, 15, 26)), s3 = Math.round(clamp(W / 60, 12, 17));
    g.font = D.sans(s1, 300);
    const head = D.wrap(s, 'What is voltage?', W - 48);
    let y = H * (phone ? 0.12 : 0.18);
    D.text(s, head, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * head.length + s2 * 0.6;
    const items = [
      [[['V', 'i'], [' = ', 'r'], ['W', 'i'], [' ÷ ', 'r'], ['q', 'i']], VM, 'Potential difference is the energy transferred per unit charge between two points: 1 V = 1 J C⁻¹.'],
      [[['ε', 'i'], [' = 6.0 = 4.0 + 2.0', 'r']], '140,220,180', 'In a series circuit the current is the same everywhere, and the p.d.s add up to the emf.'],
      [[['P', 'i'], [' = ', 'r'], ['IV', 'i']], LAMPC, 'Charge is not used up. What a component takes is energy: here 2.0 J every second in the lamp.'],
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
    D.text(s, D.wrap(s, 'An ideal cell (internal resistance negligible). Positive charges show the conventional current; their motion is speeded up enormously.', Math.min(W - 40, 760)), W / 2, H * 0.84, s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('voltage', {
    duration: DURATION,
    poster: at(K_GRAPH) + 4,
    // score: a steady current (G, a soft sine pad, a low drone, a gentle tremolo, a breath of wind)
    music: { chords: [[43, 50, 55, 59, 62], [40, 47, 52, 55, 59], [45, 52, 57, 60, 64], [38, 45, 50, 54, 57]], bar: 8, pad: 'sine', cutoff: 850, drone: 0.1, tremolo: 0.18, wind: 0.2, shimmer: 0.15, volume: 0.38 },
    resize: layout,
    info: {
      CAPS, DURATION,
      check() {
        const out = { I, V_LAMP, V_RES, sum: V_LAMP + V_RES, P_LAMP: I * V_LAMP, P_RES: I * V_RES, P_CELL: EMF * I,
          drift: 0.50 / (8.5e28 * 0.50e-6 * 1.60e-19), closeAt: T_CLOSE };
        out.reading = CAPS.map(([a, b, txt]) => +(txt.length / (b - a - 0.6)).toFixed(1));
        return out;
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.2);
      drawCircuit(s, t, fade(t, 0, END + 0.6, 0.1, 0.8));
      drawGraph(s, t, fade(t, at(K_GRAPH), END + 0.6, 0.9, 0.8));
      drawPower(s, t, fade(t, at(K_POWER), END + 0.6, 0.8, 0.8));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'What is voltage?', 'Energy, charge and the volt');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
