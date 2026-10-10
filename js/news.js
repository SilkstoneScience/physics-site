// "Science news" panel on the home page: <section id="news"> in index.html, filled from news/latest.json
// (written by tools/news/build.mjs). Shows the newest headline; "more" after it opens the summary,
// its topics, Previous/Next and the link to all the news. If the file can't be loaded, the panel stays hidden and the joke fills the row.
(function () {
  const box = document.getElementById('news');
  if (!box) return;
  const root = document.body.dataset.root || '';
  const $ = (sel) => box.querySelector(sel);
  const dateText = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const possessive = (name) => (/s$/.test(name) ? `${name}’` : `${name}’s`);
  const topics = new Map((window.SYLLABUS || []).flatMap((t) => t.topics.map((s) => [s.id, s])));

  fetch(root + 'news/latest.json')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
    .then(start)
    .catch(() => { /* no news: the panel stays hidden */ });

  function start(data) {
    const stories = (data.stories || []).filter((s) => data.categories[s.category]);
    if (!stories.length) return;
    let i = 0;
    const more = $('.news-more');
    const toggle = $('.news-toggle');
    const nav = $('.news-nav');

    function show() {
      const s = stories[i];
      const cat = data.categories[s.category];
      $('.news-icon').innerHTML = cat.icon;
      $('.cat-label').textContent = cat.label;
      const link = $('.news-headline a');
      link.href = s.url;
      link.textContent = s.title;
      const hint = document.createElement('span');
      hint.className = 'visually-hidden';
      hint.textContent = ` (opens ${possessive(s.source)} article in a new tab)`;
      link.append(hint);
      // A publisher's own short description is quoted word for word (same wording as tools/news/build.mjs).
      const quoted = s.summaryOrigin === 'publisher';
      $('.news-summary').textContent = quoted ? `“${s.summary}”` : s.summary;
      $('.news-ai').textContent = quoted ? `Description quoted from ${s.source}.`
        : `Summary written automatically with AI, from ${possessive(s.source)} article.`;
      $('.news-meta').textContent = `${s.source} · ${dateText(s.publishedAt)}`;
      const t = $('.news-topics');
      t.textContent = 'In the course: ';
      s.topics.forEach((id, n) => {
        const info = topics.get(id);
        if (!info) return;
        if (n) t.append(', ');
        const a = document.createElement('a');
        a.href = root + 'themes/' + window.topicFile(id);
        a.textContent = `${id} ${info.title}`;
        t.append(a);
        if (info.hl) { const tag = document.createElement('span'); tag.className = 'tag hl'; tag.textContent = 'HL'; t.append(' ', tag); }
      });
      $('.news-count').textContent = `${i + 1} of ${stories.length}`;
      $('.news-prev').disabled = i === 0;
      $('.news-next').disabled = i === stories.length - 1;
    }

    // "more" / "less" after the headline opens and closes the story's details.
    toggle.addEventListener('click', () => {
      const open = more.hidden;
      more.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.firstChild.textContent = open ? 'less' : 'more';
    });
    nav.hidden = stories.length < 2;
    $('.news-prev').addEventListener('click', () => { if (i > 0) { i--; show(); } });
    $('.news-next').addEventListener('click', () => { if (i < stories.length - 1) { i++; show(); } });

    show();
    box.hidden = false;
  }
})();
