// C3-P01: an optical fibre in a medical endoscope (refraction at the end face, total internal reflection in the core).
export default {
  id: 'C3-P01',
  title: 'Optical fibre in a medical endoscope',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['C.3'],
  sections: ['tir', 'refraction'],
  batch: 'batch-3',
  situation: 'glass optical fibre with cladding inside a medical endoscope',
  literals: { 90: 'the angle between the flat end face and the side of the fibre (a right angle)' },
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the C.3 understandings (Snell\'s law, critical angle, total internal reflection, reflection and transmission at boundaries). The step-index fibre is a standard textbook context; the endoscope setting, the refractive indices, the angle, the sketch part and the two aim-7/9 parts (why a cladding is used, why fibres suit imaging inside the body) are our own. Nothing on dispersion or pulse broadening, which the 2025 guide does not include.',
  },
  given: {
    n1: { value: 1.60, sf: 3, unit: '', range: [1.4, 1.9], what: 'refractive index of the glass core' },
    n2: { value: 1.50, sf: 3, unit: '', range: [1.3, 1.8], what: 'refractive index of the cladding' },
    theta: { value: 25, sf: 2, unit: '°', range: [5, 60], what: 'angle of incidence of the ray in air at the end face' },
  },
  calc: (v) => {
    const c = Math.asin(v.n2 / v.n1);
    const r = Math.asin(Math.sin(v.theta) / v.n1);
    return {
      c: { value: c, unit: '°', sf: 3, range: [40, 85] },
      r: { value: r, unit: '°', sf: 3 },
      phi: { value: Math.PI / 2 - r, unit: '°', sf: 3 },
      wrong_c: { value: Math.asin(1 / v.n1), unit: '°', sf: 3 }, // critical angle for glass to air
    };
  },
  stem: '<p>A medical endoscope carries light into and out of a patient\'s body along a bundle of thin glass optical fibres. Each fibre has a core of refractive index [[n1]] surrounded by a cladding of refractive index [[n2]]. The diagram shows one fibre. A ray of light in air meets the centre of the flat end face of the fibre with an angle of incidence of [[theta]]. The end face is perpendicular to the axis of the fibre.</p>',
  diagram: { file: 'questions/diagrams/p2-c3-fibre.svg', large: true, alt: 'A horizontal section of optical fibre: a core labelled n = 1.60 between two bands of cladding labelled n = 1.50, with a flat end face on the left. A ray in air comes from the upper left and meets the centre of the end face at 25 degrees to the dashed normal, which lies along the axis of the fibre.' },
  parts: [
    {
      label: 'a', sections: ['tir'], command: 'Calculate', marks: 1, syllabus: ['C.3.4'],
      question: 'Calculate the critical angle for light at the boundary between the core and the cladding.',
      numeric: { result: 'c', accept: 0.01, mistakes: [{ result: 'wrong_c', feedback: 'The boundary is between the core and the cladding, not between the core and air: use the ratio of the two refractive indices.' }] },
      markscheme: ['$\\sin c = \\dfrac{n_2}{n_1} = \\dfrac{[[n2:n]]}{[[n1:n]]}$ so $c = [[c:3u]]$ ✓'],
      examinerNote: 'Snell\'s law with the angle of refraction equal to 90°: sin c = n₂/n₁. Using 1/n₁ (glass to air) gives 38.7°, a common error.',
    },
    {
      label: 'b', sections: ['refraction', 'tir'], command: 'Determine', marks: 3, syllabus: ['C.3.4'], dependsOn: ['a'], noNumeric: true,
      question: 'Determine whether the ray is totally internally reflected when it first reaches the boundary between the core and the cladding.',
      markscheme: [
        '$\\sin\\theta_2 = \\dfrac{\\sin [[theta]]}{[[n1:n]]}$, so the angle of refraction in the core is $[[r:3u]]$ ✓',
        'the angle of incidence at the core–cladding boundary is $90^{\\circ} - [[r:3u]] = [[phi:3u]]$ ✓',
        '$[[phi:3u]]$ is greater than the critical angle ($[[c:3u]]$), so the ray is totally internally reflected / none of the light is refracted into the cladding ✓',
        'Allow ECF from (a).',
      ],
      examinerNote: 'Snell\'s law at the end face, then the geometry: the ray makes 15.3° with the axis, so it meets the side of the core at 90° − 15.3° = 74.7° to the normal there, which exceeds the critical angle. The answer is a reasoned conclusion, so there is no typed number.',
    },
    {
      label: 'c', sections: ['tir'], command: 'Sketch', marks: 2, syllabus: ['C.3.2', 'C.3.4'],
      question: 'Sketch the path of the ray along a short length of the fibre, showing two reflections at the boundary between the core and the cladding.',
      markscheme: [
        'the ray bends towards the normal (towards the axis of the fibre) as it enters the core ✓',
        'straight segments inside the core, reflected at the boundary with equal angles on the two sides of the normal, and no ray drawn in the cladding ✓',
        'Note: the examiner\'s sketch is shown below.<figure><img src="questions/diagrams/p2-c3-fibre-ms.svg" alt="Examiner\'s drawing: the ray refracts towards the axis at the end face, travels in a straight line to the lower core–cladding boundary, reflects up to the upper boundary at an equal angle, reflects again and continues along the core; the angles with the boundary normals are marked 75 degrees."></figure>',
      ],
      examinerNote: 'Two features: refraction towards the normal at the end face (the ray in the core is closer to the axis than the ray in air) and a zigzag with equal angles of incidence and reflection that stays in the core.',
    },
    {
      label: 'd', sections: ['tir'], command: 'Outline', marks: 2, syllabus: ['C.3.4'],
      question: 'In the bundle the fibres touch each other. Outline why each core is surrounded by a cladding of lower refractive index rather than being left as bare glass.',
      markscheme: [
        'where bare cores touched each other (or body tissue or fluid), the boundary would be between materials of similar refractive index, so there would be no critical angle (or a much larger one) and light would leak from one fibre into its neighbour ✓',
        'the cladding keeps a boundary with a lower refractive index all the way along the core, so total internal reflection continues (and it protects the core surface from scratches and dirt, which would scatter light) ✓',
      ],
      examinerNote: 'Total internal reflection needs the second medium to have a lower refractive index at every point of the surface. Glass touching glass of the same index has no boundary, so light crosses between fibres and the image is scrambled.',
    },
    {
      label: 'e', sections: ['tir'], command: 'Suggest', marks: 1, syllabus: ['C.3.4'], anyOf: 1,
      question: 'Suggest one reason why optical fibres are well suited to viewing the inside of a patient\'s body.',
      markscheme: [
        'Any 1 from:',
        'the fibres are thin and flexible, so a bundle can be passed along narrow, curved passages in the body ✓',
        'light (and the image) is carried without any electric current or heating inside the body ✓',
        'a view inside the body is obtained through a small natural opening or incision, so major surgery can be avoided ✓',
      ],
      examinerNote: 'Aims 7 and 9: a benefit of the technology. Any sensible, physics-based reason earns the mark; "it is cheap" does not.',
    },
  ],
};
