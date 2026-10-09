// Paper 1B diagrams: small reusable SVG components, drawn from parameters, never sketched.
// They use the site's diagram classes (l1, l2, l3, f1…, dash), so they follow light/dark mode;
// no colour is written into the SVG. Only build a component when a dataset needs it.
// The validator reads two kinds of markup back, so keep them in step with validate.mjs:
//   vectors          <g class="vec" data-vec="F"><line … x1 y1 x2 y2/>…</g>   (arrow from x1,y1 towards x2,y2)
//   in/out of page   <g class="vec-z" data-vec="I">  a dot (out of the page) or a cross (into it)
//   circuits         <g class="comp" data-id="A" data-t1="x y" data-t2="x y">…</g> and <line class="wire" …/>
import { escapeAttr } from './lib.mjs';

const r1 = (n) => Math.round(n * 10) / 10;
const FILL = { l1: 'f1', l2: 'f2', l3: 'f3' };

// Arrow from (x1, y1) to (x2, y2). `vec` names the physical vector it shows (checked by the validator).
export function arrow(x1, y1, x2, y2, { cls = 'l3', vec, head = 12, half = 5.5 } = {}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const [ux, uy] = [(x2 - x1) / len, (y2 - y1) / len];
  const [bx, by] = [x2 - head * ux, y2 - head * uy];
  const tip = `${r1(x2)},${r1(y2)} ${r1(bx - half * uy)},${r1(by + half * ux)} ${r1(bx + half * uy)},${r1(by - half * ux)}`;
  return `<g class="vec"${vec ? ` data-vec="${vec}"` : ''}><line class="${cls}" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(bx)}" y2="${r1(by)}"/><polygon class="${FILL[cls.split(' ')[0]] || 'f3'}" points="${tip}"/></g>`;
}

export function label(x, y, text, { anchor = 'middle', size = 16, cls = '', italic = false } = {}) {
  return `<text x="${r1(x)}" y="${r1(y)}" text-anchor="${anchor}" font-size="${size}"${cls ? ` class="${cls}"` : ''}${italic ? ' font-style="italic"' : ''}>${text}</text>`;
}

// A wire seen end-on: a dot means current out of the page, a cross means into the page.
export function endOnWire(x, y, outOfPage, vec = 'I') {
  const mark = outOfPage
    ? `<circle class="f3" cx="${x}" cy="${y}" r="3.2"/>`
    : `<line class="l3 thin" x1="${x - 5}" y1="${y - 5}" x2="${x + 5}" y2="${y + 5}"/><line class="l3 thin" x1="${x - 5}" y1="${y + 5}" x2="${x + 5}" y2="${y - 5}"/>`;
  return `<g class="vec-z" data-vec="${vec}"><circle class="l3 thin" cx="${x}" cy="${y}" r="10" fill="none"/>${mark}</g>`;
}

// viewBox can start away from 0 0, to crop empty margins (diagrams then look bigger on phones).
const svg = (w, h, alt, body, x0 = 0, y0 = 0) => `<svg viewBox="${x0} ${y0} ${w} ${h}" role="img" aria-label="${escapeAttr(alt)}">${body}</svg>`;

// ----- Current balance (front view, looking along the wire) -----
// A magnet on a top-pan balance; a stiff wire, held by a clamp, passes between the poles.
// opts: { north: 'left' | 'right', currentOut: true/false, showForce: false }
export function currentBalance(alt, { north = 'left', currentOut = true, showForce = false } = {}) {
  const [wx, wy] = [260, 200];
  const leftPole = north === 'left' ? 'N' : 'S';
  const rightPole = north === 'left' ? 'S' : 'N';
  const fieldDir = north === 'left' ? 1 : -1; // field runs from N to S
  const body = [
    // clamp stand and the rigid wire holder
    '<path class="l3 thin" d="M60 352V60H222"/><path class="l3 thin" d="M24 352H110"/>',
    `<line class="l3 thin" x1="222" y1="60" x2="${wx - 3}" y2="${wy - 10}"/>`,
    // balance with its pan and display
    '<rect class="l3 thin" x="130" y="300" width="260" height="52" rx="6" fill="none"/>',
    '<rect class="l3 thin" x="150" y="288" width="220" height="12" fill="none"/>',
    '<rect class="l3 thin" x="226" y="314" width="68" height="24" rx="3" fill="none"/>',
    // steel yoke and the two magnets facing each other
    '<path class="l3 thin" d="M180 288V150H214V262H306V150H340V288Z" fill="none"/>',
    '<rect class="l3 thin" x="214" y="168" width="24" height="64" fill="none"/>',
    '<rect class="l3 thin" x="282" y="168" width="24" height="64" fill="none"/>',
    label(226, 206, leftPole, { size: 16 }), label(294, 206, rightPole, { size: 16 }),
    // magnetic field between the poles (from N to S)
    arrow(fieldDir > 0 ? 243 : 277, 176, fieldDir > 0 ? 277 : 243, 176, { cls: 'l1 thin', vec: 'B', head: 9, half: 4.5 }),
    arrow(fieldDir > 0 ? 243 : 277, 224, fieldDir > 0 ? 277 : 243, 224, { cls: 'l1 thin', vec: 'B', head: 9, half: 4.5 }),
    label(260, 162, 'B', { italic: true, cls: 't1' }),
    endOnWire(wx, wy, currentOut),
    label(420, 330, 'balance', { anchor: 'start' }),
    label(150, 50, 'clamp', { anchor: 'middle' }),
  ];
  if (showForce) {
    body.push(arrow(wx + 24, wy, wx + 24, wy - 70, { cls: 'l2', vec: 'F' }));
    body.push(label(wx + 34, wy - 52, 'F', { anchor: 'start', italic: true, cls: 't2' }));
  }
  return svg(520, 380, alt, body.join(''));
}

// ----- Horizontal launcher (side view) -----
// The path is the real projectile path for this launch speed and height (same scale both ways):
// drop below the launch point = g x² / 2u². opts: { u, g, h } in SI units (h = the height drawn).
export function launcher(alt, { u, g, h }) {
  const [x0, y0, yFloor] = [150, 100, 330];
  const s = (yFloor - y0) / h; // pixels per metre
  const R = u * Math.sqrt((2 * h) / g);
  const xLand = x0 + R * s;
  const path = [];
  for (let i = 0; i <= 40; i++) {
    const x = (R * i) / 40;
    path.push(`${r1(x0 + x * s)},${r1(y0 + ((g * x * x) / (2 * u * u)) * s)}`);
  }
  const body = [
    // stand, clamp and launcher; the ball at the launch point
    '<path class="l3 thin" d="M60 330V40M28 330H110"/>',
    `<line class="l3 thin" x1="60" y1="${y0}" x2="82" y2="${y0}"/>`,
    `<rect class="l3 thin" x="82" y="${y0 - 10}" width="60" height="20" rx="3" fill="none"/>`,
    `<circle class="f3" cx="${x0}" cy="${y0}" r="6"/>`,
    label(112, y0 - 22, 'launcher'),
    // floor, carbon paper, plumb line and the ball's path
    `<line class="l3" x1="20" y1="${yFloor}" x2="520" y2="${yFloor}"/>`,
    `<rect class="l3 thin" x="${r1(xLand - 26)}" y="${yFloor - 5}" width="52" height="5" fill="none"/>`,
    label(xLand - 30, yFloor - 12, 'carbon paper', { anchor: 'end' }),
    `<line class="l3 thin dash" x1="${x0}" y1="${y0 + 8}" x2="${x0}" y2="${yFloor}"/>`,
    `<polyline class="l2 thin dash" points="${path.join(' ')}" fill="none"/>`,
    // launch velocity (drawn just above the path) and gravity
    arrow(x0, y0 - 24, x0 + 62, y0 - 24, { cls: 'l1', vec: 'u' }),
    label(x0 + 70, y0 - 18, 'u', { anchor: 'start', italic: true, cls: 't1' }),
    arrow(495, 150, 495, 205, { cls: 'l3 thin', vec: 'g', head: 9, half: 4.5 }),
    label(505, 185, 'g', { anchor: 'start', italic: true }),
    // dimensions h (along the plumb line) and R (along the floor)
    arrow(x0 + 14, (y0 + yFloor) / 2, x0 + 14, y0 + 2, { cls: 'l3 thin', head: 8, half: 4 }),
    arrow(x0 + 14, (y0 + yFloor) / 2, x0 + 14, yFloor - 2, { cls: 'l3 thin', head: 8, half: 4 }),
    label(x0 + 24, (y0 + yFloor) / 2 + 6, 'h', { anchor: 'start', italic: true }),
    arrow((x0 + xLand) / 2, yFloor + 16, x0, yFloor + 16, { cls: 'l3 thin', head: 8, half: 4 }),
    arrow((x0 + xLand) / 2, yFloor + 16, xLand, yFloor + 16, { cls: 'l3 thin', head: 8, half: 4 }),
    label((x0 + xLand) / 2, yFloor + 40, 'R', { italic: true }),
  ];
  return svg(540, 380, alt, body.join(''));
}

// ----- String vibrating in a standing wave, between a vibration generator and a pulley -----
// The envelope is y = ±A sin(nπx/L): nodes at both fixed ends and n loops (checked by the validator).
export function vibratingString(alt, { n = 1, labelNodes = false } = {}) {
  const [xa, xb, y0, A] = [100, 470, 120, 24];
  const env = (sign) => {
    const pts = [];
    for (let i = 0; i <= 60 * n; i++) {
      const x = xa + ((xb - xa) * i) / (60 * n);
      pts.push(`${r1(x)},${r1(y0 - sign * A * Math.sin((n * Math.PI * (x - xa)) / (xb - xa)))}`);
    }
    return `<polyline class="l1 thin wave" points="${pts.join(' ')}" fill="none"/>`;
  };
  const body = [
    // bench, vibration generator (labelled above, with a leader line) and its driving rod
    '<line class="l3" x1="20" y1="200" x2="476" y2="200"/>',
    '<rect class="l3 thin" x="40" y="150" width="60" height="50" rx="4" fill="none"/>',
    `<line class="l3 thin" x1="${xa}" y1="150" x2="${xa}" y2="${y0}"/>`,
    label(20, 56, 'vibration generator', { anchor: 'start', size: 15 }),
    '<line class="l3 thin" x1="48" y1="64" x2="62" y2="148"/>',
    // pulley on a bracket; the string drops from the pulley's edge to the hanging mass below it
    `<line class="l3 thin" x1="${xb}" y1="${y0 + 14}" x2="${xb}" y2="200"/>`,
    `<circle class="l3 thin" cx="${xb}" cy="${y0 + 14}" r="14" fill="none"/>`,
    `<line class="l3 thin" x1="${xb + 14}" y1="${y0 + 14}" x2="${xb + 14}" y2="214"/>`,
    `<rect class="l3 thin" x="${xb + 4}" y="214" width="20" height="34" fill="none"/>`,
    label(xb + 14, 237, 'M', { italic: true, size: 15 }),
    // the string at rest, and the envelope of its vibration
    `<line class="l3 thin dash string" x1="${xa}" y1="${y0}" x2="${xb}" y2="${y0}"/>`,
    env(1), env(-1),
    // length L between the fixed ends, marked below the bench
    `<line class="l3 thin dash" x1="${xa}" y1="204" x2="${xa}" y2="262"/>`,
    `<line class="l3 thin dash" x1="${xb}" y1="204" x2="${xb}" y2="262"/>`,
    arrow((xa + xb) / 2, 256, xa, 256, { cls: 'l3 thin', head: 8, half: 4 }),
    arrow((xa + xb) / 2, 256, xb, 256, { cls: 'l3 thin', head: 8, half: 4 }),
    label((xa + xb) / 2, 248, 'L', { italic: true }),
  ];
  if (labelNodes) {
    for (let k = 0; k <= n; k++) body.push(label(xa + ((xb - xa) * k) / n, y0 - A - 10, 'N', { size: 15, cls: 't2' }));
    for (let k = 0; k < n; k++) body.push(label(xa + ((xb - xa) * (k + 0.5)) / n, y0 + A + 24, 'A', { size: 15, cls: 't2' }));
  }
  return svg(560, 272, alt, body.join(''));
}

// ----- Circuits drawn from a netlist and a simple layout -----
// layout: { top: [ids left→right], bottom: [ids right→left], across: [{ id, from: [id, 't1'|'t2'], to: [id, 't1'|'t2'] }],
//           box: { around: [ids], label } }   Components on the loop are drawn horizontally.
// components: { id: { type: 'cell' | 'resistor' | 'variable-resistor' | 'ammeter' | 'voltmeter', label } }
export function circuit(alt, components, layout) {
  const [x0, x1, yTop, yBot, half] = [60, 460, 170, 280, 22];
  const term = {};
  const out = [];
  const wire = (ax, ay, bx, by) => out.push(`<line class="wire" x1="${r1(ax)}" y1="${r1(ay)}" x2="${r1(bx)}" y2="${r1(by)}"/>`);
  const place = (ids, y, leftToRight) => {
    ids.forEach((id, i) => {
      const cx = leftToRight ? x0 + ((x1 - x0) * (i + 1)) / (ids.length + 1) : x1 - ((x1 - x0) * (i + 1)) / (ids.length + 1);
      const [t1, t2] = leftToRight ? [cx - half, cx + half] : [cx + half, cx - half];
      term[id] = { t1: [t1, y], t2: [t2, y], cx, cy: y };
    });
  };
  place(layout.top, yTop, true);
  place(layout.bottom, yBot, false);
  // Loop wires: along the top, down the right, along the bottom, up the left.
  let [px, py] = [x0, yTop];
  for (const id of layout.top) { wire(px, py, ...term[id].t1); [px, py] = term[id].t2; }
  wire(px, py, x1, yTop); wire(x1, yTop, x1, yBot);
  [px, py] = [x1, yBot];
  for (const id of layout.bottom) { wire(px, py, ...term[id].t1); [px, py] = term[id].t2; }
  wire(px, py, x0, yBot); wire(x0, yBot, x0, yTop);

  // Meters connected across part of the top side, drawn above it.
  for (const m of layout.across || []) {
    const ax = term[m.from[0]][m.from[1]][0] - 16;
    const bx = term[m.to[0]][m.to[1]][0] + 16;
    const yUp = yTop - 90;
    const cx = (ax + bx) / 2;
    term[m.id] = { t1: [cx - half, yUp], t2: [cx + half, yUp], cx, cy: yUp };
    wire(ax, yTop, ax, yUp); wire(ax, yUp, cx - half, yUp); wire(cx + half, yUp, bx, yUp); wire(bx, yUp, bx, yTop);
    out.push(`<circle class="f3" cx="${r1(ax)}" cy="${yTop}" r="4"/><circle class="f3" cx="${r1(bx)}" cy="${yTop}" r="4"/>`);
  }
  if (layout.box) {
    const xsBox = layout.box.around.flatMap((id) => [term[id].t1[0], term[id].t2[0]]);
    const [bl, br] = [Math.min(...xsBox) - 8, Math.max(...xsBox) + 8];
    out.push(`<rect class="l3 thin dash" x="${r1(bl)}" y="${yTop - 34}" width="${r1(br - bl)}" height="62" fill="none"/>`);
    out.push(label((bl + br) / 2, yTop + 50, layout.box.label));
  }
  for (const [id, c] of Object.entries(components)) {
    const p = term[id];
    if (!p) throw new Error(`circuit: component ${id} is not placed in the layout`);
    out.push(`<g class="comp" data-id="${id}" data-t1="${r1(p.t1[0])} ${r1(p.t1[1])}" data-t2="${r1(p.t2[0])} ${r1(p.t2[1])}">${symbol(c.type, p.cx, p.cy)}</g>`);
    // Labels go above components on the top side (inside any dashed box) and below those on the bottom side.
    if (c.label) out.push(label(p.cx, p.cy < yBot ? p.cy - 16 : p.cy + 34, c.label, { italic: /^[A-Za-z]$/.test(c.label) }));
  }
  return svg(440, 275, alt, out.join(''), 40, 55);
}

// Circuit symbols centred on (cx, cy), 44 units wide, with wire stubs to the terminals.
function symbol(type, cx, cy) {
  const stub = (a, b) => `<line class="wire" x1="${r1(a)}" y1="${cy}" x2="${r1(b)}" y2="${cy}"/>`;
  switch (type) {
    case 'cell':
      return stub(cx - 22, cx - 4) + stub(cx + 4, cx + 22)
        + `<line class="l3" x1="${cx - 4}" y1="${cy - 16}" x2="${cx - 4}" y2="${cy + 16}"/><rect class="f3" x="${cx + 2}" y="${cy - 8}" width="5" height="16"/>`;
    case 'resistor':
    case 'variable-resistor':
      return stub(cx - 22, cx - 16) + stub(cx + 16, cx + 22)
        + `<rect class="l3 thin" x="${cx - 16}" y="${cy - 7}" width="32" height="14" fill="none"/>`
        + (type === 'variable-resistor' ? arrow(cx - 16, cy + 16, cx + 18, cy - 18, { cls: 'l3 thin', head: 8, half: 4 }) : '');
    case 'ammeter':
    case 'voltmeter':
      return stub(cx - 22, cx - 13) + stub(cx + 13, cx + 22)
        + `<circle class="l3 thin" cx="${cx}" cy="${cy}" r="13" fill="none"/>`
        + label(cx, cy + 5.5, type === 'ammeter' ? 'A' : 'V', { size: 15 });
    default:
      throw new Error(`circuit: unknown component type ${type}`);
  }
}

// ----- Instrument scale to read (T8, Phase 12) -----
// A straight scale (a spectroscope's wavelength scale, a ruler, a meter's dial drawn straight) with lines or pointers
// marked on it at the dataset's values. Students read the marks themselves, so the validator reads them back:
//   labels       <text class="sx" x=… …>value</text>          (evenly spaced, as on the instrument)
//   small ticks  <line class="scale-minor" x1=… …/>           (one per smallest division)
//   marks        <line class="l1 scale-mark" data-mark="i" x1=… …/>   (i = the row whose value it shows)
// opts: { min, max, major, minor, title, marks: [{ value, row }], width = 560 }
export function scaleReading(alt, { min, max, major, minor, title, marks, width = 560 }) {
  const [x0, x1, yAxis] = [40, width - 40, 92];
  const X = (v) => r1(x0 + ((v - min) / (max - min)) * (x1 - x0));
  const parts = [`<line class="l3 thin" x1="${x0}" y1="${yAxis}" x2="${x1}" y2="${yAxis}"/>`];
  const nMinor = Math.round((max - min) / minor);
  const dp = Math.max(0, -Math.floor(Math.log10(major) + 1e-9));
  for (let i = 0; i <= nMinor; i++) {
    const v = Number((min + i * minor).toPrecision(12));
    const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-9;
    parts.push(isMajor ? `<line class="l3 thin scale-major" x1="${X(v)}" y1="${yAxis}" x2="${X(v)}" y2="${yAxis + 14}"/>` : '');
    parts.push(`<line class="axis scale-minor" x1="${X(v)}" y1="${yAxis}" x2="${X(v)}" y2="${yAxis + 8}"/>`);
    if (isMajor) parts.push(`<text class="sx" x="${X(v)}" y="${yAxis + 34}" text-anchor="middle" font-size="16">${v.toFixed(dp)}</text>`);
  }
  // m.cls: a stylesheet class for the mark's colour (e.g. spec-violet for a spectral line); blue (l1) by default.
  for (const m of marks) parts.push(`<line class="${m.cls || 'l1'} scale-mark" data-mark="${m.row}" x1="${X(m.value)}" y1="${yAxis - 62}" x2="${X(m.value)}" y2="${yAxis}"/>`);
  parts.push(`<text x="${r1((x0 + x1) / 2)}" y="${yAxis + 58}" text-anchor="middle" font-size="16">${title}</text>`);
  return svg(width, 160, alt, parts.join(''));
}

// ----- Trolley released on a ramp, then through a light gate on a level runway (side view, not to scale) -----
// The gate is on the level section, so the trolley moves at a constant velocity while its card blocks the beam.
export function trolleyRampGate(alt) {
  const [x0, yTop, xb, yb, x1] = [30, 58, 210, 150, 540]; // ramp top, bottom of the ramp, end of the runway
  const parts = [
    // ramp, its support and the level runway
    `<line class="l3" x1="${x0}" y1="${yTop}" x2="${xb}" y2="${yb}"/>`,
    `<line class="l3 thin" x1="${x0}" y1="${yTop}" x2="${x0}" y2="${yb}"/>`,
    `<line class="l3" x1="${xb}" y1="${yb}" x2="${x1}" y2="${yb}"/>`,
    `<line class="l3 thin" x1="${x0}" y1="${yb}" x2="${xb}" y2="${yb}"/>`,
    // release mark on the ramp
    `<line class="l2" x1="72" y1="72" x2="88" y2="96"/>`,
    label(84, 52, 'release mark', { anchor: 'start', size: 15 }),
    // trolley on the level runway, with its card
    `<rect class="l3 thin" x="300" y="122" width="64" height="18" rx="3"/>`,
    `<circle class="l3 thin" cx="314" cy="144" r="6"/>`,
    `<circle class="l3 thin" cx="350" cy="144" r="6"/>`,
    `<rect class="l1 thin" x="306" y="96" width="52" height="26"/>`,
    label(332, 86, 'card', { size: 15 }),
    arrow(372, 112, 398, 112, { cls: 'l3 thin', head: 9, half: 4.5 }),
    // light gate on the runway: a frame with the beam (going into the page) marked by a dot
    `<rect class="l3 thin" x="430" y="80" width="14" height="70"/>`,
    `<circle class="f1" cx="437" cy="108" r="3.2"/>`,
    label(437, 70, 'light gate', { size: 15 }),
    label(118, 174, 'ramp', { size: 15 }),
    label(375, 174, 'level runway', { size: 15 }),
  ];
  return svg(560, 190, alt, parts.join(''));
}
