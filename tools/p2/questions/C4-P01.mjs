// C4-P01: an organ pipe closed at one end — harmonic numbers set by the wavelength–length relationship (new for 2028).
export default {
  id: 'C4-P01',
  title: 'Organ pipe closed at one end: harmonics',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['C.4', 'C.2'],
  batch: 'batch-2028',
  y2028: true,
  originality: {
    inspiredBy: null,
    note: 'Written for this bank for the 2028 C.4 guidance (harmonic numbers set by the wavelength–length relationship; a pipe closed at one end has only the 1st, 3rd, 5th… harmonics). The pipe and numbers are our own; the words "fundamental" and "overtone" are avoided as the guide requires.',
  },
  given: {
    L: { value: 0.85, sf: 2, unit: 'm', range: [0.1, 5], what: 'length of the pipe' },
    v: { value: 340, sf: 2, unit: 'm s^-1', range: [320, 350], what: 'speed of sound in the air in the pipe' },
  },
  calc: (v) => {
    const lam1 = 4 * v.L;
    const f1 = v.v / lam1;
    return {
      lam1: { value: lam1, unit: 'm', sf: 2 },
      f1: { value: f1, unit: 'Hz', sf: 3, range: [20, 2000] },
      f3: { value: 3 * f1, unit: 'Hz', sf: 3 },
      f5: { value: 5 * f1, unit: 'Hz', sf: 3 },
      fOpen: { value: v.v / (2 * v.L), unit: 'Hz', sf: 3 },
      wrong_f1: { value: v.v / (2 * v.L), unit: 'Hz', sf: 3 }, // used λ = 2L (open pipe)
    };
  },
  calcLiterals: { 5: 'the fifth harmonic (5 × the first-harmonic frequency)' },
  stem: '<p>An organ pipe of length [[L]] has one closed end; its other end is open. Sound travels through the air inside it at [[v]].</p>',
  parts: [
    {
      label: 'a', command: 'Show that', marks: 1, syllabus: ['C.4.Y1', 'C.4.3'],
      question: 'Show that the wavelength of the first harmonic is about [[lam1:2u]].',
      showThat: { result: 'lam1', sf: 2 },
      markscheme: ['a quarter of a wavelength fits the pipe (node at the closed end, antinode at the open end), so $\\lambda = 4L = 4 \\times [[L:n]] = [[lam1:2u]]$ ✓'],
      examinerNote: 'The first harmonic has a displacement node at the closed end and an antinode at the open end: L = λ/4.',
    },
    {
      label: 'b', command: 'Calculate', marks: 1, syllabus: ['C.2.2', 'C.4.3'],
      question: 'Calculate the frequency of the first harmonic.',
      numeric: { result: 'f1', accept: 0.03, mistakes: [{ result: 'wrong_f1', feedback: 'That is the first harmonic of a pipe open at both ends (λ = 2L). For a pipe closed at one end, λ = 4L.' }] },
      markscheme: ['$f = \\dfrac{v}{\\lambda} = \\dfrac{[[v:n]]}{[[lam1:2]]} = [[f1:3u]]$ ✓'],
      examinerNote: 'The wave equation with the wavelength from (a).',
    },
    {
      label: 'c', command: 'Determine', marks: 3, syllabus: ['C.4.Y1', 'C.4.3'], dependsOn: ['b'], noNumeric: true,
      question: 'Determine the frequencies of the next two standing waves that can form in this pipe, and state the harmonic number of each.',
      markscheme: [
        'next standing waves have $L = \\tfrac{3\\lambda}{4}$ and $L = \\tfrac{5\\lambda}{4}$ ✓',
        'frequencies [[f3:3u]] and [[f5:3u]] ✓',
        'these are the third and fifth harmonics (harmonic number = frequency ÷ first-harmonic frequency) ✓',
        'Allow ECF from (b).',
      ],
      examinerNote: 'Two values, so no typed answer. The harmonic number is set by the λ–L relationship, so the second standing wave in a closed pipe is the THIRD harmonic (2028 guidance).',
    },
    {
      label: 'd', command: 'Explain', marks: 2, syllabus: ['C.4.Y1', 'C.4.2'],
      question: 'Explain why a standing wave of twice the frequency of the first harmonic cannot form in this pipe.',
      markscheme: [
        'there must always be a node at the closed end and an antinode at the open end ✓',
        'so the pipe length must be an odd number of quarter-wavelengths; twice the frequency would need L = λ/2 (two quarter-wavelengths), which would put a node at the open end ✓',
      ],
      examinerNote: 'Only odd harmonics fit the boundary conditions of a pipe closed at one end.',
    },
    {
      label: 'e', command: 'Calculate', marks: 1, syllabus: ['C.4.Y1', 'C.4.3'],
      question: 'The closed end is opened, so that the pipe is open at both ends. Calculate the new frequency of the first harmonic.',
      numeric: { result: 'fOpen', accept: 0.03 },
      markscheme: ['antinodes at both ends, so $\\lambda = 2L$ and $f = \\dfrac{[[v:n]]}{2 \\times [[L:n]]} = [[fOpen:3u]]$ ✓'],
      examinerNote: 'Open at both ends: half a wavelength fits, so the first-harmonic frequency doubles.',
    },
  ],
};
