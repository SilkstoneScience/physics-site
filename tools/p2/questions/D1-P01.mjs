// D1-P01: raising a satellite to a higher circular orbit (orbital speed, energy of orbits).
export default {
  id: 'D1-P01',
  title: 'Raising a satellite to a higher orbit',
  type: 'short',
  level: 'HL',
  difficulty: 3,
  topics: ['D.1', 'A.3'],
  batch: 'batch-1',
  batchRule: 'inspect-all',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the D.1 AHL understandings and the guidance example "changes in energy when a satellite changes orbit". The orbits, satellite and numbers are our own; the "why is the kinetic energy smaller" part tests the usual misconception.',
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
    const v1 = Math.sqrt(K.G * v.M / r1);
    const E = (r) => -K.G * v.M * v.m / (2 * r);
    return {
      r1: { value: r1, unit: 'm', sf: 3 },
      r2: { value: r2, unit: 'm', sf: 3 },
      v1: { value: v1, unit: 'km s^-1', sf: 3, range: [6, 8] },
      T1: { value: 2 * Math.PI * r1 / v1, unit: 's', sf: 3, range: [5000, 9000] },
      E1: { value: E(r1), unit: 'J', sf: 3 },
      E2: { value: E(r2), unit: 'J', sf: 3 },
      dE: { value: E(r2) - E(r1), unit: 'J', sf: 3 },
      wrong_T1: { value: 2 * Math.PI * v.h1 / v1, unit: 's', sf: 3 }, // used the height, not the orbital radius
      wrong_dE: { value: K.G * v.M * v.m * (1 / r1 - 1 / r2), unit: 'J', sf: 3 }, // change in potential energy only
    };
  },
  stem: '<p>A satellite of mass [[m]] is in a circular orbit [[h1]] above the surface of the Earth. Its engines are used to move it to a circular orbit [[h2]] above the surface. The mass of the Earth is [[M]] and its radius is [[RE]].</p>',
  parts: [
    {
      label: 'a', command: 'Show that', marks: 2, syllabus: ['D.1.H5'],
      question: 'Show that, in the first orbit, the satellite moves at about [[v1:2u]].',
      showThat: { result: 'v1', sf: 2 },
      markscheme: [
        '$r = [[RE:n]] + [[h1:n]] \\times 10^{3} = [[r1:3u]]$ ✓',
        '$v = \\sqrt{\\dfrac{GM}{r}} = [[v1:3u]]$ ✓',
      ],
      examinerNote: 'The radius of the orbit is measured from the centre of the Earth. Gravity provides the centripetal force: GMm/r² = mv²/r.',
    },
    {
      label: 'b', command: 'Calculate', marks: 2, syllabus: ['D.1.H5'], dependsOn: ['a'],
      question: 'Calculate the period of the satellite in the first orbit.',
      numeric: { result: 'T1', accept: 0.03, mistakes: [{ result: 'wrong_T1', feedback: 'The satellite goes round a circle whose radius is measured from the centre of the Earth, not from the surface.' }] },
      markscheme: [
        '$T = \\dfrac{2\\pi r}{v}$ ✓',
        '$T = [[T1:3u]]$ ✓',
        'Allow ECF from (a); accept [[T1:lo]] to [[T1:hi]] s',
      ],
      examinerNote: 'One circumference at the orbital speed (or Kepler\'s third law with GM).',
    },
    {
      label: 'c', command: 'Deduce', marks: 2, syllabus: ['D.1.H1', 'D.1.H5', 'A.3.5'],
      question: 'Deduce that the total energy of a satellite of mass $m$ in a circular orbit of radius $r$ is $E = -\\dfrac{GMm}{2r}$.',
      markscheme: [
        '$E_{\\text{k}} = \\tfrac{1}{2}mv^2 = \\dfrac{GMm}{2r}$ (using $v^2 = GM/r$) ✓',
        '$E = E_{\\text{k}} + E_{\\text{p}} = \\dfrac{GMm}{2r} - \\dfrac{GMm}{r} = -\\dfrac{GMm}{2r}$ ✓',
      ],
      examinerNote: 'Both energies in terms of r, then add. The gravitational potential energy is negative (zero at infinity).',
    },
    {
      label: 'd', command: 'Determine', marks: 3, syllabus: ['D.1.H5'], dependsOn: ['c'],
      question: 'Determine the minimum energy that the engines must supply to move the satellite to the second orbit.',
      numeric: { result: 'dE', accept: 0.04, mistakes: [{ result: 'wrong_dE', feedback: 'That is the gain in gravitational potential energy only. The satellite also loses kinetic energy: use the change in total energy.' }] },
      markscheme: [
        '$r_2 = [[r2:3u]]$ ✓',
        '$\\Delta E = \\dfrac{GMm}{2}\\left(\\dfrac{1}{r_1} - \\dfrac{1}{r_2}\\right)$ ✓',
        '$\\Delta E = [[dE:3u]]$ ✓',
        'Allow ECF from (a) and (c); accept [[dE:lo]] to [[dE:hi]] J. Award [2 max] for the change in potential energy only, [[wrong_dE:3]] J.',
      ],
      examinerNote: 'The minimum energy is the change in total orbital energy, E(r2) − E(r1), ignoring losses. (Both total energies are listed in the audit.)',
    },
    {
      label: 'e', command: 'Explain', marks: 2, syllabus: ['D.1.H5', 'D.1.H1'],
      question: 'The engines supply energy to the satellite, yet its kinetic energy is smaller in the second orbit. Explain this.',
      markscheme: [
        'In a higher orbit the orbital speed is lower, so the kinetic energy ($GMm/2r$) decreases ✓',
        'the gravitational potential energy ($-GMm/r$) increases by twice as much as the kinetic energy falls, so the total energy increases and the engines must supply the difference ✓',
      ],
      examinerNote: 'The key idea: ΔEp = −2ΔEk, so ΔE = −ΔEk > 0. Answers that only say "the potential energy increases" earn the second mark only if they say it increases by more than the kinetic energy decreases.',
    },
  ],
};
