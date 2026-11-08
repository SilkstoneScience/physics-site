// D4-P01: a bar magnet dropped through a coil connected to a data logger (Faraday's law, Lenz's law, the area
// under an emf–time graph as the change in flux linkage; HL, data-based).
export default {
  id: 'D4-P01',
  title: 'Bar magnet dropped through a coil: emf–time graph',
  type: 'short',
  level: 'HL',
  difficulty: 2,
  topics: ['D.4'],
  sections: ['faraday', 'flux', 'lenz'],
  batch: 'batch-3',
  situation: 'bar magnet dropped through a data-logger coil',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the D.4 guidance example of relative motion between a magnet and a coil (a magnet moving through a coil, with a data logger recording the emf). The graph is generated from a model: the flux through the coil is a bell curve Φ = B₀A exp(−(z/w)²) in the position z of the falling magnet, the magnet is in free fall from the given height, and the emf is −N dΦ/dt. The first pulse is negative and peaks at about a third of a volt; the second is about a third taller and a third shorter because the magnet is moving faster; the area of the first pulse is within 0.3 % of NΦ₀. Context, numbers and the sequence of parts are our own and differ from the rod-on-rails, rotating-coil and flywheel questions in the bank.',
  },
  given: {
    N: { value: 500, sf: 3, unit: '', range: [50, 2000], what: 'number of turns on the coil' },
    A: { value: 8.0, sf: 2, unit: 'cm^2', range: [1, 100], what: 'cross-sectional area of the coil' },
    h: { value: 6.0, sf: 2, unit: 'cm', range: [2, 50], what: 'height of the centre of the magnet above the centre of the coil at release' },
    B0: { value: 25, sf: 2, unit: 'mT', range: [5, 200], what: 'average flux density over the coil when the magnet is at its centre (used to draw the graph; the answer to (d))' },
    w: { value: 2.5, sf: 2, unit: 'cm', range: [1, 10], what: 'width of the bell-shaped flux curve (used to draw the graph only)' },
    gridT: { value: 10, sf: 2, unit: 'ms', range: [1, 50], what: 'time per grid square on the graph' },
    gridV: { value: 0.050, sf: 2, unit: 'V', range: [0.01, 0.5], what: 'emf per grid square on the graph' },
  },
  calc: (v, K) => {
    const Phi0 = v.B0 * v.A;
    const NPhi = v.N * Phi0;
    const sqArea = v.gridT * v.gridV;
    return {
      Phi0: { value: Phi0, unit: 'Wb', sf: 2 },
      NPhi: { value: NPhi, unit: 'Wb', sf: 2, range: [1e-3, 0.1] },
      sqArea: { value: sqArea, unit: 'mV s', sf: 2 },
      squares: { value: NPhi / sqArea, unit: '', sf: 2 },
      Bavg: { value: NPhi / (v.N * v.A), unit: 'T', sf: 2 },
      t0: { value: Math.sqrt(2 * v.h / K.g), unit: 'ms', sf: 3 },
      v0: { value: Math.sqrt(2 * K.g * v.h), unit: 'm s^-1', sf: 2 },
      wrong_B: { value: NPhi / v.A, unit: 'T', sf: 2 }, // forgot to divide the flux linkage by N
    };
  },
  stem: '<p>A student releases a short bar magnet from rest so that it falls, north pole first, through a coil of [[N:n]] turns and cross-sectional area [[A]]. The coil is connected to a data logger that records the emf induced in it. At the moment of release the centre of the magnet is [[h]] above the centre of the coil. The graph shows how the induced emf varies with time after the release.</p>',
  diagram: { file: 'questions/diagrams/p2-d4-magnet.svg', large: true, alt: 'Graph of emf in volts against time in milliseconds from 0 to 180 ms, on a grid of 10 millisecond by 0.05 volt squares. The emf is zero at first, then dips to a negative pulse that reaches about minus 0.32 volts near 95 milliseconds, crosses zero at about 111 milliseconds, rises to a taller, narrower positive pulse of about plus 0.42 volts near 127 milliseconds, and returns to zero by about 160 milliseconds.' },
  parts: [
    {
      label: 'a', sections: ['faraday', 'lenz'], command: 'Outline', marks: 2, syllabus: ['D.4.H2', 'D.4.H4'],
      question: 'Outline the main features of the graph.',
      markscheme: [
        'the emf is zero while the magnet is far from the coil, then there is a negative pulse as the magnet enters the coil followed by a positive pulse as it leaves, after which the emf returns to zero ✓',
        'the second pulse has a greater peak value and lasts for a shorter time than the first ✓',
      ],
      examinerNote: 'Two pulses of opposite sign, the second taller and narrower. The first mark needs the sequence (zero, negative, positive, zero) linked to entering and leaving, or at least the two opposite pulses; the second needs both the greater height and the shorter duration.',
    },
    {
      label: 'b', sections: ['faraday', 'lenz'], command: 'Explain', marks: 3, syllabus: ['D.4.H2', 'D.4.H4'],
      question: 'Explain why the second pulse has the opposite sign to the first, and why it is taller and shorter.',
      markscheme: [
        'the flux (linkage) through the coil increases as the magnet enters and decreases as it leaves, and by Lenz\'s law the induced emf (current) opposes each change, so the emf reverses direction ✓',
        'the magnet is accelerating under gravity, so it is moving faster when it leaves the coil than when it enters ✓',
        'the flux therefore changes at a greater rate, giving a larger emf (Faraday\'s law), and the same change in flux takes less time, so the pulse is shorter ✓',
      ],
      examinerNote: 'Lenz: repelling the approaching north pole then attracting the receding south pole means an emf of opposite sign. Faraday: emf ∝ rate of change of flux linkage; a faster magnet gives a larger rate and a shorter passage. Accept "the magnet speeds up" for the second mark only if linked to its fall.',
    },
    {
      label: 'c', sections: ['faraday', 'flux'], command: 'Estimate', marks: 2, syllabus: ['D.4.H2', 'T.4'],
      question: 'Estimate, using the graph, the change in the magnetic flux linkage of the coil while the magnet enters it, that is during the first pulse.',
      numeric: { result: 'NPhi', accept: 0.15 },
      markscheme: [
        'the change in flux linkage $N\\Delta\\Phi$ is the area between the first pulse and the time axis (since $\\varepsilon = -N\\dfrac{\\Delta\\Phi}{\\Delta t}$) ✓',
        'area ≈ [[squares:n]] squares × [[sqArea]] per square, so $N\\Delta\\Phi \\approx [[NPhi:2u]]$ ✓',
        'Accept [[NPhi:lo]] to [[NPhi:hi]] Wb, by counting squares or using strips; ignore the sign.',
      ],
      examinerNote: 'Integrating Faraday\'s law gives ∫ε dt = −NΔΦ. One grid square is [[sqArea]]; the first pulse covers about [[squares:n]] squares. The exact area from the model is NΦ₀ = [[NPhi:2u]]; students counting squares usually land within 10 %, so the accept range is 15 %.',
    },
    {
      label: 'd', sections: ['flux'], command: 'Calculate', marks: 2, syllabus: ['D.4.H1'], dependsOn: ['c'],
      question: 'Calculate the average magnetic flux density over the area of the coil when the centre of the magnet is at the centre of the coil.',
      numeric: { result: 'Bavg', accept: 0.15, mistakes: [{ result: 'wrong_B', feedback: 'Your estimate in (c) is the flux linkage of all the turns. Divide by the number of turns to get the flux through one turn before dividing by the area.' }] },
      markscheme: [
        'flux through one turn $\\Phi = \\dfrac{N\\Delta\\Phi}{N} = \\dfrac{[[NPhi:2]]}{[[N:n]]} = [[Phi0:2u]]$ ✓',
        '$B = \\dfrac{\\Phi}{A} = \\dfrac{[[Phi0:2]]}{[[A:n]] \\times 10^{-4}} = [[Bavg:2u]]$ ✓',
        'Allow ECF from (c); accept [[Bavg:lo]] to [[Bavg:hi]] T.',
      ],
      examinerNote: 'Φ = BA cos θ with θ = 0 at the centre: the flux through one turn is the flux linkage from (c) divided by N, and B is that flux divided by the area in m². The field is not uniform over the coil, which is why the question asks for the average.',
    },
    {
      label: 'e', sections: ['faraday'], command: 'Predict', marks: 1, syllabus: ['D.4.H2'],
      question: 'The magnet is now released from a greater height above the coil. Predict, with a reason, how the graph changes.',
      markscheme: [
        'both pulses have greater peak values and are narrower (shorter), because the magnet is moving faster as it passes through the coil, so the flux changes at a greater rate and in a shorter time ✓',
        'Allow: the area under each pulse is unchanged because the total change in flux is the same.',
      ],
      examinerNote: 'The magnet reaches the coil at a higher speed: the pulses arrive earlier, are taller and narrower, but enclose the same area (the same ΔΦ). The mark needs the change and the reason. The release height is [[h]] here; the magnet passes the centre of the coil at about [[t0]] moving at about [[v0]].',
    },
  ],
};
