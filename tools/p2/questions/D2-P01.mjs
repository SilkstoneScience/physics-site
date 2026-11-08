// D2-P01: an electrostatic precipitator in a factory chimney (uniform field between plates, potential difference,
// work done on a charge, equipotential surfaces; HL).
export default {
  id: 'D2-P01',
  title: 'Electrostatic precipitator in a factory chimney',
  type: 'short',
  level: 'HL',
  difficulty: 2,
  topics: ['D.2', 'A.2'],
  sections: ['plates', 'elines', 'equip', 'gradient', 'ev', 'efield'],
  batch: 'batch-3',
  situation: 'electrostatic precipitator plates cleaning factory chimney smoke',
  calcLiterals: { 1000: 'kV to V, only for the wrong answers of a student who forgets the conversion' },
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the D.2 syllabus (uniform field between parallel plates, field lines, equipotential surfaces, W = qΔV, E as the potential gradient) with the industrial context of an electrostatic precipitator, which the guide\'s aims 8 and 9 (technology, environment) invite. Realistic values: industrial precipitators run at tens of kilovolts across plate gaps of 20 to 40 cm, and a smoke particle about 10 µm across has a mass of about 5 × 10⁻¹³ kg. All wording, numbers and the sequence of parts are our own; nothing is taken from the Millikan or charged-sphere questions already in the bank.',
  },
  given: {
    V: { value: 60, sf: 2, unit: 'kV', range: [10, 100], what: 'potential difference between the plates' },
    d: { value: 0.30, sf: 2, unit: 'm', range: [0.1, 0.5], what: 'separation of the plates' },
    q: { value: 8.0e-16, sf: 2, unit: 'C', range: [1e-17, 1e-14], what: 'magnitude of the (negative) charge on the smoke particle' },
    m: { value: 5.0e-13, sf: 2, unit: 'kg', range: [1e-15, 1e-10], what: 'mass of the smoke particle' },
  },
  calc: (v, K) => {
    const E = v.V / v.d;
    const W = v.q * v.V;
    return {
      E: { value: E, unit: 'V m^-1', sf: 2, range: [1e4, 1e6] },
      W: { value: W, unit: 'J', sf: 2 },
      WeV: { value: W / K.e, unit: 'eV', sf: 2, inUnit: true },
      F: { value: v.q * E, unit: 'N', sf: 2 },
      weight: { value: v.m * K.g, unit: 'N', sf: 2 },
      vArr: { value: Math.sqrt(2 * W / v.m), unit: 'm s^-1', sf: 2 },
      wrong_E: { value: v.V / 1000 / v.d, unit: 'V m^-1', sf: 2 }, // forgot to convert kV to V
      wrong_W: { value: v.q * E, unit: 'J', sf: 2 }, // used the field strength instead of the potential difference
      wrong_W2: { value: v.q * v.V / 1000, unit: 'J', sf: 2 }, // forgot to convert kV to V
    };
  },
  stem: '<p>An electrostatic precipitator removes smoke particles from the waste gas leaving a factory chimney. Inside the chimney, two large vertical metal plates are [[d]] apart and the potential difference between them is [[V]]. The gas flows upwards between the plates. A smoke particle of mass [[m]], carrying a negative charge of magnitude [[q]], enters the gap next to the negative plate.</p>',
  diagram: { file: 'questions/diagrams/p2-d2-precipitator.svg', alt: 'Two large vertical metal plates seen edge-on, the left one labelled negative and the right one labelled positive, with the separation marked below them and the potential difference labelled above. A small smoke particle is drawn just to the right of the negative plate, and a dashed arrow between the plates shows the flue gas flowing upwards.' },
  parts: [
    {
      label: 'a', sections: ['elines', 'equip'], command: 'Sketch', marks: 2, syllabus: ['D.2.5', 'D.2.H5'],
      question: 'Sketch, on a copy of the diagram, the electric field lines between the plates and two equipotential surfaces. Ignore edge effects.',
      markscheme: [
        'at least four straight, parallel, evenly spaced field lines at right angles to the plates, with arrows pointing from the positive plate to the negative plate ✓',
        'two equipotential surfaces drawn as straight lines parallel to the plates, at right angles to the field lines ✓',
        'Note: examiner\'s figure. <img src="questions/diagrams/p2-d2-precipitator-ms.svg" alt="Examiner figure: the two plates with evenly spaced horizontal field lines running from the positive plate to the negative plate, and two dashed vertical equipotential lines parallel to the plates and at right angles to the field lines.">',
      ],
      examinerNote: 'The field between the plates is uniform: parallel, equally spaced lines from + to −. Equipotentials are everywhere perpendicular to the field lines, so here they are parallel to the plates. Do not penalise edge effects if they are drawn, but the lines in the middle must be straight and evenly spaced.',
    },
    {
      label: 'b', sections: ['plates', 'gradient'], command: 'Calculate', marks: 1, syllabus: ['D.2.6', 'D.2.H3'],
      question: 'Calculate the electric field strength between the plates.',
      numeric: { result: 'E', accept: 0.03, mistakes: [{ result: 'wrong_E', feedback: 'The potential difference is given in kilovolts: convert it to volts first.' }] },
      markscheme: ['$E = \\dfrac{V}{d} = \\dfrac{[[V:n]] \\times 10^{3}}{[[d:n]]} = [[E:2u]]$ ✓'],
      examinerNote: 'E = V/d for a uniform field, which is also the magnitude of the potential gradient ΔV/Δr. Accept N C⁻¹.',
    },
    {
      label: 'c', sections: ['equip'], command: 'State', marks: 1, syllabus: ['D.2.H5', 'D.2.H4'],
      question: 'State the work done by the electric field on the particle when the particle moves along one of the equipotential surfaces you have drawn.',
      markscheme: ['zero ✓'],
      examinerNote: 'No work is done moving a charge along an equipotential surface, because the potential, and so qΔV, does not change.',
    },
    {
      label: 'd', sections: ['gradient', 'ev'], command: 'Determine', marks: 2, syllabus: ['D.2.H4'],
      question: 'Determine the work done by the electric field on the particle as it moves from the negative plate to the positive plate.',
      numeric: { result: 'W', accept: 0.03, mistakes: [
        { result: 'wrong_W', feedback: 'W = qΔV uses the potential difference between the plates, not the field strength.' },
        { result: 'wrong_W2', feedback: 'The potential difference is in kilovolts: convert it to volts.' },
      ] },
      markscheme: [
        '$W = q\\Delta V_e$ ✓',
        '$W = [[q:n]] \\times [[V:n]] \\times 10^{3} = [[W:2u]]$ ✓',
        'Allow the answer in electronvolts: [[WeV:2u]]. Accept [[W:lo]] to [[W:hi]] J.',
      ],
      examinerNote: 'The particle crosses the whole potential difference, so W = qV whatever path it takes. The work done by the field is positive: the negative particle moves towards the positive plate. If all of it became kinetic energy the particle would arrive at about [[vArr]], which is why part (e) asks about drag.',
    },
    {
      label: 'e', sections: ['efield'], command: 'Explain', marks: 2, anyOf: 2, syllabus: ['D.2.5', 'A.2.6', 'A.2.1'],
      question: 'In practice the particle does not keep accelerating all the way to the positive plate. Explain, with reference to the forces acting on the particle, why it soon moves towards the plate at a constant speed.',
      markscheme: [
        'Any 2 from:',
        'the electric force $qE$ on the particle is constant because the field is uniform ✓',
        'the drag force from the gas on the particle increases as its speed increases ✓',
        'when the drag force becomes equal (and opposite) to the electric force the resultant force is zero, so the speed stays constant (a terminal speed) ✓',
        'Allow the weight to be ignored: it is much smaller than the electric force.',
      ],
      examinerNote: 'Electric force qE = [[F]] against a weight of only [[weight]], so the motion towards the plate is set by the electric force and the viscous drag (A.2: Stokes drag on a small sphere grows with speed). Terminal speed is reached when the two balance. Award nothing for "the particle loses energy" without a force argument.',
    },
    {
      label: 'f', sections: ['plates'], command: 'Outline', marks: 2, syllabus: ['D.2.5', 'D.2.6'],
      question: 'Outline one environmental benefit of fitting the precipitator to the chimney and one limitation of what it can achieve.',
      markscheme: [
        'benefit: smoke / soot / ash particles are attracted to the plate and removed from the gas before it leaves the chimney, so less particulate pollution reaches the air (fewer breathing problems, less soiling of the surroundings) ✓',
        'limitation: only charged particles are collected, so gases such as carbon dioxide or sulfur dioxide pass through unchanged OR a high-voltage supply (electrical energy) is needed to run it OR the collected ash must still be disposed of ✓',
      ],
      examinerNote: 'Aims 8 and 9 of the guide: the technology uses the force on a charge in the field to clean the gas, but it cannot remove gases. Any sensible benefit and any sensible limitation, each stated in terms of what the device physically does.',
    },
  ],
};
