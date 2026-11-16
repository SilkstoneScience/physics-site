/* D.1 Gravitational field lines and equipotentials. Part 1: the Earth's radial field, g = GM/r² falling with distance,
   and the almost uniform field over a small patch of the surface. Part 2: the Earth and the Moon to scale, their fields
   adding as vectors along the line between them, the point P where they cancel, and the field lines of the resultant
   field near the Moon (traced point by point). Part 3 (HL): equipotentials at equal steps of potential, perpendicular
   to the field lines, no work along them, and g = −ΔV/Δr.
   Numbers (values from themes/d1.html; G from the data booklet), all checked by info.check():
   - GM_E = 6.67 × 10⁻¹¹ × 5.97 × 10²⁴ = 3.98 × 10¹⁴ N m² kg⁻¹; R_E = 6.37 × 10⁶ m.
   - Surface: g = 3.98 × 10¹⁴ ÷ (6.37 × 10⁶)² = 9.81 → 9.8 N kg⁻¹. At 2R: 9.8 ÷ 4 = 2.45 N kg⁻¹. At 3R: 9.8 ÷ 9 = 1.09 N kg⁻¹ (shown to 3 s.f., like 2.45).
   - Zoomed patch: the screen width is 0.05R = 318.5 km ("about 320 km"); the scale bar is 100 km.
   - Earth–Moon: d = 3.84 × 10⁸ m = 60.3 R_E (to scale, as are the radii: Moon 1.74 × 10⁶ m = 0.273 R_E).
     M_E/M_M = 5.97 × 10²⁴ ÷ 7.35 × 10²² = 81.2; √81.2 = 9.01; x = 9.01 ÷ 10.01 × d = 0.900d = 3.46 × 10⁸ → 3.5 × 10⁸ m.
     There, g_E = g_M = 3.98 × 10¹⁴ ÷ (3.46 × 10⁸)² = 3.3 × 10⁻³ N kg⁻¹.
   - HL: V at the surface = −3.98 × 10¹⁴ ÷ 6.37 × 10⁶ = −6.25 × 10⁷ J kg⁻¹. Equipotentials at −5.00, −3.75, −2.50, −1.25 × 10⁷:
     r = GM/|V| = 1.25R, 1.67R, 2.50R, 5.00R (gaps 0.25R, 0.42R, 0.83R, 2.5R: further apart outwards).
     Surface to the first: ΔV = 1.25 × 10⁷ J kg⁻¹ over Δr = 0.25R = 1.6 × 10⁶ m: ΔV/Δr = 7.8 N kg⁻¹ (exactly 9.81 ÷ 1.25 = 7.85,
     between g = 9.8 at R and 9.81 ÷ 1.25² = 6.3 N kg⁻¹ at 1.25R).
   Lengths in the scene are in Earth radii (R = 1). */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- physics ----------
  const G = 6.67e-11, ME = 5.97e24, MM = 7.35e22, RE = 6.37e6, DEM = 3.84e8, RMOON = 1.737e6;
  const GME = G * ME, GMM = G * MM, G0 = GME / (RE * RE);
  const RATIO = ME / MM, KR = Math.sqrt(RATIO), XP = DEM * KR / (KR + 1), GP = GME / (XP * XP);
  const DW = DEM / RE, RMW = RMOON / RE, XPW = XP / RE;                  // world units: Earth radii
  const V0 = -GME / RE, VSTEP = 1.25e7;
  const RINGS = [1, 2, 3, 4].map((k) => GME / ((6.25 - 1.25 * k) * 1e7) / RE);   // 1.25, 1.67, 2.50, 5.00
  const gAt = (r) => G0 / (r * r);                                      // r in Earth radii

  // ---------- timeline (scene seconds) ----------
  const P1 = 4.6, Z0 = 40.6, Z1 = 44.8, P1E = 53.0;
  const P2 = 53.6, M0 = 78.2, M1 = 82.2, Y0 = 92.4, Y1 = 96.0, P2E = 104.6;
  const P3 = 105.2, END = 145.4, DURATION = 158;
  const CAPS = [
    [4.8, 10.2, 'The Earth pulls every mass towards its centre. Field lines show the direction of that pull.'],
    [10.4, 15.8, 'Each line points the way a small test mass is pulled: always towards the centre.'],
    [16.0, 22.0, 'Field strength is the force per unit mass: g = F/m = GM/r². At the surface, g = 9.8 N kg⁻¹.'],
    [22.2, 28.8, 'At twice the distance from the centre, g is a quarter: 9.8 ÷ 4 = 2.45 N kg⁻¹. At 3R, a ninth: 9.8 ÷ 9 = 1.09 N kg⁻¹.'],
    [29.0, 34.4, 'The lines spread out with distance: they are closer together where the field is stronger.'],
    [34.6, 40.4, 'Predict: what do the field lines look like over a small patch of the surface?'],
    [40.6, 46.6, 'Close to the surface, over a small region, the lines are almost parallel and equally spaced.'],
    [46.8, 52.6, 'The field there is almost uniform. This patch is about 320 km wide; the Earth\'s radius is 6370 km.'],
    [54.0, 59.6, 'The Moon is 3.84 × 10⁸ m away: about 60 Earth radii. Sizes and distances are to scale here.'],
    [59.8, 65.6, 'Field strength is a vector. At each point, the Earth\'s field and the Moon\'s field add.'],
    [65.8, 71.6, 'Between them, the Earth\'s field points towards the Earth and the Moon\'s towards the Moon.'],
    [71.8, 77.8, 'Predict: where do the two fields cancel? Halfway to the Moon?'],
    [78.0, 85.2, 'Not halfway: 90% of the way. The Moon has only 1/81 of the Earth\'s mass, so you must be much closer to it.'],
    [85.4, 92.2, 'Setting the two field strengths equal: G·M(Earth)/x² = G·M(Moon)/(d − x)², so x/(d − x) = √81.2 = 9.01 and x = 0.90d = 3.5 × 10⁸ m.'],
    [92.4, 98.2, 'Close up: field lines of the resultant field, calculated point by point. Near the Moon, its own field takes over.'],
    [98.4, 104.2, 'At P the resultant field is zero (counting only the Earth and the Moon): a test mass placed exactly there feels no resultant force.'],
    [105.6, 111.4, '(HL) Equipotentials join points with the same gravitational potential, −GM/r. Around the Earth they are spheres (circles in this slice).'],
    [111.6, 118.6, '(HL) At equal steps of 1.25 × 10⁷ J kg⁻¹, they are at 1.25R, 1.67R, 2.5R and 5R: further apart where the field is weaker.'],
    [118.8, 123.8, '(HL) Field lines always cross equipotentials at right angles.'],
    [124.0, 130.0, '(HL) Moving a mass along an equipotential needs no work: the potential doesn\'t change, so W = mΔV = 0.'],
    [130.2, 137.6, '(HL) The field strength is minus the potential gradient, g = −ΔV/Δr. Surface to first equipotential: 1.25 × 10⁷ ÷ 1.6 × 10⁶ = 7.8 N kg⁻¹.'],
    [137.8, 145.2, '(HL) That is an average: g falls from 9.8 to 6.3 N kg⁻¹ across the gap. The minus sign: g points to lower potential, inwards.'],
  ];
  const PAUSES = [[8.6, 0.8], [14.8, 0.4], [21.0, 0.6], [27.8, 1.2], [33.4, 0.8], [39.4, 6.0], [45.6, 0.4], [51.6, 0.8],
    [58.6, 0.6], [64.6, 0.4], [70.6, 0.6], [76.8, 6.0], [84.2, 0.8], [91.2, 1.8], [97.2, 1.8], [103.2, 2.6],
    [110.4, 3.0], [117.6, 1.8], [129.0, 0.8], [136.6, 2.4], [144.2, 2.6], [153.0, 2.0]];

  // ---------- colours ----------
  const FL = C.field, EQ = C.good, GE = '170,160,255', GM = C.light, TEST = '236,240,255';

  // ---------- part 2 close-up: field lines of the resultant field, traced once ----------
  const BOX = { x0: 0.75 * DW, x1: 1.15 * DW, y0: -15, y1: 15 };
  const field = (x, y) => {                       // direction of g (arbitrary scale: GM_M = 1)
    const ex = x, ey = y, er = Math.hypot(ex, ey), mx = x - DW, my = y, mr = Math.hypot(mx, my);
    return [-RATIO * ex / (er * er * er) - mx / (mr * mr * mr), -RATIO * ey / (er * er * er) - my / (mr * mr * mr)];
  };
  const trace = (x, y) => {
    const pts = [[x, y]];
    for (let n = 0; n < 6000; n++) {
      const rM = Math.hypot(x - DW, y), dP = Math.hypot(x - XPW, y);
      if (rM < RMW) break;
      if (x < BOX.x0 - 1 || x > BOX.x1 + 0.01 || y < BOX.y0 - 0.01 || y > BOX.y1 + 0.01) break;
      if (n > 5 && dP < 0.06) break;
      const ds = clamp(0.25 * (rM - RMW) + 0.01, 0.01, 0.05);
      const step = (px, py) => { const [fx, fy] = field(px, py), m = Math.hypot(fx, fy) || 1; return [fx / m, fy / m]; };
      const k1 = step(x, y), k2 = step(x + k1[0] * ds / 2, y + k1[1] * ds / 2), k3 = step(x + k2[0] * ds / 2, y + k2[1] * ds / 2), k4 = step(x + k3[0] * ds, y + k3[1] * ds);
      x += ds * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6; y += ds * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6;
      if (n % 3 === 2) pts.push([x, y]);
    }
    pts.push([x, y]);
    return pts;
  };
  const MOONLINES = (() => {
    const out = [], sp = 2.4;
    for (let y = -14.4; y <= 14.41; y += sp) out.push(trace(BOX.x1, y));
    for (let x = 46; x <= 68.01; x += sp) { out.push(trace(x, BOX.y1)); out.push(trace(x, BOX.y0)); }
    out.push(trace(XPW + 0.08, 0)); out.push(trace(XPW - 0.08, 0)); out.push(trace(XPW, BOX.y1)); out.push(trace(XPW, BOX.y0));
    return out;
  })();

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;                   // the 4:5 stage (buttons below the picture)
    const capFs = Math.round(clamp(W / 44, 15, 25));
    const capTop = H - capFs * (phone ? 7.8 : 5.6);
    const fs = phone ? 10 : Math.round(clamp(W / 80, 11, 16));
    const top = phone ? 6 : 8;
    let o;
    if (phone) {
      const picB = H * 0.42;
      const R1 = Math.min(W / 7.6, picB / 7.0), R3 = Math.min(W / 10.8, (picB - 6) / 10.6);
      o = { e1x: W / 2 - R1 * 1.2, e1y: picB / 2 + 2, R1, e3x: W / 2, e3y: picB / 2 + 2, R3,
        panel: { x0: W * 0.03, x1: W * 0.97, y0: H * 0.44, y1: capTop - 4 },
        ex2: W * 0.12, mx2: W * 0.9, ly2: H * 0.13, plot2: { y0: H * 0.13 + Math.max(H * 0.15, fs * 4.4), y1: capTop - fs * 2.6 } };
    } else {
      const R1 = Math.min(W * 0.56 / 7.4, capTop / 7.0), R3 = Math.min(W * 0.56 / 11, (capTop - 8) / 10.6);
      const py0 = Math.max(56, H * 0.12);
      o = { e1x: W * 0.29, e1y: capTop / 2, R1, e3x: W * 0.29, e3y: capTop / 2, R3,
        panel: { x0: W * 0.6, x1: W * 0.97, y0: py0, y1: capTop - H * 0.02 },
        ex2: W * 0.08, mx2: W * 0.92, ly2: Math.max(78, H * 0.24), plot2: { y0: Math.max(78, H * 0.24) + Math.max(H * 0.15, fs * 4.4), y1: capTop - fs * 2.8 } };
    }
    L = { W, H, phone, capFs, capTop, fs, top, ...o };
  }

  // ---------- helpers ----------
  const cam = (wx, wy, ox, oy, sc) => ({ sc, X: (x) => ox + (x - wx) * sc, Y: (y) => oy - (y - wy) * sc });
  // Liang–Barsky: the part of a segment inside the rectangle, or null
  function clipSeg(x1, y1, x2, y2, xa, ya, xb, yb) {
    let t0 = 0, t1 = 1; const dx = x2 - x1, dy = y2 - y1;
    const ps = [-dx, dx, -dy, dy], qs = [x1 - xa, xb - x1, y1 - ya, yb - y1];
    for (let i = 0; i < 4; i++) {
      if (ps[i] === 0) { if (qs[i] < 0) return null; continue; }
      const r = qs[i] / ps[i];
      if (ps[i] < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; }
    }
    return [x1 + t0 * dx, y1 + t0 * dy, x1 + t1 * dx, y1 + t1 * dy];
  }
  function head(s, x, y, ux, uy, size, rgb, a) {
    const { g } = s; if (a <= 0) return;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(${rgb},${a})`;
    g.beginPath(); g.moveTo(x + ux * size * 0.6, y + uy * size * 0.6);
    g.lineTo(x - ux * size * 0.6 - uy * size * 0.45, y - uy * size * 0.6 + ux * size * 0.45);
    g.lineTo(x - ux * size * 0.6 + uy * size * 0.45, y - uy * size * 0.6 - ux * size * 0.45); g.closePath(); g.fill();
  }
  // arrowheads every `gap` px along a screen polyline (pointing from the first point towards the last)
  function headsAlong(s, pts, gap, off, size, rgb, a) {
    if (a <= 0) return;
    let acc = gap - off;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], l = Math.hypot(x1 - x0, y1 - y0);
      if (l <= 0) continue;
      let u = 0;
      while (acc + (l - u) >= gap) {
        u += gap - acc; acc = 0;
        const f = u / l, x = lerp(x0, x1, f), y = lerp(y0, y1, f);
        if (x > -20 && x < L.W + 20 && y > -20 && y < L.H + 20) head(s, x, y, (x1 - x0) / l, (y1 - y0) / l, size, rgb, a);
      }
      acc += l - u;
    }
  }
  // text made of pieces: [text, style]: 'i' italic serif, 'r' upright serif, 's' italic subscript, 'sup' superscript, 'sans'
  function rich(s, parts, x, y, size, a, rgb = C.text, align = 'center') {
    const { g } = s; if (a <= 0) return 0;
    const font = (st) => st === 's' || st === 'sup' ? D.sans(Math.round(size * 0.7)) : st === 'si' ? D.serif(Math.round(size * 0.72)) : st === 'i' ? D.serif(size) : st === 'r' ? D.serif(size, false) : D.sans(Math.round(size * 0.9));
    const ws = parts.map(([tx, st]) => { g.font = font(st); return g.measureText(tx).width; });
    const total = ws.reduce((p, q) => p + q, 0);
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 8; g.fillStyle = `rgba(${rgb},${a})`;
    parts.forEach(([tx, st], i) => {
      g.font = font(st);
      g.fillText(tx, px, st === 's' || st === 'si' ? y + size * 0.28 : st === 'sup' ? y - size * 0.3 : y);
      px += ws[i];
    });
    g.shadowBlur = 0;
    return total;
  }

  function drawEarth(s, X, Y, r, a) {
    const { g } = s; if (a <= 0 || !(r > 0)) return;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = a;
    const at = Math.min(r * 0.18, 26);                       // atmosphere glow, never wider than 26 px
    const ag = g.createRadialGradient(X, Y, r * 0.98, X, Y, r + at);
    ag.addColorStop(0, 'rgba(120,180,255,0.45)'); ag.addColorStop(1, 'rgba(120,180,255,0)');
    g.fillStyle = ag; g.beginPath(); g.arc(X, Y, r + at, 0, 7); g.fill();
    const big = r > 3000;
    const bg = big ? g.createLinearGradient(0, Y - r, 0, Y - r + 260) : g.createRadialGradient(X - r * 0.35, Y - r * 0.4, r * 0.1, X, Y, r);
    if (big) { bg.addColorStop(0, 'rgba(70,130,210,1)'); bg.addColorStop(0.15, 'rgba(36,86,150,1)'); bg.addColorStop(1, 'rgba(10,28,60,1)'); }
    else { bg.addColorStop(0, 'rgba(110,175,255,1)'); bg.addColorStop(0.55, 'rgba(30,90,190,1)'); bg.addColorStop(1, 'rgba(8,26,70,1)'); }
    g.fillStyle = bg; g.beginPath(); g.arc(X, Y, r, 0, 7); g.fill();
    if (!big && r > 8) {                                     // a few soft land masses
      g.save(); g.beginPath(); g.arc(X, Y, r, 0, 7); g.clip();
      g.fillStyle = 'rgba(90,160,110,0.45)';
      for (const [dx, dy, rx, ry, rot] of [[-0.3, -0.25, 0.32, 0.18, 0.5], [0.25, 0.1, 0.22, 0.34, -0.3], [-0.15, 0.45, 0.2, 0.12, 0.2]]) {
        g.beginPath(); g.ellipse(X + dx * r, Y + dy * r, rx * r, ry * r, rot, 0, 7); g.fill();
      }
      g.restore();
    }
    g.globalAlpha = 1;
  }
  function drawMoon(s, X, Y, r, a) {
    const { g } = s; if (a <= 0) return;
    const rr = Math.max(r, 0.6);
    D.glowDot(s, X, Y, Math.max(rr * 3, 7), '200,205,220', 0.35 * a);
    const mg = g.createRadialGradient(X - rr * 0.3, Y - rr * 0.3, rr * 0.1, X, Y, rr);
    mg.addColorStop(0, `rgba(230,230,235,${a})`); mg.addColorStop(1, `rgba(120,122,135,${a})`);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = mg; g.beginPath(); g.arc(X, Y, rr, 0, 7); g.fill();
  }

  // ---------- part 1: the Earth's radial field ----------
  const NL = 24, DENSE = (Math.PI * 2 / NL) / 36;
  const rTest = (t) => t < 22.4 ? 1 : t < 24.4 ? lerp(1, 2, smooth((t - 22.4) / 2)) : t < 26.2 ? 2 : lerp(2, 3, smooth((t - 26.2) / 1.6));
  const zoomU = (t) => smooth((t - Z0) / (Z1 - Z0));
  function cam1(t) {
    const u = zoomU(t);
    if (u <= 0) return cam(0, 0, L.e1x, L.e1y, L.R1);
    const sc0 = L.R1, sc1 = L.W / 0.05, sc = Math.exp(lerp(Math.log(sc0), Math.log(sc1), u));
    const ox = lerp(L.e1x, L.W / 2, u), oy = lerp(L.e1y - L.R1, L.capTop * 0.8, u);
    return cam(0, 1, ox, oy, sc);
  }
  function radialLines(s, cm, a, aArrowsGlobal, aDense, aArrowsZoom) {
    const W = L.W, H = L.H, cx = cm.X(0), cy = cm.Y(0);
    const lines = [];
    for (let k = 0; k < NL; k++) lines.push([k * Math.PI * 2 / NL, 1]);
    if (aDense > 0) for (let j = -6; j <= 6; j++) if (j) lines.push([Math.PI / 2 + j * DENSE, aDense]);
    for (const [th, al] of lines) {
      const c = Math.cos(th), sn = Math.sin(th);
      const seg = clipSeg(cm.X(c * 9), cm.Y(sn * 9), cm.X(c), cm.Y(sn), -30, -30, W + 30, H + 30);
      if (!seg) continue;
      D.glowLine(s, [[seg[0], seg[1]], [seg[2], seg[3]]], FL, 0.55 * a * al, 1.3);
      const ux = -c, uy = sn;                                  // inwards, on screen
      if (aArrowsGlobal > 0 && al === 1) for (const r of [1.75, 3.3, 5.2]) {
        const x = cm.X(c * r), y = cm.Y(sn * r);
        if (x > 0 && x < W && y > 0 && y < H) head(s, x, y, ux, uy, 9, FL, 0.85 * a * aArrowsGlobal);
      }
      if (aArrowsZoom > 0) headsAlong(s, [[seg[0], seg[1]], [seg[2], seg[3]]], 110, 60, 10, FL, 0.85 * a * aArrowsZoom * al);
    }
    return { cx, cy };
  }
  function part1(s, t) {
    const a = fade(t, P1, P1E + 0.6, 0.8, 0.6); if (a <= 0) return;
    const { fs, phone } = L, cm = cam1(t), u = zoomU(t);
    const aLines = smooth((t - 5.0) / 2.5);
    radialLines(s, cm, a * aLines, 1 - smooth(u * 3), smooth((u - 0.45) / 0.4), smooth((u - 0.92) / 0.08) * smooth((t - Z1) / 0.6));
    drawEarth(s, cm.X(0), cm.Y(0), cm.sc, a);
    if (u < 0.3) D.text(s, 'Earth', cm.X(0), cm.Y(0), fs + 1, a * (1 - u / 0.3) * smooth((t - 5) / 1) * (1 - fade(t, 15.8, 24.2, 0.5, 0.6)), D.sans(fs + 1, 600), C.text);
    if (u < 0.2) D.text(s, 'field line', cm.X(Math.cos(Math.PI / 12 * 5) * 3.9) + fs * 0.5, cm.Y(Math.sin(Math.PI / 12 * 5) * 3.9), fs, a * smooth((t - 6.5) / 1) * fade(t, 6.5, 22, 1, 1), D.sans(fs), FL, 'left');
    // the test mass on the line θ = 0
    const tA = fade(t, 16.0, 34.4, 0.6, 0.8) * a;
    if (tA > 0) {
      const r = rTest(t), x = cm.X(r), y = cm.Y(0), gv = gAt(r);
      const len = gv * L.R1 * 1.5 / 9.8, ay = y - fs * 0.9, hd = clamp(len * 0.45, 3, 9);
      D.glowDot(s, x, y, phone ? 10 : 13, TEST, tA);
      D.line(s, x, ay, x - len + hd * 0.8, ay, C.force, tA, 2.2);
      head(s, x - len + hd * 0.6, ay, -1, 0, hd * 1.6, C.force, tA);
      rich(s, [['g', 'i'], [` = ${gv >= 9.75 ? '9.8' : gv.toFixed(2)} N kg`, 'sans'], ['−1', 'sup']], x, y - fs * 2.4, fs + 2, tA, C.force);
      rich(s, [['r', 'i'], [` = ${r.toFixed(1)}`, 'sans'], ['R', 'i']], x, y + fs * 1.9, fs, 0.85 * tA, C.muted);
    }
    // closer together near the surface
    const sA = fade(t, 29.2, 34.4, 0.6, 0.6) * a;
    if (sA > 0) {
      for (const [r, lab] of [[1.35, 'close together'], [3.4, 'far apart']]) {
        const th0 = Math.PI * 2 / NL * 14, th1 = Math.PI * 2 / NL * 15, pts = [];      // lower left: away from the test mass and the graph
        for (let i = 0; i <= 12; i++) { const th = lerp(th0, th1, i / 12); pts.push([cm.X(Math.cos(th) * r), cm.Y(Math.sin(th) * r)]); }
        D.glowLine(s, pts, C.light, sA, 2);
        const tm = (th0 + th1) / 2;
        D.text(s, lab, cm.X(Math.cos(tm) * r) - fs * 0.5, cm.Y(Math.sin(tm) * r) + fs * 1.0, fs, sA, D.sans(fs, 600), C.light, 'right');
      }
    }
    // zoomed: scale bar and labels
    const zA = smooth((t - Z1) / 0.8) * a;
    if (zA > 0) {
      const bw = L.W * (100 / 318.5), bx = L.W * 0.06, by = L.capTop * 0.8 + fs * 2.6;
      D.line(s, bx, by, bx + bw, by, C.text, 0.8 * zA, 2);
      D.line(s, bx, by - 5, bx, by + 5, C.text, 0.8 * zA, 2); D.line(s, bx + bw, by - 5, bx + bw, by + 5, C.text, 0.8 * zA, 2);
      D.text(s, '100 km', bx + bw / 2, by - fs * 1.0, fs, zA, D.sans(fs, 600), C.text);
      D.text(s, 'the Earth\'s surface', L.W * 0.94, L.capTop * 0.8 + fs * 1.4, fs, 0.85 * zA, D.sans(fs), '170,200,255', 'right');
      rich(s, [['g', 'i'], [' ≈ 9.8 N kg', 'sans'], ['−1', 'sup'], [' throughout', 'sans']], L.W / 2, L.capTop * 0.12 + fs, fs + 2, zA * fade(t, Z1 + 1.5, P1E, 1, 0.6), C.force);
    }
    // the g–r graph
    panelGR(s, t, a * (1 - smooth((t - Z0) / 0.8)) * smooth((t - 15.6) / 1.0));
  }
  function panelBox(s, a) {
    const { g } = s, p = L.panel;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(12,18,40,${0.82 * a})`;
    g.beginPath(); g.roundRect(p.x0, p.y0, p.x1 - p.x0, p.y1 - p.y0, 10); g.fill();
  }
  function panelGR(s, t, a) {
    if (a <= 0) return;
    panelBox(s, a);
    const { fs } = L, p = L.panel, x0 = p.x0 + fs * 3.6, x1 = p.x1 - fs * 1.2, y0 = p.y0 + fs * 2.4, y1 = p.y1 - fs * 2.6;
    const X = (r) => x0 + r / 4 * (x1 - x0), Y = (gv) => y1 - gv / 10 * (y1 - y0);
    D.line(s, x0, y1, x1, y1, C.muted, 0.6 * a, 1.2); D.line(s, x0, y1, x0, y0 - fs * 0.6, C.muted, 0.6 * a, 1.2);
    for (const v of [0, 2.45, 9.8]) { D.line(s, x0 - 3, Y(v), x0, Y(v), C.muted, 0.6 * a); D.text(s, v === 2.45 ? '2.45' : String(v), x0 - 5, Y(v), fs - 1, 0.75 * a, D.sans(fs - 1), C.muted, 'right'); }
    for (const r of [1, 2, 3, 4]) { D.line(s, X(r), y1, X(r), y1 + 3, C.muted, 0.6 * a); D.text(s, r === 1 ? 'R' : `${r}R`, X(r), y1 + fs * 0.9, fs - 1, 0.75 * a, D.serif(fs - 1), C.muted); }
    rich(s, [['g', 'i'], [' / N kg', 'sans'], ['−1', 'sup']], x0 - fs * 0.6, y0 - fs * 1.3, fs, 0.85 * a, C.muted, 'left');
    rich(s, [['r', 'i'], [' (from the centre)', 'sans']], (x0 + x1) / 2, y1 + fs * 2.0, fs - 1, 0.75 * a, C.muted);
    const pts = []; for (let i = 0; i <= 90; i++) { const r = 1 + 3 * i / 90; pts.push([X(r), Y(gAt(r))]); }
    D.glowLine(s, pts, C.force, a, 1.8);
    D.text(s, 'g = GM/r²', X(2.4), Y(gAt(1.5)), fs, 0.9 * a, D.serif(fs), C.force, 'left');
    const tA = fade(t, 16.0, 40.4, 0.6, 0.8);
    if (tA > 0) {
      const r = rTest(t);
      D.line(s, X(r), y1, X(r), Y(gAt(r)), C.force, 0.4 * a * tA, 1, [3, 3]);
      D.glowDot(s, X(r), Y(gAt(r)), 9, C.force, a * tA);
    }
  }

  // ---------- part 2: the Earth and the Moon ----------
  const xTest = (t) => t < M0 ? 0.55 * DW : lerp(0.55 * DW, XPW, smooth((t - M0) / (M1 - M0)));
  const z2U = (t) => smooth((t - Y0) / (Y1 - Y0));
  function cam2(t) {
    const u = z2U(t), sc0 = (L.mx2 - L.ex2) / DW;
    if (u <= 0) return cam(0, 0, L.ex2, L.ly2, sc0);
    const tx = 0.95 * DW, sc1 = L.W / (0.32 * DW), sc = Math.exp(lerp(Math.log(sc0), Math.log(sc1), u));
    const ox = lerp(L.ex2 + tx * sc0, L.W / 2, u), oy = lerp(L.ly2, L.capTop * 0.48, u);
    return cam(tx, 0, ox, oy, sc);
  }
  const gE = (xm) => GME / (xm * xm), gMoon = (xm) => GMM / ((DEM - xm) * (DEM - xm));
  function part2(s, t) {
    const a = fade(t, P2, P2E + 0.6, 0.8, 0.6); if (a <= 0) return;
    const { fs, phone } = L, cm = cam2(t), u = z2U(t);
    const lA = 1 - smooth((u - 0.2) / 0.5);
    // the line joining the centres, and the distance
    D.line(s, cm.X(0), cm.Y(0), cm.X(DW), cm.Y(0), C.muted, 0.35 * a * lA, 1, [4, 5]);
    // the distance, below the line, a quarter of the way along (clear of the test mass and of the buttons at the top right)
    if (lA > 0) D.text(s, 'd = 3.84 × 10⁸ m', cm.X(DW * 0.25), L.ly2 + fs * 1.5, fs, 0.85 * a * lA * smooth((t - 55) / 1) * fade(t, 55, 66.0, 1, 0.8), D.sans(fs), C.muted);
    // close-up field lines
    const fA = smooth((u - 0.55) / 0.45) * a;
    if (fA > 0) {
      for (const ln of MOONLINES) {
        const pts = ln.map(([x, y]) => [cm.X(x), cm.Y(y)]);
        D.glowLine(s, pts, FL, 0.55 * fA, 1.2);
        headsAlong(s, pts, 120, 50, 9, FL, 0.85 * fA * smooth((t - Y1) / 0.6));
      }
    }
    drawEarth(s, cm.X(0), cm.Y(0), cm.sc, a);
    drawMoon(s, cm.X(DW), cm.Y(0), RMW * cm.sc, a);
    D.text(s, 'Earth', cm.X(0), cm.Y(0) - Math.max(cm.sc * 1.2, 8) - fs * 0.7, fs, a * lA, D.sans(fs, 600), C.text);
    D.text(s, 'Moon', cm.X(DW) - (u > 0.5 ? 0 : fs * 0.4), cm.Y(0) - Math.max(RMW * cm.sc * 1.3, 8) - fs * 0.7, fs, a, D.sans(fs, 600), C.text, u > 0.5 ? 'center' : 'right');
    // P
    const pA = smooth((t - 79.5) / 1) * a;
    if (pA > 0) {
      D.line(s, cm.X(XPW), cm.Y(0) - fs * 1.2, cm.X(XPW), cm.Y(0) + fs * 1.2, C.text, 0.7 * pA * lA, 1);
      const lab = u > 0.5 ? 'P: resultant g = 0' : 'P';
      D.text(s, lab, cm.X(XPW), cm.Y(0) + (u > 0.5 ? -fs * 1.8 : fs * 2.0), fs + 1, pA, D.sans(fs + 1, 700), C.text);
      if (u > 0.5) D.glowDot(s, cm.X(XPW), cm.Y(0), 9, C.text, pA * smooth((u - 0.5) / 0.5));
    }
    // the test mass with both fields
    const tA = fade(t, 60.0, Y0 + 1.2, 0.8, 0.8) * a;
    if (tA > 0) {
      const xm = xTest(t) * RE, x = cm.X(xTest(t)), y = cm.Y(0);
      const k = L.W * 0.12 / 0.01, e = Math.min(gE(xm) * k, L.W * 0.13), m = Math.min(gMoon(xm) * k, L.W * 0.13);
      const off = phone ? 9 : 12;
      D.arrow(s, x, y - off, x - e, y - off, GE, tA * fade(t, 65.8, 200, 0.6, 1), '', { head: 8, width: 2, blur: 6 });
      D.arrow(s, x, y + off, x + m, y + off, GM, tA * fade(t, 65.8, 200, 0.6, 1), '', { head: 8, width: 2, blur: 6 });
      D.glowDot(s, x, y, phone ? 9 : 11, TEST, tA);
      // arrow labels until the test mass reaches P (then the P label takes the space above it)
      if (e > 20) D.text(s, 'Earth\'s field', x - e / 2, y - off - fs * 1.0, fs - 1, tA * fade(t, 66.2, M1 - 0.6, 0.6, 0.6), D.sans(fs - 1), GE);
      if (t < M0) D.text(s, 'Moon\'s field (tiny here)', x + 8, y + off + fs * 1.1, fs - 1, tA * fade(t, 66.6, M0, 0.6, 0.6), D.sans(fs - 1), GM, 'left');
      else if (m > 20) D.text(s, 'Moon\'s field', x + m / 2, y + off + fs * 1.0, fs - 1, tA * fade(t, M0, M1 - 0.6, 0.4, 0.6), D.sans(fs - 1), GM);
    }
    panelLine(s, t, a * smooth((t - 59.6) / 1) * (1 - smooth(u / 0.4)), cm);
  }
  function panelLine(s, t, a, cm) {
    if (a <= 0) return;
    const { fs } = L, x0 = cm.X(0), x1 = cm.X(DW), y0 = L.plot2.y0, y1 = L.plot2.y1;
    const { g } = s;
    g.fillStyle = `rgba(12,18,40,${0.7 * a})`; g.beginPath(); g.roundRect(Math.max(2, x0 - fs * 3.4), y0 - fs * 2.2, x1 - x0 + fs * 4.2, y1 - y0 + fs * 4.4, 10); g.fill();
    const X = (xm) => x0 + xm / DEM * (x1 - x0), Y = (gv) => y1 - gv / 0.01 * (y1 - y0);
    D.line(s, x0, y1, x1, y1, C.muted, 0.6 * a, 1.2); D.line(s, x0, y1, x0, y0 - fs * 0.5, C.muted, 0.6 * a, 1.2);
    for (const v of [0, 0.005, 0.01]) { D.line(s, x0 - 3, Y(v), x0, Y(v), C.muted, 0.6 * a); D.text(s, String(v), x0 - 5, Y(v), fs - 1, 0.75 * a, D.sans(fs - 1), C.muted, 'right'); }
    for (const xm of [0, 1e8, 2e8, 3e8]) D.text(s, String(xm / 1e8), X(xm), y1 + fs * 0.9, fs - 1, 0.75 * a, D.sans(fs - 1), C.muted);
    rich(s, [['distance from the Earth\'s centre / 10', 'sans'], ['8', 'sup'], [' m', 'sans']], (x0 + x1) / 2, y1 + fs * 2.1, fs - 1, 0.75 * a, C.muted);
    rich(s, [['field strength / N kg', 'sans'], ['−1', 'sup']], x0 - fs * 0.4, y0 - fs * 1.2, fs - 1, 0.8 * a, C.muted, 'left');
    const e = [], m = [];
    for (let i = 0; i <= 160; i++) {
      const xm = lerp(1.95e8, DEM - RMOON, i / 160); if (gE(xm) <= 0.0102) e.push([X(xm), Y(Math.min(gE(xm), 0.0102))]);
      const xn = lerp(0.6e8, DEM - 2.18e7, i / 160); m.push([X(xn), Y(Math.min(gMoon(xn), 0.0102))]);
    }
    D.glowLine(s, e, GE, a, 1.8); D.glowLine(s, m, GM, a, 1.8);
    D.text(s, 'Earth\'s field', X(2.55e8), Y(0.0072), fs - 1, a, D.sans(fs - 1, 600), GE, 'left');
    D.text(s, 'Moon\'s field', X(3.56e8), Y(0.0093), fs - 1, a, D.sans(fs - 1, 600), GM, 'right');
    const pA = smooth((t - 79.5) / 1) * a;
    if (pA > 0) {
      D.line(s, X(XP), y1, X(XP), Y(GP), C.text, 0.6 * pA, 1, [3, 3]);
      D.glowDot(s, X(XP), Y(GP), 8, C.text, pA);
      D.text(s, 'P', X(XP), y1 + fs * 0.9, fs, pA, D.sans(fs, 700), C.text);
    }
    const tA = fade(t, 60.0, 200, 0.8, 1);
    const xm = xTest(t) * RE;
    D.line(s, X(xm), y0 - fs * 0.3, X(xm), y1, TEST, 0.3 * a * tA, 1, [2, 4]);
  }

  // ---------- part 3 (HL): equipotentials ----------
  const RLAB = ['−5', '−3.75', '−2.5', '−1.25'];
  function part3(s, t) {
    const a = fade(t, P3, END + 0.8, 0.8, 0.8); if (a <= 0) return;
    const { fs, phone, g } = { ...L, g: s.g }, cm = cam(0, 0, L.e3x, L.e3y, L.R3);
    // field lines
    for (let k = 0; k < NL; k++) {
      const th = k * Math.PI * 2 / NL, c = Math.cos(th), sn = Math.sin(th);
      const seg = clipSeg(cm.X(c * 9), cm.Y(sn * 9), cm.X(c), cm.Y(sn), -30, -30, L.W + 30, L.H + 30);
      if (!seg) continue;
      D.glowLine(s, [[seg[0], seg[1]], [seg[2], seg[3]]], FL, 0.4 * a, 1.2);
      for (const r of [2.1, 3.6]) { const x = cm.X(c * r), y = cm.Y(sn * r); head(s, x, y, -c, sn, 8, FL, 0.7 * a); }
    }
    // equipotentials, appearing one by one
    RINGS.forEach((r, i) => {
      const ra = smooth((t - (106.2 + i * 1.2)) / 1.0) * a; if (ra <= 0) return;
      g.globalCompositeOperation = 'source-over';
      g.strokeStyle = `rgba(${EQ},${0.85 * ra})`; g.lineWidth = 1.8; g.setLineDash([7, 6]);
      g.shadowColor = `rgba(${EQ},${0.7 * ra})`; g.shadowBlur = 6;
      g.beginPath(); g.arc(cm.X(0), cm.Y(0), r * cm.sc, 0, 7); g.stroke(); g.setLineDash([]); g.shadowBlur = 0;
      // labels where each ring crosses the horizontal line to the right, alternately above and below it
      const lt = smooth((t - 111.8 - i * 0.5) / 0.8) * a;
      if (lt > 0) {
        const lx = cm.X(r), ly = cm.Y(0) + (i % 2 ? 1 : -1) * fs * 0.95, txt = RLAB[i];
        if (phone && i < 2) { /* phones: the inner rings are too close to the Earth to label; the graph shows them */ }
        else {
          g.font = D.sans(fs - 1, 600); const tw = g.measureText(txt).width;
          g.fillStyle = `rgba(6,10,24,${0.75 * lt})`; g.beginPath(); g.roundRect(lx - tw / 2 - 3, ly - fs * 0.6, tw + 6, fs * 1.2, 4); g.fill();
          D.text(s, txt, lx, ly, fs - 1, lt, D.sans(fs - 1, 600), EQ);
          // the outer label says what all the numbers are in
          if (i === 3) rich(s, [['(all × 10', 'sans'], ['7', 'sup'], [' J kg', 'sans'], ['−1', 'sup'], [')', 'sans']], lx, ly + fs * 1.2, fs - 1, lt, EQ);
        }
      }
    });
    drawEarth(s, cm.X(0), cm.Y(0), cm.sc, a);
    D.text(s, 'Earth', cm.X(0), cm.Y(0), fs, a, D.sans(fs, 600), C.text);
    // right-angle marks where the field lines at 45° and 135° cross the rings
    const rA = fade(t, 119.0, 124.4, 0.6, 0.6) * a;
    if (rA > 0) for (const th of [Math.PI / 4, Math.PI * 3 / 4]) for (const r of RINGS.slice(0, 3)) {
      const c = Math.cos(th), sn = Math.sin(th), q = 7;
      const px = cm.X(c * r), py = cm.Y(sn * r), rx = -c, ry = sn, tx = -sn, ty = -c;   // inward and along the ring (screen)
      g.strokeStyle = `rgba(${C.light},${rA})`; g.lineWidth = 1.4; g.beginPath();
      g.moveTo(px + rx * q, py + ry * q); g.lineTo(px + rx * q + tx * q, py + ry * q + ty * q); g.lineTo(px + tx * q, py + ty * q); g.stroke();
    }
    // a mass moved along the 2.5R equipotential
    const mA = fade(t, 124.2, 130.0, 0.6, 0.6) * a;
    if (mA > 0) {
      const r = RINGS[2], th = lerp(Math.PI * 0.62, Math.PI * 0.38, smooth((t - 124.8) / 4.0));
      const trail = []; for (let i = 0; i <= 30; i++) { const tt = lerp(Math.PI * 0.62, th, i / 30); trail.push([cm.X(Math.cos(tt) * r), cm.Y(Math.sin(tt) * r)]); }
      D.glowLine(s, trail, C.light, mA, 2.2);
      const x = cm.X(Math.cos(th) * r), y = cm.Y(Math.sin(th) * r);
      D.glowDot(s, x, y, 11, TEST, mA);
      rich(s, [['W', 'i'], [' = 0', 'sans']], x, y - fs * 1.6, fs + 2, mA, C.light);
    }
    panelVR(s, t, a * smooth((t - 107.0) / 1.0));
    // HL badge
    const hb = smooth((t - P3) / 0.8) * fade(t, P3, END, 0.8, 0.6) * a;
    if (hb > 0) {
      const bx = phone ? 8 : 14, by = phone ? 8 : 14;
      g.fillStyle = `rgba(245,161,90,${0.9 * hb})`; g.beginPath(); g.roundRect(bx, by, fs * 2.6, fs * 1.6, 5); g.fill();
      D.text(s, 'HL', bx + fs * 1.3, by + fs * 0.82, fs, hb, D.sans(fs, 700), '30,20,10');
    }
  }
  function panelVR(s, t, a) {
    if (a <= 0) return;
    panelBox(s, a);
    const { fs } = L, p = L.panel, x0 = p.x0 + fs * 3.8, x1 = p.x1 - fs * 1.4, y0 = p.y0 + fs * 3.9, y1 = p.y1 - fs * 1.4;
    const X = (r) => x0 + r / 6 * (x1 - x0), Y = (v) => y0 + (-v) / 7 * (y1 - y0);      // V in 10⁷ J kg⁻¹, 0 at the top
    D.line(s, x0, y0, x1, y0, C.muted, 0.6 * a, 1.2); D.line(s, x0, y0 - fs * 0.4, x0, y1, C.muted, 0.6 * a, 1.2);
    D.text(s, '0', x0 - 5, y0, fs - 1, 0.75 * a, D.sans(fs - 1), C.muted, 'right');
    D.text(s, '−6.25', x0 - 5, Y(-6.25), fs - 1, 0.75 * a, D.sans(fs - 1), C.muted, 'right');
    rich(s, [['V', 'i'], ['g', 'si'], [' / 10', 'sans'], ['7', 'sup'], [' J kg', 'sans'], ['−1', 'sup']], p.x0 + fs * 0.6, p.y0 + fs * 1.1, fs - 1, 0.85 * a, C.muted, 'left');
    rich(s, [['r', 'i']], x1 + 2, y0 + fs * 0.8, fs, 0.8 * a, C.muted, 'right');
    D.text(s, 'R', X(1) - fs * 0.7, Y(-6.25), fs - 1, 0.75 * a, D.serif(fs - 1), C.muted);
    const pts = []; for (let i = 0; i <= 100; i++) { const r = 1 + 5 * i / 100; pts.push([X(r), Y(-6.25 / r)]); }
    D.glowLine(s, pts, C.vel, a, 1.8);
    RINGS.forEach((r, i) => {
      const ra = smooth((t - (111.8 + i * 0.9)) / 0.8) * a; if (ra <= 0) return;
      const v = -6.25 + 1.25 * (i + 1);
      D.line(s, x0, Y(v), X(r), Y(v), EQ, 0.55 * ra, 1, [4, 4]);
      D.line(s, X(r), Y(v), X(r), y0, EQ, 0.55 * ra, 1, [2, 3]);
      D.text(s, ['1.25R', '1.67R', '2.5R', '5R'][i], X(r), y0 - fs * 0.75 - (i % 2 ? fs * 1.0 : 0), fs - 2, ra, D.sans(fs - 2, 600), EQ);
      D.glowDot(s, X(r), Y(v), 6, EQ, ra);
    });
    // the first step: ΔV over Δr
    const gA = fade(t, 130.4, END - 0.2, 0.8, 0.6) * a;
    if (gA > 0) {
      D.line(s, X(1), Y(-6.25), X(RINGS[0]), Y(-6.25), C.force, gA, 2);
      D.line(s, X(RINGS[0]), Y(-6.25), X(RINGS[0]), Y(-5), C.force, gA, 2);
      D.text(s, 'Δr', (X(1) + X(RINGS[0])) / 2, Y(-6.25) + fs * 0.9, fs - 1, gA, D.serif(fs - 1), C.force);
      D.text(s, 'ΔV', X(RINGS[0]) + 4, (Y(-6.25) + Y(-5)) / 2, fs - 1, gA, D.serif(fs - 1), C.force, 'left');
    }
  }

  // ---------- end card ----------
  function endCard(s, t) {
    const a = fade(t, END, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 46, 14, 26)), s3 = Math.round(clamp(W / 64, 11, 17));
    g.font = D.sans(s1, 300);
    const l1 = D.wrap(s, 'Gravitational fields', W - 40);
    let y = H * (phone ? 0.09 : 0.12);
    D.text(s, l1, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.5;
    const items = [
      [[['g', 'i'], [' = ', 'r'], ['GM', 'i'], ['/', 'r'], ['r', 'i'], ['2', 'sup']], C.force, 'Field lines point the way the force on a small test mass acts, and are closer together where the field is stronger.'],
      [[['fields add as vectors', 'sans']], GM, 'Between the Earth and the Moon they cancel 90% of the way to the Moon.'],
      [[['(HL)  ', 'sans'], ['V', 'i'], ['g', 'si'], [' = −', 'r'], ['GM', 'i'], ['/', 'r'], ['r', 'i'], ['   ', 'r'], ['g', 'i'], [' = −Δ', 'r'], ['V', 'i'], ['g', 'si'], ['/Δ', 'r'], ['r', 'i']], EQ, 'Equipotentials are perpendicular to field lines. No work is done moving along one.'],
    ];
    g.font = D.sans(s3);
    if (phone) {
      for (const [eq, rgb, txt] of items) {
        rich(s, eq, W / 2, y, s2, a, rgb); y += s2 * 1.1;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 36); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.8;
      }
    } else {
      // two SL items side by side, the HL item centred below them
      const colW = Math.min(W * 0.4, 420);
      const wr = items.map(([, , txt]) => D.wrap(s, txt, colW));
      const y2 = y + s2 * 1.7 + s3 * 1.3 * Math.max(wr[0].length, wr[1].length) + s2 * 1.3;
      items.forEach(([eq, rgb], i) => {
        const x = i < 2 ? W / 2 + (i ? 1 : -1) * W * 0.23 : W / 2, yy = i < 2 ? y : y2;
        rich(s, eq, x, yy + s2 * 0.4, s2, a, rgb);
        g.font = D.sans(s3); D.text(s, wr[i], x, yy + s2 * 1.7, s3, 0.85 * a, D.sans(s3));
      });
    }
  }

  Anim.register('gfield', {
    duration: DURATION,
    poster: 99,
    pauses: PAUSES,
    // score: deep and slow (G minor, a dark saw pad, a strong low drone, a little wind)
    music: { chords: [[43, 50, 55, 58], [39, 46, 55, 58], [36, 43, 51, 55], [38, 45, 50, 54]], bar: 10, pad: 'saw', cutoff: 500,
      drone: 0.14, wind: 0.3, volume: 0.54 },
    resize: layout,
    info: {
      CAPS, PAUSES, RINGS, MOONLINES,
      check: () => ({ GME, g0: G0, g2R: G0 / 4, g3R: G0 / 9, ratio: RATIO, sqrtRatio: KR, xOverD: KR / (KR + 1), XP, gP: GP,
        dInR: DW, moonInR: RMW, V0, rings: RINGS, gap1m: (RINGS[0] - 1) * RE, gAvg: VSTEP / ((RINGS[0] - 1) * RE), gAt125: G0 / (RINGS[0] ** 2),
        patchKm: 0.05 * RE / 1000 }),
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.18);
      part1(s, t);
      part2(s, t);
      part3(s, t);
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Gravitational fields', 'Field lines and equipotentials');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
