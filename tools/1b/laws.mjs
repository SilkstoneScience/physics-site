// Vetted physics laws for Paper 1B datasets. A dataset's physics model must be built from these
// laws (see "model" in tools/1b/README.md), never from a formula typed into the dataset.
// Each law has SI input and output units (checked whenever the law is used), hand-worked reference
// values and limiting cases. tools/1b/test.mjs checks every law, including that it is dimensionally
// consistent (rescaling the units of length, mass, time, current and temperature rescales the
// output correctly). Add a law only together with its reference values and limiting cases.
//
// limits: { name, inputs, output } compares f(inputs) with output;
//         { name, check: (f) => true/false } for behaviour such as "doubling I doubles F".

const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

export const LAWS = {
  'force-on-wire': {
    title: 'Force on a current-carrying conductor in a magnetic field',
    statement: 'F = BIL sin θ, in the direction of IL × B',
    syllabus: 'D.3',
    inputs: { B: 'T', I: 'A', L: 'm', theta: '' },
    defaults: { theta: Math.PI / 2 },
    output: 'N',
    f: ({ B, I, L, theta }) => B * I * L * Math.sin(theta),
    reference: [
      { inputs: { B: 0.1, I: 2, L: 0.05 }, output: 0.01, note: '0.1 × 2 × 0.05 = 0.01 N' },
      { inputs: { B: 0.1, I: 2, L: 0.05, theta: Math.PI / 6 }, output: 0.005, note: 'sin 30° = 0.5' },
    ],
    limits: [
      { name: 'no current, no force', inputs: { B: 0.1, I: 0, L: 0.05 }, output: 0 },
      { name: 'wire parallel to the field: no force', inputs: { B: 0.1, I: 2, L: 0.05, theta: 0 }, output: 0 },
      { name: 'reversing the current reverses the force', check: (f) => near(f({ B: 0.1, I: -2, L: 0.05 }), -f({ B: 0.1, I: 2, L: 0.05 })) },
      { name: 'force is proportional to the current', check: (f) => near(f({ B: 0.1, I: 4, L: 0.05 }), 2 * f({ B: 0.1, I: 2, L: 0.05 })) },
    ],
  },

  'balance-reading': {
    title: 'Change in a top-pan balance reading caused by an extra vertical force',
    statement: 'Δm = F / g (a balance shows the normal force divided by g, as a mass)',
    syllabus: 'A.2',
    inputs: { F: 'N', g: 'm s^-2' },
    output: 'kg',
    f: ({ F, g }) => F / g,
    reference: [{ inputs: { F: 0.0098, g: 9.8 }, output: 0.001, note: '9.8 mN reads as 1 g' }],
    limits: [
      { name: 'no extra force, no change in reading', inputs: { F: 0, g: 9.8 }, output: 0 },
      { name: 'an upward force on the balance lowers the reading', check: (f) => f({ F: -0.01, g: 9.8 }) < 0 },
    ],
  },

  'terminal-pd': {
    title: 'Terminal potential difference of a cell with internal resistance',
    statement: 'V = ε − Ir (from ε = I(R + r) and V = IR)',
    syllabus: 'B.5',
    inputs: { emf: 'V', I: 'A', r: 'Ω' },
    output: 'V',
    f: ({ emf, I, r }) => emf - I * r,
    reference: [{ inputs: { emf: 1.5, I: 0.5, r: 0.4 }, output: 1.3, note: '1.5 − 0.5 × 0.4 = 1.3 V' }],
    limits: [
      { name: 'open circuit (I = 0): V equals the emf', inputs: { emf: 1.5, I: 0, r: 0.4 }, output: 1.5 },
      { name: 'short circuit (I = ε/r): V is zero', inputs: { emf: 1.5, I: 3.75, r: 0.4 }, output: 0 },
      { name: 'ideal cell (r = 0): V equals the emf at any current', inputs: { emf: 1.5, I: 2, r: 0 }, output: 1.5 },
    ],
  },

  'count-rate': {
    title: 'Count rate from a decaying source at an instant',
    statement: 'R = R₀ 2^(−t/T½)',
    syllabus: 'E.3',
    inputs: { R0: 's^-1', t: 's', T: 's' },
    output: 's^-1',
    f: ({ R0, t, T }) => R0 * 2 ** (-t / T),
    reference: [{ inputs: { R0: 40, t: 150, T: 75 }, output: 10, note: 'two half-lives: 40 → 20 → 10' }],
    limits: [
      { name: 't = 0 gives R₀', inputs: { R0: 40, t: 0, T: 75 }, output: 40 },
      { name: 'one half-life halves the rate', inputs: { R0: 40, t: 75, T: 75 }, output: 20 },
      { name: 'a very long half-life gives a constant rate', check: (f) => Math.abs(f({ R0: 40, t: 100, T: 1e15 }) - 40) < 1e-9 },
    ],
  },

  'counts-in-interval': {
    title: 'Counts recorded from a decaying source plus background in the interval from t to t + Δt',
    statement: 'N = (R₀T½/ln 2)(2^(−t/T½) − 2^(−(t+Δt)/T½)) + bΔt (the count rate added up over the interval)',
    syllabus: 'E.3',
    inputs: { R0: 's^-1', T: 's', b: 's^-1', t: 's', dt: 's' },
    output: '',
    // Written as 2^(−t/T) × (1 − 2^(−Δt/T)), with expm1, so it stays accurate when Δt ≪ T½.
    f: ({ R0, T, b, t, dt }) => ((R0 * T) / Math.LN2) * 2 ** (-t / T) * -Math.expm1((-Math.LN2 * dt) / T) + b * dt,
    reference: [
      { inputs: { R0: 40, T: 75, b: 0, t: 0, dt: 75 }, output: (40 * 75 * 0.5) / Math.LN2, note: '40 × 75 / ln 2 × (1 − ½) = 2164.0 counts' },
      { inputs: { R0: 0, T: 75, b: 0.4, t: 0, dt: 300 }, output: 120, note: 'background only: 0.4 × 300' },
    ],
    limits: [
      { name: 'a very long half-life gives (R₀ + b)Δt', check: (f) => Math.abs(f({ R0: 10, T: 1e12, b: 0.4, t: 50, dt: 10 }) - 104) < 1e-6 },
      { name: 'a very short interval gives the instantaneous rate × Δt', check: (f) => Math.abs(f({ R0: 40, T: 75, b: 0, t: 75, dt: 1e-6 }) / 1e-6 - 20) < 1e-4 },
      { name: 'an interval starting one half-life later gives half the source counts', check: (f) => near(f({ R0: 40, T: 75, b: 0, t: 75, dt: 10 }), f({ R0: 40, T: 75, b: 0, t: 0, dt: 10 }) / 2) },
      { name: 'counts over a long interval are fewer than the instantaneous rate at the start × Δt', check: (f) => f({ R0: 40, T: 75, b: 0, t: 0, dt: 10 }) < 400 },
    ],
  },

  'projectile-horizontal-range': {
    title: 'Horizontal distance travelled by a projectile launched horizontally (no air resistance)',
    statement: 'R = u√(2h/g), from h = ½gt² (vertical) and R = ut (horizontal)',
    syllabus: 'A.1',
    inputs: { u: 'm s^-1', h: 'm', g: 'm s^-2' },
    output: 'm',
    f: ({ u, h, g }) => u * Math.sqrt((2 * h) / g),
    reference: [{ inputs: { u: 3, h: 4.9, g: 9.8 }, output: 3, note: 't = √(2 × 4.9 / 9.8) = 1 s, so R = 3 × 1 = 3 m' }],
    limits: [
      { name: 'launched from floor level (h = 0): no horizontal distance', inputs: { u: 3, h: 0, g: 9.8 }, output: 0 },
      { name: 'dropped (u = 0): lands directly below', inputs: { u: 0, h: 1, g: 9.8 }, output: 0 },
      { name: 'four times the height doubles the range', check: (f) => near(f({ u: 3, h: 4, g: 9.8 }), 2 * f({ u: 3, h: 1, g: 9.8 })) },
      { name: 'range is proportional to launch speed', check: (f) => near(f({ u: 6, h: 1, g: 9.8 }), 2 * f({ u: 3, h: 1, g: 9.8 })) },
    ],
  },

  'weight': {
    title: 'Weight of a mass in a uniform gravitational field (for example the tension from a hanging mass)',
    statement: 'F = mg',
    syllabus: 'A.2',
    inputs: { m: 'kg', g: 'm s^-2' },
    output: 'N',
    f: ({ m, g }) => m * g,
    reference: [{ inputs: { m: 0.2, g: 9.8 }, output: 1.96, note: '0.2 × 9.8' }],
    limits: [{ name: 'no mass, no weight', inputs: { m: 0, g: 9.8 }, output: 0 }],
  },

  'string-harmonic': {
    title: 'Frequency of the nth harmonic of a string fixed at both ends',
    statement: 'f = n v / 2L with v = √(T/μ): nodes at both ends, so L = nλ/2',
    syllabus: 'C.4',
    inputs: { n: '', T: 'N', mu: 'kg m^-1', L: 'm' },
    output: 'Hz',
    f: ({ n, T, mu, L }) => (n / (2 * L)) * Math.sqrt(T / mu),
    reference: [{ inputs: { n: 1, T: 1.6, mu: 0.001, L: 1 }, output: 20, note: 'v = √(1.6/0.001) = 40 m s⁻¹, λ = 2 m, f = 20 Hz' }],
    limits: [
      { name: 'the third harmonic is three times the first', check: (f) => near(f({ n: 3, T: 1.6, mu: 0.001, L: 1 }), 3 * f({ n: 1, T: 1.6, mu: 0.001, L: 1 })) },
      { name: 'doubling the length halves the frequency', check: (f) => near(f({ n: 1, T: 1.6, mu: 0.001, L: 2 }), f({ n: 1, T: 1.6, mu: 0.001, L: 1 }) / 2) },
      { name: 'four times the tension doubles the frequency', check: (f) => near(f({ n: 1, T: 6.4, mu: 0.001, L: 1 }), 2 * f({ n: 1, T: 1.6, mu: 0.001, L: 1 })) },
      { name: 'a heavier string (4μ) halves the frequency', check: (f) => near(f({ n: 1, T: 1.6, mu: 0.004, L: 1 }), f({ n: 1, T: 1.6, mu: 0.001, L: 1 }) / 2) },
      { name: 'no tension, no wave: f = 0', inputs: { n: 1, T: 0, mu: 0.001, L: 1 }, output: 0 },
    ],
  },

  'uniform-counts': {
    title: 'Counts at a constant count rate (for example background radiation)',
    statement: 'N = R Δt',
    syllabus: 'E.3',
    inputs: { rate: 's^-1', dt: 's' },
    output: '',
    f: ({ rate, dt }) => rate * dt,
    reference: [{ inputs: { rate: 0.4, dt: 300 }, output: 120, note: '0.4 × 300' }],
    limits: [{ name: 'no time, no counts', inputs: { rate: 0.4, dt: 0 }, output: 0 }],
  },
};
