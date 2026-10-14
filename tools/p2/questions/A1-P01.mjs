// A1-P01: a package released from a descending drone (projectile launched below the horizontal).
export default {
  id: 'A1-P01',
  title: 'Package released from a descending drone',
  type: 'short',
  level: 'SL',
  difficulty: 3,
  topics: ['A.1'],
  batch: 'batch-1',
  batchRule: 'inspect-all',
  originality: {
    inspiredBy: 'Daily Questions/A.1 - Kinematics/Q46.png',
    transcript: 'p2-daily/A.1/Q46.txt',
    note: 'The Daily Question launches an object below the horizontal from a cliff (multiple choice, algebraic). Here a drone descending at an angle releases a package: a new context, numerical values, a quadratic for the time, and an air-resistance part. No wording reused.',
  },
  given: {
    v: { value: 12, sf: 2, unit: 'm s^-1', range: [3, 25], what: 'speed of the drone (and package) at release' },
    theta: { value: 20, sf: 2, unit: '°', range: [5, 45], what: 'angle of the drone\'s path below the horizontal' },
    h: { value: 35, sf: 2, unit: 'm', range: [10, 120], what: 'height of the package above the ground at release' },
  },
  calc: (v, K) => {
    const uy = v.v * Math.sin(v.theta); // downwards
    const vx = v.v * Math.cos(v.theta);
    const vyf = Math.sqrt(uy ** 2 + 2 * K.g * v.h);
    const t = (vyf - uy) / K.g;
    return {
      uy: { value: uy, unit: 'm s^-1', sf: 3 },
      vx: { value: vx, unit: 'm s^-1', sf: 3 },
      vyf: { value: vyf, unit: 'm s^-1', sf: 3 },
      t: { value: t, unit: 's', sf: 3, range: [0.5, 6] },
      x: { value: vx * t, unit: 'm', sf: 3, range: [2, 150] },
      wrong_t: { value: Math.sqrt(2 * v.h / K.g), unit: 's', sf: 3 }, // ignored the initial vertical velocity
      wrong_x: { value: v.v * t, unit: 'm', sf: 3 }, // used the speed, not its horizontal component
    };
  },
  stem: '<p>A delivery drone is flying in a straight line, descending at a constant speed of [[v]] along a path at [[theta]] below the horizontal. It releases a package when the package is [[h]] above level ground. Air resistance on the package is negligible unless stated.</p>',
  diagram: { file: 'questions/diagrams/p2-a1-drone.svg', alt: 'A drone moves down and to the right along a dashed straight path at an angle theta below the horizontal. At the moment of release the package has velocity v along the same direction. The height h of the package above the level ground is marked.' },
  parts: [
    {
      label: 'a', command: 'Show that', marks: 1, syllabus: ['A.1.7', 'T.6'],
      question: 'Show that the vertical component of the package\'s velocity at the moment of release is about [[uy:1u]].',
      showThat: { result: 'uy', sf: 1 },
      markscheme: ['$u_y = [[v:n]] \\sin [[theta]] = [[uy:3u]]$ ✓'],
      examinerNote: 'The package has the drone\'s velocity at release; resolve it. Needs the unrounded value or the working.',
    },
    {
      label: 'b', command: 'Determine', marks: 3, syllabus: ['A.1.7', 'A.1.5'], dependsOn: ['a'],
      question: 'Determine the time taken for the package to reach the ground.',
      numeric: { result: 't', accept: 0.03, mistakes: [{ result: 'wrong_t', feedback: 'The package already has a downward velocity when it is released, so it reaches the ground sooner than a package dropped from rest.' }] },
      markscheme: [
        '$[[h:n]] = [[uy:3]]\\,t + \\tfrac{1}{2} \\times [[K.g]] \\times t^2$ (taking downwards as positive) ✓',
        'OR final vertical speed $v_y = \\sqrt{[[uy:3]]^2 + 2 \\times [[K.g]] \\times [[h:n]]} = [[vyf:3u]]$ ✓',
        'solving for $t$, OR $t = \\dfrac{v_y - u_y}{g}$ ✓',
        '$t = [[t:3u]]$ ✓',
        'Allow ECF from (a); accept [[t:lo]] to [[t:hi]] s. Award [1 max] for $t = \\sqrt{2h/g}$ = [[wrong_t:3]] s (initial velocity ignored).',
      ],
      examinerNote: 'Either solve the quadratic in t, or find the final vertical speed first and use v = u + at. The initial downward velocity must be included.',
    },
    {
      label: 'c', command: 'Calculate', marks: 2, syllabus: ['A.1.7', 'T.6'], dependsOn: ['b'],
      question: 'Calculate the horizontal distance travelled by the package between release and landing.',
      numeric: { result: 'x', accept: 0.04, mistakes: [{ result: 'wrong_x', feedback: 'Only the horizontal component of the velocity carries the package sideways: use v cos θ, not v.' }] },
      markscheme: [
        '$v_x = [[v:n]] \\cos [[theta]] = [[vx:3u]]$ ✓',
        '$x = [[vx:3]] \\times [[t:3]] = [[x:3u]]$ ✓',
        'Allow ECF from (b); accept [[x:lo]] to [[x:hi]] m',
      ],
      examinerNote: 'Horizontal velocity is constant with no air resistance.',
    },
    {
      label: 'd', command: 'Outline', marks: 2, syllabus: ['A.1.8'],
      question: 'In practice, air resistance acts on the package. Outline how this affects the horizontal distance travelled by the package before it lands.',
      markscheme: [
        'Air resistance acts opposite to the package\'s velocity, so it has a horizontal component backwards / the horizontal velocity decreases during the fall ✓',
        'so the package travels a smaller horizontal distance / lands closer to the point below the release point ✓',
      ],
      examinerNote: 'Qualitative only (the guide limits A.1 calculations to no air resistance). The time of flight also increases slightly, but the decreasing horizontal speed dominates.',
    },
  ],
};
