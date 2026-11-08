// A1-P03: a jet of water from a fire hose (projectile launched from ground level; air resistance qualitatively).
export default {
  id: 'A1-P03',
  title: 'Water jet from a fire hose',
  type: 'short',
  level: 'SL',
  difficulty: 2,
  topics: ['A.1'],
  sections: ['projectiles', 'suvat', 'drag'],
  batch: 'batch-3',
  situation: 'water jet from a fire hose nozzle at ground level',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the A.1 syllabus (projectiles resolved into components, suvat, qualitative air resistance). A fire hose at ground level on level ground is our own context; numbers, parts and the examiner\'s sketch are our own. Unlike A1-P01 (a package released from a moving drone, launched below the horizontal) the jet is launched upwards from the ground, the question opens with the acceleration at the top and ends with a sketch, and the show-that is the maximum height. Air resistance appears only qualitatively (a sketch and an outline), inside the guide\'s limit for A.1: no calculation involves it.',
  },
  given: {
    u: { value: 18, sf: 2, unit: 'm s^-1', range: [8, 40], what: 'speed of the water leaving the nozzle' },
    theta: { value: 35, sf: 2, unit: '°', range: [15, 60], what: 'angle of the jet above the horizontal' },
  },
  calc: (v, K) => {
    const uy = v.u * Math.sin(v.theta);
    const ux = v.u * Math.cos(v.theta);
    const t = 2 * uy / K.g;
    return {
      uy: { value: uy, unit: 'm s^-1', sf: 3 },
      ux: { value: ux, unit: 'm s^-1', sf: 3 },
      H: { value: uy ** 2 / (2 * K.g), unit: 'm', sf: 2, range: [2, 30] },
      t: { value: t, unit: 's', sf: 3, range: [1, 6] },
      R: { value: ux * t, unit: 'm', sf: 3, range: [10, 120] },
      wrong_R: { value: v.u * t, unit: 'm', sf: 3 }, // used the speed instead of its horizontal component
      wrong_H: { value: v.u ** 2 / (2 * K.g), unit: 'm', sf: 2 }, // used the speed instead of its vertical component
    };
  },
  stem: '<p>Firefighters direct a jet of water from a hose. The water leaves the nozzle, which is at ground level, at a speed of [[u]] at an angle of [[theta]] above the horizontal and lands on level ground. Each drop of water moves as a projectile. Air resistance is negligible unless stated.</p>',
  diagram: { file: 'questions/diagrams/p2-a1-hose.svg', alt: 'A hose nozzle on level ground points up and to the right. An arrow labelled u shows the velocity of the water leaving the nozzle at an angle theta above the horizontal, and a curved blue line shows the path of the water, which comes back down to the ground further along. Not to scale.' },
  parts: [
    {
      label: 'a', sections: ['projectiles'], command: 'State', marks: 1, syllabus: ['A.1.7'],
      question: 'State the magnitude and direction of the acceleration of a drop of water at the highest point of its path.',
      markscheme: ['$[[K.g]]\\ \\text{m s}^{-2}$ vertically downwards ✓'],
      examinerNote: 'The acceleration is g throughout the flight, including at the top where the vertical velocity is zero. Both magnitude and direction are needed for the mark; "zero" earns nothing.',
    },
    {
      label: 'b', sections: ['projectiles', 'suvat'], command: 'Show that', marks: 2, syllabus: ['A.1.5', 'A.1.7'],
      question: 'Show that the maximum height reached by the water is about [[H:2u]].',
      showThat: { result: 'H', sf: 2 },
      markscheme: [
        'vertical component of the initial velocity $u_y = [[u:n]] \\sin [[theta]] = [[uy:3u]]$ ✓',
        'at the top $v_y = 0$, so $0 = u_y^2 - 2gH$ and $H = \\dfrac{[[uy:3]]^2}{2 \\times [[K.g]]} = [[H:3u]]$ ✓',
        'OR time to the top $= \\dfrac{[[uy:3]]}{[[K.g]]}$ s, then $H = u_y t - \\tfrac{1}{2} g t^2$ ✓',
      ],
      examinerNote: 'Resolve first, then v² = u² + 2as vertically (or find the time to the top and use s = ut + ½at²). The unrounded value must be seen for the second mark.',
    },
    {
      label: 'c', sections: ['projectiles', 'suvat'], command: 'Determine', marks: 2, syllabus: ['A.1.7', 'A.1.5'], dependsOn: ['b'],
      question: 'Determine the horizontal distance from the nozzle at which the water hits the ground.',
      numeric: { result: 'R', accept: 0.03, mistakes: [{ result: 'wrong_R', feedback: 'Only the horizontal component of the velocity carries the water along the ground: use u cos θ, not u.' }] },
      markscheme: [
        'time of flight $t = \\dfrac{2 u_y}{g} = \\dfrac{2 \\times [[uy:3]]}{[[K.g]]} = [[t:3u]]$ ✓',
        'horizontal distance $= u \\cos \\theta \\times t = [[ux:3]] \\times [[t:3]] = [[R:3u]]$ ✓',
        'Allow ECF from (b) if the time of flight is found from the maximum height; accept [[R:lo]] to [[R:hi]] m',
      ],
      examinerNote: 'The horizontal velocity is constant. The time of flight is twice the time to the top (or found from the height in (b): t = 2√(2H/g), which gives 31.0 m with H = 5.4 m).',
    },
    {
      label: 'd', sections: ['drag', 'projectiles'], command: 'Sketch', marks: 2, syllabus: ['A.1.8'],
      question: 'Sketch, on the same axes, the path of the water with negligible air resistance and the path of the water when air resistance is significant. Label the two paths.',
      markscheme: [
        'the path with air resistance has a lower maximum height and a shorter horizontal range than the path without ✓',
        'the path with air resistance is not symmetrical: it descends more steeply than it rises, so its highest point is nearer the landing point than the launch point ✓',
        'Note: examiner\'s sketch (blue: negligible air resistance; orange: significant air resistance). <img src="questions/diagrams/p2-a1-hose-ms.svg" alt="Two paths from the same launch point on the same axes: a symmetrical blue parabola, and a lower orange path that lands much closer to the launch point and drops more steeply than it rises" style="display:block;max-width:100%;height:auto;background:#fff;border-radius:8px;padding:6px;margin-top:6px">',
        'Accept a path without air resistance that is a symmetrical parabola; do not accept a path with air resistance that is symmetrical',
      ],
      examinerNote: 'The guide asks for the qualitative effect of fluid resistance on the trajectory, range and time of flight. A sketch that only shows a shorter range, with a symmetrical shape, earns the first mark only.',
    },
    {
      label: 'e', sections: ['drag'], command: 'Outline', marks: 2, syllabus: ['A.1.8'],
      question: 'Outline why air resistance reduces the horizontal distance travelled by the water.',
      anyOf: 2,
      markscheme: [
        'the resultant force on the water is no longer vertical: air resistance acts against the motion and so has a component opposite to the horizontal velocity ✓',
        'the horizontal velocity is therefore no longer constant but decreases during the flight, so less horizontal distance is covered in each second ✓',
        'air resistance also increases the downward deceleration on the way up, so the water does not rise as high and spends less time in the air ✓',
        'Any 2 from the points above',
      ],
      examinerNote: 'Two separate physics points: the force has a backward horizontal component (so the horizontal velocity falls), and the shorter time of flight. "It slows down" alone is not enough.',
    },
  ],
};
