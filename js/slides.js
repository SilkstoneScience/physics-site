// Lesson slide generator for teachers (teachers/slides.html). Plan and decisions: docs/SLIDES_PLAN.md.
// A teacher picks a subtopic, ticks curriculum points and slide types, and downloads a PowerPoint deck.
// Everything happens in the browser: nothing is uploaded.
//   - teachers/slides/<topic>.json: curriculum points, aims, minutes, bullets, key equations, worked examples
//   - teachers/<topic>.json: ToK and NoS prompts, videos (the revision sheet builder's files)
//   - themes/<topic>.html: diagrams; think/concepts.json: concept challenges; questions/*.json: quick checks
// Equations become PowerPoint equations (js/omml.js) with a picture of each one for other viewers (MathJax SVG -> PNG).
// The .pptx itself is written by js/pptx.js.
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const TYPES = [
    ['c', 'Hook: a concept challenge', 'straight after the title slide'],
    ['a', 'Aims', 'built from the ticked points'],
    ['b', 'Bullet-point slides', ''],
    ['e', 'Key equations', ''],
    ['r', 'Derivations', 'how equations are derived, step by step'],
    ['d', 'Diagrams', 'from the topic page'],
    ['w', 'Worked examples', 'question slide, then the solution step by step'],
    ['q', 'Quick checks', 'one Paper 1A question per point from the question bank, then the answer'],
    ['p', 'Paper 2 questions', 'choose them below; near the end of the deck, then the mark scheme'],
    ['t', 'ToK questions', 'discussion prompts in the speaker notes'],
    ['n', 'Nature of science', ''],
    ['v', 'Learn more: videos', ''],
  ];
  const DEFAULT_TYPES = TYPES.map((t) => t[0]).filter((t) => t !== 'p' && t !== 'c'); // the hook and Paper 2 questions start unticked (teacher's decision)
  const THEME_COLOURS = { A: '1f5fbf', B: 'c2561a', C: '0f8077', D: '7b3fbf', E: '2e7d32' };
  // Light colours for drawing diagrams into pictures, whatever the page's own theme (the same as the print colours)
  const LIGHT = { '--bg': '#ffffff', '--surface': '#ffffff', '--text': '#1c2430', '--muted': '#4a5464', '--border': '#c9d0da', '--accent': '#1f5fbf', '--accent-soft': '#e6eefb',
    '--good': '#1e7a46', '--good-soft': '#e3f4ea', '--bad': '#b3261e', '--bad-soft': '#fbe9e7', '--warn-soft': '#fff6dc',
    '--theme-a': '#1f5fbf', '--theme-b': '#c2561a', '--theme-c': '#0f8077', '--theme-d': '#7b3fbf', '--theme-e': '#2e7d32' };

  const cache = new Map();
  const get = (url, kind = 'json') => {
    if (!cache.has(url)) cache.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error(`${url}: ${r.status}`); return kind === 'json' ? r.json() : r.text(); }));
    return cache.get(url);
  };
  const optional = (p) => p.catch((e) => { console.warn(e); return null; });
  const slugOf = (topic) => topic.replace('.', '').toLowerCase();

  // ---------- State (kept in the page address, so a link rebuilds the same choices) ----------
  const params = new URLSearchParams(location.search);
  const state = {
    topic: params.get('topic') || 'A.1',
    points: params.has('points') ? new Set(params.get('points').split(',').filter(Boolean)) : null,
    types: new Set(params.has('types') ? params.get('types').split('') : DEFAULT_TYPES),
    hook: params.get('hook'),                                   // the concept challenge used as the hook
    hookTalk: params.get('hooktalk') === '1',                   // an oracy discussion of the hook (and a revisit at the end)
    tokTalk: params.get('toktalk') === '1',                     // an oracy discussion of one ToK question
    tokQ: Math.max(0, parseInt(params.get('tokq'), 10) || 0),   // which one (its place in the topic's list)
    p2: new Set((params.get('p2') || '').split(',').filter(Boolean)), // Paper 2 questions chosen by the teacher
  };
  let concepts = [], paper2 = [], tokQuestions = [];
  let data = null;
  function save() {
    const p = new URLSearchParams();
    p.set('topic', state.topic);
    if (data && state.points.size !== data.points.length) p.set('points', data.points.filter((pt) => state.points.has(pt.id)).map((pt) => pt.id).join(','));
    const order = TYPES.map((t) => t[0]).filter((t) => state.types.has(t)).join('');
    if (order !== DEFAULT_TYPES.join('')) p.set('types', TYPES.map((t) => t[0]).filter((t) => state.types.has(t)).join(''));
    if (state.types.has('c')) {
      if (state.hook) p.set('hook', state.hook);
      if (state.hookTalk) p.set('hooktalk', '1');
    }
    if (state.types.has('t') && state.tokTalk) { p.set('toktalk', '1'); if (state.tokQ) p.set('tokq', state.tokQ); }
    if (state.p2.size) p.set('p2', [...state.p2].join(','));
    history.replaceState(null, '', '?' + p.toString().replace(/%2C/g, ','));
  }

  // ---------- The form ----------
  function minutesText(m) {
    const h = Math.floor(m / 60), r = m % 60;
    return h ? `${h} h${r ? ` ${r} min` : ''}` : `${r} min`;
  }
  function topicInfo(topic) {
    for (const t of window.SYLLABUS) for (const s of t.topics) if (s.id === topic) return { ...s, theme: t };
    return null;
  }
  async function init() {
    const index = await get('slides/index.json');
    const sel = $('sl-topic');
    sel.innerHTML = window.SYLLABUS.map((t) => `<optgroup label="Theme ${t.id}: ${esc(t.title)}">${t.topics.map((s) => {
      const ready = index.topics.includes(s.id);
      return `<option value="${s.id}"${ready ? '' : ' disabled'}>${s.id} ${esc(s.title)}${ready ? '' : ' (coming soon)'}</option>`;
    }).join('')}</optgroup>`).join('');
    if (!index.topics.includes(state.topic)) state.topic = index.topics[0];
    sel.value = state.topic;
    sel.addEventListener('change', () => { state.topic = sel.value; state.points = null; state.hook = null; state.p2.clear(); loadTopic(); });
    // the hook and the Paper 2 questions have their own choices under their tick boxes
    const sub = {
      c: '<div class="sl-sub" data-for="c"><label>Concept challenge <select id="sl-hook"></select></label>'
        + ' <a id="sl-hook-read" target="_blank" rel="noopener">Read this challenge (opens in a new tab)</a>'
        + '<p class="tb-avail sl-hook-note">The answer comes near the end of the deck, on a "Back to the hook" slide.</p>'
        + `<label class="sl-talk"><input type="checkbox" id="sl-hooktalk"${state.hookTalk ? ' checked' : ''}> Discuss the hook (oracy) <span class="tb-avail">(students explain their answers after the hook; at the end, a short "I used to think… now I think…" discussion comes before the answer)</span></label></div>`,
      p: '<div class="sl-sub" data-for="p" id="sl-p2"></div>',
      t: '<div class="sl-sub" data-for="t">'
        + `<label class="sl-talk"><input type="checkbox" id="sl-toktalk"${state.tokTalk ? ' checked' : ''}> Discuss a ToK question (oracy) <span class="tb-avail">(agree, build, challenge in groups of three: one extra slide after the ToK slide)</span></label>`
        + '<label class="sl-tokq" id="sl-tokq-box">Question <select id="sl-tokq"></select></label></div>',
    };
    $('sl-types').innerHTML = TYPES.map(([k, label, note]) => `<div class="sl-type${sub[k] ? ' wide' : ''}"><label><input type="checkbox" data-type="${k}"${state.types.has(k) ? ' checked' : ''}> ${esc(label)}${note ? ` <span class="tb-avail">(${esc(note)})</span>` : ''}</label>${sub[k] || ''}</div>`).join('');
    $('sl-types').addEventListener('change', (e) => {
      if (e.target.id === 'sl-hook') { state.hook = e.target.value; hookLink(); update(); return; }
      if (e.target.id === 'sl-toktalk') { state.tokTalk = e.target.checked; update(); return; }
      if (e.target.id === 'sl-tokq') { state.tokQ = +e.target.value; update(); return; }
      if (e.target.id === 'sl-hooktalk') {
        state.hookTalk = e.target.checked;
        update(); return;
      }
      if (e.target.dataset.p2) { if (e.target.checked) state.p2.add(e.target.dataset.p2); else state.p2.delete(e.target.dataset.p2); update(); return; }
      const k = e.target.dataset.type;
      if (!k) return;
      if (e.target.checked) state.types.add(k); else state.types.delete(k);
      update();
    });
    $('sl-points').addEventListener('change', (e) => {
      const id = e.target.dataset.point;
      if (!id) return;
      if (e.target.checked) state.points.add(id); else state.points.delete(id);
      update();
    });
    $('sl-all').addEventListener('click', () => { state.points = new Set(data.points.map((p) => p.id)); drawPoints(); update(); });
    $('sl-none').addEventListener('click', () => { state.points = new Set(); drawPoints(); update(); });
    $('sl-download').addEventListener('click', download);
    loadTopic();
  }
  async function loadTopic() {
    $('sl-status').textContent = 'Loading…';
    data = await get(`slides/${slugOf(state.topic)}.json`);
    if (!state.points) state.points = new Set(data.points.map((p) => p.id));
    const [cc, qs, teacher] = await Promise.all([optional(get('../think/concepts.json')), optional(allQuestions()), optional(get(`${slugOf(state.topic)}.json`))]);
    concepts = cc || [];
    tokQuestions = Object.keys(teacher?.tokPrompts || {});
    if (state.tokQ >= tokQuestions.length) state.tokQ = 0;
    $('sl-tokq').innerHTML = tokQuestions.map((q, i) => `<option value="${i}">${esc(q)}</option>`).join('');
    $('sl-tokq').value = String(state.tokQ);
    paper2 = (qs || []).filter((q) => q.topic === state.topic && q.paper === '2');
    drawPoints();
    drawHook();
    drawPaper2();
    $('sl-status').textContent = '';
    update();
  }
  function drawPoints() {
    $('sl-points').innerHTML = data.points.map((p) => `<label class="sl-point"><input type="checkbox" data-point="${p.id}"${state.points.has(p.id) ? ' checked' : ''}>`
      + `<span><strong>${esc(p.short)}</strong> <span class="sl-min">${minutesText(p.minutes)}</span><br><span class="sl-guide">${p.extra ? '<span class="tag">Not in the guide\'s A.1 list</span> ' : ''}${esc(p.guide)}</span></span></label>`).join('');
  }
  // The hook: every concept challenge in the subtopic's theme, this subtopic's first
  function drawHook() {
    const theme = state.topic[0];
    const topics = [state.topic, ...[...new Set(concepts.map((c) => c.topic))].filter((t) => t[0] === theme && t !== state.topic).sort()];
    const sel = $('sl-hook');
    sel.innerHTML = topics.map((t) => {
      const list = concepts.filter((c) => c.topic === t);
      return list.length ? `<optgroup label="${t} ${esc(topicInfo(t)?.title || '')}">${list.map((c) => `<option value="${c.id}">${esc(c.title)}${c.level === 'HL' ? ' (HL)' : ''}</option>`).join('')}</optgroup>` : '';
    }).join('');
    if (!concepts.some((c) => c.id === state.hook)) state.hook = defaultHook();
    sel.value = state.hook || '';
    hookLink();
  }
  // so the teacher can read the whole challenge (question, answer, misconceptions) before choosing it
  function hookLink() {
    const a = $('sl-hook-read');
    const cc = concepts.find((c) => c.id === state.hook);
    a.hidden = !cc;
    if (cc) a.href = `../think/concepts.html?topic=${encodeURIComponent(cc.topic)}#${cc.id}`;
  }
  // the challenge suggested for the first ticked point, or else this subtopic's first
  function defaultHook() {
    const p = data.points.find((x) => state.points.has(x.id) && x.challenge) || data.points.find((x) => x.challenge);
    return p?.challenge || concepts.find((c) => c.topic === state.topic)?.id || null;
  }
  // Paper 2 questions often cover several points, so the teacher chooses them
  const p2Marks = (q) => q.parts.reduce((n, x) => n + (x.marks || 0), 0);
  function drawPaper2() {
    const box = $('sl-p2');
    for (const id of [...state.p2]) if (!paper2.some((q) => q.id === id)) state.p2.delete(id);
    if (!paper2.length) { box.innerHTML = '<p class="tb-avail">No Paper 2 questions for this subtopic yet.</p>'; return; }
    box.innerHTML = paper2.map((q) => {
      const secs = new Set([...(q.sections || []), ...q.parts.flatMap((x) => x.sections || [])]);
      const covers = data.points.filter((p) => p.sections.some((x) => secs.has(x))).map((p) => p.short);
      const text = new DOMParser().parseFromString(q.stem, 'text/html').body.textContent.trim();
      const first = (text.match(/^[\s\S]*?[.?!](?=\s|$)/) || [text])[0];
      return `<label class="sl-point"><input type="checkbox" data-p2="${q.id}"${state.p2.has(q.id) ? ' checked' : ''}>`
        + `<span><strong>${q.id}</strong> <span class="sl-min">${p2Marks(q)} marks${q.level === 'HL' ? ' · HL' : ''}</span> <a href="../questions.html?topic=${q.topic}&amp;q=${q.id}" target="_blank" rel="noopener">see it in the question bank</a><br>`
        + `<span class="sl-guide">${esc(first)}${covers.length ? ` Covers: ${esc(covers.join(', '))}.` : ''}</span></span></label>`;
    }).join('');
    window.MathJax?.typesetPromise?.([box]).catch(() => {});
  }
  // about 2 minutes a mark: students answer it, then the class goes through the mark scheme
  const paper2Minutes = () => (state.types.has('p') ? paper2.filter((q) => state.p2.has(q.id)).reduce((n, q) => n + 2 * p2Marks(q), 0) : 0);
  // the hook discussion: about 8 minutes, and 4 more for coming back to it at the end
  // plus about 10 minutes for a ToK discussion
  const talkMinutes = () => (state.types.has('c') && state.hookTalk && state.hook ? 12 : 0) + (state.types.has('t') && state.tokTalk && tokQuestions.length ? 10 : 0);
  function update() {
    const chosen = data.points.filter((p) => state.points.has(p.id));
    const total = chosen.reduce((s, p) => s + p.minutes, 0);
    const extra = chosen.length ? paper2Minutes() : 0;
    const talk = chosen.length ? talkMinutes() : 0;
    const incl = [extra ? `about ${extra} min for the Paper 2 question${state.p2.size > 1 ? 's' : ''} (2 min a mark: answering, then the mark scheme)` : '', talk ? `about ${talk} min for the discussions (oracy)` : ''].filter(Boolean);
    $('sl-time').innerHTML = chosen.length
      ? `Estimated teaching time: <strong>${minutesText(total + extra + talk)}</strong> for ${chosen.length} of ${data.points.length} points${incl.length ? `, including ${incl.join(' and ')}` : ''}. The guide gives ${data.hours} hours for ${data.topic}${data.points.some((p) => p.extra) ? ', not counting the extra point' : ''}.`
      : 'Tick at least one curriculum point.';
    document.querySelectorAll('.sl-sub').forEach((el) => { el.hidden = !state.types.has(el.dataset.for); });
    $('sl-tokq-box').hidden = !state.tokTalk || !tokQuestions.length;
    $('sl-download').disabled = !chosen.length;
    save();
  }

  // ---------- Turning the site's text (HTML with $…$ maths) into slide paragraphs ----------
  const problems = new Set();   // anything the equation converter couldn't handle
  const mathCache = new Map();
  async function ready() {
    if (!window.MathJax?.startup?.promise) throw new Error('MathJax has not loaded');
    await window.MathJax.startup.promise;
  }
  function toMml(latex, display) {
    const mml = window.MathJax.tex2mml(latex, { display });
    const doc = new DOMParser().parseFromString(mml, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('MathML for ' + latex);
    return doc.documentElement;
  }
  // An equation inside a line of text
  function inlineMath(latex, size) {
    const key = `i|${size}|${latex}`;
    if (!mathCache.has(key)) {
      const el = toMml(latex, false);
      const { omml, problems: p } = window.Omml.fromMathML(el, { size });
      p.forEach((x) => problems.add(`${x} in $${latex}$`));
      for (const c of window.Omml.unsupported(latex)) problems.add(`${c} in $${latex}$`);
      mathCache.set(key, { omml, plain: window.Omml.plainText(el) });
    }
    return mathCache.get(key);
  }
  // A displayed equation, with its picture
  async function displayMath(latex, size = 2400) {
    const key = `d|${size}|${latex}`;
    if (!mathCache.has(key)) {
      const el = toMml(latex, true);
      const { omml, problems: p } = window.Omml.fromMathML(el, { size, display: true });
      p.forEach((x) => problems.add(`${x} in $$${latex}$$`));
      for (const c of window.Omml.unsupported(latex)) problems.add(`${c} in $$${latex}$$`);
      const plain = window.Omml.plainText(el);
      let png = null, wIn = 0, hIn = 0;
      try {
        const node = window.MathJax.tex2svg(latex, { display: true, containerWidth: 100000 });
        const svg = node.querySelector('svg');
        const ex = (v) => parseFloat(v) || 0;
        const ptPerEx = 0.442 * size / 100; // MathJax sizes its pictures in ex; an ex is about 0.442 of the font size
        wIn = ex(svg.getAttribute('width')) * ptPerEx / 72;
        hIn = ex(svg.getAttribute('height')) * ptPerEx / 72;
        const dpi = 220;
        svg.setAttribute('width', Math.round(wIn * dpi));
        svg.setAttribute('height', Math.round(hIn * dpi));
        svg.removeAttribute('style');
        const text = new XMLSerializer().serializeToString(svg).replace(/currentColor/g, '#1C2430');
        png = await svgToPng(text, Math.round(wIn * dpi), Math.round(hIn * dpi));
      } catch (e) { console.warn('No picture for', latex, e); }
      mathCache.set(key, { omml, plain, png, wIn, hIn });
    }
    return mathCache.get(key);
  }
  function runsOf(text, style, size) {
    const out = [];
    String(text).split(/(\$[^$]+\$)/).forEach((part) => {
      if (!part) return;
      if (/^\$[^$]+\$$/.test(part)) out.push({ m: inlineMath(part.slice(1, -1), size) });
      else out.push({ t: part.replace(/\s+/g, ' '), ...style });
    });
    return out;
  }
  // HTML (or plain text) -> paragraphs. Block elements (p, li, br) start new paragraphs.
  function paras(html, { size = 2400, bullet = true, level = 0 } = {}) {
    const root = new DOMParser().parseFromString(`<div>${html ?? ''}</div>`, 'text/html').body.firstChild;
    const out = [];
    let cur = null;
    const start = (opts = {}) => { cur = { runs: [], bullet, level, ...opts }; out.push(cur); };
    let depth = 0; // how deeply lists are nested
    const walk = (node, style, inList) => {
      for (const n of node.childNodes) {
        if (n.nodeType === 3) {
          if (!n.textContent.trim() && !cur) continue;
          if (!cur) start(inList ? { bullet: true, level: level + Math.max(0, depth - 1) } : {});
          cur.runs.push(...runsOf(n.textContent, style, size));
          continue;
        }
        if (n.nodeType !== 1) continue;
        const tag = n.localName;
        if (tag === 'p' || tag === 'div') { cur = null; walk(n, style, inList); cur = null; }
        else if (tag === 'br') { cur = null; }
        else if (tag === 'ul' || tag === 'ol') { cur = null; depth++; walk(n, style, true); depth--; cur = null; }
        else if (tag === 'li') { start({ bullet: true, level: level + Math.max(0, depth - 1) }); walk(n, style, inList); cur = null; }
        else {
          const s = { ...style };
          if (tag === 'strong' || tag === 'b') s.b = true;
          if (tag === 'em' || tag === 'i') s.i = true;
          if (tag === 'sup') s.sup = true;
          if (tag === 'sub') s.sub = true;
          if (n.classList?.contains('key-1')) { s.color = 'accent1'; s.b = true; }
          if (n.classList?.contains('key-2')) { s.color = 'orange'; s.b = true; }
          if (n.classList?.contains('tag')) continue; // little tags such as "New for 2028" don't belong on a slide
          walk(n, s, inList);
        }
      }
    };
    walk(root, {}, false);
    out.forEach((p) => { // tidy the spaces at each end
      const first = p.runs[0], last = p.runs[p.runs.length - 1];
      if (first?.t) first.t = first.t.replace(/^\s+/, '');
      if (last?.t) last.t = last.t.replace(/\s+$/, '');
    });
    return out.filter((p) => p.runs.some((r) => r.m || r.t));
  }
  // A list of bullets from the data file: strings, with an array for sub-bullets under the one before
  function bulletParas(list, size = 2400) {
    const out = [];
    for (const item of list || []) {
      if (Array.isArray(item)) item.forEach((s) => out.push(...paras(s, { size: size - 400, level: 1 })));
      else out.push(...paras(item, { size }));
    }
    return out;
  }
  const notes = (...texts) => texts.filter(Boolean).flatMap((t) => paras(t, { bullet: false }));

  // ---------- Making text fit ----------
  // PowerPoint only shrinks text to fit when someone edits it, so the generator estimates the space text needs
  // (Arial: an average character is about 0.53 of the font size wide) and picks the largest size that fits.
  const textLength = (html) => String(html ?? '').replace(/<[^>]+>/g, '').replace(/\$([^$]*)\$/g, (m, x) => x.replace(/\\(text|mathrm)\{([^}]*)\}/g, '$2').replace(/\\[a-zA-Z]+|[{}^_\\]/g, '')).length;
  function linesNeeded(texts, widthIn, sizePt) {
    const perLine = Math.max(10, Math.floor(widthIn * 72 / (sizePt * 0.53)));
    return texts.reduce((n, t) => n + Math.max(1, Math.ceil(textLength(t) / perLine)), 0);
  }
  function fitSize(texts, widthIn, heightIn, sizes = [2400, 2200, 2000, 1800]) {
    for (const sz of sizes) {
      const pt = sz / 100;
      const h = (linesNeeded(texts, widthIn, pt) * pt * 1.2 + texts.length * 7) / 72; // line height plus space between paragraphs
      if (h <= heightIn) return sz;
    }
    return null; // doesn't fit even at the smallest size
  }
  const blocks = (html) => { // one string per paragraph of an HTML snippet
    const d = new DOMParser().parseFromString(`<div>${html ?? ''}</div>`, 'text/html').body.firstChild;
    const out = [];
    d.querySelectorAll('p, li').forEach((el) => { if (!el.querySelector('p, li')) out.push(el.innerHTML); });
    return out.length ? out : [d.innerHTML];
  };
  // Text beside a diagram: the narrowest text column (so the largest picture) that fits at 22 or 20 pt
  function besideDiagram(texts, bullets = false) {
    const indent = bullets ? 0.4 : 0;
    for (const textW of [4.73, 5.6, 6.5]) {
      const size = fitSize(texts, textW - indent, 5.15, [2200, 2000]);
      if (size) return { textW, size };
    }
    return { textW: 6.5, size: 1800 };
  }
  // "Up or down?" + "the answer" -> "Up or down? The answer"; "A lift ride" + "solution" -> "A lift ride: solution"
  const suffix = (title, word) => (/[?!.]$/.test(title) ? `${title} ${word[0].toUpperCase()}${word.slice(1)}` : `${title}: ${word}`);

  // ---------- Pictures ----------
  async function svgToPng(svgText, w, h) {
    const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
    try {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('picture failed')); img.src = url; });
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
      return new Uint8Array(await blob.arrayBuffer());
    } finally { URL.revokeObjectURL(url); }
  }
  // Draw an SVG diagram (from a topic page or a concept challenge) in the site's light colours, as a PNG
  async function diagramPng(svgEl, alt) {
    const host = $('sl-render');
    Object.entries(LIGHT).forEach(([k, v]) => host.style.setProperty(k, v));
    host.innerHTML = '<figure class="diagram"></figure>';
    const svg = document.importNode(svgEl, true);
    host.firstChild.appendChild(svg);
    const props = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'opacity',
      'font-size', 'font-family', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'letter-spacing', 'visibility', 'display'];
    const inline = (el) => {
      const cs = getComputedStyle(el);
      el.setAttribute('style', props.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';'));
    };
    const all = [svg, ...svg.querySelectorAll('*')];
    all.forEach(inline);
    // the arrowheads (#ah1, #ah2, #ah3) live in this page's own <defs>: copy the ones used
    const ids = new Set();
    all.forEach((el) => ['marker-start', 'marker-mid', 'marker-end'].forEach((a) => { const m = (el.getAttribute(a) || '').match(/url\(#([^)]+)\)/); if (m) ids.add(m[1]); }));
    if (ids.size) {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      ids.forEach((id) => {
        const src = document.getElementById(id);
        if (!src) return;
        const m = src.cloneNode(true);
        host.querySelector('figure').appendChild(m); // inside the light-coloured host, so var() colours resolve
        m.querySelectorAll('*').forEach((el) => { const f = getComputedStyle(el).getPropertyValue('fill'); el.setAttribute('style', `fill:${f}`); });
        defs.appendChild(m);
      });
      svg.insertBefore(defs, svg.firstChild);
    }
    svg.querySelectorAll('title, desc').forEach((t) => t.remove());
    const vb = (svg.getAttribute('viewBox') || '0 0 400 300').split(/[\s,]+/).map(Number);
    const w = 1500, h = Math.round(w * vb[3] / vb[2]);
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const text = new XMLSerializer().serializeToString(svg);
    host.innerHTML = '';
    return { png: await svgToPng(text, w, h), w, h, alt };
  }
  async function photoPng(src, alt) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
    const w = Math.min(1400, img.naturalWidth), h = Math.round(w * img.naturalHeight / img.naturalWidth);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    return { png: new Uint8Array(await blob.arrayBuffer()), w, h, alt };
  }
  async function figureFromPage(page, titleId) {
    const t = page.getElementById(titleId);
    const fig = t?.closest('figure');
    if (!fig) { problems.add(`diagram #${titleId} isn't on the topic page`); return null; }
    const svg = fig.querySelector('svg');
    const image = await diagramPng(svg, t.textContent.trim());
    const cap = fig.querySelector('figcaption');
    return { image, caption: cap ? cap.innerHTML : '' };
  }
  // Question-bank diagrams are complete SVG files with their own colours
  async function questionFigure(path, alt) {
    const text = await get(`../${path}`, 'text');
    const vb = (text.match(/viewBox="([^"]+)"/) || [, '0 0 400 300'])[1].split(/[\s,]+/).map(Number);
    const w = 1500, h = Math.round(w * vb[3] / vb[2]);
    const sized = text.replace(/<svg\b/, `<svg width="${w}" height="${h}"`);
    return { png: await svgToPng(sized, w, h), w, h, alt };
  }
  async function thinkFigure(f) {
    if (!f) return null;
    if (f.svg) {
      const text = await get(`../think/${f.svg}`, 'text');
      const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
      return diagramPng(svg, f.alt);
    }
    if (f.img) return photoPng(new URL(f.img, new URL('../think/', location.href)).href, f.alt);
    return null;
  }

  // ---------- Building the deck ----------
  const LETTERS = 'ABCD';
  function chunk(list, n) { const out = []; for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n)); return out; }

  function allQuestions() {
    return get('../questions/index.json')
      .then((idx) => Promise.all((idx.files || idx).map((f) => optional(get(`../questions/${typeof f === 'string' ? f : f.file}`)))))
      .then((files) => files.flat().filter(Boolean));
  }
  // A concept challenge: the question slide, and the answer slide
  async function challengeSlides(cc) {
    const image = await optional(thinkFigure(cc.figure));
    const right = cc.type === 'choice' ? cc.options[cc.answer] : '';
    const shown = blocks(cc.reveal).slice(0, right ? 1 : 2);
    const kind = image ? 'diagram' : 'question';
    const fitQ = image ? besideDiagram([...blocks(cc.question), ...(cc.options || [])]) : { size: fitSize([...blocks(cc.question), ...(cc.options || [])], 10.6, 5.2) || 1800 };
    const fitA = image ? besideDiagram([right, ...shown].filter(Boolean)) : { size: fitSize([right, ...shown].filter(Boolean), 10.6, 5.2) || 1800 };
    const opts = (cc.options || []).map((o, i) => ({ runs: [{ t: `${LETTERS[i]}  `, b: true, color: 'accent1' }, ...runsOf(o, {}, fitQ.size)], bullet: false, spaceBefore: 6 }));
    // Oracy (only when the teacher ticks "Discuss the hook"): multiple-choice challenges use four corners, open ones think-pair-share
    let talk = null, revisit = null;
    if (state.hookTalk) {
      const choice = cc.type === 'choice';
      const how = choice
        ? 'Four corners: go to the corner of the room for your answer (A, B, C or D). Agree on your best reason, then explain it to someone from another corner.'
        : 'Think, pair, share: write down your prediction and one reason. Explain it to a partner, then agree on the best explanation to share with the class.';
      const starters = ['I chose this because …', 'I agree with …, and I would add …', 'I disagree with …, because …', 'I\'ve changed my mind, because …'];
      const texts = [how, ...starters];
      const fit = image ? besideDiagram(texts) : { size: fitSize(texts, 11.6, 5.0) || 1800 };
      talk = { kind: image ? 'diagram' : 'content', image, ...fit, title: `Talk about it: ${cc.title}`,
        paras: [...paras(`<strong>${how}</strong>`, { size: fit.size, bullet: false }), ...starters.flatMap((x) => paras(x, { size: fit.size }))],
        notes: notes(`About 8 minutes. ${choice ? 'Students go to the corner for the answer they chose.' : 'Students commit to a written prediction first, so everyone has something to say.'} Don't confirm or reject any answer yet: the class comes back to it at the end of the deck.`,
          cc.tempting ? `Listen for these misconceptions: ${cc.tempting}` : '') };
      {
        const back = ['I used to think … , but now I think … , because …', 'I still think … , because …', 'What changed my mind was …'];
        const fitB = image ? besideDiagram(['In pairs: has your answer changed since the start?', ...back]) : { size: 2400 };
        revisit = { kind: image ? 'diagram' : 'content', image, ...fitB, title: `Back to the hook: ${cc.title}`,
          paras: [...paras('<strong>In pairs: has your answer changed since the start? Use one of these:</strong>', { size: fitB.size, bullet: false }), ...back.flatMap((x) => paras(x, { size: fitB.size }))],
          notes: notes('About 4 minutes. Ask a few pairs to share, especially anyone whose answer changed, before showing the answer on the next slide.') };
      }
    }
    return {
      talk, revisit,
      question: { kind, image, ...fitQ, title: `Hook: ${cc.title}`, paras: [...paras(cc.question, { size: fitQ.size, bullet: false }), ...opts],
        notes: notes('Ask students to commit to an answer (show of hands or mini-whiteboards) before moving on.',
          'Don\'t give the answer yet: the class comes back to it at the end of the deck ("Back to the hook"). Students could write down their answer and a reason, and see whether they would change it as the lessons go on.') },
      answer: {
        kind, image, ...fitA, title: revisit ? suffix(cc.title, 'the answer') : `Back to the hook: ${cc.title}`,
        paras: [...(right ? [{ runs: [{ t: `${LETTERS[cc.answer]}  `, b: true, color: 'good' }, ...runsOf(right, { b: true, color: 'good' }, fitA.size)], bullet: false }] : []),
          ...shown.flatMap((h) => paras(h, { size: fitA.size, bullet: false }))],
        notes: notes('Before showing the answer, ask students whether they would change the answer they gave at the start, and why.', cc.reveal, cc.tempting ? `Clearing misconceptions: ${cc.tempting}` : ''),
      },
    };
  }
  // A Paper 2 question: the stem and parts (over as many slides as they need), then the mark scheme
  async function paper2Slides(q, n) {
    const image = q.diagram ? await optional(questionFigure(q.diagram, q.diagramAlt)) : null;
    const name = n ? `Paper 2 question ${n}` : 'Paper 2 question';
    const marks = p2Marks(q);
    // the largest text that fits: beside the picture, or across the slide
    // (mark schemes are full of fractions and roots, which make lines taller, so they get less height)
    const fit = (texts, wide, pic, smallest = 1800, high = 5.2) => {
      const sizes = [2400, 2200, 2000, 1800].filter((x) => x >= smallest && (!pic || x <= 2200));
      if (pic) {
        for (const textW of [4.73, 5.6, 6.5]) { const size = fitSize(texts, textW, high - 0.05, sizes); if (size) return { textW, size }; }
        return null;
      }
      const size = fitSize(texts, wide, high, sizes);
      return size ? { size } : null;
    };
    // as many groups of items on a slide as fit at 20 pt or more; a group that doesn't fit on its own gets a slide at 18 pt
    const pack = (groups, wide, pic, high) => {
      const out = [];
      let cur = [];
      for (const g of groups) {
        if (cur.length && !fit([...cur, ...g].map((x) => x.est || x.text), wide, pic, 2000, high)) { out.push(cur); cur = []; }
        cur.push(...g);
      }
      if (cur.length) out.push(cur);
      return out.map((items) => ({ items, fit: fit(items.map((x) => x.est || x.text), wide, pic, 1800, high) || (pic ? { textW: 6.5, size: 1800 } : { size: 1800 }) }));
    };
    const label = (p) => ({ t: `(${p.label})  `, b: true, color: 'accent1' });
    const join = (ps) => ps.flatMap((x, k) => (k ? [{ t: ' ' }, ...x.runs] : x.runs)); // a part's paragraphs as one line
    const stem = blocks(q.stem).map((h) => ({ text: h }));
    const parts = q.parts.map((p) => [{ text: `(${p.label}) ${p.question} [${p.marks}]`, part: p }]);
    const slides = [];
    const qGroups = pack([stem, ...parts], 10.6, !!image);
    qGroups.forEach((g, i) => slides.push({
      kind: image ? 'diagram' : 'question', image, ...g.fit, title: qGroups.length > 1 ? `${name} (${i + 1} of ${qGroups.length})` : name,
      paras: g.items.flatMap((it) => (it.part
        ? [{ runs: [label(it.part), ...join(paras(it.part.question, { size: g.fit.size, bullet: false })), { t: `  [${it.part.marks}]`, b: true }], bullet: false, spaceBefore: 9 }]
        : paras(it.text, { size: g.fit.size, bullet: false }))),
      notes: notes(i === 0 ? `Question ${q.id} from the site's question bank (questions.html?q=${q.id}): ${marks} marks, about ${Math.round(marks * 1.2)} minutes at exam pace. The mark scheme follows.` : ''),
    }));
    // the mark scheme, without the picture so there is room for the marking points
    const msGroups = pack(q.parts.map((p) => [{ text: `(${p.label}) [${p.marks}]`, head: p }, ...p.markscheme.map((m) => ({ text: m, est: m + 'x'.repeat(30 * (m.match(/\\d?frac|\\sqrt/g) || []).length) }))]), 11.2, false, 4.6);
    msGroups.forEach((g, i) => slides.push({
      kind: 'content', size: g.fit.size, title: `${name}: mark scheme${msGroups.length > 1 ? ` (${i + 1} of ${msGroups.length})` : ''}`,
      paras: g.items.flatMap((it) => (it.head
        ? [{ runs: [label(it.head), { t: `[${it.head.marks}]`, b: true }], bullet: false, spaceBefore: 9 }]
        : paras(it.text, { size: g.fit.size }))),
      notes: notes('One mark for each ✓. ECF means "error carried forward": a wrong answer from an earlier part, used correctly here, still earns the marks.'),
    }));
    return slides;
  }

  async function buildDeck() {
    await ready();
    problems.clear();
    const info = topicInfo(state.topic);
    const slug = slugOf(state.topic);
    const t = state.types;
    const [teacher, pageHtml, all] = await Promise.all([
      optional(get(`${slug}.json`)), optional(get(`../themes/${slug}.html`, 'text')), optional(allQuestions()),
    ]);
    const page = pageHtml ? new DOMParser().parseFromString(pageHtml, 'text/html') : null;
    const questions = (all || []).filter((q) => q.topic === state.topic && q.paper === '1A');
    const chosen = data.points.filter((p) => state.points.has(p.id));
    const total = chosen.reduce((s, p) => s + p.minutes, 0) + paper2Minutes() + talkMinutes();
    const hook = t.has('c') ? concepts.find((c) => c.id === state.hook) : null;
    const hookSlides = hook ? await challengeSlides(hook) : null;
    const slides = [];
    const status = (msg) => { $('sl-status').textContent = msg; };

    status('Writing the title and aims…');
    slides.push({
      kind: 'title',
      points: chosen.length > 6 ? paras(chosen.map((p) => p.short).join(' · '), { size: 2000, bullet: false }) : chosen.flatMap((p) => paras(p.short, { size: 2000 })),
      time: `Estimated teaching time: about ${minutesText(total)}`,
      notes: notes(`Curriculum points (IB DP Physics guide, ${data.topic}):`, ...chosen.map((p) => `• ${p.guide}`)),
    });
    // the hook comes straight after the title slide, before the aims
    if (hookSlides) {
      slides.push(hookSlides.question);
      if (hookSlides.talk) slides.push(hookSlides.talk);
    }
    if (t.has('a')) {
      const aims = chosen.flatMap((p) => p.aims);
      chunk(aims, 6).forEach((group, i, all) => slides.push({
        kind: 'aims', title: all.length > 1 ? `Aims (${i + 1} of ${all.length})` : 'Aims',
        paras: group.flatMap((a) => paras(a)),
        notes: notes(i === 0 ? `By the end of these lessons, students should be able to do the following. Estimated teaching time: about ${minutesText(total)}.` : ''),
      }));
    }

    for (const p of chosen) {
      status(`Writing "${p.short}"…`);
      for (const s of p.slides || []) {
        if (s.type === 'bullets' && t.has('b')) {
          slides.push({ kind: 'content', title: s.title, paras: bulletParas(s.bullets), notes: notes(s.notes) });
        } else if (s.type === 'equation' && t.has('e')) {
          const list = [].concat(s.latex);
          const eqs = [];
          for (const l of list) eqs.push(await displayMath(l, list.length > 1 ? 2800 : 3200));
          slides.push({ kind: 'equation', title: s.title, eqs, paras: bulletParas(s.bullets, 2200), notes: notes(s.notes) });
        } else if (s.type === 'diagram' && t.has('d') && page) {
          const fig = await figureFromPage(page, s.figure);
          if (!fig) continue;
          const texts = s.bullets ? s.bullets.flat() : blocks(fig.caption);
          const fit = besideDiagram(texts, !!s.bullets);
          const text = s.bullets ? bulletParas(s.bullets, fit.size) : paras(fig.caption, { size: fit.size, bullet: false });
          slides.push({ kind: 'diagram', title: s.title, image: fig.image, paras: text, ...fit, notes: notes(s.notes, s.bullets && fig.caption ? `Caption on the topic page: ${fig.caption}` : '') });
        } else if (s.type === 'worked' && t.has('w')) {
          // the worked-example pill on the layout already says "Worked example", so the title doesn't need to
          const title = s.title.replace(/^Worked example:\s*/i, '').replace(/^./, (c) => c.toUpperCase());
          const qSize = fitSize([s.question], 12.13, 5.0, [2800, 2400, 2200]) || 2200;
          slides.push({ kind: 'worked', title, question: paras(s.question, { size: qSize, bullet: false }), questionSize: qSize, steps: [],
            notes: notes(s.hint ? `Hint, if students are stuck: ${s.hint}` : '', 'The solution is on the next slide.') });
          // the solution slides repeat the question in smaller text, with the steps below it
          const q = paras(s.question, { size: 2000, bullet: false });
          const stepsTop = 1.55 + linesNeeded([s.question], 12.13, 20) * 20 * 1.2 / 72 + 0.3;
          const steps = [];
          for (const st of s.steps) steps.push({ paras: st.text ? paras(st.text, { size: 2000, bullet: false }) : [], eq: st.latex ? await displayMath(st.latex, 2400) : null });
          const perSlide = Math.max(2, Math.min(4, Math.floor((6.85 - stepsTop) / 0.85)));
          chunk(steps, perSlide).forEach((group, i, all) => slides.push({
            kind: 'worked', title: suffix(title, `solution${all.length > 1 ? ` (${i + 1} of ${all.length})` : ''}`),
            question: q, questionSize: 2000, stepsTop, steps: group.map((st, k) => ({ ...st, n: i * perSlide + k + 1 })), notes: notes(s.notes),
          }));
        } else if (s.type === 'derivation' && t.has('r')) {
          // what we start from, then numbered steps (each a reason and an equation), like a worked solution
          const top = paras(s.start, { size: 2000, bullet: false });
          const stepsTop = 1.55 + linesNeeded([s.start], 12.13, 20) * 20 * 1.2 / 72 + 0.3;
          const steps = [];
          for (const st of s.steps) steps.push({ paras: st.text ? paras(st.text, { size: 2000, bullet: false }) : [], eq: st.latex ? await displayMath(st.latex, 2400) : null });
          const perSlide = Math.max(2, Math.min(4, Math.floor((6.85 - stepsTop) / 0.85)));
          chunk(steps, perSlide).forEach((group, i, all) => slides.push({
            kind: 'derivation', title: all.length > 1 ? `${s.title} (${i + 1} of ${all.length})` : s.title,
            question: top, questionSize: 2000, stepsTop, steps: group.map((st, k) => ({ ...st, n: i * perSlide + k + 1 })), notes: notes(s.notes),
          }));
        }
      }
      if (t.has('q')) {
        const pick = (p.checks || []).map((id) => questions.find((q) => q.id === id)).filter(Boolean)[0]
          || questions.filter((q) => !q.diagram && p.sections.includes((q.sections || [])[0])).sort((a, b) => a.id.localeCompare(b.id))[0];
        if (pick) {
          const image = pick.diagram ? await optional(questionFigure(pick.diagram, pick.diagramAlt)) : null;
          const texts = [...blocks(pick.stem), ...pick.options];
          const fit = image ? besideDiagram(texts) : { size: fitSize(texts, 10.0, 5.2) || 1800 };
          const opt = (i, good) => ({ runs: [{ t: `${LETTERS[i]}${image ? '  ' : '\t'}`, b: true, color: good ? 'good' : 'accent1' }, ...runsOf(pick.options[i], good ? { b: true, color: 'good' } : {}, fit.size)], bullet: false, level: image ? 0 : 1, spaceBefore: 6 });
          const stem = paras(pick.stem, { size: fit.size, bullet: false });
          const kind = image ? 'diagram' : 'question';
          slides.push({ kind, image, ...fit, title: 'Quick check', paras: [...stem, ...pick.options.map((_, i) => opt(i, false))], notes: notes(`${p.short}: question ${pick.id} from the site's question bank (questions.html?q=${pick.id}).`) });
          slides.push({ kind, image, ...fit, title: 'Quick check: the answer', paras: [...stem, ...pick.options.map((_, i) => opt(i, i === pick.answer))], notes: notes(`Answer: ${LETTERS[pick.answer]}.`, pick.explanation) });
        }
      }
    }

    // near the end: the Paper 2 questions, then back to the hook
    if (t.has('p')) {
      const list = paper2.filter((q) => state.p2.has(q.id));
      for (const [i, q] of list.entries()) {
        status(`Writing Paper 2 question ${q.id}…`);
        slides.push(...await paper2Slides(q, list.length > 1 ? i + 1 : 0));
      }
    }
    if (hookSlides) {
      if (hookSlides.revisit) slides.push(hookSlides.revisit);
      slides.push(hookSlides.answer);
    }

    // Extras from the revision sheet builder's teacher file
    if (teacher) {
      status('Adding the extras…');
      const tokBox = page?.querySelector('section.tok');
      if (t.has('t') && teacher.tokPrompts) {
        const qs = Object.keys(teacher.tokPrompts);
        slides.push({ kind: 'content', title: 'Theory of knowledge', paras: qs.flatMap((q) => paras(`<strong>${q}</strong>`, { size: 2400, bullet: true })),
          notes: notes('Discussion prompts:', ...qs.flatMap((q) => [`${q}`, ...teacher.tokPrompts[q].map((x) => `• ${x}`)])) });
        // Oracy (only when the teacher ticks "Discuss a ToK question"): agree, build, challenge, in ToK's language of claims and counterclaims
        const q = state.tokTalk ? qs[state.tokQ] || qs[0] : null;
        if (q) {
          const how = 'Agree, build, challenge (groups of three): one of you makes a claim, the next agrees and builds on it with a reason or example, and the third challenges it with a counterclaim. Then swap roles.';
          const starters = ['One claim is …', 'Evidence for this is …', 'A counterclaim is …', 'It depends on …', 'In physics, we know this because …'];
          const size = fitSize([q, how, ...starters], 11.6, 5.0) || 1800;
          slides.push({ kind: 'content', size, title: 'Talk about it: theory of knowledge',
            paras: [...paras(`<strong>${q}</strong>`, { size, bullet: false }), ...paras(how, { size: size - 200, bullet: false }), ...starters.flatMap((x) => paras(x, { size }))],
            notes: notes('About 10 minutes. Each group should reach a claim, a counterclaim and a physics example for each, ready to share with the class.',
              'Prompts to move the discussion on:', ...teacher.tokPrompts[q].map((x) => `• ${x}`),
              'Listen for: claims backed by a physics example, counterclaims that are taken seriously rather than dismissed, and "it depends on…" answers that say what it depends on.') });
        }
      }
      if (t.has('n') && teacher.nosPrompts) {
        const aspects = Object.keys(teacher.nosPrompts);
        const text = (a) => {
          // the box has a paragraph per aspect, starting with the aspect in bold: <p><strong>Observations.</strong> …</p>
          const para = tokBox ? [...tokBox.querySelectorAll('p')].find((x) => x.querySelector('strong')?.textContent.replace(/[.:]\s*$/, '').trim() === a) : null;
          return para ? para.innerHTML.replace(/^\s*<strong>[\s\S]*?<\/strong>/, '').trim() : '';
        };
        const firstSentence = (h) => { const m = h.match(/^[\s\S]*?[.?!](?=\s|$)/); return m ? m[0] : h; };
        slides.push({ kind: 'content', title: 'Nature of science',
          paras: aspects.flatMap((a) => [...paras(`<strong>${a}</strong>`, { size: 2400 }), ...(text(a) ? paras(firstSentence(text(a)), { size: 2000, level: 1 }) : [])]),
          notes: notes(...aspects.flatMap((a) => [`${a}: ${text(a).replace(/<[^>]+>/g, '')}`, ...teacher.nosPrompts[a].map((x) => `• ${x}`)])) });
      }
      if (t.has('v') && teacher.videos?.length) {
        slides.push({ kind: 'content', title: 'Learn more: videos',
          paras: teacher.videos.flatMap((v) => [{ runs: [{ t: v.title, b: true }, { t: ` (${v.channel})` }], bullet: true },
            { runs: [{ t: `youtube.com/watch?v=${v.youtube}`, color: 'accent1', link: `https://www.youtube.com/watch?v=${v.youtube}` }], bullet: true, level: 1 }]),
          notes: notes(...teacher.videos.map((v) => `${v.title}: ${v.use}`)) });
      }
    }
    return {
      deck: { code: state.topic, title: info.title, theme: info.theme.title, color: THEME_COLOURS[info.theme.id], slides },
      problems: [...problems],
    };
  }

  async function download() {
    const btn = $('sl-download');
    btn.disabled = true;
    try {
      const { deck, problems: p } = await buildDeck();
      $('sl-status').textContent = 'Making the PowerPoint file…';
      const bytes = window.Pptx.build(deck);
      window.Pptx.download(bytes, `${deck.code} ${deck.title} (slides).pptx`);
      $('sl-status').textContent = `Done: ${deck.slides.length} slides.` + (p.length ? ` Some equations may not look right: ${p.join('; ')}.` : '');
    } catch (e) {
      console.error(e);
      $('sl-status').textContent = `Sorry, something went wrong: ${e.message}`;
    } finally { btn.disabled = false; }
  }

  // For testing: build a deck and return its bytes without downloading it
  window.SlidesBuilder = { buildDeck, build: async () => { const r = await buildDeck(); return { bytes: window.Pptx.build(r.deck), ...r }; } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
