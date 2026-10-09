// Question bank: loads questions from the JSON files listed in questions/index.json,
// filters them, marks multiple choice instantly, reveals mark schemes for structured
// questions, and saves each student's progress in their own browser (localStorage).
// Questions are shown one at a time (with Previous / Next) or all on one page.
(function () {
  const STORE_KEY = 'dpphys-progress-v1';
  const VIEW_KEY = 'dpphys-view';
  const PAPERS = { '1A': 'Paper 1A', '1B': 'Paper 1B', '2': 'Paper 2' };
  const DIFFICULTY = { 1: 'Foundation', 2: 'Standard', 3: 'Challenging' };
  const LETTERS = 'ABCDEFG';

  const listEl = document.getElementById('q-list');
  const summaryEl = document.getElementById('q-summary');
  const viewSel = document.getElementById('f-view');
  const f = {
    theme: document.getElementById('f-theme'),
    topic: document.getElementById('f-topic'),
    paper: document.getElementById('f-paper'),
    difficulty: document.getElementById('f-difficulty'),
    level: document.getElementById('f-level'),
    status: document.getElementById('f-status'),
  };

  let questions = [];
  let shown = [];    // the questions that matched the filters when the list was last drawn
  let current = 0;   // position in `shown` (one-at-a-time view)
  let progress = loadProgress();

  // ----- Saving progress (wrapped in try, because some browsers block storage) -----
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) { /* progress just won't be kept */ }
  }
  function loadView() {
    try { return localStorage.getItem(VIEW_KEY) || 'one'; } catch (e) { return 'one'; }
  }
  function saveView(v) {
    try { localStorage.setItem(VIEW_KEY, v); } catch (e) { /* ignore */ }
  }
  const oneAtATime = () => viewSel.value === 'one';

  // ----- Loading questions -----
  async function getJSON(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    return res.json();
  }

  async function init() {
    setUpBackLink();
    announce(''); // create the screen-reader message area early, so later messages are read
    viewSel.value = loadView();
    // Each file loads on its own, so one broken file doesn't stop the others,
    // and a question with missing pieces is left out instead of breaking the page.
    let failedFiles = [];
    let skipped = 0;
    try {
      const index = await getJSON('questions/index.json');
      const results = await Promise.allSettled(index.files.map((file) => getJSON('questions/' + file)));
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && Array.isArray(r.value)) questions.push(...r.value);
        else { failedFiles.push(index.files[i]); console.error(index.files[i], r.reason || 'not a list of questions'); }
      });
      // On the teacher's own computer only, also show Paper 1B datasets that aren't approved yet.
      // (questions/1b-preview.json is made by tools/1b/build.mjs and is never published.)
      if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
        try {
          const extra = await getJSON('questions/1b-preview.json');
          if (Array.isArray(extra)) questions.push(...extra);
        } catch (e) { /* no preview file: nothing to add */ }
      }
      const usable = questions.filter(isUsable);
      skipped = questions.length - usable.length;
      questions = usable;
    } catch (err) {
      console.error(err);
    }
    if (!questions.length) {
      listEl.innerHTML = `<p class="notice">Sorry, the questions could not be loaded.
        (If you opened this page straight from your computer, use the preview server instead.)</p>`;
      summaryEl.textContent = '';
      return;
    }
    if (failedFiles.length || skipped) {
      const note = document.createElement('p');
      note.className = 'notice';
      note.textContent = 'Some questions could not be loaded, so they are missing from the list below. Everything else works as normal.';
      listEl.before(note);
    }
    fillThemeFilter();
    applyUrlParams();
    fillTopicFilter();
    Object.values(f).forEach((el) => el.addEventListener('change', onFilterChange));
    viewSel.addEventListener('change', () => { saveView(viewSel.value); render(true); });
    document.getElementById('q-reset').addEventListener('click', resetProgress);
    document.addEventListener('keydown', onKey);
    render(true);
  }

  // True if a question has everything needed to show and mark it.
  // (tools/check.mjs checks the files much more thoroughly before they are published.)
  function isUsable(q) {
    const ok = q && typeof q.id === 'string' && typeof q.topic === 'string' && typeof q.stem === 'string' && (
      q.paper === '1A'
        ? Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length
        : Array.isArray(q.parts) && q.parts.length > 0 && q.parts.every((pt) =>
          pt && pt.label && Number.isInteger(pt.marks) && pt.marks > 0 && Array.isArray(pt.markscheme)));
    if (!ok) console.error('Question left out because it is incomplete:', q && q.id);
    return ok;
  }

  // ----- "Back" link: returns to the page the student came from -----
  function setUpBackLink() {
    const back = document.getElementById('q-back');
    if (!back) return;
    const params = new URLSearchParams(location.search);
    const topic = params.get('topic');
    let cameFromSite = false;
    try {
      const ref = new URL(document.referrer);
      cameFromSite = ref.origin === location.origin && ref.pathname !== location.pathname;
    } catch (e) { /* no referrer */ }

    if (topic) {
      back.href = 'themes/' + topicFile(topic);
      back.textContent = `← Back to ${topic} ${topicTitle(topic)}`;
    } else if (params.get('theme')) {
      back.href = 'themes/' + params.get('theme').toLowerCase() + '.html';
      back.textContent = `← Back to Theme ${params.get('theme')}`;
    }
    if (cameFromSite) {
      // Prefer the browser's own "back", so the student returns to the same scroll position.
      back.addEventListener('click', (e) => { e.preventDefault(); history.back(); });
    }
  }

  // ----- Filters -----
  function fillThemeFilter() {
    f.theme.innerHTML = '<option value="">All themes</option>' +
      SYLLABUS.map((t) => `<option value="${t.id}">${t.id}: ${t.title}</option>`).join('');
  }

  function fillTopicFilter() {
    const keep = f.topic.value || f.topic.dataset.wanted || '';
    const themes = SYLLABUS.filter((t) => !f.theme.value || t.id === f.theme.value);
    f.topic.innerHTML = '<option value="">All topics</option>' + themes.flatMap((t) =>
      t.topics.map((s) => `<option value="${s.id}">${s.id} ${s.title}</option>`)).join('');
    f.topic.value = themes.some((t) => t.topics.some((s) => s.id === keep)) ? keep : '';
    delete f.topic.dataset.wanted;
  }

  // Lets pages link straight to filtered questions, e.g. questions.html?topic=A.1
  // and to one question, e.g. questions.html?topic=A.1&q=A1-004
  function applyUrlParams() {
    const p = new URLSearchParams(location.search);
    const topic = p.get('topic');
    if (topic) {
      f.theme.value = topic.charAt(0);
      f.topic.dataset.wanted = topic;
    } else if (p.get('theme')) {
      f.theme.value = p.get('theme');
    }
    if (PAPERS[p.get('paper')]) f.paper.value = p.get('paper'); // e.g. questions.html?topic=D.3&paper=1B
    listEl.dataset.wantedQuestion = p.get('q') || '';
  }

  function onFilterChange(e) {
    if (e.target === f.theme) fillTopicFilter();
    render(true);
  }

  function matches(q) {
    return (!f.theme.value || q.theme === f.theme.value) &&
      (!f.topic.value || q.topic === f.topic.value) &&
      (!f.paper.value || q.paper === f.paper.value) &&
      (!f.difficulty.value || String(q.difficulty) === f.difficulty.value) &&
      (!f.level.value || q.level !== 'HL') && // "SL only" keeps SL and the common Paper 1B (SL_HL)
      (!f.status.value || statusOf(q) === f.status.value);
  }

  // ----- Status of one question: new, started, review or done -----
  function marksOf(q) {
    const p = progress[q.id];
    const total = q.parts.reduce((sum, pt) => sum + pt.marks, 0);
    let got = 0;
    let marked = 0;
    q.parts.forEach((pt) => {
      const s = p && p.parts && p.parts[pt.label] && p.parts[pt.label].score;
      if (typeof s === 'number') { got += s; marked++; }
    });
    return { got, total, allMarked: marked === q.parts.length };
  }

  function statusOf(q) {
    const p = progress[q.id];
    if (!p) return 'new';
    if (q.paper === '1A') return p.correct ? 'done' : 'review';
    const m = marksOf(q);
    if (!m.allMarked) return 'started';
    return m.got === m.total ? 'done' : 'review';
  }

  function statusLabel(q) {
    const s = statusOf(q);
    if (s === 'new') return '';
    if (q.paper === '1A') return s === 'done' ? '✓ Correct' : '✗ Try again';
    const m = marksOf(q);
    return m.allMarked ? `${m.got} / ${m.total} marks` : 'In progress';
  }

  // ----- Drawing -----
  // refilter = true: apply the filters again and go back to the first question.
  // refilter = false: keep the same list and position (used after answering or moving).
  function render(refilter) {
    if (refilter) {
      shown = questions.filter(matches);
      current = 0;
      const wanted = listEl.dataset.wantedQuestion;
      if (wanted) {
        const i = shown.findIndex((q) => q.id === wanted);
        if (i >= 0) current = i;
        listEl.dataset.wantedQuestion = '';
      }
    }
    typesetClear(listEl);
    listEl.innerHTML = '';
    if (!shown.length) {
      listEl.innerHTML = '<p class="notice">No questions match these filters yet.</p>';
    } else if (oneAtATime()) {
      current = Math.min(Math.max(current, 0), shown.length - 1);
      listEl.appendChild(buildNav());
      listEl.appendChild(buildCard(shown[current]));
      // The same Previous / Next under the question, so students needn't scroll back up.
      listEl.appendChild(buildNav(true));
      updateUrl();
    } else {
      shown.forEach((q) => listEl.appendChild(buildCard(q)));
    }
    typeset(listEl);
    updateSummary();
    // Keep the "Σ Equations" panel on the topic of the question being shown.
    const topicNow = oneAtATime() && shown.length ? shown[current].topic : (f.topic.value || (shown[0] && shown[0].topic) || '');
    if (window.setEquationTopic && topicNow) window.setEquationTopic(topicNow);
  }

  function goTo(i) {
    if (i < 0 || i >= shown.length) return;
    current = i;
    render(false);
    // Bring the question into view if the student had scrolled down.
    const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (listEl.getBoundingClientRect().top < 0) listEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  // Moves to another question and puts the keyboard focus where the student expects it:
  // on the same Previous/Next button, or on "Question n of m" for the "Next question" button.
  function goToAndFocus(i, selector) {
    goTo(i);
    const btn = selector && listEl.querySelector(selector);
    if (btn && !btn.disabled) btn.focus(); else focusIn(listEl, '.q-count');
  }

  // bottom: the copy under the question. Its buttons take the student to the top of the next question.
  function buildNav(bottom = false) {
    const nav = document.createElement('div');
    nav.className = bottom ? 'q-nav q-nav-bottom' : 'q-nav';
    nav.innerHTML = `
      <button class="secondary" data-go="prev" ${current === 0 ? 'disabled' : ''}>← Previous</button>
      <span class="q-count">Question ${current + 1} of ${shown.length}</span>
      <button class="secondary" data-go="next" ${current === shown.length - 1 ? 'disabled' : ''}>Next →</button>`;
    nav.querySelector('[data-go="prev"]').addEventListener('click', () => goToAndFocus(current - 1, bottom ? null : '[data-go="prev"]'));
    nav.querySelector('[data-go="next"]').addEventListener('click', () => goToAndFocus(current + 1, bottom ? null : '[data-go="next"]'));
    return nav;
  }

  // Shown under a question once it has been answered (one-at-a-time view only).
  function nextButtonHtml() {
    if (!oneAtATime()) return '';
    if (current < shown.length - 1) {
      return '<p class="next-row"><button class="primary" data-action="next">Next question →</button></p>';
    }
    return `<p class="next-row"><span>That's the last question in this set.</span>
      <button class="secondary" data-action="first">Back to question 1</button></p>`;
  }
  function wireNextButtons(area) {
    const next = area.querySelector('[data-action="next"]');
    if (next) next.addEventListener('click', () => goToAndFocus(current + 1));
    const first = area.querySelector('[data-action="first"]');
    if (first) first.addEventListener('click', () => goToAndFocus(0));
  }

  // Redraws one question's card and returns the new card element.
  function refreshCard(q, card) {
    if (oneAtATime()) { render(false); return listEl.querySelector('.question'); }
    typesetClear(card);
    const fresh = buildCard(q);
    card.replaceWith(fresh);
    typeset(fresh);
    updateSummary();
    return fresh;
  }

  function onKey(e) {
    if (!oneAtATime() || e.altKey || e.ctrlKey || e.metaKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight') goTo(current + 1);
    if (e.key === 'ArrowLeft') goTo(current - 1);
  }

  function updateUrl() {
    const p = new URLSearchParams(location.search);
    p.set('q', shown[current].id);
    history.replaceState(null, '', '?' + p.toString());
  }

  function topicTitle(id) {
    for (const t of SYLLABUS) {
      const s = t.topics.find((x) => x.id === id);
      if (s) return s.title;
    }
    return '';
  }

  // If a question still fails to draw, show a short note in its place instead of breaking the page.
  function buildCard(q) {
    try {
      return buildCardInner(q);
    } catch (err) {
      console.error('Could not show question', q.id, err);
      const card = document.createElement('article');
      card.className = 'question';
      card.innerHTML = '<p class="notice">Sorry, this question could not be shown. Please try the next one.</p>';
      return card;
    }
  }

  function buildCardInner(q) {
    const card = document.createElement('article');
    card.className = 'question';
    card.dataset.theme = q.theme;
    card.dataset.qid = q.id;
    const status = statusOf(q);
    const totalMarks = q.paper === '1A' ? 1 : q.parts.reduce((sum, pt) => sum + pt.marks, 0);

    card.innerHTML = `
      <div class="q-meta">
        <span class="tag">${q.topic} ${topicTitle(q.topic)}</span>
        <span class="tag">${PAPERS[q.paper] || q.paper}</span>
        <span class="tag">${DIFFICULTY[q.difficulty] || ''}</span>
        ${q.level === 'HL' ? '<span class="tag hl">HL</span>' : ''}
        ${q.level === 'SL_HL' ? '<span class="tag">SL &amp; HL</span>' : ''}
        ${q.review && q.review.status !== 'APPROVED' ? `<span class="tag preview">Preview only: ${q.review.status}</span>` : ''}
        <span class="tag">${totalMarks} mark${totalMarks === 1 ? '' : 's'}</span>
        <span class="q-status ${status}">${statusLabel(q)}</span>
      </div>
      <div class="stem">${q.stem}</div>
      ${q.diagram ? `<figure><img src="${q.diagram}" alt="${escapeAttr(q.diagramAlt || 'Diagram for this question')}"></figure>` : ''}
      ${dataBlockHtml(q)}
      <div class="answer-area"></div>`;

    const area = card.querySelector('.answer-area');
    if (q.paper === '1A') buildMultipleChoice(q, area, card);
    else buildStructured(q, area, card);
    return card;
  }

  // ----- Paper 1B data: tables, graphs and diagrams made by tools/1b/build.mjs -----
  // The SVGs are inline (not <img>) so they follow light/dark mode; each has its own aria-label.
  // The tables and figures live in a separate file per question (q.dataFile), loaded only when the
  // question is shown; each figure is stored once by name (item.ref, or a part's msFigure name).
  const dataCache = {}; // question id -> its data, or 'loading' / 'error'
  const hasData = (q) => Array.isArray(q.data) || !!q.dataFile;
  function dataOf(q) {
    if (Array.isArray(q.data)) return { figures: q.figures || {}, data: q.data };
    const c = dataCache[q.id];
    return c && typeof c === 'object' ? c : null;
  }
  async function loadData(q) {
    if (dataCache[q.id]) return;
    dataCache[q.id] = 'loading';
    try {
      dataCache[q.id] = await getJSON(q.dataFile);
    } catch (e) {
      console.error('Could not load the data for', q.id, e);
      dataCache[q.id] = 'error';
    }
    const card = listEl.querySelector(`.question[data-qid="${q.id}"]`);
    if (card) refreshCard(q, card);
  }
  function dataBlockHtml(q) {
    if (!hasData(q)) return '';
    const dd = dataOf(q);
    let inner;
    if (dd) inner = dd.data.map((item) => dataItemHtml(item, dd.figures)).join('');
    else if (dataCache[q.id] === 'error') inner = '<p class="notice">Sorry, the data for this question couldn\'t be loaded. Please try reloading the page.</p>';
    else { loadData(q); inner = '<p class="notice">Loading the data…</p>'; }
    return `<div class="q-data" id="data-${q.id}">${inner}</div>`;
  }
  function msFigureHtml(q, ms) {
    if (typeof ms === 'object') return dataItemHtml(ms, {});
    const dd = dataOf(q);
    return dd && dd.figures[ms] ? dataItemHtml({ kind: 'figure', ref: ms }, dd.figures) : '';
  }
  function dataItemHtml(item, figures) {
    if (item.kind === 'table') {
      return `<figure class="q-table">${item.caption ? `<figcaption>${item.caption}</figcaption>` : ''}${item.html}</figure>`;
    }
    const fig = item.ref ? figures[item.ref] : item;
    if (!fig) return '';
    return `<figure class="diagram q-fig">${fig.svg}${fig.caption ? `<figcaption>${fig.caption}</figcaption>` : ''}</figure>`;
  }

  // ----- Multiple choice: marked instantly -----
  function buildMultipleChoice(q, area, card) {
    const p = progress[q.id];
    area.innerHTML = `
      <ol class="options">${q.options.map((opt, i) => {
        let cls = '';
        if (p && i === q.answer) cls = 'is-correct';
        else if (p && i === p.choice) cls = 'is-wrong';
        return `<li><button class="option ${cls}" data-i="${i}" ${p ? 'disabled' : ''}>
          <span class="letter">${LETTERS[i]}</span><span>${opt}</span></button></li>`;
      }).join('')}</ol>
      ${p ? `
        <div class="feedback ${p.correct ? 'good' : 'bad'}">
          <strong>${p.correct ? 'Correct!' : `Not quite. The answer is ${LETTERS[q.answer]}.`}</strong>
          ${q.explanation ? `<p>${q.explanation}</p>` : ''}
        </div>
        <button class="link-btn" data-action="retry">Clear and try again</button>
        ${nextButtonHtml()}` : ''}`;

    area.querySelectorAll('.option').forEach((btn) => btn.addEventListener('click', () => {
      const choice = Number(btn.dataset.i);
      progress[q.id] = { choice, correct: choice === q.answer, time: Date.now() };
      saveProgress();
      // Moving focus to the feedback keeps keyboard users in place and makes screen readers read it.
      focusIn(refreshCard(q, card), '.feedback');
    }));
    const retry = area.querySelector('[data-action="retry"]');
    if (retry) retry.addEventListener('click', () => {
      delete progress[q.id];
      saveProgress();
      focusIn(refreshCard(q, card), '.option');
    });
    wireNextButtons(area);
  }

  // ----- Structured (Paper 1B and 2): reveal mark scheme, then self-mark -----
  function partState(q, label) {
    progress[q.id] = progress[q.id] || { parts: {} };
    progress[q.id].parts = progress[q.id].parts || {};
    progress[q.id].parts[label] = progress[q.id].parts[label] || {};
    return progress[q.id].parts[label];
  }

  function buildStructured(q, area, card) {
    const saved = (progress[q.id] && progress[q.id].parts) || {};
    area.innerHTML = q.parts.map((pt) => {
      const s = saved[pt.label] || {};
      const scoreOptions = Array.from({ length: pt.marks + 1 }, (_, n) =>
        `<option value="${n}" ${s.score === n ? 'selected' : ''}>${n}</option>`).join('');
      const markLine = s.auto
        ? `<p class="auto-mark">Marks: ${pt.marks} out of ${pt.marks} (your answer was checked automatically)</p>`
        : `<label>Marks you earned:
                <select><option value="" ${typeof s.score === 'number' ? '' : 'selected'}>choose</option>${scoreOptions}</select>
                out of ${pt.marks}</label>`;
      return `
        <div class="part" data-part="${pt.label}">
          <p><span class="part-label">(${pt.label})</span>${pt.question}
             <span class="marks">[${pt.marks}]</span>
             ${hasData(q) ? `<a class="data-link" href="#data-${q.id}">↑ Data</a>` : ''}</p>
          ${pt.figure ? msFigureHtml(q, pt.figure) : ''}
          ${pt.numeric ? numericHtml(pt, s) : `<textarea rows="3" aria-label="Your answer to part (${pt.label})" placeholder="Write your answer here, then check the mark scheme.">${escapeHtml(s.answer || '')}</textarea>`}
          ${s.revealed ? `
            <div class="markscheme">
              <strong>Mark scheme</strong>
              <ul>${pt.markscheme.map((m) => `<li>${m}</li>`).join('')}</ul>
              ${pt.msFigure ? msFigureHtml(q, pt.msFigure) : ''}
              ${markLine}
            </div>` : '<button class="secondary" data-action="reveal">Show mark scheme</button>'}
        </div>`;
    }).join('') +
      '<p><button class="link-btn" data-action="clear">Clear my answers to this question</button></p>' +
      (marksOf(q).allMarked ? nextButtonHtml() : '');

    area.querySelectorAll('.part').forEach((partEl) => {
      const label = partEl.dataset.part;
      const pt = q.parts.find((x) => x.label === label);
      // Save typed answers as the student writes (no redraw, so typing isn't interrupted).
      const box = partEl.querySelector('textarea, input');
      box.addEventListener('input', (e) => {
        partState(q, label).answer = e.target.value;
        saveProgress();
      });
      if (pt.numeric) {
        const check = () => {
          const st = partState(q, label);
          const res = checkNumeric(pt.numeric, box.value);
          st.answer = box.value;
          st.check = res.status;
          st.mistake = res.mistake;
          if (res.status === 'right') { st.score = pt.marks; st.revealed = true; st.auto = true; }
          saveProgress();
          const fresh = refreshCard(q, card);
          // After a wrong answer, put the cursor back in the box so the student can try again,
          // and have screen readers read the feedback. After a right one, go to the feedback.
          const again = fresh && fresh.querySelector(`[data-part="${label}"] input:not(:disabled)`);
          if (again) {
            again.focus();
            const fb = fresh.querySelector(`[data-part="${label}"] .feedback`);
            if (fb) announce(fb.textContent);
          } else {
            focusIn(fresh, `[data-part="${label}"] .feedback`);
          }
        };
        const btn = partEl.querySelector('[data-action="check"]');
        if (btn) btn.addEventListener('click', check);
        box.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
      }
      const reveal = partEl.querySelector('[data-action="reveal"]');
      if (reveal) reveal.addEventListener('click', () => {
        partState(q, label).revealed = true;
        saveProgress();
        focusIn(refreshCard(q, card), `[data-part="${label}"] .markscheme`);
      });
      const select = partEl.querySelector('.markscheme select');
      if (select) select.addEventListener('change', () => {
        const st = partState(q, label);
        if (select.value === '') delete st.score; else st.score = Number(select.value);
        saveProgress();
        focusIn(refreshCard(q, card), `[data-part="${label}"] .markscheme select`);
      });
    });
    area.querySelector('[data-action="clear"]').addEventListener('click', () => {
      delete progress[q.id];
      saveProgress();
      focusIn(refreshCard(q, card), 'textarea, input');
    });
    wireNextButtons(area);
  }

  // ----- Typed numerical answers (parts with a "numeric" field) -----
  // A part can have: "numeric": { "answer": 517, "unit": "$\\text{m s}^{-1}$",
  //   "tolerance": 0.02, "range": [500, 530], "anySign": true,
  //   "mistakes": [{ "value": 39, "feedback": "..." }] }. Only "answer" is required.
  // A right answer earns the part's full marks automatically. A wrong one can be retried,
  // or the student can open the mark scheme and award themselves method marks.
  function numericHtml(pt, s) {
    const n = pt.numeric;
    const locked = !!s.revealed;
    let feedback = '';
    if (s.check === 'right') {
      feedback = `<div class="feedback good"><strong>Correct!</strong> ${pt.marks} mark${pt.marks === 1 ? '' : 's'}.</div>`;
    } else if (s.check === 'unreadable') {
      feedback = `<div class="feedback bad"><strong>That isn't a number I can read.</strong>
        Type just the number, for example 0.047, 4.7e-2 or 4.7×10^-2. The unit is already given.</div>`;
    } else if (s.check === 'wrong') {
      const tip = typeof s.mistake === 'number' && n.mistakes && n.mistakes[s.mistake]
        ? n.mistakes[s.mistake].feedback
        : 'Check your working and try again, or look at the mark scheme.';
      feedback = `<div class="feedback bad"><strong>Not quite.</strong> ${tip}</div>`;
    }
    return `
      <div class="num-row">
        <input type="text" autocomplete="off" spellcheck="false" placeholder="Your answer"
          aria-label="Your answer to part (${pt.label})" value="${escapeAttr(s.answer || '')}" ${locked ? 'disabled' : ''}>
        ${n.unit ? `<span class="unit">${n.unit}</span>` : ''}
        ${locked ? '' : '<button class="primary" data-action="check">Check</button>'}
      </div>
      ${locked ? '' : '<p class="num-hint">Type a number, such as 0.047, 4.7e-2 or 4.7×10^-2.</p>'}
      ${feedback}`;
  }

  // The marking itself (checkNumeric, parseNumber) is in js/numeric.js.
  const { checkNumeric } = window.Numeric;

  // ----- Progress summary -----
  function updateSummary() {
    const done = shown.filter((q) => statusOf(q) === 'done').length;
    const attempted = shown.filter((q) => statusOf(q) !== 'new').length;
    summaryEl.innerHTML = `<strong>${shown.length}</strong> question${shown.length === 1 ? '' : 's'} in this set ·
      attempted <strong>${attempted}</strong> · fully correct <strong>${done}</strong>`;
  }

  function resetProgress() {
    if (!confirm('Clear all your saved answers and scores on this device?')) return;
    progress = {};
    saveProgress();
    render(true);
  }

  // ----- Helpers -----
  function escapeHtml(s) {
    return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }
  // Puts the keyboard focus on the first match inside `container` (making it focusable if needed).
  // Screen readers read out whatever receives focus.
  function focusIn(container, selector) {
    const el = container && container.querySelector(selector);
    if (!el) return;
    if (!el.matches('a[href], button, input, select, textarea') && !el.hasAttribute('tabindex')) el.tabIndex = -1;
    el.focus();
  }
  // Has screen readers read a message without moving the focus (a hidden "live region").
  function announce(text) {
    let live = document.getElementById('q-announce');
    if (!live) {
      live = document.createElement('p');
      live.id = 'q-announce';
      live.className = 'visually-hidden';
      live.setAttribute('aria-live', 'polite');
      document.querySelector('main').appendChild(live);
    }
    live.textContent = '';
    setTimeout(() => { live.textContent = text.replace(/\s+/g, ' ').trim(); }, 50);
  }

  // Ask MathJax to draw the equations inside an element (if MathJax has loaded yet;
  // if not, MathJax draws the whole page itself when it finishes loading).
  function typeset(el) {
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([el]).catch(console.error);
  }
  function typesetClear(el) {
    if (window.MathJax && MathJax.typesetClear) MathJax.typesetClear([el]);
  }

  init();
})();
