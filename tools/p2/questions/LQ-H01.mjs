// LQ-H01: a hospital cyclotron making fluorine-18 (magnetic force, relativity check, decay constant, cooling).
export default {
  id: 'LQ-H01',
  title: 'Cyclotron making a medical isotope',
  type: 'linking',
  level: 'HL',
  difficulty: 3,
  topics: ['D.3', 'A.2', 'A.3', 'A.5', 'E.3', 'B.1', 'B.5'],
  batch: 'batch-1',
  batchRule: 'inspect-all',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank. Hospital cyclotrons make fluorine-18 (half-life about 110 min) for PET scans; the chain of parts (orbit → kinetic energy → is relativity needed? → decay during transport → beam power and target cooling) and all numbers are our own.',
  },
  given: {
    B: { value: 1.5, sf: 2, unit: 'T', range: [0.5, 3], what: 'magnetic field strength in the cyclotron' },
    r: { value: 0.40, sf: 2, unit: 'm', range: [0.2, 1], what: 'radius of the protons\' path when they leave' },
    Th: { value: 110, sf: 3, unit: 'min', range: [109, 110], what: 'half-life of fluorine-18' },
    A0: { value: 5.0e10, sf: 2, unit: 'Bq', range: [1e9, 1e12], what: 'activity of the fluorine-18 at the end of production' },
    tt: { value: 45, sf: 2, unit: 'min', range: [10, 240], what: 'time taken to transport the sample to the hospital' },
    Ib: { value: 50, sf: 2, unit: 'µA', range: [5, 200], what: 'beam current hitting the target' },
    dTw: { value: 12, sf: 2, unit: 'K', range: [2, 40], what: 'temperature rise of the cooling water' },
    cw: { value: 4200, sf: 2, unit: 'J kg^-1 K^-1', range: [4100, 4300], what: 'specific heat capacity of water' },
  },
  literals: { 60: 'seconds in a minute (converting the half-life and the transport time)', 18: 'the nucleon number in the name fluorine-18', 90: 'the angle between the magnetic force and the velocity' },
  calcLiterals: { 60: 'minutes in a second, only for the wrong answer "half-life left in minutes"' },
  calc: (v, K) => {
    const speed = K.e * v.B * v.r / K.mp;
    const Ek = (1 / 2) * K.mp * speed ** 2;
    const beta = speed / K.c;
    const lam = Math.log(2) / v.Th;
    const A = v.A0 * Math.exp(-lam * v.tt);
    const P = (v.Ib / K.e) * Ek;
    return {
      speed: { value: speed, unit: 'm s^-1', sf: 3 },
      T: { value: 2 * Math.PI * K.mp / (K.e * v.B), unit: 's', sf: 3 },
      Ek_J: { value: Ek, unit: 'J', sf: 3 },
      Ek: { value: Ek, unit: 'MeV', sf: 3, range: [5, 40] },
      beta: { value: beta, unit: '', sf: 2, range: [0.05, 0.4] },
      gamma: { value: 1 / Math.sqrt(1 - beta ** 2), unit: '', sf: 3 },
      lam: { value: lam, unit: 's^-1', sf: 3 },
      A: { value: A, unit: 'Bq', sf: 3 },
      N: { value: A / lam, unit: '', sf: 3 },
      P: { value: P, unit: 'W', sf: 3, range: [100, 5000] },
      flow: { value: P / (v.cw * v.dTw), unit: 'kg s^-1', sf: 3 },
      wrong_lam: { value: Math.log(2) / (v.Th / 60), unit: 's^-1', sf: 3 }, // half-life left in minutes
      wrong_A: { value: v.A0 / 2, unit: 'Bq', sf: 3 }, // halved once, as if a whole half-life had passed
    };
  },
  stem: '<p>A hospital cyclotron accelerates protons, which move in a circle in a uniform magnetic field of strength [[B]]. The protons spiral outwards as they gain energy and leave the cyclotron when the radius of their path is [[r]]. They then strike a target and produce the radioactive isotope fluorine-18, which is used in medical scans.</p>',
  parts: [
    {
      label: 'a(i)', command: 'Show that', marks: 2, syllabus: ['D.3.2', 'D.3.4', 'A.2.13'],
      question: 'Show that the speed of the protons when they leave the cyclotron is about [[speed:2u]].',
      showThat: { result: 'speed', sf: 2 },
      markscheme: [
        '$qvB = \\dfrac{mv^2}{r}$ (magnetic force provides the centripetal force) ✓',
        '$v = \\dfrac{qBr}{m} = \\dfrac{[[K.e]] \\times [[B:n]] \\times [[r:n]]}{[[K.mp]]} = [[speed:3u]]$ ✓',
      ],
      examinerNote: 'Equate the magnetic force to the centripetal force. Proton mass and charge from the data booklet.',
    },
    {
      label: 'a(ii)', command: 'Explain', marks: 2, syllabus: ['D.3.2', 'A.3.2'],
      question: 'Explain why the magnetic field does not change the kinetic energy of the protons.',
      markscheme: [
        'the magnetic force is always perpendicular to the velocity (direction of motion) ✓',
        'so it does no work on the protons ($W = Fs\\cos 90^{\\circ} = 0$): it changes their direction but not their speed ✓',
      ],
      examinerNote: 'The energy is supplied by the electric field in the gap between the electrodes, not by the magnetic field.',
    },
    {
      label: 'a(iii)', command: 'Calculate', marks: 2, syllabus: ['D.3.2', 'A.2.14'],
      question: 'Calculate the time taken by a proton to complete one circle in the magnetic field.',
      numeric: { result: 'T', accept: 0.03 },
      markscheme: [
        '$T = \\dfrac{2\\pi r}{v} = \\dfrac{2\\pi m}{qB}$ ✓',
        '$T = [[T:3u]]$ ✓',
        'Award both marks for $2\\pi r/v$ with the values from (a)(i).',
      ],
      examinerNote: 'The period does not depend on the radius or speed (for non-relativistic speeds), which is what makes a cyclotron work with a fixed-frequency electric field.',
    },
    {
      label: 'a(iv)', command: 'Calculate', marks: 2, syllabus: ['A.3.5'], dependsOn: ['a(i)'],
      question: 'Calculate, in MeV, the kinetic energy of a proton when it leaves the cyclotron.',
      numeric: { result: 'Ek', accept: 0.04 },
      markscheme: [
        '$E_{\\text{k}} = \\tfrac{1}{2}mv^2 = [[Ek_J:3u]]$ ✓',
        '$E_{\\text{k}} = [[Ek:3u]]$; allow ECF from (a)(i) ✓',
      ],
      examinerNote: 'Convert joules to MeV by dividing by e × 10⁶. Using the rounded speed gives about 17 MeV.',
    },
    {
      label: 'b(i)', command: 'Calculate', marks: 1, syllabus: ['A.5.H4'], dependsOn: ['a(i)'],
      question: 'Calculate the Lorentz factor $\\gamma$ for the protons when they leave the cyclotron.',
      numeric: { result: 'gamma', tolerance: 0.002 },
      markscheme: ['$\\dfrac{v}{c} = [[beta:2]]$, so $\\gamma = \\dfrac{1}{\\sqrt{1 - v^2/c^2}} = [[gamma:4]]$; allow ECF from (a)(i) ✓'],
      examinerNote: 'A value just above 1; the answer must be given to at least 3 significant figures to show the difference from 1.',
    },
    {
      label: 'b(ii)', command: 'Comment', marks: 2, syllabus: ['A.5.H4', 'A.3.5'],
      question: 'Comment on whether it was reasonable to use $E_{\\text{k}} = \\tfrac{1}{2}mv^2$ in (a)(iv).',
      markscheme: [
        '$\\gamma$ is only about 2 % greater than 1 ✓',
        'so relativistic effects change the energy by only about this amount: the non-relativistic equation is a reasonable approximation (for this answer to 2 significant figures) ✓',
      ],
      examinerNote: 'At about one-fifth of the speed of light the relativistic correction is a few per cent. Award the second mark for a conclusion consistent with the student\'s γ.',
    },
    {
      label: 'c(i)', command: 'Calculate', marks: 1, syllabus: ['E.3.H9'],
      question: 'The half-life of fluorine-18 is [[Th]]. Calculate the decay constant of fluorine-18, in $\\text{s}^{-1}$.',
      numeric: { result: 'lam', accept: 0.03, mistakes: [{ result: 'wrong_lam', feedback: 'Convert the half-life to seconds before using λ = ln 2 / T½.' }] },
      markscheme: ['$\\lambda = \\dfrac{\\ln 2}{[[Th:n]] \\times 60} = [[lam:3u]]$ ✓'],
      examinerNote: 'The half-life must be in seconds for λ in s⁻¹.',
    },
    {
      label: 'c(ii)', command: 'Determine', marks: 2, syllabus: ['E.3.H6', 'E.3.H8'], dependsOn: ['c(i)'],
      question: 'At the end of production the activity of the fluorine-18 is [[A0]]. It takes [[tt]] to transport the sample to a hospital. Determine the activity of the sample when it arrives.',
      numeric: { result: 'A', accept: 0.03, mistakes: [{ result: 'wrong_A', feedback: 'The transport time is less than one half-life, so the activity falls by less than half: use A = A₀e^(−λt).' }] },
      markscheme: [
        '$A = A_0 e^{-\\lambda t}$ with $t = [[tt:n]] \\times 60$ s ✓',
        '$A = [[A:3u]]$; allow ECF from (c)(i) ✓',
      ],
      examinerNote: 'The decay law for a time that is not a whole number of half-lives (HL).',
    },
    {
      label: 'c(iii)', command: 'Calculate', marks: 2, syllabus: ['E.3.H8'], dependsOn: ['c(i)', 'c(ii)'],
      question: 'Calculate the number of fluorine-18 nuclei in the sample when it arrives.',
      numeric: { result: 'N', accept: 0.04 },
      markscheme: [
        '$N = \\dfrac{A}{\\lambda}$ ✓',
        '$N = [[N:3]]$; allow ECF from (c)(i) and (c)(ii) ✓',
      ],
      examinerNote: 'Activity A = λN.',
    },
    {
      label: 'd(i)', command: 'Show that', marks: 2, syllabus: ['B.5.3', 'A.3.7'],
      question: 'The beam of protons hitting the target is equivalent to a current of [[Ib]]. Show that the beam delivers energy to the target at a rate of about [[P:2u]].',
      showThat: { result: 'P', sf: 2 },
      markscheme: [
        'number of protons per second $= \\dfrac{I}{e} = \\dfrac{[[Ib:n]] \\times 10^{-6}}{[[K.e]]}$ ✓',
        '$P = \\dfrac{I}{e} \\times E_{\\text{k}} = [[P:3u]]$ (OR $P = IV$ with $V$ = [[Ek:3]] MV) ✓',
      ],
      examinerNote: 'Each proton delivers its kinetic energy; I/e protons arrive per second. Equivalent to P = IV with V numerically equal to the energy in MeV (in MV).',
    },
    {
      label: 'd(ii)', command: 'Calculate', marks: 2, syllabus: ['B.1.6', 'A.3.7'], dependsOn: ['d(i)'],
      question: 'The target is cooled by water, which warms by [[dTw]] as it flows past. Water has a specific heat capacity of [[cw]]. Calculate the mass of water that must flow past the target each second.',
      numeric: { result: 'flow', accept: 0.04 },
      markscheme: [
        '$P = \\dfrac{m}{t}c\\Delta T$ ✓',
        '$\\dfrac{m}{t} = [[flow:3u]]$; allow ECF from (d)(i) ✓',
      ],
      examinerNote: 'All the beam power is removed by the water. Using the rounded power from (d)(i) gives a value inside the range.',
    },
  ],
};
