// B2-P01: Venus: equilibrium temperature from radiative balance, and the greenhouse effect of its atmosphere.
export default {
  id: 'B2-P01',
  title: 'Venus: equilibrium temperature and a runaway greenhouse effect',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['B.2', 'B.1'],
  sections: ['equilibrium', 'greenhouse', 'albedo', 'models', 'enhanced', 'modelling', 'emissivity', 'solar'],
  batch: 'batch-3',
  situation: 'Venus equilibrium temperature and its carbon dioxide greenhouse effect',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the B.2 understandings (albedo, energy balance, infrared absorption by greenhouse gases, the enhanced greenhouse effect). Venus\'s data are the published values (intensity at its orbit, albedo, surface temperature) rounded by us; the parts (albedo, a show-that balance, the mechanism, a T^4 ratio and a discussion of what Venus tells us about Earth) are our own and differ from the Earth-based hand-written questions.',
  },
  given: {
    Iv: { value: 2600, sf: 3, unit: 'W m^-2', range: [2400, 2800], what: 'intensity of solar radiation at the orbit of Venus' },
    alpha: { value: 0.76, sf: 2, unit: '', range: [0.6, 0.9], what: 'albedo of Venus' },
    Tv: { value: 735, sf: 3, unit: 'K', range: [700, 760], what: 'mean surface temperature of Venus' },
    pratio: { value: 90, sf: 1, unit: '', range: [85, 95], what: 'surface pressure on Venus as a multiple of Earth\'s' },
    TEeq: { value: 255, sf: 3, unit: 'K', range: [250, 260], what: 'equilibrium temperature of Earth with no atmosphere' },
    TE: { value: 288, sf: 3, unit: 'K', range: [285, 290], what: 'mean surface temperature of Earth' },
  },
  calc: (v, K, h) => {
    const Iabs = v.Iv * (1 - v.alpha) / 4;
    const Teq = Math.pow(Iabs / K.sigma, 1 / 4);
    return {
      Iabs: { value: Iabs, unit: 'W m^-2', sf: 3 },
      Teq: { value: Teq, unit: 'K', sf: 3, range: [200, 260] },
      ratio: { value: Math.pow(v.Tv / Teq, 4), unit: '', sf: 3, range: [80, 130] },
      ratio2: { value: Math.pow(v.Tv / h.sf(Teq, 2), 4), unit: '', sf: 3, noDimensionCheck: true }, // using the rounded 230 K (rounding is not scale-invariant)
      dTv: { value: v.Tv - Teq, unit: 'K', sf: 2 },
      dTE: { value: v.TE - v.TEeq, unit: 'K', sf: 2 },
    };
  },
  stem: '<p>Venus orbits closer to the Sun than Earth does. At the orbit of Venus, sunlight delivers [[Iv]] to a surface facing the Sun, and the thick clouds of Venus give it an albedo of [[alpha:n]]. Spacecraft have measured the temperature of the surface of Venus to be [[Tv]]. The atmosphere of Venus is almost entirely carbon dioxide, and the pressure at its surface is about [[pratio:n]] times the pressure at the surface of Earth.</p><p>For comparison, Earth would have an equilibrium temperature of about [[TEeq]] if it had no atmosphere; its actual surface temperature is [[TE]].</p>',
  parts: [
    {
      label: 'a', sections: ['albedo'], command: 'State', marks: 1, syllabus: ['B.2.3'],
      question: 'State what is meant by the albedo of a planet.',
      markscheme: [
        'the ratio of the total power scattered (reflected) by the planet to the total power incident on it ✓',
        'Accept "the fraction of the incoming radiation that is reflected back into space".',
      ],
      examinerNote: 'The data-booklet definition: scattered power over incident power. "Reflectivity" alone is not enough.',
    },
    {
      label: 'b', sections: ['equilibrium', 'solar'], command: 'Show that', marks: 2, syllabus: ['B.2.9', 'B.2.4'],
      question: 'Venus is modelled as a black body with no atmosphere. Show that its equilibrium temperature would then be about [[Teq:2u]].',
      showThat: { result: 'Teq', sf: 2 },
      markscheme: [
        'mean absorbed intensity $= \\dfrac{I(1 - \\alpha)}{4} = \\dfrac{[[Iv:n]] \\times (1 - [[alpha:n]])}{4} = [[Iabs:3u]]$ ✓',
        '$\\sigma T^4 = [[Iabs:3]]$ so $T = \\left(\\dfrac{[[Iabs:3]]}{[[K.sigma]]}\\right)^{1/4} = [[Teq:3u]]$ ✓',
      ],
      examinerNote: 'Energy balance: the planet intercepts I × πR² but radiates from 4πR², so the mean absorbed intensity is I(1 − α)/4, which equals σT⁴ for a black body. Both the factor 4 and the albedo are needed for the first mark.',
    },
    {
      label: 'c', sections: ['greenhouse', 'models'], command: 'Explain', marks: 3, syllabus: ['B.2.6', 'B.2.7'],
      question: 'Explain why the surface temperature of Venus is so much higher than the temperature in (b).',
      markscheme: [
        'the surface of Venus radiates mainly infrared radiation, and carbon dioxide molecules absorb infrared photons whose energies match the differences between their (vibrational) molecular energy levels / resonate at those frequencies ✓',
        'the molecules then re-emit this radiation in all directions, so a large part of it returns to the surface ✓',
        'the surface receives energy from the atmosphere as well as from the Sun, so it must be at a higher temperature to radiate enough power to balance what it absorbs ✓',
      ],
      examinerNote: 'The mechanism in the guide\'s terms (molecular energy levels or the resonance model), re-emission in all directions, and the consequence for the energy balance. "The atmosphere traps heat" alone earns nothing.',
    },
    {
      label: 'd', sections: ['emissivity', 'equilibrium'], command: 'Deduce', marks: 2, syllabus: ['B.2.2', 'B.1.11'], dependsOn: ['b'],
      question: 'The surface of Venus has an emissivity of 1. Deduce the ratio of the energy emitted each second by one square metre of the surface at [[Tv]] to the energy that the same square metre would emit each second at the temperature in (b).',
      numeric: { result: 'ratio', accept: 0.04 },
      markscheme: [
        'energy emitted per second per unit area $= \\sigma T^4$, so ratio $= \\left(\\dfrac{[[Tv:n]]}{[[Teq:3]]}\\right)^4$ ✓',
        'ratio $= [[ratio:3]]$ ✓',
        'Allow ECF from (b); accept [[ratio:lo]] to [[ratio:hi]] (using [[Teq:2u]] gives [[ratio2:3]]).',
      ],
      examinerNote: 'Emissivity 1 means power per unit area = σT⁴; σ cancels in the ratio. The surface radiates about a hundred times more than the sunlight it absorbs, which the atmosphere\'s back-radiation supplies.',
    },
    {
      label: 'e', sections: ['enhanced', 'modelling'], command: 'Discuss', marks: 2, syllabus: ['B.2.8', 'B.2.5'],
      question: 'Discuss what the measurements of Venus suggest about the enhanced greenhouse effect on Earth.',
      markscheme: [
        'Venus shows that a carbon dioxide atmosphere can raise a planet\'s surface far above its equilibrium temperature (by about [[dTv:n]] K, compared with about [[dTE:n]] K on Earth), so adding carbon dioxide to Earth\'s atmosphere by burning fossil fuels should be expected to raise Earth\'s surface temperature ✓',
        'OR the measurements are evidence that the energy-balance model of the greenhouse effect is correct, because it accounts for a planet other than Earth',
        'but the atmosphere of Venus is far denser and almost entirely carbon dioxide, so the comparison cannot say how much Earth warms for a given increase in carbon dioxide / Earth will not become like Venus because of human emissions alone ✓',
      ],
      examinerNote: 'A balanced answer: one mark for what Venus supports (the greenhouse model, or that more CO₂ means a warmer Earth), one for a limitation of the comparison (the very different amount of CO₂, so it is not a prediction for Earth).',
    },
  ],
};
