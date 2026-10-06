// Deliberately broken datasets. Each must FAIL validation with the stated error code;
// if one stops failing, the validator has lost a check. Used by tools/1b/test.mjs.
//   def:    a changed copy of a good dataset definition
//   mutate: a change made to the generated question afterwards (as if someone edited questions/1b.json)
import D3 from '../datasets/D3-B01.mjs';
import B5 from '../datasets/B5-B01.mjs';
import E3 from '../datasets/E3-B01.mjs';
import A1 from '../datasets/A1-B01.mjs';
import C4 from '../datasets/C4-B01.mjs';

const editPart = (def, label, change) => ({ ...def, parts: (d) => def.parts(d).map((pt) => (pt.label === label ? change(pt, d) : pt)) });
const editFigure = (q, name, change) => {
  for (const f of [...q.data, ...q.parts.map((pt) => pt.msFigure).filter(Boolean)]) if (f.figure === name) f.svg = change(f.svg);
};
const editTable = (q, change) => { const t = q.data.find((x) => x.kind === 'table'); t.html = change(t.html); };

export default [
  // ----- Answers -----
  { name: 'answer typed by hand, not linked to a result', expect: 'answer-source', def: D3,
    mutate: (q) => { const pt = q.parts.find((p) => p.label === 'b'); pt.numeric = { answer: 0.33, unit: pt.numeric.unit }; } },
  { name: 'answer edited after generation', expect: 'answer', def: D3,
    mutate: (q) => { q.parts.find((p) => p.label === 'c').numeric.answer *= 1.1; } },
  { name: 'gradient result calculated wrongly (8 % too big)', expect: 'fit',
    def: { ...D3, results: { ...D3.results, gradient: { ...D3.results.gradient, value: (d) => d.fit.m * 1.08 } } } },
  { name: 'answer unit doesn\'t match the result', expect: 'answer-unit', def: D3,
    mutate: (q) => { q.parts.find((p) => p.label === 'c').numeric.unit = '$\\text{mT}$'; } },
  { name: 'result unit has the wrong dimensions', expect: 'unit-dims',
    def: { ...B5, results: { ...B5.results, r: { ...B5.results.r, unit: 'V' } } } },
  { name: 'a "common mistake" the marker would accept as correct', expect: 'answer-mistake',
    def: editPart(E3, 'b', (pt) => ({ ...pt, numeric: { ...pt.numeric, mistakes: [{ value: pt.numeric.answer * 1.005, feedback: 'x' }] } })) },
  { name: 'mark scheme doesn\'t state the answer', expect: 'markscheme-value',
    def: editPart(D3, 'b', (pt) => ({ ...pt, markscheme: ['Uses a large triangle ✓', 'Correct gradient ✓'] })) },

  // ----- Table, data and uncertainties -----
  { name: 'table value mistyped', expect: 'model', def: D3,
    mutate: (q) => editTable(q, (h) => h.replace(/(<td data-col="m" data-row="2">)([\d.]+)/, (m, a, v) => a + (Number(v) + 0.2).toFixed(2))) },
  { name: 'inconsistent decimal places', expect: 'table-dp', def: D3,
    mutate: (q) => editTable(q, (h) => h.replace(/(<td data-col="I" data-row="1">)([\d.]+)/, '$1$20')) },
  { name: 'calculated column doesn\'t match its inputs', expect: 'derived', def: E3,
    mutate: (q) => editTable(q, (h) => h.replace(/(<td data-col="R" data-row="5">)([\d.]+)/, (m, a, v) => a + (Number(v) + 1).toFixed(1))) },
  { name: 'uncertainty smaller than the instrument\'s resolution', expect: 'uncertainty',
    def: { ...D3, columns: { ...D3.columns, I: { ...D3.columns.I, uncertainty: 0.001 } } } },
  { name: 'data too scattered for a line through every error bar', expect: 'fit',
    def: { ...D3, columns: { ...D3.columns, m: { ...D3.columns.m, noise: { type: 'gauss', sd: 0.05 } } } } },

  // ----- Claims made by the questions -----
  { name: 'question says the line misses the origin, but it doesn\'t', expect: 'claim',
    def: { ...D3, claims: [...D3.claims.filter((c) => c.type !== 'throughOrigin'), { type: 'throughOrigin', expect: false }] } },
  { name: 'question says B agrees with a value the data rule out', expect: 'claim',
    def: { ...D3, claims: [...D3.claims, { type: 'agrees', result: 'B', value: 0.09, expect: true }] } },
  { name: 'anomaly too small for students to spot', expect: 'claim-anomaly',
    def: { ...B5, columns: { ...B5.columns, V: { ...B5.columns.V, anomaly: { row: 4, shift: -0.02 } } } } },

  // ----- Graphs -----
  { name: 'graph point moved by 6 pixels', expect: 'graph-point', def: D3,
    mutate: (q) => editFigure(q, 'graph', (s) => s.replace(/(<circle class="f1 pt" cx="[\d.]+" cy=")([\d.]+)(" r="[\d.]+" data-row="2")/, (m, a, y, b) => a + (Number(y) - 6) + b)) },
  { name: 'wrong unit on the y-axis', expect: 'graph-axis', def: D3,
    mutate: (q) => editFigure(q, 'graph', (s) => s.replace('</tspan> / g</text>', '</tspan> / kg</text>')) },
  { name: 'error bar too short', expect: 'graph-errorbar', def: D3,
    mutate: (q) => editFigure(q, 'graph', (s) => s.replace(/(<path class="ebar" data-row="3" data-axis="y" d="M[\d.]+ )([\d.]+)/, (m, a, y) => a + (Number(y) + 4))) },
  { name: 'students\' graph shows the answer line', expect: 'graph-fit', def: D3,
    mutate: (q) => editFigure(q, 'graph', (s) => s.replace('</svg>', '<line class="l1 thin fit" data-fit="best" x1="86" y1="334" x2="536" y2="20"/></svg>')) },
  { name: 'mark-scheme line isn\'t the line of best fit', expect: 'graph-fit', def: D3,
    mutate: (q) => editFigure(q, 'graph-ms', (s) => s.replace(/(data-fit="best" x1="[\d.]+" y1=")([\d.]+)/, (m, a, y) => a + (Number(y) - 15))) },

  // ----- Diagrams -----
  { name: 'current drawn the wrong way through the page (so the force arrow is wrong too)', expect: 'vector',
    def: { ...D3, vectors: { ...D3.vectors, I: [0, 0, -1] } } },
  { name: 'colour written into an SVG (breaks dark mode)', expect: 'svg-colour', def: D3,
    mutate: (q) => editFigure(q, 'diagram', (s) => s.replace('<rect ', '<rect fill="#1f5fbf" ')) },
  { name: 'ammeter connected across a resistor', expect: 'circuit',
    def: { ...B5, circuit: { ...B5.circuit, components: { ...B5.circuit.components, A: { type: 'ammeter', nodes: ['b', 'c'] } } } } },
  { name: 'voltmeter said to be across the wrong components', expect: 'circuit',
    def: { ...B5, circuit: { ...B5.circuit, components: { ...B5.circuit.components, V: { ...B5.circuit.components.V, measures: ['cell'] } } } } },
  { name: 'a wire missing from the circuit drawing', expect: 'circuit-drawing', def: B5,
    mutate: (q) => editFigure(q, 'diagram', (s) => {
      const [, x, y] = s.match(/data-id="A" data-t1="([\d.]+) ([\d.]+)"/);
      return s.replace(new RegExp(`<line class="wire" x1="[\\d.]+" y1="[\\d.]+" x2="${x}" y2="${y}"/>`), '');
    }) },

  // ----- Physics model -----
  // The audit's E3 error: counts over an interval modelled as the count RATE at one instant.
  // The rate law gives s⁻¹ but the column is a number of counts, so units refuse it.
  { name: 'counts modelled as an instantaneous rate (the audit\'s E3 error)', expect: 'physics-units',
    def: { ...E3, columns: { ...E3.columns, N: { ...E3.columns.N, model: { law: 'count-rate', inputs: { R0: 'p.R0', t: 'row.t', T: 'p.T' } } } } } },
  { name: 'model written as a formula instead of a vetted law', expect: 'physics-meta',
    def: { ...D3, columns: { ...D3.columns, m: { ...D3.columns.m, model: (row, p) => p.B * row.I } } } },
  { name: 'model input with the wrong unit (current used as the field)', expect: 'physics-units',
    def: { ...D3, columns: { ...D3.columns, m: { ...D3.columns.m, model: { law: 'balance-reading', inputs: { F: { law: 'force-on-wire', inputs: { B: 'row.I', I: 'row.I', L: 'p.L' } }, g: 'p.g' } } } } } },
  { name: 'analysis formula that isn\'t the inverse of the model (forgets ×g)', expect: 'physics-inversion',
    def: { ...D3, results: { ...D3.results, B: { ...D3.results.B, value: (d) => (d.r.gradient.value * 1e-3) / d.p.L } } } },
  { name: 'implausible parameter (a 5 T school magnet)', expect: 'physics-range',
    def: { ...D3, physics: { ...D3.physics, params: { ...D3.physics.params, B: { ...D3.physics.params.B, value: 5 } } } } },
  { name: 'model gives values outside the expected magnitude', expect: 'physics-magnitude',
    def: { ...B5, columns: { ...B5.columns, V: { ...B5.columns.V, expect: [5, 10] } } } },
  { name: 'no stated cause for the random scatter', expect: 'physics-meta',
    def: { ...B5, columns: { ...B5.columns, V: { ...B5.columns.V, measurement: { instrument: 'voltmeter', reading: 'V' } } } } },
  { name: 'assumptions not stated', expect: 'physics-meta',
    def: { ...B5, physics: { ...B5.physics, assumptions: [] } } },

  // ----- Repeated readings (A1-B01) -----
  { name: 'a trial reading edited after generation (answers no longer match)', expect: 'answer', def: A1,
    mutate: (q) => { const t = q.data.find((x) => x.figure === 'trials'); t.html = t.html.replace(/(<td data-trial="0">)([\d.]+)/, (m, a, v) => a + (Number(v) + 0.004).toFixed(3)); } },
  { name: 'trials table for a row whose blank mean then can\'t be calculated', expect: 'table-value',
    def: { ...A1, trialsTable: { ...A1.trialsTable, row: 3 } } },
  { name: 'launch velocity drawn the wrong way', expect: 'vector',
    def: { ...A1, vectors: { ...A1.vectors, u: [-1, 0, 0] } } },

  // ----- Standing waves (C4-B01) -----
  { name: 'diagram said to show the 2nd harmonic but drawn with 3 loops', expect: 'diagram',
    def: { ...C4, diagramChecks: [{ figure: 'diagram-ms', harmonic: 2 }] } },
  { name: 'wave drawn without a node at the fixed end', expect: 'diagram', def: C4,
    mutate: (q) => editFigure(q, 'diagram', (s) => s.replace(/(<polyline class="l1 thin wave" points=")100,120/, '$1100,110')) },

  // ----- Uncertainty propagation (checked independently from each column's own formula) -----
  { name: 'propagation declared as a power of 1 for R² (should be 2)', expect: 'propagation',
    def: { ...A1, columns: { ...A1.columns, R2: { ...A1.columns.R2, propagation: { form: 'product', terms: [{ of: 'R', n: 1 }] } } } } },
  { name: 'propagation leaves out a quantity the formula depends on', expect: 'propagation',
    def: { ...E3, columns: { ...E3.columns, R: { ...E3.columns.R, propagation: { form: 'sum', terms: [] } } } } },
  { name: '"neglected" uncertainty that is actually the main one', expect: 'propagation',
    def: { ...E3, columns: { ...E3.columns, R: { ...E3.columns.R, propagation: { form: 'sum', terms: [{ single: 'Nb', coef: (p) => -1 / p.tb, unc: 'poisson' }], neglect: [{ of: 'N', unc: 'poisson', reason: 'test' }] } } } } },
  { name: 'propagation includes a quantity the formula doesn\'t use', expect: 'propagation',
    def: { ...C4, columns: { ...C4.columns, invL: { ...C4.columns.invL, propagation: { form: 'product', terms: [{ of: 'L', n: -1 }, { of: 'f', n: 1 }] } } } } },
  { name: 'propagated uncertainty edited in the table', expect: 'propagation', def: C4,
    mutate: (q) => editTable(q, (h) => h.replace(/(<td data-col="invL" data-row="0" data-unc="1">)([\d.]+)/, '$10.080')) },

  // ----- Independent physics audit (generator vs independently derived physics) -----
  // The audit's original E3 error, written with valid units (a rate × a time), so only physics catches it.
  { name: 'E3 counts as instantaneous rate × Δt (the original error): caught by the independent physics', expect: 'independent-model',
    def: { ...E3, columns: { ...E3.columns, N: { ...E3.columns.N, model: { law: 'uniform-counts', inputs: { rate: { law: 'count-rate-with-background', inputs: { R0: 'p.R0', t: 'row.t', T: 'p.T', b: 'p.bg' } }, dt: 'p.dt' } } } } } },
  { name: 'generator model with the wire at 30° to the field (the physics says 90°)', expect: 'independent-model',
    def: { ...D3, columns: { ...D3.columns, m: { ...D3.columns.m, model: { law: 'balance-reading', inputs: { F: { law: 'force-on-wire', inputs: { B: 'p.B', I: 'row.I', L: 'p.L', theta: { value: Math.PI / 6, unit: '' } } }, g: 'p.g' } } } } } },
  { name: 'a dataset with no independent audit', expect: 'independent-missing', def: { ...D3, id: 'D3-B09' } },
  { name: 'published answer disagrees with the independent recalculation', expect: 'independent-answer', def: C4,
    mutate: (q) => { q.parts.find((p) => p.label === 'd').numeric.answer *= 1.05; } },
  { name: 'published data biased against the independent physics', expect: 'independent-data', def: D3,
    mutate: (q) => editTable(q, (h) => h.replace(/(<td data-col="m" data-row="\d+">)([\d.]+)/g, (m, a, v) => a + (Number(v) + 0.04).toFixed(2))) },

  // ----- Numbers in the text must be traceable -----
  { name: 'a number typed into the question text', expect: 'text-number', def: D3,
    mutate: (q) => { q.stem = q.stem.replace('for different currents', 'for currents up to 3.25 A'); } },
  { name: 'a number typed into a mark scheme', expect: 'text-number', def: B5,
    mutate: (q) => { q.parts[1].markscheme[1] += ' (or 1.49 V)'; } },
  { name: 'a stated constant that disagrees with its parameter', expect: 'text-number',
    def: { ...D3, stated: { ...D3.stated, L_cm: { ...D3.stated.L_cm, value: 6.0 } } } },
  { name: 'a stated constant with no source', expect: 'text-number',
    def: { ...A1, stated: { claimedU: { value: 2.5, dp: 2 } } } },

  // ----- Systematic effects -----
  { name: 'a systematic effect with no stated physical cause', expect: 'physics-meta',
    def: { ...D3, columns: { ...D3.columns, m: { ...D3.columns.m, systematic: [{ type: 'zero-offset', offset: 0.05, justification: 'looks realistic' }] } } } },

  // ----- Identity and level -----
  { name: 'Paper 1B dataset on an HL-only topic', expect: 'level-topic', def: { ...D3, id: 'A4-B01', topic: 'A.4' } },
];
