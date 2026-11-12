// Newsroom (newsroom.html, or newsroom.html?article=soapbox to play one).
// Each article is one data file, newsroom/<id>.json, listed in newsroom/index.json: paragraphs of sentences, some
// with an "err" (the physics error: what's wrong, the corrected sentence and the key points) and some with an "ok"
// (why a sentence that looks suspicious is right). Progress is saved only in this browser.
(function () {
  const app = document.getElementById('nr-app');
  if (!app) return;
  const live = document.getElementById('nr-live');
  const id = (new URLSearchParams(location.search).get('article') || '').replace(/[^a-z0-9-]/g, '');
  const BEST = 'newsroom-best';
  const RANKS = [[90, 'Science editor'], [70, 'Senior reporter'], [50, 'Reporter'], [0, 'Intern']];
  const COST = { missed: 12, falseAlarm: 6, wrongChoice: 6 };

  let A = null;      // the article
  let S = null;      // the player's progress
  let list = [];     // every sentence, in reading order
  let errors = [];   // the sentences that contain an error

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function announce(t) { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 50); }
  function typeset() {
    const run = () => window.MathJax && MathJax.typesetPromise && MathJax.typesetPromise([app]).catch(console.error);
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(run);
    else window.addEventListener('load', run, { once: true });
  }
  function readJson(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v && typeof v === 'object' ? v : fallback; } catch (e) { return fallback; }
  }
  function writeJson(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* storage blocked: fine */ } }
  const rank = (score) => RANKS.find((r) => score >= r[0])[1];
  const topicTitle = (t) => {
    const x = (window.SYLLABUS || []).flatMap((th) => th.topics).find((y) => y.id === t);
    return x ? x.title : '';
  };
  const notesHref = (e) => `themes/${window.topicFile(e.topic)}#${e.section}`;

  // ----- The list of articles -----
  async function showList() {
    let items;
    try {
      const names = await (await fetch('newsroom/index.json', { cache: 'no-cache' })).json();
      items = await Promise.all(names.map(async (n) => (await fetch(`newsroom/${n}.json`, { cache: 'no-cache' })).json()));
    } catch (e) {
      console.error(e);
      app.innerHTML = '<p class="notice">Sorry, the articles could not be loaded. (If you opened this page straight from your computer, use the preview server instead.)</p>';
      return;
    }
    const best = readJson(BEST, {});
    app.innerHTML = `
      <p class="lead">You are a junior science editor. Each article below has physics errors that have slipped past the writers. Find them, say what's wrong, and rewrite each one correctly before the paper goes to print.</p>
      <p>Every article and everyone named in them are made up. Each one takes about 10 minutes, and works well in pairs.</p>
      <ul class="card-grid">${items.map((a) => `
        <li><a class="card" href="newsroom.html?article=${a.id}">
          <h3>${esc(a.headline)}</h3>
          <p>${esc(a.kind)}, <em>${esc(a.paper)}</em></p>
          <p>${a.topics.map((t) => `<span class="tag">${t}</span>`).join(' ')} <span class="tag${a.level === 'HL' ? ' hl' : ''}">${a.level}</span>
          ${best[a.id] !== undefined ? `<span class="tag sim-tag">✓ ${best[a.id]}%</span>` : ''}</p>
        </a></li>`).join('')}
      </ul>`;
  }

  // ----- Loading one article -----
  async function init() {
    if (!id) { showList(); return; }
    try {
      const res = await fetch(`newsroom/${id}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      A = await res.json();
    } catch (e) {
      console.error(e);
      app.innerHTML = '<p class="notice">Sorry, this article could not be loaded. <a href="newsroom.html">See all the articles</a>.</p>';
      return;
    }
    A.body.forEach((para, p) => para.forEach((s) => { s.i = list.length; s.p = p; list.push(s); }));
    errors = list.filter((s) => s.err);
    S = readJson('newsroom-' + id, null) || fresh();
    document.getElementById('nr-title').textContent = 'Newsroom: ' + A.kind.toLowerCase();
    app.addEventListener('click', onClick);
    app.addEventListener('input', onInput);
    app.addEventListener('change', onChange);
    // The sentences are spans, so that they wrap like ordinary text; these keys make them work like buttons.
    app.addEventListener('keydown', (e) => {
      const m = e.target.closest('[data-mark]');
      if (m && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleMark(m); }
    });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) document.body.classList.remove('nr-on-board'); });
    render();
  }
  function fresh() { return { stage: 'mark', marks: {}, wrong: {}, picked: {}, text: {}, compared: {}, ticks: {} }; }
  function save() { writeJson('newsroom-' + id, S); }

  // ----- Scoring -----
  const missedList = () => errors.filter((s) => !S.marks[s.i]);
  const falseList = () => list.filter((s) => S.marks[s.i] && !s.err);
  const wrongCount = () => Object.values(S.wrong).reduce((a, n) => a + n, 0);
  function score() {
    return Math.max(0, 100 - COST.missed * missedList().length - COST.falseAlarm * falseList().length - COST.wrongChoice * wrongCount());
  }

  // ----- Drawing -----
  function masthead() {
    return `<header class="nr-mast">
        <p class="nr-paper-name">${esc(A.paper)}</p>
        <h2 class="nr-headline">${esc(A.headline)}</h2>
        ${A.standfirst ? `<p class="nr-stand">${esc(A.standfirst)}</p>` : ''}
        <p class="nr-byline">${esc(A.byline)}</p>
      </header>`;
  }
  function paper(sentence) {
    return `<article class="nr-paper">${masthead()}<div class="nr-columns">${A.body.map((para) => `<p>${para.map(sentence).join(' ')}</p>`).join('')}</div></article>`;
  }
  function tools(extra) {
    return `<p class="nr-tools">
        <button type="button" class="button ghost small" data-act="board">Show on the board</button>
        ${extra || ''}
        <button type="button" class="button ghost small" data-act="restart">Start again</button>
      </p>`;
  }

  function render() {
    ({ mark: drawMark, verdict: drawVerdict, desk: drawDesk, done: drawDone })[S.stage]();
    typeset();
  }

  function drawMark() {
    const n = Object.keys(S.marks).length;
    app.innerHTML = `
      <p class="nr-brief"><strong>From the editor:</strong> ${esc(A.brief)} There are <strong>${errors.length} physics errors</strong>. Tap each sentence that contains one. Careful: some sentences that sound odd are right, and false alarms lose points.</p>
      <p class="my-meta">${A.topics.map((t) => `<span class="tag">${t} ${topicTitle(t)}</span>`).join(' ')}</p>
      ${paper((s) => `<span role="button" tabindex="0" class="nr-sent${S.marks[s.i] ? ' marked' : ''}" data-mark="${s.i}" aria-pressed="${S.marks[s.i] ? 'true' : 'false'}">${s.t}</span>`)}
      <div class="nr-bar">
        <span id="nr-count">${n} of ${errors.length} marked</span>
        <button type="button" class="button" data-act="send"${n ? '' : ' disabled'}>Send to the editor</button>
      </div>
      ${tools('<button type="button" class="button ghost small" data-act="print">Print the article</button>')}`;
  }

  function drawVerdict() {
    const missed = missedList(), falseAlarms = falseList(), found = errors.length - missed.length;
    app.innerHTML = `
      <p class="nr-brief"><strong>From the editor:</strong> you found <strong>${found} of ${errors.length}</strong> errors${falseAlarms.length ? `, with <strong>${falseAlarms.length}</strong> false alarm${falseAlarms.length === 1 ? '' : 's'}` : ' and raised no false alarms'}.</p>
      <p class="nr-key"><span class="nr-sample found">Error you found</span> <span class="nr-sample missed">Error you missed</span> <span class="nr-sample false">False alarm</span></p>
      ${paper((s) => {
        const c = s.err ? (S.marks[s.i] ? 'found' : 'missed') : (S.marks[s.i] ? 'false' : '');
        return c ? `<span class="nr-mark ${c}">${s.t}</span>` : s.t;
      })}
      ${falseAlarms.length ? `<h3>Your false alarms</h3>${falseAlarms.map((s) => `<blockquote class="nr-quote">${s.t}</blockquote><p>${s.ok || 'There is no physics error in this sentence.'}</p>`).join('')}` : ''}
      <p><button type="button" class="button" data-act="desk">Go to the corrections desk</button></p>
      ${tools()}`;
  }

  function errorCard(s, n) {
    const e = s.err;
    const picked = S.picked[s.i];
    const right = picked === e.answer;
    const cmp = S.compared[s.i];
    return `<section class="nr-error${cmp ? ' finished' : ''}" id="err-${s.i}">
      <h3>Correction ${n} of ${errors.length}${S.marks[s.i] ? '' : ' <span class="tag hl">You missed this one</span>'}</h3>
      <blockquote class="nr-quote">${s.t}</blockquote>
      <h4>What is wrong with it?</h4>
      <div class="nr-options">${e.options.map((o, i) => {
        const wasWrong = (S.tried && S.tried[s.i] || []).includes(i);
        const cls = right && i === e.answer ? ' right' : wasWrong ? ' wrong' : '';
        return `<button type="button" class="nr-option${cls}" data-pick="${s.i}" data-opt="${i}"${right ? ' disabled' : ''}>${o}</button>
          ${wasWrong && e.feedback[i] ? `<p class="nr-why">${e.feedback[i]}</p>` : ''}`;
      }).join('')}</div>
      ${right ? `<div class="nr-rewrite">
        <label for="fix-${s.i}"><strong>Rewrite the sentence so that the physics is right.</strong> Keep the writer's style.</label>
        <textarea id="fix-${s.i}" data-fix="${s.i}" rows="3">${esc(S.text[s.i] || '')}</textarea>
        ${cmp ? `<div class="nr-model"><p><strong>The editor's version:</strong> ${e.fix}</p>
          <p><strong>Did yours do these?</strong></p>
          <ul class="nr-ticks">${e.keys.map((k, i) => `<li><label><input type="checkbox" data-tick="${s.i}:${i}"${S.ticks[s.i + ':' + i] ? ' checked' : ''}> ${k}</label></li>`).join('')}</ul>
          <p><a href="${notesHref(e)}">Revise this in ${e.topic} ${topicTitle(e.topic)}</a></p></div>`
        : `<p><button type="button" class="button small" data-compare="${s.i}"${(S.text[s.i] || '').trim() ? '' : ' disabled'}>Compare with the editor's version</button></p>`}
      </div>` : ''}
    </section>`;
  }

  function drawDesk() {
    const left = errors.filter((s) => !S.compared[s.i]).length;
    app.innerHTML = `
      <p class="nr-brief"><strong>From the editor:</strong> fix each one before the deadline. Say what's wrong, then rewrite the sentence.</p>
      ${errors.map((s, n) => errorCard(s, n + 1)).join('')}
      <div class="nr-bar">
        <span>${left ? `${left} correction${left === 1 ? '' : 's'} still to make` : 'All corrections made'}</span>
        <button type="button" class="button" data-act="finish"${left ? ' disabled' : ''}>Send to print</button>
      </div>
      ${tools()}`;
  }

  function drawDone() {
    const sc = score();
    const missed = missedList(), falseAlarms = falseList();
    const weak = errors.filter((s) => !S.marks[s.i] || (S.wrong[s.i] || 0) > 0);
    app.innerHTML = `
      <div class="nr-result">
        <p class="nr-score">${sc}%</p>
        <p class="nr-rank">${rank(sc)}</p>
        <p>${missed.length} error${missed.length === 1 ? '' : 's'} missed, ${falseAlarms.length} false alarm${falseAlarms.length === 1 ? '' : 's'}, ${wrongCount()} wrong diagnos${wrongCount() === 1 ? 'is' : 'es'}.</p>
      </div>
      <h3>Today's corrected edition</h3>
      ${paper((s) => (s.err ? `<span class="nr-mark fixed">${s.err.fix}</span>` : s.t))}
      ${weak.length ? `<h3>What to revise next</h3><ul>${weak.map((s) => `<li><a href="${notesHref(s.err)}">${s.err.topic} ${topicTitle(s.err.topic)}</a>: ${s.err.keys[0]}</li>`).join('')}</ul>` : '<p>No revision needed from this article: every error found and diagnosed first time.</p>'}
      <p class="nr-tools"><a class="button" href="newsroom.html">Choose another article</a>
        <button type="button" class="button ghost small" data-act="restart">Start again</button></p>`;
  }

  // ----- Actions -----
  function onClick(e) {
    const mark = e.target.closest('[data-mark]');
    if (mark) { toggleMark(mark); return; }
    const pick = e.target.closest('[data-pick]');
    if (pick) { choose(+pick.dataset.pick, +pick.dataset.opt); return; }
    const cmp = e.target.closest('[data-compare]');
    if (cmp) {
      const i = +cmp.dataset.compare;
      S.compared[i] = true; save(); keepPlace('err-' + i); announce("The editor's version is now shown.");
      return;
    }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    const a = act.dataset.act;
    if (a === 'send') { S.stage = 'verdict'; go(); }
    else if (a === 'desk') { S.stage = 'desk'; go(); }
    else if (a === 'finish') {
      S.stage = 'done';
      const best = readJson(BEST, {});
      best[id] = Math.max(best[id] || 0, score());
      writeJson(BEST, best);
      go();
    } else if (a === 'restart') {
      if (confirm('Start this article again? Your corrections will be cleared.')) { S = fresh(); go(); }
    } else if (a === 'print') window.print();
    else if (a === 'board') toggleBoard();
  }
  function go() { save(); render(); window.scrollTo(0, 0); }
  // Redraw without losing the reader's place on the page.
  function keepPlace(elementId) {
    const before = document.getElementById(elementId);
    const top = before ? before.getBoundingClientRect().top : 0;
    render();
    const after = document.getElementById(elementId);
    if (after) window.scrollBy(0, after.getBoundingClientRect().top - top);
  }
  function toggleMark(btn) {
    const i = +btn.dataset.mark;
    if (S.marks[i]) delete S.marks[i]; else S.marks[i] = true;
    const on = !!S.marks[i];
    btn.classList.toggle('marked', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    const n = Object.keys(S.marks).length;
    document.getElementById('nr-count').textContent = `${n} of ${errors.length} marked`;
    app.querySelector('[data-act="send"]').disabled = !n;
    save();
  }
  function choose(i, opt) {
    const e = list[i].err;
    S.tried = S.tried || {};
    if (opt === e.answer) { S.picked[i] = opt; announce('Correct. Now rewrite the sentence.'); }
    else {
      S.tried[i] = S.tried[i] || [];
      if (!S.tried[i].includes(opt)) { S.tried[i].push(opt); S.wrong[i] = (S.wrong[i] || 0) + 1; }
      announce('Not that one. Read the feedback and try again.');
    }
    save();
    keepPlace('err-' + i);
    if (opt === e.answer) { const t = document.getElementById('fix-' + i); if (t) t.focus({ preventScroll: true }); }
  }
  function onInput(e) {
    const t = e.target.closest('[data-fix]');
    if (!t) return;
    const i = +t.dataset.fix;
    S.text[i] = t.value;
    save();
    const b = app.querySelector(`[data-compare="${i}"]`);
    if (b) b.disabled = !t.value.trim();
  }
  function onChange(e) {
    const t = e.target.closest('[data-tick]');
    if (!t) return;
    if (t.checked) S.ticks[t.dataset.tick] = true; else delete S.ticks[t.dataset.tick];
    save();
  }
  function toggleBoard() {
    const on = document.body.classList.toggle('nr-on-board');
    if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    app.querySelectorAll('[data-act="board"]').forEach((b) => { b.textContent = on ? 'Leave the board view' : 'Show on the board'; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
