// The maths behind the graph maker (experimental/graph-maker.html), with no page code, so it can be tested in Node
// (tools/check-graph-maker.mjs) and reused by other tools (the IA builder). Plan: docs/GRAPH_MAKER_PLAN.md.
//   Headings:      parseHeading('length L / m') -> { name: 'length', sym: 'L', unit: 'm' }
//   Numbers:       readNumber('0,400') -> { v: 0.4, dp: 3, sf: 3 }
//   Uncertainties: readUnc('2%') -> { pct: 2 }, uncOf(spec, value) -> absolute uncertainty
//   Formulas:      compile('2*(Δt/t)*T2', symbols) -> { eval(env), uses, text(env), latex(env) } (never run as code)
//   Trials:        meanOf(['12.71', '12.66'], readingUnc) -> { v, u, halfRange, reading, n }
//   Max–min:       maxMin(formula, values, uncs)
//   Fits:          fit('linear' | 'quadratic' | 'power' | 'exponential', points)
//   Rounding:      roundPair(v, u, sf) -> { v: '1.62', u: '0.03' }, sig(v, 3)
(function () {
  const EPS = 1e-12;
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '.': '·' };
  const UNSUP = Object.fromEntries(Object.entries(SUP).filter(([k]) => k !== '.').map(([k, v]) => [v, k]));
  const sup = (s) => String(s).split('').map((c) => SUP[c] || c).join('');
  // "s^2", "m s^-1", "T^2" -> "s²", "m s⁻¹", "T²"
  const pretty = (s) => String(s).replace(/\^\(?(-?\d+)\)?/g, (m, e) => sup(e)).replace(/-/g, (m, i, all) => (all[i - 1] === ' ' || i === 0 ? '−' : '-'));

  // ----- Headings -----
  // "length L / m" -> name "length", symbol "L", unit "m". The unit is after the last " / " outside brackets.
  // "Length (m)" and "length L (m)" are read too, with a note that IB style uses " / ".
  function parseHeading(text) {
    const h = String(text || '').trim();
    const out = { name: '', sym: '', unit: '', hasUnit: false, style: 'ib' };
    if (!h) return out;
    let depth = 0; let cut = -1;
    for (let i = 0; i < h.length; i++) {
      const c = h[i];
      if (c === '(' || c === '[') depth++;
      else if (c === ')' || c === ']') depth--;
      else if (depth === 0 && c === '/' && h[i - 1] === ' ' && h[i + 1] === ' ') cut = i;
    }
    let q = h; let u = '';
    if (cut >= 0) { q = h.slice(0, cut).trim(); u = h.slice(cut + 1).trim(); out.hasUnit = true; }
    else {
      const m = h.match(/^(.*?)\s*[([]\s*([^()[\]]*)\s*[)\]]$/); // "Length (m)" or "Length [m]"
      if (m && m[1] && !/[A-Za-z]\($/.test(h.slice(0, m.index + m[1].length + 1))) { q = m[1].trim(); u = m[2].trim(); out.hasUnit = true; out.style = 'brackets'; }
    }
    out.unit = u;
    // words, keeping anything in brackets together: "ln(V / V)" is one word
    const words = []; let w = ''; depth = 0;
    for (const c of q) {
      if (c === '(' || c === '[') depth++;
      if (c === ')' || c === ']') depth--;
      if (/\s/.test(c) && depth <= 0) { if (w) words.push(w); w = ''; } else w += c;
    }
    if (w) words.push(w);
    const last = words[words.length - 1] || '';
    if (words.length > 1) { out.name = words.slice(0, -1).join(' '); out.sym = last; }
    else if (last.length <= 3 && !/[()[\]]/.test(last)) out.sym = last; // "T / s": a symbol on its own
    else out.name = last; // "Length (m)": a name on its own
    return out;
  }
  // A symbol that formulas can use: letters (Latin or Greek), digits and _, starting with a letter.
  const NAME = /^[A-Za-zα-ωΑ-Ωϑϕϵ][A-Za-z0-9_α-ωΑ-Ωϑϕϵ]*$/;
  const isName = (s) => NAME.test(String(s));
  // The symbol a heading suggests for formulas: "T²" -> "T2", "1/T^2" -> "", "t̄" -> "t"
  function suggestSym(sym) {
    const s = String(sym || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => UNSUP[c]).replace(/\^/g, '').replace(/[⁻-]/g, '');
    return isName(s) ? s : '';
  }

  // ----- Numbers typed or pasted by a student -----
  // Accepts "0.400", "0,400" (decimal comma), "−3.2", "3.1e-4", "3.1 × 10^-4", "3.1x10⁻⁴". Returns null if unreadable.
  // dp: decimal places as typed (for the mantissa), sf: significant figures as typed.
  function readNumber(text) {
    if (text === null || text === undefined) return null;
    let t = String(text).trim().replace(/[−–]/g, '-').replace(/\s+/g, ' ');
    if (!t) return null;
    t = t.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => '^' + m.split('').map((c) => (c === '⁻' ? '-' : UNSUP[c])).join(''));
    // decimal comma: one comma, no dot
    if (/^[+-]?\d*,\d+/.test(t) && !t.includes('.') && (t.match(/,/g) || []).length === 1) t = t.replace(',', '.');
    let mant = t; let exp = 0;
    const sci = t.match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*(?:[x×*·]\s*10\s*\^\s*\(?([+-]?\d+)\)?|[eE]([+-]?\d+))$/);
    if (sci) { mant = sci[1]; exp = Number(sci[2] !== undefined ? sci[2] : sci[3]); }
    else if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(t)) return null;
    const v = Number(mant) * Math.pow(10, exp);
    if (!isFinite(v)) return null;
    const digits = mant.replace(/^[+-]/, '');
    const dot = digits.indexOf('.');
    const dp = dot < 0 ? 0 : digits.length - dot - 1;
    const sig = digits.replace('.', '').replace(/^0+/, '');
    const sf = dot < 0 ? Math.max(1, sig.replace(/0+$/, '').length) : Math.max(1, sig.length); // "1200" counts as 2 s.f.
    return { v: +v.toPrecision(15), dp: dp - exp, sf };
  }
  const num = (text) => { const r = readNumber(text); return r ? r.v : NaN; };

  // ----- Uncertainties -----
  // "0.001", "±0.001", "2%", "2 %" -> { abs } or { pct }. Empty -> null. Unreadable -> { bad: true }.
  function readUnc(text) {
    const t = String(text === undefined || text === null ? '' : text).trim().replace(/^±\s*/, '').replace(/^\+\/?-\s*/, '');
    if (!t) return null;
    if (/%$/.test(t)) {
      const r = readNumber(t.slice(0, -1));
      return r && r.v >= 0 ? { pct: r.v } : { bad: true };
    }
    const r = readNumber(t);
    return r && r.v >= 0 ? { abs: r.v, dp: r.dp } : { bad: true };
  }
  // The absolute uncertainty of a value, from a spec ({ abs } or { pct }); 0 when there is none.
  function uncOf(spec, v) {
    if (!spec || spec.bad) return 0;
    if (spec.pct !== undefined) return Math.abs(v) * spec.pct / 100;
    return spec.abs || 0;
  }

  // ----- Repeated trials -----
  // The mean of the readable trials; uncertainty = half the range, or the reading uncertainty if that is larger
  // (IA page, section 8: "If that is smaller than the instrument's reading uncertainty, use the reading uncertainty instead").
  function meanOf(trials, readingSpec) {
    const vals = trials.map(num).filter((v) => isFinite(v));
    if (!vals.length) return null;
    const v = vals.reduce((s, x) => s + x, 0) / vals.length;
    const halfRange = (Math.max(...vals) - Math.min(...vals)) / 2;
    const reading = uncOf(readingSpec, v);
    return { v, u: Math.max(halfRange, reading), halfRange, reading, n: vals.length, used: halfRange >= reading ? 'range' : 'reading' };
  }

  // ----- Rounding -----
  // Significant figures, written plainly (no "e" notation for ordinary sizes).
  function sig(v, sf = 3) {
    if (!isFinite(v)) return '–';
    if (v === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(v)));
    if (e >= -4 && e < 6) {
      const dp = Math.max(0, sf - 1 - e);
      return fixed(+v.toPrecision(sf), dp);
    }
    const m = +(v / Math.pow(10, e)).toPrecision(sf);
    return `${fixed(m, sf - 1)} × 10${sup(e)}`;
  }
  const fixed = (v, dp) => (dp > 20 ? v.toPrecision(15) : v.toFixed(dp)).replace(/^-/, '−');
  // The decimal place an uncertainty is rounded to: 1 s.f. (or 2), returned as a number of decimal places (may be negative).
  function uncPlace(u, sf = 1) {
    if (!(u > 0) || !isFinite(u)) return null;
    let e = Math.floor(Math.log10(u));
    // 0.096 to 1 s.f. is 0.1: the place moves up one
    const r = Math.round(tidy(u / Math.pow(10, e - sf + 1)));
    if (r >= Math.pow(10, sf)) e += 1;
    return sf - 1 - e;
  }
  // A value and its uncertainty, rounded together: the uncertainty to sf s.f., the value to the same decimal place.
  // Returns { v: '1.62', u: '0.03', dp, exp } with plain text (exp is a power of ten when the numbers are very big or small).
  function roundPair(v, u, sf = 1) {
    const dp = uncPlace(u, sf);
    if (dp === null) return { v: sig(v, 4), u: '', dp: null, exp: 0 };
    const big = Math.max(Math.abs(v), u);
    const e = big ? Math.floor(Math.log10(big)) : 0;
    if (e >= 6 || e <= -5) { // write both in the same power of ten
      const k = e;
      const p = dp + k;
      return { v: fixed(roundTo(v / Math.pow(10, k), p), Math.max(0, p)), u: fixed(roundTo(u / Math.pow(10, k), p), Math.max(0, p)), dp: p, exp: k };
    }
    return { v: fixed(roundTo(v, dp), Math.max(0, dp)), u: fixed(roundTo(u, dp), Math.max(0, dp)), dp, exp: 0 };
  }
  // Rounding halves upwards, after removing the computer's tiny binary errors (0.055 is stored as 0.05499999…)
  const tidy = (x) => +x.toPrecision(12);
  const roundTo = (v, dp) => { const f = Math.pow(10, dp); const r = Math.round(tidy(Math.abs(v) * f)) / f; return v < 0 ? -r : r; };
  // A value rounded to a number of decimal places (for table cells whose uncertainty sets the place).
  const toPlace = (v, dp) => (isFinite(v) ? fixed(roundTo(v, dp), Math.max(0, dp)) : '–');
  // "(1.62 ± 0.03) s²", "(1.62 ± 0.03) × 10⁻³ s²", or "1.62 s²" when there's no uncertainty.
  function pairText(v, u, unit, sf = 1) {
    const r = roundPair(v, u, sf);
    const un = unit ? ' ' + unit : '';
    if (!r.u) return r.v + un;
    return `(${r.v} ± ${r.u})${r.exp ? ' × 10' + sup(r.exp) : ''}${un}`;
  }

  // ----- Units: "m s^-1" -> { m: 1, s: -1 }, used to give gradients a unit -----
  function readUnit(text) {
    const t = pretty(String(text || '').trim()).replace(/−/g, '⁻');
    if (!t) return {};
    const out = {};
    for (const tok of t.split(/\s+|·/).filter(Boolean)) {
      const m = tok.match(/^([^⁰¹²³⁴⁵⁶⁷⁸⁹⁻/()]+)([⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?$/);
      if (!m) return null; // "m/s", "(kg m)": can't be split safely
      const p = m[2] ? Number(m[2].split('').map((c) => (c === '⁻' ? '-' : UNSUP[c])).join('')) : 1;
      out[m[1]] = (out[m[1]] || 0) + p;
    }
    return out;
  }
  function writeUnit(u) {
    const parts = Object.entries(u).filter(([, p]) => p);
    // positive powers first, as in "s² m⁻¹"
    parts.sort((a, b) => (b[1] > 0) - (a[1] > 0));
    return parts.map(([b, p]) => (p === 1 ? b : b + sup(p))).join(' ');
  }
  // The unit of a gradient (y unit ÷ x unit), e.g. ("s^2", "m") -> "s² m⁻¹". With n: y unit ÷ (x unit)ⁿ.
  function divideUnits(yu, xu, n = 1) {
    const a = readUnit(yu); const b = readUnit(xu);
    if (!yu && !xu) return '';
    if (!xu || !n) return pretty(yu);
    if (a && b) {
      const out = { ...a };
      for (const [k, p] of Object.entries(b)) out[k] = (out[k] || 0) - p * n;
      return writeUnit(out);
    }
    const xs = /\s/.test(xu) || n !== 1 ? '(' + pretty(xu) + ')' + (n !== 1 ? sup(n) : '') : pretty(xu);
    return `${pretty(yu || '1')} / ${xs}`;
  }

  // ----- Formulas -----
  // A small reader for formulas such as "1/T^2", "ln(V)", "4pi^2L", "2*(Δt/t)*T2". It builds a tree and evaluates it;
  // nothing the student types is ever run as JavaScript.
  // "Δt" (or "dt", when no column is called "d") is the uncertainty in t. Trigonometry is in degrees unless radians is set.
  const FUNCS = {
    sqrt: Math.sqrt, ln: Math.log, log: Math.log10, log10: Math.log10, lg: Math.log10, exp: Math.exp, abs: Math.abs,
    sin: 'trig', cos: 'trig', tan: 'trig', asin: 'atrig', acos: 'atrig', atan: 'atrig', arcsin: 'atrig', arccos: 'atrig', arctan: 'atrig',
  };
  const TRIG = { sin: Math.sin, cos: Math.cos, tan: Math.tan };
  const ATRIG = { asin: Math.asin, acos: Math.acos, atan: Math.atan, arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan };
  const CONSTS = { pi: Math.PI, 'π': Math.PI, e: Math.E };

  function tokenize(src, symbols) {
    const s = String(src).replace(/[−–]/g, '-').replace(/[×·∙]/g, '*').replace(/÷/g, '/')
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => '^(' + m.split('').map((c) => (c === '⁻' ? '-' : UNSUP[c])).join('') + ')')
      .replace(/√/g, 'sqrt');
    const syms = new Set(symbols);
    const names = [...Object.keys(FUNCS), ...Object.keys(CONSTS).filter((k) => !syms.has(k)), ...symbols];
    for (const x of symbols) { names.push('Δ' + x); if (!syms.has('d')) names.push('d' + x); }
    names.sort((a, b) => b.length - a.length);
    const out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      const n = s.slice(i).match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
      if (n) { out.push({ t: 'num', v: Number(n[0]), text: n[0], at: i }); i += n[0].length; continue; }
      if ('+-*/^(),'.includes(c)) { out.push({ t: c, at: i }); i++; continue; }
      const name = names.find((nm) => s.startsWith(nm, i)); // the longest name that matches here
      if (name) {
        let tok;
        if (FUNCS[name] && !syms.has(name)) tok = { t: 'fn', name };
        else if (syms.has(name)) tok = { t: 'var', name };
        else if (name[0] === 'Δ' || name[0] === 'd') tok = { t: 'unc', name: name.slice(1) };
        else tok = { t: 'const', name, v: CONSTS[name] };
        tok.at = i; out.push(tok); i += name.length; continue;
      }
      const word = (s.slice(i).match(/^[A-Za-zα-ωΑ-ΩΔ_][A-Za-z0-9_α-ωΑ-Ω]*/) || [c])[0];
      throw new FormulaError(word === 'Δ' ? 'Δ must be followed by a column symbol, e.g. Δt.' : `"${word}" isn't a column symbol or a function I know.`, i);
    }
    return out;
  }
  function FormulaError(message, at) { this.message = message; this.at = at; }
  FormulaError.prototype = Object.create(Error.prototype);

  // Grammar: sum := product (("+"|"-") product)* ; product := unary (("*"|"/"|implicit) unary)* ;
  // unary := "-" unary | power ; power := atom ("^" unary)? ; atom := num | var | unc | const | fn atom | "(" sum ")"
  function parse(tokens) {
    let k = 0;
    const peek = () => tokens[k];
    const take = (t) => { const x = tokens[k]; if (!x || (t && x.t !== t)) throw new FormulaError(t === ')' ? 'A bracket is not closed.' : 'The formula ends too soon.', x ? x.at : -1); k++; return x; };
    const startsAtom = (x) => x && ['num', 'var', 'unc', 'const', 'fn', '('].includes(x.t);
    function sum() {
      let a = product();
      while (peek() && (peek().t === '+' || peek().t === '-')) { const op = take().t; a = { op, a, b: product() }; }
      return a;
    }
    function product() {
      let a = unary();
      for (;;) {
        const x = peek();
        if (x && (x.t === '*' || x.t === '/')) { take(); a = { op: x.t, a, b: unary() }; }
        else if (startsAtom(x)) {
          if (x.t === 'num' && tokens[k - 1] && tokens[k - 1].t === 'num') throw new FormulaError('Two numbers in a row: put an operator (+ − * /) between them.', x.at);
          a = { op: '*', a, b: unary(), implicit: true };
        } else return a;
      }
    }
    function unary() {
      if (peek() && peek().t === '-') { take(); return { op: 'neg', a: unary() }; }
      if (peek() && peek().t === '+') { take(); return unary(); }
      return power();
    }
    function power() {
      const a = atom();
      if (peek() && peek().t === '^') { take(); return { op: '^', a, b: unary() }; }
      return a;
    }
    function atom() {
      const x = peek();
      if (!x) throw new FormulaError('The formula ends too soon.', -1);
      if (x.t === 'num') { take(); return { op: 'num', v: x.v, text: x.text }; }
      if (x.t === 'var') { take(); return { op: 'var', name: x.name }; }
      if (x.t === 'unc') { take(); return { op: 'unc', name: x.name }; }
      if (x.t === 'const') { take(); return { op: 'const', name: x.name, v: x.v }; }
      if (x.t === 'fn') {
        take();
        if (!peek() || peek().t !== '(') throw new FormulaError(`Put brackets after ${x.name}, e.g. ${x.name}(x).`, x.at);
        return { op: 'fn', name: x.name, a: atom() };
      }
      if (x.t === '(') { take(); const a = sum(); take(')'); return { op: '()', a }; }
      throw new FormulaError(`Unexpected "${x.t}".`, x.at);
    }
    if (!tokens.length) throw new FormulaError('Type a formula.', 0);
    const tree = sum();
    if (k < tokens.length) throw new FormulaError(tokens[k].t === ')' ? 'There is a closing bracket with no opening one.' : `Unexpected "${tokens[k].t}".`, tokens[k].at);
    return tree;
  }

  function evaluate(n, env, opt) {
    switch (n.op) {
      case 'num': case 'const': return n.v;
      case 'var': return env.v[n.name];
      case 'unc': return env.u[n.name];
      case '()': return evaluate(n.a, env, opt);
      case 'neg': return -evaluate(n.a, env, opt);
      case '+': return evaluate(n.a, env, opt) + evaluate(n.b, env, opt);
      case '-': return evaluate(n.a, env, opt) - evaluate(n.b, env, opt);
      case '*': return evaluate(n.a, env, opt) * evaluate(n.b, env, opt);
      case '/': return evaluate(n.a, env, opt) / evaluate(n.b, env, opt);
      case '^': return Math.pow(evaluate(n.a, env, opt), evaluate(n.b, env, opt));
      case 'fn': {
        const a = evaluate(n.a, env, opt);
        const f = FUNCS[n.name];
        if (f === 'trig') return TRIG[n.name](opt.radians ? a : a * Math.PI / 180);
        if (f === 'atrig') { const r = ATRIG[n.name](a); return opt.radians ? r : r * 180 / Math.PI; }
        return f(a);
      }
      default: return NaN;
    }
  }
  function uses(n, out = { v: new Set(), u: new Set() }) {
    if (!n) return out;
    if (n.op === 'var') out.v.add(n.name);
    if (n.op === 'unc') out.u.add(n.name);
    uses(n.a, out); uses(n.b, out);
    return out;
  }

  // Writing a formula out, with the symbols or with numbers substituted (for the worked example).
  // text: plain text for Word ("2 × (0.005 / 1.271) × 1.615"); latex: for MathJax.
  const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, neg: 3, '^': 4 };
  function writeText(n, show) {
    const w = (m) => writeText(m, show);
    switch (n.op) {
      case 'num': return n.text;
      case 'const': return n.name === 'pi' ? 'π' : n.name;
      case 'var': return show.v(n.name);
      case 'unc': return show.u(n.name);
      case '()': return `(${w(n.a)})`;
      case 'neg': return `−${w(n.a)}`;
      case '+': return `${w(n.a)} + ${w(n.b)}`;
      case '-': return `${w(n.a)} − ${w(n.b)}`;
      case '*': return n.implicit && !show.numbers ? `${w(n.a)}${w(n.b)}` : `${w(n.a)} × ${w(n.b)}`;
      case '/': return `${w(n.a)} / ${w(n.b)}`;
      case '^': { const e = n.b.op === 'num' || (n.b.op === 'neg' && n.b.a.op === 'num') ? pretty('^' + w(n.b).replace('−', '-')) : '^' + w(n.b); return `${w(n.a)}${e}`; }
      case 'fn': return `${n.name === 'sqrt' ? '√' : n.name}${n.a.op === '()' ? '' : ' '}${w(n.a)}`;
      default: return '?';
    }
  }
  function writeLatex(n, show) {
    const w = (m) => writeLatex(m, show);
    const strip = (m) => (m.op === '()' ? m.a : m);
    switch (n.op) {
      case 'num': return n.text;
      case 'const': return n.name === 'pi' || n.name === 'π' ? '\\pi' : n.name;
      case 'var': return show.v(n.name);
      case 'unc': return show.u(n.name);
      case '()': return `\\left(${w(n.a)}\\right)`;
      case 'neg': return `-${w(n.a)}`;
      case '+': return `${w(n.a)} + ${w(n.b)}`;
      case '-': return `${w(n.a)} - ${w(n.b)}`;
      case '*': return n.implicit && !show.numbers ? `${w(n.a)}\\,${w(n.b)}` : `${w(n.a)} \\times ${w(n.b)}`;
      case '/': return `\\dfrac{${w(strip(n.a))}}{${w(strip(n.b))}}`;
      case '^': return `{${w(n.a)}}^{${w(strip(n.b))}}`;
      case 'fn': {
        if (n.name === 'sqrt') return `\\sqrt{${w(strip(n.a))}}`;
        const nm = { ln: '\\ln', log: '\\log', log10: '\\log_{10}', lg: '\\lg', exp: '\\exp', sin: '\\sin', cos: '\\cos', tan: '\\tan' }[n.name] || `\\operatorname{${n.name}}`;
        if (n.name === 'abs') return `\\left|${w(strip(n.a))}\\right|`;
        return `${nm}\\left(${w(strip(n.a))}\\right)`;
      }
      default: return '?';
    }
  }

  // compile(src, symbols, { radians }) -> { ok, error, at, eval(values, uncs), uses: { v: [...], u: [...] }, text(show), latex(show) }
  function compile(src, symbols, opt = {}) {
    try {
      const tree = parse(tokenize(src, symbols));
      const u = uses(tree);
      return {
        ok: true,
        tree,
        uses: { v: [...u.v], u: [...u.u] },
        eval: (values, uncs) => evaluate(tree, { v: values || {}, u: uncs || {} }, opt),
        text: (show) => writeText(tree, show),
        latex: (show) => writeLatex(tree, show),
      };
    } catch (e) {
      if (e instanceof FormulaError) return { ok: false, error: e.message, at: e.at };
      throw e;
    }
  }

  // The max–min method (Skills page, section 7: "use the highest and lowest values"): the formula is worked out with
  // every combination of its inputs at value ± uncertainty, and the uncertainty is half the difference.
  function maxMin(formula, values, uncs) {
    const inputs = formula.uses.v.filter((s) => uncs[s] > 0);
    if (inputs.length > 12) return null;
    let lo = Infinity; let hi = -Infinity;
    for (let mask = 0; mask < (1 << inputs.length); mask++) {
      const v = { ...values };
      inputs.forEach((s, i) => { v[s] = values[s] + ((mask >> i) & 1 ? 1 : -1) * uncs[s]; });
      const r = formula.eval(v, uncs);
      if (!isFinite(r)) return null;
      lo = Math.min(lo, r); hi = Math.max(hi, r);
    }
    if (!inputs.length) { const r = formula.eval(values, uncs); lo = hi = r; }
    return { lo, hi, u: (hi - lo) / 2 };
  }

  // ----- Fits (ordinary least squares, as in js/labs/graph.js) -----
  // points: [{ x, y }]. Returns { type, ok, params, f(x), text } or { ok: false, reason }.
  function linear(pts) {
    const n = pts.length;
    const mx = pts.reduce((s, p) => s + p.x, 0) / n; const my = pts.reduce((s, p) => s + p.y, 0) / n;
    let sxx = 0; let sxy = 0;
    pts.forEach((p) => { sxx += (p.x - mx) ** 2; sxy += (p.x - mx) * (p.y - my); });
    if (sxx < EPS * (1 + mx * mx)) return null;
    const m = sxy / sxx;
    return { m, c: my - m * mx };
  }
  function solve3(A, b) { // Gaussian elimination with pivoting
    const M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < 3; c++) {
      let p = c;
      for (let r = c + 1; r < 3; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-300) return null;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = 0; r < 3; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k < 4; k++) M[r][k] -= f * M[c][k]; }
    }
    return [M[0][3] / M[0][0], M[1][3] / M[1][1], M[2][3] / M[2][2]];
  }
  function quadratic(pts) {
    // centre and scale x so the equations stay well conditioned, then convert back
    const xs = pts.map((p) => p.x);
    const x0 = (Math.max(...xs) + Math.min(...xs)) / 2; const sc = (Math.max(...xs) - Math.min(...xs)) / 2 || 1;
    const S = [0, 0, 0, 0, 0]; const T = [0, 0, 0];
    for (const p of pts) { const t = (p.x - x0) / sc; let tk = 1; for (let k = 0; k < 5; k++) { S[k] += tk; if (k < 3) T[k] += tk * p.y; tk *= t; } }
    const r = solve3([[S[4], S[3], S[2]], [S[3], S[2], S[1]], [S[2], S[1], S[0]]], [T[2], T[1], T[0]]);
    if (!r) return null;
    const [A, B, C] = r; // y = A t² + B t + C with t = (x − x0)/sc
    const a = A / (sc * sc); const b = B / sc - 2 * A * x0 / (sc * sc); const c = C - B * x0 / sc + A * x0 * x0 / (sc * sc);
    return { a, b, c };
  }
  // Two-parameter non-linear least squares (Levenberg–Marquardt), for y = a xⁿ and y = a e^(bx).
  function lm(pts, f, grad, p0) {
    let p = p0.slice(); let lambda = 1e-3;
    const sse = (q) => pts.reduce((s, pt) => s + (pt.y - f(pt.x, q)) ** 2, 0);
    let cur = sse(p);
    for (let it = 0; it < 200; it++) {
      let a11 = 0; let a12 = 0; let a22 = 0; let g1 = 0; let g2 = 0;
      for (const pt of pts) { const [j1, j2] = grad(pt.x, p); const r = pt.y - f(pt.x, p); a11 += j1 * j1; a12 += j1 * j2; a22 += j2 * j2; g1 += j1 * r; g2 += j2 * r; }
      let improved = false;
      for (let tries = 0; tries < 30; tries++) {
        const b11 = a11 * (1 + lambda); const b22 = a22 * (1 + lambda);
        const det = b11 * b22 - a12 * a12;
        if (!isFinite(det) || Math.abs(det) < 1e-300) { lambda *= 10; continue; }
        const d1 = (g1 * b22 - g2 * a12) / det; const d2 = (b11 * g2 - a12 * g1) / det;
        const q = [p[0] + d1, p[1] + d2];
        const s = sse(q);
        if (isFinite(s) && s <= cur) {
          const done = Math.abs(cur - s) <= 1e-15 * (cur + 1e-300) || (Math.abs(d1) <= 1e-12 * (Math.abs(p[0]) + 1e-12) && Math.abs(d2) <= 1e-12 * (Math.abs(p[1]) + 1e-12));
          p = q; cur = s; lambda = Math.max(lambda / 10, 1e-12); improved = true;
          if (done) return p;
          break;
        }
        lambda *= 10;
      }
      if (!improved) break;
    }
    return p;
  }
  function power(pts) {
    if (pts.some((p) => p.x <= 0)) return { reason: 'A power fit needs every x value to be greater than zero.' };
    const sign = pts.every((p) => p.y > 0) ? 1 : pts.every((p) => p.y < 0) ? -1 : 0;
    if (!sign) return { reason: 'A power fit needs the y values to be all positive (or all negative).' };
    const start = linear(pts.map((p) => ({ x: Math.log(p.x), y: Math.log(sign * p.y) })));
    if (!start) return null;
    const p = lm(pts, (x, q) => q[0] * Math.pow(x, q[1]), (x, q) => [Math.pow(x, q[1]), q[0] * Math.pow(x, q[1]) * Math.log(x)], [sign * Math.exp(start.c), start.m]);
    return { a: p[0], n: p[1] };
  }
  function exponential(pts) {
    const sign = pts.every((p) => p.y > 0) ? 1 : pts.every((p) => p.y < 0) ? -1 : 0;
    if (!sign) return { reason: 'An exponential fit needs the y values to be all positive (or all negative).' };
    const start = linear(pts.map((p) => ({ x: p.x, y: Math.log(sign * p.y) })));
    if (!start) return null;
    const p = lm(pts, (x, q) => q[0] * Math.exp(q[1] * x), (x, q) => [Math.exp(q[1] * x), q[0] * x * Math.exp(q[1] * x)], [sign * Math.exp(start.c), start.m]);
    return { a: p[0], b: p[1] };
  }
  const FITS = {
    linear: { name: 'Straight line', min: 2, run: linear, f: (r) => (x) => r.m * x + r.c },
    quadratic: { name: 'Quadratic', min: 3, run: quadratic, f: (r) => (x) => r.a * x * x + r.b * x + r.c },
    power: { name: 'Power', min: 2, run: power, f: (r) => (x) => r.a * Math.pow(x, r.n) },
    exponential: { name: 'Exponential', min: 2, run: exponential, f: (r) => (x) => r.a * Math.exp(r.b * x) },
  };
  function fit(type, pts) {
    const F = FITS[type];
    if (!F) return { ok: false, reason: 'No fit chosen.' };
    const good = pts.filter((p) => isFinite(p.x) && isFinite(p.y));
    if (good.length < F.min) return { ok: false, reason: `A ${F.name.toLowerCase()} fit needs at least ${F.min} points.` };
    const r = F.run(good);
    if (!r) return { ok: false, reason: 'These points can\'t be fitted (are all the x values the same?).' };
    if (r.reason) return { ok: false, reason: r.reason };
    if (Object.values(r).some((v) => !isFinite(v))) return { ok: false, reason: 'The fit did not work for these points.' };
    return { ok: true, type, params: r, f: F.f(r) };
  }

  // Does the line y = mx + c pass through the uncertainty box of a point (x ± dx, y ± dy)? (as in js/labs/graph.js)
  const throughBar = (m, c, p, slack = 0) => Math.abs(m * p.x + c - p.y) <= p.dy + Math.abs(m) * p.dx + slack + 1e-12 * (1 + Math.abs(p.y));
  // The steepest and shallowest straight lines that pass through every uncertainty box (js/labs/graph.js, extremes()).
  function extremes(pts) {
    const corners = [];
    pts.forEach((p) => { for (const sx of [-1, 1]) for (const sy of [-1, 1]) corners.push([p.x + sx * p.dx, p.y + sy * p.dy]); });
    let lo = null; let hi = null;
    for (let i = 0; i < corners.length; i++) {
      for (let j = i + 1; j < corners.length; j++) {
        const [x1, y1] = corners[i]; const [x2, y2] = corners[j];
        if (Math.abs(x2 - x1) < 1e-15 * (1 + Math.abs(x1))) continue;
        const m = (y2 - y1) / (x2 - x1); const c = y1 - m * x1;
        if (!pts.every((p) => throughBar(m, c, p))) continue;
        if (!hi || m > hi.m) hi = { m, c };
        if (!lo || m < lo.m) lo = { m, c };
      }
    }
    return hi && lo ? { hi, lo } : null;
  }

  // Tick marks at 1, 2, 2.5 or 5 × a power of ten (as in js/labs/graph.js).
  function ticks(lo, hi, n = 5) {
    const span = hi - lo || Math.abs(hi) || 1; const raw = span / n; const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((k) => k * p).find((s) => s >= raw * (1 - 1e-9));
    const out = [];
    for (let t = Math.ceil(lo / step - 1e-9) * step; t <= hi + step * 1e-9; t += step) out.push(Math.abs(t) < step * 1e-9 ? 0 : +t.toPrecision(12));
    return { list: out, step };
  }

  const api = {
    sup, pretty, parseHeading, isName, suggestSym, readNumber, num, readUnc, uncOf, meanOf, sig, uncPlace, roundPair, toPlace, pairText,
    readUnit, divideUnits, compile, maxMin, fit, FITS, throughBar, extremes, ticks,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.GraphCore = api;
})();
