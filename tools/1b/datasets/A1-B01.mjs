// A.1 Horizontal launcher: range of a projectile launched horizontally from different heights.
// R = u√(2h/g), so R² = (2u²/g) h: a straight line through the origin; u from the gradient.
// Skills: mean and uncertainty of repeated readings, linearising, gradient, testing a manufacturer's claim.
import { launcher } from '../diagrams.mjs';

const halfRangeOf = (a) => (Math.max(...a) - Math.min(...a)) / 2;
const meanOf = (a) => a.reduce((x, y) => x + y, 0) / a.length;
// The manufacturer's stated launch speed (m s⁻¹). It must be clearly outside the range of u from the max/min
// lines (the verdict claim below), so that students' own lines lead to the same conclusion. (It was 2.50, only
// 0.7 % above the steepest line: changed after the October 2026 pilot audit.)
const CLAIMED_U = 2.6;
const ROW = 2; // the height whose five readings students process themselves (h = 0.700 m)

const ALT = 'Side view. A spring launcher is clamped horizontally to a tall stand. A ball leaves it horizontally with speed u '
  + 'and follows a curved path down to carbon paper on the floor. A plumb line hangs from the launch point. The height h is from '
  + 'the floor to the launch point; the range R is along the floor from the plumb line to where the ball lands.';

export default {
  id: 'A1-B01',
  topic: 'A.1',
  difficulty: 2,
  context: 'experimental',
  skills: ['repeated-readings', 'mean-and-uncertainty', 'linearisation', 'gradient', 'evaluate-claim'],
  seed: 5,
  batch: 'pilot',
  archetypes: ['N2', 'M1', 'V3'],
  apparatus: 'horizontal spring launcher',
  contextFamily: 'projectile',
  contextObjects: ['spring', 'launcher', 'ball'],
  originality: 'Common school practical (projectile launched horizontally). No legacy Paper 3 Section A or 2025 Paper 1B question uses this set-up; own numbers and sequence.',

  // ----- 1. Physics model -----
  physics: {
    scenario: 'A spring launcher, clamped horizontally to a stand, fires a small steel ball horizontally from a height h above the floor. '
      + 'The ball lands on carbon paper. The horizontal distance R from the point below the launch point (found with a plumb line) '
      + 'to each mark is measured, five times at each of six heights.',
    principles: [
      'Projectile motion: horizontal and vertical motion are independent (A.1)',
      'Horizontally there is no force, so the horizontal velocity u is constant: R = ut',
      'Vertically the ball starts from rest and accelerates at g: h = ½gt²',
    ],
    assumptions: [
      'Air resistance is negligible (for a small steel ball at about 2 m s⁻¹, drag is about 0.2 % of the weight)',
      'The ball leaves the launcher horizontally, with the same mean speed u at every height',
      'h is measured from the floor to the launch point (the centre of the ball as it leaves the launcher)',
      'The shot-to-shot spread comes from small variations in the launch speed (the ball seating and the spring release)',
    ],
    derivation: [
      'Vertical: h = ½gt², so the time of flight is t = √(2h/g)',
      'Horizontal: R = ut = u√(2h/g)',
      'Squaring: R² = (2u²/g) h, a straight line through the origin with gradient k = 2u²/g',
      'So u = √(gk/2)',
    ],
    relationship: 'R² = (2u²/g) h',
    params: {
      u: { value: 2.4, unit: 'm s^-1', range: [1, 6], note: 'school spring launcher' },
      g: { value: 9.8, unit: 'm s^-2', range: [9.8, 9.8], note: 'data booklet value' },
    },
  },
  vectors: { u: [1, 0, 0], g: [0, -1, 0] },

  // ----- 2. Measurements -----
  columns: {
    h: { kind: 'set', name: 'launch height', symbol: 'h', unit: 'm', values: [0.4, 0.55, 0.7, 0.85, 1.0, 1.15], resolution: 0.001, uncertainty: 0.005 },
    R: {
      kind: 'measured', name: 'mean range', symbol: 'R', unit: 'm', trials: 5,
      model: { law: 'projectile-horizontal-range', inputs: { u: 'p.u', h: 'row.h', g: 'p.g' } },
      expect: [0.5, 1.5],
      measurement: {
        instrument: 'metre rule, resolution 1 mm, from the plumb-line point to each carbon-paper mark',
        reading: 'five ranges at each height; the table gives their mean, with half their range as the uncertainty',
        noise: 'the launch speed varies slightly from shot to shot (how the ball sits and how the spring releases), by about 1.2 %; '
          + 'since R ∝ u, each range varies by the same fraction (normal scatter, standard deviation 1.2 % of R)',
      },
      noise: { type: 'gauss-relative', sd: 0.012 }, resolution: 0.001, uncertainty: 'halfRange',
      hide: [ROW],
    },
    R2: {
      kind: 'derived', name: 'mean range squared', symbol: 'R^2', symbolText: 'R²', unit: 'm^2', dp: 3,
      value: (row) => row.R ** 2,
      propagation: { form: 'product', terms: [{ of: 'R', n: 2 }] }, // Δ(R²)/R² = 2ΔR/R, so Δ(R²) = 2RΔR
      hide: [ROW],
    },
  },
  trialsTable: { column: 'R', row: ROW, caption: 'The five ranges for h = 0.700 m.' },
  present: ['diagram', 'table', 'trials', 'graph'],
  graph: { x: 'h', y: 'R2', fit: 'linear', band: true, xErrorBars: true, zero: { x: true, y: true } },

  // ----- 3. Results -----
  results: {
    Rmean: { unit: 'm', value: (d) => meanOf(d.rows[ROW].R__trials), range: (d, v) => [v - 0.0005, v + 0.0005] },
    dR: { unit: 'm', value: (d) => halfRangeOf(d.rows[ROW].R__trials), range: (d, v) => [v - 0.0005, v + 0.0005] },
    gradient: {
      unit: 'm', dims: { of: 'y/x' }, check: 'gradient',
      value: (d) => d.fit.m,
      range: (d, v) => d.widen(d.gradientRange(), v, 0.04),
    },
    u: {
      unit: 'm s^-1', estimates: 'u',
      value: (d) => Math.sqrt((d.p.g * d.r.gradient.value) / 2),
      range: (d) => d.r.gradient.range.map((k) => Math.sqrt((d.p.g * k) / 2)),
    },
    // u from the steepest and shallowest lines alone (no reading tolerance): what (g) compares the claim with.
    uLines: {
      unit: 'm s^-1', basis: 'lines',
      value: (d) => d.r.u.value,
      range: (d) => d.gradientRange().map((k) => Math.sqrt((d.p.g * k) / 2)),
    },
  },

  // Numbers the question states that aren't in the data (traced by the validator).
  stated: {
    claimedU: { value: CLAIMED_U, dp: 2, unit: 'm s^-1', source: 'the manufacturer\'s stated launch speed: part of the scenario; the claim that the data do not support it is checked above' },
  },

  // ----- 4. Claims -----
  claims: [
    { type: 'linear', minR2: 0.99 },
    { type: 'throughOrigin', expect: true },
    { type: 'agrees', result: 'u', value: 2.4, expect: true },
    { type: 'verdict', result: 'uLines', value: CLAIMED_U, expect: 'outside' },
    { type: 'trend', direction: 'increasing' },
  ],

  // ----- 5. Presentation -----
  figures: {
    diagram: (d) => ({
      svg: launcher(ALT, { u: d.p.u, g: d.p.g, h: 0.7 }),
      alt: ALT,
      caption: 'The path is drawn to scale for $h = 0.700\\ \\text{m}$. '
        + '<span class="key-1">Blue</span>: launch velocity. <span class="key-2">Orange</span>: path of the ball.',
    }),
  },
  intro: () => '<p>A student investigates how the horizontal range of a ball depends on the height from which it is launched. '
    + 'A spring launcher is clamped horizontally to a tall stand and fires a small steel ball, which lands on carbon paper on the floor.</p>'
    + '<p>The student measures the height $h$ of the launch point above the floor and the range $R$ from the point directly below the launch point '
    + '(found with a plumb line) to each mark. The ball is fired five times at each height. '
    + 'The table gives the mean range and its uncertainty (half the range of the five readings), and $R^2$. '
    + 'The five readings for $h = 0.700\\ \\text{m}$ are given separately.</p>',

  parts: (d) => {
    const [uLo, uHi] = d.r.u.range;
    const [gLo, gHi] = d.r.gradient.range;
    const [lLo, lHi] = d.r.uLines.range;
    const rd = d.rows[ROW].R__trials;
    return [
      {
        label: 'a', marks: 1, ao: 'AO2',
        question: 'Identify one variable that the student must control so that the launch speed is the same for every shot.',
        markscheme: ['Any one of: how far the spring is compressed / the same ball / the launcher kept horizontal ✓'],
      },
      {
        label: 'b', marks: 1, ao: 'AO2',
        question: 'Calculate the mean range for $h = 0.700\\ \\text{m}$.',
        numeric: d.num('Rmean'),
        markscheme: [`Mean $= \\dfrac{${rd.map((v) => v.toFixed(3)).join(' + ')}}{5} = ${d.sf(d.r.Rmean.value, 3)}\\ \\text{m}$ ✓`],
      },
      {
        label: 'c', marks: 1, ao: 'AO2',
        question: 'Determine the absolute uncertainty in this mean range.',
        numeric: d.num('dR'),
        markscheme: [`Half the range of the readings: $\\dfrac{${Math.max(...rd).toFixed(3)} - ${Math.min(...rd).toFixed(3)}}{2} = ${d.dp(d.r.dR.value, 4)}\\ \\text{m}$ (accept ${d.sf(d.r.dR.value, 2)} m or ${d.sf(d.r.dR.value, 3)} m) ✓`],
      },
      {
        label: 'd', marks: 2, ao: { AO1: 1, AO2: 1 },
        question: 'Show that, if air resistance is negligible, $R^2 = \\dfrac{2u^2}{g}h$, where $u$ is the launch speed.',
        markscheme: [
          'Vertical motion: $h = \\tfrac12 g t^2$, so $t = \\sqrt{\\dfrac{2h}{g}}$ ✓',
          'Horizontal motion at constant speed: $R = ut$, so $R^2 = u^2 \\times \\dfrac{2h}{g}$ ✓',
        ],
      },
      {
        label: 'e', marks: 2, ao: 'AO2', msFigure: 'graph-ms',
        question: 'Determine the gradient of the graph of $R^2$ against $h$.',
        numeric: d.num('gradient'),
        markscheme: [
          'Draws a line of best fit and uses two well-separated points on it ✓',
          `Gradient $= ${d.sf(d.r.gradient.value, 3)}\\ \\text{m}$ (accept ${d.sf(gLo, 3)} to ${d.sf(gHi, 3)}) ✓`,
        ],
      },
      {
        label: 'f', marks: 2, ao: 'AO2',
        question: 'Determine the launch speed $u$.',
        numeric: d.num('u', {
          mistakes: [
            { value: Math.sqrt(d.p.g * d.r.gradient.value), feedback: 'Check the factor of 2: the gradient is $2u^2/g$.' },
            { value: (d.p.g * d.r.gradient.value) / 2, feedback: 'That is $u^2$: take the square root.' },
          ],
        }),
        markscheme: [
          'Gradient $= \\dfrac{2u^2}{g}$, so $u = \\sqrt{\\dfrac{g \\times \\text{gradient}}{2}}$ ✓',
          `$u = ${d.sf(d.r.u.value, 3)}\\ \\text{m s}^{-1}$ (accept ${d.sf(uLo, 3)} to ${d.sf(uHi, 3)}; allow ECF from (e)) ✓`,
        ],
      },
      {
        label: 'g', marks: 2, ao: 'AO3', msFigure: 'graph-ms',
        asks: { conclusion: ['do not support', 'not supported', 'is above this range'] },
        question: `The manufacturer states that the launch speed is $${d.stated('claimedU')}\\ \\text{m s}^{-1}$. Discuss whether the data support this statement.`,
        markscheme: [
          `Uses the steepest and shallowest lines through the error bars (their own lines, or the uncertainty in the gradient) to find a range for $u$: the lines shown give about ${d.sf(lLo, 3)} to ${d.sf(lHi, 3)} $\\text{m s}^{-1}$ ✓`,
          `${d.stated('claimedU')} $\\text{m s}^{-1}$ is above this range, so the data do not support the statement (the launcher is slower than stated). Award this mark for a conclusion consistent with the candidate's own range ✓`,
        ],
      },
    ];
  },
};
