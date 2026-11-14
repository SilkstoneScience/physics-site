// Shared code for the real (hands-on) lab pages written from a handout: needs common.js, graph.js and report.js.
// Each page holds its settings in <script type="application/json" id="lab-config">:
//   { "key": "lab-n2l", "title": "Newton's second law", "file": "Newton's second law lab",
//     "tables": { "p1": { "note": "...", "csvFile": "n2l.csv", "x": 2, "y": 1, "cols": [{ "html", "csv", "aria" }, ...] } } }
// (x and y are column numbers counted from 1, for the graph's starting choice.)
// Saves every [data-save] field and every readings table in this browser, draws a live graph under each table
// that has a [data-lab-graph], and builds a Word report from the page, in page order:
//   [data-report-section="Heading"] -> that heading and every .answer (question and answer)
//   .measure-panel                   -> its h3 and each "label = value" line
//   [data-lab-table="id"]            -> its data-report-title, the table, and the graphs added to the report
(() => {
  const cfgEl = document.getElementById('lab-config');
  if (!window.Lab || !Lab.table || !Lab.graph || !Lab.docx || !cfgEl) return;
  let cfg;
  try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }
  const KEY = cfg.key;

  // ----- Measurements and answers: every [data-save] field, saved as it is typed -----
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { saved = {}; }
  document.querySelectorAll('[data-save]').forEach(el => { if (saved[el.dataset.save] !== undefined) el.value = saved[el.dataset.save]; });
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* storage blocked */ } };
  document.addEventListener('input', (e) => {
    const k = e.target.dataset && e.target.dataset.save;
    if (k) { saved[k] = e.target.value; store(); }
  });

  // ----- Readings tables -----
  const tables = {};
  for (const [id, t] of Object.entries(cfg.tables || {})) {
    const box = document.querySelector(`[data-lab-table="${id}"]`);
    if (box) tables[id] = Lab.table(box, { store: `${KEY}-${id}`, file: t.csvFile || `${id}.csv`, cols: t.cols, note: t.note });
  }

  // ----- Graphs, and the copies added to the report -----
  let snaps = [];
  try { snaps = JSON.parse(localStorage.getItem(KEY + '-graphs')) || []; } catch (e) { snaps = []; }
  const saveSnaps = () => {
    try { localStorage.setItem(KEY + '-graphs', JSON.stringify(snaps)); }
    catch (e) { return 'Your browser is full: download your report now, or remove a graph.'; }
    return '';
  };
  function listSnaps(id) {
    const box = document.querySelector(`[data-snaps="${id}"]`);
    if (!box) return;
    const mine = snaps.map((s, i) => ({ ...s, i })).filter(s => s.part === id);
    box.innerHTML = mine.length
      ? '<p class="vlab-small"><strong>Graphs in your report:</strong></p><ol class="vlab-log">' + mine.map(s =>
        `<li>${s.title} <button type="button" class="vlab-del" data-unsnap="${s.i}" aria-label="Remove this graph from the report">×</button></li>`).join('') + '</ol>'
      : '';
  }
  for (const [id, table] of Object.entries(tables)) {
    const root = document.querySelector(`[data-lab-graph="${id}"]`);
    if (!root) continue;
    const listeners = [];
    table.onChange(() => listeners.forEach(f => f()));
    Lab.graph(root, {
      x: cfg.tables[id].x || 1, y: cfg.tables[id].y || 2,
      source: {
        get: () => ({
          heads: ['reading', ...table.cols.map(c => c.csv)],
          rows: table.rows().map((r, i) => ({ name: `Reading ${i + 1}`, vals: r.map(v => String(v).trim() === '' ? NaN : Number(v)) })),
        }),
        onChange: f => listeners.push(f),
      },
      onSnapshot: (canvas, info) => {
        snaps.push({ part: id, title: info.text, url: canvas.toDataURL('image/png'), results: info.results });
        const problem = saveSnaps();
        listSnaps(id);
        return problem || 'Added to your report.';
      },
    });
    root.insertAdjacentHTML('beforeend', `<div data-snaps="${id}"></div>`);
    listSnaps(id);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-unsnap]');
    if (!b) return;
    const part = snaps[+b.dataset.unsnap].part;
    snaps.splice(+b.dataset.unsnap, 1); saveSnaps(); listSnaps(part);
  });

  // ----- The report -----
  const val = k => (saved[k] || '').trim();
  const clean = s => s.replace(/\s+/g, ' ').trim();
  const pngBytes = url => Uint8Array.from(atob(url.split(',')[1]), c => c.charCodeAt(0));
  const answers = section => [...section.querySelectorAll('.answer')].map(a =>
    ({ qa: [clean(a.querySelector('label').innerText), (a.querySelector('textarea').value || '').trim()] }));
  const measures = panel => [...panel.querySelectorAll('label')].map(l => {
    const input = l.querySelector('input, select');
    return { p: `${clean(l.innerText)} = ${(input && input.value.trim()) || '?'}` };
  });
  const tableBlock = id => {
    const t = tables[id], rows = t.rows().filter(r => r.some(v => String(v).trim() !== ''));
    return rows.length
      ? [{ table: { head: t.cols.map(c => c.csv.replace(/\^-1/g, '⁻¹').replace(/\^-2/g, '⁻²')), rows } }]
      : [{ p: '(No readings recorded.)', italic: true }];
  };
  const graphBlocks = id => snaps.filter(s => s.part === id).flatMap(s =>
    [{ p: `Graph: ${s.title}`, bold: true }, { image: { png: pngBytes(s.url), w: 600, h: 400 } }, { p: s.results }]);

  function build() {
    const blocks = [
      { h1: `${cfg.title}: lab report` },
      { p: `Name: ${val('name') || '(not given)'}` },
      { p: `Partner(s): ${val('partners') || '(none given)'}` },
      { p: `Downloaded: ${new Date().toLocaleString()}` },
    ];
    const parts = document.querySelectorAll('main [data-report-section], main .measure-panel, main [data-lab-table]');
    parts.forEach(el => {
      if (el.matches('[data-report-section]')) blocks.push({ h2: el.dataset.reportSection }, ...answers(el));
      else if (el.matches('.measure-panel')) {
        const h = el.querySelector('h3');
        blocks.push({ h2: h ? clean(h.innerText) : 'Measurements' }, ...measures(el));
      } else {
        const id = el.dataset.labTable;
        if (!tables[id]) return;
        blocks.push({ h2: el.dataset.reportTitle || 'Readings' }, ...tableBlock(id), ...graphBlocks(id));
      }
    });
    const name = (val('name') || 'report').replace(/[^\w\- ]+/g, '').trim() || 'report';
    Lab.download(Lab.docx(blocks), `${cfg.file} - ${name}.docx`);
    const msg = document.querySelector('[data-report="msg"]');
    if (msg) msg.textContent = 'Your report has been downloaded. Open it in Word to check it, then hand it in.';
  }
  document.querySelectorAll('button[data-report="download"]').forEach(b => b.addEventListener('click', build));
})();
