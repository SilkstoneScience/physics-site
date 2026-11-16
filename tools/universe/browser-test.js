// Browser tests for the Universe Engine. Not published (tools/ is excluded from the site).
// How to run: start `node tools/universe/dev-server.mjs`, open http://localhost:8137/universe/?test
// and, in the browser console:   (await import('/tools/universe/browser-test.js')).run()
// It drives the page with made-up keyboard, mouse, wheel and pinch events and checks what happens.
// Frames are advanced by hand (UE.advance), so it also works in a background tab.
export async function run() {
  const UE = window.UE, { app, actions: A, state } = UE, results = [];
  const ok = (cond, name, detail = '') => results.push(`${cond ? '✓' : '✗'} ${name}${cond ? '' : ' — ' + detail}`);
  const canvas = app.scene.canvas, frames = (n, dt = 1 / 60) => { for (let i = 0; i < n; i++) UE.advance(dt); };
  const key = (type, code, k) => window.dispatchEvent(new KeyboardEvent(type, { code, key: k || code, bubbles: true }));
  const tap = (code, k) => { key('keydown', code, k); key('keyup', code, k); };
  const ptr = (type, x, y) => canvas.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, button: 0, pointerId: 1, bubbles: true }));
  canvas.setPointerCapture = () => {};                    // made-up pointers cannot be captured
  const rig = () => app.rig, sim = () => app.sim;

  // --- selection and follow ---
  UE.pose('overview'); frames(2);
  const planet = sim().planetIds[2], v = app.scene.vis[planet];
  ptr('pointerdown', v.sx, v.sy); ptr('pointerup', v.sx, v.sy); frames(2);
  ok(state.selected === planet, 'clicking a planet selects it', `selected ${state.selected}, wanted ${planet}`);
  ok(!document.getElementById('info').hidden && document.getElementById('info-name').textContent === sim().bodies[planet].name, 'the information panel opens with its name');
  ok(rig().target === planet, 'with "click flies to body" on, the camera targets it');
  frames(240);
  const d = Math.hypot(...[0, 1, 2].map((c) => rig().pos[c] - sim().pos[3 * planet + c]));
  ok(Math.abs(d / rig().distT - 1) < 0.02, 'the camera arrives at its following distance', `${d} vs ${rig().distT}`);
  A.pause(false); A.setWarp(6); frames(60);
  const d2 = Math.hypot(...[0, 1, 2].map((c) => rig().pos[c] - sim().pos[3 * planet + c]));
  ok(Math.abs(d2 / rig().distT - 1) < 0.02, 'it keeps following while the planet moves');
  ptr('pointerdown', 5, 300); ptr('pointerup', 5, 300); frames(1);
  ok(state.selected === planet, 'clicking empty space leaves the selection alone');

  // --- mouse drag, wheel, pinch ---
  let yaw = rig().yawT, pitch = rig().pitchT;
  ptr('pointerdown', 600, 300); ptr('pointermove', 660, 330); ptr('pointermove', 700, 340); ptr('pointerup', 700, 340); frames(5);
  ok(rig().yawT !== yaw && rig().pitchT !== pitch, 'dragging turns the view');
  ok(state.selected === planet, 'a drag is not treated as a click');
  let dist = rig().distT;
  canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true })); frames(3);
  ok(rig().distT > dist, 'scrolling down zooms out');
  dist = rig().distT;
  canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -4, deltaMode: 1, bubbles: true, cancelable: true })); frames(3);
  ok(rig().distT < dist, 'scrolling up (line units, as some mice send) zooms in');
  dist = rig().distT;
  for (let i = 0; i < 5; i++) canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -8, ctrlKey: true, bubbles: true, cancelable: true }));
  frames(3);
  ok(rig().distT < dist * 0.8, 'a trackpad pinch (wheel + ctrl) zooms in', `${rig().distT / dist}`);
  dist = rig().distT;
  for (let i = 0; i < 40; i++) canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 3, bubbles: true, cancelable: true }));
  frames(3);
  ok(rig().distT > dist && rig().distT < dist * 1.5, 'small two-finger scroll steps zoom smoothly', `${rig().distT / dist}`);
  const ev = new WheelEvent('wheel', { deltaY: 10, bubbles: true, cancelable: true }); canvas.dispatchEvent(ev);
  ok(ev.defaultPrevented, 'the page itself does not scroll or zoom');
  for (let i = 0; i < 300; i++) canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -400, bubbles: true, cancelable: true }));
  ok(rig().distT >= sim().bodies[planet].radius * 1.2, 'zooming in stops outside the surface');

  // --- keyboard ---
  yaw = rig().yawT; key('keydown', 'ArrowLeft'); frames(10); key('keyup', 'ArrowLeft');
  ok(rig().yawT !== yaw, 'arrow keys turn the view');
  dist = rig().distT; key('keydown', 'Minus', '-'); frames(10); key('keyup', 'Minus', '-');
  ok(rig().distT > dist, 'the minus key zooms out');
  tap('Digit3', '3'); ok(rig().mode === 'top', '3 gives the top-down camera');
  tap('Digit2', '2'); ok(rig().mode === 'chase', '2 gives the chase camera');
  tap('Digit1', '1'); ok(rig().mode === 'follow', '1 gives the follow camera');
  frames(200);
  const p0 = Array.from(rig().pos);
  key('keydown', 'KeyW', 'w'); frames(30); key('keyup', 'KeyW', 'w');
  ok(rig().mode === 'free', 'pressing W switches to free flight');
  const moved = Math.hypot(...[0, 1, 2].map((c) => rig().pos[c] - p0[c]));
  ok(moved > 0, 'W moves the camera forwards', `${moved}`);
  frames(60);
  for (const k of ['KeyA', 'KeyD', 'KeyS', 'KeyQ', 'KeyE']) { const b = Array.from(rig().pos); key('keydown', k); frames(20); key('keyup', k); ok(Math.hypot(...[0, 1, 2].map((c) => rig().pos[c] - b[c])) > 0, `${k.slice(3)} moves the camera`); frames(40); }
  tap('KeyN', 'n'); frames(1);
  ok(state.selected === planet + 1 || sim().bodies[state.selected].id !== planet, 'N selects the next body');
  tap('KeyB', 'b'); frames(1);
  ok(state.selected === planet, 'B selects the previous body');
  tap('KeyF', 'f'); ok(rig().mode === 'follow' && rig().target === planet, 'F flies back to the selected body');
  tap('Digit0', '0'); ok(rig().target === 0, '0 shows the whole system');
  frames(200);

  // --- time ---
  A.pause(false); A.setWarp(5);
  let t = sim().t; frames(30); ok(Math.abs((sim().t - t) / (0.5 * 86400) - 1) < 1e-6, 'at 1 day per second, half a second of frames is half a day');
  tap('Space', ' '); t = sim().t; frames(30); ok(state.paused && sim().t === t, 'space pauses');
  tap('Period', '.'); frames(1); ok(sim().t > t, 'full stop steps forward while paused');
  const w = state.warp; tap('BracketRight', ']'); ok(state.warp === w + 1, '] runs time faster'); tap('BracketLeft', '['); tap('BracketLeft', '['); ok(state.warp === w - 1, '[ runs it slower');
  for (let i = 0; i < 20; i++) tap('BracketRight', ']');
  ok(document.getElementById('t-warp').textContent === '1 year / s', 'the fastest rate is 1 year per second');
  tap('Space', ' '); t = sim().t; frames(60); ok(Math.abs((sim().t - t) / 31557600 - 1) < 1e-6, 'one second at that rate is one year (Orbits mode stays exact)');
  A.setWarp(5);
  ok(/^Year \d+, day \d+, \d\d h$/.test((frames(20), app.ui.last = 0, app.ui.tick(performance.now() + 1e6, null), document.getElementById('t-date').textContent)), 'the simulated date is shown');

  // --- layers and keys for them ---
  for (const [code, layer] of [['KeyO', 'orbits'], ['KeyL', 'labels'], ['KeyV', 'vectors'], ['KeyK', 'areas'], ['KeyG', 'field'], ['KeyP', 'equi'], ['KeyM', 'well'], ['KeyT', 'graph'], ['KeyX', 'truescale']]) {
    const before = state.layers[layer]; tap(code); frames(2);
    ok(state.layers[layer] === !before, `${code.slice(3)} toggles ${layer}`); tap(code); frames(1);
  }
  tap('KeyX'); frames(120); ok(app.scene.vis[planet].enl === 1, 'true scale draws bodies at their real size'); tap('KeyX'); frames(60);

  // --- every control is reachable from the keyboard ---
  const controls = [...document.querySelectorAll('#app button, #app a, #app input')].filter((el) => !el.closest('[hidden]') && el.tabIndex < 0 && el.getAttribute('role') !== 'tab');
  ok(controls.length === 0, 'no visible control is left out of the tab order', controls.map((c) => c.id || c.textContent).join(', '));
  ok([...document.querySelectorAll('#body-list button')].length === sim().n, 'every body has a button in the Bodies list');
  document.querySelector('#body-list li:nth-child(2) button').click(); frames(2);
  ok(state.selected === 1, 'choosing a body from the list selects it');

  // --- sharing ---
  A.copyLink();
  const link = document.getElementById('link-out').textContent;
  ok(link.endsWith(`?seed=${encodeURIComponent(sim().sys.seed)}&v=1`), 'the link contains the seed and the generator version', link);

  // --- layout: nothing off the screen at this window size ---
  A.select(planet, true); A.layer('vectors', true); A.layer('graph', true); frames(2);
  const off = [...document.querySelectorAll('.hud')].filter((el) => !el.hidden && el.offsetParent !== null).filter((el) => { const r = el.getBoundingClientRect(); return r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1; });
  ok(off.length === 0, `no panel runs off a ${innerWidth}×${innerHeight} window`, off.map((el) => el.id || el.className).join(', '));
  const ri = document.getElementById('info').getBoundingClientRect(), rt = document.querySelector('.timebar').getBoundingClientRect();
  ok(ri.bottom <= rt.top || ri.right <= rt.left, 'the information panel does not cover the time controls');
  A.layer('vectors', false); A.layer('graph', false);

  // --- reduced motion (when the page was opened with ?reduced, or the system setting is on) ---
  if (app.rig.reduced) {
    A.fly(sim().planetIds[0]);
    ok(!rig().tr.active, 'reduced motion: camera moves are instant');
    const tm = app.scene.time; frames(30); ok(app.scene.time === tm, 'reduced motion: animated effects are frozen');
  }
  ok(state.quality === (new URLSearchParams(location.search).get('quality') || state.quality), `quality preset in use: ${state.quality}`);
  const c = app.scene.canvas;
  ok(Math.abs(c.width / (c.clientWidth * app.scene.pr) - 1) < 0.01, `the drawing size matches the preset (${c.width}×${c.height} for a ${c.clientWidth}×${c.clientHeight} window)`);
  const failed = results.filter((r) => r.startsWith('✗'));
  return { passed: results.length - failed.length, failed: failed.length, failures: failed, all: results };
}

// Phase 2: neighbouring stars, travel, and the real Solar System. Run after run():
//   (await import('/tools/universe/browser-test.js')).runPhase2()
export async function runPhase2() {
  const UE = window.UE, { app, actions: A, state } = UE, results = [];
  const ok = (cond, name, detail = '') => results.push(`${cond ? '✓' : '✗'} ${name}${cond ? '' : ' — ' + detail}`);
  const $ = (id) => document.getElementById(id), settle = () => new Promise((r) => setTimeout(r, 2500));
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  if (state.place.seed !== 'starfall' || state.place.star !== 0) { A.seed(null); await settle(); }
  const home = app.sim.sys.star.name, homeSeed = app.sim.sys.seed, nbrs = app.scene.neighbours;
  ok(nbrs.length >= 19 && document.querySelectorAll('#star-list button').length === nbrs.length, 'the Stars panel lists every neighbouring star', `${nbrs.length}`);
  const target = nbrs.slice().sort((a, b) => a.dist - b.dist)[0];
  A.selectStar(target.index, true); UE.advance(0.02);
  ok(!$('p-stars').hidden && $('star-detail').textContent.includes(target.name) && state.layers.stars, 'choosing a star opens its details and marks the stars in the sky');
  ok($('star-detail').textContent.includes((target.dist / 9.46e15).toPrecision(3)), 'its distance is shown in light years');
  // clicking its marker in the sky selects it too
  A.selectStar(-1); app.rig.setMode('free'); app.rig.fyaw = Math.atan2(target.dir[1], target.dir[0]); app.rig.fpitch = Math.asin(target.dir[2]); UE.advance(0.02); UE.advance(0.02);
  const k = nbrs.indexOf(target), cv = app.scene.canvas; cv.setPointerCapture = () => {};
  for (const type of ['pointerdown', 'pointerup']) cv.dispatchEvent(new PointerEvent(type, { clientX: nbrs[k].sx, clientY: nbrs[k].sy, button: 0, pointerId: 1, bubbles: true }));
  ok(state.starSel === target.index, 'clicking a star in the sky selects it', `${state.starSel}`);
  const outward = target.dir.slice();
  await A.travel(target.index); await settle();
  ok(app.sim.sys.star.name === target.name && state.place.star === target.index, 'travelling there builds that star\'s system', app.sim.sys.star.name);
  ok(new URLSearchParams(location.search).get('star') === String(target.index) && new URLSearchParams(location.search).get('seed') === 'starfall', 'the address records the seed and the star', location.search);
  const back = app.scene.neighbours.find((s) => s.index === 0);
  ok(back && back.name === home && dot(back.dir, outward) < -0.999999, 'from there, the home star is in exactly the opposite direction, at the same distance', back && `${dot(back.dir, outward)}`);
  ok(back && Math.abs(back.dist / target.dist - 1) < 1e-12, 'and the same distance away');
  ok($('intro').classList.contains('gone'), 'the travel screen has cleared');
  await A.travel(0); await settle();
  ok(app.sim.sys.seed === homeSeed && app.sim.sys.star.name === home && !new URLSearchParams(location.search).get('star'), 'travelling back gives the same home system');
  // the real Solar System
  A.seed('sol'); await settle();
  const sim = app.sim;
  ok(sim.sys.real && sim.bodies.map((b) => b.name).join().startsWith('Sun,Mercury,Venus,Earth,Moon,Mars,Jupiter'), 'the seed "sol" loads the real Solar System');
  ok($('sys-line').textContent.includes('Solar System') && new URLSearchParams(location.search).get('seed') === 'sol', 'it is named in the corner and in the address');
  A.pause(true); UE.advance(0.02); app.ui.last = 0; app.ui.tick(performance.now() + 1e6, null);
  ok(/^\d+ January 2000/.test($('t-date').textContent), 'its clock shows a real date', $('t-date').textContent);
  ok($('star-list').hidden && app.scene.neighbours.length === 0, 'it has no invented neighbours');
  const earth = sim.bodies.find((b) => b.name === 'Earth'); A.select(earth.id, true); UE.advance(0.02); app.ui.last = 0; app.ui.tick(performance.now() + 2e6, null);
  ok($('pane-data').textContent.includes('9.81 N kg') || $('pane-data').textContent.includes('9.8'), "Earth's surface field strength reads 9.8 N/kg", $('pane-data').textContent.slice(0, 200));
  A.seed(null); await settle();
  ok(app.sim.sys.seed === homeSeed, '"Starting system" returns to the invented universe');
  const failed = results.filter((r) => r.startsWith('✗'));
  return { passed: results.length - failed.length, failed: failed.length, failures: failed, all: results };
}
