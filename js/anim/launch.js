/* A.2/A.3 A rocket launch: the DP physics of it. A simplified single-stage rocket goes straight up, with its
   free-body diagram drawn to scale, live readouts and graphs of mass, acceleration and velocity, then coasts
   to the top of its flight and falls back. The flight is integrated once when the page loads (fixed step).
   The rocket (simplified, round numbers; a real one is far more complicated):
     total mass m0 = 50 000 kg, of which 30 000 kg is fuel and oxygen (propellant), so 20 000 kg when empty;
     exhaust speed v = 2500 m s⁻¹ relative to the rocket; propellant used at Δm/Δt = 250 kg s⁻¹ at full power;
     thrust F = v Δm/Δt = 2500 × 250 = 6.25 × 10⁵ N; the engines reach full thrust over the first 1.0 s.
   Numbers in the captions (all recalculated here and in info.check()):
     weight on the pad mg = 50 000 × 9.8 = 4.9 × 10⁵ N; lift-off when the thrust passes the weight, about 0.78 s
     after ignition (thrust 6.25 × 10⁵ × t/1.0 = mg, with only about 77 kg used by then); at full thrust the resultant force is
     6.25 × 10⁵ − 4.9 × 10⁵ = 1.35 × 10⁵ N and a = 1.35 × 10⁵ ÷ 50 000 = 2.7 m s⁻² (the rocket has used 125 kg by
     then: 2.73 m s⁻², shown as 2.7); burn time: 125 kg during the start, then 29 875 ÷ 250 = 119.5 s, so the
     engine stops 120.5 s after ignition, with m = 20 000 kg; near the end a = (6.25 × 10⁵ − 1.96 × 10⁵ − drag) ÷ 20 000
     ≈ 21 m s⁻² (21.45 without drag; the drag is then under 10 kN); power P = Fv: at 500 m s⁻¹ it is
     6.25 × 10⁵ × 500 = 3.1 × 10⁸ W; orbital speed at about 97.7 km: √(GM/r) = √(6.67 × 10⁻¹¹ × 5.97 × 10²⁴ ÷ 6.467 × 10⁶)
     = 7.8 km s⁻¹; energy: propellant releases about 10 MJ per kg (a typical value for fuel and oxygen together), so
     30 000 × 10 MJ = 3 × 10¹¹ J; at the top (97.7 km) Ep = mgh = 20 000 × 9.8 × 97 700 ≈ 1.9 × 10¹⁰ J, about 6% of it.
   Simplifications: straight up, no wind; gravity constant at 9.8 m s⁻² (at 97.7 km it is about 3% less); drag from a
   simple model F = ½ρ C A v² with C A = 1.57 m² (a 2 m wide rocket) and the air thinning as ρ = 1.2 e^(−h / 8.5 km);
   thrust taken as constant at full power (a real engine gives a little more thrust in thin air). */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;

  // ---------- the rocket and its flight ----------
  const G = 9.8, M0 = 50000, PROP = 30000, VE = 2500, MDOT = 250, TF = VE * MDOT, RAMP = 1.0;
  const CDA = 1.57, RHO0 = 1.2, HS = 8500, LEN = 40;                 // drag area (m²), sea-level density, scale height (m), rocket length (m)
  const SAMPLE = 0.05, TAU_END = 300;
  const SIM = (() => {
    const n = Math.round(TAU_END / SAMPLE) + 1, dt = 0.001, per = Math.round(SAMPLE / dt);
    const H = new Float64Array(n), V = new Float64Array(n), A = new Float64Array(n), M = new Float64Array(n);
    const T = new Float64Array(n), FD = new Float64Array(n), NF = new Float64Array(n);
    let h = 0, v = 0, m = M0, used = 0, tLift = null, tOff = null, k = 0;
    const thrustAt = (tau) => (used < PROP ? TF * Math.min(1, tau / RAMP) : 0);
    for (let i = 0; k < n; i++) {
      const tau = i * dt, thr = thrustAt(tau), w = m * G;
      if (thr === 0 && tOff === null && tau > 1) tOff = tau;
      const rho = RHO0 * Math.exp(-Math.max(h, 0) / HS), drag = 0.5 * rho * CDA * v * Math.abs(v);
      let a = (thr - w - drag) / m, nf = 0;
      if (h <= 0 && v <= 0 && a <= 0 && tLift === null) { nf = w - thr; a = 0; v = 0; }      // still on the pad: the pad pushes back
      else if (tLift === null) tLift = tau;
      if (i % per === 0) { H[k] = h; V[k] = v; A[k] = a; M[k] = m; T[k] = thr; FD[k] = drag; NF[k] = nf; k++; }
      v += a * dt; h += v * dt;
      const md = thr / VE; m -= md * dt; used += md * dt;
    }
    let iTop = 0; for (let i = 0; i < n; i++) if (H[i] > H[iTop]) iTop = i;
    let iDrag = 0; for (let i = 0; i < n; i++) if (FD[i] > FD[iDrag]) iDrag = i;
    return { H, V, A, M, T, FD, NF, n, tLift, tOff, tauTop: iTop * SAMPLE, hTop: H[iTop], tauDrag: iDrag * SAMPLE, dragMax: FD[iDrag] };
  })();
  const st = (tau) => {
    const f = clamp(tau / SAMPLE, 0, SIM.n - 1.0001), i = Math.floor(f), u = f - i, L = (X) => lerp(X[i], X[i + 1], u);
    return { tau, h: L(SIM.H), v: L(SIM.V), a: L(SIM.A), m: L(SIM.M), T: L(SIM.T), fd: L(SIM.FD), nf: L(SIM.NF), w: L(SIM.M) * G };
  };
  const tauAtV = (vv) => { for (let i = 1; i < SIM.n; i++) if (SIM.V[i] >= vv && SIM.V[i - 1] < vv) return (i - 1 + (vv - SIM.V[i - 1]) / (SIM.V[i] - SIM.V[i - 1])) * SAMPLE; return 0; };
  const TAU_500 = tauAtV(500);

  // ---------- the clock: scene time → flight time (seconds since ignition) ----------
  // The flight runs in slow motion while the engines start, then in real time, then faster; the speed changes smoothly
  // (rate keys, linear between them), so nothing ever freezes.
  const T_IGN = 19.4;
  const RATE = [[0, 0], [T_IGN, 0], [T_IGN + 0.001, 0.0526], [34.3, 0.0526], [37.3, 1], [68.1, 1], [71.1, 2.6], [91.4, 2.6],
    [93.4, 2], [104.6, 2], [106.8, 4.6], [127.4, 4.6], [130.4, 1.3], [200, 1.3]];
  const DT_TAB = 0.01;
  const TAB = (() => {
    const n = Math.round(200 / DT_TAB) + 1, out = new Float64Array(n);
    const rate = (t) => { for (let i = 1; i < RATE.length; i++) if (t <= RATE[i][0]) { const [t0, r0] = RATE[i - 1], [t1, r1] = RATE[i]; return lerp(r0, r1, (t - t0) / (t1 - t0)); } return RATE[RATE.length - 1][1]; };
    for (let k = 1; k < n; k++) { const t = k * DT_TAB; out[k] = out[k - 1] + DT_TAB * 0.5 * (rate(t - DT_TAB) + rate(t)); }
    return out;
  })();
  const tauOf = (t) => { const f = clamp(t / DT_TAB, 0, TAB.length - 1.0001), k = Math.floor(f); return Math.min(lerp(TAB[k], TAB[k + 1], f - k), TAU_END - 0.01); };
  const sceneOf = (tau) => { for (let k = 1; k < TAB.length; k++) if (TAB[k] >= tau) return (k - 1 + (tau - TAB[k - 1]) / Math.max(1e-9, TAB[k] - TAB[k - 1])) * DT_TAB; return 200; };
  const rateAt = (t) => (tauOf(t + 0.05) - tauOf(t - 0.05)) / 0.1;

  // the key moments in scene time
  const S_LIFT = sceneOf(SIM.tLift), S_FULL = sceneOf(RAMP), S_OFF = sceneOf(SIM.tOff), S_TOP = sceneOf(SIM.tauTop);
  const S_DRAG = sceneOf(SIM.tauDrag), S_500 = sceneOf(TAU_500);
  const END_CARD = S_TOP + 30.6, DURATION = END_CARD + 13;

  // ---------- captions (each tied to what is on screen; the clock never stops, so each is long enough to read) ----------
  const CAPS = [
    [4.8, 11.8, 'A simplified rocket: 50 000 kg, of which 30 000 kg is fuel and oxygen. It stands on the launch pad.'],
    [12.0, 19.2, 'Its weight is mg = 50 000 × 9.8 = 4.9 × 10⁵ N. The pad pushes up just as hard: the resultant force is zero.'],
    [19.6, 28.6, 'The engine starts and the thrust grows (in slow motion). Predict: at what moment will the rocket leave the pad?'],
    [28.8, S_LIFT - 0.3, 'As the thrust grows, the pad pushes up less: thrust + normal force = weight.'],
    [S_LIFT - 0.1, S_LIFT + 5.9, 'Lift-off: the thrust is now bigger than the weight, so the resultant force points up.'],
    [S_LIFT + 6.1, S_LIFT + 16.5, 'Just after lift-off, at full thrust: resultant force = 6.25 × 10⁵ − 4.9 × 10⁵ = 1.35 × 10⁵ N, so a = 1.35 × 10⁵ ÷ 50 000 ≈ 2.7 m s⁻². As fuel is used, a creeps up.'],
    [S_LIFT + 16.7, S_LIFT + 24.4, 'Where does the thrust come from? Every second the engine pushes 250 kg of gas down out of the nozzle, at 2500 m s⁻¹.'],
    [S_LIFT + 24.6, S_LIFT + 30.6, 'By Newton’s third law, the gas pushes the rocket up just as hard. That push is the thrust.'],
    [S_LIFT + 30.8, S_LIFT + 36.6, 'Thrust = rate of change of the gas’s momentum: F = vΔm/Δt = 2500 × 250 = 6.25 × 10⁵ N.'],
    [S_LIFT + 36.8, S_DRAG - 5.6, 'Now 3 times faster. 250 kg of fuel and oxygen is used every second, so the mass decreases and the acceleration grows.'],
    [S_DRAG - 5.4, S_500 - 1.8, 'The drag force grows with speed, but the air thins as the rocket climbs: the drag is largest about 73 s after launch.'],
    [S_500 - 1.6, S_500 + 5.6, 'Power: the thrust does work on the rocket at P = Fv. At 500 m s⁻¹ that is 6.25 × 10⁵ × 500 ≈ 3.1 × 10⁸ W.'],
    [S_500 + 5.8, S_OFF - 0.3, 'By the end of the burn the mass is down to 20 000 kg, so the same thrust gives a ≈ (6.25 × 10⁵ − 1.96 × 10⁵) ÷ 20 000 ≈ 21 m s⁻².'],
    [S_OFF - 0.1, S_OFF + 8.4, 'All the fuel is used up and the engine stops. Predict: which way does the rocket accelerate now?'],
    [S_OFF + 8.6, S_OFF + 16.4, 'Downward. Only its weight acts (the drag is tiny up here). It still rises, but loses 9.8 m s⁻¹ of speed every second.'],
    [S_OFF + 16.6, S_TOP - 0.4, 'Coasting up, kinetic energy turns into gravitational potential energy. The total stays the same.'],
    [S_TOP - 0.2, S_TOP + 7.0, 'At the top, about 98 km up, it stops for an instant, but its acceleration is still 9.8 m s⁻² downward.'],
    [S_TOP + 7.2, S_TOP + 14.8, 'To go into orbit at this height it would need about 7.8 km s⁻¹ sideways (D.1, HL). This rocket falls back down.'],
    [S_TOP + 15.0, S_TOP + 22.8, 'Energy: fuel and oxygen release about 10 MJ per kg, so about 3 × 10¹¹ J in all, mostly to the hot, fast exhaust.'],
    [S_TOP + 23.0, END_CARD - 0.2, 'At the top the rocket had Ep = mgh = 20 000 × 9.8 × 97 700 ≈ 1.9 × 10¹⁰ J: only about 6% of that energy.'],
  ];

  // ---------- colours ----------
  const THR = C.force, WGT = '200,150,255', NRM = C.good, DRG = '255,110,130', RES = C.white, KE = C.vel, PE = C.field;
  const MCOL = '255,214,102', ACOL = C.force, VCOL = C.vel;

  // ---------- seeded background (stars, clouds, smoke) ----------
  let seed = 20261117;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const STARS = Array.from({ length: 140 }, () => [rnd(), rnd(), 0.4 + rnd() * 1.4, rnd()]);
  const CLOUDS = Array.from({ length: 9 }, (_, i) => ({ alt: 1.5 + i * 0.9 + rnd() * 0.6, x: rnd(), w: 0.35 + rnd() * 0.35 }));
  const SMOKE = Array.from({ length: 34 }, () => ({ dir: rnd() < 0.5 ? -1 : 1, sp: 0.4 + rnd() * 0.9, lift: rnd(), r: 0.5 + rnd() * 0.7, t0: rnd() * 2.2 }));

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25)), capTop = H - capFs * (phone ? 6.4 : 5.0);
    const fs = phone ? 10 : Math.round(clamp(W / 82, 11, 15));
    const vx0 = phone ? 4 : Math.round(W * 0.03), vx1 = phone ? Math.round(W * 0.44) : Math.round(W * 0.44);
    const vy0 = phone ? 6 : Math.max(8, Math.round(H * 0.04)), vy1 = Math.round(capTop - fs * 0.6);
    const px0 = phone ? Math.round(W * 0.48) : Math.round(W * 0.5), px1 = W - (phone ? 6 : Math.round(W * 0.03));
    const py0 = phone ? 6 : Math.max(52, Math.round(H * 0.13));       // the panel starts below the buttons on wide screens
    L = { W, H, phone, fs, capTop, vx0, vx1, vy0, vy1, px0, px1, py0, py1: vy1 };
    const vh = vy1 - vy0;
    L.rh = Math.min(vh * 0.36, (vx1 - vx0) * 1.5);                   // rocket height on screen (px)
    L.kNear = L.rh / LEN;                                            // px per metre, near the pad
    L.kFar = vh / 34;                                                // px per km, for the altitude ruler and the clouds
    L.groundY = vy0 + vh * 0.86; L.followY = vy0 + vh * 0.62;        // where the rocket's base sits on the pad and in flight
    L.fScale = vh * 0.3 / TF;                                        // force arrows: full thrust = 0.3 of the view's height
  }

  // text in pieces: [text, style] with 'i' italic serif, 'r' upright serif, 's' italic subscript, 'sans'
  function rich(s, parts, x, y, size, a, rgb = C.text, align = 'center') {
    const { g } = s; if (a <= 0) return 0;
    const font = (st) => (st === 's' ? D.serif(Math.round(size * 0.7)) : st === 'i' ? D.serif(size) : st === 'r' ? D.serif(size, false) : D.sans(Math.round(size * 0.9)));
    const ws = parts.map(([tx, st]) => { g.font = font(st); return g.measureText(tx).width; });
    const total = ws.reduce((p, q) => p + q, 0);
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 8; g.fillStyle = `rgba(${rgb},${a})`;
    parts.forEach(([tx, st], i) => { g.font = font(st); g.fillText(tx, px, st === 's' ? y + size * 0.28 : y); px += ws[i]; });
    g.shadowBlur = 0;
    return total;
  }
  const sci = (x, d = 2) => { if (x === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e; const sup = String(e).replace('-', '⁻').replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]); return `${m.toFixed(d)} × 10${sup}`; };
  const grp = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // ---------- the view ----------
  function drawView(s, t, S, a) {
    const { g } = s, { vx0, vx1, vy0, vy1, kNear, kFar, rh, groundY, followY, phone, fs } = L, cx = (vx0 + vx1) / 2, vw = vx1 - vx0;
    g.save(); g.beginPath(); g.rect(vx0, vy0, vw, vy1 - vy0); g.clip();
    // sky: blue near the ground, black above about 50 km
    const hk = S.h / 1000, sky = Math.exp(-hk / 11);
    const top = `rgba(${Math.round(10 + 30 * sky)},${Math.round(14 + 70 * sky)},${Math.round(30 + 120 * sky)},1)`;
    const bot = `rgba(${Math.round(20 + 90 * sky)},${Math.round(30 + 120 * sky)},${Math.round(60 + 150 * sky)},1)`;
    const sg = g.createLinearGradient(0, vy0, 0, vy1); sg.addColorStop(0, top); sg.addColorStop(1, bot);
    g.globalAlpha = a; g.fillStyle = sg; g.fillRect(vx0, vy0, vw, vy1 - vy0);
    // stars appear as the sky darkens
    const sa = a * clamp((hk - 18) / 30, 0, 1);
    if (sa > 0) for (const [sx, sy, r, tw] of STARS) {
      g.globalAlpha = sa * (0.5 + 0.5 * Math.sin(s.clock * 1.3 + tw * 9));
      g.fillStyle = '#e8eeff'; g.beginPath(); g.arc(vx0 + sx * vw, vy0 + sy * (vy1 - vy0), r * (phone ? 0.7 : 1), 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    // where the rocket's base is drawn
    const baseY = Math.min(groundY, Math.max(followY, groundY - S.h * kNear));
    const camH = S.h - (groundY - baseY) / kNear;                     // the height (m) that sits at groundY on screen
    // clouds and the altitude ruler (far scale: kFar px per km, measured from the rocket's base)
    for (const c of CLOUDS) {
      const y = baseY + (hk - c.alt) * kFar; if (y < vy0 - 30 || y > vy1 + 30) continue;
      const ca = a * 0.5 * clamp(1 - Math.abs(y - (vy0 + vy1) / 2) / ((vy1 - vy0) * 0.7), 0, 1);
      const x = vx0 + c.x * vw, w = c.w * vw;
      const cg = g.createRadialGradient(x, y, 0, x, y, w * 0.5); cg.addColorStop(0, `rgba(235,240,255,${ca})`); cg.addColorStop(1, 'rgba(235,240,255,0)');
      g.fillStyle = cg; g.beginPath(); g.ellipse(x, y, w * 0.5, w * 0.12, 0, 0, 7); g.fill();
    }
    // the height ruler (heights above the ground), shown once the rocket has left the pad far behind
    const tickX = vx0 + 2, ra = a * clamp((S.h - 500) / 1500, 0, 1);
    if (ra > 0) for (let km = 10; km <= 110; km += 10) {
      const y = baseY + (hk - km) * kFar; if (y < vy0 + 6 || y > vy1 - 6) continue;
      D.line(s, tickX, y, tickX + fs * 0.9, y, C.muted, 0.55 * ra, 1);
      D.text(s, phone ? `${km}` : `${km} km`, tickX + fs * 1.2, y, fs - 1, 0.7 * ra, D.sans(fs - 1), C.muted, 'left');
    }
    if (ra > 0 && phone) D.text(s, 'height / km', vx0 + 3, vy1 - fs * 0.7, fs - 1, 0.7 * ra, D.sans(fs - 1), C.muted, 'left');
    // the ground, pad and tower (near scale: kNear px per metre)
    const gY = groundY + camH * kNear;
    if (gY < vy1 + 40) {
      g.globalAlpha = a;
      const gg = g.createLinearGradient(0, gY, 0, vy1); gg.addColorStop(0, '#1d2a22'); gg.addColorStop(1, '#0c120f');
      g.fillStyle = gg; g.fillRect(vx0, gY, vw, Math.max(0, vy1 - gY));
      g.fillStyle = '#3a4152'; g.fillRect(cx - rh * 0.28, gY - rh * 0.03, rh * 0.56, rh * 0.03);          // the pad
      const tx = cx + rh * 0.17, tw = rh * 0.045;                                                       // the tower
      g.strokeStyle = 'rgba(150,160,185,0.8)'; g.lineWidth = 1;
      g.strokeRect(tx, gY - rh * 1.05, tw, rh * 1.02);
      for (let k = 0; k < 10; k++) { const y0 = gY - rh * 1.05 + k * rh * 0.102; g.beginPath(); g.moveTo(tx, y0); g.lineTo(tx + tw, y0 + rh * 0.102); g.stroke(); }
      g.globalAlpha = 1;
    }
    // smoke on the pad once the engines start (stays at ground level)
    if (S.tau > 0 && gY < vy1 + 80) {
      const age = S.tau;
      for (const p of SMOKE) {
        const life = age * 1.0 - p.t0 * 0.05; if (life <= 0) continue;
        const spread = Math.min(1, life / 6) * (0.8 + p.sp), x = cx + p.dir * spread * rh * 0.55, y = gY - rh * (0.02 + p.lift * 0.12 * Math.min(1, life / 4));
        const r = rh * 0.08 * p.r * (0.6 + Math.min(1.5, life * 0.25)), aa = a * 0.32 * clamp(life * 2, 0, 1) * clamp(1 - (life - 25) / 20, 0, 1);
        if (aa <= 0) continue;
        const sgr = g.createRadialGradient(x, y, 0, x, y, r); sgr.addColorStop(0, `rgba(205,210,225,${aa})`); sgr.addColorStop(1, 'rgba(205,210,225,0)');
        g.fillStyle = sgr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      }
    }
    // the rocket, with its exhaust
    drawRocket(s, cx, baseY, rh, S, a);
    g.restore();
    D.line(s, vx0, vy0, vx0, vy1, '120,135,190', 0.35 * a, 1); D.line(s, vx1, vy0, vx1, vy1, '120,135,190', 0.35 * a, 1);
    return { cx, baseY };
  }

  function drawRocket(s, cx, baseY, rh, S, a) {
    const { g } = s, w = rh * 0.11, top = baseY - rh, thrust = S.T / TF;
    // exhaust: longer with more thrust, wider as the air thins
    if (thrust > 0) {
      const thin = 1 - Math.exp(-S.h / HS), fl = rh * (0.25 + 0.55 * thrust) * (1 + 0.04 * Math.sin(s.clock * 37)), fw = w * (0.7 + 2.2 * thin);
      g.globalCompositeOperation = 'lighter';
      const fg = g.createLinearGradient(0, baseY, 0, baseY + fl);
      fg.addColorStop(0, `rgba(255,255,235,${0.95 * a})`); fg.addColorStop(0.25, `rgba(255,200,110,${0.8 * a})`); fg.addColorStop(1, 'rgba(255,110,40,0)');
      g.fillStyle = fg; g.beginPath(); g.moveTo(cx - w * 0.38, baseY);
      g.quadraticCurveTo(cx - fw, baseY + fl * 0.45, cx, baseY + fl); g.quadraticCurveTo(cx + fw, baseY + fl * 0.45, cx + w * 0.38, baseY); g.fill();
      g.globalCompositeOperation = 'source-over';
    }
    g.save(); g.globalAlpha = a;
    // fins
    g.fillStyle = '#5b647c'; g.strokeStyle = 'rgba(143,184,255,0.6)'; g.lineWidth = 1;
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(cx + k * w * 0.5, baseY - rh * 0.16); g.lineTo(cx + k * w * 1.05, baseY - rh * 0.02); g.lineTo(cx + k * w * 1.05, baseY + rh * 0.01); g.lineTo(cx + k * w * 0.5, baseY - rh * 0.03); g.closePath(); g.fill(); g.stroke(); }
    // nozzle
    g.fillStyle = '#2a3042'; g.beginPath(); g.moveTo(cx - w * 0.25, baseY - rh * 0.02); g.lineTo(cx - w * 0.4, baseY); g.lineTo(cx + w * 0.4, baseY); g.lineTo(cx + w * 0.25, baseY - rh * 0.02); g.closePath(); g.fill();
    // body and nose
    const body = g.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    body.addColorStop(0, '#5c6578'); body.addColorStop(0.35, '#ffffff'); body.addColorStop(0.7, '#b9c1d3'); body.addColorStop(1, '#4a5266');
    g.fillStyle = body; g.beginPath(); g.moveTo(cx - w / 2, baseY - rh * 0.02); g.lineTo(cx - w / 2, top + rh * 0.16);
    g.quadraticCurveTo(cx - w / 2, top + rh * 0.03, cx, top); g.quadraticCurveTo(cx + w / 2, top + rh * 0.03, cx + w / 2, top + rh * 0.16);
    g.lineTo(cx + w / 2, baseY - rh * 0.02); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.3)'; g.stroke();
    // a band and a window to make it look like a rocket
    g.fillStyle = 'rgba(40,46,64,0.85)'; g.fillRect(cx - w / 2, top + rh * 0.22, w, rh * 0.02); g.fillRect(cx - w / 2, baseY - rh * 0.2, w, rh * 0.015);
    g.restore();
  }

  // force arrows from the rocket's middle, drawn to scale (full thrust = 0.3 of the view's height):
  // left column normal force (up) and weight (down), right column thrust (up) and drag (against the motion);
  // labels on the outer side of each column (symbols on phones, where the view is narrow)
  function drawForces(s, S, pos, a, third) {
    if (a <= 0) return;
    const { fs, fScale, rh, phone } = L, cy = pos.baseY - rh * 0.45, dx = Math.max(rh * 0.16, fs * 1.2);
    const arrow = (x, len, dir, rgb, parts, side) => {
      if (len < 2) return;
      D.arrow(s, x, cy, x, cy + dir * len, rgb, a, '', { width: phone ? 2 : 2.6, head: phone ? 7 : 10 });
      const lines = Array.isArray(parts[0][0]) ? parts : [parts];
      lines.forEach((ln, i) => rich(s, ln, x + side * fs * 0.55, cy + dir * Math.max(len * 0.6, fs) + (i - (lines.length - 1) / 2) * fs * 1.15, fs + (phone ? 0 : 1), a, rgb, side > 0 ? 'left' : 'right'));
    };
    const thrLab = third > 0.5 ? [[['gas pushes', 'sans']], [['rocket up', 'sans']]] : [['thrust', 'sans']];
    arrow(pos.cx + dx, S.T * fScale, -1, THR, thrLab, 1);
    if (S.nf > 1) arrow(pos.cx - dx, S.nf * fScale, -1, NRM, phone ? [['F', 'i'], ['N', 's']] : [['normal force', 'sans']], -1);
    arrow(pos.cx - dx, S.w * fScale, 1, WGT, phone ? [['mg', 'i']] : [['weight', 'sans']], -1);
    if (Math.abs(S.fd) * fScale > 3) arrow(pos.cx + dx, Math.abs(S.fd) * fScale, S.fd > 0 ? 1 : -1, DRG, phone ? [['F', 'i'], ['d', 's']] : [['drag', 'sans']], 1);
  }

  // the panel: live numbers and graphs
  function drawPanel(s, t, S, a) {
    if (a <= 0) return;
    const { g } = s, { px0, px1, py0, py1, fs, phone } = L, pw = px1 - px0;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(14,20,44,${0.7 * a})`;
    g.beginPath(); g.roundRect(px0 - 6, py0 - 6, pw + 12, py1 - py0 + 12, 10); g.fill();
    const lh = fs * 1.42; let y = py0 + fs * 0.8;
    const r = rateAt(t), speedTxt = t < T_IGN ? 'engine off' : r < 0.5 ? 'slow motion' : r < 1.15 ? 'real time' : r < 2.5 ? `${r.toFixed(1)} times faster` : `${Math.round(r)} times faster`;
    D.text(s, `flight time ${S.tau.toFixed(phone && r >= 1 ? 0 : 1)} s`, px0, y, fs, 0.9 * a, D.sans(fs, 600), C.text, 'left');
    D.text(s, speedTxt, px1, y, fs - 1, 0.7 * a, D.sans(fs - 1), C.muted, 'right'); y += lh;
    const hTxt = S.h < 1000 ? `${Math.round(S.h)} m` : `${(S.h / 1000).toFixed(1)} km`;
    const rows = [
      [`height ${hTxt}`, C.text], [`speed ${Math.round(Math.abs(S.v))} m s⁻¹ ${S.v < -0.5 ? '(down)' : ''}`, VCOL],
      [`mass ${grp(S.m)} kg`, MCOL],
    ];
    const cols = phone ? 1 : 2, colW = pw / cols;
    rows.forEach(([txt, rgb], i) => D.text(s, txt, px0 + (i % cols) * colW, y + Math.floor(i / cols) * lh, fs, 0.9 * a, D.sans(fs), rgb, 'left'));
    y += lh * Math.ceil(rows.length / cols);
    // forces (and P = Fv) until the engine stops; then the energy bars take their place
    const ea = a * fade(t, S_OFF + 16.6, END_CARD, 0.7, 0.6);
    const fa = a * fade(t, 11.0, END_CARD, 0.6, 0.6) * (1 - smooth((t - S_OFF - 16.0) / 0.7));
    const fy = y;
    const frows = [[`thrust ${S.T > 0 ? sci(S.T, 2) : '0'} N`, THR], [`weight ${sci(S.w, 2)} N`, WGT]];
    if (S.nf > 1) frows.push([`normal ${sci(S.nf, 2)} N`, NRM]);
    else frows.push([`drag ${Math.abs(S.fd) >= 100 ? sci(Math.abs(S.fd), 1) : Math.round(Math.abs(S.fd))} N`, DRG]);
    const hideA = t >= S_OFF - 0.1 && t < S_OFF + 8.6;                 // during the cut-off Predict, don't give the answer away
    frows.push([hideA ? 'a = ?' : `a = ${Math.abs(S.a).toFixed(1)} m s⁻²${S.a < -0.05 ? ' down' : S.a > 0.05 ? ' up' : ''}`, ACOL]);
    if (fa > 0) frows.forEach(([txt, rgb], i) => D.text(s, txt, px0 + (i % cols) * colW, y + Math.floor(i / cols) * lh, fs, 0.85 * fa, D.sans(fs), rgb, 'left'));
    const pa = a * fade(t, S_500 - 1.6, S_OFF + 1, 0.5, 0.6), py = y + lh * Math.ceil(frows.length / cols);
    if (pa > 0) D.text(s, `P = Fv = ${S.T > 0 ? sci(S.T * Math.max(0, S.v), 1) : '0'} W`, px0, py, fs, 0.9 * pa, D.sans(fs, 600), THR, 'left');
    const secLines = Math.max(Math.ceil(frows.length / cols) + 1, 4);
    if (ea > 0) energyBars(s, S, px0, px1, fy, ea);
    y += lh * secLines + fs * 0.4;
    // graphs of m, a and v against flight time (0 to 250 s)
    const ga = a * fade(t, S_LIFT + 36.8, END_CARD, 0.8, 0.6);
    const gy0 = y, gy1 = py1 - fs * 1.1, gh = (gy1 - gy0) / 3, few = gh < fs * 4.4;
    if (ga > 0 && gh > fs * 2) {
      graph(s, S, px0, px1, gy0, gy0 + gh - fs * 0.5, SIM.M, 0, 60000, few ? [0, 50000] : [0, 20000, 50000], 'm / kg', MCOL, ga, (v) => grp(v));
      graph(s, S, px0, px1, gy0 + gh, gy0 + 2 * gh - fs * 0.5, SIM.A, -15, 30, few ? [0, 20] : [-10, 0, 20], 'a / m s⁻²', ACOL, ga, (v) => (v < 0 ? '−' : '') + Math.abs(v), false, hideA ? SIM.tOff - 0.1 : Infinity);
      graph(s, S, px0, px1, gy0 + 2 * gh, gy1, SIM.V, -400, 1400, few ? [0, 1000] : [0, 500, 1000], 'v / m s⁻¹', VCOL, ga, (v) => String(v), true);
    }
  }
  function graph(s, S, x0, x1, y0, y1, arr, vmin, vmax, ticks, label, rgb, a, fmt, timeAxis = false, tauLim = Infinity) {
    const { fs } = L, lw = fs * 2.6, X = (tau) => x0 + lw + (tau / 250) * (x1 - x0 - lw - 4), Y = (v) => y1 - ((v - vmin) / (vmax - vmin)) * (y1 - y0);
    for (const tk of ticks) { D.line(s, X(0), Y(tk), X(250), Y(tk), C.muted, (tk === 0 ? 0.35 : 0.12) * a, 1, tk === 0 ? null : [3, 4]); D.text(s, fmt(tk), X(0) - 3, Y(tk), fs - 2, 0.7 * a, D.sans(fs - 2), C.muted, 'right'); }
    D.line(s, X(0), y0, X(0), y1, C.muted, 0.5 * a, 1);
    D.text(s, label, X(0) + 4, y0 + fs * 0.1, fs - 1, 0.85 * a, D.sans(fs - 1), rgb, 'left');
    const tt = clamp(Math.min(S.tau, tauLim), 0, 250), pts = [], n = Math.floor(tt / 0.5);
    for (let k = 0; k <= n; k++) pts.push([X(k * 0.5), Y(clamp(arr[Math.round(k * 0.5 / SAMPLE)], vmin, vmax))]);
    const fi = tt / SAMPLE, i0 = Math.floor(fi);
    pts.push([X(tt), Y(clamp(lerp(arr[i0], arr[Math.min(i0 + 1, arr.length - 1)], fi - i0), vmin, vmax))]);
    D.glowLine(s, pts, rgb, a, 1.6);
    if (timeAxis) {
      for (const tk of [0, 100, 200]) D.text(s, String(tk), X(tk), y1 + fs * 0.75, fs - 2, 0.7 * a, D.sans(fs - 2), C.muted);
      D.text(s, 't / s', X(250), y1 + fs * 0.75, fs - 2, 0.7 * a, D.sans(fs - 2), C.muted, 'right');
    }
  }
  function energyBars(s, S, x0, x1, y0, a) {
    const { fs, phone } = L, m = S.m, ek = 0.5 * m * S.v * S.v, ep = m * G * Math.max(0, S.h), tot = ek + ep;
    const lab0 = x0 + fs * 3.0, valW = fs * 5.2, scale = (x1 - lab0 - valW) / 2.0e10, lh = fs * 1.42;
    D.text(s, phone ? 'energy / J' : 'energy of the rocket / J (from the ground)', x0, y0, fs, 0.85 * a, D.sans(fs), C.muted, 'left');
    const bar = (yy, val, rgb, lab) => {
      const { g } = s; g.globalCompositeOperation = 'source-over';
      g.fillStyle = `rgba(255,255,255,${0.06 * a})`; g.fillRect(lab0, yy - fs * 0.35, 2.0e10 * scale, fs * 0.7);
      g.fillStyle = `rgba(${rgb},${0.9 * a})`; g.fillRect(lab0, yy - fs * 0.35, Math.max(0, val) * scale, fs * 0.7);
      rich(s, lab, x0, yy, fs, a, rgb, 'left');
      D.text(s, sci(val, 1), x1, yy, fs - 1, 0.85 * a, D.sans(fs - 1), rgb, 'right');
    };
    bar(y0 + lh, ek, KE, [['E', 'i'], ['k', 's']]);
    bar(y0 + 2 * lh, ep, PE, [['E', 'i'], ['p', 's']]);
    bar(y0 + 3 * lh, tot, RES, [['total', 'sans']]);
  }

  // Newton's third law at the nozzle: parcels of gas shooting down, and the push of the rocket on the gas
  // (its partner, the push of the gas on the rocket, is the thrust arrow, relabelled while this shows)
  function drawThird(s, t, S, pos, a) {
    if (a <= 0 || S.T <= 0) return;
    const { rh, fs, phone } = L, x = pos.cx, y = pos.baseY, dx = Math.max(rh * 0.16, fs * 1.2);
    for (let k = 0; k < 8; k++) {                                    // parcels of gas leaving the nozzle (drawn far slower than real)
      const ph = (s.clock * 1.6 + k / 8) % 1, yy = y + ph * rh * 0.7;
      D.glowDot(s, x + Math.sin(k * 2.3) * rh * 0.02, yy, Math.max(3, rh * 0.03), '255,200,120', 0.8 * a * (1 - ph));
    }
    const L1 = S.T * L.fScale, y0 = y + fs * 0.4;                    // equal in size to the thrust (a third-law pair), same scale
    const hd = phone ? 7 : 9;                                         // dashed: this force acts on the gas, not on the rocket
    D.line(s, x + dx, y0, x + dx, y0 + L1 - hd, THR, 0.9 * a, phone ? 2 : 2.4, [5, 4]);
    D.arrow(s, x + dx, y0 + L1 - hd * 1.6, x + dx, y0 + L1, THR, a, '', { width: phone ? 2 : 2.4, head: hd });
    rich(s, [['rocket pushes', 'sans']], x + dx + fs * 0.55, y0 + L1 * 0.5 - fs * 0.58, fs + (phone ? 0 : 1), a, THR, 'left');
    rich(s, [['gas down', 'sans']], x + dx + fs * 0.55, y0 + L1 * 0.5 + fs * 0.58, fs + (phone ? 0 : 1), a, THR, 'left');
  }

  function endCard(s, t) {
    const a = fade(t, END_CARD, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 30, 18, 38)), s2 = Math.round(clamp(W / 58, 12, 18));
    D.text(s, 'A rocket launch', W / 2, H * (phone ? 0.1 : 0.14), s1, a, D.sans(s1, 300));
    const items = [
      ['Lift-off', THR, 'The thrust is bigger than the weight, so the resultant force points up.'],
      ['Thrust', THR, 'F = vΔm/Δt: the rocket pushes gas down, and the gas pushes the rocket up (Newton’s third law).'],
      ['a = F/m', ACOL, 'Same thrust, less mass: the acceleration grows during the burn.'],
      ['Engine off', WGT, 'Only the weight acts: the acceleration is 9.8 m s⁻² downward, even while it still rises.'],
      ['Energy', KE, 'Chemical energy → kinetic and gravitational potential energy of the rocket, and mostly the exhaust.'],
    ];
    let y = H * (phone ? 0.2 : 0.27);
    const colW = Math.min(W - 40, phone ? W - 30 : 720);
    for (const [h, rgb, txt] of items) {
      D.text(s, h, W / 2, y, s2 + 2, a, D.sans(s2 + 2, 600), rgb); y += s2 * 1.45;
      g.font = D.sans(s2); const ls = D.wrap(s, txt, colW); D.text(s, ls, W / 2, y, s2, 0.85 * a, D.sans(s2)); y += s2 * 1.3 * ls.length + s2 * (phone ? 0.7 : 0.55);
    }
    g.font = D.sans(s2 - 2);
    D.text(s, D.wrap(s, 'A simplified rocket: straight up, gravity taken as constant, a simple model of drag.', W - 40), W / 2, Math.max(y + s2 * 0.4, H * 0.86), s2 - 2, 0.6 * a, D.sans(s2 - 2), C.muted);
  }

  Anim.register('launch', {
    duration: DURATION,
    poster: S_LIFT + 8,
    // score: lift-off (B-flat major, a warm saw pad, a low drone, a deep rumble of wind, a slow swell)
    music: { chords: [[46, 53, 58, 62], [43, 50, 55, 58], [39, 46, 51, 55], [41, 48, 53, 57]], bar: 9, pad: 'saw', cutoff: 800, drone: 0.12, wind: 0.5, tremolo: 0.3, volume: 0.78 },
    resize: layout,
    info: { SIM, st, tauOf, sceneOf, CAPS, S_LIFT, S_FULL, S_OFF, S_TOP, S_DRAG, S_500, TAU_500, check() {
      const s0 = st(0), sF = st(RAMP), sE = st(SIM.tOff - 0.5), sT = st(SIM.tauTop);
      return {
        weight: M0 * G, tLift: SIM.tLift, aFull: sF.a, mFull: sF.m, tOff: SIM.tOff, mOff: st(SIM.tOff + 0.1).m, aEnd: sE.a, dragEnd: sE.fd,
        tauDrag: SIM.tauDrag, dragMax: SIM.dragMax, tau500: TAU_500, P500: TF * 500, vOff: st(SIM.tOff).v, hOff: st(SIM.tOff).h,
        tauTop: SIM.tauTop, hTop: SIM.hTop, vOrbit: Math.sqrt(6.67e-11 * 5.97e24 / (6.37e6 + SIM.hTop)), EpTop: 20000 * G * SIM.hTop,
        fuelE: PROP * 10e6, share: 20000 * G * SIM.hTop / (PROP * 10e6), s0,
        sceneTimes: { S_LIFT, S_FULL, S_DRAG, S_500, S_OFF, S_TOP, END_CARD },
      };
    } },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      const S = st(tauOf(t));
      D.background(s, 0.18);
      const va = smooth((t - 4.6) / 0.8) * (1 - smooth((t - END_CARD) / 0.8));
      const pos = drawView(s, t, S, va);
      const third = fade(t, S_LIFT + 16.7, S_LIFT + 36.6, 0.6, 0.6);
      drawForces(s, S, pos, va * fade(t, 11.0, S_TOP + 6.6, 0.6, 0.8), third);
      drawThird(s, t, S, pos, va * third);
      drawPanel(s, t, S, smooth((t - 4.8) / 0.8) * (1 - smooth((t - END_CARD) / 0.8)));
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.8 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'A rocket launch', 'The physics of getting off the ground');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
