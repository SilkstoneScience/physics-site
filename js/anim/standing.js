/* C.4 Standing waves on strings and in pipes. Three parts:
   1. Two identical waves travelling in opposite directions, y₁ = A sin(kx − ωt) and y₂ = A sin(kx + ωt), add to
      y = 2A sin(kx) cos(ωt): nodes, antinodes, the envelope, phase between and across nodes, no net energy transfer.
   2. A string fixed at both ends (node–node): shape sin(nπx/L) cos(2πf_n t), n = 1, 2, 3.
   3. Pipes, with layers of air moving along the pipe (longitudinal) and the displacement-amplitude graph over them:
      open at both ends (antinode–antinode): displacement ∝ cos(nπx/L), n = 1, 2;
      closed at one end (node at x = 0, antinode at x = L): displacement ∝ sin(nπx/2L), n = 1, 3, 5.
   Numbers (all recalculated in `info.check()`):
   String: L = 0.80 m, v = 192 m s⁻¹. λ₁ = 2L = 1.60 m, f₁ = 192/1.60 = 120 Hz; λ₂ = L = 0.80 m, f₂ = 240 Hz;
     λ₃ = 2L/3 = 0.533 m, f₃ = 192/0.5333 = 360 Hz = 3 × 120 Hz.
   Pipes: L = 0.68 m, v = 340 m s⁻¹. Open: λ₁ = 2L = 1.36 m, f₁ = 340/1.36 = 250 Hz; λ₂ = L = 0.68 m, f₂ = 500 Hz.
     Closed at one end: λ₁ = 4L = 2.72 m, f₁ = 340/2.72 = 125 Hz; λ₃ = 4L/3 = 0.907 m, f₃ = 375 Hz = 3 × 125 Hz;
     λ₅ = 4L/5 = 0.544 m, f₅ = 625 Hz. 125 Hz is half of 250 Hz.
   Slowed down: the string 240 times (120 Hz shown as 0.5 vibrations per second), the pipes 600 times
   (125 Hz shown as one vibration every 4.8 s). Part 1 has no real frequency: one cycle every 3.0 s. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- the physics ----------
  const LS = 0.80, VS = 192, SLOW_S = 240;                   // string: length (m), wave speed (m s⁻¹), slow-down factor
  const LP = 0.68, VP = 340, SLOW_P = 600;                   // pipes
  const lamS = (n) => 2 * LS / n, fS = (n) => VS / lamS(n);
  const lamO = (n) => 2 * LP / n, fO = (n) => VP / lamO(n);   // open at both ends
  const lamC = (n) => 4 * LP / n, fC = (n) => VP / lamC(n);   // closed at one end (n odd)
  const T1 = 3.0, W1 = 2 * Math.PI / T1;                     // part 1: one cycle every 3.0 s on screen
  // the shapes, u = x / L from 0 to 1 (for the closed pipe, u = 0 is the closed end)
  const shapeS = (n, u) => Math.sin(n * Math.PI * u);
  const shapeO = (n, u) => Math.cos(n * Math.PI * u);
  const shapeC = (n, u) => Math.sin(n * Math.PI * u / 2);
  const fmtL = (v) => (Math.abs(v * 100 - Math.round(v * 100)) < 1e-9 ? v.toFixed(2) : v.toPrecision(3));
  const fmtF = (v) => String(Math.round(v));
  const ORD = { 1: '1st', 2: '2nd', 3: '3rd', 5: '5th' };

  // ---------- timeline (scene seconds) ----------
  const P1_END = 45.2, P2_A = 45.2, P2_END = 80.8, P3_A = 80.8, END_CARD = 142.0, DURATION = 155;
  const STRING_ON = [50.4, 60.4, 65.4];                      // when each harmonic appears on the string
  const OPEN_ON = 80.8, OPEN_MODES = [[83.0, 1], [101.0, 2], [136.6, 1]];
  const CLOSED_ON = 106.0, CLOSED_MODES = [[108.0, 1], [121.6, 3], [131.6, 5], [136.6, 1]];
  // which mode a pipe is in, and how big its oscillation is (it dips to zero while the mode changes)
  const modeAt = (list, t) => {
    if (t < list[0][0]) return { n: list[0][1], amp: 0, since: list[0][0] };
    let i = 0; while (i + 1 < list.length && t >= list[i + 1][0]) i++;
    let amp = i === 0 ? smooth((t - list[0][0]) / 1.2) : smooth((t - list[i][0]) / 0.6);
    if (i + 1 < list.length) amp = Math.min(amp, smooth((list[i + 1][0] - t) / 0.6));
    return { n: list[i][1], amp, since: list[i][0] };
  };

  // ---------- captions ----------
  const CAPS = [
    [4.8, 9.6, 'A wave travels to the right. An identical wave (same frequency, wavelength and amplitude) travels to the left.'],
    [9.8, 14.6, 'Where they meet, they superpose: at every point, the two displacements add.'],
    [14.8, 19.8, 'The result doesn\'t travel. It grows, shrinks and flips in the same place: a standing wave.'],
    [20.0, 24.8, 'Nodes (N) never move: there the two waves always cancel. Antinodes (A) oscillate with the largest amplitude.'],
    [25.0, 29.8, 'Neighbouring nodes are half a wavelength apart. From a node to the next antinode is a quarter of a wavelength.'],
    [30.0, 34.8, 'P and Q are in the same loop. Their amplitudes are different, but they move up and down together: in phase.'],
    [35.0, 39.8, 'R is in the next loop, across a node. It always moves the opposite way to P: in antiphase (π apart).'],
    [40.0, 44.6, 'No net energy is transferred: the two waves carry equal energy in opposite directions.'],
    [45.6, 50.2, 'A string 0.80 m long, fixed at both ends. Waves travel along it at 192 m s⁻¹.'],
    [50.4, 55.2, 'A fixed end can\'t move, so it must be a node. The simplest pattern has one loop: L = λ/2.'],
    [55.4, 60.2, '1st harmonic: λ = 2L = 1.60 m, so f = v/λ = 192 ÷ 1.60 = 120 Hz.'],
    [60.4, 65.2, 'The same string, drawn again in its 2nd harmonic: two loops, so L = λ. Then λ = 0.80 m and f = 192 ÷ 0.80 = 240 Hz.'],
    [65.4, 70.2, '3rd harmonic: L = 3λ/2, so λ = 0.533 m and f = 360 Hz, three times the 1st harmonic.'],
    [70.4, 75.4, 'A whole number of half-wavelengths fits between the ends: λₙ = 2L/n, and fₙ = n f₁. All harmonics are possible.'],
    [75.6, 80.4, 'Slowed down 240 times: the real string vibrates 120 times a second in its 1st harmonic.'],
    [81.2, 86.0, 'Sound in a pipe: layers of air move back and forth along the pipe. It is a longitudinal wave.'],
    [86.2, 91.0, 'At an open end the air moves in and out freely: an open end is a displacement antinode.'],
    [91.2, 96.0, 'The violet curves are a graph of displacement amplitude (how far the air at each point moves from rest), not a shape.'],
    [96.2, 101.0, 'Open at both ends, 0.68 m long; sound travels at 340 m s⁻¹. 1st harmonic: λ = 2L = 1.36 m, f = 250 Hz.'],
    [101.2, 105.8, '2nd harmonic: L = λ, so λ = 0.68 m and f = 500 Hz. As on the string, all harmonics are possible.'],
    [106.0, 110.8, 'Now a pipe of the same length, closed at one end. The air at a closed end can\'t move: it is a displacement node.'],
    [111.0, 115.8, 'Node at the closed end, antinode at the open end: L = λ/4. So λ = 2.72 m and f = 125 Hz.'],
    [116.0, 121.4, 'Predict (pause to think): what is the next pattern that fits? What is its frequency, and which harmonic is it?'],
    [121.6, 126.4, 'L = 3λ/4, so λ = 0.907 m and f = 375 Hz. That is 3 × 125 Hz, so it is the 3rd harmonic.'],
    [126.6, 131.4, 'There is no 2nd harmonic. The harmonic number says how many times the 1st harmonic\'s frequency it is.'],
    [131.6, 136.4, 'Next, L = 5λ/4: λ = 0.544 m and f = 625 Hz, the 5th harmonic. Only odd harmonics are possible.'],
    [136.6, 141.6, 'Closing one end halves the lowest frequency: 125 Hz instead of 250 Hz. (The pipes are slowed down 600 times.)'],
  ];

  // ---------- colours ----------
  const R_RGB = C.vel, L_RGB = C.force, SUM = C.light, ENV = C.field, WALL = '150,165,230', AIR = '175,195,240', MOVE = C.good;

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = W < 520;
    const capFs = clamp(W / 44, 15, 25), capTop = H - capFs * (phone ? 6.6 : 5.4);
    const fs = phone ? 10 : Math.round(clamp(W / 80, 11, 16));
    const top = phone ? 6 : Math.max(52, H * 0.1);
    // part 1: the two waves and their sum
    const loops = phone ? 3 : 5, x0 = W * 0.06, x1 = W * 0.94, half = (x1 - x0) / loops;
    // wide screens: start below the four-line legend; above the axis sit 2A, the A labels and the λ/4 bracket (3.8 fs),
    // below it 2A, the N labels and the energy arrows (5.2 fs)
    const topP1 = 22 + 4 * 1.7 * Math.round(clamp(W / 80, 11, 14));   // the legend: rows 1.7 × its text size apart, from y = 18
    const A1 = phone ? Math.min((capTop - top) * 0.13, half * 0.55) : clamp((capTop - topP1 - 9 * fs) / 4, 8, half * 0.55);
    const yc = phone ? top + (capTop - top) * 0.46 : topP1 + 2 * A1 + 3.8 * fs + Math.max(0, (capTop - topP1 - 9 * fs - 4 * A1) / 2);
    // part 2: three strings
    const head = phone ? fs * 1.6 : 0;
    const a0 = top + head, a1 = capTop - fs * 1.2, rowH = (a1 - a0) / 3;
    const sx0 = phone ? W * 0.07 : W * 0.07, sx1 = phone ? W * 0.93 : W * 0.6;
    const sAmp = phone ? clamp((rowH - fs * 5.2) / 2, 6, 30) : Math.min(rowH * 0.3, (sx1 - sx0) * 0.08);
    const sRowY = (r) => (phone ? a0 + rowH * r + fs * 2.7 + sAmp : a0 + rowH * (r + 0.5));
    // part 3: two pipes
    const pRowH = (a1 - a0) / 2;
    const px0 = phone ? W * 0.07 : W * 0.1, px1 = phone ? W * 0.93 : W * 0.76;
    const hp = phone ? clamp(pRowH - fs * 5.0, 24, 80) : clamp(pRowH - fs * 4.4, 30, Math.min(170, H * 0.2));
    const pY = (r) => a0 + pRowH * r + fs * (phone ? 3.0 : 2.4) + hp / 2;   // centre line of pipe r
    L = { W, H, phone, fs, capTop, top, loops, x0, x1, half, yc, A1, head, a0, a1, rowH, sx0, sx1, sAmp, sRowY,
      pRowH, px0, px1, hp, pY };
  }

  // text made of pieces: [text, style], style 'i' italic serif, 'r' upright serif, 's' small upright subscript, 'b' bold sans, 'sans'
  function rich(s, parts, x, y, size, a, rgb = C.text, align = 'center') {
    const { g } = s; if (a <= 0) return 0;
    const font = (st) => st === 's' ? D.sans(Math.round(size * 0.7)) : st === 'i' ? D.serif(size) : st === 'r' ? D.serif(size, false)
      : st === 'b' ? D.sans(Math.round(size * 0.9), 600) : D.sans(Math.round(size * 0.9));
    const ws = parts.map(([tx, st]) => { g.font = font(st); return g.measureText(tx).width; });
    const total = ws.reduce((p, q) => p + q, 0);
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`;
    parts.forEach(([tx, st], i) => { g.font = font(st); g.fillText(tx, px, st === 's' ? y + size * 0.28 : y); px += ws[i]; });
    g.shadowBlur = 0;
    return total;
  }
  // "L = 3λ/2" for n half-wavelengths (q = 2) or n quarter-wavelengths (q = 4)
  const lengthParts = (n, q) => {
    const k = q === 2 && n === 2 ? '' : (n === 1 ? '' : String(n));
    const den = q === 2 && n === 2 ? '' : `/${q}`;
    return [['L', 'i'], [' = ', 'r'], [k, 'r'], ['λ', 'i'], [den, 'r']];
  };
  const curve = (f, xa, xb, steps = 160) => { const pts = []; for (let i = 0; i <= steps; i++) { const x = lerp(xa, xb, i / steps); pts.push([x, f(x)]); } return pts; };

  // ---------- part 1: two travelling waves make a standing wave ----------
  function part1(s, t) {
    const a = fade(t, 4.6, P1_END, 0.9, 0.8); if (a <= 0) return;
    const { x0, x1, half, yc, A1, fs, phone } = L, k = Math.PI / half, w = W1 * t, cw = Math.cos(w);
    const aR = smooth((t - 4.8) / 1.2), aL = smooth((t - 7.2) / 1.2), aS = smooth((t - 10.0) / 1.2);
    const dim = lerp(1, 0.4, smooth((t - 15.0) / 2.0));
    // the axis (where the string is at rest)
    D.line(s, x0, yc, x1, yc, C.muted, 0.25 * a, 1, [4, 5]);
    const env = smooth((t - 20.0) / 1.0) * a;
    if (env > 0) {                                                   // the envelope: ±2A|sin kx|
      D.glowLine(s, curve((x) => yc - 2 * A1 * Math.abs(Math.sin(k * (x - x0))), x0, x1, 240), ENV, 0.45 * env, 1);
      D.glowLine(s, curve((x) => yc + 2 * A1 * Math.abs(Math.sin(k * (x - x0))), x0, x1, 240), ENV, 0.45 * env, 1);
    }
    D.glowLine(s, curve((x) => yc - A1 * Math.sin(k * (x - x0) - w), x0, x1, 240), R_RGB, aR * dim * a, phone ? 1.2 : 1.5);
    D.glowLine(s, curve((x) => yc - A1 * Math.sin(k * (x - x0) + w), x0, x1, 240), L_RGB, aL * dim * a, phone ? 1.2 : 1.5);
    // direction labels on the two waves
    const lab = smooth((t - 5.6) / 0.8) * (1 - smooth((t - 15.0) / 1.5));
    D.text(s, 'travelling right →', x0 + half * 0.1, yc - 2 * A1 - fs * 1.6, fs + 1, aR * lab * a, D.sans(fs + 1, 600), R_RGB, 'left');
    D.text(s, '← travelling left', x1 - half * 0.1, yc - 2 * A1 - fs * 1.6, fs + 1, aL * lab * a, D.sans(fs + 1, 600), L_RGB, 'right');
    // the sum
    D.glowLine(s, curve((x) => yc - 2 * A1 * Math.sin(k * (x - x0)) * cw, x0, x1, 300), SUM, aS * a, phone ? 2 : 2.6);
    // nodes and antinodes
    if (env > 0) for (let i = 0; i <= L.loops; i++) {
      const xn = x0 + i * half;
      D.glowDot(s, xn, yc, phone ? 8 : 12, C.white, 0.8 * env);
      D.text(s, 'N', xn, yc + 2 * A1 + fs * 1.0, fs + 1, 0.9 * env, D.sans(fs + 1, 700), C.text);
      if (i < L.loops) D.text(s, 'A', xn + half / 2, yc - 2 * A1 - fs * 1.0, fs + 1, 0.9 * env, D.sans(fs + 1, 700), SUM);
    }
    // brackets: λ/2 between neighbouring nodes, λ/4 from a node to the next antinode
    const br = fade(t, 25.0, 30.2, 0.8, 0.8) * a;
    if (br > 0) {
      const yb = yc + 2 * A1 + fs * 2.6, xa = x0 + half, xb = x0 + 2 * half;
      D.line(s, xa, yb, xb, yb, C.text, 0.8 * br, 1.4); D.line(s, xa, yb - 5, xa, yb + 5, C.text, 0.8 * br, 1.4); D.line(s, xb, yb - 5, xb, yb + 5, C.text, 0.8 * br, 1.4);
      rich(s, [['λ', 'i'], ['/2', 'r']], (xa + xb) / 2, yb + fs * 1.1, fs + 3, br);
      const yq = yc - 2 * A1 - fs * 2.6, xc = x0 + 2 * half, xd = xc + half / 2;
      D.line(s, xc, yq, xd, yq, C.text, 0.8 * br, 1.4); D.line(s, xc, yq - 5, xc, yq + 5, C.text, 0.8 * br, 1.4); D.line(s, xd, yq - 5, xd, yq + 5, C.text, 0.8 * br, 1.4);
      rich(s, [['λ', 'i'], ['/4', 'r']], (xc + xd) / 2, yq - fs * 1.1, fs + 3, br);
    }
    // P and Q (same loop, in phase) and R (next loop, in antiphase)
    const pts = [['P', 1.5, fade(t, 30.0, 40.2, 0.8, 0.8)], ['Q', 1 + 1 / 6, fade(t, 30.0, 40.2, 0.8, 0.8)], ['R', 2.5, fade(t, 35.0, 40.2, 0.8, 0.8)]];
    for (const [name, loopsIn, al0] of pts) {
      const al = al0 * a; if (al <= 0) continue;
      const xp = x0 + loopsIn * half, amp = 2 * A1 * Math.sin(Math.PI * loopsIn), yp = yc - amp * cw;
      D.line(s, xp, yc - Math.abs(amp), xp, yc + Math.abs(amp), C.muted, 0.5 * al, 1);   // the range it moves over
      D.glowDot(s, xp, yp, phone ? 14 : 20, C.white, al);
      // displacement y = amp cos ωt (up is positive), so its velocity is −amp ω sin ωt; the arrow points up when that is positive
      const velUp = -amp * Math.sin(w);
      const len = Math.min(fs * 3.2, A1 * 0.9) * clamp(velUp / (2 * A1), -1, 1);
      D.arrow(s, xp + fs * 1.1, yp, xp + fs * 1.1, yp - len, MOVE, al * smooth(Math.abs(len) / 6), '', { head: 8, width: 2.2 });
      D.text(s, name, xp, yc + Math.abs(amp) + fs * 1.2, fs + 4, al, D.serif(fs + 4), C.text);
    }
    // energy: equal amounts each way
    const en = fade(t, 40.0, P1_END, 0.8, 0.6) * a;
    if (en > 0) {
      const ye = yc + 2 * A1 + fs * 3.0, xm = (x0 + x1) / 2, len = Math.min(half * 1.2, L.W * 0.18);
      D.arrow(s, xm - len * 1.1, ye, xm - len * 0.1, ye, R_RGB, en, '', { head: 10 });
      D.arrow(s, xm + len * 1.1, ye + fs * 1.6, xm + len * 0.1, ye + fs * 1.6, L_RGB, en, '', { head: 10 });
      D.text(s, 'energy', xm - len * 0.6, ye - fs * 0.9, fs, 0.85 * en, D.sans(fs), R_RGB);
      D.text(s, 'energy', xm + len * 0.6, ye + fs * 2.5, fs, 0.85 * en, D.sans(fs), L_RGB);
    }
    const items = [['line', R_RGB, 'wave travelling right'], ['line', L_RGB, 'identical wave travelling left'], ['line', SUM, 'their sum: the standing wave']];
    if (t >= 20.0) items.push(['line', ENV, 'envelope: the amplitude at each point']);
    D.legend(s, items, 0.9 * a * smooth((t - 10) / 1));
  }

  // ---------- part 2: a string fixed at both ends ----------
  function part2(s, t) {
    const a = fade(t, P2_A, P2_END, 0.8, 0.8); if (a <= 0) return;
    const { sx0, sx1, sAmp, fs, phone } = L, len = sx1 - sx0;
    // the header
    const hdr = phone ? 'L = 0.80 m, v = 192 m s⁻¹, slowed down 240 times' : 'A string fixed at both ends: L = 0.80 m, v = 192 m s⁻¹ (slowed down 240 times)';
    D.text(s, hdr, phone ? L.W / 2 : 16, phone ? L.top + fs * 0.6 : 22, fs + (phone ? 0 : 1), 0.75 * a, D.sans(fs + (phone ? 0 : 1)), C.muted, phone ? 'center' : 'left');
    for (let r = 0; r < 3; r++) {
      const n = r + 1, y = L.sRowY(r);
      const show = r === 0 ? smooth((t - P2_A - 0.2) / 0.8) : smooth((t - STRING_ON[r] + 0.6) / 0.8);
      const al = show * a; if (al <= 0) continue;
      const grow = smooth((t - STRING_ON[r]) / 1.2);
      const om = 2 * Math.PI * fS(n) / SLOW_S, c = Math.cos(om * (t - STRING_ON[r]));
      // the clamps at the two ends
      for (const xe of [sx0, sx1]) {
        s.g.fillStyle = `rgba(${WALL},${0.85 * al})`;
        s.g.fillRect(xe - (xe === sx0 ? 7 : 0), y - Math.max(sAmp, 14) * 0.9, 7, Math.max(sAmp, 14) * 1.8);
      }
      D.line(s, sx0, y, sx1, y, C.muted, 0.18 * al, 1, [4, 5]);
      D.glowLine(s, curve((x) => y - sAmp * grow * shapeS(n, (x - sx0) / len) * c, sx0, sx1, 200), SUM, al, phone ? 1.8 : 2.4);
      // the nodes
      for (let i = 0; i <= n; i++) {
        const xn = sx0 + len * i / n;
        D.text(s, 'N', xn, y + sAmp + fs * (phone ? 0.9 : 1.1), fs, 0.75 * al * grow, D.sans(fs, 700), C.text);
      }
      // the label
      const nums = smooth((t - (r === 0 ? 55.4 : STRING_ON[r])) / 0.8) * a;
      const p1 = [[`${ORD[n]} harmonic`, 'b'], ['   ', 'sans'], ...lengthParts(n, 2)];
      const p2 = [['λ', 'i'], [` = ${fmtL(lamS(n))} m    `, 'sans'], ['f', 'i'], [` = ${fmtF(fS(n))} Hz`, 'sans']];
      const lx = phone ? sx0 : sx1 + fs * 2.2, sz = phone ? fs + 2 : fs + 4;
      if (phone) {
        const ly = y - sAmp - fs * 2.3;
        rich(s, p1, lx, ly, sz, al * grow, C.text, 'left');
        rich(s, p2, sx1, ly, sz, nums * grow, SUM, 'right');
      } else {
        rich(s, p1, lx, y - fs * 0.9, sz, al * grow, C.text, 'left');
        rich(s, p2, lx, y + fs * 0.9, sz, nums * grow, SUM, 'left');
      }
    }
    // L, shown on the first string before the others appear
    const dim = fade(t, P2_A + 0.6, STRING_ON[1] - 0.4, 0.8, 0.8) * a;
    if (dim > 0) {
      const y = L.sRowY(0) + sAmp + fs * (phone ? 2.4 : 2.8);
      s.g.font = D.sans(fs + 2); const gap = s.g.measureText('L = 0.80 m').width / 2 + fs * 0.8;
      D.arrow(s, (sx0 + sx1) / 2 - gap, y, sx0 + 2, y, C.muted, dim, '', { head: 8, width: 1.4, blur: 0 });
      D.arrow(s, (sx0 + sx1) / 2 + gap, y, sx1 - 2, y, C.muted, dim, '', { head: 8, width: 1.4, blur: 0 });
      rich(s, [['L', 'i'], [' = 0.80 m', 'sans']], (sx0 + sx1) / 2, y, fs + 2, dim, C.muted);
    }
  }

  // ---------- part 3: pipes ----------
  const NL_DESK = 70, PER_LAYER = 5;
  let seed = 4113;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const DOTS = Array.from({ length: NL_DESK }, () => Array.from({ length: PER_LAYER }, (_, j) => [(j + 0.15 + 0.7 * rnd()) / PER_LAYER, rnd() - 0.5]));

  function pipe(s, t, r, closed, a) {
    if (a <= 0) return;
    const { g } = s, { px0, px1, hp, fs, phone } = L, len = px1 - px0, yc = L.pY(r), y0 = yc - hp / 2, y1 = yc + hp / 2;
    const { n, amp, since } = modeAt(closed ? CLOSED_MODES : OPEN_MODES, t);
    const f = closed ? fC(n) : fO(n), om = 2 * Math.PI * f / SLOW_P, c = Math.cos(om * (t - since));
    const shape = (u) => (closed ? shapeC(n, u) : shapeO(n, u));
    const xiMax = len * (phone ? 0.035 : 0.028);
    // the walls (a closed end is a thick wall on the left)
    g.fillStyle = `rgba(${WALL},${0.12 * a})`; g.fillRect(px0, y0, len, hp);
    D.line(s, px0, y0, px1, y0, WALL, 0.8 * a, 2); D.line(s, px0, y1, px1, y1, WALL, 0.8 * a, 2);
    if (closed) { g.fillStyle = `rgba(${WALL},${0.95 * a})`; g.fillRect(px0 - 6, y0 - 1, 6, hp + 2); }
    // the layers of air: each moves along the pipe by ξ = ξmax · shape · cos ωt
    const NL = clamp(Math.round(len / (phone ? 9 : 14)), 24, NL_DESK), dr = Math.max(1.4, Math.min(hp * 0.035, len / NL * 0.22));
    g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(${AIR},${0.8 * a})`;
    for (let i = 0; i < NL; i++) {
      const u = (i + 0.5) / NL, xi = xiMax * amp * shape(u) * c, x = px0 + u * len + xi;
      for (const [fy, jx] of DOTS[i]) { g.beginPath(); g.arc(x + jx * len / NL * 0.5, y0 + 3 + fy * (hp - 6), dr, 0, 7); g.fill(); }
    }
    // the graph of displacement amplitude over the pipe
    const env = smooth((t - (closed ? CLOSED_ON + 0.4 : 91.0)) / 1.0) * a * amp;
    if (env > 0) {
      const h = hp * 0.42;
      D.glowLine(s, curve((x) => yc - h * Math.abs(shape((x - px0) / len)), px0, px1, 200), ENV, 0.6 * env, phone ? 1.1 : 1.4);
      D.glowLine(s, curve((x) => yc + h * Math.abs(shape((x - px0) / len)), px0, px1, 200), ENV, 0.6 * env, phone ? 1.1 : 1.4);
      if (!phone && r === 0) D.text(s, ['graph of', 'displacement', 'amplitude'], px1 + fs * 1.2, yc - fs * 1.3, fs, 0.8 * env, D.sans(fs), ENV, 'left');
    }
    // nodes and antinodes, below the pipe
    const na = smooth((t - (closed ? CLOSED_ON + 0.8 : 86.2)) / 0.8) * a * amp;
    if (na > 0) {
      const marks = [];
      if (closed) for (let j = 0; j <= n; j++) marks.push([j / n, j % 2 ? 'A' : 'N']);
      else for (let j = 0; j <= 2 * n; j++) marks.push([j / (2 * n), j % 2 ? 'N' : 'A']);
      for (const [u, m] of marks) D.text(s, m, px0 + u * len, y1 + fs * 1.0, fs + 1, 0.9 * na, D.sans(fs + 1, 700), m === 'A' ? SUM : C.text);
    }
    // labels above the pipe: the kind of pipe, then the harmonic
    const ty = y0 - fs * (phone ? 2.1 : 1.0);
    D.text(s, closed ? 'closed at one end' : 'open at both ends', px0, ty, fs + (phone ? 1 : 2), a, D.sans(fs + (phone ? 1 : 2), 600), C.text, 'left');
    const ml = smooth((t - (closed ? 111.0 : 96.2)) / 0.8) * a * amp;
    if (ml > 0) {
      const parts = [[`${ORD[n]} harmonic`, 'b'], ['   ', 'sans'], ...lengthParts(n, closed ? 4 : 2), ['    ', 'sans'], ['f', 'i'], [` = ${fmtF(f)} Hz`, 'sans']];
      if (phone) rich(s, parts, px0, y0 - fs * 0.85, fs + 2, ml, SUM, 'left');
      else rich(s, parts, px1, ty, fs + 4, ml, SUM, 'right');
    }
  }
  function part3(s, t) {
    const a = fade(t, P3_A, END_CARD + 0.4, 0.8, 0.9); if (a <= 0) return;
    const { fs, phone } = L;
    const hdr = phone ? 'L = 0.68 m, v = 340 m s⁻¹, slowed down 600 times' : 'Pipes 0.68 m long; speed of sound 340 m s⁻¹ (slowed down 600 times)';
    D.text(s, hdr, phone ? L.W / 2 : 16, phone ? L.top + fs * 0.6 : 22, fs + (phone ? 0 : 1), 0.75 * a, D.sans(fs + (phone ? 0 : 1)), C.muted, phone ? 'center' : 'left');
    pipe(s, t, 0, false, a);
    pipe(s, t, 1, true, a * smooth((t - CLOSED_ON) / 0.9));
  }

  // ---------- end card ----------
  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 38)), s2 = Math.round(clamp(W / 30, 18, 38)), s3 = Math.round(clamp(W / 58, 12, 18));
    g.font = D.sans(s1, 300);
    const l1 = D.wrap(s, 'A standing wave: two identical waves travelling in opposite directions', W - 48);
    let y = H * (phone ? 0.16 : 0.22);
    D.text(s, l1, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * l1.length + s2 * 0.6;
    const items = [
      [[['λ', 'i'], ['n', 's'], [' = ', 'r'], ['2', 'r'], ['L', 'i'], [' / ', 'r'], ['n', 'i']], SUM, 'Both ends the same (node–node or antinode–antinode): all harmonics, n = 1, 2, 3 …'],
      [[['λ', 'i'], ['n', 's'], [' = ', 'r'], ['4', 'r'], ['L', 'i'], [' / ', 'r'], ['n', 'i']], ENV, 'A node at one end and an antinode at the other: odd harmonics only, n = 1, 3, 5 …'],
      [[['f', 'i'], ['n', 's'], [' = ', 'r'], ['v', 'i'], [' / ', 'r'], ['λ', 'i'], ['n', 's']], C.text, 'The nth harmonic has n times the frequency of the 1st harmonic.'],
    ];
    if (phone) {
      for (const [eq, rgb, txt] of items) {
        rich(s, eq, W / 2, y, s2, a, rgb); y += s2 * 1.05;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 40); D.text(s, ls, W / 2, y, s3, 0.8 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.6;
      }
    } else {
      const colW = Math.min(W * 0.28, 320);
      items.forEach(([eq, rgb, txt], i) => {
        const x = W / 2 + (i - 1) * W * 0.31;
        rich(s, eq, x, y, s2, a, rgb);
        g.font = D.sans(s3); D.text(s, D.wrap(s, txt, colW), x, y + s2 * 1.2, s3, 0.8 * a, D.sans(s3));
      });
      y += s2 * 1.2 + s3 * 1.3 * 3 + s3;
    }
    g.font = D.sans(s3 - 1);
    D.text(s, D.wrap(s, 'In a pipe, an open end is a displacement antinode and a closed end is a displacement node.', Math.min(W - 40, 760)),
      W / 2, Math.max(y, H * 0.8), s3 - 1, 0.65 * a, D.sans(s3 - 1), C.muted);
  }

  // numbers in the captions, recalculated (for checking; not used by the player)
  const check = () => ({
    string: [1, 2, 3].map((n) => [n, fmtL(lamS(n)), fmtF(fS(n))]),
    open: [1, 2].map((n) => [n, fmtL(lamO(n)), fmtF(fO(n))]),
    closed: [1, 3, 5].map((n) => [n, fmtL(lamC(n)), fmtF(fC(n))]),
    visualPeriods: { string1: SLOW_S / fS(1), pipeClosed1: SLOW_P / fC(1), pipeOpen1: SLOW_P / fO(1), pipeClosed5: SLOW_P / fC(5) },
  });

  Anim.register('standing', {
    duration: DURATION,
    poster: 72,
    // hold the picture (caption still fully shown) at the end of each long or number-heavy caption, long enough to read
    // it at about 16 characters a second (at least 1.2 s); 6 s for "Predict"
    pauses: CAPS.filter(([a, b, txt]) => txt.length >= 85 || /\d\s*Hz/.test(txt) || txt.length / 16 > b - a - 0.6)
      .map(([a, b, txt]) => [b - 0.7, txt.startsWith('Predict') ? 6.0 : Math.max(1.2, +(txt.length / 16 - (b - a - 0.6)).toFixed(1))]),
    // score: resonant and organ-like (C minor, a soft square-wave pad, a strong low drone, rare high bells)
    music: { chords: [[48, 55, 60, 63], [44, 51, 56, 60], [41, 48, 53, 56], [43, 50, 55, 59]], bar: 9, pad: 'square', cutoff: 700, drone: 0.12, bells: 0.2, bellType: 'sine', bellOct: 3, arp: 0, echo: 0.55, volume: 0.56 },
    resize: layout,
    info: { check, CAPS, modeAt, OPEN_MODES, CLOSED_MODES, shapeS, shapeO, shapeC },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.22);
      part1(s, t);
      part2(s, t);
      part3(s, t);
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Standing waves', 'On strings and in pipes');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
