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
  // What a wire's automatic route keeps clear of: other components' terminals and bodies (its own ends excepted).
  // Since touching means joined, passing through a terminal would make a join nobody asked for. Junctions and wire
  // ends are not avoided: a wire end placed on a wire is meant to make a T.
  function obstaclesFor(d, w) {
    const own = new Set([w.from, w.to].map((e) => (e.c !== undefined ? `c:${e.c}:${e.t}` : '')));
    const points = [];
    for (const c of d.components) for (let t = 0; t < C.TYPES[c.type].terminals.length; t++) if (!own.has(`c:${c.id}:${t}`)) points.push(C.terminalPosition(c, t));
    const boxes = d.components.map((c) => { const b = componentBox(c); return { x0: b.x0 + 0.5, x1: b.x1 - 0.5, y0: b.y0 + 0.5, y1: b.y1 - 0.5 }; });
    return { points, boxes };
  }
  // The wire as drawn: its ends and bends joined by horizontal and vertical lines only. Where two points don't
  // line up, the corner(s) are chosen automatically: an L either way round, or a Z, whichever keeps clear of
  // obstacles, leaves and reaches terminals along the way they face, and is shortest. Straight pieces between
  // points the student placed are kept exactly as they are.
  function wirePath(d, w) {
    const a = endPos(d, w.from);
    const b = endPos(d, w.to);
    if (!a || !b) return [];
    const pts = [a, ...(w.via || []).map((p) => [p[0], p[1]]), b];
    let obs = null;
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const p = out[out.length - 1];
      const q = pts[i];
      if (same(p, q)) continue;
      obs = obs || obstaclesFor(d, w);
      const aligned = p[0] === q[0] || p[1] === q[1];
      if (!aligned || hits(obs, p, q)) {
        const startDir = i === 1 && w.from.c !== undefined && comp(d, w.from.c) ? terminalDir(comp(d, w.from.c), w.from.t) : null;
        const endDir = i === pts.length - 1 && w.to.c !== undefined && comp(d, w.to.c) ? terminalDir(comp(d, w.to.c), w.to.t) : null;
        for (const c of bestCorners(p, q, obs, startDir, endDir)) if (!same(out[out.length - 1], c)) out.push(c);
      }
      if (!same(out[out.length - 1], q)) out.push(q);
    }
    return out;
  }
  // How many obstacles the straight line u–v touches.
  function hits(obs, u, v) {
    let n = 0;
    for (const o of obs.points) if (segDistance(o, u, v) < 1e-9) n++;
    for (const bx of obs.boxes) if (boxHitsSegment(bx, u, v)) n++;
    return n;
  }
  function bestCorners(p, q, obs, startDir, endDir) {
    const [x0, x1] = [Math.min(p[0], q[0]), Math.max(p[0], q[0])];
    const [y0, y1] = [Math.min(p[1], q[1]), Math.max(p[1], q[1])];
    const cands = [];
    if (p[0] === q[0] || p[1] === q[1]) { // in line: straight, or a U-shaped detour to one side
      cands.push([]);
      for (const o of [1, -1, 2, -2, 3, -3, 4, -4]) cands.push(p[1] === q[1] ? [[p[0], p[1] + o], [q[0], q[1] + o]] : [[p[0] + o, p[1]], [q[0] + o, q[1]]]);
    } else cands.push([[q[0], p[1]]], [[p[0], q[1]]]); // the two L shapes, across first preferred
    const near = (lo, hi) => {
      const mid = Math.round((lo + hi) / 2);
      const ks = [];
      for (let k = lo + 1; k < hi; k++) ks.push(k);
      ks.sort((m, n) => Math.abs(m - mid) - Math.abs(n - mid));
      for (let s = 1; s <= 3; s++) ks.push(lo - s, hi + s);
      return ks;
    };
    if (p[0] !== q[0] && p[1] !== q[1]) {
      for (const k of near(x0, x1)) cands.push([[k, p[1]], [k, q[1]]]); // Z: across, down, across
      for (const k of near(y0, y1)) cands.push([[p[0], k], [q[0], k]]); // Z: down, across, down
    }
    const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
    let best = null;
    cands.forEach((corners, order) => {
      const route = [p, ...corners, q];
      let score = 0;
      for (let s = 0; s + 1 < route.length; s++) {
        const [u, v] = [route[s], route[s + 1]];
        if (same(u, v)) continue;
        for (const o of obs.points) if (segDistance(o, u, v) < 1e-9) score += 1000;
        for (const bx of obs.boxes) if (boxHitsSegment(bx, u, v)) score += 1000;
      }
      const first = [sign(route[1][0] - p[0]), sign(route[1][1] - p[1])];
      const last = [sign(q[0] - route[route.length - 2][0]), sign(q[1] - route[route.length - 2][1])];
      if (startDir) { const dot = first[0] * startDir[0] + first[1] * startDir[1]; score += dot < 0 ? 1000 : dot === 0 ? 2 : 0; }
      if (endDir) { const dot = last[0] * endDir[0] + last[1] * endDir[1]; score += dot > 0 ? 1000 : dot === 0 ? 2 : 0; }
      let len = 0;
      for (let s = 0; s + 1 < route.length; s++) len += Math.abs(route[s + 1][0] - route[s][0]) + Math.abs(route[s + 1][1] - route[s][1]);
      score += (len - (x1 - x0) - (y1 - y0)) + 0.5 * corners.length + order * 1e-6;
      if (!best || score < best.score) best = { score, corners };
    });
    return best.corners;
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
  // Kept for the editor's calls: joining things that touch is now done everywhere by settle() (below).
  function joinAt(d) { return settle(d); }

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
    const path = wirePath({ ...d, components: d.components.filter((x) => x.id !== id) }, w); // its route before the component arrived
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

  // ---------------- what you see is what you get ----------------
  // The drawing must mean what a person reading it would see (teacher's requirement, 15 November 2026):
  //   1. Things at the same grid point (terminals, junctions, loose wire ends) are joined.
  //   2. A terminal, junction or loose end on the middle of a wire is joined to it (a T, drawn with a dot).
  //   3. A component lying along a wire, terminal to terminal, is in that wire (the wire is cut).
  //   4. Wires that cross are NOT joined (the IB convention: a join needs a dot).
  // touches() lists every place where the drawing shows a join that the wires don't make; settle() makes them all.

  function touches(d) {
    // Which points are already joined by wires.
    const parent = new Map();
    const find = (k) => { while (parent.has(k) && parent.get(k) !== k) k = parent.get(k); return k; };
    const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent.set(a, b); };
    const keyOf = (w, which) => { const e = w[which]; return e.c !== undefined ? `c:${e.c}:${e.t}` : e.j !== undefined ? `j:${e.j}` : `f:${w.id}:${which}`; };
    for (const w of d.wires) union(keyOf(w, 'from'), keyOf(w, 'to'));
    const objects = [];
    for (const c of d.components) for (let t = 0; t < C.TYPES[c.type].terminals.length; t++) objects.push({ kind: 'terminal', ref: { c: c.id, t }, key: `c:${c.id}:${t}`, p: C.terminalPosition(c, t) });
    for (const j of d.junctions) objects.push({ kind: 'junction', ref: { j: j.id }, key: `j:${j.id}`, p: [j.x, j.y] });
    for (const w of d.wires) for (const which of ['from', 'to']) if (w[which].free) objects.push({ kind: 'loose', wire: w.id, which, key: `f:${w.id}:${which}`, p: w[which].free });
    const out = [];
    // 3. Components lying along a wire.
    for (const c of d.components) {
      if (C.TYPES[c.type].terminals.length < 2) continue;
      const P = [0, 1].map((t) => C.terminalPosition(c, t));
      for (const w of d.wires) {
        if (ends(w).some((e) => e.c === c.id)) continue;
        const path = wirePath(d, w);
        if (path.some((q, i) => i + 1 < path.length && P.every((x) => segDistance(x, q, path[i + 1]) < 1e-9))) out.push({ kind: 'along', c: c.id, wire: w.id });
      }
    }
    // 1. The same point.
    const byPoint = new Map();
    for (const o of objects) { const k = `${o.p[0]},${o.p[1]}`; if (!byPoint.has(k)) byPoint.set(k, []); byPoint.get(k).push(o); }
    for (const group of byPoint.values()) {
      for (let i = 1; i < group.length; i++) if (find(group[0].key) !== find(group[i].key)) out.push({ kind: 'point', a: group[0], b: group[i] });
    }
    // 2. On the middle of a wire.
    for (const o of objects) {
      for (const w of d.wires) {
        if (find(keyOf(w, 'from')) === find(o.key)) continue; // already joined to that wire
        const path = wirePath(d, w);
        if (path.length < 2 || same(o.p, path[0]) || same(o.p, path[path.length - 1])) continue;
        if (path.some((q, i) => i + 1 < path.length && segDistance(o.p, q, path[i + 1]) < 1e-9)) out.push({ kind: 'tee', o, wire: w.id });
      }
    }
    return out;
  }

  function settle(d) {
    let made = 0;
    for (let guard = 0; guard < 500; guard++) {
      const list = touches(d);
      const t = list.find((x) => x.kind === 'along') || list[0];
      if (!t) break;
      made++;
      if (t.kind === 'along') { if (!insertIntoWire(d, t.c, t.wire)) break; continue; }
      if (t.kind === 'point') {
        const [a, b] = t.a.kind === 'loose' ? [t.a, t.b] : [t.b, t.a]; // a loose end, if there is one, goes onto the other
        if (a.kind === 'loose') {
          const w = d.wires.find((x) => x.id === a.wire);
          if (b.kind === 'loose') { // two loose ends: a junction joins them
            const jid = nextId(d, 'j', d.junctions);
            d.junctions.push({ id: jid, x: a.p[0], y: a.p[1] });
            w[a.which] = { j: jid };
            d.wires.find((x) => x.id === b.wire)[b.which] = { j: jid };
          } else w[a.which] = clone(b.ref);
        } else addWire(d, a.ref, b.ref); // a wire with no length
        continue;
      }
      // A T: put a junction on the wire there and join the object to it.
      const end = splitWire(d, t.wire, t.o.p);
      if (!end) break;
      if (t.o.kind === 'loose') d.wires.find((x) => x.id === t.o.wire)[t.o.which] = end;
      else addWire(d, t.o.ref, end);
    }
    tidy(d);
    return made;
  }

  // Things that look wrong on the page but are not joins: a wire running across a component it isn't attached to,
  // and two wires lying on top of each other (they would read as one wire). Shown as warnings by the editor.
  function layoutProblems(d) {
    const out = [];
    for (const c of d.components) {
      const b = componentBox(c);
      const inner = { x0: b.x0 + 0.5, x1: b.x1 - 0.5, y0: b.y0 + 0.5, y1: b.y1 - 0.5 };
      for (const w of d.wires) {
        if (ends(w).some((e) => e.c === c.id)) continue;
        const path = wirePath(d, w);
        if (path.some((p, i) => i + 1 < path.length && boxHitsSegment(inner, p, path[i + 1]))) out.push({ code: 'across', c: c.id, wire: w.id });
      }
    }
    const segs = [];
    for (const w of d.wires) { const path = wirePath(d, w); for (let i = 0; i + 1 < path.length; i++) segs.push({ w: w.id, a: path[i], b: path[i + 1] }); }
    const seen = new Set();
    for (let i = 0; i < segs.length; i++) {
      for (let k = i + 1; k < segs.length; k++) {
        const [s, t] = [segs[i], segs[k]];
        if (s.w === t.w) continue;
        let overlap = 0;
        if (s.a[1] === s.b[1] && t.a[1] === t.b[1] && s.a[1] === t.a[1]) overlap = Math.min(Math.max(s.a[0], s.b[0]), Math.max(t.a[0], t.b[0])) - Math.max(Math.min(s.a[0], s.b[0]), Math.min(t.a[0], t.b[0]));
        else if (s.a[0] === s.b[0] && t.a[0] === t.b[0] && s.a[0] === t.a[0]) overlap = Math.min(Math.max(s.a[1], s.b[1]), Math.max(t.a[1], t.b[1])) - Math.max(Math.min(s.a[1], s.b[1]), Math.min(t.a[1], t.b[1]));
        const key = [s.w, t.w].sort().join('|');
        if (overlap > 0 && !seen.has(key)) { seen.add(key); out.push({ code: 'overlap', wires: [s.w, t.w] }); }
      }
    }
    return out;
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

  const settled = (d) => { settle(d); return d; };
  function createStore(initial) {
    let drawing = initial ? settled(normalise(initial)) : empty();
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
        settle(draft); // what you see is what you get
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
      load(d) { undo.push(JSON.stringify(drawing)); redo = []; coalesce = null; drawing = settled(normalise(d)); notify('load'); },
    };
  }

  const ops = { addComponent, moveItems, rotate, setParam, setLabel, addWire, moveWireEnd, setVia, splitWire, remove, tidy, joinAt, takeOut, insertIntoWire, settle };
  const api = { empty, clone, normalise, ops, findInsertion, touches, settle, layoutProblems, createStore, validate, wirePath, endPos, terminalPos, terminalDir, nearestOnWire, segDistance, componentBox };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.Circuits = root.Circuits || {}).model = api;
})(typeof window !== 'undefined' ? window : globalThis);
