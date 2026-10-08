// E.1 Lines in the spectrum of a mercury lamp, read from a handheld spectroscope's scale, matched to energy levels (archetypes M3 and V3).
// Skills: reading an instrument scale, the uncertainty of a scale reading (half a division), photon energy in eV, testing a claim that
// several lines share one upper level, and whether a scale can separate two close lines.
import { LAWS } from '../laws.mjs';
import { scaleReading, label } from '../diagrams.mjs';
import { escapeAttr } from '../lib.mjs';

const GREEN = 2;
const H = 6.63e-34; // data booklet
const C = 3.0e8;
const E_CHARGE = 1.6e-19;
const DIV = 5; // nm, smallest division of the scale
const [SMIN, SMAX, MAJOR] = [400, 560, 20]; // nm: the part of the scale shown, numbered every 20 nm
const ePhoton = (lamNm) => LAWS['photon-energy'].f({ h: H, c: C, lambda: lamNm * 1e-9 }) / E_CHARGE;

export default {
  id: 'E1-B01',
  topic: 'E.1',
  difficulty: 1,
  context: 'experimental',
  source: 'secondary',
  skills: ['read-a-scale', 'reading-uncertainty', 'photon-energy', 'energy-levels', 'test-a-claim', 'resolution-of-a-scale'],
  seed: 101,
  batch: 'batch-2',
  archetypes: ['M3', 'V3'],
  apparatus: 'handheld spectroscope with a wavelength scale, pointed at a mercury vapour lamp',
  contextFamily: 'atomic-spectra',
  contextObjects: ['spectroscope'],
  features: ['diagram:instrument'],
  tableless: { reason: 'students read the wavelengths from the spectroscope\'s scale themselves', readFrom: [{ figure: 'scale', columns: ['lam'] }] },
  diagramChecks: [{ figure: 'scale', scale: { column: 'lam' } }],
  provenance: {
    source: 'NIST Atomic Spectra Database (ver. 5.12), Hg I lines: Kramida, A., Ralchenko, Yu., Reader, J., and NIST ASD Team (2024); line list Saloman 2006, revised by Kramida 2010',
    url: 'https://physics.nist.gov/asd',
    retrieved: '2026-10-08',
    taken: 'Observed wavelengths in air and the lower and upper level energies (eV) of the Hg I lines at 404.6565, 435.8335 and 546.0750 nm; '
      + 'the level at 6.7036623 eV and the yellow lines at 576.9610 and 579.0670 nm for parts (d) and (e).',
    transformations: 'Wavelengths drawn on the scale to 0.1 nm; level energies given to 2 decimal places. The scale drawing, the level diagram and all questions are new.',
    fields: {
      lam: { sourceColumn: 'Observed Wavelength Air (nm)', definition: 'observed wavelength in air, in nanometres' },
      El: { sourceColumn: 'Ei (eV)', definition: 'energy of the lower level of the transition, in electronvolts above the ground state' },
    },
    extract: {
      file: 'p1b-sources/E1-B01-nist-hg-lines.json',
      sha256: '1455130a6db74bd9c690d5a58556a72d506124c6ce4a53d52fb45e0f9243add6',
      rows: ['Hg I 404.6565', 'Hg I 435.8335', 'Hg I 546.0750'],
    },
  },
  originality: 'Spectra appear in legacy Paper 3s (2018, 2019, 2024) and a May 2025 Paper 1A item, but none shows a spectroscope scale to '
    + 'read with a level diagram in this sequence (read the scale, its uncertainty, photon energy, test a shared-upper-level claim, '
    + 'resolution). Line data are public NIST values, credited.',

  physics: {
    scenario: 'A student looks at a mercury vapour lamp through a handheld spectroscope. A wavelength scale (smallest division 5 nm) is seen '
      + 'alongside the spectrum. The three brightest lines between 400 nm and 560 nm (violet, blue and green) are read against the scale.',
    principles: [
      'An atom emits a photon when it falls from a higher energy level to a lower one; the photon\'s energy is the difference between the levels (E.1)',
      'Photon energy E = hf = hc/λ (E.1)',
      'A scale reading is uncertain by about half its smallest division',
    ],
    assumptions: [
      'The spectroscope\'s scale is correctly calibrated, so each line appears at its true wavelength (in air)',
      'The three lines come from the transitions listed in the NIST database (their upper level is 7.73 eV)',
    ],
    derivation: ['λ = hc/(E_upper − E_lower), with the level energies converted from eV to joules'],
    relationship: 'λ = hc/(E_u − E_l)',
    params: {
      h: { value: 6.62607015e-34, unit: 'J s', range: [6.62607015e-34, 6.62607015e-34], note: 'Planck constant (exact SI value)' },
      c: { value: 299792458, unit: 'm s^-1', range: [299792458, 299792458], note: 'speed of light in a vacuum (exact)' },
      Eu: { value: 7.7304551, unit: 'eV', range: [7.7304551, 7.7304551], note: 'upper level of the three lines (Hg 6s7s ³S₁, NIST)' },
    },
  },

  columns: {
    k: { kind: 'set', name: 'line', symbol: 'k', unit: '', values: [1, 2, 3], resolution: 1, show: false },
    El: {
      kind: 'catalogue', name: 'lower level', symbol: 'E_\\text{l}', unit: 'eV', resolution: 0.0000001, show: false,
      values: [4.6673829, 4.8864946, 5.4606248], expect: [4, 6],
      observed: { reason: 'published level energies: inputs to the wavelength model, not predicted by it' },
    },
    lam: {
      kind: 'catalogue', name: 'wavelength', symbol: '\\lambda', symbolText: 'λ', unit: 'nm', resolution: 0.1, uncertainty: 2.5,
      values: [404.6565, 435.8335, 546.075], expect: [400, 560],
      model: { law: 'transition-wavelength', inputs: { h: 'p.h', c: 'p.c', Eu: 'p.Eu', El: 'row.El' } },
      agree: 0.001,
      agreeReason: 'the published wavelengths are measured in air, about 0.03 % shorter than the vacuum wavelengths hc/ΔE',
    },
  },
  present: ['scale', 'levels'],
  figures: {
    scale: (d) => {
      const alt = `A spectroscope scale from ${d.stated('smin')} nm to ${d.stated('smax')} nm, numbered every ${d.stated('major')} nm, with a small division every ${d.stated('div')} nm. Three bright lines `
        + '(violet, blue and green) are marked against the scale.';
      return {
        svg: scaleReading(alt, { min: SMIN, max: SMAX, major: MAJOR, minor: DIV, title: 'wavelength / nm', marks: d.rows.map((r, i) => ({ value: r.lam, row: i, cls: ['spec-violet', 'spec-blue', 'spec-green'][i] })) }),
        alt, caption: 'The scale seen in the spectroscope, with the violet, blue and green lines of mercury (left to right). Line positions: NIST Atomic Spectra Database.',
      };
    },
    levels: (d) => {
      const lv = [
        { E: 0, text: 'ground state: 0 eV' },
        { E: d.rows[0].El, text: `${d.dp(d.rows[0].El, 2)} eV` },
        { E: d.rows[1].El, text: `${d.dp(d.rows[1].El, 2)} eV` },
        { E: d.rows[2].El, text: `${d.dp(d.rows[2].El, 2)} eV` },
        { E: 6.7036623, text: `${d.stated('E670')} eV` },
        { E: d.p.Eu, text: `${d.stated('Eu')} eV` },
      ];
      const alt = `Energy levels of mercury (not to scale): ${lv.map((x) => x.text).join(', ')}.`;
      return { svg: levelDiagram(alt, lv), alt, caption: 'Some energy levels of a mercury atom (not to scale). Data: NIST.' };
    },
  },

  results: {
    lamG: { unit: 'nm', value: (d) => d.rows[GREEN].lam },
    EG: {
      unit: 'eV', value: (d) => ePhoton(d.rows[GREEN].lam),
      range: (d) => [ePhoton(d.rows[GREEN].lam + DIV / 2), ePhoton(d.rows[GREEN].lam - DIV / 2)],
    },
    E0: { unit: 'eV', value: (d) => ePhoton(d.rows[0].lam) },
    E1: { unit: 'eV', value: (d) => ePhoton(d.rows[1].lam) },
    dEunc: { unit: 'eV', value: (d) => ePhoton(d.rows[0].lam - DIV / 2) - ePhoton(d.rows[0].lam) },
  },

  stated: {
    h: { value: 6.63, dp: 2, unit: 'J s (× 10⁻³⁴)', source: 'data booklet: h = 6.63 × 10⁻³⁴ J s' },
    c: { value: 3.0, dp: 2, unit: 'm s^-1 (× 10⁸)', source: 'data booklet: c = 3.00 × 10⁸ m s⁻¹' },
    e: { value: 1.6, dp: 2, unit: 'C (× 10⁻¹⁹)', source: 'data booklet: e = 1.60 × 10⁻¹⁹ C' },
    div: { value: DIV, dp: 0, unit: 'nm', source: 'smallest division of the scale' },
    smin: { value: SMIN, dp: 0, unit: 'nm', source: 'start of the part of the scale shown' },
    smax: { value: SMAX, dp: 0, unit: 'nm', source: 'end of the part of the scale shown' },
    major: { value: MAJOR, dp: 0, unit: 'nm', source: 'the scale is numbered every 20 nm' },
    half: { value: DIV / 2, dp: 1, unit: 'nm', source: 'half the smallest division' },
    E670: { value: 6.7, dp: 2, unit: 'eV', source: 'NIST: Hg 6s6p ¹P₁ level, 6.7036623 eV' },
    Eu: { value: 7.73, dp: 2, unit: 'eV', source: 'NIST: Hg 6s7s ³S₁ level, 7.7304551 eV', from: (p) => Math.round(p.Eu * 100) / 100 },
    y1: { value: 577.0, dp: 1, unit: 'nm', source: 'NIST: Hg I 576.9610 nm' },
    y2: { value: 579.1, dp: 1, unit: 'nm', source: 'NIST: Hg I 579.0670 nm' },
    gap: { value: 2.1, dp: 1, unit: 'nm', source: '579.1 − 577.0 nm' },
  },

  intro: () => '<p>A student looks at a mercury vapour lamp through a handheld spectroscope. Bright lines of different colours are seen against '
    + 'a wavelength scale. The diagram shows part of the scale, with the three brightest lines in this part of the spectrum.</p>'
    + '<p>The second diagram shows some of the energy levels of a mercury atom.</p>',

  parts: (d) => {
    const [gLo, gHi] = d.r.EG.range;
    const lvl = [0, 1, 2].map((i) => d.dp(d.rows[i].El, 2));
    return [
      {
        label: 'a', marks: 2, ao: 'AO2',
        question: 'Read the wavelengths of the three lines from the scale.',
        markscheme: [
          `Violet ${d.dp(d.rows[0].lam, 0)} nm, blue ${d.dp(d.rows[1].lam, 0)} nm, green ${d.dp(d.rows[GREEN].lam, 0)} nm, each accepted within ±${d.stated('half')} nm: any two correct ✓`,
          'All three correct ✓',
        ],
      },
      {
        label: 'b', marks: 1, ao: 'AO1',
        question: 'State the absolute uncertainty in each of your readings.',
        markscheme: [`$\\pm ${d.stated('half')}\\ \\text{nm}$: half the smallest division (${d.stated('div')} nm) of the scale ✓`],
      },
      {
        label: 'c', marks: 2, ao: 'AO2',
        question: 'Calculate the energy, in eV, of a photon of the green light.',
        numeric: d.num('EG'),
        markscheme: [
          `$E = \\dfrac{hc}{\\lambda} = \\dfrac{${d.stated('h')} \\times 10^{-34} \\times ${d.stated('c')} \\times 10^{8}}{${d.dp(d.rows[GREEN].lam, 0)} \\times 10^{-9}}$ J ✓`,
          `÷ $${d.stated('e')} \\times 10^{-19}$: $E = ${d.dp(d.r.EG.value, 2)}\\ \\text{eV}$ (accept ${d.dp(gLo, 2)} to ${d.dp(gHi, 2)} eV) ✓`,
        ],
      },
      {
        label: 'd', marks: 2, ao: 'AO3',
        asks: { conclusion: ['is correct', 'the same upper level'] },
        question: 'A student suggests that all three lines are emitted by atoms falling from one and the same energy level. Deduce, using the energy levels, whether the suggestion is correct.',
        markscheme: [
          `Photon energies about ${d.dp(d.r.E0.value, 2)}, ${d.dp(d.r.E1.value, 2)} and ${d.dp(d.r.EG.value, 2)} eV (each uncertain by about ±${d.dp(d.r.dEunc.value, 2)} eV) ✓`,
          `These match ${d.stated('Eu')} − ${lvl[0]}, ${d.stated('Eu')} − ${lvl[1]} and ${d.stated('Eu')} − ${lvl[2]} eV: all three are transitions from the ${d.stated('Eu')} eV level, so the suggestion is correct (no other pair of levels gives these energies) ✓`,
        ],
      },
      {
        label: 'e', marks: 1, ao: 'AO3',
        asks: { conclusion: ['read as one line'] },
        question: `Beyond the part of the scale shown, the mercury spectrum has two yellow lines, at ${d.stated('y1')} nm and ${d.stated('y2')} nm. `
          + 'Deduce whether readings from this scale could show that there are two lines.',
        markscheme: [`No: they are only ${d.stated('gap')} nm apart, less than the reading uncertainty of ±${d.stated('half')} nm (and less than one ${d.stated('div')} nm division), so they would be read as one line ✓`],
      },
    ];
  },
};

// Energy levels as horizontal lines, evenly spaced (not to scale) so that close levels stay readable on a phone.
function levelDiagram(alt, levels) {
  const top = 30;
  const step = 40;
  const body = levels.map((lv, i) => {
    const y = top + step * (levels.length - 1 - i);
    return `<line class="l3" x1="40" y1="${y}" x2="260" y2="${y}"/>${label(272, y + 6, lv.text, { anchor: 'start', size: 16 })}`;
  });
  return `<svg viewBox="0 0 480 ${top + step * (levels.length - 1) + 20}" role="img" aria-label="${escapeAttr(alt)}">${body.join('')}</svg>`;
}
