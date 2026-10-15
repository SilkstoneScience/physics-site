// B3-P01: rms speed against average speed; temperature and pressure from the rms speed (new for 2028).
export default {
  id: 'B3-P01',
  title: 'Molecular speeds: rms against average speed',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['B.3', 'B.1'],
  batch: 'batch-2028',
  y2028: true,
  originality: {
    inspiredBy: null,
    note: 'Written for this bank for the 2028 additions to B.3 (rms against average speed, P = ⅓ρv²rms) and B.1 (3/2 kBT for an ideal monatomic gas). The computer-model sample and all numbers are our own.',
  },
  given: {
    s1: { value: 300, sf: 2, unit: 'm s^-1', range: [100, 3000], what: 'speed of atom 1' },
    s2: { value: 700, sf: 2, unit: 'm s^-1', range: [100, 3000], what: 'speed of atom 2' },
    s3: { value: 900, sf: 2, unit: 'm s^-1', range: [100, 3000], what: 'speed of atom 3' },
    s4: { value: 1100, sf: 2, unit: 'm s^-1', range: [100, 3000], what: 'speed of atom 4' },
    s5: { value: 1500, sf: 2, unit: 'm s^-1', range: [100, 3000], what: 'speed of atom 5' },
    m: { value: 6.64e-27, sf: 3, unit: 'kg', range: [6.6e-27, 6.7e-27], what: 'mass of a helium atom' },
    vr: { value: 1.37, sf: 3, unit: 'km s^-1', range: [0.5, 3], what: 'rms speed of atoms in a real helium sample' },
    rho: { value: 0.16, sf: 2, unit: 'kg m^-3', range: [0.05, 1], what: 'density of the helium sample' },
  },
  calc: (v, K) => {
    const sp = [v.s1, v.s2, v.s3, v.s4, v.s5];
    const mean = sp.reduce((a, s) => a + s, 0) / sp.length;
    const meanSq = sp.reduce((a, s) => a + s * s, 0) / sp.length;
    return {
      mean: { value: mean, unit: 'm s^-1', sf: 3 },
      meanSq: { value: meanSq, unit: 'm^2 s^-2', sf: 3 },
      rms: { value: Math.sqrt(meanSq), unit: 'm s^-1', sf: 3 },
      T: { value: v.m * v.vr ** 2 / (3 * K.kB), unit: 'K', sf: 3, range: [100, 1000] },
      P: { value: v.rho * v.vr ** 2 / 3, unit: 'Pa', sf: 2, range: [1e4, 1e6] },
      wrong_T: { value: v.m * v.vr ** 2 / (2 * K.kB), unit: 'K', sf: 3 }, // used ½mv² = kBT
      wrong_P: { value: v.rho * v.vr ** 2, unit: 'Pa', sf: 2 }, // forgot the ⅓
    };
  },
  stem: '<p>A computer model of a gas follows five helium atoms. At one instant their speeds are:</p><table><tr><th>atom</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th></tr><tr><td>speed / $\\text{m s}^{-1}$</td><td>[[s1:n]]</td><td>[[s2:n]]</td><td>[[s3:n]]</td><td>[[s4:n]]</td><td>[[s5:n]]</td></tr></table>',
  parts: [
    {
      label: 'a', command: 'Calculate', marks: 1, syllabus: ['B.3.Y1'],
      question: 'Calculate the average (mean) speed of the five atoms.',
      numeric: { result: 'mean', tolerance: 0.005 },
      markscheme: ['$\\bar{v} = [[mean:3u]]$ ✓'],
      examinerNote: 'The ordinary mean of the five speeds.',
    },
    {
      label: 'b', command: 'Show that', marks: 2, syllabus: ['B.3.Y1'],
      question: 'Show that the root-mean-square (rms) speed of the five atoms is about [[rms:2u]].',
      showThat: { result: 'rms', sf: 2 },
      markscheme: [
        'mean of the squares of the speeds $= [[meanSq:3u]]$ ✓',
        '$v_{\\text{rms}} = \\sqrt{[[meanSq:3]]} = [[rms:3u]]$ ✓',
      ],
      examinerNote: 'Square, then average, then square root. The rms speed is larger than the mean speed because squaring gives more weight to the faster atoms.',
    },
    {
      label: 'c', command: 'Explain', marks: 2, syllabus: ['B.3.Y1', 'B.3.5'],
      question: 'Explain why the rms speed, rather than the average speed, is used in the equation for the pressure of an ideal gas.',
      markscheme: [
        'the momentum change in each collision with a wall is proportional to the speed, and faster atoms also collide more often ✓',
        'so the pressure depends on the mean of the squares of the speeds, whose square root is the rms speed ✓',
      ],
      examinerNote: 'Pressure ∝ (momentum change per collision) × (collision rate), both ∝ v, so ∝ mean of v². Answers saying only "because the average velocity is zero" earn the first mark at most if they also explain why squares are needed.',
    },
    {
      label: 'd', command: 'Determine', marks: 2, syllabus: ['B.1.Y1', 'B.3.Y1'],
      question: 'In a real sample of helium, the atoms have an rms speed of [[vr]]. Each helium atom has a mass of [[m]]. Helium behaves as an ideal monatomic gas. Determine the temperature of the sample.',
      numeric: { result: 'T', accept: 0.03, mistakes: [{ result: 'wrong_T', feedback: 'The average kinetic energy of an atom of an ideal monatomic gas is (3/2)kBT, not kBT.' }] },
      markscheme: [
        '$\\tfrac{1}{2}mv_{\\text{rms}}^2 = \\tfrac{3}{2}k_BT$ ✓',
        '$T = \\dfrac{mv_{\\text{rms}}^2}{3k_B} = [[T:3u]]$ ✓',
      ],
      examinerNote: 'The average kinetic energy uses the mean square speed, so the rms speed goes into ½mv². The rms speed must be in m s⁻¹.',
    },
    {
      label: 'e', command: 'Calculate', marks: 2, syllabus: ['B.3.Y1'],
      question: 'The density of this helium sample is [[rho]]. Calculate the pressure of the sample.',
      numeric: { result: 'P', accept: 0.04, mistakes: [{ result: 'wrong_P', feedback: 'P = (1/3)ρv²rms: remember the factor of one third.' }] },
      markscheme: [
        '$P = \\tfrac{1}{3}\\rho v_{\\text{rms}}^2$ ✓',
        '$P = \\tfrac{1}{3} \\times [[rho:n]] \\times ([[vr:n]] \\times 10^{3})^2 = [[P:2u]]$ ✓',
      ],
      examinerNote: 'Equation from the 2028 data booklet; about atmospheric pressure.',
    },
  ],
};
