// Question bank: loads questions from the JSON files listed in questions/index.json,
// filters them, marks multiple choice instantly, reveals mark schemes for structured
// questions, and saves each student's progress in their own browser (localStorage).
(function () {
  const STORE_KEY = 'dpphys-progress-v1';
  const PAPERS = { '1A': 'Paper 1A', '1B': 'Paper 1B', '2': 'Paper 2' };
  const DIFFICULTY = { 1: 'Foundation', 2: 'Standard', 3: 'Challenging' };
  const LETTERS = 'ABCDEFG';

  const listEl = document.getElementById('q-list');
  const summaryEl = document.getElementById('q-summary');
  const f = {
    theme: document.getElementById('f-theme'),
    topic: document.getElementById('f-topic'),
    paper: document.getElementById('f-paper'),
    difficulty: document.getElementById('f-difficulty'),
    level: document.getElementById('f-level'),
    status: document.getElementById('f-status'),
  };

  let questions = [];
  let progress = loadProgress();

  // ----- Saving progress (wrapped in try, because some browsers block storage) -----
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) { /* progress just won't be kept */ }
  }

  // ----- Loading questions -----
  async function getJSON(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    return res.json();
  }

  async function init() {
    try {
      const index = await getJSON('questions/index.json');
      const sets = await Promise.all(index.files.map((file) => getJSON('questions/' + file)));
      questions = sets.flat();
    } catch (err) {
      console.error(err);
      listEl.innerHTML = `<p class="notice">Sorry, the questions could not be loaded.
        (If you opened this page straight from your computer, use the preview server instead.)</p>`;
      return;
    }
    fillThemeFilter();
    applyUrlParams();
    fillTopicFilter();
    Object.values(f).forEach((el) => el.addEventListener('change', onFilterChange));
    document.getElementById('q-reset').addEventListener('click', resetProgress);
    render();
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

  // Lets topic pages link straight to filtered questions, e.g. questions.html?topic=A.1
  function applyUrlParams() {
    const p = new URLSearchParams(location.search);
    const topic = p.get('topic');
    if (topic) {
      f.theme.value = topic.charAt(0);
      f.topic.dataset.wanted = topic;
    } else if (p.get('theme')) {
      f.theme.value = p.get('theme');
    }
  }

  function onFilterChange(e) {
    if (e.target === f.theme) fillTopicFilter();
    render();
  }

  function matches(q) {
    return (!f.theme.value || q.theme === f.theme.value) &&
      (!f.topic.value || q.topic === f.topic.value) &&
      (!f.paper.value || q.paper === f.paper.value) &&
      (!f.difficulty.value || String(q.difficulty) === f.difficulty.value) &&
      (!f.level.value || q.level === 'SL') &&
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

  // ----- Drawing the list -----
  function render() {
    typesetClear(listEl);
    const shown = questions.filter(matches);
    listEl.innerHTML = shown.length ? '' : '<p class="notice">No questions match these filters yet.</p>';
    shown.forEach((q) => listEl.appendChild(buildCard(q)));
    typeset(listEl);
    updateSummary(shown.length);
  }

  function refreshCard(q, card) {
    typesetClear(card);
    const fresh = buildCard(q);
    card.replaceWith(fresh);
    typeset(fresh);
    updateSummary(listEl.querySelectorAll('.question').length);
  }

  function topicTitle(id) {
    for (const t of SYLLABUS) {
      const s = t.topics.find((x) => x.id === id);
      if (s) return s.title;
    }
    return '';
  }

  function buildCard(q) {
    const card = document.createElement('article');
    card.className = 'question';
    card.dataset.theme = q.theme;
    const status = statusOf(q);
    const totalMarks = q.paper === '1A' ? 1 : q.parts.reduce((sum, pt) => sum + pt.marks, 0);

    card.innerHTML = `
      <div class="q-meta">
        <span class="tag">${q.topic} ${topicTitle(q.topic)}</span>
        <span class="tag">${PAPERS[q.paper] || q.paper}</span>
        <span class="tag">${DIFFICULTY[q.difficulty] || ''}</span>
        ${q.level === 'HL' ? '<span class="tag hl">HL</span>' : ''}
        <span class="tag">${totalMarks} mark${totalMarks === 1 ? '' : 's'}</span>
        <span class="q-status ${status}">${statusLabel(q)}</span>
      </div>
      <div class="stem">${q.stem}</div>
      ${q.diagram ? `<figure><img src="${q.diagram}" alt="${escapeAttr(q.diagramAlt || 'Diagram for this question')}" loading="lazy"></figure>` : ''}
      <div class="answer-area"></div>`;

    const area = card.querySelector('.answer-area');
    if (q.paper === '1A') buildMultipleChoice(q, area, card);
    else buildStructured(q, area, card);
    return card;
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
        <button class="link-btn" data-action="retry">Clear and try again</button>` : ''}`;

    area.querySelectorAll('.option').forEach((btn) => btn.addEventListener('click', () => {
      const choice = Number(btn.dataset.i);
      progress[q.id] = { choice, correct: choice === q.answer, time: Date.now() };
      saveProgress();
      refreshCard(q, card);
    }));
    const retry = area.querySelector('[data-action="retry"]');
    if (retry) retry.addEventListener('click', () => {
      delete progress[q.id];
      saveProgress();
      refreshCard(q, card);
    });
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
      return `
        <div class="part" data-part="${pt.label}">
          <p><span class="part-label">(${pt.label})</span>${pt.question}
             <span class="marks">[${pt.marks}]</span></p>
          <textarea rows="3" placeholder="Write your answer here, then check the mark scheme.">${escapeHtml(s.answer || '')}</textarea>
          ${s.revealed ? `
            <div class="markscheme">
              <strong>Mark scheme</strong>
              <ul>${pt.markscheme.map((m) => `<li>${m}</li>`).join('')}</ul>
              <label>Marks you earned:
                <select><option value="" ${typeof s.score === 'number' ? '' : 'selected'}>choose</option>${scoreOptions}</select>
                out of ${pt.marks}</label>
            </div>` : '<button class="secondary" data-action="reveal">Show mark scheme</button>'}
        </div>`;
    }).join('') + '<p><button class="link-btn" data-action="clear">Clear my answers to this question</button></p>';

    area.querySelectorAll('.part').forEach((partEl) => {
      const label = partEl.dataset.part;
      // Save typed answers as the student writes (no redraw, so typing isn't interrupted).
      partEl.querySelector('textarea').addEventListener('input', (e) => {
        partState(q, label).answer = e.target.value;
        saveProgress();
      });
      const reveal = partEl.querySelector('[data-action="reveal"]');
      if (reveal) reveal.addEventListener('click', () => {
        partState(q, label).revealed = true;
        saveProgress();
        refreshCard(q, card);
      });
      const select = partEl.querySelector('.markscheme select');
      if (select) select.addEventListener('change', () => {
        const st = partState(q, label);
        if (select.value === '') delete st.score; else st.score = Number(select.value);
        saveProgress();
        refreshCard(q, card);
      });
    });
    area.querySelector('[data-action="clear"]').addEventListener('click', () => {
      delete progress[q.id];
      saveProgress();
      refreshCard(q, card);
    });
  }

  // ----- Progress summary -----
  function updateSummary(shownCount) {
    const done = questions.filter((q) => statusOf(q) === 'done').length;
    const attempted = questions.filter((q) => statusOf(q) !== 'new').length;
    summaryEl.innerHTML = `Showing <strong>${shownCount}</strong> of ${questions.length} questions ·
      attempted <strong>${attempted}</strong> · fully correct <strong>${done}</strong>`;
  }

  function resetProgress() {
    if (!confirm('Clear all your saved answers and scores on this device?')) return;
    progress = {};
    saveProgress();
    render();
  }

  // ----- Helpers -----
  function escapeHtml(s) {
    return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
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
