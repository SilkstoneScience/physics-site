/* A.3 Conservation of energy: a bungee jump with live energy bars.
   Part 1: no air resistance, so the mechanical energy stays 27.2 kJ. Part 2: air resistance and friction
   in the rope transfer mechanical energy to thermal energy; the total stays the same.
   Motion: m d²y/dt² = mg − kΔx − (rope damping) − (air resistance), solved with small RK4 steps. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- the physics ----------
  const M = 60, G = 9.8, L0 = 25, K = 120, BRIDGE = 80;             // kg, m s^-2, m, N m^-1, m above the river
  const MG = M * G;                                                  // 588 N
  // lowest point: mg(L0 + x) = ½kx²  →  x = (mg + √(m²g² + 2kmgL0)) / k = 21.30 m
  const XMAX = (MG + Math.sqrt(MG * MG + 2 * K * MG * L0)) / K;
  const DROP = L0 + XMAX;                                            // 46.30 m below the bridge
  const ETOT = MG * DROP;                                            // 27.2 kJ (E_p measured from the lowest point)
  const XF = MG / K;                                                 // 4.9 m: kΔx = mg, where the jumper is fastest
  const C_AIR = 0.15, B_ROPE = 8;                                    // part 2: air resistance c v², rope friction b v (taut only)

  const DT = 0.0005, SAMPLE = 0.01;
  function simulate(c, b, T) {
    const acc = (y, v) => { const x = Math.max(0, y - L0); return G - (K * x + (x > 0 ? b * v : 0) + c * v * Math.abs(v)) / M; };
    const pow = (y, v) => (y > L0 ? b * v * v : 0) + c * Math.abs(v) ** 3;     // rate of transfer to thermal energy
    const out = { y: [0], v: [0], Q: [0], P: [0] };
    let y = 0, v = 0, Q = 0;
    const every = Math.round(SAMPLE / DT), n = Math.round(T / DT);
    for (let i = 1; i <= n; i++) {
      const k1y = v, k1v = acc(y, v);
      const k2y = v + k1v * DT / 2, k2v = acc(y + k1y * DT / 2, v + k1v * DT / 2);
      const k3y = v + k2v * DT / 2, k3v = acc(y + k2y * DT / 2, v + k2v * DT / 2);
      const k4y = v + k3v * DT, k4v = acc(y + k3y * DT, v + k3v * DT);
      const ny = y + DT * (k1y + 2 * k2y + 2 * k3y + k4y) / 6, nv = v + DT * (k1v + 2 * k2v + 2 * k3v + k4v) / 6;
      Q += DT * (pow(y, v) + pow(ny, nv)) / 2;
      y = ny; v = nv;
      if (i % every === 0) { out.y.push(y); out.v.push(v); out.Q.push(Q); out.P.push(pow(y, v)); }
    }
    return out;
  }
  const at = (S, tau) => {
    const f = clamp(tau / SAMPLE, 0, S.y.length - 1), i = Math.min(Math.floor(f), S.y.length - 2), u = f - i;
    const I = (arr) => arr[i] + (arr[i + 1] - arr[i]) * u;
    const y = I(S.y), v = I(S.v), x = Math.max(0, y - L0);
    return { y, v, x, Q: I(S.Q), P: I(S.P), Ep: MG * (DROP - y), Ek: 0.5 * M * v * v, EH: 0.5 * K * x * x };
  };
  // the time when f (along the samples) first crosses zero after tau0, by linear interpolation
  const cross = (S, f, tau0 = 0) => {
    for (let i = Math.ceil(tau0 / SAMPLE) + 1; i < S.y.length; i++) {
      const a = f(i - 1), b = f(i);
      if (a <= 0 && b > 0) return (i - 1 + (-a) / (b - a)) * SAMPLE;
    }
    return null;
  };
  const S1 = simulate(0, 0, 7.6);
  const tTaut = cross(S1, (i) => S1.y[i] - L0);                       // 2.259 s (= √(2L0/g))
  const tFast = cross(S1, (i) => S1.y[i] - L0 - XF);                  // 2.473 s
  const tBot = cross(S1, (i) => -S1.v[i], tFast);                     // 3.585 s
  const tTop = cross(S1, (i) => S1.v[i], tBot);                       // 7.170 s, back at the bridge
  const S2 = simulate(C_AIR, B_ROPE, 104);
  const tBot2 = cross(S2, (i) => -S2.v[i], 1);
  const tUp2 = cross(S2, (i) => S2.v[i], tBot2);                      // top of the first bounce
  const UP2 = at(S2, tUp2), FINAL = at(S2, 103);
  const VTAUT = Math.sqrt(2 * G * L0), VFAST = at(S1, tFast).v;       // 22.1 and 23.2 m s^-1
  const MECH1 = (UP2.Ep + UP2.Ek + UP2.EH) / ETOT;                    // fraction still mechanical after one bounce

  // ---------- timeline (scene seconds) ----------
  const J1 = 14, SLOW = 2.5;                                          // part 1 shown 2.5× slower (6.5× just after the rope goes taut)
  const T_TAUT = J1 + tTaut * SLOW, T_FAST = T_TAUT + 1.4, T_BOT = T_FAST + (tBot - tFast) * SLOW, T_TOP = T_BOT + (tTop - tBot) * SLOW;
  const KEYS1 = [[J1, 0], [T_TAUT, tTaut], [T_FAST, tFast], [T_BOT, tBot], [T_TOP, tTop]];
  const SWITCH = T_TOP + 0.25;                                        // the scene resets for part 2 behind the dark card
  const J2 = 41.6;
  const KEYS2 = [[J2, 0], [J2 + 13, 13], [J2 + 19, 43], [J2 + 23, 103]];   // real speed, then fast forward ×5 and ×15
  const T_UP2 = J2 + tUp2;
  const END_CARD = 70.8, DURATION = 79;
  const mapKeys = (keys, t) => {
    if (t <= keys[0][0]) return { tau: keys[0][1], rate: 0 };
    for (let i = 1; i < keys.length; i++) {
      const [ta, xa] = keys[i - 1], [tb, xb] = keys[i];
      if (t <= tb) return { tau: xa + (xb - xa) * (t - ta) / (tb - ta), rate: (xb - xa) / (tb - ta) };
    }
    return { tau: keys[keys.length - 1][1], rate: 0 };
  };
  function stateAt(t) {
    if (t < SWITCH) {
      const { tau, rate } = mapKeys(KEYS1, t);
      return { part: 1, jumped: t >= J1, rate, tau, ...at(S1, tau), Q: 0, P: 0 };
    }
    const { tau, rate } = mapKeys(KEYS2, t);
    return { part: 2, jumped: t >= J2, rate, tau, ...at(S2, tau) };
  }

  const kJ = (E) => { const v = E / 1000; return v < 0.005 ? '0' : v < 9.995 ? v.toFixed(2) : v.toFixed(1); };
  const pct = Math.round(MECH1 * 100);
  const CAPS = [
    [4.4, 9.4, 'A 60 kg jumper, a 25 m bungee rope with k = 120 N m⁻¹, and a bridge 80 m above a river.'],
    [9.6, 13.7, `Before the jump, all ${kJ(ETOT)} kJ is gravitational potential energy (measured from the lowest point).`],
    [13.8, T_TAUT - 0.65, 'Falling freely: gravitational potential energy becomes kinetic energy. The rope is still slack.'],
    [T_TAUT - 0.6, T_TAUT + 0.6, 'Predict: is the jumper fastest now, just as the rope starts to stretch, or lower down?'],
    [T_FAST - 0.62, T_FAST + 0.6, `Lower down. The jumper speeds up until the rope's pull equals the weight: kΔx = mg, so Δx = ${XF.toFixed(1)} m.`],
    [T_BOT - 0.7, T_BOT + 0.6, `Lowest point: the rope is stretched ${XMAX.toFixed(1)} m and stores all ${kJ(ETOT)} kJ as elastic potential energy.`],
    [T_BOT + 1.0, T_TOP - 0.3, `With no air resistance, the jumper would bounce back up to the bridge every time. The total stays ${kJ(ETOT)} kJ.`],
    [36.8, 41.4, 'Predict: with air resistance, will the total energy go down?'],
    [41.6, 47.2, `No. Mechanical energy is transferred to thermal energy in the air and the rope. The total stays ${kJ(ETOT)} kJ.`],
    [47.4, T_UP2 + 1.0, `Each bounce is lower. At the top of the first bounce, ${pct}% of the energy is still mechanical.`],
    [J2 + 13, 60.4, 'Fast forward: the bounces die away until the jumper hangs at rest, where kΔx = mg again.'],
    [64.8, 70.6, `At rest, ${(L0 + XF).toFixed(1)} m down: ${kJ(FINAL.Ep)} kJ gravitational + ${kJ(FINAL.EH)} kJ elastic + ${kJ(FINAL.Q)} kJ thermal = ${kJ(ETOT)} kJ.`],
  ];
  const PAUSES = [[13.0, 2], [T_TAUT, 5.5], [T_FAST, 6], [T_BOT, 5], [40.7, 1.5], [T_UP2, 2.5], [69.8, 1.5]];

  // ---------- colours ----------
  const COL = { Ep: C.good, Ek: C.vel, EH: C.field, Q: '255,112,92', total: C.white };
  const ROPE = '178,172,255';

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = W < 520;
    const capFs = clamp(W / 44, 15, 25), capH = capFs * (phone ? 6.4 : 4.3);
    const SW = phone ? W * 0.49 : W * 0.6;                   // the scene's width; the chart is to its right
    const xj = SW * (phone ? 0.68 : 0.56);
    const yB = phone ? s.top + 44 : H * 0.17;
    const fs = phone ? 10 : Math.round(clamp(W / 82, 11, 15));
    const yWater = H - capH - (phone ? 0 : fs * 0.4);
    const ppm = (yWater - yB) / BRIDGE;
    const figH = phone ? 26 : clamp(H * 0.085, 28, 80);
    const cx0 = phone ? W * 0.51 : W * 0.625, cx1 = W - (phone ? 6 : W * 0.035);
    const cy0 = phone ? s.top + 4 : Math.max(54, H * 0.11);
    const head = fs * 1.45 * (phone ? 3 : 2);
    const cyT = cy0 + head + fs * 1.6, cyB = H - capH - fs * (phone ? 2.6 : 3.2);
    L = { W, H, phone, SW, xj, yB, yWater, ppm, fs, figH, cx0, cx1, cy0, cyT, cyB, Y: (d) => yB + d * ppm };
    // the gorge walls: x of the left and right cliff faces at depth d (m below the bridge)
    const n = (d, p) => 0.5 * Math.sin(d * 0.21 + p) + 0.3 * Math.sin(d * 0.57 + 2 * p) + 0.2 * Math.sin(d * 1.31 + 3 * p);
    L.xl = (d) => SW * (0.15 + 0.13 * (d / BRIDGE) + 0.025 * n(d, 1));
    L.xr = (d) => SW * (0.92 - 0.11 * (d / BRIDGE) + 0.025 * n(d, 4));
  }

  // ---------- drawing ----------
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const STARS = Array.from({ length: 150 }, () => ({ x: rnd(), y: rnd(), s: rnd(), ph: rnd() * 6.28 }));
  const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // text made of pieces: [text, style], style 'i' italic serif, 'r' upright serif, 's' italic subscript, 'sans'
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

  function drawSky(s) {
    const { g } = s, { W, yB } = L;
    for (const st of STARS) {
      const y = st.y * (yB - 6); if (y < 2) continue;
      const tw = 0.55 + 0.45 * Math.sin(s.clock * (0.8 + st.s) + st.ph);
      g.fillStyle = `rgba(220,228,255,${(0.25 + 0.55 * st.s) * tw})`;
      const r = 0.6 + st.s * 0.9; g.fillRect(st.x * W, y, r, r);
    }
    // a crescent moon
    const mx = L.SW * 0.8, my = Math.max(s.top + 16, yB * 0.42), mr = clamp(L.W / 70, 7, 16);
    D.glowDot(s, mx, my, mr * 4, C.light, 0.25);
    g.fillStyle = 'rgba(255,240,200,0.95)'; g.beginPath(); g.arc(mx, my, mr, 0, 7); g.fill();
    g.fillStyle = C.bg; g.beginPath(); g.arc(mx + mr * 0.45, my - mr * 0.25, mr * 0.9, 0, 7); g.fill();
    // distant hills
    g.beginPath(); g.moveTo(0, yB);
    for (let x = 0; x <= W; x += 8) g.lineTo(x, yB - (10 + 9 * Math.sin(x * 0.011 + 1) + 6 * Math.sin(x * 0.027)) * (L.phone ? 0.6 : 1));
    g.lineTo(W, yB); g.closePath(); g.fillStyle = '#0a0f22'; g.fill();
  }
  function drawGorge(s) {
    const { g } = s, { W, H, yB, yWater, Y, xl, xr } = L;
    // the far wall of the gorge, seen between the cliffs
    const far = g.createLinearGradient(0, yB, 0, yWater);
    far.addColorStop(0, '#0a1028'); far.addColorStop(1, '#05070f');
    g.fillStyle = far; g.fillRect(0, yB, W, yWater - yB);
    // mist above the river
    const mist = g.createLinearGradient(0, Y(55), 0, yWater);
    mist.addColorStop(0, 'rgba(120,140,220,0)'); mist.addColorStop(1, 'rgba(120,140,220,0.16)');
    g.fillStyle = mist; g.fillRect(0, Y(55), W, yWater - Y(55));
    // the river, with moving glints
    const riv = g.createLinearGradient(0, yWater, 0, H);
    riv.addColorStop(0, '#16285a'); riv.addColorStop(1, '#070b1c');
    g.fillStyle = riv; g.fillRect(0, yWater, W, H - yWater);
    D.line(s, 0, yWater, W, yWater, '150,180,255', 0.45, 1.2);
    for (let i = 0; i < 26; i++) {
      const yy = yWater + 3 + hash(i) * Math.max(4, H - yWater - 4), len = 8 + hash(i + 50) * 22;
      const xx = ((hash(i + 9) * W + s.clock * (10 + hash(i + 3) * 14)) % (W + 40)) - 20;
      D.line(s, xx, yy, xx + len, yy, '170,200,255', 0.18 + 0.2 * Math.sin(s.clock * 2 + i), 1);
    }
    // cliffs: dark rock with a faint glowing edge
    const left = [[0, yB]], right = [[W, yB]];
    for (let d = 0; d <= BRIDGE; d += 1) { left.push([xl(d), Y(d)]); right.push([xr(d), Y(d)]); }
    left.push([0, yWater]); right.push([W, yWater]);
    for (const poly of [left, right]) {
      g.beginPath(); poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
      const rock = g.createLinearGradient(0, yB, 0, yWater);
      rock.addColorStop(0, '#1c2346'); rock.addColorStop(1, '#0d1126');
      g.fillStyle = rock; g.fill();
      D.glowLine(s, poly.slice(1, -1), '120,130,210', 0.35, 1.1);
      D.line(s, poly[0][0], yB, poly[1][0], yB, '120,130,210', 0.5, 1.2);
    }
    // rock layers: faint sloping lines on each cliff
    for (let i = 0; i < 9; i++) {
      const d = 6 + i * 8.3 + hash(i) * 3, tilt = (hash(i + 20) - 0.5) * 3;
      D.line(s, 0, Y(d + tilt), xl(d) - 3, Y(d), '130,140,220', 0.12, 1);
      D.line(s, xr(d + 2) + 3, Y(d + 2), W, Y(d + 2 - tilt), '130,140,220', 0.12, 1);
    }
  }
  function drawBridge(s) {
    const { g } = s, { yB, Y, xl, xr, ppm } = L;
    const xa = xl(0) - 14, xb = xr(0) + 14, thick = Math.max(3, ppm * 1.1), steel = '150,165,230';
    // the arch (behind the jumper) from the cliff walls up to the deck
    const da = 26, x1 = xl(da), x2 = xr(da), pts = [];
    for (let i = 0; i <= 40; i++) { const u = i / 40, x = lerp(x1, x2, u); pts.push([x, Y(da) - (Y(da) - yB - thick) * (1 - (2 * u - 1) ** 2)]); }
    D.glowLine(s, pts, steel, 0.35, 1.4);
    for (let i = 1; i < 12; i++) {
      const p = pts[Math.round(i * 40 / 12)];
      D.line(s, p[0], p[1], p[0], yB + thick, steel, 0.22, 1);
    }
    // deck and railing
    g.fillStyle = '#1b2245'; g.fillRect(xa, yB, xb - xa, thick);
    D.line(s, xa, yB, xb, yB, '200,210,255', 0.75, 1.3);
    D.line(s, xa, yB + thick, xb, yB + thick, steel, 0.45, 1);
    const rail = Math.max(5, ppm * 1.6);
    D.line(s, xa, yB - rail, xb, yB - rail, steel, 0.5, 1);
    for (let x = xa; x <= xb; x += Math.max(9, ppm * 3)) {
      if (Math.abs(x - L.xj) < L.figH * 0.45) continue;           // a gap in the railing where the jumper stands
      D.line(s, x, yB, x, yB - rail, steel, 0.4, 1);
    }
    for (let x = xa + 18; x < xb; x += Math.max(40, (xb - xa) / 7)) D.glowDot(s, x, yB - rail, 7, C.light, 0.6 + 0.15 * Math.sin(s.clock * 1.7 + x));
  }
  function depthLine(s, d, label, a, rgb = C.muted, right = '') {
    if (a <= 0) return;
    const { xj, Y, xl, fs } = L, y = Y(d);
    D.line(s, xl(d) + 4, y, xj + L.figH * 0.9, y, rgb, 0.45 * a, 1, [4, 4]);
    D.text(s, label, xj - L.figH * 0.6 - 18, y - fs * 0.05, fs, 0.85 * a, D.sans(fs), rgb, 'right');
    if (right && !L.phone) D.text(s, right, xj + L.figH * 0.9 + 6, y, fs, a, D.sans(fs, 600), rgb, 'left');
  }
  function drawRope(s, st) {
    const { xj, yB, Y } = L, ya = yB + 2, yf = st.jumped ? Y(st.y) : yB - 1;
    if (st.y < L0 - 1e-6) {
      // slack: the rope hangs in a U below the anchor and the jumper's feet. Total length 25 m: bottom of the loop at (L0 + y)/2.
      const db = (L0 + st.y) / 2, r = 3, yb = Y(db) - r, off = 2 * r * clamp((L0 - st.y) / 3, 0, 1);
      const sway = Math.sin(s.clock * 1.3) * 1.5 * clamp((L0 - st.y) / 10, 0, 1), pts = [];
      for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push([xj - off * smooth(u * 2.5) + sway * u, lerp(ya, yb, u)]); }
      for (let i = 1; i <= 8; i++) { const q = Math.PI * i / 8; pts.push([xj - off / 2 + sway - Math.cos(q) * off / 2, yb + Math.sin(q) * r * (off / (2 * r))]); }
      for (let i = 1; i <= 16; i++) { const u = i / 16; pts.push([xj + sway * (1 - u), lerp(yb, yf, u)]); }
      D.glowLine(s, pts, ROPE, 0.55, 2);
    } else {
      // taut: straight, thinner and glowing brighter as it stretches (more elastic energy)
      const e = clamp(st.x / XMAX, 0, 1);
      D.glowLine(s, [[xj, ya], [xj, yf]], ROPE, 0.6 + 0.4 * e, 2 - 0.9 * e);
      if (e > 0.004) D.glowLine(s, [[xj, Y(L0)], [xj, yf]], C.field, 0.25 + 0.6 * e, 1.2 + 2.2 * e);
    }
  }
  // A simple figure: ankles at (x, y); ang = 0 standing, π hanging head-down
  function drawJumper(s, x, y, ang, a, flap) {
    const { g } = s, h = L.figH;
    g.save(); g.translate(x, y); g.rotate(ang); g.globalAlpha = a;
    const limb = (pts, w) => {
      g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px * h, py * h) : g.moveTo(px * h, py * h)));
      g.lineWidth = w * h; g.stroke();
    };
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.shadowColor = 'rgba(170,190,255,0.8)'; g.shadowBlur = 8;
    g.strokeStyle = '#dfe6ff';
    limb([[-0.05, 0], [-0.04, -0.46]], 0.1); limb([[0.05, 0], [0.04, -0.46]], 0.1);     // legs, ankles strapped together
    const arm = lerp(0.25, 2.3, smooth(ang / Math.PI)) + flap;                              // arms down when standing, out when falling
    for (const sgn of [-1, 1]) limb([[sgn * 0.06, -0.78], [sgn * (0.06 + Math.sin(arm) * 0.32), -0.78 + Math.cos(arm) * 0.32]], 0.075);
    g.strokeStyle = '#7fb0ff'; limb([[0, -0.47], [0, -0.79]], 0.17);                       // jacket
    g.fillStyle = '#dfe6ff'; g.beginPath(); g.arc(0, -0.9 * h, 0.085 * h, 0, 7); g.fill();  // head
    g.shadowBlur = 0;
    g.fillStyle = `rgba(${C.light},1)`; g.fillRect(-0.09 * h, -0.05 * h, 0.18 * h, 0.06 * h);  // ankle harness
    g.restore();
  }
  function drawThermal(s, t, st) {
    if (st.part !== 2 || t < J2) return;
    const { xj, Y, figH } = L, LIFE = 1.8;
    for (let i = Math.max(0, Math.floor((t - J2 - LIFE) / 0.07)); ; i++) {
      const tb = J2 + i * 0.07; if (tb > t) break;
      const age = t - tb; if (age > LIFE) continue;
      const sb = at(S2, mapKeys(KEYS2, tb).tau), k = clamp(sb.P / 3000, 0, 1) ** 0.6;
      if (k < 0.02) continue;
      const onRope = sb.y > L0 && hash(i) < 0.4;
      const y0 = onRope ? Y(lerp(2, sb.y, hash(i + 7))) : Y(sb.y) + figH * (0.2 + 0.6 * hash(i + 3));
      const x = xj + (hash(i + 5) - 0.5) * figH * 0.6 + Math.sin(age * 3 + i) * 4 + age * 6 * (hash(i + 2) - 0.5);
      D.glowDot(s, x, y0 - age * 16, 5 + 4 * hash(i + 1), COL.Q, k * 0.75 * (1 - age / LIFE));
    }
  }
  function drawForces(s, t, st) {
    const a = st.part === 1 ? fade(t, J1 + 0.3, T_BOT + 1.2, 0.5, 0.8) : 0;
    if (a <= 0) return;
    const { xj, Y, figH } = L, unit = figH * 0.8 / MG, xa = xj - figH * 0.55, yc = Y(st.y) + figH * 0.5;
    D.arrow(s, xa, yc, xa, yc + MG * unit, C.force, a, 'mg', { labelOff: 13, width: 2.2, head: 9 });
    if (st.x > 0.02) D.arrow(s, xa, yc, xa, yc - K * st.x * unit, C.force, a, K * st.x * unit > 16 ? 'kΔx' : '', { labelOff: 13, width: 2.2, head: 9 });
  }
  function drawStretch(s, st, a) {
    if (st.x < 0.3 || a <= 0) return;
    const { xj, Y, fs } = L, xb = xj + 9, y1 = Y(L0), y2 = Y(st.y);
    D.line(s, xb, y1, xb, y2, C.field, 0.8 * a, 1.2);
    D.line(s, xb - 3, y1, xb + 3, y1, C.field, 0.8 * a, 1.2); D.line(s, xb - 3, y2, xb + 3, y2, C.field, 0.8 * a, 1.2);
    if (y2 - y1 > fs * 1.6) rich(s, [['Δ', 'r'], ['x', 'i']], xb + 5, (y1 + y2) / 2, fs + 2, a, C.field, 'left');
  }

  function drawChart(s, st, a) {
    if (a <= 0) return;
    const { g } = s, { cx0, cx1, cy0, cyT, cyB, fs, phone } = L;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(14,20,44,${0.72 * a})`;
    g.beginPath(); g.roundRect(cx0 - 8, cy0 - 6, cx1 - cx0 + 14, cyB - cy0 + fs * (phone ? 2.6 : 3.2) + 4, 10); g.fill();
    // header: title and live readings
    const lh = fs * 1.45;
    D.text(s, 'Energy / kJ', cx0, cy0 + fs * 0.7, fs + 1, a, D.sans(fs + 1, 600), C.text, 'left');
    const vtxt = ` = ${Math.abs(st.v).toFixed(1)} m s⁻¹`, xtxt = ` = ${st.x.toFixed(1)} m`;
    const tag = !st.jumped || st.rate === 0 ? '' : st.rate < 0.9 ? 'slow motion' : st.rate < 1.1 ? 'real speed' : `fast forward ×${Math.round(st.rate)}`;
    if (phone) {
      rich(s, [['v', 'i'], [vtxt, 'sans']], cx0, cy0 + fs * 0.7 + lh, fs + 1, a * 0.9, C.vel, 'left');
      rich(s, [['Δ', 'r'], ['x', 'i'], [xtxt, 'sans']], cx0, cy0 + fs * 0.7 + 2 * lh, fs + 1, a * 0.9, C.field, 'left');
      if (tag) D.text(s, tag, cx1, cy0 + fs * 0.7 + 2 * lh, fs - 1, a * 0.7, D.sans(fs - 1), C.muted, 'right');
    } else {
      if (tag) D.text(s, tag, cx1, cy0 + fs * 0.7, fs, a * 0.7, D.sans(fs), C.muted, 'right');
      const w1 = rich(s, [['v', 'i'], [vtxt, 'sans']], cx0, cy0 + fs * 0.7 + lh, fs + 1, a * 0.9, C.vel, 'left');
      rich(s, [['Δ', 'r'], ['x', 'i'], [xtxt, 'sans']], cx0 + Math.max(w1 + fs * 2, (cx1 - cx0) * 0.5), cy0 + fs * 0.7 + lh, fs + 1, a * 0.9, C.field, 'left');
    }
    // axis and grid, 0 to 30 kJ
    const axL = cx0 + fs * 1.6, Yv = (E) => cyB - (E / 30000) * (cyB - cyT);
    for (let e = 0; e <= 30; e += 10) {
      D.line(s, axL, Yv(e * 1000), cx1, Yv(e * 1000), C.muted, (e ? 0.14 : 0.5) * a, 1);
      D.text(s, String(e), axL - 4, Yv(e * 1000), fs - 1, 0.7 * a, D.sans(fs - 1), C.muted, 'right');
    }
    const cols = [
      ['Ep', [['E', 'i'], ['p', 's']], 'gravitational'],
      ['Ek', [['E', 'i'], ['k', 's']], 'kinetic'],
      ['EH', [['E', 'i'], ['H', 's']], 'elastic'],
      ['Q', [['thermal', 'sans']], ''],
      ['total', [['total', 'sans']], ''],
    ];
    const pitch = (cx1 - axL) / cols.length, bw = pitch * (phone ? 0.62 : 0.5);
    cols.forEach(([key, sym, word], i) => {
      const xc = axL + pitch * (i + 0.5), x0 = xc - bw / 2;
      const segs = key === 'total' ? ['Ep', 'Ek', 'EH', 'Q'].map((k) => [k, st[k]]) : [[key, st[key]]];
      let base = 0;
      for (const [k, E] of segs) {
        if (E <= 0) continue;
        const yTop = Yv(base + E), yBot = Yv(base);
        const gr = g.createLinearGradient(0, yTop, 0, yBot);
        gr.addColorStop(0, `rgba(${COL[k]},${0.95 * a})`); gr.addColorStop(1, `rgba(${COL[k]},${0.55 * a})`);
        g.fillStyle = gr; g.shadowColor = `rgba(${COL[k]},${0.6 * a})`; g.shadowBlur = 10;
        g.fillRect(x0, yTop, bw, yBot - yTop); g.shadowBlur = 0;
        base += E;
      }
      const E = key === 'total' ? base : st[key];
      D.text(s, kJ(E), xc, Yv(E) - fs * 0.8, fs, a, D.sans(fs, 600), key === 'total' ? C.text : COL[key]);
      const rgb = key === 'total' ? C.text : COL[key];
      rich(s, sym, xc, cyB + fs * 1.0, sym[0][1] === 'sans' ? fs + 1 : fs + 4, a, rgb);
      if (word) { g.font = D.sans(fs - 1); const wd = g.measureText(word).width > pitch * 0.98 ? word.slice(0, 4) + '.' : word; D.text(s, wd, xc, cyB + fs * 2.3, fs - 1, 0.75 * a, D.sans(fs - 1), C.muted); }
    });
  }

  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.72 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 30, 20, 40)), s2 = Math.round(clamp(W / 28, 20, 42)), s3 = Math.round(clamp(W / 52, 13, 20));
    g.font = D.sans(s1, 300);
    const l1 = D.wrap(s, 'Energy is never lost, only transferred', W - 40);
    let y = H * (phone ? 0.24 : 0.28);
    D.text(s, l1, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * l1.length + s2 * 0.6;
    const eqs = [
      [['Δ', 'r'], ['E', 'i'], ['p', 's'], [' = ', 'r'], ['mg', 'i'], ['Δ', 'r'], ['h', 'i']],
      [['E', 'i'], ['k', 's'], [' = ½', 'r'], ['mv', 'i'], ['²', 'r']],
      [['E', 'i'], ['H', 's'], [' = ½', 'r'], ['k', 'i'], ['(Δ', 'r'], ['x', 'i'], [')²', 'r']],
    ];
    const cols = [COL.Ep, COL.Ek, COL.EH];
    if (phone) eqs.forEach((e, i) => rich(s, e, W / 2, y + i * s2 * 1.35, s2, a, cols[i]));
    else eqs.forEach((e, i) => rich(s, e, W / 2 + (i - 1) * W * 0.27, y, s2, a, cols[i]));
    y += (phone ? 3 * s2 * 1.35 : s2 * 1.4) + s3 * 0.4;
    g.font = D.sans(s3);
    D.text(s, D.wrap(s, 'Without air resistance, mechanical energy is conserved. With it, mechanical energy is dissipated as thermal energy, but the total is always conserved.', Math.min(W - 48, 760)), W / 2, y, s3, a * 0.8, D.sans(s3));
  }

  Anim.register('energy', {
    duration: DURATION,
    poster: T_FAST,
    // score: night-time suspense (E minor, a dark pad, a slow heartbeat, a little wind)
    music: { chords: [[52, 59, 64, 67], [48, 55, 64, 67], [43, 50, 59, 62], [50, 57, 62, 66]], bar: 8, pad: 'saw', cutoff: 600, drone: 0.12, bells: 0.15, pulse: 1.6, wind: 0.4, volume: 0.52 },
    pauses: PAUSES,
    resize: layout,
    // for checking the numbers (not used by the player)
    info: { XMAX, DROP, ETOT, XF, VTAUT, VFAST, tTaut, tFast, tBot, tTop, tBot2, tUp2, UP2, FINAL, MECH1, T_TAUT, T_FAST, T_BOT, T_TOP, T_UP2, CAPS, at: (p, tau) => at(p === 1 ? S1 : S2, tau) },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      const st = stateAt(t);
      D.background(s, 0.22);
      drawSky(s);
      drawGorge(s);
      drawBridge(s);
      // depth markers
      const p1 = st.part === 1, f = L.phone;
      const show = smooth((t - 9.6) / 0.8);
      depthLine(s, L0, f ? 'taut 25 m' : 'rope goes taut · 25 m', show * (p1 ? 1 : 0.6),
        t > T_TAUT - 0.6 && p1 ? C.light : C.muted, p1 && t > T_FAST - 0.6 && t < T_BOT - 0.7 ? `${VTAUT.toFixed(1)} m s⁻¹` : '');
      depthLine(s, L0 + XF, f ? (p1 ? 'fastest 29.9 m' : 'at rest 29.9 m') : (p1 ? 'fastest · 29.9 m' : 'at rest · 29.9 m'),
        p1 ? smooth((t - T_FAST + 0.6) / 0.6) : smooth((t - 60) / 1), C.vel, p1 && t > T_FAST - 0.6 && t < T_BOT - 0.7 ? `${VFAST.toFixed(1)} m s⁻¹` : '');
      depthLine(s, DROP, f ? 'lowest 46.3 m' : 'lowest point · 46.3 m', show * (p1 ? 1 : 0.6), C.muted, f ? '' : 'Eₚ = 0');
      if (!p1) depthLine(s, UP2.y, f ? `bounce ${UP2.y.toFixed(1)} m` : `top of first bounce · ${UP2.y.toFixed(1)} m`, fade(t, T_UP2 - 0.4, 60, 0.4, 1), COL.Q);
      D.text(s, f ? 'river 80 m' : 'river · 80 m below the bridge', L.xj, L.yWater - L.fs * 0.9, L.fs, 0.7 * show, D.sans(L.fs), C.muted);
      if (p1 && t > T_FAST - 0.6 && t < T_TOP) D.glowDot(s, L.xj, L.Y(L0 + XF), 16, C.vel, 0.8 * smooth((t - T_FAST + 0.6) / 0.6));
      // rope, jumper, forces
      drawRope(s, st);
      drawThermal(s, t, st);
      const jt = p1 ? J1 : J2, ang = st.jumped ? Math.PI * smooth((t - jt) / 0.7) : 0;
      const yAnk = st.jumped ? L.Y(st.y) : L.yB - 1;
      drawJumper(s, L.xj, yAnk, ang, 1, st.jumped ? 0.15 * Math.sin(s.clock * 2.2) : 0);
      drawForces(s, t, st);
      drawStretch(s, st, smooth((t - 9.6) / 0.8));
      drawChart(s, st, smooth((t - 9.4) / 0.9) * (1 - smooth((t - END_CARD) / 0.8)));
      D.captions(s, t, CAPS);
      // title, part 2 card, end card
      if (t < 4.4) { s.g.fillStyle = `rgba(4,6,13,${0.78 * fade(t, 0, 4.2, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.2, 'Energy in a bungee jump', 'Where does the energy go as the rope stretches?');
      const card = fade(t, T_TOP - 0.3, 36.7, 0.7, 0.8);
      if (card > 0) { s.g.fillStyle = `rgba(4,6,13,${0.82 * card})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, T_TOP + 0.2, 36.6, 'Now add air resistance', 'and friction inside the stretching rope');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
