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

  // ===================== Batch 2 (Phase 14) =====================
  'bounce-height-ratio': {
    title: 'Peak height of a ball after n bounces, when each bounce keeps the same fraction of the energy',
    statement: 'hₙ = h₀ rⁿ (an empirical model, approved by the teacher on 8 October 2026: each impact keeps a constant fraction r '
      + 'of the ball\'s mechanical energy, so each peak gravitational potential energy mgh, and so each peak height, is r times the one before; '
      + 'air resistance neglected)',
    syllabus: 'A.3',
    inputs: { h0: 'm', r: '', n: '' },
    output: 'm',
    f: ({ h0, r, n }) => h0 * r ** n,
    reference: [{ inputs: { h0: 2, r: 0.5, n: 2 }, output: 0.5, note: '2 m × 0.5 × 0.5' }],
    limits: [
      { name: 'before the first bounce (n = 0): the release height', inputs: { h0: 2, r: 0.55, n: 0 }, output: 2 },
      { name: 'a perfectly elastic ball (r = 1) always returns to the release height', inputs: { h0: 2, r: 1, n: 5 }, output: 2 },
      { name: 'no energy kept (r = 0): no rebound', inputs: { h0: 2, r: 0, n: 1 }, output: 0 },
      { name: 'each bounce multiplies the height by r', check: (f) => near(f({ h0: 2, r: 0.55, n: 4 }), 0.55 * f({ h0: 2, r: 0.55, n: 3 })) },
    ],
  },

  'photon-energy': {
    title: 'Energy of a photon of light of wavelength λ',
    statement: 'E = hc/λ (E = hf with c = fλ)',
    syllabus: 'E.1',
    inputs: { h: 'J s', c: 'm s^-1', lambda: 'm' },
    output: 'J',
    f: ({ h, c, lambda }) => (h * c) / lambda,
    reference: [{ inputs: { h: 6.6e-34, c: 3e8, lambda: 4.95e-7 }, output: 4e-19, note: '6.6 × 10⁻³⁴ × 3 × 10⁸ / 4.95 × 10⁻⁷' }],
    limits: [
      { name: 'halving the wavelength doubles the photon energy', check: (f) => near(f({ h: 6.6e-34, c: 3e8, lambda: 2.5e-7 }), 2 * f({ h: 6.6e-34, c: 3e8, lambda: 5e-7 })) },
      { name: 'E λ = hc for any wavelength', check: (f) => near(f({ h: 6.6e-34, c: 3e8, lambda: 7e-7 }) * 7e-7, 6.6e-34 * 3e8) },
    ],
  },

  'transition-wavelength': {
    title: 'Wavelength of the photon emitted when an atom falls from an upper energy level to a lower one',
    statement: 'λ = hc/(E_u − E_l) (the photon carries the energy difference between the levels, E = hc/λ)',
    syllabus: 'E.1',
    inputs: { h: 'J s', c: 'm s^-1', Eu: 'J', El: 'J' },
    output: 'm',
    f: ({ h, c, Eu, El }) => (h * c) / (Eu - El),
    reference: [{ inputs: { h: 6.6e-34, c: 3e8, Eu: 6e-19, El: 2e-19 }, output: 4.95e-7, note: 'a gap of 4 × 10⁻¹⁹ J gives 495 nm' }],
    limits: [
      { name: 'a larger gap between the levels gives a shorter wavelength', check: (f) => f({ h: 6.6e-34, c: 3e8, Eu: 8e-19, El: 2e-19 }) < f({ h: 6.6e-34, c: 3e8, Eu: 6e-19, El: 2e-19 }) },
      { name: 'only the difference between the levels matters', check: (f) => near(f({ h: 6.6e-34, c: 3e8, Eu: 9e-19, El: 5e-19 }), f({ h: 6.6e-34, c: 3e8, Eu: 4e-19, El: 0 })) },
    ],
  },

  'force-plate-jump': {
    title: 'Force on a force plate during a squat jump from rest, and the landing',
    statement: 'Standing still, F = mg. Pushing off (t₀ ≤ t ≤ t₀ + τ, s = (t − t₀)/τ): F = mg(1 − sᵖ) + A sin(πs), an empirical pulse shape '
      + '(approved by the teacher on 8 October 2026) that starts at mg and falls to zero at take-off. Take-off speed from the impulse of the net '
      + 'force (A.2): mv = ∫(F − mg)dt = τ(2A/π − mg/(p + 1)). In flight F = 0 for 2v/g + δ (δ: extra flight time from landing with bent knees). '
      + 'Landing (s = (t − t_L)/τ_L): F = mg·s + B sin(πs), then F = mg',
    syllabus: 'A.2',
    inputs: { m: 'kg', g: 'm s^-2', t: 's', t0: 's', tau: 's', A: 'N', p: '', dL: 's', tauL: 's', B: 'N' },
    output: 'N',
    f: ({ m, g, t, t0, tau, A, p, dL, tauL, B }) => {
      const W = m * g;
      if (t < t0) return W;
      if (t <= t0 + tau) { const s = (t - t0) / tau; return W * (1 - s ** p) + A * Math.sin(Math.PI * s); }
      const v = (tau * ((2 * A) / Math.PI - W / (p + 1))) / m;
      const tL = t0 + tau + (2 * v) / g + dL;
      if (t < tL) return 0;
      if (t <= tL + tauL) { const s = (t - tL) / tauL; return W * s + B * Math.sin(Math.PI * s); }
      return W;
    },
    reference: [
      { inputs: { m: 60, g: 10, t: 0.2, t0: 0, tau: 0.4, A: 700, p: 1, dL: 0, tauL: 0.2, B: 1000 }, output: 1000, note: 'halfway through the push (s = 0.5, p = 1): 600 × 0.5 + 700 × 1' },
      { inputs: { m: 60, g: 10, t: -0.1, t0: 0, tau: 0.4, A: 700, p: 1, dL: 0, tauL: 0.2, B: 1000 }, output: 600, note: 'standing still: the weight' },
    ],
    limits: [
      { name: 'standing still before the push: the reading is the weight', inputs: { m: 62, g: 9.8, t: 0.05, t0: 0.2, tau: 0.4, A: 820, p: 3, dL: 0.03, tauL: 0.15, B: 1300 }, output: 62 * 9.8 },
      { name: 'zero force at take-off', check: (f) => Math.abs(f({ m: 62, g: 9.8, t: 0.6, t0: 0.2, tau: 0.4, A: 820, p: 3, dL: 0.03, tauL: 0.15, B: 1300 })) < 1e-9 },
      { name: 'zero force in flight', inputs: { m: 62, g: 9.8, t: 0.8, t0: 0.2, tau: 0.4, A: 820, p: 3, dL: 0.03, tauL: 0.15, B: 1300 }, output: 0 },
      { name: 'long after landing: the weight again', inputs: { m: 62, g: 9.8, t: 3, t0: 0.2, tau: 0.4, A: 820, p: 3, dL: 0.03, tauL: 0.15, B: 1300 }, output: 62 * 9.8 },
      {
        // Impulse–momentum and kinematics agree: with δ = 0, the impulse of the net force during the push equals m × (g × flight time / 2).
        name: 'impulse of the net force = m × g × (flight time) / 2 when δ = 0',
        check: (f) => {
          const P = { m: 62, g: 9.8, t0: 0.2, tau: 0.4, A: 820, p: 3, dL: 0, tauL: 0.15, B: 1300 };
          let J = 0;
          const n = 20000;
          for (let i = 0; i < n; i++) { const t = P.t0 + (P.tau * (i + 0.5)) / n; J += (f({ ...P, t }) - P.m * P.g) * (P.tau / n); }
          let t = P.t0 + P.tau + 1e-6;
          while (f({ ...P, t }) === 0) t += 1e-5;
          return Math.abs(J - (P.m * P.g * (t - P.t0 - P.tau)) / 2) < 2e-3 * J;
        },
      },
    ],
  },

  'line-source-illuminance': {
    title: 'Intensity facing the middle of a uniform straight line source of light',
    statement: 'I = P/(4πd√(d² + L²/4)): a tube of length L, emitting power P evenly along its length, each short piece spreading its light in all '
      + 'directions; intensity on a surface facing the tube at perpendicular distance d from its middle (beyond the SL syllabus: used only to '
      + 'generate data, approved by the teacher on 8 October 2026). Far away (d ≫ L) it becomes the point-source law I = P/(4πd²). '
      + 'A sensor also receives any steady background light I_b, which simply adds (P = 0 gives the background alone)',
    syllabus: 'B.1',
    inputs: { P: 'W', L: 'm', d: 'm', Ib: 'W m^-2' },
    defaults: { Ib: 0 },
    output: 'W m^-2',
    f: ({ P, L, d, Ib }) => P / (4 * Math.PI * d * Math.sqrt(d * d + (L * L) / 4)) + Ib,
    reference: [
      { inputs: { P: 4 * Math.PI, L: 0, d: 1 }, output: 1, note: 'a point source: 4π W at 1 m gives 1 W m⁻²' },
      { inputs: { P: 4 * Math.PI, L: 2, d: 1 }, output: 1 / Math.SQRT2, note: '1/(1 × √(1 + 1))' },
    ],
    limits: [
      { name: 'L = 0: the point-source inverse square law', check: (f) => near(f({ P: 100, L: 0, d: 2 }), 100 / (4 * Math.PI * 4)) },
      { name: 'far away (d = 100 L): within 0.01 % of the point-source law', check: (f) => Math.abs(f({ P: 100, L: 1, d: 100 }) / (100 / (4 * Math.PI * 1e4)) - 1) < 1e-4 },
      { name: 'very close (d = L/1000): close to the long-line law P/(2πLd)', check: (f) => Math.abs(f({ P: 100, L: 1, d: 0.001 }) / (100 / (2 * Math.PI * 0.001)) - 1) < 1e-5 },
      { name: 'always less than the point-source value', check: (f) => f({ P: 100, L: 1.2, d: 0.5 }) < 100 / (4 * Math.PI * 0.25) },
      { name: 'background light adds to the reading', check: (f) => near(f({ P: 100, L: 1.2, d: 0.5, Ib: 6 }), f({ P: 100, L: 1.2, d: 0.5 }) + 6) },
      { name: 'source off (P = 0): only the background', inputs: { P: 0, L: 1.2, d: 0.5, Ib: 6 }, output: 6 },
    ],
  },

  'inverse-square-intensity': {
    title: 'Intensity at distance d from a point source radiating power P equally in all directions',
    statement: 'I = P/(4πd²)',
    syllabus: 'B.1',
    inputs: { P: 'W', d: 'm' },
    output: 'W m^-2',
    f: ({ P, d }) => P / (4 * Math.PI * d * d),
    reference: [{ inputs: { P: 4 * Math.PI, d: 2 }, output: 0.25, note: '4π W spread over a sphere of radius 2 m (area 16π m²)' }],
    limits: [{ name: 'doubling the distance quarters the intensity', check: (f) => near(f({ P: 100, d: 4 }), f({ P: 100, d: 2 }) / 4) }],
  },

  'energy-balance-temperature': {
    title: 'Equilibrium temperature of a body that absorbs sunlight and radiates as a black body from its whole surface (no atmosphere)',
    statement: 'T = [(1 − α)S/(4σ)]^¼: absorbed power (1 − α)Sπr² equals emitted power σT⁴ × 4πr² (B.2)',
    syllabus: 'B.2',
    inputs: { alpha: '', S: 'W m^-2', sigma: 'W m^-2 K^-4' },
    output: 'K',
    f: ({ alpha, S, sigma }) => (((1 - alpha) * S) / (4 * sigma)) ** 0.25,
    reference: [{ inputs: { alpha: 0, S: 4 * 5.67e-8 * 300 ** 4, sigma: 5.67e-8 }, output: 300, note: 'S chosen so that S/(4σ) = 300⁴' }],
    limits: [
      { name: 'a perfect reflector (α = 1) absorbs nothing: 0 K', inputs: { alpha: 1, S: 1361, sigma: 5.67e-8 }, output: 0 },
      { name: '16 times the irradiance doubles the temperature', check: (f) => near(f({ alpha: 0.3, S: 16 * 1361, sigma: 5.67e-8 }), 2 * f({ alpha: 0.3, S: 1361, sigma: 5.67e-8 })) },
      { name: 'Earth with albedo 0.30: about 255 K', check: (f) => Math.abs(f({ alpha: 0.3, S: 1361, sigma: 5.67e-8 }) - 254.6) < 0.5 },
    ],
  },

  'radial-velocity-doppler': {
    title: 'Observed wavelength of a spectral line from a star in a circular orbit (seen edge-on), with no motion of the system as a whole',
    statement: 'λ = λ₀(1 + v/c) with v = K sin(2π(t − t₀)/P): Δλ/λ₀ ≈ v/c for v ≪ c (C.5); v is the line-of-sight velocity, positive away from us',
    syllabus: 'C.5',
    inputs: { lambda0: 'm', K: 'm s^-1', c: 'm s^-1', t: 's', t0: 's', P: 's' },
    output: 'm',
    f: ({ lambda0, K, c, t, t0, P }) => lambda0 * (1 + (K / c) * Math.sin((2 * Math.PI * (t - t0)) / P)),
    reference: [{ inputs: { lambda0: 5e-7, K: 3e4, c: 3e8, t: 25, t0: 0, P: 100 }, output: 5.0005e-7, note: 'a quarter period after t₀: moving away at K, Δλ = λ₀K/c = 0.05 nm' }],
    limits: [
      { name: 'no orbital motion (K = 0): the laboratory wavelength', inputs: { lambda0: 5e-7, K: 0, c: 3e8, t: 7, t0: 0, P: 100 }, output: 5e-7 },
      { name: 'half a period later the shift is reversed', check: (f) => near(f({ lambda0: 5e-7, K: 3e4, c: 3e8, t: 75, t0: 0, P: 100 }) - 5e-7, -(f({ lambda0: 5e-7, K: 3e4, c: 3e8, t: 25, t0: 0, P: 100 }) - 5e-7)) },
      { name: 'one period later the same wavelength', check: (f) => near(f({ lambda0: 5e-7, K: 3e4, c: 3e8, t: 133, t0: 0, P: 100 }), f({ lambda0: 5e-7, K: 3e4, c: 3e8, t: 33, t0: 0, P: 100 })) },
    ],
  },

  'sphere-mass': {
    title: 'Mass of a sphere of uniform density',
    statement: 'm = (4/3)πr³ρ',
    syllabus: 'D.2',
    inputs: { r: 'm', rho: 'kg m^-3' },
    output: 'kg',
    f: ({ r, rho }) => (4 / 3) * Math.PI * r ** 3 * rho,
    reference: [{ inputs: { r: 0.1, rho: 1000 }, output: (4 / 3) * Math.PI, note: '(4/3)π × 0.001 × 1000 = 4.19 kg' }],
    limits: [{ name: 'twice the radius, eight times the mass', check: (f) => near(f({ r: 0.2, rho: 900 }), 8 * f({ r: 0.1, rho: 900 })) }],
  },

  'charge-multiple': {
    title: 'Charge carried by an object with n extra (or missing) electrons',
    statement: 'q = ne (charge is quantised in units of e)',
    syllabus: 'D.2',
    inputs: { n: '', e: 'C' },
    output: 'C',
    f: ({ n, e }) => n * e,
    reference: [{ inputs: { n: 3, e: 1.6e-19 }, output: 4.8e-19, note: '3 × 1.6 × 10⁻¹⁹ C' }],
    limits: [{ name: 'no extra electrons, no charge', inputs: { n: 0, e: 1.6e-19 }, output: 0 }],
  },

  'balance-pd': {
    title: 'Potential difference between horizontal parallel plates that holds a charged drop stationary',
    statement: 'V = mgd/q: the electric force qE = qV/d balances the weight mg (D.2: E = V/d, F = qE)',
    syllabus: 'D.2',
    inputs: { m: 'kg', g: 'm s^-2', d: 'm', q: 'C' },
    output: 'V',
    f: ({ m, g, d, q }) => (m * g * d) / q,
    reference: [{ inputs: { m: 1e-15, g: 10, d: 0.005, q: 1e-19 }, output: 500, note: '10⁻¹⁵ × 10 × 0.005 / 10⁻¹⁹' }],
    limits: [
      { name: 'twice the charge needs half the p.d.', check: (f) => near(f({ m: 1e-15, g: 9.8, d: 0.006, q: 3.2e-19 }), f({ m: 1e-15, g: 9.8, d: 0.006, q: 1.6e-19 }) / 2) },
      { name: 'plates twice as far apart need twice the p.d. (half the field for the same V)', check: (f) => near(f({ m: 1e-15, g: 9.8, d: 0.012, q: 1.6e-19 }), 2 * f({ m: 1e-15, g: 9.8, d: 0.006, q: 1.6e-19 })) },
    ],
  },

  'mass-energy': {
    title: 'Energy equivalent of a mass (for example the mass defect of a nuclear reaction)',
    statement: 'E = Δm c²',
    syllabus: 'E.4',
    inputs: { dm: 'kg', c: 'm s^-1' },
    output: 'J',
    f: ({ dm, c }) => dm * c * c,
    reference: [{ inputs: { dm: 1e-3, c: 3e8 }, output: 9e13, note: '1 g of mass: 9 × 10¹³ J' }],
    limits: [
      { name: 'no mass change, no energy', inputs: { dm: 0, c: 3e8 }, output: 0 },
      { name: '1 u is about 931.5 MeV', check: (f) => Math.abs(f({ dm: 1.66053906892e-27, c: 299792458 }) / 1.602176634e-13 - 931.494) < 0.001 },
    ],
  },
};
