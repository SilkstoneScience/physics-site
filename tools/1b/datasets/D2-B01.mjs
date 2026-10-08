// D.2 Charges on oil drops held stationary between charged plates, measured with a voltmeter that reads high
// (archetypes L3, E2 and V3).
// Skills: the balance condition as supporting set-up, completing calculated cells, the percentage uncertainty of a cube,
// testing whether values are whole-number multiples of one charge (quantisation), the best value of e, and the effect of a
// calibration error (it scales every charge, so quantisation still shows but e is wrong in a known direction).
import { arrow, label } from '../diagrams.mjs';
import { escapeAttr } from '../lib.mjs';

const HIDE = [2, 5]; // students calculate q for drops C and F
const PCT_ROW = 0; // drop A: percentage uncertainty in q
const CAL = 1.03; // the voltmeter reads 3.0 % high
// The number of electron charges on each drop, by radius: the hidden truth students deduce (not shown).
const N_OF = new Map([[0.512, 1], [0.633, 2], [0.741, 3], [0.468, 1], [0.596, 2], [0.825, 4], [0.702, 3]]);

const MASS = (r, p) => (4 / 3) * Math.PI * (r * 1e-6) ** 3 * p.rho; // kg, r in µm
const multiples = (d) => {
  const q = d.rows.map((r) => r.q);
  const qMin = Math.min(...q);
  return q.map((x) => Math.max(1, Math.round(x / qMin)));
};

export default {
  id: 'D2-B01',
  topic: 'D.2',
  difficulty: 3,
  context: 'experimental',
  skills: ['supporting-derivation', 'complete-a-table', 'uncertainty-of-a-power', 'quantisation', 'best-value', 'calibration-error'],
  seed: 211,
  batch: 'batch-2',
  archetypes: ['L3', 'E2', 'V3'],
  apparatus: 'oil drops held stationary between horizontal charged plates, viewed through a microscope, with a voltmeter across the plates',
  contextFamily: 'charge-quantisation',
  contextObjects: ['charged-plates', 'cell-and-meters'],
  rowLabels: { heading: 'drop', values: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
  originality: 'Millikan\'s experiment is named in the D.2 guide. The cached 2025 papers use oil or water droplets only for terminal velocity '
    + '(Nov 2025 Paper 2) and recall (Paper 1A); no legacy Paper 3 Section A question analyses quantisation data. Own numbers, a table of '
    + 'drops with a miscalibrated voltmeter, and an own sequence: balance condition, completing the table, uncertainty of r³, whole-number '
    + 'multiples and the best value of e, then correcting for the calibration error.',

  physics: {
    scenario: 'A student sprays oil drops between two horizontal metal plates 6.00 mm apart and views them through a microscope. The radius of '
      + 'each drop is found from its steady fall speed with the plates uncharged. A p.d. is then applied and adjusted until the drop stays still; '
      + 'the student records the voltmeter reading V. The voltmeter, it is found later, reads 3.0 % too high.',
    principles: [
      'Uniform field between parallel plates: E = V/d (D.2)',
      'Force on a charge: F = qE (D.2)',
      'A stationary drop is in equilibrium: qV/d = mg, so q = mgd/V',
      'Mass of a spherical drop: m = (4/3)πr³ρ',
      'Charge is quantised: q = ne (D.2, Millikan)',
    ],
    assumptions: [
      'The field between the plates is uniform and the drop is far from their edges',
      'Upthrust of the air on the drop is negligible (air is about 700 times less dense than the oil)',
      'The radius from the fall speed is correct to within its stated uncertainty',
      'The voltmeter reads 3.0 % high at every reading (a calibration error: reading = 1.030 × true p.d.)',
    ],
    derivation: [
      'qV_true/d = mg with m = (4/3)πr³ρ and q = ne, so V_true = (4/3)πr³ρgd/(ne)',
      'The voltmeter shows V = 1.030 V_true, so q calculated from the reading, mgd/V, is the true charge divided by 1.030',
    ],
    relationship: 'V = (4/3)πr³ρgd/(ne), read as 1.030 V',
    params: {
      rho: { value: 875, unit: 'kg m^-3', range: [800, 1000], note: 'density of the oil (a low-volatility oil used for Millikan experiments)' },
      g: { value: 9.8, unit: 'm s^-2', range: [9.8, 9.8], note: 'data booklet value' },
      d: { value: 6.0, unit: 'mm', range: [3, 10], note: 'plate separation' },
      e: { value: 1.602176634e-19, unit: 'C', range: [1.602176634e-19, 1.602176634e-19], note: 'elementary charge (the charge on each drop is a whole-number multiple)' },
    },
  },

  columns: {
    r: { kind: 'set', name: 'radius', symbol: 'r', unit: 'µm', values: [0.512, 0.633, 0.741, 0.468, 0.596, 0.825, 0.702], resolution: 0.001, uncertainty: 0.005 },
    n: { kind: 'derived', name: 'number of electron charges', symbol: 'n', unit: '', dp: 0, show: false, value: (row) => N_OF.get(row.r) },
    V: {
      kind: 'measured', name: 'p.d.', symbol: 'V', unit: 'V',
      model: {
        law: 'balance-pd',
        inputs: {
          m: { law: 'sphere-mass', inputs: { r: 'row.r', rho: 'p.rho' } },
          g: 'p.g', d: 'p.d',
          q: { law: 'charge-multiple', inputs: { n: 'row.n', e: 'p.e' } },
        },
      },
      expect: [100, 300],
      measurement: {
        instrument: 'digital voltmeter across the plates, resolution 1 V (found later to read 3.0 % high)',
        reading: 'the p.d. at which the drop, watched through the microscope, stays still',
        noise: 'judging when the drop is exactly still (it drifts slowly) and the small error in each measured radius, which changes the p.d. '
          + 'the drop really needs: together a normal scatter of 0.8 % of the reading',
      },
      noise: { type: 'gauss-relative', sd: 0.008 }, resolution: 1, uncertainty: 1,
      systematic: [{
        type: 'calibration', factor: CAL,
        cause: 'the voltmeter reads 3.0 % higher than the true p.d. across the plates',
        justification: 'a few per cent is a typical calibration error for an inexpensive meter on a high-voltage range; the question tells students about it in part (e)',
      }],
    },
    q: {
      kind: 'derived', name: 'charge', symbol: 'q/(10^{-19}\\,\\text{C})', symbolText: 'q/(10⁻¹⁹ C)', unit: '', dp: 2, hide: HIDE,
      value: (row, p) => (MASS(row.r, p) * p.g * (p.d * 1e-3)) / row.V / 1e-19,
      // Kept internal (students find the percentage uncertainty in (c)): used to check the whole-number-multiple claim.
      propagation: { form: 'product', terms: [{ of: 'r', n: 3 }, { of: 'V', n: -1 }] },
      showUncertainty: false,
    },
  },
  tableCaption: 'Radius $r$ of each drop and the voltmeter reading $V$ when it is held still, with the charge $q$ calculated from them.',
  present: ['diagram', 'table'],
  figures: {
    diagram: () => {
      const alt = 'Two horizontal metal plates, the upper one positive, 6.00 mm apart. A small oil drop is held still between them, with the '
        + 'electric force on it upwards and its weight downwards. A voltmeter is connected across the plates and a microscope looks at the drop from the side.';
      return { svg: millikanPlates(alt), alt, caption: 'The oil drop is held still when the electric force on it balances its weight.' };
    },
  },

  results: {
    qC: { unit: '', value: (d) => d.rows[2].q },
    qF: { unit: '', value: (d) => d.rows[5].q },
    pct: {
      unit: '%', value: (d) => (3 * d.unc('r', PCT_ROW) * 100) / d.rows[PCT_ROW].r,
      range: (d, v) => [v * 0.97, v * 1.03],
    },
    // Best value of e (in the table's units of 10⁻¹⁹ C): the total charge divided by the total number of charges.
    eUnits: {
      unit: '', value: (d) => d.rows.reduce((s, r) => s + r.q, 0) / multiples(d).reduce((s, x) => s + x, 0),
      range: (d) => { const k = multiples(d); const each = d.rows.map((r, i) => r.q / k[i]); return [Math.min(...each), Math.max(...each)]; },
    },
    e: { unit: 'C', estimates: 'e', value: (d) => d.r.eUnits.value * 1e-19 },
    eCorr: { unit: 'C', value: (d) => d.r.e.value * CAL },
  },

  claims: [{ type: 'integerMultiples', column: 'q', factor: 'eUnits', expect: true }],

  stated: {
    d: { value: 6.0, dp: 2, unit: 'mm', source: 'plate separation, physics.params.d', from: (p) => p.d },
    rho: { value: 875, dp: 0, unit: 'kg m^-3', source: 'oil density, physics.params.rho', from: (p) => p.rho },
    cal: { value: 3.0, dp: 1, unit: '%', source: 'the voltmeter reads 3.0 % high (calibration factor 1.030)', from: () => (CAL - 1) * 100 },
    calF: { value: 1.03, dp: 3, unit: '', source: 'reading = 1.030 × true p.d.', from: () => CAL },
  },

  intro: (d) => '<p>A student investigates the charges on oil drops. Drops are sprayed between two horizontal metal plates a distance '
    + `$d = ${d.stated('d')}\\ \\text{mm}$ apart. The density of the oil is $${d.stated('rho')}\\ \\text{kg m}^{-3}$.</p>`
    + '<p>The radius $r$ of each drop is found from its steady fall speed when the plates are not charged (you do not need this method). '
    + 'A potential difference is then applied, and adjusted until the drop stays still. The student records the voltmeter reading $V$.</p>',

  parts: (d) => {
    const [eLo, eHi] = d.r.eUnits.range;
    const k = multiples(d);
    return [
      {
        label: 'a', marks: 1, ao: 'AO2',
        question: 'Show that the charge on a drop that stays still is $q = \\dfrac{mgd}{V}$, where $m$ is the mass of the drop.',
        markscheme: ['The electric force balances the weight: $qE = mg$ with $E = \\dfrac{V}{d}$, so $\\dfrac{qV}{d} = mg$ and $q = \\dfrac{mgd}{V}$ ✓'],
      },
      {
        label: 'b', marks: 2, ao: 'AO2',
        question: 'Calculate the missing values of $q$ for drops C and F.',
        markscheme: [
          `Mass from $m = \\tfrac43\\pi r^3\\rho$; drop C: $q = ${d.sf(d.r.qC.value, 3)} \\times 10^{-19}\\ \\text{C}$ ✓`,
          `Drop F: $q = ${d.sf(d.r.qF.value, 3)} \\times 10^{-19}\\ \\text{C}$ ✓`,
        ],
      },
      {
        label: 'c', marks: 2, ao: 'AO2',
        question: 'The uncertainties in $V$, $d$ and the density are small compared with the uncertainty in $r$. Determine the percentage uncertainty in $q$ for drop A.',
        numeric: d.num('pct', { mistakes: [{ value: (d.unc('r', PCT_ROW) * 100) / d.rows[PCT_ROW].r, feedback: 'The mass depends on r³: multiply the percentage uncertainty in r by 3.' }] }),
        markscheme: [
          `$\\dfrac{\\Delta r}{r} = \\dfrac{${d.dp(d.unc('r', PCT_ROW), 3)}}{${d.text('r', PCT_ROW)}}$, and $q \\propto r^3$, so the percentage uncertainty is three times as large ✓`,
          `$${d.sf(d.r.pct.value, 2)}\\,\\%$ ✓`,
        ],
      },
      {
        label: 'd', marks: 3, ao: 'AO3',
        asks: { conclusion: ['support the idea', 'supports the idea', 'is quantised', 'are quantised'] },
        question: 'Deduce whether these data support the idea that charge comes in whole-number multiples of one smallest charge. Determine, from the data, the best value of that smallest charge.',
        markscheme: [
          `Every charge is close to a whole-number multiple (${[...new Set(k)].sort().join(', ')}) of about $${d.sf(d.r.eUnits.value, 3)} \\times 10^{-19}\\ \\text{C}$ ✓`,
          'Each lies within its uncertainty (a few per cent, mostly from $r^3$) of that multiple, and no value lies halfway between multiples, so the data support quantisation ✓',
          `Best value: total charge ÷ total number of charges (or the mean of $q/n$) $= ${d.sf(d.r.e.value / 1e-19, 3)} \\times 10^{-19}\\ \\text{C}$ (accept ${d.sf(eLo, 3)} to ${d.sf(eHi, 3)}) ✓`,
        ],
      },
      {
        label: 'e', marks: 2, ao: 'AO3',
        question: `The voltmeter is later found to read ${d.stated('cal')} % higher than the true p.d. Determine the corrected value of the smallest charge, and state the effect of this error on your conclusion in (d).`,
        markscheme: [
          `The true p.d. is smaller, so every true charge is larger: $${d.sf(d.r.e.value / 1e-19, 3)} \\times ${d.stated('calF')} = ${d.sf(d.r.eCorr.value / 1e-19, 3)} \\times 10^{-19}\\ \\text{C}$ (allow ECF from (d)) ✓`,
          'Every charge is scaled by the same factor, so they are still whole-number multiples of one value: the conclusion about quantisation is unchanged ✓',
        ],
      },
    ];
  },
};

// The plates, the drop and the forces on it (a drawing: not to scale).
function millikanPlates(alt) {
  const body = [
    '<rect class="l3 thin" x="90" y="60" width="300" height="12" fill="none"/>',
    '<rect class="l3 thin" x="90" y="208" width="300" height="12" fill="none"/>',
    label(70, 72, '+', { size: 22 }), label(70, 220, '−', { size: 22 }),
    '<circle class="f3" cx="240" cy="140" r="5"/>',
    arrow(240, 132, 240, 92, { cls: 'l1', head: 10, half: 5 }), label(252, 104, 'electric force', { anchor: 'start', size: 15, cls: 't1' }),
    arrow(240, 148, 240, 188, { cls: 'l2', head: 10, half: 5 }), label(252, 186, 'weight', { anchor: 'start', size: 15, cls: 't2' }),
    // plate separation d
    arrow(420, 140, 420, 74, { cls: 'l3 thin', head: 8, half: 4 }), arrow(420, 140, 420, 206, { cls: 'l3 thin', head: 8, half: 4 }),
    label(432, 146, 'd', { anchor: 'start', italic: true }),
    // microscope looking in from the left
    '<rect class="l3 thin" x="12" y="128" width="64" height="24" rx="4" fill="none"/>', label(12, 178, 'microscope', { anchor: 'start', size: 15 }),
    // voltmeter across the plates
    '<line class="l3 thin" x1="390" y1="66" x2="470" y2="66"/><line class="l3 thin" x1="390" y1="214" x2="470" y2="214"/>',
    '<line class="l3 thin" x1="470" y1="66" x2="470" y2="122"/><line class="l3 thin" x1="470" y1="158" x2="470" y2="214"/>',
    '<circle class="l3 thin" cx="470" cy="140" r="18" fill="none"/>', label(470, 146, 'V', { size: 16 }),
  ];
  return `<svg viewBox="0 0 520 240" role="img" aria-label="${escapeAttr(alt)}">${body.join('')}</svg>`;
}
