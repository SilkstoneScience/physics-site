// Classroom word games (wordgames.html): Forbidden words, Odd one out and a crossword builder.
// Data: wordgames/terms.json (a term, a clue and four forbidden words) and wordgames/odd-one-out.json.
// Nothing is sent anywhere; the chosen themes are remembered only in this browser.
(function () {
  const app = document.getElementById('wg-app');
  if (!app) return;
  const live = document.getElementById('wg-live');
  const THEMES_KEY = 'wordgames-themes';
  const THEMES = ['A', 'B', 'C', 'D', 'E'];
  const TABS = [
    { id: 'forbidden', label: 'Forbidden words' },
    { id: 'odd', label: 'Odd one out' },
    { id: 'cross', label: 'Crossword' },
  ];
  const MAX_SIZE = 13;

  let terms = [], odd = [];
  let themes = new Set(THEMES);
  let tab = TABS.some((t) => t.id === location.hash.slice(1)) ? location.hash.slice(1) : 'forbidden';

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  function announce(t) { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 50); }
  function typeset() {
    const run = () => window.MathJax && MathJax.typesetPromise && MathJax.typesetPromise([app]).catch(console.error);
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(run);
    else window.addEventListener('load', run, { once: true });
  }
  const inThemes = (x) => themes.has(x.topic[0]);

  async function init() {
    try {
      const [a, b] = await Promise.all(['wordgames/terms.json', 'wordgames/odd-one-out.json'].map(async (f) => {
        const r = await fetch(f, { cache: 'no-cache' });
        if (!r.ok) throw new Error(r.status);
        return r.json();
      }));
      terms = a; odd = b;
    } catch (e) {
      console.error(e);
      app.innerHTML = '<p class="notice">Sorry, the games could not be loaded. (If you opened this page straight from your computer, use the preview server instead.)</p>';
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(THEMES_KEY));
      if (Array.isArray(saved) && saved.some((t) => THEMES.includes(t))) themes = new Set(saved.filter((t) => THEMES.includes(t)));
    } catch (e) { /* storage blocked: fine */ }
    app.innerHTML = `
      <fieldset class="wg-themes"><legend>Use these themes</legend>
        ${THEMES.map((t) => `<label><input type="checkbox" data-theme-pick="${t}"${themes.has(t) ? ' checked' : ''}> ${t}</label>`).join('')}
      </fieldset>
      <div class="my-tabs" role="tablist" aria-label="Game">
        ${TABS.map((t) => `<button type="button" role="tab" id="tab-${t.id}" aria-controls="panel-${t.id}" data-tab="${t.id}">${t.label}</button>`).join('')}
      </div>
      ${TABS.map((t) => `<section class="my-panel" role="tabpanel" id="panel-${t.id}" aria-labelledby="tab-${t.id}" hidden></section>`).join('')}
      <p class="nr-tools"><button type="button" class="button ghost small" id="wg-board">Show on the board</button></p>`;
    app.addEventListener('change', (e) => {
      const t = e.target.closest('[data-theme-pick]');
      if (!t) return;
      if (t.checked) themes.add(t.dataset.themePick); else themes.delete(t.dataset.themePick);
      if (!themes.size) { themes.add(t.dataset.themePick); t.checked = true; announce('At least one theme must stay on.'); return; }
      try { localStorage.setItem(THEMES_KEY, JSON.stringify([...themes])); } catch (err) { /* storage blocked: fine */ }
      stopTimer();
      resetAll();
    });
    app.querySelector('.my-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (b) showTab(b.dataset.tab);
    });
    app.querySelector('.my-tabs').addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const i = TABS.findIndex((t) => t.id === tab);
      const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length].id;
      showTab(next);
      document.getElementById('tab-' + next).focus();
    });
    document.getElementById('wg-board').addEventListener('click', toggleBoard);
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) { document.body.classList.remove('nr-on-board'); boardLabel(); }
    });
    document.getElementById('panel-forbidden').addEventListener('click', onForbidden);
    document.getElementById('panel-odd').addEventListener('click', onOdd);
    const c = document.getElementById('panel-cross');
    c.addEventListener('click', onCross);
    c.addEventListener('input', onCellInput);
    c.addEventListener('keydown', onCellKey);
    resetAll();
    showTab(tab);
  }
  function resetAll() { fbSetup(); oddStart(); crossNew(); }

  function showTab(id) {
    tab = id;
    stopTimer();
    history.replaceState(null, '', '#' + id);
    TABS.forEach((t) => {
      const on = t.id === id;
      const b = document.getElementById('tab-' + t.id);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      document.getElementById('panel-' + t.id).hidden = !on;
    });
    if (id === 'forbidden' && F.playing) fbSetup();
  }
  function toggleBoard() {
    const on = document.body.classList.toggle('nr-on-board');
    if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    boardLabel();
  }
  function boardLabel() { document.getElementById('wg-board').textContent = document.body.classList.contains('nr-on-board') ? 'Leave the board view' : 'Show on the board'; }

  // ----- Forbidden words -----
  const F = { teams: 2, secs: 60, playing: false, deck: [], at: 0, turn: 0, scores: [], left: 0, timer: null, ends: 0 };
  function stopTimer() { if (F.timer) clearInterval(F.timer); F.timer = null; }

  function fbSetup() {
    F.playing = false;
    const n = terms.filter(inThemes).length;
    document.getElementById('panel-forbidden').innerHTML = `
      <h2>Forbidden words</h2>
      <p>One student explains the physics word on the card to their team, <strong>without saying the word or any of the four forbidden words</strong>.</p>
      <details class="my-how"><summary>How to run it in class</summary><ul>
        <li><strong>On the board:</strong> one student from the team sits with their back to the board and guesses, while the rest of the team explains.</li>
        <li><strong>In small groups:</strong> print the cards, cut them up, and let groups take turns with a phone timer.</li>
        <li>A team gets +1 for a correct guess. If a forbidden word is said, the team loses a point. A pass costs nothing but uses up time.</li>
      </ul></details>
      <p class="wg-row">
        <label>Teams <select id="fb-teams">${[1, 2, 3, 4].map((t) => `<option${t === F.teams ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <label>Seconds per turn <select id="fb-secs">${[45, 60, 90].map((t) => `<option${t === F.secs ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
      </p>
      <p class="wg-row">
        <button type="button" class="button" data-fb="start">Start (${n} cards)</button>
        <button type="button" class="button ghost small" data-fb="print">Print the cards</button>
      </p>
      <div class="wg-print-cards">${shuffle(terms.filter(inThemes)).map(cardHtml).join('')}</div>`;
  }
  const cardHtml = (t) => `<div class="wg-card"><p class="wg-term">${esc(t.term)}</p><p class="wg-dont">Don't say:</p><ul>${t.ban.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>`;

  function onForbidden(e) {
    const b = e.target.closest('[data-fb]');
    if (!b) return;
    const a = b.dataset.fb;
    if (a === 'start') {
      F.teams = +document.getElementById('fb-teams').value;
      F.secs = +document.getElementById('fb-secs').value;
      F.deck = shuffle(terms.filter(inThemes));
      F.at = 0; F.turn = 0; F.scores = Array(F.teams).fill(0); F.playing = true;
      fbReady();
    } else if (a === 'print') { document.body.classList.add('wg-print-deck'); window.print(); document.body.classList.remove('wg-print-deck'); }
    else if (a === 'go') fbBegin();
    else if (a === 'got') { F.scores[F.turn]++; fbNext(); }
    else if (a === 'foul') { F.scores[F.turn]--; fbNext(); }
    else if (a === 'pass') fbNext();
    else if (a === 'end') { stopTimer(); fbSetup(); }
  }
  const scoreLine = () => F.scores.map((s, i) => `<span class="wg-score${i === F.turn ? ' on' : ''}">Team ${i + 1}: <strong>${s}</strong></span>`).join('');
  function fbReady() {
    document.getElementById('panel-forbidden').innerHTML = `
      <p class="wg-scores">${scoreLine()}</p>
      <div class="wg-big"><p>Team ${F.turn + 1}, get ready.</p>
        <p class="my-help">${F.deck.length - F.at} cards left. ${F.secs} seconds on the clock.</p>
        <button type="button" class="button" data-fb="go">Start the clock</button>
        <button type="button" class="button ghost small" data-fb="end">End the game</button></div>`;
  }
  function fbBegin() {
    F.ends = Date.now() + F.secs * 1000;
    fbDraw();
    stopTimer();
    F.timer = setInterval(() => {
      const left = Math.ceil((F.ends - Date.now()) / 1000);
      const el = document.getElementById('fb-clock');
      if (el) { el.textContent = Math.max(0, left); el.classList.toggle('low', left <= 10); }
      if (left <= 0) { stopTimer(); fbTurnOver(); }
    }, 200);
  }
  function fbDraw() {
    const t = F.deck[F.at];
    document.getElementById('panel-forbidden').innerHTML = `
      <p class="wg-scores">${scoreLine()} <span id="fb-clock" class="wg-clock" role="timer">${Math.max(0, Math.ceil((F.ends - Date.now()) / 1000))}</span></p>
      ${cardHtml(t).replace('wg-card', 'wg-card play')}
      <p class="wg-row wg-center">
        <button type="button" class="button wg-good" data-fb="got">Got it (+1)</button>
        <button type="button" class="button wg-bad" data-fb="foul">Forbidden word (−1)</button>
        <button type="button" class="button ghost" data-fb="pass">Pass</button>
      </p>`;
  }
  function fbNext() {
    F.at++;
    if (F.at >= F.deck.length) { stopTimer(); fbFinal(); return; }
    fbDraw();
  }
  function fbTurnOver() {
    announce('Time is up.');
    F.at++;
    if (F.at >= F.deck.length) { fbFinal(); return; }
    const finished = F.turn;
    document.getElementById('panel-forbidden').innerHTML = `
      <p class="wg-scores">${scoreLine()}</p>
      <div class="wg-big"><p>Time! Team ${finished + 1} has ${F.scores[finished]} point${F.scores[finished] === 1 ? '' : 's'}.</p>
        <button type="button" class="button" data-fb="nextteam">Next team</button>
        <button type="button" class="button ghost small" data-fb="end">End the game</button></div>`;
    const b = document.querySelector('[data-fb="nextteam"]');
    b.addEventListener('click', () => { F.turn = (F.turn + 1) % F.teams; fbReady(); });
  }
  function fbFinal() {
    const top = Math.max(...F.scores);
    const winners = F.scores.map((s, i) => (s === top ? i + 1 : 0)).filter(Boolean);
    document.getElementById('panel-forbidden').innerHTML = `
      <p class="wg-scores">${scoreLine()}</p>
      <div class="wg-big"><p>Out of cards!</p>
        <p>${F.teams === 1 ? `Final score: ${top}` : winners.length > 1 ? `A draw between teams ${winners.join(' and ')}.` : `Team ${winners[0]} wins.`}</p>
        <button type="button" class="button" data-fb="end">Play again</button></div>`;
  }

  // ----- Odd one out -----
  const O = { deck: [], at: 0, picked: null, shown: false };
  function oddStart() { O.deck = shuffle(odd.filter(inThemes)); O.at = 0; oddReset(); oddDraw(); }
  function oddReset() { O.picked = null; O.shown = false; }
  function oddDraw() {
    const p = document.getElementById('panel-odd');
    if (!O.deck.length) { p.innerHTML = '<p class="notice">No sets for these themes yet.</p>'; return; }
    const q = O.deck[O.at];
    const typed = O.typed || '';
    p.innerHTML = `
      <h2>Odd one out</h2>
      <p class="my-help">Which one doesn't belong, and <strong>why</strong>? There can be more than one good answer: the reason is what counts. Set ${O.at + 1} of ${O.deck.length}. <span class="tag">${q.topic}</span></p>
      <div class="wg-four">${q.items.map((t, i) => {
        const cls = O.shown && i === q.answer ? ' right' : (O.picked === i ? ' picked' : '');
        return `<button type="button" class="wg-item${cls}" data-odd="${i}"${O.shown ? ' disabled' : ''}>${t}</button>`;
      }).join('')}</div>
      <label for="odd-why"><strong>Because…</strong></label>
      <textarea id="odd-why" rows="2">${esc(typed)}</textarea>
      ${O.shown ? `<div class="nr-model"><p><strong>Our answer: ${q.items[q.answer]}.</strong> ${q.reason}</p>
        ${q.also ? `<p><strong>Could you argue another?</strong> ${q.also}</p>` : ''}</div>` : ''}
      <p class="wg-row">
        ${O.shown ? '' : `<button type="button" class="button" data-odd-act="show">Reveal our answer</button>`}
        <button type="button" class="button ghost small" data-odd-act="next">Next set</button>
      </p>`;
    p.querySelector('#odd-why').addEventListener('input', (e) => { O.typed = e.target.value; });
    typeset();
  }
  function onOdd(e) {
    const pick = e.target.closest('[data-odd]');
    if (pick) { O.picked = +pick.dataset.odd; oddDraw(); return; }
    const a = e.target.closest('[data-odd-act]');
    if (!a) return;
    if (a.dataset.oddAct === 'show') { O.shown = true; oddDraw(); }
    else { O.at = (O.at + 1) % O.deck.length; oddReset(); O.typed = ''; oddDraw(); }
  }

  // ----- Crossword -----
  // A word is { a: letters only, clue, term, x, y, dir ('a' or 'd'), n: its clue number }.
  const X = { words: [], cells: new Map(), cols: 0, rows: 0, cur: null, dir: 'a', checked: false };
  const key = (x, y) => x + ',' + y;
  const letters = (t) => t.term.toUpperCase().replace(/[^A-Z]/g, '');
  const enumeration = (term) => {
    const groups = term.split(/([ -])/);
    if (groups.length === 1) return `(${term.length})`;
    return '(' + groups.map((g) => (g === ' ' ? ',' : g === '-' ? '-' : g.length)).join('') + ')';
  };

  // Tries to place every word; returns { placed, grid, x0, y0, x1, y1 } for one attempt.
  function attempt(words) {
    const grid = new Map();
    const placed = [];
    let x0 = 0, y0 = 0, x1 = -1, y1 = -1;
    const within = (a, b, c, d) => Math.max(c, x1) - Math.min(a, x0) + 1 <= MAX_SIZE && Math.max(d, y1) - Math.min(b, y0) + 1 <= MAX_SIZE;
    function fits(w, x, y, dir) {
      const dx = dir === 'a' ? 1 : 0, dy = 1 - dx;
      const ex = x + dx * (w.length - 1), ey = y + dy * (w.length - 1);
      if (placed.length && !within(x, y, ex, ey)) return -1;
      if (grid.has(key(x - dx, y - dy)) || grid.has(key(ex + dx, ey + dy))) return -1;
      let crossings = 0;
      for (let i = 0; i < w.length; i++) {
        const cx = x + dx * i, cy = y + dy * i;
        const here = grid.get(key(cx, cy));
        if (here) {
          if (here !== w[i]) return -1;
          crossings++;
        } else if (grid.has(key(cx + dy, cy + dx)) || grid.has(key(cx - dy, cy - dx))) return -1;
      }
      return crossings;
    }
    function put(t, x, y, dir) {
      const w = letters(t);
      const dx = dir === 'a' ? 1 : 0, dy = 1 - dx;
      for (let i = 0; i < w.length; i++) grid.set(key(x + dx * i, y + dy * i), w[i]);
      x0 = placed.length ? Math.min(x0, x) : x; y0 = placed.length ? Math.min(y0, y) : y;
      x1 = Math.max(x1, x + dx * (w.length - 1)); y1 = Math.max(y1, y + dy * (w.length - 1));
      placed.push({ a: w, clue: t.clue, term: t.term, x, y, dir });
    }
    words.forEach((t) => {
      const w = letters(t);
      if (!placed.length) { put(t, 0, 0, 'a'); return; }
      let best = null;
      placed.forEach((p) => {
        for (let i = 0; i < w.length; i++) {
          for (let j = 0; j < p.a.length; j++) {
            if (w[i] !== p.a[j]) continue;
            const dir = p.dir === 'a' ? 'd' : 'a';
            const x = dir === 'a' ? p.x + (p.dir === 'a' ? j : 0) - i : p.x + (p.dir === 'a' ? j : 0);
            const y = dir === 'd' ? p.y + (p.dir === 'd' ? j : 0) - i : p.y + (p.dir === 'd' ? j : 0);
            const c = fits(w, x, y, dir);
            if (c > 0) {
              const size = Math.max(x1, x + w.length) - Math.min(x0, x) + Math.max(y1, y + w.length) - Math.min(y0, y);
              const score = c * 100 - size + Math.random();
              if (!best || score > best.score) best = { score, x, y, dir };
            }
          }
        }
      });
      if (best) put(t, best.x, best.y, best.dir);
    });
    return { placed, grid, x0, y0, x1, y1 };
  }

  function crossNew() {
    const pool = terms.filter(inThemes).filter((t) => { const n = letters(t).length; return n >= 4 && n <= MAX_SIZE; });
    let best = null;
    for (let i = 0; i < 60; i++) {
      const chosen = shuffle(pool).slice(0, 18).sort((a, b) => letters(b).length - letters(a).length);
      const r = attempt(chosen);
      const area = (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1);
      const score = Math.min(r.placed.length, 14) * 1000 - area;
      if (!best || score > best.score) { best = r; best.score = score; }
    }
    best.placed = best.placed.slice(0, 14);
    const grid = new Map();
    best.placed.forEach((w) => {
      for (let i = 0; i < w.a.length; i++) grid.set(key(w.x + (w.dir === 'a' ? i : 0), w.y + (w.dir === 'd' ? i : 0)), w.a[i]);
    });
    const xs = [...grid.keys()].map((k) => +k.split(',')[0]), ys = [...grid.keys()].map((k) => +k.split(',')[1]);
    const ox = Math.min(...xs), oy = Math.min(...ys);
    X.cols = Math.max(...xs) - ox + 1;
    X.rows = Math.max(...ys) - oy + 1;
    X.cells = new Map();
    grid.forEach((v, k) => { const [x, y] = k.split(',').map(Number); X.cells.set(key(x - ox, y - oy), { a: v, value: '' }); });
    X.words = best.placed.map((w) => ({ ...w, x: w.x - ox, y: w.y - oy }));
    let n = 0;
    const numbers = new Map();
    for (let y = 0; y < X.rows; y++) {
      for (let x = 0; x < X.cols; x++) {
        const starts = X.words.filter((w) => w.x === x && w.y === y);
        if (starts.length) { n++; numbers.set(key(x, y), n); starts.forEach((w) => { w.n = n; }); }
      }
    }
    X.numbers = numbers;
    X.cur = null; X.dir = 'a'; X.checked = false;
    crossDraw();
  }

  function crossDraw() {
    const p = document.getElementById('panel-cross');
    const across = X.words.filter((w) => w.dir === 'a').sort((a, b) => a.n - b.n);
    const down = X.words.filter((w) => w.dir === 'd').sort((a, b) => a.n - b.n);
    let cells = '';
    for (let y = 0; y < X.rows; y++) {
      for (let x = 0; x < X.cols; x++) {
        const c = X.cells.get(key(x, y));
        if (!c) { cells += '<div class="wg-blank"></div>'; continue; }
        const n = X.numbers.get(key(x, y));
        cells += `<div class="wg-cell" data-cell="${key(x, y)}">${n ? `<span class="wg-num">${n}</span>` : ''}<input type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Row ${y + 1}, column ${x + 1}" value="${c.value}"></div>`;
      }
    }
    const clueList = (list) => list.map((w) => `<li><span class="wg-n">${w.n}</span><button type="button" class="wg-clue" data-clue="${w.n}${w.dir}">${esc(w.clue)} ${enumeration(w.term)}</button></li>`).join('');
    p.innerHTML = `
      <h2>Crossword</h2>
      <p class="my-help">A new crossword from your chosen themes each time. Tap a square or a clue, then type. Tap the same square again to switch between across and down.</p>
      <p class="wg-row">
        <button type="button" class="button small" data-x="check">Check</button>
        <button type="button" class="button ghost small" data-x="reveal">Reveal</button>
        <button type="button" class="button ghost small" data-x="new">New crossword</button>
        <button type="button" class="button ghost small" data-x="print">Print it blank</button>
      </p>
      <div class="wg-cross">
        <div class="wg-grid" style="--cols:${X.cols}">${cells}</div>
        <div class="wg-clues">
          <div><h3>Across</h3><ol>${clueList(across)}</ol></div>
          <div><h3>Down</h3><ol>${clueList(down)}</ol></div>
        </div>
      </div>`;
  }
  const wordsAt = (x, y) => X.words.filter((w) => (w.dir === 'a' ? (y === w.y && x >= w.x && x < w.x + w.a.length) : (x === w.x && y >= w.y && y < w.y + w.a.length)));
  const cellEl = (x, y) => document.querySelector(`[data-cell="${key(x, y)}"]`);
  function highlight() {
    document.querySelectorAll('.wg-cell.word, .wg-cell.now, .wg-clue.now').forEach((el) => el.classList.remove('word', 'now'));
    if (!X.cur) return;
    const [x, y] = X.cur;
    const w = wordsAt(x, y).find((v) => v.dir === X.dir);
    if (w) {
      for (let i = 0; i < w.a.length; i++) { const el = cellEl(w.x + (w.dir === 'a' ? i : 0), w.y + (w.dir === 'd' ? i : 0)); if (el) el.classList.add('word'); }
      const clue = document.querySelector(`[data-clue="${w.n}${w.dir}"]`);
      if (clue) clue.classList.add('now');
    }
    const el = cellEl(x, y);
    if (el) el.classList.add('now');
  }
  function focusCell(x, y) {
    const el = cellEl(x, y);
    if (!el) return false;
    X.cur = [x, y];
    const here = wordsAt(x, y);
    if (!here.some((w) => w.dir === X.dir) && here.length) X.dir = here[0].dir;
    highlight();
    const inp = el.querySelector('input');
    inp.focus();
    inp.select();
    return true;
  }
  function step(d) {
    if (!X.cur) return;
    const [x, y] = X.cur;
    focusCell(x + (X.dir === 'a' ? d : 0), y + (X.dir === 'd' ? d : 0));
  }
  function onCross(e) {
    const cell = e.target.closest('[data-cell]');
    if (cell) {
      const [x, y] = cell.dataset.cell.split(',').map(Number);
      if (X.cur && X.cur[0] === x && X.cur[1] === y && wordsAt(x, y).length > 1) X.dir = X.dir === 'a' ? 'd' : 'a';
      focusCell(x, y);
      return;
    }
    const clue = e.target.closest('[data-clue]');
    if (clue) {
      const w = X.words.find((v) => v.n + v.dir === clue.dataset.clue);
      X.dir = w.dir;
      focusCell(w.x, w.y);
      return;
    }
    const act = e.target.closest('[data-x]');
    if (!act) return;
    const a = act.dataset.x;
    if (a === 'new') crossNew();
    else if (a === 'print') { document.body.classList.add('wg-print-blank'); window.print(); document.body.classList.remove('wg-print-blank'); }
    else if (a === 'check') {
      let wrong = 0, gaps = 0;
      X.cells.forEach((c, k) => {
        const el = document.querySelector(`[data-cell="${k}"]`);
        el.classList.remove('ok', 'no');
        if (!c.value) { gaps++; return; }
        const good = c.value === c.a;
        if (!good) wrong++;
        el.classList.add(good ? 'ok' : 'no');
      });
      announce(!wrong && !gaps ? 'Crossword complete.' : `${wrong} wrong, ${gaps} empty.`);
      showResult(!wrong && !gaps ? 'Complete: every square is right.' : `${wrong} square${wrong === 1 ? '' : 's'} wrong, ${gaps} still empty.`);
    } else if (a === 'reveal') {
      if (!confirm('Fill in all of the answers?')) return;
      X.cells.forEach((c) => { c.value = c.a; });
      crossDraw();
    }
  }
  function showResult(text) {
    let el = document.getElementById('wg-x-result');
    if (!el) {
      el = document.createElement('p');
      el.id = 'wg-x-result';
      el.className = 'notice';
      document.querySelector('.wg-cross').before(el);
    }
    el.textContent = text;
  }
  function onCellInput(e) {
    const cell = e.target.closest('[data-cell]');
    if (!cell) return;
    const c = X.cells.get(cell.dataset.cell);
    const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
    e.target.value = v;
    c.value = v;
    cell.classList.remove('ok', 'no');
    if (v) step(1);
  }
  function onCellKey(e) {
    const cell = e.target.closest('[data-cell]');
    if (!cell) return;
    const [x, y] = cell.dataset.cell.split(',').map(Number);
    if (e.key === 'Backspace' && !e.target.value) { e.preventDefault(); step(-1); return; }
    const move = { ArrowRight: [1, 0, 'a'], ArrowLeft: [-1, 0, 'a'], ArrowDown: [0, 1, 'd'], ArrowUp: [0, -1, 'd'] }[e.key];
    if (move) {
      e.preventDefault();
      X.dir = wordsAt(x, y).some((w) => w.dir === move[2]) ? move[2] : X.dir;
      focusCell(x + move[0], y + move[1]);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
