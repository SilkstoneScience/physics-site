// Shared helpers for the virtual practicals (js/labs/*.js): sharp canvases, theme colours,
// and the "Your readings" table with CSV download (saved in this browser only).
window.Lab = (() => {
  const col = {};
  const readColours = () => {
    const cs = getComputedStyle(document.body);
    ['--surface', '--text', '--muted', '--border', '--accent', '--bg', '--good', '--bad'].forEach(v => { col[v] = cs.getPropertyValue(v).trim(); });
  };
  readColours();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColours);

  function fit(c, w, h) {   // sharp canvas on high-resolution screens
    const d = devicePixelRatio || 1;
    if (c.width !== Math.round(w * d) || c.height !== Math.round(h * d)) {
      c.width = Math.round(w * d); c.height = Math.round(h * d);
      c.style.height = h + 'px';
    }
    const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); return g;
  }

  const esc = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  // cols: [{ html: 'Length <i>L</i> / m', csv: 'length L / m', aria: 'length in metres' }, ...]
  function table(panel, { store, file, cols, note }) {
    const blank = () => cols.map(() => '');
    panel.innerHTML = `
      <h4>Your readings</h4>
      ${note ? `<p class="vlab-small">${note}</p>` : ''}
      <div class="table-wrap"><table class="notes vlab-table"><thead><tr>${cols.map(c => `<th>${c.html}</th>`).join('')}<th aria-label="Remove a row"></th></tr></thead><tbody></tbody></table></div>
      <div class="vlab-buttons">
        <button type="button" class="button secondary" data-t="add">Add a row</button>
        <button type="button" class="button secondary" data-t="csv">Download as CSV</button>
        <button type="button" class="button secondary" data-t="clear">Clear the table</button>
      </div>
      <p class="vlab-small" data-t="msg" aria-live="polite"></p>`;
    const tbody = panel.querySelector('tbody'), msg = panel.querySelector('[data-t="msg"]');
    let rows;
    try { rows = JSON.parse(localStorage.getItem(store)); } catch (e) { rows = null; }
    if (Array.isArray(rows)) rows = rows.filter(r => Array.isArray(r) && r.length === cols.length);
    if (!Array.isArray(rows) || !rows.length) rows = [blank()];
    const save = () => { try { localStorage.setItem(store, JSON.stringify(rows)); } catch (e) { /* storage blocked: the table still works */ } };
    const render = () => {
      tbody.innerHTML = rows.map((r, i) => `<tr>${r.map((v, j) =>
        `<td><input data-r="${i}" data-c="${j}" inputmode="decimal" value="${esc(v)}" aria-label="Row ${i + 1}: ${cols[j].aria}"></td>`).join('')}
        <td><button type="button" class="vlab-del" data-del="${i}" aria-label="Remove row ${i + 1}">×</button></td></tr>`).join('');
    };
    tbody.addEventListener('input', (e) => {
      const el = e.target;
      if (rows[+el.dataset.r]) { rows[+el.dataset.r][+el.dataset.c] = el.value; save(); }
    });
    tbody.addEventListener('click', (e) => {
      const b = e.target.closest('[data-del]');
      if (!b) return;
      rows.splice(+b.dataset.del, 1);
      if (!rows.length) rows.push(blank());
      save(); render();
    });
    panel.querySelector('[data-t="add"]').addEventListener('click', () => { rows.push(blank()); save(); render(); });
    panel.querySelector('[data-t="clear"]').addEventListener('click', () => {
      if (!confirm('Clear all your readings?')) return;
      rows = [blank()]; save(); render();
    });
    panel.querySelector('[data-t="csv"]').addEventListener('click', () => {
      const lines = [cols.map(c => c.csv).join(',')].concat(rows.map(r => r.map(v => String(v).replace(/,/g, '.')).join(',')));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv' }));
      a.download = file;
      document.body.appendChild(a); a.click(); a.remove();
    });
    render();
    return {
      // Put values into the last row (filling only its empty cells), or start a new row if they don't fit.
      fill(values) {
        let r = rows[rows.length - 1];
        const fits = values.every((v, j) => v === undefined || r[j] === '');
        if (!fits) { r = blank(); rows.push(r); }
        values.forEach((v, j) => { if (v !== undefined) r[j] = v; });
        save(); render();
        return rows.length;
      },
      say(text) { msg.textContent = text; },
    };
  }

  // Random numbers from a Poisson distribution (Knuth's method; fine for small means)
  function poisson(mean) {
    if (mean > 30) return Math.max(0, Math.round(mean + Math.sqrt(mean) * gauss()));
    const L = Math.exp(-mean); let k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  }
  function gauss() { return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random()); }

  return { col, fit, table, poisson, gauss };
})();
