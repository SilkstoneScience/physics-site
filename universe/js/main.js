// Universe Engine: start-up, the frame loop, and the glue between the simulation, the 3D scene and the panels.
import { generate, SHOWCASE_SEED, GEN_VERSION, makeRng } from './generator.js';
import { Sim } from './sim.js';
import * as P from './physics.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('reduced');   // ?reduced lets the tests switch it on
const TEST = params.has('test');           // ?test: no intro, no automatic quality change (used by the browser tests)

// ---------- Phones and narrow windows: show a message instead of starting the 3D scene ----------
const tooSmall = () => matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth < 900;
let started = false, running = false;
function gate() {
  const small = tooSmall();
  $('gate').hidden = !small; $('app').hidden = small;
  if (!small && !started) { started = true; boot().catch(fail); }
  if (started) setRunning(!small);
}
function fail(err) {
  console.error(err);
  $('intro').classList.remove('gone');
  $('intro-status').textContent = 'Sorry, the 3D view could not start on this computer or browser. ' + (err && err.message ? `(${err.message})` : '');
}
window.addEventListener('resize', gate);

// ---------- Settings (this browser only) ----------
const settings = { quality: '', clickFly: true };
try { Object.assign(settings, JSON.parse(localStorage.getItem('universe-settings') || '{}')); } catch (e) { /* private window: carry on without */ }
const saveSettings = () => { try { localStorage.setItem('universe-settings', JSON.stringify(settings)); } catch (e) { /* ignore */ } };

// ---------- State ----------
const state = {
  selected: -1, infoOpen: false, paused: false, stepped: false, warp: 5, quality: 'normal', qualityNote: '',
  layers: { orbits: true, labels: true, vectors: false, areas: false, field: false, equi: false, well: false, graph: false, truescale: false }, settings,
};
const app = { state, sim: null, scene: null, rig: null, viz: null, ui: null, actions: null };
let M = null;                               // the modules that need Three.js, loaded after the gate
let raf = 0, last = 0, pendingStep = 0, introDone = false, arrivalEnd = 0;
const perf = { n: 0, frame: new Float32Array(4096), cpu: new Float32Array(4096), gpu: new Float32Array(4096), gpuN: 0, calls: 0, tris: 0, fps: 60, acc: 0, cnt: 0, on: false };
const fpsInfo = { fps: 60, calls: 0, tris: 0 };

function seedFromUrl() {
  const s = params.get('seed');
  const v = Number(params.get('v') || GEN_VERSION);
  return { seed: s && s.trim() ? s.trim().slice(0, 40) : SHOWCASE_SEED, version: v === 1 ? 1 : GEN_VERSION, unknown: v !== 1 };
}
function linkFor(seed) { return `${location.origin}${location.pathname}?seed=${encodeURIComponent(seed)}&v=${GEN_VERSION}`; }

// ---------- Building a system ----------
function showcaseBody(sim) {
  // the most photogenic body: a ringed giant with moons if there is one
  const ps = sim.sys.planets;
  return (ps.find((p) => p.rings && p.type === 'gas' && p.moons.length) || ps.find((p) => p.rings) || ps.find((p) => p.type === 'gas') || ps.find((p) => p.type === 'ocean') || ps[Math.min(2, ps.length - 1)]).id;
}
function build(seed, quality) {
  if (app.scene) { app.scene.renderer.forceContextLoss(); app.scene.dispose(); }
  const stage = $('stage'); stage.textContent = '';
  const canvas = document.createElement('canvas');
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '3D view of the star system. Drag to look around, scroll to zoom. Every body is also in the Bodies list, and every control has a button; press ? for the keyboard shortcuts.');
  stage.appendChild(canvas);
  const sim = app.sim = new Sim(generate(seed));
  state.quality = quality;
  const scene = app.scene = new M.Scene(canvas, sim, quality, reduced);
  const rig = app.rig = new M.CameraRig(sim, reduced);
  rig.attach(canvas);
  rig.onClick = (x, y) => { const id = scene.pick(x, y); if (id >= 0) actions.select(id, true, settings.clickFly); };
  rig.onDouble = (x, y) => { const id = scene.pick(x, y); if (id >= 0) { actions.select(id, true); actions.fly(id); } };
  rig.onUser = () => app.ui.syncCamera();
  app.viz = new M.Viz(scene, sim);
  for (const k of ['vectors', 'field', 'equi', 'well', 'areas']) app.viz.on[k] = state.layers[k];
  scene.show.orbits = state.layers.orbits; scene.show.labels = state.layers.labels;
  scene.trueScale = scene.trueScaleTarget = state.layers.truescale ? 1 : 0;
  state.selected = -1; state.infoOpen = false;
  resize();
  if (app.ui) app.ui.rebuild();
  initGpuTimer();
  return scene;
}
function resize() {
  if (!app.scene) return;
  const c = app.scene.canvas, w = c.clientWidth || window.innerWidth, h = c.clientHeight || window.innerHeight;
  app.scene.resize(w, h);
}
window.addEventListener('resize', resize);

// ---------- Actions (everything a button or key can do) ----------
const actions = app.actions = {
  select(id, open = true, fly = false) {
    state.selected = id; state.infoOpen = id >= 0 && open;
    app.scene.selected = id;
    app.ui.select(id, state.infoOpen);
    if (id >= 0 && fly) actions.fly(id);
  },
  fly(id) { if (id < 0) return; app.rig.flyTo(id); app.ui.syncCamera(); },
  cycle(dir) {
    const n = app.sim.n; let id = state.selected < 0 ? app.rig.target : state.selected;
    for (let k = 0; k < n; k++) { id = (id + dir + n) % n; if (!app.sim.bodies[id].dead) break; }
    actions.select(id, true, settings.clickFly);
  },
  overview() {
    const sys = app.sim.sys, a = sys.planets[sys.planets.length - 1].el.a;
    app.rig.flyTo(0, { mode: 'follow', dist: a * 2.7, pitch: 0.62 }); app.ui.syncCamera();
  },
  camera(mode) { app.rig.setMode(mode); app.ui.syncCamera(); if (mode === 'free') app.ui.toast('Free flight: W A S D to move, Q and E for down and up, drag to look. Hold Shift to go faster.', 6000); },
  layer(name, on) {
    state.layers[name] = on;
    if (name === 'orbits' || name === 'labels') app.scene.show[name] = on;
    else if (name === 'truescale') app.scene.trueScaleTarget = on ? 1 : 0;
    else if (name in app.viz.on) app.viz.on[name] = on;
    if (on && (name === 'field' || name === 'equi' || name === 'well') && app.rig.mode !== 'free' && app.rig.dist < app.sim.sys.planets[0].el.a * 0.5) app.ui.toast('Zoom out (press 0) to see this across the whole system.');
    app.ui.syncLayers();
  },
  pause(v) { state.paused = v === undefined ? !state.paused : v; app.ui.syncTime(); },
  step() { if (!state.paused) actions.pause(true); pendingStep += M.WARPS[state.warp][0] * 0.1; state.stepped = true; },
  warp(d) { state.warp = Math.min(M.WARPS.length - 1, Math.max(0, state.warp + d)); app.ui.syncTime(); },
  setWarp(i) { state.warp = Math.min(M.WARPS.length - 1, Math.max(0, i)); app.ui.syncTime(); },
  mode(m) {
    const sim = app.sim;
    if (m === sim.mode) return;
    if (m === 'nbody') sim.toNbody(); else {
      if (sim.changed) app.ui.toast('Back to Orbits: each planet now keeps the ellipse it was on at this moment. Use "Put everything back" in the Change tab to restore the original system.', 7000);
      sim.toKepler();
    }
    app.rig.applyShift(sim.shift); app.ui.syncMode();
  },
  afterChange(msg) { app.rig.applyShift(app.sim.shift); app.ui.syncMode(); if (msg) app.ui.toast(msg, 6000); },
  setMass(id, mass) {
    const was = app.sim.mode;
    app.sim.setMass(id, mass);
    actions.afterChange(was === 'kepler' ? 'Switched to Full gravity: with a different mass the old ellipses no longer apply.' : '');
    app.ui.select(state.selected, state.infoOpen);
  },
  kick(id, kind, value) {
    const sim = app.sim, was = sim.mode, t = new Float64Array(6);
    sim.toNbody();
    const r = sim.relState(id, t), v = Math.hypot(t[3], t[4], t[5]), Mstar = sim.bodies[0].mass + sim.bodies[id].mass;
    if (kind === 'percent') sim.kick(id, v * value / 100, 0, 0);
    else {
      // new velocity: at right angles to the line to the star, with the circular (or escape) speed
      const target = kind === 'circular' ? Math.sqrt(P.G * Mstar / r) : Math.sqrt(2 * P.G * Mstar / r) * 1.0005;
      const vr = (t[0] * t[3] + t[1] * t[4] + t[2] * t[5]) / r;                 // radial part of the velocity
      const vt = Math.sqrt(Math.max(v * v - vr * vr, 0));
      if (kind === 'circular') {
        // remove the radial part, then scale the sideways part: done as two pushes in the orbital plane
        const j = sim.nbIndex(id), nb = sim.nb, q = 3 * j;
        for (let c = 0; c < 3; c++) {
          const rad = t[c] / r, tan = (t[3 + c] - vr * rad) / (vt || 1);
          nb.v[q + c] = nb.v[c] + tan * target;
        }
        sim.changed = true; sim.rebase();
      } else sim.kick(id, target - v, 0, 0);
    }
    actions.afterChange(was === 'kepler' ? 'Switched to Full gravity: after a push the old ellipse no longer applies.' : '');
  },
  reset() { app.sim.reset(); app.rig.applyShift(app.sim.shift); app.ui.syncMode(); app.ui.select(state.selected, state.infoOpen); app.ui.toast('Everything is back as it was generated, in Orbits mode.'); },
  launch(id, f) {
    const sim = app.sim, b = sim.bodies[id];
    sim.launch(id, f);
    // choose a time rate that shows the whole flight in roughly 15 seconds
    const tau = Math.sqrt(b.radius ** 3 / (P.G * b.mass));
    let flight = 220 * tau;                          // roughly the time to reach 60 radii when escaping
    if (f < 1) { const a = b.radius / (2 * (1 - f * f)), E0 = Math.acos(2 * f * f - 1); flight = 2 * Math.sqrt(a ** 3 / (P.G * b.mass)) * (Math.PI - E0 + Math.sin(E0)); }
    let best = 0; M.WARPS.forEach((w, i) => { if (Math.abs(Math.log(w[0] / (flight / 15))) < Math.abs(Math.log(M.WARPS[best][0] / (flight / 15)))) best = i; });
    actions.setWarp(best); actions.pause(false);
    const top = Math.min(P.maxRadius(b.radius, Math.min(f, 0.999)), 14 * b.radius);
    app.rig.flyTo(id, { mode: 'follow', dist: Math.max(5.5 * b.radius, 2.6 * top), pitch: 0.12 });
    app.ui.syncCamera();
  },
  quality(q) {
    if (q === state.quality) return;
    settings.quality = q; saveSettings();
    state.qualityNote = 'You chose this setting. It is remembered on this computer.';
    rebuildKeeping(app.sim.sys.seed, q);
  },
  setting(k, v) { settings[k] = v; saveSettings(); },
  seed(s) {
    const seed = s === null ? SHOWCASE_SEED : s;
    history.replaceState(null, '', seed === SHOWCASE_SEED ? location.pathname : `?seed=${encodeURIComponent(seed)}&v=${GEN_VERSION}`);
    rebuildKeeping(seed, state.quality, true);
  },
  newSystem() {
    // the next seed comes from the present one, so nothing depends on the clock or on Math.random
    const r = makeRng('next/' + app.sim.sys.seed), words = ['amber', 'basalt', 'cinder', 'drift', 'ember', 'fathom', 'glacier', 'harbour', 'indigo', 'juniper', 'kestrel', 'lantern', 'meridian', 'nimbus', 'onyx', 'pilot', 'quartz', 'russet', 'solstice', 'tundra', 'umber', 'vesper', 'willow', 'zenith'];
    actions.seed(`${r.pick(words)}-${r.pick(words)}-${r.int(10, 99)}`);
  },
  copyLink() {
    const url = linkFor(app.sim.sys.seed);
    $('link-out').textContent = url;
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => app.ui.toast('Link copied. Anyone who opens it gets this same system.'), () => app.ui.toast('The link is shown in the System panel: select and copy it.'));
  },
  skipIntro() { if (app.rig.tr.active) { app.rig.tr.t = 1; } endIntro(); },
};

async function rebuildKeeping(seed, quality, fresh) {
  const keep = fresh ? null : { t: app.sim.t, sel: state.selected, open: state.infoOpen, target: app.rig.target, yaw: app.rig.yawT, pitch: app.rig.pitchT, dist: app.rig.distT, mode: app.rig.mode };
  cancelAnimationFrame(raf); running = false;
  build(seed, quality);
  if (keep) { app.sim.t = keep.t; app.sim.computeKepler(); }
  await prepare();
  const rig = app.rig;
  if (keep) {
    rig.flyTo(keep.target, { instant: true, dist: keep.dist, yaw: keep.yaw, pitch: keep.pitch, mode: keep.mode === 'free' ? 'follow' : keep.mode });
    if (keep.sel >= 0) actions.select(keep.sel, keep.open);
  } else {
    const id = showcaseBody(app.sim);
    placeForArrival(id);
    rig.flyTo(id, { dur: 4.5, pitch: 0.2, yaw: sunYaw(id) - 0.95 });
    actions.select(id, false);
    app.ui.toast(`Arrived at the ${app.sim.sys.star.name} system.`);
  }
  app.ui.syncCamera();
  setRunning(true);
}

// ---------- Getting ready: shaders, sky ----------
async function prepare() {
  const scene = app.scene;
  const status = (t, f) => { $('intro-status').textContent = t; $('intro-fill').style.width = `${f * 100}%`; };
  status('Compiling shaders…', 0.25);
  app.rig.flyTo(showcaseBody(app.sim), { instant: true, pitch: 0.2 });
  app.rig.update(0); scene.update(app.rig.pos, app.rig.quat, 0); app.viz.update(app.rig.pos, app.rig.quat, -1);
  // make every optional layer visible once so that its shader is compiled now, not when it is first switched on
  const v = app.viz; v.field.visible = v.well.visible = v.areas.visible = true;
  try { await scene.renderer.compileAsync(scene.scene, scene.camera); } catch (e) { /* older browsers: compile on first use */ }
  v.field.visible = v.well.visible = v.areas.visible = false;
  status('Painting the sky…', 0.55);
  while (scene.bakeSkyStep()) await nextFrame();
  status('Lighting the star…', 0.85);
  scene.render(); await nextFrame();
  status('', 1);
}
// (the timer covers a tab that is in the background, where animation frames do not arrive)
const nextFrame = () => new Promise((r) => { let done = false; const go = () => { if (!done) { done = true; r(); } }; requestAnimationFrame(go); setTimeout(go, 80); });
const sunYaw = (id) => { const p = app.sim.pos; return Math.atan2(p[1] - p[3 * id + 1], p[0] - p[3 * id]); };
function placeForArrival(id) {
  // start far outside the system, above its plane
  const sys = app.sim.sys, a = sys.planets[sys.planets.length - 1].el.a, rig = app.rig, p = app.sim.pos;
  const yaw = sunYaw(id) + 2.9, d = a * 2.2;
  rig.pos[0] = p[3 * id] + Math.cos(yaw) * d * 0.8; rig.pos[1] = p[3 * id + 1] + Math.sin(yaw) * d * 0.8; rig.pos[2] = d * 0.6;
  rig.lookQuat(p[0] - rig.pos[0], p[1] - rig.pos[1], p[2] - rig.pos[2], rig.quat);
}

// A short timed test while the title is on screen: how long does a frame really take on this graphics chip?
function benchmark() {
  const scene = app.scene, gl = scene.renderer.getContext(), px = new Uint8Array(4);
  const id = showcaseBody(app.sim), b = app.sim.bodies[id];
  app.rig.flyTo(id, { instant: true, dist: b.radius * 4, pitch: 0.2, yaw: sunYaw(id) - 0.95 });
  app.rig.update(0);
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const t0 = performance.now();
    scene.update(app.rig.pos, app.rig.quat, 0.016); app.viz.update(app.rig.pos, app.rig.quat, -1); scene.render();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);       // waits for the graphics chip to finish
    if (i >= 2) total += performance.now() - t0;
  }
  return total / 5;
}
function guessQuality(name) {
  const n = String(name || '').toLowerCase();
  if (/nvidia|geforce|rtx|gtx|radeon rx|radeon pro|apple m\d (pro|max|ultra)|arc\(tm\) a\d|quadro/.test(n)) return 'high';
  if (/intel/.test(n) && !/iris|arc/.test(n)) return 'low';
  if (/swiftshader|llvmpipe|software|basic render/.test(n)) return 'low';
  return 'normal';
}

async function boot() {
  $('intro-status').textContent = 'Loading…';
  const [sc, cam, viz, ui] = await Promise.all([import('./scene.js'), import('./camera.js'), import('./viz.js'), import('./ui.js')]);
  M = { Scene: sc.Scene, PRESETS: sc.PRESETS, U: sc.U, CameraRig: cam.CameraRig, Viz: viz.Viz, UI: ui.UI, WARPS: ui.WARPS };
  const { seed, unknown } = seedFromUrl();
  app.ui = new M.UI(app);
  // first guess from the name of the graphics chip, then measure
  let quality = settings.quality || params.get('quality') || 'normal';
  build(seed, quality);
  const gpu = app.scene.gpuName;
  if (!settings.quality && !params.get('quality')) {
    const guess = guessQuality(gpu);
    if (guess !== quality) { quality = guess; build(seed, quality); }
  }
  await prepare();
  if (!settings.quality && !params.get('quality') && !TEST) {
    const ms = benchmark();
    let want = quality;
    if (ms > 24 && quality !== 'low') want = quality === 'high' ? 'normal' : 'low';
    else if (ms < 5 && quality === 'normal') want = 'high';
    state.qualityNote = `Chosen automatically: a test frame took ${ms.toFixed(1)} ms on “${gpu}”. You can change it here.`;
    if (want !== quality) { quality = want; build(seed, quality); await prepare(); }
  } else state.qualityNote = settings.quality ? 'You chose this setting. It is remembered on this computer.' : '';
  app.ui.rebuild();
  wireKeys();
  // the arrival
  const id = showcaseBody(app.sim), rig = app.rig;
  if (reduced || TEST) { rig.flyTo(id, { instant: true, pitch: 0.2, yaw: sunYaw(id) - 0.95 }); }
  else { placeForArrival(id); rig.flyTo(id, { dur: 9, pitch: 0.2, yaw: sunYaw(id) - 0.95 }); $('intro-skip').hidden = false; }
  actions.select(id, false);
  app.ui.syncCamera();
  arrivalEnd = performance.now() + (reduced || TEST ? 0 : 9000);
  $('intro').classList.add('gone');
  if (unknown) app.ui.toast('This link was made for a newer version of the generator, so the system may differ from the one that was shared.', 9000);
  setRunning(true);
  window.UE = debugApi();
}
function endIntro() {
  if (introDone) return;
  introDone = true; $('intro-skip').hidden = true; $('intro').hidden = true;
  if (!TEST) app.ui.toast(`Arrived at the ${app.sim.sys.star.name} system. Click any body, or press ? for help.`, 7000);
}

// ---------- The frame loop ----------
function setRunning(on) {
  if (on && !running && app.scene && !tooSmall()) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  else if (!on && running) { running = false; cancelAnimationFrame(raf); }
}
document.addEventListener('visibilitychange', () => { if (started) setRunning(!document.hidden); });

function step(dt, now) {
  const { sim, scene, rig, viz, ui } = app;
  let simDt = state.paused ? 0 : dt * M.WARPS[state.warp][0];
  if (pendingStep) { simDt += pendingStep; pendingStep = 0; }
  sim.update(simDt);
  if (sim.events.length) {
    for (const ev of sim.events) if (ev.type === 'collision') ui.toast(`${sim.bodies[ev.lose].name} collided with ${sim.bodies[ev.keep].name} and merged with it. Momentum was conserved; kinetic energy was not.`, 9000);
    sim.events.length = 0; ui.rebuild();
  }
  let near = 1e30;
  for (let i = 0; i < scene.vis.length; i++) { const v = scene.vis[i]; if (v.shown) { const d = v.dist - v.b.radius; if (d < near) near = d; } }
  rig.nearDist = Math.max(near, 5e4);
  rig.update(dt);
  scene.update(rig.pos, rig.quat, dt);
  viz.update(rig.pos, rig.quat, state.selected);
  scene.render();
  if (!introDone && now > arrivalEnd) endIntro();
}
function frame(now) {
  raf = requestAnimationFrame(frame);
  const ms = now - last; last = now;
  const dt = Math.min(0.1, ms / 1000);
  const c0 = performance.now();
  gpuBegin();
  step(dt, now);
  gpuEnd();
  const cpu = performance.now() - c0, info = app.scene.renderer.info.render;
  perf.acc += ms; perf.cnt++;
  if (perf.acc > 500) { fpsInfo.fps = 1000 * perf.cnt / perf.acc; fpsInfo.calls = info.calls; fpsInfo.tris = info.triangles; perf.acc = 0; perf.cnt = 0; }
  if (perf.on && perf.n < perf.frame.length) { perf.frame[perf.n] = ms; perf.cpu[perf.n] = cpu; perf.calls = info.calls; perf.tris = info.triangles; perf.n++; }
  app.ui.tick(now, fpsInfo);
  state.stepped = false;
}

// ---------- GPU timing (where the browser allows it) ----------
let gt = null;
function initGpuTimer() {
  const gl = app.scene.renderer.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  gt = ext ? { gl, ext, pending: [], active: null } : null;
}
function gpuBegin() {
  if (!gt || !perf.on || gt.pending.length > 4) return;
  gt.active = gt.gl.createQuery(); gt.gl.beginQuery(gt.ext.TIME_ELAPSED_EXT, gt.active);
}
function gpuEnd() {
  if (!gt) return;
  const { gl, ext } = gt;
  if (gt.active) { gl.endQuery(ext.TIME_ELAPSED_EXT); gt.pending.push(gt.active); gt.active = null; }
  while (gt.pending.length && gl.getQueryParameter(gt.pending[0], gl.QUERY_RESULT_AVAILABLE)) {
    const q = gt.pending.shift();
    if (!gl.getParameter(ext.GPU_DISJOINT_EXT) && perf.gpuN < perf.gpu.length) perf.gpu[perf.gpuN++] = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6;
    gl.deleteQuery(q);
  }
}

// ---------- Keyboard ----------
function wireKeys() {
  const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== 'checkbox' && e.target.type !== 'range';
  const layerKeys = { KeyO: 'orbits', KeyL: 'labels', KeyV: 'vectors', KeyK: 'areas', KeyG: 'field', KeyP: 'equi', KeyM: 'well', KeyT: 'graph', KeyX: 'truescale' };
  window.addEventListener('keydown', (e) => {
    if (typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if ($('help').open) { if (e.key === 'Escape' || e.key === '?') { app.ui.help(false); e.preventDefault(); } return; }
    const c = e.code, rig = app.rig;
    if (!introDone && (c === 'Space' || c === 'Enter' || c === 'Escape')) { actions.skipIntro(); if (c !== 'Space') return; }
    if (/^(Key[WASDQE]|Arrow|Shift|Minus|Equal|Numpad(Add|Subtract))/.test(c)) {
      const onControl = /^(BUTTON|A|SUMMARY|INPUT)$/.test(e.target.tagName);
      if (c.startsWith('Arrow') && onControl) return;          // arrows keep their normal job on a focused control
      rig.keys[c] = true; if (c.startsWith('Arrow')) e.preventDefault(); return;
    }
    if (e.repeat) return;
    if (c === 'Space') { if (e.target.tagName === 'BUTTON') return; actions.pause(); e.preventDefault(); }
    else if (c === 'Period') actions.step();
    else if (c === 'BracketLeft') actions.warp(-1);
    else if (c === 'BracketRight') actions.warp(1);
    else if (c === 'Digit0') actions.overview();
    else if (c === 'Digit1') actions.camera('follow');
    else if (c === 'Digit2') actions.camera('chase');
    else if (c === 'Digit3') actions.camera('top');
    else if (c === 'Digit4') actions.camera('free');
    else if (c === 'KeyF') actions.fly(state.selected >= 0 ? state.selected : rig.target);
    else if (c === 'KeyN') actions.cycle(1);
    else if (c === 'KeyB') actions.cycle(-1);
    else if (c === 'KeyR') { /* reserved */ }
    else if (c === 'KeyH' || e.key === '?') app.ui.help(true);
    else if (c === 'Escape') { app.ui.closePanels(); }
    else if (layerKeys[c]) actions.layer(layerKeys[c], !state.layers[layerKeys[c]]);
  });
  window.addEventListener('keyup', (e) => { app.rig.keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in app.rig.keys) app.rig.keys[k] = false; });
}

// ---------- Hooks for the tests and for making reference pictures (window.UE) ----------
function debugApi() {
  const api = {
    app, perf, actions, state,
    // fixed camera positions for the picture checks
    pose(name) {
      const { sim, rig, scene } = app, sys = sim.sys;
      actions.mode('kepler'); sim.t = 0; sim.computeKepler(); actions.pause(true);
      for (const k of ['vectors', 'field', 'equi', 'well', 'areas', 'graph', 'truescale']) if (state.layers[k]) actions.layer(k, false);
      scene.trueScale = 0; introDone || endIntro();
      const giant = sim.bodies[showcaseBody(sim)], ocean = sys.planets.find((p) => p.type === 'ocean') || sys.planets.find((p) => p.atmosphere) || sys.planets[0];
      actions.select(-1);
      if (name === 'arrival') { rig.flyTo(giant.id, { instant: true, pitch: 0.2, yaw: sunYaw(giant.id) - 0.95, mode: 'follow' }); actions.select(giant.id, false); }
      else if (name === 'star') rig.flyTo(0, { instant: true, dist: sys.star.radius * 4.6, pitch: 0.12, yaw: 0.4, mode: 'follow' });
      else if (name === 'giant') {
        // a ringed giant from above its ring plane, at a moment when its innermost moon is on the near side
        const ringed = sys.planets.filter((p) => p.rings && p.moons.length).sort((a, b) => b.moons[0].radius / b.radius - a.moons[0].radius / a.radius)[0] || giant;
        const m = ringed.moons[0], camYaw = sunYaw(ringed.id) + 0.85;
        if (m) {
          const giant = ringed;
          // choose a moment when the moon is on the sunlit side, a little to one side of the line to the star
          const T = P.orbitalPeriod(m.el.a, P.G * giant.mass), p = sim.pos, g3 = 3 * giant.id, m3 = 3 * m.id;
          let best = 0, bestErr = 9;
          for (let k = 0; k < 400; k++) {
            sim.t = k * T / 400; sim.computeKepler();
            let d = Math.atan2(p[m3 + 1] - p[g3 + 1], p[m3] - p[g3]) - camYaw - 0.2;
            d = Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
            if (d < bestErr) { bestErr = d; best = sim.t; }
          }
          sim.t = best; sim.computeKepler();
          rig.flyTo(giant.id, { instant: true, dist: giant.radius * 7.2, pitch: 0.36, yaw: camYaw, mode: 'follow' });
        }
        else rig.flyTo(giant.id, { instant: true, dist: giant.radius * 6, pitch: 0.3, yaw: sunYaw(giant.id) + 0.8, mode: 'follow' });
      } else if (name === 'terminator') rig.flyTo(ocean.id, { instant: true, dist: ocean.radius * 2.7, pitch: 0.1, yaw: sunYaw(ocean.id) + 1.8, mode: 'follow' });
      else if (name === 'belt') {
        const B = scene.belt; rig.setMode('free');
        rig.update(0); scene.update(rig.pos, rig.quat, 0);
        // stand next to a large rock that has the most company, on its sunward side, looking along the belt
        const st = B.near.st, n = B.n, X = new Float64Array(3 * n);
        for (let i = 0; i < n; i++) { const j = i * 10, el = B.el, a = el[j], e = el[j + 1], E = P.solveKepler(el[j + 2], e), px = a * (Math.cos(E) - e), py = a * Math.sqrt(1 - e * e) * Math.sin(E); for (let c = 0; c < 3; c++) X[3 * i + c] = px * el[j + 4 + c] + py * el[j + 7 + c]; }
        let bi = 0, bestScore = -1;
        for (let i = 0; i < n; i++) {
          if (st[4 * i] < 30000 * M.U) continue;
          let score = 0;
          for (let j = 0; j < n; j++) { if (j === i) continue; const d = Math.hypot(X[3 * j] - X[3 * i], X[3 * j + 1] - X[3 * i + 1], X[3 * j + 2] - X[3 * i + 2]); score += Math.min(0.05, st[4 * j] / M.U * 2500 / d); }
          if (score > bestScore) { bestScore = score; bi = i; }
        }
        const x = X[3 * bi], y = X[3 * bi + 1], z = X[3 * bi + 2], R = st[4 * bi] / M.U * 2500, d = Math.hypot(x, y);
        rig.pos[0] = x - x / d * R * 3.4 + y / d * R * 2.4; rig.pos[1] = y - y / d * R * 3.4 - x / d * R * 2.4; rig.pos[2] = z + R * 1.2;
        const f = [x - rig.pos[0], y - rig.pos[1], z - rig.pos[2]];
        rig.fyaw = Math.atan2(f[1], f[0]) + 0.3; rig.fpitch = Math.asin(f[2] / Math.hypot(...f)) + 0.03;
      } else if (name === 'overview') {
        const mid = sys.planets[Math.min(4, sys.planets.length - 1)];
        rig.flyTo(0, { instant: true, dist: mid.el.a * 2.9, pitch: 0.7, yaw: 0.9, mode: 'follow' });
        actions.layer('vectors', true); actions.select(mid.id, true);
      }
      app.ui.syncCamera();
      return name;
    },
    // draw one frame at an exact size and return it as a PNG data URL (or send it to the development server)
    async capture(w, h, name) {
      const { scene, rig, viz } = app;
      scene.resize(w, h, true);
      rig.update(0); scene.update(rig.pos, rig.quat, 0); viz.update(rig.pos, rig.quat, state.selected); scene.render();
      const blob = await new Promise((r) => scene.canvas.toBlob(r, 'image/png'));
      resize();
      if (!name) return blob.size;
      const res = await fetch(`/__save?name=${encodeURIComponent(name)}`, { method: 'POST', body: blob });
      return res.ok ? `${name} (${blob.size} bytes)` : 'save failed';
    },
    // advance exactly dt seconds of real time (for scripted, repeatable flights)
    advance(dt) { step(dt, performance.now()); },
    flightStep(i, dt = 1 / 30) {
      const { sim, rig } = app, sys = sim.sys, t = i * dt;
      const giant = sim.bodies[showcaseBody(sim)], ocean = sys.planets.find((p) => p.type === 'ocean') || sys.planets[1];
      const at = (s) => Math.abs(t - s) < dt / 2;
      if (i === 0) { api.pose('arrival'); actions.pause(false); actions.setWarp(5); actions.overview(); rig.tr.active = false; rig.update(0); }
      if (at(4)) rig.flyTo(ocean.id, {});
      if (at(10)) rig.flyTo(giant.id, { pitch: 0.25 });
      if (t > 15 && t < 21) rig.rotate(0.012 * dt * 30, 0.002 * dt * 30);
      if (at(21) && giant.moons[0]) rig.flyTo(giant.moons[0].id, {});
      if (at(25)) rig.flyTo(0, { dist: sys.star.radius * 9 });
      step(dt, performance.now());
    },
    perfStart() { perf.n = 0; perf.gpuN = 0; perf.on = true; },
    perfStop() {
      perf.on = false;
      const stats = (a, n) => { if (!n) return null; const s = Array.from(a.subarray(0, n)).sort((x, y) => x - y); return { mean: +(s.reduce((p, c) => p + c, 0) / n).toFixed(2), p50: +s[Math.floor(n * 0.5)].toFixed(2), p99: +s[Math.min(n - 1, Math.floor(n * 0.99))].toFixed(2), max: +s[n - 1].toFixed(2) }; };
      return { frames: perf.n, frame: stats(perf.frame, perf.n), cpu: stats(perf.cpu, perf.n), gpu: stats(perf.gpu, perf.gpuN), gpuSamples: perf.gpuN, calls: perf.calls, triangles: perf.tris, quality: state.quality, gpuName: app.scene.gpuName, size: [app.scene.cssW, app.scene.cssH, app.scene.pr] };
    },
  };
  return api;
}

gate();
