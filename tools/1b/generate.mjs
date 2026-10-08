// Paper 1B generator: turns one dataset definition (tools/1b/datasets/*.mjs) into one question
// for questions/1b.json. Every number a student sees comes from here, in this order:
//   physics model → measurements (seeded noise, rounded to the instrument) → derived columns
//   → fits → results → table, graph, diagrams and the question/mark-scheme text.
// See tools/1b/README.md for how to write a dataset.
import { makeRng, roundTo, decimalsOf, fmtNum, sigFig, parseUnit, sameDim, linearFit, gradientBand, toSI, fromSI, baseUnitExpr, valuePm, sciParts } from './lib.mjs';
import { renderGraph } from './graph.mjs';
import { propagate } from './uncertainty.mjs';
import { applySystematic } from './systematic.mjs';
import { LAWS } from './laws.mjs';

export const GENERATOR_VERSION = 2;

export const columnDp = (col) => (col.kind === 'derived' ? col.dp : decimalsOf(col.resolution));

// ---------- 0. The physics model ----------
// Parameter values only ({ B: 0.064, … }), for templates and analysis formulas.
export const paramValues = (def) => Object.fromEntries(Object.entries((def.physics && def.physics.params) || {}).map(([k, v]) => [k, v.value]));

export class PhysicsError extends Error {
  constructor(message, code = 'physics-units') { super(message); this.code = code; }
}
const dimText = (dim) => {
  const names = ['m', 'kg', 's', 'A', 'K', 'angle'];
  const parts = dim.map((p, i) => (p ? names[i] + (p === 1 ? '' : '^' + p) : '')).filter(Boolean);
  return parts.length ? parts.join(' ') : 'no unit';
};

// Works out a model expression with units checked at every step. An expression is:
//   'p.B'  a parameter (physics.params)   'row.I'  a column in this row   's.Nb'  a single reading
//   { value: 300, unit: 's' }  a fixed value
//   { law: 'force-on-wire', inputs: { B: 'p.B', … } }  a vetted law from laws.mjs
// Returns { si, dim }: the value in SI units and its dimensions.
export function evalModel(expr, env, where) {
  if (typeof expr === 'string') {
    const [src, name] = expr.split('.');
    const table = { p: env.params, row: env.row, s: env.singles }[src];
    if (!table || !(name in table)) throw new PhysicsError(`${where}: "${expr}" doesn't name a parameter (p.), column (row.) or single reading (s.)`);
    const unitExpr = src === 'p' ? env.def.physics.params[name].unit : src === 'row' ? env.def.columns[name].unit : env.def.singles[name].unit;
    const u = parseUnit(unitExpr || '');
    return { si: toSI(table[name], u), dim: u.dim, tempKind: u.tempKind };
  }
  if (expr && typeof expr === 'object' && 'value' in expr) {
    const u = parseUnit(expr.unit || '');
    return { si: toSI(expr.value, u), dim: u.dim, tempKind: u.tempKind };
  }
  if (expr && typeof expr === 'object' && expr.law) {
    const law = LAWS[expr.law];
    if (!law) throw new PhysicsError(`${where}: there is no vetted law "${expr.law}" in laws.mjs`, 'physics-meta');
    for (const k of Object.keys(expr.inputs || {})) if (!(k in law.inputs)) throw new PhysicsError(`${where}: law ${expr.law} has no input "${k}"`);
    const args = {};
    for (const [k, unit] of Object.entries(law.inputs)) {
      const want = parseUnit(unit);
      if (!(k in (expr.inputs || {}))) {
        if (law.defaults && k in law.defaults) { args[k] = law.defaults[k]; continue; }
        throw new PhysicsError(`${where}: law ${expr.law} needs input "${k}" (${unit || 'no unit'})`);
      }
      const got = evalModel(expr.inputs[k], env, `${where} → ${expr.law}.${k}`);
      if (!sameDim(got.dim, want.dim)) {
        throw new PhysicsError(`${where}: input "${k}" of ${expr.law} must be in ${unit || 'no unit'} (${dimText(want.dim)}), but the value given is in ${dimText(got.dim)}`);
      }
      if (want.tempKind && got.tempKind && want.tempKind !== got.tempKind) {
        throw new PhysicsError(`${where}: input "${k}" of ${expr.law} needs a ${want.tempKind === 'absolute' ? 'temperature' : 'temperature difference'}, but the value given is a ${got.tempKind === 'absolute' ? 'temperature' : 'temperature difference'}`);
      }
      args[k] = got.si;
    }
    const outUnit = parseUnit(law.output);
    return { si: law.f(args), dim: outUnit.dim, tempKind: outUnit.tempKind };
  }
  throw new PhysicsError(`${where}: the model must be built from a vetted law in laws.mjs ({ law, inputs }), not a formula`, 'physics-meta');
}

// The model's value of a measured column (or single reading), in that column's own unit.
export function modelValue(def, spec, env, where) {
  const out = evalModel(spec.model, { ...env, def }, where);
  const u = parseUnit(spec.unit || '');
  if (!sameDim(out.dim, u.dim)) {
    throw new PhysicsError(`${where}: the model gives ${dimText(out.dim)}, but the column is in ${spec.unit || 'no unit'} (${dimText(u.dim)})`);
  }
  if (u.tempKind && out.tempKind && u.tempKind !== out.tempKind) {
    throw new PhysicsError(`${where}: the model gives a ${out.tempKind === 'absolute' ? 'temperature' : 'temperature difference'}, but the column holds a ${u.tempKind === 'absolute' ? 'temperature' : 'temperature difference'}`);
  }
  return fromSI(out.si, u);
}

// ---------- 1. Data ----------
function measureOnce(spec, trueValue, rng, ideal) {
  if (ideal) return trueValue;
  const noise = spec.noise || {};
  let v = trueValue;
  if (noise.type === 'gauss') v += noise.sd * rng.gauss();
  else if (noise.type === 'gauss-relative') v *= 1 + noise.sd * rng.gauss(); // sd is a fraction, e.g. 0.012 = 1.2 %
  else if (noise.type === 'poisson') v = rng.poisson(trueValue);
  else if (noise.type) throw new Error(`unknown noise type "${noise.type}"`);
  return roundTo(v, spec.resolution);
}

// Measured values for every row, plus single readings (e.g. a background count).
// Random numbers are drawn in a fixed order (singles, then row by row, column by column),
// so the same seed always gives exactly the same data.
// ideal: true gives the model's exact values (no noise, no anomaly, no rounding), used to check
// that each result's analysis recovers the model's own parameters.
export function generateRows(def, { ideal = false } = {}) {
  const rng = makeRng(def.seed);
  const p = paramValues(def);
  const singles = {};
  for (const [k, s] of Object.entries(def.singles || {})) {
    singles[k] = measureOnce(s, modelValue(def, s, { params: p, row: {}, singles }, `single ${k}`), rng, ideal);
  }
  const cols = Object.entries(def.columns);
  const set = cols.find(([, c]) => c.kind === 'set');
  if (!set) throw new Error(`${def.id}: needs one column with kind "set" (the independent variable)`);
  const rows = set[1].values.map((_, i) => {
    const row = {};
    for (const [k, c] of cols) {
      if (c.kind === 'set') row[k] = ideal ? c.values[i] : roundTo(c.values[i], c.resolution);
      else if (c.kind === 'measured') {
        // Systematic effects (if any) change the true value deterministically, before random scatter;
        // the ideal (noise-free) data are the pure physics, without them.
        const physics = modelValue(def, c, { params: p, row, singles }, `column ${k}`);
        const model = ideal ? physics : applySystematic(c.systematic, physics, row);
        if (c.trials) {
          // Repeated readings: the column shows their mean (rounded like one reading); the readings
          // are kept in row[k + '__trials'] for the uncertainty (half the range) and the trials table.
          const readings = Array.from({ length: c.trials }, () => measureOnce(c, model, rng, ideal));
          row[k + '__trials'] = readings;
          const mean = readings.reduce((a, b) => a + b, 0) / readings.length;
          row[k] = ideal ? mean : roundTo(mean, c.resolution);
        } else row[k] = measureOnce(c, model, rng, ideal);
        if (!ideal && c.anomaly && c.anomaly.row === i) row[k] = roundTo(row[k] + c.anomaly.shift, c.resolution);
      } else if (c.kind === 'catalogue') {
        // Published (secondary) data: the source's values, rounded to the column's resolution. The noise-free
        // data are the physics model's values, so the analysis can be checked against the model exactly.
        // An observed column (no model) keeps its published values even in the noise-free data.
        row[k] = ideal && !c.observed ? modelValue(def, c, { params: p, row, singles }, `column ${k}`) : roundTo(c.values[i], c.resolution);
      } else if (c.kind === 'derived') {
        const v = c.value(row, p, singles);
        row[k] = ideal ? v : roundTo(v, 10 ** -c.dp);
      } else throw new Error(`${def.id}: column ${k} has unknown kind "${c.kind}"`);
    }
    return row;
  });
  return { rows, singles };
}

export const halfRange = (a) => (Math.max(...a) - Math.min(...a)) / 2;
// Uncertainty given separately for each row (a column of its own in the table) rather than one value for the whole column.
export const perRowUncertainty = (col) => typeof col.uncertainty === 'function' || col.uncertainty === 'halfRange' || !!col.propagation;

// Absolute uncertainty of one value: a constant, or a rule such as √N (rounded like the column).
// def is needed for declared propagation (to find the input columns and their uncertainties).
export function uncertaintyOf(col, row, p, singles, key, def) {
  if (col.propagation) {
    const input = (t) => {
      const value = t.of !== undefined ? row[t.of] : singles[t.single];
      let unc;
      if (t.unc === 'poisson') unc = Math.sqrt(value);
      else if (typeof t.unc === 'number') unc = t.unc;
      else if (t.of !== undefined) unc = uncertaintyOf(def.columns[t.of], row, p, singles, t.of, def);
      else unc = def.singles[t.single].uncertainty;
      if (!(unc >= 0)) throw new Error(`propagation in column ${key}: no uncertainty for ${t.of || t.single}`);
      return { value, unc };
    };
    return roundTo(propagate(col.propagation, col.value(row, p, singles), input, p), 10 ** -columnDp(col));
  }
  const u = col.uncertainty;
  if (u == null) return null;
  if (typeof u === 'number') return u;
  if (typeof u === 'function') return roundTo(u(row, p, singles), 10 ** -columnDp(col));
  if (u === 'halfRange') return roundTo(halfRange(row[key + '__trials']), 10 ** -columnDp(col));
  throw new Error('uncertainty must be a number, a function, "halfRange" or null');
}

// ---------- 2. Analysis: fits and results ----------
// `d` is what the dataset's templates see. The validator builds the same object from the
// published table, so every answer can be recalculated from what students actually see.
export function makeContext(def, rows, singles) {
  const p = paramValues(def);
  const g = def.graph;
  const d = { def, p, rows, singles };
  d.unc = (k, i) => uncertaintyOf(def.columns[k], rows[i], p, singles, k, def);
  // Every number a template prints goes through one of these, which records it (d.traced), so the
  // validator can tell numbers that come from the data from numbers typed into the text.
  d.traced = new Set();
  const rec = (s) => { d.traced.add(s); return s; };
  d.text = (k, i) => rec(fmtNum(rows[i][k], columnDp(def.columns[k])));
  d.sf = (x, n) => rec(sigFig(x, n));
  d.dp = (x, n) => rec(fmtNum(x, n));
  d.int = (x) => rec(fmtNum(x, 0));
  // Scientific notation in MathJax, e.g. 1.9 	imes 10^{27} (the mantissa is traced; the exponent is not a number in this sense).
  d.sci = (x, n) => { const s = sciParts(x, n); return `${rec(s.mant)} \\times 10^{${s.exp}}`; };
  // A stated constant: a number the question gives that isn't in the data (def.stated), with its source.
  d.stated = (name) => {
    const st = (def.stated || {})[name];
    if (!st) throw new Error(`${def.id}: no stated constant called "${name}"`);
    return rec(fmtNum(st.value, st.dp));
  };
  d.unit = (expr) => parseUnit(expr).text;
  // Accepted range: the max/min-line range, widened to at least ±pct of the value (for reading a graph).
  d.widen = (range, v, pct) => [Math.min(range ? range[0] : v, v - Math.abs(v) * pct), Math.max(range ? range[1] : v, v + Math.abs(v) * pct)];
  if (g) {
    d.fitRows = rows.map((_, i) => i).filter((i) => !(g.exclude || []).includes(i));
    const pts = d.fitRows.map((i) => ({ x: rows[i][g.x], y: rows[i][g.y], ex: (g.xErrorBars && d.unc(g.x, i)) || 0, ey: d.unc(g.y, i) || 0 }));
    if (g.fit === 'linear') {
      d.fit = linearFit(pts.map((q) => q.x), pts.map((q) => q.y));
      d.band = g.band ? gradientBand(pts) : null;
    } else if (g.fit === 'exponential') {
      const ok = pts.filter((q) => q.y > 0);
      const lf = linearFit(ok.map((q) => q.x), ok.map((q) => Math.log(q.y)));
      d.fit = { k: -lf.m, A: Math.exp(lf.c), r2: lf.r2, halfLife: Math.LN2 / -lf.m };
    } else if (g.fit && g.fit !== 'none') throw new Error(`${def.id}: unknown fit "${g.fit}"`);
  }
  // Ranges from the max/min lines (null if no straight line passes through every error bar).
  d.gradientRange = () => (d.band ? [d.band.mMin, d.band.mMax] : null);
  d.interceptRange = () => (d.band ? [d.band.cMin, d.band.cMax] : null);
  d.r = {};
  for (const [k, res] of Object.entries(def.results || {})) {
    const value = res.value(d);
    d.r[k] = { value, range: res.range ? res.range(d, value) : null, unit: res.unit || '' };
  }
  // "State the unit" parts (asks: { unit: 'name' }): a result's unit, as given or in SI base units, in MathJax.
  const resultUnit = (name) => {
    if (!d.r[name]) throw new Error(`${def.id}: no result called "${name}"`);
    return parseUnit(d.r[name].unit);
  };
  d.unitTex = (name) => resultUnit(name).tex;
  d.baseUnitTex = (name) => parseUnit(baseUnitExpr(resultUnit(name).dim)).tex;
  // "Value ± uncertainty" parts (asks: { valuePm: ['B', 'dB'] }): the uncertainty to sf significant figures
  // and the value to the same decimal place, both traced.
  d.pm = (name, uncName, sf = 1) => {
    if (!d.r[name] || !d.r[uncName]) throw new Error(`${def.id}: d.pm needs results "${name}" and "${uncName}"`);
    const t = valuePm(d.r[name].value, d.r[uncName].value, sf);
    return `${rec(t.value)} \\pm ${rec(t.unc)}`;
  };
  // The "numeric" field of a part, taken from a named result (so it can't be typed by hand).
  d.num = (name, extra = {}) => {
    const r = d.r[name];
    if (!r) throw new Error(`${def.id}: no result called "${name}"`);
    const tex = parseUnit(r.unit).tex;
    return { answer: r.value, ...(r.range ? { range: r.range } : {}), ...(tex ? { unit: tex } : {}), source: name, ...extra };
  };
  return d;
}

// ---------- 3. Presentation ----------
export function tableHtml(def, d) {
  const shown = Object.entries(def.columns).filter(([, c]) => c.show !== false);
  // rowLabels: { heading, values }: a first column naming each row (a planet, a year), as row headers with no numbers.
  const labels = def.rowLabels;
  const head = labels ? [`<th scope="col">${labels.heading}</th>`] : [];
  for (const [k, c] of shown) {
    const u = parseUnit(c.unit || '');
    // showUncertainty: false keeps a column's uncertainty internal (validation only) when no part uses it.
    const pm = typeof c.uncertainty === 'number' && c.showUncertainty !== false ? ` ± ${fmtNum(c.uncertainty, columnDp(c))}` : '';
    head.push(`<th scope="col" data-col="${k}"><span class="h-name">${c.name}</span>$${c.symbol}$${u.text ? ' / ' + u.text : ''}${pm}</th>`);
    if (perRowUncertainty(c) && c.showUncertainty !== false) {
      head.push(`<th scope="col" data-col="${k}" data-unc="1"><span class="h-name">uncertainty</span>$${c.uncSymbol || '\\Delta ' + c.symbol}$${u.text ? ' / ' + u.text : ''}</th>`);
    }
  }
  const body = d.rows.map((row, i) => '<tr>' + (labels ? `<th scope="row">${labels.values[i]}</th>` : '') + shown.map(([k, c]) => {
    const hidden = (c.hide || []).includes(i);
    const cell = (unc) => `<td data-col="${k}" data-row="${i}"${unc ? ' data-unc="1"' : ''}${hidden ? ' class="blank"' : ''}>${hidden ? '?' : unc ? fmtNum(d.unc(k, i), columnDp(c)) : d.text(k, i)}</td>`;
    return cell(false) + (perRowUncertainty(c) && c.showUncertainty !== false ? cell(true) : '');
  }).join('') + '</tr>').join('');
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${head.join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
}

// The individual readings of one row of a repeated measurement, for students to process
// (def.trialsTable: { column, row, caption }). Drawn as a narrow two-column table so it fits on phones.
export function trialsTableHtml(def, d) {
  const { column: k, row: i } = def.trialsTable;
  const c = def.columns[k];
  const u = parseUnit(c.unit || '');
  const readings = d.rows[i][k + '__trials'];
  if (!readings) throw new Error(`${def.id}: trialsTable needs column ${k} to have repeated readings (trials)`);
  const body = readings.map((v, j) => `<tr><td>${j + 1}</td><td data-trial="${j}">${fmtNum(v, columnDp(c))}</td></tr>`).join('');
  return `<div class="table-wrap"><table class="data-table trials" data-col="${k}" data-row="${i}"><thead><tr><th scope="col">trial</th>`
    + `<th scope="col">$${c.symbol}$${u.text ? ' / ' + u.text : ''}</th></tr></thead><tbody>${body}</tbody></table></div>`;
}

// spec: def.graph (the analysed graph: 'graph' and 'graph-ms') or def.rawGraph (raw data before a
// transformation: 'graph-raw', students' version only, never with a fitted line).
export function graphFigure(def, d, kind, g = def.graph, name = kind === 'student' ? 'graph' : 'graph-ms') {
  const [cx, cy] = [def.columns[g.x], def.columns[g.y]];
  const omit = kind === 'student' ? g.omit || [] : [];
  // errorBars: 'too-small' (see safeguards.mjs, P1): the uncertainties are too small to see as bars, so none are drawn
  // and the caption states them instead. They are still used for every max/min line and verdict.
  // errorBars 'none': no part uses the uncertainty, so nothing about it is drawn or said.
  const hideBars = g.errorBars === 'too-small' || g.errorBars === 'none';
  const points = d.rows.map((row, i) => ({
    x: row[g.x], y: row[g.y], row: i,
    ex: (!hideBars && g.xErrorBars && d.unc(g.x, i)) || 0, ey: (!hideBars && d.unc(g.y, i)) || 0,
  })).filter((pt) => !omit.includes(pt.row));
  const lines = [];
  const curves = [];
  if (kind === 'examiner' && g === def.graph && g.fit === 'linear') {
    lines.push({ m: d.fit.m, c: d.fit.c, cls: 'l1 thin', fit: 'best' });
    // With errorBars 'none' no part uses the uncertainty, so the steepest and shallowest lines aren't drawn either.
    if (d.band && g.errorBars !== 'none') {
      lines.push({ m: d.band.steep.m, c: d.band.steep.c, cls: 'l2 thin dash', fit: 'max' });
      lines.push({ m: d.band.shallow.m, c: d.band.shallow.c, cls: 'l2 thin dash', fit: 'min' });
    }
  }
  if (kind === 'examiner' && g === def.graph && g.fit === 'exponential') curves.push({ f: (x) => d.fit.A * Math.exp(-d.fit.k * x), cls: 'l1 thin' });
  // T6: a model curve (the physics, not a fit) on the examiner's graph only, and a reference line (e.g. observed = model)
  // on both graphs. Points-only graphs use fit: 'none'.
  if (kind === 'examiner' && g.modelCurve) curves.push({ f: g.modelCurve(d), cls: 'l1 thin', model: true });
  const ref = g.referenceLine ? (typeof g.referenceLine === 'function' ? g.referenceLine(d) : g.referenceLine) : null;
  const bars = points.some((pt) => pt.ey || pt.ex);
  // g.what: a fuller description for the caption and alt text when the table's short column names would read oddly.
  const what = g.what || `${cy.name} against ${cx.name}`;
  const alt = `Graph of ${what}, ${g.style === 'trace' ? `a line through the sensor readings` : `with ${points.length} plotted points${bars ? ' and error bars' : ''}`}`
    + (kind === 'examiner' && g.shade ? `, with ${g.shade.label} shaded` : '')
    + (kind === 'examiner' ? (g.fit === 'linear' ? (g.errorBars === 'none' ? ' and the line of best fit' : ', the line of best fit' + (d.band ? ' and the steepest and shallowest lines' : '')) : g.fit === 'exponential' ? ', and the curve of best fit' : '') : '')
    + (kind === 'examiner' && g.modelCurve ? `, and the model curve (${g.modelCurveLabel})` : '')
    + (ref ? `, and a dashed line showing ${ref.label}` : '')
    // Data without a student table (tableless): there is no table to point to, so describe the graph's shape instead.
    + (def.tableless ? `. ${g.altDescription || 'The readings are shown only on this graph.'}` : '. The values are in the data table.');
  const svg = renderGraph({
    x: { symbol: cx.symbolText || cx.symbol, unit: parseUnit(cx.unit || '').text, includeZero: !!(g.zero && g.zero.x), range: g.xRange },
    y: { symbol: cy.symbolText || cy.symbol, unit: parseUnit(cy.unit || '').text, includeZero: !!(g.zero && g.zero.y), range: g.yRange },
    points, lines, curves, refs: ref ? [ref] : [], alt, kind, height: g.height,
    trace: g.style === 'trace',
    shade: kind === 'examiner' && g.shade ? { from: g.shade.from, to: g.shade.to, baseline: typeof g.shade.baseline === 'function' ? g.shade.baseline(d) : g.shade.baseline } : null,
  });
  const uy = d.rows.map((_, i) => d.unc(g.y, i));
  const tooSmall = g.errorBars !== 'too-small' ? ''
    : uy.every((u) => u === uy[0]) && uy[0]
      ? ` The uncertainty in ${cy.name} (±${fmtNum(uy[0], columnDp(cy))}${parseUnit(cy.unit || '').text ? ' ' + parseUnit(cy.unit || '').text : ''}) is too small to show as error bars.`
      : ' The uncertainties are too small to show as error bars.';
  const refNote = ref ? ` The dashed line shows ${ref.label}.` : '';
  const caption = kind === 'student'
    ? `Graph of ${what}${bars ? '. The error bars show the uncertainties' : ''}.${tooSmall}${refNote}`
    : (g.fit === 'linear'
      ? '<span class="key-1">Blue</span>: line of best fit.' + (d.band && g.errorBars !== 'none' ? ' <span class="key-2">Orange, dashed</span>: steepest and shallowest lines ' + (hideBars ? 'that fit the data within their uncertainties.' : 'through the error bars.') : '')
      : g.fit === 'exponential' ? '<span class="key-1">Blue</span>: curve of best fit.' : `Graph of ${what}.`)
      + (g.modelCurve ? ` <span class="key-1">Blue</span>: ${g.modelCurveLabel}.` : '') + (g.shade ? ` Shaded: ${g.shade.label}.` : '') + tooSmall + refNote;
  return { kind: 'figure', figure: name, svg, alt, caption };
}

// ---------- 4. The question ----------
export function buildQuestion(def) {
  const { rows, singles } = generateRows(def);
  const d = makeContext(def, rows, singles);
  const figures = {};
  for (const [name, make] of Object.entries(def.figures || {})) figures[name] = { kind: 'figure', figure: name, ...make(d) };
  if (def.graph) {
    figures.graph = graphFigure(def, d, 'student');
    figures['graph-ms'] = graphFigure(def, d, 'examiner');
  }
  if (def.rawGraph) figures['graph-raw'] = graphFigure(def, d, 'student', def.rawGraph, 'graph-raw');
  const order = def.present || ['diagram', 'table', 'graph'];
  const data = order.filter((k) => k === 'table' || k === 'trials' || figures[k]).map((k) => {
    if (k === 'table') return { kind: 'table', caption: def.tableCaption || '', html: tableHtml(def, d) };
    if (k === 'trials') return { kind: 'table', figure: 'trials', caption: def.trialsTable.caption || '', html: trialsTableHtml(def, d) };
    return figures[k];
  });
  const rawParts = def.parts(d);
  // Design metadata for the validator and reports (AO tags, what a part asks for): not published.
  const meta = rawParts.map((pt) => ({ label: pt.label, marks: pt.marks, ao: pt.ao, asks: pt.asks, reads: pt.reads }));
  const parts = rawParts.map((pt) => {
    const { msFigure, figure, ao: _ao, asks: _asks, reads: _reads, ...rest } = pt;
    if (msFigure && !figures[msFigure]) throw new Error(`${def.id} part (${pt.label}): no figure called "${msFigure}"`);
    // figure: shown with the part's question (data revealed by the part, as in a printed paper).
    if (figure && !figures[figure]) throw new Error(`${def.id} part (${pt.label}): no figure called "${figure}"`);
    return { ...rest, ...(figure ? { figure: figures[figure] } : {}), ...(msFigure ? { msFigure: figures[msFigure] } : {}) };
  });
  const question = {
    id: def.id,
    theme: def.topic.charAt(0),
    topic: def.topic,
    paper: '1B',
    difficulty: def.difficulty,
    level: 'SL_HL',
    skills: def.skills,
    context: def.context,
    stem: def.intro(d),
    data,
    parts,
    generated: { version: GENERATOR_VERSION, seed: def.seed },
  };
  return { question, d, traced: [...d.traced], meta };
}
