// Physics mysteries (mystery.html?case=meteorite).
// Each case is one data file, mysteries/<case>.json: the story, suspects, evidence, clues (each a typed
// calculation marked by js/numeric.js, then a "what does this prove?" choice and a written note),
// interviews and the accusation. The plan and decisions are in docs/MYSTERY_PLAN.md.
// Progress is saved only in this browser.
(function () {
  const app = document.getElementById('my-app');
  if (!app) return;
  const live = document.getElementById('my-live');
  const caseId = (new URLSearchParams(location.search).get('case') || 'meteorite').replace(/[^a-z0-9-]/g, '');
  const KEY = 'mystery-' + caseId;
  const TABS = [
    { id: 'case', label: 'Case file' },
    { id: 'suspects', label: 'Suspects' },
    { id: 'clues', label: 'Clues' },
    { id: 'notebook', label: 'Notebook' },
    { id: 'accuse', label: 'Accuse' },
  ];
  const RANKS = [[90, 'Chief Inspector'], [75, 'Inspector'], [55, 'Sergeant'], [0, 'Constable']];

  let C = null;        // the case data
  let S = null;        // the player's progress
  const svgs = {};     // diagram file -> svg text

  // ----- Helpers -----
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const LETTERS = ['A', 'B', 'C', 'D'];
  function announce(t) { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 50); }
  function typeset(el) {
    const run = () => window.MathJax && MathJax.typesetPromise && MathJax.typesetPromise([el]).catch(console.error);
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(run);
    else window.addEventListener('load', run, { once: true });
  }
  function typesetClear(el) { if (window.MathJax && MathJax.typesetClear) MathJax.typesetClear([el]); }
  const topicTitle = (id) => {
    const t = (window.SYLLABUS || []).flatMap((th) => th.topics).find((x) => x.id === id);
    return t ? t.title : '';
  };
  const notesHref = (clue) => `themes/${window.topicFile(clue.topic)}${clue.section ? '#' + clue.section : ''}`;
  const suspect = (id) => C.suspects.find((s) => s.id === id);
  const clueState = (id) => (S.clues[id] = S.clues[id] || { wrong: 0, hint: false, working: false, numDone: false, tried: [], proveDone: false, note: '', compared: false });
  const solved = () => C.clues.filter((c) => clueState(c.id).proveDone).length;

  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* storage blocked */ }
    S = s && typeof s === 'object' ? s : {};
    S.tab = S.tab || 'case';
    S.pins = S.pins || {};
    S.clues = S.clues || {};
    S.asked = S.asked || {};
    S.seen = S.seen || {};
    S.acc = S.acc || { tries: 0, done: false, suspect: '', cards: [], text: '', ticks: [] };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked: fine */ } }

  // ----- Loading the case -----
  async function init() {
    try {
      const res = await fetch(`mysteries/${caseId}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      C = await res.json();
      const files = [...new Set([...C.evidence.filter((e) => e.figure && e.figure.svg).map((e) => e.figure.svg), ...(C.scene ? [C.scene.svg] : [])])];
      await Promise.all(files.map(async (f) => {
        const r = await fetch('mysteries/' + f);
        svgs[f] = r.ok ? await r.text() : '';
      }));
    } catch (e) {
      console.error(e);
      app.innerHTML = `<p class="notice">Sorry, this case could not be loaded. (If you opened this page straight from your computer, use the preview server instead.)</p>`;
      return;
    }
    load();
    document.getElementById('my-title').textContent = C.title;
    document.title = `IB Physics mystery: ${C.title} · Mr Silkstone's Physics`;
    build();
  }

  // ----- The page frame: introduction, progress bar and tabs -----
  function build() {
    app.innerHTML = `
      <div class="my-intro">${C.intro}</div>
      <p class="my-meta">${C.topics.map((t) => `<span class="tag">${t} ${topicTitle(t)}</span>`).join(' ')}
        <span class="tag">${C.level}</span> <span class="tag">${C.time}</span></p>
      <details class="my-how"><summary>How to play</summary><ul>
        <li><strong>Case file:</strong> the evidence. <strong>Suspects:</strong> their statements. Tap any sentence that makes a claim you could test with physics, to pin it in your notebook.</li>
        <li><strong>Clues:</strong> each clue tests one claim. Calculate, decide what it proves, then write a short detective's note and compare it with ours.</li>
        <li>Solving a clue lets you <strong>interview</strong> a suspect. When all the clues are solved, make your <strong>accusation</strong> and write it up.</li>
        <li>Hints and "show me the working" are there if you're stuck, but they lower your detective rank. The <strong>Σ Equations</strong> button is free.</li>
        <li>Your progress is saved only in this browser.</li>
      </ul></details>
      <div class="my-bar">
        <span id="my-progress"></span>
        <span class="my-bar-btns">
          <button type="button" class="button ghost small" data-act="board">Show on the board</button>
          <button type="button" class="button ghost small" data-act="print">Print the case file</button>
          <button type="button" class="button ghost small" data-act="restart">Start again</button>
        </span>
      </div>
      <div class="my-tabs" role="tablist" aria-label="Case">
        ${TABS.map((t) => `<button type="button" role="tab" id="tab-${t.id}" aria-controls="panel-${t.id}" data-tab="${t.id}">${t.label}</button>`).join('')}
      </div>
      ${TABS.map((t) => `<section class="my-panel" role="tabpanel" id="panel-${t.id}" aria-labelledby="tab-${t.id}" hidden></section>`).join('')}`;
    app.addEventListener('click', onClick);
    app.addEventListener('change', onChange);
    app.addEventListener('input', onInput);
    app.addEventListener('focusin', (e) => {
      const card = e.target.closest('.my-clue');
      if (card && window.setEquationTopic) window.setEquationTopic(card.dataset.topic);
    });
    app.querySelector('.my-tabs').addEventListener('keydown', onTabKey);
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) document.body.classList.remove('my-on-board');
      updateBoardButton();
    });
    // Printing (the button or the browser's own Print) opens every piece of evidence, then closes them again.
    window.addEventListener('beforeprint', () => {
      app.querySelectorAll('.my-ev').forEach((d) => { d.dataset.wasOpen = d.open ? '1' : ''; d.open = true; });
    });
    window.addEventListener('afterprint', () => {
      app.querySelectorAll('.my-ev').forEach((d) => { d.open = !!d.dataset.wasOpen; });
    });
    TABS.forEach((t) => render(t.id));
    showTab(S.tab, false);
    updateProgress();
  }

  function showTab(id, focus = true) {
    S.tab = id;
    save();
    TABS.forEach((t) => {
      const on = t.id === id;
      const btn = document.getElementById('tab-' + t.id);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
      document.getElementById('panel-' + t.id).hidden = !on;
    });
    if (focus) document.getElementById('tab-' + id).focus();
  }
  function onTabKey(e) {
    const i = TABS.findIndex((t) => t.id === S.tab);
    let j = null;
    if (e.key === 'ArrowRight') j = (i + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = TABS.length - 1;
    if (j === null) return;
    e.preventDefault();
    showTab(TABS[j].id);
  }
  // Scroll so the element's top sits just below the sticky site header,
  // whose height changes with the screen width.
  function scrollToTop(el) {
    const hdr = document.getElementById('site-header');
    const gap = (hdr ? hdr.getBoundingClientRect().height : 0) + 12;
    window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - gap, behavior: 'smooth' });
  }
  function goTo(tab, selector) {
    showTab(tab, false);
    const el = selector ? app.querySelector(selector) : document.getElementById('tab-' + tab);
    if (el) {
      if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) el.tabIndex = -1;
      scrollToTop(el);
      el.focus({ preventScroll: true });
    }
  }

  function updateProgress() {
    const hints = C.clues.filter((c) => clueState(c.id).hint || clueState(c.id).working).length;
    document.getElementById('my-progress').innerHTML =
      `<strong>Clues solved: ${solved()} of ${C.clues.length}</strong> <span class="my-dot">·</span> Hints used: ${hints}`;
    const acc = document.getElementById('tab-accuse');
    acc.classList.toggle('ready', solved() === C.clues.length && !S.acc.done);
  }

  function render(id) {
    const panel = document.getElementById('panel-' + id);
    typesetClear(panel);
    panel.innerHTML = ({ case: caseHtml, suspects: suspectsHtml, clues: cluesHtml, notebook: notebookHtml, accuse: accuseHtml })[id]();
    typeset(panel);
  }
  function rerender(...ids) { ids.forEach(render); updateProgress(); save(); }

  // ----- Evidence -----
  function figureHtml(f) {
    if (!f) return '';
    const svg = (svgs[f.svg] || '').replace('<svg ', `<svg role="img" aria-label="${esc(f.alt)}" `);
    return `<figure class="diagram">${svg}${f.caption ? `<figcaption>${f.caption}</figcaption>` : ''}</figure>`;
  }
  function evidenceHtml(ev, open) {
    return `<details class="my-ev" data-ev="${ev.id}"${open ? ' open' : ''}><summary>${ev.title}</summary>
      <div class="my-ev-body">${ev.html}${figureHtml(ev.figure)}</div></details>`;
  }
  // An optional crime-scene picture: numbered markers that open pieces of evidence (the case's "scene").
  function sceneHtml() {
    const sc = C.scene;
    if (!sc) return '';
    const svg = (svgs[sc.svg] || '').replace('<svg ', `<svg role="img" aria-label="${esc(sc.alt)}" `);
    const spots = sc.spots.map((s, i) => {
      const ev = C.evidence.find((x) => x.id === s.ev);
      return `<button type="button" class="my-spot${S.seen[s.ev] ? ' seen' : ''}" style="left:${s.x}%;top:${s.y}%" data-act="spot" data-spot="${s.ev}"
        aria-label="Evidence ${i + 1}: ${esc(ev.title)}">${i + 1}</button>`;
    }).join('');
    return `<figure class="diagram my-scene"><div class="my-scene-pic">${svg}${spots}</div><figcaption>${sc.caption}</figcaption></figure>`;
  }
  function caseHtml() {
    return `<h2>Case file</h2>
      ${sceneHtml()}
      <p>Everything the police collected. Open each item to read it.</p>
      ${C.evidence.map((ev, i) => evidenceHtml(ev, i === 0 && !C.scene)).join('')}
      <p class="my-next"><button type="button" class="button small" data-go="suspects">Read the statements →</button></p>`;
  }

  // ----- Suspects: statements (tap a sentence to pin it) and interviews -----
  function suspectsHtml() {
    return `<h2>Suspects</h2>
      <p>Tap any sentence that makes a claim you could test with physics. It is pinned to your notebook. Tap again to unpin it.</p>
      ${C.suspects.map((s) => {
        const iv = (C.interviews || []).find((x) => x.suspect === s.id);
        const pins = S.pins[s.id] || [];
        let interview = '';
        if (iv) {
          const clue = C.clues.find((c) => c.id === iv.after);
          if (!clueState(iv.after).proveDone) {
            interview = `<p class="my-locked">Solve clue ${clue.number} (${clue.title}) to interview ${s.name}.</p>`;
          } else {
            interview = `<div class="my-interview"><h4>Interview</h4><p class="my-help">Choose a question to ask.</p>
              ${iv.questions.map((q, i) => {
                const k = `${s.id}-${i}`;
                return S.asked[k]
                  ? `<div class="my-qa" data-k="${k}"><p class="my-q">${q.q}</p><p class="my-a">“${q.a}”</p></div>`
                  : `<p><button type="button" class="link-btn" data-act="ask" data-k="${k}">${q.q}</button></p>`;
              }).join('')}</div>`;
          }
        }
        return `<article class="my-suspect" id="suspect-${s.id}">
          <h3>${s.name} <span class="my-role">${s.role}</span></h3>
          <p class="my-statement">${s.statement.map((t, i) => `<button type="button" class="my-sent${pins.includes(i) ? ' pinned' : ''}"
            aria-pressed="${pins.includes(i)}" data-act="pin" data-s="${s.id}" data-i="${i}">${t}</button>`).join(' ')}</p>
          ${interview}
        </article>`;
      }).join('')}
      <p class="my-next"><button type="button" class="button small" data-go="clues">Go to the clues →</button></p>`;
  }

  // ----- Clues -----
  function cluesHtml() {
    return `<h2>Clues</h2><p>Solve them in any order. Each one tests a claim from the statements.</p>
      ${C.clues.map(clueHtml).join('')}`;
  }
  function clueHtml(c) {
    const st = clueState(c.id);
    const n = c.numeric;
    const unit = n.unit ? (n.unit.includes('$') ? n.unit : esc(n.unit)) : '';
    let calc;
    if (!st.numDone) {
      calc = `<form class="my-calc" data-clue="${c.id}" novalidate>
          <label for="ans-${c.id}">Your answer</label>
          <span class="my-calc-row"><input id="ans-${c.id}" type="text" inputmode="decimal" autocomplete="off">
            <span class="my-unit">${unit}</span>
            <button type="submit" class="button small">Check</button></span>
        </form>
        <div class="my-fb" id="fb-${c.id}" aria-live="polite"></div>
        ${st.hint ? `<p class="hint"><strong>Hint:</strong> ${c.hint}</p>` : ''}
        <p class="my-help-btns">
          ${st.hint ? '' : `<button type="button" class="link-btn" data-act="hint" data-clue="${c.id}">Show a hint</button> · `}
          <button type="button" class="link-btn" data-act="working" data-clue="${c.id}">Show me the working</button></p>`;
    } else {
      calc = `<div class="feedback ${st.working ? '' : 'good'}"><strong>${st.working ? 'The working' : 'Correct!'}</strong>${c.working}</div>`;
    }
    let prove = '';
    if (st.numDone) {
      const p = c.prove;
      prove = `<div class="my-prove"><h4>${p.question}</h4><ol class="options">${p.options.map((o, i) => {
        const wrongTried = st.tried.includes(i);
        const cls = st.proveDone && i === p.answer ? 'is-correct' : wrongTried ? 'is-wrong' : '';
        return `<li><button type="button" class="option ${cls}" data-act="prove" data-clue="${c.id}" data-i="${i}"
          ${st.proveDone || wrongTried ? 'disabled' : ''}><span class="letter">${LETTERS[i]}</span><span>${o}</span></button>
          ${wrongTried && p.feedback && p.feedback[i] ? `<p class="my-why">${p.feedback[i]}</p>` : ''}</li>`;
      }).join('')}</ol></div>`;
    }
    let note = '';
    if (st.proveDone) {
      const next = C.clues.find((x) => !clueState(x.id).proveDone);
      note = `<div class="my-note">
          <label for="note-${c.id}"><strong>Detective's note.</strong> ${c.notePrompt}</label>
          <textarea id="note-${c.id}" rows="3" data-note="${c.id}">${esc(st.note)}</textarea>
          ${st.compared
    ? `<div class="my-model"><strong>Our note:</strong> ${c.modelNote}</div>`
    : `<p><button type="button" class="button ghost small" data-act="compare" data-clue="${c.id}">Compare with our note</button></p>`}
          <p class="my-next">${next
    ? `<button type="button" class="button small" data-act="toclue" data-clue="${next.id}">Next: clue ${next.number} →</button>`
    : '<button type="button" class="button small" data-go="accuse">All clues solved: make your accusation →</button>'}</p>
        </div>`;
    }
    return `<article class="my-clue${st.proveDone ? ' solved' : ''}" id="clue-${c.id}" data-topic="${c.topic}" tabindex="-1">
        <h3>Clue ${c.number}: ${c.title}${st.proveDone ? ' <span class="my-solved">✓ Solved</span>' : ''}</h3>
        <p class="my-meta"><a class="tag" href="${notesHref(c)}" target="_blank" rel="noopener">${c.topic} ${topicTitle(c.topic)}<span class="visually-hidden"> (notes, opens in a new tab)</span></a></p>
        <div class="my-clue-ev"><p class="my-help">Evidence for this clue:</p>${c.evidence.map((id) => evidenceHtml(C.evidence.find((e) => e.id === id), false)).join('')}</div>
        <div class="my-task">${c.task}</div>
        ${calc}${prove}${note}
      </article>`;
  }
  function redrawClue(c, focusSel) {
    const old = document.getElementById('clue-' + c.id);
    typesetClear(old);
    const openEv = [...old.querySelectorAll('.my-ev[open]')].map((d) => d.dataset.ev);
    old.outerHTML = clueHtml(c);
    const card = document.getElementById('clue-' + c.id);
    openEv.forEach((id) => { const d = card.querySelector(`.my-ev[data-ev="${id}"]`); if (d) d.open = true; });
    typeset(card);
    updateProgress();
    save();
    if (focusSel) { const f = card.querySelector(focusSel); if (f) f.focus(); }
    return card;
  }
  function checkAnswer(c, text) {
    const st = clueState(c.id);
    const fb = document.getElementById('fb-' + c.id);
    const r = window.Numeric.checkNumeric(c.numeric, text);
    if (r.status === 'unreadable') {
      fb.innerHTML = '<p class="feedback bad">Type a number, for example 12.5 or 3.2e4 (the unit is already there).</p>';
      return;
    }
    if (r.status === 'wrong') {
      st.wrong++;
      save();
      const m = r.mistake !== null ? c.numeric.mistakes[r.mistake].feedback : 'Not quite. Check your working and try again.';
      fb.innerHTML = `<p class="feedback bad"><strong>Not quite.</strong> ${m}</p>`;
      typeset(fb);
      return;
    }
    st.numDone = true;
    const card = redrawClue(c, '.my-prove .option');
    announce('Correct. Now decide what this proves.');
    card.querySelector('.my-prove').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ----- Notebook -----
  function notebookHtml() {
    const pinned = C.suspects.filter((s) => (S.pins[s.id] || []).length);
    const notes = C.clues.filter((c) => clueState(c.id).proveDone);
    const asked = (C.interviews || []).flatMap((iv) => iv.questions.map((q, i) => ({ iv, q, k: `${iv.suspect}-${i}` }))).filter((x) => S.asked[x.k]);
    return `<h2>Detective's notebook</h2>
      <h3>Claims you pinned</h3>
      ${pinned.length ? pinned.map((s) => `<p><strong>${s.name}:</strong></p><ul>${(S.pins[s.id] || []).slice().sort((a, b) => a - b).map((i) => `<li>“${s.statement[i]}”</li>`).join('')}</ul>`).join('')
    : '<p class="my-empty">None yet. On the Suspects tab, tap a sentence that makes a claim you could test.</p>'}
      <h3>Your clue notes</h3>
      ${notes.length ? notes.map((c) => {
        const st = clueState(c.id);
        return `<div class="my-nb-note"><p><strong>Clue ${c.number}: ${c.title}</strong></p>
          <p>${st.note.trim() ? esc(st.note).replace(/\n/g, '<br>') : '<em>No note written yet.</em>'}</p>
          ${st.compared ? `<p class="my-model"><strong>Our note:</strong> ${c.modelNote}</p>` : ''}</div>`;
      }).join('') : '<p class="my-empty">Solve a clue to add your first note.</p>'}
      <h3>Interviews</h3>
      ${asked.length ? asked.map((x) => `<div class="my-qa"><p class="my-q"><strong>${suspect(x.iv.suspect).name}:</strong> ${x.q.q}</p><p class="my-a">“${x.q.a}”</p></div>`).join('')
    : '<p class="my-empty">Solving clues lets you interview the suspects.</p>'}`;
  }

  // ----- Accusation -----
  function cardOrder() {
    const n = C.accusation.cards.length;
    if (!Array.isArray(S.acc.order) || S.acc.order.length !== n) {
      const a = [...Array(n).keys()];
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      S.acc.order = a;
    }
    return S.acc.order;
  }
  function score() {
    let pts = 100;
    for (const c of C.clues) {
      const st = clueState(c.id);
      if (st.hint) pts -= 8;
      if (st.working) pts -= 15;
      pts -= 3 * Math.min(st.wrong, 4);
      pts -= 5 * st.tried.length;
    }
    pts -= 15 * S.acc.tries;
    return Math.max(0, pts);
  }
  function accuseHtml() {
    const A = C.accusation;
    const left = C.clues.filter((c) => !clueState(c.id).proveDone);
    if (left.length) {
      return `<h2>Make your accusation</h2>
        <p class="notice">Solve every clue first. Still to do: ${left.map((c) => `<button type="button" class="link-btn" data-act="toclue" data-clue="${c.id}">clue ${c.number} (${c.title})</button>`).join(', ')}.</p>`;
    }
    if (!S.acc.done) {
      const order = cardOrder();
      return `<h2>Make your accusation</h2>
        <form class="my-accuse" novalidate>
          <fieldset><legend>1. Who is the thief?</legend>
            ${C.suspects.map((s) => `<label class="my-choice"><input type="radio" name="who" value="${s.id}"${S.acc.suspect === s.id ? ' checked' : ''}> ${s.name} <span class="my-role">${s.role}</span></label>`).join('')}
          </fieldset>
          <fieldset><legend>2. Which evidence proves it?</legend>
            <p class="my-help">Tick the evidence that really proves your case. Not every card does.</p>
            ${order.map((i) => `<label class="my-choice"><input type="checkbox" name="card" value="${i}"${S.acc.cards.includes(i) ? ' checked' : ''}> ${A.cards[i].text}</label>`).join('')}
          </fieldset>
          <fieldset><legend>3. Write your accusation</legend>
            <p class="my-help">In 4–6 sentences: who did it, and how the physics proves it. Use your notebook.
              <button type="button" class="link-btn" data-act="frame">Add the writing frame</button></p>
            <label for="acc-text" class="visually-hidden">Your accusation</label>
            <textarea id="acc-text" rows="7" data-acc-text>${esc(S.acc.text)}</textarea>
          </fieldset>
          <div class="my-fb" id="fb-accuse" aria-live="polite"></div>
          <p><button type="submit" class="button">Make the accusation</button></p>
        </form>`;
    }
    const pts = score();
    const rank = RANKS.find(([min]) => pts >= min)[1];
    const tested = C.suspects.reduce((n, s) => n + (s.claims || []).length, 0);
    const found = C.suspects.reduce((n, s) => n + (s.claims || []).filter((i) => (S.pins[s.id] || []).includes(i)).length, 0);
    const label = { key: 'Key evidence', support: 'Supporting', no: 'Red herring' };
    return `<h2>Case closed!</h2>
      <p class="my-rank">Your detective rank: <strong>${rank}</strong></p>
      <p>${S.acc.tries ? `You named the thief after ${S.acc.tries} wrong accusation${S.acc.tries === 1 ? '' : 's'}. ` : 'You named the thief first time. '}
        You pinned ${found} of the ${tested} claims the clues tested.</p>
      <p class="my-help">Your rank starts at 100 points: hints, "show me the working", wrong answers and wrong accusations take points off.
        Chief Inspector 90+, Inspector 75+, Sergeant 55+.</p>
      <h3>Your accusation</h3>
      <blockquote class="my-quote">${S.acc.text.trim() ? esc(S.acc.text).replace(/\n/g, '<br>') : '<em>(nothing written)</em>'}</blockquote>
      <h3>The evidence</h3>
      <ul class="my-cards">${A.cards.map((card, i) => {
        const chosen = S.acc.cards.includes(i);
        return `<li class="use-${card.use}"><span class="my-card-tag">${label[card.use]}</span>${chosen ? ' <span class="my-chosen">You chose this</span>' : ''}<br>${card.text} <span class="my-why">${card.why}</span></li>`;
      }).join('')}</ul>
      <h3>Our accusation</h3>
      <div class="my-model">${A.model}</div>
      ${A.solution ? `<h3>What really happened</h3>${A.solution}` : ''}
      <h3>Check your accusation</h3>
      <p class="my-help">Tick each point your accusation makes, as an examiner would.</p>
      ${A.checklist.map((t, i) => `<label class="my-choice"><input type="checkbox" data-tick="${i}"${S.acc.ticks.includes(i) ? ' checked' : ''}> ${t}</label>`).join('')}
      <p class="my-ticks" id="my-ticks">${S.acc.ticks.length} of ${A.checklist.length} points.</p>
      <p><a class="button ghost small" href="games.html">More review games</a>
        <button type="button" class="button ghost small" data-act="restart">Play this case again</button></p>`;
  }
  function submitAccusation(form) {
    const fb = document.getElementById('fb-accuse');
    const who = (form.querySelector('input[name="who"]:checked') || {}).value;
    const cards = [...form.querySelectorAll('input[name="card"]:checked')].map((x) => Number(x.value));
    const text = form.querySelector('[data-acc-text]').value;
    S.acc.suspect = who || ''; S.acc.cards = cards; S.acc.text = text;
    save();
    if (!who) { fb.innerHTML = '<p class="feedback bad">Choose who you are accusing.</p>'; return; }
    if (!cards.length) { fb.innerHTML = '<p class="feedback bad">Tick at least one piece of evidence.</p>'; return; }
    if (text.trim().split(/\s+/).length < 25) { fb.innerHTML = '<p class="feedback bad">Write your accusation first: a few sentences, linking the evidence to the physics.</p>'; return; }
    if (who !== C.accusation.culprit) {
      S.acc.tries++;
      save();
      fb.innerHTML = `<div class="feedback bad"><strong>${suspect(who).name} has an alibi that stands up.</strong> <p>${C.accusation.wrong[who]}</p><p>Think again: who is left?</p></div>`;
      typeset(fb);
      announce('Wrong suspect. Think again.');
      return;
    }
    S.acc.done = true;
    rerender('accuse');
    const h = document.querySelector('#panel-accuse h2');
    h.tabIndex = -1; h.focus({ preventScroll: true }); scrollToTop(h);
    announce('Case closed!');
  }

  // ----- Events -----
  function onClick(e) {
    const go = e.target.closest('[data-go]');
    if (go) { goTo(go.dataset.go, `#panel-${go.dataset.go} h2`); return; }
    const tab = e.target.closest('[data-tab]');
    if (tab) { showTab(tab.dataset.tab); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    const c = b.dataset.clue ? C.clues.find((x) => x.id === b.dataset.clue) : null;
    if (act === 'pin') {
      const list = S.pins[b.dataset.s] = S.pins[b.dataset.s] || [];
      const i = Number(b.dataset.i);
      const k = list.indexOf(i);
      if (k >= 0) list.splice(k, 1); else list.push(i);
      b.classList.toggle('pinned', k < 0);
      b.setAttribute('aria-pressed', String(k < 0));
      save();
      render('notebook');
    } else if (act === 'ask') {
      S.asked[b.dataset.k] = true;
      rerender('suspects', 'notebook');
      // Keep keyboard users in place: focus the answer that just appeared.
      const k = b.dataset.k;
      const qa = document.querySelector(`#panel-suspects .my-qa[data-k="${k}"]`);
      if (qa) { qa.tabIndex = -1; qa.focus(); }
    } else if (act === 'hint') {
      clueState(c.id).hint = true;
      redrawClue(c, '.hint');
    } else if (act === 'working') {
      if (!window.confirm('Show the working? You\'ll still need to decide what it proves, but it lowers your detective rank.')) return;
      const st = clueState(c.id);
      st.working = true; st.numDone = true;
      redrawClue(c, '.my-prove .option');
    } else if (act === 'prove') {
      const st = clueState(c.id);
      const i = Number(b.dataset.i);
      if (i === c.prove.answer) {
        st.proveDone = true;
        redrawClue(c, `#note-${c.id}`);
        rerender('suspects', 'notebook', 'accuse');
        const iv = (C.interviews || []).find((x) => x.after === c.id);
        announce(`Clue solved.${iv ? ` You can now interview ${suspect(iv.suspect).name}.` : ''}`);
      } else {
        if (!st.tried.includes(i)) st.tried.push(i);
        redrawClue(c, '.my-prove .option:not(:disabled)');
      }
    } else if (act === 'compare') {
      clueState(c.id).compared = true;
      redrawClue(c, '.my-model');
      render('notebook');
    } else if (act === 'toclue') {
      goTo('clues', `#clue-${c.id}`);
    } else if (act === 'frame') {
      const ta = app.querySelector('[data-acc-text]');
      ta.value = (ta.value.trim() ? ta.value.replace(/\s*$/, '\n\n') : '') + C.accusation.frame;
      S.acc.text = ta.value; save();
      ta.focus();
    } else if (act === 'spot') {
      S.seen[b.dataset.spot] = true;
      save();
      b.classList.add('seen');
      const item = app.querySelector(`#panel-case .my-ev[data-ev="${b.dataset.spot}"]`);
      item.open = true;
      scrollToTop(item);
      item.querySelector('summary').focus({ preventScroll: true });
    } else if (act === 'board') {
      toggleBoard();
    } else if (act === 'print') {
      window.print();
    } else if (act === 'restart') {
      if (!window.confirm('Start this case again? Your notes, pins and answers will be cleared.')) return;
      try { localStorage.removeItem(KEY); } catch (err) { /* fine */ }
      load();
      TABS.forEach((t) => render(t.id));
      showTab('case', false);
      updateProgress();
      window.scrollTo({ top: 0 });
    }
  }
  function onChange(e) {
    const t = e.target;
    if (t.dataset.tick !== undefined) {
      const i = Number(t.dataset.tick);
      S.acc.ticks = S.acc.ticks.filter((x) => x !== i);
      if (t.checked) S.acc.ticks.push(i);
      save();
      document.getElementById('my-ticks').textContent = `${S.acc.ticks.length} of ${C.accusation.checklist.length} points.`;
    } else if (t.name === 'who') { S.acc.suspect = t.value; save(); }
    else if (t.name === 'card') {
      const i = Number(t.value);
      S.acc.cards = S.acc.cards.filter((x) => x !== i);
      if (t.checked) S.acc.cards.push(i);
      save();
    }
  }
  function onInput(e) {
    const t = e.target;
    if (t.dataset.note) { clueState(t.dataset.note).note = t.value; save(); }
    else if (t.dataset.accText !== undefined) { S.acc.text = t.value; save(); }
  }
  app.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.classList.contains('my-calc')) {
      const c = C.clues.find((x) => x.id === f.dataset.clue);
      checkAnswer(c, f.querySelector('input').value);
    } else if (f.classList.contains('my-accuse')) submitAccusation(f);
  });
  // Notes are saved as they're typed; redraw the notebook when the student leaves the box.
  app.addEventListener('focusout', (e) => { if (e.target.dataset && e.target.dataset.note) render('notebook'); });

  // ----- Board view -----
  function toggleBoard() {
    const on = !document.body.classList.contains('my-on-board');
    document.body.classList.toggle('my-on-board', on);
    if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    updateBoardButton();
  }
  function updateBoardButton() {
    const b = app.querySelector('[data-act="board"]');
    if (b) b.textContent = document.body.classList.contains('my-on-board') ? 'Leave the board view' : 'Show on the board';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
