// Circuit builder: the physics engine (plan: docs/CIRCUIT_BUILDER_PLAN.md, section 5).
// Input: a netlist from js/circuits/netlist.js (or a drawing, with simulate()). Output: the p.d., current and
// power of every component, meter readings, the potential of every net, every wire's current, and diagnostics.
// The editor never calculates anything electrical: it only shows what this file returns.
//
// Method, in short:
//  1. Wires and closed switches join nets into wire groups. Ideal ammeters, 0 Ω parts and ideal cells then join
//     wire groups into clusters whose internal p.d.s are fixed (a weighted union-find). An ideal cell that
//     contradicts a p.d. already fixed is a short circuit or a clash of ideal cells: infinite current.
//  2. Nodal analysis on the clusters ("current in = current out"), Gaussian elimination with partial pivoting;
//     Newton's method with a line search when a filament lamp makes it non-linear (source stepping as a backup).
//  3. The currents in zero-resistance parts follow from "current in = current out": first ammeters, 0 Ω parts
//     and ideal cells between wire groups, then wires and closed switches between points. Where ideal parts
//     form loops of their own, the current is shared as if each had the same tiny resistance.
// Conventions: V = V(terminal 0) − V(terminal 1); I flows through the component from terminal 0 to terminal 1;
// P = VI is the power transferred to the component (negative for a cell supplying energy).
// Works in the browser (window.Circuits.engine) and in Node (require).
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./components.js') : root.Circuits.components;
  const N = isNode ? require('./netlist.js') : root.Circuits.netlist;

  // ---------------- component models ----------------

  // Filament lamp: tungsten's resistance R ∝ T^1.2; the power radiated ∝ T⁴ − T0⁴; T = 2500 K at the rated p.d.
  const LAMP = { T0: 293, Trated: 2500, alpha: 1.2 };
  // Thermistor (NTC): R = R25 exp(B (1/T − 1/298.15 K)).
  function thermistorR(p) {
    const T = p.temp + 273.15;
    return p.R25 * Math.exp(p.B * (1 / T - 1 / 298.15));
  }
  // LDR: 15 kΩ × (E / 10 lux)^−0.7, in parallel with a dark resistance of 1 MΩ.
  const LDR = { R10: 15000, gamma: 0.7, Rdark: 1e6 };
  function ldrR(p) {
    if (p.lux <= 0) return LDR.Rdark;
    const Rlight = LDR.R10 * Math.pow(p.lux / 10, -LDR.gamma);
    return 1 / (1 / LDR.Rdark + 1 / Rlight);
  }

  // The filament lamp at p.d. V: current I, slope g = dI/dV, resistance R and filament temperature T.
  function filament(p, V) {
    const { T0, Trated, alpha } = LAMP;
    const Rhot = (p.Vrated * p.Vrated) / p.Prated;
    const A = Math.pow(Trated, 4) - Math.pow(T0, 4);
    const k = (V / p.Vrated) * (V / p.Vrated) * A; // steady state: h(T) = k
    const h = (T) => (Math.pow(T, 4) - Math.pow(T0, 4)) * Math.pow(T / Trated, alpha);
    const dh = (T) => 4 * Math.pow(T, 3) * Math.pow(T / Trated, alpha) + (Math.pow(T, 4) - Math.pow(T0, 4)) * alpha * Math.pow(T / Trated, alpha) / T;
    let T = T0;
    if (k > 0) {
      let lo = T0;
      let hi = Trated;
      while (h(hi) < k) hi *= 2;
      T = k < h(Trated) ? Math.max(T0 * (1 + 1e-9), Trated * Math.pow(k / h(Trated), 1 / (4 + alpha))) : hi;
      for (let i = 0; i < 200; i++) {
        const f = h(T) - k;
        if (f > 0) hi = T; else lo = T;
        let next = T - f / dh(T);
        if (!(next > lo && next < hi)) next = (lo + hi) / 2;
        if (Math.abs(next - T) <= 1e-15 * T) { T = next; break; }
        T = next;
      }
    }
    const R = Rhot * Math.pow(T / Trated, alpha);
    const dTdV = k > 0 ? (2 * V * A) / (p.Vrated * p.Vrated) / dh(T) : 0;
    const dRdV = (alpha * R / T) * dTdV;
    return { I: V / R, g: 1 / R - (V / (R * R)) * dRdV, R, T };
  }

  // ---------------- small numerical tools ----------------

  // Union-find with potential offsets: o[x] = V(x) − V(parent of x).
  function makeWUF(n) {
    const p = Array.from({ length: n }, (_, i) => i);
    const o = new Array(n).fill(0);
    function find(x) {
      if (p[x] === x) return x;
      const parent = p[x];
      const r = find(parent);
      o[x] += o[parent];
      p[x] = r;
      return r;
    }
    const offset = (x) => { find(x); return o[x]; }; // V(x) − V(its cluster's root)
    // Require V(b) − V(a) = d. Returns 'joined', 'redundant' (already true) or 'conflict' (already fixed differently).
    function relate(a, b, d) {
      const ra = find(a);
      const rb = find(b);
      if (ra === rb) return Math.abs(o[b] - o[a] - d) <= 1e-9 * Math.max(1, Math.abs(d), Math.abs(o[b] - o[a])) ? 'redundant' : 'conflict';
      const rootGap = d + o[a] - o[b]; // V(rb) − V(ra)
      if (ra < rb) { p[rb] = ra; o[rb] = rootGap; } else { p[ra] = rb; o[ra] = -rootGap; }
      return 'joined';
    }
    return { find, offset, relate };
  }

  // Solves A x = b by Gaussian elimination with partial pivoting. Returns null if A is singular.
  function gauss(A, b) {
    const n = b.length;
    const M = A.map((row, i) => [...row, b[i]]);
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      if (!(Math.abs(M[piv][c]) > 1e-300)) return null;
      if (piv !== c) [M[c], M[piv]] = [M[piv], M[c]];
      for (let r = c + 1; r < n; r++) {
        const f = M[r][c] / M[c][c];
        if (f === 0) continue;
        for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
    }
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) {
      let s = M[r][n];
      for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
      x[r] = s / M[r][r];
    }
    return x.every(Number.isFinite) ? x : null;
  }

  // Edge flows in a network of ideal (equal tiny resistance) edges, given the current injected into each vertex
  // from outside: the flows obey "in = out" and, where loops leave a choice, share the current evenly
  // (the least total of flow²). edges: [{ a, b }], flow positive from a to b.
  function flows(vertexCount, edges, inj) {
    const uf = N.makeUF(vertexCount);
    for (const e of edges) uf.union(e.a, e.b);
    const groups = new Map();
    for (const e of edges) {
      const r = uf.find(e.a);
      if (!groups.has(r)) groups.set(r, new Set());
      groups.get(r).add(e.a).add(e.b);
    }
    const phi = new Float64Array(vertexCount);
    for (const [ground, set] of groups) {
      const verts = [...set].filter((v) => v !== ground).sort((x, y) => x - y);
      if (!verts.length) continue;
      const at = new Map(verts.map((v, i) => [v, i]));
      const L = verts.map(() => new Array(verts.length).fill(0));
      const rhs = verts.map((v) => inj[v] || 0);
      for (const e of edges) {
        if (e.a === e.b || uf.find(e.a) !== ground) continue;
        const ia = at.has(e.a) ? at.get(e.a) : -1;
        const ib = at.has(e.b) ? at.get(e.b) : -1;
        if (ia >= 0) L[ia][ia] += 1;
        if (ib >= 0) L[ib][ib] += 1;
        if (ia >= 0 && ib >= 0) { L[ia][ib] -= 1; L[ib][ia] -= 1; }
      }
      const x = gauss(L, rhs);
      if (!x) throw new Error('flows: singular network');
      verts.forEach((v, i) => { phi[v] = x[i]; });
    }
    return edges.map((e) => phi[e.a] - phi[e.b]);
  }

  const maxAbs = (v) => { let m = 0; for (const x of v) m = Math.max(m, Math.abs(x)); return m; };

  // ---------------- from components to elements ----------------

  // Each component becomes one or more two-terminal elements. kind: 'linear' (I = G V + S), 'lamp' (filament),
  // 'zero' (no resistance: ideal ammeter, 0 Ω part), 'source' (ideal cell: V(b) − V(a) = emf), 'wire' (closed switch),
  // 'open' (open switch, ideal voltmeter). a, b: nets of terminals ta, tb.
  function expand(nl) {
    const els = [];
    const resistive = (base, R) => els.push(R > 0 ? { ...base, kind: 'linear', G: 1 / R, S: 0, R } : { ...base, kind: 'zero', R: 0 });
    for (const e of nl.elements) {
      const p = e.params;
      const base = { id: e.id, comp: e.id, type: e.type, label: e.label, a: e.nets[0], b: e.nets[1], ta: 0, tb: 1 };
      switch (e.type) {
        case 'cell':
        case 'battery':
          if (p.r > 0) els.push({ ...base, kind: 'linear', G: 1 / p.r, S: p.emf / p.r, R: p.r, source: true, emf: p.emf, r: p.r });
          else els.push({ ...base, kind: 'source', source: true, emf: p.emf, r: 0 });
          break;
        case 'resistor':
        case 'variable': resistive(base, p.R); break;
        case 'thermistor': resistive(base, thermistorR(p)); break;
        case 'ldr': resistive(base, ldrR(p)); break;
        case 'lamp':
          if (p.model === 'filament') els.push({ ...base, kind: 'lamp', params: p });
          else resistive(base, p.R);
          break;
        case 'potentiometer':
          resistive({ ...base, id: `${e.id}:a`, b: e.nets[2], tb: 2, section: 'a' }, p.R * p.pos);
          resistive({ ...base, id: `${e.id}:b`, a: e.nets[2], ta: 2, section: 'b' }, p.R * (1 - p.pos));
          break;
        case 'switch': els.push({ ...base, kind: p.closed ? 'wire' : 'open' }); break;
        case 'ammeter':
          if (p.ideal) els.push({ ...base, kind: 'zero', R: 0 });
          else resistive(base, p.r);
          break;
        case 'voltmeter':
          if (p.ideal) els.push({ ...base, kind: 'open' });
          else resistive(base, p.R);
          break;
        default: throw new Error(`engine: no model for ${e.type}`);
      }
    }
    return els;
  }

  // The zero-resistance structure of the circuit (shared with js/circuits/steps.js).
  //   g1: wire groups (wires and closed switches)   zg: zero-resistance groups (g1 plus ideal ammeters and 0 Ω parts)
  //   w:  clusters (zg plus ideal cells), with the potential of every net relative to its cluster's root
  function topology(nl) {
    const els = expand(nl);
    const n = nl.netCount;
    const g1 = N.makeUF(n);
    const zg = N.makeUF(n);
    const w = makeWUF(n);
    for (const e of els) if (e.kind === 'wire') { g1.union(e.a, e.b); zg.union(e.a, e.b); w.relate(e.a, e.b, 0); }
    for (const e of els) if (e.kind === 'zero') { zg.union(e.a, e.b); w.relate(e.a, e.b, 0); }
    for (const e of els) {
      if (e.kind !== 'source') continue;
      const res = w.relate(e.a, e.b, e.emf);
      if (res === 'conflict') e.conflict = true;
      else if (res === 'redundant') e.redundant = true;
    }
    return { els, g1, zg, w };
  }

  // ---------------- the solver ----------------

  function solve(nl) {
    const { els, g1, zg, w } = topology(nl);
    const n = nl.netCount;
    const diagnostics = nl.issues.map((x) => ({ ...x }));
    const diag = (code, level, ids, message) => diagnostics.push({ code, level, ids, message });
    const cl = Array.from({ length: n }, (_, i) => w.find(i));
    const off = Array.from({ length: n }, (_, i) => w.offset(i));

    // Islands: clusters joined by elements that conduct.
    const conductive = els.filter((e) => e.kind === 'linear' || e.kind === 'lamp');
    const between = conductive.filter((e) => cl[e.a] !== cl[e.b]);
    const isl = N.makeUF(n);
    for (const e of between) isl.union(cl[e.a], cl[e.b]);
    const clusters = [...new Set(cl)].sort((x, y) => x - y);
    const reference = new Map(); // island root -> reference cluster
    for (const e of els) if (e.source && !reference.has(isl.find(cl[e.a]))) reference.set(isl.find(cl[e.a]), { cluster: cl[e.a], comp: e.comp });
    for (const c of clusters) if (!reference.has(isl.find(c))) reference.set(isl.find(c), { cluster: c, comp: null });
    const isRef = new Set([...reference.values()].map((r) => r.cluster));
    const idx = new Map();
    for (const c of clusters) if (!isRef.has(c)) idx.set(c, idx.size);
    const m = idx.size;

    // Nodal analysis: F(phi) = current leaving each unknown cluster; J = dF/dphi. Sources are scaled by s (source stepping).
    const elementCurrent = (e, V, s) => (e.kind === 'lamp' ? filament(e.params, V) : { I: e.G * V + e.S * s, g: e.G });
    const at = (c) => (idx.has(c) ? idx.get(c) : -1);
    const potentialOf = (phi, x, s) => (at(cl[x]) >= 0 ? phi[at(cl[x])] : 0) + s * off[x];
    function assemble(phi, s) {
      const F = new Array(m).fill(0);
      const J = Array.from({ length: m }, () => new Array(m).fill(0));
      let scale = 0;
      for (const e of between) {
        const { I, g } = elementCurrent(e, potentialOf(phi, e.a, s) - potentialOf(phi, e.b, s), s);
        const ia = at(cl[e.a]);
        const ib = at(cl[e.b]);
        scale += Math.abs(I);
        if (ia >= 0) { F[ia] += I; J[ia][ia] += g; }
        if (ib >= 0) { F[ib] -= I; J[ib][ib] += g; }
        if (ia >= 0 && ib >= 0) { J[ia][ib] -= g; J[ib][ia] -= g; }
      }
      return { F, J, scale };
    }
    let iterations = 0;
    function newton(s, start) {
      let phi = start.slice();
      let cur = assemble(phi, s);
      for (let iter = 0; iter < 100; iter++) {
        iterations++;
        if (maxAbs(cur.F) <= 1e-13 * cur.scale || cur.scale === 0) return phi;
        const d = gauss(cur.J, cur.F.map((x) => -x));
        if (!d) return null;
        let lambda = 1;
        let accepted = null;
        const norm0 = maxAbs(cur.F);
        for (let k = 0; k < 40; k++) {
          const cand = phi.map((x, i) => x + lambda * d[i]);
          const next = assemble(cand, s);
          if (maxAbs(next.F) < norm0 || maxAbs(next.F) <= 1e-13 * next.scale) { accepted = { cand, next }; break; }
          lambda /= 2;
        }
        if (!accepted) return norm0 <= 1e-9 * cur.scale ? phi : null; // at the round-off floor: done
        const step = lambda * maxAbs(d);
        phi = accepted.cand;
        cur = accepted.next;
        if (step <= 1e-14 * (1 + maxAbs(phi)) && maxAbs(cur.F) <= 1e-9 * cur.scale) return phi;
      }
      return maxAbs(cur.F) <= 1e-9 * cur.scale ? phi : null;
    }
    let phi = m ? newton(1, new Array(m).fill(0)) : [];
    if (!phi && conductive.some((e) => e.kind === 'lamp')) {
      for (const steps of [10, 100]) {
        let p = new Array(m).fill(0);
        for (let k = 1; k <= steps && p; k++) p = newton(k / steps, p);
        if (p) { phi = p; break; }
      }
    }
    if (!phi) {
      diag('no-solution', 'error', [], "The builder couldn't solve this circuit. Please tell your teacher which circuit it was.");
      return { ok: false, diagnostics, components: {}, nets: [], wires: {}, iterations };
    }

    // Potentials and element currents.
    const V = Array.from({ length: n }, (_, x) => potentialOf(phi, x, 1));
    // Measure each island's potentials from the − terminal of its first cell (0 V there).
    const zeroAt = new Map();
    for (const e of els) if (e.source && !zeroAt.has(isl.find(cl[e.a]))) zeroAt.set(isl.find(cl[e.a]), V[e.a]);
    for (let x = 0; x < n; x++) V[x] -= zeroAt.get(isl.find(cl[x])) || 0;
    const I = new Map();
    const Vel = (e) => V[e.a] - V[e.b];
    for (const e of conductive) I.set(e.id, elementCurrent(e, Vel(e), 1).I);
    for (const e of els) if (e.kind === 'open') I.set(e.id, 0);

    // Currents in ideal ammeters, 0 Ω parts and ideal cells, between wire groups.
    const G1 = Array.from({ length: n }, (_, x) => g1.find(x));
    const inj = new Float64Array(n);
    const injInf = new Float64Array(n); // the shape of any infinite current (unit size)
    for (const e of conductive) { inj[G1[e.a]] -= I.get(e.id); inj[G1[e.b]] += I.get(e.id); }
    const level2 = els.filter((e) => (e.kind === 'zero' || e.kind === 'source') && !e.conflict);
    const infSign = new Map();
    for (const e of els) if (e.conflict) {
      const sign = Math.sign(e.emf - (off[e.b] - off[e.a])) || 1;
      infSign.set(e.id, sign);
      I.set(e.id, 0); // its finite part; it becomes ±∞ below
      injInf[G1[e.a]] -= sign;
      injInf[G1[e.b]] += sign;
    }
    const edges2 = level2.map((e) => ({ a: G1[e.a], b: G1[e.b] }));
    const f2 = flows(n, edges2, inj);
    const f2inf = flows(n, edges2, injInf);
    level2.forEach((e, i) => {
      if (Math.abs(f2inf[i]) > 1e-9) infSign.set(e.id, Math.sign(f2inf[i]));
      I.set(e.id, f2[i]);
    });

    // Currents in wires and closed switches, between points.
    const pointIndex = new Map(Object.keys(nl.pointNet).map((k, i) => [k, i]));
    const pt = (e, t) => pointIndex.get(N.terminalKey(e.comp, t));
    const injP = new Float64Array(pointIndex.size);
    const injPinf = new Float64Array(pointIndex.size);
    for (const e of els) {
      if (e.kind === 'wire' || e.kind === 'open') continue;
      injP[pt(e, e.ta)] -= I.get(e.id); injP[pt(e, e.tb)] += I.get(e.id);
      const u = infSign.has(e.id) ? (e.conflict ? infSign.get(e.id) : f2inf[level2.indexOf(e)]) : 0;
      injPinf[pt(e, e.ta)] -= u; injPinf[pt(e, e.tb)] += u;
    }
    const switches = els.filter((e) => e.kind === 'wire');
    const edges1 = [
      ...nl.wireEdges.map((x) => ({ a: pointIndex.get(x.a), b: pointIndex.get(x.b) })),
      ...switches.map((e) => ({ a: pt(e, e.ta), b: pt(e, e.tb) })),
    ];
    const f1 = flows(pointIndex.size, edges1, injP);
    const f1inf = flows(pointIndex.size, edges1, injPinf);
    const withInf = (value, unit) => (Math.abs(unit) > 1e-9 ? Math.sign(unit) * Infinity : value);
    const wires = {};
    nl.wireEdges.forEach((x, i) => { wires[x.id] = { I: withInf(f1[i], f1inf[i]), V: V[nl.pointNet[x.a]] }; });
    switches.forEach((e, k) => { const i = nl.wireEdges.length + k; I.set(e.id, withInf(f1[i], f1inf[i])); });
    for (const [id, sign] of infSign) I.set(id, sign * Infinity);
    const infinite = infSign.size > 0;

    // ---------------- results per component ----------------
    const power = (v, i) => (v === 0 || i === 0 ? 0 : v * i);
    const sameIsland = (a, b) => isl.find(cl[a]) === isl.find(cl[b]);
    const components = {};
    const byComp = new Map();
    for (const e of els) { if (!byComp.has(e.comp)) byComp.set(e.comp, []); byComp.get(e.comp).push(e); }
    for (const c of nl.elements) {
      const parts = byComp.get(c.id);
      const e = parts[0];
      const v = V[c.nets[0]] - V[c.nets[1]];
      const p = c.params;
      if (c.type === 'potentiometer') {
        const sections = {};
        for (const s of parts) sections[s.section] = { V: Vel(s), I: I.get(s.id), P: power(Vel(s), I.get(s.id)), R: s.R };
        components[c.id] = { V: v, P: sections.a.P + sections.b.P, sections, slider: V[c.nets[2]] };
        continue;
      }
      const i = I.get(e.id);
      const r = { V: v, I: i, P: power(v, i) };
      if (c.type === 'cell' || c.type === 'battery') {
        Object.assign(r, { emf: p.emf, r: p.r, terminalPD: -v, Pemf: power(p.emf, i), Pint: p.r > 0 ? i * i * p.r : 0, Pout: power(-v, i) });
      } else if (c.type === 'ammeter') {
        r.reading = C.meterDisplay('ammeter', p.range, i);
        r.reading.value = i;
      } else if (c.type === 'voltmeter') {
        const reading = p.ideal && !sameIsland(c.nets[0], c.nets[1]) ? 0 : v;
        r.reading = C.meterDisplay('voltmeter', p.range, reading);
        r.reading.value = reading;
      } else if (c.type === 'lamp') {
        r.R = e.kind === 'lamp' ? filament(p, v).R : p.R;
        if (e.kind === 'lamp') r.T = filament(p, v).T;
        r.brightness = r.P / p.Prated;
      } else if (c.type === 'thermistor' || c.type === 'ldr') r.R = e.R;
      else if (c.type === 'switch') r.closed = p.closed;
      components[c.id] = r;
    }

    // ---------------- diagnostics ----------------
    const sources = els.filter((e) => e.source);
    if (!sources.length && nl.elements.length) diag('no-source', 'info', [], 'Add a cell or battery to make a current flow.');
    const Z = Array.from({ length: n }, (_, x) => zg.find(x));
    for (const e of sources) {
      if (e.conflict) {
        if (Z[e.a] === Z[e.b]) diag('short-ideal', 'error', [e.comp], `${e.label} is short-circuited: a wire (or an ideal ammeter) joins its terminals. With no internal resistance, the current would be infinite.`);
        else diag('ideal-clash', 'error', [e.comp], `${e.label} is in parallel with an ideal cell of a different emf, so the current between them would be infinite. Give the cells internal resistance.`);
      } else if (e.redundant && Z[e.a] !== Z[e.b]) {
        const others = sources.filter((x) => x !== e && x.kind === 'source' && cl[x.a] === cl[e.a]).map((x) => x.comp);
        diag('ideal-parallel', 'info', [e.comp, ...others], `${e.label} is an ideal cell in parallel with another ideal cell of the same emf. The builder shares the current equally between them (real cells share it according to their internal resistances).`);
      } else if (e.kind === 'linear' && Z[e.a] === Z[e.b]) {
        diag('short', 'warning', [e.comp], `${e.label} is short-circuited: the only resistance in the loop is its internal resistance, so a large current flows (I = ε/r = ${fmt(Math.abs(I.get(e.id)))} A).`);
      }
    }
    // A component bypassed by zero resistance.
    for (const e of els) {
      if (e.source || e.section || e.type === 'switch') continue;
      const how = G1[e.a] === G1[e.b] ? 'a wire' : 'an ideal ammeter (or a 0 Ω part)';
      if (e.kind === 'zero') {
        if (e.type === 'ammeter' && G1[e.a] === G1[e.b]) diag('ammeter-bypassed', 'info', [e.comp], `${e.label} is bypassed by a wire, so no current flows through it and it reads zero.`);
      } else if (e.type === 'voltmeter') {
        if (Z[e.a] === Z[e.b]) diag('voltmeter-shorted', 'info', [e.comp], `${e.label} is connected across ${how}, so it reads zero.`);
      } else if ((e.kind === 'linear' || e.kind === 'lamp') && Z[e.a] === Z[e.b]) {
        diag('bypassed', 'info', [e.comp], `${e.label} is short-circuited by ${how}, so there is no p.d. across it and no current through it.`);
      }
    }
    // An ideal voltmeter joining two separate circuits.
    for (const c of nl.elements) {
      if (c.type !== 'voltmeter' || !c.params.ideal) continue;
      const joined = c.nets.every((x) => nl.netPoints[x].length > 1);
      if (joined && !sameIsland(c.nets[0], c.nets[1])) diag('voltmeter-separate', 'info', [c.id], `${c.label} joins two separate circuits, so it reads zero.`);
    }
    // No current from a cell: an open circuit, or a voltmeter in series.
    for (const e of sources) {
      const loop = (withVoltmeters) => {
        const u = N.makeUF(n);
        for (const x of els) {
          if (x === e) continue;
          if (x.type === 'voltmeter' ? withVoltmeters : x.kind !== 'open') u.union(x.a, x.b);
        }
        return u.find(e.a) === u.find(e.b);
      };
      if (loop(false)) continue;
      if (loop(true)) diag('voltmeter-series', 'info', [e.comp], `Only a voltmeter completes the loop with ${e.label}. A voltmeter has a very high resistance, so (almost) no current flows.`);
      else {
        const open = els.some((x) => x.type === 'switch' && x.kind === 'open');
        diag('open-circuit', 'info', [e.comp], `No current flows from ${e.label}: it isn't part of a complete loop.${open ? ' Check the switches.' : ''}`);
      }
    }
    for (const c of nl.elements) {
      if (c.type !== 'lamp') continue;
      const b = components[c.id].brightness;
      if (b > 1.5) diag('lamp-overpower', 'warning', [c.id], `${c.label} has ${fmt(b)} times its rated power: a real lamp would probably blow.`);
    }
    const names = (id) => C.TYPES[nl.elements.find((x) => x.id === id).type].terminalNames;
    for (const u of nl.unconnected) {
      const c = nl.elements.find((x) => x.id === u.id);
      if (c) diag('unconnected', 'info', [u.id], `${c.label} isn't connected at its ${names(u.id)[u.t]} terminal.`);
    }

    // Self-check: energy is conserved.
    let net = 0;
    let flow = 0;
    for (const e of els) {
      const pw = power(Vel(e), I.get(e.id));
      net += pw;
      flow += Math.abs(pw);
    }
    if (!infinite && Math.abs(net) > 1e-9 * flow + 1e-15) diag('energy', 'error', [], 'The builder made an error: energy is not conserved in this solution. Please tell your teacher which circuit it was.');

    const emfPower = sources.reduce((s, e) => s + (Number.isFinite(I.get(e.id)) ? e.emf * I.get(e.id) : Infinity), 0);
    return {
      ok: !diagnostics.some((d) => d.level === 'error' && (d.code === 'energy' || d.code === 'no-solution')),
      infinite,
      iterations,
      components,
      nets: V,
      reference: [...reference.values()].filter((r) => r.comp).map((r) => r.comp),
      wires,
      power: { emf: emfPower },
      diagnostics,
    };
  }

  // Numbers in messages: 3 significant figures.
  function fmt(x) {
    if (!Number.isFinite(x)) return '∞';
    if (x === 0) return '0';
    return Number(x.toPrecision(3)).toString();
  }

  const simulate = (drawing) => solve(N.build(drawing));

  const api = { solve, simulate, expand, topology, models: { filament, thermistorR, ldrR, LAMP, LDR }, fmt };
  if (isNode) module.exports = api;
  else (root.Circuits = root.Circuits || {}).engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
