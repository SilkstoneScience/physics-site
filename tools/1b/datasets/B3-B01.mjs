// B.3 Pressure of a fixed volume of air against Celsius temperature, extrapolated to estimate absolute zero
// (archetypes L2, G3 and V3).
// Skills: testing proportionality from the table, the gradient and intercept of a line of best fit, extrapolating
// algebraically to absolute zero, its uncertainty from the steepest and shallowest lines, percentage difference from the
// accepted value, predicting at an unmeasured temperature. Temperature is T (in °C), as the IB writes it (teacher, 8 Oct 2026).

const T_PREDICT = 100; // boiling water

// x-intercept (p = 0) of a line y = mx + c
const xAt0 = (L) => -L.c / L.m;

export default {
  id: 'B3-B01',
  topic: 'B.3',
  difficulty: 2,
  context: 'experimental',
  skills: ['proportionality-from-table', 'extrapolation', 'intercept-meaning', 'intercept-uncertainty', 'accepted-value', 'prediction'],
  seed: 51,
  batch: 'batch-1',
  archetypes: ['L2', 'G3', 'V3'],
  apparatus: 'flask of air in a water bath with a Bourdon pressure gauge',
  contextFamily: 'gas-pressure',
  contextObjects: ['pressure-gauge', 'water-bath'],
  originality: 'The constant-volume gas experiment is a standard practical. Nov 2016 Paper 3 Q2 used a pressure–temperature graph in '
    + 'kelvin to ask about units and the expected shape for a second gas; this dataset instead uses Celsius data, a table ratio test, '
    + 'an extrapolation to absolute zero with its uncertainty from the max/min lines, and a prediction. Own numbers and sequence.',

  physics: {
    scenario: 'A flask of air, sealed and connected by a short tube to a Bourdon pressure gauge, is held in a water bath. The bath is '
      + 'heated in steps; at each step the student waits for the air to reach the bath temperature, then records θ and the pressure p.',
    principles: ['Pressure law: for a fixed mass of ideal gas at constant volume, p ∝ T, with T the absolute temperature (B.3)', 'T/K = θ/°C + 273'],
    assumptions: [
      'The air behaves as an ideal gas over this range',
      'The volume of the flask is constant (its expansion is negligible) and no air leaks',
      'All the air is at the bath temperature (the connecting tube holds a negligible volume)',
    ],
    derivation: [
      'p = p₀T/T₀ with T = θ + 273.15, so p = (p₀/T₀)θ + 273.15 p₀/T₀',
      'p against θ is a straight line that reaches p = 0 at θ = −273.15 °C (absolute zero)',
    ],
    relationship: 'p = (p₀/T₀)(θ + 273.15)',
    params: {
      p0: { value: 100, unit: 'kPa', range: [90, 110], note: 'pressure when the flask was sealed' },
      T0: { value: 293.15, unit: 'K', range: [288, 298], note: 'temperature when the flask was sealed (20 °C)' },
      thetaAbs: { value: -273.15, unit: '°C', range: [-273.15, -273.15], note: 'absolute zero: the temperature at which the model pressure is zero (checked, not an input)' },
    },
  },

  columns: {
    theta: { kind: 'set', name: 'temperature', symbol: 'T', symbolText: 'T', unit: '°C', values: [12.0, 23.5, 37.0, 51.5, 64.0, 78.5], resolution: 0.5, uncertainty: 0.5 },
    p: {
      kind: 'measured', name: 'pressure', symbol: 'p', unit: 'kPa',
      model: { law: 'pressure-law', inputs: { p0: 'p.p0', T0: 'p.T0', T: 'row.theta' } },
      expect: [90, 130],
      measurement: {
        instrument: 'Bourdon pressure gauge, smallest division 1 kPa, read to the nearest 0.5 kPa (uncertainty ±0.5 kPa)',
        reading: 'reading once the pointer is steady, several minutes after the bath reaches each temperature',
        noise: 'judging the pointer between divisions and small differences between the air and bath temperatures: normal scatter with standard deviation 0.2 kPa',
      },
      noise: { type: 'gauss', sd: 0.2 }, resolution: 0.5, uncertainty: 0.5,
    },
  },
  // Graph zoomed to 0–100 °C (teacher, 8 October 2026), so the ±0.5 kPa error bars are visible and students draw the best,
  // steepest and shallowest lines through them; absolute zero is then found by algebraic extrapolation (T = −c/m).
  // y error bars only; the plot is taller (height 480) so each bar clears its marker.
  graph: { x: 'theta', y: 'p', fit: 'linear', band: true, zero: { x: true }, xRange: [0, 100], yRange: [90, 130], height: 480 },

  results: {
    gradient: { unit: 'kPa Δ°C^-1', dims: { of: 'y/x' }, check: 'gradient', value: (d) => d.fit.m, range: (d, v) => d.widen(d.gradientRange(), v, 0.04) },
    intercept: { unit: 'kPa', check: 'intercept', value: (d) => d.fit.c, range: (d, v) => d.widen(d.interceptRange(), v, 0.005) },
    absZero: {
      unit: '°C', estimates: 'thetaAbs', basis: 'lines',
      value: (d) => xAt0(d.fit),
      range: (d) => [xAt0(d.band.steep), xAt0(d.band.shallow)].sort((a, b) => a - b),
    },
    absZeroAnswer: {
      unit: '°C',
      value: (d) => d.r.absZero.value,
      range: (d, v) => d.widen(d.r.absZero.range, v, 0.03),
    },
    // Absolute uncertainty in absolute zero: half the spread of the steepest and shallowest lines' intercepts.
    dAbsZero: { unit: 'Δ°C', value: (d) => (d.r.absZero.range[1] - d.r.absZero.range[0]) / 2 },
    pctUnc: { unit: '%', value: (d) => (100 * d.r.dAbsZero.value) / Math.abs(d.r.absZero.value) },
    pctDiff: { unit: '%', value: (d) => (100 * Math.abs(d.r.absZero.value - d.p.thetaAbs)) / Math.abs(d.p.thetaAbs) },
    pred: {
      unit: 'kPa', predictAt: { column: 'theta', value: T_PREDICT },
      value: (d) => d.fit.m * T_PREDICT + d.fit.c,
      range: (d, v) => d.widen([d.band.steep, d.band.shallow].map((L) => L.m * T_PREDICT + L.c).sort((a, b) => a - b), v, 0.005),
    },
    ratioLow: { unit: 'kPa Δ°C^-1', value: (d) => d.rows[0].p / d.rows[0].theta },
    ratioHigh: { unit: 'kPa Δ°C^-1', value: (d) => d.rows[5].p / d.rows[5].theta },
  },

  // Part (e) has no verdict claim: with y error bars only, −273 °C lies about 1.5 % inside the steepest/shallowest-line
  // range (the verdict rule needs 4 %), so students' own lines could give either conclusion. Teacher's decision
  // (8 October 2026): keep (e) and credit a conclusion consistent with the candidate's own uncertainty. The review flag
  // records this and keeps the dataset AMBER, so it is always inspected rather than batch-approved unseen.
  claims: [
    { type: 'linear', minR2: 0.995 },
    { type: 'throughOrigin', expect: false },
    { type: 'trend', direction: 'increasing' },
  ],
  reviewFlags: [{ flag: 'verdict-borderline', note: 'part (e): −273 °C is only about 1.5 % inside the max/min-line range; teacher decided (8 October 2026) to credit a conclusion consistent with the candidate\'s own uncertainty' }],

  stated: {
    accepted: { value: -273, dp: 0, unit: '°C', source: 'data booklet: absolute zero is 0 K = −273 °C' },
  },

  intro: () => '<p>A student investigates how the pressure $p$ of a fixed mass of air at constant volume depends on its temperature $T$. '
    + 'A sealed flask of air is held in a water bath and connected by a short tube to a Bourdon pressure gauge. The bath is heated in steps, '
    + 'and at each step the student waits until the reading is steady.</p>',

  parts: (d) => {
    const [aLo, aHi] = d.r.absZero.range;
    const [gLo, gHi] = d.r.gradient.range;
    const [cLo, cHi] = d.r.intercept.range;
    const [pLo, pHi] = d.r.pred.range;
    return [
      {
        label: 'a', marks: 2, ao: 'AO3',
        question: 'Show, using two rows of the table, that $p$ is not proportional to $T$.',
        markscheme: [
          `$\\dfrac{p}{T}$ is ${d.sf(d.r.ratioLow.value, 3)} $\\text{kPa}\\,{}^{\\circ}\\text{C}^{-1}$ at ${d.text('theta', 0)} °C but ${d.sf(d.r.ratioHigh.value, 3)} $\\text{kPa}\\,{}^{\\circ}\\text{C}^{-1}$ at ${d.text('theta', 5)} °C (or any two non-adjacent rows) ✓`,
          'The ratio is not constant, so $p$ is not proportional to $T$ ✓',
        ],
      },
      {
        label: 'b', marks: 2, ao: 'AO2', msFigure: 'graph-ms',
        reads: [{ figure: 'graph', x: 0, y: d.r.intercept.value }],
        question: 'Draw the line of best fit on the graph. Determine its gradient and its intercept on the $p$ axis.',
        markscheme: [
          `Gradient $= ${d.sf(d.r.gradient.value, 2)}\\ \\text{kPa}\\,{}^{\\circ}\\text{C}^{-1}$ (accept ${d.sf(gLo, 2)} to ${d.sf(gHi, 2)}) ✓`,
          `Intercept $= ${d.sf(d.r.intercept.value, 3)}\\ \\text{kPa}$ (accept ${d.sf(cLo, 3)} to ${d.sf(cHi, 3)}) ✓`,
        ],
      },
      {
        label: 'c', marks: 2, ao: 'AO2',
        question: 'Hence determine the temperature at which the pressure of the air would be zero, according to these data.',
        numeric: d.num('absZeroAnswer'),
        markscheme: [
          'At $p = 0$: $T = -\\dfrac{\\text{intercept}}{\\text{gradient}}$ (extrapolating the line) ✓',
          `$T = ${d.int(d.r.absZero.value)}\\ {}^{\\circ}\\text{C}$ (accept ${d.int(d.r.absZeroAnswer.range[0])} to ${d.int(d.r.absZeroAnswer.range[1])}; allow ECF from (b)) ✓`,
        ],
      },
      {
        label: 'd', marks: 3, ao: { AO2: 2, AO3: 1 }, msFigure: 'graph-ms',
        question: 'Draw the steepest and shallowest straight lines that pass through all the error bars. Use them to determine the absolute uncertainty in your answer to (c).',
        markscheme: [
          'Steepest and shallowest lines drawn through all the error bars ✓',
          `Their temperatures at $p = 0$, found in the same way, are about ${d.int(aLo)} °C and ${d.int(aHi)} °C ✓`,
          `Uncertainty $= \\dfrac{\\text{difference}}{2} \\approx ${d.int(d.r.dAbsZero.value)}\\ {}^{\\circ}\\text{C}$ (allow values from the candidate's own lines) ✓`,
        ],
      },
      {
        label: 'e', marks: 2, ao: 'AO3',
        asks: { conclusion: ['is consistent', 'consistent with the accepted'] },
        question: `The accepted value of absolute zero is $${d.stated('accepted')}\\ {}^{\\circ}\\text{C}$. Calculate the percentage difference between your answer to (c) and this value. Hence discuss whether your result is consistent with the accepted value.`,
        markscheme: [
          `Percentage difference $= \\dfrac{|${d.int(d.r.absZero.value)} - (${d.stated('accepted')})|}{${d.int(Math.abs(d.p.thetaAbs))}} \\times 100 \\approx ${d.sf(d.r.pctDiff.value, 1)}\\,\\%$ ✓`,
          `This is smaller than the percentage uncertainty from (d) (about ${d.sf(d.r.pctUnc.value, 1)} %), so the result is consistent with the accepted value (award for a conclusion consistent with the candidate's own uncertainty) ✓`,
        ],
      },
      {
        label: 'f', marks: 1, ao: 'AO2', msFigure: 'graph-ms',
        reads: [{ figure: 'graph', x: T_PREDICT, y: d.r.pred.value }],
        question: 'The flask is then placed in boiling water at 100 °C. Use your line of best fit to predict the reading of the pressure gauge.',
        numeric: d.num('pred'),
        markscheme: [`$p = ${d.sf(d.r.pred.value, 3)}\\ \\text{kPa}$ (accept ${d.sf(pLo, 3)} to ${d.sf(pHi, 3)}) ✓`],
      },
    ];
  },
};
