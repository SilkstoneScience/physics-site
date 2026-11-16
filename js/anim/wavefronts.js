/* C.3 Wavefronts and rays: a ripple tank seen from above, showing plane waves and rays, refraction at a
   boundary into shallower water, diffraction through a wide and a narrow gap, and two-source interference.
   The water surface is calculated, not sketched: for each part a complex amplitude A(x, y) is worked out
   once on a coarse grid, and each frame shades the grid from the displacement Re(A e^(−iωt)).
   - Plane waves: A = e^(ik(x − x0)).
   - Refraction: incident e^(ik1 k̂·r), a weak reflected wave (amplitude 0.1, only where a reflected ray from the
     part of the boundary inside the tank can reach) and the transmitted wave 1.1 e^(ik2 k̂2·r), all with the same
     phase along the boundary (so k1 sin θ1 = k2 sin θ2: Snell's law).
   - Diffraction: Huygens' principle (each point across the gap a source of circular wavelets, e^(ikr)/√r,
     summed every 0.25 cm, normalised so a very wide gap passes the plane wave unchanged).
   - Interference: two in-phase circular waves e^(ikr)/√(r/λ) (amplitude falling as 1/√r, as for ripples).
   Numbers (checked in the scratch script; typical ripple-tank values):
   f = 8.0 Hz; deep water v1 = 0.24 m/s so λ1 = v/f = 0.030 m = 3.0 cm; shallow water v2 = 0.16 m/s so
   λ2 = 0.16 / 8.0 = 0.020 m = 2.0 cm. θ1 = 50°: sin θ2 = (0.16 / 0.24) × sin 50° = 0.6667 × 0.7660 = 0.5107,
   θ2 = 30.7° ≈ 31°. Wide gap 15 cm = 5λ; narrow gap 2.0 cm (two-thirds of λ: less than one wavelength).
   Two sources 12 cm (4λ) apart. P: 15.0 cm and 21.0 cm from them, path difference 6.0 cm = 2λ (constructive).
   Q: 19.5 cm and 24.0 cm, path difference 4.5 cm = 1.5λ (destructive), 4.8 cm from P. With the 1/√r fall-off
   the amplitude at Q is 1/√6.5 − 1/√8 = 0.039, only 5% of that at P (1/√5 + 1/√7 = 0.825): "hardly moves".
   On screen the waves are slowed down to a period of 1.0 s (8 times slower). */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- physics (lengths in cm, display time in s) ----------
  const LAM = 3.0, LAM2 = 2.0, TP = 1.0, OM = 2 * Math.PI / TP;
  const K1 = 2 * Math.PI / LAM, K2 = 2 * Math.PI / LAM2, C1 = LAM / TP, C2 = LAM2 / TP;
  const DEG = Math.PI / 180, TH1 = 50 * DEG, TH2 = Math.asin((0.16 / 0.24) * Math.sin(TH1));
  const NRM = [Math.cos(TH1), Math.sin(TH1)];                       // normal to the boundary, into the shallow water
  const TAN = [-Math.sin(TH1), Math.cos(TH1)];                      // along the boundary (down and to the left)
  const KT = [Math.cos(TH1 - TH2), Math.sin(TH1 - TH2)];            // transmitted direction
  const KR = [-Math.cos(2 * TH1), -Math.sin(2 * TH1)];              // reflected direction
  const R_AMP = 0.1, T_AMP = 1 + R_AMP;
  const GAP_W = 15, GAP_N = 2.0, BAR_T = 0.7, SEP = 12;
  const P_R = [21.0, 15.0], Q_R = [24.0, 19.5];                     // distances from S1 (upper) and S2 (lower)

  // ---------- timeline ----------
  const T = { F1: 3.6, X1: 27.0, X2: 66.2, F3a: 66.4, X3: 83.8, F3b: 84.0, X4: 102.2, F4: 102.4, END: 147.6 };
  const DURATION = 157;
  const XS = [T.X1, T.X2, T.X3, T.X4];
  const partAt = (t) => (t < T.X1 ? 1 : t < T.X2 ? 2 : t < T.X3 ? 3 : t < T.X4 ? 4 : 5);   // 3 wide gap, 4 narrow, 5 two sources
  const dimAt = (t) => { let d = 1; for (const x of XS) d = Math.min(d, smooth(Math.abs(t - x) / 0.6)); return d; };

  const CAPS = [
    [4.9, 10.2, 'A ripple tank seen from above. A bar dips in and out of the water 8.0 times a second (slowed down 8 times here) and sends out plane waves.'],
    [10.4, 15.8, 'The bright lines are crests. A wavefront joins neighbouring points that are in phase, such as a line along a crest.'],
    [16.0, 21.2, 'Neighbouring wavefronts are one wavelength apart: λ = 3.0 cm. So the wave speed is v = fλ = 8.0 × 0.030 = 0.24 m s⁻¹.'],
    [21.4, 26.3, 'A ray shows the direction the wave travels. Rays are always at right angles to the wavefronts.'],
    [27.8, 33.0, 'Beyond the boundary the water is shallower (a glass plate lies under it), and the waves travel more slowly: 0.16 m s⁻¹.'],
    [33.2, 38.2, 'Predict: the bar still sets the frequency, 8.0 Hz. What happens to the wavelength in the shallow water?'],
    [38.4, 43.6, 'It gets shorter: λ = v / f = 0.16 / 8.0 = 0.020 m = 2.0 cm. The frequency stays the same.'],
    [43.8, 49.0, 'One end of each wavefront reaches the shallow water first and slows down, so the wavefront bends. This is refraction.'],
    [49.2, 54.4, 'The angle of incidence (between the ray and the normal) is 50°. The ray bends towards the normal, because the wave slows down.'],
    [54.6, 60.0, 'Snell\'s law: sin θ₂ / sin θ₁ = v₂ / v₁, so sin θ₂ = (0.16 / 0.24) × sin 50° = 0.51, and θ₂ = 31°.'],
    [60.2, 65.4, 'A little of the wave is also reflected, with the angle of reflection equal to the angle of incidence. Most is transmitted.'],
    [67.0, 72.2, 'Now a barrier with a gap in it. The gap is 15 cm wide: five wavelengths.'],
    [72.4, 77.6, 'Through a wide gap the waves carry on almost straight, spreading out only a little at the edges.'],
    [77.8, 83.0, 'Predict: what will the waves do if the gap is only 2.0 cm wide, less than one wavelength?'],
    [84.6, 90.0, 'They spread out widely, with curved wavefronts. This is diffraction: it is most noticeable when the gap is similar in size to the wavelength.'],
    [90.2, 95.4, 'The wavelength, frequency and speed don\'t change; the wavefronts change shape (and the waves get weaker as they spread).'],
    [95.6, 101.2, 'Huygens\' principle: every point on a wavefront acts as a source of wavelets. A narrow gap lets through only a small part of the wavefront, which acts like a point source.'],
    [103.0, 108.4, 'Two dippers moved by the same motor, 12 cm apart: coherent sources, with the same frequency and a constant phase difference (here in phase).'],
    [108.6, 113.8, 'Where the circular waves overlap, the displacements add. This is superposition.'],
    [114.0, 119.6, 'Along the pink lines the water hardly moves: a crest from one source always arrives with a trough from the other. Destructive interference.'],
    [119.8, 125.2, 'Along the green lines, crests arrive with crests and troughs with troughs, so the water moves most: constructive interference.'],
    [125.4, 130.6, 'Predict: P is 15.0 cm from one source and 21.0 cm from the other. Will the water at P move a lot, or hardly at all?'],
    [130.8, 136.2, 'A lot. The path difference is 21.0 − 15.0 = 6.0 cm = 2λ: a whole number of wavelengths, so the waves arrive in phase.'],
    [136.4, 142.0, 'Q is 19.5 cm and 24.0 cm away: the path difference is 4.5 cm = 1.5λ. The waves arrive half a cycle out of step, so Q hardly moves.'],
    [142.2, 147.4, 'For sources in phase: constructive where the path difference = nλ, destructive where it is (n + ½)λ, with n = 0, 1, 2, …'],
  ];

  // ---------- colours ----------
  const RAY = C.light, CONS = C.good, DEST = '255,120,190', CREST = '190,240,255';
  const DEEP = [[2, 14, 32], [10, 46, 76], [178, 236, 255]];          // trough, still water, crest
  const SHAL = [[6, 24, 40], [20, 72, 92], [196, 246, 255]];          // over the glass plate: a little lighter
  const lut = (cols) => {
    const out = new Uint8ClampedArray(512 * 3);
    for (let i = 0; i < 512; i++) {
      const d = (i / 511) * 4 - 2, c = Math.tanh(d * 1.15);           // soft saturation for the big displacements
      const [tr, st, cr] = cols, u = c >= 0 ? Math.pow(c, 1.25) : -c, to = c >= 0 ? cr : tr;
      for (let k = 0; k < 3; k++) out[i * 3 + k] = lerp(st[k], to[k], u);
    }
    return out;
  };
  const LUT_D = lut(DEEP), LUT_S = lut(SHAL);

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;           // the 4:5 stage (buttons below the picture), as in css/animations.css
    const capFs = Math.round(clamp(W / 44, 15, 25));
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    const left = phone ? 8 : Math.round(W * 0.03), right = W - left;
    const top = phone ? 8 : Math.round(Math.max(8, H * 0.03));
    const bottom = H - capFs * (phone ? 8.1 : 6.6);
    let TW = phone ? 30 : 48, ppc = (right - left) / TW, TH = (bottom - top) / ppc;
    if (TH < 20) { TH = 20; ppc = (bottom - top) / TH; TW = (right - left) / ppc; }
    const GX = phone ? 180 : 288, GY = Math.max(20, Math.round(GX * TH / TW));
    L = { W, H, phone, fs, capFs, tx: left, ty: top, ppc, TW, TH, GX, GY,
      X0: 0.75,                                                      // the front of the dipping bar
      B0: [0.55 * TW, 0.5 * TH],                                     // where the drawn ray meets the boundary
      XB: 0.4 * TW, YC: 0.5 * TH,                                    // the barrier and the middle of its gap
      M4: [(phone ? 0.2 : 0.25) * TW, 0.42 * TH] };                  // half-way between the two sources
    L.S1 = [L.M4[0], L.M4[1] - SEP / 2]; L.S2 = [L.M4[0], L.M4[1] + SEP / 2];
    L.P = pointAt(P_R); L.Q = pointAt(Q_R);
    L.F = fields(L);
  }
  // a point at distances r1 from S1 and r2 from S2 (on the side away from the bar, below the sources' midline)
  function pointAt([r1, r2]) {
    const c = SEP / 2, y = (r1 * r1 - r2 * r2) / (4 * c), x = Math.sqrt(r2 * r2 - (y - c) * (y - c));
    return [L.M4[0] + x, L.M4[1] + y];
  }
  const PX = (x) => L.tx + x * L.ppc, PY = (y) => L.ty + y * L.ppc;

  // ---------- the wave fields on the grid (worked out once per layout) ----------
  const TAB_N = 4096, TAB_M = TAB_N - 1, TAB_K = TAB_N / (2 * Math.PI);
  const COS = new Float32Array(TAB_N), SIN = new Float32Array(TAB_N);
  for (let i = 0; i < TAB_N; i++) { COS[i] = Math.cos((i + 0.5) / TAB_K); SIN[i] = Math.sin((i + 0.5) / TAB_K); }
  let cache = null;
  function fields(l) {
    const key = [l.GX, l.GY, l.TW.toFixed(3), l.TH.toFixed(3)].join('x');
    if (cache && cache.key === key) return cache;
    const { GX, GY, TW, TH } = l, n = GX * GY, cw = TW / GX, ch = TH / GY;
    const X = new Float32Array(n), Y = new Float32Array(n);
    for (let j = 0, q = 0; j < GY; j++) for (let i = 0; i < GX; i++, q++) { X[q] = (i + 0.5) * cw; Y[q] = (j + 0.5) * ch; }
    const F = { key, n, X, Y };
    // 1. plane waves from the bar
    F.p1 = { r: new Float32Array(n), i: new Float32Array(n) };
    for (let q = 0; q < n; q++) { const ph = K1 * (X[q] - l.X0); F.p1.r[q] = Math.cos(ph); F.p1.i[q] = Math.sin(ph); }
    // 2. refraction: incident + reflected in the deep water, transmitted in the shallow water
    F.p2 = { r: new Float32Array(n), i: new Float32Array(n), reg: new Uint8Array(n) };
    // the reflected wave only reaches points whose reflected ray, traced back, meets the part of the boundary inside the tank
    let uLo = Infinity, uHi = -Infinity;
    for (let u = -100; u <= 100; u += 0.05) {
      const bx = l.B0[0] + u * TAN[0], by = l.B0[1] + u * TAN[1];
      if (bx >= 0 && bx <= TW && by >= 0 && by <= TH) { uLo = Math.min(uLo, u); uHi = Math.max(uHi, u); }
    }
    const step = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
    const kn = KR[0] * NRM[0] + KR[1] * NRM[1];                        // = −cos θ1
    for (let q = 0; q < n; q++) {
      const dx = X[q] - l.B0[0], dy = Y[q] - l.B0[1], dn = dx * NRM[0] + dy * NRM[1];
      if (dn < 0) {
        const sb = dn / kn, u = (dx - sb * KR[0]) * TAN[0] + (dy - sb * KR[1]) * TAN[1];   // where that ray left the boundary
        const reach = step((u - uLo) / 1.0 + 0.5) * step((uHi - u) / 1.0 + 0.5);          // soft over about 1 cm
        const a = K1 * dx, b = K1 * (dx * KR[0] + dy * KR[1]), ra = R_AMP * reach;
        F.p2.r[q] = Math.cos(a) + ra * Math.cos(b); F.p2.i[q] = Math.sin(a) + ra * Math.sin(b);
      } else {
        const a = K2 * (dx * KT[0] + dy * KT[1]);
        F.p2.r[q] = T_AMP * Math.cos(a); F.p2.i[q] = T_AMP * Math.sin(a); F.p2.reg[q] = 1;
      }
    }
    // 3, 4. a barrier with a gap: plane waves before it, Huygens wavelets from the gap after it
    const gap = (w) => {
      const f = { r: new Float32Array(n), i: new Float32Array(n), d: new Float32Array(n), wall: new Uint8Array(n) };
      const y0 = l.YC - w / 2, y1 = l.YC + w / 2, m = Math.max(4, Math.round(w / 0.25)), dyj = w / m;
      const norm = Math.sqrt(K1 / (2 * Math.PI)) * dyj, cr = Math.cos(-Math.PI / 4), ci = Math.sin(-Math.PI / 4);
      for (let q = 0; q < n; q++) {
        const x = X[q], y = Y[q];
        if (x < l.XB - BAR_T / 2) { const ph = K1 * (x - l.XB); f.r[q] = Math.cos(ph); f.i[q] = Math.sin(ph); f.d[q] = -1; continue; }
        if (x <= l.XB + BAR_T / 2 && (y < y0 || y > y1)) { f.wall[q] = 1; continue; }
        let re = 0, im = 0;
        const dx2 = (x - l.XB) * (x - l.XB);
        for (let k = 0; k < m; k++) {
          const dy = y - (y0 + (k + 0.5) * dyj), r = Math.max(0.6, Math.sqrt(dx2 + dy * dy)), a = 1 / Math.sqrt(r);
          // cos and sin of the phase from a table (4096 steps per cycle: errors under 0.002)
          const ix = ((K1 * r * TAB_K) | 0) & TAB_M;
          re += a * COS[ix]; im += a * SIN[ix];
        }
        f.r[q] = norm * (re * cr - im * ci); f.i[q] = norm * (re * ci + im * cr);
        const ex = x > l.XB ? x - l.XB : 0, ey = y < y0 ? y0 - y : y > y1 ? y - y1 : 0;
        f.d[q] = Math.sqrt(ex * ex + ey * ey);                         // distance from the gap
      }
      return f;
    };
    // the gap fields take the longest, so they are worked out only when first needed (in the dark switch between parts)
    let p3 = null, p4 = null;
    Object.defineProperty(F, 'p3', { get: () => p3 || (p3 = gap(GAP_W)) });
    Object.defineProperty(F, 'p4', { get: () => p4 || (p4 = gap(GAP_N)) });
    // 5. two coherent sources in phase
    const src = (S) => {
      const f = { r: new Float32Array(n), i: new Float32Array(n), d: new Float32Array(n) };
      for (let q = 0; q < n; q++) {
        const r = Math.hypot(X[q] - S[0], Y[q] - S[1]), a = 1 / Math.sqrt(Math.max(0.5, r) / LAM);
        f.r[q] = a * Math.cos(K1 * r); f.i[q] = a * Math.sin(K1 * r); f.d[q] = r;
      }
      return f;
    };
    F.s1 = src(l.S1); F.s2 = src(l.S2);
    // the picture of the water: a small canvas, drawn scaled up smoothly
    F.off = document.createElement('canvas'); F.off.width = GX; F.off.height = GY;
    F.octx = F.off.getContext('2d'); F.img = F.octx.createImageData(GX, GY);
    cache = F;
    return F;
  }

  // the displacement at one exact point for the two-source part (for the little gauges at P and Q)
  const dispTwo = (p, t) => {
    let v = 0;
    for (const S of [L.S1, L.S2]) { const r = Math.hypot(p[0] - S[0], p[1] - S[1]); v += Math.cos(K1 * r - OM * t) / Math.sqrt(r / LAM); }
    return v;
  };

  // ---------- shading the water ----------
  const ramp = (front, d) => {                                       // the leading edge of waves still spreading out (smoothstep over 1.5 cm)
    const u = (front - d) / 1.5;
    return u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
  };
  function drawWater(s, t) {
    const F = L.F, part = partAt(t), c = Math.cos(OM * t), sn = Math.sin(OM * t);
    const px = F.img.data, n = F.n;
    const put = (q, v, tab) => {
      let k = ((v + 2) * 127.75 + 0.5) | 0;
      k = (k < 0 ? 0 : k > 511 ? 511 : k) * 3;
      const o = q * 4;
      px[o] = tab[k]; px[o + 1] = tab[k + 1]; px[o + 2] = tab[k + 2]; px[o + 3] = 255;
    };
    if (part === 1) {
      const front = L.X0 + C1 * (t - T.F1);
      for (let q = 0; q < n; q++) put(q, (F.p1.r[q] * c + F.p1.i[q] * sn) * ramp(front, F.X[q]), LUT_D);
    } else if (part === 2) {
      for (let q = 0; q < n; q++) put(q, F.p2.r[q] * c + F.p2.i[q] * sn, F.p2.reg[q] ? LUT_S : LUT_D);
    } else if (part === 3 || part === 4) {
      const f = part === 3 ? F.p3 : F.p4, front = C1 * (t - (part === 3 ? T.F3a : T.F3b));
      for (let q = 0; q < n; q++) {
        if (f.wall[q]) { put(q, 0, LUT_D); continue; }
        const m = f.d[q] < 0 ? 1 : ramp(front, f.d[q]);
        put(q, (f.r[q] * c + f.i[q] * sn) * m, LUT_D);
      }
    } else {
      const front = C1 * (t - T.F4), a = F.s1, b = F.s2;
      for (let q = 0; q < n; q++) {
        put(q, (a.r[q] * c + a.i[q] * sn) * ramp(front, a.d[q]) + (b.r[q] * c + b.i[q] * sn) * ramp(front, b.d[q]), LUT_D);
      }
    }
    F.octx.putImageData(F.img, 0, 0);
    const { g } = s, w = L.TW * L.ppc, h = L.TH * L.ppc;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(F.off, L.tx, L.ty, w, h);
    // light falling across the tank, and the dark switch between parts
    const lg = g.createLinearGradient(L.tx, L.ty, L.tx + w, L.ty + h);
    lg.addColorStop(0, 'rgba(120,200,255,0.06)'); lg.addColorStop(1, 'rgba(0,0,20,0.18)');
    g.fillStyle = lg; g.fillRect(L.tx, L.ty, w, h);
    const dim = dimAt(t);
    if (dim < 1) { g.fillStyle = `rgba(4,6,13,${1 - dim})`; g.fillRect(L.tx, L.ty, w, h); }
    g.strokeStyle = 'rgba(150,180,230,0.45)'; g.lineWidth = 1.2;
    g.beginPath(); g.roundRect(L.tx - 0.5, L.ty - 0.5, w + 1, h + 1, 6); g.stroke();
  }

  // ---------- small drawing helpers ----------
  function label(s, txt, x, y, a, rgb = C.text, align = 'center', size = L.fs) {
    if (a <= 0) return;
    const { g } = s; g.font = D.sans(size, 600);
    const w = g.measureText(txt).width, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(4,10,24,${0.68 * a})`;
    g.beginPath(); g.roundRect(x0 - size * 0.4, y - size * 0.75, w + size * 0.8, size * 1.5, size * 0.4); g.fill();
    D.text(s, txt, x, y, size, a, D.sans(size, 600), rgb, align);
  }
  const inTank = (x, y) => x >= 0.2 && x <= L.TW - 0.2 && y >= 0.2 && y <= L.TH - 0.2;
  // a line through the tank in cm, drawn only where keep(x, y) is true
  function clipped(pts, keep) {
    const out = []; let cur = [];
    for (const [x, y] of pts) {
      if (inTank(x, y) && (!keep || keep(x, y))) cur.push([PX(x), PY(y)]);
      else if (cur.length) { if (cur.length > 1) out.push(cur); cur = []; }
    }
    if (cur.length > 1) out.push(cur);
    return out;
  }
  function dashed(s, segs, rgb, a, w = 2, dash = [7, 6]) {
    if (a <= 0) return;
    const { g } = s;
    g.globalCompositeOperation = 'source-over'; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const seg of segs) {
      g.beginPath(); g.moveTo(seg[0][0], seg[0][1]); for (const p of seg.slice(1)) g.lineTo(p[0], p[1]);
      g.setLineDash([]); g.strokeStyle = `rgba(0,0,0,${0.45 * a})`; g.lineWidth = w + 3; g.stroke();
      g.setLineDash(dash); g.strokeStyle = `rgba(${rgb},${a})`; g.lineWidth = w;
      g.shadowColor = `rgba(${rgb},${0.7 * a})`; g.shadowBlur = 6; g.stroke(); g.shadowBlur = 0;
    }
    g.setLineDash([]);
  }
  // a double-headed bracket from p to q (cm) with a label beside it
  function bracket(s, p, q, txt, a, rgb = C.text, side = -1) {
    if (a <= 0) return;
    const ax = PX(p[0]), ay = PY(p[1]), bx = PX(q[0]), by = PY(q[1]);
    const len = Math.hypot(bx - ax, by - ay); if (len < 6) return;
    const ux = (bx - ax) / len, uy = (by - ay) / len, nx = -uy * side, ny = ux * side, tick = Math.max(4, L.fs * 0.45);
    const { g } = s;
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = `rgba(0,0,0,${0.5 * a})`; g.lineWidth = 4;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
    D.line(s, ax, ay, bx, by, rgb, a, 1.6);
    D.line(s, ax - nx * tick, ay - ny * tick, ax + nx * tick, ay + ny * tick, rgb, a, 1.6);
    D.line(s, bx - nx * tick, by - ny * tick, bx + nx * tick, by + ny * tick, rgb, a, 1.6);
    label(s, txt, (ax + bx) / 2 + nx * L.fs * 1.4, (ay + by) / 2 + ny * L.fs * 1.4, a, rgb);
  }
  function arrowCm(s, p, q, a, rgb = RAY, w = 2.4) {
    D.arrow(s, PX(p[0]), PY(p[1]), PX(q[0]), PY(q[1]), rgb, a, '', { width: w, head: Math.max(9, L.fs * 0.9), blur: 8 });
  }
  function rightAngle(s, x, y, dir, a) {                            // a small square mark where a ray crosses a wavefront
    if (a <= 0) return;
    const sz = Math.max(5, L.fs * 0.55), ux = dir[0], uy = dir[1], vx = -uy, vy = ux, cx = PX(x), cy = PY(y);
    const pts = [[cx - ux * sz, cy - uy * sz], [cx - ux * sz + vx * sz, cy - uy * sz + vy * sz], [cx + vx * sz, cy + vy * sz]];
    const { g } = s; g.globalCompositeOperation = 'source-over';
    g.strokeStyle = `rgba(${RAY},${a})`; g.lineWidth = 1.4; g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]); g.lineTo(pts[1][0], pts[1][1]); g.lineTo(pts[2][0], pts[2][1]); g.stroke();
  }
  // how far a ray from p along u can go before leaving the tank (cm)
  const reach = (p, u, margin = 0.8) => {
    let sMax = 200;
    if (u[0] > 0) sMax = Math.min(sMax, (L.TW - margin - p[0]) / u[0]); else if (u[0] < 0) sMax = Math.min(sMax, (margin - p[0]) / u[0]);
    if (u[1] > 0) sMax = Math.min(sMax, (L.TH - margin - p[1]) / u[1]); else if (u[1] < 0) sMax = Math.min(sMax, (margin - p[1]) / u[1]);
    return Math.max(0, sMax);
  };

  // ---------- part 1: plane waves, wavefronts and rays ----------
  const crestX = (t, x) => L.X0 + C1 * t + LAM * Math.ceil((x - L.X0 - C1 * t) / LAM);   // first crest at or after x
  function drawBar(s, t, a) {
    if (a <= 0) return;
    const { g } = s, x0 = PX(0.15), x1 = PX(L.X0), y0 = PY(0.3), y1 = PY(L.TH - 0.3);
    const glow = 0.5 + 0.5 * Math.cos(OM * t);
    g.globalCompositeOperation = 'source-over';
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, `rgba(120,130,150,${a})`); gr.addColorStop(0.5, `rgba(${Math.round(200 + 40 * glow)},${Math.round(208 + 36 * glow)},230,${a})`); gr.addColorStop(1, `rgba(110,120,140,${a})`);
    g.fillStyle = gr; g.beginPath(); g.roundRect(x0, y0, Math.max(3, x1 - x0), y1 - y0, 3); g.fill();
  }
  function part1(s, t) {
    const a1 = fade(t, 5.0, T.X1 - 0.4, 0.8, 0.6);
    drawBar(s, t, a1);
    label(s, 'dipping bar', PX(L.X0) + L.fs * 0.8, PY(L.TH) - L.fs * 1.3, fade(t, 5.2, 10.2, 0.6, 0.6), C.text, 'left');
    const front = L.X0 + C1 * (t - T.F1);
    // wavefronts drawn along the crests
    const aW = fade(t, 11.0, 15.8, 0.7, 0.6);
    if (aW > 0) {
      for (let x = crestX(t, 1.2); x < Math.min(front - 1.0, L.TW - 0.3); x += LAM) {
        D.glowLine(s, [[PX(x), PY(0.4)], [PX(x), PY(L.TH - 0.4)]], CREST, 0.55 * aW, 1.3);
      }
      const xl = crestX(t, Math.min(front, L.TW) * 0.45);
      if (xl < front - 1) label(s, 'wavefront', PX(xl), PY(0) + L.fs * 1.4, aW, CREST);
    }
    // λ, riding along with the crests
    const aL = fade(t, 16.2, 21.2, 0.6, 0.6);
    if (aL > 0) {
      const x = L.X0 + C1 * t + LAM * Math.ceil((L.TW * 0.12 - L.X0 - C1 * 16.2) / LAM), y = L.TH * 0.3;
      if (x + LAM < L.TW - 0.5) bracket(s, [x, y], [x + LAM, y], 'λ = 3.0 cm', aL, C.text, 1);
    }
    // rays, with right-angle marks riding on one crest
    const aR = fade(t, 21.6, T.X1 - 0.4, 0.8, 0.6);
    if (aR > 0) {
      const ys = [0.22, 0.5, 0.78].map((f) => f * L.TH);
      for (const y of ys) arrowCm(s, [1.6, y], [L.TW - 1.2, y], aR);
      const xm = L.X0 + C1 * t + LAM * Math.ceil((L.TW * 0.3 - L.X0 - C1 * 21.6) / LAM);
      if (xm < L.TW - 1.5) for (const y of ys) rightAngle(s, xm, y, [1, 0], aR);
      D.glowLine(s, [[PX(xm), PY(0.4)], [PX(xm), PY(L.TH - 0.4)]], CREST, 0.45 * aR, 1.2);
      label(s, 'ray', PX(3.2), PY(ys[0]) - L.fs * 1.2, aR, RAY);
    }
  }

  // ---------- part 2: refraction ----------
  const sN = (x, y) => (x - L.B0[0]) * NRM[0] + (y - L.B0[1]) * NRM[1];
  function part2(s, t) {
    const a = fade(t, T.X1 + 0.3, T.X2 - 0.4, 0.8, 0.6); if (a <= 0) return;
    const { B0 } = L;
    drawBar(s, t, a);
    // the boundary
    const bpts = []; for (let u = -80; u <= 80; u += 0.5) bpts.push([B0[0] + u * TAN[0], B0[1] + u * TAN[1]]);
    dashed(s, clipped(bpts), '200,225,255', 0.6 * a, 1.6, [10, 6]);
    label(s, 'deep water: v = 0.24 m s⁻¹', PX(1.6), PY(0) + L.fs * 1.5, a, C.text, 'left');
    label(s, 'shallow water: v = 0.16 m s⁻¹', PX(L.TW - 0.8), PY(L.TH) - L.fs * 1.4, a, C.text, 'right');
    // the wavelengths, riding with the crests
    const aL = fade(t, 38.6, 43.6, 0.6, 0.6);
    if (aL > 0) {
      const y = Math.max(3.4, B0[1] - 5), t0 = 38.6;
      const x = B0[0] + C1 * t + LAM * Math.ceil((1.5 - B0[0] - C1 * t0) / LAM);
      if (sN(x + LAM, y) < 0) bracket(s, [x, y], [x + LAM, y], 'λ = 3.0 cm', aL, C.text, 1);
      const S = [B0[0] + 3 * TAN[0], B0[1] + 3 * TAN[1]], off = KT[0] * (S[0] - B0[0]) + KT[1] * (S[1] - B0[1]);
      const sv = C2 * t + LAM2 * Math.ceil((0.4 + off - C2 * t0) / LAM2) - off;
      const p = [S[0] + sv * KT[0], S[1] + sv * KT[1]], q = [p[0] + LAM2 * KT[0], p[1] + LAM2 * KT[1]];
      if (inTank(q[0], q[1])) bracket(s, p, q, 'λ = 2.0 cm', aL, C.text, -1);
    }
    // one wavefront picked out, bending at the boundary
    const aW = fade(t, 44.0, 49.0, 0.7, 0.6);
    if (aW > 0) {
      let uMax = 0; for (let u = 0; u < 80; u += 0.25) { if (inTank(B0[0] + u * TAN[0], B0[1] + u * TAN[1])) uMax = u; }
      const m = Math.round((-(uMax - 1.5) * Math.sin(TH1) - C1 * 44.0) / LAM);
      const d1 = C1 * t + m * LAM, d2 = C2 * t + m * LAM2;
      const l1 = []; for (let y = 0; y <= L.TH; y += 0.25) l1.push([B0[0] + d1, y]);
      const base = [B0[0] + d2 * KT[0], B0[1] + d2 * KT[1]], l2 = [];
      for (let w = -80; w <= 80; w += 0.25) l2.push([base[0] - w * KT[1], base[1] + w * KT[0]]);
      for (const seg of clipped(l1, (x, y) => sN(x, y) < 0)) D.glowLine(s, seg, CREST, 0.9 * aW, 2);
      for (const seg of clipped(l2, (x, y) => sN(x, y) >= 0)) D.glowLine(s, seg, CREST, 0.9 * aW, 2);
    }
    // the ray, the normal and the angles
    const aR = fade(t, 49.4, T.X2 - 0.4, 0.8, 0.6);
    if (aR > 0) {
      const nl = Math.min(7, L.TH * 0.3);
      D.line(s, PX(B0[0] - nl * NRM[0]), PY(B0[1] - nl * NRM[1]), PX(B0[0] + nl * NRM[0]), PY(B0[1] + nl * NRM[1]), C.text, 0.75 * aR, 1.4, [6, 5]);
      label(s, 'normal', PX(B0[0] + nl * NRM[0]) + L.fs * 0.5, PY(B0[1] + nl * NRM[1]) + L.fs * 0.2, aR, C.text, 'left');
      arrowCm(s, [1.6, B0[1]], [B0[0], B0[1]], aR);
      const lt = Math.min(14, reach(B0, KT) * 0.9);
      arrowCm(s, B0, [B0[0] + lt * KT[0], B0[1] + lt * KT[1]], aR);
      const { g } = s, r = Math.max(26, L.ppc * 2.6), cx = PX(B0[0]), cy = PY(B0[1]);
      g.globalCompositeOperation = 'source-over'; g.strokeStyle = `rgba(${RAY},${aR})`; g.lineWidth = 1.6;
      g.beginPath(); g.arc(cx, cy, r, Math.PI, Math.PI + TH1); g.stroke();
      const m1 = Math.PI + TH1 / 2;
      label(s, 'θ₁ = 50°', cx + Math.cos(m1) * (r + L.fs * 3.2), cy + Math.sin(m1) * (r + L.fs * 1.2), aR, RAY);
      const a2 = fade(t, 54.8, T.X2 - 0.4, 0.8, 0.6);
      if (a2 > 0) {
        g.strokeStyle = `rgba(${RAY},${a2})`; g.beginPath(); g.arc(cx, cy, r * 1.15, TH1 - TH2, TH1); g.stroke();
        const m2 = TH1 - TH2 / 2;
        label(s, 'θ₂ = 31°', cx + Math.cos(m2) * (r * 1.15 + L.fs * 3.2), cy + Math.sin(m2) * (r * 1.15 + L.fs * 1.2), a2, RAY);
      }
      const ar = fade(t, 60.4, T.X2 - 0.4, 0.8, 0.6);
      if (ar > 0) {
        const lr = Math.min(9, reach(B0, KR) * 0.85);
        arrowCm(s, B0, [B0[0] + lr * KR[0], B0[1] + lr * KR[1]], 0.6 * ar, RAY, 1.6);
        label(s, 'reflected', PX(B0[0] + lr * KR[0]) + L.fs * 0.6, PY(B0[1] + lr * KR[1]) + L.fs * 0.6, ar, RAY, 'left');
      }
    }
  }

  // ---------- parts 3 and 4: diffraction ----------
  function drawBarrier(s, w, a) {
    if (a <= 0) return;
    const { g } = s, x0 = PX(L.XB - BAR_T / 2), bw = BAR_T * L.ppc, ya = PY(L.YC - w / 2), yb = PY(L.YC + w / 2);
    g.globalCompositeOperation = 'source-over';
    const gr = g.createLinearGradient(x0, 0, x0 + bw, 0);
    gr.addColorStop(0, `rgba(150,160,180,${a})`); gr.addColorStop(0.5, `rgba(205,212,228,${a})`); gr.addColorStop(1, `rgba(120,128,148,${a})`);
    g.fillStyle = gr;
    g.fillRect(x0, PY(0), bw, ya - PY(0)); g.fillRect(x0, yb, bw, PY(L.TH) - yb);
  }
  function part3(s, t) {
    const wide = t < T.X3, w = wide ? GAP_W : GAP_N;
    const a = wide ? fade(t, T.X2 + 0.3, T.X3 - 0.4, 0.8, 0.6) : fade(t, T.X3 + 0.3, T.X4 - 0.4, 0.8, 0.6); if (a <= 0) return;
    drawBar(s, t, a); drawBarrier(s, w, a);
    const xr = L.XB - BAR_T / 2 - 1.0;
    if (wide) {
      bracket(s, [xr, L.YC - w / 2], [xr, L.YC + w / 2], '15 cm', fade(t, 67.2, 72.6, 0.7, 0.6), C.text, 1);   // gone before the rays come
      const aR = fade(t, 72.6, T.X3 - 0.4, 0.8, 0.6);
      if (aR > 0) for (const f of [-0.3, 0, 0.3]) arrowCm(s, [1.6, L.YC + f * w], [L.TW - 1.2, L.YC + f * w], aR);
    } else {
      label(s, 'gap 2.0 cm', PX(L.XB) - L.fs * 0.8, PY(L.YC - w / 2) - L.fs * 1.3, fade(t, 84.6, 95.4, 0.7, 0.6), C.text, 'right');
      // rays spreading from the gap, at right angles to the curved wavefronts
      const aR = fade(t, 85.0, T.X4 - 0.4, 0.8, 0.6), front = C1 * (t - T.F3b);
      if (aR > 0) for (const ang of [-60, -30, 0, 30, 60]) {
        const u = [Math.cos(ang * DEG), Math.sin(ang * DEG)], p = [L.XB + 1.6 * u[0], L.YC + 1.6 * u[1]];
        const lr = Math.min(Math.max(0, front - 2.5), reach(p, u) * 0.9, 13);
        if (lr > 1) arrowCm(s, p, [p[0] + lr * u[0], p[1] + lr * u[1]], aR, RAY, 2);
      }
      // Huygens: wavelets from points across the gap
      const aH = fade(t, 95.8, 101.2, 0.6, 0.6);
      if (aH > 0) {
        const { g } = s, base = (C1 * t) % LAM;
        for (let k = 0; k < 3; k++) {                                // three of the points across the gap, each sending out a wavelet
          const y = L.YC - w / 2 + (k + 0.5) * w / 3, cx = PX(L.XB + BAR_T / 2), cy = PY(y), rr = base * L.ppc;
          D.glowDot(s, cx, cy, Math.max(4, L.ppc * 0.3), C.white, aH);
          if (rr <= 1) continue;
          g.globalCompositeOperation = 'source-over';
          g.strokeStyle = `rgba(255,255,255,${aH * 0.7 * (1 - base / LAM)})`; g.lineWidth = 1.4;
          g.beginPath(); g.arc(cx, cy, rr, -Math.PI / 2, Math.PI / 2); g.stroke();
        }
      }
    }
  }

  // ---------- part 5: two-source interference ----------
  function hyperbola(delta) {                                        // points where r1 − r2 = delta (cm)
    const c = SEP / 2, a = Math.abs(delta) / 2, b = Math.sqrt(c * c - a * a), sg = delta >= 0 ? 1 : -1, pts = [];
    for (let u = -3.2; u <= 3.2; u += 0.02) pts.push([L.M4[0] + b * Math.sinh(u), L.M4[1] + sg * a * Math.cosh(u)]);
    return pts;
  }
  function gauge(s, p, t, a, name) {
    if (a <= 0) return;
    const cx = PX(p[0]), cy = PY(p[1]), hh = Math.max(12, L.ppc * 1.1), gx = cx + Math.max(14, L.fs * 1.3);
    const v = clamp(dispTwo(p, t) / 0.9, -1, 1);
    D.glowDot(s, cx, cy, Math.max(7, L.fs * 0.6), C.white, a);
    label(s, name, cx - L.fs * 1.0, cy - L.fs * 1.1, a, C.white, 'right', L.fs + 1);
    D.line(s, gx, cy - hh, gx, cy + hh, C.text, 0.5 * a, 1.2);
    D.line(s, gx - 4, cy, gx + 4, cy, C.text, 0.5 * a, 1);
    D.glowDot(s, gx, cy - v * hh, Math.max(7, L.fs * 0.7), C.light, a);
  }
  function part5(s, t) {
    const a = fade(t, T.X4 + 0.3, DURATION, 0.8, 0.6); if (a <= 0) return;
    for (const [S, nm] of [[L.S1, 'S₁'], [L.S2, 'S₂']]) {
      const dip = 0.6 + 0.4 * Math.cos(OM * t);
      D.glowDot(s, PX(S[0]), PY(S[1]), Math.max(10, L.ppc * 0.9), '230,236,255', a * dip);
      label(s, nm, PX(S[0]) - L.fs * 1.4, PY(S[1]), a, C.text, 'right');
    }
    // the lines are drawn to the right of the sources only (the pattern is the same on the left), so the water stays visible there
    const aD = fade(t, 114.2, DURATION, 0.8, 0.6), aC = fade(t, 120.0, DURATION, 0.8, 0.6), right = (x) => x > L.M4[0] + 0.6;
    for (const d of [-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5]) dashed(s, clipped(hyperbola(d * LAM), right), DEST, 0.8 * aD, L.phone ? 1.6 : 2);
    for (const d of [-3, -2, -1, 0, 1, 2, 3]) dashed(s, clipped(hyperbola(d * LAM), right), CONS, 0.8 * aC, L.phone ? 1.6 : 2, [2, 6]);
    if (aD > 0 && !L.phone) {                                         // a key in the bottom-right corner of the tank (phones: the captions name the colours)
      const items = [[DEST, [7, 6], 'destructive: (n + ½)λ', aD], [CONS, [2, 6], 'constructive: nλ', aC]];
      const { g } = s, size = L.fs, lh = size * 1.7; g.font = D.sans(size);
      const w = Math.max(...items.map((it) => g.measureText(it[2]).width)) + size * 4;
      const x0 = PX(L.TW) - w - 8, y0 = PY(L.TH) - lh * 2 - 14;
      g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(4,10,24,${0.75 * aD})`;
      g.beginPath(); g.roundRect(x0, y0, w, lh * 2 + 8, 8); g.fill();
      items.forEach(([rgb, dash, txt, al], i) => {
        if (al <= 0) return;
        const y = y0 + 4 + lh * (i + 0.5);
        D.line(s, x0 + size * 0.6, y, x0 + size * 2.6, y, rgb, al, 2, dash);
        D.text(s, txt, x0 + size * 3.2, y, size, al, D.sans(size), C.text, 'left');
      });
    }
    // P and Q, with the path lengths and a gauge showing how the water there moves
    const aP = fade(t, 125.6, DURATION, 0.7, 0.6), aPl = fade(t, 131.0, 136.2, 0.6, 0.6);
    const aQ = fade(t, 136.6, DURATION, 0.7, 0.6), aQl = fade(t, 136.6, 142.0, 0.6, 0.6);
    const paths = (p, r, al) => {
      if (al <= 0) return;
      D.line(s, PX(L.S1[0]), PY(L.S1[1]), PX(p[0]), PY(p[1]), C.force, al, 2);
      D.line(s, PX(L.S2[0]), PY(L.S2[1]), PX(p[0]), PY(p[1]), C.vel, al, 2);
      label(s, `${r[0].toFixed(1)} cm`, PX((L.S1[0] + p[0]) / 2), PY((L.S1[1] + p[1]) / 2) - L.fs * 0.9, al, C.force);
      label(s, `${r[1].toFixed(1)} cm`, PX((L.S2[0] + p[0]) / 2), PY((L.S2[1] + p[1]) / 2) + L.fs * 1.1, al, C.vel);
    };
    paths(L.P, P_R, aPl); paths(L.Q, Q_R, aQl);
    gauge(s, L.P, t, aP, 'P'); gauge(s, L.Q, t, aQ, 'Q');
  }

  // ---------- the end card ----------
  function endCard(s, t) {
    const a = fade(t, T.END, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 30, 18, 38)), s2 = Math.round(clamp(W / 60, 12, 19)), s3 = Math.round(clamp(W / 66, 11, 17));
    D.text(s, 'Waves in a ripple tank', W / 2, H * (phone ? 0.1 : 0.13), s1, a, D.sans(s1, 300));
    const items = [
      ['Wavefronts and rays', CREST, 'A wavefront joins points in phase; neighbouring wavefronts are λ apart. Rays are at right angles to them.'],
      ['Refraction', RAY, 'The speed changes, so the wavelength changes, and so does the direction (unless it arrives along the normal); the frequency doesn\'t. sin θ₂ / sin θ₁ = v₂ / v₁'],
      ['Diffraction', '160,215,255', 'Waves spread out through a gap or round an edge, most when the gap is similar in size to the wavelength.'],
      ['Interference', CONS, 'Coherent sources: constructive where the path difference = nλ, destructive where it is (n + ½)λ.'],
    ];
    if (phone) {
      let y = H * 0.2;
      for (const [h, rgb, txt] of items) {
        D.text(s, h, W / 2, y, s2 + 1, a, D.sans(s2 + 1, 600), rgb); y += s2 * 1.5;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 36); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 1.1;
      }
    } else {
      const colW = Math.min(W * 0.36, 420);
      g.font = D.sans(s2);
      const wrapped = items.map(([, , txt]) => D.wrap(s, txt, colW));
      // the second row starts below the longest text of the first row (small screens wrap to more lines)
      const y1 = H * 0.3, y2 = Math.max(H * 0.58, y1 + s2 * 2 + s2 * 1.3 * Math.max(wrapped[0].length, wrapped[1].length) + s2 * 1.4);
      items.forEach(([h, rgb], i) => {
        const x = W / 2 + (i % 2 ? 1 : -1) * W * 0.22, y = i < 2 ? y1 : y2;
        D.text(s, h, x, y, s2 + 3, a, D.sans(s2 + 3, 600), rgb);
        D.text(s, wrapped[i], x, y + s2 * 2, s2, 0.85 * a, D.sans(s2));
      });
    }
  }

  Anim.register('wavefronts', {
    duration: DURATION,
    poster: 122,
    pauses: [[20.5, 1.2], [37.6, 2.0], [59.4, 1.5], [82.4, 2.0], [100.6, 1.2], [130.0, 2.0], [141.3, 1.5], [146.8, 1.5]],
    // score: ripples on water (B major, soft sine pad, glassy bells, a long echo, a soft shimmer)
    music: { chords: [[47, 54, 59, 63], [44, 51, 56, 63], [52, 56, 59, 63], [54, 58, 61, 64]], bar: 9, pad: 'sine', cutoff: 1300, drone: 0.06, bells: 0.6, bellType: 'glass', bellOct: 1, echo: 0.6, shimmer: 0.3, volume: 0.32 },
    resize: layout,
    // for checking the numbers (not used by the player)
    info: { LAM, LAM2, TH2: TH2 / DEG, CAPS, partAt, pointAt: (r) => pointAt(r), layout: () => L, dispTwo },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.18);
      drawWater(s, t);
      const p = partAt(t);
      if (p === 1) part1(s, t); else if (p === 2) part2(s, t); else if (p <= 4) part3(s, t); else part5(s, t);
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'Wavefronts and rays', 'Refraction, diffraction and interference in a ripple tank');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
