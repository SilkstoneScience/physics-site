// Graphing tool for the practicals (needs js/labs/common.js).
// Database labs: <div class="dgraph" data-sets='[{"src":"data/planets.csv","name":"The planets"}]' data-x="1" data-y="2" data-xf="pow3" data-yf="pow2"></div>
// Students' own data: Lab.graph(root, { source, x, y, xf, yf, onSnapshot }) where source = { get(), onChange(callback) }
// and get() returns { heads: ["name", "peak force F / N", ...], rows: [{ name, vals: [numbers or NaN] }] }.
// Loads a CSV (first column = names, other columns = numbers, headings like "orbital period T / days"),
// lets the student choose and transform the variables, add uncertainty bars, leave out points, and see the
// best-fit line (least squares) and the steepest and shallowest lines that pass through every uncertainty bar.
(() => {
  if (!window.Lab) return;
  const { fit } = Lab;

  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  const sup = s => String(s).split('').map(c => SUP[c] || c).join('');
  const TRANSFORMS = {
    none: { name: 'x', f: v => v, q: (s) => s, u: u => nice(u) },
    pow2: { name: 'x²', f: v => v * v, q: s => s + '²', u: u => pw(u, 2) },
    pow3: { name: 'x³', f: v => v * v * v, q: s => s + '³', u: u => pw(u, 3) },
    sqrt: { name: '√x', f: v => Math.sqrt(v), q: s => '√' + s, u: u => u ? `${par(nice(u))}^½` : '' },
    inv: { name: '1/x', f: v => 1 / v, q: s => s + '⁻¹', u: u => pw(u, -1) },
    inv2: { name: '1/x²', f: v => 1 / (v * v), q: s => s + '⁻²', u: u => pw(u, -2) },
    ln: { name: 'ln x', f: v => Math.log(v), q: (s, u) => `ln(${s}${u ? ' / ' + u : ''})`, u: () => '' },
    log: { name: 'log₁₀ x', f: v => Math.log10(v), q: (s, u) => `log(${s}${u ? ' / ' + u : ''})`, u: () => '' },
  };
  function par(u) { return /^\(.*\)[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]*$/.test(u) || !/[\s^/]/.test(u) ? u : `(${u})`; }
  function pw(u, n) { return u ? par(u.replace(/\^(-?\d+)/g, (m, e) => sup(e))) + sup(n) : ''; }
  const nice = u => u.replace(/\^(-?\d+)/g, (m, e) => sup(e));

  // "orbital period T / days" -> { label, sym: "T", unit: "days" }
  function parseHead(h) {
    const [q, u = ''] = h.split(' / ');
    const words = q.trim().split(/\s+/);
    return { label: q.trim(), sym: words[words.length - 1], unit: u.trim() };
  }

  // Numbers for axes and results: 3 significant figures, with powers of ten written properly
  function fmt(v, sf = 3) {
    if (!isFinite(v)) return '–';
    if (v === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(v)));
    if (e >= -3 && e < 5) return String(+v.toPrecision(sf));
    const m = +(v / Math.pow(10, e)).toPrecision(sf);
    return `${m} × 10${sup(e)}`;
  }
  function ticks(lo, hi, n = 5) {
    const span = hi - lo || Math.abs(hi) || 1, raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(k => k * p).find(s => s >= raw);
    const out = [];
    for (let t = Math.ceil(lo / step) * step; t <= hi + step * 1e-9; t += step) out.push(Math.abs(t) < step * 1e-9 ? 0 : t);
    return { list: out, step };
  }

  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/).map(l => l.split(','));
    return { heads: lines[0], rows: lines.slice(1).map(r => ({ name: r[0], vals: r.slice(1).map(Number) })) };
  }

  // Uncertainty input: "0.2" (absolute) or "5%" (percentage of each value)
  function unc(text, v) {
    const t = String(text).trim();
    if (!t) return 0;
    if (t.endsWith('%')) return Math.abs(v) * (parseFloat(t) || 0) / 100;
    return Math.abs(parseFloat(t) || 0);
  }

  // Steepest and shallowest straight lines that pass through every uncertainty box.
  // A line y = mx + c passes through the box [x ± dx] × [y ± dy] if mx + c - |m|dx <= y + dy and mx + c + |m|dx >= y - dy.
  function extremes(pts) {
    const ok = (m, c) => pts.every(p => m * p.x + c - Math.abs(m) * p.dx <= p.y + p.dy + 1e-12 * (1 + Math.abs(p.y)) &&
                                         m * p.x + c + Math.abs(m) * p.dx >= p.y - p.dy - 1e-12 * (1 + Math.abs(p.y)));
    const corners = [];
    pts.forEach(p => { for (const sx of [-1, 1]) for (const sy of [-1, 1]) corners.push([p.x + sx * p.dx, p.y + sy * p.dy]); });
    let lo = null, hi = null;
    for (let i = 0; i < corners.length; i++) for (let j = i + 1; j < corners.length; j++) {
      const [x1, y1] = corners[i], [x2, y2] = corners[j];
      if (Math.abs(x2 - x1) < 1e-15 * (1 + Math.abs(x1))) continue;
      const m = (y2 - y1) / (x2 - x1), c = y1 - m * x1;
      if (!ok(m, c)) continue;
      if (!hi || m > hi.m) hi = { m, c };
      if (!lo || m < lo.m) lo = { m, c };
    }
    return hi && lo ? { hi, lo } : null;
  }

  function leastSquares(pts) {
    const n = pts.length, mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
    let sxx = 0, sxy = 0;
    pts.forEach(p => { sxx += (p.x - mx) ** 2; sxy += (p.x - mx) * (p.y - my); });
    const m = sxy / sxx; return { m, c: my - m * mx };
  }

  function makeGraph(root, opt) {
    const sets = opt.sets || [];
    const opts = Object.entries(TRANSFORMS).map(([k, t]) => `<option value="${k}">${t.name}</option>`).join('');
    root.innerHTML = `
      <div class="vlab-panel">
        ${sets.length > 1 ? `<label class="vlab-field">Data set <select data-g="set">${sets.map((s, i) => `<option value="${i}">${s.name}</option>`).join('')}</select></label>` : ''}
        <div class="dgraph-axes">
          <fieldset><legend>Vertical axis (y)</legend>
            <label>Variable <select data-g="ycol"></select></label>
            <label>Plot <select data-g="yf">${opts}</select></label>
            <label>Uncertainty ± <input data-g="dy" inputmode="decimal" placeholder="e.g. 0.2 or 5%"></label>
          </fieldset>
          <fieldset><legend>Horizontal axis (x)</legend>
            <label>Variable <select data-g="xcol"></select></label>
            <label>Plot <select data-g="xf">${opts}</select></label>
            <label>Uncertainty ± <input data-g="dx" inputmode="decimal" placeholder="e.g. 0.2 or 5%"></label>
          </fieldset>
        </div>
        <div class="dgraph-toggles">
          <label class="vlab-check"><input type="checkbox" data-g="zero" checked> Start the axes at zero</label>
          <label class="vlab-check"><input type="checkbox" data-g="best" checked> Line of best fit</label>
          <label class="vlab-check"><input type="checkbox" data-g="ext"> Steepest and shallowest lines</label>
        </div>
        <canvas class="dgraph-canvas" role="img" aria-label="A graph of the chosen data, described in the results below it."></canvas>
        <div class="dgraph-results" aria-live="polite"></div>
        <details class="dgraph-points"><summary>Choose which data points to use</summary><div data-g="points"></div></details>
        ${sets.length ? '<p class="vlab-small"><a data-g="download" download>Download this data set (CSV)</a></p>' : ''}
        ${opt.onSnapshot ? '<div class="vlab-buttons"><button type="button" class="button secondary" data-g="snap">Add this graph to my report</button></div><p class="vlab-small" data-g="snapmsg" aria-live="polite"></p>' : ''}
      </div>`;
    const $ = k => root.querySelector(`[data-g="${k}"]`);
    const mainCanvas = root.querySelector('canvas'), out = root.querySelector('.dgraph-results');
    let data = null, skip = new Set();

    function setData(d, first) {
      data = { heads: d.heads.map(parseHead), rows: d.rows };
      if (first) {
        skip = new Set();
        const cols = data.heads.slice(1).map((h, j) => `<option value="${j}">${h.label}${h.unit ? ' / ' + nice(h.unit) : ''}</option>`).join('');
        $('xcol').innerHTML = $('ycol').innerHTML = cols;
        $('xcol').value = opt.x ? +opt.x - 1 : 0;
        $('ycol').value = opt.y ? +opt.y - 1 : 1;
        $('xf').value = opt.xf || 'none';
        $('yf').value = opt.yf || 'none';
      }
      $('points').innerHTML = data.rows.map((r, k) => `<label class="vlab-check"><input type="checkbox" data-p="${k}" ${skip.has(k) ? '' : 'checked'}> ${r.name}</label>`).join('');
      draw();
    }
    async function load(i) {
      const res = await fetch(sets[i].src);
      setData(parseCSV(await res.text()), true);
      $('download').href = sets[i].src;
    }

    function axisInfo(which) {
      const h = data.heads[+$(which + 'col').value + 1], t = TRANSFORMS[$(which + 'f').value];
      const q = t.q(h.sym, nice(h.unit)), u = t.u(h.unit);
      return { q, u, f: t.f, text: u ? `${q} / ${u}` : q, col: +$(which + 'col').value };
    }

    function draw(target, size, palette) {
      if (!data) return;
      const col = palette || Lab.col, canvas = target || mainCanvas;
      const X = axisInfo('x'), Y = axisInfo('y');
      const pts = data.rows.map((r, k) => {
        const x = X.f(r.vals[X.col]), y = Y.f(r.vals[Y.col]);
        return { k, name: r.name, x, y, dx: unc($('dx').value, x), dy: unc($('dy').value, y) };
      }).filter(p => !skip.has(p.k) && isFinite(p.x) && isFinite(p.y));
      const W = size ? size[0] : canvas.clientWidth, H = size ? size[1] : Math.round(Math.min(W * 0.75, 460));
      const g = size ? canvas.getContext('2d') : fit(canvas, W, H);
      g.fillStyle = col['--surface']; g.fillRect(0, 0, W, H);
      if (pts.length < 2) { if (!target) out.textContent = 'Enter or choose at least two data points.'; return false; }
      // ranges
      let x0 = Math.min(...pts.map(p => p.x - p.dx)), x1 = Math.max(...pts.map(p => p.x + p.dx));
      let y0 = Math.min(...pts.map(p => p.y - p.dy)), y1 = Math.max(...pts.map(p => p.y + p.dy));
      // "Start the axes at zero" doesn't apply to log axes, where zero has no special meaning
      const zx = $('zero').checked && !/^(ln|log)$/.test($('xf').value), zy = $('zero').checked && !/^(ln|log)$/.test($('yf').value);
      if (zx) { x0 = Math.min(0, x0); x1 = Math.max(0, x1); }
      if (zy) { y0 = Math.min(0, y0); y1 = Math.max(0, y1); }
      const padX = (x1 - x0 || 1) * 0.05, padY = (y1 - y0 || 1) * 0.06;
      if (!zx || x0 < 0) x0 -= padX;
      x1 += padX;
      if (!zy || y0 < 0) y0 -= padY;
      y1 += padY;
      const L = 64, R = 12, T = 12, B = 46;
      const px = v => L + (v - x0) / (x1 - x0) * (W - L - R), py = v => H - B - (v - y0) / (y1 - y0) * (H - T - B);
      // grid and axes
      g.font = '11px system-ui, sans-serif'; g.strokeStyle = col['--border']; g.fillStyle = col['--muted']; g.lineWidth = 1;
      const tx = ticks(x0, x1, W < 420 ? 4 : 6), ty = ticks(y0, y1, 5);
      g.textAlign = 'center';
      tx.list.forEach(t => { const x = px(t); g.beginPath(); g.moveTo(x, T); g.lineTo(x, H - B); g.stroke(); g.fillText(fmt(t), x, H - B + 15); });
      g.textAlign = 'right';
      ty.list.forEach(t => { const y = py(t); g.beginPath(); g.moveTo(L, y); g.lineTo(W - R, y); g.stroke(); g.fillText(fmt(t), L - 4, y + 4); });
      g.strokeStyle = col['--text']; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(L, T); g.lineTo(L, H - B); g.lineTo(W - R, H - B); g.stroke();
      g.fillStyle = col['--text']; g.font = '12px system-ui, sans-serif'; g.textAlign = 'center';
      g.fillText(X.text, (L + W - R) / 2, H - 8);
      g.save(); g.translate(13, (T + H - B) / 2); g.rotate(-Math.PI / 2); g.fillText(Y.text, 0, 0); g.restore();
      // clip lines to the plot area
      g.save(); g.beginPath(); g.rect(L, T, W - L - R, H - T - B); g.clip();
      const line = (m, c, colour, dash) => {
        g.strokeStyle = colour; g.lineWidth = 2; g.setLineDash(dash || []);
        g.beginPath(); g.moveTo(px(x0), py(m * x0 + c)); g.lineTo(px(x1), py(m * x1 + c)); g.stroke(); g.setLineDash([]);
      };
      const best = leastSquares(pts);
      const ext = $('ext').checked ? extremes(pts) : null;
      if ($('best').checked) line(best.m, best.c, col['--accent']);
      if (ext) { line(ext.hi.m, ext.hi.c, col['--muted'], [6, 4]); line(ext.lo.m, ext.lo.c, col['--muted'], [2, 3]); }
      // points and uncertainty bars
      g.strokeStyle = col['--text']; g.fillStyle = col['--text']; g.lineWidth = 1.2;
      pts.forEach(p => {
        const x = px(p.x), y = py(p.y);
        if (p.dy) { g.beginPath(); g.moveTo(x, py(p.y - p.dy)); g.lineTo(x, py(p.y + p.dy)); g.moveTo(x - 3, py(p.y - p.dy)); g.lineTo(x + 3, py(p.y - p.dy)); g.moveTo(x - 3, py(p.y + p.dy)); g.lineTo(x + 3, py(p.y + p.dy)); g.stroke(); }
        if (p.dx) { g.beginPath(); g.moveTo(px(p.x - p.dx), y); g.lineTo(px(p.x + p.dx), y); g.moveTo(px(p.x - p.dx), y - 3); g.lineTo(px(p.x - p.dx), y + 3); g.moveTo(px(p.x + p.dx), y - 3); g.lineTo(px(p.x + p.dx), y + 3); g.stroke(); }
        g.beginPath(); g.arc(x, y, 3, 0, 2 * Math.PI); g.fill();
      });
      g.restore();
      // results
      const gradUnit = Y.u && X.u ? `${Y.u} / ${par(X.u)}` : Y.u ? Y.u : X.u ? `1 / ${par(X.u)}` : 'no unit';
      let html = `<p><strong>Line of best fit:</strong> gradient = ${fmt(best.m, 4)} &nbsp;(${gradUnit}), &nbsp;y-intercept = ${fmt(best.c, 4)}${Y.u ? ' ' + Y.u : ''}. <span class="vlab-small">${pts.length} points.</span></p>`;
      if ($('ext').checked) {
        if (!$('dx').value.trim() && !$('dy').value.trim()) html += '<p class="vlab-small">Add uncertainty bars to find the steepest and shallowest lines.</p>';
        else if (!ext) html += '<p><strong>No straight line passes through every uncertainty bar.</strong> Are the uncertainties too small, is one point an outlier, or is the relationship not linear?</p>';
        else {
          const dm = (ext.hi.m - ext.lo.m) / 2, dc = Math.abs(ext.hi.c - ext.lo.c) / 2;
          html += `<p><strong>Steepest line</strong> (dashed): gradient ${fmt(ext.hi.m, 4)}. <strong>Shallowest line</strong> (dotted): gradient ${fmt(ext.lo.m, 4)}.</p>
            <p>Gradient = ${fmt(best.m, 4)} ± ${fmt(dm, 2)} &nbsp;(${gradUnit}); &nbsp;y-intercept = ${fmt(best.c, 4)} ± ${fmt(dc, 2)}${Y.u ? ' ' + Y.u : ''}.</p>`;
        }
      }
      if (!target) out.innerHTML = html;
      return { text: Y.text + ' against ' + X.text, x: X.text, y: Y.text, best, results: out.innerText };
    }

    root.addEventListener('input', (e) => {
      if (e.target.dataset.p !== undefined) { e.target.checked ? skip.delete(+e.target.dataset.p) : skip.add(+e.target.dataset.p); }
      if (e.target.dataset.g === 'set') { load(+e.target.value); return; }
      draw();
    });
    addEventListener('resize', () => draw());
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setTimeout(() => draw(), 50));
    // A copy of the graph for the report: always on a white background, at a fixed size
    if (opt.onSnapshot) $('snap').addEventListener('click', () => {
      const c = document.createElement('canvas'); c.width = 1200; c.height = 800;
      const g = c.getContext('2d'); g.scale(2, 2);
      const light = { '--surface': '#ffffff', '--text': '#1c2430', '--muted': '#5b6676', '--border': '#dde2e9', '--accent': '#1f5fbf' };
      const info = draw(c, [600, 400], light);
      if (!info) { $('snapmsg').textContent = 'Enter at least two data points first.'; return; }
      $('snapmsg').textContent = opt.onSnapshot(c, info) || 'Added to your report.';
    });
    if (opt.source) { setData(opt.source.get(), true); opt.source.onChange(() => setData(opt.source.get(), false)); }
    else load(0);
    return { redraw: () => draw() };
  }

  Lab.graph = makeGraph;
  document.querySelectorAll('.dgraph[data-sets]').forEach(root => makeGraph(root, {
    sets: JSON.parse(root.dataset.sets), x: root.dataset.x, y: root.dataset.y, xf: root.dataset.xf, yf: root.dataset.yf }));
})();
