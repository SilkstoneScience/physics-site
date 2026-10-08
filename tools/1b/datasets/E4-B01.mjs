// E.4 A nuclear power station's operating record (IAEA PRIS data for the Krško reactor, Slovenia): energy per fission from a mass
// difference, load factor, an estimate of the mass of uranium-235 fissioned in a year, refuelling years from the data, and an evaluation
// of a rule of thumb (archetypes D1 and M2).
import { LAWS } from '../laws.mjs';

const Y2018 = 1;
const Y2020 = 3;
const PREF = 688; // MW, reference unit power (net) in 2017–2022
const PTH = 1994; // MW, thermal power
// Masses as given to students (4 decimal places): U-235, neutron, Ba-141, Kr-92 (NIST, AME; neutron: CODATA 2022).
const M = { U: 235.0439, n: 1.0087, Ba: 140.9144, Kr: 91.9262 };
const U_KG = 1.661e-27; // data booklet
const MEV_J = 1.60e-13; // data booklet: 1 MeV = 1.60 × 10⁻¹³ J
const C = 3.0e8;
const hoursIn = (year) => (year % 4 === 0 ? 8784 : 8760);
// The years with a refuelling shutdown (all but 2017 and 2020)
const others = (d, k) => d.rows.filter((_, i) => i !== 0 && i !== Y2020).map((r) => r[k]);

export default {
  id: 'E4-B01',
  topic: 'E.4',
  difficulty: 2,
  context: 'unfamiliar',
  source: 'secondary',
  skills: ['mass-defect-energy', 'load-factor', 'energy-chain', 'estimate', 'evidence-from-data', 'evaluate-a-claim'],
  seed: 241,
  batch: 'batch-2',
  archetypes: ['D1', 'M2'],
  apparatus: 'published annual operating data (IAEA PRIS) for the Krško nuclear power station',
  contextFamily: 'nuclear-power-data',
  contextObjects: ['database'],
  rowLabels: { heading: 'year', values: ['2017', '2018', '2019', '2020', '2021', '2022'] },
  provenance: {
    source: 'International Atomic Energy Agency, Power Reactor Information System (PRIS): reactor KRSKO (Slovenia), detailed report, historical summary',
    url: 'https://pris-stats.iaea.org/reactor/542',
    retrieved: '2026-10-08',
    taken: 'Electricity produced (GWh) and time online (hours) for 2017 to 2022; reference unit power 688 MW(e) in those years; thermal capacity '
      + '1994 MW; refuelling frequency 18 months. Nuclide masses for part (a): NIST Atomic Weights and Isotopic Compositions (U-235, Ba-141, Kr-92) '
      + 'and CODATA 2022 (neutron), rounded to 4 decimal places.',
    transformations: 'Load factors are calculated here from the electricity produced, the reference unit power and the hours in each year (they agree '
      + 'with PRIS\'s own load factors to 0.01 %). The years chosen, the table, and all questions are new.',
    fields: {
      E: { sourceColumn: 'Electricity produced GWh', definition: 'net electrical energy supplied in the year, in gigawatt hours' },
      ton: { sourceColumn: 'Time Online (Hours)', definition: 'hours in the year for which the unit was connected to the grid' },
    },
    extract: {
      file: 'p1b-sources/E4-B01-pris-krsko.json',
      sha256: '2c11cd2c467b13eb22700a75471fa8fe2f3e35809c45026e8c424b04e1f92765',
      rows: ['2017', '2018', '2019', '2020', '2021', '2022'],
    },
  },
  originality: 'The 2025 fission items are Paper 1A multiple choice; no cached IB question uses a power station\'s operating data. Own context '
    + '(PRIS data for one named reactor, credited), own sequence: mass difference to energy, load factor, the energy chain to the mass of '
    + 'uranium-235, refuelling years from the data, and a rule of thumb evaluated.',

  physics: {
    scenario: 'Krško is a pressurised water reactor in Slovenia with a thermal power of 1994 MW and a net electrical output of 688 MW (2017–2022). '
      + 'It is refuelled every 18 months, when it is shut down for about a month. The IAEA publishes the electricity it supplies each year.',
    principles: [
      'Energy released in a reaction = (mass of reactants − mass of products) × c² (E.4; 1 u ≡ 931.5 MeV)',
      'Efficiency = useful (electrical) energy out ÷ energy released in the reactor (thermal)',
      'Load factor = energy supplied ÷ (rated power × hours in the year)',
      'Number of fissions = thermal energy ÷ energy per fission; mass fissioned = number × mass of one U-235 nucleus',
    ],
    assumptions: [
      'All the thermal energy comes from fissions of uranium-235 by the reaction given (in a real reactor some comes from plutonium-239 made in the fuel, and fission products vary)',
      'The efficiency is the same all year: net electrical power ÷ thermal power',
      'Energy carried away by neutrinos and from radioactive decay of the products is ignored',
    ],
    derivation: ['m_fissioned = (E_electrical/η) ÷ (Δm c²) × m(U-235)'],
    relationship: 'E = Δmc²; m = E_e m_U/(η Δm c²)',
    params: {
      Pref: { value: PREF, unit: 'MW', range: [600, 750], note: 'reference unit power (net electrical), 2017–2022' },
      Pth: { value: PTH, unit: 'MW', range: [1800, 2100], note: 'thermal power' },
      c: { value: C, unit: 'm s^-1', range: [C, C], note: 'data booklet value' },
    },
  },

  columns: {
    year: { kind: 'set', name: 'year', symbol: '\\text{year}', symbolText: 'year', unit: '', values: [2017, 2018, 2019, 2020, 2021, 2022], resolution: 1, show: false },
    E: {
      kind: 'catalogue', name: 'electrical energy supplied', symbol: 'E', unit: 'GWh', resolution: 1,
      values: [5968, 5490, 5533, 6041, 5419, 5311], expect: [4000, 6500],
      observed: { reason: 'published operating data that the question analyses; no model predicts them' },
    },
    ton: {
      kind: 'catalogue', name: 'time connected to the grid', symbol: 't', unit: 'h', resolution: 1,
      values: [8708, 8010, 8081, 8748, 7940, 7849], expect: [6000, 8784],
      observed: { reason: 'published operating data (hours online), used as evidence of refuelling shutdowns' },
    },
    LF: {
      kind: 'derived', name: 'load factor', symbol: '\\text{LF}', symbolText: 'LF', unit: '%', dp: 1, hide: [Y2018],
      value: (row) => (100 * row.E * 1e3) / (PREF * hoursIn(row.year)),
    },
  },
  tableCaption: 'Data: IAEA Power Reactor Information System (PRIS), Krško nuclear power station, Slovenia. $t$ is the time for which the station was connected to the grid in each year.',
  present: ['table'],

  results: {
    dm: { unit: 'u', value: () => M.U + M.n - (M.Ba + M.Kr + 3 * M.n) },
    Ef: { unit: 'MeV', value: (d) => d.r.dm.value * 931.5 },
    EfCheck: { unit: 'J', value: (d) => LAWS['mass-energy'].f({ dm: d.r.dm.value * U_KG, c: d.p.c }) },
    LF18: { unit: '%', value: (d) => d.rows[Y2018].LF, range: (d, v) => [v - 0.2, v + 0.2] },
    eta: { unit: '', value: () => PREF / PTH },
    Eth: { unit: 'J', value: (d) => (d.rows[Y2020].E * 3.6e12) / d.r.eta.value },
    N: { unit: '', value: (d) => d.r.Eth.value / (d.r.Ef.value * MEV_J) },
    mass: { unit: 'kg', value: (d) => d.r.N.value * M.U * U_KG, range: (d, v) => [v * 0.85, v * 1.15] },
    // Gigawatt-years supplied in 2020: GWh ÷ hours in the year = mean power in GW, kept for one year.
    gwyr: { unit: '', value: (d) => d.rows[Y2020].E / hoursIn(2020) },
    perGW: { unit: 'kg', value: (d) => d.r.mass.value / d.r.gwyr.value },
  },

  stated: {
    mU: { value: M.U, dp: 4, unit: 'u', source: 'NIST: U-235 relative atomic mass 235.0439301', from: () => M.U },
    mn: { value: M.n, dp: 4, unit: 'u', source: 'CODATA 2022: neutron mass 1.00866491606 u', from: () => M.n },
    mBa: { value: M.Ba, dp: 4, unit: 'u', source: 'NIST: Ba-141 relative atomic mass 140.9144033', from: () => M.Ba },
    mKr: { value: M.Kr, dp: 4, unit: 'u', source: 'NIST: Kr-92 relative atomic mass 91.9261731', from: () => M.Kr },
    uMeV: { value: 931.5, dp: 1, unit: 'MeV', source: 'data booklet: 1 u = 931.5 MeV c⁻²' },
    MeVJ: { value: 1.6, dp: 2, unit: 'J (× 10⁻¹³)', source: 'data booklet: e = 1.60 × 10⁻¹⁹ C, so 1 MeV = 1.60 × 10⁻¹³ J' },
    uKg: { value: 1.661, dp: 3, unit: 'kg (× 10⁻²⁷)', source: 'data booklet: 1 u = 1.661 × 10⁻²⁷ kg', from: () => U_KG / 1e-27 },
    Pref: { value: PREF, dp: 0, unit: 'MW', source: 'PRIS reference unit power 2017–2022', from: (p) => p.Pref },
    Pth: { value: PTH, dp: 0, unit: 'MW', source: 'PRIS thermal capacity', from: (p) => p.Pth },
    h: { value: 8760, dp: 0, unit: 'h', source: 'hours in a year of 365 days' },
    hLeap: { value: 8784, dp: 0, unit: 'h', source: 'hours in a leap year (366 days)' },
    GWhJ: { value: 3.6, dp: 1, unit: 'J (× 10¹²)', source: '1 GWh = 10⁹ W × 3600 s = 3.6 × 10¹² J' },
    months: { value: 18, dp: 0, unit: 'month', source: 'PRIS: refuelling frequency 18 months' },
  },

  intro: (d) => `<p>The Krško nuclear power station in Slovenia has one reactor. Its thermal power is $${d.stated('Pth')}\\ \\text{MW}$ and, in the years shown, `
    + `its net electrical power output was $${d.stated('Pref')}\\ \\text{MW}$. The table gives the electrical energy $E$ it supplied in six years.</p>`
    + '<p>The load factor LF is the energy supplied as a percentage of the energy the station would supply at full power for the whole year. '
    + `A year has ${d.stated('h')} hours (a leap year, such as 2020, has ${d.stated('hLeap')}).</p>`
    + '<p>One fission reaction in the reactor is</p>'
    + '<p>$${}^{235}_{92}\\text{U} + {}^{1}_{0}\\text{n} \\rightarrow {}^{141}_{56}\\text{Ba} + {}^{92}_{36}\\text{Kr} + 3\\,{}^{1}_{0}\\text{n}$$</p>'
    + `<p>Masses: $^{235}\\text{U}$ ${d.stated('mU')} u, neutron ${d.stated('mn')} u, $^{141}\\text{Ba}$ ${d.stated('mBa')} u, $^{92}\\text{Kr}$ ${d.stated('mKr')} u.</p>`,

  parts: (d) => {
    const [mLo, mHi] = d.r.mass.range;
    return [
      {
        label: 'a', marks: 2, ao: 'AO2',
        question: 'Calculate the energy released in this fission reaction, in MeV.',
        markscheme: [
          `Mass difference $= (${d.stated('mU')} + ${d.stated('mn')}) - (${d.stated('mBa')} + ${d.stated('mKr')} + 3 \\times ${d.stated('mn')}) = ${d.dp(d.r.dm.value, 4)}\\ \\text{u}$ ✓`,
          `$E = ${d.dp(d.r.dm.value, 4)} \\times ${d.stated('uMeV')} \\approx ${d.sf(d.r.Ef.value, 3)}\\ \\text{MeV}$ ✓`,
        ],
      },
      {
        label: 'b', marks: 1, ao: 'AO2',
        question: 'Calculate the load factor in 2018.',
        numeric: d.num('LF18'),
        markscheme: [`$\\dfrac{${d.text('E', Y2018)}\\ \\text{GWh}}{${d.dp(PREF / 1e3, 3)}\\ \\text{GW} \\times ${d.stated('h')}\\ \\text{h}} \\times 100 = ${d.dp(d.r.LF18.value, 1)}\\,\\%$ ✓`],
      },
      {
        label: 'c', marks: 3, ao: { AO2: 2, AO3: 1 },
        question: 'Estimate the mass of $^{235}\\text{U}$ that underwent fission in 2020. Assume that all the energy released in the reactor comes from the reaction above.',
        markscheme: [
          `Efficiency $= \\dfrac{${d.stated('Pref')}}{${d.stated('Pth')}} = ${d.dp(d.r.eta.value, 3)}$, so thermal energy $= \\dfrac{${d.text('E', Y2020)} \\times ${d.stated('GWhJ')} \\times 10^{12}}{${d.dp(d.r.eta.value, 3)}} = ${d.sci(d.r.Eth.value, 2)}\\ \\text{J}$ ✓`,
          `Number of fissions $= \\dfrac{${d.sci(d.r.Eth.value, 2)}}{${d.sf(d.r.Ef.value, 3)} \\times ${d.stated('MeVJ')} \\times 10^{-13}} = ${d.sci(d.r.N.value, 2)}$ ✓`,
          `Mass $= ${d.sci(d.r.N.value, 2)} \\times ${d.stated('mU')} \\times ${d.stated('uKg')} \\times 10^{-27} \\approx ${d.sf(d.r.mass.value, 2)}\\ \\text{kg}$ (accept ${d.sf(mLo, 2)} to ${d.sf(mHi, 2)} kg; allow ECF from (a)) ✓`,
        ],
      },
      {
        label: 'd', marks: 1, ao: 'AO3',
        question: `The reactor is shut down for refuelling about once every ${d.stated('months')} months. Identify the years in the table in which it was not refuelled, and state the evidence.`,
        markscheme: [`${d.text('year', 0)} and ${d.text('year', Y2020)}: the load factor is close to 100 % and the station was connected to the grid for ${d.text('ton', 0)} and ${d.text('ton', Y2020)} hours, `
          + `compared with ${d.dp(Math.min(...others(d, 'LF')), 1)}–${d.dp(Math.max(...others(d, 'LF')), 1)} % and ${d.int(Math.min(...others(d, 'ton')))}–${d.int(Math.max(...others(d, 'ton')))} hours in the other years ✓`],
      },
      {
        label: 'e', marks: 2, ao: 'AO3',
        asks: { conclusion: ['is supported', 'supports the rule'] },
        // Scaffolded on the teacher's request (8 October 2026): the gigawatt-year is defined and the 2020 value given.
        question: 'A gigawatt-year is the energy supplied by a power of 1 GW for one year. In 2020 the station supplied '
          + `${d.dp(d.r.gwyr.value, 2)} gigawatt-years of electrical energy. A rule of thumb says that a reactor fissions about one tonne of $^{235}\\text{U}$ `
          + 'for every gigawatt-year of electrical energy. Use your answer to (c) to deduce whether the 2020 data support this rule.',
        markscheme: [
          `Mass per gigawatt-year $= \\dfrac{${d.sf(d.r.mass.value, 2)}\\ \\text{kg}}{${d.dp(d.r.gwyr.value, 2)}} \\approx ${d.dp(d.r.perGW.value / 1e3, 1)}\\ \\text{t}$ (allow ECF from (c)) ✓`,
          'This is close to one tonne (the same order of magnitude), so the data roughly support the rule; accept a conclusion consistent with the candidate\'s value. '
            + '(Not required: the estimate is a little larger because some energy comes from fissions of $^{239}\\text{Pu}$ made in the fuel, which the calculation ignores.) ✓',
        ],
      },
    ];
  },
};
