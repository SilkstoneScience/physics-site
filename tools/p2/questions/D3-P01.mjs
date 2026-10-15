// D3-P01: two long parallel wires — B = μ0I/2πr (new booklet equation for 2028), force and the zero-field point.
export default {
  id: 'D3-P01',
  title: 'Two parallel wires: field and force',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['D.3', 'A.2'],
  batch: 'batch-2028',
  y2028: true,
  originality: {
    inspiredBy: null,
    note: 'Written for this bank for the field of a long straight wire, B = μ0I/2πr, added to D.3 and the data booklet for 2028. The currents, separation and the zero-field part are our own.',
  },
  given: {
    IP: { value: 15, sf: 2, unit: 'A', range: [1, 50], what: 'current in wire P' },
    IQ: { value: 5.0, sf: 2, unit: 'A', range: [1, 50], what: 'current in wire Q (same direction as P)' },
    d: { value: 6.0, sf: 2, unit: 'cm', range: [1, 20], what: 'distance between the wires' },
  },
  calc: (v, K) => {
    const B = K.mu0 * v.IP / (2 * Math.PI * v.d);
    return {
      B: { value: B, unit: 'T', sf: 2 },
      FL: { value: B * v.IQ, unit: 'N m^-1', sf: 2 },
      x0: { value: v.d * v.IP / (v.IP + v.IQ), unit: 'cm', sf: 2 },
      wrong_B: { value: K.mu0 * v.IP / (2 * Math.PI * v.d * 100), unit: 'T', sf: 2, noDimensionCheck: true }, // distance left in cm
    };
  },
  calcLiterals: { 100: 'centimetres in a metre, only for the wrong answer "distance left in cm"' },
  stem: '<p>Two long straight parallel wires, P and Q, are [[d]] apart in air. P carries a current of [[IP]] and Q carries a current of [[IQ]] in the same direction.</p>',
  diagram: { file: 'questions/diagrams/p2-d3-wires.svg', alt: 'Two long vertical wires, P on the left and Q on the right, 6.0 cm apart. Arrows show that both currents flow upwards: 15 A in P and 5.0 A in Q.' },
  parts: [
    {
      label: 'a', command: 'Calculate', marks: 2, syllabus: ['D.3.Y1'],
      question: 'Calculate the magnetic field strength due to P at the position of Q.',
      numeric: { result: 'B', accept: 0.03, mistakes: [{ result: 'wrong_B', feedback: 'Convert the distance to metres: 6.0 cm = 0.060 m.' }] },
      markscheme: [
        '$B = \\dfrac{\\mu_0 I}{2\\pi r}$ with $r$ in metres ✓',
        '$B = \\dfrac{[[K.mu0]] \\times [[IP:n]]}{2\\pi \\times [[d:n]] \\times 10^{-2}} = [[B:2u]]$ ✓',
      ],
      examinerNote: 'The new data-booklet equation for the field of a long straight wire.',
    },
    {
      label: 'b', command: 'Determine', marks: 2, syllabus: ['D.3.5', 'D.3.6'], dependsOn: ['a'],
      question: 'Determine the force on each metre of wire Q.',
      numeric: { result: 'FL', accept: 0.03 },
      markscheme: [
        '$F = BIL$, so $\\dfrac{F}{L} = BI_{\\text{Q}}$ (OR $\\dfrac{F}{L} = \\dfrac{\\mu_0 I_1 I_2}{2\\pi r}$) ✓',
        '$\\dfrac{F}{L} = [[B:2]] \\times [[IQ:n]] = [[FL:2u]]$; allow ECF from (a) ✓',
      ],
      examinerNote: 'The field of P is perpendicular to Q, so sin θ = 1. Both routes give the same answer.',
    },
    {
      label: 'c', command: 'Outline', marks: 2, syllabus: ['D.3.6', 'A.2.1'],
      question: 'Outline how the force on P compares with the force on Q, in both magnitude and direction.',
      markscheme: [
        'the forces are equal in magnitude, even though the currents are different (Newton\'s third law) ✓',
        'they are in opposite directions: each wire is attracted towards the other, because the currents are in the same direction ✓',
      ],
      examinerNote: 'A common mistake is to think the wire with the larger current feels the larger force.',
    },
    {
      label: 'd', command: 'Determine', marks: 2, syllabus: ['D.3.Y1'],
      question: 'At one point on the line between P and Q, the resultant magnetic field due to the two wires is zero. Determine the distance of this point from P.',
      numeric: { result: 'x0', accept: 0.03 },
      markscheme: [
        'between the wires the two fields are in opposite directions, so $\\dfrac{\\mu_0 I_{\\text{P}}}{2\\pi x} = \\dfrac{\\mu_0 I_{\\text{Q}}}{2\\pi (d - x)}$ ✓',
        '$\\dfrac{[[IP:n]]}{x} = \\dfrac{[[IQ:n]]}{[[d:n]] - x}$, so $x = [[x0:2u]]$ from P ✓',
      ],
      examinerNote: 'The point is nearer the wire with the smaller current. With B ∝ I/r, the distances are in the ratio of the currents.',
    },
  ],
};
