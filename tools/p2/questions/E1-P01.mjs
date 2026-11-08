// E1-P01: a low-pressure sodium street lamp (line spectra as evidence for discrete energy levels, E = hf,
// absorption spectra, spectra and composition; SL).
export default {
  id: 'E1-P01',
  title: 'Sodium street lamp: energy levels and line spectrum',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['E.1'],
  sections: ['levels', 'spectra', 'composition'],
  batch: 'batch-3',
  situation: 'low-pressure sodium street lamp line spectrum',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the E.1 syllabus (emission and absorption spectra as evidence for discrete levels, photon energy E = hf, spectra and composition). The context is the yellow low-pressure sodium street lamp; the four levels are rounded to real sodium values (ground state 3s at −5.14 eV, 3p at −3.04 eV, 4s at −1.95 eV, 4p at −1.39 eV), so the marked transition gives the lamp\'s yellow line at about 590 nm and the largest gap gives an ultraviolet line at about 330 nm. The levels are labelled ground state and levels 1 to 3, not n = 1 to 4, because sodium is not hydrogen-like and the Bohr equations are not needed. Wording, numbers and the sequence of parts are our own and differ from the four-level question already in the bank.',
  },
  given: {
    E0: { value: -5.14, sf: 3, unit: 'eV', range: [-6, -4], what: 'energy of the ground state' },
    E1: { value: -3.04, sf: 3, unit: 'eV', range: [-4, -2], what: 'energy of level 1' },
    E2: { value: -1.95, sf: 3, unit: 'eV', range: [-3, -1], what: 'energy of level 2' },
    E3: { value: -1.39, sf: 3, unit: 'eV', range: [-2, -1], what: 'energy of level 3' },
    nLev: { value: 4, sf: 1, unit: '', range: [3, 6], what: 'number of energy levels shown on the diagram' },
  },
  calc: (v, K) => {
    const dE = v.E1 - v.E0;
    const dEmax = v.E3 - v.E0;
    return {
      dE: { value: dE, unit: 'eV', sf: 3 },
      dEJ: { value: dE, unit: 'J', sf: 3 },
      f: { value: dE / K.h, unit: 'Hz', sf: 3 },
      lam: { value: K.h * K.c / dE, unit: 'nm', sf: 3, range: [380, 750] },
      dEmax: { value: dEmax, unit: 'eV', sf: 3 },
      lamShort: { value: K.h * K.c / dEmax, unit: 'nm', sf: 3 },
      dE21: { value: v.E2 - v.E1, unit: 'eV', sf: 3 },
      nTrans: { value: v.nLev * (v.nLev - 1) / 2, unit: '', sf: 1 },
      wrong_lam: { value: K.h * K.c / dEmax, unit: 'nm', sf: 3 }, // used the largest gap instead of the marked transition
    };
  },
  stem: '<p>A low-pressure sodium lamp used for street lighting contains sodium vapour. When a current flows in the vapour the lamp gives out light whose spectrum is a line spectrum, almost all of it in a single yellow line. The diagram shows the ground state and three excited energy levels of a sodium atom.</p>',
  diagram: { file: 'questions/diagrams/p2-e1-sodium.svg', alt: 'Energy-level diagram with four horizontal lines. From the bottom: the ground state at minus 5.14 electronvolts, level 1 at minus 3.04 electronvolts, level 2 at minus 1.95 electronvolts and level 3 at minus 1.39 electronvolts. A blue downward arrow from level 1 to the ground state is labelled transition for part b.' },
  parts: [
    {
      label: 'a', sections: ['spectra', 'levels'], command: 'Outline', marks: 2, syllabus: ['E.1.3', 'E.1.4'],
      question: 'Outline how the line spectrum of the lamp provides evidence that the energy of a sodium atom can take only certain discrete values.',
      markscheme: [
        'only certain wavelengths / frequencies / photon energies are present in the light ✓',
        'a photon is emitted when the atom moves from one energy level to a lower one, with energy equal to the difference between the levels ($E = hf$), so only certain energy differences, and hence only certain levels, can exist ✓',
      ],
      examinerNote: 'Evidence (discrete lines) then reasoning (photon energy = level difference). A continuous spectrum would need a continuous range of energy differences.',
    },
    {
      label: 'b', sections: ['levels'], command: 'Calculate', marks: 2, syllabus: ['E.1.4'],
      question: 'Calculate, in nm, the wavelength of the photon released in the transition shown by the arrow on the diagram.',
      numeric: { result: 'lam', accept: 0.02, mistakes: [{ result: 'wrong_lam', feedback: 'That is the wavelength for the transition from level 3 to the ground state. The arrow shows level 1 to the ground state.' }] },
      markscheme: [
        '$\\Delta E = [[E1:n]] - ([[E0:n]]) = [[dE:3u]] = [[dEJ:3u]]$ ✓',
        '$\\lambda = \\dfrac{hc}{\\Delta E} = \\dfrac{[[K.h]] \\times [[K.c]]}{[[dEJ:3]]} = [[lam:3u]]$ ✓',
        'Accept [[lam:lo]] to [[lam:hi]] nm.',
      ],
      examinerNote: 'E = hf with f = c/λ. The difference in eV must be converted to joules (× 1.60 × 10⁻¹⁹) before using h in J s; the frequency is [[f]]. The answer is the yellow sodium line.',
    },
    {
      label: 'c', sections: ['levels'], command: 'Deduce', marks: 2, syllabus: ['E.1.4', 'E.1.3'],
      question: 'Deduce which transition between the levels shown gives the photon of shortest wavelength, and the number of different photon energies that transitions between the levels shown can produce.',
      markscheme: [
        'level 3 to the ground state, because it has the largest energy difference and so the highest frequency / shortest wavelength ✓',
        '[[nTrans:n]] different photon energies ✓',
      ],
      examinerNote: 'λ = hc/ΔE, so the largest gap ([[dEmax]], an ultraviolet line at about [[lamShort]]) gives the shortest wavelength. Every pair of levels gives one energy: with four levels there are six pairs (three from level 3, two from level 2, one from level 1). Level 2 to level 1 is only [[dE21]], an infrared line.',
    },
    {
      label: 'd', sections: ['spectra'], command: 'Describe', marks: 2, syllabus: ['E.1.3'],
      question: 'White light is sent through a tube of sodium vapour at room temperature. Describe how the absorption spectrum produced differs in appearance from the emission spectrum of the lamp.',
      markscheme: [
        'dark lines on a continuous bright background, instead of bright lines on a dark background ✓',
        'the dark lines are at the same wavelengths as (some of) the emission lines OR only the lines for transitions starting from the ground state appear, because the cool atoms are almost all in the ground state ✓',
      ],
      examinerNote: 'Appearance: dark lines on a continuous spectrum. The second mark is for the relationship between the two sets of lines (same wavelengths, or a subset starting from the ground state).',
    },
    {
      label: 'e', sections: ['composition'], command: 'State', marks: 1, syllabus: ['E.1.5'],
      question: 'The same yellow line appears as a dark line in the spectrum of the Sun. State what this tells astronomers.',
      markscheme: ['sodium is present in the Sun (in its outer layers / atmosphere) ✓'],
      examinerNote: 'Spectra give the chemical composition: each element has its own set of lines. "Sodium is in the Sun\'s atmosphere, absorbing light from below" is the full picture, but "the Sun contains sodium" earns the mark.',
    },
  ],
};
