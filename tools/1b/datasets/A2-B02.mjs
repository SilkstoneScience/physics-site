// A.2 A copper wire loaded until Hooke's law stops describing the data: where the model holds (evidence from the graph),
// k from that region only, and why fitting every point would give the wrong k (archetypes V2 and L1).
// Part (d) replaced on 8 October 2026 (teacher): the elastic limit and the limit of proportionality are not in the SL
// guide (A.2 has only Hooke's law), so (d) now asks what happens to k if the points beyond the straight region are included.

const LIN = 4;  // last row in the proportional region (49.0 N)
const ROW = 7;  // the row used for the comparison in (c) (78.4 N)

export default {
  id: 'A2-B02',
  topic: 'A.2',
  difficulty: 3,
  context: 'experimental',
  skills: ['model-validity-range', 'gradient', 'evidence-against-a-model', 'fit-only-the-valid-region', 'reference-wire'],
  seed: 91,
  batch: 'batch-1',
  archetypes: ['V2', 'L1'],
  apparatus: 'long copper wire with a reference wire and a vernier scale',
  contextFamily: 'elastic-stretching',
  contextObjects: ['stretched-wire', 'slotted-masses'],
  features: ['model:empirical'],
  originality: 'Loading a wire (Searle-type apparatus) is a standard practical; no legacy Section A or 2025 Paper 1B question uses it. '
    + 'The emphasis on where Hooke\'s law stops fitting, judged against the uncertainties, and on the error made by fitting all the '
    + 'points, is this dataset\'s own. Own numbers and sequence.',

  physics: {
    scenario: 'A long, thin hard-drawn copper wire hangs from a beam beside an identical reference wire that carries a constant small load. '
      + 'Masses of 1.0 kg are added one at a time to the test wire, and a vernier scale between the two wires measures the extension x '
      + 'of the test wire. The loads are taken beyond the limit of proportionality.',
    principles: [
      'Hooke\'s law: F = kx up to the limit of proportionality (A.2)',
      'Beyond the limit of proportionality the extension grows faster than the load as the metal begins to yield (not assessed: the SL guide has only Hooke\'s law)',
    ],
    assumptions: [
      'Below F_p the wire obeys Hooke\'s law, with k = EA/L for its dimensions (about 9.4 kN m⁻¹)',
      'Beyond F_p the extra extension is modelled empirically as β(F − F_p)², a smooth start to yielding (beyond the syllabus)',
      'The reference wire cancels changes in temperature and any sagging of the support',
    ],
    derivation: [
      'For F ≤ F_p: x = F/k, a straight line through the origin',
      'For F > F_p: x = F/k + β(F − F_p)², which lies above the straight line by an increasing amount',
    ],
    relationship: 'x = F/k for F ≤ F_p; x = F/k + β(F − F_p)² for F > F_p',
    params: {
      k: { value: 9420, unit: 'N m^-1', range: [3000, 30000], note: '2.50 m of 0.50 mm diameter hard-drawn copper (E ≈ 120 GPa)' },
      Fp: { value: 50, unit: 'N', range: [30, 80], note: 'limit of proportionality: about 250 MPa for hard-drawn copper' },
      beta: { value: 1e-6, unit: 'm N^-2', range: [2e-7, 5e-6], note: 'empirical: about 1.5 mm extra extension 40 N beyond F_p' },
    },
  },

  columns: {
    F: { kind: 'set', name: 'load', symbol: 'F', unit: 'N', values: [9.8, 19.6, 29.4, 39.2, 49.0, 58.8, 68.6, 78.4, 88.2], resolution: 0.1 },
    x: {
      kind: 'measured', name: 'extension', symbol: 'x', unit: 'mm',
      model: { law: 'wire-extension-beyond-limit', inputs: { F: 'row.F', k: 'p.k', Fp: 'p.Fp', beta: 'p.beta' } },
      expect: [0.5, 12],
      measurement: {
        instrument: 'vernier scale between the test wire and the reference wire, reading to 0.05 mm',
        reading: 'vernier reading with the load, minus the reading with no extra load',
        noise: 'judging the vernier coincidence and small temperature differences between the two wires: normal scatter with standard deviation 0.02 mm',
      },
      noise: { type: 'gauss', sd: 0.02 }, resolution: 0.05, uncertainty: 0.05,
    },
  },
  // The fit uses only the proportional region; the examiner's line is extended to show the departure.
  // errorBars 'too-small': ±0.05 mm is under 0.5 % of the axis; the caption states it instead (P1).
  graph: { x: 'F', y: 'x', fit: 'linear', band: true, exclude: [5, 6, 7, 8], zero: { x: true, y: true }, errorBars: 'too-small' },

  results: {
    gradient: { unit: 'mm N^-1', dims: { of: 'y/x' }, check: 'gradient', value: (d) => d.fit.m, range: (d, v) => d.widen(d.gradientRange(), v, 0.04) },
    k: {
      unit: 'N m^-1', estimates: 'k',
      value: (d) => 1 / (d.r.gradient.value * 1e-3),
      range: (d) => d.r.gradient.range.map((m) => 1 / (m * 1e-3)).sort((a, b) => a - b),
    },
    xHooke: { unit: 'mm', value: (d) => (d.rows[ROW].F / d.r.k.value) * 1e3 },
    excess: { unit: 'mm', value: (d) => d.rows[ROW].x - d.r.xHooke.value },
    // (d): k from one straight line through ALL nine points (least squares), which the curved region makes too small.
    kAll: {
      unit: 'N m^-1',
      value: (d) => {
        const xs = d.rows.map((r) => r.F);
        const ys = d.rows.map((r) => r.x);
        const n = xs.length;
        const mx = xs.reduce((a, b) => a + b, 0) / n;
        const my = ys.reduce((a, b) => a + b, 0) / n;
        const m = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
        return 1 / (m * 1e-3);
      },
    },
  },

  claims: [
    { type: 'validRange', lastLinearRow: LIN },
    { type: 'linear', minR2: 0.999 },
    { type: 'throughOrigin', expect: true },
    { type: 'agrees', result: 'k', value: 9420, expect: true },
    { type: 'trend', direction: 'increasing' },
    // (d): fitting every point gives a k clearly below the whole accepted range of the correct k.
    { type: 'compare', result: 'kAll', than: 'k', expect: 'smaller' },
  ],

  intro: () => '<p>A student investigates how the extension $x$ of a long, thin copper wire depends on the load $F$ on it. The wire hangs '
    + 'from a beam beside a second, identical reference wire, which carries a constant small load. Masses are added to the test wire, '
    + 'and a vernier scale fixed between the two wires measures the extension of the test wire.</p>',

  parts: (d) => {
    const [kLo, kHi] = d.r.k.range;
    return [
      {
        label: 'a', marks: 2, ao: 'AO3', msFigure: 'graph-ms',
        reads: [{ figure: 'graph', x: d.rows[4].F }],
        question: 'Hooke\'s law predicts that $x$ is proportional to $F$. Use the graph to identify the range of loads for which the data are consistent with Hooke\'s law. Justify your answer.',
        markscheme: [
          `A straight line through the origin fits the points, within their uncertainty of ±0.05 mm, up to about ${d.text('F', LIN)} N (accept up to ${d.text('F', LIN + 1)} N) ✓`,
          'For larger loads the points lie above any such line by far more than their uncertainty ✓',
        ],
      },
      {
        label: 'b', marks: 2, ao: 'AO2', msFigure: 'graph-ms',
        question: 'Determine $k$, the load per unit extension, in the region where Hooke\'s law holds.',
        numeric: d.num('k'),
        markscheme: [
          'Gradient of the straight part of the graph $= \\dfrac{1}{k}$, converted to $\\text{m N}^{-1}$ ✓',
          `$k = ${d.sf(d.r.k.value, 3)}\\ \\text{N m}^{-1}$ (accept ${d.sf(kLo, 3)} to ${d.sf(kHi, 3)}) ✓`,
        ],
      },
      {
        label: 'c', marks: 2, ao: 'AO3',
        question: `Calculate the extension that Hooke's law predicts for a load of ${d.text('F', ROW)} N, using your value of $k$. Compare it with the measured extension.`,
        markscheme: [
          `$x = \\dfrac{F}{k} = ${d.sf(d.r.xHooke.value, 3)}\\ \\text{mm}$ (allow ECF from (b)) ✓`,
          `The measured value, ${d.text('x', ROW)} mm, is about ${d.sf(d.r.excess.value, 2)} mm larger, far more than its uncertainty of $\\pm 0.05\\ \\text{mm}$: the wire stretches more than Hooke's law predicts ✓`,
        ],
      },
      {
        label: 'd', marks: 2, ao: 'AO3',
        asks: { conclusion: ['would be smaller', 'is smaller than'] },
        question: 'Another student draws one line of best fit through all nine points and calculates $k$ from its gradient. Explain whether this value of $k$ would be larger or smaller than your answer to (b).',
        markscheme: [
          `The points beyond about ${d.text('F', LIN)} N lie above the straight line, so a line through all the points has a larger gradient (more extension per newton) ✓`,
          `Since $k = \\dfrac{1}{\\text{gradient}}$, this $k$ would be smaller (about ${d.sf(d.r.kAll.value, 2)} $\\text{N m}^{-1}$) ✓`,
        ],
      },
      {
        label: 'e', marks: 1, ao: 'AO3',
        question: 'Suggest why the extension is measured relative to a reference wire hanging from the same beam.',
        markscheme: ['Changes in room temperature (thermal expansion) and any sagging of the beam affect both wires equally, so they do not change the measured extension ✓'],
      },
    ];
  },
};
