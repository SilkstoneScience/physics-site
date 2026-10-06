// Paper 1B graphs: draws an SVG graph straight from the data, never by hand.
// Uses the site's diagram classes (axis, grid, l1, l2, f1…), so graphs follow light/dark mode.
// The validator (validate.mjs) reads these graphs back, so keep the markup patterns in step with it:
//   tick labels  <text class="tx" x=…>value</text>  /  <text class="ty" … y=…>value</text>
//   points       <circle class="f1 pt" cx=… cy=… r=… data-row="i"/>
//   error bars   <path class="ebar" data-row="i" data-axis="y" d="Mx y1Vy2…"/>
//   fit lines    <line class="… fit" data-fit="best|max|min" x1=… y1=… x2=… y2=…/>
//   fit curve    <polyline class="… fit" data-fit="curve" points="…"/>
import { fmtNum, escapeAttr } from './lib.mjs';

export const BOX = { W: 560, H: 400, l: 86, r: 24, t: 20, b: 66 };
// Point markers are small, and error bars are drawn ON TOP of them, so a short error bar (a small
// uncertainty) is never hidden inside its point. Radius 3.2 units ≈ 6 px across at full size and
// about 3.5 px on a 375 px phone. Caps are wider than a marker so the ends of every bar show.
// These change only how the graph looks: positions and bar lengths come from the data.
export const MARKER_R = 3.2;
export const CAP = 5;
const r1 = (n) => Math.round(n * 10) / 10;
const tidy = (n) => Number(n.toPrecision(12));

// Axis scale with 1, 2 or 5 × 10ⁿ steps (about six of them) and a finer grid for reading values.
export function niceScale(lo, hi, includeZero = false) {
  if (includeZero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  if (hi - lo < 1e-12) hi = lo + 1;
  const rough = (hi - lo) / 6;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const f = [1, 2, 5, 10].find((k) => k * mag >= rough * 0.999);
  const step = tidy(f * mag);
  return {
    min: tidy(Math.floor(lo / step + 1e-9) * step),
    max: tidy(Math.ceil(hi / step - 1e-9) * step),
    step,
    minor: tidy(step / (f === 2 ? 4 : 5)),
    dp: Math.max(0, -Math.floor(Math.log10(step) + 1e-9)),
  };
}

// Axis title: "Δm / g" with the symbol in italics.
function axisTitle(ax) {
  return `<tspan font-style="italic">${ax.symbol}</tspan>${ax.unit ? ' / ' + ax.unit : ''}`;
}

// Cuts the line y = m x + c to the plotting area. Returns [x1, y1, x2, y2] in data units, or null.
function clipLine(m, c, xs, ys) {
  const pts = [];
  for (const x of [xs.min, xs.max]) { const y = m * x + c; if (y >= ys.min - 1e-12 && y <= ys.max + 1e-12) pts.push([x, y]); }
  if (Math.abs(m) > 1e-15) {
    for (const y of [ys.min, ys.max]) { const x = (y - c) / m; if (x > xs.min && x < xs.max) pts.push([x, y]); }
  }
  if (pts.length < 2) return null;
  pts.sort((a, b) => a[0] - b[0]);
  return [...pts[0], ...pts[pts.length - 1]];
}

// spec: { x: {symbol, unit, includeZero}, y: {…}, points: [{x, y, ex, ey, row}],
//         lines: [{m, c, cls, fit}], curves: [{f, cls}], alt, kind: 'student' | 'examiner' }
export function renderGraph(spec) {
  const { x, y, points, lines = [], curves = [], alt, kind } = spec;
  const { W, H, l, r, t, b } = BOX;
  const pw = W - l - r;
  const ph = H - t - b;
  // An axis may be extended to include a stated range (x.range, y.range), e.g. to extrapolate to an intercept.
  const ext = (ax, lo, hi) => (ax.range ? [Math.min(lo, ax.range[0]), Math.max(hi, ax.range[1])] : [lo, hi]);
  const xs = niceScale(...ext(x, Math.min(...points.map((p) => p.x - (p.ex || 0))), Math.max(...points.map((p) => p.x + (p.ex || 0)))), x.includeZero);
  const ys = niceScale(...ext(y, Math.min(...points.map((p) => p.y - (p.ey || 0))), Math.max(...points.map((p) => p.y + (p.ey || 0)))), y.includeZero);
  const X = (v) => r1(l + ((v - xs.min) / (xs.max - xs.min)) * pw);
  const Y = (v) => r1(t + ph - ((v - ys.min) / (ys.max - ys.min)) * ph);
  const out = [`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeAttr(alt)}" data-graph="${kind}">`];

  // Grid: fine lines first, then the main lines with their numbers.
  for (const [sc, isX] of [[xs, true], [ys, false]]) {
    const nMinor = Math.round((sc.max - sc.min) / sc.minor);
    for (let i = 0; i <= nMinor; i++) {
      const v = sc.min + i * sc.minor;
      out.push(isX ? `<line class="grid-minor" x1="${X(v)}" y1="${t}" x2="${X(v)}" y2="${t + ph}"/>`
        : `<line class="grid-minor" x1="${l}" y1="${Y(v)}" x2="${l + pw}" y2="${Y(v)}"/>`);
    }
    const nMajor = Math.round((sc.max - sc.min) / sc.step);
    for (let i = 0; i <= nMajor; i++) {
      const v = tidy(sc.min + i * sc.step);
      out.push(isX
        ? `<line class="grid" x1="${X(v)}" y1="${t}" x2="${X(v)}" y2="${t + ph}"/><text class="tx" x="${X(v)}" y="${t + ph + 24}" text-anchor="middle" font-size="15">${fmtNum(v, sc.dp)}</text>`
        : `<line class="grid" x1="${l}" y1="${Y(v)}" x2="${l + pw}" y2="${Y(v)}"/><text class="ty" x="${l - 8}" y="${Y(v)}" dy="0.35em" text-anchor="end" font-size="15">${fmtNum(v, sc.dp)}</text>`);
    }
  }
  out.push(`<path class="axis" d="M${l} ${t}V${t + ph}H${l + pw}"/>`);
  out.push(`<text class="ax-x" x="${l + pw / 2}" y="${H - 10}" text-anchor="middle" font-size="16">${axisTitle(x)}</text>`);
  out.push(`<text class="ax-y" transform="translate(18 ${t + ph / 2}) rotate(-90)" text-anchor="middle" font-size="16">${axisTitle(y)}</text>`);

  // Lines and curves go under the points.
  for (const ln of lines) {
    const seg = clipLine(ln.m, ln.c, xs, ys);
    if (seg) out.push(`<line class="${ln.cls} fit" data-fit="${ln.fit}" x1="${X(seg[0])}" y1="${Y(seg[1])}" x2="${X(seg[2])}" y2="${Y(seg[3])}"/>`);
  }
  for (const cv of curves) {
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const xv = xs.min + ((xs.max - xs.min) * i) / 80;
      const yv = cv.f(xv);
      if (yv >= ys.min && yv <= ys.max) pts.push(`${X(xv)},${Y(yv)}`);
    }
    out.push(`<polyline class="${cv.cls} fit" data-fit="curve" points="${pts.join(' ')}"/>`);
  }
  // Points first, then their error bars on top (so no bar is hidden behind its point).
  for (const p of points) out.push(`<circle class="f1 pt" cx="${X(p.x)}" cy="${Y(p.y)}" r="${MARKER_R}" data-row="${p.row}"/>`);
  for (const p of points) {
    if (p.ey) {
      const [x0, y1, y2] = [X(p.x), Y(p.y + p.ey), Y(p.y - p.ey)];
      out.push(`<path class="ebar" data-row="${p.row}" data-axis="y" d="M${x0} ${y1}V${y2}M${r1(x0 - CAP)} ${y1}H${r1(x0 + CAP)}M${r1(x0 - CAP)} ${y2}H${r1(x0 + CAP)}"/>`);
    }
    if (p.ex) {
      const [y0, x1, x2] = [Y(p.y), X(p.x - p.ex), X(p.x + p.ex)];
      out.push(`<path class="ebar" data-row="${p.row}" data-axis="x" d="M${x1} ${y0}H${x2}M${x1} ${r1(y0 - CAP)}V${r1(y0 + CAP)}M${x2} ${r1(y0 - CAP)}V${r1(y0 + CAP)}"/>`);
    }
  }
  out.push('</svg>');
  return out.join('');
}
