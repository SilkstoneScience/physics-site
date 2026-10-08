// B.2 Energy balance of the inner planets and the Moon: a no-atmosphere model against published mean temperatures
// (archetypes V1 and D1).
// Skills: the energy-balance (equilibrium) temperature from a given relationship, plotting a point, comparing data with a model line
// (observed = model), the greenhouse effect, reading a departure from a graph, evaluating whether data are a fair test of a model.
import { LAWS } from '../laws.mjs';

const MARS = 4;
const EARTH = 2;
const SIGMA = 5.67e-8;
const tModel = (alpha, S) => LAWS['energy-balance-temperature'].f({ alpha, S, sigma: SIGMA });

export default {
  id: 'B2-B01',
  topic: 'B.2',
  difficulty: 2,
  context: 'unfamiliar',
  source: 'secondary',
  skills: ['equilibrium-temperature', 'plot-a-point', 'model-versus-data', 'greenhouse-effect', 'value-from-a-graph', 'evaluate-data'],
  seed: 201,
  batch: 'batch-2',
  archetypes: ['V1', 'D1'],
  apparatus: 'published planetary data (NASA fact sheets) for Mercury, Venus, Earth, the Moon and Mars',
  contextFamily: 'radiation-energy-balance',
  contextObjects: ['database'],
  rowLabels: { heading: 'body', values: ['Mercury', 'Venus', 'Earth', 'Moon', 'Mars'] },
  provenance: {
    source: 'NASA Space Science Data Coordinated Archive (NSSDCA): Planetary Fact Sheet (metric, last updated 18 March 2025) and the Mercury, '
      + 'Venus, Earth, Moon and Mars Fact Sheets (last updated 11 January 2024), by D. R. Williams',
    url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/',
    retrieved: '2026-10-08',
    taken: 'Solar irradiance (W/m2) and Bond albedo from each body\'s own fact sheet; mean temperature (C) from the Planetary Fact Sheet. '
      + 'The Moon fact sheet\'s equatorial diurnal temperature range (95 K to 390 K) is quoted in part (e).',
    transformations: 'Mean temperatures converted from degrees Celsius to kelvin by adding 273 (the fact sheets\' own conversion, e.g. 440 K (167 C)); albedos shown to 3 decimal places in one column (Venus 0.77 as 0.770, Mars 0.250, Moon 0.11 as 0.110). '
      + 'The model temperatures are calculated here. The selection of bodies, the table, the graph and all questions are new.',
    fields: {
      S: { sourceColumn: 'Solar irradiance (W/m2)', definition: 'solar power per square metre arriving at the body\'s mean distance from the Sun' },
      alpha: { sourceColumn: 'Bond albedo', definition: 'Bond albedo: the fraction of the incident solar power that the body reflects' },
      Tobs: { sourceColumn: 'Mean Temperature (C)', definition: 'mean surface temperature, published in degrees Celsius (converted to kelvin here)', offset: 273 },
    },
    extract: {
      file: 'p1b-sources/B2-B01-nssdca-planets.json',
      sha256: 'b08997bee655dfddca60d026827d541500127ebc0802ff094319d2b6b9d3f382',
      rows: ['Mercury', 'Venus', 'Earth', 'Moon', 'Mars'],
    },
  },
  originality: 'The closest cached IB item is May 2025 Paper 2 TZ1 (Venus\'s orbit only). Energy-balance estimates are in the B.2 guide, but '
    + 'no cached paper compares a no-atmosphere model with published temperatures of several bodies on an observed-against-model graph. '
    + 'Own selection of bodies, graph and sequence; the data are public NASA values, credited.',

  physics: {
    scenario: 'For each body, the energy absorbed from sunlight is compared with the energy it radiates. The model ignores any atmosphere: '
      + 'it predicts the temperature at which a body that absorbs (1 − α) of the sunlight and radiates as a black body from its whole surface is in balance. '
      + 'The predictions are compared with published mean surface temperatures.',
    principles: [
      'Energy balance: absorbed power = emitted power for a body at a steady temperature (B.2)',
      'Absorbed: (1 − α)S × πR² (the body\'s cross-section); emitted: σT⁴ × 4πR² (Stefan–Boltzmann law, black body, B.1)',
      'So T = [(1 − α)S/(4σ)]^¼ (the S/4 factor of B.2)',
      'Greenhouse gases absorb and re-emit outgoing infrared radiation, so a surface under an atmosphere is warmer than this model (B.2)',
    ],
    assumptions: [
      'Each body radiates as a black body (emissivity 1) at one uniform temperature over its whole surface',
      'No atmosphere (no greenhouse effect) and no internal heating',
      'The published irradiance is the mean at the body\'s mean distance from the Sun',
    ],
    derivation: ['(1 − α)S πR² = σT⁴ 4πR², so T⁴ = (1 − α)S/(4σ)'],
    relationship: 'T = [(1 − α)S/(4σ)]^¼',
    params: {
      sigma: { value: SIGMA, unit: 'W m^-2 K^-4', range: [SIGMA, SIGMA], note: 'Stefan–Boltzmann constant (data booklet)' },
    },
  },

  columns: {
    S: { kind: 'set', name: 'irradiance', symbol: 'S', unit: 'W m^-2', values: [9082.7, 2601.3, 1361.0, 1361.0, 586.2], resolution: 0.1 },
    alpha: {
      kind: 'catalogue', name: 'albedo', symbol: '\\alpha', symbolText: 'α', unit: '', resolution: 0.001,
      values: [0.068, 0.77, 0.294, 0.11, 0.25], expect: [0, 1],
      observed: { reason: 'published Bond albedos: inputs to the model, not predicted by it' },
    },
    Tobs: {
      kind: 'catalogue', name: 'observed', symbol: 'T_\\text{obs}', symbolText: 'T(observed)', unit: 'K', resolution: 1,
      values: [440, 737, 288, 253, 208], expect: [150, 800],
      observed: { reason: 'published mean surface temperatures, which the question compares with the no-atmosphere model (Venus is far hotter than it)' },
    },
    Tmod: {
      kind: 'derived', name: 'model', symbol: 'T_\\text{model}', symbolText: 'T(model)', unit: 'K', dp: 0, hide: [MARS],
      value: (row) => tModel(row.alpha, row.S),
    },
  },
  tableCaption: 'Data: NASA planetary fact sheets. $S$ is the solar irradiance at the body\'s mean distance from the Sun and $\\alpha$ its albedo. '
    + '$T_\\text{obs}$ is the published mean surface temperature; $T_\\text{model}$ is calculated from the model.',
  graph: { x: 'Tmod', y: 'Tobs', fit: 'none', omit: [MARS], height: 560, what: 'observed mean temperature against model temperature', referenceLine: { m: 1, c: 0, label: 'where observed = model' } },
  present: ['table', 'graph'],

  results: {
    TMars: { unit: 'K', value: (d) => d.rows[MARS].Tmod, range: (d, v) => [v - 2, v + 2] },
    // Read from the graph: within half a small square (10 K) of the true gap.
    dEarth: { unit: 'K', value: (d) => d.rows[EARTH].Tobs - d.rows[EARTH].Tmod, range: (d, v) => [v - 10, v + 10] },
    dVenus: { unit: 'K', value: (d) => d.rows[1].Tobs - d.rows[1].Tmod },
  },

  stated: {
    sigma: { value: 5.67, dp: 2, unit: 'W m^-2 K^-4 (× 10⁻⁸)', source: 'data booklet: σ = 5.67 × 10⁻⁸ W m⁻² K⁻⁴', from: (p) => p.sigma / 1e-8 },
    moonLo: { value: 95, dp: 0, unit: 'K', source: 'NASA Moon Fact Sheet: diurnal temperature range (equator) 95 K to 390 K' },
    moonHi: { value: 390, dp: 0, unit: 'K', source: 'NASA Moon Fact Sheet: diurnal temperature range (equator) 95 K to 390 K' },
  },

  intro: () => '<p>A simple model treats a planet or moon as a black body with no atmosphere. It absorbs a fraction $(1 - \\alpha)$ of the '
    + 'sunlight falling on it, where $\\alpha$ is its albedo, and radiates energy from its whole surface. The temperature at which these balance is</p>'
    + '<p>$$T_\\text{model} = \\left(\\frac{(1-\\alpha)S}{4\\sigma}\\right)^{1/4}$$</p>'
    + '<p>where $S$ is the solar irradiance at the body. The table gives published data for five bodies. The graph shows the published mean '
    + 'temperature $T_\\text{obs}$ against $T_\\text{model}$; the point for Mars has not been plotted.</p>',

  parts: (d) => {
    const [mLo, mHi] = d.r.TMars.range;
    const [eLo, eHi] = d.r.dEarth.range;
    return [
      {
        label: 'a', marks: 2, ao: 'AO2',
        question: 'Calculate $T_\\text{model}$ for Mars.',
        numeric: d.num('TMars'),
        markscheme: [
          `$T^4 = \\dfrac{(1 - ${d.text('alpha', MARS)}) \\times ${d.text('S', MARS)}}{4 \\times ${d.stated('sigma')} \\times 10^{-8}}$ ✓`,
          `$T_\\text{model} = ${d.int(d.r.TMars.value)}\\ \\text{K}$ (accept ${d.int(mLo)} to ${d.int(mHi)} K) ✓`,
        ],
      },
      {
        label: 'b', marks: 1, ao: 'AO2', msFigure: 'graph-ms',
        question: 'Plot the point for Mars on the graph.',
        markscheme: [`Point at $T_\\text{model} = ${d.int(d.r.TMars.value)}\\ \\text{K}$, $T_\\text{obs} = ${d.text('Tobs', MARS)}\\ \\text{K}$ (close to the dashed line), to within half a small square ✓`],
      },
      {
        label: 'c', marks: 2, ao: { AO2: 1, AO3: 1 },
        question: 'Identify the body whose temperature is furthest from the model. Explain why.',
        markscheme: [
          `Venus: about ${d.int(d.r.dVenus.value)} K hotter than the model ✓`,
          'It has a very thick atmosphere, mostly carbon dioxide: a strong greenhouse effect absorbs the infrared radiated by the surface and re-emits much of it back down, so the surface must be far hotter to radiate the absorbed energy away ✓',
        ],
      },
      {
        label: 'd', marks: 1, ao: 'AO2',
        reads: [{ figure: 'graph', x: d.rows[EARTH].Tmod, y: d.rows[EARTH].Tobs, tol: 10 }],
        question: 'Use the graph to determine how much warmer the surface of the Earth is than the model predicts.',
        markscheme: [`The vertical distance of Earth's point above the dashed line: about ${d.int(d.r.dEarth.value)} K (accept ${d.int(eLo)} to ${d.int(eHi)} K) ✓`],
      },
      {
        // Reduced to 1 mark on the teacher's decision (8 October 2026): students state one reason; the subtler points stay as accepted answers.
        label: 'e', marks: 1, ao: 'AO3',
        question: `On the Moon, the surface temperature at the equator ranges from ${d.stated('moonLo')} K at night to ${d.stated('moonHi')} K in the day. `
          + 'State one reason, other than the effect of the atmosphere, why the actual temperatures of planets and moons can differ from the model.',
        markscheme: [
          'Any one of: the temperature is not the same over the whole surface: it varies enormously between day and night (and from equator to poles), but the model assumes one uniform temperature / '
            + 'a single "mean temperature" depends on how it is averaged over such a wide range / '
            + 'emission depends on $T^4$, so a body with a wide range of temperatures radiates its energy at a lower mean temperature (the Moon lies below the line) / '
            + 'the surface is not a perfect black body ✓',
        ],
      },
    ];
  },
};
