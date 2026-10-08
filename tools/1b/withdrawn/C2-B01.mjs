// WITHDRAWN from Batch 2 on the teacher's decision (8 October 2026): judged a little too complicated for students to understand.
// Kept here, outside tools/1b/datasets, so it is never built, previewed or published. To restore it, move it back to datasets/.
// C.2 Light from a long LED tube measured with a phone's light sensor: where does the point-source inverse square law hold?
// (archetypes V2, L3 and G3)
// Skills: subtracting a background reading, completing a calculated column, plotting a point, judging from error bars where
// I·d² is constant (the model's range of validity), explaining why a point-source model fails close to a long source,
// predicting at an unmeasured distance, and why the smallest readings have the largest percentage uncertainty.
import { arrow, label } from '../diagrams.mjs';
import { escapeAttr } from '../lib.mjs';

const HIDE = [1, 5]; // students calculate I·d² at 0.30 m and 1.00 m
const OMIT = 5; // and plot the 1.00 m point
const FAR = [6, 7, 8]; // 1.50 m to 3.00 m
const D_PRED = 4.0;
const NEAR_FROM = 5; // I·d² is constant within its uncertainty from row 6 (1.00 m) onwards…
const NOT_FROM = 4; // …but not from row 5 (0.80 m) onwards

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

export default {
  id: 'C2-B01',
  topic: 'C.2',
  difficulty: 3,
  context: 'experimental',
  skills: ['background-correction', 'complete-a-table', 'plot-a-point', 'model-validity-range', 'inverse-square-law', 'prediction', 'percentage-uncertainty-of-small-readings'],
  seed: 221,
  batch: 'batch-2',
  archetypes: ['V2', 'L3', 'G3'],
  apparatus: 'long LED tube with a phone light sensor (lux) held below its middle at measured distances',
  contextFamily: 'light-intensity-distance',
  contextObjects: ['light-sensor', 'lamp', 'metre-rule'],
  features: ['model:empirical'],
  originality: 'May 2018 Paper 3 TZ2 used a small lamp, a cover and a light sensor (inverse square law with an offset distance). This dataset '
    + 'uses a long LED tube, a phone sensor in lux, a background subtraction and the product I·d², and asks where the point-source model is '
    + 'valid and why it fails near a long source: a different source, quantity and question sequence, with own numbers.',

  physics: {
    scenario: 'A 1.20 m LED tube is fixed horizontally. A phone, lying flat with its light sensor facing the tube, is placed directly below the '
      + 'middle of the tube at perpendicular distances d from 0.20 m to 3.00 m, measured with a tape measure. The sensor app reads the illuminance in lux. '
      + 'With the tube off, the room\'s background light gives a reading of a few lux.',
    principles: [
      'Intensity from a point source radiating power P equally in all directions: I = P/(4πd²), so I·d² = P/(4π) is constant (B.1 / C.2 linking question)',
      'A long source is a line of small sources at different distances and angles from the sensor; their contributions add',
      'Light from the tube and background light add, so the tube\'s own contribution is the reading minus the background reading',
    ],
    assumptions: [
      'The tube emits evenly along its length, and each short piece spreads its light equally in all directions (the line-source law; beyond the SL syllabus, used only to generate the data and approved by the teacher on 8 October 2026)',
      'The phone\'s reading in lux is proportional to the light intensity (the spectrum is the same at every distance)',
      'The background light is the same at every distance and does not change during the experiment',
      'Light reflected from walls and the ceiling is negligible',
    ],
    derivation: [
      'Each piece dx of the tube (power P dx/L) at distance √(d² + x²) gives intensity (P dx/L)/(4π(d² + x²)) × cos θ on the sensor, with cos θ = d/√(d² + x²)',
      'Adding the pieces from x = −L/2 to L/2: I = P/(4πd√(d² + L²/4))',
      'So I·d² = (P/4π) × d/√(d² + L²/4): it rises with d and levels off at P/4π once d ≫ L, where the tube acts as a point source',
    ],
    relationship: 'I = P/(4πd√(d² + L²/4)) + I_b',
    params: {
      P: { value: 2000, unit: 'lm', range: [1500, 4000], note: 'light output of a 1.2 m LED tube (a typical 18–20 W tube gives about 2000 lumens)' },
      L: { value: 1.2, unit: 'm', range: [0.6, 1.5], note: 'length of the tube' },
      Ib: { value: 6, unit: 'lx', range: [0, 30], note: 'background illuminance in a dim room' },
    },
  },

  singles: {
    Ibg: {
      unit: 'lx', model: { law: 'line-source-illuminance', inputs: { P: { value: 0, unit: 'lm' }, L: 'p.L', d: { value: 1, unit: 'm' }, Ib: 'p.Ib' } },
      expect: [0, 30],
      measurement: {
        instrument: 'the same phone light sensor, resolution 1 lx',
        reading: 'reading with the tube switched off, at the position of the measurements',
        noise: 'small changes in the room\'s light: normal scatter with standard deviation 0.4 lx',
      },
      noise: { type: 'gauss', sd: 0.4 }, resolution: 1, uncertainty: 1,
    },
  },

  columns: {
    d: { kind: 'set', name: 'distance', symbol: 'd', unit: 'm', values: [0.2, 0.3, 0.45, 0.6, 0.8, 1.0, 1.5, 2.0, 3.0], resolution: 0.001, uncertainty: 0.005 },
    Ion: {
      kind: 'measured', name: 'reading', symbol: 'E', unit: 'lx',
      model: { law: 'line-source-illuminance', inputs: { P: 'p.P', L: 'p.L', d: 'row.d', Ib: 'p.Ib' } },
      expect: [15, 1400],
      measurement: {
        instrument: 'phone light sensor and app, resolution 1 lx',
        reading: 'the steady reading with the phone flat below the middle of the tube, sensor facing the tube',
        noise: 'small tilts of the phone and the LED driver\'s flicker make the reading wander: normal scatter of 1.0 % of the reading',
      },
      noise: { type: 'gauss-relative', sd: 0.01 }, resolution: 1,
      // ±3 % of the reading (judging a wandering value), never less than the 1 lx resolution
      uncertainty: (row) => Math.max(1, Math.round(0.03 * row.Ion)),
      showUncertainty: false,
    },
    I: {
      kind: 'derived', name: 'reading minus background', symbol: 'I', unit: 'lx', dp: 0, show: false,
      value: (row, p, s) => row.Ion - s.Ibg,
      propagation: { form: 'sum', terms: [{ of: 'Ion', coef: 1 }, { single: 'Ibg', coef: -1 }] },
    },
    Id2: {
      kind: 'derived', name: 'product of I and d²', symbol: 'Id^2', symbolText: 'Id²', unit: 'lx m^2', dp: 0, hide: HIDE,
      value: (row) => row.I * row.d ** 2,
      propagation: { form: 'product', terms: [{ of: 'I', n: 1 }, { of: 'd', n: 2 }] },
      uncSymbol: '\\Delta(Id^2)',
    },
  },
  tableCaption: '$E$ is the phone\'s reading with the tube on. $I = E - E_0$ is the reading caused by the tube alone.',
  graph: { x: 'd', y: 'Id2', fit: 'none', omit: [OMIT], zero: { x: true }, height: 440 },
  present: ['diagram', 'table', 'graph'],
  figures: {
    diagram: () => {
      const alt = 'A long horizontal LED tube, 1.20 m long. A phone lies flat directly below the middle of the tube, its light sensor facing up. '
        + 'The perpendicular distance from the tube to the sensor is d.';
      return { svg: tubeAndPhone(alt), alt, caption: 'The phone is always directly below the middle of the tube (not to scale).' };
    },
  },

  results: {
    idA: { unit: 'lx m^2', value: (d) => d.rows[HIDE[0]].Id2 },
    idB: { unit: 'lx m^2', value: (d) => d.rows[HIDE[1]].Id2 },
    plateau: { unit: 'lx m^2', value: (d) => mean(FAR.map((i) => d.rows[i].Id2)) },
    Ipred: {
      unit: 'lx', predictAt: { column: 'd', value: D_PRED },
      value: (d) => d.r.plateau.value / D_PRED ** 2,
      range: (d, v) => { const u = mean(FAR.map((i) => d.unc('Id2', i))); return d.widen([(d.r.plateau.value - u) / D_PRED ** 2, (d.r.plateau.value + u) / D_PRED ** 2], v, 0.05); },
    },
    pctNear: { unit: '%', value: (d) => (100 * d.unc('Id2', 0)) / d.rows[0].Id2 },
    pctFar: { unit: '%', value: (d) => (100 * d.unc('Id2', 8)) / d.rows[8].Id2 },
  },

  claims: [
    { type: 'constantValue', column: 'Id2', rows: [NEAR_FROM, 8], expect: true },
    { type: 'constantValue', column: 'Id2', rows: [NOT_FROM, 8], expect: false },
  ],

  stated: {
    L: { value: 1.2, dp: 2, unit: 'm', source: 'tube length, physics.params.L', from: (p) => p.L },
    dPred: { value: D_PRED, dp: 1, unit: 'm', source: 'the distance for the prediction (not measured)' },
  },

  intro: (d) => `<p>A student investigates how the light from a long LED tube, of length ${d.stated('L')} m, depends on the distance from it. `
    + 'A phone is placed flat, directly below the middle of the tube, with its light sensor facing the tube. A light-meter app gives the reading $E$ in lux (lx), '
    + 'which is proportional to the light intensity. The perpendicular distance $d$ from the tube to the sensor is measured with a tape measure.</p>'
    + `<p>With the tube switched off, the reading is $E_0 = ${d.int(d.singles.Ibg)}\\ \\text{lx}$. `
    + 'If the tube behaved as a point source, $Id^2$ would be the same at every distance.</p>',

  parts: (d) => {
    const [pLo, pHi] = d.r.Ipred.range;
    return [
      {
        label: 'a', marks: 1, ao: 'AO2',
        question: 'Explain why the reading $E_0$ is subtracted from each reading.',
        markscheme: ['$E$ includes light from the room as well as from the tube; only the tube\'s light $I$ follows the model for the tube ✓'],
      },
      {
        label: 'b', marks: 2, ao: 'AO2',
        question: `Calculate the two missing values of $Id^2$, at $d = ${d.dp(d.rows[HIDE[0]].d, 2)}\\ \\text{m}$ and $d = ${d.dp(d.rows[HIDE[1]].d, 2)}\\ \\text{m}$.`,
        markscheme: [
          `$(${d.text('Ion', HIDE[0])} - ${d.int(d.singles.Ibg)}) \\times ${d.dp(d.rows[HIDE[0]].d, 2)}^2 = ${d.sf(d.r.idA.value, 2)}\\ \\text{lx m}^2$ ✓`,
          `$(${d.text('Ion', HIDE[1])} - ${d.int(d.singles.Ibg)}) \\times ${d.dp(d.rows[HIDE[1]].d, 2)}^2 = ${d.sf(d.r.idB.value, 3)}\\ \\text{lx m}^2$ ✓`,
        ],
      },
      {
        label: 'c', marks: 1, ao: 'AO2', msFigure: 'graph-ms',
        question: `Plot the point for $d = ${d.dp(d.rows[OMIT].d, 2)}\\ \\text{m}$ on the graph.`,
        markscheme: [`Point at $d = ${d.dp(d.rows[OMIT].d, 2)}\\ \\text{m}$, $Id^2 = ${d.sf(d.r.idB.value, 3)}\\ \\text{lx m}^2$, to within half a small square ✓`],
      },
      {
        label: 'd', marks: 2, ao: 'AO3',
        question: 'Identify, using the error bars, the range of distances over which the tube behaves as a point source.',
        markscheme: [
          `From about $d = ${d.dp(d.rows[NEAR_FROM].d, 2)}\\ \\text{m}$ outwards (accept ${d.dp(d.rows[NEAR_FROM].d, 2)} m to ${d.dp(d.rows[FAR[0]].d, 2)} m) ✓`,
          'Beyond this a horizontal line passes through all the error bars, so $Id^2$ is constant within its uncertainty; closer, the points lie clearly below that line ✓',
        ],
      },
      {
        label: 'e', marks: 2, ao: 'AO3',
        question: 'Explain why the point-source model does not work close to the tube.',
        markscheme: [
          'Close to the tube, $d$ is not large compared with the tube\'s length: the ends of the tube are much further from the sensor (and at a larger angle) than the middle ✓',
          'So $d$ is not the distance to all of the light: the intensity rises more slowly than $1/d^2$ as $d$ decreases, and $Id^2$ falls ✓',
        ],
      },
      {
        label: 'f', marks: 1, ao: 'AO2',
        question: `Predict the value of $I$ at $d = ${d.stated('dPred')}\\ \\text{m}$.`,
        numeric: d.num('Ipred'),
        markscheme: [`$I = \\dfrac{Id^2}{d^2} \\approx \\dfrac{${d.sf(d.r.plateau.value, 3)}}{${d.stated('dPred')}^2} = ${d.sf(d.r.Ipred.value, 2)}\\ \\text{lx}$, using the constant value of $Id^2$ at large distances (accept ${d.sf(pLo, 2)} to ${d.sf(pHi, 2)} lx) ✓`],
      },
      {
        label: 'g', marks: 1, ao: 'AO3',
        question: 'Suggest why the percentage uncertainty in $Id^2$ is largest at the largest distances.',
        markscheme: [`The readings there are small (tens of lux), so the uncertainty of each reading, at least the app's 1 lx resolution, and the uncertainty in $E_0$ are a large fraction of $I$ `
          + `(about ${d.sf(d.r.pctFar.value, 2)} % at ${d.dp(d.rows[8].d, 2)} m, against ${d.sf(d.r.pctNear.value, 2)} % at ${d.dp(d.rows[0].d, 2)} m) ✓`],
      },
    ];
  },
};

// The tube, the phone below its middle, and the distance d (a drawing: not to scale).
function tubeAndPhone(alt) {
  const body = [
    '<rect class="l3 thin" x="90" y="30" width="340" height="16" rx="8" fill="none"/>',
    label(260, 24, 'LED tube', { size: 15 }),
    '<line class="l3 thin" x1="20" y1="232" x2="500" y2="232"/>',
    '<rect class="l3 thin" x="230" y="218" width="60" height="14" rx="3" fill="none"/>',
    label(300, 216, 'phone', { anchor: 'start', size: 15 }),
    '<line class="l3 thin dash" x1="260" y1="46" x2="260" y2="216"/>',
    arrow(250, 130, 250, 48, { cls: 'l3 thin', head: 8, half: 4 }), arrow(250, 130, 250, 216, { cls: 'l3 thin', head: 8, half: 4 }),
    label(240, 136, 'd', { anchor: 'end', italic: true }),
  ];
  return `<svg viewBox="0 0 520 250" role="img" aria-label="${escapeAttr(alt)}">${body.join('')}</svg>`;
}
