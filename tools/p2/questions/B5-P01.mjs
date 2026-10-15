// B5-P01: a thermistor frost alarm (series circuit with a thermistor).
export default {
  id: 'B5-P01',
  title: 'Thermistor frost alarm',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['B.5'],
  batch: 'batch-1',
  batchRule: 'inspect-all',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the B.5 syllabus (thermistors as variable resistors, series circuits, power). The frost-alarm context and all numbers are our own; the term "potential divider" is avoided because the 2025 guide does not use it.',
  },
  given: {
    emf: { value: 9.0, sf: 2, unit: 'V', range: [1.5, 24], what: 'emf of the battery (negligible internal resistance)' },
    R: { value: 2.2, sf: 2, unit: 'kΩ', range: [0.1, 100], what: 'resistance of the fixed resistor' },
    RT: { value: 3.3, sf: 2, unit: 'kΩ', range: [0.1, 100], what: 'resistance of the thermistor at 0 °C' },
  },
  calc: (v) => {
    const I = v.emf / (v.R + v.RT);
    return {
      Rtot: { value: v.R + v.RT, unit: 'kΩ', sf: 2 },
      I: { value: I, unit: 'mA', sf: 3, range: [0.01, 100] },
      VT: { value: I * v.RT, unit: 'V', sf: 3 },
      P: { value: I ** 2 * v.R, unit: 'mW', sf: 3 },
      wrong_I: { value: v.emf / v.RT, unit: 'mA', sf: 3 }, // left out the fixed resistor
      wrong_P: { value: I ** 2 * (v.R + v.RT), unit: 'mW', sf: 3 }, // power in the whole circuit
    };
  },
  stem: '<p>A frost alarm uses a thermistor whose resistance increases as its temperature decreases. The thermistor is connected in series with a fixed resistor of resistance [[R]] and a battery of emf [[emf]] with negligible internal resistance. An ideal voltmeter measures the potential difference across the thermistor, which controls the alarm.</p>',
  diagram: { file: 'questions/diagrams/p2-b5-frost.svg', alt: 'Circuit diagram: a battery of emf epsilon, a fixed resistor R and a thermistor in one series loop. A voltmeter V is connected across the thermistor, with a label saying its output goes to the alarm.' },
  parts: [
    {
      label: 'a', command: 'State', marks: 2, syllabus: ['B.5.8'],
      question: 'The fixed resistor is a metal resistor that stays at a constant temperature. State and explain whether it is an ohmic conductor.',
      markscheme: [
        'It is ohmic ✓',
        'because at constant temperature its resistance is constant / the current in it is proportional to the potential difference across it ✓',
      ],
      examinerNote: 'The guide: a metal conductor at constant temperature is treated as ohmic. Award the second mark only with a reason, not for "ohmic" alone.',
    },
    {
      label: 'b', command: 'Calculate', marks: 2, syllabus: ['B.5.6', 'B.5.10'],
      question: 'At 0 °C the resistance of the thermistor is [[RT]]. Calculate, in mA, the current in the circuit at this temperature.',
      numeric: { result: 'I', accept: 0.03, mistakes: [{ result: 'wrong_I', feedback: 'The thermistor and the fixed resistor are in series: use the total resistance.' }] },
      markscheme: [
        'total resistance $= [[R:n]] + [[RT:n]] = [[Rtot:2u]]$ ✓',
        '$I = \\dfrac{[[emf:n]]}{[[Rtot:n]] \\times 10^{3}} = [[I:3u]]$ ✓',
      ],
      examinerNote: 'Series resistances add; I = ε / R_total with negligible internal resistance.',
    },
    {
      label: 'c', command: 'Show that', marks: 1, syllabus: ['B.5.6'],
      question: 'Show that the potential difference across the thermistor at 0 °C is about [[VT:2u]].',
      showThat: { result: 'VT', sf: 2 },
      markscheme: ['$V = IR_{\\text{T}}$ OR $V = \\dfrac{[[RT:n]]}{[[Rtot:n]]} \\times [[emf:n]] = [[VT:3u]]$ ✓'],
      examinerNote: 'V = IR for the thermistor (or the ratio of resistances times the emf).',
    },
    {
      label: 'd', command: 'Calculate', marks: 2, syllabus: ['B.5.9'], dependsOn: ['b'],
      question: 'Calculate, in mW, the power dissipated in the fixed resistor at 0 °C.',
      numeric: { result: 'P', accept: 0.04, mistakes: [{ result: 'wrong_P', feedback: 'That is the power in the whole circuit. Use the resistance of the fixed resistor only.' }] },
      markscheme: [
        '$P = I^2 R = ([[I:3]] \\times 10^{-3})^2 \\times [[R:n]] \\times 10^{3}$ ✓',
        '$P = [[P:3u]]$ ✓',
        'Allow ECF from (b); accept [[P:lo]] to [[P:hi]] mW',
      ],
      examinerNote: 'Any of the power equations for the fixed resistor (V across it = ε − 5.4 V also works).',
    },
    {
      label: 'e', command: 'Explain', marks: 3, syllabus: ['B.5.12', 'B.5.10', 'B.5.6'],
      question: 'The alarm sounds when the potential difference across the thermistor is greater than [[VT:2u]]. Explain why the alarm sounds when the temperature falls below 0 °C.',
      markscheme: [
        'As the temperature falls, the resistance of the thermistor increases (so the total resistance increases) ✓',
        'so the current decreases and the potential difference across the fixed resistor ($IR$) decreases ✓',
        'the emf is shared between the two components, so the potential difference across the thermistor increases above [[VT:2u]] ✓',
      ],
      examinerNote: 'A chain of reasoning: thermistor resistance up, current down, pd across R down, so pd across thermistor up (or: the thermistor gets a larger share of the emf because its share of the total resistance increases).',
    },
  ],
};
