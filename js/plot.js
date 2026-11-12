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
// The drawing of the axes (axesSvg) is shared with tools/p2/plot-axes.mjs, which writes the printable picture,
// so the worksheet and the website always show the same grid. Marking is tested by tools/p2/test.mjs.
(function () {
  const G = { W: 400, H: 270, left: 60, right: 360, top: 33, bottom: 215 };
  const INK = '#1c2430';
  const MINOR = '#dde3eb';
  const MAJOR = '#b9c3d0';
  const BLUE = '#1f5fbf';
  const ORANGE = '#c2561a';
  const EPS = 1e-9;
  const MAX_POINTS = 25;

  const tidy = (v) => Number(v.toFixed(9));
  const decimals = (step) => { const s = String(step); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };
  const px = (v) => String(Number(v.toFixed(1)));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const num = (v, dp) => v.toFixed(dp).replace('-', '−');

  function scale(plot) {
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

  // The grid, axes, numbers and labels (no <svg> wrapper).
  function axesInner(plot) {
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

  // Crosses for the points and a straight line, in axes coordinates.
  function overlay(plot, points, line) {
    const s = scale(plot);
    const out = [];
    if (line) out.push(`<line x1="${px(s.X(line[0][0]))}" y1="${px(s.Y(line[0][1]))}" x2="${px(s.X(line[1][0]))}" y2="${px(s.Y(line[1][1]))}" stroke="${ORANGE}" stroke-width="2"/>`);
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

  // How a part's marks divide between the points and the line.
  function split(plot, marks) {
    if (!plot.line) return { points: marks, line: 0 };
    const line = plot.marks && Number.isInteger(plot.marks.line) ? plot.marks.line : 1;
    return { points: marks - line, line };
  }

  // Marks a graph. state = { points: [[x, y], …], line: [[x1, y1], [x2, y2]] or null }.
  // Returns { points: { ok, matched, total, extra }, line: { ok, drawn } or null, score, max, right, feedback: [{ ok, text }] }.
  function check(plot, state, marks) {
    const drawn = (state && state.points) || [];
    const tolX = plot.x.step / 2 + EPS;
    const tolY = plot.y.step / 2 + EPS;
    const used = new Set();
    let matched = 0;
    for (const [ex, ey] of plot.points) {
      let best = -1; let bestD = Infinity;
      drawn.forEach(([x, y], i) => {
        if (used.has(i) || Math.abs(x - ex) > tolX || Math.abs(y - ey) > tolY) return;
        const d = Math.abs(x - ex) / plot.x.step + Math.abs(y - ey) / plot.y.step;
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best >= 0) { used.add(best); matched++; }
    }
    const total = plot.points.length;
    const extra = drawn.length - matched;
    const points = { ok: matched === total && extra === 0, matched, total, extra };
    const feedback = [];
    const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
    if (points.ok) feedback.push({ ok: true, text: `All ${total} points are plotted correctly.` });
    else if (!drawn.length) feedback.push({ ok: false, text: `Plot the ${total} points from the table.` });
    else {
      const others = drawn.length - matched;
      const tail = drawn.length === total ? `: check the other ${others === 1 ? 'one' : others}.` : ` (the table has ${total} readings).`;
      let text = matched === total ? `All ${total} points are in the right place,` : `${matched} of your ${plural(drawn.length, 'point')} ${matched === 1 ? 'is' : 'are'} within half a small square of where ${matched === 1 ? 'it' : 'they'} should be${tail}`;
      if (matched === total) text += ` but there ${extra === 1 ? 'is' : 'are'} ${plural(extra, 'extra point')}: remove ${extra === 1 ? 'it' : 'them'}.`;
      feedback.push({ ok: false, text });
    }

    let line = null;
    if (plot.line) {
      const L = state && state.line;
      line = { ok: false, drawn: !!(L && Math.abs(L[1][0] - L[0][0]) > EPS) };
      if (!L) feedback.push({ ok: false, text: 'Draw a line of best fit: choose "Draw line", then press and drag across the graph.' });
      else if (!line.drawn) feedback.push({ ok: false, text: 'Your line is vertical: drag one end so that it follows the points.' });
      else {
        const g = (L[1][1] - L[0][1]) / (L[1][0] - L[0][0]);
        const at = (x) => L[0][1] + g * (x - L[0][0]);
        const want = (x) => plot.line.gradient * x + plot.line.intercept;
        const xs = plot.points.map((p) => p[0]);
        const xa = Math.min(...xs); const xb = Math.max(...xs);
        const lo = Math.min(L[0][0], L[1][0]); const hi = Math.max(L[0][0], L[1][0]);
        const tol = (typeof plot.line.tolerance === 'number' ? plot.line.tolerance : plot.y.step) + EPS;
        const close = Math.abs(at(xa) - want(xa)) <= tol && Math.abs(at(xb) - want(xb)) <= tol;
        const covers = lo <= xa + tolX && hi >= xb - tolX;
        const reaches = !plot.line.toYAxis || lo <= plot.x.min + tolX;
        line.ok = close && covers && reaches;
        if (line.ok) feedback.push({ ok: true, text: 'Your line of best fit is good.' });
        else if (!close) feedback.push({ ok: false, text: 'Your line is not close enough to the points: a line of best fit passes as near as possible to all of them.' });
        else if (!covers) feedback.push({ ok: false, text: 'Your line follows the points, but it should run across the whole range of the points.' });
        else feedback.push({ ok: false, text: 'Your line follows the points: now extend it back to meet the vertical axis.' });
      }
    }
    const sp = split(plot, marks);
    const score = (points.ok ? sp.points : 0) + (line && line.ok ? sp.line : 0);
    return { points, line, score, max: marks, right: score === marks, feedback };
  }

  // ----- The interactive graph (browser only) -----
  // mount(container, plot, state, { locked, onChange }) draws the axes in `container` and lets the student plot.
  // onChange(state) is called after every change with a fresh copy of the state.
  function mount(container, plot, state, opts = {}) {
    const locked = !!opts.locked;
    const s = scale(plot);
    const snap = { x: plot.x.snap || plot.x.step / 5, y: plot.y.snap || plot.y.step / 5 };
    const dp = { x: decimals(tidy(snap.x)), y: decimals(tidy(snap.y)) };
    let points = ((state && state.points) || []).map((p) => [p[0], p[1]]);
    let line = state && state.line ? state.line.map((p) => [p[0], p[1]]) : null;
    let mode = 'points';
    let drag = null;
    let cursor = null; // keyboard cursor, in axes coordinates
    let lineStart = false; // keyboard: the line's first end has been set

    const count = `${points.length} point${points.length === 1 ? '' : 's'} plotted${line ? ' and a line drawn' : ''}`;
    container.innerHTML = `
      <div class="plot${locked ? ' is-locked' : ''}">
        ${locked ? '' : `<div class="plot-tools" role="group" aria-label="Graph tools">
          <button type="button" class="secondary plot-mode" data-mode="points" aria-pressed="true">Plot points</button>
          ${plot.line ? '<button type="button" class="secondary plot-mode" data-mode="line" aria-pressed="false">Draw line</button>' : ''}
          <button type="button" class="link-btn" data-act="clear">Clear graph</button>
        </div>`}
        <div class="plot-surface">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${G.W} ${G.H}" font-family="Arial, sans-serif" fill="${INK}"
            ${locked ? `role="img" aria-label="${esc(plot.title || 'Graph')}. Your graph: ${count}."` : `tabindex="0" role="application" aria-label="${esc(plot.title || 'Graph')}. Arrow keys move a cursor; Enter plots or removes a point, or sets an end of the line."`}>
            ${axesInner(plot).join('')}
            <g class="plot-overlay"></g>
          </svg>
        </div>
        ${locked ? '' : '<p class="plot-readout" aria-live="polite"></p>'}
      </div>`;
    const svg = container.querySelector('svg');
    const layer = container.querySelector('.plot-overlay');
    const readout = container.querySelector('.plot-readout');

    const snapTo = (v, a, step) => tidy(Math.min(a.max, Math.max(a.min, a.min + Math.round((v - a.min) / step) * step)));
    const say = (text) => { if (readout) readout.textContent = text; };
    const coords = (p) => `${plot.x.symbol} = ${num(p[0], dp.x)}${plot.x.unit ? ` ${plot.x.unit}` : ''}, ${plot.y.symbol} = ${num(p[1], dp.y)}${plot.y.unit ? ` ${plot.y.unit}` : ''}`;
    const hint = () => say(mode === 'points'
      ? 'Tap the grid to plot a point; drag to adjust it. Tap a point again to remove it.'
      : line ? 'Drag either end of the line to adjust it, or press and drag to draw a new one.' : 'Press and drag across the graph to draw your line of best fit.');
    const emit = () => { if (opts.onChange) opts.onChange({ points: points.map((p) => [p[0], p[1]]), line: line ? line.map((p) => [p[0], p[1]]) : null }); };

    function redraw(guide) {
      const parts = [];
      if (guide) {
        const gx = px(s.X(guide[0])); const gy = px(s.Y(guide[1]));
        parts.push(`<g stroke="${BLUE}" stroke-width="1" stroke-dasharray="3 3" opacity="0.7"><line x1="${gx}" y1="${gy}" x2="${gx}" y2="${G.bottom}"/><line x1="${gx}" y1="${gy}" x2="${G.left}" y2="${gy}"/></g>`);
      }
      parts.push(...overlay(plot, null, line));
      if (line && !locked && mode === 'line') {
        for (const end of line) parts.push(`<circle cx="${px(s.X(end[0]))}" cy="${px(s.Y(end[1]))}" r="6" fill="#fff" stroke="${ORANGE}" stroke-width="2"/>`);
      }
      parts.push(...overlay(plot, points, null)); // the points last, so a handle never hides one
      if (cursor) {
        const cx = px(s.X(cursor[0])); const cy = px(s.Y(cursor[1]));
        parts.push(`<circle cx="${cx}" cy="${cy}" r="8" fill="none" stroke="${INK}" stroke-width="1.5" stroke-dasharray="2 2"/>`);
      }
      layer.innerHTML = parts.join('');
    }
    redraw();
    if (locked) return { getState: () => ({ points, line }) };
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
        const hit = line ? near(line, v, 14) : -1;
        if (hit >= 0) drag = { kind: 'end', index: hit };
        else { line = [p, [p[0], p[1]]]; drag = { kind: 'end', index: 1, fresh: true }; }
        redraw(line[drag.index]); say(coords(line[drag.index]));
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
        line[drag.index] = p;
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
      } else if (line && Math.abs(line[0][0] - line[1][0]) < EPS && Math.abs(line[0][1] - line[1][1]) < EPS) {
        line = null; // a tap, not a drag
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
        if (mode === 'line' && lineStart && line) line[1] = [cursor[0], cursor[1]];
        redraw(); say(coords(cursor));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!cursor) { say('Use the arrow keys to move the cursor first.'); return; }
        if (mode === 'points') {
          const at = points.findIndex((q) => Math.abs(q[0] - cursor[0]) < EPS && Math.abs(q[1] - cursor[1]) < EPS);
          if (at >= 0) { points.splice(at, 1); say(`Point removed at ${coords(cursor)}.`); }
          else if (points.length < MAX_POINTS) { points.push([cursor[0], cursor[1]]); say(`Point plotted at ${coords(cursor)}.`); }
        } else if (!lineStart) {
          line = [[cursor[0], cursor[1]], [cursor[0], cursor[1]]]; lineStart = true;
          say(`Line starts at ${coords(cursor)}. Move the cursor to the other end and press Enter.`);
        } else {
          lineStart = false;
          if (Math.abs(line[0][0] - line[1][0]) < EPS && Math.abs(line[0][1] - line[1][1]) < EPS) line = null;
          say(line ? `Line ends at ${coords(cursor)}.` : 'No line drawn.');
        }
        redraw(); emit();
      }
    });
    svg.addEventListener('blur', () => { if (cursor) { cursor = null; redraw(); } });

    container.querySelectorAll('.plot-mode').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.mode; lineStart = false;
      container.querySelectorAll('.plot-mode').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      redraw(); hint();
    }));
    container.querySelector('[data-act="clear"]').addEventListener('click', () => {
      points = []; line = null; cursor = null; lineStart = false;
      redraw(); hint(); emit();
    });
    return { getState: () => ({ points, line }) };
  }

  const api = { GEOM: G, axesSvg, expectedLine, split, check, mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; // for tools/p2 and tools/check.mjs
  else window.Plot = api;
})();
