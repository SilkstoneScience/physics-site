// Circuit builder: draws the drawing and the engine's results as SVG (plan: docs/CIRCUIT_BUILDER_PLAN.md, section 6).
// Only drawing happens here: every number shown comes from js/circuits/engine.js (formatting only).
// Symbols follow the data booklet, as on the B.5 page. One grid square is G = 20 SVG units; a two-terminal
// component spans 4 squares, with its terminals at x = ±40 before rotation.
(function (root) {
  'use strict';
  const { components: C, model: M, engine: E } = root.Circuits;
  const G = 20;

  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const n = (x) => Math.round(x * 100) / 100;

  // A number with an SI prefix and 3 significant figures: 4700 → "4.7 k".
  function si(v, unit) {
    if (!Number.isFinite(v)) return `∞ ${unit}`;
    const a = Math.abs(v);
    const [d, p] = a >= 1e6 ? [1e6, 'M'] : a >= 1e3 ? [1e3, 'k'] : a >= 1 || a === 0 ? [1, ''] : a >= 1e-3 ? [1e-3, 'm'] : [1e-6, 'µ'];
    return `${Number((v / d).toPrecision(3))} ${p}${unit}`;
  }

  // ---------------- symbols (local coordinates, terminals at x = ±40) ----------------
  const line = (x1, y1, x2, y2, cls = '') => `<line class="ck-s${cls ? ` ${cls}` : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const leads = (a, b) => line(-40, 0, a, 0) + line(b, 0, 40, 0);
  const arrow = (x1, y1, x2, y2) => line(x1, y1, x2, y2, 'ck-arrow');
  const box = (w = 32, h = 14) => `<rect class="ck-s ck-body" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}"/>`;

  function symbol(type, p, extra = {}) {
    switch (type) {
      case 'cell':
        return leads(-5, 5) + line(-5, -7, -5, 7, 'ck-thick') + line(5, -14, 5, 14);
      case 'battery':
        return leads(-14, 14) + line(-14, -7, -14, 7, 'ck-thick') + line(-8, -14, -8, 14) + line(-8, 0, 8, 0, 'ck-dash') + line(8, -7, 8, 7, 'ck-thick') + line(14, -14, 14, 14);
      case 'resistor':
        return leads(-16, 16) + box();
      case 'variable':
        return leads(-16, 16) + box() + arrow(-14, 12, 13, -12);
      case 'potentiometer':
        return leads(-16, 16) + box() + arrow(0, -40, 0, -8);
      case 'thermistor':
        return leads(-16, 16) + box() + `<polyline class="ck-s" points="-16,11 12,-11 20,-11"/>`;
      case 'ldr':
        return leads(-19, 19) + `<circle class="ck-s ck-body" r="19"/>` + box(24, 12) + arrow(-30, -30, -17, -17) + arrow(-20, -34, -7, -21);
      case 'switch': {
        const lever = p && p.closed ? line(-12, 0, 12, 0, 'ck-lever') : line(-12, 0, 10, -13, 'ck-lever');
        return leads(-12, 12) + lever + `<circle class="ck-contact" cx="-12" r="2.5"/><circle class="ck-contact" cx="12" r="2.5"/>`;
      }
      case 'lamp': {
        const b = Math.max(0, Math.min(1, Math.sqrt(extra.brightness || 0)));
        const halo = (extra.brightness || 0) > 1.5 ? `<circle class="ck-halo" r="17"/>` : '';
        return halo + leads(-10, 10) + `<circle class="ck-s ck-body" r="10"/>` + (b > 0.01 ? `<circle class="ck-glow" r="9.2" style="opacity:${n(b)}"/>` : '') +
          line(-7.07, -7.07, 7.07, 7.07) + line(-7.07, 7.07, 7.07, -7.07);
      }
      case 'ammeter':
      case 'voltmeter':
        return leads(-11, 11) + `<circle class="ck-s ck-body" r="11"/><circle class="ck-pos" cx="-40" r="3.2"/><circle class="ck-com" cx="40" r="3.2"/>`;
      default:
        return box();
    }
  }
  // The letter inside a meter, drawn upright.
  const LETTER = { ammeter: 'A', voltmeter: 'V' };

  // The text beside a component: its label and its setting.
  function valueText(c) {
    const p = c.params;
    switch (c.type) {
      case 'cell': case 'battery': return `${si(p.emf, 'V')}${p.r > 0 ? `, r = ${si(p.r, 'Ω')}` : ''}`;
      case 'resistor': case 'variable': return si(p.R, 'Ω');
      case 'potentiometer': return si(p.R, 'Ω');
      case 'lamp': return p.model === 'filament' ? `${si(p.Vrated, 'V')}, ${si(p.Prated, 'W')}` : si(p.R, 'Ω');
      case 'thermistor': return `${Number(p.temp.toPrecision(3))} °C`;
      case 'ldr': return `${Number(p.lux.toPrecision(3))} lx`;
      case 'ammeter': return p.ideal ? '' : si(p.r, 'Ω');
      case 'voltmeter': return p.ideal ? '' : si(p.R, 'Ω');
      default: return '';
    }
  }

  // Where text goes beside a component: away from its axis (and away from a potentiometer's slider).
  function sides(c) {
    const vertical = c.rot === 90 || c.rot === 270;
    const wiperUp = c.type === 'potentiometer' && c.rot === 0;
    const wiperRight = c.type === 'potentiometer' && c.rot === 90;
    const wiperLeft = c.type === 'potentiometer' && c.rot === 270;
    if (!vertical) return { label: wiperUp ? 'below' : 'above', reading: wiperUp ? 'above' : 'below' };
    return { label: wiperRight ? 'left' : 'right', reading: wiperRight || wiperLeft ? (wiperRight ? 'right' : 'left') : 'left' };
  }
  function place(c, side, dist) {
    const cx = c.x * G;
    const cy = c.y * G;
    switch (side) {
      case 'above': return { x: cx, y: cy - dist, anchor: 'middle', base: 'auto' };
      case 'below': return { x: cx, y: cy + dist, anchor: 'middle', base: 'hanging' };
      case 'left': return { x: cx - dist, y: cy, anchor: 'end', base: 'middle' };
      default: return { x: cx + dist, y: cy, anchor: 'start', base: 'middle' };
    }
  }

  // Potential colouring: low potential blue, high red.
  function potentialColour(t) {
    const a = [42, 120, 214];
    const b = [227, 73, 72];
    const m = a.map((x, i) => Math.round(x + (b[i] - x) * Math.max(0, Math.min(1, t))));
    return `rgb(${m.join(',')})`;
  }

  // ---------------- the whole drawing ----------------
  // ui: { selected: {components, wires, junctions} (Sets), highlight (Set of ids), show: {arrows, wireCurrent, potential},
  //       nl (netlist of the committed drawing), ghost: {type, x, y, rot}, preview: {points, target}, box: {x0,y0,x1,y1}, hover: [x, y] }
  function drawing(d, result, ui) {
    const sel = ui.selected;
    const res = (result && result.components) || {};
    const out = { wires: [], comps: [], text: [], dots: [], over: [] };
    const pt = (p) => `${n(p[0] * G)},${n(p[1] * G)}`;

    // Potentials for colouring, by net.
    let vmin = 0;
    let vmax = 0;
    const netOf = ui.nl ? ui.nl.pointNet : {};
    const keyOf = (w, which) => {
      const e = w[which];
      return e.c !== undefined ? `c:${e.c}:${e.t}` : e.j !== undefined ? `j:${e.j}` : `f:${w.id}:${which}`;
    };
    if (ui.show.potential && result && result.nets) {
      const vs = result.nets.filter(Number.isFinite);
      if (vs.length) { vmin = Math.min(...vs); vmax = Math.max(...vs); }
    }

    // Wires.
    const connections = new Map(); // point key -> number of wire ends there
    for (const w of d.wires) {
      const path = M.wirePath(d, w);
      if (path.length < 2) continue;
      for (const which of ['from', 'to']) { const k = keyOf(w, which); connections.set(k, (connections.get(k) || 0) + 1); }
      const wr = result && result.wires && result.wires[w.id];
      const inf = wr && !Number.isFinite(wr.I);
      let style = '';
      if (ui.show.potential && result && result.nets && netOf[keyOf(w, 'from')] !== undefined && vmax > vmin) {
        style = ` style="stroke:${potentialColour((result.nets[netOf[keyOf(w, 'from')]] - vmin) / (vmax - vmin))}"`;
      }
      const cls = `ck-wire${sel.wires.has(w.id) ? ' ck-sel' : ''}${inf ? ' ck-inf' : ''}${ui.highlight.has(w.id) ? ' ck-hl' : ''}`;
      out.wires.push(`<polyline class="${cls}" data-wire="${esc(w.id)}" points="${path.map(pt).join(' ')}"${style}/>`);
      // Current: an arrow on the longest segment, and the value.
      if (wr && (ui.show.arrows || ui.show.wireCurrent) && Math.abs(wr.I) > 1e-9) {
        let best = 0;
        let len = -1;
        for (let i = 0; i + 1 < path.length; i++) { const l = Math.abs(path[i + 1][0] - path[i][0]) + Math.abs(path[i + 1][1] - path[i][1]); if (l > len) { len = l; best = i; } }
        if (len >= 1) {
          let [a, b] = [path[best], path[best + 1]];
          if (wr.I < 0) [a, b] = [b, a];
          const mx = (a[0] + b[0]) / 2 * G;
          const my = (a[1] + b[1]) / 2 * G;
          const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
          if (ui.show.arrows) out.over.push(`<path class="ck-current${inf ? ' ck-inf' : ''}" d="M -6 -5 L 5 0 L -6 5 z" transform="translate(${n(mx)} ${n(my)}) rotate(${n(ang)})"/>`);
          if (ui.show.wireCurrent) {
            const horizontal = a[1] === b[1];
            out.text.push(`<text class="ck-wirei" x="${n(mx + (horizontal ? 0 : 8))}" y="${n(my + (horizontal ? -8 : 4))}" text-anchor="${horizontal ? 'middle' : 'start'}">${inf ? '∞ A' : esc(si(Math.abs(wr.I), 'A'))}</text>`);
          }
        }
      }
      // Loose ends.
      for (const which of ['from', 'to']) if (w[which].free) out.dots.push(`<circle class="ck-loose" cx="${n(w[which].free[0] * G)}" cy="${n(w[which].free[1] * G)}" r="4.5"/>`);
      // Handles of a selected wire.
      if (sel.wires.has(w.id) && sel.wires.size === 1) {
        for (const p of w.via || []) out.over.push(`<rect class="ck-handle" x="${n(p[0] * G - 5)}" y="${n(p[1] * G - 5)}" width="10" height="10"/>`);
        for (let i = 0; i + 1 < path.length; i++) {
          const mx = (path[i][0] + path[i + 1][0]) / 2;
          const my = (path[i][1] + path[i + 1][1]) / 2;
          if (Math.abs(path[i + 1][0] - path[i][0]) + Math.abs(path[i + 1][1] - path[i][1]) >= 2) out.over.push(`<circle class="ck-handle ck-mid" cx="${n(mx * G)}" cy="${n(my * G)}" r="4.5"/>`);
        }
        for (const p of [path[0], path[path.length - 1]]) out.over.push(`<circle class="ck-handle ck-endh" cx="${n(p[0] * G)}" cy="${n(p[1] * G)}" r="6"/>`);
      }
    }

    // Components.
    for (const c of d.components) {
      const r = res[c.id] || {};
      const isSel = sel.components.has(c.id);
      const cls = `ck-comp${isSel ? ' ck-sel' : ''}${ui.highlight.has(c.id) ? ' ck-hl' : ''}`;
      const tall = c.type === 'potentiometer' ? [46, 66] : c.type === 'ldr' ? [24, 46] : [17, 34]; // [top, height], clear of the label
      const back = isSel || ui.highlight.has(c.id) ? `<rect class="ck-selbox" x="-46" y="-${tall[0]}" width="92" height="${tall[1]}" rx="6"/>` : '';
      out.comps.push(`<g class="${cls}" data-comp="${esc(c.id)}" transform="translate(${c.x * G} ${c.y * G}) rotate(${c.rot || 0})">${back}${symbol(c.type, c.params, { brightness: r.brightness })}</g>`);
      if (LETTER[c.type]) out.text.push(`<text class="ck-letter" x="${c.x * G}" y="${c.y * G}" text-anchor="middle" dominant-baseline="central">${LETTER[c.type]}</text>`);
      const s = sides(c);
      const near = c.type === 'ldr' ? (s.label === 'above' || s.label === 'left' ? 42 : 28) : 22; // clear of the LDR's light arrows (upper left)
      const lp = place(c, s.label, near);
      const value = valueText(c);
      out.text.push(`<text class="ck-label" x="${n(lp.x)}" y="${n(lp.y)}" text-anchor="${lp.anchor}" dominant-baseline="${lp.base}"><tspan class="ck-name">${esc(c.label)}</tspan>${value ? ` <tspan>${esc(value)}</tspan>` : ''}</text>`);
      // Meter display.
      if (r.reading) {
        const rp = place(c, s.reading, 20);
        const text = `${r.reading.text}${r.reading.ol ? '' : ` ${r.reading.unit}`}`;
        const w = 10 + text.length * 7.6;
        const x = rp.anchor === 'middle' ? rp.x - w / 2 : rp.anchor === 'end' ? rp.x - w : rp.x;
        const y = rp.base === 'hanging' ? rp.y : rp.base === 'auto' ? rp.y - 20 : rp.y - 10;
        out.text.push(`<g class="ck-reading${r.reading.ol ? ' ck-ol' : ''}" data-reading-for="${esc(c.id)}"><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="20" rx="4"/><text x="${n(x + w / 2)}" y="${n(y + 10.5)}" text-anchor="middle" dominant-baseline="central">${esc(text)}</text></g>`);
      }
      // Terminals: a hint circle where nothing is connected yet.
      for (let t = 0; t < C.TYPES[c.type].terminals.length; t++) {
        const p = C.terminalPosition(c, t);
        const k = `c:${c.id}:${t}`;
        const count = connections.get(k) || 0;
        if (count === 0) out.dots.push(`<circle class="ck-term" cx="${p[0] * G}" cy="${p[1] * G}" r="4"/>`);
        else if (count >= 2) out.dots.push(`<circle class="ck-dot" cx="${p[0] * G}" cy="${p[1] * G}" r="3.6"/>`);
      }
    }
    // Junction dots where three or more wires meet.
    for (const j of d.junctions) {
      const count = connections.get(`j:${j.id}`) || 0;
      const isSel = sel.junctions.has(j.id);
      if (count >= 3) out.dots.push(`<circle class="ck-dot" cx="${j.x * G}" cy="${j.y * G}" r="3.6"/>`);
      else if (count <= 1) out.dots.push(`<circle class="ck-loose" cx="${j.x * G}" cy="${j.y * G}" r="4.5"/>`);
      if (isSel) out.over.push(`<circle class="ck-selring" cx="${j.x * G}" cy="${j.y * G}" r="8"/>`);
    }

    // Overlays: a component being placed, a wire being drawn, the snap target, the selection box.
    if (ui.ghost) {
      const c = { ...ui.ghost, params: C.normalise(ui.ghost.type, {}) };
      out.over.push(`<g class="ck-ghost" transform="translate(${c.x * G} ${c.y * G}) rotate(${c.rot || 0})">${symbol(c.type, c.params)}</g>`);
    }
    if (ui.preview && ui.preview.points.length > 1) out.over.push(`<polyline class="ck-preview" points="${ui.preview.points.map(pt).join(' ')}"/>`);
    if (ui.preview && ui.preview.target) out.over.push(`<circle class="ck-target" cx="${n(ui.preview.target[0] * G)}" cy="${n(ui.preview.target[1] * G)}" r="9"/>`);
    if (ui.box) {
      const { x0, y0, x1, y1 } = ui.box;
      out.over.push(`<rect class="ck-boxsel" x="${n(Math.min(x0, x1) * G)}" y="${n(Math.min(y0, y1) * G)}" width="${n(Math.abs(x1 - x0) * G)}" height="${n(Math.abs(y1 - y0) * G)}"/>`);
    }
    return `<g class="ck-l-wires">${out.wires.join('')}</g><g class="ck-l-comps">${out.comps.join('')}</g><g class="ck-l-dots">${out.dots.join('')}</g><g class="ck-l-text">${out.text.join('')}</g><g class="ck-l-over">${out.over.join('')}</g>`;
  }

  // A small picture of a component for the toolbox.
  function icon(type) {
    const p = C.normalise(type, {});
    const tall = type === 'potentiometer' || type === 'ldr';
    const letter = LETTER[type] ? `<text class="ck-letter" x="0" y="0" text-anchor="middle" dominant-baseline="central">${LETTER[type]}</text>` : '';
    return `<svg class="ck-icon" viewBox="-44 ${tall ? -42 : -24} 88 ${tall ? 66 : 48}" aria-hidden="true" focusable="false"><g>${symbol(type, p, { brightness: 0 })}</g>${letter}</svg>`;
  }

  const api = { G, symbol, drawing, icon, si, valueText, potentialColour };
  (root.Circuits = root.Circuits || {}).render = api;
})(typeof window !== 'undefined' ? window : globalThis);
