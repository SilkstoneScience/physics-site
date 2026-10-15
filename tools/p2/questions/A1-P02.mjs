// A1-P02: an electric scooter with non-uniform acceleration, from a graph.
export default {
  id: 'A1-P02',
  title: 'Electric scooter: non-uniform acceleration from a graph',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['A.1'],
  batch: 'batch-2',
  literals: { 12: 'the time span shown on the graph', 10: 'lower limit for a velocity read from the graph at 8.0 s', 11: 'upper limit for a velocity read from the graph at 8.0 s' },
  originality: {
    inspiredBy: null,
    note: 'Written for this bank on non-uniform acceleration (A.1; the 2028 guide only clarifies that it is treated graphically and qualitatively). The curve is generated from v = 12(1 − e^(−t/4.0)); students estimate the area by counting squares. Context and numbers are our own.',
  },
  given: {
    vmax: { value: 12, sf: 2, unit: 'm s^-1', range: [5, 25], what: 'speed the scooter approaches (used to draw the graph)' },
    tau: { value: 4.0, sf: 2, unit: 's', range: [1, 10], what: 'time constant of the curve (used to draw the graph only)' },
    t8: { value: 8.0, sf: 2, unit: 's', range: [2, 12], what: 'time for the distance and average acceleration' },
  },
  calc: (v) => {
    const v8 = v.vmax * (1 - Math.exp(-v.t8 / v.tau));
    const dist = v.vmax * (v.t8 - v.tau * (1 - Math.exp(-v.t8 / v.tau)));
    return {
      v8: { value: v8, unit: 'm s^-1', sf: 3 },
      dist: { value: dist, unit: 'm', sf: 2, range: [10, 200] },
      aAvg: { value: v8 / v.t8, unit: 'm s^-2', sf: 2 },
      a0: { value: v.vmax / v.tau, unit: 'm s^-2', sf: 2 },
      wrong_dist: { value: v8 * v.t8 / 2, unit: 'm', sf: 2 }, // treated the graph as a straight line
    };
  },
  stem: '<p>An electric scooter starts from rest. The graph shows how its velocity changes with time during the first 12 s.</p>',
  diagram: { file: 'questions/diagrams/p2-a1-scooter.svg', large: true, alt: 'Velocity in metres per second against time in seconds from 0 to 12, on a grid of 1 second by 1 metre per second squares. The curve starts at the origin, rises steeply, and bends over so that it levels off towards 12 metres per second. At 8 seconds the velocity is about 10.4 metres per second.' },
  parts: [
    {
      label: 'a', command: 'Describe', marks: 2, syllabus: ['A.1.6', 'A.1.4'],
      question: 'Describe how the acceleration of the scooter changes during the first 12 s.',
      markscheme: [
        'the acceleration decreases ✓',
        'because the gradient of the graph decreases, approaching zero as the velocity approaches a constant value ✓',
      ],
      examinerNote: 'Acceleration is the gradient of the velocity–time graph; the curve flattens. "The scooter slows down" earns nothing: the velocity still increases.',
    },
    {
      label: 'b', command: 'Estimate', marks: 3, syllabus: ['A.1.4', 'A.1.6', 'T.4'],
      question: 'Estimate the distance travelled by the scooter in the first [[t8:n]] s.',
      numeric: { result: 'dist', accept: 0.08, mistakes: [{ result: 'wrong_dist', feedback: 'The graph is a curve, not a straight line: it lies above the straight line from the origin, so the area is larger than ½ × v × t. Count the squares under the curve.' }] },
      markscheme: [
        'the distance is the area under the graph from 0 to [[t8:n]] s ✓',
        'area estimated by counting squares (each square = 1 m) OR by splitting into strips/trapezia ✓',
        'distance = [[dist:2u]] ✓',
        'Accept [[dist:lo]] to [[dist:hi]] m. Award [2 max] for ½ × [[v8:3]] × [[t8:n]] = [[wrong_dist:3]] m (curve treated as a straight line).',
      ],
      examinerNote: 'The exact area is from the generating function. Square counting by students usually lands within about 5 %; the accept range is 8 %.',
    },
    {
      label: 'c', command: 'Calculate', marks: 1, syllabus: ['A.1.4'],
      question: 'Calculate the average acceleration of the scooter during the first [[t8:n]] s.',
      numeric: { result: 'aAvg', accept: 0.05 },
      markscheme: ['$a = \\dfrac{\\Delta v}{\\Delta t} = \\dfrac{[[v8:3]]}{[[t8:n]]} = [[aAvg:2u]]$; allow a velocity read from the graph between 10 and 11 $\\text{m s}^{-1}$ ✓'],
      examinerNote: 'Average acceleration uses the change in velocity over the whole interval (the chord), not the gradient at one point.',
    },
    {
      label: 'd', command: 'Explain', marks: 2, syllabus: ['A.1.4', 'A.1.6'],
      question: 'Explain why the acceleration of the scooter just after it starts is greater than your answer to (c).',
      markscheme: [
        'the gradient of the curve (the tangent) is steepest at the start ✓',
        'the average acceleration is the gradient of the straight line from the origin to the point at [[t8:n]] s, which is less steep than the tangent at the start ✓',
      ],
      examinerNote: 'Instantaneous acceleration = gradient of the tangent; average = gradient of the chord. At t = 0 the tangent gradient is vmax/τ = 3.0 m s⁻² (shown in the audit as a0).',
    },
  ],
};
