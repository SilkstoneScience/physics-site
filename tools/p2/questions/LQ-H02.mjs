// LQ-H02: a flywheel energy store on a tram (rotational dynamics, efficiency, induction, heating).
export default {
  id: 'LQ-H02',
  title: 'Flywheel energy store on a tram',
  type: 'linking',
  level: 'HL',
  difficulty: 3,
  topics: ['A.4', 'A.3', 'D.4', 'B.1'],
  batch: 'batch-1',
  batchRule: 'inspect-all',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank. Flywheel energy storage has been tested on trams and buses; the tram, the chain of parts (moment of inertia → stored energy → run-down → efficiency → generator → heating of the bearings) and all numbers are our own.',
  },
  given: {
    M: { value: 300, sf: 2, unit: 'kg', range: [50, 1000], what: 'mass of the flywheel (a uniform disc)' },
    R: { value: 0.40, sf: 2, unit: 'm', range: [0.1, 1], what: 'radius of the flywheel' },
    w1: { value: 3000, sf: 2, unit: 'rev min^-1', range: [1000, 20000], what: 'full rotation rate of the flywheel' },
    tau: { value: 0.80, sf: 2, unit: 'N m', range: [0.1, 10], what: 'frictional torque in the bearings' },
    mt: { value: 1.8e4, sf: 2, unit: 'kg', range: [1e4, 5e4], what: 'mass of the tram' },
    vt: { value: 6.0, sf: 2, unit: 'm s^-1', range: [2, 15], what: 'speed the tram reaches' },
    w2: { value: 2400, sf: 2, unit: 'rev min^-1', range: [500, 20000], what: 'rotation rate of the flywheel after accelerating the tram' },
    N: { value: 200, sf: 2, unit: '', range: [10, 2000], what: 'number of turns on the generator coil' },
    A: { value: 0.020, sf: 2, unit: 'm^2', range: [0.001, 0.1], what: 'area of the generator coil' },
    B: { value: 0.35, sf: 2, unit: 'T', range: [0.05, 1.5], what: 'magnetic field strength in the generator' },
    mb: { value: 45, sf: 2, unit: 'kg', range: [5, 200], what: 'mass of the bearings and their steel housing' },
    cs: { value: 450, sf: 2, unit: 'J kg^-1 K^-1', range: [420, 500], what: 'specific heat capacity of steel' },
  },
  literals: { 60: 'seconds in a minute (converting rev min⁻¹ to rad s⁻¹)' },
  calc: (v) => {
    const I = (1 / 2) * v.M * v.R ** 2;
    const E1 = (1 / 2) * I * v.w1 ** 2;
    const alpha = v.tau / I;
    const tstop = v.w1 / alpha;
    const dE = (1 / 2) * I * (v.w1 ** 2 - v.w2 ** 2);
    const Etram = (1 / 2) * v.mt * v.vt ** 2;
    const f = v.w1 / (2 * Math.PI);
    return {
      I: { value: I, unit: 'kg m^2', sf: 3 },
      w1SI: { value: v.w1, unit: 'rad s^-1', sf: 3 },
      E1: { value: E1, unit: 'J', sf: 3, range: [1e5, 1e8] },
      alpha: { value: alpha, unit: 'rad s^-2', sf: 3 },
      tstop: { value: tstop, unit: 's', sf: 3 },
      revs: { value: (v.w1 * tstop / 2) / (2 * Math.PI), unit: '', sf: 3 },
      dE: { value: dE, unit: 'J', sf: 3 },
      Etram: { value: Etram, unit: 'J', sf: 3 },
      eff: { value: Etram / dE, unit: '', sf: 2, range: [0.3, 0.95] },
      f: { value: f, unit: 'Hz', sf: 2 },
      emf: { value: 4 * v.N * v.B * v.A * f, unit: 'V', sf: 3 },
      dT: { value: E1 / (v.mb * v.cs), unit: 'K', sf: 3, range: [5, 300] },
      wrong_E1: { value: (1 / 2) * I * (v.w1 / (2 * Math.PI)) ** 2, unit: 'J', sf: 3 }, // used rev/s, not rad/s
      wrong_eff: { value: Etram / E1, unit: '', sf: 2 }, // used all the stored energy
    };
  },
  stem: '<p>A tram stores energy in a flywheel, a uniform disc of mass [[M]] and radius [[R]] that spins about its central axis. The moment of inertia of a uniform disc is $I = \\tfrac{1}{2}MR^2$. At full speed the flywheel rotates at [[w1]].</p>',
  parts: [
    {
      label: 'a(i)', command: 'Show that', marks: 1, syllabus: ['A.4.H6'],
      question: 'Show that the moment of inertia of the flywheel is about [[I:2u]].',
      showThat: { result: 'I', sf: 2 },
      markscheme: ['$I = \\tfrac{1}{2} \\times [[M:n]] \\times [[R:n]]^2 = [[I:3u]]$ ✓'],
      examinerNote: 'The equation is given, as the guide requires for a particular shape.',
    },
    {
      label: 'a(ii)', command: 'Calculate', marks: 2, syllabus: ['A.4.H11', 'A.4.H4'], dependsOn: ['a(i)'],
      question: 'Calculate the rotational kinetic energy of the flywheel at full speed.',
      numeric: { result: 'E1', accept: 0.03, mistakes: [{ result: 'wrong_E1', feedback: 'Convert the rotation rate to an angular speed in rad s⁻¹: multiply revolutions per second by 2π.' }] },
      markscheme: [
        '$\\omega = \\dfrac{[[w1:n]] \\times 2\\pi}{60} = [[w1SI:3u]]$ ✓',
        '$E_{\\text{k}} = \\tfrac{1}{2}I\\omega^2 = [[E1:3u]]$; allow ECF from (a)(i) ✓',
      ],
      examinerNote: 'The angular speed must be in rad s⁻¹.',
    },
    {
      label: 'a(iii)', command: 'Determine', marks: 2, syllabus: ['A.4.H8', 'A.4.H5'], dependsOn: ['a(i)', 'a(ii)'],
      question: 'The tram is parked and the flywheel is left spinning freely from full speed. The only torque on it is a constant frictional torque of [[tau]] in the bearings. Determine the time taken for the flywheel to stop.',
      numeric: { result: 'tstop', accept: 0.03 },
      markscheme: [
        '$\\alpha = \\dfrac{\\tau}{I} = [[alpha:3u]]$ ✓',
        '$t = \\dfrac{\\omega}{\\alpha} = [[tstop:3u]]$; allow ECF from (a)(i) and (a)(ii) ✓',
      ],
      examinerNote: 'Newton\'s second law for rotation, then uniform angular deceleration (or angular impulse τt = Iω).',
    },
    {
      label: 'a(iv)', command: 'Calculate', marks: 2, syllabus: ['A.4.H5'], dependsOn: ['a(iii)'],
      question: 'Calculate the number of revolutions the flywheel makes while it slows down to rest.',
      numeric: { result: 'revs', accept: 0.03 },
      markscheme: [
        '$\\Delta\\theta = \\dfrac{\\omega_{\\text{i}} + \\omega_{\\text{f}}}{2}t$ (OR $\\omega_{\\text{i}}^2 = 2\\alpha\\Delta\\theta$) ✓',
        'number of revolutions $= \\dfrac{\\Delta\\theta}{2\\pi} = [[revs:3]]$; allow ECF from (a)(iii) ✓',
      ],
      examinerNote: 'Angular displacement in radians, divided by 2π.',
    },
    {
      label: 'b', command: 'Determine', marks: 3, syllabus: ['A.3.8', 'A.3.5', 'A.4.H11'], dependsOn: ['a(i)'],
      question: 'The flywheel is used to accelerate the tram, of mass [[mt]], from rest to [[vt]] on level track. During this time the flywheel slows from [[w1]] to [[w2]]. Determine the efficiency of this energy transfer.',
      numeric: { result: 'eff', accept: 0.05, mistakes: [{ result: 'wrong_eff', feedback: 'Use the energy the flywheel actually gave up (from the change in its rotation rate), not all the energy it stored.' }] },
      markscheme: [
        'energy given up by the flywheel $= \\tfrac{1}{2}I(\\omega_1^2 - \\omega_2^2) = [[dE:3u]]$ ✓',
        'kinetic energy gained by the tram $= \\tfrac{1}{2}mv^2 = [[Etram:3u]]$ ✓',
        '$\\eta = \\dfrac{[[Etram:3]]}{[[dE:3]]} = [[eff:2]]$; allow ECF from (a)(i) ✓',
      ],
      examinerNote: 'Efficiency = useful energy out / energy in. The flywheel does not stop, so only the change in its energy counts.',
    },
    {
      label: 'c(i)', command: 'Determine', marks: 2, syllabus: ['D.4.H1', 'D.4.H2', 'D.4.H5'],
      question: 'The flywheel turns a rectangular generator coil of [[N:n]] turns and area [[A]] in a uniform magnetic field of strength [[B]]. The coil turns at the same rate as the flywheel at full speed. Determine the average emf induced while the coil turns through a quarter of a revolution, starting from the position where the flux linkage is greatest.',
      numeric: { result: 'emf', accept: 0.03 },
      markscheme: [
        'change in flux linkage $= NBA$, in a time of a quarter of a period, $\\dfrac{1}{4f}$ with $f = [[f:2u]]$ ✓',
        '$\\varepsilon = \\dfrac{N\\Delta\\Phi}{\\Delta t} = 4NBAf = [[emf:3u]]$ ✓',
      ],
      examinerNote: 'Faraday\'s law for an average emf: the flux linkage falls from NBA to zero in a quarter turn. Sign ignored (magnitude).',
    },
    {
      label: 'c(ii)', command: 'Explain', marks: 2, syllabus: ['D.4.H5', 'D.4.H2'],
      question: 'Explain how the emf from the generator changes as the flywheel slows down.',
      markscheme: [
        'the flux linkage changes more slowly, so the peak (maximum) emf decreases ✓',
        'and its frequency decreases: each cycle of the emf takes longer ✓',
      ],
      examinerNote: 'Both the amplitude and the frequency of the sinusoidal emf fall with the rotation rate.',
    },
    {
      label: 'c(iii)', command: 'Explain', marks: 2, syllabus: ['D.4.H4'],
      question: 'Explain, with reference to Lenz\'s law, why the flywheel slows down more quickly when the generator supplies a current.',
      markscheme: [
        'the induced current opposes the change that produces it, so the forces on the coil produce a torque opposing the rotation ✓',
        'the electrical energy supplied comes from the kinetic energy of the flywheel (energy is conserved), so it loses energy faster ✓',
      ],
      examinerNote: 'Lenz\'s law as a consequence of energy conservation; with no current there is no opposing magnetic torque.',
    },
    {
      label: 'd(i)', command: 'Explain', marks: 2, syllabus: ['B.1.4', 'B.1.1'],
      question: 'Explain, in terms of the particles of the steel, why the bearings warm up as the flywheel slows down.',
      markscheme: [
        'work done against friction transfers energy to the bearings ✓',
        'increasing the random kinetic energy of the particles of the steel, so the internal energy and temperature increase ✓',
      ],
      examinerNote: 'Temperature is a measure of the average random kinetic energy of the particles.',
    },
    {
      label: 'd(ii)', command: 'Calculate', marks: 2, syllabus: ['B.1.6'], dependsOn: ['a(ii)'],
      question: 'The bearings and their steel housing have a total mass of [[mb]]. Steel has a specific heat capacity of [[cs]]. Calculate the rise in temperature of the bearings and housing when the flywheel runs down from full speed to rest, assuming no energy leaves them.',
      numeric: { result: 'dT', accept: 0.04 },
      markscheme: [
        '$Q = mc\\Delta T$ with $Q$ = the energy stored at full speed ✓',
        '$\\Delta T = [[dT:3u]]$; allow ECF from (a)(ii) ✓',
      ],
      examinerNote: 'All the rotational kinetic energy is dissipated in the bearings. In practice energy leaves by conduction and radiation, so the real rise is smaller.',
    },
  ],
};
