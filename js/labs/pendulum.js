// Virtual practical: the simple pendulum (Practicals page).
// Builds the lab inside <div class="vlab" data-lab="pendulum">. The student measures everything themselves:
// the length with a magnified metre rule, and the time with a stopwatch they start and stop by hand,
// so their own reaction time gives the random scatter, as in a real lab.
(() => {
  const root = document.querySelector('.vlab[data-lab="pendulum"]');
  if (!root) return;

  // ----- The physics -----
  const G = 9.81;          // the simulation's g / m s^-2 (revealed on the page as a check)
  const R = 0.0125;        // bob radius / m (diameter 25.0 mm)
  const BETA = 1 / 300;    // damping: the amplitude falls by a factor e in 300 s
  const S_MIN = 0.200, S_MAX = 1.000;  // string length range / m (pivot to the top of the bob)
  const STORE = 'vlab-pendulum';

  let s = 0.40 + Math.random() * 0.40;   // string length / m: unknown until measured
  let theta = 0, omega = 0, swinging = false;
  let angle0 = 10;                        // release angle / degrees
  let watch = 0, watchOn = false;         // stopwatch time / s (counts simulation time, so it matches the pendulum)

  const L = () => s + R;                                  // pivot to the centre of the bob
  const Leff = () => L() + 0.4 * R * R / L();              // a real bob is not a point (tiny correction)
  const accel = (th, om) => -(G / Leff()) * Math.sin(th) - 2 * BETA * om;

  function step(dt) {      // Runge–Kutta 4: accurate even for large angles
    const n = Math.ceil(dt / 0.002), h = dt / n;
    for (let i = 0; i < n; i++) {
      const k1t = omega, k1o = accel(theta, omega);
      const k2t = omega + h / 2 * k1o, k2o = accel(theta + h / 2 * k1t, omega + h / 2 * k1o);
      const k3t = omega + h / 2 * k2o, k3o = accel(theta + h / 2 * k2t, omega + h / 2 * k2o);
      const k4t = omega + h * k3o, k4o = accel(theta + h * k3t, omega + h * k3o);
      theta += h / 6 * (k1t + 2 * k2t + 2 * k3t + k4t);
      omega += h / 6 * (k1o + 2 * k2o + 2 * k3o + k4o);
    }
  }

  // ----- The page elements -----
  root.innerHTML = `
    <div class="vlab-grid">
      <div class="vlab-scene">
        <canvas class="vlab-main" role="img" aria-label="A pendulum hanging from a clamp beside a vertical metre rule, with a timing marker below its lowest point."></canvas>
      </div>
      <div class="vlab-side">
        <div class="vlab-panel">
          <h4>Set up</h4>
          <label class="vlab-field">Adjust the string length <input type="range" data-k="len" min="${S_MIN}" max="${S_MAX}" step="0.0005" value="${s}"></label>
          <label class="vlab-field">Release angle: <b data-k="angle-out">${angle0}°</b> <input type="range" data-k="angle" min="4" max="40" step="1" value="${angle0}"></label>
          <div class="vlab-buttons">
            <button type="button" class="button" data-k="release">Release</button>
            <button type="button" class="button secondary" data-k="halt" disabled>Stop the pendulum</button>
          </div>
        </div>
        <div class="vlab-panel">
          <h4>Metre rule (magnified)</h4>
          <canvas class="vlab-zoom" role="img" aria-label="A magnified view of the metre rule beside the top of the bob, marked in centimetres and millimetres."></canvas>
          <p class="vlab-small">The rule's zero is level with the pivot. Read it at the <strong>top</strong> of the bob. Bob diameter: (25.0 ± 0.1) mm, measured with vernier calipers.</p>
        </div>
        <div class="vlab-panel">
          <h4>Stopwatch</h4>
          <p class="vlab-watch"><output data-k="watch">0.00</output> s</p>
          <div class="vlab-buttons">
            <button type="button" class="button" data-k="startstop">Start</button>
            <button type="button" class="button secondary" data-k="reset">Reset</button>
            <button type="button" class="button secondary" data-k="record">Add to table</button>
          </div>
          <p class="vlab-small">Tip: you can also press the space bar to start and stop.</p>
        </div>
      </div>
    </div>
    <div class="vlab-panel">
      <h4>Your readings</h4>
      <p class="vlab-small">Times are for <strong>10 oscillations</strong>. Your readings are kept in this browser until you clear them.</p>
      <div class="table-wrap"><table class="notes vlab-table"><thead><tr><th>String length <i>s</i> / m</th>${[1, 2, 3, 4, 5].map(i => `<th><i>t</i><sub>${i}</sub> / s</th>`).join('')}<th><span class="visually-hidden">Remove</span></th></tr></thead><tbody></tbody></table></div>
      <div class="vlab-buttons">
        <button type="button" class="button secondary" data-k="addrow">Add a row</button>
        <button type="button" class="button secondary" data-k="csv">Download as CSV</button>
        <button type="button" class="button secondary" data-k="clear">Clear the table</button>
      </div>
      <p class="vlab-small" data-k="msg" aria-live="polite"></p>
    </div>`;

  const $ = k => root.querySelector(`[data-k="${k}"]`);
  const main = root.querySelector('.vlab-main'), zoom = root.querySelector('.vlab-zoom');
  const lenIn = $('len'), angIn = $('angle'), releaseBtn = $('release'), haltBtn = $('halt');
  const watchOut = $('watch'), ssBtn = $('startstop'), msg = $('msg'), tbody = root.querySelector('tbody');

  lenIn.addEventListener('input', () => { s = +lenIn.value; });
  angIn.addEventListener('input', () => { angle0 = +angIn.value; $('angle-out').textContent = angle0 + '°'; });
  releaseBtn.addEventListener('click', () => {
    theta = angle0 * Math.PI / 180; omega = 0; swinging = true;
    lenIn.disabled = angIn.disabled = releaseBtn.disabled = true; haltBtn.disabled = false;
  });
  haltBtn.addEventListener('click', () => {
    theta = omega = 0; swinging = false;
    lenIn.disabled = angIn.disabled = releaseBtn.disabled = false; haltBtn.disabled = true;
  });

  const showWatch = () => { watchOut.textContent = watch.toFixed(2); };
  const toggleWatch = () => { watchOn = !watchOn; ssBtn.textContent = watchOn ? 'Stop' : 'Start'; };
  ssBtn.addEventListener('click', toggleWatch);
  $('reset').addEventListener('click', () => { if (watchOn) toggleWatch(); watch = 0; showWatch(); });
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat || e.target.closest('input, select, textarea, button, a, summary')) return;
    const r = root.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;   // only while the lab is on screen
    e.preventDefault(); toggleWatch();
  });

  // ----- The readings table (saved in this browser only) -----
  let rows;
  try { rows = JSON.parse(localStorage.getItem(STORE)); } catch (e) { rows = null; }
  if (Array.isArray(rows)) rows = rows.filter(r => r && Array.isArray(r.t) && r.t.length === 5);
  if (!Array.isArray(rows) || !rows.length) rows = [{ s: '', t: ['', '', '', '', ''] }];
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(rows)); } catch (e) { /* storage blocked: the table still works */ } };

  const esc = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  function renderTable() {
    tbody.innerHTML = rows.map((r, i) => `<tr>
      <td><input data-r="${i}" data-c="s" inputmode="decimal" value="${esc(r.s)}" aria-label="Row ${i + 1}: string length in metres"></td>
      ${r.t.map((t, j) => `<td><input data-r="${i}" data-c="${j}" inputmode="decimal" value="${esc(t)}" aria-label="Row ${i + 1}: time ${j + 1} in seconds"></td>`).join('')}
      <td><button type="button" class="vlab-del" data-del="${i}" aria-label="Remove row ${i + 1}">×</button></td></tr>`).join('');
  }
  tbody.addEventListener('input', (e) => {
    const el = e.target, r = rows[+el.dataset.r];
    if (!r) return;
    if (el.dataset.c === 's') r.s = el.value; else r.t[+el.dataset.c] = el.value;
    save();
  });
  tbody.addEventListener('click', (e) => {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    rows.splice(+b.dataset.del, 1);
    if (!rows.length) rows.push({ s: '', t: ['', '', '', '', ''] });
    save(); renderTable();
  });
  $('addrow').addEventListener('click', () => { rows.push({ s: '', t: ['', '', '', '', ''] }); save(); renderTable(); });
  $('clear').addEventListener('click', () => {
    if (!confirm('Clear all your readings?')) return;
    rows = [{ s: '', t: ['', '', '', '', ''] }]; save(); renderTable();
  });
  $('record').addEventListener('click', () => {
    if (watchOn || watch === 0) { msg.textContent = 'Stop the stopwatch first, then add the time.'; return; }
    const r = rows[rows.length - 1], j = r.t.indexOf('');
    if (j < 0) { msg.textContent = 'The last row is full: press "Add a row" first.'; return; }
    r.t[j] = watch.toFixed(2); save(); renderTable();
    msg.textContent = `Added ${watch.toFixed(2)} s as t${j + 1} in row ${rows.length}.`;
  });
  $('csv').addEventListener('click', () => {
    const lines = [['string length s / m', 't1 / s', 't2 / s', 't3 / s', 't4 / s', 't5 / s'].join(',')]
      .concat(rows.map(r => [r.s, ...r.t].map(v => String(v).replace(/,/g, '.')).join(',')));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv' }));
    a.download = 'pendulum-readings.csv';
    document.body.appendChild(a); a.click(); a.remove();
  });
  renderTable();

  // ----- Drawing -----
  let col = {};
  const readColours = () => {
    const cs = getComputedStyle(document.body);
    ['--surface', '--text', '--muted', '--border', '--accent', '--bg'].forEach(v => { col[v] = cs.getPropertyValue(v).trim(); });
  };
  readColours();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColours);
  const RULE = '#efdca8', RULE_INK = '#1c2430';

  function fit(c, w, h) {   // sharp canvas on high-resolution screens
    const d = devicePixelRatio || 1;
    if (c.width !== Math.round(w * d) || c.height !== Math.round(h * d)) {
      c.width = Math.round(w * d); c.height = Math.round(h * d);
      c.style.height = h + 'px';
    }
    const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); return g;
  }

  function drawMain() {
    const W = main.clientWidth, H = Math.round(W / 1.25), g = fit(main, W, H);
    const k = H / 1.18, px = W * 0.56, py = 0.05 * k;   // pixels per metre; pivot
    g.clearRect(0, 0, W, H); g.fillStyle = col['--surface']; g.fillRect(0, 0, W, H);
    g.font = '11px system-ui, sans-serif';
    // clamp stand
    g.fillStyle = col['--muted']; g.fillRect(px - 0.08 * k, py - 0.035 * k, 0.16 * k, 0.035 * k);
    // metre rule (behind the pendulum)
    const rx = px - 0.12 * k, rw = Math.max(30, 0.045 * k);
    g.fillStyle = RULE; g.fillRect(rx - rw, py, rw, 1.0 * k);
    g.strokeStyle = RULE_INK; g.fillStyle = RULE_INK; g.lineWidth = 1; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = '10px system-ui, sans-serif';
    for (let cm = 0; cm <= 100; cm++) {
      const y = py + cm / 100 * k, len = cm % 10 === 0 ? rw * 0.4 : cm % 5 === 0 ? rw * 0.28 : rw * 0.15;
      if (cm % 2 && k < 300 && cm % 5) continue;   // too crowded on small screens: every 2 cm
      g.beginPath(); g.moveTo(rx, y); g.lineTo(rx - len, y); g.stroke();
      if (cm % 10 === 0 && cm) g.fillText(cm, rx - rw + 2, y);
    }
    g.textBaseline = 'alphabetic';
    // timing marker below the lowest point
    const low = py + (L() + R) * k;
    g.strokeStyle = col['--accent']; g.lineWidth = 2; g.setLineDash([4, 3]);
    g.beginPath(); g.moveTo(px, low + 6); g.lineTo(px, Math.min(H - 2, low + 0.10 * k)); g.stroke(); g.setLineDash([]);
    // release angle (while at rest)
    if (!swinging) {
      const a = angle0 * Math.PI / 180, l = L() * k;
      g.strokeStyle = col['--muted']; g.lineWidth = 1; g.setLineDash([3, 4]);
      g.beginPath(); g.moveTo(px, py); g.lineTo(px + l * Math.sin(a), py + l * Math.cos(a)); g.stroke();
      g.beginPath(); g.arc(px, py, 0.12 * k, Math.PI / 2 - a, Math.PI / 2); g.stroke(); g.setLineDash([]);
    }
    // string and bob
    const bx = px + L() * k * Math.sin(theta), by = py + L() * k * Math.cos(theta);
    g.strokeStyle = col['--text']; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(px, py); g.lineTo(bx, by); g.stroke();
    g.fillStyle = col['--accent']; g.beginPath(); g.arc(bx, by, Math.max(R * k, 6), 0, 2 * Math.PI); g.fill();
  }

  function drawZoom() {
    const W = 180, H = 220, g = fit(zoom, W, H), k = 6000;   // 6 pixels per millimetre
    g.fillStyle = col['--surface']; g.fillRect(0, 0, W, H);
    if (swinging) {
      g.fillStyle = col['--muted']; g.font = '13px system-ui, sans-serif'; g.textAlign = 'center';
      g.fillText('Stop the pendulum', W / 2, H / 2 - 8); g.fillText('to measure its length', W / 2, H / 2 + 10);
      return;
    }
    const y0 = s - (H / 2) / k;              // reading at the top of the view / m
    const Y = v => (v - y0) * k;
    // the top of the bob, beside the rule
    const cx = 112, cy = Y(s + R);
    g.strokeStyle = col['--text']; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, Y(s)); g.stroke();
    g.fillStyle = col['--accent']; g.beginPath(); g.arc(cx, cy, R * k, 0, 2 * Math.PI); g.fill();
    // the rule, in front
    const rw = 52; g.fillStyle = RULE; g.fillRect(0, 0, rw, H);
    g.strokeStyle = RULE_INK; g.fillStyle = RULE_INK; g.lineWidth = 1; g.font = '12px system-ui, sans-serif'; g.textAlign = 'left';
    for (let mm = Math.floor(y0 * 1000); mm <= Math.ceil((y0 + H / k) * 1000); mm++) {
      const y = Y(mm / 1000) + 0.5, len = mm % 10 === 0 ? 22 : mm % 5 === 0 ? 14 : 8;
      g.beginPath(); g.moveTo(rw, y); g.lineTo(rw - len, y); g.stroke();
      if (mm % 10 === 0) g.fillText(mm / 10, 3, y + 4);
    }
    g.fillStyle = col['--muted']; g.font = '11px system-ui, sans-serif'; g.fillText('cm', 3, H - 4);
  }

  // ----- Animation: the pendulum and the stopwatch share one clock -----
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (swinging) step(dt);
    if (watchOn) { watch += dt; showWatch(); }
    drawMain(); drawZoom();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
