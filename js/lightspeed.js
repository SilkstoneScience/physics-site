// Lightspeed (lightspeed.html): ten quick-fire questions, 15 seconds each, with a speed bonus, a streak multiplier,
// medals and a shared leaderboard. Questions are in lightspeed/a.json … e.json (ids like LS-A1-01, permanent).
// The leaderboard is a Google Sheet behind a Google Apps Script web app (tools/lightspeed/leaderboard.gs; setup in
// docs/LIGHTSPEED_SETUP.md). Put the web app's address in LEADERBOARD_URL below. While it is empty, the game still
// works and keeps each player's best scores in their own browser only.
(function () {
  const LEADERBOARD_URL = 'https://script.google.com/macros/s/AKfycbxloCpx0C5eKLZy3xyXqTXAqggqg4PPKXMgsa5bFnvk0eW6dH75VvE7StSCe5tKMxSvSQ/exec';

  const app = document.getElementById('ls-app');
  if (!app) return;
  const live = document.getElementById('ls-live');

  const ROUND = 10;               // questions per round
  const SECONDS = 15;             // time per question
  const MAX_SCORE = 3400;         // the most a round can score (must match the Apps Script)
  const MEDALS = [                // highest first
    { name: 'Gold', min: 2600, cls: 'gold' },
    { name: 'Silver', min: 1800, cls: 'silver' },
    { name: 'Bronze', min: 1000, cls: 'bronze' },
  ];
  const THEMES = [
    { id: 'A', title: 'Space, time and motion' },
    { id: 'B', title: 'The particulate nature of matter' },
    { id: 'C', title: 'Wave behaviour' },
    { id: 'D', title: 'Fields' },
    { id: 'E', title: 'Nuclear and quantum physics' },
    { id: 'ALL', title: 'Everything (all themes)' },
  ];
  const KEY = { name: 'lightspeed-name', theme: 'lightspeed-theme', sl: 'lightspeed-sl', seen: 'lightspeed-seen', best: 'lightspeed-best' };

  const bank = {};                // theme letter -> questions
  let state = null;               // the round being played
  let setup = { theme: load(KEY.theme) || 'A', sl: load(KEY.sl) === '1', name: load(KEY.name) || '' };
  let board = { range: 'week', rows: null, error: '', loadingFor: '' };
  let timer = null;
  let starting = false;

  // ---------- helpers ----------
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked: fine */ } }
  function loadJSON(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function announce(t) { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 50); }
  function typeset(el) {
    if (!window.MathJax || !MathJax.typesetPromise) return Promise.resolve();
    return (MathJax.startup && MathJax.startup.promise ? MathJax.startup.promise : Promise.resolve())
      .then(() => MathJax.typesetPromise([el])).catch(console.error);
  }
  const themeTitle = (id) => (THEMES.find((t) => t.id === id) || THEMES[0]).title;
  const medalFor = (score) => MEDALS.find((m) => score >= m.min) || null;
  function cleanName(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  function nameProblem(s) {
    if (s.length < 2) return 'Type a name of at least 2 characters.';
    if (s.length > 20) return 'Keep your name to 20 characters or fewer.';
    if (!/^[\p{L}\p{N} .'-]+$/u.test(s)) return 'Use only letters, numbers, spaces, full stops, hyphens and apostrophes.';
    return '';
  }

  async function getTheme(id) {
    if (bank[id]) return bank[id];
    const res = await fetch(`lightspeed/${id.toLowerCase()}.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${id}: ${res.status}`);
    bank[id] = await res.json();
    return bank[id];
  }
  async function pool(theme, slOnly) {
    const ids = theme === 'ALL' ? ['A', 'B', 'C', 'D', 'E'] : [theme];
    const all = (await Promise.all(ids.map(getTheme))).flat();
    return slOnly ? all.filter((q) => q.level !== 'HL') : all;
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // Picks ROUND questions, preferring ones this browser hasn't seen lately, spread across the topics.
  function pick(list) {
    const seen = new Set(loadJSON(KEY.seen, []));
    const fresh = shuffle(list.filter((q) => !seen.has(q.id)));
    const old = shuffle(list.filter((q) => seen.has(q.id)));
    const byTopic = {};
    for (const q of fresh.concat(old)) (byTopic[q.topic] = byTopic[q.topic] || []).push(q);
    // Round-robin over the topics, taking unseen questions first within each topic.
    const topics = shuffle(Object.keys(byTopic));
    const out = [];
    while (out.length < ROUND && topics.some((t) => byTopic[t].length)) {
      for (const t of topics) if (byTopic[t].length && out.length < ROUND) out.push(byTopic[t].shift());
    }
    const next = [...seen, ...out.map((q) => q.id)];
    save(KEY.seen, JSON.stringify(next.slice(-Math.max(ROUND, list.length - ROUND))));
    return shuffle(out);
  }

  // ---------- start screen ----------
  function renderStart() {
    stopTimer();
    state = null;
    const best = loadJSON(KEY.best, {});
    app.innerHTML = `
      <section class="ls-setup">
        <div class="ls-field">
          <label for="ls-name">Your name for the leaderboard</label>
          <input id="ls-name" type="text" maxlength="20" autocomplete="off" spellcheck="false" value="${esc(setup.name)}" placeholder="e.g. Sam K">
          <p class="ls-help">Shown publicly on this site. Use your first name and an initial, or a nickname, never your full name.</p>
          <p class="ls-error" id="ls-name-error" role="alert"></p>
        </div>
        <fieldset class="ls-field">
          <legend>Theme</legend>
          <div class="ls-themes">
            ${THEMES.map((t) => `<button type="button" class="ls-theme${t.id === setup.theme ? ' on' : ''}" data-theme="${t.id}" aria-pressed="${t.id === setup.theme}">
              <span class="ls-theme-id">${t.id === 'ALL' ? 'A–E' : t.id}</span><span class="ls-theme-name">${esc(t.title)}</span>
              ${best[t.id] ? `<span class="ls-theme-best">Your best: ${best[t.id]}</span>` : ''}</button>`).join('')}
          </div>
        </fieldset>
        <label class="ls-check"><input type="checkbox" id="ls-sl"${setup.sl ? ' checked' : ''}> SL questions only (leave unticked if you take HL)</label>
        <p><button type="button" class="button" data-act="start" id="ls-start">Start: 10 questions</button></p>
        <details class="ls-how"><summary>How scoring works</summary>
          <ul>
            <li>A right answer scores 100 points, plus up to 100 more for speed: the faster you answer, the bigger the bonus.</li>
            <li>Three right answers in a row multiply your points by 1.5. Five in a row multiply them by 2. A wrong answer, or running out of time, resets the streak.</li>
            <li>Medals: Bronze from 1000 points, Silver from 1800, Gold from 2600. The most you can score is ${MAX_SCORE}.</li>
            <li>Keys: press 1–4 to choose an answer, or type a number and press Enter. Press Enter for the next question.</li>
          </ul>
        </details>
      </section>
      ${boardHtml()}`;
    loadBoard(setup.theme);
  }

  // ---------- leaderboard ----------
  function boardHtml() {
    const t = setup.theme;
    let body;
    if (!LEADERBOARD_URL) body = `<p class="ls-help">The class leaderboard isn't switched on yet. Your best score for each theme is saved in this browser.</p>`;
    else if (board.error) body = `<p class="ls-help">${esc(board.error)}</p>`;
    else if (!board.rows) body = `<p class="ls-help">Loading the leaderboard…</p>`;
    else if (!board.rows.length) body = `<p class="ls-help">No scores yet${board.range === 'week' ? ' this week' : ''}. Be the first!</p>`;
    else {
      const me = cleanName(setup.name).toLowerCase();
      body = `<ol class="ls-board">${board.rows.map((r, i) => {
        const m = medalFor(r.score);
        return `<li class="${r.name.toLowerCase() === me ? 'me' : ''}"><span class="ls-rank">${i + 1}</span>
          <span class="ls-who">${esc(r.name)}</span>
          ${m ? `<span class="ls-medal ${m.cls}" title="${m.name} medal">${m.name}</span>` : '<span></span>'}
          <span class="ls-pts">${r.score}</span></li>`;
      }).join('')}</ol>`;
    }
    return `<section class="ls-board-wrap" aria-labelledby="ls-board-h">
      <div class="ls-board-head">
        <h2 id="ls-board-h">Leaderboard: ${t === 'ALL' ? 'all themes' : 'Theme ' + t}</h2>
        ${LEADERBOARD_URL ? `<div class="ls-range" role="group" aria-label="Time period">
          <button type="button" data-range="week" aria-pressed="${board.range === 'week'}">This week</button>
          <button type="button" data-range="all" aria-pressed="${board.range === 'all'}">All time</button></div>` : ''}
      </div>${body}</section>`;
  }
  function redrawBoard() {
    const el = app.querySelector('.ls-board-wrap');
    if (el) el.outerHTML = boardHtml();
  }
  async function loadBoard(theme) {
    if (!LEADERBOARD_URL) return;
    const want = theme + '|' + board.range;
    board.loadingFor = want; board.rows = null; board.error = '';
    redrawBoard();
    try {
      const res = await fetch(`${LEADERBOARD_URL}?board=${encodeURIComponent(theme)}&range=${board.range}`);
      const data = await res.json();
      if (board.loadingFor !== want) return;
      if (!data.ok) throw new Error(data.error || 'error');
      board.rows = data.rows;
    } catch (e) {
      if (board.loadingFor !== want) return;
      console.error(e);
      board.error = 'The leaderboard could not be loaded just now. Your scores are still saved in this browser.';
    }
    redrawBoard();
  }
  async function submitScore(entry) {
    if (!LEADERBOARD_URL) return { ok: false, off: true };
    try {
      // text/plain keeps this a "simple" request, so Google's server needs no extra permission check first.
      const res = await fetch(LEADERBOARD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(entry) });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Your score could not be sent (check your internet connection).' };
    }
  }

  // ---------- playing ----------
  async function start() {
    const name = cleanName(app.querySelector('#ls-name').value);
    const problem = nameProblem(name);
    if (problem) { app.querySelector('#ls-name-error').textContent = problem; app.querySelector('#ls-name').focus(); return; }
    setup.name = name; save(KEY.name, name);
    setup.sl = app.querySelector('#ls-sl').checked; save(KEY.sl, setup.sl ? '1' : '0');
    let list;
    try { list = await pool(setup.theme, setup.sl); } catch (e) {
      console.error(e);
      app.innerHTML = '<p class="notice">Sorry, the questions could not be loaded. (If you opened this page straight from your computer, use the preview server instead.)</p>';
      return;
    }
    if (list.length < ROUND) { app.querySelector('#ls-name-error').textContent = 'There aren\'t enough questions for that choice yet. Try another theme.'; return; }
    state = { theme: setup.theme, qs: pick(list), at: 0, score: 0, streak: 0, bestStreak: 0, correct: 0, log: [] };
    ask();
  }

  function multiplier(streak) { return streak >= 5 ? 2 : streak >= 3 ? 1.5 : 1; }

  function ask() {
    const q = state.qs[state.at];
    state.answered = false;
    state.ready = false;
    app.innerHTML = `
      <section class="ls-play">
        <div class="ls-hud">
          <span>Question <strong>${state.at + 1}</strong> of ${state.qs.length}</span>
          <span class="ls-streak${state.streak >= 3 ? ' hot' : ''}">Streak ${state.streak}${multiplier(state.streak + 1) > 1 ? ` · next one ×${multiplier(state.streak + 1)}` : ''}</span>
          <span>Score <strong class="ls-score">${state.score}</strong></span>
        </div>
        <div class="ls-timer" role="timer" aria-label="Time left"><div class="ls-timer-fill"></div><span class="ls-timer-text">${SECONDS}</span></div>
        <div class="ls-q">
          <p class="ls-topic"><span class="tag">${esc(q.topic)}</span>${q.level === 'HL' ? ' <span class="tag hl">HL</span>' : ''}</p>
          <p class="ls-stem">${q.q}</p>
          ${q.type === 'number' ? `
            <form class="ls-num" autocomplete="off">
              <label for="ls-ans" class="visually-hidden">Your answer</label>
              <input id="ls-ans" type="text" inputmode="decimal" placeholder="Type a number">
              ${q.numeric.unit ? `<span class="ls-unit">${q.numeric.unit}</span>` : ''}
              <button type="submit" class="button">Answer</button>
            </form><p class="ls-error" id="ls-num-error" role="alert"></p>` : `
            <div class="ls-options">${q.options.map((o, i) => `<button type="button" class="ls-opt" data-opt="${i}"><span class="ls-key">${i + 1}</span><span>${o}</span></button>`).join('')}</div>`}
        </div>
        <div class="ls-after" id="ls-after"></div>
      </section>`;
    const stage = app.querySelector('.ls-play');
    stage.style.visibility = 'hidden';
    // Start the clock only once the maths is drawn, so nobody loses time to MathJax.
    typeset(stage).then(() => {
      if (!state || state.qs[state.at] !== q) return;
      stage.style.visibility = '';
      state.ready = true;
      const inp = app.querySelector('#ls-ans');
      if (inp) inp.focus(); else app.querySelector('.ls-opt').focus();
      startTimer();
    });
  }

  function startTimer() {
    stopTimer();
    const t0 = performance.now();
    state.t0 = t0;
    const fill = app.querySelector('.ls-timer-fill');
    const text = app.querySelector('.ls-timer-text');
    const tick = () => {
      if (!state || state.answered) return;
      const left = Math.max(0, SECONDS - (performance.now() - t0) / 1000);
      fill.style.width = (100 * left / SECONDS) + '%';
      fill.classList.toggle('low', left <= 5);
      text.textContent = Math.ceil(left);
      if (left <= 0) { finishQuestion(null); return; }
      timer = requestAnimationFrame(tick);
    };
    timer = requestAnimationFrame(tick);
  }
  function stopTimer() { if (timer) cancelAnimationFrame(timer); timer = null; }

  // given: option index, the typed text, or null when time ran out.
  function finishQuestion(given) {
    if (state.answered || !state.ready) return;
    const q = state.qs[state.at];
    let right = false;
    // The clock is checked here too: animation frames pause in a hidden tab, so a late answer counts as out of time.
    if (given !== null && (performance.now() - state.t0) / 1000 >= SECONDS) given = null;
    if (given !== null) {
      if (q.type === 'number') {
        const r = window.Numeric.checkNumeric(q.numeric, given);
        if (r.status === 'unreadable') { app.querySelector('#ls-num-error').textContent = 'Type a number, e.g. 2.5 or 3e8.'; return; }
        right = r.status === 'right';
      } else right = given === q.answer;
    }
    state.answered = true;
    stopTimer();
    const left = given === null ? 0 : Math.max(0, SECONDS - (performance.now() - state.t0) / 1000);
    let gained = 0;
    if (right) {
      state.streak += 1; state.correct += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      gained = Math.round((100 + Math.round(100 * left / SECONDS)) * multiplier(state.streak));
      state.score += gained;
    } else state.streak = 0;
    state.log.push({ q, given, right, gained });

    // Show the result on the question itself.
    if (q.type === 'number') {
      const inp = app.querySelector('#ls-ans'); inp.disabled = true;
      app.querySelectorAll('.ls-num button').forEach((b) => { b.disabled = true; });
      inp.classList.add(right ? 'right' : 'wrong');
    } else {
      app.querySelectorAll('.ls-opt').forEach((b) => {
        const i = Number(b.dataset.opt);
        b.disabled = true;
        if (i === q.answer) b.classList.add('right');
        else if (i === given) b.classList.add('wrong');
      });
    }
    app.querySelector('.ls-score').textContent = state.score;
    const answerText = q.type === 'number' ? `${fmt(q.numeric.answer)}${q.numeric.unit ? ' ' + q.numeric.unit : ''}` : q.options[q.answer];
    const head = right ? `<strong>Right! +${gained}</strong>${multiplier(state.streak) > 1 ? ` <span class="ls-mult">streak ×${multiplier(state.streak)}</span>` : ''}`
      : given === null ? `<strong>Out of time.</strong> The answer is ${answerText}.` : `<strong>Not quite.</strong> The answer is ${answerText}.`;
    const after = app.querySelector('#ls-after');
    after.className = 'ls-after ' + (right ? 'good' : 'bad');
    after.innerHTML = `<p>${head}</p><p class="ls-why">${q.why}</p>
      <p><button type="button" class="button" data-act="next" id="ls-next">${state.at + 1 < state.qs.length ? 'Next question' : 'See my score'}</button></p>`;
    typeset(after);
    announce(right ? `Right, plus ${gained} points.` : `Wrong. The answer is ${answerText.replace(/\$/g, '')}.`);
    app.querySelector('#ls-next').focus();
  }
  function fmt(x) {
    if (x !== 0 && (Math.abs(x) >= 1e5 || Math.abs(x) < 1e-3)) {
      const [m, e] = x.toExponential(2).split('e');
      return `${Number(m)} × 10<sup>${Number(e)}</sup>`;
    }
    return String(Number(x.toPrecision(3)));
  }

  function next() {
    state.at += 1;
    if (state.at < state.qs.length) ask(); else end();
  }

  // ---------- end of round ----------
  async function end() {
    const s = state;
    const medal = medalFor(s.score);
    const best = loadJSON(KEY.best, {});
    const newBest = !best[s.theme] || s.score > best[s.theme];
    if (newBest) { best[s.theme] = s.score; save(KEY.best, JSON.stringify(best)); }
    app.innerHTML = `
      <section class="ls-end">
        <div class="ls-result">
          ${medal ? `<div class="ls-big-medal ${medal.cls}" aria-hidden="true">${medal.name[0]}</div>` : ''}
          <div>
            <h2>${medal ? `${medal.name} medal!` : 'Round complete'}</h2>
            <p class="ls-final"><strong>${s.score}</strong> points · ${s.correct} of ${s.qs.length} right · best streak ${s.bestStreak}</p>
            <p>${newBest ? 'A new personal best for this theme.' : `Your best for this theme is ${best[s.theme]}.`}
              ${!medal ? `Score ${MEDALS[MEDALS.length - 1].min} for a Bronze medal.` : medal.cls !== 'gold' ? `${MEDALS[MEDALS.indexOf(medal) - 1].min - s.score} more points for ${MEDALS[MEDALS.indexOf(medal) - 1].name}.` : ''}</p>
            <p class="ls-help" id="ls-sent">${LEADERBOARD_URL ? 'Sending your score to the leaderboard…' : ''}</p>
          </div>
        </div>
        <p class="ls-actions"><button type="button" class="button" data-act="again" id="ls-again">Play again</button>
          <button type="button" class="button ghost" data-act="menu">Change theme</button></p>
        <h2>Your answers</h2>
        <ol class="ls-review">${s.log.map((l) => {
          const q = l.q;
          const yours = l.given === null ? 'no answer (time ran out)' : q.type === 'number' ? esc(l.given) : q.options[l.given];
          const ans = q.type === 'number' ? `${fmt(q.numeric.answer)}${q.numeric.unit ? ' ' + q.numeric.unit : ''}` : q.options[q.answer];
          return `<li class="${l.right ? 'good' : 'bad'}"><p class="ls-stem-small">${q.q} <span class="tag">${esc(q.topic)}</span></p>
            <p>${l.right ? `✓ ${ans} <span class="ls-help">+${l.gained}</span>` : `✗ You said ${yours}. Answer: ${ans}`}</p>
            ${l.right ? '' : `<p class="ls-why">${q.why}</p>`}</li>`;
        }).join('')}</ol>
      </section>
      ${boardHtml()}`;
    typeset(app);
    announce(`Round complete. ${s.score} points.${medal ? ' ' + medal.name + ' medal.' : ''}`);
    app.querySelector('#ls-again').focus();
    if (LEADERBOARD_URL) {
      const r = await submitScore({ name: setup.name, board: s.theme, score: s.score, correct: s.correct });
      const el = app.querySelector('#ls-sent');
      if (el) el.textContent = r.ok ? 'Your score is on the leaderboard.' : (r.error || 'Your score could not be sent.');
      loadBoard(s.theme);
    }
  }

  // ---------- events ----------
  app.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.theme) {
      setup.theme = b.dataset.theme; save(KEY.theme, setup.theme);
      app.querySelectorAll('.ls-theme').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      loadBoard(setup.theme);
    } else if (b.dataset.range) {
      board.range = b.dataset.range;
      loadBoard(state ? state.theme : setup.theme);
    } else if (b.dataset.opt !== undefined && state && !state.answered) finishQuestion(Number(b.dataset.opt));
    else if (b.dataset.act === 'start' && !starting) { starting = true; start().finally(() => { starting = false; }); }
    else if (b.dataset.act === 'next') next();
    else if (b.dataset.act === 'again') { setup.theme = state.theme; startAgain(); }
    else if (b.dataset.act === 'menu') renderStart();
  });
  async function startAgain() {
    const list = await pool(setup.theme, setup.sl);
    state = { theme: setup.theme, qs: pick(list), at: 0, score: 0, streak: 0, bestStreak: 0, correct: 0, log: [] };
    ask();
  }
  app.addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.classList.contains('ls-num') && state && !state.answered) finishQuestion(app.querySelector('#ls-ans').value);
  });
  app.addEventListener('input', (e) => {
    if (e.target.id === 'ls-name') app.querySelector('#ls-name-error').textContent = '';
    if (e.target.id === 'ls-ans') app.querySelector('#ls-num-error').textContent = '';
  });
  app.addEventListener('keydown', (e) => {
    if (e.target.id === 'ls-name' && e.key === 'Enter') { e.preventDefault(); start(); }
  });
  document.addEventListener('keydown', (e) => {
    if (!state || e.ctrlKey || e.metaKey || e.altKey) return;
    const q = state.qs[state.at];
    if (!state.answered && q.type === 'choice' && /^[1-4]$/.test(e.key)) { e.preventDefault(); finishQuestion(Number(e.key) - 1); }
  });

  renderStart();
})();
