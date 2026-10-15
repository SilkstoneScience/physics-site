// B4-P01: a three-stage cycle with an adiabatic compression (first law, efficiency, entropy).
export default {
  id: 'B4-P01',
  title: 'Cycle with an adiabatic compression',
  type: 'short',
  level: 'HL',
  difficulty: 3,
  topics: ['B.4'],
  batch: 'batch-1',
  batchRule: 'inspect-all',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the B.4 understandings. Deliberately different from the May 2025 TZ3 cycle: stages isobaric, isovolumetric and adiabatic (PV^(5/3) = constant), work on the adiabatic stage from the first law with Q = 0, and an entropy part; no amount of gas is given.',
  },
  given: {
    pA: { value: 2.0e5, sf: 2, unit: 'Pa', range: [5e4, 1e6], what: 'pressure at A and B' },
    VA: { value: 1.0e-3, sf: 2, unit: 'm^3', range: [1e-4, 1e-2], what: 'volume at A' },
    VB: { value: 2.0e-3, sf: 2, unit: 'm^3', range: [2e-4, 2e-2], what: 'volume at B and C' },
  },
  calcLiterals: { 5: 'the exponent 5/3 in PV^(5/3) = constant (data booklet, monatomic ideal gas)' },
  calc: (v) => {
    const pC = v.pA * (v.VA / v.VB) ** (5 / 3);
    const W_AB = v.pA * (v.VB - v.VA);
    const dU_AB = (3 / 2) * v.pA * (v.VB - v.VA);
    const Q_AB = dU_AB + W_AB;
    const W_onCA = (3 / 2) * (v.pA * v.VA - pC * v.VB); // Q = 0, so work done on the gas = ΔU
    const Wnet = W_AB - W_onCA;
    return {
      pC: { value: pC, unit: 'Pa', sf: 3, range: [1e4, 1e6] },
      W_AB: { value: W_AB, unit: 'J', sf: 3 },
      dU_AB: { value: dU_AB, unit: 'J', sf: 3 },
      Q_AB: { value: Q_AB, unit: 'J', sf: 3 },
      W_onCA: { value: W_onCA, unit: 'J', sf: 3 },
      Wnet: { value: Wnet, unit: 'J', sf: 3 },
      eff: { value: Wnet / Q_AB, unit: '', sf: 2, range: [0.05, 0.6] },
      wrong_Q_AB: { value: W_AB, unit: 'J', sf: 3 }, // forgot the internal energy
      wrong_eff: { value: W_AB / Q_AB, unit: '', sf: 2 }, // used the work in one stage, not the net work
    };
  },
  stem: '<p>A fixed mass of a monatomic ideal gas is taken round the cycle A → B → C → A shown on the graph.</p><ul><li>A → B: the gas expands at a constant pressure of [[pA]] from [[VA]] to [[VB]].</li><li>B → C: the gas cools at constant volume.</li><li>C → A: the gas is compressed adiabatically back to A.</li></ul>',
  diagram: { file: 'questions/diagrams/p2-b4-cycle.svg', alt: 'Graph of pressure in units of 10 to the power 5 pascal against volume in units of 10 to the power minus 3 cubic metres. A horizontal line from A at volume 1.0 to B at volume 2.0, both at pressure 2.0. A vertical line down from B to C at volume 2.0 and pressure about 0.63. A curve rising steeply from C back to A.' },
  parts: [
    {
      label: 'a', command: 'Show that', marks: 2, syllabus: ['B.4.H8'],
      question: 'Show that the pressure at C is about [[pC:2u]].',
      showThat: { result: 'pC', sf: 2 },
      markscheme: [
        '$p_{\\text{C}} V_{\\text{C}}^{5/3} = p_{\\text{A}} V_{\\text{A}}^{5/3}$ ✓',
        '$p_{\\text{C}} = [[pA:n]] \\times \\left(\\dfrac{[[VA:n]]}{[[VB:n]]}\\right)^{5/3} = [[pC:3u]]$ ✓',
      ],
      examinerNote: 'The adiabatic equation from the data booklet, applied between C and A (V_C = V_B).',
    },
    {
      label: 'b', command: 'Determine', marks: 3, syllabus: ['B.4.H1', 'B.4.H2', 'B.4.H3'],
      question: 'Determine the thermal energy transferred to the gas during A → B.',
      numeric: { result: 'Q_AB', accept: 0.03, mistakes: [{ result: 'wrong_Q_AB', feedback: 'That is only the work done by the gas. The internal energy of the gas also increases: Q = ΔU + W.' }] },
      markscheme: [
        '$W = p\\Delta V = [[W_AB:3u]]$ ✓',
        '$\\Delta U = \\tfrac{3}{2}p\\Delta V$ (from $\\tfrac{3}{2}nR\\Delta T$ and $pV = nRT$) $= [[dU_AB:3u]]$ ✓',
        '$Q = \\Delta U + W = [[Q_AB:3u]]$ ✓',
      ],
      examinerNote: 'For a monatomic ideal gas ΔU = 3/2 Δ(pV); at constant pressure that is 3/2 pΔV. No amount of gas is needed.',
    },
    {
      label: 'c', command: 'Determine', marks: 2, syllabus: ['B.4.H1', 'B.4.H3', 'B.4.H7'], dependsOn: ['a'],
      question: 'Determine the work done on the gas during C → A.',
      numeric: { result: 'W_onCA', accept: 0.04 },
      markscheme: [
        '$Q = 0$, so the work done on the gas equals the increase in internal energy ✓',
        '$\\Delta U = \\tfrac{3}{2}(p_{\\text{A}}V_{\\text{A}} - p_{\\text{C}}V_{\\text{C}}) = [[W_onCA:3u]]$ ✓',
        'Allow ECF from (a); accept [[W_onCA:lo]] to [[W_onCA:hi]] J',
      ],
      examinerNote: 'Students cannot integrate under the adiabat, but the first law with Q = 0 gives the work. Using the rounded p_C from (a) gives about the same answer.',
    },
    {
      label: 'd', command: 'Calculate', marks: 2, syllabus: ['B.4.H9'], dependsOn: ['b', 'c'],
      question: 'Calculate the efficiency of this cycle.',
      numeric: { result: 'eff', accept: 0.06, mistakes: [{ result: 'wrong_eff', feedback: 'Efficiency uses the NET work done by the gas over the whole cycle: subtract the work done on the gas during C → A.' }] },
      markscheme: [
        'net work $= [[W_AB:3]] - [[W_onCA:3]] = [[Wnet:3u]]$ (no work during B → C) ✓',
        '$\\eta = \\dfrac{[[Wnet:3]]}{[[Q_AB:3]]} = [[eff:2]]$ ✓',
        'Allow ECF from (b) and (c); accept [[eff:lo]] to [[eff:hi]]',
      ],
      examinerNote: 'Thermal energy enters only during A → B (B → C rejects energy, C → A has Q = 0).',
    },
    {
      label: 'e', command: 'Explain', marks: 2, syllabus: ['B.4.H4', 'B.4.H7'],
      question: 'Explain why the entropy of the gas does not change during C → A.',
      markscheme: [
        'No thermal energy is transferred to or from the gas during an adiabatic change ($Q = 0$) ✓',
        'so $\\Delta S = \\dfrac{\\Delta Q}{T} = 0$ (the change is treated as reversible) ✓',
      ],
      examinerNote: 'Entropy change from ΔS = ΔQ/T; an ideal adiabatic compression is reversible.',
    },
  ],
};
