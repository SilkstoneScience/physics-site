/* What is a black hole? (D.1 escape speed (HL), E.5 stellar remnants; the event horizon and general relativity are
   beyond the IB course and labelled so.)
   Numbers (G = 6.67 × 10⁻¹¹, c = 3.00 × 10⁸ m s⁻¹, M☉ = 1.99 × 10³⁰ kg, Earth 5.97 × 10²⁴ kg and 6.37 × 10⁶ m;
   all recalculated in info.check()):
     GM☉ = 6.67 × 10⁻¹¹ × 1.99 × 10³⁰ = 1.327 × 10²⁰ N m² kg⁻¹.
     Escape speed √(2GM/r) from the Sun squeezed to:
       its real radius 6.96 × 10⁸ m: √(2.655 × 10²⁰ ÷ 6.96 × 10⁸) = 6.18 × 10⁵ m s⁻¹ = 618 km s⁻¹ (0.21% of c);
       the Earth's radius, 6.37 × 10⁶ m (about a white dwarf's size): 6.46 × 10⁶ m s⁻¹ ≈ 6500 km s⁻¹ = 2.2% of c ("2%");
       12 km (a neutron star's size): 1.49 × 10⁸ m s⁻¹ = 0.50c ("about half");
       r = 2GM/c² = 2.655 × 10²⁰ ÷ 9.00 × 10¹⁶ = 2.95 × 10³ m: exactly c (the event horizon, the Schwarzschild radius).
     The Earth: 2GM/c² = 2 × 6.67 × 10⁻¹¹ × 5.97 × 10²⁴ ÷ 9.00 × 10¹⁶ = 8.85 × 10⁻³ m ("about 9 mm"; a marble 1.8 cm across).
     The Earth's escape speed: √(2 × 3.98 × 10¹⁴ ÷ 6.37 × 10⁶) = 1.12 × 10⁴ m s⁻¹ (11.2 km s⁻¹, as in D.1 section 11).
     The thrown balls: launched upwards at 0.50, 0.80 and 1.00 of the Earth's escape speed, with r(t) integrated (RK4)
       from a = −GM/r² (no air, no spin). Highest points r = R ÷ (1 − f²): 1.33R and 2.78R; the third never returns.
       Time unit √(R³/GM) = 806 s; on screen the motion is speeded up (SPEEDUP = 1059, shown as "about 1100 times").
     M87's black hole: about 6.5 × 10⁹ M☉, horizon radius 6.5 × 10⁹ × 2.95 km = 1.92 × 10¹⁰ km = 128 au (1 au =
       1.496 × 10⁸ km); Neptune's orbit has a radius of 30 au, so the horizon is wider than Neptune's orbit.
     The Earth's orbit is the same round a black hole of one solar mass: g = GM/r² at 1 au doesn't change
       (6.67 × 10⁻¹¹ × 1.99 × 10³⁰ ÷ (1.496 × 10¹¹)² = 5.93 × 10⁻³ N kg⁻¹).
   The bending of starlight uses the point-lens formula θ = (β ± √(β² + 4θE²)) / 2, with an Einstein radius chosen to show
   the effect (exaggerated; beyond the syllabus, so no numbers are given), as in star-life.js.
   No pauses: the balls are thrown again and again, the squeezing and zooming run at a steady pace, the black hole drifts
   across the stars and the Earth keeps orbiting while each caption is read. Every frame comes from the scene time alone. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const NB = ' ';
  const lg = Math.log10;

  // ---------- physics ----------
  const G = 6.67e-11, CL = 3.00e8, MSUN = 1.99e30, ME = 5.97e24, RE = 6.37e6, AU_KM = 1.496e8;
  const GMS = G * MSUN, RS = 2 * GMS / CL ** 2, RS_E = 2 * G * ME / CL ** 2;
  const vesc = (r) => Math.sqrt(2 * GMS / r);
  const STAGES = [6.96e8, 6.37e6, 1.2e4, RS];                           // m: the Sun, Earth-sized, 12 km, the horizon
  const VE = Math.sqrt(2 * 3.98e14 / RE);

  // the thrown balls, in units R = 1, GM = 1 (time unit √(R³/GM) = 806 s for the Earth)
  const FR = [0.5, 0.8, 1.0];
  const TUNIT = Math.sqrt(RE ** 3 / 3.98e14);
  const flight = (f) => {
    let r = 1, v = f * Math.SQRT2, t = 0; const h = 0.002, out = [[0, 1]];
    const acc = (rr) => -1 / (rr * rr);
    for (let n = 0; n < 200000; n++) {
      const k1r = v, k1v = acc(r), k2r = v + h / 2 * k1v, k2v = acc(r + h / 2 * k1r);
      const k3r = v + h / 2 * k2v, k3v = acc(r + h / 2 * k2r), k4r = v + h * k3v, k4v = acc(r + h * k3r);
      r += h / 6 * (k1r + 2 * k2r + 2 * k3r + k4r); v += h / 6 * (k1v + 2 * k2v + 2 * k3v + k4v); t += h;
      if (n % 10 === 9) out.push([t, r]);
      if (r < 1 || r > 8) break;
    }
    return out;
  };
  const FLIGHTS = FR.map(flight);
  const TRIP = FLIGHTS[1][FLIGHTS[1].length - 1][0];                     // the 0.8 ball's time up and down (time units)
  const SHOW_TRIP = 7.0, SPEEDUP = TRIP * TUNIT / SHOW_TRIP;              // on screen: 7 s up and down
  const rAt = (k, tu) => { const F = FLIGHTS[k]; if (tu <= 0) return 1; const i = Math.min(F.length - 1, Math.floor(tu / 0.02)); return i >= F.length - 1 ? (k === 2 ? F[F.length - 1][1] + 1 : 1) : lerp(F[i][1], F[i + 1][1], (tu - F[i][0]) / 0.02); };

  // ---------- captions and timeline ----------
  const SEQ = [
    ['throw', 'Throw a ball upwards and it comes back down. Throw it faster and it goes higher before it falls back.'],
    ['throw', 'Fast enough, and it never comes back: gravity keeps slowing it, but never stops it. That speed is the escape speed.'],
    ['throw', `(HL) From the surface of a body of mass M and radius r, the escape speed is √(2GM/r). For the Earth it is 11.2${NB}km${NB}s⁻¹.`],
    ['squeeze', `Now imagine squeezing the Sun into a smaller and smaller ball, keeping all of its mass, 1.99${NB}×${NB}10³⁰${NB}kg.`],
    ['squeeze', `(HL) At its real radius, 6.96${NB}×${NB}10⁸${NB}m, the escape speed from its surface is √(2GM/r)${NB}=${NB}618${NB}km${NB}s⁻¹.`],
    ['squeeze', `(HL) Squeezed to the size of the Earth (about the size of a white dwarf), the escape speed would be about 6500${NB}km${NB}s⁻¹: 2% of the speed of light.`],
    ['squeeze', `(HL) Squeezed to a radius of 12${NB}km (the size of a neutron star), it would be about half the speed of light.`],
    ['squeeze', 'Predict: how small would the Sun have to be for the escape speed to reach the speed of light?', 6],
    ['squeeze', `(HL) Set the escape speed equal to c: r${NB}=${NB}2GM/c²${NB}=${NB}2${NB}×${NB}6.67${NB}×${NB}10⁻¹¹${NB}×${NB}1.99${NB}×${NB}10³⁰${NB}÷${NB}(3.00${NB}×${NB}10⁸)²${NB}=${NB}2.95${NB}×${NB}10³${NB}m.`],
    ['squeeze', 'Under 3 km! Squeezed inside that radius, not even light could get out. That is a black hole; the boundary is its event horizon.'],
    ['squeeze', 'This Newton-style argument happens to give the right radius, but the proper theory is general relativity (beyond the IB course): inside a real horizon, nothing can even move outwards.'],
    ['earth', `To become a black hole, the Earth would have to be squeezed to a radius of about 9${NB}mm: about the size of a marble.`],
    ['look', 'Nothing comes out of a black hole, so it looks black. But its gravity bends the light of the stars behind it (exaggerated here).'],
    ['look', 'In 2019 astronomers released the first image of a black hole\'s shadow, in the galaxy M87. In 2022 they imaged the one at the centre of our galaxy.'],
    ['form', 'Real black holes don\'t form by squeezing the Sun: the Sun isn\'t massive enough, and will end as a white dwarf.'],
    ['form', 'They form when the core of a very massive star collapses in a supernova, and is too massive for anything to hold it up.'],
    ['orbit', `A black hole doesn't suck things in. Far away, its gravity is just like that of any other mass: g${NB}=${NB}GM/r².`],
    ['orbit', 'If the Sun were replaced by a black hole of the same mass, the Earth would carry on in exactly the same orbit (in the dark).'],
    ['orbit', 'Black holes at the centres of galaxies are far bigger. M87\'s has about 6.5 billion solar masses: its event horizon is wider than Neptune\'s orbit.'],
  ];
  const CAPS = [], SEC = {};
  let tc = 4.8;
  for (const [sec, txt, extra = 0] of SEQ) {
    const d = Math.max(5.2, txt.length / 16 + 0.8) + extra;
    CAPS.push([+tc.toFixed(2), +(tc + d).toFixed(2), txt]);
    if (!SEC[sec]) SEC[sec] = [tc, 0];
    SEC[sec][1] = tc + d;
    tc += d + 0.2;
  }
  const END = tc + 0.4, DURATION = END + 12;
  const cap = (i) => CAPS[i];
  const secA = (t, k) => fade(t, SEC[k][0] - 0.4, SEC[k][1] + 0.5, 0.8, 0.8);

  // the squeeze: hold each stage, then shrink (camera fixed) and zoom in (camera follows), 3.4 s per step
  const STEP = 3.4;
  const T_STEP = [cap(5)[0] + 0.4, cap(6)[0] + 0.4, cap(8)[0] + 0.4];   // the three squeezes
  const squeeze = (t) => {                                               // → { r: star radius, view: radius drawn as the reference size }
    let r = STAGES[0], view = STAGES[0], stage = 0, shrinking = false;
    for (let k = 0; k < 3; k++) {
      const a = STAGES[k], b = STAGES[k + 1], u = (t - T_STEP[k]) / STEP;
      if (u <= 0) break;
      const u1 = smooth(u / 0.55), u2 = smooth((u - 0.55) / 0.45);
      r = 10 ** lerp(lg(a), lg(b), u1); view = 10 ** lerp(lg(a), lg(b), u2);
      shrinking = u < 0.55; stage = shrinking ? k : k + 1;
    }
    return { r, view, stage, shrinking };
  };

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25)), capTop = H - capFs * (phone ? 7.0 : 5.6);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    L = { W, H, phone, capFs, capTop, fs, top: phone ? 30 : 40 };
  }
  const T = (s, txt, x, y, a, rgb = C.text, size = L.fs, w = 400, align = 'center') => D.text(s, txt, x, y, size, a, D.sans(size, w), rgb, align);
  const circle = (s, x, y, r, fill, a, stroke = null, lw = 1.4) => {
    const { g } = s; if (a <= 0 || !(r > 0)) return;
    g.globalCompositeOperation = 'source-over'; g.beginPath(); g.arc(x, y, r, 0, 7);
    if (fill) { g.fillStyle = `rgba(${fill},${a})`; g.fill(); }
    if (stroke) { g.strokeStyle = `rgba(${stroke},${a})`; g.lineWidth = lw; g.stroke(); }
  };
  const pill = (s, txt, x, y, a, rgb) => {
    if (a <= 0) return;
    const { g } = s, fs = L.fs; g.font = D.sans(fs, 700);
    const w = g.measureText(txt).width + fs;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(${rgb},${0.9 * a})`;
    g.beginPath(); g.roundRect(x, y - fs * 0.75, w, fs * 1.5, fs * 0.75); g.fill();
    D.text(s, txt, x + w / 2, y, fs, a, D.sans(fs, 700), '20,20,30');
    return w;
  };
  // seeded background stars, in a unit box
  const STARS = (() => { let sd = 2019; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    return Array.from({ length: 170 }, () => [r(), r(), 0.3 + 0.7 * r() ** 2]); })();
  const LENS_STARS = (() => { let sd = 2022; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    return Array.from({ length: 900 }, () => [r(), r(), 0.3 + 0.7 * r() ** 2]); })();
  const starfield = (s, a) => { const { g, W } = s; for (const [x, y, b] of STARS) { g.fillStyle = `rgba(225,232,255,${a * b * 0.6})`; g.fillRect(x * W, y * L.capTop, 1.3, 1.3); } };
  const sci = (v, dp = 2) => { const e = Math.floor(lg(Math.abs(v))), m = v / 10 ** e;
    const sup = String(e).replace('-', '⁻').replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]); return `${m.toFixed(dp)}${NB}×${NB}10${sup}`; };
  const niceLen = (m) => {                                               // a round length for a scale bar, and its label
    const e = Math.floor(lg(m)), f = m / 10 ** e, n = f >= 5 ? 5 : f >= 2 ? 2 : 1, v = n * 10 ** e;
    const lab = v >= 1e3 ? `${(v / 1e3).toLocaleString('en-GB').replace(/,/g, ' ')}${NB}km` : `${v}${NB}m`;
    return [v, lab];
  };

  // ---------- 1. throwing balls upwards from the Earth ----------
  function drawThrow(s, t, a) {
    if (a <= 0) return;
    const { W, capTop, fs, phone } = L, { g } = s;
    starfield(s, a);
    const Rp = phone ? W * 0.9 : Math.min(W * 0.5, capTop * 1.1), ground = capTop - fs * 1.2, cx = W / 2, cy = ground + Rp;
    const unit = (ground - L.top - fs * 2) / 2.9;                         // pixels per Earth radius above the surface (to 3.9R)
    // the Earth
    const rg = g.createRadialGradient(cx, cy - Rp * 0.6, Rp * 0.2, cx, cy, Rp);
    rg.addColorStop(0, `rgba(70,130,220,${a})`); rg.addColorStop(1, `rgba(25,55,120,${a})`);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, Rp, 0, 7); g.fill();
    T(s, 'Earth', cx, ground + fs * 0.6, 0.8 * a, C.text, fs, 600);
    // height marks: 2R and 3R from the centre (that is 1R and 2R above the surface; vertical scale squeezed)
    for (const k of [2, 3]) { const y = ground - (k - 1) * unit; D.line(s, cx - W * 0.3, y, cx + W * 0.3, y, C.muted, 0.18 * a, 1, [3, 6]); T(s, `${k}R from the centre`, cx + W * 0.3, y - fs * 0.6, 0.6 * a, C.muted, fs - 1, 400, 'right'); }
    const c0 = SEC.throw[0] + 0.8, P = SHOW_TRIP + 1.6, k = t < c0 ? -1 : (t - c0) % P;
    const tu = k < 0 ? 0 : k / SHOW_TRIP * TRIP;
    const xs = [cx - W * 0.14, cx, cx + W * 0.14], cols = ['200,210,240', C.force, C.good];
    const labs = ['50%', '80%', '100%'];
    FR.forEach((f, i) => {
      if (i === 2 && t < cap(1)[0] - 0.3) return;                        // the third ball joins with the second caption
      const r = rAt(i, tu), y = ground - (r - 1) * unit;
      const ba = a * (k > P - 0.5 ? 1 - smooth((k - P + 0.5) / 0.4) : 1);
      if (y > L.top - 20) { D.glowDot(s, xs[i], y - fs * 0.5, fs * 1.4, cols[i], ba); circle(s, xs[i], y - fs * 0.5, fs * 0.45, cols[i], ba); }
      // the highest point, marked
      if (f < 1) { const yh = ground - (1 / (1 - f * f) - 1) * unit; D.line(s, xs[i] - fs * 1.5, yh - fs * 0.5, xs[i] + fs * 1.5, yh - fs * 0.5, cols[i], 0.5 * a, 1, [2, 3]); }
      T(s, labs[i], xs[i], ground - fs * 1.6 + (phone ? 0 : 0), 0.85 * a * (i === 2 ? smooth((t - cap(1)[0] + 0.3) / 0.8) : 1), cols[i], fs, 600);
    });
    T(s, 'launch speed, as a percentage of the escape speed', cx, ground - fs * 3.2, 0.75 * a, C.muted, fs, 400);
    T(s, `motion about ${Math.round(SPEEDUP / 100) * 100} times faster than real; no air; heights not to scale with the Earth`, phone ? W / 2 : W - 14, L.top + fs * (phone ? 1.0 : 0.6), 0.6 * a, C.muted, fs - 1, 400, phone ? 'center' : 'right');
    const hA = a * fade(t, cap(2)[0] - 0.4, SEC.throw[1] + 0.5, 0.8, 0.6);
    if (hA > 0) {
      const w = pill(s, 'HL', 14, L.top + fs * 2.6, hA, '242,140,40');
      T(s, `escape speed${NB}=${NB}√(2GM/r)`, 14 + w + 8, L.top + fs * 2.6, hA, C.text, fs + 2, 600, 'left');
    }
  }

  // ---------- 2. squeezing the Sun ----------
  function drawSqueeze(s, t, a) {
    if (a <= 0) return;
    const { W, capTop, fs, phone } = L, { g } = s;
    starfield(s, 0.6 * a);
    const { r, view, stage, shrinking } = squeeze(t);
    const Rref = phone ? Math.min(W * 0.3, (capTop - L.top) * 0.16) : Math.min(W * 0.17, (capTop - L.top) * 0.3);
    const cx = phone ? W / 2 : W * 0.3, cy = phone ? L.top + fs * 1.2 + Rref * 1.15 : L.top + (capTop - L.top) * 0.47;
    const rp = Rref * r / view, frac = vesc(r) / CL;
    // the ghost of each earlier size, zooming away as the camera zooms in
    for (let k = 0; k < 3; k++) { const gp = Rref * STAGES[k] / view; if (STAGES[k] > r * 1.01 && gp < Math.hypot(W, capTop)) circle(s, cx, cy, gp, null, 0.35 * a, '255,214,102', 1); }
    // the star: yellow, turning white-hot then dark as the escape speed nears c (a picture; colours are not physics here)
    const bh = smooth((RS * 1.03 - r) / (RS * 0.03));                        // 0 until within 3% of the horizon radius, 1 at it
    if (bh < 1) { D.glowDot(s, cx, cy, rp * 2.4 + 6, '255,214,140', a * (1 - bh)); circle(s, cx, cy, Math.max(1.5, rp), '255,224,150', a * (1 - bh)); }
    // light streaming away from the surface (a picture of light leaving; it stops once the star is inside its horizon)
    const la = a * (1 - bh);
    if (la > 0) for (let i = 0; i < 12; i++) {
      const th = i / 12 * 2 * Math.PI + 0.2, u = ((t * 0.45 + i * 0.37) % 1), r0 = Math.max(4, rp) + 6 + u * Rref * 0.9;
      D.line(s, cx + r0 * Math.cos(th), cy + r0 * Math.sin(th), cx + (r0 + fs * 0.9) * Math.cos(th), cy + (r0 + fs * 0.9) * Math.sin(th), C.light, la * 0.6 * (1 - u), 1.6);
    }
    if (bh > 0) {
      D.glowLine(s, Array.from({ length: 73 }, (_, i) => [cx + rp * 1.5 * Math.cos(i / 36 * Math.PI), cy + rp * 1.5 * Math.sin(i / 36 * Math.PI)]), '255,190,120', 0.22 * a * bh, 1.2);
      circle(s, cx, cy, Math.max(1.5, rp), '0,0,0', a * bh, '90,90,110', 1);
    }
    // the name of the stage
    const nm = shrinking ? 'being squeezed…' : ['the Sun', 'the Sun, squeezed to the Earth\'s size', 'the Sun, squeezed to 12 km', 'a black hole: its edge is the event horizon'][stage];
    T(s, nm, cx, cy + Rref * 1.2 + fs, a, bh > 0.5 ? C.text : C.light, fs + 1, 600);
    // scale bar
    const mpp = view / Rref, [len, lab] = niceLen(mpp * Rref * 0.8);
    const bx = phone ? 14 : 18, by = phone ? cy + Rref * 1.2 + fs * 2.6 : capTop - fs * 1.4, bl = len / mpp;
    D.line(s, bx, by, bx + bl, by, '220,225,245', 0.8 * a, 2);
    D.line(s, bx, by - 4, bx, by + 4, '220,225,245', 0.8 * a, 2); D.line(s, bx + bl, by - 4, bx + bl, by + 4, '220,225,245', 0.8 * a, 2);
    T(s, lab, bx + bl + 8, by, 0.8 * a, '220,225,245', fs - 1, 400, 'left');
    // the readouts
    const px = phone ? 16 : W * 0.58, py = phone ? by + fs * 2.2 : L.top + fs * 2.6, lh = fs * 1.7, rows = phone ? [0, 1, 2, 3.0] : [0, 2, 3, 4.3];
    const w = pill(s, 'HL', px, py, a, '242,140,40');
    T(s, `escape speed${NB}=${NB}√(2GM/r)`, px + w + 8, py, a, C.text, fs + 1, 600, 'left');
    if (!phone) T(s, `mass: 1.99${NB}×${NB}10³⁰${NB}kg (fixed)`, px, py + lh, 0.8 * a, C.muted, fs, 400, 'left');
    const rTxt = r > 1e5 ? `${sci(r)}${NB}m` : `${(r / 1000).toFixed(r < 1e4 ? 2 : 1)}${NB}km`;
    T(s, `radius: ${rTxt}`, px, py + rows[1] * lh, a, C.light, fs + 1, 600, 'left');
    const v = vesc(r);
    T(s, `escape speed: ${v > 1e8 ? sci(v) + NB + 'm s⁻¹' : Math.round(v / 1000).toLocaleString('en-GB').replace(/,/g, ' ') + NB + 'km s⁻¹'}`, px, py + rows[2] * lh, a, C.vel, fs + 1, 600, 'left');
    // a bar: the escape speed as a fraction of c
    const bw = phone ? W - 2 * px : Math.min(W * 0.36, fs * 22), y4 = py + rows[3] * lh;
    g.fillStyle = `rgba(255,255,255,${0.07 * a})`; g.fillRect(px, y4 - fs * 0.45, bw, fs * 0.9);
    g.fillStyle = `rgba(${C.vel},${0.9 * a})`; g.fillRect(px, y4 - fs * 0.45, bw * Math.min(1, frac), fs * 0.9);
    D.line(s, px + bw, y4 - fs * 0.9, px + bw, y4 + fs * 0.9, C.light, a, 2);
    T(s, 'c', px + bw, y4 - fs * 1.5, a, C.light, fs + 1, 600);
    T(s, `${frac < 0.1 ? (frac * 100).toFixed(1) : Math.round(frac * 100)}% of the speed of light`, px, y4 + fs * 1.6, 0.9 * a, C.vel, fs, 400, 'left');
    if (bh > 0.5) T(s, 'light can\'t get out', phone ? px + bw : px, phone ? y4 + fs * 1.6 : y4 + fs * 3.2, a * smooth((bh - 0.5) * 3), C.force, fs + 1, 600, phone ? 'right' : 'left');
  }

  // ---------- 3. the Earth as a black hole: a marble ----------
  function drawEarthMarble(s, t, a) {
    if (a <= 0) return;
    const { W, capTop, fs, phone } = L, { g } = s;
    starfield(s, 0.6 * a);
    const cy = L.top + (capTop - L.top) * 0.42, Rref = Math.min(W * (phone ? 0.3 : 0.16), (capTop - L.top) * 0.28);
    const u = smooth((t - SEC.earth[0] - 0.8) / 3.0);                   // shrink, then zoom in to the ruler
    const r = 10 ** lerp(lg(RE), lg(RS_E), smooth(u / 0.6)), view = 10 ** lerp(lg(RE), lg(0.02), smooth((u - 0.6) / 0.4));
    const cx = W / 2, rp = Rref * r / view;
    if (u < 0.6) circle(s, cx, cy, rp, '60,120,210', a); else { circle(s, cx, cy, rp, '0,0,0', a, '120,120,140', 1.2); D.glowLine(s, Array.from({ length: 73 }, (_, i) => [cx + rp * 1.5 * Math.cos(i / 36 * Math.PI), cy + rp * 1.5 * Math.sin(i / 36 * Math.PI)]), '255,190,120', 0.4 * a, 1.2); }
    const ga = a * (1 - smooth((u - 0.85) / 0.15));
    if (Rref * RE / view < Math.hypot(W, capTop)) circle(s, cx, cy, Rref * RE / view, null, 0.35 * ga, '110,170,255', 1);
    // a ruler, to the same scale, once zoomed in: 0 to 3 cm
    const ra = a * smooth((u - 0.9) / 0.1);
    if (ra > 0) {
      const ppm = Rref / view, x0 = cx - 0.015 * ppm, y0 = cy + Rref * 1.35;
      g.fillStyle = `rgba(230,210,150,${0.85 * ra})`; g.fillRect(x0 - 6, y0, 0.03 * ppm + 12, fs * 1.8);
      for (let mm = 0; mm <= 30; mm++) D.line(s, x0 + mm * 1e-3 * ppm, y0, x0 + mm * 1e-3 * ppm, y0 + (mm % 10 ? fs * 0.45 : fs * 0.9), '40,30,20', ra, 1);
      for (const cm of [0, 1, 2, 3]) T(s, `${cm}`, x0 + cm * 0.01 * ppm, y0 + fs * 1.35, ra, '40,30,20', fs - 1, 600);
      T(s, 'cm', x0 + 0.03 * ppm + fs * 1.4, y0 + fs * 0.9, ra, C.text, fs, 600, 'left');
      T(s, 'the Earth as a black hole: radius about 9 mm (to scale with the ruler)', cx, cy - Rref * 1.2, ra, C.text, fs, 600);
    } else T(s, u < 0.6 ? 'the Earth, being squeezed' : 'zooming in', cx, cy - Rref * 1.2, a, C.text, fs, 600);
  }

  // ---------- 4. what it looks like: bent starlight (exaggerated) ----------
  function drawLook(s, t, a) {
    if (a <= 0) return;
    const { W, capTop, fs, phone } = L, { g } = s;
    const cy = L.top + (capTop - L.top) * 0.45, thE = Math.min(W, capTop - L.top) * 0.3;
    const cx = W / 2;                                                     // the hole stays central
    const shift = (t - SEC.look[0]) * thE * 0.16;                         // the stars drift slowly past behind it
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    // each star's two images: θ± = (β ± √(β² + 4)) / 2 in units of the Einstein radius. An image is stretched along the
    // circle round the lens by θ/β (the tangential magnification), so stars passing close behind become arcs.
    const lensStar = (x, y, b, size) => {
      const bx = (x - cx) / thE, by = (y - cy) / thE, beta = Math.hypot(bx, by) || 1e-6, phi = Math.atan2(by, bx);
      const root = Math.sqrt(beta * beta + 4);
      for (const th of [(beta + root) / 2, (beta - root) / 2]) {
        const r = Math.abs(th), ang = th > 0 ? phi : phi + Math.PI;
        const px = cx + r * thE * Math.cos(ang), py = cy + r * thE * Math.sin(ang);
        if (r < 0.37 || px < -5 || px > W + 5 || py < -5 || py > capTop) continue;
        const stretch = r / beta, m = Math.abs(stretch * (th > 0 ? (beta + root) / (2 * root) : (root - beta) / (2 * root)));   // μ = |θ/β × dθ/dβ|
        const half = Math.min(0.9, size * stretch / (r * thE));             // half the arc's angle, radians
        const br = Math.min(1, b * 0.7 * Math.sqrt(Math.max(m, 0.05)));
        g.strokeStyle = `rgba(225,232,255,${a * br})`; g.lineWidth = Math.min(3.2, 1.2 + 0.4 * Math.sqrt(m));
        g.beginPath(); g.arc(cx, cy, r * thE, ang - half, ang + half); g.stroke();
      }
    };
    for (const [x0, y0, b] of LENS_STARS) lensStar(((x0 * W * 1.4 + shift) % (W * 1.4)) - W * 0.2, y0 * capTop, b, 0.6);
    // three bright stars that pass close behind it (seeded paths, so the arcs are easy to see)
    [[0.1, 0.0], [-0.32, 0.37], [0.55, 0.71]].forEach(([dy, ph]) => {
      const x = (((ph + (t - SEC.look[0]) * 0.035) % 1) * 1.6 - 0.3) * W;
      lensStar(x, cy + dy * thE, 1, 2.4);
    });
    g.globalCompositeOperation = 'source-over';
    // the shadow, with a thin glow of bent light round it
    D.glowLine(s, Array.from({ length: 97 }, (_, i) => [cx + thE * 0.37 * Math.cos(i / 48 * Math.PI), cy + thE * 0.37 * Math.sin(i / 48 * Math.PI)]), '255,190,120', 0.6 * a, 1.6);
    circle(s, cx, cy, thE * 0.35, '0,0,0', a);
    T(s, 'black hole', cx, cy + thE * 0.35 + fs * 1.4, 0.85 * a, C.text, fs, 600);
    T(s, phone ? 'bending exaggerated' : 'stars behind it, shifted outwards and stretched: bending exaggerated', W / 2, capTop - fs * 1.2, 0.7 * a, C.muted, fs);
  }

  // ---------- 5. how they form: a core collapses in a supernova (not to scale) ----------
  function drawForm(s, t, a) {
    if (a <= 0) return;
    const { W, capTop, fs, phone } = L, { g } = s;
    starfield(s, 0.6 * a);
    const cx = phone ? W / 2 : W * 0.6, cy = L.top + (capTop - L.top) * 0.47, R = Math.min(W * (phone ? 0.3 : 0.18), (capTop - L.top) * 0.36);
    // left: the Sun's fate (caption 1)
    if (!phone || t < cap(15)[0]) {
      const sx = phone ? W / 2 : W * 0.18, sa = a * (phone ? 1 - smooth((t - cap(15)[0] + 0.8) / 0.6) : 1);
      circle(s, sx - fs * 2.6, cy, fs * 1.6, '255,214,102', sa);
      D.arrow(s, sx - fs * 0.6, cy, sx + fs * 1.4, cy, C.muted, sa, '', { head: 7, width: 1.6, blur: 0 });
      circle(s, sx + fs * 2.6, cy, fs * 0.45, '230,240,255', sa);
      T(s, 'the Sun → a white dwarf', sx, cy + fs * 3.0, sa, C.text, fs, 600);
      if (phone) return;
    }
    // right: a massive star: the core collapses (at cap(15) + 2.5 s), the outer layers are blasted away
    const tc = cap(15)[0] + 2.5, k = t - tc;
    const coreR = k < 0 ? R * 0.2 : Math.max(2, R * 0.2 * (1 - smooth(k / 0.5)));
    if (k < 0.4) {
      const sa = a * (k < 0 ? 1 : 1 - smooth(k / 0.4));
      const rg = g.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
      rg.addColorStop(0, `rgba(255,190,120,${0.9 * sa})`); rg.addColorStop(1, `rgba(220,80,60,${0.6 * sa})`);
      g.globalCompositeOperation = 'source-over'; g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
      T(s, 'a very massive star (not to scale)', cx, cy - R - fs * 1.2, sa, C.text, fs, 600);
    }
    circle(s, cx, cy, coreR, k < 0.5 ? '230,230,255' : '0,0,0', a, k >= 0.5 ? '255,190,120' : null, 1.2);
    if (k < 0) T(s, 'core', cx, cy, a, '40,40,60', fs, 600);
    if (k > 0) {
      const rr = R * (0.3 + k * 0.55), sa = a * Math.max(0, 1 - k / 9);
      D.glowLine(s, Array.from({ length: 97 }, (_, i) => { const th = i / 48 * Math.PI; return [cx + rr * (1 + 0.04 * Math.sin(7 * th)) * Math.cos(th), cy + rr * (1 + 0.04 * Math.sin(7 * th)) * Math.sin(th)]; }), '255,170,120', sa, 2);
      if (k < 9) T(s, 'supernova', cx, cy - Math.min(rr, R * 1.6) - fs, sa, '255,170,120', fs, 600);
      T(s, 'black hole left behind', cx, cy + fs * 2.4, a * smooth((k - 1) / 0.8), C.text, fs, 600);
    }
  }

  // ---------- 6. the Earth's orbit is unchanged; then M87 ----------
  function drawOrbit(s, t, a) {
    if (a <= 0) return;
    const { W, capTop, fs, phone } = L;
    starfield(s, 0.6 * a);
    const swap = smooth((t - cap(17)[0] - 1.0) / 1.5), m87 = smooth((t - cap(18)[0] - 0.4) / 1.2);
    const cx = W / 2, cy = L.top + (capTop - L.top) * 0.47, ro = Math.min(W * (phone ? 0.38 : 0.26), (capTop - L.top) * 0.4);
    const oa = a * (1 - m87);
    if (oa > 0) {
      D.glowLine(s, Array.from({ length: 145 }, (_, i) => [cx + ro * Math.cos(i / 72 * Math.PI), cy + ro * Math.sin(i / 72 * Math.PI)]), '110,170,255', 0.3 * oa, 1);
      if (swap < 1) { D.glowDot(s, cx, cy, fs * 5, C.light, oa * (1 - swap)); circle(s, cx, cy, fs * 1.6, '255,224,150', oa * (1 - swap)); }
      if (swap > 0) { circle(s, cx, cy, fs * 0.5, '0,0,0', oa * swap, '255,190,120', 1.2); }
      T(s, swap < 0.5 ? 'the Sun' : 'a black hole of the same mass', cx, cy + fs * 2.8, 0.85 * oa, swap < 0.5 ? C.light : C.text, fs, 600);
      const th = -2 * Math.PI * (t - SEC.orbit[0]) / 12, ex = cx + ro * Math.cos(th), ey = cy + ro * Math.sin(th);
      const lit = 1 - 0.75 * swap;
      D.glowDot(s, ex, ey, fs * 1.2, '110,170,255', oa * lit); circle(s, ex, ey, fs * 0.5, '70,130,220', oa);
      D.arrow(s, ex, ey, ex + (cx - ex) * 0.32, ey + (cy - ey) * 0.32, C.force, oa, '', { head: 8, width: 2.2 });
      T(s, 'Earth', ex, ey - fs * 1.4, 0.85 * oa, C.text, fs, 600);
      T(s, 'the same pull, the same orbit (sizes not to scale)', cx, capTop - fs * 1.2, 0.7 * oa * smooth((t - cap(17)[0]) / 0.8), C.muted, fs);
    }
    if (m87 > 0) {
      // to scale with each other: M87's horizon radius 128 au; Neptune's orbit radius 30 au
      const R128 = Math.min(W * (phone ? 0.4 : 0.3), (capTop - L.top) * 0.42), r30 = R128 * 30 / 128;
      circle(s, cx, cy, R128, '0,0,0', a * m87, '255,190,120', 1.6);
      D.glowLine(s, Array.from({ length: 145 }, (_, i) => [cx + r30 * Math.cos(i / 72 * Math.PI), cy + r30 * Math.sin(i / 72 * Math.PI)]), '110,170,255', 0.8 * a * m87, 1.2);
      T(s, 'Neptune\'s orbit (30 au)', cx, cy - r30 - fs * 0.9, a * m87, '150,190,255', fs, 600);
      T(s, 'M87\'s event horizon: radius about 128 au (to scale)', cx, cy + R128 + fs * 1.8, a * m87, '255,190,120', fs, 600);
    }
  }

  // ---------- end card ----------
  function endCard(s, t) {
    const a = fade(t, END, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 40, 15, 26)), s3 = Math.round(clamp(W / 60, 12, 17));
    g.font = D.sans(s1, 300);
    const head = D.wrap(s, 'What is a black hole?', W - 48);
    let y = H * (phone ? 0.12 : 0.17);
    D.text(s, head, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * head.length + s2 * 0.6;
    const items = [
      ['v = √(2GM/r)', C.vel, '(HL) The escape speed rises as the same mass is squeezed into a smaller radius.'],
      ['r = 2GM/c²', '255,190,120', 'Where the escape speed would reach c: the event horizon, 2.95 km for the Sun (beyond the course).'],
      ['g = GM/r²', C.force, 'Far away, a black hole pulls like any other mass. It doesn\'t suck things in.'],
    ];
    if (phone) {
      for (const [eq, rgb, txt] of items) {
        D.text(s, eq, W / 2, y, s2, a, D.serif(s2), rgb); y += s2 * 1.1;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 40); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.6;
      }
    } else {
      const colW = Math.min(W * 0.28, 320); g.font = D.sans(s3);
      const wr = items.map((it) => D.wrap(s, it[2], colW));
      items.forEach(([eq, rgb], i) => { const x = W / 2 + (i - 1) * W * 0.31; D.text(s, eq, x, y, s2, a, D.serif(s2), rgb); D.text(s, wr[i], x, y + s2 * 1.2, s3, 0.85 * a, D.sans(s3)); });
      y += s2 * 1.2 + s3 * 1.3 * Math.max(...wr.map((l) => l.length)) + s3;
    }
    g.font = D.sans(s3 - 1);
    D.text(s, D.wrap(s, 'The Newton-style argument gives the right radius, but black holes are described properly by general relativity, beyond the IB course. The bending of starlight is exaggerated.', Math.min(W - 40, 760)), W / 2, Math.max(y, H * 0.76), s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('blackhole', {
    duration: DURATION,
    poster: cap(9)[0] + 2,
    // score: the dark (B-flat minor, a low triangle pad, a deep drone, wind, a faint shimmer)
    music: { chords: [[34, 41, 46, 49], [30, 37, 42, 46], [32, 39, 44, 47], [29, 36, 41, 44]], bar: 11, pad: 'triangle', cutoff: 620, drone: 0.15, wind: 0.4, shimmer: 0.12, tremolo: 0.1, volume: 0.46 },
    resize: layout,
    info: {
      CAPS, SEC, END, squeeze,
      check() {
        return {
          GMS, vSun: vesc(STAGES[0]), vEarthSize: vesc(STAGES[1]), fracEarthSize: vesc(STAGES[1]) / CL, v12km: vesc(STAGES[2]), frac12km: vesc(STAGES[2]) / CL,
          rs: RS, vAtRs: vesc(RS) / CL, rsEarthMm: RS_E * 1000, vEarth: VE,
          highest: FR.map((f) => (f < 1 ? 1 / (1 - f * f) : Infinity)), simHighest: FLIGHTS.map((F) => Math.max(...F.map((p) => p[1]))),
          tripUnits: TRIP, speedUp: SPEEDUP, m87au: 6.5e9 * RS / 1000 / AU_KM, gAt1au: GMS / (1.496e11) ** 2,
          capRates: CAPS.map(([a, b, txt]) => +(txt.length / (b - a)).toFixed(1)),
        };
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.15);
      drawThrow(s, t, secA(t, 'throw'));
      drawSqueeze(s, t, secA(t, 'squeeze'));
      drawEarthMarble(s, t, secA(t, 'earth'));
      drawLook(s, t, secA(t, 'look'));
      drawForm(s, t, secA(t, 'form'));
      drawOrbit(s, t, secA(t, 'orbit'));
      pill(s, L.phone ? 'Beyond the course' : 'Beyond the IB course', L.phone ? 8 : 12, L.phone ? 14 : 20, fade(t, cap(9)[0], cap(18)[1], 0.8, 0.8), '170,182,220');
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.82 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'What is a black hole?', 'What would it take to turn the Sun into one?');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
