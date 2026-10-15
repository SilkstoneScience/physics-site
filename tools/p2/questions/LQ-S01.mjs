// LQ-S01: a high-altitude weather balloon (buoyancy, gas laws, radio waves, terminal speed).
export default {
  id: 'LQ-S01',
  title: 'High-altitude weather balloon',
  type: 'linking',
  level: 'SL',
  difficulty: 2,
  topics: ['A.2', 'B.3', 'C.2', 'A.1', 'A.3', 'B.1'],
  batch: 'batch-1',
  batchRule: 'inspect-all',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank. Weather balloons carry radiosondes that transmit near 400 MHz; the context, the link between buoyancy and the gas laws in (a)(iii), and all numbers are our own.',
  },
  given: {
    V1: { value: 4.2, sf: 2, unit: 'm^3', range: [1, 10], what: 'volume of the balloon at launch' },
    m: { value: 3.1, sf: 2, unit: 'kg', range: [1, 6], what: 'total mass of balloon, helium and payload' },
    rho: { value: 1.2, sf: 2, unit: 'kg m^-3', range: [1.1, 1.3], what: 'density of air at ground level' },
    p1: { value: 1.01e5, sf: 3, unit: 'Pa', range: [9.5e4, 1.05e5], what: 'pressure of the helium at launch' },
    T1: { value: 15, sf: 2, unit: '°C', range: [-10, 35], what: 'temperature of the helium at launch' },
    p2: { value: 5.5e3, sf: 2, unit: 'Pa', range: [1e3, 3e4], what: 'pressure of the helium at the highest point' },
    T2: { value: -56, sf: 2, unit: '°C', range: [-80, -40], what: 'temperature of the helium at the highest point' },
    f: { value: 403, sf: 3, unit: 'MHz', range: [400, 406], what: 'frequency of the radio transmitter' },
    alt: { value: 20, sf: 2, unit: 'km', range: [10, 40], what: 'height of the balloon above the ground station' },
    dx: { value: 30, sf: 2, unit: 'km', range: [0, 200], what: 'horizontal distance of the balloon from the ground station' },
    mp: { value: 0.60, sf: 2, unit: 'kg', range: [0.2, 2], what: 'mass of the payload and parachute' },
    vt: { value: 5.0, sf: 2, unit: 'm s^-1', range: [3, 10], what: 'terminal speed of the payload' },
  },
  calc: (v, K) => {
    const Fb = v.rho * v.V1 * K.g;
    return {
      Fb: { value: Fb, unit: 'N', sf: 3 },
      W: { value: v.m * K.g, unit: 'N', sf: 3 },
      T1_K: { value: v.T1, unit: 'K', sf: 3 },
      T2_K: { value: v.T2, unit: 'K', sf: 3 },
      a: { value: (Fb - v.m * K.g) / v.m, unit: 'm s^-2', sf: 3, range: [0.5, 15] },
      V2: { value: v.V1 * (v.p1 / v.p2) * (v.T2 / v.T1), unit: 'm^3', sf: 3, range: [10, 300] },
      lambda: { value: K.c / v.f, unit: 'm', sf: 3 },
      dist: { value: Math.hypot(v.alt, v.dx), unit: 'km', sf: 3 },
      time: { value: Math.hypot(v.alt, v.dx) / K.c, unit: 's', sf: 3 },
      P: { value: v.mp * K.g * v.vt, unit: 'W', sf: 3 },
      wrong_a: { value: Fb / v.m, unit: 'm s^-2', sf: 3 }, // forgot the weight
      wrong_V2: { value: v.V1 * v.p1 / v.p2, unit: 'm^3', sf: 3 }, // ignored the temperature change
      wrong_time: { value: v.alt / K.c, unit: 's', sf: 3 }, // used the height only
    };
  },
  stem: '<p>A weather balloon is filled with helium and released from a ground station. It carries a payload of instruments and a radio transmitter. At launch the balloon has a volume of [[V1]] and the total mass of the balloon, helium and payload is [[m]]. The density of the air at ground level is [[rho]].</p>',
  parts: [
    {
      label: 'a(i)', command: 'Show that', marks: 2, syllabus: ['A.2.7'],
      question: 'Show that the buoyancy force on the balloon at launch is about [[Fb:2u]].',
      showThat: { result: 'Fb', sf: 2 },
      markscheme: [
        '$F_{\\text{b}} = \\rho V g$ (the weight of the air displaced) ✓',
        '$F_{\\text{b}} = [[rho:n]] \\times [[V1:n]] \\times [[K.g]] = [[Fb:3u]]$ ✓',
      ],
      examinerNote: 'Buoyancy equals the weight of the displaced air; the volume of the payload is negligible.',
    },
    {
      label: 'a(ii)', command: 'Calculate', marks: 2, syllabus: ['A.2.1', 'A.2.2'], dependsOn: ['a(i)'],
      question: 'Calculate the initial acceleration of the balloon.',
      numeric: { result: 'a', accept: 0.04, mistakes: [{ result: 'wrong_a', feedback: 'The resultant force is the buoyancy force minus the weight of the balloon and payload.' }] },
      markscheme: [
        'resultant force $= [[Fb:3]] - [[W:3]]$ (weight $= mg$) ✓',
        '$a = \\dfrac{F}{m} = [[a:3u]]$ ✓',
        'Allow ECF from (a)(i); accept [[a:lo]] to [[a:hi]] $\\text{m s}^{-2}$',
      ],
      examinerNote: 'Two forces at the instant of release (air resistance is zero at zero speed). Using the rounded 49 N gives 6.0 m s⁻², inside the accepted range.',
    },
    {
      label: 'a(iii)', command: 'Suggest', marks: 2, syllabus: ['A.2.7', 'B.3.4'],
      question: 'As the balloon rises, the density of the surrounding air decreases. The helium stays at the same pressure and temperature as the surrounding air. Suggest why the buoyancy force on the balloon stays about the same as it rises.',
      markscheme: [
        'The balloon expands as the air pressure falls, so the volume of air displaced increases ✓',
        'the density of the air and the volume of the balloon change in inverse proportion (both depend on $p/T$), so $\\rho V$, the mass of air displaced, and hence the buoyancy force stay about constant ✓',
      ],
      examinerNote: 'ρ_air ∝ p/T and V_helium ∝ T/p for a fixed amount of gas, so ρV is constant while the balloon can still stretch. A strong answer links the two ideas; one mark for the expansion alone.',
    },
    {
      label: 'b(i)', command: 'Calculate', marks: 2, syllabus: ['B.3.4', 'B.1.3'],
      question: 'At launch the helium has a pressure of [[p1]] and a temperature of [[T1]]. At the highest point of its flight the pressure of the helium is [[p2]] and its temperature is [[T2]]. Calculate the volume of the balloon at the highest point.',
      numeric: { result: 'V2', accept: 0.04, mistakes: [{ result: 'wrong_V2', feedback: 'The temperature also changes: use pV/T = constant with temperatures in kelvin.' }] },
      markscheme: [
        '$\\dfrac{p_1V_1}{T_1} = \\dfrac{p_2V_2}{T_2}$ with temperatures in kelvin ([[T1_K:3u]] and [[T2_K:3u]]) ✓',
        '$V_2 = [[V2:3u]]$ ✓',
        'Accept [[V2:lo]] to [[V2:hi]] $\\text{m}^{3}$. Award [1 max] for using Celsius temperatures.',
      ],
      examinerNote: 'Fixed amount of gas, so the combined gas law applies. Kelvin temperatures are essential.',
    },
    {
      label: 'b(ii)', command: 'State', marks: 1, syllabus: ['B.3.4'],
      question: 'State one assumption made in your calculation in (b)(i).',
      markscheme: [
        'no helium leaks out / the amount of gas is constant / helium behaves as an ideal gas / the helium is in thermal equilibrium with the air ✓',
      ],
      examinerNote: 'Any one sensible assumption.',
    },
    {
      label: 'b(iii)', command: 'Outline', marks: 2, syllabus: ['B.3.7', 'B.3.3'],
      question: 'Outline why helium is well described by the ideal gas model in these conditions.',
      markscheme: [
        'the pressure (density) is low, so the molecules are far apart compared with their size ✓',
        'the temperature is far above the boiling point of helium, so intermolecular forces are negligible compared with the kinetic energy of the molecules ✓',
      ],
      examinerNote: 'Real gases approach ideal behaviour at low pressure/density and high temperature (well above condensation).',
    },
    {
      label: 'c(i)', command: 'Calculate', marks: 1, syllabus: ['C.2.2', 'C.2.4'],
      question: 'The radio transmitter has a frequency of [[f]]. Calculate the wavelength of the radio waves.',
      numeric: { result: 'lambda', accept: 0.03 },
      markscheme: ['$\\lambda = \\dfrac{c}{f} = [[lambda:3u]]$ ✓'],
      examinerNote: 'Electromagnetic waves travel at c; convert MHz to Hz.',
    },
    {
      label: 'c(ii)', command: 'Calculate', marks: 2, syllabus: ['C.2.4', 'T.6'],
      question: 'At one moment the balloon is [[alt]] above the ground and [[dx]] horizontally from the ground station. <img src="questions/diagrams/p2-lqs01-signal.svg" alt="The ground station is on level ground. The balloon is [[alt]] vertically above a point on the ground that is [[dx]] horizontally from the station. Not to scale."> Calculate the time taken for the radio signal to reach the ground station.',
      numeric: { result: 'time', accept: 0.03, mistakes: [{ result: 'wrong_time', feedback: 'The signal travels in a straight line from the balloon to the station: find that distance with Pythagoras.' }] },
      markscheme: [
        'distance $= \\sqrt{[[alt:n]]^2 + [[dx:n]]^2} = [[dist:3u]]$ ✓',
        '$t = \\dfrac{d}{c} = [[time:3u]]$ ✓',
      ],
      examinerNote: 'Straight-line distance, then t = d/c.',
    },
    {
      label: 'c(iii)', command: 'Outline', marks: 2, syllabus: ['C.2.5', 'C.2.3'],
      question: 'Near the highest point the air is so thin that the sound of the balloon bursting would be very hard to detect, yet the radio signal is received without difficulty. Outline why.',
      markscheme: [
        'sound is a mechanical wave: it needs a medium, and with very few particles the vibrations are hardly passed on ✓',
        'radio waves are electromagnetic waves, which do not need a medium (they travel through a vacuum) ✓',
      ],
      examinerNote: 'The key contrast between mechanical and electromagnetic waves.',
    },
    {
      label: 'd(i)', command: 'Outline', marks: 2, syllabus: ['A.1.8', 'A.2.2'],
      question: 'When the balloon bursts, the payload falls back to the ground on a parachute. Outline why the payload reaches a terminal speed.',
      markscheme: [
        'air resistance (drag) increases as the speed of the payload increases ✓',
        'until it equals the weight, so the resultant force (and the acceleration) becomes zero and the speed stays constant ✓',
      ],
      examinerNote: 'Drag grows with speed until the forces balance (Newton\'s first law).',
    },
    {
      label: 'd(ii)', command: 'Calculate', marks: 2, syllabus: ['A.3.7', 'A.3.6'],
      question: 'The payload and parachute have a mass of [[mp]] and fall at a terminal speed of [[vt]]. Calculate the rate at which energy is transferred to the air as they fall at this speed.',
      numeric: { result: 'P', accept: 0.03 },
      markscheme: [
        'at terminal speed the drag force equals the weight, $mg$ (OR the loss of gravitational potential energy per second is $mgv$) ✓',
        '$P = Fv = [[mp:n]] \\times [[K.g]] \\times [[vt:n]] = [[P:3u]]$ ✓',
      ],
      examinerNote: 'Kinetic energy is constant, so all the gravitational potential energy lost each second is transferred to the air (internal energy) by the drag force.',
    },
  ],
};
