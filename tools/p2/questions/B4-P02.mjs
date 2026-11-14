// B4-P02: helium expanding adiabatically against a piston in a helium liquefier (one process, not a cycle):
// PV^(5/3) = constant, the final temperature, the work done from the first law, why the gas cools (particles),
// and a sketch comparing the expansion with one at constant temperature.
// Replaces B4-P01 (withdrawn 14 November 2026), whose cycle and parts were too close to the hand-written B4-013.
export default {
  id: 'B4-P02',
  title: 'Helium liquefier: adiabatic expansion against a piston',
  situation: 'helium expanding adiabatically against a piston in a liquefier',
  type: 'short',
  level: 'HL',
  difficulty: 3,
  topics: ['B.4', 'B.3'],
  sections: ['adiabatic', 'first', 'internal', 'processes', 'work'],
  batch: 'batch-4',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the B.4 understandings (adiabatic change of a monatomic ideal gas, first law, internal energy, processes on a pressure–volume diagram). Helium liquefiers really do cool helium by letting it do work on a piston; the cylinder, numbers and parts are our own. Deliberately not a cycle, unlike the hand-written B4-013 and the withdrawn B4-P01: one adiabatic expansion, compared with an isothermal one.',
  },
  given: {
    // 1.0 × 10⁶ Pa: the pressure in state Y is then 2.17 × 10⁵ Pa, so "about 2.2 × 10⁵ Pa" can be shown by giving one
    // more figure however the student rounds the ratio (with 1.2 × 10⁶ Pa it was 2.606 × 10⁵ Pa: 2.60 or 2.61).
    p1: { value: 1.0e6, sf: 2, unit: 'Pa', range: [1e5, 3e6], what: 'pressure of the helium before the expansion' },
    T1: { value: 60, sf: 2, unit: 'K', range: [10, 300], what: 'temperature of the helium before the expansion' },
    V1: { value: 2.0e-4, sf: 2, unit: 'm^3', range: [1e-5, 1e-2], what: 'volume of the helium before the expansion' },
    V2: { value: 5.0e-4, sf: 2, unit: 'm^3', range: [1e-5, 1e-2], what: 'volume of the helium after the expansion' },
  },
  calcLiterals: { 5: 'the exponent 5/3 in PV^(5/3) = constant (data booklet, monatomic ideal gas)' },
  calc: (v) => {
    const p2 = v.p1 * (v.V1 / v.V2) ** (5 / 3);
    const T2 = v.T1 * (p2 * v.V2) / (v.p1 * v.V1);
    return {
      p2: { value: p2, unit: 'Pa', sf: 3, range: [1e4, 3e6] },
      T2: { value: T2, unit: 'K', sf: 3, range: [2, 300] },
      W: { value: (3 / 2) * (v.p1 * v.V1 - p2 * v.V2), unit: 'J', sf: 3, range: [1, 1e5] },
      p2iso: { value: v.p1 * v.V1 / v.V2, unit: 'Pa', sf: 2 },
      wrong_W: { value: v.p1 * (v.V2 - v.V1), unit: 'J', sf: 3 }, // used W = PΔV with the starting pressure
      wrong_W2: { value: v.p1 * v.V1 - p2 * v.V2, unit: 'J', sf: 3 }, // left out the 3/2
    };
  },
  stem: '<p>A helium liquefier cools helium gas by letting it expand and push a piston. Helium behaves as an ideal monatomic gas.</p><p>A cylinder holds a fixed mass of helium at a pressure of [[p1]] and a temperature of [[T1]], in a volume of [[V1]] (state X). The helium then expands adiabatically, pushing the piston outwards, until its volume is [[V2]] (state Y). The graph shows how the pressure $P$ of the helium varies with its volume $V$ during this expansion.</p>',
  diagram: { file: 'questions/diagrams/p2-b4-liquefier.svg', alt: 'Graph of pressure in units of 10 to the power 5 pascal, from 0 to 12, against volume in units of 10 to the power minus 4 cubic metres, from 0 to 6. A curve falls steeply and then more gently from state X at volume 2.0 and pressure 10 to state Y at volume 5.0, where the pressure is a little above 2.' },
  parts: [
    {
      label: 'a', sections: ['adiabatic'], command: 'Show that', marks: 2, syllabus: ['B.4.H8'],
      question: 'Show that the pressure of the helium in state Y is about [[p2:2u]].',
      showThat: { result: 'p2', sf: 2 },
      markscheme: [
        '$P_{\\text{X}} V_{\\text{X}}^{5/3} = P_{\\text{Y}} V_{\\text{Y}}^{5/3}$ ✓',
        '$P_{\\text{Y}} = [[p1:n]] \\times \\left(\\dfrac{[[V1:n]]}{[[V2:n]]}\\right)^{5/3} = [[p2:3u]]$ ✓',
        'Do not accept a value read from the graph.',
      ],
      examinerNote: 'The adiabatic equation from the data booklet for a monatomic ideal gas.',
    },
    {
      label: 'b', sections: ['adiabatic'], command: 'Determine', marks: 2, syllabus: ['B.3.4', 'B.4.H7'], dependsOn: ['a'],
      question: 'Determine the temperature of the helium in state Y.',
      numeric: { result: 'T2', accept: 0.03 },
      markscheme: [
        '$\\dfrac{PV}{T}$ is constant for a fixed mass of an ideal gas, so $T_{\\text{Y}} = T_{\\text{X}} \\times \\dfrac{P_{\\text{Y}} V_{\\text{Y}}}{P_{\\text{X}} V_{\\text{X}}}$ ✓',
        '$T_{\\text{Y}} = [[T1:n]] \\times \\dfrac{[[p2:4]] \\times [[V2:n]]}{[[p1:n]] \\times [[V1:n]]} = [[T2:3u]]$ ✓',
        'Allow ECF from (a); accept [[T2:lo]] to [[T2:hi]] K',
        'Accept the equivalent $T_{\\text{Y}} = T_{\\text{X}}\\left(\\dfrac{V_{\\text{X}}}{V_{\\text{Y}}}\\right)^{2/3}$.',
      ],
      examinerNote: 'The ideal gas law applied to the two states; the amount of gas is not needed. The working uses the unrounded pressure from (a); the rounded value gives a temperature about 1 % higher, inside the accepted range.',
    },
    {
      label: 'c', sections: ['first', 'internal'], command: 'Determine', marks: 2, syllabus: ['B.4.H1', 'B.4.H3', 'B.4.H7'], dependsOn: ['a'],
      question: 'Determine the work done by the helium on the piston during the expansion.',
      numeric: {
        result: 'W', accept: 0.04,
        mistakes: [
          { result: 'wrong_W', feedback: 'W = PΔV only works when the pressure stays constant, and here it falls. Use the first law instead: no thermal energy is transferred, so the work done equals the decrease in internal energy.' },
          { result: 'wrong_W2', feedback: 'That is the change in PV. For a monatomic ideal gas the internal energy is 3/2 PV, so the work done is 3/2 of this.' },
        ],
      },
      markscheme: [
        '$Q = 0$, so the work done by the gas equals the decrease in its internal energy, $W = \\tfrac{3}{2}(P_{\\text{X}}V_{\\text{X}} - P_{\\text{Y}}V_{\\text{Y}})$ (from $U = \\tfrac{3}{2}nRT$ and $PV = nRT$) ✓',
        '$W = \\tfrac{3}{2}([[p1:n]] \\times [[V1:n]] - [[p2:4]] \\times [[V2:n]]) = [[W:3u]]$ ✓',
        'OR $W = \\tfrac{3}{2}nR(T_{\\text{X}} - T_{\\text{Y}})$, with the amount of gas from $PV = nRT$.',
        'Allow ECF from (a) and (b); accept [[W:lo]] to [[W:hi]] J',
      ],
      examinerNote: 'Students cannot find the area under the curve exactly, but the first law with Q = 0 gives the work. The amount of gas is not needed because U = 3/2 PV for a monatomic ideal gas. The working uses the unrounded pressure from (a); the rounded value gives an answer about 2 % smaller, inside the accepted range.',
    },
    {
      label: 'd', sections: ['internal'], command: 'Explain', marks: 2, syllabus: ['B.3.8', 'B.4.H1'],
      question: 'Explain, in terms of the helium atoms that collide with the piston, why the temperature of the helium falls.',
      markscheme: [
        'the piston is moving away, so atoms that collide with it rebound with a smaller speed than before: they do work on the piston and lose kinetic energy ✓',
        'no thermal energy enters to replace it, so the average random kinetic energy of the atoms decreases, and temperature is a measure of this average kinetic energy ✓',
      ],
      examinerNote: 'A particle explanation of the first law for this process. Do not credit "the gas expands so it cools" without a reason.',
    },
    {
      label: 'e', sections: ['processes'], command: 'Sketch', marks: 2, syllabus: ['B.4.H7', 'B.3.4'],
      question: 'Sketch, on a copy of the graph, a line to show how the pressure would vary with volume if the helium expanded from state X to the same final volume at constant temperature (isothermally).',
      markscheme: [
        'a smooth curve from X whose steepness decreases (not a straight line) and which lies above the adiabatic curve at every volume after X ✓',
        'it ends at the same final volume as Y, at a pressure of [[p2iso:2u]] (from $P_{\\text{X}}V_{\\text{X}} = PV$; allow an end point within a quarter of a grid square of this value) ✓',
        'Note: the examiner\'s sketch is shown below.<figure><img src="questions/diagrams/p2-b4-liquefier-ms.svg" alt="The same graph with a second, dashed curve from X, labelled isothermal. It falls less steeply than the adiabatic curve and ends at the same final volume as Y, at about twice the pressure."></figure>',
      ],
      examinerNote: 'At constant temperature PV is constant, so the pressure falls less quickly than on the adiabat, where the gas is also cooling. Students sketch on paper and compare with the examiner\'s sketch in the mark scheme.',
    },
    {
      label: 'f', sections: ['work'], command: 'Deduce', marks: 1, syllabus: ['B.4.H2'],
      question: 'Deduce, using your sketch, which of the two expansions does more work on the piston.',
      markscheme: [
        'the isothermal expansion, because the work done is the area under the line on a pressure–volume graph and its line is higher throughout ✓',
        'Accept: the pressure, and so the force on the piston, is larger at every volume for the same change in volume. Do not allow ECF from a line drawn below the adiabatic curve in (e).',
      ],
      examinerNote: 'Work done by a gas = area under its P–V line. At constant temperature thermal energy enters the gas and keeps the pressure up.',
    },
  ],
};
