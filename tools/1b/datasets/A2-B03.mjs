// A.2 A squat jump on a force plate: impulse from the area under a force–time trace, compared with the take-off speed found from
// the time in the air (archetypes G1 and V3).
// Skills: equilibrium when standing still, mass from a weight reading, the impulse of the resultant force as the area between the
// trace and the weight line (areas below the line count as negative), take-off speed from impulse = change of momentum, a second
// method from the flight time, comparing the two and explaining the difference.
import { areaUnder } from '../validate.mjs';

const DT = 0.005; // 200 readings per second
const T_END = 1.2;
const T0 = 0.1; // the push starts
const T_OFF = 0.5; // take-off (end of the push: T0 + tau)
const TIMES = Array.from({ length: Math.round(T_END / DT) + 1 }, (_, i) => Number((i * DT).toFixed(3)));

const standing = (d) => d.rows.filter((r) => r.t < T0).map((r) => r.F);
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
// Take-off: the first reading of zero; landing: the first non-zero reading after it.
const flight = (d) => {
  const i = d.rows.findIndex((r) => r.t >= T0 && r.F === 0);
  const j = d.rows.findIndex((r, k) => k > i && r.F > 0);
  return { off: d.rows[i].t, land: d.rows[j].t };
};
export default {
  id: 'A2-B03',
  topic: 'A.2',
  difficulty: 2,
  context: 'experimental',
  skills: ['equilibrium', 'value-from-a-graph', 'area-under-a-graph', 'impulse', 'momentum', 'compare-two-methods', 'systematic-difference'],
  seed: 231,
  batch: 'batch-2',
  archetypes: ['G1', 'V3'],
  apparatus: 'force plate logging 200 readings per second under a person doing a squat jump',
  contextFamily: 'force-sensor-motion',
  contextObjects: ['force-plate'],
  features: ['model:empirical', 'graph:area'],
  tableless: {
    reason: 'the force plate\'s software shows its 200 readings per second as a trace; a table of 241 readings would not help students',
    readFrom: [{ figure: 'graph', columns: ['t', 'F'] }],
  },
  originality: 'The closest IB item found is May 2023 Paper 3 TZ2 (a force sensor measuring the peak force of a ball against its pressure): no '
    + 'jump, no area and no impulse. Own context (a squat jump on a force plate), own data from an approved empirical pulse model, and an own '
    + 'sequence: weight and mass, the area between the trace and the weight line, take-off speed, a second method from the flight time and '
    + 'why the two differ.',

  physics: {
    scenario: 'A student stands still on a force plate, bends their knees, then pushes off and jumps straight up from the squat (no '
      + 'counter-movement). The plate records the vertical force F on it 200 times per second. The student lands on the plate with bent knees.',
    principles: [
      'Standing still: the resultant force is zero, so the plate pushes up with a force equal to the weight mg (A.2, Newton\'s first law; by Newton\'s third law the plate reads this force)',
      'The resultant (net) upward force on the jumper is F − mg',
      'Impulse of the resultant force = area under the (F − mg)–t graph = change of momentum (A.2): starting from rest, mv = ∫(F − mg)dt up to take-off',
      'In flight only gravity acts: rising and falling to the same height takes t = 2v/g (A.1)',
    ],
    assumptions: [
      'The force during the push follows a smooth empirical pulse, F = mg(1 − sᵖ) + A sin(πs) (approved by the teacher on 8 October 2026)',
      'The jumper\'s centre of mass is at the same height at landing as at take-off, apart from a stated extra flight time δ because the student lands with bent knees',
      'Air resistance is negligible',
    ],
    derivation: [
      'Impulse of the net force from the start of the push to take-off: J = τ(2A/π − mg/(p + 1))',
      'Take-off speed v = J/m; flight time 2v/g + δ; landing force F = mg·s + B sin(πs), then mg',
    ],
    relationship: 'F(t) as in the force-plate-jump law; mv = ∫(F − mg)dt',
    params: {
      m: { value: 62, unit: 'kg', range: [40, 90], note: 'mass of the jumper' },
      g: { value: 9.8, unit: 'm s^-2', range: [9.8, 9.8], note: 'data booklet value' },
      t0: { value: T0, unit: 's', range: [0, 0.5], note: 'start of the push' },
      tau: { value: T_OFF - T0, unit: 's', range: [0.25, 0.5], note: 'duration of the push (typical squat jump: 0.3–0.4 s)' },
      A: { value: 830, unit: 'N', range: [400, 1500], note: 'size of the push (peak force about 2.3 mg)' },
      p: { value: 3, unit: '', range: [1, 5], note: 'shape of the fall in force as the legs straighten' },
      dL: { value: 0.06, unit: 's', range: [0, 0.08], note: 'extra time in the air from landing with bent knees (centre of mass lower at landing)' },
      tauL: { value: 0.1, unit: 's', range: [0.08, 0.3], note: 'duration of the landing impact' },
      B: { value: 1500, unit: 'N', range: [500, 3000], note: 'size of the landing impact (peak about 3 mg)' },
    },
  },

  columns: {
    t: { kind: 'set', name: 'time', symbol: 't', unit: 's', values: TIMES, resolution: 0.005 },
    F: {
      kind: 'measured', name: 'force', symbol: 'F', unit: 'N',
      model: { law: 'force-plate-jump', inputs: { m: 'p.m', g: 'p.g', t: 'row.t', t0: 'p.t0', tau: 'p.tau', A: 'p.A', p: 'p.p', dL: 'p.dL', tauL: 'p.tauL', B: 'p.B' } },
      expect: [0, 2000],
      measurement: {
        instrument: 'force plate with a data logger, resolution 1 N, 200 readings per second (reads zero with nothing on it)',
        reading: 'the vertical force on the plate at each instant',
        noise: 'the body sways and wobbles slightly while it is on the plate: normal scatter of 0.6 % of the force (none when the plate is empty)',
      },
      noise: { type: 'gauss-relative', sd: 0.006 }, resolution: 1, uncertainty: null,
    },
  },
  graph: {
    x: 't', y: 'F', fit: 'none', style: 'trace', zero: { x: true, y: true }, height: 480,
    altDescription: 'The force is steady at first (the student standing still), rises to a peak during the push, falls to zero at take-off, stays at zero while the student is in the air, then rises sharply at landing and settles back to its first value.',
    shade: { from: T0, to: T_OFF, baseline: (d) => d.r.W.value, label: 'the area between the trace and the weight line from the start of the push to take-off (below the line counts as negative)' },
  },
  present: ['graph'],

  results: {
    W: { unit: 'N', value: (d) => mean(standing(d)) },
    m: { unit: 'kg', estimates: 'm', value: (d) => d.r.W.value / d.p.g, range: (d, v) => [v * 0.97, v * 1.03] },
    J: {
      unit: 'N s', dims: { of: 'xy' }, check: 'area', area: { from: T0, to: T_OFF, baseline: (d) => d.r.W.value },
      value: (d) => areaUnder(d.rows, 't', 'F', T0, T_OFF, d.r.W.value),
      range: (d, v) => [v * 0.94, v * 1.06],
    },
    v: { unit: 'm s^-1', value: (d) => d.r.J.value / d.r.m.value, range: (d, v) => [d.r.J.range[0] / d.r.m.value, d.r.J.range[1] / d.r.m.value] },
    tOff: { unit: 's', value: (d) => flight(d).off },
    tLand: { unit: 's', value: (d) => flight(d).land },
    tf: { unit: 's', value: (d) => flight(d).land - flight(d).off },
    vf: { unit: 'm s^-1', value: (d) => (d.p.g * d.r.tf.value) / 2, range: (d) => [(d.p.g * (d.r.tf.value - 0.01)) / 2, (d.p.g * (d.r.tf.value + 0.01)) / 2] },
    pctDiff: { unit: '%', value: (d) => (100 * (d.r.vf.value - d.r.v.value)) / d.r.v.value },
  },

  claims: [{ type: 'compare', result: 'vf', than: 'v', expect: 'larger' }],

  stated: { rate: { value: 200, dp: 0, unit: 's^-1', source: 'the plate logs 200 readings per second', from: () => 1 / DT } },

  intro: (d) => '<p>A student stands still on a force plate, bends their knees, and then jumps straight up. The force plate records the vertical '
    + `force $F$ on it ${d.stated('rate')} times per second. The student lands back on the plate with bent knees.</p>`
    + '<p>The graph shows the force recorded by the plate.</p>',

  parts: (d) => {
    const [jLo, jHi] = d.r.J.range;
    const [vLo, vHi] = d.r.v.range;
    return [
      {
        label: 'a', marks: 1, ao: 'AO2',
        question: `Explain why the force recorded in the first ${d.dp(T0, 2)} s is equal to the student\'s weight.`,
        markscheme: ['The student is at rest, so the resultant force is zero: the upward force from the plate equals the weight (and the student pushes down on the plate with an equal force) ✓'],
      },
      {
        label: 'b', marks: 1, ao: 'AO2',
        reads: [{ figure: 'graph', x: 0.05, y: d.r.W.value }],
        question: 'Determine the mass of the student.',
        markscheme: [`$F \\approx ${d.sf(d.r.W.value, 3)}\\ \\text{N}$, so $m = \\dfrac{F}{g} = ${d.sf(d.r.m.value, 2)}\\ \\text{kg}$ (accept ${d.sf(d.r.m.range[0], 2)} to ${d.sf(d.r.m.range[1], 2)} kg) ✓`],
      },
      {
        label: 'c', marks: 3, ao: { AO2: 2, AO3: 1 }, msFigure: 'graph-ms',
        reads: [{ figure: 'graph', x: T_OFF }],
        question: `The push starts at $t = ${d.dp(T0, 2)}\\ \\text{s}$. Estimate the impulse of the resultant force on the student from then until the student leaves the plate.`,
        markscheme: [
          'Resultant force $= F - mg$: uses the area between the graph and a horizontal line at the weight ✓',
          `Up to take-off at $t = ${d.dp(d.r.tOff.value, 2)}\\ \\text{s}$ (where $F$ reaches zero); the area below the weight line near take-off is subtracted ✓`,
          `Impulse $\\approx ${d.sf(d.r.J.value, 2)}\\ \\text{N s}$ (accept ${d.sf(jLo, 2)} to ${d.sf(jHi, 2)} N s) ✓`,
        ],
      },
      {
        label: 'd', marks: 2, ao: 'AO2',
        question: 'Determine the speed of the student at take-off.',
        numeric: d.num('v'),
        markscheme: [
          'Impulse = change of momentum, from rest: $v = \\dfrac{\\text{impulse}}{m}$ ✓',
          `$v = ${d.sf(d.r.v.value, 2)}\\ \\text{m s}^{-1}$ (accept ${d.sf(vLo, 2)} to ${d.sf(vHi, 2)}; allow ECF from (b) and (c)) ✓`,
        ],
      },
      {
        label: 'e', marks: 2, ao: { AO2: 1, AO3: 1 },
        reads: [{ figure: 'graph', x: d.r.tOff.value }, { figure: 'graph', x: d.r.tLand.value }],
        question: 'The take-off speed can also be found from the time the student spends in the air, using $v = \\dfrac{gt}{2}$. Determine this speed and compare it with your answer to (d).',
        markscheme: [
          `Time in the air from the graph: $${d.dp(d.r.tLand.value, 2)} - ${d.dp(d.r.tOff.value, 2)} = ${d.dp(d.r.tf.value, 2)}\\ \\text{s}$, so $v = ${d.sf(d.r.vf.value, 2)}\\ \\text{m s}^{-1}$ ✓`,
          `This is larger than the value from the impulse, by about ${d.sf(d.r.pctDiff.value, 2)} % (accept a comparison consistent with the candidate's values) ✓`,
        ],
      },
      {
        label: 'f', marks: 1, ao: 'AO3',
        question: 'Suggest one reason why the speed from the time in the air is larger.',
        markscheme: ['The student lands with bent knees, so the centre of mass is lower at landing than at take-off: the student is in the air for longer than the rise and fall to the same height takes ✓'],
      },
    ];
  },
};
