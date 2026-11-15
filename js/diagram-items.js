/* Equipment bank for the experimental diagram maker (experimental/diagram-maker.html).
   Plan and decisions: docs/DIAGRAM_MAKER_PLAN.md.

   HOW TO ADD AN ITEM: add one `add({...})` block in the right group below.
   - id:       permanent (saved diagrams refer to it): never rename one.
   - name, group, keywords (other names the search box should find).
   - w, h:     natural size in page units (about 1 unit = 2 mm; small things drawn a little larger).
   - stretch:  'w' or 'h' if the item can be made longer that way without squashing it (the drawing
               is redrawn at the new length, e.g. more coils on a spring); leave out otherwise.
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
  const text = (x, y, s, size = 12, anchor = 'middle') =>
    `<text class="t" x="${n(x)}" y="${n(y)}" font-size="${size}" text-anchor="${anchor}" dominant-baseline="central">${s}</text>`;

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
    if (it.stretch === 'w') { const s = h / it.h; return { s, dw: w / s, dh: it.h }; }
    if (it.stretch === 'h') { const s = w / it.w; return { s, dw: it.w, dh: h / s }; }
    return { s: w / it.w, dw: it.w, dh: it.h };
  }

  // SVG markup for an item in the box 0..w × 0..h (default: natural size).
  function markup(it, w = it.w, h = it.h, opt) {
    const o = Object.assign(defaults(it), opt || {});
    const f = fit(it, w, h);
    const inner = it.draw(f.dw, f.dh, o);
    return Math.abs(f.s - 1) < 1e-6 ? inner : `<g transform="scale(${n(f.s)})">${inner}</g>`;
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
