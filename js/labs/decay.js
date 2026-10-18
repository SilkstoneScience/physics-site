// Virtual practical: the half-life of protactinium-234m (needs js/labs/common.js).
// Builds the lab inside <div class="vlab" data-lab="decay">. A Geiger–Müller tube and counter record random
// counts from background radiation and, after the bottle is shaken, from protactinium-234m in the top layer.
(() => {
  const root = document.querySelector('.vlab[data-lab="decay"]');
  if (!root || !window.Lab) return;
  const { col, fit, table, poisson } = Lab;

  // ----- The physics -----
  const HALF = 70;                       // half-life of Pa-234m / s (revealed on the page as a check)
  const LAMBDA = Math.LN2 / HALF;
  const C0 = 28;                         // count rate from the sample just after shaking / counts per second
  const BG = 0.45;                       // background count rate / counts per second
  let shaken = false, tShake = 0;        // when the bottle was last shaken (simulation time / s)
  let now = 0;                           // simulation time / s
  let counting = false, countStart = 0, countFor = 10, count = 0, startedAt = null;
  let flash = 0, sound = false, audio = null;
  const rate = t => BG + (shaken ? C0 * Math.exp(-LAMBDA * (t - tShake)) : 0);

  // ----- The page elements -----
  root.innerHTML = `
    <div class="vlab-grid">
      <div class="vlab-scene">
        <canvas class="vlab-main" role="img" aria-label="A sealed bottle with two liquid layers, and a Geiger–Müller tube held next to the top layer, connected to a counter."></canvas>
        <div class="vlab-panel" style="margin-top:12px">
          <h4>The bottle</h4>
          <div class="vlab-buttons"><button type="button" class="button" data-k="shake">Shake the bottle</button></div>
          <p class="vlab-small">Shaking moves the protactinium into the top layer, next to the tube. The stopwatch starts when the layers have separated.</p>
          <p class="vlab-watch"><output data-k="clock">–</output> s</p>
        </div>
      </div>
      <div class="vlab-side">
        <div class="vlab-panel">
          <h4>Counter</h4>
          <label class="vlab-field">Counting time
            <select data-k="period"><option value="10" selected>10 s</option><option value="20">20 s</option><option value="100">100 s</option></select>
          </label>
          <p class="vlab-watch"><output data-k="count">0</output> <span class="vlab-small" data-k="status">counts</span></p>
          <div class="vlab-buttons">
            <button type="button" class="button" data-k="go">Start counting</button>
            <button type="button" class="button secondary" data-k="record">Add to table</button>
          </div>
          <label class="vlab-small vlab-check"><input type="checkbox" data-k="sound"> Click for each count</label>
        </div>
      </div>
    </div>
    <div class="vlab-panel" data-k="table"></div>`;

  const $ = k => root.querySelector(`[data-k="${k}"]`);
  const main = root.querySelector('.vlab-main');
  const goBtn = $('go'), countOut = $('count'), status = $('status'), clock = $('clock'), periodSel = $('period');

  $('shake').addEventListener('click', () => { shaken = true; tShake = now; });
  $('sound').addEventListener('change', (e) => {
    sound = e.target.checked;
    if (sound && !audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (err) { audio = null; } }
  });
  goBtn.addEventListener('click', () => {
    if (counting) return;
    countFor = +periodSel.value; count = 0; counting = true; countStart = now;
    startedAt = shaken ? now - tShake : null;
    goBtn.disabled = periodSel.disabled = true; status.textContent = 'counting…'; countOut.textContent = '0';
  });

  const readings = table($('table'), {
    store: 'vlab-decay', file: 'decay-readings.csv',
    note: 'Record your background count separately. Your readings are kept in this browser until you clear them.',
    cols: [
      { html: 'Time at start of count <i>t</i> / s', csv: 'start time t / s', aria: 'time at the start of the count in seconds' },
      { html: 'Counting time / s', csv: 'counting time / s', aria: 'counting time in seconds' },
      { html: 'Count <i>N</i>', csv: 'count N', aria: 'number of counts' }],
  });
  $('record').addEventListener('click', () => {
    if (counting) { readings.say('Wait until the counter has finished.'); return; }
    if (startedAt === null && countOut.textContent === '0') { readings.say('Take a count first.'); return; }
    const t = startedAt === null ? '' : String(Math.round(startedAt));
    const row = readings.fill([t, String(countFor), countOut.textContent]);
    readings.say(startedAt === null
      ? `Added a count of ${countOut.textContent} in row ${row}, with no start time: was this your background count?`
      : `Added a count of ${countOut.textContent}, started at ${t} s, in row ${row}.`);
  });

  function click() {
    if (!sound || !audio) return;
    const o = audio.createOscillator(), v = audio.createGain();
    o.type = 'square'; o.frequency.value = 1800; v.gain.value = 0.05;
    o.connect(v); v.connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.004);
  }

  // ----- Drawing -----
  function draw() {
    const W = main.clientWidth, H = Math.round(W * 0.62), g = fit(main, W, H);
    g.fillStyle = col['--surface']; g.fillRect(0, 0, W, H);
    // bottle with two layers
    const bx = W * 0.18, bw = W * 0.22, by = H * 0.18, bh = H * 0.7;
    const top = shaken ? Math.max(0, 1 - (now - tShake) / 4) : 0;   // the layers separate a few seconds after shaking
    g.fillStyle = col['--border']; g.fillRect(bx + bw * 0.3, by - H * 0.08, bw * 0.4, H * 0.08);
    g.fillStyle = '#f2d16b'; g.fillRect(bx, by + bh * 0.1, bw, bh * 0.4);        // organic (top) layer
    g.fillStyle = '#8fb8de'; g.fillRect(bx, by + bh * 0.5, bw, bh * 0.5);        // aqueous (bottom) layer
    if (top > 0) { g.fillStyle = `rgba(200,200,200,${0.8 * top})`; g.fillRect(bx, by + bh * 0.1, bw, bh * 0.9); }
    g.strokeStyle = col['--text']; g.lineWidth = 2; g.strokeRect(bx, by, bw, bh);
    // GM tube beside the top layer
    const tx = bx + bw + 6, ty = by + bh * 0.22, tw = W * 0.3, th = Math.max(14, H * 0.09);
    g.fillStyle = col['--muted']; g.fillRect(tx, ty, tw, th);
    g.fillStyle = flash > 0 ? col['--bad'] : col['--surface']; g.beginPath(); g.arc(tx + 4, ty + th / 2, th * 0.3, 0, 2 * Math.PI); g.fill();
    g.strokeStyle = col['--text']; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(tx + tw, ty + th / 2); g.lineTo(W * 0.82, ty + th / 2); g.lineTo(W * 0.82, H * 0.55); g.stroke();
    // counter box
    const cx = W * 0.68, cy = H * 0.55, cw = W * 0.28, ch = H * 0.24;
    g.fillStyle = '#2b3440'; g.fillRect(cx, cy, cw, ch);
    g.fillStyle = '#7CFC9A'; g.font = `bold ${Math.round(ch * 0.4)}px ui-monospace, monospace`; g.textAlign = 'center';
    g.fillText(countOut.textContent.padStart(4, ' '), cx + cw / 2, cy + ch * 0.62);
    g.fillStyle = col['--text']; g.font = '12px system-ui, sans-serif';
    g.fillText('GM tube', tx + tw / 2, ty - 6); g.fillText('counter', cx + cw / 2, cy + ch + 14);
    g.fillText('sealed bottle', bx + bw / 2, by + bh + 16);
  }

  // ----- Animation: counts arrive at random, at the current average rate -----
  let last = performance.now();
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t; now += dt;
    if (counting) {
      const end = countStart + countFor, step = Math.min(dt, end - (now - dt));
      const n = poisson(rate(now) * Math.max(0, step));
      if (n) { count += n; flash = 0.05; for (let i = 0; i < Math.min(n, 3); i++) click(); }
      countOut.textContent = count;
      if (now >= end) { counting = false; goBtn.disabled = periodSel.disabled = false; status.textContent = `counts in ${countFor} s`; }
    } else if (Math.random() < rate(now) * dt) { flash = 0.05; click(); }   // the tube still clicks between counts
    flash = Math.max(0, flash - dt);
    clock.textContent = shaken ? (now - tShake).toFixed(1) : '–';
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
