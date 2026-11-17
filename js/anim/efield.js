/* D.2 Electric field lines and equipotentials. A point charge (positive, then negative), two opposite charges,
   two equal positive charges with the point where the field is zero, parallel plates with edge effects, then (HL)
   equipotentials around a point charge, a pair of opposite charges and between the plates.
   Every field line is calculated: from points spaced evenly round each charge (16 lines per 2.0 nC), the line
   follows the direction of the field step by step (4th-order Runge–Kutta, steps of 2 mm). The point charges obey
   E = kQ/r² (the lines are drawn in one plane through the charges). The plates are seen edge-on and are long out
   of the screen, so they are modelled in 2D: each plate is 60 strips whose charges are solved so that each plate is
   an equipotential (120 V and 0 V, total charge zero); the field and potential of each strip are exact formulas.
   Plate lines start at equal steps of electric flux, so their spacing shows the field strength.
   Numbers (k = 8.99 × 10⁹ N m² C⁻²):
   - Q = +2.0 nC: kQ = 8.99 × 10⁹ × 2.0 × 10⁻⁹ = 17.98 N m² C⁻¹ (= V m).
   - r = 0.10 m: E = 17.98 ÷ 0.10² = 1798 → 1.8 × 10³ N C⁻¹. q = +1.0 nC: F = qE = 1.0 × 10⁻⁹ × 1798 = 1.8 × 10⁻⁶ N.
   - r = 0.20 m: E = 17.98 ÷ 0.20² = 449.5 → 450 N C⁻¹ = 1798 ÷ 4.
   - Plates: E = V/d = 120 ÷ 0.040 = 3000 = 3.0 × 10³ V m⁻¹ (in the model, 2.98–3.0 × 10³ in the middle: checked in info.check).
   - (HL) Vₑ = kQ/r: 180 V at r = 17.98 ÷ 180 = 0.0999 m (0.10 m), 150 V at 0.120 m, 120 V at 0.150 m, 90 V at 0.200 m,
     60 V at 0.300 m. At 0.10 m, Vₑ = 17.98 ÷ 0.10 = 179.8 V ≈ 180 V.
   - (HL) Plates: 120, 90, 60, 30, 0 V; 30 V per 0.010 m, E = 30 ÷ 0.010 = 3.0 × 10³ V m⁻¹, the same as V/d. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- numbers ----------
  const K = 8.99e9, Q = 2.0e-9, KQ = K * Q, QT = 1.0e-9;
  const E10 = KQ / 0.1 ** 2, E20 = KQ / 0.2 ** 2, F10 = QT * E10;
  const VP = 120, DP = 0.040, EP = VP / DP;
  const VLEV = [180, 150, 120, 90, 60];

  // ---------- point charges: field (unit strength per charge; directions and ratios only) ----------
  const SEP = 0.10;                                                   // each charge 0.10 m from the middle
  const SRC = {
    pos: [{ x: 0, y: 0, q: 1 }],
    neg: [{ x: 0, y: 0, q: -1 }],
    dip: [{ x: -SEP, y: 0, q: 1 }, { x: SEP, y: 0, q: -1 }],
    like: [{ x: -SEP, y: 0, q: 1 }, { x: SEP, y: 0, q: 1 }],
  };
  const pointField = (src) => (x, y) => {
    let ex = 0, ey = 0;
    for (const c of src) { const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy, r = Math.sqrt(r2), f = c.q / (r2 * r); ex += f * dx; ey += f * dy; }
    return [ex, ey];
  };
  const potential = (src) => (x, y) => { let v = 0; for (const c of src) v += c.q * KQ / Math.hypot(x - c.x, y - c.y); return v; };

  // follow the field direction (sign +1) or against it (−1) with RK4 steps of ds, until stop() says so
  function trace(field, x, y, sign, stop, ds, maxLen) {
    const pts = [[x, y]];
    const dir = (px, py) => { const [ex, ey] = field(px, py), m = Math.hypot(ex, ey); return m > 0 && Number.isFinite(m) ? [sign * ex / m, sign * ey / m] : null; };
    for (let len = 0; len < maxLen; len += ds) {
      const k1 = dir(x, y); if (!k1) break;
      const k2 = dir(x + k1[0] * ds / 2, y + k1[1] * ds / 2); if (!k2) break;
      const k3 = dir(x + k2[0] * ds / 2, y + k2[1] * ds / 2); if (!k3) break;
      const k4 = dir(x + k3[0] * ds, y + k3[1] * ds); if (!k4) break;
      const nx = x + ds * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6, ny = y + ds * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6;
      const st = stop(x, y, nx, ny);
      if (st) { if (st !== true) pts.push(st); break; }
      x = nx; y = ny; pts.push([x, y]);
    }
    return pts;
  }
  const withLengths = (pts, rev) => {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, cum, len: cum[cum.length - 1], rev };
  };

  const NL = 16, R0 = 0.012;
  function pointLines(key) {
    const src = SRC[key], field = pointField(src), out = [];
    const stopAt = (x, y, nx, ny) => {
      if (Math.abs(nx) > 1.4 || Math.abs(ny) > 1.4) return true;
      for (const c of src) if (c.q < 0 && key !== 'neg' && Math.hypot(nx - c.x, ny - c.y) < R0) return [c.x, c.y];
      return false;
    };
    for (const c of src) {
      const sign = c.q > 0 ? 1 : -1;
      if (key === 'dip' && c.q < 0) continue;                          // the dipole's lines all start on the positive charge
      const off = key === 'pos' || key === 'neg' ? 0 : 0.5;            // single charge: a line along the axis, for the test charge
      for (let i = 0; i < NL; i++) {
        const a = (i + off) * 2 * Math.PI / NL;
        const pts = trace(field, c.x + R0 * Math.cos(a), c.y + R0 * Math.sin(a), sign, stopAt, 0.002, 2.6);
        out.push(withLengths(pts, sign < 0));                          // rev: the field points back along the line (into a negative charge)
        // dipole: a line that leaves the picture before reaching −Q comes back to it far away; its mirror image
        // (x → −x) arrives at −Q from the other side, so draw that too (traced from −Q, arrows pointing into it)
        const end = pts[pts.length - 1];
        if (key === 'dip' && Math.hypot(end[0] - SEP, end[1]) > 1e-6) out.push(withLengths(pts.map(([x, y]) => [-x, y]), true));
      }
    }
    return out;
  }
  const LINES = { pos: pointLines('pos'), neg: pointLines('neg'), dip: pointLines('dip'), like: pointLines('like') };

  // ---------- parallel plates (2D: plates long out of the screen), charges solved so each plate is an equipotential ----------
  const NP = 60, PW = 0.16, PH = PW / 2, PY = DP / 2, SW = PW / NP;
  const Fu = (u, y) => (u === 0 ? 0 : 0.5 * u * Math.log(u * u + y * y)) - u + (y === 0 ? 0 : y * Math.atan(u / y));
  const strips = [];
  for (let p = 0; p < 2; p++) for (let i = 0; i < NP; i++) strips.push({ x1: -PH + i * SW, x2: -PH + (i + 1) * SW, y: p === 0 ? PY : -PY, v: p === 0 ? VP : 0 });
  // potential at (x, y) of a strip carrying total charge c (in units where V = −Σ σ ∫ ln r dx')
  const stripV = (s, x, y) => -(Fu(x - s.x1, y - s.y) - Fu(x - s.x2, y - s.y)) / SW;
  const PLATE = (() => {
    const n = strips.length, M = n + 1, A = [];
    for (let i = 0; i < n; i++) {
      const xc = (strips[i].x1 + strips[i].x2) / 2, row = new Float64Array(M + 1);
      for (let j = 0; j < n; j++) row[j] = stripV(strips[j], xc, strips[i].y);
      row[n] = 1; row[M] = strips[i].v; A.push(row);                  // unknowns: the strip charges, then the potential far away
    }
    const last = new Float64Array(M + 1); for (let j = 0; j < n; j++) last[j] = 1; A.push(last);   // total charge zero
    for (let c = 0; c < M; c++) {                                      // Gaussian elimination, partial pivoting
      let p = c; for (let r = c + 1; r < M; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]];
      for (let r = 0; r < M; r++) if (r !== c) { const f = A[r][c] / A[c][c]; if (f) for (let k = c; k <= M; k++) A[r][k] -= f * A[c][k]; }
    }
    const q = []; for (let i = 0; i < n; i++) q.push(A[i][M] / A[i][i]);
    return { q, vInf: A[n][M] / A[n][n] };
  })();
  // the strips as flat arrays (fast loops); more than 8 mm from a strip, its exact formulas and those of a line of
  // charge at its centre agree to within about 1%
  const NS = strips.length, NEAR = 0.008, VINF = PLATE.vInf;
  const SQ = Float64Array.from(PLATE.q), SX1 = Float64Array.from(strips, (s) => s.x1), SX2 = Float64Array.from(strips, (s) => s.x2);
  const SXC = Float64Array.from(strips, (s) => (s.x1 + s.x2) / 2), SY = Float64Array.from(strips, (s) => s.y);
  const plateV = (x, y) => {
    let v = VINF;
    for (let i = 0; i < NS; i++) {
      const dy = y - SY[i];
      if (dy < NEAR && dy > -NEAR && x > SX1[i] - NEAR && x < SX2[i] + NEAR) v -= SQ[i] * (Fu(x - SX1[i], dy) - Fu(x - SX2[i], dy)) / SW;
      else { const dx = x - SXC[i]; v -= SQ[i] * 0.5 * Math.log(dx * dx + dy * dy); }
    }
    return v;
  };
  const plateE = (x, y) => {
    let ex = 0, ey = 0;
    for (let i = 0; i < NS; i++) {
      const dy = y - SY[i];
      if (dy < NEAR && dy > -NEAR && x > SX1[i] - NEAR && x < SX2[i] + NEAR) {
        const sg = SQ[i] / SW, a1 = x - SX1[i], a2 = x - SX2[i];
        ex += sg * 0.5 * Math.log((a1 * a1 + dy * dy) / (a2 * a2 + dy * dy));
        ey += sg * Math.atan2(dy * SW, a1 * a2 + dy * dy);
      } else {
        const dx = x - SXC[i], q = SQ[i] / (dx * dx + dy * dy);
        ex += q * dx; ey += q * dy;
      }
    }
    return [ex, ey];
  };
  // field lines of the plates: start points at equal steps of flux (one line per 8 mm where the field is uniform),
  // worked out on the right half and mirrored (the picture is symmetric); each line is joined back to the plate
  const PLINES = (() => {
    const out = [], fluxStep = EP * 0.008, ns = 200;
    const cross = (y, ny, yl) => (y - yl) * (ny - yl) <= 0;
    const stop = (x, y, nx, ny) => {
      if (Math.abs(nx) > 0.6 || Math.abs(ny) > 0.6) return true;
      for (const yl of [-PY, PY]) if (cross(y, ny, yl)) {
        const u = (y - yl) / (y - ny), xc = x + (nx - x) * u;
        if (Math.abs(xc) <= PH) return [xc, yl];
      }
      return false;
    };
    const backTo = (x, y) => trace(plateE, x, y, -1, (px, py, nx, ny) => {
      if (cross(py, ny, PY)) { const u = (py - PY) / (py - ny), xc = px + (nx - px) * u; return Math.abs(xc) <= PH ? [xc, PY] : true; }
      return false;
    }, 0.0005, 0.03);
    const starts = [];
    for (const [side, off] of [[-1, 0.0015], [1, 0.004]]) {             // inner face (1.5 mm below), outer face (4 mm above)
      let acc = fluxStep / 2;
      if (side > 0) acc = fluxStep;                                     // the outer face: few lines, none on the centre line
      for (let k = 0; k < ns; k++) {
        const x0 = PH * (k + 0.5) / ns, fl = Math.max(0, side * plateE(x0, PY + side * off)[1]);
        acc -= fl * PH / ns;
        if (acc <= 0) { acc += fluxStep; starts.push([x0, PY + side * off]); }
      }
    }
    for (const [x0, y0] of starts) {
      const back = backTo(x0, y0).reverse(), fwd = trace(plateE, x0, y0, 1, stop, 0.0005, 1.2);
      const pts = back.concat(fwd.slice(1));
      out.push(withLengths(pts, false), withLengths(pts.map(([x, y]) => [-x, y]), false));
    }
    return out;
  })();

  // ---------- equipotentials: marching squares on a grid of potential ----------
  // one pass over the grid for all the levels; returns one list of segments [x1, y1, x2, y2, …] per level
  function contours(V, x0, y0, h, nx, ny, levels) {
    const out = levels.map(() => []), px = [0, 0, 0, 0], py = [0, 0, 0, 0];
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const A = V[j * nx + i], B = V[j * nx + i + 1], Cc = V[(j + 1) * nx + i + 1], Dd = V[(j + 1) * nx + i];
      const lo = Math.min(A, B, Cc, Dd), hi = Math.max(A, B, Cc, Dd);
      if (!(Number.isFinite(lo) && Number.isFinite(hi))) continue;
      for (let k = 0; k < levels.length; k++) {
        const level = levels[k]; if (level <= lo || level >= hi) continue;
        const a = A - level, b = B - level, c = Cc - level, d = Dd - level, X = x0 + i * h, Y = y0 + j * h;
        let n = 0;
        if (a * b < 0) { px[n] = X + h * a / (a - b); py[n++] = Y; }
        if (b * c < 0) { px[n] = X + h; py[n++] = Y + h * b / (b - c); }
        if (c * d < 0) { px[n] = X + h - h * c / (c - d); py[n++] = Y + h; }
        if (d * a < 0) { px[n] = X; py[n++] = Y + h - h * d / (d - a); }
        const seg = out[k];
        if (n >= 2) seg.push(px[0], py[0], px[1], py[1]);
        if (n === 4) seg.push(px[2], py[2], px[3], py[3]);
      }
    }
    return out;
  }
  function grid(fn, x0, x1, y0, y1, h) {
    const nx = Math.round((x1 - x0) / h) + 1, ny = Math.round((y1 - y0) / h) + 1, V = new Float64Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) V[j * nx + i] = fn(x0 + i * h, y0 + j * h);
    return { V, nx, ny };
  }
  const DIPLEV = [-150, -75, -30, 0, 30, 75, 150];
  // the grid is offset by half a step, so no grid point lies on x = 0, where V = 0 exactly (the 0 V line is then found)
  const DIPEQ = (() => { const h = 0.004, G = grid(potential(SRC.dip), -0.598, 0.598, -0.4, 0.4, h); return contours(G.V, -0.598, -0.4, h, G.nx, G.ny, DIPLEV); })();
  const PLEV = [30, 60, 90];
  // the plates' potential: worked out for one quarter, then V(−x, y) = V(x, y) and V(x, −y) = 120 − V(x, y)
  const PLATEQ = (() => {
    const h = 0.002, NX = 110, NY = 65, nx = 2 * NX + 1, ny = 2 * NY + 1, V = new Float64Array(nx * ny);
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
      const v = plateV(i * h, j * h);
      V[(NY + j) * nx + NX + i] = v; V[(NY + j) * nx + NX - i] = v;
      V[(NY - j) * nx + NX + i] = VP - v; V[(NY - j) * nx + NX - i] = VP - v;
    }
    return contours(V, -NX * h, -NY * h, h, nx, ny, PLEV);
  })();
  // where a plate equipotential crosses a vertical line x (for labels and the 1.0 cm bracket), found by bisection
  const levelY = (L, x) => { let lo = -PY, hi = PY; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (plateV(x, m) > L) hi = m; else lo = m; } return (lo + hi) / 2; };
  const LABEL_X = -0.055, LABY = { 90: levelY(90, LABEL_X), 60: levelY(60, LABEL_X), 30: levelY(30, LABEL_X) };
  const BRACKET_X = 0.04, Y90 = levelY(90, BRACKET_X), Y60 = levelY(60, BRACKET_X);

  // ---------- captions and their holds (each caption readable at 16 characters a second; 6 s more to predict) ----------
  const CAPS = [
    [4.8, 10.2, 'A point charge Q = +2.0 nC. Its field lines (violet) show the direction of the force on a small positive test charge.'],
    [10.4, 15.8, 'Around a positive charge the lines point radially outwards. They are closer together where the field is stronger.'],
    [16.0, 22.0, 'A test charge q = +1.0 nC at r = 0.10 m: E = kQ/r² = 8.99 × 10⁹ × 2.0 × 10⁻⁹ ÷ 0.10² = 1.8 × 10³ N C⁻¹.'],
    [22.2, 27.6, 'The force on it, F = qE = 1.0 × 10⁻⁹ × 1.8 × 10³ = 1.8 × 10⁻⁶ N, points along the field line, away from Q.'],
    [27.8, 33.4, 'At r = 0.20 m: E = 1.8 × 10³ ÷ 4 = 450 N C⁻¹. Twice as far away, a quarter of the field: an inverse-square law.'],
    [34.0, 39.6, 'A negative charge, −2.0 nC: now the lines point inwards. A positive test charge is pulled towards it.'],
    [40.4, 45.8, 'Two equal and opposite charges, 0.20 m apart. Each line is calculated by following the direction of the field, step by step.'],
    [46.0, 51.4, 'Lines start on the positive charge and end on the negative one. They never cross: the field has one direction at each point.'],
    [51.6, 56.8, 'The lines are most crowded between and close to the charges, where the field is strongest.'],
    [57.8, 62.6, 'Now two equal positive charges, 0.20 m apart. Their field lines bend away from each other.'],
    [62.8, 67.4, 'Predict: is there a point near them where the electric field is zero?'],
    [67.6, 73.2, 'Yes: the midpoint. There the two fields are equal in size and opposite in direction, so they cancel: E = 0.'],
    [73.4, 78.8, 'A test charge placed exactly there would feel no force. Everywhere else, the two fields add as vectors.'],
    [80.0, 85.4, 'Two parallel plates, seen edge-on and long out of the screen, 4.0 cm apart, with a potential difference of 120 V between them.'],
    [85.6, 91.0, 'Between the plates the field lines are parallel and equally spaced: the field is uniform.'],
    [91.2, 97.0, 'E = V/d = 120 ÷ 0.040 = 3.0 × 10³ V m⁻¹ (the same unit as N C⁻¹), from the positive plate to the negative plate.'],
    [97.2, 103.0, 'So a test charge feels the same force anywhere between the plates. Beyond the ends of the plates the lines bulge outwards and the field is weaker.'],
    [104.0, 109.6, '(HL) Equipotentials (green) join points at the same electric potential. For a point charge Vₑ = kQ/r, so they are circles (spheres in 3D).'],
    [109.8, 115.4, '(HL) Drawn every 30 V, from 180 V at r = 0.10 m to 60 V at r = 0.30 m, they spread out as the field gets weaker.'],
    [115.6, 120.8, '(HL) They cross every field line at right angles. Moving a charge along one, the force is at right angles to the motion: no work is done.'],
    [121.2, 126.6, '(HL) For two opposite charges the equipotentials loop round each charge, and the line midway between them is at 0 V.'],
    [127.0, 132.4, '(HL) Between the plates the equipotentials are flat and equally spaced away from the edges: 120, 90, 60, 30 and 0 V.'],
    [132.6, 138.2, '(HL) E = −ΔVₑ/Δr: Vₑ falls by 30 V for every 0.010 m downwards, so E = 30 ÷ 0.010 = 3.0 × 10³ V m⁻¹, as V/d gave.'],
  ];
  // No pauses (teacher, 17 November 2026): the time a caption needs beyond its slot is added to that caption's stretch of
  // the story instead, so the lines are drawn and the charges moved a little more slowly there, and the picture never
  // freezes (the arrowheads also drift steadily along the field lines in real time). spans: [storyStart, storyEnd, extra s].
  const makeWarp = (spans) => {
    const seg = spans.slice().sort((p, q) => p[0] - q[0]);
    const toReal = (st) => { let acc = 0; for (const [a, b, d] of seg) { if (st <= a) break; if (st < b) return st + acc + d * (st - a) / (b - a); acc += d; } return st + acc; };
    const toStory = (rt) => { let acc = 0; for (const [a, b, d] of seg) { const ra = a + acc, rb = b + acc + d; if (rt <= ra) break; if (rt < rb) return a + (rt - ra) * (b - a) / (b - a + d); acc += d; } return rt - acc; };
    return { toReal, toStory, extra: seg.reduce((n, p) => n + p[2], 0) };
  };
  const SPANS = CAPS.map(([a, b, txt]) => {
    let extra = txt.length / 16 + 1.0 - (b - a);
    if (txt.startsWith('Predict')) extra = Math.max(extra, 0) + 6;
    return extra > 0.05 ? [a, b, Math.round(extra * 10) / 10] : null;
  }).filter(Boolean);
  const WARP = makeWarp(SPANS);
  let LIVE = 0;                                                       // real (playing) time, for the drifting arrowheads
  const T_END = 138.6, DURATION = 151;

  // ---------- the parts ----------
  const PARTS = [
    { id: 'pos', t0: 4.6, t1: 33.9 }, { id: 'neg', t0: 33.7, t1: 40.2 }, { id: 'dip', t0: 40.2, t1: 57.4 },
    { id: 'like', t0: 57.4, t1: 79.6 }, { id: 'plates', t0: 79.6, t1: 103.6 },
    { id: 'pos', t0: 103.6, t1: 121.0, hl: true }, { id: 'dip', t0: 121.0, t1: 126.9, hl: true }, { id: 'plates', t0: 126.9, t1: T_END, hl: true },
  ];
  // the world box (half-width, half-height in m) each kind of picture needs, on wide screens and on phones
  const BOX = { point: [[0.34, 0.17], [0.19, 0.25]], pair: [[0.34, 0.17], [0.2, 0.25]], plates: [[0.15, 0.07], [0.095, 0.11]] };

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;                             // the 4:5 stage, with the buttons below the picture
    const capFs = Math.round(clamp(W / 44, 15, 25)), fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    const x0 = phone ? 6 : W * 0.03, x1 = W - (phone ? 6 : W * 0.03);
    const y0 = phone ? 10 : Math.max(48, H * 0.09), y1 = H - capFs * (phone ? 6.9 : 5.5);
    L = { W, H, phone, capFs, fs, x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }
  // ox: the world x at the middle of the picture (phones move a single charge left, to make room for the test charge)
  const view = (kind, ox = 0) => {
    const [hw, hh] = BOX[kind][L.phone ? 1 : 0];
    const sc = Math.min((L.x1 - L.x0) / (2 * hw), (L.y1 - L.y0) / (2 * hh));
    return { sc, X: (x) => L.cx + (x - ox) * sc, Y: (y) => L.cy - y * sc };
  };

  // ---------- drawing helpers ----------
  function pill(s, txt, x, y, size, a, rgb = C.text, align = 'center', font = null) {
    if (a <= 0) return;
    const { g } = s; g.font = font || D.sans(size);
    const w = g.measureText(txt).width, px = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(4,6,13,${0.78 * a})`;
    g.beginPath(); g.roundRect(px - size * 0.4, y - size * 0.75, w + size * 0.8, size * 1.5, size * 0.5); g.fill();
    D.text(s, txt, x, y, size, a, font || D.sans(size), rgb, align);
  }
  // a field line drawn up to arc length upto, with arrowheads along it
  function drawLine(s, ln, V, upto, a, rgb, width, arrowEvery) {
    const { g } = s, P = ln.pts, n = P.length;
    if (a <= 0 || n < 2 || upto <= 0) return;
    const pts = [];
    for (let i = 0; i < n && ln.cum[i] <= upto; i++) pts.push([V.X(P[i][0]), V.Y(P[i][1])]);
    if (pts.length < 2) return;
    D.glowLine(s, pts, rgb, a, width);
    // arrowheads at fixed distances along the line (from the charge where it starts)
    const head = Math.max(5, Math.min(9, V.sc * 0.012));
    const lim = Math.min(upto, ln.len) - 0.004, edge = arrowEvery * 0.35;
    const d0 = arrowEvery * 0.5 + (ln.rev ? -1 : 1) * LIVE * arrowEvery / 3;   // one spacing every 3 s, along the field
    for (let d = ((d0 % arrowEvery) + arrowEvery) % arrowEvery; d < lim; d += arrowEvery) {
      const ha = smooth(d / edge) * smooth((lim - d) / edge); if (ha <= 0.01) continue;
      let i = 1; while (i < n - 1 && ln.cum[i] < d) i++;
      const u = (d - ln.cum[i - 1]) / Math.max(1e-9, ln.cum[i] - ln.cum[i - 1]);
      const wx = lerp(P[i - 1][0], P[i][0], u), wy = lerp(P[i - 1][1], P[i][1], u);
      const x = V.X(wx), y = V.Y(wy);
      if (x < -10 || x > L.W + 10 || y < -10 || y > L.H + 10) continue;
      let dx = V.X(P[i][0]) - V.X(P[i - 1][0]), dy = V.Y(P[i][1]) - V.Y(P[i - 1][1]);
      const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m; if (ln.rev) { dx = -dx; dy = -dy; }
      g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(${rgb},${0.95 * a * ha})`;
      g.beginPath(); g.moveTo(x + dx * head * 0.6, y + dy * head * 0.6);
      g.lineTo(x - dx * head * 0.6 - dy * head * 0.5, y - dy * head * 0.6 + dx * head * 0.5);
      g.lineTo(x - dx * head * 0.6 + dy * head * 0.5, y - dy * head * 0.6 - dx * head * 0.5); g.closePath(); g.fill();
    }
  }
  function charge(s, x, y, sign, R, a, small = false) {
    if (a <= 0) return;
    const { g } = s, rgb = sign > 0 ? C.pos : C.neg;
    D.glowDot(s, x, y, R * 2.6, rgb, 0.7 * a);
    const gr = g.createRadialGradient(x - R * 0.35, y - R * 0.35, R * 0.1, x, y, R);
    gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.35, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${sign > 0 ? '150,30,60' : '20,90,130'},${a})`);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill();
    g.strokeStyle = `rgba(10,12,24,${0.9 * a})`; g.lineWidth = Math.max(1.4, R * 0.16); g.lineCap = 'round';
    const k = R * (small ? 0.5 : 0.45);
    g.beginPath(); g.moveTo(x - k, y); g.lineTo(x + k, y); if (sign > 0) { g.moveTo(x, y - k); g.lineTo(x, y + k); } g.stroke();
  }
  function dims(s, xa, xb, y, a, label) {                              // a horizontal dimension line with end ticks
    if (a <= 0) return;
    const tk = 5;
    D.line(s, xa, y, xb, y, C.muted, 0.75 * a, 1.2);
    D.line(s, xa, y - tk, xa, y + tk, C.muted, 0.75 * a, 1.2); D.line(s, xb, y - tk, xb, y + tk, C.muted, 0.75 * a, 1.2);
    pill(s, label, (xa + xb) / 2, y + L.fs * 1.2, L.fs, a, C.muted);
  }

  // ---------- the point-charge pictures ----------
  function drawPoint(s, part, t, a) {
    const single = part.id === 'pos' || part.id === 'neg', kind = single ? 'point' : 'pair';
    const V = view(kind, single && !part.hl && L.phone ? 0.07 : 0), src = SRC[part.id];
    const grow = part.hl ? 1 : smooth((t - part.t0 - 0.2) / 2.4);
    const lineA = part.hl ? 0.42 : 1;
    const R = Math.max(9, Math.min(17, V.sc * 0.016));
    for (const ln of LINES[part.id]) drawLine(s, ln, V, grow * 1.3, a * lineA, C.field, L.phone ? 1.3 : 1.6, part.id === 'pos' || part.id === 'neg' ? 0.11 : 0.09);
    if (part.hl) drawEquip(s, part, t, a, V);
    for (const c of src) charge(s, V.X(c.x), V.Y(c.y), c.q, R, a * smooth((t - part.t0) / 0.6));
    const fs = L.fs;
    // labels
    if (!part.hl) {
      const la = a * smooth((t - part.t0 - 1.2) / 0.8);
      if (part.id === 'pos' || part.id === 'neg') pill(s, part.id === 'pos' ? 'Q = +2.0 nC' : 'Q = −2.0 nC', V.X(0) - R * 0.7, V.Y(0) - R - fs * 0.9, fs, la, part.id === 'pos' ? C.pos : C.neg, 'right');
      else for (const c of src) pill(s, c.q > 0 ? '+2.0 nC' : '−2.0 nC', V.X(c.x), V.Y(c.y) + R + fs * 1.5, fs, la, c.q > 0 ? C.pos : C.neg);
    }
    if (part.id === 'pos' && !part.hl) testCharge(s, t, V, R);
    if (part.id === 'neg') {
      const ta = a * fade(t, 35.0, part.t1, 0.6, 0.5), x = V.X(0.10), y = V.Y(0);
      const len = 0.07 * V.sc;
      D.arrow(s, x, y, x - len, y, C.force, ta, '', { width: 3, head: 11 });
      charge(s, x, y, 1, R * 0.55, ta, true);
      pill(s, 'q', x, y - R * 0.55 - fs * 1.1, fs, ta, C.pos);
      pill(s, 'F', x - len / 2, y - fs * 1.3, fs + 1, ta, C.force, 'center', D.serif(fs + 2));
    }
    if (part.id === 'like' && !part.hl) {
      const na = a * smooth((t - 67.7) / 0.8);
      if (na > 0) {
        const x = V.X(0), y = V.Y(0), pulse = 1 + 0.12 * Math.sin(s.clock * 3);
        s.g.strokeStyle = `rgba(${C.light},${0.9 * na})`; s.g.lineWidth = 2;
        s.g.beginPath(); s.g.arc(x, y, Math.max(7, R * 0.6) * pulse, 0, Math.PI * 2); s.g.stroke();
        pill(s, 'E = 0', x, y - R - fs * 0.9, fs + 1, na, C.light);
      }
    }
  }
  function testCharge(s, t, V, R) {
    const ta = fade(t, 16.2, 33.6, 0.6, 0.5); if (ta <= 0) return;
    const r = lerp(0.10, 0.20, smooth((t - 28.0) / 1.4)), x = V.X(r), y = V.Y(0), fs = L.fs;
    const E = KQ / (r * r), len = 0.10 * V.sc * E / E10;              // to scale: a quarter as long at twice the distance
    const fa = ta * smooth((t - 22.3) / 0.6);
    if (len > 4) D.arrow(s, x, y, x + len, y, C.force, fa, '', { width: 3, head: Math.min(11, len * 0.5) });
    if (fa > 0) pill(s, 'F', x + len / 2 + 2, y - fs * 1.4, fs + 1, fa, C.force, 'center', D.serif(fs + 2));
    charge(s, x, y, 1, R * 0.55, ta, true);
    pill(s, 'q', x, y + R * 0.55 + fs * 1.1, fs, ta, C.pos);
    const eTxt = r < 0.15 ? 'E = 1.8 × 10³ N C⁻¹' : 'E = 450 N C⁻¹';
    const ea = ta * smooth((t - 17.5) / 0.6) * (1 - smooth((t - 28.0) / 0.4)) + ta * smooth((t - 29.2) / 0.6);
    s.g.font = D.sans(fs);
    const ew = s.g.measureText(eTxt).width, eRight = x - fs * 0.6 + ew + fs * 0.5 > L.x1;   // no room on the right: end it at the charge
    pill(s, eTxt, eRight ? x + fs * 0.6 : x - fs * 0.6, y - fs * 2.9, fs, ea, C.text, eRight ? 'right' : 'left');
    const da = ta * smooth((t - 16.6) / 0.6);
    dims(s, V.X(0), x, V.Y(0) + Math.max(R * 2.4, fs * 2.6), da, r < 0.15 ? 'r = 0.10 m' : 'r = 0.20 m');
  }

  // ---------- the parallel plates ----------
  function drawPlates(s, part, t, a) {
    const V = view('plates'), { g } = s, fs = L.fs;
    const grow = part.hl ? 1 : smooth((t - part.t0 - 0.6) / 2.6);
    for (const ln of PLINES) drawLine(s, ln, V, grow * 0.5, a * (part.hl ? 0.42 : 1), C.field, L.phone ? 1.2 : 1.5, 0.024);
    if (part.hl) drawEquip(s, part, t, a, V);
    // the plates: thin metal bars, + and − signs on them
    const th = Math.max(5, V.sc * 0.0035);
    for (const [sgn, yW] of [[1, PY], [-1, -PY]]) {
      const rgb = sgn > 0 ? C.pos : C.neg, xa = V.X(-PH), xb = V.X(PH), y = V.Y(yW);
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = `rgba(${sgn > 0 ? '120,40,70' : '30,90,120'},${a})`; g.fillRect(xa, y - th / 2, xb - xa, th);
      g.strokeStyle = `rgba(${rgb},${0.9 * a})`; g.lineWidth = 1.2; g.strokeRect(xa, y - th / 2, xb - xa, th);
      g.strokeStyle = `rgba(255,255,255,${0.85 * a})`; g.lineWidth = Math.max(1.2, th * 0.25);
      const k = th * 0.32, nS = L.phone ? 7 : 11;
      for (let i = 0; i < nS; i++) {
        const x = xa + (i + 0.5) * (xb - xa) / nS;
        g.beginPath(); g.moveTo(x - k, y); g.lineTo(x + k, y); if (sgn > 0) { g.moveTo(x, y - k); g.lineTo(x, y + k); } g.stroke();
      }
    }
    const la = a * smooth((t - part.t0 - 1.0) / 0.8);
    pill(s, '120 V', V.X(PH) + fs * 0.6, V.Y(PY), fs, la, C.pos, 'left');
    pill(s, '0 V', V.X(PH) + fs * 0.6, V.Y(-PY), fs, la, C.neg, 'left');
    // the gap d (left of the plates)
    const dx = V.X(-PH) - fs * 1.2, da = la * (part.hl ? 0 : 1);
    if (da > 0) {
      D.line(s, dx, V.Y(PY), dx, V.Y(-PY), C.muted, 0.75 * da, 1.2);
      D.line(s, dx - 5, V.Y(PY), dx + 5, V.Y(PY), C.muted, 0.75 * da, 1.2); D.line(s, dx - 5, V.Y(-PY), dx + 5, V.Y(-PY), C.muted, 0.75 * da, 1.2);
      pill(s, L.phone ? 'd' : 'd = 4.0 cm', dx - fs * 0.5, V.Y(0), fs, da, C.muted, 'right', L.phone ? D.serif(fs + 2) : null);
    }
    if (!part.hl) {
      const ea = a * fade(t, 91.4, part.t1, 0.6, 0.5);
      pill(s, 'E = 3.0 × 10³ V m⁻¹', V.X(0), V.Y(PY) - th - fs * 1.4, fs, ea, C.field);
      // test charges: arrows show the force on each (the computed field, to scale)
      const ta = a * fade(t, 97.4, part.t1, 0.6, 0.5);
      if (ta > 0) {
        // two inside (equal forces) and one at the end of the plates (weaker, slanted outwards)
        const R = Math.max(6, Math.min(10, V.sc * 0.004)), spots = [[-0.045, 0.006], [0.02, -0.004], [0.088, 0.008]];
        for (const [wx, wy] of spots) {
          const [ex, ey] = plateE(wx, wy), k = 0.02 * V.sc / EP, x = V.X(wx), y = V.Y(wy);
          D.arrow(s, x, y, x + ex * k, y - ey * k, C.force, ta, '', { width: 2.6, head: 9 });
          charge(s, x, y, 1, R, ta, true);
        }
      }
    }
  }

  // ---------- (HL) equipotentials ----------
  function drawEquip(s, part, t, a, V) {
    const { g } = s, fs = L.fs, GREEN = C.good;
    const ea = a * smooth((t - part.t0 - 0.4) / 1.4);
    if (ea <= 0) return;
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    const stroke = (fn) => { for (const [w, al] of [[6, 0.12], [2.2, 0.85]]) { g.strokeStyle = `rgba(${GREEN},${al * ea})`; g.lineWidth = w; g.beginPath(); fn(); g.stroke(); } };
    if (part.id === 'pos') {
      VLEV.forEach((v, i) => {
        const ra = smooth((t - part.t0 - 0.6 - i * 0.5) / 0.8) * ea; if (ra <= 0) return;
        const rr = KQ / v * V.sc;
        for (const [w, al] of [[6, 0.12], [2.2, 0.85]]) { g.strokeStyle = `rgba(${GREEN},${al * ra})`; g.lineWidth = w; g.beginPath(); g.arc(V.X(0), V.Y(0), rr, 0, Math.PI * 2); g.stroke(); }
        const ang = { 180: Math.PI, 150: -Math.PI / 2, 120: -3 * Math.PI / 4, 90: -0.26, 60: -0.26 }[v], lx = V.X(0) + rr * Math.cos(ang), ly = V.Y(0) - rr * Math.sin(ang);
        if (lx > L.x0 + 20 && lx < L.x1 - 20 && ly > L.y0 && ly < L.y1 - 6) pill(s, `${v} V`, lx, ly, fs, ra, GREEN);
      });
      g.globalCompositeOperation = 'source-over';
      // a charge moving along the 120 V equipotential: force (radial) at right angles to its velocity
      const ma = a * fade(t, 115.8, part.t1, 0.6, 0.5);
      if (ma > 0) {
        const r = KQ / 120, th = (15 + 35 * smooth((t - 116.4) / 4.0)) * Math.PI / 180;
        const x = V.X(r * Math.cos(th)), y = V.Y(r * Math.sin(th)), ux = Math.cos(th), uy = -Math.sin(th);
        const lenF = 0.045 * V.sc, lenV = 0.05 * V.sc;
        D.arrow(s, x, y, x + ux * lenF, y + uy * lenF, C.force, ma, '', { width: 2.6, head: 9 });
        D.arrow(s, x, y, x + uy * lenV, y - ux * lenV, C.vel, ma, '', { width: 2.6, head: 9 });   // anticlockwise: along (−sin θ, cos θ)
        charge(s, x, y, 1, Math.max(6, V.sc * 0.009), ma, true);
        pill(s, 'F', x + ux * (lenF + fs), y + uy * (lenF + fs), fs + 1, ma, C.force, 'center', D.serif(fs + 2));
        pill(s, 'v', x + uy * (lenV + fs), y - ux * (lenV + fs), fs + 1, ma, C.vel, 'center', D.serif(fs + 2));
        pill(s, 'W = 0', x - ux * fs * 2.6, y - uy * fs * 2.6, fs, ma * smooth((t - 118.0) / 0.6), C.light);
      }
      return;
    }
    const sets = part.id === 'dip' ? DIPEQ : PLATEQ;
    for (const seg of sets) stroke(() => { for (let k = 0; k < seg.length; k += 4) { g.moveTo(V.X(seg[k]), V.Y(seg[k + 1])); g.lineTo(V.X(seg[k + 2]), V.Y(seg[k + 3])); } });
    g.globalCompositeOperation = 'source-over';
    if (part.id === 'dip') {
      const yTop = Math.min(0.12, 0.65 * (L.cy - L.y0) / V.sc);         // well below the HL badge
      pill(s, '0 V', V.X(0), V.Y(yTop), fs, ea, GREEN);
    } else {
      // labels just inside the left end, and the 1.0 cm / 30 V bracket
      const lx = V.X(LABEL_X);
      for (const v of PLEV) pill(s, `${v} V`, lx, V.Y(LABY[v]), fs, ea, GREEN);
      const ba = a * smooth((t - 132.8) / 0.6);
      if (ba > 0) {
        const bx = V.X(BRACKET_X), ya = V.Y(Y90), yb = V.Y(Y60);
        D.line(s, bx, ya, bx, yb, C.light, ba, 1.6);
        D.line(s, bx - 5, ya, bx + 5, ya, C.light, ba, 1.6); D.line(s, bx - 5, yb, bx + 5, yb, C.light, ba, 1.6);
        pill(s, '0.010 m, 30 V', bx + fs * 0.7, (ya + yb) / 2, fs, ba, C.light, 'left');
      }
    }
  }

  // ---------- rich text for the end card ----------
  function rich(s, parts, x, y, size, a, rgb = C.text) {
    const { g } = s; if (a <= 0) return;
    const font = (st) => st === 's' ? D.serif(Math.round(size * 0.7)) : st === 'i' ? D.serif(size) : D.serif(size, false);
    const ws = parts.map(([tx, st]) => { g.font = font(st); return g.measureText(tx).width; });
    let px = x - ws.reduce((p, q) => p + q, 0) / 2;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`;
    parts.forEach(([tx, st], i) => { g.font = font(st); g.fillText(tx, px, st === 's' ? y + size * 0.28 : y); px += ws[i]; });
    g.shadowBlur = 0;
  }
  function endCard(s, t) {
    const a = fade(t, T_END, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.92 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 30, 18, 38)), s2 = Math.round(clamp(W / 40, 15, 26)), s3 = Math.round(clamp(W / 64, 11, 17));
    D.text(s, 'Electric fields', W / 2, H * (phone ? 0.09 : 0.12), s1, a, D.sans(s1, 300));
    const items = [
      [[['E', 'i'], [' = ', 'r'], ['F', 'i'], [' / ', 'r'], ['q', 'i']], C.field, 'Field lines show the direction of the force on a positive test charge. They never cross, and are closer together where the field is stronger.'],
      [[['E', 'i'], [' = ', 'r'], ['kQ', 'i'], [' / ', 'r'], ['r', 'i'], ['²', 'r']], C.pos, 'Point charge: a radial field, outwards from + and inwards to −. Where fields overlap, they add as vectors.'],
      [[['E', 'i'], [' = ', 'r'], ['V', 'i'], [' / ', 'r'], ['d', 'i']], C.field, 'Parallel plates: a uniform field between them. Beyond their ends the lines bulge outwards and the field is weaker.'],
      [[['E', 'i'], [' = −Δ', 'r'], ['V', 'i'], ['e', 's'], [' / Δ', 'r'], ['r', 'i']], C.good, 'HL: equipotentials are at right angles to the field lines; no work is done moving a charge along one.'],
    ];
    if (phone) {
      let y = H * 0.18;
      for (const [eq, rgb, txt] of items) {
        rich(s, eq, W / 2, y, s2, a, rgb); y += s2 * 1.0;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 36); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.75;
      }
    } else {
      const colW = Math.min(W * 0.38, 440); g.font = D.sans(s3);
      const wrapped = items.map(([, , txt]) => D.wrap(s, txt, colW));
      const y1 = H * 0.3, y2 = Math.max(H * 0.6, y1 + s2 * 1.1 + s3 * 1.3 * Math.max(wrapped[0].length, wrapped[1].length) + s2 * 1.2);
      items.forEach(([eq, rgb], i) => {
        const x = W / 2 + (i % 2 ? 1 : -1) * W * 0.23, y = i < 2 ? y1 : y2;
        rich(s, eq, x, y, s2, a, rgb);
        D.text(s, wrapped[i], x, y + s2 * 1.1, s3, 0.85 * a, D.sans(s3));
      });
    }
  }

  Anim.register('efield', {
    duration: DURATION + WARP.extra,
    poster: WARP.toReal(54),
    // score: crackling static (F-sharp minor, a square-wave pad with a tremolo, a faint hiss, a low drone)
    music: { chords: [[54, 61, 66, 69], [50, 57, 62, 66], [52, 59, 64, 68], [49, 56, 61, 64]], bar: 6, pad: 'square', cutoff: 900, tremolo: 3, drone: 0.09, wind: 0.2, volume: 0.71 },
    resize: layout,
    // for checking the numbers (not used by the player)
    info: {
      KQ, E10, E20, F10, EP, CAPS, SPANS, WARP, LINES, PLINES, PLATE, plateE, plateV, levelY, Y90, Y60,
      check() {
        const [, ey] = plateE(0, 0);
        return { E10, E20, F10, radii: VLEV.map((v) => KQ / v), plateCentreE: -ey, Y90, Y60, spacing: Y90 - Y60,
          plateTop: plateV(0, PY), plateBottom: plateV(0, -PY), plateEdge: plateV(PH - 0.001, PY), vInf: PLATE.vInf,
          maxCharsPerSec: Math.max(...CAPS.map(([a, b, txt]) => txt.length / (WARP.toReal(b) - WARP.toReal(a) - 1.0))) };
      },
    },
    frame(s, rt) {
      const t = WARP.toStory(rt); LIVE = rt;
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.2);
      for (const part of PARTS) {
        const a = fade(t, part.t0, part.t1, 0.7, 0.6); if (a <= 0) continue;
        if (part.id === 'plates') drawPlates(s, part, t, a); else drawPoint(s, part, t, a);
        if (part.hl) {                                                  // an HL badge while the HL part runs
          const ba = a * smooth((t - part.t0) / 0.6);
          pill(s, 'HL', L.phone ? L.W - 24 : L.cx, L.phone ? 18 : Math.max(18, L.y0 - 22), L.fs, ba, C.force, 'center', D.sans(L.fs, 700));
        }
      }
      const legA = smooth((t - 5) / 1) * (1 - smooth((t - T_END) / 0.6));
      if (legA > 0 && !L.phone) {
        const items = [['dot', C.pos, 'positive charge'], ['dot', C.neg, 'negative charge'], ['arrow', C.field, 'field line'], ['arrow', C.force, 'force on a positive test charge']];
        if (t > 103.4) items.push(['line', C.good, 'equipotential (HL)']);
        const lsz = Math.round(clamp(L.W / 80, 11, 14));                 // a dark backing so field lines don't run through the key
        s.g.globalCompositeOperation = 'source-over'; s.g.fillStyle = `rgba(4,6,13,${0.72 * legA})`;
        s.g.beginPath(); s.g.roundRect(6, 6, lsz * 17, 18 + (items.length - 0.5) * lsz * 1.7, 8); s.g.fill();
        D.legend(s, items, legA);
      }
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Electric fields', 'Field lines and equipotentials');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
