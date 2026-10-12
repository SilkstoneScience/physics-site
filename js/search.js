// Site search (search.html). Looks words up in search-index.json: every page's title and description, and each
// section heading with the key terms (bold words) in that section. Rebuild the index with `node tools/check.mjs --sitemap`.
(function () {
  const form = document.querySelector('.search-form');
  if (!form) return;
  const input = form.querySelector('input');
  const status = document.querySelector('.search-status');
  const list = document.querySelector('.search-results');
  const root = document.body.dataset.root || '';
  let docs = null;

  // Lower case, no accents, punctuation as spaces (dots kept, so "A.1" still matches).
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9.]+/g, ' ').trim();
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  fetch(root + 'search-index.json')
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      docs = [];
      data.pages.forEach(([url, title, desc]) => {
        docs.push({ url: root + url, title, page: '', text: desc, hl: false, f: [[norm(title), 4], [norm(desc), 1]] });
      });
      data.sections.forEach(([p, id, heading, terms, hl]) => {
        const [url, pageTitle] = data.pages[p];
        docs.push({ url: `${root}${url}#${id}`, title: heading, page: pageTitle, text: terms, hl: !!hl,
          f: [[norm(heading), 5], [norm(terms), 2], [norm(pageTitle), 1.5]] });
      });
      run();
    })
    .catch(() => { status.textContent = 'Sorry, the search list could not be loaded. Please try again in a moment.'; });

  function score(doc, words, phrase) {
    let total = 0;
    for (const w of words) {
      let best = 0;
      for (const [text, weight] of doc.f) {
        const i = text.indexOf(w);
        if (i < 0) continue;
        const atWordStart = i === 0 || text[i - 1] === ' ';
        best = Math.max(best, weight * (atWordStart ? 1.3 : 1));
      }
      if (!best) return 0; // every word must be found somewhere
      total += best;
    }
    if (phrase.includes(' ') && doc.f[0][0].includes(phrase)) total += 6;
    if (doc.f[0][0] === phrase) total += 4;
    return total;
  }

  // Wrap the words that matched in <mark>.
  function highlight(text, words) {
    let html = esc(text);
    for (const w of [...words].sort((a, b) => b.length - a.length)) {
      if (w.length < 2) continue;
      html = html.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![^<]*>)`, 'gi'), '<mark>$1</mark>');
    }
    return html;
  }

  // For a section, show only the key terms that mention a search word (up to four).
  function snippet(doc, words) {
    if (!doc.page) return doc.text;
    const terms = doc.text ? doc.text.split(' · ') : [];
    const hits = terms.filter((t) => words.some((w) => norm(t).includes(w)));
    return hits.slice(0, 4).join(' · ');
  }

  function run() {
    const q = input.value.trim();
    const phrase = norm(q);
    const words = phrase.split(' ').map((w) => w.replace(/^\.+|\.+$/g, '')).filter(Boolean);
    list.innerHTML = '';
    if (!docs) { status.textContent = q ? 'Loading…' : ''; return; }
    if (!words.length) {
      status.textContent = 'Type a word or two: a topic (projectile), a quantity (half-life) or a skill (uncertainty).';
      return;
    }
    const found = docs.map((d) => [score(d, words, phrase), d]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).slice(0, 40);
    status.textContent = found.length
      ? `${found.length === 40 ? 'The best 40' : found.length} result${found.length === 1 ? '' : 's'} for “${q}”`
      : `Nothing found for “${q}”. Try a shorter or different word, or browse the Themes page.`;
    list.innerHTML = found.map(([, d]) => {
      const snip = snippet(d, words);
      return `<li><a href="${esc(d.url)}">${highlight(d.title, words)}</a>${d.hl ? ' <span class="tag hl">HL</span>' : ''}
        ${d.page ? `<span class="search-page">${esc(d.page)}</span>` : '<span class="search-page">Whole page</span>'}
        ${snip ? `<span class="search-snip">${highlight(snip, words)}</span>` : ''}</li>`;
    }).join('');
  }

  // Keep the address up to date (?q=…), so a search can be shared or reopened with the Back button.
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const url = new URL(location.href);
      if (input.value.trim()) url.searchParams.set('q', input.value.trim()); else url.searchParams.delete('q');
      history.replaceState(null, '', url);
      run();
    }, 150);
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); clearTimeout(timer); run(); });

  input.value = new URLSearchParams(location.search).get('q') || '';
  run();
})();
