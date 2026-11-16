/* A.4 (HL) Why is there a sin θ in τ = Fr sin θ? Then the ladder against a frictionless wall.
   Part 1, a spanner: F = 20 N at the end of a spanner, r = 0.30 m, at an angle θ to the spanner.
     The torque is calculated live from the cross product, τ = x·Fy − y·Fx (about the bolt), so the
     gauge shows the real value wherever the force acts. At θ = 40°:
       way 1, components:            F sin θ = 12.86 N, τ = 12.86 × 0.30 = 3.86 N m
       way 2, perpendicular distance: d = r sin θ = 0.193 m, τ = 20 × 0.193 = 3.86 N m
     Sliding the force along its line of action leaves the cross product unchanged (shown by the gauge).
   Part 2, the ladder: L = 5.0 m, W = 350 N at the middle, angle 60° with the floor, wall frictionless.
     Torques about the foot: R and f act there, so they have no torque.
       N: perpendicular distance b = 5.0 sin 60° = 4.330 m (the angle between N and the ladder is 60°)
       W: perpendicular distance a = 2.5 cos 60° = 1.25 m, torque 437.5 N m
     N = 437.5 / 4.330 = 101.0 N; f = N = 101 N; R = W = 350 N; μ ≥ f / R = 0.2887, so μ = 0.29 (minimum).
   Every number shown is calculated here (and checked by hand in the plan's review). */
(() => {
  'use strict';
  const { D, C, clamp, smooth, fade, lerp } = Anim;

  // ---------- the physics ----------
  const F = 20, R_M = 0.30, TH_FIX = 40;                  // spanner: N, m, degrees
  const LEN = 5.0, WT = 350, LAD = 60 * Math.PI / 180;     // ladder: m, N, angle with the floor
  const B_M = LEN * Math.sin(LAD), A_M = LEN / 2 * Math.cos(LAD);
  const TAU_W = WT * A_M, N_F = TAU_W / B_M, MU = N_F / WT;
  const FOOT = [LEN * Math.cos(LAD), 0], TOP = [0, B_M], MID = [FOOT[0] / 2, B_M / 2];
  const rad = (d) => d * Math.PI / 180;
  const f2 = (x) => x.toFixed(2);
  const u = (x) => x.replace(/ /g, ' ');             // keep a number with its unit on one line

  // colours: forces orange, the turning part gold, the part that can't turn grey, perpendicular distances green, torque pink
  const FORCE = C.force, TURN = C.light, NOTURN = '178,190,222', DIST = C.good, TQ = C.pos, RCOL = C.vel;

  // ---------- the story (scene times in seconds) ----------
  const TS = TH_FIX * Math.PI / 180;
  const CAPS = [
    [4.2, 9.8, `A force F pulls on the end of a spanner, a distance r from the bolt. The turning effect of a force is its torque, and it is biggest when the force is at right angles to the spanner.`],
    [10.0, 17.6, 'Turn the force towards the spanner and the torque shrinks. Pulled straight along the spanner (θ = 0), its line of action passes through the bolt, and it cannot turn the bolt at all.'],
    [17.8, 23.2, 'So the torque depends on θ, the angle between the force and the spanner. Where does the sin θ come from? There are two ways to see it.'],
    [23.4, 29.0, 'Way 1: split F into two components, one along the spanner (F cos θ) and one at right angles to it (F sin θ).'],
    [29.2, 35.0, 'The line of action of F cos θ passes through the bolt, like pulling along the spanner. It has no turning effect.'],
    [35.2, 41.2, `Only F sin θ turns the bolt, and it acts a distance r from it: ${u('τ = (F sin θ) × r.')}`],
    [41.6, 47.4, 'Way 2: extend the force into a line, its line of action. The torque is the same wherever along this line the force acts, even beyond the end of the object.'],
    [47.6, 53.6, 'Watch the torque as the force slides along its line of action, to the point closest to the bolt. It does not change.'],
    [53.8, 59.6, `There the force is at right angles to the line from the bolt, so ${u('τ = F × d')}. The right-angled triangle gives ${u('d = r sin θ')}: the perpendicular distance from the bolt to the line of action.`],
    [59.8, 65.6, `The same answer both ways: ${u('(F sin θ) × r = F × (r sin θ).')} The sin θ can go with the force or with the distance.`],
    [66.8, 72.6, `Now the ladder: ${u('5.0 m')} long, weight ${u('350 N')}, at 60° to the floor, resting against a frictionless wall.`],
    [72.8, 78.6, 'Take torques about the foot of the ladder. R and f act at the foot, so their torques are zero and they drop out.'],
    [78.8, 84.6, `The wall's push N acts at the top, ${u('5.0 m')} from the foot, but not at right angles to the ladder: the angle between them is 60° (alternate angles with the floor).`],
    [84.8, 90.6, `Way 1: only the component of N at right angles to the ladder turns it: ${u('τ = (N sin 60°) × 5.0.')}`],
    [90.8, 97.0, "Way 2: N's line of action is horizontal. Slide N along it until it is directly above the foot."],
    [97.2, 103.4, `The perpendicular distance from the foot to N's line of action is the height of the top of the ladder: ${u(`b = 5.0 sin 60° = ${f2(B_M)} m.`)} So ${u('τ = N × b.')} This is the b in the solution.`],
    [103.6, 109.4, `W acts at the middle of the ladder. Its line of action is vertical, so its perpendicular distance is horizontal: ${u(`a = 2.5 cos 60° = ${f2(A_M)} m.`)}`],
    [109.6, 115.6, `Balance the torques: clockwise ${u(`N × ${f2(B_M)}`)} = anticlockwise ${u(`350 × ${f2(A_M)},`)} so ${u(`N = ${N_F.toFixed(0)} N.`)} The forces balance too, so ${u(`f = N = ${N_F.toFixed(0)} N`)} and ${u('R = W = 350 N.')}`],
    [115.8, 121.6, `The ladder does not slip if ${u('f ≤ μR,')} so ${u(`μ ≥ ${N_F.toFixed(0)} / 350 = ${MU.toFixed(2)}.`)} The minimum coefficient of static friction is ${MU.toFixed(2)}.`],
  ];
  const DURATION = 131;

  // θ of the spanner force (degrees) at scene time t
  function theta(t) {
    if (t < 10.4) return 90;
    if (t < 15.4) return lerp(90, 0, smooth((t - 10.4) / 5));
    if (t < 18.2) return 0;
    if (t < 21.6) return lerp(0, TH_FIX, smooth((t - 18.2) / 3.4));
    return TH_FIX;
  }
  const prog = (t, a, b) => smooth((t - a) / (b - a));

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, tall = H > W * 0.9;
    const capFs = clamp(W / 44, 15, 25), capH = capFs * (tall ? 6.6 : 3.7);
    const fs = Math.round(clamp(W / 58, 11, 18));
    let area, panel;
    if (tall) {
      const top = (s.top || 0) + 4, lines = 4, pH = fs * (1.9 + 1.45 * lines);
      area = { x: 8, y: top, w: W - 16, h: H - capH - top - pH - 4 };
      panel = { x: 14, y: area.y + area.h + 2, w: W - 28, h: pH, lines };
    } else {
      const py = Math.max(52, H * 0.14);
      area = { x: W * 0.03, y: H * 0.05, w: W * 0.55, h: H - capH - H * 0.05 };
      panel = { x: W * 0.6, y: py, w: W * 0.4 - 18, h: H - capH - py - 6, lines: 99 };
    }
    // the spanner: bolt, length r (px) and force length
    const rPx = Math.min(area.w * 0.55, area.h * 0.72), Lf = 0.42 * rPx;
    const bx = area.x + (area.w - 1.72 * rPx) / 2 + 0.15 * rPx, by = area.y + (area.h - 1.22 * rPx) / 2 + 0.6 * rPx;
    // the ladder: world box x −0.7 … 4.0 m, y −0.8 … 5.05 m
    const k = Math.min(area.w / 4.7, area.h / 5.85);
    const ox = area.x + (area.w - 4.7 * k) / 2 + 0.7 * k, oy = area.y + (area.h - 5.85 * k) / 2 + 5.05 * k;
    L = { W, H, tall, fs, area, panel, rPx, Lf, bx, by, k, ox, oy };
  }
  const P = (p) => [L.ox + p[0] * L.k, L.oy - p[1] * L.k];      // ladder world (m) → screen

  // ---------- small drawing helpers ----------
  function arc(s, x, y, r, a0, a1, rgb, a, w = 1.4) {
    if (a <= 0) return;
    const { g } = s;
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = `rgba(${rgb},${a})`; g.lineWidth = w;
    g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke();
  }
  // right-angle mark at corner c, along unit directions d1 and d2
  function square(s, c, d1, d2, size, rgb, a) {
    if (a <= 0) return;
    const { g } = s;
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = `rgba(${rgb},${a})`; g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(c[0] + d1[0] * size, c[1] + d1[1] * size);
    g.lineTo(c[0] + (d1[0] + d2[0]) * size, c[1] + (d1[1] + d2[1]) * size);
    g.lineTo(c[0] + d2[0] * size, c[1] + d2[1] * size);
    g.stroke();
  }
  const label = (s, txt, x, y, rgb, a, align = 'center', weight = 600) =>
    D.text(s, txt, x, y, L.fs, a, D.sans(L.fs, weight), rgb, align);
  const dashLine = (s, p, q, rgb, a, w = 1.4, frac = 1) =>
    D.line(s, p[0], p[1], lerp(p[0], q[0], frac), lerp(p[1], q[1], frac), rgb, a, w, [7, 6]);
  const arrow = (s, p, q, rgb, a, w = 2.6) => D.arrow(s, p[0], p[1], q[0], q[1], rgb, a, '', { width: w, head: clamp(L.fs * 0.85, 8, 14) });

  // ---------- part 1: the spanner ----------
  function spanner(s, t, on) {
    if (on <= 0) return;
    const { g } = s, r = L.rPx, bx = L.bx, by = L.by, Lf = L.Lf, fs = L.fs;
    const th = theta(t), c = Math.cos(rad(th)), sn = Math.sin(rad(th));
    const T = [bx + r, by], ud = [c, -sn];                   // tip; force direction on screen
    const foot = [T[0] - ud[0] * r * c, T[1] - ud[1] * r * c];   // closest point of the line of action to the bolt
    const slide = prog(t, 47.8, 51.6);
    const A = [lerp(T[0], foot[0], slide), lerp(T[1], foot[1], slide)];   // where the force acts
    // torque about the bolt from the cross product (anticlockwise positive), in N m
    const px = (A[0] - bx) / r * R_M, py = -(A[1] - by) / r * R_M;
    const tau = px * F * sn - py * F * c;

    // the spanner: a ring head round the bolt and a handle out to the tip
    g.save(); g.globalAlpha = on; g.globalCompositeOperation = 'source-over';
    const body = g.createLinearGradient(0, by - 0.1 * r, 0, by + 0.1 * r);
    body.addColorStop(0, 'rgba(190,200,235,0.95)'); body.addColorStop(1, 'rgba(95,108,150,0.95)');
    g.fillStyle = body; g.shadowColor = 'rgba(140,160,255,0.45)'; g.shadowBlur = 14;
    g.beginPath(); g.arc(bx, by, 0.15 * r, 0, Math.PI * 2); g.fill();
    g.beginPath();
    g.moveTo(bx, by - 0.045 * r); g.lineTo(T[0], by - 0.045 * r); g.arc(T[0], by, 0.045 * r, -Math.PI / 2, Math.PI / 2);
    g.lineTo(bx, by + 0.045 * r); g.closePath(); g.fill();
    g.shadowBlur = 0;
    // the bolt: a hexagon
    g.fillStyle = 'rgba(20,24,44,1)'; g.strokeStyle = 'rgba(220,226,255,0.9)'; g.lineWidth = 1.4;
    g.beginPath();
    for (let i = 0; i < 6; i++) { const q = i * Math.PI / 3 + Math.PI / 6; g[i ? 'lineTo' : 'moveTo'](bx + 0.075 * r * Math.cos(q), by + 0.075 * r * Math.sin(q)); }
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(220,226,255,0.9)'; g.beginPath(); g.arc(bx, by, 0.018 * r + 1, 0, Math.PI * 2); g.fill();
    g.restore();
    label(s, 'bolt', bx, by + 0.15 * r + fs * 1.0, C.muted, on * (1 - fade(t, 51.8, 66.2)));
    // r along the handle
    D.text(s, 'r = 0.30 m', bx + 0.58 * r, by - 0.045 * r - fs * 0.85, fs, on, D.serif(fs), RCOL);

    // the torque gauge: a turning arrow round the bolt, as long as the torque
    const R = 0.25 * r, sweep = Math.max(0, tau) / (F * R_M) * 1.5 * Math.PI, e = -Math.PI / 2 - sweep;
    if (sweep > 0.05) {
      g.save(); g.globalCompositeOperation = 'source-over';
      g.strokeStyle = `rgba(${TQ},${on})`; g.lineWidth = 2.6; g.shadowColor = `rgba(${TQ},0.8)`; g.shadowBlur = 10;
      g.beginPath(); g.arc(bx, by, R, -Math.PI / 2, e + 0.12, true); g.stroke();
      const hx = bx + R * Math.cos(e), hy = by + R * Math.sin(e), tx = Math.sin(e), ty = -Math.cos(e), h = clamp(fs * 0.75, 7, 12);
      g.fillStyle = `rgba(${TQ},${on})`;
      g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx - tx * h - ty * h * 0.5, hy - ty * h + tx * h * 0.5); g.lineTo(hx - tx * h + ty * h * 0.5, hy - ty * h - tx * h * 0.5); g.closePath(); g.fill();
      g.restore();
    }
    label(s, `τ = ${f2(Math.abs(tau) < 0.005 ? 0 : tau)} N m`, bx, by - R - fs * 1.1, TQ, on, 'center', 700);

    // way 2: the line of action, a ghost of the force at the tip, the perpendicular distance and the triangle
    const loa = fade(t, 41.6, 66.2), draw = prog(t, 41.6, 43.4);
    if (loa > 0) {
      const p1 = [foot[0] - ud[0] * 0.3 * r, foot[1] - ud[1] * 0.3 * r], p2 = [T[0] + ud[0] * (Lf + 0.3 * r), T[1] + ud[1] * (Lf + 0.3 * r)];
      const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
      dashLine(s, mid, p1, FORCE, 0.55 * loa * on, 1.4, draw); dashLine(s, mid, p2, FORCE, 0.55 * loa * on, 1.4, draw);
      if (L.W >= 520) { const q = [T[0] + ud[0] * (Lf + 0.12 * r), T[1] + ud[1] * (Lf + 0.12 * r)]; label(s, 'line of action', q[0] - sn * fs * 0.9 - fs * 0.3, q[1] - c * fs * 0.9, FORCE, 0.75 * loa * on * draw, 'right', 400); }
      const ga = 0.32 * loa * on * clamp(slide * 4, 0, 1);
      if (ga > 0) arrow(s, T, [T[0] + ud[0] * Lf, T[1] + ud[1] * Lf], FORCE, ga, 2);
    }
    const tri = fade(t, 53.8, 66.2) * on;
    if (tri > 0) {
      g.save(); g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(${DIST},${0.10 * tri})`;
      g.beginPath(); g.moveTo(bx, by); g.lineTo(T[0], T[1]); g.lineTo(foot[0], foot[1]); g.closePath(); g.fill(); g.restore();
    }
    const da = fade(t, 51.8, 66.2) * on;
    if (da > 0) {
      const dd = prog(t, 51.8, 53.0), q = [lerp(bx, foot[0], dd), lerp(by, foot[1], dd)];
      D.glowLine(s, [[bx, by], q], DIST, da, 2);
      const dl = Math.hypot(foot[0] - bx, foot[1] - by), dn = [(bx - foot[0]) / dl, (by - foot[1]) / dl];
      square(s, foot, dn, ud, fs * 0.7, DIST, da * smooth((t - 52.6) / 0.5));
      const m = [(bx + foot[0]) / 2, (by + foot[1]) / 2];
      label(s, tri > 0 ? 'd = r sin θ' : 'd', m[0] - fs * 0.6, m[1] + fs * 0.5, DIST, da, 'right', 700);
    }

    // the angle θ at the tip, between the spanner and the force (and, for way 2, its vertically opposite twin)
    const thA = on * fade(t, 4.2, 66.2);
    if (thA > 0 && th > 1) {
      const ar = 0.16 * r;
      D.line(s, T[0], T[1], T[0] + 0.3 * r, T[1], C.muted, 0.45 * thA, 1, [3, 4]);
      arc(s, T[0], T[1], ar, -rad(th), 0, C.text, 0.8 * thA);
      const q = -rad(th) / 2, live = t > 9.8 && t < 22.4;
      if (live) label(s, `θ = ${Math.round(th)}°`, T[0] + 0.12 * r, T[1] + 0.045 * r + fs * 1.3, C.text, thA, 'left', 400);
      else label(s, 'θ', T[0] + (ar + fs * 0.7) * Math.cos(q), T[1] + (ar + fs * 0.7) * Math.sin(q), C.text, thA, 'center', 400);
      if (tri > 0) {
        arc(s, T[0], T[1], ar, Math.PI - rad(th), Math.PI, C.text, 0.8 * tri);
        const q2 = Math.PI - rad(th) / 2;
        label(s, 'θ', T[0] + (ar + fs * 0.7) * Math.cos(q2), T[1] + (ar + fs * 0.7) * Math.sin(q2), C.text, tri, 'center', 400);
      }
    }

    // way 1: the components
    const ca = fade(t, 23.6, 41.6, 0.8, 0.5) * on;
    const dimF = 1 - 0.55 * fade(t, 23.6, 41.6, 0.8, 0.5);
    if (ca > 0) {
      const grow = prog(t, 23.6, 25.0), ax = [T[0] + Lf * c * grow, T[1]], pe = [T[0], T[1] - Lf * sn * grow];
      const hiAlong = fade(t, 29.2, 35.2), hiPerp = fade(t, 35.2, 41.6, 0.6, 0.5);
      const aAlong = ca * (1 - 0.65 * hiPerp), aPerp = ca * (1 - 0.65 * hiAlong);
      // construction lines that complete the rectangle
      dashLine(s, ax, [T[0] + Lf * c, T[1] - Lf * sn], C.muted, 0.35 * ca * grow, 1);
      dashLine(s, pe, [T[0] + Lf * c, T[1] - Lf * sn], C.muted, 0.35 * ca * grow, 1);
      // F cos θ points through the bolt: show its line passing through it
      if (hiAlong > 0) dashLine(s, [T[0] + Lf * c, T[1]], [bx - 0.32 * r, by], NOTURN, 0.8 * hiAlong * on, 1.6);
      arrow(s, T, ax, NOTURN, aAlong);
      arrow(s, T, pe, TURN, aPerp);
      label(s, 'F cos θ', T[0] + Lf * c / 2 + fs * 0.4, T[1] + fs * 1.2, NOTURN, aAlong * grow);
      label(s, 'F sin θ', T[0] - fs * 0.5, T[1] - Lf * sn / 2, TURN, aPerp * grow, 'right');
      if (hiAlong > 0) label(s, 'no torque', bx + 0.5 * r, by + 0.045 * r + fs * 1.2, NOTURN, hiAlong * on, 'center', 600);
    }
    // the force itself
    const tip = [A[0] + ud[0] * Lf, A[1] + ud[1] * Lf];
    arrow(s, A, tip, FORCE, on * dimF, 3);
    label(s, 'F = 20 N', tip[0] + ud[0] * fs * 0.5 + sn * fs * 2.6, tip[1] + ud[1] * fs * 0.5 + c * fs * 1.1, FORCE, on * dimF);
    D.glowDot(s, A[0], A[1], 7, FORCE, on);
  }

  // ---------- part 2: the ladder ----------
  function ladder(s, t, on) {
    if (on <= 0) return;
    const { g } = s, fs = L.fs, k = L.k;
    const ft = P(FOOT), tp = P(TOP), md = P(MID);
    // wall and floor, with hatching on the solid side
    const wallTop = P([0, 5.0]), floorL = P([-0.6, 0]), floorR = P([3.95, 0]);
    D.glowLine(s, [wallTop, P([0, 0])], '170,190,255', 0.8 * on, 1.4);
    D.glowLine(s, [floorL, floorR], '170,190,255', 0.8 * on, 1.4);
    for (let y = 0.25; y <= 4.95; y += 0.3) { const a = P([0, y]); D.line(s, a[0], a[1], a[0] - 0.12 * k, a[1] + 0.12 * k, '170,190,255', 0.35 * on, 1); }
    for (let x = -0.45; x <= 3.9; x += 0.3) { const a = P([x, 0]); D.line(s, a[0], a[1], a[0] - 0.12 * k, a[1] + 0.12 * k, '170,190,255', 0.35 * on, 1); }
    label(s, 'frictionless wall', P([-0.12, 4.75])[0] - 2, P([0, 4.75])[1], C.muted, on * fade(t, 66.4, 84.6) * (L.W >= 520 ? 1 : 0), 'right', 400);
    // the ladder: two rails and rungs
    const ux = Math.cos(LAD), uy = Math.sin(LAD), nx = uy * 0.09, ny = ux * 0.09;   // (nx, ny) = half-width, normal to the ladder
    const rails = [[[FOOT[0] + nx, ny], [nx, B_M + ny]], [[FOOT[0] - nx, -ny], [-nx, B_M - ny]]];
    g.save(); g.globalAlpha = on;
    g.strokeStyle = 'rgba(214,190,150,0.55)'; g.lineWidth = Math.max(1, 0.04 * k);
    for (let d = 0.3; d < LEN - 0.1; d += 0.42) {
      const c0 = [FOOT[0] - ux * d, uy * d], a = P([c0[0] + nx, c0[1] + ny]), b = P([c0[0] - nx, c0[1] - ny]);
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    }
    g.restore();
    for (const [p, q] of rails) D.glowLine(s, [P(p), P(q)], '226,200,160', 0.9 * on, 1.6);
    // 5.0 m along the ladder
    const lab = P([FOOT[0] - ux * 3.6 + uy * 0.42, uy * 3.6 + ux * 0.42]);
    D.text(s, '5.0 m', lab[0], lab[1], fs, on * (1 - fade(t, 103.6, 123, 0.6, 0.6) * 0.7), D.serif(fs), RCOL, 'left');
    // 60° at the floor
    const ar = 0.55 * k;
    arc(s, ft[0], ft[1], ar, Math.PI, Math.PI + LAD, C.text, 0.8 * on);
    label(s, '60°', ft[0] - (ar + fs * 1.2) * Math.cos(LAD / 2), ft[1] - (ar + fs * 0.6) * Math.sin(LAD / 2), C.text, on, 'center', 400);

    // the pivot (the foot)
    const pv = fade(t, 72.8, 123);
    if (pv > 0) {
      const rr = clamp(fs * 0.55, 6, 10), a = on * pv;
      D.glowDot(s, ft[0], ft[1], rr * 3, TQ, 0.5 * a);
      g.save(); g.strokeStyle = `rgba(${TQ},${a})`; g.lineWidth = 1.8;
      g.beginPath(); g.arc(ft[0], ft[1], rr, 0, Math.PI * 2); g.stroke();
      const q = rr * 0.7;
      g.beginPath(); g.moveTo(ft[0] - q, ft[1] - q); g.lineTo(ft[0] + q, ft[1] + q); g.moveTo(ft[0] + q, ft[1] - q); g.lineTo(ft[0] - q, ft[1] + q); g.stroke();
      g.restore();
      label(s, 'pivot', ft[0] + rr + fs * 0.4, ft[1] + fs * 1.15, TQ, a * (1 - fade(t, 103.6, 123)), 'left', 600);
    }

    // forces: arrow lengths in metres (not to scale)
    const LW = 1.3, LN = 1.1;
    const dimRf = 1 - 0.7 * fade(t, 72.8, 109.6, 0.8, 0.8);
    const hiN = fade(t, 78.8, 103.6, 0.8, 0.6), hiW = fade(t, 103.6, 115.8, 0.6, 0.6);
    const dimW = 1 - 0.55 * hiN, dimN = 1 - 0.55 * hiW;
    // R and f at the foot
    arrow(s, ft, P([FOOT[0], LW]), FORCE, on * dimRf);
    label(s, 'R', P([FOOT[0] + 0.18, LW])[0], P([0, LW - 0.05])[1], FORCE, on * dimRf, 'left');
    arrow(s, ft, P([FOOT[0] - LN, 0]), FORCE, on * dimRf);
    label(s, 'f', P([FOOT[0] - LN, 0])[0] - fs * 0.2, ft[1] - fs * 0.9, FORCE, on * dimRf, 'center');
    const zero = fade(t, 72.8, 79.0) * on;
    if (zero > 0) label(s, 'torque 0', ft[0] + fs * 0.6, P([0, LW * 0.55])[1], NOTURN, zero, 'left', 400);
    // W at the middle
    arrow(s, md, P([MID[0], MID[1] - LW]), FORCE, on * dimW);
    label(s, 'W = 350 N', P([MID[0] - 0.12, 0])[0], P([0, MID[1] - LW * 0.6])[1], FORCE, on * dimW, 'right');

    // N at the top: the angle with the ladder, components (way 1), sliding along its line of action (way 2)
    const slide = prog(t, 92.2, 96.2);
    const nTail = [lerp(TOP[0], FOOT[0], slide), B_M], nTip = [nTail[0] + LN, B_M];
    const angA = fade(t, 78.8, 85.4, 0.8, 0.6) * on;
    if (angA > 0) {
      const r2 = 0.6 * k;
      dashLine(s, tp, P([1.6, B_M]), C.muted, 0.4 * angA, 1);
      arc(s, tp[0], tp[1], r2, 0, LAD, C.text, 0.85 * angA);
      label(s, '60°', tp[0] + (r2 + fs * 1.1) * Math.cos(LAD / 2), tp[1] + (r2 + fs * 0.4) * Math.sin(LAD / 2), C.text, angA, 'center', 400);
    }
    const ca = fade(t, 84.8, 91.4, 0.8, 0.6) * on;
    if (ca > 0) {
      const grow = prog(t, 84.8, 86.2);
      const al = LN * Math.cos(LAD) * grow, pe = LN * Math.sin(LAD) * grow;
      const alongEnd = [TOP[0] + ux * al, B_M - uy * al], perpEnd = [TOP[0] + uy * pe, B_M + ux * pe];
      dashLine(s, P(alongEnd), ft, NOTURN, 0.55 * ca, 1.4);
      arrow(s, tp, P(alongEnd), NOTURN, ca * 0.8);
      arrow(s, tp, P(perpEnd), TURN, ca);
      label(s, 'N cos 60°', P(alongEnd)[0] + fs * 0.9, P(alongEnd)[1] + fs * 0.5, NOTURN, ca * grow, 'left');
      label(s, 'N sin 60°', P(perpEnd)[0] + fs * 0.4, P(perpEnd)[1] - fs * 0.4, TURN, ca * grow, 'left');
    }
    const loa = fade(t, 90.8, 123) * on;
    if (loa > 0) {
      dashLine(s, P([-0.05, B_M]), P([3.95, B_M]), FORCE, 0.5 * loa, 1.4, prog(t, 90.8, 92.0));
      if (slide > 0) arrow(s, tp, P([LN, B_M]), FORCE, 0.3 * loa * clamp(slide * 4, 0, 1), 2);
    }
    const nA = on * dimN * (1 - 0.5 * ca / Math.max(on, 1e-6));
    arrow(s, P(nTail), P(nTip), FORCE, nA, 3);
    label(s, t > 109.6 ? `N = ${N_F.toFixed(0)} N` : 'N', P(nTip)[0] - fs * 0.2, P(nTip)[1] - fs * 1.0, FORCE, nA, 'center');
    D.glowDot(s, P(nTail)[0], P(nTail)[1], 7, FORCE, on);

    // b: from the foot straight up to N's line of action
    const ba = fade(t, 97.2, 123) * on;
    if (ba > 0) {
      const up = prog(t, 97.2, 98.6), q = P([FOOT[0], B_M * up]);
      D.glowLine(s, [ft, q], DIST, ba, 2);
      square(s, P([FOOT[0], B_M]), [0, 1], [-1, 0], fs * 0.7, DIST, ba * smooth((t - 98.4) / 0.5));
      label(s, `b = ${f2(B_M)} m`, ft[0] + fs * 0.6, P([0, B_M * 0.62])[1], DIST, ba, 'left', 700);
    }
    // a: W's vertical line of action, and the horizontal distance to it from the foot
    const aa = fade(t, 103.6, 123) * on;
    if (aa > 0) {
      dashLine(s, P([MID[0], 4.6]), P([MID[0], -0.15]), FORCE, 0.5 * aa, 1.4, prog(t, 103.6, 104.8));
      const y = -0.42, p1 = P([MID[0], y]), p2 = P([FOOT[0], y]);
      D.line(s, p1[0], P([0, -0.05])[1], p1[0], p1[1] + 0.08 * k, DIST, 0.6 * aa, 1);
      D.line(s, p2[0], ft[1] + 0.08 * k, p2[0], p2[1] + 0.08 * k, DIST, 0.6 * aa, 1);
      const w = prog(t, 104.4, 105.6);
      D.glowLine(s, [p2, [lerp(p2[0], p1[0], w), p1[1]]], DIST, aa, 2);
      label(s, `a = ${f2(A_M)} m`, (p1[0] + p2[0]) / 2, p1[1] + fs * 1.0, DIST, aa * w, 'center', 700);
    }
  }

  // ---------- the equations panel ----------
  // each line: [show from, text, colour, bold]; a line fades out with its part
  const SP_LINES = [
    [4.2, () => 'F = 20 N,  r = 0.30 m', C.muted],
    [35.2, () => 'τ = (F sin θ) × r', TURN, true],
    [37.4, () => u(`   = ${f2(F * Math.sin(TS))} N × 0.30 m`) + ' ' + u(`= ${f2(F * Math.sin(TS) * R_M)} N m`), C.text],
    [53.8, () => 'τ = F × (r sin θ) = F × d', DIST, true],
    [56.4, () => u(`   = 20 N × ${(R_M * Math.sin(TS)).toFixed(3)} m`) + ' ' + u(`= ${f2(F * R_M * Math.sin(TS))} N m`), C.text],
    [59.8, () => 'Both:  τ = F r sin θ', C.text, true],
  ];
  const LD_LINES = [
    [72.8, () => 'Torques about the foot: R, f → 0', C.muted],
    [84.8, () => 'Torque of N = (N sin 60°) × 5.0', TURN, true],
    [97.2, () => '   = N × b, ' + u(`b = 5.0 sin 60° = ${f2(B_M)} m`), DIST],
    [103.6, () => 'Torque of W = ' + u(`W × a = 350 × ${f2(A_M)}`) + ' ' + u(`= ${TAU_W.toFixed(1)} N m`), C.text],
    [109.6, () => `N × ${f2(B_M)} = ${TAU_W.toFixed(1)}  →  N = ${N_F.toFixed(0)} N`, C.text, true],
    [111.6, () => u(`f = N = ${N_F.toFixed(0)} N,`) + ' ' + u('R = W = 350 N'), C.text],
    [115.8, () => `μ ≥ f / R = ${N_F.toFixed(0)} / 350 = ${MU.toFixed(2)}`, C.light, true],
  ];
  function panel(s, t) {
    const pa = Math.max(fade(t, 4.0, 66.2, 0.8, 0.7), fade(t, 66.6, 122.6, 0.8, 0.8));
    if (pa <= 0) return;
    const { g } = s, p = L.panel, fs = L.fs, lh = fs * 1.45;
    const ladderPart = t > 66.4;
    let head = 'Torque on a spanner';
    if (t > 23.2 && t < 41.4) head = 'Way 1: the perpendicular component';
    else if (t >= 41.4 && !ladderPart) head = 'Way 2: the perpendicular distance';
    else if (ladderPart) head = 'The ladder: torques about the foot';
    const lines = (ladderPart ? LD_LINES : SP_LINES).filter((l) => t >= l[0]);
    // on phones keep only the latest lines that fit
    const shown = lines.slice(-p.lines);
    // wrap each line to the panel's width
    const rows = [];
    for (const [from, txt, rgb, bold] of shown) {
      g.font = D.sans(fs, bold ? 700 : 400);
      const parts = D.wrap(s, txt(), p.w - fs);
      parts.forEach((x, i) => rows.push({ x: i ? '   ' + x : x, rgb, bold, a: smooth((t - from) / 0.6) }));
    }
    const keep = rows.slice(-Math.max(1, Math.floor((p.h - fs * 1.9) / lh)));
    const h = fs * 1.9 + keep.length * lh + fs * 0.3;
    g.save(); g.globalAlpha = pa;
    g.fillStyle = 'rgba(14,18,40,0.72)'; g.strokeStyle = 'rgba(150,165,230,0.35)'; g.lineWidth = 1;
    g.beginPath(); g.roundRect ? g.roundRect(p.x, p.y, p.w, h, 8) : g.rect(p.x, p.y, p.w, h); g.fill(); g.stroke();
    g.restore();
    D.text(s, head, p.x + fs * 0.6, p.y + fs * 1.05, fs, pa, D.sans(fs, 600), C.text, 'left');
    keep.forEach((r, i) => D.text(s, r.x, p.x + fs * 0.6, p.y + fs * 1.9 + lh * (i + 0.6), fs, pa * r.a, D.sans(fs, r.bold ? 700 : 400), r.rgb, 'left'));
  }

  // ---------- closing summary ----------
  function closing(s, t) {
    const ea = fade(t, 122.4, 130.4, 0.9, 0.8); if (ea <= 0) return;
    const { g } = s;
    g.fillStyle = `rgba(4,6,13,${0.8 * ea})`; g.fillRect(0, 0, s.W, s.H);
    const s1 = Math.round(clamp(s.W / 20, 22, 56)), s2 = Math.round(clamp(s.W / 40, 13, 24)), y = s.H * 0.27;
    D.text(s, 'τ = F r sin θ', s.W / 2, y, s1, ea, D.serif(s1), C.text);
    const rowsWide = s.W > 620;
    const a1 = '(F sin θ) × r', a2 = 'F × (r sin θ)';
    const b1 = 'perpendicular component × distance', b2 = 'force × perpendicular distance';
    g.font = D.sans(s2, 600);
    if (rowsWide) {
      const xl = s.W * 0.3, xr = s.W * 0.7, y2 = y + s1 * 1.5;
      D.text(s, a1, xl, y2, s2 * 1.3, ea, D.serif(Math.round(s2 * 1.3)), TURN);
      D.text(s, '=', s.W / 2, y2, s2 * 1.3, ea, D.serif(Math.round(s2 * 1.3)), C.text);
      D.text(s, a2, xr, y2, s2 * 1.3, ea, D.serif(Math.round(s2 * 1.3)), DIST);
      D.text(s, D.wrap(s, b1, s.W * 0.36), xl, y2 + s2 * 1.8, s2, ea * 0.9, D.sans(s2), TURN);
      D.text(s, D.wrap(s, b2, s.W * 0.36), xr, y2 + s2 * 1.8, s2, ea * 0.9, D.sans(s2), DIST);
    } else {
      let y2 = y + s1 * 1.4;
      D.text(s, a1, s.W / 2, y2, s2 * 1.3, ea, D.serif(Math.round(s2 * 1.3)), TURN);
      D.text(s, b1, s.W / 2, y2 + s2 * 1.4, s2, ea * 0.9, D.sans(s2), TURN);
      D.text(s, '=', s.W / 2, y2 + s2 * 2.8, s2 * 1.3, ea, D.serif(Math.round(s2 * 1.3)), C.text);
      y2 += s2 * 4.2;
      D.text(s, a2, s.W / 2, y2, s2 * 1.3, ea, D.serif(Math.round(s2 * 1.3)), DIST);
      D.text(s, b2, s.W / 2, y2 + s2 * 1.4, s2, ea * 0.9, D.sans(s2), DIST);
    }
    g.font = D.sans(s2);
    D.text(s, D.wrap(s, 'A force whose line of action passes through the pivot has no torque.', Math.min(s.W - 40, 640)), s.W / 2, s.H * (rowsWide ? 0.66 : 0.74), s2, ea * 0.9, D.sans(s2));
  }

  Anim.register('torque', {
    duration: DURATION,
    poster: 56,
    // score: calm and thoughtful (A minor, a triangle pad that slowly swells, a low drone)
    music: { chords: [[45, 52, 57, 60, 64], [41, 48, 53, 57, 64], [43, 50, 55, 59, 62], [40, 47, 52, 55, 59]], bar: 7, pad: 'triangle', cutoff: 900, drone: 0.09, tremolo: 0.25, volume: 0.55 },
    // hold the picture still so each caption can be read
    pauses: [[9.2, 1], [17.0, 1.5], [22.6, 1.5], [28.4, 1], [34.4, 1.5], [40.6, 2], [46.8, 1], [53.0, 1.5], [59.0, 2.5], [65.0, 2.5],
      [72.0, 1], [78.0, 1.5], [84.0, 1.5], [90.0, 1.5], [96.4, 1], [102.8, 2.5], [108.8, 2], [115.0, 2.5], [121.0, 3], [129.6, 4]],
    resize: layout,
    frame(s, t) {
      D.background(s, 0.26);
      spanner(s, t, fade(t, 3.6, 66.2, 0.8, 0.7));
      ladder(s, t, fade(t, 66.4, 122.6, 0.9, 0.8));
      panel(s, t);
      D.captions(s, t, CAPS);
      closing(s, t);
      if (t < 3.8) { s.g.fillStyle = `rgba(4,6,13,${0.75 * fade(t, 0, 3.6, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 3.6, 'Why the sin θ in torque?', 'τ = Fr sin θ, then a ladder leaning on a wall (HL)');
      D.vignette(s, t, DURATION);
    },
  });
})();
