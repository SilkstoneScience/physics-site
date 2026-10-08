// Phase 12 test datasets for the new capabilities (T5–T8). Built from approved datasets, used only by test.mjs:
// never in tools/1b/datasets, never built into questions/1b.json or the preview. Each GOOD fixture must pass
// validation; each entry of P12_BROKEN must fail with the stated error code (if one stops failing, a check was lost).
import D3 from '../datasets/D3-B01.mjs';
import E3 from '../datasets/E3-B01.mjs';
import { scaleReading } from '../diagrams.mjs';
import { areaUnder } from '../validate.mjs';

const onePart = (d) => [{
  label: 'a', marks: 2, ao: 'AO3', msFigure: 'graph-ms',
  question: 'Describe how the change in the balance reading depends on the current.',
  markscheme: ['The reading increases as the current increases ✓', 'Steadily: equal increases in current give similar increases ✓'],
}];

// T6: a points-only graph (fit: 'none') with the model drawn on the examiner's graph and a reference line on both.
export const D3_MODEL = {
  ...D3,
  graph: {
    x: 'I', y: 'm', fit: 'none', zero: { x: true, y: true },
    modelCurve: (d) => (I) => ((d.p.B * I * d.p.L) / d.p.g) * 1e3,
    modelCurveLabel: 'the reading predicted from the field strength',
    referenceLine: { m: 0.2, c: 0, label: 'the reading a weaker magnet would give' },
  },
  results: {}, claims: [], parts: onePart,
};

// T7: a dense sensor trace, no student table, an area result, and the area shaded on the examiner's graph.
const T_DENSE = Array.from({ length: 31 }, (_, i) => i * 10);
export const E3_AREA = {
  ...E3,
  columns: {
    t: { ...E3.columns.t, values: T_DENSE },
    N: { ...E3.columns.N, show: false },
    R: { ...E3.columns.R, hide: [], propagation: undefined, uncertainty: null },
  },
  graph: { x: 't', y: 'R', fit: 'none', style: 'trace', zero: { x: true, y: true }, shade: { from: 0, to: 300, baseline: 0, label: 'the area under the graph' } },
  tableless: { reason: 'a data logger shows the count rate as a trace', readFrom: [{ figure: 'graph', columns: ['t', 'R'] }] },
  present: ['graph'],
  results: {
    counts: {
      unit: '', dims: { of: 'xy' }, check: 'area', area: { from: 0, to: 300, baseline: 0 },
      value: (d) => areaUnder(d.rows, 't', 'R', 0, 300, 0),
      range: (d, v) => [v * 0.9, v * 1.1],
    },
  },
  claims: [],
  intro: (d) => `<p>A data logger records the count rate $R$ from a radioactive source, corrected for the background (${d.int(d.singles.Nb)} counts in ${d.int(d.p.tb)} s).</p>`,
  parts: (d) => [{
    label: 'a', marks: 2, ao: 'AO2', msFigure: 'graph-ms',
    question: `Estimate the number of counts due to the source between $t = 0$ and $t = ${d.int(300)}\\ \\text{s}$.`,
    markscheme: ['Uses the area under the graph ✓', `About ${d.sf(d.r.counts.value, 2)} (accept ${d.sf(d.r.counts.range[0], 2)} to ${d.sf(d.r.counts.range[1], 2)}) ✓`],
  }],
};

// T8: readings shown on an instrument scale (with the graph), no student table.
const scaleFig = (minor) => (d) => {
  const alt = 'The balance scale, with a mark at each reading';
  return { svg: scaleReading(alt, { min: 0, max: 1.2, major: 0.2, minor, title: 'Δm / g', marks: d.rows.map((r, i) => ({ value: r.m, row: i })) }), alt, caption: 'The readings on the balance scale.' };
};
export const D3_SCALE = {
  ...D3,
  tableless: { reason: 'the readings are shown on the balance scale', readFrom: [{ figure: 'graph', columns: ['I', 'm'] }, { figure: 'scale', columns: ['m'] }] },
  present: ['diagram', 'scale', 'graph'],
  figures: { ...D3.figures, scale: scaleFig(0.02) },
  diagramChecks: [{ figure: 'scale', scale: { column: 'm' } }],
};

const editSvg = (q, name, change) => {
  for (const f of [...q.data, ...q.parts.flatMap((p) => [p.figure, p.msFigure])].filter((x) => x && x.svg)) if (f.figure === name) f.svg = change(f.svg);
};
const svgOf = (q, name) => [...q.data, ...q.parts.flatMap((p) => [p.figure, p.msFigure])].find((x) => x && x.figure === name).svg;

export const P12_BROKEN = [
  // T5
  { name: 'T5: a ratio claimed constant that is clearly not (D3 with a constant-ratio claim on Δm)', expect: 'claim', def: { ...D3, claims: [...D3.claims, { type: 'constantRatio', column: 'm', expect: true }] } },
  { name: 'T5: values claimed to be whole multiples of a factor that they are not', expect: 'claim', def: { ...D3, claims: [...D3.claims, { type: 'integerMultiples', column: 'm', factor: 0.1, expect: true }] } },
  { name: 'T5: a value claimed not constant although the ranges overlap', expect: 'claim', def: { ...E3, claims: [...E3.claims, { type: 'constantRatio', column: 'R', rows: [0, 3], expect: false }] } },
  // T6
  { name: 'T6: a result checked against a gradient on a graph with no fit', expect: 'fit',
    def: { ...D3_MODEL, results: { gradient: { unit: 'g A^-1', check: 'gradient', value: () => 0.3 } } } },
  { name: 'T6: the drawn model curve is not the declared model', expect: 'graph-fit', def: D3_MODEL,
    mutate: (q) => editSvg(q, 'graph-ms', (s) => s.replace(/data-model="curve" points="([^"]*)"/, (m, pts) => `data-model="curve" points="${pts.split(' ').map((p) => { const [x, y] = p.split(','); return `${x},${(+y - 30).toFixed(1)}`; }).join(' ')}"`)) },
  { name: 'T6: the model curve on the students\' graph', expect: 'graph-fit', def: D3_MODEL,
    mutate: (q) => editSvg(q, 'graph', (s) => s.replace('</svg>', (svgOf(q, 'graph-ms').match(/<polyline[^>]*data-model="curve"[^>]*\/>/) || [''])[0] + '</svg>')) },
  { name: 'T6: a reference line that is the line of best fit', expect: 'graph-fit', def: { ...D3, graph: { ...D3.graph, referenceLine: (d) => ({ m: d.fit.m, c: d.fit.c, label: 'a straight line' }) } } },
  // T7
  { name: 'T7: an area accepted range narrower than the policy minimum', expect: 'answer-range', def: { ...E3_AREA, results: { counts: { ...E3_AREA.results.counts, range: (d, v) => [v * 0.99, v * 1.01] } } } },
  { name: 'T7: an area accepted range far too wide', expect: 'answer-range', def: { ...E3_AREA, results: { counts: { ...E3_AREA.results.counts, range: (d, v) => [v * 0.5, v * 1.5] } } } },
  { name: 'T7: an area value that isn\'t the area under the data', expect: 'fit', def: { ...E3_AREA, results: { counts: { ...E3_AREA.results.counts, value: (d) => 1.1 * areaUnder(d.rows, 't', 'R', 0, 300, 0) } } } },
  { name: 'T7: the shaded area missing from the examiner\'s graph', expect: 'graph-fit', def: E3_AREA, mutate: (q) => editSvg(q, 'graph-ms', (s) => s.replace(/<polygon class="area"[^>]*\/>/, '')) },
  { name: 'T7: the shaded area (the answer) on the students\' graph', expect: 'graph-fit', def: E3_AREA,
    mutate: (q) => editSvg(q, 'graph', (s) => s.replace('</svg>', (svgOf(q, 'graph-ms').match(/<polygon class="area"[^>]*\/>/) || [''])[0] + '</svg>')) },
  { name: 'T7: a trace reading drawn in the wrong place', expect: 'graph-point', def: E3_AREA,
    mutate: (q) => editSvg(q, 'graph', (s) => s.replace(/data-trace="1" points="([-\d.]+),([-\d.]+)/, (m, x, y) => `data-trace="1" points="${x},${(+y - 20).toFixed(1)}`)) },
  { name: 'T7: no table, and a column no figure shows', expect: 'table-header', def: { ...E3_AREA, tableless: { ...E3_AREA.tableless, readFrom: [{ figure: 'graph', columns: ['t'] }] } } },
  { name: 'T7: tableless declared but a table shown', expect: 'table-header', def: { ...E3_AREA, present: ['table', 'graph'] } },
  // T8
  { name: 'T8: a scale mark drawn away from its reading', expect: 'scale-read', def: D3_SCALE, mutate: (q) => editSvg(q, 'scale', (s) => s.replace(/(data-mark="0" x1=")([-\d.]+)/, (m, a, x) => `${a}${(+x + 20).toFixed(1)}`)) },
  { name: 'T8: scale divisions too small to read on a phone', expect: 'scale-read', def: { ...D3_SCALE, figures: { ...D3_SCALE.figures, scale: scaleFig(0.005) } } },
  { name: 'T8: an uncertainty smaller than half a scale division', expect: 'uncertainty', def: { ...D3_SCALE, figures: { ...D3_SCALE.figures, scale: scaleFig(0.05) } } },
  { name: 'T8: a scale column with no read-back check', expect: 'table-header', def: { ...D3_SCALE, diagramChecks: [] } },
];
