// E2-P01: photoelectric effect, stopping voltage against frequency (threshold, h from the gradient, work function).
export default {
  id: 'E2-P01',
  title: 'Photoelectric effect: stopping voltage against frequency',
  type: 'short',
  level: 'HL',
  difficulty: 2,
  topics: ['E.2'],
  batch: 'batch-1',
  batchRule: 'inspect-all',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the E.2 understandings (threshold frequency, Einstein\'s equation, what the wave model cannot explain). The graph is our own, drawn from an experimental value of h slightly below the accepted one, so the gradient must be used rather than the data booklet value.',
  },
  given: {
    f0: { value: 5.5e14, sf: 2, unit: 'Hz', range: [4e14, 1.2e15], what: 'threshold frequency (the graph\'s intercept)' },
    hg: { value: 6.4e-34, sf: 2, unit: 'J s', range: [6.0e-34, 7.0e-34], what: 'value of h the graph was drawn with (an experimental result)' },
  },
  literals: {
    '2.0': 'a point read from the graph, (10.5, 2.0), used as an example in the mark scheme',
    '10.5': 'the same example point read from the graph',
    '5.5': 'the intercept read from the graph',
    '2.3': 'the work function using the data booklet value of h (6.63e-34 × 5.5e14 / 1.60e-19 = 2.28 eV)',
  },
  calc: (v, K) => {
    const grad = v.hg / K.e;
    return {
      f0_read: { value: v.f0, unit: 'Hz', sf: 2 },
      grad: { value: grad, unit: 'V s', sf: 2 },
      hexp: { value: grad * K.e, unit: 'J s', sf: 2, range: [6.0e-34, 7.0e-34] },
      phi: { value: v.hg * v.f0, unit: 'eV', sf: 3, range: [1.5, 6] },
      wrong_hexp: { value: grad, unit: 'J s', sf: 2 }, // forgot to multiply the gradient by e
      wrong_booklet: { value: K.h, unit: 'J s', sf: 3 }, // quoted the data booklet value instead of using the graph
    };
  },
  stem: '<p>In an experiment on the photoelectric effect, monochromatic light falls on a metal surface. For each frequency $f$ of the light, the stopping voltage $V_{\\text{s}}$ is measured: the smallest potential difference that stops all the emitted electrons from reaching the collecting electrode. The graph shows the results.</p>',
  diagram: { file: 'questions/diagrams/p2-e2-stopping.svg', large: true, alt: 'Graph of stopping voltage in volts against frequency in units of 10 to the 14 hertz, from 4 to 11. Five measured points lie on a straight line that meets the frequency axis at 5.5 and rises to 2.0 volts at 10.5 and 2.2 volts at 11.' },
  parts: [
    {
      label: 'a', command: 'Outline', marks: 2, syllabus: ['E.2.H1', 'E.2.H2'],
      question: 'Below a certain frequency, no electrons are emitted however bright the light is. Outline why this observation supports a particle model of light rather than a wave model.',
      markscheme: [
        'In the wave model, energy arrives continuously, so bright enough light of any frequency should eventually release electrons ✓',
        'In the photon model, each electron absorbs the energy of one photon, $E = hf$; below the threshold frequency one photon has less energy than the work function, whatever the number of photons ✓',
      ],
      examinerNote: 'One mark for what the wave model predicts, one for the photon explanation (one photon, one electron; photon energy depends on frequency only).',
    },
    {
      label: 'b', command: 'State', marks: 1, syllabus: ['E.2.H2', 'T.4'],
      question: 'State the threshold frequency of the metal.',
      numeric: { result: 'f0_read', accept: 0.03 },
      markscheme: ['$f_0 = [[f0]]$ (the intercept on the frequency axis) ✓'],
      examinerNote: 'Read where the line meets the frequency axis, remembering the axis unit of 10^14 Hz.',
    },
    {
      label: 'c', command: 'Determine', marks: 3, syllabus: ['E.2.H3', 'T.4'],
      question: 'Determine, using the graph, a value for the Planck constant.',
      numeric: { result: 'hexp', accept: 0.03, mistakes: [{ result: 'wrong_hexp', feedback: 'The gradient of the graph is h/e, not h: multiply it by the elementary charge.' }, { result: 'wrong_booklet', feedback: 'That is the data booklet value. The question asks for the value this experiment gives: use the gradient of the graph.' }] },
      markscheme: [
        '$eV_{\\text{s}} = hf - \\Phi$, so the gradient of the graph is $\\dfrac{h}{e}$ ✓',
        'gradient read from the line, e.g. $\\dfrac{2.0 - 0}{(10.5 - 5.5) \\times 10^{14}} = [[grad:2u]]$ ✓',
        '$h = [[grad:2]] \\times [[K.e]] = [[hexp:2u]]$ ✓',
        'Accept [[hexp:lo]] to [[hexp:hi]] J s. Do not accept the data booklet value without a gradient.',
      ],
      examinerNote: 'Rearranging Einstein\'s equation: V_s = (h/e) f − Φ/e. The line passes through grid points (5.5, 0) and (10.5, 2.0). The experimental h is about 3 % below the accepted value, as in many real experiments.',
    },
    {
      label: 'd', command: 'Calculate', marks: 2, syllabus: ['E.2.H3'], dependsOn: ['b', 'c'],
      question: 'Calculate the minimum energy, in eV, needed to remove an electron from this surface.',
      numeric: { result: 'phi', accept: 0.05 },
      markscheme: [
        '$\\Phi = hf_0$ ✓',
        '$\\Phi = [[phi:3u]]$ ✓',
        'Allow ECF from (b) and (c); allow the data booklet value of $h$ (giving about 2.3 eV); accept [[phi:lo]] to [[phi:hi]] eV',
      ],
      examinerNote: 'Either the graph value of h or the booklet value is fine: the intercept on the voltage axis (extended) also gives −Φ/e.',
    },
    {
      label: 'e', command: 'Explain', marks: 2, syllabus: ['E.2.H3', 'E.2.H1'],
      question: 'The intensity of the light is doubled while its frequency stays the same. Explain the effect, if any, on the stopping voltage.',
      markscheme: [
        'No change in the stopping voltage ✓',
        'The maximum kinetic energy of the electrons depends only on the photon energy ($hf$) and the work function; more intense light means more photons per second, so more electrons per second, not more energetic electrons ✓',
      ],
      examinerNote: 'The second mark needs the reason, not just "no change". Mention of a larger photocurrent is fine but not required.',
    },
  ],
};
