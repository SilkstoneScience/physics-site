/* What is gravity, really? (D.1 starting point; everything after the first steps is general relativity, beyond the
   IB course, and is labelled so on screen and on the page). The animation partner of the Think deeper big question
   BQ-18 "Is gravity a force at all?" (think/big-questions.json), with the same ideas and the reviewer's fixes.
   Numbers (all recalculated in info.check()):
     Apple and ball dropped 2.0 m on Earth (g = 9.8 m s⁻², no air resistance): t = √(2h/g) = √(4.0/9.8) = 0.639 s for both;
       forces 0.20 × 9.8 = 1.96 N and 0.60 × 9.8 = 5.88 N (3 times bigger), accelerations both 9.8 m s⁻².
     Hammer and feather on the Moon (Apollo 15, 2 August 1971), g = 1.62 m s⁻² (shown as 1.6), dropped 1.2 m:
       t = √(2 × 1.2 ÷ 1.62) = 1.22 s.
     Apple let go 1.0 m above the floor of a lift standing still: t = √(2.0 ÷ 9.8) = 0.452 s.
     The space station about 400 km up (410 km used): g = 9.8 × (6370 ÷ 6780)² = 8.65 N kg⁻¹, 88%: "about 90%".
       Its orbit drawn to scale: radius 6780 km against the Earth's 6370 km; period 2π√(r³/GM) = 92.6 min; on screen one orbit takes 11 s, about 500 times faster.
     Walkers on the equator 30° of longitude apart: 6371 km × π/6 = 3336 km ("about 3300 km"); the gap at latitude φ is
       3336 cos φ, zero at the pole. The globe is drawn from the exact sphere (orthographic view, tilted 25°).
     Clocks: Δf/f = gΔh/c² = 9.8 × 1 ÷ (3.00 × 10⁸)² = 1.09 × 10⁻¹⁶ per metre; 33 cm: 3.6 × 10⁻¹⁷ (Chou et al., 2010).
       On screen the lower clock runs at 0.80 of the upper one's rate: hugely exaggerated, and labelled so.
     GPS: r = 26 560 km (about 20 200 km up), GM = 3.986 × 10¹⁴ N m² kg⁻¹, c = 2.998 × 10⁸ m s⁻¹, R = 6371 km:
       gravity: GM(1/R − 1/r)/c² × 86 400 s = 45.7 μs a day faster; speed v = √(GM/r) = 3.87 km s⁻¹:
       v²/2c² × 86 400 s = 7.2 μs a day slower; overall 38.5 μs a day ("38"); × c = 11.5 km ("more than 10 km").
       Period 2π√(r³/GM) = 43 080 s = 11.97 h; on screen one orbit takes 24 s, about 1800 times faster.
     Rubber sheet: depth ∝ −1/√(r² + a²) (a smooth dip, a picture only); the small ball goes round at a steady rate.
     Starlight bent by the Sun: 1.75 arcseconds, twice the 0.87 of a Newton-style calculation (1919 eclipse);
       Mercury's extra 43 arcseconds per century; LIGO, 14 September 2015. The bending is drawn hugely exaggerated.
   No pauses: everything that moves (the drops, the walkers, the clock hands, the orbits) runs on the scene clock at a
   steady speed and repeats while the captions are read. Every frame is drawn from the scene time alone. */
(() => {
  'use strict';
  const { D, C, clamp, smooth, lerp, fade } = Anim;
  const NB = ' ';

  // ---------- physics ----------
  const G = 9.8, GMOON = 1.62, CL = 2.998e8, GM_E = 3.986e14, RE = 6.371e6, RGPS = 2.656e7, H_ISS = 4.1e5;
  const T_APPLE = Math.sqrt(2 * 2.0 / G), T_MOON = Math.sqrt(2 * 1.2 / GMOON), T_LIFT = Math.sqrt(2 * 1.0 / G);
  const G_ISS = G * (6370 / 6780) ** 2;
  const GAP0 = 6371 * Math.PI / 6;                                   // km, 30° of longitude on the equator
  const PER_M = G * 1 / (3.00e8) ** 2, PER_33 = G * 0.33 / CL ** 2;
  const GPS_G = GM_E * (1 / RE - 1 / RGPS) / CL ** 2 * 86400e6, V_GPS = Math.sqrt(GM_E / RGPS), GPS_V = V_GPS ** 2 / 2 / CL ** 2 * 86400e6;
  const T_GPS = 2 * Math.PI * Math.sqrt(RGPS ** 3 / GM_E), T_ISS = 2 * Math.PI * Math.sqrt((RE + H_ISS) ** 3 / GM_E);
  const SLOW = 0.80;                                                 // the lower clock's rate on screen (exaggerated)

  // ---------- captions and timeline ----------
  // Each caption gets at least 5.2 s, and about 15 characters a second or fewer (+6 s for the prediction); the sections follow
  // the captions. Nothing freezes: the moving things repeat at a steady speed while each caption is read.
  const SEQ = [
    ['newton', `In D.1, gravity is a force: the Earth pulls an apple down with a force F${NB}=${NB}GMm/r², so it accelerates towards the ground.`],
    ['newton', 'Every object in free fall at the same place has the same acceleration, whatever its mass (with no air resistance). Three times the mass means three times the force, but the same acceleration.', 0, 'alike'],
    ['moon', 'On the Moon in 1971, an astronaut dropped a hammer and a feather together. With no air there, they landed at the same moment.'],
    ['moon', `In Newton's picture the mass cancels: GMm/r²${NB}=${NB}ma, so a${NB}=${NB}GM/r². But why should it cancel exactly?`],
    ['moon', 'Einstein took it as a clue. His general relativity (1915) goes beyond the IB course, but its central ideas need no new equations.', 0, 'beyond'],
    ['lift', 'Predict: a lift is falling freely, and you let go of an apple inside it. What does the apple do?', 6],
    ['lift', 'It floats beside your hand: you, the apple and the lift all fall together. Free fall feels like no force at all.'],
    ['lift', 'Astronauts on the space station float for the same reason. Gravity there is still about 90% as strong as on the ground.', 0, 'iss'],
    ['lift', `What you feel when standing is the floor pushing up on you. A phone's accelerometer on the floor reads about 9.8${NB}m${NB}s⁻² upwards; in free fall, about zero.`, 0, 'floor'],
    ['lift', 'Einstein\'s view: the floor\'s push is the only real force on you. It keeps pushing you off the free-fall path you would otherwise follow.'],
    ['globe', `Straight lines on a curved surface: two people start on the equator, about 3300${NB}km apart, and both walk due north.`],
    ['globe', 'Neither ever turns, yet they get closer and closer, and meet at the North Pole. Nothing pulled them together: the surface is curved.', 0, 'meet'],
    ['globe', 'General relativity says the same about spacetime. Mass curves it, and anything with no force on it follows the straightest possible path through it.'],
    ['globe', 'So free paths that start out parallel bend towards each other. An apple falls because it follows its free path; the ground, pushed up by the Earth beneath it, does not.'],
    ['clocks', 'The surprise: for everyday falling, what matters most is the warping of time. Near the Earth, time runs slightly more slowly the lower down you are.'],
    ['clocks', `Compared with a clock on the floor, a clock 1${NB}m higher gains about 1.1${NB}×${NB}10⁻¹⁶${NB}s every second (hugely exaggerated here). In 2010, atomic clocks detected the difference over just 33${NB}cm.`, 0, 'c2010'],
    ['clocks', 'Even an apple at rest is moving through time. Where time is warped, its straightest path curves downwards: for slow things like an apple, that is almost all of the falling.', 0, 'apple'],
    ['gps', `GPS satellites orbit about 20${NB}000${NB}km up. Higher in the Earth's gravitational field, their clocks run about 45 microseconds a day faster than clocks on the ground.`, 0, 'gps1'],
    ['gps', 'Their speed makes them run about 7 microseconds a day slower (the time dilation of A.5, HL): about 38 microseconds a day faster overall.', 0, 'gps2'],
    ['gps', `Without correcting this, timing errors worth more than 10${NB}km of distance would build up every day.`, 0, 'gps3'],
    ['sheet', 'A famous picture: a ball rolling round a dip in a stretched rubber sheet.'],
    ['sheet', 'Its flaw: the ball only rolls in because gravity pulls it down, so it uses gravity to explain gravity. Treat it as a rough model only.', 0, 'flaw'],
    ['evidence', 'The evidence: starlight passing the Sun is bent by twice as much as a Newton-style calculation gives. It was first measured in 1919.', 0, 'ev1'],
    ['evidence', 'Mercury\'s orbit slowly turns, by an extra 43 arcseconds per century. In 2015, gravitational waves (ripples in spacetime) were detected.', 0, 'ev2'],
    ['evidence', 'Where gravity is weak and speeds are much less than c, general relativity gives the same answers as Newton\'s law, so D.1\'s calculations stay correct.', 0, 'weak'],
  ];
  const CAPS = [], SEC = {}, KEY = {};
  let tc = 4.8;
  for (const [sec, txt, extra = 0, key] of SEQ) {
    const d = Math.max(5.2, txt.length / 16 + 0.8) + extra;
    if (key) KEY[key] = CAPS.length;
    CAPS.push([+tc.toFixed(2), +(tc + d).toFixed(2), txt]);
    if (!SEC[sec]) SEC[sec] = [tc, 0];
    SEC[sec][1] = tc + d;
    tc += d + 0.2;
  }
  const END = tc + 0.4, DURATION = END + 12;
  const cap = (k) => CAPS[KEY[k]];                                        // [start, end, text] of a named caption
  const secA = (t, k) => fade(t, SEC[k][0] - 0.4, SEC[k][1] + 0.5, 0.8, 0.8);
  const BEYOND = [cap('beyond')[0], cap('ev2')[1]];                       // the "beyond the IB course" label

  // ---------- layout ----------
  let L = null;
  function layout(s) {
    const W = s.W, H = s.H, phone = H > W;
    const capFs = Math.round(clamp(W / 44, 15, 25)), capTop = H - capFs * (phone ? 7.0 : 5.6);
    const fs = phone ? 11 : Math.round(clamp(W / 80, 11, 16));
    L = { W, H, phone, capFs, capTop, fs, top: phone ? 30 : 40 };
  }

  // ---------- small drawing helpers ----------
  const T = (s, txt, x, y, a, rgb = C.text, size = L.fs, w = 400, align = 'center') => D.text(s, txt, x, y, size, a, D.sans(size, w), rgb, align);
  const circle = (s, x, y, r, fill, a, stroke = null, lw = 1.4) => {
    const { g } = s; if (a <= 0 || !(r > 0)) return;
    g.globalCompositeOperation = 'source-over';
    g.beginPath(); g.arc(x, y, r, 0, 7);
    if (fill) { g.fillStyle = `rgba(${fill},${a})`; g.fill(); }
    if (stroke) { g.strokeStyle = `rgba(${stroke},${a})`; g.lineWidth = lw; g.stroke(); }
  };
  const apple = (s, x, y, r, a) => {
    if (a <= 0) return;
    circle(s, x, y, r, '220,60,70', a);
    circle(s, x - r * 0.3, y - r * 0.3, r * 0.3, '255,170,170', 0.5 * a);
    D.line(s, x, y - r, x + r * 0.25, y - r * 1.6, '150,110,70', a, 2);
    const { g } = s; g.fillStyle = `rgba(110,200,120,${a})`; g.beginPath(); g.ellipse(x + r * 0.55, y - r * 1.35, r * 0.45, r * 0.2, -0.5, 0, 7); g.fill();
  };
  const pill = (s, txt, x, y, a, rgb) => {
    if (a <= 0) return;
    const { g } = s, fs = L.fs; g.font = D.sans(fs, 700);
    const w = g.measureText(txt).width + fs;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(${rgb},${0.9 * a})`;
    g.beginPath(); g.roundRect(x, y - fs * 0.75, w, fs * 1.5, fs * 0.75); g.fill();
    D.text(s, txt, x + w / 2, y, fs, a, D.sans(fs, 700), '20,20,30');
  };
  // a stick figure standing with its feet at (x, y), height h; armOut: the right arm held out (holding something)
  const person = (s, x, y, h, a, rgb = '220,228,250') => {
    if (a <= 0) return [x + h * 0.33, y - h * 0.62];
    const { g } = s, hr = h * 0.11;
    g.globalCompositeOperation = 'source-over'; g.strokeStyle = `rgba(${rgb},${a})`; g.lineWidth = Math.max(2, h * 0.035); g.lineCap = 'round';
    g.beginPath(); g.arc(x, y - h + hr, hr, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(x, y - h + 2 * hr); g.lineTo(x, y - h * 0.45);                 // body
    g.moveTo(x, y - h * 0.45); g.lineTo(x - h * 0.13, y); g.moveTo(x, y - h * 0.45); g.lineTo(x + h * 0.13, y);   // legs
    g.moveTo(x, y - h * 0.72); g.lineTo(x - h * 0.16, y - h * 0.5);                         // left arm down
    g.moveTo(x, y - h * 0.72); g.lineTo(x + h * 0.3, y - h * 0.62);                         // right arm out
    g.stroke();
    return [x + h * 0.33, y - h * 0.62];                                                     // the hand
  };
  const starfield = (s, a, n = 60) => {
    const { g, W } = s, H = L.capTop;
    for (let i = 0; i < n; i++) {
      const x = ((i * 9301 + 49297) % 233280) / 233280 * W, y = ((i * 4096 + 150889) % 714025) / 714025 * H;
      g.fillStyle = `rgba(220,230,255,${a * (0.25 + 0.2 * ((i * 37) % 10) / 10)})`; g.fillRect(x, y, 1.3, 1.3);
    }
  };

  // ---------- 1. Newton: an apple and a heavier ball dropped together ----------
  function drawNewton(s, t, a) {
    if (a <= 0) return;
    const { W, capTop, fs, phone } = L;
    const gy = capTop - fs * 2.2, hpx = (gy - L.top - fs * 4) * 0.62, ppm = hpx / 2.0;     // 2.0 m drop
    const cx = W / 2, tx = cx - (phone ? W * 0.22 : W * 0.12);
    // ground and a tree
    D.line(s, 10, gy, W - 10, gy, '120,170,110', 0.8 * a, 2);
    const top = gy - hpx;
    const { g } = s;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(110,80,55,${a})`; g.fillRect(tx - 7, top - fs, 14, gy - top + fs);
    for (const [dx, dy, r] of [[0, -2.4, 2.3], [-1.9, -1.4, 1.8], [1.9, -1.4, 1.8], [2.6, -0.2, 1.5], [-2.4, -0.1, 1.4]]) circle(s, tx + dx * fs * 1.6, top + dy * fs * 1.6, r * fs * 1.6, '60,120,70', 0.85 * a);
    // the drop (repeats every 2.6 s; 0.639 s of falling)
    const c0 = SEC.newton[0] + 1.5, P = 2.6;
    const ph = t < c0 ? -1 : (t - c0) % P, hang = 0.9;
    const fall = ph < hang ? 0 : Math.min(ph - hang, T_APPLE);
    const y = top + fs * 0.6 + 0.5 * G * fall * fall * ppm;
    const landA = ph > hang + T_APPLE ? 1 - smooth((ph - hang - T_APPLE - 0.4) / 0.6) : 1;
    const twoA = smooth((t - cap('alike')[0] + 0.3) / 0.8);
    const ax = tx + fs * 4.2, bx = ax + fs * 5.5;
    const r = fs * 0.8;
    apple(s, ax, Math.min(y, gy - r), r, a * (ph < 0 ? 1 : landA) * (ph >= 0 && ph < 0.25 ? smooth(ph / 0.25) : 1));
    if (twoA > 0) circle(s, bx, Math.min(y, gy - r * 1.25), r * 1.25, '160,170,190', a * twoA * (ph < 0 ? 1 : landA), '230,235,250', 1.2);
    // forces: proportional to mass (0.20 kg and 0.60 kg): 1.96 N and 5.88 N
    const fl = fs * 2.0;
    const fA = a * fade(t, SEC.newton[0], SEC.newton[1], 0.8, 0.6);
    D.arrow(s, ax, Math.min(y, gy - r) + r, ax, Math.min(y, gy - r) + r + fl, C.force, fA * (ph < 0 ? 1 : landA), '', { head: 8, width: 2.2 });
    T(s, phone ? 'F' : 'force', ax - fs * 0.9, Math.min(y, gy - r) + r + fl * 0.6, fA * (ph < 0 ? 1 : landA), C.force, fs, 600, 'right');
    if (twoA > 0) {
      D.arrow(s, bx, Math.min(y, gy - r * 1.25) + r * 1.25, bx, Math.min(y, gy - r * 1.25) + r * 1.25 + fl * 3, C.force, fA * twoA * (ph < 0 ? 1 : landA), '', { head: 8, width: 2.2 });
      T(s, '0.20 kg', ax, top - fs * 1.4, twoA * a, C.muted, fs);
      T(s, '0.60 kg', bx, top - fs * 1.4, twoA * a, C.muted, fs);
      T(s, `a${NB}=${NB}9.8${NB}m${NB}s⁻² for both`, (ax + bx) / 2 + (phone ? 0 : fs * 6), top - fs * 3.0, twoA * a * fade(t, cap('alike')[0] + 3, SEC.newton[1], 0.8, 0.6), C.light, fs + 1, 600);
    }
    // height marker
    D.line(s, W - (phone ? 20 : W * 0.2), top + fs * 0.6, W - (phone ? 20 : W * 0.2), gy, C.muted, 0.5 * a, 1, [3, 4]);
    T(s, '2.0 m', W - (phone ? 24 : W * 0.2 + 6), (top + gy) / 2, 0.75 * a, C.muted, fs, 400, 'right');
  }

  // ---------- 2. the Moon: a hammer and a feather ----------
  function drawMoon(s, t, a) {
    if (a <= 0) return;
    const { W, capTop, fs, phone } = L, { g } = s;
    starfield(s, a);
    const gy = capTop - fs * 2.4;
    // the lunar ground, gently curved
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(120,120,128,${a})`;
    g.beginPath(); g.moveTo(0, gy + 6); g.quadraticCurveTo(W / 2, gy - 10, W, gy + 6); g.lineTo(W, capTop + 40); g.lineTo(0, capTop + 40); g.fill();
    for (let i = 0; i < 9; i++) { const x = ((i * 7919) % 97) / 97 * W, w = fs * (0.8 + (i % 3)); g.fillStyle = `rgba(90,90,98,${a})`; g.beginPath(); g.ellipse(x, gy + fs * (1.2 + (i % 2)), w, w * 0.3, 0, 0, 7); g.fill(); }
    // the Earth in the sky
    const ex = phone ? W * 0.8 : W * 0.82, ey = L.top + fs * 3;
    circle(s, ex, ey, fs * 2.2, '70,130,220', a); circle(s, ex - fs * 0.6, ey - fs * 0.4, fs * 0.9, '110,180,120', 0.7 * a);
    // the drop: 1.2 m in 1.22 s, repeating every 3.4 s
    const hpx = Math.min(capTop * 0.45, (gy - L.top) * 0.6), ppm = hpx / 1.2, rel = gy - hpx;
    const c0 = SEC.moon[0] + 1.0, P = 3.4, ph = t < c0 ? -1 : (t - c0) % P, hold = 1.2;
    const fall = ph < hold ? 0 : Math.min(ph - hold, T_MOON);
    const y = rel + 0.5 * GMOON * fall * fall * ppm;
    const fa = a * (ph > hold + T_MOON + 0.5 ? 1 - smooth((ph - hold - T_MOON - 0.5) / 0.5) : 1) * (ph >= 0 && ph < 0.3 ? smooth(ph / 0.3) : 1);
    const hx = W / 2 - fs * 3, fx = W / 2 + fs * 3;
    // hammer: a handle and a head (lands handle-down, as drawn: a picture, not a real tumble)
    const hy = Math.min(y, gy - fs * 2.2);
    g.fillStyle = `rgba(160,120,80,${fa})`; g.fillRect(hx - fs * 0.15, hy - fs * 0.2, fs * 0.3, fs * 2.2);
    g.fillStyle = `rgba(190,195,210,${fa})`; g.fillRect(hx - fs * 0.9, hy - fs * 0.6, fs * 1.8, fs * 0.7);
    // feather: a curved vane
    const fy = Math.min(y, gy - fs * 2.2);
    g.strokeStyle = `rgba(240,240,250,${fa})`; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(fx, fy + fs * 2.2); g.quadraticCurveTo(fx + fs * 0.3, fy + fs, fx, fy - fs * 0.4); g.stroke();
    g.fillStyle = `rgba(235,235,245,${0.8 * fa})`;
    g.beginPath(); g.moveTo(fx, fy - fs * 0.4); g.quadraticCurveTo(fx + fs * 1.1, fy + fs * 0.4, fx + fs * 0.15, fy + fs * 1.7); g.quadraticCurveTo(fx - fs * 0.9, fy + fs * 0.6, fx, fy - fs * 0.4); g.fill();
    T(s, 'hammer', hx, gy + fs * 1.3, 0.8 * a, C.text, fs);
    T(s, 'feather', fx, gy + fs * 1.3, 0.8 * a, C.text, fs);
    D.line(s, W / 2 - fs * 6, rel - fs * 0.6, W / 2 + fs * 6, rel - fs * 0.6, C.muted, 0.4 * a, 1, [3, 4]);
    T(s, `here, let go 1.2${NB}m up`, W / 2, rel - fs * 1.6, 0.75 * a, C.muted, fs);
    T(s, phone ? `Moon: g${NB}=${NB}1.6${NB}N${NB}kg⁻¹, no air` : `the Moon: g${NB}=${NB}1.6${NB}N${NB}kg⁻¹, no air`, phone ? 14 : 20, L.top + fs * (phone ? 0.4 : 1.2), 0.85 * a, C.text, fs + 1, 600, 'left');
    if (ph >= hold) T(s, `falling time ${Math.min(ph - hold, T_MOON).toFixed(1)}${NB}s for both`, phone ? 14 : 20, L.top + fs * (phone ? 2.0 : 2.9), 0.8 * a * fa / Math.max(a, 1e-6), C.light, fs, 400, 'left');
  }

  // ---------- 3. the lifts ----------
  function lift(s, x, yTop, w, h, a, free, t) {
    const { g } = s, { fs } = L;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(30,38,72,${0.9 * a})`; g.fillRect(x, yTop, w, h);
    g.strokeStyle = `rgba(170,182,220,${a})`; g.lineWidth = 2; g.strokeRect(x, yTop, w, h);
    if (!free) D.line(s, x + w / 2, L.top - 4, x + w / 2, yTop, '170,182,220', 0.7 * a, 2);       // the cable
    else for (let i = 0; i < 6; i++) {                                                               // the shaft rushing past, beside the lift
      const sd = i % 2 ? -1 : 1, xx = sd > 0 ? x + w + fs * (0.5 + (i >> 1) * 0.5) : x - fs * (0.5 + (i >> 1) * 0.5);
      const yy = yTop + h - ((i * 0.37 + t * 1.6) % 1) * (h + fs * 2);
      D.line(s, xx, yy, xx, yy - fs * 1.6, C.muted, 0.35 * a, 1.2);
    }
    const feet = yTop + h - 3, ph = h * 0.62;
    const hand = person(s, x + w * 0.35, feet, ph, a);
    // the apple: let go every 2.2 s; it falls to the floor in the lift that stands still, floats in the falling one
    const P = 2.2, c0 = SEC.lift[0] + 1.0, k = t < c0 ? -1 : (t - c0) % P;
    const ppm = ph / 1.75, r = fs * 0.55;
    let ay = hand[1] + r * 0.6;
    if (!free && k > 0.7) ay = Math.min(ay + 0.5 * G * (k - 0.7) ** 2 * ppm, feet - r);           // 1.0 m in 0.45 s, to scale
    // in the falling lift it stays exactly beside the hand: the apple, the person and the lift all accelerate at g
    const fa = k < 0 ? 1 : (k > P - 0.45 ? 1 - smooth((k - P + 0.45) / 0.35) : k < 0.2 ? smooth(k / 0.2) : 1);
    apple(s, hand[0] + r * 0.6, ay, r, a * fa);
    // the phone (accelerometer) on the floor
    g.fillStyle = `rgba(20,24,40,${a})`; g.strokeStyle = `rgba(200,210,240,${a})`; g.lineWidth = 1.2;
    g.beginPath(); g.roundRect(x + w * 0.66, feet - fs * 0.5, fs * 1.8, fs * 0.5, 3); g.fill(); g.stroke();
    return feet;
  }
  function drawLifts(s, t, a) {
    if (a <= 0) return;
    const { W, capTop, fs, phone } = L;
    const issA = fade(t, cap('iss')[0] - 0.2, cap('iss')[1] + 0.2, 0.8, 0.8);
    const w = phone ? W * 0.36 : Math.min(W * 0.2, (capTop - L.top) * 0.5), h = Math.min((capTop - L.top) * (phone ? 0.5 : 0.62), w * 1.5);
    const yTop = capTop - h - fs * 5.4;
    const x1 = phone ? W * 0.07 : W / 2 - w - W * 0.08, x2 = phone ? W * 0.57 : W / 2 + W * 0.08;
    const la = a * (1 - 0.75 * issA);
    const f1 = lift(s, x1, yTop, w, h, la, false, t);
    lift(s, x2, yTop, w, h, la * smooth((t - SEC.lift[0] - 0.2) / 0.8), true, t);
    T(s, phone ? 'standing still' : 'lift standing still', x1 + w / 2, yTop - fs * 1.2, 0.85 * la, C.text, fs, 600);
    T(s, phone ? 'falling freely' : 'lift falling freely', x2 + w / 2, yTop - fs * 1.2, 0.85 * la, C.text, fs, 600);
    // the floor's push on the person standing still (from under the floor up to the feet)
    const pA = la * fade(t, cap('floor')[0] - 0.4, SEC.lift[1] + 0.5, 0.8, 0.6);
    D.arrow(s, x1 + w * 0.35, f1 + fs * 2.2, x1 + w * 0.35, f1 + 2, C.force, pA, '', { head: 8, width: 2.4 });
    T(s, 'floor pushes up', x1 + w * 0.35, f1 + fs * 2.9, pA, C.force, fs - 1, 600);
    // accelerometer readings, below both lifts on one line
    const rA = la * fade(t, cap('floor')[0] - 0.4, SEC.lift[1] + 0.5, 0.8, 0.6), ry = f1 + fs * 4.5;
    T(s, phone ? 'reads 9.8 m s⁻² up' : `phone reads 9.8${NB}m${NB}s⁻² up`, x1 + w / 2, ry, rA, C.good, fs, 600);
    T(s, phone ? 'reads 0' : 'phone reads 0', x2 + w / 2, ry, rA, C.good, fs, 600);
    const fr = la * smooth((t - SEC.lift[0] - 0.2) / 0.8);
    D.arrow(s, x2 + w * 0.3, f1 + fs * 1.0, x2 + w * 0.3, f1 + fs * 3.3, C.vel, 0.85 * fr, '', { head: 7, width: 2 });
    T(s, phone ? 'a = g' : 'falling: a = g', x2 + w * 0.3 + fs * 0.7, f1 + fs * 2.2, 0.85 * fr, C.vel, fs, 600, 'left');
    // the space station inset (its orbit to scale)
    if (issA > 0) {
      const R = Math.min(W * (phone ? 0.24 : 0.14), (capTop - L.top) * 0.3), cx = W / 2, cy = L.top + R * 1.25 + fs;
      circle(s, cx, cy, R, '50,100,190', issA);
      circle(s, cx - R * 0.3, cy - R * 0.2, R * 0.35, '90,160,110', 0.6 * issA);
      const ro = R * 6780 / 6370, th = -2 * Math.PI * (t - cap('iss')[0]) / 11;              // one orbit in 11 s on screen (92.6 min real: about 500 times faster)
      D.glowLine(s, Array.from({ length: 121 }, (_, i) => [cx + ro * Math.cos(i / 60 * Math.PI), cy + ro * Math.sin(i / 60 * Math.PI)]), C.light, 0.35 * issA, 1);
      D.glowDot(s, cx + ro * Math.cos(th), cy + ro * Math.sin(th), fs * 1.2, C.light, issA);
      T(s, 'space station: orbit to scale, 400 km up', cx, cy + R + fs * 1.5, issA, C.light, fs, 600);
      T(s, 'motion about 500 times faster', cx, cy + R + fs * 4.3, 0.7 * issA, C.muted, fs - 1);
      T(s, `g there ≈ 8.7${NB}N${NB}kg⁻¹`, cx, cy + R + fs * 2.9, 0.85 * issA, C.text, fs);
    }
  }

  // ---------- 4. the globe: two walkers heading due north ----------
  const TILT = 25 * Math.PI / 180, LON = 15 * Math.PI / 180;
  const proj = (phi, lam, cx, cy, R) => {
    const x = Math.cos(phi) * Math.sin(lam), y = Math.sin(phi), z = Math.cos(phi) * Math.cos(lam);
    return [cx + R * x, cy - R * (y * Math.cos(TILT) - z * Math.sin(TILT)), y * Math.sin(TILT) + z * Math.cos(TILT)];
  };
  function drawGlobe(s, t, a) {
    if (a <= 0) return;
    const { W, capTop, fs, phone } = L;
    const R = Math.min(phone ? W * 0.4 : W * 0.24, (capTop - L.top - fs * 3) * 0.48), cx = phone ? W / 2 : W * 0.42, cy = L.top + fs * 1.6 + R;
    const { g } = s;
    const rg = g.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.1, cx, cy, R);
    rg.addColorStop(0, `rgba(60,110,200,${a})`); rg.addColorStop(1, `rgba(20,40,100,${a})`);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    // the grid: meridians every 30°, parallels every 30° (front half only)
    const seg = (pts, rgb, al, w) => { let run = []; for (const p of pts) { if (p[2] > 0) run.push(p); else { if (run.length > 1) D.glowLine(s, run, rgb, al, w); run = []; } } if (run.length > 1) D.glowLine(s, run, rgb, al, w); };
    for (let m = -180; m < 180; m += 30) seg(Array.from({ length: 61 }, (_, i) => proj(-Math.PI / 2 + i / 60 * Math.PI, m * Math.PI / 180, cx, cy, R)), '150,180,255', 0.18 * a, 0.8);
    for (const p of [-60, -30, 30, 60]) seg(Array.from({ length: 121 }, (_, i) => proj(p * Math.PI / 180, -Math.PI + i / 60 * Math.PI, cx, cy, R)), '150,180,255', 0.18 * a, 0.8);
    seg(Array.from({ length: 121 }, (_, i) => proj(0, -Math.PI + i / 60 * Math.PI, cx, cy, R)), '255,214,102', 0.6 * a, 1.2);
    const eq = proj(0, -Math.PI / 2 + 0.15, cx, cy, R);
    T(s, 'equator', cx - R * 0.62, cy + R * 0.42, 0.8 * a, C.light, fs);
    const np = proj(Math.PI / 2, 0, cx, cy, R);
    circle(s, np[0], np[1], 3, '255,255,255', a);
    T(s, 'North Pole', np[0], np[1] - fs * 1.1, 0.85 * a, C.text, fs, 600);
    // the walk: from the equator to the pole in 11 s, then 2.5 s at the pole, then again (a steady pace; no stops)
    const c0 = SEC.globe[0] + 0.6, P = 13.5, k = t < c0 ? 0 : (t - c0) % P, u = Math.min(1, k / 11);
    const phi = u * Math.PI / 2;
    const wa = a * (k > P - 0.8 ? 1 - smooth((k - P + 0.8) / 0.6) : 1);
    for (const sg of [-1, 1]) {
      const pts = Array.from({ length: 41 }, (_, i) => proj(phi * i / 40, sg * LON, cx, cy, R));
      D.glowLine(s, pts, sg < 0 ? C.pos : C.neg, 0.9 * wa, 1.8);
      const p = pts[40], st = proj(0, sg * LON, cx, cy, R);
      D.glowDot(s, p[0], p[1], fs * 0.9, sg < 0 ? C.pos : C.neg, wa);
      circle(s, st[0], st[1], 3, sg < 0 ? C.pos : C.neg, 0.7 * a);
    }
    // the gap between them: 3336 cos φ km
    const gap = GAP0 * Math.cos(phi);
    const px = phone ? W / 2 : W * 0.78, py = phone ? cy + R + fs * 2.0 : cy - fs;
    T(s, 'distance apart', px, py, 0.85 * a, C.muted, fs);
    T(s, `${Math.round(gap).toLocaleString('en-GB').replace(',', ' ')}${NB}km`, px, py + fs * 1.6, a, C.text, fs + 4, 600);
    if (!phone) T(s, 'both walk due north, never turning', px, py + fs * 3.2, 0.75 * a, C.muted, fs);
    if (u >= 1) T(s, 'they meet', np[0] + fs * 4, np[1] + fs * 0.5, wa * smooth((k - 11) / 0.4), C.good, fs, 600, 'left');
  }

  // ---------- 5. two clocks on a tower ----------
  function clockFace(s, x, y, r, secs, a, label) {
    const { fs } = L;
    circle(s, x, y, r, '18,24,48', a, '200,210,240', 1.6);
    for (let i = 0; i < 12; i++) { const th = i * Math.PI / 6; D.line(s, x + r * 0.82 * Math.sin(th), y - r * 0.82 * Math.cos(th), x + r * 0.95 * Math.sin(th), y - r * 0.95 * Math.cos(th), C.muted, 0.8 * a, 1.2); }
    const th = secs / 60 * 2 * Math.PI;
    D.line(s, x, y, x + r * 0.85 * Math.sin(th), y - r * 0.85 * Math.cos(th), C.light, a, 2);
    circle(s, x, y, 2.5, C.light, a);
    // its name and reading, to the left of the tower
    const lx = x - L.towerW / 2 - fs * 0.6;
    T(s, label, lx, y - fs * 0.7, 0.85 * a, C.text, fs, 600, 'right');
    T(s, `${secs.toFixed(1)}${NB}s`, lx, y + fs * 0.8, a, C.light, fs, 600, 'right');
  }
  function drawClocks(s, t, a) {
    if (a <= 0) return;
    const { W, capTop, fs, phone } = L, { g } = s;
    const gy = capTop - fs * 1.6, top = L.top + fs * 0.8;
    const tw = phone ? W * 0.28 : Math.min(W * 0.14, 150), tx = phone ? W * 0.37 : W * 0.32;
    L.towerW = tw;
    D.line(s, 10, gy, W - 10, gy, '120,170,110', 0.8 * a, 2);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(40,46,80,${a})`; g.fillRect(tx - tw / 2, top, tw, gy - top);
    g.strokeStyle = `rgba(170,182,220,${0.8 * a})`; g.lineWidth = 1.4; g.strokeRect(tx - tw / 2, top, tw, gy - top);
    for (let i = 1; i < 6; i++) D.line(s, tx - tw / 2, top + (gy - top) * i / 6, tx + tw / 2, top + (gy - top) * i / 6, C.muted, 0.15 * a, 1);
    const r = Math.min(tw * 0.36, (gy - top) * 0.16);
    const el = Math.max(0, t - SEC.clocks[0]);                    // seconds shown since the section began
    clockFace(s, tx, top + r * 1.4, r, el % 60, a, 'top');
    clockFace(s, tx, gy - r * 1.5, r, (el * SLOW) % 60, a, 'bottom');
    // the explanation beside the tower
    const px = phone ? W * 0.56 : W * 0.5, al = 'left';
    const lines = phone
      ? [['the lower clock', C.text], ['runs slower', C.text], ['difference hugely', C.force], ['exaggerated here', C.force], [`really 1.1${NB}×${NB}10⁻¹⁶`, C.muted], ['per metre of height', C.muted]]
      : [['the lower clock runs slower', C.text], ['difference hugely exaggerated here', C.force], [`really 1.1${NB}×${NB}10⁻¹⁶${NB}s per second, per metre`, C.muted]];
    let y = top + fs * 2;
    for (const [txt, rgb] of lines) { T(s, txt, px, y, 0.9 * a, rgb, fs, 600, al); y += fs * 1.5; }
    const a2010 = a * fade(t, cap('c2010')[0] + 3, SEC.clocks[1] + 0.5, 0.8, 0.6);
    T(s, phone ? `2010: seen over 33${NB}cm` : `2010: atomic clocks show it over just 33${NB}cm`, px, y + fs * 0.6, a2010, C.good, fs, 600, al);
    // an apple falling past the tower, repeatedly, during the last caption
    const fA = a * fade(t, cap('apple')[0] - 0.4, SEC.clocks[1] + 0.5, 0.8, 0.6);
    if (fA > 0) {
      const P = 2.0, k = (t - cap('apple')[0]) % P, hh = gy - top - fs * 2, ppm = hh / 8;
      const y2 = top + fs + Math.min(0.5 * G * Math.max(0, k - 0.3) ** 2 * ppm, hh);
      apple(s, tx + tw / 2 + fs * 2, y2, fs * 0.6, fA * (k > P - 0.4 ? 1 - smooth((k - P + 0.4) / 0.3) : 1));
    }
  }

  // ---------- 6. GPS ----------
  function drawGPS(s, t, a) {
    if (a <= 0) return;
    const { W, capTop, fs, phone } = L;
    starfield(s, a);
    const ro = Math.min(phone ? W * 0.42 : W * 0.24, (capTop - L.top - (phone ? fs * 13 : fs * 2)) * 0.48);
    const R = ro * RE / RGPS, cx = phone ? W / 2 : W * 0.3, cy = L.top + fs * 0.8 + ro;
    const el = t - SEC.gps[0];
    circle(s, cx, cy, R, '50,100,190', a); circle(s, cx - R * 0.3, cy - R * 0.25, R * 0.4, '90,160,110', 0.6 * a);
    D.glowLine(s, Array.from({ length: 145 }, (_, i) => [cx + ro * Math.cos(i / 72 * Math.PI), cy + ro * Math.sin(i / 72 * Math.PI)]), C.light, 0.3 * a, 1);
    const th = -2 * Math.PI * el / 24, ths = -2 * Math.PI * el / 48;    // satellite: 12 h; ground: 24 h (both speeded up about 1800 times)
    const sx = cx + ro * Math.cos(th), sy = cy + ro * Math.sin(th);
    D.glowDot(s, sx, sy, fs * 1.4, C.light, a);
    D.glowDot(s, cx + R * Math.cos(ths), cy + R * Math.sin(ths), fs * 0.9, C.good, a);
    T(s, 'satellite', sx, sy - fs * 1.4, 0.85 * a, C.light, fs, 600);
    T(s, phone ? 'orbit to scale; 1800 times faster' : 'orbit to scale (radius 26 600 km); motion about 1800 times faster', cx, cy + ro + fs * 1.4, 0.7 * a, C.muted, fs - 1);
    // the clock budget
    const px = phone ? 16 : W * 0.56, vx = W - (phone ? 16 : 22), py = phone ? cy + ro + fs * 4.6 : L.top + fs * 3.2, lh = fs * 1.7;
    const rows = [
      [cap('gps1')[0], 'higher in the field', 'about +45 μs a day', C.light],
      [cap('gps2')[0], 'its speed (A.5, HL)', 'about −7 μs a day', C.vel],
      [cap('gps2')[0] + 3.5, 'overall', 'about +38 μs a day', C.good],
      [cap('gps3')[0], `38${NB}μs${NB}×${NB}c`, '≈ 11 km', C.force],
    ];
    T(s, 'its clock, compared with one on the ground:', px, py - lh, 0.85 * a * smooth((t - SEC.gps[0] - 0.5) / 0.8), C.text, fs, 600, 'left');
    rows.forEach(([t0, l1, l2, rgb], i) => {
      const ra = a * smooth((t - t0 + 0.2) / 0.8);
      T(s, l1, px, py + i * lh, ra, C.muted, fs, 400, 'left');
      T(s, l2, vx, py + i * lh, ra, rgb, fs + 1, 600, 'right');
      if (i === 2) D.line(s, px, py + i * lh - lh * 0.5, vx, py + i * lh - lh * 0.5, C.muted, 0.4 * ra, 1);
    });
  }

  // ---------- 7. the rubber sheet ----------
  function drawSheet(s, t, a) {
    if (a <= 0) return;
    const { W, capTop, fs, phone } = L;
    const cx = W / 2, cy = L.top + (capTop - L.top) * 0.3, Sx = Math.min(W * 0.42, (capTop - L.top) * 0.9), Sz = Sx * 0.3, Sy = (capTop - L.top) * 0.32;
    const depth = (x, z) => -1 / Math.sqrt(x * x + z * z + 0.08) + 1 / Math.sqrt(2.08);
    const P = (x, z) => [cx + x * Sx, cy + z * Sz - depth(x, z) * Sy * 0.45];
    for (let i = -10; i <= 10; i += 2) {
      D.glowLine(s, Array.from({ length: 81 }, (_, k) => P(i / 10, -1 + k / 40)), '140,135,255', 0.45 * a, 1);
      D.glowLine(s, Array.from({ length: 81 }, (_, k) => P(-1 + k / 40, i / 10)), '140,135,255', 0.45 * a, 1);
    }
    const bottom = P(0, 0);
    circle(s, bottom[0], bottom[1] - fs * 1.2, fs * 1.6, '255,190,90', a);
    T(s, 'heavy ball', bottom[0], bottom[1] + fs * 1.4, 0.85 * a, C.text, fs, 600);
    const r0 = 0.45, th = (t - SEC.sheet[0]) * 0.9, bx = r0 * Math.cos(th), bz = r0 * Math.sin(th), b = P(bx, bz);
    circle(s, b[0], b[1] - fs * 0.6, fs * 0.6, '200,220,255', a);
    const fA = a * fade(t, cap('flaw')[0] - 0.3, SEC.sheet[1] + 0.5, 0.8, 0.6);
    D.arrow(s, b[0], b[1] + fs * 0.2, b[0], b[1] + fs * 3.2, C.pos, fA, '', { head: 8, width: 2.4 });
    T(s, phone ? 'gravity?' : 'pulled down by… gravity?', b[0] + fs * 0.8, b[1] + fs * 2.4, fA, C.pos, fs, 600, 'left');
    const wA = a * fade(t, cap('flaw')[0] + 3, SEC.sheet[1] + 0.5, 0.8, 0.6);
    T(s, 'a rough model, not a picture of spacetime', cx, capTop - fs * 1.4, Math.max(wA, 0.6 * fA), C.force, fs, 600);
  }

  // ---------- 8. the evidence: bent starlight (hugely exaggerated) ----------
  function drawEvidence(s, t, a) {
    if (a <= 0) return;
    const { W, capTop, fs, phone } = L;
    starfield(s, a);
    const cy = L.top + (capTop - L.top) * (phone ? 0.3 : 0.32), sx = W * 0.5, rS = Math.min(W, capTop) * 0.06;
    D.glowDot(s, sx, cy, rS * 3, C.light, 0.6 * a); circle(s, sx, cy, rS, '255,214,120', a);
    T(s, 'Sun', sx, cy + rS + fs * 1.1, 0.85 * a, C.text, fs, 600);
    const ex = W * 0.92, sx0 = W * 0.06, sy0 = cy - rS * 1.8;
    // the real path: straight, a kink near the Sun (exaggerated), then straight to the Earth
    const kx = sx, ky = cy - rS * 1.35;
    D.glowLine(s, [[sx0, sy0], [kx, ky], [ex, cy]], C.light, 0.9 * a, 1.6);
    // where the star seems to be: back along the arriving ray
    const dx = kx - ex, dy = ky - cy, k = (sx0 - ex) / dx;
    D.line(s, kx, ky, ex + dx * k, cy + dy * k, C.light, 0.5 * a, 1.2, [4, 5]);
    circle(s, sx0, sy0, 3, '255,255,255', a); circle(s, ex + dx * k, cy + dy * k, 3, '255,255,255', 0.45 * a);
    T(s, 'star', sx0, sy0 + fs * 1.2, 0.85 * a, C.text, fs);
    T(s, 'where it seems to be', ex + dx * k + fs * 0.5, cy + dy * k - fs * 1.2, 0.75 * a, C.muted, fs, 400, 'left');
    circle(s, ex, cy, fs * 0.5, '70,130,220', a); T(s, 'Earth', ex, cy + fs * 1.3, 0.85 * a, C.text, fs, 600);
    T(s, phone ? 'bending hugely exaggerated' : 'bending hugely exaggerated (really 1.75 arcseconds)', W / 2, cy + rS + fs * 2.8, 0.75 * a, C.force, fs);
    // the list: two columns on wide screens, one on phones
    const items = [[cap('ev1')[0], '1919: starlight bent by the Sun'], [cap('ev2')[0], 'Mercury: an extra 43″ per century'], [cap('ev2')[0] + 4, '2015: gravitational waves'], [cap('weak')[0], 'weak gravity: the same as Newton']];
    const y0 = cy + rS + fs * 4.8;
    items.forEach(([t0, txt], i) => {
      const x = phone ? W / 2 : W * (i % 2 ? 0.7 : 0.3), y = phone ? y0 + i * fs * 1.6 : y0 + (i >> 1) * fs * 1.8;
      T(s, '✓ ' + txt, x, y, a * smooth((t - t0 + 0.2) / 0.8), C.good, fs + 1, 600);
    });
  }

  // ---------- end card ----------
  function endCard(s, t) {
    const a = fade(t, END, DURATION - 0.6, 0.9, 0.8); if (a <= 0) return;
    const { g } = s, { W, H, phone } = L;
    g.fillStyle = `rgba(4,6,13,${0.9 * a})`; g.fillRect(0, 0, W, H);
    const s1 = Math.round(clamp(W / 32, 18, 36)), s2 = Math.round(clamp(W / 44, 14, 24)), s3 = Math.round(clamp(W / 60, 12, 17));
    g.font = D.sans(s1, 300);
    const head = D.wrap(s, 'What is gravity, really?', W - 48);
    let y = H * (phone ? 0.12 : 0.17);
    D.text(s, head, W / 2, y, s1, a, D.sans(s1, 300));
    y += s1 * 1.3 * head.length + s2 * 0.4;
    const items = [
      ['Everything falls alike', C.force, 'Newton: the mass cancels. Einstein: a clue that gravity is not a force on things.'],
      ['Free fall: no force', C.good, 'What you feel is the floor pushing you off your free-fall path.'],
      ['Mass curves spacetime', C.light, 'Free paths bend together; clocks lower down run slower.'],
    ];
    if (phone) {
      for (const [h, rgb, txt] of items) {
        D.text(s, h, W / 2, y, s2, a, D.sans(s2, 600), rgb); y += s2 * 1.2;
        g.font = D.sans(s3); const ls = D.wrap(s, txt, W - 40); D.text(s, ls, W / 2, y, s3, 0.85 * a, D.sans(s3)); y += s3 * 1.3 * ls.length + s2 * 0.5;
      }
    } else {
      const colW = Math.min(W * 0.28, 320); g.font = D.sans(s3);
      const wr = items.map((it) => D.wrap(s, it[2], colW));
      items.forEach(([h, rgb], i) => { const x = W / 2 + (i - 1) * W * 0.31; D.text(s, h, x, y, s2, a, D.sans(s2, 600), rgb); D.text(s, wr[i], x, y + s2 * 1.3, s3, 0.85 * a, D.sans(s3)); });
      y += s2 * 1.3 + s3 * 1.3 * Math.max(...wr.map((l) => l.length)) + s3;
    }
    g.font = D.sans(s3 - 1);
    D.text(s, D.wrap(s, 'Apart from D.1\'s F = GMm/r², general relativity is beyond the IB course. Where gravity is weak and speeds are low it agrees with Newton\'s law. Pictures marked "exaggerated" are not to scale.', Math.min(W - 40, 760)), W / 2, Math.max(y, H * 0.74), s3 - 1, 0.6 * a, D.sans(s3 - 1), C.muted);
  }

  Anim.register('gravity', {
    duration: DURATION,
    poster: cap('meet')[0] + 4,
    // score: a quiet wonder (A-flat major / F minor, a soft sine pad, a light drone, a little wind, a slow shimmer)
    music: { chords: [[40, 47, 52, 56], [37, 44, 49, 53], [39, 46, 51, 55], [44, 51, 56, 60]], bar: 9, pad: 'sine', cutoff: 760, drone: 0.08, wind: 0.25, shimmer: 0.2, tremolo: 0.08, volume: 0.4 },
    resize: layout,
    info: {
      CAPS, SEC, END,
      check() {
        return {
          tApple: T_APPLE, forces: [0.2 * G, 0.6 * G], tMoon: T_MOON, tLift: T_LIFT, gISS: G_ISS, issRatio: G_ISS / G, tISSmin: T_ISS / 60,
          gap0km: GAP0, perMetre: PER_M, per33cm: PER_33, gpsGravity: GPS_G, vGPS: V_GPS, gpsSpeed: GPS_V, gpsNet: GPS_G - GPS_V,
          gpsKm: (GPS_G - GPS_V) * 1e-6 * CL / 1000, gpsPeriodH: T_GPS / 3600, speedUp: T_GPS / 24,
          capRates: CAPS.map(([a, b, txt]) => +(txt.length / (b - a)).toFixed(1)),
        };
      },
    },
    frame(s, t) {
      if (!L || L.W !== s.W || L.H !== s.H) layout(s);
      D.background(s, 0.18);
      drawNewton(s, t, secA(t, 'newton'));
      drawMoon(s, t, secA(t, 'moon'));
      drawLifts(s, t, secA(t, 'lift'));
      drawGlobe(s, t, secA(t, 'globe'));
      drawClocks(s, t, secA(t, 'clocks'));
      drawGPS(s, t, secA(t, 'gps'));
      drawSheet(s, t, secA(t, 'sheet'));
      drawEvidence(s, t, secA(t, 'evidence'));
      pill(s, L.phone ? 'Beyond the course' : 'Beyond the IB course', L.phone ? 8 : 12, L.phone ? 14 : 20, fade(t, BEYOND[0], BEYOND[1], 0.8, 0.8), '170,182,220');
      D.captions(s, t, CAPS);
      if (t < 4.6) { s.g.fillStyle = `rgba(4,6,13,${0.82 * fade(t, 0, 4.4, 0.1, 0.8)})`; s.g.fillRect(0, 0, s.W, s.H); }
      D.title(s, t, 0.4, 4.4, 'What is gravity, really?', 'Is it a force at all?');
      endCard(s, t);
      D.vignette(s, t, DURATION);
    },
  });
})();
