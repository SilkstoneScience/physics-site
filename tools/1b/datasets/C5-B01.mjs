// C.5 Radial velocity of a star in a spectroscopic binary, from SIMULATED observations of one spectral line (archetypes D2 and G3).
// Simplified on the teacher's decision (8 October 2026): no motion of the system as a whole, no sketch.
// Skills: a period from unevenly spaced observations, the orbital speed from the largest Doppler shift (Δλ/λ ≈ v/c), its percentage
// uncertainty from the uncertainty in each wavelength, predicting the wavelength later in the cycle, improving the observing plan.

const LAMBDA0 = 656.28; // nm, hydrogen-alpha in the laboratory
const T_PRED = 34.0; // day of the prediction (after the last observation)
const DLAM = 0.008; // nm, uncertainty of each wavelength

// Least-squares sinusoid λ = C + a cos(ωt) + b sin(ωt), searching the period on a fine grid (the analysis, not the physics).
function sineFit(rows) {
  const t = rows.map((r) => r.t);
  const y = rows.map((r) => r.lam);
  const solve3 = (M, v) => {
    const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const D = det(M);
    return [0, 1, 2].map((k) => det(M.map((row, i) => row.map((x, j) => (j === k ? v[i] : x)))) / D);
  };
  let best = null;
  for (let P = 5; P <= 25; P += 0.0005) {
    const w = (2 * Math.PI) / P;
    const f = t.map((x) => [1, Math.cos(w * x), Math.sin(w * x)]);
    const M = [0, 1, 2].map((i) => [0, 1, 2].map((j) => f.reduce((s, r) => s + r[i] * r[j], 0)));
    const v = [0, 1, 2].map((i) => f.reduce((s, r, k) => s + r[i] * y[k], 0));
    const [C, a, b] = solve3(M, v);
    const res = f.reduce((s, r, k) => s + (y[k] - (C + a * r[1] + b * r[2])) ** 2, 0);
    if (!best || res < best.res) best = { P, C, a, b, res };
  }
  const w = (2 * Math.PI) / best.P;
  return { ...best, amp: Math.hypot(best.a, best.b), at: (x) => best.C + best.a * Math.cos(w * x) + best.b * Math.sin(w * x) };
}
const cache = new WeakMap();
const fitOf = (d) => { if (!cache.has(d.rows)) cache.set(d.rows, sineFit(d.rows)); return cache.get(d.rows); };

export default {
  id: 'C5-B01',
  topic: 'C.5',
  difficulty: 2,
  context: 'observational',
  source: 'observational',
  simulated: true,
  skills: ['period-from-a-graph', 'doppler-shift', 'orbital-speed', 'percentage-uncertainty', 'prediction', 'improve-the-method'],
  seed: 251,
  batch: 'batch-2',
  archetypes: ['D2', 'G3'],
  apparatus: 'simulated spectrograph observations of the hydrogen-alpha line of a star in a binary system, on uneven dates',
  contextFamily: 'stellar-observation',
  contextObjects: ['telescope-spectra'],
  originality: 'Legacy astrophysics option papers (2016, 2017, 2019, 2024) use spectroscopic binaries, usually a velocity curve to read and '
    + 'Kepler\'s law or masses. This question uses a wavelength–time graph of unevenly spaced (simulated) observations, the C.5 SL relation '
    + 'Δλ/λ ≈ v/c, the percentage uncertainty in the speed from the uncertainty in each wavelength, a prediction later in the cycle and an '
    + 'improvement to the observing plan: an own sequence with own numbers, and no masses or option content.',

  physics: {
    scenario: 'A star orbits the centre of mass of a binary system in a circular orbit seen edge-on. Its hydrogen-alpha line (656.28 nm in the '
      + 'laboratory) is observed with a spectrograph on 18 nights over 30 days, on uneven dates (weather and daylight). The system as a whole '
      + 'is not moving towards or away from us. The data are simulated observations, generated from this model with realistic scatter.',
    principles: [
      'Doppler effect for light: Δλ/λ ≈ v/c for v ≪ c, with v the velocity along the line of sight (C.5)',
      'A star in a circular orbit seen edge-on has a line-of-sight velocity that varies sinusoidally with the orbital period',
    ],
    assumptions: [
      'Circular orbit seen edge-on; no motion of the system as a whole (simplified, teacher\'s decision of 8 October 2026)',
      'v ≪ c, so Δλ/λ ≈ v/c (v/c is about 2 × 10⁻⁴)',
      'Simulated observations clearly labelled as simulated (approved by the teacher, 8 October 2026)',
    ],
    derivation: ['v(t) = K sin(2π(t − t₀)/P), so λ(t) = λ₀(1 + v(t)/c): a sinusoid about λ₀ of amplitude λ₀K/c and period P'],
    relationship: 'λ = λ₀(1 + (K/c) sin(2π(t − t₀)/P))',
    params: {
      lambda0: { value: LAMBDA0, unit: 'nm', range: [LAMBDA0, LAMBDA0], note: 'laboratory wavelength of hydrogen-alpha (in air)' },
      K: { value: 52, unit: 'km s^-1', range: [10, 150], note: 'orbital speed of the star (typical for a close binary of solar-type stars)' },
      c: { value: 3.0e8, unit: 'm s^-1', range: [3.0e8, 3.0e8], note: 'data booklet value' },
      t0: { value: 2.3, unit: 'day', range: [0, 20], note: 'a time at which the star crosses the line of sight (moving away)' },
      P: { value: 11.6, unit: 'day', range: [1, 100], note: 'orbital period' },
    },
  },

  columns: {
    t: {
      kind: 'set', name: 'time', symbol: 't', unit: 'day', resolution: 0.1,
      values: [0.0, 1.1, 3.0, 4.1, 6.9, 8.0, 9.2, 11.9, 13.1, 15.8, 17.0, 18.1, 20.9, 22.2, 24.0, 26.9, 28.1, 29.8],
    },
    lam: {
      kind: 'measured', name: 'wavelength', symbol: '\\lambda', symbolText: 'λ', unit: 'nm',
      model: { law: 'radial-velocity-doppler', inputs: { lambda0: 'p.lambda0', K: 'p.K', c: 'p.c', t: 'row.t', t0: 'p.t0', P: 'p.P' } },
      expect: [656.1, 656.5],
      measurement: {
        instrument: 'spectrograph on a telescope (simulated), wavelength recorded to 0.001 nm',
        reading: 'the wavelength of the centre of the hydrogen-alpha line on each night',
        noise: 'finding the centre of a broadened line in a noisy spectrum, and the spectrograph\'s calibration from night to night: normal scatter with standard deviation 0.004 nm',
      },
      noise: { type: 'gauss', sd: 0.004 }, resolution: 0.001, uncertainty: DLAM,
    },
  },
  tableCaption: 'Observed wavelength of the hydrogen-alpha line on each night (simulated observations).',
  graph: {
    x: 't', y: 'lam', fit: 'none', zero: { x: true }, xRange: [0, 35], height: 440,
    referenceLine: { m: 0, c: LAMBDA0, label: 'the laboratory wavelength' },
    modelCurve: (d) => (t) => d.p.lambda0 * (1 + ((d.p.K * 1e3) / d.p.c) * Math.sin((2 * Math.PI * (t - d.p.t0)) / d.p.P)),
    modelCurveLabel: 'the orbit model used to simulate the observations',
    altDescription: 'The wavelength rises and falls regularly, above and below the laboratory wavelength, with about two and a half cycles over the observations; the points are unevenly spaced in time.',
  },
  present: ['graph'],
  tableless: { reason: 'the observations are shown on the graph, which is how they are read (period, largest shift); a table would add nothing', readFrom: [{ figure: 'graph', columns: ['t', 'lam'] }] },

  results: {
    // ±10 % (teacher, 8 October 2026): the uneven dates make the maxima hard to place.
    P: { unit: 'day', estimates: 'P', value: (d) => fitOf(d).P, range: (d, v) => [v * 0.9, v * 1.1] },
    amp: { unit: 'nm', value: (d) => fitOf(d).amp },
    K: {
      unit: 'km s^-1', estimates: 'K', value: (d) => ((d.p.c * d.r.amp.value) / d.p.lambda0) / 1e3,
      // The largest shift read from the highest (or lowest) point, or from the pattern as a whole: within one wavelength uncertainty, plus reading.
      range: (d, v) => { const f = DLAM / d.r.amp.value + 0.03; return [v * (1 - f), v * (1 + f)]; },
    },
    pctK: { unit: '%', value: (d) => (100 * DLAM) / d.r.amp.value },
    lamPred: {
      unit: 'nm', predictAt: { column: 't', value: T_PRED },
      value: (d) => fitOf(d).at(T_PRED),
      // A period from the graph within about 6 % moves the minimum by a fraction of a day: allow the curve a day either side.
      range: (d, v) => { const f = fitOf(d); const ys = [f.at(T_PRED - 1), f.at(T_PRED + 1), f.C - f.amp, v]; return [Math.min(...ys) - 0.005, Math.max(...ys) + 0.005]; },
    },
  },

  stated: {
    lambda0: { value: LAMBDA0, dp: 2, unit: 'nm', source: 'laboratory wavelength of hydrogen-alpha', from: (p) => p.lambda0 },
    dlam: { value: DLAM, dp: 3, unit: 'nm', source: 'uncertainty of each simulated wavelength (twice the scatter)' },
    tPred: { value: T_PRED, dp: 0, unit: 'day', source: 'the day of the prediction (after the last observation)' },
  },

  intro: (d) => '<p>Astronomers study a star in a binary system: the star moves in a circular orbit, so it moves alternately towards and away from Earth. '
    + `They measure the wavelength $\\lambda$ of a hydrogen line in its spectrum. In the laboratory this line has a wavelength of $${d.stated('lambda0')}\\ \\text{nm}$.</p>`
    + `<p>The graph shows <strong>simulated observations</strong> on ${d.int(d.rows.length)} nights: values generated from a model of the orbit, with the scatter a `
    + `real spectrograph would give. Each wavelength has an uncertainty of $\\pm ${d.stated('dlam')}\\ \\text{nm}$. `
    + 'The system as a whole is not moving towards or away from Earth.</p>',

  parts: (d) => {
    const f = fitOf(d);
    const w = (2 * Math.PI) / f.P;
    // A time of maximum shift near the end of the record, for the mark scheme (the fitted curve's peak).
    const phase = Math.atan2(f.b, f.a); // a cos + b sin = amp cos(wt − phase)
    const peaks = [0, 1, 2, 3].map((k) => (phase + 2 * Math.PI * k) / w).filter((x) => x > 0 && x < 30.5);
    const [pLo, pHi] = d.r.P.range;
    const [kLo, kHi] = d.r.K.range;
    const [lLo, lHi] = d.r.lamPred.range;
    return [
      {
        label: 'a', marks: 2, ao: 'AO2', msFigure: 'graph-ms',
        reads: peaks.map((x) => ({ figure: 'graph', x })),
        question: 'Determine the orbital period of the star.',
        markscheme: [
          `Uses the times of two maxima (or minima) several cycles apart, for example about day ${d.dp(peaks[0], 0)} and day ${d.dp(peaks[peaks.length - 1], 0)} (${d.int(peaks.length - 1)} cycles) ✓`,
          `Period $= ${d.sf(d.r.P.value, 3)}$ days (accept ${d.sf(pLo, 3)} to ${d.sf(pHi, 3)} days) ✓`,
        ],
      },
      {
        label: 'b', marks: 3, ao: 'AO2',
        reads: [{ figure: 'graph', y: f.C + f.amp }, { figure: 'graph', y: f.C - f.amp }],
        question: 'Determine the orbital speed of the star, in $\\text{km s}^{-1}$.',
        numeric: d.num('K'),
        markscheme: [
          `Largest shift from the laboratory wavelength, from the graph: $\\Delta\\lambda \\approx ${d.sf(d.r.amp.value, 3)}\\ \\text{nm}$ ✓`,
          '$v = \\dfrac{c\\,\\Delta\\lambda}{\\lambda}$ ✓',
          `$v = ${d.sf(d.r.K.value, 2)}\\ \\text{km s}^{-1}$ (accept ${d.sf(kLo, 2)} to ${d.sf(kHi, 2)}; allow ECF from the shift read) ✓`,
        ],
      },
      {
        label: 'c', marks: 2, ao: { AO2: 1, AO3: 1 },
        question: 'Determine the percentage uncertainty in your answer to (b). The laboratory wavelength and $c$ are known precisely.',
        markscheme: [
          `The uncertainty in $\\Delta\\lambda$ is that of one wavelength reading, $${d.stated('dlam')}\\ \\text{nm}$ ✓`,
          `$\\dfrac{${d.stated('dlam')}}{${d.sf(d.r.amp.value, 3)}} \\times 100 \\approx ${d.sf(d.r.pctK.value, 1)}\\,\\%$ (allow ECF from (b)) ✓`,
        ],
      },
      {
        label: 'd', marks: 1, ao: 'AO2',
        question: `Predict the wavelength that would be observed on day ${d.stated('tPred')}.`,
        markscheme: [`About half a period after the maximum near day ${d.dp(peaks[peaks.length - 1], 0)}, so near a minimum: $\\lambda \\approx ${d.dp(d.r.lamPred.value, 2)}\\ \\text{nm}$ (accept ${d.dp(lLo, 3)} to ${d.dp(lHi, 3)} nm) ✓`],
      },
      {
        label: 'e', marks: 1, ao: 'AO3',
        question: 'Suggest one way in which the observations could be changed to determine the period more precisely.',
        markscheme: ['Any one of: observe for more cycles (a longer time) / observe more often, especially near the maxima and minima / fill the gaps in the record ✓'],
      },
    ];
  },
};
