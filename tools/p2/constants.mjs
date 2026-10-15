// Constants for Paper 2 calculations: the values printed in the 2025 data booklet (fundamental constants,
// page 3; unit conversions, page 4; Wien's constant from B.1), checked against the PDF on 14 October 2026.
// A question's calculation may use only these and its own given values: tools/p2/validate.mjs rejects
// other numbers typed into a calculation. Each constant's unit lets the build check every calculation
// dimensionally (tools/p2/build.mjs, "dimension check").
// `text` is how the number appears in a mark scheme ({K.g} in a template).

export const CONSTANTS = {
  g: { value: 9.8, unit: 'm s^-2', text: '9.8', label: 'acceleration of free fall' },
  G: { value: 6.67e-11, unit: 'N m^2 kg^-2', text: '6.67 \\times 10^{-11}', label: 'gravitational constant' },
  NA: { value: 6.02e23, unit: 'mol^-1', text: '6.02 \\times 10^{23}', label: 'Avogadro constant' },
  R: { value: 8.31, unit: 'J K^-1 mol^-1', text: '8.31', label: 'gas constant' },
  kB: { value: 1.38e-23, unit: 'J K^-1', text: '1.38 \\times 10^{-23}', label: 'Boltzmann constant' },
  sigma: { value: 5.67e-8, unit: 'W m^-2 K^-4', text: '5.67 \\times 10^{-8}', label: 'Stefan–Boltzmann constant' },
  k: { value: 8.99e9, unit: 'N m^2 C^-2', text: '8.99 \\times 10^{9}', label: 'Coulomb constant' },
  eps0: { value: 8.85e-12, unit: 'C^2 N^-1 m^-2', text: '8.85 \\times 10^{-12}', label: 'permittivity of free space' },
  mu0: { value: 4 * Math.PI * 1e-7, unit: 'T m A^-1', text: '4\\pi \\times 10^{-7}', label: 'permeability of free space' },
  c: { value: 3.00e8, unit: 'm s^-1', text: '3.00 \\times 10^{8}', label: 'speed of light in a vacuum' },
  h: { value: 6.63e-34, unit: 'J s', text: '6.63 \\times 10^{-34}', label: 'Planck constant' },
  e: { value: 1.60e-19, unit: 'C', text: '1.60 \\times 10^{-19}', label: 'elementary charge' },
  me: { value: 9.110e-31, unit: 'kg', text: '9.110 \\times 10^{-31}', label: 'electron rest mass' },
  mp: { value: 1.673e-27, unit: 'kg', text: '1.673 \\times 10^{-27}', label: 'proton rest mass' },
  mn: { value: 1.675e-27, unit: 'kg', text: '1.675 \\times 10^{-27}', label: 'neutron rest mass' },
  me_u: { value: 0.000549, unit: '', text: '0.000549', label: 'electron rest mass in u' },
  mp_u: { value: 1.007276, unit: '', text: '1.007276', label: 'proton rest mass in u' },
  mn_u: { value: 1.008665, unit: '', text: '1.008665', label: 'neutron rest mass in u' },
  me_MeV: { value: 0.511, unit: '', text: '0.511', label: 'electron rest energy in MeV' },
  mp_MeV: { value: 938, unit: '', text: '938', label: 'proton rest energy in MeV' },
  mn_MeV: { value: 940, unit: '', text: '940', label: 'neutron rest energy in MeV' },
  u: { value: 1.661e-27, unit: 'kg', text: '1.661 \\times 10^{-27}', label: 'unified atomic mass unit' },
  u_MeV: { value: 931.5, unit: '', text: '931.5', label: 'energy equivalent of 1 u in MeV' },
  S: { value: 1.36e3, unit: 'W m^-2', text: '1.36 \\times 10^{3}', label: 'solar constant' },
  R0: { value: 1.20e-15, unit: 'm', text: '1.20 \\times 10^{-15}', label: 'Fermi radius' },
  wien: { value: 2.9e-3, unit: 'm K', text: '2.9 \\times 10^{-3}', label: 'Wien\'s displacement constant' },
  // Unit conversions (page 4)
  T0: { value: 273, unit: 'K', text: '273', label: 'kelvin = Celsius + 273' },
  ly: { value: 9.46e15, unit: 'm', text: '9.46 \\times 10^{15}', label: 'one light year' },
  pc_ly: { value: 3.26, unit: '', text: '3.26', label: 'light years in a parsec' },
  AU: { value: 1.50e11, unit: 'm', text: '1.50 \\times 10^{11}', label: 'one astronomical unit' },
  kWh: { value: 3.60e6, unit: 'J', text: '3.60 \\times 10^{6}', label: 'one kilowatt-hour' },
  eV: { value: 1.60e-19, unit: 'J', text: '1.60 \\times 10^{-19}', label: 'one electronvolt' },
  hc: { value: 1.99e-25, unit: 'J m', text: '1.99 \\times 10^{-25}', label: 'hc' },
};
