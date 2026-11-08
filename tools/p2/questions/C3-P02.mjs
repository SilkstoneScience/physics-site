// C3-P02: two loudspeakers in a school hall driven in phase (path difference and two-source interference of sound).
export default {
  id: 'C3-P02',
  title: 'Two loudspeakers in a school hall',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['C.3', 'C.2'],
  sections: ['interference', 'superposition'],
  batch: 'batch-3',
  situation: 'two loudspeakers in a school hall driven in phase by one signal generator, student walking across the sound field',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the C.3 understandings (coherence, superposition, the path-difference conditions for constructive and destructive interference) and C.2.2 (v = fλ). Two-speaker interference is a standard demonstration; the hall, the student walking across the pattern, the frequency, the distances, the "quiet even though both loudspeakers are on" explanation and the frequency-doubling prediction are our own. It uses path-difference reasoning only, not the double-slit equation of the hand-written C3-022, and its numbers differ from the loudspeaker in C2-013.',
  },
  given: {
    f: { value: 425, sf: 3, unit: 'Hz', range: [100, 2000], what: 'frequency of the signal generator' },
    v: { value: 340, sf: 3, unit: 'm s^-1', range: [330, 350], what: 'speed of sound in the hall' },
    d1: { value: 7.40, sf: 3, unit: 'm', range: [1, 30], what: 'distance from loudspeaker 1 to the point P' },
    d2: { value: 5.40, sf: 3, unit: 'm', range: [1, 30], what: 'distance from loudspeaker 2 to the point P' },
  },
  calc: (v) => {
    const lambda = v.v / v.f;
    const delta = v.d1 - v.d2;
    return {
      lambda: { value: lambda, unit: 'm', sf: 3, range: [0.1, 4] },
      delta: { value: delta, unit: 'm', sf: 3 },
      ratio: { value: delta / lambda, unit: '', sf: 2 },
      halfLambda: { value: lambda / 2, unit: 'm', sf: 3 },
      wrong_lambda: { value: v.f / v.v, unit: 'm', sf: 3 }, // f/v instead of v/f
    };
  },
  stem: '<p>Two loudspeakers, S<sub>1</sub> and S<sub>2</sub>, stand at one end of a school hall. They are connected to the same signal generator, which drives them in phase at a frequency of [[f]]. A student walks slowly along a line parallel to the line joining the loudspeakers and notices that the sound is loud at some positions and very quiet at others. The point P on this line is [[d1]] from S<sub>1</sub> and [[d2]] from S<sub>2</sub>. The speed of sound in the hall is [[v]].</p>',
  diagram: { file: 'questions/diagrams/p2-c3-speakers.svg', alt: 'Plan view: a signal generator connected by wires to two loudspeakers S1 and S2, one above the other at the left. A dashed vertical line to their right is labelled as the line along which the student walks. A point P on this line is joined to S1 by a line labelled 7.40 m and to S2 by a line labelled 5.40 m.' },
  parts: [
    {
      label: 'a', sections: ['interference'], command: 'State', marks: 1, syllabus: ['C.3.6'],
      question: 'State the condition for the two loudspeakers to act as coherent sources.',
      markscheme: ['the waves they emit have a constant phase difference / the same frequency and a constant phase relationship ✓'],
      examinerNote: 'Coherence is a constant phase difference (which requires the same frequency). "They are in phase" alone is accepted as a special case of a constant phase difference.',
    },
    {
      label: 'b', sections: ['interference'], command: 'Calculate', marks: 1, syllabus: ['C.2.2'],
      question: 'Calculate the wavelength of the sound in the hall.',
      numeric: { result: 'lambda', accept: 0.01, mistakes: [{ result: 'wrong_lambda', feedback: 'Wavelength = speed ÷ frequency, not frequency ÷ speed.' }] },
      markscheme: ['$\\lambda = \\dfrac{v}{f} = \\dfrac{[[v:n]]}{[[f:n]]} = [[lambda:3u]]$ ✓'],
      examinerNote: 'v = fλ rearranged.',
    },
    {
      label: 'c', sections: ['interference'], command: 'Determine', marks: 3, syllabus: ['C.3.6'], dependsOn: ['b'], noNumeric: true,
      question: 'Determine whether P is a loud position or a quiet position.',
      markscheme: [
        'path difference $= [[d1:n]] - [[d2:n]] = [[delta:3u]]$ ✓',
        'this is $[[ratio:2]]\\lambda$ / an odd number of half wavelengths / $(n + \\tfrac{1}{2})\\lambda$ with $n = 2$ ✓',
        'so the waves from the two loudspeakers interfere destructively at P, which is a quiet position ✓',
        'Allow ECF from (b).',
      ],
      examinerNote: 'Path difference 2.00 m = 2.5 wavelengths, so destructive interference. The conclusion must follow from the comparison with the wavelength; "quiet" without the path difference earns nothing.',
    },
    {
      label: 'd', sections: ['superposition', 'interference'], command: 'Explain', marks: 2, syllabus: ['C.3.5', 'C.3.6'],
      question: 'Explain why the sound at a quiet position is very faint even though both loudspeakers are emitting sound.',
      markscheme: [
        'the two waves arrive half a cycle out of phase / with a phase difference of $\\pi$ (a compression from one loudspeaker arrives together with a rarefaction from the other) ✓',
        'by the principle of superposition the displacements add to give a resultant of (almost) zero amplitude, so very little sound energy reaches the ear (not exactly zero, because the two waves have travelled different distances and so have slightly different amplitudes) ✓',
      ],
      examinerNote: 'Two points: antiphase arrival, then superposition giving a minimum amplitude. The bracketed remark on unequal amplitudes is not required for the mark.',
    },
    {
      label: 'e', sections: ['interference'], command: 'Predict', marks: 2, syllabus: ['C.3.6', 'C.2.2'],
      question: 'The frequency of the signal generator is doubled. Predict, with a reason, what happens to the separation of neighbouring quiet positions along the line.',
      markscheme: [
        'the wavelength halves (to [[halfLambda:3u]]), because the speed of sound is unchanged ✓',
        'neighbouring quiet positions differ in path difference by one wavelength, so they move closer together / their separation is roughly halved ✓',
      ],
      examinerNote: 'λ = v/f halves. Successive minima are one wavelength apart in path difference, so the pattern becomes finer. Students may argue by analogy with the fringe spacing; the path-difference reason is what is asked for.',
    },
  ],
};
