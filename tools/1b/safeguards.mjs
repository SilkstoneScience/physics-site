// Presentation and assessment safeguards (Batch 1 retrospective, section 7, MUST FIX 2–4; Phase 12).
// Called by validate.mjs for every dataset. Each check works from the generated question (what students see)
// and the dataset's design metadata, and reports with the validator's usual fail/warn.
//
//   T2  regularity        measured data that look manufactured rather than measured
//   T3  graph reads       every value students must read from a graph lies on that graph's axes
//   T4  giveaways         an answer, unit, relationship or conclusion shown before the part that asks for it
//   P1  error bars        error bars that would be hidden under the point markers; y error bars only
import { sigFig, sciParts, stripTags, fmtNum, roundTo, decimalsOf } from './lib.mjs';
import { MARKER_R } from './graph.mjs';

// ---------- T2: too-regular data ----------
// A physically intended relationship is fine: the model may be exactly linear. What is not fine is DATA that
// follow it more neatly than the declared measurement could. Thresholds (all for measured columns, in row order,
// leaving out a declared anomaly):
//   equal-steps        at least `equalStepFraction` of the successive differences are identical (to the column's
//                      resolution), with at least `minRows` values. (Batch 1: B3-B01's first draft rose by exactly
//                      5.0 kPa every row; A2-B01 steps by exactly 20 mm in five of six rows.)
//   too-little-scatter the scatter about the noise-free model (with any systematic effect) is less than
//                      `scatterRatio` of what the declared noise and rounding predict (root-mean-square ratio), with at
//                      least `minRowsScatter` values. For six values the chance of this with honest noise is under 1 %.
//   exact-ratios       y/x (measured over the independent variable) is identical to 3 significant figures in at least
//                      `equalStepFraction` of the rows: "exact proportionality" no real instrument gives.
//   repeated-digit     every value ends in the same digit although the resolution allows others, with at least
//                      `minRowsDigits` values: the readings look coarser than the stated instrument.
// An author may accept a finding for a column with a physical reason: columns.<k>.regularity = { accept: [codes],
// reason }. That removes the warning but makes the dataset AMBER (batch.mjs), so a person agrees with the reason.
export const REGULARITY = { minRows: 4, equalStepFraction: 0.8, scatterRatio: 0.35, minRowsScatter: 5, minRowsDigits: 5 };

// values: displayed numbers (anomaly removed); texts: the same as printed; xs: the independent variable;
// models: noise-free model values (with systematic effects); sigmas: declared random sd of each value.
export function regularityFindings({ values, texts, xs, models, sigmas, resolution }) {
  const out = [];
  const n = values.length;
  const R = REGULARITY;
  if (n >= R.minRows) {
    const steps = values.slice(1).map((v, i) => roundTo(v - values[i], resolution));
    const counts = new Map();
    for (const s of steps) if (s !== 0) counts.set(s, (counts.get(s) || 0) + 1);
    const [step, k] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || [0, 0];
    if (k / steps.length >= R.equalStepFraction) {
      out.push({ code: 'equal-steps', message: `${k} of ${steps.length} successive differences are exactly ${fmtNum(step, decimalsOf(resolution))}: the data step too evenly to look measured (threshold ${R.equalStepFraction * 100} %)` });
    }
    const ratios = values.map((v, i) => (xs[i] ? sigFig(v / xs[i], 3) : null)).filter(Boolean);
    const rc = new Map();
    for (const r of ratios) rc.set(r, (rc.get(r) || 0) + 1);
    const top = Math.max(0, ...rc.values());
    if (ratios.length >= R.minRows && top / ratios.length >= R.equalStepFraction) {
      out.push({ code: 'exact-ratios', message: `the ratio of the values to the independent variable is the same to 3 significant figures in ${top} of ${ratios.length} rows: exact proportionality that measured data don't show` });
    }
  }
  if (n >= R.minRowsScatter && sigmas.every((s) => Number.isFinite(s))) {
    let sr = 0;
    let se = 0;
    for (let i = 0; i < n; i++) { sr += (values[i] - models[i]) ** 2; se += sigmas[i] ** 2 + resolution ** 2 / 12; }
    const ratio = Math.sqrt(sr / se);
    if (se > 0 && ratio < R.scatterRatio) {
      out.push({ code: 'too-little-scatter', message: `the values scatter about the model only ${ratio.toFixed(2)} times as much as the declared noise and rounding predict (threshold ${R.scatterRatio}): the data look cleaner than the measurement could give` });
    }
  }
  // The resolution in units of the last printed digit (0.5 → 5, 0.01 → 1, 10 → 10): if it is a multiple of 10 the
  // last digit can only be 0, so a repeated final digit says nothing.
  const stepInLastPlace = Math.round(resolution * 10 ** decimalsOf(resolution));
  if (n >= R.minRowsDigits && stepInLastPlace % 10 !== 0) {
    const last = new Set(texts.map((t) => String(t).slice(-1)));
    if (last.size === 1) {
      out.push({ code: 'repeated-digit', message: `every value ends in "${[...last][0]}", although the resolution (${resolution}) allows other final digits: the readings look coarser than the instrument` });
    }
  }
  return out;
}

// ---------- P1: error bars that can't be seen; y error bars only ----------
// An error bar shorter than the marker hides behind it, so students can't use it. When a student graph's longest y
// error bar is shorter than VISIBLE_BAR (the marker radius plus 1.5 units: a bar that clears the marker by about a
// pixel on a phone) the dataset must either be drawn differently or declare graph.errorBars: 'too-small'. Then no bars
// are drawn, the caption states the uncertainty instead (as printed papers do), and no question or mark scheme may
// refer to error bars. Declaring 'too-small' when the bars would be visible is an error (hiding useful bars).
// The uncertainties themselves are unchanged and still used for every max/min line and verdict.
export const VISIBLE_BAR = MARKER_R + 1.5;
// x error bars are not used in this bank (y error bars only, Phase 12). These pilots were approved with them earlier.
export const X_ERROR_BARS_ALLOWED = new Set(['A1-B01', 'C4-B01']);
// Phase 14 whole-bank review: SOME error bars hidden under their markers while others show (the check above looks only at
// the longest bar). Approved before this rule, so listed as exceptions (the teacher chose to fix them later).
export const SOME_BARS_HIDDEN_ALLOWED = new Set(['A1-B01', 'E3-B01']);
// A point left off the students' graph must come with a part that asks them to plot it. Approved before this rule.
export const OMIT_WITHOUT_PLOT_ALLOWED = new Set(['D1-B01', 'E3-B01']);

// ---------- T3: values read from a graph must be on that graph ----------
// A part that expects students to read a value from a graph declares it in its metadata (not published):
//   reads: [{ figure: 'graph', x: 49.0 }]   or   { y: 19.2 }   or   { x, y, tol }
// figure defaults to the students' graph ('graph'). x and y must lie within that graph's axes (as drawn, from its tick
// labels). tol (optional) is the accepted reading tolerance: it must be at least half a minor grid division, or
// students can't read it that precisely. Points left for students to plot (graph.omit) are checked the same way.
// A part whose wording says it reads from a graph ("read from the graph", "where the line meets", "extend the line",
// "Use the graph to …") but declares no reads gets a warning, so undeclared reads don't slip through.
export const READ_PHRASES = /\b(read(s|ing)? (it )?(off|from)|from the graph|use the graph|meets the|crosses the|extend(s|ed)? (it|the line)|where the line|intercept on the)\b/i;

export function axisRanges(G) {
  const r = (ticks) => (ticks.length >= 2 ? [Math.min(ticks[0].v, ticks.at(-1).v), Math.max(ticks[0].v, ticks.at(-1).v)] : null);
  return { x: r(G.xTicks), y: r(G.yTicks), xMinor: G.xMinor, yMinor: G.yMinor };
}

// ---------- T4: giveaways ----------
// Students see, in order: the stem (with its data figures), then for each part its question (and any figure it
// reveals), then, after answering, its mark scheme. Nothing a later part asks for may appear earlier:
//   numbers   each result's value (2 and 3 s.f.) is "asked" by the first part whose mark scheme states it while its
//             question doesn't; it must not appear in the stem, figure captions, alt text or axis titles shown
//             before, or in the questions or mark schemes of earlier parts. Values printed in the data table are data,
//             not answers, and are skipped.
//   units     asks.unit: the unit must not appear in the stem or any earlier question or mark scheme (validate.mjs
//             already checks the part's own question).
//   text      asks.answerText: [strings]: a relationship, quantity or transformation the part asks for (e.g. "T^2")
//             must not appear in anything students see before the part, including its own question and figures.
//   conclusion asks.conclusion: [phrases]: the conclusion a "whether" part asks for must not be stated before it.
//             A part asking "… whether …" without asks.conclusion gets a warning.
export function visibleSequence(q, parseTitles) {
  const figText = (f) => (f ? [f.caption || '', f.alt || '', parseTitles(f.svg || '')].join(' ') : '');
  const seq = [{ where: 'the question text and its data', text: [q.stem, ...(q.data || []).map((x) => (x.kind === 'figure' ? figText(x) : x.caption || ''))].join(' '), part: null, kind: 'stem' }];
  for (const pt of q.parts || []) {
    seq.push({ where: `part (${pt.label}) question`, text: [pt.question, typeof pt.figure === 'object' ? figText(pt.figure) : ''].join(' '), part: pt.label, kind: 'question' });
    seq.push({ where: `part (${pt.label}) mark scheme`, text: [(pt.markscheme || []).join(' '), typeof pt.msFigure === 'object' ? figText(pt.msFigure) : ''].join(' '), part: pt.label, kind: 'ms' });
  }
  return seq;
}

export function valueTokens(v, numbersIn) {
  if (!Number.isFinite(v) || v === 0) return [];
  const a = Math.abs(v);
  const raw = a >= 1e5 || a < 1e-3 ? [sciParts(a, 2).mant, sciParts(a, 3).mant] : [sigFig(a, 2), sigFig(a, 3)];
  // A 2-s.f. token with one significant digit ("0.5", "20") or a small whole number is too common to judge by.
  return [...new Set(raw)].filter((t) => {
    const digits = t.replace('.', '').replace(/^0+/, '').replace(/0+$/, '');
    return digits.length >= 2 && !(/^\d+$/.test(t) && Number(t) <= 12) && numbersIn(t).length === 1;
  });
}

export const hasToken = (text, tok, numbersIn) => numbersIn(text).some((n) => n.tok === tok);
export { stripTags };

// ---------- T5: claims about ratios and whole-number multiples (used by validate.mjs) ----------
// items: [{ v, u }] values with absolute uncertainties. A common value lies in every interval when the largest lower end
// is at most the smallest upper end. "Clearly not constant" needs a gap of at least margin × the mean.
export function constancy(items, margin) {
  const lo = Math.max(...items.map((x) => x.v - x.u));
  const hi = Math.min(...items.map((x) => x.v + x.u));
  const mean = items.reduce((s, x) => s + x.v, 0) / items.length;
  return { lo, hi, mean, constant: lo <= hi, clearlyNot: lo - hi >= margin * Math.abs(mean) };
}
// Successive ratios v[i+1]/v[i] of values with uncertainties; fractional uncertainties add (IB worst case).
export function successiveRatios(items) {
  return items.slice(1).map((b, i) => {
    const a = items[i];
    const r = b.v / a.v;
    return { v: r, u: Math.abs(r) * (a.u / Math.abs(a.v) + b.u / Math.abs(b.v)) };
  });
}
// Whole-number multiples of a factor e: each value within its uncertainty of n·e (n ≥ 1), each multiple unambiguous
// (u < e/4), and no larger factor (from e·(1 + margin) to 2.5e) fitting every value. Returns a list of problems.
export function multiplesProblems(vals, e, margin) {
  const out = [];
  for (const x of vals) {
    const n = Math.round(x.q / e);
    if (!(x.u > 0)) out.push(`value ${x.label}: no uncertainty`);
    else if (x.u >= e / 4) out.push(`value ${x.label}: its uncertainty (${sigFig(x.u, 2)}) is at least a quarter of the factor, so its multiple can't be identified`);
    else if (n < 1 || Math.abs(x.q - n * e) > x.u) out.push(`value ${x.label} (${sigFig(x.q, 3)}) is not within its uncertainty of a whole-number multiple of ${sigFig(e, 3)}`);
  }
  for (let k = 1 + margin; k <= 2.5; k += 0.001) {
    const e2 = e * k;
    if (vals.every((x) => { const n = Math.round(x.q / e2); return n >= 1 && Math.abs(x.q - n * e2) <= x.u; })) {
      out.push(`a larger common factor, ${sigFig(e2, 3)}, also fits every value, so the data don't single out ${sigFig(e, 3)}`);
      break;
    }
  }
  return out;
}
