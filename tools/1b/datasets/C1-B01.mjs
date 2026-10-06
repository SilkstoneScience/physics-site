// C.1 Period of a mass on a spring: curved raw data, choosing the transformation from the physics, and what the
// intercept of the transformed graph says about the "massless spring" assumption (archetypes N3 and L2).
// The T² graph is shown only with part (c), so the stem does not give away the transformation asked for in (b).

export default {
  id: 'C1-B01',
  topic: 'C.1',
  difficulty: 2,
  context: 'experimental',
  skills: ['not-linear', 'choose-transformation', 'gradient', 'intercept-meaning', 'model-assumption', 'unit-base-si'],
  seed: 61,
  batch: 'batch-1',
  archetypes: ['N3', 'L2'],
  apparatus: 'mass oscillating vertically on a spring, timed with a stopwatch',
  originality: 'Mass–spring oscillations are a standard practical; no legacy Section A or 2025 Paper 1B question uses them. Legacy '
    + 'questions on choosing what to plot use other contexts (May 2019 TZ2 Q2, May 2023 TZ1 Q2). Own numbers and sequence, including '
    + 'the use of the T² intercept to test the massless-spring assumption.',

  physics: {
    scenario: 'A mass m hangs from a spring and oscillates vertically. For each m, the student times 10 oscillations with a stopwatch and '
      + 'divides by 10 to find the period T. The spring itself has a mass of about 75 g, which also moves.',
    principles: ['Simple harmonic motion of a mass on a spring: T = 2π√(m/k) for a light spring (C.1)'],
    assumptions: [
      'The oscillations are small, so the spring obeys Hooke\'s law and the motion is simple harmonic',
      'The moving spring adds an effective mass mₑ (about one third of its own mass) to the oscillating mass',
      'Air resistance is negligible over 10 oscillations',
    ],
    derivation: [
      'With the spring\'s effective mass: T = 2π√((m + mₑ)/k)',
      'So T² = (4π²/k)m + 4π²mₑ/k: a straight line of gradient 4π²/k',
      'T² is not zero when m = 0; the line crosses the m axis at m = −mₑ',
    ],
    relationship: 'T² = (4π²/k)(m + mₑ)',
    params: {
      k: { value: 12, unit: 'N m^-1', range: [2, 50], note: 'school spring' },
      me: { value: 0.025, unit: 'kg', range: [0, 0.1], note: 'effective mass of the moving spring (about a third of its 75 g)' },
    },
  },

  columns: {
    m: { kind: 'set', name: 'mass', symbol: 'm', unit: 'kg', values: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6], resolution: 0.001 },
    T: {
      kind: 'measured', name: 'period', symbol: 'T', unit: 's',
      model: { law: 'mass-spring-period', inputs: { m: 'row.m', me: 'p.me', k: 'p.k' } },
      expect: [0.5, 1.6],
      measurement: {
        instrument: 'stopwatch, resolution 0.01 s',
        reading: 'time for 10 oscillations, divided by 10',
        noise: 'the observer\'s reaction time in starting and stopping the stopwatch, shared over 10 oscillations: normal scatter with standard deviation 0.004 s in T',
      },
      noise: { type: 'gauss', sd: 0.004 }, resolution: 0.001, uncertainty: 0.01,
    },
    T2: {
      kind: 'derived', name: 'period squared', symbol: 'T^2', symbolText: 'T²', unit: 's^2', dp: 3, show: false,
      value: (row) => row.T ** 2,
      propagation: { form: 'product', terms: [{ of: 'T', n: 2 }] },
    },
  },
  rawGraph: { x: 'm', y: 'T', zero: { x: true, y: true } },
  graph: { x: 'm', y: 'T2', fit: 'linear', band: true, zero: { x: true, y: true } },
  present: ['table', 'graph-raw'],

  results: {
    gradient: { unit: 's^2 kg^-1', dims: { of: 'y/x' }, check: 'gradient', value: (d) => d.fit.m, range: (d, v) => d.widen(d.gradientRange(), v, 0.04) },
    k: {
      unit: 'N m^-1', estimates: 'k',
      value: (d) => (4 * Math.PI ** 2) / d.r.gradient.value,
      range: (d) => d.r.gradient.range.map((g) => (4 * Math.PI ** 2) / g).sort((a, b) => a - b),
    },
    intercept: { unit: 's^2', check: 'intercept', value: (d) => d.fit.c },
    me: { unit: 'kg', estimates: 'me', value: (d) => d.fit.c / d.fit.m },
  },

  claims: [
    { type: 'notLinear', graph: 'raw' },
    { type: 'linear', minR2: 0.995 },
    { type: 'throughOrigin', expect: false },
    { type: 'agrees', result: 'k', value: 12, expect: true },
    { type: 'trend', direction: 'increasing' },
  ],

  intro: () => '<p>A student investigates how the period $T$ of a mass oscillating on a spring depends on the mass $m$. For each mass, '
    + 'the student times 10 oscillations with a stopwatch and divides by 10. The uncertainty in each value of $T$ is shown in the table. '
    + 'The graph shows $T$ against $m$.</p>',

  parts: (d) => {
    const [kLo, kHi] = d.r.k.range;
    return [
      {
        label: 'a', marks: 2, ao: 'AO3',
        question: 'Explain how the graph of $T$ against $m$ shows that $T$ is not proportional to $m$.',
        markscheme: [
          'No straight line can be drawn through all the error bars: the points lie on a curve ✓',
          'The gradient decreases as $m$ increases (equal increases in $m$ give smaller increases in $T$) ✓',
        ],
      },
      {
        label: 'b', marks: 2, ao: 'AO2',
        question: 'For a spring of negligible mass, $T = 2\\pi\\sqrt{\\dfrac{m}{k}}$, where $k$ is the spring constant. State the quantity that should be plotted against $m$ to give a straight line, and the gradient that line is expected to have.',
        markscheme: ['$T^2$ ✓', 'Gradient $= \\dfrac{4\\pi^2}{k}$ ✓'],
      },
      {
        label: 'c', marks: 1, ao: 'AO2', asks: { unit: 'gradient' },
        question: 'State the unit of the gradient of a graph of $T^2$ against $m$, in SI base units.',
        markscheme: [`${d.baseUnitTex('gradient')} ✓`],
      },
      {
        label: 'd', marks: 2, ao: 'AO2', figure: 'graph', msFigure: 'graph-ms',
        question: 'The student plots a graph of $T^2$ against $m$, shown below. Determine $k$.',
        numeric: d.num('k'),
        markscheme: [
          `Gradient of the line of best fit $= ${d.sf(d.r.gradient.value, 3)}\\ \\text{s}^2\\,\\text{kg}^{-1}$ ✓`,
          `$k = \\dfrac{4\\pi^2}{\\text{gradient}} = ${d.sf(d.r.k.value, 3)}\\ \\text{N m}^{-1}$ (accept ${d.sf(kLo, 3)} to ${d.sf(kHi, 3)}) ✓`,
        ],
      },
      {
        label: 'e', marks: 2, ao: 'AO3', msFigure: 'graph-ms',
        question: 'The line of best fit on the graph of $T^2$ against $m$ does not pass through the origin. Explain what this suggests about the assumption that the spring has negligible mass.',
        markscheme: [
          '$T^2$ is not zero when $m = 0$: something else is oscillating, the spring itself, so its mass is not negligible ✓',
          `The intercept on the $T^2$ axis is about ${d.sf(d.r.intercept.value, 2)} $\\text{s}^2$; extended, the line would cross the $m$ axis at $m = -\\dfrac{\\text{intercept}}{\\text{gradient}} \\approx ${d.sf(-d.r.me.value, 2)}\\ \\text{kg}$: the spring behaves like an extra mass of about ${d.sf(d.r.me.value, 2)} kg added to $m$ ✓`,
        ],
      },
    ];
  },
};
