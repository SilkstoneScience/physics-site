// A2-P01: a crate on a rough floor pulled by an elastic cord (free-body diagram, Hooke's law, static and dynamic friction).
export default {
  id: 'A2-P01',
  title: 'Crate pulled by an elastic cord',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['A.2'],
  sections: ['contact', 'forces', 'first'],
  batch: 'batch-3',
  situation: 'wooden crate on a rough floor pulled by an elastic cord',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the A.2 syllabus (free-body diagrams, Newton\'s first law, F ≤ μs N and F = μd N, Hooke\'s law). The elastic cord whose extension is read at the moment of sliding and again at constant velocity is our own set-up, chosen so that the two frictional regimes are seen through the cord\'s extension; all numbers and the examiner\'s diagram are our own.',
  },
  given: {
    m: { value: 45, sf: 2, unit: 'kg', range: [10, 200], what: 'mass of the crate' },
    k: { value: 1200, sf: 2, unit: 'N m^-1', range: [200, 5000], what: 'spring constant of the elastic cord' },
    xs: { value: 14.5, sf: 3, unit: 'cm', range: [2, 40], what: 'extension of the cord when the crate starts to slide' },
    xd: { value: 11.0, sf: 3, unit: 'cm', range: [1, 40], what: 'extension of the cord while the crate slides at constant velocity' },
  },
  calc: (v, K) => {
    const Fs = v.k * v.xs;
    const Fd = v.k * v.xd;
    const N = v.m * K.g;
    return {
      Fs: { value: Fs, unit: 'N', sf: 3, range: [20, 2000] },
      Fd: { value: Fd, unit: 'N', sf: 3, range: [10, 2000] },
      N: { value: N, unit: 'N', sf: 3 },
      mud: { value: Fd / N, unit: '', sf: 2, range: [0.05, 0.9] },
      x2: { value: 2 * v.xd, unit: 'cm', sf: 3 },
      wrong_Fs: { value: v.k * v.xs * 100, unit: 'N', sf: 3 }, // extension left in cm
      wrong_mud: { value: Fs / N, unit: '', sf: 2 }, // used the extension at which sliding starts (maximum static friction)
    };
  },
  calcLiterals: { 100: 'centimetres in a metre, for the common wrong answer that leaves the extension in cm' },
  stem: '<p>A wooden crate of mass [[m]] rests on a rough, horizontal concrete floor. A horizontal elastic cord of spring constant [[k]] is attached to the crate and pulled so that its extension increases slowly. The crate stays at rest until the extension of the cord reaches [[xs]], when it starts to slide. The cord is then pulled so that the crate slides at constant velocity; the extension of the cord is now [[xd]]. The cord obeys Hooke\'s law throughout.</p>',
  diagram: { file: 'questions/diagrams/p2-a2-crate.svg', alt: 'Side view of a wooden crate resting on a rough concrete floor. A horizontal elastic cord, drawn stretched, runs from the right side of the crate to a hand pulling it to the right. No forces are drawn. Not to scale.' },
  parts: [
    {
      label: 'a', sections: ['forces', 'contact'], command: 'Draw', marks: 2, syllabus: ['A.2.2', 'A.2.3'],
      question: 'Draw a free-body diagram of the crate while it slides at constant velocity.',
      markscheme: [
        'weight vertically downwards and normal force vertically upwards, drawn from the crate with equal lengths and labelled ✓',
        'tension (pull of the cord) horizontally in the direction of motion and friction horizontally against it, with equal lengths and labelled ✓',
        'Note: examiner\'s diagram. <img src="questions/diagrams/p2-a2-crate-ms.svg" alt="Free-body diagram of the crate drawn as a small square: blue arrows of equal length point down (weight W) and up (normal force N); shorter orange arrows of equal length point right (tension T) and left (friction Ff)" style="display:block;max-width:100%;height:auto;background:#fff;border-radius:8px;padding:6px;margin-top:6px">',
        'Do not accept a forward "force of motion" or arrows that do not start on the crate; the horizontal pair should be noticeably shorter than the vertical pair',
      ],
      examinerNote: 'Constant velocity means translational equilibrium, so the two pairs balance. Forces on the crate only (not the force of the crate on the floor). The guide asks for commonly accepted names or symbols as labels.',
    },
    {
      label: 'b', sections: ['contact'], command: 'Calculate', marks: 2, syllabus: ['A.2.5', 'A.2.4'],
      question: 'Calculate the force exerted by the cord on the crate at the moment it starts to slide.',
      numeric: { result: 'Fs', accept: 0.02, mistakes: [{ result: 'wrong_Fs', feedback: 'The extension must be in metres before using F = kΔx: convert the centimetres.' }] },
      markscheme: [
        '$F = k \\Delta x = [[k:n]] \\times [[xs:n]] \\times 10^{-2}$ ✓',
        '$F = [[Fs:3u]]$ ✓',
      ],
      examinerNote: 'Hooke\'s law with the extension converted to metres. This force equals the maximum static friction on the crate.',
    },
    {
      label: 'c', sections: ['contact', 'first'], command: 'Determine', marks: 3, syllabus: ['A.2.4', 'A.2.1', 'A.2.5'],
      question: 'Determine $\\mu_d$, the coefficient of dynamic friction for the crate sliding on the concrete floor.',
      numeric: { result: 'mud', accept: 0.03, mistakes: [{ result: 'wrong_mud', feedback: 'While the crate slides, the friction equals the pull at constant velocity, not the pull at the moment it started to move. Use the smaller extension.' }] },
      markscheme: [
        'at constant velocity the resultant force is zero, so friction $= $ tension $= [[k:n]] \\times [[xd:n]] \\times 10^{-2} = [[Fd:3u]]$ ✓',
        'normal force $= $ weight $= [[m:n]] \\times [[K.g]] = [[N:3u]]$ ✓',
        '$\\mu_d = \\dfrac{F_f}{F_N} = \\dfrac{[[Fd:3]]}{[[N:3]]} = [[mud:2]]$ ✓',
        'Accept [[mud:lo]] to [[mud:hi]]. Award [2 max] for [[wrong_mud:2]] (the extension at which sliding begins used: that gives the maximum static friction, not the dynamic friction)',
      ],
      examinerNote: 'Newton\'s first law horizontally (friction = tension) and vertically (normal force = weight), then F = μd FN.',
    },
    {
      label: 'd', sections: ['contact'], command: 'Explain', marks: 2, syllabus: ['A.2.4', 'A.2.5'],
      question: 'Explain why the extension of the cord while the crate slides at constant velocity is smaller than its extension at the moment the crate starts to slide.',
      markscheme: [
        'the dynamic friction force is smaller than the maximum static friction force ✓',
        'at constant velocity the tension equals the (smaller) dynamic friction, and by Hooke\'s law a smaller tension means a smaller extension ✓',
      ],
      examinerNote: 'Two points: μd FN < μs FN (the surfaces grip less once sliding), and F = kΔx links the smaller tension to the smaller extension.',
    },
    {
      label: 'e', sections: ['contact'], command: 'Predict', marks: 1, syllabus: ['A.2.4', 'A.2.3'],
      question: 'A second identical crate is placed on top of the first. Predict, without calculation, the extension of the cord when the two crates slide together at constant velocity.',
      markscheme: ['the normal force doubles, so the friction doubles and the extension doubles to [[x2:3u]] ✓'],
      examinerNote: 'Friction is proportional to the normal force (same μd, same floor): twice the weight pressing down needs twice the pull. "It doubles" with a reason earns the mark.',
    },
  ],
};
