// A3-P01: an energy-storage scheme with two reservoirs (gravitational potential energy, power, efficiency, conservation of energy).
// The excluded "how power stations work" terms are avoided: the question is about stored energy, power and efficiency only.
export default {
  id: 'A3-P01',
  title: 'Storing energy in a mountain reservoir',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['A.3', 'B.1'],
  sections: ['potential', 'power', 'efficiency', 'conservation', 'mechanical'],
  batch: 'batch-3',
  situation: 'energy storage scheme pumping water between two mountain reservoirs',
  literals: { 3600: 'seconds in an hour' },
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the A.3 syllabus (ΔEp = mgΔh, P = ΔW/Δt, efficiency, conservation of energy, work done against non-conservative forces) with a societal angle (aims 5 and 9: storing energy from weather-dependent sources). The scheme, its two stages, the numbers and the parts are our own. Nothing about how pumps, turbines or generators work is needed: only energy, power and efficiency.',
  },
  given: {
    V: { value: 1.2e6, sf: 2, unit: 'm^3', range: [1e5, 1e8], what: 'volume of water the upper reservoir holds' },
    rho: { value: 1000, sf: 2, unit: 'kg m^-3', range: [990, 1030], what: 'density of water' },
    h: { value: 320, sf: 2, unit: 'm', range: [50, 800], what: 'average height of the upper reservoir\'s water above the turbines' },
    Pp: { value: 240, sf: 2, unit: 'MW', range: [10, 3000], what: 'electrical input power of the pumps' },
    tp: { value: 5.5, sf: 2, unit: 'h', range: [1, 24], what: 'time to pump the full volume up' },
    Pg: { value: 190, sf: 2, unit: 'MW', range: [10, 3000], what: 'average electrical output power while generating' },
    tg: { value: 5.0, sf: 2, unit: 'h', range: [1, 24], what: 'time to empty the upper reservoir through the turbines' },
  },
  calc: (v, K) => {
    const mass = v.rho * v.V;
    const E = mass * K.g * v.h;
    const Ein = v.Pp * v.tp;
    const Eout = v.Pg * v.tg;
    return {
      mass: { value: mass, unit: 'kg', sf: 2 },
      E: { value: E, unit: 'J', sf: 2, range: [1e10, 1e15] },
      Pgpe: { value: E / v.tg, unit: 'MW', sf: 3, range: [10, 5000] },
      Ein: { value: Ein, unit: 'J', sf: 3 },
      Eout: { value: Eout, unit: 'J', sf: 3 },
      eff: { value: Eout / Ein, unit: '%', sf: 2, range: [40, 95] },
      perkg: { value: K.g * v.h, unit: 'J kg^-1', sf: 2 },
      wrong_eff: { value: Eout / E, unit: '%', sf: 2 }, // generating stage only
      wrong_eff2: { value: E / Ein, unit: '%', sf: 2 }, // pumping stage only
      wrong_P: { value: E / v.tg * 3600, unit: 'MW', sf: 3 }, // hours not converted to seconds
    };
  },
  calcLiterals: { 3600: 'seconds in an hour, for the common wrong answer that forgets the conversion' },
  stem: '<p>An energy-storage scheme in a mountain valley links two reservoirs. At night, when the demand for electrical energy is low, pumps raise water from the lower reservoir to the upper one. During the day the water flows back down through turbines, which drive generators. The upper reservoir holds [[V]] of water of density [[rho]], and the surface of this water is on average [[h]] above the turbines. Pumping the full volume up takes [[tp]] with an electrical input power of [[Pp]]. Emptying the upper reservoir through the turbines takes [[tg]] and gives an average electrical output power of [[Pg]].</p>',
  diagram: { file: 'questions/diagrams/p2-a3-reservoirs.svg', alt: 'A mountain valley with an upper reservoir high on the left and a lower reservoir at the bottom right. A pipe runs from the upper reservoir down to a building housing the pumps and turbines next to the lower reservoir. The average height h of the upper water above the turbines is marked. Arrows show water pumped up at night and flowing down by day. Not to scale.' },
  parts: [
    {
      label: 'a', sections: ['potential'], command: 'Show that', marks: 2, syllabus: ['A.3.5', 'B.1.2'],
      question: 'Show that the gravitational potential energy stored when the upper reservoir is full is about [[E:2u]].',
      showThat: { result: 'E', sf: 2 },
      markscheme: [
        'mass of water $= \\rho V = [[rho:n]] \\times [[V:n]] = [[mass:2u]]$ ✓',
        '$\\Delta E_p = mg\\Delta h = [[mass:2]] \\times [[K.g]] \\times [[h:n]] = [[E:3u]]$ ✓',
      ],
      examinerNote: 'm = ρV, then ΔEp = mgΔh with the average height. The unrounded value (3.76 × 10¹² J) must be seen.',
    },
    {
      label: 'b', sections: ['power'], command: 'Calculate', marks: 2, syllabus: ['A.3.7'], dependsOn: ['a'],
      question: 'Calculate the average rate at which the water loses gravitational potential energy while the upper reservoir empties through the turbines.',
      numeric: { result: 'Pgpe', accept: 0.03, mistakes: [{ result: 'wrong_P', feedback: 'Power is energy per second: convert the time from hours to seconds.' }] },
      markscheme: [
        '$P = \\dfrac{\\Delta E_p}{\\Delta t} = \\dfrac{[[E:3]]}{[[tg:n]] \\times 3600}$ ✓',
        '$P = [[Pgpe:3u]]$ ✓',
        'Allow ECF from (a); accept [[Pgpe:lo]] to [[Pgpe:hi]] MW (the rounded value [[E:2u]] from (a) gives an answer about 1 % larger, inside this range)',
      ],
      examinerNote: 'P = ΔW/Δt with the hours converted to seconds. The electrical output (190 MW) is less than this because the generating stage is not 100 % efficient.',
    },
    {
      label: 'c', sections: ['efficiency', 'conservation'], command: 'Determine', marks: 3, syllabus: ['A.3.8', 'A.3.1'],
      question: 'Determine the overall efficiency of the scheme, defined as the electrical energy delivered by the generators as a percentage of the electrical energy used by the pumps.',
      numeric: { result: 'eff', accept: 0.02, mistakes: [
        { result: 'wrong_eff', feedback: 'That compares the output with the energy stored in the water: it is the efficiency of the generating stage only. The question asks for electrical energy out over electrical energy in.' },
        { result: 'wrong_eff2', feedback: 'That is the efficiency of the pumping stage only (energy stored over electrical energy in). Compare the electrical energy out with the electrical energy in.' },
      ] },
      markscheme: [
        'electrical energy in $= [[Pp:n]] \\times 10^{6} \\times [[tp:n]] \\times 3600 = [[Ein:3u]]$ ✓',
        'electrical energy out $= [[Pg:n]] \\times 10^{6} \\times [[tg:n]] \\times 3600 = [[Eout:3u]]$ ✓',
        'efficiency $= \\dfrac{[[Eout:3]]}{[[Ein:3]]} = [[eff:2u]]$ ✓',
        'Accept [[eff:lo]] to [[eff:hi]] %. Award [2 max] for [[wrong_eff:2]] % (generating stage only) or [[wrong_eff2:2]] % (pumping stage only)',
      ],
      examinerNote: 'Useful energy out over total energy in, both electrical. Equivalent routes: the pumping stage stores 79 % of the energy supplied and the generating stage returns 91 % of what is stored; the product is 72 %.',
    },
    {
      label: 'd', sections: ['mechanical', 'conservation'], command: 'Outline', marks: 2, syllabus: ['A.3.6', 'A.3.1'],
      question: 'Outline what happens to the energy that is not returned to the electrical supply.',
      anyOf: 2,
      markscheme: [
        'work is done against friction and viscous forces as the water flows through the pipes, pumps and turbines (turbulence), so energy is transferred to the internal energy of the water and the pipes ✓',
        'friction in the moving parts of the pumps, turbines and generators and the heating effect of the current in the windings and cables transfer energy to the surroundings as thermal energy ✓',
        'the water leaving the turbines still has kinetic energy, which is not transferred to the generators ✓',
        'Any 2 from the points above',
      ],
      examinerNote: 'Energy is conserved: the missing 28 % is transferred by non-conservative forces (friction, viscous forces) and electrical heating to internal energy and dissipated to the surroundings. Accept "sound" as a minor route. Two distinct routes are needed for both marks.',
    },
    {
      label: 'e', sections: ['conservation', 'efficiency'], command: 'Suggest', marks: 2, syllabus: ['A.3.1', 'A.3.8'],
      question: 'The electrical energy in the region is generated mainly by wind and solar sources. Suggest why the storage scheme is valuable alongside these sources.',
      markscheme: [
        'the output of wind and solar sources depends on the weather and the time of day, so it cannot be adjusted to match the demand ✓',
        'surplus electrical energy at times of high supply or low demand is stored as gravitational potential energy and most of it is returned quickly when demand exceeds supply, reducing the need for other generators and the wasting of the surplus ✓',
      ],
      examinerNote: 'Aims 5 and 9: a stored-energy buffer makes variable sources usable. Credit any clear link between variable supply, storage as potential energy and release on demand; the efficiency found in (c) shows that most of the stored energy is recovered.',
    },
  ],
};
