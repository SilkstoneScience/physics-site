// B.1 Specific heat capacity of an aluminium block: a single result with its uncertainty (archetype M2, sequence S2).
// Skills: temperature change and its uncertainty, propagation, identifying the largest uncertainty, value ± uncertainty
// to an appropriate number of significant figures, a specific improvement.

// Readings stated in the question, with the uncertainties of the instruments.
const V = 12.0;
const DV = 0.1;   // voltmeter, smallest division 0.1 V
const I = 4.2;
const DI = 0.05;  // ammeter, ±0.05 A
const M = 1.0;
const DM = 0.001; // balance, ±1 g
const DT_TIME = 1; // stopwatch timing, ±1 s
const LAST = 5;    // the row at t = 600 s

const total = (d) => {
  const t = d.rows[LAST].t;
  const dT = d.rows[LAST].theta - d.rows[0].theta;
  return { t, dT, pct: { V: (DV / V) * 100, I: (DI / I) * 100, t: (DT_TIME / t) * 100, m: (DM / M) * 100, dT: (2 * 0.5 / dT) * 100 } };
};

export default {
  id: 'B1-B01',
  topic: 'B.1',
  difficulty: 1,
  context: 'experimental',
  skills: ['temperature-change', 'uncertainty-of-a-difference', 'propagation', 'largest-uncertainty', 'value-and-uncertainty', 'improvement'],
  seed: 21,
  batch: 'batch-1',
  archetypes: ['M2'],
  apparatus: 'aluminium block with an electric heater and a thermometer',
  contextFamily: 'electrical-heating',
  contextObjects: ['electric-heater', 'thermometer'],
  originality: 'Electrical determination of a specific heat capacity is a standard practical. Closest IB item: May 2024 TZ1 Paper 3 '
    + 'Section A Q2 (specific heat capacity of WATER from three given readings, absolute uncertainty, significant figures, a systematic '
    + 'error). This dataset differs: an insulated aluminium block, a time series of temperatures from which students take ΔT and its '
    + 'uncertainty, a comparison of percentage uncertainties to find the dominant one, and an improvement; no systematic-error part; '
    + 'own numbers and wording.',

  // ----- 1. Physics model -----
  physics: {
    scenario: 'An electric heater in a hole in an insulated aluminium block of mass m is supplied at constant p.d. V and current I. '
      + 'A thermometer in a second, oil-filled hole reads the temperature θ every 120 s for 600 s.',
    principles: [
      'Electrical energy transferred: E = VIt (B.5)',
      'Energy needed to raise the temperature of a body: Q = mcΔT (B.1)',
    ],
    assumptions: [
      'All the energy from the heater stays in the block (well insulated, small temperature rise above the room): no losses',
      'The heater, the thermometer and the oil have negligible heat capacity compared with the block',
      'The block is at a uniform temperature when each reading is taken',
      'V and I stay constant during the heating',
    ],
    derivation: [
      'Energy from the heater after time t: E = VIt',
      'With no losses, E = mc(θ − θ₀), so θ = θ₀ + VIt/(mc): θ rises linearly with t',
      'Over the whole heating time t: c = VIt/(mΔT)',
    ],
    relationship: 'θ = θ₀ + VIt/(mc); c = VIt/(mΔT)',
    params: {
      V: { value: V, unit: 'V', range: [6, 15], note: 'low-voltage supply for a 50 W block heater' },
      I: { value: I, unit: 'A', range: [1, 6], note: 'heater current' },
      m: { value: M, unit: 'kg', range: [0.5, 2], note: 'standard 1 kg aluminium block' },
      c: { value: 900, unit: 'J kg^-1 ΔK^-1', range: [850, 950], note: 'aluminium' },
      theta0: { value: 20, unit: '°C', range: [15, 25], note: 'room temperature' },
    },
  },

  // ----- 2. Measurements -----
  columns: {
    t: { kind: 'set', name: 'time', symbol: 't', unit: 's', values: [0, 120, 240, 360, 480, 600], resolution: 1, uncertainty: 1 },
    theta: {
      kind: 'measured', name: 'temperature', symbol: '\\theta', symbolText: 'θ', unit: '°C',
      model: {
        law: 'temperature-after-heating',
        inputs: { theta0: 'p.theta0', E: { law: 'electrical-energy', inputs: { V: 'p.V', I: 'p.I', t: 'row.t' } }, m: 'p.m', c: 'p.c' },
      },
      expect: [15, 60],
      measurement: {
        instrument: 'liquid-in-glass thermometer, smallest division 0.5 °C, in an oil-filled hole in the block',
        reading: 'temperature read to the nearest 0.5 °C at each time',
        noise: 'the thermometer lags slightly behind the block and the reading is judged between divisions: normal scatter with standard deviation 0.15 °C',
      },
      noise: { type: 'gauss', sd: 0.15 }, resolution: 0.5, uncertainty: 0.5,
    },
  },
  present: ['table'],

  // ----- 3. Results -----
  results: {
    dT: { unit: 'Δ°C', value: (d) => total(d).dT },
    dTunc: { unit: 'Δ°C', value: () => 2 * 0.5 },
    E: { unit: 'J', value: (d) => V * I * total(d).t },
    c: { unit: 'J kg^-1 ΔK^-1', estimates: 'c', value: (d) => (V * I * total(d).t) / (M * total(d).dT) },
    pctTotal: { unit: '%', value: (d) => Object.values(total(d).pct).reduce((a, b) => a + b, 0) },
    dc: { unit: 'J kg^-1 ΔK^-1', value: (d) => (d.r.c.value * d.r.pctTotal.value) / 100 },
  },

  stated: {
    V: { value: V, dp: 1, unit: 'V', source: 'supply p.d. (physics.params.V)', from: (p) => p.V },
    dV: { value: DV, dp: 1, unit: 'V', source: 'voltmeter: smallest division 0.1 V' },
    I: { value: I, dp: 2, unit: 'A', source: 'heater current (physics.params.I)', from: (p) => p.I },
    dI: { value: DI, dp: 2, unit: 'A', source: 'ammeter: ±0.05 A' },
    m: { value: M, dp: 3, unit: 'kg', source: 'mass of the block (physics.params.m)', from: (p) => p.m },
    dm: { value: DM, dp: 3, unit: 'kg', source: 'balance: ±1 g' },
  },

  intro: (d) => '<p>A student determines the specific heat capacity $c$ of aluminium. An electric heater is placed in a hole in an '
    + `aluminium block of mass $m = (${d.stated('m')} \\pm ${d.stated('dm')})\\ \\text{kg}$. A thermometer in a second hole, filled with oil, `
    + 'measures the temperature $\\theta$ of the block. The block is wrapped in insulation.</p>'
    + `<p>The heater is connected to a supply. The p.d. across it is $V = (${d.stated('V')} \\pm ${d.stated('dV')})\\ \\text{V}$ and the current `
    + `in it is $I = (${d.stated('I')} \\pm ${d.stated('dI')})\\ \\text{A}$; both stay constant. The heater is switched on at $t = 0$. `
    + 'The table shows the temperature at different times. Each time is measured with an uncertainty of $\\pm 1\\ \\text{s}$.</p>',

  parts: (d) => {
    const { pct } = total(d);
    const th = (i) => d.text('theta', i);
    return [
      {
        label: 'a', marks: 1, ao: 'AO2',
        question: 'Determine the temperature change $\\Delta T$ of the block during the 600 s of heating.',
        numeric: d.num('dT'),
        markscheme: [`$\\Delta T = ${th(LAST)} - ${th(0)} = ${d.dp(d.r.dT.value, 1)}\\ {}^{\\circ}\\text{C}$ ✓`],
      },
      {
        label: 'b', marks: 1, ao: 'AO2',
        question: 'State the absolute uncertainty in $\\Delta T$.',
        numeric: d.num('dTunc'),
        markscheme: ['Each temperature reading is uncertain by $\\pm 0.5\\ {}^{\\circ}\\text{C}$; for a difference the absolute uncertainties add, '
          + `so $\\Delta T$ is uncertain by $\\pm ${d.dp(d.r.dTunc.value, 1)}\\ {}^{\\circ}\\text{C}$ ✓`],
      },
      {
        label: 'c', marks: 2, ao: 'AO2',
        question: 'Calculate the specific heat capacity of aluminium from these data.',
        numeric: d.num('c'),
        markscheme: [
          `Energy supplied $E = VIt = ${d.stated('V')} \\times ${d.stated('I')} \\times 600 = ${d.int(d.r.E.value)}\\ \\text{J}$ ✓`,
          `$c = \\dfrac{E}{m\\Delta T} = ${d.sf(d.r.c.value, 3)}\\ \\text{J kg}^{-1}\\,\\text{K}^{-1}$ (allow ECF from (a)) ✓`,
        ],
      },
      {
        label: 'd', marks: 2, ao: 'AO3',
        question: 'Identify, by comparing percentage uncertainties, the measured quantity that contributes most to the uncertainty in $c$.',
        markscheme: [
          `Percentage uncertainties: $V$: ${d.sf(pct.V, 2)} %; $I$: ${d.sf(pct.I, 2)} %; $t$: ${d.sf(pct.t, 1)} %; $m$: ${d.sf(pct.m, 1)} %; `
            + `$\\Delta T$: ${d.sf(pct.dT, 2)} % (at least three correct) ✓`,
          '$\\Delta T$ contributes most ✓',
        ],
      },
      {
        label: 'e', marks: 2, ao: 'AO2', asks: { valuePm: ['c', 'dc'] },
        question: 'Determine the absolute uncertainty in $c$. Hence state $c$ with its uncertainty, to an appropriate number of significant figures.',
        markscheme: [
          `Adds the percentage uncertainties: ${d.sf(d.r.pctTotal.value, 2)} %, so $\\Delta c = ${d.sf(d.r.dc.value, 2)}\\ \\text{J kg}^{-1}\\,\\text{K}^{-1}$ (allow ECF) ✓`,
          `$c = (${d.pm('c', 'dc')})\\ \\text{J kg}^{-1}\\,\\text{K}^{-1}$: uncertainty to 1 significant figure and $c$ rounded to the same place ✓`,
        ],
      },
      {
        label: 'f', marks: 1, ao: 'AO3',
        question: 'Suggest one change to the method that would reduce the percentage uncertainty in $\\Delta T$.',
        markscheme: ['Any one of: heat for longer (or use a more powerful heater) so that $\\Delta T$ is larger / use a thermometer with a smaller '
          + 'division (for example a digital thermometer reading to $0.1\\ {}^{\\circ}\\text{C}$) ✓'],
      },
    ];
  },
};
