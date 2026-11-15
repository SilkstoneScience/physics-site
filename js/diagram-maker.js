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
  const SELECT_HINT = 'Drag equipment onto the page, then choose a line tool above to join things up.';

  // ---------------------------------------------------------------- state
  let doc = blankDoc();
  let sel = new Set();          // ids of the selected objects
  let zoom = 1, fitMode = true;
  let clipboard = null, pasteCount = 0;
  let history = [], hIndex = -1;
  let tool = 'select';          // or a line kind
  let drawing = null;           // the line being drawn: { points, att }
  let hover = null;             // { p, att } where the next point would go

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
  const shapePts = (o) => (o.type === 'line' ? o.points : corners(o));
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

  function renderObjects() {
    followAttachments();
    gObjs.innerHTML = doc.objects.map((o) => {
      if (o.type === 'item') {
        const m = itemMarkup(o);
        return `<g data-id="${esc(o.id)}" transform="${transformOf(o)}">${m}<g class="dm-hit">${m}</g></g>`;
      }
      if (o.type === 'line') {
        return `<g data-id="${esc(o.id)}">${lineMarkup(o)}<path class="dm-linehit" d="${pathD(o.points, o.curved && KINDS[o.kind].curve)}"/></g>`;
      }
      return '';
    }).join('') + junctionDots();
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
    } else if (list.length > 1) {
      const b = bbox(list);
      s += `<rect class="dm-selbox" x="${r2(b.x1 - 4)}" y="${r2(b.y1 - 4)}" width="${r2(b.x2 - b.x1 + 8)}" height="${r2(b.y2 - b.y1 + 8)}"/>`;
    }
    if (tool !== 'select') {
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
  }
  function restore(i) {
    hIndex = i;
    doc = JSON.parse(history[i]);
    sel = new Set([...sel].filter((id) => byId(id)));
    syncPageButtons(); render(); renderProps(); updateUndo();
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
  function shift(o, dx, dy) {
    if (o.type === 'line') o.points = o.points.map(([x, y]) => [r2(x + dx), r2(y + dy)]);
    else { o.x = r2(o.x + dx); o.y = r2(o.y + dy); }
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
      shift(o, 20 * pasteCount, 20 * pasteCount);
      if (o.att) o.att = o.att.map((a) => (a && ids[a.obj] ? { obj: ids[a.obj], anchor: a.anchor } : null));   // stays attached only to copies
    });
    render(); renderProps(); commit();
  }
  function duplicate() { copySel(); paste(); }
  function del() {
    if (!sel.size) return;
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
      if (list.length > 1) { const [cx] = centre(o); o.x = r2(2 * gx - cx - o.w / 2); }
      o.flip = !o.flip; o.rot = normAngle(-(o.rot || 0));
    });
    render(); renderProps(); commit();
  }
  function nudge(dx, dy) {
    const list = selected();
    detachFromUnselected(list);
    list.forEach((o) => shift(o, dx, dy));
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
    hover = null;
    app.querySelectorAll('[data-tool]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === t)));
    app.classList.toggle('dm-drawmode', t !== 'select');
    setHint(t === 'select' ? SELECT_HINT : KINDS[t].hint);
    if (t !== 'select') sel = new Set();
    renderOverlay(); renderProps(); updateFinish();
  }
  function updateFinish() {
    $('[data-act="finish"]').hidden = !(drawing && drawing.points.length > 1 && !KINDS[tool].two);
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
    if (tool !== 'select') { drawClick(e); drag = { mode: 'drawing' }; return; }
    const p = toPage(e.clientX, e.clientY);
    const h = e.target.closest('[data-h]'), pt = e.target.closest('[data-pt]'), g = e.target.closest('[data-id]');
    if (pt && sel.size === 1) {
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
    if (tool !== 'select' && pointers.size < 2) {   // show where the next point of a line would go
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
        dx = snapv(drag.box.x1 + dx) - drag.box.x1;
        dy = snapv(drag.box.y1 + dy) - drag.box.y1;
      }
      drag.starts.forEach(([o, s]) => {
        if (o.type === 'line') o.points = s.points.map(([x, y]) => [r2(x + dx), r2(y + dy)]);
        else { o.x = r2(s.x + dx); o.y = r2(s.y + dy); }
      });
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
        ? `<p class="dm-tip">${esc(KINDS[tool].hint)}</p><p class="dm-tip">Press Esc, or the Select tool, when you have finished drawing lines.</p>`
        : '<p class="dm-tip">Nothing is selected. Click (or tap) something on the page to change it, or drag on empty paper to select several things.</p>' +
          '<p class="dm-tip">Add equipment from the list on the left' + (narrow() ? ' (the Equipment button)' : '') + ', and join it up with the line tools above the page.</p>');
      return;
    }
    if (list.length > 1) {
      props.innerHTML = `<h2>${list.length} things selected</h2><p class="dm-tip">Drag any of them to move them together. The toolbar turns, flips, copies or deletes them all at once. Shift-click adds or removes one.</p>`;
      return;
    }
    const o = list[0];
    if (o.type === 'line') { props.innerHTML = lineProps(o); return; }
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

  function propInput(e, done) {
    const el = e.target, o = selected()[0];
    if (!o || sel.size !== 1) return;
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
    const k = e.target.dataset.k, lk = e.target.dataset.l, o = selected()[0];
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

  // ---------------------------------------------------------------- start
  buildBank();
  syncPageButtons();
  setTool('select');
  render(); renderProps(); commit();
  fit();
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (fitMode) fit(); }, 150);
  });
})();
