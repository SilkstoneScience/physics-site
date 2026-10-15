// B3-P01: rms speed against average velocity and why rms is used (new for 2028), with temperature and pressure
// from the rms speed. The 2028 guide does not ask students to calculate an rms speed from a list of speeds.
export default {
  id: 'B3-P01',
  title: 'Helium atoms: rms speed, temperature and pressure',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['B.3', 'B.1'],
  batch: 'batch-2028',
  y2028: true,
  originality: {
    inspiredBy: null,
    note: 'Written for this bank for the 2028 B.3 guidance (the difference between rms velocity and average velocity, and why rms is preferred). Parts (c) and (d) use the 2025 relationships (3/2 kBT and P = ⅓ρv², now written with v_rms). The context and numbers are our own.',
  },
  given: {
    m: { value: 6.64e-27, sf: 3, unit: 'kg', range: [6.6e-27, 6.7e-27], what: 'mass of a helium atom' },
    vr: { value: 1.37, sf: 3, unit: 'km s^-1', range: [0.5, 3], what: 'rms speed of the helium atoms' },
    rho: { value: 0.16, sf: 2, unit: 'kg m^-3', range: [0.05, 1], what: 'density of the helium' },
  },
  calc: (v, K) => ({
    T: { value: v.m * v.vr ** 2 / (3 * K.kB), unit: 'K', sf: 3, range: [100, 1000] },
    P: { value: v.rho * v.vr ** 2 / 3, unit: 'Pa', sf: 2, range: [1e4, 1e6] },
    wrong_T: { value: v.m * v.vr ** 2 / (2 * K.kB), unit: 'K', sf: 3 }, // used ½mv² = kBT
    wrong_P: { value: v.rho * v.vr ** 2, unit: 'Pa', sf: 2 }, // forgot the ⅓
  }),
  stem: '<p>A sealed container at rest holds helium gas. Each helium atom has a mass of [[m]]. The atoms move randomly, with a root-mean-square (rms) speed of [[vr]]. Helium behaves as an ideal monatomic gas.</p>',
  parts: [
    {
      label: 'a', command: 'State', marks: 1, syllabus: ['B.3.Y1'],
      question: 'State the average velocity of the helium atoms.',
      markscheme: ['zero: the atoms move equally in all directions, so their velocities (vectors) cancel ✓'],
      examinerNote: 'The 2028 guidance contrasts rms velocity with average VELOCITY. A speed (e.g. "about 1.3 km/s") earns no mark.',
    },
    {
      label: 'b', command: 'Explain', marks: 2, syllabus: ['B.3.Y1', 'B.3.5'],
      question: 'Explain why the rms speed, rather than the average velocity, is used in the equation for the pressure of an ideal gas.',
      markscheme: [
        'the average velocity is zero, so it cannot describe how hard or how often the atoms hit the walls ✓',
        'the momentum change in each collision and the rate of collisions both depend on the speed, so the pressure depends on the mean of the squares of the speeds, whose square root is the rms speed ✓',
      ],
      examinerNote: 'Pressure ∝ (momentum change per collision) × (collision rate), both ∝ v, so ∝ the mean of v², which is not zero.',
    },
    {
      label: 'c', command: 'Determine', marks: 2, syllabus: ['B.1.4', 'B.3.5'],
      question: 'Determine the temperature of the helium.',
      numeric: { result: 'T', accept: 0.03, mistakes: [{ result: 'wrong_T', feedback: 'The average kinetic energy of an atom of an ideal monatomic gas is (3/2)kBT, not kBT.' }] },
      markscheme: [
        '$\\tfrac{1}{2}mv_{\\text{rms}}^2 = \\tfrac{3}{2}k_BT$ ✓',
        '$T = \\dfrac{mv_{\\text{rms}}^2}{3k_B} = [[T:3u]]$ ✓',
      ],
      examinerNote: 'The average kinetic energy uses the mean square speed, so the rms speed goes into ½mv². The rms speed must be in m s⁻¹.',
    },
    {
      label: 'd', command: 'Calculate', marks: 2, syllabus: ['B.3.5'],
      question: 'The density of the helium is [[rho]]. Calculate the pressure of the helium.',
      numeric: { result: 'P', accept: 0.04, mistakes: [{ result: 'wrong_P', feedback: 'P = (1/3)ρv²rms: remember the factor of one third.' }] },
      markscheme: [
        '$P = \\tfrac{1}{3}\\rho v_{\\text{rms}}^2$ ✓',
        '$P = \\tfrac{1}{3} \\times [[rho:n]] \\times ([[vr:n]] \\times 10^{3})^2 = [[P:2u]]$ ✓',
      ],
      examinerNote: 'The data-booklet equation; about atmospheric pressure.',
    },
  ],
};
