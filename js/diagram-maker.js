/* Experimental diagram maker: the editor (experimental/diagram-maker.html).
   Plan and decisions: docs/DIAGRAM_MAKER_PLAN.md. The equipment drawings are in js/diagram-items.js.

   The diagram is one object, `doc` (the same shape as the save file, plan section 8). Every change
   is made to `doc`, then the picture is redrawn from it, and the change is recorded for Undo.
   Positions are in page units (the page is 1200 × 800); the zoom only changes how big it looks. */
(function () {
  'use strict';
  const D = window.DiagramItems;
  const app = document.getElementById('dm-app');
  if (!app || !D) return;

  const PAGE_W = 1200, PAGE_H = 800, GRID = 10;
  const $ = (s) => app.querySelector(s);
  const svg = $('#dm-svg'), stage = $('#dm-stage'), props = $('#dm-props');
  const bankList = $('#dm-bank-list'), search = $('#dm-search');
  const narrow = () => window.matchMedia('(max-width: 960px)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const r2 = (v) => Math.round(v * 100) / 100;

  // ---------------------------------------------------------------- state
  let doc = blankDoc();
  let sel = new Set();          // ids of the selected objects
  let zoom = 1, fitMode = true;
  let clipboard = null, pasteCount = 0;
  let history = [], hIndex = -1;

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
  function rotPt([x, y], deg) { const c = Math.cos(rad(deg)), s = Math.sin(rad(deg)); return [x * c - y * s, x * s + y * c]; }
  function corners(o) {
    const [cx, cy] = centre(o);
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
      const [x, y] = rotPt([sx * o.w / 2, sy * o.h / 2], o.rot || 0);
      return [cx + x, cy + y];
    });
  }
  function bbox(list) {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    list.forEach((o) => corners(o).forEach(([x, y]) => { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y); }));
    return { x1, y1, x2, y2 };
  }
  function normAngle(a) { a = ((a + 180) % 360 + 360) % 360 - 180; return r2(a === -180 ? 180 : a); }

  // ---------------------------------------------------------------- drawing
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
  function renderObjects() {
    gObjs.innerHTML = doc.objects.map((o) => {
      if (o.type !== 'item') return '';
      const m = itemMarkup(o);
      return `<g data-id="${esc(o.id)}" transform="${transformOf(o)}">${m}<g class="dm-hit">${m}</g></g>`;
    }).join('');
  }

  let marquee = null;   // {x1, y1, x2, y2} while dragging a selection box
  function renderOverlay() {
    const k = 1 / zoom, hs = 10 * k;   // handles stay the same size on screen
    let s = '';
    const list = selected();
    if (list.length === 1) {
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
    } else if (list.length > 1) {
      const b = bbox(list);
      s += `<rect class="dm-selbox" x="${r2(b.x1)}" y="${r2(b.y1)}" width="${r2(b.x2 - b.x1)}" height="${r2(b.y2 - b.y1)}"/>`;
    }
    if (marquee) {
      const x = Math.min(marquee.x1, marquee.x2), y = Math.min(marquee.y1, marquee.y2);
      s += `<rect class="dm-marquee" x="${r2(x)}" y="${r2(y)}" width="${r2(Math.abs(marquee.x2 - marquee.x1))}" height="${r2(Math.abs(marquee.y2 - marquee.y1))}"/>`;
    }
    gOver.innerHTML = s;
    // Toolbar buttons that need something selected
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
  const undo = () => { if (hIndex > 0) restore(hIndex - 1); };
  const redo = () => { if (hIndex < history.length - 1) restore(hIndex + 1); };
  function updateUndo() {
    $('[data-act="undo"]').disabled = hIndex <= 0;
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

  // ---------------------------------------------------------------- adding, copying, deleting
  function addItem(itemId, cx, cy) {
    const it = D.byId[itemId];
    if (!it) return;
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
    const list = JSON.parse(clipboard);
    sel = new Set();
    list.forEach((o) => { o.id = newId(); o.x += 20 * pasteCount; o.y += 20 * pasteCount; doc.objects.push(o); sel.add(o.id); });
    render(); renderProps(); commit();
  }
  function duplicate() { copySel(); paste(); }
  function del() {
    if (!sel.size) return;
    doc.objects = doc.objects.filter((o) => !sel.has(o.id));
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
    if (list.length === 1) list[0].rot = normAngle((list[0].rot || 0) + deg);
    else {
      const b = bbox(list), gx = (b.x1 + b.x2) / 2, gy = (b.y1 + b.y2) / 2;
      list.forEach((o) => {
        const [cx, cy] = centre(o), [dx, dy] = rotPt([cx - gx, cy - gy], deg);
        o.x = r2(gx + dx - o.w / 2); o.y = r2(gy + dy - o.h / 2); o.rot = normAngle((o.rot || 0) + deg);
      });
    }
    render(); renderProps(); commit();
  }
  function flipSel() {
    const list = selected();
    if (!list.length) return;
    const b = bbox(list), gx = (b.x1 + b.x2) / 2;
    list.forEach((o) => {
      if (list.length > 1) { const [cx] = centre(o); o.x = r2(2 * gx - cx - o.w / 2); }
      o.flip = !o.flip; o.rot = normAngle(-(o.rot || 0));
    });
    render(); renderProps(); commit();
  }
  function nudge(dx, dy) {
    selected().forEach((o) => { o.x = r2(o.x + dx); o.y = r2(o.y + dy); });
    render(); renderProps(); commit();
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
    const p = toPage(e.clientX, e.clientY);
    const h = e.target.closest('[data-h]'), g = e.target.closest('[data-id]');
    if (h && sel.size === 1) {
      const o = selected()[0];
      drag = { mode: h.dataset.h === 'rot' ? 'rot' : 'size', h: h.dataset.h, o, start: { ...o }, p0: p, changed: false };
    } else if (g) {
      const id = g.dataset.id;
      if (e.shiftKey) { if (sel.has(id)) sel.delete(id); else sel.add(id); }
      else if (!sel.has(id)) sel = new Set([id]);
      const list = selected();
      drag = { mode: 'move', p0: p, starts: list.map((o) => [o, o.x, o.y]), box: list.length ? bbox(list) : null, changed: false };
      renderProps();
    } else {
      if (!e.shiftKey) sel = new Set();
      if (e.pointerType === 'touch') drag = { mode: 'pan', c0: [e.clientX, e.clientY], s0: [stage.scrollLeft, stage.scrollTop] };
      else { drag = { mode: 'marquee', keep: new Set(sel) }; marquee = { x1: p[0], y1: p[1], x2: p[0], y2: p[1] }; }
      renderProps();
    }
    renderOverlay();
    e.preventDefault();
  });

  svg.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (drag && drag.mode === 'pinch') { movePinch(); return; }
    if (!drag) return;
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
    drag.changed = true;
    if (drag.mode === 'move') {
      if (snapOn() && drag.box) {   // keep the selection's top-left corner on the grid
        dx = snapv(drag.box.x1 + dx) - drag.box.x1;
        dy = snapv(drag.box.y1 + dy) - drag.box.y1;
      }
      drag.starts.forEach(([o, x, y]) => { o.x = r2(x + dx); o.y = r2(y + dy); });
    } else if (drag.mode === 'rot') {
      const [cx, cy] = centre(drag.o);
      let a = (Math.atan2(p[1] - cy, p[0] - cx) * 180) / Math.PI + 90;
      if (!e.shiftKey) a = Math.round(a / 15) * 15;
      drag.o.rot = normAngle(a);
    } else resize(drag, p, e.shiftKey);
    render();
  });

  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (drag && drag.mode === 'pinch') { if (pointers.size === 0) drag = null; return; }
    if (!drag) return;
    const d = drag; drag = null;
    if (d.mode === 'marquee') { marquee = null; renderOverlay(); renderProps(); return; }
    if (d.changed) { renderProps(); commit(); }
  }
  svg.addEventListener('pointerup', endPointer);
  svg.addEventListener('pointercancel', endPointer);

  // Resize from a handle. Corners keep the proportions; the end handles of a stretchy item change only its length.
  function resize(d, p, free) {
    const o = d.o, s = d.start, rot = s.rot || 0, it = D.byId[o.item] || {};
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
      if (free && it.stretch === 'both') { w = Math.max(min, lx * sx); h = Math.max(min, ly * sy); }
      else {
        const k = Math.max(min / Math.min(s.w, s.h), Math.max((lx * sx) / s.w, (ly * sy) / s.h));
        w = s.w * k; h = s.h * k;
      }
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
    marquee = null;
    const [a, b] = [...pointers.values()];
    drag = { mode: 'pinch', d0: Math.hypot(a[0] - b[0], a[1] - b[1]), z0: zoom, m0: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], s0: [stage.scrollLeft, stage.scrollTop] };
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
    return `<button type="button" class="dm-tile" data-item="${it.id}" title="${esc(it.name)}">` +
      `<svg class="dm-art" viewBox="${-pad} ${-pad} ${t.w + 2 * pad} ${t.h + 2 * pad}" aria-hidden="true">${D.markup(it, t.w, t.h)}</svg>` +
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
      props.innerHTML = '<h2>Settings</h2><p class="dm-tip">Nothing is selected. Click (or tap) something on the page to change it, or drag on empty paper to select several things.</p>' +
        '<p class="dm-tip">Add equipment from the list on the left' + (narrow() ? ' (the Equipment button)' : '') + '.</p>';
      return;
    }
    if (list.length > 1) {
      props.innerHTML = `<h2>${list.length} things selected</h2><p class="dm-tip">Drag any of them to move them together. The toolbar turns, flips, copies or deletes them all at once. Shift-click adds or removes one.</p>`;
      return;
    }
    const o = list[0], it = D.byId[o.item];
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

  function propInput(e, done) {
    const el = e.target, o = selected()[0];
    if (!o || sel.size !== 1) return;
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
    if (e.target.dataset.k !== 'natural') return;
    const o = selected()[0], it = o && D.byId[o.item];
    if (!it) return;
    const [cx, cy] = centre(o);
    o.w = it.w; o.h = it.h; o.x = r2(cx - it.w / 2); o.y = r2(cy - it.h / 2);
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
    else if (ctrl && k === 'a') { sel = new Set(doc.objects.map((o) => o.id)); renderOverlay(); renderProps(); }
    else if ((k === 'delete' || k === 'backspace') && sel.size) del();
    else if (k === 'escape') { sel = new Set(); renderOverlay(); renderProps(); setDrawer(null); }
    else if (k.startsWith('arrow') && sel.size) {
      const step = e.shiftKey ? GRID : 1;
      nudge(k === 'arrowleft' ? -step : k === 'arrowright' ? step : 0, k === 'arrowup' ? -step : k === 'arrowdown' ? step : 0);
    } else used = false;
    if (used) e.preventDefault();
  });

  // ---------------------------------------------------------------- start
  buildBank();
  syncPageButtons();
  render(); renderProps(); commit();
  fit();
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (fitMode) fit(); }, 150);
  });
})();
