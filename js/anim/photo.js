/* E.2 (HL) The photoelectric effect. A photocell (sodium cathode, anode, vacuum, meter, variable p.d.) lit by red,
   violet and ultraviolet light; one photon gives all its energy to one electron; the stopping voltage; the
   Eₘₐₓ–f graph.
   Numbers (data booklet: h = 6.63 × 10⁻³⁴ J s, c = 3.00 × 10⁸ m s⁻¹, e = 1.60 × 10⁻¹⁹ C; sodium Φ = 2.28 eV, as in
   the notes), with hf = hc/λ:
   - red 650 nm: f = 3.00e8 ÷ 650e-9 = 4.62 × 10¹⁴ Hz; hf = 3.06 × 10⁻¹⁹ J = 1.91 eV < 2.28 eV: no electrons.
   - violet 400 nm: f = 7.50 × 10¹⁴ Hz; hf = 4.97 × 10⁻¹⁹ J = 3.11 eV; Eₘₐₓ = 3.11 − 2.28 = 0.83 eV; Vₛ = 0.83 V.
   - 350 nm (ultraviolet): f = 8.57 × 10¹⁴ Hz; hf = 3.55 eV; Eₘₐₓ = 1.27 eV (graph point only).
   - ultraviolet 300 nm: f = 1.00 × 10¹⁵ Hz; hf = 6.63 × 10⁻¹⁹ J = 4.14 eV; Eₘₐₓ = 1.86 eV; Vₛ = 1.86 V.
   - f₀ = Φ/h = 2.28 × 1.60e-19 ÷ 6.63e-34 = 5.50 × 10¹⁴ Hz (λ = 545 nm, green).
   - gradient = (1.86 − 0.83) eV ÷ (10.0 − 7.5) × 10¹⁴ Hz = (1.03 × 1.60e-19 J) ÷ (2.5e14 Hz) = 6.6 × 10⁻³⁴ J s.
   The model: each photon above f₀ frees one electron, with kinetic energy Eₘₐₓ√u (u random in 0–1: electrons from
   deeper down lose more on the way out). The electron then moves across the gap under the p.d. V (kinetic energy
   changes by eV across the whole gap), integrated step by step once when the page loads. So the fraction that reaches
   the anode is 1 for V ≥ 0 and 1 − (|V|/Eₘₐₓ)² for reverse p.d., which is the current plotted. Hugely slowed down. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- physics ----------
  const H_PL = 6.63e-34, C_L = 3.00e8, E_CH = 1.60e-19, PHI = 2.28;
  const hfEV = (lam) => H_PL * C_L / (lam * 1e-9) / E_CH;              // photon energy in eV
  const freq = (lam) => C_L / (lam * 1e-9);                             // Hz
  const emax = (lam) => Math.max(0, hfEV(lam) - PHI);
  const F0 = PHI * E_CH / H_PL;                                         // 5.50e14 Hz
  const fracReach = (V, Em) => (Em <= 0 ? 0 : V >= 0 ? 1 : Math.max(0, 1 - Math.pow(-V / Em, 2)));
  const nb = (s) => s.replace(/~/g, ' ');

  // ---------- timeline ----------
  const LAMP = [                                                         // [on, off, wavelength (nm), photons per second]
    [10.0, 20.2, 650, 2.5], [20.2, 30.6, 650, 16],
    [31.4, 47.8, 400, 2.5], [47.8, 80.8, 400, 14],
    [85.2, 100.0, 300, 14], [104.4, 136.0, 300, 5],
  ];
  // the reverse p.d. is held after each lamp goes off, until the electrons still in flight have been turned back
  const V_KEYS = [[0, 1.0], [61.0, 1.0], [74.4, -0.83], [77.4, -0.83], [79.0, -1.2], [84.0, -1.2], [85.0, 1.0],
    [87.6, 1.0], [96.6, -1.86], [99.2, -1.86], [100.0, -2.1], [103.4, -2.1], [104.2, 1.0], [300, 1.0]];
  const Vat = (t) => { for (let i = 1; i < V_KEYS.length; i++) { const [ta, va] = V_KEYS[i - 1], [tb, vb] = V_KEYS[i]; if (t <= tb) return va + (vb - va) * smooth((t - ta) / (tb - ta)); } return 1; };
  const lampAt = (t) => { for (const L of LAMP) if (t >= L[0] - 0.3 && t < L[1] + 0.3) return L; return null; };
  const lampLevel = (t) => {                                             // 0 (off) to 1 (bright), for the glow
    let a = 0; for (const [t0, t1, , r] of LAMP) a = Math.max(a, fade(t, t0, t1, 0.4, 0.4) * clamp(r / 14, 0.3, 1));
    return a;
  };
  const RATE_FULL = 14;
  const currentAt = (t) => {                                             // the expected photocurrent, as a fraction of full scale
    let I = 0; for (const [t0, t1, lam, r] of LAMP) I += fade(t, t0, t1, 0.4, 0.4) * (r / RATE_FULL) * fracReach(Vat(t), emax(lam));
    return I;
  };
  const T_IV = 58.6, T_GRAPH = 100.2, T_END = 136.2, DURATION = 149;

  // ---------- captions (~ is a non-breaking space) ----------
  const CAPS = [
    [4.8, 9.8, 'A photocell: light falls on a clean sodium surface (the cathode) inside a vacuum tube. The meter shows any current. (All hugely slowed down.)'],
    [10.2, 15.2, 'Red light, 650~nm. Each photon carries hf~=~hc/λ~=~1.91~eV. No electrons come out: the current is zero.'],
    [15.4, 20.0, 'Predict: what will happen if the red light is made much brighter?'],
    [20.4, 25.4, 'Still nothing, however bright. Brighter light means more photons, but each still has only 1.91~eV.'],
    [25.6, 30.6, 'Sodium\'s work function is Φ~=~2.28~eV: the least energy needed to free an electron. One red photon is not enough.'],
    [31.6, 36.8, 'Violet light, 400~nm, very dim. Electrons come out straight away: there is no delay.'],
    [37.0, 42.6, 'One photon gives all its energy, hf~=~3.11~eV, to one electron. Escaping takes at least Φ~=~2.28~eV, so it leaves with up to Eₘₐₓ~=~3.11~−~2.28~=~0.83~eV.'],
    [42.8, 47.6, 'Electrons from deeper in the metal lose more on the way out, so 0.83~eV is the maximum kinetic energy.'],
    [48.0, 53.4, 'Brighter violet light: more photons each second, so more electrons each second and a bigger current.'],
    [53.6, 58.4, 'But not faster ones: their maximum kinetic energy is still 0.83~eV.'],
    [58.6, 63.6, 'Now change the p.d. across the tube, and plot the current against it.'],
    [63.8, 68.0, 'With the anode positive, every electron that leaves is collected, so the current stays the same.'],
    [68.2, 74.2, 'With the anode negative, it pushes the electrons back. Only the faster ones still reach it, so the current falls.'],
    [74.4, 77.6, 'At the stopping voltage Vₛ even the fastest electrons are turned back, and the current is zero. Here Vₛ~=~0.83~V.'],
    [77.8, 80.8, 'So eVₛ~=~Eₘₐₓ: measuring the stopping voltage measures the maximum kinetic energy.'],
    [85.4, 90.4, 'Ultraviolet, 300~nm: hf~=~4.14~eV, so Eₘₐₓ~=~4.14~−~2.28~=~1.86~eV. The electrons are faster.'],
    [91.4, 96.0, 'With the anode negative again, the faster electrons keep reaching it for longer.'],
    [96.2, 99.6, 'This time the stopping voltage is Vₛ~=~1.86~V: faster electrons need a bigger one.'],
    [100.4, 105.6, 'Plot Eₘₐₓ against the frequency f of the light: for sodium the points lie on a straight line.'],
    [105.8, 111.6, 'Eₘₐₓ~=~hf~−~Φ. The line crosses the f axis at the threshold frequency f₀~=~Φ/h~=~5.50~×~10¹⁴~Hz (545~nm, green).'],
    [111.8, 117.6, 'Red light (4.6~×~10¹⁴~Hz) is below f₀, so it frees no electrons, however bright.'],
    [117.8, 123.8, 'The gradient is the Planck constant: (1.03~×~1.60~×~10⁻¹⁹~J) ÷ (2.5~×~10¹⁴~Hz) = 6.6~×~10⁻³⁴~J~s.'],
    [124.0, 129.6, 'Extended back (dashed: that part can\'t be measured), the line meets the Eₘₐₓ axis at −Φ~=~−2.28~eV.'],
    [129.8, 136.0, 'The wave model predicted that any frequency would work if bright enough, that dim light would need time to start, and that brighter light would give faster electrons. All three are wrong.'],
  ].map(([a, b, s]) => [a, b, nb(s)]);
  const T_PREDICT = 19.4;
  // holds: each caption gets enough time to read at about 16 characters a second (plus its fades)
  const PAUSES = (() => {
    const p = [];
    for (const [a, b, s] of CAPS) {
      const short = s.length / 16 + 1.2 - (b - a);
      if (short > 0.2) p.push([+(b - 0.75).toFixed(2), +short.toFixed(1)]);
    }
    p.push([T_PREDICT, 6.0]);
    return p;
  })();

  // ---------- photons and electrons (made once, from a fixed seed) ----------
  let seed = 20261116;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const TRAVEL = 0.8;                                                    // seconds for a photon from the lamp to the metal
  const U0 = 0.8, DT = 0.005, SAMPLE = 0.02, PER = Math.round(SAMPLE / DT), MAXLIFE = 10;
  const PHOTONS = [], ELECTRONS = [];
  for (const [t0, t1, lam, rate] of LAMP) {
    const n = Math.floor((t1 - t0) * rate);
    for (let k = 0; k < n; k++) {
      const te = t0 + (k + 0.5 + 0.7 * (rnd() - 0.5)) / rate;
      const ph = { t: te, hit: te + TRAVEL, lam, u: lerp(-0.8, 0.8, rnd()) };
      PHOTONS.push(ph);
      if (hfEV(lam) > PHI) {
        // the electron: kinetic energy Eₘₐₓ√r; moves along the gap, s from 0 (cathode) to 1 (anode), under V(t)
        const KE0 = emax(lam) * Math.sqrt(rnd()), samples = [];
        let s = 0, v = U0 * Math.sqrt(KE0), t = ph.hit, steps = 0, fate = 'lost';
        samples.push(0);
        while (t < ph.hit + MAXLIFE) {
          const a = (U0 * U0 / 2) * Vat(t);                              // dKE/ds = eV per gap, KE = (v/U0)²
          v += a * DT; s += v * DT; t += DT; steps++;
          if (steps % PER === 0) samples.push(clamp(s, 0, 1));
          if (s >= 1) { fate = 'anode'; break; }
          if (s <= 0 && v < 0) { fate = 'back'; break; }
        }
        samples.push(clamp(s, 0, 1));
        ELECTRONS.push({ t: ph.hit, end: t, fate, u: ph.u, KE0, lam, samples: Float32Array.from(samples) });
      }
    }
  }
  const sAt = (el, t) => { const f = clamp((t - el.t) / SAMPLE, 0, el.samples.length - 1.001), k = Math.floor(f); return lerp(el.samples[k], el.samples[k + 1], f - k); };

  // ---------- colours ----------
  const UV_RGB = '200,170,255';
  const nmRGB = (l) => {                                               // the colour of light of wavelength l (nm)
    if (l < 380) return UV_RGB;
    let r = 0, g = 0, b = 0;
    if (l < 440) { r = (440 - l) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = (510 - l) / 20; }
    else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = (645 - l) / 65; } else r = 1;
    const f = l < 420 ? 0.3 + 0.7 * (l - 380) / 40 : l > 700 ? 0.3 + 0.7 * (780 - l) / 80 : 1;
    const c = (v) => Math.round(255 * Math.pow(Math.max(0, v * f), 0.8));
    return `${Math.max(c(r), 30)},${c(g)},${Math.max(c(b), 0)}`;
  };
  const txtRGB = (l) => nmRGB(l).split(',').map((v) => Math.round(+v + (255 - v) * 0.45)).join(',');   // lighter, for text on the dark stage
  const lightName = (l) => (l < 380 ? 'ultraviolet' : l < 450 ? 'violet' : 'red');
  const EM = C.good, PHI_RGB = '255,170,85', METAL = '170,180,205';

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;                               // the 4:5 stage: buttons below the picture
    const capFs = Math.round(clamp(W / 44, 15, 25)), capTop = H - capFs * (phone ? 6.4 : 4.6);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    let tx0, tx1, ty, th, lamp, cy, panel;
    if (phone) {
      tx0 = W * 0.08; tx1 = W * 0.92; ty = H * 0.17; th = H * 0.07;
      lamp = { x: W * 0.62, y: H * 0.04 };
      cy = ty + th + H * 0.06;
      panel = { x0: W * 0.06, x1: W * 0.94, y0: cy + Math.max(10, fs * 1.4) + fs * 2.6, y1: capTop - fs * 0.6 };
    } else {
      tx0 = W * 0.05; tx1 = W * 0.53; ty = H * 0.38; th = H * 0.13;
      lamp = { x: W * 0.33, y: Math.max(H * 0.1, 40) };
      cy = ty + th + H * 0.12;
      panel = { x0: W * 0.59, x1: W * 0.965, y0: Math.max(62, H * 0.15), y1: capTop - fs * 0.8 };
    }
    const tw = tx1 - tx0, R = th * 1.1, cc = tx0 + tw * 0.1 + R;           // the cathode: an arc of radius R, concave to the right
    const ax = tx1 - tw * 0.12;
    L = { W, H, phone, fs, capFs, capTop, tx0, tx1, ty, th, lamp, cy, panel, R, cc, ax };
  }
  const cathodePt = (u) => { const ph = u * 50 * Math.PI / 180; return [L.cc - L.R * Math.cos(ph), L.ty + L.R * Math.sin(ph)]; };
  const anodePt = (u) => [L.ax, L.ty + u * L.th * 0.3];

  // text made of pieces: [text, style]: 'i' italic serif, 'r' upright serif, 's' subscript, 'p' superscript, 'sans'
  function rich(s, parts, x, y, size, a, rgb = C.text, align = 'center') {
    const { g } = s; if (a <= 0) return 0;
    const font = (st) => st === 's' || st === 'p' ? D.serif(Math.round(size * 0.7)) : st === 'i' ? D.serif(size) : st === 'r' ? D.serif(size, false) : D.sans(Math.round(size * 0.9));
    const ws = parts.map(([tx, st]) => { g.font = font(st); return g.measureText(tx).width; });
    const total = ws.reduce((p, q) => p + q, 0);
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 10; g.fillStyle = `rgba(${rgb},${a})`;
    parts.forEach(([tx, st], i) => { g.font = font(st); g.fillText(tx, px, st === 's' ? y + size * 0.28 : st === 'p' ? y - size * 0.35 : y); px += ws[i]; });
    g.shadowBlur = 0;
    return total;
  }
  const label = (s, txt, x, y, a, rgb = C.muted, align = 'center', size = L.fs, w = 400) => D.text(s, txt, x, y, size, a, D.sans(size, w), rgb, align);

  function packet(s, x, y, ux, uy, lam, rgb, a) {
    if (a <= 0) return;
    const fs = L.fs, lamPx = clamp(lam / 650 * fs * 1.1, 3, 40), len = Math.max(fs * 3.0, lamPx * 2.3), amp = Math.max(3, fs * 0.38);
    const nx = -uy, ny = ux, pts = [];
    for (let i = 0; i <= 40; i++) {
      const u = (i / 40 - 0.5) * len, env = Math.exp(-Math.pow(2 * u / len, 2) * 2.4), w = amp * env * Math.sin(2 * Math.PI * u / lamPx);
      pts.push([x + ux * u + nx * w, y + uy * u + ny * w]);
    }
    D.glowDot(s, x, y, len * 0.4, rgb, 0.25 * a);
    D.glowLine(s, pts, rgb, a, 1.5);
  }

  // ---------- the photocell ----------
  function drawCell(s, t, a) {
    const { g } = s, { fs, tx0, tx1, ty, th, cc, R, ax, cy, phone, lamp } = L;
    if (a <= 0) return;
    g.globalAlpha = a;
    // glass envelope
    g.fillStyle = 'rgba(120,150,220,0.05)'; g.beginPath(); g.roundRect(tx0, ty - th, tx1 - tx0, 2 * th, th); g.fill();
    g.globalAlpha = 1;
    D.glowLine(s, [[tx0 + th, ty - th], [tx1 - th, ty - th]], '160,185,240', 0.35 * a, 1.1);
    D.glowLine(s, [[tx0 + th, ty + th], [tx1 - th, ty + th]], '160,185,240', 0.35 * a, 1.1);
    const arcPts = (x0, sgn) => { const p = []; for (let i = 0; i <= 24; i++) { const an = -Math.PI / 2 + Math.PI * i / 24; p.push([x0 + sgn * th * Math.cos(an), ty + th * Math.sin(an)]); } return p; };
    D.glowLine(s, arcPts(tx0 + th, -1), '160,185,240', 0.35 * a, 1.1);
    D.glowLine(s, arcPts(tx1 - th, 1), '160,185,240', 0.35 * a, 1.1);
    // cathode (arc) and anode (rod)
    const cpts = []; for (let i = 0; i <= 30; i++) cpts.push(cathodePt(-1 + 2 * i / 30));
    g.globalCompositeOperation = 'source-over'; g.lineCap = 'round';
    g.strokeStyle = `rgba(${METAL},${a})`; g.lineWidth = Math.max(4, fs * 0.45);
    g.beginPath(); cpts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    g.beginPath(); g.moveTo(ax, ty - th * 0.45); g.lineTo(ax, ty + th * 0.45); g.stroke();
    // wires to the circuit below
    const [cbx, cby] = cathodePt(1), wireC = 'rgba(170,182,220,', yA = ty + th * 0.45;
    const xm = (tx0 + tx1) / 2, rA = Math.max(10, fs * 1.4);
    const ammX = phone ? tx0 + (tx1 - tx0) * 0.3 : tx0 + (tx1 - tx0) * 0.32, batX = phone ? tx0 + (tx1 - tx0) * 0.7 : tx0 + (tx1 - tx0) * 0.68;
    g.strokeStyle = `${wireC}${0.75 * a})`; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(cbx, cby); g.lineTo(cbx, cy); g.lineTo(ammX - rA, cy); g.moveTo(ammX + rA, cy); g.lineTo(batX - fs * 0.6, cy);
    g.moveTo(batX + fs * 0.6, cy); g.lineTo(ax, cy); g.lineTo(ax, yA); g.stroke();
    // ammeter with a needle showing the current
    const I = currentAt(t);
    g.fillStyle = `rgba(10,14,30,${0.9 * a})`; g.beginPath(); g.arc(ammX, cy, rA, 0, 7); g.fill();
    g.strokeStyle = `rgba(${EM},${0.85 * a})`; g.lineWidth = 1.5; g.beginPath(); g.arc(ammX, cy, rA, 0, 7); g.stroke();
    const na = -Math.PI * 0.85 + Math.PI * 0.7 * clamp(I / 1.1, 0, 1);       // the needle: from far left (zero) to the right
    g.strokeStyle = `rgba(255,255,255,${0.9 * a})`; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(ammX, cy + rA * 0.45); g.lineTo(ammX + Math.cos(na) * rA * 0.95, cy + rA * 0.45 + Math.sin(na) * rA * 0.95); g.stroke();
    label(s, 'A', ammX, cy + rA * 0.62, 0.8 * a, EM, 'center', Math.round(fs * 0.8), 600);
    label(s, phone ? 'current' : 'photocurrent', ammX, cy + rA + fs * 0.95, 0.85 * a, C.muted, 'center', fs);
    // the variable supply: two plates (long = +), with an arrow across; it is reversed when V < 0
    const V = Vat(t), rev = V < 0;
    const pl = (x, long) => { g.strokeStyle = `rgba(220,226,250,${0.9 * a})`; g.lineWidth = long ? 1.6 : 3; const hh = long ? fs * 0.9 : fs * 0.5; g.beginPath(); g.moveTo(x, cy - hh); g.lineTo(x, cy + hh); g.stroke(); };
    pl(batX - fs * 0.6, rev); pl(batX + fs * 0.6, !rev);
    D.arrow(s, batX - fs * 1.4, cy + fs * 1.0, batX + fs * 1.4, cy - fs * 1.0, C.muted, 0.7 * a, '', { head: 6, width: 1.2, blur: 0 });
    const vtxt = `p.d. ${V >= 0 ? '+' : '−'}${Math.abs(V).toFixed(2)} V`;
    label(s, vtxt, batX, cy + fs * 2.0, 0.9 * a, rev ? PHI_RGB : C.text, 'center', fs, 600);
    // signs on the electrodes
    label(s, rev ? '−' : '+', ax + fs * 0.9, ty - th * 0.45, 0.9 * a, rev ? PHI_RGB : C.text, 'center', fs + 2, 700);
    label(s, rev ? '+' : '−', cc - R - fs * 0.9, ty - th * 0.2, 0.9 * a, C.text, 'center', fs + 2, 700);
    // labels
    const la = 0.85 * a * fade(t, 4.6, 58.6, 0.8, 1.0);
    label(s, phone ? 'cathode (sodium)' : 'cathode (sodium)', cc - R * 0.5, ty + th + fs * (phone ? 0.9 : 1.0), la, METAL, 'center', fs);
    label(s, 'anode', ax, ty + th + fs * (phone ? 0.9 : 1.0), la, METAL, 'center', fs);
    label(s, 'vacuum', (cc + ax) / 2 + fs, ty - th * 0.62, la * 0.8, C.muted, 'center', fs);
    // the lamp
    const lv = lampLevel(t), Lp = lampAt(t), lrgb = Lp ? nmRGB(Lp[2]) : '120,120,140';
    const lw = fs * 3.2, lh = fs * 1.6;
    g.fillStyle = `rgba(40,46,70,${0.95 * a})`; g.beginPath(); g.roundRect(lamp.x - lw / 2, lamp.y - lh / 2, lw, lh, 4); g.fill();
    if (lv > 0) D.glowDot(s, lamp.x - lw * 0.32, lamp.y + lh * 0.25, fs * 2.2 * (0.6 + 0.6 * lv), lrgb, 0.7 * lv * a);
    if (Lp) label(s, Lp[2] < 380 ? 'ultraviolet lamp' : `${lightName(Lp[2])} light`, lamp.x + lw / 2 + fs * 0.6, lamp.y, 0.85 * a * fade(t, Lp[0], Lp[1], 0.4, 0.4), txtRGB(Lp[2]), 'left', fs, 600);
    else label(s, 'light source', lamp.x + lw / 2 + fs * 0.6, lamp.y, 0.6 * a, C.muted, 'left', fs);
  }

  function drawParticles(s, t, a) {
    if (a <= 0) return;
    const { lamp, fs } = L, src = [lamp.x - fs * 3.2 * 0.32, lamp.y + fs * 0.4];
    // photons: from the lamp to a point on the cathode
    for (const p of PHOTONS) {
      if (t < p.t || t > p.hit + 0.5) continue;
      const [cx, cy] = cathodePt(p.u), rgb = nmRGB(p.lam);
      if (t < p.hit) {
        const f = (t - p.t) / TRAVEL, x = lerp(src[0], cx, f), y = lerp(src[1], cy, f), d = Math.hypot(cx - src[0], cy - src[1]);
        packet(s, x, y, (cx - src[0]) / d, (cy - src[1]) / d, p.lam, rgb, a * Math.min(1, f * 4));
      } else if (hfEV(p.lam) <= PHI) {
        D.glowDot(s, cx, cy, fs * 1.0, '255,140,90', 0.45 * a * (1 - (t - p.hit) / 0.5));      // absorbed: it only warms the metal
      } else D.glowDot(s, cx, cy, fs * 1.2, rgb, 0.6 * a * (1 - (t - p.hit) / 0.5));
    }
    // electrons
    for (const el of ELECTRONS) {
      if (t < el.t || t > el.end + 0.25) continue;
      const [x0, y0] = cathodePt(el.u), [x1, y1] = anodePt(el.u), sNow = sAt(el, t);
      const pos = (sv) => [lerp(x0 + fs * 0.4, x1, sv), lerp(y0, y1, sv)];
      const tr = []; for (let b = 6; b >= 0; b--) tr.push(pos(sAt(el, Math.max(el.t, t - b * 0.04))));
      const fa = t > el.end ? 1 - (t - el.end) / 0.25 : 1;
      D.glowLine(s, tr, C.neg, 0.35 * a * fa, 1.2);
      const [x, y] = pos(sNow);
      D.glowDot(s, x, y, fs * 0.7, C.neg, a * fa);
    }
  }

  // ---------- the panel ----------
  function panelBox(s, a) {
    const { g } = s, p = L.panel;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(14,20,44,${0.72 * a})`;
    g.beginPath(); g.roundRect(p.x0 - 8, p.y0 - 8, p.x1 - p.x0 + 16, p.y1 - p.y0 + 16, 10); g.fill();
  }
  // mode 1: one photon's energy against the work function
  function drawEnergy(s, t, a) {
    if (a <= 0) return;
    const { g } = s, p = L.panel, fs = L.fs;
    panelBox(s, a);
    const Lp = lampAt(t), lam = Lp ? Lp[2] : null, lv = Lp ? fade(t, Lp[0], Lp[1], 0.4, 0.4) : 0;
    label(s, 'the energy of one photon', p.x0, p.y0 + fs * 0.4, 0.9 * a, C.text, 'left', fs + 1, 600);
    const y0 = p.y1 - fs * 0.8, ytop = p.y0 + fs * 5.2, EMAXA = 4.5, Y = (E) => y0 - (E / EMAXA) * (y0 - ytop);
    const pw = p.x1 - p.x0, ax0 = p.x0 + fs * 2.2, bx = p.x0 + pw * 0.55, bw = Math.min(pw * 0.14, fs * 3);
    D.line(s, ax0, y0, ax0, ytop - fs * 0.3, C.muted, 0.6 * a, 1.2);
    D.line(s, ax0, y0, p.x1 - fs * 0.5, y0, C.muted, 0.6 * a, 1.2);
    for (let E = 0; E <= 4; E++) { D.line(s, ax0 - 4, Y(E), ax0, Y(E), C.muted, 0.6 * a, 1); label(s, String(E), ax0 - 6, Y(E), 0.75 * a, C.muted, 'right', fs - 1); }
    rich(s, [['E', 'i'], [' / eV', 'sans']], ax0 + fs * 0.3, ytop - fs * 0.9, fs, 0.85 * a, C.muted, 'left');
    // the work function line, labelled on the left (the bar's labels go on its right)
    D.line(s, ax0, Y(PHI), p.x1 - fs * 0.5, Y(PHI), PHI_RGB, 0.85 * a, 1.5, [6, 4]);
    rich(s, [['Φ', 'i'], [' = 2.28 eV', 'sans']], ax0 + fs * 0.4, Y(PHI) - fs * 0.75, fs, 0.95 * a, PHI_RGB, 'left');
    label(s, 'to escape', ax0 + fs * 0.4, Y(PHI) + fs * 0.8, 0.75 * a, PHI_RGB, 'left', fs - 1);
    if (lam && lv > 0) {
      const E = hfEV(lam), rgb = nmRGB(lam), al = a * lv, xr = bx + bw / 2 + fs * 0.4;
      g.fillStyle = `rgba(${rgb},${0.55 * al})`; g.fillRect(bx - bw / 2, Y(Math.min(E, PHI)), bw, y0 - Y(Math.min(E, PHI)));
      rich(s, [['hf', 'i'], [` = ${E.toFixed(2)} eV`, 'sans']], xr, E > PHI ? Y(E) - fs * 0.85 : Y(E) + fs * 0.7, fs, al, txtRGB(lam), 'left');
      if (E > PHI) {
        g.fillStyle = `rgba(${EM},${0.7 * al})`; g.fillRect(bx - bw / 2, Y(E), bw, Y(PHI) - Y(E));
        rich(s, [['E', 'i'], ['max', 's'], [` = ${(E - PHI).toFixed(2)} eV`, 'sans']], xr, (Y(E) + Y(PHI)) / 2, fs, al, EM, 'left');
      }
      // readouts: wavelength and frequency
      const f = freq(lam) / 1e14;
      label(s, `${lam < 380 ? 'ultraviolet' : lightName(lam)}: λ = ${lam} nm`, p.x0, p.y0 + fs * 1.8, 0.9 * al, txtRGB(lam), 'left', fs);
      rich(s, [['f', 'i'], [` = ${f.toFixed(2)} × 10`, 'sans'], ['14', 'p'], [' Hz', 'sans']], p.x0, p.y0 + fs * 3.1, fs, 0.9 * al, C.text, 'left');
    }
  }
  // mode 2: current against p.d.
  const IV = { V0: -2.2, V1: 1.2 };
  function drawIV(s, t, a) {
    if (a <= 0) return;
    const p = L.panel, fs = L.fs;
    panelBox(s, a);
    label(s, 'current against p.d.', p.x0, p.y0 + fs * 0.4, 0.9 * a, C.text, 'left', fs + 1, 600);
    const gx0 = p.x0 + fs * 1.2, gx1 = p.x1 - fs * 0.6, gy0 = p.y0 + fs * 2.6, gy1 = p.y1 - fs * 2.4;
    const X = (V) => gx0 + (V - IV.V0) / (IV.V1 - IV.V0) * (gx1 - gx0), Y = (I) => gy1 - I / 1.15 * (gy1 - gy0);
    D.line(s, gx0, gy1, gx1, gy1, C.muted, 0.6 * a, 1.2);
    D.line(s, X(0), gy1, X(0), gy0 - fs * 0.4, C.muted, 0.6 * a, 1.2);
    for (const V of [-2, -1, 0, 1]) { D.line(s, X(V), gy1, X(V), gy1 + 4, C.muted, 0.6 * a, 1); label(s, V === 0 ? '0' : (V < 0 ? '−' : '+') + Math.abs(V), X(V), gy1 + fs * 0.95, 0.75 * a, C.muted, 'center', fs - 1); }
    label(s, 'p.d. / V', gx1, gy1 + fs * 2.0, 0.8 * a, C.muted, 'right', fs - 1);
    label(s, L.phone ? 'anode −' : 'anode negative', X(-1.1), gy1 + fs * 2.0, 0.7 * a, PHI_RGB, 'center', fs - 1);
    label(s, 'current', X(0) + fs * 0.4, gy0 - fs * 0.5, 0.8 * a, C.muted, 'left', fs - 1);
    // the traces: violet, then ultraviolet, drawn as the p.d. changes
    const trace = (lam, tA, tB) => {
      if (t < tA) return;
      const pts = [], te = Math.min(t, tB), Em = emax(lam);
      for (let k = 0; k <= 160; k++) { const tt = lerp(tA, te, k / 160), V = Vat(tt); pts.push([X(V), Y(0.98 * fracReach(V, Em))]); }
      D.glowLine(s, pts, nmRGB(lam), a, 1.8);
      if (t <= tB) { const V = Vat(t); D.glowDot(s, X(V), Y(0.98 * fracReach(V, Em)), fs * 1.1, nmRGB(lam), a); }
    };
    trace(400, 61.0, 84.0); trace(300, 87.6, 100.2);
    // the stopping voltages: a dashed line up from the axis to a label near the top, clear of the curves
    const vs = (Em, tOn, rgb, row, align) => {
      const al = a * smooth((t - tOn) / 0.6); if (al <= 0) return;
      const yl = gy0 + fs * (0.2 + 1.3 * row);
      D.line(s, X(-Em), gy1, X(-Em), yl + fs * 0.6, rgb, 0.7 * al, 1.2, [3, 3]);
      rich(s, [['V', 'i'], ['s', 's'], [` = ${Em.toFixed(2)} V`, 'sans']], align === 'left' ? X(-Em) - fs * 0.3 : X(-Em), yl, fs - 1, al, rgb, align);
    };
    vs(emax(400), 74.4, txtRGB(400), 0, 'center'); vs(emax(300), 96.6, txtRGB(300), 1, 'left');
    const V = Vat(t);
    label(s, `p.d. = ${V >= 0 ? '+' : '−'}${Math.abs(V).toFixed(2)} V`, p.x1 - fs * 0.4, p.y0 + fs * 0.4, 0.9 * a, V < 0 ? PHI_RGB : C.text, 'right', fs, 600);
  }
  // mode 3: Eₘₐₓ against f
  const GF = { f1: 11, E0: -2.6, E1: 2.9 };
  function drawEf(s, t, a) {
    if (a <= 0) return;
    const { g } = s, p = L.panel, fs = L.fs;
    panelBox(s, a);
    const gx0 = p.x0 + fs * 3.2, gx1 = p.x1 - fs * 0.8, gy0 = p.y0 + fs * 1.6, gy1 = p.y1 - fs * 2.2;
    const X = (f) => gx0 + f / GF.f1 * (gx1 - gx0), Y = (E) => gy1 - (E - GF.E0) / (GF.E1 - GF.E0) * (gy1 - gy0);
    D.line(s, gx0, Y(0), gx1, Y(0), C.muted, 0.7 * a, 1.2);
    D.line(s, gx0, gy1, gx0, gy0, C.muted, 0.7 * a, 1.2);
    for (const f of [2, 4, 6, 8, 10]) { D.line(s, X(f), Y(0), X(f), Y(0) + 4, C.muted, 0.6 * a, 1); label(s, String(f), X(f), Y(0) + fs * 0.95, 0.75 * a, C.muted, 'center', fs - 1); }
    for (const E of [-2, -1, 1, 2]) { D.line(s, gx0 - 4, Y(E), gx0, Y(E), C.muted, 0.6 * a, 1); label(s, (E < 0 ? '−' : '') + Math.abs(E), gx0 - 6, Y(E), 0.75 * a, C.muted, 'right', fs - 1); }
    rich(s, [['f', 'i'], [' / 10', 'sans'], ['14', 'p'], [' Hz', 'sans']], gx1, Y(0) + fs * 2.1, fs - 1, 0.85 * a, C.muted, 'right');
    rich(s, [['E', 'i'], ['max', 's'], [' / eV', 'sans']], gx0 + fs * 0.4, gy0 - fs * 0.2, fs - 1, 0.85 * a, C.muted, 'left');
    const f0 = F0 / 1e14, lineE = (f) => H_PL * f * 1e14 / E_CH - PHI;
    // points
    const pts = [[400, 101.0], [350, 102.2], [300, 103.4]];
    for (const [lam, tp] of pts) {
      const al = a * smooth((t - tp) / 0.5); if (al <= 0) continue;
      const f = freq(lam) / 1e14, E = emax(lam);
      D.glowDot(s, X(f), Y(E), fs * 1.3, nmRGB(lam), al);
      g.fillStyle = `rgba(255,255,255,${al})`; g.beginPath(); g.arc(X(f), Y(E), 2.6, 0, 7); g.fill();
      if (!L.phone || lam !== 350) {                                     // below and to the right, kept inside the graph
        g.font = D.sans(fs - 1); const w = g.measureText(`${lam} nm`).width;
        label(s, `${lam} nm`, Math.min(X(f) + fs * 0.5, gx1 + fs * 0.5 - w), Y(E) + fs * 1.1, 0.85 * al, txtRGB(lam), 'left', fs - 1);
      }
    }
    // the line from f₀, drawn in
    const la = smooth((t - 105.8) / 1.2) * a;
    if (la > 0) {
      const fe = lerp(f0, GF.f1, smooth((t - 105.8) / 1.2));
      D.glowLine(s, [[X(f0), Y(0)], [X(fe), Y(lineE(fe))]], EM, a, 1.8);
      D.glowDot(s, X(f0), Y(0), fs * 0.9, EM, la);
      rich(s, [['f', 'i'], ['0', 's'], [' = 5.50 × 10', 'sans'], ['14', 'p'], [' Hz', 'sans']], X(f0) + fs * 0.3, Y(0) - fs * 1.0, fs - 1, la, EM, 'right');
    }
    // red light, below f₀
    const ra = a * smooth((t - 111.8) / 0.6);
    if (ra > 0) {
      const fr = freq(650) / 1e14;
      g.strokeStyle = `rgba(${nmRGB(650)},${ra})`; g.lineWidth = 2; g.beginPath(); g.arc(X(fr), Y(0), fs * 0.45, 0, 7); g.stroke();
      label(s, 'red: none', X(fr) - fs * 0.7, Y(0) - fs * 2.1, ra, txtRGB(650), 'right', fs - 1, 600);
    }
    // gradient triangle, above and to the left of the line (the point labels are below it)
    const ga = a * smooth((t - 117.8) / 0.6);
    if (ga > 0) {
      const fa = freq(400) / 1e14, fb = freq(300) / 1e14, Ea = lineE(fa), Eb = lineE(fb);
      D.line(s, X(fa), Y(Ea), X(fa), Y(Eb), C.light, 0.85 * ga, 1.3);
      D.line(s, X(fa), Y(Eb), X(fb), Y(Eb), C.light, 0.85 * ga, 1.3);
      label(s, '1.03 eV', X(fa) - fs * 0.3, (Y(Ea) + Y(Eb)) / 2, ga, C.light, 'right', fs - 1);
      label(s, '2.5 × 10¹⁴ Hz', (X(fa) + X(fb)) / 2, Y(Eb) - fs * 0.75, ga, C.light, 'center', fs - 1);
      label(s, 'gradient = h', (X(fa) + X(fb)) / 2, Y(Eb) - fs * 1.95, ga, C.light, 'center', fs - 1, 600);
    }
    // dashed extension to −Φ
    const da = a * smooth((t - 124.0) / 1.0);
    if (da > 0) {
      D.line(s, X(0), Y(-PHI), X(f0), Y(0), EM, 0.75 * da, 1.5, [6, 5]);
      D.glowDot(s, X(0), Y(-PHI), fs * 0.9, EM, da);
      rich(s, [['−Φ', 'i'], [' = −2.28 eV', 'sans']], X(0) + fs * 0.8, Y(-PHI) + fs * 0.2, fs - 1, da, EM, 'left');
    }
  }

  function endCard(s, t) {
    const a = fade(t, T_END, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.92 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 34, 16, 30)), s3 = Math.round(clamp(W / 60, 11, 17));
    g.font = D.sans(s1, 300);
    D.text(s, D.wrap(s, 'The photoelectric effect (HL): light arrives as photons', W - 40), W / 2, H * (phone ? 0.09 : 0.13), s1, a, D.sans(s1, 300));
    const items = [
      [[['E', 'i'], [' = ', 'r'], ['hf', 'i']], txtRGB(400), 'Each photon gives all its energy to one electron.'],
      [[['E', 'i'], ['max', 's'], [' = ', 'r'], ['hf', 'i'], [' − ', 'r'], ['Φ', 'i']], EM, 'Φ, the work function, is the least energy needed to escape.'],
      [[['eV', 'i'], ['s', 's'], [' = ', 'r'], ['E', 'i'], ['max', 's']], PHI_RGB, 'The stopping voltage measures the maximum kinetic energy.'],
      [[['f', 'i'], ['0', 's'], [' = ', 'r'], ['Φ', 'i'], [' / ', 'r'], ['h', 'i']], C.text, 'Below the threshold frequency: no electrons, however bright.'],
    ];
    if (phone) {
      let y = H * 0.24;
      for (const [eq, rgb, txt] of items) {
        rich(s, eq, W / 2, y, s2, a, rgb); y += s2 * 1.0;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 40); D.text(s, ls, W / 2, y, s3, 0.8 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.75;
      }
    } else {
      const colW = Math.min(W * 0.36, 380);
      g.font = D.sans(s3);
      const wr = items.map(([, , txt]) => D.wrap(s, txt, colW));
      const y1 = H * 0.32, y2 = Math.max(H * 0.58, y1 + s2 * 1.2 + s3 * 1.3 * Math.max(wr[0].length, wr[1].length) + s2 * 1.1);
      items.forEach(([eq, rgb], i) => {
        const x = W / 2 + (i % 2 ? 1 : -1) * W * 0.22, y = i < 2 ? y1 : y2;
        rich(s, eq, x, y, s2, a, rgb);
        D.text(s, wr[i], x, y + s2 * 1.15, s3, 0.8 * a, D.sans(s3));
      });
    }
  }

  Anim.register('photo', {
    duration: DURATION,
    poster: 50,
    pauses: PAUSES,
    // score: a quiet laboratory (F minor, a soft sine pad that slowly swells, a low drone, a breath of wind)
    music: { chords: [[41, 48, 53, 56], [44, 49, 53, 56], [39, 46, 51, 55], [43, 48, 51, 55]], bar: 9, pad: 'sine', cutoff: 800, drone: 0.1, wind: 0.25, tremolo: 0.2, volume: 0.39 },
    resize: layout,
    // for checking the numbers (not used by the player)
    info: {
      hfEV, freq, emax, F0, CAPS, PAUSES, PHOTONS, ELECTRONS, fracReach, Vat,
      check() {
        const r = (x, d) => +x.toFixed(d);
        return {
          red: [r(freq(650) / 1e14, 2), r(hfEV(650), 2)], violet: [r(freq(400) / 1e14, 2), r(hfEV(400), 2), r(emax(400), 2)],
          uv350: [r(freq(350) / 1e14, 2), r(emax(350), 2)], uv300: [r(freq(300) / 1e14, 2), r(hfEV(300), 2), r(emax(300), 2)],
          f0: r(F0 / 1e14, 2), lam0: r(C_L / F0 * 1e9, 0), gradient: (1.03 * E_CH / 2.5e14).toExponential(2),
          reached: ['anode', 'back', 'lost'].map((k) => ELECTRONS.filter((e) => e.fate === k).length),
          fastest: Math.max(...CAPS.map(([a, b, s2]) => { const hold = PAUSES.filter((p) => p[0] >= a && p[0] <= b).reduce((n, p) => n + p[1], 0); return s2.length / (b - a + hold); })).toFixed(1),
        };
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.22);
      const cellA = smooth((t - 4.4) / 0.8) * (1 - smooth((t - T_END) / 0.8));
      drawCell(s, t, cellA);
      drawParticles(s, t, cellA);
      drawEnergy(s, t, fade(t, 9.8, T_IV + 0.4, 0.8, 0.8));
      drawIV(s, t, fade(t, T_IV + 0.2, T_GRAPH + 0.4, 0.8, 0.8));
      drawEf(s, t, fade(t, T_GRAPH, T_END + 0.6, 0.8, 0.8));
      D.legend(s, [['dot', C.neg, 'electron'], ['line', nmRGB(400), 'photon']], fade(t, 5, T_END, 0.6, 0.6));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'The photoelectric effect (HL)', 'Light that frees electrons, one photon at a time');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
