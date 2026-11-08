// Explanation builder (explain.html, or explain.html?topic=A.2).
// Items are in explain/items.json. Each has "pieces" (with a "step": pieces with the same step can go in either
// order) and "decoys" (vague or wrong sentences, each with a "why"). Finished items are saved only in this browser.
(function () {
  const app = document.getElementById('ex-app');
  if (!app) return;
  const live = document.getElementById('ex-live');
  const DONE = 'explain-done';
  const params = new URLSearchParams(location.search);

  let items = [];       // every item
  let shown = [];       // the items in the chosen topic
  let at = 0;           // position in "shown"
  let bank = [];        // the current item's pieces, shuffled: { key, t, step } or { key, t, why }
  let answer = [];      // keys, in the student's order
  let checked = null;   // the result of the last check, or null
  let tries = 0;
  let solved = false;
  let filter = params.get('topic') || 'all';

  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  function announce(t) { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 50); }
  function typeset() {
    const run = () => window.MathJax && MathJax.typesetPromise && MathJax.typesetPromise([app]).catch(console.error);
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(run);
    else window.addEventListener('load', run, { once: true });
  }
  function readDone() { try { return JSON.parse(localStorage.getItem(DONE)) || {}; } catch (e) { return {}; } }
  function markDone(id) { const d = readDone(); d[id] = true; try { localStorage.setItem(DONE, JSON.stringify(d)); } catch (e) { /* storage blocked: fine */ } }
  const topicTitle = (t) => {
    const x = (window.SYLLABUS || []).flatMap((th) => th.topics).find((y) => y.id === t);
    return x ? x.title : '';
  };

  async function init() {
    try {
      const res = await fetch('explain/items.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      items = await res.json();
    } catch (e) {
      console.error(e);
      app.innerHTML = '<p class="notice">Sorry, the puzzles could not be loaded. (If you opened this page straight from your computer, use the preview server instead.)</p>';
      return;
    }
    if (filter !== 'all' && !items.some((q) => q.topic === filter)) filter = 'all';
    app.addEventListener('click', onClick);
    app.addEventListener('change', (e) => { if (e.target.id === 'ex-topic') { filter = e.target.value; choose(0); } });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) document.body.classList.remove('nr-on-board'); });
    choose(0);
  }

  function choose(i) {
    shown = filter === 'all' ? items : items.filter((q) => q.topic === filter);
    at = Math.max(0, Math.min(i, shown.length - 1));
    const q = shown[at];
    bank = shuffle([
      ...q.pieces.map((p, n) => ({ key: 'p' + n, t: p.t, step: p.step })),
      ...q.decoys.map((d, n) => ({ key: 'd' + n, t: d.t, why: d.why })),
    ]);
    answer = []; checked = null; tries = 0; solved = false;
    render();
  }
  const piece = (key) => bank.find((b) => b.key === key);

  function render() {
    const q = shown[at];
    const done = readDone();
    const topics = [...new Set(items.map((x) => x.topic))];
    const free = bank.filter((b) => !answer.includes(b.key));
    app.innerHTML = `
      <div class="ex-head">
        <label for="ex-topic">Topic</label>
        <select id="ex-topic">
          <option value="all"${filter === 'all' ? ' selected' : ''}>All topics (${items.length})</option>
          ${topics.map((t) => `<option value="${t}"${filter === t ? ' selected' : ''}>${t} ${topicTitle(t)}</option>`).join('')}
        </select>
        <span class="ex-count">Question ${at + 1} of ${shown.length}</span>
        <button type="button" class="button ghost small" data-act="board">${document.body.classList.contains('nr-on-board') ? 'Leave the board view' : 'Show on the board'}</button>
      </div>
      <section class="ex-question">
        <p class="my-meta"><a class="tag" href="themes/${window.topicFile(q.topic)}#${q.section}">${q.topic} ${topicTitle(q.topic)}</a>
          <span class="tag">${q.level}</span> <span class="tag">[${q.marks} marks]</span>
          ${done[q.id] ? '<span class="tag sim-tag">✓ Done</span>' : ''}</p>
        <p class="ex-stem">${q.question}</p>
      </section>
      <h2 class="ex-h">Your answer</h2>
      <ol class="ex-answer">${answer.length ? answer.map(answerRow).join('') : '<li class="ex-empty">Tap a sentence below to add it here.</li>'}</ol>
      ${checked && !solved ? feedback() : ''}
      ${solved ? finish(q) : `
        <h2 class="ex-h">Sentence pieces</h2>
        <p class="my-help">Some of these are vague or wrong, so leave those out.</p>
        <ul class="ex-bank">${free.map((b) => `<li><button type="button" class="ex-piece" data-add="${b.key}">${b.t}</button></li>`).join('')}</ul>
        <p class="ex-actions">
          <button type="button" class="button" data-act="check"${answer.length ? '' : ' disabled'}>Check my answer</button>
          ${tries >= 2 ? '<button type="button" class="button ghost small" data-act="show">Show me the answer</button>' : ''}
        </p>`}
      <p class="ex-nav">
        <button type="button" class="button ghost small" data-act="prev"${at ? '' : ' disabled'}>← Previous</button>
        <button type="button" class="button ghost small" data-act="next"${at < shown.length - 1 ? '' : ' disabled'}>Next →</button>
      </p>`;
    typeset();
  }

  function answerRow(key, i) {
    const p = piece(key);
    const st = checked ? checked.status[key] : '';
    return `<li class="ex-row ${st || ''}">
      <div class="ex-row-text">${p.t}
        ${st === 'bad' ? `<p class="ex-why">${p.why}</p>` : ''}
        ${st === 'order' ? '<p class="ex-why">This one is useful, but it is in the wrong place.</p>' : ''}
      </div>
      ${solved ? '' : `<div class="ex-row-btns">
        <button type="button" data-up="${i}" aria-label="Move up"${i ? '' : ' disabled'}>▲</button>
        <button type="button" data-down="${i}" aria-label="Move down"${i < answer.length - 1 ? '' : ' disabled'}>▼</button>
        <button type="button" data-remove="${i}" aria-label="Remove">✕</button>
      </div>`}
    </li>`;
  }

  function feedback() {
    const c = checked;
    const parts = [];
    if (c.bad) parts.push(`${c.bad} piece${c.bad === 1 ? ' is' : 's are'} vague or wrong`);
    if (c.order) parts.push(`${c.order} ${c.order === 1 ? 'is' : 'are'} out of order`);
    if (c.missing) parts.push(`${c.missing} important piece${c.missing === 1 ? ' is' : 's are'} still missing`);
    return `<p class="notice ex-feedback"><strong>Not yet:</strong> ${parts.join(', ')}. Change your answer and check again.</p>`;
  }

  function finish(q) {
    return `<div class="ex-done">
      <p><strong>Full marks.</strong> Here is your answer as one paragraph:</p>
      <p class="ex-para">${answer.map((k) => piece(k).t).join(' ')}</p>
      <p><strong>Examiner's tip:</strong> ${q.tip}</p>
      ${at < shown.length - 1 ? '<p><button type="button" class="button" data-act="next">Next question</button></p>' : '<p>That was the last one in this list.</p>'}
    </div>`;
  }

  // The longest run of correct pieces in a valid order counts as "in place"; anything else is "out of order".
  function check() {
    const q = shown[at];
    const status = {};
    const right = answer.filter((k) => piece(k).step !== undefined);
    const best = right.map(() => 1), from = right.map(() => -1);
    right.forEach((k, i) => {
      for (let j = 0; j < i; j++) {
        if (piece(right[j]).step <= piece(k).step && best[j] + 1 > best[i]) { best[i] = best[j] + 1; from[i] = j; }
      }
    });
    let end = best.indexOf(Math.max(0, ...best));
    const keep = new Set();
    while (end >= 0) { keep.add(right[end]); end = from[end]; }
    answer.forEach((k) => {
      if (piece(k).step === undefined) status[k] = 'bad';
      else status[k] = keep.has(k) ? 'good' : 'order';
    });
    const bad = answer.filter((k) => status[k] === 'bad').length;
    const order = answer.filter((k) => status[k] === 'order').length;
    const missing = q.pieces.length - right.length;
    checked = { status, bad, order, missing };
    tries++;
    if (!bad && !order && !missing) { solved = true; markDone(q.id); announce('Full marks.'); }
    else announce('Not yet. Read the feedback under your answer.');
    render();
  }

  function showAnswer() {
    const q = shown[at];
    answer = q.pieces.map((p, n) => ({ k: 'p' + n, s: p.step })).sort((a, b) => a.s - b.s).map((x) => x.k);
    check();
  }

  function onClick(e) {
    const add = e.target.closest('[data-add]');
    if (add) { answer.push(add.dataset.add); checked = null; render(); return; }
    const up = e.target.closest('[data-up]');
    if (up) { move(+up.dataset.up, -1); return; }
    const down = e.target.closest('[data-down]');
    if (down) { move(+down.dataset.down, 1); return; }
    const rem = e.target.closest('[data-remove]');
    if (rem) { answer.splice(+rem.dataset.remove, 1); checked = null; render(); return; }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    const a = act.dataset.act;
    if (a === 'check') check();
    else if (a === 'show') showAnswer();
    else if (a === 'next') { choose(at + 1); window.scrollTo(0, 0); }
    else if (a === 'prev') { choose(at - 1); window.scrollTo(0, 0); }
    else if (a === 'board') toggleBoard();
  }
  function move(i, d) {
    const j = i + d;
    [answer[i], answer[j]] = [answer[j], answer[i]];
    checked = null;
    render();
    const btn = app.querySelector(`[data-${d < 0 ? 'up' : 'down'}="${j}"]`);
    if (btn && !btn.disabled) btn.focus();
  }
  function toggleBoard() {
    const on = document.body.classList.toggle('nr-on-board');
    if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
