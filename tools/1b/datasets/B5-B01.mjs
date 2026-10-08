// B.5 Internal resistance of a cell: V = ε − Ir, with one anomalous reading.
// Skills: identifying an anomaly, intercept, gradient, percentage uncertainty, evaluating the method.
import { circuit } from '../diagrams.mjs';

// The circuit as a netlist (which component joins which connection points), checked by the validator,
// plus the layout the diagram is drawn from. The voltmeter is across the cell's terminals.
const COMPONENTS = {
  cell: { type: 'cell', nodes: ['a', 'b'] },
  r: { type: 'resistor', nodes: ['b', 'c'], label: 'r' },
  A: { type: 'ammeter', nodes: ['c', 'd'] },
  R: { type: 'variable-resistor', nodes: ['d', 'a'], label: 'R' },
  V: { type: 'voltmeter', nodes: ['a', 'c'], measures: ['cell', 'r'] },
};
const LAYOUT = {
  top: ['cell', 'r'],
  bottom: ['A', 'R'],
  across: [{ id: 'V', from: ['cell', 't1'], to: ['r', 't2'] }],
  box: { around: ['cell', 'r'], label: 'cell' },
};
const ALT = 'Circuit diagram. A cell, drawn with its internal resistance r inside a dashed box, is connected in series with an ammeter and a variable resistor R. '
  + 'A voltmeter is connected across the terminals of the cell.';

export default {
  id: 'B5-B01',
  topic: 'B.5',
  difficulty: 2,
  context: 'experimental',
  skills: ['anomaly', 'intercept', 'gradient', 'percentage-uncertainty', 'evaluate-method'],
  seed: 3,
  batch: 'pilot',
  archetypes: ['L2', 'E3', 'L1'],
  apparatus: 'cell, ammeter, voltmeter and variable resistor',
  contextFamily: 'dc-circuit',
  contextObjects: ['cell-and-meters'],
  originality: 'Standard internal-resistance practical, used in four legacy Section A sessions (May 2017 TZ2, May 2018 TZ1, May 2019 TZ2, Nov 2017). Own numbers, an anomaly and a different sequence; r of about 0.75 ohm resembles a Nov 2025 Paper 2 value (noted in the handoff).',

  // ----- 1. Physics model -----
  physics: {
    scenario: 'A cell with emf ε and internal resistance r is connected in series with an ammeter and a variable resistor R. '
      + 'A voltmeter measures the potential difference V across the cell\'s terminals as R is changed.',
    principles: [
      'Conservation of energy around the circuit (Kirchhoff\'s voltage law): ε = I(R + r) (B.5)',
      'The terminal potential difference is the p.d. across the external resistance: V = IR',
      'Conservation of charge: with an ideal voltmeter, the ammeter current is the cell current',
    ],
    assumptions: [
      'ε and r stay constant during the experiment (no heating or running down between readings)',
      'Ideal meters: the ammeter has no resistance and the voltmeter draws no current',
      'The resistance of the connecting wires is negligible',
    ],
    derivation: [
      'ε = I(R + r) = IR + Ir',
      'V = IR, so V = ε − Ir',
      'A graph of V against I is a straight line with gradient −r and intercept ε on the V axis',
    ],
    relationship: 'V = ε − Ir',
    params: {
      emf: { value: 1.52, unit: 'V', range: [1.2, 1.7], note: 'a 1.5 V cell' },
      r: { value: 0.75, unit: 'Ω', range: [0.05, 2], note: 'a zinc–carbon or partly used cell' },
    },
  },
  circuit: { components: COMPONENTS, figure: 'diagram' },

  // ----- 2. Measurements -----
  columns: {
    I: { kind: 'set', name: 'current', symbol: 'I', unit: 'A', values: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], resolution: 0.01, uncertainty: 0.01 },
    V: {
      kind: 'measured', name: 'terminal p.d.', symbol: 'V', unit: 'V',
      model: { law: 'terminal-pd', inputs: { emf: 'p.emf', I: 'row.I', r: 'p.r' } },
      expect: [0.5, 1.7],
      measurement: {
        instrument: 'digital voltmeter, resolution 0.01 V',
        reading: 'p.d. across the cell\'s terminals once the current has been set',
        noise: 'the last digit fluctuates slightly as contact resistance at the cell terminals changes: modelled as normal scatter with standard deviation 0.004 V',
      },
      noise: { type: 'gauss', sd: 0.004 }, resolution: 0.01, uncertainty: 0.01,
      anomaly: { row: 4, shift: -0.1 },
    },
  },
  // yRange: the emf (the intercept at I = 0, read in part (b)) lies above the data, so the axis must reach it (T3);
  // height: the taller plot keeps the ±0.01 V error bars longer than the point markers (P1).
  graph: { x: 'I', y: 'V', fit: 'linear', band: true, exclude: [4], zero: { x: true }, yRange: [1.0, 1.55], height: 480 },

  // ----- 3. Results -----
  results: {
    emf: {
      unit: 'V', dims: { of: 'y' }, check: 'intercept', estimates: 'emf',
      value: (d) => d.fit.c,
      range: (d, v) => d.widen(d.interceptRange(), v, 0.01),
    },
    r: {
      unit: 'Ω', dims: { of: 'y/x' }, check: 'minusGradient', estimates: 'r',
      value: (d) => -d.fit.m,
      range: (d, v) => { const g = d.gradientRange(); return d.widen(g && [-g[1], -g[0]], v, 0.05); },
    },
    pctV: { unit: '%', value: (d) => (0.01 / d.rows[7].V) * 100 },
  },

  // ----- 4. Claims -----
  claims: [
    { type: 'linear', minR2: 0.995 },
    { type: 'anomaly', row: 4 },
    { type: 'agrees', result: 'emf', value: 1.52, expect: true },
    { type: 'agrees', result: 'r', value: 0.75, expect: true },
    { type: 'trend', direction: 'decreasing' },
  ],

  // ----- 5. Presentation -----
  figures: {
    diagram: () => ({ svg: circuit(ALT, COMPONENTS, LAYOUT), alt: ALT, caption: 'The dashed box represents the cell: an emf $\\varepsilon$ in series with its internal resistance $r$.' }),
  },
  intro: () => '<p>A student investigates the internal resistance of a cell using the circuit shown. '
    + 'The student changes the resistance of the variable resistor $R$ and records the current $I$ and the potential difference $V$ across the terminals of the cell.</p>',

  parts: (d) => {
    const [eLo, eHi] = d.r.emf.range;
    const [rLo, rHi] = d.r.r.range;
    return [
      {
        label: 'a', marks: 2, ao: 'AO3', msFigure: 'graph-ms',
        question: 'Identify the anomalous reading and suggest one possible cause of it.',
        markscheme: [
          `The reading at $I = ${d.text('I', 4)}\\ \\text{A}$, $V = ${d.text('V', 4)}\\ \\text{V}$ ✓`,
          'Any plausible cause, e.g. the voltmeter was misread / a poor connection / the reading was taken before the meters settled ✓',
        ],
      },
      {
        label: 'b', marks: 2, ao: 'AO2', msFigure: 'graph-ms',
        reads: [{ figure: 'graph', x: 0, y: d.r.emf.value }],
        question: 'Determine the emf $\\varepsilon$ of the cell.',
        numeric: d.num('emf'),
        markscheme: [
          'Extends the line of best fit to $I = 0$: the emf is the intercept on the $V$ axis ✓',
          `$\\varepsilon = ${d.sf(d.r.emf.value, 3)}\\ \\text{V}$ (accept ${d.sf(eLo, 3)} to ${d.sf(eHi, 3)}) ✓`,
        ],
      },
      {
        label: 'c', marks: 2, ao: 'AO2',
        question: 'Determine the internal resistance $r$ of the cell.',
        numeric: d.num('r'),
        markscheme: [
          'From $V = \\varepsilon - Ir$, the gradient of the graph is $-r$ ✓',
          `$r = ${d.sf(d.r.r.value, 2)}\\ \\Omega$ (accept ${d.sf(rLo, 2)} to ${d.sf(rHi, 2)}) ✓`,
        ],
      },
      {
        label: 'd', marks: 1, ao: 'AO2',
        question: `Calculate the percentage uncertainty in the reading of $V$ when $I = ${d.text('I', 7)}\\ \\text{A}$.`,
        numeric: d.num('pctV'),
        markscheme: [`$\\dfrac{0.01}{${d.text('V', 7)}} \\times 100 = ${d.sf(d.r.pctV.value, 2)}\\ \\%$ ✓`],
      },
      {
        label: 'e', marks: 2, ao: 'AO3',
        question: 'Suggest why the student should disconnect the circuit between readings.',
        markscheme: [
          'A current makes the cell warm up / makes the cell run down ✓',
          'This would change $r$ (or $\\varepsilon$) during the experiment, so the readings would not all describe the same cell ✓',
        ],
      },
    ];
  },
};
