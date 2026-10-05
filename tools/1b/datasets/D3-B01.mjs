// D.3 Current balance: the force on a current-carrying wire in a magnetic field, F = BIL.
// Skills: force direction, gradient, proportionality (line through the origin), combining uncertainties.
import { currentBalance } from '../diagrams.mjs';
import { sigFig } from '../lib.mjs';

const L_PCT = 4; // percentage uncertainty in L = (5.0 ± 0.2) cm

const DIAGRAM_ALT = 'Front view of the apparatus. A U-shaped magnet stands on a top-pan balance, with its north pole on the left and its south pole on the right. '
  + 'A stiff wire, held by a clamp, runs between the poles at right angles to the page. The current in the wire is out of the page. The magnetic field between the poles points from left to right.';

export default {
  id: 'D3-B01',
  topic: 'D.3',
  difficulty: 2,
  context: 'experimental',
  skills: ['force-direction', 'gradient', 'proportionality', 'uncertainty-propagation'],
  seed: 7,

  // ----- 1. Physics model (SI units) -----
  // The balance reading changes by F/g; the column is in grams.
  params: { B: 0.064, L: 0.050, g: 9.8 },
  // Directions (x to the right, y up, z out of the page). F is worked out as I × B.
  vectors: { B: [1, 0, 0], I: [0, 0, 1], F: ['cross', 'I', 'B'] },

  // ----- 2. Measurements -----
  columns: {
    I: { kind: 'set', name: 'current', symbol: 'I', unit: 'A', values: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0], resolution: 0.01, uncertainty: 0.01 },
    m: {
      kind: 'measured', name: 'change in reading', symbol: '\\Delta m', symbolText: 'Δm', unit: 'g',
      model: (row, p) => ((p.B * row.I * p.L) / p.g) * 1000,
      noise: { type: 'gauss', sd: 0.007 }, resolution: 0.01, uncertainty: 0.02, // the reading flickers by about ±0.02 g
    },
  },
  graph: { x: 'I', y: 'm', fit: 'linear', band: true, zero: { x: true, y: true } },

  // ----- 3. Results: every answer comes from one of these -----
  results: {
    gradient: {
      unit: 'g A^-1', dims: { of: 'y/x' }, check: 'gradient',
      value: (d) => d.fit.m,
      range: (d, v) => d.widen(d.gradientRange(), v, 0.04),
    },
    B: {
      unit: 'T', dims: { of: 'y/x', times: 'm s^-2 m^-1' },
      value: (d) => (d.r.gradient.value * 1e-3 * d.p.g) / d.p.L,
      range: (d) => d.r.gradient.range.map((m) => (m * 1e-3 * d.p.g) / d.p.L),
    },
    // Percentage uncertainty in the gradient from the max/min lines, stated to 1 s.f. in the question.
    gradientPct: {
      unit: '%',
      value: (d) => (d.band ? Number(sigFig((((d.band.mMax - d.band.mMin) / 2) / d.fit.m) * 100, 1)) : NaN),
    },
    dB: {
      unit: 'T',
      value: (d) => (d.r.B.value * (d.r.gradientPct.value + L_PCT)) / 100,
      range: (d) => d.r.B.range.map((b) => (b * (d.r.gradientPct.value + L_PCT)) / 100),
    },
  },

  // ----- 4. What the questions claim (checked against the data) -----
  claims: [
    { type: 'linear', minR2: 0.995 },
    { type: 'throughOrigin', expect: true },
    { type: 'agrees', result: 'B', value: 0.064, expect: true },
    { type: 'trend', direction: 'increasing' },
  ],

  // ----- 5. Presentation -----
  figures: {
    diagram: () => ({
      svg: currentBalance(DIAGRAM_ALT),
      alt: DIAGRAM_ALT,
      caption: 'The wire is seen end-on: the dot shows that the current is out of the page. <span class="key-1">Blue</span> arrows: magnetic field.',
    }),
    'diagram-ms': () => ({
      svg: currentBalance(DIAGRAM_ALT + ' An arrow shows the force on the wire, upwards.', { showForce: true }),
      alt: DIAGRAM_ALT + ' An arrow shows the force on the wire, upwards.',
      caption: '<span class="key-2">Orange</span>: the magnetic force on the wire is upwards.',
    }),
  },
  intro: () => '<p>A student investigates the force on a current-carrying wire in a magnetic field. '
    + 'A magnet stands on a top-pan balance. A stiff, horizontal wire, held by a clamp, passes between the poles without touching the magnet. '
    + 'The length of wire in the field is $L = (5.0 \\pm 0.2)\\ \\text{cm}$.</p>'
    + '<p>The balance is set to zero with no current in the wire. The student then measures the change in the balance reading, $\\Delta m$, for different currents $I$.</p>',

  parts: (d) => {
    const [gLo, gHi] = d.r.gradient.range;
    const [bLo, bHi] = d.r.B.range;
    const pct = d.r.gradientPct.value;
    return [
      {
        label: 'a', marks: 2, msFigure: 'diagram-ms',
        question: 'State the direction of the magnetic force on the wire. Explain why the balance reading increases when there is a current in the wire.',
        markscheme: [
          'The force on the wire is upwards (from a hand rule, or the direction of $I\\vec{L} \\times \\vec{B}$) ✓',
          'By Newton\'s third law, the wire exerts an equal and opposite (downward) force on the magnet, so the reading increases ✓',
        ],
      },
      {
        label: 'b', marks: 2, msFigure: 'graph-ms',
        question: 'Determine the gradient of the graph of $\\Delta m$ against $I$.',
        numeric: d.num('gradient'),
        markscheme: [
          'Draws a line of best fit and uses two well-separated points on it ✓',
          `Gradient $= ${d.sf(d.r.gradient.value, 3)}\\ \\text{g A}^{-1}$ (accept ${d.sf(gLo, 3)} to ${d.sf(gHi, 3)}) ✓`,
        ],
      },
      {
        label: 'c', marks: 2,
        question: 'Determine the magnetic flux density $B$ between the poles.',
        numeric: d.num('B'),
        markscheme: [
          'Uses $F = \\Delta m\\, g$ with $\\Delta m$ in kg, so $B = \\dfrac{\\text{gradient} \\times 10^{-3} \\times 9.8}{L}$ ✓',
          `$B = ${d.sf(d.r.B.value, 2)}\\ \\text{T}$ (accept ${d.sf(bLo, 2)} to ${d.sf(bHi, 2)}; allow ECF from (b)) ✓`,
        ],
      },
      {
        label: 'd', marks: 2, msFigure: 'graph-ms',
        question: 'Discuss whether the data support the hypothesis that the force on the wire is proportional to the current.',
        markscheme: [
          'The points lie on a straight line, within their error bars ✓',
          'A straight line through all the error bars can pass through the origin, so the data support $F \\propto I$ ✓',
        ],
      },
      {
        label: 'e', marks: 2,
        question: `The percentage uncertainty in the gradient is ${pct} %. Determine the absolute uncertainty in your value of $B$.`,
        numeric: d.num('dB', {
          mistakes: [{ value: (d.r.B.value * pct) / 100, feedback: `That uses only the ${pct} % from the gradient. The length $L$ is uncertain too: add the percentage uncertainties.` }],
        }),
        markscheme: [
          `Percentage uncertainty in $L$ $= \\dfrac{0.2}{5.0} \\times 100 = ${L_PCT}\\ \\%$ ✓`,
          `Adds percentages: ${pct} % + ${L_PCT} % = ${pct + L_PCT} %, so $\\Delta B = ${d.sf(d.r.dB.value, 2)}\\ \\text{T}$ (allow ECF from (c)) ✓`,
        ],
      },
    ];
  },
};
