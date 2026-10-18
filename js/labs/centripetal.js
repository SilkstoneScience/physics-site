// Centripetal acceleration lab (experimental/centripetal.html): needs common.js, graph.js and report.js.
// Saves the student's measurements and answers in this browser, runs the two readings tables and their graphs,
// and builds a Word report with everything in it.
(() => {
  if (!window.Lab || !Lab.table || !Lab.graph || !Lab.docx) return;
  const KEY = 'lab-centripetal';

  // ----- Measurements and answers: every [data-save] field, saved as it is typed -----
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { saved = {}; }
  const fields = [...document.querySelectorAll('[data-save]')];
  fields.forEach(el => { if (saved[el.dataset.save] !== undefined) el.value = saved[el.dataset.save]; });
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* storage blocked */ } };
  document.addEventListener('input', (e) => {
    const k = e.target.dataset && e.target.dataset.save;
    if (k) { saved[k] = e.target.value; store(); }
  });

  // ----- Readings tables -----
  const TABLES = {
    p1: { note: 'One row for each release. Fill in the last column during the analysis (question 8).', cols: [
      { html: 'Peak force <i>F</i> / N', csv: 'peak force F / N', aria: 'peak force in newtons' },
      { html: 'Maximum speed <i>v</i> / m s<sup>−1</sup>', csv: 'maximum speed v / m s^-1', aria: 'maximum speed in metres per second' },
      { html: 'Resultant force <i>F</i><sub>net</sub> / N', csv: 'resultant force Fnet / N', aria: 'resultant force in newtons' }] },
    p2: { note: 'One row for each radius. Fill in the last column during the analysis (question 8).', cols: [
      { html: 'Radius <i>r</i> / m', csv: 'radius r / m', aria: 'radius in metres' },
      { html: 'Peak force <i>F</i> / N', csv: 'peak force F / N', aria: 'peak force in newtons' },
      { html: 'Resultant force <i>F</i><sub>net</sub> / N', csv: 'resultant force Fnet / N', aria: 'resultant force in newtons' }] },
  };
  const GRAPHS = { p1: { x: 2, y: 1 }, p2: { x: 1, y: 2 } };
  const tables = {};
  for (const [id, t] of Object.entries(TABLES)) {
    const box = document.querySelector(`[data-lab-table="${id}"]`);
    if (box) tables[id] = Lab.table(box, { store: `${KEY}-${id}`, file: `centripetal-part-${id.slice(1)}.csv`, cols: t.cols, note: t.note });
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
      x: GRAPHS[id].x, y: GRAPHS[id].y,
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
  const pngBytes = url => Uint8Array.from(atob(url.split(',')[1]), c => c.charCodeAt(0));
  const answers = section => [...section.querySelectorAll('.answer')].map(a =>
    ({ qa: [a.querySelector('label').innerText.trim(), (a.querySelector('textarea').value || '').trim()] }));
  const tableBlock = id => {
    const t = tables[id], rows = t.rows().filter(r => r.some(v => String(v).trim() !== ''));
    return rows.length
      ? [{ table: { head: t.cols.map(c => c.csv.replace(/\^-1/g, '⁻¹')), rows } }]
      : [{ p: '(No readings recorded.)', italic: true }];
  };
  const graphBlocks = id => snaps.filter(s => s.part === id).flatMap(s =>
    [{ p: `Graph: ${s.title}`, bold: true }, { image: { png: pngBytes(s.url), w: 600, h: 400 } }, { p: s.results }]);
  const section = name => document.querySelector(`[data-report-section="${name}"]`);

  function build() {
    const blocks = [
      { h1: 'Centripetal acceleration with a pendulum: lab report' },
      { p: `Name: ${val('name') || '(not given)'}` },
      { p: `Partner(s): ${val('partners') || '(none given)'}` },
      { p: `Downloaded: ${new Date().toLocaleString()}` },
      { h2: 'Before the lab' }, ...answers(section('Before the lab')),
      { h2: 'Part 1: force and speed' },
      { p: `Mass of the bob m = ${val('p1-m') || '?'} kg;  radius r = ${val('p1-r') || '?'} m;  diameter of the slotted masses d = ${val('p1-d') || '?'} m` },
      ...tableBlock('p1'), ...graphBlocks('p1'),
      { h2: 'Part 2: force and radius' },
      { p: `Mass of the bob m = ${val('p2-m') || '?'} kg;  target speed v = ${val('p2-v') || '?'} m s⁻¹` },
      ...tableBlock('p2'), ...graphBlocks('p2'),
      { h2: 'Analysis: Part 1' }, ...answers(section('Analysis: Part 1')),
      { h2: 'Analysis: Part 2' }, ...answers(section('Analysis: Part 2')),
      { h2: 'Analysis: Part 3' }, ...answers(section('Analysis: Part 3')),
    ];
    const name = (val('name') || 'report').replace(/[^\w\- ]+/g, '').trim() || 'report';
    Lab.download(Lab.docx(blocks), `Centripetal lab - ${name}.docx`);
    const msg = document.querySelector('[data-report="msg"]');
    if (msg) msg.textContent = 'Your report has been downloaded. Open it in Word to check it, then hand it in.';
  }
  document.querySelectorAll('button[data-report="download"]').forEach(b => b.addEventListener('click', build));
})();
