// E.3 Half-life with a background correction. Counts are random (Poisson), so the
// uncertainty in a count N is √N. SL content only: half-life read from a graph, no decay constant.
// Skills: background correction, completing a table, reading a half-life from a curve, random uncertainty.
//
// Measurement model (fixed after the October 2026 audit): each count N is the number recorded in the
// 10 s interval STARTING at time t, so it is the count rate added up over that interval
// (law "counts-in-interval"), not the rate at the instant t multiplied by 10 s.

export default {
  id: 'E3-B01',
  topic: 'E.3',
  difficulty: 2,
  context: 'experimental',
  skills: ['background-correction', 'complete-table', 'read-graph', 'half-life', 'random-uncertainty'],
  seed: 32,

  // ----- 1. Physics model -----
  physics: {
    scenario: 'A Geiger–Müller tube and counter record the counts from a short-lived radioactive source in a 10 s interval '
      + 'starting at t = 0, 30 s, 60 s, … . The background count is measured separately, with the source removed, for 300 s.',
    principles: [
      'Radioactive decay: the count rate from the source halves every half-life, R = R₀ 2^(−t/T½) (E.3)',
      'The number of counts in an interval is the count rate added up over that interval',
      'Decay is random: a count N has an uncertainty of about √N (Poisson statistics)',
      'Background radiation adds a constant count rate',
    ],
    assumptions: [
      'The source contains a single radioactive isotope with no radioactive daughter',
      'The detector efficiency is constant, and dead time is negligible below about 60 counts per second',
      'The background count rate is constant',
      'The corrected count rate R is the mean rate during each interval and is plotted at the interval\'s start time t. '
        + 'This places every point 5 s earlier than its mid-interval time, which shifts the curve but does not change the half-life',
    ],
    derivation: [
      'Counts from the source in the interval t to t + Δt: (R₀T½/ln 2)(2^(−t/T½) − 2^(−(t+Δt)/T½)); background adds bΔt',
      'Corrected mean rate: R = (N − bΔt)/Δt = R₀ × [T½(1 − 2^(−Δt/T½)) / (Δt ln 2)] × 2^(−t/T½)',
      'The bracket is a constant (0.955 for Δt = 10 s, T½ = 75 s), so R still halves every T½: the half-life read from the graph is T½',
    ],
    relationship: 'R = 0.955 R₀ 2^(−t/T½), so R halves every T½',
    params: {
      R0: { value: 48, unit: 's^-1', range: [5, 500], note: 'count rate from the source at t = 0' },
      T: { value: 75, unit: 's', range: [10, 600], note: 'half-life of a short-lived school source (protactinium-234m: 70 s)' },
      bg: { value: 0.4, unit: 's^-1', range: [0.1, 1.5], note: 'typical background for a Geiger–Müller tube' },
      dt: { value: 10, unit: 's', range: [5, 60], note: 'counting interval' },
      tb: { value: 300, unit: 's', range: [60, 1800], note: 'time for the background measurement' },
    },
  },

  // ----- 2. Measurements -----
  singles: {
    Nb: {
      unit: '', resolution: 1, noise: { type: 'poisson' },
      model: { law: 'uniform-counts', inputs: { rate: 'p.bg', dt: 'p.tb' } },
      expect: [60, 200],
      measurement: {
        instrument: 'Geiger–Müller tube and counter, source removed',
        reading: 'counts recorded in 300 s',
        noise: 'radioactive decay and background radiation are random: Poisson counting statistics',
      },
    },
  },
  columns: {
    t: { kind: 'set', name: 'time', symbol: 't', unit: 's', values: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300], resolution: 1, uncertainty: null },
    N: {
      kind: 'measured', name: 'counts in 10 s', symbol: 'N', unit: '', resolution: 1, uncertainty: null, noise: { type: 'poisson' },
      model: { law: 'counts-in-interval', inputs: { R0: 'p.R0', T: 'p.T', b: 'p.bg', t: 'row.t', dt: 'p.dt' } },
      expect: [20, 600],
      measurement: {
        instrument: 'Geiger–Müller tube and counter',
        reading: 'counts recorded in the 10 s interval starting at time t',
        noise: 'radioactive decay is random: Poisson counting statistics, standard deviation √N',
      },
    },
    R: {
      kind: 'derived', name: 'corrected count rate', symbol: 'R', unit: 's^-1', dp: 1,
      value: (row, p, s) => (row.N - (s.Nb * p.dt) / p.tb) / p.dt,
      uncertainty: (row, p) => Math.sqrt(row.N) / p.dt,
      hide: [7],
    },
  },
  graph: { x: 't', y: 'R', fit: 'exponential', zero: { x: true, y: true }, omit: [7] },

  // ----- 3. Results -----
  results: {
    halfLife: {
      unit: 's', dims: { of: 'x' }, check: 'halfLife', estimates: 'T',
      value: (d) => d.fit.halfLife,
      range: (d, v) => d.widen(null, v, 0.12),
    },
    Rmissing: { unit: 's^-1', value: (d) => (d.rows[7].N - (d.singles.Nb * d.p.dt) / d.p.tb) / d.p.dt },
  },

  // ----- 4. Claims -----
  claims: [
    { type: 'trend', direction: 'decreasing' },
    { type: 'agrees', result: 'halfLife', value: 75, expect: true },
  ],

  // ----- 5. Presentation -----
  intro: (d) => '<p>A student measures the count rate from a short-lived radioactive source with a Geiger–Müller tube and a counter. '
    + `Every 30 s, starting at $t = 0$, the student records the number of counts $N$ in the ${d.p.dt} s interval that begins at time $t$.</p>`
    + `<p>With the source removed, the counter recorded ${d.singles.Nb} counts in ${d.p.tb} s. `
    + 'The corrected count rate $R$ is the mean count rate due to the source alone during each interval. One value of $R$ has been left for you to calculate.</p>',

  parts: (d) => {
    const [tLo, tHi] = d.r.halfLife.range;
    const bgCounts = (d.singles.Nb * d.p.dt) / d.p.tb;
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
          mistakes: [{ value: d.rows[7].N / d.p.dt, feedback: 'Remember to subtract the background count first.' }],
        }),
        markscheme: [
          `Background counts in ${d.p.dt} s $= \\dfrac{${d.singles.Nb}}{${d.p.tb / d.p.dt}} = ${d.dp(bgCounts, 1)}$ ✓`,
          `$R = \\dfrac{${d.text('N', 7)} - ${d.dp(bgCounts, 1)}}{${d.p.dt}} = ${d.sf(d.r.Rmissing.value, 3)}\\ \\text{s}^{-1}$ ✓`,
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
