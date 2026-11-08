// Physics escape room (escape.html).
// The locks use the question bank's multiple-choice (Paper 1A) questions for the topics the player chooses,
// so new questions in questions/*.json appear here automatically.
// Each room has 4 locks; each open lock shows a symbol and a digit; the door asks for the digits
// in the order of the symbols on it. Best times are saved only in this browser.
(function () {
  const LOCKS_PER_ROOM = 4;
  const WRONG_PENALTY = 30;   // seconds added for a wrong answer
  const HINT_PENALTY = 60;    // seconds added for a hint (rules out one wrong answer)
  const DOOR_PENALTY = 30;    // seconds added for a wrong door code
  const SECONDS_PER_LOCK = 150; // "Race the clock" allowance
  const LETTERS = ['A', 'B', 'C', 'D'];
  const SETTINGS_KEY = 'escape-settings';
  const BEST_KEY = 'escape-best';

  // Decorative lock symbols (drawn in a 24 × 24 box). The name is read out instead of the picture.
  const SYMBOLS = [
    { name: 'circle', svg: '<circle cx="12" cy="12" r="8"/>' },
    { name: 'triangle', svg: '<path d="M12 3.5L21 20H3Z"/>' },
    { name: 'square', svg: '<rect x="4.5" y="4.5" width="15" height="15"/>' },
    { name: 'star', svg: '<path d="M12 2.8L14.6 9H21.2L15.9 13L17.9 19.6L12 15.6L6.1 19.6L8.1 13L2.8 9H9.4Z"/>' },
  ];
  // Room names and stories, by the theme most of the room's questions come from.
  const ROOMS = {
    A: { name: 'The mechanics workshop', story: 'Trolleys, ramps and a pendulum that never quite stops. The door is held by four locks.' },
    B: { name: 'The thermal lab', story: 'A kettle whistles somewhere. The air smells of hot metal and the door is sealed with four locks.' },
    C: { name: 'The wave tank', story: 'Ripples cross the tank in neat lines. Four locks glow faintly on the door.' },
    D: { name: 'The field station', story: 'Compasses on the bench all point the wrong way. The door has four locks.' },
    E: { name: 'The reactor hall', story: 'A detector clicks at random. Four locks stand between you and the exit.' },
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    setup: $('er-setup'), form: $('er-form'), topicList: $('er-topic-list'), count: $('er-count'), start: $('er-start'),
    game: $('er-game'), time: $('er-time'), open: $('er-open'), pen: $('er-pen'),
    roomH: $('er-room-h'), story: $('er-room-story'), locks: $('er-locks'), puzzle: $('er-puzzle'), door: $('er-door'),
    end: $('er-end'), endH: $('er-end-h'), endBody: $('er-end-body'), live: $('er-live'),
  };
  if (!els.form) return;

  let bank = [];      // usable multiple-choice questions
  let game = null;    // the current game
  let tick = null;    // timer interval

  // ----- Small helpers -----
  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked: fine */ } },
  };
  const allTopics = () => (window.SYLLABUS || []).flatMap((t) => t.topics.map((s) => ({ ...s, theme: t.id })));
  const topicInfo = (id) => allTopics().find((t) => t.id === id) || { id, title: '' };
  const shuffle = (list) => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const clock = (s) => {
    const sign = s < 0 ? '−' : '';
    s = Math.abs(Math.round(s));
    return `${sign}${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const symbolSvg = (sym, cls = '') =>
    `<svg class="er-sym ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${sym.svg}</svg>`;
  function announce(text) { els.live.textContent = ''; setTimeout(() => { els.live.textContent = text; }, 50); }
  function typeset(el) {
    const run = () => window.MathJax && MathJax.typesetPromise && MathJax.typesetPromise([el]).catch(console.error);
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(run);
    else window.addEventListener('load', run, { once: true });
  }
  function typesetClear(el) { if (window.MathJax && MathJax.typesetClear) MathJax.typesetClear([el]); }
  const notesLink = (q) => {
    const sec = Array.isArray(q.sections) && q.sections[0] ? '#' + q.sections[0] : '';
    return `themes/${window.topicFile(q.topic)}${sec}`;
  };

  // ----- Loading the questions -----
  async function getJSON(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    return res.json();
  }
  async function init() {
    try {
      const index = await getJSON('questions/index.json');
      const results = await Promise.allSettled(index.files.map((f) => getJSON('questions/' + f)));
      results.forEach((r) => { if (r.status === 'fulfilled' && Array.isArray(r.value)) bank.push(...r.value); });
    } catch (e) { console.error(e); }
    bank = bank.filter((q) => q && q.paper === '1A' && typeof q.stem === 'string' && Array.isArray(q.options)
      && q.options.length === 4 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4);
    if (!bank.length) {
      els.topicList.innerHTML = `<p class="notice">Sorry, the questions could not be loaded.
        (If you opened this page straight from your computer, use the preview server instead.)</p>`;
      els.start.disabled = true;
      return;
    }
    buildTopicList();
    restoreSettings();
    onFormChange();
    els.form.addEventListener('change', onFormChange);
    els.form.addEventListener('submit', (e) => { e.preventDefault(); startGame(); });
    els.form.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => {
      els.form.querySelectorAll('input[name="topic"]').forEach((cb) => { cb.checked = b.dataset.pick === 'all'; });
      onFormChange();
    }));
    $('er-board').addEventListener('click', toggleBoard);
    $('er-quit').addEventListener('click', () => {
      if (window.confirm('Give up and see the answers you still needed?')) finish(false);
    });
    $('er-again').addEventListener('click', () => startGame());
    $('er-change').addEventListener('click', showSetup);
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) document.body.classList.remove('er-on-board');
      updateBoardButton();
      if (game) placeHud();
    });
  }

  // ----- Set-up form -----
  function buildTopicList() {
    els.topicList.innerHTML = (window.SYLLABUS || []).map((theme) => `
      <div class="er-theme" data-theme="${theme.id}">
        <label class="er-theme-label"><input type="checkbox" data-theme-box="${theme.id}">
          <strong>Theme ${theme.id}</strong> ${theme.title}</label>
        <ul>${theme.topics.map((t) => {
          const n = bank.filter((q) => q.topic === t.id).length;
          return `<li><label><input type="checkbox" name="topic" value="${t.id}"${n ? '' : ' disabled'}>
            ${t.id} ${t.title}${t.hl ? ' <span class="tag hl">HL</span>' : ''}</label></li>`;
        }).join('')}</ul>
      </div>`).join('');
  }
  function readSettings() {
    const f = els.form;
    return {
      topics: [...f.querySelectorAll('input[name="topic"]:checked')].map((cb) => cb.value),
      level: f.querySelector('input[name="level"]:checked').value,
      rooms: Number(f.querySelector('input[name="rooms"]:checked').value),
      clock: f.querySelector('input[name="clock"]:checked').value === '1',
    };
  }
  function restoreSettings() {
    const s = store.get(SETTINGS_KEY);
    if (!s) return;
    const f = els.form;
    (s.topics || []).forEach((id) => { const cb = f.querySelector(`input[name="topic"][value="${id}"]`); if (cb && !cb.disabled) cb.checked = true; });
    const pick = (name, value) => { const r = f.querySelector(`input[name="${name}"][value="${value}"]`); if (r) r.checked = true; };
    pick('level', s.level); pick('rooms', s.rooms); pick('clock', s.clock ? '1' : '0');
  }
  function onFormChange(e) {
    // A theme box ticks or clears all of its topics; topic boxes keep the theme box in step.
    if (e && e.target.dataset.themeBox) {
      e.target.closest('.er-theme').querySelectorAll('input[name="topic"]:not(:disabled)')
        .forEach((cb) => { cb.checked = e.target.checked; });
    }
    els.form.querySelectorAll('.er-theme').forEach((box) => {
      const cbs = [...box.querySelectorAll('input[name="topic"]:not(:disabled)')];
      const on = cbs.filter((cb) => cb.checked).length;
      const tb = box.querySelector('[data-theme-box]');
      tb.checked = on > 0 && on === cbs.length;
      tb.indeterminate = on > 0 && on < cbs.length;
    });
    updateCount();
  }
  function poolFor(s) {
    return bank.filter((q) => s.topics.includes(q.topic) && (s.level === 'HL' || q.level !== 'HL'));
  }
  function updateCount() {
    const s = readSettings();
    const need = s.rooms * LOCKS_PER_ROOM;
    const n = poolFor(s).length;
    let msg;
    if (!s.topics.length) msg = 'Choose at least one topic.';
    else if (!n) msg = 'There are no SL questions in these topics: choose HL, or add more topics.';
    else if (n < need) msg = `Only ${n} question${n === 1 ? '' : 's'} match: choose more topics or a shorter room.`;
    else msg = `${n} questions match. Your room will use ${need} of them, picked at random.`;
    els.count.textContent = msg;
    els.count.classList.toggle('bad', !n || n < need);
    els.start.disabled = !n || n < need;
  }

  // ----- Starting a game -----
  // Picks questions spread evenly over the chosen topics, then groups them into rooms of 4.
  function pickQuestions(pool, count) {
    const byTopic = {};
    shuffle(pool).forEach((q) => { (byTopic[q.topic] = byTopic[q.topic] || []).push(q); });
    const lists = shuffle(Object.values(byTopic));
    const chosen = [];
    while (chosen.length < count && lists.some((l) => l.length)) {
      lists.forEach((l) => { if (l.length && chosen.length < count) chosen.push(l.shift()); });
    }
    // Keep each room's questions close in the syllabus, so rooms feel themed.
    return chosen.sort((a, b) => a.topic.localeCompare(b.topic, 'en', { numeric: true }));
  }
  function startGame() {
    const s = readSettings();
    const pool = poolFor(s);
    const need = s.rooms * LOCKS_PER_ROOM;
    if (pool.length < need) { updateCount(); return; }
    store.set(SETTINGS_KEY, s);
    const qs = pickQuestions(pool, need);
    const rooms = [];
    for (let r = 0; r < s.rooms; r++) {
      const roomQs = shuffle(qs.slice(r * LOCKS_PER_ROOM, (r + 1) * LOCKS_PER_ROOM));
      const symbols = shuffle(SYMBOLS);
      const locks = roomQs.map((q, i) => ({
        q, symbol: symbols[i], digit: Math.floor(Math.random() * 10),
        open: false, wrong: 0, hint: false, out: new Set(),
      }));
      rooms.push({ locks, doorOrder: shuffle(locks.map((_, i) => i)), doorTries: 0, theme: mainTheme(roomQs) });
    }
    game = { settings: s, rooms, room: 0, started: Date.now(), penalty: 0, current: null, done: false,
      limit: s.clock ? need * SECONDS_PER_LOCK : null };
    els.setup.hidden = true;
    els.end.hidden = true;
    els.game.hidden = false;
    clearInterval(tick);
    tick = setInterval(updateHud, 1000);
    placeHud();
    showRoom();
  }
  function mainTheme(qs) {
    const counts = {};
    qs.forEach((q) => { counts[q.theme] = (counts[q.theme] || 0) + 1; });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))[0];
  }
  // The timer bar sticks just below the site's header (which also sticks), whatever its height.
  function placeHud() {
    const header = document.getElementById('site-header');
    const sticky = header && getComputedStyle(header).position === 'sticky';
    els.game.style.setProperty('--er-top', (sticky && !document.body.classList.contains('er-on-board') ? header.offsetHeight : 0) + 'px');
  }
  window.addEventListener('resize', () => { if (game) placeHud(); });
  const elapsed = () => (Date.now() - game.started) / 1000 + game.penalty;
  function updateHud() {
    if (!game) return;
    const all = game.rooms.flatMap((r) => r.locks);
    els.open.textContent = `${all.filter((l) => l.open).length} / ${all.length}`;
    els.pen.textContent = clock(game.penalty);
    if (game.limit) {
      const left = game.limit - elapsed();
      els.time.textContent = left >= 0 ? clock(left) + ' left' : 'Overtime ' + clock(-left);
      els.time.classList.toggle('over', left < 0);
      els.time.classList.toggle('low', left >= 0 && left < 60);
    } else {
      els.time.textContent = clock(elapsed());
    }
  }

  // ----- A room: the grid of locks -----
  function showRoom() {
    const room = game.rooms[game.room];
    const info = ROOMS[room.theme] || ROOMS.A;
    els.roomH.textContent = `Room ${game.room + 1} of ${game.rooms.length}: ${info.name}`;
    els.story.textContent = info.story;
    els.puzzle.hidden = true;
    els.door.hidden = true;
    drawLocks();
    updateHud();
    els.roomH.focus();
  }
  function drawLocks() {
    const room = game.rooms[game.room];
    els.locks.innerHTML = room.locks.map((l, i) => {
      const t = topicInfo(l.q.topic);
      return `<li><button type="button" class="er-lock${l.open ? ' is-open' : ''}${game.current === i ? ' is-current' : ''}"
          data-i="${i}" data-theme="${l.q.theme}"
          aria-label="${l.symbol.name} lock, ${t.id} ${escapeAttr(t.title)}${l.open ? `, open: digit ${l.digit}` : ''}">
        <svg class="er-padlock" viewBox="0 0 48 56" aria-hidden="true" focusable="false">
          <path class="shackle" d="${l.open ? 'M14 26V15A10 10 0 0 1 34 15V9' : 'M14 26V16A10 10 0 0 1 34 16V26'}"/>
          <rect class="body" x="6" y="25" width="36" height="28" rx="5"/>
        </svg>
        ${symbolSvg(l.symbol)}
        <span class="er-lock-digit">${l.open ? l.digit : '?'}</span>
        <span class="er-lock-topic">${t.id}</span>
      </button></li>`;
    }).join('');
    els.locks.querySelectorAll('.er-lock').forEach((b) => b.addEventListener('click', () => openPuzzle(Number(b.dataset.i))));
    if (room.locks.every((l) => l.open)) showDoor();
  }

  // ----- A lock's question -----
  function openPuzzle(i) {
    const lock = game.rooms[game.room].locks[i];
    game.current = i;
    els.locks.querySelectorAll('.er-lock').forEach((b) => b.classList.toggle('is-current', Number(b.dataset.i) === i));
    if (window.setEquationTopic) window.setEquationTopic(lock.q.topic);
    drawPuzzle(lock);
    els.puzzle.hidden = false;
    els.puzzle.scrollIntoView({ behavior: 'smooth', block: 'start' });
    els.puzzle.querySelector('h3').focus({ preventScroll: true });
  }
  function drawPuzzle(lock, justOpened) {
    const q = lock.q;
    const t = topicInfo(q.topic);
    const wrongLeft = [0, 1, 2, 3].filter((k) => k !== q.answer && !lock.out.has(k));
    typesetClear(els.puzzle);
    els.puzzle.innerHTML = `
      <h3 tabindex="-1">${symbolSvg(lock.symbol, 'inline')} The ${lock.symbol.name} lock
        <span class="tag">${t.id} ${t.title}</span>${q.level === 'HL' ? ' <span class="tag hl">HL</span>' : ''}</h3>
      <div class="stem">${q.stem}</div>
      ${q.diagram ? `<figure class="er-fig"><img src="${escapeAttr(q.diagram)}" alt="${escapeAttr(q.diagramAlt || 'Diagram for this question')}"></figure>` : ''}
      <ol class="options">${q.options.map((opt, k) => {
        let cls = '';
        if (lock.open && k === q.answer) cls = 'is-correct';
        else if (lock.out.has(k)) cls = 'is-out';
        const off = lock.open || lock.out.has(k);
        return `<li><button type="button" class="option ${cls}" data-k="${k}"${off ? ' disabled' : ''}>
          <span class="letter">${LETTERS[k]}</span><span>${opt}</span></button></li>`;
      }).join('')}</ol>
      <div class="er-feedback" aria-live="polite"></div>
      <p class="er-puzzle-btns">
        ${lock.open ? '' : `<button type="button" class="button ghost small" data-act="hint"${lock.hint || wrongLeft.length < 2 ? ' disabled' : ''}>
          Hint: rule out a wrong answer (+1:00)</button>`}
        <a class="button ghost small" href="${notesLink(q)}" target="_blank" rel="noopener">Notes for ${t.id} <span class="visually-hidden">(opens in a new tab)</span></a>
        <button type="button" class="button ghost small" data-act="close">Back to the locks</button>
      </p>`;
    const fb = els.puzzle.querySelector('.er-feedback');
    if (lock.open) {
      fb.innerHTML = `<div class="feedback good"><strong>${justOpened ? 'Click! ' : ''}The ${lock.symbol.name} lock is open.
        Its digit is <span class="er-big-digit">${lock.digit}</span></strong>
        ${q.explanation ? `<p>${q.explanation}</p>` : ''}</div>`;
      const next = nextClosed();
      if (next !== null) {
        const nb = document.createElement('button');
        nb.type = 'button'; nb.className = 'button small'; nb.textContent = 'Next lock →';
        nb.addEventListener('click', () => openPuzzle(next));
        els.puzzle.querySelector('.er-puzzle-btns').prepend(nb);
      } else {
        const db = document.createElement('button');
        db.type = 'button'; db.className = 'button small'; db.textContent = 'Go to the door →';
        db.addEventListener('click', () => { els.puzzle.hidden = true; game.current = null; drawLocks(); goToDoor(); });
        els.puzzle.querySelector('.er-puzzle-btns').prepend(db);
      }
    }
    els.puzzle.querySelectorAll('.option:not(:disabled)').forEach((b) => b.addEventListener('click', () => answer(lock, Number(b.dataset.k))));
    const hint = els.puzzle.querySelector('[data-act="hint"]');
    if (hint) hint.addEventListener('click', () => useHint(lock));
    els.puzzle.querySelector('[data-act="close"]').addEventListener('click', closePuzzle);
    typeset(els.puzzle);
  }
  function nextClosed() {
    const locks = game.rooms[game.room].locks;
    for (let k = 1; k <= locks.length; k++) {
      const j = (game.current + k) % locks.length;
      if (!locks[j].open) return j;
    }
    return null;
  }
  function closePuzzle() {
    const i = game.current;
    els.puzzle.hidden = true;
    game.current = null;
    drawLocks();
    const b = els.locks.querySelector(`.er-lock[data-i="${i}"]`);
    if (b) b.focus();
  }
  function answer(lock, k) {
    if (k === lock.q.answer) {
      lock.open = true;
      drawLocks();
      drawPuzzle(lock, true);
      updateHud();
      announce(`Correct. The ${lock.symbol.name} lock is open. Its digit is ${lock.digit}.`);
      els.puzzle.querySelector('.er-feedback').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      lock.wrong++;
      lock.out.add(k);
      game.penalty += WRONG_PENALTY;
      updateHud();
      drawPuzzle(lock);
      const fb = els.puzzle.querySelector('.er-feedback');
      fb.innerHTML = `<div class="feedback bad"><strong>The lock jams! ${LETTERS[k]} is not right.</strong> 30 seconds added. Try again.</div>`;
      els.puzzle.classList.remove('shake'); void els.puzzle.offsetWidth; els.puzzle.classList.add('shake');
      const first = els.puzzle.querySelector('.option:not(:disabled)');
      if (first) first.focus({ preventScroll: true });
    }
  }
  function useHint(lock) {
    const wrongLeft = [0, 1, 2, 3].filter((k) => k !== lock.q.answer && !lock.out.has(k));
    if (lock.hint || wrongLeft.length < 2) return;
    lock.hint = true;
    const k = wrongLeft[Math.floor(Math.random() * wrongLeft.length)];
    lock.out.add(k);
    game.penalty += HINT_PENALTY;
    updateHud();
    drawPuzzle(lock);
    els.puzzle.querySelector('.er-feedback').innerHTML =
      `<div class="feedback"><strong>Hint:</strong> ${LETTERS[k]} is wrong, so it has been crossed out. One minute added.</div>`;
    const first = els.puzzle.querySelector('.option:not(:disabled)');
    if (first) first.focus({ preventScroll: true });
  }

  // ----- The door: digits in the order of its symbols -----
  function goToDoor() {
    els.door.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const first = els.door.querySelector('input');
    if (first) first.focus({ preventScroll: true });
  }
  function showDoor() {
    const room = game.rooms[game.room];
    if (!els.door.hidden && els.door.dataset.room === String(game.room)) return;
    els.door.dataset.room = String(game.room);
    const last = game.room === game.rooms.length - 1;
    els.door.innerHTML = `
      <h3>${last ? 'The exit door' : 'The door to the next room'}</h3>
      <p>The keypad shows four symbols. Key in each lock's digit under its symbol.</p>
      <form class="er-keypad" novalidate>
        ${room.doorOrder.map((li, n) => {
          const l = room.locks[li];
          return `<label class="er-key">${symbolSvg(l.symbol)}
            <span class="visually-hidden">Digit ${n + 1}: the ${l.symbol.name} lock's digit</span>
            <input type="text" inputmode="numeric" autocomplete="off" data-n="${n}"></label>`;
        }).join('')}
        <button type="submit" class="button">Open the door</button>
      </form>
      <div class="er-door-fb" aria-live="polite"></div>`;
    els.door.hidden = false;
    const inputs = [...els.door.querySelectorAll('input')];
    inputs.forEach((inp, n) => {
      // One digit per box; typing moves on to the next box, and a pasted code fills the boxes in turn.
      inp.addEventListener('input', () => {
        const digits = inp.value.replace(/\D/g, '');
        inp.value = digits.slice(0, 1);
        let k = n;
        for (const d of digits.slice(1)) { if (!inputs[k + 1]) break; inputs[++k].value = d; }
        if (digits && inputs[k + 1]) inputs[k + 1].focus();
        else if (digits) inputs[k].focus();
      });
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !inp.value && inputs[n - 1]) inputs[n - 1].focus();
      });
    });
    els.door.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); tryDoor(inputs); });
    announce('All four locks are open. Go to the door and key in the code.');
  }
  function tryDoor(inputs) {
    const room = game.rooms[game.room];
    const fb = els.door.querySelector('.er-door-fb');
    if (inputs.some((inp) => !/^\d$/.test(inp.value))) {
      fb.innerHTML = '<p class="feedback bad">Key in one digit under every symbol.</p>';
      return;
    }
    const ok = room.doorOrder.every((li, n) => Number(inputs[n].value) === room.locks[li].digit);
    if (!ok) {
      room.doorTries++;
      game.penalty += DOOR_PENALTY;
      updateHud();
      fb.innerHTML = '<p class="feedback bad"><strong>Buzz! Wrong code.</strong> 30 seconds added. Check which digit belongs to which symbol.</p>';
      els.door.classList.remove('shake'); void els.door.offsetWidth; els.door.classList.add('shake');
      return;
    }
    if (game.room < game.rooms.length - 1) {
      game.room++;
      game.current = null;
      els.door.hidden = true;
      announce('The door opens. On to the next room.');
      showRoom();
      window.scrollTo({ top: els.game.offsetTop - 10, behavior: 'smooth' });
    } else {
      finish(true);
    }
  }

  // ----- The end -----
  function finish(escaped) {
    clearInterval(tick);
    const total = elapsed();
    game.done = true;
    const all = game.rooms.flatMap((r) => r.locks);
    const opened = all.filter((l) => l.open);
    const firstTry = opened.filter((l) => !l.wrong && !l.hint).length;
    const hints = all.filter((l) => l.hint).length;
    const wrong = all.reduce((n, l) => n + l.wrong, 0);
    const s = game.settings;
    const key = `${s.topics.slice().sort().join(',')}|${s.level}|${s.rooms}`;
    const best = store.get(BEST_KEY) || {};
    let bestLine = '';
    if (escaped) {
      if (!best[key] || total < best[key]) {
        bestLine = best[key] ? `<p><strong>New best time</strong> for these settings (was ${clock(best[key])}).</p>` : '';
        best[key] = Math.round(total);
        store.set(BEST_KEY, best);
      } else {
        bestLine = `<p>Your best time with these settings is ${clock(best[key])}.</p>`;
      }
    }
    const inTime = game.limit ? (total <= game.limit ? ' inside the time limit' : `, ${clock(total - game.limit)} over the time limit`) : '';
    els.endH.textContent = escaped ? 'You escaped!' : 'Still locked in';
    els.endBody.innerHTML = `
      ${escaped ? `<p class="er-final">Escape time <strong>${clock(total)}</strong>${inTime}.</p>` : `<p class="er-final">You opened ${opened.length} of ${all.length} locks.</p>`}
      <p>That includes ${clock(game.penalty)} of penalties: ${wrong} wrong answer${wrong === 1 ? '' : 's'}, ${hints} hint${hints === 1 ? '' : 's'}${game.rooms.some((r) => r.doorTries) ? ' and some wrong door codes' : ''}.
        You opened ${firstTry} lock${firstTry === 1 ? '' : 's'} first time without a hint.</p>
      ${bestLine}
      <h3>Review the questions</h3>
      <p>Revise the topics of the locks you found hard, then try the question again in the question bank.</p>
      <div class="table-wrap"><table class="er-review">
        <thead><tr><th scope="col">Lock</th><th scope="col">Topic</th><th scope="col">How it went</th><th scope="col">Revise</th></tr></thead>
        <tbody>${all.map((l) => {
          const t = topicInfo(l.q.topic);
          const how = !l.open ? '<span class="er-res bad">Not opened</span>'
            : l.wrong || l.hint ? `<span class="er-res mid">Opened after ${[l.wrong ? `${l.wrong} wrong` : '', l.hint ? 'a hint' : ''].filter(Boolean).join(' and ')}</span>`
              : '<span class="er-res good">First time</span>';
          return `<tr><td>${symbolSvg(l.symbol, 'inline')} <span class="visually-hidden">${l.symbol.name}</span></td>
            <td>${t.id} ${t.title}</td><td>${how}</td>
            <td><a href="${notesLink(l.q)}">Notes</a> · <a href="questions.html?topic=${encodeURIComponent(l.q.topic)}&amp;q=${encodeURIComponent(l.q.id)}">Question</a></td></tr>`;
        }).join('')}</tbody></table></div>`;
    els.game.hidden = true;
    els.end.hidden = false;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    document.body.classList.remove('er-on-board');
    els.endH.focus();
    window.scrollTo({ top: els.end.offsetTop - 10 });
  }
  function showSetup() {
    els.end.hidden = true;
    els.game.hidden = true;
    els.setup.hidden = false;
    els.setup.querySelector('h2').scrollIntoView({ block: 'start' });
  }

  // ----- Board mode: full screen, large text -----
  function toggleBoard() {
    const on = !document.body.classList.contains('er-on-board');
    document.body.classList.toggle('er-on-board', on);
    if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    updateBoardButton();
    placeHud();
  }
  function updateBoardButton() {
    $('er-board').textContent = document.body.classList.contains('er-on-board') ? 'Leave the board view' : 'Show on the board';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
