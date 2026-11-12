// Click-to-plot graphs for "draw the graph" parts in the question bank (js/questions.js).
// A part can have:
//   "plot": { "title": "Axes for …",
//     "x": { "min": 0, "max": 20, "step": 1, "major": 2, "symbol": "I", "unit": "A" },
//     "y": { "min": 14, "max": 21, "step": 0.5, "major": 1, "symbol": "V", "unit": "V" },
//     "points": [[2, 19.5], …],                                   the points the student must plot
//     "line": { "gradient": -0.25, "intercept": 20, "toYAxis": true },   optional line of best fit
//     "marks": { "line": 1 },                                     optional: marks for the line (default 1)
//     "axes": "questions/diagrams/….svg" }                        the same axes as a picture, for printing
// "step" is one small square and "major" the spacing of the darker, numbered lines.
// The student taps to plot points and drags to draw the line; check() marks the graph: every point within
// half a small square, and the line within one small square of the expected line across the data.
//
// Graphs that already show the data (Paper 1B, built by tools/1b/generate.mjs) add:
//     "height": 343,                                               the picture's height (default 270; the width is 400)
//     "given": [[12, 97.5, 0.5], …],                               points already plotted: x, y, half the y error bar (0: none)
//     "points": [],                                                nothing to plot (or the missing points)
//     "lines": [{ "key": "best", "role": "best", "label": "Line of best fit", "gradient": …, "intercept": …,
//                 "bars": true, "toYAxis": true }, …],             the lines to draw; role "best", "steep" or "shallow"
//     "fit": { "gradient": …, "intercept": … },                    the line of best fit (steep and shallow are judged against it)
//     "worth": 1,                                                  how many of the part's marks the graph carries (default: all)
//     "on": "graph"                                                the figure of the question that the student draws on
// With error bars ("bars": true) a line of best fit must pass through every bar; the steepest and shallowest
// lines must pass through every bar and be at least half-way from the best fit to the true extreme line.
// A line may miss a bar by a tenth of a small square ("slack").
//
// The drawing of the axes (axesSvg) is shared with tools/p2/plot-axes.mjs, which writes the printable picture,
// so the worksheet and the website always show the same grid. Marking is tested by tools/p2/test.mjs and tools/1b/test.mjs.
(function () {
  const INK = '#1c2430';
  const MINOR = '#dde3eb';
  const MAJOR = '#b9c3d0';
  const BLUE = '#1f5fbf';
  const ORANGE = '#c2561a';
  const EPS = 1e-9;
  const MAX_POINTS = 25;
  const EXTREME = 0.5; // a steepest (shallowest) line must be at least this far from the best fit towards the true extreme

  // The picture is 400 wide; its height can be set per graph. The plotting area keeps the same margins.
  const geom = (plot) => { const H = (plot && plot.height) || 270; return { W: 400, H, left: 60, right: 360, top: 33, bottom: H - 55 }; };

  const tidy = (v) => Number(v.toFixed(9));
  const decimals = (step) => { const s = String(step); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };
  const px = (v) => String(Number(v.toFixed(1)));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const num = (v, dp) => v.toFixed(dp).replace('-', '−');
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  function scale(plot) {
    const G = geom(plot);
    const sx = (G.right - G.left) / (plot.x.max - plot.x.min);
    const sy = (G.bottom - G.top) / (plot.y.max - plot.y.min);
    return {
      X: (x) => G.left + (x - plot.x.min) * sx,
      Y: (y) => G.bottom - (y - plot.y.min) * sy,
      x: (vx) => plot.x.min + (vx - G.left) / sx,
      y: (vy) => plot.y.min + (G.bottom - vy) / sy,
    };
  }
  function ticks(a, every) {
    const n = Math.round((a.max - a.min) / every);
    return Array.from({ length: n + 1 }, (_, i) => tidy(a.min + i * every));
  }
  const onMajor = (a, v) => { const k = (v - a.min) / a.major; return Math.abs(k - Math.round(k)) < 1e-6; };

  // The lines a student draws on this graph: the single "line" of a plot-the-points graph (key "line"),
  // or the named "lines" of a graph that already shows the data.
  function linesOf(plot) {
    const out = [];
    if (plot.line) out.push({ key: 'line', role: 'best', label: 'Draw line', legacy: true, ...plot.line });
    for (const L of plot.lines || []) out.push(L);
    return out;
  }
  const NAMES = { best: 'line of best fit', steep: 'steepest line', shallow: 'shallowest line' };
  const styleOf = (L) => (L.legacy ? { stroke: ORANGE } : L.role === 'best' ? { stroke: BLUE } : { stroke: ORANGE, dash: '7 4' });
  // Every point on the graph, given or to be plotted: the data a line has to cover.
  const dataPoints = (plot) => [...(plot.given || []), ...(plot.points || [])];
  // The student's lines by key, from a saved state.
  function linesIn(plot, state) {
    const map = {};
    for (const L of linesOf(plot)) map[L.key] = (L.legacy ? state && state.line : state && state.lines && state.lines[L.key]) || null;
    return map;
  }

  // The grid, axes, numbers and labels (no <svg> wrapper).
  function axesInner(plot) {
    const G = geom(plot);
    const s = scale(plot);
    const out = [];
    const vLine = (v) => `<line x1="${px(s.X(v))}" y1="${G.bottom}" x2="${px(s.X(v))}" y2="${G.top}"/>`;
    const hLine = (v) => `<line x1="${G.left}" y1="${px(s.Y(v))}" x2="${G.right}" y2="${px(s.Y(v))}"/>`;
    const xs = ticks(plot.x, plot.x.step).filter((v) => v > plot.x.min + EPS);
    const ys = ticks(plot.y, plot.y.step).filter((v) => v > plot.y.min + EPS);
    out.push(`<g stroke="${MINOR}" stroke-width="1">${xs.filter((v) => !onMajor(plot.x, v)).map(vLine).join('')}${ys.filter((v) => !onMajor(plot.y, v)).map(hLine).join('')}</g>`);
    out.push(`<g stroke="${MAJOR}" stroke-width="1">${xs.filter((v) => onMajor(plot.x, v)).map(vLine).join('')}${ys.filter((v) => onMajor(plot.y, v)).map(hLine).join('')}</g>`);
    out.push(`<g stroke="${INK}" stroke-width="1.5" fill="none"><line x1="${G.left}" y1="${G.bottom}" x2="${G.right}" y2="${G.bottom}"/><line x1="${G.left}" y1="${G.bottom}" x2="${G.left}" y2="${G.top}"/></g>`);
    const dx = decimals(plot.x.major);
    const dy = decimals(plot.y.major);
    for (const v of ticks(plot.x, plot.x.major)) out.push(`<text x="${px(s.X(v))}" y="${G.bottom + 16}" font-size="11" text-anchor="middle">${num(v, dx)}</text>`);
    for (const v of ticks(plot.y, plot.y.major)) out.push(`<text x="${G.left - 7}" y="${px(s.Y(v) + 4)}" font-size="11" text-anchor="end">${num(v, dy)}</text>`);
    const label = (a) => `${esc(a.symbol)}${a.unit ? `<tspan font-style="normal"> / ${esc(a.unit)}</tspan>` : ''}`;
    const midX = (G.left + G.right) / 2;
    const midY = (G.top + G.bottom) / 2;
    out.push(`<text x="${px(midX)}" y="${G.H - 10}" font-size="13" text-anchor="middle" font-style="italic">${label(plot.x)}</text>`);
    out.push(`<text x="14" y="${px(midY)}" font-size="13" text-anchor="middle" font-style="italic" transform="rotate(-90 14 ${px(midY)})">${label(plot.y)}</text>`);
    return out;
  }

  // The points the graph already shows: a dot for each, with its error bar drawn on top.
  function givenLayer(plot) {
    const given = plot.given || [];
    if (!given.length) return [];
    const s = scale(plot);
    const dots = given.map(([x, y]) => `<circle cx="${px(s.X(x))}" cy="${px(s.Y(y))}" r="2.3"/>`).join('');
    const bars = given.filter((p) => p[2] > 0).map(([x, y, e]) => {
      const cx = s.X(x); const y1 = s.Y(y + e); const y2 = s.Y(y - e);
      return `<path d="M${px(cx)} ${px(y1)}V${px(y2)}M${px(cx - 3.5)} ${px(y1)}H${px(cx + 3.5)}M${px(cx - 3.5)} ${px(y2)}H${px(cx + 3.5)}"/>`;
    }).join('');
    return [`<g fill="${INK}">${dots}</g>`, ...(bars ? [`<g stroke="${INK}" stroke-width="1.1" fill="none">${bars}</g>`] : [])];
  }

  function segment(s, seg, style, extra = '') {
    return `<line x1="${px(s.X(seg[0][0]))}" y1="${px(s.Y(seg[0][1]))}" x2="${px(s.X(seg[1][0]))}" y2="${px(s.Y(seg[1][1]))}" stroke="${style.stroke}" stroke-width="${style.width || 2}"${style.dash ? ` stroke-dasharray="${style.dash}"` : ''}${extra}/>`;
  }
  // Crosses for the points and a straight line, in axes coordinates.
  function overlay(plot, points, line) {
    const s = scale(plot);
    const out = [];
    if (line) out.push(segment(s, line, { stroke: ORANGE }));
    if (points && points.length) {
      out.push(`<g stroke="${BLUE}" stroke-width="2" fill="none">${points.map(([x, y]) => {
        const cx = s.X(x); const cy = s.Y(y);
        return `<line x1="${px(cx - 4)}" y1="${px(cy - 4)}" x2="${px(cx + 4)}" y2="${px(cy + 4)}"/><line x1="${px(cx - 4)}" y1="${px(cy + 4)}" x2="${px(cx + 4)}" y2="${px(cy - 4)}"/>`;
      }).join('')}</g>`);
    }
    return out;
  }

  // A complete picture file: the blank axes, or (with points / line) the examiner's graph on a white panel.
  function axesSvg(plot, opts = {}) {
    const G = geom(plot);
    const lines = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${G.W} ${G.H}" font-family="Arial, sans-serif" fill="${INK}">`,
      `  <title>${esc(opts.title || plot.title || 'Axes for a graph')}</title>`,
    ];
    if (opts.background) lines.push(`  <rect x="0" y="0" width="${G.W}" height="${G.H}" rx="8" fill="#fff"/>`);
    for (const l of axesInner(plot)) lines.push(`  ${l}`);
    for (const l of overlay(plot, opts.points, opts.line)) lines.push(`  ${l}`);
    lines.push('</svg>', '');
    return lines.join('\n');
  }

  // The expected line of best fit as two end points: from the y axis (or the first point) to the last point.
  function expectedLine(plot) {
    if (!plot.line) return null;
    const xs = plot.points.map((p) => p[0]);
    const xa = plot.line.toYAxis ? plot.x.min : Math.min(...xs);
    const xb = Math.max(...xs);
    const f = (x) => tidy(plot.line.gradient * x + plot.line.intercept);
    return [[xa, f(xa)], [xb, f(xb)]];
  }

  // The line y = gradient·x + intercept cut to the axes, as two end points (null if it misses the graph).
  function clip(plot, L) {
    const f = (x) => L.gradient * x + L.intercept;
    const ends = [];
    for (const x of [plot.x.min, plot.x.max]) {
      let y = f(x); let xx = x;
      if (y < plot.y.min - EPS || y > plot.y.max + EPS) {
        if (Math.abs(L.gradient) < EPS) return null;
        y = Math.min(plot.y.max, Math.max(plot.y.min, y));
        xx = (y - L.intercept) / L.gradient;
        if (xx < plot.x.min - EPS || xx > plot.x.max + EPS) return null;
      }
      ends.push([tidy(xx), tidy(y)]);
    }
    return ends;
  }
  // The graph that earns full marks: every point plotted and every line exactly where it should be.
  function ideal(plot) {
    const state = { points: (plot.points || []).map((p) => [p[0], p[1]]), line: expectedLine(plot) };
    if (plot.lines) state.lines = Object.fromEntries(plot.lines.map((L) => [L.key, clip(plot, L)]));
    return state;
  }

  // How a part's marks divide between the points and the line.
  function split(plot, marks) {
    if (!plot.line) return { points: marks, line: 0 };
    const line = plot.marks && Number.isInteger(plot.marks.line) ? plot.marks.line : 1;
    return { points: marks - line, line };
  }
  // How many of the part's marks the graph itself carries (the rest are for written answers).
  const worthOf = (plot, marks) => (typeof plot.worth === 'number' ? plot.worth : marks);

  // Checks one drawn line. seg = [[x1, y1], [x2, y2]] or null. Returns { key, ok, drawn, text }.
  function checkLine(plot, L, seg) {
    const name = NAMES[L.role] || NAMES.best;
    const res = { key: L.key, ok: false, drawn: !!(seg && Math.abs(seg[1][0] - seg[0][0]) > EPS), text: '' };
    if (!seg) {
      res.text = L.legacy ? 'Draw a line of best fit: choose "Draw line", then press and drag across the graph.'
        : `Draw ${L.role === 'best' ? 'a' : 'the'} ${name}: choose "${L.label}", then press and drag across the graph.`;
      return res;
    }
    const mine = L.legacy ? 'Your line' : `Your ${name}`;
    if (!res.drawn) { res.text = `${mine} is vertical: drag one end so that it follows the points.`; return res; }
    const tolX = plot.x.step / 2 + EPS;
    const g = (seg[1][1] - seg[0][1]) / (seg[1][0] - seg[0][0]);
    const at = (x) => seg[0][1] + g * (x - seg[0][0]);
    const want = (x) => L.gradient * x + L.intercept;
    const xs = dataPoints(plot).map((p) => p[0]);
    const xa = Math.min(...xs); const xb = Math.max(...xs);
    const lo = Math.min(seg[0][0], seg[1][0]); const hi = Math.max(seg[0][0], seg[1][0]);
    const covers = lo <= xa + tolX && hi >= xb - tolX;
    const reaches = !L.toYAxis || lo <= plot.x.min + tolX;
    const bars = L.bars ? (plot.given || []).filter((p) => p[2] > 0) : [];
    const slack = (typeof plot.slack === 'number' ? plot.slack : plot.y.step / 10) + EPS;
    const misses = bars.filter(([x, y, e]) => Math.abs(at(x) - y) > e + slack).length;
    const missText = `${mine} misses ${misses} of the ${bars.length} error bars`;

    if (L.role === 'steep' || L.role === 'shallow') {
      const more = L.role === 'steep' ? 'steeper' : 'shallower';
      const base = plot.fit ? plot.fit.gradient : L.gradient;
      const span = L.gradient - base;
      const far = Math.abs(span) < EPS ? 1 : (g - base) / span; // 0: the best fit, 1: the true extreme line
      if (misses) res.text = `${missText}: it must pass through all of them.`;
      else if (far < (typeof plot.extreme === 'number' ? plot.extreme : EXTREME)) res.text = `${mine} passes through all the error bars, but a ${more} line still would: tilt it further.`;
      else if (!covers) res.text = `${mine} is tilted correctly, but it should run across the whole range of the points.`;
      else { res.ok = true; res.text = `${mine} is good.`; }
      return res;
    }
    let close;
    if (bars.length) close = misses === 0;
    else {
      const tol = (typeof L.tolerance === 'number' ? L.tolerance : plot.y.step) + EPS;
      close = Math.abs(at(xa) - want(xa)) <= tol && Math.abs(at(xb) - want(xb)) <= tol;
    }
    // "gradients": the range of gradients the mark scheme accepts. A line the screen calls good must not lead to a
    // gradient that the mark scheme rejects.
    const tilted = Array.isArray(L.gradients) && (g < L.gradients[0] - EPS || g > L.gradients[1] + EPS);
    res.ok = close && !tilted && covers && reaches;
    if (res.ok) res.text = `${mine}${L.legacy ? ' of best fit' : ''} is good.`;
    else if (!close) res.text = bars.length ? `${missText}: here a line of best fit passes through all of them, with the points balanced on either side.`
      : `${mine} is not close enough to the points: a line of best fit passes as near as possible to all of them.`;
    else if (tilted) res.text = `${mine} is close to the points, but it is tilted too far: balance the points on either side of it along its whole length.`;
    else if (!covers) res.text = `${mine} follows the points, but it should run across the whole range of the points.`;
    else res.text = `${mine} follows the points: now extend it back to meet the vertical axis.`;
    return res;
  }

  // Marks a graph. state = { points: [[x, y], …], line: [[x1, y1], [x2, y2]] or null, lines: { key: [[…], […]] } }.
  // Returns { points: { ok, matched, total, extra }, line: { ok, drawn } or null (the "line" of a plot-the-points graph),
  //           lines: [{ key, ok, drawn }], score, max, right, feedback: [{ ok, text }] }.
  // max is the number of marks the graph carries: the part's marks, or plot.worth when the rest are for written answers.
  function check(plot, state, marks) {
    const drawn = (state && state.points) || [];
    const expected = plot.points || [];
    const tolX = plot.x.step / 2 + EPS;
    const tolY = plot.y.step / 2 + EPS;
    const used = new Set();
    let matched = 0;
    for (const [ex, ey] of expected) {
      let best = -1; let bestD = Infinity;
      drawn.forEach(([x, y], i) => {
        if (used.has(i) || Math.abs(x - ex) > tolX || Math.abs(y - ey) > tolY) return;
        const d = Math.abs(x - ex) / plot.x.step + Math.abs(y - ey) / plot.y.step;
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best >= 0) { used.add(best); matched++; }
    }
    const total = expected.length;
    const extra = drawn.length - matched;
    const points = { ok: matched === total && extra === 0, matched, total, extra };
    const feedback = [];
    if (total || drawn.length) {
      if (points.ok) feedback.push({ ok: true, text: total === 1 ? 'The point is plotted correctly.' : `All ${total} points are plotted correctly.` });
      else if (!drawn.length) feedback.push({ ok: false, text: total === 1 ? 'Plot the missing point.' : `Plot the ${total} points from the table.` });
      else {
        const others = drawn.length - matched;
        const tail = drawn.length === total ? `: check the other ${others === 1 ? 'one' : others}.` : ` (the table has ${total} readings).`;
        let text = matched === total ? `All ${total} points are in the right place,` : `${matched} of your ${plural(drawn.length, 'point')} ${matched === 1 ? 'is' : 'are'} within half a small square of where ${matched === 1 ? 'it' : 'they'} should be${tail}`;
        if (matched === total) text += ` but there ${extra === 1 ? 'is' : 'are'} ${plural(extra, 'extra point')}: remove ${extra === 1 ? 'it' : 'them'}.`;
        feedback.push({ ok: false, text });
      }
    }

    const mine = linesIn(plot, state);
    const lines = linesOf(plot).map((L) => checkLine(plot, L, mine[L.key]));
    for (const r of lines) feedback.push({ ok: r.ok, text: r.text });
    const legacy = lines.find((r) => r.key === 'line' && plot.line) || null;
    const line = legacy ? { ok: legacy.ok, drawn: legacy.drawn } : null;

    let score; let max;
    if (plot.lines || typeof plot.worth === 'number') {
      // A graph that already shows the data: all or nothing for the marks it carries.
      max = worthOf(plot, marks);
      score = points.ok && lines.every((r) => r.ok) ? max : 0;
    } else {
      const sp = split(plot, marks);
      max = marks;
      score = (points.ok ? sp.points : 0) + (line && line.ok ? sp.line : 0);
    }
    const right = points.ok && lines.every((r) => r.ok);
    return { points, line, lines: lines.map(({ key, ok, drawn: d }) => ({ key, ok, drawn: d })), score, max, right, feedback };
  }

  // True if the student has put anything on the graph.
  const hasWork = (plot, state) => !!state && (((state.points || []).length > 0) || Object.values(linesIn(plot, state)).some(Boolean));

  // ----- The interactive graph (browser only) -----
  // mount(container, plot, state, { locked, onChange, shown }) draws the axes in `container` and lets the student plot.
  // onChange(state) is called after every change with a fresh copy of the state.
  // shown: lines drawn elsewhere on the same graph (another part of the question), displayed faintly and not editable:
  //   [{ role, seg: [[x1, y1], [x2, y2]] }]. The returned setShown(list) replaces them.
  function mount(container, plot, state, opts = {}) {
    const locked = !!opts.locked;
    const G = geom(plot);
    const s = scale(plot);
    const specs = linesOf(plot);
    const wantsPoints = !!(plot.points && plot.points.length) || !specs.length;
    const snap = { x: plot.x.snap || plot.x.step / 5, y: plot.y.snap || plot.y.step / 5 };
    const dp = { x: decimals(tidy(snap.x)), y: decimals(tidy(snap.y)) };
    let points = ((state && state.points) || []).map((p) => [p[0], p[1]]);
    const lines = {}; // key -> [[x1, y1], [x2, y2]] or null
    for (const [k, seg] of Object.entries(linesIn(plot, state))) lines[k] = seg ? seg.map((p) => [p[0], p[1]]) : null;
    let shown = opts.shown || [];
    let mode = wantsPoints ? 'points' : specs[0].key; // 'points', or the key of the line being drawn
    let drag = null;
    let cursor = null; // keyboard cursor, in axes coordinates
    let lineStart = false; // keyboard: the line's first end has been set
    const spec = (key) => specs.find((L) => L.key === key);
    const nameOf = (L) => (L.legacy ? 'line of best fit' : NAMES[L.role] || NAMES.best);

    const nLines = Object.values(lines).filter(Boolean).length;
    const count = [wantsPoints ? plural(points.length, 'point') + ' plotted' : '', nLines ? plural(nLines, 'line') + ' drawn' : ''].filter(Boolean).join(' and ') || 'nothing drawn yet';
    const given = (plot.given || []).length ? ` The graph shows ${plural(plot.given.length, 'point')}${plot.given.some((p) => p[2] > 0) ? ' with error bars' : ''}.` : '';
    const keys = wantsPoints ? 'Enter plots or removes a point, or sets an end of the line.' : 'Enter sets an end of the line.';
    const hasData = (plot.given || []).length > 0;
    container.innerHTML = `
      <div class="plot${locked ? ' is-locked' : ''}${hasData ? ' has-data' : ''}">
        ${locked ? '' : `<div class="plot-tools" role="group" aria-label="Graph tools">
          ${wantsPoints ? '<button type="button" class="secondary plot-mode" data-mode="points">Plot points</button>' : ''}
          ${specs.map((L) => `<button type="button" class="secondary plot-mode" data-mode="${esc(L.key)}">${esc(L.label)}</button>`).join('')}
          <button type="button" class="link-btn" data-act="clear">Clear ${wantsPoints ? 'graph' : specs.length > 1 ? 'my lines' : 'my line'}</button>
        </div>`}
        <div class="plot-surface">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${G.W} ${G.H}" font-family="Arial, sans-serif" fill="${INK}"
            ${locked ? `role="img" aria-label="${esc(plot.title || 'Graph')}.${given} Your graph: ${count}."` : `tabindex="0" role="application" aria-label="${esc(plot.title || 'Graph')}.${given} Arrow keys move a cursor; ${keys}"`}>
            ${axesInner(plot).join('')}
            <g class="plot-overlay"></g>
            ${givenLayer(plot).join('')}
          </svg>
        </div>
        ${locked ? '' : '<p class="plot-readout" aria-live="polite"></p>'}
      </div>`;
    const svg = container.querySelector('svg');
    const layer = container.querySelector('.plot-overlay');
    const readout = container.querySelector('.plot-readout');
    const pressed = () => container.querySelectorAll('.plot-mode').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.mode === mode)));
    pressed();

    const snapTo = (v, a, step) => tidy(Math.min(a.max, Math.max(a.min, a.min + Math.round((v - a.min) / step) * step)));
    const say = (text) => { if (readout) readout.textContent = text; };
    const coords = (p) => `${plot.x.symbol} = ${num(p[0], dp.x)}${plot.x.unit ? ` ${plot.x.unit}` : ''}, ${plot.y.symbol} = ${num(p[1], dp.y)}${plot.y.unit ? ` ${plot.y.unit}` : ''}`;
    const hint = () => say(mode === 'points'
      ? 'Tap the grid to plot a point; drag to adjust it. Tap a point again to remove it.'
      : lines[mode] ? 'Drag either end of the line to adjust it, or press and drag to draw a new one.' : `Press and drag across the graph to draw your ${nameOf(spec(mode))}.`);
    const copy = () => {
      const out = { points: points.map((p) => [p[0], p[1]]), line: lines.line && plot.line ? lines.line.map((p) => [p[0], p[1]]) : null };
      if (plot.lines) out.lines = Object.fromEntries(plot.lines.map((L) => [L.key, lines[L.key] ? lines[L.key].map((p) => [p[0], p[1]]) : null]));
      return out;
    };
    const emit = () => { if (opts.onChange) opts.onChange(copy()); };

    function redraw(guide) {
      const parts = [];
      if (guide) {
        const gx = px(s.X(guide[0])); const gy = px(s.Y(guide[1]));
        parts.push(`<g stroke="${BLUE}" stroke-width="1" stroke-dasharray="3 3" opacity="0.7"><line x1="${gx}" y1="${gy}" x2="${gx}" y2="${G.bottom}"/><line x1="${gx}" y1="${gy}" x2="${G.left}" y2="${gy}"/></g>`);
      }
      // On a graph that shows data the lines are thin and go under the points, so the error bars stay readable.
      for (const other of shown) if (other && other.seg) parts.push(segment(s, other.seg, { ...styleOf({ role: other.role }), width: 1 }, ' opacity="0.6"'));
      for (const L of specs) if (lines[L.key]) parts.push(segment(s, lines[L.key], { ...styleOf(L), width: hasData ? 1.2 : 2 }));
      if (!locked && mode !== 'points' && lines[mode]) {
        const colour = styleOf(spec(mode)).stroke;
        for (const end of lines[mode]) parts.push(`<circle cx="${px(s.X(end[0]))}" cy="${px(s.Y(end[1]))}" r="6" fill="#fff" stroke="${colour}" stroke-width="2"/>`);
      }
      parts.push(...overlay(plot, points, null)); // the points last, so a handle never hides one
      if (cursor) {
        const cx = px(s.X(cursor[0])); const cy = px(s.Y(cursor[1]));
        parts.push(`<circle cx="${cx}" cy="${cy}" r="8" fill="none" stroke="${INK}" stroke-width="1.5" stroke-dasharray="2 2"/>`);
      }
      layer.innerHTML = parts.join('');
    }
    redraw();
    const handle = { getState: copy, setShown: (list) => { shown = list || []; redraw(); } };
    if (locked) return handle;
    hint();

    const viewPoint = (e) => {
      const m = svg.getScreenCTM();
      if (!m) return [0, 0];
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      return [p.x, p.y];
    };
    const dataPoint = (v) => [snapTo(s.x(v[0]), plot.x, snap.x), snapTo(s.y(v[1]), plot.y, snap.y)];
    const near = (list, v, r) => {
      let best = -1; let bestD = r;
      list.forEach((p, i) => { const d = Math.hypot(s.X(p[0]) - v[0], s.Y(p[1]) - v[1]); if (d <= bestD) { bestD = d; best = i; } });
      return best;
    };
    const dedupe = (index) => {
      const p = points[index];
      const twin = points.findIndex((q, i) => i !== index && Math.abs(q[0] - p[0]) < EPS && Math.abs(q[1] - p[1]) < EPS);
      if (twin >= 0) points.splice(index, 1);
    };
    const isDot = (seg) => Math.abs(seg[0][0] - seg[1][0]) < EPS && Math.abs(seg[0][1] - seg[1][1]) < EPS;

    svg.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      e.preventDefault();
      cursor = null; lineStart = false;
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
      const v = viewPoint(e);
      const p = dataPoint(v);
      if (mode === 'points') {
        const hit = near(points, v, 11);
        if (hit >= 0) drag = { kind: 'point', index: hit, start: v, moved: false };
        else if (points.length >= MAX_POINTS) { say('That is a lot of points: remove some before adding more.'); return; }
        else { points.push(p); drag = { kind: 'point', index: points.length - 1, fresh: true, moved: true }; }
        redraw(points[drag.index]); say(coords(points[drag.index]));
      } else {
        const hit = lines[mode] ? near(lines[mode], v, 14) : -1;
        if (hit >= 0) drag = { kind: 'end', index: hit };
        else { lines[mode] = [p, [p[0], p[1]]]; drag = { kind: 'end', index: 1, fresh: true }; }
        redraw(lines[mode][drag.index]); say(coords(lines[mode][drag.index]));
      }
    });
    svg.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const v = viewPoint(e);
      const p = dataPoint(v);
      if (drag.kind === 'point') {
        if (!drag.moved && Math.hypot(v[0] - drag.start[0], v[1] - drag.start[1]) > 3) drag.moved = true;
        if (drag.moved) points[drag.index] = p;
        redraw(points[drag.index]); say(coords(points[drag.index]));
      } else {
        lines[mode][drag.index] = p;
        redraw(p); say(coords(p));
      }
    });
    const finish = (e, cancelled) => {
      if (!drag) return;
      const d = drag; drag = null;
      if (d.kind === 'point') {
        if (cancelled && d.fresh) points.splice(d.index, 1);
        else if (!d.fresh && !d.moved) points.splice(d.index, 1); // a tap on an existing point removes it
        else dedupe(d.index);
      } else if (lines[mode] && isDot(lines[mode])) {
        lines[mode] = null; // a tap, not a drag
      }
      redraw(); hint(); emit();
    };
    svg.addEventListener('pointerup', (e) => finish(e, false));
    svg.addEventListener('pointercancel', (e) => finish(e, true));

    // Keyboard: arrow keys move a cursor (Shift: one small square at a time); Enter or Space acts at the cursor.
    svg.addEventListener('keydown', (e) => {
      const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
      if (moves[e.key]) {
        e.preventDefault();
        if (!cursor) cursor = points.length ? [points[points.length - 1][0], points[points.length - 1][1]] : [snapTo((plot.x.min + plot.x.max) / 2, plot.x, snap.x), snapTo((plot.y.min + plot.y.max) / 2, plot.y, snap.y)];
        const big = e.shiftKey;
        cursor = [snapTo(cursor[0] + moves[e.key][0] * (big ? plot.x.step : snap.x), plot.x, snap.x), snapTo(cursor[1] + moves[e.key][1] * (big ? plot.y.step : snap.y), plot.y, snap.y)];
        if (mode !== 'points' && lineStart && lines[mode]) lines[mode][1] = [cursor[0], cursor[1]];
        redraw(); say(coords(cursor));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!cursor) { say('Use the arrow keys to move the cursor first.'); return; }
        if (mode === 'points') {
          const at = points.findIndex((q) => Math.abs(q[0] - cursor[0]) < EPS && Math.abs(q[1] - cursor[1]) < EPS);
          if (at >= 0) { points.splice(at, 1); say(`Point removed at ${coords(cursor)}.`); }
          else if (points.length < MAX_POINTS) { points.push([cursor[0], cursor[1]]); say(`Point plotted at ${coords(cursor)}.`); }
        } else if (!lineStart) {
          lines[mode] = [[cursor[0], cursor[1]], [cursor[0], cursor[1]]]; lineStart = true;
          say(`Line starts at ${coords(cursor)}. Move the cursor to the other end and press Enter.`);
        } else {
          lineStart = false;
          if (isDot(lines[mode])) lines[mode] = null;
          say(lines[mode] ? `Line ends at ${coords(cursor)}.` : 'No line drawn.');
        }
        redraw(); emit();
      }
    });
    svg.addEventListener('blur', () => { if (cursor) { cursor = null; redraw(); } });

    container.querySelectorAll('.plot-mode').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.mode; lineStart = false;
      pressed();
      redraw(); hint();
    }));
    container.querySelector('[data-act="clear"]').addEventListener('click', () => {
      points = []; cursor = null; lineStart = false;
      for (const k of Object.keys(lines)) lines[k] = null;
      redraw(); hint(); emit();
    });
    return handle;
  }

  const api = { GEOM: geom(), geom, axesSvg, expectedLine, ideal, linesOf, split, worthOf, check, hasWork, mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; // for tools/p2, tools/1b and tools/check.mjs
  else window.Plot = api;
})();
