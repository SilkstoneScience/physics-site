// Paper 1B generator: turns one dataset definition (tools/1b/datasets/*.mjs) into one question
// for questions/1b.json. Every number a student sees comes from here, in this order:
//   physics model → measurements (seeded noise, rounded to the instrument) → derived columns
//   → fits → results → table, graph, diagrams and the question/mark-scheme text.
// See tools/1b/README.md for how to write a dataset.
import { makeRng, roundTo, decimalsOf, fmtNum, sigFig, parseUnit, linearFit, gradientBand } from './lib.mjs';
import { renderGraph } from './graph.mjs';

export const GENERATOR_VERSION = 1;

export const columnDp = (col) => (col.kind === 'derived' ? col.dp : decimalsOf(col.resolution));

// ---------- 1. Data ----------
function measureOnce(spec, trueValue, rng) {
  const noise = spec.noise || {};
  let v = trueValue;
  if (noise.type === 'gauss') v += noise.sd * rng.gauss();
  else if (noise.type === 'poisson') v = rng.poisson(trueValue);
  else if (noise.type) throw new Error(`unknown noise type "${noise.type}"`);
  return roundTo(v, spec.resolution);
}

// Measured values for every row, plus single readings (e.g. a background count).
// Random numbers are drawn in a fixed order (singles, then row by row, column by column),
// so the same seed always gives exactly the same data.
export function generateRows(def) {
  const rng = makeRng(def.seed);
  const p = def.params || {};
  const singles = {};
  for (const [k, s] of Object.entries(def.singles || {})) singles[k] = measureOnce(s, s.model(p), rng);
  const cols = Object.entries(def.columns);
  const set = cols.find(([, c]) => c.kind === 'set');
  if (!set) throw new Error(`${def.id}: needs one column with kind "set" (the independent variable)`);
  const rows = set[1].values.map((_, i) => {
    const row = {};
    for (const [k, c] of cols) {
      if (c.kind === 'set') row[k] = roundTo(c.values[i], c.resolution);
      else if (c.kind === 'measured') {
        row[k] = measureOnce(c, c.model(row, p, singles), rng);
        if (c.anomaly && c.anomaly.row === i) row[k] = roundTo(row[k] + c.anomaly.shift, c.resolution);
      } else if (c.kind === 'derived') row[k] = roundTo(c.value(row, p, singles), 10 ** -c.dp);
      else throw new Error(`${def.id}: column ${k} has unknown kind "${c.kind}"`);
    }
    return row;
  });
  return { rows, singles };
}

// Absolute uncertainty of one value: a constant, or a rule such as √N (rounded like the column).
export function uncertaintyOf(col, row, p, singles) {
  const u = col.uncertainty;
  if (u == null) return null;
  if (typeof u === 'number') return u;
  if (typeof u === 'function') return roundTo(u(row, p, singles), 10 ** -columnDp(col));
  throw new Error('uncertainty must be a number, a function or null');
}

// ---------- 2. Analysis: fits and results ----------
// `d` is what the dataset's templates see. The validator builds the same object from the
// published table, so every answer can be recalculated from what students actually see.
export function makeContext(def, rows, singles) {
  const p = def.params || {};
  const g = def.graph;
  const d = { def, p, rows, singles };
  d.unc = (k, i) => uncertaintyOf(def.columns[k], rows[i], p, singles);
  d.text = (k, i) => fmtNum(rows[i][k], columnDp(def.columns[k]));
  d.sf = (x, n) => sigFig(x, n);
  d.dp = (x, n) => fmtNum(x, n);
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
    } else if (g.fit) throw new Error(`${def.id}: unknown fit "${g.fit}"`);
  }
  // Ranges from the max/min lines (null if no straight line passes through every error bar).
  d.gradientRange = () => (d.band ? [d.band.mMin, d.band.mMax] : null);
  d.interceptRange = () => (d.band ? [d.band.cMin, d.band.cMax] : null);
  d.r = {};
  for (const [k, res] of Object.entries(def.results || {})) {
    const value = res.value(d);
    d.r[k] = { value, range: res.range ? res.range(d, value) : null, unit: res.unit || '' };
  }
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
  const head = [];
  for (const [k, c] of shown) {
    const u = parseUnit(c.unit || '');
    const pm = typeof c.uncertainty === 'number' ? ` ± ${fmtNum(c.uncertainty, columnDp(c))}` : '';
    head.push(`<th scope="col" data-col="${k}"><span class="h-name">${c.name}</span>$${c.symbol}$${u.text ? ' / ' + u.text : ''}${pm}</th>`);
    if (typeof c.uncertainty === 'function') {
      head.push(`<th scope="col" data-col="${k}" data-unc="1"><span class="h-name">uncertainty</span>$\\Delta ${c.symbol}$${u.text ? ' / ' + u.text : ''}</th>`);
    }
  }
  const body = d.rows.map((row, i) => '<tr>' + shown.map(([k, c]) => {
    const hidden = (c.hide || []).includes(i);
    const cell = (unc) => `<td data-col="${k}" data-row="${i}"${unc ? ' data-unc="1"' : ''}${hidden ? ' class="blank"' : ''}>${hidden ? '?' : unc ? fmtNum(d.unc(k, i), columnDp(c)) : d.text(k, i)}</td>`;
    return cell(false) + (typeof c.uncertainty === 'function' ? cell(true) : '');
  }).join('') + '</tr>').join('');
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${head.join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
}

export function graphFigure(def, d, kind) {
  const g = def.graph;
  const [cx, cy] = [def.columns[g.x], def.columns[g.y]];
  const omit = kind === 'student' ? g.omit || [] : [];
  const points = d.rows.map((row, i) => ({
    x: row[g.x], y: row[g.y], row: i,
    ex: (g.xErrorBars && d.unc(g.x, i)) || 0, ey: d.unc(g.y, i) || 0,
  })).filter((pt) => !omit.includes(pt.row));
  const lines = [];
  const curves = [];
  if (kind === 'examiner' && g.fit === 'linear') {
    lines.push({ m: d.fit.m, c: d.fit.c, cls: 'l1 thin', fit: 'best' });
    if (d.band) {
      lines.push({ m: d.band.steep.m, c: d.band.steep.c, cls: 'l2 thin dash', fit: 'max' });
      lines.push({ m: d.band.shallow.m, c: d.band.shallow.c, cls: 'l2 thin dash', fit: 'min' });
    }
  }
  if (kind === 'examiner' && g.fit === 'exponential') curves.push({ f: (x) => d.fit.A * Math.exp(-d.fit.k * x), cls: 'l1 thin' });
  const bars = points.some((pt) => pt.ey || pt.ex);
  const what = `${cy.name} against ${cx.name}`;
  const alt = `Graph of ${what}, with ${points.length} plotted points${bars ? ' and error bars' : ''}`
    + (kind === 'examiner' ? (g.fit === 'linear' ? ', the line of best fit' + (d.band ? ' and the steepest and shallowest lines' : '') : ', and the curve of best fit') : '')
    + '. The values are in the data table.';
  const svg = renderGraph({
    x: { symbol: cx.symbolText || cx.symbol, unit: parseUnit(cx.unit || '').text, includeZero: !!(g.zero && g.zero.x) },
    y: { symbol: cy.symbolText || cy.symbol, unit: parseUnit(cy.unit || '').text, includeZero: !!(g.zero && g.zero.y) },
    points, lines, curves, alt, kind,
  });
  const caption = kind === 'student'
    ? `Graph of ${what}${bars ? '. The error bars show the uncertainties' : ''}.`
    : (g.fit === 'linear'
      ? '<span class="key-1">Blue</span>: line of best fit.' + (d.band ? ' <span class="key-2">Orange, dashed</span>: steepest and shallowest lines through the error bars.' : '')
      : '<span class="key-1">Blue</span>: curve of best fit.');
  return { kind: 'figure', figure: kind === 'student' ? 'graph' : 'graph-ms', svg, alt, caption };
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
  const order = def.present || ['diagram', 'table', 'graph'];
  const data = order.filter((k) => k === 'table' || figures[k]).map((k) => (k === 'table'
    ? { kind: 'table', caption: def.tableCaption || '', html: tableHtml(def, d) }
    : figures[k]));
  const parts = def.parts(d).map((pt) => {
    const { msFigure, ...rest } = pt;
    if (msFigure && !figures[msFigure]) throw new Error(`${def.id} part (${pt.label}): no figure called "${msFigure}"`);
    return msFigure ? { ...rest, msFigure: figures[msFigure] } : rest;
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
  return { question, d };
}
