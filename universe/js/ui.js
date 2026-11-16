// Universe Engine: the overlay panels (real HTML, so screen readers can read every value).
// Values refresh a few times a second, not every frame.
import * as P from './physics.js';
import { FIELD_STOPS, FIELD_RANGE, ARROW_PX, displayColour } from './viz.js';
import { LIGHT_YEAR, C_LIGHT, apparentBrightness, starDistance } from './sector.js';
import { dateText, AU_EXACT } from './solar.js';

const { G, AU, M_SUN, R_SUN, L_SUN, M_EARTH, R_EARTH, DAY, YEAR } = P;
const $ = (id) => document.getElementById(id);
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

// ---------- Number formatting ----------
// 3 significant figures; standard form outside 0.01 to 10000.
export function num(x, sf = 3) {
  if (!isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '–';
  if (x === 0) return '0';
  const neg = x < 0 ? '−' : ''; x = Math.abs(x);
  let ex = Math.floor(Math.log10(x)), m = x / Math.pow(10, ex);
  if (Number(m.toPrecision(sf)) >= 10) { m /= 10; ex++; }
  if (ex >= -2 && ex < 5) return neg + Number(x.toPrecision(sf)).toLocaleString('en-GB', { maximumSignificantDigits: sf, minimumSignificantDigits: Math.min(sf, 3), useGrouping: false });
  return `${neg}${m.toPrecision(sf)} × 10${String(ex).split('').map((c) => SUP[c]).join('')}`;
}
export function tex(x, sf = 3) {
  if (!isFinite(x)) return '\\infty';
  if (x === 0) return '0';
  const neg = x < 0 ? '-' : ''; x = Math.abs(x);
  let ex = Math.floor(Math.log10(x)), m = x / Math.pow(10, ex);
  if (Number(m.toPrecision(sf)) >= 10) { m /= 10; ex++; }
  if (ex >= -2 && ex < 5) return neg + Number(x.toPrecision(sf)).toLocaleString('en-GB', { maximumSignificantDigits: sf, minimumSignificantDigits: Math.min(sf, 3), useGrouping: false });
  return `${neg}${m.toPrecision(sf)} \\times 10^{${ex}}`;
}
export function duration(s) {
  if (s < 120) return `${num(s)} s`;
  if (s < 2 * 3600) return `${num(s / 60)} minutes`;
  if (s < 3 * DAY) return `${num(s / 3600)} hours`;
  if (s < 2 * YEAR) return `${num(s / DAY)} days`;
  return `${num(s / YEAR)} years`;
}
const dist = (m) => (m > 0.01 * AU_EXACT ? `${num(m / AU_EXACT)} AU` : `${num(m / 1000)} km`);   // 1 AU = 1.496e11 m (the booklet rounds it to 1.50e11)
const massAlt = (m) => (m > 0.05 * M_SUN ? `${num(m / M_SUN)} solar masses` : m > 0.001 * M_EARTH ? `${num(m / M_EARTH)} Earth masses` : `${num(m / 7.35e22)} Moon masses`);
const HL = ' <span class="tag hl">HL</span>';
const U = { kg: 'kg', m: 'm', ms: 'm s⁻¹', ms2: 'm s⁻²', Nkg: 'N kg⁻¹', N: 'N', J: 'J', Jkg: 'J kg⁻¹', s: 's', W: 'W', K: 'K' };
const TU = { kg: '\\text{ kg}', m: '\\text{ m}', ms: '\\text{ m s}^{-1}', ms2: '\\text{ m s}^{-2}', Nkg: '\\text{ N kg}^{-1}', N: '\\text{ N}', J: '\\text{ J}', Jkg: '\\text{ J kg}^{-1}', s: '\\text{ s}', W: '\\text{ W}', K: '\\text{ K}' };
const KIND = { star: 'Star', rocky: 'Rocky planet', desert: 'Desert planet', ocean: 'Ocean planet', ice: 'Ice world', gas: 'Gas giant', icegiant: 'Ice giant', moonrock: 'Rocky moon', moonice: 'Icy moon' };
export const WARPS = [[1, 'real time'], [60, '1 minute / s'], [600, '10 minutes / s'], [3600, '1 hour / s'], [6 * 3600, '6 hours / s'], [DAY, '1 day / s'], [7 * DAY, '1 week / s'], [30 * DAY, '30 days / s'], [YEAR / 4, '3 months / s'], [YEAR, '1 year / s']];

export class UI {
  constructor(app) {
    this.app = app; this.rows = []; this.last = 0; this.tab = 'data'; this.openWork = new Set(); this.mjQueue = []; this.mjBusy = false;
    this.c = { r: 0, v: 0 };           // values for the current body, refreshed in tick()
    this.t6 = new Float64Array(6);
    this.graphInner = false;
    this.wire();
  }

  // ---------- One-off wiring of buttons ----------
  wire() {
    const app = this.app, A = app.actions;
    const panels = [...document.querySelectorAll('.toolbar .tb[data-panel]')];
    const closePanels = (except) => panels.forEach((b) => { if (b !== except) { b.setAttribute('aria-expanded', 'false'); $(b.dataset.panel).hidden = true; } });
    this.closePanels = () => { closePanels(null); $('mode-pop').hidden = true; $('mode-info').setAttribute('aria-expanded', 'false'); };
    panels.forEach((b) => b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') !== 'true';
      closePanels(b); b.setAttribute('aria-expanded', String(open)); $(b.dataset.panel).hidden = !open;
    }));
    $('help-btn').addEventListener('click', () => this.help(true));
    $('help-close').addEventListener('click', () => this.help(false));
    document.querySelectorAll('[data-layer]').forEach((cb) => cb.addEventListener('change', () => A.layer(cb.dataset.layer, cb.checked)));
    document.querySelectorAll('[data-cam]').forEach((b) => b.addEventListener('click', () => A.camera(b.dataset.cam)));
    document.querySelectorAll('[data-quality]').forEach((b) => b.addEventListener('click', () => A.quality(b.dataset.quality)));
    document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => A.mode(b.dataset.mode)));
    $('cam-overview').addEventListener('click', () => A.overview());
    $('cam-zoom-in').addEventListener('click', () => app.rig.zoom(0.6));
    $('cam-zoom-out').addEventListener('click', () => app.rig.zoom(1 / 0.6));
    $('opt-clickfly').addEventListener('change', (e) => A.setting('clickFly', e.target.checked));
    $('seed-form').addEventListener('submit', (e) => { e.preventDefault(); const s = $('seed-input').value.trim(); if (s) A.seed(s); });
    $('new-system').addEventListener('click', () => A.newSystem());
    $('showcase').addEventListener('click', () => A.seed(null));
    $('go-sol').addEventListener('click', () => A.seed('sol'));
    $('copy-link').addEventListener('click', () => A.copyLink());
    $('scale-toggle').addEventListener('click', () => A.layer('truescale', !app.state.layers.truescale));
    $('t-pause').addEventListener('click', () => A.pause());
    $('t-step').addEventListener('click', () => A.step());
    $('t-slower').addEventListener('click', () => A.warp(-1));
    $('t-faster').addEventListener('click', () => A.warp(1));
    $('mode-info').addEventListener('click', () => { const open = $('mode-pop').hidden; $('mode-pop').hidden = !open; $('mode-info').setAttribute('aria-expanded', String(open)); if (open) this.typeset($('mode-pop')); });
    $('info-close').addEventListener('click', () => A.select(-1));
    $('info-fly').addEventListener('click', () => A.fly(app.state.selected));
    $('info-prev').addEventListener('click', () => A.cycle(-1));
    $('info-next').addEventListener('click', () => A.cycle(1));
    $('graph-close').addEventListener('click', () => A.layer('graph', false));
    $('intro-skip').addEventListener('click', () => A.skipIntro());
    const tabs = [...document.querySelectorAll('.tabs [role="tab"]')];
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => this.showTab(t.id.slice(4)));
      t.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); n.click(); e.preventDefault(); } });
    });
    $('graph-canvas').addEventListener('click', () => { this.graphInner = !this.graphInner; this.drawGraph(); });
  }
  help(open) {
    const d = $('help');
    if (open && !d.open) { d.showModal(); this.typeset(d); } else if (!open && d.open) d.close();
  }
  typeset(el) { if (window.MathJax && MathJax.typesetPromise) { MathJax.typesetPromise([el]).catch(() => {}); } else setTimeout(() => this.typeset(el), 400); }

  // ---------- When a new system (or quality) is built ----------
  rebuild() {
    const { sim, state } = this.app, sys = sim.sys;
    const place = state.place;
    $('sys-line').textContent = sys.real ? 'The Solar System · real data from NASA' : `${sys.star.name} system · seed “${place.seed}”${place.star ? ` · neighbour ${place.star}` : ''}`;
    this.buildStars();
    $('seed-input').value = state.place.seed;
    const ul = $('body-list'); ul.textContent = '';
    for (const b of sim.bodies) {
      const li = document.createElement('li'), bt = document.createElement('button');
      li.className = b.kind; bt.type = 'button'; bt.dataset.id = b.id;
      bt.innerHTML = `<span>${b.name}</span><span class="kind">${b.kind === 'star' ? 'Star' : b.label || KIND[b.type]}</span>`;
      bt.addEventListener('click', () => this.app.actions.select(b.id, true));
      li.appendChild(bt); ul.appendChild(li);
    }
    document.querySelectorAll('[data-quality]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.quality === state.quality)));
    $('quality-note').textContent = state.qualityNote || '';
    this.syncLayers(); this.syncMode(); this.syncCamera(); this.syncTime();
    this.select(state.selected, state.infoOpen);
  }
  // ---------- Neighbouring stars ----------
  buildStars() {
    const { state, sim } = this.app, sec = this.app.sector, ul = $('star-list');
    ul.textContent = ''; $('star-detail').textContent = '';
    $('stars-toggle').hidden = ul.hidden = !sec;
    if (!sec) { $('stars-intro').textContent = 'The real Solar System stands on its own here: its real neighbours are not included. Use “Starting system” or “New system” in the System panel to go back to the invented stars, where you can travel between systems.'; return; }
    const here = sec.stars.find((s) => s.index === state.place.star);
    $('stars-intro').textContent = `${sec.stars.length - 1} other systems lie within 12 light years of ${sec.stars[0].name}. Each is a full system that you can travel to. You are at ${here.name}.`;
    const others = sec.stars.filter((s) => s !== here).map((s) => ({ s, d: starDistance(s, here) })).sort((a, b) => a.d - b.d);
    for (const { s, d } of others) {
      const li = document.createElement('li'), bt = document.createElement('button');
      bt.type = 'button'; bt.dataset.star = s.index;
      const c = s.color.map((x) => Math.round(255 * Math.pow(x, 1 / 2.2)));
      bt.innerHTML = `<span><i class="dot" style="color:rgb(${c})"></i>${s.name}${s.index === 0 ? ' (home)' : ''}</span><span class="kind">${num(d / LIGHT_YEAR)} ly</span>`;
      bt.addEventListener('click', () => this.app.actions.selectStar(s.index));
      li.appendChild(bt); ul.appendChild(li);
    }
  }
  showStar(index) {
    const { state, sim } = this.app, sec = this.app.sector, box = $('star-detail');
    document.querySelectorAll('#star-list button').forEach((b) => { if (Number(b.dataset.star) === index) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    if (!sec || index < 0) { box.textContent = ''; return; }
    const here = sec.stars.find((s) => s.index === state.place.star), s = sec.stars.find((q) => q.index === index), d = starDistance(s, here);
    const b = apparentBrightness(s.luminosity, d), home = sim.bodies[0], p1 = sim.sys.planets[Math.min(2, sim.sys.planets.length - 1)], bHome = apparentBrightness(home.luminosity, p1.el.a);
    box.innerHTML = `<h3>${s.name}</h3>
      <div class="row"><span class="k">Distance from ${here.name}, <i>d</i></span><span class="v">${num(d / LIGHT_YEAR)} ly</span><span class="alt" style="grid-column:1/3">${num(d)} m · ${num(d / AU_EXACT)} AU</span></div>
      <div class="row"><span class="k">Time for its light to reach you</span><span class="v">${num(d / LIGHT_YEAR)} years</span></div>
      <div class="row"><span class="k">Mass</span><span class="v">${num(s.mass / M_SUN)} solar masses</span></div>
      <div class="row"><span class="k">Luminosity, <i>L</i></span><span class="v">${num(s.luminosity)} W</span><span class="alt" style="grid-column:1/3">${num(s.luminosity / L_SUN)} × the Sun · surface at ${num(s.temp)} K</span></div>
      <div class="row"><span class="k">Planets</span><span class="v">${s.planets}</span></div>
      <div class="row"><span class="k">Apparent brightness from here, <i>b</i></span><span class="v">${num(b)} W m⁻²</span>
        <div class="work"><p>Its light spreads over a sphere of area $4\\pi d^2$:</p>$$b = \\dfrac{L}{4\\pi d^2} = \\dfrac{${tex(s.luminosity)}}{4\\pi\\,(${tex(d)})^2}$$$$b = ${tex(b)}\\text{ W m}^{-2}$$<p>For comparison, ${home.name} gives ${num(bHome)} W m⁻² at ${p1.name}: ${num(bHome / b, 2)} times as much. That is why other stars are points of light.</p></div></div>
      <p class="btn-row"><button type="button" class="btn" id="star-go">Travel to ${s.name}</button></p>
      <p class="small">The trip is skipped: at the speed of light it would take ${num(d / LIGHT_YEAR)} years, and nothing with mass can travel that fast. Notes: <a href="../themes/b1.html#luminosity">B.1 apparent brightness</a> · <a href="../themes/e5.html#units">E.5 astronomical distances</a></p>`;
    $('star-go').addEventListener('click', () => this.app.actions.travel(index));
    this.typeset(box);
  }
  syncLayers() {
    const L = this.app.state.layers;
    document.querySelectorAll('[data-layer]').forEach((cb) => { cb.checked = !!L[cb.dataset.layer]; });
    $('scale-toggle').setAttribute('aria-pressed', String(!!L.truescale));
    $('graph').hidden = !L.graph;
    if (L.graph) this.drawGraph();
    this.legend();
  }
  syncMode() {
    const { sim } = this.app;
    document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === sim.mode)));
    $('drift').hidden = sim.mode !== 'nbody';
  }
  syncCamera() {
    const { rig, state } = this.app;
    document.querySelectorAll('[data-cam]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cam === rig.mode)));
    $('opt-clickfly').checked = state.settings.clickFly;
  }
  syncTime() {
    const { state } = this.app, p = $('t-pause');
    p.setAttribute('aria-pressed', String(state.paused)); p.textContent = state.paused ? '▶' : '❚❚'; p.setAttribute('aria-label', state.paused ? 'Resume' : 'Pause');
    $('t-warp').textContent = WARPS[state.warp][1];
    $('t-warp').title = '';
  }
  toast(msg, ms = 5000) {
    const t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => { t.hidden = true; }, ms);
  }

  // ---------- Legend for whatever is switched on ----------
  legend() {
    const { state, viz, sim } = this.app, L = state.layers, el = $('legend');
    let h = '';
    if (L.vectors) {
      h += `<h3>Arrows</h3>
        <div class="arrow" style="color:rgb(140,240,215)"><svg width="52" height="12" viewBox="0 0 52 12" aria-hidden="true"><path d="M1 6H42" stroke="currentColor" stroke-width="2.4"/><path d="M40 1L51 6L40 11Z" fill="currentColor"/></svg><span><b><i>v</i></b> velocity (solid). Longest: <span id="lg-v"></span></span></div>
        <div class="arrow" style="color:rgb(255,190,110)"><svg width="52" height="12" viewBox="0 0 52 12" aria-hidden="true"><path d="M1 6H42" stroke="currentColor" stroke-width="2.4" stroke-dasharray="5 4"/><path d="M40 1L51 6L40 11Z" fill="currentColor"/></svg><span><b><i>F</i></b> gravitational force from the body it orbits (dashed). Longest: <span id="lg-f"></span></span></div>
        <p>Lengths are proportional to size, measured on the screen. An arrow that would be shorter than 7 pixels is drawn 7 pixels long. The selected body's arrows carry the letters; arrows of planets crowded against the star are hidden until you zoom in.</p>`;
    }
    if (L.field) {
      const stops = FIELD_STOPS.map((c, i) => `${displayColour(c.map((x) => Math.pow(x, 2.2) * 0.8))} ${i * 25}%`).join(',');
      h += `<h3>Field strength <i>g</i> / N kg⁻¹</h3><div class="bar" style="background:linear-gradient(90deg,${stops})"></div>
        <div class="ticks"><span>10⁻⁶</span><span>10⁻⁴</span><span>10⁻²</span><span>1</span><span>10²</span></div>
        <p>The colour scale is logarithmic, and each white line marks a factor of 10. Because $g = \\dfrac{GM}{r^2}$, a line 10 times weaker is √10 ≈ 3.2 times further out.</p>`;
    }
    if (L.equi) h += `<h3>Equipotentials${HL}</h3><p>Every point on a ring has the same potential $V_g$. Neighbouring rings differ by $\\Delta V_g$ = <span id="lg-dv"></span>. They crowd together near the star, where the field is strong ($g = -\\dfrac{\\Delta V_g}{\\Delta r}$).</p>`;
    if (L.well) h += `<h3>Potential well${HL}</h3><p><strong>A model, not a real shape.</strong> Depth below the plane stands for gravitational potential, $V_g = -\\dfrac{GM}{r}$. Each ring is one equal step in $V_g$. Dashed lines show how deep in the star's well each planet sits. The planets' own wells are too narrow to show at this scale.</p>`;
    if (L.areas) h += `<h3>Swept areas</h3><p id="lg-area">Select a planet or moon.</p>`;
    el.innerHTML = h; el.hidden = !h;
    if (h) this.typeset(el);
  }

  // ---------- Selection and the information panel ----------
  select(id, open) {
    const { sim, state } = this.app;
    document.querySelectorAll('#body-list button').forEach((b) => { const on = Number(b.dataset.id) === id; if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    const info = $('info');
    $('app').classList.toggle('info-open', id >= 0 && !!open);
    if (id < 0 || !open) { info.hidden = true; return; }
    const b = sim.bodies[id];
    info.hidden = false;
    $('info-name').textContent = b.name;
    $('info-kind').textContent = b.kind === 'star' ? `Star · ${num(b.mass / M_SUN)} solar masses` : `${b.label || KIND[b.type]} · orbits ${sim.bodies[b.pid].name}`;
    this.openWork.clear();
    this.buildPanes(b);
    this.showTab(this.tab);
    this.last = 0;
  }
  showTab(name) {
    this.tab = name;
    for (const t of ['data', 'energy', 'change', 'launch']) { const on = t === name; $('tab-' + t).setAttribute('aria-selected', String(on)); $('tab-' + t).tabIndex = on ? 0 : -1; $('pane-' + t).hidden = !on; }
    this.last = 0;
  }

  // Each row: a label, a live value, an optional second line, and a button that shows the equation with numbers in.
  row(pane, key, label, unit, get, alt, work) {
    const d = document.createElement('div'); d.className = 'row';
    d.innerHTML = `<span class="k">${label}</span><span class="v"></span>${work ? `<button type="button" class="fx" aria-expanded="false" aria-label="Show the equation for ${label.replace(/<[^>]+>/g, '')}">ƒ</button>` : '<span></span>'}${alt ? '<span class="alt"></span>' : ''}${work ? '<div class="work" hidden></div>' : ''}`;
    pane.appendChild(d);
    const r = { key, unit, get, alt, work, v: d.querySelector('.v'), a: d.querySelector('.alt'), w: d.querySelector('.work'), bt: d.querySelector('.fx'), shown: '', shownAlt: '', stamp: 0 };
    if (r.bt) r.bt.addEventListener('click', () => {
      const open = r.w.hidden; r.w.hidden = !open; r.bt.setAttribute('aria-expanded', String(open));
      if (open) { this.openWork.add(r); this.renderWork(r); } else this.openWork.delete(r);
    });
    this.rows.push(r);
    return r;
  }
  renderWork(r) {
    const lines = r.work(this.c);
    r.w.innerHTML = lines.map((l) => (l.startsWith('$$') ? l : `<p>${l}</p>`)).join('');
    r.stamp = performance.now();
    if (window.MathJax && MathJax.typesetPromise) { if (MathJax.typesetClear) MathJax.typesetClear([r.w]); MathJax.typesetPromise([r.w]).catch(() => {}); }
  }
  head(pane, text) { const h = document.createElement('h3'); h.innerHTML = text; pane.appendChild(h); }
  para(pane, html, cls) { const p = document.createElement('p'); if (cls) p.className = cls; p.innerHTML = html; pane.appendChild(p); return p; }

  buildPanes(b) {
    const { sim } = this.app;
    this.rows = [];
    const pd = $('pane-data'), pe = $('pane-energy'), pc = $('pane-change'), pl = $('pane-launch');
    for (const p of [pd, pe, pc, pl]) p.textContent = '';
    const star = b.kind === 'star', par = star ? null : sim.bodies[b.pid], pn = par ? par.name : '';
    const c = this.c; c.b = b; c.par = par;
    this.compute();

    // ----- Orbit tab -----
    this.head(pd, star ? 'The star' : 'This body');
    this.row(pd, 'm', 'Mass', U.kg, () => b.mass, () => massAlt(b.mass));
    this.row(pd, 'R', 'Radius', U.m, () => b.radius, () => (star ? `${num(b.radius / R_SUN)} solar radii` : `${num(b.radius / 1000)} km · ${num(b.radius / R_EARTH)} Earth radii`));
    this.row(pd, 'gs', 'Field strength at its surface', U.Nkg, () => P.fieldStrength(b.mass, b.radius), null, () => [
      `At the surface, $r$ is the body's own radius and $M$ its own mass.`,
      `$$g = \\dfrac{GM}{r^2} = \\dfrac{(${tex(G)})(${tex(b.mass)})}{(${tex(b.radius)})^2}$$`, `$$g = ${tex(P.fieldStrength(b.mass, b.radius))}${TU.Nkg}$$`]);
    if (star) {
      this.row(pd, 'L', 'Luminosity', U.W, () => b.luminosity, () => `${num(b.luminosity / L_SUN)} × the Sun`);
      this.row(pd, 'T', 'Surface temperature', U.K, () => b.temp, null, () => [
        `From the star's luminosity and surface area, $A = 4\\pi r^2$:`,
        `$$L = \\sigma A T^4 \\;\\Rightarrow\\; T = \\left(\\dfrac{L}{\\sigma\\, 4\\pi r^2}\\right)^{1/4}$$`, `$$T = \\left(\\dfrac{${tex(b.luminosity)}}{(${tex(P.SIGMA)})\\,4\\pi\\,(${tex(b.radius)})^2}\\right)^{1/4} = ${tex(b.temp)}${TU.K}$$`,
        `The luminosity and radius come from the star's mass, using rough rules for ordinary stars ($L \\propto M^4$). The colour you see is the colour of a black body at this temperature.`]);
      this.para(pd, `Notes: <a href="../themes/d1.html#strength">D.1 field strength</a> · <a href="../themes/b1.html">B.1 luminosity</a>`, 'links');
    } else {
      this.head(pd, `Its orbit around ${pn}`);
      this.row(pd, 'r', `Distance from ${pn}, <i>r</i>`, U.m, () => c.r, () => dist(c.r));
      this.row(pd, 'a', 'Mean orbital radius (semi-major axis, <i>a</i>)', U.m, () => (c.e < 1 ? c.a : NaN), () => (c.e < 1 ? dist(c.a) : 'none: this is not a closed orbit'));
      this.row(pd, 'e', 'Eccentricity', '', () => c.e, () => (c.e < 0.02 ? 'almost a perfect circle' : c.e < 1 ? `an ellipse: ${num(c.rp / c.a * 100)} % to ${num(c.ra / c.a * 100)} % of the mean radius` : 'not a closed orbit: it is escaping'));
      this.row(pd, 'v', 'Speed, <i>v</i>', U.ms, () => c.v, () => `${num(c.v / 1000)} km s⁻¹`, () => {
        const vc = P.circularSpeed(par.mass, c.r);
        const L = [`For a <strong>circular</strong> orbit of this radius, gravity provides exactly the centripetal force:`,
          `$$v_\\text{orbital} = \\sqrt{\\dfrac{GM}{r}} = \\sqrt{\\dfrac{(${tex(G)})(${tex(par.mass)})}{${tex(c.r)}}}$$`, `$$v_\\text{orbital} = ${tex(vc)}${TU.ms}$$`];
        if (c.e < 0.01) L.push(`This orbit is almost circular (e = ${num(c.e, 2)}), so its actual speed, ${num(c.v)} m s⁻¹, agrees to within about 1 %.`);
        else if (c.e < 1) L.push(`This orbit is an ellipse (e = ${num(c.e, 2)}), so that equation does not apply to it: the actual speed, ${num(c.v)} m s⁻¹, is ${c.v > vc ? 'higher' : 'lower'}. It is fastest when closest to ${pn}. The exact speed comes from energy conservation <span class="tag beyond">beyond the IB course</span>:`,
          `$$v = \\sqrt{GM\\left(\\dfrac{2}{r} - \\dfrac{1}{a}\\right)} = ${tex(c.v)}${TU.ms}$$`);
        else L.push(`${b.name} is not on a closed orbit: it is moving faster than the escape speed at this distance.`);
        return L;
      });
      this.row(pd, 'T', 'Orbital period, <i>T</i>', U.s, () => (c.e < 1 ? c.T : NaN), () => (c.e < 1 ? duration(c.T) : 'no period: it will not return'), () => (c.e >= 1 ? [`${b.name} is on an escape path, not a closed orbit, so it has no period.`] : [
        `Kepler's third law, with $r$ the mean orbital radius (the semi-major axis $a$: half the sum of the closest and furthest distances):`,
        `$$T^2 = \\dfrac{4\\pi^2 r^3}{GM} = \\dfrac{4\\pi^2 (${tex(c.a)})^3}{(${tex(G)})(${tex(par.mass)})}$$`, `$$T = ${tex(c.T)}${TU.s}$$`,
        `It follows from setting the gravitational force equal to the centripetal force for a circular orbit. <span class="tag y2028">New for 2028</span> Deducing it yourself is required for exams from 2028.`,
        sim.mode === 'nbody' ? `In Full gravity the other planets keep nudging this orbit, so $r$ and $T$ here describe the orbit it is on at this instant.` : `${b.name}'s own mass is left out, as in the IB course (it is tiny compared with ${pn}'s).`]));
      this.head(pd, 'Circular motion and gravity');
      this.row(pd, 'ac', `Acceleration towards ${pn}`, U.ms2, () => c.g, null, () => {
        const L = [b.kind === 'moon' ? `Counting only ${pn}'s gravity (this model leaves out the star's pull on a moon), the acceleration relative to ${pn} is $\\dfrac{F}{m}$, towards ${pn}:` : `The only force is gravity, so the acceleration is $\\dfrac{F}{m}$, towards ${pn}:`, `$$a = \\dfrac{GM}{r^2} = \\dfrac{(${tex(G)})(${tex(par.mass)})}{(${tex(c.r)})^2} = ${tex(c.g)}${TU.ms2}$$`,
          `For circular motion the centripetal acceleration is $a = \\dfrac{v^2}{r}$:`, `$$\\dfrac{v^2}{r} = \\dfrac{(${tex(c.v)})^2}{${tex(c.r)}} = ${tex(c.v * c.v / c.r)}${TU.ms2}$$`];
        L.push(c.e >= 1 ? `They differ because ${b.name} is on an escape path, not a circle. $a = \\dfrac{v^2}{r}$ applies only to circular orbits.` : c.e < 0.01 ? `The two agree to within about 1 %: this orbit is almost a circle.` : `They differ because this orbit is an ellipse (e = ${num(c.e, 2)}): the path is not a circle centred on ${pn}, and part of the acceleration changes the speed. $a = \\dfrac{v^2}{r}$ applies only to circular orbits.`);
        return L;
      });
      this.row(pd, 'F', `Gravitational force from ${pn}`, U.N, () => c.F, null, () => [
        `$$F = G\\dfrac{m_1 m_2}{r^2} = (${tex(G)})\\dfrac{(${tex(par.mass)})(${tex(b.mass)})}{(${tex(c.r)})^2}$$`, `$$F = ${tex(c.F)}${TU.N}$$`,
        `${pn} feels a force of exactly the same size, in the opposite direction (Newton's third law).`]);
      this.row(pd, 'g', `${pn}'s field strength here`, U.Nkg, () => c.g, null, () => [
        `$$g = \\dfrac{F}{m} = \\dfrac{GM}{r^2} = \\dfrac{(${tex(G)})(${tex(par.mass)})}{(${tex(c.r)})^2}$$`, `$$g = ${tex(c.g)}${TU.Nkg}$$`, `The same number as the acceleration above: a field strength of 1 N kg⁻¹ gives an acceleration of 1 m s⁻².`]);
      this.row(pd, 'dA', 'Area swept out per second', 'm² s⁻¹', () => c.dA, null, () => [
        `Kepler's second law: the line from ${pn} to ${b.name} sweeps out equal areas in equal times.`, `$$\\dfrac{\\Delta A}{\\Delta t} = \\tfrac{1}{2}\\, r\\, v_\\perp = ${tex(c.dA)}\\text{ m}^2\\,\\text{s}^{-1}$$`,
        `Here $v_\\perp$ is the part of the velocity at right angles to the line. Watch the value: it stays the same all the way round, even though $r$ and $v$ both change. Switch on "Swept areas" to see it.`]);
      this.para(pd, `Notes: <a href="../themes/d1.html#newton">D.1 Newton's law</a> · <a href="../themes/d1.html#strength">field strength</a> · <a href="../themes/d1.html#orbits">orbits</a> · <a href="../themes/d1.html#kepler">Kepler's laws</a> · <a href="../themes/a2.html#circular">A.2 circular motion</a>`, 'links');
    }

    // ----- Energy tab -----
    if (star) {
      this.row(pe, 'ves', `Escape speed from its surface${HL}`, U.ms, () => P.escapeSpeed(b.mass, b.radius), () => `${num(P.escapeSpeed(b.mass, b.radius) / 1000)} km s⁻¹`, () => [
        `$$v_\\text{esc} = \\sqrt{\\dfrac{2GM}{r}} = \\sqrt{\\dfrac{2(${tex(G)})(${tex(b.mass)})}{${tex(b.radius)}}}$$`, `$$v_\\text{esc} = ${tex(P.escapeSpeed(b.mass, b.radius))}${TU.ms}$$`]);
      this.para(pe, `Select a planet or moon to see its kinetic, potential and total energy.`, 'note');
    } else {
      this.row(pe, 'Ek', 'Kinetic energy, <i>E</i><sub>k</sub>', U.J, () => c.Ek, null, () => [`$$E_\\text{k} = \\tfrac{1}{2}mv^2 = \\tfrac{1}{2}(${tex(b.mass)})(${tex(c.v)})^2$$`, `$$E_\\text{k} = ${tex(c.Ek)}${TU.J}$$`]);
      this.row(pe, 'Ep', `Gravitational potential energy, <i>E</i><sub>p</sub>${HL}`, U.J, () => c.Ep, null, () => [
        `$$E_\\text{p} = -G\\dfrac{m_1 m_2}{r} = -(${tex(G)})\\dfrac{(${tex(par.mass)})(${tex(b.mass)})}{${tex(c.r)}}$$`, `$$E_\\text{p} = ${tex(c.Ep)}${TU.J}$$`,
        `It is negative because zero is defined as infinitely far apart, and work would have to be done to pull the two bodies apart.`]);
      this.row(pe, 'Et', `Total energy${HL}`, U.J, () => c.Ek + c.Ep, () => (c.Ek + c.Ep < 0 ? `negative: bound to ${pn}` : `positive: escaping from ${pn}`), () => {
        const L = [`$$E_\\text{total} = E_\\text{k} + E_\\text{p} = ${tex(c.Ek)} + (${tex(c.Ep)})$$`, `$$E_\\text{total} = ${tex(c.Ek + c.Ep)}${TU.J}$$`];
        L.push(c.e >= 1 ? `The total is positive: ${b.name} has more than enough kinetic energy to climb out of ${pn}'s potential well, so it escapes.` : c.e < 0.01 ? `For a circular orbit, $E_\\text{k} = \\dfrac{GMm}{2r}$, so the total is $-\\dfrac{GMm}{2r}$: equal to $-E_\\text{k}$ and to half of $E_\\text{p}$. Check the three values.`
          : `On this ellipse $E_\\text{k}$ and $E_\\text{p}$ both change all the time, but their total stays constant${sim.mode === 'nbody' ? ' (apart from small exchanges with the other planets)' : ''}. Watch the bars.`);
        return L;
      });
      const cv = document.createElement('canvas'); cv.className = 'chart'; cv.width = 680; cv.height = 300; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Bar chart of kinetic, potential and total energy. The values are in the rows above.');
      pe.appendChild(cv); this.energyCanvas = cv;
      this.head(pe, 'Potential and escape');
      this.row(pe, 'V', `${pn}'s potential here, <i>V</i><sub>g</sub>${HL}`, U.Jkg, () => -G * par.mass / c.r, null, () => [`$$V_\\text{g} = -\\dfrac{GM}{r} = -\\dfrac{(${tex(G)})(${tex(par.mass)})}{${tex(c.r)}}$$`, `$$V_\\text{g} = ${tex(-G * par.mass / c.r)}${TU.Jkg}$$`, `The potential energy of each kilogram placed here.`]);
      this.row(pe, 'vep', `Escape speed from ${pn}, from here${HL}`, U.ms, () => c.vesc, () => `${b.name} has ${num(c.v / c.vesc * 100)} % of it`, () => [
        `$$v_\\text{esc} = \\sqrt{\\dfrac{2GM}{r}} = \\sqrt{\\dfrac{2(${tex(G)})(${tex(par.mass)})}{${tex(c.r)}}}$$`, `$$v_\\text{esc} = ${tex(c.vesc)}${TU.ms}$$`,
        `This is √2 ≈ 1.41 times the circular orbital speed at the same distance. At this speed the total energy would be exactly zero.`]);
      this.row(pe, 'ves', `Escape speed from its own surface${HL}`, U.ms, () => P.escapeSpeed(b.mass, b.radius), () => `${num(P.escapeSpeed(b.mass, b.radius) / 1000)} km s⁻¹`, () => [
        `$$v_\\text{esc} = \\sqrt{\\dfrac{2GM}{r}} = \\sqrt{\\dfrac{2(${tex(G)})(${tex(b.mass)})}{${tex(b.radius)}}}$$`, `$$v_\\text{esc} = ${tex(P.escapeSpeed(b.mass, b.radius))}${TU.ms}$$`, `Here $M$ and $r$ are ${b.name}'s own mass and radius. Try it in the Launch tab.`]);
      this.para(pe, `Notes: <a href="../themes/a3.html#kinetic">A.3 kinetic energy</a> · <a href="../themes/d1.html#gpe">D.1 potential energy</a> · <a href="../themes/d1.html#potential">potential</a> · <a href="../themes/d1.html#escape">escape speed</a> · <a href="../themes/d1.html#energy">orbital energy</a>`, 'links');
    }

    // ----- Change tab -----
    const A = this.app.actions;
    if (b.kind === 'moon') this.para(pc, `Moons keep to fixed ellipses around their planet in this version. Choose a planet or the star to change something.`, 'note');
    else {
      this.para(pc, `Changing anything switches to <strong>Full gravity</strong> from the present positions, because the old ellipses no longer apply. Watch the orbit path and the Orbit tab.`, 'note');
      // a planet may be made up to 1 % of the star's mass: beyond that the star itself would move noticeably,
      // and the panel's equations (which treat the star as fixed, as the IB course does) would no longer be good
      const m0 = sim.orig[b.id].mass, lo = star ? 0.25 : 0.01, hi = star ? 4 : Math.max(1, Math.min(1000, 0.01 * sim.orig[0].mass / m0));
      const mc = document.createElement('div'); mc.className = 'ctrl';
      mc.innerHTML = `<label for="mass-range"><span>Mass of ${b.name}</span><output id="mass-out"></output></label><input id="mass-range" type="range" min="${Math.log10(lo)}" max="${Math.log10(hi)}" step="0.01" value="${Math.log10(b.mass / m0)}"><div class="btn-row"><button type="button" class="btn" id="mass-apply">Set the mass</button></div>`;
      pc.appendChild(mc);
      const mr = mc.querySelector('#mass-range'), mo = mc.querySelector('#mass-out');
      const showM = () => { const k = Math.pow(10, Number(mr.value)); mo.textContent = `× ${num(k)} = ${num(m0 * k)} kg`; };
      mr.addEventListener('input', showM); showM();
      mc.querySelector('#mass-apply').addEventListener('click', () => A.setMass(b.id, m0 * Math.pow(10, Number(mr.value))));
      if (star) this.para(pc, `Only the star's mass changes here. A real star of a different mass would also have a different brightness, size and colour.`, 'small');
      else {
        this.para(pc, `Only the mass changes; the planet is drawn the same size. Its moons carry on from where they are, on new orbits. The mass stops at 1 % of the star's: the equations in this panel treat the star as fixed, which is only good while the planet is much lighter than the star.`, 'small');
        const kc = document.createElement('div'); kc.className = 'ctrl';
        kc.innerHTML = `<label for="kick-range"><span>Push along its motion</span><output id="kick-out"></output></label><input id="kick-range" type="range" min="-60" max="60" step="1" value="10">
          <div class="btn-row"><button type="button" class="btn" id="kick-apply">Push</button><button type="button" class="btn" id="kick-circ">Make it circular</button><button type="button" class="btn" id="kick-esc">Give it escape speed <span class="tag hl">HL</span></button></div>`;
        pc.appendChild(kc);
        const kr = kc.querySelector('#kick-range'), ko = kc.querySelector('#kick-out');
        const showK = () => { const k = Number(kr.value); ko.textContent = `${k > 0 ? '+' : k < 0 ? '−' : ''}${Math.abs(k)} % of its speed (${k >= 0 ? '+' : '−'}${num(Math.abs(k) / 100 * this.c.v / 1000)} km s⁻¹)`; };
        kr.addEventListener('input', showK); showK(); this.showKick = showK;
        kc.querySelector('#kick-apply').addEventListener('click', () => A.kick(b.id, 'percent', Number(kr.value)));
        kc.querySelector('#kick-circ').addEventListener('click', () => A.kick(b.id, 'circular'));
        kc.querySelector('#kick-esc').addEventListener('click', () => A.kick(b.id, 'escape'));
        this.para(pc, `A push changes the speed in an instant, as a short rocket burn would. Speeding up raises the far side of the orbit; slowing down lowers it. At √2 times the circular speed the planet escapes.`, 'small');
      }
      const rs = document.createElement('div'); rs.className = 'btn-row'; rs.innerHTML = `<button type="button" class="btn" id="sys-reset">Put everything back</button>`;
      pc.appendChild(rs); rs.firstChild.addEventListener('click', () => A.reset());
    }

    // ----- Launch tab -----
    if (star) this.para(pl, `Choose a planet or moon to launch a test mass from its surface.`, 'note');
    else {
      const vEsc = P.escapeSpeed(b.mass, b.radius);
      this.para(pl, `Launch a 1 kg test mass straight up from ${b.name}'s surface${b.type === 'gas' || b.type === 'icegiant' ? ' (the top of its clouds)' : ''}. Below the escape speed it falls back; at or above it, it never returns.${HL}`);
      const lc = document.createElement('div'); lc.className = 'ctrl';
      lc.innerHTML = `<label for="launch-range"><span>Launch speed</span><output id="launch-out"></output></label><input id="launch-range" type="range" min="0.1" max="1.5" step="0.01" value="0.8">
        <div class="btn-row"><button type="button" class="btn" id="launch-go">Launch</button><button type="button" class="btn" id="launch-99">0.99 v<sub>esc</sub></button><button type="button" class="btn" id="launch-101">1.01 v<sub>esc</sub></button></div>`;
      pl.appendChild(lc);
      const lr = lc.querySelector('#launch-range'), lo2 = lc.querySelector('#launch-out');
      const showL = () => { const f = Number(lr.value); lo2.textContent = `${f.toFixed(2)} × v_esc = ${num(f * vEsc / 1000)} km s⁻¹`; };
      lr.addEventListener('input', showL); showL();
      lc.querySelector('#launch-go').addEventListener('click', () => A.launch(b.id, Number(lr.value)));
      lc.querySelector('#launch-99').addEventListener('click', () => { lr.value = 0.99; showL(); A.launch(b.id, 0.99); });
      lc.querySelector('#launch-101').addEventListener('click', () => { lr.value = 1.01; showL(); A.launch(b.id, 1.01); });
      this.launchStatus = this.para(pl, 'Ready.', 'status');
      const pr = sim.probe, mine = () => pr.active && pr.id === b.id;
      this.row(pl, 'ph', 'Height above the surface', U.m, () => (mine() ? pr.r - pr.R : 0), () => (mine() ? `${num((pr.r - pr.R) / 1000)} km · ${num(pr.r / pr.R)} radii from the centre` : ''));
      this.row(pl, 'pv', 'Speed', U.ms, () => (mine() ? Math.abs(pr.v) : 0), () => (mine() ? (pr.v >= 0 ? 'moving up' : 'falling') : ''));
      this.row(pl, 'pk', 'Kinetic energy', U.J, () => (mine() ? 0.5 * pr.v * pr.v : 0));
      this.row(pl, 'pp', `Potential energy${HL}`, U.J, () => (mine() ? -pr.GM / pr.r : -G * b.mass / b.radius));
      this.row(pl, 'pt', `Total energy${HL}`, U.J, () => (mine() ? 0.5 * pr.v * pr.v - pr.GM / pr.r : -G * b.mass / b.radius), () => (mine() ? (0.5 * pr.v * pr.v - pr.GM / pr.r < 0 ? 'negative: it must come back' : 'zero or positive: it can reach infinity') : ''), () => {
        const f = mine() ? pr.f : Number(lr.value), v0 = f * vEsc;
        const L = [`Energy is conserved, so the total at launch decides everything:`, `$$E = \\tfrac{1}{2}mv^2 - \\dfrac{GMm}{r} = \\tfrac{1}{2}(1)(${tex(v0)})^2 - \\dfrac{(${tex(G)})(${tex(b.mass)})(1)}{${tex(b.radius)}}$$`, `$$E = ${tex(0.5 * v0 * v0 - G * b.mass / b.radius)}${TU.J}$$`];
        if (f < 1) L.push(`At its highest point $v = 0$, so $E = -\\dfrac{GMm}{r_\\text{max}}$:`, `$$r_\\text{max} = \\dfrac{r}{1 - (v/v_\\text{esc})^2} = ${tex(P.maxRadius(b.radius, f))}${TU.m}$$`, `That is ${num((P.maxRadius(b.radius, f) - b.radius) / 1000)} km above the surface.`);
        else L.push(`The total is ${f === 1 ? 'zero' : 'positive'}, so it never stops: far away it still has $v = \\sqrt{v_0^2 - v_\\text{esc}^2} = ${tex(vEsc * Math.sqrt(Math.max(0, f * f - 1)))}${TU.ms}$.`);
        return L;
      });
      this.para(pl, `In this model only ${b.name}'s gravity acts: no air resistance, no spin, and no pull from ${b.kind === 'moon' ? 'its planet or ' : ''}the star. Time is set to a speed that lets you watch the whole flight.`, 'small');
    }
  }

  // Work out everything the panel shows for the selected body.
  compute() {
    const { sim } = this.app, c = this.c, b = c.b;
    if (!b || b.kind === 'star') return;
    const par = c.par, t = this.t6;
    const r = c.r = sim.relState(b.id, t), v = c.v = Math.hypot(t[3], t[4], t[5]);
    c.a = b.el.a; c.e = b.el.e; c.rp = Math.abs(b.el.a) * Math.abs(1 - b.el.e); c.ra = b.el.a * (1 + b.el.e);
    c.T = b.el.e < 1 ? P.orbitalPeriod(b.el.a, G * par.mass) : Infinity;
    c.g = P.fieldStrength(par.mass, r); c.F = c.g * b.mass;
    c.Ek = 0.5 * b.mass * v * v; c.Ep = P.potentialEnergy(par.mass, b.mass, r); c.vesc = P.escapeSpeed(par.mass, r);
    const hx = t[1] * t[5] - t[2] * t[4], hy = t[2] * t[3] - t[0] * t[5], hz = t[0] * t[4] - t[1] * t[3];
    c.dA = 0.5 * Math.hypot(hx, hy, hz);
  }

  // ---------- A few times a second ----------
  tick(now, fps) {
    const { sim, state, scene, viz, rig } = this.app;
    if (now - this.last < 200) return;
    this.last = now;
    // time bar
    const t = sim.t, y = Math.floor(t / YEAR), d = Math.floor((t - y * YEAR) / DAY), h = Math.floor((t - y * YEAR - d * DAY) / 3600);
    $('t-date').textContent = sim.sys.real ? dateText(t) : `Year ${y + 1}, day ${d + 1}, ${String(h).padStart(2, '0')} h`;
    if (sim.mode === 'nbody') {
      const dr = $('drift'); dr.textContent = `Energy drift ${sim.drift >= 0 ? '+' : '−'}${num(Math.abs(sim.drift), 2)}${sim.limited ? ' · time slowed to keep steps small' : ''}`;
      dr.classList.toggle('warn', Math.abs(sim.drift) > 1e-4 || sim.limited);
    }
    const wt = state.slowed ? 'slowed here' : WARPS[state.warp][1];
    if ($('t-warp').textContent !== wt) { $('t-warp').textContent = wt; $('t-warp').title = state.slowed ? 'Time is slowed while you are close to a fast-moving moon, so that its motion stays smooth. Zoom out to speed up.' : ''; }
    // scale label
    const sv = scene.vis[state.selected >= 0 ? state.selected : rig.target], st = $('scale-text');
    let s;
    if (state.layers.truescale) s = `<strong>True scale.</strong> Distant bodies are smaller than a pixel: rings mark where they are.`;
    else if (sv && sv.enl > 1.05) s = `Sizes enlarged: ${sv.b.name} is drawn <strong>×${num(sv.enl, 2)}</strong>. Distances are to scale.`;
    else s = `${sv ? sv.b.name : 'This body'} is at <strong>true size</strong> from here. Distant bodies are enlarged; distances are to scale.`;
    if (s !== this.scaleShown) { st.innerHTML = s; this.scaleShown = s; }
    if (fps && !$('p-quality').hidden) $('fps-line').textContent = `${fps.fps.toFixed(0)} frames per second · ${fps.calls} draw calls · ${num(fps.tris)} triangles`;
    // legend numbers
    if (state.layers.vectors && $('lg-v')) { $('lg-v').textContent = `${num(viz.vMax / 1000)} km s⁻¹`; $('lg-f').textContent = `${num(viz.fMax)} N`; }
    if (state.layers.equi && $('lg-dv')) $('lg-dv').textContent = `${num(viz.dV)} J kg⁻¹`;
    if (state.layers.areas && $('lg-area') && viz.areas.visible) $('lg-area').innerHTML = `Each wedge is swept out in the same time, <i>T</i>/12 = ${duration(viz.areaT)}, and has the same area, ${num(viz.areaEach)} m². Plain and striped wedges alternate.`;
    if (state.layers.graph && now - (this.graphStamp || 0) > 1000) this.drawGraph();
    // info panel
    if ($('info').hidden || state.selected < 0) return;
    const b = sim.bodies[state.selected];
    if (b.dead) { $('info-kind').textContent = 'Destroyed in a collision'; return; }
    this.compute();
    for (const r of this.rows) {
      const x = r.get(), s2 = `${num(x)}${r.unit ? ' ' + r.unit : ''}`;
      if (s2 !== r.shown) { r.v.textContent = s2; r.shown = s2; }
      if (r.a) { const a = r.alt(); if (a !== r.shownAlt) { r.a.textContent = a; r.shownAlt = a; } }
    }
    // refresh open workings about once a second while things are moving
    if (!state.paused || state.stepped) for (const r of this.openWork) if (now - r.stamp > 1200) { this.renderWork(r); break; }
    if (this.tab === 'energy' && this.energyCanvas && b.kind !== 'star') this.drawEnergy();
    if (this.tab === 'change' && this.showKick) this.showKick();
    if (this.tab === 'launch' && this.launchStatus) {
      const p = sim.probe, ls = this.launchStatus;
      let msg = 'Ready.', cls = 'status';
      if (p.active && p.id === b.id) {
        const bound = p.f < 1;
        if (p.status === 'flight') msg = bound ? `In flight: ${p.v >= 0 ? 'rising and slowing' : 'falling back'}. Total energy is negative, so it cannot escape.${p.slow ? ' (Running behind the clock: slow time down.)' : ''}` : `In flight: slowing, but its total energy is ${p.f === 1 ? 'zero' : 'positive'}. It will never come back.`;
        else if (p.status === 'landed') { msg = `It fell back to the surface after ${duration(p.t)}, having reached ${num((p.rMax - p.R) / 1000)} km.`; cls += ' bad'; }
        else if (p.status === 'escaped') { msg = `Escaped: it is now ${num(p.r / p.R)} radii away and still moving at ${num(p.v / 1000)} km s⁻¹.`; cls += ' good'; }
      }
      if (msg !== ls.textContent) { ls.textContent = msg; ls.className = cls; }
    }
  }

  // ---------- Small 2D charts ----------
  drawEnergy() {
    const cv = this.energyCanvas, g = cv.getContext('2d'), c = this.c, W = cv.width, H = cv.height;
    const E = [c.Ek, c.Ep, c.Ek + c.Ep], names = ['Kinetic', 'Potential', 'Total'], cols = ['#8fe3b0', '#ff9a8f', '#ffd9a0'];
    const scale = Math.max(Math.abs(c.Ep), c.Ek) * 1.12, zero = H * 0.42, k = (H * 0.5) / scale;
    g.clearRect(0, 0, W, H);
    g.font = '22px system-ui, sans-serif'; g.textBaseline = 'middle';
    E.forEach((e, i) => {
      const x = 150 + i * 170, h = e * k;
      g.fillStyle = cols[i]; g.globalAlpha = 0.85;
      g.fillRect(x, zero - Math.max(h, 0), 90, Math.abs(h));
      if (i === 1) { g.globalAlpha = 0.5; g.strokeStyle = '#000'; g.lineWidth = 2; for (let yy = zero + 8; yy < zero - h; yy += 12) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + 90, yy); g.stroke(); } }
      g.globalAlpha = 1; g.fillStyle = '#e9eef7'; g.textAlign = 'center';
      g.fillText(names[i], x + 45, e >= 0 ? zero + 18 : zero - 18);
      g.fillStyle = '#9aa7bb'; g.fillText(num(e) + ' J', x + 45, e >= 0 ? zero - h - 18 : zero - h + 18);
    });
    g.strokeStyle = '#9aa7bb'; g.lineWidth = 2; g.beginPath(); g.moveTo(40, zero); g.lineTo(W - 20, zero); g.stroke();
    g.fillStyle = '#9aa7bb'; g.textAlign = 'left'; g.fillText('0', 16, zero);
  }
  drawGraph() {
    const { sim } = this.app, cv = $('graph-canvas'), g = cv.getContext('2d'), W = cv.width, H = cv.height;
    this.graphStamp = performance.now();
    const M = sim.bodies[0].mass, grad = 4 * Math.PI * Math.PI / (G * M);
    let pts = sim.planetIds.map((id) => sim.bodies[id]).filter((b) => !b.dead && b.el.e < 1).map((b) => ({ name: b.name, r: b.el.a, T: P.orbitalPeriod(b.el.a, G * M) }));
    const all = pts;
    if (this.graphInner) pts = pts.slice(0, Math.max(3, Math.ceil(pts.length / 2)));
    const xm = Math.max(...pts.map((p) => p.r ** 3)) * 1.12, ym = grad * xm;
    const px = Math.floor(Math.log10(xm)), py = Math.floor(Math.log10(ym)), L = 92, R = W - 24, T = 26, B = H - 70;
    g.clearRect(0, 0, W, H); g.font = '19px system-ui, sans-serif'; g.textBaseline = 'middle';
    g.strokeStyle = 'rgba(160,185,230,0.25)'; g.fillStyle = '#9aa7bb'; g.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const x = L + (R - L) * i / 4, y = B - (B - T) * i / 4;
      g.beginPath(); g.moveTo(x, T); g.lineTo(x, B); g.moveTo(L, y); g.lineTo(R, y); g.stroke();
      g.textAlign = 'center'; g.fillText((xm * i / 4 / 10 ** px).toFixed(1), x, B + 18);
      g.textAlign = 'right'; g.fillText((ym * i / 4 / 10 ** py).toFixed(1), L - 8, y);
    }
    g.textAlign = 'center'; g.fillText(`r³ / 10^${px} m³`, (L + R) / 2, H - 22);
    g.save(); g.translate(22, (T + B) / 2); g.rotate(-Math.PI / 2); g.fillText(`T² / 10^${py} s²`, 0, 0); g.restore();
    g.strokeStyle = '#8fc7ff'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(L, B); g.lineTo(R, T + (B - T) * (1 - 1)); g.stroke();
    g.fillStyle = '#ffd9a0'; g.strokeStyle = '#000';
    for (const p of pts) {
      const x = L + (R - L) * p.r ** 3 / xm, y = B - (B - T) * p.T ** 2 / ym;
      g.beginPath(); g.moveTo(x - 7, y - 7); g.lineTo(x + 7, y + 7); g.moveTo(x + 7, y - 7); g.lineTo(x - 7, y + 7); g.lineWidth = 3; g.strokeStyle = '#ffd9a0'; g.stroke();
      g.fillStyle = '#e9eef7'; g.textAlign = x > R - 120 ? 'right' : 'left'; g.fillText(p.name, x + (x > R - 120 ? -12 : 12), y + 14);
    }
    const note = `The line is $T^2 = \\dfrac{4\\pi^2}{GM} r^3$, with gradient $\\dfrac{4\\pi^2}{GM}$ = ${num(grad)} s² m⁻³ for this star. Each period here is calculated from the planet's orbit with Kepler's third law, so the points lie exactly on the line: the graph shows the law for this system rather than testing it. Here <i>r</i> is each orbit's mean radius. Try changing the star's mass and watch the gradient. Click the graph to switch between all the planets and the inner ones.`;
    if (note !== this.graphNote) { this.graphNote = note; $('graph-note').innerHTML = note; this.typeset($('graph-note')); }
    $('graph-table').innerHTML = `<table><tr><th>Planet</th><th>r / m</th><th>T / s</th><th>r³ / m³</th><th>T² / s²</th></tr>${all.map((p) => `<tr><td>${p.name}</td><td>${num(p.r)}</td><td>${num(p.T)}</td><td>${num(p.r ** 3)}</td><td>${num(p.T ** 2)}</td></tr>`).join('')}</table>`;
  }
}
