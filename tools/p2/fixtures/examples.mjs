// Test questions for tools/p2/test.mjs (never published). GOOD_SHORT and GOOD_LINKING must pass every check;
// the tests then break them one rule at a time and check that each rule catches it.
// GOOD_SHORT is also the worked example of the file format in tools/p2/README.md.

export const GOOD_SHORT = {
  id: 'A1-P90',
  title: 'Stone thrown horizontally from a cliff (test example)',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['A.1'],
  batch: 'test',
  originality: { inspiredBy: null, note: 'Test example written for the tool tests; a generic textbook situation with new numbers.' },
  given: {
    h: { value: 32, sf: 2, unit: 'm', range: [5, 100], what: 'height of the cliff top above the sea' },
    u: { value: 8.5, sf: 2, unit: 'm s^-1', range: [2, 30], what: 'horizontal launch speed' },
  },
  calc: (v, K) => {
    const t = Math.sqrt(2 * v.h / K.g);
    const vy = K.g * t;
    return {
      t: { value: t, unit: 's', sf: 3, range: [0.5, 6] },
      x: { value: v.u * t, unit: 'm', sf: 2 },
      vy: { value: vy, unit: 'm s^-1', sf: 2 },
      speed: { value: Math.hypot(v.u, vy), unit: 'm s^-1', sf: 2 },
      wrong_x: { value: v.u * 2 * v.h / K.g, unit: 'm', sf: 2 }, // used t² instead of t
    };
  },
  stem: '<p>A stone is thrown horizontally at [[u]] from the top of a cliff [[h]] above the sea. Air resistance is negligible.</p>',
  parts: [
    {
      label: 'a', command: 'Show that', marks: 2, syllabus: ['A.1.7', 'A.1.5'],
      question: 'Show that the stone takes about [[t:2u]] to reach the sea.',
      showThat: { result: 't', sf: 2 },
      markscheme: ['$[[h:n]] = \\tfrac{1}{2} \\times [[K.g]] \\times t^2$ ✓', '$t = [[t:3]]\\ \\text{s}$ ✓'],
      examinerNote: 'Vertical motion starts from rest, so s = ½gt².',
    },
    {
      label: 'b', command: 'Calculate', marks: 2, syllabus: ['A.1.7'], dependsOn: ['a'],
      question: 'Calculate the horizontal distance from the foot of the cliff to where the stone lands.',
      numeric: { result: 'x', accept: 0.04, mistakes: [{ result: 'wrong_x', feedback: 'Use the time, not the time squared.' }] },
      markscheme: ['$x = ut$ ✓', '$x = [[x:3]]\\ \\text{m}$ ✓', 'Allow ECF from (a); accept [[x:lo]] to [[x:hi]] m'],
      examinerNote: 'Horizontal velocity is constant without air resistance.',
    },
    {
      label: 'c', command: 'Outline', marks: 2, syllabus: ['A.1.8'],
      question: 'Outline how air resistance would change the horizontal distance travelled.',
      markscheme: ['Air resistance opposes the horizontal motion, so the horizontal speed decreases ✓', 'so the stone lands closer to the cliff / the distance is smaller ✓'],
      examinerNote: 'Qualitative only, as the guide requires.',
    },
  ],
};

export const GOOD_SHORT_INDEPENDENT = (gv) => {
  const g = 9.8;
  const t = Math.sqrt(gv.h.value / (g / 2));
  return { t, x: gv.u.value * t, vy: g * t, speed: Math.sqrt(gv.u.value ** 2 + (g * t) ** 2) };
};

export const GOOD_LINKING = {
  id: 'LQ-S90',
  title: 'Kettle on a camping stove (test example)',
  type: 'linking',
  level: 'SL',
  difficulty: 2,
  topics: ['B.1', 'A.3', 'B.5', 'C.2'],
  batch: 'test',
  originality: { inspiredBy: null, note: 'Test example written for the tool tests; new context and numbers.' },
  given: {
    m: { value: 0.80, sf: 2, unit: 'kg', range: [0.2, 2], what: 'mass of water' },
    dT: { value: 75, sf: 2, unit: 'Δ°C', range: [10, 90], what: 'temperature rise' },
    c: { value: 4200, sf: 2, unit: 'J kg^-1 K^-1', range: [4000, 4300], what: 'specific heat capacity of water' },
    P: { value: 2.0, sf: 2, unit: 'kW', range: [0.5, 3], what: 'power of the kettle' },
    V: { value: 230, sf: 2, unit: 'V', range: [110, 240], what: 'supply potential difference' },
    f: { value: 50, sf: 2, unit: 'Hz', range: [20, 20000], what: 'frequency of the hum' },
    lam: { value: 6.8, sf: 2, unit: 'm', range: [0.01, 20], what: 'wavelength of the hum in air' },
  },
  calc: (v) => ({
    Q: { value: v.m * v.c * v.dT, unit: 'kJ', sf: 3 },
    time: { value: v.m * v.c * v.dT / v.P, unit: 's', sf: 3 },
    I: { value: v.P / v.V, unit: 'A', sf: 2 },
    R: { value: v.V ** 2 / v.P, unit: 'Ω', sf: 2 },
    speed: { value: v.f * v.lam, unit: 'm s^-1', sf: 3 },
  }),
  stem: '<p>An electric kettle of power [[P]] is connected to a [[V]] supply. It heats [[m]] of water.</p>',
  parts: [
    { label: 'a', command: 'Show that', marks: 2, syllabus: ['B.1.6'], showThat: { result: 'Q', sf: 2 },
      question: 'The temperature of the water rises by [[dT]]. Water has a specific heat capacity of [[c]]. Show that the energy needed is about [[Q:2u]].',
      markscheme: ['$Q = mc\\Delta T$ ✓', '$Q = [[Q:3]]\\ \\text{kJ}$ ✓'], examinerNote: 'Direct use of Q = mcΔT.' },
    { label: 'b', command: 'Calculate', marks: 2, syllabus: ['A.3.7'], dependsOn: ['a'], numeric: { result: 'time', accept: 0.05 },
      question: 'Calculate the time taken, assuming all the energy goes into the water.',
      markscheme: ['$t = Q/P$ ✓', '$t = [[time:3]]\\ \\text{s}$ ✓', 'Allow ECF from (a)'], examinerNote: 'Power as rate of energy transfer.' },
    { label: 'c', command: 'Explain', marks: 2, syllabus: ['A.3.8'],
      question: 'Explain why the actual time is longer than the answer to (b).',
      markscheme: ['Energy is transferred to the surroundings / the kettle itself ✓', 'so more energy must be supplied, which at constant power takes longer ✓'], examinerNote: 'Efficiency below 100 %.' },
    { label: 'd(i)', command: 'Calculate', marks: 2, syllabus: ['B.5.9'], numeric: { result: 'I' },
      question: 'Calculate the current in the kettle.',
      markscheme: ['$I = P/V$ ✓', '$I = [[I:3]]\\ \\text{A}$ ✓'], examinerNote: 'Electrical power P = IV, rearranged.' },
    { label: 'd(ii)', command: 'Determine', marks: 2, syllabus: ['B.5.9'], numeric: { result: 'R' },
      question: 'Determine the resistance of the heating element.',
      markscheme: ['$R = V^2/P$ OR $R = V/I$ ✓', '$R = [[R:3]]\\ \\Omega$ ✓'], examinerNote: 'Any of the power equations works.' },
    { label: 'd(iii)', command: 'Outline', marks: 2, syllabus: ['B.5.6'],
      question: 'Outline why the element gets hot when there is a current in it.',
      markscheme: ['Charge carriers / electrons collide with the ions of the metal ✓', 'transferring kinetic energy to them, so the internal energy increases ✓'], examinerNote: 'Origin of resistance and the heating effect.' },
    { label: 'e(i)', command: 'State', marks: 1, syllabus: ['C.2.3'],
      question: 'The kettle hums as it heats. State the type of wave that carries the hum through the air.',
      markscheme: ['longitudinal (sound) wave ✓'], examinerNote: 'Sound is a longitudinal wave.' },
    { label: 'e(ii)', command: 'Calculate', marks: 2, syllabus: ['C.2.2'], numeric: { result: 'speed' },
      question: 'The hum has a frequency of [[f]] and a wavelength of [[lam]]. Calculate the speed of sound in the air.',
      markscheme: ['$v = f\\lambda$ ✓', '$v = [[speed:3]]\\ \\text{m s}^{-1}$ ✓'], examinerNote: 'The wave equation v = f lambda.' },
    { label: 'e(iii)', command: 'Describe', marks: 3, syllabus: ['C.2.1'],
      question: 'Describe how the air molecules move as the hum passes.',
      markscheme: ['They oscillate about fixed positions ✓', 'parallel to the direction the wave travels ✓', 'forming compressions and rarefactions; there is no overall movement of air ✓'], examinerNote: 'Longitudinal particle motion.' },
    { label: 'e(iv)', command: 'State', marks: 2, syllabus: ['C.2.5'],
      question: 'State two differences between the hum and the light from the kettle\'s indicator lamp.',
      markscheme: ['Any 2 from:', 'sound needs a medium but light does not ✓', 'light is transverse, sound is longitudinal ✓', 'light travels much faster ✓'], anyOf: 2, examinerNote: 'Mechanical vs EM waves.' },
  ],
};

export const GOOD_LINKING_INDEPENDENT = (gv) => {
  const energyJ = gv.m.value * gv.c.value * gv.dT.value;
  const watts = gv.P.value * 1000;
  return { Q: energyJ / 1000, time: energyJ / watts, I: watts / gv.V.value, R: gv.V.value / (watts / gv.V.value), speed: gv.f.value * gv.lam.value };
};
