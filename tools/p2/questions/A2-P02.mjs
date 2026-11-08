// A2-P02: an airbag stops the head of a crash-test dummy (impulse from a force–time graph, momentum, Newton's third law).
export default {
  id: 'A2-P02',
  title: 'Airbag stopping the head of a crash-test dummy',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['A.2'],
  sections: ['momentum', 'third'],
  batch: 'batch-3',
  situation: 'crash-test dummy head stopped by an airbag, force-time graph',
  literals: { '0.5': 'the area of one small square of the grid (5 ms × 100 N)' },
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the A.2 syllabus (impulse as the area under a force–time graph, impulse = change in momentum, F = Δp/Δt, third-law pairs) with a vehicle-safety angle (aim 9). The graph is generated as a half-sine F = Fmax sin(πt/T) from the given peak force and contact time, so the exact area is 2FmaxT/π; the context, numbers and parts are our own.',
  },
  given: {
    Fmax: { value: 1600, sf: 2, unit: 'N', range: [500, 5000], what: 'peak force on the head (used to draw the graph)' },
    T: { value: 60, sf: 2, unit: 'ms', range: [20, 150], what: 'duration of the contact (used to draw the graph)' },
    m: { value: 4.5, sf: 2, unit: 'kg', range: [3, 6], what: 'mass of the dummy\'s head' },
  },
  calc: (v) => {
    const J = 2 * v.Fmax * v.T / Math.PI;
    return {
      J: { value: J, unit: 'N s', sf: 2, range: [20, 200] },
      v: { value: J / v.m, unit: 'm s^-1', sf: 2, range: [5, 30] },
      Favg: { value: J / v.T, unit: 'N', sf: 2 },
      wrong_J: { value: v.Fmax * v.T / 2, unit: 'N s', sf: 2 }, // treated the hump as a triangle
    };
  },
  stem: '<p>In a crash test, a car moving at constant velocity is stopped suddenly by a barrier. The head of the crash-test dummy in the driver\'s seat, of mass [[m]], continues to move forwards until it strikes the airbag, which brings it to rest. The graph shows how the force exerted by the airbag on the head varies with time during the contact.</p>',
  diagram: { file: 'questions/diagrams/p2-a2-airbag.svg', large: true, alt: 'Force in newtons against time in milliseconds, on a grid with small squares of 5 ms by 100 N and darker lines every 10 ms and 200 N. The curve is a smooth hump: zero at 0 ms, rising to a peak of about 1600 N at 30 ms, and falling back to zero at 60 ms. The time axis runs to 80 ms and the force axis to 2000 N.' },
  parts: [
    {
      label: 'a', sections: ['third'], command: 'State', marks: 1, syllabus: ['A.2.1'],
      question: 'The airbag exerts a force on the head. State the force that forms a Newton\'s third-law pair with this force.',
      markscheme: ['the force exerted by the head on the airbag, equal in magnitude and opposite in direction ✓'],
      examinerNote: 'Third-law pairs act on different bodies and are the same type of force. "The force of the seat belt" or "the weight of the head" earns nothing.',
    },
    {
      label: 'b', sections: ['momentum'], command: 'Estimate', marks: 3, syllabus: ['A.2.10', 'T.4'],
      question: 'Estimate, using the graph, the impulse given to the head by the airbag.',
      numeric: { result: 'J', accept: 0.10, mistakes: [{ result: 'wrong_J', feedback: 'The curve bulges above the straight lines from the ends to the peak, so the area is larger than that of a triangle. Count the squares under the curve, or use strips.' }] },
      markscheme: [
        'impulse $=$ the area under the force–time graph ✓',
        'area estimated by counting squares (each small square $= 0.5$ N s) OR by strips/trapezia OR as about two-thirds of peak force $\\times$ contact time ✓',
        'impulse $= [[J:2u]]$ ✓',
        'Accept [[J:lo]] to [[J:hi]] N s. Award [1 max] for $\\tfrac{1}{2} \\times [[Fmax:n]] \\times [[T:n]] \\times 10^{-3} = [[wrong_J:2]]$ N s (hump treated as a triangle)',
      ],
      examinerNote: 'The exact area of the generating half-sine is 2FmaxT/π = 61 N s (about 122 small squares). Square counting usually lands within 5 %; the accepted range is 10 %. The time axis is in milliseconds.',
    },
    {
      label: 'c', sections: ['momentum'], command: 'Determine', marks: 2, syllabus: ['A.2.9', 'A.2.11'], dependsOn: ['b'],
      question: 'Determine the speed of the head just before it strikes the airbag.',
      numeric: { result: 'v', accept: 0.10 },
      markscheme: [
        'impulse $=$ change in momentum $= mv$, since the head is brought to rest ✓',
        '$v = \\dfrac{[[J:2]]}{[[m:n]]} = [[v:3u]]$ ✓',
        'Allow ECF from (b); accept [[v:lo]] to [[v:hi]] $\\text{m s}^{-1}$',
      ],
      examinerNote: 'The impulse equals the loss of momentum of the head (its final velocity is zero). About 49 km/h, a typical crash-test speed.',
    },
    {
      label: 'd', sections: ['momentum'], command: 'Explain', marks: 3, syllabus: ['A.2.11', 'A.2.10', 'A.2.1'],
      question: 'Without an airbag, the head would strike the steering wheel and be stopped in a much shorter time. Explain, with reference to the graph, how the airbag reduces the risk of injury to the head.',
      markscheme: [
        'the change in momentum of the head, and so the impulse, is the same whether it is stopped by the airbag or by the steering wheel ✓',
        'the airbag increases the time over which the head is brought to rest ✓',
        'since $F = \\dfrac{\\Delta p}{\\Delta t}$, the force on the head is smaller: the graph for the steering wheel would be a taller, narrower hump with the same area ✓',
      ],
      examinerNote: 'Three separate points: same Δp, longer Δt, smaller F (with the graph interpretation). Mentioning that the force is spread over a larger area of the head is a bonus, not a substitute for the force argument.',
    },
  ],
};
