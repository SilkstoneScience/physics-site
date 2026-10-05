// Shared code used by every page: MathJax settings, the syllabus list,
// and the header, menu and footer.

// MathJax settings: $...$ for inline maths, $$...$$ for displayed equations.
window.MathJax = {
  tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
  // On narrow screens, break long displayed equations onto a new line instead of making them scroll.
  output: { displayOverflow: 'linebreak', linebreaks: { inline: true } },
};

// The syllabus. Edit here to rename a topic; menus and topic lists update everywhere.
// hl: true marks topics that are HL only (as in the IB guide's syllabus roadmap).
// hlExtra: true marks topics for everyone that also have additional HL content.
window.SYLLABUS = [
  { id: 'A', title: 'Space, time and motion', topics: [
    { id: 'A.1', title: 'Kinematics' },
    { id: 'A.2', title: 'Forces and momentum' },
    { id: 'A.3', title: 'Work, energy and power' },
    { id: 'A.4', title: 'Rigid body mechanics', hl: true },
    { id: 'A.5', title: 'Galilean and special relativity', hl: true },
  ] },
  { id: 'B', title: 'The particulate nature of matter', topics: [
    { id: 'B.1', title: 'Thermal energy transfers' },
    { id: 'B.2', title: 'Greenhouse effect' },
    { id: 'B.3', title: 'Gas laws' },
    { id: 'B.4', title: 'Thermodynamics', hl: true },
    { id: 'B.5', title: 'Current and circuits' },
  ] },
  { id: 'C', title: 'Wave behaviour', topics: [
    { id: 'C.1', title: 'Simple harmonic motion', hlExtra: true },
    { id: 'C.2', title: 'Wave model' },
    { id: 'C.3', title: 'Wave phenomena', hlExtra: true },
    { id: 'C.4', title: 'Standing waves and resonance' },
    { id: 'C.5', title: 'Doppler effect', hlExtra: true },
  ] },
  { id: 'D', title: 'Fields', topics: [
    { id: 'D.1', title: 'Gravitational fields', hlExtra: true },
    { id: 'D.2', title: 'Electric and magnetic fields', hlExtra: true },
    { id: 'D.3', title: 'Motion in electromagnetic fields' },
    { id: 'D.4', title: 'Induction', hl: true },
  ] },
  { id: 'E', title: 'Nuclear and quantum physics', topics: [
    { id: 'E.1', title: 'Structure of the atom', hlExtra: true },
    { id: 'E.2', title: 'Quantum physics', hl: true },
    { id: 'E.3', title: 'Radioactive decay', hlExtra: true },
    { id: 'E.4', title: 'Fission' },
    { id: 'E.5', title: 'Fusion and stars' },
  ] },
];

// "A.1" -> "a1.html"
window.topicFile = (id) => id.replace('.', '').toLowerCase() + '.html';

// Link to the full IB data booklet (a Google Drive share link, set to "Anyone with the link").
// Used by the "Σ Equations" panel and the Resources page. Leave empty until there is a link.
// Never put the PDF itself in this website folder: it is copyrighted and this folder is public.
window.DATA_BOOKLET_URL = 'https://drive.google.com/open?id=1vtP7efHOuywaeqp1YeYcqorHjxl5r49-&usp=drive_fs';

// Data-booklet equations for each topic, shown in the "Σ Equations" panel.
// Written from the 2025 IB Physics data booklet (same symbols); the labels are ours.
// Add a topic here when its notes page is written. Backslashes are doubled inside JS strings.
window.DATA_BOOKLET = {
  'A.1': {
    equations: [
      ['Displacement from the average velocity', 's = \\frac{u + v}{2}\\,t'],
      ['Velocity after time t', 'v = u + at'],
      ['Displacement after time t', 's = ut + \\tfrac{1}{2}at^2'],
      ['Linking velocity and displacement (no t)', 'v^2 = u^2 + 2as'],
    ],
    note: 'These four equations only apply when the acceleration is constant. $s$ = displacement, $u$ = initial velocity, $v$ = final velocity, $a$ = acceleration, $t$ = time.',
    constants: ['g'],
  },
  'A.2': {
    equations: [
      ['Static friction (maximum is μ<sub>s</sub>F<sub>N</sub>)', 'F_f \\le \\mu_s F_N'],
      ['Dynamic friction', 'F_f = \\mu_d F_N'],
      ["Hooke's law (elastic restoring force)", 'F_H = -kx'],
      ["Viscous drag on a small sphere (Stokes' law)", 'F_d = 6\\pi\\eta r v'],
      ['Buoyancy', 'F_b = \\rho V g'],
      ['Weight', 'F_g = mg'],
      ['Momentum', 'p = mv'],
      ['Impulse', 'J = F\\Delta t'],
      ["Newton's second law", 'F = ma = \\frac{\\Delta p}{\\Delta t}'],
      ['Centripetal acceleration', 'a = \\frac{v^2}{r} = \\omega^2 r = \\frac{4\\pi^2 r}{T^2}'],
      ['Speed in circular motion', 'v = \\frac{2\\pi r}{T} = \\omega r'],
    ],
    constants: ['g'],
  },
  'A.3': {
    equations: [
      ['Work done by a constant force', 'W = Fs\\cos\\theta'],
      ['Kinetic energy', 'E_k = \\tfrac{1}{2}mv^2 = \\frac{p^2}{2m}'],
      ['Change in gravitational potential energy (near the Earth)', '\\Delta E_p = mg\\Delta h'],
      ['Elastic potential energy', 'E_H = \\tfrac{1}{2}k(\\Delta x)^2'],
      ['Power', 'P = \\frac{\\Delta W}{\\Delta t} = Fv'],
      ['Efficiency (energy)', '\\eta = \\frac{\\text{useful work out}}{\\text{total work in}}'],
      ['Efficiency (power)', '\\eta = \\frac{\\text{useful power out}}{\\text{total power in}}'],
    ],
    note: '$\\theta$ is the angle between the force and the displacement. 1 kWh = 3.6 MJ.',
    constants: ['g'],
  },
  'A.4': {
    equations: [
      ['Torque', '\\tau = Fr\\sin\\theta', true],
      ['Angular displacement (constant α)', '\\Delta\\theta = \\frac{\\omega_f + \\omega_i}{2}\\,t', true],
      ['Final angular velocity', '\\omega_f = \\omega_i + \\alpha t', true],
      ['Angular displacement after time t', '\\Delta\\theta = \\omega_i t + \\tfrac{1}{2}\\alpha t^2', true],
      ['Linking ω and Δθ (no t)', '\\omega_f^2 = \\omega_i^2 + 2\\alpha\\Delta\\theta', true],
      ['Moment of inertia (point masses)', 'I = \\sum mr^2', true],
      ["Newton's second law for rotation", '\\tau = I\\alpha', true],
      ['Angular momentum', 'L = I\\omega', true],
      ['Angular impulse', '\\Delta L = \\tau\\Delta t = \\Delta(I\\omega)', true],
      ['Rotational kinetic energy', 'E_k = \\tfrac{1}{2}I\\omega^2 = \\frac{L^2}{2I}', true],
    ],
    note: 'All of A.4 is HL. Angles in radians. Moments of inertia of particular shapes (disc, sphere, rod…) are given in the question when needed.',
    constants: ['g'],
  },
  'A.5': {
    equations: [
      ['Galilean transformation', "x' = x - vt \\qquad t' = t", true],
      ['Galilean velocity addition', "u' = u - v", true],
      ['Lorentz factor', '\\gamma = \\frac{1}{\\sqrt{1 - \\frac{v^2}{c^2}}}', true],
      ['Lorentz transformation (position)', "x' = \\gamma(x - vt)", true],
      ['Lorentz transformation (time)', "t' = \\gamma\\left(t - \\frac{vx}{c^2}\\right)", true],
      ['Relativistic velocity addition', "u' = \\frac{u - v}{1 - \\frac{uv}{c^2}}", true],
      ['Space-time interval (invariant)', '(\\Delta s)^2 = (c\\Delta t)^2 - (\\Delta x)^2', true],
      ['Time dilation', '\\Delta t = \\gamma\\,\\Delta t_0', true],
      ['Length contraction', 'L = \\frac{L_0}{\\gamma}', true],
      ['World line angle on a space-time diagram', '\\tan\\theta = \\frac{v}{c}', true],
    ],
    note: 'All of A.5 is HL. $\\Delta t_0$ is the proper time (both events at the same place); $L_0$ is the proper length (measured at rest). The Lorentz equations also hold for intervals: $\\Delta x\' = \\gamma(\\Delta x - v\\Delta t)$.',
    constants: ['c'],
  },
  'B.1': {
    equations: [
      ['Density', '\\rho = \\frac{m}{V}'],
      ['Average kinetic energy of a particle', '\\overline{E}_k = \\tfrac{3}{2}k_B T'],
      ['Specific heat capacity', 'Q = mc\\Delta T'],
      ['Specific latent heat', 'Q = mL'],
      ['Rate of thermal energy transfer by conduction', '\\frac{\\Delta Q}{\\Delta t} = -kA\\frac{\\Delta T}{\\Delta x}'],
      ['Stefan–Boltzmann law (luminosity)', 'L = \\sigma A T^4'],
      ['Apparent brightness', 'b = \\frac{L}{4\\pi d^2}'],
      ["Wien's displacement law", '\\lambda_{\\max} T = 2.9 \\times 10^{-3}\\ \\text{m K}'],
    ],
    note: 'Always use kelvin in $\\overline{E}_k$, $L = \\sigma AT^4$ and Wien\'s law: $T/\\text{K} = \\theta/{}^\\circ\\text{C} + 273$. A temperature <em>change</em> $\\Delta T$ is the same in K and °C. The minus sign in the conduction equation just shows that energy flows towards the colder side.',
    constants: ['kB', 'sigma'],
  },
  'B.2': {
    equations: [
      ['Emissivity', 'e = \\frac{\\text{power radiated per unit area}}{\\sigma T^4}'],
      ['Albedo', '\\alpha = \\frac{\\text{total scattered power}}{\\text{total incident power}}'],
      ['Power radiated (from the emissivity)', 'P = e\\sigma AT^4'],
      ['Mean incoming solar intensity over the Earth', '\\frac{S}{4}'],
      ['Stefan–Boltzmann law (from B.1)', 'L = \\sigma AT^4'],
    ],
    note: 'Energy balance per square metre: $(1 - \\alpha)\\frac{S}{4} = e\\sigma T^4$. Only the first two equations are printed under B.2 in the data booklet; the others follow from them. Temperatures in kelvin.',
    constants: ['S', 'sigma'],
  },
  'B.3': {
    equations: [
      ['Pressure', 'P = \\frac{F}{A}'],
      ['Amount of substance', 'n = \\frac{N}{N_A}'],
      ['Fixed amount of gas', '\\frac{PV}{T} = \\text{constant}'],
      ['Ideal gas equation', 'PV = nRT = Nk_BT'],
      ['Pressure from molecular motion', 'P = \\tfrac{1}{3}\\rho\\overline{v^2}'],
      ['Internal energy of an ideal monatomic gas', 'U = \\tfrac{3}{2}Nk_BT = \\tfrac{3}{2}nRT'],
    ],
    note: 'Temperatures in kelvin, volumes in $\\text{m}^3$ ($1\\ \\text{litre} = 10^{-3}\\ \\text{m}^3$). Use $R$ with moles and $k_B$ with numbers of molecules.',
    constants: ['NA', 'R', 'kB'],
  },
  'B.4': {
    equations: [
      ['First law of thermodynamics', 'Q = \\Delta U + W', true],
      ['Work done by a gas (constant pressure)', 'W = P\\Delta V', true],
      ['Change in internal energy (monatomic ideal gas)', '\\Delta U = \\tfrac{3}{2}nR\\Delta T = \\tfrac{3}{2}Nk_B\\Delta T', true],
      ['Entropy change', '\\Delta S = \\frac{\\Delta Q}{T}', true],
      ['Entropy from microstates', 'S = k_B\\ln\\Omega', true],
      ['Adiabatic change (monatomic ideal gas)', 'PV^{\\frac{5}{3}} = \\text{constant}', true],
      ['Efficiency', '\\eta = \\frac{\\text{useful work}}{\\text{energy input}}', true],
      ['Carnot efficiency', '\\eta_{\\text{Carnot}} = 1 - \\frac{T_c}{T_h}', true],
    ],
    note: 'All of B.4 is HL. $Q$ is energy supplied <em>to</em> the gas; $W$ is work done <em>by</em> the gas (negative for a compression). Work done is the area under a p–V graph; the net work in a cycle is the area enclosed. Temperatures in kelvin.',
    constants: ['R', 'kB'],
  },
  'B.5': {
    equations: [
      ['Current', 'I = \\frac{\\Delta q}{\\Delta t}'],
      ['Potential difference', 'V = \\frac{W}{q}'],
      ['Resistance', 'R = \\frac{V}{I}'],
      ['Resistivity', '\\rho = \\frac{RA}{L}'],
      ['Electrical power', 'P = IV = I^2R = \\frac{V^2}{R}'],
      ['Series: current and p.d.', 'I = I_1 = I_2 = \\ldots \\quad V = V_1 + V_2 + \\ldots'],
      ['Series: resistance', 'R_s = R_1 + R_2 + \\ldots'],
      ['Parallel: current and p.d.', 'I = I_1 + I_2 + \\ldots \\quad V = V_1 = V_2 = \\ldots'],
      ['Parallel: resistance', '\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\ldots'],
      ['Emf and internal resistance', '\\varepsilon = I(R + r)'],
    ],
    note: 'Potential divider (not in the booklet): $V_{\\text{out}} = V_{\\text{in}}\\frac{R_2}{R_1 + R_2}$. Terminal p.d.: $V = \\varepsilon - Ir$. Ideal ammeters have zero resistance; ideal voltmeters have infinite resistance.',
    constants: ['e'],
  },
  'D.1': {
    equations: [
      ["Newton's law of gravitation", 'F = G\\frac{m_1m_2}{r^2}'],
      ['Gravitational field strength', 'g = \\frac{F}{m} = G\\frac{M}{r^2}'],
      ['Gravitational potential energy', 'E_p = -\\frac{Gm_1m_2}{r}', true],
      ['Gravitational potential', 'V_g = -\\frac{GM}{r}', true],
      ['Field strength and potential gradient', 'g = -\\frac{\\Delta V_g}{\\Delta r}', true],
      ['Work done moving a mass', 'W = m\\Delta V_g', true],
      ['Escape speed', 'v_{\\text{esc}} = \\sqrt{\\frac{2GM}{r}}', true],
      ['Orbital speed', 'v_{\\text{orbital}} = \\sqrt{\\frac{GM}{r}}', true],
    ],
    note: 'Measure $r$ from the centre of the mass. Kepler\'s third law, $T^2 = \\frac{4\\pi^2}{GM}r^3$, is not in the booklet: derive it from $\\frac{GMm}{r^2} = \\frac{mv^2}{r}$. HL: orbital energy $E = -\\frac{GMm}{2r}$.',
    constants: ['G', 'g'],
  },
  'D.2': {
    equations: [
      ["Coulomb's law", 'F = k\\frac{q_1q_2}{r^2}, \\quad k = \\frac{1}{4\\pi\\varepsilon_0}'],
      ['Electric field strength', 'E = \\frac{F}{q}'],
      ['Uniform field between parallel plates', 'E = \\frac{V}{d}'],
      ['Electric potential energy', 'E_p = k\\frac{q_1q_2}{r}', true],
      ['Electric potential', 'V_e = \\frac{kQ}{r}', true],
      ['Field strength and potential gradient', 'E = -\\frac{\\Delta V_e}{\\Delta r}', true],
      ['Work done moving a charge', 'W = q\\Delta V_e', true],
    ],
    note: 'Field from a point charge: $E = \\frac{kQ}{r^2}$. In a material, replace $\\varepsilon_0$ by its permittivity $\\varepsilon$. $1\\ \\text{eV} = 1.60 \\times 10^{-19}$ J.',
    constants: ['k', 'eps0', 'e'],
  },
  'D.3': {
    equations: [
      ['Force on a moving charge', 'F = qvB\\sin\\theta'],
      ['Force on a current-carrying conductor', 'F = BIL\\sin\\theta'],
      ['Force per unit length between parallel wires', '\\frac{F}{L} = \\mu_0\\frac{I_1I_2}{2\\pi r}'],
    ],
    note: 'Not in the booklet but derived from it: radius in a magnetic field $r = \\frac{mv}{qB}$; velocity selector $v = \\frac{E}{B}$; accelerating through a p.d. $\\frac{1}{2}mv^2 = qV$.',
    constants: ['e', 'me', 'mp', 'mu0'],
  },
  'D.4': {
    equations: [
      ['Magnetic flux', '\\Phi = BA\\cos\\theta', true],
      ["Faraday's law of induction", '\\varepsilon = -N\\frac{\\Delta\\Phi}{\\Delta t}', true],
      ['Emf induced in a moving straight conductor', '\\varepsilon = BvL', true],
    ],
    note: 'All of D.4 is HL. θ is the angle between B and the normal to the area. The minus sign is Lenz\'s law: the induced emf opposes the change of flux.',
  },
  'E.1': {
    equations: [
      ['Photon energy', 'E = hf'],
      ['Nuclear radius', 'R = R_0A^{1/3}', true],
      ['Energy levels of hydrogen (Bohr model)', 'E = -\\frac{13.6}{n^2}\\ \\text{eV}', true],
      ['Quantization of angular momentum', 'mvr = \\frac{nh}{2\\pi}', true],
    ],
    note: 'Also $c = f\\lambda$, so $E = \\frac{hc}{\\lambda}$. Photon energy equals the difference between two energy levels. $1\\ \\text{eV} = 1.60 \\times 10^{-19}$ J. HL closest approach (not in the booklet): $d = \\frac{k(2e)(Ze)}{E_k}$.',
    constants: ['h', 'c', 'e', 'R0'],
  },
  'E.2': {
    equations: [
      ['Photoelectric equation', 'E_{\\max} = hf - \\Phi', true],
      ['de Broglie wavelength', '\\lambda = \\frac{h}{p}', true],
      ['Compton shift', '\\Delta\\lambda = \\frac{h}{m_ec}(1 - \\cos\\theta)', true],
    ],
    note: 'All of E.2 is HL. Threshold frequency $f_0 = \\frac{\\Phi}{h}$. Stopping voltage: $eV_s = E_{\\max}$. For a particle accelerated through p.d. $V$: $p = \\sqrt{2meV}$. First diffraction minimum: $\\sin\\theta \\approx \\frac{\\lambda}{D}$.',
    constants: ['h', 'c', 'e', 'me'],
  },
  'E.3': {
    equations: [
      ['Mass–energy equivalence', 'E = mc^2'],
      ['Radioactive decay law', 'N = N_0e^{-\\lambda t}', true],
      ['Activity', 'A = \\lambda N = \\lambda N_0e^{-\\lambda t}', true],
      ['Half-life and decay constant', 'T_{1/2} = \\frac{\\ln 2}{\\lambda}', true],
    ],
    note: '$1\\ \\text{u} = 931.5\\ \\text{MeV}\\,c^{-2}$, so mass defect in u × 931.5 gives the binding energy in MeV. After $n$ half-lives the fraction left is $(\\frac{1}{2})^n$. Subtract background before halving a count rate.',
    constants: ['c', 'u', 'mp', 'mn', 'me', 'e'],
  },
  'E.4': {
    equations: [
      ['Mass–energy equivalence', 'E = mc^2'],
    ],
    note: 'Energy released $= \\Delta m\\,c^2$, where $\\Delta m$ = mass before − mass after (include every neutron). With masses in u, multiply $\\Delta m$ by 931.5 to get MeV. Power = energy per fission × fissions per second; efficiency = electrical ÷ thermal power.',
    constants: ['c', 'u', 'mn', 'e'],
  },
  'E.5': {
    equations: [
      ['Parallax distance', 'd\\,(\\text{parsec}) = \\frac{1}{p\\,(\\text{arc-second})}'],
      ['Stefan–Boltzmann law (luminosity)', 'L = \\sigma AT^4'],
      ['Apparent brightness', 'b = \\frac{L}{4\\pi d^2}'],
      ["Wien's displacement law", '\\lambda_{\\max} T = 2.9 \\times 10^{-3}\\ \\text{m K}'],
      ['Mass–energy equivalence', 'E = mc^2'],
    ],
    note: 'For a sphere $A = 4\\pi R^2$, so $R = \\sqrt{\\frac{L}{4\\pi\\sigma T^4}}$. Comparing with the Sun: $\\frac{R}{R_\\odot} = \\sqrt{\\frac{L}{L_\\odot}}\\left(\\frac{T_\\odot}{T}\\right)^2$. Use kelvin.',
    constants: ['sigma', 'c', 'u', 'au', 'ly', 'pc'],
  },
  // A third item `true` marks an equation as HL only (shown with an HL tag).
  'C.1': {
    equations: [
      ['Defining equation of SHM', 'a = -\\omega^2 x'],
      ['Period, frequency and angular frequency', 'T = \\frac{1}{f} = \\frac{2\\pi}{\\omega}'],
      ['Period of a mass–spring system', 'T = 2\\pi\\sqrt{\\frac{m}{k}}'],
      ['Period of a simple pendulum', 'T = 2\\pi\\sqrt{\\frac{l}{g}}'],
      ['Displacement', 'x = x_0\\sin(\\omega t + \\phi)', true],
      ['Velocity', 'v = \\omega x_0\\cos(\\omega t + \\phi)', true],
      ['Velocity at displacement x', 'v = \\pm\\,\\omega\\sqrt{x_0^2 - x^2}', true],
      ['Total energy', 'E_T = \\tfrac{1}{2}m\\omega^2 x_0^2', true],
      ['Potential energy', 'E_p = \\tfrac{1}{2}m\\omega^2 x^2', true],
    ],
    note: 'Use radians for $\\omega t + \\phi$.',
    constants: ['g'],
  },
  'C.2': {
    equations: [
      ['Wave speed', 'v = f\\lambda = \\frac{\\lambda}{T}'],
    ],
    note: 'Visible light: about 400 nm (violet) to 700 nm (red). The data booklet shows the wavelength range of each part of the EM spectrum.',
    constants: ['c'],
  },
  'C.4': {
    equations: [
      ['Wave speed (from C.2)', 'v = f\\lambda'],
    ],
    note: 'The data booklet has <strong>no</strong> standing-wave formulas. Work them out from a sketch: a whole number of half-wavelengths fits when both ends are the same (both nodes or both antinodes), and an odd number of quarter-wavelengths fits when one end is a node and the other an antinode.',
  },
  'C.5': {
    equations: [
      ['Doppler effect for light (v ≪ c)', '\\frac{\\Delta f}{f} = \\frac{\\Delta\\lambda}{\\lambda} \\approx \\frac{v}{c}'],
      ['Moving source (sound)', "f' = f\\left(\\frac{v}{v \\pm u_s}\\right)", true],
      ['Moving observer (sound)', "f' = f\\left(\\frac{v \\pm u_o}{v}\\right)", true],
    ],
    note: 'For light, $v$ is the relative speed of source and observer. For sound (HL), $v$ is the wave speed and $u_s$, $u_o$ are the speeds of the source and observer. Choose the sign that makes $f\'$ higher when they approach and lower when they separate.',
    constants: ['c'],
  },
  'C.3': {
    equations: [
      ["Snell's law", '\\frac{n_1}{n_2} = \\frac{\\sin\\theta_2}{\\sin\\theta_1} = \\frac{v_2}{v_1}'],
      ['Constructive interference', '\\text{path difference} = n\\lambda'],
      ['Destructive interference', '\\text{path difference} = \\left(n + \\tfrac{1}{2}\\right)\\lambda'],
      ["Young's double slit (fringe spacing)", 's = \\frac{\\lambda D}{d}'],
      ['Single slit: first minimum (θ in radians)', '\\theta = \\frac{\\lambda}{b}', true],
      ['Diffraction grating / multiple slits', 'n\\lambda = d\\sin\\theta', true],
    ],
    note: 'Angles are measured from the normal. $d$ = slit separation, $D$ = slit-to-screen distance, $b$ = slit width.',
    constants: ['c'],
  },
};
// Fundamental constants from the data booklet (add more as topics need them; check each value against the PDF).
window.CONSTANTS = {
  g: ["Acceleration of free fall (Earth's surface)", 'g = 9.8\\ \\text{m s}^{-2}'],
  c: ['Speed of light in a vacuum', 'c = 3.00 \\times 10^{8}\\ \\text{m s}^{-1}'],
  kB: ['Boltzmann constant', 'k_B = 1.38 \\times 10^{-23}\\ \\text{J K}^{-1}'],
  sigma: ['Stefan–Boltzmann constant', '\\sigma = 5.67 \\times 10^{-8}\\ \\text{W m}^{-2}\\,\\text{K}^{-4}'],
  NA: ['Avogadro constant', 'N_A = 6.02 \\times 10^{23}\\ \\text{mol}^{-1}'],
  R: ['Gas constant', 'R = 8.31\\ \\text{J K}^{-1}\\,\\text{mol}^{-1}'],
  e: ['Elementary charge', 'e = 1.60 \\times 10^{-19}\\ \\text{C}'],
  S: ['Solar constant', 'S = 1.36 \\times 10^{3}\\ \\text{W m}^{-2}'],
  G: ['Gravitational constant', 'G = 6.67 \\times 10^{-11}\\ \\text{N m}^2\\,\\text{kg}^{-2}'],
  k: ['Coulomb constant', 'k = 8.99 \\times 10^{9}\\ \\text{N m}^2\\,\\text{C}^{-2}'],
  eps0: ['Permittivity of free space', '\\varepsilon_0 = 8.85 \\times 10^{-12}\\ \\text{C}^2\\,\\text{N}^{-1}\\,\\text{m}^{-2}'],
  mu0: ['Permeability of free space', '\\mu_0 = 4\\pi \\times 10^{-7}\\ \\text{T m A}^{-1}'],
  me: ['Electron rest mass', 'm_e = 9.110 \\times 10^{-31}\\ \\text{kg}'],
  mp: ['Proton rest mass', 'm_p = 1.673 \\times 10^{-27}\\ \\text{kg}'],
  mn: ['Neutron rest mass', 'm_n = 1.675 \\times 10^{-27}\\ \\text{kg}'],
  h: ['Planck constant', 'h = 6.63 \\times 10^{-34}\\ \\text{J s}'],
  u: ['Unified atomic mass unit', '1\\ \\text{u} = 1.661 \\times 10^{-27}\\ \\text{kg} = 931.5\\ \\text{MeV}\\,c^{-2}'],
  R0: ['Fermi radius', 'R_0 = 1.20 \\times 10^{-15}\\ \\text{m}'],
  au: ['Astronomical unit', '1\\ \\text{AU} = 1.50 \\times 10^{11}\\ \\text{m}'],
  ly: ['Light year', '1\\ \\text{ly} = 9.46 \\times 10^{15}\\ \\text{m}'],
  pc: ['Parsec', '1\\ \\text{pc} = 3.26\\ \\text{ly}'],
};

(function () {
  const body = document.body;
  const root = body.dataset.root || '';
  const section = body.dataset.section || '';
  const hlTag = '<span class="tag hl">HL only</span>';
  const hlExtraTag = '<span class="tag hl">+ HL extra</span>';

  // ----- "Skip to content" link: hidden until a keyboard user presses Tab -----
  const mainEl = document.querySelector('main');
  if (mainEl) {
    if (!mainEl.id) mainEl.id = 'main';
    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#' + mainEl.id;
    skip.textContent = 'Skip to content';
    body.prepend(skip);
  }

  // ----- Header and menu -----
  const links = [
    ['themes', 'themes/index.html', 'Themes'],
    ['questions', 'questions.html', 'Question bank'],
    ['skills', 'skills.html', 'Skills'],
    ['experimental', 'experimental/index.html', 'Experimental programme'],
    ['ee', 'ee/index.html', 'Extended essay'],
    ['resources', 'resources.html', 'Resources'],
    ['about', 'about.html', 'About'],
  ];
  const header = document.getElementById('site-header');
  if (header) {
    header.className = 'site-header';
    header.innerHTML = `
      <div class="inner">
        <a class="brand" href="${root}index.html"><svg class="xyz-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 14V3M12 14L22 17M12 14L3 20"/><circle cx="12" cy="14" r="2.6"/></svg>Mr Silkstone's <span>Physics</span></a>
        <button class="menu-btn" aria-expanded="false" aria-controls="site-nav">Menu</button>
        <nav class="site-nav" id="site-nav" aria-label="Main">
          <ul>${links.map(([key, href, label]) =>
            `<li><a href="${root}${href}"${key === section ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}
          </ul>
        </nav>
      </div>`;
    const btn = header.querySelector('.menu-btn');
    const nav = header.querySelector('.site-nav');
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
  }

  // ----- Footer -----
  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.className = 'site-footer';
    footer.innerHTML = `<div class="inner">A study guide for IB Diploma Programme Physics students.
      This site is not produced or endorsed by the International Baccalaureate Organization.</div>`;
  }

  // ----- List of all themes: <div data-theme-list></div> -----
  document.querySelectorAll('[data-theme-list]').forEach((el) => {
    el.innerHTML = `<ul class="card-grid">${SYLLABUS.map((t) => `
      <li><a class="card" data-theme="${t.id}" href="${root}themes/${t.id.toLowerCase()}.html">
        <h3>Theme ${t.id}: ${t.title}</h3>
        <p>${t.topics.map((s) => s.id).join(' · ')}</p>
      </a></li>`).join('')}</ul>`;
  });

  // ----- Subtopics of one theme: <div data-topic-list="A"></div> -----
  document.querySelectorAll('[data-topic-list]').forEach((el) => {
    const theme = SYLLABUS.find((t) => t.id === el.dataset.topicList);
    if (!theme) return;
    el.innerHTML = `<ul class="card-grid">${theme.topics.map((s) => `
      <li><a class="card" data-theme="${theme.id}" href="${root}themes/${topicFile(s.id)}">
        <h3><span class="code">${s.id}</span>${s.title} ${s.hl ? hlTag : s.hlExtra ? hlExtraTag : ''}</h3>
      </a></li>`).join('')}</ul>`;
  });

  // ----- Previous / next links on subtopic pages: <body data-topic="A.1"> + <nav id="topic-nav"> -----
  const topicNav = document.getElementById('topic-nav');
  if (topicNav && body.dataset.topic) {
    const all = SYLLABUS.flatMap((t) => t.topics);
    const i = all.findIndex((s) => s.id === body.dataset.topic);
    const prev = all[i - 1];
    const next = all[i + 1];
    topicNav.className = 'topic-nav';
    topicNav.innerHTML =
      (prev ? `<a class="card" href="${topicFile(prev.id)}">← ${prev.id} ${prev.title}</a>` : '<span></span>') +
      (next ? `<a class="card next" href="${topicFile(next.id)}">${next.id} ${next.title} →</a>` : '');
  }

  // ----- "Joke of the day" box on the home page: <section id="joke">, jokes from js/jokes.js -----
  const jokeBox = document.getElementById('joke');
  if (jokeBox && window.JOKES && JOKES.length) {
    const q = jokeBox.querySelector('.joke-q');
    const a = jokeBox.querySelector('.joke-a');
    const reveal = jokeBox.querySelector('.joke-reveal');
    let current = -1;
    // Remember the last joke shown (on this device only), so a refresh never repeats it.
    try {
      const last = localStorage.getItem('lastJoke');
      if (last !== null) current = Number(last);
    } catch (e) { /* storage blocked: that's fine */ }
    function showJoke() {
      let i;
      do { i = Math.floor(Math.random() * JOKES.length); } while (JOKES.length > 1 && i === current);
      current = i;
      try { localStorage.setItem('lastJoke', i); } catch (e) { /* ignore */ }
      q.textContent = JOKES[i].q;
      a.textContent = JOKES[i].a;
      a.hidden = true;
      reveal.hidden = false;
      reveal.setAttribute('aria-expanded', 'false');
    }
    reveal.addEventListener('click', () => {
      a.hidden = false;
      reveal.hidden = true;
      reveal.setAttribute('aria-expanded', 'true');
      a.focus();
    });
    jokeBox.querySelector('.joke-next').addEventListener('click', showJoke);
    a.tabIndex = -1;
    showJoke();
    jokeBox.hidden = false;
  }

  // ----- Data booklet card on the Resources page uses DATA_BOOKLET_URL -----
  const bookletCard = document.querySelector('#data-booklet a');
  if (bookletCard) {
    if (DATA_BOOKLET_URL) {
      bookletCard.href = DATA_BOOKLET_URL;
    } else {
      bookletCard.removeAttribute('href');
      bookletCard.removeAttribute('target');
    }
  }

  // ----- "Back to previous page" button at the bottom of every page -----
  let cameFromSite = false;
  try {
    const ref = new URL(document.referrer);
    cameFromSite = ref.origin === location.origin && ref.pathname !== location.pathname;
  } catch (e) { /* no referrer: opened from a bookmark, a typed address or another site */ }
  const main = document.querySelector('main');
  if (main && !(section === 'home' && !cameFromSite)) {
    // Where to go if the student didn't arrive from another page of this site.
    let fallbackHref = root + 'index.html';
    let fallbackLabel = 'home page';
    if (body.dataset.topic) {
      const theme = body.dataset.topic.charAt(0);
      fallbackHref = `${root}themes/${theme.toLowerCase()}.html`;
      fallbackLabel = `Theme ${theme}`;
    } else if (section === 'themes' && !/themes\/(index\.html)?$/.test(location.pathname)) {
      fallbackHref = root + 'themes/index.html';
      fallbackLabel = 'all themes';
    }
    const back = document.createElement('p');
    back.className = 'page-back';
    back.innerHTML = cameFromSite
      ? `<a class="button secondary" href="${document.referrer}">← Back to previous page</a>`
      : `<a class="button secondary" href="${fallbackHref}">← Back to ${fallbackLabel}</a>`;
    if (cameFromSite) {
      // The browser's own "back" returns to the same scroll position on the previous page.
      back.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); history.back(); });
    }
    main.appendChild(back);
  }

  // In-page links (e.g. the contents list) jump without adding a history step,
  // so "Back to previous page" leaves the page instead of just scrolling up it.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView();
    history.replaceState(null, '', '#' + id);
    // Move the keyboard focus too, so Tab carries on from the section the student jumped to.
    if (!target.matches('a[href], button, input, select, textarea, summary') && !target.hasAttribute('tabindex')) target.tabIndex = -1;
    target.focus({ preventScroll: true });
  });

  // ----- "Σ Equations" button and panel (topic pages and the question bank) -----
  // The question bank tells the panel which topic is showing by calling window.setEquationTopic('A.2').
  const usesMathJax = !!document.querySelector('script[src*="mathjax"]');
  if (usesMathJax && (body.dataset.topic || section === 'questions')) buildEquationPanel();

  function buildEquationPanel() {
    const allTopics = SYLLABUS.flatMap((t) => t.topics);
    const withData = allTopics.filter((s) => DATA_BOOKLET[s.id]);
    let currentTopic = body.dataset.topic || '';

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'eq-fab';
    fab.setAttribute('aria-controls', 'eq-panel');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = '<span aria-hidden="true">Σ</span> Equations';

    const panel = document.createElement('aside');
    panel.className = 'eq-panel';
    panel.id = 'eq-panel';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Data booklet equations');
    panel.innerHTML = `
      <div class="eq-head">
        <strong>Data booklet equations</strong>
        <button type="button" class="eq-close" aria-label="Close equations">×</button>
      </div>
      <label class="eq-pick">Topic
        <select>${withData.map((s) => `<option value="${s.id}">${s.id} ${s.title}</option>`).join('')}</select>
      </label>
      <div class="eq-body" aria-live="polite"></div>
      <p class="eq-foot">${DATA_BOOKLET_URL
        ? `<a href="${DATA_BOOKLET_URL}" target="_blank" rel="noopener">Open the annotated data booklet ↗</a>`
        : '<span class="eq-note">A link to the full data booklet is coming soon.</span>'}</p>`;
    document.body.append(fab, panel);
    body.classList.add('has-eq');

    const select = panel.querySelector('select');
    const out = panel.querySelector('.eq-body');

    function render() {
      const d = DATA_BOOKLET[currentTopic];
      const info = allTopics.find((s) => s.id === currentTopic);
      if (window.MathJax && MathJax.typesetClear) MathJax.typesetClear([out]);
      if (!d) {
        out.innerHTML = `<p class="eq-note">${info ? `Equations for ${info.id} ${info.title} haven't been added yet.` : 'Choose a topic.'}
          Pick another topic above, or open the full data booklet.</p>`;
        select.selectedIndex = -1;
      } else {
        select.value = currentTopic;
        out.innerHTML = d.equations.map(([label, tex, hl]) =>
          `<div class="eq-item"><div class="eq-label">${label}${hl ? ' <span class="tag hl">HL</span>' : ''}</div>$$${tex}$$</div>`).join('') +
          (d.note ? `<p class="eq-note">${d.note}</p>` : '') +
          (d.constants && d.constants.length ? `<h4>Constants</h4>` + d.constants.filter((c) => CONSTANTS[c]).map((c) =>
            `<div class="eq-item"><div class="eq-label">${CONSTANTS[c][0]}</div>$$${CONSTANTS[c][1]}$$</div>`).join('') : '');
      }
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([out]).catch(console.error);
    }
    function open() {
      panel.hidden = false;
      fab.setAttribute('aria-expanded', 'true');
      render();
      panel.querySelector('.eq-close').focus();
    }
    function close() {
      panel.hidden = true;
      fab.setAttribute('aria-expanded', 'false');
      fab.focus();
    }

    fab.addEventListener('click', () => (panel.hidden ? open() : close()));
    panel.querySelector('.eq-close').addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) close(); });
    select.addEventListener('change', () => { currentTopic = select.value; render(); });

    window.setEquationTopic = (id) => {
      if (id === currentTopic) return;
      currentTopic = id;
      if (!panel.hidden) render();
    };
  }
})();

// Tables that are too wide for the screen (usually on phones) switch to a stacked layout:
// one block per row, with each cell labelled by its column heading.
(function () {
  function label(table) {
    if (table.dataset.labelled) return;
    const rows = [...table.rows];
    const head = rows.find((r) => r.cells.length && [...r.cells].every((c) => c.tagName === 'TH'));
    if (!head) return;
    const names = [...head.cells].map((c) => c.textContent.trim());
    head.classList.add('stack-head');
    rows.forEach((r) => { if (r !== head) [...r.cells].forEach((c, i) => { if (names[i]) c.dataset.label = names[i]; }); });
    table.dataset.labelled = '1';
  }
  function check() {
    document.querySelectorAll('main table.notes').forEach((t) => {
      t.classList.remove('stacked');
      const box = t.parentElement;
      if (t.scrollWidth > box.clientWidth + 2) { label(t); t.classList.add('stacked'); }
    });
  }
  function start() {
    check();
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(check);
    let timer;
    window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(check, 200); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
