// D3-P02: jump leads carrying equal currents in opposite directions — B = μ0I/2πr (new booklet equation for 2028),
// the force on one lead and its direction from the diagram, the field midway between the leads (where the two
// fields add), and how the force changes with separation.
// Replaces D3-P01 (withdrawn 14 November 2026), whose situation and parts were too close to the hand-written D3-016.
export default {
  id: 'D3-P02',
  title: 'Jump leads: field and force between two cables',
  situation: 'jump leads carrying opposite currents between two cars',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['D.3'],
  sections: ['parallel'],
  batch: 'batch-4',
  y2028: true,
  originality: {
    inspiredBy: null,
    note: 'Written for this bank for the field of a long straight wire, B = μ0I/2πr, added to D.3 and the data booklet for 2028. The jump-lead context, the opposite currents, the numbers and the parts are our own. Deliberately unlike the hand-written D3-016 (two wires with currents in the same direction; attract or repel; why the forces are equal): here the currents are opposite, the direction of the force is deduced step by step from the diagram, the fields between the leads add, and the last part is a proportional-reasoning prediction.',
  },
  given: {
    I: { value: 160, sf: 2, unit: 'A', range: [50, 400], what: 'current in each lead while the starter motor turns' },
    d: { value: 2.5, sf: 2, unit: 'cm', range: [1, 10], what: 'distance between the centres of the two leads' },
    L: { value: 1.8, sf: 2, unit: 'm', range: [0.5, 5], what: 'length of the straight parallel section' },
  },
  calc: (v, K) => {
    const B = K.mu0 * v.I / (2 * Math.PI * v.d);
    return {
      B: { value: B, unit: 'T', sf: 2 },
      F: { value: B * v.I * v.L, unit: 'N', sf: 2, range: [0.01, 10] },
      Bmid: { value: 2 * K.mu0 * v.I / (2 * Math.PI * (v.d / 2)), unit: 'T', sf: 2 },
      wrong_B: { value: K.mu0 * v.I / (2 * Math.PI * v.d * 100), unit: 'T', sf: 2, noDimensionCheck: true }, // distance left in cm
      wrong_F: { value: B * v.I, unit: 'N', sf: 2, noDimensionCheck: true }, // the force on one metre: the length left out
      wrong_Bmid: { value: 2 * B, unit: 'T', sf: 2 }, // added the two fields but used the full separation
    };
  },
  calcLiterals: { 100: 'centimetres in a metre, only for the wrong answer "distance left in cm"' },
  stem: '<p>A car with a flat battery is started using jump leads: two long flexible cables that join it to the battery of a second car. While the starter motor turns, each lead carries a current of [[I]]. The current goes to the starter motor along the red lead and comes back along the black lead, so the currents in the two leads are in opposite directions.</p><p>Along a straight section of length [[L]] the two leads lie parallel to each other, with their centres [[d]] apart, as shown. Along this section each lead can be treated as a very long straight wire.</p>',
  diagram: { file: 'questions/diagrams/p2-d3-jump-leads.svg', alt: 'Two long parallel cables seen from above. The upper one, labelled red lead, carries 160 A to the right. The lower one, labelled black lead, carries 160 A to the left. Their centres are 2.5 cm apart and the straight section is 1.8 m long. Not to scale.' },
  parts: [
    {
      label: 'a', sections: ['parallel'], command: 'Calculate', marks: 2, syllabus: ['D.3.Y1'],
      question: 'Calculate the magnetic field strength at the black lead due to the current in the red lead.',
      numeric: { result: 'B', accept: 0.03, mistakes: [{ result: 'wrong_B', feedback: 'Convert the distance between the leads to metres before using it.' }] },
      markscheme: [
        '$B = \\dfrac{\\mu_0 I}{2\\pi r}$ with $r$ in metres ✓',
        '$B = \\dfrac{[[K.mu0]] \\times [[I:n]]}{2\\pi \\times [[d:n]] \\times 10^{-2}} = [[B:2u]]$ ✓',
      ],
      examinerNote: 'The new data-booklet equation for the field of a long straight wire.',
    },
    {
      label: 'b', sections: ['parallel'], command: 'Determine', marks: 2, syllabus: ['D.3.5', 'D.3.6'], dependsOn: ['a'],
      question: 'Determine the magnetic force on the straight section of the black lead.',
      numeric: { result: 'F', accept: 0.04, mistakes: [{ result: 'wrong_F', feedback: 'That is the force on each metre of the lead. Multiply by the length of the straight section.' }] },
      markscheme: [
        '$F = BIL$, with the field from (a) at right angles to the lead (OR $\\dfrac{F}{L} = \\dfrac{\\mu_0 I_1 I_2}{2\\pi r}$) ✓',
        '$F = [[B:2]] \\times [[I:n]] \\times [[L:n]] = [[F:2u]]$ ✓',
        'Allow ECF from (a); accept [[F:lo]] to [[F:hi]] N',
      ],
      examinerNote: 'The field of the red lead is perpendicular to the black lead, so sin θ = 1. The force is small, a few tenths of a newton on nearly two metres of cable.',
    },
    {
      label: 'c', sections: ['parallel'], command: 'Deduce', marks: 2, syllabus: ['D.3.5', 'D.3.Y1'],
      question: 'Deduce, using the diagram, which way the magnetic force acts on the black lead.',
      markscheme: [
        'the magnetic field of the red lead at the black lead is directed into the page (right-hand grip rule for a current to the right, at a point below the wire) ✓',
        'the current in the black lead is to the left, so the force on it is towards the bottom of the diagram, away from the red lead (left-hand rule, or any equivalent rule) ✓',
        'Accept "away from the red lead" or "towards the bottom of the diagram". Do not accept "downwards" unless it clearly means down the page: the diagram is a view from above.',
        'Do not accept "opposite currents repel" on its own: the direction must be deduced from the field and the current.',
      ],
      examinerNote: 'Two steps: the direction of the field, then the direction of the force on a current in that field. The force on the red lead is equal and opposite (towards the top of the diagram), so the leads are pushed apart.',
    },
    {
      label: 'd', sections: ['parallel'], command: 'Determine', marks: 2, syllabus: ['D.3.Y1'], dependsOn: ['a'],
      question: 'Determine the resultant magnetic field strength, due to the currents in the two leads, at a point midway between them.',
      numeric: { result: 'Bmid', accept: 0.03, mistakes: [{ result: 'wrong_Bmid', feedback: 'The fields do add, but the midway point is only half the separation from each lead, so each field is larger than your answer to (a).' }] },
      markscheme: [
        'midway between the leads the two fields are in the same direction (right-hand grip rule: the point is on opposite sides of two opposite currents), so they add ✓',
        '$B = 2 \\times \\dfrac{[[K.mu0]] \\times [[I:n]]}{2\\pi \\times \\tfrac{1}{2} \\times [[d:n]] \\times 10^{-2}} = [[Bmid:2u]]$ ✓',
        'Allow ECF from (a): the answer is 4 × the field in (a).',
      ],
      examinerNote: 'With opposite currents the fields reinforce between the leads (and partly cancel outside them). The answer is four times the answer to (a): twice the field, at half the distance. With currents in the same direction the fields at the midpoint would cancel. The guide does not list the addition of magnetic fields separately, but no further equation is needed.',
    },
    {
      label: 'e', sections: ['parallel'], command: 'Predict', marks: 2, syllabus: ['D.3.Y1', 'D.3.6'],
      question: 'Predict, with a reason, how the force on the straight section of the black lead changes when the leads, still carrying the same currents, are moved so that their centres are twice as far apart.',
      markscheme: [
        'the magnetic field of the red lead at the black lead is inversely proportional to the distance from it ($B \\propto \\dfrac{1}{r}$), so it halves ✓',
        'the current and the length are unchanged, so the force ($F = BIL$) also halves ✓',
        'OR from $\\dfrac{F}{L} = \\dfrac{\\mu_0 I_1 I_2}{2\\pi r}$: the force is inversely proportional to the separation when the currents and the length are unchanged [1], so the force halves [1].',
      ],
      examinerNote: 'Proportional reasoning: the force is inversely proportional to the separation, not to its square.',
    },
  ],
};
