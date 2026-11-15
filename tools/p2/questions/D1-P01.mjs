// D1-P01: raising a satellite to a higher circular orbit (gravitational potential, potential energy, energy of orbits).
// Revised 15 November 2026 (teacher's decision): parts (a) and (b) used to ask for the orbital speed and the period,
// which repeated D1-001 (a) and (b); they now ask for the gravitational potential and the gain in potential energy,
// which lead into the total-energy parts.
export default {
  id: 'D1-P01',
  title: 'Raising a satellite to a higher orbit',
  situation: 'satellite raised from a low orbit to a higher orbit by its engines',
  type: 'short',
  level: 'HL',
  difficulty: 3,
  topics: ['D.1', 'A.3'],
  sections: ['energy', 'potential', 'gpe'],
  batch: 'batch-5',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the D.1 AHL understandings and the guidance example "changes in energy when a satellite changes orbit". The orbits, satellite and numbers are our own; the "why is the kinetic energy smaller" part tests the usual misconception. Revised in November 2026 so that it no longer opens with the orbital speed and period, as the hand-written D1-001 does: it now builds from the potential at each orbit to the gain in potential energy, then to the change in total energy, which is half of it.',
  },
  given: {
    M: { value: 5.97e24, sf: 3, unit: 'kg', range: [5.9e24, 6.0e24], what: 'mass of the Earth' },
    RE: { value: 6.37e6, sf: 3, unit: 'm', range: [6.3e6, 6.4e6], what: 'radius of the Earth' },
    m: { value: 850, sf: 2, unit: 'kg', range: [50, 20000], what: 'mass of the satellite' },
    h1: { value: 600, sf: 2, unit: 'km', range: [200, 2000], what: 'height of the first orbit above the surface' },
    h2: { value: 2400, sf: 2, unit: 'km', range: [500, 36000], what: 'height of the second orbit above the surface' },
  },
  calc: (v, K) => {
    const r1 = v.RE + v.h1;
    const r2 = v.RE + v.h2;
    const V = (r) => -K.G * v.M / r;
    const E = (r) => -K.G * v.M * v.m / (2 * r);
    return {
      r1: { value: r1, unit: 'm', sf: 3 },
      r2: { value: r2, unit: 'm', sf: 3 },
      V1: { value: V(r1), unit: 'J kg^-1', sf: 3, range: [-6.3e7, -4e7] },
      V2: { value: V(r2), unit: 'J kg^-1', sf: 3 },
      dEp: { value: v.m * (V(r2) - V(r1)), unit: 'J', sf: 3, range: [1e8, 1e11] },
      E1: { value: E(r1), unit: 'J', sf: 3 },
      E2: { value: E(r2), unit: 'J', sf: 3 },
      dE: { value: E(r2) - E(r1), unit: 'J', sf: 3 },
      wrong_V1: { value: K.G * v.M / r1, unit: 'J kg^-1', sf: 3 }, // left out the minus sign
      wrong_dEp: { value: v.m * K.g * (v.h2 - v.h1), unit: 'J', sf: 3 }, // mgΔh, as if g stayed 9.8 N kg⁻¹ all the way up
      wrong_dE: { value: v.m * (V(r2) - V(r1)), unit: 'J', sf: 3 }, // change in potential energy only
    };
  },
  stem: '<p>A satellite of mass [[m]] is in a circular orbit [[h1]] above the surface of the Earth. Its engines are used to move it to a circular orbit [[h2]] above the surface. The mass of the Earth is [[M]] and its radius is [[RE]].</p>',
  parts: [
    {
      label: 'a', sections: ['potential'], command: 'Calculate', marks: 2, syllabus: ['D.1.H2'],
      question: 'Calculate the gravitational potential due to the Earth at the first orbit.',
      numeric: { result: 'V1', accept: 0.03, mistakes: [{ result: 'wrong_V1', feedback: 'Gravitational potential is negative: it is zero at infinity and lower closer to the Earth.' }] },
      markscheme: [
        '$r_1 = [[RE:n]] + [[h1:n]] \\times 10^{3} = [[r1:3u]]$ ✓',
        '$V_{\\text{g}} = -\\dfrac{GM}{r_1} = -\\dfrac{[[K.G]] \\times [[M:n]]}{[[r1:3]]} = [[V1:3u]]$ ✓',
        'Do not accept a positive value for the second mark.',
      ],
      examinerNote: 'The distance is measured from the centre of the Earth, not from its surface. The potential is negative because it is zero at infinity.',
    },
    {
      label: 'b', sections: ['gpe', 'potential'], command: 'Determine', marks: 2, syllabus: ['D.1.H2', 'D.1.H3'], dependsOn: ['a'],
      question: 'Determine the increase in the gravitational potential energy of the satellite when it moves to the second orbit.',
      numeric: { result: 'dEp', accept: 0.04, mistakes: [{ result: 'wrong_dEp', feedback: 'mgΔh treats g as constant, but the field gets weaker with height. Use the change in gravitational potential between the two orbits.' }] },
      markscheme: [
        '$r_2 = [[r2:3u]]$, so $V_2 = -\\dfrac{GM}{r_2} = [[V2:3u]]$ ✓',
        '$\\Delta E_{\\text{p}} = m\\Delta V_{\\text{g}} = [[m:n]] \\times ([[V2:3]] - ([[V1:3]])) = [[dEp:3u]]$ ✓',
        'OR $\\Delta E_{\\text{p}} = GMm\\left(\\dfrac{1}{r_1} - \\dfrac{1}{r_2}\\right)$',
        'Allow ECF from (a); accept [[dEp:lo]] to [[dEp:hi]] J. Do not accept $mg\\Delta h$.',
      ],
      examinerNote: 'The work done against gravity is mΔVg. Using mgΔh with the surface value of g gives far too much, because g is already smaller at the first orbit and falls further as the satellite rises.',
    },
    {
      label: 'c', sections: ['energy'], command: 'Deduce', marks: 2, syllabus: ['D.1.H1', 'D.1.H5', 'A.3.5'],
      question: 'Deduce that the total energy of a satellite of mass $m$ in a circular orbit of radius $r$ is $E = -\\dfrac{GMm}{2r}$.',
      markscheme: [
        '$E_{\\text{k}} = \\tfrac{1}{2}mv^2 = \\dfrac{GMm}{2r}$ (using $v^2 = GM/r$) ✓',
        '$E = E_{\\text{k}} + E_{\\text{p}} = \\dfrac{GMm}{2r} - \\dfrac{GMm}{r} = -\\dfrac{GMm}{2r}$ ✓',
      ],
      examinerNote: 'Both energies in terms of r, then add. The gravitational potential energy is negative (zero at infinity).',
    },
    {
      label: 'd', sections: ['energy'], command: 'Determine', marks: 3, syllabus: ['D.1.H5'], dependsOn: ['b', 'c'],
      question: 'Determine the minimum energy that the engines must supply to move the satellite to the second orbit.',
      numeric: { result: 'dE', accept: 0.04, mistakes: [{ result: 'wrong_dE', feedback: 'That is the gain in gravitational potential energy only. The satellite also loses kinetic energy: use the change in total energy.' }] },
      markscheme: [
        '$E_1 = -\\dfrac{GMm}{2r_1} = [[E1:3u]]$ and $E_2 = -\\dfrac{GMm}{2r_2} = [[E2:3u]]$ ✓',
        'minimum energy $= E_2 - E_1$ ✓',
        '$= [[dE:3u]]$ ✓',
        'OR the change in total energy is half the gain in potential energy from (b), $\\tfrac{1}{2} \\times [[dEp:3]]$ [2], $= [[dE:3u]]$ [1].',
        'Allow ECF from (b) and (c); accept [[dE:lo]] to [[dE:hi]] J. Award [1 max] for the gain in potential energy only, [[wrong_dE:3]] J.',
      ],
      examinerNote: 'The minimum energy is the change in total orbital energy, E(r2) − E(r1), ignoring losses. Since E = Ep/2 in any circular orbit, it is half the gain in potential energy found in (b).',
    },
    {
      label: 'e', sections: ['energy'], command: 'Explain', marks: 2, syllabus: ['D.1.H5', 'D.1.H1'],
      question: 'The engines supply energy to the satellite, yet its kinetic energy is smaller in the second orbit. Explain this.',
      markscheme: [
        'In a higher orbit the orbital speed is lower, so the kinetic energy ($GMm/2r$) decreases ✓',
        'the gravitational potential energy ($-GMm/r$) increases by twice as much as the kinetic energy falls, so the total energy increases and the engines must supply the difference ✓',
      ],
      examinerNote: 'The key idea: ΔEp = −2ΔEk, so ΔE = −ΔEk > 0. Answers that only say "the potential energy increases" earn the second mark only if they say it increases by more than the kinetic energy decreases.',
    },
  ],
};
