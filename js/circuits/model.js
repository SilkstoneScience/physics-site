// Circuit builder: the drawing and everything that changes it (plan: docs/CIRCUIT_BUILDER_PLAN.md, sections 3 and 6).
// Pure functions on a drawing { v, components, junctions, wires } (the format in the plan), wire geometry for the
// screen, and a store with undo/redo. Nothing electrical happens here: connections are worked out by netlist.js
// and the physics by engine.js. Works in the browser (window.Circuits.model) and in Node (require).
(function (root) {
  'use strict';
  const C = typeof module !== 'undefined' && module.exports ? require('./components.js') : root.Circuits.components;

  const clone = (x) => JSON.parse(JSON.stringify(x));
  const empty = () => ({ v: 1, components: [], junctions: [], wires: [] });
  const same = (p, q) => p[0] === q[0] && p[1] === q[1];

  // ---------------- geometry (grid squares) ----------------

  const comp = (d, id) => d.components.find((c) => c.id === id);
  const terminalPos = (d, id, t) => C.terminalPosition(comp(d, id), t);
  // The direction a terminal faces, away from its component (for wire routing).
  function terminalDir(c, t) {
    const [x, y] = C.TYPES[c.type].terminals[t];
    const p = C.terminalPosition({ ...c, x: 0, y: 0 }, t);
    const len = Math.hypot(x, y) || 1;
    return [Math.round(p[0] / len), Math.round(p[1] / len)];
  }
  function endPos(d, end) {
    if (!end) return null;
    if (end.c !== undefined) { const c = comp(d, end.c); return c && Number.isInteger(end.t) && end.t < C.TYPES[c.type].terminals.length ? C.terminalPosition(c, end.t) : null; }
    if (end.j !== undefined) { const j = d.junctions.find((x) => x.id === end.j); return j ? [j.x, j.y] : null; }
    if (end.free) return [end.free[0], end.free[1]];
    return null;
  }
  // The wire as drawn: its ends and bends joined by horizontal and vertical lines only.
  function wirePath(d, w) {
    const a = endPos(d, w.from);
    const b = endPos(d, w.to);
    if (!a || !b) return [];
    const pts = [a, ...(w.via || []).map((p) => [p[0], p[1]]), b];
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const p = out[out.length - 1];
      const q = pts[i];
      if (p[0] !== q[0] && p[1] !== q[1]) {
        // Leave a terminal (and arrive at one) along the way it faces, so the wire never doubles back over its
        // component; between bends, go across first.
        let vertical = false;
        if (i === 1 && w.from.c !== undefined && comp(d, w.from.c)) {
          const [dx, dy] = terminalDir(comp(d, w.from.c), w.from.t);
          vertical = dx === 0 ? (q[1] - p[1]) * dy >= 0 : (q[0] - p[0]) * dx < 0;
        } else if (i === pts.length - 1 && w.to.c !== undefined && comp(d, w.to.c)) {
          const [dx, dy] = terminalDir(comp(d, w.to.c), w.to.t); // the wire arrives at q moving opposite to (dx, dy)
          vertical = dx !== 0 ? (p[0] - q[0]) * dx >= 0 : (p[1] - q[1]) * dy < 0;
        }
        out.push(vertical ? [p[0], q[1]] : [q[0], p[1]]);
      }
      if (!same(out[out.length - 1], q)) out.push(q);
    }
    return out;
  }
  // Distance from point p to the segment a–b (grid squares).
  function segDistance(p, a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2)) : 0;
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  }
  // The grid point on wire w nearest to p, and the segment it is on.
  function nearestOnWire(d, w, p) {
    const path = wirePath(d, w);
    let best = null;
    for (let i = 0; i + 1 < path.length; i++) {
      const dist = segDistance(p, path[i], path[i + 1]);
      if (!best || dist < best.dist) {
        const [a, b] = [path[i], path[i + 1]];
        const q = a[0] === b[0]
          ? [a[0], Math.min(Math.max(Math.round(p[1]), Math.min(a[1], b[1])), Math.max(a[1], b[1]))]
          : [Math.min(Math.max(Math.round(p[0]), Math.min(a[0], b[0])), Math.max(a[0], b[0])), a[1]];
        best = { dist, point: q, segment: i };
      }
    }
    return best;
  }
  // The grid squares a component covers (for hit-testing and fitting the view).
  function componentBox(c) {
    const pts = C.TYPES[c.type].terminals.map((_, t) => C.terminalPosition(c, t));
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    let [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    if (x1 - x0 < 1.5) { x0 = c.x - 1; x1 = c.x + 1; }
    if (y1 - y0 < 1.5) { y0 = c.y - 1; y1 = c.y + 1; }
    return { x0, x1, y0, y1 };
  }

  // ---------------- ids ----------------

  function nextId(d, prefix, list) {
    const used = new Set(list.map((x) => x.id));
    let n = 1;
    while (used.has(`${prefix}${n}`)) n++;
    return `${prefix}${n}`;
  }
  function nextLabel(d, prefix) {
    const used = new Set(d.components.map((c) => c.label));
    let n = 1;
    while (used.has(`${prefix}${n}`)) n++;
    return `${prefix}${n}`;
  }

  // ---------------- operations (each changes the drawing it is given) ----------------

  const ends = (w) => [w.from, w.to];
  const endIs = (e, ref) => (ref.c !== undefined ? e.c === ref.c && e.t === ref.t : ref.j !== undefined ? e.j === ref.j : false);

  function addComponent(d, type, x, y, params) {
    const def = C.TYPES[type];
    if (!def) throw new Error(`Unknown component type ${type}`);
    const label = nextLabel(d, def.prefix);
    const id = label.toLowerCase();
    const c = { id: d.components.some((k) => k.id === id) ? nextId(d, def.prefix.toLowerCase(), d.components) : id, type, label, x: Math.round(x), y: Math.round(y), rot: 0, params: C.normalise(type, params) };
    d.components.push(c);
    return c.id;
  }
  function moveItems(d, sel, dx, dy) {
    for (const id of sel.components || []) { const c = comp(d, id); if (c) { c.x += dx; c.y += dy; } }
    for (const id of sel.junctions || []) { const j = d.junctions.find((x) => x.id === id); if (j) { j.x += dx; j.y += dy; } }
    // Bends of wires whose two ends both move go with them; loose ends of selected wires too.
    const moving = (e) => (e.c !== undefined && (sel.components || []).includes(e.c)) || (e.j !== undefined && (sel.junctions || []).includes(e.j));
    for (const w of d.wires) {
      const both = moving(w.from) && moving(w.to);
      const selected = (sel.wires || []).includes(w.id);
      if (both || selected) w.via = (w.via || []).map(([x, y]) => [x + dx, y + dy]);
      if (selected) for (const e of ends(w)) if (e.free) e.free = [e.free[0] + dx, e.free[1] + dy];
    }
  }
  function rotate(d, ids, quarterTurns = 1) {
    for (const id of ids) { const c = comp(d, id); if (c) c.rot = (((c.rot || 0) + 90 * quarterTurns) % 360 + 360) % 360; }
  }
  function setParam(d, id, key, value) {
    const c = comp(d, id);
    if (!c) return;
    c.params = C.normalise(c.type, { ...c.params, [key]: value });
  }
  function setLabel(d, id, label) {
    const c = comp(d, id);
    if (c && typeof label === 'string' && label.trim()) c.label = label.trim().slice(0, 12);
  }
  function addWire(d, from, to, via = []) {
    const id = nextId(d, 'w', d.wires);
    d.wires.push({ id, from: clone(from), to: clone(to), via: via.map((p) => [p[0], p[1]]) });
    return id;
  }
  function moveWireEnd(d, wid, which, end) {
    const w = d.wires.find((x) => x.id === wid);
    if (w) w[which] = clone(end);
  }
  function setVia(d, wid, via) {
    const w = d.wires.find((x) => x.id === wid);
    if (w) w.via = via.map((p) => [p[0], p[1]]);
  }
  // Puts a junction on wire wid at grid point p and splits the wire there. Returns the end to attach to:
  // the junction, or the wire's own end if p is one of its ends.
  function splitWire(d, wid, p) {
    const w = d.wires.find((x) => x.id === wid);
    if (!w) return null;
    const path = wirePath(d, w);
    if (!path.length) return null;
    if (same(p, path[0])) return clone(w.from);
    if (same(p, path[path.length - 1])) return clone(w.to);
    let seg = -1;
    for (let i = 0; i + 1 < path.length; i++) if (segDistance(p, path[i], path[i + 1]) < 1e-9) { seg = i; break; }
    if (seg < 0) return null;
    const jid = nextId(d, 'j', d.junctions);
    d.junctions.push({ id: jid, x: p[0], y: p[1] });
    const before = path.slice(1, seg + 1).filter((q) => !same(q, p));
    const after = path.slice(seg + 1, path.length - 1).filter((q) => !same(q, p));
    const to = w.to;
    w.to = { j: jid };
    w.via = before;
    d.wires.push({ id: nextId(d, 'w', d.wires), from: { j: jid }, to: clone(to), via: after });
    return { j: jid };
  }
  // Removes components, wires and junctions. Wires attached to a removed component or junction keep a loose end
  // where it was, so they can be reattached. Junctions left with no wires are removed too.
  function remove(d, sel) {
    const cs = new Set(sel.components || []);
    const js = new Set(sel.junctions || []);
    const ws = new Set(sel.wires || []);
    for (const w of d.wires) {
      if (ws.has(w.id)) continue;
      for (const which of ['from', 'to']) {
        const e = w[which];
        if ((e.c !== undefined && cs.has(e.c)) || (e.j !== undefined && js.has(e.j))) w[which] = { free: endPos(d, e) };
      }
    }
    d.wires = d.wires.filter((w) => !ws.has(w.id));
    d.components = d.components.filter((c) => !cs.has(c.id));
    d.junctions = d.junctions.filter((j) => !js.has(j.id));
    tidy(d);
  }
  // Removes wires with no length that join a point to itself, and junctions no wire uses.
  function tidy(d) {
    d.wires = d.wires.filter((w) => !(w.from.j !== undefined && w.from.j === w.to.j) && !(w.from.c !== undefined && w.from.c === w.to.c && w.from.t === w.to.t));
    const used = new Set(d.wires.flatMap((w) => ends(w).filter((e) => e.j !== undefined).map((e) => e.j)));
    d.junctions = d.junctions.filter((j) => used.has(j.id));
  }
  // After components are dropped: a terminal that lands exactly on another terminal, a junction or a loose wire end
  // is joined to it with an explicit wire (so the netlist sees it). Landing on the middle of a wire does NOT join:
  // that happened by accident too easily when tidying a circuit (found by the interface tests). Returns the joins made.
  function joinAt(d, ids) {
    let joins = 0;
    const joined = (a, b) => d.wires.some((w) => (endIs(w.from, a) && endIs(w.to, b)) || (endIs(w.from, b) && endIs(w.to, a)));
    for (const id of ids) {
      const c = comp(d, id);
      if (!c) continue;
      for (let t = 0; t < C.TYPES[c.type].terminals.length; t++) {
        const me = { c: id, t };
        const p = C.terminalPosition(c, t);
        for (const o of d.components) {
          if (o.id === id) continue;
          for (let u = 0; u < C.TYPES[o.type].terminals.length; u++) {
            const them = { c: o.id, t: u };
            if (same(C.terminalPosition(o, u), p) && !joined(me, them)) { addWire(d, me, them); joins++; }
          }
        }
        for (const j of d.junctions) if (same([j.x, j.y], p) && !joined(me, { j: j.id })) { addWire(d, me, { j: j.id }); joins++; }
        for (const w of d.wires) for (const which of ['from', 'to']) if (w[which].free && same(w[which].free, p)) { w[which] = clone(me); joins++; }
      }
    }
    tidy(d);
    return joins;
  }

  // ---------------- taking a component out, and putting one into a wire ----------------

  // Does an axis-aligned box (grid squares) touch a horizontal or vertical segment?
  const boxHitsSegment = (b, p, q) => Math.max(p[0], q[0]) >= b.x0 && Math.min(p[0], q[0]) <= b.x1 && Math.max(p[1], q[1]) >= b.y0 && Math.min(p[1], q[1]) <= b.y1;

  // Takes component id out of the circuit without deleting it. The wires that were attached keep their places:
  // with join = false they are left with loose ends (a gap in the circuit); with join = true (two-terminal
  // components) a wire takes the component's place. The component is moved a little way aside, to a clear spot.
  function takeOut(d, id, join = false) {
    const c = comp(d, id);
    if (!c) return false;
    const n = C.TYPES[c.type].terminals.length;
    const pos = Array.from({ length: n }, (_, t) => C.terminalPosition(c, t));
    const at = (t) => d.wires.some((w) => ends(w).some((e) => e.c === id && e.t === t));
    if (join && n === 2 && at(0) && at(1)) {
      const ja = nextId(d, 'j', d.junctions);
      d.junctions.push({ id: ja, x: pos[0][0], y: pos[0][1] });
      const jb = nextId(d, 'j', d.junctions);
      d.junctions.push({ id: jb, x: pos[1][0], y: pos[1][1] });
      for (const w of d.wires) for (const which of ['from', 'to']) if (w[which].c === id) w[which] = { j: w[which].t === 0 ? ja : jb };
      addWire(d, { j: ja }, { j: jb });
    } else {
      for (const w of d.wires) for (const which of ['from', 'to']) if (w[which].c === id) w[which] = { free: pos[w[which].t] };
    }
    // Move it aside: try steps away from its axis, then along it, until nothing is in the way.
    const across = c.rot === 90 || c.rot === 270 ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
    const along = across.map(([x, y]) => [y, x]);
    const clear = (x, y) => {
      const b = componentBox({ ...c, x, y });
      const bb = { x0: b.x0 - 0.5, x1: b.x1 + 0.5, y0: b.y0 - 0.5, y1: b.y1 + 0.5 };
      if (d.components.some((o) => o.id !== id && (() => { const ob = componentBox(o); return ob.x0 <= bb.x1 && ob.x1 >= bb.x0 && ob.y0 <= bb.y1 && ob.y1 >= bb.y0; })())) return false;
      return !d.wires.some((w) => { const path = wirePath(d, w); return path.some((p, i) => i + 1 < path.length && boxHitsSegment(bb, p, path[i + 1])); });
    };
    let moved = false;
    for (let k = 3; k <= 12 && !moved; k++) {
      for (const [dx, dy] of [...across, ...along]) if (!moved && clear(c.x + dx * k, c.y + dy * k)) { c.x += dx * k; c.y += dy * k; moved = true; }
    }
    if (!moved) { c.x += across[0][0] * 4; c.y += across[0][1] * 4; }
    tidy(d);
    return true;
  }

  // Where a component of this type, held at grid point p with rotation rot, would go into a wire: the nearest
  // straight wire segment (within maxDist squares) long enough to hold it. Returns { wire, x, y, rot } or null.
  // The component is turned to lie along the segment (keeping its rotation if it already does).
  function findInsertion(d, type, p, rot = 0, maxDist = 0.75) {
    const def = C.TYPES[type];
    if (!def || def.terminals.length < 2) return null;
    let best = null;
    for (const w of d.wires) {
      const path = wirePath(d, w);
      for (let i = 0; i + 1 < path.length; i++) {
        const [a, b] = [path[i], path[i + 1]];
        const horizontal = a[1] === b[1];
        const lo = horizontal ? Math.min(a[0], b[0]) : Math.min(a[1], b[1]);
        const hi = horizontal ? Math.max(a[0], b[0]) : Math.max(a[1], b[1]);
        if (hi - lo < 4) continue;
        const dist = segDistance(p, a, b);
        if (dist > maxDist || (best && dist >= best.dist)) continue;
        const along = Math.min(hi - 2, Math.max(lo + 2, Math.round(horizontal ? p[0] : p[1])));
        const r = horizontal ? (rot === 0 || rot === 180 ? rot : 0) : (rot === 90 || rot === 270 ? rot : 90);
        best = { wire: w.id, x: horizontal ? along : a[0], y: horizontal ? a[1] : along, rot: r, dist };
      }
    }
    if (!best) return null;
    delete best.dist;
    return best;
  }

  // Puts component id into wire wid in series: the wire must have a straight segment through both of the
  // component's terminals 0 and 1 (findInsertion places it so). The wire is cut there and joined to the terminals.
  function insertIntoWire(d, id, wid) {
    const c = comp(d, id);
    const w = d.wires.find((x) => x.id === wid);
    if (!c || !w) return false;
    const path = wirePath(d, w);
    const P = [0, 1].map((t) => C.terminalPosition(c, t));
    let seg = -1;
    for (let i = 0; i + 1 < path.length; i++) if (P.every((q) => segDistance(q, path[i], path[i + 1]) < 1e-9)) { seg = i; break; }
    if (seg < 0) return false;
    const s = (q) => Math.abs(q[0] - path[seg][0]) + Math.abs(q[1] - path[seg][1]);
    const near = s(P[0]) <= s(P[1]) ? 0 : 1;
    const far = 1 - near;
    const to = w.to;
    const after = path.slice(seg + 1, path.length - 1).map((q) => [q[0], q[1]]);
    w.via = path.slice(1, seg + 1).map((q) => [q[0], q[1]]);
    w.to = { c: id, t: near };
    d.wires.push({ id: nextId(d, 'w', d.wires), from: { c: id, t: far }, to: clone(to), via: after });
    tidy(d);
    return true;
  }

  // Problems with a drawing's structure (the tests run this after every operation). Empty means sound.
  function validate(d) {
    const out = [];
    const ids = new Set();
    for (const x of [...d.components, ...d.junctions, ...d.wires]) { if (ids.has(x.id)) out.push(`duplicate id ${x.id}`); ids.add(x.id); }
    for (const c of d.components) {
      if (!C.TYPES[c.type]) out.push(`${c.id}: unknown type`);
      if (!Number.isInteger(c.x) || !Number.isInteger(c.y)) out.push(`${c.id}: off the grid`);
      if (![0, 90, 180, 270].includes(c.rot)) out.push(`${c.id}: rotation ${c.rot}`);
    }
    for (const w of d.wires) for (const e of ends(w)) if (!endPos(d, e)) out.push(`${w.id}: end attached to nothing that exists`);
    for (const j of d.junctions) if (!Number.isInteger(j.x) || !Number.isInteger(j.y)) out.push(`${j.id}: off the grid`);
    return out;
  }

  // A drawing from outside (an example, a saved circuit, a share link) made complete and safe: lists present,
  // unknown component types dropped, settings completed and kept within limits, positions on the grid.
  function normalise(input) {
    const d = input && typeof input === 'object' ? clone(input) : {};
    const out = { v: 1, components: [], junctions: [], wires: [] };
    for (const c of Array.isArray(d.components) ? d.components : []) {
      if (!c || !C.TYPES[c.type] || typeof c.id !== 'string') continue;
      const rot = [0, 90, 180, 270].includes(c.rot) ? c.rot : 0;
      out.components.push({ id: c.id, type: c.type, label: typeof c.label === 'string' && c.label ? c.label : c.id.toUpperCase(), x: Math.round(+c.x || 0), y: Math.round(+c.y || 0), rot, params: C.normalise(c.type, c.params) });
    }
    for (const j of Array.isArray(d.junctions) ? d.junctions : []) if (j && typeof j.id === 'string') out.junctions.push({ id: j.id, x: Math.round(+j.x || 0), y: Math.round(+j.y || 0) });
    for (const w of Array.isArray(d.wires) ? d.wires : []) {
      if (!w || typeof w.id !== 'string' || !w.from || !w.to) continue;
      out.wires.push({ id: w.id, from: w.from, to: w.to, via: Array.isArray(w.via) ? w.via.filter((p) => Array.isArray(p)).map((p) => [Math.round(+p[0] || 0), Math.round(+p[1] || 0)]) : [] });
    }
    // Only the first of any repeated id is kept.
    const seen = new Set();
    const first = (x) => (seen.has(x.id) ? false : (seen.add(x.id), true));
    out.components = out.components.filter(first);
    out.junctions = out.junctions.filter(first);
    out.wires = out.wires.filter(first);
    // Wire ends attached to something that doesn't exist become loose ends.
    for (const w of out.wires) for (const which of ['from', 'to']) if (!endPos(out, w[which])) w[which] = { free: [0, 0] };
    return out;
  }

  // ---------------- the store: one drawing, with undo and redo ----------------

  function createStore(initial) {
    let drawing = initial ? normalise(initial) : empty();
    let undo = [];
    let redo = [];
    let coalesce = null;
    const listeners = [];
    const notify = (why) => listeners.forEach((f) => f(drawing, why));
    return {
      get drawing() { return drawing; },
      get canUndo() { return undo.length > 0; },
      get canRedo() { return redo.length > 0; },
      subscribe(f) { listeners.push(f); },
      // Change the drawing: fn(draft) mutates it. One undo step, unless `key` matches the previous change's key
      // (a slider being dragged, a number being typed): then it joins that step.
      change(label, fn, key = null) {
        const before = JSON.stringify(drawing);
        const draft = JSON.parse(before);
        const out = fn(draft);
        if (JSON.stringify(draft) === before) return out;
        if (!(key && key === coalesce)) { undo.push(before); if (undo.length > 100) undo.shift(); }
        redo = [];
        coalesce = key;
        drawing = draft;
        notify(label);
        return out;
      },
      endCoalesce() { coalesce = null; },
      undo() { if (!undo.length) return false; redo.push(JSON.stringify(drawing)); drawing = JSON.parse(undo.pop()); coalesce = null; notify('undo'); return true; },
      redo() { if (!redo.length) return false; undo.push(JSON.stringify(drawing)); drawing = JSON.parse(redo.pop()); coalesce = null; notify('redo'); return true; },
      load(d) { undo.push(JSON.stringify(drawing)); redo = []; coalesce = null; drawing = normalise(d); notify('load'); },
    };
  }

  const ops = { addComponent, moveItems, rotate, setParam, setLabel, addWire, moveWireEnd, setVia, splitWire, remove, tidy, joinAt, takeOut, insertIntoWire };
  const api = { empty, clone, normalise, ops, findInsertion, createStore, validate, wirePath, endPos, terminalPos, terminalDir, nearestOnWire, segDistance, componentBox };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.Circuits = root.Circuits || {}).model = api;
})(typeof window !== 'undefined' ? window : globalThis);
