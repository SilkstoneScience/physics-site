// B1-P01: energy lost by conduction through a window, single pane and double-glazed (B.1 conduction and convection).
export default {
  id: 'B1-P01',
  title: 'Heat loss through a window: single pane and double glazing',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['B.1', 'B.2'],
  sections: ['transfer', 'convection', 'temperature'],
  batch: 'batch-3',
  situation: 'heat loss through a single-pane window replaced by a double-glazed unit',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the B.1 understandings (rate of conduction, conduction and convection mechanisms). The window, the surface temperatures (chosen so the drop across the glass is realistically small, with the still-air layers explained in the stem) and all numbers are our own; the topic page\'s own window example uses different values and parts.',
  },
  given: {
    Troom: { value: 20, sf: 2, unit: '°C', range: [15, 25], what: 'air temperature in the room' },
    Tout: { value: -8, sf: 1, unit: '°C', range: [-30, 10], what: 'outside air temperature' },
    A: { value: 1.8, sf: 2, unit: 'm^2', range: [0.3, 6], what: 'area of the pane' },
    d: { value: 4.0, sf: 2, unit: 'mm', range: [2, 10], what: 'thickness of the pane' },
    Ti: { value: 5.4, sf: 2, unit: '°C', range: [0, 15], what: 'temperature of the inside surface of the glass' },
    To: { value: 4.6, sf: 2, unit: '°C', range: [-2, 15], what: 'temperature of the outside surface of the glass' },
    k: { value: 1.0, sf: 2, unit: 'W m^-1 K^-1', range: [0.7, 1.2], what: 'thermal conductivity of glass' },
    t: { value: 1, sf: 1, unit: 'day', range: [0.5, 30], what: 'time for the energy estimate' },
    gap: { value: 12, sf: 2, unit: 'mm', range: [6, 20], what: 'width of the air gap in the double-glazed unit' },
    kair: { value: 0.025, sf: 2, unit: 'W m^-1 K^-1', range: [0.02, 0.03], what: 'thermal conductivity of air' },
  },
  calc: (v) => {
    const dT = v.Ti - v.To;
    const P = v.k * v.A * dT / v.d;
    return {
      dT: { value: dT, unit: 'K', sf: 1 },
      P: { value: P, unit: 'W', sf: 2, range: [50, 2000] },
      tsec: { value: v.t, unit: 's', sf: 3 },
      E: { value: P * v.t, unit: 'MJ', sf: 2, range: [5, 200] },
      kratio: { value: v.k / v.kair, unit: '', sf: 2 },
      wrong_P: { value: v.k * v.A * (v.Troom - v.Tout) / v.d, unit: 'W', sf: 2 }, // used the air temperatures
    };
  },
  stem: '<p>Heating buildings uses a large share of the energy supplied to homes in cold countries, and much of that energy escapes through the windows. On a cold day a room is heated to [[Troom]] while the air outside is at [[Tout]]. The window is a single pane of glass of area [[A]] and thickness [[d]]. Thin layers of almost still air cling to both faces of the glass, so the glass is much cooler than the room: its inside surface is at [[Ti]] and its outside surface is at [[To]]. The thermal conductivity of the glass is [[k]].</p>',
  diagram: { file: 'questions/diagrams/p2-b1-window.svg', alt: 'Two cross-sections, not to scale. Left: a single pane of glass with the warm room on one side and the cold outside air on the other. Right: a double-glazed unit of two panes of glass with an air gap between them, again with the room on one side and the outside on the other.' },
  parts: [
    {
      label: 'a', sections: ['transfer', 'temperature'], command: 'Calculate', marks: 2, syllabus: ['B.1.9', 'B.1.3'],
      question: 'Calculate the rate at which energy is conducted through the glass.',
      numeric: { result: 'P', accept: 0.03, mistakes: [{ result: 'wrong_P', feedback: 'The temperature difference in the conduction equation is across the glass itself: use the temperatures of its two surfaces, not the air temperatures.' }] },
      markscheme: [
        '$\\Delta T = [[Ti:n]] - [[To:n]] = [[dT:n]]$ K (a temperature difference is the same in °C and in K) ✓',
        '$\\dfrac{\\Delta Q}{\\Delta t} = \\dfrac{kA\\Delta T}{\\Delta x} = \\dfrac{[[k:n]] \\times [[A:n]] \\times [[dT:n]]}{[[d:n]] \\times 10^{-3}} = [[P:2u]]$ ✓',
        'Do not accept the air temperatures (giving [[wrong_P:2u]]).',
      ],
      examinerNote: 'The data-booklet equation with the temperature difference across the glass (0.8 K) and the thickness in metres. The minus sign only gives the direction. Using the 28 K air-temperature difference is the expected wrong answer.',
    },
    {
      label: 'b', sections: ['transfer'], command: 'Estimate', marks: 2, syllabus: ['B.1.9', 'T.5'], dependsOn: ['a'],
      question: 'The surface temperatures stay roughly the same throughout a winter day. Estimate, in MJ, the energy transferred through the pane in one day.',
      numeric: { result: 'E', accept: 0.05 },
      markscheme: [
        '$E = P\\Delta t$ with $\\Delta t = [[tsec:3u]]$ (one day) ✓',
        '$E = [[P:n]] \\times [[tsec:3]] = [[E:2u]]$ ✓',
        'Allow ECF from (a); accept [[E:lo]] to [[E:hi]] MJ, or the same value in J.',
      ],
      examinerNote: 'Energy = power × time, with one day in seconds. An estimate because the temperatures are taken as steady all day.',
    },
    {
      label: 'c', sections: ['transfer', 'convection'], command: 'Compare', marks: 2, syllabus: ['B.1.8', 'B.1.10'],
      question: 'To reduce the energy loss, the window is replaced by a double-glazed unit: two panes of the same glass separated by a gap of width [[gap]] filled with air. Compare the ways in which energy could be transferred across the air gap by conduction and by convection.',
      markscheme: [
        'conduction: energy is passed on through collisions between neighbouring molecules (faster molecules near the warmer pane transfer kinetic energy to slower ones) with no overall movement of the air ✓',
        'convection: the air itself moves, because air warmed by the inner pane expands, becomes less dense and rises while cooler, denser air sinks, so a circulating flow of air carries the energy across the gap ✓',
      ],
      examinerNote: 'One mark for each mechanism, each with its defining feature: conduction transfers particle kinetic energy without bulk flow; convection is bulk flow driven by density differences.',
    },
    {
      label: 'd', sections: ['transfer', 'convection'], command: 'Explain', marks: 3, syllabus: ['B.1.9', 'B.1.10', 'B.1.8'],
      question: 'The thermal conductivity of air is [[kair]]. Explain why the double-glazed unit loses energy much more slowly than the single pane, for the same room and outside temperatures.',
      markscheme: [
        'the thermal conductivity of air is about [[kratio:n]] times smaller than that of glass, so for the same temperature difference the rate of conduction through a layer of still air is far smaller than through glass ✓',
        'the gap is narrow, so the air cannot circulate freely and convection across the gap is largely suppressed / the air stays almost still, so energy must cross it mainly by (poor) conduction ✓',
        'most of the temperature difference between inside and outside is now across the air gap rather than across the glass, so the rate of energy transfer through the whole unit is much smaller ✓',
      ],
      examinerNote: 'Three separate ideas: air is a poor conductor; a narrow gap stops convection (which would otherwise bypass the air\'s low conductivity); the overall temperature gradient is therefore mostly across a poorly conducting layer, giving a small rate of transfer.',
    },
    {
      label: 'e', sections: ['transfer'], command: 'State', marks: 1, syllabus: ['B.2.8', 'B.2.5'],
      question: 'State one benefit to the environment of reducing the rate of energy loss from heated buildings.',
      markscheme: [
        'less fuel (or electricity generated from fuel) is needed for heating, so less carbon dioxide / greenhouse gas is released, reducing the enhanced greenhouse effect ✓',
        'Accept less fossil fuel burned, or a reduction in any named pollutant from heating.',
      ],
      examinerNote: 'Aim 9 (environmental impact). Any benefit that links lower energy use to lower emissions or less fuel burned.',
    },
  ],
};
