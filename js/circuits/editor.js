// Circuit builder: the Free Build editor (plan: docs/CIRCUIT_BUILDER_PLAN.md, section 6).
// Toolbox, drag and drop, grid workspace, rotation, terminals, wire drawing, selection and editing, deletion,
// validation messages and live simulation. One direction only: an action changes the drawing (js/circuits/model.js,
// with undo), then the netlist and the engine work out the physics, then render.js draws it. Nothing electrical
// is calculated here. Pointer events throughout (mouse, pen and touch), since HTML drag-and-drop doesn't work on tablets.
(function (root) {
  'use strict';
  const { components: C, model: M, netlist: N, engine: E, render: R } = root.Circuits;
  const G = R.G;
  const ORDER = ['cell', 'battery', 'resistor', 'variable', 'potentiometer', 'lamp', 'thermistor', 'ldr', 'switch', 'ammeter', 'voltmeter'];
  const TAP = 6; // pointer movement (CSS px) that still counts as a tap
  const ROTATE_BUTTONS = '<button type="button" class="ck-btn" data-do="rotate-acw" title="Rotate anticlockwise (Shift+R)">⟲ Anticlockwise</button><button type="button" class="ck-btn" data-do="rotate" title="Rotate clockwise (R)">⟳ Clockwise</button>';
  const same = (p, q) => p && q && p[0] === q[0] && p[1] === q[1];
  const round = (p) => [Math.round(p[0]), Math.round(p[1])];
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const endsOf = (w) => [w.from, w.to];
  const endKey = (e) => (e.c !== undefined ? `c:${e.c}:${e.t}` : e.j !== undefined ? `j:${e.j}` : '');

  // A number typed by a student: "4.7", "10k", "2.2 M", "500m", "1e-3".
  function parseValue(text) {
    const m = String(text).trim().replace(',', '.').match(/^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)\s*([kKMmµu]?)\s*[A-Za-zΩ°]*$/);
    if (!m) return null;
    const mult = { '': 1, k: 1e3, K: 1e3, M: 1e6, m: 1e-3, 'µ': 1e-6, u: 1e-6 }[m[2]];
    const v = parseFloat(m[1]) * mult;
    return Number.isFinite(v) ? v : null;
  }
  const show3 = (v) => (Number.isFinite(v) ? String(Number(v.toPrecision(4))) : '');

  function create(host, opts = {}) {
    const store = M.createStore(opts.drawing);
    const sel = { components: new Set(), wires: new Set(), junctions: new Set() };
    const show = { arrows: false, wireCurrent: false, potential: false, working: false };
    let highlight = new Set();
    const view = { x: -14, y: -9, z: 1.15 }; // top-left corner (grid squares) and CSS px per SVG unit
    // Challenge constraints: locked parts can't be moved, turned, changed or deleted; fixed parts can't be changed;
    // hidden parts show "?" instead of their values. toolbox: { type: { count, params, fixed } } or null (everything).
    const locked = new Set(opts.locked || []);
    const fixed = new Set([...(opts.fixed || []), ...(opts.locked || []), ...(opts.hidden || [])]);
    const hidden = new Set(opts.hidden || []);
    const toolbox = opts.toolbox || null;
    const startIds = new Set(((opts.drawing && opts.drawing.components) || []).map((c) => c.id));
    const listeners = []; // window and document listeners, removed by destroy()
    const listen = (target, type, fn, o) => { target.addEventListener(type, fn, o); listeners.push([target, type, fn, o]); };
    let mode = { kind: 'select' }; // or { kind: 'place', type, rot } or { kind: 'wire', from, fromWire, via }
    let gesture = null;
    let toolGesture = null;
    let preview = null; // the drawing shown during a drag, before it is committed
    let ghost = null;
    let insertion = null; // { wire, x, y, rot }: where a held component would go into a wire
    let wirePreview = null;
    let box = null;
    let lastTap = null;
    let nl = null;
    let result = null;
    const pointers = new Map();
    let pinch = null;

    // ---------------- the page structure ----------------
    host.classList.add('ck-app');
    if (opts.readOnly) host.classList.add('ck-readonly'); // a predict challenge: look, select and pan only
    host.innerHTML = `
      <div class="ck-toolbar" role="toolbar" aria-label="Edit">
        <div class="ck-group">
          <button type="button" class="ck-btn" data-act="undo" title="Undo (Ctrl+Z)">↶ Undo</button>
          <button type="button" class="ck-btn" data-act="redo" title="Redo (Ctrl+Y)">↷ Redo</button>
          <button type="button" class="ck-btn ck-icon-btn" data-act="rotate-acw" aria-label="Rotate anticlockwise" title="Rotate anticlockwise (Shift+R)">⟲</button>
          <button type="button" class="ck-btn ck-icon-btn" data-act="rotate" aria-label="Rotate clockwise" title="Rotate clockwise (R)">⟳</button>
          <button type="button" class="ck-btn" data-act="delete" title="Delete (Delete key)">✕ Delete</button>
          <button type="button" class="ck-btn" data-act="clear">${opts.resetTo ? '↺ Start again' : 'Clear all'}</button>
        </div>
        <div class="ck-group">
          <button type="button" class="ck-btn ck-icon-btn" data-act="zoom-out" aria-label="Zoom out" title="Zoom out">−</button>
          <button type="button" class="ck-btn ck-icon-btn" data-act="zoom-in" aria-label="Zoom in" title="Zoom in">+</button>
          <button type="button" class="ck-btn" data-act="fit" title="Fit the circuit in view">Fit</button>
          <button type="button" class="ck-btn" data-act="board" aria-pressed="false" title="Show on the board: the builder fills the screen">⛶ Board</button>
        </div>
        <div class="ck-group ck-shows">
          <label class="ck-check"><input type="checkbox" data-show="arrows"> Current arrows</label>
          <label class="ck-check"><input type="checkbox" data-show="wireCurrent"> Current in wires</label>
          <label class="ck-check"><input type="checkbox" data-show="potential"> Potential colours</label>
          ${opts.noWorking ? '' : '<label class="ck-check"><input type="checkbox" data-show="working"> Show the working</label>'}
          <span class="ck-legend" hidden></span>
        </div>
      </div>
      <div class="ck-layout">
        <div class="ck-toolbox" role="group" aria-label="Components: drag one onto the grid, or tap it and then tap the grid">
          ${ORDER.filter((t) => !opts.toolbox || opts.toolbox[t]).map((t) => `<button type="button" class="ck-tool" data-type="${t}" title="${esc(C.TYPES[t].name)}">${R.icon(t)}<span>${esc(C.TYPES[t].name)}${opts.toolbox && opts.toolbox[t].params ? `<br><small>${esc(R.valueText({ type: t, params: C.normalise(t, opts.toolbox[t].params) }))}</small>` : ''}</span>${opts.toolbox && opts.toolbox[t].count !== undefined ? '<span class="ck-left"></span>' : ''}</button>`).join('')}
          ${opts.toolbox && !Object.keys(opts.toolbox).length ? '<p class="ck-small">No extra parts for this challenge: use the wires.</p>' : ''}
        </div>
        <div class="ck-stage">
          <svg class="ck-svg" role="application" aria-label="Circuit workspace" tabindex="0" preserveAspectRatio="xMinYMin meet">
            <defs><marker id="ck-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path class="ck-ahead" d="M0,0 L10,5 L0,10 z"/></marker><pattern id="ck-grid" width="${G}" height="${G}" patternUnits="userSpaceOnUse"><circle class="ck-griddot" cx="0" cy="0" r="1.2"/><circle class="ck-griddot" cx="${G}" cy="0" r="1.2"/><circle class="ck-griddot" cx="0" cy="${G}" r="1.2"/><circle class="ck-griddot" cx="${G}" cy="${G}" r="1.2"/></pattern></defs>
            <rect class="ck-gridbg" x="-200000" y="-200000" width="400000" height="400000" fill="url(#ck-grid)"/>
            <g class="ck-content"></g>
          </svg>
          <p class="ck-hint" aria-live="polite"></p>
        </div>
        <div class="ck-side">
          <section class="ck-panel ck-inspector" aria-label="Selected component"></section>
          <section class="ck-panel ck-working" aria-label="How the readings are worked out" aria-live="polite" hidden></section>
          <section class="ck-panel ck-status" aria-label="Circuit check"><h3>Circuit check</h3><ul class="ck-diags"></ul></section>
        </div>
      </div>
      <details class="ck-describe"><summary>Text description of the circuit</summary><div class="ck-describe-body"></div></details>`;
    const $ = (s) => host.querySelector(s);
    const svg = $('.ck-svg');
    const content = $('.ck-content');
    const hint = $('.ck-hint');
    const inspectorEl = $('.ck-inspector');
    const diagsEl = $('.ck-diags');
    const describeEl = $('.ck-describe-body');
    const legend = $('.ck-legend');

    // ---------------- coordinates ----------------
    const rect = () => svg.getBoundingClientRect();
    const clientToGrid = (cx, cy) => { const r = rect(); return [view.x + (cx - r.left) / view.z / G, view.y + (cy - r.top) / view.z / G]; };
    const gridToClient = (gx, gy) => { const r = rect(); return [r.left + (gx - view.x) * G * view.z, r.top + (gy - view.y) * G * view.z]; };
    const radius = (type) => (type === 'mouse' ? 10 : 20) / (view.z * G); // hit radius in grid squares
    const overSvg = (cx, cy) => { const r = rect(); return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom; };
    const current = () => preview || store.drawing;

    // ---------------- what is under the pointer ----------------
    function hitTest(p, rg) {
      const d = current();
      const near = (q, r = rg) => Math.hypot(q[0] - p[0], q[1] - p[1]) <= r;
      // Handles of the one selected wire come first, so its ends can be moved off a terminal.
      if (sel.wires.size === 1 && !sel.components.size) {
        const w = d.wires.find((x) => sel.wires.has(x.id));
        const path = w ? M.wirePath(d, w) : [];
        if (path.length > 1) {
          if (near(path[0])) return { kind: 'wireEnd', wire: w.id, which: 'from' };
          if (near(path[path.length - 1])) return { kind: 'wireEnd', wire: w.id, which: 'to' };
          const vi = (w.via || []).findIndex((q) => near(q));
          if (vi >= 0) return { kind: 'via', wire: w.id, index: vi };
          for (let i = 0; i + 1 < path.length; i++) {
            const len = Math.abs(path[i + 1][0] - path[i][0]) + Math.abs(path[i + 1][1] - path[i][1]);
            if (len >= 2 && near([(path[i][0] + path[i + 1][0]) / 2, (path[i][1] + path[i + 1][1]) / 2])) return { kind: 'mid', wire: w.id, segment: i };
          }
        }
      }
      let best = null;
      for (const c of d.components) {
        for (let t = 0; t < C.TYPES[c.type].terminals.length; t++) {
          const q = C.terminalPosition(c, t);
          const dist = Math.hypot(q[0] - p[0], q[1] - p[1]);
          if (dist <= rg && (!best || dist < best.dist)) best = { kind: 'terminal', end: { c: c.id, t }, pos: q, dist };
        }
      }
      if (best) return best;
      for (const j of d.junctions) if (near([j.x, j.y])) return { kind: 'junction', id: j.id, end: { j: j.id }, pos: [j.x, j.y] };
      for (const w of d.wires) for (const which of ['from', 'to']) if (w[which].free && near(w[which].free)) return { kind: 'wireEnd', wire: w.id, which };
      for (let i = d.components.length - 1; i >= 0; i--) {
        const c = d.components[i];
        const b = M.componentBox(c);
        if (p[0] >= b.x0 - 0.2 && p[0] <= b.x1 + 0.2 && p[1] >= b.y0 - 0.2 && p[1] <= b.y1 + 0.2) return { kind: 'component', id: c.id };
      }
      let bw = null;
      for (const w of d.wires) {
        const q = M.nearestOnWire(d, w, p);
        if (q && q.dist <= rg && (!bw || q.dist < bw.dist)) bw = { kind: 'wire', id: w.id, point: q.point, dist: q.dist };
      }
      return bw;
    }
    // Where a wire being drawn would attach: a terminal, a junction or a point on a wire.
    function findTarget(p, rg, exclude = {}) {
      const h = hitTest(p, rg);
      if (!h) return null;
      if (h.kind === 'terminal' || h.kind === 'junction') {
        if (exclude.end && endKey(exclude.end) === endKey(h.end)) return null;
        return { end: h.end, pos: h.pos };
      }
      if (h.kind === 'wire' && h.id !== exclude.wire) return { wire: h.id, point: h.point, pos: h.point };
      if (h.kind === 'component') { // a component's body: its nearest terminal, if close enough
        const c = current().components.find((x) => x.id === h.id);
        let bt = null;
        for (let t = 0; t < C.TYPES[c.type].terminals.length; t++) {
          const q = C.terminalPosition(c, t);
          const dist = Math.hypot(q[0] - p[0], q[1] - p[1]);
          if (dist <= Math.max(rg * 2, 1.2) && (!bt || dist < bt.dist)) bt = { end: { c: c.id, t }, pos: q, dist };
        }
        if (bt && !(exclude.end && endKey(exclude.end) === endKey(bt.end))) return bt;
      }
      return null;
    }
    // Turns a target into a wire end inside draft d (splitting a wire if needed).
    function attach(d, target) {
      if (!target) return null;
      if (target.end) return target.end;
      // The wire may have been split already in this change: find whichever wire now holds the point.
      const holders = d.wires.filter((w) => { const path = M.wirePath(d, w); return path.some((q, i) => i + 1 < path.length && M.segDistance(target.point, q, path[i + 1]) < 1e-9); });
      const w = holders.find((x) => x.id === target.wire) || holders[0];
      return w ? M.ops.splitWire(d, w.id, target.point) : null;
    }
    function startPos(m) {
      if (m.fromWire) return m.fromWire.point;
      return M.endPos(current(), m.from);
    }
    // Horizontal and vertical lines through the given points (for the wire being drawn).
    function orth(points) {
      const out = [points[0]];
      for (let i = 1; i < points.length; i++) {
        const p = out[out.length - 1];
        const q = points[i];
        if (p[0] !== q[0] && p[1] !== q[1]) out.push([q[0], p[1]]);
        out.push(q);
      }
      return out;
    }

    // ---------------- committing changes ----------------
    // In a challenge the toolbox may offer only some types, a limited number of each, with set (and fixed) values.
    const preset = (type) => (toolbox && toolbox[type]) || {};
    const left = (type) => {
      if (!toolbox) return Infinity;
      if (!toolbox[type]) return 0;
      const extra = store.drawing.components.filter((c) => c.type === type && !startIds.has(c.id)).length;
      return (toolbox[type].count ?? Infinity) - extra;
    };
    function addAt(type, p, rot = 0) {
      if (left(type) <= 0) return null;
      const id = store.change('add', (d) => {
        const nid = M.ops.addComponent(d, type, p[0], p[1], preset(type).params);
        if (rot) M.ops.rotate(d, [nid], rot / 90);
        M.ops.joinAt(d, [nid]);
        return nid;
      });
      if (preset(type).fixed) fixed.add(id);
      selectOnly({ components: [id] });
      return id;
    }
    // A new component put straight into a wire, in series.
    function addInto(type, ins) {
      if (left(type) <= 0) return null;
      const id = store.change('insert', (d) => {
        const nid = M.ops.addComponent(d, type, ins.x, ins.y, preset(type).params);
        d.components.find((c) => c.id === nid).rot = ins.rot;
        M.ops.insertIntoWire(d, nid, ins.wire);
        return nid;
      });
      if (preset(type).fixed) fixed.add(id);
      selectOnly({ components: [id] });
      return id;
    }
    const movable = (ids) => ids.filter((id) => !locked.has(id));
    const wiredTo = (id) => store.drawing.wires.some((w) => endsOf(w).some((e) => e.c === id));
    function commitWire(m, target, via) {
      store.change('wire', (d) => {
        const a = m.fromWire ? attach(d, { wire: m.fromWire.id, point: m.fromWire.point }) : m.from;
        const b = target.free ? { free: target.free } : attach(d, target);
        if (!a || !b || (endKey(a) && endKey(a) === endKey(b))) return;
        M.ops.addWire(d, a, b, cleanVia(via, M.endPos(d, a), M.endPos(d, b)));
        M.ops.tidy(d);
      });
    }
    // Bends without repeats, and without points on a straight line between their neighbours.
    function cleanVia(via, a, b) {
      const pts = [a, ...via, b].filter((p, i, arr) => i === 0 || !same(p, arr[i - 1]));
      const out = [];
      for (let i = 1; i < pts.length - 1; i++) {
        const [p, q, r] = [out.length ? out[out.length - 1] : pts[0], pts[i], pts[i + 1]];
        const straight = (p[0] === q[0] && q[0] === r[0]) || (p[1] === q[1] && q[1] === r[1]);
        if (!straight) out.push(q);
      }
      return out;
    }
    function deleteSelection() {
      const comps = movable([...sel.components]);
      if (!comps.length && !sel.wires.size && !sel.junctions.size) return;
      store.change('delete', (d) => M.ops.remove(d, { components: comps, wires: [...sel.wires], junctions: [...sel.junctions] }));
      clearSelection();
    }
    // dir = 1: a quarter turn clockwise; dir = −1: anticlockwise.
    function rotateSelection(dir = 1) {
      if (mode.kind === 'place') { mode.rot = (((mode.rot || 0) + 90 * dir) % 360 + 360) % 360; if (ghost) ghost.rot = mode.rot; render(); return; }
      const ids = movable([...sel.components]);
      if (!ids.length) return;
      store.change('rotate', (d) => { M.ops.rotate(d, ids, dir); M.ops.joinAt(d, ids); });
    }
    function toggleSwitch(id) {
      const c = store.drawing.components.find((x) => x.id === id);
      if (!c || locked.has(id)) return;
      store.change('switch', (d) => M.ops.setParam(d, id, 'closed', !c.params.closed));
    }

    // ---------------- selection ----------------
    function clearSelection() { sel.components.clear(); sel.wires.clear(); sel.junctions.clear(); highlight = new Set(); }
    function selectOnly(s) {
      clearSelection();
      for (const id of s.components || []) sel.components.add(id);
      for (const id of s.wires || []) sel.wires.add(id);
      for (const id of s.junctions || []) sel.junctions.add(id);
    }
    function toggleIn(set, id, additive) {
      if (!additive) { clearSelection(); set.add(id); return; }
      if (set.has(id)) set.delete(id); else set.add(id);
    }
    function selectionOf() { return { components: [...sel.components], wires: [...sel.wires], junctions: [...sel.junctions] }; }

    // ---------------- pointer input on the workspace ----------------
    svg.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      ev.preventDefault();
      svg.focus({ preventScroll: true });
      pointers.set(ev.pointerId, [ev.clientX, ev.clientY]);
      try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* synthetic events can't be captured */ }
      if (pointers.size === 2) { startPinch(); return; }
      if (pointers.size > 2) return;
      const p = clientToGrid(ev.clientX, ev.clientY);
      const down = { cx: ev.clientX, cy: ev.clientY, p, id: ev.pointerId, type: ev.pointerType, add: ev.shiftKey || ev.ctrlKey || ev.metaKey, shift: ev.shiftKey };
      if (mode.kind === 'wire') gesture = { kind: 'wire-tap', down, moved: false };
      else if (mode.kind === 'place') gesture = { kind: 'place-tap', down, moved: false };
      else gesture = { kind: 'pending', down, hit: hitTest(p, radius(ev.pointerType)), moved: false };
    });
    listen(window, 'pointermove', (ev) => {
      if (toolGesture && ev.pointerId === toolGesture.id) { toolMove(ev); return; }
      if (pointers.has(ev.pointerId)) pointers.set(ev.pointerId, [ev.clientX, ev.clientY]);
      if (pinch) { pinchMove(); return; }
      const p = clientToGrid(ev.clientX, ev.clientY);
      if (!gesture) { if (overSvg(ev.clientX, ev.clientY)) hoverMove(p, ev.pointerType); return; }
      if (ev.pointerId !== gesture.down.id) return;
      if (!gesture.moved && Math.hypot(ev.clientX - gesture.down.cx, ev.clientY - gesture.down.cy) > TAP) { gesture.moved = true; if (gesture.kind === 'pending') beginDrag(); }
      if (gesture.moved) dragMove(p, ev);
    });
    listen(window, 'pointerup', (ev) => {
      if (toolGesture && ev.pointerId === toolGesture.id) { toolUp(ev); return; }
      const wasPinch = !!pinch;
      pointers.delete(ev.pointerId);
      if (pinch) { if (pointers.size < 2) pinch = null; return; }
      if (wasPinch || !gesture || ev.pointerId !== gesture.down.id) return;
      const p = clientToGrid(ev.clientX, ev.clientY);
      const g = gesture;
      gesture = null;
      finish(g, p, ev);
    });
    listen(window, 'pointercancel', (ev) => {
      pointers.delete(ev.pointerId);
      if (toolGesture && ev.pointerId === toolGesture.id) { toolGesture = null; ghost = null; }
      if (gesture && ev.pointerId === gesture.down.id) { gesture = null; preview = null; box = null; insertion = null; wirePreview = mode.kind === 'wire' ? wirePreview : null; }
      render();
    });
    svg.addEventListener('wheel', (ev) => { // Ctrl + wheel, or a trackpad pinch, zooms; a plain wheel scrolls the page
      if (!ev.ctrlKey) return;
      ev.preventDefault();
      zoomAt(Math.exp(-ev.deltaY * 0.01), ev.clientX, ev.clientY);
    }, { passive: false });

    function hoverMove(p, type) {
      if (mode.kind === 'wire') {
        const t = findTarget(p, radius(type), { end: mode.from, wire: null });
        const end = t ? t.pos : round(p);
        wirePreview = { points: orth([startPos(mode), ...mode.via, end]), target: t ? t.pos : null };
        render();
      } else if (mode.kind === 'place') {
        insertion = M.findInsertion(store.drawing, mode.type, p, mode.rot || 0);
        ghost = insertion ? { type: mode.type, x: insertion.x, y: insertion.y, rot: insertion.rot } : { type: mode.type, x: Math.round(p[0]), y: Math.round(p[1]), rot: mode.rot || 0 };
        render();
      }
    }
    function beginDrag() {
      const g = gesture;
      const h = g.hit;
      if (opts.readOnly) { g.kind = 'pan'; g.view = { ...view }; return; }
      const d = store.drawing;
      if (!h) { g.kind = g.down.type === 'mouse' && g.down.shift ? 'box' : 'pan'; g.view = { ...view }; return; }
      switch (h.kind) {
        case 'terminal': g.kind = 'wire-drag'; g.from = h.end; break;
        case 'junction':
          if (sel.junctions.has(h.id)) { g.kind = 'move'; g.sel = selectionOf(); } else { g.kind = 'wire-drag'; g.from = h.end; }
          break;
        case 'component':
          if (!sel.components.has(h.id)) { if (!g.down.add) clearSelection(); sel.components.add(h.id); }
          g.kind = 'move'; g.sel = selectionOf();
          g.sel.components = movable(g.sel.components); // locked parts stay where they are
          if (!g.sel.components.length && !g.sel.wires.length && !g.sel.junctions.length) { g.kind = 'pan'; g.view = { ...view }; break; }
          // One component with nothing attached can be dropped into a wire.
          g.single = g.sel.components.length === 1 && !g.sel.wires.length && !g.sel.junctions.length && !wiredTo(g.sel.components[0]) ? g.sel.components[0] : null;
          break;
        case 'wireEnd': g.kind = 'end-drag'; g.wire = h.wire; g.which = h.which; break;
        case 'via': g.kind = 'via-drag'; g.wire = h.wire; g.index = h.index; break;
        case 'mid': {
          const w = d.wires.find((x) => x.id === h.wire);
          const path = M.wirePath(d, w);
          g.kind = 'via-drag'; g.wire = h.wire;
          g.base = path.slice(1, -1).map((q) => [q[0], q[1]]);
          g.index = h.segment; // the new bend goes after the segment's start
          g.base.splice(g.index, 0, null);
          break;
        }
        case 'wire': g.kind = 'wire-drag'; g.fromWire = { id: h.id, point: h.point }; break;
        default: g.kind = 'pan'; g.view = { ...view };
      }
    }
    function dragMove(p, ev) {
      const g = gesture;
      const rg = radius(g.down.type);
      const d = store.drawing;
      switch (g.kind) {
        case 'pan':
          view.x = g.view.x - (ev.clientX - g.down.cx) / view.z / G;
          view.y = g.view.y - (ev.clientY - g.down.cy) / view.z / G;
          break;
        case 'box': box = { x0: g.down.p[0], y0: g.down.p[1], x1: p[0], y1: p[1] }; break;
        case 'move': {
          g.dx = Math.round(p[0] - g.down.p[0]);
          g.dy = Math.round(p[1] - g.down.p[1]);
          preview = M.clone(d);
          M.ops.moveItems(preview, g.sel, g.dx, g.dy);
          g.ins = null;
          if (g.single) {
            const c = preview.components.find((x) => x.id === g.single);
            g.ins = M.findInsertion(d, c.type, [c.x, c.y], c.rot);
            if (g.ins) { c.x = g.ins.x; c.y = g.ins.y; c.rot = g.ins.rot; M.ops.insertIntoWire(preview, g.single, g.ins.wire); }
          }
          insertion = g.ins;
          M.settle(preview); // show the joins that letting go would make
          break;
        }
        case 'wire-drag': {
          const t = findTarget(p, rg, { end: g.from, wire: null });
          g.target = t;
          wirePreview = { points: orth([startPos(g), t ? t.pos : round(p)]), target: t ? t.pos : null };
          break;
        }
        case 'end-drag': {
          const w = d.wires.find((x) => x.id === g.wire);
          const other = w[g.which === 'from' ? 'to' : 'from'];
          const t = findTarget(p, rg, { end: other, wire: g.wire });
          g.target = t;
          preview = M.clone(d);
          M.ops.moveWireEnd(preview, g.wire, g.which, { free: t ? t.pos : round(p) });
          M.settle(preview);
          wirePreview = t ? { points: [], target: t.pos } : null;
          break;
        }
        case 'via-drag': {
          preview = M.clone(d);
          const w = preview.wires.find((x) => x.id === g.wire);
          const via = g.base ? g.base.map((q) => (q ? q : round(p))) : (w.via || []).map((q, i) => (i === g.index ? round(p) : q));
          w.via = via;
          g.via = via;
          M.settle(preview);
          break;
        }
        case 'wire-tap': case 'place-tap': hoverMove(p, g.down.type); break;
        default: break;
      }
      render();
    }
    function finish(g, p, ev) {
      const rg = radius(g.down.type);
      if (!g.moved) { tap(g, p); return; }
      lastTap = null; // a double-tap is two taps with nothing in between
      const d = store.drawing;
      switch (g.kind) {
        case 'move':
          preview = null;
          insertion = null;
          if (g.ins) {
            store.change('insert', (x) => {
              const c = x.components.find((q) => q.id === g.single);
              c.x = g.ins.x; c.y = g.ins.y; c.rot = g.ins.rot;
              M.ops.insertIntoWire(x, g.single, g.ins.wire);
            });
          } else if (g.dx || g.dy) store.change('move', (x) => { M.ops.moveItems(x, g.sel, g.dx, g.dy); M.ops.joinAt(x, g.sel.components); });
          break;
        case 'wire-drag': {
          const m = { from: g.from, fromWire: g.fromWire, via: [] };
          const t = findTarget(p, rg, { end: g.from, wire: null });
          wirePreview = null;
          if (t) commitWire(m, t, []);
          else { mode = { kind: 'wire', ...m, via: [round(p)] }; hoverMove(p, g.down.type); }
          break;
        }
        case 'end-drag': {
          preview = null;
          wirePreview = null;
          const w = d.wires.find((x) => x.id === g.wire);
          const other = w[g.which === 'from' ? 'to' : 'from'];
          const t = findTarget(p, rg, { end: other, wire: g.wire });
          store.change('wire end', (x) => {
            const end = t ? attach(x, t) : { free: round(p) };
            if (end && !(endKey(end) && endKey(end) === endKey(other))) M.ops.moveWireEnd(x, g.wire, g.which, end);
            M.ops.tidy(x);
          });
          break;
        }
        case 'via-drag': {
          preview = null;
          if (g.via) store.change('bend', (x) => { const w = x.wires.find((q) => q.id === g.wire); const path = M.wirePath(x, w); M.ops.setVia(x, g.wire, cleanVia(g.via, path[0], path[path.length - 1])); });
          break;
        }
        case 'box': {
          const b = box;
          box = null;
          if (b) {
            const [x0, x1, y0, y1] = [Math.min(b.x0, b.x1), Math.max(b.x0, b.x1), Math.min(b.y0, b.y1), Math.max(b.y0, b.y1)];
            const inside = (q) => q[0] >= x0 && q[0] <= x1 && q[1] >= y0 && q[1] <= y1;
            if (!g.down.add) clearSelection();
            for (const c of d.components) if (inside([c.x, c.y])) sel.components.add(c.id);
            for (const j of d.junctions) if (inside([j.x, j.y])) sel.junctions.add(j.id);
            for (const w of d.wires) { const path = M.wirePath(d, w); if (path.length && path.every(inside)) sel.wires.add(w.id); }
          }
          break;
        }
        case 'wire-tap': tap(g, p); return;
        case 'place-tap': tap(g, p); return;
        default: break;
      }
      updateAll();
    }
    function tap(g, p) {
      const rg = radius(g.down.type);
      if (g.kind === 'place-tap') {
        const m = mode;
        mode = { kind: 'select' };
        ghost = null;
        const ins = M.findInsertion(store.drawing, m.type, p, m.rot || 0);
        insertion = null;
        if (ins) addInto(m.type, ins); else addAt(m.type, round(p), m.rot || 0);
        updateAll();
        return;
      }
      if (g.kind === 'wire-tap') {
        const t = findTarget(p, rg, { end: mode.from, wire: null });
        if (t) { const m = mode; mode = { kind: 'select' }; wirePreview = null; commitWire(m, t, m.via); updateAll(); return; }
        const q = round(p);
        const last = mode.via.length ? mode.via[mode.via.length - 1] : startPos(mode);
        if (same(q, last) && mode.via.length) { // the same point twice: finish with a loose end
          const m = mode; mode = { kind: 'select' }; wirePreview = null;
          commitWire(m, { free: q }, m.via.slice(0, -1)); updateAll(); return;
        }
        mode.via.push(q);
        hoverMove(p, g.down.type);
        updateHint();
        return;
      }
      const h = g.hit;
      const now = Date.now();
      if (!h || h.kind !== 'component') lastTap = null;
      if (!h) { if (!g.down.add) clearSelection(); updateAll(); return; }
      switch (h.kind) {
        case 'terminal': if (!opts.readOnly) { mode = { kind: 'wire', from: h.end, via: [] }; hoverMove(p, g.down.type); } break;
        case 'junction': toggleIn(sel.junctions, h.id, g.down.add); break;
        case 'component': {
          const c = store.drawing.components.find((x) => x.id === h.id);
          const double = lastTap && lastTap.id === h.id && now - lastTap.t < 400;
          toggleIn(sel.components, h.id, g.down.add);
          if (c.type === 'switch') toggleSwitch(h.id);
          else if (double && !opts.readOnly && !locked.has(h.id)) { store.change('rotate', (d) => { M.ops.rotate(d, [h.id]); M.ops.joinAt(d, [h.id]); }); }
          lastTap = { id: h.id, t: double ? 0 : now };
          break;
        }
        case 'wire': toggleIn(sel.wires, h.id, g.down.add); break;
        default: break;
      }
      updateAll();
    }

    // Two fingers: zoom and pan.
    function startPinch() {
      gesture = null; preview = null; box = null;
      const [a, b] = [...pointers.values()];
      pinch = { dist: Math.hypot(a[0] - b[0], a[1] - b[1]), mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], view: { ...view } };
      render();
    }
    function pinchMove() {
      const [a, b] = [...pointers.values()];
      if (!a || !b) return;
      const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const r = rect();
      const z = Math.min(3, Math.max(0.35, pinch.view.z * dist / pinch.dist));
      const gx = pinch.view.x + (pinch.mid[0] - r.left) / pinch.view.z / G; // the grid point under the first midpoint
      const gy = pinch.view.y + (pinch.mid[1] - r.top) / pinch.view.z / G;
      view.z = z;
      view.x = gx - (mid[0] - r.left) / z / G;
      view.y = gy - (mid[1] - r.top) / z / G;
      render();
    }
    function zoomAt(f, cx, cy) {
      const r = rect();
      const [gx, gy] = clientToGrid(cx, cy);
      view.z = Math.min(3, Math.max(0.35, view.z * f));
      view.x = gx - (cx - r.left) / view.z / G;
      view.y = gy - (cy - r.top) / view.z / G;
      render();
    }
    function fit() {
      const d = store.drawing;
      const pts = [];
      for (const c of d.components) { const b = M.componentBox(c); pts.push([b.x0, b.y0], [b.x1, b.y1]); }
      for (const w of d.wires) pts.push(...M.wirePath(d, w));
      const r = rect();
      if (!pts.length || !r.width) { view.z = 1.15; view.x = -r.width / view.z / G / 2; view.y = -r.height / view.z / G / 2; render(); return; }
      const xs = pts.map((q) => q[0]);
      const ys = pts.map((q) => q[1]);
      const [x0, x1, y0, y1] = [Math.min(...xs) - 3, Math.max(...xs) + 3, Math.min(...ys) - 3, Math.max(...ys) + 3];
      view.z = Math.min(board ? 2.6 : 1.6, Math.max(0.35, Math.min(r.width / ((x1 - x0) * G), r.height / ((y1 - y0) * G)))); // larger on the board
      view.x = (x0 + x1) / 2 - r.width / view.z / G / 2;
      view.y = (y0 + y1) / 2 - r.height / view.z / G / 2;
      render();
    }

    // ---------------- the toolbox: drag a component out, or tap it then tap the grid ----------------
    for (const btn of host.querySelectorAll('.ck-tool')) {
      btn.addEventListener('pointerdown', (ev) => {
        if (ev.pointerType === 'mouse' && ev.button !== 0) return;
        ev.preventDefault();
        toolGesture = { id: ev.pointerId, type: btn.dataset.type, cx: ev.clientX, cy: ev.clientY, moved: false };
        try { btn.setPointerCapture(ev.pointerId); } catch (e) { /* synthetic events */ }
      });
      btn.addEventListener('click', (ev) => { // keyboard: Enter or Space adds the component in the middle of the view
        if (ev.detail !== 0) return;
        const r = rect();
        addAt(btn.dataset.type, round(clientToGrid(r.left + r.width / 2, r.top + r.height / 2)));
        updateAll();
      });
    }
    function toolMove(ev) {
      const g = toolGesture;
      if (!g.moved && Math.hypot(ev.clientX - g.cx, ev.clientY - g.cy) > TAP) g.moved = true;
      if (!g.moved) return;
      if (overSvg(ev.clientX, ev.clientY)) {
        const p = clientToGrid(ev.clientX, ev.clientY);
        insertion = M.findInsertion(store.drawing, g.type, p, 0);
        ghost = insertion ? { type: g.type, x: insertion.x, y: insertion.y, rot: insertion.rot } : { type: g.type, x: Math.round(p[0]), y: Math.round(p[1]), rot: 0 };
      } else { ghost = null; insertion = null; }
      render();
    }
    function toolUp(ev) {
      const g = toolGesture;
      toolGesture = null;
      ghost = null;
      const ins = insertion;
      insertion = null;
      if (g.moved) {
        if (overSvg(ev.clientX, ev.clientY)) { if (ins) addInto(g.type, ins); else addAt(g.type, round(clientToGrid(ev.clientX, ev.clientY))); }
      } else {
        mode = { kind: 'place', type: g.type, rot: 0 };
        wirePreview = null;
      }
      updateAll();
    }

    // ---------------- keyboard ----------------
    listen(document, 'keydown', (ev) => {
      const a = document.activeElement;
      const typing = a && (a.tagName === 'INPUT' || a.tagName === 'SELECT' || a.tagName === 'TEXTAREA');
      if (typing && ev.key !== 'Escape') return;
      if (!(a === document.body || host.contains(a))) return;
      const k = ev.key;
      const mod = ev.ctrlKey || ev.metaKey;
      if (mod && (k === 'z' || k === 'Z')) { ev.preventDefault(); if (ev.shiftKey) store.redo(); else store.undo(); return; }
      if (mod && (k === 'y' || k === 'Y')) { ev.preventDefault(); store.redo(); return; }
      if (mod) return;
      if (k === 'Escape') {
        if (board && mode.kind === 'select') { clearSelection(); updateAll(); setBoard(false); return; } // drawing a wire or placing: Esc cancels that first
        cancelMode(); clearSelection(); updateAll(); return;
      }
      if (typing) return;
      if (opts.readOnly && (k === 'Delete' || k === 'Backspace' || k === 'r' || k === 'R')) return;
      if (k === 'Delete' || k === 'Backspace') { ev.preventDefault(); deleteSelection(); updateAll(); return; }
      if (k === 'r' || k === 'R') { ev.preventDefault(); rotateSelection(ev.shiftKey ? -1 : 1); return; }
      const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
      if (step && (sel.components.size || sel.junctions.size || sel.wires.size) && a !== document.body) {
        ev.preventDefault();
        const s = selectionOf();
        s.components = movable(s.components);
        if (opts.readOnly) return;
        store.change('move', (d) => { M.ops.moveItems(d, s, step[0], step[1]); M.ops.joinAt(d, s.components); });
      }
    });
    function cancelMode() { mode = { kind: 'select' }; ghost = null; insertion = null; wirePreview = null; preview = null; gesture = null; }

    // ---------------- toolbar ----------------
    host.querySelector('.ck-toolbar').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'undo') store.undo();
      else if (act === 'redo') store.redo();
      else if (act === 'rotate') rotateSelection(1);
      else if (act === 'rotate-acw') rotateSelection(-1);
      else if (act === 'delete') { deleteSelection(); updateAll(); }
      else if (act === 'clear' && opts.resetTo) { // a challenge: back to how it started
        if (!(opts.confirm || window.confirm)('Start this challenge again? (Undo can bring your circuit back.)')) return;
        store.load(opts.resetTo);
        clearSelection(); cancelMode(); updateAll(); fit();
      } else if (act === 'clear') {
        if (store.drawing.components.length || store.drawing.wires.length) {
          if (!(opts.confirm || window.confirm)('Remove everything from the workspace? (Undo can bring it back.)')) return;
          store.change('clear', (d) => { d.components = []; d.wires = []; d.junctions = []; });
          clearSelection(); cancelMode(); updateAll();
        }
      } else if (act === 'zoom-in' || act === 'zoom-out') { const r = rect(); zoomAt(act === 'zoom-in' ? 1.25 : 0.8, r.left + r.width / 2, r.top + r.height / 2); }
      else if (act === 'fit') fit();
      else if (act === 'board') setBoard(!board);
    });
    for (const box2 of host.querySelectorAll('[data-show]')) box2.addEventListener('change', () => { show[box2.dataset.show] = box2.checked; render(); working(); });

    // ---------------- show the working (js/circuits/steps.js) ----------------
    const workingEl = host.querySelector('.ck-working');
    function working() {
      workingEl.hidden = !show.working;
      if (!show.working) return;
      const S = root.Circuits.steps;
      const head = '<h3>How the readings are worked out</h3>';
      if (!S || !nl || !store.drawing.components.length) { workingEl.innerHTML = `${head}<p class="ck-small">Build a circuit with a cell or battery to see the working.</p>`; return; }
      const ex = S.explain(nl, result);
      if (!ex.ok) { workingEl.innerHTML = `${head}<p class="ck-small">${esc(ex.message)}</p>`; return; }
      const notes = ex.steps.filter((x) => x.op === 'note').map((x) => `<p class="ck-small">${esc(S.text(x))}</p>`).join('');
      const items = ex.steps.filter((x) => x.op !== 'note').map((x) => `<li>${esc(S.text(x))}</li>`).join('');
      workingEl.innerHTML = `${head}${notes}<ol class="ck-steps">${items}</ol><p class="ck-small">Values are given to 3 significant figures.</p>`;
    }

    // ---------------- board mode: the builder fills the screen ----------------
    let board = false;
    function setBoard(on) {
      board = on;
      host.classList.toggle('ck-board', on);
      document.documentElement.classList.toggle('ck-board-open', on);
      const b = host.querySelector('[data-act="board"]');
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? '✕ Leave board view' : '⛶ Board';
      try {
        if (on && host.requestFullscreen && !document.fullscreenElement) host.requestFullscreen().catch(() => {});
        if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
      } catch (e) { /* full screen isn't available: the page layout still fills the window */ }
      requestAnimationFrame(() => fit());
    }
    listen(document, 'fullscreenchange', () => { if (board && !document.fullscreenElement) setBoard(false); });

    // ---------------- the inspector: the selected component's settings and readings ----------------
    let inspectorKey = null;
    function inspector() {
      const d = store.drawing;
      const one = sel.components.size === 1 && !sel.wires.size && !sel.junctions.size ? d.components.find((c) => sel.components.has(c.id)) : null;
      const wired = one ? d.wires.flatMap((w) => endsOf(w)).filter((e) => e.c === one.id).map((e) => e.t).sort().join('') : '';
      const key = one ? `c:${one.id}:${one.type}:${one.params.model || ''}:${one.params.ideal}:${wired}` : `n:${sel.components.size}:${sel.wires.size}:${sel.junctions.size}`;
      if (key !== inspectorKey) { inspectorKey = key; inspectorEl.innerHTML = one ? componentForm(one) : otherForm(); bindInspector(one); }
      if (one) refreshInspector(one);
    }
    function otherForm() {
      const n = sel.components.size + sel.wires.size + sel.junctions.size;
      if (!n) return `<h3>Nothing selected</h3><p class="ck-small">Tap a component to change its settings and see its readings. Shift-click (or drag a box with Shift held) to select several.</p>`;
      if (sel.wires.size === 1 && n === 1) return `<h3>Wire</h3><p class="ck-small">Drag its ends to reconnect it, the squares to move a bend, or the circles to add one.</p><div class="ck-buttons"><button type="button" class="ck-btn" data-do="delete">✕ Delete wire</button></div>`;
      return `<h3>${n} items selected</h3><div class="ck-buttons">${ROTATE_BUTTONS}<button type="button" class="ck-btn" data-do="delete">✕ Delete</button></div>`;
    }
    const num = (key, label, unit, value, extra = '') => `<label class="ck-field"><span class="ck-flabel">${label}</span><span class="ck-fin"><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-key="${key}" value="${esc(show3(value))}"${extra}><span class="ck-unit">${unit}</span></span></label>`;
    function slider(key, c) {
      const p = c.params;
      if (c.type === 'ldr') return `<input type="range" class="ck-slider" data-slider="lux" min="0" max="1000" step="1" aria-label="Light level" value="${p.lux <= 0.1 ? 0 : Math.round((Math.log10(p.lux) + 1) * 200)}">`;
      const spec = C.TYPES[c.type].params[key];
      const [min, max, step] = c.type === 'variable' ? [p.min, p.max, (p.max - p.min) / 200 || 1] : [spec.min, spec.max, c.type === 'potentiometer' ? 0.01 : 1];
      return `<input type="range" class="ck-slider" data-slider="${key}" min="${min}" max="${max}" step="${step}" aria-label="${esc(spec.label)}" value="${p[key]}">`;
    }
    function componentForm(c) {
      const p = c.params;
      const def = C.TYPES[c.type];
      const f = [];
      if (fixed.has(c.id)) { // set by a challenge: shown, not changed
        const val = R.valueText(c);
        f.push(`<h3>${esc(def.name)} ${esc(c.label)}</h3>`);
        f.push(`<p class="ck-small">${hidden.has(c.id) ? 'This is the part you are investigating: its values are hidden.' : `Set for this challenge${val ? ` (${esc(val)})` : ''}.`}${locked.has(c.id) ? " It can't be moved." : ''}</p>`);
        if (!hidden.has(c.id)) f.push('<dl class="ck-readings"></dl>');
        if (!locked.has(c.id)) f.push(`<div class="ck-buttons">${ROTATE_BUTTONS}<button type="button" class="ck-btn" data-do="delete">✕ Delete</button></div>`);
        return f.join('');
      }
      f.push(`<h3>${esc(def.name)} <input type="text" class="ck-labelin" data-label aria-label="Label" value="${esc(c.label)}" maxlength="12"></h3>`);
      switch (c.type) {
        case 'cell': case 'battery':
          f.push(num('emf', 'emf', 'V', p.emf), num('r', 'internal resistance', 'Ω', p.r), `<p class="ck-small">Internal resistance 0 = an ideal cell.</p>`); break;
        case 'resistor': f.push(num('R', 'resistance', 'Ω', p.R)); break;
        case 'variable': f.push(num('R', 'resistance', 'Ω', p.R), slider('R', c), `<div class="ck-row">${num('min', 'lowest', 'Ω', p.min)}${num('max', 'highest', 'Ω', p.max)}</div>`); break;
        case 'potentiometer': f.push(num('R', 'total resistance', 'Ω', p.R), num('pos', 'slider position (0 = end A, 1 = end B)', '', p.pos), slider('pos', c)); break;
        case 'switch': f.push(`<div class="ck-buttons"><button type="button" class="ck-btn ck-primary" data-do="switch">${p.closed ? 'Open the switch' : 'Close the switch'}</button></div><p class="ck-small">You can also tap the switch.</p>`); break;
        case 'lamp':
          f.push(`<label class="ck-field"><span class="ck-flabel">type of lamp</span><select data-key="model"><option value="ohmic"${p.model === 'ohmic' ? ' selected' : ''}>ohmic (constant resistance)</option><option value="filament"${p.model === 'filament' ? ' selected' : ''}>filament (non-ohmic)</option></select></label>`);
          if (p.model === 'ohmic') f.push(num('R', 'resistance', 'Ω', p.R), num('Prated', 'rated power', 'W', p.Prated));
          else f.push(num('Vrated', 'rated p.d.', 'V', p.Vrated), num('Prated', 'rated power', 'W', p.Prated));
          break;
        case 'thermistor': f.push(num('temp', 'temperature', '°C', p.temp), slider('temp', c), `<details class="ck-more"><summary>More settings</summary>${num('R25', 'resistance at 25 °C', 'Ω', p.R25)}${num('B', 'B value', 'K', p.B)}</details>`); break;
        case 'ldr': f.push(num('lux', 'light level', 'lx', p.lux), slider('lux', c), `<p class="ck-small">0 lux is dark; a classroom is about 300 lux; daylight indoors near a window is about 1000 lux.</p>`); break;
        case 'ammeter': case 'voltmeter': {
          const ranges = Object.keys(C.RANGES[c.type]);
          f.push(`<label class="ck-field"><span class="ck-flabel">range</span><select data-key="range">${ranges.map((r) => `<option value="${r}"${p.range === r ? ' selected' : ''}>${r.replace('mA', ' mA').replace('mV', ' mV').replace(/(\d)A$/, '$1 A').replace(/(\d)V$/, '$1 V')}</option>`).join('')}</select></label>`);
          f.push(`<label class="ck-check"><input type="checkbox" data-key="ideal"${p.ideal ? ' checked' : ''}> ideal meter (${c.type === 'ammeter' ? 'no resistance' : 'takes no current'})</label>`);
          if (!p.ideal) f.push(c.type === 'ammeter' ? num('r', 'resistance', 'Ω', p.r) : num('R', 'resistance', 'Ω', p.R));
          f.push(`<p class="ck-small">The red terminal is +. A reading above the range shows OL: choose a higher range.</p>`);
          break;
        }
        default: break;
      }
      f.push(`<dl class="ck-readings"></dl>`);
      f.push(`<div class="ck-buttons">${ROTATE_BUTTONS}<button type="button" class="ck-btn" data-do="delete">✕ Delete</button></div>`);
      // Taking it out of the circuit without deleting it.
      const attached = store.drawing.wires.flatMap((w) => endsOf(w)).filter((e) => e.c === c.id);
      if (attached.length) {
        const both = C.TYPES[c.type].terminals.length === 2 && [0, 1].every((t) => attached.some((e) => e.t === t));
        f.push(`<div class="ck-buttons"><button type="button" class="ck-btn" data-do="takeout" title="The wires are left with loose ends, so the circuit has a gap">Take out (leave a gap)</button>${both ? '<button type="button" class="ck-btn" data-do="takeout-join" title="A wire takes its place">Take out and join the wires</button>' : ''}</div>`);
      }
      return f.join('');
    }
    function bindInspector(c) {
      inspectorEl.querySelectorAll('[data-do]').forEach((b) => b.addEventListener('click', () => {
        const act = b.dataset.do;
        if (act === 'delete') { deleteSelection(); updateAll(); }
        else if (act === 'rotate') rotateSelection(1);
        else if (act === 'rotate-acw') rotateSelection(-1);
        else if (act === 'switch') toggleSwitch(c.id);
        else if (act === 'takeout' || act === 'takeout-join') store.change('take out', (d) => M.ops.takeOut(d, c.id, act === 'takeout-join'));
      }));
      if (!c) return;
      const set = (key, value, coalesce = true) => store.change('setting', (d) => M.ops.setParam(d, c.id, key, value), coalesce ? `param:${c.id}:${key}` : null);
      inspectorEl.querySelectorAll('input[data-key]').forEach((inp) => {
        if (inp.type === 'checkbox') { inp.addEventListener('change', () => set(inp.dataset.key, inp.checked, false)); return; }
        inp.addEventListener('input', () => {
          const v = parseValue(inp.value);
          inp.classList.toggle('ck-invalid', v === null);
          if (v !== null) set(inp.dataset.key, v);
        });
        inp.addEventListener('blur', () => { store.endCoalesce(); inp.classList.remove('ck-invalid'); refreshInspector(store.drawing.components.find((x) => x.id === c.id), true); });
        inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') inp.blur(); });
      });
      inspectorEl.querySelectorAll('select[data-key]').forEach((s) => s.addEventListener('change', () => set(s.dataset.key, s.value, false)));
      inspectorEl.querySelectorAll('input[data-slider]').forEach((s) => {
        s.addEventListener('input', () => {
          const key = s.dataset.slider;
          let v = parseFloat(s.value);
          if (key === 'lux') v = v <= 0 ? 0 : Number(Math.pow(10, v / 200 - 1).toPrecision(3));
          set(key, v);
        });
        s.addEventListener('change', () => store.endCoalesce());
      });
      const lab = inspectorEl.querySelector('[data-label]');
      if (lab) lab.addEventListener('change', () => store.change('label', (d) => M.ops.setLabel(d, c.id, lab.value)));
    }
    function refreshInspector(c, force = false) {
      if (!c) return;
      const focused = document.activeElement;
      inspectorEl.querySelectorAll('input[data-key]').forEach((inp) => {
        if (inp.type === 'checkbox') { inp.checked = !!c.params[inp.dataset.key]; return; }
        if (inp !== focused || force) inp.value = show3(c.params[inp.dataset.key]);
      });
      inspectorEl.querySelectorAll('input[data-slider]').forEach((s) => {
        if (s === focused) return;
        const key = s.dataset.slider;
        if (key === 'lux') s.value = c.params.lux <= 0.1 ? 0 : Math.round((Math.log10(c.params.lux) + 1) * 200);
        else { if (c.type === 'variable') { s.min = c.params.min; s.max = c.params.max; } s.value = c.params[key]; }
      });
      const sw = inspectorEl.querySelector('[data-do="switch"]');
      if (sw) sw.textContent = c.params.closed ? 'Open the switch' : 'Close the switch';
      const dl = inspectorEl.querySelector('.ck-readings');
      if (dl) dl.innerHTML = readings(c);
    }
    function readings(c) {
      const r = result && result.components[c.id];
      if (!r) return '';
      const rows = [];
      const row = (k, v) => rows.push(`<div><dt>${k}</dt><dd>${v}</dd></div>`);
      const I = (x) => (Number.isFinite(x) ? R.si(Math.abs(x), 'A') : '∞ (short circuit)');
      const P = (x) => (Number.isFinite(x) ? R.si(Math.abs(x), 'W') : '∞');
      if (c.type === 'ammeter' || c.type === 'voltmeter') row('reading', `<span class="ck-lcd${r.reading.ol ? ' ck-ol' : ''}">${esc(r.reading.text)}${r.reading.ol ? '' : ` ${r.reading.unit}`}</span>`);
      if (c.type === 'cell' || c.type === 'battery') {
        row('current', I(r.I)); row('terminal p.d.', R.si(r.terminalPD, 'V'));
        row('power from the emf (εI)', P(r.Pemf));
        if (c.params.r > 0) { row('power lost inside (I²r)', P(r.Pint)); row('power to the circuit', P(r.Pout)); }
      } else if (c.type === 'potentiometer') {
        row('p.d. end A to slider', R.si(Math.abs(r.sections.a.V), 'V')); row('p.d. slider to end B', R.si(Math.abs(r.sections.b.V), 'V'));
        row('current, end A to slider', I(r.sections.a.I)); row('current, slider to end B', I(r.sections.b.I));
      } else if (c.type !== 'ammeter' && c.type !== 'voltmeter') {
        row('p.d.', R.si(Math.abs(r.V), 'V')); row('current', I(r.I)); row('power', P(r.P));
        if (c.type === 'switch') rows.length = c.params.closed ? 2 : 1;
      }
      if (c.type === 'lamp') { row('brightness', `${Math.round(r.brightness * 100)}% of its rated power`); if (c.params.model === 'filament') row('resistance now', R.si(r.R, 'Ω')); }
      if (c.type === 'thermistor' || c.type === 'ldr') row('resistance now', R.si(r.R, 'Ω'));
      return rows.join('');
    }

    // ---------------- circuit check (the engine's diagnostics) ----------------
    function status() {
      const ds = (result && result.diagnostics) || [];
      const order = { error: 0, warning: 1, info: 2 };
      // A challenge's hidden part: its warnings don't give its values away (e.g. the current a short circuit gives).
      for (const x of ds) if (x.ids.some((id) => hidden.has(id))) x.message = x.message.replace(/ \(I = ε\/r = [^)]*\)/, '');
      const loose = ds.filter((x) => x.code === 'unconnected');
      const list = ds.filter((x) => x.code !== 'unconnected').sort((a, b) => order[a.level] - order[b.level]);
      // From the drawing (the engine never sees positions): things that look wrong on the page.
      const d = store.drawing;
      const name = (id) => (d.components.find((c) => c.id === id) || { label: id }).label;
      for (const x of M.layoutProblems(d)) {
        if (x.code === 'across') list.unshift({ code: 'across', level: 'warning', ids: [x.c, x.wire], message: `A wire runs across ${name(x.c)} without being connected to it, which is confusing to read. Move the wire or the component.` });
        else list.unshift({ code: 'overlap', level: 'warning', ids: x.wires, message: 'Two wires lie on top of each other for part of their length, so they look like one wire. Move one of them (select it and drag a bend).' });
      }
      if (loose.length) list.push({ code: 'unconnected', level: 'info', ids: [...new Set(loose.flatMap((x) => x.ids))], message: loose.length === 1 ? loose[0].message : `Unconnected terminals: ${loose.map((x) => x.message.replace(/ isn't connected at its (.*) terminal\./, ' ($1)')).join(', ')}.` });
      if (!list.length) { diagsEl.innerHTML = `<li class="ck-diag ck-good">✓ ${store.drawing.components.length ? 'No problems found.' : 'Add components from the toolbox to start.'}</li>`; return; }
      const icon = { error: '⛔', warning: '⚠', info: 'ℹ' };
      diagsEl.innerHTML = list.map((x) => `<li class="ck-diag ck-${x.level}"><button type="button" data-ids="${esc(x.ids.join(' '))}"><span aria-hidden="true">${icon[x.level]}</span> ${esc(x.message)}</button></li>`).join('');
      diagsEl.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const ids = b.dataset.ids.split(' ').filter(Boolean);
        highlight = new Set(ids);
        const comps = ids.filter((id) => store.drawing.components.some((c) => c.id === id));
        const wires = ids.filter((id) => store.drawing.wires.some((w) => w.id === id));
        sel.components.clear(); sel.wires.clear(); sel.junctions.clear();
        comps.forEach((id) => sel.components.add(id)); wires.forEach((id) => sel.wires.add(id));
        render(); inspector();
      }));
    }

    // A text description of the circuit (for screen readers, and for checking).
    function describe() {
      const d = store.drawing;
      if (!d.components.length) { describeEl.innerHTML = '<p>The workspace is empty.</p>'; return; }
      const name = (id) => { const c = d.components.find((x) => x.id === id); return c ? c.label : id; };
      const comps = d.components.map((c) => `<li>${esc(c.label)}: ${esc(C.TYPES[c.type].name.toLowerCase())}${R.valueText(c) ? `, ${esc(R.valueText(c))}` : ''}${c.type === 'switch' ? (c.params.closed ? ', closed' : ', open') : ''}</li>`).join('');
      const joins = N.partition(nl).filter((g) => g.length > 1).map((g) => `<li>${g.map((k) => { const [id, t] = k.split(':'); const c = d.components.find((x) => x.id === id); return `${esc(name(id))} (${esc(C.TYPES[c.type].terminalNames[t])})`; }).join(', ')}</li>`).join('');
      describeEl.innerHTML = `<p>Components:</p><ul>${comps}</ul><p>Terminals joined together:</p>${joins ? `<ul>${joins}</ul>` : '<p>None yet.</p>'}`;
    }

    function updateHint() {
      const t = opts.readOnly ? 'This circuit is set for the challenge: tap a part to see it, drag empty space to move around, and type your predictions above.' : insertion ? 'Let go to put it into this wire, in series.' : mode.kind === 'wire'
        ? 'Drawing a wire: tap a terminal, junction or wire to finish it. Tap the grid to add a bend; tap the same point twice to leave a loose end. Esc cancels.'
        : mode.kind === 'place'
          ? `Tap the grid to place the ${C.TYPES[mode.type].name.toLowerCase()}. R rotates it; Esc cancels.`
          : 'Drag a component from the toolbox onto the grid (or tap it, then tap the grid). To draw a wire, drag from one terminal (○) to another, or tap a terminal, then tap where the wire goes. Tap a switch to open or close it. Drag empty space to move around.';
      if (hint.textContent !== t) hint.textContent = t;
      host.dataset.mode = mode.kind;
    }

    // ---------------- drawing everything ----------------
    function render() {
      const r = rect();
      if (r.width && r.height) svg.setAttribute('viewBox', `${view.x * G} ${view.y * G} ${r.width / view.z} ${r.height / view.z}`);
      content.innerHTML = R.drawing(current(), result, {
        selected: sel, highlight, show, nl, hidden,
        ghost, preview: wirePreview, box, insertWire: insertion && insertion.wire,
      });
      if (show.potential && result && result.nets.length) {
        const vs = result.nets.filter(Number.isFinite);
        legend.hidden = false;
        legend.innerHTML = `<span>${R.si(Math.min(...vs), 'V')}</span><span class="ck-ramp" aria-hidden="true"></span><span>${R.si(Math.max(...vs), 'V')}</span>`;
      } else legend.hidden = true;
      host.querySelector('[data-act="undo"]').disabled = !store.canUndo;
      host.querySelector('[data-act="redo"]').disabled = !store.canRedo;
      const any = sel.components.size + sel.wires.size + sel.junctions.size > 0;
      host.querySelector('[data-act="delete"]').disabled = !any;
      for (const act of ['rotate', 'rotate-acw']) host.querySelector(`[data-act="${act}"]`).disabled = !(sel.components.size || mode.kind === 'place');
      for (const b of host.querySelectorAll('.ck-tool')) {
        b.classList.toggle('ck-active', mode.kind === 'place' && mode.type === b.dataset.type);
        const n = left(b.dataset.type);
        b.disabled = n <= 0;
        const badge = b.querySelector('.ck-left');
        if (badge) badge.textContent = `${Math.max(0, n)} left`;
      }
      updateHint();
    }
    function updateAll() { render(); inspector(); }

    function solve() {
      nl = N.build(store.drawing);
      result = E.solve(nl);
      // Drop selections of things that no longer exist.
      const d = store.drawing;
      for (const id of [...sel.components]) if (!d.components.some((c) => c.id === id)) sel.components.delete(id);
      for (const id of [...sel.wires]) if (!d.wires.some((w) => w.id === id)) sel.wires.delete(id);
      for (const id of [...sel.junctions]) if (!d.junctions.some((j) => j.id === id)) sel.junctions.delete(id);
    }
    store.subscribe((d, why) => {
      lastTap = null; // any change in between means the next tap isn't a double-tap (tap() sets it again afterwards)
      solve(); highlight = new Set(); updateAll(); status(); describe(); working(); if (opts.onChange) opts.onChange(store.drawing, result);
    });
    const resizer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => render()) : null;
    if (resizer) resizer.observe(svg);
    solve();
    updateAll();
    status();
    describe();
    requestAnimationFrame(() => fit());

    return {
      store,
      get result() { return result; },
      get netlist() { return nl; },
      get selection() { return selectionOf(); },
      get mode() { return mode.kind; },
      view,
      gridToClient,
      clientToGrid,
      fit,
      toolButton: (type) => host.querySelector(`.ck-tool[data-type="${type}"]`),
      setShow(key, on) { show[key] = on; const cb = host.querySelector(`[data-show="${key}"]`); if (cb) cb.checked = on; render(); working(); },
      setBoard,
      get board() { return board; },
      select(ids) { selectOnly({ components: ids }); updateAll(); },
      setView(x, y, z) { view.x = x; view.y = y; view.z = z; render(); },
      parseValue,
      // Remove everything this editor added to the page (used when switching between Free Build and a challenge).
      destroy() {
        if (board) setBoard(false);
        for (const [target, type, fn, o] of listeners) target.removeEventListener(type, fn, o);
        if (resizer) resizer.disconnect();
        host.innerHTML = '';
        host.className = '';
      },
    };
  }

  (root.Circuits = root.Circuits || {}).editor = { create, parseValue };
})(window);
