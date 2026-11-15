// E2-P02: an ultraviolet flame detector whose sensor is a photocell: why sunlight cannot trigger it (threshold),
// photons per second from the power, the maximum speed of the photoelectrons (Einstein's equation), their de Broglie
// wavelength, and what a brighter flame changes.
// Replaces E2-P01 (withdrawn 15 November 2026), whose experiment and parts were too close to the hand-written E2-012.
export default {
  id: 'E2-P02',
  title: 'Ultraviolet flame detector',
  situation: 'photocell in an ultraviolet flame detector that ignores sunlight',
  type: 'short',
  level: 'HL',
  difficulty: 2,
  topics: ['E.2'],
  sections: ['einstein', 'debroglie', 'photoelectric'],
  batch: 'batch-5',
  originality: {
    inspiredBy: null,
    note: 'Written for this bank from the E.2 understandings (photons, threshold, Einstein\'s equation, de Broglie wavelength). Real flame detectors use photocells whose cathodes respond only to short-wavelength ultraviolet, so that sunlight at ground level cannot trigger them; the detector, numbers and parts here are our own. Deliberately unlike the hand-written E2-012 and the withdrawn E2-P01 (stopping voltage against frequency, h from the gradient, work function): here the work function is given, and the question moves from the threshold to photon numbers, the speed of the electrons and their wavelength.',
  },
  given: {
    phi: { value: 4.80, sf: 3, unit: 'eV', range: [1.5, 6], what: 'work function of the cathode metal' },
    sun: { value: 290, sf: 2, unit: 'nm', range: [280, 320], what: 'shortest wavelength in sunlight at ground level' },
    lam: { value: 210, sf: 2, unit: 'nm', range: [150, 255], what: 'wavelength of the ultraviolet from the flame in the test' },
    P: { value: 1.5e-9, sf: 2, unit: 'W', range: [1e-12, 1e-6], what: 'power of the ultraviolet reaching the cathode in the test' },
  },
  calc: (v, K) => {
    const Eph = K.h * K.c / v.lam;
    const Emax = Eph - v.phi;
    const vmax = Math.sqrt(2 * Emax / K.me);
    return {
      lam0: { value: K.h * K.c / v.phi, unit: 'nm', sf: 3, range: [200, 1000] },
      Esun: { value: K.h * K.c / v.sun, unit: 'eV', sf: 3 },
      Eph: { value: Eph, unit: 'J', sf: 3 },
      N: { value: v.P / Eph, unit: 's^-1', sf: 2, range: [1e6, 1e12] },
      Emax: { value: Emax, unit: 'J', sf: 3 },
      EmaxeV: { value: Emax, unit: 'eV', sf: 3 },
      vmax: { value: vmax, unit: 'm s^-1', sf: 3, range: [1e5, 2e6] },
      ld: { value: K.h / (K.me * vmax), unit: 'nm', sf: 3, range: [0.1, 10] },
      wrong_N: { value: v.P / v.phi, unit: 's^-1', sf: 2 }, // divided by the work function instead of the photon energy
      wrong_v: { value: Math.sqrt(2 * Eph / K.me), unit: 'm s^-1', sf: 3 }, // gave the electron all of the photon's energy
    };
  },
  stem: '<p>A flame detector warns of a fire by detecting the ultraviolet radiation that flames emit. Its sensor is a photocell: radiation falls on a metal cathode inside a vacuum tube, and electrons released from the cathode are collected by an anode, so that there is a current in the circuit. The work function of the cathode metal is [[phi]].</p><p>The detector must not be triggered by sunlight coming through a window.</p>',
  parts: [
    {
      label: 'a', sections: ['einstein'], command: 'Deduce', marks: 2, syllabus: ['E.2.H2', 'E.2.H3'],
      question: 'The shortest wavelength in sunlight at ground level is about [[sun]]. Deduce whether sunlight can trigger the detector.',
      markscheme: [
        'photon energy at [[sun]] is $\\dfrac{hc}{\\lambda} = [[Esun:3u]]$ OR the longest wavelength that can release electrons is $\\lambda_0 = \\dfrac{hc}{\\Phi} = [[lam0:3u]]$ ✓',
        'this is less than the work function (OR [[sun]] is longer than the threshold wavelength), so no electrons are released and sunlight cannot trigger the detector, however bright it is ✓',
        'Award the second mark only for a comparison based on a calculated value.',
      ],
      examinerNote: 'One photon gives its energy to one electron, so what matters is the energy of each photon, not the brightness. Comparing the threshold frequency with the frequency of the sunlight is equally good.',
    },
    {
      label: 'b', sections: ['einstein'], command: 'Calculate', marks: 2, syllabus: ['E.2.H1'],
      question: 'In a test, ultraviolet of wavelength [[lam]] from a flame falls on the cathode with a power of [[P]]. Calculate the number of photons reaching the cathode per second.',
      numeric: { result: 'N', accept: 0.03, mistakes: [{ result: 'wrong_N', feedback: 'You divided by the work function. Each photon carries the energy hc/λ of the ultraviolet: divide the power by that.' }] },
      markscheme: [
        'photon energy $E = \\dfrac{hc}{\\lambda} = \\dfrac{[[K.h]] \\times [[K.c]]}{[[lam:n]] \\times 10^{-9}} = [[Eph:3u]]$ ✓',
        'number per second $= \\dfrac{P}{E} = \\dfrac{[[P:n]]}{[[Eph:3]]} = [[N:2u]]$ ✓',
      ],
      examinerNote: 'Power is energy per second, so dividing it by the energy of one photon gives the number of photons per second.',
    },
    {
      label: 'c', sections: ['einstein'], command: 'Determine', marks: 3, syllabus: ['E.2.H3'], dependsOn: ['b'],
      question: 'Determine the maximum speed of the electrons released by this ultraviolet.',
      numeric: { result: 'vmax', accept: 0.03, mistakes: [{ result: 'wrong_v', feedback: 'That gives the electron all of the photon\'s energy. Some of it is needed to escape from the metal: subtract the work function first.' }] },
      markscheme: [
        '$E_{\\max} = hf - \\Phi = [[Eph:3]] - [[phi:n]] \\times [[K.e]] = [[Emax:3u]]$ (OR $[[EmaxeV:3]]$ eV) ✓',
        '$\\tfrac{1}{2}m_{\\text{e}}v^2 = E_{\\max}$ ✓',
        '$v = \\sqrt{\\dfrac{2 \\times [[Emax:3]]}{[[K.me]]}} = [[vmax:3u]]$ ✓',
        'Allow ECF from (b) for the photon energy; accept [[vmax:lo]] to [[vmax:hi]] $\\text{m s}^{-1}$',
      ],
      examinerNote: 'Einstein\'s equation with both energies in joules (or both in eV, then converted). The speed is small compared with c, so the non-relativistic kinetic energy is fine.',
    },
    {
      label: 'd', sections: ['debroglie'], command: 'Calculate', marks: 2, syllabus: ['E.2.H6'], dependsOn: ['c'],
      question: 'Calculate, in nm, the de Broglie wavelength of the fastest of these electrons.',
      numeric: { result: 'ld', accept: 0.03 },
      markscheme: [
        '$\\lambda = \\dfrac{h}{p} = \\dfrac{h}{m_{\\text{e}}v}$ ✓',
        '$\\lambda = \\dfrac{[[K.h]]}{[[K.me]] \\times [[vmax:3]]} = [[ld:3u]]$ ✓',
        'Allow ECF from (c); accept [[ld:lo]] to [[ld:hi]] nm',
      ],
      examinerNote: 'The electrons have a wavelength of about a nanometre, far shorter than the ultraviolet that released them.',
    },
    {
      label: 'e', sections: ['photoelectric', 'einstein'], command: 'Explain', marks: 2, syllabus: ['E.2.H1', 'E.2.H3'],
      question: 'The flame grows, so that more ultraviolet of the same wavelength reaches the cathode. Explain the effect on the current in the photocell and on the maximum speed of the electrons.',
      markscheme: [
        'more photons arrive per second and each can release at most one electron, so more electrons are released per second and the current increases ✓',
        'each photon still has the same energy ($hf$), and the work function is unchanged, so the maximum kinetic energy, and so the maximum speed, of the electrons stays the same ✓',
      ],
      examinerNote: 'Intensity changes the number of photons per second, not the energy of each photon. Award each mark only with its reason.',
    },
  ],
};
