// B.1 Specific heat capacity of water in an uninsulated beaker: the data show heat loss, students reason about the
// direction of the systematic error, use the start of the heating to reduce it, and weigh precision against accuracy
// (archetypes E2 and V3).

const V = 12.0;
const DV = 0.1;
const I = 3.5;
const DI = 0.05;
const M = 0.4;
const DM = 0.001;
const DT_TIME = 1;
const C_ACCEPTED = 4180;
const FIRST = 1; // row at t = 150 s
const LAST = 6;  // row at t = 900 s

// c from the energy supplied up to row i and the temperature rise from row 0, with its worst-case uncertainty.
const cFrom = (d, i) => {
  const t = d.rows[i].t;
  const dT = d.rows[i].theta - d.rows[0].theta;
  const value = (V * I * t) / (M * dT);
  const frac = DV / V + DI / I + DT_TIME / t + DM / M + (2 * 0.1) / dT;
  return { value, unc: value * frac, pct: frac * 100 };
};

export default {
  id: 'B1-B02',
  topic: 'B.1',
  difficulty: 3,
  context: 'experimental',
  skills: ['evidence-of-heat-loss', 'systematic-error-direction', 'reducing-a-systematic-error', 'precision-vs-accuracy', 'accepted-value'],
  seed: 71,
  batch: 'batch-1',
  archetypes: ['E2', 'V3'],
  apparatus: 'beaker of water heated by an electric immersion heater',
  contextFamily: 'electrical-heating',
  contextObjects: ['electric-heater', 'thermometer', 'water-bath'],
  features: ['model:empirical'],
  originality: 'Heating water electrically is a standard practical. May 2024 TZ1 Paper 3 Q2(b) asked for one systematic error in such an '
    + 'experiment and its effect. This dataset differs: the heat loss must be inferred from a time series (a falling rate of temperature '
    + 'rise), the value is recalculated from the start of the heating, and the two results are compared for precision and accuracy '
    + 'using their uncertainty ranges. The heat-loss model (Newton\'s law of cooling) is beyond the syllabus and is not given to students.',

  physics: {
    scenario: 'An electric immersion heater warms 0.400 kg of water in an uninsulated glass beaker with no lid. The p.d. and current are '
      + 'constant. The water is stirred and a digital thermometer is read every 150 s for 900 s.',
    principles: [
      'Electrical power P = VI (B.5); energy supplied E = VIt',
      'Q = mcΔT for the energy that stays in the water (B.1)',
      'Energy is lost from the beaker to the surroundings at a rate that increases with the temperature excess (conduction, convection, evaporation)',
    ],
    assumptions: [
      'The rate of energy loss is h(θ − θ_r) with a constant h (Newton\'s law of cooling, an empirical model)',
      'The beaker, heater and thermometer have negligible heat capacity',
      'The water starts at room temperature θ_r',
    ],
    derivation: [
      'mc dθ/dt = P − h(θ − θ_r)',
      'Solution with θ = θ_r at t = 0: θ = θ_r + (P/h)(1 − e^(−ht/(mc)))',
      'The rate dθ/dt = (P/mc)e^(−ht/(mc)) falls as the water warms, so ΔT is less than Pt/(mc) and c = VIt/(mΔT) is too large',
      'Near t = 0 the loss is small, so the early rate of rise gives c closest to the true value',
    ],
    relationship: 'θ = θ_r + (P/h)(1 − e^(−ht/(mc)))',
    params: {
      V: { value: V, unit: 'V', range: [6, 15], note: 'supply p.d.' },
      I: { value: I, unit: 'A', range: [1, 6], note: 'heater current' },
      m: { value: M, unit: 'kg', range: [0.1, 1], note: 'mass of water' },
      c: { value: C_ACCEPTED, unit: 'J kg^-1 ΔK^-1', range: [4170, 4190], note: 'water at 20–45 °C' },
      h: { value: 0.4, unit: 'W ΔK^-1', range: [0.05, 1], note: 'loss coefficient of an open, uninsulated beaker (about 8 W lost at 20 K above the room)' },
      thetaR: { value: 20, unit: '°C', range: [15, 25], note: 'room temperature' },
    },
  },

  columns: {
    t: { kind: 'set', name: 'time', symbol: 't', unit: 's', values: [0, 150, 300, 450, 600, 750, 900], resolution: 1 },
    theta: {
      kind: 'measured', name: 'temperature', symbol: '\\theta', symbolText: 'θ', unit: '°C',
      model: {
        law: 'heating-with-loss',
        inputs: { thetaR: 'p.thetaR', P: { law: 'electrical-power', inputs: { V: 'p.V', I: 'p.I' } }, h: 'p.h', m: 'p.m', c: 'p.c', t: 'row.t' },
      },
      expect: [15, 50],
      measurement: {
        instrument: 'digital thermometer, resolution 0.1 °C',
        reading: 'temperature of the stirred water at each time',
        noise: 'stirring does not keep the water perfectly uniform and the probe responds slightly late: normal scatter with standard deviation 0.05 °C',
      },
      noise: { type: 'gauss', sd: 0.05 }, resolution: 0.1, uncertainty: 0.1,
    },
  },
  present: ['table'],

  results: {
    rise1: { unit: 'Δ°C', value: (d) => d.rows[FIRST].theta - d.rows[0].theta },
    riseLast: { unit: 'Δ°C', value: (d) => d.rows[LAST].theta - d.rows[LAST - 1].theta },
    cWhole: { unit: 'J kg^-1 ΔK^-1', value: (d) => cFrom(d, LAST).value },
    cFirst: { unit: 'J kg^-1 ΔK^-1', value: (d) => cFrom(d, FIRST).value },
    dcWhole: { unit: 'J kg^-1 ΔK^-1', value: (d) => cFrom(d, LAST).unc },
    dcFirst: { unit: 'J kg^-1 ΔK^-1', value: (d) => cFrom(d, FIRST).unc },
    // The ranges students compare with the accepted value: each result ± its propagated uncertainty.
    cWholeRange: { unit: 'J kg^-1 ΔK^-1', basis: 'uncertainty', value: (d) => cFrom(d, LAST).value, range: (d) => { const r = cFrom(d, LAST); return [r.value - r.unc, r.value + r.unc]; } },
    cFirstRange: { unit: 'J kg^-1 ΔK^-1', basis: 'uncertainty', value: (d) => cFrom(d, FIRST).value, range: (d) => { const r = cFrom(d, FIRST); return [r.value - r.unc, r.value + r.unc]; } },
  },

  claims: [
    { type: 'verdict', result: 'cWholeRange', value: C_ACCEPTED, expect: 'outside' },
    { type: 'verdict', result: 'cFirstRange', value: C_ACCEPTED, expect: 'inside' },
  ],

  stated: {
    V: { value: V, dp: 1, unit: 'V', source: 'physics.params.V', from: (p) => p.V },
    dV: { value: DV, dp: 1, unit: 'V', source: 'voltmeter: smallest division 0.1 V' },
    I: { value: I, dp: 2, unit: 'A', source: 'physics.params.I', from: (p) => p.I },
    dI: { value: DI, dp: 2, unit: 'A', source: 'ammeter: ±0.05 A' },
    m: { value: M, dp: 3, unit: 'kg', source: 'physics.params.m', from: (p) => p.m },
    dm: { value: DM, dp: 3, unit: 'kg', source: 'balance: ±1 g' },
    accepted: { value: C_ACCEPTED, dp: 0, unit: 'J kg^-1 K^-1', source: 'accepted value for water near room temperature' },
  },

  intro: (d) => '<p>A student determines the specific heat capacity $c$ of water. An electric immersion heater is placed in '
    + `$(${d.stated('m')} \\pm ${d.stated('dm')})\\ \\text{kg}$ of water in a glass beaker with no lid and no insulation. The p.d. across the `
    + `heater is $V = (${d.stated('V')} \\pm ${d.stated('dV')})\\ \\text{V}$ and the current in it is $I = (${d.stated('I')} \\pm ${d.stated('dI')})\\ \\text{A}$; `
    + 'both stay constant. The heater is switched on at $t = 0$ and the stirred water\'s temperature $\\theta$ is recorded. '
    + 'Times are measured to $\\pm 1\\ \\text{s}$.</p>',

  parts: (d) => {
    const w = cFrom(d, LAST);
    const f = cFrom(d, FIRST);
    return [
      {
        label: 'a', marks: 2, ao: 'AO3',
        question: 'Use the data to show that the rate at which the temperature of the water rises decreases during the heating.',
        markscheme: [
          `In the first 150 s the temperature rises by ${d.dp(d.r.rise1.value, 1)} °C ✓`,
          `In the last 150 s it rises by only ${d.dp(d.r.riseLast.value, 1)} °C, although the energy supplied in each interval is the same ✓`,
        ],
      },
      {
        label: 'b', marks: 2, ao: 'AO2',
        question: 'Calculate $c$ using the readings at $t = 0$ and $t = 900\\ \\text{s}$.',
        numeric: d.num('cWhole'),
        markscheme: [
          `$E = VIt = ${d.stated('V')} \\times ${d.stated('I')} \\times 900$ J and $\\Delta T = ${d.text('theta', LAST)} - ${d.text('theta', 0)}$ °C ✓`,
          `$c = \\dfrac{E}{m\\Delta T} = ${d.sf(w.value, 3)}\\ \\text{J kg}^{-1}\\,\\text{K}^{-1}$ ✓`,
        ],
      },
      {
        label: 'c', marks: 2, ao: 'AO3',
        question: `The accepted value of $c$ for water is $${d.stated('accepted')}\\ \\text{J kg}^{-1}\\,\\text{K}^{-1}$. Explain, with reference to your answer to (a), why the value in (b) is larger than the accepted value.`,
        markscheme: [
          'The falling rate of rise shows that energy is lost to the surroundings, at a greater rate as the water gets hotter ✓',
          'So less than $VIt$ goes into the water and $\\Delta T$ is smaller than it would be with no losses; $c = \\dfrac{VIt}{m\\Delta T}$ is therefore too large ✓',
        ],
      },
      {
        label: 'd', marks: 1, ao: 'AO2',
        question: 'Calculate $c$ using only the first 150 s of heating.',
        numeric: d.num('cFirst'),
        markscheme: [`$c = \\dfrac{VI \\times 150}{m\\,(${d.text('theta', FIRST)} - ${d.text('theta', 0)})} = ${d.sf(f.value, 3)}\\ \\text{J kg}^{-1}\\,\\text{K}^{-1}$ ✓`],
      },
      {
        label: 'e', marks: 1, ao: 'AO3',
        question: 'Explain why using only the first 150 s reduces the effect of the energy losses.',
        markscheme: ['At the start the water is close to room temperature, so the rate of energy loss is small and almost all of $VIt$ goes into the water ✓'],
      },
      {
        label: 'f', marks: 2, ao: 'AO3',
        question: `The uncertainty in the value from (b) is about $\\pm ${d.sf(w.unc, 2)}\\ \\text{J kg}^{-1}\\,\\text{K}^{-1}$ and in the value from (d) about `
          + `$\\pm ${d.sf(f.unc, 2)}\\ \\text{J kg}^{-1}\\,\\text{K}^{-1}$. Discuss which value is the better estimate of $c$.`,
        markscheme: [
          `(b) is more precise (smaller uncertainty), but its range, about ${d.sf(w.value - w.unc, 3)} to ${d.sf(w.value + w.unc, 3)}, does not include ${d.stated('accepted')}: it has a systematic error ✓`,
          `(d) has a larger uncertainty (small $\\Delta T$), but its range, about ${d.sf(f.value - f.unc, 3)} to ${d.sf(f.value + f.unc, 3)}, includes ${d.stated('accepted')}: it is more accurate, so (d) is the better estimate (award for a conclusion consistent with the candidate's own values) ✓`,
        ],
      },
    ];
  },
};
