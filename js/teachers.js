// Revision sheet builder for teachers (teachers/index.html). Plan and decisions: docs/TEACHERS_PLAN.md.
// It builds two documents from the site's own content, every time the page opens:
//   - teachers/<topic>.json: revision summary, ToK/NoS discussion prompts, video ideas, "also useful for" labs
//   - themes/<topic>.html: the ToK and NoS box and the worked examples
//   - think/concepts.json, think/big-questions.json: the hook
//   - questions/*.json: Paper 1A and Paper 2 questions for the self-test
//   - experimental/practicals.html, resources/simulations.html, resources/apps.html: labs and simulations
// So new concept challenges, questions and lab cards appear here automatically.
// The choices are kept in the page address (?topic=A.1&q1=…), so a link rebuilds the same sheet.
(function () {
  'use strict';
  const MAX1 = 10; // most Paper 1A questions on one sheet (teacher's decision)
  const MAX2 = 5;  // most Paper 2 questions
  const SITE = 'https://physics.silkstone.xyz/';
  const PARTS = ['h', 't', 'n', 'r', 'w', 's']; // hook, ToK, NoS, revision notes, worked examples, self-test
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const LETTERS = 'ABCD';

  const cache = new Map();
  function load(url, kind) {
    if (!cache.has(url)) {
      cache.set(url, fetch(url).then((r) => {
        if (!r.ok) throw new Error(`${url}: ${r.status}`);
        return kind === 'json' ? r.json() : r.text().then((t) => new DOMParser().parseFromString(t, 'text/html'));
      }));
    }
    return cache.get(url);
  }
  const json = (u) => load(u, 'json');
  const doc = (u) => load(u, 'doc');
  const optional = (p) => p.catch((e) => { console.warn(e); return null; });

  // ---------- State, read from and written to the page address ----------
  const params = new URLSearchParams(location.search);
  const state = {
    topic: params.get('topic') || '',
    level: params.get('level') === 'SL' ? 'SL' : 'HL', // SL sheets leave out HL notes, worked examples and questions
    parts: new Set(params.has('parts') ? params.get('parts').split('').filter((p) => PARTS.includes(p)) : PARTS),
    cc: params.get('cc'), // concept challenge id, "" = none, null = default
    bq: params.get('bq'),
    tok: Number(params.get('tok')) || 0,
    nos: Number(params.get('nos')) || 0,
    mode: params.get('mode') === 'choose' ? 'choose' : 'random',
    q1: params.has('q1') ? params.get('q1').split(',').filter(Boolean) : null,
    q2: params.has('q2') ? params.get('q2').split(',').filter(Boolean) : null,
  };
  function saveState() {
    const p = new URLSearchParams();
    p.set('topic', state.topic);
    if (state.level === 'SL' && !data.hlOnly) p.set('level', 'SL');
    if (PARTS.some((x) => !state.parts.has(x))) p.set('parts', PARTS.filter((x) => state.parts.has(x)).join(''));
    p.set('cc', state.cc || '');
    p.set('bq', state.bq || '');
    if (state.tok) p.set('tok', state.tok);
    if (state.nos) p.set('nos', state.nos);
    if (state.mode === 'choose') p.set('mode', 'choose');
    p.set('q1', state.q1.join(','));
    p.set('q2', state.q2.join(','));
    history.replaceState(null, '', '?' + p.toString().replace(/%2C/g, ','));
  }

  // ---------- Data for one topic ----------
  let data = null; // everything for the current topic
  async function loadTopic(topic) {
    const slug = topic.replace('.', '').toLowerCase();
    const [teacher, page, concepts, bigs, qIndex, practicals, sims, apps] = await Promise.all([
      json(`${slug}.json`), doc(`../themes/${slug}.html`),
      optional(json('../think/concepts.json')), optional(json('../think/big-questions.json')),
      json('../questions/index.json'),
      optional(doc('../experimental/practicals.html')), optional(doc('../resources/simulations.html')), optional(doc('../resources/apps.html')),
    ]);
    const files = await Promise.all(qIndex.files.map((f) => optional(json(`../questions/${f}`))));
    const all = files.flat().filter(Boolean).filter((q) => q.topic === topic);
    const pageUrl = new URL(`../themes/${slug}.html`, location.href);
    const tokBox = page.querySelector('section.tok');
    const info = (window.SYLLABUS || []).flatMap((t) => t.topics).find((t) => t.id === topic);
    return {
      topic, slug, teacher, pageUrl,
      liveUrl: `${SITE}themes/${slug}.html`, // printed links always point to the published site
      title: info?.title || topic,
      hlOnly: !!info?.hl,
      allConcepts: (concepts || []).filter((c) => c.topic === topic),
      allBigs: (bigs || []).filter((b) => (b.topics || []).includes(topic)),
      tokQs: tokBox ? [...tokBox.querySelectorAll('ul.tok-q > li')].map((li) => absolutise(li, pageUrl).innerHTML.trim()) : [],
      nos: tokBox ? [...tokBox.querySelectorAll('.tok-grid > div:first-child > p')].map((p) => absolutise(p, pageUrl).innerHTML.trim()) : [],
      allWorked: [...page.querySelectorAll('main .worked')].map((box) => {
        const b = absolutise(box.cloneNode(true), pageUrl);
        b.querySelectorAll('.hint').forEach((h) => h.remove()); // solutions are visible on the sheet, so no hint is needed
        // HL if it sits in the page's HL-only part or its heading carries an HL tag
        return { html: b.outerHTML, hl: !!(box.closest('.hl-zone') || box.querySelector('h3 .tag.hl')) };
      }),
      allP1: all.filter((q) => q.paper === '1A'),
      allP2: all.filter((q) => q.paper === '2'),
      labs: labsFor(topic, practicals, teacher.alsoLabs || []),
      sims: listFrom(sims, `#simulations-${slug}`, '../resources/simulations.html'),
      apps: listFrom(apps, `#apps-${slug}`, '../resources/apps.html'),
    };
  }
  // The content for the chosen level: an SL sheet leaves out everything marked HL.
  function applyLevel(d) {
    const sl = state.level === 'SL' && !d.hlOnly;
    const keep = (x) => !sl || x.level !== 'HL';
    d.sl = sl;
    d.concepts = d.allConcepts.filter(keep);
    d.bigs = d.allBigs.filter(keep);
    d.worked = d.allWorked.filter((w) => !sl || !w.hl).map((w) => w.html);
    d.p1 = d.allP1.filter(keep);
    d.p2 = d.allP2.filter(keep);
    d.summary = (d.teacher.summary || []).filter((x) => !sl || !x.hl).map((x) => {
      const box = document.createElement('div');
      box.innerHTML = x.html;
      if (sl) box.querySelectorAll('.hl-only').forEach((el) => el.remove());
      const tag = x.hl && !d.hlOnly ? '<span class="tag hl">HL</span> ' : '';
      return `<div class="sheet-notes"><h4>${tag}${esc(x.heading)}</h4>${box.innerHTML}</div>`;
    });
  }
  // Make links and pictures copied from another page work here (and in the PDF).
  function absolutise(el, base) {
    el.querySelectorAll('[href]').forEach((a) => { if (!a.getAttribute('href').startsWith('#')) a.href = new URL(a.getAttribute('href'), base).href; });
    el.querySelectorAll('img[src]').forEach((i) => { i.src = new URL(i.getAttribute('src'), base).href; });
    return el;
  }
  function labsFor(topic, practicals, also) {
    const labs = [];
    if (practicals) {
      const base = new URL('../experimental/practicals.html', location.href);
      practicals.querySelectorAll('a.card').forEach((a) => {
        const sub = a.querySelector('p')?.textContent.trim() || '';
        if (!sub.startsWith(topic + ' ')) return;
        const h = a.querySelector('h3').cloneNode(true);
        const tags = [...h.querySelectorAll('.tag')].map((t) => t.textContent.trim());
        h.querySelectorAll('.tag').forEach((t) => t.remove());
        labs.push({ title: h.textContent.trim(), url: new URL(a.getAttribute('href'), base).href, tags, note: '' });
      });
      for (const x of also) {
        const url = new URL('../' + x.href, location.href).href;
        if (labs.some((l) => l.url === url)) continue;
        const card = [...practicals.querySelectorAll('a.card')].find((a) => new URL(a.getAttribute('href'), base).href === url);
        if (!card) continue; // the checker reports a missing lab page
        const h = card.querySelector('h3').cloneNode(true);
        const tags = [...h.querySelectorAll('.tag')].map((t) => t.textContent.trim());
        h.querySelectorAll('.tag').forEach((t) => t.remove());
        labs.push({ title: h.textContent.trim(), url, tags, note: x.note || '' });
      }
    }
    return labs;
  }
  function listFrom(d, sel, rel) {
    const sec = d && d.querySelector(sel);
    if (!sec) return [];
    const base = new URL(rel, location.href);
    return [...sec.querySelectorAll('.res-list > li')].map((li) => {
      const a = li.querySelector('a');
      return {
        title: a.textContent.replace(/\s*↗\s*$/, '').trim(), url: new URL(a.getAttribute('href'), base).href,
        src: li.querySelector('.res-src')?.textContent.trim() || '', desc: li.querySelector('.res-desc')?.innerHTML || '',
      };
    });
  }

  // ---------- Choosing questions ----------
  function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  const byOrder = (pool) => (a, b) => pool.findIndex((q) => q.id === a) - pool.findIndex((q) => q.id === b);
  function randomSet(pool, n) { return shuffle(pool).slice(0, n).map((q) => q.id).sort(byOrder(pool)); }
  // A saved link keeps its questions; any that no longer exist are replaced at random, so the sheet stays the same length.
  function cleanSet(ids, pool, max) {
    const ok = new Set(pool.map((q) => q.id));
    const wanted = [...new Set(ids)];
    const kept = wanted.filter((id) => ok.has(id)).slice(0, max);
    const missing = Math.min(wanted.length, max) - kept.length;
    if (missing <= 0) return kept;
    return kept.concat(shuffle(pool.filter((q) => !kept.includes(q.id))).slice(0, missing).map((q) => q.id)).sort(byOrder(pool));
  }

  // ---------- Building the student sheet ----------
  const figureSvg = (f) => f.svg
    ? `<div class="think-svg" data-svg="../think/${esc(f.svg)}" data-alt="${esc(f.alt)}"></div>`
    : `<img class="photo" src="${esc(new URL(f.img, new URL('../think/', location.href)).href)}" alt="${esc(f.alt)}">`;
  function thinkFigure(f) {
    if (!f) return '';
    return `<figure class="diagram">${figureSvg(f)}${f.caption || f.credit ? `<figcaption>${f.caption || ''}${f.credit ? ` <span class="credit">${f.credit}</span>` : ''}</figcaption>` : ''}</figure>`;
  }
  function lines(n) { return `<div class="sheet-lines" aria-hidden="true">${'<span></span>'.repeat(n)}</div>`; }
  const hlTag = (q) => (q.level === 'HL' && !data.hlOnly ? ' <span class="tag hl">HL</span>' : '');
  const qDiagram = (q) => q.diagram ? `<figure class="q-fig"><img src="../${esc(q.diagram)}" alt="${esc(q.diagramAlt || 'Diagram for this question')}"></figure>` : '';
  const totalMarks = (q) => q.parts.reduce((s, p) => s + (p.marks || 0), 0);

  const levelLabel = (d) => (d.hlOnly ? 'HL only' : d.sl ? 'SL' : 'SL and HL');
  function studentSheet(d, picks) {
    const out = [];
    let n = 0;
    const part = (title, html) => out.push(`<section class="sheet-part"><h3><span class="sheet-num">${++n}</span>${title}</h3>${html}</section>`);
    out.push(`<header class="sheet-head"><p class="sheet-kicker">IB Physics revision sheet · ${levelLabel(d)}</p><h2><span class="code">${esc(d.topic)}</span>${esc(d.title)}</h2>
      <p class="sheet-name"><span>Name: </span><span class="sheet-blank"></span><span>Date: </span><span class="sheet-blank short"></span></p></header>`);

    if (state.parts.has('h') && (picks.cc || picks.bq)) {
      let html = '';
      if (picks.cc) {
        const c = picks.cc;
        html += `<div class="sheet-item"><h4>Concept challenge: ${esc(c.title)}</h4>${thinkFigure(c.figure)}${c.question}`;
        html += c.type === 'choice'
          ? `<ol class="sheet-options">${c.options.map((o) => `<li>${o}</li>`).join('')}</ol><p class="sheet-instr">Choose an answer and explain your choice.</p>${lines(3)}`
          : `<p class="sheet-instr">Write your prediction and your reasons.</p>${lines(4)}`;
        html += '</div>';
      }
      if (picks.bq) {
        const b = picks.bq;
        html += `<div class="sheet-item"><h4>Big question: ${esc(b.title)}</h4>${thinkFigure(b.figure)}${b.question}
          <p class="sheet-instr">Discuss:</p><ul>${b.discussion.map((x) => `<li>${x}</li>`).join('')}</ul></div>`;
      }
      part('Start here', html);
    }
    const tokQ = d.tokQs[state.tok];
    const nosP = d.nos[state.nos];
    if (state.parts.has('t') && tokQ) part('Theory of knowledge', `<p class="sheet-tok">${tokQ}</p>${lines(3)}`);
    if (state.parts.has('n') && nosP) part('Nature of science', `<p>${nosP}</p>`);
    if (state.parts.has('r')) {
      part('Revision notes', d.summary.join(''));
    }
    if (state.parts.has('w') && d.worked.length) part('Worked examples', d.worked.join(''));
    if (state.parts.has('s') && (picks.p1.length || picks.p2.length)) {
      let html = '';
      let qn = 0;
      const swap = (id, which) => (state.mode === 'random' ? `<button type="button" class="link-btn tb-swap no-print" data-swap="${which}" data-id="${esc(id)}">Swap this question</button>` : '');
      if (picks.p1.length) {
        html += `<h4>Multiple choice (Paper 1A style)</h4>`;
        html += picks.p1.map((q) => `<div class="sheet-q"><p class="sheet-qnum">${++qn}.${hlTag(q)}${swap(q.id, 1)}</p>${q.stem}${qDiagram(q)}
          <ol class="sheet-options">${q.options.map((o) => `<li>${o}</li>`).join('')}</ol></div>`).join('');
      }
      if (picks.p2.length) {
        html += `<h4>Structured questions (Paper 2 style)</h4>`;
        html += picks.p2.map((q) => `<div class="sheet-q"><p class="sheet-qnum">${++qn}.${hlTag(q)} <span class="sheet-marks">[${totalMarks(q)} marks]</span>${swap(q.id, 2)}</p>${q.stem}${qDiagram(q)}
          ${q.parts.map((p) => `<div class="sheet-qpart"><p><strong>(${esc(p.label)})</strong> ${p.question} <span class="sheet-marks">[${p.marks}]</span></p>${lines(Math.min(8, 2 * p.marks))}</div>`).join('')}</div>`).join('');
      }
      part('Self-test', html);
    }
    out.push(sheetFooter(d));
    return out.join('');
  }
  function sheetFooter(d) {
    return `<footer class="sheet-foot">© 2026 Mark Silkstone, Mr Silkstone's Physics (<a href="${SITE}">physics.silkstone.xyz</a>). May be copied for classroom use, not for sale.
      Full notes: <a href="${d.liveUrl}">${d.topic} ${esc(d.title)}</a>. Not produced or endorsed by the International Baccalaureate Organization.</footer>`;
  }

  // ---------- Building the teacher notes ----------
  function teacherSheet(d, picks) {
    const out = [];
    let n = 0;
    const part = (title, html) => out.push(`<section class="sheet-part"><h3><span class="sheet-num">${++n}</span>${title}</h3>${html}</section>`);
    out.push(`<header class="sheet-head"><p class="sheet-kicker">Teacher notes and answers · ${levelLabel(d)}</p><h2><span class="code">${esc(d.topic)}</span>${esc(d.title)}</h2>
      <p>For the revision sheet built at <a href="${esc(location.href)}">this link</a>.</p></header>`);

    if (state.parts.has('h') && (picks.cc || picks.bq)) {
      let html = '';
      if (picks.cc) {
        const c = picks.cc;
        html += `<div class="sheet-item"><h4>Concept challenge: ${esc(c.title)}</h4>`;
        if (c.type === 'choice') html += `<p><strong>Answer: ${LETTERS[c.answer]}</strong>, ${c.options[c.answer]}</p>`;
        html += `${c.reveal}${c.revealFigure ? thinkFigure(c.revealFigure) : ''}<h5>Clearing misconceptions</h5>${c.tempting}</div>`;
      }
      if (picks.bq) {
        const b = picks.bq;
        html += `<div class="sheet-item"><h4>Big question: ${esc(b.title)}</h4>${b.puzzling ? `<h5>Why it's puzzling</h5>${b.puzzling}` : ''}
          <h5>What physicists think so far</h5>${b.thinking}${b.tok ? `<p><strong>ToK link:</strong> ${b.tok}</p>` : ''}
          ${(b.links || []).length ? `<h5>Further reading and viewing</h5><ul>${b.links.map((l) => `<li><a href="${esc(l.url)}">${esc(l.title)}</a></li>`).join('')}</ul>` : ''}</div>`;
      }
      part('Hook: answers and notes', html);
    }
    const tokQ = d.tokQs[state.tok];
    if (state.parts.has('t') && tokQ) {
      const key = (tokQ.match(/<strong>([\s\S]*?)<\/strong>/) || [])[1]?.trim();
      const prompts = (d.teacher.tokPrompts || {})[key] || [];
      part('ToK: discussion prompts', `<p class="sheet-tok">${tokQ}</p>${prompts.length ? `<ul>${prompts.map((x) => `<li>${x}</li>`).join('')}</ul>` : '<p>No prompts written yet for this question.</p>'}`);
    }
    const nosP = d.nos[state.nos];
    if (state.parts.has('n') && nosP) {
      const key = (nosP.match(/<strong>([\s\S]*?)\.?<\/strong>/) || [])[1]?.replace(/\.$/, '').trim();
      const prompts = (d.teacher.nosPrompts || {})[key] || [];
      part('NoS: discussion prompts', `<p>${nosP}</p>${prompts.length ? `<ul>${prompts.map((x) => `<li>${x}</li>`).join('')}</ul>` : '<p>No prompts written yet for this idea.</p>'}`);
    }
    if (state.parts.has('s') && (picks.p1.length || picks.p2.length)) {
      let html = '';
      let qn = 0;
      if (picks.p1.length) {
        html += '<h4>Multiple choice</h4><ol class="sheet-answers">';
        html += picks.p1.map((q) => `<li value="${++qn}"><strong>${LETTERS[q.answer]}</strong> <span class="sheet-id">(${esc(q.id)})</span>. ${q.explanation || ''}</li>`).join('');
        html += '</ol>';
      }
      if (picks.p2.length) {
        html += '<h4>Structured questions: mark scheme</h4>';
        html += picks.p2.map((q) => `<div class="sheet-q"><p class="sheet-qnum">${++qn}. <span class="sheet-id">(${esc(q.id)})</span> <span class="sheet-marks">[${totalMarks(q)} marks]</span></p>
          ${q.parts.map((p) => `<div class="sheet-qpart"><p><strong>(${esc(p.label)})</strong> <span class="sheet-marks">[${p.marks}]</span></p><ul class="markscheme">${p.markscheme.map((m) => `<li>${m}</li>`).join('')}</ul></div>`).join('')}</div>`).join('');
      }
      part('Self-test answers', html);
    }
    // Labs, simulations and apps
    let labs = '';
    if (d.labs.length) {
      labs += `<h4>Labs on this site</h4><ul>${d.labs.map((l) => `<li><a href="${esc(l.url)}">${esc(l.title)}</a>${l.tags.length ? ` <span class="tag">${esc(l.tags.join(', '))}</span>` : ''}${l.note ? `: ${esc(l.note)}` : ''}</li>`).join('')}</ul>`;
    }
    if (d.sims.length) labs += `<h4>Simulations</h4><ul>${d.sims.map((s) => `<li><a href="${esc(s.url)}">${esc(s.title)}</a> (${esc(s.src)}): ${s.desc}</li>`).join('')}</ul>`;
    if (d.apps.length) labs += `<h4>Apps and software</h4><ul>${d.apps.map((s) => `<li><a href="${esc(s.url)}">${esc(s.title)}</a> (${esc(s.src)}): ${s.desc}</li>`).join('')}</ul>`;
    part('Labs and simulations', labs || '<p>No labs listed for this subtopic yet.</p>');
    const vids = d.teacher.videos || [];
    part('Learn more: video ideas', vids.length ? `<ul class="sheet-videos">${vids.map((v) => {
      const url = `https://www.youtube.com/watch?v=${v.youtube}`;
      return `<li><a href="${esc(url)}">${esc(v.title)}</a> (${esc(v.channel)}). ${esc(v.use)} <span class="sheet-url">${esc(url)}</span></li>`;
    }).join('')}</ul>` : '<p>No videos listed yet.</p>');
    part('Links for students', `<ul><li>Full notes: <a href="${d.liveUrl}">${d.liveUrl}</a></li>
      <li>More practice questions: <a href="${SITE}questions.html?topic=${esc(d.topic)}">${SITE}questions.html?topic=${esc(d.topic)}</a></li></ul>`);
    out.push(sheetFooter(d));
    return out.join('');
  }

  // ---------- Drawing ----------
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
  async function typeset(els) {
    if (window.glueUnits) els.forEach((el) => window.glueUnits(el));
    if (!window.MathJax || !MathJax.startup) return;
    await MathJax.startup.promise;
    MathJax.typesetClear(els);
    await MathJax.typesetPromise(els);
  }
  let drawing = 0;
  let ready = Promise.resolve(); // the latest drawing, finished (the print buttons wait for it)
  function draw() { ready = drawNow().catch(console.error); return ready; }
  async function drawNow() {
    const mine = ++drawing;
    const d = data;
    const picks = {
      cc: d.concepts.find((c) => c.id === state.cc) || null,
      bq: d.bigs.find((b) => b.id === state.bq) || null,
      p1: state.q1.map((id) => d.p1.find((q) => q.id === id)).filter(Boolean),
      p2: state.q2.map((id) => d.p2.find((q) => q.id === id)).filter(Boolean),
    };
    const s = $('student-sheet');
    const t = $('teacher-sheet');
    s.innerHTML = studentSheet(d, picks);
    t.innerHTML = teacherSheet(d, picks);
    saveState();
    await Promise.all([loadSvgs(s), loadSvgs(t)]);
    if (mine !== drawing) return;
    await typeset([s, t]);
  }

  // ---------- Controls ----------
  function fillSelect(sel, items, value, none) {
    sel.innerHTML = (none ? `<option value="">${none}</option>` : '') + items.map((it) => `<option value="${esc(it.value)}">${esc(it.label)}</option>`).join('');
    sel.value = value ?? '';
  }
  const plain = (html) => { const div = document.createElement('div'); div.innerHTML = html; return div.textContent.replace(/\s+/g, ' ').trim(); };

  function setUpControls() {
    const d = data;
    applyLevel(d);
    if (state.cc && !d.concepts.some((c) => c.id === state.cc)) state.cc = null;
    if (state.bq && !d.bigs.some((b) => b.id === state.bq)) state.bq = null;
    $('tb-level').value = d.hlOnly ? 'HL' : state.level;
    $('tb-level').disabled = d.hlOnly;
    $('tb-level-note').textContent = d.hlOnly ? 'This subtopic is HL only.' : '';
    if (state.cc === null) state.cc = d.concepts[0]?.id || '';
    if (state.bq === null) state.bq = d.concepts.length ? '' : (d.bigs[0]?.id || '');
    fillSelect($('tb-cc'), d.concepts.map((c) => ({ value: c.id, label: c.title })), state.cc, d.concepts.length ? 'None' : 'None yet for this subtopic');
    fillSelect($('tb-bq'), d.bigs.map((b) => ({ value: b.id, label: b.title })), state.bq, d.bigs.length ? 'None' : 'None yet for this subtopic');
    state.tok = Math.min(state.tok, Math.max(0, d.tokQs.length - 1));
    state.nos = Math.min(state.nos, Math.max(0, d.nos.length - 1));
    fillSelect($('tb-tok'), d.tokQs.map((q, i) => ({ value: i, label: plain((q.match(/<strong>([\s\S]*?)<\/strong>/) || [, q])[1]) })), state.tok);
    fillSelect($('tb-nos'), d.nos.map((p, i) => ({ value: i, label: plain((p.match(/<strong>([\s\S]*?)<\/strong>/) || [, p])[1]).replace(/\.$/, '') })), state.nos);
    document.querySelectorAll('[data-part]').forEach((box) => { box.checked = state.parts.has(box.dataset.part); });
    document.querySelector(`input[name="tb-mode"][value="${state.mode}"]`).checked = true;

    const max1 = Math.min(MAX1, d.p1.length);
    const max2 = Math.min(MAX2, d.p2.length);
    state.q1 = state.q1 ? cleanSet(state.q1, d.p1, max1) : randomSet(d.p1, Math.min(6, max1));
    state.q2 = state.q2 ? cleanSet(state.q2, d.p2, max2) : randomSet(d.p2, Math.min(1, max2));
    $('tb-n1').max = max1; $('tb-n2').max = max2;
    $('tb-a1').textContent = `(up to ${max1}: ${d.p1.length} in the bank)`;
    $('tb-a2').textContent = max2 ? `(up to ${max2}: ${d.p2.length} in the bank)` : '(none in the bank yet)';
    syncControls();
  }
  function syncControls() {
    document.querySelectorAll('.tb-sub').forEach((sub) => { sub.hidden = !state.parts.has(sub.dataset.for); });
    $('tb-n1').value = state.q1.length;
    $('tb-n2').value = state.q2.length;
    const choose = state.mode === 'choose';
    $('tb-reroll').hidden = choose;
    $('tb-choose').hidden = !choose;
    $('tb-n1').readOnly = choose; $('tb-n2').readOnly = choose;
    if (choose) drawChooser();
  }
  function drawChooser() {
    const d = data;
    const row = (q, which) => `<label class="tb-pick"><input type="checkbox" data-pick="${which}" value="${esc(q.id)}"${(which === 1 ? state.q1 : state.q2).includes(q.id) ? ' checked' : ''}>
      <span><strong>${esc(q.id)}</strong> ${esc(plain(q.stem).slice(0, 150))}${plain(q.stem).length > 150 ? '…' : ''}</span></label>`;
    $('tb-choose').innerHTML = `<p class="tb-avail">Tick up to ${MAX1} Paper 1A and ${MAX2} Paper 2 questions.</p>
      <h4>Paper 1A (${state.q1.length} chosen)</h4>${d.p1.map((q) => row(q, 1)).join('')}
      ${d.p2.length ? `<h4>Paper 2 (${state.q2.length} chosen)</h4>${d.p2.map((q) => row(q, 2)).join('')}` : ''}`;
  }

  function setCount(which, n) {
    const d = data;
    const pool = which === 1 ? d.p1 : d.p2;
    const max = Math.min(which === 1 ? MAX1 : MAX2, pool.length);
    n = Math.max(0, Math.min(max, Math.round(Number(n) || 0)));
    let ids = which === 1 ? state.q1 : state.q2;
    if (n < ids.length) ids = ids.slice(0, n);
    else ids = ids.concat(shuffle(pool.filter((q) => !ids.includes(q.id))).slice(0, n - ids.length).map((q) => q.id)).sort(byOrder(pool));
    if (which === 1) state.q1 = ids; else state.q2 = ids;
  }

  function wire() {
    $('tb-topic').addEventListener('change', async (e) => {
      state.topic = e.target.value; state.cc = null; state.bq = null; state.tok = 0; state.nos = 0; state.q1 = null; state.q2 = null;
      await openTopic();
    });
    $('tb-form').addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.part) { if (t.checked) state.parts.add(t.dataset.part); else state.parts.delete(t.dataset.part); }
      else if (t.id === 'tb-level') { state.level = t.value; setUpControls(); }
      else if (t.id === 'tb-cc') state.cc = t.value;
      else if (t.id === 'tb-bq') state.bq = t.value;
      else if (t.id === 'tb-tok') state.tok = Number(t.value);
      else if (t.id === 'tb-nos') state.nos = Number(t.value);
      else if (t.name === 'tb-mode') state.mode = t.value;
      else if (t.id === 'tb-n1') setCount(1, t.value);
      else if (t.id === 'tb-n2') setCount(2, t.value);
      else if (t.dataset.pick) {
        const which = Number(t.dataset.pick);
        const pool = which === 1 ? data.p1 : data.p2;
        let ids = which === 1 ? state.q1 : state.q2;
        if (t.checked && ids.length >= (which === 1 ? MAX1 : MAX2)) { t.checked = false; return; }
        ids = t.checked ? ids.concat(t.value).sort(byOrder(pool)) : ids.filter((id) => id !== t.value);
        if (which === 1) state.q1 = ids; else state.q2 = ids;
      } else if (t.id === 'tb-topic') return;
      syncControls();
      draw();
    });
    $('tb-reroll').addEventListener('click', () => {
      state.q1 = randomSet(data.p1, state.q1.length);
      state.q2 = randomSet(data.p2, state.q2.length);
      draw();
    });
    $('student-sheet').addEventListener('click', (e) => {
      const b = e.target.closest('[data-swap]');
      if (!b) return;
      const which = Number(b.dataset.swap);
      const pool = which === 1 ? data.p1 : data.p2;
      const ids = which === 1 ? state.q1 : state.q2;
      const spare = shuffle(pool.filter((q) => !ids.includes(q.id)));
      if (!spare.length) { b.textContent = 'No other questions to swap in'; return; }
      const next = ids.map((id) => (id === b.dataset.id ? spare[0].id : id));
      if (which === 1) state.q1 = next; else state.q2 = next;
      draw();
    });
    const tabs = [['tab-student', 'student-sheet'], ['tab-teacher', 'teacher-sheet']];
    tabs.forEach(([tab, panel]) => $(tab).addEventListener('click', () => {
      tabs.forEach(([t2, p2]) => { $(t2).setAttribute('aria-selected', String(t2 === tab)); $(p2).classList.toggle('is-hidden', p2 !== panel); });
    }));
    const print = async (which) => {
      await ready; // equations and diagrams must be drawn before printing
      document.body.dataset.print = which;
      const name = `${data.topic} ${data.title} ${which === 'student' ? 'revision sheet' : 'teacher notes'}`;
      const old = document.title;
      document.title = name; // most browsers suggest the title as the PDF's file name
      window.print();
      document.title = old;
    };
    window.addEventListener('afterprint', () => { delete document.body.dataset.print; });
    $('tb-print-student').addEventListener('click', () => print('student'));
    $('tb-print-teacher').addEventListener('click', () => print('teacher'));
    $('tb-copy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(location.href); $('tb-copied').textContent = 'Link copied.'; }
      catch (e) { $('tb-copied').textContent = 'Copy the address from the address bar.'; }
      setTimeout(() => { $('tb-copied').textContent = ''; }, 4000);
    });
  }

  async function openTopic() {
    $('tb-status').textContent = 'Loading…';
    try {
      data = await loadTopic(state.topic);
      setUpControls();
      $('tb-status').textContent = '';
      await draw();
    } catch (e) {
      console.error(e);
      $('tb-status').innerHTML = `<p class="notice">This sheet couldn't be built (${esc(e.message)}). If you opened the page straight from your computer, use the preview server instead.</p>`;
    }
  }

  async function start() {
    // ?print=student or ?print=teacher shows that sheet in print layout (for testing the PDF without the print window)
    if (['student', 'teacher'].includes(params.get('print'))) document.body.dataset.print = params.get('print');
    let topics = [];
    try { topics = (await json('index.json')).topics; } catch (e) { $('tb-status').innerHTML = '<p class="notice">The list of subtopics couldn\'t be loaded.</p>'; return; }
    const titles = Object.fromEntries((window.SYLLABUS || []).flatMap((t) => t.topics).map((t) => [t.id, t.title]));
    if (!topics.includes(state.topic)) state.topic = topics[0];
    $('tb-topic').innerHTML = topics.map((t) => `<option value="${esc(t)}">${esc(t)} ${esc(titles[t] || '')}</option>`).join('');
    $('tb-topic').value = state.topic;
    wire();
    await openTopic();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
