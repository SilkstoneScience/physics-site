// E4-P01: a small modular reactor supplying a town (fission equation, fissions per second and fuel use,
// moderator, control rods, advantages and problems; SL).
export default {
  id: 'E4-P01',
  title: 'Small modular reactor supplying a town',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['E.4', 'E.1'],
  sections: ['reactor', 'calc', 'fission', 'chain', 'debate', 'waste'],
  batch: 'batch-3',
  situation: 'small modular nuclear reactor powering a town',
  literals: { 86400: 'seconds in one day' },
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the E.4 syllabus (induced fission and the energy released, chain reactions, the roles of the moderator and control rods, and the management and impact of fission products), in the current context of small modular reactors and the guide\'s linking question on fission and climate change (aims 5, 6 and 9). The fission equation (xenon-140 and a nuclide the student identifies, with two neutrons) and all numbers are our own; the electrical output and efficiency are typical of a single module, and the fuel use works out at about a quarter of a kilogram of uranium-235 a day, consistent with the rule of thumb of about one gram per megawatt-day of thermal energy. The sequence of parts differs from the two existing E.4 questions, which calculate the energy of one reaction from masses and ask about spent fuel.',
  },
  given: {
    Pe: { value: 80, sf: 2, unit: 'MW', range: [10, 400], what: 'electrical power output of the reactor' },
    eff: { value: 33, sf: 2, unit: '%', range: [25, 45], what: 'overall efficiency (electrical output / thermal power from fission)' },
    Ef: { value: 200, sf: 3, unit: 'MeV', range: [170, 215], what: 'average energy released per fission' },
    AU: { value: 235, sf: 3, unit: '', range: [233, 239], what: 'nucleon number of the uranium isotope' },
    ZU: { value: 92, sf: 2, unit: '', range: [90, 94], what: 'proton number of uranium' },
    AX: { value: 140, sf: 3, unit: '', range: [130, 150], what: 'nucleon number of the xenon fission product' },
    ZX: { value: 54, sf: 2, unit: '', range: [50, 58], what: 'proton number of xenon' },
  },
  calc: (v, K) => {
    const Pth = v.Pe / v.eff;
    const rate = Pth / v.Ef;
    const mU = v.AU * K.u;
    return {
      Amiss: { value: 1 + v.AU - v.AX - 2, unit: '', sf: 2 },
      Zmiss: { value: v.ZU - v.ZX, unit: '', sf: 2 },
      Pth: { value: Pth, unit: 'MW', sf: 3, range: [100, 1000] },
      EfJ: { value: v.Ef, unit: 'J', sf: 3 },
      rate: { value: rate, unit: 's^-1', sf: 2 },
      mU: { value: mU, unit: 'kg', sf: 3 },
      mDay: { value: rate * mU, unit: 'kg day^-1', sf: 2, range: [0.05, 5] },
    };
  },
  stem: '<p>A small modular nuclear reactor is planned to supply electrical power to a town. It will deliver [[Pe]] of electrical power with an overall efficiency of [[eff]]. The fuel is enriched in uranium-[[AU:n]]. One of the many fission reactions that occur in the reactor is</p>$$^{1}_{0}\\text{n} + {}^{[[AU:n]]}_{[[ZU:n]]}\\text{U} \\rightarrow {}^{[[AX:n]]}_{[[ZX:n]]}\\text{Xe} + {}^{A}_{Z}\\text{X} + 2\\,{}^{1}_{0}\\text{n}$$<p>Each fission frees, on average, [[Ef]] of energy.</p>',
  parts: [
    {
      label: 'a', sections: ['fission'], command: 'Deduce', marks: 2, syllabus: ['E.4.1', 'E.1.2'],
      question: 'Deduce the nucleon number A and the proton number Z of the nuclide X.',
      markscheme: [
        'nucleon number conserved: $A = 1 + [[AU:n]] - [[AX:n]] - 2 = [[Amiss:n]]$ ✓',
        'proton number (charge) conserved: $Z = [[ZU:n]] - [[ZX:n]] = [[Zmiss:n]]$ ✓',
      ],
      examinerNote: 'Conservation of nucleon number and of charge in the reaction. The element (strontium) is not required: the guide says recall of chemical symbols is not needed.',
    },
    {
      label: 'b', sections: ['calc'], command: 'Estimate', marks: 3, syllabus: ['E.4.1', 'T.5'],
      question: 'Estimate the number of fissions per second in the reactor and hence the mass of uranium-[[AU:n]] that undergoes fission each day.',
      markscheme: [
        'thermal power from fission $= \\dfrac{[[Pe]]}{[[eff]]} = [[Pth:3u]]$ ✓',
        'fissions per second $= \\dfrac{[[Pth:3]] \\times 10^{6}}{[[EfJ:3]]} = [[rate:2u]]$ ✓',
        'mass per day $= [[rate:2]] \\times 86400 \\times [[AU:n]] \\times [[K.u]] = [[mDay:2u]]$ ✓',
        'Accept [[mDay:1]] kg from rounded intermediate values. Award [2 max] if the efficiency is not used (electrical power taken as the fission power).',
      ],
      examinerNote: 'Efficiency gives the fission (thermal) power; dividing by the energy per fission ([[EfJ]]) gives the rate; each fission uses one nucleus of mass [[AU:n]] u ≈ [[mU]]. Mass defect of the fuel (about 0.1 %) is ignored, as an estimate allows.',
    },
    {
      label: 'c', sections: ['reactor', 'chain'], command: 'Explain', marks: 2, syllabus: ['E.4.3', 'E.4.2'],
      question: 'Explain why the reactor needs a moderator.',
      markscheme: [
        'the neutrons released by fission are fast (have high kinetic energy), and uranium-[[AU:n]] is much more likely to undergo fission when it absorbs a slow (thermal) neutron ✓',
        'the moderator slows the neutrons, through repeated collisions with its (light) nuclei, so that enough neutrons cause further fissions and the chain reaction is sustained ✓',
      ],
      examinerNote: 'Fission neutrons are fast; the fission probability of U-235 is far greater for thermal neutrons; the moderator (water, graphite) slows them by collisions so the chain reaction continues. "To slow the neutrons" alone earns the second mark only with the reason in the first.',
    },
    {
      label: 'd', sections: ['reactor'], command: 'Outline', marks: 1, syllabus: ['E.4.3'],
      question: 'Outline how the control rods are used to keep the power output of the reactor steady.',
      markscheme: [
        'the rods absorb neutrons, so they are moved further into the core to reduce the number of neutrons available for fission (and withdrawn to increase it) until, on average, one neutron from each fission goes on to cause another ✓',
      ],
      examinerNote: 'Control rods (boron, cadmium) absorb neutrons; their position sets the number of neutrons that cause further fission, so the chain reaction is kept at a steady rate.',
    },
    {
      label: 'e', sections: ['debate', 'waste'], command: 'Discuss', marks: 2, syllabus: ['E.4.4'],
      question: 'Discuss one advantage and one problem of supplying the town from this reactor rather than by burning fossil fuels.',
      markscheme: [
        'advantage: no carbon dioxide (greenhouse gas) is released while generating OR only a very small mass of fuel is needed (high energy density, as in (b)) OR a steady supply that does not depend on the weather ✓',
        'problem: the fission products are highly radioactive and some stay hazardous for thousands of years, so the waste must be stored securely for a very long time OR the risk of an accident releasing radioactive material OR security / proliferation concerns, public acceptance or high cost ✓',
      ],
      examinerNote: 'Aims 8 and 9 and the guide\'s linking question on fission and climate change. One clearly stated advantage and one clearly stated problem, each linked to the physics (no combustion, so no CO2; radioactive fission products with long half-lives).',
    },
  ],
};
