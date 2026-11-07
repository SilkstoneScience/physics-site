// Think deeper: concept challenges and big questions (think/*.html). The puzzles (ids PZ-01…) were merged into the
// concept challenges in November 2026 (teacher's decision); think/puzzles.html now forwards to them.
// Each page says which collection it shows with <body data-think="concepts|big">; the items come from
// think/concepts.json and think/big-questions.json. Diagrams are SVG files drawn inline, so
// they follow the site's colours and dark mode. An item counts as done once the student chooses an answer or opens a
// reveal; that is saved only in this browser. The concept challenges page opens with one card per theme.
(function () {
  const body = document.body;
  const kind = body.dataset.think;
  const listEl = document.querySelector('[data-think-list]');
  if (!kind || !listEl) return;
  const root = body.dataset.root || '';
  const FILES = { concepts: 'concepts.json', big: 'big-questions.json' };
  const KIND_LABEL = { unsolved: 'Still unsolved', solved: 'Solved, but surprising' };
  const TAG_LABEL = { fun: 'Just for fun', beyond: 'Beyond the syllabus' };
  const LETTERS = 'ABCD';
  const TOPICS = new Map(window.SYLLABUS.flatMap((t) => t.topics.map((s) => [s.id, { ...s, theme: t.id }])));
  const params = new URLSearchParams(location.search);
  let items = [];
  let shown = [];

  const STORE = 'thinkDone';
  let done = new Set();
  try { done = new Set(JSON.parse(localStorage.getItem(STORE) || '[]')); } catch (e) { /* storage blocked */ }
  const saveDone = () => { try { localStorage.setItem(STORE, JSON.stringify([...done])); } catch (e) { /* ignore */ } };

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  // "Skills" is a topic label of its own (the essential skills on skills.html), grouped like a theme.
  const SKILLS = 'Skills';
  const topicPage = (t) => (t === SKILLS ? `${root}skills.html` : `${root}themes/${t.replace('.', '').toLowerCase()}.html`);
  const themeOf = (t) => (t === SKILLS ? SKILLS : TOPICS.get(t)?.theme);
  const topicsOf = (it) => (it.topic ? [it.topic] : it.topics || []);
  const isHL = (it) => it.level === 'HL' || topicsOf(it).some((t) => TOPICS.get(t) && TOPICS.get(t).hl);

  // ----- Building one item -----
  function figureHtml(f) {
    if (!f) return '';
    const cap = f.caption || f.credit
      ? `<figcaption>${f.caption || ''}${f.credit ? ` <span class="credit">${f.credit}</span>` : ''}</figcaption>` : '';
    const pic = f.img
      ? `<img class="photo" src="${esc(f.img)}" alt="${esc(f.alt)}" loading="lazy">`
      : `<div class="think-svg" data-svg="${esc(f.svg)}" data-alt="${esc(f.alt)}"></div>`;
    return `<figure class="diagram">${pic}${cap}</figure>`;
  }
  function tagsHtml(it) {
    const tags = [];
    if (kind === 'big') tags.push(`<span class="tag think-kind-${it.kind}">${KIND_LABEL[it.kind]}</span>`);
    for (const t of it.tags || []) tags.push(`<span class="tag think-fun">${TAG_LABEL[t]}</span>`);
    for (const t of topicsOf(it)) tags.push(`<a class="tag" href="${topicPage(t)}">${t}</a>`);
    if (isHL(it)) tags.push('<span class="tag hl">HL</span>');
    else tags.push('<span class="tag think-sl">SL</span>');
    return tags.join(' ');
  }
  function answerHtml(it) {
    if (it.type === 'choice') {
      const opts = it.options.map((o, i) =>
        `<li><button type="button" class="think-opt" data-i="${i}"><span class="think-letter">${LETTERS[i]}</span><span>${o}</span></button></li>`).join('');
      return `<ol class="think-opts" aria-label="Choose an answer">${opts}</ol>`;
    }
    return '<p class="think-predict">Decide on your answer, and your reason, before you look.</p>';
  }
  // A YouTube video in place of a written answer (teacher's decision): loaded only when its reveal opens, with the
  // written version kept below, folded, for anyone who can't watch (YouTube is often blocked in schools).
  function videoHtml(v, readHtml) {
    return `<div class="think-video" data-yt="${esc(v.youtube)}" data-title="${esc(v.title)}"></div>
      <p class="think-small">Video: ${esc(v.title)} (${esc(v.channel)}). <a href="https://www.youtube.com/watch?v=${esc(v.youtube)}" target="_blank" rel="noopener">Watch on YouTube</a></p>
      <details class="think-reveal think-read"><summary>Prefer to read it?</summary>${readHtml}</details>`;
  }
  function revealHtml(it) {
    const tempting = it.tempting ? `<div class="think-tempting"><h4>Clearing misconceptions</h4>${it.tempting}</div>` : '';
    const written = it.reveal + figureHtml(it.revealFigure);
    return `<details class="think-reveal think-answer"><summary>Show the answer</summary>
      <p class="think-feedback" aria-live="polite"></p>${it.revealVideo ? videoHtml(it.revealVideo, written) : written}${tempting}</details>`;
  }
  function bigHtml(it) {
    const puzzling = it.puzzling ? `<details class="think-reveal"><summary>Why is it puzzling?</summary>${it.puzzling}</details>` : '';
    const discuss = `<h4>Discuss</h4><ol class="think-discuss">${it.discussion.map((d) => `<li>${d}</li>`).join('')}</ol>`;
    const nos = it.nos.map((n) => `<a class="tag nos" href="${root}tok.html">${esc(n)}</a>`).join(' ');
    const links = it.links.map((l) =>
      `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a>${l.kind === 'video' ? ' <span class="think-small">(video)</span>' : ''}</li>`).join('');
    // A big question can answer "What physicists think so far" with a video (thinkingVideo); the written
    // explanation then stays underneath, folded, for anyone who can't watch (YouTube is often blocked in schools).
    const v = it.thinkingVideo;
    const thinking = v ? videoHtml(v, it.thinking) : it.thinking;
    return `${puzzling}
      <details class="think-reveal"><summary>What physicists think so far</summary>${thinking}</details>
      ${discuss}
      <div class="think-links">
        <p><strong>Nature of science:</strong> ${nos}</p>
        <p><strong>ToK:</strong> ${it.tok}</p>
        <h4>Find out more</h4><ul>${links}</ul>
      </div>`;
  }
  function cardHtml(it, board) {
    const main = kind === 'big' ? bigHtml(it) : answerHtml(it) + revealHtml(it);
    const body = `${figureHtml(it.figure)}<div class="think-q">${it.question}</div>${main}`;
    if (board) {
      return `<article class="think-card" data-id="${it.id}"><h3>${it.title}</h3><p class="think-tags">${tagsHtml(it)}</p>${body}</article>`;
    }
    // In the list each card starts closed, as a tile: a small copy of its picture, the title and the tags.
    // The title button (or the picture) opens it across the full width.
    // Marked done automatically once the student chooses an answer or opens a reveal (saved in this browser only).
    const theme = topicsOf(it).length ? themeOf(topicsOf(it)[0]) : '';
    const f = it.figure;
    const thumb = !f ? '' : `<div class="think-thumb diagram" aria-hidden="true">${f.img
      ? `<img src="${esc(f.img)}" alt="" loading="lazy">`
      : `<div class="think-svg" data-svg="${esc(f.svg)}" data-alt=""></div>`}</div>`;
    return `<article class="think-card${done.has(it.id) ? ' is-done' : ''}" data-id="${it.id}" id="${it.id}"${theme ? ` data-theme="${theme}"` : ''}>
      ${thumb}<span class="think-badge" title="Done"><span aria-hidden="true">✓</span><span class="visually-hidden">Done</span></span>
      <h3 class="think-title"><button type="button" class="think-toggle" aria-expanded="false" aria-controls="${it.id}-body">${it.title}</button></h3>
      <p class="think-tags">${tagsHtml(it)}</p>
      <div class="think-body" id="${it.id}-body" hidden>${body}
        <div class="think-foot"><button type="button" class="link-btn" data-board>Show on the board</button></div></div></article>`;
  }
  function setOpen(card, open) {
    const bodyEl = card.querySelector('.think-body');
    const btn = card.querySelector('.think-toggle');
    if (!bodyEl || !btn) return;
    bodyEl.hidden = !open;
    card.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    // Equations are drawn the first time a card opens (MathJax can't lay out hidden text).
    if (open && !bodyEl.dataset.drawn) { bodyEl.dataset.drawn = '1'; typeset(bodyEl); }
  }

  // ----- Drawing a list, with diagrams and maths -----
  const svgCache = new Map();
  function loadSvgs(el) {
    return Promise.all([...el.querySelectorAll('.think-svg[data-svg]')].map((holder) => {
      const src = holder.dataset.svg;
      if (!svgCache.has(src)) svgCache.set(src, fetch(src).then((r) => (r.ok ? r.text() : '')).catch(() => ''));
      return svgCache.get(src).then((text) => {
        holder.innerHTML = text;
        const svg = holder.querySelector('svg');
        if (svg) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', holder.dataset.alt); }
      });
    }));
  }
  function typeset(el) {
    if (window.glueUnits) glueUnits(el);
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([el]).catch(console.error);
  }
  function groupHeading(text, id) { return `<h2 class="think-group"${id ? ` id="${id}"` : ''}>${text}</h2>`; }

  // Concept challenges page without ?theme= or ?topic=: one card per theme, plus one for the Skills challenges
  // (their list starts with a link to the Skills page).
  function groupCard(id, title) {
    const list = items.filter((it) => themeOf(it.topic) === id);
    const name = `<h3>${title}</h3>`;
    if (!list.length) return `<li><div class="card think-soon" data-theme="${id}">${name}<p>Coming soon</p></div></li>`;
    const n = list.filter((it) => done.has(it.id)).length;
    const count = `${list.length} challenge${list.length === 1 ? '' : 's'}${n ? ` · ${n} done` : ''}`;
    return `<li><a class="card" data-theme="${id}" href="?theme=${id}">${name}<p>${count}</p></a></li>`;
  }
  // One grid with no headings: the Skills card first, then Themes A–E (teacher's decision).
  function themeCardsHtml() {
    return '<ul class="card-grid think-topics">'
      + groupCard(SKILLS, 'Skills: measurement, uncertainty, graphs and vectors')
      + window.SYLLABUS.map((th) => groupCard(th.id, `Theme ${th.id}: ${esc(th.title)}`)).join('') + '</ul>';
  }

  function render() {
    const topic = params.get('topic');
    const theme = params.get('theme');
    shown = items.filter((it) => (!topic || topicsOf(it).includes(topic))
      && (!theme || topicsOf(it).some((t) => themeOf(t) === theme)));
    let html = '';
    const grid = (list) => (list.length ? `<div class="think-grid">${list.map((it) => cardHtml(it)).join('')}</div>` : '');
    if (kind === 'concepts' && !topic && !theme) {
      shown = [];
      html = themeCardsHtml();
    } else if (kind === 'concepts') {
      // No heading: each challenge's own topic tag links to the notes.
      html = `<p class="think-back"><a href="${location.pathname}">← All themes</a></p>`
        + (theme === SKILLS || topic === SKILLS
          ? `<p>These challenges practise the essential skills on the <a href="${root}skills.html">Physics skills</a> page.</p>` : '')
        + grid(shown);
      if (!shown.length) html += '<p class="notice">No challenges here yet. More are coming.</p>';
    } else if (kind === 'big') {
      for (const k of ['unsolved', 'solved']) {
        const list = shown.filter((it) => it.kind === k);
        if (list.length) html += groupHeading(KIND_LABEL[k], k) + grid(list);
      }
    } else {
      html = grid(shown);
    }
    if (kind !== 'concepts' && topic) {
      html = `<p class="notice">Showing only items on ${esc(topic)}. <a href="${location.pathname}">Show all</a></p>` + html;
    }
    listEl.innerHTML = html || '<p class="notice">Nothing here yet for this choice. More are coming.</p>';
    return loadSvgs(listEl);
  }

  // ----- Answering, "done" and the board -----
  function markDone(card) {
    if (!card || !card.id || done.has(card.id)) return; // card.id is empty on the board copy
    done.add(card.id);
    saveDone();
    card.classList.add('is-done');
  }
  function choose(card, i) {
    markDone(card);
    const it = items.find((x) => x.id === card.dataset.id);
    card.querySelectorAll('.think-opt').forEach((b) => {
      const n = Number(b.dataset.i);
      b.disabled = true;
      b.classList.toggle('right', n === it.answer);
      b.classList.toggle('wrong', n === i && i !== it.answer);
    });
    const fb = card.querySelector('.think-feedback');
    fb.textContent = i === it.answer ? 'Correct!' : `Not quite: the answer is ${LETTERS[it.answer]}.`;
    fb.className = 'think-feedback ' + (i === it.answer ? 'good' : 'bad');
    const det = card.querySelector('.think-answer');
    det.open = true;
  }
  document.addEventListener('click', (e) => {
    const tog = e.target.closest('.think-toggle, .think-thumb');
    if (tog) {
      const card = tog.closest('.think-card');
      const opening = card.querySelector('.think-body').hidden;
      setOpen(card, opening);
      card.scrollIntoView({ block: 'nearest' }); // the card moves to its own row when it opens
      return;
    }
    const opt = e.target.closest('.think-opt');
    if (opt) { choose(opt.closest('.think-card'), Number(opt.dataset.i)); return; }
    const b = e.target.closest('[data-board]');
    if (b) { openBoard(shown.findIndex((x) => x.id === b.closest('.think-card').dataset.id)); }
  });
  // Opening any reveal counts as having a go. ("toggle" doesn't bubble, so listen while it travels down.)
  document.addEventListener('toggle', (e) => {
    if (!(e.target.matches && e.target.matches('details.think-reveal') && e.target.open)) return;
    markDone(e.target.closest('.think-card'));
    // Load a video only when its reveal is opened, so nothing comes from YouTube before then.
    const holder = e.target.querySelector(':scope > .think-video:empty');
    if (holder) {
      holder.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(holder.dataset.yt)}" title="${esc(holder.dataset.title)}"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    }
  }, true);

  let board, boardIndex = 0;
  function openBoard(i) {
    if (!board) {
      board = document.createElement('dialog');
      board.className = 'think-board';
      board.setAttribute('aria-label', 'Show on the board');
      board.innerHTML = `<div class="think-board-bar">
          <button type="button" class="button secondary" data-move="-1">← Previous</button>
          <span class="think-board-count"></span>
          <button type="button" class="button secondary" data-move="1">Next →</button>
          <button type="button" class="button" data-close>Close</button></div>
        <div class="think-board-body"></div>`;
      document.body.appendChild(board);
      board.addEventListener('click', (e) => {
        const m = e.target.closest('[data-move]');
        if (m) showBoard(boardIndex + Number(m.dataset.move));
        if (e.target.closest('[data-close]')) board.close();
      });
      board.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') showBoard(boardIndex + 1);
        if (e.key === 'ArrowLeft') showBoard(boardIndex - 1);
      });
    }
    showBoard(i);
    if (!board.open) board.showModal();
    board.querySelector('[data-close]').focus();
  }
  function showBoard(i) {
    boardIndex = (i + shown.length) % shown.length;
    const bodyEl = board.querySelector('.think-board-body');
    if (window.MathJax && MathJax.typesetClear) MathJax.typesetClear([bodyEl]);
    bodyEl.innerHTML = cardHtml(shown[boardIndex], true);
    board.querySelector('.think-board-count').textContent = `${boardIndex + 1} of ${shown.length}`;
    loadSvgs(bodyEl);
    typeset(bodyEl);
    bodyEl.scrollTop = 0;
  }

  // ----- Start -----
  fetch(FILES[kind])
    .then((r) => r.json())
    .then((data) => {
      items = data;
      return render();
    })
    .then(() => {
      // A link to one item (e.g. big-questions.html#BQ-02): jump once the diagrams are in, so nothing moves it.
      if (!location.hash) return;
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) { if (el.matches('.think-card')) setOpen(el, true); el.scrollIntoView(); }
    })
    .catch(() => { listEl.innerHTML = '<p class="notice">Sorry, these questions could not be loaded. Try reloading the page.</p>'; });
})();
