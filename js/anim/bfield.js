/* D.3 A moving charge in a uniform magnetic field: circle, opposite charge, helix.
   Physics: dv/dt = (q/m) v × B, solved exactly by rotating v about B each step. */
(() => {
  'use strict';
  const { V, D, C, clamp, smooth, fade } = Anim;

  // x right, y up, z out of the screen. B points INTO the page (-z). q/m = ±1, |B| = 1.
  const B = [0, 0, -1];
  const SIM_RATE = 1.6;   // simulated time units per second: one turn (2π units) takes 3.9 s
  const NPER = 120;       // samples per simulated time unit
  function trajectory(q, p0, v0, start, end) {
    const w = V.mul(B, -q), wl = V.len(w), k = V.mul(w, 1 / wl), dt = 1 / NPER;
    const n = Math.ceil((end - start) * SIM_RATE * NPER), pts = [], vel = [];
    let p = p0.slice(), v = v0.slice();
    for (let i = 0; i <= n; i++) {
      pts.push(p); vel.push(v);
      p = V.add(p, V.mul(V.rot(v, k, wl * dt / 2), dt));
      v = V.rot(v, k, wl * dt);
    }
    return { q, pts, vel, start, end };
  }
  const A = trajectory(+1, [0, 0, 0], [1.6, 0, 0], 4.2, 21.6);           // anticlockwise circle, centre (0, 1.6)
  const N = trajectory(-1, [0, 0, 0], [1.6, 0, 0], 12.9, 21.6);          // clockwise circle, centre (0, -1.6)
  const H = trajectory(+1, [0, -1.3, 4.6], [1.3, 0, -0.42], 21.7, 36.8); // helix along the field
  const idx = (tr, t) => clamp(Math.floor((t - tr.start) * SIM_RATE * NPER), 0, tr.pts.length - 1);

  const DIST = 20;
  let unit = 40, cx = 0, cy = 0;
  const cam = (t) => {
    const e = smooth((t - 16.8) / 4.2);
    const yaw = (e * 62 + smooth((t - 21) / 16) * 18) * Math.PI / 180;
    const c = Anim.camera(yaw, e * 15 * Math.PI / 180, DIST);
    c.yawDeg = yaw * 180 / Math.PI; return c;
  };
  const P = (c, p) => Anim.project(c, p, cx, cy, unit);
  const fog = (zc) => clamp(1 - (zc - (DIST - 6)) / 16 * 0.75, 0.25, 1);

  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const dust = Array.from({ length: 240 }, () => ({ p: [(rnd() - 0.5) * 30, (rnd() - 0.5) * 20, (rnd() - 0.5) * 26], s: rnd(), ph: rnd() * 6.28 }));
  const grid = [];
  for (let x = -6; x <= 6.01; x += 1.5) for (let y = -3.6; y <= 3.61; y += 1.2) grid.push([x, y]);

  function drawDust(s, c, t) {
    const { g } = s; g.globalCompositeOperation = 'lighter';
    for (const d of dust) {
      const p = P(c, d.p); if (p[2] < 1) continue;
      g.fillStyle = `rgba(170,185,255,${(0.12 + 0.18 * d.s) * (0.7 + 0.3 * Math.sin(t * 1.3 + d.ph)) * fog(p[2])})`;
      g.fillRect(p[0], p[1], 1.4, 1.4);
    }
    g.globalCompositeOperation = 'source-over';
  }
  function drawField(s, c, t, show) {
    const { g } = s;
    const la = smooth((c.yawDeg - 6) / 30) * show;      // side view: field lines
    const ca = (1 - smooth((c.yawDeg - 2) / 14)) * show; // head-on view: crosses
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    if (la > 0.01) {
      for (const [x, y] of grid) {
        const a = P(c, [x, y, 6.5]), b = P(c, [x, y, -6.5]);
        const lg = g.createLinearGradient(a[0], a[1], b[0], b[1]);
        lg.addColorStop(0, `rgba(${C.field},0)`);
        lg.addColorStop(0.15, `rgba(${C.field},${0.32 * la * fog(a[2])})`);
        lg.addColorStop(0.85, `rgba(${C.field},${0.32 * la * fog(b[2])})`);
        lg.addColorStop(1, `rgba(${C.field},0)`);
        g.strokeStyle = lg; g.lineWidth = 5; g.globalAlpha = 0.35;
        g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
        g.lineWidth = 1.3; g.globalAlpha = 1; g.stroke();
        for (const z0 of [-3.5, 0, 3.5]) {          // chevrons drift along B (-z)
          const z = z0 - ((t * 0.5) % 3.5) + 1.75;
          const tip = P(c, [x, y, z - 0.22]), w1 = P(c, [x, y + 0.17, z + 0.1]), w2 = P(c, [x, y - 0.17, z + 0.1]);
          g.strokeStyle = `rgba(160,155,255,${0.55 * la * fog(tip[2])})`; g.lineWidth = 1.4;
          g.beginPath(); g.moveTo(w1[0], w1[1]); g.lineTo(tip[0], tip[1]); g.lineTo(w2[0], w2[1]); g.stroke();
        }
      }
    }
    if (ca > 0.01) {
      const r = 0.15 * unit;
      g.strokeStyle = `rgba(${C.field},${0.5 * ca})`; g.lineWidth = 1.3;
      for (const [x, y] of grid) {
        const p = P(c, [x, y, 0]), q = r * 0.62;
        g.beginPath(); g.arc(p[0], p[1], r, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.moveTo(p[0] - q, p[1] - q); g.lineTo(p[0] + q, p[1] + q);
        g.moveTo(p[0] + q, p[1] - q); g.lineTo(p[0] - q, p[1] + q); g.stroke();
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  function drawTrail(s, c, tr, t, rgb, alpha) {
    if (t < tr.start || alpha <= 0) return;
    const iEnd = idx(tr, t), pts = [], ages = [], fogs = [];
    for (let i = 0; i <= iEnd; i += 3) { const p = P(c, tr.pts[i]); pts.push(p); ages.push((iEnd - i) / NPER); fogs.push(fog(p[2])); }
    pts.push(P(c, tr.pts[iEnd])); ages.push(0); fogs.push(fog(pts[pts.length - 1][2]));
    D.glowLine(s, pts, rgb, alpha, 1.5, (i) => fogs[i] * (0.35 + 0.65 * Math.exp(-ages[i] / 2.5)));
  }
  function drawCharge(s, c, tr, t, rgb, alpha) {
    if (t < tr.start || alpha <= 0) return;
    const { g } = s, p = P(c, tr.pts[idx(tr, t)]), k = DIST / p[2];
    D.glowDot(s, p[0], p[1], 0.62 * unit * k, rgb, alpha);
    const r = 0.17 * unit * k;
    g.fillStyle = `rgba(${rgb},${alpha})`; g.beginPath(); g.arc(p[0], p[1], r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = `rgba(20,6,20,${alpha})`; g.lineWidth = Math.max(1.6, r * 0.28); g.lineCap = 'round';
    g.beginPath(); g.moveTo(p[0] - r * 0.55, p[1]); g.lineTo(p[0] + r * 0.55, p[1]);
    if (tr.q > 0) { g.moveTo(p[0], p[1] - r * 0.55); g.lineTo(p[0], p[1] + r * 0.55); }
    g.stroke();
  }
  function arrow3(s, c, from, dir, L, rgb, label, alpha) {
    const a = P(c, from), b = P(c, V.add(from, V.mul(dir, L)));
    const dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.hypot(dx, dy);
    if (dl < 6) return;
    const r0 = 0.22 * unit;
    D.arrow(s, a[0] + dx / dl * r0, a[1] + dy / dl * r0, b[0], b[1], rgb, alpha, label);
  }
  function arrows(s, c, tr, t, alpha) {
    if (t < tr.start || alpha <= 0) return;
    const i = idx(tr, t), p = tr.pts[i], v = tr.vel[i];
    arrow3(s, c, p, V.norm(v), 1.15, C.vel, 'v', alpha);
    arrow3(s, c, p, V.norm(V.mul(V.cross(v, B), tr.q)), 1.0, C.force, 'F', alpha);
  }

  const CAPS = [
    [4.5, 8.7, 'The magnetic force on the charge is always at right angles to its velocity.'],
    [8.9, 12.7, 'So its speed never changes, only its direction: the path is a circle.'],
    [13.0, 16.7, 'A negative charge with the same mass and speed curves the opposite way.'],
    [17.0, 21.2, 'Turn the view to see the field lines from the side.'],
    [21.8, 27.2, 'Now give the charge some velocity along the field as well.'],
    [27.4, 33.2, 'That part of the velocity feels no force, so the circle stretches into a helix.'],
  ];
  const LEGEND = [['arrow', C.vel, 'velocity, v'], ['arrow', C.force, 'magnetic force, F'], ['line', C.field, 'magnetic field, B'],
    ['dot', C.pos, 'positive charge'], ['dot', C.neg, 'negative charge']];
  const DURATION = 38.6;

  Anim.register('bfield', {
    duration: DURATION,
    poster: 30,
    // score: dark and electric (D minor, a dark saw pad with a quick tremolo, a low drone)
    music: { chords: [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 61]], bar: 8, pad: 'saw', cutoff: 650, tremolo: 3, drone: 0.11, volume: 0.86 },
    resize(s) { unit = Math.min(s.W / (s.W < 520 ? 10.5 : 13.5), (s.H * 0.78) / 8.8); cx = s.W / 2; cy = s.H * 0.45; },
    frame(s, t) {
      const c = cam(t);
      D.background(s);
      drawDust(s, c, t);
      drawField(s, c, t, smooth((t - 1.5) / 2.5) * (1 - smooth((t - 37.6) / 0.9)));
      const aA = fade(t, A.start, 21.6, 0.4, 1.4), aN = fade(t, N.start, 21.6, 0.4, 1.4), aH = fade(t, H.start, 36.8, 0.4, 1.4);
      drawTrail(s, c, A, t, C.pos, aA); drawTrail(s, c, N, t, C.neg, aN); drawTrail(s, c, H, t, C.pos, aH);
      drawCharge(s, c, A, t, C.pos, aA); drawCharge(s, c, N, t, C.neg, aN); drawCharge(s, c, H, t, C.pos, aH);
      arrows(s, c, A, t, fade(t, A.start + 0.3, 12.9, 0.6, 0.5));
      arrows(s, c, N, t, fade(t, N.start + 0.3, 17.2, 0.6, 0.6));
      arrows(s, c, H, t, fade(t, H.start + 0.3, 33.4, 0.6, 0.6));
      D.legend(s, LEGEND, smooth((t - 4.2) / 0.8) * (1 - smooth((t - 33.4) / 0.6)));
      D.captions(s, t, CAPS);
      D.title(s, t, 0.5, 4.0, 'A moving charge in a magnetic field', 'The field points into the page');
      const ea = fade(t, 33.6, 38.0, 0.9, 0.8);
      if (ea > 0) {
        s.g.fillStyle = `rgba(4,6,13,${0.55 * ea})`; s.g.fillRect(0, 0, s.W, s.H);
        const s1 = Math.round(clamp(s.W / 16, 30, 72)), s2 = Math.round(clamp(s.W / 48, 14, 22));
        D.text(s, 'F = qvB sin θ', s.W / 2, s.H * 0.42, s1, ea, D.serif(s1));
        s.g.font = D.sans(s2);
        D.text(s, D.wrap(s, 'θ is the angle between the velocity and the field', Math.min(s.W - 48, 700)), s.W / 2, s.H * 0.42 + s1 * 0.95, s2, ea * 0.8, D.sans(s2));
      }
      D.vignette(s, t, DURATION);
    },
  });
})();
