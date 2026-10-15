// D1-P02: deducing Kepler's third law (all students from 2028) and using it with Saturn's moons.
export default {
  id: 'D1-P02',
  title: 'Saturn\'s moons and Kepler\'s third law',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['D.1', 'A.2'],
  batch: 'batch-2028',
  y2028: true,
  originality: {
    inspiredBy: null,
    note: 'Written for this bank for the 2028 D.1 guidance (all students deduce Kepler\'s third law for circular orbits). Orbit radii and periods of Titan and Rhea are published astronomical data (approximate); the question sequence is our own.',
  },
  given: {
    rT: { value: 1.22e9, sf: 3, unit: 'm', range: [1.2e9, 1.23e9], what: 'orbital radius of Titan' },
    TT: { value: 15.9, sf: 3, unit: 'day', range: [15.8, 16.0], what: 'orbital period of Titan' },
    rR: { value: 5.27e8, sf: 3, unit: 'm', range: [5.2e8, 5.3e8], what: 'orbital radius of Rhea' },
  },
  calc: (v, K) => {
    const M = 4 * Math.PI ** 2 * v.rT ** 3 / (K.G * v.TT ** 2);
    const TR = v.TT * (v.rR / v.rT) ** (3 / 2);
    return {
      TTs: { value: v.TT, unit: 's', sf: 3 },
      M: { value: M, unit: 'kg', sf: 3, range: [5e26, 6e26] },
      TR: { value: TR, unit: 'day', sf: 3, range: [4, 5] },
      wrong_M: { value: 4 * Math.PI ** 2 * v.rT ** 3 / (K.G * (v.TT / 86400) ** 2), unit: 'kg', sf: 3, noDimensionCheck: true }, // period left in days
    };
  },
  calcLiterals: { 86400: 'seconds in a day, only for the wrong answer "period left in days"' },
  stem: '<p>Titan and Rhea are moons of Saturn. Each moves in an approximately circular orbit. Titan has an orbital radius of [[rT]] and an orbital period of [[TT:n]] days. Rhea has an orbital radius of [[rR]].</p>',
  parts: [
    {
      label: 'a', command: 'Deduce', marks: 3, syllabus: ['D.1.Y1', 'D.1.2', 'A.2.13'],
      question: 'A moon of mass $m$ orbits a planet of mass $M$ in a circle of radius $r$ with period $T$. Deduce that $T^2 = \\dfrac{4\\pi^2}{GM}r^3$.',
      markscheme: [
        'the gravitational force provides the centripetal force: $\\dfrac{GMm}{r^2} = \\dfrac{mv^2}{r}$ ✓',
        'with $v = \\dfrac{2\\pi r}{T}$ ✓',
        'so $\\dfrac{GM}{r^2} = \\dfrac{4\\pi^2 r}{T^2}$, which rearranges to $T^2 = \\dfrac{4\\pi^2}{GM}r^3$ ✓',
      ],
      examinerNote: 'Equivalent routes with ω = 2π/T are fine. The moon\'s mass must cancel visibly.',
    },
    {
      label: 'b', command: 'Determine', marks: 2, syllabus: ['D.1.Y1', 'D.1.1'], dependsOn: ['a'],
      question: 'Determine the mass of Saturn.',
      numeric: { result: 'M', accept: 0.03, mistakes: [{ result: 'wrong_M', feedback: 'Convert the period to seconds before using T² = 4π²r³/(GM).' }] },
      markscheme: [
        'period in seconds: $T = [[TT:n]]$ days $= [[TTs:3u]]$ ✓',
        '$M = \\dfrac{4\\pi^2 r^3}{GT^2} = [[M:3u]]$; allow ECF from (a) ✓',
      ],
      examinerNote: 'The period must be in seconds.',
    },
    {
      label: 'c', command: 'Calculate', marks: 2, syllabus: ['D.1.1', 'D.1.Y1'],
      question: 'Calculate, in days, the orbital period of Rhea.',
      numeric: { result: 'TR', accept: 0.03 },
      markscheme: [
        '$\\dfrac{T_{\\text{R}}^2}{r_{\\text{R}}^3} = \\dfrac{T_{\\text{T}}^2}{r_{\\text{T}}^3}$ (OR using the mass from (b)) ✓',
        '$T_{\\text{R}} = [[TT:n]] \\times \\left(\\dfrac{[[rR:n]]}{[[rT:n]]}\\right)^{3/2} = [[TR:3]]$ days ✓',
      ],
      examinerNote: 'Kepler\'s third law as a ratio needs neither G nor M; the result is close to Rhea\'s observed period.',
    },
    {
      label: 'd', command: 'Explain', marks: 1, syllabus: ['D.1.Y1'],
      question: 'Explain why the masses of the moons are not needed in (b) and (c).',
      markscheme: ['the moon\'s mass cancels (it appears on both sides of the force equation), so the orbital period does not depend on it ✓'],
      examinerNote: 'Gravitational and centripetal forces are both proportional to the moon\'s mass.',
    },
  ],
};
