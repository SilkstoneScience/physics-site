// Tests for the circuit builder's physics: js/circuits/components.js, netlist.js, engine.js and steps.js
// (plan: docs/CIRCUIT_BUILDER_PLAN.md, section 8). Run: node tools/circuits/test.mjs
// tools/check.mjs runs these too (runTests()).
//  1. Component catalogue: settings, meter display (resolution, sign, OL), terminal positions.
//  2. Hand-calculated circuits for every case on the teacher's list.
//  3. Layout independence: every circuit redrawn many ways gives the same netlist and the same readings.
//  4. Random circuits: current in = current out at every point, each component's own law, energy,
//     and agreement with an independent loop-current solver written here from first principles.
//  5. Show the working: agrees with the engine on random series–parallel networks.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const C = require('../../js/circuits/components.js');
const N = require('../../js/circuits/netlist.js');
const E = require('../../js/circuits/engine.js');
const S = require('../../js/circuits/steps.js');

// ---------------- helpers ----------------

function rng(seed) { // mulberry32: repeatable random numbers
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const intIn = (rnd, lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (rnd, list) => list[Math.floor(rnd() * list.length)];
function shuffle(rnd, list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const near = (a, b, tol = 1e-9) => {
  if (a === b) return true;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
};

// A circuit written as [id, type, params, net of terminal 0, net of terminal 1, (net of terminal 2)];
// a null net leaves that terminal unconnected. draw() turns it into a drawing with random positions,
// rotations, wire routes, wire count, junctions and array order: different seeds give different layouts.
function draw(spec, seed = 1) {
  const rnd = rng(seed);
  const components = spec.map(([id, type, params]) => ({
    id, type, label: id.toUpperCase(), x: intIn(rnd, -30, 30), y: intIn(rnd, -30, 30), rot: pick(rnd, [0, 90, 180, 270]), params,
  }));
  const nets = new Map();
  for (const [id, , , ...ns] of spec) ns.forEach((label, t) => {
    if (label === null || label === undefined) return;
    if (!nets.has(label)) nets.set(label, []);
    nets.get(label).push({ c: id, t });
  });
  const wires = [];
  const junctions = [];
  const point = () => [intIn(rnd, -40, 40), intIn(rnd, -40, 40)];
  const wire = (a, b) => {
    const [from, to] = rnd() < 0.5 ? [a, b] : [b, a];
    const via = Array.from({ length: intIn(rnd, 0, 3) }, point);
    wires.push({ id: `w${wires.length + 1}`, from, to, via });
  };
  for (const ends0 of nets.values()) {
    const ends = shuffle(rnd, ends0);
    const style = rnd();
    if (ends.length === 1) {
      if (rnd() < 0.3) { const j = { id: `j${junctions.length + 1}`, x: 0, y: 0 }; junctions.push(j); wire(ends[0], { j: j.id }); } // a stub to a junction
      continue;
    }
    if (style < 0.35) for (let i = 1; i < ends.length; i++) wire(ends[i - 1], ends[i]); // a chain
    else if (style < 0.7) { // a star through a junction
      const [x, y] = point();
      const j = { id: `j${junctions.length + 1}`, x, y };
      junctions.push(j);
      for (const e of ends) wire(e, { j: j.id });
    } else for (let i = 1; i < ends.length; i++) wire(ends[i], ends[intIn(rnd, 0, i - 1)]); // a random tree
    if (rnd() < 0.35) { // an extra wire, making a loop of wires
      const a = intIn(rnd, 0, ends.length - 1);
      const b = (a + intIn(rnd, 1, ends.length - 1)) % ends.length;
      wire(ends[a], ends[b]);
    }
  }
  return { v: 1, components: shuffle(rnd, components), junctions: shuffle(rnd, junctions), wires: shuffle(rnd, wires) };
}
const run = (spec, seed = 1) => { const drawing = draw(spec, seed); const nl = N.build(drawing); return { drawing, nl, r: E.solve(nl) }; };

// The numbers that must not depend on the layout.
function summary(r) {
  const out = {};
  for (const [id, c] of Object.entries(r.components)) {
    out[id] = [c.V, c.I, c.P, c.reading && c.reading.text, c.sections && c.sections.a.I, c.sections && c.sections.b.I];
  }
  return { out, diags: r.diagnostics.map((d) => `${d.code}:${[...d.ids].sort().join(',')}`).sort() };
}
function sameSummary(a, b, tol) {
  if (JSON.stringify(a.diags) !== JSON.stringify(b.diags)) return `diagnostics ${a.diags} vs ${b.diags}`;
  for (const id of Object.keys(a.out)) {
    const x = a.out[id];
    const y = b.out[id];
    if (!y) return `${id} missing`;
    for (let i = 0; i < x.length; i++) {
      if (typeof x[i] === 'number' ? !near(x[i], y[i], tol) : x[i] !== y[i]) return `${id}[${i}]: ${x[i]} vs ${y[i]}`;
    }
  }
  return '';
}

// ---------------- an independent solver (loop currents), written without the engine's code ----------------
// branches: [{ a, b, R, E }] meaning V(a) − V(b) = R I − E, with I flowing a → b through the branch.
function loopCurrents(nodeCount, branches) {
  const parent = new Array(nodeCount).fill(-1);
  const parentEdge = new Array(nodeCount).fill(-1);
  const depth = new Array(nodeCount).fill(-1);
  const adj = Array.from({ length: nodeCount }, () => []);
  branches.forEach((br, i) => { adj[br.a].push(i); adj[br.b].push(i); });
  const inTree = new Set();
  depth[0] = 0;
  const queue = [0];
  while (queue.length) {
    const u = queue.shift();
    for (const i of adj[u]) {
      const br = branches[i];
      const v = br.a === u ? br.b : br.a;
      if (depth[v] >= 0) continue;
      depth[v] = depth[u] + 1; parent[v] = u; parentEdge[v] = i; inTree.add(i); queue.push(v);
    }
  }
  if (depth.some((d) => d < 0)) throw new Error('loopCurrents: circuit not connected');
  // A loop for every branch not in the tree: along the branch from a to b, then back through the tree.
  const loops = [];
  branches.forEach((br, i) => {
    if (inTree.has(i)) return;
    const sigma = new Map([[i, 1]]);
    let x = br.b;
    let y = br.a;
    const up = (node) => { const e = parentEdge[node]; return { e, sign: branches[e].a === node ? 1 : -1 }; }; // walking node → parent
    const fromB = [];
    const fromA = [];
    while (depth[x] > depth[y]) { fromB.push(up(x)); x = parent[x]; }
    while (depth[y] > depth[x]) { fromA.push(up(y)); y = parent[y]; }
    while (x !== y) { fromB.push(up(x)); x = parent[x]; fromA.push(up(y)); y = parent[y]; }
    for (const s of fromB) sigma.set(s.e, (sigma.get(s.e) || 0) + s.sign); // b up to the meeting point
    for (const s of fromA) sigma.set(s.e, (sigma.get(s.e) || 0) - s.sign); // then down to a
    loops.push(sigma);
  });
  const L = loops.length;
  const M = Array.from({ length: L }, () => new Array(L + 1).fill(0));
  for (let p = 0; p < L; p++) {
    for (const [b, sp] of loops[p]) {
      M[p][L] += sp * branches[b].E;
      for (let q = 0; q < L; q++) { const sq = loops[q].get(b); if (sq) M[p][q] += sp * sq * branches[b].R; }
    }
  }
  for (let c = 0; c < L; c++) { // Gauss–Jordan
    let best = c;
    for (let r = c + 1; r < L; r++) if (Math.abs(M[r][c]) > Math.abs(M[best][c])) best = r;
    [M[c], M[best]] = [M[best], M[c]];
    for (let r = 0; r < L; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= L; k++) M[r][k] -= f * M[c][k];
    }
  }
  const J = M.map((row, i) => row[L] / row[i]);
  return branches.map((_, b) => loops.reduce((s, sigma, l) => s + (sigma.get(b) || 0) * J[l], 0));
}

// ---------------- the tests ----------------

export async function runTests() {
  const failures = [];
  let count = 0;
  const check = (name, ok, detail = '') => { count++; if (!ok) failures.push(`${name}${detail ? `: ${detail}` : ''}`); };
  const expect = (name, r, id, field, value, tol = 1e-9) => {
    const c = r.components[id];
    const got = c && (field.includes('.') ? field.split('.').reduce((o, k) => o && o[k], c) : c[field]);
    check(`${name}: ${id}.${field}`, typeof value === 'string' ? got === value : near(got, value, tol), `got ${got}, expected ${value}`);
  };
  const has = (name, r, code, id) => check(`${name}: diagnostic ${code}${id ? ` for ${id}` : ''}`, r.diagnostics.some((d) => d.code === code && (!id || d.ids.includes(id))), r.diagnostics.map((d) => d.code).join(', ') || 'none');
  const hasNot = (name, r, code) => check(`${name}: no diagnostic ${code}`, !r.diagnostics.some((d) => d.code === code));
  const noErrors = (name, r) => check(`${name}: no errors`, r.ok && !r.diagnostics.some((d) => d.level === 'error'), r.diagnostics.filter((d) => d.level === 'error').map((d) => d.message).join(' | '));

  // ===== 1. Component catalogue =====
  {
    const d = (kind, range, v) => C.meterDisplay(kind, range, v).text;
    const cases = [
      ['ammeter', '2A', 0.2, '0.200'], ['ammeter', '2A', 1.999, '1.999'], ['ammeter', '2A', 1.9996, 'OL'], ['ammeter', '2A', -0.0004, '0.000'],
      ['ammeter', '2A', -0.2, '-0.200'], ['ammeter', '2A', 2.5, 'OL'], ['ammeter', '2A', Infinity, 'OL'], ['ammeter', '2A', -Infinity, 'OL'], ['ammeter', '2A', NaN, 'OL'],
      ['ammeter', '200mA', 0.15, '150.0'], ['ammeter', '200mA', 0.19994, '199.9'], ['ammeter', '200mA', 0.19996, 'OL'], ['ammeter', '200mA', 0.2, 'OL'],
      ['ammeter', '10A', 10, '10.00'], ['ammeter', '10A', 10.004, '10.00'], ['ammeter', '10A', 10.006, 'OL'], ['ammeter', '10A', 0.43, '0.43'],
      ['voltmeter', '20V', 4, '4.00'], ['voltmeter', '20V', -4, '-4.00'], ['voltmeter', '20V', 19.994, '19.99'], ['voltmeter', '20V', 19.996, 'OL'],
      ['voltmeter', '200mV', 0.05, '50.0'], ['voltmeter', '2V', 1.5, '1.500'], ['voltmeter', '2V', 4, 'OL'], ['voltmeter', '200V', 199.94, '199.9'], ['voltmeter', '200V', 230, 'OL'], ['voltmeter', '200V', 4, '4.0'],
    ];
    for (const [kind, range, v, want] of cases) check(`meter display ${kind} ${range} ${v}`, d(kind, range, v) === want, `got ${d(kind, range, v)}, expected ${want}`);
    check('meter display unit (200 mA range)', C.meterDisplay('ammeter', '200mA', 0.1).unit === 'mA');
    check('meter display unit (200 mV range)', C.meterDisplay('voltmeter', '200mV', 0.1).unit === 'mV');

    const p = C.normalise('ammeter', { range: '5A', ideal: 'yes', r: -3 });
    check('normalise: unknown range → default', p.range === '2A');
    check('normalise: non-boolean → default', p.ideal === true);
    check('normalise: number below its minimum is raised', p.r === C.TYPES.ammeter.params.r.min);
    check('normalise: missing settings get defaults', C.normalise('cell', {}).emf === 1.5 && C.normalise('cell', {}).r === 0);
    check('normalise: NaN → default', C.normalise('resistor', { R: NaN }).R === 10);
    const v = C.normalise('variable', { R: 500, min: 80, max: 20 });
    check('normalise: variable resistor min/max swapped and R kept inside', v.min === 20 && v.max === 80 && v.R === 80);
    let threw = false;
    try { C.normalise('flux-capacitor', {}); } catch { threw = true; }
    check('normalise: unknown type throws', threw);

    for (const type of Object.keys(C.TYPES)) {
      const comp = { type, x: 3, y: -5, rot: 0 };
      for (let t = 0; t < C.TYPES[type].terminals.length; t++) {
        const p0 = C.terminalPosition(comp, t);
        let ok = true;
        for (const rot of [90, 180, 270, 360, -90]) {
          const q = C.terminalPosition({ ...comp, rot }, t);
          if (!q.every(Number.isInteger)) ok = false;
          if (Math.hypot(q[0] - 3, q[1] + 5) !== Math.hypot(p0[0] - 3, p0[1] + 5)) ok = false;
        }
        check(`terminal ${type}:${t} stays on the grid when rotated`, ok);
      }
    }
    const q = C.terminalPosition({ type: 'resistor', x: 0, y: 0, rot: 90 }, 1);
    check('terminal position: a quarter turn clockwise moves (2, 0) to (0, 2)', q[0] === 0 && q[1] === 2, `got ${q}`);
    check('terminal position: 360° is the same as 0°', JSON.stringify(C.terminalPosition({ type: 'cell', x: 1, y: 1, rot: 360 }, 0)) === JSON.stringify(C.terminalPosition({ type: 'cell', x: 1, y: 1, rot: 0 }, 0)));
  }

  // ===== 2. Hand-calculated circuits =====
  // Every spec here is also used for the layout tests in part 3.
  const CASES = [];
  const hand = (name, spec, verify) => { CASES.push({ name, spec }); const { r } = run(spec); verify(r, name); };
  const cell = (id, emf, r, neg, pos) => [id, 'cell', { emf, r }, neg, pos];
  const res = (id, R, a, b) => [id, 'resistor', { R }, a, b];

  // -- series --
  hand('series: 6 V, 10 Ω + 20 Ω', [cell('c1', 6, 0, 'n0', 'n1'), res('r1', 10, 'n1', 'n2'), res('r2', 20, 'n2', 'n0')], (r, n) => {
    expect(n, r, 'r1', 'I', 0.2); expect(n, r, 'r1', 'V', 2); expect(n, r, 'r2', 'V', 4); expect(n, r, 'c1', 'I', 0.2);
    expect(n, r, 'c1', 'terminalPD', 6); expect(n, r, 'r1', 'P', 0.4); expect(n, r, 'r2', 'P', 0.8); expect(n, r, 'c1', 'Pemf', 1.2); expect(n, r, 'c1', 'P', -1.2);
    noErrors(n, r);
  });
  hand('series: 9 V, 2 + 3 + 4 Ω', [cell('c1', 9, 0, 'n0', 'n1'), res('r1', 2, 'n1', 'n2'), res('r2', 3, 'n2', 'n3'), res('r3', 4, 'n3', 'n0')], (r, n) => {
    expect(n, r, 'c1', 'I', 1); expect(n, r, 'r1', 'V', 2); expect(n, r, 'r2', 'V', 3); expect(n, r, 'r3', 'V', 4); expect(n, r, 'r3', 'P', 4); expect(n, r, 'c1', 'Pemf', 9);
  });
  // -- parallel --
  hand('parallel: 6 V across 6 Ω and 12 Ω', [cell('c1', 6, 0, 'n0', 'n1'), res('r1', 6, 'n1', 'n0'), res('r2', 12, 'n1', 'n0')], (r, n) => {
    expect(n, r, 'r1', 'I', 1); expect(n, r, 'r2', 'I', 0.5); expect(n, r, 'c1', 'I', 1.5); expect(n, r, 'r1', 'V', 6); expect(n, r, 'r2', 'V', 6);
  });
  hand('parallel: 12 V across 4, 6 and 12 Ω', [cell('c1', 12, 0, 'n0', 'n1'), res('r1', 4, 'n1', 'n0'), res('r2', 6, 'n1', 'n0'), res('r3', 12, 'n1', 'n0')], (r, n) => {
    expect(n, r, 'r1', 'I', 3); expect(n, r, 'r2', 'I', 2); expect(n, r, 'r3', 'I', 1); expect(n, r, 'c1', 'I', 6); expect(n, r, 'c1', 'Pemf', 72);
  });
  // -- mixed --
  hand('mixed: 12 V, 2 Ω then 6 Ω ∥ 3 Ω', [cell('c1', 12, 0, 'n0', 'n1'), res('r1', 2, 'n1', 'n2'), res('r2', 6, 'n2', 'n0'), res('r3', 3, 'n2', 'n0')], (r, n) => {
    expect(n, r, 'c1', 'I', 3); expect(n, r, 'r1', 'V', 6); expect(n, r, 'r2', 'V', 6); expect(n, r, 'r2', 'I', 1); expect(n, r, 'r3', 'I', 2);
  });
  hand('mixed: 10 V, 1 Ω then (2 + 2) ∥ 4 Ω', [cell('c1', 10, 0, 'n0', 'n1'), res('r1', 1, 'n1', 'n2'), res('r2', 2, 'n2', 'n3'), res('r3', 2, 'n3', 'n0'), res('r4', 4, 'n2', 'n0')], (r, n) => {
    expect(n, r, 'c1', 'I', 10 / 3); expect(n, r, 'r1', 'V', 10 / 3); expect(n, r, 'r4', 'V', 20 / 3); expect(n, r, 'r4', 'I', 5 / 3); expect(n, r, 'r2', 'I', 5 / 3); expect(n, r, 'r3', 'V', 10 / 3);
  });
  // -- multiple parallel branches --
  hand('three branches: 1 + 2 Ω, 6 Ω, 2 + 4 Ω on 6 V', [cell('c1', 6, 0, 'n0', 'n1'), res('r1', 1, 'n1', 'nA'), res('r2', 2, 'nA', 'n0'), res('r3', 6, 'n1', 'n0'), res('r4', 2, 'n1', 'nC'), res('r5', 4, 'nC', 'n0')], (r, n) => {
    expect(n, r, 'r1', 'I', 2); expect(n, r, 'r2', 'V', 4); expect(n, r, 'r3', 'I', 1); expect(n, r, 'r5', 'I', 1); expect(n, r, 'r5', 'V', 4); expect(n, r, 'c1', 'I', 4);
  });
  hand('five 10 Ω branches on 5 V', [cell('c1', 5, 0, 'n0', 'n1'), ...[1, 2, 3, 4, 5].map((k) => res(`r${k}`, 10, 'n1', 'n0'))], (r, n) => {
    for (const k of [1, 2, 3, 4, 5]) expect(n, r, `r${k}`, 'I', 0.5);
    expect(n, r, 'c1', 'I', 2.5);
  });
  // -- cells, batteries and internal resistance --
  hand('internal resistance: 6 V, r = 1 Ω, R = 5 Ω', [cell('c1', 6, 1, 'n0', 'n1'), res('r1', 5, 'n1', 'n0')], (r, n) => {
    expect(n, r, 'c1', 'I', 1); expect(n, r, 'c1', 'terminalPD', 5); expect(n, r, 'c1', 'Pint', 1); expect(n, r, 'c1', 'Pemf', 6); expect(n, r, 'c1', 'Pout', 5); expect(n, r, 'r1', 'P', 5);
    noErrors(n, r);
  });
  hand('internal resistance: 12 V, r = 2 Ω, 8 Ω ∥ 8 Ω', [cell('c1', 12, 2, 'n0', 'n1'), res('r1', 8, 'n1', 'n0'), res('r2', 8, 'n1', 'n0')], (r, n) => {
    expect(n, r, 'c1', 'I', 2); expect(n, r, 'c1', 'terminalPD', 8); expect(n, r, 'r1', 'I', 1); expect(n, r, 'r2', 'I', 1);
  });
  hand('two ideal 1.5 V cells in series, 3 Ω', [cell('c1', 1.5, 0, 'n0', 'n1'), cell('c2', 1.5, 0, 'n1', 'n2'), res('r1', 3, 'n2', 'n0')], (r, n) => {
    expect(n, r, 'r1', 'I', 1); expect(n, r, 'c1', 'I', 1); expect(n, r, 'c2', 'I', 1); expect(n, r, 'r1', 'V', 3);
  });
  hand('battery: 6 V, r = 0.5 Ω, 2.5 Ω', [['b1', 'battery', { emf: 6, r: 0.5 }, 'n0', 'n1'], res('r1', 2.5, 'n1', 'n0')], (r, n) => {
    expect(n, r, 'b1', 'I', 2); expect(n, r, 'b1', 'terminalPD', 5); expect(n, r, 'b1', 'Pint', 2);
  });
  hand('opposing cells: 6 V against 2 V, 4 Ω', [cell('c1', 6, 0, 'n0', 'n1'), cell('c2', 2, 0, 'n2', 'n1'), res('r1', 4, 'n2', 'n0')], (r, n) => {
    expect(n, r, 'c1', 'I', 1); expect(n, r, 'c2', 'I', -1); expect(n, r, 'c2', 'Pemf', -2); expect(n, r, 'r1', 'I', 1);
  });
  hand('real cells in parallel: 6 V and 4 V, r = 1 Ω each, 2 Ω load', [cell('c1', 6, 1, 'n0', 'n1'), cell('c2', 4, 1, 'n0', 'n1'), res('r1', 2, 'n1', 'n0')], (r, n) => {
    expect(n, r, 'r1', 'V', 4); expect(n, r, 'c1', 'I', 2); expect(n, r, 'c2', 'I', 0, 1e-12); expect(n, r, 'r1', 'I', 2);
  });
  hand('ideal identical cells in parallel: 3 V, 6 Ω', [cell('c1', 3, 0, 'n0', 'n1'), cell('c2', 3, 0, 'n0', 'n1'), res('r1', 6, 'n1', 'n0')], (r, n) => {
    expect(n, r, 'r1', 'I', 0.5); expect(n, r, 'c1', 'I', 0.25); expect(n, r, 'c2', 'I', 0.25); has(n, r, 'ideal-parallel'); noErrors(n, r);
  });
  hand('ideal cells of different emf in parallel', [cell('c1', 3, 0, 'n0', 'n1'), cell('c2', 6, 0, 'n0', 'n1'), res('r1', 6, 'n1', 'n0')], (r, n) => {
    has(n, r, 'ideal-clash'); check(`${n}: infinite current`, r.infinite && !Number.isFinite(r.components.c2.I) && !Number.isFinite(r.components.c1.I));
    check(`${n}: the two infinite currents are opposite`, Math.sign(r.components.c1.I) === -Math.sign(r.components.c2.I));
  });
  hand('ideal cell with emf 0 joined by a wire: no clash', [cell('c1', 0, 0, 'n0', 'n0'), cell('c2', 2, 0, 'n1', 'n2'), res('r1', 4, 'n2', 'n1')], (r, n) => {
    hasNot(n, r, 'short-ideal'); expect(n, r, 'r1', 'I', 0.5); noErrors(n, r);
  });
  // -- switches and open circuits --
  hand('open switch in series, voltmeter across it', [cell('c1', 6, 0, 'n0', 'n1'), ['s1', 'switch', { closed: false }, 'n1', 'n2'], res('r1', 10, 'n2', 'n0'), ['v1', 'voltmeter', {}, 'n1', 'n2']], (r, n) => {
    // The voltmeter across the gap completes the loop, so it reads the emf.
    expect(n, r, 'r1', 'I', 0); expect(n, r, 'c1', 'I', 0); expect(n, r, 'v1', 'reading.text', '6.00'); expect(n, r, 's1', 'V', 6); has(n, r, 'voltmeter-series', 'c1');
  });
  hand('open switch in series, no meters', [cell('c1', 6, 0, 'n0', 'n1'), ['s1', 'switch', { closed: false }, 'n1', 'n2'], res('r1', 10, 'n2', 'n0')], (r, n) => {
    expect(n, r, 'r1', 'I', 0); expect(n, r, 's1', 'V', 6); has(n, r, 'open-circuit', 'c1');
    check(`${n}: the message mentions the switch`, (r.diagnostics.find((d) => d.code === 'open-circuit') || { message: '' }).message.includes('switch'));
  });
  hand('closed switch in series, voltmeter across it', [cell('c1', 6, 0, 'n0', 'n1'), ['s1', 'switch', { closed: true }, 'n1', 'n2'], res('r1', 10, 'n2', 'n0'), ['v1', 'voltmeter', {}, 'n1', 'n2']], (r, n) => {
    expect(n, r, 'r1', 'I', 0.6); expect(n, r, 's1', 'I', 0.6); expect(n, r, 'v1', 'reading.text', '0.00'); has(n, r, 'voltmeter-shorted', 'v1'); hasNot(n, r, 'open-circuit');
  });
  hand('open switch in one parallel branch', [cell('c1', 6, 0, 'n0', 'n1'), res('r1', 6, 'n1', 'n0'), ['s1', 'switch', { closed: false }, 'n1', 'nS'], res('r2', 3, 'nS', 'n0')], (r, n) => {
    expect(n, r, 'c1', 'I', 1); expect(n, r, 'r2', 'I', 0); hasNot(n, r, 'open-circuit');
  });
  hand('closed switch in one parallel branch', [cell('c1', 6, 0, 'n0', 'n1'), res('r1', 6, 'n1', 'n0'), ['s1', 'switch', { closed: true }, 'n1', 'nS'], res('r2', 3, 'nS', 'n0')], (r, n) => {
    expect(n, r, 'c1', 'I', 3); expect(n, r, 'r2', 'I', 2); expect(n, r, 's1', 'I', 2);
  });
  hand('cell with nothing connected', [cell('c1', 6, 0, 'n0', 'n1')], (r, n) => {
    expect(n, r, 'c1', 'I', 0); has(n, r, 'open-circuit', 'c1'); has(n, r, 'unconnected', 'c1');
  });
  // -- short circuits --
  hand('short: ideal cell with a wire across it', [cell('c1', 6, 0, 'n0', 'n0'), res('r1', 10, 'n0', 'n0')], (r, n) => {
    has(n, r, 'short-ideal', 'c1'); check(`${n}: infinite current`, r.infinite && Math.abs(r.components.c1.I) === Infinity); expect(n, r, 'c1', 'terminalPD', 0); expect(n, r, 'r1', 'I', 0);
  });
  hand('short: ideal ammeter straight across an ideal cell', [cell('c1', 6, 0, 'n0', 'n1'), res('r1', 10, 'n1', 'n0'), ['a1', 'ammeter', { range: '10A' }, 'n1', 'n0']], (r, n) => {
    has(n, r, 'short-ideal', 'c1'); expect(n, r, 'a1', 'reading.text', 'OL'); check(`${n}: ammeter current +∞ (into its + terminal)`, r.components.a1.I === Infinity); expect(n, r, 'r1', 'I', 0);
  });
  hand('short: real cell (r = 0.5 Ω) with a wire across it', [cell('c1', 6, 0.5, 'n0', 'n0'), res('r1', 10, 'n0', 'n0')], (r, n) => {
    expect(n, r, 'c1', 'I', 12); expect(n, r, 'c1', 'terminalPD', 0); expect(n, r, 'c1', 'Pint', 72); expect(n, r, 'r1', 'I', 0); has(n, r, 'short', 'c1'); has(n, r, 'bypassed', 'r1');
    check(`${n}: the message gives the current`, r.diagnostics.find((d) => d.code === 'short').message.includes('12 A'));
  });
  hand('short: ideal ammeter across a real cell, 10 A range', [cell('c1', 6, 0.5, 'n0', 'n1'), ['a1', 'ammeter', { range: '10A' }, 'n1', 'n0']], (r, n) => {
    expect(n, r, 'a1', 'I', 12); expect(n, r, 'a1', 'reading.text', 'OL'); has(n, r, 'short', 'c1'); noErrors(n, r);
  });
  hand('ideal ammeter across a real cell with r = 2 Ω', [cell('c1', 6, 2, 'n0', 'n1'), ['a1', 'ammeter', { range: '10A' }, 'n1', 'n0']], (r, n) => {
    expect(n, r, 'a1', 'reading.text', '3.00');
  });
  // -- meters --
  const meterSeries = (ammeter, volt) => [cell('c1', 6, 0, 'n0', 'n1'), ['a1', 'ammeter', ammeter, ...(ammeter.reversed ? ['nA', 'n1'] : ['n1', 'nA'])], res('r1', 10, 'nA', 'n2'), res('r2', 20, 'n2', 'n0'), ['v1', 'voltmeter', volt, ...(volt.reversed ? ['n0', 'n2'] : ['n2', 'n0'])]];
  hand('meters: ideal ammeter in series, voltmeter across 20 Ω', meterSeries({}, {}), (r, n) => {
    expect(n, r, 'a1', 'reading.text', '0.200'); expect(n, r, 'a1', 'reading.unit', 'A'); expect(n, r, 'v1', 'reading.text', '4.00'); expect(n, r, 'a1', 'V', 0); expect(n, r, 'r2', 'I', 0.2);
  });
  hand('meters: both connected the wrong way round', meterSeries({ reversed: true }, { reversed: true }), (r, n) => {
    expect(n, r, 'a1', 'reading.text', '-0.200'); expect(n, r, 'v1', 'reading.text', '-4.00');
  });
  hand('meters: 200 mA range over its limit', meterSeries({ range: '200mA' }, { range: '2V' }), (r, n) => {
    expect(n, r, 'a1', 'reading.text', 'OL'); expect(n, r, 'v1', 'reading.text', 'OL');
  });
  hand('meters: 200 mA range in range, 200 V range', [cell('c1', 6, 0, 'n0', 'n1'), ['a1', 'ammeter', { range: '200mA' }, 'n1', 'nA'], res('r1', 40, 'nA', 'n0'), ['v1', 'voltmeter', { range: '200V' }, 'nA', 'n0']], (r, n) => {
    expect(n, r, 'a1', 'reading.text', '150.0'); expect(n, r, 'a1', 'reading.unit', 'mA'); expect(n, r, 'v1', 'reading.text', '6.0');
  });
  hand('meters: voltmeter in series with a lamp', [cell('c1', 6, 0, 'n0', 'n1'), ['l1', 'lamp', { R: 12 }, 'n1', 'n2'], ['v1', 'voltmeter', {}, 'n2', 'n0']], (r, n) => {
    expect(n, r, 'v1', 'reading.text', '6.00'); expect(n, r, 'l1', 'I', 0); has(n, r, 'voltmeter-series', 'c1'); hasNot(n, r, 'open-circuit');
  });
  hand('meters: real voltmeter (10 MΩ) in series with a lamp', [cell('c1', 6, 0, 'n0', 'n1'), ['l1', 'lamp', { R: 12 }, 'n1', 'n2'], ['v1', 'voltmeter', { ideal: false, R: 1e7 }, 'n2', 'n0']], (r, n) => {
    expect(n, r, 'v1', 'reading.text', '6.00'); expect(n, r, 'l1', 'I', 6 / (1e7 + 12)); has(n, r, 'voltmeter-series', 'c1');
  });
  hand('meters: real voltmeter (10 kΩ) loads a 10 kΩ + 10 kΩ divider', [cell('c1', 12, 0, 'n0', 'n1'), res('r1', 1e4, 'n1', 'n2'), res('r2', 1e4, 'n2', 'n0'), ['v1', 'voltmeter', { ideal: false, R: 1e4 }, 'n2', 'n0']], (r, n) => {
    expect(n, r, 'v1', 'reading.text', '4.00'); expect(n, r, 'v1', 'I', 4e-4); expect(n, r, 'r1', 'I', 8e-4);
  });
  hand('meters: ideal voltmeter on the same divider', [cell('c1', 12, 0, 'n0', 'n1'), res('r1', 1e4, 'n1', 'n2'), res('r2', 1e4, 'n2', 'n0'), ['v1', 'voltmeter', {}, 'n2', 'n0']], (r, n) => {
    expect(n, r, 'v1', 'reading.text', '6.00');
  });
  hand('meters: real ammeter (1 Ω) with 5 Ω on 6 V', [cell('c1', 6, 0, 'n0', 'n1'), ['a1', 'ammeter', { ideal: false, r: 1 }, 'n1', 'nA'], res('r1', 5, 'nA', 'n0')], (r, n) => {
    expect(n, r, 'a1', 'reading.text', '1.000'); expect(n, r, 'a1', 'V', 1); expect(n, r, 'a1', 'P', 1);
  });
  hand('meters: ideal ammeter in parallel with a resistor (a common mistake)', [cell('c1', 6, 0, 'n0', 'n1'), res('r1', 10, 'n1', 'n2'), res('r2', 20, 'n2', 'n0'), ['a1', 'ammeter', {}, 'n2', 'n0']], (r, n) => {
    expect(n, r, 'a1', 'reading.text', '0.600'); expect(n, r, 'r2', 'I', 0); expect(n, r, 'r2', 'V', 0); has(n, r, 'bypassed', 'r2');
    check(`${n}: the message names the ammeter`, r.diagnostics.find((d) => d.code === 'bypassed').message.includes('ideal ammeter'));
  });
  hand('meters: ammeter bypassed by a wire', [cell('c1', 6, 0, 'n0', 'n1'), ['a1', 'ammeter', {}, 'n1', 'n1'], res('r1', 10, 'n1', 'n0')], (r, n) => {
    expect(n, r, 'a1', 'reading.text', '0.000'); expect(n, r, 'r1', 'I', 0.6); has(n, r, 'ammeter-bypassed', 'a1');
  });
  hand('meters: two ideal ammeters in parallel share the current', [cell('c1', 6, 0, 'n0', 'n1'), ['a1', 'ammeter', {}, 'n1', 'nA'], ['a2', 'ammeter', {}, 'n1', 'nA'], res('r1', 10, 'nA', 'n0')], (r, n) => {
    expect(n, r, 'a1', 'I', 0.3); expect(n, r, 'a2', 'I', 0.3);
  });
  // -- variable resistors --
  hand('variable resistor: 2 Ω + 4 Ω on 6 V', [cell('c1', 6, 0, 'n0', 'n1'), res('r1', 2, 'n1', 'n2'), ['v1', 'variable', { R: 4, min: 0, max: 10 }, 'n2', 'n0']], (r, n) => {
    expect(n, r, 'c1', 'I', 1); expect(n, r, 'v1', 'V', 4);
  });
  hand('variable resistor turned to 0 Ω', [cell('c1', 6, 0, 'n0', 'n1'), res('r1', 2, 'n1', 'n2'), ['v1', 'variable', { R: 0, min: 0, max: 10 }, 'n2', 'n0']], (r, n) => {
    expect(n, r, 'c1', 'I', 3); expect(n, r, 'v1', 'I', 3); expect(n, r, 'v1', 'V', 0); noErrors(n, r);
  });
  hand('variable resistor asked for more than its maximum', [cell('c1', 6, 0, 'n0', 'n1'), ['v1', 'variable', { R: 99, min: 0, max: 12 }, 'n1', 'n0']], (r, n) => {
    expect(n, r, 'v1', 'I', 0.5);
  });
  const pot = (pos, load) => [cell('c1', 10, 0, 'n0', 'n1'), ['p1', 'potentiometer', { R: 100, pos }, 'n0', 'n1', 'nW'], ['v1', 'voltmeter', {}, 'nW', 'n0'], ...(load ? [res('rL', load, 'nW', 'n0')] : [])];
  hand('potentiometer: 10 V, slider at 0.3, no load', pot(0.3), (r, n) => {
    expect(n, r, 'v1', 'reading.text', '3.00'); expect(n, r, 'p1', 'sections.a.I', -0.1); expect(n, r, 'p1', 'sections.b.I', -0.1); expect(n, r, 'p1', 'P', 1);
  });
  hand('potentiometer: 10 V, slider at 0.3, 100 Ω load', pot(0.3, 100), (r, n) => {
    expect(n, r, 'v1', 'reading.value', 300 / 121); expect(n, r, 'v1', 'reading.text', '2.48'); expect(n, r, 'rL', 'I', 3 / 121);
    expect(n, r, 'p1', 'sections.b.I', -13 / 121); expect(n, r, 'p1', 'sections.a.I', -10 / 121);
  });
  hand('potentiometer: slider at end A', pot(0), (r, n) => { expect(n, r, 'v1', 'reading.text', '0.00'); noErrors(n, r); });
  hand('potentiometer: slider at end B', pot(1), (r, n) => { expect(n, r, 'v1', 'reading.text', '10.00'); noErrors(n, r); });
  // -- thermistor and LDR --
  const across = (part) => [cell('c1', 10, 0, 'n0', 'n1'), [...part, 'n1', 'n0']];
  hand('thermistor at 25 °C: 10 kΩ', across(['t1', 'thermistor', { temp: 25 }]), (r, n) => { expect(n, r, 't1', 'R', 1e4); expect(n, r, 't1', 'I', 1e-3); });
  hand('thermistor at 0 °C: about 33.6 kΩ (data-sheet value for B = 3950 K)', across(['t1', 'thermistor', { temp: 0 }]), (r, n) => { expect(n, r, 't1', 'R', 33620, 2e-3); });
  hand('thermistor at 100 °C: about 698 Ω', across(['t1', 'thermistor', { temp: 100 }]), (r, n) => { expect(n, r, 't1', 'R', 697.7, 2e-3); });
  hand('LDR in the dark: 1 MΩ', across(['d1', 'ldr', { lux: 0 }]), (r, n) => { expect(n, r, 'd1', 'R', 1e6); });
  hand('LDR at 10 lux: 15 kΩ ∥ 1 MΩ', across(['d1', 'ldr', { lux: 10 }]), (r, n) => { expect(n, r, 'd1', 'R', 1 / (1 / 15000 + 1e-6)); });
  hand('LDR at 1000 lux: about 597 Ω', across(['d1', 'ldr', { lux: 1000 }]), (r, n) => { expect(n, r, 'd1', 'R', 596.8, 2e-3); });
  // -- lamps --
  hand('ohmic lamp at its rated p.d.: full brightness', [cell('c1', 6, 0, 'n0', 'n1'), ['l1', 'lamp', { R: 12, Prated: 3 }, 'n1', 'n0']], (r, n) => {
    expect(n, r, 'l1', 'I', 0.5); expect(n, r, 'l1', 'brightness', 1); hasNot(n, r, 'lamp-overpower');
  });
  hand('filament lamp at its rated p.d. gives its rated power', [cell('c1', 6, 0, 'n0', 'n1'), ['l1', 'lamp', { model: 'filament', Vrated: 6, Prated: 3 }, 'n1', 'n0']], (r, n) => {
    expect(n, r, 'l1', 'P', 3, 1e-9); expect(n, r, 'l1', 'I', 0.5, 1e-9); expect(n, r, 'l1', 'R', 12, 1e-9); expect(n, r, 'l1', 'T', 2500, 1e-9); noErrors(n, r);
  });
  hand('two identical filament lamps in series share 12 V equally', [cell('c1', 12, 0, 'n0', 'n1'), ['l1', 'lamp', { model: 'filament', Vrated: 6, Prated: 3 }, 'n1', 'n2'], ['l2', 'lamp', { model: 'filament', Vrated: 6, Prated: 3 }, 'n2', 'n0']], (r, n) => {
    expect(n, r, 'l1', 'V', 6, 1e-9); expect(n, r, 'l2', 'V', 6, 1e-9); expect(n, r, 'c1', 'I', 0.5, 1e-9);
  });
  hand('filament lamp at double its rated p.d.: overpowered', [cell('c1', 12, 0, 'n0', 'n1'), ['l1', 'lamp', { model: 'filament', Vrated: 6, Prated: 3 }, 'n1', 'n0']], (r, n) => {
    has(n, r, 'lamp-overpower', 'l1'); check(`${n}: power between 2× and 4× rated`, r.components.l1.P > 6 && r.components.l1.P < 12, `P = ${r.components.l1.P}`);
  });
  hand('filament lamp with a series resistor: the lamp obeys its own curve', [cell('c1', 9, 0.5, 'n0', 'n1'), res('r1', 8, 'n1', 'n2'), ['l1', 'lamp', { model: 'filament', Vrated: 6, Prated: 3 }, 'n2', 'n0']], (r, n) => {
    const l = r.components.l1;
    expect(n, r, 'l1', 'I', E.models.filament({ Vrated: 6, Prated: 3 }, l.V).I, 1e-9); expect(n, r, 'r1', 'I', l.I, 1e-9); noErrors(n, r);
  });
  // -- floating parts and no source --
  hand('a separate loop with no cell carries no current', [cell('c1', 6, 0, 'n0', 'n1'), res('r1', 6, 'n1', 'n0'), res('r2', 5, 'm0', 'm1'), res('r3', 5, 'm1', 'm0'), ['v1', 'voltmeter', {}, 'n1', 'm1']], (r, n) => {
    expect(n, r, 'r2', 'I', 0); expect(n, r, 'r1', 'I', 1); expect(n, r, 'v1', 'reading.text', '0.00'); has(n, r, 'voltmeter-separate', 'v1');
  });
  hand('no cell at all', [res('r1', 6, 'n1', 'n0'), res('r2', 6, 'n1', 'n0')], (r, n) => {
    expect(n, r, 'r1', 'I', 0); has(n, r, 'no-source'); noErrors(n, r);
  });
  // -- bridges --
  hand('balanced bridge: no current through the middle', [cell('c1', 6, 0, 'n0', 'n1'), res('r1', 1, 'n1', 'nA'), res('r2', 2, 'nA', 'n0'), res('r3', 1, 'n1', 'nB'), res('r4', 2, 'nB', 'n0'), res('r5', 5, 'nA', 'nB')], (r, n) => {
    expect(n, r, 'r5', 'I', 0, 1e-12); expect(n, r, 'c1', 'I', 4);
  });
  hand('unbalanced bridge', [cell('c1', 10, 0, 'n0', 'n1'), res('r1', 1, 'n1', 'nA'), res('r2', 2, 'nA', 'n0'), res('r3', 2, 'n1', 'nB'), res('r4', 1, 'nB', 'n0'), res('r5', 1, 'nA', 'nB')], (r, n) => {
    // By hand (nodal): at A, (10 − V_A)/1 = V_A/2 + (V_A − V_B)/1; at B, (10 − V_B)/2 + (V_A − V_B)/1 = V_B/1.
    // So 2.5 V_A − V_B = 10 and V_A + 5 = 2.5 V_B, giving V_A = 40/7 V and V_B = 30/7 V.
    expect(n, r, 'r2', 'V', 40 / 7); expect(n, r, 'r5', 'V', 10 / 7); expect(n, r, 'r1', 'I', 30 / 7); expect(n, r, 'r4', 'I', 30 / 7); expect(n, r, 'r3', 'I', 20 / 7);
  });
  // -- extreme values --
  hand('0.01 Ω and 10 MΩ in one circuit', [cell('c1', 1, 0, 'n0', 'n1'), res('r1', 0.01, 'n1', 'n2'), res('r2', 1e7, 'n2', 'n0'), res('r3', 0.01, 'n2', 'n0')], (r, n) => {
    const Rp = 1 / (1 / 1e7 + 1 / 0.01);
    expect(n, r, 'c1', 'I', 1 / (0.01 + Rp), 1e-11); expect(n, r, 'r2', 'I', (Rp / (0.01 + Rp)) / 1e7, 1e-9);
  });

  // -- loose wire ends, bad drawings --
  {
    const d = draw([cell('c1', 6, 0, 'n0', 'n1'), res('r1', 10, 'n1', 'n0')], 3);
    d.wires.push({ id: 'wx', from: { c: 'r1', t: 0 }, to: { free: [5, 5] } });
    const r = E.simulate(d);
    has('loose wire end', r, 'loose-end', 'wx'); expect('loose wire end', r, 'r1', 'I', 0.6);
    const d2 = { components: [{ id: 'a', type: 'resistor', x: 0, y: 0 }, { id: 'a', type: 'resistor', x: 0, y: 0 }], wires: [{ id: 'w', from: { c: 'zz', t: 0 }, to: { c: 'a', t: 7 } }] };
    const nl2 = N.build(d2);
    check('duplicate ids are reported', nl2.issues.some((x) => x.code === 'duplicate-id'));
    check('wires to missing terminals are reported', nl2.issues.filter((x) => x.code === 'bad-reference').length === 2);
    check('unknown component types are reported', N.build({ components: [{ id: 'q', type: 'warp-drive' }] }).issues.some((x) => x.code === 'unknown-type'));
    check('an empty drawing solves', E.simulate({}).ok && E.simulate({ components: [], wires: [] }).ok);
  }
  // -- infinite currents in wires --
  {
    const d = { components: [{ id: 'c1', type: 'cell', x: 0, y: 0, params: { emf: 6 } }], wires: [{ id: 'w1', from: { c: 'c1', t: 0 }, to: { c: 'c1', t: 1 } }] };
    const r = E.simulate(d);
    check('a wire across an ideal cell carries an infinite current (from + to −)', r.wires.w1.I === -Infinity, `got ${r.wires.w1.I}`);
  }

  // ===== 3. Layout independence =====
  for (const { name, spec } of CASES) {
    const base = run(spec, 1);
    const sig = N.signature(base.nl);
    const sum = summary(base.r);
    let badSig = 0;
    let badRes = '';
    for (let seed = 2; seed <= 13; seed++) {
      const other = run(spec, seed);
      if (N.signature(other.nl) !== sig) badSig++;
      const diff = sameSummary(sum, summary(other.r), 1e-12);
      if (diff && !badRes) badRes = `seed ${seed}: ${diff}`;
    }
    check(`layout: "${name}" gives the same netlist in 12 other layouts`, badSig === 0, `${badSig} differed`);
    check(`layout: "${name}" gives the same readings in 12 other layouts`, !badRes, badRes);

    // Renaming every id (components, wires, junctions) gives the same readings.
    const rnd = rng(99);
    const d = draw(spec, 5);
    const map = new Map(d.components.map((c) => [c.id, `q${Math.floor(rnd() * 1e9)}_${c.id.length}${c.id}`.split('').reverse().join('')]));
    const jmap = new Map(d.junctions.map((j) => [j.id, `J${Math.floor(rnd() * 1e9)}`]));
    const end = (e) => (e.c ? { c: map.get(e.c), t: e.t } : e.j ? { j: jmap.get(e.j) } : e);
    const renamed = {
      components: d.components.map((c) => ({ ...c, id: map.get(c.id), label: c.label })),
      junctions: d.junctions.map((j) => ({ ...j, id: jmap.get(j.id) })),
      wires: d.wires.map((w) => ({ ...w, id: `W${Math.floor(rnd() * 1e9)}`, from: end(w.from), to: end(w.to) })),
    };
    const r1 = E.simulate(d);
    const r2 = E.simulate(renamed);
    let bad = '';
    for (const c of d.components) {
      const a = r1.components[c.id];
      const b = r2.components[map.get(c.id)];
      for (const f of ['V', 'I', 'P']) if (a[f] !== undefined && !near(a[f], b[f], 1e-9)) bad = `${c.id}.${f}: ${a[f]} vs ${b[f]}`;
    }
    check(`layout: "${name}" gives the same readings with every id renamed`, !bad, bad);
  }
  // A real change of connection does change the netlist.
  {
    const spec = [cell('c1', 6, 0, 'n0', 'n1'), res('r1', 10, 'n1', 'n2'), res('r2', 20, 'n2', 'n0')];
    for (let seed = 1; seed <= 10; seed++) {
      const d = draw(spec, seed);
      const before = N.build(d);
      const w = d.wires.find((x) => x.to.c);
      const target = d.components.flatMap((c) => C.TYPES[c.type].terminals.map((_, t) => ({ c: c.id, t })))
        .find((p) => before.pointNet[N.terminalKey(p.c, p.t)] !== before.pointNet[N.terminalKey(w.to.c, w.to.t)]);
      const moved = { ...d, wires: d.wires.map((x) => (x === w ? { ...x, to: target } : x)) };
      const after = N.build(moved);
      check(`layout: moving one wire end to another terminal changes the netlist (seed ${seed})`, JSON.stringify(N.partition(after)) !== JSON.stringify(N.partition(before)));
    }
  }

  // ===== 4. Random circuits =====
  // Random connected networks of resistors, cells (some ideal), series ideal ammeters and real meters.
  function randomCircuit(seed) {
    const rnd = rng(seed);
    const nodes = intIn(rnd, 2, 7);
    const spec = [];
    const branches = []; // for the loop solver: { a, b, R, E, id }
    let extra = nodes;
    const add = (a, b) => {
      const kind = rnd();
      const id = `e${spec.length}`;
      if (kind < 0.15) { // an ideal ammeter in series with a resistor, through a new node
        const m = extra++;
        const R = Math.exp(rnd() * Math.log(1e4));
        spec.push(res(`${id}r`, R, `n${a}`, `n${m}`), [`${id}a`, 'ammeter', {}, `n${m}`, `n${b}`]);
        branches.push({ a, b: m, R, E: 0, id: `${id}r` }, { a: m, b, R: 0, E: 0, id: `${id}a` });
      } else if (kind < 0.22) {
        const R = Math.exp(Math.log(10) + rnd() * Math.log(1e6));
        spec.push([id, 'voltmeter', { ideal: false, R }, `n${a}`, `n${b}`]);
        branches.push({ a, b, R, E: 0, id });
      } else {
        const R = Math.exp(Math.log(0.1) + rnd() * Math.log(1e5));
        spec.push(res(id, R, `n${a}`, `n${b}`));
        branches.push({ a, b, R, E: 0, id });
      }
    };
    for (let v = 1; v < nodes; v++) add(v, intIn(rnd, 0, v - 1)); // a tree keeps it connected
    for (let k = intIn(rnd, 0, nodes + 2); k > 0; k--) { const a = intIn(rnd, 0, nodes - 1); let b = intIn(rnd, 0, nodes - 1); if (b === a) b = (a + 1) % nodes; add(a, b); }
    // Cells: the first may be ideal; others get internal resistance (so ideal cells never form loops of their own).
    for (let k = intIn(rnd, 1, 3), i = 0; i < k; i++) {
      const a = intIn(rnd, 0, nodes - 1);
      let b = intIn(rnd, 0, nodes - 1);
      if (b === a) b = (a + 1) % nodes;
      const emf = Math.round((rnd() * 24 + 0.1) * 10) / 10; // cells can face either way, so negative emfs aren't needed
      const r = i === 0 && rnd() < 0.5 ? 0 : Math.round(rnd() * 50) / 10 + 0.1;
      spec.push(cell(`c${i}`, emf, r, `n${a}`, `n${b}`));
      branches.push({ a, b, R: r, E: emf, id: `c${i}` });
    }
    return { spec, branches, nodeCount: extra };
  }
  let worst = 0;
  let solved = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const { spec, branches, nodeCount } = randomCircuit(seed);
    const { drawing, nl, r } = run(spec, seed);
    if (!r.ok || r.diagnostics.some((d) => d.level === 'error')) { check(`random circuit ${seed} solves without errors`, false, r.diagnostics.map((d) => d.message).join(' | ')); continue; }
    solved++;
    // Current in = current out at every point (component terminals, junctions, wire ends).
    const bal = new Map();
    const scale = Object.values(r.components).reduce((s, c) => s + Math.abs(c.I || 0), 0) + 1e-30;
    const addAt = (key, x) => bal.set(key, (bal.get(key) || 0) + x);
    for (const c of nl.elements) {
      const rc = r.components[c.id];
      if (c.type === 'potentiometer') continue;
      addAt(N.terminalKey(c.id, 0), rc.I); addAt(N.terminalKey(c.id, 1), -rc.I);
    }
    for (const w of nl.wireEdges) { addAt(w.a, r.wires[w.id].I); addAt(w.b, -r.wires[w.id].I); }
    const kcl = Math.max(0, ...[...bal.values()].map(Math.abs));
    check(`random circuit ${seed}: current in = current out at every point`, kcl <= 1e-9 * scale, `worst ${kcl} A`);
    // Each component's own law.
    let law = '';
    for (const c of nl.elements) {
      const rc = r.components[c.id];
      if (c.type === 'resistor' && !near(rc.V, rc.I * c.params.R, 1e-9)) law = `${c.id}: V ≠ IR`;
      if (c.type === 'cell' && !near(rc.terminalPD, c.params.emf - rc.I * c.params.r, 1e-9)) law = `${c.id}: V ≠ ε − Ir`;
      if (c.type === 'ammeter' && rc.V !== 0) law = `${c.id}: ideal ammeter has a p.d.`;
    }
    check(`random circuit ${seed}: every component obeys its own law`, !law, law);
    // The independent loop-current solver agrees.
    const J = loopCurrents(nodeCount, branches);
    let diff = 0;
    const big = Math.max(1e-12, ...J.map(Math.abs));
    branches.forEach((br, i) => { diff = Math.max(diff, Math.abs(r.components[br.id].I - J[i]) / big); });
    worst = Math.max(worst, diff);
    check(`random circuit ${seed}: agrees with the independent loop-current solver`, diff <= 1e-8, `relative difference ${diff}`);
    void drawing;
  }
  check('random circuits: at least 290 of 300 solve', solved >= 290, `${solved} solved`);

  // Random circuits with filament lamps: always converge, conserve energy, and every lamp is on its curve.
  for (let seed = 1; seed <= 150; seed++) {
    const rnd = rng(1000 + seed);
    const nodes = intIn(rnd, 2, 5);
    const spec = [];
    for (let v = 1; v < nodes; v++) spec.push(['l' + v, 'lamp', { model: 'filament', Vrated: pick(rnd, [1.5, 3, 6, 12, 230]), Prated: pick(rnd, [0.3, 3, 24, 60]) }, `n${v}`, `n${intIn(rnd, 0, v - 1)}`]);
    for (let k = intIn(rnd, 0, 3); k > 0; k--) spec.push(res(`r${k}`, Math.exp(Math.log(0.5) + rnd() * Math.log(1e4)), `n${intIn(rnd, 0, nodes - 1)}`, `n${intIn(rnd, 0, nodes - 1)}`));
    spec.push(cell('c1', Math.round(rnd() * 300) / 10 + 0.1, rnd() < 0.5 ? 0 : rnd() * 3, 'n0', `n${nodes - 1}`));
    const { r } = run(spec, seed);
    const err = r.diagnostics.filter((d) => d.level === 'error');
    check(`lamp circuit ${seed} converges without errors`, r.ok && !err.length, err.map((d) => d.message).join(' | '));
    let off = '';
    for (const [id, c] of Object.entries(r.components)) {
      if (!id.startsWith('l')) continue;
      const p = spec.find((x) => x[0] === id)[2];
      if (!near(c.I, E.models.filament(p, c.V).I, 1e-8)) off = `${id}: I = ${c.I} but its curve gives ${E.models.filament(p, c.V).I}`;
    }
    check(`lamp circuit ${seed}: every lamp is on its I–V curve`, !off, off);
  }
  // The lamp's curve: current rises with p.d., resistance rises with current, cold resistance about 1/13 of hot.
  {
    const p = { Vrated: 6, Prated: 3 };
    let ok = true;
    let prev = E.models.filament(p, 0);
    for (let V = 0.01; V <= 20; V += 0.01) {
      const x = E.models.filament(p, V);
      if (!(x.I > prev.I && x.R >= prev.R && x.g > 0)) ok = false;
      prev = x;
    }
    check('filament lamp: current and resistance rise with p.d.; slope stays positive', ok);
    const cold = E.models.filament(p, 1e-9).R;
    check('filament lamp: cold resistance = hot × (293/2500)^1.2', near(cold, 12 * Math.pow(293 / 2500, 1.2), 1e-6), `${cold}`);
    check('filament lamp: symmetric for reversed p.d.', near(E.models.filament(p, -4).I, -E.models.filament(p, 4).I, 1e-12));
    const h = 1e-6;
    const g = (E.models.filament(p, 3 + h).I - E.models.filament(p, 3 - h).I) / (2 * h);
    check('filament lamp: its slope dI/dV is right', near(g, E.models.filament(p, 3).g, 1e-6), `${g} vs ${E.models.filament(p, 3).g}`);
  }

  // ===== 5. Show the working =====
  // Random series–parallel networks: the steps' values agree with the engine.
  function spNetwork(rnd, a, b, depth, spec) {
    const kind = depth <= 0 ? 0 : rnd();
    if (kind < 0.35) { spec.push(res(`r${spec.length}`, Math.round(Math.exp(rnd() * Math.log(1000)) * 10) / 10 + 0.1, a, b)); return; }
    const parts = intIn(rnd, 2, 3);
    if (kind < 0.68) { // series
      let from = a;
      for (let i = 0; i < parts; i++) { const to = i === parts - 1 ? b : `m${spec.length}_${i}_${Math.floor(rnd() * 1e6)}`; spNetwork(rnd, from, to, depth - 1, spec); from = to; }
    } else for (let i = 0; i < parts; i++) spNetwork(rnd, a, b, depth - 1, spec); // parallel
  }
  let explained = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const rnd = rng(5000 + seed);
    const spec = [cell('c1', Math.round(rnd() * 200) / 10 + 0.5, rnd() < 0.5 ? 0 : Math.round(rnd() * 30) / 10, 'n0', 'n1')];
    spNetwork(rnd, 'n1', 'n0', intIn(rnd, 1, 4), spec);
    if (rnd() < 0.3) spec.push(['a1', 'ammeter', {}, 'n1', 'n1']); // a bypassed ammeter
    if (rnd() < 0.3) spec.push(['v1', 'voltmeter', {}, 'n1', 'n0']);
    if (rnd() < 0.3) spec.push(res('rx', 47, 'n1', 'dangling'));
    const { nl, r } = run(spec, seed);
    const s = S.explain(nl, r);
    if (!s.ok) { check(`steps: series–parallel network ${seed} is explained`, false, s.reason); continue; }
    explained++;
    let bad = '';
    for (const [id, x] of Object.entries(s.elements)) {
      const c = r.components[id];
      if (!near(Math.abs(c.I), x.I, 1e-9) || !near(Math.abs(c.V), x.V, 1e-9)) bad = `${id}: steps V = ${x.V}, I = ${x.I}; engine V = ${c.V}, I = ${c.I}`;
    }
    check(`steps: network ${seed} agrees with the engine`, !bad, bad);
    check(`steps: network ${seed} gives the same current as the engine`, near(s.I, Math.abs(r.components.c1.I), 1e-9));
    check(`steps: network ${seed} has text for every step`, s.steps.every((st) => S.text(st).length > 10));
  }
  check('steps: all 200 random series–parallel networks explained', explained === 200, `${explained}`);
  {
    const explainSpec = (spec) => { const { nl, r } = run(spec); return S.explain(nl, r); };
    const bridge = explainSpec([cell('c1', 10, 0, 'n0', 'n1'), res('r1', 1, 'n1', 'nA'), res('r2', 2, 'nA', 'n0'), res('r3', 2, 'n1', 'nB'), res('r4', 1, 'nB', 'n0'), res('r5', 1, 'nA', 'nB')]);
    check('steps: a bridge is not explained', !bridge.ok && bridge.reason === 'not-series-parallel');
    const two = explainSpec([cell('c1', 1.5, 0, 'n0', 'n1'), cell('c2', 1.5, 0, 'n1', 'n2'), res('r1', 3, 'n2', 'n0')]);
    check('steps: two cells are not explained', !two.ok && two.reason === 'several-sources');
    const short = explainSpec([cell('c1', 6, 0.5, 'n0', 'n0'), res('r1', 3, 'n0', 'n0')]);
    check('steps: a short circuit is not explained', !short.ok && short.reason === 'short');
    const open = explainSpec([cell('c1', 6, 0, 'n0', 'n1'), ['s1', 'switch', { closed: false }, 'n1', 'n2'], res('r1', 3, 'n2', 'n0')]);
    check('steps: an open circuit says no current flows', open.ok && open.I === 0 && open.steps.some((x) => x.op === 'open'));
    const mixed = explainSpec([cell('c1', 12, 1, 'n0', 'n1'), res('r1', 2, 'n1', 'n2'), res('r2', 6, 'n2', 'n0'), res('r3', 3, 'n2', 'n0')]);
    const texts = mixed.steps.map(S.text);
    check('steps: mixed circuit text (parallel)', texts.some((t) => t.includes('R2, R3 are in parallel: 1/R = 1/6 + 1/3, so R = 2 Ω.')), texts.join(' / '));
    check('steps: mixed circuit text (series)', texts.some((t) => t.includes('are in series: R = 2 + 2 = 4 Ω.')), texts.join(' / '));
    check('steps: mixed circuit text (current with internal resistance)', texts.some((t) => t.includes('I = ε / R = 12 / 5 = 2.4 A.')), texts.join(' / '));
    check('steps: mixed circuit text (terminal p.d.)', texts.some((t) => t.includes('V = ε − Ir = 12 − 2.4 × 1 = 9.6 V.')), texts.join(' / '));
    const lamp = explainSpec([cell('c1', 6, 0, 'n0', 'n1'), ['l1', 'lamp', { model: 'filament', Vrated: 6, Prated: 3 }, 'n1', 'n0']]);
    check('steps: a filament lamp gets a note about its resistance', lamp.ok && lamp.steps.some((x) => x.op === 'note' && x.text.includes('non-ohmic')) && near(lamp.I, 0.5, 1e-9));
    const potSteps = explainSpec(pot(0.3, 100));
    check('steps: a loaded potentiometer is explained', potSteps.ok && near(potSteps.elements['p1:a'].V, 300 / 121, 1e-9), JSON.stringify(potSteps.elements));
  }

  // ===== 6. The drawing model (js/circuits/model.js): operations, undo and redo =====
  {
    const M = require('../../js/circuits/model.js');
    const part = (d) => JSON.stringify(N.partition(N.build(d)));
    const d = M.empty();
    const c1 = M.ops.addComponent(d, 'cell', 0, 0, { emf: 6 });
    const r1 = M.ops.addComponent(d, 'resistor', 6, 0, { R: 10 });
    const r2 = M.ops.addComponent(d, 'resistor', 6, 6, { R: 20 });
    const r3 = M.ops.addComponent(d, 'resistor', 12, 0);
    check('model: ids and labels follow the type (C1, R1, R2, R3)', c1 === 'c1' && r1 === 'r1' && r2 === 'r2' && r3 === 'r3' && d.components[1].label === 'R1');
    check('model: settings are completed when a component is added', d.components[3].params.R === 10 && d.components[0].params.r === 0);
    M.ops.addWire(d, { c: c1, t: 1 }, { c: r1, t: 0 });
    const w = M.ops.addWire(d, { c: r1, t: 1 }, { c: r2, t: 1 }, [[10, 3]]);
    check('model: a new drawing is sound', M.validate(d).length === 0, M.validate(d).join('; '));
    const path = M.wirePath(d, d.wires.find((x) => x.id === w));
    check('model: wire paths are horizontal and vertical only', path.every((p, i) => i === 0 || p[0] === path[i - 1][0] || p[1] === path[i - 1][1]), JSON.stringify(path));
    check('model: wire paths start and end at the terminals', JSON.stringify(path[0]) === JSON.stringify(M.terminalPos(d, r1, 1)) && JSON.stringify(path[path.length - 1]) === JSON.stringify(M.terminalPos(d, r2, 1)));
    // Splitting a wire with a junction doesn't change the connections.
    const before = part(d);
    const mid = path[1];
    const end = M.ops.splitWire(d, w, mid);
    check('model: splitting a wire gives a junction', end && end.j && d.junctions.length === 1 && d.wires.length === 3, JSON.stringify(end));
    check('model: splitting a wire keeps the same connections', part(d) === before);
    check('model: after splitting, the drawing is sound', M.validate(d).length === 0, M.validate(d).join('; '));
    // Branching from the junction joins r3.
    M.ops.addWire(d, end, { c: r3, t: 0 });
    check('model: a wire from the junction joins r3 to r1 and r2', N.build(d).pointNet['c:r3:0'] === N.build(d).pointNet['c:r1:1']);
    // Moving and rotating never change the connections.
    const p0 = part(d);
    M.ops.moveItems(d, { components: [r1, r2], junctions: [end.j] }, 3, -2);
    M.ops.rotate(d, [r3, c1]);
    M.ops.rotate(d, [r3], 3);
    check('model: moving and rotating keep the connections', part(d) === p0);
    check('model: rotation stays in 0, 90, 180, 270', d.components.every((c) => [0, 90, 180, 270].includes(c.rot)));
    // Removing a component leaves loose ends where its terminals were.
    const at = M.terminalPos(d, r1, 0);
    M.ops.remove(d, { components: [r1] });
    const loose = d.wires.flatMap((x) => [x.from, x.to]).filter((e) => e.free);
    check('model: removing a component leaves loose wire ends at its terminals', loose.length === 2 && loose.some((e) => e.free[0] === at[0] && e.free[1] === at[1]), JSON.stringify(loose));
    check('model: after removing, the drawing is sound', M.validate(d).length === 0, M.validate(d).join('; '));
    // Dropping a component onto a loose end, a terminal or a wire joins it.
    const d2 = M.empty();
    const a = M.ops.addComponent(d2, 'resistor', 0, 0);
    const b = M.ops.addComponent(d2, 'resistor', 4, 0); // its terminal 0 is at (2, 0), on a's terminal 1
    M.ops.joinAt(d2, [b]);
    check('model: terminals dropped on each other are joined', N.build(d2).pointNet['c:r1:1'] === N.build(d2).pointNet['c:r2:0']);
    const c = M.ops.addComponent(d2, 'resistor', 20, 0);
    M.ops.addWire(d2, { c: a, t: 0 }, { c, t: 1 }, [[-2, 6], [22, 6]]); // a U-shaped wire under everything
    const v = M.ops.addComponent(d2, 'resistor', 10, 4); // vertical when rotated: terminals at (10, 2) and (10, 6)
    M.ops.rotate(d2, [v]);
    M.ops.joinAt(d2, [v]);
    const nl2 = N.build(d2);
    const onPath = (d, w, p) => { const path = M.wirePath(d, w); return path.some((q, i) => i + 1 < path.length && M.segDistance(p, q, path[i + 1]) < 1e-9); };
    check('model: a component dropped on a wire\'s route: the wire goes around it, so nothing is joined', nl2.unconnected.filter((u) => u.id === v).length === 2 && d2.junctions.length === 0);
    check('model: … and the wire no longer passes through its terminals', !d2.wires.some((w) => onPath(d2, w, M.terminalPos(d2, v, 0)) || onPath(d2, w, M.terminalPos(d2, v, 1))));
    check('model: after settling, nothing touches without being joined', M.touches(d2).length === 0);
    const wl = M.ops.addWire(d2, { c: v, t: 0 }, { free: [10, -3] });
    const v2 = M.ops.addComponent(d2, 'resistor', 12, -3); // its terminal 0 is at (10, -3), on the loose end
    M.ops.joinAt(d2, [v2]);
    check('model: a terminal dropped on a loose wire end takes it', d2.wires.find((x) => x.id === wl).to.c === v2);
    check('model: after joining, the drawing is sound', M.validate(d2).length === 0, M.validate(d2).join('; '));

    // Putting a component into a wire, and taking it out again.
    {
      const d3 = M.empty();
      const c = M.ops.addComponent(d3, 'cell', 0, 0, { emf: 6 });
      const r = M.ops.addComponent(d3, 'resistor', 0, 8, { R: 12 });
      M.ops.addWire(d3, { c, t: 1 }, { c: r, t: 1 }, [[10, 0], [10, 8]]); // across the top, down the right side
      M.ops.addWire(d3, { c: r, t: 0 }, { c, t: 0 }, [[-6, 8], [-6, 0]]);
      check('insert: nothing found far from any wire', M.findInsertion(d3, 'lamp', [4, 4]) === null);
      const fit4 = M.findInsertion(d3, 'lamp', [-3, 0]);
      check('insert: a segment exactly 4 squares long just holds a component', fit4 && fit4.x === -4 && fit4.y === 0, JSON.stringify(fit4));
      const dShort = M.empty();
      const ra = M.ops.addComponent(dShort, 'resistor', 0, 0);
      const rb = M.ops.addComponent(dShort, 'resistor', 7, 0);
      M.ops.addWire(dShort, { c: ra, t: 1 }, { c: rb, t: 0 }); // 3 squares long
      check('insert: a segment too short is not used', M.findInsertion(dShort, 'lamp', [3.5, 0]) === null);
      const ins = M.findInsertion(d3, 'lamp', [10.3, 4.2], 0);
      check('insert: a lamp held near the right-hand wire lines up with it', ins && ins.x === 10 && ins.y === 4 && ins.rot === 90, JSON.stringify(ins));
      const ins2 = M.findInsertion(d3, 'ammeter', [5.2, 0.4], 180);
      check('insert: on a horizontal wire a rotation of 180° is kept', ins2 && ins2.y === 0 && ins2.x === 5 && ins2.rot === 180, JSON.stringify(ins2));
      const ins3 = M.findInsertion(d3, 'lamp', [10.5, 12], 0, 6);
      check('insert: the component is kept inside the segment', ins3 && ins3.x === 10 && ins3.y === 6, JSON.stringify(ins3));
      const l = M.ops.addComponent(d3, 'lamp', ins.x, ins.y, { R: 12 });
      d3.components.find((x) => x.id === l).rot = ins.rot;
      check('insert: insertIntoWire succeeds', M.ops.insertIntoWire(d3, l, ins.wire));
      check('insert: the drawing is sound', M.validate(d3).length === 0, M.validate(d3).join('; '));
      let res = E.simulate(d3);
      check('insert: the lamp is now in series (6 V across 12 + 12 Ω gives 0.25 A)', near(res.components[l].I, 0.25) || near(res.components[l].I, -0.25), JSON.stringify(res.components[l]));
      const nl3 = N.build(d3);
      check('insert: the lamp joins the cell to the resistor', [nl3.pointNet[`c:${l}:0`], nl3.pointNet[`c:${l}:1`]].sort().join() === [nl3.pointNet[`c:${c}:1`], nl3.pointNet[`c:${r}:1`]].sort().join());
      check('insert: no wire runs under the lamp', !d3.wires.some((w) => { const path = M.wirePath(d3, w); return path.some((p, i) => i + 1 < path.length && M.segDistance([10, 4], p, path[i + 1]) < 1e-9); }));
      // Take it out and join the wires: back to 0.5 A, and the lamp is free.
      const d4 = M.clone(d3);
      M.ops.takeOut(d4, l, true);
      res = E.simulate(d4);
      check('take out and join: the circuit is closed again (0.5 A)', near(Math.abs(res.components[r].I), 0.5), JSON.stringify(res.components[r]));
      check('take out and join: the lamp has nothing attached', !d4.wires.some((w) => w.from.c === l || w.to.c === l));
      check('take out and join: the lamp was moved clear of the wires', !d4.wires.some((w) => { const path = M.wirePath(d4, w); const lc = d4.components.find((x) => x.id === l); return path.some((p, i) => i + 1 < path.length && M.segDistance([lc.x, lc.y], p, path[i + 1]) < 1.5); }));
      check('take out and join: the drawing is sound', M.validate(d4).length === 0, M.validate(d4).join('; '));
      // Take it out leaving a gap: no current, two loose ends.
      const d5 = M.clone(d3);
      M.ops.takeOut(d5, l, false);
      res = E.simulate(d5);
      check('take out leaving a gap: no current flows', res.components[r].I === 0);
      check('take out leaving a gap: two loose ends', d5.wires.flatMap((w) => [w.from, w.to]).filter((e) => e.free).length === 2);
      check('take out leaving a gap: the drawing is sound', M.validate(d5).length === 0, M.validate(d5).join('; '));
    }

    // What you see is what you get: each rule of reading a diagram.
    {
      const series = () => {
        const s = M.createStore();
        s.change('build', (d) => {
          const c = M.ops.addComponent(d, 'cell', 0, 0, { emf: 6 });
          const l = M.ops.addComponent(d, 'lamp', 10, 0, { R: 12 });
          M.ops.addWire(d, { c, t: 1 }, { c: l, t: 0 });
          M.ops.addWire(d, { c: l, t: 1 }, { c, t: 0 }, [[14, 0], [14, 6], [-4, 6], [-4, 0]]);
        });
        return s;
      };
      const I = (s) => Math.abs(E.simulate(s.drawing).components.l1.I);
      // The teacher's picture: a lamp taken out leaving a gap, then put back exactly where it was.
      const s1 = series();
      check('wysiwyg: the series circuit carries 0.5 A', near(I(s1), 0.5));
      const home = { ...s1.drawing.components.find((c) => c.id === 'l1') };
      s1.change('take out', (d) => M.ops.takeOut(d, 'l1', false));
      check('wysiwyg: taken out leaving a gap, no current', I(s1) === 0);
      const away = s1.drawing.components.find((c) => c.id === 'l1');
      s1.change('move back', (d) => M.ops.moveItems(d, { components: ['l1'] }, home.x - away.x, home.y - away.y));
      check('wysiwyg: put back where it was, its terminals take the loose ends again (0.5 A)', near(I(s1), 0.5));
      // A loose wire end dropped onto a terminal.
      const s2 = M.createStore();
      s2.change('build', (d) => { M.ops.addComponent(d, 'resistor', 0, 0); M.ops.addWire(d, { free: [8, 3] }, { free: [2, 0] }); });
      check('wysiwyg: a loose end on a terminal is joined to it', s2.drawing.wires[0].to.c === 'r1' && s2.drawing.wires[0].to.t === 1);
      // Two loose ends at the same point.
      const s3 = M.createStore();
      s3.change('build', (d) => { M.ops.addWire(d, { free: [0, 0] }, { free: [5, 0] }); M.ops.addWire(d, { free: [5, 0] }, { free: [5, 5] }); });
      check('wysiwyg: two loose ends at the same point are joined by a junction', s3.drawing.junctions.length === 1 && s3.drawing.wires.every((w) => w.from.j || w.to.j));
      // A wire ending on the middle of another wire: a T with a junction.
      const s4 = M.createStore();
      s4.change('build', (d) => { M.ops.addWire(d, { free: [0, 0] }, { free: [10, 0] }); M.ops.addWire(d, { free: [5, 8] }, { free: [5, 0] }); });
      check('wysiwyg: a wire ending on another wire makes a T junction', s4.drawing.junctions.length === 1 && s4.drawing.wires.length === 3);
      // Two wires crossing are not joined.
      const s5 = M.createStore();
      s5.change('build', (d) => { M.ops.addWire(d, { free: [0, 0] }, { free: [10, 0] }); M.ops.addWire(d, { free: [5, -5] }, { free: [5, 5] }); });
      check('wysiwyg: wires that cross are not joined', s5.drawing.junctions.length === 0 && s5.drawing.wires.length === 2 && M.touches(s5.drawing).length === 0);
      // A component put down on a wire's route (along it or across it): the wire goes around it. Only dropping it
      // into the wire (findInsertion) puts it in.
      const s6 = series();
      s6.change('add', (d) => M.ops.addComponent(d, 'resistor', 14, 3, { R: 12 }));
      s6.change('turn', (d) => M.ops.rotate(d, ['r1']));
      check('wysiwyg: a component turned to lie along a wire\'s route: the wire goes around it (still 0.5 A)', near(I(s6), 0.5), `${I(s6)}`);
      check('wysiwyg: … and no wire runs through it', !M.layoutProblems(s6.drawing).length && !s6.drawing.wires.some((w) => onPath(s6.drawing, w, [14, 3])));
      const s7 = series();
      s7.change('add', (d) => M.ops.addComponent(d, 'resistor', 14, 3)); // horizontal, centred on the vertical wire at x = 14
      check('wysiwyg: a component across a wire\'s route is not joined (0.5 A)', near(I(s7), 0.5));
      check('wysiwyg: … the wire goes around it', !M.layoutProblems(s7.drawing).length && !s7.drawing.wires.some((w) => onPath(s7.drawing, w, [14, 3])));
      // Dropping it into the wire does put it in.
      const s6b = series();
      const ins = M.findInsertion(s6b.drawing, 'resistor', [14.2, 3], 0);
      s6b.change('insert', (d) => { const id = M.ops.addComponent(d, 'resistor', ins.x, ins.y, { R: 12 }); d.components.find((c) => c.id === id).rot = ins.rot; M.ops.insertIntoWire(d, id, ins.wire); });
      check('wysiwyg: dropped into the wire, it is in series (0.25 A)', near(I(s6b), 0.25), `${I(s6b)}`);
      // Two wires on top of each other: a warning.
      const s8 = M.createStore();
      s8.change('build', (d) => { M.ops.addWire(d, { free: [0, 0] }, { free: [10, 0] }); M.ops.addWire(d, { free: [3, 4] }, { free: [7, 4] }, [[3, 0], [7, 0]]); });
      check('wysiwyg: wires lying on top of each other get a warning', M.layoutProblems(s8.drawing).some((x) => x.code === 'overlap'));
      check('wysiwyg: none of these leave a join that is shown but not made', [s1, s2, s3, s4, s5, s6, s6b, s7, s8].every((s) => M.touches(s.drawing).length === 0));
      // Automatic routes never pass through a terminal they don't belong to, in random circuits.
      let through = '';
      for (let seed = 1; seed <= 60 && !through; seed++) {
        const dr = draw(randomCircuit(seed).spec, seed);
        const st = M.createStore(dr);
        const d = st.drawing;
        for (const w of d.wires) {
          const own = [w.from, w.to].filter((e) => e.c !== undefined).map((e) => `${e.c}:${e.t}`);
          for (const c of d.components) for (let t = 0; t < C.TYPES[c.type].terminals.length; t++) {
            if (own.includes(`${c.id}:${t}`)) continue;
            const p = C.terminalPosition(c, t);
            const path = M.wirePath(d, w);
            const placed = (w.via || []).some((q) => q[0] === p[0] && q[1] === p[1]); // a bend put there on purpose
            if (!placed && path.slice(1, -1).some((q) => q[0] === p[0] && q[1] === p[1])) through = `seed ${seed}: wire ${w.id} turns a corner on ${c.id}:${t} (${JSON.stringify(path)})`;
          }
        }
      }
      check('routing: automatic corners never land on another component\'s terminal', !through, through);
    }

    // The compact form for saving and share links gives back exactly the same drawing.
    {
      let bad = '';
      let biggest = 0;
      for (let seed = 1; seed <= 80 && !bad; seed++) {
        const st = M.createStore(draw(randomCircuit(seed).spec, seed));
        st.change('extras', (d) => { if (d.components[0]) { d.components[0].label = 'Mine'; d.components[0].rot = 270; } M.ops.addWire(d, { free: [-3, 4] }, { free: [9, -7] }, [[2, 2]]); });
        const d = st.drawing;
        const packed = JSON.stringify(M.pack(d));
        biggest = Math.max(biggest, packed.length);
        const back = M.unpack(JSON.parse(packed));
        if (JSON.stringify(back) !== JSON.stringify(d)) bad = `seed ${seed}: ${JSON.stringify(d).slice(0, 200)} came back as ${JSON.stringify(back).slice(0, 200)}`;
      }
      check('pack: the compact form gives back exactly the same drawing (80 random circuits)', !bad, bad);
      const ex = M.createStore({ components: [{ id: 'c1', type: 'cell', x: 0, y: 0 }, { id: 'r1', type: 'resistor', x: 6, y: 0 }], wires: [{ id: 'w1', from: { c: 'c1', t: 1 }, to: { c: 'r1', t: 0 } }] }).drawing;
      check('pack: default settings are left out', JSON.stringify(M.pack(ex)) === '{"v":1,"c":[["cell","c1",0,0],["resistor","r1",6,0]],"j":[],"w":[["w1","c1.1","r1.0"]]}', JSON.stringify(M.pack(ex)));
      check('pack: rubbish unpacks to an empty drawing', M.unpack({ v: 9 }).components.length === 0 && M.unpack(null).wires.length === 0);
      check('pack: even a random circuit with many bends packs into under 4000 characters', biggest < 4000, `${biggest}`);
    }

    // Drawings from outside (examples, saved circuits, share links) are made complete and safe.
    const loaded = M.createStore({ components: [{ id: 'q', type: 'lamp', x: 1.4, y: 2, rot: 45 }, { id: 'q', type: 'cell' }, { id: 'z', type: 'flux' }, null], wires: [{ id: 'w', from: { c: 'q', t: 0 }, to: { c: 'gone', t: 1 } }, { id: 'w2' }], junctions: 'no' }).drawing;
    check('model: a loaded drawing gets complete settings', loaded.components.length === 1 && loaded.components[0].params.R === 12 && loaded.components[0].params.model === 'ohmic');
    check('model: a loaded drawing is put on the grid with a valid rotation', loaded.components[0].x === 1 && loaded.components[0].rot === 0);
    check('model: wires to missing parts become loose ends; broken wires are dropped', loaded.wires.length === 1 && !!loaded.wires[0].to.free);
    check('model: a loaded drawing is sound', M.validate(loaded).length === 0, M.validate(loaded).join('; '));
    check('model: rubbish loads as an empty drawing', M.validate(M.normalise('rubbish')).length === 0 && M.normalise(42).components.length === 0);

    // The store: undo and redo, and joining a slider drag into one step.
    const s = M.createStore();
    const states = [JSON.stringify(s.drawing)];
    const id = s.change('add', (x) => M.ops.addComponent(x, 'cell', 0, 0));
    states.push(JSON.stringify(s.drawing));
    s.change('add', (x) => M.ops.addComponent(x, 'lamp', 5, 0));
    states.push(JSON.stringify(s.drawing));
    for (const val of [2, 3, 4, 5]) s.change('emf', (x) => M.ops.setParam(x, id, 'emf', val), `param:${id}:emf`);
    states.push(JSON.stringify(s.drawing));
    s.endCoalesce();
    s.change('rotate', (x) => M.ops.rotate(x, [id]));
    states.push(JSON.stringify(s.drawing));
    check('store: a change that changes nothing makes no undo step', (() => { const n0 = JSON.stringify(s.drawing); s.change('nothing', () => {}); s.undo(); const ok = JSON.stringify(s.drawing) === states[3]; s.redo(); return ok && JSON.stringify(s.drawing) === n0; })());
    let ok = true;
    for (let k = states.length - 2; k >= 0; k--) { s.undo(); if (JSON.stringify(s.drawing) !== states[k]) ok = false; }
    check('store: undo goes back one step at a time (a slider drag is one step)', ok && !s.canUndo);
    ok = true;
    for (let k = 1; k < states.length; k++) { s.redo(); if (JSON.stringify(s.drawing) !== states[k]) ok = false; }
    check('store: redo goes forward again', ok && !s.canRedo);

    // Random edits: the drawing stays sound after every one, connections never depend on positions, and undoing
    // everything returns to the start.
    for (let seed = 1; seed <= 20; seed++) {
      const rnd = rng(7000 + seed);
      const st = M.createStore();
      const start = JSON.stringify(st.drawing);
      let problem = '';
      for (let step = 0; step < 90 && !problem; step++) { // fewer than the 100 undo steps kept
        const dr = st.drawing;
        const ids = dr.components.map((x) => x.id);
        const r = rnd();
        const anyEnd = () => {
          const k = rnd();
          if (k < 0.6 && ids.length) { const cid = pick(rnd, ids); return { c: cid, t: intIn(rnd, 0, C.TYPES[dr.components.find((x) => x.id === cid).type].terminals.length - 1) }; }
          if (k < 0.8 && dr.junctions.length) return { j: pick(rnd, dr.junctions).id };
          return { free: [intIn(rnd, -10, 10), intIn(rnd, -10, 10)] };
        };
        if (r < 0.2 || ids.length < 2) st.change('add', (x) => M.ops.addComponent(x, pick(rnd, Object.keys(C.TYPES)), intIn(rnd, -10, 10), intIn(rnd, -10, 10)));
        else if (r < 0.4) st.change('wire', (x) => M.ops.addWire(x, anyEnd(), anyEnd(), rnd() < 0.5 ? [] : [[intIn(rnd, -10, 10), intIn(rnd, -10, 10)]]));
        else if (r < 0.5 && dr.wires.length) {
          const wr = pick(rnd, dr.wires);
          const pth = M.wirePath(dr, wr);
          if (pth.length > 1) st.change('split', (x) => M.ops.splitWire(x, wr.id, pth[intIn(rnd, 0, pth.length - 1)]));
        } else if (r < 0.62) {
          const sel = { components: ids.filter(() => rnd() < 0.3), junctions: dr.junctions.filter(() => rnd() < 0.3).map((j) => j.id) };
          // Moving by itself never changes the connections (only joins made where things then touch can).
          const [dx, dy] = [intIn(rnd, -3, 3), intIn(rnd, -3, 3)];
          const raw = M.clone(dr);
          M.ops.moveItems(raw, sel, dx, dy);
          if (JSON.stringify(N.partition(N.build(raw))) !== JSON.stringify(N.partition(N.build(dr)))) problem = `step ${step}: moving changed the connections`;
          st.change('move', (x) => M.ops.moveItems(x, sel, dx, dy));
        } else if (r < 0.7) {
          const which = ids.filter(() => rnd() < 0.4);
          const raw = M.clone(dr);
          M.ops.rotate(raw, which);
          if (JSON.stringify(N.partition(N.build(raw))) !== JSON.stringify(N.partition(N.build(dr)))) problem = `step ${step}: rotating changed the connections`;
          st.change('rotate', (x) => M.ops.rotate(x, which));
        } else if (r < 0.78) st.change('join', (x) => M.ops.joinAt(x, ids.filter(() => rnd() < 0.3)));
        else if (r < 0.88) st.change('remove', (x) => M.ops.remove(x, { components: ids.filter(() => rnd() < 0.2), wires: dr.wires.filter(() => rnd() < 0.2).map((q) => q.id), junctions: dr.junctions.filter(() => rnd() < 0.2).map((j) => j.id) }));
        else if (r < 0.94 && dr.wires.length) { const wr = pick(rnd, dr.wires); st.change('end', (x) => M.ops.moveWireEnd(x, wr.id, rnd() < 0.5 ? 'from' : 'to', anyEnd())); }
        else if (ids.length) { const cid = pick(rnd, ids); const type = dr.components.find((x) => x.id === cid).type; const key = pick(rnd, Object.keys(C.TYPES[type].params)); st.change('param', (x) => M.ops.setParam(x, cid, key, rnd() * 100)); }
        const bad = M.validate(st.drawing);
        if (bad.length && !problem) problem = `step ${step}: ${bad.join('; ')}`;
        const shown = M.touches(st.drawing);
        if (shown.length && !problem) problem = `step ${step}: the drawing shows a join the wires don't make (${JSON.stringify(shown[0])})`;
        const sim = E.simulate(st.drawing);
        if (!sim.ok && !problem) problem = `step ${step}: the engine failed (${sim.diagnostics.map((q) => q.message).join(' | ')})`;
      }
      check(`model: 90 random edits (seed ${seed}) keep the drawing sound`, !problem, problem);
      while (st.undo());
      check(`model: undoing every random edit (seed ${seed}) returns to the start`, JSON.stringify(st.drawing) === start);
    }
  }

  // ===== 7. Challenge Mode: experimental/circuits/challenges.json =====
  {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const M = require('../../js/circuits/model.js');
    const K = require('../../js/circuits/marking.js');
    const { checkNumeric } = require('../../js/numeric.js');
    const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
    let list = [];
    try { list = JSON.parse(fs.readFileSync(path.join(root, 'experimental/circuits/challenges.json'), 'utf8')); } catch (e) { check('challenges: the file is valid JSON', false, e.message); }
    const b5 = fs.readFileSync(path.join(root, 'themes/b5.html'), 'utf8');
    const ids = new Set();
    // Values worked out by hand for the predict challenges (an independent check on the engine and the data).
    const HAND = { 'CK-B5-08': [1.5, 0.5, 6], 'CK-B5-09': [1, 8, 1], 'CK-B5-10': [6 * 12.5 / 87.5] };
    for (const ch of list) {
      const n = `challenge ${ch.id}`;
      check(`${n}: id is CK-B5-nn and unique`, /^CK-B5-\d\d$/.test(ch.id) && !ids.has(ch.id));
      ids.add(ch.id);
      check(`${n}: type`, ['target', 'measure', 'predict'].includes(ch.type));
      check(`${n}: level SL or HL`, ch.level === 'SL' || ch.level === 'HL');
      check(`${n}: title, summary, brief and explanation`, [ch.title, ch.summary, ch.brief, ch.explanation].every((s) => typeof s === 'string' && s.trim().length > 5));
      check(`${n}: at least one hint`, Array.isArray(ch.hints) && ch.hints.length >= 1 && ch.hints.every((h) => typeof h === 'string' && h.length > 10));
      check(`${n}: its sections exist on the B.5 page`, Array.isArray(ch.sections) && ch.sections.length > 0 && ch.sections.every((s) => b5.includes(`<h2 id="${s}"`)), JSON.stringify(ch.sections));
      const start = M.normalise(ch.start);
      check(`${n}: the start circuit is sound`, M.validate(start).length === 0 && start.components.length === (ch.start.components || []).length, M.validate(start).join('; '));
      const shown = M.createStore(ch.start).drawing;
      check(`${n}: the start circuit has no wires on top of each other or across components`, M.layoutProblems(shown).length === 0, JSON.stringify(M.layoutProblems(shown)));
      if (ch.model) { const md = M.createStore(ch.model).drawing; check(`${n}: the model answer has no wires on top of each other or across components`, M.layoutProblems(md).length === 0, JSON.stringify(M.layoutProblems(md))); }
      check(`${n}: locked and hidden parts exist (hidden ones locked too)`, (ch.locked || []).every((id) => start.components.some((c) => c.id === id)) && (ch.hidden || []).every((id) => (ch.locked || []).includes(id)));
      if (ch.type === 'target') {
        const types = new Set([...start.components.map((c) => c.type), ...Object.keys(ch.toolbox || {})]);
        check(`${n}: has checks`, Array.isArray(ch.checks) && ch.checks.length >= 2);
        const model = M.normalise(ch.model);
        const good = K.markDrawing(ch, model);
        check(`${n}: the model answer passes every check`, good.all, good.results.filter((r) => !r.pass).map((r) => r.text).join(' | '));
        const bad = K.markDrawing(ch, M.normalise(ch.wrong));
        check(`${n}: a wrong answer fails`, !bad.all);
        // A spare part left hanging by one end (it carries no current) mustn't stop a correct circuit passing.
        const spareType = Object.keys(ch.toolbox || {}).find((t) => C.TYPES[t].terminals.length === 2);
        if (spareType) {
          const spare = M.clone(model);
          spare.components.push({ id: 'spare1', type: spareType, x: 40, y: 40, rot: 0, label: 'SPARE1', params: C.normalise(spareType, (ch.toolbox[spareType] || {}).params) });
          const anchor = spare.components.find((c) => c.id === ch.locked[0]);
          spare.wires.push({ id: 'wspare', from: { c: 'spare1', t: 0 }, to: { c: anchor.id, t: 1 }, via: [] });
          const m2 = K.markDrawing(ch, spare);
          check(`${n}: the model answer with a spare ${spareType} hanging by one end still passes`, m2.all, m2.results.filter((r) => !r.pass).map((r) => r.text).join(' | '));
        }
        for (const id of ch.locked || []) {
          const a = start.components.find((c) => c.id === id);
          const b = model.components.find((c) => c.id === id);
          check(`${n}: locked ${id} is unchanged in the model answer`, b && JSON.stringify([a.type, a.x, a.y, a.rot, a.params]) === JSON.stringify([b.type, b.x, b.y, b.rot, b.params]));
        }
        const startIds = new Set(start.components.map((c) => c.id));
        const added = model.components.filter((c) => !startIds.has(c.id));
        check(`${n}: the model answer uses only parts the challenge offers`, added.every((c) => types.has(c.type) && (ch.toolbox || {})[c.type]));
        for (const [type, t] of Object.entries(ch.toolbox || {})) {
          const used = added.filter((c) => c.type === type);
          check(`${n}: the model answer uses no more than ${t.count} × ${type}`, t.count === undefined || used.length <= t.count);
          if (t.fixed) check(`${n}: fixed ${type} settings unchanged in the model answer`, used.every((c) => JSON.stringify(c.params) === JSON.stringify(C.normalise(type, t.params))));
        }
      }
      if (ch.type === 'measure') {
        check(`${n}: has answers`, Array.isArray(ch.answers) && ch.answers.length >= 1);
        for (const a of ch.answers || []) {
          const truth = start.components.find((c) => c.id === a.of).params[a.param];
          check(`${n}: the answer for "${a.label}" is the hidden value`, near(truth, a.answer) && truth >= a.range[0] && truth <= a.range[1], `${truth}`);
          check(`${n}: the hidden value typed in is marked right`, checkNumeric({ answer: a.answer, range: a.range }, String(a.answer)).status === 'right');
          check(`${n}: a value outside the range is marked wrong`, checkNumeric({ answer: a.answer, range: a.range, anySign: !!a.anySign }, String(a.range[1] * 1.2)).status === 'wrong');
          if (a.anySign) check(`${n}: "${a.label}" typed as a negative gradient is accepted`, checkNumeric({ answer: a.answer, range: a.range, anySign: true }, String(-a.answer)).status === 'right');
        }
      }
      if (ch.type === 'predict') {
        const sw = start.components.find((c) => c.id === ch.switch);
        check(`${n}: its switch exists and starts open`, sw && sw.type === 'switch' && sw.params.closed === false);
        const closed = M.clone(start);
        closed.components.find((c) => c.id === ch.switch).params.closed = true;
        const vals = K.predictedValues(ch, closed);
        const hand = HAND[ch.id];
        check(`${n}: the engine's values agree with the values worked out by hand`, hand && vals.length === hand.length && vals.every((v, i) => near(v, hand[i], 1e-9)), `${vals} vs ${hand}`);
        const before = K.predictedValues(ch, start);
        check(`${n}: closing the switch changes every prediction`, vals.every((v, i) => !near(v, before[i], 1e-6)), `${before} → ${vals}`);
        check(`${n}: every part is locked`, start.components.every((c) => (ch.locked || []).includes(c.id)));
      }
    }
    check('challenges: about 10 in the first batch', list.length >= 10, `${list.length}`);
  }

  return { count, failures };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { count, failures } = await runTests();
  for (const f of failures) console.log(`✗ ${f}`);
  console.log(`Circuit builder tests: ${count} checks, ${failures.length} failed.`);
  process.exitCode = failures.length ? 1 : 0;
}
