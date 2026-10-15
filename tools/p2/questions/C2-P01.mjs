// C2-P01: P and S waves from an earthquake reaching a seismic station.
export default {
  id: 'C2-P01',
  title: 'Earthquake P and S waves at a seismic station',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['C.2'],
  batch: 'batch-1',
  batchRule: 'inspect-all',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the C.2 syllabus. Seismic waves are a common textbook context; the arrival-time method, numbers, graph and the "distance moved in one period" part are our own.',
  },
  given: {
    vp: { value: 6.0, sf: 2, unit: 'km s^-1', range: [5, 8], what: 'speed of P waves in the crust' },
    vs: { value: 3.5, sf: 2, unit: 'km s^-1', range: [3, 4.5], what: 'speed of S waves in the crust' },
    dt: { value: 42, sf: 2, unit: 's', range: [5, 200], what: 'time between the arrival of the P wave and the S wave' },
    T: { value: 1.25, sf: 3, unit: 's', range: [0.2, 10], what: 'period of the S wave, read from the graph' },
    A: { value: 3.0, sf: 2, unit: 'mm', range: [0.1, 50], what: 'amplitude of the S wave, read from the graph' },
  },
  calc: (v) => {
    const d = v.dt / (1 / v.vs - 1 / v.vp);
    return {
      d: { value: d, unit: 'km', sf: 3, range: [50, 2000] },
      lambda: { value: v.vs * v.T, unit: 'km', sf: 3 },
      path: { value: 4 * v.A, unit: 'mm', sf: 2 },
      wrong_lambda: { value: v.vs / v.T, unit: 'km', sf: 3 }, // divided by the period
      wrong_path: { value: 2 * v.A, unit: 'mm', sf: 2 }, // peak-to-peak only
    };
  },
  stem: '<p>An earthquake produces P waves, which are longitudinal, and S waves, which are transverse. Both travel through the Earth\'s crust to a seismic station. In the crust, P waves travel at [[vp]] and S waves at [[vs]].</p>',
  parts: [
    {
      label: 'a', command: 'Outline', marks: 2, syllabus: ['C.2.1'],
      question: 'Outline the difference between the motion of particles of the crust when a P wave passes and when an S wave passes.',
      markscheme: [
        'P wave: particles oscillate parallel to the direction in which the wave travels (energy is transferred) ✓',
        'S wave: particles oscillate perpendicular to the direction in which the wave travels ✓',
      ],
      examinerNote: 'Longitudinal against transverse, in terms of the direction of oscillation relative to the direction of energy transfer.',
    },
    {
      label: 'b', command: 'Show that', marks: 2, syllabus: ['C.2.2'],
      question: 'The S wave arrives at the station [[dt]] after the P wave. Show that the station is about [[d:2u]] from the earthquake.',
      showThat: { result: 'd', sf: 2 },
      markscheme: [
        '$\\dfrac{d}{[[vs:n]]} - \\dfrac{d}{[[vp:n]]} = [[dt:n]]$ ✓',
        '$d = [[d:3u]]$ ✓',
      ],
      examinerNote: 'Both waves cover the same distance; the difference in travel times is the delay. A trial value (350 km gives 41 s) earns both marks if the arithmetic is shown.',
    },
    {
      label: 'c(i)', command: 'Determine', marks: 2, syllabus: ['C.2.2', 'T.4'],
      question: 'The graph shows how the vertical displacement of the ground at the station varies with time as the S wave passes. <img src="questions/diagrams/p2-c2-swave.svg" alt="A sine-shaped graph of displacement in millimetres against time in seconds from 0 to 2.5 s. The displacement varies between plus and minus [[A]] and completes two full cycles in the time shown, so each cycle takes [[T]]."> Determine, in km, the wavelength of the S wave.',
      numeric: { result: 'lambda', accept: 0.04, mistakes: [{ result: 'wrong_lambda', feedback: 'Wavelength = speed × period (or speed ÷ frequency), not speed ÷ period.' }] },
      markscheme: [
        'period read from the graph: $T = [[T:n]]$ s (or $f = 1/T$) ✓',
        '$\\lambda = vT = [[vs:n]] \\times [[T:n]] = [[lambda:3u]]$ ✓',
        'Accept [[lambda:lo]] to [[lambda:hi]] km',
      ],
      examinerNote: 'Read the period (two cycles in 2.5 s), then v = fλ. The answer is in km because the speed is in km/s.',
    },
    {
      label: 'c(ii)', command: 'State', marks: 1, syllabus: ['C.2.1', 'T.4'],
      question: 'State the total distance moved by a particle of the ground at the station during one period of the S wave.',
      numeric: { result: 'path', mistakes: [{ result: 'wrong_path', feedback: 'In one period the particle goes up and down and back again: four times the amplitude.' }] },
      markscheme: ['$4 \\times [[A:n]] = [[path:2u]]$ ✓'],
      examinerNote: 'Up from equilibrium to the top, down to the bottom, back to equilibrium: four amplitudes. A distance moved by the medium, not by the wave.',
    },
  ],
};
