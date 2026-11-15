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

  // ----- The state (saved in localStorage and in the save file) -----
  const blankColumn = (heading = '') => ({ id: uid('c'), heading, sym: '', symAuto: true, noUnit: false, kind: 'raw', unc: '', uncSf: 1, rowUnc: false });
  const blankRow = () => ({ id: uid('r'), use: true, cells: {}, unc: {} });
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
    st.columns = st.columns.map((c) => ({ ...blankColumn(), ...c, id: String(c.id || uid('c')) }));
    st.sets = st.sets.slice(0, 5).map((s, i) => ({
      id: String(s.id || uid('s')), name: String(s.name || `Set ${i + 1}`),
      rows: (Array.isArray(s.rows) && s.rows.length ? s.rows : [blankRow()]).map((r) => ({ ...blankRow(), ...r, cells: { ...(r.cells || {}) }, unc: { ...(r.unc || {}) } })),
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
  // The cells of a row, in order, as "slots" (used for typing, Enter and pasting): [{ col, k }] with k = 'v' (value) or 'u' (row uncertainty)
  function slots() {
    const out = [];
    for (const c of S.columns) {
      out.push({ c, k: 'v' });
      if (c.rowUnc) out.push({ c, k: 'u' });
    }
    return out;
  }
  function renderTable() {
    syncSymbols();
    const sl = slots();
    const head = S.columns.map((c, j) => {
      const inf = info(c);
      return `<th scope="col" colspan="${c.rowUnc ? 2 : 1}" class="gm-th">
        <input class="gm-head" data-head="${c.id}" value="${esc(c.heading)}" placeholder="e.g. length L / m" aria-label="Heading of column ${j + 1}" autocomplete="off">
        <div class="gm-colmeta">
          <label title="The symbol formulas use for this column">symbol <input class="gm-sym" data-sym="${c.id}" value="${esc(c.sym)}" placeholder="L" aria-label="Symbol for column ${j + 1}" autocomplete="off" spellcheck="false"></label>
          <label title="The uncertainty of every value in this column">± <input class="gm-unc" data-unc="${c.id}" value="${esc(c.unc)}" placeholder="0.001 or 2%" inputmode="decimal" aria-label="Uncertainty for column ${j + 1}${inf.unitText ? ', in ' + esc(inf.unitText) : ''}" autocomplete="off"></label>
          <details class="gm-menu"><summary aria-label="More options for column ${j + 1}">⋯</summary>
            <div class="gm-menu-list">
              <label class="vlab-check"><input type="checkbox" data-opt="rowUnc" data-col="${c.id}" ${c.rowUnc ? 'checked' : ''}> A different uncertainty for some rows</label>
              <label class="vlab-check"><input type="checkbox" data-opt="uncSf" data-col="${c.id}" ${c.uncSf === 2 ? 'checked' : ''}> Round its uncertainty to 2 s.f.</label>
              <label class="vlab-check"><input type="checkbox" data-opt="noUnit" data-col="${c.id}" ${c.noUnit ? 'checked' : ''}> This quantity has no unit</label>
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
    const sub = S.columns.some((c) => c.rowUnc) ? `<tr class="gm-subhead"><th></th>${S.columns.map((c) => `<th>value</th>${c.rowUnc ? '<th>± this row</th>' : ''}`).join('')}<th></th></tr>` : '';
    const body = set().rows.map((r, i) => `<tr data-row="${r.id}"><th scope="row" class="gm-rowno">${i + 1}</th>${sl.map((s, k) => {
      const inf = info(s.c);
      const isU = s.k === 'u';
      const val = isU ? r.unc[s.c.id] : r.cells[s.c.id];
      const label = `Row ${i + 1}, ${inf.name || inf.symbol || 'column ' + (S.columns.indexOf(s.c) + 1)}${isU ? ', uncertainty' : ''}`;
      return `<td${isU ? ' class="gm-ucell"' : ''}><input data-r="${r.id}" data-c="${s.c.id}" data-k="${s.k}" data-slot="${k}" value="${esc(val)}" ${isU ? `placeholder="${esc(s.c.unc || '±')}"` : ''} inputmode="decimal" aria-label="${esc(label)}" autocomplete="off"></td>`;
    }).join('')}<td class="gm-rowdel"><button type="button" class="vlab-del" data-delrow="${r.id}" aria-label="Remove row ${i + 1}">×</button></td></tr>`).join('');
    wrap.innerHTML = `<table class="gm-table"><thead><tr><th class="gm-rowno" aria-label="Row number"></th>${head}<th aria-label="Remove a row"></th></tr>${sub}</thead><tbody>${body}</tbody></table>`;
  }

  // Typing in the table
  wrap.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.head) {
      const c = col(el.dataset.head); c.heading = el.value;
      if (c.symAuto) { c.sym = info(c).symbol; const s = $(`[data-sym="${c.id}"]`); if (s) s.value = c.sym; }
    } else if (el.dataset.sym) {
      const c = col(el.dataset.sym); c.sym = el.value.trim(); c.symAuto = !c.sym;
      if (c.symAuto) c.sym = info(c).symbol;
    } else if (el.dataset.unc) {
      col(el.dataset.unc).unc = el.value;
      $$(`.gm-ucell input[data-c="${el.dataset.unc}"]`).forEach((x) => { x.placeholder = el.value || '±'; });
    } else if (el.dataset.r) {
      const r = set().rows.find((x) => x.id === el.dataset.r);
      if (!r) return;
      (el.dataset.k === 'u' ? r.unc : r.cells)[el.dataset.c] = el.value;
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
      const c = col(b.dataset.delcol);
      if (S.columns.length <= 1) { say('A table needs at least one column.'); return; }
      remember('deleting a column');
      S.columns = S.columns.filter((x) => x !== c);
      for (const s of S.sets) for (const r of s.rows) { delete r.cells[c.id]; delete r.unc[c.id]; }
      renderTable(); changed();
      say(`Column "${c.heading || 'without a heading'}" deleted.`);
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
      hs.forEach((h, k) => { const s = sl[slotIndex + k]; if (s && s.k === 'v') { s.c.heading = h; s.c.symAuto = true; } });
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
        (s.k === 'u' ? rows[at].unc : rows[at].cells)[s.c.id] = v.replace(/^(-?\d+),(\d+)$/, '$1.$2');
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
    renderTable(); changed();
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
    // keep the existing columns (and their uncertainties) where there are enough; the file's headings replace theirs
    if (S.sets.length === 1) S.columns = S.columns.slice(0, Math.max(1, width)).map((c) => ({ ...c, rowUnc: false }));
    set().rows = [];
    fillGrid(grid, 0, 0, headings);
    renderTable(); changed();
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
    say('Example loaded: a pendulum experiment with made-up readings.');
  });
  // A made-up pendulum experiment, for trying the tool out.
  function example() {
    const st = blankState();
    const L = { ...blankColumn('length L / m'), unc: '0.002' };
    const t = { ...blankColumn('time for 10 swings t / s'), unc: '0.2' };
    st.columns = [L, t];
    const data = [['0.200', '9.0'], ['0.300', '11.0'], ['0.400', '12.7'], ['0.500', '14.2'], ['0.600', '15.6'], ['0.700', '16.8']];
    st.sets[0].rows = data.map(([a, b]) => ({ ...blankRow(), cells: { [L.id]: a, [t.id]: b } }));
    st.title = 'Time for 10 swings against length';
    st.graph.x = L.id; st.graph.y = t.id;
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
      const values = S.sets.flatMap((s) => s.rows.map((r) => r.cells[c.id])).filter((v) => v !== undefined && String(v).trim());
      if (!c.heading.trim()) { if (values.length) notes.push(`${name} has no heading. Write it as quantity, symbol and unit, e.g. <em>length L / m</em>.`); return; }
      if (inf.style === 'brackets') notes.push(`${name}: IB style puts the unit after a slash, e.g. <em>length L / m</em> rather than <em>Length (m)</em>.`);
      else if (!inf.hasUnit && !c.noUnit) notes.push(`${name} has no unit. Add it after " / ", e.g. <em>length L / m</em>. If the quantity really has no unit (a count, or a logarithm), tick "This quantity has no unit" in the column's ⋯ menu.`);
      if (!c.sym) notes.push(`${name} has no symbol. Give it a short one (such as <em>L</em> or <em>T2</em>) in the "symbol" box, so formulas can use it.`);
      else if (!C.isName(c.sym)) notes.push(`${name}: the symbol "${esc(c.sym)}" can only use letters, digits and _, and must start with a letter (for example <em>T2</em> for T²).`);
      else if (seen[c.sym]) notes.push(`${seen[c.sym]} and ${name} have the same symbol, <em>${esc(c.sym)}</em>. Give each column its own.`);
      if (c.sym) seen[c.sym] = name;
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

  // ----- Messages -----
  let sayTimer = null;
  function say(text) {
    status.textContent = text;
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => { if (status.textContent === text) status.textContent = ''; }, 8000);
  }

  function renderAll() { renderTable(); renderNotes(); }
  renderAll();

  // For other pages (the IA builder) and for testing
  window.GraphMaker = { state: () => JSON.parse(JSON.stringify(S)), FORMAT };
})();
