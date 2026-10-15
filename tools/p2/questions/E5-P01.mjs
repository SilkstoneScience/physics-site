// E5-P01: helium fusion in a red giant (mass change and energy), luminosity, and the Chandrasekhar and
// Oppenheimer–Volkoff limits (both new for 2028).
export default {
  id: 'E5-P01',
  title: 'Helium fusion and the fate of stellar cores',
  type: 'short',
  level: 'SL',
  difficulty: 3,
  topics: ['E.5', 'E.3', 'B.1'],
  batch: 'batch-2028',
  y2028: true,
  originality: {
    inspiredBy: null,
    note: 'Written for this bank for the 2028 E.5 additions (Chandrasekhar and Oppenheimer–Volkoff limits; calculations of the change in mass in fusion) and B.1 (luminosity is radiated power). The triple-alpha numbers are standard atomic masses; the question sequence and core masses are our own.',
  },
  literals: {
    '1.4': 'the Chandrasekhar limit in solar masses (approximate)',
    12: 'the nucleon number in the name carbon-12',
  },
  given: {
    mHe: { value: 4.002603, sf: 7, unit: '', range: [4.0026, 4.0027], what: 'mass of a helium-4 atom in u' },
    mC: { value: 12.000000, sf: 8, unit: '', range: [12, 12], what: 'mass of a carbon-12 atom in u' },
    L: { value: 4.0e29, sf: 2, unit: 'W', range: [1e28, 1e31], what: 'luminosity of the red giant' },
    core1: { value: 1.2, sf: 2, unit: '', range: [0.5, 1.3], what: 'mass of the first remnant core in solar masses' },
    core2: { value: 1.8, sf: 2, unit: '', range: [1.5, 2.0], what: 'mass of the second remnant core in solar masses' },
  },
  calc: (v, K) => {
    const dm = 3 * v.mHe - v.mC; // in u
    const E = dm * K.u_MeV * 1e6 * K.eV; // in J
    return {
      dm: { value: dm, unit: '', sf: 3, range: [0.007, 0.009] },
      E: { value: E, unit: 'MeV', sf: 3, range: [7, 7.5] },
      N: { value: v.L / E, unit: 's^-1', sf: 2 },
      wrong_N: { value: v.L / (dm * K.u_MeV), unit: 's^-1', sf: 2, noDimensionCheck: true }, // energy left in MeV
    };
  },
  calcLiterals: { '1e6': 'MeV to eV' },
  stem: '<p>In the core of a red giant, helium nuclei fuse to form carbon:</p><p>$3\\,{}^{4}_{2}\\text{He} \\rightarrow {}^{12}_{6}\\text{C}$</p><p>The mass of a helium-4 atom is [[mHe:7]] u and the mass of a carbon-12 atom is [[mC:8]] u.</p>',
  parts: [
    {
      label: 'a', command: 'Calculate', marks: 1, syllabus: ['E.5.2', 'E.3.4'],
      question: 'Calculate, in u, the decrease in mass in one reaction.',
      numeric: { result: 'dm', accept: 0.02 },
      markscheme: ['$\\Delta m = 3 \\times [[mHe:7]] - [[mC:8]] = [[dm:3]]$ u ✓'],
      examinerNote: 'Atomic masses can be used: the electrons balance (6 on each side).',
    },
    {
      label: 'b', command: 'Show that', marks: 1, syllabus: ['E.5.2', 'E.3.4'], dependsOn: [],
      question: 'Show that the energy released in one reaction is about [[E:2u]].',
      showThat: { result: 'E', sf: 2 },
      markscheme: ['$E = [[dm:3]] \\times [[K.u_MeV]] = [[E:3u]]$ ✓'],
      examinerNote: '1 u is equivalent to 931.5 MeV (data booklet).',
    },
    {
      label: 'c', command: 'Calculate', marks: 2, syllabus: ['B.1.12', 'E.5.2'], dependsOn: ['b'],
      question: 'The red giant has a luminosity of [[L]]. Assume that all of this power comes from this reaction. Calculate the number of reactions per second in the core.',
      numeric: { result: 'N', accept: 0.04, mistakes: [{ result: 'wrong_N', feedback: 'Convert the energy per reaction from MeV to joules (1 MeV = 1.60 × 10⁻¹³ J) before dividing.' }] },
      markscheme: [
        'luminosity is the power radiated, so reactions per second $= \\dfrac{L}{E}$ with $E$ in joules ✓',
        '$N = \\dfrac{[[L:n]]}{[[E:3]] \\times 10^{6} \\times [[K.eV]]} = [[N:2u]]$; allow ECF from (b) ✓',
      ],
      examinerNote: 'Luminosity is the total radiated power (2028 wording).',
    },
    {
      label: 'd', command: 'Explain', marks: 2, syllabus: ['E.5.3'],
      question: 'Explain why the fusion of helium requires a higher core temperature than the fusion of hydrogen.',
      markscheme: [
        'helium nuclei have twice the charge of protons, so the electrostatic repulsion between them is greater ✓',
        'so the nuclei need greater kinetic energy (a higher temperature) to get close enough for the strong force to act and fusion to happen ✓',
      ],
      examinerNote: 'Temperature is a measure of the kinetic energy of the nuclei; a larger Coulomb barrier needs more energy.',
    },
    {
      label: 'e', command: 'Outline', marks: 3, syllabus: ['E.5.Y1', 'E.5.4'],
      question: 'Two stars end their lives leaving remnant cores of [[core1]] solar masses and [[core2]] solar masses. Outline, with reference to the Chandrasekhar and Oppenheimer–Volkoff limits, what each core becomes.',
      markscheme: [
        'the [[core1]] solar mass core is below the Chandrasekhar limit (about 1.4 solar masses) ✓',
        'so electron degeneracy pressure supports it and it becomes a white dwarf ✓',
        'the [[core2]] solar mass core is above the Chandrasekhar limit but below the Oppenheimer–Volkoff limit, so it becomes a neutron star (supported by neutron degeneracy pressure) ✓',
      ],
      examinerNote: 'The Oppenheimer–Volkoff limit is about 2–3 solar masses; above it a core becomes a black hole. The core masses are chosen well inside each range.',
    },
  ],
};
