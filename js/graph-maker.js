// The graph maker (experimental/graph-maker.html). Plan and save-file format: docs/GRAPH_MAKER_PLAN.md.
// The maths is in js/graph-maker-core.js (window.GraphCore). Everything is kept in this browser only.
(() => {
  const root = document.getElementById('graph-maker');
  if (!root || !window.GraphCore) return;
  const C = window.GraphCore;
  root.hidden = false;

  const STORE = 'graphMaker.v1';
  const FORMAT = 'dp-physics-graph-maker';
  const esc = (v) => String(v === undefined || v === null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const uid = (p) => p + Math.random().toString(36).slice(2, 8);
  const $ = (sel, el = root) => el.querySelector(sel);
  const $$ = (sel, el = root) => [...el.querySelectorAll(sel)];

  // Each data set differs in colour AND marker AND line style, so a graph printed in greyscale still works.
  // Colours: --gm-set1 … --gm-set5 in css/graph-maker.css (lighter in dark mode on screen; the downloaded picture is always light).
  const STYLES = [
    { marker: 'circle', dash: [] },
    { marker: 'square', dash: [8, 5] },
    { marker: 'up', dash: [2, 4] },
    { marker: 'diamond', dash: [10, 4, 2, 4] },
    { marker: 'down', dash: [16, 6] },
  ];

  // ----- The state (saved in localStorage and in the save file) -----
  // Column kinds: 'raw' (typed values), 'trials' (repeated readings: cells are lists, `trials` long),
  // 'mean' (the mean of the trials column `of`, stored in each row's `mean` only when the student presses the button),
  // 'formula' (worked out from `formula`, with its uncertainty from `uncFormula`; degrees unless `radians`).
  const blankColumn = (heading = '') => ({ id: uid('c'), heading, sym: '', symAuto: true, noUnit: false, kind: 'raw', unc: '', uncSf: 1, rowUnc: false });
  const blankRow = () => ({ id: uid('r'), use: true, cells: {}, unc: {}, mean: {} });
  const trialsOf = (r, c) => { const a = r.cells[c.id]; return Array.from({ length: c.trials }, (_, k) => (Array.isArray(a) ? String(a[k] === undefined || a[k] === null ? '' : a[k]) : k === 0 && a !== undefined ? String(a) : '')); };
  function blankState() {
    const cols = [blankColumn(), blankColumn()];
    return {
      title: '',
      columns: cols,
      sets: [{ id: uid('s'), name: 'Set 1', rows: Array.from({ length: 5 }, blankRow) }],
      graph: { x: cols[0].id, y: cols[1].id, xLabel: '', yLabel: '', grid: true, zero: true, fit: 'linear', lines: {}, showLines: true },
      ui: { set: 0 },
    };
  }
  let S = load() || blankState();
  const set = () => S.sets[Math.min(S.ui.set || 0, S.sets.length - 1)];
  const col = (id) => S.columns.find((c) => c.id === id);

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE));
      return saved && saved.format === FORMAT ? tidyState(saved.state) : null;
    } catch (e) { return null; }
  }
  // Fill in anything missing (older or hand-edited files), so the rest of the code can rely on it.
  function tidyState(st) {
    if (!st || !Array.isArray(st.columns) || !Array.isArray(st.sets) || !st.sets.length) return null;
    const b = blankState();
    st.title = String(st.title || '');
    st.columns = st.columns.map((c) => {
      const k = { ...blankColumn(), ...c, id: String(c.id || uid('c')) };
      if (!['raw', 'trials', 'mean', 'formula'].includes(k.kind)) k.kind = 'raw';
      if (k.kind === 'trials') { k.trials = Math.max(2, Math.min(10, Math.round(Number(k.trials) || 3))); k.rowUnc = false; }
      if (k.kind === 'formula') { k.formula = String(k.formula || ''); k.uncFormula = String(k.uncFormula || ''); k.radians = !!k.radians; }
      if (k.kind === 'mean' || k.kind === 'formula') k.rowUnc = false;
      return k;
    });
    st.sets = st.sets.slice(0, 5).map((s, i) => ({
      id: String(s.id || uid('s')), name: String(s.name || `Set ${i + 1}`),
      rows: (Array.isArray(s.rows) && s.rows.length ? s.rows : [blankRow()]).map((r) => {
        const row = { ...blankRow(), ...r, cells: { ...(r.cells || {}) }, unc: { ...(r.unc || {}) }, mean: { ...(r.mean || {}) } };
        for (const c of st.columns) if (c.kind === 'trials') row.cells[c.id] = trialsOf(row, c);
        return row;
      }),
    }));
    st.graph = { ...b.graph, ...(st.graph || {}) };
    st.ui = { set: 0, ...(st.ui || {}) };
    return st;
  }

  // Saving: shortly after every change, so typing stays smooth.
  let saveTimer = null;
  const status = $('.gm-status');
  const savedNote = $('.gm-saved');
  function changed() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE, JSON.stringify({ format: FORMAT, version: 1, saved: new Date().toISOString(), state: S }));
        savedNote.textContent = `Saved in this browser at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
      } catch (e) {
        savedNote.textContent = 'This browser is not letting the page save your work: use Save progress to keep a file.';
      }
    }, 400);
    scheduleNotes();
    scheduleGraph();
  }

  // Undo for the bigger changes (deleting, pasting, loading a file)
  const undoStack = [];
  const undoBtn = $('[data-act="undo"]');
  function remember(what) {
    undoStack.push({ what, json: JSON.stringify(S) });
    if (undoStack.length > 20) undoStack.shift();
    undoBtn.disabled = false;
    undoBtn.textContent = `Undo ${what}`;
  }
  function undo() {
    const last = undoStack.pop();
    if (!last) return;
    S = tidyState(JSON.parse(last.json));
    const prev = undoStack[undoStack.length - 1];
    undoBtn.disabled = !prev;
    undoBtn.textContent = prev ? `Undo ${prev.what}` : 'Undo';
    renderAll(); changed();
  }

  // ----- Columns: what the heading says -----
  function info(c) {
    const h = C.parseHeading(c.heading);
    const sym = c.symAuto ? C.suggestSym(h.sym) : c.sym;
    return { ...h, symbol: sym, unitText: h.unit ? C.pretty(h.unit) : '', label: C.pretty(c.heading) };
  }
  function syncSymbols() {
    for (const c of S.columns) if (c.symAuto) c.sym = info(c).symbol;
  }

  // ----- Part 1: the table -----
  const wrap = $('.gm-table-wrap');
  // The cells a student types in, in order, as "slots" (used for typing, Enter and pasting): [{ c, k }] with
  // k = 'v' (value), 'u' (this row's own uncertainty) or a number (one trial of a trials column).
  // Mean and formula columns have no slots: their cells are worked out.
  function slots() {
    const out = [];
    for (const c of S.columns) {
      if (c.kind === 'trials') for (let k = 0; k < c.trials; k++) out.push({ c, k });
      else if (c.kind === 'raw') { out.push({ c, k: 'v' }); if (c.rowUnc) out.push({ c, k: 'u' }); }
    }
    return out;
  }
  function getSlot(r, s) {
    if (s.k === 'u') return r.unc[s.c.id];
    if (typeof s.k === 'number') return trialsOf(r, s.c)[s.k];
    return r.cells[s.c.id];
  }
  function setSlot(r, s, v) {
    if (s.k === 'u') r.unc[s.c.id] = v;
    else if (typeof s.k === 'number') { const a = trialsOf(r, s.c); a[s.k] = v; r.cells[s.c.id] = a; }
    else r.cells[s.c.id] = v;
  }
  const calculated = (c) => c.kind === 'mean' || c.kind === 'formula';
  function colspan(c) { return c.kind === 'trials' ? c.trials : c.rowUnc ? 2 : 1; }
  function renderTable() {
    syncSymbols();
    const sl = slots();
    const head = S.columns.map((c, j) => {
      const inf = info(c);
      const symBox = `<label title="The symbol formulas use for this column">symbol <input class="gm-sym" data-sym="${c.id}" value="${esc(c.sym)}" placeholder="L" aria-label="Symbol for column ${j + 1}" autocomplete="off" spellcheck="false"></label>`;
      const uncBox = (what) => `<label title="${what}">± <input class="gm-unc" data-unc="${c.id}" value="${esc(c.unc)}" placeholder="0.001 or 2%" inputmode="decimal" aria-label="${what}, column ${j + 1}${inf.unitText ? ', in ' + esc(inf.unitText) : ''}" autocomplete="off"></label>`;
      const meta = c.kind === 'trials' ? `<span class="gm-kind">${c.trials} trials</span>${uncBox('The reading uncertainty of each trial')}`
        : c.kind === 'mean' ? `${symBox}<span class="gm-kind" title="The larger of half the range and the reading uncertainty">± half range</span>`
          : c.kind === 'formula' ? `${symBox}<a class="gm-kind" href="#calc-${c.id}" title="Edit its formula in part 2">= formula</a>`
            : `${symBox}${uncBox('The uncertainty of every value in this column')}`;
      const opts = [
        c.kind === 'raw' ? `<label class="vlab-check"><input type="checkbox" data-opt="rowUnc" data-col="${c.id}" ${c.rowUnc ? 'checked' : ''}> A different uncertainty for some rows</label>` : '',
        c.kind === 'raw' ? `<button type="button" class="link-btn" data-totrials="${c.id}">Make this a column of repeated trials</button>` : '',
        c.kind === 'trials' ? `<label class="gm-menu-num">Number of trials <input type="number" min="2" max="10" data-ntrials="${c.id}" value="${c.trials}"></label>
          <button type="button" class="link-btn" data-toraw="${c.id}">Make it a single column again</button>` : '',
        `<label class="vlab-check"><input type="checkbox" data-opt="uncSf" data-col="${c.id}" ${c.uncSf === 2 ? 'checked' : ''}> Round its uncertainty to 2 s.f.</label>`,
        `<label class="vlab-check"><input type="checkbox" data-opt="noUnit" data-col="${c.id}" ${c.noUnit ? 'checked' : ''}> This quantity has no unit</label>`,
      ].join('');
      return `<th scope="col" colspan="${colspan(c)}" class="gm-th${calculated(c) ? ' gm-th-calc' : ''}">
        <input class="gm-head" data-head="${c.id}" value="${esc(c.heading)}" placeholder="${c.kind === 'formula' ? 'e.g. period squared T^2 / s^2' : 'e.g. length L / m'}" aria-label="Heading of column ${j + 1}" autocomplete="off">
        <div class="gm-colmeta">${meta}
          <details class="gm-menu"><summary aria-label="More options for column ${j + 1}">⋯</summary>
            <div class="gm-menu-list">${opts}
              <div class="gm-menu-btns">
                <button type="button" class="link-btn" data-move="-1" data-col="${c.id}" ${j === 0 ? 'disabled' : ''}>← Move left</button>
                <button type="button" class="link-btn" data-move="1" data-col="${c.id}" ${j === S.columns.length - 1 ? 'disabled' : ''}>Move right →</button>
                <button type="button" class="link-btn gm-danger" data-delcol="${c.id}">Delete this column</button>
              </div>
            </div>
          </details>
        </div>
      </th>`;
    }).join('');
    const needSub = S.columns.some((c) => c.rowUnc || c.kind === 'trials');
    const sub = needSub ? `<tr class="gm-subhead"><th></th>${S.columns.map((c) => (c.kind === 'trials' ? Array.from({ length: c.trials }, (_, k) => `<th>trial ${k + 1}</th>`).join('')
      : c.rowUnc ? '<th>value</th><th>± this row</th>' : '<th></th>')).join('')}<th></th><th></th></tr>` : '';
    const body = set().rows.map((r, i) => {
      let k = 0;
      const cells = S.columns.map((c) => {
        if (calculated(c)) return `<td class="gm-calc" data-calc="${c.id}" data-calc-row="${r.id}"></td>`;
        const mine = sl.filter((s) => s.c === c);
        return mine.map((s) => {
          const inf = info(c);
          const isU = s.k === 'u';
          const label = `Row ${i + 1}, ${inf.name || inf.symbol || 'column ' + (S.columns.indexOf(c) + 1)}${isU ? ', uncertainty' : typeof s.k === 'number' ? `, trial ${s.k + 1}` : ''}`;
          return `<td${isU ? ' class="gm-ucell"' : ''}><input data-r="${r.id}" data-c="${c.id}" data-k="${s.k}" data-slot="${k++}" value="${esc(getSlot(r, s))}" ${isU ? `placeholder="${esc(c.unc || '±')}"` : ''} inputmode="decimal" aria-label="${esc(label)}" autocomplete="off"></td>`;
        }).join('');
      }).join('');
      return `<tr data-row="${r.id}"><th scope="row" class="gm-rowno">${i + 1}</th>${cells}<td class="gm-use"><input type="checkbox" data-use="${r.id}" ${r.use ? 'checked' : ''} aria-label="Use row ${i + 1} in the fit"></td><td class="gm-rowdel"><button type="button" class="vlab-del" data-delrow="${r.id}" aria-label="Remove row ${i + 1}">×</button></td></tr>`;
    }).join('');
    wrap.innerHTML = `<table class="gm-table"><thead><tr><th class="gm-rowno" aria-label="Row number"></th>${head}<th class="gm-use" title="Untick a row (or tap its point on the graph) to leave it out of the fit">In fit</th><th aria-label="Remove a row"></th></tr>${sub}</thead><tbody>${body}</tbody></table>`;
    renderSets();
    refreshComputed();
  }
  // The worked-out cells (means and formulas): each value rounded to its uncertainty, with the uncertainty under it.
  function refreshComputed() {
    $$('td[data-calc]', wrap).forEach((td) => {
      const c = col(td.dataset.calc); const r = set().rows.find((x) => x.id === td.dataset.calcRow);
      if (!c || !r) return;
      const R = valueOf(r, c);
      td.classList.toggle('gm-stale', !!R.stale);
      if (!isFinite(R.v)) { td.innerHTML = R.err && R.err !== 'empty' ? '<span class="gm-small" title="See part 2">–</span>' : ''; return; }
      const p = R.u > 0 ? C.roundPair(R.v, R.u, c.uncSf) : null;
      const e = p && p.exp ? ` × 10${C.sup(p.exp)}` : '';
      td.innerHTML = p ? `${p.v}${e}<span class="gm-pm">± ${p.u}${e}</span>` : `${C.sig(R.v, 4)}`;
      td.title = R.stale ? 'Out of date: the trial readings have changed since the mean was calculated. Press Recalculate in part 2.' : '';
    });
  }

  // ----- Data sets (up to 5): the same columns, each with its own rows and name -----
  const setsEl = $('.gm-sets');
  function renderSets() {
    const cur = S.sets.indexOf(set());
    setsEl.innerHTML = `<div class="gm-tabs" role="tablist" aria-label="Data sets">${S.sets.map((s, i) => `<button type="button" role="tab" class="gm-tab" data-set="${i}" aria-selected="${i === cur}">${markerSvg(i)} ${esc(s.name || `Set ${i + 1}`)}</button>`).join('')}
      <button type="button" class="link-btn gm-addset" data-act="add-set" ${S.sets.length >= 5 ? 'disabled' : ''}>+ Add a data set</button></div>
      ${S.sets.length > 1 ? `<div class="gm-setname"><label>Name of this set (for the legend) <input data-setname value="${esc(set().name)}" autocomplete="off"></label>
        <button type="button" class="link-btn gm-danger" data-act="del-set">Delete this set</button></div>` : ''}`;
  }
  setsEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.set !== undefined) { S.ui.set = Number(b.dataset.set); renderTable(); changed(); }
    else if (b.dataset.act === 'add-set') {
      if (S.sets.length >= 5) return;
      remember('adding a data set');
      S.sets.push({ id: uid('s'), name: `Set ${S.sets.length + 1}`, rows: Array.from({ length: Math.max(3, set().rows.length) }, blankRow) });
      S.ui.set = S.sets.length - 1;
      renderTable(); changed();
      say(`Set ${S.sets.length} added: it has the same columns, so type or paste its readings. Give it a name for the legend.`);
      const n = $('[data-setname]'); if (n) { n.focus(); n.select(); }
    } else if (b.dataset.act === 'del-set') {
      if (S.sets.length <= 1 || !confirm(`Delete "${set().name}" and all its readings?`)) return;
      remember('deleting a data set');
      const gone = S.sets.splice(S.sets.indexOf(set()), 1)[0];
      delete S.graph.lines[gone.id];
      S.ui.set = Math.max(0, S.ui.set - 1);
      renderTable(); changed();
    }
  });
  setsEl.addEventListener('input', (e) => {
    if (e.target.dataset.setname === undefined) return;
    set().name = e.target.value;
    const tab = $(`.gm-tab[data-set="${S.sets.indexOf(set())}"]`);
    if (tab) tab.innerHTML = `${markerSvg(S.sets.indexOf(set()))} ${esc(set().name || `Set ${S.sets.indexOf(set()) + 1}`)}`;
    changed();
  });
  // A small picture of a set's marker and line, in its colour (for the tabs)
  function markerSvg(i) {
    const st = STYLES[i];
    const pts = { circle: '<circle cx="12" cy="7" r="3.6"/>', square: '<rect x="8.6" y="3.6" width="6.8" height="6.8"/>', up: '<path d="M12 3 L16 10.4 L8 10.4Z"/>', diamond: '<path d="M12 2.6 L16.4 7 L12 11.4 L7.6 7Z"/>', down: '<path d="M12 11 L16 3.6 L8 3.6Z"/>' }[st.marker];
    return `<svg class="gm-swatch" viewBox="0 0 24 14" width="24" height="14" aria-hidden="true" style="color:var(--gm-set${i + 1})"><line x1="0" y1="7" x2="24" y2="7" stroke="currentColor" stroke-width="1.6" stroke-dasharray="${st.dash.join(' ')}"/><g fill="currentColor">${pts}</g></svg>`;
  }

  // Typing in the table
  wrap.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.head) {
      const c = col(el.dataset.head); c.heading = el.value;
      if (c.symAuto) { c.sym = info(c).symbol; const s = $(`[data-sym="${c.id}"]`, wrap); if (s) s.value = c.sym; }
      syncCard(c);
    } else if (el.dataset.sym) {
      const c = col(el.dataset.sym); c.sym = el.value.trim(); c.symAuto = !c.sym;
      if (c.symAuto) c.sym = info(c).symbol;
      syncCard(c);
    } else if (el.dataset.unc) {
      col(el.dataset.unc).unc = el.value;
      $$(`.gm-ucell input[data-c="${el.dataset.unc}"]`).forEach((x) => { x.placeholder = el.value || '±'; });
    } else if (el.dataset.r) {
      const r = set().rows.find((x) => x.id === el.dataset.r);
      if (!r) return;
      setSlot(r, { c: col(el.dataset.c), k: /^\d+$/.test(el.dataset.k) ? Number(el.dataset.k) : el.dataset.k }, el.value);
    } else if (el.dataset.ntrials) {
      const n = Math.round(Number(el.value));
      if (!(n >= 2 && n <= 10)) return;
      const c = col(el.dataset.ntrials);
      c.trials = n;
      for (const s of S.sets) for (const r of s.rows) r.cells[c.id] = trialsOf(r, c);
      renderTable(); renderProcess();
      const box = $(`[data-ntrials="${c.id}"]`, wrap); if (box) { box.closest('details').open = true; box.focus(); }
    } else if (el.dataset.use) {
      const r = set().rows.find((x) => x.id === el.dataset.use);
      if (r) r.use = el.checked;
    } else if (el.dataset.opt) {
      const c = col(el.dataset.col);
      if (el.dataset.opt === 'uncSf') c.uncSf = el.checked ? 2 : 1;
      else c[el.dataset.opt] = el.checked;
      if (el.dataset.opt === 'rowUnc') { renderTable(); const d = $(`[data-opt="rowUnc"][data-col="${c.id}"]`); if (d) { d.closest('details').open = true; d.focus(); } }
    } else return;
    changed();
  });
  wrap.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.delrow) {
      const rows = set().rows;
      const i = rows.findIndex((r) => r.id === b.dataset.delrow);
      if (i < 0) return;
      remember('removing a row');
      rows.splice(i, 1);
      if (!rows.length) rows.push(blankRow());
      renderTable(); changed();
      const next = $(`tbody tr:nth-child(${Math.min(i + 1, rows.length)}) input`, wrap);
      if (next) next.focus();
    } else if (b.dataset.delcol) {
      deleteColumn(col(b.dataset.delcol));
    } else if (b.dataset.totrials) {
      const c = col(b.dataset.totrials);
      remember('making a trials column');
      c.kind = 'trials'; c.trials = 3; c.rowUnc = false;
      for (const s of S.sets) for (const r of s.rows) { r.cells[c.id] = trialsOf(r, c); delete r.unc[c.id]; }
      renderTable(); renderProcess(); changed();
      say('Type each trial in its own cell. Then press "Calculate the mean and uncertainty" in part 2.');
    } else if (b.dataset.toraw) {
      const c = col(b.dataset.toraw);
      const lost = S.sets.some((s) => s.rows.some((r) => trialsOf(r, c).slice(1).some((v) => v.trim())));
      if (lost && !confirm('Keep only trial 1 and remove the other trials?')) return;
      remember('making a single column');
      for (const s of S.sets) for (const r of s.rows) r.cells[c.id] = trialsOf(r, c)[0];
      c.kind = 'raw'; delete c.trials;
      renderTable(); renderProcess(); changed();
    } else if (b.dataset.move) {
      const i = S.columns.findIndex((x) => x.id === b.dataset.col);
      const j = i + Number(b.dataset.move);
      if (j < 0 || j >= S.columns.length) return;
      [S.columns[i], S.columns[j]] = [S.columns[j], S.columns[i]];
      renderTable(); changed();
      const m = $(`[data-move="${b.dataset.move}"][data-col="${b.dataset.col}"]`);
      if (m && !m.disabled) { m.closest('details').open = true; m.focus(); }
    }
  });
  function deleteColumn(c) {
    if (!c) return;
    if (S.columns.length <= 1) { say('A table needs at least one column.'); return; }
    remember('deleting a column');
    S.columns = S.columns.filter((x) => x !== c);
    for (const s of S.sets) for (const r of s.rows) { delete r.cells[c.id]; delete r.unc[c.id]; delete r.mean[c.id]; }
    renderTable(); renderProcess(); changed();
    say(`Column "${c.heading || 'without a heading'}" deleted. (Undo brings it back.)`);
  }
  // Column menus: placed on the screen next to their ⋯ button (fixed, so the table's scrolling box can't clip them),
  // one open at a time, closed by clicking elsewhere, scrolling or Escape.
  function placeMenu(d) {
    const list = $('.gm-menu-list', d); const b = $('summary', d).getBoundingClientRect();
    const w = Math.min(256, innerWidth - 16);
    list.style.width = w + 'px';
    list.style.left = Math.max(8, Math.min(b.right - w, innerWidth - w - 8)) + 'px';
    const below = b.bottom + 4; const h = list.offsetHeight;
    list.style.top = (below + h > innerHeight - 8 && b.top - h - 4 > 8 ? b.top - h - 4 : below) + 'px';
  }
  wrap.addEventListener('toggle', (e) => {
    const d = e.target;
    if (!d.classList || !d.classList.contains('gm-menu') || !d.open) return;
    $$('.gm-menu[open]').forEach((x) => { if (x !== d) x.open = false; });
    placeMenu(d);
  }, true);
  const closeMenus = () => $$('.gm-menu[open]').forEach((d) => { d.open = false; });
  document.addEventListener('click', (e) => { $$('.gm-menu[open]').forEach((d) => { if (!d.contains(e.target)) d.open = false; }); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('.gm-menu[open]')) { const s = $('.gm-menu[open] summary'); closeMenus(); s.focus(); } });
  addEventListener('scroll', (e) => { if (!$('.gm-menu[open]')) return; if (e.target === document || e.target === wrap) closeMenus(); }, true);
  addEventListener('resize', closeMenus);

  // Enter and the up/down arrows move between rows, as in a spreadsheet; Enter on the last row adds a row.
  wrap.addEventListener('keydown', (e) => {
    const el = e.target;
    if (!el.dataset.r || !['Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const rows = set().rows;
    const i = rows.findIndex((r) => r.id === el.dataset.r);
    const down = e.key !== 'ArrowUp';
    let j = i + (down ? 1 : -1);
    if (j < 0) return;
    e.preventDefault();
    if (j >= rows.length) {
      if (e.key !== 'Enter') return;
      rows.push(blankRow()); renderTable(); changed();
    }
    const next = $(`tr[data-row="${rows[j].id}"] input[data-slot="${el.dataset.slot}"]`, wrap);
    if (next) { next.focus(); next.select(); }
  });

  // ----- Pasting from a spreadsheet -----
  // Cells are separated by tabs (Excel, Google Sheets) or, failing that, by commas or semicolons; rows by new lines.
  function splitGrid(text) {
    const lines = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '').split('\n');
    const delim = lines.some((l) => l.includes('\t')) ? '\t' : lines.every((l) => l.includes(';')) ? ';' : lines.every((l) => l.includes(',')) && lines.length > 1 ? ',' : null;
    return lines.map((l) => (delim ? splitLine(l, delim) : [l]).map((v) => v.trim()));
  }
  function splitLine(line, delim) { // handles "quoted, cells"
    const out = []; let cur = ''; let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === delim) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  }
  const isHeadingLine = (cells) => cells.some((v) => v && !C.readNumber(v) && !/^±?\s*[\d.,]+\s*%?$/.test(v));
  // Fill the table with a grid of text, starting at a row and a slot. Adds rows and columns as needed.
  function fillGrid(grid, rowIndex, slotIndex, headings) {
    if (headings) {
      const hs = grid.shift();
      while (slots().length < slotIndex + hs.length) S.columns.push(blankColumn());
      const sl = slots();
      hs.forEach((h, k) => { const s = sl[slotIndex + k]; if (s && (s.k === 'v' || s.k === 0) && h) { s.c.heading = h; s.c.symAuto = true; } });
    }
    const width = Math.max(0, ...grid.map((r) => r.length));
    while (slots().length < slotIndex + width) S.columns.push(blankColumn());
    const sl = slots();
    const rows = set().rows;
    grid.forEach((cells, i) => {
      const at = rowIndex + i;
      while (rows.length <= at) rows.push(blankRow());
      cells.forEach((v, k) => {
        const s = sl[slotIndex + k];
        if (!s) return;
        setSlot(rows[at], s, v.replace(/^(-?\d+),(\d+)$/, '$1.$2'));
      });
    });
  }
  wrap.addEventListener('paste', (e) => {
    const el = e.target;
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!text || (!/[\t\n]/.test(text.replace(/\n$/, '')))) return; // a single value: let the browser paste it
    e.preventDefault();
    const grid = splitGrid(text);
    remember('pasting');
    if (el.dataset.head) { // pasted into a heading: the first line is headings, the rest is data from the first row
      const slot = slots().findIndex((s) => s.c.id === el.dataset.head && s.k === 'v');
      fillGrid(grid, 0, slot, true);
    } else if (el.dataset.r) {
      const i = set().rows.findIndex((r) => r.id === el.dataset.r);
      fillGrid(grid, i, Number(el.dataset.slot), isHeadingLine(grid[0]) && i === 0);
    } else return;
    renderTable(); renderProcess(); changed();
    say(`Pasted ${grid.length} row${grid.length === 1 ? '' : 's'}.`);
  });

  // ----- Uploading a CSV file -----
  $('[data-act="csv"]').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2e6) { say('That file is too big for a data table (over 2 MB).'); return; }
    const text = (await file.text()).replace(/^﻿/, '');
    const grid = splitGrid(text).filter((r) => r.some((v) => v));
    if (!grid.length) { say('That file looks empty.'); return; }
    const hasData = set().rows.some((r) => Object.values(r.cells).some((v) => String(v).trim()));
    if (hasData && !confirm(`Replace the data in "${set().name}" with the data in ${file.name}?`)) return;
    remember('uploading a file');
    const headings = isHeadingLine(grid[0]);
    const width = Math.max(...grid.map((r) => r.length));
    // the file fills the typed columns from the left (keeping their uncertainties); the file's headings replace theirs
    if (S.sets.length === 1) {
      const typed = S.columns.filter((c) => !calculated(c));
      S.columns = S.columns.filter((c) => calculated(c) || typed.indexOf(c) < Math.max(1, width));
    }
    set().rows = [];
    fillGrid(grid, 0, 0, headings);
    renderTable(); renderProcess(); changed();
    say(`Loaded ${grid.length - (headings ? 1 : 0)} rows from ${file.name}.${headings ? '' : ' The file had no headings: type them in.'}`);
  });

  // ----- Buttons above the table -----
  $('[data-act="add-row"]').addEventListener('click', () => {
    set().rows.push(blankRow()); renderTable(); changed();
    const last = $('tbody tr:last-child input', wrap); if (last) last.focus();
  });
  $('[data-act="add-col"]').addEventListener('click', () => {
    if (S.columns.length >= 12) { say('That is a lot of columns: delete one you don\'t need first.'); return; }
    const c = blankColumn(); S.columns.push(c); renderTable(); changed();
    const h = $(`[data-head="${c.id}"]`); if (h) h.focus();
  });
  undoBtn.addEventListener('click', undo);
  $('[data-act="new"]').addEventListener('click', () => {
    if (!confirm('Start a new graph? This clears the table and the graph in this browser. (Undo can bring it back while this page is open.)')) return;
    remember('starting again');
    S = blankState(); renderAll(); changed();
  });
  $('[data-act="example"]').addEventListener('click', () => {
    const hasData = S.sets.some((s) => s.rows.some((r) => Object.values(r.cells).some((v) => String(v).trim())));
    if (hasData && !confirm('Replace your data with the example? (Undo can bring yours back while this page is open.)')) return;
    remember('loading the example');
    S = example(); renderAll(); changed();
    say('Example loaded: a pendulum experiment with made-up readings. Its means have already been calculated; look at part 2 to see how T and T² are worked out.');
  });
  // A made-up pendulum experiment, for trying the tool out: three trials of 10 swings at each length, their means
  // (as if the button had been pressed), then T = t/10 and T² with their uncertainty formulas, as on the IA page.
  function example() {
    const st = blankState();
    const L = { ...blankColumn('length L / m'), unc: '0.002' };
    const t = { ...blankColumn('time for 10 swings t / s'), unc: '0.01', kind: 'trials', trials: 3 };
    const tm = { ...blankColumn('mean time for 10 swings t / s'), kind: 'mean', of: t.id };
    const T = { ...blankColumn('period T / s'), kind: 'formula', formula: 't/10', uncFormula: 'Δt/10', radians: false };
    const T2 = { ...blankColumn('period squared T^2 / s^2'), kind: 'formula', formula: 'T^2', uncFormula: '2*(ΔT/T)*T2', radians: false };
    st.columns = [L, t, tm, T, T2];
    const data = [
      ['0.200', ['8.94', '9.02', '8.97']], ['0.300', ['11.05', '10.96', '10.99']], ['0.400', ['12.71', '12.63', '12.74']],
      ['0.500', ['14.15', '14.24', '14.19']], ['0.600', ['15.49', '15.61', '15.55']], ['0.700', ['16.83', '16.74', '16.80']],
    ];
    st.sets[0].rows = data.map(([a, b]) => {
      const m = C.meanOf(b, C.readUnc(t.unc));
      return { ...blankRow(), cells: { [L.id]: a, [t.id]: b }, mean: { [tm.id]: { v: m.v, u: m.u, from: b, used: m.used } } };
    });
    st.title = 'Period squared against length';
    st.graph.x = L.id; st.graph.y = T2.id;
    for (const c of st.columns) c.sym = C.suggestSym(C.parseHeading(c.heading).sym);
    return st;
  }

  // ----- Gentle notes about the table (never blocking) -----
  const notesEl = $('.gm-notes');
  let notesTimer = null;
  function scheduleNotes() { clearTimeout(notesTimer); notesTimer = setTimeout(renderNotes, 500); }
  function renderNotes() {
    syncSymbols();
    const notes = [];
    const seen = {};
    S.columns.forEach((c, j) => {
      const inf = info(c);
      const name = c.heading.trim() ? `"${C.pretty(c.heading.trim())}"` : `Column ${j + 1}`;
      const values = c.kind === 'trials' ? S.sets.flatMap((s) => s.rows.flatMap((r) => trialsOf(r, c))).filter((v) => v.trim())
        : c.kind === 'raw' ? S.sets.flatMap((s) => s.rows.map((r) => r.cells[c.id])).filter((v) => v !== undefined && String(v).trim()) : [];
      if (!c.heading.trim()) {
        if (values.length || calculated(c)) notes.push(`${name} has no heading. Write it as quantity, symbol and unit, e.g. <em>${c.kind === 'formula' ? 'period squared T^2 / s^2' : 'length L / m'}</em>.`);
        return;
      }
      if (inf.style === 'brackets') notes.push(`${name}: IB style puts the unit after a slash, e.g. <em>length L / m</em> rather than <em>Length (m)</em>.`);
      else if (!inf.hasUnit && !c.noUnit) notes.push(`${name} has no unit. Add it after " / ", e.g. <em>length L / m</em>. If the quantity really has no unit (a count, or a logarithm), tick "This quantity has no unit" in the column's ⋯ menu.`);
      if (c.kind !== 'trials') {
        if (!c.sym) notes.push(`${name} has no symbol. Give it a short one (such as <em>L</em> or <em>T2</em>) in the "symbol" box, so formulas can use it.`);
        else if (!C.isName(c.sym)) notes.push(`${name}: the symbol "${esc(c.sym)}" can only use letters, digits and _, and must start with a letter (for example <em>T2</em> for T²).`);
        else if (seen[c.sym]) notes.push(`${seen[c.sym]} and ${name} have the same symbol, <em>${esc(c.sym)}</em>. Give each column its own.`);
        if (c.sym) seen[c.sym] = name;
      }
      if (calculated(c)) return; // their values and uncertainties are worked out
      const u = C.readUnc(c.unc);
      if (u && u.bad) notes.push(`${name}: the uncertainty "${esc(c.unc)}" isn't a number. Type a value such as <code>0.01</code> or a percentage such as <code>2%</code>.`);
      else if (!u && values.length) notes.push(`${name} has no uncertainty yet. Every measured value needs one: half a division on an analogue scale, the smallest division on a digital one, or more if the reading needs judgement.`);
      const bad = values.filter((v) => !C.readNumber(v));
      if (bad.length) notes.push(`${name}: ${bad.length === 1 ? `"${esc(bad[0])}" isn't` : `${bad.length} values (such as "${esc(bad[0])}") aren't`} a number I can read, so ${bad.length === 1 ? 'it is' : 'they are'} left off the graph.`);
      const dps = [...new Set(values.map(C.readNumber).filter(Boolean).map((r) => Math.max(0, r.dp)))];
      if (dps.length > 1) notes.push(`${name}: the values have different numbers of decimal places (${dps.sort((a, b) => a - b).join(', ')}). All the values in a column should have the same number, to match the uncertainty: write 0.40 as 0.400 if you measured it to the nearest 0.001.`);
      else if (dps.length === 1 && u && u.abs > 0) {
        const want = C.uncPlace(u.abs, c.uncSf);
        if (want !== null && Math.max(0, want) !== dps[0]) notes.push(`${name}: the values have ${dps[0]} decimal place${dps[0] === 1 ? '' : 's'}, but an uncertainty of ±${esc(C.pretty(c.unc))} needs ${Math.max(0, want)}. The value and its uncertainty should stop at the same decimal place, e.g. (87.4 ± 0.2) cm.`);
      }
      for (const s of S.sets) for (const r of s.rows) {
        const ru = r.unc[c.id];
        if (c.rowUnc && ru && String(ru).trim() && C.readUnc(ru).bad) notes.push(`${name}, row ${s.rows.indexOf(r) + 1}: the uncertainty "${esc(ru)}" isn't a number.`);
      }
    });
    notesEl.innerHTML = notes.length ? `<h3>Things to check</h3><ul>${notes.map((n) => `<li>${n}</li>`).join('')}</ul>` : '';
  }

  // ----- A value and its uncertainty from a row -----
  // valueOf(r, c) -> { v, u, err?, stale? }.
  //   raw: the typed value; the row's own uncertainty (if the column allows one and it is filled in) wins over the column's.
  //   trials: not a single value (NaN): use its mean column.
  //   mean: the value stored when the student last pressed the button; stale if the trials have changed since.
  //   formula: worked out from the other columns of the same row (formulas can use other formula columns).
  function valueOf(r, c) { return evalCol(r, c, new Map(), []); }
  // The column a symbol in a formula means (never a trials column: those hold several values).
  const symCol = (sym) => S.columns.find((c) => c.sym === sym && c.kind !== 'trials');
  const symbols = () => S.columns.map((c) => c.sym).filter((s) => s && C.isName(s));
  const compiled = new Map();
  function compileFor(src, radians) {
    const key = `${src}\u0000${symbols().join(',')}\u0000${radians ? 1 : 0}`;
    if (!compiled.has(key)) { if (compiled.size > 200) compiled.clear(); compiled.set(key, C.compile(src, symbols(), { radians })); }
    return compiled.get(key);
  }
  // A plain uncertainty ("0.02" or "3%") instead of a formula
  const plainUnc = (src) => /^\s*±?\s*[\d.,]+(?:[eE][+-]?\d+)?\s*%?\s*$/.test(src) && !C.readUnc(src).bad;
  // Checks a formula column's formulas: returns { value, unc } with { ok, error, f } each.
  function formulasOf(c) {
    const out = {};
    const check = (src, own) => {
      if (!src.trim()) return { ok: false, empty: true, error: '' };
      if (!own && plainUnc(src)) return { ok: false, error: 'Write a formula here, e.g. T^2 (a plain number belongs in the uncertainty box).' };
      if (own && plainUnc(src)) return { ok: true, plain: C.readUnc(src) };
      const f = compileFor(src, c.radians);
      if (!f.ok) return { ok: false, error: f.error };
      const trials = f.uses.v.concat(f.uses.u).map((s) => S.columns.find((x) => x.sym === s)).find((x) => x && x.kind === 'trials' && !symCol(x.sym));
      if (trials) return { ok: false, error: `"${trials.sym}" holds repeated trials. Calculate its mean first (above), then use the mean column's symbol.` };
      if (!own && f.uses.v.includes(c.sym)) return { ok: false, error: `The formula uses this column's own symbol, ${c.sym}: use the other columns' symbols.` };
      return { ok: true, f };
    };
    out.value = check(c.formula || '', false);
    out.unc = check(c.uncFormula || '', true);
    return out;
  }
  function evalCol(r, c, memo, stack) {
    const key = c.id;
    if (memo.has(key)) return memo.get(key);
    let R;
    if (c.kind === 'raw') {
      const v = C.num(r.cells[c.id]);
      const own = c.rowUnc && r.unc[c.id] !== undefined && String(r.unc[c.id]).trim() ? C.readUnc(r.unc[c.id]) : null;
      const spec = own && !own.bad ? own : C.readUnc(c.unc);
      R = { v, u: isFinite(v) ? C.uncOf(spec, v) : 0 };
    } else if (c.kind === 'trials') R = { v: NaN, u: 0, err: 'trials' };
    else if (c.kind === 'mean') {
      const m = r.mean && r.mean[c.id];
      const src = col(c.of);
      if (!m) R = { v: NaN, u: 0, err: 'empty' };
      else R = { v: m.v, u: m.u, stale: !!src && src.kind === 'trials' && JSON.stringify(trialsOf(r, src).map((x) => x.trim())) !== JSON.stringify((m.from || []).map((x) => String(x).trim())) };
    } else {
      if (stack.includes(c.id)) return { v: NaN, u: 0, err: 'loop' };
      const F = formulasOf(c);
      if (!F.value.ok) R = { v: NaN, u: 0, err: F.value.empty ? 'empty' : 'formula' };
      else {
        const vals = {}; const uncs = {}; let stale = false; let loop = false;
        const need = new Set([...F.value.f.uses.v, ...F.value.f.uses.u, ...(F.unc.f ? [...F.unc.f.uses.v, ...F.unc.f.uses.u] : [])]);
        for (const s of need) {
          if (s === c.sym) continue;
          const d = symCol(s);
          if (!d) continue;
          const D = evalCol(r, d, memo, stack.concat(c.id));
          if (D.err === 'loop') loop = true;
          vals[s] = D.v; uncs[s] = D.u; stale = stale || !!D.stale;
        }
        const v = F.value.f.eval(vals, uncs);
        let u = 0;
        if (isFinite(v) && F.unc.ok) {
          if (F.unc.plain) u = C.uncOf(F.unc.plain, v);
          else { vals[c.sym] = v; u = Math.abs(F.unc.f.eval(vals, uncs)); if (!isFinite(u)) u = 0; }
        }
        R = loop ? { v: NaN, u: 0, err: 'loop' } : { v, u, stale, vals, uncs, noUnc: !F.unc.ok };
      }
    }
    memo.set(key, R);
    return R;
  }

  // ----- Part 2: processing -----
  // MathJax typesets one request at a time, once it has started.
  let mathQueue = Promise.resolve();
  function typeset(el) {
    if (!window.MathJax) return;
    mathQueue = mathQueue.then(() => (MathJax.startup && MathJax.startup.promise) || null)
      .then(() => { if (el.isConnected && MathJax.typesetPromise) { if (MathJax.typesetClear) MathJax.typesetClear([el]); return MathJax.typesetPromise([el]); } return null; })
      .catch(() => {});
  }
  const proc = $('.gm-proc');
  const open = {}; // which panel is open on each calculated column: 'maxmin' or 'worked'
  const workedRow = {}; // the row chosen for each worked example
  let lastFormulaBox = null; // where the Δ and symbol buttons type
  const symHtml = (s) => `<i>${esc(s)}</i>`;
  function renderProcess() {
    syncSymbols();
    const trials = S.columns.filter((c) => c.kind === 'trials');
    const calcs = S.columns.filter((c) => c.kind === 'formula');
    proc.innerHTML = `
      <h3>Repeated trials</h3>
      ${trials.length ? trials.map((c) => {
        const m = S.columns.find((x) => x.kind === 'mean' && x.of === c.id);
        return `<div class="gm-card" data-trials="${c.id}">
          <p><strong>${esc(C.pretty(c.heading) || 'Trials column')}</strong> <span class="gm-small">(${c.trials} trials, reading uncertainty ±${esc(c.unc || '?')})</span></p>
          <p class="gm-trials-status" aria-live="polite"></p>
          <button type="button" class="button secondary" data-mean="${c.id}">${m ? 'Recalculate the mean and uncertainty' : 'Calculate the mean and uncertainty'}</button>
        </div>`;
      }).join('') + `<p class="gm-help gm-small">The mean is the average of the trials. Its uncertainty is half the range, $\\dfrac{\\text{largest} - \\text{smallest}}{2}$, or the reading uncertainty if that is larger. The tool only calculates when you press the button, so you decide when your readings are complete.</p>`
        : '<p class="gm-help">If you repeated each measurement, open the column\'s ⋯ menu in the table and choose <em>Make this a column of repeated trials</em>.</p>'}
      <h3>Calculated columns</h3>
      <p class="gm-help">To linearise, or to work out a quantity from your readings, add a column and type its <strong>formula</strong> using the column symbols, for example <code>(t/10)^2</code> or <code>ln(V)</code>. Then type how its <strong>uncertainty</strong> is found, for example <code>2*(ΔT/T)*T2</code> (the rules are on the <a href="../skills.html#propagating">Physics skills page</a>). The tool works out the numbers; it never chooses the formula for you.</p>
      ${calcs.map(calcCard).join('')}
      <button type="button" class="button secondary" data-act="add-calc">Add a calculated column</button>`;
    updateProcess();
    typeset(proc);
  }
  function calcCard(c) {
    const chips = S.columns.filter((x) => x !== c && x.kind !== 'trials' && x.sym && C.isName(x.sym))
      .map((x) => `<button type="button" class="gm-chip" data-ins="${esc(x.sym)}" title="${esc(C.pretty(x.heading))}">${symHtml(x.sym)}</button>`).join('');
    return `<div class="gm-card gm-calc-card" id="calc-${c.id}" data-card="${c.id}">
      <div class="gm-calc-grid">
        <label class="gm-wide">Heading <input data-ch="heading" value="${esc(c.heading)}" placeholder="e.g. period squared T^2 / s^2" autocomplete="off"></label>
        <label>Symbol for formulas <input data-ch="sym" value="${esc(c.sym)}" placeholder="e.g. T2" autocomplete="off" spellcheck="false"></label>
        <label class="gm-wide">Formula: <span class="gm-lhs">${symHtml(c.sym || '?')} =</span> <input data-ch="formula" class="gm-formula" value="${esc(c.formula)}" placeholder="e.g. (t/10)^2" autocomplete="off" spellcheck="false"></label>
        <p class="gm-ferr gm-wide" data-err="formula" aria-live="polite"></p>
        <label class="gm-wide">Uncertainty: <span class="gm-lhs">Δ${symHtml(c.sym || '?')} =</span> <input data-ch="uncFormula" class="gm-formula" value="${esc(c.uncFormula)}" placeholder="e.g. 2*(ΔT/T)*T2, or 0.02, or 3%" autocomplete="off" spellcheck="false"></label>
        <p class="gm-ferr gm-wide" data-err="unc" aria-live="polite"></p>
      </div>
      <div class="gm-chips"><span class="gm-small">Insert:</span> <button type="button" class="gm-chip" data-ins="Δ" title="The uncertainty in the next symbol, e.g. ΔT">Δ</button>${chips || '<span class="gm-small">(give your columns symbols first)</span>'}</div>
      <label class="vlab-check gm-small"><input type="checkbox" data-ch="radians" ${c.radians ? 'checked' : ''}> Angles in radians (sin, cos and tan use degrees unless this is ticked)</label>
      <div class="gm-card-btns">
        <button type="button" class="button secondary" data-panel="maxmin" aria-expanded="${open[c.id] === 'maxmin'}">Check with the max–min method</button>
        <button type="button" class="button secondary" data-panel="worked" aria-expanded="${open[c.id] === 'worked'}">Worked example for one row</button>
        <button type="button" class="link-btn gm-danger" data-delcalc="${c.id}">Delete this column</button>
      </div>
      <div class="gm-panel" data-show="maxmin" ${open[c.id] === 'maxmin' ? '' : 'hidden'}></div>
      <div class="gm-panel" data-show="worked" ${open[c.id] === 'worked' ? '' : 'hidden'}></div>
    </div>`;
  }
  // Keeps a card's heading and symbol in step when they are typed in the table instead
  function syncCard(c) {
    const card = $(`[data-card="${c.id}"]`);
    if (!card) { updateProcess(); return; }
    const h = $('[data-ch="heading"]', card); if (h && document.activeElement !== h) h.value = c.heading;
    const s = $('[data-ch="sym"]', card); if (s && document.activeElement !== s) s.value = c.sym;
    $$('.gm-lhs i', card).forEach((x) => { x.textContent = c.sym || '?'; });
  }
  // Messages that change as the student types: stale means, formula errors, open panels.
  function updateProcess() {
    $$('[data-trials]', proc).forEach((card) => {
      const c = col(card.dataset.trials);
      const m = S.columns.find((x) => x.kind === 'mean' && x.of === c.id);
      const el = $('.gm-trials-status', card);
      if (!m) { el.innerHTML = 'Not calculated yet.'; el.className = 'gm-trials-status'; return; }
      const stale = [];
      S.sets.forEach((s) => s.rows.forEach((r, i) => { if (valueOf(r, m).stale) stale.push(`${S.sets.length > 1 ? s.name + ' ' : ''}row ${i + 1}`); }));
      el.className = 'gm-trials-status' + (stale.length ? ' gm-stale-note' : '');
      el.innerHTML = stale.length ? `<strong>Out of date:</strong> the trials in ${stale.slice(0, 6).join(', ')}${stale.length > 6 ? '…' : ''} have changed since the means were calculated. Press the button to recalculate.`
        : `Up to date: the means are in the column <em>${esc(C.pretty(m.heading))}</em>.`;
    });
    $$('[data-card]', proc).forEach((card) => {
      const c = col(card.dataset.card);
      if (!c) return;
      const F = formulasOf(c);
      const bad = [];
      S.sets.forEach((s) => s.rows.forEach((r, i) => { const R = valueOf(r, c); if (R.err === 'loop') bad.loop = true; if (!R.err && !isFinite(R.v) && Object.keys(R.vals || {}).length && Object.values(R.vals).every(isFinite)) bad.push(`${S.sets.length > 1 ? s.name + ' ' : ''}row ${i + 1}`); }));
      $('[data-err="formula"]', card).innerHTML = F.value.empty ? 'Type a formula, using the symbols below.'
        : !F.value.ok ? `<span class="gm-warn">${esc(F.value.error)}</span>`
          : bad.loop ? '<span class="gm-warn">These formulas use each other in a loop: one of them must use only measured columns.</span>'
            : bad.length ? `<span class="gm-warn">The formula can't be worked out for ${bad.slice(0, 5).join(', ')} (for example the log of a negative number, or dividing by zero).</span>` : '';
      $('[data-err="unc"]', card).innerHTML = F.unc.empty ? 'No uncertainty yet, so this column has no error bars. Type how its uncertainty is found.'
        : !F.unc.ok ? `<span class="gm-warn">${esc(F.unc.error)}</span>` : '';
      if (open[c.id] === 'maxmin') renderMaxMin(c, $('[data-show="maxmin"]', card));
      if (open[c.id] === 'worked') renderWorked(c, $('[data-show="worked"]', card));
    });
  }

  proc.addEventListener('focusin', (e) => { if (e.target.classList.contains('gm-formula')) lastFormulaBox = e.target; });
  proc.addEventListener('input', (e) => {
    const el = e.target;
    const card = el.closest('[data-card]');
    if (card && el.dataset.ch) {
      const c = col(card.dataset.card);
      const k = el.dataset.ch;
      if (k === 'radians') c.radians = el.checked;
      else if (k === 'sym') { c.sym = el.value.trim(); c.symAuto = !c.sym; if (c.symAuto) c.sym = info(c).symbol; }
      else c[k] = el.value;
      if (k === 'heading' && c.symAuto) { c.sym = info(c).symbol; const s = $('[data-ch="sym"]', card); if (s) s.value = c.sym; }
      if (k === 'heading' || k === 'sym') {
        $$('.gm-lhs i', card).forEach((x) => { x.textContent = c.sym || '?'; });
        // other cards' symbol buttons change too
        $$('[data-card]', proc).forEach((other) => { if (other !== card) { const fresh = document.createElement('div'); fresh.innerHTML = calcCard(col(other.dataset.card)); $('.gm-chips', other).replaceWith($('.gm-chips', fresh)); } });
      }
      renderTable(); changed();
      if (k === 'heading' || k === 'sym') { const t = $(`[data-head="${c.id}"]`, wrap); if (t) t.value = c.heading; }
    }
  });
  proc.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const card = b.closest('[data-card]');
    if (b.dataset.mean) calcMeans(col(b.dataset.mean));
    else if (b.dataset.act === 'add-calc') addCalc();
    else if (b.dataset.delcalc) deleteColumn(col(b.dataset.delcalc));
    else if (b.dataset.ins !== undefined && card) {
      const box = lastFormulaBox && card.contains(lastFormulaBox) ? lastFormulaBox : $('[data-ch="uncFormula"]', card);
      const at = box.selectionStart ?? box.value.length; const end = box.selectionEnd ?? at;
      box.value = box.value.slice(0, at) + b.dataset.ins + box.value.slice(end);
      box.focus(); box.selectionStart = box.selectionEnd = at + b.dataset.ins.length;
      box.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (b.dataset.panel && card) {
      const id = card.dataset.card;
      open[id] = open[id] === b.dataset.panel ? null : b.dataset.panel;
      $$('[data-panel]', card).forEach((x) => x.setAttribute('aria-expanded', String(open[id] === x.dataset.panel)));
      $$('[data-show]', card).forEach((p) => { p.hidden = p.dataset.show !== open[id]; });
      updateProcess();
    } else if (b.dataset.copy !== undefined) {
      const text = b.closest('.gm-panel').querySelector('.gm-copytext').textContent;
      const done = () => { b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy as text'; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => say('Your browser blocked copying: select the text and copy it yourself.'));
    }
  });
  proc.addEventListener('change', (e) => {
    if (e.target.dataset.wrow === undefined) return;
    workedRow[e.target.dataset.wrow] = e.target.value;
    updateProcess();
  });

  // The mean button: never automatic (teacher's decision).
  function calcMeans(c) {
    remember('calculating the means');
    let m = S.columns.find((x) => x.kind === 'mean' && x.of === c.id);
    if (!m) {
      const h = C.parseHeading(c.heading);
      m = { ...blankColumn(h.name || h.sym ? `mean ${c.heading.trim()}` : ''), kind: 'mean', of: c.id, uncSf: c.uncSf };
      S.columns.splice(S.columns.indexOf(c) + 1, 0, m);
    }
    let n = 0; const reading = [];
    for (const s of S.sets) {
      s.rows.forEach((r, i) => {
        const t = trialsOf(r, c);
        const res = C.meanOf(t, C.readUnc(c.unc));
        if (!res) { delete r.mean[m.id]; return; }
        r.mean[m.id] = { v: res.v, u: res.u, from: t, used: res.used };
        n++;
        if (res.used === 'reading' && res.reading > 0) reading.push(`${S.sets.length > 1 ? s.name + ' ' : ''}row ${i + 1}`);
      });
    }
    renderTable(); renderProcess(); changed();
    say(`Means calculated for ${n} row${n === 1 ? '' : 's'}.${reading.length ? ` In ${reading.slice(0, 4).join(', ')}${reading.length > 4 ? '…' : ''} the reading uncertainty was larger than half the range, so it was used instead.` : ''}`);
  }
  function addCalc() {
    if (S.columns.length >= 12) { say('That is a lot of columns: delete one you don\'t need first.'); return; }
    remember('adding a calculated column');
    const c = { ...blankColumn(), kind: 'formula', formula: '', uncFormula: '', radians: false };
    S.columns.push(c);
    renderTable(); renderProcess(); changed();
    const h = $(`[data-card="${c.id}"] [data-ch="heading"]`); if (h) h.focus();
  }

  // "Check with the max–min method": every row, side by side with the student's own uncertainty formula.
  function renderMaxMin(c, el) {
    const F = formulasOf(c);
    if (!F.value.ok) { el.innerHTML = '<p class="gm-small">Write the formula first.</p>'; return; }
    const rows = [];
    let flagged = 0;
    S.sets.forEach((s) => s.rows.forEach((r, i) => {
      const R = valueOf(r, c);
      if (!isFinite(R.v)) return;
      const mm = C.maxMin(F.value.f, R.vals, R.uncs);
      if (!mm) return;
      const off = R.u > 0 && mm.u > 0 ? Math.max(R.u / mm.u, mm.u / R.u) > 1.5 : (R.u > 0) !== (mm.u > 0);
      if (off) flagged++;
      rows.push(`<tr${off ? ' class="gm-off"' : ''}><td>${S.sets.length > 1 ? esc(s.name) + ', ' : ''}${i + 1}</td><td>${C.sig(R.v, 4)}</td><td>${F.unc.ok ? C.sig(R.u, 2) : '–'}</td><td>${C.sig(mm.u, 2)}</td><td>${off ? 'check' : ''}</td></tr>`);
    }));
    el.innerHTML = `<p class="gm-small">The max–min method works the formula out with every input at its largest and smallest value (value ± uncertainty), and takes half the difference. It works for any formula, so it is a good check on your uncertainty formula.</p>
      <div class="table-wrap"><table class="gm-mini"><thead><tr><th>Row</th><th>Value</th><th>Your Δ</th><th>Max–min Δ</th><th></th></tr></thead><tbody>${rows.join('') || '<tr><td colspan="5">No complete rows yet.</td></tr>'}</tbody></table></div>
      <p class="gm-small">${!F.unc.ok ? 'Type your uncertainty formula to compare it.' : flagged ? `<strong>${flagged} row${flagged === 1 ? '' : 's'} differ by more than half as much again.</strong> Small differences are normal (the rules for percentages are an approximation), but a big one usually means the uncertainty formula has a mistake: check it against the rules.` : 'Your formula and the max–min method agree closely. Small differences are normal: the rules for percentages are an approximation.'}</p>`;
  }

  // The worked example for one row: the formula with that row's numbers, its uncertainty, and the rounded result.
  // Shown with proper maths, plus plain text the student can copy into their report and adapt.
  function renderWorked(c, el) {
    const F = formulasOf(c);
    const options = [];
    S.sets.forEach((s, si) => s.rows.forEach((r, i) => { if (isFinite(valueOf(r, c).v)) options.push({ id: r.id, r, label: `${S.sets.length > 1 ? s.name + ', row ' : 'Row '}${i + 1}` }); }));
    if (!F.value.ok || !options.length) { el.innerHTML = '<p class="gm-small">Write the formula and fill in at least one row first.</p>'; return; }
    const pick = options.find((o) => o.id === workedRow[c.id]) || options[Math.min(2, options.length - 1)];
    const R = valueOf(pick.r, c);
    const unitOf = (x) => (x ? C.parseHeading(x.heading).unit : '');
    const myUnit = unitOf(c);
    // how each symbol is written: the heading's own symbol (T^2 -> T²), in maths or as text
    const nice = (s) => { const d = symCol(s); const h = d && C.parseHeading(d.heading).sym; return h && !/[()/]/.test(h) ? h : s; };
    const tex = (s) => { const n = nice(s); const m = n.match(/^([^^]+)\^\(?(-?[\d.]+)\)?$/); return m ? `${m[1]}^{${m[2]}}` : n.replace(/_(\w+)/, '_{$1}'); };
    const dTex = (s) => (/[\^_]/.test(nice(s)) ? `\\Delta(${tex(s)})` : `\\Delta ${tex(s)}`);
    const dTxt = (s) => (/[\^_]/.test(nice(s)) ? `Δ(${C.pretty(nice(s))})` : `Δ${C.pretty(nice(s))}`);
    // the numbers: as typed for measured columns, 4 s.f. for worked-out ones
    const shown = (s) => { const d = symCol(s); if (d && d.kind === 'raw' && C.readNumber(pick.r.cells[d.id])) return String(pick.r.cells[d.id]).trim(); return C.sig(R.vals[s], 4).replace('−', '-'); };
    const shownU = (s) => C.sig(R.uncs[s] || 0, 2).replace('−', '-');
    const texUnit = (u) => (u ? '\\ ' + C.pretty(u).split(/\s+/).map((t) => { const m = t.match(/^(.*?)([⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/); return m ? `\\text{${m[1]}}^{${m[2].replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (ch) => ({ '⁻': '-', '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 }[ch]))}}` : `\\text{${t}}`; }).join('\\,') : '');
    const txtUnit = (u) => (u ? ' ' + C.pretty(u) : '');
    const me = tex(c.sym); const meTxt = C.pretty(nice(c.sym));
    const vTexSym = F.value.f.latex({ v: tex, u: dTex });
    const vTexNum = F.value.f.latex({ v: shown, u: shownU, numbers: true });
    const vTxtSym = F.value.f.text({ v: (s) => C.pretty(nice(s)), u: dTxt });
    const vTxtNum = F.value.f.text({ v: shown, u: shownU, numbers: true });
    // (when the formula is just another symbol squared, T² = T², the symbol step is left out)
    const same = vTxtSym.replace(/\s/g, '') === meTxt.replace(/\s/g, '');
    const lines = [`$${me} = ${same ? '' : vTexSym + ' = '}${vTexNum} = ${C.sig(R.v, 4).replace('−', '-')}${texUnit(myUnit)}$`];
    const text = [`${meTxt} = ${same ? '' : vTxtSym + ' = '}${vTxtNum} = ${C.sig(R.v, 4)}${txtUnit(myUnit)}`];
    if (F.unc.ok && F.unc.f) {
      const withMe = (fn, mine) => (s) => (s === c.sym ? mine : fn(s));
      const uTexSym = F.unc.f.latex({ v: withMe(tex, me), u: dTex });
      const uTexNum = F.unc.f.latex({ v: withMe(shown, C.sig(R.v, 4).replace('−', '-')), u: shownU, numbers: true });
      const uTxtSym = F.unc.f.text({ v: withMe((s) => C.pretty(nice(s)), meTxt), u: dTxt });
      const uTxtNum = F.unc.f.text({ v: withMe(shown, C.sig(R.v, 4)), u: shownU, numbers: true });
      lines.push(`$${dTex(c.sym)} = ${uTexSym} = ${uTexNum} = ${C.sig(R.u, 2).replace('−', '-')}${texUnit(myUnit)}$`);
      text.push(`${dTxt(c.sym)} = ${uTxtSym} = ${uTxtNum} = ${C.sig(R.u, 2)}${txtUnit(myUnit)}`);
    } else if (F.unc.ok) {
      lines.push(`$${dTex(c.sym)} = ${C.sig(R.u, 2).replace('−', '-')}${texUnit(myUnit)}$`);
      text.push(`${dTxt(c.sym)} = ${C.sig(R.u, 2)}${txtUnit(myUnit)}`);
    }
    const final = R.u > 0 ? C.pairText(R.v, R.u, C.pretty(myUnit), c.uncSf) : `${C.sig(R.v, 4)}${txtUnit(myUnit)}`;
    text.push(`So ${meTxt} = ${final}`);
    el.innerHTML = `<label class="gm-small">Row <select data-wrow="${c.id}">${options.map((o) => `<option value="${o.id}" ${o === pick ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></label>
      <div class="gm-worked-lines">${lines.map((l) => `<p>${esc(l)}</p>`).join('')}<p>So ${esc(meTxt)} = <strong>${esc(final)}</strong>.</p></div>
      <p class="gm-small">Adapt it for your report: say what the step does and why, and show one example like this (not every row). Rounded at the end only.</p>
      <pre class="gm-copytext">${esc(text.join('\n'))}</pre>
      <button type="button" class="button secondary" data-copy>Copy as text</button>`;
    typeset(el);
  }

  // ----- Part 3: the graph -----
  const canvas = $('.gm-canvas');
  const results = $('.gm-results');
  const ctl = (k) => $(`[data-g="${k}"]`);
  const plottable = () => S.columns.filter((c) => c.kind !== 'trials');
  const axisCol = (k) => { const c = col(S.graph[k]); if (c && c.kind !== 'trials') return c; const p = plottable(); return p[k === 'x' ? 0 : Math.min(1, p.length - 1)]; };
  const defaultLabel = (c) => (c && c.heading.trim() ? c.heading.trim() : '');
  const axisLabel = (k) => (S.graph[k + 'Label'] || '').trim() || defaultLabel(axisCol(k));

  // Everything the graph shows, worked out from the state.
  function model() {
    const xc = axisCol('x'); const yc = axisCol('y');
    const sets = S.sets.map((s, i) => {
      const pts = s.rows.map((r, k) => {
        const X = valueOf(r, xc); const Y = valueOf(r, yc);
        return { row: r, n: k + 1, x: X.v, y: Y.v, dx: X.u, dy: Y.u, use: r.use !== false };
      }).filter((p) => isFinite(p.x) && isFinite(p.y));
      const used = pts.filter((p) => p.use);
      const fit = S.graph.fit !== 'none' && used.length ? C.fit(S.graph.fit, used) : null;
      return { i, set: s, name: s.name || `Set ${i + 1}`, pts, used, fit };
    });
    return { xc, yc, sets, xLabel: axisLabel('x'), yLabel: axisLabel('y') };
  }

  // Colours from the page (so dark mode works on screen)
  function screenPalette() {
    const cs = getComputedStyle(root);
    const v = (n) => cs.getPropertyValue(n).trim();
    return { bg: v('--surface'), ink: v('--text'), muted: v('--muted'), grid: v('--gm-grid'), minor: v('--gm-grid-minor'), sets: [1, 2, 3, 4, 5].map((k) => v(`--gm-set${k}`)) };
  }

  // A label such as "length L / m" in pieces: the symbol in italics and powers as superscripts ("s^2" -> "s²").
  function labelRuns(text) {
    const h = C.parseHeading(text);
    if (h.sym && /^[^\s/]+$/.test(h.sym)) {
      const runs = [];
      if (h.name) runs.push({ t: C.pretty(h.name) + ' ' });
      runs.push({ t: C.pretty(h.sym), i: true });
      if (h.hasUnit) runs.push({ t: ' / ' + C.pretty(h.unit) });
      return runs;
    }
    return [{ t: C.pretty(text) }];
  }
  function runsWidth(g, runs, size, bold) {
    return runs.reduce((w, r) => { g.font = font(size, r.i, bold); return w + g.measureText(r.t).width; }, 0);
  }
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  const font = (size, italic, bold) => `${italic ? 'italic ' : ''}${bold ? '600 ' : ''}${size}px ${FONT}`;
  function drawRuns(g, runs, x, y, size, align = 'center', bold = false) {
    const w = runsWidth(g, runs, size, bold);
    let at = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    g.textAlign = 'left';
    for (const r of runs) { g.font = font(size, r.i, bold); g.fillText(r.t, at, y); at += g.measureText(r.t).width; }
    return w;
  }
  // Tick labels: the same number of decimal places along an axis; powers of ten for very big or small numbers.
  function tickFormat(step, lo, hi) {
    const big = Math.max(Math.abs(lo), Math.abs(hi));
    const e = Math.floor(Math.log10(step));
    if (big >= 1e5 || (big && big < 1e-3) || e < -4) {
      const p = Math.floor(Math.log10(big || 1));
      const dp = Math.max(0, p - e);
      return (v) => (v === 0 ? '0' : `${(v / Math.pow(10, p)).toFixed(dp).replace('-', '−')}×10${C.sup(p)}`);
    }
    const m = step / Math.pow(10, e);
    const dp = Math.max(0, -e + (Math.abs(m - 2.5) < 1e-9 ? 1 : 0));
    return (v) => v.toFixed(dp).replace(/^-/, '−');
  }
  function marker(g, kind, x, y, r, filled, colour, bg) {
    g.beginPath();
    if (kind === 'circle') g.arc(x, y, r, 0, 2 * Math.PI);
    else if (kind === 'square') { const s = r * 0.9; g.rect(x - s, y - s, 2 * s, 2 * s); }
    else if (kind === 'diamond') { const s = r * 1.25; g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x, y + s); g.lineTo(x - s, y); g.closePath(); }
    else { const s = r * 1.2; const d = kind === 'up' ? 1 : -1; g.moveTo(x, y - d * s); g.lineTo(x + s, y + d * s * 0.75); g.lineTo(x - s, y + d * s * 0.75); g.closePath(); }
    g.fillStyle = filled ? colour : bg; g.fill();
    g.lineWidth = filled ? 1 : 1.6; g.strokeStyle = colour; g.stroke();
  }

  // Draws the whole graph on a 2D context at W × H (in CSS pixels; the caller sets the scale).
  // Returns where each point was drawn, for tapping. The same code draws the screen graph and the downloaded picture.
  function drawGraph(g, W, H, M, pal, o = {}) {
    const fs = o.font || 12;
    g.fillStyle = pal.bg; g.fillRect(0, 0, W, H);
    const shown = M.sets.filter((s) => s.pts.length);
    const all = shown.flatMap((s) => s.pts);
    g.textBaseline = 'alphabetic';
    if (all.length < 1) {
      g.fillStyle = pal.muted; g.font = font(fs + 1);
      g.textAlign = 'center';
      g.fillText('Type some readings, then choose the columns to plot.', W / 2, H / 2);
      return { points: [] };
    }
    // ranges, including the uncertainty bars
    let x0 = Math.min(...all.map((p) => p.x - p.dx)); let x1 = Math.max(...all.map((p) => p.x + p.dx));
    let y0 = Math.min(...all.map((p) => p.y - p.dy)); let y1 = Math.max(...all.map((p) => p.y + p.dy));
    if (S.graph.zero) { x0 = Math.min(0, x0); x1 = Math.max(0, x1); y0 = Math.min(0, y0); y1 = Math.max(0, y1); }
    const pad = (a, b) => (b - a) * 0.04 || Math.abs(a) * 0.1 || 1;
    const px0 = pad(x0, x1); const py0 = pad(y0, y1);
    if (!(S.graph.zero && x0 === 0)) x0 -= px0;
    if (!(S.graph.zero && y0 === 0)) y0 -= py0;
    x1 += px0; y1 += py0;

    // the title and the legend at the top
    let top = 10;
    g.fillStyle = pal.ink;
    if (S.title.trim()) { drawRuns(g, [{ t: C.pretty(S.title.trim()) }], W / 2, top + fs + 4, fs + 3, 'center', true); top += fs + 14; }
    const legend = shown.length > 1;
    if (legend) {
      g.font = font(fs);
      const items = shown.map((s) => ({ s, w: 30 + g.measureText(s.name).width + 18 }));
      let line = []; const lines = []; let lw = 0;
      for (const it of items) { if (lw + it.w > W - 20 && line.length) { lines.push({ line, lw }); line = []; lw = 0; } line.push(it); lw += it.w; }
      lines.push({ line, lw });
      for (const L of lines) {
        let x = (W - L.lw) / 2; const y = top + fs;
        for (const it of L.line) {
          const st = STYLES[it.s.i]; const colour = pal.sets[it.s.i];
          g.strokeStyle = colour; g.lineWidth = 1.8; g.setLineDash(st.dash);
          g.beginPath(); g.moveTo(x, y - fs * 0.35); g.lineTo(x + 24, y - fs * 0.35); g.stroke(); g.setLineDash([]);
          marker(g, st.marker, x + 12, y - fs * 0.35, 4, true, colour, pal.bg);
          g.fillStyle = pal.ink; g.font = font(fs); g.textAlign = 'left'; g.fillText(it.s.name, x + 30, y);
          x += it.w;
        }
        top += fs + 8;
      }
      top += 2;
    }

    // ticks, with the axes ending on whole ticks
    const nx = Math.max(3, Math.min(8, Math.round(W / 95))); const ny = Math.max(3, Math.min(8, Math.round(H / 70)));
    let tx = C.ticks(x0, x1, nx); let ty = C.ticks(y0, y1, ny);
    x0 = Math.floor(x0 / tx.step + 1e-9) * tx.step; x1 = Math.ceil(x1 / tx.step - 1e-9) * tx.step;
    y0 = Math.floor(y0 / ty.step + 1e-9) * ty.step; y1 = Math.ceil(y1 / ty.step - 1e-9) * ty.step;
    tx = C.ticks(x0, x1, nx); ty = C.ticks(y0, y1, ny);
    tx.list = tx.list.filter((t) => t >= x0 - 1e-9 * tx.step && t <= x1 + 1e-9 * tx.step);
    ty.list = ty.list.filter((t) => t >= y0 - 1e-9 * ty.step && t <= y1 + 1e-9 * ty.step);
    const fx = tickFormat(tx.step, x0, x1); const fy = tickFormat(ty.step, y0, y1);
    g.font = font(fs);
    const yTickW = Math.max(...ty.list.map((t) => g.measureText(fy(t)).width));
    const L = 10 + fs + 2 + 10 + yTickW + 8; const R = Math.max(14, g.measureText(fx(tx.list[tx.list.length - 1])).width / 2 + 4);
    const B = fs + 10 + fs + 2 + 12; const T = top + 6;
    const pw = W - L - R; const ph = H - T - B;
    const X = (v) => L + (v - x0) / (x1 - x0) * pw; const Y = (v) => T + ph - (v - y0) / (y1 - y0) * ph;

    // gridlines: minor and major
    if (S.graph.grid) {
      const minorOf = (step) => { const m = step / Math.pow(10, Math.floor(Math.log10(step))); return step / (Math.abs(m - 2) < 1e-9 ? 4 : 5); };
      g.lineWidth = 1;
      // minor lines (small squares), counted in whole steps so rounding can't add or lose a line
      const sx = minorOf(tx.step); const sy = minorOf(ty.step);
      g.strokeStyle = pal.minor; g.beginPath();
      for (let k = 0, n = Math.round((x1 - x0) / sx); k <= n; k++) { const x = Math.round(X(x0 + k * sx)) + 0.5; g.moveTo(x, T); g.lineTo(x, T + ph); }
      for (let k = 0, n = Math.round((y1 - y0) / sy); k <= n; k++) { const y = Math.round(Y(y0 + k * sy)) + 0.5; g.moveTo(L, y); g.lineTo(L + pw, y); }
      g.stroke();
      g.strokeStyle = pal.grid; g.beginPath();
      tx.list.forEach((t) => { const x = Math.round(X(t)) + 0.5; g.moveTo(x, T); g.lineTo(x, T + ph); });
      ty.list.forEach((t) => { const y = Math.round(Y(t)) + 0.5; g.moveTo(L, y); g.lineTo(L + pw, y); });
      g.stroke();
    }
    // the axes (with zero lines when zero is inside the range), tick marks and numbers
    g.strokeStyle = pal.ink; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(L, T); g.lineTo(L, T + ph); g.lineTo(L + pw, T + ph); g.stroke();
    g.lineWidth = 1;
    if (x0 < 0 && x1 > 0) { g.beginPath(); g.moveTo(X(0), T); g.lineTo(X(0), T + ph); g.stroke(); }
    if (y0 < 0 && y1 > 0) { g.beginPath(); g.moveTo(L, Y(0)); g.lineTo(L + pw, Y(0)); g.stroke(); }
    g.fillStyle = pal.ink; g.font = font(fs);
    g.beginPath();
    tx.list.forEach((t) => { g.moveTo(X(t), T + ph); g.lineTo(X(t), T + ph + 4); });
    ty.list.forEach((t) => { g.moveTo(L - 4, Y(t)); g.lineTo(L, Y(t)); });
    g.stroke();
    g.textAlign = 'center'; tx.list.forEach((t) => g.fillText(fx(t), X(t), T + ph + fs + 6));
    g.textAlign = 'right'; ty.list.forEach((t) => g.fillText(fy(t), L - 7, Y(t) + fs * 0.35));
    // axis labels
    g.fillStyle = pal.ink;
    drawRuns(g, labelRuns(M.xLabel || 'x'), L + pw / 2, H - 10, fs + 1);
    g.save(); g.translate(10 + fs, T + ph / 2); g.rotate(-Math.PI / 2); drawRuns(g, labelRuns(M.yLabel || 'y'), 0, 0, fs + 1); g.restore();

    // inside the plot: fits, uncertainty bars, then the points on top
    g.save(); g.beginPath(); g.rect(L, T, pw, ph); g.clip();
    for (const s of shown) {
      if (!s.fit || !s.fit.ok) continue;
      const st = STYLES[s.i];
      g.strokeStyle = pal.sets[s.i]; g.lineWidth = 2; g.setLineDash(st.dash); g.lineCap = 'round';
      g.beginPath();
      if (s.fit.type === 'linear') { g.moveTo(X(x0), Y(s.fit.f(x0))); g.lineTo(X(x1), Y(s.fit.f(x1))); }
      else {
        const xs = s.used.map((p) => p.x); const a = Math.min(...xs); const b = Math.max(...xs);
        const from = s.fit.type === 'power' ? Math.max(a - (b - a) * 0.05, 1e-12 * b) : a - (b - a) * 0.05; const to = b + (b - a) * 0.05;
        let first = true;
        for (let k = 0; k <= 240; k++) {
          const x = from + (to - from) * k / 240; const y = s.fit.f(x);
          if (!isFinite(y)) { first = true; continue; }
          const yy = Math.max(-1e6, Math.min(1e6, Y(y)));
          if (first) { g.moveTo(X(x), yy); first = false; } else g.lineTo(X(x), yy);
        }
      }
      g.stroke(); g.setLineDash([]); g.lineCap = 'butt';
    }
    const points = [];
    const cap = 3.5;
    for (const s of shown) {
      const colour = pal.sets[s.i];
      g.strokeStyle = colour; g.lineWidth = 1.1; g.beginPath();
      for (const p of s.pts) {
        const x = X(p.x); const y = Y(p.y);
        if (p.dy) { const a = Y(p.y - p.dy); const b = Y(p.y + p.dy); g.moveTo(x, a); g.lineTo(x, b); g.moveTo(x - cap, a); g.lineTo(x + cap, a); g.moveTo(x - cap, b); g.lineTo(x + cap, b); }
        if (p.dx) { const a = X(p.x - p.dx); const b = X(p.x + p.dx); g.moveTo(a, y); g.lineTo(b, y); g.moveTo(a, y - cap); g.lineTo(a, y + cap); g.moveTo(b, y - cap); g.lineTo(b, y + cap); }
      }
      g.stroke();
    }
    for (const s of shown) {
      for (const p of s.pts) {
        const x = X(p.x); const y = Y(p.y);
        marker(g, STYLES[s.i].marker, x, y, 4, p.use, pal.sets[s.i], pal.bg);
        points.push({ set: s.i, row: p.row.id, n: p.n, x, y });
      }
    }
    g.restore();
    return { points, box: { L, T, pw, ph }, range: { x0, x1, y0, y1 } };
  }

  // The screen graph: sharp on high-resolution screens, redrawn after every change (once per frame at most).
  let geo = { points: [] };
  let frame = 0;
  function scheduleGraph() { cancelAnimationFrame(frame); frame = requestAnimationFrame(renderGraph); }
  function renderGraph() {
    refreshComputed();
    updateProcess();
    renderControls();
    const M = model();
    const W = Math.max(260, canvas.parentElement.clientWidth);
    const H = Math.round(Math.max(250, Math.min(560, W * 0.7)));
    const d = devicePixelRatio || 1;
    if (canvas.width !== Math.round(W * d) || canvas.height !== Math.round(H * d)) { canvas.width = Math.round(W * d); canvas.height = Math.round(H * d); }
    canvas.style.height = H + 'px';
    const g = canvas.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    geo = drawGraph(g, W, H, M, screenPalette(), { font: W < 420 ? 11 : 12 });
    renderResults(M);
  }

  // The controls above the graph
  function renderControls() {
    const opts = plottable().map((c) => `<option value="${c.id}">${esc(C.pretty(c.heading.trim()) || `Column ${S.columns.indexOf(c) + 1} (no heading)`)}</option>`).join('');
    for (const k of ['x', 'y']) {
      const sel = ctl(k);
      if (sel.dataset.opts !== opts && document.activeElement !== sel) { sel.innerHTML = opts; sel.dataset.opts = opts; }
      sel.value = axisCol(k) ? axisCol(k).id : '';
      const lab = ctl(k + 'Label');
      lab.placeholder = defaultLabel(axisCol(k)) || 'quantity symbol / unit';
      if (document.activeElement !== lab) lab.value = S.graph[k + 'Label'] || '';
    }
    if (document.activeElement !== ctl('title')) ctl('title').value = S.title;
    ctl('fit').value = S.graph.fit;
    ctl('grid').checked = !!S.graph.grid;
    ctl('zero').checked = !!S.graph.zero;
  }
  $('.gm-graph-controls').addEventListener('input', (e) => {
    const k = e.target.dataset.g;
    if (!k) return;
    if (k === 'title') S.title = e.target.value;
    else if (k === 'grid' || k === 'zero') S.graph[k] = e.target.checked;
    else S.graph[k] = e.target.value;
    changed();
  });

  // Tapping a point leaves it out of the fit (or puts it back).
  function pointAt(e) {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left; const y = e.clientY - r.top;
    let best = null; let bd = e.pointerType === 'touch' ? 18 : 11;
    for (const p of geo.points) { const d = Math.hypot(p.x - x, p.y - y); if (d <= bd) { bd = d; best = p; } }
    return best;
  }
  canvas.addEventListener('click', (e) => {
    const p = pointAt(e);
    if (!p) return;
    const s = S.sets[p.set]; const r = s.rows.find((x) => x.id === p.row);
    if (!r) return;
    r.use = r.use === false;
    const box = $(`[data-use="${r.id}"]`); if (box) box.checked = r.use;
    say(`${S.sets.length > 1 ? s.name + ', row' : 'Row'} ${p.n}: ${r.use ? 'back in the fit' : 'left out of the fit (hollow point)'}.`);
    changed();
  });
  canvas.addEventListener('pointermove', (e) => { canvas.style.cursor = pointAt(e) ? 'pointer' : ''; });

  // The fit equations under the graph
  const it = (s) => `<i>${esc(C.pretty(s))}</i>`;
  function signed(text) { return text.startsWith('−') ? ` − ${text.slice(1)}` : ` + ${text}`; }
  function renderResults(M) {
    const xh = C.parseHeading(M.xLabel); const yh = C.parseHeading(M.yLabel);
    const xs = xh.sym || 'x'; const ys = yh.sym || 'y';
    const xu = xh.unit; const yu = yh.unit;
    const unit = (u) => (u ? ' ' + esc(C.pretty(u)) : '');
    const ymax = Math.max(0, ...M.sets.flatMap((s) => s.pts.map((p) => Math.abs(p.y))));
    // the intercept to the decimal place of 3 significant figures of the largest y value
    const place = ymax ? 2 - Math.floor(Math.log10(ymax)) : 3;
    const out = [];
    const many = M.sets.filter((s) => s.pts.length).length > 1;
    for (const s of M.sets) {
      if (!s.pts.length) continue;
      const head = many ? `<span class="gm-setlabel">${markerSvg(s.i)} ${esc(s.name)}:</span> ` : '';
      const left = s.pts.length - s.used.length;
      const extra = left ? ` <span class="gm-small">(${left} point${left === 1 ? '' : 's'} left out)</span>` : '';
      if (S.graph.fit === 'none') { if (many) out.push(`<p>${head}${s.pts.length} points${extra}</p>`); continue; }
      const f = s.fit;
      if (!f || !f.ok) { out.push(`<p>${head}<span class="gm-warn">${esc(f ? f.reason : 'No points to fit.')}</span></p>`); continue; }
      const P = f.params;
      let eqn = ''; let more = '';
      if (f.type === 'linear') {
        const m = C.sig(P.m, 3); const c = C.toPlace(P.c, place);
        eqn = `${it(ys)} = ${m} ${it(xs)}${signed(c)}`;
        more = `gradient = ${m}${unit(C.divideUnits(yu, xu))}, &nbsp;<i>y</i>-intercept = ${c}${unit(yu)}`;
      } else if (f.type === 'quadratic') {
        eqn = `${it(ys)} = ${C.sig(P.a, 3)} ${it(xs)}²${signed(C.sig(P.b, 3))} ${it(xs)}${signed(C.sig(P.c, 3))}`;
        more = `<i>a</i> = ${C.sig(P.a, 3)}${unit(C.divideUnits(yu, xu, 2))}, <i>b</i> = ${C.sig(P.b, 3)}${unit(C.divideUnits(yu, xu))}, <i>c</i> = ${C.sig(P.c, 3)}${unit(yu)}`;
      } else if (f.type === 'power') {
        eqn = `${it(ys)} = ${C.sig(P.a, 3)} ${it(xs)}<sup>${C.sig(P.n, 3)}</sup>`;
        more = `<i>a</i> = ${C.sig(P.a, 3)}, <i>n</i> = ${C.sig(P.n, 3)}`;
      } else if (f.type === 'exponential') {
        eqn = `${it(ys)} = ${C.sig(P.a, 3)} e<sup>${C.sig(P.b, 3)} ${it(xs)}</sup>`;
        more = `<i>a</i> = ${C.sig(P.a, 3)}${unit(yu)}, <i>b</i> = ${C.sig(P.b, 3)}${unit(C.divideUnits('', xu))}`;
      }
      out.push(`<p>${head}<span class="gm-eqn">${eqn}</span>${extra}<br><span class="gm-small">${more}</span></p>`);
    }
    const notes = [];
    if (S.graph.fit !== 'none' && S.graph.fit !== 'linear') notes.push('A curved fit gives its constants to 3 significant figures. The steepest and shallowest lines (for the uncertainty) work for straight lines only, so linearise first if you need the uncertainty in a constant.');
    if (S.graph.fit === 'linear') notes.push('Values to 3 significant figures for now. Once you draw the steepest and shallowest lines (stage 4), they will be rounded to match their uncertainties.');
    for (const s of M.sets) {
      const left = s.pts.length - s.used.length;
      if (left > 1) notes.push(`${many ? esc(s.name) + ': ' : ''}${left} points are left out of the fit. Leave out at most one, and only if you can give a cause for it ("the graph looks better without it" is not a reason). Better still, measure that point again.`);
      else if (left === 1) notes.push(`${many ? esc(s.name) + ': one' : 'One'} point is left out of the fit (hollow). In your report, say which and give the cause you identified.`);
      const noBars = s.pts.length && s.pts.every((p) => !p.dy);
      if (noBars) notes.push(`${many ? esc(s.name) + ': no' : 'No'} uncertainty bars on the <i>y</i> values yet: give the <i>y</i> column an uncertainty in the table.`);
    }
    results.innerHTML = out.join('') + (notes.length ? `<ul class="gm-small gm-graph-notes">${notes.map((n) => `<li>${n}</li>`).join('')}</ul>` : '');
  }
  new ResizeObserver(() => scheduleGraph()).observe(canvas.parentElement);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setTimeout(scheduleGraph, 50));

  // ----- Messages -----
  let sayTimer = null;
  function say(text) {
    status.textContent = text;
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => { if (status.textContent === text) status.textContent = ''; }, 8000);
  }

  function renderAll() { renderTable(); renderProcess(); renderNotes(); scheduleGraph(); }
  renderAll();

  // For other pages (the IA builder) and for testing
  window.GraphMaker = { state: () => JSON.parse(JSON.stringify(S)), FORMAT, redraw: renderGraph, points: () => geo.points };
})();
