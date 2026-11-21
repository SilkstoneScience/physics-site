/* D.1 (HL) The gravitational potential well: a graph of V_g = −GM/r around the Earth, spun round into a surface.
   It is a MODEL of potential (a graph), not a picture of space (teacher's decision: curved spacetime is not in the guide).
   The satellite's path is calculated from Newton's law of gravitation (Kepler orbits, exact), never by "rolling":
   it is only DRAWN at the depth of its potential, V_g(r).
   Numbers (G = 6.67 × 10⁻¹¹ N m² kg⁻², M = 5.97 × 10²⁴ kg, R = 6.37 × 10⁶ m, m = 500 kg; checked):
   GM = 6.67e-11 × 5.97e24 = 3.98 × 10¹⁴ N m² kg⁻¹.
   V_g(R) = −3.982e14 ÷ 6.37e6 = −6.25 × 10⁷ J kg⁻¹; V_g(2R) = −3.13 × 10⁷ J kg⁻¹.
   g(R) = GM/R² = 9.81 N kg⁻¹; g(2R) = 9.81 ÷ 4 = 2.45 N kg⁻¹.
   Orbit at r₁ = 2R = 1.274 × 10⁷ m: v = √(GM/r₁) = 5590.7 m s⁻¹ (5.59 km s⁻¹); T = 2πr/v = 14 318 s = 3.98 h (4.0 hours);
     shown as 8.0 s, so sped up 14 318 ÷ 8 ≈ 1800 times.
     E_k = GMm/2r₁ = 7.81 × 10⁹ J; E_p = −GMm/r₁ = −1.563 × 10¹⁰ J; E = −7.81 × 10⁹ J.
   Transfer to r₂ = 4R (half an ellipse, a = 3R): at 2R v = √(GM(2/r₁ − 1/a)) = 6.46 km s⁻¹; at 4R v = 6.46 × 2/4 = 3.23 km s⁻¹;
     total energy while coasting −GMm/2a = −5.21 × 10⁹ J.
   Orbit at 4R: v = √(GM/r₂) = 3.95 km s⁻¹; E_k = 3.91 × 10⁹ J; E_p = −7.81 × 10⁹ J; E = −3.91 × 10⁹ J.
     ΔE = GMm/2 × (1/r₁ − 1/r₂) = 3.91 × 10⁹ J (= −3.91 − (−7.81) × 10⁹ J).
   Escape from 4R: E must reach 0, so add E_k's worth again (3.9 × 10⁹ J): v = √2 × 3.95 = 5.59 km s⁻¹ (= √(2GM/r₂)).
   From the surface: v_esc = √(2GM/R) = √(2 × 3.982e14 ÷ 6.37e6) = 1.12 × 10⁴ m s⁻¹ = 11.2 km s⁻¹.
   Drawing: lengths in Earth radii; the surface's height is y = −DEPTH × R/r (V_g to scale, with V_g(R) at y = −DEPTH). */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- physics ----------
  const G = 6.67e-11, ME = 5.97e24, GM = G * ME, RE = 6.37e6, MS = 500;
  const DEPTH = 4, RMAX = 8, RFAR = 16;                                 // the drawing's edge (8R) and how far it extends during the escape
  const ySurf = (r) => -DEPTH / r;
  // orbit timescale on screen: the circular orbit at 2R takes 8.0 s, so GM in screen units is π²/2
  const GMA = Math.PI * Math.PI / 2;
  const P1 = 8, P2 = P1 * Math.pow(2, 1.5), PT = P1 * Math.pow(1.5, 1.5);   // 8.0 s, 22.6 s, transfer ellipse 14.7 s
  const W1 = 2 * Math.PI / P1, W2 = 2 * Math.PI / P2;
  const ET = 1 / 3, AT = 3;                                             // transfer ellipse: a = 3R, e = 1/3

  // ---------- timeline (scene seconds) ----------
  // The first burst is at 110° (back left), so the transfer swings round the left to the front, and the escape burst
  // comes at 10° (right): the escape path then curves round to the back left (about 120° by 12R), rising up the screen
  // towards the V = 0 level while the camera pulls back and the surface is extended under it.
  // No pauses (teacher, 17 November 2026): one second on screen is one second of the animation throughout. While a
  // caption is read the satellite simply keeps orbiting (it does 5 laps at 2R and 2.2 at 4R), and the graph-building
  // steps (drawing, spinning) take as long as their captions. The coast between the first two bursts is exactly half the
  // transfer ellipse's period (7.35 s), and the escape burst comes one lap later than before, so at the same angle.
  const T_SPIN0 = 33.2, T_SPIN1 = 40.1, SPIN_END = 39.1, YAW_END = 50.8, T_S = 57.2, T_B1 = 97.1, T_B2 = T_B1 + PT / 2;
  const T_B3 = T_B2 + (103.6 - (68.6 + PT / 2)) + P2;                  // 154.73 s
  const T_SLIDE = 73.9, T_PANEL = 74.4;
  const END_CARD = 178.0, DURATION = 192.4;
  const TH_B1 = 110 * Math.PI / 180;
  const TH0 = TH_B1 - W1 * (T_B1 - T_S);
  const TH_B2 = TH_B1 + Math.PI;
  const TH_B3 = TH_B2 + W2 * (T_B3 - T_B2);

  const keplerE = (M) => { let E = M; for (let i = 0; i < 12; i++) E -= (E - ET * Math.sin(E) - M) / (1 - ET * Math.cos(E)); return E; };
  // Barker's equation for the escape path (a parabola with nearest point q = 4R): τ = √(2q³/GM)(D + D³/3), D = tan(ν/2)
  const Q = 4, BK = Math.sqrt(2 * Q * Q * Q / GMA);
  const barkerD = (tau) => { const c = tau / BK; let d = c < 1 ? c : Math.cbrt(3 * c); for (let i = 0; i < 30; i++) d -= (d + d * d * d / 3 - c) / (1 + d * d); return d; };

  // the satellite at scene time t: position in the orbital plane (Earth radii), and 1/a for the energy (vis-viva)
  function sat(t) {
    if (t < T_S) return null;
    if (t < T_B1) { const th = TH0 + W1 * (t - T_S); return { r: 2, th, inva: 1 / 2, piece: 1 }; }
    if (t < T_B2) {
      const E = keplerE(2 * Math.PI / PT * (t - T_B1));
      const r = AT * (1 - ET * Math.cos(E));
      const nu = 2 * Math.atan2(Math.sqrt(1 + ET) * Math.sin(E / 2), Math.sqrt(1 - ET) * Math.cos(E / 2));
      return { r, th: TH_B1 + nu, inva: 1 / AT, piece: 2 };
    }
    if (t < T_B3) return { r: 4, th: TH_B2 + W2 * (t - T_B2), inva: 1 / 4, piece: 3 };
    const d = barkerD(t - T_B3);
    return { r: Q * (1 + d * d), th: TH_B3 + 2 * Math.atan(d), inva: 0, piece: 4 };
  }
  // energies in joules, from the real radius and the vis-viva equation v² = GM(2/r − 1/a)
  function energy(p) {
    const r = p.r * RE, v2 = GM * (2 / r - p.inva / RE);
    const Ek = 0.5 * MS * v2, Ep = -GM * MS / r;
    return { Ek, Ep, E: Ek + Ep, v: Math.sqrt(v2) };
  }

  // ---------- captions ----------
  // each on screen long enough to read at no more than about 16 characters a second (the Predict one has 6 s more)
  const CAPS = [
    [4.8, 12.5, 'Around the Earth the gravitational potential is V = −GM/r: zero far away (at infinity), negative everywhere else.'],
    [12.7, 18.2, 'At the surface: V = −GM/R = −(3.98 × 10¹⁴) ÷ (6.37 × 10⁶) = −6.25 × 10⁷ J kg⁻¹.'],
    [18.4, 27.2, 'The field strength is minus the gradient of this graph: g = −ΔV/Δr. Its size is large close to the Earth, where the graph is steep.'],
    [27.4, 32.8, 'At 2R the graph is a quarter as steep: g = 9.81 ÷ 4 = 2.45 N kg⁻¹.'],
    [33.2, 39.3, 'Spin the graph round the Earth\'s centre and it sweeps out a surface: a "potential well".'],
    [39.5, 47.6, 'Its depth at each point shows the potential there. Each level ring joins points at the same potential: an equipotential.'],
    [47.8, 56.8, 'This is a model: a graph of potential, not a picture of space. Nothing slides down it; objects move because of the gravitational force.'],
    [57.2, 64.4, 'A 500 kg satellite in a circular orbit at r = 2R. Its path is worked out from Newton\'s law of gravitation.'],
    [64.6, 72.6, 'It is drawn at the depth of its potential, so it circles at a constant depth: V = −3.13 × 10⁷ J kg⁻¹ all the way round.'],
    [72.8, 79.4, 'Its speed: v = √(GM/r) = 5.59 km s⁻¹. One orbit takes 4.0 hours (here sped up about 1800 times).'],
    [79.6, 87.9, 'Eₖ = GMm/2r = 7.8 × 10⁹ J and Eₚ = −GMm/r = −15.6 × 10⁹ J. The total, E = −GMm/2r = −7.8 × 10⁹ J, is negative: it is bound.'],
    [88.1, 97.3, 'To move it up to r = 4R, a short rocket burst speeds it up, and it coasts out along half an ellipse. (You only calculate the circular orbits.)'],
    [97.5, 104.2, 'Coasting out, the gravitational force slows it: Eₖ becomes Eₚ, and the total stays the same.'],
    [104.4, 113.4, 'A second burst at 4R puts it in the higher circular orbit. It now moves more slowly: v = 3.95 km s⁻¹.'],
    [113.6, 125.0, 'But its total energy is higher: E = −3.9 × 10⁹ J. The bursts did ΔE = GMm/2 × (1/r₁ − 1/r₂) = 3.9 × 10⁹ J of work on it (ignoring the fuel\'s mass).'],
    [125.2, 138.0, 'Predict: what total energy does the satellite need to escape from the Earth completely?'],
    [138.2, 151.0, 'At least zero. At infinity Eₚ = 0 and Eₖ can\'t be negative, so it needs E = Eₖ + Eₚ ≥ 0 (exactly 0 if it only just gets there).'],
    [151.2, 160.0, 'One more burst adds 3.9 × 10⁹ J, so E = 0. Its speed rises by a factor of √2, to 5.59 km s⁻¹, and it escapes.'],
    [160.2, 168.8, 'As it moves away, the gravitational force slows it: Eₖ falls towards zero as Eₚ rises towards zero. It never comes back.'],
    [169.0, 177.6, 'From the Earth\'s surface the escape speed is v_esc = √(2GM/R) = 11.2 km s⁻¹ (ignoring air resistance), whatever the mass.'],
  ];

  // ---------- colours ----------
  const MESH = C.field, SAT = C.light, KE = C.force, PE = C.vel, TOT = C.white, BURST = '255,140,80';

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25));
    const fs = phone ? 10 : Math.round(clamp(W / 80, 11, 16));
    const capTop = H - capFs * (phone ? 7.4 : 5.4);
    L = { W, H, phone, fs, capFs, capTop };
    if (phone) {
      L.view = { x0: 6, x1: W - 6, y0: 8, y1: H * 0.55 };
      L.panel = { x0: 10, x1: W - 10, y0: H * 0.56, y1: capTop - 4 };
      L.viewWide = L.view;
    } else {
      const top = Math.max(50, H * 0.12);
      L.viewWide = { x0: W * 0.04, x1: W * 0.96, y0: top, y1: capTop - fs };
      L.view = { x0: W * 0.02, x1: W * 0.66, y0: top, y1: capTop - fs };
      L.panel = { x0: W * 0.69, x1: W * 0.97, y0: Math.max(64, H * 0.2), y1: capTop - fs * 2 };
    }
  }

  // camera and projection for the scene time (a pure function of t)
  const PITCH = 0.44;
  function view(t) {
    const spin = smooth((t - T_SPIN0) / (SPIN_END - T_SPIN0));
    const slide = L.phone ? 1 : smooth((t - T_SLIDE) / 2.5);
    const V = slide >= 1 ? L.view : {
      x0: lerp(L.viewWide.x0, L.view.x0, slide), x1: lerp(L.viewWide.x1, L.view.x1, slide),
      y0: lerp(L.viewWide.y0, L.view.y0, slide), y1: lerp(L.viewWide.y1, L.view.y1, slide) };
    const vw = V.x1 - V.x0, vh = V.y1 - V.y0, mx = (V.x0 + V.x1) / 2, my = (V.y0 + V.y1) / 2;
    // side view (a V–r graph): x from −4.5 (room for the axis label) to 8.9, up from −5.0 to 0.7
    const uB = Math.min(vw / 13.8, vh / 6.2), cxB = mx - 2.2 * uB, cyB = my - 2.15 * uB;
    // the well from above: x from −8.6 to 8.6; up from −4.7 to 3.6 at the pitch used
    const z = zoomAt(t), uW = Math.min(vw / 17.6, vh / 8.6) * z, cxW = mx, cyW = my - 0.55 * uW / z;
    const yawDrift = t > T_SPIN1 ? -0.18 * smooth((t - T_SPIN1) / (YAW_END - T_SPIN1)) : 0;
    const cam = Anim.camera(yawDrift, PITCH * spin, 60);
    return { cam, unit: lerp(uB, uW, spin), cx: lerp(cxB, cxW, spin), cy: lerp(cyB, cyW, spin), spin };
  }
  // during the escape the camera pulls back and the surface is drawn further out (to 16R), so the satellite stays on it
  const ext = (t) => smooth((t - T_B3 - 1.5) / 5.5);
  const zoomAt = (t) => 1 - 0.5 * ext(t);
  const edgeAt = (t) => RMAX + (RFAR - RMAX) * ext(t);
  const P = (vw, p) => Anim.project(vw.cam, p, vw.cx, vw.cy, vw.unit);
  const onWell = (r, th) => [r * Math.cos(th), ySurf(r), -r * Math.sin(th)];   // anticlockwise seen from above

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

  // ---------- the well ----------
  // rings at equal steps of potential: main ones every ΔV = 0.5 on the drawing's scale (y = −2.5 … −0.5, so the 8R edge is one
  // of them), faint ones half-way between; the last two (10.7R, 16R) are drawn only when the surface is extended for the escape
  const RINGS_MAIN = [1.6, 2, 2.6667, 4, 8, 16];
  const RINGS_FAINT = [1.0667, 1.1429, 1.2308, 1.3333, 1.4545, 1.7778, 2.2857, 3.2, 5.3333, 10.6667];
  // split a 3D polyline into the parts behind and in front of the well's axis, and draw one set
  function polySide(s, vw, pts3, front, rgb, a, w) {
    const c0 = P(vw, [0, -2, 0])[2];
    let run = [];
    const flush = () => { if (run.length > 1) D.glowLine(s, run, rgb, a, w); run = []; };
    for (const p of pts3) {
      const q = P(vw, p);
      if ((q[2] < c0) === front) run.push([q[0], q[1]]); else flush();
    }
    flush();
  }
  function drawWell(s, t, vw, front) {
    const spin = vw.spin;
    const sweep = 2 * Math.PI * smooth((t - T_SPIN0) / (T_SPIN1 - T_SPIN0));
    if (sweep <= 0.001) return;
    const a = fade(t, T_SPIN0, END_CARD + 0.8, 0.2, 0.8);
    const fa = front ? 0.55 : 0.28;
    // meridians (the graph, copied round)
    const NM = 32, edge = edgeAt(t);
    for (let k = 0; k < NM; k++) {
      const th = 2 * Math.PI * k / NM; if (th > sweep + 1e-6) break;
      const pts = []; for (let i = 0; i <= 60; i++) { const r = 1 + (edge - 1) * Math.pow(i / 60, 1.8); pts.push(onWell(r, th)); }
      polySide(s, vw, pts, front, MESH, fa * a * (0.5 + 0.5 * spin), 1.0);
    }
    // level rings (equipotentials), drawn as far round as the sweep has gone, and only as far out as the surface reaches
    const ring = (r, al, w, rgb = MESH) => {
      if (r > edge + 0.01) return;
      const n = Math.max(8, Math.ceil(96 * sweep / (2 * Math.PI))), pts = [];
      for (let i = 0; i <= n; i++) pts.push(onWell(r, sweep * i / n));
      polySide(s, vw, pts, front, rgb, al * a, w);
    };
    for (const r of RINGS_FAINT) ring(r, fa * 0.45, 0.8);
    for (const r of RINGS_MAIN) ring(r, fa * 1.1, 1.2);
    // the orbit radius, picked out while the satellite is there
    const o2 = fade(t, T_S - 0.5, T_B1 + 1.5, 0.8, 1.2), o4 = fade(t, T_B2 - 1, T_B3 + 3, 0.8, 1.5);
    if (o2 > 0) ring(2, o2 * 0.9 * (front ? 1 : 0.6), 1.6, SAT);
    if (o4 > 0) ring(4, o4 * 0.9 * (front ? 1 : 0.6), 1.6, SAT);
  }
  // "V = 0 at infinity": a dashed level ring above the rim
  function drawZero(s, t, vw) {
    const a = 0.55 * fade(t, T_SPIN0 + 3, END_CARD + 0.8, 1.5, 0.8); if (a <= 0) return;
    const { g } = s, pts = [], RZ = 1.06 * edgeAt(t);
    for (let i = 0; i <= 96; i++) { const th = 2 * Math.PI * i / 96; pts.push(P(vw, [RZ * Math.cos(th), 0, -RZ * Math.sin(th)])); }
    g.globalCompositeOperation = 'source-over'; g.setLineDash([5, 6]); g.lineWidth = 1;
    g.strokeStyle = `rgba(${C.muted},${a})`; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); g.setLineDash([]);
    // labelled above the far side of the ring while it is introduced (later the legend names it, on wide screens)
    const al = fade(t, T_SPIN1, 47.8, 0.8, 0.6);
    const lp = P(vw, [0, 0, -RZ]);
    rich(s, [['V', 'i'], ['g', 's'], [' = 0 far away (at infinity)', 'sans']], lp[0], lp[1] - L.fs * 0.9, L.fs, al, C.muted);
  }
  function drawEarth(s, t, vw) {
    const { g } = s, c = P(vw, [0, -DEPTH, 0]), rr = vw.unit * 60 / c[2];
    const a = 1;
    const halo = g.createRadialGradient(c[0], c[1], rr * 0.9, c[0], c[1], rr * 1.5);
    halo.addColorStop(0, 'rgba(120,180,255,0.35)'); halo.addColorStop(1, 'rgba(120,180,255,0)');
    g.globalCompositeOperation = 'source-over'; g.fillStyle = halo; g.beginPath(); g.arc(c[0], c[1], rr * 1.5, 0, 7); g.fill();
    const gr = g.createRadialGradient(c[0] - rr * 0.35, c[1] - rr * 0.4, rr * 0.1, c[0], c[1], rr);
    gr.addColorStop(0, `rgba(150,205,255,${a})`); gr.addColorStop(0.55, `rgba(40,110,200,${a})`); gr.addColorStop(1, `rgba(12,40,95,${a})`);
    g.fillStyle = gr; g.beginPath(); g.arc(c[0], c[1], rr, 0, 7); g.fill();
    // a few soft land shapes
    g.save(); g.beginPath(); g.arc(c[0], c[1], rr, 0, 7); g.clip();
    g.fillStyle = 'rgba(90,160,110,0.55)';
    for (const [dx, dy, sx, sy, rot] of [[-0.3, -0.25, 0.32, 0.2, 0.5], [0.25, 0.15, 0.28, 0.16, -0.4], [-0.05, 0.45, 0.2, 0.1, 0.2]]) {
      g.beginPath(); g.ellipse(c[0] + dx * rr, c[1] + dy * rr, sx * rr, sy * rr, rot, 0, 7); g.fill();
    }
    g.restore();
    return { c, rr };
  }

  // side view only: the axes of the V–r graph (drawn before the Earth, so they pass behind it)
  function drawGraphAxes(s, t, vw) {
    const a = fade(t, 4.6, T_SPIN0 + 1.6, 0.8, 1.2); if (a <= 0) return;
    const { fs } = L;
    const O = P(vw, [0, 0, 0]), X1 = P(vw, [8.9, 0, 0]), Yb = P(vw, [0, -5.0, 0]);
    D.line(s, O[0], O[1], X1[0], X1[1], C.muted, 0.7 * a, 1.2);
    D.line(s, O[0], Yb[1], O[0], O[1] - fs * 0.6, C.muted, 0.7 * a, 1.2);
    rich(s, [['r', 'i']], X1[0] + fs * 0.4, X1[1], fs + 3, 0.9 * a, C.muted, 'left');
    rich(s, [['V', 'i'], ['g', 's'], [' / 10⁷ J kg⁻¹', 'sans']], O[0] - fs * 0.4, O[1] - fs * 1.0, fs + 1, 0.9 * a, C.muted, 'right');
    for (let k = 1; k <= 8; k++) {
      const p = P(vw, [k, 0, 0]);
      D.line(s, p[0], p[1], p[0], p[1] - 4, C.muted, 0.6 * a, 1);
      D.text(s, k === 1 ? 'R' : `${k}R`, p[0], p[1] - fs * 0.9, fs, 0.8 * a, D.serif(fs), C.muted);
    }
    for (const v of [-2, -4]) {                                         // (−6 would be hidden behind the Earth; the surface value is labelled)
      const p = P(vw, [0, DEPTH * v / 6.2512, 0]);
      D.line(s, p[0], p[1], p[0] - 4, p[1], C.muted, 0.6 * a, 1);
      D.text(s, `−${-v}`, p[0] - 6, p[1], fs, 0.8 * a, D.sans(fs), C.muted, 'right');
    }
  }
  // side view only: the curve, the surface value and the tangents at R and 2R
  function drawGraphParts(s, t, vw) {
    const a = fade(t, 4.6, T_SPIN0 + 1.6, 0.8, 1.2); if (a <= 0) return;
    const { fs } = L;
    // the curve, drawn from R outwards
    const grow = smooth((t - 4.8) / 3.0), pts = [];
    for (let i = 0; i <= 120; i++) { const r = 1 + (RMAX - 1) * grow * i / 120; const q = P(vw, [r, ySurf(r), 0]); pts.push([q[0], q[1]]); }
    D.glowLine(s, pts, MESH, a * fade(t, 4.8, T_SPIN1, 0.4, 1.5), 2.2);
    // the value at the surface
    const aS = fade(t, 12.7, T_SPIN0 + 1.6, 0.6, 1.0);
    if (aS > 0) {
      const p = P(vw, [1, ySurf(1), 0]);
      D.glowDot(s, p[0], p[1], 11, C.light, aS);
      rich(s, [['V', 'i'], ['g', 's'], [' = −6.25 × 10⁷ J kg⁻¹ at the surface', 'sans']], p[0] + fs * 1.0, p[1] + fs * 0.2, fs + 1, aS, C.light, 'left');
    }
    // tangents: slope of y = −DEPTH/r is DEPTH/r²
    const tang = (r0, half, al, label) => {
      if (al <= 0) return;
      const k = DEPTH / (r0 * r0), dx = half / Math.sqrt(1 + k * k);
      const p0 = P(vw, [r0 - dx, ySurf(r0) - k * dx, 0]), p1 = P(vw, [r0 + dx, ySurf(r0) + k * dx, 0]), pc = P(vw, [r0, ySurf(r0), 0]);
      D.line(s, p0[0], p0[1], p1[0], p1[1], KE, al, 2.2);
      D.glowDot(s, pc[0], pc[1], 9, KE, al);
      return pc;
    };
    const aT = fade(t, 18.6, T_SPIN0 + 0.8, 0.6, 0.8);
    const pR = tang(1, 0.9, aT);
    if (pR) rich(s, [['g', 'i'], [' = 9.81 N kg⁻¹ at the surface', 'sans']], pR[0] + fs * 1.3, pR[1] + fs * 2.0, fs + 1, aT, KE, 'left');
    const a2 = fade(t, 27.4, T_SPIN0 + 0.8, 0.6, 0.8);
    const p2 = tang(2, 1.2, a2);
    if (p2) rich(s, [['g', 'i'], [' = 2.45 N kg⁻¹ (a quarter)', 'sans']], p2[0] + fs * 0.8, p2[1] + fs * 1.6, fs + 1, a2, KE, 'left');
  }

  // the satellite, its trail and any rocket burst
  function drawSat(s, t, vw) {
    const p = sat(t); if (!p) return null;
    const far = p.r > 13 ? 1 - smooth((p.r - 13) / 3.5) : 1;            // fades out near the edge of the extended surface (16R)
    const a = fade(t, T_S, END_CARD + 0.6, 0.8, 0.6) * far; if (a <= 0) return null;
    // trail: where it was in the last 2.4 s
    const pts = [];
    for (let k = 40; k >= 0; k--) { const tk = t - k * 0.06; const q = sat(tk); if (!q) continue; const w = P(vw, onWell(q.r, q.th)); pts.push([w[0], w[1]]); }
    D.glowLine(s, pts, SAT, 0.45 * a, 1.6, (i) => i / pts.length);
    const w = P(vw, onWell(p.r, p.th));
    // rocket bursts (just after each one, a flame pointing backwards along the path)
    for (const tb of [T_B1, T_B2, T_B3]) {
      const ab = t > tb - 0.05 ? fade(t, tb - 0.05, tb + 0.9, 0.05, 0.6) : 0;
      if (ab <= 0) continue;
      const back = P(vw, onWell(p.r, p.th - 0.12));
      const dx = back[0] - w[0], dy = back[1] - w[1], dl = Math.hypot(dx, dy) || 1;
      for (let i = 1; i <= 4; i++) D.glowDot(s, w[0] + dx / dl * i * 6, w[1] + dy / dl * i * 6, 12 - i * 2, BURST, ab * (1 - i * 0.18));
    }
    D.glowDot(s, w[0], w[1], L.phone ? 12 : 16, SAT, a);
    return { w, p, a };
  }

  // ---------- the energy panel ----------
  const EMIN = -17, EMAX = 12;                                        // ×10⁹ J
  function drawPanel(s, t, p, a) {
    if (a <= 0 || !p) return;
    const { g } = s, { x0, x1, y0, y1 } = L.panel, fs = L.fs, phone = L.phone;
    const e = energy(p), B = 1e9;
    const top = y0 + fs * 1.9, rowH = Math.min((y1 - top) / 3.3, phone ? fs * 2.1 : fs * 3.4), bh = Math.min(rowH * 0.5, phone ? 10 : 18);
    const bottom = Math.min(y1, top + rowH * 3 + fs * (phone ? 1.6 : 3.4));   // the panel is only as tall as what it holds
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(14,20,44,${0.7 * a})`; g.beginPath(); g.roundRect(x0 - 6, y0 - 6, x1 - x0 + 12, bottom - y0 + 12, 10); g.fill();
    const labW = phone ? fs * 2.2 : fs * 2.6;
    const bx0 = x0 + labW, bx1 = x1 - fs * 0.5;
    const X = (v) => bx0 + (v - EMIN) / (EMAX - EMIN) * (bx1 - bx0);
    g.font = D.sans(fs);                                                // the long heading only where it fits in the panel
    const head = !phone && g.measureText('energy of the 500 kg satellite / 10⁹ J').width <= x1 - x0 + 4 ? 'energy of the 500 kg satellite / 10⁹ J' : 'energy of the satellite / 10⁹ J';
    D.text(s, head, x0, y0 + fs * 0.5, fs, 0.85 * a, D.sans(fs), C.muted, 'left');
    // zero line and a few ticks
    D.line(s, X(0), top - fs * 0.3, X(0), top + rowH * 3, C.text, 0.6 * a, 1.2);
    for (const v of [-15, -10, -5, 5, 10]) D.line(s, X(v), top + rowH * 3 - 3, X(v), top + rowH * 3 + 2, C.muted, 0.5 * a, 1);
    for (const v of phone ? [-15, 0, 10] : [-15, -10, -5, 0, 5, 10]) D.text(s, v === 0 ? '0' : (v < 0 ? '−' : '') + Math.abs(v), X(v), top + rowH * 3 + fs * 0.9, fs - 1, 0.7 * a, D.sans(fs - 1), C.muted);
    const rows = [[[['E', 'i'], ['k', 's']], e.Ek / B, KE], [[['E', 'i'], ['p', 's']], e.Ep / B, PE], [[['E', 'i']], e.E / B, TOT]];
    rows.forEach(([lab, v, rgb], i) => {
      const yc = top + rowH * (i + 0.5);
      rich(s, lab, x0, yc, fs + 3, a, rgb, 'left');
      const xa = X(0), xb = X(clamp(v, EMIN, EMAX));
      g.fillStyle = `rgba(${rgb},${0.85 * a})`; g.shadowColor = `rgba(${rgb},${0.6 * a})`; g.shadowBlur = 8;
      g.fillRect(Math.min(xa, xb), yc - bh / 2, Math.abs(xb - xa), bh); g.shadowBlur = 0;
      // the value goes on the empty side of the zero line, so it never runs into the row's label
      const txt = (v < -0.05 ? '−' : '') + Math.abs(v).toFixed(1);
      D.text(s, txt, v >= 0 ? xb + 5 : xa + 5, yc, fs, a, D.sans(fs, 600), rgb, 'left');
    });
    // speed and the depth (potential) under the bars
    if (!phone) {
      const yb = top + rowH * 3 + fs * 2.4;
      rich(s, [['v', 'i'], [` = ${(e.v / 1000).toFixed(2)} km s⁻¹`, 'sans']], x0, yb, fs + 1, 0.9 * a, SAT, 'left');
      rich(s, [['r', 'i'], [` = ${p.r.toFixed(2)} R`, 'sans']], x0 + (x1 - x0) * 0.55, yb, fs + 1, 0.9 * a, C.muted, 'left');
    }
  }

  function wellLabels(s, t, vw, earth) {
    const { fs } = L;
    const aE = fade(t, 6.0, T_SPIN0 + 2.5, 1.0, 1.0);
    if (aE > 0) D.text(s, L.phone ? 'Earth' : 'Earth (radius R)', earth.c[0] - earth.rr - fs * 0.6, earth.c[1] + earth.rr * 0.2, fs, 0.85 * aE, D.sans(fs), '170,205,255', 'right');
    const aR = fade(t, 39.5, 48.4, 0.8, 1.0);
    if (aR > 0) {
      // one equipotential picked out in green, labelled on a dark patch beside its right-hand end
      const pts = []; for (let i = 0; i <= 96; i++) { const q = P(vw, onWell(2.6667, 2 * Math.PI * i / 96)); pts.push([q[0], q[1]]); }
      D.glowLine(s, pts, C.good, aR, 1.8);
      const p = P(vw, onWell(2.6667, 0)), g = s.g, txt = 'equipotential';
      g.font = D.sans(fs, 600); const w = g.measureText(txt).width;
      g.fillStyle = `rgba(4,6,13,${0.75 * aR})`; g.beginPath(); g.roundRect(p[0] + fs * 0.4, p[1] - fs * 0.8, w + fs * 0.8, fs * 1.6, 6); g.fill();
      D.text(s, txt, p[0] + fs * 0.8, p[1], fs, aR, D.sans(fs, 600), C.good, 'left');
    }
    // orbit radii: labelled on a dark patch just outside the ring's front-right side, clear of the orbit itself
    const patch = (txt, r, al) => {
      const p = P(vw, onWell(r, -0.55)), g = s.g, x = p[0] + fs * 0.9, y = p[1] + fs * 1.3;
      g.font = D.serif(fs + 1); const w = g.measureText(txt).width;
      g.fillStyle = `rgba(4,6,13,${0.7 * al})`; g.beginPath(); g.roundRect(x - fs * 0.35, y - fs * 0.8, w + fs * 0.7, fs * 1.6, 6); g.fill();
      D.text(s, txt, x, y, fs, al, D.serif(fs + 1), SAT, 'left');
    };
    const a2 = fade(t, T_S + 0.5, T_B1 + 1, 0.8, 0.8);
    if (a2 > 0) patch('r = 2R', 2, 0.95 * a2);
    const a4 = fade(t, T_B2, T_B3 + 2, 0.8, 0.8);
    if (a4 > 0) patch('r = 4R', 4, 0.95 * a4);
    const aM = fade(t, 47.8, 56.8, 0.8, 0.8);
    if (aM > 0) {
      const c = L.phone ? L.view : L.viewWide;
      D.text(s, 'a graph of potential: a model, not a picture of space', (c.x0 + c.x1) / 2, c.y0 + fs * 0.6, fs + 1, aM, D.sans(fs + 1, 600), C.light);
    }
  }

  // the legend (top left, wide screens only), written with a proper subscript in V_g
  function legend(s, a) {
    if (a <= 0) return;
    const { g } = s, size = Math.round(clamp(s.W / 80, 11, 14)), x = 14, lh = size * 1.7;
    const items = [
      ['line', MESH, [['graph of potential ', 'sans'], ['V', 'i'], ['g', 's'], [' (the well)', 'sans']]],
      ['dot', SAT, [['satellite, drawn at the depth of its potential', 'sans']]],
      ['dash', C.muted, [['dashed ring: ', 'sans'], ['V', 'i'], ['g', 's'], [' = 0 (at infinity)', 'sans']]],
    ];
    items.forEach(([kind, rgb, parts], i) => {
      const y = 18 + i * lh;
      g.globalCompositeOperation = 'source-over'; g.strokeStyle = g.fillStyle = `rgba(${rgb},${a})`; g.lineWidth = 2.4;
      if (kind === 'dot') { g.beginPath(); g.arc(x + 10, y, 5, 0, 7); g.fill(); }
      else { g.setLineDash(kind === 'dash' ? [4, 4] : []); g.lineWidth = kind === 'dash' ? 1.4 : 2.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20, y); g.stroke(); g.setLineDash([]); }
      rich(s, parts, x + 30, y, size + 1, 0.85 * a, '210,218,245', 'left');
    });
  }

  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 17, 36)), s2 = Math.round(clamp(W / 34, 15, 30)), s3 = Math.round(clamp(W / 60, 11, 17));
    g.font = D.sans(s1, 300);
    const l1 = D.wrap(s, 'Gravitational potential: a scalar, zero at infinity, negative near a mass', W - 40);
    let y = H * (phone ? 0.1 : 0.14);
    D.text(s, l1, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * l1.length + s2 * 0.6;
    const items = [
      [[['V', 'i'], ['g', 's'], [' = −', 'r'], ['GM', 'i'], ['/', 'r'], ['r', 'i']], MESH, 'potential'],
      [[['g', 'i'], [' = −Δ', 'r'], ['V', 'i'], ['g', 's'], ['/Δ', 'r'], ['r', 'i']], KE, 'field strength = −(potential gradient)'],
      [[['E', 'i'], ['p', 's'], [' = −', 'r'], ['GMm', 'i'], ['/', 'r'], ['r', 'i']], PE, 'potential energy'],
      [[['E', 'i'], [' = −', 'r'], ['GMm', 'i'], ['/2', 'r'], ['r', 'i']], TOT, 'total energy in a circular orbit'],
      [[['v', 'i'], ['esc', 's'], [' = √(2', 'r'], ['GM', 'i'], ['/', 'r'], ['r', 'i'], [')', 'r']], SAT, 'escape needs E ≥ 0'],
    ];
    if (phone) {
      for (const [eq, rgb, txt] of items) {
        rich(s, eq, W / 2, y, s2, a, rgb); y += s2 * 1.0;
        D.text(s, txt, W / 2, y, s3, 0.75 * a, D.sans(s3)); y += s3 * 1.3 + s2 * 0.5;
      }
    } else {
      items.forEach(([eq, rgb, txt], i) => {
        const row = i < 3 ? 0 : 1, n = row ? 2 : 3, k = row ? i - 3 : i;
        const x = W / 2 + (k - (n - 1) / 2) * W * 0.3, yy = y + row * (s2 * 2.6 + s3 * 1.6);
        rich(s, eq, x, yy, s2, a, rgb);
        D.text(s, txt, x, yy + s2 * 1.05, s3, 0.75 * a, D.sans(s3));
      });
      y += 2 * (s2 * 2.6 + s3 * 1.6) - s2;
    }
    g.font = D.sans(s3);
    D.text(s, D.wrap(s, 'The well is a graph of potential: a model, not a picture of space. Satellites move because of the gravitational force on them.', Math.min(W - 40, 760)),
      W / 2, Math.max(y + s3, H * (phone ? 0.86 : 0.8)), s3, 0.6 * a, D.sans(s3), C.muted);
  }

  Anim.register('well', {
    duration: DURATION,
    poster: 108.5,
    // score: orbiting (E-flat lydian, a soft sine pad, a soft shimmer, a little space wind)
    music: { chords: [[51, 58, 62, 67], [53, 57, 60, 65], [48, 55, 58, 62], [46, 53, 57, 62]], bar: 10, pad: 'sine', cutoff: 900, drone: 0.09,
      shimmer: 0.3, wind: 0.3, volume: 0.27 },
    resize: layout,
    // for checking the numbers (not used by the player)
    info: { GM, RE, MS, sat, energy, CAPS, T_S, T_B1, T_B2, T_B3, END_CARD, P1, P2, PT },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.2);
      const vw = view(t);
      drawZero(s, t, vw);
      drawWell(s, t, vw, false);
      drawGraphAxes(s, t, vw);
      const earth = drawEarth(s, t, vw);
      drawWell(s, t, vw, true);
      drawGraphParts(s, t, vw);
      const st = drawSat(s, t, vw);
      wellLabels(s, t, vw, earth);
      const pa = fade(t, T_PANEL, END_CARD + 0.6, 1.2, 0.6);
      drawPanel(s, t, st ? st.p : sat(t), pa);
      if (!L.phone) legend(s, fade(t, T_S, END_CARD + 0.6, 1, 0.6));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'The gravitational potential well (HL)', 'A graph of potential, drawn as a surface');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
