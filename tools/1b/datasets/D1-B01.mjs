// D.1 Orbits of Jupiter's moons from a published database: a log–log graph tests Kepler's third law and gives the
// mass of Jupiter (archetypes D1 and N4).
//
// External data (secondary): semi-major axes and sidereal orbital periods from NASA's Jovian Satellite Fact Sheet.
// Newly constructed here: the choice of moons, the rounding to the table's precision, the lg columns, the graph,
// the questions and the mark scheme.

const HIDE = 4; // Europa: students calculate its lg values
const LG_A_POINT = 6; // a point on the line at lg(a/km) = 6.000 (a = 1.0 × 10⁶ km)

export default {
  id: 'D1-B01',
  topic: 'D.1',
  difficulty: 3,
  context: 'observational',
  source: 'secondary',
  skills: ['database-data', 'log-log', 'power-law-exponent', 'kepler-third-law', 'value-from-a-graph', 'evaluate-data'],
  seed: 81,
  batch: 'batch-1',
  archetypes: ['D1', 'N4'],
  apparatus: 'published orbital data for the moons of Jupiter',
  features: ['graph:log'],
  provenance: {
    source: 'NASA Space Science Data Coordinated Archive (NSSDCA), Jovian Satellite Fact Sheet, by D. R. Williams (last updated 6 December 2023)',
    url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html',
    retrieved: '2026-10-06',
    taken: 'Semi-major axis (published in 10³ km, to 0.1 × 10³ km) and sidereal orbital period (days) of Metis, Amalthea, Thebe, Io, '
      + 'Europa, Ganymede, Callisto and Himalia. Himalia\'s eccentricity (0.162) is quoted in the mark scheme. Cross-checked against '
      + 'the semi-major axes in NASA JPL Solar System Dynamics, Planetary Satellite Mean Elements (https://ssd.jpl.nasa.gov/sats/elem/); '
      + 'JPL\'s period column there is not the sidereal period for the inner moons, so the fact sheet is used for periods.',
    transformations: 'Semi-major axes converted from 10³ km to km (×1000, exact); periods rounded to 0.001 day; lg(a/km) and lg(T/day) calculated to 3 decimal places. The selection of moons, the table layout, '
      + 'the graph and all questions are new; no published question, graph or table layout is reproduced.',
  },
  originality: 'Database plus log–log analysis is also the structure of a Nov 2025 TZ3 Paper 1B question (stars and the Stefan–Boltzmann '
    + 'law, with a calculator regression line). This dataset uses a different context (moons and Kepler\'s third law), a hand-drawn '
    + 'line read at a point instead of a regression equation, and different parts (completing logs, justifying the log–log choice, the '
    + 'exponent test, a mass from the graph, evaluating database data). Data values are public scientific data, credited above.',

  physics: {
    scenario: 'Eight moons of Jupiter, from the small inner moons to the distant Himalia, orbit Jupiter. Their published semi-major axes a '
      + 'and sidereal periods T are compared with the law for circular orbits.',
    principles: [
      'Newton\'s law of gravitation provides the centripetal force: GMm/r² = mv²/r (D.1)',
      'v = 2πr/T, giving Kepler\'s third law T² = 4π²r³/(GM) (D.1)',
      'Logarithms: if T = ka^n then lg T = n lg a + lg k (Tool 3)',
    ],
    assumptions: [
      'Orbits are circular with radius equal to the semi-major axis a (eccentricities are small, except Himalia: 0.16)',
      'Each moon\'s mass is negligible compared with Jupiter\'s',
      'Jupiter acts as a point mass (its flattening slightly shortens the periods of the innermost moons)',
    ],
    derivation: [
      'T = 2π a^{3/2}/√(GM)',
      'lg T = 1.5 lg a + lg(2π/√(GM)): a straight line of gradient 1.5 on a log–log graph',
      'From any point (a, T) on the line: M = 4π²a³/(GT²)',
    ],
    relationship: 'T = 2π√(a³/(GM))',
    params: {
      G: { value: 6.67e-11, unit: 'N m^2 kg^-2', range: [6.67e-11, 6.67e-11], note: 'data booklet value' },
      M: { value: 1.898e27, unit: 'kg', range: [1.85e27, 1.95e27], note: 'mass of Jupiter (NASA Jupiter fact sheet: 1898.13 × 10²⁴ kg)' },
    },
  },

  columns: {
    a: {
      kind: 'set', name: 'semi-major axis', symbol: 'a', unit: 'km', resolution: 100,
      values: [128000, 181400, 221900, 421800, 671100, 1070400, 1882700, 11461000],
    },
    T: {
      kind: 'catalogue', name: 'orbital period', symbol: 'T', unit: 'day', resolution: 0.001,
      values: [0.294779, 0.498179, 0.6745, 1.769138, 3.551181, 7.154553, 16.689017, 250.5662],
      model: { law: 'kepler-period', inputs: { r: 'row.a', G: 'p.G', M: 'p.M' } },
      expect: [0.2, 300],
      agree: 0.01,
      agreeReason: 'real orbits are slightly elliptical and are disturbed by Jupiter\'s flattening and by the other moons; G and M are rounded. '
        + 'Each published period is within 0.4 % of the circular-orbit model.',
    },
    lga: {
      kind: 'derived', name: 'log of semi-major axis', symbol: '\\lg(a/\\text{km})', symbolText: 'lg(a/km)', unit: '', dp: 3,
      value: (row) => Math.log10(row.a), hide: [HIDE],
    },
    lgT: {
      kind: 'derived', name: 'log of period', symbol: '\\lg(T/\\text{day})', symbolText: 'lg(T/day)', unit: '', dp: 3,
      value: (row) => Math.log10(row.T), hide: [HIDE],
    },
  },
  tableCaption: 'Moons of Jupiter, in order of distance from Jupiter: Metis, Amalthea, Thebe, Io, Europa, Ganymede, Callisto and Himalia. '
    + 'Data: NASA Jovian Satellite Fact Sheet.',
  graph: { x: 'lga', y: 'lgT', fit: 'linear', omit: [HIDE] },
  present: ['table', 'graph'],

  results: {
    lgaHidden: { unit: '', value: (d) => Math.log10(d.rows[HIDE].a) },
    lgTHidden: { unit: '', value: (d) => Math.log10(d.rows[HIDE].T) },
    gradient: { unit: '', check: 'gradient', value: (d) => d.fit.m, range: (d, v) => d.widen(null, v, 0.02) },
    lgTpoint: { unit: '', value: (d) => d.fit.m * LG_A_POINT + d.fit.c },
    Tpoint: { unit: 's', value: (d) => 10 ** d.r.lgTpoint.value * 86400 },
    M: {
      unit: 'kg', estimates: 'M', tolerance: 0.005,
      value: (d) => (4 * Math.PI ** 2 * (10 ** LG_A_POINT * 1000) ** 3) / (d.p.G * d.r.Tpoint.value ** 2),
      range: (d, v) => d.widen(null, v, 0.08),
    },
    aRatio: { unit: '', value: (d) => d.rows[7].a / d.rows[0].a },
    tRatio: { unit: '', value: (d) => d.rows[7].T / d.rows[0].T },
  },

  claims: [
    { type: 'linear', minR2: 0.9999 },
    { type: 'agrees', result: 'gradient', value: 1.5, expect: true },
    { type: 'trend', direction: 'increasing' },
  ],

  stated: {
    G: { value: 6.67, dp: 2, unit: 'N m^2 kg^-2 (× 10⁻¹¹)', source: 'data booklet: G = 6.67 × 10⁻¹¹ N m² kg⁻²', from: (p) => p.G / 1e-11 },
    n: { value: 1.5, dp: 1, unit: '', source: 'Kepler\'s third law: T² ∝ a³ means T ∝ a^1.5' },
    eHim: { value: 0.16, dp: 2, unit: '', source: 'NASA Jovian Satellite Fact Sheet: Himalia eccentricity 0.162' },
  },

  intro: () => '<p>The table gives the semi-major axis $a$ (the mean orbital radius) and the orbital period $T$ of eight moons of Jupiter, '
    + 'taken from a NASA database. A student investigates whether the moons obey Kepler\'s third law, $T^2 \\propto a^3$.</p>'
    + '<p>The graph shows $\\lg(T/\\text{day})$ against $\\lg(a/\\text{km})$. The point for Europa has not been plotted.</p>',

  parts: (d) => [
    {
      label: 'a', marks: 2, ao: 'AO2',
      question: 'Calculate the two missing values for Europa.',
      markscheme: [
        `$\\lg(a/\\text{km}) = \\lg(${d.text('a', HIDE)}) = ${d.dp(d.r.lgaHidden.value, 3)}$ ✓`,
        `$\\lg(T/\\text{day}) = \\lg(${d.text('T', HIDE)}) = ${d.dp(d.r.lgTHidden.value, 3)}$ ✓`,
      ],
    },
    {
      label: 'b', marks: 2, ao: 'AO3',
      question: 'Suggest two reasons why a graph of $\\lg T$ against $\\lg a$ is used for these data, rather than a graph of $T$ against $a$.',
      markscheme: [
        `The values cover a very wide range ($a$ by a factor of about ${d.sf(d.r.aRatio.value, 2)}, $T$ by about ${d.sf(d.r.tRatio.value, 2)}): on ordinary axes most points would be crowded near the origin ✓`,
        'If $T = ka^n$, then $\\lg T = n\\lg a + \\lg k$: a straight line whose gradient is the power $n$, which can be tested directly ✓',
      ],
    },
    {
      label: 'c', marks: 2, ao: 'AO2', msFigure: 'graph-ms',
      question: 'Determine the gradient of the graph.',
      numeric: d.num('gradient'),
      markscheme: ['Line of best fit; gradient from two well-separated points on the line ✓', `Gradient $= ${d.sf(d.r.gradient.value, 3)}$ (accept ${d.sf(d.r.gradient.range[0], 3)} to ${d.sf(d.r.gradient.range[1], 3)}) ✓`],
    },
    {
      label: 'd', marks: 2, ao: 'AO3',
      question: 'Deduce whether the data support Kepler\'s third law.',
      markscheme: [
        `$T^2 \\propto a^3$ means $T \\propto a^{3/2}$, so the gradient should be ${d.stated('n')} ✓`,
        'The gradient found is equal to this, within the precision of reading the graph, so the data support the law ✓',
      ],
    },
    {
      label: 'e', marks: 3, ao: 'AO2', msFigure: 'graph-ms',
      question: `For a circular orbit, $T^2 = \\dfrac{4\\pi^2a^3}{GM}$, where $M$ is the mass of Jupiter and $G = ${d.stated('G')} \\times 10^{-11}\\ \\text{N m}^2\\,\\text{kg}^{-2}$. `
        + 'Use a point on the line of best fit to determine $M$.',
      numeric: d.num('M'),
      markscheme: [
        `Reads a point on the line, for example $\\lg(a/\\text{km}) = ${d.dp(LG_A_POINT, 3)}$ gives $\\lg(T/\\text{day}) = ${d.dp(d.r.lgTpoint.value, 3)}$ ✓`,
        `Converts to SI: $a = ${d.dp(1, 1)} \\times 10^{9}\\ \\text{m}$ and $T = ${d.sf(d.r.Tpoint.value, 3)}\\ \\text{s}$ ✓`,
        `$M = \\dfrac{4\\pi^2a^3}{GT^2} = ${d.sci(d.r.M.value, 2)}\\ \\text{kg}$ (accept $${d.sci(d.r.M.range[0], 2)}$ to $${d.sci(d.r.M.range[1], 2)}\\ \\text{kg}$; allow ECF from the point read) ✓`,
      ],
    },
    {
      label: 'f', marks: 1, ao: 'AO3',
      question: 'The data come from a database, so the graph has no error bars. Suggest one reason why the gradient could still differ slightly from the value predicted by Kepler\'s third law.',
      markscheme: [`Any one of: the orbits are not perfect circles (Himalia's eccentricity is about ${d.stated('eHim')}) / the moons pull on each other / Jupiter is not a perfect sphere, so it does not act exactly as a point mass ✓`],
    },
  ],
};
