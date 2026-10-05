// Deliberately broken datasets. Each must FAIL validation with the stated error code;
// if one stops failing, the validator has lost a check. Used by tools/1b/test.mjs.
//   def:    a changed copy of a good dataset definition
//   mutate: a change made to the generated question afterwards (as if someone edited questions/1b.json)
import D3 from '../datasets/D3-B01.mjs';
import B5 from '../datasets/B5-B01.mjs';
import E3 from '../datasets/E3-B01.mjs';

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
    mutate: (q) => editFigure(q, 'graph', (s) => s.replace(/(<circle class="f1 pt" cx="[\d.]+" cy=")([\d.]+)(" r="4.5" data-row="2")/, (m, a, y, b) => a + (Number(y) - 6) + b)) },
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

  // ----- Identity and level -----
  { name: 'Paper 1B dataset on an HL-only topic', expect: 'level-topic', def: { ...D3, id: 'A4-B01', topic: 'A.4' } },
];
