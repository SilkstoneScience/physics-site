// Virtual practical: the resistivity of a metal wire (needs js/labs/common.js).
// Builds the lab inside <div class="vlab" data-lab="resistivity">. The student reads the clip position on a
// magnified metre rule, reads two analogue meters (the ammeter has a small zero error), and measures the
// diameter with a digital micrometer at different points along the wire.
(() => {
  const root = document.querySelector('.vlab[data-lab="resistivity"]');
  if (!root || !window.Lab) return;
  const { col, fit, table, gauss } = Lab;

  // ----- The physics -----
  const RHO = 4.9e-7;       // resistivity of the wire (constantan) / ohm m (revealed on the page as a check)
  const D = 0.315e-3;       // mean diameter / m (30 SWG)
  const EMF = 1.50, R_INT = 1.00, R_CONTACT = 0.12;   // cell emf / V, internal resistance / ohm, clip contact resistance / ohm
  const ZERO_ERR = 0.01;    // ammeter zero error / A (the needle sits half a division above zero)
  const L_MIN = 0.100, L_MAX = 0.950;
  const AREA = Math.PI * D * D / 4;
  let L = 0.3 + Math.random() * 0.3, closed = false;
  let flick = 0;            // slow random flicker of both needles, in divisions
  const current = () => closed ? EMF / (RHO * L / AREA + R_CONTACT + R_INT) : 0;
  const pd = () => current() * (RHO * L / AREA + R_CONTACT);

  // ----- The page elements -----
  root.innerHTML = `
    <div class="vlab-grid">
      <div class="vlab-scene">
        <canvas class="vlab-main" role="img" aria-label="A resistance wire stretched along a metre rule, with a fixed clip at the zero and a sliding clip."></canvas>
        <div class="vlab-panel" style="margin-top:12px">
          <h4>Set up</h4>
          <label class="vlab-field">Move the sliding clip <input type="range" data-k="len" min="${L_MIN}" max="${L_MAX}" step="0.0005" value="${L}"></label>
          <div class="vlab-buttons"><button type="button" class="button" data-k="switch">Close the switch</button></div>
          <p class="vlab-small">Open the switch between readings, as you would in the lab, so the wire doesn't warm up.</p>
        </div>
      </div>
      <div class="vlab-side">
        <div class="vlab-panel">
          <h4>Metre rule at the sliding clip (magnified)</h4>
          <canvas class="vlab-zoom vlab-zoom-wide" role="img" aria-label="A magnified view of the metre rule under the sliding clip, marked in centimetres and millimetres."></canvas>
          <p class="vlab-small">The fixed clip is at the zero of the rule. Read the rule where the clip's edge touches the wire.</p>
        </div>
        <div class="vlab-panel">
          <h4>Meters</h4>
          <canvas class="vlab-dial" data-k="amm" role="img" aria-label="An analogue ammeter reading from 0 to 1 ampere."></canvas>
          <canvas class="vlab-dial" data-k="vol" role="img" aria-label="An analogue voltmeter reading from 0 to 2 volts."></canvas>
        </div>
        <div class="vlab-panel">
          <h4>Digital micrometer: the diameter of the wire</h4>
          <p class="vlab-watch"><output data-k="mic">–</output> mm</p>
          <div class="vlab-buttons"><button type="button" class="button secondary" data-k="measure">Measure the diameter at a new point</button></div>
          <p class="vlab-small" data-k="mics"></p>
        </div>
      </div>
    </div>
    <div class="vlab-panel" data-k="table"></div>`;

  const $ = k => root.querySelector(`[data-k="${k}"]`);
  const main = root.querySelector('.vlab-main'), zoom = root.querySelector('.vlab-zoom');
  const amm = $('amm'), vol = $('vol'), sw = $('switch');
  $('len').addEventListener('input', (e) => { L = +e.target.value; });
  sw.addEventListener('click', () => { closed = !closed; sw.textContent = closed ? 'Open the switch' : 'Close the switch'; });
  const mics = [];
  $('measure').addEventListener('click', () => {
    const d = (D + 0.004e-3 * gauss()) * 1000;   // the wire is not perfectly uniform
    const shown = (Math.round(d * 100) / 100).toFixed(2);
    $('mic').textContent = shown; mics.push(shown);
    $('mics').textContent = 'Readings so far: ' + mics.join(', ') + ' mm';
  });

  table($('table'), {
    store: 'vlab-resistivity', file: 'resistivity-readings.csv',
    note: 'Take your readings with the switch closed. They are kept in this browser until you clear them.',
    cols: [
      { html: 'Length <i>L</i> / m', csv: 'length L / m', aria: 'length in metres' },
      { html: 'pd <i>V</i> / V', csv: 'pd V / V', aria: 'potential difference in volts' },
      { html: 'Current <i>I</i> / A', csv: 'current I / A', aria: 'current in amperes' }],
  });

  // ----- Drawing -----
  const RULE = '#efdca8', RULE_INK = '#1c2430', WIRE = '#b87333';

  function drawMain() {
    const W = main.clientWidth, H = Math.round(W * 0.42), g = fit(main, W, H);
    g.fillStyle = col['--surface']; g.fillRect(0, 0, W, H);
    const x0 = W * 0.05, k = W * 0.9;            // the rule's zero, and pixels per metre
    const ry = H * 0.55, rh = Math.max(30, H * 0.22);
    g.fillStyle = RULE; g.fillRect(x0 - 8, ry, k + 16, rh);
    g.strokeStyle = RULE_INK; g.fillStyle = RULE_INK; g.lineWidth = 1;
    g.font = '10px system-ui, sans-serif'; g.textAlign = 'center';
    for (let cm = 0; cm <= 100; cm++) {
      if (k < 500 && cm % 2 && cm % 5) continue;   // every 2 cm on small screens
      const x = x0 + cm / 100 * k, len = cm % 10 === 0 ? rh * 0.4 : cm % 5 === 0 ? rh * 0.28 : rh * 0.15;
      g.beginPath(); g.moveTo(x, ry); g.lineTo(x, ry + len); g.stroke();
      if (cm % 10 === 0) g.fillText(cm, x, ry + rh - 3);
    }
    // the wire, lying on the rule
    g.strokeStyle = WIRE; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x0 - 6, ry + 2); g.lineTo(x0 + k + 6, ry + 2); g.stroke();
    // clips and leads
    const clip = (x, label) => {
      g.fillStyle = col['--muted']; g.beginPath();
      g.moveTo(x, ry + 1); g.lineTo(x - 7, ry - 16); g.lineTo(x + 7, ry - 16); g.closePath(); g.fill();
      g.strokeStyle = col['--text']; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x, ry - 16); g.lineTo(x, H * 0.12); g.stroke();
      g.fillStyle = col['--text']; g.textAlign = 'center'; g.font = '12px system-ui, sans-serif';
      g.fillText(label, x, H * 0.09);
    };
    clip(x0, 'fixed clip');
    clip(x0 + L * k, 'sliding clip');
    g.fillStyle = closed ? col['--good'] : col['--muted']; g.textAlign = 'left'; g.font = '12px system-ui, sans-serif';
    g.fillText(closed ? 'Switch closed: current flowing' : 'Switch open', x0, H - 6);
  }

  function drawZoom() {
    const W = zoom.clientWidth || 260, H = 120, g = fit(zoom, W, H), k = 6000;   // 6 pixels per millimetre
    g.fillStyle = col['--surface']; g.fillRect(0, 0, W, H);
    const x0 = L - (W / 2) / k, X = v => (v - x0) * k;
    const ry = 58;
    g.fillStyle = RULE; g.fillRect(0, ry, W, H - ry);
    g.strokeStyle = RULE_INK; g.fillStyle = RULE_INK; g.lineWidth = 1; g.font = '12px system-ui, sans-serif'; g.textAlign = 'center';
    for (let mm = Math.floor(x0 * 1000); mm <= Math.ceil((x0 + W / k) * 1000); mm++) {
      const x = X(mm / 1000) + 0.5, len = mm % 10 === 0 ? 22 : mm % 5 === 0 ? 14 : 8;
      g.beginPath(); g.moveTo(x, ry); g.lineTo(x, ry + len); g.stroke();
      if (mm % 10 === 0) g.fillText(mm / 10, x, ry + 38);
    }
    g.fillStyle = col['--muted']; g.font = '11px system-ui, sans-serif'; g.textAlign = 'right'; g.fillText('cm', W - 4, H - 6);
    // the wire and the clip's edge (a little wider than a point, as a real clip is)
    g.strokeStyle = WIRE; g.lineWidth = 4; g.beginPath(); g.moveTo(0, ry - 3); g.lineTo(W, ry - 3); g.stroke();
    const cx = X(L);
    g.fillStyle = col['--muted']; g.beginPath();
    g.moveTo(cx - 4, ry - 4); g.lineTo(cx + 4, ry - 4); g.lineTo(cx + 26, 4); g.lineTo(cx - 26, 4); g.closePath(); g.fill();
  }

  // An analogue meter: value shown on an arc, with minor, medium and major marks
  function drawDial(c, { value, max, minor, major, unit, symbol }) {
    const W = 260, H = 150, g = fit(c, W, H);
    g.fillStyle = col['--surface']; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fbfaf5'; g.strokeStyle = col['--border']; g.lineWidth = 1;
    g.beginPath(); g.roundRect(4, 4, W - 8, H - 8, 8); g.fill(); g.stroke();
    const cx = W / 2, cy = H - 18, r = 112, a0 = Math.PI * 1.17, a1 = Math.PI * 1.83;
    const ang = v => a0 + (a1 - a0) * v / max;
    g.strokeStyle = '#1c2430'; g.fillStyle = '#1c2430'; g.font = '11px system-ui, sans-serif'; g.textAlign = 'center';
    const n = Math.round(max / minor);
    for (let i = 0; i <= n; i++) {
      const v = i * minor, a = ang(v);
      const isMaj = Math.abs(v / major - Math.round(v / major)) < 1e-6;
      const isMid = !isMaj && Math.abs(v / (major / 2) - Math.round(v / (major / 2))) < 1e-6;
      const len = isMaj ? 14 : isMid ? 10 : 6;
      g.lineWidth = isMaj ? 1.4 : 1;
      g.beginPath(); g.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      g.lineTo(cx + (r - len) * Math.cos(a), cy + (r - len) * Math.sin(a)); g.stroke();
      if (isMaj) g.fillText(+v.toFixed(2), cx + (r - 26) * Math.cos(a), cy + (r - 26) * Math.sin(a) + 4);
    }
    g.textAlign = 'left';   // the meter's symbol and unit, in the corner away from the needle
    g.font = 'bold 18px system-ui, sans-serif'; g.fillText(symbol, 14, H - 30);
    g.font = '11px system-ui, sans-serif'; g.fillText(unit, 14, H - 14);
    const v = Math.max(0, Math.min(max * 1.02, value)), a = ang(v);
    g.strokeStyle = '#b3261e'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + (r - 2) * Math.cos(a), cy + (r - 2) * Math.sin(a)); g.stroke();
    g.fillStyle = '#1c2430'; g.beginPath(); g.arc(cx, cy, 5, 0, 2 * Math.PI); g.fill();
  }

  // ----- Animation -----
  function frame() {
    flick = 0.9 * flick + 0.1 * (closed ? 0.6 * gauss() : 0);   // a gentle wobble while current flows
    drawMain(); drawZoom();
    drawDial(amm, { value: current() + ZERO_ERR + flick * 0.02 * 0.15, max: 1, minor: 0.02, major: 0.2, unit: 'amperes', symbol: 'A' });
    drawDial(vol, { value: pd() + flick * 0.05 * 0.15, max: 2, minor: 0.05, major: 0.5, unit: 'volts', symbol: 'V' });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
