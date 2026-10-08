// B.3 Pressure of a fixed volume of air against Celsius temperature, extrapolated to estimate absolute zero
// (archetypes L2, G3 and V3).
// Skills: testing proportionality from the table, extrapolating a line to an intercept, why the extrapolated value is
// uncertain, judging agreement with the accepted value from the range given by the max/min lines (stated in (d), because
// the ±0.5 kPa uncertainty is too small to draw on this extended axis: Phase 12), predicting at an unmeasured temperature.

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
    theta: { kind: 'set', name: 'temperature', symbol: '\\theta', symbolText: 'θ', unit: '°C', values: [12.0, 23.5, 37.0, 51.5, 64.0, 78.5], resolution: 0.5, uncertainty: 0.5 },
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
  // errorBars 'too-small': ±0.5 kPa is about 1 unit on this extended axis, so no bars are drawn and the caption states it (P1).
  // xErrorBars keeps the ±0.5 °C temperature uncertainty in the max/min lines (it is real and moves the intercept range from
  // −277…−262 °C to −285…−255 °C); nothing is drawn for it (Phase 12: y error bars only are drawn).
  graph: { x: 'theta', y: 'p', fit: 'linear', band: true, xErrorBars: true, zero: { y: true }, xRange: [-300, 100], errorBars: 'too-small' },

  results: {
    gradient: { unit: 'kPa Δ°C^-1', dims: { of: 'y/x' }, check: 'gradient', value: (d) => d.fit.m },
    intercept: { unit: 'kPa', check: 'intercept', value: (d) => d.fit.c },
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
    pred: {
      unit: 'kPa', predictAt: { column: 'theta', value: T_PREDICT },
      value: (d) => d.fit.m * T_PREDICT + d.fit.c,
      range: (d, v) => d.widen([d.band.steep, d.band.shallow].map((L) => L.m * T_PREDICT + L.c).sort((a, b) => a - b), v, 0.005),
    },
    ratioLow: { unit: 'kPa Δ°C^-1', value: (d) => d.rows[0].p / d.rows[0].theta },
    ratioHigh: { unit: 'kPa Δ°C^-1', value: (d) => d.rows[5].p / d.rows[5].theta },
  },

  claims: [
    { type: 'linear', minR2: 0.995 },
    { type: 'throughOrigin', expect: false },
    { type: 'verdict', result: 'absZero', value: -273, expect: 'inside' },
    { type: 'trend', direction: 'increasing' },
  ],

  stated: {
    accepted: { value: -273, dp: 0, unit: '°C', source: 'data booklet: T/K = θ/°C + 273, so absolute zero is −273 °C' },
  },

  intro: () => '<p>A student investigates how the pressure $p$ of a fixed mass of air at constant volume depends on its temperature $\\theta$. '
    + 'A sealed flask of air is held in a water bath and connected by a short tube to a Bourdon pressure gauge. The bath is heated in steps, '
    + 'and at each step the student waits until the reading is steady.</p>',

  parts: (d) => {
    const [aLo, aHi] = d.r.absZero.range;
    const [pLo, pHi] = d.r.pred.range;
    return [
      {
        label: 'a', marks: 2, ao: 'AO3',
        question: 'Show, using two rows of the table, that $p$ is not proportional to $\\theta$.',
        markscheme: [
          `$\\dfrac{p}{\\theta}$ is ${d.sf(d.r.ratioLow.value, 3)} $\\text{kPa}\\,{}^{\\circ}\\text{C}^{-1}$ at ${d.text('theta', 0)} °C but ${d.sf(d.r.ratioHigh.value, 3)} $\\text{kPa}\\,{}^{\\circ}\\text{C}^{-1}$ at ${d.text('theta', 5)} °C (or any two non-adjacent rows) ✓`,
          'The ratio is not constant, so $p$ is not proportional to $\\theta$ (equivalently: increasing $\\theta$ by a factor does not increase $p$ by the same factor) ✓',
        ],
      },
      {
        label: 'b', marks: 3, ao: { AO2: 2, AO3: 1 }, msFigure: 'graph-ms',
        reads: [{ figure: 'graph', x: d.r.absZero.value, y: 0 }],
        question: 'Draw the line of best fit and extend it to $p = 0$. Hence determine the temperature at which the pressure of the air would be zero, according to these data.',
        numeric: d.num('absZeroAnswer'),
        markscheme: [
          'Line of best fit drawn through the points and extended to the $\\theta$ axis ✓',
          'Reads the intercept, or calculates it from the gradient and the intercept on the $p$ axis ✓',
          `About ${d.int(d.r.absZero.value)} °C (accept ${d.int(d.r.absZeroAnswer.range[0])} to ${d.int(d.r.absZeroAnswer.range[1])} °C) ✓`,
        ],
      },
      {
        label: 'c', marks: 2, ao: 'AO3', msFigure: 'graph-ms',
        question: 'Explain why the uncertainty in your answer to (b) is much larger than the uncertainty in each temperature reading.',
        markscheme: [
          `The line is extended a long way beyond the data (from ${d.text('theta', 0)} °C to about ${d.int(d.r.absZero.value)} °C) ✓`,
          'A small change of gradient, still consistent with the uncertainty in $p$, moves the intercept a long way (by tens of degrees) ✓',
        ],
      },
      {
        label: 'd', marks: 1, ao: 'AO3',
        asks: { conclusion: ['is consistent', 'lies within'] },
        question: `The steepest and shallowest straight lines that fit the data within their uncertainties meet the $\\theta$ axis at ${d.int(aLo)} °C and ${d.int(aHi)} °C. Comment on whether the result is consistent with the accepted value of absolute zero, $${d.stated('accepted')}\\ {}^{\\circ}\\text{C}$.`,
        markscheme: [`${d.stated('accepted')} °C lies within the range ${d.int(aLo)} °C to ${d.int(aHi)} °C, so the result is consistent with it ✓`],
      },
      {
        label: 'e', marks: 2, ao: 'AO2', msFigure: 'graph-ms',
        reads: [{ figure: 'graph', x: T_PREDICT, y: d.r.pred.value }],
        question: 'The flask is then placed in boiling water at 100 °C. Predict the reading of the pressure gauge.',
        numeric: d.num('pred'),
        markscheme: [
          'Extends the line to 100 °C, or uses $p = (\\text{gradient})\\,\\theta + (\\text{intercept})$ ✓',
          `$p = ${d.sf(d.r.pred.value, 3)}\\ \\text{kPa}$ (accept ${d.sf(pLo, 3)} to ${d.sf(pHi, 3)}) ✓`,
        ],
      },
    ];
  },
};
