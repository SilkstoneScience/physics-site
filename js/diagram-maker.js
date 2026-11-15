/* Experimental diagram maker: the editor (experimental/diagram-maker.html).
   Plan and decisions: docs/DIAGRAM_MAKER_PLAN.md. The equipment drawings are in js/diagram-items.js.

   The diagram is one object, `doc` (the same shape as the save file, plan section 8). Every change
   is made to `doc`, then the picture is redrawn from it, and the change is recorded for Undo.
   Positions are in page units (the page is 1200 × 800); the zoom only changes how big it looks.
   Two kinds of object: equipment ("item") and connecting lines ("line": string, wire, tubing,
   light ray, motion arrow, force arrow). A line's points can be attached to an item's attachment
   points, so the line follows when the item moves. */
(function () {
  'use strict';
  const D = window.DiagramItems;
  const app = document.getElementById('dm-app');
  if (!app || !D) return;

  const PAGE_W = 1200, PAGE_H = 800, GRID = 10;
  const $ = (s) => app.querySelector(s);
  const svg = $('#dm-svg'), stage = $('#dm-stage'), props = $('#dm-props'), hint = $('#dm-hint');
  const bankList = $('#dm-bank-list'), search = $('#dm-search');
  const narrow = () => window.matchMedia('(max-width: 960px)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const r2 = (v) => Math.round(v * 100) / 100;
  const clone = (x) => JSON.parse(JSON.stringify(x));

  // The kinds of connecting line
  const KINDS = {
    string: { name: 'String', curve: true, hint: 'String: click where it starts (it snaps to hooks and the attachment dots), click to add bends, for example over a pulley, then double-click or press Finish.' },
    wire: { name: 'Wire', curve: true, hint: 'Wire: click a terminal to start. Each click adds a corner: wires go across, then up or down (hold Shift for a slanting wire). Click another terminal to finish, or double-click.' },
    tube: { name: 'Tubing', curve: true, hint: 'Tubing: click a nozzle or dot to start, click to add bends, then click another dot to finish (or double-click).' },
    ray: { name: 'Light ray', hint: 'Light ray: click where it leaves the ray box or laser, click wherever it changes direction (a mirror or a surface), then double-click or press Finish.' },
    motion: { name: 'Motion arrow', label: true, two: true, hint: 'Motion arrow: click where it starts, then where it points.' },
    force: { name: 'Force arrow', label: true, two: true, hint: 'Force arrow: click where the force acts, then where it points.' }
  };
  const SELECT_HINT = 'Drag equipment onto the page, then choose a line tool above to join things up, and Label to name the parts.';
  const LABEL_HINT = 'Label: click the thing you want to label, then click where the words should go. Then type the label (and, if you like, its precision) in the settings.';
  const hintFor = (t) => (t === 'select' ? SELECT_HINT : t === 'label' ? LABEL_HINT : KINDS[t].hint);

  // Labels: text sizes, and a measure of how wide a piece of text is (for the leader line and the selection box)
  const LB_SIZE = 16, SPEC_SIZE = 12.5, NUM_R = 11, KEY_SIZE = 15;
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const measureCtx = document.createElement('canvas').getContext('2d');
  function textWidth(s, size, bold) {
    measureCtx.font = `${bold ? '600 ' : ''}${size}px ${FONT}`;
    return measureCtx.measureText(String(s || '')).width;
  }

  // ---------------------------------------------------------------- state
  let doc = blankDoc();
  let sel = new Set();          // ids of the selected objects
  let zoom = 1, fitMode = true;
  let clipboard = null, pasteCount = 0;
  let history = [], hIndex = -1;
  let tool = 'select';          // or a line kind
  let drawing = null;           // the line being drawn: { points, att }
  let hover = null;             // { p, att } where the next point would go
  let labelDraft = null;        // a label being placed: { p, to, tp, name } after the first click
  let labelHover = null;        // where its words would go

  function blankDoc() {
    return { format: 'ib-physics-diagram', version: 1, page: { w: PAGE_W, h: PAGE_H, grid: GRID, snap: true, showGrid: true }, objects: [] };
  }
  const byId = (id) => doc.objects.find((o) => o.id === id);
  const selected = () => doc.objects.filter((o) => sel.has(o.id));
  function newId() {
    let m = 0;
    doc.objects.forEach((o) => { const k = parseInt(String(o.id).slice(1), 10); if (k > m) m = k; });
    return 'o' + (m + 1);
  }
  const snapOn = () => doc.page.snap;
  const snapv = (v) => (snapOn() ? Math.round(v / GRID) * GRID : r2(v));

  // ---------------------------------------------------------------- geometry
  const centre = (o) => [o.x + o.w / 2, o.y + o.h / 2];
  const rad = (deg) => (deg * Math.PI) / 180;
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  function rotPt([x, y], deg) { const c = Math.cos(rad(deg)), s = Math.sin(rad(deg)); return [x * c - y * s, x * s + y * c]; }
  function corners(o) {
    const [cx, cy] = centre(o);
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
      const [x, y] = rotPt([sx * o.w / 2, sy * o.h / 2], o.rot || 0);
      return [cx + x, cy + y];
    });
  }
  function shapePts(o) {
    if (o.type === 'line') return o.points;
    if (o.type === 'label') { const b = labelBox(o); return [targetPt(o), [b.x1, b.y1], [b.x2, b.y2]]; }
    return corners(o);
  }
  function bbox(list) {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    list.forEach((o) => shapePts(o).forEach(([x, y]) => { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y); }));
    return { x1, y1, x2, y2 };
  }
  function normAngle(a) { a = ((a + 180) % 360 + 360) % 360 - 180; return r2(a === -180 ? 180 : a); }
  // The nearest point on segment a–b to p, and how far along it is (0 to 1)
  function nearestOnSeg(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)) : 0;
    return { q: [a[0] + t * dx, a[1] + t * dy], t };
  }

  // Where an item's attachment point is on the page
  function anchorsOf(o) {
    const it = D.byId[o.item];
    if (!it) return {};
    const a = D.anchors(it, o.w, o.h, o.opt), out = {}, [cx, cy] = centre(o);
    Object.keys(a).forEach((k) => {
      let [x, y] = a[k];
      if (o.flip) x = o.w - x;
      const [rx, ry] = rotPt([x - o.w / 2, y - o.h / 2], o.rot || 0);
      out[k] = [r2(cx + rx), r2(cy + ry)];
    });
    return out;
  }

  // ----- Labels. A label's (x, y) is where its leader line meets it; `to` fixes the other end of the
  // leader to a piece of equipment ({ obj, u, v }: fractions across and down the item) or a line
  // ({ obj, i, t }: piece i, fraction t along it); without `to`, the end is the free point `tp`.
  function targetPt(l) {
    const o = l.to && byId(l.to.obj);
    if (o && o.type === 'item') {
      let x = (l.to.u - 0.5) * o.w; const y = (l.to.v - 0.5) * o.h;
      if (o.flip) x = -x;
      const [rx, ry] = rotPt([x, y], o.rot || 0), [cx, cy] = centre(o);
      return [r2(cx + rx), r2(cy + ry)];
    }
    if (o && o.type === 'line') {
      const a = o.points[Math.min(l.to.i, o.points.length - 2)], b = o.points[Math.min(l.to.i, o.points.length - 2) + 1];
      return [r2(a[0] + (b[0] - a[0]) * l.to.t), r2(a[1] + (b[1] - a[1]) * l.to.t)];
    }
    return l.tp ? l.tp.slice() : [l.x - 40, l.y];
  }
  // What a label at page point p would be fixed to, given the thing under it
  function attachTo(p, o) {
    if (!o || o.type === 'label') return { to: null, tp: p.map(r2) };
    if (o.type === 'item') {
      const [cx, cy] = centre(o);
      let [x, y] = rotPt([p[0] - cx, p[1] - cy], -(o.rot || 0));
      if (o.flip) x = -x;
      return { to: { obj: o.id, u: r2(x / o.w + 0.5), v: r2(y / o.h + 0.5) }, tp: null };
    }
    let best = { d: Infinity };
    for (let i = 0; i < o.points.length - 1; i++) {
      const { q, t } = nearestOnSeg(p, o.points[i], o.points[i + 1]), d = dist(p, q);
      if (d < best.d) best = { d, i, t };
    }
    return { to: { obj: o.id, i: best.i, t: r2(best.t) }, tp: null };
  }
  const numbered = () => !!doc.page.numbered;
  const labelsInOrder = () => doc.objects.filter((o) => o.type === 'label').sort((a, b) => (a.n || 0) - (b.n || 0));
  // Is the label's text to the left of its leader (so it ends at x), or to the right (starts at x)?
  const onLeft = (l) => l.x < targetPt(l)[0] - 2;
  function labelBox(l) {
    if (numbered()) return { x1: l.x - NUM_R, y1: l.y - NUM_R, x2: l.x + NUM_R, y2: l.y + NUM_R };
    const w = Math.max(textWidth(l.text || ' ', LB_SIZE), l.spec ? textWidth(l.spec, SPEC_SIZE) : 0) + 6;
    const h = l.spec ? LB_SIZE + SPEC_SIZE + 6 : LB_SIZE + 4;
    const x1 = onLeft(l) ? l.x - w - 2 : l.x;
    return { x1, y1: l.y - LB_SIZE / 2 - 3, x2: x1 + w + 2, y2: l.y - LB_SIZE / 2 - 3 + h };
  }

  // Keep lines attached to equipment that has moved. A wire with corners keeps its corners square.
  function followAttachments() {
    doc.objects.forEach((l) => {
      if (l.type !== 'line' || !l.att) return;
      const was = l.points.map((p) => p.slice());
      l.att.forEach((a, i) => {
        if (!a) return;
        const o = byId(a.obj);
        const p = o && anchorsOf(o)[a.anchor];
        if (!p) { l.att[i] = null; return; }
        const old = l.points[i];
        if (old[0] === p[0] && old[1] === p[1]) return;
        if (l.kind === 'wire' && !l.curved && l.points.length > 2) {
          [i - 1, i + 1].forEach((j) => {
            const q = l.points[j];
            if (!q || l.att[j]) return;
            if (Math.abs(q[1] - old[1]) < 0.5) q[1] = p[1];        // was a level piece: stay level
            else if (Math.abs(q[0] - old[0]) < 0.5) q[0] = p[0];   // was an upright piece: stay upright
          });
        }
        l.points[i] = p.slice();
      });
      // A straight wire between two terminals gets a square corner rather than slanting
      if (l.kind === 'wire' && !l.curved && l.points.length === 2) {
        const [a, b] = was, [A, B] = l.points;
        const movedA = A[0] !== a[0] || A[1] !== a[1], movedB = B[0] !== b[0] || B[1] !== b[1];
        if (movedA !== movedB && Math.abs(A[0] - B[0]) > 0.5 && Math.abs(A[1] - B[1]) > 0.5) {
          const fixed = movedA ? B : A, moving = movedA ? A : B;
          let corner = null;
          if (Math.abs(a[0] - b[0]) < 0.5) corner = [fixed[0], moving[1]];        // was upright
          else if (Math.abs(a[1] - b[1]) < 0.5) corner = [moving[0], fixed[1]];   // was level
          if (corner) { l.points.splice(1, 0, corner); l.att.splice(1, 0, null); }
        }
      }
    });
  }

  // ---------------------------------------------------------------- drawing the page
  svg.setAttribute('viewBox', `0 0 ${PAGE_W} ${PAGE_H}`);
  svg.innerHTML =
    `<defs><pattern id="dm-grid-s" width="${GRID}" height="${GRID}" patternUnits="userSpaceOnUse"><path class="dm-grid1" d="M${GRID} 0H0V${GRID}"/></pattern>` +
    `<pattern id="dm-grid-l" width="${GRID * 5}" height="${GRID * 5}" patternUnits="userSpaceOnUse"><rect width="${GRID * 5}" height="${GRID * 5}" fill="url(#dm-grid-s)"/><path class="dm-grid2" d="M${GRID * 5} 0H0V${GRID * 5}"/></pattern></defs>` +
    `<rect class="dm-paper" width="${PAGE_W}" height="${PAGE_H}"/>` +
    `<rect class="dm-gridrect" width="${PAGE_W}" height="${PAGE_H}" fill="url(#dm-grid-l)"/>` +
    `<g class="dm-art" id="dm-objs"></g><g id="dm-over"></g>`;
  const gObjs = svg.querySelector('#dm-objs'), gOver = svg.querySelector('#dm-over'), gridRect = svg.querySelector('.dm-gridrect');

  function transformOf(o) {
    const [cx, cy] = centre(o);
    return `translate(${r2(cx)} ${r2(cy)}) rotate(${o.rot || 0})${o.flip ? ' scale(-1 1)' : ''} translate(${r2(-o.w / 2)} ${r2(-o.h / 2)})`;
  }
  function itemMarkup(o) {
    const it = D.byId[o.item];
    if (it) return D.markup(it, o.w, o.h, o.opt, o.flip);
    // An item this version of the page doesn't know (e.g. a file saved on a newer version)
    return `<rect class="o m" width="${o.w}" height="${o.h}"/><text class="t" x="${o.w / 2}" y="${o.h / 2}" font-size="10" text-anchor="middle" dominant-baseline="central">${esc(o.item)}</text>`;
  }

  // The path through a line's points: straight pieces, or a smooth curve through them
  function pathD(pts, curved) {
    const P = pts.map((p) => p.map(r2));
    if (!curved || P.length < 3) return 'M' + P.map((p) => p.join(' ')).join(' L');
    let d = `M${P[0][0]} ${P[0][1]}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${r2(c1[0])} ${r2(c1[1])} ${r2(c2[0])} ${r2(c2[1])} ${p2[0]} ${p2[1]}`;
    }
    return d;
  }
  // A triangle pointing along u from tip t (len long, wid wide)
  function head(t, u, len, wid) {
    const n = [-u[1], u[0]], b = [t[0] - u[0] * len, t[1] - u[1] * len];
    return [t, [b[0] + n[0] * wid / 2, b[1] + n[1] * wid / 2], [b[0] - n[0] * wid / 2, b[1] - n[1] * wid / 2]].map((p) => p.map(r2).join(',')).join(' ');
  }
  const unit = (a, b) => { const L = dist(a, b) || 1; return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; };

  function lineMarkup(l) {
    const d = pathD(l.points, l.curved && KINDS[l.kind].curve);
    const P = l.points, n = P.length;
    if (l.kind === 'string') return `<path class="ln-string" d="${d}"/>`;
    if (l.kind === 'wire') return `<path class="ln-wire" d="${d}"/>`;
    if (l.kind === 'tube') return `<path class="ln-tube-o" d="${d}"/><path class="ln-tube-i" d="${d}"/>`;
    if (l.kind === 'ray') {
      let s = `<path class="ln-ray" d="${d}"/>`;
      for (let i = 0; i < n - 1; i++) {   // an arrowhead half-way along each straight piece
        if (dist(P[i], P[i + 1]) < 24) continue;
        const u = unit(P[i], P[i + 1]), m = [(P[i][0] + P[i + 1][0]) / 2 + u[0] * 5, (P[i][1] + P[i + 1][1]) / 2 + u[1] * 5];
        s += `<polygon class="ln-rayhead" points="${head(m, u, 11, 9)}"/>`;
      }
      return s;
    }
    // Arrows: a line with its head at the last point, and an optional label beside the middle
    const a = P[n - 2], b = P[n - 1], u = unit(a, b);
    let s;
    if (l.kind === 'force') {
      const end = [b[0] - u[0] * 12, b[1] - u[1] * 12];
      s = `<path class="ln-force" d="${pathD(P.slice(0, n - 1).concat([end]), false)}"/><polygon class="ln-forcehead" points="${head(b, u, 15, 12)}"/>`;
    } else {
      const nn = [-u[1], u[0]], t = [b[0] - u[0] * 11, b[1] - u[1] * 11];
      s = `<path class="ln-motion" d="${d}"/><path class="ln-motion" d="M${r2(t[0] + nn[0] * 6)} ${r2(t[1] + nn[1] * 6)} L${r2(b[0])} ${r2(b[1])} L${r2(t[0] - nn[0] * 6)} ${r2(t[1] - nn[1] * 6)}"/>`;
    }
    if (l.text) {
      // Beside the middle of the last piece, on its left (for an upright arrow: to the side)
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], side = u[0] > 0.2 ? [u[1], -u[0]] : [-u[1], u[0]];
      s += `<text class="ln-label" x="${r2(m[0] + side[0] * 16)}" y="${r2(m[1] + side[1] * 16)}" font-size="20" text-anchor="middle" dominant-baseline="central">${esc(l.text)}</text>`;
    }
    return s;
  }

  // Dots where three or more wires (or two wires and a terminal) meet
  function junctionDots() {
    const wires = doc.objects.filter((o) => o.type === 'line' && o.kind === 'wire');
    if (wires.length < 2) return '';
    const terminals = [];
    doc.objects.forEach((o) => { if (o.type === 'item' && (D.byId[o.item] || {}).group === 'symbols') terminals.push(...Object.values(anchorsOf(o))); });
    const done = [], near = (a, b) => dist(a, b) < 0.8;
    let s = '';
    wires.forEach((w) => [w.points[0], w.points[w.points.length - 1]].forEach((E) => {
      if (done.some((p) => near(p, E))) return;
      let deg = 0;
      wires.forEach((v) => {
        const P = v.points;
        if (near(P[0], E)) deg++;
        if (near(P[P.length - 1], E)) deg++;
        for (let i = 0; i < P.length - 1; i++) {   // passes through E (not at its own ends)?
          const { q } = nearestOnSeg(E, P[i], P[i + 1]);
          if (near(q, E) && !near(E, P[0]) && !near(E, P[P.length - 1])) { deg += 2; break; }
        }
      });
      if (terminals.some((t) => near(t, E))) deg++;
      if (deg >= 3) { done.push(E); s += `<circle class="ln-dot" cx="${r2(E[0])}" cy="${r2(E[1])}" r="4"/>`; }
    }));
    return s;
  }

  // A label: its leader line (with a small dot on the thing it points to), then its words or its number
  function labelMarkup(l, num) {
    const T = targetPt(l), P = [l.x, l.y], left = onLeft(l), leader = l.leader !== false;
    let s = '';
    const lead = (from) => `<line class="lb-leader" x1="${r2(T[0])}" y1="${r2(T[1])}" x2="${r2(from[0])}" y2="${r2(from[1])}"/><circle class="lb-dot" cx="${r2(T[0])}" cy="${r2(T[1])}" r="2.2"/>`;
    if (numbered()) {
      if (leader && dist(T, P) > NUM_R + 3) { const u = unit(P, T); s += lead([P[0] + u[0] * NUM_R, P[1] + u[1] * NUM_R]); }
      return s + `<circle class="lb-num" cx="${r2(l.x)}" cy="${r2(l.y)}" r="${NUM_R}"/>` +
        `<text class="lb-numt" x="${r2(l.x)}" y="${r2(l.y + 0.5)}" font-size="13" text-anchor="middle" dominant-baseline="central">${num}</text>`;
    }
    if (leader && dist(T, P) > 6) s += lead([l.x + (left ? 3 : -3), l.y]);
    const tx = r2(l.x + (left ? -4 : 4)), anchor = left ? 'end' : 'start';
    s += `<text class="lb-text" x="${tx}" y="${r2(l.y)}" font-size="${LB_SIZE}" text-anchor="${anchor}" dominant-baseline="central">${esc(l.text || '')}</text>`;
    if (l.spec) s += `<text class="lb-spec" x="${tx}" y="${r2(l.y + LB_SIZE / 2 + SPEC_SIZE / 2 + 4)}" font-size="${SPEC_SIZE}" text-anchor="${anchor}" dominant-baseline="central">${esc(l.spec)}</text>`;
    return s;
  }
  // The key under the diagram when labels are numbered (beside it if there's no room underneath)
  function keyLayout() {
    const labels = labelsInOrder();
    if (!numbered() || !labels.length) return null;
    const rest = doc.objects;
    const b = bbox(rest), rowH = KEY_SIZE + 9;
    const rows = labels.map((l, i) => ({ n: i + 1, text: l.text || '', spec: l.spec || '' }));
    let x = b.x1, y = b.y2 + 34;
    if (y + rowH * rows.length > PAGE_H - 8) { x = b.x2 + 40; y = b.y1 + 10; }
    return { x: r2(x), y: r2(y), rowH, rows };
  }
  function keyMarkup() {
    const k = keyLayout();
    if (!k) return '';
    return '<g class="lb-key">' + k.rows.map((r, i) => {
      const y = r2(k.y + i * k.rowH);
      return `<text class="lb-text" x="${k.x}" y="${y}" font-size="${KEY_SIZE}" dominant-baseline="central"><tspan class="lb-keyn">${r.n}</tspan>` +
        `<tspan x="${r2(k.x + 26)}">${esc(r.text)}</tspan>${r.spec ? `<tspan class="lb-spec" font-size="${SPEC_SIZE + 0.5}"> (${esc(r.spec)})</tspan>` : ''}</text>`;
    }).join('') + '</g>';
  }

  function renderObjects() {
    followAttachments();
    const nums = {};
    labelsInOrder().forEach((l, i) => { nums[l.id] = i + 1; });
    gObjs.innerHTML = doc.objects.map((o) => {
      if (o.type === 'item') {
        const m = itemMarkup(o);
        return `<g data-id="${esc(o.id)}" transform="${transformOf(o)}">${m}<g class="dm-hit">${m}</g></g>`;
      }
      if (o.type === 'line') {
        return `<g data-id="${esc(o.id)}">${lineMarkup(o)}<path class="dm-linehit" d="${pathD(o.points, o.curved && KINDS[o.kind].curve)}"/></g>`;
      }
      if (o.type === 'label') {
        // Only the words select a label: its leader line lets clicks through to the equipment underneath
        const b = labelBox(o);
        return `<g data-id="${esc(o.id)}"><g class="dm-nohit">${labelMarkup(o, nums[o.id])}</g>` +
          `<rect class="dm-boxhit" x="${r2(b.x1)}" y="${r2(b.y1)}" width="${r2(b.x2 - b.x1)}" height="${r2(b.y2 - b.y1)}"/></g>`;
      }
      return '';
    }).join('') + junctionDots() + keyMarkup();
  }

  let marquee = null;   // { x1, y1, x2, y2 } while dragging a selection box
  function renderOverlay() {
    const k = 1 / zoom, hs = 10 * k;   // handles stay the same size on screen
    let s = '';
    const list = selected();
    if (list.length === 1 && list[0].type === 'item' && tool === 'select') {
      const o = list[0], it = D.byId[o.item] || {};
      const [cx, cy] = centre(o), w = o.w, h = o.h;
      const hd = (x, y, name) => `<rect class="dm-handle" data-h="${name}" x="${r2(x - hs / 2)}" y="${r2(y - hs / 2)}" width="${r2(hs)}" height="${r2(hs)}"/>`;
      s += `<g transform="translate(${r2(cx)} ${r2(cy)}) rotate(${o.rot || 0})">` +
        `<rect class="dm-selbox" x="${r2(-w / 2)}" y="${r2(-h / 2)}" width="${r2(w)}" height="${r2(h)}"/>` +
        `<line class="dm-selbox" x1="0" y1="${r2(-h / 2)}" x2="0" y2="${r2(-h / 2 - 26 * k)}"/>` +
        `<circle class="dm-handle dm-rot" data-h="rot" cx="0" cy="${r2(-h / 2 - 26 * k)}" r="${r2(7 * k)}"/>` +
        hd(-w / 2, -h / 2, 'nw') + hd(w / 2, -h / 2, 'ne') + hd(w / 2, h / 2, 'se') + hd(-w / 2, h / 2, 'sw') +
        (it.stretch === 'w' ? hd(-w / 2, 0, 'w') + hd(w / 2, 0, 'e') : '') +
        (it.stretch === 'h' ? hd(0, -h / 2, 'n') + hd(0, h / 2, 's') : '') + '</g>';
    } else if (list.length === 1 && list[0].type === 'line' && tool === 'select') {
      const l = list[0];
      s += `<path class="dm-selline" d="${pathD(l.points, l.curved && KINDS[l.kind].curve)}"/>`;
      l.points.forEach((p, i) => {
        s += `<circle class="dm-handle dm-pt${l.att && l.att[i] ? ' dm-pt-on' : ''}" data-pt="${i}" cx="${r2(p[0])}" cy="${r2(p[1])}" r="${r2(6 * k)}"/>`;
      });
    } else if (list.length === 1 && list[0].type === 'label' && tool === 'select') {
      const l = list[0], b = labelBox(l), T = targetPt(l);
      s += `<rect class="dm-selbox" x="${r2(b.x1 - 3)}" y="${r2(b.y1 - 3)}" width="${r2(b.x2 - b.x1 + 6)}" height="${r2(b.y2 - b.y1 + 6)}"/>` +
        `<circle class="dm-handle dm-pt${l.to ? ' dm-pt-on' : ''}" data-lt="1" cx="${T[0]}" cy="${T[1]}" r="${r2(6 * k)}"/>`;
    } else if (list.length > 1) {
      const b = bbox(list);
      s += `<rect class="dm-selbox" x="${r2(b.x1 - 4)}" y="${r2(b.y1 - 4)}" width="${r2(b.x2 - b.x1 + 8)}" height="${r2(b.y2 - b.y1 + 8)}"/>`;
    }
    if (tool === 'label') {
      if (labelDraft) {
        const T = labelDraft.p, P = labelHover || T;
        s += `<g class="dm-art dm-preview"><line class="lb-leader" x1="${T[0]}" y1="${T[1]}" x2="${r2(P[0])}" y2="${r2(P[1])}"/><circle class="lb-dot" cx="${T[0]}" cy="${T[1]}" r="2.2"/></g>`;
      }
    } else if (tool !== 'select') {
      // Show every attachment point while a line tool is chosen
      doc.objects.forEach((o) => {
        if (o.type !== 'item') return;
        Object.values(anchorsOf(o)).forEach((p) => { s += `<circle class="dm-anchor" cx="${p[0]}" cy="${p[1]}" r="${r2(4 * k)}"/>`; });
      });
      if (drawing) {
        const pts = drawing.points.concat(hover ? previewPts(hover.p) : []);
        if (pts.length > 1) s += `<g class="dm-art dm-preview">${lineMarkup({ kind: tool, points: pts, curved: false })}</g>`;
        drawing.points.forEach((p) => { s += `<circle class="dm-drawpt" cx="${r2(p[0])}" cy="${r2(p[1])}" r="${r2(3.5 * k)}"/>`; });
      }
      if (hover) s += `<circle class="dm-snap${hover.att ? ' dm-snap-on' : ''}" cx="${r2(hover.p[0])}" cy="${r2(hover.p[1])}" r="${r2((hover.att ? 8 : 5) * k)}"/>`;
    }
    if (marquee) {
      const x = Math.min(marquee.x1, marquee.x2), y = Math.min(marquee.y1, marquee.y2);
      s += `<rect class="dm-marquee" x="${r2(x)}" y="${r2(y)}" width="${r2(Math.abs(marquee.x2 - marquee.x1))}" height="${r2(Math.abs(marquee.y2 - marquee.y1))}"/>`;
    }
    gOver.innerHTML = s;
    app.querySelectorAll('[data-needs]').forEach((b) => { b.disabled = list.length === 0; });
  }
  function render() { renderObjects(); renderOverlay(); }

  // ---------------------------------------------------------------- undo and redo
  function commit() {
    const snap = JSON.stringify(doc);
    if (history[hIndex] === snap) return;
    history = history.slice(0, hIndex + 1);
    history.push(snap);
    if (history.length > 200) history.shift();
    hIndex = history.length - 1;
    updateUndo();
    autosave();
  }
  function restore(i) {
    hIndex = i;
    doc = JSON.parse(history[i]);
    sel = new Set([...sel].filter((id) => byId(id)));
    syncPageButtons(); render(); renderProps(); updateUndo();
    autosave();
  }
  const undo = () => { if (drawing) { cancelDrawing(); return; } if (hIndex > 0) restore(hIndex - 1); };
  const redo = () => { if (hIndex < history.length - 1) restore(hIndex + 1); };
  function updateUndo() {
    $('[data-act="undo"]').disabled = hIndex <= 0 && !drawing;
    $('[data-act="redo"]').disabled = hIndex >= history.length - 1;
  }

  // ---------------------------------------------------------------- zoom
  function setZoom(z, keepClient) {
    z = Math.min(4, Math.max(0.2, z));
    // Keep the point under keepClient (or the middle of the view) still while zooming
    const rect = stage.getBoundingClientRect();
    const cx = keepClient ? keepClient[0] : rect.left + rect.width / 2, cy = keepClient ? keepClient[1] : rect.top + rect.height / 2;
    const before = toPage(cx, cy);
    zoom = z;
    svg.style.width = PAGE_W * z + 'px';
    svg.style.height = PAGE_H * z + 'px';
    const after = toPage(cx, cy);
    stage.scrollLeft += (before[0] - after[0]) * z;
    stage.scrollTop += (before[1] - after[1]) * z;
    renderOverlay();
  }
  function fit() {
    fitMode = true;
    setZoom(Math.min((stage.clientWidth - 24) / PAGE_W, 1.5));   // fit the width; scroll for the rest
    stage.scrollLeft = 0; stage.scrollTop = 0;
  }
  function toPage(clientX, clientY) {
    const m = svg.getScreenCTM();
    if (!m) return [0, 0];
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return [p.x, p.y];
  }
  // The middle of the part of the page that can be seen (inside the stage, the page and the browser window)
  function viewCentre() {
    const a = stage.getBoundingClientRect(), b = svg.getBoundingClientRect();
    const x1 = Math.max(a.left, b.left, 0), x2 = Math.min(a.right, b.right, window.innerWidth);
    const y1 = Math.max(a.top, b.top, 0), y2 = Math.min(a.bottom, b.bottom, window.innerHeight);
    const [x, y] = x2 > x1 && y2 > y1 ? toPage((x1 + x2) / 2, (y1 + y2) / 2) : [PAGE_W / 2, PAGE_H / 2];
    return [Math.min(PAGE_W - 60, Math.max(60, x)), Math.min(PAGE_H - 60, Math.max(60, y))];
  }

  // ---------------------------------------------------------------- moving whole objects
  // `group`: moving with other things, so a label's free leader end moves too (alone, it stays put)
  function shift(o, dx, dy, group) {
    if (o.type === 'line') o.points = o.points.map(([x, y]) => [r2(x + dx), r2(y + dy)]);
    else { o.x = r2(o.x + dx); o.y = r2(o.y + dy); }
    if (o.type === 'label' && group && !o.to && o.tp) o.tp = [r2(o.tp[0] + dx), r2(o.tp[1] + dy)];
  }
  // A selected line that moves without the item it's attached to comes away from it
  function detachFromUnselected(list) {
    list.forEach((l) => { if (l.type === 'line' && l.att) l.att = l.att.map((a) => (a && sel.has(a.obj) ? a : null)); });
  }

  // ---------------------------------------------------------------- adding, copying, deleting
  function addItem(itemId, cx, cy) {
    const it = D.byId[itemId];
    if (!it) return;
    setTool('select');
    const o = { id: newId(), type: 'item', item: itemId, x: snapv(cx - it.w / 2), y: snapv(cy - it.h / 2), w: it.w, h: it.h, rot: 0, flip: false, opt: D.defaults(it) };
    doc.objects.push(o);
    sel = new Set([o.id]);
    render(); renderProps(); commit();
    if (narrow()) setDrawer(null);
  }
  function copySel() {
    const list = selected();
    if (list.length) { clipboard = JSON.stringify(list); pasteCount = 0; }
  }
  function paste() {
    if (!clipboard) return;
    pasteCount++;
    const list = JSON.parse(clipboard), ids = {};
    sel = new Set();
    list.forEach((o) => { ids[o.id] = newId(); o.id = ids[o.id]; doc.objects.push(o); sel.add(o.id); });
    list.forEach((o) => {
      shift(o, 20 * pasteCount, 20 * pasteCount, true);
      if (o.att) o.att = o.att.map((a) => (a && ids[a.obj] ? { obj: ids[a.obj], anchor: a.anchor } : null));   // stays attached only to copies
      if (o.to && ids[o.to.obj]) o.to = Object.assign({}, o.to, { obj: ids[o.to.obj] });                      // a copied label points at the copy
      if (o.type === 'label') o.n = nextLabelN();
    });
    render(); renderProps(); commit();
  }
  function duplicate() { copySel(); paste(); }
  function del() {
    if (!sel.size) return;
    // Labels pointing at something being deleted keep their leader where it was
    doc.objects.forEach((l) => { if (l.type === 'label' && l.to && sel.has(l.to.obj)) { l.tp = targetPt(l); l.to = null; } });
    doc.objects = doc.objects.filter((o) => !sel.has(o.id));
    doc.objects.forEach((l) => { if (l.att) l.att = l.att.map((a) => (a && byId(a.obj) ? a : null)); });
    sel = new Set(); render(); renderProps(); commit();
  }
  function toFront(front) {
    const a = doc.objects.filter((o) => !sel.has(o.id)), b = selected();
    doc.objects = front ? a.concat(b) : b.concat(a);
    render(); commit();
  }
  // Turn the selection; a group turns about its middle, as one piece
  function rotateSel(deg) {
    const list = selected();
    if (!list.length) return;
    detachFromUnselected(list);
    const b = bbox(list), gx = (b.x1 + b.x2) / 2, gy = (b.y1 + b.y2) / 2;
    const turn = ([x, y]) => { const [dx, dy] = rotPt([x - gx, y - gy], deg); return [r2(gx + dx), r2(gy + dy)]; };
    list.forEach((o) => {
      if (o.type === 'line') { o.points = o.points.map(turn); return; }
      if (o.type === 'label') {   // words stay upright; only their place turns
        if (list.length > 1) { [o.x, o.y] = turn([o.x, o.y]); if (!o.to && o.tp) o.tp = turn(o.tp); }
        return;
      }
      if (list.length > 1) { const [cx, cy] = turn(centre(o)); o.x = r2(cx - o.w / 2); o.y = r2(cy - o.h / 2); }
      o.rot = normAngle((o.rot || 0) + deg);
    });
    render(); renderProps(); commit();
  }
  function flipSel() {
    const list = selected();
    if (!list.length) return;
    detachFromUnselected(list);
    const b = bbox(list), gx = (b.x1 + b.x2) / 2;
    list.forEach((o) => {
      if (o.type === 'line') { o.points = o.points.map(([x, y]) => [r2(2 * gx - x), y]); return; }
      if (o.type === 'label') {
        if (list.length > 1) { o.x = r2(2 * gx - o.x); if (!o.to && o.tp) o.tp = [r2(2 * gx - o.tp[0]), o.tp[1]]; }
        return;
      }
      if (list.length > 1) { const [cx] = centre(o); o.x = r2(2 * gx - cx - o.w / 2); }
      o.flip = !o.flip; o.rot = normAngle(-(o.rot || 0));
    });
    render(); renderProps(); commit();
  }
  function nudge(dx, dy) {
    const list = selected();
    detachFromUnselected(list);
    list.forEach((o) => shift(o, dx, dy, list.length > 1));
    render(); renderProps(); commit();
  }

  // ---------------------------------------------------------------- drawing lines
  // Where a click at page point p should go: an attachment point or a wire nearby, else the grid
  function snapPoint(p, free) {
    const reach = 14 / zoom;
    let best = null, bd = reach;
    doc.objects.forEach((o) => {
      if (o.type !== 'item') return;
      const a = anchorsOf(o);
      Object.keys(a).forEach((k) => { const d = dist(p, a[k]); if (d < bd) { bd = d; best = { p: a[k].slice(), att: { obj: o.id, anchor: k } }; } });
    });
    if (best) return best;
    // Ends and corners of other lines, then (for wires) anywhere along a wire, to make a junction
    doc.objects.forEach((o) => {
      if (o.type !== 'line') return;
      o.points.forEach((q) => { const d = dist(p, q); if (d < bd) { bd = d; best = { p: q.slice(), att: null }; } });
    });
    if (best) return best;
    if (tool === 'wire') {
      doc.objects.forEach((o) => {
        if (o.type !== 'line' || o.kind !== 'wire') return;
        for (let i = 0; i < o.points.length - 1; i++) {
          const { q } = nearestOnSeg(p, o.points[i], o.points[i + 1]), d = dist(p, q);
          if (d < bd) { bd = d; best = { p: q.map(r2), att: null }; }
        }
      });
      if (best) return best;
    }
    return { p: free ? p.map(r2) : [snapv(p[0]), snapv(p[1])], att: null };
  }
  // A point that is nearly level with (or straight above) the last point is made exactly so,
  // e.g. a ray leaving a laser whose nozzle isn't on the grid
  function levelUp(s) {
    const last = drawing && drawing.points[drawing.points.length - 1];
    if (!last || s.att) return s;
    const p = s.p.slice(), near = Math.max(GRID * 0.6, 6 / zoom);
    if (Math.abs(p[1] - last[1]) <= near) p[1] = last[1];
    else if (Math.abs(p[0] - last[0]) <= near) p[0] = last[0];
    return { p, att: s.att };
  }
  // A wire turns square corners: across first, then up or down
  function previewPts(p) {
    const last = drawing && drawing.points[drawing.points.length - 1];
    if (tool !== 'wire' || !last || drawing.slant || last[0] === p[0] || last[1] === p[1]) return [p];
    return [[p[0], last[1]], p];
  }
  function setHint(text) { hint.textContent = text; }
  function setTool(t) {
    if (drawing) cancelDrawing();
    tool = t;
    hover = null; labelDraft = null; labelHover = null;
    app.querySelectorAll('[data-tool]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === t)));
    app.classList.toggle('dm-drawmode', t !== 'select');
    setHint(hintFor(t));
    if (t !== 'select') sel = new Set();
    renderOverlay(); renderProps(); updateFinish();
  }
  function updateFinish() {
    $('[data-act="finish"]').hidden = !(drawing && KINDS[tool] && drawing.points.length > 1 && !KINDS[tool].two);
    updateUndo();
  }
  let lastDown = { t: 0, c: [0, 0] };
  function drawClick(e) {
    const c = [e.clientX, e.clientY], now = Date.now();
    const dbl = now - lastDown.t < 400 && dist(c, lastDown.c) < 10;
    lastDown = { t: now, c };
    if (dbl && drawing) { finishDrawing(); return; }   // a double-click (or double-tap) finishes the line
    const s = levelUp(snapPoint(toPage(e.clientX, e.clientY), e.altKey));
    if (!drawing) { drawing = { points: [s.p], att: [s.att], slant: false }; }
    else {
      drawing.slant = e.shiftKey;
      const last = drawing.points[drawing.points.length - 1];
      if (dist(last, s.p) < 0.5) return;
      const pts = previewPts(s.p);
      pts.forEach((p, i) => { drawing.points.push(p); drawing.att.push(i === pts.length - 1 ? s.att : null); });
      // A two-point arrow is finished; a wire or tube ends on the terminal or nozzle it reaches
      if (KINDS[tool].two || ((tool === 'wire' || tool === 'tube') && s.att)) { finishDrawing(); return; }
    }
    hover = null;
    renderOverlay(); updateFinish();
  }
  function finishDrawing() {
    const d = drawing;
    drawing = null; hover = null;
    if (d && d.points.length > 1) {
      // Drop repeated points (a double-click adds one)
      const pts = [], att = [];
      d.points.forEach((p, i) => { if (!pts.length || dist(pts[pts.length - 1], p) > 0.5) { pts.push(p); att.push(d.att[i]); } else if (d.att[i]) att[att.length - 1] = d.att[i]; });
      if (pts.length > 1) {
        const l = { id: newId(), type: 'line', kind: tool, points: pts, att };
        if (KINDS[tool].label) l.text = '';
        doc.objects.push(l);
        sel = new Set([l.id]);
        render(); renderProps(); commit();
      }
    }
    renderOverlay(); updateFinish();
  }
  function cancelDrawing() { drawing = null; hover = null; renderOverlay(); updateFinish(); }

  // ---------------------------------------------------------------- placing labels
  const nextLabelN = () => doc.objects.reduce((m, o) => (o.type === 'label' ? Math.max(m, o.n || 0) : m), 0) + 1;
  // The thing under a point on the screen (not the label being placed, not the handles)
  function thingAt(clientX, clientY, skipId) {
    for (const el of document.elementsFromPoint(clientX, clientY)) {
      const g = el.closest && el.closest('#dm-objs [data-id]');
      if (g && g.dataset.id !== skipId) { const o = byId(g.dataset.id); if (o && o.type !== 'label') return o; }
    }
    return null;
  }
  // First click: what the label points at. Second click: where its words go.
  function labelClick(e) {
    const p = toPage(e.clientX, e.clientY);
    if (!labelDraft) {
      const o = thingAt(e.clientX, e.clientY);
      const it = o && o.type === 'item' ? D.byId[o.item] : null;
      const name = it ? it.name.replace(/ \((?:on a stand|seen from above)\)$/, '').replace(/ \(.*\)$/, '') : o && o.type === 'line' ? KINDS[o.kind].name : '';
      labelDraft = Object.assign({ p: p.map(r2), name }, attachTo(p, o));
      setHint('Now click where the words should go.');
      renderOverlay();
      return;
    }
    const d = labelDraft;
    labelDraft = null; labelHover = null;
    const P = [snapv(p[0]), snapv(p[1])];
    const l = { id: newId(), type: 'label', text: d.name || 'Label', spec: '', x: P[0], y: P[1], to: d.to, tp: d.tp, n: nextLabelN() };
    doc.objects.push(l);
    setTool('select');
    sel = new Set([l.id]);
    render(); renderProps(); commit();
    focusLabelText();
  }
  // Put the cursor in the label's text box, ready to type (opening the settings drawer on a small screen)
  function focusLabelText() {
    if (narrow()) setDrawer('props');
    const input = props.querySelector('input[data-b="text"]');
    if (input) { input.focus(); input.select(); }
  }

  // ---------------------------------------------------------------- pointer: move, resize, turn, select, pan, pinch
  const pointers = new Map();
  let drag = null;

  svg.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* keep going without capture */ }
    if (pointers.size === 2) { startPinch(); return; }
    if (pointers.size > 2) return;
    e.preventDefault();
    if (tool === 'label') { labelClick(e); drag = { mode: 'drawing' }; return; }
    if (tool !== 'select') { drawClick(e); drag = { mode: 'drawing' }; return; }
    const p = toPage(e.clientX, e.clientY);
    const h = e.target.closest('[data-h]'), pt = e.target.closest('[data-pt]'), g = e.target.closest('[data-id]');
    if (e.target.closest('[data-lt]') && sel.size === 1) {
      drag = { mode: 'lt', l: selected()[0], changed: false, p0: p };
    } else if (pt && sel.size === 1) {
      const l = selected()[0];
      drag = { mode: 'pt', l, i: Number(pt.dataset.pt), changed: false, p0: p };
    } else if (h && sel.size === 1) {
      const o = selected()[0];
      drag = { mode: h.dataset.h === 'rot' ? 'rot' : 'size', h: h.dataset.h, o, start: { ...o }, p0: p, changed: false };
    } else if (g) {
      const id = g.dataset.id;
      if (e.shiftKey) { if (sel.has(id)) sel.delete(id); else sel.add(id); }
      else if (!sel.has(id)) sel = new Set([id]);
      const list = selected();
      drag = { mode: 'move', p0: p, starts: list.map((o) => [o, clone(o)]), box: list.length ? bbox(list) : null, changed: false };
      renderProps();
    } else {
      if (!e.shiftKey) sel = new Set();
      if (e.pointerType === 'touch') drag = { mode: 'pan', c0: [e.clientX, e.clientY], s0: [stage.scrollLeft, stage.scrollTop] };
      else { drag = { mode: 'marquee', keep: new Set(sel) }; marquee = { x1: p[0], y1: p[1], x2: p[0], y2: p[1] }; }
      renderProps();
    }
    renderOverlay();
  });

  svg.addEventListener('pointermove', (e) => {
    if (tool === 'label') {   // show the leader line of the label being placed
      if (labelDraft && pointers.size < 2) { labelHover = toPage(e.clientX, e.clientY); renderOverlay(); }
    } else if (tool !== 'select' && pointers.size < 2) {   // show where the next point of a line would go
      hover = levelUp(snapPoint(toPage(e.clientX, e.clientY), e.altKey));
      if (drawing) drawing.slant = e.shiftKey;
      renderOverlay();
    }
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (drag && drag.mode === 'pinch') { movePinch(); return; }
    if (!drag || drag.mode === 'drawing') return;
    const p = toPage(e.clientX, e.clientY);
    if (drag.mode === 'pan') {
      stage.scrollLeft = drag.s0[0] - (e.clientX - drag.c0[0]);
      stage.scrollTop = drag.s0[1] - (e.clientY - drag.c0[1]);
      return;
    }
    if (drag.mode === 'marquee') {
      marquee.x2 = p[0]; marquee.y2 = p[1];
      const x1 = Math.min(marquee.x1, marquee.x2), x2 = Math.max(marquee.x1, marquee.x2);
      const y1 = Math.min(marquee.y1, marquee.y2), y2 = Math.max(marquee.y1, marquee.y2);
      sel = new Set(drag.keep);
      doc.objects.forEach((o) => { const b = bbox([o]); if (b.x1 < x2 && b.x2 > x1 && b.y1 < y2 && b.y2 > y1) sel.add(o.id); });
      renderOverlay();
      return;
    }
    let dx = p[0] - drag.p0[0], dy = p[1] - drag.p0[1];
    if (!drag.changed && Math.hypot(dx, dy) * zoom < 3) return;   // ignore tiny wobbles of a click
    if (!drag.changed && drag.mode === 'move') detachFromUnselected(drag.starts.map(([o]) => o));
    drag.changed = true;
    if (drag.mode === 'move') {
      if (snapOn() && drag.box) {   // keep the selection's top-left corner on the grid
        const one = drag.starts.length === 1 && drag.starts[0][1].type === 'label' ? drag.starts[0][1] : null;
        const ref = one ? [one.x, one.y] : [drag.box.x1, drag.box.y1];   // a lone label snaps where its leader meets it
        dx = snapv(ref[0] + dx) - ref[0];
        dy = snapv(ref[1] + dy) - ref[1];
      }
      const group = drag.starts.length > 1;
      drag.starts.forEach(([o, s]) => {
        if (o.type === 'line') o.points = s.points.map(([x, y]) => [r2(x + dx), r2(y + dy)]);
        else { o.x = r2(s.x + dx); o.y = r2(s.y + dy); }
        if (o.type === 'label' && group && !o.to && s.tp) o.tp = [r2(s.tp[0] + dx), r2(s.tp[1] + dy)];
      });
    } else if (drag.mode === 'lt') {   // move the end of a label's leader line, fixing it to whatever is under it
      Object.assign(drag.l, attachTo(p, thingAt(e.clientX, e.clientY, drag.l.id)));
    } else if (drag.mode === 'pt') {
      const s = snapPoint(p, e.altKey);
      drag.l.points[drag.i] = s.p;
      if (!drag.l.att) drag.l.att = drag.l.points.map(() => null);
      drag.l.att[drag.i] = s.att;
    } else if (drag.mode === 'rot') {
      const [cx, cy] = centre(drag.o);
      let a = (Math.atan2(p[1] - cy, p[0] - cx) * 180) / Math.PI + 90;
      if (!e.shiftKey) a = Math.round(a / 15) * 15;
      drag.o.rot = normAngle(a);
    } else resize(drag, p, e.shiftKey);
    render();
  });
  svg.addEventListener('pointerleave', () => { if (tool !== 'select' && hover && !pointers.size) { hover = null; renderOverlay(); } });

  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (drag && drag.mode === 'pinch') { if (pointers.size === 0) drag = null; return; }
    if (!drag) return;
    const d = drag; drag = null;
    if (d.mode === 'drawing') { if (e.pointerType !== 'mouse') { hover = null; renderOverlay(); } return; }
    if (d.mode === 'marquee') { marquee = null; renderOverlay(); renderProps(); return; }
    if (d.changed) { renderProps(); commit(); }
  }
  svg.addEventListener('pointerup', endPointer);
  svg.addEventListener('pointercancel', endPointer);

  // Double-click a selected line to add a bend there, or a bend to remove it
  svg.addEventListener('dblclick', (e) => {
    if (tool !== 'select' || sel.size !== 1) return;
    const l = selected()[0];
    if (l.type === 'label') { focusLabelText(); return; }   // double-click a label to change its words
    if (l.type !== 'line') return;
    const pt = e.target.closest('[data-pt]');
    if (pt) {
      const i = Number(pt.dataset.pt);
      if (i > 0 && i < l.points.length - 1) { l.points.splice(i, 1); if (l.att) l.att.splice(i, 1); }
    } else if (e.target.closest(`[data-id="${l.id}"]`)) {
      const p = toPage(e.clientX, e.clientY);
      let bi = 0, bd = Infinity, bq = null;
      for (let i = 0; i < l.points.length - 1; i++) { const { q } = nearestOnSeg(p, l.points[i], l.points[i + 1]), d = dist(p, q); if (d < bd) { bd = d; bi = i; bq = q; } }
      l.points.splice(bi + 1, 0, bq.map(r2));
      if (l.att) l.att.splice(bi + 1, 0, null);
    } else return;
    render(); renderProps(); commit();
  });

  // Resize from a handle. Corners keep the proportions; the end handles of a stretchy item change only its length.
  function resize(d, p) {
    const o = d.o, s = d.start, rot = s.rot || 0;
    const sx = d.h.includes('e') ? 1 : d.h.includes('w') ? -1 : 0;
    const sy = d.h.includes('s') ? 1 : d.h.includes('n') ? -1 : 0;
    const [cx0, cy0] = centre(s);
    // The fixed point: the opposite corner or edge
    const [ax, ay] = rotPt([-sx * s.w / 2, -sy * s.h / 2], rot);
    const A = [cx0 + ax, cy0 + ay];
    const [lx, ly] = rotPt([p[0] - A[0], p[1] - A[1]], -rot);   // pointer, measured from the fixed point along the item's own sides
    let w = s.w, h = s.h;
    const min = 8;
    if (sx && sy) {
      const k = Math.max(min / Math.min(s.w, s.h), Math.max((lx * sx) / s.w, (ly * sy) / s.h));
      w = s.w * k; h = s.h * k;
      if (snapOn()) { const k2 = Math.max(GRID, snapv(w)) / w; w *= k2; h *= k2; }
    } else if (sx) { w = Math.max(min, lx * sx); if (snapOn()) w = Math.max(GRID, snapv(w)); }
    else if (sy) { h = Math.max(min, ly * sy); if (snapOn()) h = Math.max(GRID, snapv(h)); }
    const [ox, oy] = rotPt([sx * w / 2, sy * h / 2], rot);
    const cx = A[0] + ox, cy = A[1] + oy;
    o.w = r2(w); o.h = r2(h); o.x = r2(cx - w / 2); o.y = r2(cy - h / 2);
  }

  // Two fingers: pinch to zoom (and drag both to move the view)
  function startPinch() {
    if (drag && drag.changed && drag.mode !== 'pan') restore(hIndex);   // undo a half-finished move
    if (drawing && drawing.points.length === 1) cancelDrawing();         // the first finger wasn't meant as a point
    marquee = null;
    const [a, b] = [...pointers.values()];
    drag = { mode: 'pinch', d0: Math.hypot(a[0] - b[0], a[1] - b[1]), z0: zoom, m0: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
    fitMode = false;
  }
  function movePinch() {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    setZoom(drag.z0 * d / drag.d0, m);
    stage.scrollLeft -= m[0] - drag.m0[0]; stage.scrollTop -= m[1] - drag.m0[1];
    drag.m0 = m;
  }

  stage.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;   // Ctrl + mouse wheel (or a trackpad pinch) zooms
    e.preventDefault();
    fitMode = false;
    setZoom(zoom * Math.exp(-e.deltaY / 300), [e.clientX, e.clientY]);
  }, { passive: false });

  // ---------------------------------------------------------------- equipment bank
  const groupName = {}; D.groups.forEach((g) => { groupName[g.id] = g.name; });
  function tile(it) {
    const t = D.thumbSize(it), pad = 4;
    // Pictures are shrunk to fit the tile (about 90 × 48 px); --k keeps their lines about 1.5 px thick
    const s = Math.min(90 / (t.w + 2 * pad), 48 / (t.h + 2 * pad));
    return `<button type="button" class="dm-tile" data-item="${it.id}" title="${esc(it.name)}">` +
      `<svg class="dm-art" style="--k:${r2(0.75 / s)}" viewBox="${-pad} ${-pad} ${t.w + 2 * pad} ${t.h + 2 * pad}" aria-hidden="true">${D.markup(it, t.w, t.h)}</svg>` +
      `<span>${esc(it.name)}</span></button>`;
  }
  function buildBank() {
    const q = search.value.trim().toLowerCase();
    if (q) {
      const words = q.split(/\s+/);
      const find = (withGroup) => D.items.filter((it) => {
        const hay = [it.name].concat(it.keywords || [], withGroup ? [groupName[it.group]] : []).join(' ').toLowerCase();
        return words.every((w) => hay.includes(w));
      });
      let hits = find(false);
      if (!hits.length) hits = find(true);   // e.g. "optics" or "nuclear" finds the whole group
      bankList.innerHTML = hits.length
        ? `<p class="dm-count">${hits.length} found</p><div class="dm-tiles">${hits.map(tile).join('')}</div>`
        : '<p class="dm-count">Nothing found. Try another word, for example "stand" or "meter".</p>';
      return;
    }
    bankList.innerHTML = D.groups.map((g, i) => {
      const list = D.items.filter((it) => it.group === g.id);
      if (!list.length) return '';
      return `<details class="dm-group"${i < 2 ? ' open' : ''}><summary>${esc(g.name)} <span>(${list.length})</span></summary>` +
        `<div class="dm-tiles">${list.map(tile).join('')}</div></details>`;
    }).join('');
  }
  search.addEventListener('input', buildBank);

  // Drag a tile onto the page (mouse, pen or finger), or tap it to add it in the middle of the view
  let tileDrag = null;
  bankList.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('.dm-tile');
    if (!t || e.button > 0) return;
    tileDrag = { id: t.dataset.item, el: t, c0: [e.clientX, e.clientY], ghost: null, pid: e.pointerId };
  });
  bankList.addEventListener('pointermove', (e) => {
    if (!tileDrag || e.pointerId !== tileDrag.pid) return;
    const dx = e.clientX - tileDrag.c0[0], dy = e.clientY - tileDrag.c0[1];
    if (!tileDrag.ghost) {
      if (Math.hypot(dx, dy) < 8) return;
      // On a touch screen a mostly-vertical swipe scrolls the list instead (the browser takes it over)
      try { tileDrag.el.setPointerCapture(e.pointerId); } catch (err) { /* keep going without capture */ }
      const it = D.byId[tileDrag.id];
      const g = document.createElement('div');
      g.className = 'dm-ghost';
      g.innerHTML = `<svg class="dm-art" viewBox="0 0 ${it.w} ${it.h}" width="${it.w * zoom}" height="${it.h * zoom}" aria-hidden="true">${D.markup(it)}</svg>`;
      document.body.appendChild(g);
      tileDrag.ghost = g; tileDrag.size = [it.w * zoom, it.h * zoom];
      app.classList.add('dm-dragging');   // on narrow screens the drawer fades so the page can be seen
    }
    tileDrag.ghost.style.transform = `translate(${e.clientX - tileDrag.size[0] / 2}px, ${e.clientY - tileDrag.size[1] / 2}px)`;
  });
  function endTileDrag(e, cancelled) {
    if (!tileDrag || e.pointerId !== tileDrag.pid) return;
    const t = tileDrag; tileDrag = null;
    if (!t.ghost) return;   // a tap: the click handler adds it
    t.ghost.remove();
    app.classList.remove('dm-dragging');
    t.el.dataset.dragged = '1';
    if (cancelled) return;
    const r = stage.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
    const [x, y] = toPage(e.clientX, e.clientY);
    addItem(t.id, x, y);
  }
  bankList.addEventListener('pointerup', (e) => endTileDrag(e, false));
  bankList.addEventListener('pointercancel', (e) => endTileDrag(e, true));
  bankList.addEventListener('click', (e) => {
    const t = e.target.closest('.dm-tile');
    if (!t) return;
    if (t.dataset.dragged) { delete t.dataset.dragged; return; }
    const [x, y] = viewCentre();
    addItem(t.dataset.item, x, y);
  });

  // ---------------------------------------------------------------- settings panel
  function renderProps() {
    const list = selected();
    if (!list.length) {
      props.innerHTML = '<h2>Settings</h2>' + (tool !== 'select'
        ? `<p class="dm-tip">${esc(hintFor(tool))}</p><p class="dm-tip">Press Esc, or the Select tool, when you have finished.</p>`
        : '<p class="dm-tip">Nothing is selected. Click (or tap) something on the page to change it, or drag on empty paper to select several things.</p>' +
          '<p class="dm-tip">Add equipment from the list on the left' + (narrow() ? ' (the Equipment button)' : '') + ', join it up with the line tools above the page, and name the parts with Label.</p>') +
        numberedSwitch();
      return;
    }
    if (list.length > 1) {
      props.innerHTML = `<h2>${list.length} things selected</h2><p class="dm-tip">Drag any of them to move them together. The toolbar turns, flips, copies or deletes them all at once. Shift-click adds or removes one.</p>`;
      return;
    }
    const o = list[0];
    if (o.type === 'line') { props.innerHTML = lineProps(o); return; }
    if (o.type === 'label') { props.innerHTML = labelProps(o); return; }
    const it = D.byId[o.item];
    let s = `<h2>${esc(it ? it.name : o.item)}</h2>`;
    if (it && it.options) {
      it.options.forEach((op) => {
        const v = o.opt && o.opt[op.key] !== undefined ? o.opt[op.key] : op.def;
        if (op.type === 'range') {
          s += `<label class="dm-field">${esc(op.label)} <output>${Math.round(v * 100)}%</output><input type="range" data-opt="${op.key}" min="${op.min}" max="${op.max}" step="${op.step}" value="${v}"></label>`;
        } else if (op.type === 'int') {
          s += `<label class="dm-field">${esc(op.label)}<input type="number" data-opt="${op.key}" min="${op.min}" max="${op.max}" step="1" value="${v}"></label>`;
        } else if (op.type === 'choice') {
          s += `<label class="dm-field">${esc(op.label)}<select data-opt="${op.key}">${op.values.map(([val, lab]) => `<option value="${esc(val)}"${val === v ? ' selected' : ''}>${esc(lab)}</option>`).join('')}</select></label>`;
        }
      });
    }
    const lenNote = it && it.stretch ? `<p class="dm-tip">${it.stretch === 'w' ? 'Width' : 'Height'} changes its length only.</p>` : '<p class="dm-tip">Width and height keep its shape.</p>';
    s += `<div class="dm-pair"><label class="dm-field">Width<input type="number" data-k="w" min="8" step="1" value="${Math.round(o.w)}"></label>` +
      `<label class="dm-field">Height<input type="number" data-k="h" min="8" step="1" value="${Math.round(o.h)}"></label></div>` + lenNote +
      `<label class="dm-field">Angle (degrees, clockwise)<input type="number" data-k="rot" min="-180" max="180" step="1" value="${Math.round(o.rot || 0)}"></label>` +
      `<label class="dm-check"><input type="checkbox" data-k="flip"${o.flip ? ' checked' : ''}> Flipped left to right</label>` +
      `<p><button type="button" class="button secondary dm-small" data-k="natural">Back to its normal size</button></p>`;
    props.innerHTML = s;
  }
  function lineProps(l) {
    const K = KINDS[l.kind];
    let s = `<h2>${esc(K.name)}</h2>` +
      `<label class="dm-field">Type<select data-l="kind">${Object.keys(KINDS).map((k) => `<option value="${k}"${k === l.kind ? ' selected' : ''}>${esc(KINDS[k].name)}</option>`).join('')}</select></label>`;
    if (K.label) s += `<label class="dm-field">Label (for example <i>W</i> or <i>v</i>)<input type="text" data-l="text" maxlength="12" value="${esc(l.text || '')}"></label>`;
    if (K.curve) s += `<label class="dm-check"><input type="checkbox" data-l="curved"${l.curved ? ' checked' : ''}> Smooth curve</label>`;
    s += '<p class="dm-btnrow">';
    if (l.kind === 'ray' || K.label) s += '<button type="button" class="button secondary dm-small" data-l="reverse">Reverse the direction</button>';
    s += '<button type="button" class="button secondary dm-small" data-l="bend">Add a bend</button>';
    if (l.points.length > 2) s += '<button type="button" class="button secondary dm-small" data-l="straight">Remove the bends</button>';
    s += '</p><p class="dm-tip">Drag the dots to move the ends and bends; a green dot is attached to the equipment and follows it. Double-click the line to add a bend there, or a bend to remove it.</p>';
    return s;
  }

  // The switch between labels with words and numbered labels with a key (for the whole diagram)
  function numberedSwitch() {
    return `<label class="dm-check dm-numsw"><input type="checkbox" data-b="numbered"${numbered() ? ' checked' : ''}> Numbered labels, with a key under the diagram</label>`;
  }
  function labelProps(l) {
    const list = labelsInOrder(), i = list.indexOf(l);
    let s = `<h2>Label${numbered() ? ' ' + (i + 1) : ''}</h2>` +
      `<label class="dm-field">Words<input type="text" data-b="text" maxlength="60" value="${esc(l.text || '')}"></label>` +
      `<label class="dm-field">Precision or detail <span class="dm-opt">(optional, smaller, underneath)</span><input type="text" data-b="spec" maxlength="60" placeholder="for example ±0.01 g" value="${esc(l.spec || '')}"></label>` +
      `<label class="dm-check"><input type="checkbox" data-b="leader"${l.leader !== false ? ' checked' : ''}> Leader line</label>` + numberedSwitch();
    if (numbered() && list.length > 1) {
      s += '<p class="dm-btnrow">' +
        `<button type="button" class="button secondary dm-small" data-b="up"${i === 0 ? ' disabled' : ''}>Earlier in the key</button>` +
        `<button type="button" class="button secondary dm-small" data-b="down"${i === list.length - 1 ? ' disabled' : ''}>Later in the key</button></p>`;
    }
    return s + '<p class="dm-tip">Drag the words to move them, and the dot at the other end of the leader to point at something else (it turns green when it is fixed to a piece of equipment and follows it).</p>';
  }

  function propInput(e, done) {
    const el = e.target, o = selected()[0];
    if (el.dataset.b === 'numbered') {   // works with or without a label selected
      if (!done) return;
      doc.page.numbered = el.checked;
      render(); renderProps(); commit();
      return;
    }
    if (!o || sel.size !== 1) return;
    if (o.type === 'label') {
      if (el.dataset.b === 'text') o.text = el.value;
      else if (el.dataset.b === 'spec') o.spec = el.value;
      else if (el.dataset.b === 'leader') o.leader = el.checked;
      render();
      if (done) commit();
      return;
    }
    if (o.type === 'line') {
      if (el.dataset.l === 'kind') {
        o.kind = el.value;
        if (KINDS[o.kind].label && o.text === undefined) o.text = '';
        renderProps();
      } else if (el.dataset.l === 'text') { o.text = el.value; }
      else if (el.dataset.l === 'curved') o.curved = el.checked;
      render();
      if (done) commit();
      return;
    }
    const it = D.byId[o.item];
    if (el.dataset.opt) {
      const op = it.options.find((x) => x.key === el.dataset.opt);
      let v = op.type === 'choice' ? el.value : Number(el.value);
      if (op.type === 'int') v = Math.round(Math.min(op.max, Math.max(op.min, v || 0)));
      o.opt = Object.assign({}, o.opt, { [op.key]: v });
      const out = el.parentElement.querySelector('output');
      if (out) out.textContent = Math.round(v * 100) + '%';
    } else if (el.dataset.k === 'flip') o.flip = el.checked;
    else if (el.dataset.k === 'rot') { if (el.value === '' || !done) return; o.rot = normAngle(Number(el.value)); }
    else if (el.dataset.k === 'w' || el.dataset.k === 'h') {
      if (!done) return;
      const v = Math.max(8, Number(el.value) || 0), [cx, cy] = centre(o);
      if (el.dataset.k === 'w') { if (it && it.stretch !== 'w') o.h = r2(o.h * v / o.w); o.w = v; }
      else { if (it && it.stretch !== 'h') o.w = r2(o.w * v / o.h); o.h = v; }
      o.x = r2(cx - o.w / 2); o.y = r2(cy - o.h / 2);
      renderProps();
    }
    render();
    if (done) commit();
  }
  props.addEventListener('input', (e) => propInput(e, e.target.type === 'checkbox' || e.target.tagName === 'SELECT'));
  props.addEventListener('change', (e) => propInput(e, true));
  props.addEventListener('click', (e) => {
    const k = e.target.dataset.k, lk = e.target.dataset.l, bk = e.target.dataset.b, o = selected()[0];
    if (o && (bk === 'up' || bk === 'down')) {   // swap places in the key with the label before or after
      const list = labelsInOrder(), i = list.indexOf(o), j = bk === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= list.length) return;
      list.forEach((l, m) => { l.n = m + 1; });
      [o.n, list[j].n] = [list[j].n, o.n];
      render(); renderProps(); commit();
      return;
    }
    if (!o || (!k && !['reverse', 'bend', 'straight'].includes(lk))) return;
    if (k === 'natural') {
      const it = D.byId[o.item];
      if (!it) return;
      const [cx, cy] = centre(o);
      o.w = it.w; o.h = it.h; o.x = r2(cx - it.w / 2); o.y = r2(cy - it.h / 2);
    } else if (lk === 'reverse') { o.points.reverse(); if (o.att) o.att.reverse(); }
    else if (lk === 'bend') {   // a new bend half-way along the longest piece; drag it into place
      let bi = 0;
      for (let i = 1; i < o.points.length - 1; i++) if (dist(o.points[i], o.points[i + 1]) > dist(o.points[bi], o.points[bi + 1])) bi = i;
      const a = o.points[bi], b = o.points[bi + 1];
      o.points.splice(bi + 1, 0, [r2((a[0] + b[0]) / 2), r2((a[1] + b[1]) / 2)]);
      if (o.att) o.att.splice(bi + 1, 0, null);
    } else if (lk === 'straight') {
      o.points = [o.points[0], o.points[o.points.length - 1]];
      if (o.att) o.att = [o.att[0], o.att[o.att.length - 1]];
    } else return;
    render(); renderProps(); commit();
  });

  // ---------------------------------------------------------------- toolbar and keyboard
  function syncPageButtons() {
    $('[data-act="grid"]').setAttribute('aria-pressed', String(doc.page.showGrid));
    $('[data-act="snap"]').setAttribute('aria-pressed', String(doc.page.snap));
    gridRect.style.display = doc.page.showGrid ? '' : 'none';
  }
  function setDrawer(which) {
    app.classList.toggle('show-bank', which === 'bank');
    app.classList.toggle('show-props', which === 'props');
    $('[data-act="bank"]').setAttribute('aria-pressed', String(which === 'bank'));
    $('[data-act="props"]').setAttribute('aria-pressed', String(which === 'props'));
  }
  app.querySelector('.dm-tools').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tool]');
    if (b) { setTool(b.dataset.tool); if (narrow()) setDrawer(null); }
    if (e.target.closest('[data-act="finish"]')) finishDrawing();
  });
  app.querySelector('.dm-toolbar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b || b.disabled) return;
    const act = b.dataset.act, big = e.shiftKey ? 90 : 15;
    if (act === 'undo') undo();
    else if (act === 'redo') redo();
    else if (act === 'dup') duplicate();
    else if (act === 'del') del();
    else if (act === 'rotl') rotateSel(-big);
    else if (act === 'rotr') rotateSel(big);
    else if (act === 'flip') flipSel();
    else if (act === 'front') toFront(true);
    else if (act === 'back') toFront(false);
    else if (act === 'grid') { doc.page.showGrid = !doc.page.showGrid; syncPageButtons(); commit(); }
    else if (act === 'snap') { doc.page.snap = !doc.page.snap; syncPageButtons(); commit(); }
    else if (act === 'zoomin') { fitMode = false; setZoom(zoom * 1.25); }
    else if (act === 'zoomout') { fitMode = false; setZoom(zoom / 1.25); }
    else if (act === 'fit') fit();
    else if (act === 'bank' || act === 'props') {
      const open = app.classList.contains('show-' + act);
      setDrawer(open ? null : act);
      if (act === 'props' && !open) renderProps();
    }
  });

  document.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t.closest && t.closest('input, select, textarea, [contenteditable]')) return;
    if (!app.contains(t) && t !== document.body) return;
    const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    let used = true;
    if (ctrl && k === 'z' && !e.shiftKey) undo();
    else if (ctrl && (k === 'y' || (k === 'z' && e.shiftKey))) redo();
    else if (ctrl && k === 'c') copySel();
    else if (ctrl && k === 'v') paste();
    else if (ctrl && k === 'd') duplicate();
    else if (ctrl && k === 'a') { setTool('select'); sel = new Set(doc.objects.map((o) => o.id)); renderOverlay(); renderProps(); }
    else if (k === 'enter' && drawing) finishDrawing();
    else if (k === 'escape') {
      if (drawing) cancelDrawing();
      else if (tool !== 'select') setTool('select');
      else { sel = new Set(); renderOverlay(); renderProps(); setDrawer(null); }
    } else if ((k === 'delete' || k === 'backspace') && sel.size) del();
    else if (k.startsWith('arrow') && sel.size) {
      const step = e.shiftKey ? GRID : 1;
      nudge(k === 'arrowleft' ? -step : k === 'arrowright' ? step : 0, k === 'arrowup' ? -step : k === 'arrowdown' ? step : 0);
    } else used = false;
    if (used) e.preventDefault();
  });

  // ---------------------------------------------------------------- saving and opening
  const STORE_KEY = 'diagram-maker-v1';
  const statusEl = document.getElementById('dm-status');
  let msgAt = 0;   // when the last message (not "Saved…") was shown: auto-saving doesn't cover it up for a while
  function setStatus(text, bad, routine) {
    if (routine && Date.now() - msgAt < 8000) return;
    if (!routine) msgAt = Date.now();
    statusEl.textContent = text; statusEl.classList.toggle('dm-bad', !!bad);
  }
  const timeNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Auto-save in this browser a moment after every change (it may be switched off, e.g. in a private window)
  let saveTimer = 0, storeOk = true;
  function autosave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        if (doc.objects.length) localStorage.setItem(STORE_KEY, JSON.stringify(doc));
        else localStorage.removeItem(STORE_KEY);
        storeOk = true;
        setStatus(doc.objects.length ? `Saved in this browser at ${timeNow()}.` : '', false, true);
      } catch (err) {
        if (storeOk) setStatus('This browser isn\'t letting the page save your diagram. Use "Save progress" to keep it.', true);
        storeOk = false;
      }
    }, 400);
  }
  function readAutosave() {
    try { const s = localStorage.getItem(STORE_KEY); return s ? cleanDoc(JSON.parse(s)) : null; } catch (err) { return null; }
  }

  // Check a diagram read from a file (or the browser) and keep only what the page understands.
  // Anything else is dropped, so a damaged or altered file can't break the page or put code on it.
  function cleanDoc(d) {
    if (!d || typeof d !== 'object' || d.format !== 'ib-physics-diagram' || !Array.isArray(d.objects)) return null;
    const num = (v, def = 0) => (typeof v === 'number' && isFinite(v) ? r2(v) : def);
    const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
    const pt = (p) => (Array.isArray(p) && p.length === 2 ? [num(p[0]), num(p[1])] : null);
    const ids = new Set(), out = blankDoc();
    const pg = d.page || {};
    out.page.snap = pg.snap !== false; out.page.showGrid = pg.showGrid !== false; out.page.numbered = pg.numbered === true;
    d.objects.slice(0, 2000).forEach((o) => {
      if (!o || typeof o !== 'object') return;
      let id = str(o.id, 12);
      if (!/^o\d{1,9}$/.test(id) || ids.has(id)) id = '';
      const base = { id };
      if (o.type === 'item') {
        const it = D.byId[o.item], opt = {};
        if (it) (it.options || []).forEach((op) => {   // only the item's own choices, of the right kind
          const v = o.opt && o.opt[op.key];
          if (op.type === 'choice') opt[op.key] = op.values.some(([val]) => val === v) ? v : op.def;
          else opt[op.key] = typeof v === 'number' && isFinite(v) ? Math.min(op.max, Math.max(op.min, v)) : op.def;
        });
        Object.assign(base, { type: 'item', item: str(o.item, 60), x: num(o.x), y: num(o.y), w: Math.max(4, num(o.w, 40)), h: Math.max(4, num(o.h, 40)), rot: normAngle(num(o.rot)), flip: o.flip === true, opt });
      } else if (o.type === 'line' && KINDS[o.kind] && Array.isArray(o.points)) {
        const points = o.points.slice(0, 500).map(pt).filter(Boolean);
        if (points.length < 2) return;
        const att = points.map((p, i) => {
          const a = Array.isArray(o.att) ? o.att[i] : null;
          return a && typeof a.obj === 'string' && typeof a.anchor === 'string' ? { obj: str(a.obj, 12), anchor: str(a.anchor, 30) } : null;
        });
        Object.assign(base, { type: 'line', kind: o.kind, points, att });
        if (o.curved === true) base.curved = true;
        if (KINDS[o.kind].label) base.text = str(o.text, 12);
      } else if (o.type === 'label') {
        let to = null;
        if (o.to && typeof o.to.obj === 'string') {
          to = 'u' in o.to ? { obj: str(o.to.obj, 12), u: num(o.to.u, 0.5), v: num(o.to.v, 0.5) } : { obj: str(o.to.obj, 12), i: Math.max(0, Math.round(num(o.to.i))), t: num(o.to.t) };
        }
        Object.assign(base, { type: 'label', text: str(o.text, 60), spec: str(o.spec, 60), x: num(o.x), y: num(o.y), to, tp: to ? null : pt(o.tp), n: num(o.n, 0) });
        if (o.leader === false) base.leader = false;
      } else return;
      if (base.id) ids.add(base.id);
      out.objects.push(base);
    });
    // Give new ids to anything without a usable one, then drop links to things that aren't there
    let next = out.objects.reduce((m, o) => Math.max(m, o.id ? parseInt(o.id.slice(1), 10) : 0), 0);
    out.objects.forEach((o) => { if (!o.id) o.id = 'o' + (++next); });
    const have = new Set(out.objects.map((o) => o.id));
    out.objects.forEach((o) => {
      if (o.att) o.att = o.att.map((a) => (a && have.has(a.obj) ? a : null));
      if (o.type === 'label' && o.to && !have.has(o.to.obj)) { o.to = null; o.tp = o.tp || [o.x - 40, o.y]; }
    });
    return out;
  }

  function loadDoc(d) {
    doc = d;
    sel = new Set();
    setTool('select');
    syncPageButtons(); render(); renderProps(); commit();
  }

  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  const today = () => new Date().toISOString().slice(0, 10);

  function saveFile() {
    if (!doc.objects.length) { setStatus('There is nothing on the page to save yet.', true); return; }
    const data = Object.assign({}, doc, { saved: new Date().toISOString() });
    download(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }), `diagram-${today()}.json`);
    setStatus(`Saved as diagram-${today()}.json (look in your Downloads folder). Open it later with "Open saved file".`);
  }

  const fileInput = document.getElementById('dm-open');
  fileInput.addEventListener('change', () => {
    const f = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!f) return;
    if (f.size > 2e6) { setStatus('That file is too big to be a saved diagram.', true); return; }
    const reader = new FileReader();
    reader.onload = () => {
      let d = null;
      try { d = cleanDoc(JSON.parse(reader.result)); } catch (err) { d = null; }
      if (!d) { setStatus('That file isn\'t a diagram saved from this page, so it can\'t be opened.', true); return; }
      const unknown = d.objects.filter((o) => o.type === 'item' && !D.byId[o.item]).length;
      loadDoc(d);
      fit();
      setStatus(`Opened ${f.name}.` + (unknown === 1 ? ' One piece of equipment this page doesn\'t have yet is shown as a grey box.'
        : unknown ? ` ${unknown} pieces of equipment this page doesn't have yet are shown as grey boxes.` : '') + ' Undo brings back what was there before.');
    };
    reader.onerror = () => setStatus('That file couldn\'t be read.', true);
    reader.readAsText(f);
  });

  function newDiagram() {
    if (doc.objects.length && !window.confirm('Start a new, blank diagram? (Undo brings this one back.)')) return;
    const page = doc.page;
    loadDoc(Object.assign(blankDoc(), { page: Object.assign(blankDoc().page, { snap: page.snap, showGrid: page.showGrid }) }));
    setStatus('New diagram started.');
  }

  // ---------------------------------------------------------------- the PNG picture
  // The page's own drawing rules (only those for the drawings), with the light-mode colours written in,
  // so the picture is black on white whatever mode the screen is in.
  const LIGHT = { '--dm-ink': '#111111', '--dm-paper': '#ffffff', '--dm-metal': '#dfe3e8', '--dm-glass': 'rgba(140, 175, 210, 0.16)', '--dm-water': '#cfe5f6', '--dm-ray': '#d32f2f', '--dm-spec': '#555555' };
  function exportCss() {
    let css = '';
    [...document.styleSheets].forEach((s) => {
      if (!s.href || !s.href.includes('diagram-maker.css')) return;
      try { [...s.cssRules].forEach((r) => { if (r.selectorText && r.selectorText.includes('.dm-art')) css += r.cssText + '\n'; }); } catch (err) { /* not readable */ }
    });
    css = css.replace(/var\((--dm-[a-z]+)\)/g, (m, v) => LIGHT[v] || m);
    return css + '.dm-hit, .dm-boxhit, .dm-linehit { display: none; }\n';
  }
  // The area the drawing covers, with the key, plus a margin
  function drawingBox() {
    const b = bbox(doc.objects), k = keyLayout();
    if (k) {
      const w = Math.max(...k.rows.map((r) => 26 + textWidth(r.text, KEY_SIZE) + (r.spec ? textWidth(' (' + r.spec + ')', SPEC_SIZE + 0.5) : 0)));
      b.x1 = Math.min(b.x1, k.x); b.x2 = Math.max(b.x2, k.x + w);
      b.y1 = Math.min(b.y1, k.y - k.rowH / 2); b.y2 = Math.max(b.y2, k.y + k.rowH * (k.rows.length - 0.5));
    }
    const m = 24;
    return { x: Math.floor(b.x1 - m), y: Math.floor(b.y1 - m), w: Math.ceil(b.x2 - b.x1 + 2 * m), h: Math.ceil(b.y2 - b.y1 + 2 * m) };
  }
  function downloadPng() {
    if (!doc.objects.length) { setStatus('Add some equipment to the page first.', true); return; }
    renderObjects();
    const box = drawingBox();
    const scale = Math.min(3, 6000 / Math.max(box.w, box.h));   // about 3 pixels per page unit: sharp when printed
    const W = Math.round(box.w * scale), H = Math.round(box.h * scale);
    const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${box.x} ${box.y} ${box.w} ${box.h}">` +
      `<style>${exportCss()}</style><rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="#ffffff"/>` +
      `<g class="dm-art">${gObjs.innerHTML}</g></svg>`;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      c.toBlob((blob) => {
        if (!blob) { setStatus('Sorry, the picture couldn\'t be made in this browser.', true); return; }
        download(blob, `diagram-${today()}.png`);
        setStatus(`Picture saved as diagram-${today()}.png (${W} × ${H} pixels). Look in your Downloads folder.`);
      }, 'image/png');
    };
    img.onerror = () => setStatus('Sorry, the picture couldn\'t be made in this browser.', true);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
  }

  app.querySelector('.dm-files').addEventListener('click', (e) => {
    const b = e.target.closest('[data-file]');
    if (!b) return;
    const f = b.dataset.file;
    if (f === 'png') downloadPng();
    else if (f === 'save') saveFile();
    else if (f === 'open') fileInput.click();
    else if (f === 'new') newDiagram();
  });

  // ---------------------------------------------------------------- start
  buildBank();
  const restored = readAutosave();
  if (restored && restored.objects.length) doc = restored;
  syncPageButtons();
  setTool('select');
  render(); renderProps(); commit();
  fit();
  if (restored && restored.objects.length) setStatus('Your last diagram has been opened again. "New diagram" starts a blank one.');
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (fitMode) fit(); }, 150);
  });
})();
