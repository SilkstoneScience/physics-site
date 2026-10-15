// LQ-S02: a radioisotope power source on a deep-space probe (decay, heating, circuits, gravitational field).
export default {
  id: 'LQ-S02',
  title: 'Radioisotope power source on a deep-space probe',
  type: 'linking',
  level: 'SL',
  difficulty: 2,
  topics: ['E.3', 'B.1', 'B.5', 'D.1', 'A.3', 'A.2', 'E.1'],
  batch: 'batch-1',
  batchRule: 'inspect-all',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank. Plutonium-238 power sources are used on deep-space probes; the probe, the chain of parts (decay → thermal power → radiation → electrical output → orbit) and all numbers are our own. Half-lives are whole numbers, as SL requires.',
  },
  literals: {
    238: 'nucleon number of plutonium-238 (nuclear notation)', 94: 'proton number of plutonium', 234: 'nucleon number of the daughter uranium-234', 92: 'proton number of uranium',
  },
  given: {
    A0: { value: 2.7e15, sf: 2, unit: 'Bq', range: [1e14, 1e16], what: 'activity of the source at launch' },
    Ea: { value: 5.6, sf: 2, unit: 'MeV', range: [4, 9], what: 'energy released per decay' },
    Thalf: { value: 88, sf: 2, unit: 'y', range: [80, 90], what: 'half-life of plutonium-238' },
    t3: { value: 264, sf: 3, unit: 'y', range: [100, 400], what: 'time after launch (three half-lives)' },
    mc: { value: 12, sf: 2, unit: 'kg', range: [5, 50], what: 'mass of the aluminium casing' },
    c: { value: 900, sf: 2, unit: 'J kg^-1 K^-1', range: [850, 950], what: 'specific heat capacity of aluminium' },
    Prad: { value: 2.3, sf: 2, unit: 'kW', range: [1, 3], what: 'power radiated by the fins in space' },
    Af: { value: 1.2, sf: 2, unit: 'm^2', range: [0.3, 5], what: 'surface area of the radiator fins' },
    Pe: { value: 110, sf: 2, unit: 'W', range: [50, 300], what: 'electrical power output' },
    Ve: { value: 28, sf: 2, unit: 'V', range: [12, 48], what: 'output potential difference' },
    Rc: { value: 0.15, sf: 2, unit: 'Ω', range: [0.01, 1], what: 'resistance of the cables' },
    Ms: { value: 5.68e26, sf: 3, unit: 'kg', range: [5.6e26, 5.7e26], what: 'mass of Saturn' },
    rs: { value: 1.2e9, sf: 2, unit: 'm', range: [1e8, 1e10], what: 'radius of the probe\'s orbit around Saturn' },
  },
  calc: (v, K) => {
    const P0 = v.A0 * v.Ea;
    const halves = v.t3 / v.Thalf;
    const I = v.Pe / v.Ve;
    return {
      P0: { value: P0, unit: 'kW', sf: 3, range: [1, 5] },
      halves: { value: halves, unit: '', sf: 2 },
      P3: { value: P0 / 2 ** halves, unit: 'W', sf: 3 },
      rate: { value: P0 / (v.mc * v.c), unit: 'K s^-1', sf: 3 },
      Tf: { value: (v.Prad / (K.sigma * v.Af)) ** (1 / 4), unit: 'K', sf: 3, range: [250, 700] },
      I: { value: I, unit: 'A', sf: 3 },
      eff: { value: v.Pe / P0, unit: '%', sf: 2 },
      Pc: { value: I ** 2 * v.Rc, unit: 'W', sf: 3 },
      g: { value: K.G * v.Ms / v.rs ** 2, unit: 'N kg^-1', sf: 3 },
      wrong_P3: { value: P0 / (2 * halves), unit: 'W', sf: 3 }, // divided by 2 × 3 instead of 2³
      wrong_Tf: { value: (v.Prad / (K.sigma * v.Af)) ** (1 / 2), unit: 'K', sf: 3 }, // square root, not fourth root
    };
  },
  stem: '<p>A deep-space probe is powered by a radioisotope source containing plutonium-238. Plutonium-238 decays by alpha emission with a half-life of [[Thalf:n]] years. The thermal energy released in the source is partly converted to electrical energy; the rest is radiated into space.</p>',
  parts: [
    {
      label: 'a(i)', command: 'Write down', marks: 2, syllabus: ['E.3.7', 'E.1.2'],
      question: 'Plutonium-238 ($^{238}_{94}\\text{Pu}$) decays to an isotope of uranium (U). Write down the equation for this decay.',
      markscheme: [
        '$^{238}_{94}\\text{Pu} \\rightarrow {}^{234}_{92}\\text{U} + {}^{4}_{2}\\alpha$: alpha particle (or $^{4}_{2}\\text{He}$) correct ✓',
        'nucleon number 234 and proton number 92 for uranium ✓',
      ],
      examinerNote: 'An alpha particle carries away 2 protons and 2 neutrons. Both sides must balance.',
    },
    {
      label: 'a(ii)', command: 'Show that', marks: 2, syllabus: ['E.3.10', 'E.3.4'],
      question: 'At launch the activity of the source is [[A0]] and each decay releases [[Ea]]. Show that the thermal power produced by the source at launch is about [[P0:2u]].',
      showThat: { result: 'P0', sf: 2 },
      markscheme: [
        'energy per decay $= [[Ea:n]] \\times 10^{6} \\times [[K.eV]]$ J ✓',
        '$P = [[A0:n]] \\times [[Ea:n]] \\times 10^{6} \\times [[K.eV]] = [[P0:3u]]$ ✓',
      ],
      examinerNote: 'Power = decays per second × energy per decay, with 1 MeV = 1.60 × 10⁻¹³ J.',
    },
    {
      label: 'a(iii)', command: 'Determine', marks: 2, syllabus: ['E.3.10'], dependsOn: ['a(ii)'],
      question: 'Determine the thermal power produced by the source [[t3:n]] years after launch.',
      numeric: { result: 'P3', accept: 0.03, mistakes: [{ result: 'wrong_P3', feedback: 'Three half-lives halve the power three times: divide by 2 × 2 × 2 = 8, not by 6.' }] },
      markscheme: [
        '$\\dfrac{[[t3:n]]}{[[Thalf:n]]} = [[halves:1]]$ half-lives, so the power falls by a factor of $2^{3} = 8$ ✓',
        '$P = [[P3:3u]]$ ✓',
        'Allow ECF from (a)(ii); accept [[P3:lo]] to [[P3:hi]] W',
      ],
      examinerNote: 'Whole numbers of half-lives only (SL). The power is proportional to the activity.',
    },
    {
      label: 'a(iv)', command: 'Outline', marks: 2, syllabus: ['E.3.9'],
      question: 'Outline why an alpha emitter is a good choice for this power source.',
      markscheme: [
        'alpha particles are strongly ionising / have a very short range, so they are absorbed within the source itself ✓',
        'so (almost) all their energy becomes thermal energy in the source, and little shielding is needed to protect the instruments ✓',
      ],
      examinerNote: 'Short range means the energy stays in the source as heat, and the radiation does not escape to damage electronics.',
    },
    {
      label: 'b(i)', command: 'Calculate', marks: 2, syllabus: ['B.1.6'], dependsOn: ['a(ii)'],
      question: 'Before launch, the source sits inside an aluminium casing of mass [[mc]]. The specific heat capacity of aluminium is [[c]]. If its cooling system failed, how quickly would the temperature of the casing start to rise? Calculate this rate. Assume all the thermal power goes into the casing.',
      numeric: { result: 'rate', accept: 0.04 },
      markscheme: [
        '$P = mc\\dfrac{\\Delta T}{\\Delta t}$ ✓',
        '$\\dfrac{\\Delta T}{\\Delta t} = [[rate:3u]]$ ✓',
        'Allow ECF from (a)(ii); accept [[rate:lo]] to [[rate:hi]] $\\text{K s}^{-1}$',
      ],
      examinerNote: 'Q = mcΔT per second. Using 2.4 kW gives a value about 1 % lower, inside the range.',
    },
    {
      label: 'b(ii)', command: 'Determine', marks: 2, syllabus: ['B.1.11'],
      question: 'In space, the radiator fins have a total surface area of [[Af]] and radiate [[Prad]]. Determine the temperature of the fins. Assume they behave as a black body.',
      numeric: { result: 'Tf', accept: 0.03, mistakes: [{ result: 'wrong_Tf', feedback: 'The power radiated depends on T⁴: take the fourth root, not the square root.' }] },
      markscheme: [
        '$P = \\sigma A T^4$ so $T^4 = \\dfrac{[[Prad:n]] \\times 10^{3}}{[[K.sigma]] \\times [[Af:n]]}$ ✓',
        '$T = [[Tf:3u]]$ ✓',
      ],
      examinerNote: 'Stefan–Boltzmann law for a black body; in a vacuum, radiation is the only way the fins lose energy.',
    },
    {
      label: 'c(i)', command: 'Calculate', marks: 1, syllabus: ['B.5.9'],
      question: 'The electrical power output is [[Pe]] at a potential difference of [[Ve]]. Calculate the output current.',
      numeric: { result: 'I', accept: 0.03 },
      markscheme: ['$I = \\dfrac{P}{V} = [[I:3u]]$ ✓'],
      examinerNote: 'Electrical power P = IV, rearranged for the current.',
    },
    {
      label: 'c(ii)', command: 'Calculate', marks: 1, syllabus: ['A.3.8'], dependsOn: ['a(ii)'],
      question: 'Calculate, as a percentage, the efficiency of the conversion of thermal power to electrical power at launch.',
      numeric: { result: 'eff', accept: 0.04 },
      markscheme: ['$\\eta = \\dfrac{[[Pe:n]]}{[[P0:3]] \\times 10^{3}} = [[eff:2u]]$; allow ECF from (a)(ii) ✓'],
      examinerNote: 'Useful power out over total power in. 110/2400 gives 4.6 %, also accepted.',
    },
    {
      label: 'c(iii)', command: 'Calculate', marks: 2, syllabus: ['B.5.9'], dependsOn: ['c(i)'],
      question: 'The cables connecting the source to the instruments have a total resistance of [[Rc]]. Calculate the power dissipated in the cables.',
      numeric: { result: 'Pc', accept: 0.04 },
      markscheme: [
        '$P = I^2R$ ✓',
        '$P = [[I:3]]^2 \\times [[Rc:n]] = [[Pc:3u]]$; allow ECF from (c)(i) ✓',
      ],
      examinerNote: 'The cables carry the full output current.',
    },
    {
      label: 'd(i)', command: 'Calculate', marks: 2, syllabus: ['D.1.3'],
      question: 'The probe later orbits Saturn in a circular orbit of radius [[rs]]. The mass of Saturn is [[Ms]]. Calculate the gravitational field strength due to Saturn at the probe.',
      numeric: { result: 'g', accept: 0.03 },
      markscheme: [
        '$g = \\dfrac{GM}{r^2}$ ✓',
        '$g = \\dfrac{[[K.G]] \\times [[Ms:n]]}{([[rs:n]])^2} = [[g:3u]]$ ✓',
      ],
      examinerNote: 'Saturn treated as a point mass at its centre.',
    },
    {
      label: 'd(ii)', command: 'Explain', marks: 2, syllabus: ['D.1.3', 'A.2.1'],
      question: 'Explain why a loose object inside the orbiting probe floats, even though there is a gravitational field at the probe.',
      markscheme: [
        'the probe and the object are both in free fall, accelerating towards Saturn with the same acceleration $g$ ✓',
        'so there is no contact (normal) force between them: the object does not press on the probe, and floats relative to it ✓',
      ],
      examinerNote: 'Gravity provides the centripetal acceleration of both; "weightlessness" is the absence of a supporting force, not the absence of gravity.',
    },
  ],
};
