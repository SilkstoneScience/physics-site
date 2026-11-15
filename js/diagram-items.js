/* Equipment bank for the experimental diagram maker (experimental/diagram-maker.html).
   Plan and decisions: docs/DIAGRAM_MAKER_PLAN.md.

   HOW TO ADD AN ITEM: add one `add({...})` block in the right group below.
   - id:       permanent (saved diagrams refer to it): never rename one.
   - name, group, keywords (other names the search box should find).
   - w, h:     natural size in page units (about 1 unit = 2 mm; small things drawn a little larger).
   - stretch:  'w' or 'h' if the item can be made longer that way without squashing it (the drawing
               is redrawn at the new length, e.g. a longer rule); 'both' if its width and height change
               separately (e.g. lagging to fit round something); leave out otherwise.
   - anchors:  (w, h, opt) => ({ name: [x, y] }) attachment points for strings, wires and tubes.
   - options:  choices shown in the side panel, e.g. { key: 'water', label: 'Water level', type: 'range', min: 0, max: 0.9, step: 0.05, def: 0.6 }
               (type 'range', 'int' or 'choice' with values: [[value, label], ...]).
   - draw:     (w, h, opt) => SVG markup, drawn in the box 0..w × 0..h. No ids or <defs>.
   Drawing classes (styles in css/diagram-maker.css, recoloured black on white for the PNG):
     o = outline, h = hairline (with o), b = bold line (with o), f = solid body (page colour),
     m = metal grey, k = solid black, g = glass tint, w = water, t = text. */
(function () {
  'use strict';

  const groups = [
    { id: 'stands', name: 'Stands, clamps and bosses' },
    { id: 'measuring', name: 'Measuring instruments' },
    { id: 'mechanics', name: 'Mechanics' },
    { id: 'thermal', name: 'Thermal physics and gases' },
    { id: 'glassware', name: 'Glassware and containers' },
    { id: 'optics', name: 'Waves and optics' },
    { id: 'electrical', name: 'Electricity and magnetism' },
    { id: 'symbols', name: 'Circuit symbols' },
    { id: 'nuclear', name: 'Nuclear physics' },
    { id: 'sensors', name: 'Sensors and dataloggers' }
  ];
  const items = [];
  const add = (it) => items.push(it);

  // ---------- small helpers ----------
  const n = (v) => Math.round(v * 100) / 100;                     // tidy numbers in the markup
  const pts = (list) => list.map(([x, y]) => n(x) + ',' + n(y)).join(' ');
  const line = (x1, y1, x2, y2, cls = 'o') => `<line class="${cls}" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`;
  const rect = (x, y, w, h, cls = 'o f', rx = 0) => `<rect class="${cls}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${rx ? ` rx="${rx}"` : ''}/>`;
  const circle = (cx, cy, r, cls = 'o f') => `<circle class="${cls}" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>`;
  const path = (d, cls = 'o f') => `<path class="${cls}" d="${d}"/>`;
  // Text inside a drawing. When the item is flipped, the text is flipped back so it still reads normally.
  let mirror = false;
  const text = (x, y, s, size = 12, anchor = 'middle') =>
    `<text class="t" x="${n(x)}" y="${n(y)}" font-size="${size}" text-anchor="${anchor}" dominant-baseline="central"` +
    (mirror ? ` transform="matrix(-1 0 0 1 ${n(2 * x)} 0)"` : '') + `>${s}</text>`;

  // Circuit symbols share one size, with terminals at the middle of each end.
  const SYM_W = 80, SYM_H = 40, MID = 20;
  const ends = () => ({ a: [0, MID], b: [SYM_W, MID] });

  // =====================================================================
  // Stands, clamps and bosses
  // =====================================================================
  add({
    id: 'retort-stand', name: 'Retort stand', group: 'stands',
    keywords: ['clamp stand', 'stand', 'rod', 'base'],
    w: 120, h: 330, stretch: 'h',
    anchors: () => ({ top: [27, 0] }),
    draw: (w, h) =>
      rect(24, 0, 6, h - 14, 'o f', 2) +
      path(`M0 ${h} V${h - 9} L6 ${h - 14} H${w - 6} L${w} ${h - 9} V${h} Z`)
  });

  add({
    id: 'boss', name: 'Boss (clamp holder)', group: 'stands',
    keywords: ['boss head', 'bosshead', 'clamp holder', 'double clamp'],
    w: 44, h: 30,
    anchors: () => ({ centre: [20, 15] }),
    draw: () =>
      rect(34, 12, 4, 6, 'o m') +                          // screw thread
      rect(38, 7, 6, 16, 'o f', 2) +                        // thumbscrew knob
      rect(8, 3, 26, 24, 'o m', 2) +                        // body
      circle(21, 15, 5.5, 'o f') + line(18, 12, 24, 18, 'o h')   // front screw, seen end-on
  });

  add({
    id: 'clamp', name: 'Clamp', group: 'stands',
    keywords: ['retort clamp', 'jaws', 'burette clamp', 'test tube clamp'],
    w: 150, h: 44,
    anchors: () => ({ grip: [140, 22], end: [2, 22] }),
    draw: () =>
      rect(0, 19.5, 96, 5, 'o f', 2) +                                   // arm (goes into a boss)
      line(120, 6, 120, 39, 'o') + path('M114 39 H126 L124 44 H116 Z') +  // tightening screw and wing nut
      path('M90 15 H112 C128 15 140 11 146 3 L150 6 C143 16 130 20.5 112 20.5 H90 Z') +
      path('M90 29 H112 C128 29 140 33 146 41 L150 38 C143 28 130 23.5 112 23.5 H90 Z')
  });

  add({
    id: 'bench', name: 'Bench surface (or floor, wall, ceiling)', group: 'stands',
    keywords: ['bench', 'table', 'floor', 'ground', 'wall', 'ceiling', 'surface', 'hatched'],
    w: 600, h: 18, stretch: 'w',
    anchors: (w) => ({ left: [0, 2], right: [w, 2] }),
    draw: (w) => {
      let s = line(0, 2, w, 2, 'o b');
      for (let x = 14; x <= w + 0.1; x += 12) s += line(x, 2, x - 12, 16, 'o h');
      return s;
    }
  });

  add({
    id: 'g-clamp', name: 'G-clamp', group: 'stands',
    keywords: ['g clamp', 'c clamp', 'bench clamp'],
    w: 50, h: 78,
    anchors: () => ({ grip: [34, 20] }),
    draw: () =>
      rect(32.5, 30, 3, 44, 'o m') + rect(26, 72, 16, 4, 'o f', 1.5) + rect(28, 27, 12, 4, 'o f', 1) +   // screw, handle, pad
      path('M42 4 H9 Q2 4 2 11 V59 Q2 66 9 66 H42 V58 H10 V12 H42 Z')                                    // frame
  });

  add({
    id: 'tripod', name: 'Tripod', group: 'stands',
    keywords: ['tripod', 'stand for heating'],
    w: 90, h: 100,
    anchors: () => ({ top: [45, 0] }),
    draw: () =>
      path('M42 6 L43 100 M48 6 L47 100', 'o h') +                      // the leg at the back
      path('M8 6 L1 100 M14 6 L7 100 M76 6 L83 100 M82 6 L89 100') +   // the two legs at the front
      rect(0, 0, 90, 6, 'o f', 1.5)
  });

  add({
    id: 'gauze', name: 'Gauze', group: 'stands',
    keywords: ['gauze', 'wire gauze', 'mesh', 'heatproof'],
    w: 100, h: 8,
    anchors: () => ({ top: [50, 1] }),
    draw: () => rect(0, 2, 100, 4, 'o f') + rect(30, 1, 40, 6, 'o m', 1)
  });

  add({
    id: 'lab-jack', name: 'Lab jack (scissor lift)', group: 'stands',
    keywords: ['lab jack', 'scissor jack', 'lift', 'laboratory jack', 'platform'],
    w: 100, h: 60, stretch: 'h',
    anchors: () => ({ top: [45, 0] }),
    draw: (w, h) =>
      path(`M10 6 L80 ${h - 6} M80 6 L10 ${h - 6}`, 'o b') +
      line(45, h / 2, 96, h / 2) + circle(96, h / 2, 4) + circle(45, h / 2, 3, 'o f') +
      rect(0, 0, 90, 6, 'o f', 1.5) + rect(0, h - 6, 90, 6, 'o f', 1.5)
  });

  // =====================================================================
  // Measuring instruments
  // =====================================================================
  add({
    id: 'metre-rule', name: 'Metre rule', group: 'measuring',
    keywords: ['ruler', 'half-metre rule', 'meter stick', 'metre stick', 'scale', 'length'],
    w: 500, h: 18, stretch: 'w',
    anchors: (w) => ({ left: [0, 9], right: [w, 9] }),
    draw: (w) => {
      let s = rect(0, 0, w, 18, 'o f');
      const cm = 5;                                         // 1 cm = 5 units
      for (let i = 1; i * cm < w - 0.5; i++) {
        const x = i * cm, len = i % 10 === 0 ? 8 : i % 5 === 0 ? 6 : 3.5;
        s += line(x, 0, x, len, 'o h');
        if (i % 10 === 0 && x < w - 6) s += text(x, 13, String(i), 6.5);
      }
      return s;
    }
  });

  add({
    id: 'top-pan-balance', name: 'Top-pan balance', group: 'measuring',
    keywords: ['balance', 'electronic balance', 'scales', 'mass', 'digital balance'],
    w: 120, h: 56,
    anchors: () => ({ pan: [60, 8] }),
    draw: () =>
      rect(56, 12, 8, 10, 'o f') +                                    // pan stem
      rect(18, 8, 84, 4, 'o f', 1.5) +                                 // pan
      path('M4 56 L10 22 H110 L116 56 Z') +                            // body
      rect(28, 31, 46, 16, 'o f', 2) + text(51, 39.5, '0.00 g', 10) +  // display
      circle(87, 39, 3, 'o f') + circle(99, 39, 3, 'o f')              // buttons
  });

  add({
    id: 'vernier-calipers', name: 'Vernier calipers', group: 'measuring',
    keywords: ['calipers', 'callipers', 'vernier', 'diameter'],
    w: 150, h: 48,
    anchors: () => ({ jaws: [20, 40] }),
    draw: () => {
      let s = rect(0, 10, 150, 10, 'o f') + rect(0, 10, 10, 36, 'o f') + rect(2, 0, 6, 10, 'o f');   // beam and fixed jaws
      for (let x = 66; x < 148; x += 4) s += line(x, 10, x, x % 20 === 6 ? 16 : 13.5, 'o h');
      s += rect(30, 6, 32, 18, 'o f', 1.5) + rect(30, 18, 10, 28, 'o f') + rect(32, 0, 6, 6, 'o f') +   // sliding jaw
        rect(48, 2, 8, 4, 'o m');                                                                        // thumb grip
      for (let x = 42; x < 61; x += 3) s += line(x, 24, x, 20.5, 'o h');
      return s;
    }
  });

  add({
    id: 'micrometer', name: 'Micrometer screw gauge', group: 'measuring',
    keywords: ['micrometer', 'screw gauge', 'wire diameter', 'thickness'],
    w: 120, h: 54,
    anchors: () => ({ jaws: [18, 14] }),
    draw: () => {
      let s = path('M4 10 V30 Q4 52 30 52 H52 Q62 52 62 40 V20 H54 V38 Q54 44 48 44 H30 Q12 44 12 30 V10 Z') +   // frame
        rect(6, 9, 8, 10, 'o m') + rect(22, 11, 40, 6, 'o m') +                                                   // anvil and spindle
        rect(62, 8, 30, 12, 'o f') + line(62, 14, 92, 14, 'o h');                                                   // sleeve
      for (let x = 65; x < 92; x += 3) s += line(x, 14, x, x % 6 === 5 ? 10 : 12, 'o h');
      s += rect(92, 5, 20, 18, 'o f', 2);
      for (let x = 96; x < 112; x += 4) s += line(x, 5, x, 23, 'o h');
      return s + rect(112, 9, 8, 10, 'o f', 1.5);
    }
  });

  add({
    id: 'protractor', name: 'Protractor', group: 'measuring',
    keywords: ['protractor', 'angle', 'degrees'],
    w: 120, h: 62,
    anchors: () => ({ centre: [60, 60] }),
    draw: () => {
      let s = path('M0 60 A60 60 0 0 1 120 60 Z') + path('M15 60 A45 45 0 0 1 105 60', 'o h');
      for (let a = 10; a < 180; a += 10) {
        const c = Math.cos(a * Math.PI / 180), sn = Math.sin(a * Math.PI / 180), r1 = a % 30 === 0 ? 48 : 53;
        s += line(60 + r1 * c, 60 - r1 * sn, 60 + 59 * c, 60 - 59 * sn, 'o h');
      }
      return s + line(60, 55, 60, 60, 'o h');
    }
  });

  add({
    id: 'stopwatch', name: 'Digital stopwatch', group: 'measuring',
    keywords: ['stopwatch', 'stop clock', 'timer', 'time', 'stopclock'],
    w: 60, h: 80,
    draw: () =>
      rect(25, 2, 10, 8, 'o f', 1.5) + rect(0, 10, 60, 70, 'o f', 14) +
      rect(9, 28, 42, 20, 'o f', 2) + text(30, 38.5, '0:00.0', 10) +
      circle(18, 62, 5) + circle(42, 62, 5)
  });

  add({
    id: 'newtonmeter', name: 'Newtonmeter (spring balance)', group: 'measuring',
    keywords: ['newtonmeter', 'newton meter', 'spring balance', 'force meter', 'forcemeter'],
    w: 24, h: 150,
    options: [{ key: 'range', label: 'Scale', type: 'choice', values: [['10', '0–10 N'], ['100', '0–100 N']], def: '10' }],
    anchors: () => ({ top: [12, 2], hook: [12, 148] }),
    draw: (w, h, opt) => {
      let s = circle(12, 6, 4, 'o') + rect(4, 12, 16, 114, 'o f', 3);
      for (let i = 0; i <= 10; i++) { const y = 30 + i * 8.6; s += line(i % 5 ? 16.5 : 14, y, 20, y, 'o h'); }
      return s + path('M4 52 L10 55 L4 58 Z', 'o k') + text(12, 20, opt.range + ' N', 5) +
        line(12, 126, 12, 140) + path('M12 140 V144 A4 4 0 1 1 7 141', 'o');
    }
  });

  add({
    id: 'fiducial-marker', name: 'Pointer (fiducial marker)', group: 'measuring',
    keywords: ['pointer', 'fiducial', 'marker', 'pin', 'reference mark'],
    w: 50, h: 72,
    anchors: () => ({ tip: [49, 10] }),
    draw: () =>
      rect(18, 12, 4, 54) + rect(0, 66, 40, 6, 'o f', 1.5) +
      path('M18 8 H40 L49 10 L40 12 H18 Z')
  });

  // =====================================================================
  // Mechanics
  // =====================================================================
  add({
    id: 'slotted-masses', name: 'Slotted-mass hanger with slotted masses', group: 'mechanics',
    keywords: ['mass hanger', 'hanger', 'slotted mass', 'weights', 'masses', 'load'],
    w: 36, h: 92,
    options: [{ key: 'n', label: 'Slotted masses', type: 'int', min: 0, max: 5, def: 2 }],
    anchors: () => ({ hook: [23, 5] }),
    draw: (w, h, opt) => {
      let s = path('M18 84 V10 A5 5 0 1 1 28 10 Q28 13 26 14', 'o b') +   // rod and hook
              rect(2, 84, 32, 6, 'o f', 1);                              // base
      for (let i = 0; i < opt.n; i++) s += rect(2, 84 - 7 * (i + 1), 32, 7, 'o m', 1);
      return s;
    }
  });

  add({
    id: 'spring', name: 'Helical spring', group: 'mechanics',
    keywords: ['spring', 'coil spring', 'hooke', 'extension'],
    w: 22, h: 120, stretch: 'h',
    options: [{ key: 'coils', label: 'Coils', type: 'int', min: 4, max: 30, def: 12 }],
    anchors: (w, h) => ({ top: [11, 1], bottom: [11, h - 1] }),
    draw: (w, h, opt) => {
      // Coils drawn as a looped curve (a prolate cycloid). Stretching keeps the number of coils
      // and spreads them out, as a real spring does.
      const cx = 11, R = 8, b = 3.2, y0 = 16, len = Math.max(4, h - 32 - 2 * b);
      const turns = opt.coils;
      const a = len / (2 * Math.PI * turns);
      const p = [];
      for (let i = 0; i <= turns * 24; i++) {
        const t = (i / 24) * 2 * Math.PI;
        p.push([cx + R * Math.sin(t), y0 + a * t + b * (1 - Math.cos(t))]);
      }
      const yEnd = y0 + a * 2 * Math.PI * turns;
      return `<polyline class="o" points="${pts(p)}"/>` +
        circle(cx, 5.5, 4.5, 'o') + line(cx, 10, cx, y0) +
        line(cx, yEnd, cx, h - 10) + circle(cx, h - 5.5, 4.5, 'o');
    }
  });

  add({
    id: 'bench-pulley', name: 'Bench pulley', group: 'mechanics',
    keywords: ['pulley', 'clamp pulley', 'wheel'],
    w: 70, h: 84,
    anchors: () => ({ top: [50, 2], right: [64, 16], left: [36, 16] }),
    draw: () =>
      path('M17 47 L46 12 L54 19 L25 52 Z') +                         // arm
      path('M0 44 H28 V72 H0 V65 H21 V51 H0 Z') +                       // clamp (the bench edge fits in the gap)
      line(11, 65, 11, 79) + rect(5, 78, 12, 5, 'o f', 1.5) +          // screw
      circle(50, 16, 14) + circle(50, 16, 10.5, 'o h') + circle(50, 16, 2.5, 'o k')
  });

  add({
    id: 'pendulum-bob', name: 'Pendulum bob', group: 'mechanics',
    keywords: ['bob', 'pendulum', 'ball', 'mass on a string'],
    w: 24, h: 30,
    anchors: () => ({ top: [12, 0], centre: [12, 18] }),
    draw: () => line(12, 0, 12, 7) + circle(12, 18.5, 11, 'o m')
  });

  add({
    id: 'hooked-mass', name: 'Hooked mass', group: 'mechanics',
    keywords: ['hooked mass', 'mass', 'weight', 'load', 'slotted'],
    w: 34, h: 50,
    anchors: () => ({ hook: [17, 2] }),
    draw: () =>
      path('M17 16 V8 A4 4 0 1 1 22 5', 'o b') +
      rect(4, 14, 26, 36, 'o m', 3) + line(4, 20, 30, 20, 'o h')
  });

  add({
    id: 'trolley', name: 'Trolley (dynamics cart)', group: 'mechanics',
    keywords: ['trolley', 'cart', 'dynamics cart', 'car', 'glider'],
    w: 132, h: 50,
    anchors: () => ({ front: [132, 19], back: [0, 20], top: [60, 8] }),
    draw: () =>
      rect(120, 16, 12, 6, 'o m', 1) + rect(0, 8, 120, 26, 'o f', 3) + line(6, 14, 114, 14, 'o h') +
      circle(24, 41, 9) + circle(24, 41, 2.2, 'k') + circle(96, 41, 9) + circle(96, 41, 2.2, 'k')
  });

  add({
    id: 'runway', name: 'Runway (track)', group: 'mechanics',
    keywords: ['runway', 'track', 'ramp', 'plank', 'inclined plane', 'slope', 'dynamics track'],
    w: 400, h: 10, stretch: 'w',
    anchors: (w) => ({ left: [0, 0], right: [w, 0] }),
    draw: (w) => rect(0, 0, w, 10, 'o f', 1.5) + line(4, 3.5, w - 4, 3.5, 'o h')
  });

  add({
    id: 'wedge', name: 'Wedge (block to raise a runway)', group: 'mechanics',
    keywords: ['wedge', 'block', 'raise', 'incline', 'ramp support'],
    w: 60, h: 24,
    draw: () => path('M0 24 H60 V0 Z')
  });

  add({
    id: 'wooden-block', name: 'Wooden block', group: 'mechanics',
    keywords: ['block', 'wooden block', 'friction', 'sledge'],
    w: 90, h: 40,
    anchors: () => ({ hook: [90, 20], top: [40, 0] }),
    draw: () =>
      rect(80, 19, 4, 2, 'o m') + circle(86.5, 20, 3.5, 'o') + rect(0, 0, 80, 40, 'o f', 1.5) +
      path('M8 12 Q30 8 50 13 T74 12 M10 26 Q34 22 52 28 T72 26', 'o h')
  });

  add({
    id: 'ball', name: 'Ball', group: 'mechanics',
    keywords: ['ball', 'sphere', 'ball bearing', 'marble', 'steel ball'],
    w: 24, h: 24,
    options: [{ key: 'look', label: 'Look', type: 'choice', values: [['plain', 'Plain'], ['steel', 'Steel (ball bearing)']], def: 'plain' }],
    anchors: () => ({ top: [12, 0], centre: [12, 12] }),
    draw: (w, h, opt) => opt.look === 'steel'
      ? circle(12, 12, 11, 'o m') + circle(8, 8, 3, 'f')
      : circle(12, 12, 11)
  });

  add({
    id: 'pivot', name: 'Pivot (knife edge)', group: 'mechanics',
    keywords: ['pivot', 'knife edge', 'fulcrum', 'balance point', 'moments'],
    w: 40, h: 40,
    anchors: () => ({ top: [20, 0] }),
    draw: () => path('M0 40 H40 L20 0 Z')
  });

  add({
    id: 'interrupt-card', name: 'Interrupt card (flag)', group: 'mechanics',
    keywords: ['card', 'flag', 'interrupt card', 'light gate', 'mask'],
    w: 40, h: 28,
    anchors: () => ({ bottom: [20, 28] }),
    draw: () => rect(14, 20, 12, 8, 'o f', 1) + rect(2, 0, 36, 22, 'o k', 1)
  });

  // =====================================================================
  // Thermal physics and gases
  // =====================================================================
  add({
    id: 'thermometer', name: 'Liquid-in-glass thermometer', group: 'thermal',
    keywords: ['thermometer', 'temperature', 'alcohol thermometer', 'mercury'],
    w: 14, h: 164,
    anchors: () => ({ top: [7, 0], bulb: [7, 157] }),
    draw: () => {
      let s = path('M3 4 A4 4 0 0 1 11 4 V151 A7 7 0 1 1 3 151 Z', 'o g') +
              circle(7, 156.7, 4.6, 'k') + rect(6, 62, 2, 92, 'k');
      for (let y = 20; y <= 140; y += 10) s += line(9, y, 11, y, 'o h');
      return s;
    }
  });

  add({
    id: 'bunsen-burner', name: 'Bunsen burner', group: 'thermal',
    keywords: ['bunsen', 'burner', 'flame', 'gas', 'heat'],
    w: 56, h: 100,
    options: [{ key: 'flame', label: 'Flame', type: 'choice', values: [['on', 'Lit'], ['off', 'Not lit']], def: 'on' }],
    anchors: () => ({ top: [28, 22], gas: [54, 84] }),
    draw: (w, h, opt) =>
      (opt.flame === 'on' ? path('M28 0 C37 9 36 20 28 21 C20 20 19 9 28 0 Z', 'o') + path('M28 8 C32 12 31 18 28 19 C25 18 24 12 28 8 Z', 'o h') : '') +
      rect(36, 81, 18, 6, 'o f', 1) + rect(22, 22, 12, 68) + rect(20, 70, 16, 8, 'o m', 1) +
      path('M2 100 H54 L48 90 H8 Z')
  });

  add({
    id: 'hot-plate', name: 'Electric hot plate', group: 'thermal',
    keywords: ['hot plate', 'hotplate', 'heater', 'heat'],
    w: 100, h: 40,
    anchors: () => ({ top: [50, 4] }),
    draw: () => rect(10, 4, 80, 6, 'o m', 1) + rect(0, 10, 100, 30, 'o f', 3) + circle(80, 25, 5) + line(80, 25, 80, 21) + circle(20, 25, 2, 'k')
  });

  add({
    id: 'immersion-heater', name: 'Immersion heater', group: 'thermal',
    keywords: ['immersion heater', 'heater', 'heating element', 'electrical heater'],
    w: 30, h: 130,
    anchors: () => ({ a: [2, 0], b: [28, 0] }),
    draw: () =>
      path('M11 24 C11 12 2 12 2 0 M19 24 C19 12 28 12 28 0', 'o') +   // its two leads
      path('M11 40 V122 Q11 128 15 128 Q19 128 19 122 V40 Z', 'o m') + rect(6, 24, 18, 16, 'o f', 2)
  });

  add({
    id: 'metal-block', name: 'Metal block (two holes)', group: 'thermal',
    keywords: ['metal block', 'aluminium block', 'block', 'specific heat capacity', 'cylinder'],
    w: 80, h: 90,
    anchors: () => ({ hole1: [24, 0], hole2: [55, 0] }),
    draw: () => rect(0, 0, 80, 90, 'o m', 2) + rect(17, 0, 14, 62, 'o f') + rect(49, 0, 12, 50, 'o f')
  });

  add({
    id: 'polystyrene-cup', name: 'Polystyrene cup with lid', group: 'thermal',
    keywords: ['polystyrene cup', 'cup', 'calorimeter', 'insulated cup', 'lid'],
    w: 66, h: 76,
    anchors: () => ({ top: [33, 0] }),
    draw: () => path('M3 6 H63 L55 76 H11 Z') + rect(0, 0, 66, 6, 'o f', 2) + rect(30, 0, 6, 6, 'o k')
  });

  add({
    id: 'lagging', name: 'Insulation (lagging)', group: 'thermal',
    keywords: ['insulation', 'lagging', 'insulating', 'cotton wool', 'jacket'],
    w: 100, h: 100, stretch: 'both',
    draw: (w, h) => {
      // Seen in section: two hatched walls, 10 thick, either side of whatever it wraps
      let s = rect(0, 0, 10, h, 'o f') + rect(w - 10, 0, 10, h, 'o f');
      for (let y = 6; y < h; y += 7) s += line(0, y, 10, y - 6, 'o h') + line(w - 10, y, w, y - 6, 'o h');
      return s;
    }
  });

  add({
    id: 'ice', name: 'Ice', group: 'thermal',
    keywords: ['ice', 'ice cubes', 'crushed ice', 'melting'],
    w: 60, h: 34,
    draw: () =>
      path('M2 14 L20 10 L24 30 L5 33 Z', 'o g') + path('M22 6 L40 2 L43 20 L25 24 Z', 'o g') + path('M38 16 L56 14 L58 32 L40 33 Z', 'o g')
  });

  add({
    id: 'gas-syringe', name: 'Gas syringe', group: 'thermal',
    keywords: ['syringe', 'gas syringe', 'boyle', 'volume', 'plunger', 'piston'],
    w: 136, h: 24,
    options: [{ key: 'pos', label: 'Plunger position', type: 'range', min: 0.05, max: 0.95, step: 0.05, def: 0.5 }],
    anchors: () => ({ nozzle: [4, 12] }),
    draw: (w, h, opt) => {
      const px = 20 + 100 * opt.pos;
      let s = rect(4, 9.5, 6, 5, 'o f') + rect(10, 7, 10, 10, 'o f') + rect(20, 2, 100, 20, 'o g');
      for (let x = 30; x < 120; x += 10) s += line(x, 2, x, x % 50 === 20 ? 9 : 6, 'o h');
      return s + rect(px + 6, 10.5, 130 - px - 6, 3, 'o m') + rect(px, 3, 6, 18, 'o k') + rect(130, 0, 5, 24, 'o f', 1);
    }
  });

  add({
    id: 'pressure-gauge', name: 'Pressure gauge (dial)', group: 'thermal',
    keywords: ['pressure gauge', 'bourdon gauge', 'gauge', 'manometer', 'dial', 'pressure'],
    w: 60, h: 72,
    anchors: () => ({ bottom: [30, 72] }),
    draw: () => {
      let s = rect(25, 56, 10, 16, 'o m') + circle(30, 30, 28) + circle(30, 30, 24, 'o h');
      for (let a = -225; a <= 45; a += 27) {
        const c = Math.cos(a * Math.PI / 180), sn = Math.sin(a * Math.PI / 180);
        s += line(30 + 19 * c, 30 + 19 * sn, 30 + 23 * c, 30 + 23 * sn, 'o h');
      }
      return s + line(30, 30, 18, 18) + circle(30, 30, 2.5, 'k') + text(30, 44, 'kPa', 7);
    }
  });

  add({
    id: 'viscosity-tube', name: 'Tall tube of liquid (falling ball)', group: 'thermal',
    keywords: ['viscosity', 'tube', 'glycerol', 'oil', 'falling ball', 'terminal velocity', 'stokes', 'measuring tube'],
    w: 46, h: 260, stretch: 'h',
    anchors: (w, h) => ({ top: [23, 0] }),
    draw: (w, h) =>
      path(`M3 14 V${h - 6} Q3 ${h} 9 ${h} H37 Q43 ${h} 43 ${h - 6} V14 Z`, 'w') + line(3, 14, 43, 14, 'o h') +
      path(`M3 0 V${h - 6} Q3 ${h} 9 ${h} H37 Q43 ${h} 43 ${h - 6} V0`, 'o') +
      rect(0, h * 0.28, 46, 3, 'o k') + rect(0, h * 0.78, 46, 3, 'o k')
  });

  // =====================================================================
  // Glassware and containers
  // =====================================================================
  add({
    id: 'beaker', name: 'Beaker', group: 'glassware',
    keywords: ['beaker', 'container', 'water', 'glass'],
    w: 60, h: 72,
    options: [{ key: 'water', label: 'Water level', type: 'range', min: 0, max: 0.9, step: 0.05, def: 0.6 }],
    anchors: (w, h) => ({ top: [w / 2, 0], bottom: [w / 2, h - 1] }),
    draw: (w, h, opt) => {
      const L = 5, R = w - 5, B = h - 1, T = 4;
      const inside = `M${L} ${T} V${B - 4} Q${L} ${B} ${L + 4} ${B} H${R - 4} Q${R} ${B} ${R} ${B - 4} V${T}`;
      let s = '';
      if (opt.water > 0) {
        const yw = B - opt.water * (B - T - 2);
        s += path(`M${L} ${n(yw)} V${B - 4} Q${L} ${B} ${L + 4} ${B} H${R - 4} Q${R} ${B} ${R} ${B - 4} V${n(yw)} Z`, 'w') +
             line(L, yw, R, yw, 'o h');
      }
      for (let i = 1; i <= 4; i++) { const y = B - i * (B - T) / 5; s += line(L, y, L + (i % 2 ? 6 : 10), y, 'o h'); }
      return s + path(`M${L - 3} 0 L${L} ${T} ${inside.slice(inside.indexOf('V'))} L${R + 3} 0`, 'o');
    }
  });

  add({
    id: 'conical-flask', name: 'Conical flask', group: 'glassware',
    keywords: ['conical flask', 'erlenmeyer', 'flask'],
    w: 60, h: 70,
    options: [{ key: 'water', label: 'Water level', type: 'range', min: 0, max: 0.9, step: 0.05, def: 0.4 }],
    anchors: () => ({ top: [30, 0], bottom: [30, 69] }),
    draw: (w, h, opt) => {
      // The sloping side runs from (22, 22) to (2, 64); water fills up to yw
      const xl = (y) => (y <= 22 ? 22 : 22 - (y - 22) * 20 / 42);
      let s = '';
      if (opt.water > 0) {
        const yw = 69 - opt.water * 47;
        s += path(`M${n(xl(yw))} ${n(yw)} ${yw < 64 ? 'L2 64 ' : ''}Q1 69 7 69 H53 Q59 69 58 64 L${n(60 - xl(yw))} ${n(yw)} Z`, 'w') +
          line(xl(yw), yw, 60 - xl(yw), yw, 'o h');
      }
      return s + path('M20 0 L22 3 V22 L2 64 Q0 70 7 70 H53 Q60 70 58 64 L38 22 V3 L40 0', 'o');
    }
  });

  add({
    id: 'round-flask', name: 'Round-bottom flask with bung and tube', group: 'glassware',
    keywords: ['round-bottom flask', 'round flask', 'flask', 'bung', 'stopper', 'air in a flask', 'gas'],
    w: 70, h: 90,
    options: [{ key: 'water', label: 'Water level', type: 'range', min: 0, max: 0.9, step: 0.05, def: 0 }],
    anchors: () => ({ tube: [35, 0] }),
    draw: (w, h, opt) => {
      const cx = 35, cy = 58, r = 30;
      let s = '';
      if (opt.water > 0) {
        const yw = cy + r - opt.water * 2 * r * 0.9, hw = Math.sqrt(Math.max(0, r * r - (yw - cy) * (yw - cy)));
        s += path(`M${n(cx - hw)} ${n(yw)} A${r} ${r} 0 ${yw < cy ? 1 : 0} 0 ${n(cx + hw)} ${n(yw)} Z`, 'w') + line(cx - hw, yw, cx + hw, yw, 'o h');
      }
      return s + path(`M29 12 V${n(cy - Math.sqrt(r * r - 36))} A${r} ${r} 0 1 0 41 ${n(cy - Math.sqrt(r * r - 36))} V12`, 'o') +
        rect(33, 0, 4, 40, 'o g') + path('M27 22 H43 L41 8 H29 Z', 'o m');
    }
  });

  add({
    id: 'measuring-cylinder', name: 'Measuring cylinder', group: 'glassware',
    keywords: ['measuring cylinder', 'graduated cylinder', 'volume', 'cylinder'],
    w: 40, h: 150,
    options: [{ key: 'water', label: 'Water level', type: 'range', min: 0, max: 0.95, step: 0.05, def: 0.5 }],
    anchors: () => ({ top: [20, 0] }),
    draw: (w, h, opt) => {
      let s = '';
      if (opt.water > 0) { const yw = 143 - opt.water * 133; s += rect(8, yw, 24, 143 - yw, 'w') + line(8, yw, 32, yw, 'o h'); }
      for (let i = 1; i <= 12; i++) { const y = 143 - i * 10.5; s += line(32, y, i % 5 ? 27 : 23, y, 'o h'); }
      return s + path('M5 0 L8 4 V143 M32 143 V4 L35 0', 'o') + path('M0 150 H40 L35 143 H5 Z');
    }
  });

  add({
    id: 'boiling-tube', name: 'Boiling tube', group: 'glassware',
    keywords: ['boiling tube', 'test tube', 'tube'],
    w: 22, h: 120,
    options: [{ key: 'water', label: 'Water level', type: 'range', min: 0, max: 0.9, step: 0.05, def: 0.4 }],
    anchors: () => ({ top: [11, 0], bottom: [11, 119] }),
    draw: (w, h, opt) => {
      let s = '';
      if (opt.water > 0) {
        const yw = 119 - opt.water * 112;
        s += path(`M1 ${n(Math.min(yw, 108))} V108 A10 10 0 0 0 21 108 V${n(Math.min(yw, 108))} Z`, 'w') + line(1, yw, 21, yw, 'o h');
      }
      return s + path('M0 0 L1 3 V108 A10 10 0 0 0 21 108 V3 L22 0', 'o');
    }
  });

  // =====================================================================
  // Waves and optics
  // =====================================================================
  add({
    id: 'laser', name: 'Laser (on a stand)', group: 'optics',
    keywords: ['laser', 'laser pointer', 'light source', 'beam'],
    w: 72, h: 58,
    anchors: () => ({ beam: [72, 13] }),
    draw: () =>
      rect(28, 20, 6, 32) + rect(10, 52, 44, 6, 'o f', 1.5) +                // stand
      rect(0, 6, 64, 14, 'o f', 3) + rect(64, 9, 8, 8, 'o k', 1) +          // body and aperture end
      rect(18, 3, 10, 3, 'o f') + line(44, 6, 44, 20, 'o h') + line(48, 6, 48, 20, 'o h')
  });

  // A stand for optics: a post and a base under something 60 wide whose bottom is at y = top
  const opticsStand = (top) => rect(27, top, 6, 30) + rect(12, top + 30, 36, 6, 'o f', 1.5);

  add({
    id: 'ray-box', name: 'Ray box (seen from above)', group: 'optics',
    keywords: ['ray box', 'light box', 'lamp', 'ray', 'snell', 'refraction'],
    w: 76, h: 40,
    anchors: () => ({ beam: [76, 20] }),
    draw: () => rect(0, 0, 70, 40, 'o f', 2) + circle(26, 20, 6, 'o h') + line(26, 14, 26, 26, 'o h') +
      rect(70, 3, 6, 15, 'o k') + rect(70, 22, 6, 15, 'o k')
  });

  add({
    id: 'lamp', name: 'Lamp (light source on a stand)', group: 'optics',
    keywords: ['lamp', 'bulb', 'light source', 'light', 'filament lamp'],
    w: 60, h: 96,
    anchors: () => ({ light: [30, 16] }),
    draw: () => opticsStand(60) + rect(22, 30, 16, 30, 'o m', 2) +
      path('M22 30 C14 24 14 4 30 2 C46 4 46 24 38 30 Z', 'o g') + path('M26 28 L28 14 L32 18 L34 28', 'o h')
  });

  add({
    id: 'convex-lens', name: 'Convex (converging) lens in a holder', group: 'optics',
    keywords: ['convex lens', 'converging lens', 'lens', 'magnifying'],
    w: 60, h: 116,
    anchors: () => ({ centre: [30, 40] }),
    draw: () => opticsStand(80) + path('M30 0 Q44 40 30 80 Q16 40 30 0 Z', 'o g')
  });

  add({
    id: 'concave-lens', name: 'Concave (diverging) lens in a holder', group: 'optics',
    keywords: ['concave lens', 'diverging lens', 'lens'],
    w: 60, h: 116,
    anchors: () => ({ centre: [30, 40] }),
    draw: () => opticsStand(80) + path('M21 0 H39 Q29 40 39 80 H21 Q31 40 21 0 Z', 'o g')
  });

  add({
    id: 'plane-mirror', name: 'Plane mirror in a holder', group: 'optics',
    keywords: ['mirror', 'plane mirror', 'reflection'],
    w: 60, h: 116,
    anchors: () => ({ face: [33, 40] }),
    draw: () => {
      let s = opticsStand(80) + rect(29, 0, 4, 80, 'o f');
      for (let y = 4; y <= 80; y += 6) s += line(29, y, 24, y + 5, 'o h');   // hatching on the back (silvered side faces right)
      return s;
    }
  });

  add({
    id: 'glass-block', name: 'Rectangular glass block (seen from above)', group: 'optics',
    keywords: ['glass block', 'perspex block', 'block', 'refraction', 'snell', 'refractive index'],
    w: 120, h: 70,
    draw: () => rect(0, 0, 120, 70, 'o g')
  });

  add({
    id: 'semicircular-block', name: 'Semicircular glass block (seen from above)', group: 'optics',
    keywords: ['semicircular block', 'semi-circular', 'half block', 'critical angle', 'total internal reflection'],
    w: 120, h: 62,
    anchors: () => ({ centre: [60, 60] }),
    draw: () => path('M0 60 A60 60 0 0 1 120 60 Z', 'o g') + line(60, 55, 60, 60, 'o h')
  });

  add({
    id: 'prism', name: 'Triangular prism (seen from above)', group: 'optics',
    keywords: ['prism', 'triangular prism', 'dispersion', 'spectrum'],
    w: 100, h: 87,
    draw: () => path('M0 87 H100 L50 0 Z', 'o g')
  });

  add({
    id: 'slit-slide', name: 'Slits or grating in a holder', group: 'optics',
    keywords: ['slit', 'single slit', 'double slit', 'diffraction grating', 'grating', 'young'],
    w: 60, h: 116,
    options: [{ key: 'kind', label: 'Type', type: 'choice', values: [['single', 'Single slit'], ['double', 'Double slit'], ['grating', 'Diffraction grating']], def: 'single' }],
    anchors: () => ({ centre: [30, 40] }),
    draw: (w, h, opt) => {
      // Seen from the side, a slit is a gap in a thin dark plate
      const gaps = opt.kind === 'double' ? [[35, 37.5], [42.5, 45]] : opt.kind === 'single' ? [[38, 42]] : [];
      let s = opticsStand(80);
      if (opt.kind === 'grating') {
        s += rect(28, 0, 4, 80, 'o f');
        for (let y = 26; y < 54; y += 3) s += line(28, y, 32, y, 'o h');
        return s;
      }
      let y0 = 0;
      gaps.concat([[80, 80]]).forEach(([a, b]) => { if (a > y0) s += rect(28, y0, 4, a - y0, 'o k'); y0 = b; });
      return s;
    }
  });

  add({
    id: 'screen', name: 'Screen on a stand', group: 'optics',
    keywords: ['screen', 'white screen', 'card', 'wall'],
    w: 60, h: 126,
    draw: () => opticsStand(90) + rect(26, 0, 8, 90, 'o f', 1)
  });

  add({
    id: 'signal-generator', name: 'Signal generator', group: 'optics',
    keywords: ['signal generator', 'function generator', 'oscillator', 'frequency', 'ac supply'],
    w: 110, h: 60,
    anchors: () => ({ a: [75, 48], b: [95, 48] }),
    draw: () => rect(0, 0, 110, 60, 'o f', 3) + rect(8, 10, 52, 18, 'o f', 2) + text(34, 19.5, '50.0 Hz', 9) +
      circle(85, 22, 10) + line(85, 22, 85, 13) + path('M10 46 q4 -8 8 0 t8 0 t8 0', 'o h') +
      circle(75, 48, 4) + circle(95, 48, 4, 'o k')
  });

  add({
    id: 'loudspeaker', name: 'Loudspeaker', group: 'optics',
    keywords: ['loudspeaker', 'speaker', 'sound', 'sound waves'],
    w: 34, h: 60,
    anchors: () => ({ a: [0, 25], b: [0, 35], front: [34, 30] }),
    draw: () => path('M0 20 H14 L34 0 V60 L14 40 H0 Z')
  });

  add({
    id: 'vibration-generator', name: 'Vibration generator', group: 'optics',
    keywords: ['vibration generator', 'vibrator', 'mechanical oscillator', 'standing waves', 'string'],
    w: 60, h: 70,
    anchors: () => ({ top: [30, 1], a: [8, 62], b: [20, 62] }),
    draw: () => rect(26, 6, 8, 16, 'o m') + circle(30, 4, 3) + rect(0, 20, 60, 50, 'o f', 3) +
      circle(8, 62, 3.5) + circle(20, 62, 3.5, 'o k') + path('M34 46 q4 -8 8 0 t8 0', 'o h')
  });

  add({
    id: 'tuning-fork', name: 'Tuning fork', group: 'optics',
    keywords: ['tuning fork', 'fork', 'frequency', 'sound', 'resonance'],
    w: 44, h: 110,
    draw: () =>
      rect(19, 76, 6, 34, 'o f', 2) +
      path('M8 0 H14 V60 Q14 70 22 70 Q30 70 30 60 V0 H36 V60 Q36 78 22 78 Q8 78 8 60 Z')
  });

  add({
    id: 'resonance-tube', name: 'Resonance tube in water', group: 'optics',
    keywords: ['resonance tube', 'closed pipe', 'air column', 'speed of sound', 'standing wave', 'tube'],
    w: 60, h: 220, stretch: 'h',
    anchors: (w, h) => ({ top: [30, 0] }),
    draw: (w, h) => {
      const wl = h * 0.42;   // water level in the outer cylinder
      return path(`M3 ${n(wl)} V${h - 6} Q3 ${h} 9 ${h} H51 Q57 ${h} 57 ${h - 6} V${n(wl)} Z`, 'w') + line(3, wl, 57, wl, 'o h') +
        path(`M3 ${n(h * 0.3)} V${h - 6} Q3 ${h} 9 ${h} H51 Q57 ${h} 57 ${h - 6} V${n(h * 0.3)}`, 'o') +
        rect(21, 0, 18, h * 0.85, 'o f') + rect(21, wl, 18, h * 0.85 - wl, 'w') + line(21, h * 0.85, 39, h * 0.85, 'o h') +
        path(`M21 0 V${n(h * 0.85)} M39 0 V${n(h * 0.85)}`, 'o');
    }
  });

  // =====================================================================
  // Electricity and magnetism: apparatus
  // =====================================================================
  add({
    id: 'power-supply', name: 'Power supply unit', group: 'electrical',
    keywords: ['power supply', 'psu', 'low voltage supply', 'supply', 'dc supply', 'battery pack'],
    w: 120, h: 70,
    anchors: () => ({ pos: [85, 50], neg: [105, 50] }),
    draw: () => rect(0, 0, 120, 70, 'o f', 3) + rect(10, 10, 46, 18, 'o f', 2) + text(33, 19.5, '6.0 V', 10) +
      circle(30, 48, 11) + line(30, 48, 37, 40) + circle(85, 50, 5) + circle(105, 50, 5, 'o k') +
      text(85, 37, '+', 10) + text(105, 37, '−', 10)
  });

  add({
    id: 'multimeter', name: 'Digital multimeter', group: 'electrical',
    keywords: ['multimeter', 'meter', 'voltmeter', 'ammeter', 'ohmmeter', 'digital meter'],
    w: 60, h: 100,
    anchors: () => ({ com: [30, 88], v: [46, 88], a: [14, 88] }),
    draw: () => rect(0, 0, 60, 100, 'o f', 6) + rect(8, 8, 44, 22, 'o f', 2) + text(30, 19.5, '0.00', 11) +
      circle(30, 56, 13) + line(30, 56, 38, 47) + circle(14, 88, 4) + circle(30, 88, 4, 'o k') + circle(46, 88, 4)
  });

  add({
    id: 'coil', name: 'Coil (solenoid)', group: 'electrical',
    keywords: ['coil', 'solenoid', 'electromagnet', 'inductor', 'turns'],
    w: 140, h: 46, stretch: 'w',
    anchors: (w) => ({ a: [0, 4], b: [w, 4] }),
    draw: (w) => {
      let s = rect(6, 8, w - 12, 30, 'o f', 2);
      for (let x = 10; x < w - 12; x += 6) s += line(x, 6, x + 4, 40, 'o');
      return s + path(`M0 4 H10 M${w - 8} 6 V4 H${w}`, 'o');
    }
  });

  add({
    id: 'bar-magnet', name: 'Bar magnet', group: 'electrical',
    keywords: ['bar magnet', 'magnet', 'north', 'south', 'poles'],
    w: 120, h: 24,
    draw: () => rect(0, 0, 60, 24, 'o f') + rect(60, 0, 60, 24, 'o m') + text(30, 12.5, 'N', 14) + text(90, 12.5, 'S', 14)
  });

  add({
    id: 'u-magnet', name: 'U-shaped magnet', group: 'electrical',
    keywords: ['u magnet', 'horseshoe magnet', 'magnet', 'magnadur', 'poles'],
    w: 80, h: 100,
    draw: () => path('M0 0 H20 V60 Q20 80 40 80 Q60 80 60 60 V0 H80 V60 Q80 100 40 100 Q0 100 0 60 Z') +
      rect(0, 0, 20, 20, 'o m') + rect(60, 0, 20, 20, 'o m') + text(10, 10.5, 'N', 12) + text(70, 10.5, 'S', 12)
  });

  add({
    id: 'compass', name: 'Plotting compass', group: 'electrical',
    keywords: ['compass', 'plotting compass', 'needle', 'magnetic field'],
    w: 40, h: 40,
    draw: () => circle(20, 20, 19) + path('M20 4 L25 20 L15 20 Z', 'o k') + path('M20 36 L25 20 L15 20 Z', 'o f') + circle(20, 20, 1.6, 'k')
  });

  // =====================================================================
  // Circuit symbols (data booklet, page 5), all 80 × 40 with ends at (0, 20) and (80, 20)
  // =====================================================================
  add({
    id: 'sym-cell', name: 'Cell', group: 'symbols',
    keywords: ['cell', 'battery', 'emf', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    draw: () => line(0, MID, 36, MID) + line(36, 6, 36, 34) + line(44, 13, 44, 27) + line(44, MID, 80, MID)
  });

  add({
    id: 'sym-switch', name: 'Switch', group: 'symbols',
    keywords: ['switch', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    options: [{ key: 'state', label: 'Switch', type: 'choice', values: [['open', 'Open'], ['closed', 'Closed']], def: 'open' }],
    draw: (w, h, opt) => opt.state === 'closed'
      ? line(0, MID, 28, MID) + line(28, MID, 53, 17) + line(52, MID, 80, MID) + circle(28, MID, 2, 'k') + circle(52, MID, 2, 'k')
      : line(0, MID, 28, MID) + line(28, MID, 50, 7) + line(53, MID, 80, MID)
  });

  add({
    id: 'sym-ammeter', name: 'Ammeter', group: 'symbols',
    keywords: ['ammeter', 'current', 'meter', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    draw: () => line(0, MID, 27, MID) + line(53, MID, 80, MID) + circle(40, MID, 13) + text(40, MID + 0.5, 'A', 14)
  });

  add({
    id: 'sym-resistor', name: 'Resistor', group: 'symbols',
    keywords: ['resistor', 'resistance', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    draw: () => line(0, MID, 20, MID) + line(60, MID, 80, MID) + rect(20, 14, 40, 12)
  });

  // A small arrow from (x1, y1) to (x2, y2) with a solid head, for the symbols
  function arrow(x1, y1, x2, y2, hl = 5) {
    const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    const bx = x2 - ux * hl, by = y2 - uy * hl, px = -uy * hl * 0.45, py = ux * hl * 0.45;
    return line(x1, y1, bx, by, 'o h') + `<polygon class="k" points="${n(x2)},${n(y2)} ${n(bx + px)},${n(by + py)} ${n(bx - px)},${n(by - py)}"/>`;
  }
  const resistorBody = () => line(0, MID, 20, MID) + line(60, MID, 80, MID) + rect(20, 14, 40, 12);

  add({
    id: 'sym-battery', name: 'Battery', group: 'symbols',
    keywords: ['battery', 'cells', 'emf', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    draw: () => line(0, MID, 26, MID) + line(26, 6, 26, 34) + line(32, 13, 32, 27) +
      [35, 38, 41, 44].map((x) => circle(x, MID, 0.9, 'k')).join('') +   // the dotted line: more cells in between
      line(48, 6, 48, 34) + line(54, 13, 54, 27) + line(54, MID, 80, MID)
  });

  add({
    id: 'sym-voltmeter', name: 'Voltmeter', group: 'symbols',
    keywords: ['voltmeter', 'potential difference', 'voltage', 'meter', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    draw: () => line(0, MID, 27, MID) + line(53, MID, 80, MID) + circle(40, MID, 13) + text(40, MID + 0.5, 'V', 14)
  });

  add({
    id: 'sym-variable-resistor', name: 'Variable resistor', group: 'symbols',
    keywords: ['variable resistor', 'rheostat', 'resistor', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    draw: () => resistorBody() + arrow(24, 36, 58, 3, 6)
  });

  add({
    id: 'sym-ldr', name: 'Light-dependent resistor (LDR)', group: 'symbols',
    keywords: ['ldr', 'light dependent resistor', 'light sensor', 'resistor', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    draw: () => resistorBody() + arrow(22, 0, 32, 10) + arrow(30, 0, 40, 10)
  });

  add({
    id: 'sym-thermistor', name: 'Thermistor', group: 'symbols',
    keywords: ['thermistor', 'temperature sensor', 'ntc', 'resistor', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    draw: () => resistorBody() + path('M22 36 L56 4 H64', 'o h')
  });

  add({
    id: 'sym-potentiometer', name: 'Potentiometer', group: 'symbols',
    keywords: ['potentiometer', 'potential divider', 'pot', 'slider', 'symbol'],
    w: SYM_W, h: SYM_H,
    anchors: () => ({ a: [0, MID], b: [SYM_W, MID], slider: [40, 0] }),
    draw: () => resistorBody() + arrow(40, 0, 40, 14, 6)
  });

  add({
    id: 'sym-lamp', name: 'Lamp', group: 'symbols',
    keywords: ['lamp', 'bulb', 'filament lamp', 'light', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    draw: () => line(0, MID, 27, MID) + line(53, MID, 80, MID) + circle(40, MID, 13) +
      line(30.8, 10.8, 49.2, 29.2) + line(49.2, 10.8, 30.8, 29.2)
  });

  add({
    id: 'sym-led', name: 'Light-emitting diode (LED)', group: 'symbols',
    keywords: ['led', 'light emitting diode', 'diode', 'light', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    draw: () => line(0, MID, 32, MID) + line(48, MID, 80, MID) + path('M32 10 V30 L48 20 Z') + line(48, 10, 48, 30) +
      arrow(42, 8, 50, 0) + arrow(48, 10, 56, 2)
  });

  add({
    id: 'sym-heater', name: 'Heating element', group: 'symbols',
    keywords: ['heating element', 'heater', 'element', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    draw: () => line(0, MID, 18, MID) + line(62, MID, 80, MID) + rect(18, 14, 44, 12) + line(29, 14, 29, 26) + line(40, 14, 40, 26) + line(51, 14, 51, 26)
  });

  add({
    id: 'sym-motor', name: 'Motor', group: 'symbols',
    keywords: ['motor', 'electric motor', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    draw: () => line(0, MID, 27, MID) + line(53, MID, 80, MID) + circle(40, MID, 13) + text(40, MID + 0.5, 'M', 13)
  });

  add({
    id: 'sym-earth', name: 'Earth (ground)', group: 'symbols',
    keywords: ['earth', 'ground', 'symbol'],
    w: 40, h: 40,
    anchors: () => ({ a: [20, 0] }),
    draw: () => line(20, 0, 20, 22) + line(8, 22, 32, 22) + line(13, 28, 27, 28) + line(17.5, 34, 22.5, 34)
  });

  // Common symbols that are not in the data booklet
  const NOT_IN_BOOKLET = 'This symbol is not in the IB data booklet.';
  add({
    id: 'sym-diode', name: 'Diode', group: 'symbols', note: NOT_IN_BOOKLET,
    keywords: ['diode', 'rectifier', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    draw: () => line(0, MID, 32, MID) + line(48, MID, 80, MID) + path('M32 10 V30 L48 20 Z') + line(48, 10, 48, 30)
  });

  add({
    id: 'sym-dc-supply', name: 'd.c. power supply', group: 'symbols', note: NOT_IN_BOOKLET,
    keywords: ['dc supply', 'd.c.', 'power supply', 'direct current', 'supply', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    draw: () => line(0, MID, 27, MID) + line(53, MID, 80, MID) + circle(40, MID, 13) + text(40, MID + 0.5, 'd.c.', 8) +
      text(22, 10, '+', 10) + text(58, 10, '−', 10)
  });

  add({
    id: 'sym-ac-supply', name: 'a.c. power supply', group: 'symbols', note: NOT_IN_BOOKLET,
    keywords: ['ac supply', 'a.c.', 'alternating current', 'power supply', 'mains', 'supply', 'symbol'],
    w: SYM_W, h: SYM_H, anchors: ends,
    draw: () => line(0, MID, 27, MID) + line(53, MID, 80, MID) + circle(40, MID, 13) + path('M32 20 C35 12 37 12 40 20 C43 28 45 28 48 20', 'o h')
  });

  // =====================================================================
  // Nuclear physics
  // =====================================================================
  add({
    id: 'gm-tube', name: 'Geiger–Müller tube', group: 'nuclear',
    keywords: ['gm tube', 'geiger', 'geiger-muller', 'detector', 'radiation', 'counter'],
    w: 140, h: 42,
    anchors: () => ({ window: [0, 18], cable: [140, 40] }),
    draw: () => path('M110 18 C126 18 124 40 140 40', 'o') + rect(4, 6, 106, 24, 'o f', 4) + rect(0, 4, 6, 28, 'o m', 1) + line(14, 18, 96, 18, 'o h')
  });

  add({
    id: 'counter', name: 'Counter (scaler)', group: 'nuclear',
    keywords: ['counter', 'scaler', 'ratemeter', 'count', 'geiger counter'],
    w: 120, h: 60,
    anchors: () => ({ input: [105, 45] }),
    draw: () => rect(0, 0, 120, 60, 'o f', 3) + rect(10, 10, 74, 22, 'o f', 2) + text(47, 21.5, '00000', 13) +
      rect(10, 40, 14, 9, 'o f', 1.5) + rect(30, 40, 14, 9, 'o f', 1.5) + circle(105, 45, 5) + circle(105, 45, 1.6, 'k')
  });

  add({
    id: 'sealed-source', name: 'Sealed source in a holder', group: 'nuclear',
    keywords: ['source', 'radioactive source', 'sealed source', 'alpha', 'beta', 'gamma', 'radiation'],
    w: 90, h: 32,
    anchors: () => ({ window: [0, 16] }),
    draw: () => rect(30, 13, 60, 6, 'o m', 2) + rect(0, 6, 30, 20, 'o f', 2) + circle(4, 16, 2.5, 'k')
  });

  add({
    id: 'tongs', name: 'Tongs', group: 'nuclear',
    keywords: ['tongs', 'forceps', 'handling tool'],
    w: 120, h: 22,
    anchors: () => ({ tip: [0, 11] }),
    draw: () => path('M0 9 L60 11 L120 2 M0 13 L60 11 L120 20') + circle(60, 11, 2.5, 'o f')
  });

  add({
    id: 'absorber', name: 'Absorber sheet in a holder', group: 'nuclear',
    keywords: ['absorber', 'paper', 'aluminium', 'aluminum', 'lead', 'sheet', 'shielding', 'penetration'],
    w: 60, h: 90,
    options: [{ key: 'material', label: 'Material', type: 'choice', values: [['paper', 'Paper'], ['aluminium', 'Aluminium'], ['lead', 'Lead']], def: 'aluminium' }],
    draw: (w, h, opt) => {
      const t = opt.material === 'paper' ? 2 : opt.material === 'lead' ? 8 : 4;   // thicker for aluminium and lead
      return rect(30 - t / 2, 0, t, 72, opt.material === 'lead' ? 'o k' : opt.material === 'aluminium' ? 'o m' : 'o f') +
        rect(18, 70, 24, 14, 'o f', 1.5) + rect(10, 84, 40, 6, 'o f', 1.5);
    }
  });

  add({
    id: 'lead-block', name: 'Lead block (shielding)', group: 'nuclear',
    keywords: ['lead block', 'lead', 'shield', 'shielding', 'castle', 'brick'],
    w: 60, h: 40,
    draw: () => rect(0, 0, 60, 40, 'o m', 1) + text(30, 20.5, 'Pb', 13)
  });

  // =====================================================================
  // Sensors and dataloggers (generic look-alikes, no brand names)
  // =====================================================================
  add({
    id: 'datalogger', name: 'Datalogger (interface)', group: 'sensors',
    keywords: ['datalogger', 'data logger', 'interface', 'logger', 'labquest'],
    w: 110, h: 60,
    anchors: () => ({ in1: [20, 48], in2: [40, 48], in3: [60, 48], usb: [110, 48] }),
    draw: () => rect(0, 0, 110, 60, 'o f', 6) + rect(10, 8, 56, 26, 'o f', 2) + path('M14 28 L24 20 L34 24 L46 14 L60 18', 'o h') +
      circle(20, 48, 5) + circle(40, 48, 5) + circle(60, 48, 5) + rect(100, 44, 10, 8, 'o k')
  });

  add({
    id: 'laptop', name: 'Laptop', group: 'sensors',
    keywords: ['laptop', 'computer', 'pc', 'notebook'],
    w: 140, h: 96,
    anchors: () => ({ usb: [140, 90] }),
    draw: () => rect(10, 0, 120, 82, 'o f', 4) + rect(18, 8, 104, 66, 'o h', 1) + path('M24 62 L44 44 L60 52 L80 30 L114 36', 'o h') +
      path('M0 84 H140 L132 96 H8 Z')
  });

  add({
    id: 'smartphone', name: 'Smartphone (camera or sensor app)', group: 'sensors',
    keywords: ['phone', 'smartphone', 'mobile', 'camera', 'video', 'phyphox', 'app'],
    w: 40, h: 76,
    draw: () => rect(0, 0, 40, 76, 'o f', 6) + rect(4, 9, 32, 58, 'o h', 1) + circle(20, 4.5, 1.6, 'k') + rect(15, 70, 10, 2, 'o h', 1)
  });

  add({
    id: 'camera-tripod', name: 'Tripod for a phone or camera', group: 'sensors',
    keywords: ['tripod', 'camera tripod', 'phone holder', 'video'],
    w: 60, h: 110,
    anchors: () => ({ top: [30, 0] }),
    draw: () => rect(18, 0, 24, 8, 'o f', 2) + rect(27, 8, 6, 40) + path('M30 46 L4 110 M30 46 L56 110 M30 46 L30 110', 'o b')
  });

  add({
    id: 'light-gate', name: 'Light gate', group: 'sensors',
    keywords: ['light gate', 'photogate', 'photo gate', 'timing gate', 'infrared'],
    w: 50, h: 80,
    anchors: () => ({ beam: [25, 30], cable: [25, 80] }),
    draw: () => rect(0, 0, 10, 62) + rect(40, 0, 10, 62) + rect(0, 60, 50, 12, 'o f', 1.5) +
      line(10, 30, 40, 30, 'o h') + circle(10, 30, 2, 'k') + circle(40, 30, 2, 'k') + line(25, 72, 25, 80)
  });

  add({
    id: 'motion-sensor', name: 'Motion sensor (ultrasonic)', group: 'sensors',
    keywords: ['motion sensor', 'motion detector', 'ultrasonic', 'distance sensor', 'position'],
    w: 40, h: 50,
    anchors: () => ({ face: [40, 25], cable: [0, 25] }),
    draw: () => rect(0, 6, 30, 38, 'o f', 3) + rect(30, 0, 10, 50, 'o m', 2) + line(35, 8, 35, 42, 'o h')
  });

  add({
    id: 'force-sensor', name: 'Force sensor', group: 'sensors',
    keywords: ['force sensor', 'force probe', 'load cell', 'dual-range', 'force meter'],
    w: 82, h: 40,
    anchors: () => ({ hook: [82, 22], cable: [0, 22] }),
    draw: () => rect(60, 20, 14, 4, 'o m') + circle(78, 22, 4) + rect(0, 8, 60, 28, 'o f', 3) + text(30, 22.5, 'F', 11)
  });

  add({
    id: 'pressure-sensor', name: 'Gas pressure sensor', group: 'sensors',
    keywords: ['pressure sensor', 'gas pressure sensor', 'pressure probe', 'barometer'],
    w: 68, h: 30,
    anchors: () => ({ nozzle: [68, 15], cable: [0, 15] }),
    draw: () => rect(50, 11, 12, 8, 'o f') + rect(62, 13, 6, 4, 'o m') + rect(0, 0, 50, 30, 'o f', 3) + text(25, 15.5, 'kPa', 9)
  });

  add({
    id: 'temperature-probe', name: 'Temperature probe', group: 'sensors',
    keywords: ['temperature probe', 'temperature sensor', 'thermocouple', 'digital thermometer', 'thermometer'],
    w: 160, h: 16,
    anchors: () => ({ tip: [160, 8], cable: [0, 8] }),
    draw: () => path('M30 6 H156 Q160 6 160 8 Q160 10 156 10 H30 Z', 'o m') + rect(0, 2, 32, 12, 'o f', 3)
  });

  add({
    id: 'light-sensor', name: 'Light sensor', group: 'sensors',
    keywords: ['light sensor', 'light probe', 'light meter', 'lux', 'intensity'],
    w: 48, h: 24,
    anchors: () => ({ window: [48, 12], cable: [0, 12] }),
    draw: () => rect(0, 4, 44, 16, 'o f', 3) + rect(44, 2, 4, 20, 'o g', 1)
  });

  add({
    id: 'sound-sensor', name: 'Sound sensor (microphone)', group: 'sensors',
    keywords: ['microphone', 'sound sensor', 'mic', 'sound level', 'decibel'],
    w: 68, h: 28,
    anchors: () => ({ head: [68, 14], cable: [0, 14] }),
    draw: () => rect(0, 8, 50, 12, 'o f', 3) + circle(58, 14, 9.5) + line(52, 9, 64, 9, 'o h') + line(50, 14, 67, 14, 'o h') + line(52, 19, 64, 19, 'o h')
  });

  // =====================================================================
  // Drawing an item at any size
  // =====================================================================
  const byId = {};
  items.forEach((it) => { byId[it.id] = it; });

  function defaults(it) {
    const o = {};
    (it.options || []).forEach((op) => { o[op.key] = op.def; });
    return o;
  }

  // How an item of natural size it.w × it.h is fitted into a box w × h:
  // the drawing is scaled by s, and a stretchy item is redrawn longer or shorter (dw × dh before scaling).
  function fit(it, w, h) {
    if (it.stretch === 'both') return { s: 1, dw: w, dh: h };
    if (it.stretch === 'w') { const s = h / it.h; return { s, dw: w / s, dh: it.h }; }
    if (it.stretch === 'h') { const s = w / it.w; return { s, dw: it.w, dh: h / s }; }
    return { s: w / it.w, dw: it.w, dh: it.h };
  }

  // SVG markup for an item in the box 0..w × 0..h (default: natural size).
  // `flipped` tells it the item will be shown mirrored, so its text is mirrored back.
  function markup(it, w = it.w, h = it.h, opt, flipped) {
    const o = Object.assign(defaults(it), opt || {});
    const f = fit(it, w, h);
    mirror = !!flipped;
    const inner = it.draw(f.dw, f.dh, o);
    mirror = false;
    // --k keeps line thicknesses the same however big the item is drawn (see css/diagram-maker.css)
    return Math.abs(f.s - 1) < 1e-6 ? inner : `<g transform="scale(${n(f.s)})" style="--k:${n(1 / f.s)}">${inner}</g>`;
  }

  // Attachment points in the same box.
  function anchors(it, w = it.w, h = it.h, opt) {
    if (!it.anchors) return {};
    const o = Object.assign(defaults(it), opt || {});
    const f = fit(it, w, h), a = it.anchors(f.dw, f.dh, o), out = {};
    Object.keys(a).forEach((k) => { out[k] = [a[k][0] * f.s, a[k][1] * f.s]; });
    return out;
  }

  // Size for the equipment-bank picture: long stretchy items are shown shorter so their details show.
  function thumbSize(it) {
    if (it.stretch === 'w') return { w: Math.min(it.w, it.h * 8, 160), h: it.h };
    if (it.stretch === 'h') return { w: it.w, h: Math.min(it.h, 200) };
    return { w: it.w, h: it.h };
  }

  window.DiagramItems = { groups, items, byId, defaults, markup, anchors, thumbSize };
})();
