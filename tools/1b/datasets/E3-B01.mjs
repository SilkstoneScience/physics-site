// E.3 Half-life with a background correction. Counts are random (Poisson), so the
// uncertainty in a count N is √N. SL content only: half-life read from a graph, no decay constant.
// Skills: background correction, completing a table, reading a half-life from a curve, random uncertainty.

export default {
  id: 'E3-B01',
  topic: 'E.3',
  difficulty: 2,
  context: 'experimental',
  skills: ['background-correction', 'complete-table', 'read-graph', 'half-life', 'random-uncertainty'],
  seed: 32,

  // ----- 1. Physics model -----
  // R0: count rate from the source at t = 0 (s⁻¹); bg: background count rate (s⁻¹); T: half-life (s).
  params: { R0: 48, bg: 0.4, T: 75 },

  // ----- 2. Measurements -----
  singles: {
    Nb: { model: (p) => p.bg * 300, noise: { type: 'poisson' }, resolution: 1 }, // background counts in 300 s
  },
  columns: {
    t: { kind: 'set', name: 'time', symbol: 't', unit: 's', values: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300], resolution: 1, uncertainty: null },
    N: {
      kind: 'measured', name: 'counts in 10 s', symbol: 'N', unit: '',
      model: (row, p) => (p.R0 * 2 ** (-row.t / p.T) + p.bg) * 10,
      noise: { type: 'poisson' }, resolution: 1, uncertainty: null,
    },
    R: {
      kind: 'derived', name: 'corrected count rate', symbol: 'R', unit: 's^-1', dp: 1,
      value: (row, p, s) => (row.N - s.Nb / 30) / 10,
      uncertainty: (row) => Math.sqrt(row.N) / 10,
      hide: [7],
    },
  },
  graph: { x: 't', y: 'R', fit: 'exponential', zero: { x: true, y: true }, omit: [7] },

  // ----- 3. Results -----
  results: {
    halfLife: {
      unit: 's', dims: { of: 'x' }, check: 'halfLife',
      value: (d) => d.fit.halfLife,
      range: (d, v) => d.widen(null, v, 0.12),
    },
    Rmissing: { unit: 's^-1', value: (d) => (d.rows[7].N - d.singles.Nb / 30) / 10 },
  },

  // ----- 4. Claims -----
  claims: [
    { type: 'trend', direction: 'decreasing' },
    { type: 'agrees', result: 'halfLife', value: 75, expect: true },
  ],

  // ----- 5. Presentation -----
  intro: (d) => '<p>A student measures the count rate from a short-lived radioactive source with a Geiger–Müller tube and a counter. '
    + 'Starting at $t = 0$, the student records the number of counts $N$ in a 10 s interval every 30 s.</p>'
    + `<p>With the source removed, the counter recorded ${d.singles.Nb} counts in 300 s. `
    + 'The corrected count rate $R$ is the count rate due to the source alone. One value of $R$ has been left for you to calculate.</p>',

  parts: (d) => {
    const [tLo, tHi] = d.r.halfLife.range;
    const bg10 = d.singles.Nb / 30;
    return [
      {
        label: 'a', marks: 1,
        question: 'Outline why the student measured the background count.',
        markscheme: ['The counter also detects background radiation, which must be subtracted to find the count rate due to the source alone ✓'],
      },
      {
        label: 'b', marks: 2,
        question: `Calculate the corrected count rate $R$ at $t = ${d.text('t', 7)}\\ \\text{s}$.`,
        numeric: d.num('Rmissing', {
          mistakes: [{ value: d.rows[7].N / 10, feedback: 'Remember to subtract the background count first.' }],
        }),
        markscheme: [
          `Background counts in 10 s $= \\dfrac{${d.singles.Nb}}{30} = ${d.dp(bg10, 1)}$ ✓`,
          `$R = \\dfrac{${d.text('N', 7)} - ${d.dp(bg10, 1)}}{10} = ${d.sf(d.r.Rmissing.value, 3)}\\ \\text{s}^{-1}$ ✓`,
        ],
      },
      {
        label: 'c', marks: 2, msFigure: 'graph-ms',
        question: 'Use the graph to determine the half-life of the source.',
        numeric: d.num('halfLife'),
        markscheme: [
          'Draws a smooth curve of best fit and reads the time for $R$ to halve (from any starting value) ✓',
          `Half-life $= ${d.sf(d.r.halfLife.value, 2)}\\ \\text{s}$ (accept ${d.sf(tLo, 2)} to ${d.sf(tHi, 2)}) ✓`,
        ],
      },
      {
        label: 'd', marks: 2,
        question: 'Explain why the percentage uncertainty in $R$ increases as $t$ increases.',
        markscheme: [
          'Decay is random, so the uncertainty in a count $N$ is about $\\sqrt{N}$ ✓',
          'The fractional uncertainty $\\dfrac{\\sqrt{N}}{N} = \\dfrac{1}{\\sqrt{N}}$ increases as $N$ falls ✓',
        ],
      },
      {
        label: 'e', marks: 1,
        question: 'Suggest one change to the method that would reduce the uncertainty in the later values of $R$.',
        markscheme: ['Count for a longer interval (or repeat the experiment and average), so more counts are recorded ✓'],
      },
    ];
  },
};
