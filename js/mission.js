// Mission log adventures (mission.html?mission=europa).
// Each mission is one data file, missions/<id>.json: a list of scenes, played one at a time.
//   story    - text (and a picture), then a button to the next scene
//   decision - data, a typed calculation (marked by js/numeric.js, one free retry), then an order to choose.
//              A wrong number (twice), "show me the working", or a wrong order costs gauge points ("cost");
//              if the decision has a "detour", the story then goes there before rejoining at "next".
//   detour   - a recovery calculation; solving it gives back "refund" points
//   fork     - a choice of route with no wrong answer: each option costs a gauge ("gauge", "cost") and goes to its own "next"
//   finale   - never shown: it sends the player straight to the first of its "endings" whose conditions are met
//              (minTotal = total of the gauges, maxWrong = decisions that went wrong, minLog = captain's log points)
//   ending   - an ending, with the final report and the mission's "factOrFiction" note
//   log      - a captain's log: the student writes, compares with a model and ticks a checklist
//   pause    - the end of a chapter, with a report; it goes on to "next" if the next chapter is written
// A decision may have an optional "hl" extra (task, hint, working, numeric): shown after the order, for HL students.
// It never changes the gauges; it's saved as done or not, for the endings to use later.
// Hints cost 2 points of the scene's gauge. No gauge falls below FLOOR, so nobody is ever stranded.
// The plan and decisions are in docs/MISSION_LOG_PLAN.md. Progress is saved only in this browser.
(function () {
  const app = document.getElementById('ml-app');
  if (!app) return;
  const live = document.getElementById('ml-live');
  const id = (new URLSearchParams(location.search).get('mission') || 'europa').replace(/[^a-z0-9-]/g, '');
  const KEY = 'mission-' + id;
  const START = 100, FLOOR = 10, HINT = 2;
  const LETTERS = ['A', 'B', 'C', 'D'];

  let M = null;        // the mission data
  let S = null;        // the player's progress
  const svgs = {};     // diagram file -> svg text

  // ----- Helpers -----
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const scene = (sid) => M.scenes.find((x) => x.id === sid);
  const gaugeLabel = (g) => (M.gauges.find((x) => x.id === g) || {}).label || g;
  function announce(t) { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 50); }
  function typeset(el) {
    const run = () => window.MathJax && MathJax.typesetPromise && MathJax.typesetPromise([el]).catch(console.error);
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(run);
    else window.addEventListener('load', run, { once: true });
  }
  function typesetClear(el) { if (window.MathJax && MathJax.typesetClear) MathJax.typesetClear([el]); }
  const topicTitle = (t) => {
    const x = (window.SYLLABUS || []).flatMap((th) => th.topics).find((y) => y.id === t);
    return x ? x.title : '';
  };
  const notesHref = (sc) => `themes/${window.topicFile(sc.topic)}${sc.section ? '#' + sc.section : ''}`;
  const st = (sid) => (S.sc[sid] = S.sc[sid] || { tries: 0, hint: false, working: false, numDone: false, numFailed: false, choice: null, done: false, text: '', compared: false, ticks: [] });
  const logPoints = () => M.scenes.filter((x) => x.type === 'log').reduce((n, x) => n + st(x.id).ticks.length, 0);
  const logMax = () => M.scenes.filter((x) => x.type === 'log').reduce((n, x) => n + x.checklist.length, 0);

  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* storage blocked */ }
    S = s && typeof s === 'object' && s.at && scene(s.at) ? s : {};
    S.at = S.at || M.start;
    S.g = S.g || Object.fromEntries(M.gauges.map((g) => [g.id, START]));
    S.sc = S.sc || {};
    S.trail = S.trail || [];   // finished scenes: { id, note, bad }
    S.at = resolve(S.at);
  }
  // Ending conditions
  const gaugeTotal = () => M.gauges.reduce((n, g) => n + S.g[g.id], 0);
  const wrongCount = () => S.trail.filter((t) => t.bad && (scene(t.id) || {}).type === 'decision').length;
  function resolve(sid) {
    const sc = scene(sid);
    if (!sc || sc.type !== 'finale') return sid;
    const e = sc.endings.find((x) => (x.minTotal === undefined || gaugeTotal() >= x.minTotal)
      && (x.maxWrong === undefined || wrongCount() <= x.maxWrong)
      && (x.minLog === undefined || logPoints() >= x.minLog));
    return (e || sc.endings[sc.endings.length - 1]).next;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked: fine */ } }

  // Changes a gauge, keeping it between FLOOR and START. Returns the change actually made.
  function change(g, n) {
    const before = S.g[g];
    S.g[g] = Math.min(START, Math.max(FLOOR, before + n));
    return S.g[g] - before;
  }

  // ----- Loading -----
  async function init() {
    try {
      const res = await fetch(`missions/${id}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      M = await res.json();
      const files = [...new Set(M.scenes.filter((x) => x.figure && x.figure.svg).map((x) => x.figure.svg))];
      await Promise.all(files.map(async (f) => {
        const r = await fetch('missions/' + f);
        svgs[f] = r.ok ? await r.text() : '';
      }));
    } catch (e) {
      console.error(e);
      app.innerHTML = '<p class="notice">Sorry, this mission could not be loaded. (If you opened this page straight from your computer, use the preview server instead.)</p>';
      return;
    }
    load();
    document.getElementById('ml-title').textContent = `Mission log: ${M.title}`;
    document.title = `IB Physics adventure: ${M.title} · Mr Silkstone's Physics`;
    build();
  }

  // ----- The page frame -----
  function build() {
    app.innerHTML = `
      <div class="ml-intro">${M.intro}</div>
      <p class="ml-meta">${M.topics.map((t) => `<span class="tag">${t} ${topicTitle(t)}</span>`).join(' ')}
        <span class="tag">${M.level}</span> <span class="tag">${M.time}</span></p>
      ${M.status ? `<p class="notice">${M.status}</p>` : ''}
      <details class="ml-how"><summary>How to play</summary><ul>
        <li>At each <strong>decision</strong>, read the log, <strong>calculate</strong> (type the number; the unit is already there), then choose your <strong>order</strong>.</li>
        <li>A wrong number gets one free retry. A second wrong number, "show me the working", or a wrong order costs the mission ${M.gauges.map((g) => g.label.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' or $1')}.</li>
        <li>Some mistakes lead to a <strong>detour</strong>: solve the problem they cause and you win back some of what you lost.</li>
        <li>A hint costs ${HINT} points. The <strong>Σ Equations</strong> button is free.</li>
        <li>At the end of each chapter you write a <strong>captain's log</strong>. Good reasoning there counts towards the best ending.</li>
        <li>Your choices are final, and your progress is saved only in this browser.</li>
      </ul></details>
      <div class="ml-status" id="ml-status"></div>
      <section class="ml-scene" id="ml-scene" aria-live="off"></section>
      <details class="ml-trail" id="ml-trail"><summary>The mission so far</summary><ol id="ml-trail-list"></ol></details>`;
    app.addEventListener('click', onClick);
    app.addEventListener('input', onInput);
    app.addEventListener('change', onChange);
    app.addEventListener('submit', onSubmit);
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) document.body.classList.remove('ml-on-board');
      updateBoardButton();
    });
    drawStatus();
    drawScene(false);
    drawTrail();
    pinStatus();
    window.addEventListener('resize', pinStatus);
  }

  function drawStatus() {
    const max = logMax();
    document.getElementById('ml-status').innerHTML = `
      <div class="ml-gauges">${M.gauges.map((g) => {
        const v = S.g[g.id];
        return `<div class="ml-gauge${v <= 40 ? ' low' : ''}">
          <span class="ml-g-label">${g.label}</span>
          <span class="ml-g-bar" role="meter" aria-label="${esc(g.label)}" aria-valuemin="0" aria-valuemax="${START}" aria-valuenow="${v}"><span style="width:${v}%"></span></span>
          <span class="ml-g-num">${v}</span></div>`;
      }).join('')}</div>
      <p class="ml-status-row">${max ? `Captain's log points: <strong>${logPoints()} of ${max}</strong>` : ''}
        <span class="ml-status-btns">
          <button type="button" class="button ghost small" data-act="board">Show on the board</button>
          <button type="button" class="button ghost small" data-act="restart">Start again</button>
        </span></p>`;
    updateBoardButton();
  }

  function drawTrail() {
    const list = document.getElementById('ml-trail-list');
    document.getElementById('ml-trail').hidden = !S.trail.length;
    list.innerHTML = S.trail.map((t) => {
      const sc = scene(t.id);
      return `<li class="${t.bad ? 'bad' : 'ok'}">${sc ? sc.title : t.id}${t.note ? ` <span class="ml-trail-note">${t.note}</span>` : ''}</li>`;
    }).join('');
  }

  // ----- Scenes -----
  function figureHtml(f) {
    if (!f) return '';
    const svg = (svgs[f.svg] || '').replace('<svg ', `<svg role="img" aria-label="${esc(f.alt)}" `);
    return `<figure class="diagram">${svg}${f.caption ? `<figcaption>${f.caption}</figcaption>` : ''}</figure>`;
  }
  function drawScene(focus = true) {
    const sc = scene(S.at);
    const box = document.getElementById('ml-scene');
    typesetClear(box);
    box.innerHTML = ({ story: storyHtml, decision: decisionHtml, detour: decisionHtml, fork: forkHtml, log: logHtml, pause: pauseHtml, ending: pauseHtml })[sc.type](sc);
    box.dataset.type = sc.type;
    typeset(box);
    if (sc.topic && window.setEquationTopic) window.setEquationTopic(sc.topic);
    if (focus) {
      const h = box.querySelector('h2');
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
      // Scroll the new scene to just below the sticky header and gauges.
      const y = box.getBoundingClientRect().top + window.scrollY - stickyHeight() - 8;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }
  // The site header stays at the top of the screen; the gauges sit just below it (wide screens only, see css/mission.css).
  function headerHeight() {
    const h = document.getElementById('site-header');
    return h && getComputedStyle(h).position === 'sticky' ? h.offsetHeight : 0;
  }
  function stickyHeight() {
    const s = document.getElementById('ml-status');
    return headerHeight() + (s && getComputedStyle(s).position === 'sticky' ? s.offsetHeight : 0);
  }
  function pinStatus() {
    const s = document.getElementById('ml-status');
    if (s) s.style.top = headerHeight() + 'px';
  }
  function storyHtml(sc) {
    return `<h2>${sc.title}</h2>${sc.html}${figureHtml(sc.figure)}
      <p class="ml-next"><button type="button" class="button" data-act="next">${sc.button || 'Continue'} →</button></p>`;
  }

  // A fork: pick a route. Every option is allowed; each one costs a different gauge.
  function forkHtml(sc) {
    const s = st(sc.id);
    const chosen = s.choice !== null;
    const o = chosen ? sc.options[s.choice] : null;
    return `<p class="ml-kicker">Your choice</p><h2>${sc.title}</h2>${sc.html}${figureHtml(sc.figure)}
      <div class="ml-choice"><p>${sc.question}</p><ol class="options">${sc.options.map((x, i) => `<li>
        <button type="button" class="option${chosen && i === s.choice ? ' is-chosen' : ''}" data-act="fork" data-i="${i}"${chosen ? ' disabled' : ''}>
          <span class="letter">${LETTERS[i]}</span><span><strong>${x.label}.</strong> ${x.text} <em>(Costs ${x.cost} ${gaugeLabel(x.gauge).toLowerCase()}.)</em></span></button></li>`).join('')}</ol></div>
      ${chosen ? `<div class="ml-outcome good">${o.result}${s.note ? `<p class="ml-change">${s.note}</p>` : ''}
        <p class="ml-next"><button type="button" class="button" data-act="next" data-to="${o.next}">Continue →</button></p></div>` : ''}`;
  }

  function decisionHtml(sc) {
    const s = st(sc.id);
    const detour = sc.type === 'detour';
    const n = sc.numeric;
    const unit = n.unit ? (n.unit.includes('$') ? n.unit : esc(n.unit)) : '';
    const head = detour ? `<p class="ml-kicker">Detour</p><h2>${sc.title}</h2>`
      : `<p class="ml-kicker">Decision ${sc.number}</p><h2>${sc.title}</h2>`;
    const meta = `<p class="ml-meta"><a class="tag" href="${notesHref(sc)}" target="_blank" rel="noopener">${sc.topic} ${topicTitle(sc.topic)}<span class="visually-hidden"> (notes, opens in a new tab)</span></a>
      <span class="tag ml-stake">${detour ? 'To win back' : 'At stake'}: ${gaugeLabel(sc.gauge)}</span></p>`;
    let calc;
    if (!s.numDone) {
      calc = `<form class="ml-calc" data-calc novalidate>
          <label for="ml-ans">Your answer</label>
          <span class="ml-calc-row"><input id="ml-ans" type="text" inputmode="decimal" autocomplete="off">
            <span class="ml-unit">${unit}</span>
            <button type="submit" class="button small">Check</button></span>
        </form>
        <div class="ml-fb" id="ml-fb" aria-live="polite"></div>
        ${s.hint ? `<p class="hint"><strong>Hint:</strong> ${sc.hint}</p>` : ''}
        <p class="ml-help-btns">
          ${s.hint ? '' : `<button type="button" class="link-btn" data-act="hint">Show a hint (costs ${HINT} ${gaugeLabel(sc.gauge).toLowerCase()})</button> · `}
          <button type="button" class="link-btn" data-act="working">Show me the working</button></p>`;
    } else {
      calc = `<div class="feedback ${s.numFailed ? 'bad' : 'good'}"><strong>${s.numFailed ? 'The working' : 'Correct!'}</strong>${s.numFailed && s.lastMistake ? `<p>${s.lastMistake}</p>` : ''}${sc.working}</div>`;
    }
    let choice = '';
    if (!detour && s.numDone) {
      const c = sc.choice;
      const chosen = s.choice !== null;
      choice = `<div class="ml-choice"><h3>Your order</h3><p>${c.question}</p><ol class="options">${c.options.map((o, i) => {
        const cls = chosen && i === c.answer ? 'is-correct' : chosen && i === s.choice ? 'is-wrong' : '';
        return `<li><button type="button" class="option ${cls}" data-act="choose" data-i="${i}"${chosen ? ' disabled' : ''}>
          <span class="letter">${LETTERS[i]}</span><span>${o}</span></button>
          ${chosen && i === s.choice && i !== c.answer ? `<p class="ml-why">${c.feedback[i]}</p>` : ''}</li>`;
      }).join('')}</ol>
      ${chosen ? `<p class="ml-explain"><strong>Why:</strong> ${c.explain}</p>` : ''}</div>`;
    }
    let outcome = '';
    if (s.done) {
      const bad = detour ? s.numFailed : s.bad;
      const where = detour ? sc.next : (s.bad && sc.detour ? sc.detour : sc.next);
      outcome = `<div class="ml-outcome ${bad ? 'bad' : 'good'}">
          ${bad ? sc.failure : sc.success}
          ${s.note ? `<p class="ml-change">${s.note}</p>` : ''}
          <p class="ml-next"><button type="button" class="button" data-act="next" data-to="${where}">${!detour && s.bad && sc.detour ? 'Deal with it' : 'Continue'} →</button></p>
        </div>`;
    }
    return `${head}${meta}<div class="ml-log">${sc.log || sc.html}</div>${figureHtml(sc.figure)}
      <div class="ml-task">${sc.task}</div>${calc}${choice}${s.done && sc.hl ? hlHtml(sc) : ''}${outcome}`;
  }

  // The optional HL extra: its own answer box, no effect on the gauges, the hint is free.
  function hlHtml(sc) {
    const s = st(sc.id);
    const h = sc.hl;
    const unit = h.numeric.unit ? (h.numeric.unit.includes('$') ? h.numeric.unit : esc(h.numeric.unit)) : '';
    let body;
    if (!s.hlDone) {
      body = `<form class="ml-calc" data-hlcalc novalidate>
          <label for="ml-hl-ans">Your answer</label>
          <span class="ml-calc-row"><input id="ml-hl-ans" type="text" inputmode="decimal" autocomplete="off">
            <span class="ml-unit">${unit}</span>
            <button type="submit" class="button small">Check</button></span>
        </form>
        <div class="ml-fb" id="ml-hl-fb" aria-live="polite"></div>
        ${s.hlHint ? `<p class="hint"><strong>Hint:</strong> ${h.hint}</p>` : ''}
        <p class="ml-help-btns">${s.hlHint ? '' : '<button type="button" class="link-btn" data-act="hl-hint">Show a hint</button> · '}
          <button type="button" class="link-btn" data-act="hl-working">Show me the working</button></p>`;
    } else {
      body = `<div class="feedback ${s.hlFailed ? 'bad' : 'good'}"><strong>${s.hlFailed ? 'The working' : 'Correct!'}</strong>${s.hlFailed && s.hlMistake ? `<p>${s.hlMistake}</p>` : ''}${h.working}</div>`;
    }
    return `<div class="ml-hl"><p><span class="tag hl">HL</span> Optional: it doesn't affect your gauges.</p>${h.task}${body}</div>`;
  }
  function checkHl(sc, text) {
    const s = st(sc.id);
    const fb = document.getElementById('ml-hl-fb');
    const r = window.Numeric.checkNumeric(sc.hl.numeric, text);
    if (r.status === 'unreadable') { fb.innerHTML = '<p class="feedback bad">Type a number, for example 12.5 or 3.2e4 (the unit is already there).</p>'; return; }
    if (r.status === 'wrong') {
      s.hlTries = (s.hlTries || 0) + 1;
      const m = r.mistake !== null ? sc.hl.numeric.mistakes[r.mistake].feedback : 'Check your working.';
      if (s.hlTries < 2) {
        save();
        fb.innerHTML = `<p class="feedback bad"><strong>Not quite.</strong> ${m} You have one more try.</p>`;
        typeset(fb);
        document.getElementById('ml-hl-ans').select();
        return;
      }
      s.hlFailed = true; s.hlMistake = m;
    }
    s.hlDone = true;
    save();
    redraw('.ml-hl .feedback');
  }

  function logHtml(sc) {
    const s = st(sc.id);
    return `<p class="ml-kicker">Captain's log</p><h2>${sc.title}</h2>
      <label for="ml-log-text"><strong>Your log entry.</strong> ${sc.prompt}</label>
      <textarea id="ml-log-text" rows="5" data-log>${esc(s.text)}</textarea>
      <div class="ml-fb" id="ml-fb" aria-live="polite"></div>
      ${s.compared ? `<div class="ml-model"><strong>Our log entry:</strong> ${sc.model}</div>
        <fieldset class="ml-ticks"><legend>Tick each point your entry makes</legend>
          ${sc.checklist.map((t, i) => `<label class="ml-tick"><input type="checkbox" data-tick="${i}"${s.ticks.includes(i) ? ' checked' : ''}> ${t}</label>`).join('')}
        </fieldset>
        <p class="ml-help">Be honest: these points count towards the best ending.</p>
        <p class="ml-next"><button type="button" class="button" data-act="next">Continue →</button></p>`
    : '<p><button type="button" class="button ghost small" data-act="compare">Compare with our log entry</button></p>'}`;
  }

  function pauseHtml(sc) {
    const missed = S.trail.filter((t) => t.bad).map((t) => scene(t.id)).filter((x) => x && x.topic);
    const topics = [...new Map(missed.map((x) => [x.topic + (x.section || ''), x])).values()];
    const end = sc.type === 'ending';
    const hls = M.scenes.filter((x) => x.hl);
    const hlDone = hls.filter((x) => st(x.id).hlDone && !st(x.id).hlFailed).length;
    return `${end ? '<p class="ml-kicker">The end</p>' : ''}<h2>${sc.title}</h2>${sc.html}
      <h3>${end ? 'Final report' : 'Status report'}</h3>
      <ul>${M.gauges.map((g) => `<li>${g.label}: <strong>${S.g[g.id]}</strong> of ${START}</li>`).join('')}
        ${logMax() ? `<li>Captain's log points: <strong>${logPoints()} of ${logMax()}</strong></li>` : ''}
        ${end ? `<li>Decisions that went wrong: <strong>${wrongCount()}</strong> of ${new Set(M.scenes.filter((x) => x.type === 'decision').map((x) => x.number)).size}</li>` : ''}
        ${end && hls.length && hls.some((x) => st(x.id).hlDone) ? `<li><span class="tag hl">HL</span> extras solved: <strong>${hlDone} of ${hls.length}</strong></li>` : ''}</ul>
      ${end && M.endingsNote ? `<p class="ml-help">${M.endingsNote}</p>` : ''}
      ${end && M.factOrFiction ? `<details class="ml-fact"><summary>Fact or fiction?</summary>${M.factOrFiction}</details>` : ''}
      <h3>What to revise</h3>
      ${topics.length ? `<ul>${topics.map((x) => `<li><a href="${notesHref(x)}">${x.topic} ${topicTitle(x.topic)}</a> (${x.title})</li>`).join('')}</ul>`
    : '<p>Nothing: every decision went to plan. Well done, Commander.</p>'}
      ${sc.next ? `<p class="ml-next"><button type="button" class="button" data-act="next">${sc.button || 'Continue'} →</button></p>` : ''}
      <p><a class="button ghost small" href="games.html">More review games</a>
        <button type="button" class="button ghost small" data-act="restart">Start the mission again</button></p>`;
  }

  // ----- Marking -----
  function finishDecision(sc) {
    const s = st(sc.id);
    if (sc.type === 'detour') {
      s.done = true;
      if (!s.numFailed) { const d = change(sc.gauge, sc.refund); s.note = d ? `+${d} ${gaugeLabel(sc.gauge)} won back` : ''; }
      announce(s.numFailed ? 'The detour is over.' : `Solved. ${s.note}.`);
    } else {
      if (s.choice === null) return;
      s.done = true;
      s.bad = s.numFailed || s.choice !== sc.choice.answer;
      if (s.bad) { const d = change(sc.gauge, -sc.cost); s.note = d ? `−${-d} ${gaugeLabel(sc.gauge)}` : `${gaugeLabel(sc.gauge)} already at its lowest`; }
      announce(s.bad ? `That cost the mission: ${s.note}.` : 'Order carried out.');
    }
    save();
  }
  function check(sc, text) {
    const s = st(sc.id);
    const fb = document.getElementById('ml-fb');
    const r = window.Numeric.checkNumeric(sc.numeric, text);
    if (r.status === 'unreadable') {
      fb.innerHTML = '<p class="feedback bad">Type a number, for example 12.5 or 3.2e4 (the unit is already there).</p>';
      return;
    }
    if (r.status === 'wrong') {
      s.tries++;
      const m = r.mistake !== null ? sc.numeric.mistakes[r.mistake].feedback : 'Check your working.';
      if (s.tries < 2) {
        save();
        fb.innerHTML = `<p class="feedback bad"><strong>Not quite.</strong> ${m} You have one more try.</p>`;
        typeset(fb);
        document.getElementById('ml-ans').select();
        return;
      }
      s.numDone = true; s.numFailed = true;
      s.lastMistake = m;
    } else {
      s.numDone = true;
    }
    if (sc.type === 'detour') finishDecision(sc);
    save();
    redraw(sc.type === 'detour' ? '.ml-outcome button' : '.ml-choice .option');
  }
  function redraw(focusSel) {
    const box = document.getElementById('ml-scene');
    typesetClear(box);
    const sc = scene(S.at);
    box.innerHTML = (sc.type === 'log' ? logHtml : sc.type === 'fork' ? forkHtml : decisionHtml)(sc);
    typeset(box);
    drawStatus();
    if (focusSel) {
      const f = box.querySelector(focusSel);
      if (f) { f.focus({ preventScroll: true }); f.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
  }

  // ----- Events -----
  function onClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    const sc = scene(S.at);
    const s = st(sc.id);
    if (act === 'next') {
      const to = b.dataset.to || sc.next;
      S.trail.push({ id: sc.id, note: s.note || (sc.type === 'log' ? `${s.ticks.length} of ${sc.checklist.length} log points` : ''), bad: !!(s.bad || (sc.type === 'detour' && s.numFailed)) });
      S.at = resolve(to);
      save();
      drawStatus();
      drawScene();
      drawTrail();
    } else if (act === 'hint') {
      s.hint = true;
      change(sc.gauge, -HINT);
      save();
      redraw('.hint');
      announce(`Hint shown. ${HINT} ${gaugeLabel(sc.gauge).toLowerCase()} used.`);
    } else if (act === 'working') {
      if (!window.confirm('Show the working? This counts as a wrong answer, so the mission will pay for it.')) return;
      s.working = true; s.numDone = true; s.numFailed = true;
      if (sc.type === 'detour') finishDecision(sc);
      save();
      redraw(sc.type === 'detour' ? '.ml-outcome button' : '.ml-choice .option');
    } else if (act === 'hl-hint') {
      s.hlHint = true;
      save();
      redraw('.ml-hl .hint');
    } else if (act === 'hl-working') {
      s.hlDone = true; s.hlFailed = true; s.hlMistake = '';
      save();
      redraw('.ml-hl .feedback');
    } else if (act === 'fork') {
      if (s.choice !== null) return;
      s.choice = Number(b.dataset.i);
      const o = sc.options[s.choice];
      const d = change(o.gauge, -o.cost);
      s.note = `${o.label}: ${d ? `−${-d} ${gaugeLabel(o.gauge)}` : `${gaugeLabel(o.gauge)} already at its lowest`}`;
      save();
      redraw('.ml-outcome button');
      announce(`${s.note}.`);
    } else if (act === 'choose') {
      if (s.choice !== null) return;
      s.choice = Number(b.dataset.i);
      finishDecision(sc);
      redraw('.ml-outcome button');
    } else if (act === 'compare') {
      const words = s.text.trim().split(/\s+/).filter(Boolean).length;
      if (words < 12) {
        document.getElementById('ml-fb').innerHTML = '<p class="feedback bad">Write your log entry first: two sentences that give the physics reasons.</p>';
        return;
      }
      s.compared = true;
      save();
      redraw('.ml-model');
    } else if (act === 'board') {
      toggleBoard();
    } else if (act === 'restart') {
      if (!window.confirm('Start the mission again? Your gauges, answers and log entries will be cleared.')) return;
      try { localStorage.removeItem(KEY); } catch (err) { /* fine */ }
      load();
      drawStatus();
      drawScene(false);
      drawTrail();
      window.scrollTo({ top: 0 });
    }
  }
  function onInput(e) {
    if (e.target.dataset.log !== undefined) { st(S.at).text = e.target.value; save(); }
  }
  function onChange(e) {
    const t = e.target;
    if (t.dataset.tick === undefined) return;
    const s = st(S.at);
    const i = Number(t.dataset.tick);
    s.ticks = s.ticks.filter((x) => x !== i);
    if (t.checked) s.ticks.push(i);
    save();
    drawStatus();
  }
  function onSubmit(e) {
    e.preventDefault();
    if (e.target.dataset.calc !== undefined) check(scene(S.at), e.target.querySelector('input').value);
    if (e.target.dataset.hlcalc !== undefined) checkHl(scene(S.at), e.target.querySelector('input').value);
  }

  // ----- Board view -----
  function toggleBoard() {
    const on = !document.body.classList.contains('ml-on-board');
    document.body.classList.toggle('ml-on-board', on);
    if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    updateBoardButton();
  }
  function updateBoardButton() {
    const b = app.querySelector('[data-act="board"]');
    if (b) b.textContent = document.body.classList.contains('ml-on-board') ? 'Leave the board view' : 'Show on the board';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
