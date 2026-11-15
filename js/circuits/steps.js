// Circuit builder: "show the working" (plan: docs/CIRCUIT_BUILDER_PLAN.md, section 5).
// For a circuit with one cell or battery: combine series chains and parallel groups until one resistance is left,
// then work the current and p.d. back down to every component. Circuits that need more than the series and
// parallel rules (e.g. a bridge), or that have several cells, get { ok: false } and the editor shows readings only.
// It uses the engine's own element models (Circuits.engine.topology), and tools/circuits/test.mjs checks
// that its values agree with the engine's solution on many random circuits.
// Works in the browser (window.Circuits.steps) and in Node (require).
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const E = isNode ? require('./engine.js') : root.Circuits.engine;

  const SECTION = { a: 'end A to slider', b: 'slider to end B' };
  const leafName = (e) => (e.section ? `${e.label} (${SECTION[e.section]})` : e.label);
  const wrap = (node) => (node.leaf ? node.name : `(${node.name})`);

  // nl: a netlist; result: the engine's solution of it (used only for a filament lamp's resistance at its current).
  function explain(nl, result) {
    const { els, zg } = E.topology(nl);
    const Z = (x) => zg.find(x);
    const sources = els.filter((e) => e.source);
    if (!sources.length) return { ok: false, reason: 'no-source', message: 'There is no cell or battery.' };
    if (sources.length > 1) return { ok: false, reason: 'several-sources', message: 'The working is shown for circuits with one cell or battery.' };
    const src = sources[0];
    const neg = Z(src.a);
    const pos = Z(src.b);
    if (neg === pos) return { ok: false, reason: 'short', message: `${src.label} is short-circuited, so there is no working to show.` };

    const steps = [];
    if (els.some((e) => (e.type === 'ammeter' || e.type === 'voltmeter') && (e.kind === 'zero' || e.kind === 'open'))) {
      steps.push({ op: 'note', text: 'Ideal meters are left out: an ideal ammeter has no resistance and an ideal voltmeter takes no current.' });
    }

    // Leaves: every element with a resistance.
    const leaves = [];
    for (const e of els) {
      if (e.source || (e.kind !== 'linear' && e.kind !== 'lamp')) continue;
      let R = e.R;
      if (e.kind === 'lamp') {
        const c = result && result.components[e.comp];
        R = c && c.I ? Math.abs(c.V / c.I) : E.models.filament(e.params, 0).R;
        steps.push({ op: 'note', text: `${e.label} is a filament lamp, which is non-ohmic: its resistance here (${E.fmt(R)} Ω) is its value at this current.` });
      }
      leaves.push({ leaf: true, id: e.id, name: leafName(e), R });
    }
    let edges = leaves.map((l, i) => ({ u: Z(els.find((e) => e.id === l.id).a), v: Z(els.find((e) => e.id === l.id).b), node: l, key: i }));
    const zero = { bypassed: [], dangling: [] };

    // Parts not joined to both terminals of the cell carry no current.
    const reach = new Map();
    const find = (x) => { while (reach.has(x) && reach.get(x) !== x) x = reach.get(x); return x; };
    const join = (a, b) => { a = find(a); b = find(b); if (a !== b) reach.set(Math.max(a, b), Math.min(a, b)); };
    for (const e of edges) join(e.u, e.v);
    if (find(neg) !== find(pos)) {
      return finish(null);
    }
    edges = edges.filter((e) => {
      if (find(e.u) === find(neg)) return true;
      zero.dangling.push(e.node);
      return false;
    });

    function combine(type, nodes) {
      const R = type === 'series' ? nodes.reduce((s, x) => s + x.R, 0) : 1 / nodes.reduce((s, x) => s + 1 / x.R, 0);
      const flat = nodes.flatMap((x) => (x.type === type ? x.children : [x]));
      const name = flat.map(wrap).join(type === 'series' ? ' + ' : ' ∥ ');
      const node = { type, children: nodes, name, R };
      steps.push({ op: type, name, parts: nodes.map((x) => ({ name: x.name, leaf: !!x.leaf, R: x.R })), R });
      return node;
    }
    const terminal = (x) => x === neg || x === pos;

    for (let guard = 0; guard < 10000; guard++) {
      // A part whose two ends are joined by zero resistance: bypassed.
      const loop = edges.find((e) => e.u === e.v);
      if (loop) { zero.bypassed.push(loop.node); edges = edges.filter((e) => e !== loop); continue; }
      const degree = new Map();
      for (const e of edges) for (const x of [e.u, e.v]) degree.set(x, (degree.get(x) || 0) + 1);
      // A part with a free end: no current.
      const hanging = edges.find((e) => (!terminal(e.u) && degree.get(e.u) === 1) || (!terminal(e.v) && degree.get(e.v) === 1));
      if (hanging) { zero.dangling.push(hanging.node); edges = edges.filter((e) => e !== hanging); continue; }
      // Parallel: every part between the same two points.
      const groups = new Map();
      for (const e of edges) {
        const k = `${Math.min(e.u, e.v)}|${Math.max(e.u, e.v)}`;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(e);
      }
      const par = [...groups.values()].find((g) => g.length > 1);
      if (par) {
        const node = combine('parallel', par.map((e) => e.node));
        edges = edges.filter((e) => !par.includes(e));
        edges.push({ u: par[0].u, v: par[0].v, node });
        continue;
      }
      // Series: a chain through points that join exactly two parts.
      const mid = [...degree].find(([x, d]) => d === 2 && !terminal(x));
      if (mid) {
        const chain = [];
        const start = edges.filter((e) => e.u === mid[0] || e.v === mid[0]);
        const walk = (edge, from) => { // follow the chain away from `from`
          const out = [];
          let e = edge;
          let x = from;
          for (;;) {
            out.push(e);
            const next = e.u === x ? e.v : e.u;
            if (terminal(next) || degree.get(next) !== 2) return { parts: out, end: next };
            const f = edges.find((g) => g !== e && (g.u === next || g.v === next));
            x = next;
            e = f;
          }
        };
        const left = walk(start[0], mid[0]);
        const right = walk(start[1], mid[0]);
        chain.push(...left.parts.reverse(), ...right.parts);
        const node = combine('series', chain.map((e) => e.node));
        edges = edges.filter((e) => !chain.includes(e));
        edges.push({ u: left.end, v: right.end, node });
        continue;
      }
      break;
    }
    if (!edges.length) return finish(null);
    if (edges.length !== 1) return { ok: false, reason: 'not-series-parallel', message: 'This circuit needs more than the series and parallel rules, so only the readings are shown.' };
    return finish(edges[0].node);

    function finish(top) {
      const out = {};
      for (const l of leaves) out[l.id] = { V: 0, I: 0 };
      const emf = src.emf;
      const r = src.r || 0;
      if (!top) {
        steps.push({ op: 'open', text: `${src.label} isn't part of a complete loop, so no current flows.` });
        return { ok: true, steps, elements: out, Rext: Infinity, I: 0 };
      }
      const I = emf / (top.R + r);
      steps.push({ op: 'total', Rext: top.R, r, R: top.R + r, name: top.name });
      steps.push({ op: 'current', emf, R: top.R + r, I });
      if (r > 0) steps.push({ op: 'terminal', emf, I, r, V: emf - I * r });
      (function assign(node, i) {
        node.I = i;
        node.V = i * node.R;
        if (node.leaf) { out[node.id] = { V: node.V, I: i }; return; }
        if (node.type === 'series') {
          steps.push({ op: 'split-series', name: node.name, I: i, parts: node.children.map((c) => ({ name: c.name, R: c.R, V: i * c.R })) });
          for (const c of node.children) assign(c, i);
        } else {
          steps.push({ op: 'split-parallel', name: node.name, V: node.V, parts: node.children.map((c) => ({ name: c.name, R: c.R, I: node.V / c.R })) });
          for (const c of node.children) assign(c, node.V / c.R);
        }
      })(top, I);
      if (zero.bypassed.length) steps.push({ op: 'no-current', why: 'bypassed', names: zero.bypassed.map(names) });
      if (zero.dangling.length) steps.push({ op: 'no-current', why: 'not-in-loop', names: zero.dangling.map(names) });
      return { ok: true, steps, elements: out, Rext: top.R, I };
    }
    function names(node) { return node.leaf ? node.name : node.name; }
  }

  // One line of plain text for a step (the editor may show these with MathJax instead).
  function text(step) {
    const f = E.fmt;
    switch (step.op) {
      case 'note':
      case 'open': return step.text;
      case 'series': return `${step.parts.map((p) => (p.leaf ? p.name : `(${p.name})`)).join(', ')} are in series: R = ${step.parts.map((p) => f(p.R)).join(' + ')} = ${f(step.R)} Ω.`;
      case 'parallel': return `${step.parts.map((p) => (p.leaf ? p.name : `(${p.name})`)).join(', ')} are in parallel: 1/R = ${step.parts.map((p) => `1/${f(p.R)}`).join(' + ')}, so R = ${f(step.R)} Ω.`;
      case 'total': return step.r > 0 ? `Total resistance, including the internal resistance: R = ${f(step.Rext)} + ${f(step.r)} = ${f(step.R)} Ω.` : `Total resistance: R = ${f(step.R)} Ω.`;
      case 'current': return `Current from the cell: I = ε / R = ${f(step.emf)} / ${f(step.R)} = ${f(step.I)} A.`;
      case 'terminal': return `Terminal p.d.: V = ε − Ir = ${f(step.emf)} − ${f(step.I)} × ${f(step.r)} = ${f(step.V)} V.`;
      case 'split-series': return `In series, the same current (${f(step.I)} A) flows through each part: ${step.parts.map((p) => `${p.name}: V = ${f(step.I)} × ${f(p.R)} = ${f(p.V)} V`).join('; ')}.`;
      case 'split-parallel': return `In parallel, each branch has the same p.d. (${f(step.V)} V): ${step.parts.map((p) => `${p.name}: I = ${f(step.V)} / ${f(p.R)} = ${f(p.I)} A`).join('; ')}.`;
      case 'no-current': return step.why === 'bypassed' ? `No current flows through ${step.names.join(', ')}: short-circuited.` : `No current flows through ${step.names.join(', ')}: not part of a complete loop with the cell.`;
      default: return '';
    }
  }

  const api = { explain, text };
  if (isNode) module.exports = api;
  else (root.Circuits = root.Circuits || {}).steps = api;
})(typeof window !== 'undefined' ? window : globalThis);
