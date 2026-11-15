// Circuit builder: starts the page (plan: docs/CIRCUIT_BUILDER_PLAN.md).
// The circuit shown first: a shared link (#c=…), else the student's last circuit (saved automatically in this
// browser), else the example. Saving named circuits, opening them, share links and the example are in the bar
// above the builder. Everything is stored only in this browser (localStorage), and every storage call is wrapped,
// so the page still works where storage is blocked (private browsing).
// window.CircuitApp is the editor and window.CircuitShare the link encoder, for tools/circuits/ui-test.html.
// The test page adds ?store=<name> so its circuits are kept apart from a student's.
(function () {
  'use strict';
  const host = document.getElementById('circuit-builder');
  if (!host || !window.Circuits || !window.Circuits.editor) return;
  const M = window.Circuits.model;

  // A cell, a switch, an ammeter and a lamp in series, with a voltmeter across the lamp.
  const EXAMPLE = {
    v: 1,
    components: [
      { id: 'b1', type: 'battery', label: 'B1', x: -4, y: -4, rot: 0, params: { emf: 6, r: 0 } },
      { id: 's1', type: 'switch', label: 'S1', x: 4, y: -4, rot: 0, params: { closed: true } },
      { id: 'a1', type: 'ammeter', label: 'A1', x: 10, y: 0, rot: 90, params: { ideal: true, range: '2A' } },
      { id: 'l1', type: 'lamp', label: 'L1', x: 4, y: 4, rot: 0, params: { model: 'ohmic', R: 12, Prated: 3 } },
      { id: 'v1', type: 'voltmeter', label: 'V1', x: 4, y: 8, rot: 180, params: { ideal: true, range: '20V' } },
    ],
    junctions: [],
    wires: [
      { id: 'w1', from: { c: 'b1', t: 1 }, to: { c: 's1', t: 0 }, via: [] },
      { id: 'w2', from: { c: 's1', t: 1 }, to: { c: 'a1', t: 0 }, via: [] },
      { id: 'w3', from: { c: 'a1', t: 1 }, to: { c: 'l1', t: 1 }, via: [] },
      { id: 'w4', from: { c: 'l1', t: 0 }, to: { c: 'b1', t: 0 }, via: [] },
      { id: 'w5', from: { c: 'v1', t: 0 }, to: { c: 'l1', t: 1 }, via: [] },
      { id: 'w6', from: { c: 'v1', t: 1 }, to: { c: 'l1', t: 0 }, via: [] },
    ],
  };

  // ---------------- storage (this browser only) ----------------
  const params = new URLSearchParams(location.search);
  const prefix = `circuit-builder${params.get('store') ? `-${params.get('store').replace(/[^\w-]/g, '')}` : ''}:`;
  const store = {
    get(key) { try { const s = localStorage.getItem(prefix + key); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(prefix + key, JSON.stringify(value)); return true; } catch (e) { return false; } },
  };

  // ---------------- share links: the circuit packed into the page address ----------------
  const toB64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const fromB64 = (s) => { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/')); const out = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i); return out; };
  async function squeeze(bytes, how) {
    const stream = new Blob([bytes]).stream().pipeThrough(how === 'compress' ? new CompressionStream('deflate-raw') : new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  async function encode(drawing) {
    const bytes = new TextEncoder().encode(JSON.stringify(M.pack(drawing)));
    if (typeof CompressionStream !== 'undefined') { try { return `z${toB64(await squeeze(bytes, 'compress'))}`; } catch (e) { /* fall back */ } }
    return `j${toB64(bytes)}`;
  }
  async function decode(code) {
    let bytes = fromB64(code.slice(1));
    if (code[0] === 'z') bytes = await squeeze(bytes, 'decompress');
    else if (code[0] !== 'j') throw new Error('unknown link format');
    return M.unpack(JSON.parse(new TextDecoder().decode(bytes)));
  }
  const MAX_LINK = 6000;

  // ---------------- start ----------------
  (async () => {
    let first = null;
    let opened = '';
    const m = location.hash.match(/^#c=([A-Za-z0-9_-]+)$/);
    if (m) {
      try { first = await decode(m[1]); opened = 'Opened a shared circuit.'; } catch (e) { opened = "That shared link couldn't be opened: it may have been cut short when it was copied."; }
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
    }
    if (!first) { const saved = store.get('autosave'); if (saved) { first = M.unpack(saved); if (!first.components.length) first = null; } }
    let autosaveTimer = null;
    const editor = window.Circuits.editor.create(host, {
      drawing: first || EXAMPLE,
      onChange(d) {
        clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(() => store.set('autosave', M.pack(d)), 300);
      },
    });
    window.CircuitApp = editor;
    window.CircuitShare = { encode, decode, MAX_LINK };
    fileBar(editor, opened);
  })();

  // ---------------- the bar: save, my circuits, share, example ----------------
  function fileBar(editor, opened) {
    const bar = document.createElement('div');
    bar.className = 'ck-filebar';
    bar.innerHTML = `
      <button type="button" class="ck-btn" data-file="save">💾 Save…</button>
      <button type="button" class="ck-btn" data-file="open">📂 My circuits</button>
      <button type="button" class="ck-btn" data-file="share">🔗 Share link</button>
      <button type="button" class="ck-btn" data-file="example">↺ Example circuit</button>
      <span class="ck-saved-note" aria-live="polite">${opened ? escapeHtml(opened) : 'Your circuit is kept in this browser as you work.'}</span>`;
    const panel = document.createElement('div');
    panel.className = 'ck-filepanel';
    panel.hidden = true;
    host.parentNode.insertBefore(bar, host);
    host.parentNode.insertBefore(panel, host);
    const note = bar.querySelector('.ck-saved-note');
    let showing = null;
    const close = () => { panel.hidden = true; showing = null; };
    const list = () => store.get('saved') || [];

    bar.addEventListener('click', async (ev) => {
      const b = ev.target.closest('[data-file]');
      if (!b) return;
      const what = b.dataset.file;
      if (what === 'example') { editor.store.load(EXAMPLE); editor.fit(); close(); note.textContent = 'The example circuit is open. Undo brings back what you had.'; return; }
      if (showing === what) { close(); return; }
      showing = what;
      panel.hidden = false;
      if (what === 'save') {
        const n = list().length + 1;
        panel.innerHTML = `<h3>Save this circuit in this browser</h3><div class="ck-buttons"><input type="text" aria-label="Name" maxlength="60" value="Circuit ${n}"><button type="button" class="ck-btn ck-primary" data-do="save">Save</button></div><p class="ck-small">Saved circuits stay in this browser on this device. To move a circuit to another device, use Share link.</p>`;
        const input = panel.querySelector('input');
        input.select();
        const doSave = () => {
          const name = input.value.trim() || `Circuit ${n}`;
          const items = list().filter((x) => x.name !== name);
          items.unshift({ name, date: new Date().toISOString().slice(0, 16).replace('T', ' '), data: M.pack(editor.store.drawing) });
          const ok = store.set('saved', items.slice(0, 50));
          note.textContent = ok ? `Saved as "${name}".` : "This browser isn't allowing the circuit to be saved (private browsing?). Use Share link instead.";
          close();
        };
        panel.querySelector('[data-do="save"]').addEventListener('click', doSave);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSave(); });
      } else if (what === 'open') {
        renderList();
      } else if (what === 'share') {
        panel.innerHTML = '<h3>Share link</h3><p class="ck-small">Making the link…</p>';
        const code = await encode(editor.store.drawing);
        if (code.length > MAX_LINK) { panel.innerHTML = '<h3>Share link</h3><p>This circuit is too large to share as a link. Save it instead, or make it smaller.</p>'; return; }
        const url = `${location.origin}${location.pathname}#c=${code}`;
        let copied = false;
        try { await navigator.clipboard.writeText(url); copied = true; } catch (e) { /* not allowed: the student copies it */ }
        panel.innerHTML = `<h3>Share link</h3><p class="ck-small">${copied ? 'The link has been copied. Paste it into a message or your notes.' : 'Copy this link and paste it into a message or your notes.'} Anyone who opens it gets their own copy of this circuit.</p><textarea readonly aria-label="Share link"></textarea>`;
        const ta = panel.querySelector('textarea');
        ta.value = url;
        ta.addEventListener('focus', () => ta.select());
      }
    });

    function renderList() {
      const items = list();
      if (!items.length) { panel.innerHTML = '<h3>My circuits</h3><p class="ck-small">No saved circuits yet. Use Save… to keep one.</p>'; return; }
      panel.innerHTML = `<h3>My circuits</h3><ul>${items.map((x, i) => `<li><span class="ck-fname"><strong>${escapeHtml(x.name)}</strong> <span class="ck-small">${escapeHtml(x.date || '')}</span></span><button type="button" class="ck-btn" data-open="${i}">Open</button><button type="button" class="ck-btn" data-del="${i}" aria-label="Delete ${escapeHtml(x.name)}">Delete</button></li>`).join('')}</ul><p class="ck-small">Opening a circuit replaces the one on the workspace; Undo brings it back.</p>`;
      panel.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => {
        const x = list()[Number(b.dataset.open)];
        if (!x) return;
        editor.store.load(M.unpack(x.data));
        editor.fit();
        note.textContent = `Opened "${x.name}".`;
        close();
      }));
      panel.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
        const items2 = list();
        const x = items2[Number(b.dataset.del)];
        if (!x || !window.confirm(`Delete "${x.name}"? This can't be undone.`)) return;
        items2.splice(Number(b.dataset.del), 1);
        store.set('saved', items2);
        renderList();
      }));
    }
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]); }
})();
