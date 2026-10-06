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

  'count-rate-with-background': {
    title: 'Count rate recorded from a decaying source plus background, at an instant',
    statement: 'R = R₀ 2^(−t/T½) + b',
    syllabus: 'E.3',
    inputs: { R0: 's^-1', t: 's', T: 's', b: 's^-1' },
    output: 's^-1',
    f: ({ R0, t, T, b }) => R0 * 2 ** (-t / T) + b,
    reference: [{ inputs: { R0: 40, t: 150, T: 75, b: 0.4 }, output: 10.4, note: '40 → 20 → 10, plus 0.4 background' }],
    limits: [
      { name: 'long after: only the background', check: (f) => Math.abs(f({ R0: 40, t: 1e6, T: 75, b: 0.4 }) - 0.4) < 1e-12 },
      { name: 'no background: the source rate', inputs: { R0: 40, t: 75, T: 75, b: 0 }, output: 20 },
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

  'thermal-energy': {
    title: 'Energy transferred in changing the temperature of a substance',
    statement: 'Q = mcΔT (ΔT is a temperature difference)',
    syllabus: 'B.1',
    inputs: { m: 'kg', c: 'J kg^-1 ΔK^-1', dT: 'ΔK' },
    output: 'J',
    f: ({ m, c, dT }) => m * c * dT,
    reference: [{ inputs: { m: 0.5, c: 4200, dT: 10 }, output: 21000, note: '0.5 × 4200 × 10' }],
    limits: [
      { name: 'no temperature change, no energy', inputs: { m: 0.5, c: 4200, dT: 0 }, output: 0 },
      { name: 'cooling (negative ΔT) releases energy', check: (f) => f({ m: 0.5, c: 4200, dT: -10 }) < 0 },
      { name: 'twice the mass needs twice the energy', check: (f) => near(f({ m: 1, c: 4200, dT: 10 }), 2 * f({ m: 0.5, c: 4200, dT: 10 })) },
    ],
  },

  'pressure-law': {
    title: 'Pressure of a fixed mass of ideal gas at constant volume',
    statement: 'p = p₀T / T₀ (p/T is constant; T in kelvin, an absolute temperature)',
    syllabus: 'B.3',
    inputs: { p0: 'Pa', T0: 'K', T: 'K' },
    output: 'Pa',
    f: ({ p0, T0, T }) => (p0 * T) / T0,
    reference: [{ inputs: { p0: 100000, T0: 300, T: 450 }, output: 150000, note: '100 kPa × 450/300' }],
    limits: [
      { name: 'at the starting temperature, the starting pressure', inputs: { p0: 100000, T0: 300, T: 300 }, output: 100000 },
      { name: 'at absolute zero the pressure is zero', inputs: { p0: 100000, T0: 300, T: 0 }, output: 0 },
      { name: 'doubling the absolute temperature doubles the pressure', check: (f) => near(f({ p0: 1e5, T0: 300, T: 600 }), 2e5) },
    ],
  },

  'force-component': {
    title: 'Component of a force along a direction at angle θ to it',
    statement: 'F∥ = F cos θ',
    syllabus: 'A.2',
    inputs: { F: 'N', theta: 'rad' },
    output: 'N',
    f: ({ F, theta }) => F * Math.cos(theta),
    reference: [{ inputs: { F: 10, theta: Math.PI / 3 }, output: 5, note: 'cos 60° = 0.5' }],
    limits: [
      { name: 'along the force (θ = 0): the whole force', inputs: { F: 10, theta: 0 }, output: 10 },
      { name: 'at right angles (θ = 90°): no component', check: (f) => Math.abs(f({ F: 10, theta: Math.PI / 2 })) < 1e-12 },
    ],
  },

  'electrical-energy': {
    title: 'Energy transferred by an electrical heater',
    statement: 'E = VIt (power P = VI for a time t)',
    syllabus: 'B.5',
    inputs: { V: 'V', I: 'A', t: 's' },
    output: 'J',
    f: ({ V, I, t }) => V * I * t,
    reference: [{ inputs: { V: 12, I: 4, t: 600 }, output: 28800, note: '12 × 4 × 600' }],
    limits: [
      { name: 'no time, no energy', inputs: { V: 12, I: 4, t: 0 }, output: 0 },
      { name: 'energy is proportional to the time', check: (f) => near(f({ V: 12, I: 4, t: 1200 }), 2 * f({ V: 12, I: 4, t: 600 })) },
    ],
  },

  'electrical-power': {
    title: 'Power of an electrical heater',
    statement: 'P = VI',
    syllabus: 'B.5',
    inputs: { V: 'V', I: 'A' },
    output: 'W',
    f: ({ V, I }) => V * I,
    reference: [{ inputs: { V: 12, I: 3.5 }, output: 42, note: '12 × 3.5' }],
    limits: [
      { name: 'no current, no power', inputs: { V: 12, I: 0 }, output: 0 },
      { name: 'power is proportional to the current at constant p.d.', check: (f) => near(f({ V: 12, I: 7 }), 2 * f({ V: 12, I: 3.5 })) },
    ],
  },

  'temperature-after-heating': {
    title: 'Temperature of a body after it receives energy, with no energy lost',
    statement: 'θ = θ₀ + E/(mc), from Q = mcΔT with all the energy E staying in the body',
    syllabus: 'B.1',
    inputs: { theta0: 'K', E: 'J', m: 'kg', c: 'J kg^-1 ΔK^-1' },
    output: 'K',
    f: ({ theta0, E, m, c }) => theta0 + E / (m * c),
    reference: [{ inputs: { theta0: 293, E: 9000, m: 1, c: 900 }, output: 303, note: '9000 J raises 1 kg of aluminium (900 J kg⁻¹ K⁻¹) by 10 K' }],
    limits: [
      { name: 'no energy, no temperature change', inputs: { theta0: 293, E: 0, m: 1, c: 900 }, output: 293 },
      { name: 'twice the mass, half the temperature rise', check: (f) => near(f({ theta0: 0, E: 9000, m: 2, c: 900 }), f({ theta0: 0, E: 9000, m: 1, c: 900 }) / 2) },
    ],
  },

  'heating-with-loss': {
    title: 'Temperature of a heated body that loses energy to its surroundings at a rate proportional to its temperature excess',
    statement: 'θ = θ_r + (P/h)(1 − e^(−ht/(mc))), from mc dθ/dt = P − h(θ − θ_r) with θ = θ_r at t = 0 '
      + '(an empirical loss model, Newton\'s law of cooling, beyond the syllabus; it reduces to θ = θ_r + Pt/(mc) when h → 0)',
    syllabus: 'B.1',
    inputs: { thetaR: 'K', P: 'W', h: 'W ΔK^-1', m: 'kg', c: 'J kg^-1 ΔK^-1', t: 's' },
    output: 'K',
    // −expm1(−x) = 1 − e^(−x), accurate when x is small; h = 0 is handled as the no-loss limit.
    f: ({ thetaR, P, h, m, c, t }) => (h === 0 ? thetaR + (P * t) / (m * c) : thetaR + (P / h) * -Math.expm1((-h * t) / (m * c))),
    reference: [{ inputs: { thetaR: 293, P: 40, h: 0.4, m: 1, c: 4000, t: 10000 }, output: 293 + 100 * (1 - Math.exp(-1)), note: 'ht/mc = 1: rise = (P/h)(1 − 1/e) = 63.2 K' }],
    limits: [
      { name: 'no loss (h = 0): θ = θ_r + Pt/(mc)', inputs: { thetaR: 293, P: 40, h: 0, m: 1, c: 4000, t: 1000 }, output: 303 },
      { name: 'a tiny loss gives almost the no-loss value', check: (f) => Math.abs(f({ thetaR: 293, P: 40, h: 1e-9, m: 1, c: 4000, t: 1000 }) - 303) < 1e-6 },
      { name: 'losses always make the body cooler than with no loss', check: (f) => f({ thetaR: 293, P: 40, h: 0.4, m: 1, c: 4000, t: 1000 }) < 303 },
      { name: 'after a long time the temperature excess approaches P/h', check: (f) => Math.abs(f({ thetaR: 293, P: 40, h: 0.4, m: 1, c: 4000, t: 1e7 }) - 393) < 1e-6 },
    ],
  },

  'gate-time': {
    title: 'Time for a card of length L to pass through a light gate at constant speed',
    statement: 't = L/v (speed = distance / time; the speed is taken as constant while the card passes the gate)',
    syllabus: 'A.1',
    inputs: { L: 'm', v: 'm s^-1' },
    output: 's',
    f: ({ L, v }) => L / v,
    reference: [{ inputs: { L: 0.1, v: 0.5 }, output: 0.2, note: '0.100 m at 0.500 m s⁻¹' }],
    limits: [
      { name: 'twice the speed, half the time', check: (f) => near(f({ L: 0.1, v: 1 }), f({ L: 0.1, v: 0.5 }) / 2) },
      { name: 'twice the card length, twice the time', check: (f) => near(f({ L: 0.2, v: 0.5 }), 2 * f({ L: 0.1, v: 0.5 })) },
    ],
  },

  'hooke-extension': {
    title: 'Extension of a spring obeying Hooke\'s law',
    statement: 'x = F/k (Hooke\'s law, F = kx, within the limit of proportionality)',
    syllabus: 'A.2',
    inputs: { F: 'N', k: 'N m^-1' },
    output: 'm',
    f: ({ F, k }) => F / k,
    reference: [{ inputs: { F: 2, k: 25 }, output: 0.08, note: '2 N on a 25 N m⁻¹ spring' }],
    limits: [
      { name: 'no load, no extension', inputs: { F: 0, k: 25 }, output: 0 },
      { name: 'extension is proportional to the load', check: (f) => near(f({ F: 4, k: 25 }), 2 * f({ F: 2, k: 25 })) },
    ],
  },

  'load-sum': {
    title: 'Total vertical load from two weights hanging together',
    statement: 'F = F₁ + F₂ (forces in the same direction add)',
    syllabus: 'A.2',
    inputs: { F1: 'N', F2: 'N' },
    output: 'N',
    f: ({ F1, F2 }) => F1 + F2,
    reference: [{ inputs: { F1: 1.5, F2: 0.49 }, output: 1.99, note: '1.5 + 0.49' }],
    limits: [{ name: 'adding nothing changes nothing', inputs: { F1: 1.5, F2: 0 }, output: 1.5 }],
  },

  'mass-spring-period': {
    title: 'Period of a mass oscillating on a spring',
    statement: 'T = 2π√((m + mₑ)/k): the SL result T = 2π√(m/k), with mₑ an effective extra mass for the moving spring itself '
      + '(about one third of the spring\'s mass; mₑ = 0 for an ideal, massless spring)',
    syllabus: 'C.1',
    inputs: { m: 'kg', me: 'kg', k: 'N m^-1' },
    defaults: { me: 0 },
    output: 's',
    f: ({ m, me, k }) => 2 * Math.PI * Math.sqrt((m + me) / k),
    reference: [{ inputs: { m: 0.25, me: 0, k: 25 * Math.PI ** 2 }, output: 0.2, note: 'm/k = 0.01/π², so T = 2π × 0.1/π = 0.2 s' }],
    limits: [
      { name: 'massless spring: the SL formula', check: (f) => near(f({ m: 0.4, k: 10 }), 2 * Math.PI * Math.sqrt(0.04)) },
      { name: 'four times the mass doubles the period (ideal spring)', check: (f) => near(f({ m: 0.8, k: 10 }), 2 * f({ m: 0.2, k: 10 })) },
      { name: 'T² is a straight line against m, crossing T² = 0 at m = −mₑ', check: (f) => Math.abs(f({ m: -0.02 + 1e-15, me: 0.02, k: 10 })) < 1e-6 },
    ],
  },

  'kepler-period': {
    title: 'Period of a circular orbit around a central mass M',
    statement: 'T = 2π√(r³/(GM)), from GMm/r² = mv²/r with v = 2πr/T (Kepler\'s third law: T² ∝ r³)',
    syllabus: 'D.1',
    inputs: { r: 'm', G: 'N m^2 kg^-2', M: 'kg' },
    output: 's',
    f: ({ r, G, M }) => 2 * Math.PI * Math.sqrt(r ** 3 / (G * M)),
    reference: [{ inputs: { r: 4.218e8, G: 6.674e-11, M: 1.898e27 }, output: 2 * Math.PI * Math.sqrt(4.218e8 ** 3 / (6.674e-11 * 1.898e27)), note: 'Io: about 1.77 days (1.53 × 10⁵ s)' }],
    limits: [
      { name: 'four times the radius gives eight times the period', check: (f) => near(f({ r: 4e8, G: 6.67e-11, M: 1.9e27 }), 8 * f({ r: 1e8, G: 6.67e-11, M: 1.9e27 })) },
      { name: 'four times the central mass halves the period', check: (f) => near(f({ r: 4e8, G: 6.67e-11, M: 7.6e27 }), f({ r: 4e8, G: 6.67e-11, M: 1.9e27 }) / 2) },
      { name: 'Io: period about 1.77 days', check: (f) => Math.abs(f({ r: 4.218e8, G: 6.674e-11, M: 1.898e27 }) / 86400 - 1.77) < 0.01 },
    ],
  },

  'wire-extension-beyond-limit': {
    title: 'Extension of a metal wire loaded beyond its limit of proportionality',
    statement: 'x = F/k for F ≤ F_p; x = F/k + β(F − F_p)² for F > F_p (Hooke\'s law up to the limit of proportionality F_p; '
      + 'beyond it an empirical extra extension as the metal starts to yield; beyond the syllabus)',
    syllabus: 'A.2',
    inputs: { F: 'N', k: 'N m^-1', Fp: 'N', beta: 'm N^-2' },
    output: 'm',
    f: ({ F, k, Fp, beta }) => F / k + (F > Fp ? beta * (F - Fp) ** 2 : 0),
    reference: [
      { inputs: { F: 40, k: 10000, Fp: 50, beta: 1e-6 }, output: 0.004, note: 'below the limit: Hooke\'s law, 40/10000' },
      { inputs: { F: 90, k: 10000, Fp: 50, beta: 1e-6 }, output: 0.009 + 0.0016, note: '90/10000 + 10⁻⁶ × 40²' },
    ],
    limits: [
      { name: 'no load, no extension', inputs: { F: 0, k: 10000, Fp: 50, beta: 1e-6 }, output: 0 },
      { name: 'at the limit of proportionality: still Hooke\'s law', inputs: { F: 50, k: 10000, Fp: 50, beta: 1e-6 }, output: 0.005 },
      { name: 'beyond the limit the extension exceeds the Hooke\'s-law value', check: (f) => f({ F: 70, k: 10000, Fp: 50, beta: 1e-6 }) > 0.007 },
      { name: 'β = 0: Hooke\'s law everywhere', inputs: { F: 90, k: 10000, Fp: 50, beta: 0 }, output: 0.009 },
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
