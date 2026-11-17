/* A.4 (HL) The rolling race: a hoop, a solid disc and a solid ball roll without slipping down identical
   slopes (h = 0.50 m, θ = 20°, so the slope is L = h / sin θ = 1.462 m long).
   Rolling without slipping: a = g sin θ / (1 + k), where I = k m r² (hoop k = 1, disc k = ½, ball k = ⅖).
   Energy: mgh = ½mv² + ½Iω² with v = ωr gives v² = 2gh / (1 + k):
     hoop  v² = gh       v = 2.21 m s⁻¹  t = 2L/v = 1.32 s  (½ of the energy is rotational)
     disc  v² = 4gh/3    v = 2.56 m s⁻¹  t = 1.14 s          (⅓ rotational)
     ball  v² = 10gh/7   v = 2.65 m s⁻¹  t = 1.11 s          (2/7 rotational)
   Then a big heavy hoop (4 × the mass, 3 × the radius) ties with a small light one: m and r cancel.
   Every number shown is calculated here from g = 9.8 m s⁻² (checked with a separate script).
   Each object turns through (distance its centre moves) / (its radius), so it visibly rolls without slipping. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, fade, lerp } = Anim;

  // ---------- the physics ----------
  const G = 9.8, HGT = 0.50, TH = 20 * Math.PI / 180, LEN = HGT / Math.sin(TH);
  const SHAPES = {
    hoop: { k: 1, name: 'hoop', rgb: C.pos },
    disc: { k: 0.5, name: 'disc', rgb: C.field },
    ball: { k: 0.4, name: 'ball', rgb: C.good },
  };
  for (const sh of Object.values(SHAPES)) {
    sh.a = G * Math.sin(TH) / (1 + sh.k);            // acceleration down the slope
    sh.tf = Math.sqrt(2 * LEN / sh.a);                 // time to reach the bottom
    sh.vf = sh.a * sh.tf;                              // speed at the bottom, = √(2gh / (1 + k))
    sh.trans = 1 / (1 + sh.k);                         // share of the kinetic energy that is ½mv²
  }
  const SLOW = 4;                                      // slow motion: 4 scene seconds per real second
  const KE_T = C.vel, KE_R = C.light;                  // ½mv² blue, ½Iω² gold

  // ---------- the story (scene times in seconds) ----------
  const RA = 13.6, RB = 31.2, RC = 61.0;               // the three races start here
  // u() keeps a number with its unit, or a short equation, on one line (D.wrap breaks only at ordinary spaces)
  const u = (x) => x.replace(/ /g, '\u00a0');
  const T = (k) => u(`${SHAPES[k].tf.toFixed(2)} s`), V = (k) => u(`${SHAPES[k].vf.toFixed(2)} m s⁻¹`);
  const CAPS = [
    [4.2, 9.8, `A hoop, a solid disc and a solid ball, with the same mass and the same radius, wait at the top of identical slopes: ${u('0.50 m')} high, at 20°.`],
    [10.0, 13.4, 'Predict: which one reaches the bottom first?'],
    [13.7, 19.0, 'Released together, in slow motion (four times slower than real life).'],
    [19.2, 24.4, `The ball wins in ${T('ball')}. The disc is close behind at ${T('disc')}, and the hoop is last at ${T('hoop')}.`],
    [25.4, 31.0, 'Why? Each loses the same energy, mgh. It is shared between moving along, ½mv², and spinning, ½Iω².'],
    [31.3, 36.6, 'Watch the energy as they roll again (slow motion).'],
    [36.8, 42.4, `The hoop has all its mass at the rim (${u('I = mr²')}), so half of its energy goes into spinning: ${u('v² = gh')}, ${u('v = ')}${V('hoop')}.`],
    [42.6, 48.0, `The disc (${u('I = ½mr²')}) spins with a third of its energy: ${u('v² = 4gh/3')}, ${u('v = ')}${V('disc')}.`],
    [48.2, 53.8, `The ball (${u('I = ⅖mr²')}) spins with only 2/7 of it: ${u('v² = 10gh/7')}, ${u('v = ')}${V('ball')}. Its mass is closest to the centre.`],
    [55.0, 60.8, 'A surprise: a big hoop, with 4 times the mass and 3 times the radius, against a small, light hoop. Predict: which wins?'],
    [61.1, 66.6, `Slow motion. The small hoop spins 3 times as fast (${u('ω = v/r')}), but the two stay side by side.`],
    [66.8, 72.2, `A tie: ${T('hoop')} each. In ${u('mgh = ½mv² + ½(mr²)(v/r)²,')} m and r cancel, so ${u('v² = gh')} for every hoop.`],
    [72.4, 77.6, 'Only the shape matters: how the mass is spread out around the axis.'],
  ];
  // No pauses (teacher, 17 November 2026): one constant speed throughout. The story clock waits at these moments so
  // each caption can be read; every wait falls while the objects are at rest (before a release or after they stop),
  // so nothing that moves is ever frozen.
  const WAITS = [[9.1, 2.6], [12.6, 4], [23.6, 1.5], [30.2, 1.5], [41.6, 1.5], [47.2, 1], [53.0, 1.5], [60.0, 4], [71.4, 2], [76.8, 1], [84.0, 4.5]];
  const STORY = 86, DURATION = STORY + WAITS.reduce((n, w) => n + w[1], 0);       // 108.5 s
  const story = (t) => {                     // real time → story time
    let acc = 0;
    for (const [st, d] of WAITS) { if (t < st + acc) return t - acc; if (t < st + acc + d) return st; acc += d; }
    return Math.min(t - acc, STORY);
  };
  const realOf = (st) => st + WAITS.filter((w) => w[0] < st).reduce((n, w) => n + w[1], 0);

  // Which objects are on the slope in each part. lane 0 = front, 2 = back; size = radius in units of R.
  const PHASES = [
    { a: 3.6, b: 24.6, race: RA, mode: 'times', objs: [
      { sh: 'hoop', lane: 2, size: 1, label: 'hoop' }, { sh: 'disc', lane: 1, size: 1, label: 'disc' }, { sh: 'ball', lane: 0, size: 1, label: 'ball' }] },
    { a: 24.9, b: 53.9, race: RB, mode: 'energy', objs: [
      { sh: 'hoop', lane: 2, size: 1, label: 'hoop' }, { sh: 'disc', lane: 1, size: 1, label: 'disc' }, { sh: 'ball', lane: 0, size: 1, label: 'ball' }] },
    { a: 54.4, b: 78.6, race: RC, mode: 'tie', objs: [
      { sh: 'hoop', lane: 2, size: 0.5, label: 'small', row: 'small, light hoop' },
      { sh: 'hoop', lane: 0, size: 1.5, heavy: true, label: 'big', row: 'big, heavy hoop' }] },
  ];

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, tall = H > W * 0.9;
    const capFs = clamp(W / 44, 15, 25), capH = capFs * (tall ? 6.6 : 3.7);
    const R = clamp(tall ? W * 0.03 : H * 0.04, 7, 44);
    const dx = 0.8 * R, dy = 2.6 * R;                       // offset from one lane to the next (back lanes up and right)
    const sx0 = W * (tall ? 0.16 : 0.13), sx1 = W * (tall ? 0.78 : 0.6);
    const flat = W * (tall ? 0.095 : 0.11), thick = 0.6 * R;
    const drop = (sx1 - sx0) * Math.tan(TH);
    const yF = H - capH - thick - (tall ? 4 : H * 0.012);    // front edge of the slope's flat bottom
    const sy1 = yF - 0.6 * dy, sy0 = sy1 - drop;            // lane 0: top and bottom of the slope
    const slopePx = (sx1 - sx0) / Math.cos(TH);
    const fs = Math.round(clamp(W / 62, 11, 18));
    // the scoreboard / energy panel: top right on wide screens, a band across the top on phones
    const backTop = sy0 - 2 * dy - 2 * R;
    let px0, px1, py0, py1;
    if (tall) { px0 = 12; px1 = W - 12; py0 = (s.top || 0) + 8; py1 = backTop - 10; }
    else {
      px0 = W * 0.56; px1 = W - 16; py0 = Math.max(48, H * 0.13);
      const xb = px0 - 2 * dx, yb = sy0 - 2 * dy + (xb - sx0) * Math.tan(TH);   // back lane under the panel's left edge
      py1 = Math.min(H * 0.5, yb - 2.3 * R);
    }
    L = { W, H, tall, R, dx, dy, sx0, sx1, flat, thick, drop, yF, sy0, sy1, slopePx, fs, px0, px1, py0, py1,
      pxPerM: slopePx / LEN };
  }
  // A point on lane `lane` (may be fractional), at distance d (px) along the profile: platform, slope, flat.
  const off = (lane) => [lane * L.dx, -lane * L.dy];
  function profile(lane, d) {
    const [ox, oy] = off(lane);
    if (d <= 0) return [L.sx0 + d + ox, L.sy0 + oy];
    if (d <= L.slopePx) return [L.sx0 + d * Math.cos(TH) + ox, L.sy0 + d * Math.sin(TH) + oy];
    return [L.sx1 + (d - L.slopePx) + ox, L.sy1 + oy];
  }
  const PLAT = () => 1.5 * L.R * 1.6;                      // length of the flat platform at the top

  // Where an object's centre is, and how far it has turned, at scene time t.
  function motion(o, t, race) {
    const sh = SHAPES[o.sh], r = o.size * L.R, tr = Math.max(0, (t - race) / SLOW);
    let along;                                              // distance of the contact point along the slope, in px
    let dist;                                               // distance the centre has moved, in px
    let x, y, done = tr >= sh.tf;
    if (!done) {
      along = 0.5 * sh.a * tr * tr * L.pxPerM;
      const [cx, cy] = profile(o.lane, along);
      x = cx + r * Math.sin(TH); y = cy - r * Math.cos(TH); dist = along;
    } else {
      // after the finish line: round the corner, then run onto the flat and ease to a stop at the soft buffer
      const v = sh.vf * L.pxPerM, fd = L.flat - r * 1.15, tStop = 2 * fd / v, tau = Math.min(tr - sh.tf, tStop);
      const d = v * tau - 0.5 * (v / tStop) * tau * tau;
      const arc = r * TH, [ox, oy] = off(o.lane), cx = L.sx1 + ox, cy = L.sy1 + oy;
      if (d < arc) { const q = TH - d / r; x = cx + r * Math.sin(q); y = cy - r * Math.cos(q); }
      else { x = cx + (d - arc); y = cy - r; }
      dist = L.slopePx + d;
    }
    return { x, y, r, phi: dist / r, tr, done, frac: done ? 1 : 0.5 * sh.a * tr * tr / LEN };
  }

  // ---------- drawing the ramp ----------
  function ramp(s, a, ice = 0) {
    if (a <= 0) return;
    const { g } = s, P = PLAT(), end = L.slopePx + L.flat + 0.6 * L.R;
    const edge = (lane) => [profile(lane, -P), profile(lane, 0), profile(lane, L.slopePx), profile(lane, end)];
    const f = edge(-0.6), b = edge(2.6);
    g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'source-over';
    // top surface
    g.beginPath(); f.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    b.slice().reverse().forEach((p) => g.lineTo(p[0], p[1])); g.closePath();
    const top = g.createLinearGradient(0, L.sy0 - 2.6 * L.dy, 0, L.yF);
    top.addColorStop(0, 'rgba(46,58,112,0.55)'); top.addColorStop(1, 'rgba(28,36,78,0.7)');
    g.fillStyle = top; g.fill();
    // front face of the wedge
    const base = L.yF + L.thick;
    g.beginPath(); f.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.lineTo(f[3][0], base); g.lineTo(f[0][0], base); g.closePath();
    const face = g.createLinearGradient(0, f[0][1], 0, base);
    face.addColorStop(0, 'rgba(24,30,64,0.95)'); face.addColorStop(1, 'rgba(10,13,30,0.95)');
    g.fillStyle = face; g.fill();
    // the end of the flat run and the left end of the platform (short faces)
    g.beginPath(); g.moveTo(f[3][0], f[3][1]); g.lineTo(b[3][0], b[3][1]); g.lineTo(b[3][0], b[3][1] + L.thick); g.lineTo(f[3][0], base); g.closePath();
    g.fillStyle = 'rgba(18,22,48,0.95)'; g.fill();
    g.restore();
    // lane dividers, then the glowing edges
    for (const ln of [0.5, 1.5]) {
      const e = edge(ln);
      D.glowLine(s, e, '150,165,230', 0.18 * a, 0.8);
    }
    D.glowLine(s, f, '170,190,255', 0.85 * a, 1.4);
    D.glowLine(s, b, '170,190,255', 0.45 * a, 1.1);
    D.line(s, f[0][0], f[0][1], f[0][0], base, '170,190,255', 0.35 * a, 1);
    D.line(s, f[0][0], base, f[3][0], base, '170,190,255', 0.35 * a, 1);
    // finish line across the lanes at the bottom of the slope
    const p1 = profile(-0.6, L.slopePx), p2 = profile(2.6, L.slopePx);
    D.line(s, p1[0], p1[1], p2[0], p2[1], C.white, 0.75 * a, 1.6, [4, 4]);
    // soft buffers at the end of each lane
    for (let ln = 0; ln <= 2; ln++) {
      const p = profile(ln, end - 0.3 * L.R);
      s.g.fillStyle = `rgba(120,130,170,${0.55 * a})`;
      s.g.fillRect(p[0] - 0.15 * L.R, p[1] - 1.1 * L.R, 0.4 * L.R, 1.1 * L.R);
    }
  }
  function dims(s, a) {
    if (a <= 0) return;
    const fs = L.fs, P = PLAT();
    const top = profile(-0.6, 0), bot = profile(-0.6, L.slopePx);
    // height of the slope
    const x = top[0] + 0.05 * (L.sx1 - L.sx0);
    D.arrow(s, x, L.yF - 2, x, top[1] + 3 + 0.05 * (L.sx1 - L.sx0) * Math.tan(TH), C.muted, 0.9 * a, '', { width: 1.3, head: 6, blur: 0 });
    D.arrow(s, x, top[1] + 0.05 * (L.sx1 - L.sx0) * Math.tan(TH) + 8, x, L.yF, C.muted, 0.9 * a, '', { width: 1.3, head: 6, blur: 0 });
    D.text(s, 'h = 0.50 m', x + fs * 0.5, (L.yF + top[1]) / 2 + fs * 0.9, fs, a, D.sans(fs, 600), C.muted, 'left');
    // angle at the bottom
    const rr = Math.min(2.6 * L.R, (L.sx1 - L.sx0) * 0.3);
    s.g.strokeStyle = `rgba(${C.muted},${0.9 * a})`; s.g.lineWidth = 1.3;
    s.g.beginPath(); s.g.arc(bot[0], bot[1], rr, Math.PI, Math.PI + TH); s.g.stroke();
    D.text(s, '20°', bot[0] - rr - fs * 1.6, bot[1] - fs * 0.45, fs, a, D.sans(fs, 600), C.muted);
    void P;
  }

  // ---------- drawing the objects ----------
  function drawObj(s, kind, x, y, r, phi, rgb, a, heavy = false) {
    const { g } = s; if (a <= 0) return;
    g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'source-over';
    // soft shadow-glow
    g.shadowColor = `rgba(${rgb},0.75)`; g.shadowBlur = Math.max(6, r * 0.7);
    if (kind === 'hoop') {
      const w = r * (heavy ? 0.3 : 0.2);
      g.fillStyle = `rgba(${rgb},0.06)`; g.beginPath(); g.arc(x, y, r - w, 0, Math.PI * 2); g.fill();
      g.strokeStyle = `rgba(${rgb},0.95)`; g.lineWidth = w;
      g.beginPath(); g.arc(x, y, r - w / 2, 0, Math.PI * 2); g.stroke();
      g.shadowBlur = 0;
      // bright marks on the rim show the rotation
      g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = w * 0.75; g.lineCap = 'round';
      for (let k = 0; k < 3; k++) { const q = phi + k * 2 * Math.PI / 3; g.beginPath(); g.arc(x, y, r - w / 2, q - 0.2, q + 0.2); g.stroke(); }
    } else if (kind === 'disc') {
      const face = g.createRadialGradient(x, y, 0, x, y, r);
      face.addColorStop(0, `rgba(${rgb},0.55)`); face.addColorStop(1, `rgba(${rgb},0.85)`);
      g.fillStyle = face; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.shadowBlur = 0;
      g.strokeStyle = 'rgba(235,235,255,0.9)'; g.lineWidth = Math.max(1, r * 0.09);
      g.beginPath(); g.arc(x, y, r - g.lineWidth / 2, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = Math.max(1, r * 0.1); g.lineCap = 'round';
      g.beginPath();
      for (let k = 0; k < 3; k++) { const q = phi + k * 2 * Math.PI / 3; g.moveTo(x + Math.cos(q) * r * 0.18, y + Math.sin(q) * r * 0.18); g.lineTo(x + Math.cos(q) * r * 0.86, y + Math.sin(q) * r * 0.86); }
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(x, y, r * 0.12, 0, Math.PI * 2); g.fill();
    } else {
      // a shaded ball, lit from the top left (the light doesn't turn), with a band that turns with it
      const body = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
      body.addColorStop(0, 'rgba(235,255,245,1)'); body.addColorStop(0.25, `rgba(${rgb},1)`); body.addColorStop(1, 'rgba(12,50,36,1)');
      g.fillStyle = body; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.shadowBlur = 0;
      g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
      g.translate(x, y); g.rotate(phi);
      g.lineWidth = Math.max(1.2, r * 0.13);
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(0, 0, r * 0.97, r * 0.38, 0, 0, Math.PI); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(0, 0, r * 0.97, r * 0.38, 0, Math.PI, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(0, r * 0.62, r * 0.11, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    g.restore();
  }

  // ---------- the panel (scoreboard, then energy bars) ----------
  const ORD = ['1st', '2nd', '3rd'];
  function panel(s, t, ph, a) {
    if (a <= 0) return;
    const { g } = s, fs = L.fs, x0 = L.px0, x1 = L.px1, y0 = L.py0, y1 = L.py1;
    const rows = ph.objs.slice().sort((p, q) => q.lane - p.lane);   // back lane at the top, as on the slope
    const headH = fs * 1.9, rowH = Math.min((y1 - y0 - headH) / 3, fs * 3.2);
    const h = headH + rowH * rows.length + fs * 0.4;
    g.save(); g.globalAlpha = a;
    g.fillStyle = 'rgba(14,18,40,0.72)'; g.strokeStyle = 'rgba(150,165,230,0.35)'; g.lineWidth = 1;
    g.beginPath(); g.roundRect ? g.roundRect(x0, y0, x1 - x0, h, 8) : g.rect(x0, y0, x1 - x0, h); g.fill(); g.stroke();
    g.restore();
    const tr = (t - ph.race) / SLOW, last = Math.max(...ph.objs.map((o) => SHAPES[o.sh].tf));
    const pad = fs * 0.7, hy = y0 + headH * 0.55;
    // heading
    if (ph.mode === 'energy') {
      const k1 = x0 + pad, sw = fs * 0.9;
      g.fillStyle = `rgba(${KE_T},${a})`; g.fillRect(k1, hy - sw / 2, sw, sw);
      D.text(s, '½mv² moving along', k1 + sw * 1.5, hy, fs, a, D.sans(fs, 600), KE_T, 'left');
      g.font = D.sans(fs, 600);
      const k2 = k1 + sw * 1.5 + g.measureText('½mv² moving along').width + fs * 1.2;
      g.fillStyle = `rgba(${KE_R},${a})`; g.fillRect(k2, hy - sw / 2, sw, sw);
      D.text(s, '½Iω² spinning', k2 + sw * 1.5, hy, fs, a, D.sans(fs, 600), KE_R, 'left');
    } else {
      let head = 'Which reaches the bottom first?';
      if (tr >= 0) head = tr < last ? `Race time: ${tr.toFixed(2)} s` : (ph.mode === 'tie' ? 'A tie!' : 'Finishing times');
      if (tr >= 0 && tr < last && L.W >= 520) head += '  (slow motion)';
      D.text(s, head, x0 + pad, hy, fs, a, D.sans(fs, 600), C.text, 'left');
    }
    // rows
    g.font = D.sans(fs, 600);
    const nameW = Math.max(...rows.map((o) => g.measureText(o.row || SHAPES[o.sh].name).width)) + fs * 0.9, valW = fs * (ph.mode === 'energy' ? 5.2 : 5.9);
    const finishers = ph.objs.map((o) => SHAPES[o.sh].tf).sort((p, q) => p - q);
    rows.forEach((o, i) => {
      const sh = SHAPES[o.sh], cy = y0 + headH + rowH * (i + 0.5), ir = Math.min(rowH * 0.32, fs * 0.8);
      let al = a;
      if (ph.mode === 'energy') {          // light up the row the caption is talking about
        const focus = t > 36.6 && t < 53.9 ? (t < 42.5 ? 'hoop' : t < 48.1 ? 'disc' : 'ball') : null;
        if (focus && focus !== o.sh) al *= 0.35;
      }
      drawObj(s, o.sh, x0 + pad + ir, cy, ir * (o.size > 1 ? 1 : o.size < 1 ? 0.6 : 0.85), 0, sh.rgb, al, o.heavy);
      D.text(s, o.row || sh.name, x0 + pad + ir * 2 + fs * 0.5, cy, fs, al, D.sans(fs, 600), sh.rgb, 'left');
      const bx0 = x0 + pad + ir * 2 + fs * 0.5 + nameW, bx1 = x1 - pad - valW - fs * 0.4;
      const m = motion(o, t, ph.race), done = tr >= sh.tf;
      if (ph.mode === 'energy') {
        const bh = Math.max(10, Math.min(rowH * 0.5, fs * 1.3)), by = cy - bh / 2, bw = bx1 - bx0;
        g.save(); g.globalAlpha = al;
        g.strokeStyle = 'rgba(200,210,240,0.55)'; g.lineWidth = 1; g.setLineDash([3, 3]); g.strokeRect(bx0, by, bw, bh); g.setLineDash([]);
        const f = clamp(m.frac, 0, 1), wt = bw * f * sh.trans, wr = bw * f * (1 - sh.trans);
        g.fillStyle = `rgba(${KE_T},0.95)`; g.fillRect(bx0, by, wt, bh);
        g.fillStyle = `rgba(${KE_R},0.95)`; g.fillRect(bx0 + wt, by, wr, bh);
        g.restore();
        const pf = Math.max(9, Math.round(bh * 0.72));
        if (m.done) {
          if (wt > pf * 2.6) D.text(s, `${Math.round(sh.trans * 100)}%`, bx0 + wt / 2, cy, pf, al, D.sans(pf, 700), '10,14,30');
          if (wr > pf * 2.6) D.text(s, `${Math.round((1 - sh.trans) * 100)}%`, bx0 + wt + wr / 2, cy, pf, al, D.sans(pf, 700), '10,14,30');
          D.text(s, `${sh.vf.toFixed(2)} m s⁻¹`, x1 - pad, cy, fs, al, D.sans(fs, 600), C.text, 'right');
        }
        else D.text(s, '= mgh', bx1 + fs * 0.5, cy, fs, al * 0.75, D.sans(fs), C.muted, 'left');
      } else {
        // progress along the slope
        D.line(s, bx0, cy, bx1, cy, '200,210,240', 0.25 * al, 2);
        const px = lerp(bx0, bx1, clamp(m.frac, 0, 1));
        if (tr > 0) D.line(s, bx0, cy, px, cy, sh.rgb, al, 3);
        D.glowDot(s, px, cy, 7, sh.rgb, al * (tr > 0 ? 1 : 0.5));
        if (done) {
          const place = ph.mode === 'tie' ? '=' : ORD[finishers.indexOf(sh.tf)];
          D.text(s, `${sh.tf.toFixed(2)} s`, x1 - pad - fs * 2.6, cy, fs, al, D.sans(fs, 600), C.text, 'right');
          D.text(s, place, x1 - pad, cy, fs, al, D.sans(fs, 700), place === '1st' || place === '=' ? C.light : C.muted, 'right');
        } else if (tr < 0) {
          const pulse = 0.55 + 0.45 * Math.sin(s.clock * 3 + i);
          D.text(s, '?', x1 - pad - fs * 0.5, cy, Math.round(fs * 1.3), al * pulse, D.sans(Math.round(fs * 1.3), 700), C.light, 'right');
        }
      }
    });
  }

  // ---------- closing equations ----------
  function closing(s, t) {
    const ea = fade(t, 77.8, 85.4, 0.9, 0.8); if (ea <= 0) return;
    const { g } = s;
    g.fillStyle = `rgba(4,6,13,${0.78 * ea})`; g.fillRect(0, 0, s.W, s.H);
    const s1 = Math.round(clamp(s.W / 22, 22, 54)), s2 = Math.round(clamp(s.W / 46, 13, 22)), y = s.H * (L.tall ? 0.3 : 0.3);
    // Eₖ = ½mv² + ½Iω², with a proper subscript k
    const rest = ' = ½mv² + ½Iω²', sub = Math.round(s1 * 0.6);
    g.font = D.serif(s1); const wE = g.measureText('E').width, wR = g.measureText(rest).width;
    g.font = D.serif(sub); const wk = g.measureText('k').width;
    const xs = s.W / 2 - (wE + wk + wR) / 2;
    D.text(s, 'E', xs, y, s1, ea, D.serif(s1), C.text, 'left');
    D.text(s, 'k', xs + wE, y + s1 * 0.25, sub, ea, D.serif(sub), C.text, 'left');
    D.text(s, rest, xs + wE + wk, y, s1, ea, D.serif(s1), C.text, 'left');
    D.text(s, 'v = ωr', s.W / 2, y + s1 * 1.35, Math.round(s1 * 0.8), ea, D.serif(Math.round(s1 * 0.8)), C.text);
    // the three moments of inertia, in their colours
    const items = [['hoop  I = mr²', SHAPES.hoop.rgb], ['disc  I = ½mr²', SHAPES.disc.rgb], ['ball  I = ⅖mr²', SHAPES.ball.rgb]];
    g.font = D.sans(s2, 600);
    const gap = s2 * 1.6, widths = items.map(([txt]) => g.measureText(txt).width), total = widths.reduce((p, q) => p + q, 0) + gap * 2;
    const yI = y + s1 * 2.5;
    if (total < s.W - 30) {
      let x = s.W / 2 - total / 2;
      items.forEach(([txt, rgb], i) => { D.text(s, txt, x, yI, s2, ea, D.sans(s2, 600), rgb, 'left'); x += widths[i] + gap; });
    } else items.forEach(([txt, rgb], i) => D.text(s, txt, s.W / 2, yI + i * s2 * 1.4, s2, ea, D.sans(s2, 600), rgb));
    const yS = yI + (total < s.W - 30 ? s2 * 2.2 : s2 * 4.9);
    g.font = D.sans(s2);
    D.text(s, D.wrap(s, 'The more of the mass is far from the axis, the larger I is compared with mr², and the slower it rolls.', Math.min(s.W - 40, 640)), s.W / 2, yS, s2, ea * 0.9, D.sans(s2));
  }

  Anim.register('rolling', {
    duration: DURATION,
    poster: realOf(21),
    // score: race-day tension (D major, a square-wave pad with a steady flutter, a low drone)
    music: { chords: [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]], bar: 5, pad: 'square', cutoff: 900, drone: 0.09, tremolo: 1.5, volume: 0.77 },
    resize: layout,
    info: { story, realOf, WAITS, CAPS, PHASES, SHAPES, SLOW },
    frame(s, tr) {
      const t = story(tr);
      D.background(s, 0.26);
      const on = smooth((t - 3.6) / 1) * (1 - smooth((t - 85.2) / 0.7));
      // a slow, continuous camera drift (on the real clock) over the slope and the objects, so the picture is never
      // still, even while the objects wait at rest behind the gate; slope and objects move together, so the physics
      // is unchanged. The panel and the captions stay put.
      const g = s.g, fx = (L.sx0 + L.sx1) / 2, fy = (L.sy0 + L.yF) / 2;
      const zoom = 1 + 0.06 * (0.5 - 0.5 * Math.cos(2 * Math.PI * tr / 13));
      const panX = 0.02 * L.W * Math.sin(2 * Math.PI * tr / 17), panY = 0.012 * L.H * Math.sin(2 * Math.PI * tr / 21 + 1);
      g.save(); g.translate(fx + panX, fy + panY); g.scale(zoom, zoom); g.translate(-fx, -fy);
      ramp(s, on);
      dims(s, fade(t, 4.2, 24.4, 0.8, 0.8) * on);
      for (const ph of PHASES) {
        const pa = fade(t, ph.a, ph.b, 0.5, 0.5) * on; if (pa <= 0) continue;
        // back lanes first, so nearer objects are drawn on top
        for (const o of ph.objs.slice().sort((p, q) => q.lane - p.lane)) {
          const m = motion(o, t, ph.race), sh = SHAPES[o.sh];
          drawObj(s, o.sh, m.x, m.y, m.r, m.phi, sh.rgb, pa, o.heavy);
          // name beside each object at the start
          const la = pa * (1 - smooth((t - ph.race) / 0.6));
          if (la > 0) D.text(s, o.label, m.x - m.r - L.fs * 0.4, m.y, L.fs, la, D.sans(L.fs, 600), sh.rgb, 'right');
        }
      }
      // the start gate lifts as each race begins
      for (const ph of PHASES) {
        const ga = fade(t, ph.a + 0.3, ph.race + 0.4, 0.5, 0.4) * on; if (ga <= 0) continue;
        const lift = smooth((t - ph.race) / 0.4) * L.R * 2, d = 2.15 * L.R * Math.max(...ph.objs.map((o) => o.size));
        const p1 = profile(-0.6, d), p2 = profile(2.6, d);
        D.glowLine(s, [[p1[0], p1[1] - L.R * 0.5 - lift], [p2[0], p2[1] - L.R * 0.5 - lift]], C.white, ga * 0.8, 1.3);
      }
      g.restore();
      for (const ph of PHASES) {                     // the panel stays still (outside the camera drift)
        const pa = fade(t, ph.a, ph.b, 0.5, 0.5) * on; if (pa > 0) panel(s, t, ph, pa);
      }
      D.captions(s, t, CAPS);
      closing(s, t);
      if (t < 3.8) { s.g.fillStyle = `rgba(4,6,13,${0.75 * fade(t, 0, 3.6, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 3.6, 'The rolling race', 'Why does a ball beat a hoop? (HL)');
      D.vignette(s, tr, DURATION);
    },
  });
})();
