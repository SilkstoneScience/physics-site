// C.4 Standing waves on a string: frequency of the first harmonic for different lengths.
// f₁ = (1/2L)√(T/μ), so f against 1/L is a straight line through the origin with gradient ½√(T/μ).
// v = √(T/μ) is not on the SL syllabus, so the question gives it (an unfamiliar-context equation).
// Skills: linearising (f against 1/L), gradient, deducing μ, percentage uncertainty, predicting a higher harmonic.
import { vibratingString } from '../diagrams.mjs';

const M = 0.2; // hanging mass (kg)
const G = 9.8;
const MU = 1.2e-3; // mass per unit length (kg m⁻¹)
const L_PREDICT = 0.8; // length used for the third-harmonic prediction (m)
const F3_MODEL = (3 / (2 * L_PREDICT)) * Math.sqrt((M * G) / MU); // the model's own third harmonic at that length

const ALT = 'A string runs horizontally from a vibration generator on the left, over a pulley on the right, to a hanging mass M. '
  + 'The length L of string between the vibration generator and the pulley vibrates as a standing wave.';

export default {
  id: 'C4-B01',
  topic: 'C.4',
  difficulty: 2,
  context: 'experimental',
  skills: ['linearisation', 'gradient', 'given-equation', 'percentage-uncertainty', 'prediction'],
  seed: 9,
  batch: 'pilot',
  archetypes: ['N1', 'G3'],
  apparatus: 'vibration generator, string, pulley and hanging mass',
  originality: 'Standing waves on a string are common; May 2023 TZ1 Section A used a similar rig but varied the hanging mass against wavelength squared. This dataset varies length at fixed tension: own variables, numbers and sequence.',

  // ----- 1. Physics model -----
  physics: {
    scenario: 'A string is driven by a vibration generator at one end and passes over a pulley to a hanging mass, which sets the tension. '
      + 'For each length L between the vibration generator and the pulley, the frequency is adjusted until the string vibrates in its first harmonic.',
    principles: [
      'A standing wave on a string fixed at both ends has nodes at both ends (C.4)',
      'Wave equation: v = fλ (C.2)',
      'Wave speed on a stretched string: v = √(T/μ), given in the question (not on the syllabus)',
      'The tension equals the weight of the hanging mass: T = Mg (frictionless pulley, mass at rest)',
    ],
    assumptions: [
      'The ends at the vibration generator and at the pulley are nodes (the generator\'s own movement is negligible)',
      'The pulley is frictionless, so the tension is Mg all along the string',
      'The string is uniform and does not stretch noticeably, so μ is constant',
      'The first harmonic is identified as the frequency of largest amplitude with a single loop',
    ],
    derivation: [
      'Nodes at both ends: the first harmonic is half a wavelength, so λ = 2L',
      'f = v/λ = (1/2L)√(T/μ), with T = Mg',
      'A graph of f against 1/L is a straight line through the origin with gradient k = ½√(T/μ), so μ = T/(4k²)',
      'The nth harmonic has L = nλ/2, so f_n = n f₁: at a given length the third harmonic is 3 f₁',
    ],
    relationship: 'f₁ = (1/2L)√(Mg/μ)',
    params: {
      M: { value: M, unit: 'kg', range: [0.05, 1], note: 'hanging mass' },
      g: { value: G, unit: 'm s^-2', range: [9.8, 9.8], note: 'data booklet value' },
      mu: { value: MU, unit: 'kg m^-1', range: [2e-4, 5e-3], note: 'thin elastic cord' },
    },
  },

  // ----- 2. Measurements -----
  columns: {
    L: { kind: 'set', name: 'length', symbol: 'L', unit: 'm', values: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0], resolution: 0.001, uncertainty: 0.002 },
    invL: {
      kind: 'derived', name: 'reciprocal of length', symbol: '1/L', symbolText: '1/L', unit: 'm^-1', dp: 3, uncSymbol: '\\Delta(1/L)',
      value: (row) => 1 / row.L,
      propagation: { form: 'product', terms: [{ of: 'L', n: -1 }] }, // Δ(1/L)/(1/L) = ΔL/L, so Δ(1/L) = ΔL/L²
    },
    f: {
      kind: 'measured', name: 'frequency', symbol: 'f', unit: 'Hz',
      model: { law: 'string-harmonic', inputs: { n: { value: 1, unit: '' }, T: { law: 'weight', inputs: { m: 'p.M', g: 'p.g' } }, mu: 'p.mu', L: 'row.L' } },
      expect: [10, 60],
      measurement: {
        instrument: 'signal generator driving the vibration generator; frequency display resolution 0.1 Hz',
        reading: 'the frequency at which the single loop has its largest amplitude',
        noise: 'the largest amplitude is judged by eye, so repeated settings differ by a few tenths of a hertz: normal scatter, standard deviation 0.25 Hz',
      },
      noise: { type: 'gauss', sd: 0.25 }, resolution: 0.1, uncertainty: 0.5,
    },
  },
  graph: { x: 'invL', y: 'f', fit: 'linear', band: true, xErrorBars: true, zero: { x: true, y: true } },

  // ----- 3. Results -----
  results: {
    gradient: {
      unit: 'm s^-1', dims: { of: 'y/x' }, check: 'gradient',
      value: (d) => d.fit.m,
      range: (d, v) => d.widen(d.gradientRange(), v, 0.04),
    },
    mu: {
      unit: 'kg m^-1', estimates: 'mu',
      value: (d) => (d.p.M * d.p.g) / (4 * d.r.gradient.value ** 2),
      range: (d) => d.r.gradient.range.map((k) => (d.p.M * d.p.g) / (4 * k ** 2)).reverse(),
    },
    pctInvL: { unit: '%', value: (d) => (0.002 / d.rows[0].L) * 100 },
    f3: {
      unit: 'Hz',
      value: (d) => 3 * (d.fit.m / L_PREDICT + d.fit.c),
      range: (d, v) => {
        const at = (line) => 3 * (line.m / L_PREDICT + line.c);
        return d.widen(d.band ? [Math.min(at(d.band.steep), at(d.band.shallow)), Math.max(at(d.band.steep), at(d.band.shallow))] : null, v, 0.03);
      },
    },
  },

  // ----- 4. Claims -----
  claims: [
    { type: 'linear', minR2: 0.995 },
    { type: 'throughOrigin', expect: true },
    { type: 'agrees', result: 'mu', value: MU, expect: true },
    { type: 'agrees', result: 'f3', value: F3_MODEL, expect: true },
    { type: 'trend', direction: 'increasing' },
  ],
  diagramChecks: [{ figure: 'diagram', harmonic: 1 }, { figure: 'diagram-ms', harmonic: 3 }],

  // ----- 5. Presentation -----
  figures: {
    diagram: () => ({ svg: vibratingString(ALT + ' It is shown in its first harmonic: one loop.', { n: 1 }), alt: ALT + ' It is shown in its first harmonic: one loop.', caption: 'The string vibrating in its first harmonic.' }),
    'diagram-ms': () => ({
      svg: vibratingString(ALT + ' It is shown in its third harmonic: three loops, with nodes N and antinodes A.', { n: 3, labelNodes: true }),
      alt: ALT + ' It is shown in its third harmonic: three loops, with nodes N and antinodes A.',
      caption: 'Third harmonic: three loops, <span class="key-2">N</span> nodes and <span class="key-2">A</span> antinodes.',
    }),
  },
  intro: (d) => '<p>A student investigates standing waves on a string. The string is attached to a vibration generator, passes over a pulley '
    + `and supports a hanging mass $M = ${d.dp(d.p.M, 3)}\\ \\text{kg}$, which keeps the tension $T$ in the string constant.</p>`
    + '<p>For different lengths $L$ of string between the vibration generator and the pulley, the student adjusts the frequency $f$ '
    + 'until the string vibrates in its first harmonic.</p>'
    + '<p>The speed of a wave on a string is $v = \\sqrt{\\dfrac{T}{\\mu}}$, where $\\mu$ is the mass per unit length of the string.</p>',

  parts: (d) => {
    const [gLo, gHi] = d.r.gradient.range;
    const [mLo, mHi] = d.r.mu.range;
    const [fLo, fHi] = d.r.f3.range;
    const T = d.p.M * d.p.g;
    const f1 = d.fit.m / L_PREDICT + d.fit.c;
    return [
      {
        label: 'a', marks: 1, ao: 'AO2',
        question: 'Identify one variable that the student must keep constant so that the wave speed is the same for every length.',
        markscheme: ['The tension / the hanging mass (or: the same string, so the same $\\mu$) ✓'],
      },
      {
        label: 'b', marks: 2, ao: { AO1: 1, AO2: 1 },
        question: 'Show that the frequency of the first harmonic is $f = \\dfrac{1}{2L}\\sqrt{\\dfrac{T}{\\mu}}$.',
        markscheme: [
          'There are nodes at both ends, so the first harmonic is half a wavelength: $\\lambda = 2L$ ✓',
          '$f = \\dfrac{v}{\\lambda} = \\dfrac{1}{2L}\\sqrt{\\dfrac{T}{\\mu}}$ ✓',
        ],
      },
      {
        label: 'c', marks: 2, ao: 'AO2', msFigure: 'graph-ms',
        question: 'Determine the gradient of the graph of $f$ against $1/L$.',
        numeric: d.num('gradient'),
        markscheme: [
          'Draws a line of best fit and uses two well-separated points on it ✓',
          `Gradient $= ${d.sf(d.r.gradient.value, 3)}\\ \\text{m s}^{-1}$ (accept ${d.sf(gLo, 3)} to ${d.sf(gHi, 3)}) ✓`,
        ],
      },
      {
        label: 'd', marks: 2, ao: 'AO2',
        question: 'Determine the mass per unit length $\\mu$ of the string.',
        numeric: d.num('mu', {
          mistakes: [{ value: T / d.r.gradient.value ** 2, feedback: 'The gradient is $\\tfrac12\\sqrt{T/\\mu}$, not $\\sqrt{T/\\mu}$: check the factor of 4.' }],
        }),
        markscheme: [
          `Gradient $= \\tfrac12\\sqrt{\\dfrac{T}{\\mu}}$ with $T = Mg = ${d.dp(T, 2)}\\ \\text{N}$, so $\\mu = \\dfrac{T}{4 \\times \\text{gradient}^2}$ ✓`,
          `$\\mu = ${d.sf(d.r.mu.value, 2)}\\ \\text{kg m}^{-1}$ (accept ${d.sf(mLo, 2)} to ${d.sf(mHi, 2)}; allow ECF from (c)) ✓`,
        ],
      },
      {
        label: 'e', marks: 1, ao: 'AO2',
        question: `Calculate the percentage uncertainty in $1/L$ for $L = ${d.text('L', 0)}\\ \\text{m}$.`,
        numeric: d.num('pctInvL'),
        markscheme: [`The percentage uncertainty in $1/L$ equals that in $L$: $\\dfrac{0.002}{${d.text('L', 0)}} \\times 100 = ${d.sf(d.r.pctInvL.value, 2)}\\ \\%$ ✓`],
      },
      {
        label: 'f', marks: 2, ao: { AO2: 1, AO3: 1 }, msFigure: 'diagram-ms',
        question: `The student sets $L = ${d.dp(L_PREDICT, 3)}\\ \\text{m}$ and increases the frequency until the string vibrates in its third harmonic. Use the graph to predict this frequency.`,
        numeric: d.num('f3', {
          mistakes: [{ value: f1, feedback: 'That is the first harmonic. The third harmonic has three loops, so its frequency is three times larger.' }],
        }),
        markscheme: [
          `Reads $f_1 \\approx ${d.sf(f1, 3)}\\ \\text{Hz}$ at $1/L = ${d.dp(1 / L_PREDICT, 2)}\\ \\text{m}^{-1}$ ✓`,
          `Third harmonic: $f_3 = 3f_1 = ${d.sf(d.r.f3.value, 3)}\\ \\text{Hz}$ (accept ${d.sf(fLo, 3)} to ${d.sf(fHi, 3)}) ✓`,
        ],
      },
    ];
  },
};
