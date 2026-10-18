// Virtual practical: momentum in collisions and explosions (needs js/labs/common.js).
// Builds the lab inside <div class="vlab" data-lab="momentum">. Two carts on a dynamics track pass through two
// light gates, which record how long each cart's 5.00 cm flag blocks the beam. The student weighs the carts,
// levels the track, and works out every velocity from the gate times. Friction, a slightly tilted track and
// imperfect magnets make the results realistic.
(() => {
  const root = document.querySelector('.vlab[data-lab="momentum"]');
  if (!root || !window.Lab) return;
  const { col, fit, table, gauss } = Lab;

  // ----- The physics -----
  const G = 9.81, TRACK = 1.40, GATES = [0.45, 0.80];   // track length / m, gate positions / m
  const CART = 0.17, FLAG = 0.0500;                    // cart length / m, flag width / m
  const FRICTION = 0.012;                              // rolling resistance / m s^-2
  const BODY = { A: 0.512, B: 0.498 }, BARS = [0.249, 0.251];   // masses / kg (B is the plunger cart)
  const STORE = 'vlab-momentum';
  const TILT0 = (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 2) / 1000;   // right end higher by this / m, at the start
  let tilt = TILT0;
  let mode = 'bounce', bars = { A: 0, B: 0 }, push = 0.40;
  let carts = [], linked = false, running = false, log = [], t = 0, clunk = false;
  const mass = k => BODY[k] + BARS.slice(0, bars[k]).reduce((s, b) => s + b, 0);

  function setUp(single) {
    linked = false; running = false; log = []; t = 0; clunk = false;
    if (single) carts = [{ k: 'A', x: single > 0 ? 0.15 : TRACK - 0.15, v: 0, m: mass('A') }];
    else if (mode === 'explode') carts = [{ k: 'A', x: 0.625 - CART / 2, v: 0, m: mass('A') }, { k: 'B', x: 0.625 + CART / 2, v: 0, m: mass('B') }];
    else carts = [{ k: 'A', x: 0.15, v: 0, m: mass('A') }, { k: 'B', x: 0.71, v: 0, m: mass('B') }];
    carts.forEach(c => { c.blocked = [null, null]; c.stopped = false; });
    showLog();
  }

  function go(dir) {
    const v = push * (1 + 0.06 * gauss());          // a push by hand is never exactly the same
    if (mode === 'explode' && carts.length === 2) {
      const E = 0.090 * (1 + 0.04 * gauss()), [a, b] = carts;   // energy stored in the plunger spring / J
      a.v = -Math.sqrt(2 * E * b.m / (a.m * (a.m + b.m)));
      b.v = -a.m * a.v / b.m;
    } else carts[0].v = (dir || 1) * Math.abs(v);
    running = true;
  }

  function collide(a, b) {   // a is on the left, b on the right
    const rel = a.v - b.v;
    let e;
    if (mode === 'stick') { e = 0; linked = true; }
    else {
      e = 0.90 + 0.06 * Math.random();             // the magnets lose a little energy
      if (rel > 0.60) { e = 0.70; clunk = true; }   // too fast: the carts touch with a jolt
    }
    const p = a.m * a.v + b.m * b.v, M = a.m + b.m;
    a.v = (p - b.m * e * rel) / M;
    b.v = (p + a.m * e * rel) / M;
  }

  function step(dt) {
    carts.forEach(c => { c.px = c.x; });
    const aTilt = -G * tilt / TRACK;
    const groups = linked ? [carts] : carts.map(c => [c]);
    for (const grp of groups) {
      if (grp[0].stopped) continue;
      let v = grp[0].v;
      const fr = v > 0 ? -FRICTION : v < 0 ? FRICTION : 0;
      v += (aTilt + fr) * dt;
      if (Math.abs(v) < 0.004 && Math.abs(aTilt) < FRICTION) { v = 0; grp.forEach(c => { c.stopped = true; }); }
      grp.forEach(c => { c.v = v; c.x += v * dt; });
    }
    // collisions between the carts (the magnets repel about 1 cm apart)
    if (carts.length === 2 && !linked) {
      const [a, b] = carts[0].x < carts[1].x ? carts : [carts[1], carts[0]];
      const gap = (b.x - a.x) - CART - (mode === 'bounce' ? 0.01 : 0);
      if (gap <= 0 && a.v > b.v && mode !== 'explode') { collide(a, b); a.stopped = b.stopped = false; }
    }
    // the ends of the track: the student catches the cart
    carts.forEach(c => {
      if (c.x < CART / 2 || c.x > TRACK - CART / 2) {
        c.x = Math.min(TRACK - CART / 2, Math.max(CART / 2, c.x));
        (linked ? carts : [c]).forEach(d => { d.v = 0; d.stopped = true; });
      }
    });
    // the light gates
    carts.forEach(c => GATES.forEach((g, i) => {
      const inBeam = Math.abs(c.x - g) < FLAG / 2;
      // when, within this step, did the flag's edge cross the beam? (so the times aren't rounded to the step)
      const d0 = Math.abs(c.px - g) - FLAG / 2, d1 = Math.abs(c.x - g) - FLAG / 2;
      const when = t + dt * (d0 === d1 ? 1 : Math.min(1, Math.max(0, d0 / (d0 - d1))));
      if (inBeam && c.blocked[i] === null) c.blocked[i] = when;
      else if (!inBeam && c.blocked[i] !== null) {
        log.push({ gate: i + 1, cart: c.k, ms: (when - c.blocked[i]) * 1000, dir: c.v >= 0 ? '→' : '←', at: t });
        c.blocked[i] = null; showLog();
      }
    }));
    t += dt;
    if (carts.every(c => c.stopped || c.v === 0)) running = false;
  }

  // ----- The page elements -----
  root.innerHTML = `
    <canvas class="vlab-main" role="img" aria-label="A dynamics track with two carts, A and B, each carrying a flag, and two light gates in the middle of the track."></canvas>
    <div class="vlab-grid vlab-grid-2">
      <div class="vlab-panel">
        <h4>Set up</h4>
        <label class="vlab-field">Carts' ends facing each other
          <select data-k="mode">
            <option value="bounce">Magnets: the carts bounce apart</option>
            <option value="stick">Velcro: the carts stick together</option>
            <option value="explode">Plunger: the carts start at rest and push apart</option>
          </select></label>
        <label class="vlab-field">Extra masses on cart A <select data-k="barsA"><option value="0">none</option><option value="1">one bar</option><option value="2">two bars</option></select></label>
        <label class="vlab-field">Extra masses on cart B <select data-k="barsB"><option value="0">none</option><option value="1">one bar</option><option value="2">two bars</option></select></label>
        <label class="vlab-field" data-k="pushfield">How hard to push cart A <input type="range" data-k="push" min="0.15" max="0.75" step="0.01" value="${push}"></label>
        <div class="vlab-buttons">
          <button type="button" class="button secondary" data-k="setup">Put the carts in place</button>
          <button type="button" class="button" data-k="go">Push cart A</button>
        </div>
        <p class="vlab-small" data-k="note"></p>
      </div>
      <div class="vlab-panel">
        <h4>Light gate readings</h4>
        <p class="vlab-small">Each reading is the time that a cart's 5.00 cm flag blocked the beam. The arrow shows which way the cart was moving.</p>
        <ol class="vlab-log" data-k="log"></ol>
      </div>
      <div class="vlab-panel">
        <h4>Balance</h4>
        <p class="vlab-watch"><output data-k="bal">–</output> kg</p>
        <div class="vlab-buttons">
          <button type="button" class="button secondary" data-k="weighA">Weigh cart A</button>
          <button type="button" class="button secondary" data-k="weighB">Weigh cart B</button>
        </div>
        <p class="vlab-small">Each cart is weighed with its flag and any extra masses on it.</p>
      </div>
      <div class="vlab-panel">
        <h4>Levelling the track</h4>
        <p class="vlab-small">Test with cart A alone. Push it each way and compare its two gate times. Then turn the levelling screw under the right-hand end of the track.</p>
        <div class="vlab-buttons">
          <button type="button" class="button secondary" data-k="testR">Push cart A alone →</button>
          <button type="button" class="button secondary" data-k="testL">Push cart A alone ←</button>
        </div>
        <div class="vlab-buttons">
          <button type="button" class="button secondary" data-k="up">Raise the right end</button>
          <button type="button" class="button secondary" data-k="down">Lower the right end</button>
          <button type="button" class="button secondary" data-k="unscrew">Reset the levelling</button>
        </div>
        <p class="vlab-small" data-k="screw">Levelling screw: not turned yet.</p>
      </div>
    </div>
    <div class="vlab-panel" data-k="table"></div>`;

  const $ = k => root.querySelector(`[data-k="${k}"]`);
  const main = root.querySelector('.vlab-main'), logOut = $('log'), note = $('note');
  let turns = 0;

  function showLog() {
    logOut.innerHTML = log.length
      ? log.map(r => `<li>Gate ${r.gate}, cart ${r.cart} ${r.dir} &nbsp;<strong>${r.ms.toFixed(1)} ms</strong></li>`).join('')
      : '<li class="vlab-small" style="list-style: none">No readings yet.</li>';
  }
  function refreshControls() {
    const ex = mode === 'explode';
    $('pushfield').hidden = ex;
    $('go').textContent = ex ? 'Release the plunger' : 'Push cart A';
  }
  $('mode').addEventListener('change', (e) => { mode = e.target.value; refreshControls(); setUp(); note.textContent = ''; });
  $('barsA').addEventListener('change', (e) => { bars.A = +e.target.value; setUp(); });
  $('barsB').addEventListener('change', (e) => { bars.B = +e.target.value; setUp(); });
  $('push').addEventListener('input', (e) => { push = +e.target.value; });
  $('setup').addEventListener('click', () => { setUp(); note.textContent = ''; });
  $('go').addEventListener('click', () => {
    if (running) return;
    if (carts.length !== 2 || carts.some(c => c.v !== 0 || c.stopped)) setUp();
    note.textContent = ''; go(1);
  });
  $('testR').addEventListener('click', () => { if (!running) { setUp(1); go(1); } });
  $('testL').addEventListener('click', () => { if (!running) { setUp(-1); go(-1); } });
  const screw = d => {
    tilt += d * 0.0005; turns += d;
    $('screw').textContent = turns ? `Levelling screw: ${Math.abs(turns)} turn${Math.abs(turns) === 1 ? '' : 's'} ${turns > 0 ? 'up' : 'down'} from where it started.` : 'Levelling screw: back where it started.';
  };
  $('up').addEventListener('click', () => screw(1));
  $('down').addEventListener('click', () => screw(-1));
  $('unscrew').addEventListener('click', () => { tilt = TILT0; turns = 0; screw(0); });   // back to the starting slope
  $('weighA').addEventListener('click', () => { $('bal').textContent = mass('A').toFixed(3); });
  $('weighB').addEventListener('click', () => { $('bal').textContent = mass('B').toFixed(3); });

  table($('table'), {
    store: STORE, file: 'momentum-readings.csv',
    note: 'Work out each velocity from the gate times, with a sign for its direction (→ positive, ← negative). Your readings are kept in this browser until you clear them.',
    cols: [
      { html: 'Type', csv: 'type', aria: 'type of collision' },
      { html: '<i>m</i><sub>A</sub> / kg', csv: 'mA / kg', aria: 'mass of cart A in kilograms' },
      { html: '<i>m</i><sub>B</sub> / kg', csv: 'mB / kg', aria: 'mass of cart B in kilograms' },
      { html: '<i>u</i><sub>A</sub> / m s<sup>−1</sup>', csv: 'uA / m s^-1', aria: 'velocity of cart A before, in metres per second' },
      { html: '<i>u</i><sub>B</sub> / m s<sup>−1</sup>', csv: 'uB / m s^-1', aria: 'velocity of cart B before, in metres per second' },
      { html: '<i>v</i><sub>A</sub> / m s<sup>−1</sup>', csv: 'vA / m s^-1', aria: 'velocity of cart A after, in metres per second' },
      { html: '<i>v</i><sub>B</sub> / m s<sup>−1</sup>', csv: 'vB / m s^-1', aria: 'velocity of cart B after, in metres per second' }],
  });

  // ----- Drawing -----
  function draw() {
    const W = main.clientWidth, H = Math.round(Math.max(150, W * 0.3)), g = fit(main, W, H);
    g.fillStyle = col['--surface']; g.fillRect(0, 0, W, H);
    const k = (W - 20) / TRACK, X = x => 10 + x * k, ty = H * 0.72;
    // track (drawn level: the tilt is far too small to see)
    g.fillStyle = col['--muted']; g.fillRect(X(0), ty, TRACK * k, 6);
    g.fillRect(X(0), ty - 10, 4, 16); g.fillRect(X(TRACK) - 4, ty - 10, 4, 16);
    g.font = '11px system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = col['--muted'];
    g.fillText('levelling screw', X(TRACK) - 40, ty + 22);
    // light gates
    GATES.forEach((gx, i) => {
      const blocked = carts.some(c => c.blocked[i] !== null);
      g.strokeStyle = col['--text']; g.lineWidth = 3;
      g.beginPath(); g.moveTo(X(gx) - 10, ty - H * 0.55); g.lineTo(X(gx) - 10, ty); g.moveTo(X(gx) + 10, ty - H * 0.55); g.lineTo(X(gx) + 10, ty); g.stroke();
      g.strokeStyle = blocked ? col['--bad'] : col['--good']; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(X(gx) - 10, ty - H * 0.48); g.lineTo(X(gx) + 10, ty - H * 0.48); g.stroke();
      g.fillStyle = col['--text']; g.fillText(`gate ${i + 1}`, X(gx), ty - H * 0.6);
    });
    // carts
    carts.forEach(c => {
      const x0 = X(c.x - CART / 2), w = CART * k, h = Math.max(12, H * 0.12);
      g.fillStyle = c.k === 'A' ? col['--accent'] : '#c2561a';
      g.fillRect(x0, ty - h - 6, w, h);
      g.fillStyle = col['--text']; g.beginPath(); g.arc(x0 + w * 0.2, ty - 4, 4, 0, 7); g.arc(x0 + w * 0.8, ty - 4, 4, 0, 7); g.fill();
      g.fillStyle = col['--surface']; g.font = `bold ${Math.round(h * 0.7)}px system-ui, sans-serif`; g.fillText(c.k, X(c.x), ty - 6 - h * 0.2);
      // flag
      g.fillStyle = col['--text']; g.fillRect(X(c.x) - FLAG / 2 * k, ty - H * 0.52, FLAG * k, H * 0.52 - h - 6);
      // the ends that face each other
      if (carts.length === 2) {
        const face = c.k === 'A' ? x0 + w : x0;
        g.fillStyle = mode === 'bounce' ? '#888' : mode === 'stick' ? '#3d7a3d' : col['--text'];
        g.fillRect(face - 2, ty - h - 2, 4, h - 2);
      }
    });
    if (clunk) { g.fillStyle = col['--bad']; g.font = 'bold 13px system-ui, sans-serif'; g.textAlign = 'left'; g.fillText('Clunk! The carts hit each other: push more gently.', 10, 16); }
  }

  // ----- Animation -----
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (running) { const n = Math.ceil(dt / 0.0005); for (let i = 0; i < n; i++) step(dt / n); }
    draw();
    requestAnimationFrame(frame);
  }
  refreshControls(); setUp();
  requestAnimationFrame(frame);
})();
