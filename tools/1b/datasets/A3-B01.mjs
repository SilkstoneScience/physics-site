// A.3 Peak heights of a bouncing tennis ball, read from video frames (archetypes L3 and G3).
// Skills: energy transfers in a bounce, successive ratios from a table, plotting a point, judging whether a ratio is constant
// using propagated uncertainties (small readings give large fractional uncertainties), predicting an unmeasured bounce,
// a limitation of video analysis.

const OMIT = 4; // students plot the fourth bounce
const N_PRED = 7; // the bounce students predict (not filmed clearly enough to measure)
const FPS = 30;

const ratios = (d) => d.rows.slice(1).map((r, i) => r.h / d.rows[i].h);
// Worst-case uncertainty of a ratio of two heights: the fractional uncertainties add.
const ratioUnc = (d, i) => (d.rows[i + 1].h / d.rows[i].h) * (d.unc('h', i) / d.rows[i].h + d.unc('h', i + 1) / d.rows[i + 1].h);
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

export default {
  id: 'A3-B01',
  topic: 'A.3',
  difficulty: 1,
  context: 'experimental',
  skills: ['energy-transfers', 'successive-ratios', 'plot-a-point', 'constant-within-uncertainty', 'prediction', 'video-analysis'],
  seed: 301,
  batch: 'batch-2',
  archetypes: ['L3', 'G3'],
  apparatus: 'tennis ball dropped onto a hard floor and filmed at 30 frames per second in front of a height scale on a wall',
  contextFamily: 'collision-impact',
  contextObjects: ['ball', 'video'],
  features: ['model:empirical'],
  originality: 'No bouncing-ball or video-analysis context was found in the cached 2025 Paper 1B papers or the legacy Paper 3 Section A '
    + 'papers (keyword scan, 8 October 2026). Own context (a tennis ball filmed against a wall scale), numbers and sequence: energy '
    + 'transfers, successive ratios, plotting, constancy judged from propagated uncertainties, prediction, a video limitation. The '
    + 'Skills page uses a basketball rebound as an example of realistic uncertainty, so a tennis ball is used here.',

  physics: {
    scenario: 'A tennis ball is released from rest about 2 m above a hard floor and bounces several times. A phone films it at 30 frames '
      + 'per second in front of a height scale fixed to the wall. For each peak, the student finds the frame in which the ball is highest '
      + 'and reads the height of the bottom of the ball against the scale.',
    principles: [
      'Conservation of energy (A.3): between impacts the ball\'s kinetic and gravitational potential energy are transferred into each other; at the top of each bounce all its mechanical energy is gravitational potential energy mgh',
      'At each impact some of the ball\'s energy is dissipated (internal energy of the ball and floor, sound), so each peak is lower than the one before',
      'Fraction of energy kept in one bounce = mghₙ₊₁ / mghₙ = hₙ₊₁/hₙ',
    ],
    assumptions: [
      'Each impact keeps the same fraction r of the ball\'s mechanical energy (empirical model, approved by the teacher on 8 October 2026)',
      'Air resistance is negligible for a tennis ball over heights of 2 m or less',
      'The ball moves vertically, close to the plane of the wall scale',
    ],
    derivation: ['hₙ₊₁ = r hₙ for every bounce, so hₙ = h₀ rⁿ: each ratio of successive peak heights equals r'],
    relationship: 'hₙ = h₀rⁿ',
    params: {
      h0: { value: 2.0, unit: 'm', range: [1, 3], note: 'release height (the bottom of the ball)' },
      r: { value: 0.55, unit: '', range: [0.45, 0.65], note: 'fraction of the energy kept per bounce; a tennis ball dropped from 254 cm onto a hard surface rebounds to 53–58 % of its drop height' },
    },
  },

  columns: {
    n: { kind: 'set', name: 'bounce number', symbol: 'n', unit: '', values: [0, 1, 2, 3, 4, 5, 6], resolution: 1 },
    h: {
      kind: 'measured', name: 'peak height', symbol: 'h', unit: 'cm',
      model: { law: 'bounce-height-ratio', inputs: { h0: 'p.h0', r: 'p.r', n: 'row.n' } },
      expect: [3, 210],
      measurement: {
        instrument: 'video at 30 frames per second; height scale on the wall with centimetre divisions, read to the nearest 0.5 cm on the screen',
        reading: 'the height of the bottom of the ball in the frame where it is highest',
        noise: 'judging the edge of a slightly blurred ball against the scale, the ball not being exactly in the plane of the scale (parallax) and the frame nearest the peak missing the very top: normal scatter with standard deviation 0.4 cm',
      },
      noise: { type: 'gauss', sd: 0.4 }, resolution: 0.5, uncertainty: 1.0,
    },
  },
  tableCaption: 'Peak heights of the ball. Bounce number 0 is the height from which the ball was released.',
  // The ±1.0 cm uncertainty is too small to see as error bars on a 0–200 cm axis; it is stated in the table and the caption.
  graph: { x: 'n', y: 'h', fit: 'none', zero: { x: true, y: true }, yRange: [0, 220], omit: [OMIT], errorBars: 'too-small' },
  present: ['table', 'graph'],

  results: {
    rFirst: { unit: '', value: (d) => ratios(d)[0] },
    rLast: { unit: '', value: (d) => ratios(d)[5] },
    drFirst: { unit: '', value: (d) => ratioUnc(d, 0) },
    drLast: { unit: '', value: (d) => ratioUnc(d, 5) },
    rMean: { unit: '', value: (d) => mean(ratios(d)) },
    // The value every ratio's uncertainty range contains: the middle of the overlap (largest lower end to smallest upper end).
    rCommon: { unit: '', value: (d) => { const r = ratios(d).map((v, i) => [v - ratioUnc(d, i), v + ratioUnc(d, i)]); return (Math.max(...r.map((x) => x[0])) + Math.min(...r.map((x) => x[1]))) / 2; } },
    hPred: {
      unit: 'cm', predictAt: { column: 'n', value: N_PRED },
      value: (d) => d.rows[6].h * d.r.rCommon.value,
      // Any sensible ratio (0.50 to 0.60) applied to the last height, or h₀rⁿ with the first or the mean ratio; 5 % reading margin.
      range: (d) => {
        const ways = [d.rows[6].h * 0.5, d.rows[6].h * 0.6, d.rows[6].h * d.r.rMean.value, d.rows[0].h * d.r.rFirst.value ** N_PRED, d.rows[0].h * d.r.rMean.value ** N_PRED];
        return [Math.min(...ways) * 0.95, Math.max(...ways) * 1.05];
      },
    },
  },

  claims: [{ type: 'constantRatio', column: 'h', expect: true }],

  stated: {
    fps: { value: FPS, dp: 0, unit: 's^-1', source: 'the phone films at 30 frames per second' },
  },

  intro: (d) => '<p>A student investigates how much energy a tennis ball keeps each time it bounces. The ball is released from rest and '
    + `bounces several times on a hard floor. A phone films it at ${d.stated('fps')} frames per second in front of a height scale fixed to the wall.</p>`
    + '<p>For each bounce, the student finds the frame in which the ball is highest and reads the peak height $h$ of the bottom of the ball. '
    + 'The table and graph show the results. The point for bounce 4 has not been plotted.</p>',

  parts: (d) => {
    const [pLo, pHi] = d.r.hPred.range;
    return [
      {
        label: 'a', marks: 1, ao: 'AO1',
        question: 'Describe the energy transfers from the moment the ball is released until it reaches its highest point after the first bounce.',
        markscheme: ['Gravitational potential energy → kinetic energy as it falls; at the impact some energy is transferred to internal (thermal) energy '
          + 'and sound (the rest is stored elastically and returned as kinetic energy); kinetic → gravitational potential energy as it rises, '
          + 'so there is less at the top than at the start ✓'],
      },
      {
        label: 'b', marks: 2, ao: 'AO2',
        question: 'Calculate the ratio $\\dfrac{h_1}{h_0}$ for the first bounce and the ratio $\\dfrac{h_6}{h_5}$ for the last bounce.',
        markscheme: [
          // Rounded half up (0.5525 → 0.553), as students would; the binary value 0.55249… would otherwise print 0.552.
          `$\\dfrac{h_1}{h_0} = \\dfrac{${d.text('h', 1)}}{${d.text('h', 0)}} = ${d.dp(Math.round(d.r.rFirst.value * 1000 + 1e-9) / 1000, 3)}$ ✓`,
          `$\\dfrac{h_6}{h_5} = \\dfrac{${d.text('h', 6)}}{${d.text('h', 5)}} = ${d.sf(d.r.rLast.value, 2)}$ ✓`,
        ],
      },
      {
        label: 'c', marks: 1, ao: 'AO2', msFigure: 'graph-ms',
        question: 'Plot the point for bounce 4 on the graph.',
        markscheme: [`Point plotted at $n = ${d.int(OMIT)}$, $h = ${d.text('h', OMIT)}\\ \\text{cm}$, to within half a small square ✓`],
      },
      {
        label: 'd', marks: 3, ao: 'AO3',
        // The last ratio's uncertainty (0.165) is quoted to 2 s.f.: rounding it to 0.2 would change it by 20 % (Skills page rule).
        asks: { conclusion: ['are consistent', 'is consistent'], valuePm: ['rLast', 'drLast'], sf: 2 },
        question: 'The fraction of its energy that the ball keeps in a bounce is equal to $\\dfrac{h_{n+1}}{h_n}$. '
          + 'Deduce, using the uncertainties in the heights, whether the data support the idea that every bounce keeps the same fraction of the energy.',
        markscheme: [
          `The fractional uncertainties of the two heights add: $\\Delta\\!\\left(\\dfrac{h_1}{h_0}\\right) = ${d.sf(d.r.rFirst.value, 4)} \\times \\left(\\dfrac{${d.dp(d.unc('h', 0), 1)}}{${d.text('h', 0)}} + \\dfrac{${d.dp(d.unc('h', 1), 1)}}{${d.text('h', 1)}}\\right)$, `
            + `so $\\dfrac{h_1}{h_0} = ${d.pm('rFirst', 'drFirst', 1)}$ ✓`,
          `$\\Delta\\!\\left(\\dfrac{h_6}{h_5}\\right) = ${d.sf(d.r.rLast.value, 2)} \\times \\left(\\dfrac{${d.dp(d.unc('h', 6), 1)}}{${d.text('h', 6)}} + \\dfrac{${d.dp(d.unc('h', 5), 1)}}{${d.text('h', 5)}}\\right)$, `
            + `so $\\dfrac{h_6}{h_5} = ${d.pm('rLast', 'drLast', 2)}$ (accept $${d.pm('rLast', 'drLast', 1)}$): the small heights at the end have large fractional uncertainties ✓`,
          `A single value (about ${d.sf(d.r.rCommon.value, 2)}) lies within the uncertainty range of every ratio, so the data are consistent with a constant fraction; `
            + 'but the later ratios are imprecise, so they test the idea only weakly (award for a conclusion consistent with the candidate\'s ratios) ✓',
        ],
      },
      {
        label: 'e', marks: 1, ao: 'AO2',
        question: `Predict the peak height after bounce ${d.int(N_PRED)}.`,
        numeric: d.num('hPred'),
        markscheme: [`$h_${N_PRED} \\approx h_6 \\times ${d.sf(d.r.rCommon.value, 2)} = ${d.sf(d.r.hPred.value, 2)}\\ \\text{cm}$, using the common ratio from (d) `
          + `(or the mean ratio, or $h_0$ multiplied by the ratio ${d.int(N_PRED)} times; accept ${d.sf(pLo, 2)} to ${d.sf(pHi, 2)} cm) ✓`],
      },
      {
        label: 'f', marks: 1, ao: 'AO3',
        question: 'Suggest one limitation of measuring the peak heights from this video, and its effect on the readings.',
        markscheme: ['Any one of: the frame nearest the top may not show the ball at its highest point, so the reading is slightly too low / the ball is '
          + 'nearer the camera than the scale (parallax), so its height read against the scale depends on where the camera is / the moving ball '
          + 'is blurred, so its bottom edge is hard to judge ✓'],
      },
    ];
  },
};
