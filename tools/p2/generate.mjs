// Turns a Paper 2 question file (tools/p2/questions/<id>.mjs) into the question the site shows.
// Every number in the stem, parts and mark scheme comes from a placeholder:
//   [[x]]        a given value or result, with its unit ("12 m s⁻¹"), to its own significant figures
//   [[x:n]]      the number only
//   [[x:3]]      the number only, to 3 significant figures; [[x:3u]] with its unit
//   [[x:lo]] / [[x:hi]]   the ends of a part's accepted numeric range (to the result's significant figures)
//   [[K.g]]      a data-booklet constant as printed (tools/p2/constants.mjs)
// A placeholder inside $…$ is written as MathJax; outside, as page text. Calculations are done in SI units
// by the question's calc(v, K, h) function, where v holds the given values in SI units and K the constants.
import { CONSTANTS } from './constants.mjs';
import { parseUnit, toSI, fromSI, fmtSig, sigFig } from './units.mjs';

export const PLACEHOLDER = /\[\[([A-Za-z_][\w.]*)(?::([^\]]*))?\]\]/g;
const KV = Object.fromEntries(Object.entries(CONSTANTS).map(([k, c]) => [k, c.value]));
export const helpers = { sf: sigFig };

export class QuestionError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

// Given values in SI units: { name: number }.
export function givenSI(def, scale = null) {
  const out = {};
  for (const [k, g] of Object.entries(def.given || {})) {
    const u = parseUnit(g.unit || '');
    out[k] = toSI(g.value, u) * (scale ? scale(u.dim) : 1);
  }
  return out;
}

// Normalises calc() output: { name: { value (SI unless inUnit), unit, sf, range?, inUnit? } }.
export function runCalc(def, v, K = KV) {
  if (typeof def.calc !== 'function') return {};
  const raw = def.calc(v, K, helpers) || {};
  const out = {};
  for (const [k, r] of Object.entries(raw)) {
    const res = Array.isArray(r) ? { value: r[0], unit: r[1] || '', sf: r[2] } : { ...r };
    res.unit = res.unit || '';
    res.sf = res.sf || 3;
    if (typeof res.value !== 'number' || !isFinite(res.value)) throw new QuestionError('calc', `result ${k} is not a finite number (${res.value})`);
    out[k] = res;
  }
  return out;
}

// Dimension check: rescale every base unit (m, kg, s, A, K, mol) by an odd factor, scale every given value and
// constant accordingly, and run the calculation again. Each SI result must scale exactly as its unit says.
// A wrong formula (a missing square, a forgotten g) almost never survives this.
const FACTORS = [1.7, 2.3, 3.1, 1.9, 1.3, 2.9];
const scaleOf = (dim) => dim.reduce((p, d, i) => p * FACTORS[i] ** d, 1);
export function dimensionCheck(def, results) {
  const problems = [];
  let scaled;
  try {
    const K = Object.fromEntries(Object.entries(CONSTANTS).map(([k, c]) => [k, c.value * scaleOf(parseUnit(c.unit).dim)]));
    scaled = runCalc(def, givenSI(def, scaleOf), K);
  } catch (e) {
    return [`the calculation fails when the units are rescaled: ${e.message}`];
  }
  for (const [k, r] of Object.entries(results)) {
    if (r.inUnit || r.noDimensionCheck || k.startsWith('wrong_')) continue; // wrong answers are often wrong physics on purpose
    const want = r.value * scaleOf(parseUnit(r.unit).dim);
    const got = scaled[k] && scaled[k].value;
    if (!(Math.abs(got - want) <= 1e-9 * Math.max(Math.abs(want), 1e-300))) {
      problems.push(`result ${k} is not dimensionally consistent with its unit "${r.unit}" (rescaling the base units changed it by ×${(got / r.value).toPrecision(4)}, expected ×${(want / r.value).toPrecision(4)})`);
    }
  }
  return problems;
}

// The value of a result in its display unit.
export const shownValue = (r) => (r.inUnit ? r.value : fromSI(r.value, parseUnit(r.unit)));

// Is position i of a template inside $…$?
function insideMath(s, i) {
  let n = 0;
  for (let j = 0; j < i; j++) if (s[j] === '$' && s[j - 1] !== '\\') n++;
  return n % 2 === 1;
}
const stripDollars = (s) => s.replace(/^\$|\$$/g, '');

function quantityText(value, sf, unit, math) {
  const u = parseUnit(unit);
  const num = fmtSig(value, sf);
  if (math) {
    const n = stripDollars(num).replace('−', '-');
    if (!u.tex) return n;
    if (u.tex === '°') return `${n}^{\\circ}`;
    if (u.tex === '%') return `${n}\\%`;
    if (u.tex === '°C') return `${n}\\ {}^{\\circ}\\text{C}`;
    if (u.tex === 'Ω') return `${n}\\ \\Omega`;
    return `${n}\\ ${u.tex.startsWith('$') ? stripDollars(u.tex) : `\\text{${u.tex}}`}`;
  }
  if (!u.tex) return num;
  if (u.tex === '°' || u.tex === '%') return `${num}${u.tex}`;
  return `${num} ${u.tex}`;
}

// Fills the placeholders of one template. ctx: { def, results, ranges }.
export function fill(template, ctx, where) {
  if (typeof template !== 'string') throw new QuestionError('format', `${where}: missing text`);
  return template.replace(PLACEHOLDER, (all, name, fmt = '', offset) => {
    const math = insideMath(template, offset);
    if (name.startsWith('K.')) {
      const c = CONSTANTS[name.slice(2)];
      if (!c) throw new QuestionError('placeholder', `${where}: unknown constant ${all}`);
      return math ? c.text : (/\\/.test(c.text) ? `$${c.text}$` : c.text);
    }
    const g = (ctx.def.given || {})[name];
    const r = ctx.results[name];
    if (!g && !r) throw new QuestionError('placeholder', `${where}: ${all} is neither a given value nor a result`);
    const value = g ? g.value : shownValue(r);
    const unit = g ? (g.unit || '') : r.unit;
    const ownSf = g ? g.sf : r.sf;
    if (!g && name.startsWith('wrong_')) throw new QuestionError('placeholder', `${where}: ${all} is a wrong answer (for feedback only), not for the question text`);
    if (fmt === 'lo' || fmt === 'hi') {
      const range = ctx.ranges[name];
      if (!range) throw new QuestionError('placeholder', `${where}: ${all} needs a part whose numeric answer is ${name}`);
      const x = fmt === 'lo' ? range[0] : range[1];
      return math ? stripDollars(fmtSig(x, ownSf + 1)) : fmtSig(x, ownSf + 1); // exactly the stored range
    }
    const m = fmt.match(/^(n|\d+)?(u)?$/);
    if (!m) throw new QuestionError('placeholder', `${where}: can't read the format of ${all}`);
    const sf = m[1] && m[1] !== 'n' ? Number(m[1]) : ownSf;
    if (!(sf >= 1 && sf <= 8)) throw new QuestionError('placeholder', `${where}: ${all} needs a number of significant figures`);
    const withUnit = fmt === '' || !!m[2];
    if (!withUnit) return math ? stripDollars(fmtSig(value, sf)).replace('−', '-') : fmtSig(value, sf);
    return quantityText(value, sf, unit, math);
  });
}

// Builds the site question from a definition. Returns { question, results, meta }.
export function buildQuestion(def) {
  for (const [k, g] of Object.entries(def.given || {})) {
    if (typeof g.value !== 'number') throw new QuestionError('given', `given ${k} has no numeric value`);
    if (!Number.isInteger(g.sf)) throw new QuestionError('given', `given ${k} needs sf (the significant figures it is quoted to)`);
    parseUnit(g.unit || '');
  }
  const results = runCalc(def, givenSI(def));
  for (const r of Object.values(results)) parseUnit(r.unit);
  // Numeric answers and their accepted ranges, so [[x:lo]] / [[x:hi]] can be filled.
  const ranges = {};
  const numerics = {};
  for (const pt of def.parts || []) {
    if (!pt.numeric) continue;
    const r = results[pt.numeric.result];
    if (!r) throw new QuestionError('numeric', `part (${pt.label}): numeric result ${pt.numeric.result} isn't calculated`);
    const ans = shownValue(r);
    const n = { answer: Number(ans.toPrecision(6)) };
    const unitTex = parseUnit(r.unit).tex;
    if (unitTex) n.unit = unitTex.startsWith('$') ? unitTex : unitTex === '°' ? '°' : unitTex;
    if (pt.numeric.accept != null) {
      const [lo, hi] = Array.isArray(pt.numeric.accept) ? pt.numeric.accept : [pt.numeric.accept, pt.numeric.accept];
      const a = [ans * (1 - lo), ans * (1 + hi)].sort((x, y) => x - y);
      n.range = [Number(sigFig(a[0], r.sf + 1)), Number(sigFig(a[1], r.sf + 1))];
      ranges[pt.numeric.result] = n.range;
    }
    if (pt.numeric.tolerance) n.tolerance = pt.numeric.tolerance;
    if (pt.numeric.anySign) n.anySign = true;
    if (pt.numeric.mistakes) {
      n.mistakes = pt.numeric.mistakes.map((m) => {
        const w = results[m.result];
        if (!w) throw new QuestionError('numeric', `part (${pt.label}): mistake result ${m.result} isn't calculated`);
        return { value: Number(shownValue(w).toPrecision(6)), feedback: m.feedback };
      });
    }
    numerics[pt.label] = n;
  }
  const ctx = { def, results, ranges };
  const linking = def.type === 'linking';
  const q = {
    id: def.id,
    theme: linking ? '' : (def.topics || [''])[0].charAt(0),
    topic: linking ? 'Linking' : (def.topics || [''])[0],
    ...(linking ? { topics: def.topics } : {}),
    paper: linking ? '2L' : '2',
    difficulty: def.difficulty,
    level: def.level,
    stem: fill(def.stem, ctx, 'stem'),
    ...(def.diagram ? { diagram: def.diagram.file, diagramAlt: def.diagram.alt } : {}),
    parts: (def.parts || []).map((pt) => ({
      label: pt.label,
      question: fill(pt.question, ctx, `(${pt.label}) question`),
      marks: pt.marks,
      markscheme: (pt.markscheme || []).map((m, i) => fill(m, ctx, `(${pt.label}) mark scheme ${i + 1}`)),
      ...(numerics[pt.label] ? { numeric: numerics[pt.label] } : {}),
    })),
  };
  return { question: q, results, ranges };
}
