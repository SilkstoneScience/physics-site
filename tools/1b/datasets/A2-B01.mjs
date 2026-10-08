// A.2 A spring loaded through a hanger whose weight was left out of the recorded load: a systematic (zero) error
// that shifts the line but not its gradient (archetypes E1 and L2).
// Skills: recognising that the data are linear but not proportional, k from the gradient, explaining the offset
// physically, using the intercept to find the hanger's mass, why a single-reading F/x is wrong.

const LAST = 5;

export default {
  id: 'A2-B01',
  topic: 'A.2',
  difficulty: 2,
  context: 'experimental',
  skills: ['systematic-offset', 'not-proportional', 'gradient', 'intercept-meaning', 'single-reading-vs-gradient'],
  seed: 42,
  batch: 'batch-1',
  archetypes: ['E1', 'L2'],
  apparatus: 'spring with a hanger and slotted masses beside a metre rule',
  contextFamily: 'elastic-stretching',
  contextObjects: ['spring', 'slotted-masses', 'metre-rule'],
  originality: 'Hooke\'s-law springs are a standard practical, but no legacy Section A or 2025 Paper 1B question builds a question on '
    + 'an unrecorded hanger weight. Zero errors in legacy papers concern meters and microphones (May 2017 TZ2, May 2024 TZ1); this '
    + 'one is in the independent variable and is used to find a physical quantity. Own numbers and sequence.',

  physics: {
    scenario: 'A spring hangs from a clamp beside a vertical metre rule. Slotted masses are added to a hanger on the spring. The student '
      + 'measures the extension x from the position of the spring\'s end with nothing attached, but records as the load F only the weight '
      + 'of the slotted masses, not the weight of the hanger that carries them.',
    principles: ['Hooke\'s law: F = kx within the limit of proportionality (A.2)', 'Weight W = mg (A.2)'],
    assumptions: [
      'The spring obeys Hooke\'s law over the whole range of loads (no permanent stretching)',
      'The extension is measured from the end of the spring with nothing attached',
      'The true load is the weight of the slotted masses plus the weight of the hanger',
    ],
    derivation: [
      'True load = F + m_h g, where m_h is the mass of the hanger',
      'Hooke\'s law: x = (F + m_h g)/k = F/k + m_h g/k',
      'So x against F is a straight line of gradient 1/k with intercept m_h g/k on the x axis: linear but not proportional',
    ],
    relationship: 'x = F/k + m_h g/k',
    params: {
      k: { value: 25, unit: 'N m^-1', range: [5, 100], note: 'school extension spring' },
      mh: { value: 0.05, unit: 'kg', range: [0.01, 0.1], note: 'standard 50 g slotted-mass hanger' },
      g: { value: 9.8, unit: 'm s^-2', range: [9.8, 9.8], note: 'data booklet value' },
    },
  },

  columns: {
    F: { kind: 'set', name: 'load recorded', symbol: 'F', unit: 'N', values: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0], resolution: 0.01 },
    x: {
      kind: 'measured', name: 'extension', symbol: 'x', unit: 'mm',
      model: {
        law: 'hooke-extension',
        inputs: { F: { law: 'load-sum', inputs: { F1: 'row.F', F2: { law: 'weight', inputs: { m: 'p.mh', g: 'p.g' } } } }, k: 'p.k' },
      },
      expect: [30, 150],
      measurement: {
        instrument: 'metre rule, smallest division 1 mm, beside the spring',
        reading: 'position of the end of the spring with the load, minus its position with nothing attached',
        noise: 'judging the end of the spring against the scale (parallax, small bouncing): normal scatter with standard deviation 0.4 mm',
      },
      noise: { type: 'gauss', sd: 0.4 }, resolution: 1, uncertainty: 1,
      // T2 finds that 4 of the 5 steps are exactly 20 mm. Tried in Phase 12: a scatter of 0.7 mm (more pessimistic) breaks
      // the independent audit's recovery of k within the ±1 mm max/min lines, so the declared 0.4 mm stays.
      regularity: {
        accept: ['equal-steps'],
        reason: 'A metre rule read to the nearest millimetre with a scatter (0.4 mm) below one division: an ideal spring then reads '
          + 'exactly 20 mm more for most 0.5 N steps, as a real ruler would show. Flagged in the Batch 1 retrospective; the teacher decides.',
      },
    },
  },
  // errorBars 'too-small': ±1 mm is under 1 % of the axis, so bars would hide under the markers; the caption states it (P1).
  graph: { x: 'F', y: 'x', fit: 'linear', band: true, zero: { x: true, y: true }, errorBars: 'too-small' },

  results: {
    gradient: { unit: 'mm N^-1', dims: { of: 'y/x' }, check: 'gradient', value: (d) => d.fit.m, range: (d, v) => d.widen(d.gradientRange(), v, 0.04) },
    k: {
      unit: 'N m^-1', estimates: 'k',
      value: (d) => 1 / (d.r.gradient.value * 1e-3),
      range: (d) => d.r.gradient.range.map((m) => 1 / (m * 1e-3)).sort((a, b) => a - b),
    },
    intercept: { unit: 'mm', check: 'intercept', value: (d) => d.fit.c, range: (d, v) => d.widen(d.interceptRange(), v, 0.1) },
    mh: {
      unit: 'kg', estimates: 'mh',
      value: (d) => (d.r.intercept.value * 1e-3 * d.r.k.value) / d.p.g,
      range: (d) => {
        const vals = [];
        for (const c of d.r.intercept.range) for (const k of d.r.k.range) vals.push((c * 1e-3 * k) / d.p.g);
        return [Math.min(...vals), Math.max(...vals)];
      },
    },
    kWrong: { unit: 'N m^-1', value: (d) => d.rows[LAST].F / (d.rows[LAST].x * 1e-3) },
  },

  claims: [
    { type: 'linear', minR2: 0.995 },
    { type: 'throughOrigin', expect: false },
    { type: 'agrees', result: 'k', value: 25, expect: true },
    { type: 'trend', direction: 'increasing' },
  ],

  intro: () => '<p>A student investigates how the extension $x$ of a spring depends on the load $F$ on it. The spring hangs from a clamp '
    + 'beside a vertical metre rule. Slotted masses are added to a hanger attached to the spring.</p>'
    + '<p>The student measures the extension from the position of the end of the spring with nothing attached. The student records '
    + 'as $F$ the weight of the slotted masses only.</p>',

  parts: (d) => {
    const [kLo, kHi] = d.r.k.range;
    const [mLo, mHi] = d.r.mh.range;
    return [
      {
        label: 'a', marks: 2, ao: 'AO3', msFigure: 'graph-ms',
        reads: [{ figure: 'graph', x: 0, y: d.r.intercept.value }],
        question: 'Hooke\'s law suggests that $x$ is proportional to $F$. Explain how the graph shows that the student\'s values of $x$ are not proportional to $F$.',
        markscheme: [
          'The points lie on a straight line (each extension is uncertain by only ±1 mm) ✓',
          `The line does not pass through the origin: it meets the extension axis (at $F = 0$) at about ${d.sf(d.r.intercept.value, 2)} mm, far more than the ±1 mm uncertainty ✓`,
        ],
      },
      {
        label: 'b', marks: 2, ao: 'AO2', msFigure: 'graph-ms',
        question: 'Determine the spring constant $k$ of the spring.',
        numeric: d.num('k'),
        markscheme: [
          `Gradient $= \\dfrac{1}{k}$: about ${d.sf(d.r.gradient.value, 3)} $\\text{mm N}^{-1}$, converted to $\\text{m N}^{-1}$ ✓`,
          `$k = ${d.sf(d.r.k.value, 3)}\\ \\text{N m}^{-1}$ (accept ${d.sf(kLo, 3)} to ${d.sf(kHi, 3)}) ✓`,
        ],
      },
      {
        label: 'c', marks: 2, ao: 'AO3',
        question: 'Explain how leaving out the weight of the hanger accounts for the shape of the graph.',
        markscheme: [
          'The hanger\'s weight stretches the spring even when the recorded load is zero, so every extension is larger by the same amount ✓',
          'The line is shifted up by a constant amount ($m_h g/k$) but its gradient is unchanged ✓',
        ],
      },
      {
        label: 'd', marks: 2, ao: 'AO2', msFigure: 'graph-ms',
        reads: [{ figure: 'graph', x: 0, y: d.r.intercept.value }],
        question: 'Use the graph to determine the mass $m_h$ of the hanger.',
        numeric: d.num('mh'),
        markscheme: [
          `The intercept on the extension axis (at $F = 0$) is the extension caused by the hanger alone: about ${d.sf(d.r.intercept.value, 2)} mm $= \\dfrac{m_h g}{k}$ ✓`,
          `$m_h = ${d.sf(d.r.mh.value, 2)}\\ \\text{kg}$ (accept ${d.sf(mLo, 2)} to ${d.sf(mHi, 2)}; allow ECF from (b)) ✓`,
        ],
      },
      {
        label: 'e', marks: 2, ao: 'AO3',
        question: `Another student calculates $k$ as $\\dfrac{F}{x}$ using only the last row of the table. Calculate this value, and explain why it differs from your answer to (b).`,
        markscheme: [
          `$\\dfrac{F}{x} = \\dfrac{${d.text('F', LAST)}}{${d.text('x', LAST)} \\times 10^{-3}} = ${d.sf(d.r.kWrong.value, 3)}\\ \\text{N m}^{-1}$ ✓`,
          'It is too small: $x$ includes the extension caused by the hanger but $F$ does not include its weight. The gradient method is not affected by a constant offset ✓',
        ],
      },
    ];
  },
};
