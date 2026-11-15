// IA builder (experimental/ia-builder.html): students build their IA report section by section.
// Plan and decisions: docs/IA_BUILDER_PLAN.md. Sections, prompts and checklists: js/ia/sections.js.
// Everything stays in this browser (IndexedDB). No server, no accounts, no AI: the tool never writes content.
//
// How it fits together:
//   store            the browser database (IAs, and pictures as separate records)
//   clean / inline   every piece of text is cleaned to the few formats the builder allows
//   walk(ia)         the whole report in Word-file order: numbers figures, tables and citations, and gives the word count
//   richText         a text box with basic formatting (and the Cite button)
//   field / miniBar  one-line or short boxes (table cells, captions) with italic, sub- and superscript
//   pictureEditor, tableEditor, blocksEditor, variablesEditor, methodEditor, storyEditor, evaluationEditor, referencesEditor
(() => {
  const root = document.getElementById('iab');
  if (!root || !window.IA_SECTIONS) return;
  const SECTIONS = window.IA_SECTIONS;
  const SEC = Object.fromEntries(SECTIONS.map(s => [s.id, s]));
  const COUNT_EVALUATION_TABLE = true;   // the evaluation table is prose, so it is counted (plan, section 4)
  const MAX_IMAGE_WIDTH = 1600;

  // ---------- small helpers ----------
  const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(kid));
    return el;
  }
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } };
  const fmtNum = n => n.toLocaleString('en-GB');
  const plain = html => { const d = document.createElement('div'); d.innerHTML = html || ''; return d.textContent.trim(); };
  const move = (list, i, j) => { if (j < 0 || j >= list.length) return; const [x] = list.splice(i, 1); list.splice(j, 0, x); };
  const button = (label, onclick, cls = 'button secondary', extra = {}) => h('button', Object.assign({ type: 'button', class: cls, onclick }, extra), label);
  const linkButton = (label, onclick, extra = {}) => button(label, onclick, 'iab-linkbtn' + (extra.danger ? ' danger' : ''), Object.assign({}, extra, { danger: null }));

  // ---------- storage: IndexedDB (the browser's own database; big enough for pictures) ----------
  const store = (() => {
    let dbp = null, memory = null;
    function open() {
      if (dbp) return dbp;
      dbp = new Promise((resolve, reject) => {
        try {
          const req = indexedDB.open('ia-builder', 1);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('ias')) db.createObjectStore('ias', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('images')) db.createObjectStore('images', { keyPath: 'id' });
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        } catch (e) { reject(e); }
      });
      return dbp;
    }
    const tx = (name, mode, fn) => open().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(name, mode), s = t.objectStore(name);
      const r = fn(s);
      t.oncomplete = () => resolve(r && r.result);
      t.onerror = t.onabort = () => reject(t.error);
    }));
    // If IndexedDB is blocked (some private windows), keep the work in memory and say so.
    const mem = () => (memory = memory || { ias: new Map(), images: new Map() });
    const run = async (name, mode, fn, fallback) => {
      if (memory) return fallback(mem()[name]);
      try { return await tx(name, mode, fn); } catch (e) { return fallback(mem()[name]); }
    };
    return {
      all: () => run('ias', 'readonly', s => s.getAll(), m => [...m.values()]).then(r => r || []),
      put: ia => run('ias', 'readwrite', s => s.put(ia), m => { m.set(ia.id, ia); throw new Error('memory'); }),
      remove: id => run('ias', 'readwrite', s => s.delete(id), m => { m.delete(id); }),
      putImage: rec => run('images', 'readwrite', s => s.put(rec), m => { m.set(rec.id, rec); }),
      getImage: id => run('images', 'readonly', s => s.get(id), m => m.get(id)),
      removeImage: id => run('images', 'readwrite', s => s.delete(id), m => { m.delete(id); }),
      allImages: () => run('images', 'readonly', s => s.getAll(), m => [...m.values()]).then(r => r || []),
      get memoryOnly() { return !!memory; },
    };
  })();

  // Pictures: shown from object URLs made from the stored files
  const imageUrls = new Map();
  async function imageUrl(id) {
    if (imageUrls.has(id)) return imageUrls.get(id);
    const rec = await store.getImage(id);
    if (!rec) return null;
    const url = URL.createObjectURL(rec.blob);
    imageUrls.set(id, url);
    return url;
  }
  // Shrink big pictures (at most MAX_IMAGE_WIDTH wide) so the IA, its save file and the Word file stay a sensible size.
  async function readPicture(file) {
    if (!/^image\/(png|jpeg)$/.test(file.type)) throw new Error('Please choose a PNG or JPG picture.');
    if (file.size > 25e6) throw new Error('That picture is too big (over 25 MB). Please make it smaller first.');
    const bmp = await createImageBitmap(file);
    let { width: w, height: hgt } = bmp, blob = file;
    if (w > MAX_IMAGE_WIDTH || (file.type === 'image/jpeg' && file.size > 1.5e6)) {
      const k = Math.min(1, MAX_IMAGE_WIDTH / w);
      w = Math.round(w * k); hgt = Math.round(hgt * k);
      const c = document.createElement('canvas'); c.width = w; c.height = hgt;
      const g = c.getContext('2d');
      if (file.type === 'image/jpeg') { g.fillStyle = '#fff'; g.fillRect(0, 0, w, hgt); }
      g.drawImage(bmp, 0, 0, w, hgt);
      blob = await new Promise(r => c.toBlob(r, file.type, 0.85));
    }
    bmp.close && bmp.close();
    return { blob, type: file.type, w, h: hgt };
  }

  // ---------- one IA ----------
  const textBlock = () => ({ id: uid('b'), type: 'text', html: '' });
  function newIA(name) {
    const now = new Date().toISOString();
    return {
      id: uid('ia-'), name: name || 'My IA', created: now, updated: now, lastDownload: null,
      settings: { rqPlace: 'before', kind: 'relationship', wideMargins: false },
      front: { title: '', code: '', group: '' },
      s: {}, refs: [], ticks: {}, ui: { current: 'rq', hideChecklists: false },
    };
  }
  const VAR_FIELDS = ['quantity', 'instrument', 'precision', 'range', 'interval', 'repeats', 'how'];
  // Make sure every section has its data, whatever version saved the IA.
  function upgrade(ia) {
    ia.settings = Object.assign({ rqPlace: 'before', kind: 'relationship', wideMargins: false }, ia.settings);
    ia.front = Object.assign({ title: '', code: '', group: '' }, ia.front);
    ia.s = ia.s || {}; ia.ticks = ia.ticks || {}; ia.refs = ia.refs || [];
    ia.ui = Object.assign({ current: 'rq', hideChecklists: false }, ia.ui);
    for (const sec of SECTIONS) {
      const d = ia.s[sec.id] = ia.s[sec.id] || {};
      if (sec.kind === 'rq') d.text = d.text || '';
      if (sec.kind === 'blocks' || sec.kind === 'hypothesis') d.blocks = d.blocks && d.blocks.length ? d.blocks : [textBlock()];
      if (sec.kind === 'variables') {
        for (const k of ['iv', 'dv']) d[k] = Object.assign(Object.fromEntries(VAR_FIELDS.map(f => [f, ''])), d[k]);
        d.controls = d.controls || [];
        d.why = Object.assign({ range: '', interval: '', repeats: '', precision: '' }, d.why);
        d.whyControls = d.whyControls || {};
        d.extra = d.extra || [];
        d.captions = Object.assign({ main: 'The independent and dependent variables', controls: 'The control variables' }, d.captions);
      }
      if (sec.kind === 'method') { d.top = d.top || []; d.steps = d.steps && d.steps.length ? d.steps : [{ id: uid('st'), html: '' }]; }
      if (sec.kind === 'story') d.steps = d.steps || [];
      if (sec.kind === 'evaluation') {
        d.rows = d.rows && d.rows.length ? d.rows : [{ id: uid('ev'), weak: '', data: '', concl: '', improve: '' }];
        d.most = d.most || ''; d.caption = d.caption == null ? 'Weaknesses, their effects and improvements' : d.caption;
      }
    }
    return ia;
  }

  // ---------- cleaning text: only the formats the builder allows ----------
  // Allowed: p, h3, h4, ul, ol, li, b, i, sub, sup, br, and equation / citation markers (span[data-eq], span[data-cite]).
  // Everything typed, pasted or read from a file goes through this, so nothing else can get into the page or the report.
  const INLINE = { B: 'b', STRONG: 'b', I: 'i', EM: 'i', SUB: 'sub', SUP: 'sup' };
  const DROP = new Set(['SCRIPT', 'STYLE', 'TITLE', 'META', 'LINK', 'IMG', 'SVG', 'VIDEO', 'AUDIO', 'IFRAME', 'OBJECT', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'HEAD', 'TEMPLATE']);
  const BLOCK = new Set(['P', 'DIV', 'SECTION', 'ARTICLE', 'BLOCKQUOTE', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE', 'FIGURE', 'FIGCAPTION', 'PRE', 'TABLE', 'TBODY', 'THEAD', 'TR', 'TD', 'TH', 'DL', 'DT', 'DD', 'CENTER']);
  function clean(html) {
    const doc = new DOMParser().parseFromString('<body>' + (html || '') + '</body>', 'text/html');
    const out = [];
    let cur = '';                                   // the paragraph being built
    const flush = (tag = 'p') => { const t = cur.replace(/^(\s|<br>)+|(\s|<br>)+$/g, ''); if (t) out.push(`<${tag}>${t}</${tag}>`); cur = ''; };
    function inline(node) {                         // the inline content of a node, as clean HTML
      let s = '';
      for (const n of node.childNodes) {
        if (n.nodeType === 3) { s += esc(n.nodeValue.replace(/[\s ]+/g, ' ')); continue; }
        if (n.nodeType !== 1 || DROP.has(n.nodeName)) continue;
        if (n.nodeName === 'BR') { s += '<br>'; continue; }
        if (n.nodeName === 'UL' || n.nodeName === 'OL') continue;   // a list inside a list item: collect() below handles it
        if (n.nodeName === 'SPAN' && n.hasAttribute('data-eq')) { s += `<span data-eq="${esc(n.getAttribute('data-eq'))}"${n.getAttribute('data-display') === '1' ? ' data-display="1"' : ''}></span>`; continue; }
        if (n.nodeName === 'SPAN' && n.hasAttribute('data-cite')) { s += `<span data-cite="${esc(n.getAttribute('data-cite'))}"></span>`; continue; }
        let inner = inline(n);
        if (!inner) continue;
        const st = n.style || {};
        const wraps = [];
        let tag = INLINE[n.nodeName];
        if (n.nodeName === 'B' && /^(normal|[1-5]00)$/.test(st.fontWeight || '')) tag = null;   // Google Docs wraps pastes in <b style="font-weight:normal">
        if (tag) wraps.push(tag);
        if (tag !== 'b' && /^(bold|[6-9]00)$/.test(st.fontWeight || '')) wraps.push('b');
        if (st.fontStyle === 'italic' && tag !== 'i') wraps.push('i');
        if (/^sub/.test(st.verticalAlign || '') && tag !== 'sub') wraps.push('sub');
        if (/^super/.test(st.verticalAlign || '') && tag !== 'sup') wraps.push('sup');
        for (const w of wraps) inner = `<${w}>${inner}</${w}>`;
        s += inner;
      }
      return s;
    }
    function block(node) {
      for (const n of node.childNodes) {
        if (n.nodeType === 3) { cur += esc(n.nodeValue.replace(/[\s ]+/g, ' ')); continue; }
        if (n.nodeType !== 1 || DROP.has(n.nodeName)) continue;
        const name = n.nodeName;
        if (/^H[1-6]$/.test(name)) { flush(); cur = inline(n); flush(+name[1] <= 3 ? 'h3' : 'h4'); continue; }
        if (name === 'UL' || name === 'OL') {
          flush();
          const items = [];
          const collect = list => { for (const li of list.children) { if (li.nodeName === 'LI') { const t = inline(li).replace(/^(\s|<br>)+|(\s|<br>)+$/g, ''); if (t) items.push(`<li>${t}</li>`); li.querySelectorAll(':scope > ul, :scope > ol').forEach(collect); } else if (li.nodeName === 'UL' || li.nodeName === 'OL') collect(li); } };
          collect(n);
          if (items.length) out.push(`<${name.toLowerCase()}>${items.join('')}</${name.toLowerCase()}>`);
          continue;
        }
        if (name === 'LI') { flush(); cur = inline(n); flush(); continue; }
        if (BLOCK.has(name)) { flush(); block(n); flush(); continue; }
        cur += inline({ childNodes: [n] });
      }
    }
    block(doc.body);
    flush();
    return out.join('');
  }
  // For short boxes (table cells, captions): the same formats, but no paragraphs, headings or lists (lines kept as <br>).
  function cleanInline(html) {
    return clean(html).replace(/<\/(p|h3|h4|li)>(?=.)/g, '<br>').replace(/<\/?(p|h3|h4|ul|ol|li)>/g, '').replace(/^(<br>)+|(<br>)+$/g, '');
  }

  // ---------- the word count (what the IB guide counts) ----------
  // Left out, as the guide says: charts and diagrams, data tables, equations and calculations, citations and references,
  // the bibliography, and headers (headings, sub-headings, the title). Captions are left out too (teacher's decision).
  function wordsIn(html) {
    if (!html) return 0;
    const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
    doc.querySelectorAll('h3, h4, [data-eq], [data-cite]').forEach(e => e.remove());
    doc.querySelectorAll('p, li, br').forEach(e => e.after(' '));
    return (doc.body.textContent.match(/\S+/g) || []).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
  }

  // ---------- the whole report, in the order of the Word file ----------
  // Returns a list of { sec, kind: 'html' | 'figure' | 'table', html, block, count }.
  // Used for figure, table and citation numbers and for the word count (and, in stage 4, the Word file).
  function sectionOrder(ia) {
    const ids = SECTIONS.map(s => s.id).filter(id => id !== 'rq');
    if (ia.settings.rqPlace === 'after') ids.splice(ids.indexOf('background') + 1, 0, 'rq');
    else if (ia.settings.rqPlace === 'before') ids.unshift('rq');
    return ids;                                     // 'inside': the research question is added at the end of the background
  }
  function walk(ia) {
    const out = [];
    const add = (sec, kind, x, count = true) => out.push(Object.assign({ sec, kind, count }, x));
    const blocks = (sec, list) => (list || []).forEach(b => {
      if (b.type === 'text') add(sec, 'html', { html: b.html });
      else if (b.type === 'image') add(sec, 'figure', { block: b });
      else if (b.type === 'table') add(sec, 'table', { block: b });
    });
    for (const id of sectionOrder(ia)) {
      const sec = SEC[id], d = ia.s[id];
      if (sec.kind === 'rq') add(id, 'html', { html: d.text });
      if (sec.kind === 'blocks' || sec.kind === 'hypothesis') blocks(id, d.blocks);
      if (id === 'background' && ia.settings.rqPlace === 'inside') add('rq', 'html', { html: ia.s.rq.text });
      if (sec.kind === 'variables') {
        add(id, 'table', { block: { id: 'var-main', caption: d.captions.main } });
        if (d.controls.length) add(id, 'table', { block: { id: 'var-controls', caption: d.captions.controls } });
        for (const k of ['range', 'interval', 'repeats', 'precision']) add(id, 'html', { html: d.why[k] });
        for (const c of d.controls) add(id, 'html', { html: d.whyControls[c.id] });
        blocks(id, d.extra);
      }
      if (sec.kind === 'method') { blocks(id, d.top); d.steps.forEach(st => add(id, 'html', { html: st.html })); }
      if (sec.kind === 'story') d.steps.forEach(st => {
        add(id, 'html', { html: st.intro });
        if (st.item && st.item.type === 'table') add(id, 'table', { block: st.item });
        if (st.item && st.item.type === 'image') add(id, 'figure', { block: st.item });
        if (st.item && st.item.type === 'calc') blocks(id, st.item.blocks);
        if (st.item && !st.explainHidden) add(id, 'html', { html: st.explain });
      });
      if (sec.kind === 'evaluation') {
        add(id, 'table', { block: { id: 'eval', caption: d.caption } });
        d.rows.forEach(r => ['weak', 'data', 'concl', 'improve'].forEach(k => add(id, 'html', { html: r[k] }, COUNT_EVALUATION_TABLE)));
        add(id, 'html', { html: d.most });
      }
    }
    return out;
  }
  // Figure, table and citation numbers
  function numbering(ia) {
    const fig = {}, tab = {}, cite = {};
    let f = 0, t = 0, c = 0;
    const cites = html => { for (const m of String(html || '').matchAll(/data-cite="([^"]+)"/g)) if (!(m[1] in cite) && ia.refs.some(r => r.id === m[1])) cite[m[1]] = ++c; };
    for (const e of walk(ia)) {
      if (e.kind === 'figure') { fig[e.block.id] = ++f; cites(e.block.caption); }
      if (e.kind === 'table') { tab[e.block.id] = ++t; cites(e.block.caption); }
      if (e.kind === 'html') cites(e.html);
    }
    return { fig, tab, cite };
  }
  // References in the order of the Word file: cited ones by first citation, then any not yet cited
  function orderedRefs(ia, nums) {
    const cited = ia.refs.filter(r => r.id in nums.cite).sort((a, b) => nums.cite[a.id] - nums.cite[b.id]);
    return [...cited, ...ia.refs.filter(r => !(r.id in nums.cite))];
  }
  function sectionWords(ia, secId) {
    return walk(ia).reduce((n, e) => n + (e.sec === secId && e.kind === 'html' && e.count ? wordsIn(e.html) : 0), 0);
  }
  const totalWords = ia => walk(ia).reduce((n, e) => n + (e.kind === 'html' && e.count ? wordsIn(e.html) : 0), 0);

  // ---------- the app's state ----------
  let ias = [], ia = null, saveTimer = null;
  const status = h('span', { class: 'iab-status', role: 'status' });
  const wordsEl = h('span', { class: 'iab-words' });
  const sidebar = h('nav', { class: 'iab-side', 'aria-label': 'Sections of your IA' });
  const picker = h('select', { class: 'iab-picker', 'aria-label': 'Go to section', onchange: e => go(e.target.value) });
  const view = h('div', { class: 'iab-view' });
  const iaMenu = h('details', { class: 'iab-menu' });

  function setStatus(text, bad) { status.textContent = text; status.classList.toggle('bad', !!bad); }
  const BLOCKED = 'This browser is blocking storage, so your work is NOT being saved. Use "Save progress" to keep a copy.';
  // Every change is also copied straight away into localStorage (it saves instantly, even while the page is closing,
  // which the browser database can't promise). start() uses that copy if it is newer than the database's.
  const BACKUP = 'iab-backup';
  function backup() { try { localStorage.setItem(BACKUP, JSON.stringify(ia)); } catch (e) { /* storage full or blocked: the database copy still saves */ } }
  function save(now) {
    ia.updated = new Date().toISOString();
    backup();
    clearTimeout(saveTimer);
    setStatus('Saving…');
    const go = () => { saveTimer = null; store.put(ia).then(() => setStatus('Saved in this browser ✓'), () => setStatus(store.memoryOnly ? BLOCKED : 'Couldn\'t save in this browser. Use "Save progress" to keep a copy.', true)); };
    if (now) go(); else saveTimer = setTimeout(go, 300);
    refresh();
  }
  const saveNow = () => { if (!ia) return; flushAll(); if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; store.put(ia).catch(() => {}); } };
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });
  addEventListener('pagehide', saveNow);

  // Update everything that depends on the whole report: word counts, ticks, figure/table/citation numbers.
  let refreshTimer = null;
  function refresh() { clearTimeout(refreshTimer); refreshTimer = setTimeout(refreshNow, 120); }
  function refreshNow() {
    const n = totalWords(ia);
    wordsEl.innerHTML = `<strong>${fmtNum(n)}</strong> word${n === 1 ? '' : 's'}`;
    for (const sec of SECTIONS) {
      const li = sidebar.querySelector(`[data-sec="${sec.id}"]`);
      if (!li) continue;
      const w = sectionWords(ia, sec.id), list = checklistFor(sec), done = list.filter(([id]) => ia.ticks[id]).length;
      li.querySelector('.iab-side-words').textContent = w ? `${fmtNum(w)} words` : '';
      const p = li.querySelector('.iab-side-ticks');
      p.textContent = `${done}/${list.length}`;
      p.title = `${done} of ${list.length} checklist items ticked`;
      p.classList.toggle('all', done === list.length);
    }
    const nums = numbering(ia);
    view.querySelectorAll('[data-fignum]').forEach(e => { const k = nums.fig[e.dataset.fignum]; e.textContent = k ? `Figure ${k}:` : 'Figure:'; });
    view.querySelectorAll('[data-tabnum]').forEach(e => { const k = nums.tab[e.dataset.tabnum]; e.textContent = k ? `Table ${k}:` : 'Table:'; });
    view.querySelectorAll('[data-cite]').forEach(e => { const k = nums.cite[e.dataset.cite]; e.textContent = k ? `[${k}]` : '[?]'; e.title = k ? 'Citation of reference ' + k : 'This reference has been deleted'; });
    view.querySelectorAll('[data-refnum]').forEach(e => { const k = nums.cite[e.dataset.refnum]; e.textContent = k ? `[${k}]` : '[–]'; });
    view.querySelectorAll('[data-refwarn]').forEach(e => { e.hidden = e.dataset.refwarn in nums.cite; });
  }

  function checklistFor(sec) { return sec.kind === 'hypothesis' ? sec.versions[ia.settings.kind].checklist : sec.checklist; }

  // Typing is saved 0.4 s after the last key. Anything still waiting is saved before a part of the page is redrawn,
  // so a redraw (moving a row, adding a step…) never shows old text.
  const pending = new Set();
  const flushAll = () => [...pending].forEach(f => f());

  // ---------- a text box with basic formatting ----------
  // opts: { label, placeholder, simple (no headings or lists), cite (default true), onInput(html), onEnter() }
  const TOOLS = [
    { cmd: 'bold', label: 'B', title: 'Bold (Ctrl+B)', cls: 'b' },
    { cmd: 'italic', label: 'I', title: 'Italic (Ctrl+I)', cls: 'i' },
    { cmd: 'subscript', label: 'x₂', title: 'Subscript' },
    { cmd: 'superscript', label: 'x²', title: 'Superscript' },
    { cmd: 'insertUnorderedList', label: '• List', title: 'Bullet list', full: true },
    { cmd: 'insertOrderedList', label: '1. List', title: 'Numbered list', full: true },
    { cmd: 'h3', label: 'Heading', title: 'Sub-heading', full: true, block: true },
    { cmd: 'h4', label: 'Small heading', title: 'Smaller sub-heading', full: true, block: true },
  ];
  // Put an equation or citation exactly where the cursor was (range), or at the end of the box, with the cursor after it.
  function insertAt(box, range, html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const nodes = [...tpl.content.childNodes];
    let r = range && box.contains(range.startContainer) ? range : null;
    if (!r) {
      r = document.createRange();
      const last = box.lastElementChild;
      if (last && /^(P|H3|H4)$/.test(last.nodeName)) r.selectNodeContents(last); else if (last && /^(UL|OL)$/.test(last.nodeName) && last.lastElementChild) r.selectNodeContents(last.lastElementChild);
      else { if (!box.firstChild) box.append(document.createElement('p')); r.selectNodeContents(box.lastElementChild || box); }
      r.collapse(false);
    }
    if (r.startContainer === box) {                 // the cursor is between paragraphs: make a paragraph for it
      const p = document.createElement('p');
      r.insertNode(p); r.selectNodeContents(p);
    }
    r.deleteContents();
    nodes.slice().reverse().forEach(n => r.insertNode(n));
    const after = document.createRange();
    after.setStartAfter(nodes[nodes.length - 1]); after.collapse(true);
    box.focus();
    const s = document.getSelection(); s.removeAllRanges(); s.addRange(after);
  }
  function prepSpecial(box) {
    box.querySelectorAll('[data-cite]').forEach(s => { s.contentEditable = 'false'; s.className = 'iab-cite'; });
    box.querySelectorAll('[data-eq]').forEach(s => {
      if (s.dataset.drawn === s.dataset.eq + '|' + (s.dataset.display || '')) return;
      s.contentEditable = 'false'; s.className = 'iab-eq'; s.tabIndex = 0; s.setAttribute('role', 'button');
      s.setAttribute('aria-label', 'Equation: ' + s.dataset.eq + '. Press Enter to edit it.');
      drawEquation(s);
    });
  }

  // ---------- equations ----------
  // Shown on the page with the site's MathJax; written and edited with MathLive (loaded only when the editor first opens).
  // Each equation is stored as LaTeX in <span data-eq="…"> (data-display="1": on its own line) and must convert to a Word equation.
  async function drawEquation(s) {
    const latex = s.dataset.eq, display = s.dataset.display === '1';
    s.dataset.drawn = latex + '|' + (s.dataset.display || '');
    s.textContent = latex;                          // until MathJax has drawn it
    try {
      await MathJax.startup.promise;
      const node = await MathJax.tex2chtmlPromise(latex, { display });
      if (s.dataset.eq !== latex) return;           // changed while drawing
      s.textContent = '';
      s.append(node);
      MathJax.startup.document.clear();
      MathJax.startup.document.updateDocument();   // adds MathJax's styles for the new equation
    } catch (e) { /* the LaTeX stays visible */ }
  }
  const MATHLIVE = 'https://cdn.jsdelivr.net/npm/mathlive@0.111.4/';   // version agreed with the teacher (plan, section 7)
  let mathlive = null;
  function loadMathLive() {
    if (mathlive) return mathlive;
    mathlive = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = MATHLIVE + 'mathlive.min.js';
      s.onload = () => {
        const M = (window.MathLive && window.MathLive.MathfieldElement) || window.MathfieldElement;
        if (!M) { mathlive = null; reject(new Error('MathLive')); return; }
        M.fontsDirectory = MATHLIVE + 'fonts/';
        M.soundsDirectory = null; M.keypressSound = null; M.plonkSound = null;
        resolve(M);
      };
      s.onerror = () => { mathlive = null; s.remove(); reject(new Error('load')); };
      document.head.append(s);
    });
    return mathlive;
  }
  // MathLive sometimes writes its own commands; turn them into ordinary LaTeX that MathJax and Word both understand.
  function tidyLatex(t) {
    return String(t || '')
      .replace(/\\mleft/g, '\\left').replace(/\\mright/g, '\\right')
      .replace(/\\exponentialE/g, 'e').replace(/\\differentialD/g, 'd').replace(/\\imaginaryI/g, 'i')
      .replace(/\\lbrack\b/g, '[').replace(/\\rbrack\b/g, ']').replace(/\\lbrace\b/g, '\\{').replace(/\\rbrace\b/g, '\\}')
      .replace(/\\[lr]?vert\b/g, '|').replace(/\\lparen\b/g, '(').replace(/\\rparen\b/g, ')')
      .replace(/\\(enspace|enskip)\b/g, '\\;').replace(/\\degree\b/g, '^{\\circ}').replace(/\\differentialD/g, 'd')
      .replace(/\\displaystyle\s*/g, '')
      .trim();
  }
  // Problems that would stop the equation going into Word (or showing on the page)
  function equationProblem(latex) {
    if (!latex) return 'The equation is empty.';
    if (/\\placeholder|\{\s*\}/.test(latex)) return 'Fill in (or delete) the empty boxes first.';
    const bad = window.Omml ? window.Omml.unsupported(latex) : [];
    if (bad.length) return `Word can't take ${bad.length === 1 ? 'this part' : 'these parts'} yet: ${bad.join(' ')}. Please write it another way, or ask your teacher.`;
    try { if (/merror/.test(MathJax.tex2mml(latex))) return 'Part of this equation can\'t be read. Please check it.'; } catch (e) { /* MathJax not ready: skip this check */ }
    return '';
  }
  // The click-to-build buttons. '#0' = what's selected (or an empty box if nothing is), '#?' = an empty box to fill in.
  // A power or subscript attaches to whatever is just before the cursor.
  const EQ_TOOLS = [
    ['Build', [['a⁄b', '\\frac{#0}{#?}', 'Fraction'], ['xⁿ', '^{#?}', 'Power'], ['xₙ', '_{#?}', 'Subscript'], ['√x', '\\sqrt{#0}', 'Square root'], ['ⁿ√x', '\\sqrt[#?]{#0}', 'Root'],
      ['( )', '\\left(#0\\right)', 'Brackets'], ['x̄', '\\overline{#0}', 'Bar (mean)'], ['eˣ', 'e^{#?}', 'e to a power'], ['unit', '\\mathrm{#?}', 'Unit: upright letters, e.g. m s'], ['words', '\\text{#?}', 'Words']]],
    ['Symbols', [['×', '\\times'], ['÷', '\\div'], ['·', '\\cdot'], ['±', '\\pm'], ['≈', '\\approx'], ['∝', '\\propto'], ['≠', '\\neq'], ['≤', '\\le'], ['≥', '\\ge'],
      ['→', '\\rightarrow'], ['°', '^{\\circ}', 'Degrees'], ['∞', '\\infty'], ['%', '\\%']]],
    ['Greek', [['Δ', '\\Delta'], ['α', '\\alpha'], ['β', '\\beta'], ['γ', '\\gamma'], ['δ', '\\delta'], ['ε', '\\varepsilon'], ['η', '\\eta'], ['θ', '\\theta'], ['λ', '\\lambda'],
      ['μ', '\\mu'], ['π', '\\pi'], ['ρ', '\\rho'], ['σ', '\\sigma'], ['τ', '\\tau'], ['φ', '\\varphi'], ['ω', '\\omega'], ['Ω', '\\Omega']]],
    ['Functions', [['sin', '\\sin'], ['cos', '\\cos'], ['tan', '\\tan'], ['sin⁻¹', '\\sin^{-1}'], ['ln', '\\ln'], ['log', '\\log']]],
  ];
  const EQ_SHORTCUTS = Object.assign(
    Object.fromEntries('alpha beta gamma delta Delta eta theta lambda mu pi rho sigma tau omega Omega Phi Theta Lambda Sigma'.split(' ').map(g => [g, '\\' + g])),
    { epsilon: '\\varepsilon', phi: '\\varphi', sin: '\\sin', cos: '\\cos', tan: '\\tan', ln: '\\ln', log: '\\log', sqrt: '\\sqrt{#0}',
      '+-': '\\pm', '<=': '\\le', '>=': '\\ge', '!=': '\\neq', '->': '\\rightarrow', infty: '\\infty' });
  // Opens the editor. Resolves with { latex, display }, { remove: true }, or null (cancelled).
  function equationEditor({ latex = '', display = true, editing = false } = {}) {
    return new Promise(resolve => {
      const back = document.activeElement;
      const msg = h('p', { class: 'iab-eqmsg', role: 'alert' });
      const holder = h('div', { class: 'iab-eqfield' }, h('p', { class: 'iab-note' }, 'Loading the equation editor…'));
      const disp = h('fieldset', { class: 'iab-eqdisplay' }, h('legend', {}, 'Where does it go?'),
        h('label', {}, h('input', { type: 'radio', name: 'eqdisp', value: '1', checked: display }), ' On its own line'),
        h('label', {}, h('input', { type: 'radio', name: 'eqdisp', value: '0', checked: !display }), ' Inside the sentence'));
      let mf = null;
      // MathLive's on-screen keyboard sits at the bottom of the window (above this editor: --keyboard-zindex in the CSS);
      // leave room for it so the buttons stay reachable.
      const kbRoom = () => { const k = window.mathVirtualKeyboard; panel.style.paddingBottom = k && k.visible ? (k.boundingRect.height + 16) + 'px' : ''; };
      const close = result => {
        try { if (window.mathVirtualKeyboard) { window.mathVirtualKeyboard.hide(); window.mathVirtualKeyboard.removeEventListener('geometrychange', kbRoom); } } catch (e) { /* ignore */ }
        removeEventListener('keydown', onKey, true);
        panel.remove();
        if (back && back.focus) back.focus();
        resolve(result);
      };
      const onKey = e => { if (e.key === 'Escape' && !(window.mathVirtualKeyboard && window.mathVirtualKeyboard.visible)) { e.preventDefault(); close(null); } };
      const done = () => {
        if (!mf) return;
        const t = tidyLatex(mf.getValue('latex-expanded'));
        const p = equationProblem(t);
        if (p) { msg.textContent = p; return; }
        close({ latex: t, display: disp.querySelector('input:checked').value === '1' });
      };
      const palette = h('div', { class: 'iab-eqtools' }, EQ_TOOLS.map(([group, tools]) => h('div', { class: 'iab-eqgroup', role: 'group', 'aria-label': group },
        h('span', { class: 'iab-eqgroup-h' }, group),
        tools.map(([label, tex, title]) => h('button', { type: 'button', class: 'iab-eqbtn', title: title || label, 'aria-label': title || label, onmousedown: e => e.preventDefault(),
          onclick: () => { if (!mf) return; mf.insert(tex, { format: 'latex', selectionMode: /#[?0]/.test(tex) ? 'placeholder' : 'after' }); mf.focus(); msg.textContent = ''; } }, label)))));
      const kbBtn = button('On-screen keyboard', () => {
        try {
          const k = window.mathVirtualKeyboard;
          k.removeEventListener('geometrychange', kbRoom); k.addEventListener('geometrychange', kbRoom);
          if (k.visible) k.hide(); else { if (mf) mf.focus(); k.show(); }
          setTimeout(kbRoom, 300);
        } catch (e) { /* ignore */ }
      }, 'iab-linkbtn');
      const panel = h('div', { class: 'iab-eqpanel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'iab-eqtitle' },
        h('div', { class: 'iab-eqbox' },
          h('h3', { id: 'iab-eqtitle' }, editing ? 'Edit the equation' : 'Insert an equation'),
          holder, palette,
          h('p', { class: 'iab-note' }, 'Click the buttons to build it, or type: / makes a fraction, ^ a power, _ a subscript; type a Greek letter\'s name (e.g. lambda). Use "unit" for units, so they are upright: m s', h('sup', {}, '−1'), '. ', kbBtn),
          disp, msg,
          h('div', { class: 'iab-eqactions' },
            button(editing ? 'Save' : 'Insert', done, 'button'),
            button('Cancel', () => close(null)),
            editing ? button('Delete the equation', () => close({ remove: true }), 'button secondary danger') : null)));
      document.body.append(panel);
      addEventListener('keydown', onKey, true);
      loadMathLive().then(() => {
        mf = document.createElement('math-field');
        mf.setAttribute('aria-label', 'Equation');
        mf.addEventListener('input', () => { msg.textContent = ''; });
        mf.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); done(); } });
        holder.innerHTML = '';
        holder.append(mf);                          // options can only be set once it's on the page
        try {
          mf.smartFence = true; mf.smartSuperscript = true;
          // Only these typed shortcuts: MathLive's own list turns ordinary letter pairs into functions (e.g. "lg", "dt").
          mf.inlineShortcuts = EQ_SHORTCUTS;
          mf.menuItems = [];
        } catch (e) { /* keep MathLive's defaults */ }
        mf.value = latex;
        setTimeout(() => mf.focus(), 30);
      }, () => { holder.innerHTML = '<p class="iab-eqmsg">The equation editor couldn\'t load. It needs an internet connection: please check yours and try again.</p>'; });
    });
  }
  function runCmd(t) {
    try { document.execCommand('styleWithCSS', false, false); } catch (e) { /* older browsers */ }
    if (t.block) {
      const inside = (document.queryCommandValue('formatBlock') || '').toLowerCase().replace(/[<>]/g, '');
      document.execCommand('formatBlock', false, inside === t.cmd ? 'p' : t.cmd);
    } else document.execCommand(t.cmd, false, null);
  }
  function richText(html, opts) {
    const box = h('div', { class: 'iab-rich' + (opts.small ? ' small' : ''), contenteditable: 'true', role: 'textbox', 'aria-multiline': 'true', 'aria-label': opts.label, 'data-placeholder': opts.placeholder || 'Write here…', spellcheck: 'true' });
    box.innerHTML = html || '';
    prepSpecial(box);
    const empty = () => box.classList.toggle('is-empty', !box.textContent.trim() && !box.querySelector('[data-eq], [data-cite]'));
    empty();
    const tools = TOOLS.filter(t => !(opts.simple && t.full)).map(t => h('button', {
      type: 'button', class: 'iab-tool' + (t.cls ? ' ' + t.cls : ''), title: t.title, 'aria-label': t.title, 'aria-pressed': 'false', 'data-cmd': t.cmd,
      onmousedown: e => e.preventDefault(),          // keep the cursor in the text box
      onclick: () => { box.focus(); runCmd(t); changed(); state(); },
    }, t.label));
    const bar = h('div', { class: 'iab-toolbar', role: 'toolbar', 'aria-label': 'Formatting for ' + opts.label }, tools);
    const wrap = h('div', { class: 'iab-richwrap' }, bar, box);
    if (opts.equations !== false) bar.append(h('button', { type: 'button', class: 'iab-tool eq', title: 'Insert an equation', onmousedown: e => e.preventDefault(), onclick: insertEquation }, 'Equation'));
    async function insertEquation() {
      const sel = document.getSelection();
      const range = sel.rangeCount && box.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
      const r = await equationEditor({ display: !opts.simple });
      box.focus();
      if (!r || r.remove) return;
      insertAt(box, range, `<span data-eq="${esc(r.latex)}"${r.display ? ' data-display="1"' : ''}></span>${r.display ? '' : ' '}`);
      prepSpecial(box); empty(); flush();
    }
    // Click (or Enter on) an equation to edit or delete it
    async function editEquation(s) {
      const r = await equationEditor({ latex: s.dataset.eq, display: s.dataset.display === '1', editing: true });
      if (!r) { s.focus(); return; }
      if (r.remove) s.remove();
      else { s.dataset.eq = r.latex; if (r.display) s.dataset.display = '1'; else delete s.dataset.display; prepSpecial(box); }
      empty(); flush();
    }
    box.addEventListener('click', e => { const s = e.target.closest && e.target.closest('[data-eq]'); if (s && box.contains(s)) { e.preventDefault(); editEquation(s); } });
    box.addEventListener('keydown', e => { const s = e.target.closest && e.target.closest('[data-eq]'); if (s && box.contains(s) && e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); editEquation(s); } }, true);
    if (opts.cite !== false) bar.append(h('button', { type: 'button', class: 'iab-tool cite', title: 'Cite a reference', onmousedown: e => e.preventDefault(), onclick: () => citePicker(box, wrap, () => { empty(); flush(); }) }, 'Cite'));
    function state() {
      if (!box.contains(document.getSelection().anchorNode)) return;
      for (const b of tools) {
        const c = b.dataset.cmd;
        let on = false;
        try { on = /^h[34]$/.test(c) ? (document.queryCommandValue('formatBlock') || '').toLowerCase().replace(/[<>]/g, '') === c : document.queryCommandState(c); } catch (e) { /* ignore */ }
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    }
    let timer;
    const flush = () => { clearTimeout(timer); pending.delete(flush); opts.onInput(clean(box.innerHTML)); };
    function changed() { empty(); clearTimeout(timer); pending.add(flush); timer = setTimeout(flush, 400); }
    box.addEventListener('input', changed);
    box.addEventListener('blur', flush);
    box.addEventListener('focus', () => { try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) { /* ignore */ } });
    box.addEventListener('keyup', state); box.addEventListener('mouseup', state);
    box.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && opts.onEnter) { e.preventDefault(); opts.onEnter(); } });
    box.addEventListener('paste', e => {
      e.preventDefault();
      const dt = e.clipboardData;
      let pasted = dt.getData('text/html');
      if (!pasted) pasted = dt.getData('text/plain').split(/\r?\n/).map(l => `<p>${esc(l)}</p>`).join('');
      let c = clean(pasted);
      if (opts.simple) c = c.replace(/<\/?(h3|h4|ul|ol)>/g, '').replace(/<li>/g, '<p>').replace(/<\/li>/g, '</p>');
      document.execCommand('insertHTML', false, c);
      prepSpecial(box); changed();
    });
    box.addEventListener('drop', e => e.preventDefault());   // no dragging pictures or formatted text in
    return wrap;
  }

  // ---------- the Cite button: choose a reference (or add one) and insert [n] where the cursor is ----------
  function citePicker(box, wrap, changed) {   // changed(): saves the text box at once
    const old = wrap.querySelector('.iab-citepop');
    if (old) { old.remove(); return; }
    const sel = document.getSelection();
    const range = sel.rangeCount && box.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
    const nums = numbering(ia);
    function insert(refId) {
      pop.remove();
      insertAt(box, range, `<span data-cite="${esc(refId)}"></span> `);
      prepSpecial(box); changed(); save(); refreshNow();
    }
    const input = h('input', { type: 'text', 'aria-label': 'A new reference', placeholder: 'Type the full reference…' });
    const addNew = () => {
      const t = input.value.trim();
      if (!t) { input.focus(); return; }
      const ref = { id: uid('r'), html: `<p>${esc(t)}</p>` };
      ia.refs.push(ref); insert(ref.id);
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addNew(); } if (e.key === 'Escape') pop.remove(); });
    const refs = orderedRefs(ia, nums);
    const pop = h('div', { class: 'iab-citepop', role: 'dialog', 'aria-label': 'Cite a reference', onkeydown: e => { if (e.key === 'Escape') { pop.remove(); box.focus(); } } },
      h('p', { class: 'iab-citepop-h' }, refs.length ? 'Choose the reference to cite:' : 'You have no references yet. Add the first one:'),
      refs.length ? h('ul', {}, refs.map(r => h('li', {}, button([nums.cite[r.id] ? `[${nums.cite[r.id]}] ` : '[new] ', plain(r.html).slice(0, 90) || '(empty reference)'], () => insert(r.id), 'iab-citechoice')))) : null,
      h('div', { class: 'iab-citepop-new' }, input, button('Add and cite', addNew, 'button')),
      h('p', { class: 'iab-note' }, 'The numbers update by themselves. You can finish the reference later in the References section.'),
      linkButton('Cancel', () => { pop.remove(); box.focus(); }));
    wrap.querySelector('.iab-toolbar').after(pop);
    (pop.querySelector('.iab-citechoice') || input).focus();
  }

  // ---------- short boxes (table cells, captions) ----------
  // opts: { label, placeholder, multiline, onInput(html) }. Bold and italic with Ctrl+B / Ctrl+I; miniBar() adds buttons.
  function field(html, opts) {
    const box = h('div', { class: 'iab-field-box' + (opts.multiline ? ' multi' : ''), contenteditable: 'true', role: 'textbox', 'aria-label': opts.label, 'data-placeholder': opts.placeholder || '', spellcheck: 'true' });
    box.innerHTML = html || '';
    const empty = () => box.classList.toggle('is-empty', !box.textContent.trim());
    empty();
    let timer;
    const send = () => { clearTimeout(timer); pending.delete(send); opts.onInput(cleanInline(box.innerHTML)); };
    box.addEventListener('input', () => { empty(); clearTimeout(timer); pending.add(send); timer = setTimeout(send, 400); });
    box.addEventListener('blur', send);
    box.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (opts.multiline) document.execCommand('insertLineBreak');
    });
    box.addEventListener('paste', e => {
      e.preventDefault();
      const dt = e.clipboardData;
      const t = dt.getData('text/html') ? cleanInline(dt.getData('text/html')) : esc(dt.getData('text/plain')).replace(/\r?\n/g, opts.multiline ? '<br>' : ' ');
      document.execCommand('insertHTML', false, opts.multiline ? t : t.replace(/<br>/g, ' '));
      empty();
    });
    box.addEventListener('drop', e => e.preventDefault());
    return box;
  }
  // One small formatting bar for all the short boxes below it: it acts on whichever box has the cursor.
  function miniBar(label) {
    const tools = TOOLS.slice(0, 4).map(t => h('button', {
      type: 'button', class: 'iab-tool' + (t.cls ? ' ' + t.cls : ''), title: t.title, 'aria-label': t.title, onmousedown: e => e.preventDefault(),
      onclick: () => { const a = document.activeElement; if (a && a.classList.contains('iab-field-box')) { runCmd(t); a.dispatchEvent(new Event('input')); } },
    }, t.label));
    return h('div', { class: 'iab-minibar', role: 'toolbar', 'aria-label': label }, h('span', { class: 'iab-note' }, 'Format the box you\'re typing in:'), tools);
  }

  // ---------- pictures with numbered captions ----------
  function pictureEditor(b, opts = {}) {
    const imgBox = h('div', { class: 'iab-figimg' });
    const fileIn = h('input', { type: 'file', accept: 'image/png,image/jpeg', hidden: true, onchange: async e => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        imgBox.innerHTML = '<p class="iab-note">Adding the picture…</p>';
        const pic = await readPicture(file);
        const id = uid('img-');
        await store.putImage({ id, ia: ia.id, type: pic.type, w: pic.w, h: pic.h, blob: pic.blob });
        if (b.img) { store.removeImage(b.img).catch(() => {}); imageUrls.delete(b.img); }
        Object.assign(b, { img: id, w: pic.w, h: pic.h });
        save(); draw();
      } catch (err) { alert(err.message || 'Sorry, that picture couldn\'t be added.'); draw(); }
    } });
    async function draw() {
      imgBox.innerHTML = '';
      if (!b.img) {
        imgBox.append(h('div', { class: 'iab-figempty' }, button(opts.choose || 'Choose a picture (PNG or JPG)', () => fileIn.click(), 'button'),
          h('p', { class: 'iab-note' }, opts.hint || 'A graph, a labelled diagram or a photo of your set-up.')));
        return;
      }
      const url = await imageUrl(b.img);
      imgBox.append(url ? h('img', { src: url, alt: plain(b.caption) || 'Your picture' }) : h('p', { class: 'iab-note' }, 'This picture is missing from this browser.'),
        h('p', { class: 'iab-figactions' }, linkButton('Replace the picture', () => fileIn.click())));
    }
    draw();
    return h('figure', { class: 'iab-fig' }, imgBox, fileIn,
      h('figcaption', { class: 'iab-cap' }, h('span', { class: 'iab-num', 'data-fignum': b.id }, 'Figure:'),
        field(b.caption, { label: 'Caption', placeholder: 'A caption that says what the figure shows', onInput: v => { b.caption = v; save(); } })));
  }

  // ---------- data tables: paste from a spreadsheet, decimal places per column ----------
  const NUM = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
  function formatCell(v, dp) {
    const t = String(v == null ? '' : v).trim().replace(/^−/, '-');
    if (dp == null || dp === '' || !NUM.test(t)) return String(v == null ? '' : v);
    const x = Number(t);
    if (!isFinite(x)) return String(v);
    // round in decimal (so 1.005 → 1.01), working from the exponent form so very small or large numbers are safe
    const [m, e] = Math.abs(x).toExponential().split('e');
    const r = Number(Math.round(Number(m + 'e' + (Number(e) + dp))) + 'e-' + dp).toFixed(dp);
    return (x < 0 && /[1-9]/.test(r) ? '-' : '') + r;
  }
  // Tab-separated text, as spreadsheets copy it (cells with line breaks come in "quotes")
  function parseTSV(text) {
    const rows = [[]]; let cell = '', q = false;
    text = text.replace(/\r\n?/g, '\n');
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; continue; }
      if (ch === '"' && cell === '') q = true;
      else if (ch === '\t') { rows[rows.length - 1].push(cell); cell = ''; }
      else if (ch === '\n') { rows[rows.length - 1].push(cell); cell = ''; rows.push([]); }
      else cell += ch;
    }
    rows[rows.length - 1].push(cell);
    while (rows.length && rows[rows.length - 1].every(c => !c.trim())) rows.pop();
    const n = Math.max(0, ...rows.map(r => r.length));
    return rows.map(r => Array.from({ length: n }, (_, i) => (r[i] || '').trim()));
  }
  function newTable() { return { id: uid('t'), type: 'table', caption: '', head: ['', ''], rows: [['', ''], ['', '']], dp: [null, null] }; }
  function tableEditor(t) {
    const wrap = h('div', { class: 'iab-table' });
    function draw() {
      flushAll();
      wrap.innerHTML = '';
      const cols = t.head.length;
      const pastePanel = h('div', { class: 'iab-pastepanel', hidden: true });
      const firstIsHead = h('input', { type: 'checkbox', checked: true });
      const area = h('textarea', { rows: '4', 'aria-label': 'Paste your spreadsheet cells here', placeholder: 'Click here, then paste (Ctrl+V)', onpaste: e => {
        e.preventDefault();
        const rows = parseTSV(e.clipboardData.getData('text/plain'));
        if (!rows.length) return;
        const hasData = t.rows.some(r => r.some(c => c.trim())) || t.head.some(c => plain(c));
        if (hasData && !confirm('Replace everything in this table with the pasted cells?')) return;
        const head = firstIsHead.checked ? rows.shift() : rows[0].map(() => '');
        t.head = head.map(c => esc(c));
        t.rows = rows.length ? rows : [head.map(() => '')];
        t.dp = t.head.map((_, i) => (t.dp && t.dp[i] != null ? t.dp[i] : null));
        save(); draw();
      } });
      pastePanel.append(
        h('p', {}, 'Select the cells in your spreadsheet (Excel, Google Sheets or Numbers), copy them (Ctrl+C), then click in the box below and paste (Ctrl+V).'),
        h('label', { class: 'iab-check' }, firstIsHead, ' The first row is the column headings'),
        area);
      const head = h('tr', {}, t.head.map((c, i) => h('th', { scope: 'col' }, field(c, { label: `Heading of column ${i + 1}`, placeholder: 'Quantity / unit, ±…', multiline: true, onInput: v => { t.head[i] = v; save(); } }))), h('th', { class: 'iab-rowtools' }));
      const dpRow = h('tr', { class: 'iab-dprow' }, t.head.map((_, i) => h('td', {},
        h('label', {}, h('span', { class: 'iab-note' }, 'Decimal places '),
          h('select', { 'aria-label': `Decimal places in column ${i + 1}`, onchange: e => { t.dp[i] = e.target.value === '' ? null : +e.target.value; save(); draw(); } },
            h('option', { value: '', selected: t.dp[i] == null }, 'as typed'), [0, 1, 2, 3, 4, 5, 6].map(n => h('option', { value: n, selected: t.dp[i] === n }, n)))),
        cols > 1 ? linkButton('×', () => { if (t.rows.some(r => r[i] && r[i].trim()) && !confirm(`Delete column ${i + 1}?`)) return; t.head.splice(i, 1); t.dp.splice(i, 1); t.rows.forEach(r => r.splice(i, 1)); save(); draw(); }, { title: `Delete column ${i + 1}`, 'aria-label': `Delete column ${i + 1}`, danger: true }) : null)), h('td'));
      const body = h('tbody', {}, t.rows.map((r, ri) => h('tr', {}, r.map((c, ci) => {
        const inp = h('input', { type: 'text', value: formatCell(c, t.dp[ci]), 'aria-label': `Row ${ri + 1}, column ${ci + 1}`,
          onfocus: e => { e.target.value = t.rows[ri][ci]; },
          oninput: e => { t.rows[ri][ci] = e.target.value; save(); },
          onblur: e => { e.target.value = formatCell(t.rows[ri][ci], t.dp[ci]); },
          onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); const next = body.rows[ri + 1]; if (next) next.cells[ci].querySelector('input').focus(); } } });
        return h('td', {}, inp);
      }), h('td', { class: 'iab-rowtools' }, t.rows.length > 1 ? linkButton('×', () => { t.rows.splice(ri, 1); save(); draw(); }, { title: `Delete row ${ri + 1}`, 'aria-label': `Delete row ${ri + 1}`, danger: true }) : null))));
      wrap.append(
        h('div', { class: 'iab-cap above' }, h('span', { class: 'iab-num', 'data-tabnum': t.id }, 'Table:'),
          field(t.caption, { label: 'Table caption', placeholder: 'A caption that says what the table shows', onInput: v => { t.caption = v; save(); } })),
        h('div', { class: 'iab-tabletools' },
          button('Paste from a spreadsheet', () => { pastePanel.hidden = !pastePanel.hidden; if (!pastePanel.hidden) area.focus(); }),
          button('+ Row', () => { t.rows.push(t.head.map(() => '')); save(); draw(); }),
          button('+ Column', () => { t.head.push(''); t.dp.push(null); t.rows.forEach(r => r.push('')); save(); draw(); })),
        pastePanel,
        miniBar('Formatting for the table headings'),
        h('div', { class: 'iab-gridwrap' }, h('table', { class: 'iab-grid' }, h('thead', {}, head, dpRow), body)),
        h('p', { class: 'iab-note' }, 'Put the quantity, symbol, unit and uncertainty in each heading. Set the decimal places so they match each column\'s uncertainty: the numbers are rounded (or zeros added) on the page and in the Word file.'));
    }
    draw();
    return wrap;
  }

  // ---------- a list of text boxes, pictures and tables ----------
  // kinds: which "+" buttons to offer. empty: what to show when there's nothing yet.
  function blocksEditor(label, list, { kinds = ['text', 'image', 'table'], keepOne = true } = {}) {
    const wrap = h('div', { class: 'iab-blocks' });
    const ADD = { text: ['+ Text box', textBlock], image: ['+ Picture', () => ({ id: uid('f'), type: 'image', img: null, caption: '' })], table: ['+ Table', newTable] };
    function remove(i) {
      const b = list[i];
      const hasContent = b.type === 'text' ? wordsIn(b.html) : b.type === 'image' ? b.img : b.rows.some(r => r.some(c => c.trim()));
      if (hasContent && !confirm(`Delete this ${b.type === 'text' ? 'text box' : b.type === 'image' ? 'picture' : 'table'} and everything in it?`)) return;
      if (b.type === 'image' && b.img) { store.removeImage(b.img).catch(() => {}); imageUrls.delete(b.img); }
      list.splice(i, 1); save(); draw();
    }
    function draw() {
      flushAll();
      wrap.innerHTML = '';
      list.forEach((b, i) => {
        const tools = h('div', { class: 'iab-blocktools' },
          (list.length > 1 || !keepOne || b.type !== 'text') ? [
            list.length > 1 ? linkButton('↑ Up', () => { move(list, i, i - 1); save(); draw(); }, { disabled: i === 0, 'aria-label': 'Move up' }) : null,
            list.length > 1 ? linkButton('↓ Down', () => { move(list, i, i + 1); save(); draw(); }, { disabled: i === list.length - 1, 'aria-label': 'Move down' }) : null,
            linkButton('Delete', () => remove(i), { danger: true }),
          ] : null);
        const ed = b.type === 'text' ? richText(b.html, { label: `${label}, text box ${i + 1}`, onInput: v => { b.html = v; save(); } })
          : b.type === 'image' ? pictureEditor(b) : tableEditor(b);
        wrap.append(h('div', { class: 'iab-block iab-block-' + b.type }, tools, ed));
      });
      wrap.append(h('div', { class: 'iab-add' }, kinds.map(k => button(ADD[k][0], () => { list.push(ADD[k][1]()); save(); draw(); const last = wrap.querySelectorAll('.iab-block'); const f = last[last.length - 1] && last[last.length - 1].querySelector('.iab-rich, .iab-field-box, button'); if (f && k === 'text') f.focus(); })),
        kinds.includes('text') ? h('span', { class: 'iab-note' }, ' For an equation, use the Equation button in a text box.') : null));
      refresh();
    }
    draw();
    return wrap;
  }

  // ---------- section editors ----------
  function labelled(label, input, hint) {
    return h('label', { class: 'iab-labelled' }, h('span', {}, label), input, hint ? h('span', { class: 'iab-hint' }, hint) : null);
  }

  function rqEditor(d) {
    const f = ia.front;
    const codeHint = h('span', { class: 'iab-hint' });
    const checkCode = () => {
      const c = f.code.trim();
      codeHint.textContent = !c ? 'Your IB candidate code: three letters and three numbers, e.g. abc123. Ask your teacher if you don\'t know it yet.'
        : /^[a-z]{3}\d{3}$/i.test(c) ? 'This goes at the top of page one.' : 'A candidate code is three letters and three numbers, e.g. abc123. Never your name.';
    };
    checkCode();
    const place = h('fieldset', { class: 'iab-choice' }, h('legend', {}, 'Where should your research question go in the report?'),
      [['before', 'In its own section, before the background'], ['after', 'In its own section, after the background'], ['inside', 'Inside my background, with no heading of its own (it goes at the end of the background, starting "Research question:")']]
        .map(([val, text]) => h('label', {}, h('input', { type: 'radio', name: 'rqplace', value: val, checked: ia.settings.rqPlace === val, onchange: () => { ia.settings.rqPlace = val; save(); } }), ' ', text)));
    return [
      h('div', { class: 'iab-front' },
        h('h3', {}, 'Top of page one'),
        labelled('Title of your investigation', h('input', { type: 'text', value: f.title, maxlength: '200', oninput: e => { f.title = e.target.value; save(); } })),
        h('label', { class: 'iab-labelled' }, h('span', {}, 'Your IB candidate code'),
          h('input', { type: 'text', value: f.code, maxlength: '12', autocomplete: 'off', placeholder: 'e.g. abc123', oninput: e => { f.code = e.target.value; checkCode(); save(); } }), codeHint),
        labelled('Candidate codes of your group members (if you worked in a group)', h('input', { type: 'text', value: f.group, maxlength: '80', autocomplete: 'off', placeholder: 'e.g. abc124, abc125', oninput: e => { f.group = e.target.value; save(); } }), 'Leave this empty if you worked alone. Codes only, never names.'),
        h('p', { class: 'iab-note' }, 'The word count goes at the top of page one automatically.')),
      h('h3', { class: 'iab-subh' }, 'Your research question'),
      richText(d.text, { label: 'Research question', placeholder: 'Write your research question here…', simple: true, onInput: html => { d.text = html; save(); } }),
      place,
    ];
  }

  function kindChoice() {
    return h('fieldset', { class: 'iab-choice' }, h('legend', {}, 'What does your investigation do?'),
      [['relationship', 'It tests a relationship between two variables (write a hypothesis)'], ['constant', 'It determines the value of a constant (write the value you expect)']]
        .map(([val, text]) => h('label', {}, h('input', { type: 'radio', name: 'kind', value: val, checked: ia.settings.kind === val, onchange: () => { ia.settings.kind = val; save(); buildSidebar(); showSection('hypothesis'); } }), ' ', text)));
  }

  // Variables: a table of the IV and DV written down the page, a control-variables table, then "Why these choices?" paragraphs
  const VAR_ROWS = [
    ['quantity', 'Quantity, symbol and unit', 'e.g. Length L / m', 'e.g. Period T / s'],
    ['instrument', 'Instrument', '', ''],
    ['precision', 'Precision / uncertainty', 'e.g. ±0.001 m', ''],
    ['range', 'Range', 'Lowest to highest value', 'The range you expect'],
    ['interval', 'Interval and number of values', 'e.g. steps of 0.15 m, 5 values', ''],
    ['repeats', 'Repeats', 'How many trials of each value', ''],
    ['how', 'How it is changed / measured', 'How you change it', 'How you measure it'],
  ];
  function variablesEditor(d) {
    const vt = h('table', { class: 'iab-vtable' },
      h('thead', {}, h('tr', {}, h('th', {}, h('span', { class: 'iab-sr' }, 'Property')), h('th', { scope: 'col' }, 'Independent variable'), h('th', { scope: 'col' }, 'Dependent variable'))),
      h('tbody', {}, VAR_ROWS.map(([k, label, phIV, phDV]) => h('tr', {}, h('th', { scope: 'row' }, label),
        ['iv', 'dv'].map(v => h('td', { 'data-label': v === 'iv' ? 'Independent variable' : 'Dependent variable' }, field(d[v][k], { label: `${v === 'iv' ? 'Independent' : 'Dependent'} variable: ${label}`, placeholder: v === 'iv' ? phIV : phDV, multiline: k === 'how', onInput: x => { d[v][k] = x; save(); } })))))));
    const controls = h('div', { class: 'iab-controls' });
    const whyControls = h('div');
    function drawControls() {
      flushAll();
      controls.innerHTML = '';
      if (d.controls.length) controls.append(h('div', { class: 'iab-cap above' }, h('span', { class: 'iab-num', 'data-tabnum': 'var-controls' }, 'Table:'), field(d.captions.controls, { label: 'Caption of the control variables table', onInput: v => { d.captions.controls = v; save(); } })));
      controls.append(d.controls.length ? h('div', { class: 'iab-rows' },
        h('div', { class: 'iab-rowhead iab-c4' }, ['Control variable (symbol, unit)', 'Value (with uncertainty)', 'Instrument (if measured)', 'How it is kept constant'].map(t => h('span', {}, t)), h('span')),
        d.controls.map((c, i) => h('div', { class: 'iab-row iab-c4' },
          [['name', 'Control variable (symbol, unit)', 'e.g. Mass of the bob m / g'], ['value', 'Value (with uncertainty)', 'e.g. (50.0 ± 0.1) g'], ['instrument', 'Instrument (if measured)', ''], ['how', 'How it is kept constant', '']]
            .map(([k, lab, ph]) => h('div', { class: 'iab-cell', 'data-label': lab }, field(c[k], { label: `Control variable ${i + 1}: ${lab}`, placeholder: ph, multiline: k === 'how', onInput: x => { c[k] = x; save(); if (k === 'name') drawWhy(); } }))),
          h('div', { class: 'iab-cell iab-rowtools' },
            linkButton('↑', () => { move(d.controls, i, i - 1); save(); drawControls(); drawWhy(); }, { disabled: i === 0, title: 'Move up', 'aria-label': `Move control variable ${i + 1} up` }),
            linkButton('↓', () => { move(d.controls, i, i + 1); save(); drawControls(); drawWhy(); }, { disabled: i === d.controls.length - 1, title: 'Move down', 'aria-label': `Move control variable ${i + 1} down` }),
            linkButton('Delete', () => { if ((plain(c.name) || plain(d.whyControls[c.id])) && !confirm('Delete this control variable and its explanation?')) return; d.controls.splice(i, 1); delete d.whyControls[c.id]; save(); drawControls(); drawWhy(); }, { danger: true }))))) : h('p', { class: 'iab-note' }, 'No control variables yet.'),
      h('div', { class: 'iab-add' }, button('+ Control variable', () => { d.controls.push({ id: uid('cv'), name: '', value: '', instrument: '', how: '' }); save(); drawControls(); drawWhy(); controls.querySelectorAll('.iab-row')[d.controls.length - 1].querySelector('.iab-field-box').focus(); })));
      refresh();
    }
    function drawWhy() {
      flushAll();
      whyControls.innerHTML = '';
      d.controls.forEach((c, i) => whyControls.append(h('div', { class: 'iab-why' }, h('h4', {}, `Why does ${plain(c.name).split(' / ')[0].trim().replace(/^./, x => x.toLowerCase()) || 'control variable ' + (i + 1)} matter, and why is your way of keeping it constant good enough?`),
        richText(d.whyControls[c.id], { label: `Why control variable ${i + 1} matters`, small: true, simple: true, onInput: v => { d.whyControls[c.id] = v; save(); } }))));
    }
    drawControls(); drawWhy();
    const why = [['range', 'Why does your range start and stop where it does?'], ['interval', 'Why this interval and number of values?'], ['repeats', 'Why this number of repeats?'], ['precision', 'Are your instruments precise enough for the change you expect across your range?']]
      .map(([k, q]) => h('div', { class: 'iab-why' }, h('h4', {}, q), richText(d.why[k], { label: q, small: true, simple: true, onInput: v => { d.why[k] = v; save(); } })));
    return [
      miniBar('Formatting for the variables tables'),
      h('div', { class: 'iab-cap above' }, h('span', { class: 'iab-num', 'data-tabnum': 'var-main' }, 'Table:'), field(d.captions.main, { label: 'Caption of the variables table', onInput: v => { d.captions.main = v; save(); } })),
      h('div', { class: 'iab-gridwrap' }, vt),
      h('h3', { class: 'iab-subh' }, 'Control variables'),
      controls,
      h('h3', { class: 'iab-subh' }, 'Why these choices?'),
      h('p', { class: 'iab-note' }, 'These paragraphs go under the tables in your report, without the questions. The reasons are where the marks are.'),
      why, whyControls,
      h('h3', { class: 'iab-subh' }, 'Anything else?'),
      h('p', { class: 'iab-note' }, 'Add a paragraph for a variable that needs a longer explanation, for example an independent variable you calculate from other measurements.'),
      blocksEditor('Variables', d.extra, { kinds: ['text'], keepOne: false }),
    ];
  }

  function methodEditor(d) {
    const steps = h('ol', { class: 'iab-steps' });
    function drawSteps(focus) {
      flushAll();
      steps.innerHTML = '';
      d.steps.forEach((st, i) => steps.append(h('li', {},
        h('div', { class: 'iab-blocktools' },
          linkButton('↑ Up', () => { move(d.steps, i, i - 1); save(); drawSteps(); }, { disabled: i === 0, 'aria-label': `Move step ${i + 1} up` }),
          linkButton('↓ Down', () => { move(d.steps, i, i + 1); save(); drawSteps(); }, { disabled: i === d.steps.length - 1, 'aria-label': `Move step ${i + 1} down` }),
          d.steps.length > 1 ? linkButton('Delete', () => { if (wordsIn(st.html) && !confirm(`Delete step ${i + 1}?`)) return; d.steps.splice(i, 1); save(); drawSteps(); }, { danger: true }) : null),
        richText(st.html, { label: `Step ${i + 1}`, small: true, simple: true, placeholder: `Step ${i + 1}`, onInput: v => { st.html = v; save(); }, onEnter: () => { d.steps.splice(i + 1, 0, { id: uid('st'), html: '' }); save(); drawSteps(i + 1); } }))));
      if (focus != null) steps.children[focus].querySelector('.iab-rich').focus();
      refresh();
    }
    drawSteps();
    return [
      h('h3', { class: 'iab-subh' }, 'Diagram'),
      h('p', { class: 'iab-note' }, 'Add your labelled diagram (and a photo if it helps). A clear sketch usually shows a set-up better than a photograph.'),
      blocksEditor('Method', d.top, { kinds: ['image', 'text'], keepOne: false }),
      h('h3', { class: 'iab-subh' }, 'Steps'),
      h('p', { class: 'iab-note' }, 'One step per box. Press Enter at the end of a step to start the next one.'),
      steps,
      h('div', { class: 'iab-add' }, button('+ Step', () => { d.steps.push({ id: uid('st'), html: '' }); save(); drawSteps(d.steps.length - 1); })),
    ];
  }

  // Raw data, data processing and graphs: a story of steps. Each step: introduce it, show it, explain it.
  const STEP_KINDS = {
    table: { add: '+ Table', name: 'Table', make: newTable },
    image: { add: '+ Graph or picture', name: 'Graph or picture', make: () => ({ id: uid('f'), type: 'image', img: null, caption: '' }) },
    calc: { add: '+ Calculation', name: 'Calculation', make: () => ({ id: uid('c'), type: 'calc', blocks: [textBlock()] }) },
    text: { add: '+ Text only', name: 'Text only', make: () => null },
  };
  function storyEditor(sec, d) {
    const wrap = h('div', { class: 'iab-story' });
    function draw() {
      flushAll();
      wrap.innerHTML = '';
      if (!d.steps.length) wrap.append(h('p', { class: 'iab-note iab-storyempty' }, 'Build this section as a story, one step at a time: introduce each table, graph or calculation, show it, then explain it. Start with a step below.'));
      d.steps.forEach((st, i) => {
        const kind = st.item ? st.item.type : 'text';
        const card = h('div', { class: 'iab-step' },
          h('div', { class: 'iab-step-top' }, h('span', { class: 'iab-step-name' }, `Step ${i + 1}: ${STEP_KINDS[kind].name}`),
            h('span', { class: 'iab-blocktools' },
              linkButton('↑ Up', () => { move(d.steps, i, i - 1); save(); draw(); }, { disabled: i === 0, 'aria-label': `Move step ${i + 1} up` }),
              linkButton('↓ Down', () => { move(d.steps, i, i + 1); save(); draw(); }, { disabled: i === d.steps.length - 1, 'aria-label': `Move step ${i + 1} down` }),
              linkButton('Delete', () => {
                if (!confirm(`Delete step ${i + 1} and everything in it?`)) return;
                if (st.item && st.item.type === 'image' && st.item.img) { store.removeImage(st.item.img).catch(() => {}); imageUrls.delete(st.item.img); }
                d.steps.splice(i, 1); save(); draw();
              }, { danger: true }))));
        if (kind === 'text') {
          card.append(richText(st.intro, { label: `Step ${i + 1}: text`, placeholder: 'Write here…', onInput: v => { st.intro = v; save(); } }));
        } else {
          card.append(
            h('p', { class: 'iab-steplabel' }, 'Introduce it'),
            richText(st.intro, { label: `Step ${i + 1}: introduction`, small: true, placeholder: 'What will this show, how was it obtained, and why is it the next step?', onInput: v => { st.intro = v; save(); } }),
            h('p', { class: 'iab-steplabel' }, 'Show it'),
            kind === 'table' ? tableEditor(st.item) : kind === 'image' ? pictureEditor(st.item, { choose: 'Choose a graph or picture (PNG or JPG)', hint: 'Export your graph from your graphing program as a picture first.' })
              : h('div', { class: 'iab-calc' }, h('p', { class: 'iab-note' }, 'Write one example calculation with your own data: the equation, the values substituted and the result, with its uncertainty. Use the Equation button for each line.'), blocksEditor(`Step ${i + 1} calculation`, st.item.blocks, { kinds: ['text'] })));
          if (st.explainHidden) {
            card.append(h('p', { class: 'iab-explain-hidden' }, 'The explanation box is hidden, so it won\'t be in your report. ', linkButton('Show it', () => { st.explainHidden = false; save(); draw(); })));
          } else {
            card.append(
              h('div', { class: 'iab-steplabel-row' }, h('p', { class: 'iab-steplabel' }, 'Explain it'), linkButton('Hide this box', () => { st.explainHidden = true; save(); draw(); })),
              richText(st.explain, { label: `Step ${i + 1}: explanation`, small: true, placeholder: 'What does it show, and what does it mean for your research question?', onInput: v => { st.explain = v; save(); } }));
          }
        }
        wrap.append(card);
      });
      wrap.append(h('div', { class: 'iab-add' }, h('span', { class: 'iab-note' }, 'Add a step: '),
        Object.entries(STEP_KINDS).map(([k, v]) => button(v.add, () => { d.steps.push({ id: uid('s'), intro: '', item: v.make(), explain: '', explainHidden: false }); save(); draw(); }))));
      refresh();
    }
    draw();
    return wrap;
  }

  const EVAL_COLS = [['weak', 'Weakness or limitation'], ['data', 'Effect on the data and analysis'], ['concl', 'Effect on the conclusion, and how large'], ['improve', 'Realistic improvement, and what would change']];
  function evaluationEditor(d) {
    const rows = h('div', { class: 'iab-rows' });
    function draw() {
      flushAll();
      rows.innerHTML = '';
      rows.append(h('div', { class: 'iab-rowhead iab-c4' }, EVAL_COLS.map(([, t]) => h('span', {}, t)), h('span')),
        ...d.rows.map((r, i) => h('div', { class: 'iab-row iab-c4' },
          EVAL_COLS.map(([k, lab]) => h('div', { class: 'iab-cell', 'data-label': lab }, field(r[k], { label: `Weakness ${i + 1}: ${lab}`, multiline: true, onInput: x => { r[k] = x; save(); } }))),
          h('div', { class: 'iab-cell iab-rowtools' },
            linkButton('↑', () => { move(d.rows, i, i - 1); save(); draw(); }, { disabled: i === 0, title: 'Move up (more important)', 'aria-label': `Move weakness ${i + 1} up` }),
            linkButton('↓', () => { move(d.rows, i, i + 1); save(); draw(); }, { disabled: i === d.rows.length - 1, title: 'Move down (less important)', 'aria-label': `Move weakness ${i + 1} down` }),
            d.rows.length > 1 ? linkButton('Delete', () => { if (EVAL_COLS.some(([k]) => plain(r[k])) && !confirm(`Delete weakness ${i + 1}?`)) return; d.rows.splice(i, 1); save(); draw(); }, { danger: true }) : null))));
      refresh();
    }
    draw();
    return [
      miniBar('Formatting for the evaluation table'),
      h('div', { class: 'iab-cap above' }, h('span', { class: 'iab-num', 'data-tabnum': 'eval' }, 'Table:'), field(d.caption, { label: 'Caption of the evaluation table', onInput: v => { d.caption = v; save(); } })),
      h('p', { class: 'iab-note' }, 'One row per weakness, most important first: use ↑ and ↓ to rank them.'),
      rows,
      h('div', { class: 'iab-add' }, button('+ Weakness', () => { d.rows.push({ id: uid('ev'), weak: '', data: '', concl: '', improve: '' }); save(); draw(); rows.querySelectorAll('.iab-row')[d.rows.length - 1].querySelector('.iab-field-box').focus(); })),
      h('h3', { class: 'iab-subh' }, 'Which weakness mattered most, and why?'),
      richText(d.most, { label: 'Which weakness mattered most, and why?', onInput: v => { d.most = v; save(); } }),
    ];
  }

  function referencesEditor() {
    const list = h('ol', { class: 'iab-refs' });
    function draw() {
      flushAll();
      list.innerHTML = '';
      const nums = numbering(ia);
      orderedRefs(ia, nums).forEach(r => list.append(h('li', {},
        h('span', { class: 'iab-refnum', 'data-refnum': r.id }, nums.cite[r.id] ? `[${nums.cite[r.id]}]` : '[–]'),
        h('div', { class: 'iab-refbody' },
          richText(r.html, { label: 'Reference', small: true, simple: true, cite: false, placeholder: 'Author, title (in italics), where and when it was published; for a website, the URL and the date you accessed it', onInput: v => { r.html = v; save(); } }),
          h('p', { class: 'iab-refwarn', 'data-refwarn': r.id, hidden: r.id in nums.cite }, 'Not cited in your report yet: use the Cite button in a text box, or delete it if you didn\'t use it.')),
        linkButton('Delete', () => {
          const cited = r.id in nums.cite;
          if (!confirm(cited ? 'This reference is cited in your report. Delete it and remove its citations?' : 'Delete this reference?')) return;
          ia.refs = ia.refs.filter(x => x.id !== r.id);
          removeCitations(r.id);
          save(); draw();
        }, { danger: true }))));
      refresh();
    }
    draw();
    return [
      h('p', { class: 'iab-note' }, 'To cite a source, click Cite in any text box: the numbers [1], [2]… follow the order of first citation and update by themselves. You can also add references here and cite them later.'),
      list,
      h('div', { class: 'iab-add' }, button('+ Reference', () => { ia.refs.push({ id: uid('r'), html: '' }); save(); draw(); const boxes = list.querySelectorAll('.iab-rich'); boxes[boxes.length - 1].focus(); })),
    ];
  }
  // Take a deleted reference's citations out of every piece of text in the IA
  function removeCitations(refId) {
    const re = new RegExp(`<span data-cite="${refId}"></span>(&nbsp;| )?`, 'g');
    (function scrub(o) {
      for (const k in o) {
        if (typeof o[k] === 'string' && o[k].includes('data-cite')) o[k] = o[k].replace(re, '');
        else if (o[k] && typeof o[k] === 'object') scrub(o[k]);
      }
    })(ia.s);
  }

  // ---------- the frame: sidebar, My IAs, one section at a time ----------
  function buildSidebar() {
    sidebar.innerHTML = ''; picker.innerHTML = '';
    const ol = h('ol');
    SECTIONS.forEach((sec, i) => {
      const title = sec.kind === 'hypothesis' ? sec.versions[ia.settings.kind].heading : sec.title;
      ol.append(h('li', { 'data-sec': sec.id, class: ia.ui.current === sec.id ? 'current' : null },
        h('a', { href: '#' + sec.id, 'aria-current': ia.ui.current === sec.id ? 'step' : null, onclick: e => { e.preventDefault(); go(sec.id); } },
          h('span', { class: 'iab-side-title' }, `${i + 1}. ${title}`),
          h('span', { class: 'iab-side-meta' }, h('span', { class: 'iab-side-words' }), h('span', { class: 'iab-side-ticks' })))));
      picker.append(h('option', { value: sec.id, selected: ia.ui.current === sec.id }, `${i + 1}. ${title}`));
    });
    sidebar.append(h('h2', { class: 'iab-side-h' }, 'Sections'), ol);
    refreshNow();
  }

  function buildMenu() {
    iaMenu.innerHTML = '';
    const list = h('ul', { class: 'iab-ialist' }, ias.slice().sort((a, b) => a.created.localeCompare(b.created)).map(x =>
      h('li', {}, h('button', { type: 'button', class: 'iab-linkbtn' + (x.id === ia.id ? ' current' : ''), 'aria-current': x.id === ia.id ? 'true' : null, onclick: () => { switchTo(x.id); iaMenu.open = false; } },
        x.name || 'Untitled IA', x.id === ia.id ? ' (open)' : ''))));
    const name = h('input', { type: 'text', value: ia.name, maxlength: '60', 'aria-label': 'Name of this IA', oninput: e => { ia.name = e.target.value; iaMenu.querySelector('summary .iab-menu-name').textContent = ia.name || 'Untitled IA'; save(); }, onchange: () => buildMenu() });
    iaMenu.append(
      h('summary', {}, h('span', { class: 'iab-menu-label' }, 'My IAs: '), h('span', { class: 'iab-menu-name' }, ia.name || 'Untitled IA')),
      h('div', { class: 'iab-menu-panel' },
        h('label', { class: 'iab-labelled' }, h('span', {}, 'Name of this IA (only you see it)'), name),
        h('p', { class: 'iab-menu-h' }, 'Your IAs in this browser'),
        list,
        h('div', { class: 'iab-menu-actions' },
          button('New IA', () => { const x = upgrade(newIA(`IA ${ias.length + 1}`)); ias.push(x); switchTo(x.id, true); iaMenu.open = true; }),
          button('Duplicate', duplicate),
          button('Delete…', del, 'button secondary danger'))));
  }
  // A copy of the IA, with its own copies of the pictures (so deleting one in either IA doesn't affect the other)
  async function duplicate() {
    const x = upgrade(JSON.parse(JSON.stringify(ia)));
    x.id = uid('ia-'); x.name = (ia.name || 'IA') + ' (copy)'; x.created = x.updated = new Date().toISOString(); x.lastDownload = null;
    const map = {};
    for (const rec of (await store.allImages()).filter(r => r.ia === ia.id)) {
      const id = uid('img-'); map[rec.id] = id;
      await store.putImage(Object.assign({}, rec, { id, ia: x.id }));
    }
    (function swap(o) { for (const k in o) { if (k === 'img' && map[o[k]]) o[k] = map[o[k]]; else if (o[k] && typeof o[k] === 'object') swap(o[k]); } })(x.s);
    ias.push(x); switchTo(x.id, true);
  }
  async function del() {
    if (!confirm(`Delete "${ia.name || 'Untitled IA'}" from this browser? This can't be undone. (A copy you downloaded with "Save progress" isn't affected.)`)) return;
    clearTimeout(saveTimer); saveTimer = null;
    try { const b = JSON.parse(localStorage.getItem(BACKUP) || 'null'); if (b && b.id === ia.id) localStorage.removeItem(BACKUP); } catch (e) { /* ignore */ }
    await store.remove(ia.id).catch(() => {});
    for (const rec of (await store.allImages()).filter(r => r.ia === ia.id)) await store.removeImage(rec.id).catch(() => {});
    ias = ias.filter(x => x.id !== ia.id);
    if (!ias.length) ias.push(upgrade(newIA('My IA')));
    ia = null;
    switchTo(ias[0].id, true);
  }
  function switchTo(id, fresh) {
    if (ia) flushAll();
    if (saveTimer && ia) { clearTimeout(saveTimer); saveTimer = null; store.put(ia).catch(() => {}); }
    ia = ias.find(x => x.id === id);
    lsSet('iab-current', id);
    if (fresh) save(true);
    buildMenu(); buildSidebar(); showSection(ia.ui.current);
  }

  function go(id) {
    ia.ui.current = id; save();
    buildSidebar(); showSection(id);
    const top = document.querySelector('.iab-bar'), head = document.querySelector('.site-header');
    if (top && top.getBoundingClientRect().top < (head ? head.offsetHeight : 0)) top.scrollIntoView({ behavior: 'smooth' });
  }
  // The site's header stays at the top of the screen; keep the section list and jumps below it.
  function headHeight() {
    const head = document.querySelector('.site-header');
    const sticky = head && /sticky|fixed/.test(getComputedStyle(head).position);
    document.documentElement.style.setProperty('--iab-head', (sticky ? head.offsetHeight : 0) + 'px');
  }
  addEventListener('resize', headHeight);

  function showSection(id) {
    const i = Math.max(0, SECTIONS.findIndex(s => s.id === id));
    const sec = SECTIONS[i];
    const v = sec.kind === 'hypothesis' ? sec.versions[ia.settings.kind] : sec;
    const title = sec.kind === 'hypothesis' ? v.heading : sec.title;
    flushAll();
    view.innerHTML = '';
    view.append(
      h('h2', { class: 'iab-h', id: 'sec-' + sec.id, tabindex: '-1' }, `${i + 1}. ${title}`),
      h('div', { class: 'iab-expected' }, h('h3', {}, 'What\'s expected'), h('p', { html: v.expected }),
        h('p', { class: 'iab-more' }, h('a', { href: sec.link, target: '_blank', rel: 'noopener' }, 'More on the IA page'), ' (opens in a new tab)')),
      h('details', { class: 'iab-questions', open: true }, h('summary', {}, 'Guiding questions'), h('ul', {}, v.questions.map(q => h('li', { html: q })))),
      h('div', { class: 'iab-work' }, editorFor(sec)),
      checklist(sec, v.checklist),
      h('nav', { class: 'iab-prevnext', 'aria-label': 'Previous and next section' },
        i > 0 ? button('← ' + SECTIONS[i - 1].title, () => go(SECTIONS[i - 1].id)) : h('span'),
        i < SECTIONS.length - 1 ? button(SECTIONS[i + 1].title + ' →', () => go(SECTIONS[i + 1].id)) : h('span')));
    refreshNow();
  }

  function checklist(sec, items) {
    if (ia.ui.hideChecklists) {
      return h('p', { class: 'iab-checklist-hidden' }, linkButton('Show the checklist', () => { ia.ui.hideChecklists = false; save(); showSection(sec.id); }));
    }
    return h('div', { class: 'iab-checklist' },
      h('div', { class: 'iab-checklist-top' }, h('h3', {}, 'Checklist'), linkButton('Hide checklists', () => { ia.ui.hideChecklists = true; save(); showSection(sec.id); })),
      h('p', { class: 'iab-note' }, 'Tick each one when your section does it. The checklists are just for you: they aren\'t in the Word file.'),
      h('ul', {}, items.map(([id, text]) => h('li', {}, h('label', {},
        h('input', { type: 'checkbox', checked: !!ia.ticks[id], onchange: e => { ia.ticks[id] = e.target.checked; save(); } }),
        h('span', { html: text }))))));
  }

  function editorFor(sec) {
    const d = ia.s[sec.id];
    switch (sec.kind) {
      case 'rq': return rqEditor(d);
      case 'hypothesis': return [kindChoice(), blocksEditor(sec.versions[ia.settings.kind].heading, d.blocks)];
      case 'blocks': return blocksEditor(sec.title, d.blocks);
      case 'variables': return variablesEditor(d);
      case 'method': return methodEditor(d);
      case 'story': return storyEditor(sec, d);
      case 'evaluation': return evaluationEditor(d);
      case 'references': return referencesEditor();
    }
    return null;
  }

  // ---------- the Word file ----------
  // A "Before you download" panel (not exported), the wide-margin option, then js/ia/export.js builds the file.
  function wordPanel() {
    flushAll();
    const back = document.activeElement;
    const nums = numbering(ia), w = totalWords(ia);
    const notes = [];
    const code = ia.front.code.trim();
    if (!ia.front.title.trim()) notes.push(['Your report has no title yet', 'rq']);
    if (!code) notes.push(['Your candidate code isn\'t filled in yet', 'rq']);
    else if (!/^[a-z]{3}\d{3}$/i.test(code)) notes.push(['Your candidate code doesn\'t look like one (three letters and three numbers)', 'rq']);
    const entries = walk(ia);
    const noCap = entries.filter(e => (e.kind === 'figure' && e.block.img && !plain(e.block.caption)) || (e.kind === 'table' && e.block.type === 'table' && !plain(e.block.caption)));
    if (noCap.length) notes.push([`${noCap.length} figure${noCap.length > 1 ? 's or tables have' : ' or table has'} no caption`, null]);
    const uncited = ia.refs.filter(r => plain(r.html) && !(r.id in nums.cite)).length;
    if (uncited) notes.push([`${uncited} reference${uncited > 1 ? 's aren\'t' : ' isn\'t'} cited in your report`, 'references']);
    const emptySecs = SECTIONS.filter(sec => sec.id !== 'references' && !sectionHasContent(sec)).map(sec => sec.kind === 'hypothesis' ? sec.versions[ia.settings.kind].heading : sec.title);
    const wide = h('input', { type: 'checkbox', checked: ia.settings.wideMargins, onchange: e => { ia.settings.wideMargins = e.target.checked; save(); } });
    const msg = h('p', { class: 'iab-eqmsg', role: 'alert' });
    const dl = button('Download the Word file', async () => {
      dl.disabled = true; msg.textContent = '';
      try {
        await MathJax.startup.promise;
        const { bytes } = await window.IAExport.build({ ia, sections: SECTIONS, walk, numbering, orderedRefs, formatCell, totalWords, getImage: id => store.getImage(id) });
        const day = new Date().toISOString().slice(0, 10);
        window.Lab.download(bytes, `IA - ${(ia.name || 'report').replace(/[\\/:*?"<>|]+/g, '').trim() || 'report'} - ${day}.docx`);
        close();
      } catch (e) { console.error(e); msg.textContent = 'Sorry, the Word file couldn\'t be made. Please try again, and tell your teacher if it keeps happening.'; dl.disabled = false; }
    }, 'button');
    const close = () => { removeEventListener('keydown', onKey, true); panel.remove(); if (back && back.focus) back.focus(); };
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    const goTo = id => { close(); go(id); };
    const panel = h('div', { class: 'iab-eqpanel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'iab-wordtitle' },
      h('div', { class: 'iab-eqbox iab-wordbox' },
        h('h3', { id: 'iab-wordtitle' }, 'Download your report as a Word file'),
        h('p', {}, `Your report has ${fmtNum(w)} words, as the IB counts them (the limit is 3,000).`),
        h('h4', {}, 'Before you download'),
        h('ul', { class: 'iab-wordchecks' },
          h('li', {}, h('strong', {}, 'No names anywhere: '), 'not yours, and not anyone else\'s. Only candidate codes.'),
          notes.map(([t, id]) => h('li', { class: 'warn' }, t, id ? [' (', linkButton('go there', () => goTo(id)), ')'] : null)),
          emptySecs.length ? h('li', { class: 'warn' }, 'These sections are empty, so they won\'t be in the file: ' + emptySecs.join(', ') + '.') : null,
          h('li', {}, 'Every table and figure is numbered for you; check that each one is referred to in your text.'),
          h('li', {}, 'The checklists and guidance aren\'t in the file, and neither are any explanation boxes you hid.')),
        h('label', { class: 'iab-check' }, wide, ' Wide right margin (6 cm) for my teacher\'s comments on my draft'),
        msg,
        h('div', { class: 'iab-eqactions' }, dl, button('Cancel', close)),
        h('p', { class: 'iab-note' }, 'The file opens in Word, Google Docs or Pages. Equations are real Word equations you can still edit. ',
          h('a', { href: 'ia.html#submit', target: '_blank', rel: 'noopener' }, 'Before you hand it in'), ' (IA page).')));
    document.body.append(panel);
    addEventListener('keydown', onKey, true);
    dl.focus();
  }
  function sectionHasContent(sec) {
    const d = ia.s[sec.id];
    if (sec.kind === 'variables') return VAR_FIELDS.some(f => plain(d.iv[f]) || plain(d.dv[f])) || d.controls.length > 0 || Object.values(d.why).some(plain) || d.extra.some(b => b.type !== 'text' || plain(b.html));
    return walk(ia).some(e => e.sec === sec.id && (e.kind === 'html' ? !!(plain(e.html) || /data-eq/.test(e.html || '')) : e.kind === 'figure' ? !!e.block.img : e.block.type === 'table' ? e.block.rows.some(r => r.some(c => String(c).trim())) : e.block.id === 'eval' ? d.rows.some(r => EVAL_COLS.some(([k]) => plain(r[k]))) : false));
  }

  // ---------- start ----------
  async function start() {
    ias = (await store.all()).map(upgrade);
    // A newer copy in localStorage means the last change didn't reach the database before the page closed
    try {
      const b = JSON.parse(localStorage.getItem(BACKUP) || 'null');
      if (b && b.id && b.s) {
        const i = ias.findIndex(x => x.id === b.id);
        if (i < 0 || (b.updated || '') > (ias[i].updated || '')) {
          const x = upgrade(b);
          if (i < 0) ias.push(x); else ias[i] = x;
          store.put(x).catch(() => {});
        }
      }
    } catch (e) { /* no usable copy */ }
    if (!ias.length) ias.push(upgrade(newIA('My IA')));
    const want = lsGet('iab-current');
    ia = ias.find(x => x.id === want) || ias[0];
    root.innerHTML = '';
    const countInfo = h('details', { class: 'iab-countinfo' }, h('summary', {}, 'What\'s counted?'),
      h('p', {}, 'As the IB guide says, the count leaves out headings and the title, data tables and the variables tables, pictures and their captions, equations and calculations, citations and the references list. The limit is 3,000 words; strong reports are often around 2,200.'));
    root.append(
      h('div', { class: 'iab-bar' }, iaMenu, h('div', { class: 'iab-bar-right' }, wordsEl, countInfo, status),
        h('div', { class: 'iab-bar-actions' }, button('Download Word file', wordPanel, 'button'))),
      h('div', { class: 'iab-layout' }, sidebar, h('div', { class: 'iab-main' }, h('label', { class: 'iab-pickerwrap' }, h('span', {}, 'Section'), picker), view)));
    switchTo(ia.id);
    headHeight(); setTimeout(headHeight, 500);   // the header is drawn by js/site.js
    if (store.memoryOnly) setStatus(BLOCKED, true);
    else setStatus('Saved in this browser ✓');
    if (!lsGet('iab-current')) save(true);
  }
  start();

  // for testing in the console (and, later, the Word export)
  window.IABuilder = { clean, cleanInline, wordsIn, walk: () => walk(ia), numbering: () => numbering(ia), formatCell, parseTSV, get ia() { return ia; } };
})();
