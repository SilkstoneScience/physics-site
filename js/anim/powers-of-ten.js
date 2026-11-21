/* Skills (orders of magnitude): a continuous zoom out from a proton to the observable universe.
   The shorter side of the picture (height, or width on a phone) is about 10^z metres; each object is drawn at its real size for that view, except stars and planets shown as dots (far too small to see).
   Sizes (checked): proton 1.7e-15 m; atom 1e-10 m; DNA 2e-9 m wide; virus 1e-7 m; red blood cell 8e-6 m;
   hair 8e-5 m wide; raindrop 2e-3 m; person 1.7 m; Everest 8.8e3 m high; Earth 1.27e7 m; Sun 1.39e9 m;
   Neptune's orbit 60.2 AU = 9.0e12 m across; Proxima Centauri 4.24 ly = 4.0e16 m away; Milky Way ~1e21 m;
   Andromeda 2.5 million ly = 2.4e22 m away; observable universe 8.8e26 m. 8.8e26 / 1.7e-15 = 5e41: about 42 orders. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, fade } = Anim;
  const TAU = Math.PI * 2;

  const img = (name) => { const i = new Image(); i.src = `../images/animations/${name}.jpg`; return i; };
  const IMG = { earth: img('earth'), sun: img('sun'), milkyway: img('milkyway'), deep: img('deepfield') };
  const ready = (i) => i.complete && i.naturalWidth > 0;
  // A copy of a picture whose edges fade into a soft circle (so no square edge shows on the dark stage).
  const softCache = new Map();
  const soft = (i, inner = 0.36, outer = 0.5) => {
    if (softCache.has(i)) return softCache.get(i);
    const c = document.createElement('canvas');
    const w = i.naturalWidth, h = i.naturalHeight, n = Math.max(w, h); c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.drawImage(i, 0, 0, w, h);
    x.globalCompositeOperation = 'destination-in';
    const rg = x.createRadialGradient(w / 2, h / 2, n * inner, w / 2, h / 2, n * outer);
    rg.addColorStop(0, '#000'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = rg; x.fillRect(0, 0, w, h);
    softCache.set(i, c); return c;
  };

  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({ length: 260 }, () => ({ x: rnd(), y: rnd(), s: rnd(), ph: rnd() * TAU }));
  const web = (() => {                         // a made-up cosmic web for the observable universe
    const pts = Array.from({ length: 170 }, () => { const r = Math.sqrt(rnd()) * 0.95, a = rnd() * TAU; return [r * Math.cos(a), r * Math.sin(a)]; });
    const links = [];
    pts.forEach((p, i) => pts.forEach((q, j) => { if (j > i && Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.16) links.push([i, j]); }));
    return { pts, links };
  })();

  // ---------- the objects: logS = log10(size in m); draw(s, x, y, R, a, t) with R = half the size in px ----------
  const sup = (n) => String(n).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  const O = [
    { key: 'proton', logS: Math.log10(1.7e-15), name: 'A proton', size: '1.7 × 10⁻¹⁵ m across',
      cap: 'A proton is made of three quarks, held together by the strong force.',
      draw(s, x, y, R, a, t) {
        D.glowDot(s, x, y, R * 1.25, '255,120,150', a * 0.8);
        const cols = ['255,90,90', '110,230,130', '110,160,255'], q = [];
        for (let k = 0; k < 3; k++) { const ang = t * 0.6 + k * TAU / 3; q.push([x + Math.cos(ang) * R * 0.45, y + Math.sin(ang) * R * 0.45]); }
        for (let k = 0; k < 3; k++) {             // wiggly gluon lines between the quarks
          const [p1, p2] = [q[k], q[(k + 1) % 3]], pts = [];
          const dx = p2[0] - p1[0], dy = p2[1] - p1[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
          for (let u = 0; u <= 1.001; u += 0.02) { const w = Math.sin(u * TAU * 4 + t * 6) * R * 0.04; pts.push([p1[0] + dx * u + nx * w, p1[1] + dy * u + ny * w]); }
          D.glowLine(s, pts, '255,230,160', a * 0.6, 1.2);
        }
        q.forEach((p, k) => D.glowDot(s, p[0], p[1], R * 0.32, cols[k], a));
      } },
    { key: 'atom', logS: -10, name: 'An atom', size: 'about 10⁻¹⁰ m across',
      cap: 'Most of an atom is empty space. Its nucleus, at the centre, is 10 000 to 100 000 times smaller: far too small to see here.',
      draw(s, x, y, R, a, t) {
        const { g } = s; g.globalCompositeOperation = 'lighter';
        const rg = g.createRadialGradient(x, y, 0, x, y, R);
        rg.addColorStop(0, `rgba(110,160,255,${0.55 * a})`); rg.addColorStop(0.6, `rgba(80,120,255,${0.22 * a})`); rg.addColorStop(1, 'rgba(80,120,255,0)');
        g.fillStyle = rg; g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill();
        for (let k = 0; k < 2; k++) {               // two "electrons" flickering in the cloud
          const ang = t * (1.7 + k) + k * 2, r = R * (0.35 + 0.25 * Math.sin(t * 1.3 + k));
          D.glowDot(s, x + Math.cos(ang) * r, y + Math.sin(ang * 1.3) * r, R * 0.07, C.neg, a * 0.9);
        }
        g.fillStyle = `rgba(255,220,220,${a})`; g.fillRect(x - 0.5, y - 0.5, 1, 1);
        g.globalCompositeOperation = 'source-over';
      } },
    { key: 'dna', logS: Math.log10(2e-9), name: 'DNA', size: 'about 2 × 10⁻⁹ m wide',
      cap: '',
      // A turning double helix: two backbones a third of a turn apart (the major and minor grooves),
      // one base pair every 0.34 nm (about ten per turn of 3.4 nm). Parts at the back are dimmer and thinner.
      draw(s, x, y, R, a, t) {
        const { g } = s, L = R * 10, ph = t * 0.9, kOf = (u) => u / (R * 0.54) + ph, OFFSET = 2.3;
        const PAIRS = [['92,170,255', '255,214,102'], ['255,214,102', '92,170,255'], ['111,211,154', '255,110,120'], ['255,110,120', '111,211,154']];
        const STRAND = ['150,200,255', '200,170,255'];          // the two backbones: pale blue and pale violet
        const segs = [];
        STRAND.forEach((rgb, si) => {
          let prev = null;
          for (let u = -L; u <= L + 1e-9; u += R * 0.08) {
            const k = kOf(u) + si * OFFSET, p = [x + u, y + Math.sin(k) * R];
            if (prev) segs.push({ p0: prev, p1: p, z: Math.cos(k), rgb });
            prev = p;
          }
        });
        const drawSeg = (sg) => {
          const depth = (sg.z + 1) / 2, w = Math.max(1, R * (0.1 + 0.14 * depth)), al = a * (0.3 + 0.7 * depth);
          g.strokeStyle = 'rgba(' + sg.rgb + ',' + (al * 0.18) + ')'; g.lineWidth = w * 2.6;
          g.beginPath(); g.moveTo(sg.p0[0], sg.p0[1]); g.lineTo(sg.p1[0], sg.p1[1]); g.stroke();
          g.strokeStyle = 'rgba(' + sg.rgb + ',' + al + ')'; g.lineWidth = w;
          g.beginPath(); g.moveTo(sg.p0[0], sg.p0[1]); g.lineTo(sg.p1[0], sg.p1[1]); g.stroke();
        };
        g.save(); g.lineCap = 'round';
        segs.filter((sg) => sg.z < 0).forEach(drawSeg);               // the far side of the helix
        let n = 0;
        for (let u = -L; u <= L; u += R * 0.34, n++) {                  // base pairs, one every 0.34 nm
          const k = kOf(u), y1 = y + Math.sin(k) * R, y2 = y + Math.sin(k + OFFSET) * R, z = (Math.cos(k) + Math.cos(k + OFFSET)) / 2;
          const al = a * (0.45 + 0.4 * (z + 1) / 2), mid = (y1 + y2) / 2, [c1, c2] = PAIRS[(n * 7 + 3) % 4];
          g.lineWidth = Math.max(1.2, R * 0.1);
          g.strokeStyle = 'rgba(' + c1 + ',' + al + ')'; g.beginPath(); g.moveTo(x + u, y1); g.lineTo(x + u, mid); g.stroke();
          g.strokeStyle = 'rgba(' + c2 + ',' + al + ')'; g.beginPath(); g.moveTo(x + u, mid); g.lineTo(x + u, y2); g.stroke();
        }
        segs.filter((sg) => sg.z >= 0).forEach(drawSeg);              // the near side, on top
        g.restore();
      } },
    { key: 'virus', logS: -7, name: 'A virus', size: 'about 10⁻⁷ m across',
      cap: '',
      // A shaded sphere covered in club-shaped spike proteins: those round the edge stick out sideways,
      // those on the near side point at us (seen end-on as small bulbs). Positions on a Fibonacci sphere.
      draw(s, x, y, R, a, t) {
        const { g } = s, r = R * 0.76, rot = t * 0.12, N = 44, spikes = [];
        for (let i = 0; i < N; i++) {
          const zz = 1 - 2 * (i + 0.5) / N, rr = Math.sqrt(1 - zz * zz), th = i * 2.39996 + rot;
          spikes.push([Math.cos(th) * rr, zz, Math.sin(th) * rr]);      // [x, y, z]; z > 0 faces us
        }
        const spike = (v, al) => {
          const bx = x + v[0] * r, by = y + v[1] * r, tx = x + v[0] * R, ty = y + v[1] * R;
          g.strokeStyle = 'rgba(150,230,190,' + al + ')'; g.lineWidth = Math.max(1, R * 0.035); g.lineCap = 'round';
          g.beginPath(); g.moveTo(bx, by); g.lineTo(tx, ty); g.stroke();
          const rg = g.createRadialGradient(tx, ty, 0, tx, ty, R * 0.085);
          rg.addColorStop(0, 'rgba(255,236,170,' + al + ')'); rg.addColorStop(0.6, 'rgba(240,170,90,' + al + ')'); rg.addColorStop(1, 'rgba(240,170,90,0)');
          g.fillStyle = rg; g.beginPath(); g.arc(tx, ty, R * 0.085, 0, TAU); g.fill();
        };
        g.save();
        spikes.filter((v) => v[2] <= 0.15).forEach((v) => spike(v, a * (0.45 + 0.5 * (1 - Math.abs(v[2])))));   // behind and round the edge
        const body = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
        body.addColorStop(0, 'rgba(170,240,210,' + a + ')'); body.addColorStop(0.45, 'rgba(60,160,130,' + a + ')');
        body.addColorStop(1, 'rgba(14,52,48,' + a + ')');
        g.fillStyle = body; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
        g.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 18; k++) {                // a faint texture on the membrane
          const v = spikes[(k * 5) % N]; if (v[2] < 0) continue;
          g.fillStyle = 'rgba(200,255,230,' + (0.06 * a) + ')'; g.beginPath(); g.arc(x + v[0] * r * 0.8, y + v[1] * r * 0.8, r * 0.12, 0, TAU); g.fill();
        }
        g.globalCompositeOperation = 'source-over';
        spikes.filter((v) => v[2] > 0.15).forEach((v) => {            // facing us: short stalk, bulb on the surface
          const px = x + v[0] * r, py = y + v[1] * r, ex = x + v[0] * (r + (R - r) * Math.hypot(v[0], v[1])), ey = y + v[1] * (r + (R - r) * Math.hypot(v[0], v[1]));
          g.strokeStyle = 'rgba(150,230,190,' + (0.8 * a) + ')'; g.lineWidth = Math.max(1, R * 0.03);
          g.beginPath(); g.moveTo(px, py); g.lineTo(ex, ey); g.stroke();
          const rg = g.createRadialGradient(ex, ey, 0, ex, ey, R * 0.075);
          rg.addColorStop(0, 'rgba(255,240,180,' + a + ')'); rg.addColorStop(0.7, 'rgba(240,170,90,' + (0.9 * a) + ')'); rg.addColorStop(1, 'rgba(240,170,90,0)');
          g.fillStyle = rg; g.beginPath(); g.arc(ex, ey, R * 0.075, 0, TAU); g.fill();
        });
        D.glowDot(s, x, y, R * 1.25, '110,220,170', a * 0.18);
        g.restore();
      } },
    { key: 'cell', logS: Math.log10(8e-6), name: 'A red blood cell', size: 'about 8 × 10⁻⁶ m across',
      cap: '',
      // Biconcave discs (thick rim, thin dimpled centre) at different tilts, as in a drop of blood.
      // The front cell is at the true size for the view; the others, the same size, are further back.
      draw(s, x, y, R, a, t) {
        const { g } = s;
        const cell = (cx, cy, rx, tilt, rotA, dim) => {
          const ry = rx * tilt;
          g.save(); g.translate(cx, cy); g.rotate(rotA);
          const body = g.createRadialGradient(0, 0, 0, 0, 0, rx);
          body.addColorStop(0, 'rgba(' + Math.round(120 * dim) + ',' + Math.round(14 * dim) + ',' + Math.round(28 * dim) + ',' + a + ')');
          body.addColorStop(0.42, 'rgba(' + Math.round(165 * dim) + ',' + Math.round(26 * dim) + ',' + Math.round(42 * dim) + ',' + a + ')');
          body.addColorStop(0.78, 'rgba(' + Math.round(232 * dim) + ',' + Math.round(70 * dim) + ',' + Math.round(80 * dim) + ',' + a + ')');
          body.addColorStop(0.93, 'rgba(' + Math.round(205 * dim) + ',' + Math.round(45 * dim) + ',' + Math.round(60 * dim) + ',' + a + ')');
          body.addColorStop(1, 'rgba(' + Math.round(110 * dim) + ',' + Math.round(14 * dim) + ',' + Math.round(26 * dim) + ',' + a + ')');
          g.scale(1, tilt); g.fillStyle = body; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill();
          // light catching the upper rim
          g.strokeStyle = 'rgba(255,170,170,' + (0.35 * a * dim) + ')'; g.lineWidth = rx * 0.07;
          g.beginPath(); g.arc(0, 0, rx * 0.86, Math.PI * 1.1, Math.PI * 1.75); g.stroke();
          g.restore();
          if (ry < 0) return;
        };
        const drift = Math.sin(t * 0.3) * R * 0.03;
        cell(x - R * 1.55, y - R * 0.95 + drift, R * 0.82, 0.35, -0.3, 0.45);
        cell(x + R * 1.65, y - R * 0.55 - drift, R * 0.82, 0.8, 0.5, 0.5);
        cell(x + R * 1.25, y + R * 1.15 + drift, R * 0.82, 0.25, 0.1, 0.42);
        cell(x - R * 1.35, y + R * 1.05, R * 0.82, 0.7, -0.6, 0.5);
        D.glowDot(s, x, y, R * 1.35, '255,80,100', a * 0.22);
        cell(x, y, R, 0.88, 0.25, 1);
      } },
    { key: 'hair', logS: Math.log10(8e-5), name: 'A human hair', size: 'about 8 × 10⁻⁵ m wide',
      cap: 'A human hair: you could fit about ten red blood cells across it.',
      draw(s, x, y, R, a) {
        const { g } = s, L = Math.max(s.W, s.H) * 1.5, ang = -0.5;
        g.save(); g.translate(x, y); g.rotate(ang);
        const lg = g.createLinearGradient(0, -R, 0, R);
        lg.addColorStop(0, `rgba(70,45,30,${a})`); lg.addColorStop(0.4, `rgba(150,105,70,${a})`); lg.addColorStop(1, `rgba(60,38,25,${a})`);
        g.fillStyle = lg; g.fillRect(-L, -R, 2 * L, 2 * R);
        g.strokeStyle = `rgba(210,170,130,${0.35 * a})`; g.lineWidth = 1;
        for (let u = -L; u < L; u += R * 0.7) { g.beginPath(); g.moveTo(u, -R); g.quadraticCurveTo(u + R * 0.3, 0, u, R); g.stroke(); }
        g.restore();
      } },
    { key: 'drop', logS: Math.log10(2e-3), name: 'A raindrop', size: 'about 2 × 10⁻³ m across',
      cap: 'A raindrop: small raindrops are almost perfect spheres.',
      draw(s, x, y, R, a) {
        const { g } = s;
        const rg = g.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.05, x, y, R);
        rg.addColorStop(0, `rgba(235,245,255,${a})`); rg.addColorStop(0.25, `rgba(120,180,240,${0.85 * a})`);
        rg.addColorStop(1, `rgba(30,70,140,${0.9 * a})`);
        g.fillStyle = rg; g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill();
        D.glowDot(s, x, y, R * 1.35, '120,180,255', a * 0.3);
      } },
    { key: 'person', logS: Math.log10(1.7), name: 'A person', size: 'about 1.7 m tall',
      cap: 'You: about 1.7 m. A proton is about 10¹⁵ times smaller than you.',
      draw(s, x, y, R, a) {
        const { g } = s, h = 2 * R, top = y - R;
        g.fillStyle = `rgba(215,225,255,${0.9 * a})`;
        g.shadowColor = `rgba(${C.vel},${a})`; g.shadowBlur = 18;
        g.beginPath(); g.arc(x, top + h * 0.065, h * 0.065, 0, TAU); g.fill();
        g.beginPath();
        g.moveTo(x - h * 0.11, top + h * 0.15); g.lineTo(x + h * 0.11, top + h * 0.15);
        g.lineTo(x + h * 0.15, top + h * 0.5); g.lineTo(x + h * 0.11, top + h * 0.5); g.lineTo(x + h * 0.085, top + h * 0.3);
        g.lineTo(x + h * 0.08, top + h); g.lineTo(x + h * 0.02, top + h); g.lineTo(x, top + h * 0.56);
        g.lineTo(x - h * 0.02, top + h); g.lineTo(x - h * 0.08, top + h); g.lineTo(x - h * 0.085, top + h * 0.3);
        g.lineTo(x - h * 0.11, top + h * 0.5); g.lineTo(x - h * 0.15, top + h * 0.5); g.closePath(); g.fill();
        g.shadowBlur = 0;
      } },
    { key: 'everest', logS: Math.log10(8.8e3), name: 'Mount Everest', size: '8.8 × 10³ m high',
      cap: 'Mount Everest: 8.8 km above sea level.',
      draw(s, x, y, R, a) {
        const { g } = s, base = y + R, P = [[-3.2, 0], [-1.9, 0.45], [-1.2, 0.35], [-0.4, 0.85], [0, 1], [0.35, 0.8], [0.9, 0.62], [1.4, 0.7], [2.1, 0.3], [3.2, 0]];
        const pts = P.map(([u, v]) => [x + u * R, base - v * 2 * R]);
        g.fillStyle = `rgba(30,38,70,${a})`; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); pts.forEach((p) => g.lineTo(p[0], p[1])); g.closePath(); g.fill();
        g.fillStyle = `rgba(235,240,255,${0.85 * a})`; g.beginPath();
        g.moveTo(x - 0.62 * R, base - 1.62 * R); g.lineTo(x, base - 2 * R); g.lineTo(x + 0.55 * R, base - 1.52 * R); g.lineTo(x + 0.1 * R, base - 1.7 * R); g.closePath(); g.fill();
        D.glowLine(s, pts, '200,215,255', a * 0.8, 1.4);
      } },
    { key: 'earth', logS: Math.log10(1.27e7), name: 'Earth', size: '1.27 × 10⁷ m across', photo: 'earth',
      cap: 'Earth, photographed from Apollo 17 in 1972.',
      draw(s, x, y, R, a) {
        const { g } = s;
        D.glowDot(s, x, y, R * 1.15, '120,170,255', a * 0.35);
        if (!ready(IMG.earth)) return;
        const w = R / 0.444;
        g.save(); g.globalAlpha = a; g.beginPath(); g.arc(x, y, R * 1.005, 0, TAU); g.clip();
        g.drawImage(IMG.earth, x - w / 2, y - w / 2, w, w * IMG.earth.naturalHeight / IMG.earth.naturalWidth); g.restore();
      } },
    { key: 'sun', logS: Math.log10(1.39e9), name: 'The Sun', size: '1.39 × 10⁹ m across: 109 Earths', photo: 'sun',
      cap: 'The Sun is 109 times wider than Earth (the small dot beside it).',
      draw(s, x, y, R, a) {
        const { g } = s;
        D.glowDot(s, x, y, R * 1.6, '255,140,60', a * 0.45);
        if (ready(IMG.sun)) {
          const w = R / 0.397, h = w * IMG.sun.naturalHeight / IMG.sun.naturalWidth;
          g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter';
          g.drawImage(IMG.sun, x - w / 2, y - h * (435 / 859), w, h); g.restore();
        }
        const e = Math.max(0.8, R / 109);
        D.glowDot(s, x + R * 1.35, y, Math.max(4, e * 3), '140,190,255', a);
      } },
    { key: 'solar', logS: Math.log10(9.0e12), name: 'The planets’ orbits', size: 'about 9 × 10¹² m across',
      cap: 'The orbits are drawn to scale; the Sun and planets would be far too small to see. Neptune’s orbit is 30 times wider than Earth’s.',
      draw(s, x, y, R, a, t) {
        const AU = [0.387, 0.723, 1, 1.524, 5.20, 9.58, 19.2, 30.1];
        D.glowDot(s, x, y, Math.max(6, R * 0.02), '255,190,90', a);
        AU.forEach((r, i) => {
          const rr = R * r / 30.1;
          s.g.strokeStyle = `rgba(170,182,220,${(i === 2 ? 0.6 : 0.28) * a})`; s.g.lineWidth = 1;
          s.g.beginPath(); s.g.arc(x, y, rr, 0, TAU); s.g.stroke();
          const ang = 1.3 * i + t * 0.9 * Math.pow(r, -1.5);   // Kepler: angular speed ∝ r^-3/2
          D.glowDot(s, x + Math.cos(ang) * rr, y + Math.sin(ang) * rr, i === 2 ? 6 : 4, i === 2 ? '140,190,255' : '230,230,255', a);
        });
      } },
    { key: 'proxima', logS: Math.log10(4.0e16), name: 'The nearest star beyond the Sun', size: '4.0 × 10¹⁶ m away: 4.2 light-years',
      cap: '',
      // Two stars with soft spikes; a pulse of light leaves Proxima Centauri and crosses to the Sun while a
      // counter shows the years it has been travelling (4.2 years for the whole way).
      draw(s, x, y, R, a, t) {
        const { g } = s, fs = Math.round(clamp(s.W / 75, 11, 15)), xs = x - R, xp = x + R;
        const star = (sx, rgb, size) => {
          D.glowDot(s, sx, y, size * 2.4, rgb, a * 0.55); D.glowDot(s, sx, y, size, '255,255,255', a);
          g.save(); g.globalCompositeOperation = 'lighter';
          for (const [dx, dy] of [[1, 0], [0, 1]]) {
            const lg = g.createLinearGradient(sx - dx * size * 3, y - dy * size * 3, sx + dx * size * 3, y + dy * size * 3);
            lg.addColorStop(0, 'rgba(' + rgb + ',0)'); lg.addColorStop(0.5, 'rgba(' + rgb + ',' + (0.7 * a) + ')'); lg.addColorStop(1, 'rgba(' + rgb + ',0)');
            g.strokeStyle = lg; g.lineWidth = 1.4; g.beginPath(); g.moveTo(sx - dx * size * 3, y - dy * size * 3); g.lineTo(sx + dx * size * 3, y + dy * size * 3); g.stroke();
          }
          g.restore();
        };
        // the path of the light: a faint glowing line
        D.glowLine(s, [[xp, y], [xs, y]], '255,214,150', a * 0.18, 1);
        star(xs, '255,210,130', 9); star(xp, '255,120,90', 7);
        D.text(s, 'Sun', xs, y - 30, fs, a, D.sans(fs, 600), '255,214,150');
        D.text(s, 'Proxima Centauri', xp, y - 30, fs, a, D.sans(fs, 600), '255,170,140');
        // the travelling light: a bright pulse with a fading tail
        const o = this, span = Math.max(1, (o.leave || 0) - (o.arrive || 0) - 0.6);
        const p = clamp((t - (o.arrive || 0) + 0.2) / span, 0, 1), px = xp + (xs - xp) * p;
        if (p > 0 && p < 1) {
          const tail = Math.min(R * 0.6, (xp - px));
          const lg = g.createLinearGradient(px, y, px + tail, y);
          lg.addColorStop(0, 'rgba(255,240,200,' + (0.9 * a) + ')'); lg.addColorStop(1, 'rgba(255,240,200,0)');
          g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = lg; g.lineWidth = 3; g.lineCap = 'round';
          g.beginPath(); g.moveTo(px, y); g.lineTo(px + tail, y); g.stroke(); g.restore();
          D.glowDot(s, px, y, 12, '255,240,200', a);
        }
        if (p >= 1) D.glowDot(s, xs, y, 26, '255,240,200', a * fade(t, (o.arrive || 0) + span - 0.2, (o.arrive || 0) + span + 1.2, 0.1, 0.8) * 0.8);
        const years = (4.2 * p).toFixed(1);
        D.text(s, 'light travelling for ' + years + ' years', x, y + 34, fs, a * (p > 0 ? 1 : 0.5), D.sans(fs), '255,230,190');
      } },
    { key: 'milkyway', logS: 21, name: 'Our galaxy, the Milky Way', size: 'about 10²¹ m across: 100 000 light-years', photo: 'milkyway',
      cap: '',
      draw(s, x, y, R, a, t) {
        if (!ready(IMG.milkyway)) return;
        const { g } = s, w = 2 * R / 0.9;
        g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter';
        g.translate(x, y); g.rotate(t * 0.02); g.drawImage(soft(IMG.milkyway), -w / 2, -w / 2, w, w); g.restore();
      } },
    { key: 'andromeda', off: 0.05, logS: Math.log10(2.4e22), name: 'The Andromeda galaxy', size: '2.4 × 10²² m away: 2.5 million light-years',
      cap: 'Andromeda, our nearest large neighbour galaxy. Its light set off 2.5 million years ago.',
      draw(s, x, y, R, a, t) {
        const { g } = s;
        if (ready(IMG.milkyway)) {
          const w = R * 0.092;                     // galaxy 1e21 m wide, 2.4e22 m (= 2R) from Andromeda
          g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter';
          g.drawImage(soft(IMG.milkyway), x - R - w / 2, y - w / 2, w, w); g.restore();
        }
        g.save(); g.globalCompositeOperation = 'lighter'; g.translate(x + R, y); g.rotate(-0.6); g.scale(1, 0.32);
        const rg = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.07);
        rg.addColorStop(0, `rgba(255,240,220,${a})`); rg.addColorStop(0.3, `rgba(200,190,255,${0.5 * a})`); rg.addColorStop(1, 'rgba(120,120,255,0)');
        g.fillStyle = rg; g.beginPath(); g.arc(0, 0, R * 0.07, 0, TAU); g.fill(); g.restore();
        const fs = Math.round(clamp(s.W / 75, 11, 15));
        D.text(s, 'Milky Way', x - R, y + R * 0.12, fs, a, D.sans(fs, 600), C.muted);
        D.text(s, 'Andromeda', x + R, y + R * 0.12, fs, a, D.sans(fs, 600), C.muted);
      } },
    { key: 'deep', off: 0, logS: 24.3, name: 'Galaxies everywhere', size: 'photo not to scale', photo: 'deep',
      cap: 'Almost every speck in this Hubble photo of a tiny patch of sky is a galaxy.',
      draw(s, x, y, R, a) {
        if (!ready(IMG.deep)) return;
        const { g } = s, w = R * 3.4, h = w * IMG.deep.naturalHeight / IMG.deep.naturalWidth;
        g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter';
        g.drawImage(soft(IMG.deep, 0.22, 0.5), x - w / 2, y - h / 2, w, h); g.restore();
      } },
    { key: 'universe', hold: 8, logS: Math.log10(8.8e26), name: 'The observable universe', size: 'about 8.8 × 10²⁶ m across',
      cap: 'The observable universe: the part we can see, centred on us. Space has expanded while the light travelled, so its edge is now about 46 billion light-years away.',
      draw(s, x, y, R, a, t) {
        const { g } = s;
        g.globalCompositeOperation = 'lighter';
        for (const [i, j] of web.links) {
          const p = web.pts[i], q = web.pts[j];
          g.strokeStyle = `rgba(150,140,255,${0.22 * a})`; g.lineWidth = 1;
          g.beginPath(); g.moveTo(x + p[0] * R, y + p[1] * R); g.lineTo(x + q[0] * R, y + q[1] * R); g.stroke();
        }
        web.pts.forEach((p, i) => { g.fillStyle = `rgba(220,215,255,${(0.4 + 0.4 * Math.sin(t + i)) * a})`; g.fillRect(x + p[0] * R - 1, y + p[1] * R - 1, 2, 2); });
        const rg = g.createRadialGradient(x, y, R * 0.92, x, y, R * 1.08);
        rg.addColorStop(0, 'rgba(255,170,120,0)'); rg.addColorStop(0.5, `rgba(255,170,120,${0.45 * a})`); rg.addColorStop(1, 'rgba(255,170,120,0)');
        g.fillStyle = rg; g.beginPath(); g.arc(x, y, R * 1.1, 0, TAU); g.fill();
        g.globalCompositeOperation = 'source-over';
        D.glowDot(s, x, y, 10, C.white, a);
        const fs = Math.round(clamp(s.W / 75, 11, 15));
        D.text(s, 'us', x, y + 16, fs, a, D.sans(fs, 600), C.white);
      } },
  ];

  // ---------- the timeline: hold at each object, then zoom out to the next ----------
  const START = 3.6, HOLD = 6.2, PER_DECADE = 0.65, BASE = 0.5, OFF = 0.3;   // OFF: object fills half the height
  const keys = []; let tt = START;
  O.forEach((o, i) => {
    const z = o.logS + (o.off ?? OFF);
    if (i) { const prev = keys[keys.length - 1]; tt += BASE + (z - prev.z) * PER_DECADE; }
    keys.push({ t: tt, z }); o.arrive = tt; tt += o.hold ?? HOLD; keys.push({ t: tt, z }); o.leave = tt;
  });
  const END_ZOOM = tt, DURATION = END_ZOOM + 7.5;
  const zAt = (t) => {
    if (t <= keys[0].t) return keys[0].z;
    for (let i = 1; i < keys.length; i++) if (t <= keys[i].t) {
      const k0 = keys[i - 1], k1 = keys[i];
      return k0.z + (k1.z - k0.z) * smooth((t - k0.t) / (k1.t - k0.t));
    }
    return keys[keys.length - 1].z;
  };
  // The object fades in as it shrinks into view, and out when it gets too small to see well.
  const visible = (lf) => smooth((0.55 - lf) / 0.45) * smooth((lf + 1.45) / 0.55);

  let cx = 0, cy = 0;
  function readout(s, z, a) {
    const n = Math.round(z), fs = Math.round(clamp(s.W / 26, 22, 44)), f2 = Math.round(clamp(s.W / 70, 11, 15));
    D.text(s, `10${sup(n)} m`, s.W - 18, (s.top ? s.top + 66 : 54) + fs * 0.5, fs, a, D.sans(fs, 300), C.text, 'right');
    D.text(s, s.W < s.H * 0.86 ? 'width of the picture' : 'height of the picture', s.W - 18, (s.top ? s.top + 66 : 54) + fs * 1.25, f2, a * 0.7, D.sans(f2), C.muted, 'right');
  }
  function scaleBar(s, z, a) {                 // a log scale from 10^-15 to 10^27 m along the right edge
    const top = s.H * 0.3, bot = s.H * 0.8, x = s.W - 26, Y = (v) => bot - (v + 15) / 42 * (bot - top), f = Math.round(clamp(s.W / 95, 9, 12));
    D.line(s, x, Y(-15), x, Y(27), C.muted, 0.45 * a, 1.2);
    for (let v = -15; v <= 25; v += 5) { D.line(s, x - 4, Y(v), x + 4, Y(v), C.muted, 0.6 * a); D.text(s, `10${sup(v)}`, x - 8, Y(v), f, 0.55 * a, D.sans(f), C.muted, 'right'); }
    for (const o of O) D.glowDot(s, x, Y(o.logS), 4, '200,210,255', 0.5 * a);
    D.glowDot(s, x, Y(clamp(z - OFF, -15, 27)), 10, C.light, a);
  }

  // Two captions per object (teacher, 16 November 2026): how many times bigger it is than the one before,
  // in ordinary numbers (no scientific notation), then a fact. Ratios checked: 1e-10/1.7e-15 = 59 000;
  // 2e-9/1e-10 = 20; 1e-7/2e-9 = 50; 8e-6/1e-7 = 80; 8e-5/8e-6 = 10; 2e-3/8e-5 = 25; 1.7/2e-3 = 850;
  // 8.8e3/1.7 = 5200; 1.27e7/8.8e3 = 1440; 1.39e9/1.27e7 = 109; 9.0e12/1.39e9 = 6500; 4.0e16/9.0e12 = 4400;
  // 1e21/4.0e16 = 25 000; 2.4e22/1e21 = 24; 8.8e26/2.4e22 = 37 000; Sun's volume 109³ = 1.3 million Earths.
  const WORDS = {
    proton: ['A proton: one of the particles in the nucleus of every atom.', 'It is made of three quarks, held together by the strong force.'],
    atom: ['An atom is about 60 000 times wider than a proton.', 'Almost all of an atom is empty space: its nucleus is 10 000 to 100 000 times smaller than the atom.'],
    dna: ['DNA is about 20 times wider than an atom.', 'Its two strands twist round each other in a double helix, joined by pairs of bases.'],
    virus: ['A virus is about 50 times wider than a strand of DNA.', 'Many viruses have spike proteins on their surface that let them latch on to the cells they infect.'],
    cell: ['A red blood cell is about 80 times wider than a virus.', 'You have about 25 trillion of them, carrying oxygen round your body.'],
    hair: ['A human hair is about 10 times wider than a red blood cell.', 'Its surface is covered in tiny overlapping scales.'],
    drop: ['A raindrop is about 25 times wider than a hair.', 'Small raindrops are almost perfect spheres.'],
    person: ['You are about 850 times taller than a raindrop is wide.', 'A proton is about a million billion times smaller than you.'],
    everest: ['Mount Everest is about 5000 times taller than you.', 'Its summit is 8.8 km above sea level.'],
    earth: ['Earth is about 1400 times wider than Everest is high.', 'Earth, photographed by the crew of Apollo 17 in 1972.'],
    sun: ['The Sun is 109 times wider than Earth (the small dot beside it).', 'About 1.3 million Earths would fit inside it.'],
    solar: ['The planets’ orbits span about 6500 times the width of the Sun.', 'The orbits are drawn to scale; the planets themselves would be far too small to see.'],
    proxima: ['The nearest star beyond the Sun is about 4400 times farther away than Neptune’s orbit is wide.', 'Its light takes 4.2 years to reach us, travelling at 300 000 km every second.'],
    milkyway: ['Our galaxy is about 25 000 times wider than the distance to the nearest star.', 'It holds a few hundred billion stars, and the Sun is just one of them.'],
    andromeda: ['The Andromeda galaxy is about 24 times as far away as our galaxy is wide.', 'The light we see from it set off 2.5 million years ago.'],
    deep: ['Almost every speck in this Hubble photo of a tiny patch of sky is a galaxy.', 'There are hundreds of billions of galaxies we could, in principle, see.'],
    universe: ['The observable universe is about 37 000 times wider than the distance to Andromeda.', 'It is the part we can see, centred on us. Space has expanded while the light travelled, so its edge is now about 46 billion light-years away.'],
  };
  const CAPS = [];
  O.forEach((o, i) => {
    const [first, second] = WORDS[o.key], mid = o.arrive + (o.leave - o.arrive) * 0.45;
    CAPS.push([o.arrive - (i === 1 ? 0 : 0.5), mid, first]);
    CAPS.push([mid + 0.15, o.leave + (i === 0 ? 0.8 : 0.5), second]);
  });
  CAPS.push([O[0].leave + 0.9, O[1].arrive - 0.1, 'Zooming out through the inside of an atom: almost all of it is empty space.']);

  Anim.register('powers-of-ten', {
    duration: DURATION,
    poster: O.find((o) => o.key === 'earth').arrive + 0.5,
    marks: Object.fromEntries(O.map((o) => [o.key, [+o.arrive.toFixed(1), +o.leave.toFixed(1)]])),   // when each object is held (for checking)
    // score: vast and cosmic (C lydian, a saw pad, space wind, a soft shimmer)
    music: { chords: [[48, 55, 59, 62, 66], [50, 57, 62, 66], [52, 59, 64, 66], [45, 52, 59, 64]], bar: 10, pad: 'saw', cutoff: 900, drone: 0.09, wind: 0.8, shimmer: 0.3, volume: 0.81 },
    resize(s) { cx = s.W / 2; cy = s.H * 0.44; },
    frame(s, t) {
      const z = zAt(t), H = Math.min(s.H * 0.86, s.W), on = smooth((t - START + 1) / 0.8) * (1 - smooth((t - END_ZOOM - 0.6) / 1));
      D.background(s, 0.2);
      // stars, brighter at astronomical scales
      const sa = 0.25 + 0.75 * smooth((z - 6) / 4);
      const { g } = s; g.globalCompositeOperation = 'lighter';
      for (const st of stars) {
        g.fillStyle = `rgba(190,200,255,${(0.1 + 0.25 * st.s) * sa * (0.7 + 0.3 * Math.sin(t * 1.1 + st.ph))})`;
        g.fillRect(st.x * s.W, st.y * s.H, 1.3, 1.3);
      }
      g.globalCompositeOperation = 'source-over';
      for (const o of O) {
        const lf = o.logS - z, a = visible(lf) * on;
        if (a <= 0.003) continue;
        const R = 0.5 * H * Math.pow(10, lf);
        o.draw(s, cx, cy, R, a, t);
      }
      // name and size of the object we are holding on
      for (const o of O) {
        const a = fade(t, o.arrive - 0.4, o.leave + 0.6, 0.5, 0.5); if (a <= 0) continue;
        const f1 = Math.round(clamp(s.W / 38, 16, 30)), f2 = Math.round(clamp(s.W / 62, 12, 18));
        D.text(s, o.name, 18, 26 + s.top + f1 * 0.5, f1, a, D.sans(f1, 600), C.text, 'left');
        if (o.size) D.text(s, o.size, 18, 26 + s.top + f1 * 1.45, f2, a * 0.8, D.sans(f2), C.muted, 'left');
      }
      const ui = smooth((t - START + 0.5) / 0.8) * (1 - smooth((t - END_ZOOM) / 1));
      readout(s, z, ui);
      if (s.W > 520) scaleBar(s, z, ui);
      D.captions(s, t, CAPS);
      D.title(s, t, 0.3, 3.4, 'Powers of ten', 'From a proton to the observable universe');
      const ea = fade(t, END_ZOOM + 0.6, DURATION, 0.9, 0.8);
      if (ea > 0) {
        const s1 = Math.round(clamp(s.W / 24, 22, 48)), s2 = Math.round(clamp(s.W / 48, 14, 22));
        s.g.font = D.sans(s1, 300);
        const l1 = D.wrap(s, 'About 42 orders of magnitude', s.W - 48);
        D.text(s, l1, s.W / 2, s.H * 0.4, s1, ea, D.sans(s1, 300));
        s.g.font = D.sans(s2);
        D.text(s, D.wrap(s, 'The observable universe is about 10⁴² times wider than a proton.', Math.min(s.W - 48, 700)), s.W / 2, s.H * 0.4 + s1 * (1.3 * l1.length), s2, ea * 0.85, D.sans(s2));
      }
      D.vignette(s, t, DURATION);
    },
  });
})();
