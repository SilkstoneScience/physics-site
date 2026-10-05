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
    viewSel.value = loadView();
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
    viewSel.addEventListener('change', () => { saveView(viewSel.value); render(true); });
    document.getElementById('q-reset').addEventListener('click', resetProgress);
    document.addEventListener('keydown', onKey);
    render(true);
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
    if (listEl.getBoundingClientRect().top < 0) listEl.scrollIntoView({ behavior: 'smooth' });
  }

  function buildNav() {
    const nav = document.createElement('div');
    nav.className = 'q-nav';
    nav.innerHTML = `
      <button class="secondary" data-go="prev" ${current === 0 ? 'disabled' : ''}>← Previous</button>
      <span class="q-count">Question ${current + 1} of ${shown.length}</span>
      <button class="secondary" data-go="next" ${current === shown.length - 1 ? 'disabled' : ''}>Next →</button>`;
    nav.querySelector('[data-go="prev"]').addEventListener('click', () => goTo(current - 1));
    nav.querySelector('[data-go="next"]').addEventListener('click', () => goTo(current + 1));
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
    if (next) next.addEventListener('click', () => goTo(current + 1));
    const first = area.querySelector('[data-action="first"]');
    if (first) first.addEventListener('click', () => goTo(0));
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
      ${q.diagram ? `<figure><img src="${q.diagram}" alt="${escapeAttr(q.diagramAlt || 'Diagram for this question')}"></figure>` : ''}
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
        <button class="link-btn" data-action="retry">Clear and try again</button>
        ${nextButtonHtml()}` : ''}`;

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
             <span class="marks">[${pt.marks}]</span></p>
          ${pt.numeric ? numericHtml(pt, s) : `<textarea rows="3" placeholder="Write your answer here, then check the mark scheme.">${escapeHtml(s.answer || '')}</textarea>`}
          ${s.revealed ? `
            <div class="markscheme">
              <strong>Mark scheme</strong>
              <ul>${pt.markscheme.map((m) => `<li>${m}</li>`).join('')}</ul>
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
          // After a wrong answer, put the cursor back in the box so the student can try again.
          const again = fresh && fresh.querySelector(`[data-part="${label}"] input:not(:disabled)`);
          if (again) again.focus();
        };
        const btn = partEl.querySelector('[data-action="check"]');
        if (btn) btn.addEventListener('click', check);
        box.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
      }
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

  // Marks a typed answer: { status: 'right' | 'wrong' | 'unreadable', mistake: index or null }.
  function checkNumeric(n, text) {
    const got = parseNumber(text);
    if (!got) return { status: 'unreadable', mistake: null };
    const sign = (x) => (n.anySign ? Math.abs(x) : x);
    const v = sign(got.value);
    let right;
    if (n.range) right = v >= Math.min(...n.range) && v <= Math.max(...n.range);
    else right = closeTo(v, sign(n.answer), n.tolerance, got.sf);
    if (right) return { status: 'right', mistake: null };
    const m = (n.mistakes || []).findIndex((x) => closeTo(v, sign(x.value), n.tolerance, got.sf));
    return { status: 'wrong', mistake: m >= 0 ? m : null };
  }

  // True if `typed` is within the tolerance (2% unless the question says otherwise) of
  // `target`, or is `target` correctly rounded to the student's (2 or more) significant figures.
  function closeTo(typed, target, tolerance, sf) {
    const tol = typeof tolerance === 'number' ? tolerance : 0.02;
    if (Math.abs(typed - target) <= tol * Math.abs(target) + 1e-300) return true;
    if (sf >= 2 && typed !== 0 && Math.sign(typed) === Math.sign(target)) {
      const halfStep = 0.5 * Math.pow(10, Math.floor(Math.log10(Math.abs(typed))) - sf + 1);
      return Math.abs(typed - target) <= halfStep * (1 + 1e-9);
    }
    return false;
  }

  // Reads what a student typed: "0.047", "4.7e-2", "4.7×10^-2", "4.7 x 10-2", "4.7×10⁻²",
  // "12 000", "12,000" or "2,5" (decimal comma). Returns { value, sf } or null.
  function parseNumber(text) {
    const sup = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
    let t = String(text).trim()
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => '^' + [...m].map((c) => sup[c]).join(''))
      .replace(/[−–]/g, '-')
      .replace(/\s+/g, '')
      .replace(/[×xX*·]/g, 'x');
    const power = t.match(/^([+-]?)10\^\(?\{?([+-]?\d+)\}?\)?$/);
    if (power) return { value: Number(power[1] + '1') * Math.pow(10, Number(power[2])), sf: 1 };
    let mant = t;
    let exp = 0;
    const sci = t.match(/^(.*?)(?:[eE]([+-]?\d+)|x10\^?\(?\{?([+-]?\d+)\}?\)?)$/);
    if (sci) { mant = sci[1] === '' ? '1' : sci[1]; exp = Number(sci[2] !== undefined ? sci[2] : sci[3]); }
    if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(mant)) mant = mant.replace(/,/g, '');
    else if (/^[+-]?\d*,\d+$/.test(mant)) mant = mant.replace(',', '.');
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(mant)) return null;
    const value = Number(mant) * Math.pow(10, exp);
    if (!isFinite(value)) return null;
    // Significant figures: ignore the sign and leading zeros; trailing zeros only count after a decimal point.
    let digits = mant.replace(/^[+-]/, '');
    const hasPoint = digits.includes('.');
    digits = digits.replace('.', '').replace(/^0+/, '');
    if (!hasPoint) digits = digits.replace(/0+$/, '');
    return { value, sf: Math.max(digits.length, 1) };
  }

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
