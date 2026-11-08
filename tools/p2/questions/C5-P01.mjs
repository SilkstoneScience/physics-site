// C5-P01: a spectroscopic binary star (periodic Doppler shift of an absorption line, read from a graph).
export default {
  id: 'C5-P01',
  title: 'Spectroscopic binary: a shifting absorption line',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['C.5'],
  sections: ['space', 'light'],
  batch: 'batch-3',
  situation: 'star in a binary system whose absorption line wavelength oscillates periodically',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the C.5 understandings (the Doppler effect for light, Δλ/λ ≈ v/c, spectral-line shifts and the motion of stars). Spectroscopic binaries are the textbook application of a periodic Doppler shift; the calcium line, the graph, the amplitude and period, the marked times and the edge-on assumption part are our own. It differs from the hand-written C5-015 (a single redshifted galaxy line) and C5-016 (a car horn), and makes no use of Hubble\'s law or cosmology.',
  },
  given: {
    lam0: { value: 393.40, sf: 5, unit: 'nm', range: [380, 700], what: 'laboratory wavelength of the calcium absorption line' },
    dlam: { value: 0.080, sf: 2, unit: 'nm', range: [0.005, 0.5], what: 'maximum shift of the observed wavelength from the laboratory value, read from the graph' },
    P: { value: 4.0, sf: 2, unit: 'day', range: [0.5, 100], what: 'orbital period, read from the graph' },
  },
  calc: (v, K) => {
    const speed = K.c * v.dlam / v.lam0;
    return {
      Pd: { value: v.P, unit: 'day', sf: 2 },
      lamMax: { value: v.lam0 + v.dlam, unit: 'nm', sf: 5 },
      lamMin: { value: v.lam0 - v.dlam, unit: 'nm', sf: 5 },
      ratio: { value: v.dlam / v.lam0, unit: '', sf: 2 },
      v: { value: speed, unit: 'm s^-1', sf: 2, range: [1e3, 1e6] },
      wrong_v2: { value: 2 * speed, unit: 'm s^-1', sf: 2 }, // peak-to-trough used as the shift
    };
  },
  stem: '<p>Many stars belong to binary systems, in which two stars orbit their common centre of mass. The light from one star of such a system is analysed with a spectrometer. An absorption line of calcium, which has a wavelength of [[lam0]] when measured in a laboratory on Earth, is observed at a wavelength that changes with time. The graph shows the observed wavelength of this line over several days. Two times, A and B, are marked.</p>',
  diagram: { file: 'questions/diagrams/p2-c5-binary.svg', large: true, alt: 'Graph of observed wavelength in nanometres (393.30 to 393.50) against time in days (0 to 8), on a grid of 0.5 days by 0.01 nm. A dashed horizontal line marks 393.40 nm. The curve is a sine wave: it starts at 393.40 nm, peaks at 393.48 nm at 1.0 day (marked A), falls to 393.32 nm at 3.0 days (marked B), returns to 393.40 nm at 4.0 days and repeats, peaking again at 5.0 days and reaching its minimum at 7.0 days.' },
  parts: [
    {
      label: 'a', sections: ['space'], command: 'Outline', marks: 2, syllabus: ['C.5.1', 'C.5.3'],
      question: 'Outline why the observed wavelength of the line changes periodically.',
      markscheme: [
        'the star moves around its orbit, so the component of its velocity along the line of sight to Earth alternates between towards Earth and away from Earth ✓',
        'the Doppler effect increases the observed wavelength when the star is receding and decreases it when the star is approaching, so the shift repeats once every orbit ✓',
      ],
      examinerNote: 'Orbital motion changes the line-of-sight velocity periodically; the Doppler shift follows it. The second star is not needed for the marks.',
    },
    {
      label: 'b', sections: ['space'], command: 'Determine', marks: 1, syllabus: ['C.5.3', 'T.4'],
      question: 'Determine the orbital period of the star.',
      numeric: { result: 'Pd', accept: 0.03 },
      markscheme: ['period $= [[Pd:n]]$ days, e.g. from one peak to the next ✓'],
      examinerNote: 'One full cycle of the graph: peak to peak (1.0 d to 5.0 d) or trough to trough (3.0 d to 7.0 d). Typed in days.',
    },
    {
      label: 'c', sections: ['light'], command: 'Calculate', marks: 2, syllabus: ['C.5.2'],
      question: 'Calculate the maximum speed of the star along the line of sight.',
      numeric: { result: 'v', accept: 0.07, mistakes: [{ result: 'wrong_v2', feedback: 'The shift Δλ is measured from the laboratory wavelength to the peak (or the trough), not from trough to peak.' }] },
      markscheme: [
        'maximum shift $\\Delta\\lambda = [[lamMax:n]] - [[lam0:n]] = [[dlam]]$ ✓',
        '$v = c\\,\\dfrac{\\Delta\\lambda}{\\lambda} = [[K.c]] \\times \\dfrac{[[dlam:n]]}{[[lam0:n]]} = [[v:2u]]$ ✓',
        'Accept [[v:lo]] to [[v:hi]] $\\text{m s}^{-1}$ (allowing for the reading of the shift from the graph).',
      ],
      examinerNote: 'Δλ/λ ≈ v/c with the shift from the laboratory value to the peak, 0.080 nm, giving Δλ/λ = 2.0 × 10⁻⁴ and v = 6.1 × 10⁴ m s⁻¹ (61 km s⁻¹, a typical orbital speed in a close binary). The ratio in nm cancels, so no unit conversion is needed.',
    },
    {
      label: 'd', sections: ['space'], command: 'Deduce', marks: 2, syllabus: ['C.5.3', 'C.5.1'],
      question: 'Deduce at which of the marked times, A or B, the star is moving towards Earth.',
      markscheme: [
        'at B the observed wavelength ([[lamMin]]) is shorter than the laboratory wavelength / the line is blueshifted ✓',
        'a decrease in wavelength means the source is moving towards the observer, so the star is moving towards Earth at B (and away from Earth at A) ✓',
      ],
      examinerNote: 'Shorter observed wavelength (blueshift) means approach. The answer "B" alone, without the reason, earns 1 mark at most.',
    },
    {
      label: 'e', sections: ['space'], command: 'State', marks: 1, syllabus: ['C.5.3'],
      question: 'State one assumption that must be made if the speed found in (c) is to be taken as the orbital speed of the star.',
      markscheme: [
        'the orbit is seen edge-on from Earth / the line of sight lies in the plane of the orbit, so at A and B the whole of the star\'s velocity is along the line of sight ✓',
        'OR the orbit is circular, so the orbital speed is constant ✓',
      ],
      examinerNote: 'If the orbit is tilted, only the component of the velocity along the line of sight is measured, so the orbital speed is larger than the value found. Either the edge-on or the circular-orbit assumption earns the mark.',
    },
  ],
};
