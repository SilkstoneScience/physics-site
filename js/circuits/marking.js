// Circuit builder: marking Challenge Mode (plan: docs/CIRCUIT_BUILDER_PLAN.md, section 7).
// A challenge's checks are judged only from the engine's results and the netlist (which terminals are joined),
// never from positions, so any correct layout passes. Works in the browser (window.Circuits.marking) and in
// Node (require), so tools/circuits/test.mjs marks every challenge's model answer and a wrong answer.
//
// A check is one of:
//   { kind: 'value', of, quantity: 'V' | 'I' | 'P' | 'reading', target, tolerance, text }  size of a value (sign ignored)
//   { kind: 'across', meter, component, text }    a meter joined to both terminals of the component
//   { kind: 'series', meter, component, text }    a meter in the same branch as the component (same current)
//   { kind: 'count', type, min, max, text }       how many components of a type there are
//   { kind: 'noShort', text }                     no short circuit
// "of", "meter" and "component" pick components: an id ("l1"), or { type: "lamp" } for any lamp. A check passes
// if any choice of the components it names passes.
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const N = isNode ? require('./netlist.js') : root.Circuits.netlist;
  const E = isNode ? require('./engine.js') : root.Circuits.engine;

  function pickAll(sel, nl) {
    if (typeof sel === 'string') return nl.elements.filter((e) => e.id === sel);
    if (sel && sel.type) return nl.elements.filter((e) => e.type === sel.type);
    return [];
  }

  // Elements that carry current through their terminals (ideal voltmeters and open switches don't).
  const carries = (e) => !(e.type === 'voltmeter' && e.params.ideal) && !(e.type === 'switch' && !e.params.closed);

  // True if a and b are in one branch: from a, through nets that join exactly two current-carrying terminals,
  // to b. (Then the same current flows through both.)
  function sameBranch(nl, a, b) {
    if (a.id === b.id) return true;
    // Parts with a dead end (a terminal joined to no other current-carrying terminal) carry no current, so they are
    // left out, again and again until none are left: a spare resistor hanging by one end doesn't break a branch.
    const active = new Set(nl.elements.filter(carries));
    for (let changed = true; changed;) {
      changed = false;
      const count = new Map();
      for (const e of active) for (const n of e.nets) count.set(n, (count.get(n) || 0) + 1);
      for (const e of [...active]) {
        const own = new Map();
        for (const n of e.nets) own.set(n, (own.get(n) || 0) + 1);
        if (e.nets.some((n) => count.get(n) - own.get(n) === 0)) { active.delete(e); changed = true; }
      }
    }
    const at = new Map(); // net -> current-carrying terminals there
    for (const e of active) e.nets.forEach((n, t) => { if (!at.has(n)) at.set(n, []); at.get(n).push({ e, t }); });
    if (!active.has(a) || !active.has(b)) return false;
    for (const start of a.nets) {
      let net = start;
      let from = a;
      for (let guard = 0; guard < nl.elements.length + 2; guard++) {
        const here = (at.get(net) || []).filter((x) => x.e !== from);
        if (here.length !== 1 || (at.get(net) || []).length !== 2) break;
        const next = here[0];
        if (next.e.id === b.id) return true;
        if (next.e.nets.length !== 2) break; // a potentiometer's slider splits the branch
        net = next.e.nets[1 - next.t];
        from = next.e;
        if (next.e.id === a.id) break;
      }
    }
    return false;
  }

  function valueOf(r, quantity) {
    if (!r) return null;
    if (quantity === 'reading') return r.reading ? (r.reading.ol ? Infinity : Math.abs(r.reading.value)) : null;
    const v = r[quantity];
    return typeof v === 'number' ? Math.abs(v) : null;
  }

  // Marks one check. ctx: { nl, result }. Returns { pass, text, now } (now: the value found, for value checks).
  function mark(check, ctx) {
    const { nl, result } = ctx;
    switch (check.kind) {
      case 'value': {
        const vals = pickAll(check.of, nl).map((e) => valueOf(result.components[e.id], check.quantity)).filter((v) => v !== null);
        const pass = vals.some((v) => Math.abs(v - check.target) <= check.tolerance);
        const best = vals.length ? vals.reduce((p, q) => (Math.abs(q - check.target) < Math.abs(p - check.target) ? q : p)) : null;
        return { pass, text: check.text, now: best, unit: check.unit || '' };
      }
      case 'across': {
        const ms = pickAll(check.meter, nl);
        const cs = pickAll(check.component, nl);
        const pass = ms.some((m) => cs.some((c) => m.id !== c.id && [...m.nets].sort().join() === [c.nets[0], c.nets[1]].sort().join()));
        return { pass, text: check.text };
      }
      case 'series': {
        const ms = pickAll(check.meter, nl);
        const cs = pickAll(check.component, nl);
        return { pass: ms.some((m) => cs.some((c) => sameBranch(nl, m, c))), text: check.text };
      }
      case 'count': {
        const n = nl.elements.filter((e) => e.type === check.type).length;
        return { pass: n >= (check.min ?? 0) && n <= (check.max ?? Infinity), text: check.text, now: n };
      }
      case 'noShort':
        return { pass: !result.diagnostics.some((d) => ['short', 'short-ideal', 'ideal-clash'].includes(d.code)), text: check.text };
      default:
        return { pass: false, text: `Unknown check ${check.kind}` };
    }
  }

  // Marks a drawing against a challenge's checks: { all, results, nl, result }.
  function markDrawing(challenge, drawing) {
    const nl = N.build(drawing);
    const result = E.solve(nl);
    const results = (challenge.checks || []).map((c) => mark(c, { nl, result }));
    return { all: results.length > 0 && results.every((x) => x.pass), results, nl, result };
  }

  // The values a "predict" challenge's predictions are marked against, from the engine.
  function predictedValues(challenge, drawing) {
    const nl = N.build(drawing);
    const result = E.solve(nl);
    return (challenge.predict || []).map((p) => valueOf(result.components[p.of], p.quantity || 'reading'));
  }

  const api = { mark, markDrawing, predictedValues, sameBranch, pickAll };
  if (isNode) module.exports = api;
  else (root.Circuits = root.Circuits || {}).marking = api;
})(typeof window !== 'undefined' ? window : globalThis);
