// B5-P02: a cordless-drill battery pack tested with a variable resistor: emf and internal resistance from a V–I table.
export default {
  id: 'B5-P02',
  title: 'Cordless drill battery pack: emf and internal resistance from data',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['B.5'],
  sections: ['internal', 'emf', 'power', 'pd'],
  batch: 'batch-3',
  situation: 'cordless drill battery pack tested with a variable resistor',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the B.5 understandings (emf and internal resistance, potential difference as energy per unit charge, power). The battery pack, the table of readings (chosen to lie exactly on V = ε − Ir with realistic values for a power tool), the graph and the parts are our own; the hand-written B5-017 uses a resistor network and B5-P01 a thermistor circuit.',
  },
  given: {
    I1: { value: 2.0, sf: 2, unit: 'A', range: [0.5, 40], what: 'first current in the table' },
    I2: { value: 6.0, sf: 2, unit: 'A', range: [0.5, 40], what: 'second current in the table' },
    I3: { value: 10.0, sf: 3, unit: 'A', range: [0.5, 40], what: 'third current in the table' },
    I4: { value: 14.0, sf: 3, unit: 'A', range: [0.5, 40], what: 'fourth current in the table (used for the power)' },
    I5: { value: 18.0, sf: 3, unit: 'A', range: [0.5, 40], what: 'fifth current in the table' },
    V1: { value: 19.5, sf: 3, unit: 'V', range: [10, 25], what: 'terminal p.d. at the first current' },
    V2: { value: 18.5, sf: 3, unit: 'V', range: [10, 25], what: 'terminal p.d. at the second current' },
    V3: { value: 17.5, sf: 3, unit: 'V', range: [10, 25], what: 'terminal p.d. at the third current' },
    V4: { value: 16.5, sf: 3, unit: 'V', range: [10, 25], what: 'terminal p.d. at the fourth current' },
    V5: { value: 15.5, sf: 3, unit: 'V', range: [10, 25], what: 'terminal p.d. at the fifth current' },
  },
  calc: (v) => {
    const r = (v.V1 - v.V5) / (v.I5 - v.I1); // minus the gradient of the straight line
    const eps = v.V1 + v.I1 * r; // the intercept on the V axis
    return {
      eps: { value: eps, unit: 'V', sf: 3, range: [15, 25] },
      r: { value: r, unit: 'Ω', sf: 2, range: [0.1, 0.6] },
      grad: { value: -r, unit: 'V A^-1', sf: 2 },
      P: { value: v.V4 * v.I4, unit: 'W', sf: 3, range: [50, 600] },
      Pint: { value: v.I4 * v.I4 * r, unit: 'W', sf: 2 },
      Imax: { value: eps / r, unit: 'A', sf: 2 },
      wrong_P: { value: eps * v.I4, unit: 'W', sf: 3 }, // used the emf instead of the terminal p.d.
    };
  },
  stem: '<p>A cordless drill is powered by a rechargeable pack of lithium cells. To test the pack, a technician uses a variable resistor to draw a range of currents $I$ from it and measures the terminal potential difference $V$ of the pack at each current. The readings are shown in the table.</p><table><tr><th>$I$ / A</th><th>$V$ / V</th></tr><tr><td>[[I1:n]]</td><td>[[V1:n]]</td></tr><tr><td>[[I2:n]]</td><td>[[V2:n]]</td></tr><tr><td>[[I3:n]]</td><td>[[V3:n]]</td></tr><tr><td>[[I4:n]]</td><td>[[V4:n]]</td></tr><tr><td>[[I5:n]]</td><td>[[V5:n]]</td></tr></table>',
  diagram: { file: 'questions/diagrams/p2-b5-drill-axes.svg', large: true, alt: 'Empty axes for a graph of terminal potential difference V in volts, from 14 to 21 V, against current I in amperes, from 0 to 20 A, with a grid of 1 A by 0.5 V squares.' },
  parts: [
    {
      label: 'a', sections: ['internal'], command: 'Draw', marks: 2, syllabus: ['T.4', 'B.5.11'],
      question: 'Draw, on the axes provided, a graph of $V$ against $I$ for the readings in the table, with a line of best fit.',
      markscheme: [
        'all five points plotted correctly, to within half a small square ✓',
        'a single straight line of best fit through the points, extended to meet the $V$ axis ✓',
        'Note: the examiner\'s graph: <img src="questions/diagrams/p2-b5-drill-ms.svg" alt="The five points plotted as crosses on the grid, with a straight line of best fit passing through all of them and extended to meet the vertical axis above the highest point.">',
      ],
      examinerNote: 'The points lie exactly on a straight line. The second mark needs a ruled line extended to the V axis, so the intercept can be read in (b).',
    },
    {
      label: 'b(i)', sections: ['internal', 'emf'], command: 'Determine', marks: 1, syllabus: ['B.5.11', 'T.4'],
      question: 'Determine the emf of the pack.',
      numeric: { result: 'eps', accept: 0.01 },
      markscheme: ['$\\varepsilon$ = intercept on the $V$ axis (where $I = 0$) $= [[eps:3u]]$ ✓'],
      examinerNote: 'From V = ε − Ir, the intercept is the emf: the terminal p.d. when no current is drawn.',
    },
    {
      label: 'b(ii)', sections: ['internal'], command: 'Determine', marks: 2, syllabus: ['B.5.11', 'T.4'],
      question: 'Determine the internal resistance of the pack.',
      numeric: { result: 'r', accept: 0.08 },
      markscheme: [
        'gradient $= -r$, e.g. gradient $= \\dfrac{[[V5:n]] - [[V1:n]]}{[[I5:n]] - [[I1:n]]} = [[grad:n]]\\ \\text{V A}^{-1}$ ✓',
        '$r = [[r:2u]]$ ✓',
        'Accept [[r:lo]] to [[r:hi]] Ω from a correctly drawn line, or the same value from $\\varepsilon = I(R + r)$ with one pair of readings and the emf from (b)(i).',
      ],
      examinerNote: 'Comparing V = ε − Ir with y = mx + c: the gradient is −r. Any two well-separated points on the line give 0.25 Ω.',
    },
    {
      label: 'c', sections: ['power', 'internal'], command: 'Calculate', marks: 1, syllabus: ['B.5.9', 'B.5.11'],
      question: 'The pack is then fitted to the drill. Calculate the power delivered to the drill when the current is [[I4]].',
      numeric: { result: 'P', accept: 0.02, mistakes: [{ result: 'wrong_P', feedback: 'The power delivered to the drill is the terminal p.d. (the p.d. across the drill) times the current, not the emf times the current: part of the emf is used inside the pack.' }] },
      markscheme: ['$P = VI = [[V4:n]] \\times [[I4:n]] = [[P:3u]]$ ✓'],
      examinerNote: 'The terminal p.d. at 14.0 A is in the table (or read from the graph). ε × I = 280 W is the expected wrong answer; it includes the power dissipated inside the pack.',
    },
    {
      label: 'd', sections: ['internal', 'pd'], command: 'Explain', marks: 2, syllabus: ['B.5.11', 'B.5.4'],
      question: 'Explain, in terms of energy, why the terminal potential difference is lower at higher currents.',
      markscheme: [
        'the emf is the energy transferred to each coulomb of charge by the chemical reactions inside the pack, and it does not change ✓',
        'some of this energy, $Ir$ per coulomb, is transferred to internal energy (heating) in the internal resistance of the pack, and this share grows as the current increases, so less energy per coulomb, $V = \\varepsilon - Ir$, is delivered to the external circuit ✓',
      ],
      examinerNote: 'Potential difference as energy per unit charge (B.5.4) applied to the cell: fixed emf, a growing "lost" Ir inside the pack. Quoting V = ε − Ir without the energy interpretation earns at most one mark.',
    },
    {
      label: 'e', sections: ['internal', 'power'], command: 'Outline', marks: 2, syllabus: ['B.5.11', 'B.5.9'],
      question: 'Outline why a pack of cells for a power tool should have a small internal resistance.',
      markscheme: [
        'a power tool draws a large current, so with a larger internal resistance the p.d. lost inside the pack ($Ir$) would be large and the terminal p.d., and so the power available to the motor, would fall sharply under load ✓',
        'the power dissipated inside the pack, $I^2 r$, would be large, wasting the stored energy and heating the pack ✓',
      ],
      examinerNote: 'Aim 7 (technology). At 14 A even this pack dissipates I²r = 49 W internally against 231 W delivered; a pack with four times the internal resistance would lose 14 V at 14 A. Accept the shorter run time or the risk of overheating as the second point.',
    },
  ],
};
