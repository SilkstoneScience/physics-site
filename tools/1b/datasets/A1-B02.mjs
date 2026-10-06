// A.1 Repeated light-gate timings with one outlying trial (archetypes M1 and E3).
// Skills: identifying and justifying the exclusion of an outlying reading, its likely cause, mean and half-range of
// the remaining readings, speed from the mean time, the effect of wrongly including the outlier.

const ROW = 4; // the outlying trial (trial 5)
const L_CM = 10.0;
const DL_CM = 0.1;

const kept = (d) => d.rows.map((r) => r.t).filter((_, i) => i !== ROW);
const meanOf = (a) => a.reduce((x, y) => x + y, 0) / a.length;

export default {
  id: 'A1-B02',
  topic: 'A.1',
  difficulty: 1,
  context: 'experimental',
  skills: ['outlier', 'repeated-readings', 'mean-and-half-range', 'speed', 'effect-of-an-outlier'],
  seed: 31,
  batch: 'batch-1',
  archetypes: ['M1', 'E3'],
  apparatus: 'trolley on a ramp passing through a light gate',
  originality: 'Light-gate timing is a common practical; no legacy Paper 3 Section A or 2025 Paper 1B question uses repeated '
    + 'light-gate times with an outlying trial. Own context, numbers and sequence.',

  physics: {
    scenario: 'A trolley is released from rest at a mark on a ramp and runs down through a light gate. A card of length L on the '
      + 'trolley interrupts the beam; an electronic timer records the time t for which the beam is blocked. The run is repeated seven times.',
    principles: ['Average speed = distance ÷ time (A.1): the card of length L passes the gate in time t, so v = L/t'],
    assumptions: [
      'The trolley\'s speed hardly changes while the 10 cm card passes through the beam, so L/t is its speed at the gate',
      'The trolley is released from rest at the same mark each time',
      'The timer starts and stops exactly when the card\'s edges cross the beam',
    ],
    derivation: ['The card moves its own length L while the beam is blocked: t = L/v, so v = L/t̄ from the mean time'],
    relationship: 't = L/v',
    params: {
      L: { value: 0.1, unit: 'm', range: [0.05, 0.2], note: 'card length, stated as (10.0 ± 0.1) cm' },
      v: { value: 0.49, unit: 'm s^-1', range: [0.2, 2], note: 'speed at the gate after rolling down a gentle ramp' },
    },
  },

  columns: {
    n: { kind: 'set', name: 'trial', symbol: 'n', unit: '', values: [1, 2, 3, 4, 5, 6, 7], resolution: 1 },
    t: {
      kind: 'measured', name: 'time', symbol: 't', unit: 's',
      model: { law: 'gate-time', inputs: { L: 'p.L', v: 'p.v' } },
      expect: [0.1, 0.4],
      measurement: {
        instrument: 'light gate with an electronic timer, resolution 0.001 s',
        reading: 'time for which the card blocks the beam',
        noise: 'the speed at the gate varies slightly from run to run because the release and the friction are never exactly the same: normal scatter of 0.8 % of the time',
      },
      noise: { type: 'gauss-relative', sd: 0.008 }, resolution: 0.001, uncertainty: 0.001,
      // Trial 5 is released from above the mark (the cause students are asked to suggest), so the trolley is faster.
      anomaly: { row: ROW, shift: -0.024 },
    },
  },
  present: ['table'],

  results: {
    tMean: { unit: 's', value: (d) => meanOf(kept(d)) },
    dtHalf: { unit: 's', value: (d) => (Math.max(...kept(d)) - Math.min(...kept(d))) / 2, range: (d, v) => [v - 0.0005, v + 0.0005] },
    v: { unit: 'm s^-1', estimates: 'v', value: (d) => (L_CM / 100) / d.r.tMean.value },
    tAll: { unit: 's', value: (d) => meanOf(d.rows.map((r) => r.t)) },
    vAll: { unit: 'm s^-1', value: (d) => (L_CM / 100) / d.r.tAll.value },
    gap: { unit: 's', value: (d) => d.r.tMean.value - d.rows[ROW].t },
  },

  claims: [{ type: 'outlier', column: 't', row: ROW }],

  stated: {
    L: { value: L_CM, dp: 1, unit: 'cm', source: 'card length, physics.params.L in cm', from: (p) => p.L * 100 },
    dL: { value: DL_CM, dp: 1, unit: 'cm', source: 'ruler measurement of the card, ±1 mm' },
  },

  intro: (d) => '<p>A student releases a trolley from rest at a mark on a ramp. The trolley runs down the ramp and through a light gate. '
    + `A card of length $L = (${d.stated('L')} \\pm ${d.stated('dL')})\\ \\text{cm}$ fixed to the trolley blocks the light beam, and a timer records `
    + 'the time $t$ for which the beam is blocked.</p>'
    + '<p>The student repeats the run seven times. The results are shown in the table.</p>',

  parts: (d) => {
    const pctUp = ((d.r.vAll.value - d.r.v.value) / d.r.v.value) * 100;
    return [
      {
        label: 'a', marks: 2, ao: 'AO3',
        question: 'Identify the trial that should not be used in the analysis. Justify your answer using the data.',
        markscheme: [
          `Trial ${d.int(ROW + 1)} ($t = ${d.text('t', ROW)}\\ \\text{s}$) ✓`,
          `It is about ${d.dp(d.r.gap.value, 3)} s shorter than the mean of the other trials, much more than their spread `
            + `(they lie within about $\\pm ${d.dp(d.r.dtHalf.value, 3)}\\ \\text{s}$ of each other) ✓`,
        ],
      },
      {
        label: 'b', marks: 1, ao: 'AO3',
        question: 'Suggest one cause of this reading that is consistent with its value.',
        markscheme: ['The time is too short, so the trolley was moving faster than in the other runs: for example it was released from '
          + 'above the mark, or it was pushed as it was released ✓'],
      },
      {
        label: 'c', marks: 1, ao: 'AO2',
        question: 'Calculate the mean time $\\bar{t}$ of the remaining trials.',
        numeric: d.num('tMean'),
        markscheme: [`$\\bar{t} = ${d.sf(d.r.tMean.value, 3)}\\ \\text{s}$ ✓`],
      },
      {
        label: 'd', marks: 1, ao: 'AO2',
        question: 'Determine the absolute uncertainty in $\\bar{t}$, using the spread of the remaining readings.',
        numeric: d.num('dtHalf'),
        markscheme: [`Half the range of the remaining readings: $\\pm ${d.dp(d.r.dtHalf.value, 4)}\\ \\text{s}$ (accept ${d.dp(d.r.dtHalf.value, 3)} s) ✓`],
      },
      {
        label: 'e', marks: 2, ao: 'AO2',
        question: 'Determine the speed $v$ of the trolley as it passes through the light gate.',
        numeric: d.num('v', { mistakes: [{ value: L_CM / d.r.tMean.value, feedback: 'Convert the card length to metres before dividing.' }] }),
        markscheme: [
          '$v = \\dfrac{L}{\\bar{t}}$ with $L$ in metres ✓',
          `$v = ${d.sf(d.r.v.value, 3)}\\ \\text{m s}^{-1}$ (allow ECF from (c)) ✓`,
        ],
      },
      {
        label: 'f', marks: 1, ao: 'AO3',
        question: `State and explain the effect on the value of $v$ if trial ${d.int(ROW + 1)} had been included.`,
        markscheme: [`The mean time would be smaller, so $v$ would be larger (by about ${d.sf(pctUp, 1)} %) and would not represent a release from the mark ✓`],
      },
    ];
  },
};
