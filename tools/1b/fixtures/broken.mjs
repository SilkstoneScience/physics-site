// Deliberately broken datasets. Each must FAIL validation with the stated error code;
// if one stops failing, the validator has lost a check. Used by tools/1b/test.mjs.
//   def:    a changed copy of a good dataset definition
//   mutate: a change made to the generated question afterwards (as if someone edited questions/1b.json)
import D3 from '../datasets/D3-B01.mjs';
import B5 from '../datasets/B5-B01.mjs';
import E3 from '../datasets/E3-B01.mjs';
import A1 from '../datasets/A1-B01.mjs';
import C4 from '../datasets/C4-B01.mjs';
import D1 from '../datasets/D1-B01.mjs';
import A1B02 from '../datasets/A1-B02.mjs';
import A2B02 from '../datasets/A2-B02.mjs';
import B3 from '../datasets/B3-B01.mjs';
import C1 from '../datasets/C1-B01.mjs';
import B1 from '../datasets/B1-B01.mjs';
import B1B02 from '../datasets/B1-B02.mjs';

const editPart = (def, label, change) => ({ ...def, parts: (d) => def.parts(d).map((pt) => (pt.label === label ? change(pt, d) : pt)) });
const editFigure = (q, name, change) => {
  for (const f of [...q.data, ...q.parts.map((pt) => pt.msFigure).filter(Boolean)]) if (f.figure === name) f.svg = change(f.svg);
};
const editTable = (q, change) => { const t = q.data.find((x) => x.kind === 'table'); t.html = change(t.html); };
const withoutAO = ({ ao: _ao, ...rest }) => rest;
const setClaims = (def, claims) => ({ ...def, claims: [...def.claims.filter((c) => c.type !== 'verdict'), ...claims] });

// A GOOD dataset that uses the "state the unit" and "value ± uncertainty" part types (D3 plus two parts).
// It must pass validation (tools/1b/test.mjs); the broken variants below must not.
export const D3_ASKS = {
  ...D3,
  parts: (d) => [...D3.parts(d),
    {
      label: 'f', marks: 1, ao: 'AO2', asks: { unit: 'gradient' },
      question: 'State the unit of the gradient in SI base units.',
      markscheme: [`${d.baseUnitTex('gradient')} ✓`],
    },
    {
      label: 'g', marks: 1, ao: 'AO2', asks: { valuePm: ['B', 'dB'] },
      question: 'State the value of $B$ with its absolute uncertainty, to an appropriate number of significant figures.',
      markscheme: [`$B = (${d.pm('B', 'dB')})\\ \\text{T}$ ✓`],
    },
  ],
};

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
  { name: 'propagated uncertainty edited in the table', expect: 'propagation', def: E3,
    mutate: (q) => editTable(q, (h) => h.replace(/(<td data-col="R" data-row="0" data-unc="1">)([\d.]+)/, '$19.9')) },

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

  // ----- Verdicts from the max/min lines (the A1 audit finding) -----
  { name: 'claimed value too close to the max/min-line range (A1 before the audit: 2.50)', expect: 'claim-verdict',
    def: setClaims(A1, [{ type: 'verdict', result: 'uLines', value: 2.5, expect: 'outside' }]) },
  { name: 'a disagreement judged with "agrees" (no margin, answer tolerance as the range)', expect: 'claim-verdict',
    def: setClaims(A1, [{ type: 'agrees', result: 'u', value: 2.6, expect: false }]) },
  { name: 'a verdict judged against an answer tolerance, not the max/min lines', expect: 'claim-verdict',
    def: setClaims(A1, [{ type: 'verdict', result: 'u', value: 2.6, expect: 'outside' }]) },
  { name: 'a widened gradient range said to come from the max/min lines', expect: 'claim-verdict',
    def: { ...A1, results: { ...A1.results, gradient: { ...A1.results.gradient, basis: 'lines' } } } },
  { name: '"inside" verdict for a value at the edge of the range', expect: 'claim-verdict',
    def: setClaims(A1, [{ type: 'verdict', result: 'uLines', value: 2.47, expect: 'inside' }]) },
  { name: 'a verdict margin below the minimum', expect: 'claim-verdict',
    def: setClaims(A1, [{ type: 'verdict', result: 'uLines', value: 2.6, expect: 'outside', margin: 0.01 }]) },

  // ----- AO tags on every part -----
  { name: 'a part with no AO tag', expect: 'ao', def: editPart(D3, 'a', withoutAO) },
  { name: 'AO marks that don\'t add up to the part\'s marks', expect: 'ao', def: editPart(D3, 'b', (pt) => ({ ...pt, ao: { AO2: 1 } })) },
  { name: 'an AO that doesn\'t exist', expect: 'ao', def: editPart(D3, 'd', (pt) => ({ ...pt, ao: 'AO4' })) },

  // ----- "State the unit" and "value ± uncertainty" parts -----
  { name: 'a "state the unit" part whose mark scheme has the wrong unit', expect: 'asks-unit',
    def: editPart(D3_ASKS, 'f', (pt) => ({ ...pt, markscheme: ['$\\text{kg}$ ✓'] })) },
  { name: 'a "state the unit" part that gives the unit away', expect: 'asks-unit',
    def: editPart(D3_ASKS, 'f', (pt, d) => ({ ...pt, question: `Show that the unit of the gradient is ${d.baseUnitTex('gradient')}.` })) },
  { name: 'value ± uncertainty with the value not rounded to match the uncertainty', expect: 'asks-pm',
    def: editPart(D3_ASKS, 'g', (pt, d) => ({ ...pt, markscheme: [`$B = (${d.sf(d.r.B.value, 3)} \\pm ${d.sf(d.r.dB.value, 1)})\\ \\text{T}$ ✓`] })) },
  { name: 'an uncertainty quoted to 3 significant figures', expect: 'asks-pm',
    def: editPart(D3_ASKS, 'g', (pt) => ({ ...pt, asks: { valuePm: ['B', 'dB'], sf: 3 } })) },

  // ----- Batch 1 capabilities: published data, claims, predictions, part figures, text -----
  { name: 'a published (catalogue) value changed in the table', expect: 'catalogue', def: D1,
    mutate: (q) => editTable(q, (h) => h.replace(/(<td data-col="T" data-row="3">)([\d.]+)/, '$11.800')) },
  { name: 'published data without their provenance', expect: 'physics-meta', def: { ...D1, provenance: undefined } },
  { name: 'published data allowed to differ from the model by 20 %', expect: 'physics-meta',
    def: { ...D1, columns: { ...D1.columns, T: { ...D1.columns.T, agree: 0.2 } } } },
  { name: 'published data that don\'t follow the model (a period 3 % too long)', expect: 'catalogue',
    def: { ...D1, columns: { ...D1.columns, T: { ...D1.columns.T, agree: 0.01, values: D1.columns.T.values.map((v, i) => (i === 5 ? v * 1.03 : v)) } } } },
  { name: '"not linear" claimed for data a straight line fits', expect: 'claim',
    def: { ...D3, rawGraph: { x: 'I', y: 'm' }, present: ['diagram', 'table', 'graph', 'graph-raw'], claims: [...D3.claims, { type: 'notLinear', graph: 'raw' }] } },
  { name: 'an "outlier" too close to the other readings', expect: 'claim',
    def: { ...A1B02, columns: { ...A1B02.columns, t: { ...A1B02.columns.t, anomaly: { row: 4, shift: -0.004 } } } } },
  { name: 'the same weak outlier, caught by the independent audit too', expect: 'independent-conclusion',
    def: { ...A1B02, columns: { ...A1B02.columns, t: { ...A1B02.columns.t, anomaly: { row: 4, shift: -0.004 } } } } },
  { name: 'a validity range claimed beyond where the line really fits', expect: 'claim',
    def: { ...A2B02, claims: A2B02.claims.map((c) => (c.type === 'validRange' ? { ...c, lastLinearRow: 6 } : c)) } },
  { name: 'rows beyond the validity range left in the fit', expect: 'claim',
    def: { ...A2B02, graph: { ...A2B02.graph, exclude: [6, 7, 8] } } },
  { name: 'a "prediction" at a temperature that was measured', expect: 'prediction',
    def: { ...B3, results: { ...B3.results, pred: { ...B3.results.pred, predictAt: { column: 'theta', value: 37.0 } } } } },
  { name: 'absolute zero calculated wrongly (5 °C off)', expect: 'physics-inversion',
    def: { ...B3, results: { ...B3.results, absZero: { ...B3.results.absZero, value: (d) => -d.fit.c / d.fit.m - 5 } } } },
  { name: 'the raw-data graph not shown', expect: 'graph-point', def: { ...C1, present: ['table'] } },
  { name: 'a point moved on a graph shown inside a part', expect: 'graph-point', def: C1,
    mutate: (q) => { const f = q.parts.find((p) => p.figure).figure; f.svg = f.svg.replace(/(<circle class="f1 pt" cx="[\d.]+" cy=")([\d.]+)(" r="[\d.]+" data-row="2")/, (m, a, y, b) => a + (Number(y) - 6) + b); } },
  { name: 'a LaTeX command that lost its backslash (\\text became a tab)', expect: 'text-control',
    def: editPart(B1, 'f', (pt) => ({ ...pt, markscheme: ['Use a digital thermometer reading to $0.1\\ {}^{\\circ}\text{C}$ ✓'] })) },
  { name: 'heat loss said to make c too large, with no loss in the model', expect: 'independent-conclusion',
    def: { ...B1B02, physics: { ...B1B02.physics, params: { ...B1B02.physics.params, h: { ...B1B02.physics.params.h, value: 0.05 } } } } },

  // ----- Identity and level -----
  { name: 'Paper 1B dataset on an HL-only topic', expect: 'level-topic', def: { ...D3, id: 'A4-B01', topic: 'A.4' } },
  // ----- Phase 12 safeguards (safeguards.mjs) -----
  { name: 'T4: the stem states a value a later part asks for (the gradient)', expect: 'giveaway',
    def: { ...D3, intro: (d) => D3.intro(d) + `<p>The gradient of the graph is about ${d.sf(d.r.gradient.value, 3)}.</p>` } },
  { name: 'T4: an earlier part states the conclusion a later "whether" part asks for', expect: 'giveaway',
    def: editPart(D3, 'a', (pt) => ({ ...pt, markscheme: [...pt.markscheme, 'So the data support $F \propto I$.'] })) },
  { name: 'T4: the stem shows the transformation a later part asks students to choose', expect: 'giveaway',
    def: { ...C1, intro: (d) => C1.intro(d) + '<p>The student also plans a graph of $T^2$ against $m$.</p>' } },
  { name: 'T4: an earlier mark scheme gives the unit a later part asks for', expect: 'giveaway',
    def: editPart(D3_ASKS, 'e', (pt, d) => ({ ...pt, markscheme: [...pt.markscheme, `(The gradient is in ${d.baseUnitTex('gradient')}.)`] })) },
  { name: 'T3: a part expects a value read from the graph beyond its axis', expect: 'graph-read',
    def: editPart(D3, 'b', (pt) => ({ ...pt, reads: [{ figure: 'graph', x: 10 }] })) },
  { name: 'T3: a part reads from a graph the question doesn\'t show', expect: 'graph-read',
    def: editPart(D3, 'b', (pt) => ({ ...pt, reads: [{ figure: 'graph-raw', x: 1 }] })) },
  { name: 'P1: error bars declared too small to show although they would be visible', expect: 'graph-errorbar-hidden',
    def: { ...D3, graph: { ...D3.graph, errorBars: 'too-small' } } },
  { name: 'P1: a mark scheme refers to error bars that are not drawn', expect: 'graph-errorbar-text',
    def: editPart(C1, 'a', (pt) => ({ ...pt, markscheme: ['No straight line passes through all the error bars ✓', ...pt.markscheme.slice(1)] })) },
  { name: 'P1: x error bars drawn (this bank draws y error bars only)', expect: 'graph-x-errorbars',
    def: { ...D3, graph: { ...D3.graph, xErrorBars: true } } },
  { name: 'P1: an unknown errorBars setting', expect: 'graph-errorbar',
    def: { ...D3, graph: { ...D3.graph, errorBars: 'invisible' } } },
  { name: 'T2: a regularity acceptance without a reason', expect: 'regular-data',
    def: { ...D3, columns: { ...D3.columns, m: { ...D3.columns.m, regularity: { accept: ['equal-steps'] } } } } },
];
