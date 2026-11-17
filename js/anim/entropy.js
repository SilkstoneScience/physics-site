/* B.4 (HL) Entropy and the second law. A gas spreads through a box when a partition is removed; the
   microstates of 4 particles are counted (16 in all) and of 10 (1024); Boltzmann's equation S = k_B ln Ω;
   heat flowing from hot to cold increases the total entropy (ΔS = ΔQ/T); the second law in its three forms;
   and a local decrease of entropy (water freezing in a freezer) paid for by a bigger increase in the kitchen.
   Numbers (all recalculated in info.check()):
   - 60 particles: chance all on the left at one moment = (1/2)^60 = 8.67 × 10⁻¹⁹ ≈ 9 × 10⁻¹⁹.
   - 4 particles: 2⁴ = 16 microstates; macrostates 4–0, 3–1, 2–2, 1–3, 0–4 have Ω = 1, 4, 6, 4, 1; all on the left: 1 in 16.
   - 10 particles: 2¹⁰ = 1024; Ω = 1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1.
   - 100 particles: (1/2)^100 = 7.89 × 10⁻³¹ ≈ 8 × 10⁻³¹.
   - k_B = 1.38 × 10⁻²³ J K⁻¹ (data booklet). S = k_B ln Ω: ln 6 = 1.792, S = 2.47 × 10⁻²³ ≈ 2.5 × 10⁻²³ J K⁻¹;
     ln 4 = 1.386, S = 1.91 × 10⁻²³ ≈ 1.9 × 10⁻²³ J K⁻¹; ln 1 = 0, S = 0.
   - Heat: Q = 720 J from 360 K to 240 K (large blocks: temperatures constant): ΔS_hot = −720/360 = −2.00 J K⁻¹,
     ΔS_cold = +720/240 = +3.00 J K⁻¹, total +1.00 J K⁻¹; the reverse would give −1.00 J K⁻¹.
   - Freezer: 0.20 kg of water freezing at 273 K: Q = mL = 0.20 × 3.34 × 10⁵ = 6.68 × 10⁴ J, ΔS = −6.68 × 10⁴/273 = −244.7
     ≈ −245 J K⁻¹. The kitchen (293 K) receives Q + W = 6.68 × 10⁴ + 2.0 × 10⁴ = 8.68 × 10⁴ J: ΔS = +8.68 × 10⁴/293 = +296.2
     ≈ +296 J K⁻¹. Total +51.6 ≈ +52 J K⁻¹.
   The particles move in straight lines and bounce off the walls (an ideal gas: they don't collide with each other), worked
   out from the scene time alone with a fixed random seed. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const NB = ' ';
  const nb = (s) => s.replace(/~/g, NB);

  // ---------- timeline ----------
  const T_REL = 12.0;                                  // partition removed
  const P1 = [4.6, 42.4], P2 = [42.4, 73.9], P3 = [73.9, 92.9], P4 = [92.9, 117.9], P5 = [117.9, 157.0];
  const SMALL = [34.4, 42.2], TILES = [42.6, 92.9], CHART = [60.8, 73.8], FORM = [74.0, 92.9];
  const Q_FLOW = [93.8, 99.0];
  const FREEZE = 137.2, END_CARD = 157.0, DURATION = 170;

  const CAPS = [
    [4.8, 10.4, 'A box of gas with a partition: 60 particles on the left, empty space on the right.'],
    [10.6, 16.0, 'The partition is removed. Nothing pushes the particles along: they just keep moving.'],
    [16.2, 22.4, 'They spread through the whole box. Soon the numbers on the two sides stay near 30 and 30, give or take a few.'],
    [22.6, 27.6, 'Predict: will all 60 ever be back on the left at the same moment?'],
    [27.8, 34.2, nb('Not impossible, but at any moment the chance is (1/2)⁶⁰~≈~9~×~10⁻¹⁹. It is never seen.')],
    [34.6, 41.6, 'With only 4 particles it happens often: all four are on the left 1 time in 16, on average.'],
    [42.6, 48.6, 'Count the ways. A microstate says exactly which particle is where; a macrostate only says how many are on each side.'],
    [48.8, 54.4, nb('4 particles, 2 sides each: 2~×~2~×~2~×~2~=~16 microstates, all equally likely.')],
    [54.6, 60.6, 'The even split, 2 and 2, has 6 microstates. All four on the left has only 1.'],
    [60.8, 67.0, nb('With 10 particles there are 2¹⁰~=~1024 microstates: 252 for the even split, only 1 for all on the left.')],
    [67.2, 73.6, nb('With 100 particles, all on the left has a chance of (1/2)¹⁰⁰~≈~8~×~10⁻³¹. A few litres of real gas hold about 10²³ particles.')],
    [74.0, 80.0, 'Boltzmann\'s equation turns the count into entropy: S is the Boltzmann constant times ln Ω.'],
    [80.2, 86.4, nb('For the 2–2 split: S~=~1.38~×~10⁻²³~×~ln~6~=~2.5~×~10⁻²³~J~K⁻¹. All on one side: ln~1~=~0, so S~=~0 (counting positions only).')],
    [86.6, 92.6, nb('Spreading out goes from few microstates to very many: the entropy increases. With about 10²³ particles, a real gas is never seen to go back on its own.')],
    [93.0, 98.8, 'Now heat. Two large blocks at 360 K and 240 K touch, and 720 J of thermal energy flows from hot to cold.'],
    [99.0, 105.0, nb('Hot block: ΔS~=~−720~÷~360~=~−2.00~J~K⁻¹. Cold block: ΔS~=~+720~÷~240~=~+3.00~J~K⁻¹.')],
    [105.2, 111.2, nb('Total: ΔS~=~+1.00~J~K⁻¹. The cold block gains more entropy than the hot block loses.')],
    [111.4, 117.6, nb('The other way, from cold to hot, would give a total of −1.00~J~K⁻¹, even though energy would still be conserved. So it never happens on its own.')],
    [118.0, 124.4, 'The second law: the total entropy of an isolated system never decreases. Real processes increase it.'],
    [124.6, 130.6, 'Clausius form: thermal energy never flows on its own from a colder body to a hotter one.'],
    [130.8, 137.0, 'Kelvin form: no engine working in a cycle can turn thermal energy completely into work.'],
    [137.4, 144.0, nb('Entropy can fall locally. Water freezing in a freezer: 0.20~kg at 273~K gives out 6.68~×~10⁴~J, so ΔS~=~−245~J~K⁻¹.')],
    [144.2, 150.6, nb('That energy, plus 2.0~×~10⁴~J of work done by the motor, goes into the kitchen at 293~K: ΔS~=~+296~J~K⁻¹.')],
    [150.8, 156.6, nb('Total: +52~J~K⁻¹. Living things lower their own entropy the same way, by raising it around them.')],
  ];
  // No pauses (teacher, 17 November 2026). Each caption still gets enough time to read at about 16 characters a
  // second (the Predict caption 6 s more): the extra time is spread over the caption itself, so the story (tiles
  // appearing, bars, energy flowing, labels) runs a little more slowly there instead of stopping. The gas particles
  // are driven by the scene time itself, so they always move at their own steady speed.
  const OLD_HOLDS = [];
  for (const [a, b, txt] of CAPS) {
    const need = txt.length / 16 - (b - a - 0.6);
    if (need > 0.05) OLD_HOLDS.push([b - 0.8, Math.max(0.8, +need.toFixed(1))]);
  }
  OLD_HOLDS.push([27.0, 6.0]);
  const KNOTS = (() => {                                // [story time, scene time] pairs
    const win = new Map();
    for (const [st, d] of OLD_HOLDS) {
      const c = CAPS.find(([a, b]) => st >= a - 0.05 && st <= b + 0.05), key = c ? `${c[0]},${c[1]}` : `${st - 1.5},${st + 1.5}`;
      win.set(key, (win.get(key) || 0) + d);
    }
    const ws = [...win].map(([k, d]) => [...k.split(",").map(Number), d]).sort((p, q) => p[0] - q[0]);
    const k = [[0, 0]]; let acc = 0;
    for (const [a, b, d] of ws) { k.push([a, a + acc]); acc += d; k.push([b, b + acc]); }
    k.push([DURATION, DURATION + acc]);
    return k;
  })();
  const SCENE_END = KNOTS[KNOTS.length - 1][1];
  const map = (x, from, to) => { for (let i = 1; i < KNOTS.length; i++) { const p = KNOTS[i - 1], q = KNOTS[i]; if (x <= q[from]) return q[from] === p[from] ? p[to] : p[to] + (q[to] - p[to]) * (x - p[from]) / (q[from] - p[from]); } return KNOTS[KNOTS.length - 1][to]; };
  const storyOf = (t) => map(t, 1, 0), sceneOf = (x) => map(x, 0, 1);
  const CAPS_SCENE = CAPS.map(([a, b, txt]) => [+sceneOf(a).toFixed(2), +sceneOf(b).toFixed(2), txt]);
  const T_REL_S = sceneOf(T_REL);                    // the partition goes, in scene time
  let REAL = 0;                                        // scene time: the particles move with it

  // ---------- random numbers (fixed seed) ----------
  let seed = 20261116 + 7;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

  // reflect u into [a, b]; also say which way it is moving there (+1 or −1)
  const fold = (u, a, b) => { const L = b - a, m = (((u - a) % (2 * L)) + 2 * L) % (2 * L); return m < L ? [a + m, 1] : [a + 2 * L - m, -1]; };

  // ---------- the gases (box: 0 ≤ x ≤ 2, 0 ≤ y ≤ 1; partition at x = 1) ----------
  const RAD = 0.022;
  function makeGas(n, sigma, leftOnly) {
    const ps = [];
    for (let i = 0; i < n; i++) {
      const x0 = RAD + rnd() * ((leftOnly ? 1 : 2) - 2 * RAD), y0 = RAD + rnd() * (1 - 2 * RAD);
      ps.push({ x0, y0, vx: sigma * gauss(), vy: sigma * gauss() });
    }
    return ps;
  }
  const BIG = makeGas(60, 0.25, true);
  // the small box: four particles with similar speeds (0.85–1.0 box heights a second) in well spread-out directions,
  // so every particle crosses the middle often and |vx|, |vy| ≥ 0.4 for each
  const FEW = [[0.85, 35], [0.95, 125], [0.9, 218], [1.0, 307]].map(([v, deg]) => {
    const r = deg * Math.PI / 180;
    return { x0: RAD + rnd() * (2 - 2 * RAD), y0: RAD + rnd() * (1 - 2 * RAD), vx: v * Math.cos(r), vy: v * Math.sin(r) };
  });
  function bigPos(p, t) {                              // t: scene time
    const [y] = fold(p.y0 + p.vy * t, RAD, 1 - RAD);
    if (t < T_REL_S) return [fold(p.x0 + p.vx * t, RAD, 1 - RAD)[0], y];
    const [xr, dir] = fold(p.x0 + p.vx * T_REL_S, RAD, 1 - RAD);
    return [fold(xr + dir * Math.abs(p.vx) * (t - T_REL_S), RAD, 2 - RAD)[0], y];
  }
  const fewAt = (p, u) => [fold(p.x0 + p.vx * u, RAD, 2 - RAD)[0], fold(p.y0 + p.vy * u, RAD, 1 - RAD)[0]];
  const leftCount = (t) => BIG.reduce((n, p) => n + (bigPos(p, t)[0] < 1 ? 1 : 0), 0);
  // the small box shows a stretch of its (endless) motion chosen so that "all four on the left" happens once while it
  // is on screen (the page says so); over a long run it happens 1/16 of the time (checked in info.check())
  const FEW_OFF = (() => {
    const allLeft = (u) => FEW.every((p) => fewAt(p, u)[0] < 1);
    const w0 = sceneOf(SMALL[0]), w1 = sceneOf(SMALL[1]);                // the small box is on screen (scene time)
    const cap = CAPS_SCENE.find(([, , txt]) => txt.startsWith('With only 4 particles'));
    for (let off = 0; off < 600; off += 0.25) {
      let n = 0, was = allLeft(w0 + off), at = -1, run = 0, longest = 0;
      if (was) continue;
      for (let t = w0; t <= w1; t += 0.01) { const now = allLeft(t + off); if (now && !was) { n++; at = t; } run = now ? run + 0.01 : 0; longest = Math.max(longest, run); was = now; }
      if (n === 1 && longest > 0.3 && at > cap[0] + 1.5 && at < cap[1] - 1.5) return off;
    }
    return 0;
  })();
  const fewPos = (p, t) => fewAt(p, t + FEW_OFF);
  const fewAllLeft = (t) => FEW.every((p) => fewPos(p, t)[0] < 1);
  // the moments (in the small box's window) when all four arrive on the left together
  const FEW_EVENTS = (() => {
    const ev = []; let was = false;
    for (let t = sceneOf(SMALL[0]); t <= sceneOf(SMALL[1]); t += 0.005) { const now = fewAllLeft(t); if (now && !was) ev.push(t); was = now; }
    return ev;
  })();

  // ---------- counting ----------
  const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  const NAMES = ['A', 'B', 'C', 'D'], PCOL = ['255,130,130', '120,200,255', '140,230,150', '255,210,110'];
  const COLS = [4, 3, 2, 1, 0].map((k) => {                 // k particles on the left
    const ms = [];
    for (let mask = 0; mask < 16; mask++) { let c = 0; for (let i = 0; i < 4; i++) if (mask & (1 << i)) c++; if (c === k) ms.push(mask); }
    return { k, ms };
  });
  const KB = 1.38e-23;

  // ---------- colours ----------
  const GAS = '160,200,255', WALL = '150,165,230', HOT = '255,120,70', COLD = '90,160,255', ENT = C.good, LOSS = '255,110,130';

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25));
    const capTop = H - capFs * (phone ? 6.6 : 4.9);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    const top = phone ? 10 : Math.max(46, H * 0.1);
    const o = { W, H, phone, fs, capTop, top, capFs };
    if (!phone) {
      o.box = { x0: W * 0.05, x1: W * 0.6, y0: top + fs * 1.2, y1: capTop - fs * 1.6 };
      o.panel = { x0: W * 0.65, x1: W * 0.95, y0: Math.max(top, 64), y1: capTop - fs };
      o.tiles = { x0: W * 0.04, x1: W * 0.58, y0: top + fs * 0.4, y1: capTop - fs * 3.6 };
      o.chart = { x0: W * 0.66, x1: W * 0.95, y0: Math.max(top, 70) + fs * 2.2, y1: capTop - fs * 3.2 };
    } else {
      const mid = top + (capTop - top) * 0.56;
      o.box = { x0: 8, x1: W - 8, y0: top + fs * 1.4, y1: mid };
      o.panel = { x0: 12, x1: W - 12, y0: mid + fs * 1.2, y1: capTop - fs * 0.6 };
      o.tiles = { x0: 6, x1: W - 6, y0: top + fs * 0.4, y1: mid - fs * 2.4 };
      o.chart = { x0: W * 0.12, x1: W - 10, y0: mid + fs * 1.6, y1: capTop - fs * 2.6 };
    }
    L = o;
  }
  // fit a 2:1 box into a region
  const fitBox = (r, aspect = 2) => {
    const w = r.x1 - r.x0, h = r.y1 - r.y0, sc = Math.min(w / aspect, h);
    const x0 = (r.x0 + r.x1) / 2 - sc * aspect / 2, y0 = (r.y0 + r.y1) / 2 - sc / 2;
    return { x0, y0, sc, X: (x) => x0 + x * sc, Y: (y) => y0 + (1 - y) * sc };
  };

  // text made of pieces: [text, style]: 'i' italic serif, 'r' upright serif, 's' italic subscript, 'sans'
  function rich(s, parts, x, y, size, a, rgb = C.text, align = 'center') {
    const { g } = s; if (a <= 0) return 0;
    const font = (st) => st === 's' ? D.serif(Math.round(size * 0.7)) : st === 'su' ? D.serif(Math.round(size * 0.62), false) : st === 'i' ? D.serif(size) : st === 'r' ? D.serif(size, false) : D.sans(Math.round(size * 0.9));
    const ws = parts.map(([tx, st]) => { g.font = font(st); return g.measureText(tx).width; });
    const total = ws.reduce((p, q) => p + q, 0);
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`;
    parts.forEach(([tx, st], i) => { g.font = font(st); g.fillText(tx, px, st === 's' || st === 'su' ? y + size * 0.28 : y); px += ws[i]; });
    g.shadowBlur = 0;
    return total;
  }
  const label = (s, txt, x, y, a, rgb = C.muted, align = 'center', size = L.fs, weight = 400) => D.text(s, txt, x, y, size, a, D.sans(size, weight), rgb, align);

  // ---------- part 1: the gas spreading ----------
  function drawBox(s, t, a) {
    if (a <= 0) return;
    const { g } = s, B = fitBox(L.box), { X, Y, sc } = B;
    // walls
    D.glowLine(s, [[X(0), Y(0)], [X(2), Y(0)], [X(2), Y(1)], [X(0), Y(1)], [X(0), Y(0)]], WALL, 0.6 * a, 1.3);
    // the partition, lifting out at T_REL
    const lift = smooth((t - T_REL + 0.3) / 0.9);
    if (lift < 1) {
      const yTop = Y(1) - lift * sc * 1.1;
      g.fillStyle = `rgba(200,210,255,${0.85 * a * (1 - lift * 0.6)})`;
      g.fillRect(X(1) - Math.max(2, sc * 0.012), yTop, Math.max(4, sc * 0.024), sc);
    }
    // a faint line showing the middle after the partition has gone
    D.line(s, X(1), Y(0), X(1), Y(1), WALL, 0.25 * a * smooth((t - T_REL - 0.5) / 1), 1, [4, 5]);
    if (t < T_REL + 1) label(s, 'empty', X(1.5), Y(0.5), 0.5 * a * (1 - smooth((t - T_REL) / 1)));
    // particles with short trails
    const r = Math.max(2.2, sc * RAD);
    for (const p of BIG) {
      const [x, y] = bigPos(p, REAL), [xb, yb] = bigPos(p, REAL - 0.12);
      if (Math.abs(x - xb) < 0.3) D.line(s, X(xb), Y(yb), X(x), Y(y), GAS, 0.25 * a, Math.max(1, r * 0.6));
      D.glowDot(s, X(x), Y(y), r * 3, GAS, 0.9 * a);
    }
    label(s, 'left', X(0.5), Y(1) - L.fs * 0.9, 0.7 * a);
    label(s, 'right', X(1.5), Y(1) - L.fs * 0.9, 0.7 * a);
  }
  function drawCounts(s, t, a) {
    if (a <= 0) return;
    const { g } = s, p = L.panel, fs = L.fs, n = leftCount(REAL);
    const x0 = p.x0, w = p.x1 - p.x0, bh = Math.max(8, fs * 0.9);
    label(s, 'number of particles on each side', x0, p.y0 + fs * 0.4, 0.8 * a, C.muted, 'left');
    [['left', n], ['right', 60 - n]].forEach(([nm, v], i) => {
      const y = p.y0 + fs * (2.0 + i * 2.1), bx = x0 + fs * 3.4, bw = w - fs * 6.8;
      label(s, nm, x0, y, 0.85 * a, C.text, 'left');
      g.fillStyle = `rgba(255,255,255,${0.07 * a})`; g.fillRect(bx, y - bh / 2, bw, bh);
      g.fillStyle = `rgba(${GAS},${0.85 * a})`; g.fillRect(bx, y - bh / 2, bw * v / 60, bh);
      label(s, String(v), x0 + w, y, a, C.text, 'right', fs + 1, 600);
    });
    // the small box of 4 particles
    const sa = a * fade(t, SMALL[0], SMALL[1], 0.8, 0.6);
    if (sa <= 0) return;
    const r = { x0: p.x0, x1: p.x1, y0: p.y0 + fs * 6.4, y1: Math.min(p.y1, p.y0 + fs * 6.4 + (p.x1 - p.x0) * 0.5) };
    if (r.y1 - r.y0 < fs * 3) return;
    const B = fitBox(r), { X, Y, sc } = B;
    label(s, 'only 4 particles', (X(0) + X(2)) / 2, Y(1) - fs * 0.9, 0.85 * sa);
    D.glowLine(s, [[X(0), Y(0)], [X(2), Y(0)], [X(2), Y(1)], [X(0), Y(1)], [X(0), Y(0)]], WALL, 0.55 * sa, 1.2);
    D.line(s, X(1), Y(0), X(1), Y(1), WALL, 0.3 * sa, 1, [4, 5]);
    const last = FEW_EVENTS.filter((e) => e <= REAL).pop();
    const flash = last !== undefined && fewAllLeft(REAL) ? 1 : last !== undefined ? 1 - smooth((REAL - last - 0.6) / 0.6) : 0;
    if (flash > 0) {
      g.fillStyle = `rgba(${C.light},${0.12 * flash * sa})`; g.fillRect(X(0), Y(1), sc, sc);
      label(s, 'all 4 on the left!', (X(0) + X(2)) / 2, Y(0) + fs * 1.1, flash * sa, C.light, 'center', fs, 600);
    }
    FEW.forEach((q, i) => { const [x, y] = fewPos(q, REAL); D.glowDot(s, X(x), Y(y), Math.max(7, sc * 0.08), PCOL[i], sa); });
  }

  // ---------- part 2–3: tiles of microstates, the bar chart, Boltzmann's equation ----------
  function drawTiles(s, t, a) {
    if (a <= 0) return;
    const { g } = s, r = L.tiles, fs = L.fs, phone = L.phone;
    const colW = (r.x1 - r.x0) / 5, headH = fs * 2.6, rowsH = r.y1 - r.y0 - headH - fs * 1.8;
    const rowH = rowsH / 6, tw = Math.min(colW * 0.86, rowH * 2 * 0.88), th = tw / 2;
    COLS.forEach((col, ci) => {
      const cx = r.x0 + colW * (ci + 0.5);
      const ca = a * smooth((t - (TILES[0] + 0.6 + ci * 0.5)) / 0.6);
      const hi = col.k === 2 && t > 54.6 && t < 60.6 ? 1 : col.k === 4 && t > 57.4 && t < 60.6 ? 1 : 0;
      label(s, `${col.k}–${4 - col.k}`, cx, r.y0 + fs * 0.6, ca, hi ? C.light : C.text, 'center', fs + 1, 600);
      if (ci === 0) label(s, '(left–right)', cx, r.y0 + fs * 1.75, 0.6 * ca, C.muted, 'center', fs - 1);
      col.ms.forEach((mask, ri) => {
        const ta = ca * smooth((t - (TILES[0] + 0.9 + ci * 0.5 + ri * 0.12)) / 0.4);
        if (ta <= 0) return;
        const x0 = cx - tw / 2, y0 = r.y0 + headH + ri * rowH;
        g.strokeStyle = `rgba(${hi ? C.light : WALL},${(hi ? 0.9 : 0.5) * ta})`; g.lineWidth = hi ? 1.6 : 1;
        g.strokeRect(x0, y0, tw, th);
        D.line(s, x0 + tw / 2, y0, x0 + tw / 2, y0 + th, WALL, 0.3 * ta, 1, [2, 3]);
        for (let i = 0; i < 4; i++) {
          const left = !!(mask & (1 << i));
          const px = x0 + tw * ((left ? 0 : 0.5) + 0.14 + 0.22 * (i % 2)), py = y0 + th * (0.3 + 0.4 * Math.floor(i / 2));
          g.fillStyle = `rgba(${PCOL[i]},${ta})`; g.beginPath(); g.arc(px, py, Math.max(2, th * 0.13), 0, 7); g.fill();
        }
      });
      // Ω under each column
      const oa = ca * smooth((t - 50.4) / 0.8);
      rich(s, [['Ω', 'i'], [` = ${col.ms.length}`, 'sans']], cx, r.y1 - fs * 0.6, fs + 1, oa, hi ? C.light : C.text);
      // S under each column (part 3)
      const sa = a * smooth((t - 80.6) / 0.8);
      if (sa > 0) {
        const S = KB * Math.log(col.ms.length) / 1e-23;
        label(s, S === 0 ? '0' : S.toFixed(1), cx, r.y1 + fs * 1.3, sa, ENT, 'center', fs + 1, 600);
      }
    });
    // a key to the four particles (wide screens)
    const ka = a * fade(t, 44.0, 74.0, 0.6, 0.6);
    if (!phone && ka > 0) {
      let x = r.x0; const y = L.capTop - fs * 0.6;
      label(s, 'particles:', x, y, 0.7 * ka, C.muted, 'left'); x += fs * 5.6;
      NAMES.forEach((nm, i) => { g.fillStyle = `rgba(${PCOL[i]},${ka})`; g.beginPath(); g.arc(x, y, fs * 0.35, 0, 7); g.fill(); label(s, nm, x + fs * 0.6, y, 0.8 * ka, C.text, 'left'); x += fs * 2.2; });
    }
    const sl = a * smooth((t - 80.6) / 0.8);
    if (sl > 0) rich(s, [['S', 'i'], [' / 10⁻²³ J K⁻¹', 'sans']], r.x0, r.y1 + fs * 3.0, fs, 0.8 * sl, ENT, 'left');
    // spreading: from all on one side to the even split, drawn through the empty space under columns 1 and 2
    const aa = a * fade(t, 86.8, P3[1], 0.8, 0.5);
    if (aa > 0) {
      const xa = r.x0 + colW * 0.5, ya = r.y0 + headH + rowH * 1.0;
      const xb = r.x0 + colW * 2.5 - tw / 2 - 4, yb = r.y0 + headH + rowH * 4.9;
      g.strokeStyle = `rgba(${ENT},${aa})`; g.lineWidth = 2; g.beginPath(); g.moveTo(xa, ya); g.quadraticCurveTo(xa, yb, xb - 8, yb); g.stroke();
      D.arrow(s, xb - 12, yb, xb, yb, ENT, aa, '', { head: 8, width: 2, blur: 4 });
      // no room beside the arrow at small sizes, so its label is in the formula panel (drawFormula)
    }
  }
  function drawChart(s, t, a) {
    if (a <= 0) return;
    const { g } = s, r = L.chart, fs = L.fs;
    const n = 10, bw = (r.x1 - r.x0) / (n + 1), base = r.y1, hmax = r.y1 - r.y0 - fs * 1.4;
    label(s, '10 particles: Ω for each macrostate', (r.x0 + r.x1) / 2, r.y0 - fs * 1.2, 0.85 * a, C.text, 'center', fs, 600);
    for (let k = 0; k <= n; k++) {
      const om = choose(n, k), ba = a * smooth((t - (CHART[0] + 0.3 + k * 0.08)) / 0.4);
      const x = r.x0 + bw * (k + 0.5), h = hmax * om / 252, hi = k === 5 || k === 10;
      g.fillStyle = `rgba(${hi ? C.light : GAS},${(hi ? 0.9 : 0.6) * ba})`;
      g.fillRect(x - bw * 0.36, base - Math.max(1.5, h), bw * 0.72, Math.max(1.5, h));
      if (k % (L.phone ? 5 : 1) === 0 || k === 10) label(s, String(k), x, base + fs * 0.9, 0.75 * ba, C.muted, 'center', fs - 1);
      if (hi) label(s, String(om), x, base - Math.max(1.5, h) - fs * 0.7, ba, C.light, 'center', fs, 600);
    }
    D.line(s, r.x0, base, r.x1, base, C.muted, 0.6 * a, 1);
    label(s, 'number on the left', (r.x0 + r.x1) / 2, base + fs * 2.1, 0.75 * a, C.muted, 'center', fs - 1);
    label(s, 'total 1024', r.x0, r.y0 + fs * 0.4, 0.75 * a * smooth((t - 62.4) / 0.6), C.muted, 'left', fs - 1);
  }
  function drawFormula(s, t, a) {
    if (a <= 0) return;
    const r = L.phone ? L.chart : L.chart, fs = L.fs, big = Math.round(clamp(L.W / 26, 20, 40));
    const cx = (r.x0 + r.x1) / 2, cy = L.phone ? r.y0 + (r.y1 - r.y0) * 0.35 : r.y0 + (r.y1 - r.y0) * 0.3;
    rich(s, [['S', 'i'], [' = ', 'r'], ['k', 'i'], ['B', 's'], [' ln ', 'r'], ['Ω', 'i']], cx, cy, big, a, ENT);
    label(s, 'Boltzmann\'s equation', cx, cy - big * 1.1, 0.8 * a);
    rich(s, [['k', 'i'], ['B', 's'], [' = 1.38 × 10⁻²³ J K⁻¹', 'sans']], cx, cy + big * 1.1, fs + 1, 0.85 * a, C.text);
    label(s, 'one microstate: S = 0 (positions only)', cx, cy + big * 1.1 + fs * 2, 0.75 * a * smooth((t - 82.6) / 0.6), C.muted);
    label(s, 'green arrow: spreading out, S increases', cx, cy + big * 1.1 + fs * 3.8, a * smooth((t - 86.8) / 0.8), ENT, 'center', fs, 600);
  }

  // ---------- part 4: heat from hot to cold ----------
  const qAt = (t) => 720 * smooth((t - Q_FLOW[0]) / (Q_FLOW[1] - Q_FLOW[0]));
  function drawBlocks(s, t, a) {
    if (a <= 0) return;
    const { g } = s, fs = L.fs, phone = L.phone, W = L.W;
    const y0 = phone ? L.top + fs * 2.8 : L.top + fs * 1.6, bh = phone ? (L.capTop - L.top) * 0.3 : (L.capTop - L.top) * 0.38;
    const bw = phone ? W * 0.36 : W * 0.2, cx = W / 2;
    const hx = cx - bw, cxs = cx;
    const block = (x, rgb, nm, T) => {
      const gr = g.createLinearGradient(x, y0, x + bw, y0 + bh);
      gr.addColorStop(0, `rgba(${rgb},${0.55 * a})`); gr.addColorStop(1, `rgba(${rgb},${0.25 * a})`);
      g.fillStyle = gr; g.fillRect(x, y0, bw, bh);
      g.strokeStyle = `rgba(${rgb},${0.9 * a})`; g.lineWidth = 1.5; g.strokeRect(x, y0, bw, bh);
      label(s, nm, x + bw / 2, y0 + bh * 0.35, a, C.text, 'center', fs + 1, 600);
      label(s, `${T} K`, x + bw / 2, y0 + bh * 0.62, a, C.text, 'center', fs + 2, 600);
    };
    block(hx, HOT, 'hot', 360); block(cxs, COLD, 'cold', 240);
    // energy flowing across the boundary
    const flowing = t > Q_FLOW[0] && t < Q_FLOW[1] + 1.5;
    if (flowing) for (let i = 0; i < 9; i++) {
      const ph = ((s.clock * 0.6 + i / 9) % 1), x = lerp(hx + bw * 0.55, cxs + bw * 0.45, ph), y = y0 + bh * (0.15 + 0.7 * ((i * 0.37) % 1));
      D.glowDot(s, x, y, fs * 0.9, C.light, 0.7 * a * Math.sin(Math.PI * ph) * (t < Q_FLOW[1] ? 1 : 1 - smooth((t - Q_FLOW[1]) / 1.5)));
    }
    D.arrow(s, cx - bw * 0.3, y0 + bh + fs * 1.2, cx + bw * 0.3, y0 + bh + fs * 1.2, C.light, a * smooth((t - Q_FLOW[0]) / 0.6), '', { head: 10, width: 2.4, blur: 6 });
    label(s, `Q = ${Math.round(qAt(t))} J`, cx, y0 + bh + fs * 2.6, a * smooth((t - Q_FLOW[0]) / 0.6), C.light, 'center', fs + 1, 600);
    // entropy changes
    const ea = a * smooth((t - 99.2) / 0.8), ta = a * smooth((t - 105.4) / 0.8);
    const by = y0 + bh + fs * (phone ? 5.1 : 4.9), unit = (phone ? W * 0.11 : W * 0.06), zx = cx, rowH = fs * 1.9;
    if (ea > 0) {
      label(s, 'ΔS / J K⁻¹', zx, by - fs * 0.6, 0.8 * ea);
      D.line(s, zx, by, zx, by + rowH * 3.1, C.muted, 0.5 * ea, 1);
      const rows = [['hot block', -2.0, LOSS, ea], ['cold block', 3.0, ENT, ea], ['total', 1.0, C.light, ta]];
      rows.forEach(([nm, v, rgb, al], i) => {
        if (al <= 0) return;
        const y = by + rowH * (i + 0.6), w = v * unit;
        g.fillStyle = `rgba(${rgb},${0.85 * al})`; g.fillRect(Math.min(zx, zx + w), y - fs * 0.45, Math.abs(w), fs * 0.9);
        const txt = (v > 0 ? '+' : '−') + Math.abs(v).toFixed(2);
        label(s, txt, v > 0 ? zx + w + fs * 0.5 : zx + w - fs * 0.5, y, al, rgb, v > 0 ? 'left' : 'right', fs + 1, 600);
        label(s, nm, v > 0 ? zx - fs * 0.6 : zx + fs * 0.6, y, 0.8 * al, C.muted, v > 0 ? 'right' : 'left');
      });
    }
    // the reverse: crossed out
    const ra = a * fade(t, 111.6, P4[1], 0.6, 0.5);
    if (ra > 0) {
      const y = y0 - fs * 0.9;
      D.arrow(s, cx + bw * 0.35, y, cx - bw * 0.35, y, LOSS, 0.8 * ra, '', { head: 9, width: 2, blur: 4 });
      D.line(s, cx - fs * 0.8, y - fs * 0.8, cx + fs * 0.8, y + fs * 0.8, LOSS, ra, 2.5);
      D.line(s, cx - fs * 0.8, y + fs * 0.8, cx + fs * 0.8, y - fs * 0.8, LOSS, ra, 2.5);
      if (phone) label(s, 'cold → hot: total ΔS = −1.00 J K⁻¹', cx, y - fs * 1.3, ra, LOSS, 'center', fs, 600);
      else label(s, 'cold → hot: total ΔS = −1.00 J K⁻¹', cx + bw * 0.45, y, ra, LOSS, 'left', fs, 600);
    }
    label(s, 'large blocks: their temperatures barely change', cx, y0 - fs * 0.9, 0.6 * a * fade(t, 94.4, 111.4, 1, 0.5), C.muted);
  }

  // ---------- part 5: the second law and a local decrease ----------
  function drawLaws(s, t, a) {
    if (a <= 0) return;
    const { g } = s, fs = L.fs, W = L.W, phone = L.phone;
    const cards = [
      [118.0, 'Entropy form', 'The total entropy of an isolated system never decreases.'],
      [124.6, 'Clausius form', 'Thermal energy never flows on its own from colder to hotter.'],
      [130.8, 'Kelvin form', 'No engine working in a cycle turns thermal energy completely into work.'],
    ];
    const x0 = phone ? 12 : W * 0.14, w = phone ? W - 24 : W * 0.72, ch = fs * (phone ? 4.4 : 3.4);
    cards.forEach(([t0, head, txt], i) => {
      const ca = a * smooth((t - t0) / 0.7);
      if (ca <= 0) return;
      const y = L.top + fs * 1.0 + i * (ch + fs * 0.9);
      g.fillStyle = `rgba(14,20,44,${0.75 * ca})`; g.beginPath(); g.roundRect(x0, y, w, ch, 8); g.fill();
      g.strokeStyle = `rgba(${ENT},${0.5 * ca})`; g.lineWidth = 1; g.stroke();
      label(s, head, x0 + fs * 0.8, y + fs * 1.1, ca, ENT, 'left', fs + 1, 600);
      g.font = D.sans(fs); D.text(s, D.wrap(s, txt, w - fs * 1.6), x0 + fs * 0.8, y + fs * 2.4, fs, 0.9 * ca, D.sans(fs), C.text, 'left');
    });
    const ha = a * smooth((t - 131.6) / 0.8);
    if (ha > 0) label(s, 'Heat engines: see the animation "The first law and heat engines".', W / 2, L.top + fs * 1.0 + 3 * (ch + fs * 0.9) + fs * 0.4, 0.7 * ha, C.muted);
  }
  function drawFreezer(s, t, a) {
    if (a <= 0) return;
    const { g } = s, fs = L.fs, W = L.W, phone = L.phone;
    const kx0 = phone ? 10 : W * 0.08, kx1 = phone ? W - 10 : W * 0.92, ky0 = L.top + fs * 0.6, ky1 = L.capTop - fs * (phone ? 6.6 : 4.6);
    // the kitchen
    g.fillStyle = `rgba(${HOT},${0.08 * a})`; g.fillRect(kx0, ky0, kx1 - kx0, ky1 - ky0);
    g.strokeStyle = `rgba(${HOT},${0.5 * a})`; g.lineWidth = 1.2; g.strokeRect(kx0, ky0, kx1 - kx0, ky1 - ky0);
    label(s, 'kitchen, 293 K', kx0 + fs * 0.7, ky0 + fs * 1.0, a, HOT, 'left', fs + 1, 600);
    // the freezer
    const fw = (kx1 - kx0) * (phone ? 0.42 : 0.3), fh = (ky1 - ky0) * (phone ? 0.5 : 0.56), fx = kx0 + (kx1 - kx0) * (phone ? 0.06 : 0.12);
    const fy = ky1 - fh - fs * (phone ? 3.8 : 3.2);
    g.fillStyle = `rgba(${COLD},${0.18 * a})`; g.fillRect(fx, fy, fw, fh);
    g.strokeStyle = `rgba(${COLD},${0.8 * a})`; g.strokeRect(fx, fy, fw, fh);
    label(s, 'freezer', fx + fw / 2, fy + fs * 1.0, a, COLD, 'center', fs, 600);
    // a tray of water turning to ice
    const fr = smooth((t - FREEZE - 0.6) / 4);
    const tx = fx + fw * 0.15, tw = fw * 0.7, ty = fy + fh * 0.55, tht = fh * 0.18;
    g.fillStyle = `rgba(${lerp(90, 210, fr)},${lerp(150, 235, fr)},255,${0.7 * a})`; g.fillRect(tx, ty, tw, tht);
    label(s, fr < 0.5 ? 'water, 273 K' : 'ice, 273 K', fx + fw / 2, ty + tht + fs * 1.0, a, C.text, 'center', fs);
    // ΔS of the water
    const wa = a * smooth((t - 140.0) / 0.8);
    label(s, 'ΔS = −245 J K⁻¹', fx + fw / 2, fy + fh * 0.35, wa, LOSS, 'center', fs + 1, 600);
    // energy out of the freezer into the kitchen, plus the motor's work
    const ea = a * smooth((t - 144.4) / 0.8);
    const ox = fx + fw, oy = fy + fh * 0.4, kxMid = phone ? fx + fw + (kx1 - fx - fw) * 0.5 : fx + fw + (kx1 - fx - fw) * 0.45;
    if (ea > 0 && !phone) {
      D.arrow(s, ox + fs * 0.4, oy, kxMid - fs, oy, C.light, ea, '', { head: 10, width: 2.4, blur: 6 });
      label(s, '6.68 × 10⁴ J', (ox + kxMid) / 2, oy - fs * 1.0, ea, C.light, 'center', fs);
      D.arrow(s, (ox + kxMid) / 2, fy + fh + fs * 1.6, (ox + kxMid) / 2, oy + fs * 0.9, C.force, ea, '', { head: 9, width: 2, blur: 4 });
      label(s, 'work by the motor: 2.0 × 10⁴ J', (ox + kxMid) / 2, fy + fh + fs * 2.2, ea, C.force, 'center', fs - 1);
      label(s, 'into the kitchen air: 8.68 × 10⁴ J', kxMid + fs * 0.3, oy, ea, C.light, 'left', fs);
      label(s, 'ΔS = +296 J K⁻¹', kxMid + fs * 0.3, oy + fs * 1.6, ea, ENT, 'left', fs + 1, 600);
    } else if (ea > 0) {                                                // phones: the work joins the outgoing arrow from above; labels on the right
      const ex = kx1 - fs * 0.6, jx = ox + (ex - ox) * 0.7;
      D.arrow(s, ox + fs * 0.3, oy, ex, oy, C.light, ea, '', { head: 9, width: 2.2, blur: 5 });
      label(s, '6.68 × 10⁴ J', (ox + jx) / 2, oy - fs * 1.0, ea, C.light, 'center', fs - 1);
      D.arrow(s, jx, oy - fs * 3.2, jx, oy - fs * 0.6, C.force, ea, '', { head: 8, width: 2, blur: 4 });
      label(s, 'work by the motor: 2.0 × 10⁴ J', ex, oy - fs * 3.9, ea, C.force, 'right', fs - 1);
      label(s, 'into the kitchen air:', ex, oy + fs * 1.4, ea, C.light, 'right', fs);
      label(s, '8.68 × 10⁴ J', ex, oy + fs * 2.6, ea, C.light, 'right', fs);
      label(s, 'ΔS = +296 J K⁻¹', ex, oy + fs * 4.0, ea, ENT, 'right', fs, 600);
    }
    // the assumptions behind these numbers
    const asA = a * smooth((t - 138.0) / 0.8);
    if (asA > 0) {
      g.font = D.sans(fs - 1);
      const txt = 'assumed: the kitchen stays at 293 K, and only the freezing water is counted';
      const ls = phone ? D.wrap(s, txt, kx1 - kx0 - fs * 1.4) : [txt];
      D.text(s, ls, kx0 + fs * 0.7, phone ? ky1 - fs * 0.9 - (ls.length - 1) * (fs - 1) * 1.3 : ky0 + fs * 2.3, fs - 1, 0.6 * asA, D.sans(fs - 1), C.muted, 'left');
    }
    const tta = a * smooth((t - 151.0) / 0.8);
    if (tta > 0) label(s, 'total: ΔS = +52 J K⁻¹', (kx0 + kx1) / 2 + (phone ? 0 : fw * 0.5), ky0 + fs * (phone ? 2.6 : 1.0), tta, C.light, phone ? 'center' : 'left', fs + 2, 600);
  }

  // ---------- end card ----------
  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 32, 17, 34)), s3 = Math.round(clamp(W / 58, 12, 18));
    g.font = D.sans(s1, 300);
    let y = H * (phone ? 0.12 : 0.15);
    const l1 = D.wrap(s, 'Entropy: counting the ways', W - 48);
    D.text(s, l1, W / 2, y, s1, a, D.sans(s1, 300)); y += s1 * 1.3 * l1.length + s2 * 0.4;
    const items = [
      [[['S', 'i'], [' = ', 'r'], ['k', 'i'], ['B', 's'], [' ln ', 'r'], ['Ω', 'i']], ENT, 'More microstates, more entropy. Spreading out increases S.'],
      [[['Δ', 'r'], ['S', 'i'], [' = ', 'r'], ['Δ', 'r'], ['Q', 'i'], [' / ', 'r'], ['T', 'i']], C.light, 'Heat flowing from hot to cold increases the total entropy.'],
      [[['Δ', 'r'], ['S', 'i'], ['total', 'su'], [' ≥ 0', 'r']], C.text, 'The second law, for an isolated system. Entropy can fall locally only if it rises more elsewhere.'],
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
    }
  }

  Anim.register('entropy', {
    duration: SCENE_END,
    poster: +sceneOf(20).toFixed(1),
    // score: spreading out (F-sharp lydian, a triangle pad that very slowly swells, space wind, a soft shimmer, long bars)
    music: { chords: [[54, 61, 65, 68], [56, 63, 66, 70], [51, 58, 63, 66], [49, 56, 61, 65]], bar: 10, pad: 'triangle', cutoff: 800,
      drone: 0.09, wind: 0.6, shimmer: 0.15, tremolo: 0.15, volume: 0.51 },
    resize: layout,
    info: {
      CAPS: CAPS_SCENE, STORY_CAPS: CAPS, KNOTS, FEW_EVENTS, leftCount, choose, KB,
      check() {
        const out = {};
        out.p60 = Math.pow(0.5, 60); out.p100 = Math.pow(0.5, 100);
        out.omega4 = COLS.map((c) => c.ms.length); out.omega10 = Array.from({ length: 11 }, (_, k) => choose(10, k));
        out.S6 = KB * Math.log(6); out.S4 = KB * Math.log(4);
        out.heat = { hot: -720 / 360, cold: 720 / 240, total: -720 / 360 + 720 / 240 };
        const Qf = 0.2 * 3.34e5, Wm = 2.0e4; out.freezer = { Q: Qf, dSwater: -Qf / 273, dSkitchen: (Qf + Wm) / 293, total: -Qf / 273 + (Qf + Wm) / 293 };
        let mn = 60, mx = 0; for (let t = sceneOf(20); t <= sceneOf(42); t += 0.05) { const n = leftCount(t); mn = Math.min(mn, n); mx = Math.max(mx, n); }
        out.leftRange20to42 = [mn, mx]; out.leftAt0 = leftCount(0); out.leftAt11 = leftCount(T_REL_S - 0.1); out.window20to42 = [sceneOf(20), sceneOf(42)];
        out.FEW_OFF = FEW_OFF;
        let all = 0, tot = 0; for (let t = 0; t < 2000; t += 0.01) { tot++; if (fewAllLeft(t)) all++; }
        out.fewAllLeftFraction = all / tot; out.fewEventsInWindow = FEW_EVENTS.length;
        out.maxCharsPerSec = Math.max(...CAPS_SCENE.map(([a, b, txt]) => txt.length / (b - a - 0.6)));
        return out;
      },
    },
    frame(s, tScene) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      REAL = tScene; const t = storyOf(tScene);
      D.background(s, 0.2);
      const a1 = fade(t, P1[0], P1[1], 0.8, 0.7);
      drawBox(s, t, a1);
      drawCounts(s, t, a1);
      const aT = fade(t, TILES[0], TILES[1], 0.8, 0.7);
      drawTiles(s, t, aT);
      drawChart(s, t, fade(t, CHART[0], CHART[1], 0.6, 0.6));
      drawFormula(s, t, fade(t, FORM[0], FORM[1], 0.8, 0.7));
      drawBlocks(s, t, fade(t, P4[0], P4[1], 0.8, 0.7));
      drawLaws(s, t, fade(t, P5[0], FREEZE - 0.2, 0.6, 0.6));
      drawFreezer(s, t, fade(t, FREEZE, END_CARD + 0.4, 0.8, 0.7));
      D.captions(s, tScene, CAPS_SCENE);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Entropy and the second law', 'Why things spread out, and never spread back (HL)');
      endCard(s, t);
      D.vignette(s, tScene, SCENE_END);
    },
  });
})();
