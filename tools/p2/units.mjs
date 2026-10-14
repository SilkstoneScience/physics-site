// Units and number formatting for Paper 2 questions.
// A unit is written like "m s^-1" or "J kg^-1 K^-1" ("" = no unit). Each unit has a size in SI units and
// powers of the SI base units [m, kg, s, A, K, mol]. Given values are converted to SI before any calculation.
// "°C" is a temperature (273 is added when converting to K, as in the data booklet); a temperature CHANGE in °C is
// written "Δ°C" and has no offset. Angles: "°" converts to radians; "rad" is 1.

const D = (m = 0, kg = 0, s = 0, A = 0, K = 0, mol = 0) => [m, kg, s, A, K, mol];
const LEN = D(1), MASS = D(0, 1), TIME = D(0, 0, 1), ENERGY = D(2, 1, -2), POWER = D(2, 1, -3);
const UNITS = {
  '': [1, D()],
  m: [1, LEN], km: [1e3, LEN], cm: [1e-2, LEN], mm: [1e-3, LEN], 'µm': [1e-6, LEN], nm: [1e-9, LEN], pm: [1e-12, LEN], fm: [1e-15, LEN],
  AU: [1.50e11, LEN], ly: [9.46e15, LEN], pc: [3.26 * 9.46e15, LEN],
  kg: [1, MASS], g: [1e-3, MASS], t: [1e3, MASS], u: [1.661e-27, MASS],
  s: [1, TIME], ms: [1e-3, TIME], 'µs': [1e-6, TIME], ns: [1e-9, TIME], min: [60, TIME], h: [3600, TIME], day: [86400, TIME], y: [3.156e7, TIME],
  A: [1, D(0, 0, 0, 1)], mA: [1e-3, D(0, 0, 0, 1)], 'µA': [1e-6, D(0, 0, 0, 1)],
  K: [1, D(0, 0, 0, 0, 1)], '°C': [1, D(0, 0, 0, 0, 1)], 'Δ°C': [1, D(0, 0, 0, 0, 1)],
  mol: [1, D(0, 0, 0, 0, 0, 1)],
  rad: [1, D()], '°': [Math.PI / 180, D()], sr: [1, D()],
  N: [1, D(1, 1, -2)], kN: [1e3, D(1, 1, -2)], MN: [1e6, D(1, 1, -2)], mN: [1e-3, D(1, 1, -2)],
  J: [1, ENERGY], kJ: [1e3, ENERGY], MJ: [1e6, ENERGY], GJ: [1e9, ENERGY], eV: [1.60e-19, ENERGY], keV: [1.60e-16, ENERGY], MeV: [1.60e-13, ENERGY], kWh: [3.60e6, ENERGY],
  W: [1, POWER], mW: [1e-3, POWER], kW: [1e3, POWER], MW: [1e6, POWER], GW: [1e9, POWER],
  Pa: [1, D(-1, 1, -2)], kPa: [1e3, D(-1, 1, -2)], MPa: [1e6, D(-1, 1, -2)],
  Hz: [1, D(0, 0, -1)], kHz: [1e3, D(0, 0, -1)], MHz: [1e6, D(0, 0, -1)], GHz: [1e9, D(0, 0, -1)],
  Bq: [1, D(0, 0, -1)], MBq: [1e6, D(0, 0, -1)], GBq: [1e9, D(0, 0, -1)],
  C: [1, D(0, 0, 1, 1)], mC: [1e-3, D(0, 0, 1, 1)], 'µC': [1e-6, D(0, 0, 1, 1)], nC: [1e-9, D(0, 0, 1, 1)],
  V: [1, D(2, 1, -3, -1)], mV: [1e-3, D(2, 1, -3, -1)], kV: [1e3, D(2, 1, -3, -1)], MV: [1e6, D(2, 1, -3, -1)],
  'Ω': [1, D(2, 1, -3, -2)], 'kΩ': [1e3, D(2, 1, -3, -2)], 'MΩ': [1e6, D(2, 1, -3, -2)],
  T: [1, D(0, 1, -2, -1)], mT: [1e-3, D(0, 1, -2, -1)], 'µT': [1e-6, D(0, 1, -2, -1)],
  Wb: [1, D(2, 1, -2, -1)],
  '%': [0.01, D()],
};
// Mass–energy units used in nuclear physics (MeV c^-2) are written as "MeV c^-2": c is a unit here.
UNITS.c = [3.00e8, D(1, 0, -1)];

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

// Parses a unit expression. Returns { scale, dim, offset, tex, text }.
export function parseUnit(expr = '') {
  const toks = expr.trim() ? expr.trim().split(/\s+/) : [];
  let scale = 1;
  const dim = D();
  const factors = toks.map((tok) => {
    const m = tok.match(/^([^^]+)(?:\^(-?\d+))?$/);
    if (!m || !(m[1] in UNITS)) throw new Error(`unknown unit "${tok}" in "${expr}"`);
    const p = m[2] ? Number(m[2]) : 1;
    const [s, d] = UNITS[m[1]];
    scale *= s ** p;
    d.forEach((x, i) => { dim[i] += x * p; });
    return [m[1], p];
  });
  if (factors.some(([u]) => u === '°C') && !(factors.length === 1 && factors[0][1] === 1)) throw new Error(`"${expr}": °C can't be part of a compound unit (use Δ°C or K)`);
  const offset = expr.trim() === '°C' ? 273 : 0; // the data booklet: K = °C + 273
  const shown = (u) => (u === 'Δ°C' ? '°C' : u);
  const text = factors.map(([u, p]) => shown(u) + (p === 1 ? '' : [...String(p)].map((ch) => SUP[ch]).join(''))).join(' ');
  return { expr, scale, dim, offset, text, tex: unitTex(factors) };
}

// The site's style for units: one \text{} for the letters, negative powers inside MathJax so they can't split
// across lines, e.g. "m s^-1" → "$\text{m s}^{-1}$", "J kg^-1 K^-1" → "$\text{J kg}^{-1}\text{ K}^{-1}$".
function unitTex(factors) {
  if (!factors.length) return '';
  if (factors.length === 1 && factors[0][1] === 1) {
    const u = factors[0][0];
    if (u === '°') return '°';
    if (u === '%') return '%';
    if (u === '°C' || u === 'Δ°C') return '°C';
    if (u === 'Ω') return 'Ω';
    if (!/[^A-Za-z]/.test(u)) return u; // plain letters: no MathJax needed ("m", "kg", "MeV")
  }
  let out = '';
  let open = false;
  factors.forEach(([u, p], i) => {
    const name = u === 'Ω' ? '\\Omega' : u === 'kΩ' ? 'k\\Omega' : u === 'µm' ? '\\mu m' : u === 'µs' ? '\\mu s' : u === 'µA' ? '\\mu A' : u === 'µC' ? '\\mu C' : u === 'µT' ? '\\mu T' : u === 'Δ°C' ? '{}^{\\circ}C' : u;
    const plain = !/\\/.test(name);
    const sep = i ? ' ' : '';
    if (plain) {
      out += open ? sep + name : `\\text{${sep}${name}`;
      open = true;
    } else {
      if (open) { out += '}'; open = false; }
      out += (i ? '\\,' : '') + `\\mathrm{${name.replace(/ /g, '\\,')}}`;
    }
    if (p !== 1) { if (open) { out += '}'; open = false; } out += `^{${p}}`; }
  });
  if (open) out += '}';
  return `$${out}$`;
}

export const toSI = (value, u) => value * u.scale + u.offset;
export const fromSI = (si, u) => (si - u.offset) / u.scale;
export const sameDim = (a, b) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) < 1e-9);

// ---------- Numbers ----------
// Rounds to n significant figures (as a number).
export function sigFig(x, n) {
  if (x === 0 || !isFinite(x)) return x;
  return Number(x.toPrecision(n));
}

// A number written to n significant figures, as text for a page: plain for 0.01 ≤ |x| < 10000 (and exact 5-digit values),
// otherwise scientific notation in MathJax ("$3.0 \times 10^{8}$"). Trailing zeros are kept
// (significant), so 3.00e8 to 3 s.f. is "$3.00 \times 10^{8}$" and 12.0 to 3 s.f. is "12.0".
export function fmtSig(x, n) {
  if (!isFinite(x)) throw new Error(`can't format ${x}`);
  if (x === 0) return '0';
  const neg = x < 0 ? '−' : '';
  const a = Math.abs(x);
  const e = Math.floor(Math.log10(Number(a.toPrecision(n))));
  // Scientific notation for small values (below 0.01), for 6 or more digits, and for 5-digit values whose trailing
  // zeros wouldn't be significant (63 000 to 2 s.f. is written 6.3 × 10⁴), as IB papers do.
  if (e >= 5 || e < -2 || (e >= 4 && n < e + 1)) {
    const mant = (a / 10 ** e).toFixed(Math.max(0, n - 1));
    return `$${neg ? '-' : ''}${mant} \\times 10^{${e}}$`;
  }
  const dp = Math.max(0, n - 1 - e);
  let s = Number(a.toPrecision(n)).toFixed(dp); // round to n s.f. first: 252 to 2 s.f. is 250
  // Integers with more digits than significant figures (e.g. 15000 to 2 s.f.) are fine as they are.
  if (dp === 0 && /^\d{5,}$/.test(s)) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // 15 000; 1600 stays as it is
  return neg + s;
}

// A quantity: number and unit, e.g. "12 $\text{m s}^{-1}$", "30°", "25 °C".
export function fmtQuantity(x, n, unit) {
  const u = parseUnit(unit);
  const num = fmtSig(x, n);
  if (!u.tex) return num;
  if (u.tex === '°') return `${num}°`;
  return `${num} ${u.tex}`;
}

// The number of significant figures in a typed number (for checking given values).
export function sigFigsOfText(text) {
  const t = String(text).replace(/^[−-]/, '').replace(/e.*$/i, '');
  const digits = t.replace('.', '').replace(/^0+/, '');
  return t.includes('.') ? digits.length : digits.replace(/0+$/, '').length || 1;
}
