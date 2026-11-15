// Circuit builder: works out which terminals are joined (plan: docs/CIRCUIT_BUILDER_PLAN.md, section 4).
// Input: a drawing { components, junctions, wires }. Output: the netlist, which never depends on positions,
// rotations, wire routes or the order things were added in: only on which wire ends are attached to what.
//   points   every joining point, in a fixed order: component terminals (components sorted by id, terminals
//            in order), then junctions (sorted by id), then loose wire ends (wires sorted by id)
//   nets     groups of points joined by wires, numbered by their first point in that order
// Works in the browser (window.Circuits.netlist) and in Node (require).
(function (root) {
  'use strict';
  const C = typeof module !== 'undefined' && module.exports ? require('./components.js') : root.Circuits.components;

  const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

  function makeUF(n) {
    const p = Array.from({ length: n }, (_, i) => i);
    const find = (x) => { while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; };
    const union = (a, b) => { a = find(a); b = find(b); if (a === b) return false; if (a < b) p[b] = a; else p[a] = b; return true; };
    return { find, union };
  }

  // Key of a component terminal's point.
  const terminalKey = (id, t) => `c:${id}:${t}`;

  function build(drawing) {
    const issues = [];
    const components = [...((drawing && drawing.components) || [])].sort(byId);
    const junctions = [...((drawing && drawing.junctions) || [])].sort(byId);
    const wires = [...((drawing && drawing.wires) || [])].sort(byId);

    // ---- check the drawing's ids ----
    const seen = new Set();
    for (const x of [...components, ...junctions, ...wires]) {
      if (typeof x.id !== 'string' || !x.id) issues.push({ code: 'bad-id', level: 'error', ids: [], message: 'A part of the drawing has no id.' });
      else if (seen.has(x.id)) issues.push({ code: 'duplicate-id', level: 'error', ids: [x.id], message: `Two parts of the drawing share the id "${x.id}".` });
      seen.add(x.id);
    }
    const known = components.filter((c) => {
      if (C.TYPES[c.type]) return true;
      issues.push({ code: 'unknown-type', level: 'error', ids: [c.id], message: `"${c.id}" is an unknown kind of component (${c.type}).` });
      return false;
    });

    // ---- points ----
    const keys = [];
    const index = new Map();
    const addPoint = (key) => { if (!index.has(key)) { index.set(key, keys.length); keys.push(key); } return index.get(key); };
    const terminalCount = new Map();
    for (const c of known) {
      const n = C.TYPES[c.type].terminals.length;
      terminalCount.set(c.id, n);
      for (let t = 0; t < n; t++) addPoint(terminalKey(c.id, t));
    }
    const junctionIds = new Set(junctions.map((j) => j.id));
    for (const j of junctions) addPoint(`j:${j.id}`);

    // A wire end: a component terminal, a junction, or a loose end.
    const ends = [];
    const resolve = (w, which) => {
      const e = w[which];
      if (e && typeof e.c === 'string') {
        const n = terminalCount.get(e.c);
        if (n !== undefined && Number.isInteger(e.t) && e.t >= 0 && e.t < n) return { key: terminalKey(e.c, e.t), loose: false };
        issues.push({ code: 'bad-reference', level: 'error', ids: [w.id], message: `Wire ${w.id} is attached to a terminal that doesn't exist (${e.c}, terminal ${e.t}).` });
      } else if (e && typeof e.j === 'string') {
        if (junctionIds.has(e.j)) return { key: `j:${e.j}`, loose: false };
        issues.push({ code: 'bad-reference', level: 'error', ids: [w.id], message: `Wire ${w.id} is attached to a junction that doesn't exist (${e.j}).` });
      }
      return { key: `f:${w.id}:${which}`, loose: true };
    };
    const wireEnds = wires.map((w) => {
      const a = resolve(w, 'from');
      const b = resolve(w, 'to');
      ends.push(a, b);
      return { id: w.id, a, b };
    });
    for (const e of ends) if (e.loose) addPoint(e.key);

    // ---- join along the wires ----
    const uf = makeUF(keys.length);
    const wireEdges = [];
    for (const w of wireEnds) {
      uf.union(index.get(w.a.key), index.get(w.b.key));
      wireEdges.push({ id: w.id, a: w.a.key, b: w.b.key });
    }

    // ---- number the nets by their first point ----
    const netOfRoot = new Map();
    const pointNet = {};
    const netPoints = [];
    keys.forEach((key, i) => {
      const r = uf.find(i);
      if (!netOfRoot.has(r)) { netOfRoot.set(r, netPoints.length); netPoints.push([]); }
      const n = netOfRoot.get(r);
      pointNet[key] = n;
      netPoints[n].push(key);
    });

    const elements = known.map((c) => {
      const def = C.TYPES[c.type];
      return {
        id: c.id,
        type: c.type,
        label: typeof c.label === 'string' && c.label ? c.label : c.id,
        params: C.normalise(c.type, c.params),
        nets: def.terminals.map((_, t) => pointNet[terminalKey(c.id, t)]),
      };
    });

    // ---- loose ends and unconnected terminals (a terminal is unconnected when no other terminal shares its net) ----
    const loose = wireEnds.flatMap((w) => [w.a, w.b].filter((e) => e.loose).map(() => w.id));
    if (loose.length) {
      const ids = [...new Set(loose)];
      issues.push({ code: 'loose-end', level: 'warning', ids, message: ids.length === 1 ? `Wire ${ids[0]} has a loose end: it isn't connected to anything there.` : `${ids.length} wires have loose ends: they aren't connected to anything there.` });
    }
    const unconnected = [];
    for (const c of known) {
      for (let t = 0; t < terminalCount.get(c.id); t++) {
        const net = netPoints[pointNet[terminalKey(c.id, t)]];
        if (!net.some((k) => k.startsWith('c:') && k !== terminalKey(c.id, t))) unconnected.push({ id: c.id, t });
      }
    }

    return { elements, netCount: netPoints.length, netPoints, pointNet, wireEdges, unconnected, issues };
  }

  // The connections as sets of terminals ("R1:0"), independent of net numbers: two drawings with the same
  // partition are the same circuit (for the same component ids). Nets with no terminal (junction-only, loose ends) are left out.
  function partition(nl) {
    const groups = new Map();
    for (const e of nl.elements) e.nets.forEach((n, t) => {
      if (!groups.has(n)) groups.set(n, []);
      groups.get(n).push(`${e.id}:${t}`);
    });
    return [...groups.values()].map((g) => g.sort()).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }

  // A text fingerprint of the electrical circuit (types, settings and connections) for exact comparison.
  function signature(nl) {
    return JSON.stringify({ elements: nl.elements.map((e) => [e.id, e.type, e.params, e.nets]), partition: partition(nl) });
  }

  const api = { build, partition, signature, terminalKey, makeUF };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.Circuits = root.Circuits || {}).netlist = api;
})(typeof window !== 'undefined' ? window : globalThis);
