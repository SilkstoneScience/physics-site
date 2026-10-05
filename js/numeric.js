// Marking of typed numerical answers, used by the question bank (js/questions.js).
// Kept in its own file so tools/check.mjs can test it.
(function () {
  // Marks a typed answer: { status: 'right' | 'wrong' | 'unreadable', mistake: index or null }.
  function checkNumeric(n, text) {
    const got = parseNumber(text);
    if (!got) return { status: 'unreadable', mistake: null };
    const sign = (x) => (n.anySign ? Math.abs(x) : x);
    const v = sign(got.value);
    let right;
    if (n.range) right = v >= Math.min(...n.range) && v <= Math.max(...n.range);
    else right = closeTo(v, sign(n.answer), n.tolerance, got.sf);
    if (right) return { status: 'right', mistake: null };
    const m = (n.mistakes || []).findIndex((x) => closeTo(v, sign(x.value), n.tolerance, got.sf));
    return { status: 'wrong', mistake: m >= 0 ? m : null };
  }

  // True if `typed` is within the tolerance (2% unless the question says otherwise) of
  // `target`, or is `target` correctly rounded to the student's (2 or more) significant figures.
  function closeTo(typed, target, tolerance, sf) {
    const tol = typeof tolerance === 'number' ? tolerance : 0.02;
    if (Math.abs(typed - target) <= tol * Math.abs(target) + 1e-300) return true;
    if (sf >= 2 && typed !== 0 && Math.sign(typed) === Math.sign(target)) {
      const halfStep = 0.5 * Math.pow(10, Math.floor(Math.log10(Math.abs(typed))) - sf + 1);
      return Math.abs(typed - target) <= halfStep * (1 + 1e-9);
    }
    return false;
  }

  // Reads what a student typed: "0.047", "4.7e-2", "4.7×10^-2", "4.7 x 10-2", "4.7×10⁻²",
  // "12 000", "12,000" or "2,5" (decimal comma). Returns { value, sf } or null.
  function parseNumber(text) {
    const sup = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
    let t = String(text).trim()
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => '^' + [...m].map((c) => sup[c]).join(''))
      .replace(/[−–]/g, '-')
      .replace(/\s+/g, '')
      .replace(/[×xX*·]/g, 'x');
    const power = t.match(/^([+-]?)10\^\(?\{?([+-]?\d+)\}?\)?$/);
    if (power) return { value: Number(power[1] + '1') * Math.pow(10, Number(power[2])), sf: 1 };
    let mant = t;
    let exp = 0;
    const sci = t.match(/^(.*?)(?:[eE]([+-]?\d+)|x10\^?\(?\{?([+-]?\d+)\}?\)?)$/);
    if (sci) { mant = sci[1] === '' ? '1' : sci[1]; exp = Number(sci[2] !== undefined ? sci[2] : sci[3]); }
    if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(mant)) mant = mant.replace(/,/g, '');
    else if (/^[+-]?\d*,\d+$/.test(mant)) mant = mant.replace(',', '.');
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(mant)) return null;
    const value = Number(mant) * Math.pow(10, exp);
    if (!isFinite(value)) return null;
    // Significant figures: ignore the sign and leading zeros; trailing zeros only count after a decimal point.
    let digits = mant.replace(/^[+-]/, '');
    const hasPoint = digits.includes('.');
    digits = digits.replace('.', '').replace(/^0+/, '');
    if (!hasPoint) digits = digits.replace(/0+$/, '');
    return { value, sf: Math.max(digits.length, 1) };
  }

  const api = { checkNumeric, closeTo, parseNumber };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; // for tools/check.mjs
  else window.Numeric = api;
})();
