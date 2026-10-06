// Fingerprints for reviewed Paper 1B datasets (the "freeze").
// A fingerprint is a hash of everything that must stay the same once a dataset has been reviewed:
// the physics model (physics block, models, noise, systematic effects, and the source of every law used),
// the dataset values and uncertainties, the question wording, answers, accepted ranges and mark scheme.
// It deliberately leaves out the SVG drawings (presentation), so a change to how graphs are drawn
// doesn't count as a change to the question. The content is also saved as a snapshot in
// tools/1b/frozen/<id>.json, so a change can be reported field by field.
import crypto from 'node:crypto';
import { LAWS } from './laws.mjs';
import { uncertaintyOf, paramValues } from './generate.mjs';

// JSON with object keys sorted, so the same content always gives the same text.
export function stableStringify(x) {
  if (Array.isArray(x)) return '[' + x.map(stableStringify).join(',') + ']';
  if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map((k) => JSON.stringify(k) + ':' + stableStringify(x[k])).join(',') + '}';
  return JSON.stringify(x === undefined ? null : x);
}

function lawsIn(expr, out) {
  if (expr && typeof expr === 'object' && expr.law) {
    out.add(expr.law);
    Object.values(expr.inputs || {}).forEach((e) => lawsIn(e, out));
  }
  return out;
}

// Everything that must stay stable, built from the dataset definition and its generated question.
export function canonicalContent(def, built) {
  const { question: q, d } = built;
  const p = paramValues(def);
  const used = new Set();
  const models = {};
  for (const [k, c] of [...Object.entries(def.columns), ...Object.entries(def.singles || {}).map(([k2, s]) => [`single:${k2}`, s])]) {
    lawsIn(c.model, used);
    models[k] = {
      kind: c.kind || 'single', unit: c.unit || '', values: c.values, model: c.model, noise: c.noise, resolution: c.resolution,
      trials: c.trials, anomaly: c.anomaly, systematic: c.systematic, dp: c.dp, hide: c.hide,
      // A rule for a derived uncertainty (a formula or a declared propagation) is frozen through its VALUES
      // (data.uncertainties below), so rewriting a rule that gives identical values is not a change.
      uncertainty: typeof c.uncertainty === 'function' || c.propagation ? 'rule' : c.uncertainty, propagation: undefined,
    };
  }
  const laws = Object.fromEntries([...used].sort().map((n) => [n, {
    statement: LAWS[n].statement, inputs: LAWS[n].inputs, defaults: LAWS[n].defaults, output: LAWS[n].output, f: LAWS[n].f.toString(),
  }]));
  const uncertainties = {};
  for (const [k, c] of Object.entries(def.columns)) {
    if (c.uncertainty == null && !c.propagation) continue;
    uncertainties[k] = d.rows.map((row) => uncertaintyOf(c, row, p, d.singles, k, def));
  }
  const figures = {};
  const figureOf = (f) => { if (f && f.figure) figures[f.figure] = { alt: f.alt, caption: f.caption }; };
  const tables = [];
  for (const item of q.data || []) {
    if (item.kind === 'table') tables.push({ figure: item.figure || 'table', caption: item.caption, html: item.html });
    else figureOf(item.figure ? item : (q.figures || {})[item.ref]);
  }
  const parts = (q.parts || []).map((pt) => {
    const ms = typeof pt.msFigure === 'string' ? pt.msFigure : pt.msFigure && pt.msFigure.figure;
    if (pt.msFigure && typeof pt.msFigure === 'object') figureOf(pt.msFigure);
    if (typeof pt.msFigure === 'string') figureOf({ figure: ms, ...(q.figures || {})[ms] });
    if (pt.figure && typeof pt.figure === 'object') figureOf(pt.figure);
    const fig = pt.figure && (typeof pt.figure === 'string' ? pt.figure : pt.figure.figure);
    return { label: pt.label, question: pt.question, marks: pt.marks, markscheme: pt.markscheme, numeric: pt.numeric, msFigure: ms, ...(fig ? { figure: fig } : {}) };
  });
  return {
    id: q.id, topic: q.topic, paper: q.paper, level: q.level, difficulty: q.difficulty, skills: q.skills, context: q.context,
    seed: def.seed,
    physics: def.physics, vectors: def.vectors, circuit: def.circuit, models, laws,
    data: { rows: d.rows, singles: d.singles, uncertainties },
    text: { stem: q.stem, tables, figures },
    parts,
  };
}

export const fingerprintOf = (content) => crypto.createHash('sha256').update(stableStringify(content)).digest('hex');

// Field-by-field differences between two snapshots, for the report when a frozen dataset changes.
export function diffContent(a, b, path = '', out = []) {
  if (stableStringify(a) === stableStringify(b)) return out;
  const isObj = (x) => x && typeof x === 'object';
  if (isObj(a) && isObj(b) && Array.isArray(a) === Array.isArray(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diffContent(a[k], b[k], path ? `${path}.${k}` : k, out);
  } else if (typeof a === 'string' && typeof b === 'string') {
    // Show the text around the first difference, not the (identical) start.
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    const around = (s) => (i > 30 ? '…' : '') + s.slice(Math.max(0, i - 30), i + 50) + (s.length > i + 50 ? '…' : '');
    out.push({ path, before: around(a), after: around(b) });
  } else {
    const show = (x) => { const s = x === undefined ? '(none)' : JSON.stringify(x); return s.length > 120 ? s.slice(0, 117) + '…' : s; };
    out.push({ path, before: show(a), after: show(b) });
  }
  return out;
}
