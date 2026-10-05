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
