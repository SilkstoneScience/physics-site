// C1-P01: a cylindrical fishing float bobbing vertically in still water (SHM from the extra buoyancy force).
export default {
  id: 'C1-P01',
  title: 'Fishing float bobbing in still water',
  type: 'short',
  level: 'HL',
  difficulty: 2,
  topics: ['C.1', 'A.2'],
  sections: ['graphs', 'shm', 'phase', 'energy-hl', 'describing'],
  batch: 'batch-3',
  situation: 'cylindrical fishing float bobbing vertically in still water after being pushed down',
  literals: { 1.6: 'the time span of the velocity–time sketch (two cycles)' },
  calcLiterals: { 100: 'the common slip of leaving the amplitude in centimetres' },
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the C.1 understandings (conditions for SHM, reading amplitude and period from a graph, v = ωx₀, the AHL energy equation) and A.2.7 (buoyancy force = weight of fluid displaced). The floating cylinder is a classic SHM system, but the fishing float, the graph, the numbers and the sequence of parts (graph reading → why SHM → maximum speed → velocity–time sketch → kinetic energy) are our own. It avoids the mass–spring and horizontal-oscillator set-ups of the hand-written C1-017 and C1-018. The values are consistent with a real float: a mass of 24 g and a period of 0.80 s need a cross-sectional area of 1.5 cm² (diameter about 1.4 cm).',
  },
  given: {
    x0: { value: 2.0, sf: 2, unit: 'cm', range: [0.5, 10], what: 'amplitude of the oscillation, read from the graph' },
    T: { value: 0.80, sf: 2, unit: 's', range: [0.2, 3], what: 'period of the oscillation, read from the graph' },
    m: { value: 24, sf: 2, unit: 'g', range: [2, 200], what: 'mass of the float' },
    x1: { value: 1.0, sf: 2, unit: 'cm', range: [0.1, 10], what: 'displacement at which the kinetic energy is found' },
  },
  calc: (v) => {
    const omega = 2 * Math.PI / v.T;
    const vmax = omega * v.x0;
    const Ek = v.m * omega ** 2 * (v.x0 ** 2 - v.x1 ** 2) / 2;
    return {
      omega: { value: omega, unit: 'rad s^-1', sf: 3 },
      vmax: { value: vmax, unit: 'm s^-1', sf: 3, range: [0.01, 5] },
      v1: { value: omega * Math.sqrt(v.x0 ** 2 - v.x1 ** 2), unit: 'm s^-1', sf: 3 },
      Ek: { value: Ek, unit: 'J', sf: 2, range: [1e-6, 1] },
      ET: { value: v.m * omega ** 2 * v.x0 ** 2 / 2, unit: 'J', sf: 2 },
      th: { value: v.T / 2, unit: 's', sf: 2 },
      tq: { value: v.T / 4, unit: 's', sf: 2 },
      wrong_vmax: { value: omega * v.x0 * 100, unit: 'm s^-1', sf: 3 }, // amplitude left in cm
      wrong_Ek: { value: v.m * omega ** 2 * v.x1 ** 2 / 2, unit: 'J', sf: 2 }, // potential energy at x1 instead of kinetic
    };
  },
  stem: '<p>A cylindrical fishing float of mass [[m]] floats upright in still water. An angler pushes the float down a short distance and releases it, and it then bobs up and down with simple harmonic motion. The graph shows how its displacement $x$ from the equilibrium position varies with time. $x$ is measured downwards, so it is positive when the float is lower than its equilibrium position. Resistive forces are negligible.</p>',
  diagram: { file: 'questions/diagrams/p2-c1-float.svg', large: true, alt: 'Graph of displacement x in centimetres against time in seconds, from 0 to 2.0 s, on a grid of 0.1 s by 0.5 cm. The curve is a cosine shape starting at its maximum of 2.0 cm at t = 0, crossing zero at 0.20 s, reaching −2.0 cm at 0.40 s and returning to 2.0 cm at 0.80 s and again at 1.60 s. Two and a half cycles are shown.' },
  parts: [
    {
      label: 'a', sections: ['graphs', 'describing'], command: 'Determine', marks: 2, syllabus: ['C.1.2'], noNumeric: true,
      question: 'Determine, from the graph, the amplitude and the period of the oscillation.',
      markscheme: [
        'amplitude $= [[x0]]$ ✓',
        'period $= [[T]]$ (one complete cycle, e.g. from the first peak at $t = 0$ to the next peak) ✓',
      ],
      examinerNote: 'Two values are asked for, so there is no typed answer. The period is the time between neighbouring peaks (or twice the time between neighbouring zero crossings), not the time to return to zero displacement.',
    },
    {
      label: 'b', sections: ['shm'], command: 'Explain', marks: 3, syllabus: ['C.1.1', 'A.2.7'],
      question: 'When the float is at rest at its equilibrium position, the buoyancy force on it equals its weight. Explain why the motion of the float after it is released is simple harmonic.',
      markscheme: [
        'when the float is pushed below equilibrium it displaces more water, so the buoyancy force is greater than the weight and the resultant force is upwards, towards the equilibrium position (and when it rises above equilibrium the buoyancy force is less than the weight, so the resultant force is downwards) ✓',
        'the extra buoyancy force equals the weight of the extra water displaced, $\\rho g A x$, which is proportional to the displacement $x$ because the float is a cylinder of constant cross-section ✓',
        'so the acceleration is proportional to the displacement and directed towards equilibrium / opposite to the displacement, which is the condition for SHM ($a = -\\omega^2 x$) ✓',
      ],
      examinerNote: 'Three separate points: the direction of the resultant force (towards equilibrium), its proportionality to the displacement (constant cross-section, A.2.7 buoyancy = weight of fluid displaced), and the SHM condition a ∝ −x. "The force is a restoring force" alone earns only the first mark.',
    },
    {
      label: 'c', sections: ['phase'], command: 'Calculate', marks: 2, syllabus: ['C.1.3', 'C.1.H2'], dependsOn: ['a'],
      question: 'Calculate the maximum speed of the float.',
      numeric: { result: 'vmax', accept: 0.04, mistakes: [{ result: 'wrong_vmax', feedback: 'The amplitude is in centimetres: convert it to metres before multiplying by ω.' }] },
      markscheme: [
        '$\\omega = \\dfrac{2\\pi}{T} = \\dfrac{2\\pi}{[[T:n]]} = [[omega:3u]]$ ✓',
        '$v_{\\max} = \\omega x_0 = [[omega:3]] \\times [[x0:n]] \\times 10^{-2} = [[vmax:3u]]$ ✓',
        'Allow ECF from (a); accept [[vmax:lo]] to [[vmax:hi]] $\\text{m s}^{-1}$',
      ],
      examinerNote: 'v = ωx₀ (the maximum of v = ωx₀ cos ωt, or v = ±ω√(x₀² − x²) at x = 0). The most common slip is leaving the amplitude in cm.',
    },
    {
      label: 'd', sections: ['graphs', 'phase'], command: 'Sketch', marks: 2, syllabus: ['C.1.H2', 'C.1.2'], dependsOn: ['c'],
      question: 'Sketch a graph to show how the velocity of the float varies with time from $t = 0$ to $t = 1.6$ s. Label the maximum and minimum values of the velocity.',
      markscheme: [
        'a sinusoidal curve with the same period as the displacement graph ([[T]]), zero at $t = 0$ and at every half period ([[th]]) after that, covering two cycles ✓',
        'the velocity is negative first (the float moves upwards after release, while $x$ is positive downwards), with the first minimum at $t = [[tq]]$, and the maximum and minimum labelled $\\pm$[[vmax:2u]] ✓',
        'Allow ECF from (c) for the labelled values. Award [1 max] for a correct sine shape of the right period that is inverted (positive first).',
        'Note: the examiner\'s sketch is shown below.<figure><img src="questions/diagrams/p2-c1-float-ms.svg" alt="Examiner\'s velocity–time graph: a negative sine curve starting at zero, reaching −0.16 metres per second at 0.20 s, zero at 0.40 s, +0.16 metres per second at 0.60 s, and repeating with a period of 0.80 s up to 1.6 s."></figure>',
      ],
      examinerNote: 'The velocity graph is the gradient of the displacement graph: a negative sine (x = x₀ cos ωt gives v = −ωx₀ sin ωt). Students sketch on paper and compare with the examiner\'s graph in the mark scheme.',
    },
    {
      label: 'e', sections: ['energy-hl'], command: 'Determine', marks: 2, syllabus: ['C.1.H3'], dependsOn: ['a', 'c'],
      question: 'Determine the kinetic energy of the float when its displacement is [[x1]].',
      numeric: { result: 'Ek', accept: 0.06, mistakes: [{ result: 'wrong_Ek', feedback: 'That is the potential energy at this displacement, ½mω²x². The kinetic energy is the total energy minus the potential energy: ½mω²(x₀² − x²).' }] },
      markscheme: [
        '$E_k = \\tfrac{1}{2} m\\omega^2 (x_0^2 - x^2) = \\tfrac{1}{2} \\times [[m:n]] \\times 10^{-3} \\times [[omega:3]]^2 \\times \\left[([[x0:n]] \\times 10^{-2})^2 - ([[x1:n]] \\times 10^{-2})^2\\right]$ ✓',
        '$E_k = [[Ek:2u]]$ ✓',
        'OR $v = \\omega\\sqrt{x_0^2 - x^2} = [[v1:3u]]$ ✓ then $E_k = \\tfrac{1}{2}mv^2 = [[Ek:2u]]$ ✓',
        'Allow ECF from (a) and (c); accept [[Ek:lo]] to [[Ek:hi]] J',
      ],
      examinerNote: 'Either the energy route (total ½mω²x₀² = 3.0 × 10⁻⁴ J minus potential ½mω²x²) or the speed at x from v = ±ω√(x₀² − x²). The mass must be in kg and the displacements in m.',
    },
  ],
};
